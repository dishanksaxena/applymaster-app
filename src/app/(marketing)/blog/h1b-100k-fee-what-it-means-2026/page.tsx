import type { Metadata } from 'next'
import Link from 'next/link'
import { postMetadata, PostJsonLd } from '@/lib/blog/seo'
import { postBySlug } from '@/lib/blog/posts'

const SLUG = 'h1b-100k-fee-what-it-means-2026'
const title = postBySlug(SLUG)!.title

export const metadata: Metadata = postMetadata(SLUG, ["H-1B $100,000 fee", "H-1B visa 2026", "H-1B fee international workers", "tech jobs US visa 2026", "H-1B India tech workers", "working in US tech visa", "H-1B alternatives 2026"])

// Must match the FAQ shown on the page.
const FAQS = [
  {
    "q": "Is the $100,000 fee definitely in effect right now?",
    "a": "That is exactly the part that has been unstable, with conflicting reports across 2026. We are deliberately not stating a current yes or no, because it may have changed again. Check official USCIS guidance and an immigration attorney for the status as of today."
  },
  {
    "q": "Does it affect my current H-1B or a renewal?",
    "a": "Reporting indicated the fee targets new petitions rather than renewals or existing holders, but your specific situation — including any change of status — is a question for an immigration lawyer, not a blog."
  },
  {
    "q": "Should I give up on working for a US company?",
    "a": "No. The visa path narrowed; the goal did not disappear. Global offices, remote-first employers and roles relocating to your region are all live routes to the same kind of work. Widen the target rather than abandoning it."
  }
]

