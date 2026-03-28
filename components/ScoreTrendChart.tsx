'use client'

import { useRouter } from 'next/navigation'

interface DataPoint {
  date: string
  score: number
  resultId: string
}

interface ScoreTrendChartProps {
  dataPoints: DataPoint[]
  height?: number
}

function scoreColor(score: number): string {
  if (score >= 75) return '#22c55e'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

const W = 400
const PAD = { t: 12, r: 20, b: 8, l: 28 }
const INNER_W = W - PAD.l - PAD.r

function toX(i: number, n: number): number {
  if (n <= 1) return PAD.l + INNER_W / 2
  return PAD.l + (i / (n - 1)) * INNER_W
}

function toY(score: number, height: number): number {
  const innerH = height - PAD.t - PAD.b
  return PAD.t + innerH * (1 - score / 100)
}

export default function ScoreTrendChart({ dataPoints, height = 120 }: ScoreTrendChartProps) {
  const router = useRouter()
  const n = dataPoints.length
  if (n === 0) return null

  const refLines = [25, 50, 75]
  const polylinePoints = dataPoints
    .map((d, i) => `${toX(i, n)},${toY(d.score, height)}`)
    .join(' ')

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      {/* Reference lines */}
      {refLines.map((ref) => (
        <g key={ref}>
          <line
            x1={PAD.l}
            y1={toY(ref, height)}
            x2={W - PAD.r}
            y2={toY(ref, height)}
            stroke="#1f2937"
            strokeWidth="1"
          />
          <text
            x={PAD.l - 4}
            y={toY(ref, height)}
            textAnchor="end"
            dominantBaseline="middle"
            fill="#374151"
            fontSize="11"
          >
            {ref}
          </text>
        </g>
      ))}

      {/* Trend line */}
      {n > 1 && (
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.7"
        />
      )}

      {/* Dots */}
      {dataPoints.map((d, i) => {
        const cx = toX(i, n)
        const cy = toY(d.score, height)
        return (
          <g key={d.resultId}>
            <circle cx={cx} cy={cy} r={4} fill={scoreColor(d.score)} stroke="#030712" strokeWidth="1.5" />
            {/* Larger invisible hit target */}
            <circle
              cx={cx}
              cy={cy}
              r={12}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => router.push(`/results/${d.resultId}`)}
            />
          </g>
        )
      })}
    </svg>
  )
}
