import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | StampLedger',
  description: 'StampLedger terms of service and usage agreement.',
}

export default function Terms() {
  return (
    <div>
      <section className="bg-gradient-to-b from-primary-50 to-white section-padding">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-primary mb-4">Terms of Service</h1>
            <p className="text-gray-500 text-sm">Last updated: January 31, 2026</p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto space-y-8 text-gray-700">

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">1. Acceptance</h2>
              <p>
                By using StampLedger or signing up for our waitlist, you agree to
                these terms. If you don't agree, don't use the service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">2. What We Provide</h2>
              <p>
                A blockchain-based platform for creating and verifying professional
                engineer stamps, including digital stamp creation for licensed PEs,
                instant verification for municipalities, document storage, version
                tracking, and QR code generation.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">3. Your Responsibilities</h2>
              <p>
                You must hold a valid, active PE license in the relevant jurisdiction
                to create stamps. You are responsible for the accuracy of all
                documents you stamp. You must not use StampLedger to create stamps
                for documents you have not personally reviewed. You must not attempt
                to forge another PE's credentials. You must maintain the security of
                your account and private keys.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">4. Intellectual Property</h2>
              <p>
                StampLedger and all associated logos and marks are our intellectual
                property. Documents you upload remain yours. Blockchain records are
                public and immutable.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">5. Limitation of Liability</h2>
              <p>
                StampLedger is a verification tool, not a substitute for legal advice
                or engineering review. Professional responsibility remains with the
                licensed engineer. To the extent permitted by law, we are not liable
                for indirect, incidental, or consequential damages.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">6. Termination</h2>
              <p>
                We may suspend your account for terms violations. You may cancel
                anytime. Blockchain records created during your use are permanent.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">7. Governing Law</h2>
              <p>
                These terms are governed by Wisconsin law. Disputes resolved in
                Wisconsin courts.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">8. Contact</h2>
              <p>
                Questions?{' '}
                <a href="mailto:legal@stampledger.com" className="text-secondary hover:underline">
                  legal@stampledger.com
                </a>
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
