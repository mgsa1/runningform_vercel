import { inngest } from '@/lib/inngest'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'

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
})

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

      // Runner context
      if (runnerContext?.pace || runnerContext?.fatigue != null) {
        contextParts.push(
          `Runner context: ${[
            runnerContext.pace ? `pace ${runnerContext.pace}` : null,
            runnerContext.fatigue != null ? `fatigue ${runnerContext.fatigue}/10` : null,
          ]
            .filter(Boolean)
            .join(', ')}.`
        )
      }

      // Biomechanics data
      if (biomechanicsData) {
        contextParts.push(formatBiomechanicsForPrompt(biomechanicsData, runnerContext))
      }

      contextParts.push(
        'Please analyse the running form visible in these sequential video frames and provide your structured coaching assessment.'
      )

      const userText = contextParts.join('\n\n')

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: getSystemPrompt(),
        tools: [
          {
            name: 'submit_analysis',
            description: 'Submit the structured running form coaching analysis.',
            input_schema: {
              type: 'object' as const,
              required: ['summary', 'form_analysis'],
              properties: {
                summary: {
                  type: 'object',
                  required: ['headline', 'videoQuality', 'qualityNotes'],
                  properties: {
                    headline: { type: 'string' },
                    videoQuality: { type: 'string', enum: ['Good', 'Fair', 'Poor'] },
                    qualityNotes: { type: 'string' },
                  },
                },
                form_analysis: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['trait', 'status', 'severity', 'observation', 'drill'],
                    properties: {
                      trait: { type: 'string' },
                      status: { type: 'string', enum: ['good', 'needs_work'] },
                      severity: { type: 'string', enum: ['critical', 'moderate', 'minor', 'none'] },
                      observation: { type: 'string' },
                      measured_value: { oneOf: [{ type: 'string' }, { type: 'null' }] },
                      reference_range: { oneOf: [{ type: 'string' }, { type: 'null' }] },
                      drill: {
                        type: 'object',
                        properties: {
                          name: { oneOf: [{ type: 'string' }, { type: 'null' }] },
                          why: { oneOf: [{ type: 'string' }, { type: 'null' }] },
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

      const { data, error: insertError } = await supabase
        .from('analysis_results')
        .insert({
          session_id: sessionId,
          user_id: userId,
          result: validated,
          llm_model: 'claude-sonnet-4-6',
          frame_count: framePaths.length,
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
