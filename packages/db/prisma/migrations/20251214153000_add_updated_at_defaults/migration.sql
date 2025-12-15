-- DB hardening: ensure updated_at has a default for new rows
-- Prisma will still manage updatedAt via @updatedAt, but a DB-level default
-- prevents failures for raw inserts and reduces foot-guns during migrations.

ALTER TABLE "workspace_modules"
  ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "mcp_server_configs"
  ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

