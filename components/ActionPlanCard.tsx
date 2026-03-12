interface ActionPlanCardProps {
  href?: string
}

export default function ActionPlanCard({ href = '#drill-plan' }: ActionPlanCardProps) {
  return (
    <div className="p-6 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 text-center space-y-3">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Next step</p>
        <h3 className="text-base font-semibold text-white">Ready to improve?</h3>
        <p className="text-sm text-gray-400">
          We&apos;ve selected drills tailored to your focus areas below.
        </p>
      </div>
      <a
        href={href}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm transition-colors"
      >
        View Your Custom Drill Plan
        <span aria-hidden="true">↓</span>
      </a>
    </div>
  )
}
