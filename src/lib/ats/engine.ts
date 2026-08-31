import type { Browser, Page, Locator } from 'playwright-core'
import { classifyField, valueForField, knownAnswer, isVoluntaryDemographic } from './fields'
import { detectVendor, canonicalFormUrl } from './detect'
import type { ApplyRequest, ApplyResult, AnsweredQuestion, AtsVendor } from './types'

/**
 * Fills and, where it legitimately can, submits a real application form.
 *
 * Two rules this engine will not break.
 *
 * It does not defeat CAPTCHAs. Six of the seven live Greenhouse boards
 * sampled carry one, and it is there precisely to require a human. Solving
 * it through a third-party service would breach the employer's terms and
 * put the user's application at risk of being voided. When one appears the
 * form is left filled and handed back, which is still the whole of the
 * tedious part done.
 *
 * It does not answer voluntary demographic questions. EEO and
 * self-identification fields are the applicant's own choice by law.
 *
 * Everything it fills is reported with its provenance, so the receipt can
 * show exactly what was said on the user's behalf and where each answer
 * came from.
 */

const NAV_TIMEOUT = 45_000
const FIELD_TIMEOUT = 5_000

/** Launch a browser that works locally and on a serverless host. */
async function launch(): Promise<Browser> {
  const serverless = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL)

  if (serverless) {
    /* Vercel's bundle cannot carry a full Chromium, so the runtime pulls a
       stripped build. Kept behind a dynamic import so local runs, which use
       the ordinary playwright package, never load it. */
    const chromium = (await import('@sparticuz/chromium')).default
    const { chromium: pw } = await import('playwright-core')
    return pw.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }

  const { chromium: pw } = await import('playwright')
  return pw.launch({ headless: true }) as unknown as Browser
}

/** The visible label for a control, however the form chose to attach it. */
async function labelOf(page: Page, el: Locator): Promise<string> {
  return el
    .evaluate(node => {
      const e = node as HTMLElement
      const id = e.getAttribute('id')
      if (id) {
        const l = document.querySelector(`label[for="${CSS.escape(id)}"]`)
        if (l) return (l as HTMLElement).innerText
      }
      const wrapping = e.closest('label')
      if (wrapping) return (wrapping as HTMLElement).innerText
      const labelledBy = e.getAttribute('aria-labelledby')
      if (labelledBy) {
        const l = document.getElementById(labelledBy)
        if (l) return l.innerText
      }
      return e.getAttribute('aria-label') || e.getAttribute('placeholder') || ''
    })
    .then(t => (t || '').replace(/\s+/g, ' ').trim())
    .catch(() => '')
}

async function hasCaptcha(page: Page): Promise<boolean> {
  return (
    (await page
      .locator('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], [class*="turnstile"], [data-sitekey]')
      .count()) > 0
  )
}

/** Greenhouse and friends hide the form behind an Apply button. */
async function openForm(page: Page) {
  const applyBtn = page
    .locator('a, button')
    .filter({ hasText: /^\s*(apply|apply now|apply for this job|submit application)\s*$/i })
    .first()
  if (await applyBtn.count()) {
    await applyBtn.click({ timeout: FIELD_TIMEOUT }).catch(() => {})
    await page.waitForTimeout(2500)
  }
}

/**
 * Put a value into a control and confirm it actually stuck.
 *
 * This exists because of a failure the engine reported as a success. Half
 * the required questions on a Greenhouse form are custom comboboxes — a
 * text input wired to a React listbox, not a <select>. Calling fill() on
 * one writes the text and resolves happily, but the widget never commits a
 * selection, so the field still reads "Select..." when the page is
 * submitted. The engine said nine of nine filled; the screenshot showed
 * four of them empty.
 *
 * So: choose the interaction from what the control actually is, then read
 * the value back. A field is only reported filled if the form agrees.
 */
