import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import ResumeChecker from '@/components/tools/ResumeChecker'
import { Crumbs, JsonLd } from '@/components/marketing/Landing'
import { SITE_URL, STORE_URL, breadcrumbs } from '@/lib/seo/site'
import { extractKeywords } from '@/lib/tools/keywords'
import { blocksToText, companyName, getBoardJobs, getJob, idFromParam, jobPath, jobPostingSchema, slugify } from '@/lib/public-jobs'

export const revalidate = 21600
export const dynamicParams = true
export function generateStaticParams() {
  return [] // rendered on first visit, then cached for six hours
}

type Params = { board: string; job: string }

async function load(params: Params) {
  const id = idFromParam(params.job)
  return id ? getJob(params.board, id) : null
}

const ago = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d < 30 ? `${d} days ago` : `${Math.floor(d / 30)} month${d >= 60 ? 's' : ''} ago`
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const job = await load(params)
  if (!job) return { title: 'Job not found', robots: { index: false } }
  const title = `${job.title} at ${job.company}${job.location ? ` (${job.location.slice(0, 40)})` : ''}`
  const lead = job.blocks.find(b => b.type === 'p' && b.text.length > 60)
  const description = `${job.company} is hiring a ${job.title}${job.location ? ` in ${job.location}` : ''}. ${lead && lead.type === 'p' ? lead.text : ''}`.slice(0, 158)
  const url = `${SITE_URL}${jobPath(params.board, job)}`
  return {
    title: { absolute: `${title} | ApplyMaster` },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', siteName: 'ApplyMaster' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function JobPage({ params }: { params: Params }) {
  const job = await load(params)
  if (!job) notFound()
  // One address per job: a changed title or a hand-typed slug lands on the canonical URL.
  const path = jobPath(params.board, job)
  if (params.job !== `${job.id}-${slugify(job.title)}`) permanentRedirect(path)

  const url = `${SITE_URL}${path}`
  const schema = jobPostingSchema(job, url)
  const text = blocksToText(job.blocks)
  const keywords = extractKeywords(text).slice(0, 14)
  const others = ((await getBoardJobs(params.board)) ?? []).filter(j => j.id !== job.id).slice(0, 8)
  const company = job.company || companyName(params.board)

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Companies', path: '/companies' },
            { name: `${company} jobs`, path: `/companies/${params.board}` },
            { name: job.title, path },
          ]),
          ...(schema ? [schema] : []),
        ]}
      />
      <section className="pt-14 pb-8">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Crumbs items={[{ name: 'Companies', href: '/companies' }, { name: `${company} jobs`, href: `/companies/${params.board}` }, { name: job.title }]} />
          <p className="text-[14px] font-semibold mb-2" style={{ color: 'var(--accent)' }}>
            {company}
          </p>
          <h1 className="font-display text-[clamp(2rem,4.4vw,3rem)] leading-[1.08] mb-4" style={{ textWrap: 'balance' }}>
            {job.title}
          </h1>
          <ul className="flex flex-wrap gap-2 text-[13.5px]">
            {job.location && (
              <li className="rounded-full px-3 py-1" style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}>
                {job.location}
              </li>
            )}
            {job.departments.slice(0, 2).map(d => (
              <li key={d} className="rounded-full px-3 py-1" style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}>
                {d}
              </li>
            ))}
            <li className="rounded-full px-3 py-1" style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}>
              Posted {ago(job.published ?? job.updated)}
            </li>
            {job.deadline && (
              <li className="rounded-full px-3 py-1" style={{ background: 'var(--yellow-dim)', color: 'var(--yellow)' }}>
                Apply by {new Date(job.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </li>
            )}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={job.url}
              target="_blank"
              rel="noopener nofollow"
              className="rounded-full bg-[var(--accent-solid)] px-7 py-3 text-sm font-semibold text-[var(--text-on-accent)] shadow-lg"
            >
              Apply on {company}’s site
            </a>
            <a href={STORE_URL} target="_blank" rel="noopener" className="rounded-full px-7 py-3 text-sm font-semibold" style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
              Fill it with ApplyMaster (free)
            </a>
          </div>
          <p className="mt-3 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {company} takes applications through {job.ats}. The free ApplyMaster extension fills that form from your resume;
            you check it and press Submit.
          </p>
        </div>
      </section>

      <section className="pb-6">
        <div className="mx-auto max-w-5xl px-6 lg:px-8 grid lg:grid-cols-[1fr_300px] gap-10">
          <article className="min-w-0">
            <h2 className="font-display text-[1.6rem] mb-4" style={{ color: 'var(--text)' }}>
              About the role
            </h2>
            <div className="space-y-4 text-[15.5px] leading-[1.75]" style={{ color: 'var(--text-secondary)' }}>
              {job.blocks.map((b, i) =>
                b.type === 'h' ? (
                  <h3 key={i} className="text-[17px] font-semibold pt-3" style={{ color: 'var(--text)' }}>
                    {b.text}
                  </h3>
                ) : b.type === 'ul' ? (
                  <ul key={i} className="list-disc pl-6 space-y-1.5">
                    {b.items.map((it, k) => (
                      <li key={k}>{it}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={i}>{b.text}</p>
                )
              )}
            </div>
            <p className="mt-6 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
              Source: {company}’s job board on {job.ats}, refreshed every few hours. If the role has closed, this page will
              disappear.
            </p>
          </article>

          <aside className="space-y-5 lg:sticky lg:top-24 self-start">
            {keywords.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  Keywords this posting leans on
                </h2>
                <p className="text-[12.5px] mb-3" style={{ color: 'var(--text-muted)' }}>
                  Use the ones that are true for you, in these words.
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {keywords.map(k => (
                    <li key={k.term} className="rounded-full px-2.5 py-0.5 text-[12.5px] font-medium" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
                      {k.term}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {others.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h2 className="text-[15px] font-semibold mb-3" style={{ color: 'var(--text)' }}>
                  More jobs at {company}
                </h2>
                <ul className="space-y-2.5">
                  {others.map(o => (
                    <li key={o.id}>
                      <Link href={jobPath(params.board, o)} className="block text-[13.5px] leading-snug hover:underline" style={{ color: 'var(--text)' }}>
                        {o.title}
                      </Link>
                      <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                        {o.location}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href={`/companies/${params.board}`} className="inline-block mt-3 text-[13px] font-semibold" style={{ color: 'var(--accent)' }}>
                  All {company} jobs →
                </Link>
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="py-12" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <h2 className="font-display text-[1.7rem] leading-tight mb-2" style={{ color: 'var(--text)' }}>
            Check your resume against this job
          </h2>
          <p className="text-[15px] mb-6 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            The posting is already filled in. Add your resume to see which of its keywords you have and which are missing.
            Free, and your resume never leaves your browser.
          </p>
          <ResumeChecker mode="resume" initialJd={`${job.title}\n${text}`} jdLabel={`${job.title} at ${company}`} />
        </div>
      </section>
    </div>
  )
}
