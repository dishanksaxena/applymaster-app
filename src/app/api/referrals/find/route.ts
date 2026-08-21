import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

/**
 * Find people in the user's network who could refer them into a specific job,
 * score each path, and draft the ask.
 *
 * Why this route exists: a cold application converts at roughly 0.1-2%. A
 * referral converts at around 30%. The network table already knows who the
 * user knows; nothing connected those people to a specific role.
 *
 * Scoring is deterministic and done here, not by the model — a match score
 * that changes between runs is not something a user can trust. The model only
 * writes the message.
 */

type Conn = {
  id: string
  name: string
  company: string | null
  title: string | null
  relationship: 'direct' | 'second_degree' | 'alumni' | 'imported'
  email: string | null
  linkedin_url: string | null
  seniority: string | null
  can_refer: boolean | null
  last_contacted_at: string | null
}

const norm = (s: string | null | undefined) =>
  (s || '').toLowerCase().replace(/\b(inc|llc|ltd|corp|corporation|technologies|labs|group)\b/g, '').replace(/[^a-z0-9]/g, '')

/** Deterministic 0-100 strength, plus the reason shown to the user. */
function score(conn: Conn, company: string): { strength: number; reason: string } {
  const reasons: string[] = []
  let s = 0

  const sameCompany = norm(conn.company) && norm(conn.company) === norm(company)
  if (sameCompany) {
    s += 55
    reasons.push(`works at ${conn.company}`)
  }

  // A direct contact can refer; a second-degree one has to introduce you first.
  const byRelationship: Record<Conn['relationship'], number> = {
    direct: 30,
    second_degree: 15,
    alumni: 12,
    imported: 5,
  }
  s += byRelationship[conn.relationship] ?? 5
  if (conn.relationship === 'direct') reasons.push('you know them directly')
  else if (conn.relationship === 'second_degree') reasons.push('second-degree connection')
  else if (conn.relationship === 'alumni') reasons.push('alumni connection')

  // Seniority matters: referrals from people senior enough to be heard land better.
  const sen = (conn.seniority || conn.title || '').toLowerCase()
  if (/(director|vp|head|principal|staff|lead|manager)/.test(sen)) {
    s += 10
    reasons.push('senior enough to be heard internally')
  }

  // A contact you spoke to recently is likelier to reply.
  if (conn.last_contacted_at) {
    const days = (Date.now() - new Date(conn.last_contacted_at).getTime()) / 86400000
    if (days < 90) { s += 5; reasons.push('you were in touch recently') }
  }

  if (conn.can_refer === false) s = Math.min(s, 20)

  return { strength: Math.max(0, Math.min(100, s)), reason: reasons.join(', ') || 'in your network' }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

    const { job_id, job_title, company, application_id } = await req.json()
    if (!company) return Response.json({ error: 'company required' }, { status: 400 })

    const { data: connections } = await supabase
      .from('network_connections')
      .select('id, name, company, title, relationship, email, linkedin_url, seniority, can_refer, last_contacted_at')
      .eq('user_id', user.id)

    const scored = ((connections ?? []) as Conn[])
      // Must actually be at the company — that is what makes it a referral.
      .filter(c => norm(c.company) && norm(c.company) === norm(company))
      .map(c => ({ conn: c, ...score(c, company) }))
      .filter(x => x.strength >= 20)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5)

    if (scored.length === 0) {
      return Response.json({ paths: [], reason: 'no_matches' })
    }

    const { data: profile } = await supabase
      .from('profiles').select('full_name').eq('id', user.id).single()
    const userName = profile?.full_name || 'I'

    // Draft one ask per path. Kept short deliberately: long referral requests
    // are the ones that go unanswered.
    const paths = []
    for (const { conn, strength, reason } of scored) {
      let draft = ''
      try {
        const msg = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: `${userName} is a JOB SEEKER asking a contact to refer THEM into a role at the contact's own employer. ${userName} is the candidate. ${conn.name} already works at ${company} and would be putting ${userName} forward. Do not write this as though ${userName} is hiring.

Write that request as ${userName}, addressed to ${conn.name}.

Contact: ${conn.name}${conn.title ? `, ${conn.title}` : ''} at ${company}
Relationship to ${userName}: ${conn.relationship.replace('_', ' ')}
Role ${userName} wants to be referred into: ${job_title || 'an open role'} at ${company}

Constraints: under 90 words. Plain language. No flattery, no "I hope this finds you well". Acknowledge the relationship honestly — do not imply closeness that does not exist for a second-degree or alumni contact. Make one specific ask and make it easy to decline.

Return only the message body: no subject line, no signature.`,
          }],
        })
        draft = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
      } catch (err) {
        console.error('Referral draft failed:', err)
        // A missing draft must not lose the path — the match is the valuable part.
        draft = ''
      }

      const { data: saved } = await supabase
        .from('referral_requests')
        .upsert({
          user_id: user.id,
          connection_id: conn.id,
          job_id: job_id || null,
          application_id: application_id || null,
          job_title: job_title || null,
          company,
          match_reason: reason,
          match_strength: strength,
          message_draft: draft || null,
          status: draft ? 'drafted' : 'suggested',
          channel: conn.email ? 'email' : conn.linkedin_url ? 'linkedin' : 'other',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,connection_id,job_id' })
        .select('id, status')
        .maybeSingle()

      paths.push({
        id: saved?.id ?? null,
        connection: {
          id: conn.id, name: conn.name, title: conn.title,
          company: conn.company, email: conn.email, linkedin_url: conn.linkedin_url,
        },
        strength,
        reason,
        draft,
        status: saved?.status ?? 'suggested',
      })
    }

    return Response.json({ paths })
  } catch (err: any) {
    console.error('referrals/find error:', err)
    return Response.json({ error: err.message || 'Failed to find referral paths' }, { status: 500 })
  }
}
