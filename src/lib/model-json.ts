/**
 * Parsing JSON that came back from a model.
 *
 * Eleven API routes were doing this by hand, all with the same shape:
 *
 *     try { result = JSON.parse(text) }
 *     catch { result = JSON.parse(text.match(/\{[\s\S]*\}/)[0]) }
 *
 * That second line is not a fallback — it is a second, less safe attempt at
 * exactly the thing that just failed, and it throws uncaught. The common
 * cause of the first failure is a response that hit max_tokens and stopped
 * mid-string, which has no closing brace for the regex to find and no
 * `.match` result to index into. /api/optimize-resume returned a 500 for
 * this on a long CV: the whole feature simply failed.
 *
 * This does three things in order — parse, extract, repair — and reports
 * honestly when none of them work rather than throwing something opaque.
 */

export class ModelJsonError extends Error {
  constructor(
    message: string,
    readonly truncated: boolean,
    readonly raw: string
  ) {
    super(message)
    this.name = 'ModelJsonError'
  }
}

/**
 * Strip ```json fences and any prose either side of the document.
 *
 * The trailing side matters as much as the leading one: a model that adds
 * "Hope that helps!" after the closing brace produces text that parses
 * neither whole nor by a naive prefix trim. Scanning to the balanced close
 * finds the document's real end, string contents included.
 */
function extract(text: string): string {
  let s = text.trim()
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()

  const objAt = s.indexOf('{')
  const arrAt = s.indexOf('[')
  const from = objAt === -1 ? arrAt : arrAt === -1 ? objAt : Math.min(objAt, arrAt)
  if (from === -1) return s
  s = s.slice(from)

  const close = s[0] === '{' ? '}' : ']'
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (escaped) { escaped = false; continue }
    if (c === '\\') { if (inString) escaped = true; continue }
    if (c === '"') { inString = !inString; continue }
    if (inString) continue
    if (c === '{' || c === '[') depth++
    else if (c === '}' || c === ']') {
      depth--
      if (depth === 0 && c === close) return s.slice(0, i + 1)
    }
  }

  // Never closed — hand the whole tail to repair().
  return s
}

/**
 * Close a truncated JSON document.
 *
 * Walks the text tracking whether we are inside a string and whether the
 * previous character was an escape, so a brace inside a quoted value is not
 * mistaken for structure. Then terminates an unterminated string, drops a
 * trailing comma or dangling key, and closes every open bracket in reverse.
 */
function repair(text: string): string | null {
  const stack: string[] = []
  let inString = false
  let escaped = false
  let lastComplete = -1

  for (let i = 0; i < text.length; i++) {
    const c = text[i]

    if (escaped) {
      escaped = false
      continue
    }
    if (c === '\\') {
      if (inString) escaped = true
      continue
    }
    if (c === '"') {
      inString = !inString
      continue
    }
    if (inString) continue

    if (c === '{' || c === '[') stack.push(c === '{' ? '}' : ']')
    else if (c === '}' || c === ']') {
      if (stack[stack.length - 1] === c) stack.pop()
      else return null // genuinely malformed, not merely cut short
    }

    // A structurally safe point to cut back to if the tail is unusable.
    if (!inString && (c === ',' || c === '}' || c === ']')) lastComplete = i
  }

  if (stack.length === 0 && !inString) return null // balanced already; not a truncation

  let out = text

  if (inString) {
    // Cut back to the last structurally complete point rather than closing
    // the quote — a half-written value is worse than an absent one.
    out = lastComplete > 0 ? out.slice(0, lastComplete + 1) : out + '"'
  }

  out = out.replace(/,\s*$/, '')
  // A key with no value ("keywords": ) cannot be salvaged; drop it.
  out = out.replace(/,?\s*"[^"]*"\s*:\s*$/, '')

  for (let i = stack.length - 1; i >= 0; i--) out += stack[i]
  return out
}

/**
 * Parse a model response into an object.
 *
 * @param text        the model's raw text output
 * @param stopReason  the response's stop_reason, when available — 'max_tokens'
 *                    tells us a failure is truncation and worth reporting as
 *                    such rather than as malformed output
 */
export function parseModelJson<T = Record<string, unknown>>(
  text: string,
  stopReason?: string | null
): T {
  const truncated = stopReason === 'max_tokens'

  if (!text || !text.trim()) {
    throw new ModelJsonError('The model returned an empty response', truncated, text ?? '')
  }

  const candidate = extract(text)

  try {
    return JSON.parse(candidate) as T
  } catch {
    /* fall through */
  }

  const repaired = repair(candidate)
  if (repaired) {
    try {
      return JSON.parse(repaired) as T
    } catch {
      /* fall through */
    }
  }

  throw new ModelJsonError(
    truncated
      ? 'The response was cut short before it finished. Try again, or shorten the input.'
      : 'The model returned output that could not be read as JSON.',
    truncated,
    text.slice(0, 500)
  )
}

/**
 * Non-throwing variant, for paths where a partial result is better than an
 * error — a missing field the caller already defaults is not worth a 500.
 */
export function tryParseModelJson<T = Record<string, unknown>>(
  text: string,
  fallback: T,
  stopReason?: string | null
): T {
  try {
    return parseModelJson<T>(text, stopReason)
  } catch (err) {
    console.error('parseModelJson failed:', err instanceof Error ? err.message : err)
    return fallback
  }
}
