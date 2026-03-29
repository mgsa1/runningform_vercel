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
      <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Check your inbox</h1>
        <p className="text-sm text-[#888888]">
          We sent a password reset link to <strong className="text-white">{email}</strong>. It may take a minute to arrive.
        </p>
        <p className="text-xs text-[#444444]">
          Didn&apos;t receive it? Check your spam folder, or{' '}
          <button
            onClick={() => setSubmitted(false)}
            className="text-[#888888] underline hover:text-white transition-colors duration-100"
          >
            try again
          </button>
          .
        </p>
        <Link href="/login" className="block text-sm text-[#888888] hover:text-white transition-colors duration-100 mt-2">
          ← Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Reset your password</h1>
        <p className="mt-1 text-sm text-[#888888]">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#888888] mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 bg-black border border-[#1A1A1A] text-sm text-white placeholder-[#444444] focus:outline-none focus:border-white transition-colors duration-100"
            placeholder="you@example.com"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 border border-red-500/30 px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-white text-black text-sm font-semibold tracking-wide hover:bg-[#E5E5E5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-100"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#888888]">
        <Link href="/login" className="font-medium text-white hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  )
}
