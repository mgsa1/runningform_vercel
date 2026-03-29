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
      <h3 className="text-xs font-medium tracking-widest uppercase text-[#444444]">{title}</h3>
      {items.map((item, i) => (
        <div
          key={i}
          className="p-4 border border-[#1A1A1A] bg-[#0A0A0A] space-y-1.5"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.status === 'good' ? 'bg-green-400' : 'bg-amber-400'}`}
              aria-label={item.status === 'good' ? 'Good' : 'Needs work'}
            />
            <span className="font-medium text-white text-sm">{item.trait}</span>
            {item.confidence !== 'high' && (
              <span
                className={`ml-auto text-xs ${confidenceColor[item.confidence] ?? 'text-[#888888]'}`}
              >
                {item.confidence} confidence
              </span>
            )}
          </div>
          <p className="text-sm text-[#888888] leading-relaxed">{item.description}</p>
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
