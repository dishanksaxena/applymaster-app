import type { Metadata } from 'next'
import Link from 'next/link'
import { withAlpha } from '@/lib/tone'

export const metadata: Metadata = {
  title: 'Blog — Job Search Tips, AI Career Advice & Resume Guides',
  description: 'Expert guides on AI-powered job searching, resume optimization for ATS, cover letter writing, interview preparation, and career growth strategies. Updated weekly.',
  alternates: { canonical: 'https://www.applymaster.ai/blog' },
  openGraph: {
    title: 'ApplyMaster Blog — Job Search & Career Advice',
    description: 'Expert guides on AI job searching, ATS resume optimization, and interview prep.',
    url: 'https://www.applymaster.ai/blog',
    type: 'website',
  },
}

const posts = [
  {
    slug: 'tech-layoffs-what-to-do-2026',
    title: 'Laid Off in the 2026 Tech Cuts? A Calm, Practical First Two Weeks',
    excerpt: 'Amazon, Meta, Microsoft and more cut tens of thousands of roles in 2026. If you are one of them: the order to do things in — severance, benefits, unemployment, and a job search that actually starts.',
    category: 'Job search',
    date: 'November 12, 2026',
    readTime: '7 min read',
    color: 'var(--accent)',
  },
  {
    slug: 'ai-and-entry-level-jobs-2026',
    title: 'Is AI Taking Entry-Level Jobs? What the 2026 Data Actually Shows',
    excerpt: 'New-grad hiring at big tech is down sharply and surveys blame AI — but the data is more contested than the headlines. What is real, what is overstated, and how a new grad still gets hired.',
    category: 'AI & Careers',
    date: 'November 12, 2026',
    readTime: '8 min read',
    color: 'var(--blue)',
  },
  {
    slug: 'h1b-100k-fee-what-it-means-2026',
    title: 'The $100,000 H-1B Fee: What It Means If You Are Job-Hunting From Abroad',
    excerpt: 'A $100,000 H-1B fee upended US tech hiring for international workers, and its legal status keeps shifting. What job seekers — especially in India — should know, and the moves that still work.',
    category: 'Global job search',
    date: 'November 12, 2026',
    readTime: '7 min read',
    color: 'var(--green)',
  },
  {
    slug: 'applying-to-nvidia-after-ceo-change',
    title: 'Should You Still Apply to NVIDIA? What the CEO Change Means for Job Seekers',
    excerpt: 'Jensen Huang resigned on 12 November and CFO Colette Kress is interim CEO. What a leadership change does and does not do to hiring, whether to apply, and the rule to use next time a company is in the headlines.',
    category: 'Job search',
    date: 'November 12, 2026',
    readTime: '6 min read',
    color: 'var(--green)',
  },
  {
    slug: 'best-auto-apply-tools-2026',
    title: 'The Best Auto-Apply Job Tools in 2026, Honestly Compared',
    excerpt: 'Tsenta, AIApply, LoopCV, Simplify, LazyApply and ApplyMaster side by side: what each actually does, what it costs, and the five questions to ask before paying for any of them.',
    category: 'Tools',
    date: 'November 12, 2026',
    readTime: '9 min read',
    color: 'var(--accent)',
  },
  {
    slug: 'ai-job-search-2026',
    title: 'AI Job Search in 2026: What Actually Works (and What Is Hype)',
    excerpt: 'AI now reads your application before a person does — and probably helped you write it. What genuinely moves your odds in 2026, what is theatre, and a realistic weekly workflow.',
    category: 'AI & Automation',
    date: 'November 12, 2026',
    readTime: '8 min read',
    color: 'var(--blue)',
  },
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
