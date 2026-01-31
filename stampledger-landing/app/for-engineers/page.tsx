import Link from 'next/link'
import type { Metadata } from 'next'
import EmailCapture from '@/components/EmailCapture'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Shield,
  Award,
  FileText,
  Upload,
  Edit3,
  Download,
  Send,
  CheckCircle,
  ArrowRight,
  Zap,
  Lock,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'For Professional Engineers | StampLedger - Digital PE Stamps',
  description: 'Create blockchain-verified PE stamps in seconds. Protect your professional reputation with unforgeable digital stamps that municipalities verify instantly.',
}

export default function ForEngineers() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white section-padding">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-dark px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Award className="w-4 h-4" />
              For Professional Engineers
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-6">
              Digital PE Stamps in Seconds
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Create blockchain-verified stamps that municipalities accept instantly.
              Protect your professional reputation with unforgeable digital credentials.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#signup">
                <Button size="lg">
                  Try Free (10 stamps/month)
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="secondary" size="lg">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Why PEs Choose StampLedger
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Modernize your stamping process while protecting your professional reputation
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Faster Approvals</h3>
              <p className="text-gray-600">
                Municipalities verify your stamps instantly, speeding up the permit approval
                process for your clients.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Reduced Liability</h3>
              <p className="text-gray-600">
                Blockchain proof of what you stamped and when protects you against disputes
                and unauthorized use.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Professional Image</h3>
              <p className="text-gray-600">
                QR code verification looks modern and trustworthy. Shows clients you use
                cutting-edge technology.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Audit Trail</h3>
              <p className="text-gray-600">
                Complete history of all stamps for insurance claims, legal defense, and
                professional records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Create a Stamp in 4 Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The entire process takes under 60 seconds
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Upload className="w-5 h-5 text-secondary" />
                      <h3 className="text-lg font-semibold text-primary">Upload Your Drawing</h3>
                    </div>
                    <p className="text-gray-600">
                      Upload your PDF or DWG file. We support all standard engineering document formats.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Edit3 className="w-5 h-5 text-secondary" />
                      <h3 className="text-lg font-semibold text-primary">Enter Project Details</h3>
                    </div>
                    <p className="text-gray-600">
                      Add project address, permit number, and any notes. Takes about 15 seconds.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-5 h-5 text-secondary" />
                      <h3 className="text-lg font-semibold text-primary">Review and Sign</h3>
                    </div>
                    <p className="text-gray-600">
                      Review the stamp preview and confirm with your digital signature. Recorded on blockchain.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="w-5 h-5 text-secondary" />
                      <h3 className="text-lg font-semibold text-primary">Download Stamped PDF</h3>
                    </div>
                    <p className="text-gray-600">
                      Get your PDF with QR code overlay. Ready to submit to any municipality.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-dark px-6 py-3 rounded-full">
                <Zap className="w-5 h-5" />
                <span className="font-semibold">Average time: 47 seconds from upload to download</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Protection Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-white">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Protect Your Professional Reputation
                </h2>
                <p className="text-primary-100 text-lg mb-6">
                  Your PE stamp represents years of education, experience, and professional
                  responsibility. StampLedger ensures it can never be forged or misused.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Unforgeable</span>
                      <p className="text-primary-100 text-sm">
                        Cryptographic signatures ensure only you can create stamps with your license
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Timestamped</span>
                      <p className="text-primary-100 text-sm">
                        Blockchain proves exactly when you stamped each document
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Insurance Verified</span>
                      <p className="text-primary-100 text-sm">
                        Records prove you had active coverage at the time of stamping
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Revocable</span>
                      <p className="text-primary-100 text-sm">
                        If a project changes, you can revoke a stamp with documented reason
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4">The Problem with Physical Stamps</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-300 text-sm">✕</span>
                    </div>
                    <p className="text-primary-100">
                      Physical stamps can be photographed and reproduced
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-300 text-sm">✕</span>
                    </div>
                    <p className="text-primary-100">
                      No proof you had insurance when you stamped
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-300 text-sm">✕</span>
                    </div>
                    <p className="text-primary-100">
                      Documents can be altered after stamping
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-300 text-sm">✕</span>
                    </div>
                    <p className="text-primary-100">
                      No easy way to track all stamps you've issued
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start free, upgrade when you need more
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-primary mb-2">Free</h3>
              <div className="text-4xl font-bold text-primary mb-4">
                $0<span className="text-lg font-normal text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  10 stamps per month
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  All verification features
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  Email support
                </li>
              </ul>
              <Link href="#signup">
                <Button variant="outline" className="w-full">Start Free</Button>
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-secondary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white text-sm font-semibold px-4 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Pro</h3>
              <div className="text-4xl font-bold text-primary mb-4">
                $99<span className="text-lg font-normal text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  Unlimited stamps
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  Priority verification
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  Phone support
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  API access
                </li>
              </ul>
              <Link href="#signup">
                <Button className="w-full">Start Trial</Button>
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-primary mb-2">Firm</h3>
              <div className="text-4xl font-bold text-primary mb-4">
                $499<span className="text-lg font-normal text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  10+ engineer accounts
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  Team management
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  Dedicated support
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  White-label PDFs
                </li>
              </ul>
              <Link href="#signup">
                <Button variant="outline" className="w-full">Contact Sales</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding" id="signup">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Join the Early Access Program
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Be among the first PEs to use blockchain-verified stamps.
                Early adopters get free lifetime access to the basic tier.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>Free forever (10 stamps/month) for early adopters</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>Your feedback shapes the product</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>Priority access to new features</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>Direct line to the founder</span>
                </li>
              </ul>
            </div>
            <div>
              <EmailCapture
                title="Get Early Access"
                description="We're launching in Q2 2026. Sign up to be notified when we open beta access for PEs."
                ctaText="Join Waitlist"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
