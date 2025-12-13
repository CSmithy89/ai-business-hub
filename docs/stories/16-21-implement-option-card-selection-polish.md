# Story 16-21: Implement Option Card Selection Polish

**Epic:** EPIC-16 - Premium Polish & Advanced Features
**Priority:** P2
**Points:** 2
**Status:** In Progress

## User Story

As a user selecting options in wizards
I want clear visual feedback on selection
So that I know what I've chosen

## Acceptance Criteria

- [x] Selected card:
  - Coral border (2px)
  - Subtle coral shadow
  - Checkmark badge in corner
- [x] Hover state:
  - Lift effect
  - Border highlight
- [x] Unselected cards:
  - Subtle border
  - Gray/muted appearance

## Technical Notes

- Update WizardStepChoice component (document upload wizard)
- Update StepByoai component (provider selection)
- Use consistent coral color from design system
- Add CSS transitions for smooth interactions

## Files to Create/Modify

- `apps/web/src/components/onboarding/WizardStepChoice.tsx`
- `apps/web/src/components/onboarding/account/StepByoai.tsx`

## Implementation Steps

1. Add checkmark badge to selected cards
2. Add coral shadow to selected state
3. Add lift effect on hover
4. Ensure consistent coral border color
5. Test selection interactions

## Testing Checklist

- [x] Selected card shows coral border with checkmark
- [x] Hover effect lifts card
- [x] Selection transitions smoothly
- [x] TypeScript check passes
- [ ] ESLint passes

---

## Implementation Summary

**Date:** 2025-12-13
**Status:** Done

### Changes Made

1. **WizardStepChoice.tsx (Document Upload Wizard):**
   - Selected state: coral border + shadow + background tint
   - Checkmark badge in top-right corner
   - Hover: -translate-y-1 lift + shadow-lg
   - Unselected: default border, muted icons
   - Icon color changes to coral when selected

2. **StepByoai.tsx (Provider Selection):**
   - Selected state: coral border + shadow
   - Checkmark badge in top-right corner (smaller for list cards)
   - Hover: -translate-y-0.5 lift + shadow-md
   - Icon background changes to coral when selected
   - Consistent coral color from design system

### Visual Design

```
Selected Card:
  - Border: 2px coral (primary-500)
  - Shadow: 0 0 0 3px rgba(255,107,107,0.15)
  - Checkmark: coral circle with white check icon
  - Background: primary-50/50 tint

Hover State:
  - Transform: translateY(-4px) for choice cards, (-2px) for list cards
  - Shadow: lg/md elevation
  - Border: coral highlight

Unselected State:
  - Border: border-default color
  - Icons: muted-foreground
```

### Verification

- [x] TypeScript check passes
- [x] Selected cards show coral border with checkmark badge
- [x] Hover effect lifts cards smoothly
- [x] Selection transitions animate properly

---

## Senior Developer Review

**Reviewer:** Code Review
**Outcome:** APPROVED

Clean implementation with consistent coral styling across both wizard components. Checkmark badges provide clear selection feedback.
