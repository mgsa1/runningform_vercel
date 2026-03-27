import type { FramePoseData, GaitPhase, GaitPhaseName } from './types'
import type { GaitAnalysisResult } from './gait'
import { KEY_LANDMARKS, VISIBILITY_THRESHOLD } from './landmarks'

const CLAUDE_FRAME_COUNT = 10

/**
 * Select the most biomechanically informative frames for Claude.
 *
 * Strategy:
 * 1. Pick frames at key gait phases (initial_contact, midstance, toe_off, mid_swing)
 * 2. Prefer frames from different gait cycles for variety
 * 3. Fill remaining slots with highest-confidence frames
 * 4. Return sorted by frame index (chronological)
 */
export function selectFramesForClaude(
  allFrames: FramePoseData[],
  gaitResult: GaitAnalysisResult,
  targetCount: number = CLAUDE_FRAME_COUNT
): number[] {
  if (allFrames.length <= targetCount) {
    return allFrames.map((f) => f.frameIndex)
  }

  const selected = new Set<number>()
  const phases = gaitResult.phases

  // Phase priority: initial_contact > midstance > toe_off > mid_swing
  const phasePriority: GaitPhaseName[] = ['initial_contact', 'midstance', 'toe_off', 'mid_swing']

  for (const phase of phasePriority) {
    if (selected.size >= targetCount) break

    const phaseFrames = phases
      .filter((p: GaitPhase) => p.phase === phase)
      .sort((a: GaitPhase, b: GaitPhase) => b.confidence - a.confidence)

    for (const pf of phaseFrames) {
      if (selected.size >= targetCount) break
      // Avoid selecting frames too close together (within 2 frame indices)
      const tooClose = [...selected].some((fi) => Math.abs(fi - pf.frameIndex) < 2)
      if (!tooClose) {
        selected.add(pf.frameIndex)
      }
    }
  }

  // Fill remaining slots with highest-confidence frames not already selected
  if (selected.size < targetCount) {
    const remaining = allFrames
      .filter((f) => !selected.has(f.frameIndex))
      .map((f) => ({
        frameIndex: f.frameIndex,
        quality: frameQualityScore(f),
      }))
      .sort((a, b) => b.quality - a.quality)

    for (const r of remaining) {
      if (selected.size >= targetCount) break
      const tooClose = [...selected].some((fi) => Math.abs(fi - r.frameIndex) < 2)
      if (!tooClose) {
        selected.add(r.frameIndex)
      }
    }
  }

  // If we still don't have enough (unlikely), add evenly spaced frames
  if (selected.size < targetCount) {
    const step = Math.floor(allFrames.length / (targetCount - selected.size + 1))
    for (let i = 0; i < allFrames.length && selected.size < targetCount; i += step) {
      selected.add(allFrames[i].frameIndex)
    }
  }

  return [...selected].sort((a, b) => a - b)
}

/**
 * Score a frame's quality based on landmark visibility.
 * Higher = better quality for Claude analysis.
 */
function frameQualityScore(frame: FramePoseData): number {
  let score = 0
  for (const idx of KEY_LANDMARKS) {
    const vis = frame.landmarks[idx]?.visibility ?? 0
    if (vis >= VISIBILITY_THRESHOLD) score += vis
  }
  return score
}

/**
 * Fallback: evenly-spaced frame selection when gait detection fails.
 */
export function selectFramesEvenly(
  totalFrames: number,
  targetCount: number = CLAUDE_FRAME_COUNT
): number[] {
  if (totalFrames <= targetCount) {
    return Array.from({ length: totalFrames }, (_, i) => i)
  }

  const step = totalFrames / targetCount
  return Array.from({ length: targetCount }, (_, i) =>
    Math.min(Math.round(i * step), totalFrames - 1)
  )
}
