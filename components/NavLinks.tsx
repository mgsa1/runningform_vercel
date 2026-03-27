'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavLinks() {
  const pathname = usePathname()

  const links = [
    { href: '/upload', label: 'Upload' },
    { href: '/history', label: 'History' },
  ]

  return (
    <>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`text-sm transition-colors ${
            pathname === href
              ? 'text-white font-medium'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {label}
        </Link>
      ))}
    </>
  )
}
