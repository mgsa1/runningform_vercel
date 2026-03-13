import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DeleteSessionButton from '@/components/DeleteSessionButton'

interface AnalysisResult {
  summary?: { videoQuality?: string }
  form_analysis?: unknown[]
}

interface ResultRow {
  id: string
  result: AnalysisResult
  usefulness_rating: number | null
}

interface SessionRow {
  id: string
  original_filename: string | null
  status: string
  queued_at: string
  analysis_results: ResultRow[] | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; classes: string }> = {
    queued: {
      label: 'Queued',
      classes: 'bg-gray-500/20 text-gray-400',
    },
    processing: {
      label: 'Processing',
      classes: 'bg-blue-500/20 text-blue-400',
    },
    completed: {
      label: 'Complete',
      classes: 'bg-green-500/20 text-green-400',
    },
    failed: {
      label: 'Failed',
      classes: 'bg-red-500/20 text-red-400',
    },
  }
  return map[status] ?? { label: status, classes: 'bg-gray-500/20 text-gray-400' }
}

function qualityBadge(quality: string) {
  const map: Record<string, string> = {
    good: 'bg-green-500/20 text-green-400',
    fair: 'bg-amber-500/20 text-amber-400',
    poor: 'bg-red-500/20 text-red-400',
  }
  return map[quality] ?? 'bg-gray-500/20 text-gray-400'
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function HistoryPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('analysis_sessions')
    .select(
      'id, original_filename, status, queued_at, analysis_results(id, result, usefulness_rating)'
    )
    .eq('user_id', user.id)
    .order('queued_at', { ascending: false })
    .limit(20)

  const sessions = (data ?? []) as SessionRow[]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Analyses</h1>
          <Link
            href="/upload"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Upload new video
          </Link>
        </div>

        {/* ── Empty state ── */}
        {sessions.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <p className="text-4xl">🎥</p>
            <p className="text-gray-400">You haven&apos;t analysed any runs yet.</p>
            <Link
              href="/upload"
              className="inline-block mt-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Upload your first video
            </Link>
          </div>
        )}

        {/* ── Session list ── */}
        {sessions.length > 0 && (
          <ul className="space-y-3">
            {sessions.map((session) => {
              const result = session.analysis_results?.[0] ?? null
              const status = statusBadge(session.status)
              const isComplete = session.status === 'completed'
              const isInProgress =
                session.status === 'queued' || session.status === 'processing'
              const isFailed = session.status === 'failed'

              const href = isComplete
                ? result
                  ? `/results/${result.id}`
                  : null
                : isInProgress
                ? `/sessions/${session.id}/status`
                : null

              const CardInner = (
                <div className="p-4 rounded-lg border border-gray-800 bg-gray-900 space-y-3 hover:border-gray-600 transition-colors">
                  {/* Top row: filename + date */}
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-medium text-white truncate">
                      {session.original_filename ?? 'Untitled video'}
                    </p>
                    <p className="text-xs text-gray-500 shrink-0">
                      {formatDate(session.queued_at)}
                    </p>
                  </div>

                  {/* Badge row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.classes}`}
                    >
                      {status.label}
                    </span>

                    {/* Overall quality */}
                    {isComplete && result?.result?.summary?.videoQuality && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${qualityBadge(result.result.summary.videoQuality.toLowerCase())}`}
                      >
                        {result.result.summary.videoQuality.toLowerCase()} video
                      </span>
                    )}

                    {/* Observation count */}
                    {isComplete && result?.result?.form_analysis != null && (
                      <span className="text-xs text-gray-500">
                        {result.result.form_analysis.length}{' '}
                        {result.result.form_analysis.length === 1
                          ? 'observation'
                          : 'observations'}
                      </span>
                    )}

                    {/* Usefulness rating */}
                    {result?.usefulness_rating != null && (
                      <span
                        className="text-sm"
                        title={result.usefulness_rating === 5 ? 'Rated useful' : 'Rated not useful'}
                      >
                        {result.usefulness_rating === 5 ? '👍' : '👎'}
                      </span>
                    )}
                  </div>
                </div>
              )

              return (
                <li key={session.id} className="relative">
                  {href ? (
                    <Link href={href} className="block">
                      {CardInner}
                    </Link>
                  ) : (
                    CardInner
                  )}
                  {!isComplete && (
                    <div className="absolute bottom-4 right-4">
                      <DeleteSessionButton sessionId={session.id} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