export default function H1bFeePage() {
  return (
    <>
      <PostJsonLd slug={SLUG} faqs={FAQS} />
      <article className="pt-14 pb-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--bg-overlay)] text-[var(--accent)]">
                Global job search
              </span>
              <time className="text-xs text-[var(--text-faint)]" dateTime="2026-11-12">
                November 12, 2026
              </time>
              <span className="text-xs text-[var(--text-faint)]">7 min read</span>
            </div>
            <h1 className="font-display text-[clamp(2.3rem,5vw,3.4rem)] mb-6">{title}</h1>
            <p className="text-lg text-[var(--text-muted)] leading-relaxed">
              A proposed $100,000 fee on H-1B petitions has been one of the most disruptive changes
              to US tech hiring in years — and one of the most confusing, because its legal status
              has been contested in the courts and may have shifted again by the time you read
              this. If a US tech job is part of your plan, here is what the change is, what is still
              uncertain, and what you can actually do about it.
            </p>
          </header>

          {/* Standing caveat */}
          <section className="mb-12 p-6 rounded-xl border border-[var(--border)] bg-[var(--yellow-dim)]">
            <h2 className="text-sm font-semibold text-[var(--yellow)] uppercase tracking-wider mb-3">
              Read this first
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              This is general information for job seekers, not legal advice, and the rules here have
              been genuinely in flux — reports through 2026 disagreed on whether the fee was in
              effect at any given moment. Before you make a decision that depends on it, confirm the
              current status with the official USCIS guidance and a licensed immigration attorney.
              Do not act on a blog post, including this one, for something this consequential.
            </p>
          </section>

          <div className="space-y-10">
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">What the change is</h2>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">A six-figure fee on new petitions.</strong> The
                  measure attaches a fee reported at $100,000 to H-1B petitions. At that level it
                  stops being a paperwork cost and becomes a hiring decision in its own right.
                </li>
                <li>
                  <strong className="text-ink">New petitions, not renewals.</strong> Reporting
                  consistently indicated the fee targets new petitions rather than renewals or
                  people already holding the visa, with changes of status from inside the US (for
                  example from F-1 student status) treated differently. The exact boundaries are
                  precisely the thing to verify with counsel.
                </li>
                <li>
                  <strong className="text-ink">A legal status that kept moving.</strong> Through
                  2026 the fee was challenged in court; some reports said it had been struck down or
                  paused, others that challenges had been rejected, and parts were tied to a
                  proclamation with an expiry date. Whatever you read, check the date on it.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">Who it hits hardest</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                Computer and IT roles make up the majority of H-1B jobs, and India supplies the
                largest share of beneficiaries, so the weight of this falls on US tech employers and
                on Indian technology workers and IT-services firms. Two groups feel it most:
              </p>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">Smaller companies and startups.</strong> A large
                  established firm can absorb a six-figure fee for a critical hire. A startup often
                  simply cannot, which narrows where visa-dependent candidates can realistically
                  apply.
                </li>
                <li>
                  <strong className="text-ink">Early-career international candidates.</strong> The
                  fee makes employers far more selective about whom they will sponsor, favouring
                  senior and specialised roles where the cost is easier to justify.
                </li>
              </ul>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                Economists also expect second-order effects: analyses project employers will sponsor
                a smaller share of candidates and that some hiring and investment shifts toward
                India, Eastern Europe, Latin America and Canada. For a job seeker, that last point
                is not only a loss — it is a map of where the roles are moving.
              </p>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">Practical moves that still work</h2>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">Target employers who still sponsor.</strong> Large
                  firms with established immigration programmes are the realistic path now. Ask
                  early and directly whether a role offers sponsorship rather than discovering the
                  answer at offer stage.
                </li>
                <li>
                  <strong className="text-ink">Follow the work that is relocating.</strong> If US
                  tech is pushing roles to India, Canada, the EU and Latin America, those
                  fast-growing local offices of global companies are an opening, not a consolation.{' '}
                  <Link href="/companies" className="text-[var(--accent)] hover:underline">
                    Many employers hiring across regions
                  </Link>{' '}
                  post roles in several countries at once.
                </li>
                <li>
                  <strong className="text-ink">Consider remote-first and global-hire companies.</strong>{' '}
                  A growing set of firms hire internationally without sponsorship at all, through
                  local employment or contractor arrangements. For many candidates this is now a
                  more reliable route to working for a US company than the visa.
                </li>
                <li>
                  <strong className="text-ink">Look at Canada and the EU as first moves.</strong>{' '}
                  Several countries have deliberately courted the talent the fee discourages. A role
                  there can be a strong career step in its own right, not merely a waiting room.
                </li>
                <li>
                  <strong className="text-ink">Apply in your own country&apos;s currency of
                  strength.</strong> Wherever you search, the fundamentals do not change: a
                  resume that{' '}
                  <Link href="/tools/ats-resume-checker" className="text-[var(--accent)] hover:underline">
                    parses cleanly
                  </Link>
                  , applications{' '}
                  <Link href="/autofill" className="text-[var(--accent)] hover:underline">
                    sent efficiently
                  </Link>
                  , and roles matched to you honestly.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">FAQ</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Is the $100,000 fee definitely in effect right now?</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    That is exactly the part that has been unstable, with conflicting reports across
                    2026. We are deliberately not stating a current yes or no, because it may have
                    changed again. Check official USCIS guidance and an immigration attorney for the
                    status as of today.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Does it affect my current H-1B or a renewal?</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Reporting indicated the fee targets new petitions rather than renewals or
                    existing holders, but your specific situation — including any change of status —
                    is a question for an immigration lawyer, not a blog.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Should I give up on working for a US company?</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    No. The visa path narrowed; the goal did not disappear. Global offices,
                    remote-first employers and roles relocating to your region are all live routes
                    to the same kind of work. Widen the target rather than abandoning it.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-16 p-8 md:p-12 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-overlay)] to-transparent text-center">
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.1rem)] mb-4">Search where the roles actually are</h2>
            <p className="text-[var(--text-muted)] mb-8 max-w-lg mx-auto">
              ApplyMaster matches you to live roles in your own country and fills the application
              forms for you — wherever the work is moving. You press Submit. 30 applications a
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
              <li><Link href="/blog/tech-layoffs-what-to-do-2026" className="text-[var(--accent)] hover:underline text-sm">Laid Off in the 2026 Tech Cuts? A Calm, Practical First Two Weeks</Link></li>
              <li><Link href="/blog/ai-job-search-2026" className="text-[var(--accent)] hover:underline text-sm">AI Job Search in 2026: What Actually Works (and What Is Hype)</Link></li>
            </ul>
          </nav>
        </div>
      </article>
    </>
  )
}
