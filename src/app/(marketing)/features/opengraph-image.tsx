import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = "AI Job Application Features"

export default function Image() {
  return ogImage("Features", "AI Job Application Features", 'www.applymaster.ai/features')
}
