import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing | ApplyMaster - AI Job Application Tool Plans',
  description:
    'ApplyMaster pricing plans: Free ($0, 10 apps/month), Pro ($29/mo, unlimited), and Lifetime ($199 one-time). Compare features and find the right plan for your job search.',
  alternates: {
    canonical: 'https://applymaster.ai/pricing',
  },
  openGraph: {
    title: 'Pricing | ApplyMaster',
    description:
      'Free, Pro, and Lifetime plans. Start applying with AI for $0 and upgrade when ready.',
    url: 'https://applymaster.ai/pricing',
    siteName: 'ApplyMaster',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing | ApplyMaster',
    description:
      'AI job application pricing: Free ($0), Pro ($29/mo), Lifetime ($199 one-time).',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'ApplyMaster Pricing',
  description: 'Pricing plans for ApplyMaster AI job application platform.',
  url: 'https://applymaster.ai/pricing',
  mainEntity: [
    {
      '@type': 'Product',
      name: 'ApplyMaster Free',
      description: 'Get started with 10 applications per month at no cost.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '0',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
      },
    },
    {
      '@type': 'Product',
      name: 'ApplyMaster Pro',
      description: 'Unlimited applications, full feature access, priority support.',
      offers: {
        '@type': 'Offer',
        price: '29',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '29',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
      },
    },
    {
      '@type': 'Product',
      name: 'ApplyMaster Lifetime',
      description: 'One-time payment for lifetime access to all features.',
      offers: {
        '@type': 'Offer',
        price: '199',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '199',
          priceCurrency: 'USD',
        },
      },
    },
  ],
};

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started with AI-powered job applications.',
    cta: 'Start Free',
    highlight: false,
    features: [
      '10 applications per month',
      'Basic resume optimization',
      'Basic cover letter generation',
      '3 mock interviews per month',
      'Job matching (5 recommendations/day)',
      'Email support',
    ],
    limitations: [
      'No Autopilot mode',
      'No real-time interview coaching',
      'Standard ATS scoring',
    ],
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'Unlimited applications and full access to every feature.',
    cta: 'Go Pro',
    highlight: true,
    features: [
      'Unlimited applications',
      'Advanced resume optimization',
      'Advanced cover letter generation',
      'Unlimited mock interviews',
      'Unlimited job recommendations',
      'Copilot & Autopilot modes',
      'Real-time interview coaching',
      'Chrome extension access',
      'Advanced ATS scoring',
      'Application analytics dashboard',
      'Priority support',
    ],
    limitations: [],
  },
  {
    name: 'Elite',
    price: '$59',
    period: '/month',
    description: 'Maximum firepower for an urgent search.',
    cta: 'Go Elite',
    highlight: false,
    features: [
      'Everything in Pro',
      'Live interview coach',
      'A/B resume testing',
      'Recruiter outreach',
      'Referral request emails',
      'Autopilot mode',
      'Dedicated support',
    ],
    limitations: [],
  },
  {
    name: 'Lifetime',
    price: '$199',
    period: 'one-time',
    description: 'Everything in Pro, forever. Pay once, use forever.',
    cta: 'Get Lifetime Access',
    highlight: false,
    features: [
      'Everything in Pro',
      'Lifetime access, no recurring fees',
      'All future feature updates included',
      'Priority support forever',
      'Early access to beta features',
    ],
    limitations: [],
  },
];

const comparisonFeatures = [
  { feature: 'Monthly Applications', free: '10', pro: 'Unlimited', lifetime: 'Unlimited' },
  { feature: 'Resume Optimization', free: 'Basic', pro: 'Advanced', lifetime: 'Advanced' },
  { feature: 'Cover Letter Generation', free: 'Basic', pro: 'Advanced', lifetime: 'Advanced' },
  { feature: 'Mock Interviews', free: '3/month', pro: 'Unlimited', lifetime: 'Unlimited' },
  { feature: 'Job Recommendations', free: '5/day', pro: 'Unlimited', lifetime: 'Unlimited' },
  { feature: 'Copilot Mode', free: 'Yes', pro: 'Yes', lifetime: 'Yes' },
  { feature: 'Autopilot Mode', free: 'No', pro: 'Yes', lifetime: 'Yes' },
  { feature: 'Real-Time Interview Coaching', free: 'No', pro: 'Yes', lifetime: 'Yes' },
  { feature: 'Chrome Extension', free: 'No', pro: 'Yes', lifetime: 'Yes' },
  { feature: 'Advanced ATS Scoring', free: 'No', pro: 'Yes', lifetime: 'Yes' },
  { feature: 'Analytics Dashboard', free: 'Basic', pro: 'Full', lifetime: 'Full' },
  { feature: 'Support', free: 'Email', pro: 'Priority', lifetime: 'Priority' },
  { feature: 'Future Updates', free: 'Yes', pro: 'Yes', lifetime: 'Yes' },
];

