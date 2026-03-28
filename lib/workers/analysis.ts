import { inngest } from '@/lib/inngest'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import { computeFormScore } from '@/lib/scoring'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getSystemPrompt() {
  return fs.readFileSync(
    path.join(process.cwd(), 'data/systemprompt_runningCoach.md'),
    'utf-8'
  )
}

// Zod schema matching the system prompt output schema
const FormAnalysisItemSchema = z.object({
  trait: z.string(),
  status: z.enum(['good', 'needs_work']),
  severity: z.enum(['critical', 'moderate', 'minor', 'none']),
  observation: z.string(),
  measured_value: z.string().nullable().optional(),
  reference_range: z.string().nullable().optional(),
  drill: z
    .object({
      name: z.string().nullable(),
      why: z.string().nullable(),
    })
    .nullable(),
}).refine(
  (item) => item.status !== 'good' || item.severity === 'none',
  { message: 'severity must be "none" when status is "good"' }
)

const RunnerCoachResultSchema = z.object({
  summary: z.object({
    headline: z.string(),
    videoQuality: z.enum(['Good', 'Fair', 'Poor']),
    qualityNotes: z.string(),
  }),
  form_analysis: z.array(FormAnalysisItemSchema),
})

type RunnerCoachResult = z.infer<typeof RunnerCoachResultSchema>

// ─── Biomechanics prompt formatting ──────────────────────────────────────────

interface BiomechanicsReport {
  footPlacement: { value: number; unit: string; assessment: string; confidence: string; paceContext: string; referenceRange: { min: number; max: number } } | null
  footStrikeType: { type: string; confidence: string; contactCount: number } | null
  trunkLean: { value: number; unit: string; assessment: string; confidence: string; paceContext: string; leanSource: string; referenceRange: { min: number; max: number } } | null
  verticalOscillation: { value: number; unit: string; assessment: string; confidence: string; paceContext: string; referenceRange: { min: number; max: number } } | null
  cadence: { value: number; unit: string; assessment: string; confidence: string; paceContext: string; referenceRange: { min: number; max: number } } | null
  groundContactTime: { value: number; unit: string; assessment: string; confidence: string; paceContext: string; referenceRange: { min: number; max: number } } | null
  contactTimeAsymmetry: { value: number; unit: string; assessment: string } | null
  footPlacementAsymmetry: { value: number; unit: string; assessment: string } | null
  visibleSide: string
  gaitCyclesDetected: number
  framesAnalyzed: number
  framesWithValidPose: number
}

