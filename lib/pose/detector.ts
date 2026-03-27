import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import type { Landmark, FramePoseData } from './types'
import {
  VISIBILITY_THRESHOLD,
  KEY_LANDMARKS,
  LEFT_BODY_LANDMARKS,
  RIGHT_BODY_LANDMARKS,
} from './landmarks'

let landmarkerInstance: PoseLandmarker | null = null
let initPromise: Promise<PoseLandmarker> | null = null

/**
 * Initialize the MediaPipe Pose Landmarker (singleton, lazy-loaded).
 * WASM + model files must be in /mediapipe/ (set up by scripts/setup-mediapipe.sh).
 */
export async function initPoseDetector(): Promise<PoseLandmarker> {
  if (landmarkerInstance) return landmarkerInstance
  if (initPromise) return initPromise

  initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks('/mediapipe')

    landmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: '/mediapipe/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      numPoses: 1,
    })

    return landmarkerInstance
  })()

  return initPromise
}

/**
 * Run pose detection on a single canvas frame.
 * Returns null if no pose is detected or if key landmarks are below the
 * visibility threshold.
 */
export async function detectPose(
  canvas: HTMLCanvasElement,
  frameIndex: number,
  timestamp: number
): Promise<FramePoseData | null> {
  const landmarker = await initPoseDetector()
  const result = landmarker.detect(canvas)

  if (!result.landmarks || result.landmarks.length === 0) {
    return null
  }

  const rawLandmarks = result.landmarks[0]
  const rawWorldLandmarks = result.worldLandmarks?.[0] ?? []

  const landmarks: Landmark[] = rawLandmarks.map((lm) => ({
    x: lm.x,
    y: lm.y,
    z: lm.z,
    visibility: lm.visibility ?? 0,
  }))

  const worldLandmarks: Landmark[] = rawWorldLandmarks.map((lm) => ({
    x: lm.x,
    y: lm.y,
    z: lm.z,
    visibility: lm.visibility ?? 0,
  }))

  // Check that enough key landmarks are visible
  const visibleKeyCount = KEY_LANDMARKS.filter(
    (idx) => landmarks[idx] && landmarks[idx].visibility >= VISIBILITY_THRESHOLD
  ).length
  const keyLandmarkRatio = visibleKeyCount / KEY_LANDMARKS.length

  if (keyLandmarkRatio < 0.4) {
    // Too few key landmarks visible — unreliable detection
    return null
  }

  return {
    frameIndex,
    timestamp,
    landmarks,
    worldLandmarks,
  }
}

/**
 * Determine which side of the body is facing the camera.
 * Compares average visibility of left vs right body landmarks.
 */
export function detectVisibleSide(
  frames: FramePoseData[]
): 'left' | 'right' | 'frontal' {
  let leftTotal = 0
  let rightTotal = 0
  let count = 0

  for (const frame of frames) {
    for (const idx of LEFT_BODY_LANDMARKS) {
      leftTotal += frame.landmarks[idx]?.visibility ?? 0
    }
    for (const idx of RIGHT_BODY_LANDMARKS) {
      rightTotal += frame.landmarks[idx]?.visibility ?? 0
    }
    count++
  }

  if (count === 0) return 'frontal'

  const leftAvg = leftTotal / (count * LEFT_BODY_LANDMARKS.length)
  const rightAvg = rightTotal / (count * RIGHT_BODY_LANDMARKS.length)

  // If both sides are roughly equally visible, the camera is frontal/rear
  const ratio = Math.abs(leftAvg - rightAvg) / Math.max(leftAvg, rightAvg, 0.01)
  if (ratio < 0.2) return 'frontal'

  return leftAvg > rightAvg ? 'left' : 'right'
}
