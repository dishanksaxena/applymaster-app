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
      'Every morning it searches 31 company career sites plus Adzuna and RemoteOK for your roles, queues the best matches, tailors your resume and fills in the application form. You review and send.',
    icon: 'bolt',
    highlights: ['Daily matches', 'Form filling', 'Referral-first'],
  },
  {
    title: 'Resume Optimizer',
    href: '/features/resume-optimizer',
    description:
      'AI restructures your resume for every application, injecting the right keywords to pass ATS filters and impress hiring managers. Get an ATS compatibility score before you submit.',
    icon: 'doc',
    highlights: ['ATS scoring engine', 'Keyword optimization', 'Per-job tailoring'],
  },
  {
    title: 'Cover Letter Generator',
    href: '/features/cover-letter-generator',
    description:
      'Generate a personalised cover letter in seconds from the job description and your resume, in the tone you choose — then download it as a clean PDF.',
    icon: 'mail',
    highlights: ['Uses the job description', 'Adjustable tone', 'PDF export'],
  },
  {
    title: 'Interview Coach',
    href: '/features/interview-coach',
    description:
      'Practise behavioural, technical, system design and case interviews with questions built from the job and your own resume, and get scored feedback on every answer.',
    icon: 'mic',
    highlights: ['Mock interviews', 'Company-specific', 'Answer feedback'],
  },
  {
    title: 'Job Matching',
    href: '/features/job-matching',
    description:
      'Every role is scored against your target roles, seniority, location, salary floor and skills, with the reasons shown — so you spend your time on the jobs that actually fit.',
    icon: 'target',
    highlights: ['Explained scores', 'Seniority check', 'Daily recommendations'],
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
                { step: '1', title: 'Upload Your Resume', desc: 'Upload your PDF or Word resume. We read it, score it for applicant-tracking systems and show what to fix.' },
                { step: '2', title: 'Set Your Preferences', desc: 'Define your target roles, locations, salary range, and work-style preferences.' },
                { step: '3', title: 'Review & Send', desc: 'Each morning the best-fit jobs arrive with your resume tailored and the form filled in. You review and send.' },
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
                // These were "10,000+ active users", "2M+ applications sent", "3x more
                // interviews" and "85% ATS pass rate" — none of them measured. Only
                // numbers that describe the product and can be checked.
                { stat: '31', label: 'Company career sites searched daily' },
                { stat: '6,000+', label: 'Live roles checked each morning' },
                { stat: '4', label: 'Interview practice formats' },
                { stat: '1', label: 'Receipt for every application' },
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
