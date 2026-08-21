import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Interview Coach & Preparation Tool | ApplyMaster',
  description:
    'Prepare for interviews with AI-powered mock sessions, real-time coaching via Chrome extension, and predictive question analysis. Get real-time interview help when it matters most.',
  alternates: {
    canonical: 'https://applymaster.ai/features/interview-coach',
  },
  openGraph: {
    title: 'AI Interview Coach & Preparation Tool | ApplyMaster',
    description:
      'Real-time AI interview coaching, mock interviews, and question prediction for your next job interview.',
    url: 'https://applymaster.ai/features/interview-coach',
    siteName: 'ApplyMaster',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Interview Coach | ApplyMaster',
    description:
      'Real-time interview help with AI coaching, mock sessions, and question prediction.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ApplyMaster Interview Coach',
  applicationCategory: 'BusinessApplication',
  description:
    'AI-powered interview preparation tool with real-time coaching, mock interviews, and question prediction.',
  url: 'https://applymaster.ai/features/interview-coach',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  operatingSystem: 'Web',
};

export default function InterviewCoachPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-14">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--yellow-dim)] to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <Link href="/features" className="text-sm text-[var(--accent)] hover:text-[var(--accent)] mb-6 inline-block">
              &larr; All Features
            </Link>
            <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)]">
              AI Interview Coach
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)] leading-relaxed">
              Interviews are where offers are won or lost. ApplyMaster&apos;s interview coach
              prepares you with role-specific mock sessions, predicts the questions you will
              face, and provides real-time guidance during live interviews through our Chrome
              extension — so you walk in confident and walk out with an offer.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-[var(--accent-solid)] px-8 py-3 text-sm font-semibold text-[var(--text-on-accent)] shadow-lg hover:bg-[var(--accent-solid)] transition-colors"
              >
                Start Practicing Free
              </Link>
            </div>
          </div>
        </section>

        {/* Three Pillars */}
        <section className="py-14">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] text-center mb-14">
              Three Ways to Prepare
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {/* Mock Interviews */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--yellow-dim)] p-8">
                <h3 className="text-xl font-bold text-[var(--yellow)] mb-4">Mock Interviews</h3>
                <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                  Practice with an AI interviewer that simulates the real thing. Behavioral,
                  technical, and case-study formats available for every industry.
                </p>
                <ul className="space-y-3">
                  {[
                    'Role-specific question sets',
                    'Timed response practice',
                    'Detailed feedback on every answer',
                    'STAR method coaching',
                    'Technical whiteboard mode',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-[var(--yellow-dim)] flex items-center justify-center text-xs text-[var(--yellow)]">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Question Prediction */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--red-dim)] p-8">
                <h3 className="text-xl font-bold text-[var(--red)] mb-4">Question Prediction</h3>
                <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                  The AI analyzes the job description, company culture, and interview patterns
                  to predict the most likely questions you will face.
                </p>
                <ul className="space-y-3">
                  {[
                    'Job-description-based predictions',
                    'Company-specific question history',
                    'Industry trend analysis',
                    'Suggested answer frameworks',
                    'Difficulty-level indicators',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-[var(--red-dim)] flex items-center justify-center text-xs text-[var(--red)]">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Real-Time Coaching */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--yellow-dim)] p-8">
                <h3 className="text-xl font-bold text-[var(--yellow)] mb-4">Real-Time Coaching</h3>
                <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                  During live video interviews, our Chrome extension listens to questions and
                  provides subtle, real-time suggestions to help you respond with confidence.
                </p>
                <ul className="space-y-3">
                  {[
                    'Works with Zoom, Meet, Teams',
                    'Discreet on-screen suggestions',
                    'Key talking points highlighted',
                    'Filler-word detection alerts',
                    'Post-interview performance summary',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-[var(--yellow-dim)] flex items-center justify-center text-xs text-[var(--yellow)]">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Chrome Extension */}
        <section className="py-14 bg-[var(--bg-card)]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-12 md:grid-cols-2 items-center">
              <div>
                <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] mb-5">
                  The Chrome Extension That Sits Beside You
                </h2>
                <p className="text-[var(--text-muted)] mb-6 leading-relaxed">
                  Install the ApplyMaster Chrome extension and activate it before your next
                  interview. It works quietly alongside your video call, processing the
                  conversation in real time.
                </p>
                <ul className="space-y-4">
                  {[
                    { title: 'Invisible to Interviewers', desc: 'The extension runs as a discreet sidebar that only you can see.' },
                    { title: 'Instant Context', desc: 'As questions are asked, relevant talking points and data from your resume appear immediately.' },
                    { title: 'Confidence Metrics', desc: 'Track your speaking pace, filler words, and response length in real time.' },
                    { title: 'Post-Call Analysis', desc: 'After the interview, get a full breakdown with areas of strength and suggestions for improvement.' },
                  ].map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-solid)]" />
                      <div>
                        <span className="font-semibold text-ink">{item.title}:</span>{' '}
                        <span className="text-sm text-[var(--text-muted)]">{item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-12 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🧩</div>
                  <p className="text-lg font-semibold text-[var(--text-secondary)]">Chrome Extension</p>
                  <p className="text-sm text-[var(--text-faint)] mt-1">Available for Chrome & Edge</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feedback */}
        <section className="py-14">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] text-center mb-14">
              Detailed Feedback After Every Session
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { metric: 'Answer Quality', desc: 'How well your responses address the question using the STAR method.' },
                { metric: 'Communication', desc: 'Clarity, conciseness, filler-word usage, and speaking pace analysis.' },
                { metric: 'Technical Accuracy', desc: 'For technical roles, evaluation of your problem-solving approach and correctness.' },
                { metric: 'Confidence Score', desc: 'Overall confidence rating based on speech patterns and response completeness.' },
              ].map((item) => (
                <div key={item.metric} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center">
                  <h3 className="font-semibold mb-2 text-ink">{item.metric}</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integration */}
        <section className="py-14 bg-[var(--bg-card)]">
          <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] mb-5">
              From Application to Offer, Seamlessly
            </h2>
            <p className="text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
              The interview coach pulls context from your{' '}
              <Link href="/features/job-matching" className="text-[var(--accent)] underline hover:text-[var(--accent)]">matched jobs</Link>,
              your <Link href="/features/resume-optimizer" className="text-[var(--accent)] underline hover:text-[var(--accent)]">optimized resume</Link>,
              and your <Link href="/features/cover-letter-generator" className="text-[var(--accent)] underline hover:text-[var(--accent)]">cover letter</Link> to
              ensure your interview answers are consistent with what the employer has already seen from you.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] text-center mb-10">
              Frequently Asked Questions
            </h2>
            <div className="space-y-8">
              {[
                {
                  q: 'Is using real-time coaching during an interview ethical?',
                  a: 'The coaching extension provides talking-point reminders and confidence metrics similar to having notes in front of you. It does not generate answers for you to read verbatim. Many professionals reference notes during interviews, and our tool enhances that practice. We recommend transparency with employers about your preparation methods.',
                },
                {
                  q: 'What video platforms are supported?',
                  a: 'The Chrome extension works with Zoom (web client), Google Meet, Microsoft Teams (web), and most browser-based video calling platforms.',
                },
                {
                  q: 'How accurate are the predicted questions?',
                  a: 'Our prediction engine draws from thousands of interview data points per company and role. Users report that 60-70% of predicted questions appear in some form during their actual interviews.',
                },
                {
                  q: 'Can I practice for technical interviews?',
                  a: 'Yes. The mock interview system includes coding challenges, system design questions, and technical concept explanations for software engineering, data science, product management, and other technical roles.',
                },
              ].map((item) => (
                <div key={item.q}>
                  <h3 className="font-semibold text-ink mb-2">{item.q}</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-b from-transparent to-[var(--accent-dim)]">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] mb-5">
              Ace Your Next Interview
            </h2>
            <p className="text-[var(--text-muted)] mb-10 text-lg">
              Start with a free mock interview and see how prepared you really are.
            </p>
            <Link
              href="/signup"
              className="rounded-full bg-[var(--accent-solid)] px-10 py-4 text-base font-semibold text-[var(--text-on-accent)] shadow-lg hover:bg-[var(--accent-solid)] transition-colors"
            >
              Start Practicing Free
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
