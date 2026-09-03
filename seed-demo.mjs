import { readFileSync } from 'node:fs'

/**
 * Builds the investor-demo account.
 *
 * Everything written here is real data in the real tables — the app reads
 * it the same way it reads any other account. Nothing is mocked, and no
 * demo-only code path exists, so what gets shown is what a customer gets.
 *
 * Safe to re-run: it deletes the demo account's own rows first and touches
 * nothing belonging to anyone else.
 */

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const EMAIL = 'demo@applymaster.ai'
const PASSWORD = 'DemoDay2026!'

const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
}

const api = async (path, opts = {}) => {
  const r = await fetch(`${URL}${path}`, { ...opts, headers: { ...H, ...(opts.headers || {}) } })
  const text = await r.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  if (!r.ok) console.error(`  ! ${r.status} ${path} ${text.slice(0, 160)}`)
  return { ok: r.ok, status: r.status, json }
}

const rest = (table, opts) => api(`/rest/v1/${table}`, opts)
const insert = (table, rows) =>
  rest(table, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(rows) })

const daysAgo = n => new Date(Date.now() - n * 86400000).toISOString()

// ── 1. The user ───────────────────────────────────────────────────────
console.log('1. account')
let userId

const existing = await api(`/auth/v1/admin/users?page=1&per_page=200`)
const found = (existing.json?.users || []).find(u => u.email === EMAIL)

if (found) {
  userId = found.id
  await api(`/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ password: PASSWORD, email_confirm: true }),
  })
  console.log(`   reusing ${EMAIL}  (${userId})`)
} else {
  const created = await api('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Dishank Saxena' },
    }),
  })
  userId = created.json?.id
  console.log(`   created ${EMAIL}  (${userId})`)
}
if (!userId) { console.error('no user id — stopping'); process.exit(1) }

// ── 2. Clear this account's own rows so the seed is repeatable ────────
console.log('2. clearing previous demo data')
for (const t of [
  'referral_requests', 'application_receipts', 'apply_log', 'applications',
  'cover_letters', 'network_connections', 'parsed_resumes', 'resumes',
  'job_preferences', 'interview_sessions',
]) {
  await rest(`${t}?user_id=eq.${userId}`, { method: 'DELETE' })
}

// ── 3. Profile ────────────────────────────────────────────────────────
console.log('3. profile')
await rest(`profiles?id=eq.${userId}`, {
  method: 'PATCH',
  body: JSON.stringify({
    full_name: 'Dishank Saxena',
    email: EMAIL,
    // profiles carries no phone/location/linkedin columns — those live on
    // parsed_resumes, written by the upload path.
    professional_summary:
      'Full-stack engineer with 8 years building production systems that put large language models in front of real users. Shipped four products end to end, owning architecture, inference cost and reliability.',
    plan: 'elite',
    onboarding_complete: true,
    work_experience: [
      { company: 'ApplyMaster.ai', title: 'Founder & Principal Engineer', startDate: 'Jan 2025', endDate: null, description: 'AI job-application platform on Next.js, Supabase and the Anthropic API.' },
      { company: '3GP.AI', title: 'Senior Software Engineer', startDate: 'Mar 2022', endDate: 'Dec 2024', description: 'Observability ingestion at 40k events/sec across 200+ environments.' },
      { company: 'GharVerify', title: 'Software Engineer', startDate: 'Jun 2020', endDate: 'Feb 2022', description: 'Property-verification marketplace, geospatial search and document verification.' },
      { company: 'Silve Opal Labs', title: 'Software Engineer', startDate: 'Jul 2018', endDate: 'May 2020', description: 'Automated trading for prediction markets.' },
    ],
    education: [{ school: 'Vellore Institute of Technology', degree: 'B.Tech', field: 'Computer Science', endDate: '2018' }],
    certifications: ['AWS Solutions Architect – Associate'],
  }),
})

// ── 4. Preferences — these drive the auto-apply screening answers ─────
console.log('4. preferences')
await insert('job_preferences', {
  user_id: userId,
  target_roles: ['Senior Software Engineer', 'Staff Engineer', 'AI Engineer'],
  target_locations: ['Remote', 'Bengaluru'],
  remote_preference: 'remote',
  min_salary: 180000,
  max_salary: 260000,
  experience_level: 'senior',
  industries: ['AI/ML', 'Developer Tools', 'FinTech'],
  match_threshold: 78,
  auto_apply_mode: 'copilot',
  daily_apply_limit: 15,
  work_authorization: 'Citizen',
  country_preference: 'India',
  available_start_date: 'Within 1 Month',
  current_employment_status: 'Employed (Actively Looking)',
  desired_job_title: 'Senior Software Engineer',
  willing_to_relocate: true,
  key_skills: ['TypeScript', 'Python', 'React', 'Next.js', 'PostgreSQL', 'AWS', 'LLMs'],
  god_mode_enabled: true,
  god_mode_tailor_resume: true,
  god_mode_cover_letter: true,
  god_mode_score_threshold: 'B',
})

// ── 5. Network — the referral demo runs off these ─────────────────────
console.log('5. network')
const contacts = [
  ['Priya Raman', 'Stripe', 'Staff Engineer', 'direct', 'priya.raman@example.com', 'Staff', 12],
  ['Dana Okafor', 'Stripe', 'Engineering Director', 'alumni', 'dana.okafor@example.com', 'Director', 40],
  ['Tom Alvarez', 'Stripe', 'Product Designer', 'second_degree', null, null, null],
  ['Arjun Mehta', 'Anthropic', 'Member of Technical Staff', 'direct', 'arjun.mehta@example.com', 'Senior', 8],
  ['Lena Fischer', 'Anthropic', 'Engineering Manager', 'direct', 'lena.fischer@example.com', 'Manager', 21],
  ['Sam Whitfield', 'Datadog', 'Backend Engineer', 'direct', 'sam.w@example.com', null, 60],
  ['Nikhil Rao', 'Datadog', 'Principal Engineer', 'alumni', 'nikhil.rao@example.com', 'Principal', null],
  ['Grace Chen', 'Figma', 'Head of Platform', 'second_degree', null, 'Head', null],
  ['Ravi Kulkarni', 'Databricks', 'Senior Engineer', 'direct', 'ravi.k@example.com', 'Senior', 15],
  ['Maya Iyer', 'Vercel', 'Developer Advocate', 'direct', 'maya.iyer@example.com', null, 5],
]
const { json: savedContacts } = await insert(
  'network_connections',
  contacts.map(([name, company, title, relationship, email, seniority, contactedDays]) => ({
    user_id: userId, name, company, title, relationship, email,
    linkedin_url: `https://linkedin.com/in/${name.toLowerCase().replace(/\s+/g, '')}`,
    seniority, can_refer: true,
    last_contacted_at: contactedDays == null ? null : daysAgo(contactedDays),
  }))
)
console.log(`   ${savedContacts?.length ?? 0} contacts`)

