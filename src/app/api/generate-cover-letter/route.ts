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

    const { job_title, company, job_description, tone = 'professional', job_id } = await req.json()

    if (!job_title || !company) {
      return Response.json({ error: 'job_title and company required' }, { status: 400 })
    }

    // Get user's primary parsed resume for personalization
    let resumeContext = ''
    let candidateName = 'the candidate'

    const { data: primaryResume } = await supabase
      .from('resumes')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single()

    if (primaryResume) {
      const { data: parsedResume } = await supabase
        .from('parsed_resumes')
        .select('*')
        .eq('resume_id', primaryResume.id)
        .single()

      if (parsedResume) {
        candidateName = parsedResume.full_name || 'the candidate'
        resumeContext = `
Candidate Name: ${parsedResume.full_name || 'Unknown'}
Skills: ${(parsedResume.skills || []).slice(0, 20).join(', ')}
Most Recent Role: ${parsedResume.experience?.[0]?.title || 'N/A'} at ${parsedResume.experience?.[0]?.company || 'N/A'}
Key Achievement: ${parsedResume.experience?.[0]?.description?.slice(0, 300) || ''}
Education: ${parsedResume.education?.[0]?.degree || ''} in ${parsedResume.education?.[0]?.field || ''} from ${parsedResume.education?.[0]?.institution || ''}
Summary: ${parsedResume.summary?.slice(0, 300) || ''}
        `.trim()
      }
    }

    const toneInstructions: Record<string, string> = {
      professional: 'formal, polished, and professional tone',
      casual: 'conversational yet respectful tone',
      enthusiastic: 'energetic, passionate, and enthusiastic tone',
      confident: 'assertive, confident, and results-focused tone',
    }
    const toneText = toneInstructions[tone] || 'professional tone'

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Write a highly personalized, compelling cover letter for this job application.

JOB DETAILS:
Position: ${job_title}
Company: ${company}
${job_description ? `Job Description: ${job_description.slice(0, 2000)}` : ''}

CANDIDATE BACKGROUND:
${resumeContext || 'No resume data available — write a general but compelling letter.'}

TONE: Use a ${toneText}

REQUIREMENTS:
- Start with "Dear Hiring Team,"
- 3-4 powerful paragraphs
- Reference specific skills and achievements from the resume
- Show genuine interest in ${company} specifically
- Quantify achievements where possible
- Strong, memorable closing with a call to action
- End with "Best regards,\n${candidateName}"
- Write ONLY the letter body, nothing else`,
        },
      ],
    })

    const coverLetter = msg.content[0].type === 'text' ? msg.content[0].text : ''

    // Save to database
    const { data: savedLetter } = await supabase
      .from('cover_letters')
      .insert({
        user_id: user.id,
        job_id: job_id || null,
        content: coverLetter,
        tone,
        job_title,
        company,
      })
      .select('id')
      .single()

    return Response.json({
      cover_letter: coverLetter,
      cover_letter_id: savedLetter?.id || null,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Cover letter error:', err)
    const isCredits = msg.includes('credit balance') || msg.includes('billing')
    return Response.json({
      error: isCredits ? 'AI credits exhausted — please top up Anthropic account' : 'Failed to generate cover letter'
    }, { status: 500 })
  }
}
