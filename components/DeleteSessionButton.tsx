'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  sessionId: string
}

export default function DeleteSessionButton({ sessionId }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
      router.push('/history')
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#888888]">Delete this attempt?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-red-400 hover:text-red-300 font-medium disabled:opacity-50 transition-colors duration-100"
        >
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-[#444444] hover:text-[#888888] transition-colors duration-100"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setConfirming(true)
      }}
      className="text-xs text-[#444444] hover:text-red-400 transition-colors duration-100"
    >
      Delete
    </button>
  )
}
