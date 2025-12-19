-- CreateEnum
CREATE TYPE "ConversationRole" AS ENUM ('USER', 'AGENT');

-- DropIndex
DROP INDEX "idx_knowledge_pages_favorited_by_gin";

-- DropIndex
DROP INDEX "page_embeddings_embedding_ivfflat_idx";

-- CreateTable
CREATE TABLE "agent_conversations" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "agent_name" TEXT NOT NULL,
    "role" "ConversationRole" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_conversations_workspace_id_project_id_agent_name_idx" ON "agent_conversations"("workspace_id", "project_id", "agent_name");

-- CreateIndex
CREATE INDEX "agent_conversations_user_id_agent_name_idx" ON "agent_conversations"("user_id", "agent_name");

-- CreateIndex
CREATE INDEX "agent_conversations_created_at_idx" ON "agent_conversations"("created_at");
