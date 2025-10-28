'use client'

import React from 'react'

type RequestCardProps = {
  category: string
  typeOfShoe: string
  brand: string
  model: string
  colourCode?: string
  size: string
  quantity: number
  customerTag?: string
  claimedBy?: { name?: string } | null
  notes?: string | null
}

export default function RequestCard({
  category,
  typeOfShoe,
  brand,
  model,
  colourCode,
  size,
  quantity,
  customerTag,
  claimedBy,
  notes,
}: RequestCardProps) {
  const categoryInitial = category?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex border rounded-xl mb-3 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition">
      {/* Left side — Category block */}
      <div className="flex flex-col items-center justify-center w-20 border-r bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl">
        <span className="text-3xl font-bold text-black dark:text-yellow-400">
          {categoryInitial}
        </span>
        <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {typeOfShoe}
        </span>
      </div>

      {/* Right side — Main content */}
      <div className="flex flex-col justify-between w-full p-3">
        {/* Top row: brand / model / colour */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {brand}
            </span>
            <span className="text-sm text-zinc-600 dark:text-zinc-300">
              {model}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {colourCode || '—'}
            </span>
          </div>
          {/* Size and quantity */}
          <div className="text-right">
            <p className="font-semibold text-zinc-800 dark:text-zinc-100">
              Size {size}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Qty {quantity}
            </p>
          </div>
        </div>

        {/* Middle line: type & optional customer tag */}
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-zinc-500 italic">
            {typeOfShoe}
          </span>
          {customerTag && (
            <span className="text-xs text-zinc-600">Tag: {customerTag}</span>
          )}
        </div>

        {/* Bottom line: notes / claimedBy */}
        <div className="mt-2 border-t pt-2 text-xs text-zinc-500 dark:text-zinc-400 flex justify-between">
          <span>{notes || 'No additional notes'}</span>
          {claimedBy?.name && (
            <span className="text-amber-700">Runner: {claimedBy.name}</span>
          )}
        </div>
      </div>
    </div>
  )
}
