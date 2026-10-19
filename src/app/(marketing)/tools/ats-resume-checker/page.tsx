import type { Metadata } from 'next'
import Link from 'next/link'
import ResumeChecker from '@/components/tools/ResumeChecker'
import { SITE_URL, breadcrumbs, faqPage } from '@/lib/seo/site'
import { Checks, Crumbs, Faqs, JsonLd, Section } from '@/components/marketing/Landing'

const title = 'Free ATS Resume Checker: Match Your Resume to a Job Description'
const description =
  'Paste a job description and your resume to see which keywords you match and which are missing, plus a check of the basics recruiters look for. Free, no sign-up, and nothing leaves your browser.'
const url = `${SITE_URL}/tools/ats-resume-checker`

export const metadata: Metadata = {
  title: { absolute: `${title} | ApplyMaster` },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: 'website', siteName: 'ApplyMaster' },
  twitter: { card: 'summary_large_image', title, description },
}

const FAQS = [
  {
    q: 'What does this ATS resume checker measure?',
    a: 'How many of the terms a job description leans on also appear in your resume: skills and tools, credentials, repeated phrases and soft skills, weighted by how often the posting uses them and whether they sit in its requirements. It also checks basics like contact details, section headings, measurable results and length.',
  },
  {
    q: 'Will a high score guarantee my resume passes an ATS?',
    a: 'No, and no tool can promise that. Every employer configures its own applicant tracking system, and many rely on recruiters searching for keywords rather than automatic rejection. A higher match means a recruiter searching for this job’s terms is more likely to find you.',
  },
  {
    q: 'Is my resume uploaded or stored?',
    a: 'No. The file is read and checked in your browser. Nothing you paste or upload is sent to ApplyMaster or anyone else.',
  },
  {
    q: 'Should I add every missing keyword?',
    a: 'Only the ones that are true. Add skills you genuinely have, in the words the posting uses ("PostgreSQL" rather than "databases"), in your experience bullets where you used them, not just in a list.',
  },
  {
    q: 'Which file types work?',
    a: 'PDF, Word (.docx) and plain text. A scanned PDF is an image with no text in it; paste the text instead. If the checker cannot read your PDF, many ATS parsers cannot either.',
  },
  {
    q: 'Is it really free?',
    a: 'Yes, with no sign-up and no limit. ApplyMaster makes it to show how we think about applications; the ApplyMaster app can tailor your resume to each job for you.',
  },
]

export default function AtsResumeCheckerPage() {
  return (
    <div>
      <JsonLd
        data={[
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Free tools', path: '/tools' },
            { name: 'ATS resume checker', path: '/tools/ats-resume-checker' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'ApplyMaster ATS Resume Checker',
            url,
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Any (runs in the browser)',
            browserRequirements: 'Requires JavaScript',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            description,
          },
          faqPage(FAQS),
        ]}
      />

      <section className="pt-14 pb-10">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <Crumbs items={[{ name: 'Free tools', href: '/tools' }, { name: 'ATS resume checker' }]} />
          <h1 className="font-display text-[clamp(2.3rem,5vw,3.5rem)] leading-[1.05] mb-4 max-w-3xl" style={{ textWrap: 'balance' }}>
            Free ATS resume checker
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
            See which of a job’s keywords your resume already has and which are missing, before you apply. No sign-up, and
            your resume never leaves your browser.
          </p>
          <ResumeChecker mode="resume" />
        </div>
      </section>

      <Section kicker="How it works" title="What the checker looks at">
        <Checks
          items={[
            'Skills and tools named in the posting, from programming languages to Salesforce, Excel and GAAP, matched with common variants (Postgres and PostgreSQL, k8s and Kubernetes).',
            'Credentials and acronyms the posting uses, like SOC 2, HIPAA or CPA, and phrases it repeats, like “payment systems”.',
            'Terms in the requirements section weigh more, because that is what employers screen for.',
            'The job title, with or without its seniority, since recruiters often search by title.',
            'Basics: email, phone, LinkedIn, standard section headings, measurable results and length.',
          ]}
        />
      </Section>

      <Section kicker="Using your results" title="How to raise your match honestly">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            ['Use the posting’s words', 'If the job says “stakeholder management” and your resume says “worked with partners”, recruiters searching for the posting’s phrase will not find you.'],
            ['Put keywords where you used them', 'A skill in an experience bullet, with what it achieved, carries more weight with recruiters than the same word in a list.'],
            ['Skip what is not true', 'Adding skills you do not have gets you interviews you cannot pass. Leave them out, or say you are learning them.'],
          ].map(([h, b]) => (
            <div key={h} className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="text-[16px] font-semibold mb-2" style={{ color: 'var(--text)' }}>
                {h}
              </h3>
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {b}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[14.5px] leading-relaxed max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
          Want to see a posting’s keywords without a resume? Use the{' '}
          <Link href="/tools/job-description-keyword-extractor" className="underline" style={{ color: 'var(--accent)' }}>
            job description keyword extractor
          </Link>
          . Applying on Workday or Greenhouse? The{' '}
          <Link href="/autofill" className="underline" style={{ color: 'var(--accent)' }}>
            ApplyMaster extension
          </Link>{' '}
          fills those forms from your resume.
        </p>
      </Section>

      <Section kicker="Questions" title="ATS resume checker: common questions">
        <Faqs items={FAQS} />
      </Section>
    </div>
  )
}
