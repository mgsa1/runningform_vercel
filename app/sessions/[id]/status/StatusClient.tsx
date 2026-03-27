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
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <p className="text-red-400 text-lg font-medium">{fetchError}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/history"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
            >
              Go to History
            </Link>
            <button
              onClick={() => router.push('/upload')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
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
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-5xl mb-2">⚠️</div>
          <h1 className="font-heading text-2xl font-bold text-white">Analysis failed</h1>
          {jobData.originalFilename && (
            <p className="text-gray-400 text-sm truncate">{jobData.originalFilename}</p>
          )}
          <p className="text-gray-500 text-sm">
            Something went wrong while analysing your video. You can upload a new video or delete
            this attempt.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => router.push('/upload')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Upload new video
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded-lg font-medium transition-colors"
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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Spinner */}
        <div className="flex justify-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        </div>

        <div className="space-y-3">
          <h1 className="font-heading text-2xl font-bold text-white">
            Analysing your running form
          </h1>
          <p className="text-gray-400 text-sm">
            This usually takes 20–60 seconds
          </p>
          {filename && (
            <p className="text-gray-500 text-xs truncate px-4">{filename}</p>
          )}
        </div>

        {/* Animated progress bar (indeterminate) */}
        <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" />
        </div>

        <div className="space-y-2">
          <p className="text-gray-600 text-xs">
            {jobData?.status === 'processing' ? 'Processing…' : 'Queued…'}
          </p>
          <p className="text-gray-700 text-xs">
            You can leave this page — your result will appear in{' '}
            <Link href="/history" className="text-gray-500 hover:text-gray-400 underline">
              History
            </Link>{' '}
            when it&apos;s ready.
          </p>
        </div>
      </div>
    </div>
  )
}
