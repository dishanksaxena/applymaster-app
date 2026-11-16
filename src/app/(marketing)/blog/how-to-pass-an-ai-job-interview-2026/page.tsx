import type { Metadata } from 'next'
import Link from 'next/link'
import { postMetadata, PostJsonLd } from '@/lib/blog/seo'
import { postBySlug } from '@/lib/blog/posts'

const SLUG = 'how-to-pass-an-ai-job-interview-2026'
const title = postBySlug(SLUG)!.title

export const metadata: Metadata = postMetadata(SLUG, [
  'AI job interview',
  'AI interviewer',
  'how to pass an AI interview',
  'AI interview tips 2026',
  'one-way video interview',
  'AI screening interview',
  'AI recruiter',
])

const FAQS = [
  {
    q: 'Can I refuse an AI interview?',
    a: 'You can ask for a human alternative or an accommodation, and some employers will offer one. In a Greenhouse 2026 survey, 38 percent of US candidates said they had withdrawn from a process because it included an AI interview. Weigh how much you want the role before walking away.',
  },
  {
    q: 'Do AI interviews judge my face or accent?',
    a: 'It depends on the tool, and employers rarely say. Ask what is being assessed and whether a person reviews the result. Many candidates report not being told clearly that AI was involved at all, so asking is reasonable.',
  },
  {
    q: 'Are candidates screened by AI less likely to get hired?',
    a: 'Not necessarily. A 2026 field experiment covering about 70,000 applicants found candidates who went through AI-led screening were 12 percent more likely to receive an offer. Candidate dislike of the format and its hiring outcomes are two different questions.',
  },
]

export default function AiInterviewPage() {
  return (
    <>
      <PostJsonLd slug={SLUG} faqs={FAQS} />
      <article className="pt-14 pb-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--bg-overlay)] text-[var(--blue)]">
                Interviews
              </span>
              <time className="text-xs text-[var(--text-faint)]" dateTime="2026-11-15">
                November 15, 2026
              </time>
              <span className="text-xs text-[var(--text-faint)]">8 min read</span>
            </div>
            <h1 className="font-display text-[clamp(2.3rem,5vw,3.4rem)] mb-6">{title}</h1>
            <p className="text-lg text-[var(--text-muted)] leading-relaxed">
              More first-round interviews in 2026 are run by software than by a recruiter — a
              chatbot, a recorded video prompt, or an AI voice that asks follow-up questions.
              Candidates mostly dislike it, and the data says the format is here to stay. Here is
              what an AI interview actually is, what the research shows, and how to prepare so it
              works in your favour.
            </p>
          </header>

          <div className="space-y-10">
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">The three kinds of AI interview</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                &ldquo;AI interview&rdquo; covers very different experiences, and surveys often lump
                them together. Know which one you are walking into:
              </p>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">One-way recorded video.</strong> Questions appear on
                  screen; you record answers against a timer. Software and sometimes a person review
                  the recordings later.
                </li>
                <li>
                  <strong className="text-ink">Text or chat screening.</strong> A chatbot asks
                  eligibility and experience questions, often before a human ever sees your
                  application.
                </li>
                <li>
                  <strong className="text-ink">Live AI voice or video.</strong> A conversational AI
                  asks questions and follow-ups in real time — some companies run these for around
                  twenty minutes as their entire first round.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">What the data says</h2>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">Candidates are walking away.</strong> A Greenhouse
                  2026 survey of 2,950 job seekers across five countries found 38% of US candidates
                  had withdrawn from a hiring process because it included an AI interview, and
                  another 12% said they would if required.
                </li>
                <li>
                  <strong className="text-ink">Disclosure is poor.</strong> In the same survey, 70% of
                  US candidates evaluated by AI said it was not clearly disclosed before their most
                  recent AI interview.
                </li>
                <li>
                  <strong className="text-ink">Feedback often never comes.</strong> Of US candidates
                  who completed an AI interview, 51% never received an outcome.
                </li>
                <li>
                  <strong className="text-ink">But outcomes can be good.</strong> A 2026 field
                  experiment by Jabarian and Henkel, covering about 70,000 applicants, found those who
                  went through AI-led screening were 12% more likely to get an offer and 18% more
                  likely to still be employed a month later. Disliking the format and being hurt by
                  it are not the same thing.
                </li>
                <li>
                  <strong className="text-ink">Bias concerns cut both ways.</strong> US candidates
                  reported nearly identical rates of perceived bias from AI and human interviewers.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">How to prepare</h2>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">Answer the question that was asked.</strong> AI
                  evaluation leans heavily on relevance. A tight answer that addresses the prompt
                  directly beats an impressive story that wanders.
                </li>
                <li>
                  <strong className="text-ink">Use a clear structure.</strong> Situation, task,
                  action, result. Structure is easy for both software and people to follow, and it
                  keeps you inside a timer.
                </li>
                <li>
                  <strong className="text-ink">Mirror the job&apos;s language — honestly.</strong>{' '}
                  Use the posting&apos;s own terms for the skills you genuinely have.{' '}
                  <Link href="/tools/job-description-keyword-extractor" className="text-[var(--accent)] hover:underline">
                    Pull the key terms from the posting
                  </Link>{' '}
                  before the interview so they come naturally.
                </li>
                <li>
                  <strong className="text-ink">Rehearse out loud, against a clock.</strong> Reading
                  answers is not practice; saying them is. Run{' '}
                  <Link href="/features/interview-coach" className="text-[var(--accent)] hover:underline">
                    AI mock interviews
                  </Link>{' '}
                  with follow-up questions until a two-minute answer feels routine.
                </li>
                <li>
                  <strong className="text-ink">Fix the room, not just the answers.</strong> Clear
                  audio matters more than video quality. Quiet room, light in front of you, camera
                  at eye level, notifications off.
                </li>
                <li>
                  <strong className="text-ink">Ask the questions you are entitled to.</strong> Is AI
                  involved, what does it assess, and does a person review the result? If you need an
                  accommodation or an alternative, ask before you start, in writing.
                </li>
                <li>
                  <strong className="text-ink">Follow up for an outcome.</strong> With half of AI
                  interviews never producing a reply, a short, polite note to the recruiter after a
                  week is entirely reasonable.
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
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.1rem)] mb-4">Practise against an AI before one judges you</h2>
            <p className="text-[var(--text-muted)] mb-8 max-w-lg mx-auto">
              ApplyMaster&apos;s interview coach asks real questions for your role, follows up, and
              lets you rehearse until it is routine. Three mock interviews a month free.
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
              <li><Link href="/blog/ai-and-entry-level-jobs-2026" className="text-[var(--accent)] hover:underline text-sm">Is AI Taking Entry-Level Jobs? What the 2026 Data Actually Shows</Link></li>
              <li><Link href="/blog/interview-preparation-guide" className="text-[var(--accent)] hover:underline text-sm">AI Interview Coaching: Prepare for Any Interview in 30 Minutes</Link></li>
            </ul>
          </nav>
        </div>
      </article>
    </>
  )
}
