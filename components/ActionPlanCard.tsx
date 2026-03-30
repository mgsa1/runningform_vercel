interface ActionPlanCardProps {
  href?: string
}

export default function ActionPlanCard({ href = '#drill-plan' }: ActionPlanCardProps) {
  return (
    <div className="border border-[#2A2A35] bg-[#1A1A22] rounded-2xl p-6 text-center space-y-4">
      <div className="space-y-1">
        <p className="text-[11px] font-medium tracking-widest uppercase text-[#5C5C6E]">Next step</p>
        <h3 className="text-base font-semibold">Ready to improve?</h3>
        <p className="text-sm text-[#9898A8]">
          We&apos;ve selected drills tailored to your focus areas below.
        </p>
      </div>
      <a
        href={href}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-[#F0F0F5] text-[#111116] font-semibold text-sm rounded-xl hover:bg-[#D8D8E0] active:scale-[0.98] transition-all duration-150"
      >
        View Your Custom Drill Plan
        <span aria-hidden="true">↓</span>
      </a>
    </div>
  )
}
