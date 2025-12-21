-- Fix column naming to follow snake_case convention
-- This is a safe rename that preserves existing data

-- Rename reportType to report_type for consistency
ALTER TABLE "report_schedules" RENAME COLUMN "reportType" TO "report_type";
