'use client'

import { SKELETON_CONNECTIONS, VISIBILITY_THRESHOLD } from '@/lib/pose/landmarks'
import type { Landmark } from '@/lib/pose/types'

interface PoseOverlayProps {
  landmarks: Landmark[]
}

export default function PoseOverlay({ landmarks }: PoseOverlayProps) {
  if (!landmarks || landmarks.length === 0) return null

  return (
    <svg
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300"
    >
      {/* Dark outline pass — drawn first, behind the bright lines */}
      {SKELETON_CONNECTIONS.map(([a, b], i) => {
        const la = landmarks[a]
        const lb = landmarks[b]
        if (!la || !lb) return null
        if (la.visibility < VISIBILITY_THRESHOLD || lb.visibility < VISIBILITY_THRESHOLD) return null

        return (
          <line
            key={`outline-${i}`}
            x1={la.x}
            y1={la.y}
            x2={lb.x}
            y2={lb.y}
            stroke="#000"
            strokeWidth={0.008}
            strokeLinecap="round"
            opacity={0.5}
          />
        )
      })}

      {/* Bright skeleton lines */}
      {SKELETON_CONNECTIONS.map(([a, b], i) => {
        const la = landmarks[a]
        const lb = landmarks[b]
        if (!la || !lb) return null
        if (la.visibility < VISIBILITY_THRESHOLD || lb.visibility < VISIBILITY_THRESHOLD) return null

        return (
          <line
            key={`line-${i}`}
            x1={la.x}
            y1={la.y}
            x2={lb.x}
            y2={lb.y}
            stroke="#4ade80"
            strokeWidth={0.005}
            strokeLinecap="round"
            opacity={0.9}
          />
        )
      })}

      {/* Joint circles with dark outline */}
      {landmarks.map((lm, i) => {
        if (lm.visibility < VISIBILITY_THRESHOLD) return null
        return (
          <circle
            key={i}
            cx={lm.x}
            cy={lm.y}
            r={0.007}
            fill="#22c55e"
            stroke="#000"
            strokeWidth={0.003}
            opacity={0.95}
          />
        )
      })}
    </svg>
  )
}
