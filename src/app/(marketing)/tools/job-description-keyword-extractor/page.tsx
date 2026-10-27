import type { Metadata } from 'next'
import Link from 'next/link'
import ResumeChecker from '@/components/tools/ResumeChecker'
import { SITE_URL, breadcrumbs, faqPage } from '@/lib/seo/site'
import { Crumbs, Faqs, JsonLd, Section, Steps } from '@/components/marketing/Landing'

const title = 'Job Description Keyword Extractor: Find the Keywords to Put on Your Resume'
const description =
  'Paste any job posting to pull out the skills, tools, credentials and phrases it leans on, ranked by how much they matter. Free, no sign-up, runs in your browser.'
const url = `${SITE_URL}/tools/job-description-keyword-extractor`

export const metadata: Metadata = {
  title: { absolute: `${title} | ApplyMaster` },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: 'website', siteName: 'ApplyMaster' },
  twitter: { card: 'summary_large_image', title, description },
}

const FAQS = [
  {
    q: 'How are the keywords ranked?',
    a: 'By the kind of term (a named skill or tool counts most), how many times the posting uses it, and whether it appears in the requirements section, which is what employers usually screen for.',
  },
  {
    q: 'What should I do with the keywords?',
    a: 'Check each against your experience. Where you genuinely have it, use the posting’s exact wording in your resume, ideally in a bullet that says what you did with it. Then run the ATS resume checker to see your match.',
  },
  {
    q: 'Is the job description stored anywhere?',
    a: 'No. The extraction runs in your browser and nothing is sent anywhere.',
  },
]

export default function KeywordExtractorPage() {
  return (
    <div>
      <JsonLd
        data={[
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Free tools', path: '/tools' },
            { name: 'Job description keyword extractor', path: '/tools/job-description-keyword-extractor' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'ApplyMaster Job Description Keyword Extractor',
            url,
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Any (runs in the browser)',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            description,
          },
          faqPage(FAQS),
        ]}
      />

      <section className="pt-14 pb-10">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Crumbs items={[{ name: 'Free tools', href: '/tools' }, { name: 'Keyword extractor' }]} />
          <h1 className="font-display text-[clamp(2.3rem,5vw,3.5rem)] leading-[1.05] mb-4 max-w-3xl" style={{ textWrap: 'balance' }}>
            Job description keyword extractor
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
            Paste a job posting to see the skills, tools and phrases it leans on, most important first. Those are the words
            recruiters search for and applicant tracking systems filter on.
          </p>
          <ResumeChecker mode="jd" />
        </div>
      </section>

      <Section kicker="How to use it" title="From keywords to a stronger resume">
        <Steps
          items={[
            { title: 'Extract', body: 'Paste the whole posting, including requirements and nice-to-haves. Keywords marked “req” come from the requirements.' },
            { title: 'Check against your experience', body: 'Keep the keywords that are true for you. Leave out what you have not done.' },
            { title: 'Use the posting’s wording', body: 'Rewrite matching bullets with the exact terms, so a recruiter’s search for them finds your resume.' },
            { title: 'Measure the match', body: 'Run the ATS resume checker with your resume to see which keywords you now cover.' },
          ]}
        />
        <p className="mt-6">
          <Link prefetch={false} href="/tools/ats-resume-checker" className="inline-block rounded-full bg-[var(--accent-solid)] px-7 py-3 text-sm font-semibold text-[var(--text-on-accent)]">
            Open the ATS resume checker
          </Link>
        </p>
      </Section>

      <Section kicker="Questions" title="Keyword extractor: common questions">
        <Faqs items={FAQS} />
      </Section>
    </div>
  )
}
