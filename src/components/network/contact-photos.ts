'use client'

/**
 * Profile photos for the people on screen. The server looks each person up
 * once and stores the result; this asks for the people someone is actually
 * looking at, a batch at a time, and reports photos as they arrive.
 */

const PREF = 'am_li_photos'

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

export type PhotoBatch = { photos: Record<string, string | null>; byUrl: Record<string, string | null> }

export async function fillPhotos(
  who: { ids?: string[]; linkedin_urls?: string[] },
  onBatch: (b: PhotoBatch) => void,
  isCancelled: () => boolean = () => false
) {
  const want = (who.ids?.length ?? 0) + (who.linkedin_urls?.length ?? 0)
  if (!want || !photosEnabled()) return
  let seen = -1
  // The server does up to 16 lookups per call; keep going while it makes progress.
  for (let round = 0; round < Math.ceil(want / 16) + 2 && !isCancelled(); round++) {
    const res = await fetch('/api/network/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(who),
    }).catch(() => null)
    if (!res?.ok) return
    const json = (await res.json().catch(() => null)) as (PhotoBatch & { pending: number; limited: boolean; capped: boolean }) | null
    if (!json) return
    if (!isCancelled()) onBatch(json)
    const answered = Object.keys(json.photos).length
    if (!json.pending || json.limited || json.capped || answered === seen) return
    seen = answered
  }
}
