import type { Metadata } from 'next'
import Link from 'next/link'

const title = 'The Complete Guide to AI Job Applications in 2025'
const description =
  'Learn how AI job application tools automate your job search, apply to hundreds of positions, and personalize every submission. The definitive guide to automatic job applications.'
const url = 'https://applymaster.ai/blog/ai-job-application-guide'

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    'AI job application',
    'automatic job application',
    'AI apply to jobs',
    'job application automation',
    'automated job search',
    'AI job search tool',
    'auto apply jobs',
    'job application bot',
  ],
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    type: 'article',
    publishedTime: '2025-04-02T08:00:00Z',
    modifiedTime: '2025-04-02T08:00:00Z',
    authors: ['ApplyMaster Team'],
    images: [
      {
        url: 'https://applymaster.ai/og/ai-job-application-guide.png',
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['https://applymaster.ai/og/ai-job-application-guide.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  image: 'https://applymaster.ai/og/ai-job-application-guide.png',
  author: { '@type': 'Organization', name: 'ApplyMaster', url: 'https://applymaster.ai' },
  publisher: {
    '@type': 'Organization',
    name: 'ApplyMaster',
    logo: { '@type': 'ImageObject', url: 'https://applymaster.ai/logo.png' },
  },
  datePublished: '2025-04-02T08:00:00Z',
  dateModified: '2025-04-02T08:00:00Z',
  mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  keywords: 'AI job application, automatic job application, AI apply to jobs, job application automation',
}

export default function AIJobApplicationGuidePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-[#0a0a12] text-white">
        <article className="max-w-3xl mx-auto px-6 py-24">
          {/* Navigation */}
          <Link
            href="/blog"
            className="text-sm text-[#fd79a8] hover:text-[#e84393] font-medium mb-8 inline-block"
          >
            &larr; Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#fd79a8]/10 text-[#fd79a8]">
                AI &amp; Automation
              </span>
              <time className="text-xs text-[#4a4a6a]" dateTime="2025-04-02">
                April 2, 2025
              </time>
              <span className="text-xs text-[#4a4a6a]">12 min read</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent leading-tight">
              {title}
            </h1>
            <p className="text-lg text-[#8a8aaa] leading-relaxed">
              The average job seeker spends 11 hours per week filling out applications. AI job
              application tools promise to cut that to minutes. But how do they actually work, and
              which approach delivers results without getting you blacklisted? This guide covers
              everything.
            </p>
          </header>

          {/* Table of Contents */}
          <nav className="mb-12 p-6 rounded-xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-[#fd79a8] uppercase tracking-wider mb-4">
              Table of Contents
            </h2>
            <ol className="space-y-2 text-sm text-[#8a8aaa]">
              <li>1. What Are AI Job Applications?</li>
              <li>2. How AI Job Application Tools Work</li>
              <li>3. Types of Automation: From Basic to Intelligent</li>
              <li>4. Key Benefits of AI-Powered Applications</li>
              <li>5. The Risks of Bad Automation</li>
              <li>6. Comparing Popular AI Application Tools</li>
              <li>7. How ApplyMaster Approaches AI Applications</li>
              <li>8. Step-by-Step: Your First AI-Powered Job Search</li>
              <li>9. Optimizing Your Profile for AI Applications</li>
              <li>10. Measuring Success and Iterating</li>
              <li>11. The Future of AI in Job Searching</li>
              <li>12. Frequently Asked Questions</li>
            </ol>
          </nav>

          {/* Content */}
          <div className="prose-custom space-y-10">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                1. What Are AI Job Applications?
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                AI job applications use artificial intelligence to automate parts or all of the job
                application process. Instead of manually searching job boards, copying your
                information into forms, and tailoring each cover letter by hand, an AI system handles
                these repetitive tasks on your behalf.
              </p>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                At their most basic, these tools auto-fill application forms with your saved data.
                At their most advanced, they analyze job descriptions, match them against your
                skills, customize your resume for each position, generate tailored cover letters,
                and submit applications across multiple platforms simultaneously.
              </p>
              <p className="text-[#b0b0c8] leading-relaxed">
                The key distinction is between <strong className="text-white">dumb automation</strong>{' '}
                (spray-and-pray bots that submit identical applications everywhere) and{' '}
                <strong className="text-white">intelligent automation</strong> (systems that use AI to
                personalize each submission based on the specific role). The difference in results is
                enormous.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                2. How AI Job Application Tools Work
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Modern AI application platforms follow a multi-step pipeline that mirrors what a
                skilled recruiter would do, but at scale. Here is the typical workflow:
              </p>
              <ul className="space-y-3 text-[#b0b0c8]">
                <li className="flex gap-3">
                  <span className="text-[#fd79a8] font-bold">1.</span>
                  <span>
                    <strong className="text-white">Profile Ingestion</strong> &mdash; You upload your
                    resume, LinkedIn profile, or fill out a structured profile. The AI parses your
                    experience, skills, education, and preferences into a structured data model.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#fd79a8] font-bold">2.</span>
                  <span>
                    <strong className="text-white">Job Discovery</strong> &mdash; The platform
                    aggregates listings from job boards like LinkedIn, Indeed, Glassdoor, and company
                    career pages. It filters based on your criteria: title, location, salary range,
                    company size, and industry.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#fd79a8] font-bold">3.</span>
                  <span>
                    <strong className="text-white">Match Scoring</strong> &mdash; Each job is scored
                    against your profile using NLP and semantic matching. This goes beyond keyword
                    matching to understand that &quot;React developer&quot; and &quot;front-end
                    engineer with React experience&quot; are equivalent.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#fd79a8] font-bold">4.</span>
                  <span>
                    <strong className="text-white">Resume Tailoring</strong> &mdash; For high-match
                    positions, the AI reorders your bullet points, adjusts keywords, and emphasizes
                    relevant experience to maximize{' '}
                    <Link href="/blog/ats-resume-optimization" className="text-[#fd79a8] hover:underline">
                      ATS compatibility
                    </Link>
                    .
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#fd79a8] font-bold">5.</span>
                  <span>
                    <strong className="text-white">Cover Letter Generation</strong> &mdash; A
                    personalized{' '}
                    <Link href="/blog/cover-letter-tips-2025" className="text-[#fd79a8] hover:underline">
                      cover letter
                    </Link>{' '}
                    is drafted that connects your specific experience to the job requirements.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#fd79a8] font-bold">6.</span>
                  <span>
                    <strong className="text-white">Submission</strong> &mdash; The application is
                    submitted through the appropriate channel, whether that is a direct ATS upload, a
                    LinkedIn Easy Apply, or a company careers page.
                  </span>
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                3. Types of Automation: From Basic to Intelligent
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Not all automation is created equal. Understanding the spectrum helps you choose the
                right tool.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">Browser Extension Auto-Fillers</h3>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                The simplest category. These extensions detect application forms and pre-fill fields
                with your saved information. You still find jobs manually and click submit yourself.
                They save time on data entry but do not help with discovery, tailoring, or scale.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">Script-Based Bots</h3>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                These are automated scripts (often Selenium or Puppeteer-based) that navigate job
                boards and click apply buttons in a loop. They are fast but crude. They submit
                identical resumes to every job, ignore match quality, and frequently trigger
                anti-bot detection. Using these on LinkedIn can result in account restrictions.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">AI-Powered Platforms</h3>
              <p className="text-[#b0b0c8] leading-relaxed">
                The newest generation uses large language models and machine learning to make
                intelligent decisions at each step. They assess job fit, customize materials, pace
                submissions to avoid detection, and learn from your feedback. This is where
                ApplyMaster operates.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                4. Key Benefits of AI-Powered Applications
              </h2>
              <ul className="space-y-4 text-[#b0b0c8]">
                <li>
                  <strong className="text-white">Volume without sacrificing quality.</strong> The
                  biggest advantage is applying to 50+ relevant positions per day while each
                  application is customized. Manually, most people manage 3-5 quality applications
                  daily.
                </li>
                <li>
                  <strong className="text-white">Broader discovery.</strong> AI tools scan across
                  platforms you might not check manually. They surface roles on niche job boards,
                  company career pages, and aggregators you would never find through a standard
                  LinkedIn search.
                </li>
                <li>
                  <strong className="text-white">Consistent optimization.</strong> Every resume is
                  ATS-optimized. Every cover letter follows proven structures. There is no quality
                  drop-off at application number 30 because you are tired.
                </li>
                <li>
                  <strong className="text-white">Data-driven iteration.</strong> AI platforms track
                  which versions of your resume get callbacks, which job types respond, and which
                  keywords correlate with interviews. This feedback loop improves results over time.
                </li>
                <li>
                  <strong className="text-white">Time reclaimed.</strong> Hours previously spent on
                  repetitive form-filling can be redirected to networking, skill-building, and{' '}
                  <Link href="/blog/interview-preparation-guide" className="text-[#fd79a8] hover:underline">
                    interview preparation
                  </Link>
                  .
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                5. The Risks of Bad Automation
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Automation done poorly can hurt your job search more than help it. Here are the
                major pitfalls:
              </p>
              <ul className="space-y-3 text-[#b0b0c8]">
                <li>
                  <strong className="text-white">Account bans.</strong> LinkedIn and other platforms
                  actively detect bot behavior. Aggressive automation can lead to temporary or
                  permanent account restrictions.
                </li>
                <li>
                  <strong className="text-white">Reputation damage.</strong> Applying to hundreds of
                  irrelevant positions at the same company signals desperation, not enthusiasm.
                  Recruiters talk, and a pattern of untargeted mass applications can follow you.
                </li>
                <li>
                  <strong className="text-white">Generic applications.</strong> If your automation
                  does not personalize, hiring managers can tell. A generic cover letter is often
                  worse than no cover letter at all.
                </li>
                <li>
                  <strong className="text-white">False confidence.</strong> Seeing &quot;200
                  applications sent&quot; feels productive, but if zero were well-matched, you have
                  wasted time and created noise for recruiters.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                6. Comparing Popular AI Application Tools
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                The market has exploded with options. When evaluating tools, consider these
                criteria:
              </p>
              <ul className="space-y-3 text-[#b0b0c8]">
                <li>
                  <strong className="text-white">Match quality scoring</strong> &mdash; Does the
                  tool assess how well you fit each role before applying, or does it blast
                  applications indiscriminately?
                </li>
                <li>
                  <strong className="text-white">Resume customization</strong> &mdash; Does it
                  tailor your resume for each position, or submit the same document everywhere?
                </li>
                <li>
                  <strong className="text-white">Cover letter generation</strong> &mdash; Are cover
                  letters truly personalized using the job description, or are they template
                  fill-ins?
                </li>
                <li>
                  <strong className="text-white">Platform safety</strong> &mdash; Does it use
                  rate-limiting, human-like delays, and API access (where available) to avoid
                  triggering bot detection?
                </li>
                <li>
                  <strong className="text-white">Analytics and feedback</strong> &mdash; Can you see
                  which applications get responses and iterate on your approach?
                </li>
                <li>
                  <strong className="text-white">Multi-platform support</strong> &mdash; Does it
                  work across LinkedIn, Indeed, Glassdoor, and direct company sites, or is it limited
                  to one platform?
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                7. How ApplyMaster Approaches AI Applications
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                ApplyMaster was built to solve the problems we saw with existing tools. Here is what
                makes the approach different:
              </p>
              <ul className="space-y-3 text-[#b0b0c8]">
                <li>
                  <strong className="text-white">Quality-first matching.</strong> Every job is scored
                  against your profile with a transparent match percentage. You set a minimum
                  threshold, and only jobs above it receive applications.
                </li>
                <li>
                  <strong className="text-white">Per-application customization.</strong> Your resume
                  is intelligently restructured for each position. Keywords are aligned, relevant
                  experience is promoted, and formatting is optimized for the specific ATS the
                  company uses.
                </li>
                <li>
                  <strong className="text-white">Human-in-the-loop.</strong> You review and approve
                  applications before they are sent. The AI does the heavy lifting, but you maintain
                  control and can adjust anything.
                </li>
                <li>
                  <strong className="text-white">Safe pacing.</strong> Applications are submitted
                  with natural timing patterns. No burst of 50 applications in 2 minutes. The system
                  respects platform rate limits and mimics human behavior.
                </li>
                <li>
                  <strong className="text-white">Learning from results.</strong> As you receive
                  callbacks (or do not), the system adjusts its matching algorithm and resume
                  strategies for your specific situation.
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                8. Step-by-Step: Your First AI-Powered Job Search
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Ready to get started? Follow this framework whether you use ApplyMaster or another
                platform:
              </p>
              <ol className="space-y-4 text-[#b0b0c8]">
                <li>
                  <strong className="text-white">Step 1: Build a comprehensive profile.</strong>{' '}
                  Upload your most complete resume. Add all skills, certifications, and preferences.
                  The more data the AI has, the better it can match and customize.
                </li>
                <li>
                  <strong className="text-white">Step 2: Define your search criteria.</strong> Set
                  target titles, locations (or remote preference), salary range, company size, and
                  industry. Be specific but not so narrow that you miss opportunities.
                </li>
                <li>
                  <strong className="text-white">Step 3: Review initial matches.</strong> Before
                  enabling auto-apply, review the first batch of matched jobs. Are they relevant? If
                  not, adjust your criteria or profile.
                </li>
                <li>
                  <strong className="text-white">Step 4: Set your match threshold.</strong> A 70%
                  match minimum is a good starting point. You can lower it to cast a wider net or
                  raise it to focus on perfect fits.
                </li>
                <li>
                  <strong className="text-white">Step 5: Review customized materials.</strong> Check
                  the tailored resume and cover letter for your top matches. Make sure they accurately
                  represent your experience.
                </li>
                <li>
                  <strong className="text-white">Step 6: Approve and launch.</strong> Once you are
                  satisfied with the quality, enable automated submissions. Monitor the first day
                  closely.
                </li>
                <li>
                  <strong className="text-white">Step 7: Track and iterate.</strong> After the first
                  week, review your analytics. Which applications got responses? Which did not?
                  Adjust your strategy accordingly.
                </li>
              </ol>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                9. Optimizing Your Profile for AI Applications
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                The quality of your AI applications directly depends on the quality of your input
                profile. Here is how to maximize it:
              </p>
              <ul className="space-y-3 text-[#b0b0c8]">
                <li>
                  <strong className="text-white">Use quantified achievements.</strong> Instead of
                  &quot;managed a team,&quot; write &quot;managed a team of 8 engineers, delivering 3
                  products that generated $2M in revenue.&quot; The AI uses these details to craft
                  compelling, specific application materials.
                </li>
                <li>
                  <strong className="text-white">Include a comprehensive skills list.</strong> The
                  matching algorithm relies on skills data. Include technical skills, tools,
                  frameworks, methodologies, and soft skills.
                </li>
                <li>
                  <strong className="text-white">Add multiple resume versions.</strong> If you are
                  open to different types of roles (e.g., management and individual contributor),
                  create separate base resumes for each track.
                </li>
                <li>
                  <strong className="text-white">Keep your profile current.</strong> Update it
                  whenever you learn a new skill, complete a project, or earn a certification. Stale
                  profiles produce stale applications.
                </li>
              </ul>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                10. Measuring Success and Iterating
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Track these metrics to gauge whether your AI job search strategy is working:
              </p>
              <ul className="space-y-3 text-[#b0b0c8]">
                <li>
                  <strong className="text-white">Application-to-response rate.</strong> What
                  percentage of your applications result in any recruiter contact? Industry average
                  for manual applications is around 5-10%. A good AI system should maintain or
                  improve this despite higher volume.
                </li>
                <li>
                  <strong className="text-white">Response-to-interview rate.</strong> Of the
                  recruiters who respond, how many lead to interviews? If this number is low, your
                  resume may be getting through ATS but not impressing humans.
                </li>
                <li>
                  <strong className="text-white">Time to first interview.</strong> How quickly does
                  your AI-assisted search produce interview invitations? Most users see results
                  within the first two weeks.
                </li>
                <li>
                  <strong className="text-white">Match score correlation.</strong> Do higher match
                  scores correlate with higher response rates? If not, the matching algorithm may
                  need calibration.
                </li>
              </ul>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                11. The Future of AI in Job Searching
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                The AI job application space is evolving rapidly. Here is what to expect in the next
                few years:
              </p>
              <ul className="space-y-3 text-[#b0b0c8]">
                <li>
                  <strong className="text-white">Two-sided AI matching.</strong> Both employers and
                  candidates will use AI, creating a more efficient market where good fits are
                  identified faster from both sides.
                </li>
                <li>
                  <strong className="text-white">AI interview preparation.</strong> Integrated
                  platforms will not just help you apply but also prepare you for each specific
                  interview with{' '}
                  <Link href="/blog/interview-preparation-guide" className="text-[#fd79a8] hover:underline">
                    AI coaching
                  </Link>{' '}
                  tailored to the company and role.
                </li>
                <li>
                  <strong className="text-white">Predictive job matching.</strong> AI will identify
                  roles you should apply for before you even search, based on career trajectory
                  analysis and market trends.
                </li>
                <li>
                  <strong className="text-white">Salary negotiation support.</strong> AI will provide
                  real-time market data and negotiation strategies customized to your specific offer.
                </li>
              </ul>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                12. Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Is it ethical to use AI for job applications?
                  </h3>
                  <p className="text-[#b0b0c8] leading-relaxed">
                    Yes, as long as the information in your applications is truthful. AI is a tool
                    that helps you present your real qualifications more effectively and efficiently.
                    Employers use AI to screen candidates, so there is nothing wrong with using AI to
                    apply.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Will recruiters know I used AI?
                  </h3>
                  <p className="text-[#b0b0c8] leading-relaxed">
                    High-quality AI tools produce applications indistinguishable from
                    manually-written ones. The key is personalization. If your application clearly
                    addresses the specific role and company, it will read as genuine regardless of
                    how it was created.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    How many applications per day is too many?
                  </h3>
                  <p className="text-[#b0b0c8] leading-relaxed">
                    There is no universal number, but quality matters more than quantity. On LinkedIn
                    specifically, staying under 25-30 Easy Apply submissions per day keeps you in
                    safe territory. Across all platforms combined, 50-80 quality applications is a
                    reasonable daily ceiling.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Can I use AI applications alongside manual ones?
                  </h3>
                  <p className="text-[#b0b0c8] leading-relaxed">
                    Absolutely. Many users let AI handle the volume applications while manually
                    crafting applications for their dream companies. This hybrid approach gives you
                    the best of both worlds.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* CTA Section */}
          <section className="mt-16 p-8 md:p-12 rounded-2xl border border-[#fd79a8]/20 bg-gradient-to-br from-[#fd79a8]/5 to-transparent text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Automate Your Job Search?
            </h2>
            <p className="text-[#8a8aaa] mb-8 max-w-lg mx-auto">
              ApplyMaster uses AI to find, match, and apply to the right jobs for you. Set up your
              profile once and let intelligent automation do the rest.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-4 bg-[#fd79a8] hover:bg-[#e84393] text-white font-semibold rounded-xl transition-colors"
            >
              Start Applying with AI &mdash; Free
            </Link>
          </section>

          {/* Related Posts */}
          <nav className="mt-12 pt-8 border-t border-white/5">
            <h3 className="text-sm font-semibold text-[#6a6a8a] uppercase tracking-wider mb-4">
              Related Articles
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog/ats-resume-optimization" className="text-[#fd79a8] hover:underline text-sm">
                  ATS Resume Optimization: Beat the Bots &amp; Get Interviews
                </Link>
              </li>
              <li>
                <Link href="/blog/cover-letter-tips-2025" className="text-[#fd79a8] hover:underline text-sm">
                  How to Write a Cover Letter That Actually Gets Read (2025)
                </Link>
              </li>
              <li>
                <Link href="/blog/linkedin-auto-apply-guide" className="text-[#fd79a8] hover:underline text-sm">
                  LinkedIn Auto Apply: How to Apply to 100+ Jobs Per Day Safely
                </Link>
              </li>
            </ul>
          </nav>
        </article>
      </main>
    </>
  )
}
