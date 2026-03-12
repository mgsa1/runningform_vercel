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

const systemPrompt = fs.readFileSync(
  path.join(process.cwd(), 'data/systemprompt_runningCoach.md'),
  'utf-8'
)

// Zod schema matching the system prompt output schema exactly
const FormAnalysisItemSchema = z.object({
  trait: z.string(),
  status: z.enum(['good', 'needs_work']),
  severity: z.enum(['critical', 'moderate', 'minor', 'none']),
  observation: z.string(),
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

    // Step 3: Call Claude API with new system prompt and schema
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

      const userText = [
        runnerContext?.pace || runnerContext?.fatigue != null
          ? `Runner context: ${[
              runnerContext.pace ? `pace ${runnerContext.pace}` : null,
              runnerContext.fatigue != null ? `fatigue ${runnerContext.fatigue}/10` : null,
            ]
              .filter(Boolean)
              .join(', ')}.`
          : null,
        'Please analyse the running form visible in these sequential video frames and provide your structured coaching assessment.',
      ]
        .filter(Boolean)
        .join('\n\n')

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
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
