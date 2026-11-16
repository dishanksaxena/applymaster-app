import type { Metadata } from 'next'
import Link from 'next/link'
import { postMetadata, PostJsonLd } from '@/lib/blog/seo'
import { postBySlug } from '@/lib/blog/posts'

const SLUG = 'remote-jobs-2026-rto-mandates'
const title = postBySlug(SLUG)!.title

export const metadata: Metadata = postMetadata(SLUG, [
  'remote jobs 2026',
  'return to office 2026',
  'RTO mandate',
  'how to find remote jobs',
  'five day office mandate',
  'hybrid jobs 2026',
  'remote work jobs',
])

const FAQS = [
  {
    q: 'Are remote jobs disappearing in 2026?',
    a: 'Fewer, not gone. Five-day office mandates have spread at large employers, but hybrid is still the most common arrangement and many smaller and remote-first companies keep hiring remotely. Remote roles are scarcer and get more applicants, so speed and targeting matter more.',
  },
  {
    q: 'Can I apply to a remote job in another country?',
    a: 'Often not. Many remote roles require you to live in a specific country or region for tax, payroll and legal reasons, even when the work is fully remote. Read the location line carefully before applying.',
  },
  {
    q: 'Can I negotiate remote work after an offer?',
    a: 'Sometimes, especially a day or two of hybrid flexibility rather than full remote. Your leverage is highest before you sign, and a concrete reason such as a commute or caring responsibilities helps more than a general preference.',
  },
]

export default function RemoteJobsPage() {
  return (
    <>
      <PostJsonLd slug={SLUG} faqs={FAQS} />
      <article className="pt-14 pb-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--bg-overlay)] text-[var(--green)]">
                Remote work
              </span>
              <time className="text-xs text-[var(--text-faint)]" dateTime="2026-11-15">
                November 15, 2026
              </time>
              <span className="text-xs text-[var(--text-faint)]">7 min read</span>
            </div>
            <h1 className="font-display text-[clamp(2.3rem,5vw,3.4rem)] mb-6">{title}</h1>
            <p className="text-lg text-[var(--text-muted)] leading-relaxed">
              Five days a week in the office is the least popular way to work — and in 2026 more
              large employers are requiring it anyway. If remote work matters to you, the market has
              changed under your feet. Here is what is actually happening, where remote roles still
              are, and how to compete for them.
            </p>
          </header>

          <div className="space-y-10">
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">What is actually happening</h2>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">Five-day mandates are spreading at the top.</strong>{' '}
                  Return-to-office trackers list a growing set of big employers requiring corporate
                  staff in five days a week in 2026, and one widely cited figure from a JLL report
                  puts more than half of Fortune 100 employees under a five-day rule, up sharply from
                  a year earlier.
                </li>
                <li>
                  <strong className="text-ink">Across all employers, the shift is smaller.</strong>{' '}
                  One survey puts companies requiring five days at roughly 30% in 2026, against 28% the
                  year before. The headline mandates are real, but concentrated at large companies.
                </li>
                <li>
                  <strong className="text-ink">Hybrid is still the norm.</strong> Most 2026 office
                  policies land on two to four days a week, not five.
                </li>
                <li>
                  <strong className="text-ink">Some are going further.</strong> In a ResumeBuilder
                  survey, around 28% of companies said they were phasing out remote work entirely.
                </li>
              </ul>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                The sources here are trackers and surveys with different methods, so the exact
                percentages vary. The direction does not: fully remote roles are scarcer, and each one
                draws more applicants.
              </p>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">Where remote jobs still are</h2>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">Remote-first companies.</strong> Firms built without
                  a headquarters have the least reason to reverse. They are a better target than
                  hoping a big employer makes an exception.
                </li>
                <li>
                  <strong className="text-ink">Startups and mid-size companies</strong> competing
                  for talent they cannot afford to relocate.
                </li>
                <li>
                  <strong className="text-ink">Roles that were never office-bound:</strong> many
                  engineering, support, sales and content positions are still hired remotely even at
                  companies with office mandates for other teams.
                </li>
                <li>
                  <strong className="text-ink">Hybrid with real flexibility.</strong> A two-day
                  hybrid role near you can deliver most of what you wanted from remote, with far less
                  competition.{' '}
                  <Link href="/companies" className="text-[var(--accent)] hover:underline">
                    Browse live roles by company
                  </Link>{' '}
                  and read each one&apos;s location line.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">How to win a remote role in 2026</h2>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">Apply early.</strong> Remote postings collect
                  applicants fastest. The first few days of a listing are worth far more than the
                  last few weeks.
                </li>
                <li>
                  <strong className="text-ink">Check where &ldquo;remote&rdquo; means.</strong> Many
                  remote roles are limited to one country or time zone for payroll and legal reasons.
                  Applying outside it wastes the application; ApplyMaster&apos;s matching leaves out
                  remote roles restricted to other countries for exactly this reason.
                </li>
                <li>
                  <strong className="text-ink">Show you have done it before.</strong> Concrete
                  evidence of working well remotely — async communication, self-directed projects,
                  results delivered across time zones — answers the employer&apos;s real worry.
                </li>
                <li>
                  <strong className="text-ink">Keep volume sustainable.</strong> More competition per
                  role means more applications per offer.{' '}
                  <Link href="/autofill" className="text-[var(--accent)] hover:underline">
                    Autofill the forms
                  </Link>{' '}
                  so you can apply widely without burning out.
                </li>
                <li>
                  <strong className="text-ink">Make your resume pass the first screen.</strong> With
                  hundreds of applicants per remote role, the{' '}
                  <Link href="/tools/ats-resume-checker" className="text-[var(--accent)] hover:underline">
                    ATS filter
                  </Link>{' '}
                  is stricter than ever.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">FAQ</h2>
              <div className="space-y-6">
                {FAQS.map(f => (
                  <div key={f.q}>
                    <h3 className="text-lg font-semibold text-ink mb-2">{f.q}</h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-16 p-8 md:p-12 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-overlay)] to-transparent text-center">
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.1rem)] mb-4">Find the remote roles you can actually get</h2>
            <p className="text-[var(--text-muted)] mb-8 max-w-lg mx-auto">
              ApplyMaster matches you to remote and hybrid roles open to people where you live, and
              fills the application forms for you. 30 applications a month, free.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-4 bg-[var(--accent-solid)] text-[var(--text-on-accent)] font-semibold rounded-xl transition-transform hover:-translate-y-0.5"
            >
              Start free
            </Link>
          </section>

          <nav className="mt-12 pt-8 border-t border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-4">Related articles</h3>
            <ul className="space-y-2">
              <li><Link href="/blog/how-to-spot-ghost-jobs-2026" className="text-[var(--accent)] hover:underline text-sm">Ghost Jobs in 2026: How to Spot Fake Postings Before You Apply</Link></li>
              <li><Link href="/blog/h1b-100k-fee-what-it-means-2026" className="text-[var(--accent)] hover:underline text-sm">The $100,000 H-1B Fee: What It Means If You Are Job-Hunting From Abroad</Link></li>
              <li><Link href="/blog/tech-layoffs-what-to-do-2026" className="text-[var(--accent)] hover:underline text-sm">Laid Off in the 2026 Tech Cuts? A Calm, Practical First Two Weeks</Link></li>
            </ul>
          </nav>
        </div>
      </article>
    </>
  )
}
