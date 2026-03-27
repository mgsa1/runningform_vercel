import type { Landmark } from './types'

/**
 * Angle at point B in degrees, given three landmarks A → B → C.
 * Uses the dot product formula: cos(θ) = (BA · BC) / (|BA| × |BC|)
 */
export function angleBetweenPoints(a: Landmark, b: Landmark, c: Landmark): number {
  const baX = a.x - b.x
  const baY = a.y - b.y
  const bcX = c.x - b.x
  const bcY = c.y - b.y

  const dot = baX * bcX + baY * bcY
  const magBA = Math.sqrt(baX * baX + baY * baY)
  const magBC = Math.sqrt(bcX * bcX + bcY * bcY)

  if (magBA === 0 || magBC === 0) return 0

  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)))
  return Math.acos(cosAngle) * (180 / Math.PI)
}

/**
 * Angle of the line from A to B measured from the vertical (Y-axis pointing down).
 * Returns degrees: 0 = perfectly vertical, positive = leaning forward (B.x > A.x
 * when running left-to-right), negative = leaning backward.
 *
 * Note: In screen coordinates Y increases downward, so "vertical" means
 * A is above B (A.y < B.y) with same X.
 */
export function angleFromVertical(top: Landmark, bottom: Landmark): number {
  const dx = bottom.x - top.x
  const dy = bottom.y - top.y

  if (dy === 0) return dx > 0 ? 90 : dx < 0 ? -90 : 0

  // atan2(dx, dy) gives the angle from the positive Y-axis (downward)
  return Math.atan2(dx, dy) * (180 / Math.PI)
}

/**
 * Horizontal (X-axis) distance between two landmarks.
 * Positive means B is to the right of A.
 */
export function horizontalDistance(a: Landmark, b: Landmark): number {
  return b.x - a.x
}

/**
 * Vertical (Y-axis) distance between two landmarks.
 * Positive means B is below A (screen coordinates: Y increases downward).
 */
export function verticalDistance(a: Landmark, b: Landmark): number {
  return b.y - a.y
}

/**
 * Euclidean distance between two landmarks in normalized coordinates.
 */
export function distance(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Midpoint of two landmarks.
 */
export function midpoint(a: Landmark, b: Landmark): Landmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility, b.visibility),
  }
}

/**
 * Estimate body height in normalized coordinates from shoulder midpoint to ankle.
 * Used to express vertical oscillation as a percentage of body height.
 */
export function estimateBodyHeight(
  shoulderMid: Landmark,
  ankleMid: Landmark
): number {
  return distance(shoulderMid, ankleMid)
}
