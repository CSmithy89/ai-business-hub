-- ============================================
-- HYVVE Platform - Row Level Security (RLS) Policies
-- Migration: Enable RLS on Tenant-Scoped Tables
-- Created: 2025-12-02
-- Story: 03-5 - Create PostgreSQL RLS Policies
-- ============================================
--
-- This migration implements database-level tenant isolation using PostgreSQL
-- Row-Level Security (RLS). This is the first layer in our defense-in-depth
-- multi-tenancy architecture:
--
--   1. PostgreSQL RLS (this migration) - Database-level enforcement
--   2. Prisma Client Extension - ORM-level enforcement
--   3. Auth Guards - Application-level enforcement
--
-- Even if application code has bugs or is bypassed, RLS policies prevent
-- cross-tenant data leakage at the database level.
--
-- IMPORTANT: PgBouncer must use SESSION mode (not transaction mode) for
-- RLS to work correctly with current_setting() session variables.
--
-- ============================================

-- ============================================
-- ENABLE RLS ON TENANT-SCOPED TABLES
-- ============================================

-- Approval Queue
ALTER TABLE "approval_items" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "approval_items" IS 'RLS enabled: Filters by workspace_id using app.tenant_id session variable';

-- AI Provider Configuration
ALTER TABLE "ai_provider_configs" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "ai_provider_configs" IS 'RLS enabled: Filters by workspace_id using app.tenant_id session variable';

-- Token Usage Tracking
ALTER TABLE "token_usage" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "token_usage" IS 'RLS enabled: Filters by workspace_id using app.tenant_id session variable';

-- API Keys
ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "api_keys" IS 'RLS enabled: Filters by workspace_id using app.tenant_id session variable';

-- Event Logs
ALTER TABLE "event_logs" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "event_logs" IS 'RLS enabled: Filters by workspace_id using app.tenant_id session variable';

-- Audit Logs
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "audit_logs" IS 'RLS enabled: Filters by workspace_id using app.tenant_id session variable';

-- Notifications
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "notifications" IS 'RLS enabled: Filters by workspace_id using app.tenant_id session variable';

-- ============================================
-- CREATE TENANT ISOLATION POLICIES
-- ============================================
--
-- Each policy uses the same pattern:
--   USING (workspace_id::text = current_setting('app.tenant_id', true))
--
-- How it works:
--   1. Application sets session variable: SET LOCAL app.tenant_id = 'workspace-uuid'
--   2. RLS policy filters ALL operations (SELECT, INSERT, UPDATE, DELETE)
--   3. Only rows matching the tenant_id are visible/modifiable
--   4. If app.tenant_id not set, policy evaluates to false → no rows accessible
--
-- The second parameter (true) in current_setting() makes it non-throwing:
--   - Returns NULL if variable not set (instead of error)
--   - Policy evaluates to false when NULL → no access
--
-- ============================================

-- Approval Items Policy
CREATE POLICY tenant_isolation_approval_items ON "approval_items"
  FOR ALL
  USING (workspace_id::text = current_setting('app.tenant_id', true));

COMMENT ON POLICY tenant_isolation_approval_items ON "approval_items"
  IS 'Tenant isolation: Only return rows matching app.tenant_id session variable';

-- AI Provider Configs Policy
CREATE POLICY tenant_isolation_ai_provider_configs ON "ai_provider_configs"
  FOR ALL
  USING (workspace_id::text = current_setting('app.tenant_id', true));

COMMENT ON POLICY tenant_isolation_ai_provider_configs ON "ai_provider_configs"
  IS 'Tenant isolation: Only return rows matching app.tenant_id session variable';

-- Token Usage Policy
CREATE POLICY tenant_isolation_token_usage ON "token_usage"
  FOR ALL
  USING (workspace_id::text = current_setting('app.tenant_id', true));

COMMENT ON POLICY tenant_isolation_token_usage ON "token_usage"
  IS 'Tenant isolation: Only return rows matching app.tenant_id session variable';

-- API Keys Policy
CREATE POLICY tenant_isolation_api_keys ON "api_keys"
  FOR ALL
  USING (workspace_id::text = current_setting('app.tenant_id', true));

COMMENT ON POLICY tenant_isolation_api_keys ON "api_keys"
  IS 'Tenant isolation: Only return rows matching app.tenant_id session variable';

