import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const steps = [
  {
    index: '01',
    title: 'Film a short clip',
    body: 'Any phone or action camera. 5-20 seconds of running is all you need.',
  },
  {
    index: '02',
    title: 'Get frame-by-frame analysis',
    body: 'AI examines your stride, arm drive, lean, and posture from extracted frames.',
  },
  {
    index: '03',
    title: 'Practice with matched drills',
    body: 'Specific drills for what needs work — not generic advice.',
  },
]

export default async function LandingPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/history')

  return (
    <div className="min-h-screen flex flex-col">

      {/* Hero */}
      <section className="flex-1 relative">
        <div className="min-h-[calc(100vh-4rem)] lg:grid lg:grid-cols-2">

          {/* Left: text */}
          <div className="flex items-center px-5 sm:px-8 lg:px-12 pt-16 pb-20 sm:pt-24 sm:pb-28">
            <div className="w-full">
              <p className="text-[11px] font-medium tracking-widest uppercase text-[#2DD4BF] mb-6">
                AI Running Coach
              </p>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none">
                Run Better.
              </h1>

              <p className="mt-6 text-base sm:text-lg text-[#9898A8] max-w-md leading-relaxed">
                You bring the miles.
                <br />
                AI and biomechanics bring the coaching.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-6 py-2.5 min-h-[44px] bg-[#2DD4BF] text-[#111116] font-semibold text-sm rounded-xl hover:bg-[#14B8A6] active:scale-[0.98] transition-all duration-150"
                >
                  Get started free
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-2.5 min-h-[44px] border border-[#3A3A48] text-[#F0F0F5] font-medium text-sm rounded-xl hover:bg-[#22222C] hover:border-[#5C5C6E] active:scale-[0.98] transition-all duration-150"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>

          {/* Right: video (lg+ only) */}
          <div className="hidden lg:block relative overflow-hidden">
            <video
              src="/hero_video.mp4"
              autoPlay
              loop
              muted
              playsInline
              poster="/hero.jpg"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Left-edge fade */}
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#111116] to-transparent pointer-events-none" />
          </div>

          {/* Metrics marquee — pinned to bottom of hero */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-[#2A2A35]/60 bg-[#111116]/80 backdrop-blur-sm">
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#111116] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#111116] to-transparent z-10 pointer-events-none" />
            <div className="flex animate-marquee py-4">
              {[0, 1].map((copy) => (
                <div key={copy} className="flex shrink-0 items-center gap-6 pr-6">
                  {['Cadence', 'Lean Angle', 'Overstride', 'Ground Contact Time', 'Hip Drop', 'Arm Drive', 'Foot Strike', 'Vertical Oscillation'].map((metric) => (
                    <span key={metric} className="text-[11px] font-medium tracking-widest uppercase text-[#5C5C6E] whitespace-nowrap flex items-center gap-6">
                      {metric}
                      <span className="text-[#2A2A35]">&middot;</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* How it works */}
      <section className="px-5 sm:px-8 lg:px-12 pb-14 sm:pb-16">
        <div className="max-w-4xl mx-auto space-y-3">
          {steps.map(({ index, title, body }) => (
            <div
              key={index}
              className="flex items-start gap-5 bg-[#1A1A22] border border-[#2A2A35] rounded-2xl p-5"
            >
              <span className="text-sm font-mono font-semibold text-[#2DD4BF] pt-0.5 w-6 shrink-0">
                {index}
              </span>
              <div>
                <p className="text-base font-semibold">{title}</p>
                <p className="mt-1 text-sm text-[#9898A8] leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
