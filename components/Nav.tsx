import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NavLinks from './NavLinks'
import SignOutButton from './SignOutButton'

export default async function Nav() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="border-b border-gray-800 bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/logo-simple.svg"
            alt="RunningForm"
            style={{ height: '34px', width: 'auto' }}
          />
        </Link>
        {user && (
          <nav className="flex items-center gap-6">
            <NavLinks />
            <SignOutButton />
          </nav>
        )}
      </div>
    </header>
  )
}
