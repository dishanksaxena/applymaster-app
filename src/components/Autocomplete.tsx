'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * A text box that suggests as you type: grouped suggestions, the matched
 * letters in bold, arrow keys and Enter to pick, Escape to close.
 *
 * Accessible as a combobox (WAI-ARIA 1.2 pattern): the input owns a listbox,
 * aria-activedescendant follows the highlighted option.
 */

export type Suggestion = { label: string; value?: string; hint?: string; group: string }

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase()
  if (!q) return <>{text}</>
  // Bold every typed word where a word of the label starts with it.
  const words = q.split(/\s+/).filter(Boolean)
  const parts: { s: string; hit: boolean }[] = []
  let i = 0
  const lower = text.toLowerCase()
  while (i < text.length) {
    const atWord = i === 0 || /[^a-z0-9]/i.test(text[i - 1])
    const w = atWord ? words.find(w => lower.startsWith(w, i)) : undefined
    if (w) {
      parts.push({ s: text.slice(i, i + w.length), hit: true })
      i += w.length
    } else {
      const last = parts[parts.length - 1]
      if (last && !last.hit) last.s += text[i]
      else parts.push({ s: text[i], hit: false })
      i++
    }
  }
  return (
    <>
      {parts.map((p, k) =>
        p.hit ? (
          <strong key={k} style={{ color: 'var(--text)', fontWeight: 700 }}>
            {p.s}
          </strong>
        ) : (
          <span key={k}>{p.s}</span>
        )
      )}
    </>
  )
}

export default function Autocomplete({
  value,
  onChange,
  onSelect,
  onSubmit,
  fetchItems,
  instant,
  recent = [],
  placeholder,
  ariaLabel,
  icon,
  inputClassName,
  resetKey,
}: {
  value: string
  onChange: (text: string) => void
  onSelect?: (item: Suggestion) => void
  /** Enter with nothing highlighted. */
  onSubmit?: () => void
  fetchItems: (q: string) => Promise<Suggestion[]>
  /** Suggestions computed in the browser, shown on the keystroke itself until the fetch answers. */
  instant?: (q: string) => Suggestion[]
  /** Shown when the box is empty, above the fetched suggestions. */
  recent?: string[]
  placeholder?: string
  ariaLabel: string
  icon?: React.ReactNode
  inputClassName?: string
  /** Change it to drop cached suggestions (e.g. the country changed). */
  resetKey?: string
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Suggestion[]>([])
  const [active, setActive] = useState(-1)
  const wrap = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null)
  const seq = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(
    (q: string) => {
      if (timer.current) clearTimeout(timer.current)
      if (instant && q.trim()) {
        // Something on screen at once; the fetched list replaces it when it lands.
        setItems(instant(q))
        setActive(-1)
      }
      timer.current = setTimeout(async () => {
        const mine = ++seq.current
        const fetched = await fetchItems(q).catch(() => [] as Suggestion[])
        if (mine !== seq.current) return // a newer keystroke won
        const past = q.trim()
          ? []
          : recent.filter(r => !fetched.some(f => f.label.toLowerCase() === r.toLowerCase())).slice(0, 4).map(r => ({ label: r, group: 'Recent searches' }))
        setItems([...past, ...fetched])
        setActive(-1)
      }, q ? 140 : 0)
    },
    [fetchItems, instant, recent]
  )

  useEffect(() => {
    setItems([])
  }, [resetKey])

  const showList = open && items.length > 0

  /* The list is drawn over the page (a portal), not inside the box's own
     card: cards clip what overflows them, which cut the list off. It
     follows the input as the page scrolls or resizes. */
  useLayoutEffect(() => {
    if (!showList) return
    const place = () => {
      const r = wrap.current?.getBoundingClientRect()
      if (r) setRect({ left: r.left, top: r.bottom + 6, width: r.width })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [showList])

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (wrap.current && !wrap.current.contains(t) && !listRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const pick = (item: Suggestion) => {
    onChange(item.value ?? item.label)
    onSelect?.(item)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        load(value)
        return
      }
      setActive(a => Math.min(items.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(a => Math.max(-1, a - 1))
    } else if (e.key === 'Enter') {
      if (open && active >= 0 && items[active]) {
        e.preventDefault()
        pick(items[active])
      } else {
        setOpen(false)
        onSubmit?.()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  const listId = `${id}-list`
  let lastGroup = ''

  return (
    <div ref={wrap} className="relative">
      {icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none flex">{icon}</span>}
      <input
        value={value}
        onChange={e => {
          onChange(e.target.value)
          setOpen(true)
          load(e.target.value)
        }}
        onFocus={() => {
          setOpen(true)
          load(value)
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        className={inputClassName}
      />
      {showList && rect && createPortal(
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="fixed py-1.5 rounded-xl overflow-y-auto"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            zIndex: 180,
            maxHeight: `min(380px, calc(100vh - ${Math.round(rect.top)}px - 16px))`,
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-xl), 0 0 0 1px var(--card-ring)',
          }}
        >
          {items.map((item, i) => {
            const header = item.group !== lastGroup
            lastGroup = item.group
            return (
              <li key={`${item.group}-${item.label}`} role="presentation">
                {header && (
                  <div className="px-4 pt-2 pb-1 text-[10.5px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-faint)' }}>
                    {item.group}
                  </div>
                )}
                <div
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onPointerDown={e => e.preventDefault()}
                  onClick={() => pick(item)}
                  onPointerEnter={() => setActive(i)}
                  className="flex items-center justify-between gap-3 px-4 py-2 cursor-pointer text-[13.5px]"
                  style={{ background: i === active ? 'var(--bg-overlay)' : 'transparent', color: 'var(--text-secondary)' }}
                >
                  <span className="truncate">
                    <Highlight text={item.label} query={item.group === 'Recent searches' ? '' : value} />
                  </span>
                  {item.hint && (
                    <span className="shrink-0 text-[11.5px]" style={{ color: 'var(--text-faint)' }}>
                      {item.hint}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>,
        document.body
      )}
    </div>
  )
}
