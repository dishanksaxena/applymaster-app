/**
 * Companies whose public job boards feed the public job pages (/companies).
 * `slug` is the address on applymaster.ai and must never change once
 * published (search engines have it); `token` is the company's board name
 * on its applicant tracking system. Checked against the live APIs on
 * 20 October 2026: each board had at least five open roles.
 *
 * Separate from GREENHOUSE_BOARDS in job-fetch.ts, which the daily matching
 * scans; adding a board here does not slow that down.
 */

export type Ats = 'greenhouse' | 'lever'
export type BoardSource = { slug: string; ats: Ats; token: string; name: string }

const gh = (slug: string, name: string, token = slug): BoardSource => ({ slug, ats: 'greenhouse', token, name })
const lever = (slug: string, name: string, token = slug): BoardSource => ({ slug, ats: 'lever', token, name })

export const BOARD_SOURCES: BoardSource[] = [
  // The original 31 (also scanned by daily matching).
  gh('databricks', 'Databricks'), gh('stripe', 'Stripe'), gh('anthropic', 'Anthropic'), gh('datadog', 'Datadog'), gh('cloudflare', 'Cloudflare'),
  gh('brex', 'Brex'), gh('samsara', 'Samsara'), gh('gitlab', 'GitLab'), gh('scaleai', 'Scale AI'), gh('affirm', 'Affirm'), gh('pinterest', 'Pinterest'),
  gh('coinbase', 'Coinbase'), gh('airbnb', 'Airbnb'), gh('lyft', 'Lyft'), gh('flexport', 'Flexport'), gh('figma', 'Figma'), gh('reddit', 'Reddit'),
  gh('twilio', 'Twilio'), gh('robinhood', 'Robinhood'), gh('instacart', 'Instacart'), gh('asana', 'Asana'), gh('gusto', 'Gusto'), gh('vercel', 'Vercel'),
  gh('duolingo', 'Duolingo'), gh('chime', 'Chime'), gh('sofi', 'SoFi'), gh('carta', 'Carta'), gh('mercury', 'Mercury'), gh('discord', 'Discord'),
  gh('dropbox', 'Dropbox'), gh('airtable', 'Airtable'),

  // Added 20 October 2026.
  gh('spacex', 'SpaceX'), gh('doordash', 'DoorDash', 'doordashusa'), gh('okta', 'Okta'), gh('mongodb', 'MongoDB'), gh('hellofresh', 'HelloFresh'),
  gh('one-medical', 'One Medical', 'onemedical'), gh('elastic', 'Elastic'), gh('waymo', 'Waymo'), gh('verkada', 'Verkada'), gh('roblox', 'Roblox'),
  gh('oscar-health', 'Oscar Health', 'oscar'), gh('sezzle', 'Sezzle'), gh('navan', 'Navan', 'tripactions'), gh('fivetran', 'Fivetran'),
  gh('riot-games', 'Riot Games', 'riotgames'), gh('epic-games', 'Epic Games', 'epicgames'), gh('grafana-labs', 'Grafana Labs', 'grafanalabs'),
  gh('nuro', 'Nuro'), gh('intercom', 'Intercom'), gh('ripple', 'Ripple'), gh('tripadvisor', 'Tripadvisor'),
  gh('abnormal-security', 'Abnormal Security', 'abnormalsecurity'), gh('faire', 'Faire'), gh('tanium', 'Tanium'), gh('monzo', 'Monzo'),
  gh('zocdoc', 'Zocdoc'), gh('twitch', 'Twitch'), gh('peloton', 'Peloton'), gh('pagerduty', 'PagerDuty'), gh('new-relic', 'New Relic', 'newrelic'),
  gh('fastly', 'Fastly'), gh('launchdarkly', 'LaunchDarkly'), gh('mixpanel', 'Mixpanel'), gh('singlestore', 'SingleStore'), gh('checkr', 'Checkr'),
  gh('druva', 'Druva'), gh('gemini', 'Gemini'), gh('culture-amp', 'Culture Amp', 'cultureamp'), gh('project44', 'project44'),
  gh('squarespace', 'Squarespace'), gh('coursera', 'Coursera'), gh('yext', 'Yext'), gh('betterment', 'Betterment'), gh('nextdoor', 'Nextdoor'),
  gh('flatiron-health', 'Flatiron Health', 'flatironhealth'), gh('hubspot', 'HubSpot', 'hubspotjobs'), gh('fourkites', 'FourKites'),
  gh('circleci', 'CircleCI'), gh('cockroach-labs', 'Cockroach Labs', 'cockroachlabs'), gh('sumo-logic', 'Sumo Logic', 'sumologic'),
  gh('planetscale', 'PlanetScale'), gh('motive', 'Motive'), gh('groww', 'Groww'), gh('lattice', 'Lattice'), gh('calendly', 'Calendly'),
  gh('modern-health', 'Modern Health', 'modernhealth'), gh('khan-academy', 'Khan Academy', 'khanacademy'), gh('netlify', 'Netlify'),
  gh('masterclass', 'MasterClass'),

  lever('palantir', 'Palantir'), lever('zoox', 'Zoox'), lever('paytm', 'Paytm'), lever('pigment', 'Pigment'), lever('spotify', 'Spotify'),
  lever('aircall', 'Aircall'), lever('meesho', 'Meesho'), lever('ro', 'Ro'), lever('qonto', 'Qonto'), lever('rover', 'Rover'),
  lever('jumpcloud', 'JumpCloud'), lever('swile', 'Swile'), lever('outreach', 'Outreach'), lever('zeta', 'Zeta'), lever('malt', 'Malt'),
  lever('contentsquare', 'Contentsquare'), lever('cred', 'CRED'),
]

export const sourceBySlug = (slug: string) => BOARD_SOURCES.find(b => b.slug === slug) ?? null