function formatBiomechanicsForPrompt(
  bio: BiomechanicsReport,
  runnerContext: { pace?: string; fatigue?: number } | null
): string {
  const lines: string[] = ['--- MEASURED BIOMECHANICS (from pose detection) ---']

  const paceTier = bio.footPlacement?.paceContext ?? bio.trunkLean?.paceContext ?? 'unknown'
  const paceLabel = paceTier === 'unknown' ? 'unspecified pace' : `${paceTier} pace`
  if (runnerContext?.pace) {
    lines.push(`Runner pace context: ${runnerContext.pace} (${paceLabel})`)
  }
  lines.push(`View: ${bio.visibleSide} side | Gait cycles: ${bio.gaitCyclesDetected} | Frames analyzed: ${bio.framesWithValidPose}/${bio.framesAnalyzed}`)
  lines.push('')

  if (bio.cadence) {
    const c = bio.cadence
    const cPaceCtx = c.paceContext === 'unknown' ? 'unspecified pace' : `${c.paceContext} pace`
    const cLabel = c.assessment === 'good' ? 'GOOD' :
      c.assessment === 'moderate' ? 'BELOW TARGET — cadence drills recommended' :
      'LOW — associated with overstriding and higher impact loading'
    lines.push(`Cadence: ${c.value} ${c.unit} (${cPaceCtx} reference: ${c.referenceRange.min}–${c.referenceRange.max} spm)`)
    lines.push(`  Assessment: ${cLabel}`)
    lines.push(`  Confidence: ${c.confidence.toUpperCase()}`)
    lines.push('')
  }

  if (bio.footPlacement) {
    const fp = bio.footPlacement
    const label = fp.assessment === 'good' ? 'GOOD' :
      fp.assessment === 'moderate' ? 'MODERATE OVERSTRIDING' : 'SIGNIFICANT OVERSTRIDING'
    lines.push(`Foot Placement at Contact: ${fp.value} ahead of hip (${paceLabel} reference: < ${fp.referenceRange.max})`)
    lines.push(`  Assessment: ${label}`)

    if (bio.footStrikeType) {
      const fst = bio.footStrikeType
      const combo = fst.type === 'heel' && fp.assessment !== 'good'
        ? ' (combined with overstriding = high braking force)'
        : ''
      lines.push(`  Foot Strike Type: ${fst.type.toUpperCase()} STRIKE${combo}`)
    }
    lines.push(`  Confidence: ${fp.confidence.toUpperCase()}`)
    lines.push('')
  }

  if (bio.trunkLean) {
    const tl = bio.trunkLean
    const label = tl.assessment === 'good' ? 'GOOD' :
      tl.assessment === 'moderate' ? 'MODERATE' : 'SIGNIFICANT'
    lines.push(`Trunk Lean: ${tl.value}° forward (${paceLabel} reference: ${tl.referenceRange.min}-${tl.referenceRange.max}°)`)
    lines.push(`  Assessment: ${label}`)
    const leanDesc = tl.leanSource === 'ankles' ? 'primarily from ANKLES (good — uses gravity for propulsion)' :
      tl.leanSource === 'waist' ? 'primarily from WAIST (concern — loads the lower back)' :
        'MIXED (partly from ankles, partly from waist)'
    lines.push(`  Lean source: ${leanDesc}`)
    lines.push(`  Confidence: ${tl.confidence.toUpperCase()}`)
    lines.push('')
  }

  if (bio.verticalOscillation) {
    const vo = bio.verticalOscillation
    const label = vo.assessment === 'good' ? 'GOOD' :
      vo.assessment === 'moderate' ? 'MODERATE — associated with energy waste' :
        'HIGH — associated with energy waste and may increase impact loading'
    lines.push(`Vertical Oscillation: ${vo.value}${vo.unit} (${paceLabel} reference: < ${vo.referenceRange.max}${vo.unit})`)
    lines.push(`  Assessment: ${label}`)
    lines.push(`  Confidence: ${vo.confidence.toUpperCase()}`)
    lines.push('')
  }

  if (bio.groundContactTime) {
    const gct = bio.groundContactTime
    const gctPaceCtx = gct.paceContext === 'unknown' ? 'unspecified pace' : `${gct.paceContext} pace`
    const gctLabel = gct.assessment === 'good' ? 'GOOD' :
      gct.assessment === 'moderate' ? 'ELEVATED for pace' :
      'HIGH — significantly above efficient range; may indicate reduced leg stiffness'
    lines.push(`Ground Contact Time: ${gct.value} ${gct.unit} (${gctPaceCtx} reference: ${gct.referenceRange.min}–${gct.referenceRange.max} ms)`)
    lines.push(`  Assessment: ${gctLabel}`)
    lines.push(`  Confidence: ${gct.confidence.toUpperCase()}`)
    lines.push('')
  }

  if (bio.contactTimeAsymmetry) {
    const cta = bio.contactTimeAsymmetry
    const label = cta.assessment === 'good' ? 'within normal range' :
      cta.assessment === 'moderate' ? 'borderline — worth noting' : 'significant — potential compensation pattern'
    lines.push(`Asymmetry:`)
    lines.push(`  Contact time difference: ${cta.value}% — ${label}`)
  }

  lines.push('')
  lines.push('IMPORTANT: Use hedged language for injury associations ("may increase risk of",')
  lines.push('"is associated with", "correlates with"). Do not state that any metric directly causes injury.')
  lines.push('')
  lines.push('Explain what the numbers mean for THIS runner at THIS pace.')
  lines.push('Reference specific measurements in your coaching feedback.')
  if (bio.trunkLean) {
    lines.push('Note where the trunk lean originates (ankles vs waist) — this changes the recommendation.')
  }

  // Fatigue adjustment
  if (runnerContext?.fatigue != null && runnerContext.fatigue >= 7) {
    lines.push('')
    lines.push('Runner reports HIGH FATIGUE. Expect 10-20% degradation in form metrics compared to fresh state.')
    lines.push('Flag significant deviations but note that some degradation is expected under fatigue.')
    lines.push('Moderate findings at high fatigue may be less concerning than the same findings when fresh.')
  }

  return lines.join('\n')
}

