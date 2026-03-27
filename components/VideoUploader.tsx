'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ────────────────────────────────────────────────────────────────

const FRAME_COUNT = 10
const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 360
const JPEG_QUALITY = 0.85
const MAX_FILE_BYTES = 500 * 1024 * 1024 // 500 MB
const MIN_DURATION_S = 3
const ACCEPTED_MIME = new Set(['video/mp4', 'video/quicktime', 'video/webm'])

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'idle' | 'validating' | 'ready' | 'extracting' | 'uploading' | 'done' | 'error'

interface Props {
  userId: string
  onUploadComplete: (sessionId: string, framePaths: string[], filename: string) => void
  onError: (message: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Wraps the 'seeked' event in a Promise — required by P5 before calling drawImage */
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

/** Loads only video metadata to check duration — uses a throwaway element */
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

  const fileInputRef = useRef<HTMLInputElement>(null)
  // Hidden video + canvas kept in DOM for reliable cross-browser seek support
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

  // ─── Frame extraction + upload ─────────────────────────────────────────────

  async function startUpload() {
    if (!selectedFile || !videoRef.current || !canvasRef.current) return

    const supabase = createClient()
    const sessionId = crypto.randomUUID()
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    // Load the file into the hidden video element
    const objectUrl = URL.createObjectURL(selectedFile)
    video.src = objectUrl

    try {
      // Wait for metadata so video.duration is available
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve()
        video.onerror = () => reject(new Error('Your video format could not be read. Please try a .mp4 or .mov file.'))
      })

      const duration = video.duration

      // ── Phase 1: Extract frames ──────────────────────────────────────────
      setStatus('extracting')
      const blobs: Blob[] = []

      for (let i = 0; i < FRAME_COUNT; i++) {
        // Evenly spaced across the video, with a half-segment margin at each end
        const time = duration * (i + 0.5) / FRAME_COUNT
        setProgressMsg(`Extracting frame ${i + 1} of ${FRAME_COUNT}…`)

        // P5: MUST await 'seeked' before drawing
        await seekToTime(video, time)
        ctx.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        const blob = await canvasToBlob(canvas)
        blobs.push(blob)
      }

      // ── Phase 2: Upload frames ───────────────────────────────────────────
      setStatus('uploading')
      const framePaths: string[] = []

      for (let i = 0; i < blobs.length; i++) {
        setProgressMsg(`Uploading frame ${i + 1} of ${FRAME_COUNT}…`)
        const path = `frames/${userId}/${sessionId}/${i}.jpg`

        const { error } = await supabase.storage
          .from('frames')
          .upload(path, blobs[i], { contentType: 'image/jpeg', upsert: false })

        if (error) {
          setStatus('error')
          onError('Upload failed. Please check your connection and try again.')
          return
        }

        framePaths.push(path)
      }

      setStatus('done')
      setProgressMsg('')
      onUploadComplete(sessionId, framePaths, selectedFile.name)
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
    // Only clear when leaving the zone itself, not a child element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  function clearSelection() {
    setSelectedFile(null)
    setStatus('idle')
    setProgressMsg('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ─── Derived state ─────────────────────────────────────────────────────────

  const isProcessing = ['validating', 'extracting', 'uploading'].includes(status)

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Hidden video + canvas — kept in DOM for cross-browser seek reliability */}
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

      {/* Progress bar (extracting + uploading) */}
      {(status === 'extracting' || status === 'uploading') && (() => {
        const match = progressMsg.match(/(\d+) of (\d+)/)
        if (!match) return null
        const current = parseInt(match[1])
        const total = parseInt(match[2])
        const pct = Math.round((current / total) * 100)
        return (
          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        )
      })()}

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
          Processing…
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
