const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const nodemailer = require('nodemailer');


/**
 * Single shared Nodemailer transporter setup for all application emails
 * Supports Gmail service (default with EMAIL_USER/EMAIL_PASS) or custom SMTP host.
 */
const createTransporter = () => {
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const rawPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();
  const pass = rawPass.replace(/\s+/g, '');

  if (process.env.SMTP_HOST && user && pass) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass },
    });
  }

  if (user && pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return null;
};

/**
 * Verifies SMTP connection on server startup to confirm credentials & connectivity
 */
const verifyTransporter = async () => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('⚠️ [Nodemailer] SMTP Not Configured (EMAIL_USER / EMAIL_PASS missing). Email simulation mode active.');
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ [Nodemailer] Gmail SMTP Connection Verified & Ready to Send Emails!');
    return true;
  } catch (error) {
    console.error('❌ [Nodemailer Startup Error] Failed to connect to Gmail SMTP server:');
    console.error(error); // Logs full error object including SMTP code and response
    return false;
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || (process.env.EMAIL_USER ? `"Kolothum Kadhavu FC" <${process.env.EMAIL_USER}>` : '"KFC League" <noreply@kfc-league.com>');

  if (!transporter) {
    console.log('\n=================== EMAIL SIMULATION (SMTP Not Configured) ===================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text || html}`);
    console.log('===============================================================================\n');
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({ from, to, subject, html, text });
    console.log(`[Email Sent via Nodemailer] MessageId: ${info.messageId} to ${to}`);
    return { success: true, info };
  } catch (error) {
    console.error(`❌ [Nodemailer Send Error] Failed to send email to ${to}:`);
    console.error(error); // Full error object containing SMTP response code & detail
    return { success: false, error: error.message || String(error) };
  }
};

// Alias for backward compatibility
const sendMail = sendEmail;

/**
 * Verification Email (Email-client-safe table layout with monospace OTP)
 */
const sendVerificationOTP = async ({ email, name, code }) => {
  const subject = `Verify your KFC account — ${code}`;
  const formattedCode = String(code).split('').join(' ');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#090d16; font-family: Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#090d16; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color:#0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; color: #e2e8f0;">
          <!-- Header Logo / Club Title -->
          <tr>
            <td align="center" style="padding-bottom: 24px; border-bottom: 1px solid #1e293b;">
              <h1 style="color: #00d2ff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px;">KOLOTHUM KADHAVU FC</h1>
              <p style="color: #64748b; font-size: 12px; font-weight: bold; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">Official Player Email Verification</p>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 24px 0 16px 0;">
              <p style="margin: 0 0 12px 0; font-size: 15px; color: #f8fafc;">Hi <strong>${name}</strong>,</p>
              <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                Welcome to <strong>Kolothum Kadhavu FC</strong>! Use the 6-digit code below to verify your account and activate your official player profile:
              </p>
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border: 2px solid #00d2ff; border-radius: 12px;">
                <tr>
                  <td align="center" style="padding: 16px 28px; font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 900; color: #00d2ff; letter-spacing: 8px;">
                    [ ${formattedCode} ]
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiry Notice -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; color: #64748b;">
                This code expires in <strong style="color: #f59e0b;">15 minutes</strong>. If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 20px; border-top: 1px solid #1e293b;">
              <p style="margin: 0; font-size: 11px; color: #475569;">
                Kolothum Kadhavu FC League Management System
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  const text = `Hi ${name},\n\nWelcome to Kolothum Kadhavu FC! Use this code to verify your account:\n\n[ ${formattedCode} ]\n\nThis code expires in 15 minutes.`;
  return sendEmail({ to: email, subject, html, text });
};

const sendTeamRegistrationConfirmation = async ({ managerEmail, managerName, teamName, logo, color }) => {
  const subject = `Team Registration Received — ${teamName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0b1329; color: #e2e8f0; padding: 30px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 20px;">
        ${logo ? `<img src="${logo}" alt="${teamName} Logo" style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 10px;" />` : ''}
        <h1 style="color: ${color || '#00d2ff'}; margin: 0;">Registration Received!</h1>
      </div>
      <p>Hi <strong>${managerName}</strong>,</p>
      <p>Thank you for registering <strong>${teamName}</strong> with KFC League!</p>
      <p>Your team status is currently <span style="color: #f59e0b; font-weight: bold;">PENDING APPROVAL</span>. Our league administrators are reviewing your submission.</p>
      <p>You can track your team's approval status anytime from your Manager Dashboard.</p>
      <hr style="border: 1px solid #1e293b; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">Kolothum Kadhavu FC League Management System</p>
    </div>
  `;
  const text = `Hi ${managerName}, thank you for registering ${teamName}! Your team status is currently PENDING APPROVAL.`;
  return sendEmail({ to: managerEmail, subject, html, text });
};

const sendTeamApprovalEmail = async ({ managerEmail, managerName, teamName, logo, dashboardUrl }) => {
  const subject = `🎉 Congratulations! Your Team "${teamName}" is Approved!`;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0b1329; color: #e2e8f0; padding: 30px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 20px;">
        ${logo ? `<img src="${logo}" alt="${teamName} Logo" style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 10px;" />` : ''}
        <h1 style="color: #10b981; margin: 0;">Team Approved & Live!</h1>
      </div>
      <p>Hi <strong>${managerName}</strong>,</p>
      <p>Great news! Your team <strong>${teamName}</strong> has been officially approved by KFC League admins.</p>
      <p>Your team is now live across public Standings, Squads, Fixtures, and Leaderboards!</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${dashboardUrl || '#'}" style="background-color: #00d2ff; color: #090d16; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Go to Player Dashboard</a>
      </div>
      <hr style="border: 1px solid #1e293b; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">Kolothum Kadhavu FC League Management System</p>
    </div>
  `;
  const text = `Hi ${managerName}, your team ${teamName} has been APPROVED and is now live!`;
  return sendEmail({ to: managerEmail, subject, html, text });
};

const sendTeamRejectionEmail = async ({ managerEmail, managerName, teamName, reason }) => {
  const subject = `Update Regarding Team Registration — ${teamName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0b1329; color: #e2e8f0; padding: 30px; border-radius: 12px;">
      <h1 style="color: #f43f5e; margin: 0 0 15px 0;">Team Registration Update</h1>
      <p>Hi <strong>${managerName}</strong>,</p>
      <p>We reviewed your application for <strong>${teamName}</strong>. Regrettably, your team request could not be approved at this time.</p>
      ${reason ? `<div style="background-color: #1e1b2e; border-left: 4px solid #f43f5e; padding: 12px; margin: 15px 0; border-radius: 4px;"><strong>Reason:</strong> ${reason}</div>` : ''}
      <p>If you have any questions or would like to re-submit with revised details, please feel free to reach out or submit a new request.</p>
      <hr style="border: 1px solid #1e293b; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">Kolothum Kadhavu FC League Management System</p>
    </div>
  `;
  const text = `Hi ${managerName}, your application for ${teamName} was not approved.${reason ? ` Reason: ${reason}` : ''}`;
  return sendEmail({ to: managerEmail, subject, html, text });
};

module.exports = {
  sendEmail,
  sendMail,
  verifyTransporter,
  sendVerificationOTP,
  sendTeamRegistrationConfirmation,
  sendTeamApprovalEmail,
  sendTeamRejectionEmail,
};
