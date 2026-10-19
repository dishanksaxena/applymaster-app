import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Job description keyword extractor'

export default function Image() {
  return ogImage('Free tool', 'Job description keyword extractor', 'www.applymaster.ai/tools/job-description-keyword-extractor')
}
