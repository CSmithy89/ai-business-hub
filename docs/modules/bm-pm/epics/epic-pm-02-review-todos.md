# Epic PM-02 Review TODOs (PR Follow-ups)

PR: https://github.com/CSmithy89/ai-business-hub/pull/22

## P1 (Fix before merge)

- [ ] **Nest DI scope**: Import `CommonModule` + `EventsModule` into `TasksModule` so `PrismaService` and `EventPublisherService` resolve.
- [ ] **Bulk route ordering**: Ensure `PATCH /pm/tasks/bulk` is declared before `PATCH /pm/tasks/:id` so it’s reachable.
- [ ] **DTO required fields**:
  - [ ] `CreateTaskRelationDto.targetTaskId` required (avoid 500s from undefined Prisma args).
  - [ ] `UpdateTaskCommentDto.content` required / non-empty (avoid `.trim()` crash).
  - [ ] `CreateTaskAttachmentDto` fields required and validate `fileUrl` as a URL.
- [ ] **Bulk update activity race**: Read “before” statuses inside the transaction so logged transitions are consistent under concurrency.

## Minor / Quality (Nice to have)

- [ ] **Task quick-capture duplicates**: Guard against creating multiple tasks while a request is pending.
- [ ] **React Query stability**:
  - [ ] Use a stable `queryKey` for task list queries (avoid refetch churn when callers create new objects each render).
  - [ ] Revisit `enabled` condition so listing by non-`projectId` filters is possible if needed.
- [ ] **Zod resolver unsafe casts**: Remove `as unknown as` casts by using `zodResolver<T>(schema)` where applicable.

## Deferred / Investigate

- [ ] **Resolver/Zod type mismatch**: `@hookform/resolvers` type defs appear brittle with current Zod minor version; removing casts may require aligning package versions.
- [ ] **DTO transform edge-cases**: Avoid null/empty-string coercion from `@Type(() => Number|Date)` for nullable fields (consider `@Transform` guards).
- [ ] **Story context XML structure**: Convert dash-prefixed text lists to structured XML elements if any tooling requires machine-readable lists.
