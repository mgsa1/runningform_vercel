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
  cadence: MeasuredMetric | null
  groundContactTime: MeasuredMetric | null
  contactTimeAsymmetry: MeasuredMetric | null
  footPlacementAsymmetry: MeasuredMetric | null
  visibleSide: 'left' | 'right' | 'frontal'
  gaitCyclesDetected: number
  framesAnalyzed: number
  framesWithValidPose: number
}

interface BiomechanicsCardProps {
  biomechanics: BiomechanicsReport
  heightCm?: number
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
    <div className="relative h-1.5 bg-[#1A1A1A] overflow-hidden">
      {/* Good zone */}
      <div
        className="absolute h-full bg-green-500/25"
        style={{ left: `${goodStart}%`, width: `${goodEnd - goodStart}%` }}
      />
      {/* Value dot */}
      <div
        className={`absolute top-1/2 w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-black`}
        style={{ left: `${markerPos}%`, transform: 'translate(-50%, -50%)' }}
      />
    </div>
  )
}

function MetricRow({
  label,
  metric,
  subtitle,
  cmValue,
}: {
  label: string
  metric: MeasuredMetric
  subtitle?: string
  cmValue?: string
}) {
  const pace = paceLabels[metric.paceContext] ?? ''

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-white truncate">{label}</span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-sm font-mono text-white">
            {formatValue(metric.value, metric.unit)}
          </span>
          {cmValue && <span className="text-xs text-[#444444]">{cmValue}</span>}
        </span>
      </div>
      <RangeBar metric={metric} />
      <div className="flex items-center justify-between text-xs text-[#444444]">
        <span>
          Range: {formatValue(metric.referenceRange.min, metric.unit)} –{' '}
          {formatValue(metric.referenceRange.max, metric.unit)}
          {pace ? ` at ${pace}` : ''}
        </span>
        {subtitle && <span className="text-[#888888]">{subtitle}</span>}
      </div>
    </div>
  )
}

function formatValue(value: number, unit: string): string {
  if (unit === 'degrees' || unit === '°') return `${value.toFixed(1)}°`
  if (unit === '% body height') return `${value.toFixed(1)}%`
  if (unit === '%') return `${value.toFixed(0)}%`
  if (unit === 'ratio') return value.toFixed(3)
  if (unit === 'spm') return `${Math.round(value)} spm`
  if (unit === 'ms') return `${Math.round(value)} ms`
  return value.toFixed(2)
}

function leanSourceLabel(source: string): string {
  if (source === 'ankles') return 'from ankles (good)'
  if (source === 'waist') return 'from waist (check form)'
  return 'mixed source'
}

// Converts a "% body height" metric value to approximate real centimetres.
// Pose-estimated shoulder-to-ankle distance ≈ 78% of true body height,
// so: real_cm = (percent / 100) × (heightCm × 0.78)
function toCm(percent: number, heightCm: number): string {
  return `≈ ${Math.round((percent / 100) * heightCm * 0.78)} cm`
}

export default function BiomechanicsCard({ biomechanics, heightCm }: BiomechanicsCardProps) {
  const {
    footPlacement,
    footStrikeType,
    trunkLean,
    verticalOscillation,
    cadence,
    groundContactTime,
    contactTimeAsymmetry,
    footPlacementAsymmetry,
    gaitCyclesDetected,
  } = biomechanics

  const hasMetrics = footPlacement || trunkLean || verticalOscillation || cadence || groundContactTime

  if (!hasMetrics && !footStrikeType) return null

  return (
    <section className="border border-[#1A1A1A] bg-[#0A0A0A] p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Biomechanics</h2>
        <span className="text-xs text-[#444444]">
          {gaitCyclesDetected} gait cycle{gaitCyclesDetected !== 1 ? 's' : ''} detected
        </span>
      </div>

      {/* Foot strike callout */}
      {footStrikeType && (
        <div className="flex items-center gap-3 px-3 py-2.5 bg-[#1A1A1A] border border-[#1A1A1A]">
          <div>
            <p className="text-sm font-medium text-white capitalize">
              {footStrikeType.type} strike
            </p>
            <p className="text-xs text-[#888888]">
              {footStrikeType.confidence} confidence
              {footStrikeType.contactCount > 0 &&
                ` · ${footStrikeType.contactCount} contact${footStrikeType.contactCount !== 1 ? 's' : ''} analyzed`}
            </p>
          </div>
        </div>
      )}

      {/* Metric rows */}
      <div className="space-y-4">
        {cadence && (
          <MetricRow label="Cadence" metric={cadence} />
        )}

        {footPlacement && (
          <MetricRow
            label="Foot placement"
            metric={footPlacement}
            subtitle="ahead of hip"
            cmValue={heightCm ? toCm(footPlacement.value, heightCm) : undefined}
          />
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
            cmValue={heightCm ? toCm(verticalOscillation.value, heightCm) : undefined}
          />
        )}

        {groundContactTime && (
          <MetricRow label="Ground contact time" metric={groundContactTime} />
        )}
      </div>

      {/* Asymmetry section */}
      {(contactTimeAsymmetry || footPlacementAsymmetry) && (
        <div className="border-t border-[#1A1A1A] pt-4 space-y-3">
          <h3 className="text-xs font-medium text-[#444444] uppercase tracking-widest">
            Asymmetry
          </h3>
          <p className="text-xs text-[#444444] leading-relaxed">
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
      className={`px-3 py-2 border ${
        flagged ? 'border-amber-500/30 bg-amber-500/5' : 'border-[#1A1A1A] bg-[#0A0A0A]'
      }`}
    >
      <p className="text-xs text-[#888888]">{label}</p>
      <p className={`text-sm font-mono font-medium ${colors.text}`}>{pct}% diff</p>
    </div>
  )
}
