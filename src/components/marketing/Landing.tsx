import Link from 'next/link'
import { STORE_URL } from '@/lib/seo/site'

/* Building blocks for the search landing pages (/autofill, /compare).
   Server components, styled with the same tokens as the rest of the site. */

export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}

export function Crumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[13px] mb-6">
      <ol className="flex flex-wrap items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
        {items.map((it, i) => (
          <li key={it.name} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {it.href ? (
              <Link href={it.href} className="hover:underline" style={{ color: 'var(--accent)' }}>
                {it.name}
              </Link>
            ) : (
              <span aria-current="page">{it.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function Ctas({ extension = true }: { extension?: boolean }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {extension && (
        <a
          href={STORE_URL}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-solid)] px-7 py-3 text-sm font-semibold text-[var(--text-on-accent)] shadow-lg transition-transform hover:-translate-y-0.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3.5" />
            <path d="M12 8.5h8.2M8.9 13.8 4.8 6.7M15.1 13.8 11 20.9" />
          </svg>
          Add to Chrome, free
        </a>
      )}
      <Link
        href="/signup"
        className="rounded-full px-7 py-3 text-sm font-semibold transition-colors"
        style={extension ? { border: '1px solid var(--border-strong, var(--border))', color: 'var(--text)' } : { background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
      >
        Create a free account
      </Link>
    </div>
  )
}

export function Section({ title, kicker, children, id }: { title: string; kicker?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="py-12" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        {kicker && (
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--accent)' }}>
            {kicker}
          </p>
        )}
        <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] leading-tight mb-6" style={{ textWrap: 'balance' }}>
          {title}
        </h2>
        {children}
      </div>
    </section>
  )
}

export function Faqs({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      {items.map(f => (
        <details key={f.q} className="group px-5 py-4" style={{ borderColor: 'var(--border)' }}>
          <summary className="cursor-pointer list-none flex items-start justify-between gap-4 text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
            {f.q}
            <span className="mt-0.5 shrink-0 transition-transform group-open:rotate-45 text-[18px] leading-none" style={{ color: 'var(--accent)' }} aria-hidden="true">
              +
            </span>
          </summary>
          <p className="mt-3 text-[14.5px] leading-relaxed max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
            {f.a}
          </p>
        </details>
      ))}
    </div>
  )
}

export function Checks({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3">
      {items.map(t => (
        <li key={t} className="flex gap-3 text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <svg className="mt-1 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.6" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

export function Steps({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ol className="grid md:grid-cols-2 gap-4">
      {items.map((s, i) => (
        <li key={s.title} className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-2">
            <span
              className="w-7 h-7 rounded-full grid place-items-center text-[13px] font-bold tabular-nums"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
            >
              {i + 1}
            </span>
            <h3 className="text-[15.5px] font-semibold" style={{ color: 'var(--text)' }}>
              {s.title}
            </h3>
          </div>
          <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {s.body}
          </p>
        </li>
      ))}
    </ol>
  )
}
