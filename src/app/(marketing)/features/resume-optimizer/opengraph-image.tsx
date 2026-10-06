import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = "AI Resume Optimizer & ATS Resume Builder"

export default function Image() {
  return ogImage("Features", "AI Resume Optimizer & ATS Resume Builder", 'www.applymaster.ai/features/resume-optimizer')
}
