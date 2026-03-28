import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DeleteSessionButton from '@/components/DeleteSessionButton'
import FormScoreRing from '@/components/FormScoreRing'
import ScoreDelta from '@/components/ScoreDelta'
import ScoreTrendChart from '@/components/ScoreTrendChart'
import { computeFormScore } from '@/lib/scoring'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalysisResult {
  summary?: { videoQuality?: string }
  form_analysis?: { trait: string; status: string; severity: string }[]
}

interface ResultRow {
  id: string
  result: AnalysisResult
  form_score: number | null
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
    queued:     { label: 'Queued',     classes: 'bg-gray-500/20 text-gray-300' },
    processing: { label: 'Processing', classes: 'bg-blue-500/20 text-blue-300' },
    completed:  { label: 'Complete',   classes: 'bg-green-500/20 text-green-300' },
    failed:     { label: 'Failed',     classes: 'bg-red-500/20 text-red-300' },
  }
  return map[status] ?? { label: status, classes: 'bg-gray-500/20 text-gray-300' }
}

function qualityBadge(quality: string) {
  const map: Record<string, string> = {
    good: 'bg-green-500/20 text-green-300',
    fair: 'bg-amber-500/20 text-amber-300',
    poor: 'bg-red-500/20 text-red-300',
  }
  return map[quality] ?? 'bg-gray-500/20 text-gray-300'
}

// form_score may be null for sessions analysed before the migration — fall back to computing it
function resolveScore(row: ResultRow): number {
  if (row.form_score != null) return row.form_score
  return computeFormScore(row.result?.form_analysis ?? [])
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function HistoryPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('analysis_sessions')
    .select(
      'id, original_filename, status, queued_at, analysis_results(id, result, form_score, usefulness_rating)'
    )
    .eq('user_id', user.id)
    .order('queued_at', { ascending: false })
    .limit(20)

  const sessions = (data ?? []) as SessionRow[]

  // Build sparkline data from completed sessions, oldest → newest
  const completedPoints = sessions
    .filter(s => s.status === 'completed' && s.analysis_results?.[0])
    .map(s => ({
      date: s.queued_at,
      score: resolveScore(s.analysis_results![0]),
      resultId: s.analysis_results![0].id,
    }))
    .reverse()

  const latestScore  = completedPoints.at(-1)?.score ?? null
  const previousScore = completedPoints.length > 1 ? completedPoints.at(-2)!.score : null
  const bestScore    = completedPoints.length > 0 ? Math.max(...completedPoints.map(d => d.score)) : null

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">Your Analyses</h1>
          <Link
            href="/upload"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Upload new video
          </Link>
        </div>

        {/* ── Zero-session empty state ── */}
        {sessions.length === 0 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3 opacity-50">
              <p className="text-sm font-medium text-gray-300">Form Score</p>
              <div className="h-24 rounded-lg bg-gray-800 flex items-center justify-center">
                <p className="text-sm text-gray-500">Your progress chart will appear here</p>
              </div>
            </div>
            <div className="text-center py-10 space-y-4">
              <p className="text-gray-400">You haven&apos;t analysed any runs yet.</p>
              <Link
                href="/upload"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Upload your first video
              </Link>
            </div>
          </div>
        )}

        {/* ── Progress dashboard + session list ── */}
        {sessions.length > 0 && (
          <>
            {/* ── Score summary + sparkline ── */}
            {latestScore !== null && (
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-4">
                {/* Summary strip */}
                <div className="flex items-center gap-4">
                  <FormScoreRing score={latestScore} size="md" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-200">Latest score</p>
                      <ScoreDelta current={latestScore} previous={previousScore} />
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400">
                      {bestScore !== null && (
                        <span>Best: <span className="text-white font-medium">{bestScore}</span></span>
                      )}
                      <span>
                        Analyses: <span className="text-white font-medium">{completedPoints.length}</span>
                      </span>
                    </div>
                    {completedPoints.length === 1 && (
                      <p className="text-xs text-gray-500">
                        Upload another video to start tracking your progress
                      </p>
                    )}
                  </div>
                </div>

                {/* Sparkline */}
                <div className="relative">
                  <ScoreTrendChart
                    dataPoints={completedPoints}
                    height={completedPoints.length === 1 ? 72 : 100}
                  />
                  {completedPoints.length === 1 && (
                    <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
                      <p className="text-xs text-gray-600">
                        After your next analysis you&apos;ll see your trend
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Session list ── */}
            <ul className="space-y-3">
              {sessions.map((session, idx) => {
                const result = session.analysis_results?.[0] ?? null
                const badge  = statusBadge(session.status)
                const isComplete   = session.status === 'completed'
                const isInProgress = session.status === 'queued' || session.status === 'processing'

                const href = isComplete
                  ? (result ? `/results/${result.id}` : null)
                  : isInProgress
                  ? `/sessions/${session.id}/status`
                  : null

                const cardScore = isComplete && result ? resolveScore(result) : null

                // Previous completed card (older, lower index in array = more recent, so search after idx)
                const prevResult = sessions
                  .slice(idx + 1)
                  .find(s => s.status === 'completed' && s.analysis_results?.[0])
                  ?.analysis_results?.[0] ?? null
                const prevScore = prevResult ? resolveScore(prevResult) : null

                const CardInner = (
                  <div className="p-4 rounded-lg border border-gray-800 bg-gray-900 hover:border-gray-600 transition-colors">
                    <div className="flex items-center gap-3">
                      {/* Score ring — only for completed */}
                      {cardScore !== null && (
                        <div className="shrink-0">
                          <FormScoreRing score={cardScore} size="sm" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Filename + date */}
                        <div className="flex items-start justify-between gap-4">
                          <p className="font-medium text-white text-sm truncate">
                            {session.original_filename ?? 'Untitled video'}
                          </p>
                          <p className="text-xs text-gray-500 shrink-0">
                            {formatDate(session.queued_at)}
                          </p>
                        </div>

                        {/* Badge row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.classes}`}>
                            {badge.label}
                          </span>
                          {cardScore !== null && (
                            <ScoreDelta current={cardScore} previous={prevScore} />
                          )}
                          {isComplete && result?.result?.summary?.videoQuality && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${qualityBadge(result.result.summary.videoQuality.toLowerCase())}`}>
                              {result.result.summary.videoQuality.toLowerCase()} video
                            </span>
                          )}
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
                    </div>
                  </div>
                )

                return (
                  <li key={session.id} className="relative">
                    {href ? <Link href={href} className="block">{CardInner}</Link> : CardInner}
                    {!isComplete && (
                      <div className="absolute bottom-4 right-4">
                        <DeleteSessionButton sessionId={session.id} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}

      </div>
    </div>
  )
}
