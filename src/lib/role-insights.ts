import 'server-only'
import { blocksToText, getAllBoards, getJob, jobPath, parseLocation, type ListedJob } from './public-jobs'
import { extractKeywords } from './tools/keywords'

/**
 * Role pages (/roles/<role>): what employers hiring for a role ask for and
 * pay, computed from the live postings behind /companies. Every number is
 * counted from those postings at the time the page was built, and the page
 * says how many it read.
 */

export type Role = { slug: string; name: string; plural: string; test: RegExp }

// Order matters: a title belongs to the first family it matches.
export const ROLES: Role[] = [
  { slug: 'machine-learning-engineer', name: 'Machine Learning Engineer', plural: 'Machine learning engineers', test: /\b(machine learning|ml|ai|deep learning)\b.*\b(engineer|scientist|researcher)\b|\bresearch (engineer|scientist)\b|\bapplied scientist\b/i },
  { slug: 'data-engineer', name: 'Data Engineer', plural: 'Data engineers', test: /\bdata (platform |infrastructure )?engineer\b|\banalytics engineer\b/i },
  { slug: 'data-scientist', name: 'Data Scientist', plural: 'Data scientists', test: /\bdata scien(tist|ce)\b/i },
  { slug: 'security-engineer', name: 'Security Engineer', plural: 'Security engineers', test: /\bsecurity\b.*\b(engineer|architect|analyst)\b|\b(detection|threat) engineer\b/i },
  { slug: 'site-reliability-engineer', name: 'Site Reliability / DevOps Engineer', plural: 'Site reliability and DevOps engineers', test: /\b(site reliability|sre|devops|cloud|production) engineer\b|\bsre\b/i },
  { slug: 'engineering-manager', name: 'Engineering Manager', plural: 'Engineering managers', test: /\bengineering manager\b|\bmanager,? (software )?engineering\b|\b(head|director|vp),? (of )?engineering\b/i },
  { slug: 'solutions-engineer', name: 'Solutions Engineer', plural: 'Solutions engineers', test: /\b(solutions?|sales|forward[- ]deployed|customer|field) engineer\b|\bsolutions? architect\b/i },
  { slug: 'hardware-engineer', name: 'Hardware & Mechanical Engineer', plural: 'Hardware and mechanical engineers', test: /\b(mechanical|electrical|avionics|propulsion|manufacturing|hardware|structures|thermal|rf|test|reliability|quality|production|integration|materials|systems) engineer\b/i },
  { slug: 'software-engineer', name: 'Software Engineer', plural: 'Software engineers', test: /\b(software|backend|back[- ]end|frontend|front[- ]end|full[- ]?stack|mobile|ios|android|platform|infrastructure|web|product|staff|senior|principal)\b.*\b(engineer|developer)\b|\bsoftware development engineer\b/i },
  { slug: 'product-manager', name: 'Product Manager', plural: 'Product managers', test: /\bproduct (manager|lead|owner)\b|\b(head|director|vp),? (of )?product\b/i },
  { slug: 'product-designer', name: 'Product Designer', plural: 'Product designers', test: /\b(product|ux|ui|visual|interaction|brand|graphic) designer\b|\bdesign (lead|manager)\b|\bux researcher\b/i },
  { slug: 'data-analyst', name: 'Data & Business Analyst', plural: 'Data and business analysts', test: /\b(data|business|product|financial|marketing|operations|strategy|bi) analyst\b|\banalytics (manager|lead)\b/i },
  { slug: 'account-executive', name: 'Account Executive', plural: 'Account executives', test: /\baccount executive\b|\bsales (executive|manager|director|lead)\b|\benterprise sales\b|\bsales\b.*\brepresentative\b/i },
  { slug: 'sales-development-representative', name: 'Sales Development Representative', plural: 'Sales and business development reps', test: /\b(sales|business) development (representative|rep)\b|\bsdr\b|\bbdr\b/i },
  { slug: 'customer-success-manager', name: 'Customer Success Manager', plural: 'Customer success and account managers', test: /\bcustomer success\b|\baccount manager\b|\btechnical account manager\b|\bcustomer support\b|\bsupport (specialist|engineer|agent)\b/i },
  { slug: 'marketing-manager', name: 'Marketing Manager', plural: 'Marketing roles', test: /\bmarketing\b|\bgrowth (manager|lead|marketer)\b|\bcontent (strategist|manager|marketing|writer)\b|\bcommunications\b|\bseo\b|\bdemand generation\b/i },
  { slug: 'recruiter', name: 'Recruiter', plural: 'Recruiters', test: /\brecruit(er|ing)\b|\btalent (acquisition|partner)\b|\bsourcer\b/i },
  { slug: 'finance-accounting', name: 'Finance & Accounting', plural: 'Finance and accounting roles', test: /\baccountant\b|\baccounting\b|\bfinance\b|\bfp&a\b|\bcontroller\b|\btax\b|\btreasury\b|\bpayroll\b/i },
  { slug: 'legal-compliance', name: 'Legal & Compliance', plural: 'Legal and compliance roles', test: /\bcounsel\b|\battorney\b|\blegal\b|\bparalegal\b|\bcompliance\b/i },
  { slug: 'operations-program-manager', name: 'Operations & Program Manager', plural: 'Operations and program roles', test: /\boperations\b|\b(program|project|technical program) manager\b|\bstrategy\b|\bchief of staff\b/i },
]

