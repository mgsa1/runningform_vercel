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

const confidenceBadge: Record<string, string> = {
  high: 'text-green-300',
  medium: 'text-amber-300',
  low: 'text-gray-400',
}

function RangeBar({ metric }: { metric: MeasuredMetric }) {
  const { value, referenceRange, assessment } = metric
  const colors = assessmentColors[assessment] ?? assessmentColors.moderate

  // Position the marker on a 0-1 scale relative to the range
  // range.min = good boundary start, range.max = moderate boundary end
  const rangeSpan = referenceRange.max - referenceRange.min
  const extended = rangeSpan * 1.5 // show some space beyond the range
  const barMin = Math.max(0, referenceRange.min - rangeSpan * 0.25)
  const barMax = referenceRange.max + extended * 0.5

  const markerPos = Math.min(
    100,
    Math.max(0, ((value - barMin) / (barMax - barMin)) * 100)
  )

  // Good zone position
  const goodStart = ((referenceRange.min - barMin) / (barMax - barMin)) * 100
  const goodEnd = ((referenceRange.max - barMin) / (barMax - barMin)) * 100

  return (
    <div className="relative h-2 rounded-full bg-gray-800 overflow-hidden">
      {/* Good zone */}
      <div
        className="absolute h-full bg-green-500/20 rounded-full"
        style={{ left: `${goodStart}%`, width: `${goodEnd - goodStart}%` }}
      />
      {/* Marker */}
      <div
        className={`absolute top-0 h-full w-1.5 rounded-full ${colors.bar}`}
        style={{ left: `${markerPos}%`, transform: 'translateX(-50%)' }}
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
  const colors = assessmentColors[metric.assessment] ?? assessmentColors.moderate
  const pace = paceLabels[metric.paceContext] ?? ''

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-gray-200 truncate">{label}</span>
          <span className={`text-sm ${confidenceBadge[metric.confidence]}`}>
            {metric.confidence}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-mono text-white">
            {formatValue(metric.value, metric.unit)}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-medium capitalize ${colors.text} ${colors.bg}`}
          >
            {metric.assessment}
          </span>
        </div>
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
