import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | StampLedger',
  description: 'How StampLedger collects, uses, and protects your data.',
}

export default function Privacy() {
  return (
    <div>
      <section className="bg-gradient-to-b from-primary-50 to-white section-padding">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-primary mb-4">Privacy Policy</h1>
            <p className="text-gray-500 text-sm">Last updated: January 31, 2026</p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto space-y-8 text-gray-700">

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">What We Collect</h2>
              <p className="mb-3">
                When you sign up for our beta waitlist, we collect your email address,
                organization name (optional), and role (optional). When using the
                StampLedger platform, we collect data necessary to create and verify
                PE stamps — document hashes, digital signatures, and professional
                license information. We never store full document contents on our
                servers. Only cryptographic hashes are recorded.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">How We Use It</h2>
              <p>
                We use collected data to send launch updates, communicate about the
                beta program, improve the product based on feedback, and provide the
                stamp verification service. We do not sell your data or share it with
                third parties except as required to operate the service (e.g., Resend
                for email delivery).
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">Data Storage & Security</h2>
              <p>
                Waitlist signups are stored via Resend, a GDPR-compliant email
                service. PE stamp records are stored on a permissioned blockchain —
                this data is immutable by design and contains no personally
                identifiable information beyond what is necessary for professional
                verification. All data in transit is protected by TLS 1.3. Data at
                rest is encrypted with AES-256.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">Your Rights</h2>
              <p className="mb-3">
                You can request a copy of your data, request removal from our
                waitlist, or unsubscribe via the link in any email we send. Note:
                blockchain records are immutable and cannot be deleted, but they
                contain no PII. To exercise these rights, email{' '}
                <a href="mailto:privacy@stampledger.com" className="text-secondary hover:underline">
                  privacy@stampledger.com
                </a>.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">Cookies</h2>
              <p>
                We use minimal cookies for analytics only. No tracking cookies or
                third-party ad networks. You can disable cookies in your browser
                without affecting site functionality.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">Changes</h2>
              <p>
                If we update this policy, we'll notify waitlist subscribers via email.
                The date at the top of this page reflects the most recent version.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">Contact</h2>
              <p>
                Questions?{' '}
                <a href="mailto:privacy@stampledger.com" className="text-secondary hover:underline">
                  privacy@stampledger.com
                </a>
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
