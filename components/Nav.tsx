import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NavLinks from './NavLinks'
import SignOutButton from './SignOutButton'
import MobileNav from './MobileNav'

export default async function Nav() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <>
      {/* Desktop / top nav — borderless, floats into page */}
      <header className="px-6 sm:px-10 lg:px-16">
        <div className="max-w-5xl mx-auto h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/logo-simple.svg"
              alt="RunningForm"
              style={{ height: '34px', width: 'auto' }}
            />
          </Link>
          {user && (
            <nav className="hidden md:flex items-center gap-8">
              <NavLinks />
              <SignOutButton />
            </nav>
          )}
        </div>
      </header>

      {/* Mobile bottom tab bar (authenticated only) */}
      {user && <MobileNav />}
    </>
  )
}
