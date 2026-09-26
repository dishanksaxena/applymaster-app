import type { Metadata } from 'next'
import Link from 'next/link'

/*
 * Rewritten to describe what auto-apply does.
 *
 * The previous page promised automatic applications "across LinkedIn,
 * Indeed, Glassdoor and 50+ portals", 24/7, hands-free in Autopilot. None of
 * those sources were ever searched, no employer's applicant system accepts a
 * submission over a public API, and most application forms carry a CAPTCHA
 * that exists to require a person. The truthful version is still a strong
 * product: fresh matches every morning, a tailored resume per job, the form
 * filled in — and the person presses send.
 */

export const metadata: Metadata = {
  title: 'Auto-Apply — Daily Job Matches, Forms Filled for You | ApplyMaster',
  description:
    'Every morning ApplyMaster searches 31 company career sites plus Adzuna and RemoteOK for your target roles, queues the best matches, tailors your resume and fills in each application form. You review and send.',
  alternates: { canonical: 'https://applymaster.ai/features/auto-apply' },
  openGraph: {
    title: 'Auto-Apply | ApplyMaster',
    description: 'Daily matched roles, a tailored resume for each, and the application form filled in — you review and send.',
    url: 'https://applymaster.ai/features/auto-apply',
    siteName: 'ApplyMaster',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Auto-Apply | ApplyMaster',
    description: 'Daily matched roles, a tailored resume for each, and the application form filled in — you review and send.',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ApplyMaster Auto-Apply',
  applicationCategory: 'BusinessApplication',
  description: 'Daily job matching across company career sites, with tailored resumes and application forms filled for review.',
  url: 'https://applymaster.ai/features/auto-apply',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  operatingSystem: 'Web',
}

const STEPS = [
  {
    title: 'Tell it what you want',
    desc: 'Target roles, seniority, locations or remote, salary floor, companies to avoid, and your work authorisation.',
  },
  {
    title: 'Every morning, fresh matches',
    desc: 'It searches the career sites of 31 companies plus Adzuna and RemoteOK, and scores every open role against your preferences.',
  },
  {
    title: 'The best land in your queue',
    desc: 'Up to your daily limit, with the match score and the reasons for it. Roles at companies where you know someone are flagged first.',
  },
  {
    title: 'Tailored and filled, you send',
    desc: 'Your resume is tailored to the role and the application form is filled in. You review it and press send.',
  },
]

const SCORING = [
  ['Title', 'Must match a role you asked for — “Staff Engineer” alone does not pull in every engineering job.'],
  ['Seniority', 'An internship is never offered to someone senior, and a director role is not offered to a new graduate.'],
  ['Location', 'Remote, your cities, or relocation — whichever you chose.'],
  ['Salary', 'Roles that clearly pay below your floor are pushed down.'],
  ['Stack', 'A “.NET Engineer” is not a match for a TypeScript developer, however well the rest lines up.'],
  ['Freshness', 'Recently posted roles rank higher; early applicants are the ones read.'],
]

const PROMISES = [
  ['Applied means sent', 'Your tracker only says “applied” once an application actually went out.'],
  ['A receipt for each one', 'The resume version, cover letter and every screening answer, saved when it is sent.'],
  ['Your answers, not guesses', 'Screening questions are answered from your profile and preferences. If we do not know, we leave it for you.'],
  ['Voluntary questions stay voluntary', 'Diversity and self-identification questions are never answered on your behalf.'],
  ['No CAPTCHA tricks', 'Where an employer requires a person, the form waits for you — bypassing it risks your application being discarded.'],
]

const FAQS = [
  {
    q: 'Does it submit applications without me?',
    a: 'No. It does everything up to the send button. Applicant systems do not accept submissions over a public API, and most application forms are protected by a CAPTCHA that requires a person — so you review and send each one. That is also the only way to be sure what goes out under your name.',
  },
  {
    q: 'What is the difference between Copilot and Autopilot?',
    a: 'Both run every morning. Copilot queues a smaller number of matches so you can look at each one closely; Autopilot uses your full daily limit.',
  },
  {
    q: 'Which job sites does it search?',
    a: 'The career sites of 31 companies — including Stripe, Anthropic, Databricks, Figma, Coinbase, Airbnb, Datadog and Cloudflare — plus Adzuna and RemoteOK. We only list sources we actually search.',
  },
  {
    q: 'Will it apply to the same job twice?',
    a: 'No. Anything already in your tracker, from any source, is skipped.',
  },
]

export default function AutoApplyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-14">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-dim)] to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <Link href="/features" className="text-sm text-[var(--accent)] mb-6 inline-block">
              &larr; All Features
            </Link>
            <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)]">Auto-Apply</h1>
            <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)] leading-relaxed">
              Stop spending evenings on application forms. Every morning ApplyMaster finds the roles that match you,
              tailors your resume to each one and fills in the form. You look it over and press send.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-[var(--accent-solid)] px-8 py-3 text-sm font-semibold text-[var(--text-on-accent)] shadow-lg transition-colors"
              >
                Get your first matches free
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-14">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] text-center mb-12">How it works</h2>
            <ol className="grid gap-6 md:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
                  <span className="text-xs font-semibold text-[var(--accent)]">Step {i + 1}</span>
                  <h3 className="mt-2 font-semibold text-[var(--text)]">{s.title}</h3>
                  <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Scoring */}
        <section className="py-14" style={{ background: 'var(--bg-secondary)' }}>
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] text-center mb-4">What makes a match</h2>
            <p className="text-center text-[var(--text-muted)] max-w-xl mx-auto mb-10">
              Every role is scored the same way every time, and you see the reasons — no black box.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SCORING.map(([t, d]) => (
                <div key={t} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
                  <h3 className="font-semibold text-[var(--text)]">{t}</h3>
                  <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Promises */}
        <section className="py-14">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] text-center mb-10">What it will and won’t do</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {PROMISES.map(([t, d]) => (
                <li key={t} className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-[var(--green-dim)] flex items-center justify-center text-xs text-[var(--green)]">
                    &#10003;
                  </span>
                  <span>
                    <span className="block font-semibold text-[var(--text)]">{t}</span>
                    <span className="block mt-1 text-sm text-[var(--text-muted)] leading-relaxed">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14" style={{ background: 'var(--bg-secondary)' }}>
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] text-center mb-10">Questions</h2>
            <div className="space-y-8">
              {FAQS.map(item => (
                <div key={item.q}>
                  <h3 className="font-semibold text-[var(--text)] mb-2">{item.q}</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-b from-transparent to-[var(--accent-dim)]">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] mb-5">Tomorrow morning, your first matches</h2>
            <p className="text-[var(--text-muted)] mb-10 text-lg">Set your target roles once. The search runs every day after that.</p>
            <Link
              href="/signup"
              className="rounded-full bg-[var(--accent-solid)] px-10 py-4 text-base font-semibold text-[var(--text-on-accent)] shadow-lg transition-colors"
            >
              Start free
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
