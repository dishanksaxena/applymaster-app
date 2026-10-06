/**
 * Comparison pages (/compare/<slug>). Every statement about another product
 * is what that company publishes about itself, on the page linked in
 * `sources`, as of `CHECKED`. Where they publish nothing, say so instead of
 * guessing. Re-check these before changing the date: prices move.
 *
 * Statements about ApplyMaster must be true of the product today.
 */

import { portalNames as names } from './portals'

export const CHECKED = '6 October 2026'


export type Row = { label: string; them: string; us: string }

export type Competitor = {
  slug: string
  name: string
  site: string
  /** One sentence: what they are, in their own terms. */
  summary: string
  rows: Row[]
  /** Honest: when they are the better choice. */
  chooseThem: string[]
  chooseUs: string[]
  sources: { label: string; url: string }[]
  faqs: { q: string; a: string }[]
}

/** The ApplyMaster side of every table. Keep in step with the product. */
const US = {
  submit: 'You do. The extension fills the form on the employer’s site; you check it and press Submit.',
  price: 'Free plan. Paid plans from $29 a month, or $199 once for Lifetime.',
  free: 'Yes, no card needed. The Chrome extension works with a free account.',
  portals: `${names()}, plus a toolbar button for any other site.`,
  record: 'Each application is saved in your tracker as Applied, with a receipt of what you sent and the employer’s reference number.',
  extras: 'Daily job matches, resume tailoring and cover letters, interview practice with scored feedback, and referral paths from your LinkedIn connections.',
  never: 'Never answers gender, ethnicity, veteran or disability questions, never ticks consent boxes, and never writes answers the employer asks to be in your own words.',
}

