-- CORE-PM: add missing base tables required by later migrations

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM (
  'COURSE',
  'PODCAST',
  'BOOK',
  'NEWSLETTER',
  'VIDEO_SERIES',
  'COMMUNITY',
  'SOFTWARE',
  'WEBSITE',
  'CUSTOM'
);

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM (
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED'
);

-- CreateTable
CREATE TABLE "projects" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "business_id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT NOT NULL DEFAULT '#3B82F6',
  "icon" TEXT NOT NULL DEFAULT 'folder',
  "cover_image" TEXT,
  "type" "ProjectType" NOT NULL DEFAULT 'CUSTOM',
  "bmad_template_id" TEXT,
  "current_phase" TEXT,
  "budget" DECIMAL(12, 2),
  "actual_spend" DECIMAL(12, 2),
  "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
  "start_date" TIMESTAMP(3),
  "target_date" TIMESTAMP(3),
  "total_tasks" INTEGER NOT NULL DEFAULT 0,
  "completed_tasks" INTEGER NOT NULL DEFAULT 0,
  "last_activity_at" TIMESTAMP(3),
  "auto_approval_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
  "suggestion_mode" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys
ALTER TABLE "projects"
  ADD CONSTRAINT "projects_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE UNIQUE INDEX "projects_workspace_id_slug_key" ON "projects"("workspace_id", "slug");
CREATE INDEX "projects_workspace_id_idx" ON "projects"("workspace_id");
CREATE INDEX "projects_business_id_idx" ON "projects"("business_id");
CREATE INDEX "projects_status_idx" ON "projects"("status");
CREATE INDEX "projects_deleted_at_idx" ON "projects"("deleted_at");
