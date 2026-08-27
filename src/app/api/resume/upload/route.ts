import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { tryParseModelJson } from '@/lib/model-json'

export const maxDuration = 60

const anthropic = new Anthropic()

// Admin client with service role — bypasses RLS for profile writes
const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Pull the text out of a PDF.
 *
 * Local extraction is tried first and the model is the fallback, which is
 * the right order — but the local path had never once succeeded. Two bugs
 * sat on top of each other:
 *
 *   1. `require('pdf-parse')(buffer)` is the v1 API. This project is on v2,
 *      which exports a PDFParse class instead, so every call threw
 *      "pdfParse is not a function" and fell through to the model. Every
 *      upload was paying for a Claude call to do something the library
 *      does locally in milliseconds.
 *
 *   2. Promise.race does not cancel the loser. The 5s timeout kept its
 *      timer whatever happened, so once the race settled the rejection had
 *      nobody left to catch it — an unhandled rejection that takes the
 *      route down rather than the request.
 *
 * The timer is cleared in a finally block now, and the timeout is 15s:
 * 5s was tight enough to fail on an ordinary multi-page CV.
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  let parser: { getText: () => Promise<{ text: string }>; destroy: () => Promise<void> } | null = null
  let timer: NodeJS.Timeout | undefined

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PDFParse } = require('pdf-parse')
    parser = new PDFParse({ data: new Uint8Array(buffer) })

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('PDF parsing timeout')), 15000)
    })

    const data = await Promise.race([parser!.getText(), timeout])
    if (data?.text?.trim()) return data.text
  } catch (err) {
    console.error('pdf-parse failed:', err instanceof Error ? err.message : String(err))
    // Fall through to the model.
  } finally {
    if (timer) clearTimeout(timer)
    await parser?.destroy().catch(() => {})
  }

  // Fallback to Claude API if pdf-parse fails
  try {
    const base64 = buffer.toString('base64')
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } } as any,
          { type: 'text', text: 'Extract all text from this PDF. Return only the text content.' }
        ]
      }]
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    if (text) return text
  } catch (err) {
    console.error('Claude API fallback failed:', err instanceof Error ? err.message : String(err))
  }

  throw new Error('Failed to read file contents')
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

async function parseResumeWithClaude(rawText: string) {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: `You are a professional resume parser. Extract all structured information from this resume text.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "full_name": "string",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "linkedin_url": "string or null",
  "portfolio_url": "string or null",
  "summary": "string or null",
  "skills": ["array", "of", "skills"],
  "experience": [
    {
      "company": "string",
      "title": "string",
      "start_date": "string",
      "end_date": "string or null (null if current)",
      "is_current": false,
      "location": "string or null",
      "description": "string with achievements and responsibilities"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "start_date": "string or null",
      "end_date": "string or null",
      "gpa": "string or null"
    }
  ],
  "certifications": ["array of certification names"],
  "languages": ["array of languages"],
  "total_years_experience": number
}

Resume text:
${rawText}`,
      },
    ],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
  return tryParseModelJson<any>(text, {}, msg.stop_reason)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const isDocx = file.name.endsWith('.docx')
    const isPdf = file.name.endsWith('.pdf') || file.type === 'application/pdf'

    if (!isPdf && !isDocx) {
      return Response.json({ error: 'Only PDF and DOCX files are supported' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: 'File size must be under 10MB' }, { status: 400 })
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text
    let rawText = ''
    try {
      rawText = isPdf
        ? await extractTextFromPDF(buffer)
        : await extractTextFromDOCX(buffer)
    } catch (e) {
      console.error('Text extraction error:', e)
      return Response.json({ error: 'Failed to read file contents' }, { status: 422 })
    }

    if (!rawText || rawText.trim().length < 50) {
      return Response.json({ error: 'Could not extract text from file. Try a different format.' }, { status: 422 })
    }

    // Upload file to Supabase Storage
    const ext = file.name.split('.').pop()
    const storagePath = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(storagePath, buffer, { contentType: file.type || (isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') })

    let fileUrl = ''
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(storagePath)
      fileUrl = urlData.publicUrl
    }

    // Parse with Claude AI
    let parsed
    try {
      parsed = await parseResumeWithClaude(rawText)
    } catch (e) {
      console.error('Claude parsing error:', e)
      return Response.json({ error: 'AI parsing failed. Please try again.' }, { status: 500 })
    }

    // Save resume record — use admin client to bypass RLS
    const { data: resumeRecord, error: resumeError } = await adminSupabase
      .from('resumes')
      .insert({
        user_id: user.id,
        name: file.name,
        file_url: fileUrl,
        is_primary: true,
        parsed_data: parsed,
      })
      .select()
      .maybeSingle()

    if (resumeError) {
      console.error('Resume DB error:', resumeError)
      return Response.json({ error: 'Failed to save resume' }, { status: 500 })
    }

    // Save parsed resume in structured table (ignore errors — optional table)
    try {
      await adminSupabase.from('parsed_resumes').upsert({
        resume_id: resumeRecord.id,
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
        raw_text: rawText,
      })
    } catch (e) {
      console.warn('parsed_resumes upsert failed (non-critical):', e)
    }

    // Update all previous resumes as non-primary
    await adminSupabase
      .from('resumes')
      .update({ is_primary: false })
      .eq('user_id', user.id)
      .neq('id', resumeRecord.id)

    // Update profile with ALL extracted data from resume
    const profileUpdate: Record<string, unknown> = {
      resume_url: fileUrl,
      resume_name: file.name,
      professional_summary: parsed.summary || null,
      work_experience: (parsed.experience || []).map((e: Record<string, unknown>) => ({
        company: e.company || '',
        title: e.title || '',
        startDate: e.start_date || '',
        endDate: e.end_date || '',
        description: e.description || '',
      })),
      education: (parsed.education || []).map((e: Record<string, unknown>) => ({
        school: e.institution || '',
        degree: e.degree || '',
        field: e.field || '',
        endDate: e.end_date || '',
      })),
      certifications: parsed.certifications || [],
    }
    if (parsed.full_name) profileUpdate.full_name = parsed.full_name
    // Don't overwrite auth email — keep the email from login

    // Use admin client to bypass RLS and guarantee profile is written
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
    } else {
      console.log('✓ Profile updated with resume data for user:', user.id)
    }

    return Response.json({
      success: true,
      resume_id: resumeRecord.id,
      parsed,
      file_url: fileUrl,
      skills_count: (parsed.skills || []).length,
      experience_count: (parsed.experience || []).length,
    })

  } catch (err) {
    console.error('Upload route error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
