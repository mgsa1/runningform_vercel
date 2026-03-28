'use client'

import {
  VISIBILITY_THRESHOLD,
  LEFT_HIP,
  RIGHT_HIP,
  LEFT_ANKLE,
  RIGHT_ANKLE,
} from '@/lib/pose/landmarks'
import type { Landmark } from '@/lib/pose/types'

interface AnnotationOverlayProps {
  landmarks: Landmark[]
  visibleSide: 'left' | 'right' | 'frontal'
}

export default function AnnotationOverlay({ landmarks, visibleSide }: AnnotationOverlayProps) {
  if (!landmarks || landmarks.length === 0) return null

  const leftHip = landmarks[LEFT_HIP]
  const rightHip = landmarks[RIGHT_HIP]

  if (
    !leftHip ||
    !rightHip ||
    leftHip.visibility < VISIBILITY_THRESHOLD ||
    rightHip.visibility < VISIBILITY_THRESHOLD
  )
    return null

  const hipMidX = (leftHip.x + rightHip.x) / 2
  const hipMidY = (leftHip.y + rightHip.y) / 2

  const ankleIndex = visibleSide === 'left' ? LEFT_ANKLE : RIGHT_ANKLE
  const ankle = visibleSide !== 'frontal' ? landmarks[ankleIndex] : null
  const ankleVisible = ankle && ankle.visibility >= VISIBILITY_THRESHOLD

  // "Ahead" = foot lands in front of hip = overstriding direction
  // right-side view: runner moves left→right, ahead means ankle.x > hipMidX
  // left-side view: runner moves right→left, ahead means ankle.x < hipMidX
  let ankleColor = '#22c55e' // green = behind/under hip (good)
  if (ankleVisible && visibleSide !== 'frontal') {
    const isAhead = visibleSide === 'right' ? ankle!.x > hipMidX : ankle!.x < hipMidX
    if (isAhead) ankleColor = '#f59e0b' // amber = ahead of hip (overstriding)
  }

  return (
    <svg
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      {/* Vertical reference line from hip downward */}
      <line
        x1={hipMidX}
        y1={hipMidY}
        x2={hipMidX}
        y2={1.0}
        stroke="white"
        strokeWidth={0.004}
        strokeOpacity={0.5}
        strokeDasharray="0.02 0.015"
        strokeLinecap="round"
      />
      {/* Small horizontal tick at hip height */}
      <line
        x1={hipMidX - 0.015}
        y1={hipMidY}
        x2={hipMidX + 0.015}
        y2={hipMidY}
        stroke="white"
        strokeWidth={0.003}
        strokeOpacity={0.6}
      />
      {/* Ankle dot */}
      {ankleVisible && (
        <circle
          cx={ankle!.x}
          cy={ankle!.y}
          r={0.012}
          fill={ankleColor}
          fillOpacity={0.85}
          stroke="black"
          strokeWidth={0.003}
          strokeOpacity={0.5}
        />
      )}
    </svg>
  )
}
