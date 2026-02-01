import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import {
  Upload,
  FileCheck,
  Database,
  QrCode,
  Smartphone,
  CheckCircle,
  Shield,
  Lock,
  Server,
  ArrowRight,
  ArrowDown,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'How It Works | StampLedger - Blockchain PE Stamp Verification',
  description: 'Learn how StampLedger uses blockchain technology to create unforgeable, instantly verifiable PE stamps. Simple for users, powerful technology behind the scenes.',
}

export default function HowItWorks() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white section-padding">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-6">
            How StampLedger Works
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simple for users, powerful technology behind the scenes.
            Here's how we make PE stamp verification instant and fraud-proof.
          </p>
        </div>
      </section>

      {/* Simple Explanation Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">
              The Simple Version
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Think of StampLedger as a digital notary with a permanent, unforgeable record book.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
              <div className="w-16 h-16 bg-secondary text-white rounded-2xl flex items-center justify-center font-bold text-2xl flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <Upload className="w-6 h-6 text-secondary" />
                    <h3 className="text-xl font-semibold text-primary">PE Uploads Drawing</h3>
                  </div>
                  <p className="text-gray-600">
                    The engineer uploads their drawing (PDF, DWG) to StampLedger.
                    They enter project details like address and permit number.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-8">
              <ArrowDown className="w-8 h-8 text-gray-300" />
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
              <div className="w-16 h-16 bg-secondary text-white rounded-2xl flex items-center justify-center font-bold text-2xl flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <FileCheck className="w-6 h-6 text-secondary" />
                    <h3 className="text-xl font-semibold text-primary">System Verifies PE</h3>
                  </div>
                  <p className="text-gray-600">
                    StampLedger checks the PE's license with the state board and verifies
                    their insurance is active. This happens automatically in seconds.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-8">
              <ArrowDown className="w-8 h-8 text-gray-300" />
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
              <div className="w-16 h-16 bg-secondary text-white rounded-2xl flex items-center justify-center font-bold text-2xl flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <Database className="w-6 h-6 text-secondary" />
                    <h3 className="text-xl font-semibold text-primary">Record Created on Blockchain</h3>
                  </div>
                  <p className="text-gray-600">
                    A permanent record is created on our blockchain network. This record
                    cannot be altered, deleted, or backdated. It includes the document hash,
                    PE info, timestamp, and verification status.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-8">
              <ArrowDown className="w-8 h-8 text-gray-300" />
            </div>

            {/* Step 4 */}
            <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
              <div className="w-16 h-16 bg-secondary text-white rounded-2xl flex items-center justify-center font-bold text-2xl flex-shrink-0">
                4
              </div>
              <div className="flex-1">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <QrCode className="w-6 h-6 text-secondary" />
                    <h3 className="text-xl font-semibold text-primary">PE Gets Stamped PDF</h3>
                  </div>
                  <p className="text-gray-600">
                    The engineer downloads their drawing with a QR code overlay. This QR
                    code links to the blockchain record. They submit this to the municipality
                    as usual.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-8">
              <ArrowDown className="w-8 h-8 text-gray-300" />
            </div>

            {/* Step 5 */}
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-16 h-16 bg-accent text-white rounded-2xl flex items-center justify-center font-bold text-2xl flex-shrink-0">
                5
              </div>
              <div className="flex-1">
                <div className="bg-accent/10 rounded-xl p-6 border border-accent/30">
                  <div className="flex items-center gap-3 mb-3">
                    <Smartphone className="w-6 h-6 text-accent-dark" />
                    <h3 className="text-xl font-semibold text-primary">Inspector Verifies Instantly</h3>
                  </div>
                  <p className="text-gray-600">
                    The building inspector scans the QR code with their phone. In 2-3 seconds,
                    they see "VALID" or "INVALID" with full PE details. Done.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Deep Dive */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">
              The Technical Details
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              For those who want to understand the technology behind StampLedger
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">MunicipalChain Blockchain</h3>
              <p className="text-gray-600 mb-4">
                Built on Cosmos SDK, the same technology powering Binance Chain and other
                enterprise blockchains. Permissioned network where municipalities run
                validator nodes.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>3-5 second block finality</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Byzantine fault tolerant consensus</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Horizontal scalability (1M+ stamps/year)</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">Cryptographic Security</h3>
              <p className="text-gray-600 mb-4">
                Every stamp is cryptographically secured using industry-standard algorithms.
                Documents are hashed, signed, and verified using the same technology as
                digital banking.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>SHA-256 document hashing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>ECDSA digital signatures</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>256-bit AES encryption at rest</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Server className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">Decentralized Network</h3>
              <p className="text-gray-600 mb-4">
                No single point of failure. Municipalities run validator nodes, ensuring
                the network continues even if any individual participant goes offline.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Minimum 3 validators for consensus</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Geographic distribution across municipalities</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Data replicated across all nodes</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">Compliance & Auditing</h3>
              <p className="text-gray-600 mb-4">
                Built to meet government security requirements. Full audit trails,
                access logging, and compliance with electronic signature regulations.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>ESIGN Act & UETA compliant</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>SOC 2 ready</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Court-admissible records</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Blockchain Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-primary mb-8 text-center">
              Why Blockchain?
            </h2>
            <div className="prose prose-lg max-w-none">
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <p className="text-gray-600 mb-6">
                  You might wonder why we use blockchain instead of a traditional database.
                  Here's the simple answer:
                </p>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <h4 className="font-semibold text-red-800 mb-2">Traditional Database</h4>
                    <ul className="text-red-700 text-sm space-y-1">
                      <li>• Records can be altered by admins</li>
                      <li>• Single point of failure</li>
                      <li>• "Trust us" model</li>
                      <li>• Company can change history</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <h4 className="font-semibold text-green-800 mb-2">StampLedger Blockchain</h4>
                    <ul className="text-green-700 text-sm space-y-1">
                      <li>• Records are cryptographically locked</li>
                      <li>• Distributed across municipalities</li>
                      <li>• "Verify yourself" model</li>
                      <li>• History is immutable</li>
                    </ul>
                  </div>
                </div>
                <p className="text-gray-600">
                  When a municipality verifies a PE stamp, they're not trusting us—they're
                  verifying the cryptographic proof themselves. This is especially important
                  in legal disputes where proof of authenticity matters.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">
              Easy Integration
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              StampLedger works with your existing systems
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">Mobile Apps</h3>
              <p className="text-gray-600">
                iOS and Android apps for inspectors. Scan QR codes, verify stamps, work offline.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Server className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">REST API</h3>
              <p className="text-gray-600">
                Full API for integration with permit software (Accela, CityView, Tyler Technologies).
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">QR Codes</h3>
              <p className="text-gray-600">
                Any smartphone can verify stamps by scanning the QR code. No app required for basic checks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to See It in Action?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Schedule a demo to see how StampLedger can modernize PE stamp verification
            for your municipality or engineering practice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/for-municipalities#contact">
              <Button variant="accent" size="lg">
                Request Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-gray-100">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
