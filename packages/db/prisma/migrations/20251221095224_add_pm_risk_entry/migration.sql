-- CreateEnum
CREATE TYPE "ImportSource" AS ENUM ('CSV', 'JIRA', 'ASANA', 'TRELLO');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('GITHUB', 'JIRA', 'ASANA', 'TRELLO');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "ExternalLinkType" AS ENUM ('ISSUE', 'PR', 'TICKET');

-- DropIndex
DROP INDEX "notifications_user_id_read_at_idx";

-- AlterTable
ALTER TABLE "notification_preferences" ADD COLUMN     "last_digest_sent_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "source" "ImportSource" NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'QUEUED',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "mapping_config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_errors" (
    "id" TEXT NOT NULL,
    "import_job_id" TEXT NOT NULL,
    "row_number" INTEGER NOT NULL,
    "field" TEXT,
    "message" TEXT NOT NULL,
    "raw_row" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_connections" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'CONNECTED',
    "encrypted_credentials" TEXT NOT NULL,
    "metadata" JSONB,
    "last_checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_links" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "link_type" "ExternalLinkType" NOT NULL,
    "external_id" TEXT NOT NULL,
    "external_url" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_risk_entries" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "impact" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "mitigation" TEXT,
    "status" TEXT NOT NULL,
    "target_date" TIMESTAMP(3),
    "predicted_date" TIMESTAMP(3),
    "delay_days" INTEGER,
    "baseline_scope" INTEGER,
    "current_scope" INTEGER,
    "scope_increase" DOUBLE PRECISION,
    "velocity_trend" TEXT,
    "velocity_change" DOUBLE PRECISION,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_risk_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_jobs_workspace_id_idx" ON "import_jobs"("workspace_id");

-- CreateIndex
CREATE INDEX "import_jobs_project_id_idx" ON "import_jobs"("project_id");

-- CreateIndex
CREATE INDEX "import_jobs_status_idx" ON "import_jobs"("status");

-- CreateIndex
CREATE INDEX "import_errors_import_job_id_idx" ON "import_errors"("import_job_id");

-- CreateIndex
CREATE INDEX "integration_connections_workspace_id_idx" ON "integration_connections"("workspace_id");

-- CreateIndex
CREATE INDEX "integration_connections_status_idx" ON "integration_connections"("status");

-- CreateIndex
CREATE UNIQUE INDEX "integration_connections_workspace_id_provider_key" ON "integration_connections"("workspace_id", "provider");

-- CreateIndex
CREATE INDEX "external_links_workspace_id_idx" ON "external_links"("workspace_id");

-- CreateIndex
CREATE INDEX "external_links_task_id_idx" ON "external_links"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_links_workspace_id_provider_external_id_link_type_key" ON "external_links"("workspace_id", "provider", "external_id", "link_type");

-- CreateIndex
CREATE INDEX "pm_risk_entries_project_id_idx" ON "pm_risk_entries"("project_id");

-- CreateIndex
CREATE INDEX "pm_risk_entries_tenant_id_idx" ON "pm_risk_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "pm_risk_entries_status_idx" ON "pm_risk_entries"("status");

-- CreateIndex
CREATE INDEX "pm_risk_entries_category_idx" ON "pm_risk_entries"("category");

-- CreateIndex
CREATE INDEX "pm_risk_entries_detected_at_idx" ON "pm_risk_entries"("detected_at");

-- CreateIndex
CREATE INDEX "pm_risk_entries_project_id_category_status_idx" ON "pm_risk_entries"("project_id", "category", "status");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at");

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_errors" ADD CONSTRAINT "import_errors_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_links" ADD CONSTRAINT "external_links_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_links" ADD CONSTRAINT "external_links_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_risk_entries" ADD CONSTRAINT "pm_risk_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
