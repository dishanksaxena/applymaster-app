const main = document.getElementById('main')
const send = (type, payload = {}) => chrome.runtime.sendMessage({ type, ...payload })
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

async function render() {
  const s = await send('status')
  if (!s?.connected) {
    main.innerHTML = `
      <p class="muted">Connect this browser to your ApplyMaster account to fill job applications from your profile.</p>
      <button class="primary" id="connect">Connect to ApplyMaster</button>`
    document.getElementById('connect').onclick = () => send('open', { path: '/extension' }).then(() => window.close())
    return
  }
  main.innerHTML = `
    <p class="who">Connected as <b>${esc(s.email || 'your account')}</b></p>
    <p class="muted">On Workday, Greenhouse, Lever, Ashby, iCIMS, Taleo, SuccessFactors, SmartRecruiters, Workable, Jobvite, Recruitee, Teamtailor, Indeed and LinkedIn Easy Apply the Fill button appears by itself. On any other site, use this:</p>
    <button class="primary" id="fill">Fill this page</button>
    <button class="quiet" id="tracker">Open my applications</button>
    <button class="link" id="disconnect">Disconnect</button>
    <p class="err" id="err" hidden></p>`
  document.getElementById('fill').onclick = async () => {
    const r = await send('fill-active-tab')
    if (r?.error) {
      const e = document.getElementById('err')
      e.textContent = r.error
      e.hidden = false
    } else window.close()
  }
  document.getElementById('tracker').onclick = () => send('open', { path: '/applications' }).then(() => window.close())
  document.getElementById('disconnect').onclick = async () => {
    await send('disconnect')
    render()
  }
}

render()
