import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = "Job Search Tips, AI Career Advice & Resume Guides"

export default function Image() {
  return ogImage("Blog", "Job Search Tips, AI Career Advice & Resume Guides", 'www.applymaster.ai/blog')
}
