-- Add WorkspaceModule + MCPServerConfig tables
-- This migration is additive and does not modify existing tables.

-- CreateTable
CREATE TABLE "workspace_modules" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "enabled_at" TIMESTAMP(3),
    "disabled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcp_server_configs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "server_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "transport" TEXT NOT NULL,
    "command" TEXT,
    "url" TEXT,
    "api_key_encrypted" TEXT,
    "headers" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "env_vars" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "include_tools" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "exclude_tools" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "permissions" INTEGER NOT NULL DEFAULT 1,
    "timeout_seconds" INTEGER NOT NULL DEFAULT 30,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_health_check" TIMESTAMP(3),
    "health_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcp_server_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_modules_workspace_id_module_id_key" ON "workspace_modules"("workspace_id", "module_id");
CREATE INDEX "workspace_modules_workspace_id_idx" ON "workspace_modules"("workspace_id");
CREATE INDEX "workspace_modules_module_id_idx" ON "workspace_modules"("module_id");

-- CreateIndex
CREATE UNIQUE INDEX "mcp_server_configs_workspace_id_server_id_key" ON "mcp_server_configs"("workspace_id", "server_id");
CREATE INDEX "mcp_server_configs_workspace_id_idx" ON "mcp_server_configs"("workspace_id");

-- AddForeignKey
ALTER TABLE "workspace_modules" ADD CONSTRAINT "workspace_modules_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcp_server_configs" ADD CONSTRAINT "mcp_server_configs_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

