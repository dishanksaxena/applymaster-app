import { createSign } from 'node:crypto'

/**
 * Google Indexing API client (service account, no SDK).
 *
 * Google accepts this API only for pages carrying JobPosting or
 * BroadcastEvent structured data. Callers must send job pages only;
 * anything else is outside the API's terms and is ignored.
 *
 * Credentials: GOOGLE_INDEXING_KEY_B64 is base64 of
 * {"client_email": "...", "private_key": "..."}. The service account must be
 * an Owner of the Search Console property, or every call returns 403.
 */

const SCOPE = 'https://www.googleapis.com/auth/indexing'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const BATCH_URL = 'https://indexing.googleapis.com/batch'
const PUBLISH_PATH = '/v3/urlNotifications:publish'

/** Default Google quota for publish requests per project per day. */
export const DAILY_QUOTA = 200

type Key = { client_email: string; private_key: string }
export type NotifyType = 'URL_UPDATED' | 'URL_DELETED'
export type NotifyResult = { url: string; status: number; error?: string }

function readKey(): Key | null {
  const raw = process.env.GOOGLE_INDEXING_KEY_B64
  if (!raw) return null
  try {
    const k = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'))
    return k.client_email && k.private_key ? k : null
  } catch {
    return null
  }
}

export const isConfigured = () => readKey() !== null

const b64url = (s: string | Buffer) => Buffer.from(s).toString('base64url')

async function accessToken(key: Key): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64url(JSON.stringify({ iss: key.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }))
  const signer = createSign('RSA-SHA256')
  signer.update(`${head}.${claim}`)
  const jwt = `${head}.${claim}.${b64url(signer.sign(key.private_key))}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.access_token) throw new Error(`token ${res.status}: ${body.error_description || body.error || 'no token'}`)
  return body.access_token as string
}

/** One multipart batch of up to 100 notifications. */
async function sendBatch(token: string, urls: string[], type: NotifyType): Promise<NotifyResult[]> {
  const boundary = `am_batch_${Date.now().toString(36)}`
  const parts = urls.map((url, i) =>
    [
      `--${boundary}`,
      'Content-Type: application/http',
      `Content-ID: <item${i}>`,
      '',
      `POST ${PUBLISH_PATH}`,
      'Content-Type: application/json',
      '',
      JSON.stringify({ url, type }),
    ].join('\r\n')
  )
  const res = await fetch(BATCH_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/mixed; boundary=${boundary}` },
    body: `${parts.join('\r\n')}\r\n--${boundary}--`,
  })
  const text = await res.text()
  if (!res.ok) return urls.map(url => ({ url, status: res.status, error: text.slice(0, 200) }))

  // Each response part carries "HTTP/1.1 <code>" and a JSON body; parts come back in request order.
  const chunks = text.split(/--batch_[^\r\n]*/).filter(c => /HTTP\/1\.1 \d{3}/.test(c))
  return urls.map((url, i) => {
    const c = chunks[i] ?? ''
    const status = Number(/HTTP\/1\.1 (\d{3})/.exec(c)?.[1] ?? 0)
    const msg = /"message":\s*"([^"]+)"/.exec(c)?.[1]
    return status === 200 ? { url, status } : { url, status, error: msg ?? 'no response for this item' }
  })
}

/** Notify Google about up to `limit` URLs, in batches of 100. */
export async function notify(urls: string[], type: NotifyType = 'URL_UPDATED', limit = DAILY_QUOTA): Promise<NotifyResult[]> {
  const key = readKey()
  if (!key) throw new Error('GOOGLE_INDEXING_KEY_B64 is not set')
  const list = urls.slice(0, limit)
  if (!list.length) return []
  const token = await accessToken(key)
  const out: NotifyResult[] = []
  for (let i = 0; i < list.length; i += 100) out.push(...(await sendBatch(token, list.slice(i, i + 100), type)))
  return out
}
