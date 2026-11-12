import type { Metadata } from 'next'
import Link from 'next/link'

const title = 'Is AI Taking Entry-Level Jobs? What the 2026 Data Actually Shows'
const description =
  'New-grad hiring at big tech is down sharply and surveys say AI is part of it — but the data is more contested than the headlines. What is real, what is overstated, and how a new grad still gets hired in 2026.'
const url = 'https://www.applymaster.ai/blog/ai-and-entry-level-jobs-2026'

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    'is AI taking entry level jobs',
    'AI entry level jobs 2026',
    'new grad job market 2026',
    'AI replacing new grads',
    'entry level hiring AI',
    'new graduate job search',
    'AI and junior roles',
  ],
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    type: 'article',
    publishedTime: '2026-11-12T14:00:00Z',
    modifiedTime: '2026-11-12T14:00:00Z',
    authors: ['ApplyMaster Team'],
  },
  twitter: { card: 'summary_large_image', title, description },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  author: { '@type': 'Organization', name: 'ApplyMaster', url: 'https://www.applymaster.ai' },
  publisher: {
    '@type': 'Organization',
    name: 'ApplyMaster',
    logo: { '@type': 'ImageObject', url: 'https://www.applymaster.ai/logo.png' },
  },
  datePublished: '2026-11-12T14:00:00Z',
  dateModified: '2026-11-12T14:00:00Z',
  mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  keywords: 'is AI taking entry level jobs, new grad job market 2026, AI replacing new grads',
}

