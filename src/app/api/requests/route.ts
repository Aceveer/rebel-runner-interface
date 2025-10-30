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
  notes: z.string().optional().nullable(),
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
        notes: data.notes || null,
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
    const statuses = searchParams.get('status')?.split(',') ?? ['queued', 'done']
    const limit = Number(searchParams.get('limit') || 50)
    const storeId = process.env.NEXT_PUBLIC_STORE_ID || 'REBEL-ADELAIDE'

    const ref = adminDb
      .collection('stores')
      .doc(storeId)
      .collection('requests')

    const snapshot = await ref.where('status', 'in', statuses).limit(limit).get()
    const now = Date.now()

    const freshData: any[] = []
    const batch = adminDb.batch()
    let deletedCount = 0

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data()
      const createdAt = data.createdAt?._seconds || data.createdAt?.seconds
      const diffHrs = createdAt ? (now - createdAt * 1000) / 3600000 : 0

      if (diffHrs >= 24) {
        // mark for deletion
        batch.delete(docSnap.ref)
        deletedCount++
      } else {
        freshData.push({ id: docSnap.id, ...data })
      }
    })

    if (deletedCount > 0) await batch.commit()

    return NextResponse.json({
      deletedCount,
      count: freshData.length,
      data: freshData,
    })
  } catch (err: any) {
    console.error('GET /requests error', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch requests' },
      { status: 400 }
    )
  }
}

