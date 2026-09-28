/*
 * ApplyMaster extension: background worker.
 *
 * The only part that talks to ApplyMaster. Content scripts on employers'
 * pages ask it for the applicant's details and answers, and hand it the
 * receipt when an application is submitted; they never see the key.
 *
 * The key is minted on applymaster.ai/extension and handed over by
 * connect.js. Only origins listed in ALLOWED_ORIGINS can connect — the build
 * fills it in (production: applymaster.ai only).
 */

const ALLOWED_ORIGINS = __ALLOWED_ORIGINS__

// Applications submitted in a tab, waiting for the employer's confirmation page.
const PENDING_TTL = 30 * 60 * 1000

async function auth() {
  const { token, apiBase, email } = await chrome.storage.local.get(['token', 'apiBase', 'email'])
  return token && apiBase ? { token, apiBase, email } : null
}

async function api(path, body) {
  const a = await auth()
  if (!a) return { error: 'not_connected' }
  let res
  try {
    res = await fetch(a.apiBase + path, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${a.token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    return { error: 'ApplyMaster could not be reached. Check your connection.' }
  }
  if (res.status === 401) {
    // Disconnected from the website, or the key was revoked.
    await chrome.storage.local.remove(['token', 'email'])
    return { error: 'not_connected' }
  }
  const json = await res.json().catch(() => ({}))
  return res.ok ? json : { error: json.error || 'Something went wrong' }
}

async function pendingFor(tabId) {
  const key = `pending:${tabId}`
  const got = (await chrome.storage.session.get(key))[key]
  if (!got || Date.now() - got.at > PENDING_TTL) return null
  return got
}

function toBase64(bytes) {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

async function handle(msg, sender) {
  const tabId = sender.tab?.id
  switch (msg.type) {
    case 'connect': {
      // Only from ApplyMaster's own page, and only the origin that page is on.
      const from = sender.url ? new URL(sender.url).origin : null
      if (!ALLOWED_ORIGINS.includes(msg.origin) || from !== msg.origin || typeof msg.token !== 'string') {
        return { error: 'This page cannot connect the extension.' }
      }
      await chrome.storage.local.set({ token: msg.token, apiBase: msg.origin })
      const me = await api('/api/extension/me')
      if (me.error) return { error: me.error === 'not_connected' ? 'That key was not accepted. Try again.' : me.error }
      await chrome.storage.local.set({ email: me.email })
      return { ok: true, email: me.email }
    }
    case 'status': {
      const a = await auth()
      return { connected: !!a, email: a?.email ?? null, apiBase: a?.apiBase ?? ALLOWED_ORIGINS[0] }
    }
    case 'disconnect':
      await chrome.storage.local.remove(['token', 'email'])
      return { ok: true }
    case 'packet':
      return api('/api/apply/packet', { url: msg.url })
    case 'answers':
      return api('/api/apply/answers', { questions: msg.questions, url: msg.url, job_title: msg.job_title, company: msg.company })
    case 'resume': {
      // A short-lived signed link to the person's own resume file.
      try {
        const res = await fetch(msg.url)
        if (!res.ok) return { error: 'Could not download your resume' }
        return { base64: toBase64(new Uint8Array(await res.arrayBuffer())), type: res.headers.get('content-type') || 'application/pdf' }
      } catch {
        return { error: 'Could not download your resume' }
      }
    }
    case 'pending:set':
      if (tabId == null) return { error: 'no tab' }
      await chrome.storage.session.set({ [`pending:${tabId}`]: { ...msg.pending, at: Date.now() } })
      return { ok: true }
    case 'pending:get':
      return tabId == null ? null : pendingFor(tabId)
    case 'pending:clear':
      if (tabId != null) await chrome.storage.session.remove(`pending:${tabId}`)
      return { ok: true }
    case 'record': {
      const res = await api('/api/apply/record', msg.record)
      if (!res.error && tabId != null) await chrome.storage.session.remove(`pending:${tabId}`)
      return res
    }
    case 'ack:get': {
      // Warnings the person has read (LinkedIn's rules), so they are shown once.
      const { acks = {} } = await chrome.storage.local.get('acks')
      return { ok: !!acks[msg.key] }
    }
    case 'ack:set': {
      const { acks = {} } = await chrome.storage.local.get('acks')
      await chrome.storage.local.set({ acks: { ...acks, [msg.key]: Date.now() } })
      return { ok: true }
    }
    case 'open': {
      const a = await auth()
      const base = a?.apiBase ?? ALLOWED_ORIGINS[0]
      await chrome.tabs.create({ url: base + (msg.path || '/applications') })
      return { ok: true }
    }
    case 'fill-active-tab': {
      // From the popup, on any site: the click is the permission (activeTab).
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id || !/^https?:/.test(tab.url || '')) return { error: 'Open a job application page first.' }
      await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ['content.js'] })
      await chrome.tabs.sendMessage(tab.id, { type: 'am:open' }).catch(() => {})
      return { ok: true }
    }
    default:
      return { error: 'unknown message' }
  }
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  handle(msg, sender).then(reply, e => reply({ error: String(e?.message || e) }))
  return true // answer asynchronously
})
