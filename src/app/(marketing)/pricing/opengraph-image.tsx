import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = "Pricing"

export default function Image() {
  return ogImage("ApplyMaster", "Pricing", 'www.applymaster.ai/pricing')
}
