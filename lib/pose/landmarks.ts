// MediaPipe Pose Landmarker — 33 landmark indices
// https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker

// ─── Visibility threshold ────────────────────────────────────────────────────
// Only use landmarks above this confidence in all biomechanics computations.
// The lite model struggles with occluded (far-side) landmarks, motion blur, and
// low-contrast scenes. 0.5 filters out unreliable detections.
export const VISIBILITY_THRESHOLD = 0.5

// ─── Face ────────────────────────────────────────────────────────────────────
export const NOSE = 0
export const LEFT_EYE_INNER = 1
export const LEFT_EYE = 2
export const LEFT_EYE_OUTER = 3
export const RIGHT_EYE_INNER = 4
export const RIGHT_EYE = 5
export const RIGHT_EYE_OUTER = 6
export const LEFT_EAR = 7
export const RIGHT_EAR = 8
export const MOUTH_LEFT = 9
export const MOUTH_RIGHT = 10

// ─── Upper body ──────────────────────────────────────────────────────────────
export const LEFT_SHOULDER = 11
export const RIGHT_SHOULDER = 12
export const LEFT_ELBOW = 13
export const RIGHT_ELBOW = 14
export const LEFT_WRIST = 15
export const RIGHT_WRIST = 16
export const LEFT_PINKY = 17
export const RIGHT_PINKY = 18
export const LEFT_INDEX = 19
export const RIGHT_INDEX = 20
export const LEFT_THUMB = 21
export const RIGHT_THUMB = 22

// ─── Lower body ──────────────────────────────────────────────────────────────
export const LEFT_HIP = 23
export const RIGHT_HIP = 24
export const LEFT_KNEE = 25
export const RIGHT_KNEE = 26
export const LEFT_ANKLE = 27
export const RIGHT_ANKLE = 28
export const LEFT_HEEL = 29
export const RIGHT_HEEL = 30
export const LEFT_FOOT_INDEX = 31
export const RIGHT_FOOT_INDEX = 32

// ─── Paired landmarks for side detection ─────────────────────────────────────
export const LEFT_BODY_LANDMARKS = [
  LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST,
  LEFT_HIP, LEFT_KNEE, LEFT_ANKLE, LEFT_HEEL, LEFT_FOOT_INDEX,
] as const

export const RIGHT_BODY_LANDMARKS = [
  RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST,
  RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE, RIGHT_HEEL, RIGHT_FOOT_INDEX,
] as const

// Key landmarks required for biomechanics computation
export const KEY_LANDMARKS = [
  LEFT_SHOULDER, RIGHT_SHOULDER,
  LEFT_HIP, RIGHT_HIP,
  LEFT_KNEE, RIGHT_KNEE,
  LEFT_ANKLE, RIGHT_ANKLE,
  LEFT_HEEL, RIGHT_HEEL,
  LEFT_FOOT_INDEX, RIGHT_FOOT_INDEX,
] as const

// ─── Skeleton connections for overlay drawing ────────────────────────────────
export const SKELETON_CONNECTIONS: [number, number][] = [
  // Torso
  [LEFT_SHOULDER, RIGHT_SHOULDER],
  [LEFT_HIP, RIGHT_HIP],
  [LEFT_SHOULDER, LEFT_HIP],
  [RIGHT_SHOULDER, RIGHT_HIP],
  // Left arm
  [LEFT_SHOULDER, LEFT_ELBOW],
  [LEFT_ELBOW, LEFT_WRIST],
  // Right arm
  [RIGHT_SHOULDER, RIGHT_ELBOW],
  [RIGHT_ELBOW, RIGHT_WRIST],
  // Left leg
  [LEFT_HIP, LEFT_KNEE],
  [LEFT_KNEE, LEFT_ANKLE],
  [LEFT_ANKLE, LEFT_HEEL],
  [LEFT_ANKLE, LEFT_FOOT_INDEX],
  // Right leg
  [RIGHT_HIP, RIGHT_KNEE],
  [RIGHT_KNEE, RIGHT_ANKLE],
  [RIGHT_ANKLE, RIGHT_HEEL],
  [RIGHT_ANKLE, RIGHT_FOOT_INDEX],
]
