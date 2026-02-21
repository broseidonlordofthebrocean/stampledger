'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Chrome,
  FileText,
  Puzzle,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle,
  Monitor,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Integration {
  id: string
  name: string
  icon: React.ElementType
  description: string
  status: 'available' | 'coming_soon'
  features: string[]
  setupSteps?: string[]
  downloadUrl?: string
  docsUrl?: string
}

const integrations: Integration[] = [
  {
    id: 'browser',
    name: 'Browser Extension',
    icon: Chrome,
    description:
      'Verify engineering stamps and check document integrity directly from Chrome or Edge. Right-click any StampLedger link to verify, or use the popup to check documents.',
    status: 'available',
    features: [
      'One-click stamp verification from any webpage',
      'Document integrity checking with SHA-256 hashing',
      'Right-click context menu for quick verification',
      'Auto-detect StampLedger verification links on pages',
      'Recent verification history',
    ],
    setupSteps: [
      'Download the extension files from the link below',
      'Open Chrome/Edge and navigate to chrome://extensions',
      'Enable "Developer mode" in the top right',
      'Click "Load unpacked" and select the stampledger-extension folder',
      'Click the extension icon and log in with your StampLedger credentials',
    ],
  },
  {
    id: 'acrobat',
    name: 'Adobe Acrobat',
    icon: FileText,
    description:
      'Add StampLedger verification directly into your PDF workflow. Verify stamps, check document integrity, and add visual stamp annotations — all from within Acrobat.',
    status: 'available',
    features: [
      'Verify stamps by ID directly in Acrobat',
      'Check document integrity against StampLedger records',
      'Add visual stamp annotations to PDFs',
      'Quick verify and annotate workflow',
      'Works with Acrobat DC, 2020, 2017, and Reader',
    ],
    setupSteps: [
      'Download the StampLedger.js file below',
      'Run the install.bat installer, or manually copy StampLedger.js to your Acrobat JavaScripts folder',
      'Restart Adobe Acrobat',
      'Go to Edit > StampLedger > Login to connect your account',
    ],
    docsUrl: '/acrobat',
  },
  {
    id: 'bluebeam',
    name: 'Bluebeam Revu',
    icon: Layers,
    description:
      'Integrate StampLedger with Bluebeam Revu for seamless stamp verification in your construction document workflows. Studio Session integration for real-time collaboration with verified stamps.',
    status: 'coming_soon',
    features: [
      'Studio Session integration for real-time stamp verification',
      'Markup-to-stamp workflow — convert Bluebeam markups to StampLedger stamps',
      'Batch verification of documents in Studio Projects',
      'Custom tool chest with StampLedger verification tools',
      'OAuth 2.0 integration with Bluebeam Studio API',
    ],
  },
]

export default function IntegrationsPage() {
  const [expandedId, setExpandedId] = useState<string | null>('browser')
  const [copiedStep, setCopiedStep] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path)
    setCopiedStep(path)
    setTimeout(() => setCopiedStep(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1 mb-0">Integrations</h1>
        <p className="text-muted-foreground">
          Extend StampLedger into your existing tools and workflows
        </p>
      </div>

      <div className="space-y-4">
        {integrations.map((integration) => {
          const isExpanded = expandedId === integration.id
          const Icon = integration.icon

          return (
            <div
              key={integration.id}
              className="bg-card rounded-xl border border-border overflow-hidden transition-shadow hover:shadow-sm"
            >
              {/* Header */}
              <button
                onClick={() => toggleExpand(integration.id)}
                className="w-full flex items-center gap-4 p-6 text-left"
              >
                <div className={`p-3 rounded-xl ${
                  integration.status === 'available'
                    ? 'bg-primary/10'
                    : 'bg-muted'
                }`}>
                  <Icon className={`h-8 w-8 ${
                    integration.status === 'available'
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-foreground">
                      {integration.name}
                    </h2>
                    {integration.status === 'available' ? (
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-accent/10 text-accent rounded-full">
                        Available
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {integration.description}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-border p-6 pt-4 space-y-6">
                  {/* Features */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Features</h3>
                    <ul className="space-y-2">
                      {integration.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Setup Steps */}
                  {integration.setupSteps && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3">Setup Instructions</h3>
                      <ol className="space-y-3">
                        {integration.setupSteps.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span className="text-foreground pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Actions */}
                  {integration.status === 'available' && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {integration.id === 'acrobat' && (
                        <Link href="/acrobat">
                          <Button className="gap-2">
                            <Monitor className="h-4 w-4" />
                            Generate Auth Token
                          </Button>
                        </Link>
                      )}
                      {integration.id === 'browser' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
                          <p className="text-sm text-blue-800">
                            <strong>Developer Install:</strong> The browser extension is available as an unpacked extension.
                            Clone the <code className="bg-blue-100 px-1 rounded">stampledger-extension</code> repository
                            and load it in Chrome/Edge developer mode.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {integration.status === 'coming_soon' && (
                    <div className="bg-muted border border-border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        This integration is currently in development. It requires Bluebeam Studio API access
                        and OAuth 2.0 partnership configuration. Stay tuned for updates.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* API Section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-secondary/10 p-3 rounded-xl">
            <Puzzle className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Build Your Own</h2>
            <p className="text-sm text-muted-foreground">
              Use the StampLedger API to build custom integrations
            </p>
          </div>
        </div>
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <p className="text-sm text-foreground">
            <strong>Public Endpoints</strong> (no authentication required):
          </p>
          <div className="space-y-1 text-sm font-mono text-muted-foreground">
            <p>GET /api/verify/{'{'}<span className="text-primary">stampId</span>{'}'} — Verify a stamp</p>
            <p>POST /api/verify/integrity — Check document hash</p>
            <p>GET /api/verify/{'{'}<span className="text-primary">stampId</span>{'}'}/certificate — Get verification certificate</p>
          </div>
          <p className="text-sm text-foreground mt-3">
            <strong>Authenticated Endpoints:</strong>
          </p>
          <div className="space-y-1 text-sm font-mono text-muted-foreground">
            <p>POST /api/auth/extension-token — Get extension auth token</p>
            <p>GET /api/stamps — List your stamps</p>
            <p>GET /api/documents — List your documents</p>
          </div>
        </div>
      </div>
    </div>
  )
}
