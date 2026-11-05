/**
 * The plan ladder, in one place. Every page that states a number and every
 * route that enforces one reads from here, so the site cannot promise one
 * thing while the server enforces another.
 *
 * An "application" is any applications row that is not status 'saved'
 * (saving a job for later is a bookmark, not an application) — created by a
 * manual Apply Now click, Copilot, or Autopilot alike. Monthly pools reset
 * on the first of the calendar month (UTC); daily caps at midnight UTC.
 *
 * Pro's 10/day paces the 150/month pool — it never adds to it. Elite and
 * Lifetime have no monthly pool; their 50/day is a deliberately unadvertised
 * safety cap against runaway automation and AI cost, not a selling point.
 * Credits ($5 for 20, Pro only) extend the monthly pool and never expire,
 * but still ride under the same daily pace.
 */

export type PlanName = 'free' | 'pro' | 'elite' | 'lifetime'

export const PLAN_LIMITS: Record<PlanName, { monthly: number | null; daily: number | null }> = {
  free: { monthly: 30, daily: null }, // the monthly pool binds long before any daily number could
  pro: { monthly: 150, daily: 10 },
  elite: { monthly: null, daily: 50 },
  lifetime: { monthly: null, daily: 50 },
}

export const CREDIT_PACK = { credits: 20, dollars: 5 }

export const FREE_INTERVIEWS_PER_MONTH = 3

/** Free runs on the standard model; every paid plan gets the stronger one. */
export const BASIC_AI_MODEL = 'claude-haiku-4-5-20251001'
export const ADVANCED_AI_MODEL = 'claude-sonnet-5-5'
export const aiModelFor = (plan: PlanName | string | null | undefined) =>
  !plan || plan === 'free' ? BASIC_AI_MODEL : ADVANCED_AI_MODEL

export const isPaidPlan = (plan: string | null | undefined): boolean =>
  plan === 'pro' || plan === 'elite' || plan === 'lifetime'
export const hasGodMode = (plan: string | null | undefined): boolean =>
  plan === 'elite' || plan === 'lifetime'

export function monthStartUTC(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}
export function dayStartUTC(now = new Date()): string {
  const d = new Date(now)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

export type Allowance = {
  plan: PlanName
  monthlyUsed: number
  monthlyLimit: number | null
  dailyUsed: number
  dailyLimit: number | null
  credits: number
  /** Applications that may still be created right now. Infinity is serialized as -1 over JSON, so it is capped. */
  room: number
  blocked: null | 'daily' | 'monthly'
  /** True when the next application would be paid for by a purchased credit. */
  nextFromCredit: boolean
}

/** Any Supabase client, user-scoped or service-role; RLS covers the user-scoped case. */
type Db = { from(table: string): any }

export async function applicationAllowance(db: Db, userId: string): Promise<Allowance> {
  const [{ data: profile }, monthly, daily] = await Promise.all([
    db.from('profiles').select('plan, apply_credits').eq('id', userId).maybeSingle(),
    db
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'saved')
      .gte('created_at', monthStartUTC()),
    db
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'saved')
      .gte('created_at', dayStartUTC()),
  ])

  const plan = ((profile?.plan as PlanName) ?? 'free') in PLAN_LIMITS ? ((profile?.plan as PlanName) ?? 'free') : 'free'
  const limits = PLAN_LIMITS[plan]
  const credits = Math.max(0, profile?.apply_credits ?? 0)
  const monthlyUsed = monthly.count ?? 0
  const dailyUsed = daily.count ?? 0

  const dailyRoom = limits.daily === null ? Number.POSITIVE_INFINITY : limits.daily - dailyUsed
  const monthlyRoom = limits.monthly === null ? Number.POSITIVE_INFINITY : limits.monthly + credits - monthlyUsed
  const room = Math.max(0, Math.min(dailyRoom, monthlyRoom, 1000))
  const blocked: Allowance['blocked'] = room > 0 ? null : dailyRoom <= 0 ? 'daily' : 'monthly'

  return {
    plan,
    monthlyUsed,
    monthlyLimit: limits.monthly,
    dailyUsed,
    dailyLimit: limits.daily,
    credits,
    room,
    blocked,
    nextFromCredit: limits.monthly !== null && monthlyUsed >= limits.monthly && credits > 0,
  }
}

/** The honest sentence for a block: whether it resets tomorrow or needs money, and which money. */
export function blockedMessage(a: Allowance): string {
  if (a.blocked === 'daily') {
    return a.plan === 'pro'
      ? `You've reached today's pace of ${a.dailyLimit} applications. It resets at midnight UTC — your monthly pool is untouched.`
      : `Today's safety limit of ${a.dailyLimit} applications is reached. It resets at midnight UTC.`
  }
  if (a.plan === 'free') {
    return `You've used all ${a.monthlyLimit} free applications this month. Pro includes 150 a month.`
  }
  return `You've used your ${a.monthlyLimit} monthly applications${a.credits > 0 ? '' : ' and credits'}. Get ${CREDIT_PACK.credits} more for $${CREDIT_PACK.dollars} in Settings, or go Elite for unlimited.`
}
