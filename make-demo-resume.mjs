import { chromium } from 'playwright'

/* Generates the resume used in the investor demo. Rendered rather than
   hand-built so the typography holds up on a projector. */

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  @page { size: A4; margin: 14mm 15mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #16181d; font-size: 10.2pt; line-height: 1.42; margin: 0;
  }
  h1 { font-size: 21pt; margin: 0 0 2px; letter-spacing: -0.4px; font-weight: 700; }
  .role { font-size: 10.6pt; color: #3d4351; font-weight: 600; margin-bottom: 5px; }
  .contact { font-size: 8.9pt; color: #4a5160; }
  .contact a { color: #4a5160; text-decoration: none; }
  h2 {
    font-size: 8.9pt; text-transform: uppercase; letter-spacing: 1.3px;
    color: #0b3d6b; border-bottom: 1.2px solid #cdd6e2;
    padding-bottom: 3px; margin: 15px 0 8px; font-weight: 700;
  }
  .job { margin-bottom: 11px; }
  .job-head { display: flex; justify-content: space-between; align-items: baseline; }
  .job-title { font-weight: 700; font-size: 10.6pt; }
  .job-co { font-weight: 600; color: #0b3d6b; }
  .job-meta { font-size: 8.7pt; color: #5c6472; white-space: nowrap; padding-left: 10px; }
  ul { margin: 4px 0 0; padding-left: 15px; }
  li { margin-bottom: 2.5px; }
  .summary { margin: 0; }
  .skills-row { display: flex; margin-bottom: 3px; }
  .skills-label { font-weight: 700; min-width: 108px; color: #3d4351; }
  .two { display: flex; gap: 22px; }
  .two > div { flex: 1; }
  .edu-line { display: flex; justify-content: space-between; align-items: baseline; }
</style></head>
<body>

  <h1>Dishank Saxena</h1>
  <div class="role">Senior Full-Stack Engineer &nbsp;·&nbsp; AI Systems &amp; Applied Machine Learning</div>
  <div class="contact">
    dishanksaxenapro@gmail.com &nbsp;·&nbsp; +91 98765 43210 &nbsp;·&nbsp; Bengaluru, India &nbsp;·&nbsp;
    linkedin.com/in/dishanksaxena &nbsp;·&nbsp; github.com/dishanksaxena
  </div>

  <h2>Summary</h2>
  <p class="summary">
    Full-stack engineer with 8 years building production systems that put large language models
    in front of real users. Shipped four products end to end — an AI hiring platform, an
    enterprise observability SaaS, a property-verification marketplace and an automated trading
    system — owning architecture, inference cost, and the reliability of every path a user
    touches. Comfortable across TypeScript, Python and Postgres, and equally at home tuning a
    retrieval pipeline or a database index.
  </p>

  <h2>Experience</h2>

  <div class="job">
    <div class="job-head">
      <div><span class="job-title">Founder &amp; Principal Engineer</span> — <span class="job-co">ApplyMaster.ai</span></div>
      <div class="job-meta">Jan 2025 – Present · Bengaluru</div>
    </div>
    <ul>
      <li>Built an AI job-application platform on Next.js 14, Supabase and the Anthropic API, taking it from zero to a live product with paying users.</li>
      <li>Designed a resume pipeline that parses PDF and DOCX into structured data and scores it against a posting, cutting time-to-first-application from 40 minutes to under 3.</li>
      <li>Wrote a deterministic referral-matching engine over the user's own network, ranking warm introduction paths ahead of cold applications — referrals convert at roughly 30% against 0.1–2%.</li>
      <li>Cut model spend 71% by moving text extraction off the inference path and routing classification to a smaller model, holding output quality flat.</li>
      <li>Drove ATS form automation with Playwright across Greenhouse, Lever and Ashby, with hard guardrails: never answers voluntary EEO questions, never defeats a CAPTCHA.</li>
    </ul>
  </div>

  <div class="job">
    <div class="job-head">
      <div><span class="job-title">Senior Software Engineer</span> — <span class="job-co">3GP.AI</span></div>
      <div class="job-meta">Mar 2022 – Dec 2024 · Remote</div>
    </div>
    <ul>
      <li>Built the ingestion tier for an enterprise observability platform handling 40,000 events per second across 200+ customer environments.</li>
      <li>Reduced p99 query latency from 1.8s to 240ms by restructuring the time-series schema and introducing pre-aggregated rollups.</li>
      <li>Led the migration from a Rails monolith to event-driven Node services with zero downtime and no customer-visible regression.</li>
      <li>Introduced anomaly detection over metric streams that cut false-positive pages by 62%, measured over two quarters of on-call data.</li>
      <li>Mentored four engineers; two were promoted to senior within the period.</li>
    </ul>
  </div>

  <div class="job">
    <div class="job-head">
      <div><span class="job-title">Software Engineer</span> — <span class="job-co">GharVerify</span></div>
      <div class="job-meta">Jun 2020 – Feb 2022 · Bengaluru</div>
    </div>
    <ul>
      <li>Shipped a property-verification marketplace serving 50,000 monthly users, owning the geospatial search and document-verification flows.</li>
      <li>Built PostGIS-backed radius search returning results in under 90ms at the 95th percentile over 2M indexed properties.</li>
      <li>Automated title-document checks with OCR plus rules, removing roughly 15 hours of manual review per week.</li>
    </ul>
  </div>

  <div class="job">
    <div class="job-head">
      <div><span class="job-title">Software Engineer</span> — <span class="job-co">Silve Opal Labs</span></div>
      <div class="job-meta">Jul 2018 – May 2020 · Bengaluru</div>
    </div>
    <ul>
      <li>Built an automated trading system for prediction markets executing on 5-minute BTC contracts, with backtesting over three years of tick data.</li>
      <li>Implemented position sizing and circuit breakers that capped a single-session drawdown at 4% of book.</li>
      <li>Wrote the market-data ingest in Python and Redis, sustaining sub-50ms tick-to-signal latency.</li>
    </ul>
  </div>

  <h2>Selected Projects</h2>
  <ul>
    <li><strong>Referral Path Finder</strong> — deterministic scoring over a user's network that ranks who can actually refer them, with the model used only to draft the ask, never to invent a connection.</li>
    <li><strong>LinkedIn Content Agent</strong> — GitHub Actions pipeline that drafts and publishes technical posts on a schedule, matched to the author's own voice.</li>
    <li><strong>Portfolio Manager</strong> — Express and Vite dashboard tracking a multi-asset book with live P&amp;L and JSON-backed persistence.</li>
  </ul>

  <h2>Skills</h2>
  <div class="skills-row"><div class="skills-label">Languages</div><div>TypeScript, JavaScript, Python, SQL, Go</div></div>
  <div class="skills-row"><div class="skills-label">Frontend</div><div>React, Next.js, Tailwind CSS, Framer Motion</div></div>
  <div class="skills-row"><div class="skills-label">Backend</div><div>Node.js, FastAPI, PostgreSQL, Redis, Supabase, REST, WebSockets</div></div>
  <div class="skills-row"><div class="skills-label">AI / ML</div><div>Anthropic API, LLM orchestration, RAG, prompt engineering, embeddings, evaluation harnesses</div></div>
  <div class="skills-row"><div class="skills-label">Infrastructure</div><div>AWS, Vercel, Docker, GitHub Actions, Playwright, observability and tracing</div></div>

  <h2>Education</h2>
  <div class="edu-line">
    <div><strong>B.Tech, Computer Science</strong> — Vellore Institute of Technology</div>
    <div class="job-meta">2014 – 2018</div>
  </div>

</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'networkidle' })
await page.pdf({ path: 'Dishank-Saxena-Resume.pdf', format: 'A4', printBackground: true })
await browser.close()
console.log('wrote Dishank-Saxena-Resume.pdf')
