'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/app/lib/firebase'
import { useRouter } from 'next/navigation'

export default function NewRequestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requests, setRequests] = useState([
    {
      category: 'Mens',
      typeOfShoe: 'Running',
      brand: '',
      model: '',
      colourCode: '',
      size: '',
      quantity: 1,
      customerTag: '',
      notes: ''
    },
  ])

  useEffect(() => {
  if (requests.length > 1) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
}, [requests.length])


  const addAnother = () =>
    setRequests([
      ...requests,
      {
        category: 'Mens',
        typeOfShoe: 'Running',
        brand: '',
        model: '',
        colourCode: '',
        size: '',
        quantity: 1,
        customerTag: '',
        notes: ''
      },
    ])

  const updateField = (index: number, field: string, value: string | number) => {
    const newReqs = [...requests]
    // @ts-ignore
    newReqs[index][field] = value
    setRequests(newReqs)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const user = auth.currentUser
      if (!user) throw new Error('Not signed in')

      const token = await user.getIdToken()
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requests), // array payload
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create request')
      }

      router.push('/home')
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex justify-center items-start p-4 ">
      <form
        onSubmit={handleSubmit}
        className=" rounded-2xl shadow-lg p-6 w-full max-w-2xl space-y-6 mt-6"
      >
        <h1 className="text-2xl font-semibold">New Shoe Request</h1>

        {requests.map((req, i) => (
          <div key={i} className="border rounded-2xl p-4 space-y-3 ">
            <h2 className="font-medium text-lg">Request {i + 1}</h2>
            <div className="grid grid-cols-2 gap-3">
              <select
                className="border p-3 rounded-x bg-black"
                value={req.category}
                onChange={e => updateField(i, 'category', e.target.value)}
              >
                <option>Mens</option>
                <option>Womens</option>
                <option>Kids</option>
              </select>

            {/* NEW: Shoe Type */}
            <select
                className="border p-3 rounded-xl bg-black"
                value={req.typeOfShoe || 'Running'}
                onChange={e => updateField(i, 'typeOfShoe', e.target.value)}
            >
                <option>Running</option>
                <option>Gym/Training</option>
                <option>Casual</option>
                <option>Raceday</option>
                <option>Basketball</option>
                <option>Cricket</option>
            </select>

              <input
                className="border p-3 rounded-xl"
                placeholder="Brand"
                value={req.brand}
                onChange={e => updateField(i, 'brand', e.target.value)}
              />
              <input
                className="border p-3 rounded-xl col-span-2"
                placeholder="Model"
                value={req.model}
                onChange={e => updateField(i, 'model', e.target.value)}
              />
              <input
                className="border p-3 rounded-xl"
                placeholder="Colour Code"
                value={req.colourCode}
                onChange={e => updateField(i, 'colourCode', e.target.value)}
              />
              <input
                className="border p-3 rounded-xl"
                placeholder="Size (e.g. US 10)"
                value={req.size}
                onChange={e => updateField(i, 'size', e.target.value)}
              />
              <input
                type="number"
                className="border p-3 rounded-xl"
                placeholder="Qty"
                value={req.quantity}
                onChange={e => updateField(i, 'quantity', parseInt(e.target.value))}
              />
              <input
                className="border p-3 rounded-xl col-span-2"
                placeholder="Notes (optional)"
                value={req.notes}
                onChange={e => updateField(i, 'notes', e.target.value)}
              />
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={addAnother}
            className="text-sm text-yellow-600 font-medium"
          >
            + Add another shoe
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-yellow-400 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/home')}
          className="w-full mt-3 border py-2 rounded-xl"
        >
          Cancel
        </button>
      </form>
    </main>
  )
}
