import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatusClient from './StatusClient'

export default async function StatusPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <StatusClient sessionId={params.id} />
}
