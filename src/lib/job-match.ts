import type { FetchedJob } from './job-fetch'

/**
 * Deterministic job-to-person match score, 0–100, with the reasons.
 *
 * Deterministic on purpose: the daily run scores thousands of postings for
 * every opted-in user, and a number that changed between runs could not be
 * trusted or explained. The title is the gate — a posting that does not
 * match any role the person asked for is not a weak match, it is not a match.
 */

export type MatchPrefs = {
  target_roles?: string[] | null
  desired_job_title?: string | null
  target_locations?: string[] | null
  remote_preference?: string | null
  experience_level?: string | null
  min_salary?: number | null
  excluded_companies?: string[] | null
  key_skills?: string[] | null
  country_preference?: string | null
  willing_to_relocate?: boolean | null
}

const STOP = new Set(['and', 'or', 'of', 'the', 'a', 'an', 'in', 'for', 'to', 'with', '&', '-', '/', 'i', 'ii', 'iii'])
/** Words that name a kind of job without saying which one. */
const GENERIC = new Set(['engineer', 'manager', 'analyst', 'specialist', 'consultant', 'associate', 'lead', 'developer'])

/** Engineering titles that are really customer-facing roles. */
const CUSTOMER_FACING =
  /\b(sales|solutions?|customer|support|field|forward[- ]deployed|implementation|pre-?sales|partner|technical account|professional services)\s+(engineer|architect|consultant)/

const SENIORITY_WORDS = new Set(['senior', 'sr', 'junior', 'jr', 'staff', 'principal', 'lead', 'head', 'chief', 'intern', 'associate', 'entry', 'level', 'mid'])

