interface AnalysisHighlightsProps {
  goodTraits: { trait: string; observation: string }[]
}

export default function AnalysisHighlights({
  goodTraits,
}: AnalysisHighlightsProps) {
  if (goodTraits.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-green-400">
        Doing well
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {goodTraits.map((item, i) => (
          <div
            key={i}
            className="flex gap-3 items-start p-3 rounded-lg bg-green-500/5 border border-green-500/15"
          >
            <div className="mt-0.5 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <svg
                className="w-3 h-3 text-green-400"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 6l3 3 5-5" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-green-300">
                {item.trait}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                {item.observation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
