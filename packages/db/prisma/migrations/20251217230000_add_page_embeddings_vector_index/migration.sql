-- KB-02: pgvector ivfflat index for semantic search
-- Note: Prisma migrate does not support CONCURRENTLY.

CREATE EXTENSION IF NOT EXISTS vector;

-- B-tree index for page-scoped filtering in RAG/semantic queries
CREATE INDEX IF NOT EXISTS "page_embeddings_page_id_idx"
ON "page_embeddings" ("page_id");

CREATE INDEX IF NOT EXISTS "page_embeddings_embedding_ivfflat_idx"
ON "page_embeddings"
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 100);
