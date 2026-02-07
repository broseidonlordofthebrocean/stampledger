import Link from 'next/link'
import { Mail, Linkedin, Twitter, Github } from 'lucide-react'

export default function Footer() {
  const footerLinks = {
    product: [
      { name: 'How It Works', href: '/how-it-works' },
      { name: 'Integrations', href: '/integrations' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'For Municipalities', href: '/for-municipalities' },
      { name: 'For Engineers', href: '/for-engineers' },
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Contact', href: 'mailto:hello@stampledger.com' },
      { name: 'Privacy', href: '/privacy' },
      { name: 'Terms', href: '/terms' },
    ],
    resources: [
      { name: 'Documentation', href: '/docs' },
      { name: 'API Reference', href: '/api-reference' },
      { name: 'Support', href: 'mailto:support@stampledger.com' },
    ],
  }

  return (
    <footer className="bg-primary text-white">
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-bold">StampLedger</span>
            </div>
            <p className="text-primary-100 mb-4 max-w-sm">
              Verifiable Professional Credentials. Blockchain-secured verification
              for professional engineer stamps.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="mailto:hello@stampledger.com"
                className="text-primary-100 hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/stampledger"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-100 hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/company/stampledger"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-100 hover:text-white transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/stampledger"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-100 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-primary-100 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-primary-100 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-primary-100 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-light mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-100 text-sm">
            &copy; {new Date().getFullYear()} StampLedger, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-primary-100">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-accent rounded-full"></span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