export const analysisFunction = inngest.createFunction(
  {
    id: 'analysis-process',
    name: 'runningform/analysis.process',
    onFailure: async ({ event, error }) => {
      const { sessionId } = event.data.event.data as { sessionId: string }
      const supabase = getServiceClient()
      await supabase
        .from('analysis_sessions')
        .update({
          status: 'failed',
          error: error.message.slice(0, 500),
        })
        .eq('id', sessionId)
    },
  },
  { event: 'analysis/requested' },
  async ({ event, step }) => {
    const { sessionId, userId, framePaths, runnerContext } = event.data as {
      sessionId: string
      userId: string
      framePaths: string[]
      runnerContext: { pace?: string; fatigue?: number } | null
    }

    // Step 1: Mark session as processing
    await step.run('mark-processing', async () => {
      const supabase = getServiceClient()
      const { error } = await supabase
        .from('analysis_sessions')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', userId)
      if (error) throw error
    })

    // Step 2: Fetch frames from Supabase Storage and convert to base64
    const base64Frames = await step.run('fetch-and-encode-frames', async () => {
      const encoded: string[] = []
      for (const p of framePaths) {
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/frames/${p}`
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch frame at ${url}: ${response.status} ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        encoded.push(Buffer.from(arrayBuffer).toString('base64'))
      }
      return encoded
    })

    // Step 2b: Fetch biomechanics data from the session (if available)
    const biomechanicsData = await step.run('fetch-biomechanics', async () => {
      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from('analysis_sessions')
        .select('biomechanics')
        .eq('id', sessionId)
        .single()
      if (error) {
        console.error('[fetch-biomechanics] query error:', error.message)
        return null
      }
      const bio = (data?.biomechanics as BiomechanicsReport) ?? null
      console.log('[fetch-biomechanics] result:', bio ? `found (${bio.gaitCyclesDetected} cycles, side=${bio.visibleSide})` : 'null')
      return bio
    })

    // Step 3: Call Claude API with system prompt, biomechanics, and schema
    const rawAnalysis = await step.run('call-claude', async () => {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      const imageBlocks: Anthropic.ImageBlockParam[] = (base64Frames as string[]).map((b64) => ({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: b64,
        },
      }))

      const contextParts: string[] = []

      // Temporal context for frames
      contextParts.push(
        `<frame_sequence>These ${(base64Frames as string[]).length} frames are in chronological order, selected from key gait phases (initial contact, midstance, toe-off) to capture the full running gait cycle.</frame_sequence>`
      )

      // Runner context
      if (runnerContext?.pace || runnerContext?.fatigue != null) {
        contextParts.push(
          `<runner_context>${[
            runnerContext.pace ? `pace ${runnerContext.pace}` : null,
            runnerContext.fatigue != null ? `fatigue ${runnerContext.fatigue}/10` : null,
          ]
            .filter(Boolean)
            .join(', ')}</runner_context>`
        )
      }

      // Biomechanics data
      if (biomechanicsData) {
        contextParts.push(`<biomechanics>\n${formatBiomechanicsForPrompt(biomechanicsData, runnerContext)}\n</biomechanics>`)
      }

      contextParts.push(
        '<task>Analyse the running form visible in these sequential video frames and provide your structured coaching assessment.</task>'
      )

      const userText = contextParts.join('\n\n')

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        temperature: 0.3,
        system: getSystemPrompt(),
        tools: [
          {
            name: 'submit_analysis',
            description:
              'Submit the structured running form coaching analysis. The form_analysis array must be sorted by severity: critical → moderate → minor → none (good traits last).',
            input_schema: {
              type: 'object' as const,
              required: ['summary', 'form_analysis'],
              additionalProperties: false,
              properties: {
                summary: {
                  type: 'object',
                  required: ['headline', 'videoQuality', 'qualityNotes'],
                  additionalProperties: false,
                  properties: {
                    headline: {
                      type: 'string',
                      description: 'One encouraging sentence summarizing the overall form assessment.',
                    },
                    videoQuality: {
                      type: 'string',
                      enum: ['Good', 'Fair', 'Poor'],
                      description: 'Overall video quality rating based on lighting, framing, and clarity.',
                    },
                    qualityNotes: {
                      type: 'string',
                      description:
                        'Briefly note any severe lighting or framing issues. Empty string if none.',
                    },
                  },
                },
                form_analysis: {
                  type: 'array',
                  description:
                    'All form observations sorted by severity: critical first, then moderate, minor, and none (good traits) last.',
                  items: {
                    type: 'object',
                    required: ['trait', 'status', 'severity', 'observation', 'drill'],
                    additionalProperties: false,
                    properties: {
                      trait: {
                        type: 'string',
                        description:
                          'The biomechanical trait being assessed (e.g., Overstriding, Arm Drive, Posture, Hip Drop).',
                      },
                      status: {
                        type: 'string',
                        enum: ['good', 'needs_work'],
                        description: 'Whether this trait is good or needs work.',
                      },
                      severity: {
                        type: 'string',
                        enum: ['critical', 'moderate', 'minor', 'none'],
                        description:
                          'Impact severity. Must be "none" when status is "good". Use "critical" only for flaws with high injury risk or major efficiency loss.',
                      },
                      observation: {
                        type: 'string',
                        description:
                          'Strictly 1-2 concise sentences. Reference specific measured biomechanics values when available.',
                      },
                      measured_value: {
                        oneOf: [{ type: 'string' }, { type: 'null' }],
                        description:
                          'The measured biomechanics value if available (e.g., "0.05 ahead of hip", "11° forward lean"). Null if no measurement.',
                      },
                      reference_range: {
                        oneOf: [{ type: 'string' }, { type: 'null' }],
                        description:
                          'The pace-adjusted reference range (e.g., "< 0.03 at tempo pace", "3-9° at tempo"). Null if no measurement.',
                      },
                      drill: {
                        type: 'object',
                        additionalProperties: false,
                        description:
                          'One drill from the approved list for "needs_work" traits. Null name and why for "good" traits.',
                        properties: {
                          name: {
                            oneOf: [
                              {
                                type: 'string',
                                enum: [
                                  'Cadence Builder',
                                  'Short Stride Run',
                                  'A-Skip Drill',
                                  'Barefoot Grass Strides',
                                  'Wall Lean Drill',
                                  'Run Tall Drill',
                                  'Gaze Focus Drill',
                                  'Arm Drive Drill',
                                  '90-Degree Elbow Run',
                                  'Shoulder Drop Check',
                                  'Single-Leg Balance',
                                  'Glute Bridge',
                                  'High Knees',
                                  'Butt Kicks',
                                  'Low Horizontal Bounds',
                                ],
                              },
                              { type: 'null' },
                            ],
                            description:
                              'Drill name from the approved list. Null when status is "good".',
                          },
                          why: {
                            oneOf: [{ type: 'string' }, { type: 'null' }],
                            description:
                              'One short sentence explaining how this drill addresses the specific issue. Null when status is "good".',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'submit_analysis' },
        messages: [
          {
            role: 'user',
            content: [
              ...imageBlocks,
              { type: 'text', text: userText },
            ],
          },
        ],
      })

      const toolUseBlock = response.content.find((block) => block.type === 'tool_use')
      if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
        throw new Error('Claude did not return a tool_use block')
      }

      return toolUseBlock.input
    })

    // Step 4: Validate with Zod and store in DB
    const resultId = await step.run('validate-and-store', async () => {
      const parsed = RunnerCoachResultSchema.safeParse(rawAnalysis)
      if (!parsed.success) {
        throw new Error(`Zod validation failed: ${parsed.error.message}`)
      }

      const validated: RunnerCoachResult = parsed.data

      const supabase = getServiceClient()

      const formScore = computeFormScore(validated.form_analysis)

      const { data, error: insertError } = await supabase
        .from('analysis_results')
        .insert({
          session_id: sessionId,
          user_id: userId,
          result: validated,
          llm_model: 'claude-sonnet-4-6',
          frame_count: framePaths.length,
          form_score: formScore,
        })
        .select('id')
        .single()
      if (insertError) throw insertError

      const { error: updateError } = await supabase
        .from('analysis_sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', userId)
      if (updateError) throw updateError

      return data.id as string
    })

    return { resultId }
  }
)
