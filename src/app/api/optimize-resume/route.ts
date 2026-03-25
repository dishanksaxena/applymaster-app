import { Anthropic } from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: Request) {
  try {
    const { resume_id, job_title, resume_text } = await request.json()

    if (!resume_text || !job_title) {
      return Response.json({ error: 'Missing resume_text or job_title' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are an expert ATS (Applicant Tracking System) optimizer. Analyze this resume for the job title "${job_title}" and provide:

1. An ATS compatibility score (0-100)
2. 3-4 key strengths
3. 3-4 improvement recommendations
4. A brief tailored version optimized for this job

Resume text:
${resume_text}

Respond in JSON format:
{
  "ats_score": number,
  "strengths": [strings],
  "improvements": [strings],
  "tailored_resume": "string"
}`,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const result = JSON.parse(responseText)

    return Response.json(result)
  } catch (error) {
    console.error('Error optimizing resume:', error)
    return Response.json({ error: 'Failed to optimize resume' }, { status: 500 })
  }
}
