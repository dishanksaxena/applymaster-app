import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Supported Job Boards & ATS Platforms | ApplyMaster',
  description:
    'Every job board and applicant tracking system ApplyMaster applies through — LinkedIn, Indeed, Greenhouse, Lever, Workday, Ashby, Naukri and 45 more. Named, not just counted.',
  alternates: { canonical: 'https://applymaster.ai/integrations' },
  openGraph: {
    title: 'Supported Job Boards & ATS Platforms | ApplyMaster',
    description:
      'Every job board and ATS ApplyMaster applies through, named in full: LinkedIn, Indeed, Greenhouse, Lever, Workday, Ashby and more.',
    url: 'https://applymaster.ai/integrations',
    siteName: 'ApplyMaster',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Supported Job Boards & ATS Platforms | ApplyMaster',
    description: 'Every job board and ATS ApplyMaster applies through, named in full.',
  },
}

/* Grouped so a visitor can find their own stack rather than counting logos.
   `auto` = ApplyMaster submits the form end to end.
   `assist` = fields are pre-filled, the user presses submit. */
type Coverage = 'auto' | 'assist'

const GROUPS: { title: string; blurb: string; items: { name: string; coverage: Coverage }[] }[] = [
  {
    title: 'Applicant tracking systems',
    blurb: 'Where the application actually lands. These are the systems employers run.',
    items: [
      { name: 'Greenhouse', coverage: 'auto' },
      { name: 'Lever', coverage: 'auto' },
      { name: 'Workday', coverage: 'auto' },
      { name: 'Ashby', coverage: 'auto' },
      { name: 'SmartRecruiters', coverage: 'auto' },
      { name: 'iCIMS', coverage: 'auto' },
      { name: 'Taleo', coverage: 'assist' },
      { name: 'BambooHR', coverage: 'auto' },
      { name: 'Workable', coverage: 'auto' },
      { name: 'JazzHR', coverage: 'auto' },
      { name: 'Recruitee', coverage: 'auto' },
      { name: 'Personio', coverage: 'auto' },
      { name: 'Teamtailor', coverage: 'auto' },
      { name: 'Breezy HR', coverage: 'auto' },
      { name: 'SuccessFactors', coverage: 'assist' },
    ],
  },
  {
    title: 'Global job boards',
    blurb: 'Aggregators we monitor continuously for roles matching your profile.',
    items: [
      { name: 'LinkedIn', coverage: 'auto' },
      { name: 'Indeed', coverage: 'auto' },
      { name: 'Glassdoor', coverage: 'auto' },
      { name: 'ZipRecruiter', coverage: 'auto' },
      { name: 'Monster', coverage: 'auto' },
      { name: 'Dice', coverage: 'auto' },
      { name: 'Wellfound', coverage: 'auto' },
      { name: 'Otta', coverage: 'assist' },
      { name: 'Built In', coverage: 'auto' },
      { name: 'Hired', coverage: 'assist' },
      { name: 'CareerBuilder', coverage: 'auto' },
      { name: 'SimplyHired', coverage: 'auto' },
    ],
  },
  {
    title: 'Regional boards',
    blurb: 'Local coverage matters more than headline counts if you are not job hunting in the US.',
    items: [
      { name: 'Naukri (India)', coverage: 'auto' },
      { name: 'Instahyre (India)', coverage: 'auto' },
      { name: 'Cutshort (India)', coverage: 'auto' },
      { name: 'SEEK (AU/NZ)', coverage: 'auto' },
      { name: 'Reed (UK)', coverage: 'auto' },
      { name: 'Totaljobs (UK)', coverage: 'auto' },
      { name: 'CV-Library (UK)', coverage: 'auto' },
      { name: 'StepStone (DE)', coverage: 'auto' },
      { name: 'Xing (DE)', coverage: 'assist' },
      { name: 'Welcome to the Jungle (FR)', coverage: 'auto' },
      { name: 'Jobstreet (SEA)', coverage: 'auto' },
      { name: 'Bayt (MENA)', coverage: 'assist' },
    ],
  },
  {
    title: 'Remote-first boards',
    blurb: 'Filtered to genuinely remote roles, with ghost postings removed.',
    items: [
      { name: 'We Work Remotely', coverage: 'auto' },
      { name: 'RemoteOK', coverage: 'auto' },
      { name: 'Remotive', coverage: 'auto' },
      { name: 'FlexJobs', coverage: 'assist' },
      { name: 'JustRemote', coverage: 'auto' },
      { name: 'Working Nomads', coverage: 'auto' },
      { name: 'Remote.co', coverage: 'auto' },
      { name: 'Himalayas', coverage: 'auto' },
    ],
  },
]

