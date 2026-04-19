import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Get primary resume
    const { data: resume, error: resumeErr } = await supabase
      .from('resumes').select('*').eq('user_id', user.id).eq('is_primary', true).single()

    if (resumeErr || !resume) {
      return Response.json({ error: 'No primary resume found. Upload one first.' }, { status: 404 })
    }

    if (!resume.file_url) {
      return Response.json({ error: 'Resume has no file URL. Re-upload your resume.' }, { status: 400 })
    }

    // Extract storage path from URL: .../object/public/resumes/USER_ID/FILE.pdf → USER_ID/FILE.pdf
    let storagePath: string
    try {
      const urlObj = new URL(resume.file_url)
      const marker = '/object/public/resumes/'
      const idx = urlObj.pathname.indexOf(marker)
      if (idx === -1) throw new Error('bad url')
      storagePath = decodeURIComponent(urlObj.pathname.slice(idx + marker.length))
    } catch {
      return Response.json({ error: 'Could not parse storage path. Re-upload your resume.' }, { status: 400 })
    }

    // Download via admin client (bypasses bucket access policies)
    const { data: fileBlob, error: dlError } = await adminSupabase.storage
      .from('resumes').download(storagePath)

    if (dlError || !fileBlob) {
      return Response.json({
        error: `Storage download failed: ${dlError?.message || 'file not found'}. Re-upload your resume.`
      }, { status: 500 })
    }

    const buffer = Buffer.from(await fileBlob.arrayBuffer())
    const base64 = buffer.toString('base64')

    // Single Claude call — extract structured data AND raw text together
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } } as any,
          {
            type: 'text',
            text: `Parse this resume PDF and return a single JSON object. No markdown, no explanation.

{
  "raw_text": "all text from the resume as plain text",
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "summary": "string",
  "skills": ["string"],
  "experience": [{"company":"","title":"","start_date":"","end_date":"","is_current":false,"description":""}],
  "education": [{"institution":"","degree":"","field":"","end_date":"","gpa":""}],
  "certifications": ["string"],
  "languages": ["string"],
  "total_years_experience": number
}`
          }
        ]
      }]
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    let parsed: any = {}
    try {
      parsed = JSON.parse(cleaned.match(/\{[\s\S]*\}/)?.[0] || '{}')
    } catch {
      parsed = {}
    }

    const rawText: string = parsed.raw_text || ''

    // Upsert into parsed_resumes
    await adminSupabase.from('parsed_resumes').upsert({
      resume_id: resume.id,
      user_id: user.id,
      full_name: parsed.full_name || null,
      email: parsed.email || null,
      phone: parsed.phone || null,
      location: parsed.location || null,
      summary: parsed.summary || null,
      skills: parsed.skills || [],
      experience: parsed.experience || [],
      education: parsed.education || [],
      certifications: parsed.certifications || [],
      languages: parsed.languages || [],
      raw_text: rawText || null,
    }, { onConflict: 'resume_id' })

    // Update resumes.parsed_data
    await adminSupabase.from('resumes').update({ parsed_data: parsed }).eq('id', resume.id)

    // Update profile
    const profileUpdate: Record<string, unknown> = {
      professional_summary: parsed.summary || null,
      work_experience: (parsed.experience || []).map((e: any) => ({
        company: e.company, title: e.title,
        startDate: e.start_date, endDate: e.end_date, description: e.description,
      })),
      education: (parsed.education || []).map((e: any) => ({
        school: e.institution, degree: e.degree, field: e.field, endDate: e.end_date,
      })),
      certifications: parsed.certifications || [],
    }
    if (parsed.full_name) profileUpdate.full_name = parsed.full_name

    await adminSupabase.from('profiles').update(profileUpdate).eq('id', user.id)

    return Response.json({
      success: true,
      full_name: parsed.full_name,
      skills_count: (parsed.skills || []).length,
      experience_count: (parsed.experience || []).length,
      raw_text_length: rawText.length,
      message: `Parsed — ${(parsed.skills || []).length} skills, ${(parsed.experience || []).length} roles. God Mode ready!`,
    })

  } catch (err: any) {
    console.error('[reparse] Error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
