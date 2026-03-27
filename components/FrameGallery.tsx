'use client'

import { useState } from 'react'
import PoseOverlay from '@/components/PoseOverlay'
import type { Landmark } from '@/lib/pose/types'

interface PoseFrame {
  frameIndex: number
  landmarks: Landmark[]
}

interface FrameGalleryProps {
  frameUrls: string[]
  poseFrames?: PoseFrame[]
}

export default function FrameGallery({ frameUrls, poseFrames }: FrameGalleryProps) {
  const [selected, setSelected] = useState(0)
  const [showSkeleton, setShowSkeleton] = useState(true)

  if (frameUrls.length === 0) return null

  const hasPose = poseFrames && poseFrames.length > 0
  const currentPose = hasPose ? poseFrames[selected] : null

  return (
    <div className="flex gap-2 rounded-xl overflow-hidden bg-gray-800">
      {/* Main frame */}
      <div className="relative flex-1 min-w-0 aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frameUrls[selected]}
          alt={`Frame ${selected + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Pose overlay with fade transition */}
        {currentPose && (
          <div className={`transition-opacity duration-300 ${showSkeleton ? 'opacity-100' : 'opacity-0'}`}>
            <PoseOverlay landmarks={currentPose.landmarks} />
          </div>
        )}

        {/* Overlay toggle — bottom-left corner */}
        {hasPose && (
          <button
            type="button"
            onClick={() => setShowSkeleton((v) => !v)}
            className={`absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md backdrop-blur-sm text-xs font-medium transition-colors ${
              showSkeleton
                ? 'bg-green-500/25 text-green-300 border border-green-500/50'
                : 'bg-black/50 text-gray-300 border border-white/15'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <circle cx="12" cy="4" r="2" />
              <line x1="12" y1="6" x2="12" y2="14" />
              <line x1="8" y1="9" x2="16" y2="9" />
              <line x1="12" y1="14" x2="8" y2="20" />
              <line x1="12" y1="14" x2="16" y2="20" />
            </svg>
            {showSkeleton ? 'Hide skeleton' : 'Show skeleton'}
          </button>
        )}
      </div>

      {/* Vertical thumbnail strip */}
      {frameUrls.length > 1 && (
        <div className="w-14 flex flex-col gap-1 overflow-y-auto p-1 bg-gray-900/60">
          {frameUrls.map((url, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`flex-shrink-0 rounded overflow-hidden border-2 transition-colors ${
                i === selected ? 'border-blue-500' : 'border-transparent'
              }`}
              aria-label={`Frame ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Thumbnail ${i + 1}`}
                className="w-full aspect-video object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
