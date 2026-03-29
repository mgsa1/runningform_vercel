interface AnalysisHighlightsProps {
  goodTraits: { trait: string; observation: string }[]
}

export default function AnalysisHighlights({
  goodTraits,
}: AnalysisHighlightsProps) {
  if (goodTraits.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium tracking-widest uppercase text-[#444444]">
        Doing well
      </h3>
      <div className="border-t border-[#1A1A1A]">
        {goodTraits.map((item, i) => (
          <div
            key={i}
            className="flex gap-4 items-start py-4 border-b border-[#1A1A1A]"
          >
            <svg
              className="mt-0.5 w-4 h-4 text-[#888888] shrink-0"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 6l3 3 5-5" />
            </svg>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">
                {item.trait}
              </p>
              <p className="text-sm text-[#888888] mt-0.5 line-clamp-2">
                {item.observation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
