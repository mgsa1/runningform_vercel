'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createProfile(
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const displayName = (formData.get('display_name') as string).trim()
  const experienceLevel = formData.get('experience_level') as string
  const goals = formData.getAll('goals') as string[]
  const videoConsent = formData.get('video_consent') === 'on'

  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    display_name: displayName,
    experience_level: experienceLevel,
    goals,
    video_consent: videoConsent,
    consent_given_at: videoConsent ? new Date().toISOString() : null,
  })

  if (error) return { error: error.message }

  redirect('/upload')
}
