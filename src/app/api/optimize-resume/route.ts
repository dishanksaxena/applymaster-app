import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { job_title, job_description, job_id, resume_id } = await req.json()

    if (!job_title) {
      return Response.json({ error: 'job_title required' }, { status: 400 })
    }

    // Get user's primary parsed resume
    let rawText = ''
    let parsedResume = null
    let resumeRecordId = resume_id

    if (resume_id) {
      const { data } = await supabase
        .from('parsed_resumes')
        .select('*')
        .eq('resume_id', resume_id)
        .single()
      parsedResume = data
      rawText = data?.raw_text || ''
    } else {
      const { data: primary } = await supabase
        .from('resumes')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single()

      if (primary) {
        resumeRecordId = primary.id
        const { data } = await supabase
          .from('parsed_resumes')
          .select('*')
          .eq('resume_id', primary.id)
          .single()
        parsedResume = data
        rawText = data?.raw_text || ''
      }
    }

    if (!rawText && !parsedResume) {
      return Response.json({ error: 'No resume found. Please upload your resume first.' }, { status: 404 })
    }

    // Use structured data if raw text not available
    const resumeContent = rawText || JSON.stringify(parsedResume, null, 2)

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `You are an expert ATS optimization specialist and professional resume writer. Optimize this resume for the specific job posting.

JOB POSTING:
Title: ${job_title}
${job_description ? `Description: ${job_description.slice(0, 3000)}` : ''}

ORIGINAL RESUME:
${resumeContent.slice(0, 4000)}

TASK: Rewrite and optimize this resume to maximize ATS score and match for this specific role.

Return ONLY valid JSON (no markdown):
{
  "ats_score": <0-100 score for optimized version>,
  "original_score": <estimated original ATS score>,
  "tailored_resume": "Full optimized resume as plain text, professionally formatted",
  "key_changes": ["Change 1", "Change 2", "Change 3", "Change 4", "Change 5"],
  "keywords_added": ["keyword1", "keyword2", "keyword3"],
  "keywords_to_add_manually": ["keyword that requires actual experience"],
  "tailored_summary": "2-3 sentence tailored professional summary",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Improvement 1", "Improvement 2"]
}`,
        },
      ],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    let result
    try {
      result = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      result = match ? JSON.parse(match[0]) : { ats_score: 75, optimized_resume_text: text }
    }

    // Save optimized version
    if (resumeRecordId && job_id) {
      await supabase.from('optimized_resumes').insert({
        user_id: user.id,
        resume_id: resumeRecordId,
        job_id,
        optimized_text: result.optimized_resume_text || '',
        ats_score: result.ats_score,
        changes_made: result.key_changes || [],
      })
    }

    return Response.json(result)
  } catch (err) {
    console.error('Resume optimization error:', err)
    return Response.json({ error: 'Optimization failed' }, { status: 500 })
  }
}
