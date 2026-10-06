import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'ApplyMaster: job application autofill for Chrome'

export default function Image() {
  return ogImage('Free Chrome extension', 'Stop typing your resume into every application', 'www.applymaster.ai/autofill')
}
