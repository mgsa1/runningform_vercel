'use client'

interface MeasuredMetric {
  value: number
  unit: string
  referenceRange: { min: number; max: number }
  assessment: 'good' | 'moderate' | 'significant'
  framesUsed: number[]
  confidence: 'high' | 'medium' | 'low'
  paceContext: 'easy' | 'tempo' | 'fast' | 'unknown'
}

interface TrunkLeanMetric extends MeasuredMetric {
  leanSource: 'ankles' | 'waist' | 'mixed'
}

interface FootStrikeResult {
  type: 'heel' | 'midfoot' | 'forefoot'
  confidence: 'high' | 'medium' | 'low'
  contactCount: number
}

interface BiomechanicsReport {
  footPlacement: MeasuredMetric | null
  footStrikeType: FootStrikeResult | null
  trunkLean: TrunkLeanMetric | null
  verticalOscillation: MeasuredMetric | null
  contactTimeAsymmetry: MeasuredMetric | null
  footPlacementAsymmetry: MeasuredMetric | null
  visibleSide: 'left' | 'right' | 'frontal'
  gaitCyclesDetected: number
  framesAnalyzed: number
  framesWithValidPose: number
}

interface BiomechanicsCardProps {
  biomechanics: BiomechanicsReport
}

const paceLabels: Record<string, string> = {
  easy: 'easy pace',
  tempo: 'tempo pace',
  fast: 'fast pace',
  unknown: 'default range',
}

const assessmentColors: Record<string, { bar: string; text: string; bg: string }> = {
  good: { bar: 'bg-green-500', text: 'text-green-300', bg: 'bg-green-500/10' },
  moderate: { bar: 'bg-amber-500', text: 'text-amber-300', bg: 'bg-amber-500/10' },
  significant: { bar: 'bg-red-500', text: 'text-red-300', bg: 'bg-red-500/10' },
}


function RangeBar({ metric }: { metric: MeasuredMetric }) {
  const { value, referenceRange } = metric
  const rangeSpan = referenceRange.max - referenceRange.min

  // Bar always starts at 0; extends to ~2x the range max so the good zone
  // occupies roughly the left half and there's room for out-of-range values
  const barMin = 0
  const barMax = Math.max(
    referenceRange.max + rangeSpan * 0.8,
    value * 1.15 // ensure the dot is always visible even if way out of range
  )

  const toPercent = (v: number) =>
    Math.min(100, Math.max(0, ((v - barMin) / (barMax - barMin)) * 100))

  const goodStart = toPercent(referenceRange.min)
  const goodEnd = toPercent(referenceRange.max)
  const markerPos = toPercent(value)

  // Dot color: green if inside range, orange if within 10% of boundary, red if outside
  const margin = rangeSpan * 0.1
  let dotColor = 'bg-green-500' // inside
  if (value < referenceRange.min - margin || value > referenceRange.max + margin) {
    dotColor = 'bg-red-500' // outside
  } else if (value < referenceRange.min || value > referenceRange.max) {
    dotColor = 'bg-amber-500' // on the border
  }

  return (
    <div className="relative h-2 rounded-full bg-gray-800 overflow-hidden">
      {/* Good zone */}
      <div
        className="absolute h-full bg-green-500/25 rounded-full"
        style={{ left: `${goodStart}%`, width: `${goodEnd - goodStart}%` }}
      />
      {/* Value dot */}
      <div
        className={`absolute top-1/2 w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-gray-900`}
        style={{ left: `${markerPos}%`, transform: 'translate(-50%, -50%)' }}
      />
    </div>
  )
}

function MetricRow({
  label,
  metric,
  subtitle,
}: {
  label: string
  metric: MeasuredMetric
  subtitle?: string
}) {
  const pace = paceLabels[metric.paceContext] ?? ''

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-200 truncate">{label}</span>
        <span className="text-sm font-mono text-white">
          {formatValue(metric.value, metric.unit)}
        </span>
      </div>
      <RangeBar metric={metric} />
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Range: {formatValue(metric.referenceRange.min, metric.unit)} –{' '}
          {formatValue(metric.referenceRange.max, metric.unit)}
          {pace ? ` at ${pace}` : ''}
        </span>
        {subtitle && <span className="text-gray-400">{subtitle}</span>}
      </div>
    </div>
  )
}

function formatValue(value: number, unit: string): string {
  if (unit === 'degrees' || unit === '°') return `${value.toFixed(1)}°`
  if (unit === '% body height') return `${value.toFixed(1)}%`
  if (unit === '%') return `${value.toFixed(0)}%`
  if (unit === 'ratio') return value.toFixed(3)
  return value.toFixed(2)
}

function leanSourceLabel(source: string): string {
  if (source === 'ankles') return 'from ankles (good)'
  if (source === 'waist') return 'from waist (check form)'
  return 'mixed source'
}

export default function BiomechanicsCard({ biomechanics }: BiomechanicsCardProps) {
  const {
    footPlacement,
    footStrikeType,
    trunkLean,
    verticalOscillation,
    contactTimeAsymmetry,
    footPlacementAsymmetry,
    gaitCyclesDetected,
  } = biomechanics

  const hasMetrics = footPlacement || trunkLean || verticalOscillation

  if (!hasMetrics && !footStrikeType) return null

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-200">Biomechanics</h2>
        <span className="text-xs text-gray-500">
          {gaitCyclesDetected} gait cycle{gaitCyclesDetected !== 1 ? 's' : ''} detected
        </span>
      </div>

      {/* Foot strike callout */}
      {footStrikeType && (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800/70 border border-gray-700">
          <div>
            <p className="text-sm font-medium text-white capitalize">
              {footStrikeType.type} strike
            </p>
            <p className="text-xs text-gray-400">
              {footStrikeType.confidence} confidence
              {footStrikeType.contactCount > 0 &&
                ` · ${footStrikeType.contactCount} contact${footStrikeType.contactCount !== 1 ? 's' : ''} analyzed`}
            </p>
          </div>
        </div>
      )}

      {/* Metric rows */}
      <div className="space-y-4">
        {footPlacement && (
          <MetricRow label="Foot placement" metric={footPlacement} subtitle="ahead of hip" />
        )}

        {trunkLean && (
          <MetricRow
            label="Trunk lean"
            metric={trunkLean}
            subtitle={leanSourceLabel(trunkLean.leanSource)}
          />
        )}

        {verticalOscillation && (
          <MetricRow
            label="Vertical oscillation"
            metric={verticalOscillation}
            subtitle="% of body height"
          />
        )}
      </div>

      {/* Asymmetry section */}
      {(contactTimeAsymmetry || footPlacementAsymmetry) && (
        <div className="border-t border-gray-800 pt-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Asymmetry
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Difference between left and right side. Under 3% is normal — larger gaps may reduce running efficiency.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {contactTimeAsymmetry && (
              <AsymmetryChip label="Contact time" metric={contactTimeAsymmetry} />
            )}
            {footPlacementAsymmetry && (
              <AsymmetryChip label="Foot placement" metric={footPlacementAsymmetry} />
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function AsymmetryChip({ label, metric }: { label: string; metric: MeasuredMetric }) {
  const colors = assessmentColors[metric.assessment] ?? assessmentColors.moderate
  const pct = Math.abs(metric.value).toFixed(0)
  const flagged = metric.assessment !== 'good'

  return (
    <div
      className={`rounded-lg px-3 py-2 border ${
        flagged ? 'border-amber-500/30 bg-amber-500/5' : 'border-gray-700 bg-gray-800/50'
      }`}
    >
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-sm font-mono font-medium ${colors.text}`}>{pct}% diff</p>
    </div>
  )
}
