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

      <main className="">
        <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
          <h1 className="font-display text-[clamp(2rem,4vw,2.8rem)] mb-2">Privacy Policy</h1>
          <p className="text-[var(--text-muted)] mb-12">Last updated: September 27, 2026</p>

          <div className="prose prose-invert max-w-none space-y-10 text-[var(--text-secondary)] leading-relaxed">
            {/* Introduction */}
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">1. Introduction</h2>
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
              <h2 className="font-display text-[1.6rem] mb-4">2. Information We Collect</h2>

              <h3 className="text-lg font-semibold text-ink mt-6 mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, and password when you create an account.</li>
                <li><strong>Profile Data:</strong> Resume content, work history, skills, education, and career preferences you provide to use our features.</li>
                <li><strong>Payment Information:</strong> Billing details processed securely through Stripe. We do not store your full credit card number on our servers.</li>
                <li><strong>Communications:</strong> Messages you send to our support team or through in-app feedback forms.</li>
              </ul>

              <h3 className="text-lg font-semibold text-ink mt-6 mb-3">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Usage Data:</strong> Pages visited, features used, application submission history, and interaction patterns.</li>
                <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and screen resolution.</li>
                <li><strong>Log Data:</strong> IP address, access times, referring URLs, and error logs.</li>
                <li><strong>Cookies and Similar Technologies:</strong> See Section 6 for details.</li>
              </ul>

              <h3 className="text-lg font-semibold text-ink mt-6 mb-3">2.3 Information from Third Parties</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Authentication Providers:</strong> If you sign in via Google or LinkedIn, we receive your name, email, and profile picture.</li>
                <li><strong>Job Portals:</strong> When you connect job portal accounts, we may access job listing data to improve matching.</li>
              </ul>
            </section>

            {/* How We Use Data */}
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">3. How We Use Your Information</h2>
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
              <h2 className="font-display text-[1.6rem] mb-4">4. Third-Party Services</h2>
              <p>We use the following third-party services to operate ApplyMaster:</p>
              <ul className="list-disc pl-6 space-y-3 mt-4">
                <li>
                  <strong>Supabase:</strong> Database hosting, authentication, and file storage.
                  Supabase processes your account data and uploaded documents on our behalf.
                  <br />
                  <span className="text-sm text-[var(--text-muted)]">Privacy policy: supabase.com/privacy</span>
                </li>
                <li>
                  <strong>Stripe:</strong> Payment processing. Stripe handles all credit card data
                  and is PCI DSS Level 1 certified. We never see or store your full card number.
                  <br />
                  <span className="text-sm text-[var(--text-muted)]">Privacy policy: stripe.com/privacy</span>
                </li>
                <li>
                  <strong>Anthropic (Claude AI):</strong> AI-powered features including resume optimization,
                  cover letter generation, and interview coaching. Your resume content and job descriptions
                  are sent to Anthropic&apos;s API for processing. Anthropic does not use your data for model training.
                  <br />
                  <span className="text-sm text-[var(--text-muted)]">Privacy policy: anthropic.com/privacy</span>
                </li>
                <li>
                  <strong>Analytics:</strong> We use privacy-focused analytics to understand how the Service
                  is used. We do not sell your data to advertisers.
                </li>
              </ul>
            </section>

            {/* Chrome extension */}
            <section id="chrome-extension">
              <h2 className="font-display text-[1.6rem] mb-4">5. The ApplyMaster Chrome Extension</h2>
              <p>
                The ApplyMaster extension fills job application forms on employers&apos; websites with your
                ApplyMaster profile. You review every answer and submit the application yourself; the
                extension then records it in your ApplyMaster account with a receipt.
              </p>

              <h3 className="text-lg font-semibold text-ink mt-6 mb-3">5.1 Where it runs</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Automatically, only on job application pages at greenhouse.io, jobs.lever.co, jobs.ashbyhq.com and myworkdayjobs.com, and on the applymaster.ai/extension page where you connect it.</li>
                <li>On any other website only when you click its toolbar button, and then only in that tab.</li>
                <li>It does not read your browsing history, other tabs, or any page you have not opened it on.</li>
              </ul>

              <h3 className="text-lg font-semibold text-ink mt-6 mb-3">5.2 What it reads and sends to ApplyMaster</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>The form&apos;s questions:</strong> the address of the application page, and the text of the questions it needs answered, so ApplyMaster can answer them from your profile and resume.</li>
                <li><strong>What you submitted:</strong> when you press the form&apos;s own Submit button, the job title, the company, and the answers in the form at that moment, to create the receipt in your account.</li>
                <li><strong>The employer&apos;s confirmation:</strong> the confirmation message shown after you submit, and any reference number in it.</li>
              </ul>
              <p className="mt-4">
                It never sends your answers to voluntary demographic questions (gender, race or ethnicity,
                veteran or disability status), passwords, payment details, or the contents of pages other
                than the application you are filling.
              </p>

              <h3 className="text-lg font-semibold text-ink mt-6 mb-3">5.3 What it receives from ApplyMaster</h3>
              <p>
                Your profile details, your standing answers (such as work authorization), your resume file
                through a short-lived private link, and written answers to the form&apos;s questions. These
                are placed into the form on your screen and are not stored by the extension.
              </p>

              <h3 className="text-lg font-semibold text-ink mt-6 mb-3">5.4 What it stores in your browser</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>A connection key for your account and your account email. We store only a one-way hash of the key; you can revoke it at any time on applymaster.ai/extension.</li>
                <li>While an application you submitted is waiting for the employer&apos;s confirmation, a record of it for up to 30 minutes, cleared once it is saved to your account.</li>
              </ul>

              <h3 className="text-lg font-semibold text-ink mt-6 mb-3">5.5 What it never does</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Press Submit on your behalf, or solve CAPTCHAs.</li>
                <li>Answer voluntary demographic questions, agree to terms, or tick consent boxes for you.</li>
                <li>Show advertising, track you across websites, or sell or transfer your data to third parties.</li>
              </ul>
              <p className="mt-4">
                Data from the extension is used only to fill your applications and keep your application
                records, and is handled like the rest of your account data under this policy. The use of
                information received from the extension adheres to the Chrome Web Store User Data Policy,
                including the Limited Use requirements. Uninstalling the extension or disconnecting it stops
                all of this; deleting your account deletes the records it created.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">6. Cookies and Tracking Technologies</h2>
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
              <h2 className="font-display text-[1.6rem] mb-4">7. Data Sharing and Disclosure</h2>
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
              <h2 className="font-display text-[1.6rem] mb-4">8. Data Security</h2>
              <p>
                We implement industry-standard security measures including encryption in transit (TLS 1.3),
                encryption at rest (AES-256), access controls, and regular security audits. However, no
                method of electronic transmission or storage is 100% secure, and we cannot guarantee
                absolute security.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">9. Data Retention</h2>
              <p>
                We retain your personal data for as long as your account is active or as needed to
                provide the Service. If you delete your account, we will delete your personal data
                within 30 days, except where retention is required by law or for legitimate business
                purposes (such as resolving disputes or enforcing agreements).
              </p>
            </section>

            {/* GDPR */}
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">10. Your Rights (GDPR and CCPA)</h2>
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
              <h2 className="font-display text-[1.6rem] mb-4">11. International Data Transfers</h2>
              <p>
                Your data may be processed in countries outside your jurisdiction, including the United States.
                We ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs)
                for transfers from the European Economic Area.
              </p>
            </section>

            {/* Children */}
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">12. Children&apos;s Privacy</h2>
              <p>
                ApplyMaster is not intended for users under the age of 16. We do not knowingly collect
                personal data from children. If you believe a child has provided us with personal data,
                please contact us and we will delete it promptly.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">13. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material
                changes by posting the new policy on this page and updating the &ldquo;Last updated&rdquo;
                date. We encourage you to review this page periodically.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="font-display text-[1.6rem] mb-4">14. Contact Us</h2>
              <p>If you have questions or concerns about this Privacy Policy, contact us at:</p>
              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
                <p><strong>ApplyMaster</strong></p>
                <p className="mt-1">Email: privacy@applymaster.ai</p>
                <p className="mt-1">Data Protection Officer: dpo@applymaster.ai</p>
              </div>
            </section>
          </div>

          {/* Footer links */}
          <div className="mt-16 pt-8 border-t border-[var(--border)] flex flex-wrap gap-6 text-sm">
            <Link href="/terms" className="text-[var(--accent)] hover:text-[var(--accent)]">Terms of Service</Link>
            <Link href="/features" className="text-[var(--accent)] hover:text-[var(--accent)]">Features</Link>
            <Link href="/pricing" className="text-[var(--accent)] hover:text-[var(--accent)]">Pricing</Link>
            <Link href="/signup" className="text-[var(--accent)] hover:text-[var(--accent)]">Sign Up</Link>
          </div>
        </div>
      </main>
    </>
  );
}
