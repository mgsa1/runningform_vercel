import type {
  FramePoseData,
  GaitPhase,
  GaitAnalysisResult,
  FootStrikeType,
  FootStrikeResult,
  Side,
  Confidence,
} from './types'

export type { GaitAnalysisResult }
import {
  VISIBILITY_THRESHOLD,
  LEFT_ANKLE, RIGHT_ANKLE,
  LEFT_HIP, RIGHT_HIP,
  LEFT_KNEE, RIGHT_KNEE,
  LEFT_FOOT_INDEX, RIGHT_FOOT_INDEX,
  LEFT_HEEL, RIGHT_HEEL,
} from './landmarks'
import { midpoint } from './geometry'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Simple moving average smoother. */
function smooth(values: number[], windowSize: number): number[] {
  const half = Math.floor(windowSize / 2)
  return values.map((_, i) => {
    let sum = 0
    let count = 0
    for (let j = Math.max(0, i - half); j <= Math.min(values.length - 1, i + half); j++) {
      sum += values[j]
      count++
    }
    return sum / count
  })
}

/** Find local minima indices in an array. */
function findLocalMinima(values: number[], minProminence: number = 0): number[] {
  const minima: number[] = []
  for (let i = 1; i < values.length - 1; i++) {
    if (values[i] < values[i - 1] && values[i] < values[i + 1]) {
      // Check prominence: the min of the two surrounding peaks minus this valley
      let leftMax = values[i]
      for (let j = i - 1; j >= 0; j--) {
        leftMax = Math.max(leftMax, values[j])
        if (values[j] < values[i]) break
      }
      let rightMax = values[i]
      for (let j = i + 1; j < values.length; j++) {
        rightMax = Math.max(rightMax, values[j])
        if (values[j] < values[i]) break
      }
      const prominence = Math.min(leftMax, rightMax) - values[i]
      if (prominence >= minProminence) {
        minima.push(i)
      }
    }
  }
  return minima
}

/** Find local maxima indices in an array. */
function findLocalMaxima(values: number[], minProminence: number = 0): number[] {
  const inverted = values.map((v) => -v)
  return findLocalMinima(inverted, minProminence)
}

// ─── Side selection helpers ──────────────────────────────────────────────────

interface SideLandmarks {
  ankle: number
  hip: number
  knee: number
  footIndex: number
  heel: number
}

function getLandmarksForSide(side: Side): SideLandmarks {
  return side === 'left'
    ? { ankle: LEFT_ANKLE, hip: LEFT_HIP, knee: LEFT_KNEE, footIndex: LEFT_FOOT_INDEX, heel: LEFT_HEEL }
    : { ankle: RIGHT_ANKLE, hip: RIGHT_HIP, knee: RIGHT_KNEE, footIndex: RIGHT_FOOT_INDEX, heel: RIGHT_HEEL }
}

function isLandmarkVisible(frame: FramePoseData, idx: number): boolean {
  return (frame.landmarks[idx]?.visibility ?? 0) >= VISIBILITY_THRESHOLD
}

// ─── Core gait analysis ──────────────────────────────────────────────────────

/**
 * Analyze the gait cycle from pose data.
 *
 * Algorithm:
 * 1. Extract ankle Y positions for the visible side across all frames
 * 2. Smooth the trajectory with a moving average
 * 3. Find local minima → ground contact frames
 * 4. Find local maxima → mid-swing frames
 * 5. Derive midstance and toe-off from transitions between contacts
 * 6. Validate contacts: ankle must be below hip midpoint
 */
