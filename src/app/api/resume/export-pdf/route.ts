import { NextRequest } from 'next/server'

export const maxDuration = 60

/**
 * Turns a tailored resume into an actual PDF.
 *
 * The Download PDF button on the optimizer had no click handler at all —
 * it rendered, it hovered, it did nothing. And the one export endpoint that
 * did exist returned an HTML document with a .html filename, so "export
 * PDF" produced a web page. Neither is something you can send to an
 * employer.
 *
 * This renders the resume in a browser and prints it, which is the same
 * path a person would take and produces a file an ATS can read.
 */

/** Launch a browser that works locally and on a serverless host. */
async function launch() {
  const serverless = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL)
  if (serverless) {
    const chromium = (await import('@sparticuz/chromium')).default
    const { chromium: pw } = await import('playwright-core')
    return pw.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }
  const { chromium: pw } = await import('playwright')
  return pw.launch({ headless: true })
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * The model returns the resume as plain text. Reconstruct its structure so
 * the PDF reads like a document rather than a wall of monospace: the first
 * line is the name, a short line with no sentence punctuation is a section
 * heading, bullets are bullets, and a line with a date range is a job.
 */
function toHtml(text: string, fallbackName: string): string {
  const lines = text.split('\n').map(l => l.trimEnd())
  const out: string[] = []

  // First non-empty line is the candidate's name.
  const firstIdx = lines.findIndex(l => l.trim())
  const name = firstIdx === -1 ? fallbackName : lines[firstIdx].trim()

  // The contact line usually follows and carries an @ or a phone number.
  let contact = ''
  let bodyStart = firstIdx + 1
  for (let i = firstIdx + 1; i < Math.min(firstIdx + 4, lines.length); i++) {
    const l = lines[i].trim()
    if (!l) continue
    if (/@|\+?\d[\d\s().-]{7,}|linkedin|github/i.test(l)) {
      contact = l
      bodyStart = i + 1
      break
    }
    break
  }

  let inList = false
  const closeList = () => {
    if (inList) {
      out.push('</ul>')
      inList = false
    }
  }

  for (let i = bodyStart; i < lines.length; i++) {
    const raw = lines[i]
    const l = raw.trim()

    if (!l) {
      closeList()
      continue
    }

    if (/^[•·\-*]\s+/.test(l)) {
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${esc(l.replace(/^[•·\-*]\s+/, ''))}</li>`)
      continue
    }

    closeList()

    // A short line with no terminal punctuation, or one in caps, is a heading.
    const isHeading =
      (l.length < 42 && !/[.,;:]$/.test(l) && l === l.toUpperCase() && /[A-Z]/.test(l)) ||
      /^(professional\s+)?(summary|experience|work experience|education|skills|technical skills|projects|certifications|selected projects)\b/i.test(l)

    if (isHeading) {
      out.push(`<h2>${esc(l)}</h2>`)
      continue
    }

    // "Title — Company" or a line carrying a date range reads as a job header.
    const hasDates = /\b(19|20)\d{2}\b|\bpresent\b/i.test(l)
    if (hasDates && l.length < 90) {
      out.push(`<p class="meta">${esc(l)}</p>`)
      continue
    }
    if (/[—–|]/.test(l) && l.length < 90) {
      out.push(`<p class="role">${esc(l)}</p>`)
      continue
    }

    out.push(`<p>${esc(l)}</p>`)
  }
  closeList()

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 14mm 15mm; }
  * { box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #16181d;
         font-size: 10.2pt; line-height: 1.44; margin: 0; }
  h1 { font-size: 21pt; margin: 0 0 3px; }
  .contact { font-size: 8.9pt; color: #4a5160; margin: 0 0 4px; }
  /* No letter-spacing on headings, and no text-transform.
     Both are ATS hazards, which matters more here than anywhere else: with
     letter-spacing applied, extracting the text back out of the PDF yields
     "P R O F E S S I O N A L  S U M M A RY" — every character its own token.
     A parser reading that does not find a summary section at all, and this
     is a resume whose entire job is to be parsed correctly. Weight, size,
     colour and a rule carry the hierarchy instead. */
  h2 { font-size: 9.6pt; font-weight: 700; color: #0b3d6b;
       border-bottom: 1.2px solid #cdd6e2; padding-bottom: 3px; margin: 15px 0 8px; }
  .role { font-weight: 700; margin: 9px 0 0; font-size: 10.6pt; }
  .meta { font-size: 8.8pt; color: #5c6472; margin: 1px 0 3px; }
  p { margin: 0 0 5px; }
  ul { margin: 3px 0 6px; padding-left: 15px; }
  li { margin-bottom: 2.5px; }
</style></head><body>
  <h1>${esc(name)}</h1>
  ${contact ? `<p class="contact">${esc(contact)}</p>` : ''}
  ${out.join('\n  ')}
</body></html>`
}

export async function POST(req: NextRequest) {
  let browser: Awaited<ReturnType<typeof launch>> | null = null
  try {
    const { content, name, filename } = await req.json()
    if (!content || typeof content !== 'string' || !content.trim()) {
      return Response.json({ error: 'No resume content to export' }, { status: 400 })
    }

    browser = await launch()
    const page = await browser.newPage()
    await page.setContent(toHtml(content, name || 'Resume'), { waitUntil: 'networkidle' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true })

    const safe = String(filename || name || 'resume')
      .replace(/[^a-z0-9\-_ ]/gi, '')
      .trim()
      .replace(/\s+/g, '-') || 'resume'

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safe}.pdf"`,
        'Content-Length': String(pdf.length),
      },
    })
  } catch (err) {
    console.error('resume export-pdf error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message.slice(0, 200) : 'Could not build the PDF' },
      { status: 500 }
    )
  } finally {
    await browser?.close().catch(() => {})
  }
}
