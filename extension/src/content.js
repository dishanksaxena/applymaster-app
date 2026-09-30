/*
 * ApplyMaster extension: fills an employer's application form in the
 * person's own browser.
 *
 * What it will not do, on purpose:
 *   - press Submit, Next or Continue. The person moves through the form and
 *     sends their own application.
 *   - touch a CAPTCHA. It exists to require a person.
 *   - answer voluntary demographic questions, agree to terms, or tick
 *     consent boxes.
 *
 * After the person submits, it watches for the employer's confirmation and
 * records the application in ApplyMaster with a receipt: what was sent, and
 * what the confirmation page said.
 *
 * Sites: Greenhouse, Lever and Ashby (one page), and Workday, Indeed Apply
 * and LinkedIn Easy Apply (several pages: each new page is filled when the
 * person moves on to it).
 *
 * AMFields (field recognition, shared with the server) is prepended by the build.
 */
;(() => {
  if (window.__applymaster) return
  window.__applymaster = true
  const F = AMFields

  const HOST = location.hostname
  const VENDORS = [
    ['greenhouse', /greenhouse\.io$/],
    ['lever', /lever\.co$/],
    ['ashby', /ashbyhq\.com$/],
    ['workday', /myworkday(jobs|site)\.com$/],
    ['linkedin', /(^|\.)linkedin\.com$/],
    ['indeed', /(^|\.)indeed\.com$/],
    ['workable', /(^|\.)workable\.com$/],
    ['smartrecruiters', /(^|\.)smartrecruiters\.com$/],
    ['recruitee', /(^|\.)recruitee\.com$/],
    ['teamtailor', /(^|\.)teamtailor\.com$/],
    ['jobvite', /(^|\.)jobvite\.com$/],
    ['icims', /(^|\.)icims\.com$/],
    ['taleo', /(^|\.)taleo\.net$/],
    ['successfactors', /(^|\.)(successfactors\.(com|eu)|sapsf\.(com|eu))$/],
  ]
  const VENDOR = VENDORS.find(([, re]) => re.test(HOST))?.[0] ?? 'other'
  // Forms that go page by page inside one page load.
  const MULTI_STEP = ['workday', 'linkedin', 'indeed', 'icims', 'taleo', 'successfactors'].includes(VENDOR)

  const send = (type, payload = {}) =>
    new Promise(resolve => {
      try {
        chrome.runtime.sendMessage({ type, ...payload }, r => resolve(chrome.runtime.lastError ? { error: 'The extension was updated. Reload this page.' } : r))
      } catch {
        resolve({ error: 'The extension was updated. Reload this page.' })
      }
    })

  /* ── Reading the form ─────────────────────────────────────────────── */

  const clean = s => String(s || '').replace(/\s+/g, ' ').trim()
  const norm = s => clean(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

  const visible = el => {
    if (!el.isConnected) return false
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
  }

  /**
   * Where the application form is. On LinkedIn that is the Easy Apply dialog
   * and nothing else: the rest of LinkedIn is never read.
   */
  function formRoot() {
    if (VENDOR !== 'linkedin') return document
    const dialog = document.querySelector('.jobs-easy-apply-modal, [data-test-modal-id="easy-apply-modal"]')
    return dialog && visible(dialog) ? dialog : null
  }

  /* Forms built from web components (SmartRecruiters and others) keep their
     fields inside shadow roots, out of reach of document.querySelectorAll.
     Look inside every open one; labels are found in the field's own root. */
  function deepAll(root, sel) {
    const out = [...root.querySelectorAll(sel)]
    const walk = r => {
      for (const host of r.querySelectorAll('*')) {
        if (host.shadowRoot && host.id !== 'applymaster-root') {
          out.push(...host.shadowRoot.querySelectorAll(sel))
          walk(host.shadowRoot)
        }
      }
    }
    walk(root)
    return out
  }
  const scope = el => {
    const r = el.getRootNode()
    return r && r.querySelector ? r : document
  }
  const byId = (el, id) => scope(el).getElementById?.(id) || document.getElementById(id)

  /** A label's own words, without the text of any control inside it. */
  function textOf(node) {
    const c = node.cloneNode(true)
    c.querySelectorAll('select, option, input, textarea, button, script, style, [aria-hidden="true"], [role="listbox"]').forEach(n => n.remove())
    return clean(c.textContent)
  }

  /* A label ends at its required marker (* or Lever's ✱). Anything after it is
     the form's own status text ("Analyzing resume...", "No location found"). */
  function stripRequired(s) {
    // Workable puts the marker first ("*First name"); Teamtailor glues a word on ("First nameRequired").
    const t = clean(s).replace(/^[*✱]\s*/, '')
    const cut = t.search(/[*✱]/)
    return (cut > 0 ? t.slice(0, cut) : t)
      .replace(/\(required\)/i, '')
      .replace(/\s*\(optional\)\s*$/i, '')
      .replace(/(?<=\S)\s*Required$/, '')
      .trim()
  }

  function rawLabel(el) {
    const id = el.getAttribute('id')
    if (id) {
      const l = scope(el).querySelector(`label[for="${CSS.escape(id)}"]`)
      if (l && textOf(l)) return textOf(l)
    }
    const wrap = el.closest('label')
    if (wrap && textOf(wrap)) return textOf(wrap)
    const by = el.getAttribute('aria-labelledby')
    if (by) {
      const t = clean(by.split(/\s+/).map(i => byId(el, i)?.textContent || '').join(' '))
      if (t) return t
    }
    if (el.getAttribute('aria-label')) return clean(el.getAttribute('aria-label'))
    // Lever, Ashby, Indeed and hand-built forms: the label is a sibling in the same question block.
    const near = nearestLabel(el, 'label, legend, .application-label, [class*="label" i], [class*="question-title" i]', 4)
    if (near) return near
    return clean(el.getAttribute('placeholder') || '')
  }

  const labelOf = el => stripRequired(rawLabel(el))

  function isRequired(el, raw) {
    return el.required || el.getAttribute('aria-required') === 'true' || /[*✱]/.test(clean(raw)) || /\(required\)|required$/i.test(clean(raw))
  }

  /* Upload buttons are labelled by what they do ("Attach"); the question they
     belong to ("Resume/CV") is the heading of their block. */
  function fileLabel(el) {
    const own = rawLabel(el)
    if (own && !/^(attach|upload|browse|choose( a)? file|drop|select file|select files|enter manually)/i.test(own)) return own
    return nearestLabel(el, 'label, legend, [class*="label" i], h3, h4', 5, t => !/^(attach|upload|browse|choose|drop|select files?|enter manually)/i.test(t)) || own
  }

  /**
   * The label closest before a control, searching outward a few levels. The
   * nearest one, not the first: taking the first label in a block gave a
   * resume upload the label of the question above it (Teamtailor).
   */
  function nearestLabel(el, selector, levels, ok = () => true) {
    let node = el.parentElement
    for (let i = 0; i < levels && node && node !== document.body; i++, node = node.parentElement) {
      const before = [...node.querySelectorAll(selector)].filter(
        c => !c.contains(el) && textOf(c) && ok(textOf(c)) && c.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING
      )
      if (before.length) return textOf(before[before.length - 1])
    }
    return ''
  }

  function radioQuestion(radio) {
    const fs = radio.closest('fieldset')
    if (fs?.querySelector('legend')) return stripRequired(textOf(fs.querySelector('legend')))
    const group = radio.closest('[role="radiogroup"]')
    if (group) {
      const by = group.getAttribute('aria-labelledby')
      if (by && byId(radio, by)) return stripRequired(textOf(byId(radio, by)))
      if (group.getAttribute('aria-label')) return stripRequired(group.getAttribute('aria-label'))
    }
    // The question sits above the options, outside every option's own label.
    let node = radio.parentElement
    for (let i = 0; i < 5 && node && node !== document.body; i++, node = node.parentElement) {
      const cand = [...node.querySelectorAll('label, legend, [class*="label" i], [class*="question" i], p, span')].find(
        c => !c.querySelector('input') && !c.closest('label')?.querySelector('input[type="radio"]') && textOf(c).length > 3
      )
      if (cand && node.querySelectorAll('input[type="radio"]').length > 1) return stripRequired(textOf(cand))
    }
    return labelOf(radio)
  }

  const optionLabel = radio => {
    const id = radio.getAttribute('id')
    const l = (id && scope(radio).querySelector(`label[for="${CSS.escape(id)}"]`)) || radio.closest('label')
    return clean(l ? textOf(l) : radio.value)
  }

  /* Workday's work history and education blocks are filled from the resume,
     entry by entry (see fillHistory); the general pass leaves them alone. */
  const HISTORY = /^(workExperience|education)-\d+/
  const historyBlock = el => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const id = n.getAttribute?.('data-automation-id') || ''
      if (HISTORY.test(id)) return n
      if (n === el && HISTORY.test(n.id || '')) return n.closest('[data-automation-id], [role="group"]') || n.parentElement
    }
    return null
  }

  // Workday dropdowns are buttons that open a list; its search boxes are inputs that do.
  // Also SAP UI5 (SuccessFactors): a div with role="combobox" that opens a list — unless it wraps its own input.
  const isListButton = el =>
    (el.tagName === 'BUTTON' && el.getAttribute('aria-haspopup') === 'listbox') ||
    (el.getAttribute('role') === 'combobox' && !['INPUT', 'TEXTAREA'].includes(el.tagName) && !el.querySelector('input, textarea'))
  const isSearchPrompt = el => el.getAttribute('data-uxi-widget-type') === 'selectinput' || !!el.closest('[data-automation-id="multiSelectContainer"]')

  /** Every control a person would fill, grouped the way they read them. */
  function controls() {
    const root = formRoot()
    if (!root) return []
    const out = []
    const seen = new Set()
    const radioNames = new Set()
    for (const el of deepAll(root, 'input, textarea, select, button[aria-haspopup="listbox"], [role="combobox"]:not(input):not(textarea)')) {
      if (seen.has(el) || el.closest('#applymaster-root')) continue
      seen.add(el)
      if (VENDOR === 'workday' && historyBlock(el)) continue
      const type = (el.getAttribute('type') || el.tagName).toLowerCase()
      if (['hidden', 'submit', 'reset', 'image', 'search', 'password', 'checkbox'].includes(type)) continue
      if (el.tagName === 'INPUT' && type === 'button') continue
      if (el.disabled) continue
      if (type === 'file') {
        const raw = fileLabel(el)
        out.push({ el, kind: 'file', label: stripRequired(raw), required: isRequired(el, raw) })
        continue
      }
      if (!visible(el)) continue
      if (isListButton(el)) {
        const raw = rawLabel(el)
        out.push({ el, kind: 'listbutton', label: stripRequired(raw).replace(/\s*select one\s*(required)?$/i, ''), required: isRequired(el, raw) })
        continue
      }
      // Helper inputs that sit behind custom dropdowns (tabindex -1). Typing into
      // one would fake a required answer without choosing anything.
      if (el.tabIndex < 0 && el.getAttribute('role') !== 'combobox' && type !== 'radio') continue
      const raw = rawLabel(el)
      if (type === 'radio') {
        const key = el.name || radioQuestion(el)
        if (radioNames.has(key)) continue
        radioNames.add(key)
        const group = el.name ? [...scope(el).querySelectorAll(`input[type="radio"][name="${CSS.escape(el.name)}"]`)] : [el]
        out.push({ el, kind: 'radio', group, label: radioQuestion(el), required: group.some(r => r.required || r.getAttribute('aria-required') === 'true') })
        continue
      }
      if (el.readOnly && el.getAttribute('role') !== 'combobox') continue
      const kind =
        el.getAttribute('role') === 'combobox' || isSearchPrompt(el) ? 'combobox' : el.tagName === 'SELECT' ? 'select' : el.tagName === 'TEXTAREA' ? 'textarea' : 'text'
      out.push({ el, kind, label: labelOf(el), required: isRequired(el, raw) })
    }
    return out.filter(c => c.label)
  }

  function currentValue(c) {
    if (c.kind === 'radio') {
      const on = c.group.find(r => r.checked)
      return on ? optionLabel(on) : ''
    }
    if (c.kind === 'select') {
      const o = c.el.selectedOptions[0]
      return c.el.value && o && !/^(select|choose|please select|--)/i.test(clean(o.textContent)) ? clean(o.textContent) : ''
    }
    if (c.kind === 'file') return c.el.files?.[0]?.name || ''
    if (c.kind === 'listbutton') {
      const t = clean(c.el.textContent)
      return /^(select one|select|choose)?$/i.test(t) ? '' : t
    }
    if (c.kind === 'combobox') {
      // react-select shows the choice beside the input; Workday lists it as a chip.
      const box = c.el.parentElement?.closest('[class*="container" i], [class*="select" i], [data-automation-id="multiSelectContainer"]')
      const shown = box?.querySelector('[class*="single-value" i], [class*="singleValue" i], [data-automation-id="selectedItem"]')
      return clean(shown?.textContent || c.el.value)
    }
    return clean(c.el.value)
  }

  /* ── Filling ──────────────────────────────────────────────────────── */

  const setter = el =>
    Object.getOwnPropertyDescriptor(
      el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype,
      'value'
    ).set

  function setText(el, value) {
    el.focus()
    // React keeps its own copy of the value; the native setter plus an input event updates both.
    setter(el).call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    el.blur()
    // Phone fields often reformat as they go ("+1 415…" becomes "(415) …"); what matters is that it took.
    return clean(el.value) !== ''
  }

  /** Which of these options says the same as the answer. */
  function matchOption(texts, answer) {
    const a = norm(answer)
    if (!a) return -1
    const n = texts.map(norm)
    let i = n.findIndex(t => t === a)
    if (i >= 0) return i
    // "Yes" against "Yes, I am authorized to work in the US"
    i = n.findIndex(t => t.startsWith(a + ' '))
    if (i >= 0) return i
    i = n.findIndex(t => t.length > 2 && (a.startsWith(t + ' ') || a === t))
    if (i >= 0) return i
    // Numbers against ranges: "4" against "3-5 years". Read from the original
    // text: normalising drops the dash and the plus sign that carry the range.
    const num = parseFloat(a)
    if (!isNaN(num)) {
      i = texts.map(t => clean(t).toLowerCase()).findIndex(t => {
        const r = t.match(/(\d+)\s*(?:to|-)\s*(\d+)/)
        if (r) return num >= +r[1] && num <= +r[2]
        const plus = t.match(/(\d+)\s*\+|more than (\d+)|over (\d+)/)
        if (plus) return num >= +(plus[1] || plus[2] || plus[3])
        return false
      })
    }
    return i
  }

  function setSelect(el, answer) {
    const opts = [...el.options].filter(o => o.value !== '' && !/^(select|choose|please select|--)/i.test(clean(o.textContent)))
    const i = matchOption(opts.map(o => o.textContent), answer)
    if (i < 0) return false
    setter(el).call(el, opts[i].value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  }

  function setRadio(group, answer) {
    const i = matchOption(group.map(optionLabel), answer)
    if (i < 0) return false
    group[i].click()
    return group[i].checked
  }

  const wait = ms => new Promise(r => setTimeout(r, ms))

  /* Type the way a keyboard does. react-select (Greenhouse's dropdowns) opens
     its menu only when the edit arrives with its key events around it; a bare
     input event changes the text and leaves the menu shut. */
  function typeInto(el, text) {
    const key = text[0] || ' '
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    el.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }))
    setter(el).call(el, text)
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }))
    el.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
  }

  const pressEnter = el => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }))
    el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }))
  }

  const OPTIONS = '[role="option"], [data-automation-id="promptOption"]'
  const openOptions = () => deepAll(document, OPTIONS).filter(o => visible(o) && !o.closest('#applymaster-root'))

  function choose(opt) {
    opt.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    opt.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    opt.click()
  }

  /** react-select, Workday search boxes and friends: type, then pick the matching option. */
  async function setCombobox(el, answer) {
    el.focus()
    typeInto(el, answer)
    // Workday searches on Enter; react-select ignores it until a list is open.
    if (isSearchPrompt(el)) pressEnter(el)
    for (let t = 0; t < 15; t++) {
      await wait(90)
      const opts = openOptions()
      if (!opts.length) continue
      const i = matchOption(opts.map(o => o.textContent), answer)
      if (i < 0) break
      choose(opts[i])
      await wait(80)
      el.blur()
      return true
    }
    // Nothing matched: leave the field as it was.
    typeInto(el, '')
    el.blur()
    return false
  }

  /** Workday's dropdown: open it, pick the matching option. */
  async function setListButton(el, answer) {
    el.click()
    for (let t = 0; t < 15; t++) {
      await wait(90)
      const opts = openOptions()
      if (!opts.length) continue
      const i = matchOption(opts.map(o => o.textContent), answer)
      if (i < 0) break
      choose(opts[i])
      await wait(80)
      return true
    }
    // No match: close the list untouched.
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    return false
  }

  /* Search-as-you-type places (Lever's location, Google Places pickers): the
     form keeps only a picked suggestion and clears free text on blur. */
  const SUGGESTIONS = '[role="option"], .dropdown-location, .dropdown-results > *, .pac-item, [class*="suggestion" i] li, .basic-typeahead__selectable'
  async function setSuggested(el, value) {
    for (const text of [value, value.split(',')[0]]) {
      el.focus()
      typeInto(el, text)
      for (let t = 0; t < 16; t++) {
        await wait(120)
        const opts = [...document.querySelectorAll(SUGGESTIONS)].filter(o => visible(o) && !o.closest('#applymaster-root'))
        if (!opts.length) continue
        const want = norm(value)
        const texts = opts.map(o => norm(o.textContent))
        let i = texts.findIndex(t => t === want)
        if (i < 0) i = texts.findIndex(t => t.startsWith(want))
        if (i < 0) i = texts.findIndex(t => t.startsWith(norm(value.split(',')[0])))
        if (i < 0) break
        choose(opts[i])
        await wait(150)
        return clean(el.value) !== ''
      }
    }
    // No list appeared: plain text is all this field takes.
    return setText(el, value)
  }

  async function setAny(c, value, fieldKind) {
    if (fieldKind === 'location' && c.kind === 'text') return setSuggested(c.el, value)
    if (c.kind === 'radio') return setRadio(c.group, value)
    if (c.kind === 'select') return setSelect(c.el, value)
    if (c.kind === 'listbutton') return setListButton(c.el, value)
    if (c.kind === 'combobox') return setCombobox(c.el, value)
    return setText(c.el, value)
  }

  function attachFile(el, name, type, base64) {
    const bytes = Uint8Array.from(atob(base64), ch => ch.charCodeAt(0))
    const dt = new DataTransfer()
    dt.items.add(new File([bytes], name, { type }))
    el.files = dt.files
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    return el.files?.length === 1
  }

  const MARK = { profile: '#2e9e6b', model: '#d49a1c', needs: '#c2410c' }
  function mark(c, color) {
    const target = c.kind === 'radio' ? c.group[0].closest('fieldset, [role="radiogroup"]') || c.group[0].parentElement : c.kind === 'file' ? c.el.parentElement : c.el
    if (!target) return
    target.style.outline = `2px solid ${color}`
    target.style.outlineOffset = '2px'
    target.dataset.applymasterMarked = '1'
  }

  /* ── Workday: work history and education ──────────────────────────── */

  /** "2021-03", "03/2021", "Mar 2021", "2021" -> { month: '03' | null, year: '2021' | null }. Never invents a month. */
  function monthYear(s) {
    const t = clean(s)
    const year = t.match(/\b(19|20)\d{2}\b/)?.[0] ?? null
    let month = t.match(/\b(19|20)\d{2}[-/.](\d{1,2})\b/)?.[2] ?? t.match(/\b(\d{1,2})[-/.](19|20)\d{2}\b/)?.[1] ?? null
    if (!month) {
      const i = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].findIndex(m => t.toLowerCase().includes(m))
      if (i >= 0) month = String(i + 1)
    }
    return { month: month ? month.padStart(2, '0') : null, year }
  }

  function blocks(kind) {
    const re = new RegExp(`^${kind}-\\d+$`)
    return [...document.querySelectorAll('[data-automation-id]')].filter(n => re.test(n.getAttribute('data-automation-id')) && visible(n))
  }

  function sectionAdd(kind) {
    const section = document.querySelector(`[data-automation-id="${kind}Section"]`)
    return section && [...section.querySelectorAll('button')].find(b => /^add( another)?$/i.test(clean(b.textContent)) && visible(b))
  }

  /** The field in a block whose label matches, whatever control it is. */
  function fieldIn(block, re) {
    for (const el of block.querySelectorAll('input, textarea, button[aria-haspopup="listbox"]')) {
      const type = (el.getAttribute('type') || '').toLowerCase()
      if (['hidden', 'file'].includes(type) || !visible(el)) continue
      if (/dateSection(Month|Year)/.test(el.getAttribute('data-automation-id') || '')) continue
      const label = labelOf(el)
      if (re.test(label)) return { el, label, kind: type === 'checkbox' ? 'checkbox' : isListButton(el) ? 'listbutton' : isSearchPrompt(el) ? 'combobox' : el.tagName === 'TEXTAREA' ? 'textarea' : 'text' }
    }
    return null
  }

  /** A Workday date: month and year boxes inside the field labelled From/To. */
  function dateIn(block, re) {
    for (const wrap of block.querySelectorAll('[data-automation-id^="formField-"], fieldset, [role="group"]')) {
      const head = clean(wrap.querySelector('label, legend')?.textContent || '')
      if (!re.test(stripRequired(head))) continue
      const month = wrap.querySelector('[data-automation-id="dateSectionMonth-input"]')
      const year = wrap.querySelector('[data-automation-id="dateSectionYear-input"]')
      if (month || year) return { month, year, label: stripRequired(head) }
    }
    return null
  }

  const DEGREE = [
    [/\b(b\.?\s?sc|b\.?\s?s|b\.?\s?a|b\.?\s?tech|b\.?\s?e|bachelor)/i, /bachelor/i],
    [/\b(m\.?\s?sc|m\.?\s?s|m\.?\s?a|m\.?\s?tech|m\.?\s?eng|master)/i, /master/i],
    [/\bmba\b/i, /mba|master of business/i],
    [/\b(ph\.?\s?d|doctor)/i, /doctor|ph\.?\s?d/i],
    [/\bassociate/i, /associate/i],
  ]

  async function setDegree(el, degree) {
    if (await setListButton(el, degree)) return true
    const rule = DEGREE.find(([mine]) => mine.test(degree))
    if (!rule) return false
    el.click()
    for (let t = 0; t < 12; t++) {
      await wait(90)
      const opt = openOptions().find(o => rule[1].test(o.textContent))
      if (opt) {
        choose(opt)
        return true
      }
    }
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    return false
  }

  async function fillDate(d, value, results, name) {
    if (!d || !value) return
    const { month, year } = monthYear(value)
    if (month && d.month && !clean(d.month.value)) setText(d.month, month)
    if (year && d.year && !clean(d.year.value)) setText(d.year, year)
    if (year) results.push({ el: d.year || d.month, kind: 'text', label: `${name}: ${d.label}`, status: 'filled', value: [month, year].filter(Boolean).join('/') })
    if (d.month && !month && !clean(d.month.value)) {
      results.push({ el: d.month, kind: 'text', label: `${name}: ${d.label} month`, status: 'needs', note: `${name}: ${d.label} month (your resume gives only the year)` })
      mark({ el: d.month, kind: 'text' }, MARK.needs)
    }
  }

  async function fillText(block, re, value, results, name) {
    const f = value && fieldIn(block, re)
    if (!f || f.kind === 'checkbox') return
    const current = f.kind === 'listbutton' ? currentValue({ el: f.el, kind: 'listbutton' }) : clean(f.el.value)
    if (current) return
    const ok = f.kind === 'combobox' ? await setCombobox(f.el, value) : f.kind === 'listbutton' ? await setListButton(f.el, value) : setText(f.el, value)
    if (ok) {
      results.push({ el: f.el, kind: f.kind, label: `${name}: ${f.label}`, status: 'filled', value })
      mark({ el: f.el, kind: f.kind }, MARK.profile)
    }
  }

  /**
   * Workday asks for each job and degree field by field. They come straight
   * from the resume: nothing is written here that the resume does not say.
   */
  async function fillHistory(packet, results) {
    const jobs = (packet.experience || []).slice(0, 4)
    const schools = (packet.education || []).slice(0, 2)
    for (const [kind, list] of [['workExperience', jobs], ['education', schools]]) {
      if (!list.length || !document.querySelector(`[data-automation-id="${kind}Section"]`)) continue
      // One entry per item on the resume: add the missing ones.
      for (let guard = 0; blocks(kind).length < list.length && guard < list.length; guard++) {
        const add = sectionAdd(kind)
        if (!add) break
        add.click()
        await wait(350)
      }
      const found = blocks(kind)
      for (let i = 0; i < Math.min(found.length, list.length); i++) {
        const b = found[i]
        const item = list[i]
        if (kind === 'workExperience') {
          const name = `Job ${i + 1}`
          await fillText(b, /job title|position/i, item.title, results, name)
          await fillText(b, /^company|employer/i, item.company, results, name)
          await fillText(b, /^location/i, item.location, results, name)
          await fillText(b, /description|responsibilit/i, item.description, results, name)
          const cur = fieldIn(b, /currently work here|current(ly)? (job|role|employ)/i)
          // Stating a fact from the resume, not agreeing to anything.
          if (cur?.kind === 'checkbox' && item.current && !cur.el.checked) cur.el.click()
          await fillDate(dateIn(b, /^from|start/i), item.start, results, name)
          if (!item.current) await fillDate(dateIn(b, /^to\b|end/i), item.end, results, name)
        } else {
          const name = `Education ${i + 1}`
          await fillText(b, /school|university|institution|college/i, item.school, results, name)
          const deg = item.degree && fieldIn(b, /degree/i)
          if (deg?.kind === 'listbutton' && !currentValue({ el: deg.el, kind: 'listbutton' })) {
            if (await setDegree(deg.el, item.degree)) {
              results.push({ el: deg.el, kind: 'listbutton', label: `${name}: ${deg.label}`, status: 'filled', value: item.degree })
              mark({ el: deg.el, kind: 'listbutton' }, MARK.profile)
            }
          } else if (deg) await fillText(b, /degree/i, item.degree, results, name)
          await fillText(b, /field of study|major|discipline/i, item.field, results, name)
          await fillDate(dateIn(b, /^from|first year|start/i), item.start, results, name)
          await fillDate(dateIn(b, /^to\b|last year|end|graduat/i), item.end, results, name)
        }
      }
    }
  }

  /* ── The job ──────────────────────────────────────────────────────── */

  // Workday's application pages do not show the job title; the posting page does.
  if (VENDOR === 'workday') {
    const keep = () => {
      const t = clean(document.querySelector('[data-automation-id="jobPostingHeader"]')?.textContent)
      if (t) {
        try {
          sessionStorage.setItem('applymaster:jobTitle', t)
        } catch {}
      }
    }
    keep()
    new MutationObserver(keep).observe(document.documentElement, { childList: true, subtree: true })
  }

  const titleCase = s => s.replace(/[-_]/g, ' ').replace(/\b\w/g, x => x.toUpperCase())

  function jobMeta(packet) {
    if (packet?.job) return { title: packet.job.title, company: packet.job.company }
    // In priority order: a selector list would return whichever comes first on the page.
    const pick = sel => {
      for (const s of sel.split(',')) {
        const t = clean(document.querySelector(s.trim())?.textContent)
        if (t) return t
      }
      return ''
    }
    const t = document.title
    let m
    if (VENDOR === 'linkedin') {
      const title = pick('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, .t-24.job-details-jobs-unified-top-card__job-title')
      const company =
        pick('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name') ||
        (pick('#jobs-apply-header, .jobs-easy-apply-modal h2').match(/^apply to (.+)$/i)?.[1] ?? '')
      return { title: title || clean(t.split('|')[0]), company: company || 'LinkedIn employer' }
    }
    if (VENDOR === 'indeed') {
      const title = pick('[data-testid*="jobTitle" i], [class*="JobHeader-title" i], [class*="jobTitle" i], h1')
      const company = pick('[data-testid*="companyName" i], [class*="JobHeader-company" i], [class*="companyName" i]')
      return { title: title || clean(t), company: company || 'Indeed employer' }
    }
    if (VENDOR === 'workday') {
      let title = ''
      try {
        title = sessionStorage.getItem('applymaster:jobTitle') || ''
      } catch {}
      const tenant = HOST.split('.')[0]
      return { title: title || pick('[data-automation-id="jobPostingHeader"]') || clean(t), company: titleCase(tenant) }
    }
    if ((m = t.match(/job application for (.+?) at (.+)$/i))) return { title: clean(m[1]), company: clean(m[2]) }
    if (VENDOR === 'lever' && (m = t.match(/^(.+?) - (.+)$/))) return { title: clean(m[2]), company: clean(m[1]) }
    if ((m = t.match(/^(.+?) @ (.+)$/))) return { title: clean(m[1]), company: clean(m[2]) }
    const h1 = pick('h1, .app-title, .posting-headline h2')
    const board = VENDOR === 'greenhouse' ? location.pathname.split('/').filter(Boolean)[0] : VENDOR === 'lever' || VENDOR === 'ashby' ? location.pathname.split('/')[1] : null
    const site = document.querySelector('meta[property="og:site_name"]')?.content
    const company = site || (board && board !== 'embed' ? titleCase(board) : HOST.replace(/^www\./, '').split('.')[0])
    return { title: h1 || clean(t), company }
  }

  /** The address of the job, for the tracker: LinkedIn's apply dialog lives on many URLs. */
  function jobUrl() {
    if (VENDOR === 'linkedin') {
      const id = new URLSearchParams(location.search).get('currentJobId') || location.pathname.match(/\/jobs\/view\/(\d+)/)?.[1]
      if (id) return `https://www.linkedin.com/jobs/view/${id}/`
    }
    if (VENDOR === 'indeed') {
      const jk = new URLSearchParams(location.search).get('jk')
      if (jk) return `https://www.indeed.com/viewjob?jk=${jk}`
    }
    return location.href
  }

  /* ── Filling a page ───────────────────────────────────────────────── */

  const state = { packet: null, results: [], filled: false, filling: false, meta: null, baselineConfirm: 0, stepAnswers: new Map(), signature: '' }
  const signature = () => controls().map(c => c.label).join('|')

  /* One fill at a time. A page that arrives mid-fill (the person pressed Next
     while the resume was still attaching) is filled as soon as this one ends. */
  async function fill() {
    if (state.filling) {
      state.again = true
      return
    }
    state.filling = true
    try {
      do {
        state.again = false
        await fillPage()
      } while (state.again)
    } finally {
      state.filling = false
    }
  }

  async function fillPage() {
    ui.show('filling')
    const packet = state.packet ?? (await send('packet', { url: jobUrl() }))
    if (packet?.error) return ui.show(packet.error === 'not_connected' ? 'connect' : 'error', packet.error)
    state.packet = packet
    state.meta = state.meta ?? jobMeta(packet)

    const a = packet.applicant
    const profile = { firstName: a.first_name, lastName: a.last_name, email: a.email, phone: a.phone, location: a.location, country: a.country, linkedin: a.linkedin, website: a.website }
    const ctx = {
      country: a.country,
      location: a.location,
      requiresSponsorship: packet.facts.requires_sponsorship,
      workAuthorization: packet.facts.work_authorization,
      yearsExperience: packet.facts.years_experience,
      salaryExpectation: packet.facts.salary_expectation,
      noticePeriod: packet.facts.notice_period,
      company: state.meta.company,
    }

    const results = []
    const open = []
    let resumeDone = false
    if (VENDOR === 'workday') await fillHistory(packet, results)
    for (const c of controls()) {
      if (F.isVoluntaryDemographic(c.label)) {
        results.push({ ...c, status: 'voluntary' })
        continue
      }
      const kind = F.classifyField(c.label)
      if (c.kind === 'file') {
        // Workday's resume slot is marked, whatever its heading is made of.
        const workdayResume = c.el.getAttribute('data-automation-id') === 'file-upload-input-ref'
        if (kind === 'resume' || workdayResume || (!resumeDone && kind === 'unknown' && /attach|upload|document|select files/i.test(c.label))) {
          if (resumeDone || c.el.files?.length) continue
          const file = packet.resume?.url ? await send('resume', { url: packet.resume.url }) : null
          if (file?.base64 && attachFile(c.el, packet.resume.name, file.type, file.base64)) {
            resumeDone = true
            results.push({ ...c, status: 'filled', value: packet.resume.name })
            mark(c, MARK.profile)
          } else results.push({ ...c, status: 'needs', note: 'Attach your resume' })
        } else if (kind === 'cover_letter' && c.required) {
          results.push({ ...c, status: 'needs', note: packet.cover_letter ? 'Attach your cover letter (its text is in the ApplyMaster apply kit)' : 'Attach a cover letter' })
        }
        continue
      }
      if (currentValue(c)) continue // already answered: the person's own answer stands

      let value = F.valueForField(kind, profile)
      if (kind === 'cover_letter' && c.kind === 'textarea' && packet.cover_letter) value = packet.cover_letter.text
      // A field that asks for the city alone gets the city alone.
      if (kind === 'location' && value && /^(current )?city$/i.test(c.label)) value = value.split(',')[0].trim()
      if (value) {
        if (await setAny(c, value, kind)) {
          results.push({ ...c, status: 'filled', value })
          mark(c, MARK.profile)
        } else results.push({ ...c, status: 'needs' })
        continue
      }
      const known = F.knownAnswer(c.label, ctx)
      if (known) {
        if (await setAny(c, known.answer)) {
          results.push({ ...c, status: 'filled', value: known.answer })
          mark(c, MARK.profile)
        } else if (c.required) results.push({ ...c, status: 'needs' })
        continue
      }
      if (F.isPersonalConsent(c.label)) {
        // Agreeing to terms is the person's own act.
        if (c.required) results.push({ ...c, status: 'needs', note: `Your call: ${c.label}` })
        continue
      }
      if (F.wantsOwnWords(c.label)) {
        // The employer asked for the person's own words; drafting one would defeat the question.
        if (c.required) results.push({ ...c, status: 'needs', note: `In your own words: ${c.label.slice(0, 80)}` })
        continue
      }
      if (kind === 'unknown') open.push(c)
    }

    if (open.length) {
      ui.show('filling', `Answering ${open.length} question${open.length === 1 ? '' : 's'} from your resume…`)
      const res = await send('answers', { questions: open.map(c => c.label), url: jobUrl(), job_title: state.meta.title, company: state.meta.company })
      const byQ = new Map((res?.answers || []).map(x => [x.question, x]))
      for (const c of open) {
        const ans = byQ.get(c.label.trim().slice(0, 500))
        if (ans && (await setAny(c, ans.answer))) {
          const fromResume = ans.source === 'model'
          results.push({ ...c, status: fromResume ? 'model' : 'filled', value: ans.answer })
          mark(c, fromResume ? MARK.model : MARK.profile)
        } else if (c.required) {
          results.push({ ...c, status: 'needs' })
          mark(c, MARK.needs)
        }
      }
    }

    // Required and still empty, whatever the reason.
    for (const c of controls()) {
      if (!c.required || currentValue(c) || F.isVoluntaryDemographic(c.label)) continue
      if (!results.some(r => r.el === c.el && r.status === 'needs')) results.push({ ...c, status: 'needs' })
      mark(c, MARK.needs)
    }

    state.results = results
    state.filled = true
    state.signature = signature()
    state.baselineConfirm = confirmationMatches()
    ui.show('summary')
  }

  /* ── Moving through a multi-page form ─────────────────────────────── */

  /** Answers on the page being left, kept for the receipt. */
  function keepStep() {
    for (const a of snapshot()) state.stepAnswers.set(a.question, a)
  }

  const NEXT = /^\s*(next|continue|review|save and continue|save & continue|review your application)\b/i

  function onNext() {
    if (!state.filled) return
    keepStep()
    // Fill the next page once it has replaced this one.
    const before = state.signature
    let tries = 0
    const check = () => {
      const now = signature()
      if (now && now !== before) {
        state.signature = now
        // Anything still empty, a resume upload included, is worth a fill.
        if (controls().some(c => !currentValue(c))) fill()
        else ui.show('mini') // nothing to fill here (a review page): stay small
      } else if (++tries < 25) setTimeout(check, 400)
    }
    setTimeout(check, 500)
  }

  /* ── After Submit ─────────────────────────────────────────────────── */

  const CONFIRM =
    /thank(?:s| you)[^.!\n]{0,60}(?:appl|interest in|submitting)|application (?:has been |was |is )?(?:received|submitted|sent|complete)|we(?:'ve| have) received your application|successfully (?:submitted|applied)|your application (?:is )?(?:on its way|in)/gi

  const confirmationMatches = () => (document.body?.innerText.match(CONFIRM) || []).length

  function confirmation() {
    const t = document.body?.innerText || ''
    CONFIRM.lastIndex = 0
    const m = CONFIRM.exec(t)
    if (!m) return null
    const text = clean(t.slice(Math.max(0, m.index - 60), m.index + 320))
    // "Application ID: GH-55555", "Reference: WD-R123-884". A reference has a digit, so "Application: Submitted" is not one.
    const ref = t.match(/(?:reference|confirmation|application)\s*(?:number|no\.?|id|#)?\s*[:#]?\s*((?=[A-Z-]*\d)[A-Z0-9][A-Z0-9-]{4,})/i)?.[1] ?? null
    return { text, ref }
  }

  /** What the form says at the moment of sending: the person's final answers, not our drafts. */
  function snapshot() {
    const out = []
    for (const c of controls()) {
      if (F.isVoluntaryDemographic(c.label)) continue // never leaves the page
      const v = currentValue(c)
      if (!v) continue
      // Ours only if it still says what we wrote; anything the person typed or changed is theirs.
      const r = state.results.find(x => x.el === c.el)
      const unchanged =
        r && (r.status === 'filled' || r.status === 'model') && (clean(r.value) === v || ['file', 'radio', 'select', 'combobox', 'listbutton'].includes(c.kind))
      const source = !unchanged ? 'you' : r.status === 'model' ? 'model' : 'profile'
      out.push({ question: c.label.slice(0, 500), answer: v.slice(0, 2000), source })
    }
    // Workday's history entries, as filled.
    for (const r of state.results) {
      if (r.status === 'filled' && /^(Job|Education) \d+:/.test(r.label) && r.el?.isConnected) out.push({ question: r.label, answer: String(r.value).slice(0, 2000), source: 'profile' })
    }
    return out
  }

  let watching = null
  async function onSubmitAttempt() {
    if (!state.filled) return
    keepStep()
    const p = state.packet
    await send('pending:set', {
      pending: {
        form_url: jobUrl(),
        page_url: location.href,
        application_id: p?.application_id ?? null,
        job_title: state.meta?.title ?? null,
        company: state.meta?.company ?? null,
        answers: [...state.stepAnswers.values()].slice(0, 80),
        resume_id: p?.resume?.id ?? null,
        resume_label: p?.resume?.name ?? null,
        cover_letter_id: p?.cover_letter?.id ?? null,
        baseline: state.baselineConfirm,
      },
    })
    ui.show('waiting')
    watchForConfirmation(state.baselineConfirm)
  }

  function watchForConfirmation(baseline) {
    if (watching) return
    const started = Date.now()
    const check = async () => {
      if (confirmationMatches() > baseline) {
        stop()
        await finish(confirmation())
      } else if (Date.now() - started > 45_000) {
        stop()
        ui.show('ask')
      }
    }
    const obs = new MutationObserver(() => check())
    obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
    const timer = setInterval(check, 1500)
    const stop = () => {
      obs.disconnect()
      clearInterval(timer)
      watching = null
    }
    watching = stop
    check()
  }

  async function finish(conf) {
    const pending = await send('pending:get')
    if (!pending) return
    const res = await send('record', {
      record: {
        application_id: pending.application_id,
        url: pending.form_url,
        job_title: pending.job_title,
        company: pending.company,
        answers: pending.answers,
        resume_id: pending.resume_id,
        resume_label: pending.resume_label,
        cover_letter_id: pending.cover_letter_id,
        destination: VENDOR,
        destination_url: pending.page_url || pending.form_url,
        confirmation_text: conf?.text ?? null,
        confirmation_ref: conf?.ref ?? null,
      },
    })
    ui.show(res?.error ? 'error' : 'recorded', res?.error ?? (conf ? 'confirmed' : 'manual'))
  }

  // A real <form> fires 'submit' only once the browser's own checks pass.
  document.addEventListener('submit', e => !MULTI_STEP && !e.target.closest?.('#applymaster-root') && onSubmitAttempt(), true)
  // Forms built without one — and the multi-page sites, which drive every step with script — only have the click.
  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest?.('button, input[type="submit"], [role="button"]')
      if (!b || b.closest('#applymaster-root')) return
      const text = clean(b.textContent || b.value || b.getAttribute('aria-label'))
      if (MULTI_STEP && NEXT.test(text)) return onNext()
      if (b.closest('form') && !MULTI_STEP) return
      if (/^\s*(submit|send)\b|submit application|submit your application|^\s*apply now\s*$|^\s*apply\s*$/i.test(text)) onSubmitAttempt()
    },
    true
  )

  /* ── The panel ────────────────────────────────────────────────────── */

  const ui = (() => {
    let host, root, collapsed = false
    const css = `
      :host { all: initial; }
      * { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
      .card { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; width: 340px; max-height: 70vh; overflow: auto;
        background: #fffdfb; color: #231a1e; border-radius: 14px; box-shadow: 0 12px 40px rgb(35 20 28 / .22), 0 0 0 1px rgb(35 20 28 / .08); font-size: 13px; line-height: 1.45; }
      .pill { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; display: flex; align-items: center; gap: 8px; border: 0; cursor: pointer;
        background: #a8325c; color: #fff; font-weight: 600; font-size: 13.5px; padding: 11px 16px; border-radius: 999px; box-shadow: 0 8px 24px rgb(168 50 92 / .35); }
      .pill:hover { background: #922b4f; }
      /* Workday keeps Save and Continue in a bar at the bottom right: stay clear of it. */
      :host([data-pos="top"]) .card, :host([data-pos="top"]) .pill { bottom: auto; top: 72px; }
      .pill .x { opacity: .75; margin-left: 4px; font-weight: 400; }
      .hd { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #efe6ea; }
      .brand { display: flex; align-items: center; gap: 8px; font-weight: 700; }
      .logo { width: 22px; height: 22px; border-radius: 6px; background: #a8325c; color: #fff; display: grid; place-items: center; font-size: 10px; font-weight: 800; }
      .icon { border: 0; background: none; cursor: pointer; color: #7a6a71; font-size: 18px; line-height: 1; padding: 2px 6px; border-radius: 6px; }
      .icon:hover { background: #f4ecef; }
      .bd { padding: 12px 14px; }
      .muted { color: #6f5f67; }
      .row { display: flex; gap: 8px; align-items: baseline; margin: 6px 0; }
      .dot { width: 8px; height: 8px; border-radius: 99px; flex: none; transform: translateY(-1px); }
      h4 { margin: 12px 0 4px; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: #8a7880; }
      ul { margin: 0; padding: 0; list-style: none; }
      li button { all: unset; cursor: pointer; display: block; width: 100%; padding: 5px 8px; margin: 2px 0; border-radius: 8px; background: #f7f1f3; font-size: 12.5px; }
      li button:hover { background: #efe4e8; }
      .btn { border: 0; cursor: pointer; font-weight: 600; font-size: 13px; padding: 9px 12px; border-radius: 10px; }
      .primary { background: #a8325c; color: #fff; } .primary:hover { background: #922b4f; }
      .quiet { background: #f4ecef; color: #231a1e; } .quiet:hover { background: #ebdfe4; }
      .actions { display: flex; gap: 8px; margin-top: 12px; }
      .note { margin-top: 10px; padding: 9px 10px; border-radius: 10px; background: #f7f1f3; font-size: 12.5px; }
      .warn { margin: 0 0 10px; padding: 10px; border-radius: 10px; background: #fff4e5; color: #6b3d00; font-size: 12.5px; }
      .ok { color: #1f7a52; font-weight: 600; }
      .err { color: #b42318; }
      .spin { width: 14px; height: 14px; border-radius: 99px; border: 2px solid #ead8df; border-top-color: #a8325c; animation: s .8s linear infinite; display: inline-block; vertical-align: -2px; margin-right: 8px; }
      @keyframes s { to { transform: rotate(360deg) } }
      @media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
      .btn:focus-visible, .pill:focus-visible, .icon:focus-visible, li button:focus-visible { outline: 2px solid #a8325c; outline-offset: 2px; }
    `

    /* Built from elements, never from HTML strings: Greenhouse and other
       sites enforce Trusted Types, which blocks innerHTML outright, and form
       labels are the employer's text. */
    function h(tag, attrs, ...kids) {
      const el = document.createElement(tag)
      for (const [k, v] of Object.entries(attrs || {})) {
        if (v == null || v === false) continue
        if (k === 'class') el.className = v
        else if (k === 'on') el.addEventListener('click', e => (e.stopPropagation(), v(e)))
        else if (k === 'style') el.style.cssText = v
        else el.setAttribute(k, v)
      }
      for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : String(kid))
      return el
    }

    function mount() {
      if (!host) {
        host = document.createElement('div')
        host.id = 'applymaster-root'
        // Shadow DOM keeps the employer's styles off the panel, and ours off their page.
        root = host.attachShadow({ mode: 'open' })
        if (VENDOR === 'workday') host.dataset.pos = 'top'
      }
      // Some sites re-render the whole document after load; put the panel back if it was swept away.
      if (!host.isConnected) (document.body || document.documentElement).appendChild(host)
    }

    const header = () =>
      h('div', { class: 'hd' }, h('div', { class: 'brand' }, h('span', { class: 'logo' }, 'AM'), 'ApplyMaster'), h('button', { class: 'icon', 'aria-label': 'Hide', on: () => act('collapse') }, '×'))

    const spinner = text => h('div', { class: 'bd' }, h('span', { class: 'spin' }), text)

    function goTo(x) {
      const el = x?.kind === 'radio' ? x.group[0] : x?.el
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => el?.focus?.(), 350)
    }

    function summary() {
      const r = state.results
      const filled = r.filter(x => x.status === 'filled')
      const model = r.filter(x => x.status === 'model')
      const needs = r.filter(x => x.status === 'needs')
      const vol = r.filter(x => x.status === 'voluntary')
      const row = (color, n, text) => h('div', { class: 'row' }, h('span', { class: 'dot', style: `background:${color}` }), h('span', null, h('b', null, String(n)), ' ', text))
      const list = items => h('ul', null, items.map(x => h('li', null, h('button', { on: () => goTo(x) }, x.note || x.label))))
      const next = MULTI_STEP
        ? 'Check this page, then press the form’s own Next or Continue: ApplyMaster fills each page as you reach it. On the last page, you press Submit.'
        : null
      return [
        header(),
        h(
          'div',
          { class: 'bd' },
          row(MARK.profile, filled.length, 'filled from your profile'),
          model.length ? row(MARK.model, model.length, 'written from your resume — read these') : null,
          needs.length ? row(MARK.needs, needs.length, 'need you') : null,
          model.length ? [h('h4', null, 'Read before sending'), list(model)] : null,
          needs.length ? [h('h4', null, 'Needs you'), list(needs)] : null,
          vol.length
            ? h('p', { class: 'muted', style: 'margin-top:10px' }, `${vol.length} voluntary question${vol.length === 1 ? '' : 's'} (gender, ethnicity, veteran or disability status) left for you. ApplyMaster never answers these.`)
            : null,
          h(
            'div',
            { class: 'note' },
            next ?? ['Check every answer, complete any CAPTCHA, then press the form’s own ', h('b', null, 'Submit'), '. ApplyMaster records it when the employer confirms.']
          ),
          h('div', { class: 'actions' }, h('button', { class: 'btn quiet', on: () => act('fill') }, MULTI_STEP ? 'Fill this page again' : 'Fill again'))
        ),
      ]
    }

    function show(view, detail) {
      mount()
      if (collapsed && view !== 'pill') collapsed = false
      let body
      if (view === 'pill')
        body = h(
          'button',
          { class: 'pill', 'aria-label': 'Fill this application with ApplyMaster', on: () => act('start') },
          h('span', { class: 'logo', style: 'background:#fff;color:#a8325c' }, 'AM'),
          'Fill with ApplyMaster',
          h('span', { class: 'x', 'aria-label': 'Dismiss', role: 'button', on: () => act('dismiss') }, '×')
        )
      else if (view === 'connect') body = h('button', { class: 'pill', on: () => act('connect') }, 'Connect ApplyMaster to fill this form')
      else if (view === 'mini') {
        // The summary, folded away so it never sits on the form's own buttons.
        const r = state.results
        const n = s => r.filter(x => x.status === s).length
        const parts = [`${n('filled') + n('model')} filled`, n('needs') ? `${n('needs')} need${n('needs') === 1 ? 's' : ''} you` : null].filter(Boolean)
        body = h(
          'button',
          { class: 'pill', style: 'padding:8px 12px;font-size:12.5px', 'aria-label': 'Show the ApplyMaster summary', on: () => show('summary') },
          h('span', { class: 'logo', style: 'background:#fff;color:#a8325c' }, 'AM'),
          parts.join(' · ')
        )
      } else {
        const inner =
          view === 'filling'
            ? [header(), spinner(detail || 'Filling from your profile…')]
            : view === 'summary'
              ? summary()
              : view === 'linkedin'
                ? [
                    header(),
                    h(
                      'div',
                      { class: 'bd' },
                      h(
                        'p',
                        { class: 'warn' },
                        'LinkedIn’s User Agreement does not allow browser extensions that automate activity on LinkedIn, and LinkedIn may restrict accounts it believes use them.'
                      ),
                      h('p', { class: 'muted' }, 'ApplyMaster only fills the fields on this form. You press every Next and Submit yourself. Whether to use it here is your decision.'),
                      h(
                        'div',
                        { class: 'actions' },
                        h('button', { class: 'btn primary', on: () => act('ack-linkedin') }, 'Fill this form'),
                        h('button', { class: 'btn quiet', on: () => act('collapse') }, 'Not on LinkedIn')
                      )
                    ),
                  ]
                : view === 'waiting'
                  ? [header(), spinner('Waiting for the employer’s confirmation…')]
                  : view === 'ask'
                    ? [
                        header(),
                        h(
                          'div',
                          { class: 'bd' },
                          'Did your application go through?',
                          h('div', { class: 'actions' }, h('button', { class: 'btn primary', on: () => act('confirm') }, 'Yes, record it'), h('button', { class: 'btn quiet', on: () => act('not-yet') }, 'Not yet'))
                        ),
                      ]
                    : view === 'recorded'
                      ? [
                          header(),
                          h(
                            'div',
                            { class: 'bd' },
                            h('p', { class: 'ok' }, 'Recorded in ApplyMaster'),
                            h('p', { class: 'muted' }, `It’s in your tracker as Applied, with a receipt of what you sent${detail === 'confirmed' ? ' and the employer’s confirmation' : ''}.`),
                            h('div', { class: 'actions' }, h('button', { class: 'btn primary', on: () => act('tracker') }, 'Open tracker'))
                          ),
                        ]
                      : [header(), h('div', { class: 'bd' }, h('p', { class: 'err' }, detail || 'Something went wrong.'), h('div', { class: 'actions' }, h('button', { class: 'btn quiet', on: () => act('fill') }, 'Try again')))]
        body = h('div', { class: 'card', role: 'dialog', 'aria-label': 'ApplyMaster' }, inner)
      }
      const style = document.createElement('style')
      style.textContent = css
      root.replaceChildren(style, body)
      current = view
    }

    // Working on the form folds the summary away; the small pill brings it back.
    let current = null
    document.addEventListener(
      'pointerdown',
      e => {
        if (current === 'summary' && host && !e.composedPath().includes(host)) show('mini')
      },
      true
    )

    function hide() {
      if (root) root.replaceChildren()
    }

    async function act(a) {
      if (a === 'start') {
        // LinkedIn: say what the risk is before the first time, and let the person decide.
        if (VENDOR === 'linkedin' && !(await send('ack:get', { key: 'linkedin' }))?.ok) return show('linkedin')
        fill()
      } else if (a === 'ack-linkedin') {
        await send('ack:set', { key: 'linkedin' })
        fill()
      } else if (a === 'fill') fill()
      else if (a === 'dismiss' || a === 'collapse') {
        collapsed = true
        hide()
      } else if (a === 'connect') send('open', { path: '/extension' })
      else if (a === 'tracker') send('open', { path: '/applications' })
      else if (a === 'confirm') finish(null)
      else if (a === 'not-yet') show('summary')
    }

    return { show, hide, act }
  })()

  /* ── Start ────────────────────────────────────────────────────────── */

  function looksLikeApplication() {
    const kinds = controls().map(c => (c.kind === 'file' ? 'resume' : F.classifyField(c.label)))
    const identity = kinds.filter(k => ['first_name', 'last_name', 'full_name', 'email', 'phone'].includes(k)).length
    // Later pages of a multi-page form carry questions, not a name and email.
    const questions = kinds.filter(k => k === 'unknown').length
    return identity >= 2 || (identity >= 1 && kinds.includes('resume')) || (MULTI_STEP && kinds.includes('resume')) || (VENDOR === 'linkedin' && kinds.length > 0 && (identity > 0 || questions > 0))
  }

  // For the test harness only (it sets the flag); the extension itself never does.
  if (window.__applymasterTest) {
    window.__applymasterDebug = {
      fields: () => controls().map(c => [c.kind, c.label, c.kind === 'file' ? 'file' : F.classifyField(c.label), c.required]),
      looksLikeApplication: () => looksLikeApplication(),
    }
  }

  let offered = false
  async function offer() {
    if (offered || state.filled || !looksLikeApplication()) return
    offered = true
    const s = await send('status')
    ui.show(s?.connected ? 'pill' : 'connect')
  }

  chrome.runtime.onMessage.addListener(msg => {
    if (msg?.type === 'am:open' && (looksLikeApplication() || window === window.top)) {
      offered = true
      ui.act('start')
    }
  })

  ;(async () => {
    // Back on the page after pressing Submit: the confirmation may be here now.
    const pending = await send('pending:get')
    if (pending && (pending.page_url || pending.form_url) !== location.href) {
      if (confirmationMatches() > 0) return finish(confirmation())
      ui.show('waiting')
      return watchForConfirmation(0)
    }
    offer()
    // Forms that render late (Ashby, Lever's apply step), and single-page sites
    // where the form opens later: LinkedIn's Easy Apply dialog, Workday's steps.
    let tries = 0
    const obs = new MutationObserver(() => {
      if (!MULTI_STEP && (offered || ++tries > 200)) return obs.disconnect()
      clearTimeout(obs.t)
      obs.t = setTimeout(() => {
        // LinkedIn's dialog closed without submitting: start over for the next job.
        if (VENDOR === 'linkedin' && !formRoot() && (offered || state.filled) && !watching) {
          offered = false
          Object.assign(state, { packet: null, results: [], filled: false, meta: null, stepAnswers: new Map(), signature: '' })
          ui.hide()
          return
        }
        offer()
      }, 600)
    })
    obs.observe(document.documentElement, { childList: true, subtree: true })
  })()
})()
