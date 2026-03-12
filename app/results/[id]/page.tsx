import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import drillsData from '@/data/drills.json'
import RatingButtons from './RatingButtons'
import AnalysisHero from '@/components/AnalysisHero'
import FrameGallery from '@/components/FrameGallery'
import AnalysisHighlights from '@/components/AnalysisHighlights'


// ── Types ────────────────────────────────────────────────────────────────────

interface FormAnalysisItem {
  trait: string
  status: 'good' | 'needs_work'
  severity: 'critical' | 'moderate' | 'minor' | 'none'
  observation: string
  drill: { name: string | null; why: string | null } | null
}

interface RunnerCoachResult {
  summary: {
    headline: string
    videoQuality: 'Good' | 'Fair' | 'Poor'
    qualityNotes: string
  }
  form_analysis: FormAnalysisItem[]
}

interface Drill {
  id: string
  name: string
  description: string
  instructions: string
  difficulty: string
  tags: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const severityOrder: Record<string, number> = { critical: 0, moderate: 1, minor: 2, none: 3 }

function matchDrill(item: FormAnalysisItem, drills: Drill[]): Drill | null {
  if (!item.drill?.name) return null
  const needle = item.drill.name.toLowerCase()
  return (
    drills.find(
      (d) =>
        d.name.toLowerCase().includes(needle) || needle.includes(d.name.toLowerCase())
    ) ?? null
  )
}

function severityBadgeClasses(severity: string) {
  if (severity === 'critical') return 'bg-red-500/20 text-red-400'
  if (severity === 'moderate') return 'bg-amber-500/20 text-amber-400'
  return 'bg-blue-500/20 text-blue-400'
}

function difficultyClasses(difficulty: string) {
  const map: Record<string, string> = {
    beginner: 'bg-green-500/20 text-green-400',
    intermediate: 'bg-amber-500/20 text-amber-400',
    advanced: 'bg-red-500/20 text-red-400',
  }
  return map[difficulty] ?? 'bg-gray-500/20 text-gray-400'
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ResultsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: row } = await supabase
    .from('analysis_results')
    .select(
      'id, result, llm_model, frame_count, usefulness_rating, created_at, session_id, analysis_sessions(original_filename, frame_paths)'
    )
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!row) notFound()

  const result = row.result as RunnerCoachResult
  const session = row.analysis_sessions as unknown as {
    original_filename: string | null
    frame_paths: string[] | null
  } | null

  const filename = session?.original_filename ?? null
  const frameUrls = (session?.frame_paths ?? []).map(
    (p) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/frames/${p}`
  )

  const createdAt = new Date(row.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const drills = drillsData as Drill[]
  const formAnalysis = result.form_analysis ?? []

  // Positive observations for highlights
  const wins = formAnalysis
    .filter((item) => item.status === 'good')
    .map((item) => item.observation)

  // Focus area names for highlights
  const focusAreas = formAnalysis
    .filter((item) => item.status === 'needs_work')
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .map((item) => item.trait)

  // Top 4 needs_work items sorted by severity — these are the priority fixes
  const topFixes = formAnalysis
    .filter((item) => item.status === 'needs_work')
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 4)
    .map((item) => ({ item, drillLib: matchDrill(item, drills) }))

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* ── Header ── */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Running Form Analysis</h1>
          <p className="text-sm text-gray-400">
            {filename && <span className="mr-2">{filename}</span>}
            <span>{createdAt}</span>
          </p>
        </div>

        {/* ── Frame gallery ── */}
        {frameUrls.length > 0 && <FrameGallery frameUrls={frameUrls} />}

        {/* ── Headline + quality badge ── */}
        <AnalysisHero
          thumbnailUrl={null}
          headline={result.summary.headline}
          videoQuality={result.summary.videoQuality}
          qualityNotes={result.summary.qualityNotes}
        />

        {/* ── Highlights: wins + focus areas ── */}
        {(wins.length > 0 || focusAreas.length > 0) && (
          <AnalysisHighlights wins={wins} focusAreas={focusAreas} />
        )}

        {/* ── Priority fixes with drills ── */}
        {topFixes.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-gray-200">
              Your Fix Plan
              <span className="ml-2 text-xs font-normal text-gray-500">
                {topFixes.length} drill{topFixes.length !== 1 ? 's' : ''}
              </span>
            </h2>

            {topFixes.map(({ item, drillLib }, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden"
              >
                {/* Issue header */}
                <div className="px-4 pt-4 pb-3 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{item.trait}</span>
                    {item.severity !== 'none' && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${severityBadgeClasses(item.severity)}`}
                      >
                        {item.severity}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{item.observation}</p>
                </div>

                {/* Drill block */}
                {(drillLib || item.drill?.name) && (
                  <div className="mx-4 mb-4 rounded-lg bg-gray-800/70 border border-gray-700 p-4 space-y-3">

                    {/* Drill header row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                        Drill
                      </span>
                      <span className="font-medium text-white text-sm">
                        {drillLib?.name ?? item.drill!.name}
                      </span>
                      {drillLib && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${difficultyClasses(drillLib.difficulty)}`}
                        >
                          {drillLib.difficulty}
                        </span>
                      )}
                    </div>

                    {/* Why this drill */}
                    {item.drill?.why && (
                      <p className="text-sm text-blue-300 leading-relaxed">
                        {item.drill.why}
                      </p>
                    )}

                    {/* Richer description from library */}
                    {drillLib && (
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {drillLib.description}
                      </p>
                    )}

                    {/* Expandable instructions */}
                    {drillLib?.instructions && (
                      <details className="group">
                        <summary className="flex items-center justify-between w-full cursor-pointer select-none rounded-md border border-gray-600 px-3 py-2 text-sm text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors list-none">
                          <span>Step-by-step instructions</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </summary>
                        <p className="mt-3 text-sm text-gray-400 leading-relaxed border-t border-gray-700 pt-3">
                          {drillLib.instructions}
                        </p>
                      </details>
                    )}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* ── Rating ── */}
        <section className="pt-2 space-y-2">
          <RatingButtons
            resultId={row.id}
            initialRating={row.usefulness_rating ?? null}
          />
          <p className="text-xs text-gray-600">Your rating helps us improve future analyses.</p>
        </section>

        {/* ── Disclaimer ── */}
        <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-800 pt-6">
          This analysis is AI-generated and intended for educational purposes only. It is not a
          substitute for advice from a qualified running coach or physiotherapist.
        </p>

        {/* ── Upload another ── */}
        <div className="pb-4">
          <Link
            href="/upload"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Upload another video
          </Link>
        </div>

      </div>
    </div>
  )
}
