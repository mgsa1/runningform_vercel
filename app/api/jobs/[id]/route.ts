import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: session, error: sessionError } = await supabase
    .from('analysis_sessions')
    .select('id, status, error, original_filename')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  let resultId: string | null = null

  if (session.status === 'completed') {
    const { data: result } = await supabase
      .from('analysis_results')
      .select('id')
      .eq('session_id', params.id)
      .single()

    resultId = result?.id ?? null
  }

  return NextResponse.json({
    sessionId: session.id,
    status: session.status,
    originalFilename: session.original_filename,
    resultId,
    error: session.error ?? null,
  })
}
