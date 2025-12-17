-- Story: PM-01.9 - Budget Tracking
-- Add project_expenses table to support manual expense entry (MVP).

CREATE TABLE IF NOT EXISTS "project_expenses" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "description" TEXT,
  "spent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "project_expenses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_expenses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "project_expenses_project_id_idx" ON "project_expenses"("project_id");
CREATE INDEX IF NOT EXISTS "project_expenses_spent_at_idx" ON "project_expenses"("spent_at");

