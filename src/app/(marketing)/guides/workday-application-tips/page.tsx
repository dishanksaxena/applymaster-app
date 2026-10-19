import type { Metadata } from 'next'
import Link from 'next/link'
import { Guide, H2, type GuideMeta } from '@/components/marketing/Guide'
import { SITE_URL, faqPage } from '@/lib/seo/site'
import { Faqs } from '@/components/marketing/Landing'

const meta: GuideMeta = {
  slug: 'workday-application-tips',
  title: 'How to Apply on Workday Faster: What Each Page Asks, and 9 Tips',
  description:
    'Workday applications are slow because every employer needs its own account and asks for your work history again. What each page asks, what you can skip, and how to finish in minutes.',
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
    q: 'Why do I need a new Workday account for every company?',
    a: 'Each employer runs its own Workday site, so an account you made for one company does not carry over to another. Using the same email address and a password manager makes this painless.',
  },
  {
    q: 'Do I have to answer the voluntary disclosure questions?',
    a: 'No. Gender, ethnicity, veteran and disability questions are voluntary, and they include an option such as “I do not wish to answer”. Employers in the US ask so they can report on hiring; your answer is not supposed to affect your application.',
  },
  {
    q: 'Why is my work history wrong after I upload my resume?',
    a: 'Workday reads your resume automatically and often splits jobs, misses dates or puts text in the wrong field. Always check My Experience entry by entry before continuing.',
  },
  {
    q: 'Can I save a Workday application and finish later?',
    a: 'Workday keeps your progress as you press Save and Continue, inside your account with that employer, so you can sign back in and pick up where you stopped.',
  },
  {
    q: 'Is there an autofill for Workday?',
    a: 'Yes. The free ApplyMaster Chrome extension fills My Information and My Experience from your resume, including each job and school, and answers common questions from your profile. You review each page and press Save and Continue yourself.',
  },
]

export default function WorkdayGuide() {
  return (
    <Guide meta={meta} extraSchema={[faqPage(FAQS)]}>
      <p>
        If an application has ever asked you to create an account, upload your resume, and then type that same resume into
        a form, it was probably Workday. It is the applicant tracking system behind the careers sites of many large
        employers, and it is slow for three reasons:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong style={{ color: 'var(--text)' }}>Every employer is a separate account.</strong> Your login for one company
          does not work at the next.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>It runs over several pages,</strong> each with its own Save and Continue.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>It re-asks your history.</strong> Workday reads your resume, but the
          result usually needs correcting job by job.
        </li>
      </ul>

      <H2 id="pages">What each Workday page asks</H2>
      <p>Employers customise their forms, but most Workday applications follow this order:</p>
      <ol className="list-decimal pl-6 space-y-3">
        <li>
          <strong style={{ color: 'var(--text)' }}>Create account or sign in.</strong> An email and password for this
          employer’s Workday site, and usually an email verification.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>My Information.</strong> Your name, address, phone and phone type, and
          “How did you hear about us?”.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>My Experience.</strong> Work history, education, skills, websites and
          your resume upload. This is the slow page.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Application Questions.</strong> The employer’s own questions: work
          authorisation, visa sponsorship, notice period, relocation, salary expectations.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Voluntary Disclosures.</strong> Gender, ethnicity and veteran status,
          each with an option not to answer.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Self Identify.</strong> In the US, usually the government’s voluntary
          disability self-identification form.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Review.</strong> Everything on one page before you submit.
        </li>
      </ol>

      <H2 id="tips">9 ways to get through it faster</H2>
      <ol className="list-decimal pl-6 space-y-3">
        <li>
          <strong style={{ color: 'var(--text)' }}>Use one email and a password manager.</strong> You will make many Workday
          accounts; the same email and a saved password for each employer means no lockouts.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Keep a plain-text copy of your resume</strong> with every job’s title,
          company and month-and-year dates on their own lines. It is quick to copy from and easy to check against.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Upload your resume first, then check every entry.</strong> Workday’s
          reading of your resume is a draft. Fix titles, dates and descriptions before moving on.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Have your standard answers ready:</strong> work authorisation,
          sponsorship, earliest start date, salary expectation, willingness to relocate. They come up on almost every
          application.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Answer “How did you hear about us?” consistently</strong>, usually with
          the job board or the company’s careers site where you found the role.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Remember the voluntary pages are voluntary.</strong> Choose the “do not
          wish to answer” option if you prefer.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Save as you go.</strong> Your progress lives in your account with that
          employer, so a closed tab is not lost work.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Match the posting’s keywords before you apply.</strong> Recruiters search
          Workday for the posting’s terms. Our{' '}
          <Link href="/tools/ats-resume-checker" className="underline" style={{ color: 'var(--accent)' }}>
            free ATS resume checker
          </Link>{' '}
          shows which you are missing.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Let an autofill do the typing.</strong> The{' '}
          <Link href="/autofill/workday" className="underline" style={{ color: 'var(--accent)' }}>
            ApplyMaster extension for Workday
          </Link>{' '}
          fills My Information and every job and school in My Experience from your resume, and fills each new page as you
          press Save and Continue. You still review every answer and submit yourself.
        </li>
      </ol>

      <H2 id="faq">Common questions</H2>
      <Faqs items={FAQS} />
    </Guide>
  )
}
