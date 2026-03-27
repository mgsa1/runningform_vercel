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
      <body className={`${jakarta.className} bg-gray-950`}>
        <Nav />
        {children}
        <footer className="text-center text-sm text-gray-500 py-8 space-y-1">
          <p>made with love in sf</p>
          <p>mgsa</p>
          <Link href="/research" className="inline-block py-2 text-gray-400 hover:text-gray-300 transition-colors">
            Research basis
          </Link>
        </footer>
      </body>
    </html>
  );
}
