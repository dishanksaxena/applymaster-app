/**
 * The public FAQ — one list, read by the homepage and by the structured data
 * Google shows in search results.
 *
 * They used to be two copies, and both promised things that did not exist:
 * 50+ job portals including LinkedIn and Workday, Autopilot that "applies
 * automatically", a Chrome extension that listened to live interviews and
 * suggested answers, SOC 2 compliance, and one-click data export and
 * deletion. Every answer here describes the product as it is.
 */
export const FAQ: { q: string; a: string }[] = [
  {
    q: 'Is ApplyMaster free?',
    a: 'Yes. The free plan includes resume analysis and optimisation, job search, daily matches and application tracking, with no credit card. Paid plans add more volume and are opening shortly.',
  },
  {
    q: 'Does ApplyMaster submit applications for me?',
    a: 'It does the work up to the send button. Every morning it finds matching roles, tailors your resume, drafts a cover letter and fills in the employer’s application form. Most employers protect their forms with a CAPTCHA that requires a person, so you review and send each application yourself — and your tracker only says “applied” once one was actually sent.',
  },
  {
    q: 'What is the difference between Copilot and Autopilot?',
    a: 'Both run every morning and queue new matches for you. Copilot keeps the daily number modest so you can review each one closely; Autopilot uses your full daily limit. Either way, nothing is sent without you.',
  },
  {
    q: 'Where do the jobs come from?',
    a: 'The career sites of 31 companies — including Stripe, Anthropic, Databricks, Figma, Coinbase, Airbnb and Cloudflare — plus Adzuna and RemoteOK. We only list sources we actually search.',
  },
  {
    q: 'How does the interview coach work?',
    a: 'It runs practice interviews — behavioural, technical, system design or case — with questions tailored to the company and role you give it, and gives feedback on each answer.',
  },
  {
    q: 'Can I use a referral instead of applying cold?',
    a: 'Yes. Add the people you know and ApplyMaster flags jobs at their companies, then drafts a short, honest referral request for you to edit and send.',
  },
  {
    q: 'Is my data safe?',
    a: 'Your resume is stored privately and opened only through links that expire in minutes. We never share your data with employers or anyone else. From Settings you can download everything we hold about you, or delete your account and all of its data permanently.',
  },
]