export function analyzeGait(
  frames: FramePoseData[],
  visibleSide: Side | 'frontal'
): GaitAnalysisResult {
  const side: Side = visibleSide === 'frontal' ? 'left' : visibleSide
  const landmarks = getLandmarksForSide(side)

  // Extract ankle Y trajectory (only frames where ankle is visible)
  const ankleYValues: { frameIdx: number; y: number; timestamp: number }[] = []
  for (const frame of frames) {
    if (isLandmarkVisible(frame, landmarks.ankle) && isLandmarkVisible(frame, landmarks.hip)) {
      const ankleY = frame.landmarks[landmarks.ankle].y
      ankleYValues.push({
        frameIdx: frame.frameIndex,
        y: ankleY,
        timestamp: frame.timestamp,
      })
    }
  }

  if (ankleYValues.length < 6) {
    return emptyResult(visibleSide)
  }

  // Smooth the ankle Y trajectory
  const rawY = ankleYValues.map((v) => v.y)
  const smoothedY = smooth(rawY, 3)

  // Estimate minimum prominence for peak detection:
  // the ankle Y range should be at least a fraction of the body for valid gait
  const yRange = Math.max(...smoothedY) - Math.min(...smoothedY)
  const minProminence = yRange * 0.15

  // Ground contacts = local minima in ankle Y (ankle at lowest point = closest to ground)
  // Note: Y increases downward in screen coords, so minima in Y would be highest point.
  // BUT for running, the ankle is LOWEST (highest Y value) when on the ground.
  // So ground contacts = local MAXIMA in ankle Y.
  const contactLocalIndices = findLocalMaxima(smoothedY, minProminence)

  // Mid-swing = local minima in ankle Y (ankle at highest point off ground = lowest Y value)
  const swingLocalIndices = findLocalMinima(smoothedY, minProminence)

  // Map local indices back to frame indices
  const contactFrameIndices = contactLocalIndices.map((i) => ankleYValues[i].frameIdx)
  const swingFrameIndices = swingLocalIndices.map((i) => ankleYValues[i].frameIdx)

  // Validate contacts: ankle must be below hip
  const validatedContacts = contactFrameIndices.filter((fi) => {
    const frame = frames.find((f) => f.frameIndex === fi)
    if (!frame) return false
    const ankleY = frame.landmarks[landmarks.ankle].y
    const hipMid = midpoint(frame.landmarks[LEFT_HIP], frame.landmarks[RIGHT_HIP])
    return ankleY > hipMid.y // ankle below hip in screen coords
  })

  // Build gait phases
  const phases: GaitPhase[] = []

  for (const fi of validatedContacts) {
    const frame = frames.find((f) => f.frameIndex === fi)
    if (!frame) continue
    phases.push({
      frameIndex: fi,
      timestamp: frame.timestamp,
      phase: 'initial_contact',
      side,
      confidence: frame.landmarks[landmarks.ankle].visibility,
    })
  }

  for (const fi of swingFrameIndices) {
    const frame = frames.find((f) => f.frameIndex === fi)
    if (!frame) continue
    phases.push({
      frameIndex: fi,
      timestamp: frame.timestamp,
      phase: 'mid_swing',
      side,
      confidence: frame.landmarks[landmarks.ankle].visibility,
    })
  }

  // Derive midstance: midpoint between contact and next swing
  for (let i = 0; i < validatedContacts.length; i++) {
    const contactFi = validatedContacts[i]
    // Find the next swing after this contact
    const nextSwing = swingFrameIndices.find((fi) => fi > contactFi)
    if (nextSwing !== undefined) {
      const midFi = Math.round((contactFi + nextSwing) / 2)
      const frame = frames.find((f) => f.frameIndex === midFi) ??
        frames.reduce((best, f) =>
          Math.abs(f.frameIndex - midFi) < Math.abs(best.frameIndex - midFi) ? f : best
        )
      if (frame) {
        phases.push({
          frameIndex: frame.frameIndex,
          timestamp: frame.timestamp,
          phase: 'midstance',
          side,
          confidence: 0.7, // derived, not directly detected
        })
      }
    }
  }

  // Derive toe-off: just before swing begins (between contact and swing, closer to swing)
  for (let i = 0; i < validatedContacts.length; i++) {
    const contactFi = validatedContacts[i]
    const nextSwing = swingFrameIndices.find((fi) => fi > contactFi)
    if (nextSwing !== undefined) {
      const toeOffFi = Math.round(contactFi + (nextSwing - contactFi) * 0.7)
      const frame = frames.find((f) => f.frameIndex === toeOffFi) ??
        frames.reduce((best, f) =>
          Math.abs(f.frameIndex - toeOffFi) < Math.abs(best.frameIndex - toeOffFi) ? f : best
        )
      if (frame) {
        phases.push({
          frameIndex: frame.frameIndex,
          timestamp: frame.timestamp,
          phase: 'toe_off',
          side,
          confidence: 0.6,
        })
      }
    }
  }

  // Compute stride times (time between consecutive contacts on same side)
  const strideTimes: number[] = []
  const contactTimestamps = validatedContacts.map(
    (fi) => frames.find((f) => f.frameIndex === fi)?.timestamp ?? 0
  )
  for (let i = 1; i < contactTimestamps.length; i++) {
    strideTimes.push(contactTimestamps[i] - contactTimestamps[i - 1])
  }

  const gaitCycles = Math.max(0, validatedContacts.length - 1)

  // Sort phases by frame index
  phases.sort((a, b) => a.frameIndex - b.frameIndex)

  // Toe-off frame indices for export
  const toeOffFrameIndices = phases
    .filter((p) => p.phase === 'toe_off')
    .map((p) => p.frameIndex)

  return {
    phases,
    contactFrameIndices: validatedContacts,
    toeOffFrameIndices,
    gaitCyclesDetected: gaitCycles,
    visibleSide: visibleSide === 'frontal' ? 'frontal' : side,
    strideTimes,
  }
}

