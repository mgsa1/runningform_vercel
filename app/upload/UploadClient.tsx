'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import VideoUploader from '@/components/VideoUploader'
import type { PoseExtractionResult, BiomechanicsReport } from '@/lib/pose/types'

interface RunnerContext {
  pace?: string
  fatigue?: number
}

interface Props {
  userId: string
}

const FILMING_TIPS = [
  'Film from the SIDE — perpendicular to your running direction',
  'Set your phone at hip height on a stable surface',
  'Run past showing 3-4 full strides at your normal pace',
  'Show head to feet, including the ground',
  'Normal speed video is fine — no slow-mo needed',
  'Good lighting helps — outdoor daylight is ideal',
]

export default function UploadClient({ userId }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [paceValue, setPaceValue] = useState('')
  const [paceUnit, setPaceUnit] = useState<'km' | 'mi'>('km')
  const [fatigue, setFatigue] = useState<number | ''>('')
  const [tipsOpen, setTipsOpen] = useState(false)

  async function handleUploadComplete(
    _videoSessionId: string,
    framePaths: string[],
    filename: string,
    poseData: PoseExtractionResult | null,
    biomechanicsRaw: BiomechanicsReport | null
  ) {
    setError(null)

    const runnerContext: RunnerContext = {}
    if (paceValue.trim()) runnerContext.pace = `${paceValue.trim()} /${paceUnit}`
    if (fatigue !== '') runnerContext.fatigue = Number(fatigue)

    // Re-compute biomechanics with pace context if pose data is available
    let biomechanics = biomechanicsRaw
    if (poseData && poseData.frames.length > 0 && runnerContext.pace) {
      try {
        const { parsePaceTier, computeBiomechanics, analyzeGait } = await import('@/lib/pose')
        const paceTier = parsePaceTier(runnerContext.pace)
        const gaitResult = analyzeGait(poseData.frames, poseData.visibleSide)
        if (gaitResult.gaitCyclesDetected >= 1) {
          biomechanics = computeBiomechanics(poseData.frames, gaitResult, paceTier)
        }
      } catch {
        // Fall back to the raw biomechanics computed without pace context
      }
    }

    // Step 1: Create the DB session via presign-frames
    let sessionId: string
    try {
      const presignRes = await fetch('/api/uploads/presign-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, frameCount: framePaths.length }),
      })

      if (!presignRes.ok) {
        if (presignRes.status === 429) {
          setError("You've reached the daily limit of 3 analyses. Come back tomorrow.")
          return
        }
        const body = await presignRes.json().catch(() => ({}))
        setError(body.error ?? `Failed to create session (${presignRes.status})`)
        return
      }

      const presignData = await presignRes.json()
      sessionId = presignData.sessionId
    } catch {
      setError('Network error while creating session.')
      return
    }

    // Step 2: Attach frame paths, runner context, and trigger the Inngest job
    console.log('[submit] biomechanics:', biomechanics ? `present (cycles=${biomechanics.gaitCyclesDetected})` : 'null')
    try {
      const submitRes = await fetch('/api/uploads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          framePaths,
          runnerContext: Object.keys(runnerContext).length ? runnerContext : undefined,
          biomechanics: biomechanics ?? undefined,
        }),
      })

      if (!submitRes.ok) {
        const body = await submitRes.json().catch(() => ({}))
        setError(body.error ?? `Failed to submit job (${submitRes.status})`)
        return
      }
    } catch {
      setError('Network error while submitting job.')
      return
    }

    // Step 3: Redirect to the status polling page
    router.push(`/sessions/${sessionId}/status`)
  }

  function handleError(message: string) {
    setError(message)
  }

  return (
    <div className="space-y-6">
      {/* Filming tips */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5">
        <button
          type="button"
          onClick={() => setTipsOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-blue-400 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span className="flex-1 text-sm font-medium text-blue-300">
            How to film for best results
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-blue-500/60 transition-transform shrink-0 ${tipsOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {tipsOpen && (
          <ul className="px-4 pb-4 space-y-2 border-t border-blue-500/10 pt-3">
            {FILMING_TIPS.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-blue-200/70 leading-snug">
                <span className="text-blue-400 shrink-0 mt-0.5">✓</span>
                {tip}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Run context */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Run context{' '}
          <span className="normal-case font-normal text-gray-600">
            — optional, helps the AI give better advice
          </span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Pace</label>
            <div className="flex">
              <input
                type="text"
                value={paceValue}
                onChange={(e) => setPaceValue(e.target.value)}
                placeholder="5:30"
                className="flex-1 min-w-0 bg-gray-900 border border-gray-700 rounded-l-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
              />
              <select
                value={paceUnit}
                onChange={(e) => setPaceUnit(e.target.value as 'km' | 'mi')}
                className="bg-gray-800 border border-l-0 border-gray-700 rounded-r-lg px-2 py-2 text-sm text-gray-300 focus:outline-none focus:border-gray-500"
              >
                <option value="km">/km</option>
                <option value="mi">/mi</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Fatigue level</label>
            <select
              value={fatigue}
              onChange={(e) => setFatigue(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
            >
              <option value="">Not specified</option>
              <option value="2">Fresh</option>
              <option value="5">Moderate</option>
              <option value="8">Tired</option>
            </select>
          </div>
        </div>
      </div>

      <VideoUploader
        userId={userId}
        onUploadComplete={handleUploadComplete}
        onError={handleError}
      />
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          {error}
        </p>
      )}
    </div>
  )
}
