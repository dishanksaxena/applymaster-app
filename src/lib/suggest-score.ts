/**
 * How well a suggestion matches what was typed, shared by the server
 * (/api/suggest) and the browser (instant suggestions while it answers).
 * 0 is no match; higher is better.
 */

export const normSuggest = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').trim()

export function suggestScore(label: string, q: string) {
  const l = normSuggest(label)
  const n = normSuggest(q)
  if (!n) return 1
  if (l === n) return 100
  if (l.startsWith(n)) return 80
  const words = l.split(' ')
  const typed = n.split(' ')
  // Every typed word starts a word of the label: "back eng" -> "Backend Engineer".
  if (typed.every(t => words.some(w => w.startsWith(t)))) return 60 - words.findIndex(w => w.startsWith(typed[0]))
  if (l.includes(n)) return 30
  return 0
}
