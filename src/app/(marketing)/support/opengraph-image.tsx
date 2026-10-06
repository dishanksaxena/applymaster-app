import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = "Support"

export default function Image() {
  return ogImage("ApplyMaster", "Support", 'www.applymaster.ai/support')
}
