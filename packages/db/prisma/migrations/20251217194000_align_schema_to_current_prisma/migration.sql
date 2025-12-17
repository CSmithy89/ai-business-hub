-- Required extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "BmadPhaseType" AS ENUM ('PHASE_1_BRIEF', 'PHASE_2_REQUIREMENTS', 'PHASE_3_ARCHITECTURE', 'PHASE_4_IMPLEMENTATION', 'PHASE_5_TESTING', 'PHASE_6_DEPLOYMENT', 'PHASE_7_LAUNCH', 'OPERATE_MAINTAIN', 'OPERATE_ITERATE', 'OPERATE_SCALE');

-- CreateEnum
CREATE TYPE "PhaseStatus" AS ENUM ('UPCOMING', 'CURRENT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('EPIC', 'STORY', 'TASK', 'SUBTASK', 'BUG', 'RESEARCH', 'CONTENT', 'AGENT_REVIEW');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'AWAITING_APPROVAL', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('HUMAN', 'AGENT', 'HYBRID');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('NOT_NEEDED', 'PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('PROJECT_LEAD', 'DEVELOPER', 'DESIGNER', 'QA_ENGINEER', 'STAKEHOLDER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TaskActivityType" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'ASSIGNED', 'UNASSIGNED', 'COMMENTED', 'ATTACHMENT_ADDED', 'ATTACHMENT_REMOVED', 'LABEL_ADDED', 'LABEL_REMOVED', 'RELATION_ADDED', 'RELATION_REMOVED', 'ESTIMATED', 'STARTED', 'COMPLETED', 'REOPENED', 'APPROVAL_REQUESTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TaskRelationType" AS ENUM ('BLOCKS', 'BLOCKED_BY', 'DEPENDS_ON', 'DEPENDENCY_OF', 'RELATES_TO', 'DUPLICATES', 'DUPLICATED_BY', 'PARENT_OF', 'CHILD_OF');

-- CreateEnum
CREATE TYPE "ViewType" AS ENUM ('LIST', 'KANBAN', 'CALENDAR', 'TIMELINE', 'TABLE');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "RiskProbability" AS ENUM ('VERY_LIKELY', 'LIKELY', 'POSSIBLE', 'UNLIKELY', 'RARE');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('IDENTIFIED', 'ANALYZING', 'MITIGATING', 'MONITORING', 'RESOLVED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "KBMentionType" AS ENUM ('USER', 'TASK', 'PAGE');

-- CreateEnum
CREATE TYPE "KBPageActivityType" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'RESTORED', 'VIEWED', 'VERIFIED', 'UNVERIFIED', 'LINKED_TO_PROJECT', 'UNLINKED_FROM_PROJECT', 'COMMENTED');

-- DropIndex
DROP INDEX "accounts_provider_provider_account_id_key";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "expires_at",
DROP COLUMN "provider",
DROP COLUMN "provider_account_id",
ADD COLUMN     "access_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "account_id" TEXT NOT NULL,
ADD COLUMN     "id_token" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "provider_id" TEXT NOT NULL DEFAULT 'credential',
ADD COLUMN     "refresh_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "scope" TEXT;

-- AlterTable
ALTER TABLE "mcp_server_configs" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "project_expenses" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "password_hash",
ADD COLUMN     "password" TEXT;

-- AlterTable
ALTER TABLE "workspace_modules" ALTER COLUMN "updated_at" DROP DEFAULT;

-- DropTable
DROP TABLE "verification_tokens";

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phases" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "bmadPhase" "BmadPhaseType",
    "phase_number" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" "PhaseStatus" NOT NULL DEFAULT 'UPCOMING',
    "total_tasks" INTEGER NOT NULL DEFAULT 0,
    "completed_tasks" INTEGER NOT NULL DEFAULT 0,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "completed_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "phase_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "task_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL DEFAULT 'TASK',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignment_type" "AssignmentType" NOT NULL DEFAULT 'HUMAN',
    "assignee_id" TEXT,
    "agent_id" TEXT,
    "story_points" INTEGER,
    "estimated_hours" DOUBLE PRECISION,
    "actual_hours" DOUBLE PRECISION,
    "confidence_score" DOUBLE PRECISION,
    "status" "TaskStatus" NOT NULL DEFAULT 'BACKLOG',
    "state_id" TEXT,
    "due_date" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "parent_id" TEXT,
    "approval_required" BOOLEAN NOT NULL DEFAULT false,
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'NOT_NEEDED',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_teams" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "lead_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'DEVELOPER',
    "custom_role_name" TEXT,
    "hours_per_week" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "productivity" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "can_assign_tasks" BOOLEAN NOT NULL DEFAULT false,
    "can_approve_agents" BOOLEAN NOT NULL DEFAULT false,
    "can_modify_phases" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_activities" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "TaskActivityType" NOT NULL,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_relations" (
    "id" TEXT NOT NULL,
    "source_task_id" TEXT NOT NULL,
    "target_task_id" TEXT NOT NULL,
    "relation_type" "TaskRelationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "task_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_attachments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_comments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_labels" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',

    CONSTRAINT "task_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_views" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "view_type" "ViewType" NOT NULL DEFAULT 'LIST',
    "filters" JSONB NOT NULL DEFAULT '{}',
    "sort_by" TEXT,
    "sort_order" TEXT,
    "columns" JSONB,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_entries" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "severity" "RiskSeverity" NOT NULL DEFAULT 'MEDIUM',
    "probability" "RiskProbability" NOT NULL DEFAULT 'POSSIBLE',
    "impact" TEXT,
    "mitigation" TEXT,
    "status" "RiskStatus" NOT NULL DEFAULT 'IDENTIFIED',
    "owner_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "risk_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phase_snapshots" (
    "id" TEXT NOT NULL,
    "phase_id" TEXT NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "total_tasks" INTEGER NOT NULL,
    "completed_tasks" INTEGER NOT NULL,
    "total_points" INTEGER NOT NULL,
    "completed_points" INTEGER NOT NULL,
    "velocity" DOUBLE PRECISION,
    "burndown_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phase_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_pages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "title" TEXT NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "content" JSONB NOT NULL,
    "content_text" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "verified_by_id" TEXT,
    "verify_expires" TIMESTAMP(3),
    "owner_id" TEXT NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "last_viewed_at" TIMESTAMP(3),
    "yjs_state" BYTEA,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "knowledge_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_versions" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "content_text" TEXT NOT NULL,
    "change_note" VARCHAR(500),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_embeddings" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "chunk_text" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "embedding_model" VARCHAR(100) NOT NULL DEFAULT 'text-embedding-3-small',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_pages" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kb_page_comments" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "kb_page_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_mentions" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "mention_type" "KBMentionType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_activities" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "KBPageActivityType" NOT NULL,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "verification_identifier_expires_at_idx" ON "verification"("identifier", "expires_at");

-- CreateIndex
CREATE INDEX "phases_project_id_idx" ON "phases"("project_id");

-- CreateIndex
CREATE INDEX "phases_status_idx" ON "phases"("status");

-- CreateIndex
CREATE INDEX "tasks_workspace_id_idx" ON "tasks"("workspace_id");

-- CreateIndex
CREATE INDEX "tasks_phase_id_idx" ON "tasks"("phase_id");

-- CreateIndex
CREATE INDEX "tasks_project_id_idx" ON "tasks"("project_id");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_assignee_id_idx" ON "tasks"("assignee_id");

-- CreateIndex
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");

-- CreateIndex
CREATE INDEX "tasks_deleted_at_idx" ON "tasks"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_project_id_task_number_key" ON "tasks"("project_id", "task_number");

-- CreateIndex
CREATE UNIQUE INDEX "project_teams_project_id_key" ON "project_teams"("project_id");

-- CreateIndex
CREATE INDEX "project_teams_lead_user_id_idx" ON "project_teams"("lead_user_id");

-- CreateIndex
CREATE INDEX "team_members_user_id_idx" ON "team_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_id_user_id_key" ON "team_members"("team_id", "user_id");

-- CreateIndex
CREATE INDEX "task_activities_task_id_idx" ON "task_activities"("task_id");

-- CreateIndex
CREATE INDEX "task_activities_user_id_idx" ON "task_activities"("user_id");

-- CreateIndex
CREATE INDEX "task_activities_created_at_idx" ON "task_activities"("created_at");

-- CreateIndex
CREATE INDEX "task_relations_source_task_id_idx" ON "task_relations"("source_task_id");

-- CreateIndex
CREATE INDEX "task_relations_target_task_id_idx" ON "task_relations"("target_task_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_relations_source_task_id_target_task_id_relation_type_key" ON "task_relations"("source_task_id", "target_task_id", "relation_type");

-- CreateIndex
CREATE INDEX "task_attachments_task_id_idx" ON "task_attachments"("task_id");

-- CreateIndex
CREATE INDEX "task_comments_task_id_idx" ON "task_comments"("task_id");

-- CreateIndex
CREATE INDEX "task_comments_user_id_idx" ON "task_comments"("user_id");

-- CreateIndex
CREATE INDEX "task_comments_parent_id_idx" ON "task_comments"("parent_id");

-- CreateIndex
CREATE INDEX "task_labels_task_id_idx" ON "task_labels"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_labels_task_id_name_key" ON "task_labels"("task_id", "name");

-- CreateIndex
CREATE INDEX "saved_views_project_id_idx" ON "saved_views"("project_id");

-- CreateIndex
CREATE INDEX "saved_views_user_id_idx" ON "saved_views"("user_id");

-- CreateIndex
CREATE INDEX "risk_entries_project_id_idx" ON "risk_entries"("project_id");

-- CreateIndex
CREATE INDEX "risk_entries_status_idx" ON "risk_entries"("status");

-- CreateIndex
CREATE INDEX "phase_snapshots_phase_id_idx" ON "phase_snapshots"("phase_id");

-- CreateIndex
CREATE INDEX "phase_snapshots_snapshot_date_idx" ON "phase_snapshots"("snapshot_date");

-- CreateIndex
CREATE INDEX "knowledge_pages_tenant_id_idx" ON "knowledge_pages"("tenant_id");

-- CreateIndex
CREATE INDEX "knowledge_pages_workspace_id_idx" ON "knowledge_pages"("workspace_id");

-- CreateIndex
CREATE INDEX "knowledge_pages_parent_id_idx" ON "knowledge_pages"("parent_id");

-- CreateIndex
CREATE INDEX "knowledge_pages_owner_id_idx" ON "knowledge_pages"("owner_id");

-- CreateIndex
CREATE INDEX "knowledge_pages_is_verified_idx" ON "knowledge_pages"("is_verified");

-- CreateIndex
CREATE INDEX "knowledge_pages_updated_at_idx" ON "knowledge_pages"("updated_at");

-- CreateIndex
CREATE INDEX "knowledge_pages_deleted_at_idx" ON "knowledge_pages"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_pages_tenant_id_workspace_id_slug_key" ON "knowledge_pages"("tenant_id", "workspace_id", "slug");

-- CreateIndex
CREATE INDEX "page_versions_page_id_idx" ON "page_versions"("page_id");

-- CreateIndex
CREATE INDEX "page_versions_created_at_idx" ON "page_versions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "page_versions_page_id_version_key" ON "page_versions"("page_id", "version");

-- CreateIndex
CREATE INDEX "page_embeddings_page_id_idx" ON "page_embeddings"("page_id");

-- CreateIndex
CREATE INDEX "project_pages_project_id_idx" ON "project_pages"("project_id");

-- CreateIndex
CREATE INDEX "project_pages_page_id_idx" ON "project_pages"("page_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_pages_project_id_page_id_key" ON "project_pages"("project_id", "page_id");

-- CreateIndex
CREATE INDEX "kb_page_comments_page_id_idx" ON "kb_page_comments"("page_id");

-- CreateIndex
CREATE INDEX "kb_page_comments_user_id_idx" ON "kb_page_comments"("user_id");

-- CreateIndex
CREATE INDEX "kb_page_comments_parent_id_idx" ON "kb_page_comments"("parent_id");

-- CreateIndex
CREATE INDEX "page_mentions_page_id_idx" ON "page_mentions"("page_id");

-- CreateIndex
CREATE INDEX "page_mentions_target_id_idx" ON "page_mentions"("target_id");

-- CreateIndex
CREATE INDEX "page_mentions_mention_type_idx" ON "page_mentions"("mention_type");

-- CreateIndex
CREATE INDEX "page_activities_page_id_idx" ON "page_activities"("page_id");

-- CreateIndex
CREATE INDEX "page_activities_user_id_idx" ON "page_activities"("user_id");

-- CreateIndex
CREATE INDEX "page_activities_type_idx" ON "page_activities"("type");

-- CreateIndex
CREATE INDEX "page_activities_created_at_idx" ON "page_activities"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_id_account_id_key" ON "accounts"("provider_id", "account_id");

-- AddForeignKey
ALTER TABLE "phases" ADD CONSTRAINT "phases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_teams" ADD CONSTRAINT "project_teams_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "project_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_activities" ADD CONSTRAINT "task_activities_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_relations" ADD CONSTRAINT "task_relations_source_task_id_fkey" FOREIGN KEY ("source_task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_relations" ADD CONSTRAINT "task_relations_target_task_id_fkey" FOREIGN KEY ("target_task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "task_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_entries" ADD CONSTRAINT "risk_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_snapshots" ADD CONSTRAINT "phase_snapshots_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_pages" ADD CONSTRAINT "knowledge_pages_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "knowledge_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_versions" ADD CONSTRAINT "page_versions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "knowledge_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_embeddings" ADD CONSTRAINT "page_embeddings_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "knowledge_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_pages" ADD CONSTRAINT "project_pages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_pages" ADD CONSTRAINT "project_pages_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "knowledge_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kb_page_comments" ADD CONSTRAINT "kb_page_comments_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "knowledge_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kb_page_comments" ADD CONSTRAINT "kb_page_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "kb_page_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_mentions" ADD CONSTRAINT "page_mentions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "knowledge_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_activities" ADD CONSTRAINT "page_activities_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "knowledge_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
