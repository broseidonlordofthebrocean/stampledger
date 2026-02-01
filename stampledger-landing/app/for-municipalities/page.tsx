import Link from 'next/link'
import type { Metadata } from 'next'
import EmailCapture from '@/components/EmailCapture'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Shield,
  DollarSign,
  Smartphone,
  BarChart3,
  RefreshCw,
  CheckCircle,
  ArrowRight,
  Building2,
  AlertTriangle,
  FileCheck,
  Server,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'For Municipalities | StampLedger - PE Stamp Verification',
  description: 'Modernize PE stamp verification for your building department. Save time, reduce fraud, protect your municipality with blockchain-secured verification.',
}

export default function ForMunicipalities() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white section-padding">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              For Building Departments & City IT
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-6">
              Modernize PE Stamp Verification
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Save time, reduce fraud, and protect your municipality. StampLedger gives
              building inspectors instant verification while creating permanent audit trails.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#contact">
                <Button size="lg">
                  Schedule Demo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="secondary" size="lg">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              The Challenges You Face
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Building departments across the country struggle with outdated verification processes
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-red-50 border border-red-100 rounded-xl p-6">
              <Clock className="w-10 h-10 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">Manual Verification Wastes Time</h3>
              <p className="text-gray-600 mb-4">
                Your staff spends hours calling state boards, waiting on hold, and filing paperwork
                just to verify a single PE stamp.
              </p>
              <div className="bg-white rounded-lg p-4 border border-red-100">
                <div className="text-2xl font-bold text-red-600">2-3 Days</div>
                <div className="text-sm text-gray-600">Average verification time today</div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6">
              <AlertTriangle className="w-10 h-10 text-yellow-600 mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">Fraud Creates Liability</h3>
              <p className="text-gray-600 mb-4">
                Fake PE stamps are sold online for under $50. If a fraudulent stamp slips through,
                your municipality faces significant legal exposure.
              </p>
              <div className="bg-white rounded-lg p-4 border border-yellow-100">
                <div className="text-2xl font-bold text-yellow-600">$500K+</div>
                <div className="text-sm text-gray-600">Typical liability from fraud cases</div>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
              <DollarSign className="w-10 h-10 text-orange-600 mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">Verification Costs Add Up</h3>
              <p className="text-gray-600 mb-4">
                Staff time for phone calls, research, and documentation can cost $500-2,000
                per stamp verification.
              </p>
              <div className="bg-white rounded-lg p-4 border border-orange-100">
                <div className="text-2xl font-bold text-orange-600">$1,000</div>
                <div className="text-sm text-gray-600">Average cost per verification</div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
              <FileCheck className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">No Audit Trail</h3>
              <p className="text-gray-600 mb-4">
                Paper records get lost. There's no easy way to prove what was verified, when,
                or whether the PE had insurance at stamping time.
              </p>
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="text-2xl font-bold text-blue-600">0%</div>
                <div className="text-sm text-gray-600">Insurance verification rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              How StampLedger Helps Your Municipality
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Purpose-built for government building departments
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">3-Second Verification</h3>
              <p className="text-gray-600 mb-4">
                Scan QR code or search by permit number. Get instant Valid/Invalid result with
                full PE details.
              </p>
              <div className="text-accent font-semibold">vs. 2-3 days today</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Mobile Inspector App</h3>
              <p className="text-gray-600 mb-4">
                iOS and Android apps let inspectors verify stamps in the field. Works offline
                with cached data.
              </p>
              <div className="text-accent font-semibold">No office trip required</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Dashboard Analytics</h3>
              <p className="text-gray-600 mb-4">
                Track all PE stamps in your jurisdiction. See trends, flag anomalies,
                generate compliance reports.
              </p>
              <div className="text-accent font-semibold">Full oversight & reporting</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Real-Time License Checks</h3>
              <p className="text-gray-600 mb-4">
                Automatic verification with state licensing boards. Catch expired or revoked
                licenses immediately.
              </p>
              <div className="text-accent font-semibold">Always up-to-date</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <Server className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">API Integration</h3>
              <p className="text-gray-600 mb-4">
                REST API integrates with permit software (Accela, CityView, Tyler).
                No workflow disruption.
              </p>
              <div className="text-accent font-semibold">Works with existing systems</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Liability Protection</h3>
              <p className="text-gray-600 mb-4">
                Blockchain-secured audit trail provides court-admissible proof of
                verification for legal protection.
              </p>
              <div className="text-accent font-semibold">Reduced legal exposure</div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-white">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  The ROI of Modern Verification
                </h2>
                <p className="text-primary-100 text-lg mb-6">
                  StampLedger pays for itself in reduced staff time, faster permit approvals,
                  and eliminated fraud risk.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                    <span>Save 10+ hours/week on stamp verification</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                    <span>Catch fake stamps before permits are issued</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                    <span>Faster permit approvals = happier residents</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                    <span>Court-admissible records reduce liability</span>
                  </li>
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 rounded-xl p-6 text-center backdrop-blur-sm">
                  <div className="text-4xl font-bold text-accent mb-2">40%</div>
                  <div className="text-primary-100">Faster Permits</div>
                </div>
                <div className="bg-white/10 rounded-xl p-6 text-center backdrop-blur-sm">
                  <div className="text-4xl font-bold text-accent mb-2">100%</div>
                  <div className="text-primary-100">Fraud Prevention</div>
                </div>
                <div className="bg-white/10 rounded-xl p-6 text-center backdrop-blur-sm">
                  <div className="text-4xl font-bold text-accent mb-2">$25K+</div>
                  <div className="text-primary-100">Annual Savings</div>
                </div>
                <div className="bg-white/10 rounded-xl p-6 text-center backdrop-blur-sm">
                  <div className="text-4xl font-bold text-accent mb-2">24/7</div>
                  <div className="text-primary-100">Availability</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pilot Program CTA */}
      <section className="section-padding bg-gray-50" id="contact">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Free 12-Month Pilot Program
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                We're offering 3 Wisconsin municipalities a free pilot program to
                test StampLedger in their building departments.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>Free for 12 months (no cost, no catch)</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>Full training for inspectors and staff</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>Mobile app for field verification</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>Dedicated email and phone support</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>Cancel anytime with no obligation</span>
                </li>
              </ul>
            </div>
            <div>
              <EmailCapture
                title="Request a Demo"
                description="Schedule a 15-minute demo with our team. We'll show you how StampLedger works for your building department."
                ctaText="Schedule Demo"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
