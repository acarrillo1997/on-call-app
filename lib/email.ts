import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Configure the email transporter
const createTransporter = () => {
  // Use Mailtrap SMTP service
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'live.smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'api',
      pass: process.env.SMTP_PASSWORD || 'c71edd6217dbecb088e396d8f3bfa576',
    },
  });
};

// Send an email
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'hello@demomailtrap.co',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Send a team invitation email
export async function sendTeamInvitation(
  email: string,
  teamName: string,
  inviterName: string,
  inviteLink: string
): Promise<boolean> {
  const subject = `Invitation to join ${teamName} on On-Call App`;
  
  const text = `
    Hello,
    
    ${inviterName} has invited you to join the team "${teamName}" on On-Call App.
    
    Click the following link to accept the invitation:
    ${inviteLink}
    
    This link will expire in 7 days.
    
    If you did not expect this invitation, you can safely ignore this email.
    
    Best regards,
    The On-Call App Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You've been invited!</h2>
      <p>${inviterName} has invited you to join the team "<strong>${teamName}</strong>" on On-Call App.</p>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="${inviteLink}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
          Accept Invitation
        </a>
      </div>
      
      <p>This invitation link will expire in 7 days.</p>
      <p>If you did not expect this invitation, you can safely ignore this email.</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #666; font-size: 12px;">
        <p>Best regards,<br />The On-Call App Team</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
} 