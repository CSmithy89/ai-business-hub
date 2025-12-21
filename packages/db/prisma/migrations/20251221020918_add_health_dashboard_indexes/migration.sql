-- CreateIndex
CREATE INDEX "projects_status_last_health_check_idx" ON "projects"("status", "last_health_check");

-- CreateIndex
CREATE INDEX "projects_health_score_idx" ON "projects"("health_score");
