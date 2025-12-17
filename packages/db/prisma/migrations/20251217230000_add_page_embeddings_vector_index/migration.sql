-- KB-02: pgvector ivfflat index for semantic search
-- Note: Prisma migrate does not support CONCURRENTLY.

CREATE INDEX IF NOT EXISTS "page_embeddings_embedding_ivfflat_idx"
ON "page_embeddings"
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 100);