async function setValue(page: Page, el: Locator, value: string): Promise<boolean> {
  const tag = await el.evaluate(n => n.tagName.toLowerCase()).catch(() => 'input')
  const role = await el.getAttribute('role').catch(() => null)
  const hasPopup = await el.getAttribute('aria-haspopup').catch(() => null)
  const controls = await el.getAttribute('aria-controls').catch(() => null)
  const isCombobox = role === 'combobox' || hasPopup === 'listbox' || Boolean(controls)

  try {
    if (tag === 'select') {
      // A native select takes the label, not free text.
      await el.selectOption({ label: value }, { timeout: FIELD_TIMEOUT }).catch(async () => {
        await el.selectOption(value, { timeout: FIELD_TIMEOUT })
      })
    } else if (isCombobox) {
      /* react-select, which is what Greenhouse uses for every screening
         question. Typing filters an option list; the value only commits
         when an option is chosen. Exact matching is too strict here — the
         country list renders as "United States +1" — so match by prefix
         against the option's own text and take the best one. */
      await el.click({ timeout: FIELD_TIMEOUT })
      await page.waitForTimeout(250)
      /* type(), not fill(). fill() assigns the value and fires a single
         input event; react-select filters on real key events, so fill()
         leaves the option list unfiltered and nothing gets chosen. */
      await el.fill('', { timeout: FIELD_TIMEOUT }).catch(() => {})
      await el.type(value, { delay: 45 }).catch(() => {})
      await page.waitForTimeout(650)

      const options = page.locator('[role="option"]:visible')
      const n = await options.count()
      let picked = false

      if (n > 0) {
        const texts = await options.allInnerTexts().catch(() => [] as string[])
        const want = value.toLowerCase().trim()
        // Exact, then prefix, then the first thing the filter left.
        let idx = texts.findIndex(t => t.toLowerCase().trim() === want)
        if (idx === -1) idx = texts.findIndex(t => t.toLowerCase().trim().startsWith(want))
        if (idx === -1 && texts.length === 1) idx = 0
        if (idx !== -1) {
          await options.nth(idx).click({ timeout: FIELD_TIMEOUT }).catch(() => {})
          picked = true
        }
      }

      if (!picked) await el.press('Enter').catch(() => {})
      await page.waitForTimeout(400)
    } else {
      await el.fill(value, { timeout: FIELD_TIMEOUT })
    }
  } catch {
    return false
  }

  // Read it back. An empty control, or one still showing its placeholder,
  // was not filled whatever the interaction reported.
  const committed = await el
    .evaluate(n => {
      const e = n as HTMLInputElement | HTMLSelectElement
      if (e.tagName.toLowerCase() === 'select') {
        const sel = e as HTMLSelectElement
        return sel.selectedOptions?.[0]?.text ?? sel.value ?? ''
      }
      /* react-select clears its input once a choice is committed and
         renders it in a .select__single-value node, so reading the input
         alone always looks empty.

         The selector order matters and cost a debugging round: closest()
         returns the NEAREST ancestor matching ANY branch of the list, and
         the input's immediate parent is .select__input-container, which
         matches [class*="select"] and contains nothing but the input. Each
         candidate therefore gets its own closest() call, most specific
         first. textContent rather than innerText because the node can be
         laid out in ways that make innerText come back empty. */
      const own = (e as HTMLInputElement).value || ''
      if (own.trim()) return own

      const control =
        (e.closest('.select__control') as HTMLElement | null) ??
        (e.closest('[class*="__control"]') as HTMLElement | null) ??
        (e.closest('[class*="control"]') as HTMLElement | null)

      const single = control?.querySelector(
        '.select__single-value, [class*="single-value"], [class*="multi-value"]'
      ) as HTMLElement | null

      if (single?.textContent?.trim()) return single.textContent
      return control?.textContent ?? ''
    })
    .catch(() => '')

  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
  if (!norm(committed) || /^select\b|^choose\b|^-+$/.test(norm(committed))) return false
  return norm(committed).includes(norm(value)) || norm(value).includes(norm(committed))
}

/** Download the resume once so it can be attached to file inputs. */
async function fetchResume(url: string): Promise<{ name: string; mimeType: string; buffer: Buffer } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const name = decodeURIComponent(url.split('/').pop() || 'resume.pdf').split('?')[0]
    const mimeType = name.endsWith('.docx')
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf'
    return { name, mimeType, buffer }
  } catch {
    return null
  }
}

