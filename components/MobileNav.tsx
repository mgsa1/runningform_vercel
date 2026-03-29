'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  {
    href: '/history',
    label: 'History',
    icon: (active: boolean) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 15" />
      </svg>
    ),
  },
  {
    href: '/upload',
    label: 'Upload',
    icon: (active: boolean) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    ),
  },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-[#1A1A1A] md:hidden z-50 flex items-center">
      {tabs.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-100 ${
              active ? 'text-white' : 'text-[#444444]'
            }`}
          >
            {icon(active)}
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
