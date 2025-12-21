/*
  Warnings:

  - Added the required column `workspace_id` to the `risk_entries` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "HealthLevel" AS ENUM ('EXCELLENT', 'GOOD', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "HealthTrend" AS ENUM ('IMPROVING', 'STABLE', 'DECLINING');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "health_score" INTEGER,
ADD COLUMN     "last_health_check" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "risk_entries" ADD COLUMN     "acknowledged_at" TIMESTAMP(3),
ADD COLUMN     "acknowledged_by" TEXT,
ADD COLUMN     "affected_tasks" TEXT[],
ADD COLUMN     "affected_users" TEXT[],
ADD COLUMN     "detected_at" TIMESTAMP(3),
ADD COLUMN     "risk_type" TEXT,
ADD COLUMN     "workspace_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "health_scores" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "level" "HealthLevel" NOT NULL,
    "trend" "HealthTrend" NOT NULL,
    "on_time_delivery" DOUBLE PRECISION NOT NULL,
    "blocker_impact" DOUBLE PRECISION NOT NULL,
    "team_capacity" DOUBLE PRECISION NOT NULL,
    "velocity_trend" DOUBLE PRECISION NOT NULL,
    "risk_count" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "health_scores_workspace_id_project_id_calculated_at_idx" ON "health_scores"("workspace_id", "project_id", "calculated_at");

-- CreateIndex
CREATE INDEX "risk_entries_workspace_id_project_id_idx" ON "risk_entries"("workspace_id", "project_id");

-- CreateIndex
CREATE INDEX "risk_entries_status_severity_idx" ON "risk_entries"("status", "severity");

-- CreateIndex
CREATE INDEX "risk_entries_detected_at_idx" ON "risk_entries"("detected_at");
