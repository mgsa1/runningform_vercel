'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function normalizeAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('already registered') || lower.includes('user already exists')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (lower.includes('password') && lower.includes('short')) {
    return 'Password must be at least 6 characters.'
  }
  if (lower.includes('invalid email')) {
    return 'Please enter a valid email address.'
  }
  if (lower.includes('too many requests') || lower.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  return 'Something went wrong. Please try again.'
}

export default function SignupPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    })

    if (error) {
      setError(normalizeAuthError(error.message))
      setLoading(false)
      return
    }

    if (!data.session) {
      setLoading(false)
      setAwaitingConfirmation(true)
      return
    }

    router.push('/onboarding')
  }

  if (awaitingConfirmation) {
    return (
      <div className="border border-[#2A2A35] bg-[#1A1A22] rounded-2xl p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Check your inbox</h1>
        <p className="text-sm text-[#9898A8]">
          We sent a confirmation link to <strong className="text-[#F0F0F5]">{email}</strong>. Click it to activate your
          account, then sign in.
        </p>
        <p className="text-xs text-[#5C5C6E]">
          Didn&apos;t receive it? Check your spam folder.
        </p>
        <Link
          href="/login"
          className="inline-block mt-2 text-sm font-medium text-[#F0F0F5] hover:underline"
        >
          Go to sign in →
        </Link>
      </div>
    )
  }

  return (
    <div className="border border-[#2A2A35] bg-[#1A1A22] rounded-2xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="mt-1 text-sm text-[#9898A8]">Start analysing your running form</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="display-name" className="block text-sm font-medium text-[#9898A8] mb-1.5">
            Display name
          </label>
          <input
            id="display-name"
            type="text"
            autoComplete="name"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#111116] border border-[#2A2A35] rounded-xl text-sm text-[#F0F0F5] placeholder-[#5C5C6E] focus:outline-none focus:border-[#2DD4BF] transition-colors duration-150"
            placeholder="Alex"
          />
        </div>

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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#9898A8] mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 pr-10 bg-[#111116] border border-[#2A2A35] rounded-xl text-sm text-[#F0F0F5] placeholder-[#5C5C6E] focus:outline-none focus:border-[#2DD4BF] transition-colors duration-150"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-[#5C5C6E] hover:text-[#F0F0F5] transition-colors duration-150"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-[#5C5C6E]">Minimum 6 characters</p>
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
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#9898A8]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[#F0F0F5] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
