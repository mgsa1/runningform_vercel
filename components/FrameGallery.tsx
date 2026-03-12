'use client'

import { useState } from 'react'

interface FrameGalleryProps {
  frameUrls: string[]
}

export default function FrameGallery({ frameUrls }: FrameGalleryProps) {
  const [selected, setSelected] = useState(0)

  if (frameUrls.length === 0) return null

  return (
    <div className="flex gap-2 rounded-xl overflow-hidden bg-gray-800">
      {/* Main frame */}
      <div className="flex-1 min-w-0 aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frameUrls[selected]}
          alt={`Frame ${selected + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Vertical thumbnail strip */}
      {frameUrls.length > 1 && (
        <div className="w-14 flex flex-col gap-1 overflow-y-auto p-1 bg-gray-900/60">
          {frameUrls.map((url, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`flex-shrink-0 rounded overflow-hidden border-2 transition-colors ${
                i === selected ? 'border-blue-500' : 'border-transparent'
              }`}
              aria-label={`Frame ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Thumbnail ${i + 1}`}
                className="w-full aspect-video object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
