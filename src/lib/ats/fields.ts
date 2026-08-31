/**
 * Working out what a form field is actually asking for.
 *
 * ATS forms give almost nothing to match on. On a live Greenhouse posting
 * every one of the 22 visible inputs had an empty `name` attribute and a
 * generated id like `:R9d9r6l6:`. The only durable signal is the visible
 * label, which is why matching happens on normalised label text rather than
 * on selectors — selectors here are generated fresh on every render.
 *
 * Order matters in `FIELD_RULES`: the first rule that matches wins, so the
 * specific patterns sit above the general ones. "First name" has to beat
 * "name", and "preferred name" must not be mistaken for either.
 */

export type FieldKind =
  | 'first_name'
  | 'last_name'
  | 'full_name'
  | 'email'
  | 'phone'
  | 'location'
  | 'country'
  | 'linkedin'
  | 'website'
  | 'resume'
  | 'cover_letter'
  | 'unknown'

const norm = (s: string) =>
  s.toLowerCase().replace(/\*/g, '').replace(/\(required\)/g, '').replace(/\s+/g, ' ').trim()

type Rule = { kind: FieldKind; test: RegExp }

const FIELD_RULES: Rule[] = [
  // Specific before general.
  { kind: 'first_name', test: /^(first|given)[\s_-]?name/ },
  { kind: 'last_name', test: /^(last|family|sur)[\s_-]?name/ },
  { kind: 'email', test: /e-?mail/ },
  { kind: 'phone', test: /phone|mobile|telephone|contact number/ },
  { kind: 'linkedin', test: /linked-?in/ },
  { kind: 'website', test: /website|portfolio|personal site|github|url$/ },
  { kind: 'resume', test: /resume|cv\b|curriculum/ },
  { kind: 'cover_letter', test: /cover letter|covering letter/ },
  // Country is its own field: a form asking for it wants a country, and
  // filling it with 'San Francisco, CA' is simply a wrong answer.
  { kind: 'country', test: /^country|country of residence$|^nation$/ },
  { kind: 'location', test: /^location|^city|^town|where are you based|current residence/ },
  // Only after first/last have had their chance.
  { kind: 'full_name', test: /^(full[\s_-]?)?name$/ },
]

/**
 * A label that reads as a sentence is a screening question, not a field.
 *
 * This guard exists because of a real failure: "Will you now or in the
 * future require sponsorship for a visa to work in this country?" contains
 * the word "country", so the location rule claimed it and the engine
 * answered a required immigration question with "San Francisco, CA".
 *
 * Field labels are short noun phrases — "Email", "Phone", "LinkedIn
 * Profile". Questions have a verb, a question mark, or simply run long.
 * Anything that looks like one goes to the screening path, where it gets an
 * answer chosen for the question actually being asked.
 */
function readsAsQuestion(label: string): boolean {
  const l = norm(label)
  if (l.includes('?')) return true
  if (l.split(' ').length > 6) return true
  return /^(are|do|did|have|has|will|would|can|could|is|was|were|how|what|which|why|when|where|who|please|tell)\b/.test(l)
}

export function classifyField(label: string): FieldKind {
  const l = norm(label)
  if (!l) return 'unknown'

  /* "What's the name you'd prefer us to use throughout the interview
     process?" is a screening question, not the applicant's legal name.
     Matching it as full_name would overwrite a real answer with a
     duplicate of their name. */
  if (/prefer|pronoun|nickname/.test(l)) return 'unknown'

  // A file input keeps its meaning however long its label is.
  if (/resume|cv\b|curriculum/.test(l)) return 'resume'
  if (/cover letter|covering letter/.test(l)) return 'cover_letter'

  if (readsAsQuestion(l)) return 'unknown'

  for (const r of FIELD_RULES) if (r.test.test(l)) return r.kind
  return 'unknown'
}

