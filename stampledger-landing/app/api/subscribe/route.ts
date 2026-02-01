import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, org, role } = await req.json()

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      )
    }

    // If Resend API key is configured, send emails
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      // Add to Resend audience if configured
      if (process.env.RESEND_AUDIENCE_ID) {
        await resend.contacts.create({
          email,
          audienceId: process.env.RESEND_AUDIENCE_ID,
          firstName: org || undefined,
          unsubscribed: false,
        })
      }

      // Send confirmation email
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'hello@stampledger.com',
        to: email,
        subject: 'Thanks for your interest in StampLedger',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1a3a52; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 8px 8px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>StampLedger</h1>
              </div>
              <div class="content">
                <h2>Thanks for joining the StampLedger beta list!</h2>
                <p>We're excited to have you on board. We're launching in Wisconsin in Q2 2026 and will keep you updated on our progress.</p>
                ${org ? `<p><strong>Organization:</strong> ${org}</p>` : ''}
                ${role ? `<p><strong>Role:</strong> ${role}</p>` : ''}
                <p>In the meantime, here's what you can expect from StampLedger:</p>
                <ul>
                  <li>Instant PE stamp verification (2-3 seconds vs 2-3 days)</li>
                  <li>Blockchain-secured, fraud-proof records</li>
                  <li>Mobile inspector app for field verification</li>
                  <li>Full audit trail for compliance</li>
                </ul>
                <p>Questions? Reply to this email or contact <a href="mailto:hello@stampledger.com">hello@stampledger.com</a></p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} StampLedger, Inc. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      })

      // Notify admin
      if (process.env.ADMIN_EMAIL) {
        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'hello@stampledger.com',
          to: process.env.ADMIN_EMAIL,
          subject: 'New StampLedger Beta Signup',
          html: `
            <h3>New signup:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Organization:</strong> ${org || 'N/A'}</p>
            <p><strong>Role:</strong> ${role || 'N/A'}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          `
        })
      }
    } else {
      return NextResponse.json(
        { error: 'Email service not configured. Please contact hello@stampledger.com directly.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    )
  }
}
