interface BodyDetail {
  trait: string
  status: 'good' | 'needs_work'
  description: string
  confidence: 'high' | 'medium' | 'low'
}

interface AnalysisDetailsProps {
  upperBody?: BodyDetail[]
  lowerBody?: BodyDetail[]
}

const confidenceColor: Record<string, string> = {
  medium: 'text-amber-400',
  low: 'text-red-400',
}

function BodySection({ title, items }: { title: string; items: BodyDetail[] }) {
  if (!items?.length) return null
  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-medium tracking-widest uppercase text-[#5C5C6E]">{title}</h3>
      {items.map((item, i) => (
        <div
          key={i}
          className="p-4 border border-[#2A2A35] bg-[#1A1A22] rounded-2xl space-y-1.5"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.status === 'good' ? 'bg-emerald-400' : 'bg-amber-400'}`}
              aria-label={item.status === 'good' ? 'Good' : 'Needs work'}
            />
            <span className="font-medium text-sm">{item.trait}</span>
            {item.confidence !== 'high' && (
              <span
                className={`ml-auto text-xs ${confidenceColor[item.confidence] ?? 'text-[#9898A8]'}`}
              >
                {item.confidence} confidence
              </span>
            )}
          </div>
          <p className="text-sm text-[#9898A8] leading-relaxed">{item.description}</p>
        </div>
      ))}
    </div>
  )
}

export default function AnalysisDetails({
  upperBody = [],
  lowerBody = [],
}: AnalysisDetailsProps) {
  if (!upperBody?.length && !lowerBody?.length) return null

  return (
    <section className="space-y-6">
      <BodySection title="Upper Body" items={upperBody} />
      <BodySection title="Lower Body" items={lowerBody} />
    </section>
  )
}