const TOTAL = GROUPS.reduce((n, g) => n + g.items.length, 0)
const AUTO = GROUPS.reduce((n, g) => n + g.items.filter(i => i.coverage === 'auto').length, 0)

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Supported Job Boards & ATS Platforms',
  url: 'https://applymaster.ai/integrations',
  description: `ApplyMaster applies through ${TOTAL} job boards and applicant tracking systems.`,
}

export default function IntegrationsPage() {
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="pt-16 pb-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Link
            href="/features"
            className="text-sm mb-6 inline-block"
            style={{ color: 'var(--accent)' }}
          >
            &larr; Back to features
          </Link>

          <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] mb-5">
            Every platform we apply through, <em className="font-display-italic" style={{ color: 'var(--accent)' }}>named</em>.
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Most tools quote a number and leave it there. Here is the actual list, grouped so you can
            check the systems you are applying into &mdash; and honest about which ones we submit
            end to end versus pre-fill for you.
          </p>

          <div className="mt-10 flex flex-wrap gap-8">
            {[
              { v: String(TOTAL), l: 'Platforms supported' },
              { v: String(AUTO), l: 'Fully automated' },
              { v: '4', l: 'Regions covered' },
            ].map(s => (
              <div key={s.l}>
                <div className="font-display text-[32px]" style={{ color: 'var(--accent)' }}>{s.v}</div>
                <div className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-10 flex flex-wrap items-center gap-5 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="inline-flex items-center gap-2 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />
              <strong style={{ color: 'var(--text)' }}>Automated</strong> &mdash; we complete and submit the application
            </span>
            <span className="inline-flex items-center gap-2 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--yellow)' }} />
              <strong style={{ color: 'var(--text)' }}>Assisted</strong> &mdash; we pre-fill everything, you press submit
            </span>
          </div>
        </div>
      </section>

      {/* Groups */}
      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8 space-y-14">
          {GROUPS.map(group => (
            <div key={group.title}>
              <h2 className="font-display text-[26px] mb-1.5">{group.title}</h2>
              <p className="text-[14px] mb-6" style={{ color: 'var(--text-muted)' }}>{group.blurb}</p>

              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {group.items.map(item => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <span className="text-[14px] font-medium truncate" style={{ color: 'var(--text)' }}>
                      {item.name}
                    </span>
                    <span
                      className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={
                        item.coverage === 'auto'
                          ? { background: 'var(--green-dim)', color: 'var(--green)' }
                          : { background: 'var(--yellow-dim)', color: 'var(--yellow)' }
                      }
                    >
                      {item.coverage === 'auto' ? 'Auto' : 'Assist'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <p className="text-[13.5px] pt-4" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
            Company career pages built on any of the ATS platforms above are covered automatically,
            which is how the reachable total exceeds this list. New integrations ship most weeks &mdash;
            if something you need is missing, tell us and we will prioritise it.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div
            className="rounded-3xl py-14 px-8 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
          >
            <h2 className="font-display text-[clamp(1.9rem,4vw,2.6rem)] mb-4">
              Start applying across all of them
            </h2>
            <p className="max-w-lg mx-auto mb-8 text-[15.5px]" style={{ color: 'var(--text-secondary)' }}>
              One profile. Every platform. Free forever plan, no card required.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-full font-semibold"
              style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)', boxShadow: 'var(--shadow-accent)' }}
            >
              Start free
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
