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

    const { job_title, company, job_description } = await req.json()
    if (!job_title || !job_description) {
      return Response.json({ error: 'job_title and job_description required' }, { status: 400 })
    }

    // Get user's primary parsed resume
    const { data: primaryResume } = await supabase
      .from('resumes').select('id').eq('user_id', user.id).eq('is_primary', true).single()

    if (!primaryResume) {
      return Response.json({ error: 'No primary resume found. Please upload your resume first.' }, { status: 404 })
    }

    const { data: parsedResume } = await supabase
      .from('parsed_resumes').select('*').eq('resume_id', primaryResume.id).single()

    if (!parsedResume) {
      return Response.json({ error: 'Resume not yet parsed. Please wait for parsing to complete.' }, { status: 404 })
    }

    const resumeText = parsedResume.raw_text || JSON.stringify(parsedResume, null, 2)

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `You are an expert ATS resume optimizer. Tailor this resume specifically for the target job.

TARGET JOB:
Title: ${job_title}
Company: ${company || 'Unknown'}
Description: ${job_description.slice(0, 3000)}

ORIGINAL RESUME:
${resumeText.slice(0, 4000)}

Your task:
1. Extract the TOP 10-15 keywords/skills from the job description that an ATS would scan for
2. Rewrite experience bullet points to naturally incorporate missing keywords (do NOT invent experience)
3. Rewrite the professional summary targeting this specific role
4. Keep all facts true — only reframe existing experience to highlight relevance

Return ONLY valid JSON (no markdown):
{
  "ats_keywords": ["keyword1", "keyword2", ...],
  "keywords_already_present": ["skill already in resume"],
  "keywords_added": ["skill naturally woven in"],
  "tailored_summary": "2-3 sentence professional summary targeting this role",
  "tailored_bullets": [
    {
      "original": "original bullet text",
      "tailored": "rewritten bullet with keywords naturally integrated",
      "keywords_added": ["keyword"]
    }
  ],
  "ats_score_before": 0-100,
  "ats_score_after": 0-100,
  "match_improvements": ["specific improvements made"]
}`
      }]
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    let tailored: any
    try { tailored = JSON.parse(text) }
    catch {
      const match = text.match(/\{[\s\S]*\}/)
      tailored = match ? JSON.parse(match[0]) : {}
    }

    // Store tailored resume in DB for this application
    // (stored as a separate record linked to the original resume)
    const { data: tailoredRecord } = await supabase
      .from('tailored_resumes')
      .insert({
        user_id: user.id,
        base_resume_id: primaryResume.id,
        job_title,
        company,
        ats_keywords: tailored.ats_keywords || [],
        tailored_summary: tailored.tailored_summary || '',
        tailored_bullets: tailored.tailored_bullets || [],
        ats_score_before: tailored.ats_score_before || 0,
        ats_score_after: tailored.ats_score_after || 0,
      })
      .select('id')
      .single()

    return Response.json({
      tailored_resume_id: tailoredRecord?.id,
      ...tailored,
    })

  } catch (err) {
    console.error('Tailor resume error:', err)
    return Response.json({ error: 'Failed to tailor resume' }, { status: 500 })
  }
}
