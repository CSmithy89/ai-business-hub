import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CheckpointService } from './checkpoint.service';

@Injectable()
export class CheckpointReminderCron {
  private readonly logger = new Logger(CheckpointReminderCron.name);

  constructor(private readonly checkpointService: CheckpointService) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendCheckpointReminders(): Promise<void> {
    this.logger.log('Running checkpoint reminder job...');

    try {
      await this.checkpointService.sendReminders();
      this.logger.log('Checkpoint reminders sent successfully');
    } catch (error) {
      this.logger.error('Failed to send checkpoint reminders', error);
    }
  }
}
