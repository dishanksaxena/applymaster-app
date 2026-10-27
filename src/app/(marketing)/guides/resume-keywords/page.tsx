import type { Metadata } from 'next'
import Link from 'next/link'
import { Guide, H2, type GuideMeta } from '@/components/marketing/Guide'
import { SITE_URL, faqPage } from '@/lib/seo/site'
import { Faqs } from '@/components/marketing/Landing'

const meta: GuideMeta = {
  slug: 'resume-keywords',
  title: 'How to Find the Keywords in a Job Description and Use Them on Your Resume',
  description:
    'Which words in a job posting matter, where to put them on your resume so recruiters and applicant tracking systems find you, and the keyword mistakes that backfire.',
  published: '2026-10-18',
}

export const metadata: Metadata = {
  title: { absolute: `${meta.title} | ApplyMaster` },
  description: meta.description,
  alternates: { canonical: `${SITE_URL}/guides/${meta.slug}` },
  openGraph: { title: meta.title, description: meta.description, url: `${SITE_URL}/guides/${meta.slug}`, type: 'article', siteName: 'ApplyMaster' },
  twitter: { card: 'summary_large_image', title: meta.title, description: meta.description },
}

const FAQS = [
  {
    q: 'How many keywords should a resume have?',
    a: 'There is no magic number. Cover the skills and tools in the posting’s requirements that are true for you, using the posting’s wording, and stop there.',
  },
  {
    q: 'Do applicant tracking systems reject resumes without the right keywords?',
    a: 'Some employers set up automatic screening questions or filters, but much of the time keywords matter because recruiters search the ATS for them. Either way, a resume that uses the posting’s terms is easier to find.',
  },
  {
    q: 'Should I hide keywords in white text?',
    a: 'No. Most ATS show recruiters the plain text of your resume, so hidden keywords appear in full and look like an attempt to game the system.',
  },
]

export default function ResumeKeywordsGuide() {
  return (
    <Guide meta={meta} extraSchema={[faqPage(FAQS)]}>
      <p>
        Recruiters rarely read every application in full. They search their applicant tracking system for the words in
        the job description and read the resumes that come up. So the words you use matter: “managed partner
        relationships” and “stakeholder management” can describe the same work, but only one matches the search.
      </p>

      <H2 id="find">Finding the keywords that matter</H2>
      <ol className="list-decimal pl-6 space-y-3">
        <li>
          <strong style={{ color: 'var(--text)' }}>Start with the requirements section.</strong> “Requirements”, “What you
          will need” or “Minimum qualifications” lists what the employer screens for. “Nice to have” matters less.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Copy skills and tools exactly as written.</strong> If the posting says
          PostgreSQL, write PostgreSQL rather than “databases”; if it says Salesforce, name Salesforce.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Note what repeats.</strong> A phrase the posting uses three times, like
          “payment systems” or “enterprise customers”, is what the team cares about.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Catch credentials and acronyms</strong> such as CPA, PMP, SOC 2 or
          HIPAA, and write both forms where natural (“Project Management Professional (PMP)”).
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Use the job title.</strong> Recruiters often search by title, so if the
          role fits your experience, use its title in your headline or summary.
        </li>
      </ol>
      <p>
        Our{' '}
        <Link prefetch={false} href="/tools/job-description-keyword-extractor" className="underline" style={{ color: 'var(--accent)' }}>
          job description keyword extractor
        </Link>{' '}
        does this in seconds: paste a posting and it ranks the skills, tools and phrases, marking the ones in its
        requirements.
      </p>

      <H2 id="use">Putting them on your resume</H2>
      <ul className="list-disc pl-6 space-y-3">
        <li>
          <strong style={{ color: 'var(--text)' }}>In your experience bullets, with a result.</strong> “Built payment APIs
          in Go and PostgreSQL, cutting checkout errors 30%” proves the skill; a word in a list only claims it.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>In a short skills section,</strong> grouped (languages, tools,
          certifications), for the terms you cannot fit naturally elsewhere.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>In your summary,</strong> two or three of the most important terms,
          including the job title.
        </li>
      </ul>

      <H2 id="mistakes">Mistakes that backfire</H2>
      <ul className="list-disc pl-6 space-y-3">
        <li>
          <strong style={{ color: 'var(--text)' }}>Listing skills you do not have.</strong> It gets you interviews you cannot
          pass. Leave them out, or say you are learning them.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Hidden or repeated keywords.</strong> White text and keyword blocks show up
          in the plain-text view recruiters see.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Images and complex layouts.</strong> Text inside images, tables or text
          boxes can be lost when an ATS reads your file. If a tool cannot read your PDF, an ATS may not either.
        </li>
      </ul>

      <H2 id="check">Check before you apply</H2>
      <p>
        Paste your resume and the posting into the{' '}
        <Link prefetch={false} href="/tools/ats-resume-checker" className="underline" style={{ color: 'var(--accent)' }}>
          free ATS resume checker
        </Link>{' '}
        to see your keyword match and what is missing. It runs in your browser, so your resume is not uploaded anywhere.
      </p>

      <H2 id="faq">Common questions</H2>
      <Faqs items={FAQS} />
    </Guide>
  )
}
