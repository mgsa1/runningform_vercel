import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import drillsData from '@/data/drills.json'
import AnalysisHero from '@/components/AnalysisHero'
import FormScoreRing from '@/components/FormScoreRing'
import FrameGallery from '@/components/FrameGallery'
import AnalysisHighlights from '@/components/AnalysisHighlights'
import BiomechanicsCard from '@/components/BiomechanicsCard'


// ── Types ────────────────────────────────────────────────────────────────────

interface FormAnalysisItem {
  trait: string
  status: 'good' | 'needs_work'
  severity: 'critical' | 'moderate' | 'minor' | 'none'
  observation: string
  measured_value: string | null
  reference_range: string | null
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
  video_url: string
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
  if (severity === 'critical') return 'bg-red-500/20 text-red-300'
  if (severity === 'moderate') return 'bg-amber-500/20 text-amber-300'
  return 'bg-blue-500/20 text-blue-300'
}

function difficultyClasses(difficulty: string) {
  const map: Record<string, string> = {
    beginner: 'bg-green-500/20 text-green-300',
    intermediate: 'bg-amber-500/20 text-amber-300',
    advanced: 'bg-red-500/20 text-red-300',
  }
  return map[difficulty] ?? 'bg-gray-500/20 text-gray-300'
}

function severityTopAccent(severity: string) {
  if (severity === 'critical') return 'border-t-2 border-t-red-500'
  if (severity === 'moderate') return 'border-t-2 border-t-amber-500'
  if (severity === 'minor') return 'border-t-2 border-t-blue-400'
  return ''
}

function severityNumberClasses(severity: string) {
  if (severity === 'critical') return 'bg-red-500/20 text-red-300 border border-red-500/30'
  if (severity === 'moderate') return 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
  if (severity === 'minor') return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
  return 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
}

function computeFormScore(items: FormAnalysisItem[]): number {
  if (items.length === 0) return 0
  const weights: Record<string, Record<string, number>> = {
    good: { none: 100, minor: 100, moderate: 100, critical: 100 },
    needs_work: { none: 70, minor: 55, moderate: 30, critical: 5 },
  }
  const total = items.reduce((sum, item) => {
    return sum + (weights[item.status]?.[item.severity] ?? 50)
  }, 0)
  return Math.round(total / items.length)
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
      'id, result, llm_model, frame_count, created_at, session_id, analysis_sessions(original_filename, frame_paths)'
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

  // Fetch biomechanics + pose data separately (columns may not exist if migration 004 is not applied)
  let biomechanics: Record<string, unknown> | null = null
  type PoseFrame = { frameIndex: number; landmarks: { x: number; y: number; z: number; visibility: number }[] }
  let poseFrames: PoseFrame[] | null = null
  const { data: sessionExtra, error: extraError } = await supabase
    .from('analysis_sessions')
    .select('biomechanics, pose_data')
    .eq('id', row.session_id)
    .single()
  if (extraError) {
    console.error('[results] session data fetch error:', extraError.message)
  } else {
    if (sessionExtra?.biomechanics) {
      biomechanics = sessionExtra.biomechanics as Record<string, unknown>
    }
    if (sessionExtra?.pose_data && Array.isArray(sessionExtra.pose_data)) {
      poseFrames = sessionExtra.pose_data as PoseFrame[]
    }
  }

  const createdAt = new Date(row.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const drills = drillsData as Drill[]
  const formAnalysis = result.form_analysis ?? []

  // Form score
  const formScore = computeFormScore(formAnalysis)

  // Good traits for highlights
  const goodTraits = formAnalysis
    .filter((item) => item.status === 'good')
    .map((item) => ({ trait: item.trait, observation: item.observation }))

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
          <h1 className="font-heading text-2xl font-bold">Running Form Analysis</h1>
          <p className="text-sm text-gray-400">
            {filename && <span className="mr-2">{filename}</span>}
            <span>{createdAt}</span>
          </p>
        </div>

        {/* ── Hero: Score + Headline ── */}
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <FormScoreRing score={formScore} />
          <div className="flex-1 min-w-0">
            <AnalysisHero
              thumbnailUrl={null}
              headline={result.summary.headline}
              videoQuality={result.summary.videoQuality}
              qualityNotes={result.summary.qualityNotes}
            />
          </div>
        </div>

        {/* ── Frame gallery ── */}
        {frameUrls.length > 0 && (
          <FrameGallery frameUrls={frameUrls} poseFrames={poseFrames ?? undefined} />
        )}

        {/* ── Highlights: strengths ── */}
        {goodTraits.length > 0 && (
          <AnalysisHighlights goodTraits={goodTraits} />
        )}

        {/* ── Priority fixes with drills ── */}
        {topFixes.length > 0 && (
          <section className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-100">
              Your Fix Plan
              <span className="ml-2 text-sm font-normal text-gray-500">
                {topFixes.length} drill{topFixes.length !== 1 ? 's' : ''} ranked by priority
              </span>
            </h2>

            {topFixes.map(({ item, drillLib }, i) => (
              <div
                key={i}
                className={`rounded-xl border border-gray-800 bg-gray-900 overflow-hidden ${severityTopAccent(item.severity)}`}
              >
                {/* Issue header */}
                <div className="px-4 pt-4 pb-3 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${severityNumberClasses(item.severity)}`}
                    >
                      {i + 1}
                    </span>
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

                  {/* Measured value + reference range */}
                  {(item.measured_value || item.reference_range) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 px-3 py-2 rounded-md bg-gray-800/80">
                      {item.measured_value && (
                        <span className="text-sm font-mono">
                          <span className="text-gray-400">You: </span>
                          <span className="text-white font-medium">{item.measured_value}</span>
                        </span>
                      )}
                      {item.reference_range && (
                        <span className="text-sm font-mono">
                          <span className="text-gray-400">Target: </span>
                          <span className="text-green-300">{item.reference_range}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Drill block */}
                {(drillLib || item.drill?.name) && (
                  <div className="mx-4 mb-4 rounded-lg bg-gray-800/70 border border-gray-700 p-4 space-y-3">

                    {/* Drill header row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">
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
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {item.drill.why}
                      </p>
                    )}

                    {/* Actions: instructions + video */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Watch drill video */}
                      {drillLib?.video_url && (
                        <a
                          href={drillLib.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-md bg-red-600/20 border border-red-500/30 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-600/30 hover:text-red-200 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          Watch drill
                        </a>
                      )}
                    </div>

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

        {/* ── Biomechanics dashboard ── */}
        {biomechanics && (
          <BiomechanicsCard biomechanics={biomechanics as never} />
        )}

        {/* ── Disclaimer ── */}
        <p className="text-sm text-gray-400 leading-relaxed border-t border-gray-800 pt-6">
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
