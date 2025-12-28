import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/**
 * Email sending options
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: { name: string; value: string }[];
}

/**
 * Email service for sending emails via Resend
 *
 * Configuration:
 * - RESEND_API_KEY: Required for production email sending
 * - EMAIL_FROM: Default sender email (defaults to 'noreply@hyvve.com')
 * - EMAIL_ENABLED: Set to 'true' to enable email sending (defaults to 'false' in development)
 *
 * When EMAIL_ENABLED is false or RESEND_API_KEY is not set, emails are logged but not sent.
 */
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private isEnabled = false;
  private defaultFrom = 'HYVVE <noreply@hyvve.com>';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const emailEnabled = this.configService.get<string>('EMAIL_ENABLED', 'false');
    this.defaultFrom = this.configService.get<string>('EMAIL_FROM', 'HYVVE <noreply@hyvve.com>');

    if (apiKey && emailEnabled === 'true') {
      this.resend = new Resend(apiKey);
      this.isEnabled = true;
      this.logger.log('Email service initialized with Resend provider');
    } else {
      this.logger.warn(
        'Email service running in stub mode. Set RESEND_API_KEY and EMAIL_ENABLED=true to enable.',
      );
    }
  }

  /**
   * Check if email sending is enabled
   */
  isEmailEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Send an email
   *
   * @param options - Email options
   * @returns Promise that resolves when email is sent (or logged in stub mode)
   * @throws Error if email sending fails (only in production mode)
   */
  async sendEmail(options: SendEmailOptions): Promise<{ id?: string; success: boolean }> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    // Log email metadata (not content to avoid leaking sensitive data)
    this.logger.log(`Sending email to ${recipients.length} recipient(s): ${recipients.join(', ')}`);
    this.logger.debug(`Subject: ${options.subject}`);

    if (!this.isEnabled || !this.resend) {
      // Stub mode: Log and return success
      this.logger.debug(`[STUB MODE] Email would be sent with ${options.html.length} chars HTML`);
      return { success: true };
    }

    try {
      const result = await this.resend.emails.send({
        from: options.from ?? this.defaultFrom,
        to: recipients,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        tags: options.tags,
      });

      if (result.error) {
        this.logger.error(`Failed to send email: ${result.error.message}`, result.error);
        throw new Error(`Email sending failed: ${result.error.message}`);
      }

      this.logger.log(`Email sent successfully: ${result.data?.id}`);
      return { id: result.data?.id, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Email sending error: ${message}`, error);
      throw error;
    }
  }

  /**
   * Send a batch of emails
   *
   * @param emails - Array of email options
   * @returns Promise with results for each email
   */
  async sendBatch(
    emails: SendEmailOptions[],
  ): Promise<Array<{ success: boolean; id?: string; error?: string }>> {
    const results: Array<{ success: boolean; id?: string; error?: string }> = [];

    for (const email of emails) {
      try {
        const result = await this.sendEmail(email);
        results.push({ success: true, id: result.id });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({ success: false, error: message });
      }
    }

    return results;
  }
}
