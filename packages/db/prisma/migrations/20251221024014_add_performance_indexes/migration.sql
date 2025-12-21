-- CreateIndex
CREATE INDEX "health_scores_project_id_calculated_at_idx" ON "health_scores"("project_id", "calculated_at");

-- CreateIndex
CREATE INDEX "risk_entries_project_id_status_detected_at_idx" ON "risk_entries"("project_id", "status", "detected_at");

-- CreateIndex
CREATE INDEX "tasks_project_id_deleted_at_updated_at_idx" ON "tasks"("project_id", "deleted_at", "updated_at");
