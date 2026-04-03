import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic()

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Check if file is likely a PDF
    const pdfHeader = buffer.toString('utf8', 0, 4)
    if (!pdfHeader.startsWith('%PDF')) {
      throw new Error('Invalid PDF file format')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfModule = await import('pdf-parse') as any
    const pdfParse = pdfModule.default || pdfModule
    const data = await pdfParse(buffer)

    if (!data.text) {
      throw new Error('Failed to extract text from PDF')
    }

    return data.text
  } catch (err) {
    console.error('PDF extraction error:', err)
    throw new Error(`Failed to read file contents: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

async function parseResumeWithClaude(rawText: string) {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
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
  try {
    return JSON.parse(text)
  } catch {
    // Try to extract JSON from the response
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Failed to parse Claude response as JSON')
  }
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

    // Save resume record
    const { data: resumeRecord, error: resumeError } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        name: file.name,
        file_url: fileUrl,
        is_primary: true,
        parsed_data: parsed,
      })
      .select()
      .single()

    if (resumeError) {
      console.error('Resume DB error:', resumeError)
      return Response.json({ error: 'Failed to save resume' }, { status: 500 })
    }

    // Save parsed resume in structured table
    await supabase.from('parsed_resumes').upsert({
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

    // Update all previous resumes as non-primary
    await supabase
      .from('resumes')
      .update({ is_primary: false })
      .eq('user_id', user.id)
      .neq('id', resumeRecord.id)

    // Update profile
    await supabase
      .from('profiles')
      .update({
        full_name: parsed.full_name || undefined,
      })
      .eq('id', user.id)

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
