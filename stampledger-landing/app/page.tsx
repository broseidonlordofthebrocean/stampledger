import Link from 'next/link'
import EmailCapture from '@/components/EmailCapture'
import { Button } from '@/components/ui/button'
import {
  Clock,
  AlertTriangle,
  FileX,
  Upload,
  Database,
  CheckCircle,
  Shield,
  Zap,
  Lock,
  Users,
  Smartphone,
  TrendingDown,
  ArrowRight,
  Globe,
  FileText,
  QrCode,
  Puzzle,
} from 'lucide-react'

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-cta/10 text-cta-dark px-4 py-2 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-cta rounded-full animate-pulse"></span>
                Limited spots: Now accepting beta applications
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight mb-6">
                Instantly Verify Professional Engineer Stamps
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                StampLedger is the secure digital ledger that municipalities use to verify
                PE stamps in seconds, not days. Blockchain-secured, fraud-proof, and
                court-admissible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="#signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Request Demo
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    How It Works
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-8 mt-8 pt-8 border-t border-gray-200">
                <div>
                  <div className="text-3xl font-bold text-primary">3 sec</div>
                  <div className="text-sm text-gray-600">Verification time</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">100%</div>
                  <div className="text-sm text-gray-600">Fraud prevention</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-gray-600">Availability</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                <div className="bg-primary rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between text-white mb-3">
                    <span className="font-semibold">Verification Result</span>
                    <CheckCircle className="w-6 h-6 text-accent" />
                  </div>
                  <div className="bg-accent/20 rounded-lg p-3">
                    <span className="text-accent font-bold text-lg">VALID STAMP</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">PE Name</span>
                    <span className="font-medium">John Smith, PE</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">License #</span>
                    <span className="font-medium">WI-12345</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Status</span>
                    <span className="text-accent font-medium">Active</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Insurance</span>
                    <span className="text-accent font-medium">Verified</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Blockchain</span>
                    <span className="font-mono text-sm text-secondary">0x1a2b...3c4d</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-accent text-white px-4 py-2 rounded-lg shadow-lg">
                Verified in 2.3 seconds
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              The PE Stamp Verification Problem
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Current verification methods are slow, expensive, and fraud-prone.
              Municipalities and engineers deserve better.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Slow Verification</h3>
              <p className="text-gray-600">
                Building inspectors wait 2-3 days to verify PE stamps by calling state boards.
                Projects stall while paperwork sits on desks.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Fraud Risk</h3>
              <p className="text-gray-600">
                Fake PE stamps are easily available online. Recent case: a contractor used
                fake stamps for 200+ buildings in California.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <FileX className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Manual Process</h3>
              <p className="text-gray-600">
                Paper-based verification is error-prone. No way to verify if a PE had
                insurance at the time of stamping.
              </p>
            </div>
          </div>
          <div className="mt-12 bg-red-50 border border-red-100 rounded-xl p-6 text-center">
            <p className="text-red-800 font-medium">
              <strong>The Cost:</strong> Municipalities spend $500-2,000 per stamp verification
              in staff time. Fraud cases cost millions in liability.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              How StampLedger Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to fraud-proof PE stamp verification
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="relative">
                <div className="w-20 h-20 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-10 h-10 text-secondary" />
                </div>
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center font-bold text-sm">
                  01
                </div>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">PE Creates Digital Stamp</h3>
              <p className="text-gray-600">
                Engineer uploads drawing, signs digitally with their private key,
                creates immutable blockchain record.
              </p>
            </div>
            <div className="text-center">
              <div className="relative">
                <div className="w-20 h-20 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Database className="w-10 h-10 text-secondary" />
                </div>
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center font-bold text-sm">
                  02
                </div>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Recorded on Blockchain</h3>
              <p className="text-gray-600">
                Permanent record created with timestamp, license verification,
                and insurance check. Cannot be altered or backdated.
              </p>
            </div>
            <div className="text-center">
              <div className="relative">
                <div className="w-20 h-20 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-secondary" />
                </div>
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center font-bold text-sm">
                  03
                </div>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Instant Verification</h3>
              <p className="text-gray-600">
                Inspector scans QR code or searches database. Valid/invalid
                result in under 3 seconds. Done.
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href="/how-it-works">
              <Button variant="secondary" size="lg">
                Learn More About the Technology
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-primary text-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Government
            </h2>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Enterprise-grade security and compliance that municipal IT teams trust
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <Shield className="w-10 h-10 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">Blockchain Security</h3>
              <p className="text-primary-100">
                Immutable records on a permissioned blockchain. Municipalities run
                validator nodes. No single point of failure.
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <Zap className="w-10 h-10 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">Instant Verification</h3>
              <p className="text-primary-100">
                3-second verification vs 2-3 day wait time. Inspectors verify
                stamps on-site with their smartphone.
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <Lock className="w-10 h-10 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">Compliance Ready</h3>
              <p className="text-primary-100">
                Designed for SOC 2 compliance. GDPR compliant. Built to meet
                government contracts and procurement requirements.
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <Users className="w-10 h-10 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">Multi-Jurisdiction</h3>
              <p className="text-primary-100">
                Works across city, county, and state boundaries. One stamp,
                verified anywhere in the network.
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <Puzzle className="w-10 h-10 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">Desktop Extensions</h3>
              <p className="text-primary-100">
                Browser and Adobe Acrobat extensions for instant verification
                without leaving your current workflow.
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <TrendingDown className="w-10 h-10 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">Reduce Liability</h3>
              <p className="text-primary-100">
                Blockchain proof protects municipalities from lawsuits.
                Court-admissible verification records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations & Extensions Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Works Where You Work
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Verify stamps directly from your browser, Adobe Acrobat, or any device with a camera
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Browser Extension</h3>
              <p className="text-gray-600 mb-4">
                Chrome and Edge extension for instant stamp verification.
                Right-click any StampLedger link to verify, or check document integrity by hash.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full font-medium">Chrome</span>
                <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full font-medium">Edge</span>
                <span className="text-xs bg-accent/10 text-accent-dark px-2 py-1 rounded-full font-medium">Available Now</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Adobe Acrobat</h3>
              <p className="text-gray-600 mb-4">
                Verify stamps and check document integrity directly inside Adobe Acrobat.
                One-click verification from the menu bar while reviewing PDFs.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full font-medium">Acrobat Pro</span>
                <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full font-medium">Reader</span>
                <span className="text-xs bg-accent/10 text-accent-dark px-2 py-1 rounded-full font-medium">Available Now</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">QR Verification</h3>
              <p className="text-gray-600 mb-4">
                Every stamped document includes a QR code. Scan with any smartphone camera
                for instant verification — no app required.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full font-medium">iOS</span>
                <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full font-medium">Android</span>
                <span className="text-xs bg-accent/10 text-accent-dark px-2 py-1 rounded-full font-medium">No App Needed</span>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/integrations">
              <Button variant="secondary" size="lg">
                View All Integrations
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding" id="demo">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Ready to Modernize PE Stamp Verification?
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Join Wisconsin municipalities piloting StampLedger in 2026.
                Free pilot program available for qualified jurisdictions.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>Free 12-month pilot for early adopters</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>Full training and onboarding included</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>Dedicated support from day one</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>No credit card required to start</span>
                </li>
              </ul>
              <div className="flex items-center gap-4">
                <Link href="/for-municipalities">
                  <Button variant="outline">For Municipalities</Button>
                </Link>
                <Link href="/for-engineers">
                  <Button variant="outline">For Engineers</Button>
                </Link>
              </div>
            </div>
            <div>
              <EmailCapture />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="section-padding">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-bold text-primary mb-8">
            Trusted Technology
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <div className="flex items-center gap-2 text-gray-500">
              <Shield className="w-6 h-6" />
              <span className="font-medium">256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Lock className="w-6 h-6" />
              <span className="font-medium">SOC 2 Ready</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Database className="w-6 h-6" />
              <span className="font-medium">Blockchain Secured</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <CheckCircle className="w-6 h-6" />
              <span className="font-medium">High Availability</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
