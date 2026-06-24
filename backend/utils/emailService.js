import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  try {
    // Determine configuration based on environment variables.
    // Use dummy settings if real SMTP is not configured
    const isSmtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);

    let transporter;
    if (isSmtpConfigured) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      console.warn('[EmailService] SMTP not fully configured. Using standard debug logging.');
      // Optional: You could use ethereal email here for local testing.
      // Ethereal is a fake SMTP service.
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: 'mavis.bayer42@ethereal.email',
            pass: '1qPzS1s4vHk3M4x9pB'
        }
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"OBCP Portal Support" <no-reply@obcp.edu>',
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html, // Optional HTML version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email sent to ${options.email}. Message ID: ${info.messageId}`);
    
    if (!isSmtpConfigured) {
      console.log(`[EmailService] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return true;
  } catch (error) {
    console.error(`[EmailService Error] Failed to send email to ${options.email}:`, error);
    // Don't throw the error, just let the app know it failed or handle it gracefully.
    throw new Error('Failed to send email');
  }
};
