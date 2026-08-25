const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`[Email Simulation] To: ${to} | Subject: ${subject}`);
      return true;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"KARE IEEE Education Society" <noreply.ieee.kare@gmail.com>',
      to,
      subject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Sent] MessageID: ${info.messageId} to ${to}`);
    return true;
  } catch (error) {
    console.error('[Email Error] Failed to send email:', error.message);
    return false;
  }
};

const sendRegistrationSuccessEmail = async (registration, event) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: #ffffff;">
      <div style="background: #1e2952; padding: 16px; border-radius: 6px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">KARE IEEE EDUCATION SOCIETY</h2>
        <p style="margin: 4px 0 0 0; color: #f97316; font-size: 14px;">${event.eventName || 'AI/ML Workshop'}</p>
      </div>
      <div style="padding: 20px 0;">
        <h3 style="color: #0f172a;">Registration Successful!</h3>
        <p>Dear <strong>${registration.fullName}</strong>,</p>
        <p>Thank you for registering for our upcoming workshop. Your registration has been successfully recorded.</p>
        
        <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #f97316; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Registration ID:</strong> ${registration.registrationId}</p>
          <p style="margin: 4px 0;"><strong>Event Date:</strong> ${event.date}</p>
          <p style="margin: 4px 0;"><strong>Venue:</strong> ${event.venue}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> Payment Pending</p>
        </div>

        <p>Please complete your payment verification on your student dashboard to unlock your entry ticket.</p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center;">
        © 2026 KARE IEEE Education Society. All rights reserved.
      </div>
    </div>
  `;

  return sendEmail({
    to: registration.email,
    subject: `[KARE IEEE] Registration Received - ${registration.registrationId}`,
    html
  });
};

const sendPaymentApprovedEmail = async (registration, ticket, event, ticketPdfBuffer) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: #ffffff;">
      <div style="background: #1e2952; padding: 16px; border-radius: 6px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">KARE IEEE EDUCATION SOCIETY</h2>
        <p style="margin: 4px 0 0 0; color: #22c55e; font-size: 14px;">✓ Payment Approved</p>
      </div>
      <div style="padding: 20px 0;">
        <h3 style="color: #166534;">Your Seat is Confirmed!</h3>
        <p>Dear <strong>${registration.fullName}</strong>,</p>
        <p>Great news! Your payment for <strong>${event.eventName}</strong> has been verified and approved by the admin team.</p>
        
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
          <p style="margin: 4px 0;"><strong>Registration ID:</strong> ${registration.registrationId}</p>
          <p style="margin: 4px 0;"><strong>Event Date:</strong> ${event.date} (${event.startTime})</p>
        </div>

        <p>Your official Digital QR Ticket is attached to this email. You can also view and download it anytime from your Student Dashboard.</p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center;">
        © 2026 KARE IEEE Education Society. All rights reserved.
      </div>
    </div>
  `;

  const attachments = ticketPdfBuffer
    ? [{ filename: `Ticket-${ticket.ticketId}.pdf`, content: ticketPdfBuffer }]
    : [];

  return sendEmail({
    to: registration.email,
    subject: `[KARE IEEE] Ticket Confirmed - ${ticket.ticketId}`,
    html,
    attachments
  });
};

const sendPaymentRejectedEmail = async (registration, reason) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: #ffffff;">
      <div style="background: #1e2952; padding: 16px; border-radius: 6px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">KARE IEEE EDUCATION SOCIETY</h2>
        <p style="margin: 4px 0 0 0; color: #ef4444; font-size: 14px;">Payment Rejection Notice</p>
      </div>
      <div style="padding: 20px 0;">
        <h3 style="color: #991b1b;">Payment Verification Action Required</h3>
        <p>Dear <strong>${registration.fullName}</strong>,</p>
        <p>We were unable to verify your payment proof for Registration ID <strong>${registration.registrationId}</strong>.</p>
        
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; margin: 16px 0; color: #991b1b;">
          <p style="margin: 4px 0;"><strong>Reason:</strong> ${reason || 'Transaction ID or payment screenshot does not match our bank record.'}</p>
        </div>

        <p>Please log in to your Student Dashboard to re-submit your correct transaction details and screenshot.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: registration.email,
    subject: `[KARE IEEE] Action Needed: Payment Verification Update`,
    html
  });
};

module.exports = {
  sendRegistrationSuccessEmail,
  sendPaymentApprovedEmail,
  sendPaymentRejectedEmail
};
