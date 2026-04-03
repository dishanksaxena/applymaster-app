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

    const { job_id, job_title, job_description, job_company, resume_id } = await req.json()

    if (!job_description || !job_title) {
      return Response.json({ error: 'job_title and job_description required' }, { status: 400 })
    }

    // Get user's primary parsed resume
    let parsedResume = null
    let resumeRecordId = resume_id

    if (resume_id) {
      const { data } = await supabase
        .from('parsed_resumes')
        .select('*')
        .eq('resume_id', resume_id)
        .single()
      parsedResume = data
    } else {
      // Get primary resume
      const { data: primaryResume } = await supabase
        .from('resumes')
        .select('id, parsed_data')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single()

      if (primaryResume) {
        resumeRecordId = primaryResume.id
        const { data } = await supabase
          .from('parsed_resumes')
          .select('*')
          .eq('resume_id', primaryResume.id)
          .single()
        parsedResume = data
      }
    }

    if (!parsedResume) {
      return Response.json({ error: 'No parsed resume found. Please upload your resume first.' }, { status: 404 })
    }

    // Build resume summary for Claude
    const resumeSummary = `
Name: ${parsedResume.full_name || 'Candidate'}
Skills: ${(parsedResume.skills || []).join(', ')}
Experience: ${JSON.stringify(parsedResume.experience || [])}
Education: ${JSON.stringify(parsedResume.education || [])}
Summary: ${parsedResume.summary || ''}
Total Experience: ${parsedResume.total_years_experience || 'Unknown'} years
    `.trim()

    const msg = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are an expert recruiter and ATS system. Analyze how well this candidate's resume matches the job posting.

JOB POSTING:
Title: ${job_title}
Company: ${job_company || 'Unknown'}
Description: ${job_description.slice(0, 3000)}

CANDIDATE RESUME:
${resumeSummary}

Provide a detailed match analysis. Return ONLY valid JSON (no markdown):
{
  "overall_score": <0-100 integer>,
  "skills_score": <0-100 integer>,
  "experience_score": <0-100 integer>,
  "education_score": <0-100 integer>,
  "match_reasons": ["reason1", "reason2", "reason3"],
  "missing_skills": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2"],
  "tailored_summary": "A 2-3 sentence pitch tailored for this specific job",
  "recommendation": "apply" | "consider" | "skip",
  "recommendation_reason": "Brief explanation"
}`,
        },
      ],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    let matchData
    try {
      matchData = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      matchData = match ? JSON.parse(match[0]) : { overall_score: 50 }
    }

    // Save to job_matches table if we have a job_id
    if (job_id && resumeRecordId) {
      await supabase.from('job_matches').upsert({
        user_id: user.id,
        job_id,
        resume_id: resumeRecordId,
        overall_score: matchData.overall_score,
        skills_score: matchData.skills_score,
        experience_score: matchData.experience_score,
        education_score: matchData.education_score,
        match_reasons: matchData.match_reasons || [],
        missing_skills: matchData.missing_skills || [],
        tailored_summary: matchData.tailored_summary,
      })
    }

    return Response.json(matchData)
  } catch (err) {
    console.error('Match scoring error:', err)
    return Response.json({ error: 'Matching failed' }, { status: 500 })
  }
}
