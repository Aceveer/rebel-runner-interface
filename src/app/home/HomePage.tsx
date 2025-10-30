'use client'

import { useEffect, useState } from 'react'
import { db, auth } from '@/app/lib/firebase'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import RequestCard from '@/components/RequestCard'
import Header from '@/components/Header'

const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID!

type Request = {
  id: string
  category: string
  typeOfShoe: string
  brand: string
  model: string
  colourCode?: string
  size: string
  quantity: number
  status: 'queued' | 'done'
  createdAt?: { seconds: number }
  claimedBy?: { uid: string; name?: string } | null
  notes?: string | null
  createdBy: { email: string }
}

export default function HomePage() {
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<'seller' | 'runner'>('seller')

  // 🔹 Auth listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUser(u))
    return () => unsub()
  }, [])

  // 🔹 Fetch requests live
  useEffect(() => {
    const q = query(
      collection(db, `stores/${STORE_ID}/requests`),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, snap => {
      const arr = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
      setRequests(arr)
    })
    return () => unsub()
  }, [])

  // 🔹 Mark as Done handler
  const markAsDone = async (reqId: string) => {
    if (!user) return
    const ref = doc(db, `stores/${STORE_ID}/requests/${reqId}`)
    const runner = {
      uid: user.uid,
      name: user.displayName || user.email,
    }
    await updateDoc(ref, {
      status: 'done',
      claimedBy: runner,
      completedAt: serverTimestamp(),
    })
  }

  const grouped = {
    queued: requests.filter(r => r.status === 'queued'),
    done: requests.filter(r => r.status === 'done'),
  }

  return (
    <main className="min-h-screen p-4">
      {/* ✅ Reusable Header */}
      <Header />

      {/* Role Tabs (stay here) */}
      <div className="flex gap-3 mb-5">
        {['seller', 'runner'].map(r => (
          <button
            key={r}
            onClick={() => setRole(r as 'seller' | 'runner')}
            className={`px-4 py-2 rounded-xl border transition ${
              role === r ? 'bg-black text-yellow-400' : 'hover:bg-yellow-400 hover:text-black'
            }`}
          >
            {r === 'seller' ? 'Seller View' : 'Runner View'}
          </button>
        ))}
      </div>

      {/* Queues */}
      <div className="flex flex-col gap-10">
        {(['queued', 'done'] as const).map(status => (
          <div key={status} className="flex flex-col">
            <h2 className="text-lg font-semibold mb-3 capitalize">
              {status === 'queued' ? `In Queue ${grouped.queued.length}` : `Done ${grouped.done.length}`}
            </h2>

            <div className="flex flex-row flex-wrap gap-4 overflow-x-auto pb-4 mx-1 align-middle">
              {grouped[status].length === 0 ? (
                <p className="text-sm text-zinc-500 italic">
                  No shoes {status === 'queued' ? 'in queue' : 'done yet'}.
                </p>
              ) : (
                grouped[status].map(r => (
                  <div key={r.id} className="shrink-0">
                    <RequestCard
                      category={r.category}
                      typeOfShoe={r.typeOfShoe}
                      brand={r.brand}
                      model={r.model}
                      colourCode={r.colourCode}
                      size={r.size}
                      quantity={r.quantity}
                      claimedBy={r.claimedBy}
                      notes={r.notes}
                      createdAt={r.createdAt}
                      createdBy={r.createdBy}
                      showAction={role === 'runner' && status === 'queued'}
                      onAction={() => markAsDone(r.id)}
                      role= {status}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Add Button */}
      {role === 'seller' && (
        <button
          onClick={() => router.push('/new-request')}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center rounded-full bg-black text-yellow-400 text-3xl font-bold shadow-lg hover:bg-yellow-500 hover:text-black transition-all duration-300"
          title="Add New Request"
        >
          +
        </button>
      )}
    </main>
  )
}
