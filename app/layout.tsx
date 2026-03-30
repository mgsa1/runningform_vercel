import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Nav from "@/components/Nav";

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "RunningForm",
  description: "AI-powered running form analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className={`${jakarta.className} bg-[#111116] text-[#F0F0F5]`}>
        <Nav />
        {children}
        <footer className="text-center text-xs text-[#5C5C6E] py-12 space-y-1">
          <p>made with love in sf</p>
          <p>mgsa</p>
          <Link href="/research" className="inline-block py-2 text-[#5C5C6E] hover:text-[#9898A8] transition-colors">
            Research basis
          </Link>
        </footer>
      </body>
    </html>
  );
}
