import type { Metadata } from 'next'
import Link from 'next/link'
import { postMetadata, PostJsonLd } from '@/lib/blog/seo'
import { postBySlug } from '@/lib/blog/posts'

const SLUG = 'how-to-spot-ghost-jobs-2026'
const title = postBySlug(SLUG)!.title

export const metadata: Metadata = postMetadata(SLUG, [
  'ghost jobs',
  'ghost jobs 2026',
  'fake job postings',
  'how to spot ghost jobs',
  'are job postings real',
  'ghost job statistics',
  'ghost job law',
])

const FAQS = [
  {
    q: 'Are ghost jobs illegal?',
    a: 'Generally not, as of late 2026. Ontario introduced a vacancy-disclosure requirement taking effect in 2026, and several US states considered bills, but there is no US federal law against posting a job you do not intend to fill. Check your own state or country, because this is changing quickly.',
  },
  {
    q: 'How many job postings are ghost jobs?',
    a: 'The most traceable figure is Greenhouse data putting roughly one in five US postings as fake or never filled, around 18 to 22 percent a quarter. Much higher numbers circulate online, but they trace back to commentary rather than a primary study.',
  },
  {
    q: 'Should I stop applying to jobs that might be ghosts?',
    a: 'No. You cannot tell for certain from outside, and some real roles look stale. Instead, put your effort where the odds are best: fresh postings on the employer’s own careers page, roles where you can reach a person, and referrals.',
  },
]