// ── 6. Jobs, then applications across the pipeline ────────────────────
console.log('6. jobs + applications')
const jobDefs = [
  ['Staff Software Engineer', 'Stripe', 'Remote · US', 'offer', 94, 34, 'greenhouse'],
  ['Senior Backend Engineer', 'Anthropic', 'San Francisco, CA', 'interview', 91, 21, 'greenhouse'],
  ['Senior Platform Engineer', 'Datadog', 'Remote', 'interview', 88, 18, 'greenhouse'],
  ['Software Engineer, Infrastructure', 'Databricks', 'Bengaluru, India', 'screening', 86, 14, 'greenhouse'],
  ['Senior Full-Stack Engineer', 'Figma', 'Remote · EU', 'screening', 84, 12, 'greenhouse'],
  ['Backend Engineer', 'Vercel', 'Remote', 'applied', 82, 9, 'greenhouse'],
  ['Senior Software Engineer', 'Reddit', 'Remote · US', 'applied', 80, 7, 'greenhouse'],
  ['Platform Engineer', 'Cloudflare', 'Remote', 'applied', 79, 5, 'greenhouse'],
  ['Senior Engineer, Payments', 'Affirm', 'Remote · US', 'applied', 77, 4, 'greenhouse'],
  ['Full-Stack Engineer', 'Discord', 'San Francisco, CA', 'queued', 81, 2, 'greenhouse'],
  ['Senior Engineer, Growth', 'Duolingo', 'Remote', 'queued', 76, 1, 'greenhouse'],
  ['Staff Engineer, ML Platform', 'Scale AI', 'Remote · US', 'saved', 89, 3, 'greenhouse'],
  ['Senior Software Engineer', 'Gusto', 'Remote', 'saved', 74, 6, 'greenhouse'],
  ['Backend Engineer, Core', 'Mercury', 'Remote · US', 'rejected', 71, 45, 'greenhouse'],
]

