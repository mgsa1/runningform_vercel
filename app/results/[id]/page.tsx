import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import drillsData from '@/data/drills.json'
import AnalysisHero from '@/components/AnalysisHero'
import FormScoreRing from '@/components/FormScoreRing'
import FrameGallery from '@/components/FrameGallery'
import AnalysisHighlights from '@/components/AnalysisHighlights'
import BiomechanicsCard from '@/components/BiomechanicsCard'
import { computeFormScore } from '@/lib/scoring'


// ── Types ────────────────────────────────────────────────────────────────────

interface FormAnalysisItem {
  trait: string
  status: 'good' | 'needs_work' | 'not_assessable'
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

interface DrillDosage {
  frequency: string
  volume: string
  when: string
  retest_after_weeks: number
}

interface Drill {
  id: string
  name: string
  description: string
  instructions: string
  video_url: string
  difficulty: string
  tags: string[]
  dosage?: DrillDosage
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

function severityAccent(severity: string) {
  if (severity === 'critical') return 'border-l-[3px] border-l-orange-400'
  if (severity === 'moderate') return 'border-l-[3px] border-l-amber-400/60'
  if (severity === 'minor') return 'border-l-[3px] border-l-[#3A3A48]'
  return ''
}

function severityTextClass(severity: string) {
  if (severity === 'critical') return 'text-orange-400'
  if (severity === 'moderate') return 'text-amber-400'
  return 'text-[#9898A8]'
}


function DosageBlock({ dosage }: { dosage: DrillDosage }) {
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center bg-[#22222C] border border-[#2A2A35] rounded-lg px-2.5 py-1 text-xs text-[#9898A8]">
          {dosage.frequency}
        </span>
        <span className="inline-flex items-center bg-[#22222C] border border-[#2A2A35] rounded-lg px-2.5 py-1 text-xs text-[#9898A8]">
          {dosage.volume}
        </span>
        <span className="inline-flex items-center bg-[#22222C] border border-[#2A2A35] rounded-lg px-2.5 py-1 text-xs text-[#9898A8]">
          {dosage.when}
        </span>
      </div>
      <p className="text-xs text-[#5C5C6E]">
        Re-test in {dosage.retest_after_weeks} week{dosage.retest_after_weeks !== 1 ? 's' : ''}
      </p>
    </div>
  )
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

  // Fetch height_cm from user profile
  let heightCm: number | null = null
  const { data: profile } = await supabase
    .from('profiles')
    .select('height_cm')
    .eq('id', user.id)
    .single()
  if (profile?.height_cm) heightCm = profile.height_cm

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

  // Prior traits not assessable in this video
  const notAssessableItems = formAnalysis.filter((item) => item.status === 'not_assessable')

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-12 py-10 space-y-8">

        {/* ── Header ── */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Running Form Analysis</h1>
          <p className="text-sm text-[#9898A8]">
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
          <FrameGallery
            frameUrls={frameUrls}
            poseFrames={poseFrames ?? undefined}
            visibleSide={
              (biomechanics as { visibleSide?: 'left' | 'right' | 'frontal' } | null)?.visibleSide
            }
          />
        )}

        {/* ── Highlights: strengths ── */}
        {goodTraits.length > 0 && (
          <AnalysisHighlights goodTraits={goodTraits} />
        )}

