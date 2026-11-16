import { SITE_URL } from '@/lib/seo/site'

/**
 * Every blog post, in one place. The sitemap (with real lastmod dates), the
 * footer's "Latest articles", the blog index, the RSS feed, each post's
 * metadata and its generated share image all read from here, so a new post
 * is discoverable the moment it is listed. Before this existed, six posts sat
 * "unknown to Google": the sitemap carried no dates, and the only sitewide
 * links pointed at the three oldest posts.
 *
 * `modified` must only change when the post's content really changes; Google
 * stops trusting a site's lastmod once it catches it moving without reason.
 */
export type Post = {
  slug: string
  title: string
  /** Footer-length title. */
  short: string
  /** Meta description and RSS summary. */
  description: string
  /** The blog index card text. */
  excerpt: string
  category: string
  published: string
  modified: string
  readTime: string
  color: string
  /** A hand-made share image; posts without one get a generated image. */
  image?: string
}

const ALL: Post[] = [
  {
    slug: 'how-to-spot-ghost-jobs-2026',
    title: 'Ghost Jobs in 2026: How to Spot Fake Postings Before You Apply',
    short: 'Spotting ghost jobs',
    description:
      'About one in five US job postings is never filled. How common ghost jobs really are, why companies post them, seven warning signs, and how to stop wasting applications on them.',
    excerpt:
      'Roughly one in five US postings is fake or never filled. Why companies post jobs they will not fill, seven signs a listing is a ghost, and how to spend your time on roles that are real.',
    category: 'Job search',
    published: '2026-11-15T10:00:00Z',
    modified: '2026-11-15T10:00:00Z',
    readTime: '7 min read',
    color: 'var(--accent)',
  },
  {
    slug: 'how-to-pass-an-ai-job-interview-2026',
    title: 'AI Job Interviews in 2026: How to Pass One',
    short: 'Passing an AI interview',
    description:
      'More first-round interviews are run by AI in 2026. The three formats, what the research says about candidates and outcomes, and a practical way to prepare so an AI interview works in your favour.',
    excerpt:
      'Chatbots, recorded video prompts and live AI voices now run many first rounds. What the 2026 data shows — 38% of US candidates have walked away from one — and how to prepare so it works for you.',
    category: 'Interviews',
    published: '2026-11-15T12:00:00Z',
    modified: '2026-11-15T12:00:00Z',
    readTime: '8 min read',
    color: 'var(--blue)',
  },
  {
    slug: 'remote-jobs-2026-rto-mandates',
    title: 'Remote Jobs in 2026: How to Still Find One as Return-to-Office Spreads',
    short: 'Finding remote jobs in 2026',
    description:
      'Five-day office mandates are spreading at large employers in 2026. What is really happening, where remote roles still are, and how to compete for them when each one draws more applicants.',
    excerpt:
      'Big employers are mandating five office days, but hybrid is still the norm and remote-first firms keep hiring. Where remote roles still are in 2026 and how to win one against a bigger crowd.',
    category: 'Remote work',
    published: '2026-11-15T14:00:00Z',
    modified: '2026-11-15T14:00:00Z',
    readTime: '7 min read',
    color: 'var(--green)',
  },
  {
    "slug": "applying-to-nvidia-after-ceo-change",
    "title": "Should You Still Apply to NVIDIA? What the CEO Change Means for Job Seekers",
    "short": "Applying to NVIDIA now",
    "description": "Jensen Huang resigned as NVIDIA CEO on 12 November 2026 and CFO Colette Kress is interim chief executive. What a leadership change does and does not mean for hiring, and how to decide whether to apply.",
    "excerpt": "Jensen Huang resigned on 12 November and CFO Colette Kress is interim CEO. What a leadership change does and does not do to hiring, whether to apply, and the rule to use next time a company is in the headlines.",
    "category": "Job search",
    "published": "2026-11-12T20:00:00Z",
    "modified": "2026-11-12T20:00:00Z",
    "readTime": "6 min read",
    "color": "var(--green)"
  },
  {
    "slug": "h1b-100k-fee-what-it-means-2026",
    "title": "The $100,000 H-1B Fee: What It Means If You Are Job-Hunting From Abroad",
    "short": "The $100k H-1B fee",
    "description": "A $100,000 H-1B fee has upended US tech hiring for international workers, and its legal status keeps shifting. What job seekers — especially in India — should understand, and the practical moves that still work.",
    "excerpt": "A $100,000 H-1B fee upended US tech hiring for international workers, and its legal status keeps shifting. What job seekers — especially in India — should know, and the moves that still work.",
    "category": "Global job search",
    "published": "2026-11-12T16:00:00Z",
    "modified": "2026-11-12T16:00:00Z",
    "readTime": "7 min read",
    "color": "var(--green)"
  },
  {
    "slug": "ai-and-entry-level-jobs-2026",
    "title": "Is AI Taking Entry-Level Jobs? What the 2026 Data Actually Shows",
    "short": "AI and entry-level jobs",
    "description": "New-grad hiring at big tech is down sharply and surveys say AI is part of it — but the data is more contested than the headlines. What is real, what is overstated, and how a new grad still gets hired in 2026.",
    "excerpt": "New-grad hiring at big tech is down sharply and surveys blame AI — but the data is more contested than the headlines. What is real, what is overstated, and how a new grad still gets hired.",
    "category": "AI & Careers",
    "published": "2026-11-12T14:00:00Z",
    "modified": "2026-11-12T14:00:00Z",
    "readTime": "8 min read",
    "color": "var(--blue)"
  },
  {
    "slug": "tech-layoffs-what-to-do-2026",
    "title": "Laid Off in the 2026 Tech Cuts? A Calm, Practical First Two Weeks",
    "short": "After a tech layoff",
    "description": "Amazon, Meta, Microsoft and more have cut tens of thousands of roles in 2026. If you are one of them, here is a clear order of operations — severance, benefits, unemployment, and a job search that actually starts.",
    "excerpt": "Amazon, Meta, Microsoft and more cut tens of thousands of roles in 2026. If you are one of them: the order to do things in — severance, benefits, unemployment, and a job search that actually starts.",
    "category": "Job search",
    "published": "2026-11-12T12:00:00Z",
    "modified": "2026-11-12T12:00:00Z",
    "readTime": "7 min read",
    "color": "var(--accent)"
  },
  {
    "slug": "ai-job-search-2026",
    "title": "AI Job Search in 2026: What Actually Works (and What Is Hype)",
    "short": "AI job search in 2026",
    "description": "AI now sits on both sides of hiring. What AI genuinely does well for job seekers in 2026 — matching, tailoring, autofill, interview practice — what is overpromised, and a realistic weekly workflow.",
    "excerpt": "AI now reads your application before a person does — and probably helped you write it. What genuinely moves your odds in 2026, what is theatre, and a realistic weekly workflow.",
    "category": "AI & Automation",
    "published": "2026-11-12T08:00:00Z",
    "modified": "2026-11-12T08:00:00Z",
    "readTime": "8 min read",
    "color": "var(--blue)"
  },
  {
    "slug": "best-auto-apply-tools-2026",
    "title": "The Best Auto-Apply Job Tools in 2026, Honestly Compared",
    "short": "Best auto-apply tools 2026",
    "description": "Tsenta, AIApply, LoopCV, Simplify, LazyApply and ApplyMaster compared: what each one actually does, what it costs, and the questions to ask before you pay for any auto-apply tool.",
    "excerpt": "Tsenta, AIApply, LoopCV, Simplify, LazyApply and ApplyMaster side by side: what each actually does, what it costs, and the five questions to ask before paying for any of them.",
    "category": "Tools",
    "published": "2026-11-12T08:00:00Z",
    "modified": "2026-11-12T08:00:00Z",
    "readTime": "9 min read",
    "color": "var(--accent)"
  },
  {
    "slug": "ai-job-application-guide",
    "title": "The Complete Guide to AI Job Applications in 2025",
    "short": "AI Job Application Guide",
    "description": "Learn how AI job application tools automate your job search, apply to hundreds of positions, and personalize every submission. The definitive guide to automatic job applications.",
    "excerpt": "How AI is transforming the job search process. Learn how to leverage automation to apply to hundreds of relevant jobs while maintaining quality and personalization.",
    "category": "AI & Automation",
    "published": "2025-04-02T08:00:00Z",
    "modified": "2025-04-02T08:00:00Z",
    "readTime": "12 min read",
    "color": "var(--accent)",
    "image": "https://www.applymaster.ai/og/ai-job-application-guide.png"
  },
  {
    "slug": "ats-resume-optimization",
    "title": "ATS Resume Optimization: Beat the Bots & Get Interviews",
    "short": "ATS Resume Guide",
    "description": "Learn how Applicant Tracking Systems score resumes, the exact formatting rules to follow, keyword strategies that work, and how to optimize your resume to pass ATS filters every time.",
    "excerpt": "Over 98% of Fortune 500 companies use ATS. Learn the exact formatting rules, keyword strategies, and scoring techniques to get your resume past automated filters.",
    "category": "Resume",
    "published": "2025-03-28T08:00:00Z",
    "modified": "2025-03-28T08:00:00Z",
    "readTime": "15 min read",
    "color": "var(--purple)",
    "image": "https://www.applymaster.ai/og/ats-resume-optimization.png"
  },
  {
    "slug": "cover-letter-tips-2025",
    "title": "How to Write a Cover Letter That Actually Gets Read (2025)",
    "short": "Cover letter tips",
    "description": "Master the 3-paragraph cover letter formula, learn AI-assisted personalization techniques, avoid common mistakes, and use templates that hiring managers actually respond to.",
    "excerpt": "Most cover letters go unread. Here is how to write ones that hiring managers notice — with real templates, AI-assisted personalization, and the 3-paragraph formula that works.",
    "category": "Cover Letters",
    "published": "2025-03-20T08:00:00Z",
    "modified": "2025-03-20T08:00:00Z",
    "readTime": "10 min read",
    "color": "var(--blue)",
    "image": "https://www.applymaster.ai/og/cover-letter-tips-2025.png"
  },
  {
    "slug": "interview-preparation-guide",
    "title": "AI Interview Coaching: Prepare for Any Interview in 30 Minutes",
    "short": "Interview preparation",
    "description": "Learn how AI interview coaches help you prepare for behavioral, technical, and case interviews with real-time suggestions, mock practice, and personalized feedback.",
    "excerpt": "From behavioral questions to system design, learn how AI interview coaches provide real-time answer suggestions and help you practice with mock interviews tailored to your target role.",
    "category": "Interviews",
    "published": "2025-03-15T08:00:00Z",
    "modified": "2025-03-15T08:00:00Z",
    "readTime": "14 min read",
    "color": "var(--green)",
    "image": "https://www.applymaster.ai/og/interview-preparation-guide.png"
  },
  {
    "slug": "linkedin-auto-apply-guide",
    "title": "LinkedIn Auto Apply: How to Apply to 100+ Jobs Per Day Safely",
    "short": "LinkedIn Auto Apply Guide",
    "description": "A step-by-step guide to automating LinkedIn Easy Apply without getting flagged. Learn safe practices, match scoring, volume control, and how ApplyMaster handles LinkedIn applications.",
    "excerpt": "A step-by-step guide to automating LinkedIn Easy Apply without getting flagged. Includes best practices for customization, match scoring, and volume control.",
    "category": "LinkedIn",
    "published": "2025-03-08T08:00:00Z",
    "modified": "2025-03-08T08:00:00Z",
    "readTime": "11 min read",
    "color": "var(--yellow)",
    "image": "https://www.applymaster.ai/og/linkedin-auto-apply-guide.png"
  }
]

export const POSTS: Post[] = [...ALL].sort((a, b) => b.published.localeCompare(a.published))
export const postBySlug = (slug: string) => POSTS.find(p => p.slug === slug)
export const latestPosts = (n: number) => POSTS.slice(0, n)
export const postUrl = (p: Post) => `${SITE_URL}/blog/${p.slug}`
export const postImage = (p: Post) => p.image ?? `${SITE_URL}/blog/og/${p.slug}`
export const displayDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
