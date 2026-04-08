import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | ApplyMaster',
  description:
    'ApplyMaster privacy policy. Learn how we collect, use, and protect your personal data including information about cookies, third-party services, GDPR rights, and data retention.',
  alternates: {
    canonical: 'https://applymaster.ai/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | ApplyMaster',
    description: 'How ApplyMaster collects, uses, and protects your personal data.',
    url: 'https://applymaster.ai/privacy',
    siteName: 'ApplyMaster',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy | ApplyMaster',
    description: 'How ApplyMaster collects, uses, and protects your personal data.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Privacy Policy',
  description: 'ApplyMaster privacy policy and data protection practices.',
  url: 'https://applymaster.ai/privacy',
  isPartOf: {
    '@type': 'WebSite',
    name: 'ApplyMaster',
    url: 'https://applymaster.ai',
  },
};

export default function PrivacyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-[#0a0a12] text-white">
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-gray-400 mb-12">Last updated: April 7, 2026</p>

          <div className="prose prose-invert max-w-none space-y-10 text-gray-300 leading-relaxed">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p>
                ApplyMaster (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates the website
                applymaster.ai and related services (collectively, the &ldquo;Service&rdquo;). This Privacy
                Policy explains how we collect, use, disclose, and safeguard your personal information
                when you use our Service.
              </p>
              <p className="mt-4">
                By using ApplyMaster, you agree to the collection and use of information in accordance
                with this policy. If you do not agree, please do not use the Service.
              </p>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, and password when you create an account.</li>
                <li><strong>Profile Data:</strong> Resume content, work history, skills, education, and career preferences you provide to use our features.</li>
                <li><strong>Payment Information:</strong> Billing details processed securely through Stripe. We do not store your full credit card number on our servers.</li>
                <li><strong>Communications:</strong> Messages you send to our support team or through in-app feedback forms.</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Usage Data:</strong> Pages visited, features used, application submission history, and interaction patterns.</li>
                <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and screen resolution.</li>
                <li><strong>Log Data:</strong> IP address, access times, referring URLs, and error logs.</li>
                <li><strong>Cookies and Similar Technologies:</strong> See Section 5 for details.</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">2.3 Information from Third Parties</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Authentication Providers:</strong> If you sign in via Google or LinkedIn, we receive your name, email, and profile picture.</li>
                <li><strong>Job Portals:</strong> When you connect job portal accounts, we may access job listing data to improve matching.</li>
              </ul>
            </section>

            {/* How We Use Data */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              <p>We use your personal information to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Provide, operate, and maintain the Service, including auto-apply, resume optimization, cover letter generation, job matching, and interview coaching.</li>
                <li>Personalize your experience by tailoring job recommendations and application content to your profile.</li>
                <li>Process transactions and send billing confirmations.</li>
                <li>Communicate with you about updates, security alerts, and support inquiries.</li>
                <li>Analyze usage patterns to improve our features, performance, and user experience.</li>
                <li>Detect, prevent, and address technical issues, fraud, and abuse.</li>
                <li>Comply with legal obligations and enforce our terms of service.</li>
              </ul>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Services</h2>
              <p>We use the following third-party services to operate ApplyMaster:</p>
              <ul className="list-disc pl-6 space-y-3 mt-4">
                <li>
                  <strong>Supabase:</strong> Database hosting, authentication, and file storage.
                  Supabase processes your account data and uploaded documents on our behalf.
                  <br />
                  <span className="text-sm text-gray-400">Privacy policy: supabase.com/privacy</span>
                </li>
                <li>
                  <strong>Stripe:</strong> Payment processing. Stripe handles all credit card data
                  and is PCI DSS Level 1 certified. We never see or store your full card number.
                  <br />
                  <span className="text-sm text-gray-400">Privacy policy: stripe.com/privacy</span>
                </li>
                <li>
                  <strong>Anthropic (Claude AI):</strong> AI-powered features including resume optimization,
                  cover letter generation, and interview coaching. Your resume content and job descriptions
                  are sent to Anthropic&apos;s API for processing. Anthropic does not use your data for model training.
                  <br />
                  <span className="text-sm text-gray-400">Privacy policy: anthropic.com/privacy</span>
                </li>
                <li>
                  <strong>Analytics:</strong> We use privacy-focused analytics to understand how the Service
                  is used. We do not sell your data to advertisers.
                </li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Cookies and Tracking Technologies</h2>
              <p>We use the following types of cookies:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Essential Cookies:</strong> Required for authentication, security, and basic functionality. These cannot be disabled.</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences, language settings, and UI customizations.</li>
                <li><strong>Analytics Cookies:</strong> Help us understand usage patterns and improve the Service. These can be opted out of.</li>
              </ul>
              <p className="mt-4">
                We do not use advertising cookies or share cookie data with third-party advertisers.
                You can manage cookie preferences through your browser settings or our cookie consent banner.
              </p>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Data Sharing and Disclosure</h2>
              <p>We do not sell your personal information. We may share data in these circumstances:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Service Providers:</strong> With third-party vendors who process data on our behalf (see Section 4), under strict data processing agreements.</li>
                <li><strong>Job Applications:</strong> When you submit an application through ApplyMaster, your resume and cover letter are sent to the employer or their ATS — this is the intended function of the Service.</li>
                <li><strong>Legal Requirements:</strong> When required by law, subpoena, or court order, or to protect our rights, safety, or property.</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with advance notice to users.</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Data Security</h2>
              <p>
                We implement industry-standard security measures including encryption in transit (TLS 1.3),
                encryption at rest (AES-256), access controls, and regular security audits. However, no
                method of electronic transmission or storage is 100% secure, and we cannot guarantee
                absolute security.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Data Retention</h2>
              <p>
                We retain your personal data for as long as your account is active or as needed to
                provide the Service. If you delete your account, we will delete your personal data
                within 30 days, except where retention is required by law or for legitimate business
                purposes (such as resolving disputes or enforcing agreements).
              </p>
            </section>

            {/* GDPR */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Your Rights (GDPR and CCPA)</h2>
              <p>Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data (&ldquo;right to be forgotten&rdquo;).</li>
                <li><strong>Portability:</strong> Request your data in a structured, machine-readable format.</li>
                <li><strong>Restriction:</strong> Request that we limit the processing of your data.</li>
                <li><strong>Objection:</strong> Object to the processing of your data for certain purposes.</li>
                <li><strong>Withdraw Consent:</strong> Where processing is based on consent, you may withdraw it at any time.</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, contact us at <strong>privacy@applymaster.ai</strong>.
                We will respond within 30 days.
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. International Data Transfers</h2>
              <p>
                Your data may be processed in countries outside your jurisdiction, including the United States.
                We ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs)
                for transfers from the European Economic Area.
              </p>
            </section>

            {/* Children */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Children&apos;s Privacy</h2>
              <p>
                ApplyMaster is not intended for users under the age of 16. We do not knowingly collect
                personal data from children. If you believe a child has provided us with personal data,
                please contact us and we will delete it promptly.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material
                changes by posting the new policy on this page and updating the &ldquo;Last updated&rdquo;
                date. We encourage you to review this page periodically.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Contact Us</h2>
              <p>If you have questions or concerns about this Privacy Policy, contact us at:</p>
              <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900/40 p-6">
                <p><strong>ApplyMaster</strong></p>
                <p className="mt-1">Email: privacy@applymaster.ai</p>
                <p className="mt-1">Data Protection Officer: dpo@applymaster.ai</p>
              </div>
            </section>
          </div>

          {/* Footer links */}
          <div className="mt-16 pt-8 border-t border-gray-800 flex flex-wrap gap-6 text-sm">
            <Link href="/terms" className="text-purple-400 hover:text-purple-300">Terms of Service</Link>
            <Link href="/features" className="text-purple-400 hover:text-purple-300">Features</Link>
            <Link href="/pricing" className="text-purple-400 hover:text-purple-300">Pricing</Link>
            <Link href="/signup" className="text-purple-400 hover:text-purple-300">Sign Up</Link>
          </div>
        </div>
      </main>
    </>
  );
}