function emptyResult(visibleSide: Side | 'frontal'): GaitAnalysisResult {
  return {
    phases: [],
    contactFrameIndices: [],
    toeOffFrameIndices: [],
    gaitCyclesDetected: 0,
    visibleSide,
    strideTimes: [],
  }
}

// ─── Foot strike type classification ─────────────────────────────────────────

/**
 * Classify foot strike type at each ground contact frame.
 *
 * At initial contact, compare the horizontal position of the ankle vs the toe tip:
 * - If toe is significantly ahead of ankle → forefoot/midfoot strike
 * - If ankle is ahead of toe → heel strike
 *
 * This uses the henryczup approach adapted for our landmark set.
 */
export function classifyFootStrike(
  frames: FramePoseData[],
  contactFrameIndices: number[],
  visibleSide: Side
): FootStrikeResult | null {
  const lm = getLandmarksForSide(visibleSide)
  const classifications: FootStrikeType[] = []

  for (const fi of contactFrameIndices) {
    const frame = frames.find((f) => f.frameIndex === fi)
    if (!frame) continue

    const ankle = frame.landmarks[lm.ankle]
    const toe = frame.landmarks[lm.footIndex]
    const heel = frame.landmarks[lm.heel]

    if (
      !ankle || !toe || !heel ||
      ankle.visibility < VISIBILITY_THRESHOLD ||
      toe.visibility < VISIBILITY_THRESHOLD
    ) continue

    // Compare heel Y vs toe Y at contact.
    // In screen coords, higher Y = lower position = closer to ground.
    // If heel.y > toe.y (heel is lower / more toward ground) → heel strike
    // If toe.y > heel.y → forefoot strike
    const heelToeDiffY = heel.y - toe.y

    if (heelToeDiffY > 0.005) {
      classifications.push('heel')
    } else if (heelToeDiffY < -0.005) {
      classifications.push('forefoot')
    } else {
      classifications.push('midfoot')
    }
  }

  if (classifications.length === 0) return null

  // Majority vote
  const counts: Record<FootStrikeType, number> = { heel: 0, midfoot: 0, forefoot: 0 }
  for (const c of classifications) counts[c]++

  const dominant = (Object.entries(counts) as [FootStrikeType, number][])
    .sort((a, b) => b[1] - a[1])[0][0]

  const agreement = counts[dominant] / classifications.length
  const confidence: Confidence =
    agreement > 0.8 && classifications.length >= 3 ? 'high' :
      agreement > 0.6 ? 'medium' : 'low'

  return {
    type: dominant,
    confidence,
    contactCount: classifications.length,
  }
}

// ─── Asymmetry detection (both sides from side view) ─────────────────────────

export interface AsymmetryResult {
  contactTimeDiffPercent: number | null  // % difference in stance duration
  footPlacementDiffPercent: number | null // % difference in foot placement
  samplesLeft: number
  samplesRight: number
}

/**
 * Compare left vs right side metrics when both are intermittently visible.
 * Even from a side view, the far leg is partially visible during swing phase.
 */
export function detectAsymmetry(
  frames: FramePoseData[],
  primaryGait: GaitAnalysisResult
): AsymmetryResult {
  // Attempt to detect contacts on the opposite side
  const oppositeSide: Side = primaryGait.visibleSide === 'left' ? 'right' :
    primaryGait.visibleSide === 'right' ? 'left' : 'right'

  const oppositeGait = analyzeGait(frames, oppositeSide)

  const result: AsymmetryResult = {
    contactTimeDiffPercent: null,
    footPlacementDiffPercent: null,
    samplesLeft: primaryGait.visibleSide === 'left' ? primaryGait.contactFrameIndices.length : oppositeGait.contactFrameIndices.length,
    samplesRight: primaryGait.visibleSide === 'right' ? primaryGait.contactFrameIndices.length : oppositeGait.contactFrameIndices.length,
  }

  // Need at least 2 contacts on each side for meaningful comparison
  if (primaryGait.strideTimes.length >= 1 && oppositeGait.strideTimes.length >= 1) {
    const primaryAvgStride = primaryGait.strideTimes.reduce((a, b) => a + b, 0) / primaryGait.strideTimes.length
    const oppositeAvgStride = oppositeGait.strideTimes.reduce((a, b) => a + b, 0) / oppositeGait.strideTimes.length
    const avg = (primaryAvgStride + oppositeAvgStride) / 2
    if (avg > 0) {
      result.contactTimeDiffPercent = Math.abs(primaryAvgStride - oppositeAvgStride) / avg * 100
    }
  }

  return result
}
