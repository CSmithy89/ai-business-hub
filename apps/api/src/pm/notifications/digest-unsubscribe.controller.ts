import { Controller, Get, Param, Res, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { DigestService } from './digest.service';
import { DigestSchedulerService } from './digest-scheduler.service';
import { NotificationsService } from './notifications.service';

/**
 * DigestUnsubscribeController handles unsubscribe requests from digest emails
 *
 * This controller provides a public endpoint (no auth required) for users to
 * unsubscribe from digest emails via a link in the email.
 *
 * Rate limited to prevent abuse (3 requests per second using 'short' throttler).
 */
@Controller('pm/notifications/digest')
@Throttle({ short: { limit: 3, ttl: 1000 } }) // 3 requests per second
export class DigestUnsubscribeController {
  private readonly logger = new Logger(DigestUnsubscribeController.name);

  constructor(
    private readonly digestService: DigestService,
    private readonly digestSchedulerService: DigestSchedulerService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Handle unsubscribe requests
   *
   * GET /api/pm/notifications/digest/unsubscribe/:token
   *
   * This is a public endpoint (no auth required) that:
   * 1. Validates the JWT token
   * 2. Disables digest for the user
   * 3. Removes the digest job
   * 4. Returns a simple HTML page confirming unsubscribe
   */
  @Get('unsubscribe/:token')
  async unsubscribe(@Param('token') token: string, @Res() res: Response): Promise<void> {
    try {
      // Verify token, validate userId exists, and extract userId
      const { userId } = await this.digestService.verifyUnsubscribeToken(token);

      // Update user preferences to disable digest
      await this.notificationsService.updateUserPreferences(userId, {
        digestEnabled: false,
      });

      // Remove digest job
      await this.digestSchedulerService.removeUserDigest(userId);

      this.logger.log(`User ${userId} unsubscribed from digest emails`);

      // Return success HTML page
      res.send(this.getSuccessHtml());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Unsubscribe failed: ${errorMessage}`);

      // Token verification errors return 400, other errors return 500
      const isTokenError = errorMessage.includes('Invalid or expired unsubscribe token');
      const statusCode = isTokenError ? 400 : 500;

      res.status(statusCode).send(this.getErrorHtml(isTokenError));
    }
  }

  /**
   * Generate success HTML page
   */
  private getSuccessHtml(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          h1 {
            color: #10b981;
            font-size: 28px;
            margin-bottom: 20px;
          }
          p {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
          }
          .button:hover {
            background-color: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✓ Unsubscribed</h1>
          <p>You've been unsubscribed from digest emails.</p>
          <p>You can re-enable digest notifications anytime in your settings.</p>
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/settings/notifications" class="button">Go to Settings</a>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate error HTML page
   */
  private getErrorHtml(isTokenError: boolean = true): string {
    const title = isTokenError ? 'Invalid or Expired Link' : 'Something Went Wrong';
    const message = isTokenError
      ? 'This unsubscribe link is invalid or has expired.'
      : 'We encountered an error processing your request. Please try again later.';
    const hint = isTokenError
      ? 'Please use the unsubscribe link from your most recent digest email, or update your preferences in settings.'
      : 'If the problem persists, you can update your preferences in settings.';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          h1 {
            color: #ef4444;
            font-size: 28px;
            margin-bottom: 20px;
          }
          p {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
          }
          .button:hover {
            background-color: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${title}</h1>
          <p>${message}</p>
          <p>${hint}</p>
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/settings/notifications" class="button">Go to Settings</a>
        </div>
      </body>
      </html>
    `;
  }
}
