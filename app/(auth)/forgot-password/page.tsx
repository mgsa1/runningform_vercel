'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setLoading(false)

    if (error) {
      setError('Something went wrong. Please try again.')
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="border border-[#2A2A35] bg-[#1A1A22] rounded-2xl p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Check your inbox</h1>
        <p className="text-sm text-[#9898A8]">
          We sent a password reset link to <strong className="text-[#F0F0F5]">{email}</strong>. It may take a minute to arrive.
        </p>
        <p className="text-xs text-[#5C5C6E]">
          Didn&apos;t receive it? Check your spam folder, or{' '}
          <button
            onClick={() => setSubmitted(false)}
            className="text-[#9898A8] underline hover:text-[#F0F0F5] transition-colors duration-150"
          >
            try again
          </button>
          .
        </p>
        <Link href="/login" className="block text-sm text-[#9898A8] hover:text-[#F0F0F5] transition-colors duration-150 mt-2">
          ← Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="border border-[#2A2A35] bg-[#1A1A22] rounded-2xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="mt-1 text-sm text-[#9898A8]">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#9898A8] mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#111116] border border-[#2A2A35] rounded-xl text-sm text-[#F0F0F5] placeholder-[#5C5C6E] focus:outline-none focus:border-[#2DD4BF] transition-colors duration-150"
            placeholder="you@example.com"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 border border-red-400/30 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-[#F0F0F5] text-[#111116] text-sm font-semibold rounded-xl hover:bg-[#D8D8E0] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#9898A8]">
        <Link href="/login" className="font-medium text-[#F0F0F5] hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  )
}
