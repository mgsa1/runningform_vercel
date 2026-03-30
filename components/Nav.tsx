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
      {/* Desktop nav — sticky with blur */}
      <header className="sticky top-0 z-50 bg-[#1A1A22]/80 backdrop-blur-md border-b border-[#2A2A35]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-12 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/logo-simple.svg"
              alt="RunningForm"
              style={{ height: '28px', width: 'auto' }}
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
