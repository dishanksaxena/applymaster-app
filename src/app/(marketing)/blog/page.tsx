import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog — Job Search Tips, AI Career Advice & Resume Guides',
  description: 'Expert guides on AI-powered job searching, resume optimization for ATS, cover letter writing, interview preparation, and career growth strategies. Updated weekly.',
  alternates: { canonical: 'https://applymaster.ai/blog' },
  openGraph: {
    title: 'ApplyMaster Blog — Job Search & Career Advice',
    description: 'Expert guides on AI job searching, ATS resume optimization, and interview prep.',
    url: 'https://applymaster.ai/blog',
    type: 'website',
  },
}

const posts = [
  {
    slug: 'ai-job-application-guide',
    title: 'The Complete Guide to AI Job Applications in 2025',
    excerpt: 'How AI is transforming the job search process. Learn how to leverage automation to apply to hundreds of relevant jobs while maintaining quality and personalization.',
    category: 'AI & Automation',
    date: 'April 2, 2025',
    readTime: '12 min read',
    color: 'var(--accent)',
  },
  {
    slug: 'ats-resume-optimization',
    title: 'ATS Resume Optimization: Beat the Bots & Get Interviews',
    excerpt: 'Over 98% of Fortune 500 companies use ATS. Learn the exact formatting rules, keyword strategies, and scoring techniques to get your resume past automated filters.',
    category: 'Resume',
    date: 'March 28, 2025',
    readTime: '15 min read',
    color: 'var(--purple)',
  },
  {
    slug: 'cover-letter-tips-2025',
    title: 'How to Write a Cover Letter That Actually Gets Read (2025)',
    excerpt: 'Most cover letters go unread. Here is how to write ones that hiring managers notice — with real templates, AI-assisted personalization, and the 3-paragraph formula that works.',
    category: 'Cover Letters',
    date: 'March 20, 2025',
    readTime: '10 min read',
    color: 'var(--blue)',
  },
  {
    slug: 'interview-preparation-guide',
    title: 'AI Interview Coaching: Prepare for Any Interview in 30 Minutes',
    excerpt: 'From behavioral questions to system design, learn how AI interview coaches provide real-time answer suggestions and help you practice with mock interviews tailored to your target role.',
    category: 'Interviews',
    date: 'March 15, 2025',
    readTime: '14 min read',
    color: 'var(--green)',
  },
  {
    slug: 'linkedin-auto-apply-guide',
    title: 'LinkedIn Auto Apply: How to Apply to 100+ Jobs Per Day Safely',
    excerpt: 'A step-by-step guide to automating LinkedIn Easy Apply without getting flagged. Includes best practices for customization, match scoring, and volume control.',
    category: 'LinkedIn',
    date: 'March 8, 2025',
    readTime: '11 min read',
    color: 'var(--yellow)',
  },
]

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-ink">
      <div className="max-w-5xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-16">
          <Link href="/" className="text-sm text-[var(--accent)] hover:text-[var(--accent-solid)] font-medium mb-8 inline-block">&larr; Back to ApplyMaster</Link>
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Blog</h1>
          <p className="text-lg text-[var(--text-faint)] max-w-2xl">Expert guides on job search automation, resume optimization, and AI-powered career tools. Everything you need to get hired faster.</p>
        </div>

        {/* Posts grid */}
        <div className="space-y-6">
          {posts.map((post, i) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
              <article className="rounded-2xl p-8 border border-[var(--border)] hover:border-[var(--border)] transition-all duration-300" style={{ background: 'var(--bg-overlay)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: `${post.color}15`, color: post.color }}>{post.category}</span>
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