export async function applyToJob(
  req: ApplyRequest,
  answerWithModel?: (questions: string[], ctx: ApplyRequest['context']) => Promise<Record<string, string>>
): Promise<ApplyResult> {
  const started = Date.now()
  const vendor: AtsVendor = detectVendor(req.jobUrl)
  const filled: AnsweredQuestion[] = []
  const unfilled: { question: string; reason: string }[] = []

  let browser: Browser | null = null

  const result = (over: Partial<ApplyResult>): ApplyResult => ({
    outcome: 'failed',
    vendor,
    filled,
    unfilled,
    durationMs: Date.now() - started,
    ...over,
  })

  try {
    browser = await launch()
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 1400 },
      // Identify honestly rather than impersonating a consumer browser.
      userAgent:
        'Mozilla/5.0 (compatible; ApplyMaster/1.0; +https://applymaster.ai/bot) Chrome/120 Safari/537.36',
    })
    const page = await ctx.newPage()

    const target = canonicalFormUrl(req.jobUrl)
    await page.goto(target, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT })
    await page.waitForTimeout(1500)
    await openForm(page)

    const controls = page.locator('input:visible, select:visible, textarea:visible')
    const count = await controls.count()
    if (count === 0) {
      return result({
        blockedBy: 'unsupported_form',
        error: 'No application form found on the page',
        resumeUrl: target,
        screenshot: (await page.screenshot({ type: 'png' }).catch(() => null))?.toString('base64') ?? null,
      })
    }

    // ── First pass: identify everything, so screening questions can be
    //    answered in one model call rather than one call per field. ──
