import { OG_SIZE, ogImage } from '@/lib/seo/og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = "Supported Job Boards & ATS Platforms"

export default function Image() {
  return ogImage("ApplyMaster", "Supported Job Boards & ATS Platforms", 'www.applymaster.ai/integrations')
}
