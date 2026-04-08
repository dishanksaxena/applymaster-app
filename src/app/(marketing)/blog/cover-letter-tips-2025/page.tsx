import type { Metadata } from 'next'
import Link from 'next/link'

const title = 'How to Write a Cover Letter That Actually Gets Read (2025)'
const description =
  'Master the 3-paragraph cover letter formula, learn AI-assisted personalization techniques, avoid common mistakes, and use templates that hiring managers actually respond to.'
const url = 'https://applymaster.ai/blog/cover-letter-tips-2025'

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    'cover letter tips',
    'how to write a cover letter',
    'cover letter template',
    'AI cover letter',
    'cover letter examples',
    'cover letter 2025',
    'cover letter format',
    'cover letter generator',
  ],
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    type: 'article',
    publishedTime: '2025-03-20T08:00:00Z',
    modifiedTime: '2025-03-20T08:00:00Z',
    authors: ['ApplyMaster Team'],
    images: [
      {
        url: 'https://applymaster.ai/og/cover-letter-tips-2025.png',
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
    images: ['https://applymaster.ai/og/cover-letter-tips-2025.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  image: 'https://applymaster.ai/og/cover-letter-tips-2025.png',
  author: { '@type': 'Organization', name: 'ApplyMaster', url: 'https://applymaster.ai' },
  publisher: {
    '@type': 'Organization',
    name: 'ApplyMaster',
    logo: { '@type': 'ImageObject', url: 'https://applymaster.ai/logo.png' },
  },
  datePublished: '2025-03-20T08:00:00Z',
  dateModified: '2025-03-20T08:00:00Z',
  mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  keywords: 'cover letter tips, how to write a cover letter, cover letter template, AI cover letter',
}

export default function CoverLetterTipsPage() {
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
            className="text-sm text-[#74b9ff] hover:text-[#0984e3] font-medium mb-8 inline-block"
          >
            &larr; Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#74b9ff]/10 text-[#74b9ff]">
                Cover Letters
              </span>
              <time className="text-xs text-[#4a4a6a]" dateTime="2025-03-20">
                March 20, 2025
              </time>
              <span className="text-xs text-[#4a4a6a]">10 min read</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent leading-tight">
              {title}
            </h1>
            <p className="text-lg text-[#8a8aaa] leading-relaxed">
              Most cover letters never get read. Not because hiring managers do not care, but
              because the letters are generic, too long, or fail to immediately demonstrate value.
              Here is how to write cover letters that earn attention in 2025.
            </p>
          </header>

          {/* Table of Contents */}
          <nav className="mb-12 p-6 rounded-xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-[#74b9ff] uppercase tracking-wider mb-4">
              Table of Contents
            </h2>
            <ol className="space-y-2 text-sm text-[#8a8aaa]">
              <li>1. Do Cover Letters Still Matter in 2025?</li>
              <li>2. The 3-Paragraph Formula That Works</li>
              <li>3. Paragraph 1: The Hook</li>
              <li>4. Paragraph 2: The Evidence</li>
              <li>5. Paragraph 3: The Close</li>
              <li>6. Personalization: The Make-or-Break Factor</li>
              <li>7. AI-Assisted Cover Letter Writing</li>
              <li>8. Cover Letter Formatting Rules</li>
              <li>9. The 7 Worst Cover Letter Mistakes</li>
              <li>10. When to Skip the Cover Letter</li>
              <li>11. Templates for Common Scenarios</li>
              <li>12. How ApplyMaster Generates Cover Letters</li>
            </ol>
          </nav>

          {/* Content */}
          <div className="space-y-10">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                1. Do Cover Letters Still Matter in 2025?
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Yes, but not in the way most people think. Surveys consistently show that roughly
                half of hiring managers consider cover letters important. The other half skip them.
                The problem is you do not know which camp your hiring manager falls into.
              </p>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Here is what has changed: a generic cover letter actively hurts you. It signals
                that you mass-apply without caring about the specific role. But a well-targeted
                cover letter can be the deciding factor between two equally qualified candidates.
              </p>
              <p className="text-[#b0b0c8] leading-relaxed">
                The strategy is simple: always include one when the option exists, but make it
                concise, specific, and genuinely personalized. A great cover letter takes 30
                seconds to read and leaves the hiring manager wanting to look at your resume. A bad
                one takes 30 seconds to dismiss.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                2. The 3-Paragraph Formula That Works
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Forget the five-paragraph essay structure you learned in school. Modern cover
                letters should follow a tight three-paragraph format that can be read in under 30
                seconds:
              </p>
              <ul className="space-y-3 text-[#b0b0c8]">
                <li>
                  <strong className="text-white">Paragraph 1 &mdash; The Hook (2-3 sentences):</strong>{' '}
                  Why this specific company and role excites you. Demonstrate that you have done
                  your research.
                </li>
                <li>
                  <strong className="text-white">Paragraph 2 &mdash; The Evidence (3-4 sentences):</strong>{' '}
                  Your strongest 1-2 achievements that directly relate to what the job requires.
                  Use numbers.
                </li>
                <li>
                  <strong className="text-white">Paragraph 3 &mdash; The Close (2 sentences):</strong>{' '}
                  A confident statement about what you will bring, and a clear call to action.
                </li>
              </ul>
              <p className="text-[#b0b0c8] leading-relaxed mt-4">
                Total length: 150-250 words. That is it. Anything longer and you are testing the
                reader&apos;s patience.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Paragraph 1: The Hook</h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Your opening paragraph must accomplish two things: show you know the company and
                create a reason for the reader to continue. Here is what works and what does not.
              </p>
              <h3 className="text-lg font-semibold text-white mb-3">What Does Not Work</h3>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Generic openers like &quot;I am writing to express my interest in the Software
                Engineer position&quot; add zero value. The hiring manager already knows what
                position you applied for. You are wasting your most valuable real estate.
              </p>
              <h3 className="text-lg font-semibold text-white mb-3">What Works</h3>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Lead with something specific about the company. Reference a recent product launch,
                a company value you connect with, or a challenge they face that you can help solve.
                This demonstrates genuine interest and immediately differentiates you from
                template-senders.
              </p>
              <p className="text-[#b0b0c8] leading-relaxed">
                The best hooks connect your personal experience or passion to the company&apos;s
                mission. If you can explain <em className="text-white">why</em> you want this
                specific job at this specific company, you are already ahead of 90% of applicants.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Paragraph 2: The Evidence</h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                This is where you prove you can do the job. Do not restate your resume. Instead,
                pick one or two achievements that directly map to the role&apos;s key requirements
                and tell a concise story.
              </p>
              <ul className="space-y-3 text-[#b0b0c8]">
                <li>
                  <strong className="text-white">Use the STAR micro-format.</strong> In 2-3
                  sentences, describe the Situation, Task, Action, and Result. Keep it tight and
                  quantified.
                </li>
                <li>
                  <strong className="text-white">Match the job description.</strong> If the posting
                  emphasizes &quot;cross-functional collaboration,&quot; your achievement should
                  demonstrate exactly that. If it emphasizes &quot;scaling systems,&quot; share a
                  scaling win.
                </li>
                <li>
                  <strong className="text-white">Use specific numbers.</strong> &quot;Increased
                  conversion by 34%&quot; beats &quot;significantly improved conversion.&quot;
                  Numbers make claims credible and memorable.
                </li>
                <li>
                  <strong className="text-white">Focus on impact, not duties.</strong> &quot;I was
                  responsible for marketing&quot; says nothing. &quot;I launched a content strategy
                  that generated 2,000 qualified leads per month&quot; says everything.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Paragraph 3: The Close</h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                End with confidence, not desperation. Two sentences is all you need:
              </p>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                <strong className="text-white">Sentence 1:</strong> A forward-looking statement
                about what you will bring to the role. Frame it in terms of their needs, not yours.
                Instead of &quot;This job would help me grow,&quot; try &quot;I would bring a
                tested approach to scaling your engineering team from 10 to 50.&quot;
              </p>
              <p className="text-[#b0b0c8] leading-relaxed">
                <strong className="text-white">Sentence 2:</strong> A call to action. &quot;I would
                welcome the chance to discuss how my experience at [Company X] translates to your
                challenges at [Company Y].&quot; This is direct, specific, and invites a next step.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                6. Personalization: The Make-or-Break Factor
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                The single most important element of a modern cover letter is personalization. Here
                is what to research before writing:
              </p>
              <ul className="space-y-3 text-[#b0b0c8]">
                <li>
                  <strong className="text-white">The hiring manager&apos;s name.</strong> Address
                  the letter to a specific person whenever possible. Check LinkedIn, the company
                  website, or the job posting for clues.
                </li>
                <li>
                  <strong className="text-white">Recent company news.</strong> A product launch, a
                  funding round, an expansion, or a new initiative. Referencing this shows you are
                  engaged and current.
                </li>
                <li>
                  <strong className="text-white">Company values or mission.</strong> If their values
                  genuinely resonate with you, explain why. But be authentic. Forced value alignment
                  is easy to spot.
                </li>
                <li>
                  <strong className="text-white">The team or department.</strong> If you can find
                  information about the specific team, reference it. Mentioning a team project or
                  the team lead shows extra effort.
                </li>
                <li>
                  <strong className="text-white">The job description itself.</strong> Mirror the
                  language used in the posting. If they say &quot;customer obsession,&quot; use that
                  phrase, not a synonym like &quot;customer focus.&quot;
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                7. AI-Assisted Cover Letter Writing
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                AI tools have fundamentally changed the cover letter landscape. Used correctly,
                they save hours while producing better results than most people write manually.
              </p>
              <h3 className="text-lg font-semibold text-white mb-3">What AI Does Well</h3>
              <ul className="space-y-2 text-[#b0b0c8] mb-4">
                <li>Analyzing job descriptions to identify key requirements</li>
                <li>Matching your experience to specific job needs</li>
                <li>Maintaining consistent, professional tone</li>
                <li>Generating multiple variations to test</li>
                <li>Ensuring proper keyword inclusion for{' '}
                  <Link href="/blog/ats-resume-optimization" className="text-[#74b9ff] hover:underline">
                    ATS optimization
                  </Link>
                </li>
              </ul>
              <h3 className="text-lg font-semibold text-white mb-3">What AI Needs Help With</h3>
              <ul className="space-y-2 text-[#b0b0c8] mb-4">
                <li>Personal anecdotes and genuine passion</li>
                <li>Insider knowledge about the company culture</li>
                <li>Your unique voice and personality</li>
                <li>Nuanced references to company-specific details</li>
              </ul>
              <p className="text-[#b0b0c8] leading-relaxed">
                The best approach is hybrid: let AI generate the structure and initial draft, then
                add your personal touches. The result reads naturally while being strategically
                optimized.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                8. Cover Letter Formatting Rules
              </h2>
              <ul className="space-y-3 text-[#b0b0c8]">
                <li>
                  <strong className="text-white">Length:</strong> 150-250 words, never exceeding one
                  page. Three paragraphs maximum.
                </li>
                <li>
                  <strong className="text-white">Font:</strong> Same professional font as your
                  resume (Arial, Calibri, or similar), 10-12pt size.
                </li>
                <li>
                  <strong className="text-white">Margins:</strong> 1 inch on all sides. Standard
                  business letter format.
                </li>
                <li>
                  <strong className="text-white">File format:</strong> PDF to preserve formatting.
                  Cover letters are read by humans, not ATS, so PDF is preferred.
                </li>
                <li>
                  <strong className="text-white">File name:</strong>{' '}
                  &quot;FirstName-LastName-CoverLetter.pdf&quot; for easy identification.
                </li>
                <li>
                  <strong className="text-white">Subject line (email):</strong> If sending via
                  email, use the format: &quot;[Job Title] Application &mdash; [Your Name].&quot;
                </li>
              </ul>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                9. The 7 Worst Cover Letter Mistakes
              </h2>
              <ol className="space-y-3 text-[#b0b0c8]">
                <li>
                  <strong className="text-white">1. Starting with &quot;To Whom It May
                  Concern.&quot;</strong> This signals zero research effort. Use a name, or at
                  minimum &quot;Dear Hiring Team.&quot;
                </li>
                <li>
                  <strong className="text-white">2. Restating your resume.</strong> The cover letter
                  is not a summary of your resume. It should add new context and demonstrate fit.
                </li>
                <li>
                  <strong className="text-white">3. Focusing on what you want.</strong> Hiring
                  managers care about what you bring to their team, not what the job does for your
                  career.
                </li>
                <li>
                  <strong className="text-white">4. Being too long.</strong> If your cover letter
                  exceeds 300 words, it will not be read in its entirety. Respect the reader&apos;s
                  time.
                </li>
                <li>
                  <strong className="text-white">5. Using a template without customization.</strong>{' '}
                  Generic cover letters are transparently generic. Every letter must reference the
                  specific company and role.
                </li>
                <li>
                  <strong className="text-white">6. Apologizing or being self-deprecating.</strong>{' '}
                  &quot;I know I do not have much experience, but...&quot; undermines your
                  application before the reader even considers you.
                </li>
                <li>
                  <strong className="text-white">7. Typos and wrong company names.</strong> Nothing
                  kills an application faster than addressing the letter to the wrong company. This
                  is especially common with mass applications.
                </li>
              </ol>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                10. When to Skip the Cover Letter
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Despite everything above, there are situations where a cover letter is not needed:
              </p>
              <ul className="space-y-3 text-[#b0b0c8]">
                <li>
                  <strong className="text-white">The application explicitly says not to include
                  one.</strong> Respect the instructions. Sending one anyway can signal that you do
                  not follow directions.
                </li>
                <li>
                  <strong className="text-white">LinkedIn Easy Apply with no upload option.</strong>{' '}
                  If the{' '}
                  <Link href="/blog/linkedin-auto-apply-guide" className="text-[#74b9ff] hover:underline">
                    LinkedIn application
                  </Link>{' '}
                  form does not have a cover letter field, do not try to paste one into other
                  fields.
                </li>
                <li>
                  <strong className="text-white">Time-sensitive applications where a generic
                  letter is your only option.</strong> A bad cover letter is worse than none. If you
                  cannot personalize it at all, skip it and let your resume speak.
                </li>
              </ul>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                11. Templates for Common Scenarios
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Here are structural frameworks (not copy-paste templates) for different situations:
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">Career Changer</h3>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Lead with transferable skills and the &quot;why&quot; behind the transition. Your
                hook should explain what draws you to the new field. Your evidence paragraph should
                focus entirely on transferable achievements. Address the career change directly
                rather than hoping they will not notice.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">Entry-Level / Recent Graduate</h3>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Focus on academic projects, internships, volunteer work, or personal projects that
                demonstrate relevant skills. Show enthusiasm and willingness to learn, backed by
                concrete examples of initiative.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">Senior / Executive Level</h3>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Lead with your most impressive quantified achievement. At this level, the cover
                letter should position you as a strategic asset, not just a skilled worker. Focus on
                business impact and leadership outcomes.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">Returning After a Gap</h3>
              <p className="text-[#b0b0c8] leading-relaxed">
                Address the gap briefly and positively, then pivot immediately to your relevant
                skills and what you have done to stay current. Do not over-explain. A sentence or
                two is sufficient.
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                12. How ApplyMaster Generates Cover Letters
              </h2>
              <p className="text-[#b0b0c8] leading-relaxed mb-4">
                Writing a unique cover letter for every application is ideal but impractical when
                you are applying to dozens of positions. ApplyMaster solves this:
              </p>
              <ul className="space-y-3 text-[#b0b0c8]">
                <li>
                  <strong className="text-white">Job description analysis.</strong> The AI reads
                  each job posting and identifies the key requirements, desired skills, and company
                  context.
                </li>
                <li>
                  <strong className="text-white">Experience matching.</strong> It maps your profile
                  to the job requirements and selects the most relevant achievements to highlight.
                </li>
                <li>
                  <strong className="text-white">Company research.</strong> The system pulls recent
                  company information to add genuine personalization that goes beyond the job
                  description.
                </li>
                <li>
                  <strong className="text-white">Tone calibration.</strong> Whether the company
                  culture is formal or casual, the generated letter matches the appropriate tone
                  based on signals from the posting and company profile.
                </li>
                <li>
                  <strong className="text-white">Human review.</strong> Every generated cover letter
                  is presented for your review. You can edit, approve, or regenerate before
                  submission.
                </li>
              </ul>
            </section>
          </div>

          {/* CTA Section */}
          <section className="mt-16 p-8 md:p-12 rounded-2xl border border-[#74b9ff]/20 bg-gradient-to-br from-[#74b9ff]/5 to-transparent text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Generate Perfect Cover Letters in Seconds
            </h2>
            <p className="text-[#8a8aaa] mb-8 max-w-lg mx-auto">
              ApplyMaster writes personalized, compelling cover letters for every application
              automatically. Each one is tailored to the specific job and company.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-4 bg-[#74b9ff] hover:bg-[#0984e3] text-white font-semibold rounded-xl transition-colors"
            >
              Try AI Cover Letters &mdash; Free
            </Link>
          </section>

          {/* Related Posts */}
          <nav className="mt-12 pt-8 border-t border-white/5">
            <h3 className="text-sm font-semibold text-[#6a6a8a] uppercase tracking-wider mb-4">
              Related Articles
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog/ats-resume-optimization" className="text-[#74b9ff] hover:underline text-sm">
                  ATS Resume Optimization: Beat the Bots &amp; Get Interviews
                </Link>
              </li>
              <li>
                <Link href="/blog/interview-preparation-guide" className="text-[#74b9ff] hover:underline text-sm">
                  AI Interview Coaching: Prepare for Any Interview in 30 Minutes
                </Link>
              </li>
              <li>
                <Link href="/blog/ai-job-application-guide" className="text-[#74b9ff] hover:underline text-sm">
                  The Complete Guide to AI Job Applications in 2025
                </Link>
              </li>
            </ul>
          </nav>
        </article>
      </main>
    </>
  )
}
