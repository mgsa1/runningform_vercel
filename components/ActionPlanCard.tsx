interface ActionPlanCardProps {
  href?: string
}

export default function ActionPlanCard({ href = '#drill-plan' }: ActionPlanCardProps) {
  return (
    <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-6 text-center space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-medium tracking-widest uppercase text-[#888888]">Next step</p>
        <h3 className="text-base font-semibold text-white">Ready to improve?</h3>
        <p className="text-sm text-[#888888]">
          We&apos;ve selected drills tailored to your focus areas below.
        </p>
      </div>
      <a
        href={href}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-white text-black font-semibold text-sm tracking-wide hover:bg-[#E5E5E5] active:scale-[0.98] transition-colors duration-100"
      >
        View Your Custom Drill Plan
        <span aria-hidden="true">↓</span>
      </a>
    </div>
  )
}
