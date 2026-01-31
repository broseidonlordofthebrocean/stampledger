import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import EmailCapture from '@/components/EmailCapture'
import { Zap, Target, Users, ArrowRight, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About | StampLedger - Our Mission',
  description: 'StampLedger was founded to modernize PE stamp verification and protect public safety. Learn about our mission and the team behind the technology.',
}

export default function About() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white section-padding">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-6">
              Modernizing Professional Engineering for the Digital Age
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              StampLedger was founded on a simple belief: verifying a PE stamp should take
              seconds, not days. We're building the infrastructure to make that happen.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Our Mission</h3>
              <p className="text-gray-600">
                To eliminate PE stamp fraud and modernize verification for the built environment
                industry, protecting public safety while saving time and money.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Our Vision</h3>
              <p className="text-gray-600">
                A world where every PE stamp is instantly verifiable, every municipality has
                access to fraud-proof verification, and engineers' credentials are protected.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Our Values</h3>
              <p className="text-gray-600">
                Transparency, security, and simplicity. We build technology that's
                powerful under the hood but simple to use for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-primary mb-6 text-center">Our Story</h2>
            <div className="prose prose-lg max-w-none">
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <p className="text-gray-600 mb-4">
                  StampLedger started with a frustration. As an electrical engineer in Wisconsin,
                  I saw how broken the PE stamp verification system was. Municipalities spent
                  days calling state boards. Fake stamps slipped through. Engineers had no way
                  to prove they had insurance when they stamped a document.
                </p>
                <p className="text-gray-600 mb-4">
                  The 2023 case of a California contractor who used fake PE stamps on 200+
                  buildings was the final straw. Those stamps passed visual inspection because
                  there was no efficient way to verify them. People's lives were put at risk.
                </p>
                <p className="text-gray-600 mb-4">
                  I realized blockchain technology could solve this. Not cryptocurrency or
                  speculation—just the core technology of immutable, distributed records.
                  Combined with real-time license verification and insurance checks, we could
                  create a stamp that's truly unforgeable.
                </p>
                <p className="text-gray-600">
                  That's StampLedger: a tool that protects public safety by making PE stamp
                  fraud impossible, while saving municipalities time and money. We're starting
                  in Wisconsin and expanding from there.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-padding">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-primary mb-12 text-center">The Team</h2>
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary">WA</span>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-1">Waffle Anderson</h3>
              <p className="text-secondary font-medium mb-3">Founder & CEO</p>
              <p className="text-gray-600 mb-4">
                Electrical engineer based in the Fox Cities, Wisconsin. Passionate about
                using technology to solve real problems in the built environment industry.
              </p>
              <a
                href="mailto:hello@stampledger.com"
                className="inline-flex items-center gap-2 text-secondary hover:text-secondary-dark transition-colors"
              >
                <Mail className="w-4 h-4" />
                hello@stampledger.com
              </a>
            </div>
          </div>
          <p className="text-center text-gray-500 mt-8">
            We're a small team with big ambitions. Interested in joining us?{' '}
            <a href="mailto:hello@stampledger.com" className="text-secondary hover:underline">
              Get in touch.
            </a>
          </p>
        </div>
      </section>

      {/* Why Wisconsin Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-primary mb-6">Why Wisconsin?</h2>
            <p className="text-xl text-gray-600 mb-8">
              We're starting in Wisconsin because it's home. We know the municipalities,
              understand the regulations, and have relationships with local PEs. It's the
              perfect place to prove our technology works before expanding nationally.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-3xl font-bold text-primary mb-1">3</div>
                <div className="text-gray-600">Target pilot cities</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-3xl font-bold text-primary mb-1">20+</div>
                <div className="text-gray-600">PEs interested in beta</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-3xl font-bold text-primary mb-1">Q2</div>
                <div className="text-gray-600">2026 launch target</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Join Us in Modernizing PE Stamps
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Whether you're a municipality interested in piloting, a PE who wants early
                access, or someone who believes in our mission—we'd love to hear from you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/for-municipalities">
                  <Button variant="outline">
                    For Municipalities
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/for-engineers">
                  <Button variant="outline">
                    For Engineers
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            <div>
              <EmailCapture
                title="Stay Updated"
                description="Sign up to receive updates on our progress and launch timeline."
                ctaText="Subscribe"
                showOrgField={false}
                showRoleField={false}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