/* jobs has no user_id — it is a shared catalogue — so the per-user delete
   in step 2 cannot reach it and a re-run collides on external_id. Clear
   this demo's own rows by their id prefix, then insert cleanly. */
await rest(`jobs?external_id=like.demo-${userId.slice(0, 8)}-*`, { method: 'DELETE' })

const { json: savedJobs } = await insert(
  'jobs',
  jobDefs.map(([title, company, location, , , postedDays, source], i) => ({
    external_id: `demo-${userId.slice(0, 8)}-${i}`,
    source, title, company, location,
    remote_type: location.toLowerCase().includes('remote') ? 'remote' : null,
    url: `https://job-boards.greenhouse.io/${company.toLowerCase().replace(/\s+/g, '')}/jobs/demo${i}`,
    salary_min: 170000 + i * 4000,
    salary_max: 240000 + i * 5000,
    posted_at: daysAgo(postedDays),
  }))
)
console.log(`   ${savedJobs?.length ?? 0} jobs`)

const appRows = (savedJobs || []).map((job, i) => {
  const [, , , status, score, postedDays] = jobDefs[i]
  const appliedDays = Math.max(1, postedDays - 1)
  const isApplied = !['saved', 'queued'].includes(status)
  return {
    user_id: userId,
    job_id: job.id,
    status,
    match_score: score,
    applied_at: isApplied ? daysAgo(appliedDays) : null,
    created_at: daysAgo(postedDays),
    god_mode_used: isApplied,
    portal_type: 'greenhouse',
    portal_submitted: isApplied,
  }
})
const { json: savedApps } = await insert('applications', appRows)
console.log(`   ${savedApps?.length ?? 0} applications`)

// ── 7. Receipts — proof of exactly what was submitted ─────────────────
console.log('7. receipts')
const appliedApps = (savedApps || []).filter(a => a.applied_at)
await insert(
  'application_receipts',
  appliedApps.slice(0, 6).map((a, i) => ({
    user_id: userId,
    application_id: a.id,
    resume_version_label: `Dishank Saxena — tailored v${i + 1}`,
    cover_letter_text:
      'Dear Hiring Manager,\n\nI have spent the last three years building systems where large language models sit directly in a user-facing path, which is the problem this role describes. At 3GP.AI I took observability ingestion to 40,000 events per second and cut p99 query latency from 1.8s to 240ms.\n\nI would welcome the chance to talk.\n\nDishank Saxena',
    screening_answers: [
      { question: 'Will you now or in the future require sponsorship?', answer: 'No', source: 'preferences' },
      { question: 'What is your current country of residence?', answer: 'India', source: 'profile' },
      { question: 'Years of relevant experience', answer: '8', source: 'resume' },
      { question: 'Earliest start date', answer: 'Within 1 month', source: 'preferences' },
    ],
    destination: 'greenhouse',
    destination_url: 'https://job-boards.greenhouse.io/demo/jobs/1',
    submission_method: 'auto',
    status: 'submitted',
    submitted_at: a.applied_at,
  }))
)

// ── 8. Cover letters ──────────────────────────────────────────────────
console.log('8. cover letters')
await insert('cover_letters', [
  { user_id: userId, job_id: savedJobs?.[0]?.id ?? null, title: 'Stripe — Staff Software Engineer', content: 'Dear Hiring Manager,\n\nI have spent eight years building systems that hold up under real traffic, most recently taking an observability platform to 40,000 events per second across 200+ customer environments. The payments reliability work described in this role is the same shape of problem.\n\nAt 3GP.AI I led a monolith-to-services migration with zero downtime, and cut p99 query latency from 1.8s to 240ms by restructuring the time-series schema. I care about the boring parts — idempotency, backpressure, what happens on the third retry.\n\nI would welcome the chance to talk.\n\nDishank Saxena', tone: 'professional' },
  { user_id: userId, job_id: savedJobs?.[1]?.id ?? null, title: 'Anthropic — Senior Backend Engineer', content: 'Dear Hiring Manager,\n\nI build products where a language model is load-bearing rather than decorative. ApplyMaster parses resumes, scores them against postings and drafts outreach — and most of the engineering has been about the guardrails: never inventing a credential, never answering a voluntary EEO question, never claiming a submission that did not happen.\n\nThat instinct for where a model should not be trusted is what I would bring.\n\nDishank Saxena', tone: 'confident' },
])

