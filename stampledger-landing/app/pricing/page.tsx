import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { CheckCircle, Building2, HardHat, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing | StampLedger - PE Stamp Verification',
  description: 'Simple, transparent pricing for municipalities and professional engineers. Free tier available for PEs, tiered pricing for municipalities.',
}

export default function Pricing() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white section-padding">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your needs. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* PE Pricing Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <HardHat className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary">For Professional Engineers</h2>
              <p className="text-gray-600">Create blockchain-verified stamps</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl">
            {/* Free Tier */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-primary mb-2">Free</h3>
              <p className="text-gray-600 mb-4">Perfect for trying out StampLedger</p>
              <div className="text-4xl font-bold text-primary mb-6">
                $0<span className="text-lg font-normal text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>10 stamps per month</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>All verification features</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>QR code on stamped PDFs</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Email support</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Community access</span>
                </li>
              </ul>
              <Link href="#signup">
                <Button variant="outline" className="w-full">
                  Start Free
                </Button>
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-secondary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white text-sm font-semibold px-4 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Pro</h3>
              <p className="text-gray-600 mb-4">For active professional engineers</p>
              <div className="text-4xl font-bold text-primary mb-6">
                $99<span className="text-lg font-normal text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span><strong>Unlimited stamps</strong></span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Priority verification</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Phone support</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Analytics dashboard</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>API access</span>
                </li>
              </ul>
              <Link href="#signup">
                <Button className="w-full">
                  Start 14-Day Trial
                </Button>
              </Link>
            </div>

            {/* Firm Tier */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-primary mb-2">Firm</h3>
              <p className="text-gray-600 mb-4">For engineering firms and teams</p>
              <div className="text-4xl font-bold text-primary mb-6">
                $499<span className="text-lg font-normal text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span><strong>10+ engineer accounts</strong></span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Team management</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Dedicated support</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>White-label PDFs</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Custom integrations</span>
                </li>
              </ul>
              <Link href="mailto:hello@stampledger.com">
                <Button variant="outline" className="w-full">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Municipality Pricing Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary">For Municipalities</h2>
              <p className="text-gray-600">Unlimited verifications included</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tier 1 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-sm text-secondary font-semibold mb-2">Tier 1</div>
              <h3 className="text-lg font-semibold text-primary mb-1">Small Cities</h3>
              <p className="text-sm text-gray-600 mb-4">Under 10,000 population</p>
              <div className="text-3xl font-bold text-primary mb-4">
                $2,500<span className="text-sm font-normal text-gray-600">/year</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Unlimited verifications</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Mobile inspector app</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Basic support</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Dashboard access</span>
                </li>
              </ul>
              <Link href="mailto:hello@stampledger.com">
                <Button variant="outline" size="sm" className="w-full">
                  Contact Sales
                </Button>
              </Link>
            </div>

            {/* Tier 2 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-sm text-secondary font-semibold mb-2">Tier 2</div>
              <h3 className="text-lg font-semibold text-primary mb-1">Medium Cities</h3>
              <p className="text-sm text-gray-600 mb-4">10,000 - 50,000 population</p>
              <div className="text-3xl font-bold text-primary mb-4">
                $7,500<span className="text-sm font-normal text-gray-600">/year</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Everything in Tier 1</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>API access</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Custom integrations</span>
                </li>
              </ul>
              <Link href="mailto:hello@stampledger.com">
                <Button variant="outline" size="sm" className="w-full">
                  Contact Sales
                </Button>
              </Link>
            </div>

            {/* Tier 3 */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-secondary relative">
              <div className="absolute -top-2 right-4 bg-accent text-white text-xs font-semibold px-2 py-0.5 rounded">
                Popular
              </div>
              <div className="text-sm text-secondary font-semibold mb-2">Tier 3</div>
              <h3 className="text-lg font-semibold text-primary mb-1">Large Cities</h3>
              <p className="text-sm text-gray-600 mb-4">50,000 - 200,000 population</p>
              <div className="text-3xl font-bold text-primary mb-4">
                $15,000<span className="text-sm font-normal text-gray-600">/year</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Everything in Tier 2</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Blockchain validator node</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Dedicated account manager</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Training sessions</span>
                </li>
              </ul>
              <Link href="mailto:hello@stampledger.com">
                <Button size="sm" className="w-full">
                  Contact Sales
                </Button>
              </Link>
            </div>

            {/* Tier 4 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-sm text-secondary font-semibold mb-2">Tier 4</div>
              <h3 className="text-lg font-semibold text-primary mb-1">Metro Areas</h3>
              <p className="text-sm text-gray-600 mb-4">200,000+ population</p>
              <div className="text-3xl font-bold text-primary mb-4">
                $25,000<span className="text-sm font-normal text-gray-600">/year</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Everything in Tier 3</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>White-label option</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>SLA guarantee</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>On-premise deployment</span>
                </li>
              </ul>
              <Link href="mailto:hello@stampledger.com">
                <Button variant="outline" size="sm" className="w-full">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 bg-accent/10 border border-accent/30 rounded-xl p-6 text-center">
            <p className="text-accent-dark font-semibold">
              Free 12-month pilot program available for Wisconsin municipalities in 2026.
            </p>
            <Link href="/for-municipalities#contact">
              <Button variant="link" className="text-accent-dark mt-2">
                Learn about the pilot program
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-primary text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-primary mb-2">
                Is StampLedger legally valid for PE stamps?
              </h3>
              <p className="text-gray-600">
                Yes. Under the federal ESIGN Act and state UETA laws, electronic signatures
                (including blockchain-verified ones) are legally binding. We're working with
                state licensing boards to ensure compliance.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-primary mb-2">
                What if my license expires?
              </h3>
              <p className="text-gray-600">
                All stamps are automatically flagged when your license status changes.
                Municipalities see this instantly during verification. You cannot create
                new stamps with an expired license.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-primary mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes, all plans are month-to-month (PE) or annual (municipalities) with no
                long-term contracts. Your stamps remain on the blockchain forever, even
                if you cancel.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-primary mb-2">
                What if StampLedger shuts down?
              </h3>
              <p className="text-gray-600">
                Stamps are stored on a decentralized blockchain run by multiple municipalities.
                Even if our company disappeared, stamps remain verifiable as long as any
                validator node is running.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-primary mb-2">
                Do you offer discounts for annual payment?
              </h3>
              <p className="text-gray-600">
                Yes! PE plans paid annually receive 2 months free (pay for 10, get 12).
                Municipal plans are annual by default with the option for multi-year discounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary" id="signup">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join the beta program and be among the first to use blockchain-verified PE stamps.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/for-engineers#signup">
              <Button variant="accent" size="lg">
                I'm a PE Engineer
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/for-municipalities#contact">
              <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-gray-100">
                I'm from a Municipality
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
