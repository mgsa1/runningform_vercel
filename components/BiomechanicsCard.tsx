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

const assessmentColors: Record<string, { text: string }> = {
  good: { text: 'text-emerald-300' },
  moderate: { text: 'text-amber-300' },
  significant: { text: 'text-orange-400' },
}


function RangeBar({ metric }: { metric: MeasuredMetric }) {
  const { value, referenceRange } = metric
  const rangeSpan = referenceRange.max - referenceRange.min

  const barMin = 0
  const barMax = Math.max(
    referenceRange.max + rangeSpan * 0.8,
    value * 1.15
  )

  const toPercent = (v: number) =>
    Math.min(100, Math.max(0, ((v - barMin) / (barMax - barMin)) * 100))

  const goodStart = toPercent(referenceRange.min)
  const goodEnd = toPercent(referenceRange.max)
  const markerPos = toPercent(value)

  const margin = rangeSpan * 0.1
  let dotColor = 'bg-emerald-400'
  if (value < referenceRange.min - margin || value > referenceRange.max + margin) {
    dotColor = 'bg-orange-400'
  } else if (value < referenceRange.min || value > referenceRange.max) {
    dotColor = 'bg-amber-400'
  }

  return (
    <div className="relative h-1.5 bg-[#22222C] rounded-full overflow-hidden">
      {/* Good zone */}
      <div
        className="absolute h-full bg-emerald-400/20"
        style={{ left: `${goodStart}%`, width: `${goodEnd - goodStart}%` }}
      />
      {/* Value dot */}
      <div
        className={`absolute top-1/2 w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-[#1A1A22]`}
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
        <span className="text-sm font-medium truncate">{label}</span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-sm font-mono font-medium">
            {formatValue(metric.value, metric.unit)}
          </span>
          {cmValue && <span className="text-xs text-[#5C5C6E]">{cmValue}</span>}
        </span>
      </div>
      <RangeBar metric={metric} />
      <div className="flex items-center justify-between text-xs text-[#5C5C6E]">
        <span>
          Range: {formatValue(metric.referenceRange.min, metric.unit)} –{' '}
          {formatValue(metric.referenceRange.max, metric.unit)}
          {pace ? ` at ${pace}` : ''}
        </span>
        {subtitle && <span className="text-[#9898A8]">{subtitle}</span>}
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
    <section className="border border-[#2A2A35] bg-[#1A1A22] rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Biomechanics</h2>
        <span className="text-xs text-[#5C5C6E]">
          {gaitCyclesDetected} gait cycle{gaitCyclesDetected !== 1 ? 's' : ''} detected
        </span>
      </div>

      {/* Foot strike callout */}
      {footStrikeType && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#22222C] rounded-xl border border-[#2A2A35]">
          <div>
            <p className="text-sm font-medium capitalize">
              {footStrikeType.type} strike
            </p>
            <p className="text-xs text-[#9898A8]">
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
        <div className="border-t border-[#2A2A35] pt-4 space-y-3">
          <h3 className="text-[11px] font-medium tracking-widest uppercase text-[#5C5C6E]">
            Asymmetry
          </h3>
          <p className="text-xs text-[#5C5C6E] leading-relaxed">
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
      className={`px-3 py-2 rounded-xl border ${
        flagged ? 'border-amber-400/30 bg-amber-400/5' : 'border-[#2A2A35] bg-[#1A1A22]'
      }`}
    >
      <p className="text-xs text-[#9898A8]">{label}</p>
      <p className={`text-sm font-mono font-medium ${colors.text}`}>{pct}% diff</p>
    </div>
  )
}
