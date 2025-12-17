-- Add partial unique index to enforce single primary page per project
-- This prevents race conditions when setting isPrimary flag
CREATE UNIQUE INDEX IF NOT EXISTS "idx_project_single_primary"
ON "project_pages" ("project_id")
WHERE "is_primary" = true;

-- Add GIN index on favoritedBy array for efficient membership queries
-- Supports queries like: WHERE favorited_by @> ARRAY['user-id']
CREATE INDEX IF NOT EXISTS "idx_knowledge_pages_favorited_by_gin"
ON "knowledge_pages" USING GIN ("favorited_by");
