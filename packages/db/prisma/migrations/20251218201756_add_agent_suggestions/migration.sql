-- CreateEnum
CREATE TYPE "SuggestionType" AS ENUM ('CREATE_TASK', 'UPDATE_TASK', 'ASSIGN_TASK', 'MOVE_PHASE', 'SET_PRIORITY', 'SCHEDULE_TASK', 'ADD_DEPENDENCY', 'REMOVE_BLOCKER', 'GENERAL');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'SNOOZED', 'EXPIRED');

-- CreateTable
CREATE TABLE "agent_suggestions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "agent_name" TEXT NOT NULL,
    "suggestion_type" "SuggestionType" NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reasoning" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "action_payload" JSONB NOT NULL,
    "snoozed_until" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_suggestions_workspace_id_project_id_idx" ON "agent_suggestions"("workspace_id", "project_id");

-- CreateIndex
CREATE INDEX "agent_suggestions_user_id_status_idx" ON "agent_suggestions"("user_id", "status");

-- CreateIndex
CREATE INDEX "agent_suggestions_agent_name_status_idx" ON "agent_suggestions"("agent_name", "status");

-- CreateIndex
CREATE INDEX "agent_suggestions_status_created_at_idx" ON "agent_suggestions"("status", "created_at");

-- CreateIndex
CREATE INDEX "agent_suggestions_expires_at_idx" ON "agent_suggestions"("expires_at");
