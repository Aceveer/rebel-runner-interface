import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/app/lib/firebaseAdmin'
import { z } from 'zod'

const singleRequestSchema = z.object({
  storeId: z.string().optional().default(process.env.NEXT_PUBLIC_STORE_ID || 'REBEL-ADELAIDE'),
  category: z.enum(['Mens', 'Womens', 'Kids']),
  typeOfShoe: z.enum(["Running","Casual","Gym/Training","Raceday","Basketball","Cricket"]),
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
        typeOfShoe:data.typeOfShoe,
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

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const [, token] = authHeader.split(' ')
    if (!token)
      return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    // ✅ verify user
    const decoded = await adminAuth.verifyIdToken(token)

    // ✅ parse query params
    const { searchParams } = new URL(req.url)
    const statuses = searchParams.get('status')?.split(',') ?? ['queued', 'inProgress', 'done']
    const limit = Number(searchParams.get('limit') || 20)
    const storeId = process.env.NEXT_PUBLIC_STORE_ID || 'REBEL-ADELAIDE'

    // ✅ query Firestore
    const ref = adminDb.collection('stores').doc(storeId).collection('requests')
    const snapshot = await ref.where('status', 'in', statuses).limit(limit).get()

    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('GET /requests error', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch requests' },
      { status: 400 }
    )
  }
}
