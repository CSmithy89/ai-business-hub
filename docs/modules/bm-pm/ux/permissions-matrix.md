# Core-PM Permissions Matrix (Phase 1 baseline)

This is the UX-facing permission intent. Implementation should map to platform roles/guards.

Roles:

1. **Founder/Operator** (workspace owner/manager)
2. **Team Lead / PM** (project manager)
3. **Admin** (governance)

---

## Actions × Roles

| Action | Founder/Operator | Team Lead/PM | Admin |
|--------|------------------|--------------|-------|
| Create Business | ✅ | ❌ | ✅ |
| Edit Business | ✅ | ❌ | ✅ |
| Create Product | ✅ | ✅ | ✅ |
| Edit Product | ✅ | ✅ | ✅ |
| Archive Product | ✅ | ❌ (policy) | ✅ |
| Create Phase | ✅ | ✅ | ✅ |
| Edit Phase | ✅ | ✅ | ✅ |
| Create Task | ✅ | ✅ | ✅ |
| Edit Task fields | ✅ | ✅ | ✅ |
| Move Task status | ✅ | ✅ | ✅ |
| Bulk-edit Tasks | ✅ | ✅ | ✅ |
| Request Approval | ✅ | ✅ | ✅ |
| Approve/Reject (Core-PM policies) | ✅ (policy) | ❌ (policy) | ✅ |
| View Audit | ✅ | ✅ (scoped) | ✅ |
| Create KB Page | ✅ | ✅ | ✅ |
| Edit KB Page | ✅ | ✅ | ✅ |
| Verify KB Page | ✅ | ❌ (policy) | ✅ |
| Manage Roles/Policies | ❌ (policy) | ❌ | ✅ |

Notes:

1. “Policy” means workspace-configurable: the action may be allowed but approval-gated.
2. UI should not rely on role names alone; it should use server-returned capabilities where possible.

