import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!);
  return _resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'Trailblazer <noreply@trailblazer.app>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Trailblazer</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #1e3a5f 0%, #0a0a0a 100%); border-bottom: 1px solid #2a2a2a;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                Trailblazer
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #111111; border-top: 1px solid #2a2a2a;">
              <p style="margin: 0; font-size: 12px; color: #666666; text-align: center;">
                Powered by Terra
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #444444; text-align: center;">
                &copy; ${new Date().getFullYear()} Trailblazer. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #ffffff;">
      Verify your email address
    </h2>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #b0b0b0;">
      Thanks for signing up for Trailblazer. Please verify your email address by clicking the button below.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="border-radius: 8px; background-color: #3b82f6;">
          <a href="${verifyUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">
            Verify Email
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.5; color: #666666;">
      If you didn't create an account, you can safely ignore this email. This link expires in 24 hours.
    </p>
  `;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Verify your email - Trailblazer',
    html: baseTemplate(content),
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #ffffff;">
      Reset your password
    </h2>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #b0b0b0;">
      We received a request to reset the password for your Trailblazer account. Click the button below to choose a new password.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="border-radius: 8px; background-color: #3b82f6;">
          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.5; color: #666666;">
      If you didn't request a password reset, you can safely ignore this email. This link expires in 1 hour.
    </p>
  `;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset your password - Trailblazer',
    html: baseTemplate(content),
  });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const dashboardUrl = `${APP_URL}/dashboard`;

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #ffffff;">
      Welcome to Trailblazer, ${name}!
    </h2>
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #b0b0b0;">
      Your account is all set up and ready to go. Trailblazer connects drivers and shippers for fast, reliable deliveries.
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #b0b0b0;">
      Head to your dashboard to get started — set up your profile, explore available jobs, or post your first shipment.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="border-radius: 8px; background-color: #3b82f6;">
          <a href="${dashboardUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">
            Go to Dashboard
          </a>
        </td>
      </tr>
    </table>
  `;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Welcome to Trailblazer!',
    html: baseTemplate(content),
  });
}

interface JobDetails {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  packageSize: string;
  urgency: string;
  status: string;
}

export async function sendJobNotificationEmail(
  email: string,
  jobDetails: JobDetails
): Promise<void> {
  const jobUrl = `${APP_URL}/dashboard/jobs/${jobDetails.id}`;

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #ffffff;">
      Job Update: ${jobDetails.status.replace(/_/g, ' ')}
    </h2>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #b0b0b0;">
      There's an update on your delivery job.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; background-color: #222222; border-radius: 8px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding: 4px 0;">
                <span style="font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Job ID</span><br />
                <span style="font-size: 14px; color: #ffffff;">${jobDetails.id}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0 4px;">
                <span style="font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Pickup</span><br />
                <span style="font-size: 14px; color: #ffffff;">${jobDetails.pickupAddress}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0 4px;">
                <span style="font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Dropoff</span><br />
                <span style="font-size: 14px; color: #ffffff;">${jobDetails.dropoffAddress}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0 4px;">
                <span style="font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Package Size</span><br />
                <span style="font-size: 14px; color: #ffffff;">${jobDetails.packageSize}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0 4px;">
                <span style="font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Urgency</span><br />
                <span style="font-size: 14px; color: #ffffff;">${jobDetails.urgency}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="border-radius: 8px; background-color: #3b82f6;">
          <a href="${jobUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">
            View Job Details
          </a>
        </td>
      </tr>
    </table>
  `;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Job ${jobDetails.status.replace(/_/g, ' ')} - Trailblazer`,
    html: baseTemplate(content),
  });
}
