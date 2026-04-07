import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic();

// ---------------------------------------------------------------------------
// Structured resume parsing — single Claude call for speed
// ---------------------------------------------------------------------------

interface ParsedResume {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: {
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  education: {
    school: string;
    degree: string;
    field: string;
    endDate: string;
  }[];
  certifications: string[];
  total_years_experience: number;
}

// Single Claude call that reads PDF directly + extracts structured data
async function parseResumeFromPDF(buffer: Buffer): Promise<ParsedResume> {
  console.log('[extract] Using Claude document API for direct PDF parsing...');
  const base64 = buffer.toString('base64');

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          },
          {
            type: 'text',
            text: `You are a resume parser. Read this PDF resume and extract ALL structured data.

Return ONLY valid JSON (no markdown fences, no explanation) with this exact schema:

{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "summary": "string — a professional summary or objective if present, otherwise generate a brief one",
  "skills": ["string"],
  "experience": [
    {
      "company": "string",
      "title": "string",
      "startDate": "string (e.g. Jan 2020)",
      "endDate": "string (e.g. Present)",
      "description": "string — bullet points or summary of responsibilities"
    }
  ],
  "education": [
    {
      "school": "string",
      "degree": "string",
      "field": "string",
      "endDate": "string (e.g. 2022)"
    }
  ],
  "certifications": ["string"],
  "total_years_experience": number
}

If a field is not found, use an empty string or empty array. For total_years_experience, estimate from work history dates.`,
          },
        ],
      },
    ],
  });

  const rawOutput =
    response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('') || '{}';

  console.log('[extract] Claude output length:', rawOutput.length);

  const cleaned = rawOutput.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    const parsed: ParsedResume = JSON.parse(cleaned);
    console.log('[extract] Parsed name:', parsed.full_name);
    console.log('[extract] Skills:', parsed.skills?.length ?? 0);
    console.log('[extract] Experience:', parsed.experience?.length ?? 0);
    return parsed;
  } catch (err) {
    console.error('[extract] JSON parse failed:', err);
    console.error('[extract] Raw:', cleaned.slice(0, 500));
    throw new Error('Failed to parse structured resume data');
  }
}

// For DOCX: extract text first, then parse with Claude (text-only, no document API)
async function parseResumeFromText(text: string): Promise<ParsedResume> {
  console.log('[extract] Parsing extracted text with Claude...');

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are a resume parser. Analyze this resume text and extract ALL structured data.

Return ONLY valid JSON (no markdown fences, no explanation) with this exact schema:

{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "summary": "string — a professional summary or objective if present, otherwise generate a brief one",
  "skills": ["string"],
  "experience": [
    {
      "company": "string",
      "title": "string",
      "startDate": "string (e.g. Jan 2020)",
      "endDate": "string (e.g. Present)",
      "description": "string — bullet points or summary of responsibilities"
    }
  ],
  "education": [
    {
      "school": "string",
      "degree": "string",
      "field": "string",
      "endDate": "string (e.g. 2022)"
    }
  ],
  "certifications": ["string"],
  "total_years_experience": number
}

If a field is not found, use an empty string or empty array. For total_years_experience, estimate from work history dates.

Resume text:
"""
${text}
"""`,
      },
    ],
  });

  const rawOutput =
    response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('') || '{}';

  const cleaned = rawOutput.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[extract] JSON parse failed:', err);
    throw new Error('Failed to parse structured resume data');
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[extract] ===== Resume extract endpoint called =====');

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    console.log('[extract] userId:', userId);
    console.log('[extract] file:', file?.name, file?.type, file?.size, 'bytes');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'No userId provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();

    // Parse resume — single Claude call for PDFs, text extraction + call for DOCX
    let parsed: ParsedResume;

    if (fileName.endsWith('.pdf')) {
      // Direct PDF → Claude document API (single call, no pdf-parse needed)
      parsed = await parseResumeFromPDF(buffer);
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      const text = await extractTextFromDOCX(buffer);
      if (!text || text.trim().length < 20) {
        return NextResponse.json({ error: 'Could not extract text from file.' }, { status: 400 });
      }
      parsed = await parseResumeFromText(text);
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Upload PDF or DOCX.' }, { status: 400 });
    }

    console.log('[extract] Parsing done in', Date.now() - startTime, 'ms');

    // Upload file to Supabase Storage (non-blocking — don't wait if it's slow)
    const storagePath = `${userId}/${Date.now()}.${fileName.split('.').pop()}`;
    let fileUrl = '';

    try {
      const { error: storageError } = await adminSupabase.storage
        .from('resumes')
        .upload(storagePath, buffer, { contentType: file.type || 'application/pdf' });

      if (!storageError) {
        const { data: urlData } = adminSupabase.storage.from('resumes').getPublicUrl(storagePath);
        fileUrl = urlData.publicUrl;
        console.log('[extract] File uploaded to storage');
      } else {
        console.error('[extract] Storage error:', storageError.message);
      }
    } catch (err) {
      console.error('[extract] Storage upload failed:', err);
    }

    // Save to profiles table
    const profileUpdate: Record<string, unknown> = {
      professional_summary: parsed.summary || null,
      work_experience: (parsed.experience || []).map((exp) => ({
        company: exp.company,
        title: exp.title,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description,
      })),
      education: (parsed.education || []).map((edu) => ({
        school: edu.school,
        degree: edu.degree,
        field: edu.field,
        endDate: edu.endDate,
      })),
      certifications: parsed.certifications || [],
      resume_url: fileUrl || null,
      resume_name: file.name,
    };
    if (parsed.full_name) profileUpdate.full_name = parsed.full_name;
    // Don't overwrite auth email — keep the email from login (dishank@applymaster.ai)

    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId);

    if (profileError) {
      console.error('[extract] Profile save error:', profileError.message);
    } else {
      console.log('[extract] Profile saved successfully');
    }

    // Save to resumes table
    await adminSupabase.from('resumes').update({ is_primary: false }).eq('user_id', userId);

    const { data: resumeResult, error: resumeError } = await adminSupabase
      .from('resumes')
      .insert({
        user_id: userId,
        name: file.name,
        file_url: fileUrl,
        parsed_data: parsed,
        is_primary: true,
      })
      .select()
      .single();

    if (resumeError) {
      console.error('[extract] Resume save error:', resumeError.message);
    }

    const totalTime = Date.now() - startTime;
    console.log(`[extract] ===== Complete in ${totalTime}ms =====`);

    return NextResponse.json({
      success: true,
      data: parsed,
      resumeId: resumeResult?.id || null,
      profileSaved: !profileError,
      resumeSaved: !resumeError,
      processingTime: totalTime,
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[extract] ===== FAILED after ${totalTime}ms =====`);
    console.error('[extract] Error:', error instanceof Error ? error.message : String(error));

    return NextResponse.json(
      { error: 'Failed to process resume', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
