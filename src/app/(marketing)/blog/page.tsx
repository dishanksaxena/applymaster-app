import type { Metadata } from 'next'
import Link from 'next/link'
import { withAlpha } from '@/lib/tone'
import { POSTS, displayDate } from '@/lib/blog/posts'
import { RSS_URL } from '@/lib/blog/seo'

export const metadata: Metadata = {
  title: 'Blog — Job Search Tips, AI Career Advice & Resume Guides',
  description: 'Expert guides on AI-powered job searching, resume optimization for ATS, cover letter writing, interview preparation, and career growth strategies. Updated weekly.',
  alternates: { canonical: 'https://www.applymaster.ai/blog', types: { 'application/rss+xml': RSS_URL } },
  openGraph: {
    title: 'ApplyMaster Blog — Job Search & Career Advice',
    description: 'Expert guides on AI job searching, ATS resume optimization, and interview prep.',
    url: 'https://www.applymaster.ai/blog',
    type: 'website',
  },
}

// From the registry, so the index, sitemap, footer and feed can never disagree.
const posts = POSTS.map(p => ({ ...p, date: displayDate(p.published) }))

export default function BlogPage() {
  return (
    <main className="">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16">
          <Link href="/" className="text-sm text-[var(--accent)] hover:text-[var(--accent-solid)] font-medium mb-8 inline-block">&larr; Back to ApplyMaster</Link>
          <h1 className="font-display text-[clamp(2.3rem,5vw,3.4rem)] mb-4">Blog</h1>
          <p className="text-lg text-[var(--text-faint)] max-w-2xl">Expert guides on job search automation, resume optimization, and AI-powered career tools. Everything you need to get hired faster.</p>
        </div>

        {/* Posts grid */}
        <div className="space-y-6">
          {posts.map((post, i) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
              <article className="rounded-2xl p-8 border border-[var(--border)] hover:border-[var(--border)] transition-all duration-300" style={{ background: 'var(--bg-overlay)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: `${withAlpha(post.color, 0.11, true)}`, color: post.color }}>{post.category}</span>
                  <span className="text-xs text-[var(--text-faint)]">{post.date}</span>
                  <span className="text-xs text-[var(--text-faint)]">{post.readTime}</span>
                </div>
                <h2 className="text-xl font-bold text-ink group-hover:text-[var(--accent)] transition-colors mb-3">{post.title}</h2>
                <p className="text-[var(--text-faint)] text-sm leading-relaxed">{post.excerpt}</p>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
