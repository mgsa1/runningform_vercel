'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  FramePoseData,
  PoseExtractionResult,
  BiomechanicsReport,
  VideoQualityFeedback,
} from '@/lib/pose/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const POSE_FRAME_COUNT = 50       // dense frames for pose detection (~17fps from 3s)
const CLAUDE_FRAME_COUNT = 30     // frames sent to Claude for visual analysis
const POSE_WINDOW_S = 3           // seconds of video to extract dense frames from
const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 360
const JPEG_QUALITY = 0.85
const MAX_FILE_BYTES = 500 * 1024 * 1024 // 500 MB
const MIN_DURATION_S = 3
const ACCEPTED_MIME = new Set(['video/mp4', 'video/quicktime', 'video/webm'])

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'idle' | 'validating' | 'ready' | 'extracting' | 'detecting' | 'uploading' | 'done' | 'error'

interface Props {
  userId: string
  onUploadComplete: (
    sessionId: string,
    framePaths: string[],
    filename: string,
    poseData: PoseExtractionResult | null,
    biomechanics: BiomechanicsReport | null
  ) => void
  onError: (message: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    function onSeeked() {
      video.removeEventListener('seeked', onSeeked)
      resolve()
    }
    video.addEventListener('seeked', onSeeked)
    video.currentTime = time
  })
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))),
      'image/jpeg',
      JPEG_QUALITY
    )
  })
}

function loadDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    const url = URL.createObjectURL(file)
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read video metadata.'))
    }
    video.src = url
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VideoUploader({ userId, onUploadComplete, onError }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [progressMsg, setProgressMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [qualityFeedback, setQualityFeedback] = useState<VideoQualityFeedback | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ─── File validation ───────────────────────────────────────────────────────

  async function handleFile(file: File) {
    if (!ACCEPTED_MIME.has(file.type)) {
      onError('Only MP4, MOV, and WebM videos are supported.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      onError('Video must be under 500 MB.')
      return
    }

    setStatus('validating')
    setProgressMsg('Checking video…')
    setQualityFeedback(null)

    let duration: number
    try {
      duration = await loadDuration(file)
    } catch {
      setStatus('idle')
      setProgressMsg('')
      onError('Your video format could not be read. Please try a .mp4 or .mov file.')
      return
    }

    if (duration < MIN_DURATION_S) {
      setStatus('idle')
      setProgressMsg('')
      onError(`Video must be at least ${MIN_DURATION_S} seconds long.`)
      return
    }

    setSelectedFile(file)
    setStatus('ready')
    setProgressMsg('')
  }

  // ─── Frame extraction + pose detection + upload ─────────────────────────────

  async function startUpload() {
    if (!selectedFile || !videoRef.current || !canvasRef.current) return

    const supabase = createClient()
    const sessionId = crypto.randomUUID()
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    const objectUrl = URL.createObjectURL(selectedFile)
    video.src = objectUrl

    try {
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve()
        video.onerror = () => reject(new Error('Your video format could not be read. Please try a .mp4 or .mov file.'))
      })

      const duration = video.duration

      // ── Phase 1: Dense frame extraction from middle window ─────────────
      setStatus('extracting')

      // Calculate extraction window: middle of the video, up to POSE_WINDOW_S
      const windowDuration = Math.min(POSE_WINDOW_S, duration)
      const windowStart = (duration - windowDuration) / 2
      const frameCount = duration < POSE_WINDOW_S
        ? Math.min(POSE_FRAME_COUNT, Math.round(duration * 17))  // ~17fps for short videos
        : POSE_FRAME_COUNT

      // Extract all dense frames to canvas and save as blobs
      const allBlobs: Blob[] = []
      const frameTimestamps: number[] = []

      for (let i = 0; i < frameCount; i++) {
        const time = windowStart + windowDuration * (i + 0.5) / frameCount
        setProgressMsg(`Extracting frame ${i + 1} of ${frameCount}…`)

        await seekToTime(video, time)
        ctx.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        const blob = await canvasToBlob(canvas)
        allBlobs.push(blob)
        frameTimestamps.push(time)
      }

      // ── Phase 2: Pose detection ────────────────────────────────────────
      setStatus('detecting')
      setProgressMsg('Loading pose model…')

      // Lazy-load the pose module to avoid bundling WASM in initial page load
      const poseModule = await import('@/lib/pose')
      await poseModule.initPoseDetector()

      const poseFrames: FramePoseData[] = []

      for (let i = 0; i < frameCount; i++) {
        setProgressMsg(`Analyzing stride ${i + 1} of ${frameCount}…`)

        // Re-seek and draw for pose detection (canvas already processed,
        // but we need to re-render each frame)
        const time = frameTimestamps[i]
        await seekToTime(video, time)
        ctx.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        const poseData = await poseModule.detectPose(canvas, i, time)
        if (poseData) {
          poseFrames.push(poseData)
        }
      }

      // ── Phase 3: Gait analysis + frame selection ───────────────────────
      setProgressMsg('Analyzing gait cycle…')

      const visibleSide = poseModule.detectVisibleSide(poseFrames)
      const gaitResult = poseModule.analyzeGait(poseFrames, visibleSide)

      // Quality feedback
      const feedback = poseModule.assessVideoQuality(poseFrames, frameCount, gaitResult)
      setQualityFeedback(feedback)

      // Select the 10 best frames for Claude
      let selectedFrameIndices: number[]
      if (gaitResult.gaitCyclesDetected >= 1) {
        selectedFrameIndices = poseModule.selectFramesForClaude(poseFrames, gaitResult, CLAUDE_FRAME_COUNT)
      } else {
        selectedFrameIndices = poseModule.selectFramesEvenly(frameCount, CLAUDE_FRAME_COUNT)
      }

      // Build selected frames' pose data (strip worldLandmarks to save space)
      const selectedFrames = selectedFrameIndices
        .filter((idx) => poseFrames[idx])
        .map((idx) => ({
          frameIndex: idx,
          landmarks: poseFrames[idx].landmarks,
        }))

      // Build the pose extraction result
      const poseExtractionResult: PoseExtractionResult = {
        frames: poseFrames,
        selectedFrames,
        modelVersion: 'pose_landmarker_lite',
        extractedAt: new Date().toISOString(),
        visibleSide,
        framesWithValidPose: poseFrames.length,
      }

      // Compute biomechanics (done client-side to avoid server cost)
      let biomechanicsReport: BiomechanicsReport | null = null
      console.log(`[pose] Gait analysis: ${gaitResult.gaitCyclesDetected} cycles detected, ${gaitResult.contactFrameIndices.length} contacts, ${poseFrames.length}/${frameCount} frames with valid pose, side=${visibleSide}`)
      if (gaitResult.gaitCyclesDetected >= 1) {
        biomechanicsReport = poseModule.computeBiomechanics(poseFrames, gaitResult, 'unknown')
        console.log('[pose] Biomechanics computed:', JSON.stringify({
          footPlacement: biomechanicsReport.footPlacement?.value,
          trunkLean: biomechanicsReport.trunkLean?.value,
          vo: biomechanicsReport.verticalOscillation?.value,
          strike: biomechanicsReport.footStrikeType?.type,
        }))
      } else {
        console.warn('[pose] No gait cycles detected — biomechanics will be null')
      }

      // ── Phase 4: Upload selected frames ────────────────────────────────
      setStatus('uploading')
      const framePaths: string[] = []

      for (let i = 0; i < selectedFrameIndices.length; i++) {
        const blobIdx = selectedFrameIndices[i]
        if (blobIdx >= allBlobs.length) continue

        setProgressMsg(`Uploading frame ${i + 1} of ${selectedFrameIndices.length}…`)
        const path = `frames/${userId}/${sessionId}/${i}.jpg`

        const { error } = await supabase.storage
          .from('frames')
          .upload(path, allBlobs[blobIdx], { contentType: 'image/jpeg', upsert: false })

        if (error) {
          setStatus('error')
          onError('Upload failed. Please check your connection and try again.')
          return
        }

        framePaths.push(path)
      }

      setStatus('done')
      setProgressMsg('')
      onUploadComplete(
        sessionId,
        framePaths,
        selectedFile.name,
        poseExtractionResult,
        biomechanicsReport
      )
    } catch (err) {
      setStatus('error')
      onError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      URL.revokeObjectURL(objectUrl)
      video.src = ''
    }
  }

  // ─── Drag-and-drop handlers ────────────────────────────────────────────────

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  function clearSelection() {
    setSelectedFile(null)
    setStatus('idle')
    setProgressMsg('')
    setQualityFeedback(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ─── Derived state ─────────────────────────────────────────────────────────

  const isProcessing = ['validating', 'extracting', 'detecting', 'uploading'].includes(status)

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Hidden video + canvas */}
      <video
        ref={videoRef}
        muted
        playsInline
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!selectedFile && !isProcessing) fileInputRef.current?.click()
        }}
        className={[
          'relative border-2 border-dashed rounded-xl p-10 text-center transition-colors',
          isDragging
            ? 'border-gray-500 bg-gray-800'
            : 'border-gray-700 hover:border-gray-500',
          !selectedFile && !isProcessing ? 'cursor-pointer' : 'cursor-default',
        ].join(' ')}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />

        {!selectedFile ? (
          <div>
            <p className="text-sm font-medium text-gray-400">
              Drop your video here, or{' '}
              <span className="text-white underline">browse</span>
            </p>
            <p className="mt-1 text-xs text-gray-600">
              MP4 · MOV · WebM &nbsp;·&nbsp; max 500 MB &nbsp;·&nbsp; min 3 seconds
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="text-left min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            {!isProcessing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  clearSelection()
                }}
                className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress message */}
      {progressMsg && (
        <p className="text-center text-sm text-gray-500">{progressMsg}</p>
      )}

      {/* Progress bar */}
      {(status === 'extracting' || status === 'detecting' || status === 'uploading') && (() => {
        const match = progressMsg.match(/(\d+) of (\d+)/)
        if (!match) return null
        const current = parseInt(match[1])
        const total = parseInt(match[2])
        const pct = Math.round((current / total) * 100)
        return (
          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                status === 'detecting' ? 'bg-purple-500' : 'bg-blue-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )
      })()}

      {/* Quality feedback warnings */}
      {qualityFeedback && qualityFeedback.issues.length > 0 && (
        <div className="space-y-2">
          {qualityFeedback.issues.map((issue, i) => (
            <div
              key={i}
              className={`text-sm px-4 py-3 rounded-lg ${
                issue.severity === 'error'
                  ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
              }`}
            >
              {issue.message}
            </div>
          ))}
        </div>
      )}

      {/* Action button */}
      {status === 'ready' && (
        <button
          type="button"
          onClick={startUpload}
          className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Analyse my run
        </button>
      )}

      {isProcessing && (
        <div className="w-full py-2.5 px-4 bg-gray-800 text-gray-400 text-sm font-medium rounded-lg text-center select-none">
          {status === 'detecting' ? 'Analyzing your running form…' : 'Processing…'}
        </div>
      )}

      {status === 'done' && (
        <div className="w-full py-2.5 px-4 bg-green-500/10 text-green-400 border border-green-500/30 text-sm font-medium rounded-lg text-center">
          Frames uploaded — preparing analysis…
        </div>
      )}
    </div>
  )
}
