import type { Metadata } from 'next'
import Link from 'next/link'
import { GREENHOUSE_BOARDS, boardName } from '@/lib/job-fetch'

/*
 * Where ApplyMaster works, generated from the code that does the work.
 *
 * The earlier version of this page — written from marketing copy, not from
 * the product — listed about fifty job boards and applicant systems
 * (LinkedIn, Indeed, Workday, Lever, Ashby, iCIMS, Taleo...) and marked most
 * of them as fully automatic. Only Greenhouse form filling had ever been
 * verified; Lever's and Ashby's public posting APIs are gone; the rest were
 * never built. This page now reads its company list from the same module the
 * daily search uses, so it cannot claim a source the product does not search.
 */

export const metadata: Metadata = {
  title: 'Where ApplyMaster Works — Job Sources & Application Forms | ApplyMaster',
  description:
    'Exactly where ApplyMaster searches for jobs every morning — 31 company career sites plus Adzuna and RemoteOK — and where it fills in application forms for you.',
  alternates: { canonical: 'https://applymaster.ai/integrations' },
  openGraph: {
    title: 'Where ApplyMaster Works | ApplyMaster',
    description: 'Every source we search and every form we fill, named — and where we do not yet.',
    url: 'https://applymaster.ai/integrations',
    siteName: 'ApplyMaster',
    type: 'website',
  },
}

const COMPANIES = GREENHOUSE_BOARDS.map(boardName).sort((a, b) => a.localeCompare(b))

const ADZUNA_COUNTRIES = ['United States', 'India', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'Singapore', 'UAE']

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Where ApplyMaster Works',
  url: 'https://applymaster.ai/integrations',
  description: `ApplyMaster searches ${COMPANIES.length} company career sites plus Adzuna and RemoteOK every morning, and fills in Greenhouse application forms.`,
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <li
      className="px-3 py-1.5 rounded-full text-[13px] font-medium"
      style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', boxShadow: '0 0 0 1px var(--border)' }}
    >
      {children}
    </li>
  )
}

export default function IntegrationsPage() {
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="pt-16 pb-12">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Link href="/features" className="text-sm mb-6 inline-block" style={{ color: 'var(--accent)' }}>
            &larr; Back to features
          </Link>
          <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] mb-5">
            Where ApplyMaster works, <em className="font-display-italic" style={{ color: 'var(--accent)' }}>named</em>.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Most tools quote a number of “portals” and leave it there. Here is exactly where we search for jobs, where
            we fill in the application for you, and where we do not yet.
          </p>
          <div className="mt-10 flex flex-wrap gap-10">
            {[
              [String(COMPANIES.length), 'company career sites'],
              ['2', 'job aggregators'],
              ['Every morning', 'searched for your roles'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-[2.4rem] leading-none" style={{ color: 'var(--text)' }}>
                  {n}
                </div>
                <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="py-12" style={{ background: 'var(--bg-secondary)' }}>
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <h2 className="font-display text-[clamp(1.7rem,3.2vw,2.3rem)] mb-2">Where we search</h2>
          <p className="mb-8 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            Every open role on these sites is checked against your preferences each morning.
          </p>

          <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>
            Company career sites
          </h3>
          <ul className="flex flex-wrap gap-2 mb-10">
            {COMPANIES.map(c => (
              <Chip key={c}>{c}</Chip>
            ))}
          </ul>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', boxShadow: '0 0 0 1px var(--border)' }}>
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>
                Adzuna
              </h3>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                A job search engine that gathers listings from across the web. Searched for your top role in your country:{' '}
                {ADZUNA_COUNTRIES.join(', ')}.
              </p>
            </div>
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', boxShadow: '0 0 0 1px var(--border)' }}>
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>
                RemoteOK
              </h3>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Remote roles from the RemoteOK feed, for anyone who prefers remote work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Forms */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <h2 className="font-display text-[clamp(1.7rem,3.2vw,2.3rem)] mb-2">Where we fill in the application</h2>
          <p className="mb-8 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            On these, ApplyMaster completes the employer’s real form with your details, resume and answers. You review it
            and press send.
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl p-6" style={{ background: 'var(--green-dim)', boxShadow: '0 0 0 1px var(--border)' }}>
              <h3 className="font-semibold" style={{ color: 'var(--green)' }}>
                Greenhouse
              </h3>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Every company above, and any other employer whose applications run on Greenhouse. Verified on live
                postings, including the drop-down screening questions.
              </p>
            </div>
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', boxShadow: '0 0 0 1px var(--border)' }}>
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>
                Everywhere else
              </h3>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                For jobs found through Adzuna or RemoteOK, and employers on Workday, Lever, Ashby, iCIMS and others, you
                apply on the employer’s site — after tailoring your resume and generating a cover letter for the role in
                ApplyMaster. We add a system here only after it works on live postings.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl p-6" style={{ background: 'var(--bg-secondary)' }}>
            <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>
              Two things we never do
            </h3>
            <ul className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <li>
                <strong style={{ color: 'var(--text)' }}>Bypass a CAPTCHA.</strong> It is there to require a person;
                getting around it breaks the employer’s terms and can get an application discarded. The form waits for you.
              </li>
              <li>
                <strong style={{ color: 'var(--text)' }}>Answer voluntary questions for you.</strong> Diversity and
                self-identification questions are always yours to answer, or not.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-b from-transparent to-[var(--accent-dim)]">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] mb-5">See tomorrow’s matches</h2>
          <p className="mb-10 text-lg" style={{ color: 'var(--text-muted)' }}>
            Tell us the roles you want. The search runs every morning after that.
          </p>
          <Link
            href="/signup"
            className="rounded-full px-10 py-4 text-base font-semibold shadow-lg"
            style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
          >
            Start free
          </Link>
        </div>
      </section>
    </div>
  )
}
