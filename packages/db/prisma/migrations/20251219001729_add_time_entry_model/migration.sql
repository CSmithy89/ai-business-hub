-- CreateTable
CREATE TABLE "time_entries" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "duration" DOUBLE PRECISION NOT NULL,
    "is_timer" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "time_entries_workspace_id_idx" ON "time_entries"("workspace_id");

-- CreateIndex
CREATE INDEX "time_entries_task_id_idx" ON "time_entries"("task_id");

-- CreateIndex
CREATE INDEX "time_entries_user_id_idx" ON "time_entries"("user_id");

-- CreateIndex
CREATE INDEX "time_entries_start_time_idx" ON "time_entries"("start_time");

-- CreateIndex
CREATE INDEX "time_entries_workspace_id_task_id_idx" ON "time_entries"("workspace_id", "task_id");

-- CreateIndex
CREATE INDEX "time_entries_workspace_id_user_id_start_time_idx" ON "time_entries"("workspace_id", "user_id", "start_time");

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
