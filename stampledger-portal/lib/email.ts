// Email configuration for StampLedger
// Default recipient until business email is set up

export const EMAIL_CONFIG = {
  // Default email for notifications until business email is configured
  defaultNotificationEmail: 'txbrigman@gmail.com',

  // Email templates
  templates: {
    orgInvite: {
      subject: 'You\'ve been invited to join an organization on StampLedger',
      getBody: (orgName: string, inviterName: string, inviteUrl: string) => `
Hello,

${inviterName} has invited you to join ${orgName} on StampLedger.

Click the link below to accept the invitation:
${inviteUrl}

If you don't have a StampLedger account yet, you'll be prompted to create one.

Best regards,
The StampLedger Team
      `.trim(),
    },

    specChange: {
      subject: (specNumber: string, revision: string) =>
        `Specification ${specNumber} updated to Rev ${revision}`,
      getBody: (
        specNumber: string,
        specTitle: string,
        revision: string,
        projectCount: number,
        changesCount: number
      ) => `
A specification you're following has been updated.

Specification: ${specNumber} - ${specTitle}
New Revision: ${revision}
Changes in this revision: ${changesCount}
Affected projects: ${projectCount}

Please review the changes and update affected projects as needed.

View details: https://stampledger.app/specs

Best regards,
The StampLedger Team
      `.trim(),
    },

    stampConfirmation: {
      subject: 'Document stamped successfully',
      getBody: (
        projectName: string,
        stampId: string,
        verifyUrl: string
      ) => `
Your document has been successfully stamped.

Project: ${projectName}
Stamp ID: ${stampId}

Verification URL: ${verifyUrl}

This stamp has been recorded on the blockchain and is permanently verifiable.

Best regards,
The StampLedger Team
      `.trim(),
    },

    stampSuperseded: {
      subject: (projectName: string) => `Stamp superseded: ${projectName}`,
      getBody: (
        projectName: string,
        reason: string,
        oldStampId: string,
        newStampId: string | null,
        verifyUrl: string | null
      ) => `
A stamp you are a stakeholder on has been superseded.

Project: ${projectName}
Reason: ${reason}
Old Stamp ID: ${oldStampId}
${newStampId ? `New Stamp ID: ${newStampId}` : 'No replacement stamp was created.'}
${verifyUrl ? `\nVerification URL: ${verifyUrl}` : ''}

If a new version was created, please verify it at the link above.

Best regards,
The StampLedger Team
      `.trim(),
    },

    stampRevoked: {
      subject: (projectName: string) => `Stamp revoked: ${projectName}`,
      getBody: (
        projectName: string,
        reason: string,
        stampId: string
      ) => `
A stamp you are a stakeholder on has been revoked.

Project: ${projectName}
Stamp ID: ${stampId}
Reason: ${reason}

This stamp is no longer valid. Please contact the responsible Professional Engineer for further information.

Best regards,
The StampLedger Team
      `.trim(),
    },

    batchStampConfirmation: {
      subject: (count: number) => `${count} projects stamped successfully`,
      getBody: (
        batchId: string,
        stampsCreated: number,
        tokensEarned: number,
        totalTokens: number
      ) => `
Your batch stamp operation has completed.

Batch ID: ${batchId}
Projects stamped: ${stampsCreated}
Tokens earned this batch: ${tokensEarned}
Total token count: ${totalTokens}

All stamps have been recorded on the blockchain.

Best regards,
The StampLedger Team
      `.trim(),
    },
  },
}

// Placeholder email sending function
// Replace with actual email service (SendGrid, Resend, Mailgun, etc.)
export async function sendEmail(options: {
  to: string | string[]
  subject: string
  body: string
  html?: string
}): Promise<{ success: boolean; error?: string }> {
  const { to, subject, body, html } = options

  // Log email for development (replace with actual send logic)
  console.log('=== EMAIL ===')
  console.log('To:', Array.isArray(to) ? to.join(', ') : to)
  console.log('Subject:', subject)
  console.log('Body:', body)
  console.log('=============')

  // TODO: Implement actual email sending
  // Example with fetch to email API:
  /*
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    return { success: false, error: 'Email not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'StampLedger <noreply@stampledger.app>',
        to: Array.isArray(to) ? to : [to],
        subject,
        text: body,
        html: html || body.replace(/\n/g, '<br>'),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
  */

  // For now, return success (emails are logged but not sent)
  return { success: true }
}

// Helper to send to default notification email
export async function sendNotificationEmail(
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: EMAIL_CONFIG.defaultNotificationEmail,
    subject,
    body,
  })
}