// ── 9. Referral requests, across the lifecycle ────────────────────────
console.log('9. referral requests')
const byName = Object.fromEntries((savedContacts || []).map(c => [c.name, c]))
const REFERRAL_KEYS = ['user_id','connection_id','job_id','job_title','company','match_reason','match_strength','message_draft','message_sent','channel','status','sent_at','responded_at']
const normalize = rows => rows.map(r => Object.fromEntries(REFERRAL_KEYS.map(k => [k, r[k] ?? null])))
await insert('referral_requests', normalize([
  { user_id: userId, connection_id: byName['Priya Raman']?.id, job_id: savedJobs?.[0]?.id ?? null, job_title: 'Staff Software Engineer', company: 'Stripe', match_reason: 'works at Stripe · you know them directly · senior enough to be heard internally · you were in touch recently', match_strength: 96, message_draft: 'Hi Priya — I saw Stripe is hiring a Staff Software Engineer on the payments reliability team. Given the ingestion work I did at 3GP.AI I think it lines up well. Would you be willing to put my name forward? Completely fine if not, or if you would rather I applied the normal way.', message_sent: 'Hi Priya — I saw Stripe is hiring a Staff Software Engineer on the payments reliability team. Given the ingestion work I did at 3GP.AI I think it lines up well. Would you be willing to put my name forward? Completely fine if not.', channel: 'email', status: 'accepted', sent_at: daysAgo(30), responded_at: daysAgo(28) },
  { user_id: userId, connection_id: byName['Arjun Mehta']?.id, job_id: savedJobs?.[1]?.id ?? null, job_title: 'Senior Backend Engineer', company: 'Anthropic', match_reason: 'works at Anthropic · you know them directly · you were in touch recently', match_strength: 90, message_draft: 'Hi Arjun — Anthropic has a Senior Backend Engineer role open that looks like a genuine fit for the LLM infrastructure work I have been doing. Would you be up for referring me? No pressure either way.', message_sent: 'Hi Arjun — Anthropic has a Senior Backend Engineer role open that looks like a genuine fit. Would you be up for referring me? No pressure either way.', channel: 'email', status: 'sent', sent_at: daysAgo(6) },
  { user_id: userId, connection_id: byName['Nikhil Rao']?.id, job_id: savedJobs?.[2]?.id ?? null, job_title: 'Senior Platform Engineer', company: 'Datadog', match_reason: 'works at Datadog · alumni connection · senior enough to be heard internally', match_strength: 78, message_draft: 'Hi Nikhil — we overlapped at VIT, and I noticed Datadog is hiring a Senior Platform Engineer. I spent three years on observability ingestion at 3GP.AI. Would a referral be something you would consider?', channel: 'email', status: 'drafted' },
]))

// ── 10. Activity feed ─────────────────────────────────────────────────
console.log('10. activity')
const activity = [
  ['Referral accepted', 'Priya Raman agreed to refer you at Stripe', 28],
  ['Interview scheduled', 'Anthropic — Senior Backend Engineer, technical round', 4],
  ['Application submitted', 'Cloudflare — Platform Engineer, via Greenhouse', 5],
  ['Resume tailored', 'Affirm — Senior Engineer, Payments (+7 keywords)', 4],
  ['Application submitted', 'Affirm — Senior Engineer, Payments', 4],
  ['Cover letter generated', 'Vercel — Backend Engineer', 8],
  ['Match scored', 'Scale AI — Staff Engineer, ML Platform scored 89', 3],
  ['Referral drafted', 'Nikhil Rao at Datadog', 2],
  ['Moved to screening', 'Databricks — Software Engineer, Infrastructure', 10],
  ['Offer received', 'Stripe — Staff Software Engineer', 2],
]
await insert(
  'apply_log',
  activity.map(([action, details, d]) => ({ user_id: userId, action, details, created_at: daysAgo(d) }))
)

console.log('\n─────────────────────────────────────────')
console.log('  DEMO ACCOUNT READY')
console.log(`  ${EMAIL}`)
console.log(`  ${PASSWORD}`)
console.log('─────────────────────────────────────────')
