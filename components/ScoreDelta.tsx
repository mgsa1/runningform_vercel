interface ScoreDeltaProps {
  current: number
  previous: number | null
}

export default function ScoreDelta({ current, previous }: ScoreDeltaProps) {
  if (previous === null) return null
  const delta = current - previous
  if (delta === 0) return <span className="text-xs text-[#5C5C6E] font-medium">same</span>
  const up = delta > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      {up ? '↑' : '↓'}{Math.abs(delta)}
    </span>
  )
}
