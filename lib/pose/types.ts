// ─── Pose Detection Types ────────────────────────────────────────────────────

export interface Landmark {
  x: number        // 0-1 normalized horizontal position
  y: number        // 0-1 normalized vertical position (0 = top)
  z: number        // depth relative to hip midpoint
  visibility: number // 0-1 confidence that the landmark is visible
}

export interface FramePoseData {
  frameIndex: number
  timestamp: number          // seconds into video
  landmarks: Landmark[]      // 33 MediaPipe pose landmarks (normalized)
  worldLandmarks: Landmark[] // real-world 3D coordinates in meters
}

export interface PoseExtractionResult {
  frames: FramePoseData[]
  modelVersion: string
  extractedAt: string
  visibleSide: 'left' | 'right' | 'frontal'
  framesWithValidPose: number
}

// ─── Gait Analysis Types ─────────────────────────────────────────────────────

export type GaitPhaseName = 'initial_contact' | 'midstance' | 'toe_off' | 'mid_swing'
export type FootStrikeType = 'heel' | 'midfoot' | 'forefoot'
export type Side = 'left' | 'right'

export interface GaitPhase {
  frameIndex: number
  timestamp: number
  phase: GaitPhaseName
  side: Side
  confidence: number // 0-1
}

export interface GaitAnalysisResult {
  phases: GaitPhase[]
  contactFrameIndices: number[]
  toeOffFrameIndices: number[]
  gaitCyclesDetected: number
  visibleSide: Side | 'frontal'
  strideTimes: number[]   // seconds per stride cycle
}

// ─── Biomechanics Types ──────────────────────────────────────────────────────

export type PaceTier = 'easy' | 'tempo' | 'fast' | 'unknown'
export type Assessment = 'good' | 'moderate' | 'significant'
export type Confidence = 'high' | 'medium' | 'low'
export type LeanSource = 'ankles' | 'waist' | 'mixed'

export interface MeasuredMetric {
  value: number
  unit: string
  referenceRange: { min: number; max: number }
  assessment: Assessment
  framesUsed: number[]
  confidence: Confidence
  paceContext: PaceTier
}

export interface TrunkLeanMetric extends MeasuredMetric {
  leanSource: LeanSource
}

export interface FootStrikeResult {
  type: FootStrikeType
  confidence: Confidence
  contactCount: number
}

export interface BiomechanicsReport {
  // Core 4 metrics
  footPlacement: MeasuredMetric | null
  footStrikeType: FootStrikeResult | null
  trunkLean: TrunkLeanMetric | null
  verticalOscillation: MeasuredMetric | null

  // Asymmetry (free from side view when both legs visible)
  contactTimeAsymmetry: MeasuredMetric | null
  footPlacementAsymmetry: MeasuredMetric | null

  // Metadata
  visibleSide: Side | 'frontal'
  gaitCyclesDetected: number
  framesAnalyzed: number
  framesWithValidPose: number
}

// ─── Quality Feedback Types ──────────────────────────────────────────────────

export interface VideoQualityFeedback {
  isAcceptable: boolean
  issues: VideoQualityIssue[]
}

export interface VideoQualityIssue {
  type: 'low_visibility' | 'wrong_angle' | 'too_few_strides' | 'partial_body' | 'low_presence'
  message: string
  severity: 'warning' | 'error'
}
