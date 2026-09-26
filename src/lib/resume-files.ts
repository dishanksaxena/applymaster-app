import 'server-only'
import { createAdminClient } from './supabase-admin'

/**
 * Resume files live in a private bucket, but every row stores the URL that
 * `getPublicUrl` produced at upload time. For a private bucket that URL
 * answers "Bucket not found", so any link built from it was dead — including
 * the Download link on application receipts. Privacy was never at risk; the
 * links simply did not work.
 *
 * Callers turn a stored URL into a short-lived signed one. Only ever do this
 * after checking the requester owns the file.
 */

const MARKERS = ['/object/public/resumes/', '/object/sign/resumes/', '/object/resumes/']

/** The object path inside the bucket, or null if this is not a resumes URL. */
export function resumeObjectPath(storedUrl: string): string | null {
  for (const m of MARKERS) {
    const i = storedUrl.indexOf(m)
    if (i !== -1) return decodeURIComponent(storedUrl.slice(i + m.length).split('?')[0])
  }
  return null
}

export async function signResumeUrl(storedUrl: string, seconds = 600): Promise<string | null> {
  const path = resumeObjectPath(storedUrl)
  if (!path) return storedUrl // stored elsewhere; nothing to sign
  const { data } = await createAdminClient().storage.from('resumes').createSignedUrl(path, seconds)
  return data?.signedUrl ?? null
}
