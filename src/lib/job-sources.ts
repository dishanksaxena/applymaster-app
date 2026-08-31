/**
 * The job sources this product can actually reach.
 *
 * The auto-apply page used to show LinkedIn, Indeed, Glassdoor and
 * ZipRecruiter as toggleable "Job Sources". No code anywhere touched any of
 * them — the toggles set a piece of local state that nothing read. A user
 * turning Indeed on and waiting for Indeed jobs would wait forever.
 *
 * This is the real list, and `checkSource` proves it at runtime rather than
 * asserting it. Two entries that used to be here are gone for the same
 * reason: Lever's v0 posting API now answers "Document not found" for every
 * org we asked for, and Ashby's job-board endpoint returns null. Listing a
 * dead integration is the same lie as listing one that was never built.
 */

export type SourceId = 'adzuna' | 'greenhouse' | 'remoteok'

export type JobSource = {
  id: SourceId
  name: string
  kind: 'aggregator' | 'ats' | 'board'
  /** What a user actually gets from it, in their words. */
  covers: string
  /** Whether applications can be submitted through it, not just read. */
  canApply: boolean
}

export const JOB_SOURCES: JobSource[] = [
  {
    id: 'adzuna',
    name: 'Adzuna',
    kind: 'aggregator',
    covers: 'Aggregates thousands of company and board listings across 20 countries',
    canApply: false,
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    kind: 'ats',
    covers: 'Direct from the careers pages of companies hiring through Greenhouse',
    canApply: true,
  },
  {
    id: 'remoteok',
    name: 'RemoteOK',
    kind: 'board',
    covers: 'Remote-first roles',
    canApply: false,
  },
]

export type SourceStatus = {
  id: SourceId
  name: string
  kind: JobSource['kind']
  covers: string
  canApply: boolean
  reachable: boolean
  sample: number | null
  checkedAt: string
  note?: string
}

const TIMEOUT = 8000

/** Ask the source for a small result set and report what came back. */
export async function checkSource(source: JobSource): Promise<SourceStatus> {
  const base = {
    id: source.id,
    name: source.name,
    kind: source.kind,
    covers: source.covers,
    canApply: source.canApply,
    checkedAt: new Date().toISOString(),
  }

  try {
    if (source.id === 'adzuna') {
      const id = process.env.ADZUNA_APP_ID
      const key = process.env.ADZUNA_APP_KEY
      if (!id || !key) {
        return { ...base, reachable: false, sample: null, note: 'No API credentials configured' }
      }
      const url = `https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${id}&app_key=${key}&results_per_page=1&what=engineer`
      const r = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) })
      const j = await r.json()
      return { ...base, reachable: r.ok, sample: typeof j?.count === 'number' ? j.count : null }
    }

    if (source.id === 'greenhouse') {
      // One well-known board is enough to tell whether the API is up.
      const r = await fetch('https://boards-api.greenhouse.io/v1/boards/stripe/jobs', {
        signal: AbortSignal.timeout(TIMEOUT),
      })
      const j = await r.json()
      return { ...base, reachable: r.ok, sample: j?.jobs?.length ?? null }
    }

    const r = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'ApplyMaster/1.0' },
      signal: AbortSignal.timeout(TIMEOUT),
    })
    const j = await r.json()
    // Index 0 is RemoteOK's legal notice, not a job.
    return { ...base, reachable: r.ok, sample: Array.isArray(j) ? Math.max(0, j.length - 1) : null }
  } catch (err) {
    return {
      ...base,
      reachable: false,
      sample: null,
      note: err instanceof Error ? err.message.slice(0, 80) : 'Unreachable',
    }
  }
}

export const checkAllSources = () => Promise.all(JOB_SOURCES.map(checkSource))
