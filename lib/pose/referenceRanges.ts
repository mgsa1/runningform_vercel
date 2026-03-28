import type { PaceTier, Assessment } from './types'

// ─── Pace tier detection ─────────────────────────────────────────────────────

/**
 * Determine pace tier from a pace string like "5:30 /km" or "8:00 /mi".
 * Returns 'unknown' if unparseable.
 */
export function parsePaceTier(paceStr?: string): PaceTier {
  if (!paceStr) return 'unknown'

  const match = paceStr.match(/(\d+):(\d+)\s*\/(km|mi)/)
  if (!match) return 'unknown'

  const minutes = parseInt(match[1], 10)
  const seconds = parseInt(match[2], 10)
  const unit = match[3]

  let paceSecondsPerKm = minutes * 60 + seconds
  if (unit === 'mi') {
    // Convert /mi to /km (1 mi ≈ 1.609 km)
    paceSecondsPerKm = paceSecondsPerKm / 1.609
  }

  // Thresholds in seconds per km:
  // Easy: > 6:00/km (360s)
  // Tempo: 4:30-6:00/km (270-360s)
  // Fast: < 4:30/km (270s)
  if (paceSecondsPerKm > 360) return 'easy'
  if (paceSecondsPerKm >= 270) return 'tempo'
  return 'fast'
}

// ─── Reference range definitions ─────────────────────────────────────────────

interface RangeSpec {
  good: { min: number; max: number }
  moderate: { min: number; max: number }
  // Anything outside moderate is 'significant'
}

type MetricRanges = Record<PaceTier, RangeSpec>

/**
 * Foot placement ahead of hip (% of estimated body height).
 * Higher values = more overstriding.
 * Speed-dependent: faster running naturally has longer reach.
 *
 * No validated cutoffs exist in the literature (Souza 2016: "likely on a
 * sliding scale"). These thresholds are derived from:
 * - Hanley et al. 2020: elite marathoners land ~0.30m ahead of COM (~22%
 *   of shoulder-to-ankle height) at race pace (~3:00/km)
 * - Lieberman et al. 2015: overstriding creates braking impulse proportional
 *   to foot-ahead distance
 * - Heiderscheit et al. 2014: +5% cadence reduces foot-ahead by ~5.9%
 *
 * Body height estimated as shoulder-to-ankle Euclidean distance.
 * Note: 2D side-view horizontal distance divided by a mostly-vertical body
 * height mixes image axes, introducing a constant scaling factor dependent
 * on video aspect ratio (~0.56x for 16:9 landscape). Thresholds are set
 * empirically for typical phone landscape video.
 */
export const FOOT_PLACEMENT_RANGES: MetricRanges = {
  easy:    { good: { min: 0, max: 5 },  moderate: { min: 0, max: 9 } },
  tempo:   { good: { min: 0, max: 7 },  moderate: { min: 0, max: 11 } },
  fast:    { good: { min: 0, max: 9 },  moderate: { min: 0, max: 13 } },
  unknown: { good: { min: 0, max: 5 },  moderate: { min: 0, max: 9 } },
}

/**
 * Trunk lean angle in degrees (forward positive).
 * Contrary to popular belief, elite runners do NOT increase lean with speed
 * (Preece et al. 2016: elites hold ~3° across all speeds).
 *
 * Research basis:
 * - Preece et al. 2016 (Gait & Posture): elite runners ~3°, recreational 5-7.5°
 * - Williams & Cavanagh 1987 (J. Applied Physiology): most economical group ~5.9°
 * - Carson et al. 2024 (PLOS ONE): ~8° lean increased metabolic cost by 8%
 * - Folland et al. 2017 (MSSE): upright posture correlated with better performance
 * - Teng & Powers 2015 (MSSE): >10° reduces knee load but increases hip demand
 *
 * Previous ranges (6-10° easy, 8-12° tempo, 10-15° fast) incorrectly flagged
 * efficient upright runners (~3-5°) as having insufficient lean.
 */
export const TRUNK_LEAN_RANGES: MetricRanges = {
  easy:    { good: { min: 2, max: 8 },  moderate: { min: 0, max: 12 } },
  tempo:   { good: { min: 3, max: 9 },  moderate: { min: 1, max: 13 } },
  fast:    { good: { min: 3, max: 10 }, moderate: { min: 1, max: 15 } },
  unknown: { good: { min: 2, max: 8 },  moderate: { min: 0, max: 12 } },
}

/**
 * Vertical oscillation as percentage of estimated body height.
 * Less speed-dependent but still increases somewhat with pace.
 *
 * Research basis:
 * - Adams et al. 2018 (IJSPT): 5-10 cm promotes proper form
 * - Garmin zones: excellent <6.8cm, good 6.8-8.9cm, fair 9.0-10.9cm
 * - Moore 2016 (Sports Medicine): lower VO benefits running economy
 * - Roche-Seruendo et al. 2024 (Sports Medicine): higher VO moderately
 *   associated with higher energetic cost (r=0.35)
 *
 * Note: "% of body height" is NOT a standard metric in the literature —
 * Garmin uses absolute cm, or vertical ratio (VO/stride length). This is
 * a novel normalization for camera-independence. Body height is estimated
 * as shoulder-to-ankle distance (~75-80% of true height), so percentages
 * are ~25% higher than true body height ratios.
 *
 * Computed as total range (max-min) across all frames, which yields higher
 * values than per-stride averages used by wearables.
 *
 * Thresholds loosened from original (4.5/6.5) to account for:
 * (a) shoulder-to-ankle denominator, (b) total-range vs per-stride method.
 */
