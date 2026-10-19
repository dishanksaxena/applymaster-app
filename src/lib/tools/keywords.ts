/**
 * Keyword matching between a resume and a job description, for the free
 * checker at /tools. Deterministic and entirely in the browser: nothing a
 * visitor pastes or uploads leaves their machine.
 *
 * What it measures, honestly: how many of the terms a job description leans
 * on also appear in the resume. That is what applicant tracking systems'
 * keyword filters and recruiters' searches look at. It cannot say whether an
 * ATS will "pass" a resume; no tool can, because every employer configures
 * their own.
 */

export type Kind = 'skill' | 'soft' | 'term'
export type Keyword = { term: string; kind: Kind; count: number; weight: number; found: boolean; required: boolean }

/* Hard skills and tools across common fields. Multi-word entries are matched
   as phrases. Keep entries lowercase. */
const SKILLS = `
python,java,javascript,typescript,c++,c#,golang,ruby,php,kotlin,scala,matlab,perl,bash,shell scripting,powershell,sql,nosql,graphql,rest api,restful,grpc,html,css,sass,tailwind,
react,react native,next.js,vue,angular,svelte,node.js,express.js,django,flask,fastapi,spring boot,.net,asp.net,rails,laravel,jquery,redux,webpack,vite,
aws,amazon web services,azure,gcp,google cloud,firebase,supabase,vercel,heroku,cloudflare,lambda,ec2,s3,docker,kubernetes,terraform,ansible,jenkins,github actions,gitlab ci,ci/cd,devops,linux,unix,git,github,gitlab,bitbucket,
microservices,distributed systems,system design,data structures,algorithms,object-oriented programming,design patterns,unit testing,test automation,selenium,cypress,playwright,jest,pytest,
postgresql,postgres,mysql,mongodb,redis,elasticsearch,dynamodb,cassandra,snowflake,bigquery,redshift,databricks,spark,hadoop,kafka,airflow,dbt,etl,data pipelines,data warehousing,data modeling,
machine learning,deep learning,artificial intelligence,nlp,natural language processing,computer vision,llm,llms,generative ai,prompt engineering,pytorch,tensorflow,scikit-learn,pandas,numpy,keras,hugging face,langchain,rag,mlops,
data analysis,data analytics,data science,statistics,a/b testing,experimentation,advanced excel,vlookup,pivot tables,tableau,power bi,looker,google analytics,ga4,mixpanel,amplitude,sas,spss,stata,
security,cybersecurity,network security,penetration testing,siem,iam,soc 2,iso 27001,gdpr,hipaa,pci dss,encryption,firewalls,incident response,vulnerability management,
product management,product strategy,roadmapping,user research,ux,ui,ux design,ui design,figma,sketch,adobe xd,photoshop,illustrator,indesign,after effects,premiere pro,canva,wireframing,prototyping,design systems,accessibility,wcag,
project management,program management,agile,scrum,kanban,jira,confluence,asana,trello,monday.com,pmp,prince2,waterfall,stakeholder management,risk management,change management,budgeting,forecasting,
marketing,digital marketing,content marketing,seo,sem,ppc,google ads,facebook ads,meta ads,social media marketing,email marketing,marketing automation,hubspot,marketo,mailchimp,copywriting,brand management,growth marketing,lead generation,
sales,b2b sales,saas sales,account management,business development,salesforce,crm,cold calling,negotiation,pipeline management,customer success,customer service,customer support,zendesk,intercom,
finance,accounting,financial analysis,financial modeling,fp&a,gaap,ifrs,bookkeeping,accounts payable,accounts receivable,payroll,tax,audit,quickbooks,xero,sap,oracle,netsuite,erp,cpa,cfa,valuation,
operations,supply chain,logistics,procurement,inventory management,lean six sigma,six sigma,process improvement,quality assurance,quality control,vendor management,
human resources,recruiting,talent acquisition,onboarding,hris,workday,benefits administration,employee relations,
healthcare,patient care,emr,ehr,epic,cerner,clinical research,nursing,medical coding,
autocad,solidworks,revit,cad,mechanical engineering,electrical engineering,civil engineering,plc,embedded systems,iot,
mobile development,ios,android,flutter,web development,frontend,backend,full stack,cloud computing,blockchain,solidity
`.split(',').map(s => s.trim()).filter(Boolean)

