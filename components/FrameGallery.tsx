'use client'

import { useEffect, useState } from 'react'
import PoseOverlay from '@/components/PoseOverlay'
import AnnotationOverlay from '@/components/AnnotationOverlay'
import type { Landmark } from '@/lib/pose/types'

interface PoseFrame {
  frameIndex: number
  landmarks: Landmark[]
}

interface FrameGalleryProps {
  frameUrls: string[]
  poseFrames?: PoseFrame[]
  visibleSide?: 'left' | 'right' | 'frontal'
}

/** Check if an image is mostly black by sampling pixel brightness. */
function isFrameDark(img: HTMLImageElement, threshold = 15): boolean {
  const canvas = document.createElement('canvas')
  const size = 64 // downsample for speed
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)
  let totalBrightness = 0
  const pixelCount = size * size
  for (let i = 0; i < data.length; i += 4) {
    totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3
  }
  return totalBrightness / pixelCount < threshold
}

export default function FrameGallery({ frameUrls, poseFrames, visibleSide }: FrameGalleryProps) {
  const [selected, setSelected] = useState(0)
  const [showSkeleton, setShowSkeleton] = useState(true)

  // Skip leading dark/black frames
  useEffect(() => {
    let cancelled = false
    async function findFirstBrightFrame() {
      for (let i = 0; i < Math.min(frameUrls.length, 5); i++) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = frameUrls[i]
        await new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
        })
        if (cancelled) return
        if (!isFrameDark(img)) {
          if (i > 0) setSelected(i)
          return
        }
      }
    }
    findFirstBrightFrame()
    return () => { cancelled = true }
  }, [frameUrls])

  if (frameUrls.length === 0) return null

  const hasPose = poseFrames && poseFrames.length > 0
  const currentPose = hasPose ? poseFrames[selected] : null

  return (
    <div className="rounded-xl overflow-hidden bg-black border border-[#2A2A35]">
      {/* Main frame — fixed aspect ratio */}
      <div className="relative w-full aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frameUrls[selected]}
          alt={`Frame ${selected + 1}`}
          className="w-full h-full object-contain bg-black"
        />

        {/* Pose + annotation overlays with fade transition */}
        {currentPose && (
          <div className={`transition-opacity duration-300 ${showSkeleton ? 'opacity-100' : 'opacity-0'}`}>
            {visibleSide && (
              <AnnotationOverlay
                landmarks={currentPose.landmarks}
                visibleSide={visibleSide}
              />
            )}
            <PoseOverlay landmarks={currentPose.landmarks} />
          </div>
        )}

        {/* Frame counter — top-right */}
        {frameUrls.length > 1 && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded-lg text-xs text-[#9898A8] font-mono backdrop-blur-sm">
            {selected + 1} / {frameUrls.length}
          </span>
        )}

        {/* Overlay toggle — bottom-left corner */}
        {hasPose && (
          <button
            type="button"
            onClick={() => setShowSkeleton((v) => !v)}
            className={`absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-sm text-xs font-medium transition-colors ${
              showSkeleton
                ? 'bg-black/60 text-white border border-white/30'
                : 'bg-black/60 text-[#9898A8] border border-white/15'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <circle cx="12" cy="4" r="2" />
              <line x1="12" y1="6" x2="12" y2="14" />
              <line x1="8" y1="9" x2="16" y2="9" />
              <line x1="12" y1="14" x2="8" y2="20" />
              <line x1="12" y1="14" x2="16" y2="20" />
            </svg>
            {showSkeleton ? 'Hide overlay' : 'Show overlay'}
          </button>
        )}
      </div>

      {/* Slider to select frame */}
      {frameUrls.length > 1 && (
        <div className="px-3 py-2.5 bg-[#1A1A22] flex items-center gap-3 border-t border-[#2A2A35]">
          <input
            type="range"
            min={0}
            max={frameUrls.length - 1}
            value={selected}
            onChange={(e) => setSelected(Number(e.target.value))}
            className="flex-1 h-1.5 cursor-pointer"
            aria-label="Select frame"
          />
        </div>
      )}
    </div>
  )
}
