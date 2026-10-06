import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = "Terms of Service"

export default function Image() {
  return ogImage("ApplyMaster", "Terms of Service", 'www.applymaster.ai/terms')
}
