import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AnalysisResult {
  overall_quality: string
  observations: unknown[]
}

export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: sessions, error } = await supabase
    .from('analysis_sessions')
    .select(
      'id, original_filename, status, queued_at, analysis_results(id, result, usefulness_rating)'
    )
    .eq('user_id', user.id)
    .order('queued_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }

  const rows = (sessions ?? []).map((s) => {
    const results = s.analysis_results as
      | { id: string; result: AnalysisResult; usefulness_rating: number | null }[]
      | null
    const result = results?.[0] ?? null

    return {
      sessionId: s.id,
      createdAt: s.queued_at,
      filename: s.original_filename,
      status: s.status,
      resultId: result?.id ?? null,
      overallQuality: result?.result?.overall_quality ?? null,
      observationCount: result?.result?.observations?.length ?? null,
      usefulnessRating: result?.usefulness_rating ?? null,
    }
  })

  return NextResponse.json(rows)
}
