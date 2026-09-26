import type { Metadata } from 'next'
import Link from 'next/link'

/*
 * Rewritten to describe the interview coach that exists.
 *
 * The previous page was built around a Chrome extension that listened to live
 * Google Meet, Zoom and Teams interviews and put suggested answers on screen,
 * with "one-click hide for screen sharing". That extension was never built.
 * It also quoted "thousands of interview data points per company" and "users
 * report 60–70% of predicted questions appear" — neither was ever measured.
 *
 * What the coach does: practice interviews in four formats, with questions
 * generated from the company, the role, the job description and the person's
 * own resume, and a 1–10 score on every answer with strengths, what to
 * improve, and a stronger example answer.
 */

export const metadata: Metadata = {
  title: 'AI Interview Coach — Practice Interviews With Feedback | ApplyMaster',
  description:
    'Practice behavioural, technical, system design and case interviews with questions built from the job description and your own resume. Every answer is scored with specific feedback and a stronger example.',
  alternates: { canonical: 'https://applymaster.ai/features/interview-coach' },
  openGraph: {
    title: 'AI Interview Coach | ApplyMaster',
    description: 'Practice interviews tailored to the role, with a score and specific feedback on every answer.',
    url: 'https://applymaster.ai/features/interview-coach',
    siteName: 'ApplyMaster',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Interview Coach | ApplyMaster',
    description: 'Practice interviews tailored to the role, with a score and specific feedback on every answer.',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ApplyMaster Interview Coach',
  applicationCategory: 'BusinessApplication',
  description: 'Practice interviews generated from the job description and your resume, with scored feedback on every answer.',
  url: 'https://applymaster.ai/features/interview-coach',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  operatingSystem: 'Web',
}

const FORMATS = [
  {
    name: 'Behavioural',
    tone: 'yellow',
    desc: 'The “tell me about a time” questions, pulled from your actual experience so you rehearse the stories you will really tell.',
  },
  {
    name: 'Technical',
    tone: 'blue',
    desc: 'Concepts and problem-solving for the stack in the job description — explained out loud, the way an interviewer hears it.',
  },
  {
    name: 'System design',
    tone: 'purple',
    desc: 'Open-ended design prompts at the level of the role, so you practise structuring an answer before you are in the room.',
  },
  {
    name: 'Case study',
    tone: 'green',
    desc: 'Business and product cases for PM, consulting and analytics roles, where how you reason matters more than the answer.',
  },
] as const

const STEPS = [
  { title: 'Tell it the job', desc: 'Company, role, and — for the best questions — the job description.' },
  { title: 'It reads your resume', desc: 'Questions are built around your own experience, not a generic list.' },
  { title: 'Type your answer', desc: 'Take your time; this is practice, not a test.' },
  { title: 'Get a score and specifics', desc: 'A 1–10 score, what was strong, what to improve, and a stronger example answer.' },
]

const FAQS = [
  {
    q: 'Does it help during a real interview?',
    a: 'No — and it is not meant to. The coach is for practice beforehand. Getting prompted during a live interview is something many employers treat as misrepresentation, and it would put your offer at risk.',
  },
  {
    q: 'Where do the questions come from?',
    a: 'They are generated for each session from the company and role you give it, the job description if you paste one, and your resume. Two people practising for the same job get different questions, because their experience is different.',
  },
  {
    q: 'What does the feedback look like?',
    a: 'Every answer gets a score out of ten, the parts that worked, the parts to strengthen, and an example of a stronger answer you can compare against.',
  },
  {
    q: 'Is it free?',
    a: 'Yes, practice interviews are included in the free plan.',
  },
]

export default function InterviewCoachPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-14">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--yellow-dim)] to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <Link href="/features" className="text-sm text-[var(--accent)] mb-6 inline-block">
              &larr; All Features
            </Link>
            <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)]">AI Interview Coach</h1>
            <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)] leading-relaxed">
              Practise the interview before you have it. The coach builds questions from the job and from your own
              resume, then scores every answer and shows you exactly how to make it stronger.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-[var(--accent-solid)] px-8 py-3 text-sm font-semibold text-[var(--text-on-accent)] shadow-lg transition-colors"
              >
                Start practising free
              </Link>
            </div>
          </div>
        </section>

        {/* Formats */}
        <section className="py-14">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] text-center mb-4">Four kinds of interview</h2>
            <p className="text-center text-[var(--text-muted)] max-w-xl mx-auto mb-12">
              Pick the one you are about to face. Each session is generated fresh for the role.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FORMATS.map(f => (
                <div key={f.name} className="rounded-2xl border border-[var(--border)] p-7" style={{ background: `var(--${f.tone}-dim)` }}>
                  <h3 className="text-lg font-bold mb-3" style={{ color: `var(--${f.tone})` }}>
                    {f.name}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-14" style={{ background: 'var(--bg-secondary)' }}>
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] text-center mb-12">How a session works</h2>
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

        {/* Example feedback */}
        <section className="py-14">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] text-center mb-10">What feedback looks like</h2>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-[var(--text-faint)] mb-2">Example</p>
              <p className="font-semibold text-[var(--text)]">“Tell me about a time you disagreed with a technical decision.”</p>
              <div className="mt-5 flex items-center gap-3">
                <span className="font-display text-4xl text-[var(--text)]">7</span>
                <span className="text-sm text-[var(--text-muted)]">/ 10</span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--green)] mb-1">What worked</p>
                  <p className="text-sm text-[var(--text-secondary)]">A clear situation, and you owned the disagreement instead of blaming the team.</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--yellow)] mb-1">To strengthen</p>
                  <p className="text-sm text-[var(--text-secondary)]">Name the outcome with a number, and say what you would do differently now.</p>
                </div>
              </div>
            </div>
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
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] mb-5">Walk in having already answered it</h2>
            <p className="text-[var(--text-muted)] mb-10 text-lg">Your first practice session takes about ten minutes.</p>
            <Link
              href="/signup"
              className="rounded-full bg-[var(--accent-solid)] px-10 py-4 text-base font-semibold text-[var(--text-on-accent)] shadow-lg transition-colors"
            >
              Start practising free
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
