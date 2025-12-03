# HYVVE Platform - Task Completion Checklist

## When Completing Any Task

### 1. Code Quality
- [ ] Run linting: `pnpm lint`
- [ ] Run type check: `pnpm type-check`
- [ ] No TypeScript errors in changed files

### 2. Testing
- [ ] Run relevant tests
  - Backend: `cd apps/api && pnpm test`
  - Frontend E2E: `cd apps/web && pnpm test:e2e`
- [ ] Add tests for new functionality if applicable

### 3. Build Verification
- [ ] Ensure build passes: `pnpm build`

### 4. Multi-Tenant Check (if data changes)
- [ ] All queries filter by `workspaceId`
- [ ] No data leakage between tenants

### 5. Documentation
- [ ] Update story file status if applicable
- [ ] Update sprint-status.yaml if story complete

## Story Workflow

### Starting a Story
1. Create branch: `git checkout -b story/XX-YY-description`
2. Read story context file if exists
3. Implement changes

### Completing a Story
1. Update story file status to `done`
2. Update `docs/sprint-artifacts/sprint-status.yaml`
3. Commit with proper message format
4. Push branch: `git push -u origin <branch>`
5. Merge to main: `git checkout main && git merge <branch>`
6. Push main: `git push origin main`

## Commit Message Template
```
feat(scope): brief description

- Bullet point of change 1
- Bullet point of change 2

Story: XX-YY
Epic: EPIC-XX
```

## Quick Reference

| Action | Command |
|--------|---------|
| Lint | `pnpm lint` |
| Type Check | `pnpm type-check` |
| Build | `pnpm build` |
| Test Backend | `cd apps/api && pnpm test` |
| Test Frontend | `cd apps/web && pnpm test:e2e` |
| Format | `pnpm format` |
