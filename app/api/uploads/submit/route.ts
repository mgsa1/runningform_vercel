import { NextRequest, NextResponse } from 'next/server'
import { inngest } from '@/lib/inngest'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { sessionId, framePaths, runnerContext } = body as {
    sessionId?: unknown
    framePaths?: unknown
    runnerContext?: { pace?: string; fatigue?: number }
  }

  if (typeof sessionId !== 'string' || sessionId.trim() === '') {
    return NextResponse.json({ error: 'sessionId must be a non-empty string' }, { status: 422 })
  }

  if (
    !Array.isArray(framePaths) ||
    framePaths.length === 0 ||
    framePaths.length > 15 ||
    framePaths.some((p) => typeof p !== 'string')
  ) {
    return NextResponse.json(
      { error: 'framePaths must be a non-empty array of strings (max 15)' },
      { status: 422 }
    )
  }

  // Verify session belongs to this user
  const { data: session, error: sessionError } = await supabase
    .from('analysis_sessions')
    .select('id')
    .eq('id', sessionId.trim())
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 403 })
  }

  // Attach frame paths to the session (core — must succeed)
  const { error: updateError } = await supabase
    .from('analysis_sessions')
    .update({ frame_paths: framePaths, frame_count: framePaths.length })
    .eq('id', sessionId.trim())

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }

  // Store runner context separately — requires migration 003; silently skipped if column absent
  if (runnerContext) {
    await supabase
      .from('analysis_sessions')
      .update({ runner_context: runnerContext })
      .eq('id', sessionId.trim())
  }

  // Fire the Inngest event
  await inngest.send({
    name: 'analysis/requested',
    data: {
      sessionId: sessionId.trim(),
      userId: user.id,
      framePaths,
      runnerContext: runnerContext ?? null,
    },
  })

  return NextResponse.json({ sessionId: sessionId.trim(), status: 'queued' })
}
