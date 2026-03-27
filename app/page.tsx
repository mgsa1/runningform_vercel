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

        <ol className="mt-16 flex flex-col sm:flex-row max-w-2xl w-full text-left">
          {[
            {
              num: '01',
              title: 'Upload a clip',
              body: 'MP4, MOV or WebM — any phone or action camera footage works.',
            },
            {
              num: '02',
              title: 'AI analysis',
              body: 'Claude analyses your stride, arm drive, lean, and more from extracted frames.',
            },
            {
              num: '03',
              title: 'Targeted drills',
              body: 'Get matched drills based on exactly what needs work in your form.',
            },
          ].map(({ num, title, body }) => (
            <li
              key={title}
              className="flex-1 p-5 border-t-2 border-blue-600"
            >
              <span className="text-xs font-mono text-blue-500 tracking-widest">{num}</span>
              <p className="mt-2 font-semibold text-white">{title}</p>
              <p className="mt-1 text-sm text-gray-400 leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>

        <p className="mt-12 text-xs text-gray-600 max-w-sm">
          AI-generated analysis only. Not a substitute for advice from a
          qualified running coach or physiotherapist.
        </p>

      </div>
    </div>
  )
}
