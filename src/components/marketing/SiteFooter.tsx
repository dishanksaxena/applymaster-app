import Link from 'next/link'

const COLUMNS: { heading: string; links: [string, string][] }[] = [
  {
    heading: 'Product',
    links: [
      ['Features', '/features'],
      ['Auto Apply', '/features/auto-apply'],
      ['Resume Optimizer', '/features/resume-optimizer'],
      ['Interview Coach', '/features/interview-coach'],
      ['Integrations', '/integrations'],
      ['Pricing', '/pricing'],
    ],
  },
  {
    heading: 'Resources',
    links: [
      ['Blog', '/blog'],
      ['AI Job Application Guide', '/blog/ai-job-application-guide'],
      ['ATS Resume Guide', '/blog/ats-resume-optimization'],
      ['LinkedIn Auto Apply Guide', '/blog/linkedin-auto-apply-guide'],
      ['About 3GP.AI', 'https://3gp.ai'],
    ],
  },
  {
    heading: 'Legal',
    links: [
      ['Privacy Policy', '/privacy'],
      ['Terms of Service', '/terms'],
    ],
  },
]

const SOCIAL: [string, string][] = [
  ['Twitter', 'https://twitter.com/applymaster_ai'],
  ['LinkedIn', 'https://linkedin.com/company/applymaster'],
  ['Instagram', 'https://instagram.com/applymaster.ai'],
]

export default function SiteFooter() {
  return (
    <footer className="py-14" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-[1240px] mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <span
                className="w-8 h-8 rounded-lg grid place-items-center font-bold text-[11px]"
                style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
              >
                AM
              </span>
              <span className="text-[16px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                Apply<span style={{ color: 'var(--accent)' }}>Master</span>
              </span>
            </Link>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              AI-powered job application automation.<br />
              A product by{' '}
              <a href="https://3gp.ai" className="underline underline-offset-2" style={{ color: 'var(--accent)' }}>
                3GP.AI
              </a>
            </p>
          </div>

          {COLUMNS.map(col => (
            <div key={col.heading}>
              <h2
                className="font-semibold text-[12px] uppercase tracking-wider mb-4"
                style={{ color: 'var(--text-muted)' }}
              >
                {col.heading}
              </h2>
              <div className="space-y-2.5">
                {col.links.map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    className="block text-[13px] transition-opacity hover:opacity-70"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-7"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            &copy; 2026 ApplyMaster by 3GP.AI. All rights reserved.
          </span>
          <div className="flex items-center gap-5">
            {SOCIAL.map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
