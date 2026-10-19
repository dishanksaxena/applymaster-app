import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Free ATS resume checker'

export default function Image() {
  return ogImage('Free tool', 'Free ATS resume checker', 'www.applymaster.ai/tools/ats-resume-checker')
}
