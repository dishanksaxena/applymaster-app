import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, breadcrumbs } from '@/lib/seo/site'
import { Crumbs, JsonLd } from '@/components/marketing/Landing'

const title = 'Free Job Search Tools'
const description = 'Free tools for job seekers from ApplyMaster: an ATS resume checker and a job description keyword extractor. No sign-up, and nothing leaves your browser.'

export const metadata: Metadata = {
  title: { absolute: `${title} | ApplyMaster` },
  description,
  alternates: { canonical: `${SITE_URL}/tools` },
  openGraph: { title, description, url: `${SITE_URL}/tools`, type: 'website', siteName: 'ApplyMaster' },
  twitter: { card: 'summary_large_image', title, description },
}

const TOOLS = [
  {
    href: '/tools/ats-resume-checker',
    name: 'ATS resume checker',
    body: 'Match your resume to a job description: which keywords you have, which are missing, and the basics recruiters look for.',
  },
  {
    href: '/tools/job-description-keyword-extractor',
    name: 'Job description keyword extractor',
    body: 'Pull the skills, tools and phrases out of any job posting, ranked by how much they matter.',
  },
  {
    href: '/autofill',
    name: 'Job application autofill (Chrome)',
    body: 'Fill Workday, Greenhouse, Lever and other application forms from your resume. You check and submit.',
  },
]

export default function ToolsHub() {
  return (
    <div>
      <JsonLd
        data={breadcrumbs([
          { name: 'Home', path: '/' },
          { name: 'Free tools', path: '/tools' },
        ])}
      />
      <section className="pt-14 pb-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Crumbs items={[{ name: 'Home', href: '/' }, { name: 'Free tools' }]} />
          <h1 className="font-display text-[clamp(2.3rem,5vw,3.5rem)] leading-[1.05] mb-4" style={{ textWrap: 'balance' }}>
            Free tools for your job search
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed mb-10" style={{ color: 'var(--text-secondary)' }}>
            No sign-up and no limits. The checkers run in your browser, so your resume stays with you.
          </p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map(t => (
              <li key={t.href}>
                <Link prefetch={false} href={t.href} className="block h-full rounded-2xl p-5 transition-transform hover:-translate-y-0.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <h2 className="text-[17px] font-semibold" style={{ color: 'var(--text)' }}>
                    {t.name}
                  </h2>
                  <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {t.body}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