/** The value for a field we recognised, or null to leave it alone. */
export function valueForField(
  kind: FieldKind,
  p: {
    firstName: string
    lastName: string
    email: string
    phone?: string | null
    location?: string | null
    country?: string | null
    linkedin?: string | null
    website?: string | null
  }
): string | null {
  switch (kind) {
    case 'first_name':
      return p.firstName || null
    case 'last_name':
      return p.lastName || null
    case 'full_name':
      return [p.firstName, p.lastName].filter(Boolean).join(' ') || null
    case 'email':
      return p.email || null
    case 'phone':
      return p.phone || null
    case 'location':
      return p.location || null
    case 'country':
      return p.country || null
    case 'linkedin':
      return p.linkedin || null
    case 'website':
      return p.website || null
    default:
      return null
  }
}

/**
 * Screening questions whose answers are known facts, not judgement calls.
 *
 * These are asked on nearly every application and get the same answer every
 * time for a given person. Answering them from the profile keeps the model
 * out of decisions where a wrong guess has real consequences — telling an
 * employer you need visa sponsorship when you do not, or the reverse, is
 * not a mistake worth risking on a paraphrase.
 */
export type KnownAnswerContext = {
  country?: string | null
  location?: string | null
  requiresSponsorship?: boolean | null
  workAuthorization?: string | null
  yearsExperience?: number | null
  salaryExpectation?: string | null
  noticePeriod?: string | null
  company?: string
}

export function knownAnswer(
  question: string,
  ctx: KnownAnswerContext
): { answer: string; source: 'preferences' | 'profile' } | null {
  const q = norm(question)

  if (/sponsor|visa|work permit|right to work|work authoriz|legally authorized|authorised to work/.test(q)) {
    // Read the polarity of the question before answering it: "will you
    // require sponsorship" and "are you authorised to work" want opposite
    // answers from the same fact.
    const asksForSponsorship = /require|need|sponsor/.test(q) && !/authoriz|authoris|eligible|permitted/.test(q)
    if (ctx.requiresSponsorship == null) return null
    const yes = asksForSponsorship ? ctx.requiresSponsorship : !ctx.requiresSponsorship
    return { answer: yes ? 'Yes' : 'No', source: 'preferences' }
  }

  /* "What is your current country of residence?" reads as a question, so
     it goes down the screening path — but it is a fact we hold, and asking
     a model to restate it is both slower and a chance to get it wrong. */
  if (/country of residence|which country do you (currently )?(live|reside)|country you (are|reside) (based|in)/.test(q) && ctx.country) {
    return { answer: ctx.country, source: 'profile' }
  }

  if (/city of residence|which city do you (currently )?live/.test(q) && ctx.location) {
    return { answer: ctx.location, source: 'profile' }
  }

  if (/previously (worked|been employed)|former employee|worked at .* before|ever worked (for|at)/.test(q)) {
    return { answer: 'No', source: 'profile' }
  }

  if (/years of experience|how many years/.test(q) && ctx.yearsExperience != null) {
    return { answer: String(ctx.yearsExperience), source: 'profile' }
  }

  if (/salary|compensation expectation|expected (pay|ctc)/.test(q) && ctx.salaryExpectation) {
    return { answer: ctx.salaryExpectation, source: 'preferences' }
  }

  if (/notice period|when (can|could) you start|availability to start/.test(q) && ctx.noticePeriod) {
    return { answer: ctx.noticePeriod, source: 'preferences' }
  }

  return null
}

/**
 * Demographic questions, which we deliberately never answer.
 *
 * EEO and self-identification fields are voluntary by law and are supposed
 * to be the applicant's own choice. Filling them automatically — with a
 * guess, or with anything at all — takes that choice away and puts data the
 * user never volunteered in front of an employer.
 */
export function isVoluntaryDemographic(label: string): boolean {
  const l = norm(label)
  return /gender|hispanic|latino|race|ethnic|veteran|disability|sexual orientation|self-?identif|transgender|pronoun/.test(
    l
  )
}
