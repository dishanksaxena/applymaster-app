import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Skills, pay and hiring by role'

export default function Image() {
  return ogImage('Skills, pay and hiring', 'Skills, pay and hiring by role', 'www.applymaster.ai/roles')
}
