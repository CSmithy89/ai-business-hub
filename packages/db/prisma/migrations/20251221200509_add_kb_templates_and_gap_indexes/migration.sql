-- AlterTable
ALTER TABLE "knowledge_pages" ADD COLUMN "is_template" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "knowledge_pages" ADD COLUMN "template_category" VARCHAR(100);

-- CreateIndex
CREATE INDEX "knowledge_pages_is_template_idx" ON "knowledge_pages"("is_template");

-- CreateIndex
CREATE INDEX "tasks_workspace_id_deleted_at_updated_at_idx" ON "tasks"("workspace_id", "deleted_at", "updated_at");
