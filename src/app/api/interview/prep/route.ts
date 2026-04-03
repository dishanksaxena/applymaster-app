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

    const { action, interview_type, job_title, company, job_description, question, answer, session_id } = await req.json()

    // Get user's resume for context
    let resumeContext = ''
    const { data: primary } = await supabase
      .from('resumes')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single()

    if (primary) {
      const { data: parsed } = await supabase
        .from('parsed_resumes')
        .select('full_name, skills, experience, summary')
        .eq('resume_id', primary.id)
        .single()

      if (parsed) {
        resumeContext = `
Candidate: ${parsed.full_name || 'Unknown'}
Skills: ${(parsed.skills || []).slice(0, 15).join(', ')}
Recent Experience: ${parsed.experience?.[0]?.title || 'N/A'} at ${parsed.experience?.[0]?.company || 'N/A'}
Background: ${parsed.summary?.slice(0, 200) || ''}
        `.trim()
      }
    }

    // ACTION: Generate questions
    if (action === 'generate_questions') {
      const questionTypes = {
        behavioral: 'behavioral STAR-method questions about past experiences',
        technical: 'technical questions testing specific skills and problem-solving',
        system_design: 'system design and architecture questions',
        case_study: 'business case study and analytical questions',
        mock_full: 'a mix of behavioral, technical, and situational questions',
      }

      const msg = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Generate 8 interview questions for this scenario.

Job: ${job_title} at ${company || 'a company'}
Interview Type: ${questionTypes[interview_type as keyof typeof questionTypes] || 'general'}
${job_description ? `Job Description: ${job_description.slice(0, 1000)}` : ''}
${resumeContext ? `Candidate Background:\n${resumeContext}` : ''}

Return ONLY valid JSON array:
[
  {
    "id": 1,
    "question": "Full question text",
    "category": "behavioral|technical|situational|culture",
    "difficulty": "easy|medium|hard",
    "tip": "Brief tip on how to approach this question",
    "time_limit_seconds": 120
  }
]

Make questions specific to the role and company. Include realistic, commonly-asked questions.`,
          },
        ],
      })

      const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
      let questions
      try {
        questions = JSON.parse(text)
      } catch {
        const match = text.match(/\[[\s\S]*\]/)
        questions = match ? JSON.parse(match[0]) : []
      }

      // Save session (non-fatal if table missing)
      let sessionId = null
      try {
        const { data: session } = await supabase
          .from('interview_sessions')
          .insert({
            user_id: user.id,
            interview_type: interview_type || 'behavioral',
            questions,
            answers: [],
            feedback: [],
          })
          .select('id')
          .single()
        sessionId = session?.id
      } catch { /* table may not exist yet */ }

      return Response.json({ questions, session_id: sessionId })
    }

    // ACTION: Score an answer
    if (action === 'score_answer') {
      if (!question || !answer) {
        return Response.json({ error: 'question and answer required' }, { status: 400 })
      }

      const msg = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are an expert interviewer. Evaluate this interview answer objectively.

Question: ${question}
Candidate Answer: ${answer}
${resumeContext ? `Candidate Background:\n${resumeContext}` : ''}

Return ONLY valid JSON:
{
  "score": <0-100 integer>,
  "verdict": "excellent|good|average|needs_improvement",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "better_answer": "A model answer demonstrating best practices",
  "keywords_used": ["keyword1", "keyword2"],
  "keywords_missed": ["keyword1", "keyword2"],
  "structure_feedback": "Comment on answer structure (STAR method etc)"
}`,
          },
        ],
      })

      const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
      let feedback
      try {
        feedback = JSON.parse(text)
      } catch {
        const match = text.match(/\{[\s\S]*\}/)
        feedback = match ? JSON.parse(match[0]) : { score: 70, verdict: 'good' }
      }

      // Save answer and feedback to session (non-fatal)
      if (session_id) {
        try {
          const { data: session } = await supabase
            .from('interview_sessions')
            .select('answers, feedback')
            .eq('id', session_id)
            .eq('user_id', user.id)
            .single()
          if (session) {
            const answers = [...(session.answers || []), { question, answer, timestamp: new Date().toISOString() }]
            const feedbackArr = [...(session.feedback || []), feedback]
            await supabase.from('interview_sessions').update({ answers, feedback: feedbackArr }).eq('id', session_id)
          }
        } catch { /* non-fatal */ }
      }

      return Response.json(feedback)
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Interview prep error:', err)
    const isCredits = msg.includes('credit balance') || msg.includes('billing')
    return Response.json({
      error: isCredits ? 'AI credits exhausted — please top up Anthropic account' : 'Interview prep failed'
    }, { status: 500 })
  }
}
