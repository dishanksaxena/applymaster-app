import { competitorBySlug } from '@/lib/seo/competitors'
import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'ApplyMaster comparison'

export default function Image({ params }: { params: { slug: string } }) {
  const c = competitorBySlug(params.slug)
  return ogImage('Honest comparison', `ApplyMaster vs ${c?.name ?? 'others'}`, `www.applymaster.ai/compare/${params.slug}`)
}
