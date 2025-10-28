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
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useRouter } from 'next/navigation'
import RequestCard from '@/components/RequestCard'
import { handleLogout } from '@/utils/logout'

const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID!

type Request = {
  id: string
  category: string
  typeOfShoe:string
  brand: string
  model: string
  colourCode?: string
  size: string
  quantity: number
  status: 'queued' | 'inProgress' | 'done'
  customerTag?: string
  createdBy?: { uid: string; name?: string }
  claimedBy?: { uid: string; name?: string } | null
}

export default function HomePage() {
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<'seller' | 'runner'>('seller')

  // 🔹 listen for auth
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUser(u))
    return () => unsub()
  }, [])

  // 🔹 fetch live requests
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

  // 🔹 fetch activeRole from Firestore user doc
  useEffect(() => {
    if (!user) return
    import('firebase/firestore').then(async ({ doc, getDoc }) => {
      const ref = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        setRole(snap.data().activeRole)
      }
    })
  }, [user])

  // 🔹 drag handler (only runners)
  const onDragEnd = async (result: any) => {
    if (!result.destination || role !== 'runner') return
    const { draggableId, destination, source } = result
    const newStatus = destination.droppableId as Request['status']
    if (source.droppableId === newStatus) return

    const ref = doc(db, `stores/${STORE_ID}/requests/${draggableId}`)
    const runner = {
      uid: user.uid,
      name: user.displayName || user.email,
    }
    const updates: any = { status: newStatus }

    if (newStatus === 'inProgress') {
      updates.claimedBy = runner
      updates.claimedAt = serverTimestamp()
    }
    if (newStatus === 'done') updates.completedAt = serverTimestamp()

    await updateDoc(ref, updates)
  }

  const grouped = {
    queued: requests.filter(r => r.status === 'queued'),
    inProgress: requests.filter(r => r.status === 'inProgress'),
    done: requests.filter(r => r.status === 'done'),
  }

  return (
    <main className="min-h-screen  p-4">


        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Footwear Queue</h1>

          <div className="flex gap-3 items-center">
            {role === 'seller' && (
              <button
                onClick={() => router.push('/new-request')}
                className="bg-black text-yellow-400 px-4 py-2 rounded-xl font-medium"
              >
                + Add Request
              </button>
            )}

            <button
              onClick={async () => {
                await handleLogout()
                router.replace('/login')
              }}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-red-600"
            >
              Logout
            </button>
          </div>
        </header>

      {/* role tabs */}
      <div className="flex gap-3 mb-5">
        {['seller', 'runner'].map(r => (
          <button
            key={r}
            onClick={() => setRole(r as 'seller' | 'runner')}
            className={`px-4 py-2 rounded-xl border ${
              role === r ? 'bg-black text-yellow-400' : ''
            }`}
          >
            {r === 'seller' ? 'Seller View' : 'Runner View'}
          </button>
        ))}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid md:grid-cols-3 gap-4">
          {(['queued', 'inProgress', 'done'] as const).map(status => (
            <Droppable droppableId={status} key={status}>
              {provided => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className=" rounded-2xl shadow-sm p-4 min-h-[60vh]"
                >
                  <h2 className="text-lg font-semibold mb-3 capitalize">
                    {status === 'inProgress' ? 'In Progress' : status}
                  </h2>
                  {grouped[status].map((r, index) => (
                    <Draggable
                      key={r.id}
                      draggableId={r.id}
                      index={index}
                      isDragDisabled={role !== 'runner'}
                    >
                      {drag => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          {...drag.dragHandleProps}
                          className={role === 'runner' ? 'cursor-grab' : ''}
                        >
                          <RequestCard
                            category={r.category}
                            typeOfShoe={r.typeOfShoe}
                            brand={r.brand}
                            model={r.model}
                            colourCode={r.colourCode}
                            size={r.size}
                            quantity={r.quantity}
                            customerTag={r.customerTag}
                            claimedBy={r.claimedBy}
                            // notes={r.notes}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </main>
  )
}
