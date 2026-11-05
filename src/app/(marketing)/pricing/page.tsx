import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/motion/Reveal';
import PricingPlans from './PricingPlans';

export const metadata: Metadata = {
  title: { absolute: 'Pricing | ApplyMaster - AI Job Application Tool Plans' },
  description:
    'ApplyMaster pricing plans: Free ($0, 10 apps/month), Pro ($29/mo, unlimited), and Lifetime ($199 one-time). Compare features and find the right plan for your job search.',
  alternates: {
    canonical: 'https://www.applymaster.ai/pricing',
  },
  openGraph: {
    title: 'Pricing | ApplyMaster',
    description:
      'Free, Pro, and Lifetime plans. Start applying with AI for $0 and upgrade when ready.',
    url: 'https://www.applymaster.ai/pricing',
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
  url: 'https://www.applymaster.ai/pricing',
  mainEntity: [
    {
      '@type': 'Product',
      name: 'ApplyMaster Free',
      description: 'Get started with 30 applications per month at no cost.',
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
      description: '150 applications a month with advanced AI resume optimization, cover letters, and the Chrome extension.',
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
      name: 'ApplyMaster Elite',
      description: 'Unlimited applications with a tailored resume and cover letter for every job.',
      offers: {
        '@type': 'Offer',
        price: '59',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '59',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
      },
    },
    {
      '@type': 'Product',
      name: 'ApplyMaster Lifetime',
      description: 'One-time payment for lifetime access to everything in Elite.',
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
      '30 applications per month',
      'Copilot & Autopilot auto-apply',
      'Resume optimization & ATS score',
      'AI cover letters',
      '3 AI mock interviews per month',
      'Job matching & tracking',
      'Email support',
    ],
    limitations: [
      'Standard AI model',
      'No Chrome extension',
      'No tailored resume per job',
    ],
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: '150 applications a month, with the advanced AI on everything.',
    cta: 'Go Pro',
    highlight: true,
    features: [
      '150 applications per month (10/day pace)',
      'Advanced AI resume optimization',
      'Advanced AI cover letters',
      'Unlimited AI mock interviews',
      'Copilot & Autopilot auto-apply',
      'Chrome extension',
      'Buy extra applications — $5 for 20',
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
      'Unlimited applications — no monthly cap',
      'God Mode: tailored resume & cover letter for every job',
      'Referral network & warm-path finder',
      'Referral request drafts & tracking',
      'Dedicated support',
    ],
    limitations: [],
  },
  {
    name: 'Lifetime',
    price: '$199',
    period: 'one-time',
    description: 'Everything in Elite, forever. Pay once, use forever.',
    cta: 'Get Lifetime Access',
    highlight: false,
    features: [
      'Everything in Elite',
      'Lifetime access, no recurring fees',
      'All future feature updates included',
      'Early access to new features',
      'Priority support forever',
    ],
    limitations: [],
  },
];

const comparisonFeatures = [
  { feature: 'Monthly applications', free: '30', pro: '150 (10/day pace)', elite: 'Unlimited', lifetime: 'Unlimited' },
  { feature: 'Extra application credits', free: '—', pro: '$5 for 20', elite: 'Not needed', lifetime: 'Not needed' },
  { feature: 'Copilot & Autopilot auto-apply', free: 'Yes', pro: 'Yes', elite: 'Yes', lifetime: 'Yes' },
  { feature: 'Resume optimization', free: 'Standard AI', pro: 'Advanced AI', elite: 'Advanced AI', lifetime: 'Advanced AI' },
  { feature: 'Cover letters', free: 'Standard AI', pro: 'Advanced AI', elite: 'Advanced AI', lifetime: 'Advanced AI' },
  { feature: 'AI mock interviews', free: '3/month', pro: 'Unlimited', elite: 'Unlimited', lifetime: 'Unlimited' },
  { feature: 'Chrome extension', free: 'No', pro: 'Yes', elite: 'Yes', lifetime: 'Yes' },
  { feature: 'God Mode: tailored resume per job', free: 'No', pro: 'No', elite: 'Yes', lifetime: 'Yes' },
  { feature: 'Referral network & ask drafts', free: 'No', pro: 'No', elite: 'Yes', lifetime: 'Yes' },
  { feature: 'Support', free: 'Email', pro: 'Priority', elite: 'Dedicated', lifetime: 'Dedicated, forever' },
  { feature: 'Future updates', free: 'Yes', pro: 'While subscribed', elite: 'While subscribed', lifetime: 'Included forever' },
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
    q: 'What happens when I reach my application limit?',
    a: 'Free includes 30 applications a month. Pro includes 150 a month at a pace of up to 10 a day — and if you need more, a $5 pack adds 20 extra applications that never expire. Elite and Lifetime have no monthly limit. Your usage meter in the app always shows where you stand before you hit anything.',
  },
  {
    q: 'Do you offer a refund?',
    a: 'We offer a 14-day money-back guarantee on both Pro and Lifetime plans. If you are not satisfied for any reason, contact our support team within 14 days of purchase for a full refund.',
  },
  {
    q: 'Is there a student or team discount?',
    a: 'We offer a 50% discount for students with a valid .edu email address. For team pricing (career coaches, bootcamps, universities), please contact us at support@applymaster.ai.',
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
          <div aria-hidden="true" className="am-aura am-aura-live absolute inset-[-30%]" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
            {/* CSS-only entrance: the hero and plan cards must stay visible even if a script fails to load. */}
            <h1 className="am-rise font-display text-[clamp(2.6rem,5.6vw,4.2rem)]" style={{ textWrap: 'balance' }}>
              Simple, Transparent Pricing
            </h1>
            <p className="am-rise mt-6 max-w-2xl mx-auto text-lg text-[var(--text-secondary)] leading-relaxed" style={{ animationDelay: '120ms' }}>
              Start free, upgrade when your job search heats up. No hidden fees,
              no surprise charges, and a 14-day money-back guarantee on every paid plan.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-4 pb-20 pt-6">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <PricingPlans tiers={tiers} />
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-14 bg-[var(--bg-card)]">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <Reveal>
              <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] text-center mb-10">
                Feature Comparison
              </h2>
            </Reveal>
            <Reveal delay={0.1} effect="scale">
            <div
              className="overflow-x-auto rounded-2xl"
              style={{ background: 'var(--card-face)', boxShadow: 'var(--card-lift), 0 0 0 1px var(--card-ring), inset 0 1px 0 0 var(--card-edge-top)' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-4 pl-5 pr-4 font-semibold text-[var(--text-secondary)]">Feature</th>
                    <th className="py-4 px-4 font-semibold text-[var(--text-secondary)] text-center">Free</th>
                    <th className="py-4 px-4 font-semibold text-[var(--accent)] text-center" style={{ background: 'var(--accent-dim)' }}>Pro</th>
                    <th className="py-4 px-4 font-semibold text-[var(--text-secondary)] text-center">Elite</th>
                    <th className="py-4 px-4 pr-5 font-semibold text-[var(--text-secondary)] text-center">Lifetime</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row) => (
                    <tr key={row.feature} className="border-b border-[var(--border)] last:border-b-0 transition-colors duration-200 hover:bg-[var(--bg-card-hover)]">
                      <td className="py-3 pl-5 pr-4 text-[var(--text-secondary)]">{row.feature}</td>
                      <td className="py-3 px-4 text-center text-[var(--text-muted)]">{row.free}</td>
                      <td className="py-3 px-4 text-center text-ink font-medium" style={{ background: 'var(--accent-dim)' }}>{row.pro}</td>
                      <td className="py-3 px-4 text-center text-[var(--text-secondary)]">{row.elite}</td>
                      <td className="py-3 px-4 pr-5 text-center text-[var(--text-secondary)]">{row.lifetime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </Reveal>
          </div>
        </section>

        {/* Money-back guarantee */}
        <section className="py-14">
          <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
            <Reveal effect="scale">
            <div
              className="relative overflow-hidden rounded-2xl p-12"
              style={{
                background: 'var(--green-dim)',
                boxShadow: '0 0 0 1px rgb(var(--green-rgb) / calc(0.18 * var(--tint-scale))), 0 24px 60px -30px rgb(var(--green-rgb) / 0.35)',
              }}
            >
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(60% 100% at 50% 0%, rgb(var(--green-rgb) / calc(0.14 * var(--tint-scale))), transparent 70%)' }} />
              <h2 className="relative font-display text-[2rem] mb-4">14-Day Money-Back Guarantee</h2>
              <p className="relative text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
                Try ApplyMaster Pro or Lifetime risk-free. If it does not transform your job
                search within 14 days, we will refund your payment in full — no questions asked.
              </p>
            </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 bg-[var(--bg-card)]">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <Reveal>
              <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] text-center mb-10">
                Pricing FAQ
              </h2>
            </Reveal>
            <div className="space-y-3">
              {faqs.map((item, i) => (
                <Reveal key={item.q} delay={Math.min(i * 0.06, 0.3)}>
                  <div
                    className="rounded-xl px-5 py-4 transition-colors duration-200 hover:bg-[var(--bg-card-hover)]"
                    style={{ boxShadow: '0 0 0 1px var(--card-ring)' }}
                  >
                    <h3 className="font-semibold text-ink mb-2">{item.q}</h3>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">{item.a}</p>
                  </div>
                </Reveal>
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
                  className="am-press rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-ink hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden py-16 bg-gradient-to-b from-transparent to-[var(--accent-dim)]">
          <div aria-hidden="true" className="am-aura absolute inset-x-[-20%] bottom-[-60%] top-[20%]" />
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <Reveal effect="blur">
              <h2 className="font-display text-[clamp(1.8rem,3.6vw,2.5rem)] mb-5">
                Start Your Smarter Job Search Today
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-[var(--text-muted)] mb-10 text-lg">
                No credit card required. Get 10 free applications every month.
              </p>
            </Reveal>
            <Reveal delay={0.18} effect="scale">
              <Link
                href="/signup"
                className="am-press inline-block rounded-full bg-[var(--accent-solid)] px-10 py-4 text-base font-semibold text-[var(--text-on-accent)] hover:bg-[var(--accent-solid)] hover:-translate-y-0.5 transition-all"
                style={{ boxShadow: 'var(--shadow-accent), var(--pill-glow)' }}
              >
                Sign Up Free
              </Link>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}
