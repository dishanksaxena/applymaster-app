import 'server-only'

/**
 * Render HTML to a PDF in a headless browser — locally with the bundled
 * Playwright Chromium, on Vercel with @sparticuz/chromium.
 *
 * Shared by resume and cover-letter export. Launching a browser is the most
 * expensive thing these routes do, so every caller must authenticate first.
 */

async function launch() {
  const serverless = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL)
  if (serverless) {
    const chromium = (await import('@sparticuz/chromium')).default
    const { chromium: pw } = await import('playwright-core')
    return pw.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true })
  }
  const { chromium: pw } = await import('playwright')
  return pw.launch({ headless: true })
}

export async function htmlToPdf(html: string): Promise<Uint8Array> {
  const browser = await launch()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true })
    return new Uint8Array(pdf)
  } finally {
    await browser.close().catch(() => {})
  }
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const safeFilename = (s: string, fallback = 'document') =>
  String(s || '')
    .replace(/[^a-z0-9\-_ ]/gi, '')
    .trim()
    .replace(/\s+/g, '-') || fallback

export function pdfResponse(pdf: Uint8Array, filename: string): Response {
  // Copy into a fresh ArrayBuffer-backed view: the DOM BodyInit type does
  // not accept a Uint8Array over a SharedArrayBuffer-compatible buffer.
  return new Response(new Blob([new Uint8Array(pdf)]), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      'Content-Length': String(pdf.length),
      'Cache-Control': 'no-store',
    },
  })
}
