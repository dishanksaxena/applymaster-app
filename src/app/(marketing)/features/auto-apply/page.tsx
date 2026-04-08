import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Auto Apply Jobs Automatically | ApplyMaster',
  description:
    'Automatically apply to jobs across LinkedIn, Indeed, Glassdoor, and 50+ portals. Choose Copilot for guided control or Autopilot for hands-free automatic job applications.',
  alternates: {
    canonical: 'https://applymaster.ai/features/auto-apply',
  },
  openGraph: {
    title: 'Auto Apply Jobs Automatically | ApplyMaster',
    description:
      'Automatically apply to jobs across LinkedIn, Indeed, Glassdoor, and 50+ portals with AI-powered form filling.',
    url: 'https://applymaster.ai/features/auto-apply',
    siteName: 'ApplyMaster',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Auto Apply Jobs Automatically | ApplyMaster',
    description:
      'Apply to jobs automatically with AI. Copilot and Autopilot modes for every job seeker.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ApplyMaster Auto-Apply',
  applicationCategory: 'BusinessApplication',
  description:
    'Automatically apply to jobs across 50+ portals with AI-powered form detection and filling.',
  url: 'https://applymaster.ai/features/auto-apply',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free tier with 10 applications per month',
  },
  operatingSystem: 'Web',
};

const supportedPortals = [
  'LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter', 'Monster',
  'CareerBuilder', 'Dice', 'AngelList', 'Wellfound', 'Lever',
  'Greenhouse', 'Workday', 'iCIMS', 'Taleo', 'SmartRecruiters',
  'BambooHR', 'JazzHR', 'Breezy HR', 'Jobvite', 'Ashby',
];

