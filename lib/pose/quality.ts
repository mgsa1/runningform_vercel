import type { FramePoseData, VideoQualityFeedback, VideoQualityIssue } from './types'
import type { GaitAnalysisResult } from './gait'
import { KEY_LANDMARKS, VISIBILITY_THRESHOLD } from './landmarks'

/**
 * Analyze pose detection results and provide quality feedback
 * BEFORE the user submits for analysis.
 */
export function assessVideoQuality(
  frames: FramePoseData[],
  totalFramesExtracted: number,
  gaitResult: GaitAnalysisResult
): VideoQualityFeedback {
  const issues: VideoQualityIssue[] = []

  // Check: enough frames with valid pose
  const framesWithPose = frames.length
  const presenceRatio = framesWithPose / totalFramesExtracted

  if (presenceRatio < 0.3) {
    issues.push({
      type: 'low_presence',
      message: 'We could only detect a runner in a small portion of the video. Make sure you run through the full frame.',
      severity: 'error',
    })
  }

  // Check: landmark visibility
  const avgVisibility = computeAverageKeyVisibility(frames)
  if (avgVisibility < 0.4) {
    issues.push({
      type: 'low_visibility',
      message: "We're having trouble detecting your body clearly. Try better lighting or a less cluttered background.",
      severity: avgVisibility < 0.25 ? 'error' : 'warning',
    })
  }

  // Check: camera angle (frontal vs side)
  if (gaitResult.visibleSide === 'frontal') {
    issues.push({
      type: 'wrong_angle',
      message: 'It looks like the camera is facing you head-on. A side view gives much more accurate biomechanics analysis.',
      severity: 'warning',
    })
  }

  // Check: enough gait cycles
  if (gaitResult.gaitCyclesDetected < 2) {
    issues.push({
      type: 'too_few_strides',
      message: gaitResult.gaitCyclesDetected === 0
        ? "We couldn't detect any complete running strides. Try running past the camera showing 3-4 full strides."
        : "We only detected 1 stride cycle. For more reliable measurements, show 3-4 full strides.",
      severity: gaitResult.gaitCyclesDetected === 0 ? 'error' : 'warning',
    })
  }

  // Check: key body parts visible (head and feet)
  const missingParts = detectMissingBodyParts(frames)
  if (missingParts.length > 0) {
    issues.push({
      type: 'partial_body',
      message: `Make sure your full body is visible, including your ${missingParts.join(' and ')}.`,
      severity: 'warning',
    })
  }

  const hasErrors = issues.some((i) => i.severity === 'error')
  return {
    isAcceptable: !hasErrors,
    issues,
  }
}

function computeAverageKeyVisibility(frames: FramePoseData[]): number {
  if (frames.length === 0) return 0
  let total = 0
  let count = 0
  for (const frame of frames) {
    for (const idx of KEY_LANDMARKS) {
      total += frame.landmarks[idx]?.visibility ?? 0
      count++
    }
  }
  return count > 0 ? total / count : 0
}

function detectMissingBodyParts(frames: FramePoseData[]): string[] {
  const missing: string[] = []
  const NOSE = 0
  const LEFT_ANKLE = 27
  const RIGHT_ANKLE = 28

  // Check if head/nose is consistently missing
  const noseVisible = frames.filter(
    (f) => (f.landmarks[NOSE]?.visibility ?? 0) >= VISIBILITY_THRESHOLD
  ).length
  if (noseVisible < frames.length * 0.3) {
    missing.push('head')
  }

  // Check if feet are consistently missing
  const feetVisible = frames.filter(
    (f) =>
      (f.landmarks[LEFT_ANKLE]?.visibility ?? 0) >= VISIBILITY_THRESHOLD ||
      (f.landmarks[RIGHT_ANKLE]?.visibility ?? 0) >= VISIBILITY_THRESHOLD
  ).length
  if (feetVisible < frames.length * 0.3) {
    missing.push('feet')
  }

  return missing
}
