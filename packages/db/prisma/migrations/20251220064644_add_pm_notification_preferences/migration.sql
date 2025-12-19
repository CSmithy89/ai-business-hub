-- AlterTable
ALTER TABLE "notification_preferences"
  ADD COLUMN "email_task_assigned" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "email_task_mentioned" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "email_due_date_reminder" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "email_agent_completion" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "email_health_alert" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "in_app_task_assigned" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "in_app_task_mentioned" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "in_app_due_date_reminder" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "in_app_agent_completion" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "in_app_health_alert" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "quiet_hours_start" TEXT,
  ADD COLUMN "quiet_hours_end" TEXT,
  ADD COLUMN "quiet_hours_timezone" TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN "digest_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "digest_frequency" TEXT NOT NULL DEFAULT 'daily';
