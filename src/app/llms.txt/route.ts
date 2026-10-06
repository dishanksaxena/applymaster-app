import { livePortals, portalNames } from '@/lib/seo/portals'
import { COMPETITORS } from '@/lib/seo/competitors'
import { SITE_URL, STORE_URL } from '@/lib/seo/site'

/**
 * /llms.txt: a plain-text summary for AI assistants and answer engines
 * (ChatGPT, Claude, Perplexity, Gemini), following the llmstxt.org format.
 * Facts only: everything here must be true of the product today.
 */

export const dynamic = 'force-static'

export function GET() {
  const body = `# ApplyMaster

> ApplyMaster helps job seekers apply to jobs: a Chrome extension fills job applications on the employer's own site from the person's resume and profile, the person checks every answer and presses Submit, and ApplyMaster keeps a receipt of what was sent. The web app adds job matching, an application tracker, resume tailoring, cover letters, interview practice, and referral paths from LinkedIn connections.

## How applying works
- The ApplyMaster Chrome extension fills applications on ${portalNames()}. On any other job site, the toolbar button fills the fields it recognises.
- It fills contact details, links, the resume upload, and questions it can answer from the profile (work authorisation for the person's own country, visa sponsorship, total years of experience, salary expectation, notice period). Written answers are drafted from the resume and highlighted for the person to read.
- The person presses Next and Submit and completes any CAPTCHA. ApplyMaster never submits on its own.
- It never answers voluntary questions about gender, ethnicity, veteran or disability status, never ticks consent boxes, and never writes answers an employer asks to be in the applicant's own words.
- When the employer confirms, the job is marked Applied in the tracker with a receipt: what was sent, and the employer's reference number when shown.
- On Workday it also fills work history and education from the resume, without inventing dates.
- On LinkedIn it only fills the Easy Apply form, and asks before the first use because LinkedIn's User Agreement restricts automation extensions.

## Plans
- Free plan, no card needed; the extension works with a free account.
- Paid plans from $29 a month, or $199 once for Lifetime. See ${SITE_URL}/pricing

## Pages
- [Job application autofill](${SITE_URL}/autofill): the extension and where it works
${livePortals()
  .map(p => `- [${p.name} autofill](${SITE_URL}/autofill/${p.slug}): what it fills on ${p.name}`)
  .join('\n')}
- [Comparisons](${SITE_URL}/compare): ApplyMaster compared with ${COMPETITORS.map(c => c.name).join(', ')}
${COMPETITORS.map(c => `- [ApplyMaster vs ${c.name}](${SITE_URL}/compare/${c.slug})`).join('\n')}
- [Pricing](${SITE_URL}/pricing)
- [Privacy policy](${SITE_URL}/privacy)
- [Support](${SITE_URL}/support)

## Links
- Chrome Web Store: ${STORE_URL}
- Website: ${SITE_URL}
`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
}
