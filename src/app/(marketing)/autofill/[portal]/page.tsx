import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { commonFaqs, livePortals, portalBySlug } from '@/lib/seo/portals'
import { SITE_URL, breadcrumbs, extensionSchema, faqPage } from '@/lib/seo/site'
import { Checks, Crumbs, Ctas, Faqs, JsonLd, Section, Steps } from '@/components/marketing/Landing'

export const dynamicParams = false

export function generateStaticParams() {
  return livePortals().map(p => ({ portal: p.slug }))
}

export function generateMetadata({ params }: { params: { portal: string } }): Metadata {
  const p = portalBySlug(params.portal)
  if (!p) return {}
  const title = `${p.name} Autofill: Fill ${p.name} Job Applications in One Click`
  const description = `A free Chrome extension that fills ${p.name} job applications from your resume: contact details, ${p.slug === 'workday' ? 'work history, education, ' : ''}resume upload and common questions. You review every answer and press Submit yourself.`
  const url = `${SITE_URL}/autofill/${p.slug}`
  return {
    title: { absolute: `${title} | ApplyMaster` },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article', siteName: 'ApplyMaster' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default function PortalPage({ params }: { params: { portal: string } }) {
  const p = portalBySlug(params.portal)
  if (!p) notFound()
  const faqs = commonFaqs(p)
  const others = livePortals().filter(o => o.slug !== p.slug)

  const steps = [
    { title: 'Add the extension', body: 'Install ApplyMaster from the Chrome Web Store, sign in to a free ApplyMaster account and upload your resume. That is where your answers come from.' },
    {
      title: `Open the ${p.name} application`,
      body: `Go to the job on ${p.hosts}${p.account ? ` and sign in or create the account ${p.name} asks for` : ''}. A “Fill with ApplyMaster” button appears on the form.`,
    },
    {
      title: 'Fill it, then read it',
      body: `Press the button. ApplyMaster fills what it can answer honestly and highlights drafted answers in amber so you read them first. Anything left for you is listed in its panel.${p.multiStep ? ' Each new page is filled as you reach it.' : ''}`,
    },
    {
      title: 'Submit it yourself',
      body: `You press ${p.multiStep ? 'Next and Submit' : 'Submit'} and complete any CAPTCHA. When ${p.name} confirms, the job moves to Applied in your ApplyMaster tracker, with a receipt.`,
    },
  ]

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Autofill', path: '/autofill' },
            { name: p.name, path: `/autofill/${p.slug}` },
          ]),
          faqPage(faqs),
          extensionSchema,
        ]}
      />

      <section className="pt-14 pb-12">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Crumbs items={[{ name: 'Autofill', href: '/autofill' }, { name: p.name }]} />
          <h1 className="font-display text-[clamp(2.3rem,5vw,3.5rem)] leading-[1.05] mb-5" style={{ textWrap: 'balance' }}>
            Fill <em className="font-display-italic" style={{ color: 'var(--accent)' }}>{p.name}</em> applications from your resume
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {p.what} The ApplyMaster Chrome extension fills the form for you on the employer’s own site. You check every
            answer and press {p.multiStep ? 'Next and Submit' : 'Submit'} yourself.
          </p>
          <Ctas />
          <p className="mt-4 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Free to install. Works with a free ApplyMaster account.
          </p>
        </div>
      </section>

      <Section kicker={`On ${p.name}`} title={`What ApplyMaster fills on ${p.name}`}>
        <Checks items={p.notes} />
      </Section>

      <Section kicker="How it works" title={`Applying on ${p.name} with ApplyMaster`}>
        <Steps items={steps} />
      </Section>

      <Section kicker="What it never does" title="You stay the one who applies">
        <Checks
          items={[
            'Never presses Next or Submit for you, and never solves CAPTCHAs.',
            'Never answers voluntary questions about gender, ethnicity, veteran or disability status.',
            'Never ticks boxes that agree to terms or give consent on your behalf.',
            'Never writes answers the employer asks to be in your own words.',
          ]}
        />
      </Section>

      <Section kicker="Questions" title={`${p.name} autofill: common questions`}>
        <Faqs items={faqs} />
      </Section>

      <Section kicker="Also works on" title="Other application systems">
        <ul className="flex flex-wrap gap-2.5">
          {others.map(o => (
            <li key={o.slug}>
              <Link
                href={`/autofill/${o.slug}`}
                className="inline-block rounded-full px-4 py-2 text-[14px] font-medium transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text)', background: 'var(--bg-card)' }}
              >
                {o.name} autofill
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[14px]" style={{ color: 'var(--text-muted)' }}>
          On any other job site, click the ApplyMaster button in Chrome’s toolbar and it fills what it recognises.
        </p>
        <Ctas />
      </Section>
    </div>
  )
}
