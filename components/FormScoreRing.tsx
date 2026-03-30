type Size = 'sm' | 'md' | 'lg'

interface FormScoreRingProps {
  score: number
  size?: Size
}

const SIZES: Record<Size, number> = { sm: 44, md: 80, lg: 96 }

function getStrokeColor(score: number): string {
  if (score >= 75) return '#34D399' // emerald-400
  if (score >= 50) return '#FBBF24' // amber-400
  if (score >= 25) return '#FB923C' // orange-400
  return '#F87171'                  // red-400
}

export default function FormScoreRing({ score, size = 'lg' }: FormScoreRingProps) {
  const px = SIZES[size]
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const strokeColor = getStrokeColor(score)

  return (
    <div className="flex flex-col items-center shrink-0">
      <svg
        width={px}
        height={px}
        viewBox="0 0 120 120"
      >
        {/* Background track */}
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#2A2A35" strokeWidth="6" />
        {/* Score arc */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 800ms ease-out' }}
        />
        {/* Score number */}
        <text x="60" y="55" textAnchor="middle" dominantBaseline="middle" fill="#F0F0F5" fontSize="32" fontWeight="700">
          {score}
        </text>
        <text x="60" y="78" textAnchor="middle" dominantBaseline="middle" fill="#5C5C6E" fontSize="12">
          / 100
        </text>
      </svg>
    </div>
  )
}