/** Words that mean the same thing in a job title. */
const SYNONYMS: Record<string, string> = {
  developer: 'engineer', dev: 'engineer', engineering: 'engineer', swe: 'engineer', sde: 'engineer',
  programmer: 'engineer', 'front-end': 'frontend', 'back-end': 'backend', 'full-stack': 'fullstack',
  ml: 'machine-learning', ai: 'machine-learning', 'artificial': 'machine-learning',
  pm: 'product-manager', mgr: 'manager', 'reliability': 'sre', devops: 'sre', infra: 'infrastructure',
  analytics: 'analyst', scientist: 'science', ui: 'design', ux: 'design', designer: 'design',
}

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/full stack/g, 'fullstack')
    .replace(/front end/g, 'frontend')
    .replace(/back end/g, 'backend')
    .replace(/machine learning/g, 'machine-learning')
    .replace(/product manager/g, 'product-manager')
    .replace(/site reliability/g, 'sre')
    .split(/[^a-z0-9+#.-]+/)
    .map(t => t.replace(/^[.-]+|[.-]+$/g, ''))
    .filter(t => t && !STOP.has(t))
    .map(t => SYNONYMS[t] ?? t)
}

type Level = 0 | 1 | 2 | 3 | 4 // entry, mid, senior, lead/staff, executive

function titleLevel(title: string): Level | null {
  const t = title.toLowerCase()
  if (/\b(intern|internship|junior|jr\.?|graduate|entry[- ]level|associate)\b/.test(t)) return 0
  if (/\b(vp|vice president|director|head of|chief|cto|ceo)\b/.test(t)) return 4
  if (/\b(staff|principal|lead|distinguished|architect)\b/.test(t)) return 3
  if (/\b(senior|sr\.?)\b/.test(t)) return 2
  return null // unmarked titles are usually mid-level, but say nothing
}

function prefLevel(exp?: string | null): Level | null {
  const e = (exp || '').toLowerCase()
  if (!e) return null
  if (/entry|junior|intern|graduate|fresher/.test(e)) return 0
  if (/exec|director|vp/.test(e)) return 4
  if (/lead|staff|principal/.test(e)) return 3
  if (/senior/.test(e)) return 2
  if (/mid/.test(e)) return 1
  return null
}

export function scoreJob(job: FetchedJob, prefs: MatchPrefs): { score: number; reasons: string[] } | null {
  const company = job.company.toLowerCase()
  if ((prefs.excluded_companies || []).some(c => c && company.includes(c.toLowerCase()))) return null

  // ── Title: the gate ──
  const roles = [...(prefs.target_roles || []), prefs.desired_job_title || ''].map(r => r.trim()).filter(Boolean)
  if (!roles.length) return null
  const titleTokens = new Set(tokens(job.title))
  let best = 0
  let bestRole = ''
  for (const role of roles) {
    const core = tokens(role).filter(t => !SENIORITY_WORDS.has(t))
    if (!core.length) continue
    let hit = core.filter(t => titleTokens.has(t)).length / core.length
    /* A role that reduces to a generic word — "Staff Engineer" is just
       "engineer" once the rank is removed — matches every engineering title
       ever posted. It still counts, but only as a partial match, so specific
       roles rank above it and a generic hit needs other signals to pass. */
    if (core.every(t => GENERIC.has(t))) hit = Math.min(hit, 0.6)
    if (hit > best) {
      best = hit
      bestRole = role
    }
  }
  if (best < 0.5) return null

  const reasons: string[] = []
  let score = 10
  if (best === 1) {
    score += 50
    reasons.push(`title matches “${bestRole}”`)
  } else if (best >= 0.66) {
    score += 38
    reasons.push(`title close to “${bestRole}”`)
  } else {
    score += 26
    reasons.push(`title partly matches “${bestRole}”`)
  }

  const title = job.title.toLowerCase()
  const roleText = roles.join(' ').toLowerCase()
  const want = prefLevel(prefs.experience_level)

  /* Internships are their own market. The first dry run queued "Software
     Engineering Intern" at 92 for four experienced people, because a
     one-step level gap was tolerated and an unknown level was not checked.
     Only people who are entry level, or asked for internships, see them. */
  if (/\b(intern|internship|co-op|apprentice)\b/.test(title)) {
    if (!(want === 0 || /\bintern/.test(roleText))) return null
  }

  /* A people-manager role is a different job from the individual-contributor
     role with the same words in it: "Data Science Manager" is not a data
     scientist position. Product and project managers are roles, not rank. */
  const managerial = /\b(manager|director|head of|vp|vice president)\b/.test(title.replace(/\b(product|project|program|account) manager\b/g, ''))
  const wantsManagerial = /\b(manager|director|head|lead|vp)\b/.test(roleText.replace(/\b(product|project|program|account) manager\b/g, ''))
  if (managerial && !wantsManagerial && want !== 4) score -= 18

  /* "Sales Engineer", "Solutions Engineer", "Forward Deployed Engineer" share
     a word with software engineering and are different jobs. The first real
     run queued five of them for someone looking for Senior Software Engineer. */
  if (CUSTOMER_FACING.test(title) && !CUSTOMER_FACING.test(roleText) && !/sales|solution|customer|support|deployed/.test(roleText)) {
    score -= 25
  }

  /* A title that names a stack says who they are hiring. "Senior .NET
     Engineer" is not a match for someone whose skills are TypeScript and
     Python, however well the rest of the title lines up. */
  const skills = (prefs.key_skills || []).map(s => s.toLowerCase())
  if (skills.length) {
    const STACKS: [RegExp, RegExp][] = [
      [/(\.net|c#|csharp)/, /(\.net|c#|csharp|dotnet)/],
      [/\bjava\b(?!script)/, /\bjava\b(?!script)|spring|kotlin/],
      [/\bphp\b|laravel/, /php|laravel/],
      [/\bruby\b|\brails\b/, /ruby|rails/],
      [/\bios\b|swift/, /\bios\b|swift/],
      [/android|kotlin/, /android|kotlin/],
      [/salesforce/, /salesforce/],
      [/\bsap\b/, /\bsap\b/],
      [/golang|\bgo\b(?= developer| engineer)/, /\bgo\b|golang/],
      [/\bscala\b/, /scala/],
      [/\bc\+\+|embedded|firmware/, /c\+\+|embedded|firmware/],
    ]
    for (const [inTitle, inSkills] of STACKS) {
      if (inTitle.test(title) && !skills.some(s => inSkills.test(s))) {
        score -= 22
        reasons.push('stack in the title is not one of your skills')
        break
      }
    }
  }

  // ── Seniority ──
  const have = titleLevel(job.title)
  if (want !== null && have !== null) {
    const gap = Math.abs(want - have)
    if (gap === 0) {
      score += 15
      reasons.push('right seniority')
    } else if (gap === 1) score += 5
    else return null // an intern role for a senior engineer is not a match
  } else score += 6

  // ── Location ──
  const remotePref = (prefs.remote_preference || '').toLowerCase()
  const locs = (prefs.target_locations || []).map(l => l.toLowerCase()).filter(l => l && l !== 'remote')
  const jobLoc = job.location.toLowerCase()
  const locHit = locs.some(l => jobLoc.includes(l) || l.includes(jobLoc.split(',')[0].trim()))
  if (remotePref === 'remote') {
    if (job.remote) {
      score += 15
      reasons.push('remote')
    } else if (locHit) score += 8
    else score -= 12
  } else {
    if (locHit) {
      score += 15
      reasons.push(`in ${job.location}`)
    } else if (job.remote) {
      score += 10
      reasons.push('remote')
    } else if (prefs.willing_to_relocate) score += 2
    else score -= 8
  }

  // ── Salary, only when both sides are known ──
  if (prefs.min_salary && job.salary_max && job.salary_max < prefs.min_salary * 0.9) score -= 20
  else if (prefs.min_salary && job.salary_min && job.salary_min >= prefs.min_salary) {
    score += 8
    reasons.push('pays in your range')
  }

  // ── Freshness: early applicants are read ──
  if (job.posted_at) {
    const days = (Date.now() - new Date(job.posted_at).getTime()) / 86400000
    if (days <= 7) {
      score += 7
      reasons.push('posted this week')
    } else if (days <= 14) score += 4
    else if (days > 60) score -= 6
  }

  // ── Skills named in the description ──
  if (job.description && prefs.key_skills?.length) {
    const d = job.description.toLowerCase()
    const hits = prefs.key_skills.filter(s => s && d.includes(s.toLowerCase()))
    if (hits.length) {
      score += Math.min(8, hits.length * 2)
      reasons.push(`mentions ${hits.slice(0, 3).join(', ')}`)
    }
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons }
}

/** Company + title, normalised, so the same posting from two sources is counted once. */
export const postingKey = (company: string, title: string) =>
  `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}|${title.toLowerCase().replace(/[^a-z0-9]/g, '')}`
