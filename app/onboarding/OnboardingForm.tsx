'use client'

import { useState, useTransition } from 'react'
import { createProfile } from './actions'

const GOALS = [
  { value: 'speed', label: 'Run faster' },
  { value: 'distance', label: 'Run further' },
  { value: 'injury-prevention', label: 'Prevent injuries' },
  { value: 'technique', label: 'Improve technique' },
] as const

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner — less than 1 year of running' },
  { value: 'recreational', label: 'Recreational — run regularly for fun' },
  { value: 'competitive', label: 'Competitive — race or train with goals' },
] as const

const inputClass = "w-full px-3 py-2.5 bg-black border border-[#1A1A1A] text-sm text-white placeholder-[#444444] focus:outline-none focus:border-white transition-colors duration-100"
const labelClass = "block text-sm font-medium text-[#888888] mb-1.5"

export default function OnboardingForm({
  defaultDisplayName,
}: {
  defaultDisplayName: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])

  function toggleGoal(value: string) {
    setSelectedGoals((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value]
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    // Append multi-select goals manually (checkboxes use controlled state)
    formData.delete('goals')
    selectedGoals.forEach((g) => formData.append('goals', g))

    startTransition(async () => {
      const result = await createProfile(formData)
      if (result?.error) {
        setError(result.error)
      }
      // On success, server action calls redirect('/upload') — no client handling needed.
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-[#1A1A1A] bg-[#0A0A0A] p-8 space-y-6"
    >
      {/* Display name */}
      <div>
        <label htmlFor="display_name" className={labelClass}>
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          defaultValue={defaultDisplayName}
          className={inputClass}
          placeholder="Alex"
        />
      </div>

      {/* Experience level */}
      <div>
        <label htmlFor="experience_level" className={labelClass}>
          Experience level
        </label>
        <select
          id="experience_level"
          name="experience_level"
          required
          defaultValue=""
          className={`${inputClass} bg-black`}
        >
          <option value="" disabled>
            Select your level…
          </option>
          {EXPERIENCE_LEVELS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Height (optional) */}
      <div>
        <label htmlFor="height_cm" className={labelClass}>
          Height <span className="font-normal text-[#444444]">(optional)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            id="height_cm"
            name="height_cm"
            type="number"
            min={100}
            max={250}
            step={1}
            className="w-28 px-3 py-2.5 bg-black border border-[#1A1A1A] text-sm text-white placeholder-[#444444] focus:outline-none focus:border-white transition-colors duration-100"
            placeholder="175"
          />
          <span className="text-sm text-[#888888]">cm</span>
        </div>
        <p className="mt-1 text-xs text-[#444444]">Helps display oscillation and foot placement in centimetres</p>
      </div>

      {/* Goals */}
      <div>
        <p className={labelClass}>
          Goals <span className="font-normal text-[#444444]">(select all that apply)</span>
        </p>
        <p className="text-xs text-[#444444] mb-3">
          We&apos;ll tailor drill recommendations to what matters most to you.
        </p>
        <div className="space-y-3">
          {GOALS.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                name="goals"
                value={value}
                checked={selectedGoals.includes(value)}
                onChange={() => toggleGoal(value)}
                className="h-4 w-4 border-[#1A1A1A] bg-black accent-white"
              />
              <span className="text-sm text-[#888888]">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Consent */}
      <div className="border border-[#1A1A1A] p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="video_consent"
            required
            className="mt-0.5 h-4 w-4 border-[#1A1A1A] bg-black accent-white shrink-0"
          />
          <span className="text-sm text-[#888888] leading-relaxed">
            Your video frames are sent to an AI for form analysis. They are never
            used to train AI models and are deleted after 30 days.
          </span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-400 border border-red-500/30 px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 px-4 bg-white text-black text-sm font-semibold tracking-wide hover:bg-[#E5E5E5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-100"
      >
        {isPending ? 'Saving…' : 'Continue to upload'}
      </button>
    </form>
  )
}