export const COMPETITORS: Competitor[] = [
  {
    slug: 'aiapply',
    name: 'AIApply',
    site: 'aiapply.co',
    summary:
      'AIApply is an AI job-search suite: a resume builder, an interview assistant, and Auto Apply, which finds matching jobs and submits applications on your behalf, paid for with application credits.',
    rows: [
      { label: 'Who submits the application', them: 'AIApply’s Auto Apply “automatically submits applications on your behalf”.', us: US.submit },
      { label: 'How it is priced', them: 'A Premium subscription, with Auto Apply sold separately as credits: one credit is one application, sold in packs such as 100 or 250, and credits do not expire.', us: US.price },
      { label: 'Free to start', them: 'A free account for core tools such as a sample cover letter and the job board.', us: US.free },
      { label: 'Where it applies', them: 'Not listed by name; AIApply says “supported platforms”.', us: US.portals },
      { label: 'What you keep', them: 'Not stated on its Auto Apply page.', us: US.record },
      { label: 'Also included', them: 'Resume builder, cover letters, resume scanner, interview assistant.', us: US.extras },
    ],
    chooseThem: [
      'You want applications sent for you without opening each one.',
      'You would rather buy applications as credits than pay a monthly plan.',
    ],
    chooseUs: [
      'You want to read every answer and press Submit yourself, on the employer’s own site.',
      'You apply mostly through Workday, Greenhouse, Lever or Ashby and want those forms filled, including Workday’s work history.',
      'You want a free plan to start, and a record of exactly what each employer received.',
    ],
    sources: [
      { label: 'AIApply Auto Apply', url: 'https://aiapply.co/auto-apply' },
      { label: 'AIApply pricing', url: 'https://aiapply.co/pricing' },
    ],
    faqs: [
      {
        q: 'What is the main difference between ApplyMaster and AIApply?',
        a: 'Who presses Submit. AIApply’s Auto Apply submits applications for you. ApplyMaster fills the application on the employer’s site and you submit it, so nothing is sent that you have not read.',
      },
      {
        q: 'Is ApplyMaster a good AIApply alternative?',
        a: 'If you want to stay in control of each application and start for free, yes. If you want a service that sends applications without you opening them, AIApply is built for that.',
      },
    ],
  },
  {
    slug: 'tsenta',
    name: 'Tsenta',
    site: 'tsenta.com',
    summary:
      'Tsenta is an AI job-application agent: it watches company careers pages, tailors your resume and cover letter, and submits applications through employers’ own systems after showing you each one.',
    rows: [
      { label: 'Who submits the application', them: 'Tsenta does, after showing you the changes it made: “every change is shown to you before anything goes out”.', us: US.submit },
      { label: 'How it is priced', them: 'Free for 25 applications; Starter $19, Pro $39 and Power $99 a month, for 600, 1,500 and 4,500 applications.', us: US.price },
      { label: 'Free to start', them: '25 free applications, no card needed.', us: US.free },
      { label: 'Where it applies', them: '30+ employer systems, including Workday, Greenhouse, Lever, Ashby, iCIMS, Workable, Jobvite and SmartRecruiters.', us: US.portals },
      { label: 'What you keep', them: 'A receipt for every application.', us: US.record },
      { label: 'Where you use it', them: 'Web, iOS and Android apps, a Chrome extension, iMessage, WhatsApp, and an MCP server.', us: 'Web app and Chrome extension.' },
    ],
    chooseThem: [
      'You want an agent to send applications at volume, on many systems, the moment jobs go live.',
      'You want to approve applications from your phone or a chat app.',
    ],
    chooseUs: [
      'You want to fill and send each application yourself, with the form in front of you.',
      'You also want interview practice and referral paths through people you know, in the same place.',
      'You want a free plan without an application allowance to run out.',
    ],
    sources: [{ label: 'Tsenta pricing', url: 'https://tsenta.com/pricing' }],
    faqs: [
      {
        q: 'What is the main difference between ApplyMaster and Tsenta?',
        a: 'Tsenta submits applications for you after you approve them. ApplyMaster fills the application in your browser and you press Submit on the employer’s site yourself.',
      },
      {
        q: 'Is ApplyMaster a Tsenta alternative?',
        a: `For people who prefer to submit their own applications, yes: it fills ${names()} forms, and keeps a receipt of each one.`,
      },
    ],
  },
  {
    slug: 'simplify',
    name: 'Simplify Copilot',
    site: 'simplify.jobs',
    summary:
      'Simplify Copilot is a free Chrome extension that autofills job applications on many applicant tracking systems and saves them to Simplify’s job tracker.',
    rows: [
      { label: 'Who submits the application', them: 'You do. Copilot fills the form; you submit it.', us: US.submit },
      { label: 'How it is priced', them: 'Free, with paid premium features (Simplify+).', us: US.price },
      { label: 'Free to start', them: 'Yes.', us: US.free },
      { label: 'Where it applies', them: '“Thousands of job boards and ATS platforms like Workday, Lever, Greenhouse, and more.”', us: US.portals },
      { label: 'What you keep', them: 'Applications saved to the Simplify tracker.', us: US.record },
      { label: 'Also included', them: 'Job tracker and AI resume tools.', us: US.extras },
    ],
    chooseThem: [
      'You want the widest autofill coverage across career sites.',
      'You only need autofill and a tracker.',
    ],
    chooseUs: [
      'You want written answers drafted from your resume and highlighted for you to check, and questions you should answer yourself left alone.',
      'You want the employer’s confirmation and reference number saved with each application.',
      'You want job matching, interview practice and referral paths alongside autofill.',
    ],
    sources: [
      { label: 'Simplify Copilot', url: 'https://simplify.jobs/copilot' },
      { label: 'Simplify Copilot in the Chrome Web Store', url: 'https://chromewebstore.google.com/detail/simplify-copilot-autofill/pbanhockgagggenencehbnadejlgchfc' },
    ],
    faqs: [
      {
        q: 'Are ApplyMaster and Simplify the same kind of tool?',
        a: 'Both fill applications in your browser and leave Submit to you. ApplyMaster also keeps a receipt of what each employer received, drafts written answers for you to check, and includes job matching, interview practice and referral paths.',
      },
    ],
  },
  {
    slug: 'jobcopilot',
    name: 'JobCopilot',
    site: 'jobcopilot.com',
    summary: 'JobCopilot is an auto-apply service: you set up a “copilot” with your preferences and it applies to matching jobs automatically.',
    rows: [
      { label: 'Who submits the application', them: 'JobCopilot does, automatically.', us: US.submit },
      { label: 'How it is priced', them: 'From $0.93 a day (Premium) or $1.05 a day (Elite), billed weekly, monthly or quarterly.', us: US.price },
      { label: 'Volume', them: 'Up to 20 job matches a day on Premium and 50 on Elite.', us: 'As many as you choose to send; daily matches are queued for you to review.' },
      { label: 'Also included', them: 'Resume and cover letter builders and mock interviews; resume tailoring on Elite.', us: US.extras },
    ],
    chooseThem: ['You want a set number of applications sent every day without your involvement.'],
    chooseUs: [
      'You want to see and send each application yourself.',
      'You want a free plan, and a receipt of exactly what each employer received.',
    ],
    sources: [{ label: 'JobCopilot pricing', url: 'https://jobcopilot.com/pricing' }],
    faqs: [
      {
        q: 'What is the difference between ApplyMaster and JobCopilot?',
        a: 'JobCopilot applies for you automatically. ApplyMaster fills applications in your browser and you submit them, with a receipt of each.',
      },
    ],
  },
]

export const competitorBySlug = (slug: string) => COMPETITORS.find(c => c.slug === slug) ?? null

export const US_NEVER = US.never
