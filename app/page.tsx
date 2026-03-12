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

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-xl">
          Improve your running form with AI
        </h1>

        <p className="mt-5 text-lg text-gray-400 max-w-md">
          Upload a short video of your run. Get instant, frame-by-frame feedback
          on your form and personalised drill recommendations.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/signup"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold rounded-lg transition-colors"
          >
            Sign in
          </Link>
        </div>

        <ul className="mt-16 grid sm:grid-cols-3 gap-6 text-left max-w-2xl w-full">
          {[
            {
              icon: '🎥',
              title: 'Upload a clip',
              body: 'MP4, MOV or WebM — any phone or action camera footage works.',
            },
            {
              icon: '🤖',
              title: 'AI analysis',
              body: 'Claude analyses your stride, arm drive, lean, and more from extracted frames.',
            },
            {
              icon: '🏃',
              title: 'Targeted drills',
              body: 'Get matched drills based on exactly what needs work in your form.',
            },
          ].map(({ icon, title, body }) => (
            <li
              key={title}
              className="p-5 rounded-xl border border-gray-800 bg-gray-900 space-y-2"
            >
              <span className="text-2xl">{icon}</span>
              <p className="font-semibold text-white">{title}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{body}</p>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-xs text-gray-600 max-w-sm">
          AI-generated analysis only. Not a substitute for advice from a
          qualified running coach or physiotherapist.
        </p>

      </div>
    </div>
  )
}
