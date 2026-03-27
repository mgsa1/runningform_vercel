import type {
  FramePoseData,
  BiomechanicsReport,
  MeasuredMetric,
  TrunkLeanMetric,
  PaceTier,
  Confidence,
  LeanSource,
  Side,
} from './types'
import type { GaitAnalysisResult, AsymmetryResult } from './gait'
import {
  VISIBILITY_THRESHOLD,
  LEFT_SHOULDER, RIGHT_SHOULDER,
  LEFT_HIP, RIGHT_HIP,
  LEFT_ANKLE, RIGHT_ANKLE,
  LEFT_KNEE, RIGHT_KNEE,
} from './landmarks'
import { angleFromVertical, angleBetweenPoints, horizontalDistance, midpoint, distance, estimateBodyHeight } from './geometry'
import {
  FOOT_PLACEMENT_RANGES,
  TRUNK_LEAN_RANGES,
  VERTICAL_OSCILLATION_RANGES,
  assessMetric,
  assessAsymmetry,
} from './referenceRanges'
import { classifyFootStrike, detectAsymmetry } from './gait'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLandmarksForSide(side: Side) {
  return side === 'left'
    ? { ankle: LEFT_ANKLE, hip: LEFT_HIP, knee: LEFT_KNEE }
    : { ankle: RIGHT_ANKLE, hip: RIGHT_HIP, knee: RIGHT_KNEE }
}

function isVisible(frame: FramePoseData, ...indices: number[]): boolean {
  return indices.every(
    (idx) => (frame.landmarks[idx]?.visibility ?? 0) >= VISIBILITY_THRESHOLD
  )
}

function computeConfidence(sampleCount: number, gaitCycles: number): Confidence {
  if (sampleCount >= 3 && gaitCycles >= 2) return 'high'
  if (sampleCount >= 2) return 'medium'
  return 'low'
}

// ─── Foot placement relative to hip ──────────────────────────────────────────

function computeFootPlacement(
  frames: FramePoseData[],
  contactFrameIndices: number[],
  visibleSide: Side,
  paceTier: PaceTier,
  gaitCycles: number
): MeasuredMetric | null {
  const lm = getLandmarksForSide(visibleSide)
  const measurements: { value: number; frameIdx: number }[] = []

  for (const fi of contactFrameIndices) {
    const frame = frames.find((f) => f.frameIndex === fi)
    if (!frame) continue
    if (!isVisible(frame, lm.ankle, LEFT_HIP, RIGHT_HIP, LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_ANKLE, RIGHT_ANKLE)) continue

    const hipMid = midpoint(frame.landmarks[LEFT_HIP], frame.landmarks[RIGHT_HIP])
    const ankle = frame.landmarks[lm.ankle]
    const shoulderMid = midpoint(frame.landmarks[LEFT_SHOULDER], frame.landmarks[RIGHT_SHOULDER])
    const ankleMid = midpoint(frame.landmarks[LEFT_ANKLE], frame.landmarks[RIGHT_ANKLE])

    // Horizontal distance normalized by body height for camera-independence.
    // Raw MediaPipe coordinates are image-fraction values (0-1) and depend on
    // camera distance. Dividing by shoulder-to-ankle height cancels this out.
    const dist = Math.abs(horizontalDistance(hipMid, ankle))
    const bodyHeight = estimateBodyHeight(shoulderMid, ankleMid)

    if (bodyHeight > 0) {
      const pctBodyHeight = (dist / bodyHeight) * 100
      measurements.push({ value: pctBodyHeight, frameIdx: fi })
    }
  }

  if (measurements.length === 0) return null

  const avgValue = measurements.reduce((sum, m) => sum + m.value, 0) / measurements.length
  const { assessment, referenceRange } = assessMetric(avgValue, FOOT_PLACEMENT_RANGES, paceTier)

  return {
    value: Math.round(avgValue * 10) / 10,
    unit: '% body height',
    referenceRange,
    assessment,
    framesUsed: measurements.map((m) => m.frameIdx),
    confidence: computeConfidence(measurements.length, gaitCycles),
    paceContext: paceTier,
  }
}

// ─── Trunk lean ──────────────────────────────────────────────────────────────

function computeTrunkLean(
  frames: FramePoseData[],
  paceTier: PaceTier,
  gaitCycles: number
): TrunkLeanMetric | null {
  const measurements: { angle: number; leanSource: LeanSource; frameIdx: number }[] = []

  for (const frame of frames) {
    if (!isVisible(frame, LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP, LEFT_ANKLE, RIGHT_ANKLE)) {
      continue
    }

    const shoulderMid = midpoint(frame.landmarks[LEFT_SHOULDER], frame.landmarks[RIGHT_SHOULDER])
    const hipMid = midpoint(frame.landmarks[LEFT_HIP], frame.landmarks[RIGHT_HIP])
    const ankleMid = midpoint(frame.landmarks[LEFT_ANKLE], frame.landmarks[RIGHT_ANKLE])

    // Total trunk lean: shoulder-to-hip angle from vertical
    const totalLean = Math.abs(angleFromVertical(shoulderMid, hipMid))

    // Distinguish lean source: compare shoulder-hip-ankle alignment
    // If shoulder-hip-ankle are collinear → lean from ankles (good)
    // If shoulder is ahead of hip-ankle line → waist bend (bad)
    const hipToAnkleAngle = Math.abs(angleFromVertical(hipMid, ankleMid))
    const shoulderToHipAngle = totalLean

    // If the upper body leans more than the lower body, it's waist bend
    const leanDiff = shoulderToHipAngle - hipToAnkleAngle
    let leanSource: LeanSource
    if (leanDiff > 3) {
      leanSource = 'waist'
    } else if (leanDiff < -2) {
      leanSource = 'ankles'
    } else {
      leanSource = 'mixed'
    }

    measurements.push({ angle: totalLean, leanSource, frameIdx: frame.frameIndex })
  }

  if (measurements.length === 0) return null

  const avgAngle = measurements.reduce((sum, m) => sum + m.angle, 0) / measurements.length

  // Majority vote on lean source
  const sourceCounts: Record<LeanSource, number> = { ankles: 0, waist: 0, mixed: 0 }
  for (const m of measurements) sourceCounts[m.leanSource]++
  const dominantSource = (Object.entries(sourceCounts) as [LeanSource, number][])
    .sort((a, b) => b[1] - a[1])[0][0]

  const { assessment, referenceRange } = assessMetric(avgAngle, TRUNK_LEAN_RANGES, paceTier)

  return {
    value: Math.round(avgAngle * 10) / 10,
    unit: '°',
    referenceRange,
    assessment,
    framesUsed: measurements.map((m) => m.frameIdx),
    confidence: computeConfidence(measurements.length, gaitCycles),
    paceContext: paceTier,
    leanSource: dominantSource,
  }
}