export const roleBySlug = (slug: string) => ROLES.find(r => r.slug === slug) ?? null
export const roleOf = (title: string) => ROLES.find(r => r.test.test(title)) ?? null

type Posting = ListedJob & { board: string; company: string }

async function postingsFor(role: Role): Promise<Posting[]> {
  const boards = await getAllBoards()
  return boards
    .flatMap(b => b.jobs.map(j => ({ ...j, board: b.board, company: b.company })))
    .filter(j => roleOf(j.title) === role)
    .sort((a, b) => (b.published ?? b.updated).localeCompare(a.published ?? a.updated))
}

/** Annual USD pay ranges written in a posting ("$150,000 – $200,000", "$150K-$200K"). */
export function payRanges(text: string): [number, number][] {
  const out: [number, number][] = []
  const re = /\$\s?(\d{2,3}(?:,\d{3})+|\d{2,3}(?:\.\d)?\s?[kK])\s*(?:USD)?\s*(?:-|–|—|to)\s*\$?\s?(\d{2,3}(?:,\d{3})+|\d{2,3}(?:\.\d)?\s?[kK])/g
  const num = (s: string) => (/k$/i.test(s.trim()) ? parseFloat(s) * 1000 : Number(s.replace(/,/g, '')))
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const lo = num(m[1])
    const hi = num(m[2])
    // Annual salaries only: skips hourly rates and bonus figures.
    if (lo >= 25000 && hi <= 1500000 && hi >= lo) out.push([lo, hi])
  }
  return out
}

/* Words that are skills in a posting but too broad to rank across a role:
   most of their mentions are company descriptions ("our security team",
   "sales and operations"), not what the job asks for. */
const TOO_BROAD = new Set([
  'operations', 'security', 'marketing', 'sales', 'recruiting', 'finance', 'healthcare', 'onboarding', 'accounting', 'tax', 'audit',
  'payroll', 'logistics', 'procurement', 'customer service', 'customer support', 'human resources', 'frontend', 'backend', 'ui', 'ux',
])
/* Two names for one skill: count them once. */
const SAME: Record<string, string> = {
  llm: 'LLMs', llms: 'LLMs', 'large language models': 'LLMs', postgres: 'PostgreSQL', postgresql: 'PostgreSQL', 'amazon web services': 'AWS', aws: 'AWS',
  gcp: 'Google Cloud', 'google cloud': 'Google Cloud', golang: 'Go', go: 'Go', k8s: 'Kubernetes', kubernetes: 'Kubernetes', 'machine learning': 'machine learning',
  ml: 'machine learning', 'artificial intelligence': 'AI', 'natural language processing': 'NLP', nlp: 'NLP', 'ci/cd': 'CI/CD', sql: 'SQL', python: 'Python',
  java: 'Java', javascript: 'JavaScript', typescript: 'TypeScript', 'c++': 'C++', 'c#': 'C#', react: 'React', 'node.js': 'Node.js', docker: 'Docker',
  terraform: 'Terraform', kafka: 'Kafka', spark: 'Spark', pytorch: 'PyTorch', tensorflow: 'TensorFlow', salesforce: 'Salesforce', excel: 'Excel',
  'advanced excel': 'Excel', tableau: 'Tableau', 'power bi': 'Power BI', linux: 'Linux', rust: 'Rust', cad: 'CAD', figma: 'Figma', jira: 'Jira',
  ruby: 'Ruby', azure: 'Azure', snowflake: 'Snowflake', crm: 'CRM', iot: 'IoT', hubspot: 'HubSpot', swift: 'Swift', kotlin: 'Kotlin', scala: 'Scala',
  graphql: 'GraphQL', redis: 'Redis', mongodb: 'MongoDB', databricks: 'Databricks', airflow: 'Airflow', dbt: 'dbt', looker: 'Looker', gaap: 'GAAP',
  'google analytics': 'Google Analytics', seo: 'SEO', 'a/b testing': 'A/B testing', 'rest api': 'REST APIs', solidworks: 'SolidWorks', autocad: 'AutoCAD',
}
const skillName = (term: string) => SAME[term] ?? term

