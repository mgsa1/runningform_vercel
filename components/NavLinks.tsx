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
          className={`text-sm font-medium transition-colors duration-100 ${
            pathname === href
              ? 'text-white'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          {label}
        </Link>
      ))}
    </>
  )
}