const SOFT = `
communication,written communication,verbal communication,leadership,teamwork,collaboration,problem solving,problem-solving,critical thinking,
attention to detail,time management,organization,adaptability,creativity,mentoring,coaching,ownership,cross-functional,presentation skills,
analytical skills,decision making,interpersonal skills,self-starter,customer focus,prioritization,conflict resolution
`.split(',').map(s => s.trim()).filter(Boolean)

/* Skills that are also everyday words ("go above and beyond", "excel at",
   "a swift response"): they only count when written with a capital, as a
   product name is. */
const CASED: Record<string, RegExp> = {
  go: /(?<![\w.])Go(?![\w])/g,
  rust: /\bRust\b/g,
  swift: /\bSwift\b/g,
  r: /(?<![\w.])R(?![\w&/])/g,
  excel: /\bExcel\b/g,
  spring: /\bSpring\b/g,
}
const casedCount = (raw: string, term: string) => (raw.match(CASED[term]) || []).length

/* The same thing written two ways. Matching either counts. */
const SYNONYMS: Record<string, string[]> = {
  javascript: ['js'],
  typescript: ['ts'],
  'node.js': ['nodejs', 'node'],
  'next.js': ['nextjs'],
  postgresql: ['postgres'],
  kubernetes: ['k8s'],
  'machine learning': ['ml'],
  'artificial intelligence': ['ai'],
  'natural language processing': ['nlp'],
  'amazon web services': ['aws'],
  aws: ['amazon web services'],
  gcp: ['google cloud'],
  'google cloud': ['gcp'],
  'ci/cd': ['continuous integration', 'continuous delivery', 'continuous deployment'],
  ux: ['user experience'],
  ui: ['user interface'],
  'problem solving': ['problem-solving'],
  'problem-solving': ['problem solving'],
  golang: ['go'],
  llm: ['llms', 'large language models', 'large language model'],
  llms: ['llm', 'large language models'],
  'power bi': ['powerbi'],
  'a/b testing': ['ab testing', 'a/b tests', 'split testing'],
  'customer service': ['customer support'],
  'customer support': ['customer service'],
}

const STOP = new Set(
  `a an and or the of to in on for with by at as from is are be been being this that these those it its we our you your they their will would can could should may might must
   have has had do does did not no yes if then than so such into over under about across within per via etc also more most other some any all each every both either
   work working job role team teams company candidate candidates experience experienced years year required requirements preferred qualifications responsibilities
   ability able strong excellent good great knowledge understanding skills skill including include includes plus using use used new well based level
   us usa inc llc ltd eg ie e.g i.e`.split(/\s+/)
)

/* Uppercase tokens that are ordinary words or noise, not credentials. */
const NOT_ACRONYM = new Set(['I', 'A', 'US', 'USA', 'UK', 'EU', 'OR', 'AND', 'THE', 'TO', 'OF', 'IN', 'ON', 'FOR', 'WE', 'YOU', 'IT', 'AT', 'BY', 'AN', 'AS', 'BE', 'IS', 'ARE', 'EEO', 'EOE', 'PTO', 'FAQ', 'CV', 'NA', 'N/A', 'ID', 'OK', 'TBD', 'II', 'III', 'IV'])

