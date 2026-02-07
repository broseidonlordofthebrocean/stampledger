'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Integrations', href: '/integrations' },
    { name: 'For Municipalities', href: '/for-municipalities' },
    { name: 'For Engineers', href: '/for-engineers' },
    { name: 'Pricing', href: '/pricing' },
  ]

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <nav className="container-custom flex items-center justify-between py-4 px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-xl font-bold text-primary">StampLedger</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-gray-600 hover:text-primary font-medium transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="#demo"
            className="text-primary font-semibold hover:text-primary-light transition-colors"
          >
            Request Demo
          </Link>
          <Link
            href="#signup"
            className="btn-primary"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-600" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4">
          <div className="flex flex-col gap-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:text-primary font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <hr className="my-2" />
            <Link
              href="#demo"
              className="text-primary font-semibold py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Request Demo
            </Link>
            <Link
              href="#signup"
              className="btn-primary text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
