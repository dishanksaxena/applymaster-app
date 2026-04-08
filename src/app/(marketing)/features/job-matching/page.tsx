import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Job Matching & Smart Job Recommendation Engine | ApplyMaster',
  description:
    'Find the perfect job with AI-powered matching. ApplyMaster analyzes your skills, experience, and preferences to recommend roles where you are most likely to get an interview.',
  alternates: {
    canonical: 'https://applymaster.ai/features/job-matching',
  },
  openGraph: {
    title: 'AI Job Matching & Smart Job Search | ApplyMaster',
    description:
      'Stop scrolling job boards. Let AI surface the roles you are most qualified for.',
    url: 'https://applymaster.ai/features/job-matching',
    siteName: 'ApplyMaster',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Job Matching Engine | ApplyMaster',
    description:
      'AI-powered job recommendation engine that finds roles matching your skills and goals.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ApplyMaster Job Matching',
  applicationCategory: 'BusinessApplication',
  description:
    'AI-powered job recommendation engine that matches candidates with roles based on skills, experience, and preferences.',
  url: 'https://applymaster.ai/features/job-matching',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  operatingSystem: 'Web',
};

export default function JobMatchingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-[#0a0a12] text-white">
        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <Link href="/features" className="text-sm text-purple-400 hover:text-purple-300 mb-6 inline-block">
              &larr; All Features
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AI Job Matching
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-gray-300 leading-relaxed">
              Scrolling through hundreds of listings to find the right roles wastes time and
              energy. ApplyMaster&apos;s job recommendation engine analyzes your entire
              professional profile — skills, experience, career goals, and work preferences —
              then surfaces the positions where you have the highest chance of landing an
              interview.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-purple-500 transition-colors"
              >
                Find Your Best Matches Free
              </Link>
            </div>
          </div>
        </section>

        {/* How Matching Works */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-16">
              How AI Job Matching Works
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              {[
                {
                  title: 'Profile Analysis',
                  desc: 'The AI parses your resume, work history, and stated preferences to build a comprehensive candidate profile. It identifies both your explicit skills and inferred capabilities.',
                },
                {
                  title: 'Job Requirement Extraction',
                  desc: 'Every job listing is decomposed into its core requirements: technical skills, soft skills, experience level, industry knowledge, and cultural fit signals.',
                },
                {
                  title: 'Multi-Dimensional Scoring',
                  desc: 'Each job is scored across multiple dimensions including skills match, experience alignment, salary fit, location compatibility, and career trajectory alignment.',
                },
                {
                  title: 'Preference Learning',
                  desc: 'As you interact with recommendations — applying to some and skipping others — the engine learns your preferences and refines future suggestions accordingly.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8">
                  <h3 className="text-xl font-semibold mb-3 text-cyan-400">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Matching Criteria */}
        <section className="py-20 bg-gray-900/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4">
              What the Engine Considers
            </h2>
            <p className="text-center text-gray-400 mb-16 max-w-2xl mx-auto">
              Unlike simple keyword matching, ApplyMaster evaluates holistic fit.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'Technical Skills', desc: 'Programming languages, frameworks, tools, and certifications you bring to the table.' },
                { title: 'Experience Level', desc: 'Years of experience, leadership history, and project complexity aligned to the role.' },
                { title: 'Industry Knowledge', desc: 'Domain expertise in specific industries like fintech, healthcare, SaaS, or e-commerce.' },
                { title: 'Salary Expectations', desc: 'Matches roles within your target compensation range, factoring in location-based adjustments.' },
                { title: 'Work Preferences', desc: 'Remote, hybrid, or on-site. Full-time, contract, or freelance. Startup or enterprise.' },
                { title: 'Career Trajectory', desc: 'Identifies roles that align with where you want to be in 2-5 years, not just where you are today.' },
                { title: 'Cultural Fit', desc: 'Analyzes company values, team size, and management style signals from the listing.' },
                { title: 'Growth Potential', desc: 'Prioritizes roles with clear advancement paths and learning opportunities.' },
                { title: 'Application Success Rate', desc: 'Uses historical data to estimate your likelihood of progressing past the initial screen.' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-gray-800 bg-gray-900/40 p-6">
                  <h3 className="font-semibold mb-2 text-white">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Daily Recommendations */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-16">
              Daily Recommendations, Not Endless Scrolling
            </h2>
            <div className="grid gap-10 md:grid-cols-3">
              {[
                {
                  title: 'Morning Digest',
                  desc: 'Wake up to a curated list of your top job matches, ranked by fit score. Review them over coffee and decide which to apply to.',
                },
                {
                  title: 'Real-Time Alerts',
                  desc: 'Get notified instantly when a high-match job is posted. Be among the first to apply and increase your chances of being seen.',
                },
                {
                  title: 'Weekly Insights',
                  desc: 'See trends in your job market: which skills are in demand, salary movements, and how your profile compares to other applicants.',
                },
              ].map((item) => (
                <div key={item.title} className="text-center rounded-2xl border border-gray-800 bg-gray-900/40 p-8">
                  <h3 className="text-lg font-semibold mb-3 text-cyan-400">{item.title}</h3>
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
              Find, Apply, and Interview — All in One Place
            </h2>
            <p className="text-gray-400 mb-4 max-w-2xl mx-auto leading-relaxed">
              When the AI finds a great match, you can apply with one click using{' '}
              <Link href="/features/auto-apply" className="text-purple-400 underline hover:text-purple-300">auto-apply</Link>.
              Your <Link href="/features/resume-optimizer" className="text-purple-400 underline hover:text-purple-300">resume</Link> and{' '}
              <Link href="/features/cover-letter-generator" className="text-purple-400 underline hover:text-purple-300">cover letter</Link> are
              tailored automatically. And when you get the interview, the{' '}
              <Link href="/features/interview-coach" className="text-purple-400 underline hover:text-purple-300">interview coach</Link> has
              already prepared your talking points.
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
                  q: 'Where does ApplyMaster find job listings?',
                  a: 'We aggregate listings from LinkedIn, Indeed, Glassdoor, company career pages, and dozens of niche job boards. Our crawler indexes thousands of new positions daily.',
                },
                {
                  q: 'How is this different from job board recommendations?',
                  a: 'Job boards typically use simple keyword matching. ApplyMaster uses a multi-dimensional scoring model that considers your full career history, stated goals, interaction patterns, and historical success rates across similar profiles.',
                },
                {
                  q: 'Can I adjust my matching preferences?',
                  a: 'Yes. You have full control over every matching parameter including preferred industries, company sizes, work arrangements, minimum salary, and role seniority. The AI treats these as hard constraints.',
                },
                {
                  q: 'Does the matching get better over time?',
                  a: 'Absolutely. The engine uses reinforcement learning from your interactions. Every job you apply to, skip, or bookmark helps the algorithm understand what you are really looking for.',
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
              Stop Searching. Start Matching.
            </h2>
            <p className="text-gray-400 mb-10 text-lg">
              Set up your profile and get your first batch of AI-curated job matches in minutes.
            </p>
            <Link
              href="/signup"
              className="rounded-full bg-purple-600 px-10 py-4 text-base font-semibold text-white shadow-lg hover:bg-purple-500 transition-colors"
            >
              Get Matched Free
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
