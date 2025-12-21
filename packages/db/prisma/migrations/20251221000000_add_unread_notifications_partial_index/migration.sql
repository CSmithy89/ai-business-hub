-- Add partial index for unread notifications
-- This improves query performance for common "get unread notifications" queries
-- Prisma doesn't support partial indexes directly, hence raw SQL migration

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_unread"
ON "notifications" ("user_id", "created_at" DESC)
WHERE "read_at" IS NULL;
