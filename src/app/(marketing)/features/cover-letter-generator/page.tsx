import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Cover Letter Generator | Write Cover Letters Instantly | ApplyMaster',
  description:
    'Generate personalized, compelling cover letters in seconds with AI. ApplyMaster researches each company and role to craft cover letters that match the hiring team\'s tone and priorities.',
  alternates: {
    canonical: 'https://applymaster.ai/features/cover-letter-generator',
  },
  openGraph: {
    title: 'AI Cover Letter Generator | ApplyMaster',
    description:
      'Generate personalized cover letters in seconds. AI researches each company and crafts the perfect letter.',
    url: 'https://applymaster.ai/features/cover-letter-generator',
    siteName: 'ApplyMaster',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Cover Letter Generator | ApplyMaster',
    description:
      'One-click AI cover letters personalized to every job and company.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ApplyMaster Cover Letter Generator',
  applicationCategory: 'BusinessApplication',
  description:
    'AI-powered cover letter writer that generates personalized cover letters for each job application.',
  url: 'https://applymaster.ai/features/cover-letter-generator',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  operatingSystem: 'Web',
};

export default function CoverLetterGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-[#0a0a12] text-white">
        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-pink-900/20 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <Link href="/features" className="text-sm text-purple-400 hover:text-purple-300 mb-6 inline-block">
              &larr; All Features
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              AI Cover Letter Generator
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-gray-300 leading-relaxed">
              Writing a great cover letter for every application is exhausting. ApplyMaster&apos;s
              AI cover letter writer researches the company, analyzes the role, and produces a
              personalized letter that connects your experience to what the hiring team actually
              cares about — in seconds, not hours.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-purple-500 transition-colors"
              >
                Generate Your First Cover Letter
              </Link>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-16">
              What Makes ApplyMaster&apos;s Cover Letters Different
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Company Research Integration',
                  desc: 'The AI pulls recent news, mission statements, and company values to craft letters that show genuine interest and awareness. Hiring managers notice when you have done your homework.',
                },
                {
                  title: 'Adjustable Tone Control',
                  desc: 'Choose from professional, conversational, enthusiastic, or executive tones. The AI adapts its writing style to match the company culture and seniority of the role.',
                },
                {
                  title: 'Skills-to-Requirements Mapping',
                  desc: 'The generator maps your specific experience to each job requirement, creating concrete examples that prove you can do the job — not just claim you can.',
                },
                {
                  title: 'One-Click Generation',
                  desc: 'Paste a job URL or description and get a polished cover letter instantly. Edit inline or regenerate sections you want to adjust.',
                },
                {
                  title: 'Multiple Formats',
                  desc: 'Export as PDF, DOCX, or plain text. Copy directly to clipboard for pasting into application portals. Each format is professionally typeset.',
                },
                {
                  title: 'Version History',
                  desc: 'Every generated letter is saved in your dashboard. Compare versions, reuse successful templates, and track which cover letters led to interviews.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8">
                  <h3 className="text-lg font-semibold mb-3 text-pink-400">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-gray-900/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-16">
              Generate a Cover Letter in 3 Steps
            </h2>
            <div className="grid gap-10 md:grid-cols-3">
              {[
                {
                  step: '1',
                  title: 'Provide the Job Details',
                  desc: 'Paste the job listing URL, upload a job description, or let ApplyMaster pull it directly from your matched jobs.',
                },
                {
                  step: '2',
                  title: 'AI Researches & Writes',
                  desc: 'The AI analyzes the role requirements, researches the company, and drafts a letter that bridges your experience with their needs.',
                },
                {
                  step: '3',
                  title: 'Review, Edit & Send',
                  desc: 'Fine-tune the tone, adjust specific paragraphs, or regenerate sections. Then export or copy to submit with your application.',
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-600 text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tone Examples */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4">
              Tone Control for Every Situation
            </h2>
            <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
              Different companies expect different communication styles.
              ApplyMaster adapts to match.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { tone: 'Professional', desc: 'Polished and formal. Ideal for enterprise companies, financial services, and law firms.', color: 'border-blue-500/30 bg-blue-900/10' },
                { tone: 'Conversational', desc: 'Friendly and approachable. Great for startups, creative agencies, and tech companies.', color: 'border-green-500/30 bg-green-900/10' },
                { tone: 'Enthusiastic', desc: 'High-energy and passionate. Perfect for mission-driven organizations and early-stage startups.', color: 'border-yellow-500/30 bg-yellow-900/10' },
                { tone: 'Executive', desc: 'Strategic and authoritative. Designed for C-suite, VP, and director-level positions.', color: 'border-purple-500/30 bg-purple-900/10' },
              ].map((item) => (
                <div key={item.tone} className={`rounded-xl border p-6 ${item.color}`}>
                  <h3 className="font-semibold mb-2 text-white">{item.tone}</h3>
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
              Part of the Complete Application Package
            </h2>
            <p className="text-gray-400 mb-4 max-w-2xl mx-auto leading-relaxed">
              The cover letter generator works hand-in-hand with the{' '}
              <Link href="/features/resume-optimizer" className="text-purple-400 underline hover:text-purple-300">resume optimizer</Link>.
              Together, they produce a cohesive application where your resume and cover letter
              reinforce each other without repeating the same points.
            </p>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
              When paired with{' '}
              <Link href="/features/auto-apply" className="text-purple-400 underline hover:text-purple-300">auto-apply</Link>,
              cover letters are generated and attached automatically for every application you send.
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
                  q: 'Do employers know the cover letter was written by AI?',
                  a: 'No. Each letter is unique and written in a natural, human style. The AI avoids generic phrases and cliches that would signal automated content. Your personal experiences and specific examples make every letter authentic.',
                },
                {
                  q: 'Can I edit the generated cover letter?',
                  a: 'Absolutely. You have full editing control after generation. You can modify any paragraph, regenerate specific sections, adjust the tone, or add personal anecdotes the AI might not know about.',
                },
                {
                  q: 'What if the company does not require a cover letter?',
                  a: 'Even when optional, a strong cover letter can set you apart. Studies show that 83% of hiring managers say a great cover letter can earn an interview even if the resume is not a perfect match. ApplyMaster makes it effortless to include one.',
                },
                {
                  q: 'How does the AI research the company?',
                  a: 'The AI pulls from publicly available data including the company website, recent press releases, industry news, and Glassdoor reviews to understand their culture, values, and current priorities.',
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
              Write Cover Letters That Get Callbacks
            </h2>
            <p className="text-gray-400 mb-10 text-lg">
              Generate your first personalized cover letter in under 30 seconds. Free to try.
            </p>
            <Link
              href="/signup"
              className="rounded-full bg-purple-600 px-10 py-4 text-base font-semibold text-white shadow-lg hover:bg-purple-500 transition-colors"
            >
              Generate a Cover Letter Free
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
