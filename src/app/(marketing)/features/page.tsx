import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Job Application Features | ApplyMaster',
  description:
    'Explore ApplyMaster\'s full suite of AI-powered job application features: auto-apply, resume optimization, cover letter generation, interview coaching, and intelligent job matching.',
  alternates: {
    canonical: 'https://applymaster.ai/features',
  },
  openGraph: {
    title: 'AI Job Application Features | ApplyMaster',
    description:
      'Explore ApplyMaster\'s full suite of AI-powered job application features: auto-apply, resume optimization, cover letter generation, interview coaching, and intelligent job matching.',
    url: 'https://applymaster.ai/features',
    siteName: 'ApplyMaster',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Job Application Features | ApplyMaster',
    description:
      'Explore ApplyMaster\'s full suite of AI-powered job application features for smarter, faster job searching.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'AI Job Application Features',
  description:
    'Explore ApplyMaster\'s full suite of AI-powered job search automation tools.',
  url: 'https://applymaster.ai/features',
  isPartOf: {
    '@type': 'WebSite',
    name: 'ApplyMaster',
    url: 'https://applymaster.ai',
  },
};

const features = [
  {
    title: 'Auto-Apply',
    href: '/features/auto-apply',
    description:
      'Automatically submit tailored applications across LinkedIn, Indeed, Glassdoor, and dozens of other job portals. Choose between Copilot mode for guided control or Autopilot for fully hands-free applying.',
    icon: '⚡',
    highlights: ['50+ supported portals', 'Copilot & Autopilot modes', 'Smart form detection'],
  },
  {
    title: 'Resume Optimizer',
    href: '/features/resume-optimizer',
    description:
      'AI restructures your resume for every application, injecting the right keywords to pass ATS filters and impress hiring managers. Get a real-time ATS compatibility score before you submit.',
    icon: '📄',
    highlights: ['ATS scoring engine', 'Keyword optimization', 'Per-job tailoring'],
  },
  {
    title: 'Cover Letter Generator',
    href: '/features/cover-letter-generator',
    description:
      'Generate personalized, compelling cover letters in seconds. The AI researches each company and role, then crafts a letter that matches the tone and priorities of the hiring team.',
    icon: '✉️',
    highlights: ['Company research integration', 'Adjustable tone', 'One-click generation'],
  },
  {
    title: 'Interview Coach',
    href: '/features/interview-coach',
    description:
      'Prepare for interviews with AI-powered mock sessions, real-time coaching via our Chrome extension, and predictive question analysis based on the role and company.',
    icon: '🎤',
    highlights: ['Real-time coaching', 'Mock interviews', 'Question prediction'],
  },
  {
    title: 'Job Matching',
    href: '/features/job-matching',
    description:
      'Our recommendation engine analyzes your skills, experience, and preferences to surface the roles where you are most likely to land an interview. Stop scrolling and start applying strategically.',
    icon: '🎯',
    highlights: ['AI-powered matching', 'Preference learning', 'Daily recommendations'],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-[#0a0a12] text-white">
        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Job Search Automation Tools Built for Results
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-300 leading-relaxed">
              ApplyMaster combines five AI-powered features into a single platform so you can
              find the right roles, apply faster, and interview with confidence. Every feature
              is designed to save you hours each week and dramatically increase your callback rate.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-purple-500 transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/pricing"
                className="rounded-full border border-gray-600 px-8 py-3 text-sm font-semibold text-gray-300 hover:border-purple-400 hover:text-white transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4">
              Everything You Need to Land Your Next Role
            </h2>
            <p className="text-center text-gray-400 mb-16 max-w-2xl mx-auto">
              Each feature works independently or together as a unified workflow.
              Start with what you need and unlock more as your search intensifies.
            </p>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Link
                  key={feature.href}
                  href={feature.href}
                  className="group rounded-2xl border border-gray-800 bg-gray-900/50 p-8 hover:border-purple-500/50 hover:bg-gray-900/80 transition-all duration-300"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-purple-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-5">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-sm font-medium text-purple-400 group-hover:text-purple-300">
                    Learn more &rarr;
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-gray-900/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-16">
              How ApplyMaster Works
            </h2>
            <div className="grid gap-12 md:grid-cols-4">
              {[
                { step: '1', title: 'Upload Your Resume', desc: 'Import your existing resume or build one from scratch with our AI-assisted editor.' },
                { step: '2', title: 'Set Your Preferences', desc: 'Define your target roles, locations, salary range, and work-style preferences.' },
                { step: '3', title: 'Let AI Match & Apply', desc: 'Our engine finds the best-fit jobs and submits tailored applications on your behalf.' },
                { step: '4', title: 'Prepare & Interview', desc: 'Use AI coaching and mock interviews to walk into every call fully prepared.' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-lg font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { stat: '10,000+', label: 'Active Users' },
                { stat: '2M+', label: 'Applications Sent' },
                { stat: '3x', label: 'More Interviews' },
                { stat: '85%', label: 'ATS Pass Rate' },
              ].map((item) => (
                <div key={item.label} className="text-center rounded-2xl border border-gray-800 bg-gray-900/40 p-8">
                  <p className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {item.stat}
                  </p>
                  <p className="mt-2 text-sm text-gray-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-gradient-to-b from-transparent to-purple-900/20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Automate Your Job Search?
            </h2>
            <p className="text-gray-400 mb-10 text-lg">
              Join thousands of job seekers who use ApplyMaster to apply smarter, not harder.
              Start with our free plan and upgrade when you are ready.
            </p>
            <Link
              href="/signup"
              className="rounded-full bg-purple-600 px-10 py-4 text-base font-semibold text-white shadow-lg hover:bg-purple-500 transition-colors"
            >
              Start Applying for Free
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