// ─── Vertical oscillation (camera-motion-robust) ─────────────────────────────

function computeVerticalOscillation(
  frames: FramePoseData[],
  paceTier: PaceTier,
  gaitCycles: number
): MeasuredMetric | null {
  // Use hip_Y - ankle_Y to cancel out camera panning
  const normalizedHipY: { value: number; frameIdx: number }[] = []
  let bodyHeightSum = 0
  let bodyHeightCount = 0

  for (const frame of frames) {
    if (!isVisible(frame, LEFT_HIP, RIGHT_HIP, LEFT_ANKLE, RIGHT_ANKLE, LEFT_SHOULDER, RIGHT_SHOULDER)) {
      continue
    }

    const hipMid = midpoint(frame.landmarks[LEFT_HIP], frame.landmarks[RIGHT_HIP])
    const ankleMid = midpoint(frame.landmarks[LEFT_ANKLE], frame.landmarks[RIGHT_ANKLE])
    const shoulderMid = midpoint(frame.landmarks[LEFT_SHOULDER], frame.landmarks[RIGHT_SHOULDER])

    // Normalized hip height: hip_Y - ankle_Y
    // In screen coords, both move together if camera pans vertically
    normalizedHipY.push({
      value: hipMid.y - ankleMid.y,
      frameIdx: frame.frameIndex,
    })

    bodyHeightSum += estimateBodyHeight(shoulderMid, ankleMid)
    bodyHeightCount++
  }

  if (normalizedHipY.length < 6 || bodyHeightCount === 0) return null

  const values = normalizedHipY.map((v) => v.value)
  const range = Math.max(...values) - Math.min(...values)
  const avgBodyHeight = bodyHeightSum / bodyHeightCount

  // Express VO as percentage of body height
  const voPercent = avgBodyHeight > 0 ? (range / avgBodyHeight) * 100 : 0

  const { assessment, referenceRange } = assessMetric(voPercent, VERTICAL_OSCILLATION_RANGES, paceTier)

  return {
    value: Math.round(voPercent * 10) / 10,
    unit: '% body height',
    referenceRange,
    assessment,
    framesUsed: normalizedHipY.map((v) => v.frameIdx),
    confidence: computeConfidence(normalizedHipY.length, gaitCycles),
    paceContext: paceTier,
  }
}

// ─── Full biomechanics report ────────────────────────────────────────────────

export function computeBiomechanics(
  frames: FramePoseData[],
  gaitResult: GaitAnalysisResult,
  paceTier: PaceTier
): BiomechanicsReport {
  const side = gaitResult.visibleSide === 'frontal' ? 'left' as Side : gaitResult.visibleSide as Side
  const gaitCycles = gaitResult.gaitCyclesDetected

  const footPlacement = computeFootPlacement(
    frames, gaitResult.contactFrameIndices, side, paceTier, gaitCycles
  )

  const footStrikeType = classifyFootStrike(
    frames, gaitResult.contactFrameIndices, side
  )

  const trunkLean = computeTrunkLean(frames, paceTier, gaitCycles)
  const verticalOscillation = computeVerticalOscillation(frames, paceTier, gaitCycles)

  // Asymmetry
  const asymmetry = detectAsymmetry(frames, gaitResult)

  let contactTimeAsymmetry: MeasuredMetric | null = null
  if (asymmetry.contactTimeDiffPercent !== null && asymmetry.samplesLeft >= 2 && asymmetry.samplesRight >= 2) {
    const { assessment, referenceRange } = assessAsymmetry(asymmetry.contactTimeDiffPercent)
    contactTimeAsymmetry = {
      value: Math.round(asymmetry.contactTimeDiffPercent * 10) / 10,
      unit: '%',
      referenceRange,
      assessment,
      framesUsed: [],
      confidence: asymmetry.samplesLeft >= 3 && asymmetry.samplesRight >= 3 ? 'medium' : 'low',
      paceContext: paceTier,
    }
  }

  const framesWithValidPose = frames.filter((f) => f.landmarks.length > 0).length

  return {
    footPlacement,
    footStrikeType,
    trunkLean,
    verticalOscillation,
    contactTimeAsymmetry,
    footPlacementAsymmetry: null, // computed in asymmetry but deferred for simplicity
    visibleSide: gaitResult.visibleSide === 'frontal' ? 'frontal' : side,
    gaitCyclesDetected: gaitCycles,
    framesAnalyzed: frames.length,
    framesWithValidPose,
  }
}
