import { STORE_VERSION, newerOrEqual } from './site'

/**
 * The application portals the ApplyMaster Chrome extension fills, one search
 * landing page each (/autofill/<slug>). Every statement here describes what
 * extension/src/content.js actually does on that portal; check it there
 * before adding a claim. `since` is the extension version that added the
 * portal: pages publish only once that version is the one in the store.
 */

export type Portal = {
  slug: string
  name: string
  since: string
  /** Where the forms live, as people see them in the address bar. */
  hosts: string
  /** One plain sentence on what the portal is. */
  what: string
  multiStep: boolean
  /** The employer's portal asks you to create an account or sign in first. */
  account: boolean
  /** What is special about filling this portal. */
  notes: string[]
  /** Questions specific to this portal, on top of the common ones. */
  faqs?: { q: string; a: string }[]
}

export const PORTALS: Portal[] = [
  {
    slug: 'workday',
    name: 'Workday',
    since: '1.1.0',
    hosts: 'myworkdayjobs.com and myworkdaysite.com',
    what: 'Workday is the applicant tracking system behind the careers pages of many large employers. Its applications run over several pages, and most of them ask you to type your work history and education again even after you upload a resume.',
    multiStep: true,
    account: true,
    notes: [
      'Fills My Information: your name, email, phone number, phone type, country and city.',
      'Fills My Experience from your resume: each job title, company and the dates on your resume, and your education. Dates are entered as month and year only where your resume gives them; ApplyMaster never invents a month.',
      'Attaches your resume to the upload field.',
      'Answers the application questions it can answer honestly from your profile, such as work authorisation and sponsorship, and drafts written answers for you to check.',
      'Leaves Voluntary Disclosures and Self Identify (gender, ethnicity, veteran and disability questions) for you.',
      'Each time you press Save and Continue, it fills the next page. Its panel sits in the top-right corner so it never covers Workday’s buttons.',
    ],
    faqs: [
      {
        q: 'Do I still need a Workday account?',
        a: 'Yes. Workday asks you to create an account or sign in with each employer before you can apply. You do that yourself; ApplyMaster starts filling once the application form is open.',
      },
      {
        q: 'Why does Workday ask for my work history when I uploaded a resume?',
        a: 'Workday’s own resume parsing often misses or scrambles entries, so employers ask you to confirm each job. ApplyMaster types every job and school from the resume in your ApplyMaster profile, so you only review them.',
      },
    ],
  },
  {
    slug: 'greenhouse',
    name: 'Greenhouse',
    since: '1.0.0',
    hosts: 'job-boards.greenhouse.io, boards.greenhouse.io and company careers pages that embed a Greenhouse form',
    what: 'Greenhouse is the applicant tracking system used by many technology companies. Its application is a single page: contact details, resume, links, and the employer’s own questions.',
    multiStep: false,
    account: false,
    notes: [
      'Fills your name, email, phone, location and links (LinkedIn, website, GitHub).',
      'Chooses answers in Greenhouse’s searchable dropdowns by typing and picking the matching option, the way you would.',
      'Picks your city from the location suggestions Greenhouse offers.',
      'Attaches your resume, and pastes your cover letter where the form has a box for it, when you have written one for that job in ApplyMaster.',
      'Works on Greenhouse forms embedded in a company’s own careers page, too.',
    ],
  },
  {
    slug: 'lever',
    name: 'Lever',
    since: '1.0.0',
    hosts: 'jobs.lever.co',
    what: 'Lever is an applicant tracking system used by many startups and mid-size companies. Its application is a single page with your details, resume, links and a few questions.',
    multiStep: false,
    account: false,
    notes: [
      'Fills your full name, email, phone and current location.',
      'Fills your LinkedIn, GitHub, portfolio and website links.',
      'Attaches your resume.',
      'Answers the employer’s questions it can answer from your profile and drafts written answers for you to check.',
    ],
  },
  {
    slug: 'ashby',
    name: 'Ashby',
    since: '1.0.0',
    hosts: 'jobs.ashbyhq.com and company careers pages built on Ashby',
    what: 'Ashby is an applicant tracking system popular with fast-growing technology companies. Its application is a single page.',
    multiStep: false,
    account: false,
    notes: [
      'Fills your name, email, phone, location and links.',
      'Attaches your resume.',
      'Answers questions it can answer from your profile, such as work authorisation, sponsorship and years of experience.',
      'Drafts answers to written questions from your resume, highlighted for you to read before sending.',
    ],
  },
  {
    slug: 'indeed-apply',
    name: 'Indeed Apply',
    since: '1.1.0',
    hosts: 'indeed.com (the Apply now / Easily apply flow)',
    what: 'Indeed Apply is Indeed’s own application flow, used when a job shows “Apply now” or “Easily apply” instead of sending you to the employer’s site. It runs over several short steps.',
    multiStep: true,
    account: true,
    notes: [
      'Fills your contact details and the employer’s questions on each step.',
      'Answers questions about work authorisation, sponsorship and years of experience from your profile.',
      'Fills the next step each time you press Continue. You review and press Submit on the last step.',
    ],
    faqs: [
      {
        q: 'Do I need an Indeed account?',
        a: 'Yes. Indeed Apply runs inside your Indeed account, so you sign in to Indeed yourself. ApplyMaster fills the questions in each step.',
      },
    ],
  },
  {
    slug: 'linkedin-easy-apply',
    name: 'LinkedIn Easy Apply',
    since: '1.1.0',
    hosts: 'linkedin.com (the Easy Apply window)',
    what: 'Easy Apply is LinkedIn’s built-in application, which opens in a window on top of the job post and runs over a few steps.',
    multiStep: true,
    account: true,
    notes: [
      'Reads only the Easy Apply window, nothing else on LinkedIn.',
      'Fills your contact details and the employer’s questions on each step.',
      'Fills the next step as you press Next. You press Review and Submit yourself.',
      'Asks you before the first time it fills anything on LinkedIn, and says why (below).',
    ],
    faqs: [
      {
        q: 'Is it safe to use on LinkedIn?',
        a: 'LinkedIn’s User Agreement does not allow extensions that automate activity on LinkedIn, and LinkedIn may restrict accounts it believes use them. ApplyMaster only fills the Easy Apply form while you watch, you press every button, and it asks you before the first time so you can decide.',
      },
    ],
  },
  {
    slug: 'workable',
    name: 'Workable',
    since: '1.2.0',
    hosts: 'apply.workable.com',
    what: 'Workable is an applicant tracking system used by many small and mid-size employers. Its application is a single page.',
    multiStep: false,
    account: false,
    notes: [
      'Fills your name, email, phone, location and links.',
      'Attaches your resume.',
      'Answers questions it can answer from your profile and drafts written answers for you to check.',
      'Leaves alone any question that asks you to answer in your own words, without AI.',
    ],
  },
  {
    slug: 'smartrecruiters',
    name: 'SmartRecruiters',
    since: '1.2.0',
    hosts: 'jobs.smartrecruiters.com',
    what: 'SmartRecruiters is an applicant tracking system used by many large and international employers.',
    multiStep: false,
    account: false,
    notes: [
      'Fills your name, email, phone, location and links, including fields SmartRecruiters builds as web components.',
      'Attaches your resume.',
      'Answers the employer’s screening questions it can answer from your profile.',
    ],
  },
  {
    slug: 'recruitee',
    name: 'Recruitee',
    since: '1.2.0',
    hosts: 'company careers sites on recruitee.com',
    what: 'Recruitee is an applicant tracking system used mostly by European companies. Its application is a single page.',
    multiStep: false,
    account: false,
    notes: [
      'Fills your name, email, phone and links.',
      'Attaches your resume.',
      'Answers questions it can answer from your profile and drafts written answers for you to check.',
    ],
  },
  {
    slug: 'teamtailor',
    name: 'Teamtailor',
    since: '1.2.0',
    hosts: 'company careers sites on teamtailor.com',
    what: 'Teamtailor is an applicant tracking system and careers-site builder used by many European employers.',
    multiStep: false,
    account: false,
    notes: [
      'Fills your name, email, phone and links.',
      'Attaches your resume to the resume upload field.',
      'Answers questions it can answer from your profile and drafts written answers for you to check.',
    ],
  },
  {
    slug: 'jobvite',
    name: 'Jobvite',
    since: '1.2.0',
    hosts: 'jobs.jobvite.com',
    what: 'Jobvite is an applicant tracking system used by mid-size and large employers.',
    multiStep: false,
    account: false,
    notes: [
      'Fills your contact details and links, and attaches your resume.',
      'Answers questions it can answer from your profile.',
      'Some employers show a data-consent page before the form. That is your decision, so ApplyMaster leaves it to you.',
    ],
  },
  {
    slug: 'icims',
    name: 'iCIMS',
    since: '1.2.0',
    hosts: 'careers sites on icims.com',
    what: 'iCIMS is an applicant tracking system used by many large employers. Its applications run over several pages, after you sign in with the employer.',
    multiStep: true,
    account: true,
    notes: [
      'Fills your contact details on the profile page and attaches your resume.',
      'Fills the next page as you move through the application.',
      'Answers questions it can answer from your profile and leaves voluntary questions for you.',
    ],
  },
  {
    slug: 'taleo',
    name: 'Oracle Taleo',
    since: '1.2.0',
    hosts: 'careers sites on taleo.net',
    what: 'Taleo is Oracle’s applicant tracking system, used by many large and long-established employers. Its applications run over several pages, after you sign in with the employer.',
    multiStep: true,
    account: true,
    notes: [
      'Fills your name and contact details.',
      'Fills the next page as you press Save and Continue.',
      'Answers questions it can answer from your profile and leaves voluntary questions for you.',
    ],
  },
  {
    slug: 'successfactors',
    name: 'SAP SuccessFactors',
    since: '1.2.0',
    hosts: 'careers sites on successfactors.com, successfactors.eu, sapsf.com and sapsf.eu',
    what: 'SuccessFactors is SAP’s recruiting system, used by many large international employers. Its applications run over several sections, after you sign in with the employer.',
    multiStep: true,
    account: true,
    notes: [
      'Fills your name and contact details.',
      'Chooses answers in SAP-style dropdowns, which many autofill tools cannot open.',
      'Fills the next section as you move through the application.',
    ],
  },
]

