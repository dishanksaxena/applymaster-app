import { portalBySlug } from '@/lib/seo/portals'
import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'ApplyMaster autofill for job applications'

export default function Image({ params }: { params: { portal: string } }) {
  const p = portalBySlug(params.portal)
  return ogImage('Free Chrome extension', `Fill ${p?.name ?? 'job'} applications from your resume`, `www.applymaster.ai/autofill/${params.portal}`)
}
