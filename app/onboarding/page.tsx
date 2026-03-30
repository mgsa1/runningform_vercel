import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (profile) redirect('/history')

  const displayName: string = user.user_metadata?.display_name ?? ''

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Set up your profile</h1>
          <p className="mt-1 text-sm text-[#9898A8]">
            Tell us a bit about yourself so we can tailor the analysis.
          </p>
        </div>
        <OnboardingForm defaultDisplayName={displayName} />
      </div>
    </div>
  )
}
