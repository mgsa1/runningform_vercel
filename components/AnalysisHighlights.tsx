interface AnalysisHighlightsProps {
  wins: string[]
  focusAreas: string[]
}

export default function AnalysisHighlights({ wins, focusAreas }: AnalysisHighlightsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {wins.length > 0 && (
        <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 space-y-2">
          <h3 className="text-sm font-semibold text-green-400">What&apos;s going well</h3>
          <ul className="space-y-2">
            {wins.map((win, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300 leading-snug">
                <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                {win}
              </li>
            ))}
          </ul>
        </div>
      )}

      {focusAreas.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
          <h3 className="text-sm font-semibold text-amber-400">Focus areas</h3>
          <ul className="space-y-2">
            {focusAreas.map((area, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300 leading-snug">
                <span className="text-amber-500 shrink-0 mt-0.5">→</span>
                {area}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
