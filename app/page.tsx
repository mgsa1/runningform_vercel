import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/history')

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">

        <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight max-w-xl">
          Improve your running form with AI
        </h1>

        <p className="mt-5 text-lg text-gray-400 max-w-md">
          Upload a 30-second video. Get AI coaching on your stride in under a minute.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/signup"
            className="flex items-center justify-center px-8 py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center px-8 py-3 min-h-[44px] border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold rounded-lg transition-colors"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-16 max-w-md w-full text-left space-y-6">
          {[
            {
              title: 'Film a short clip',
              body: 'Any phone or action camera. 30 seconds of running is all you need.',
            },
            {
              title: 'Get frame-by-frame analysis',
              body: 'AI examines your stride, arm drive, lean, and posture from extracted frames.',
            },
            {
              title: 'Practice with matched drills',
              body: 'Specific drills for what needs work — not generic advice.',
            },
          ].map(({ title, body }, i) => (
            <div key={title} className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/10 text-blue-400 text-sm font-medium flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm text-gray-400 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-xs text-gray-600 max-w-sm">
          AI-generated analysis only. Not a substitute for advice from a
          qualified running coach or physiotherapist.
        </p>

      </div>
    </div>
  )
}
