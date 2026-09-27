'use client'

/**
 * Profile photos for the people on screen. The server looks each person up
 * and stores the result; this asks for the people someone is actually
 * looking at, a batch at a time, and reports photos as they arrive.
 */

const PREF = 'am_li_photos'
const PER_CALL = 16 // what the server looks up per request
const RECHECK_MS = 7 * 86_400_000 // same as the server: no photo -> look again after a week

/** Whether to look up photos at all. Chosen on the import screen; on unless turned off. */
export function photosEnabled() {
  try {
    return localStorage.getItem(PREF) !== '0'
  } catch {
    return true
  }
}

export function setPhotosEnabled(on: boolean) {
  try {
    localStorage.setItem(PREF, on ? '1' : '0')
  } catch {}
}

/** Worth asking the server about: no photo yet, and not looked at in the last week. */
export const needsPhoto = (c: { linkedin_url?: string | null; photo_url?: string | null; photo_checked_at?: string | null }) =>
  !!c.linkedin_url && !c.photo_url && (!c.photo_checked_at || Date.parse(c.photo_checked_at) < Date.now() - RECHECK_MS)

export type PhotoBatch = { photos: Record<string, string | null>; byUrl: Record<string, string | null> }

const chunks = <T,>(list: T[]) => Array.from({ length: Math.ceil(list.length / PER_CALL) }, (_, i) => list.slice(i * PER_CALL, (i + 1) * PER_CALL))

/** Ask once per person, a server-sized batch at a time. Stops at the daily cap. */
export async function fillPhotos(
  who: { ids?: string[]; linkedin_urls?: string[] },
  onBatch: (b: PhotoBatch) => void,
  isCancelled: () => boolean = () => false
) {
  if (!photosEnabled()) return
  const calls = [
    ...chunks(who.ids ?? []).map(ids => ({ ids })),
    ...chunks(who.linkedin_urls ?? []).map(linkedin_urls => ({ linkedin_urls })),
  ]
  for (const body of calls) {
    if (isCancelled()) return
    const res = await fetch('/api/network/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null)
    if (!res?.ok) return
    const json = (await res.json().catch(() => null)) as (PhotoBatch & { capped: boolean }) | null
    if (!json) return
    if (!isCancelled()) onBatch(json)
    if (json.capped) return
  }
}
