/**
 * The homepage FAQ, as structured data. It used to sit in the root layout's
 * sitewide graph, so every page — 17,000 job pages and every blog post —
 * claimed an FAQ it does not show. Structured data must describe the page it
 * is on, and the duplicate also cancelled out each blog post's own FAQPage.
 * Moved here verbatim; only the homepage renders it.
 */
export const HOME_FAQ_LD = {
  '@context': 'https://schema.org',
  ...({
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is ApplyMaster actually free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. The Free plan gives you 30 applications/month, resume optimization, job search, and application tracking — forever. No credit card, no trial expiry. Upgrade only when you need more volume.',
          },
        },
        {
          '@type': 'Question',
          name: 'Will employers know I used AI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Every application is unique — your resume is restructured per job, cover letters reference specific company details, and screening questions are answered contextually. Applications are indistinguishable from hand-crafted ones.',
          },
        },
        {
          '@type': 'Question',
          name: 'What job portals are supported?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '50+ globally: LinkedIn, Indeed, Glassdoor, ZipRecruiter, Greenhouse, Lever, Workday, Naukri, Instahyre, Dice, Wellfound, Monster, SEEK, Reed, and many more. New integrations added weekly.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does the Live Interview Coach work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The Chrome extension captures interview audio during Google Meet, Zoom, or Teams calls, transcribes it in real-time using AI, and displays suggested answers on your screen. It pulls from your resume and the job description to generate personalized responses.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the difference between Copilot and Autopilot?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Copilot queues every application for your review — you see the tailored resume, cover letter, and answers before approving. Autopilot applies automatically to jobs above your match threshold.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I cancel anytime?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. No contracts, no fees. Cancel with one click. Your data exports are always available. Lifetime plan never expires.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is my data secure?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'AES-256 encryption, SOC 2 compliant infrastructure, GDPR ready. We never share your data with employers or third parties. One-click data deletion available anytime.',
          },
        },
      ],
    }),
}
