import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'ApplyMaster compared with other job application tools'

export default function Image() {
  return ogImage('Honest comparisons', 'Job application tools, compared', 'www.applymaster.ai/compare')
}
