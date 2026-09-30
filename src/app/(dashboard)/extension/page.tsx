'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Installing and connecting the ApplyMaster Chrome extension.
 *
 * The extension fills application forms on employers' own sites; this page
 * is where it gets its key. The page mints one per browser and hands it to
 * the extension through its connect script, which only runs here.
 */

type Connection = { id: string; label: string | null; created_at: string; last_used_at: string | null }

const STORE = 'https://chromewebstore.google.com/detail/applymaster-fill-job-appl/jpnbfdkbfgeojdihbolnnipjmkhjnfni'
// For browsers without the store (and for testing a build before it is published).
const ZIP = '/downloads/applymaster-extension.zip'

function browserLabel() {
  const ua = navigator.userAgent
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /CrOS/.test(ua) ? 'ChromeOS' : /Linux/.test(ua) ? 'Linux' : 'this computer'
  const browser = /Edg\//.test(ua) ? 'Edge' : /Brave/.test(ua) ? 'Brave' : 'Chrome'
  return `${browser} on ${os}`
}

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'never'

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <section className="flex gap-4 p-5 rounded-2xl" style={{ background: 'var(--bg-card)', boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}>
      <span
        className="grid place-items-center w-8 h-8 rounded-full text-[13px] font-bold shrink-0"
        style={done ? { background: 'var(--green)', color: '#fff' } : { background: 'var(--accent-dim)', color: 'var(--accent)' }}
        aria-hidden="true"
      >
        {done ? '✓' : n}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
          {title}
        </h2>
        <div className="mt-1.5 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {children}
        </div>
      </div>
    </section>
  )
}