export const livePortals = () => PORTALS.filter(p => newerOrEqual(STORE_VERSION, p.since))
/** The live portals as a phrase: “A, B and C”. */
export function portalNames() {
  const n = livePortals().map(p => p.name)
  return n.length > 1 ? `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}` : n[0]
}

export const portalBySlug = (slug: string) => livePortals().find(p => p.slug === slug) ?? null

/** Questions every portal page answers, worded for that portal. */
export function commonFaqs(p: Portal): { q: string; a: string }[] {
  return [
    {
      q: `Does ApplyMaster submit my ${p.name} application for me?`,
      a: `No. ApplyMaster fills the ${p.name} form on the employer’s site; you check every answer and press ${p.multiStep ? 'Next and Submit' : 'Submit'} yourself. It never solves CAPTCHAs.`,
    },
    {
      q: 'Is the extension free?',
      a: 'Yes. It is free to install from the Chrome Web Store and works with a free ApplyMaster account, where your resume and answers live.',
    },
    {
      q: 'What does it leave for me to answer?',
      a: 'Voluntary questions about gender, ethnicity, veteran or disability status; boxes that agree to terms or give consent; and any question the employer asks you to answer in your own words. Anything it cannot answer honestly from your profile is left blank and listed for you.',
    },
    {
      q: 'Where do the answers come from?',
      a: 'From your ApplyMaster profile and the resume you uploaded. Work authorisation is only answered for the country you told ApplyMaster about; for any other country the question is left to you.',
    },
    {
      q: 'Does it keep track of what I applied to?',
      a: `When ${p.name} shows its confirmation, ApplyMaster records the job in your tracker as Applied, with a receipt of what you sent and the employer’s reference number when there is one.`,
    },
    ...(p.faqs ?? []),
  ]
}
