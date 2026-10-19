import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Find and use the keywords in a job description'

export default function Image() {
  return ogImage('Guide', 'Find and use the keywords in a job description', 'www.applymaster.ai/guides/resume-keywords')
}
