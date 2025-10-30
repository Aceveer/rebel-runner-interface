'use client'

import React, { useEffect, useState } from 'react'

type RequestCardProps = {
  category: string
  typeOfShoe: string
  brand: string
  model: string
  colourCode?: string
  size: string
  quantity: number
  claimedBy?: { name?: string } | null
  notes?: string | null
  createdAt?: { seconds: number }
  showAction?: boolean
  onAction?: () => void
}

export default function RequestCard({
  category,
  typeOfShoe,
  brand,
  model,
  colourCode,
  size,
  quantity,
  claimedBy,
  notes,
  createdAt,
  showAction = false,
  onAction,
}: RequestCardProps) {
  const categoryInitial = category?.[0]?.toUpperCase() ?? '?'
  const [elapsed, setElapsed] = useState<string>('')

  // 🕒 Timer
  useEffect(() => {
    if (!createdAt?.seconds) return
    const start = createdAt.seconds * 1000

    const update = () => {
      const now = Date.now()
      const diffMs = now - start
      const mins = Math.floor(diffMs / 60000)
      const secs = Math.floor((diffMs % 60000) / 1000)
      setElapsed(`${mins}m ${secs}s`)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [createdAt])

  return (
    <div className="flex sm:w-[280px] md:w-lg border rounded-2xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition align-middle self-center ">
      
      {/* Left side (Category section) */}
      <div className="flex flex-col items-center justify-center w-16 md:w-24 rounded-l-2xl bg-zinc-800 p-2 border-r">
        <span className="text-4xl font-bold text-black dark:text-yellow-400">
          {categoryInitial}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-center mt-1">
          {typeOfShoe}
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-col justify-between flex-1 p-3 rounded-r-2xl">
        {/* Top Row */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="font-semibold text-sm md:text-base">{brand}</span>
            <span className="text-xs md:text-sm text-zinc-600">{model}</span>
            <span className="text-[10px] md:text-xs text-zinc-500">{colourCode || '—'}</span>
          </div>

        {/* Middle: Timer */}
        <div className="flex justify-center mt-2 align-middle">
          {elapsed && (
            <span className="text-xs text-blue-600 font-mono">{elapsed}</span>
          )}
        </div>

          <div className="text-right">
            <p className="font-semibold text-sm md:text-base">Size {size}</p>
            <p className="text-xs md:text-sm text-zinc-500">Qty {quantity}</p>
          </div>
        </div>



        {/* Bottom: Notes + Runner + Action */}
        <div className="mt-3 border-t pt-2 flex justify-between items-center text-xs text-zinc-600">
          <div className="flex flex-col">
            <span>{notes || 'No additional notes'}</span>
            {claimedBy?.name && (
              <span className="text-amber-700 mt-1">Runner: {claimedBy.name.split('@')[0]}</span>
            )}
          </div>

          {showAction && (
            <button
              onClick={onAction}
              className="bg-yellow-400 text-black text-xs font-semibold px-3 py-1 rounded-lg hover:bg-yellow-500 transition ml-2"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
