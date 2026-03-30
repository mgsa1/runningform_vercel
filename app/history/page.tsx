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
    queued:     { label: 'Queued',     classes: 'bg-[#2A2A35] text-[#9898A8]' },
    processing: { label: 'Processing', classes: 'bg-teal-400/12 text-teal-400' },
    completed:  { label: 'Complete',   classes: 'bg-emerald-400/12 text-emerald-400' },
    failed:     { label: 'Failed',     classes: 'bg-red-400/12 text-red-400' },
  }
  return map[status] ?? { label: status, classes: 'bg-[#2A2A35] text-[#9898A8]' }
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

  const latestScore   = completedPoints.at(-1)?.score ?? null
  const previousScore = completedPoints.length > 1 ? completedPoints.at(-2)!.score : null
  const bestScore     = completedPoints.length > 0 ? Math.max(...completedPoints.map(d => d.score)) : null

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-12 py-10 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Analyses</h1>
          <Link
            href="/upload"
            className="hidden md:inline-flex items-center justify-center px-6 py-2.5 min-h-[44px] bg-[#F0F0F5] text-[#111116] font-semibold text-sm rounded-xl hover:bg-[#D8D8E0] active:scale-[0.98] transition-all duration-150"
          >
            Upload new
          </Link>
        </div>

        {/* ── Zero-session empty state ── */}
        {sessions.length === 0 && (
          <div className="py-16 text-center space-y-4">
            <p className="text-lg font-semibold">No runs analyzed yet.</p>
            <p className="text-sm text-[#9898A8]">Upload your first video to get started.</p>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center mt-4 px-6 py-2.5 min-h-[44px] bg-[#2DD4BF] text-[#111116] font-semibold text-sm rounded-xl hover:bg-[#14B8A6] active:scale-[0.98] transition-all duration-150"
            >
              Upload a video
            </Link>
          </div>
        )}

        {/* ── Progress dashboard + session list ── */}
        {sessions.length > 0 && (
          <>
            {/* ── Score summary + sparkline ── */}
            {latestScore !== null && (
              <div className="border border-[#2A2A35] bg-[#1A1A22] rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-6">
                  {/* Left: score ring + stats */}
                  <div className="flex items-center gap-4 shrink-0">
                    <FormScoreRing score={latestScore} size="md" />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">Latest score</p>
                        <ScoreDelta current={latestScore} previous={previousScore} />
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#9898A8]">
                        {bestScore !== null && (
                          <span>Best: <span className="text-[#F0F0F5] font-medium">{bestScore}</span></span>
                        )}
                        <span>
                          Analyses: <span className="text-[#F0F0F5] font-medium">{completedPoints.length}</span>
                        </span>
                      </div>
                      {completedPoints.length === 1 && (
                        <p className="text-xs text-[#5C5C6E]">
                          Upload another video to start tracking your progress
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: sparkline */}
                  <div className="flex-1 min-w-0 relative">
                    <ScoreTrendChart
                      dataPoints={completedPoints}
                      height={completedPoints.length === 1 ? 72 : 100}
                    />
                    {completedPoints.length === 1 && (
                      <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
                        <p className="text-xs text-[#5C5C6E]">
                          After your next analysis you&apos;ll see your trend
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Session list ── */}
            <ul className="divide-y divide-[#2A2A35] border-t border-[#2A2A35]">
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

                // Previous completed score for delta
                const prevResult = sessions
                  .slice(idx + 1)
                  .find(s => s.status === 'completed' && s.analysis_results?.[0])
                  ?.analysis_results?.[0] ?? null
                const prevScore = prevResult ? resolveScore(prevResult) : null

                const CardInner = (
                  <div className="py-4 flex items-center gap-4 group">
                    {/* Score ring — only for completed */}
                    {cardScore !== null && (
                      <div className="shrink-0">
                        <FormScoreRing score={cardScore} size="sm" />
                      </div>
                    )}
                    {/* Placeholder width when no ring */}
                    {cardScore === null && <div className="w-12 shrink-0" />}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-medium truncate group-hover:text-[#9898A8] transition-colors duration-150">
                          {session.original_filename ?? 'Untitled video'}
                        </p>
                        <p className="text-xs text-[#5C5C6E] shrink-0 pt-0.5">
                          {formatDate(session.queued_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.classes}`}>
                          {badge.label}
                        </span>
                        {cardScore !== null && (
                          <ScoreDelta current={cardScore} previous={prevScore} />
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

                    {!isComplete && (
                      <div className="shrink-0">
                        <DeleteSessionButton sessionId={session.id} />
                      </div>
                    )}
                  </div>
                )

                return (
                  <li key={session.id}>
                    {href ? <Link href={href} className="block hover:bg-[#1A1A22] rounded-xl px-2 -mx-2 transition-colors duration-150">{CardInner}</Link> : CardInner}
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
