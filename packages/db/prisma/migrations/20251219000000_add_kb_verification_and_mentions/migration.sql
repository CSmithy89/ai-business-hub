-- Add verification fields to KnowledgePage
ALTER TABLE "knowledge_pages" ADD COLUMN IF NOT EXISTS "is_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "knowledge_pages" ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP(3);
ALTER TABLE "knowledge_pages" ADD COLUMN IF NOT EXISTS "verified_by_id" TEXT;
ALTER TABLE "knowledge_pages" ADD COLUMN IF NOT EXISTS "verify_expires" TIMESTAMP(3);

-- Add indices for verification queries
CREATE INDEX IF NOT EXISTS "knowledge_pages_is_verified_idx" ON "knowledge_pages"("is_verified");
CREATE INDEX IF NOT EXISTS "knowledge_pages_is_verified_verify_expires_idx" ON "knowledge_pages"("is_verified", "verify_expires");
CREATE INDEX IF NOT EXISTS "knowledge_pages_workspace_id_deleted_at_updated_at_idx" ON "knowledge_pages"("workspace_id", "deleted_at", "updated_at");

-- Create PageMention table
CREATE TABLE IF NOT EXISTS "page_mentions" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "mention_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_mentions_pkey" PRIMARY KEY ("id")
);

-- Add indices for PageMention
CREATE INDEX IF NOT EXISTS "page_mentions_page_id_idx" ON "page_mentions"("page_id");
CREATE INDEX IF NOT EXISTS "page_mentions_target_id_mention_type_idx" ON "page_mentions"("target_id", "mention_type");
CREATE INDEX IF NOT EXISTS "page_mentions_page_id_mention_type_idx" ON "page_mentions"("page_id", "mention_type");

-- Add foreign key constraint (idempotent - drops if exists then recreates)
ALTER TABLE "page_mentions" DROP CONSTRAINT IF EXISTS "page_mentions_page_id_fkey";
ALTER TABLE "page_mentions" ADD CONSTRAINT "page_mentions_page_id_fkey"
    FOREIGN KEY ("page_id") REFERENCES "knowledge_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
