## Summary

<!-- Brief description of the changes (1-3 sentences) -->

## Type of Change

<!-- Check all that apply -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Test improvements
- [ ] CI/CD changes

## Related Issues

<!-- Link any related issues using "Fixes #123" or "Related to #123" -->

## Changes Made

<!-- List the specific changes made in this PR -->

-
-
-

## Testing

### Test Plan

<!-- Describe how you tested these changes -->

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

### Manual Testing Steps

<!-- Steps for reviewers to verify the changes -->

1.
2.
3.

## Screenshots

<!-- If UI changes, include before/after screenshots -->

| Before | After |
|--------|-------|
| | |

## Checklist

<!-- Ensure all items are checked before requesting review -->

### Code Quality

- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] My changes generate no new warnings
- [ ] TypeScript check passes (`pnpm type-check`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)

### Testing

- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally

### Documentation & Comments

- [ ] I have updated the documentation (if applicable)
- [ ] All comments accurately describe current behavior (no stale comments)
- [ ] No comments describe removed/changed functionality without update
- [ ] No TODO comments without linked issue

### PR Size & Scope

- [ ] PR has focused scope (single epic or related stories)
  <!-- If 50+ files: Ensure changes are cohesive (related refactoring is OK) -->
  <!-- If 100+ files: Consider splitting or get explicit approval for large refactor -->

## Multi-Tenant Considerations

<!-- If your changes affect data storage or queries -->

- [ ] Changes respect tenant isolation (tenantId filtering)
- [ ] RLS policies considered (if adding new tables)
- [ ] No cross-tenant data leakage possible

## Security Considerations

<!-- If your changes have security implications -->
<!-- For security-sensitive PRs, review [Security Checklist](docs/security/review-checklist.md) -->

- [ ] Input validation implemented
- [ ] No sensitive data logged
- [ ] Authentication/authorization checked
- [ ] No new security vulnerabilities introduced
- [ ] Reviewed security checklist (if touching auth, WebSocket, or user input)

## Additional Notes

<!-- Any additional context for reviewers -->

