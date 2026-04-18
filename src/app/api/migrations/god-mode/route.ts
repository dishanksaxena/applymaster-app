import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const results: string[] = []
    const errors: string[] = []

    // Helper to run raw SQL via rpc
    const run = async (sql: string, label: string) => {
      const { error } = await supabase.rpc('exec_sql', { sql })
      if (error) {
        // Column may already exist — treat as warning, not fatal
        if (error.message.includes('already exists')) {
          results.push(`⚠️ ${label}: already exists (ok)`)
        } else {
          errors.push(`❌ ${label}: ${error.message}`)
        }
      } else {
        results.push(`✅ ${label}`)
      }
    }

    // 1. God Mode columns on job_preferences
    await run(`ALTER TABLE job_preferences ADD COLUMN IF NOT EXISTS god_mode_enabled BOOLEAN DEFAULT FALSE`, 'god_mode_enabled')
    await run(`ALTER TABLE job_preferences ADD COLUMN IF NOT EXISTS god_mode_tailor_resume BOOLEAN DEFAULT TRUE`, 'god_mode_tailor_resume')
    await run(`ALTER TABLE job_preferences ADD COLUMN IF NOT EXISTS god_mode_cover_letter BOOLEAN DEFAULT TRUE`, 'god_mode_cover_letter')
    await run(`ALTER TABLE job_preferences ADD COLUMN IF NOT EXISTS god_mode_score_threshold TEXT DEFAULT 'B'`, 'god_mode_score_threshold')

    // 2. Application tracking columns
    await run(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS god_mode_used BOOLEAN DEFAULT FALSE`, 'applications.god_mode_used')
    await run(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS portal_type TEXT`, 'applications.portal_type')
    await run(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS portal_submission_id TEXT`, 'applications.portal_submission_id')
    await run(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS portal_submitted BOOLEAN DEFAULT FALSE`, 'applications.portal_submitted')
    await run(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_letter TEXT`, 'applications.cover_letter')
    await run(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS god_mode_score INTEGER`, 'applications.god_mode_score')
    await run(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS god_mode_grade TEXT`, 'applications.god_mode_grade')

    // 3. Tailored resumes table
    await run(`
      CREATE TABLE IF NOT EXISTS tailored_resumes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        base_resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
        job_title TEXT,
        company TEXT,
        ats_keywords JSONB DEFAULT '[]',
        tailored_summary TEXT,
        tailored_bullets JSONB DEFAULT '[]',
        ats_score_before INTEGER DEFAULT 0,
        ats_score_after INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `, 'tailored_resumes table')

    await run(`ALTER TABLE tailored_resumes ENABLE ROW LEVEL SECURITY`, 'tailored_resumes RLS')
    await run(`
      CREATE POLICY IF NOT EXISTS "Users can manage own tailored resumes"
        ON tailored_resumes FOR ALL
        USING (auth.uid() = user_id)
    `, 'tailored_resumes policy')

    // 4. apply_log portal column
    await run(`ALTER TABLE apply_log ADD COLUMN IF NOT EXISTS portal TEXT`, 'apply_log.portal')

    return Response.json({
      success: errors.length === 0,
      results,
      errors,
      message: errors.length === 0
        ? 'God Mode migration complete!'
        : `Migration completed with ${errors.length} error(s). Results: ${results.join(', ')}`,
    })

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
