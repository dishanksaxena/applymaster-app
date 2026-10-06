import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = "Auto Apply Jobs Automatically"

export default function Image() {
  return ogImage("Features", "Auto Apply Jobs Automatically", 'www.applymaster.ai/features/auto-apply')
}