export default function GhostJobsPage() {
  return (
    <>
      <PostJsonLd slug={SLUG} faqs={FAQS} />
      <article className="pt-14 pb-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--bg-overlay)] text-[var(--accent)]">
                Job search
              </span>
              <time className="text-xs text-[var(--text-faint)]" dateTime="2026-11-15">
                November 15, 2026
              </time>
              <span className="text-xs text-[var(--text-faint)]">7 min read</span>
            </div>
            <h1 className="font-display text-[clamp(2.3rem,5vw,3.4rem)] mb-6">{title}</h1>
            <p className="text-lg text-[var(--text-muted)] leading-relaxed">
              You tailored the resume, answered the screening questions, pressed Submit — and heard
              nothing, because the job never existed. Ghost jobs, postings a company has no real
              intention of filling, have become one of the most frustrating parts of a 2026 job
              search. Here is how common they actually are, why companies post them, and how to stop
              spending your best hours on them.
            </p>
          </header>

          <div className="space-y-10">
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">How common are ghost jobs, really?</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                Common enough to plan around, though the scariest numbers online are not the
                reliable ones:
              </p>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">About one in five, by the best data.</strong> A 2025
                  Greenhouse study found at least one in five US job postings is fake or never
                  filled, with its quarterly platform data running at roughly 18–22% of postings —
                  and construction the worst industry, near 38%.
                </li>
                <li>
                  <strong className="text-ink">Many companies admit to it.</strong> In a ResumeBuilder
                  survey, about 40% of hiring managers said their company had posted a fake listing
                  in the past year. That is a share of companies, not of postings, but it shows how
                  normal the practice has become.
                </li>
                <li>
                  <strong className="text-ink">Be wary of the 47% headline.</strong> Figures near
                  half of all listings circulate widely, but they trace back to secondary commentary
                  rather than a primary study. There are no official government statistics on ghost
                  jobs at all, so treat any dramatic number with suspicion.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">Why companies post jobs they will not fill</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                Rarely out of malice — usually out of convenience, which is exactly why it persists:
              </p>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">Building a pipeline</strong> for a role they might
                  open next quarter, collecting resumes now in case.
                </li>
                <li>
                  <strong className="text-ink">The hire is already decided.</strong> An internal
                  candidate or a referral has it, but policy requires a public posting.
                </li>
                <li>
                  <strong className="text-ink">Looking like a growing company</strong> to investors,
                  customers and current staff.
                </li>
                <li>
                  <strong className="text-ink">Forgetting to take it down.</strong> The role was
                  filled or frozen and the listing simply lives on, copied across job aggregators.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">Seven signs a posting is a ghost</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                No single sign is proof — plenty of real roles trip one of these. Two or three
                together is a reason to move it to the bottom of your list.
              </p>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">1. It has been up for months,</strong> or keeps
                  getting reposted with a fresh date and the same text.
                </li>
                <li>
                  <strong className="text-ink">2. It is not on the company&apos;s own careers
                  page.</strong> A listing that exists only on aggregators is often a copy of a role
                  that already closed. Always check the employer&apos;s site.
                </li>
                <li>
                  <strong className="text-ink">3. The description is generic</strong> — no team, no
                  manager, no concrete project, just a list of buzzwords that could fit any company.
                </li>
                <li>
                  <strong className="text-ink">4. &ldquo;Always hiring&rdquo; or &ldquo;talent
                  pool&rdquo;</strong> language, which often means exactly that: no specific opening.
                </li>
                <li>
                  <strong className="text-ink">5. The company just announced layoffs or a hiring
                  freeze</strong> while the same roles stay listed.
                </li>
                <li>
                  <strong className="text-ink">6. Nobody can name the hiring manager</strong> when
                  you ask a recruiter or a current employee.
                </li>
                <li>
                  <strong className="text-ink">7. You never get a rejection</strong> — from this
                  company, across several applications over months.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">How to protect your time</h2>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">Go to the source.</strong> Apply on the
                  employer&apos;s own applicant tracking system rather than through aggregator
                  copies. Our{' '}
                  <Link href="/companies" className="text-[var(--accent)] hover:underline">
                    company job pages
                  </Link>{' '}
                  read straight from employers&apos; own job boards and refresh every few hours, so
                  a role the company closes drops off rather than lingering for weeks.
                </li>
                <li>
                  <strong className="text-ink">Favour fresh postings.</strong> Applications in the
                  first week or two of a posting have far better odds than ones sent to a listing
                  that has been open for three months.
                </li>
                <li>
                  <strong className="text-ink">Make each application cheap.</strong> When some
                  fraction of postings will never answer, the cost of each application matters.{' '}
                  <Link href="/autofill" className="text-[var(--accent)] hover:underline">
                    Autofill the form
                  </Link>{' '}
                  so a ghost costs you two minutes, not forty.
                </li>
                <li>
                  <strong className="text-ink">Reach a person.</strong> A short message to someone on
                  the team does double duty: it raises your odds on real roles and quickly exposes
                  the ghosts.
                </li>
                <li>
                  <strong className="text-ink">Follow up once, then move on.</strong> One polite
                  follow-up after a week or two; if a posting stays silent after that, let it go
                  without taking it personally.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">Is anyone doing anything about it?</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Slowly. Ghost jobs are generally legal, but that is starting to change: Ontario
                introduced a vacancy-disclosure requirement taking effect in 2026, and several US
                states considered bills during the year, including at least one proposing per-post
                penalties. There is still no US federal rule. If you want to know where your own state
                stands, check its legislature directly — coverage of these bills has run ahead of what
                has actually passed.
              </p>
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
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.1rem)] mb-4">Spend your time on real roles</h2>
            <p className="text-[var(--text-muted)] mb-8 max-w-lg mx-auto">
              ApplyMaster matches you to live roles from employers&apos; own job boards and fills
              the forms for you. You press Submit. 30 applications a month, free.
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
              <li><Link href="/blog/how-to-pass-an-ai-job-interview-2026" className="text-[var(--accent)] hover:underline text-sm">AI Job Interviews in 2026: How to Pass One</Link></li>
              <li><Link href="/blog/tech-layoffs-what-to-do-2026" className="text-[var(--accent)] hover:underline text-sm">Laid Off in the 2026 Tech Cuts? A Calm, Practical First Two Weeks</Link></li>
              <li><Link href="/blog/remote-jobs-2026-rto-mandates" className="text-[var(--accent)] hover:underline text-sm">Remote Jobs in 2026: How to Still Find One as Return-to-Office Spreads</Link></li>
            </ul>
          </nav>
        </div>
      </article>
    </>
  )
}
