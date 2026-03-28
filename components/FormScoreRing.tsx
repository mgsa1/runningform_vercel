type Size = 'sm' | 'md' | 'lg'

interface FormScoreRingProps {
  score: number
  size?: Size
}

const SIZES: Record<Size, number> = { sm: 44, md: 80, lg: 120 }

function getScoreColor(score: number) {
  if (score >= 75) return { stroke: '#22c55e', text: 'text-green-400' }
  if (score >= 50) return { stroke: '#f59e0b', text: 'text-amber-400' }
  return { stroke: '#ef4444', text: 'text-red-400' }
}

export default function FormScoreRing({ score, size = 'lg' }: FormScoreRingProps) {
  const px = SIZES[size]
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const { stroke } = getScoreColor(score)

  return (
    <div className="flex flex-col items-center shrink-0">
      <svg
        width={px}
        height={px}
        viewBox="0 0 120 120"
        className="drop-shadow-lg"
      >
        {/* Background track */}
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#1f2937" strokeWidth="8" />
        {/* Score arc */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
        {/* Score number */}
        <text x="60" y="55" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="32" fontWeight="700">
          {score}
        </text>
        <text x="60" y="78" textAnchor="middle" dominantBaseline="middle" fill="#6b7280" fontSize="12">
          / 100
        </text>
      </svg>
    </div>
  )
}
