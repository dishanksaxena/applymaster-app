import { Anthropic } from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: Request) {
  try {
    const { job_title, company, tone } = await request.json()

    if (!job_title || !company) {
      return Response.json({ error: 'Missing job_title or company' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Write a personalized cover letter for a ${job_title} position at ${company}.

Tone: ${tone}

Requirements:
- 3-4 paragraphs
- Personalized to the company and role
- Professional but engaging
- Highlight relevant skills and achievements
- Include a strong closing

Start with "Dear Hiring Manager," and end with "Sincerely, [Your Name]"

Write only the cover letter, no additional text.`,
        },
      ],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    return Response.json({ cover_letter: content })
  } catch (error) {
    console.error('Error generating cover letter:', error)
    return Response.json({ error: 'Failed to generate cover letter' }, { status: 500 })
  }
}
