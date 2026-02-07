import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import {
  Globe,
  FileText,
  QrCode,
  CheckCircle,
  ArrowRight,
  Shield,
  Smartphone,
  Download,
  Monitor,
  Server,
  Puzzle,
  Wrench,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Integrations & Extensions | StampLedger',
  description: 'Verify PE stamps from your browser, Adobe Acrobat, Bluebeam, or any smartphone. StampLedger integrations bring verification to your existing workflow.',
}

export default function Integrations() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white section-padding">
        <div className="container-custom text-center">
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Puzzle className="w-4 h-4" />
            Integrations & Extensions
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-6">
            Verify Stamps Wherever You Work
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Browser extensions, desktop integrations, and QR verification bring
            StampLedger directly into your existing workflow. No context switching.
          </p>
        </div>
      </section>

      {/* Browser Extension */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-dark px-3 py-1 rounded-full text-sm font-medium mb-4">
                Available Now
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Browser Extension
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Verify PE stamps and check document integrity without leaving your browser.
                Works with Chrome, Edge, and other Chromium-based browsers.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-primary">Instant Stamp Lookup</span>
                    <p className="text-gray-600 text-sm">Enter any stamp ID to see full verification details, PE info, and license status</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-primary">Document Integrity Check</span>
                    <p className="text-gray-600 text-sm">Upload a PDF to verify it hasn't been altered since it was stamped</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-primary">Right-Click Verification</span>
                    <p className="text-gray-600 text-sm">Right-click any StampLedger verification link to verify inline</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-primary">Auto-Detection</span>
                    <p className="text-gray-600 text-sm">Automatically detects and highlights StampLedger verification links on any page</p>
                  </div>
                </li>
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link href="https://portal.stampledger.com/integrations" target="_blank">
                  <Button size="lg">
                    <Download className="w-5 h-5 mr-2" />
                    Install Extension
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="bg-gray-100 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 bg-white rounded-md px-3 py-1 text-sm text-gray-500">
                    portal.stampledger.com
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-primary">StampLedger</div>
                    <div className="text-xs text-gray-500">Extension Popup</div>
                  </div>
                </div>
                <div className="bg-accent/10 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <span className="font-semibold text-accent-dark">STAMP VERIFIED</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">PE Name</span>
                    <span className="font-medium">Alex Thompson, PE</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">License</span>
                    <span className="font-medium">PE #98452 (TX)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Status</span>
                    <span className="text-accent font-medium">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Adobe Acrobat Extension */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="bg-[#2D2D2D] rounded-t-lg px-4 py-2 flex items-center gap-2">
                  <span className="text-white text-sm font-medium">Adobe Acrobat</span>
                  <span className="text-gray-400 text-sm">- Engineering_Plans.pdf</span>
                </div>
                <div className="border border-gray-200 border-t-0 rounded-b-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 bg-gray-50 px-3 py-2 rounded">
                    <span className="font-medium">Edit</span>
                    <span className="text-gray-300">|</span>
                    <span className="font-medium text-primary">StampLedger</span>
                    <span className="text-gray-300">|</span>
                    <span className="font-medium">View</span>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-accent" />
                      <span className="font-semibold text-primary">Document Verified</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      SHA-256 hash matches stamp record. Document has not been modified since stamping.
                    </p>
                    <div className="mt-2 text-xs font-mono text-gray-400">
                      Hash: 45df36ba121a4cffa42c1c4db34c2a47
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-dark px-3 py-1 rounded-full text-sm font-medium mb-4">
                Available Now
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Adobe Acrobat Extension
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Verify engineering documents directly inside Adobe Acrobat Pro or Reader.
                One-click document hash verification from the StampLedger menu.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-primary">Verify Current Document</span>
                    <p className="text-gray-600 text-sm">Hashes the open PDF and checks it against all stamp records</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-primary">Stamp Lookup by ID</span>
                    <p className="text-gray-600 text-sm">Enter any stamp ID to view full details and verification status</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-primary">Add Stamp Annotations</span>
                    <p className="text-gray-600 text-sm">Add visual verification stamps with QR codes directly to PDFs</p>
                  </div>
                </li>
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link href="https://portal.stampledger.com/integrations" target="_blank">
                  <Button size="lg">
                    <Download className="w-5 h-5 mr-2" />
                    Download for Acrobat
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QR Verification */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                QR Code Verification
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Every stamped document includes a QR code that links to its blockchain-verified
                record. Scan with any smartphone camera — no app required.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-primary">No App Required</span>
                    <p className="text-gray-600 text-sm">Works with the built-in camera app on iOS and Android</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-primary">Rich Verification Page</span>
                    <p className="text-gray-600 text-sm">Shows PE details, license info, project info, and blockchain verification status</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-primary">Document Integrity Check</span>
                    <p className="text-gray-600 text-sm">Upload the document on the verify page to confirm it hasn't been altered</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-primary">Printable Certificates</span>
                    <p className="text-gray-600 text-sm">Generate and print official verification certificates for your records</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-48 h-48 bg-gray-50 rounded-2xl mb-4 mx-auto">
                  <div className="text-center">
                    <QrCode className="w-24 h-24 text-primary mx-auto" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">Scan to see a live verification example</p>
                <div className="bg-accent/10 rounded-lg p-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-5 h-5 text-accent" />
                    <span className="font-semibold text-accent-dark text-sm">Mobile Verification Result</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className="text-accent font-bold">VALID</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">PE</span>
                      <span className="font-medium">Alex Thompson, PE</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Verified in</span>
                      <span className="font-medium">2.1 seconds</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bluebeam & More */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              More Integrations Coming
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're building integrations with the tools engineers and inspectors use every day
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Monitor className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Bluebeam Revu</h3>
              <p className="text-gray-600 mb-3">
                Studio Session integration for real-time stamp verification.
                Verify stamps directly from Bluebeam markups.
              </p>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">Coming Q3 2026</span>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Server className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">REST API</h3>
              <p className="text-gray-600 mb-3">
                Full REST API for custom integrations with permit software
                like Accela, CityView, and Tyler Technologies.
              </p>
              <span className="text-xs bg-accent/10 text-accent-dark px-2 py-1 rounded-full font-medium">Available Now</span>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Mobile Apps</h3>
              <p className="text-gray-600 mb-3">
                Native iOS and Android apps for inspectors with offline
                verification and GPS-tagged inspections.
              </p>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">Coming Q3 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-white">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Build Your Own Integration
                </h2>
                <p className="text-primary-100 text-lg mb-6">
                  Our REST API gives you full access to stamp verification,
                  document integrity checking, and verification certificates.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                    <span>Public verification endpoints (no auth required)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                    <span>Document hash verification</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                    <span>Printable verification certificates</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                    <span>Extension auth tokens for desktop apps</span>
                  </li>
                </ul>
                <div className="flex flex-wrap gap-4">
                  <Link href="/api-reference">
                    <Button variant="accent" size="lg">
                      API Reference
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/docs">
                    <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-gray-100">
                      Documentation
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm font-mono text-sm">
                <div className="text-primary-100 mb-2"># Verify a stamp (public, no auth)</div>
                <div className="text-accent mb-4">
                  GET /api/verify/&#123;stamp-id&#125;
                </div>
                <div className="text-primary-100 mb-2"># Check document integrity</div>
                <div className="text-accent mb-4">
                  POST /api/verify/integrity<br />
                  <span className="text-primary-100">Body: &#123; &quot;sha256Hash&quot;: &quot;...&quot; &#125;</span>
                </div>
                <div className="text-primary-100 mb-2"># Get verification certificate</div>
                <div className="text-accent">
                  GET /api/verify/&#123;stamp-id&#125;/certificate
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Get Started Today
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Sign up for StampLedger and start verifying stamps from your browser,
            desktop, or mobile device.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://portal.stampledger.com" target="_blank">
              <Button size="lg">
                Open Portal
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/for-engineers">
              <Button variant="secondary" size="lg">
                For Engineers
              </Button>
            </Link>
            <Link href="/for-municipalities">
              <Button variant="outline" size="lg">
                For Municipalities
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