export default function AutoApplyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-[#0a0a12] text-white">
        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <Link href="/features" className="text-sm text-purple-400 hover:text-purple-300 mb-6 inline-block">
              &larr; All Features
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Apply to Jobs Automatically
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-gray-300 leading-relaxed">
              Stop spending hours filling out the same form fields over and over. ApplyMaster&apos;s
              auto-apply engine detects application forms across 50+ job portals, fills them with
              your tailored information, and submits applications on your behalf — all while you
              focus on what matters most.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-purple-500 transition-colors"
              >
                Start Auto-Applying Free
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

        {/* Copilot vs Autopilot */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4">
              Two Modes, One Goal: More Applications, Less Effort
            </h2>
            <p className="text-center text-gray-400 mb-16 max-w-2xl mx-auto">
              Whether you want full control or total automation, ApplyMaster adapts to your workflow.
            </p>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Copilot */}
              <div className="rounded-2xl border border-blue-500/30 bg-blue-900/10 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-2xl">🎮</span>
                  <h3 className="text-2xl font-bold text-blue-400">Copilot Mode</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  You stay in the driver&apos;s seat. The AI pre-fills every field and suggests answers,
                  but you review and approve each application before it goes out.
                </p>
                <ul className="space-y-3">
                  {[
                    'Review pre-filled forms before submission',
                    'Edit AI suggestions inline',
                    'Approve or skip individual applications',
                    'Full visibility into every answer',
                    'Ideal for senior or targeted roles',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-blue-600/30 flex items-center justify-center text-xs text-blue-400">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Autopilot */}
              <div className="rounded-2xl border border-purple-500/30 bg-purple-900/10 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/20 text-2xl">🚀</span>
                  <h3 className="text-2xl font-bold text-purple-400">Autopilot Mode</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  Set your criteria and let ApplyMaster handle everything. The AI applies to
                  matching jobs 24/7, sending you a summary of what was submitted.
                </p>
                <ul className="space-y-3">
                  {[
                    'Fully hands-free operation',
                    'Runs on your schedule or continuously',
                    'Smart filters prevent irrelevant applications',
                    'Daily digest of submitted applications',
                    'Perfect for high-volume job searches',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-purple-600/30 flex items-center justify-center text-xs text-purple-400">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-gray-900/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-16">
              How Auto-Apply Works
            </h2>
            <div className="grid gap-10 md:grid-cols-3">
              {[
                {
                  step: '1',
                  title: 'Connect Your Profile',
                  desc: 'Upload your resume and fill out your profile once. ApplyMaster extracts your experience, skills, and preferences to build a comprehensive applicant profile.',
                },
                {
                  step: '2',
                  title: 'AI Detects & Fills Forms',
                  desc: 'Our browser engine navigates to job application pages, intelligently detects every form field, and fills in contextually appropriate answers drawn from your profile.',
                },
                {
                  step: '3',
                  title: 'Submit & Track',
                  desc: 'Applications are submitted and logged in your dashboard with status tracking. You can review what was sent, see responses, and follow up — all from one place.',
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Supported Portals */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4">
              50+ Supported Job Portals
            </h2>
            <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
              ApplyMaster integrates with major job boards and applicant tracking systems.
              New portals are added every month.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {supportedPortals.map((portal) => (
                <span
                  key={portal}
                  className="rounded-full border border-gray-700 bg-gray-800/50 px-4 py-2 text-sm text-gray-300"
                >
                  {portal}
                </span>
              ))}
              <span className="rounded-full border border-purple-600/50 bg-purple-900/20 px-4 py-2 text-sm text-purple-400">
                + 30 more
              </span>
            </div>
          </div>
        </section>

        {/* Smart Features */}
        <section className="py-20 bg-gray-900/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-16">
              Intelligent Application Logic
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'Smart Form Detection', desc: 'Automatically identifies input fields, dropdowns, file uploads, and custom questions across any application form.' },
                { title: 'Contextual Answers', desc: 'Generates role-specific answers for open-ended questions by analyzing the job description and your experience.' },
                { title: 'Resume Tailoring', desc: 'Selects or modifies your resume per application to maximize relevance. Works with the Resume Optimizer feature.' },
                { title: 'Duplicate Prevention', desc: 'Tracks every application you have sent and prevents re-applying to the same role at the same company.' },
                { title: 'Rate Limiting', desc: 'Applies at a natural pace to avoid triggering bot-detection systems on job portals.' },
                { title: 'Error Recovery', desc: 'If a submission fails, ApplyMaster retries intelligently and alerts you if manual intervention is needed.' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-gray-800 bg-gray-900/40 p-6">
                  <h3 className="font-semibold mb-2 text-white">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
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
                  q: 'Is auto-applying safe? Will employers know I used automation?',
                  a: 'ApplyMaster submits applications through the same channels a human would. Your applications look identical to manually submitted ones. We use rate-limiting and natural interaction patterns to ensure compliance with portal terms of service.',
                },
                {
                  q: 'Can I exclude certain companies or roles?',
                  a: 'Absolutely. You can create blocklists for companies, set minimum salary thresholds, filter by location, and define keyword exclusions to ensure you only apply to roles you actually want.',
                },
                {
                  q: 'What happens if an application requires a custom question I have not answered before?',
                  a: 'In Copilot mode, you will be prompted to answer it. In Autopilot mode, the AI generates a contextual answer based on your profile and the job description. You can review and edit these answers after the fact.',
                },
                {
                  q: 'How many applications can I send per day?',
                  a: 'Free users can send up to 10 applications per month. Pro users have unlimited applications with smart rate-limiting to keep your accounts safe.',
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
              Stop Applying Manually. Let AI Do the Heavy Lifting.
            </h2>
            <p className="text-gray-400 mb-10 text-lg">
              Start with 10 free applications per month. No credit card required.
            </p>
            <Link
              href="/signup"
              className="rounded-full bg-purple-600 px-10 py-4 text-base font-semibold text-white shadow-lg hover:bg-purple-500 transition-colors"
            >
              Start Auto-Applying Free
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
