import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = "AI Interview Coach & Preparation Tool"

export default function Image() {
  return ogImage("Features", "AI Interview Coach & Preparation Tool", 'www.applymaster.ai/features/interview-coach')
}
