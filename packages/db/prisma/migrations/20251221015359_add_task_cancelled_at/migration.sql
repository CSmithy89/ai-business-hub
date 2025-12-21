-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('PROJECT_STATUS', 'HEALTH_REPORT', 'PROGRESS_REPORT');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('MARKDOWN', 'JSON');

-- CreateEnum
CREATE TYPE "StakeholderType" AS ENUM ('EXECUTIVE', 'TEAM_LEAD', 'CLIENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "cancelled_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "stakeholder_type" "StakeholderType",
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "generated_by" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "format" "ReportFormat" NOT NULL DEFAULT 'MARKDOWN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_schedules" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "frequency" "ReportFrequency" NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "stakeholder_type" "StakeholderType",
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_run" TIMESTAMP(3),
    "next_run" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_workspace_id_project_id_idx" ON "reports"("workspace_id", "project_id");

-- CreateIndex
CREATE INDEX "reports_project_id_generated_at_idx" ON "reports"("project_id", "generated_at");

-- CreateIndex
CREATE INDEX "reports_type_idx" ON "reports"("type");

-- CreateIndex
CREATE INDEX "reports_stakeholder_type_idx" ON "reports"("stakeholder_type");

-- CreateIndex
CREATE INDEX "report_schedules_workspace_id_idx" ON "report_schedules"("workspace_id");

-- CreateIndex
CREATE INDEX "report_schedules_project_id_idx" ON "report_schedules"("project_id");

-- CreateIndex
CREATE INDEX "report_schedules_enabled_next_run_idx" ON "report_schedules"("enabled", "next_run");

-- CreateIndex
CREATE INDEX "report_schedules_workspace_id_project_id_idx" ON "report_schedules"("workspace_id", "project_id");

-- AddForeignKey
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
