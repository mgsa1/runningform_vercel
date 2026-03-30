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
          className={`text-sm font-medium transition-colors duration-150 ${
            pathname === href
              ? 'text-[#F0F0F5]'
              : 'text-[#9898A8] hover:text-[#F0F0F5]'
          }`}
        >
          {label}
        </Link>
      ))}
    </>
  )
}
