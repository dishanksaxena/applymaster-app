import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic()

// Detect portal type from URL
function detectPortal(url: string): { type: string; name: string; estimatedSeconds: number } {
  const u = url.toLowerCase()
  if (u.includes('greenhouse.io') || u.includes('boards.greenhouse')) return { type: 'greenhouse', name: 'Greenhouse', estimatedSeconds: 5 }
  if (u.includes('lever.co') || u.includes('jobs.lever')) return { type: 'lever', name: 'Lever', estimatedSeconds: 8 }
  if (u.includes('workday.com') || u.includes('myworkdayjobs')) return { type: 'workday', name: 'Workday', estimatedSeconds: 180 }
  if (u.includes('taleo.net') || u.includes('taleo')) return { type: 'taleo', name: 'Taleo', estimatedSeconds: 240 }
  if (u.includes('linkedin.com')) return { type: 'linkedin', name: 'LinkedIn', estimatedSeconds: 30 }
  if (u.includes('indeed.com')) return { type: 'indeed', name: 'Indeed', estimatedSeconds: 60 }
  if (u.includes('naukri.com')) return { type: 'naukri', name: 'Naukri', estimatedSeconds: 90 }
  if (u.includes('smartrecruiters')) return { type: 'smartrecruiters', name: 'SmartRecruiters', estimatedSeconds: 60 }
  if (u.includes('bamboohr')) return { type: 'bamboohr', name: 'BambooHR', estimatedSeconds: 45 }
  return { type: 'direct', name: 'Company Website', estimatedSeconds: 120 }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { job_id, job_title, company, job_description, apply_url, country = 'US' } = await req.json()

    if (!job_title || !company) {
      return Response.json({ error: 'job_title and company required' }, { status: 400 })
    }

    // Get user's profile + parsed resume
    const [{ data: profile }, { data: primaryResume }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('resumes').select('id').eq('user_id', user.id).eq('is_primary', true).single(),
    ])

    let parsedResume = null
    if (primaryResume) {
      const { data } = await supabase
        .from('parsed_resumes')
        .select('*')
        .eq('resume_id', primaryResume.id)
        .single()
      parsedResume = data
    }

    // Get job preferences for work auth / salary info
    const { data: prefs } = await supabase
      .from('job_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Detect portal
    const portal = apply_url ? detectPortal(apply_url) : { type: 'direct', name: 'Company Website', estimatedSeconds: 120 }

    // Use Claude to generate smart form answers
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are an AI application assistant. Generate optimal form field answers for this job application.

JOB: ${job_title} at ${company}
COUNTRY: ${country}
PORTAL: ${portal.name}
${job_description ? `JOB DESCRIPTION: ${job_description.slice(0, 1500)}` : ''}

CANDIDATE INFO:
Name: ${parsedResume?.full_name || profile?.full_name || 'Unknown'}
Email: ${parsedResume?.email || user.email || ''}
Phone: ${parsedResume?.phone || ''}
Location: ${parsedResume?.location || ''}
Skills: ${(parsedResume?.skills || []).slice(0, 15).join(', ')}
Recent Role: ${parsedResume?.experience?.[0]?.title || 'N/A'} at ${parsedResume?.experience?.[0]?.company || 'N/A'}
Experience Years: ${parsedResume?.total_years_experience || prefs?.experience_level || '5'}
Education: ${parsedResume?.education?.[0]?.degree || 'Bachelor'} in ${parsedResume?.education?.[0]?.field || 'Computer Science'}
Min Salary: ${prefs?.min_salary || ''}

Generate form answers as JSON (no markdown):
{
  "personal": {
    "first_name": "",
    "last_name": "",
    "email": "",
    "phone": "",
    "address_line1": "",
    "city": "",
    "state": "",
    "zip": "",
    "country": "${country === 'IN' ? 'India' : 'United States'}"
  },
  "professional": {
    "linkedin_url": "",
    "portfolio_url": "",
    "years_experience": "",
    "current_company": "",
    "current_title": ""
  },
  "compensation": {
    ${country === 'IN' ? `"current_ctc": "As per market standard",
    "expected_ctc": "${prefs?.min_salary ? prefs.min_salary + ' LPA' : 'Negotiable'}",
    "notice_period": "Immediate to 30 days"` : `"salary_expectation": "${prefs?.min_salary || 'Negotiable'}",
    "salary_negotiable": "Yes"`}
  },
  "work_authorization": {
    ${country === 'IN' ? `"citizen": "Yes",
    "work_permit": "Indian Citizen"` : `"authorized_to_work": "Yes",
    "require_sponsorship": "No",
    "visa_status": "Authorized to work in the US"`}
  },
  "demographics": {
    "gender": "Prefer not to say",
    "ethnicity": "Prefer not to say",
    "veteran_status": "Not a veteran",
    "disability": "No disability"
  },
  "custom_answers": {
    "why_interested": "2-3 sentence answer about interest in ${company}",
    "greatest_strength": "Answer tailored to job",
    "why_leaving": "Seeking new growth opportunities",
    "availability": "Immediately available",
    "references_available": "Yes, available upon request"
  }
}`,
        },
      ],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    let formData
    try {
      formData = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      formData = match ? JSON.parse(match[0]) : {}
    }

    // Fill in actual known values over AI guesses
    if (parsedResume?.full_name) {
      const parts = parsedResume.full_name.split(' ')
      formData.personal.first_name = parts[0] || ''
      formData.personal.last_name = parts.slice(1).join(' ') || ''
    }
    formData.personal.email = parsedResume?.email || user.email || ''
    formData.personal.phone = parsedResume?.phone || ''

    // Create application record
    const { data: application } = await supabase
      .from('applications')
      .insert({
        user_id: user.id,
        job_id: job_id || null,
        status: 'preparing',
        applied_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    // Create auto-apply task
    const { data: task } = await supabase
      .from('auto_apply_tasks')
      .insert({
        user_id: user.id,
        application_id: application?.id || null,
        job_id: job_id || null,
        status: 'ready_for_review',
        mode: 'copilot',
        portal_type: portal.type,
        form_data: formData,
        estimated_time_seconds: portal.estimatedSeconds,
      })
      .select('id')
      .single()

    return Response.json({
      success: true,
      task_id: task?.id,
      application_id: application?.id,
      form_data: formData,
      portal: portal,
      apply_url,
      ready_for_review: true,
    })
  } catch (err) {
    console.error('Auto-apply prepare error:', err)
    return Response.json({ error: 'Failed to prepare application' }, { status: 500 })
  }
}