const median = (xs: number[]) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export async function roleInsights(role: Role, sample = 30) {
  const postings = await postingsFor(role)
  const companies = new Map<string, { board: string; company: string; n: number }>()
  for (const p of postings) {
    const c = companies.get(p.board) ?? { board: p.board, company: p.company, n: 0 }
    c.n += 1
    companies.set(p.board, c)
  }
  const cities = new Map<string, number>()
  let remote = 0
  for (const p of postings) {
    const w = parseLocation(p.location)
    if (w.remote) remote++
    for (const pl of w.places) if (pl.city) cities.set(`${pl.city}${pl.country && pl.country !== 'US' ? `, ${pl.country}` : ''}`, (cities.get(`${pl.city}${pl.country && pl.country !== 'US' ? `, ${pl.country}` : ''}`) ?? 0) + 1)
  }

  // Skills and pay come from reading the newest postings in full, spread across companies.
  const picked: Posting[] = []
  const perCompany = new Map<string, number>()
  for (const p of postings) {
    if (picked.length >= sample) break
    const n = perCompany.get(p.board) ?? 0
    if (n >= 4) continue
    perCompany.set(p.board, n + 1)
    picked.push(p)
  }
  const details = (await Promise.all(picked.map(p => getJob(p.board, p.id)))).filter((d): d is NonNullable<typeof d> => !!d)
  const skillCount = new Map<string, number>()
  const softCount = new Map<string, number>()
  const lows: number[] = []
  const highs: number[] = []
  let withPay = 0
  for (const d of details) {
    const text = blocksToText(d.blocks)
    const kws = extractKeywords(`${d.title}\n${text}`)
    const own = d.company.toLowerCase() // "Intercom" in Intercom's own postings is the company, not a skill
    const skills = kws.filter(k => k.kind === 'skill' && !TOO_BROAD.has(k.term) && k.term !== own).map(k => skillName(k.term))
    for (const k of new Set(skills)) skillCount.set(k, (skillCount.get(k) ?? 0) + 1)
    for (const k of new Set(kws.filter(k => k.kind === 'soft').map(k => k.term))) softCount.set(k, (softCount.get(k) ?? 0) + 1)
    const ranges = payRanges(text)
    if (ranges.length) {
      withPay++
      // A posting with several ranges (by location) counts once, by its widest span.
      lows.push(Math.min(...ranges.map(r => r[0])))
      highs.push(Math.max(...ranges.map(r => r[1])))
    }
  }
  const rank = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])

  return {
    role,
    total: postings.length,
    companyCount: companies.size,
    remote,
    topCompanies: [...companies.values()].sort((a, b) => b.n - a.n).slice(0, 12),
    topCities: rank(cities).slice(0, 10),
    read: details.length,
    skills: rank(skillCount).filter(([, n]) => n >= 2).slice(0, 18),
    soft: rank(softCount).filter(([, n]) => n >= 2).slice(0, 8),
    pay: withPay >= 3 ? { postings: withPay, low: Math.round(median(lows) / 1000) * 1000, high: Math.round(median(highs) / 1000) * 1000, min: Math.min(...lows), max: Math.max(...highs) } : null,
    latest: postings.slice(0, 30).map(p => ({ title: p.title, company: p.company, location: p.location, href: jobPath(p.board, p) })),
  }
}
