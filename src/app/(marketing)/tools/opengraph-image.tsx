import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Free tools for your job search'

export default function Image() {
  return ogImage('Free tools', 'Free tools for your job search', 'www.applymaster.ai/tools')
}
