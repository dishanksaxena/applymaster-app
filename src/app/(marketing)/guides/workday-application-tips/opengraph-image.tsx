import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'How to apply on Workday faster'

export default function Image() {
  return ogImage('Guide', 'How to apply on Workday faster', 'www.applymaster.ai/guides/workday-application-tips')
}
