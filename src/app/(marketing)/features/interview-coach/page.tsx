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

      <main className="min-h-screen bg-[#0a0a12] text-white">
        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <Link href="/features" className="text-sm text-purple-400 hover:text-purple-300 mb-6 inline-block">
              &larr; All Features
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              AI Interview Coach
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-gray-300 leading-relaxed">
              Interviews are where offers are won or lost. ApplyMaster&apos;s interview coach
              prepares you with role-specific mock sessions, predicts the questions you will
              face, and provides real-time guidance during live interviews through our Chrome
              extension — so you walk in confident and walk out with an offer.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-purple-500 transition-colors"
              >
                Start Practicing Free
              </Link>
            </div>
          </div>
        </section>

        {/* Three Pillars */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-16">
              Three Ways to Prepare
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {/* Mock Interviews */}
              <div className="rounded-2xl border border-orange-500/30 bg-orange-900/10 p-8">
                <h3 className="text-xl font-bold text-orange-400 mb-4">Mock Interviews</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
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
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-orange-600/30 flex items-center justify-center text-xs text-orange-400">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Question Prediction */}
              <div className="rounded-2xl border border-red-500/30 bg-red-900/10 p-8">
                <h3 className="text-xl font-bold text-red-400 mb-4">Question Prediction</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
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
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-red-600/30 flex items-center justify-center text-xs text-red-400">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Real-Time Coaching */}
              <div className="rounded-2xl border border-yellow-500/30 bg-yellow-900/10 p-8">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">Real-Time Coaching</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
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
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-yellow-600/30 flex items-center justify-center text-xs text-yellow-400">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Chrome Extension */}
        <section className="py-20 bg-gray-900/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-12 md:grid-cols-2 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  The Chrome Extension That Sits Beside You
                </h2>
                <p className="text-gray-400 mb-6 leading-relaxed">
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
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-purple-500" />
                      <div>
                        <span className="font-semibold text-white">{item.title}:</span>{' '}
                        <span className="text-sm text-gray-400">{item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-12 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🧩</div>
                  <p className="text-lg font-semibold text-gray-300">Chrome Extension</p>
                  <p className="text-sm text-gray-500 mt-1">Available for Chrome & Edge</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feedback */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-16">
              Detailed Feedback After Every Session
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { metric: 'Answer Quality', desc: 'How well your responses address the question using the STAR method.' },
                { metric: 'Communication', desc: 'Clarity, conciseness, filler-word usage, and speaking pace analysis.' },
                { metric: 'Technical Accuracy', desc: 'For technical roles, evaluation of your problem-solving approach and correctness.' },
                { metric: 'Confidence Score', desc: 'Overall confidence rating based on speech patterns and response completeness.' },
              ].map((item) => (
                <div key={item.metric} className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-center">
                  <h3 className="font-semibold mb-2 text-white">{item.metric}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integration */}
        <section className="py-20 bg-gray-900/30">
          <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">
              From Application to Offer, Seamlessly
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
              The interview coach pulls context from your{' '}
              <Link href="/features/job-matching" className="text-purple-400 underline hover:text-purple-300">matched jobs</Link>,
              your <Link href="/features/resume-optimizer" className="text-purple-400 underline hover:text-purple-300">optimized resume</Link>,
              and your <Link href="/features/cover-letter-generator" className="text-purple-400 underline hover:text-purple-300">cover letter</Link> to
              ensure your interview answers are consistent with what the employer has already seen from you.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">
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
                  <h3 className="font-semibold text-white mb-2">{item.q}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-gradient-to-b from-transparent to-purple-900/20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ace Your Next Interview
            </h2>
            <p className="text-gray-400 mb-10 text-lg">
              Start with a free mock interview and see how prepared you really are.
            </p>
            <Link
              href="/signup"
              className="rounded-full bg-purple-600 px-10 py-4 text-base font-semibold text-white shadow-lg hover:bg-purple-500 transition-colors"
            >
              Start Practicing Free
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
