import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from './supabase-admin'

/**
 * The structured copy of a resume that the optimizer, tailoring and match
 * scoring read from (`parsed_resumes`).
 *
 * There were two upload paths and only one wrote this row. The Resume page
 * (/api/resume/upload) did; onboarding (/api/resume/extract) — where nearly
 * every new user uploads first — kept the parsed data on `resumes.parsed_data`
 * and never wrote it. So for 61 of the 70 people with a resume, the
 * optimizer said "No resume found", tailoring said "Resume not yet parsed",
 * and match scoring failed, with nothing to tell them why.
 *
 * Both paths now save through `saveParsedResume`, and every reader goes
 * through `loadParsedResume`, which repairs a missing row from
 * `resumes.parsed_data` instead of failing.
 */

type Parsed = Record<string, unknown>

const arr = (v: unknown) => (Array.isArray(v) ? v : [])
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null)

function rowFrom(resumeId: string, userId: string, parsed: Parsed, rawText?: string | null) {
  return {
    resume_id: resumeId,
    user_id: userId,
    full_name: str(parsed.full_name),
    email: str(parsed.email),
    phone: str(parsed.phone),
    location: str(parsed.location),
    summary: str(parsed.summary),
    skills: arr(parsed.skills),
    experience: arr(parsed.experience),
    education: arr(parsed.education),
    certifications: arr(parsed.certifications),
    languages: arr(parsed.languages),
    raw_text: str(rawText) ?? str(parsed.raw_text),
  }
}

/** Write (or replace) the structured row for one resume. */
export async function saveParsedResume(resumeId: string, userId: string, parsed: Parsed, rawText?: string | null) {
  const admin = createAdminClient()
  const row = rowFrom(resumeId, userId, parsed, rawText)
  const { data: existing } = await admin.from('parsed_resumes').select('id').eq('resume_id', resumeId).maybeSingle()
  const { error } = existing
    ? await admin.from('parsed_resumes').update(row).eq('id', existing.id)
    : await admin.from('parsed_resumes').insert(row)
  if (error) console.error('saveParsedResume failed:', error.message)
  return !error
}

/**
 * The signed-in user's parsed resume — a specific one, or their primary.
 *
 * `db` must be the user's own session client: the resume row is read under
 * row-level security, so a resume id belonging to someone else finds nothing.
 */
export async function loadParsedResume(
  db: SupabaseClient,
  userId: string,
  resumeId?: string | null
): Promise<{ resumeId: string; parsed: Parsed } | null> {
  let q = db.from('resumes').select('id, parsed_data').eq('user_id', userId)
  q = resumeId ? q.eq('id', resumeId) : q.eq('is_primary', true)
  const { data: resume } = await q.order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (!resume) return null

  const { data: row } = await db.from('parsed_resumes').select('*').eq('resume_id', resume.id).maybeSingle()
  if (row) return { resumeId: resume.id, parsed: row as Parsed }

  // Repair: onboarding uploads kept the parsed data on the resume row only.
  const pd = resume.parsed_data as Parsed | null
  if (pd && Object.keys(pd).length) {
    await saveParsedResume(resume.id, userId, pd)
    return { resumeId: resume.id, parsed: rowFrom(resume.id, userId, pd) as Parsed }
  }
  return null
}