const faqs = [
  {
    q: 'Can I cancel my Pro subscription at any time?',
    a: 'Yes. You can cancel your Pro subscription at any time from your account settings. Your access continues until the end of your current billing period, and you are never charged again after cancellation.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure payment processor, Stripe. Apple Pay and Google Pay are also supported.',
  },
  {
    q: 'Is the Lifetime plan really forever?',
    a: 'Yes. The Lifetime plan grants you permanent access to all current and future features. There are no recurring charges, hidden fees, or renewal requirements. If ApplyMaster exists, your access exists.',
  },
  {
    q: 'Can I switch between plans?',
    a: 'Absolutely. You can upgrade from Free to Pro at any time, and any unused portion of your billing period will be prorated. You can also purchase the Lifetime plan while on Pro, and your remaining Pro subscription will be credited.',
  },
  {
    q: 'Do you offer a refund?',
    a: 'We offer a 14-day money-back guarantee on both Pro and Lifetime plans. If you are not satisfied for any reason, contact our support team within 14 days of purchase for a full refund.',
  },
  {
    q: 'Is there a student or team discount?',
    a: 'We offer a 50% discount for students with a valid .edu email address. For team pricing (career coaches, bootcamps, universities), please contact us at team@applymaster.ai.',
  },
];

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-14">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-dim)] to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)]">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-[var(--text-secondary)] leading-relaxed">
              Start free, upgrade when your job search heats up. No hidden fees,
              no surprise charges, and a 14-day money-back guarantee on every paid plan.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-4 pb-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-2xl border p-8 flex flex-col ${
                    tier.highlight
                      ? 'border-[var(--accent)] bg-[var(--accent-dim)] ring-2 ring-purple-500/50 relative'
                      : 'border-[var(--border)] bg-[var(--bg-card)]'
                  }`}
                >
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent-solid)] px-4 py-1 text-xs font-semibold">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-extrabold">{tier.price}</span>
                    <span className="text-[var(--text-muted)] text-sm">{tier.period}</span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mb-6">{tier.description}</p>

                  <Link
                    href="/signup"
                    className={`block rounded-full py-3 text-center text-sm font-semibold transition-colors mb-8 ${
                      tier.highlight
                        ? 'bg-[var(--accent-solid)] text-ink hover:bg-[var(--accent-solid)]'
                        : 'border border-[var(--border-hover)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-ink'
                    }`}
                  >
                    {tier.cta}
                  </Link>

                  <ul className="space-y-3 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                        <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-[var(--green-dim)] flex items-center justify-center text-xs text-[var(--green)]">&#10003;</span>
                        {f}
                      </li>
                    ))}
                    {tier.limitations.map((l) => (
                      <li key={l} className="flex items-start gap-3 text-sm text-[var(--text-faint)]">
                        <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-[var(--bg-card-hover)] flex items-center justify-center text-xs text-[var(--text-faint)]">&times;</span>
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-14 bg-[var(--bg-card)]">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] text-center mb-10">
              Feature Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-4 pr-4 font-semibold text-[var(--text-secondary)]">Feature</th>
                    <th className="py-4 px-4 font-semibold text-[var(--text-secondary)] text-center">Free</th>
                    <th className="py-4 px-4 font-semibold text-[var(--accent)] text-center">Pro</th>
                    <th className="py-4 px-4 font-semibold text-[var(--text-secondary)] text-center">Lifetime</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row) => (
                    <tr key={row.feature} className="border-b border-[var(--border)]">
                      <td className="py-3 pr-4 text-[var(--text-secondary)]">{row.feature}</td>
                      <td className="py-3 px-4 text-center text-[var(--text-muted)]">{row.free}</td>
                      <td className="py-3 px-4 text-center text-ink font-medium">{row.pro}</td>
                      <td className="py-3 px-4 text-center text-[var(--text-secondary)]">{row.lifetime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Money-back guarantee */}
        <section className="py-14">
          <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--green-dim)] p-12">
              <h2 className="text-2xl font-bold mb-4">14-Day Money-Back Guarantee</h2>
              <p className="text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
                Try ApplyMaster Pro or Lifetime risk-free. If it does not transform your job
                search within 14 days, we will refund your payment in full — no questions asked.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 bg-[var(--bg-card)]">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] text-center mb-10">
              Pricing FAQ
            </h2>
            <div className="space-y-8">
              {faqs.map((item) => (
                <div key={item.q}>
                  <h3 className="font-semibold text-ink mb-2">{item.q}</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature links */}
        <section className="py-14">
          <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold mb-8">Explore What You Get</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { label: 'Auto-Apply', href: '/features/auto-apply' },
                { label: 'Resume Optimizer', href: '/features/resume-optimizer' },
                { label: 'Cover Letter Generator', href: '/features/cover-letter-generator' },
                { label: 'Interview Coach', href: '/features/interview-coach' },
                { label: 'Job Matching', href: '/features/job-matching' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-ink transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-b from-transparent to-[var(--accent-dim)]">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] mb-5">
              Start Your Smarter Job Search Today
            </h2>
            <p className="text-[var(--text-muted)] mb-10 text-lg">
              No credit card required. Get 10 free applications every month.
            </p>
            <Link
              href="/signup"
              className="rounded-full bg-[var(--accent-solid)] px-10 py-4 text-base font-semibold text-[var(--text-on-accent)] shadow-lg hover:bg-[var(--accent-solid)] transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
