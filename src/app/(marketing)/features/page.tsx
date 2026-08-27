import type { Metadata } from 'next';
import Link from 'next/link';
import FeatureIcon, { type FeatureIconName } from '@/components/marketing/FeatureIcon';

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
    icon: 'bolt',
    highlights: ['50+ supported portals', 'Copilot & Autopilot modes', 'Smart form detection'],
  },
  {
    title: 'Resume Optimizer',
    href: '/features/resume-optimizer',
    description:
      'AI restructures your resume for every application, injecting the right keywords to pass ATS filters and impress hiring managers. Get a real-time ATS compatibility score before you submit.',
    icon: 'doc',
    highlights: ['ATS scoring engine', 'Keyword optimization', 'Per-job tailoring'],
  },
  {
    title: 'Cover Letter Generator',
    href: '/features/cover-letter-generator',
    description:
      'Generate personalized, compelling cover letters in seconds. The AI researches each company and role, then crafts a letter that matches the tone and priorities of the hiring team.',
    icon: 'mail',
    highlights: ['Company research integration', 'Adjustable tone', 'One-click generation'],
  },
  {
    title: 'Interview Coach',
    href: '/features/interview-coach',
    description:
      'Prepare for interviews with AI-powered mock sessions, real-time coaching via our Chrome extension, and predictive question analysis based on the role and company.',
    icon: 'mic',
    highlights: ['Real-time coaching', 'Mock interviews', 'Question prediction'],
  },
  {
    title: 'Job Matching',
    href: '/features/job-matching',
    description:
      'Our recommendation engine analyzes your skills, experience, and preferences to surface the roles where you are most likely to land an interview. Stop scrolling and start applying strategically.',
    icon: 'target',
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

      <main className="">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-14">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-dim)] to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)]">
              Job Search Automation Tools Built for Results
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-[var(--text-secondary)] leading-relaxed">
              ApplyMaster combines five AI-powered features into a single platform so you can
              find the right roles, apply faster, and interview with confidence. Every feature
              is designed to save you hours each week and dramatically increase your callback rate.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-[var(--accent-solid)] px-8 py-3 text-sm font-semibold text-[var(--text-on-accent)] shadow-lg hover:bg-[var(--accent-solid)] transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/pricing"
                className="rounded-full border border-[var(--border-hover)] px-8 py-3 text-sm font-semibold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-on-accent)] transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-14">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] text-center mb-4">
              Everything You Need to Land Your Next Role
            </h2>
            <p className="text-center text-[var(--text-muted)] mb-16 max-w-2xl mx-auto">
              Each feature works independently or together as a unified workflow.
              Start with what you need and unlock more as your search intensifies.
            </p>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Link
                  key={feature.href}
                  href={feature.href}
                  className="group rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 hover:border-[var(--border-accent)] hover:bg-[var(--bg-card)] transition-all duration-300"
                >
                  <FeatureIcon name={feature.icon as FeatureIconName} />
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-[var(--accent)] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-5">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-solid)]" />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-sm font-medium text-[var(--accent)] group-hover:text-[var(--accent)]">
                    Learn more &rarr;
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-14 bg-[var(--bg-card)]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] text-center mb-14">
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
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-solid)] text-lg font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-14">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { stat: '10,000+', label: 'Active Users' },
                { stat: '2M+', label: 'Applications Sent' },
                { stat: '3x', label: 'More Interviews' },
                { stat: '85%', label: 'ATS Pass Rate' },
              ].map((item) => (
                <div key={item.label} className="text-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
                  <p className="text-4xl font-extrabold bg-gradient-to-r from-[var(--accent)] to-[var(--accent)] bg-clip-text text-transparent">
                    {item.stat}
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-b from-transparent to-[var(--accent-dim)]">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] mb-5">
              Ready to Automate Your Job Search?
            </h2>
            <p className="text-[var(--text-muted)] mb-10 text-lg">
              Join thousands of job seekers who use ApplyMaster to apply smarter, not harder.
              Start with our free plan and upgrade when you are ready.
            </p>
            <Link
              href="/signup"
              className="rounded-full bg-[var(--accent-solid)] px-10 py-4 text-base font-semibold text-[var(--text-on-accent)] shadow-lg hover:bg-[var(--accent-solid)] transition-colors"
            >
              Start Applying for Free
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
