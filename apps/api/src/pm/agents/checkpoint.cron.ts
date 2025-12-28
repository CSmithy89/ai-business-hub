import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CheckpointService } from './checkpoint.service';
import { DistributedLockService } from '../../common/services/distributed-lock.service';

@Injectable()
export class CheckpointReminderCron {
  private readonly logger = new Logger(CheckpointReminderCron.name);
  private readonly LOCK_KEY = 'cron:checkpoint-reminder';
  private readonly LOCK_TTL_MS = 23 * 60 * 60 * 1000; // 23 hours (less than 24 hour interval)

  constructor(
    private readonly checkpointService: CheckpointService,
    private readonly lockService: DistributedLockService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendCheckpointReminders(): Promise<void> {
    // Acquire distributed lock to prevent multiple instances running simultaneously
    const lock = await this.lockService.acquireLock(this.LOCK_KEY, {
      ttl: this.LOCK_TTL_MS,
    });

    if (!lock.acquired) {
      this.logger.debug('Checkpoint reminder already running on another instance, skipping');
      return;
    }

    this.logger.log('Running checkpoint reminder job...');

    try {
      await this.checkpointService.sendReminders();
      this.logger.log('Checkpoint reminders sent successfully');
    } catch (error) {
      this.logger.error('Failed to send checkpoint reminders', error);
    } finally {
      await lock.release();
    }
  }
}
