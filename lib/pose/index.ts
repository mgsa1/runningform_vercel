// Barrel export for the pose detection module

export { initPoseDetector, detectPose, detectVisibleSide } from './detector'
export { analyzeGait, classifyFootStrike, detectAsymmetry } from './gait'
export { computeBiomechanics } from './biomechanics'
export { selectFramesForClaude, selectFramesEvenly } from './frameSelection'
export { parsePaceTier, formatPaceTier } from './referenceRanges'
export { assessVideoQuality } from './quality'
export { SKELETON_CONNECTIONS, VISIBILITY_THRESHOLD } from './landmarks'

export type {
  Landmark,
  FramePoseData,
  PoseExtractionResult,
  BiomechanicsReport,
  MeasuredMetric,
  TrunkLeanMetric,
  FootStrikeResult,
  GaitPhase,
  GaitAnalysisResult,
  VideoQualityFeedback,
  VideoQualityIssue,
  PaceTier,
  Assessment,
  Confidence,
  Side,
} from './types'