export const norm = (s: string) =>
  ` ${s
    .toLowerCase()
    .replace(/[“”"’']/g, ' ')
    .replace(/[^a-z0-9+#./&\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Occurrences of a term as a whole word or phrase (handles c++, .net, ci/cd). */
function occurrences(text: string, term: string) {
  const re = new RegExp(`(?<![a-z0-9+#])${esc(term)}(?![a-z0-9+#])`, 'g')
  return (text.match(re) || []).length
}

/** Occurrences counting the plural/singular of the last word ("REST APIs" for "rest api"). */
function occurrencesAny(text: string, term: string) {
  const other = term.endsWith('s') ? term.slice(0, -1) : `${term}s`
  return occurrences(text, term) + (term.length > 3 ? occurrences(text, other) : 0)
}

function present(text: string, term: string, raw: string) {
  if (CASED[term]) return casedCount(raw, term) > 0 || (SYNONYMS[term] || []).some(s => occurrences(text, s) > 0)
  if (occurrences(text, term) > 0) return true
  // Plural/singular of the last word: "rest api" matches "rest apis".
  if (term.length > 3) {
    if (term.endsWith('s') && occurrences(text, term.slice(0, -1)) > 0) return true
    if (!term.endsWith('s') && occurrences(text, `${term}s`) > 0) return true
  }
  return (SYNONYMS[term] || []).some(s => occurrences(text, s) > 0)
}

/** Lines after a "Requirements" / "Qualifications" heading weigh more. */
function requiredText(jd: string) {
  const lines = jd.split(/\r?\n/)
  const out: string[] = []
  let on = false
  for (const l of lines) {
    const t = l.trim().toLowerCase()
    if (/^(requirements|required|qualifications|minimum qualifications|basic qualifications|must[- ]haves?|what you('|’)ll need|what we('|’)re looking for|you have|skills)\b/.test(t)) on = true
    else if (/^(nice to have|preferred|bonus|benefits|about (us|the company)|what we offer|perks|compensation)\b/.test(t)) on = false
    if (on) out.push(l)
  }
  return norm(out.join('\n'))
}

export type Result = {
  score: number | null
  keywords: Keyword[]
  title: { term: string; found: boolean } | null
  checks: { label: string; ok: boolean; detail: string }[]
  words: number
}

/** The terms a job description leans on, most important first. */
export function extractKeywords(jdRaw: string): Omit<Keyword, 'found'>[] {
  const jd = norm(jdRaw)
  const req = requiredText(jdRaw)
  const found = new Map<string, Omit<Keyword, 'found'>>()
  const add = (term: string, kind: Kind, count: number) => {
    if (count <= 0) return
    const required = occurrences(req, term) > 0
    const base = kind === 'skill' ? 3 : kind === 'term' ? 2 : 1
    const weight = base * Math.min(3, count) * (required ? 1.5 : 1)
    const prev = found.get(term)
    if (!prev || prev.weight < weight) found.set(term, { term, kind, count, weight, required })
  }
  for (const s of SKILLS) add(s, 'skill', occurrencesAny(jd, s))
  for (const s of Object.keys(CASED)) add(s, 'skill', casedCount(jdRaw, s))
  for (const s of SOFT) add(s, 'soft', occurrencesAny(jd, s))

  // Credentials and acronyms the dictionary does not know (HIPAA, CPA, SRE...),
  // unless they are part of a term already found ("PCI" inside "PCI DSS").
  for (const m of jdRaw.matchAll(/\b([A-Z][A-Z0-9&/+.-]{1,7})\b/g)) {
    const raw = m[1].replace(/[.,]$/, '')
    if (NOT_ACRONYM.has(raw) || /^\d+$/.test(raw)) continue
    const t = raw.toLowerCase()
    if (found.has(t) || STOP.has(t) || CASED[t] || [...found.keys()].some(k => k.split(' ').includes(t))) continue
    add(t, 'term', occurrences(jd, t))
  }

  // Repeated two- and three-word phrases ("payment systems", "data platform").
  const words = jd.trim().split(' ')
  const grams = new Map<string, number>()
  for (let n = 2; n <= 3; n++) {
    for (let i = 0; i + n <= words.length; i++) {
      const g = words.slice(i, i + n)
      if (STOP.has(g[0]) || STOP.has(g[n - 1]) || g.some(w => w.length < 2 || /^\d+$/.test(w))) continue
      const k = g.join(' ')
      grams.set(k, (grams.get(k) ?? 0) + 1)
    }
  }
  for (const [g, c] of grams) {
    if (c < 2 || [...found.keys()].some(k => g.includes(k) || k.includes(g))) continue
    add(g, 'term', c)
  }

  // Drop a term already contained, as whole words, in a longer kept one ("learning" inside "machine learning").
  const list = [...found.values()]
  const within = (short: string, long: string) => new RegExp(`(^| )${esc(short)}( |$)`).test(long)
  return list
    .filter(k => !list.some(o => o !== k && o.term.length > k.term.length && within(k.term, o.term) && o.count >= k.count && k.kind === o.kind))
    .sort((a, b) => b.weight - a.weight || b.count - a.count)
    .slice(0, 30)
}

/** The job title, read from the first short line that looks like one. */
function guessTitle(jdRaw: string) {
  for (const line of jdRaw.split(/\r?\n/).slice(0, 6)) {
    const t = line.trim()
    if (t.length >= 4 && t.length <= 70 && /(engineer|developer|manager|analyst|designer|scientist|specialist|consultant|lead|director|architect|coordinator|associate|administrator|representative|accountant|nurse|officer|intern|executive|strategist|writer|editor|recruiter|technician|assistant)/i.test(t))
      return t.replace(/\s*[-–|(].*$/, '').trim()
  }
  return null
}

export function checkResume(resumeRaw: string, jdRaw: string): Result {
  const resume = norm(resumeRaw)
  const hasResume = resumeRaw.trim().length > 0
  const keywords = extractKeywords(jdRaw).map(k => ({ ...k, found: hasResume && present(resume, k.term, resumeRaw) }))
  const total = keywords.reduce((a, k) => a + k.weight, 0)
  const got = keywords.filter(k => k.found).reduce((a, k) => a + k.weight, 0)

  // The title counts if the resume has it with or without its seniority ("Senior Backend Engineer" → "Backend Engineer").
  const titleText = guessTitle(jdRaw)
  const core = titleText ? norm(titleText).trim().replace(/\b(senior|sr|junior|jr|lead|staff|principal|head of|associate|i{1,3}|iv)\b\.?/g, '').replace(/\s+/g, ' ').trim() : ''
  const title = titleText ? { term: titleText, found: hasResume && (present(resume, norm(titleText).trim(), resumeRaw) || (core.length > 3 && occurrences(resume, core) > 0)) } : null

  const words = resumeRaw.trim() ? resumeRaw.trim().split(/\s+/).length : 0
  const checks: Result['checks'] = []
  if (hasResume) {
    const email = /[\w.+-]+@[\w-]+\.[\w.]+/.test(resumeRaw)
    const phone = /(\+?\d[\d\s().-]{8,}\d)/.test(resumeRaw)
    const linkedin = /linkedin\.com\/in\//i.test(resumeRaw)
    const numbers = (resumeRaw.match(/\b\d[\d,]*(\.\d+)?\s?(%|percent\b|x\b|k\b|m\b|b\b|million\b|billion\b|users\b|customers\b|clients\b)|[$€£₹]\s?\d/gi) || []).length
    const sections = ['experience', 'education', 'skills'].filter(s => new RegExp(`\\b${s}\\b`, 'i').test(resumeRaw))
    checks.push({ label: 'Email address', ok: email, detail: email ? 'Found.' : 'Add an email address recruiters can reply to.' })
    checks.push({ label: 'Phone number', ok: phone, detail: phone ? 'Found.' : 'Most application forms and recruiters expect a phone number.' })
    checks.push({ label: 'LinkedIn profile', ok: linkedin, detail: linkedin ? 'Found.' : 'A linkedin.com/in/ link lets recruiters check your history quickly.' })
    checks.push({
      label: 'Standard section headings',
      ok: sections.length === 3,
      detail: sections.length === 3 ? 'Experience, Education and Skills are all labelled.' : `Missing: ${['experience', 'education', 'skills'].filter(s => !sections.includes(s)).join(', ')}. Plain headings help ATS parsers file your history correctly.`,
    })
    checks.push({
      label: 'Measurable results',
      ok: numbers >= 3,
      detail: numbers >= 3 ? `${numbers} numbers or percentages show impact.` : 'Few numbers found. Results like "cut costs 20%" or "served 4,000 users" are easier to judge.',
    })
    checks.push({
      label: 'Length',
      ok: words >= 250 && words <= 1100,
      detail: words < 250 ? `${words} words reads thin; most one- or two-page resumes run 400–900.` : words > 1100 ? `${words} words is long; recruiters skim, so cut older or less relevant detail.` : `${words} words.`,
    })
  }

  return { score: hasResume && total > 0 ? Math.round((got / total) * 100) : null, keywords, title, checks, words }
}
