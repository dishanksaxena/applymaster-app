import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | ApplyMaster',
  description:
    'ApplyMaster terms of service. Read our terms and conditions governing the use of our AI-powered job application platform.',
  alternates: {
    canonical: 'https://applymaster.ai/terms',
  },
  openGraph: {
    title: 'Terms of Service | ApplyMaster',
    description: 'Terms and conditions for using the ApplyMaster platform.',
    url: 'https://applymaster.ai/terms',
    siteName: 'ApplyMaster',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service | ApplyMaster',
    description: 'Terms and conditions for using the ApplyMaster platform.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Terms of Service',
  description: 'ApplyMaster terms of service and conditions of use.',
  url: 'https://applymaster.ai/terms',
  isPartOf: {
    '@type': 'WebSite',
    name: 'ApplyMaster',
    url: 'https://applymaster.ai',
  },
};

export default function TermsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-[#0a0a12] text-white">
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-gray-400 mb-12">Last updated: April 7, 2026</p>

          <div className="prose prose-invert max-w-none space-y-10 text-gray-300 leading-relaxed">
            {/* Acceptance */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using ApplyMaster (&ldquo;the Service&rdquo;), operated by ApplyMaster
                (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;), you agree to be bound by these
                Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you may not
                use the Service.
              </p>
              <p className="mt-4">
                We reserve the right to modify these Terms at any time. Material changes will be
                communicated via email or in-app notification at least 14 days before they take effect.
                Your continued use of the Service after changes become effective constitutes acceptance
                of the revised Terms.
              </p>
            </section>

            {/* Description of Service */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
              <p>
                ApplyMaster is an AI-powered job application platform that provides the following features:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Automated job application submission across multiple job portals.</li>
                <li>AI-powered resume optimization and ATS compatibility scoring.</li>
                <li>Personalized cover letter generation.</li>
                <li>AI interview coaching, mock interviews, and real-time assistance.</li>
                <li>Intelligent job matching and recommendation.</li>
              </ul>
              <p className="mt-4">
                The Service is provided as-is and is continually evolving. We may add, modify, or
                discontinue features at any time with reasonable notice.
              </p>
            </section>

            {/* Account Registration */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Account Registration</h2>
              <p>To use ApplyMaster, you must:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Be at least 16 years of age.</li>
                <li>Provide accurate and complete registration information.</li>
                <li>Maintain the security of your account credentials.</li>
                <li>Notify us immediately of any unauthorized access to your account.</li>
              </ul>
              <p className="mt-4">
                You are responsible for all activity that occurs under your account. We reserve the
                right to suspend or terminate accounts that violate these Terms.
              </p>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use</h2>
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Submit fraudulent, misleading, or false information in job applications.</li>
                <li>Violate the terms of service of any third-party job portal or website.</li>
                <li>Impersonate another person or misrepresent your qualifications.</li>
                <li>Distribute malware, spam, or engage in any form of automated abuse.</li>
                <li>Attempt to reverse-engineer, decompile, or extract source code from the Service.</li>
                <li>Use the Service for any illegal purpose or in violation of applicable laws.</li>
                <li>Resell, sublicense, or redistribute access to the Service without authorization.</li>
                <li>Interfere with or disrupt the Service infrastructure or other users&apos; access.</li>
              </ul>
            </section>

            {/* Subscriptions and Payments */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Subscriptions and Payments</h2>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">5.1 Plans</h3>
              <p>
                ApplyMaster offers a Free plan, a Pro subscription ($29/month), and a Lifetime plan ($199
                one-time payment). Plan details, including features and limitations, are described on our{' '}
                <Link href="/pricing" className="text-purple-400 underline hover:text-purple-300">pricing page</Link>.
              </p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">5.2 Billing</h3>
              <p>
                Pro subscriptions are billed monthly in advance via Stripe. By subscribing, you authorize
                us to charge your payment method on a recurring basis until you cancel. Prices are in
                US Dollars unless otherwise stated.
              </p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">5.3 Cancellation</h3>
              <p>
                You may cancel your Pro subscription at any time through your account settings. Cancellation
                takes effect at the end of the current billing period. No partial refunds are issued for
                unused portions of a billing cycle, except within the 14-day money-back guarantee period.
              </p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">5.4 Refunds</h3>
              <p>
                We offer a 14-day money-back guarantee on both Pro and Lifetime plans. To request a refund,
                contact support@applymaster.ai within 14 days of your purchase. After the 14-day period,
                refunds are issued at our sole discretion.
              </p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">5.5 Price Changes</h3>
              <p>
                We reserve the right to adjust pricing. Existing subscribers will be notified at least
                30 days before any price increase takes effect. Lifetime plan holders are not affected
                by future price changes.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Intellectual Property</h2>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">6.1 Our Content</h3>
              <p>
                The Service, including its design, code, features, documentation, and branding, is
                owned by ApplyMaster and protected by intellectual property laws. You may not copy,
                modify, or distribute any part of the Service without written permission.
              </p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">6.2 Your Content</h3>
              <p>
                You retain ownership of all content you upload to ApplyMaster, including resumes,
                cover letters, and profile information. By using the Service, you grant us a limited,
                non-exclusive license to process your content solely for the purpose of providing the
                Service to you.
              </p>
              <p className="mt-4">
                We do not use your content for training AI models, advertising, or any purpose beyond
                delivering the features you have requested.
              </p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">6.3 AI-Generated Content</h3>
              <p>
                Content generated by ApplyMaster&apos;s AI features (optimized resumes, cover letters,
                interview responses) is considered a derivative of your input and belongs to you. You
                are responsible for reviewing and verifying AI-generated content before submission to
                employers.
              </p>
            </section>

            {/* Disclaimer of Warranties */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Disclaimer of Warranties</h2>
              <p>
                THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
                WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES
                OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="mt-4">
                We do not guarantee that:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>The Service will be uninterrupted, error-free, or secure.</li>
                <li>Job applications submitted through the Service will result in interviews or offers.</li>
                <li>AI-generated content will be free of errors or appropriate for every situation.</li>
                <li>Job portal integrations will work with every employer&apos;s application system.</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, APPLYMASTER AND ITS OFFICERS, DIRECTORS,
                EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS,
                DATA, USE, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
              </p>
              <p className="mt-4">
                Our total liability for any claim arising from the Service shall not exceed the amount
                you paid to us in the 12 months preceding the claim, or $100, whichever is greater.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless ApplyMaster from any claims, damages, losses,
                or expenses (including reasonable attorney fees) arising from your use of the Service,
                your violation of these Terms, or your violation of any third party&apos;s rights.
              </p>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Third-Party Services</h2>
              <p>
                The Service integrates with third-party job portals, payment processors, and AI providers.
                Your use of these third-party services is subject to their respective terms of service and
                privacy policies. We are not responsible for the practices or content of third-party services.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Termination</h2>
              <p>
                We may suspend or terminate your access to the Service at any time for violation of these
                Terms or for any other reason with reasonable notice. Upon termination:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Your right to use the Service ceases immediately.</li>
                <li>We will provide a reasonable period (at least 30 days) for you to export your data.</li>
                <li>We will delete your personal data in accordance with our <Link href="/privacy" className="text-purple-400 underline hover:text-purple-300">Privacy Policy</Link>.</li>
              </ul>
              <p className="mt-4">
                You may terminate your account at any time by contacting support or through your account settings.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Governing Law and Dispute Resolution</h2>
              <p>
                These Terms are governed by the laws of the State of Delaware, United States, without
                regard to conflict of law principles. Any disputes arising from these Terms or the
                Service shall be resolved through binding arbitration administered by the American
                Arbitration Association, except that either party may seek injunctive relief in court
                for intellectual property violations.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Severability</h2>
              <p>
                If any provision of these Terms is found to be unenforceable, the remaining provisions
                shall continue in full force and effect. The unenforceable provision shall be modified
                to the minimum extent necessary to make it enforceable.
              </p>
            </section>

            {/* Entire Agreement */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">14. Entire Agreement</h2>
              <p>
                These Terms, together with our <Link href="/privacy" className="text-purple-400 underline hover:text-purple-300">Privacy Policy</Link>,
                constitute the entire agreement between you and ApplyMaster regarding the Service and
                supersede all prior agreements, understandings, and communications.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">15. Contact Us</h2>
              <p>If you have questions about these Terms, contact us at:</p>
              <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900/40 p-6">
                <p><strong>ApplyMaster</strong></p>
                <p className="mt-1">Email: legal@applymaster.ai</p>
                <p className="mt-1">Support: support@applymaster.ai</p>
              </div>
            </section>
          </div>

          {/* Footer links */}
          <div className="mt-16 pt-8 border-t border-gray-800 flex flex-wrap gap-6 text-sm">
            <Link href="/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</Link>
            <Link href="/features" className="text-purple-400 hover:text-purple-300">Features</Link>
            <Link href="/pricing" className="text-purple-400 hover:text-purple-300">Pricing</Link>
            <Link href="/signup" className="text-purple-400 hover:text-purple-300">Sign Up</Link>
          </div>
        </div>
      </main>
    </>
  );
}
