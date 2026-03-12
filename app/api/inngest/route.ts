import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { analysisFunction } from '@/lib/workers/analysis'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [analysisFunction],
})
