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

const ACCENT = '#2DD4BF' // teal accent
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
      preserveAspectRatio="xMidYMid meet"
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
            stroke="#2A2A35"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text
            x={PAD.l - 4}
            y={toY(ref, height)}
            textAnchor="end"
            dominantBaseline="middle"
            fill="#5C5C6E"
            fontSize="11"
            fontFamily="monospace"
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
          stroke={ACCENT}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.8"
        />
      )}

      {/* Dots */}
      {dataPoints.map((d, i) => {
        const cx = toX(i, n)
        const cy = toY(d.score, height)
        const isLatest = i === n - 1
        return (
          <g key={d.resultId}>
            <circle cx={cx} cy={cy} r={isLatest ? 5 : 3.5} fill={ACCENT} stroke="#1A1A22" strokeWidth="2" />
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
