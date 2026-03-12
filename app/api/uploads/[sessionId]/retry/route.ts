import { NextRequest, NextResponse } from 'next/server'
import { inngest } from '@/lib/inngest'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionId } = params

  // Verify session belongs to user and is actually failed
  const { data: session, error: sessionError } = await supabase
    .from('analysis_sessions')
    .select('id, status, frame_paths, runner_context')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 403 })
  }

  if (session.status !== 'failed') {
    return NextResponse.json(
      { error: 'Only failed sessions can be retried' },
      { status: 409 }
    )
  }

  // Reset session state
  const { error: resetError } = await supabase
    .from('analysis_sessions')
    .update({ status: 'queued', attempts: 0, error: null })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (resetError) {
    return NextResponse.json({ error: 'Failed to reset session' }, { status: 500 })
  }

  // Re-fire the Inngest event with the existing frame paths
  await inngest.send({
    name: 'analysis/requested',
    data: {
      sessionId,
      userId: user.id,
      framePaths: session.frame_paths ?? [],
      runnerContext: session.runner_context ?? null,
    },
  })

  return NextResponse.json({ sessionId, status: 'queued' })
}