        {/* ── Priority fixes with drills ── */}
        {topFixes.length > 0 && (
          <section className="space-y-5">
            <h2 className="text-lg font-semibold">
              Your Fix Plan
              <span className="ml-2 text-sm font-normal text-[#9898A8]">
                {topFixes.length} drill{topFixes.length !== 1 ? 's' : ''} ranked by priority
              </span>
            </h2>

            {topFixes.map(({ item, drillLib }, i) => (
              <div
                key={i}
                className={`border border-[#2A2A35] bg-[#1A1A22] rounded-2xl overflow-hidden ${severityAccent(item.severity)}`}
              >
                {/* Issue header */}
                <div className="px-5 pt-5 pb-4 space-y-2">
                  <h3 className={`text-base font-semibold ${severityTextClass(item.severity)}`}>{item.trait}</h3>
                  <p className="text-sm text-[#9898A8] leading-relaxed">{item.observation}</p>

                  {/* Measured value + reference range */}
                  {(item.measured_value || item.reference_range) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 px-4 py-3 bg-[#22222C] rounded-xl">
                      {item.measured_value && (
                        <span className="text-sm font-mono">
                          <span className="text-[#9898A8]">You: </span>
                          <span className="font-medium">{item.measured_value}</span>
                        </span>
                      )}
                      {item.reference_range && (
                        <span className="text-sm font-mono">
                          <span className="text-[#9898A8]">Target: </span>
                          <span className="text-emerald-400">{item.reference_range}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Drill block */}
                {(drillLib || item.drill?.name) && (
                  <div className="mx-5 mb-5 border border-[#2A2A35] rounded-xl p-4 space-y-3">

                    {/* Drill header row */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {drillLib?.name ?? item.drill!.name}
                      </span>
                      {drillLib?.video_url && (
                        <a
                          href={drillLib.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto inline-flex items-center gap-1.5 border border-[#2A2A35] rounded-[10px] px-3 py-1.5 text-xs font-medium text-[#9898A8] hover:border-[#3A3A48] hover:text-[#F0F0F5] transition-colors duration-150"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          Watch drill
                        </a>
                      )}
                    </div>

                    {/* Why this drill */}
                    {item.drill?.why && (
                      <p className="text-sm text-[#9898A8] leading-relaxed">
                        {item.drill.why}
                      </p>
                    )}

                    {/* Drill dosage */}
                    {drillLib?.dosage && (
                      <DosageBlock dosage={drillLib.dosage} />
                    )}

                    {/* Expandable instructions */}
                    {drillLib?.instructions && (
                      <details className="group">
                        <summary className="flex items-center justify-between w-full cursor-pointer select-none border border-[#2A2A35] rounded-xl px-3 py-2 text-sm text-[#9898A8] hover:border-[#3A3A48] hover:text-[#F0F0F5] transition-colors duration-150 list-none">
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
                        <ol className="mt-3 text-sm text-[#9898A8] leading-relaxed border-t border-[#2A2A35] pt-3 list-decimal list-inside space-y-1.5">
                          {drillLib.instructions.split('. ').filter(Boolean).map((step: string, si: number) => (
                            <li key={si}>{step.replace(/\.$/, '')}</li>
                          ))}
                        </ol>
                      </details>
                    )}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* ── Prior traits not assessable in this video ── */}
        {notAssessableItems.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-[11px] font-medium tracking-widest uppercase text-[#5C5C6E]">Couldn&apos;t assess from this video</h2>
            <div className="border border-[#2A2A35] rounded-2xl divide-y divide-[#2A2A35] overflow-hidden">
              {notAssessableItems.map((item, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <span className="mt-0.5 text-[#5C5C6E]">—</span>
                  <div>
                    <p className="text-sm font-medium text-[#9898A8]">{item.trait}</p>
                    <p className="text-xs text-[#5C5C6E] mt-0.5">{item.observation}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Biomechanics dashboard ── */}
        {biomechanics && (
          <BiomechanicsCard biomechanics={biomechanics as never} heightCm={heightCm ?? undefined} />
        )}

        {/* ── Disclaimer ── */}
        <p className="text-xs text-[#5C5C6E] leading-relaxed border-t border-[#2A2A35] pt-6">
          This analysis is AI-generated and intended for educational purposes only. It is not a
          substitute for advice from a qualified running coach or physiotherapist.
        </p>

        {/* ── Upload another ── */}
        <div className="pb-4">
          <Link
            href="/upload"
            className="text-sm text-[#9898A8] hover:text-[#F0F0F5] transition-colors duration-150"
          >
            ← Upload another video
          </Link>
        </div>

      </div>
    </div>
  )
}
