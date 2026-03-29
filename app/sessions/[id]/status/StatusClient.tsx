'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type JobStatus = 'queued' | 'processing' | 'completed' | 'failed'

interface JobResponse {
  sessionId: string
  status: JobStatus
  originalFilename: string | null
  resultId: string | null
  error: string | null
}

interface Props {
  sessionId: string
}

const MAX_POLLS = 120 // 120 × 5s = 10 minutes

export default function StatusClient({ sessionId }: Props) {
  const router = useRouter()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollCountRef = useRef(0)
  const [jobData, setJobData] = useState<JobResponse | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function clearPolling() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  async function checkStatus() {
    pollCountRef.current += 1
    if (pollCountRef.current > MAX_POLLS) {
      clearPolling()
      setFetchError('This is taking longer than expected. Check History for your result.')
      return
    }

    let data: JobResponse
    try {
      const res = await fetch(`/api/jobs/${sessionId}`)
      if (!res.ok) {
        clearPolling()
        if (res.status === 401) {
          router.push('/login')
          return
        }
        setFetchError('Something went wrong. Please try again from History.')
        return
      }
      data = await res.json()
    } catch {
      setFetchError('Network error — please refresh the page.')
      clearPolling()
      return
    }

    setJobData(data)

    if (data.status === 'completed') {
      clearPolling()
      router.push(`/results/${data.resultId}`)
      return
    }

    if (data.status === 'failed') {
      clearPolling()
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
    } finally {
      router.push('/history')
    }
  }

  useEffect(() => {
    checkStatus()
    intervalRef.current = setInterval(checkStatus, 5000)
    return () => clearPolling()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // Render: network/fetch error
  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <p className="text-red-400 text-lg font-medium">{fetchError}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/history"
              className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] border border-white text-white font-semibold text-sm tracking-wide hover:bg-white hover:text-black transition-colors duration-100"
            >
              Go to History
            </Link>
            <button
              onClick={() => router.push('/upload')}
              className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] bg-white text-black font-semibold text-sm tracking-wide hover:bg-[#E5E5E5] transition-colors duration-100"
            >
              Upload a new video
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render: job failed
  if (jobData?.status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-2xl font-bold text-white">Analysis failed</h1>
          {jobData.originalFilename && (
            <p className="text-[#888888] text-sm truncate">{jobData.originalFilename}</p>
          )}
          <p className="text-[#888888] text-sm">
            Something went wrong while analysing your video. You can upload a new video or delete
            this attempt.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/upload')}
              className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] bg-white text-black font-semibold text-sm tracking-wide hover:bg-[#E5E5E5] transition-colors duration-100"
            >
              Upload new video
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] border border-red-500/40 text-red-400 text-sm font-medium hover:border-red-500 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-100"
            >
              {isDeleting ? 'Deleting…' : 'Delete this attempt'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render: loading / queued / processing
  const filename = jobData?.originalFilename ?? null

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* White arc spinner */}
        <div className="flex justify-center">
          <div className="w-16 h-16 border-2 border-[#1A1A1A] border-t-white rounded-full animate-spin" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white">
            Analyzing your run
          </h1>
          <p className="text-[#888888] text-sm">
            Examining stride, arm drive, and posture&hellip;
          </p>
          {filename && (
            <p className="text-[#444444] text-xs truncate px-4">{filename}</p>
          )}
          <p className="text-[#444444] text-xs">Usually takes 20–60 seconds</p>
        </div>

        {/* Thin indeterminate progress bar */}
        <div className="w-full bg-[#1A1A1A] h-px overflow-hidden">
          <div className="h-full bg-white animate-[progress_2s_ease-in-out_infinite]" />
        </div>

        <p className="text-[#444444] text-xs">
          You can leave this page — your result will appear in{' '}
          <Link href="/history" className="text-[#888888] hover:text-white underline transition-colors duration-100">
            History
          </Link>{' '}
          when it&apos;s ready.
        </p>
      </div>
    </div>
  )
}
