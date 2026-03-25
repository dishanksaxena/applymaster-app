export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: 'free' | 'pro' | 'elite' | 'lifetime'
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export interface JobPreference {
  id: string
  user_id: string
  target_roles: string[]
  target_locations: string[]
  remote_preference: 'remote' | 'hybrid' | 'onsite' | 'any'
  min_salary: number | null
  max_salary: number | null
  experience_level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
  industries: string[]
  excluded_companies: string[]
  match_threshold: number
  auto_apply_mode: 'copilot' | 'autopilot' | 'off'
  daily_apply_limit: number
  created_at: string
  updated_at: string
}

export interface Resume {
  id: string
  user_id: string
  name: string
  file_url: string
  parsed_data: Record<string, unknown> | null
  ats_score: number | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  external_id: string | null
  source: string
  title: string
  company: string
  company_logo: string | null
  location: string
  remote_type: 'remote' | 'hybrid' | 'onsite' | null
  salary_min: number | null
  salary_max: number | null
  description: string | null
  url: string
  posted_at: string | null
  expires_at: string | null
  created_at: string
}

export interface Application {
  id: string
  user_id: string
  job_id: string
  status: 'saved' | 'queued' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
  match_score: number | null
  resume_id: string | null
  cover_letter_id: string | null
  applied_at: string | null
  notes: string | null
  follow_up_date: string | null
  interview_date: string | null
  created_at: string
  updated_at: string
  job?: Job
}

export interface CoverLetter {
  id: string
  user_id: string
  job_id: string | null
  title: string
  content: string
  tone: 'professional' | 'casual' | 'enthusiastic' | 'confident'
  created_at: string
}

export interface ApplyLog {
  id: string
  user_id: string
  application_id: string | null
  action: string
  details: string | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: 'free' | 'pro' | 'elite' | 'lifetime'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface Usage {
  id: string
  user_id: string
  period_start: string
  period_end: string
  applications_sent: number
  resumes_optimized: number
  cover_letters_generated: number
  ai_tokens_used: number
  created_at: string
}
