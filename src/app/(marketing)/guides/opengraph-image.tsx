import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Job application guides'

export default function Image() {
  return ogImage('Guides', 'Job application guides', 'www.applymaster.ai/guides')
}
