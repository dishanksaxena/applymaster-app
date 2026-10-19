import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Fill applications faster, without giving up control'

export default function Image() {
  return ogImage('About', 'Fill applications faster, without giving up control', 'www.applymaster.ai/about')
}
