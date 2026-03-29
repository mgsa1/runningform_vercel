'use client'

import { useState } from 'react'

interface RatingButtonsProps {
  resultId: string
  initialRating: number | null
}

export default function RatingButtons({ resultId, initialRating }: RatingButtonsProps) {
  const [selected, setSelected] = useState<1 | 5 | null>(
    initialRating === 1 || initialRating === 5 ? initialRating : null
  )
  const [saving, setSaving] = useState(false)

  async function rate(rating: 1 | 5) {
    if (saving || selected === rating) return
    setSaving(true)
    try {
      const res = await fetch(`/api/results/${resultId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      })
      if (res.ok) setSelected(rating)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-[#888888]">Was this analysis useful?</p>
      <div className="flex gap-2">
        <button
          onClick={() => rate(5)}
          disabled={saving}
          aria-label="Thumbs up — useful"
          className={`flex items-center gap-1.5 px-3 py-1.5 border text-sm font-medium transition-colors duration-100 disabled:opacity-50 ${
            selected === 5
              ? 'border-green-500 text-green-400'
              : 'border-[#1A1A1A] text-[#888888] hover:border-green-500 hover:text-green-400'
          }`}
        >
          Yes
        </button>
        <button
          onClick={() => rate(1)}
          disabled={saving}
          aria-label="Thumbs down — not useful"
          className={`flex items-center gap-1.5 px-3 py-1.5 border text-sm font-medium transition-colors duration-100 disabled:opacity-50 ${
            selected === 1
              ? 'border-red-500 text-red-400'
              : 'border-[#1A1A1A] text-[#888888] hover:border-red-500 hover:text-red-400'
          }`}
        >
          No
        </button>
      </div>
      {selected !== null && (
        <span className="text-xs text-[#444444]">
          {selected === 5 ? 'Thanks for the feedback!' : "Thanks — we'll improve."}
        </span>
      )}
    </div>
  )
}
