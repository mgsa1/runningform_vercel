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
      className="bg-gray-900 rounded-2xl border border-gray-800 p-8 space-y-6"
    >
      {/* Display name */}
      <div>
        <label
          htmlFor="display_name"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          defaultValue={defaultDisplayName}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Alex"
        />
      </div>

      {/* Experience level */}
      <div>
        <label
          htmlFor="experience_level"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Experience level
        </label>
        <select
          id="experience_level"
          name="experience_level"
          required
          defaultValue=""
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <label htmlFor="height_cm" className="block text-sm font-medium text-gray-300 mb-1">
          Height <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            id="height_cm"
            name="height_cm"
            type="number"
            min={100}
            max={250}
            step={1}
            className="w-28 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="175"
          />
          <span className="text-sm text-gray-500">cm</span>
        </div>
        <p className="mt-1 text-xs text-gray-600">Helps display oscillation and foot placement in centimetres</p>
      </div>

      {/* Goals */}
      <div>
        <p className="block text-sm font-medium text-gray-300 mb-0.5">
          Goals <span className="font-normal text-gray-500">(select all that apply)</span>
        </p>
        <p className="text-xs text-gray-500 mb-2">
          We&apos;ll tailor drill recommendations to what matters most to you.
        </p>
        <div className="space-y-2">
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
                className="h-4 w-4 rounded border-gray-700 text-blue-500 focus:ring-blue-500 bg-gray-800"
              />
              <span className="text-sm text-gray-300">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Consent */}
      <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="video_consent"
            required
            className="mt-0.5 h-4 w-4 rounded border-gray-700 text-blue-500 focus:ring-blue-500 bg-gray-800 shrink-0"
          />
          <span className="text-sm text-gray-400 leading-relaxed">
            Your video frames are sent to an AI for form analysis. They are never
            used to train AI models and are deleted after 30 days.
          </span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Saving…' : 'Continue to upload'}
      </button>
    </form>
  )
}
