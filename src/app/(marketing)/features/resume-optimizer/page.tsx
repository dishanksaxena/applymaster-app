import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Resume Optimizer & ATS Resume Builder | ApplyMaster',
  description:
    'Optimize your resume for every job with AI. Beat ATS filters with keyword optimization, real-time scoring, and per-job tailoring. Build an ATS-friendly resume in minutes.',
  alternates: {
    canonical: 'https://applymaster.ai/features/resume-optimizer',
  },
  openGraph: {
    title: 'AI Resume Optimizer & ATS Resume Builder | ApplyMaster',
    description:
      'Beat ATS filters with AI-powered keyword optimization and real-time resume scoring.',
    url: 'https://applymaster.ai/features/resume-optimizer',
    siteName: 'ApplyMaster',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Resume Optimizer & ATS Resume Builder | ApplyMaster',
    description:
      'AI-powered resume keyword optimizer. Get an ATS score before you submit.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ApplyMaster Resume Optimizer',
  applicationCategory: 'BusinessApplication',
  description:
    'AI-powered resume optimizer that tailors your resume for each job application and maximizes ATS compatibility.',
  url: 'https://applymaster.ai/features/resume-optimizer',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  operatingSystem: 'Web',
};

export default function ResumeOptimizerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-[#0a0a12] text-white">
        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <Link href="/features" className="text-sm text-purple-400 hover:text-purple-300 mb-6 inline-block">
              &larr; All Features
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              AI Resume Optimizer
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-gray-300 leading-relaxed">
              Over 75% of resumes are rejected by Applicant Tracking Systems before a human
              ever reads them. ApplyMaster&apos;s resume optimizer analyzes each job description,
              identifies missing keywords, restructures your content, and delivers a
              perfectly tailored resume — every single time you apply.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-purple-500 transition-colors"
              >
                Optimize Your Resume Free
              </Link>
            </div>
          </div>
        </section>

        {/* Core Capabilities */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-16">
              How the Resume Optimizer Works
            </h2>
            <div className="grid gap-10 md:grid-cols-2">
              {[
                {
                  title: 'ATS Keyword Injection',
                  desc: 'The AI scans the job posting for required skills, tools, and qualifications, then naturally weaves them into your resume. No keyword-stuffing — every addition reads like something you wrote.',
                },
                {
                  title: 'Real-Time ATS Scoring',
                  desc: 'Before you submit, see an ATS compatibility score that predicts how well your resume will perform against automated filters. Aim for 85% or higher to maximize your chances.',
                },
                {
                  title: 'Per-Job Tailoring',
                  desc: 'Each application gets a unique version of your resume. The AI reorders bullet points, adjusts your summary, and emphasizes the experience most relevant to the specific role.',
                },
                {
                  title: 'Format Preservation',
                  desc: 'ATS systems struggle with complex layouts. The optimizer ensures your resume uses clean, parseable formatting while still looking professional and polished to human reviewers.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8">
                  <h3 className="text-xl font-semibold mb-3 text-green-400">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-20 bg-gray-900/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-16">
              From Upload to Optimized in Seconds
            </h2>
            <div className="grid gap-8 md:grid-cols-4">
              {[
                { step: '1', title: 'Upload Resume', desc: 'Import your existing resume in PDF, DOCX, or plain text format.' },
                { step: '2', title: 'Paste Job Description', desc: 'Drop in the job listing URL or paste the description text.' },
                { step: '3', title: 'AI Analyzes & Optimizes', desc: 'The engine identifies gaps, injects keywords, and restructures content.' },
                { step: '4', title: 'Download & Apply', desc: 'Export your optimized resume and apply with confidence.' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-lg font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What Gets Optimized */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4">
              What the AI Optimizes
            </h2>
            <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
              Every section of your resume is analyzed and improved for the target role.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'Professional Summary', desc: 'Rewrites your summary to align with the role and highlight your most relevant qualifications upfront.' },
                { title: 'Work Experience', desc: 'Reorders and rephrases bullet points to emphasize achievements that match the job requirements.' },
                { title: 'Skills Section', desc: 'Adds missing technical and soft skills mentioned in the job description that you genuinely possess.' },
                { title: 'Education & Certifications', desc: 'Highlights relevant coursework, certifications, and training that strengthen your candidacy.' },
                { title: 'Action Verbs & Metrics', desc: 'Replaces weak verbs with powerful action words and suggests quantifiable metrics for impact.' },
                { title: 'File Format & Layout', desc: 'Ensures ATS-compatible formatting: clean headers, standard fonts, and proper section labels.' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-gray-800 bg-gray-900/40 p-6">
                  <h3 className="font-semibold mb-2 text-white">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integration callout */}
        <section className="py-20 bg-gray-900/30">
          <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Works Seamlessly with Auto-Apply
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              When you use ApplyMaster&apos;s <Link href="/features/auto-apply" className="text-purple-400 underline hover:text-purple-300">auto-apply feature</Link>,
              the resume optimizer runs automatically for every application. Each employer receives a
              resume specifically tailored to their job description — no extra work required.
            </p>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              Pair it with the <Link href="/features/cover-letter-generator" className="text-purple-400 underline hover:text-purple-300">AI cover letter generator</Link> to
              create a complete, cohesive application package for every role.
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
                  q: 'Will the optimized resume still sound like me?',
                  a: 'Yes. The AI enhances your existing content rather than replacing it. It adjusts phrasing and emphasis while preserving your voice and authentic experience.',
                },
                {
                  q: 'What ATS systems does the optimizer target?',
                  a: 'ApplyMaster optimizes for all major ATS platforms including Workday, Greenhouse, Lever, iCIMS, Taleo, SmartRecruiters, and more. The formatting and keyword strategies are tested against each system.',
                },
                {
                  q: 'Can I keep multiple resume versions?',
                  a: 'Yes. Every optimized resume is saved in your dashboard. You can maintain different base versions for different career directions and let the AI tailor each one per application.',
                },
                {
                  q: 'Does it work for all industries?',
                  a: 'The optimizer supports all industries and career levels — from entry-level to executive. The AI adapts its optimization strategy based on the norms and expectations of each field.',
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
              Get Past the ATS. Get to the Interview.
            </h2>
            <p className="text-gray-400 mb-10 text-lg">
              Upload your resume and see your ATS score in seconds. Free to start.
            </p>
            <Link
              href="/signup"
              className="rounded-full bg-purple-600 px-10 py-4 text-base font-semibold text-white shadow-lg hover:bg-purple-500 transition-colors"
            >
              Optimize Your Resume Now
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
