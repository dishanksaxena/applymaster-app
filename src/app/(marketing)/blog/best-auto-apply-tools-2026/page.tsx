import type { Metadata } from 'next'
import Link from 'next/link'
import { postMetadata, PostJsonLd } from '@/lib/blog/seo'
import { postBySlug } from '@/lib/blog/posts'

const SLUG = 'best-auto-apply-tools-2026'
const title = postBySlug(SLUG)!.title

export const metadata: Metadata = postMetadata(SLUG, ["best auto apply tools 2026", "auto apply jobs AI", "AI job application tools", "Tsenta alternatives", "AIApply alternative", "LoopCV alternative", "auto apply job tool comparison", "job application bot"])

// Must match the FAQ shown on the page.
const FAQS = [
  {
    "q": "Do auto-apply tools actually get people interviews?",
    "a": "They remove the typing, not the competition. Volume with strong matching beats volume alone — an application to a role you fit at 85% is worth a stack of sprayed ones. No tool can honestly guarantee interviews, and you should treat any that does as a red flag."
  },
  {
    "q": "Is it safe to auto-apply on LinkedIn?",
    "a": "Automating LinkedIn is against its User Agreement and accounts get restricted for it. Filling a form you opened, where you press Submit, is a different activity from a bot clicking through jobs on its own — ask which one a tool does before trusting it with the account your search depends on."
  },
  {
    "q": "What is the cheapest way to start?",
    "a": "Free tiers: Simplify's autofill, ApplyMaster's 30 applications a month , and LoopCV's free loop. Run one for two weeks before paying anyone."
  }
]

const tools = [
  {
    name: 'ApplyMaster',
    what: 'Finds matching jobs on employer boards every morning; a Chrome extension fills the application form and you press Submit',
    where: 'Greenhouse, Lever, Ashby, Workday, Adzuna, RemoteOK and other employer boards',
    price: 'Free for 30 applications/month; Pro $29/mo (or $17/mo yearly)',
    watch: 'It will not press Submit for you — by design',
  },
  {
    name: 'Tsenta',
    what: 'A desktop agent that applies on career pages from your own computer while you watch',
    where: 'Company career pages',
    price: 'Third-party reviews list a free trial, then roughly $19–99/mo — check their site',
    watch: 'Young product (YC S26); few independent reviews so far',
  },
  {
    name: 'AIApply',
    what: 'Resume and cover letter tools with an auto-apply feature and an interview-practice app',
    where: 'Job boards; auto-apply sold as its own tier',
    price: 'Subscription; reviewers note auto-apply costs extra — check their site',
    watch: 'Largest review footprint in the category, praise and complaints alike',
  },
  {
    name: 'LoopCV',
    what: 'Sets up recurring “loops” that apply or email your CV to matching companies on a schedule',
    where: 'Job boards and recruiter email outreach',
    price: 'Free tier, then monthly plans — check their site',
    watch: 'Email outreach is a different channel from applying on the employer’s form',
  },
  {
    name: 'Simplify',
    what: 'A free autofill extension and job tracker; you do the searching and the submitting',
    where: 'Most major ATS application forms',
    price: 'Free core product',
    watch: 'Autofill and tracking, not automated search or matching',
  },
  {
    name: 'LazyApply',
    what: 'Bulk one-click applying, pitched on maximum daily volume',
    where: 'LinkedIn and Indeed primarily',
    price: 'One-time and subscription plans — check their site',
    watch: 'LinkedIn’s User Agreement does not allow automating LinkedIn; high volume there is a risk you are accepting',
  },
]

