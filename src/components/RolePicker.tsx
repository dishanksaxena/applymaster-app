'use client'

import { useState } from 'react'
import Autocomplete, { type Suggestion } from '@/components/Autocomplete'
import { JOB_TITLES } from '@/lib/constants/job-titles'
import { suggestScore } from '@/lib/suggest-score'
import { toneA } from '@/lib/tone'
import { toast } from '@/components/Toast'

/**
 * The one way to say which jobs you want, used by onboarding, the profile
 * and the auto-apply page. Any title is accepted as typed — sales, nursing,
 * the trades — with suggestions from JOB_TITLES and live postings, and a few
 * shortcuts across fields underneath.
 */

export const MAX_ROLES = 5
export const QUICK_ROLES = ['Software Engineer', 'Product Manager', 'Data Analyst', 'Account Executive', 'Marketing Manager', 'UX Designer', 'Registered Nurse', 'Accountant', 'Project Manager', 'Customer Success Manager', 'Electrician', 'Teacher']

export const roleItemsFor = (q: string): Suggestion[] =>
  JOB_TITLES.map(t => ({ t, s: suggestScore(t, q) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s || a.t.length - b.t.length)
    .slice(0, 8)
    .map(x => ({ label: x.t, group: 'Job titles' }))

export const fetchRoleItems = async (q: string): Promise<Suggestion[]> =>
  (await (await fetch(`/api/suggest?type=role&q=${encodeURIComponent(q)}`)).json()).items ?? []

const CHIP = 'am-press px-3 py-2 rounded-lg text-[12px] font-medium transition-all'
const CHIP_ON = `${CHIP} bg-[rgb(var(--accent-rgb)/0.15)] text-[var(--accent)] border border-[rgb(var(--accent-rgb)/0.3)]`
const CHIP_OFF = `${CHIP} bg-[var(--bg-overlay)] text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]`
const INPUT = 'w-full px-4 py-2.5 rounded-lg bg-[var(--bg-overlay)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-faint)] text-[13px] focus:border-[rgb(var(--accent-rgb)/0.3)] focus:outline-none transition-all disabled:opacity-60'

export default function RolePicker({
  value,
  onChange,
  max = MAX_ROLES,
  errorId,
  showError = false,
  quick = true,
}: {
  value: string[]
  onChange: (roles: string[]) => void
  max?: number
  /** id for the "add at least one" line, so a form can scroll to it. */
  errorId?: string
  showError?: boolean
  quick?: boolean
}) {
  const [query, setQuery] = useState('')
  const full = value.length >= max

  const add = (raw: string) => {
    const role = raw.trim().replace(/\s+/g, ' ')
    if (!role) return
    setQuery('')
    if (value.some(r => r.toLowerCase() === role.toLowerCase())) return
    if (full) {
      toast.error(`Up to ${max} roles — remove one to add another`)
      return
    }
    onChange([...value, role])
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3" aria-label="Chosen roles">
          {value.map(role => (
            <span key={role} className={`${CHIP_ON} inline-flex items-center gap-1.5 pr-2`} style={{ boxShadow: `0 0 0 1px ${toneA('accent', 0.35)}, 0 4px 12px -6px ${toneA('accent', 0.5)}` }}>
              {role}
              <button type="button" onClick={() => onChange(value.filter(r => r !== role))} aria-label={`Remove ${role}`}
                className="w-4 h-4 rounded-full grid place-items-center hover:bg-[rgb(var(--accent-rgb)/0.2)]">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <Autocomplete
            value={query}
            onChange={setQuery}
            onSelect={item => add(item.label)}
            onSubmit={() => add(query)}
            fetchItems={fetchRoleItems}
            instant={roleItemsFor}
            ariaLabel="Add a target role"
            placeholder={full ? `${max} roles chosen` : 'Type any job title — sales, nursing, trades, anything'}
            disabled={full}
            inputClassName={INPUT}
          />
        </div>
        <button type="button" onClick={() => add(query)} disabled={!query.trim() || full}
          className="am-press px-4 py-2 rounded-lg text-[12px] font-medium bg-gradient-to-r from-[var(--accent)] to-[var(--accent-solid)] text-[var(--text-on-accent)] disabled:opacity-40">
          Add
        </button>
      </div>
      {quick && (
        <div className="flex flex-wrap gap-2 mt-3">
          {QUICK_ROLES.filter(r => !value.includes(r)).map(role => (
            <button key={role} type="button" onClick={() => add(role)} disabled={full} className={`${CHIP_OFF} disabled:opacity-40`}>
              + {role}
            </button>
          ))}
        </div>
      )}
      {value.length === 0 && (
        <p id={errorId} className={`text-[11px] mt-2 ${showError ? 'text-[var(--red)] font-medium' : 'text-[var(--text-faint)]'}`}>
          Add at least one role — pick a shortcut or type your own
        </p>
      )}
    </div>
  )
}
