import type { Metadata } from 'next'
import Link from 'next/link'

const title = 'Laid Off in the 2026 Tech Cuts? A Calm, Practical First Two Weeks'
const description =
  'Amazon, Meta, Microsoft and more have cut tens of thousands of roles in 2026. If you are one of them, here is a clear order of operations — severance, benefits, unemployment, and a job search that actually starts.'
const url = 'https://www.applymaster.ai/blog/tech-layoffs-what-to-do-2026'

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    'tech layoffs 2026',
    'what to do after being laid off',
    'laid off job search',
    'severance negotiation',
    'Amazon layoffs 2026',
    'laid off first week plan',
    'job search after layoff',
  ],
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    type: 'article',
    publishedTime: '2026-11-12T12:00:00Z',
    modifiedTime: '2026-11-12T12:00:00Z',
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
  datePublished: '2026-11-12T12:00:00Z',
  dateModified: '2026-11-12T12:00:00Z',
  mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  keywords: 'tech layoffs 2026, what to do after being laid off, severance negotiation, job search after layoff',
}

export default function TechLayoffsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="pt-14 pb-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--bg-overlay)] text-[var(--accent)]">
                Job search
              </span>
              <time className="text-xs text-[var(--text-faint)]" dateTime="2026-11-12">
                November 12, 2026
              </time>
              <span className="text-xs text-[var(--text-faint)]">7 min read</span>
            </div>
            <h1 className="font-display text-[clamp(2.3rem,5vw,3.4rem)] mb-6">{title}</h1>
            <p className="text-lg text-[var(--text-muted)] leading-relaxed">
              2026 has been a brutal year for tech headcount. Trackers put the number of people
              affected by technology-sector layoffs somewhere between roughly 70,000 and 196,000,
              depending on how they count, with fresh cuts at Amazon, Meta, Microsoft and others
              landing through November. If you are reading this because it just happened to you,
              close the tracker tabs. Here is the order to do things in, and nothing you have to
              feel today.
            </p>
          </header>

          <div className="space-y-10">
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">First, the two things that are not true</h2>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">It is not a verdict on you.</strong> A layoff is a
                  headcount decision made on a spreadsheet, usually about budgets and org charts,
                  frequently about roles rather than people. Whole well-regarded teams were cut this
                  year. Your resume does not get an asterisk.
                </li>
                <li>
                  <strong className="text-ink">You are not behind.</strong> Average unemployment
                  spells in early 2026 ran over five months, per Labor Department figures cited
                  across the coverage. The people who land well are not the fastest to fire off a
                  hundred applications; they are the ones who set up correctly in week one.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">Days 1–3: paperwork, before the job boards</h2>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">Do not sign the severance agreement today.</strong>{' '}
                  Severance packages are frequently negotiable, and you are almost never required to
                  sign on the spot. Read every line; if the package is large or the terms are
                  unclear, have an employment lawyer in your country look at it before you sign.
                </li>
                <li>
                  <strong className="text-ink">Get the dates in writing.</strong> Your last day,
                  the date your health insurance ends, the date equity stops vesting. These decide
                  your runway, and memory is unreliable in a stressful week.
                </li>
                <li>
                  <strong className="text-ink">File for unemployment early.</strong> Where you are
                  eligible, file the same day or the next morning — benefits are often dated from
                  when you file, not when you were let go. Severance can affect eligibility and
                  timing in some places, so check your local rules.
                </li>
                <li>
                  <strong className="text-ink">Note what you lose access to.</strong> Download your
                  pay stubs, save personal contacts, and screenshot anything in your work accounts
                  you are entitled to keep, before the accounts close.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">Days 3–7: money and a short pause</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                Before the search, set the runway so it does not run your decisions later. Budget
                around severance plus savings. Sort health insurance — continuation coverage,
                a partner&apos;s plan, or a marketplace plan — and understand what happens to any
                retirement accounts. Give yourself three to seven days to actually process this.
                A short, deliberate pause is not procrastination; it is what stops a panicked first
                week of scattershot applications you will regret.
              </p>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">Week 2: a search that is a system, not a scramble</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                When you start, start structured. The difference between a three-month search and a
                seven-month one is rarely effort; it is method.
              </p>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">Fix your resume once.</strong> Software reads it
                  before a person does.{' '}
                  <Link href="/tools/ats-resume-checker" className="text-[var(--accent)] hover:underline">
                    Run an ATS check
                  </Link>{' '}
                  and repair what it flags before you send anything.
                </li>
                <li>
                  <strong className="text-ink">Target, do not spray.</strong> Twenty applications
                  to roles you genuinely fit beat two hundred sprayed ones — employers filter the
                  spray pattern now, and so does your own energy.
                </li>
                <li>
                  <strong className="text-ink">Make the applying itself cheap.</strong> The admin of
                  retyping your history into every form is where searches stall. Let a{' '}
                  <Link href="/autofill" className="text-[var(--accent)] hover:underline">
                    tool fill the forms
                  </Link>{' '}
                  so your energy goes to matching and follow-up, not data entry.
                </li>
                <li>
                  <strong className="text-ink">Work your network first.</strong> Tell people plainly
                  that you are looking. Referrals convert many times better than cold applications,
                  and most people want to help if you make it easy for them.
                </li>
                <li>
                  <strong className="text-ink">Keep a routine.</strong> Fixed hours, a list, a
                  finish time. An unstructured day is the real enemy of a job search, more than any
                  tracker number.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">On the "is it AI?" question</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Some 2026 cuts were explicitly tied to AI and efficiency; others, executives
                insisted, were not. For your own search the cause barely matters — what matters is
                that the roles being created lean toward people who can use these tools well. If you
                spent this year shipping with AI in your workflow, say so concretely on your resume.
                That is a more useful response to the trend than trying to predict it.
              </p>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">FAQ</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Should I start applying the same week?</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Set up the same week — resume, target list, network note. Submitting in volume
                    can wait three to seven days while you steady yourself; applications sent from
                    panic read like it.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Can I really negotiate severance?</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Often, yes — on the amount, on extended benefits, on references or the
                    departure date. You have the most leverage before you sign, which is exactly why
                    you should not sign in the room. For a large package, a short consult with an
                    employment lawyer usually pays for itself.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-2">How do I explain a layoff in interviews?</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    One honest sentence: &ldquo;My role was eliminated in the 2026 restructuring.&rdquo;
                    No apology, no over-explaining. Layoffs are common enough now that interviewers
                    barely blink; dwelling on it is what draws attention.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-16 p-8 md:p-12 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-overlay)] to-transparent text-center">
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.1rem)] mb-4">Make week two the easy part</h2>
            <p className="text-[var(--text-muted)] mb-8 max-w-lg mx-auto">
              ApplyMaster matches you to live roles each morning and fills the employer&apos;s form
              so you can apply to more without the data entry. You press Submit. 30 applications a
              month, free.
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
              <li><Link href="/blog/ai-and-entry-level-jobs-2026" className="text-[var(--accent)] hover:underline text-sm">Is AI Taking Entry-Level Jobs? What the 2026 Data Actually Shows</Link></li>
              <li><Link href="/blog/ai-job-search-2026" className="text-[var(--accent)] hover:underline text-sm">AI Job Search in 2026: What Actually Works (and What Is Hype)</Link></li>
              <li><Link href="/blog/ats-resume-optimization" className="text-[var(--accent)] hover:underline text-sm">ATS Resume Optimization: Beat the Bots &amp; Get Interviews</Link></li>
            </ul>
          </nav>
        </div>
      </article>
    </>
  )
}
