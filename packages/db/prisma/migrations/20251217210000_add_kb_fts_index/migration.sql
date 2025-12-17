-- CreateIndex
-- Add full-text search index on knowledge_pages.content_text
-- Uses PostgreSQL's GIN index with to_tsvector for efficient text search

CREATE INDEX IF NOT EXISTS "knowledge_pages_content_text_fts_idx"
ON "knowledge_pages"
USING GIN (to_tsvector('english', "content_text"));

-- Add comment for documentation
COMMENT ON INDEX "knowledge_pages_content_text_fts_idx" IS 'Full-text search index for KB pages using PostgreSQL tsvector';
