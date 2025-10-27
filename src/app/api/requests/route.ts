import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/app/lib/firebaseAdmin'
import { z } from 'zod'

const singleRequestSchema = z.object({
  storeId: z.string().optional().default(process.env.NEXT_PUBLIC_STORE_ID || 'REBEL-ADELAIDE'),
  category: z.enum(['Mens', 'Womens', 'Kids']),
  brand: z.string().min(1),
  model: z.string().min(1),
  colourCode: z.string().optional().default(''),
  size: z.string().min(1),
  quantity: z.number().int().min(1).max(10).default(1),
  customerTag: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
})

// allow array OR single object
const bodySchema = z.union([singleRequestSchema, z.array(singleRequestSchema)])

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const [, token] = authHeader.split(' ')
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    const decoded = await adminAuth.verifyIdToken(token)
    const body = await req.json()
    const parsed = bodySchema.parse(body)
    const now = new Date()

    const requests = Array.isArray(parsed) ? parsed : [parsed]

    const batch = adminDb.batch()
    const resultIds: string[] = []

    for (const data of requests) {
      const docRef = adminDb
        .collection('stores')
        .doc(data.storeId || process.env.NEXT_PUBLIC_STORE_ID!)
        .collection('requests')
        .doc()
      const doc = {
        createdAt: now,
        createdBy: { uid: decoded.uid, displayName: decoded.name ?? null, email: decoded.email ?? null },
        status: 'queued' as const,
        ticketNo: `RB-${Math.floor(1000 + Math.random() * 9000)}`,
        category: data.category,
        brand: data.brand.trim(),
        model: data.model.trim(),
        colourCode: (data.colourCode ?? '').trim(),
        size: data.size.trim(),
        quantity: data.quantity,
        customerTag: data.customerTag || null,
        notes: data.notes || null,
        barcode: data.barcode || null,
      }
      batch.set(docRef, doc)
      resultIds.push(docRef.id)
    }

    await batch.commit()
    return NextResponse.json({ ids: resultIds }, { status: 201 })
  } catch (err: any) {
    const message = err?.message || 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

const querySchema = z.object({
  storeId: z.string().optional().default(process.env.NEXT_PUBLIC_STORE_ID || 'REBEL-ADELAIDE'),
  // comma-separated, e.g. status=queued,claimed
  status: z.string().optional(),
  customerTag: z.string().optional(),
  createdByUid: z.string().optional(),
  claimedByUid: z.string().optional(),

  // ISO date or millis
  since: z.string().optional(), // createdAt >= since
  until: z.string().optional(), // createdAt <= until

  // pagination/lightweight
  limit: z.string().transform(v => (v ? parseInt(v, 10) : 25)).optional(),
  // for simple paging with createdAt: pass a millis timestamp or ISO string
  after: z.string().optional(), // startAfter(createdAt)

  order: z.enum(['asc','desc']).optional().default('desc'),
})

export async function GET(req: Request) {
  try {
    // Verify auth
    const authHeader = req.headers.get('authorization') || ''
    const [, token] = authHeader.split(' ')
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })
    await adminAuth.verifyIdToken(token)

    // Parse & validate query
    const url = new URL(req.url)
    const params = Object.fromEntries(url.searchParams.entries())
    const q = querySchema.parse(params)

    const storeRef = adminDb.collection('stores').doc(q.storeId!)
    let col: FirebaseFirestore.Query = storeRef.collection('requests')

    // Filters
    if (q.status) {
      const statuses = q.status.split(',').map(s => s.trim()).filter(Boolean)
      if (statuses.length === 1) {
        col = col.where('status', '==', statuses[0])
      } else if (statuses.length > 1 && statuses.length <= 10) {
        col = col.where('status', 'in', statuses.slice(0, 10))
      }
    }
    if (q.customerTag) col = col.where('customerTag', '==', q.customerTag)
    if (q.createdByUid) col = col.where('createdBy.uid', '==', q.createdByUid)
    if (q.claimedByUid) col = col.where('claimedBy.uid', '==', q.claimedByUid)

    // Date range + ordering (must orderBy the same field for range filters)
    col = col.orderBy('createdAt', (q.order as 'asc'|'desc') ?? 'desc')

    if (q.since) {
      const since = isNaN(Number(q.since)) ? new Date(q.since) : new Date(Number(q.since))
      col = col.where('createdAt', '>=', since)
    }
    if (q.until) {
      const until = isNaN(Number(q.until)) ? new Date(q.until) : new Date(Number(q.until))
      col = col.where('createdAt', '<=', until)
    }
    if (q.after) {
      const after = isNaN(Number(q.after)) ? new Date(q.after) : new Date(Number(q.after))
      col = col.startAfter(after)
    }

    const pageSize = Math.min(Math.max(q.limit ?? 25, 1), 100)
    col = col.limit(pageSize)

    const snap = await col.get()
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Simple cursor: client can pass `after` with the last item’s createdAt
    const last = snap.docs[snap.docs.length - 1]
    const nextAfter = last?.get('createdAt')?.toMillis?.() ?? null

    return NextResponse.json({ items, nextAfter }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch' }, { status: 400 })
  }
}