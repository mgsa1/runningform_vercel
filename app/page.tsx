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
      <section className="flex-1 px-6 sm:px-10 lg:px-16 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-medium tracking-widest uppercase text-[#888888] mb-6">
            AI Running Coach
          </p>

          <h1 className="text-6xl sm:text-8xl lg:text-9xl font-extrabold tracking-tight leading-none text-white">
            Run Better.
          </h1>

          <p className="mt-8 text-lg sm:text-xl text-[#888888] max-w-lg leading-relaxed">
            If you&apos;re running, you&apos;re already doing it right.
            <br />
            Let&apos;s see how to make it even better.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3 min-h-[44px] bg-white text-black font-semibold text-sm tracking-wide hover:bg-[#E5E5E5] transition-colors duration-100"
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3 min-h-[44px] border border-white text-white font-semibold text-sm tracking-wide hover:bg-white hover:text-black transition-colors duration-100"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 sm:px-10 lg:px-16 pb-24 sm:pb-32">
        <div className="max-w-5xl mx-auto">
          <div className="border-t border-[#1A1A1A]">
            {steps.map(({ index, title, body }) => (
              <div
                key={index}
                className="flex items-start gap-8 py-8 border-b border-[#1A1A1A]"
              >
                <span className="text-xs font-medium tracking-widest text-[#444444] pt-0.5 w-6 shrink-0">
                  {index}
                </span>
                <div>
                  <p className="text-base font-semibold text-white">{title}</p>
                  <p className="mt-1 text-sm text-[#888888] leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <p className="px-6 pb-8 text-xs text-[#444444] max-w-md">
        AI-generated analysis only. Not a substitute for advice from a qualified
        running coach or physiotherapist.
      </p>

    </div>
  )
}