export const VERTICAL_OSCILLATION_RANGES: MetricRanges = {
  easy:    { good: { min: 0, max: 5.5 }, moderate: { min: 0, max: 8.0 } },
  tempo:   { good: { min: 0, max: 6.0 }, moderate: { min: 0, max: 8.5 } },
  fast:    { good: { min: 0, max: 6.5 }, moderate: { min: 0, max: 9.0 } },
  unknown: { good: { min: 0, max: 5.5 }, moderate: { min: 0, max: 8.0 } },
}

/**
 * Contact time asymmetry as percentage difference.
 * Not speed-dependent.
 *
 * Research basis:
 * - Vincent et al. 2025 (Frontiers): healthy runners show <4% spatiotemporal asymmetry
 * - Joubert et al. 2020 (IJSE): ~3.7% metabolic cost increase per 1% GCT imbalance
 * - Garmin: "good" balance = 49.3-50.7% (~1.4% asymmetry)
 * - Malisoux et al. 2024 (BMJ Open Sport, n=836): asymmetry does NOT reliably
 *   predict injury — frame as efficiency concern, not injury risk
 *
 * Previous thresholds (<8% good, <15% moderate) were derived from strength
 * testing literature (Barber 1990, Knapik 1991) not validated for running gait.
 */
export const ASYMMETRY_RANGES: RangeSpec = {
  good: { min: 0, max: 3 },
  moderate: { min: 0, max: 6 },
}

/**
 * Running cadence in steps per minute.
 * Computed as 120 / avg(strideTimes) where strideTimes are full gait cycles
 * (same-foot to same-foot = 2 steps per cycle).
 *
 * Research basis:
 * - Heiderscheit et al. 2011 (MSSE): 165-180 spm typical for recreational runners;
 *   +5-10% cadence reduces peak knee loading ~20%
 * - Stöggl & Schießl 2017: elite marathoners average ~180-185 spm
 * - Bramah et al. 2019: cadence <160 associated with overstriding patterns
 */
export const CADENCE_RANGES: MetricRanges = {
  easy:    { good: { min: 165, max: 180 }, moderate: { min: 155, max: 190 } },
  tempo:   { good: { min: 170, max: 185 }, moderate: { min: 160, max: 195 } },
  fast:    { good: { min: 175, max: 195 }, moderate: { min: 165, max: 205 } },
  unknown: { good: { min: 165, max: 180 }, moderate: { min: 155, max: 190 } },
}

/**
 * Ground contact time (GCT) in milliseconds.
 * Duration from initial contact to toe-off for the visible foot.
 * Lower GCT at a given speed indicates greater leg stiffness and elastic energy return.
 *
 * Research basis:
 * - Morin et al. 2011 (Eur J Appl Physiol): recreational runners 240-300ms at easy pace
 * - Weyand et al. 2000 (J Appl Physiol): faster running achieved primarily by reducing GCT
 * - Heise & Martin 2001 (Med Sci Sports Exerc): GCT strongly inversely correlated with speed
 * - Nummela et al. 2007: GCT ~200ms at 4:00/km, ~160ms at 3:00/km for trained runners
 */
export const GCT_RANGES: MetricRanges = {
  easy:    { good: { min: 240, max: 300 }, moderate: { min: 210, max: 340 } },
  tempo:   { good: { min: 200, max: 260 }, moderate: { min: 175, max: 290 } },
  fast:    { good: { min: 170, max: 220 }, moderate: { min: 150, max: 250 } },
  unknown: { good: { min: 240, max: 300 }, moderate: { min: 210, max: 340 } },
}

// ─── Assessment function ─────────────────────────────────────────────────────

/**
 * Assess a measured value against speed-normalized reference ranges.
 */
export function assessMetric(
  value: number,
  ranges: MetricRanges,
  paceTier: PaceTier
): { assessment: Assessment; referenceRange: { min: number; max: number } } {
  const range = ranges[paceTier]

  if (value >= range.good.min && value <= range.good.max) {
    return { assessment: 'good', referenceRange: range.good }
  }
  if (value >= range.moderate.min && value <= range.moderate.max) {
    return { assessment: 'moderate', referenceRange: range.moderate }
  }
  return { assessment: 'significant', referenceRange: range.good }
}

/**
 * Assess asymmetry (not speed-dependent).
 */
export function assessAsymmetry(
  value: number
): { assessment: Assessment; referenceRange: { min: number; max: number } } {
  if (value <= ASYMMETRY_RANGES.good.max) {
    return { assessment: 'good', referenceRange: ASYMMETRY_RANGES.good }
  }
  if (value <= ASYMMETRY_RANGES.moderate.max) {
    return { assessment: 'moderate', referenceRange: ASYMMETRY_RANGES.moderate }
  }
  return { assessment: 'significant', referenceRange: ASYMMETRY_RANGES.good }
}

/**
 * Format a pace tier for display.
 */
export function formatPaceTier(tier: PaceTier): string {
  switch (tier) {
    case 'easy': return 'easy pace'
    case 'tempo': return 'tempo pace'
    case 'fast': return 'fast pace'
    case 'unknown': return 'unspecified pace'
  }
}
