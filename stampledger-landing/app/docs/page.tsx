import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Mail, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Documentation | StampLedger',
  description: 'StampLedger developer documentation and integration guides.',
}

export default function Docs() {
  return (
    <div>
      <section className="bg-gradient-to-b from-primary-50 to-white section-padding">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-primary mb-4">Documentation</h1>
            <p className="text-xl text-gray-600">
              Developer guides, API references, and integration tutorials.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-3">Documentation Coming Soon</h2>
              <p className="text-gray-600 mb-6">
                Full developer documentation will be available at launch. In the
                meantime, we're happy to answer technical questions directly.
              </p>
              <Link
                href="mailto:developers@stampledger.com"
                className="inline-flex items-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-lg hover:bg-secondary-dark font-medium"
              >
                <Mail className="w-4 h-4" />
                Email Us a Question
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
