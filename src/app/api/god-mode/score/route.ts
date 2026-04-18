import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic()

// 10 weighted scoring dimensions
const DIMENSIONS = [
  { key: 'title_match',        label: 'Title & Role Match',         weight: 15 },
  { key: 'skills_match',       label: 'Skills Match',               weight: 20 },
  { key: 'experience_level',   label: 'Experience Level Fit',       weight: 15 },
  { key: 'location_remote',    label: 'Location / Remote Fit',      weight: 10 },
  { key: 'salary_match',       label: 'Salary Range Match',         weight: 10 },
  { key: 'industry_domain',    label: 'Industry / Domain Fit',      weight: 10 },
  { key: 'company_stage',      label: 'Company Stage Fit',          weight: 5  },
  { key: 'growth_potential',   label: 'Growth Potential',           weight: 5  },
  { key: 'tech_stack',         label: 'Tech Stack Alignment',       weight: 5  },
  { key: 'culture_values',     label: 'Culture & Values Fit',       weight: 5  },
]

function scoreToGrade(score: number): string {
  if (score >= 90) return 'A+'
  if (score >= 85) return 'A'
  if (score >= 80) return 'A-'
  if (score >= 75) return 'B+'
  if (score >= 70) return 'B'
  if (score >= 65) return 'B-'
  if (score >= 60) return 'C+'
  if (score >= 55) return 'C'
  if (score >= 50) return 'C-'
  if (score >= 40) return 'D'
  return 'F'
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { job_title, company, job_description, location, salary_min, salary_max, remote_type } = await req.json()

    if (!job_title) return Response.json({ error: 'job_title required' }, { status: 400 })

    // Get user profile, parsed resume, and preferences in parallel
    const [{ data: profile }, { data: prefs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('job_preferences').select('*').eq('user_id', user.id).single(),
    ])

    let parsedResume: any = null
    const { data: primaryResume } = await supabase
      .from('resumes').select('id').eq('user_id', user.id).eq('is_primary', true).single()
    if (primaryResume) {
      const { data } = await supabase
        .from('parsed_resumes').select('*').eq('resume_id', primaryResume.id).single()
      parsedResume = data
    }

    const candidateContext = `
CANDIDATE PROFILE:
Name: ${parsedResume?.full_name || profile?.full_name || 'Unknown'}
Current Title: ${parsedResume?.experience?.[0]?.title || 'N/A'}
Total Experience: ${parsedResume?.total_years_experience || prefs?.experience_level || 'Unknown'} years
Skills: ${(parsedResume?.skills || []).slice(0, 25).join(', ')}
Education: ${parsedResume?.education?.[0]?.degree || 'Unknown'} in ${parsedResume?.education?.[0]?.field || 'Unknown'}
Summary: ${parsedResume?.summary?.slice(0, 400) || 'N/A'}
Recent Companies: ${(parsedResume?.experience || []).slice(0, 3).map((e: any) => `${e.title} at ${e.company}`).join(', ')}

CANDIDATE PREFERENCES:
Desired Roles: ${prefs?.job_titles?.join(', ') || 'Not specified'}
Preferred Locations: ${prefs?.locations?.join(', ') || 'Any'}
Remote Preference: ${prefs?.remote_type || 'Any'}
Min Salary: ${prefs?.min_salary || 'Not specified'}
Experience Level: ${prefs?.experience_level || 'Not specified'}
`.trim()

    const jobContext = `
JOB DETAILS:
Title: ${job_title}
Company: ${company || 'Unknown'}
Location: ${location || 'Not specified'}
Remote Type: ${remote_type || 'Not specified'}
Salary: ${salary_min ? `$${salary_min.toLocaleString()}${salary_max ? ` - $${salary_max.toLocaleString()}` : '+'}` : 'Not specified'}
Description: ${job_description?.slice(0, 2000) || 'Not provided'}
`.trim()

    const dimensionsList = DIMENSIONS.map(d => `- ${d.key} (weight: ${d.weight}%): ${d.label}`).join('\n')

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are a senior career advisor scoring how well a job matches a candidate. Be honest and precise.

${candidateContext}

${jobContext}

Score this job across these 10 dimensions (0-100 each):
${dimensionsList}

Return ONLY valid JSON (no markdown, no explanation):
{
  "dimensions": {
    "title_match": { "score": 0-100, "reason": "one line" },
    "skills_match": { "score": 0-100, "reason": "one line" },
    "experience_level": { "score": 0-100, "reason": "one line" },
    "location_remote": { "score": 0-100, "reason": "one line" },
    "salary_match": { "score": 0-100, "reason": "one line" },
    "industry_domain": { "score": 0-100, "reason": "one line" },
    "company_stage": { "score": 0-100, "reason": "one line" },
    "growth_potential": { "score": 0-100, "reason": "one line" },
    "tech_stack": { "score": 0-100, "reason": "one line" },
    "culture_values": { "score": 0-100, "reason": "one line" }
  },
  "strengths": ["top 2-3 reasons this is a good fit"],
  "gaps": ["top 1-2 areas where candidate doesn't fully match"],
  "recommendation": "one sentence on whether to apply and why"
}`
      }]
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    let parsed: any
    try { parsed = JSON.parse(text) }
    catch {
      const match = text.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : { dimensions: {} }
    }

    // Calculate weighted score
    let totalScore = 0
    const dims = parsed.dimensions || {}
    for (const dim of DIMENSIONS) {
      const s = dims[dim.key]?.score || 0
      totalScore += (s * dim.weight) / 100
    }
    totalScore = Math.round(totalScore)

    const grade = scoreToGrade(totalScore)

    return Response.json({
      score: totalScore,
      grade,
      dimensions: DIMENSIONS.map(d => ({
        ...d,
        score: dims[d.key]?.score || 0,
        reason: dims[d.key]?.reason || '',
      })),
      strengths: parsed.strengths || [],
      gaps: parsed.gaps || [],
      recommendation: parsed.recommendation || '',
    })

  } catch (err) {
    console.error('Score error:', err)
    return Response.json({ error: 'Failed to score job' }, { status: 500 })
  }
}
