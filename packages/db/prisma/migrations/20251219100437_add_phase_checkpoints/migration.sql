-- CreateEnum
CREATE TYPE "CheckpointStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "KBPageActivityType" ADD VALUE 'VERIFICATION_EXPIRED';

-- AlterTable
ALTER TABLE "phases" ADD COLUMN     "checkpoint_date" TIMESTAMP(3),
ADD COLUMN     "health_score" INTEGER,
ADD COLUMN     "last_health_check" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- CreateTable
CREATE TABLE "phase_checkpoints" (
    "id" TEXT NOT NULL,
    "phase_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "checkpoint_date" TIMESTAMP(3) NOT NULL,
    "status" "CheckpointStatus" NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),
    "remind_at_3_days" BOOLEAN NOT NULL DEFAULT true,
    "remind_at_1_day" BOOLEAN NOT NULL DEFAULT true,
    "remind_at_day_of" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phase_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "phase_checkpoints_phase_id_idx" ON "phase_checkpoints"("phase_id");

-- CreateIndex
CREATE INDEX "phase_checkpoints_checkpoint_date_idx" ON "phase_checkpoints"("checkpoint_date");

-- CreateIndex
CREATE INDEX "agent_suggestions_workspace_id_user_id_status_expires_at_idx" ON "agent_suggestions"("workspace_id", "user_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "saved_views_project_id_user_id_idx" ON "saved_views"("project_id", "user_id");

-- CreateIndex
CREATE INDEX "saved_views_project_id_is_default_idx" ON "saved_views"("project_id", "is_default");

-- CreateIndex
CREATE INDEX "task_labels_name_idx" ON "task_labels"("name");

-- AddForeignKey
ALTER TABLE "phase_checkpoints" ADD CONSTRAINT "phase_checkpoints_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
