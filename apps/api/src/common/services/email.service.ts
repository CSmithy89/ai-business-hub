import { Injectable, Logger } from '@nestjs/common';

/**
 * Email service for sending emails
 *
 * NOTE: This is a stub implementation for MVP.
 * In production, this should be replaced with a real email provider (e.g., SendGrid, AWS SES, Resend).
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /**
   * Send an email
   *
   * @param options - Email options
   * @returns Promise that resolves when email is sent
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    // STUB: Log email instead of actually sending
    this.logger.log(`[EMAIL STUB] Sending email to ${options.to}`);
    this.logger.log(`Subject: ${options.subject}`);
    this.logger.debug(`HTML: ${options.html.substring(0, 200)}...`);

    if (options.text) {
      this.logger.debug(`Text: ${options.text.substring(0, 200)}...`);
    }

    // TODO: Replace with actual email provider implementation
    // Example with nodemailer:
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: parseInt(process.env.SMTP_PORT || '587'),
    //   secure: false,
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS,
    //   },
    // });
    //
    // await transporter.sendMail({
    //   from: process.env.SMTP_FROM || 'noreply@hyvve.com',
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html,
    //   text: options.text,
    // });
  }
}
