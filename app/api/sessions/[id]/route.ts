import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
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

  // Verify the session belongs to this user
  const { data: session } = await supabase
    .from('analysis_sessions')
    .select('id, status, frame_paths')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Only allow deleting non-completed sessions
  if (session.status === 'completed') {
    return NextResponse.json(
      { error: 'Completed sessions cannot be deleted' },
      { status: 409 }
    )
  }

  // Delete any uploaded frames from storage
  const framePaths = (session.frame_paths ?? []) as string[]
  if (framePaths.length > 0) {
    await supabase.storage.from('frames').remove(framePaths)
  }

  // Delete the session row (analysis_results cascade via FK if configured)
  const { error: deleteError } = await supabase
    .from('analysis_sessions')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
