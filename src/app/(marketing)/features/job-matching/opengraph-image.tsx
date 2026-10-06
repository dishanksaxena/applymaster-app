import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = "AI Job Matching & Smart Job Recommendation Engine"

export default function Image() {
  return ogImage("Features", "AI Job Matching & Smart Job Recommendation Engine", 'www.applymaster.ai/features/job-matching')
}