export default function ExtensionPage() {
  const [installed, setInstalled] = useState<string | null>(null)
  const [linked, setLinked] = useState<{ connected: boolean; email: string | null }>({ connected: false, email: null })
  const [connections, setConnections] = useState<Connection[]>([])
  const [ready, setReady] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const waiter = useRef<((d: { ok: boolean; email: string | null; error: string | null }) => void) | null>(null)

  const loadConnections = useCallback(async () => {
    const r = await fetch('/api/extension/connect').catch(() => null)
    const j = await r?.json().catch(() => null)
    if (j) {
      setConnections(j.connections ?? [])
      setReady(j.ready !== false)
    }
  }, [])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window || e.origin !== location.origin) return
      const d = e.data
      if (d?.source !== 'applymaster-extension') return
      setInstalled(d.version ?? 'installed')
      if (d.type === 'status') setLinked({ connected: !!d.connected, email: d.email ?? null })
      if (d.type === 'connected') waiter.current?.(d)
    }
    window.addEventListener('message', onMessage)
    const ask = () => {
      const v = document.documentElement.dataset.applymasterExtension
      if (v) setInstalled(v)
      window.postMessage({ source: 'applymaster-page', type: 'status' }, location.origin)
    }
    ask()
    const t = setInterval(ask, 2000)
    loadConnections()
    return () => {
      window.removeEventListener('message', onMessage)
      clearInterval(t)
    }
  }, [loadConnections])

  const connect = async () => {
    setBusy(true)
    setError('')
    try {
      const r = await fetch('/api/extension/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: browserLabel() }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.token) throw new Error(j.error || 'Could not create a connection')
      const reply = await new Promise<{ ok: boolean; email: string | null; error: string | null }>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('The extension did not answer. Reload this page and try again.')), 10000)
        waiter.current = d => {
          clearTimeout(timer)
          resolve(d)
        }
        window.postMessage({ source: 'applymaster-page', type: 'connect', token: j.token }, location.origin)
      })
      if (!reply.ok) throw new Error(reply.error || 'The extension could not connect')
      setLinked({ connected: true, email: reply.email })
      loadConnections()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not connect')
    } finally {
      waiter.current = null
      setBusy(false)
    }
  }

  const disconnect = async (c: Connection) => {
    await fetch(`/api/extension/connect?id=${c.id}`, { method: 'DELETE' })
    // Another browser's key stops working on its next call; this one can forget its key now.
    if (c.label === browserLabel()) {
      window.postMessage({ source: 'applymaster-page', type: 'disconnect' }, location.origin)
      setLinked({ connected: false, email: null })
    }
    loadConnections()
  }

  const primary = { background: 'var(--accent-solid)', color: 'var(--text-on-accent)' } as const
  const quiet = { background: 'var(--bg-overlay)', color: 'var(--text)' } as const

  return (
    <div className="max-w-[760px] mx-auto">
      <h1 className="font-display text-[clamp(1.75rem,2.6vw,2.15rem)] leading-tight" style={{ color: 'var(--text)' }}>
        Chrome extension
      </h1>
      <p className="text-[13.5px] mt-1 max-w-[60ch]" style={{ color: 'var(--text-muted)' }}>
        Fills job applications from your profile, right on the employer&apos;s site. You check the answers and press Submit; ApplyMaster
        records it with a receipt.
      </p>

      <div className="mt-6 space-y-3">
        <Step n={1} title="Install it" done={!!installed}>
          {installed ? (
            <p>Installed in this browser (version {installed}).</p>
          ) : (
            <>
              <p>Free, from the Chrome Web Store. Works in Chrome, Edge and Brave.</p>
              <a
                href={STORE}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold"
                style={{ background: 'var(--accent-solid)', color: 'var(--text-on-accent)' }}
              >
                Add to Chrome
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </a>
              <p className="mt-2 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
                Once it&apos;s added, come back and{' '}
                <button type="button" onClick={() => location.reload()} className="underline underline-offset-2" style={{ color: 'var(--accent)' }}>
                  reload this page
                </button>
                .
              </p>
              <details className="mt-3 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
                <summary className="cursor-pointer">Can&apos;t use the Chrome Web Store?</summary>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>
                    <a href={ZIP} download className="font-semibold underline underline-offset-2" style={{ color: 'var(--accent)' }}>
                      Download the extension
                    </a>{' '}
                    and unzip it.
                  </li>
                  <li>
                    Open <code className="px-1 rounded" style={{ background: 'var(--bg-overlay)' }}>chrome://extensions</code> and switch on{' '}
                    <strong style={{ color: 'var(--text)' }}>Developer mode</strong> (top right).
                  </li>
                  <li>
                    Click <strong style={{ color: 'var(--text)' }}>Load unpacked</strong> and choose the{' '}
                    <code className="px-1 rounded" style={{ background: 'var(--bg-overlay)' }}>applymaster-extension</code> folder, then reload this page.
                  </li>
                </ol>
              </details>
            </>
          )}
        </Step>

        <Step n={2} title="Connect it to your account" done={linked.connected}>
          {linked.connected ? (
            <p>
              Connected as <strong style={{ color: 'var(--text)' }}>{linked.email ?? 'you'}</strong>. Open any job application to try it.
            </p>
          ) : (
            <>
              <p>The extension gets its own key for this browser. It never sees your password, and you can disconnect it here any time.</p>
              {!ready && (
                <p className="mt-2" style={{ color: 'var(--yellow)' }}>
                  Connections are being set up. Try again in a few minutes.
                </p>
              )}
              <button
                type="button"
                onClick={connect}
                disabled={!installed || busy || !ready}
                className="mt-3 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold disabled:opacity-45"
                style={primary}
              >
                {busy ? 'Connecting…' : installed ? 'Connect this browser' : 'Install the extension first'}
              </button>
              {error && (
                <p role="alert" className="mt-2 text-[12.5px]" style={{ color: 'var(--red)' }}>
                  {error}
                </p>
              )}
            </>
          )}
        </Step>

        <Step n={3} title="Apply" done={false}>
          <ul className="space-y-1.5">
            <li>
              Open an application on <strong style={{ color: 'var(--text)' }}>Workday, Greenhouse, Lever, Ashby, iCIMS, Taleo, SuccessFactors, SmartRecruiters, Workable, Jobvite, Recruitee, Teamtailor, Indeed or LinkedIn Easy Apply</strong> and press{' '}
              <strong style={{ color: 'var(--text)' }}>Fill with ApplyMaster</strong>. On any other site, click the ApplyMaster button in
              Chrome&apos;s toolbar.
            </li>
            <li>It fills your details, attaches your resume and answers the standard questions. Anything written from your resume is highlighted in amber: read those.</li>
            <li>On forms with several pages (Workday, Indeed, LinkedIn), each page is filled as you reach it, including your work history and education on Workday. You press every Next yourself.</li>
            <li>
              LinkedIn does not allow extensions that automate activity on LinkedIn and may restrict accounts it believes use them. ApplyMaster
              only fills the Easy Apply form, and asks before the first time. Whether to use it there is your call.
            </li>
            <li>You check everything, complete any CAPTCHA and press the form&apos;s Submit. When the employer confirms, it&apos;s in your tracker as Applied, with a receipt.</li>
          </ul>
        </Step>
      </div>

      <section className="mt-8">
        <h2 className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-faint)' }}>
          What it never does
        </h2>
        <ul className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          <li>Press Submit for you</li>
          <li>Solve CAPTCHAs</li>
          <li>Answer gender, ethnicity, veteran or disability questions</li>
          <li>Tick consent boxes</li>
          <li>Read other sites, unless you click its button there</li>
          <li>Send voluntary answers to ApplyMaster</li>
        </ul>
      </section>

      {connections.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-faint)' }}>
            Connected browsers
          </h2>
          <ul className="mt-2 rounded-xl overflow-hidden" style={{ boxShadow: 'inset 0 0 0 1px var(--card-ring)' }}>
            {connections.map((c, i) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <div>
                  <p className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>
                    {c.label ?? 'Browser'}
                  </p>
                  <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    Connected {when(c.created_at)} · last used {when(c.last_used_at)}
                  </p>
                </div>
                <button type="button" onClick={() => disconnect(c)} className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold" style={quiet}>
                  Disconnect
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