export default function AiEntryLevelPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="pt-14 pb-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--bg-overlay)] text-[var(--blue)]">
                AI &amp; Careers
              </span>
              <time className="text-xs text-[var(--text-faint)]" dateTime="2026-11-12">
                November 12, 2026
              </time>
              <span className="text-xs text-[var(--text-faint)]">8 min read</span>
            </div>
            <h1 className="font-display text-[clamp(2.3rem,5vw,3.4rem)] mb-6">{title}</h1>
            <p className="text-lg text-[var(--text-muted)] leading-relaxed">
              It is the most anxious question in the 2026 job market: has AI eaten the bottom rung
              of the ladder? The honest answer is that entry-level hiring really has tightened, the
              evidence that AI is the main cause is genuinely mixed, and new grads are still getting
              hired every week. Here is what the data says — and does not — and what to do with it.
            </p>
          </header>

          <div className="space-y-10">
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">What is clearly true: the squeeze is real</h2>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">Big-tech new-grad hiring has fallen a lot.</strong>{' '}
                  SignalFire&apos;s 2026 talent report found new-graduate hiring at the fifteen
                  largest tech companies down more than 50% versus 2019. That is a real, large
                  drop, concentrated at the most sought-after employers.
                </li>
                <li>
                  <strong className="text-ink">The youngest workers in AI-exposed roles are hit
                  hardest.</strong> A Stanford analysis of ADP payroll data reported that employment
                  for 22-to-25-year-olds in the most AI-exposed jobs ran roughly 19% below their
                  less-exposed peers, while experienced workers in those same roles were largely
                  unaffected.
                </li>
                <li>
                  <strong className="text-ink">Employers say budgets are shifting.</strong> One
                  mid-2026 survey of US hiring managers found a majority had moved at least some
                  entry-level budget toward AI, and about a third said AI had reduced their need for
                  graduate hires.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">What is contested: whether AI is the cause</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                Here the headlines run ahead of the evidence. Several serious findings cut the other
                way:
              </p>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">Most employers say they are not replacing grads with
                  AI.</strong> A NACE analysis reported that around 61% of employers say they are
                  not replacing entry-level roles with AI, and only about 11% were even actively
                  discussing it.
                </li>
                <li>
                  <strong className="text-ink">Remote work may explain more than AI.</strong> A 2026
                  LSE study reportedly found the growth of remote work was a better predictor of the
                  decline in entry-level hiring than AI adoption was.
                </li>
                <li>
                  <strong className="text-ink">Demand has not vanished.</strong> In one survey,
                  roughly two-thirds of hiring managers said they planned to hire the same number of
                  grads or more than last year — even as a meaningful minority said fewer or none.
                </li>
                <li>
                  <strong className="text-ink">Researchers themselves hedge.</strong> SignalFire&apos;s
                  own head of research called AI a significant contributing factor while saying it
                  likely does not fully explain the dip. That is the honest shape of it.
                </li>
              </ul>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                The figures also wobble between sources — recent-grad unemployment is quoted at
                5.6% in one place and 5.7% in another, survey dates vary, and many write-ups are
                aggregators. Treat any single dramatic number with suspicion, including the
                reassuring ones.
              </p>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">What is actually changing about entry-level work</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                The clearest shift is not &ldquo;fewer jobs&rdquo; so much as &ldquo;different first
                jobs.&rdquo; AI is absorbing the routine grunt work juniors used to cut their teeth
                on, so employers increasingly want new grads who arrive able to do more than the
                grunt work — people hired for broad capability rather than a narrow predefined slot.
                That is harder, but it is also a map: the new grads who get hired are the ones who
                can show they already work the way the role now needs.
              </p>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">How a new grad still gets hired in 2026</h2>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">Show AI fluency as a skill, not a threat.</strong> If
                  the tool that is supposedly replacing juniors is one you are visibly good with,
                  you are on the right side of the shift. Put concrete examples on your resume.
                </li>
                <li>
                  <strong className="text-ink">Apply widely, beyond the fifteen famous names.</strong>{' '}
                  The {' > '}50% drop is concentrated at the biggest brands. Mid-size companies,
                  startups and non-tech employers hiring technical grads are far less squeezed.{' '}
                  <Link href="/companies" className="text-[var(--accent)] hover:underline">
                    Browse live roles across many employers
                  </Link>{' '}
                  rather than refreshing five career pages.
                </li>
                <li>
                  <strong className="text-ink">Make volume sustainable.</strong> A tighter market
                  rewards more, better-targeted applications — which only works if applying is not
                  exhausting.{' '}
                  <Link href="/autofill" className="text-[var(--accent)] hover:underline">
                    Autofill the forms
                  </Link>{' '}
                  and spend your effort on matching and outreach.
                </li>
                <li>
                  <strong className="text-ink">Beat the first screen.</strong> With more applicants
                  per role, the ATS filter is stricter.{' '}
                  <Link href="/tools/ats-resume-checker" className="text-[var(--accent)] hover:underline">
                    Check how your resume parses
                  </Link>{' '}
                  and{' '}
                  <Link href="/tools/job-description-keyword-extractor" className="text-[var(--accent)] hover:underline">
                    mirror the posting&apos;s real keywords
                  </Link>
                  .
                </li>
                <li>
                  <strong className="text-ink">Use people, not just portals.</strong> Referrals
                  matter more in a tight market, not less. Campus networks, alumni and a plain
                  &ldquo;I&apos;m looking&rdquo; message do real work.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">FAQ</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Is it a bad time to graduate into tech?</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    It is a harder market at the top brands and a normal-to-soft one elsewhere. The
                    advantage goes to grads who apply broadly and demonstrate they can work with AI
                    rather than around it. Difficult is not the same as closed.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Will learning AI tools actually help me get hired?</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Yes, when you can point to specifics — a project, a workflow, a measurable result
                    — rather than listing &ldquo;AI&rdquo; as a skill. Employers reorganising around
                    these tools want people who already use them well.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Should I take a non-ideal first job?</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Often yes. In a tight market, a real role that builds experience beats waiting
                    for the perfect one. The experienced-worker premium in the data is exactly the
                    thing a first job starts earning you.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-16 p-8 md:p-12 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-overlay)] to-transparent text-center">
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.1rem)] mb-4">Apply widely without burning out</h2>
            <p className="text-[var(--text-muted)] mb-8 max-w-lg mx-auto">
              ApplyMaster finds roles that fit you across many employers and fills the forms, so a
              tighter market means more targeted applications, not more exhaustion. 30 free a month.
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
              <li><Link href="/blog/ai-job-search-2026" className="text-[var(--accent)] hover:underline text-sm">AI Job Search in 2026: What Actually Works (and What Is Hype)</Link></li>
              <li><Link href="/blog/tech-layoffs-what-to-do-2026" className="text-[var(--accent)] hover:underline text-sm">Laid Off in the 2026 Tech Cuts? A Calm, Practical First Two Weeks</Link></li>
              <li><Link href="/blog/h1b-100k-fee-what-it-means-2026" className="text-[var(--accent)] hover:underline text-sm">The $100,000 H-1B Fee: What It Means If You Are Job-Hunting From Abroad</Link></li>
            </ul>
          </nav>
        </div>
      </article>
    </>
  )
}
