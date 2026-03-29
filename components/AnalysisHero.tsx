'use client'

import { useState } from 'react'

interface AnalysisHeroProps {
  thumbnailUrl: string | null
  headline: string
  videoQuality: 'Good' | 'Fair' | 'Poor'
  qualityNotes: string
}

const qualityStyles: Record<string, string> = {
  Good: 'border-green-500/50 bg-green-500/10 text-green-400',
  Fair: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
  Poor: 'border-red-500/50 bg-red-500/10 text-red-400',
}

export default function AnalysisHero({
  thumbnailUrl,
  headline,
  videoQuality,
  qualityNotes,
}: AnalysisHeroProps) {
  const [showNotes, setShowNotes] = useState(false)

  return (
    <div className="space-y-4">
      {thumbnailUrl && (
        <div className="overflow-hidden bg-[#0A0A0A] border border-[#1A1A1A] aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="space-y-3">
        <p className="text-base text-white leading-relaxed">{headline}</p>

        <div>
          <button
            onClick={() => setShowNotes((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 border text-xs font-semibold transition-opacity hover:opacity-80 ${qualityStyles[videoQuality] ?? qualityStyles.Fair}`}
            aria-expanded={showNotes}
          >
            {videoQuality} Quality
            {qualityNotes && (
              <span aria-hidden="true">{showNotes ? '▴' : '▾'}</span>
            )}
          </button>

          {showNotes && qualityNotes && (
            <p className="mt-2 text-sm text-[#888888] leading-relaxed bg-[#0A0A0A] p-3 border border-[#1A1A1A]">
              {qualityNotes}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
