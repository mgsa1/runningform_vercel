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
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{title}</h3>
      {items.map((item, i) => (
        <div
          key={i}
          className="p-4 rounded-lg border border-gray-800 bg-gray-900 space-y-1.5"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span aria-label={item.status === 'good' ? 'Good' : 'Needs work'}>
              {item.status === 'good' ? '🟢' : '🟡'}
            </span>
            <span className="font-medium text-white text-sm">{item.trait}</span>
            {item.confidence !== 'high' && (
              <span
                className={`ml-auto text-xs ${confidenceColor[item.confidence] ?? 'text-gray-400'}`}
              >
                {item.confidence} confidence
              </span>
            )}
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{item.description}</p>
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
