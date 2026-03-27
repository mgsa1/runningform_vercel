import { NextRequest, NextResponse } from 'next/server'
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

  const { filename, frameCount } = body as { filename?: unknown; frameCount?: unknown }

  if (typeof filename !== 'string' || filename.trim() === '') {
    return NextResponse.json({ error: 'filename must be a non-empty string' }, { status: 422 })
  }

  if (typeof frameCount !== 'number' || !Number.isInteger(frameCount) || frameCount < 1 || frameCount > 30) {
    return NextResponse.json({ error: 'frameCount must be an integer between 1 and 30' }, { status: 422 })
  }

  // TODO: Re-enable rate limit before production launch
  // Rate limit: max 3 sessions per user per UTC day (disabled for dev)
  // const startOfDay = new Date()
  // startOfDay.setUTCHours(0, 0, 0, 0)
  // const { count } = await supabase
  //   .from('analysis_sessions')
  //   .select('id', { count: 'exact', head: true })
  //   .eq('user_id', user.id)
  //   .gte('queued_at', startOfDay.toISOString())
  //   .not('frame_paths', 'eq', '{}')
  // if ((count ?? 0) >= 3) {
  //   return NextResponse.json(
  //     { error: 'Daily limit reached. You can run up to 3 analyses per day.' },
  //     { status: 429 }
  //   )
  // }

  const { data: session, error: insertError } = await supabase
    .from('analysis_sessions')
    .insert({
      user_id: user.id,
      original_filename: filename.trim(),
      frame_count: frameCount,
      frame_paths: [],
      status: 'queued',
      queued_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError || !session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  return NextResponse.json({ sessionId: session.id }, { status: 201 })
}
