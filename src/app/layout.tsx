import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ApplyMaster — AI Auto Job Application System | Never Apply Manually Again',
  description: 'ApplyMaster uses AI to automatically apply to jobs, optimize your resume, write cover letters, and track every application. 10x your job search.',
  keywords: 'AI job application, auto apply, resume optimizer, cover letter generator, job search automation, ATS optimization',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="%23fd79a8" width="32" height="32" rx="8"/><text x="50%" y="50%" font-size="20" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="system-ui">AM</text></svg>',
  },
  openGraph: {
    title: 'ApplyMaster — AI Auto Job Application System',
    description: 'Never apply to a job manually again. AI applies, optimizes, and tracks for you.',
    url: 'https://owzify.com',
    siteName: 'ApplyMaster by 3GP.AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ApplyMaster — AI Auto Job Application System',
    description: 'Never apply to a job manually again. AI applies, optimizes, and tracks for you.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
