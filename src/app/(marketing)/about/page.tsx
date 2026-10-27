import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, STORE_URL, breadcrumbs } from '@/lib/seo/site'
import { Checks, Crumbs, JsonLd, Section } from '@/components/marketing/Landing'

const title = 'About ApplyMaster'
const description =
  'ApplyMaster helps job seekers apply faster without giving up control: it fills applications on employers’ sites, you submit them, and it keeps a receipt. Built by Dishank Saxena at 3GP.AI.'

export const metadata: Metadata = {
  title: { absolute: `${title} | ApplyMaster` },
  description,
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: { title, description, url: `${SITE_URL}/about`, type: 'website', siteName: 'ApplyMaster' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function AboutPage() {
  return (
    <div>
      <JsonLd
        data={[
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            url: `${SITE_URL}/about`,
            name: title,
            mainEntity: {
              '@type': 'Organization',
              name: 'ApplyMaster',
              url: SITE_URL,
              logo: `${SITE_URL}/logo.png`,
              email: 'support@applymaster.ai',
              founder: { '@type': 'Person', name: 'Dishank Saxena' },
              parentOrganization: { '@type': 'Organization', name: '3GP.AI', url: 'https://3gp.ai' },
              sameAs: [STORE_URL],
            },
          },
        ]}
      />
      <section className="pt-14 pb-10">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <Crumbs items={[{ name: 'Home', href: '/' }, { name: 'About' }]} />
          <h1 className="font-display text-[clamp(2.3rem,5vw,3.5rem)] leading-[1.05] mb-5">About ApplyMaster</h1>
          <div className="space-y-4 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <p>
              Applying for jobs means typing the same resume into one form after another: Workday, Greenhouse, Lever, each
              asking again for what is already on your resume. ApplyMaster exists to take that typing away without taking
              away your judgement.
            </p>
            <p>
              Our Chrome extension fills applications on the employer’s own site from your resume. You read every answer and
              press Submit yourself, and ApplyMaster keeps a receipt of what each employer received. The app around it
              matches you with jobs, tailors your resume and cover letters, helps you practise interviews, and shows you who
              in your network could refer you.
            </p>
          </div>
        </div>
      </section>

      <Section kicker="What we will not do" title="The lines we hold">
        <Checks
          items={[
            'We never press Submit for you, and we never solve CAPTCHAs.',
            'We never answer voluntary questions about gender, ethnicity, veteran or disability status.',
            'We never tick consent boxes or write answers an employer asks to be in your own words.',
            'Our free tools run in your browser: the resume you check is not uploaded.',
            'We do not sell your data or show ads.',
          ]}
        />
      </Section>

      <Section kicker="Who we are" title="Built by Dishank Saxena at 3GP.AI">
        <div className="space-y-4 text-[16px] leading-relaxed max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
          <p>
            ApplyMaster is built by Dishank Saxena and is a product of{' '}
            <a href="https://3gp.ai" className="underline" style={{ color: 'var(--accent)' }}>
              3GP.AI
            </a>
            .
          </p>
          <p>
            Questions, ideas or problems: write to{' '}
            <a href="mailto:support@applymaster.ai" className="underline" style={{ color: 'var(--accent)' }}>
              support@applymaster.ai
            </a>{' '}
            or use the{' '}
            <Link prefetch={false} href="/support" className="underline" style={{ color: 'var(--accent)' }}>
              support form
            </Link>
            .
          </p>
        </div>
      </Section>
    </div>
  )
}