export default function BestAutoApplyTools2026Page() {
  return (
    <>
      <PostJsonLd slug={SLUG} faqs={FAQS} />
      <article className="pt-14 pb-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          {/* Header */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent-dim,var(--bg-overlay))] text-[var(--accent)]">
                Tools
              </span>
              <time className="text-xs text-[var(--text-faint)]" dateTime="2026-11-12">
                November 12, 2026
              </time>
              <span className="text-xs text-[var(--text-faint)]">9 min read</span>
            </div>
            <h1 className="font-display text-[clamp(2.3rem,5vw,3.4rem)] mb-6">{title}</h1>
            <p className="text-lg text-[var(--text-muted)] leading-relaxed">
              Every tool on this list, ours included, is sold with the same promise: stop typing
              your work history into forms and let software do it. They differ wildly in how they
              keep that promise — and in what they quietly cannot do. Here is the comparison we
              wish had existed when we started building in this category, including the parts that
              do not flatter anyone.
            </p>
          </header>

          {/* The two facts */}
          <section className="mb-12 p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-overlay)]">
            <h2 className="text-sm font-semibold text-[var(--accent)] uppercase tracking-wider mb-3">
              Two facts to hold every tool against
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
              <strong className="text-ink">1. Most serious employer forms end in a CAPTCHA.</strong>{' '}
              A tool can search, match, fill and track — but a person usually has to press the
              final button. Any product implying it submits hundreds of applications untouched is
              describing the minority of forms without one.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-ink">2. LinkedIn&apos;s User Agreement does not allow bots or
              browser extensions that automate LinkedIn.</strong> Accounts do get restricted for
              it. A tool can fill a form you opened; a tool that clicks through LinkedIn on its own
              puts the account your job search depends on at risk.
            </p>
          </section>

          {/* Comparison table */}
          <section className="mb-12">
            <h2 className="font-display text-[1.6rem] mb-4">The comparison</h2>
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="text-left bg-[var(--bg-overlay)]">
                    <th className="p-3 font-semibold text-ink">Tool</th>
                    <th className="p-3 font-semibold text-ink">What it actually does</th>
                    <th className="p-3 font-semibold text-ink">Where</th>
                    <th className="p-3 font-semibold text-ink">Price</th>
                    <th className="p-3 font-semibold text-ink">Watch out for</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map(t => (
                    <tr key={t.name} className="border-t border-[var(--border)] align-top">
                      <td className="p-3 font-semibold text-ink whitespace-nowrap">{t.name}</td>
                      <td className="p-3 text-[var(--text-secondary)]">{t.what}</td>
                      <td className="p-3 text-[var(--text-secondary)]">{t.where}</td>
                      <td className="p-3 text-[var(--text-secondary)]">{t.price}</td>
                      <td className="p-3 text-[var(--text-secondary)]">{t.watch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[var(--text-faint)] mt-3">
              Prices and features checked November 2026 against each vendor&apos;s public pages and
              third-party reviews; they change often, so confirm on the vendor&apos;s own site. We
              build ApplyMaster, so read our row as a maker&apos;s claim and everyone else&apos;s as
              our best honest summary.
            </p>
          </section>

          {/* Deep dives */}
          <div className="space-y-10">
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">ApplyMaster — ours, so judge the claim</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                ApplyMaster searches employer boards every morning — Greenhouse, Lever, Ashby,
                Workday, plus Adzuna and RemoteOK — scores each posting against your resume, and
                queues the matches. A Chrome extension then fills the employer&apos;s real form:
                contact details, work history, resume upload, screening questions. You review the
                page and press Submit yourself, every time, and a receipt records exactly what was
                sent. Questions that ask for your own words stay blank, because they are yours.
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                The free plan covers 30 applications a month with the AI resume and cover-letter
                tools included;{' '}
                <Link href="/pricing" className="text-[var(--accent)] hover:underline">
                  Pro at $29/month
                </Link>{' '}
                adds the extension and 150 a month. If you want a tool that presses Submit without
                you, we are the wrong choice on purpose.
              </p>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">Tsenta — the desktop agent</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Tsenta (Y Combinator, summer 2026) takes the most technically interesting approach
                in the category: an agent that runs on your own computer and applies on company
                career pages while you watch it work. Running locally sidesteps some of the
                detection problems cloud bots have, and watching each submission keeps you in
                control. It is also the youngest product here, with few independent reviews so far
                — third-party write-ups list plans from roughly $19 to $99 a month. If you like
                early software and a desktop workflow, it is the one to trial.{' '}
                <Link href="/compare/tsenta" className="text-[var(--accent)] hover:underline">
                  Our detailed ApplyMaster-vs-Tsenta comparison
                </Link>{' '}
                covers where each wins.
              </p>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">AIApply — the biggest name</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                AIApply has the largest review footprint in the category — over a thousand
                Trustpilot reviews — which tells you two things: many people use it, and you can
                read both the praise (speed, resume tools, a well-rated interview-practice app) and
                the complaints (several reviewers describe auto-apply as a separate, more expensive
                tier than they expected, and some criticise the cancellation flow) before paying.
                That volume of public feedback is genuinely useful; read a page of one-star and a
                page of five-star reviews and you will know if it fits you.
              </p>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">LoopCV — the email loop</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                LoopCV automates a different channel: it sets up recurring searches
                (&ldquo;loops&rdquo;) and then applies on supported boards or emails your CV
                directly to companies and recruiters on a schedule. Email outreach can reach
                companies with no public posting, but it is cold email with the response rates of
                cold email. It suits people running a wide, patient search more than someone
                targeting specific roles this month.
              </p>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">Simplify — the free baseline</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Simplify&apos;s extension autofills application forms on most major ATS platforms
                and tracks what you have applied to, free. It does not search or match for you —
                you find every job yourself — but as a baseline, it is the tool to beat: any paid
                product on this list has to be worth more than free autofill. If your search is
                casual, start here and upgrade to a matching engine only when the manual searching
                becomes the bottleneck.
              </p>
            </section>

            <section>
              <h2 className="font-display text-[1.6rem] mb-4">LazyApply — volume, priced in risk</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                LazyApply sells exactly what the name promises: bulk one-click applying on LinkedIn
                and Indeed, pitched on daily volume. Be clear-eyed about the trade:
                LinkedIn&apos;s User Agreement does not allow automation, restricted accounts are a
                documented outcome across this whole product class, and employers increasingly
                filter the spray-and-pray pattern. If you accept those risks knowingly, it does
                what it says; we built in the opposite direction.
              </p>
            </section>

            {/* How to choose */}
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">How to choose in five questions</h2>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-ink">1. Who presses Submit?</strong> If the tool does,
                  ask how it handles CAPTCHAs and LinkedIn&apos;s rules — concretely, not in
                  marketing copy.
                </li>
                <li>
                  <strong className="text-ink">2. Where does it actually apply?</strong>{' '}
                  &ldquo;100+ job boards&rdquo; often means one aggregator. Ask for the list of
                  ATSs it fills.
                </li>
                <li>
                  <strong className="text-ink">3. What happens to screening questions?</strong>{' '}
                  Wrong canned answers to knockout questions waste every application they touch.
                </li>
                <li>
                  <strong className="text-ink">4. Can you see what was sent?</strong> A receipt per
                  application separates tools you can trust from tools you have to hope about.
                </li>
                <li>
                  <strong className="text-ink">5. What does cancelling look like?</strong> Read the
                  one-star reviews first; they are the documentation vendors do not write.
                </li>
              </ul>
            </section>

            {/* FAQ */}
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">FAQ</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-2">
                    Do auto-apply tools actually get people interviews?
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    They remove the typing, not the competition. Volume with strong matching beats
                    volume alone — an application to a role you fit at 85% is worth a stack of
                    sprayed ones. No tool can honestly guarantee interviews, and you should treat
                    any that does as a red flag.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-2">
                    Is it safe to auto-apply on LinkedIn?
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Automating LinkedIn is against its User Agreement and accounts get restricted
                    for it. Filling a form you opened, where you press Submit, is a different
                    activity from a bot clicking through jobs on its own — ask which one a tool
                    does before trusting it with the account your search depends on.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-2">
                    What is the cheapest way to start?
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Free tiers: Simplify&apos;s autofill,{' '}
                    <Link href="/signup" className="text-[var(--accent)] hover:underline">
                      ApplyMaster&apos;s 30 applications a month
                    </Link>
                    , and LoopCV&apos;s free loop. Run one for two weeks before paying anyone.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* CTA */}
          <section className="mt-16 p-8 md:p-12 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-overlay)] to-transparent text-center">
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.1rem)] mb-4">
              Try the honest one free
            </h2>
            <p className="text-[var(--text-muted)] mb-8 max-w-lg mx-auto">
              30 applications a month, matched to your resume, forms filled for you — and you press
              every Submit. No card required.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-4 bg-[var(--accent-solid)] text-[var(--text-on-accent)] font-semibold rounded-xl transition-transform hover:-translate-y-0.5"
            >
              Start free
            </Link>
          </section>

          {/* Related */}
          <nav className="mt-12 pt-8 border-t border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-4">
              Related articles
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog/ai-job-search-2026" className="text-[var(--accent)] hover:underline text-sm">
                  AI Job Search in 2026: What Actually Works (and What Is Hype)
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-[var(--accent)] hover:underline text-sm">
                  ApplyMaster vs the alternatives, one by one
                </Link>
              </li>
              <li>
                <Link href="/blog/ats-resume-optimization" className="text-[var(--accent)] hover:underline text-sm">
                  ATS Resume Optimization: Beat the Bots &amp; Get Interviews
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </article>
    </>
  )
}
