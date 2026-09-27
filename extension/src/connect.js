/*
 * ApplyMaster extension: runs on applymaster.ai/extension only.
 *
 * Tells the page the extension is installed, and passes the key the page
 * mints to the background worker. Messages are accepted only from this same
 * window and origin.
 */
;(() => {
  const version = chrome.runtime.getManifest().version
  const mark = () => document.documentElement && (document.documentElement.dataset.applymasterExtension = version)
  mark()
  document.addEventListener('DOMContentLoaded', mark)

  const post = data => window.postMessage({ source: 'applymaster-extension', version, ...data }, location.origin)

  window.addEventListener('message', async e => {
    if (e.source !== window || e.origin !== location.origin) return
    const d = e.data
    if (!d || d.source !== 'applymaster-page') return
    if (d.type === 'status') {
      const s = await chrome.runtime.sendMessage({ type: 'status' })
      post({ type: 'status', connected: !!s?.connected, email: s?.email ?? null })
    }
    if (d.type === 'connect' && typeof d.token === 'string') {
      const res = await chrome.runtime.sendMessage({ type: 'connect', token: d.token, origin: location.origin })
      post({ type: 'connected', ok: !!res?.ok, email: res?.email ?? null, error: res?.error ?? null })
    }
    if (d.type === 'disconnect') {
      await chrome.runtime.sendMessage({ type: 'disconnect' })
      post({ type: 'status', connected: false, email: null })
    }
  })
})()