/* A control is addressed by its id, not by its index.

       The first pass built one locator list and then used controls.nth(i)
       to fill each field. But opening a react-select mounts and unmounts
       nodes, so the set of visible inputs changes between the survey and
       the fill — nth(i) then resolves to a *different* field, and the
       engine can put an answer in the wrong box. Re-locating by id each
       time is stable across those re-renders. */
    type Control = { id: string | null; index: number; label: string; kind: ReturnType<typeof classifyField>; type: string; required: boolean }
    const locate = (c: Control): Locator =>
      c.id ? page.locator(`#${CSS.escape(c.id)}`) : controls.nth(c.index)
    const items: Control[] = []

    for (let i = 0; i < count; i++) {
      const el = controls.nth(i)
      const [id, label, type, required] = await Promise.all([
        el.getAttribute('id').catch(() => null),
        labelOf(page, el),
        el.evaluate(n => (n as HTMLInputElement).type || n.tagName.toLowerCase()).catch(() => 'text'),
        el
          .evaluate(n => (n as HTMLInputElement).required || n.getAttribute('aria-required') === 'true')
          .catch(() => false),
      ])
      items.push({ id, index: i, label, kind: classifyField(label), type, required: Boolean(required) })
    }

    // ── Attach the resume ──
    const resume = req.profile.resumeUrl ? await fetchResume(req.profile.resumeUrl) : null
    const fileInputs = page.locator('input[type="file"]')
    const fileCount = await fileInputs.count()
    if (resume && fileCount > 0) {
      // The first file input is the resume on every form sampled; later ones
      // are the optional cover letter.
      await fileInputs
        .first()
        .setInputFiles({ name: resume.name, mimeType: resume.mimeType, buffer: resume.buffer })
        .then(() => {
          filled.push({ question: 'Resume', answer: resume.name, source: 'profile', required: true })
        })
        .catch(e => unfilled.push({ question: 'Resume', reason: String(e).slice(0, 80) }))
      await page.waitForTimeout(1200)
    } else if (fileCount > 0) {
      unfilled.push({ question: 'Resume', reason: 'No resume file available to attach' })
    }

    // ── Known fields and known answers ──
    const openQuestions: { c: Control }[] = []

    for (const c of items) {
      if (c.type === 'file') continue

      if (isVoluntaryDemographic(c.label)) {
        // Left blank on purpose — the user's own choice to make.
        continue
      }

      const direct = valueForField(c.kind, req.profile)
      if (direct) {
        const ok = await setValue(page, locate(c), direct)
        if (ok) filled.push({ question: c.label || c.kind, answer: direct, source: 'profile', required: c.required })
        else unfilled.push({ question: c.label || c.kind, reason: 'Value did not commit — needs choosing by hand' })
        continue
      }

      if (c.kind === 'cover_letter' && req.profile.coverLetter) {
        const ok = await setValue(page, locate(c), req.profile.coverLetter)
        if (ok) filled.push({ question: c.label || 'Cover letter', answer: '(cover letter attached)', source: 'profile', required: c.required })
        continue
      }

      if (!c.label) continue

      const known = knownAnswer(c.label, {
        ...(req.context ?? {}),
        country: req.profile.country,
        location: req.profile.location,
      })
      if (known) {
        const ok = await setValue(page, locate(c), known.answer)
        if (ok) filled.push({ question: c.label, answer: known.answer, source: known.source, required: c.required })
        else unfilled.push({ question: c.label, reason: 'Value did not commit — needs choosing by hand' })
        continue
      }

      openQuestions.push({ c })
    }

    // ── Anything left: one model call for the lot ──
    if (openQuestions.length && answerWithModel) {
      const answers: Record<string, string> = await answerWithModel(
        openQuestions.map(q => q.c.label),
        req.context
      ).catch(() => ({}) as Record<string, string>)

      for (const { c } of openQuestions) {
        const a = answers[c.label]
        if (!a) {
          if (c.required) unfilled.push({ question: c.label, reason: 'No answer could be determined' })
          continue
        }
        const ok = await setValue(page, locate(c), a)
        if (ok) filled.push({ question: c.label, answer: a, source: 'model', required: c.required })
        else unfilled.push({ question: c.label, reason: 'Value did not commit — needs choosing by hand' })
      }
    } else {
      for (const { c } of openQuestions) {
        if (c.required) unfilled.push({ question: c.label, reason: 'Unanswered screening question' })
      }
    }

    const screenshot = (await page.screenshot({ type: 'png', fullPage: true }).catch(() => null))?.toString('base64') ?? null

    // ── Submit, unless we must not ──
    if (req.dryRun) {
      return result({ outcome: 'awaiting_human', blockedBy: null, screenshot, resumeUrl: target, error: null })
    }

    if (await hasCaptcha(page)) {
      /* Deliberate stop. The CAPTCHA is the employer asking for a human, and
         the honest answer is to be one — the form is filled and waiting. */
      return result({ outcome: 'awaiting_human', blockedBy: 'captcha', screenshot, resumeUrl: target, error: null })
    }

    const submit = page.locator('button[type="submit"], input[type="submit"]').first()
    if (!(await submit.count())) {
      return result({ outcome: 'awaiting_human', blockedBy: 'unsupported_form', screenshot, resumeUrl: target })
    }

    await submit.click({ timeout: 10_000 })
    await page.waitForLoadState('networkidle', { timeout: NAV_TIMEOUT }).catch(() => {})
    await page.waitForTimeout(3000)

    const bodyText = await page.locator('body').innerText().catch(() => '')
    const confirmed =
      /thank you|application (has been )?(received|submitted)|we('| ha)ve received|submission (was )?successful/i.test(
        bodyText
      )

    const confirmationText = confirmed
      ? bodyText.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 6).join(' ').slice(0, 400)
      : null

    const afterShot = (await page.screenshot({ type: 'png', fullPage: true }).catch(() => null))?.toString('base64') ?? null

    if (!confirmed) {
      // No confirmation means no proof, so it is not a submission.
      return result({
        outcome: 'awaiting_human',
        blockedBy: null,
        screenshot: afterShot,
        resumeUrl: page.url(),
        error: 'Submitted but the page showed no confirmation — please verify',
      })
    }

    return result({
      outcome: 'submitted',
      confirmationText,
      confirmationRef: bodyText.match(/\b(?:reference|confirmation|application)\s*(?:#|no\.?|id)?\s*[:\s]\s*([A-Z0-9-]{6,})/i)?.[1] ?? null,
      screenshot: afterShot,
      error: null,
    })
  } catch (err) {
    return result({ error: err instanceof Error ? err.message.slice(0, 200) : 'Apply failed' })
  } finally {
    await browser?.close().catch(() => {})
  }
}
