-- AlterTable
ALTER TABLE "phase_checkpoints" ADD COLUMN     "reminder_1_day_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminder_3_days_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminder_day_of_sent" BOOLEAN NOT NULL DEFAULT false;
