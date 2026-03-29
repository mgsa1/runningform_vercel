type Size = 'sm' | 'md' | 'lg'

interface FormScoreRingProps {
  score: number
  size?: Size
}

const SIZES: Record<Size, number> = { sm: 44, md: 80, lg: 120 }

// White stroke — opacity dims for very low scores
function getStrokeOpacity(score: number) {
  if (score >= 30) return 1
  return 0.6
}

export default function FormScoreRing({ score, size = 'lg' }: FormScoreRingProps) {
  const px = SIZES[size]
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const opacity = getStrokeOpacity(score)

  return (
    <div className="flex flex-col items-center shrink-0">
      <svg
        width={px}
        height={px}
        viewBox="0 0 120 120"
      >
        {/* Background track */}
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#1A1A1A" strokeWidth="8" />
        {/* Score arc */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={opacity}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        {/* Score number */}
        <text x="60" y="55" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="32" fontWeight="700">
          {score}
        </text>
        <text x="60" y="78" textAnchor="middle" dominantBaseline="middle" fill="#444444" fontSize="12">
          / 100
        </text>
      </svg>
    </div>
  )
}
