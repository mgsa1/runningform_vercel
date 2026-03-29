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
    queued:     { label: 'Queued',     classes: 'bg-[#1A1A1A] text-[#888888]' },
    processing: { label: 'Processing', classes: 'bg-[#1A1A1A] text-white' },
    completed:  { label: 'Complete',   classes: 'bg-[#1A1A1A] text-green-400' },
    failed:     { label: 'Failed',     classes: 'bg-[#1A1A1A] text-red-400' },
  }
  return map[status] ?? { label: status, classes: 'bg-[#1A1A1A] text-[#888888]' }
}

function qualityBadge(quality: string) {
  const map: Record<string, string> = {
    good: 'bg-[#1A1A1A] text-green-400',
    fair: 'bg-[#1A1A1A] text-amber-400',
    poor: 'bg-[#1A1A1A] text-red-400',
  }
  return map[quality] ?? 'bg-[#1A1A1A] text-[#888888]'
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
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-12 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Your Analyses</h1>
          <Link
            href="/upload"
            className="hidden md:inline-flex items-center justify-center px-6 py-2 min-h-[40px] bg-white text-black font-semibold text-sm tracking-wide hover:bg-[#E5E5E5] transition-colors duration-100"
          >
            Upload new
          </Link>
        </div>

        {/* ── Zero-session empty state ── */}
        {sessions.length === 0 && (
          <div className="py-24 text-center space-y-4">
            <p className="text-8xl font-extrabold text-[#1A1A1A] select-none">0</p>
            <p className="text-xl font-semibold text-white">No runs analyzed yet.</p>
            <p className="text-sm text-[#888888]">Upload your first video to get started.</p>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center mt-4 px-8 py-3 min-h-[44px] bg-white text-black font-semibold text-sm tracking-wide hover:bg-[#E5E5E5] transition-colors duration-100"
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
              <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-6 space-y-4">
                {/* Summary strip */}
                <div className="flex items-center gap-5">
                  <FormScoreRing score={latestScore} size="md" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">Latest score</p>
                      <ScoreDelta current={latestScore} previous={previousScore} />
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#888888]">
                      {bestScore !== null && (
                        <span>Best: <span className="text-white font-medium">{bestScore}</span></span>
                      )}
                      <span>
                        Analyses: <span className="text-white font-medium">{completedPoints.length}</span>
                      </span>
                    </div>
                    {completedPoints.length === 1 && (
                      <p className="text-xs text-[#444444]">
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
                      <p className="text-xs text-[#444444]">
                        After your next analysis you&apos;ll see your trend
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Session list ── */}
            <ul className="divide-y divide-[#1A1A1A] border-t border-[#1A1A1A]">
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
                  <div className="py-5 flex items-center gap-4 group">
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
                        <p className="text-sm font-medium text-white truncate group-hover:text-[#888888] transition-colors duration-100">
                          {session.original_filename ?? 'Untitled video'}
                        </p>
                        <p className="text-xs text-[#444444] shrink-0 pt-0.5">
                          {formatDate(session.queued_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`px-2 py-0.5 rounded-sm text-xs font-medium tracking-wide ${badge.classes}`}>
                          {badge.label}
                        </span>
                        {cardScore !== null && (
                          <ScoreDelta current={cardScore} previous={prevScore} />
                        )}
                        {isComplete && result?.result?.summary?.videoQuality && (
                          <span className={`px-2 py-0.5 rounded-sm text-xs font-medium capitalize ${qualityBadge(result.result.summary.videoQuality.toLowerCase())}`}>
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

                    {!isComplete && (
                      <div className="shrink-0">
                        <DeleteSessionButton sessionId={session.id} />
                      </div>
                    )}
                  </div>
                )

                return (
                  <li key={session.id}>
                    {href ? <Link href={href} className="block">{CardInner}</Link> : CardInner}
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
