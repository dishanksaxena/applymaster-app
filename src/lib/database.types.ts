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
  position: number
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

export interface ResumeExperience {
  company: string
  title: string
  start_date: string
  end_date: string | null
  description: string
  location: string | null
}

export interface ResumeEducation {
  institution: string
  degree: string
  field: string
  start_date: string
  end_date: string | null
  gpa: string | null
}

export interface ParsedResume {
  id: string
  resume_id: string
  user_id: string
  full_name: string | null
  email: string | null
  phone: string | null
  location: string | null
  summary: string | null
  skills: string[]
  experience: ResumeExperience[]
  education: ResumeEducation[]
  certifications: string[]
  languages: string[]
  raw_text: string | null
  created_at: string
}

export interface JobMatch {
  id: string
  user_id: string
  job_id: string
  resume_id: string | null
  overall_score: number
  skills_score: number | null
  experience_score: number | null
  education_score: number | null
  match_reasons: string[]
  missing_skills: string[]
  tailored_summary: string | null
  created_at: string
}

export interface OptimizedResume {
  id: string
  user_id: string
  resume_id: string
  job_id: string
  optimized_text: string
  optimized_data: Record<string, unknown> | null
  ats_score: number | null
  changes_made: string[]
  created_at: string
}

export interface AutoApplyFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  // US-specific
  authorized_to_work?: boolean
  requires_sponsorship?: boolean
  veteran_status?: string
  disability_status?: string
  gender?: string
  ethnicity?: string
  // India-specific
  notice_period_days?: number
  current_ctc?: string
  expected_ctc?: string
  // Professional
  years_experience: number
  education_highest: string
  linkedin_url?: string
  portfolio_url?: string
  // AI-generated answers
  custom_answers: Record<string, string>
}

export interface AutoApplyTask {
  id: string
  user_id: string
  application_id: string | null
  job_id: string
  status: 'pending' | 'preparing' | 'ready_for_review' | 'approved' | 'submitting' | 'completed' | 'failed' | 'skipped'
  mode: 'copilot' | 'autopilot'
  portal_type: string | null
  form_data: AutoApplyFormData | null
  resume_url: string | null
  cover_letter_text: string | null
  error_message: string | null
  estimated_time_seconds: number | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface NetworkConnection {
  id: string
  user_id: string
  name: string
  email: string | null
  linkedin_url: string | null
  company: string | null
  title: string | null
  relationship: 'direct' | 'second_degree' | 'alumni' | 'imported'
  connected_via: string | null
  notes: string | null
  created_at: string
}

export interface InterviewSession {
  id: string
  user_id: string
  job_id: string | null
  interview_type: 'behavioral' | 'technical' | 'system_design' | 'case_study' | 'mock_full'
  questions: Array<{ question: string; category: string }>
  answers: Array<{ question_index: number; answer: string; timestamp: string }>
  feedback: Array<{ question_index: number; score: number; strengths: string[]; improvements: string[]; better_answer: string }>
  overall_score: number | null
  duration_seconds: number | null
  created_at: string
}
