// Shared scoring utilities — used by results page, Inngest worker, and history/progress views.

export interface ScoredItem {
  trait: string
  status: string
  severity: string
}

const BASE_POINTS: Record<string, Record<string, number>> = {
  good:       { none: 100, minor: 100, moderate: 100, critical: 100 },
  needs_work: { none: 70,  minor: 55,  moderate: 30,  critical: 5   },
}

function getImportance(trait: string): number {
  const t = trait.toLowerCase()
  if (
    t.includes('overstrid') || t.includes('trunk lean') ||
    t.includes('vertical oscill') || t.includes('foot place') ||
    t.includes('foot strike') || t.includes('cadence')
  ) {
    return 1.5
  }
  if (
    t.includes('head') || t.includes('arm') ||
    t.includes('shoulder') || t.includes('asymmetr')
  ) {
    return 0.6
  }
  return 1.0
}

export function computeFormScore(items: ScoredItem[]): number {
  if (items.length === 0) return 0
  let weightedSum = 0
  let importanceSum = 0
  for (const item of items) {
    if (item.status === 'not_assessable') continue
    const points = BASE_POINTS[item.status]?.[item.severity] ?? 50
    const importance = getImportance(item.trait)
    weightedSum += points * importance
    importanceSum += importance
  }
  return importanceSum === 0 ? 0 : Math.round(weightedSum / importanceSum)
}

// ── Trait name normalisation ──────────────────────────────────────────────────
// Claude uses free-text trait names. This map normalises common variants to
// canonical names for reliable cross-session tracking in the history view.

const TRAIT_ALIAS_MAP: Record<string, string> = {
  'arm swing': 'Arm Drive',
  'arm crossing': 'Arm Drive',
  'arm mechanics': 'Arm Drive',
  'elbow angle': 'Arm Drive',
  'elbow position': 'Arm Drive',
  'posture': 'Trunk Lean',
  'forward lean': 'Trunk Lean',
  'trunk angle': 'Trunk Lean',
  'upper body lean': 'Trunk Lean',
  'body lean': 'Trunk Lean',
  'gaze': 'Head Position',
  'chin position': 'Head Position',
  'head tilt': 'Head Position',
  'overstriding': 'Overstriding',
  'foot placement': 'Foot Placement',
  'foot landing': 'Foot Placement',
  'step length': 'Overstriding',
  'heel strike': 'Foot Strike',
  'landing pattern': 'Foot Strike',
  'bounce': 'Vertical Oscillation',
  'up-and-down movement': 'Vertical Oscillation',
  'pelvic drop': 'Hip Drop',
  'lateral pelvic tilt': 'Hip Drop',
  'shoulder tension': 'Shoulder Tension',
  'shoulder drop': 'Shoulder Tension',
  'step rate': 'Cadence',
  'turnover': 'Cadence',
  'contact time': 'Ground Contact Time',
  'ground contact': 'Ground Contact Time',
}

export function normalizeTrait(trait: string): string {
  const lower = trait.toLowerCase().trim()
  return TRAIT_ALIAS_MAP[lower] ?? trait
}
