import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import UploadClient from './UploadClient'

export default async function UploadPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Require completed onboarding before uploading
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-12 py-10 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Upload a video</h1>
          <p className="text-sm text-[#9898A8]">
            MP4, MOV, or WebM · minimum 3 seconds · max 500 MB
          </p>
        </div>
        <UploadClient userId={user.id} />
      </div>
    </div>
  )
}
