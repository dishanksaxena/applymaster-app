import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { signResumeUrl } from '@/lib/resume-files'

/**
 * Open a resume file you own.
 *
 *   /api/resume/file?resume=<resume id>
 *   /api/resume/file?receipt=<receipt id>   the exact version sent with an application
 *
 * The row is read with the signed-in user's own client, so row-level
 * security decides ownership: someone else's id simply finds nothing. Only
 * then is a two-minute signed URL issued and the browser redirected to it.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const params = new URL(req.url).searchParams
  const resumeId = params.get('resume')
  const receiptId = params.get('receipt')

  let stored: string | null = null
  if (receiptId) {
    const { data } = await supabase
      .from('application_receipts')
      .select('resume_file_url, resume_id')
      .eq('id', receiptId)
      .maybeSingle()
    stored = data?.resume_file_url ?? null
    // Older receipts recorded the resume row but not its URL.
    if (!stored && data?.resume_id) {
      const { data: r } = await supabase.from('resumes').select('file_url').eq('id', data.resume_id).maybeSingle()
      stored = r?.file_url ?? null
    }
  } else if (resumeId) {
    const { data } = await supabase.from('resumes').select('file_url').eq('id', resumeId).maybeSingle()
    stored = data?.file_url ?? null
  }

  if (!stored) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  const signed = await signResumeUrl(stored, 120)
  if (!signed) return NextResponse.json({ error: 'File not found' }, { status: 404 })
  return NextResponse.redirect(signed)
}
