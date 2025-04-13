/**
 * Development-focused email service that logs emails to the console
 * instead of actually sending them.
 */

export type EmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

/**
 * Send an email (logs to console for development)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Default sender email
  const from = 'noreply@cfapracticehub.com';
  
  try {
    // Log the email content instead of sending
    console.log('----- Email would have been sent -----');
    console.log(`From: ${from}`);
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Content: ${options.text || options.html}`);
    console.log('-------------------------------------');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  email: string, 
  resetCode: string
): Promise<boolean> {
  const subject = 'CFA Practice Hub - Password Reset';
  const text = `
Hello,

You recently requested to reset your password for your CFA Practice Hub account.

Your reset code is: ${resetCode}

This code will expire in 1 hour. If you did not request a password reset, please ignore this email.

Thank you,
CFA Practice Hub Team
  `;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; border: 1px solid #ddd; border-top: none; }
    .code { background-color: #f5f5f5; padding: 10px; font-size: 20px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0; }
    .footer { font-size: 12px; color: #777; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You recently requested to reset your password for your CFA Practice Hub account.</p>
      <p>Your reset code is:</p>
      <div class="code">${resetCode}</div>
      <p>This code will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
      <p>Thank you,<br>CFA Practice Hub Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
  
  return sendEmail({ to: email, subject, text, html });
}