-- AlterTable
ALTER TABLE "knowledge_pages" ADD COLUMN "favorited_by" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "project_pages" ADD COLUMN "linked_by" TEXT NOT NULL DEFAULT 'system';

-- CreateIndex
CREATE INDEX "project_pages_is_primary_idx" ON "project_pages"("is_primary");

-- Remove default after adding column
ALTER TABLE "project_pages" ALTER COLUMN "linked_by" DROP DEFAULT;