-- Event Logs Policy
CREATE POLICY tenant_isolation_event_logs ON "event_logs"
  FOR ALL
  USING (workspace_id::text = current_setting('app.tenant_id', true));

COMMENT ON POLICY tenant_isolation_event_logs ON "event_logs"
  IS 'Tenant isolation: Only return rows matching app.tenant_id session variable';

-- Audit Logs Policy
CREATE POLICY tenant_isolation_audit_logs ON "audit_logs"
  FOR ALL
  USING (workspace_id::text = current_setting('app.tenant_id', true));

COMMENT ON POLICY tenant_isolation_audit_logs ON "audit_logs"
  IS 'Tenant isolation: Only return rows matching app.tenant_id session variable';

-- Notifications Policy
CREATE POLICY tenant_isolation_notifications ON "notifications"
  FOR ALL
  USING (workspace_id::text = current_setting('app.tenant_id', true));

COMMENT ON POLICY tenant_isolation_notifications ON "notifications"
  IS 'Tenant isolation: Only return rows matching app.tenant_id session variable';

-- ============================================
-- CREATE PLATFORM ADMIN BYPASS ROLE
-- ============================================
--
-- The platform_admin role can bypass RLS for internal maintenance operations.
--
-- SECURITY WARNING: This role should ONLY be used by:
--   - Database maintenance scripts
--   - Internal admin tooling
--   - Emergency recovery operations
--
-- NEVER use this role in application code or expose it to users.
--
-- ============================================

-- Create platform admin role (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'platform_admin') THEN
    CREATE ROLE platform_admin;
  END IF;
END
$$;

-- Grant BYPASSRLS attribute to platform_admin
-- This allows the role to bypass ALL row-level security policies
ALTER ROLE platform_admin BYPASSRLS;

-- Grant necessary table permissions to platform_admin
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO platform_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO platform_admin;

COMMENT ON ROLE platform_admin IS 'Internal role for maintenance operations. Bypasses all RLS policies. NEVER use in application code.';

-- ============================================
-- VERIFICATION QUERIES (for testing)
-- ============================================
--
-- Verify RLS is enabled:
--   SELECT tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public' AND tablename LIKE '%approval%';
--
-- Verify policies exist:
--   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
--   FROM pg_policies
--   WHERE tablename IN ('approval_items', 'ai_provider_configs', 'token_usage',
--                       'api_keys', 'event_logs', 'audit_logs', 'notifications');
--
-- Test tenant isolation:
--   SET app.tenant_id = 'workspace-uuid-here';
--   SELECT * FROM approval_items; -- Should only return rows for that workspace
--
-- Test missing context:
--   RESET app.tenant_id;
--   SELECT * FROM approval_items; -- Should return 0 rows
--
-- ============================================

-- ============================================
-- ROLLBACK INSTRUCTIONS (Emergency Use Only)
-- ============================================
--
-- If RLS causes critical performance issues or breaks application functionality:
--
-- 1. Disable RLS on all tables:
--      ALTER TABLE "approval_items" DISABLE ROW LEVEL SECURITY;
--      ALTER TABLE "ai_provider_configs" DISABLE ROW LEVEL SECURITY;
--      ALTER TABLE "token_usage" DISABLE ROW LEVEL SECURITY;
--      ALTER TABLE "api_keys" DISABLE ROW LEVEL SECURITY;
--      ALTER TABLE "event_logs" DISABLE ROW LEVEL SECURITY;
--      ALTER TABLE "audit_logs" DISABLE ROW LEVEL SECURITY;
--      ALTER TABLE "notifications" DISABLE ROW LEVEL SECURITY;
--
-- 2. Drop policies:
--      DROP POLICY IF EXISTS tenant_isolation_approval_items ON "approval_items";
--      DROP POLICY IF EXISTS tenant_isolation_ai_provider_configs ON "ai_provider_configs";
--      DROP POLICY IF EXISTS tenant_isolation_token_usage ON "token_usage";
--      DROP POLICY IF EXISTS tenant_isolation_api_keys ON "api_keys";
--      DROP POLICY IF EXISTS tenant_isolation_event_logs ON "event_logs";
--      DROP POLICY IF EXISTS tenant_isolation_audit_logs ON "audit_logs";
--      DROP POLICY IF EXISTS tenant_isolation_notifications ON "notifications";
--
-- WARNING: Rolling back RLS removes a critical security layer.
-- Only do this in emergencies and restore RLS as soon as possible.
--
-- ============================================
