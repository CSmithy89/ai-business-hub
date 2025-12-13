# Story 16.25: Implement Celebration Moments

Status: ready-for-dev

## Story

As a **user completing important milestones**,
I want **celebration feedback through animations**,
so that **achievements feel rewarding and the platform feels delightful**.

## Acceptance Criteria

1. **Confetti Animation Component**
   - [ ] Create Confetti component using `canvas-confetti` library
   - [ ] Confetti triggers on: completing onboarding wizard, first business creation, validation score reaching 80%+
   - [ ] Confetti uses brand colors (coral #FF6B6B, blue #4B7BEC, teal #20B2AA, orange #FF9F43, green #2ECC71)
   - [ ] Animation duration: 2-3 seconds
   - [ ] Confetti originates from both sides of screen

2. **Badge/Achievement Animation**
   - [ ] Create BadgeCelebration modal component with Framer Motion
   - [ ] Badge appears on first task completion (first approval, first business, etc.)
   - [ ] Scale-in animation with overlay backdrop
   - [ ] "Awesome!" dismiss button

3. **Character Celebration States**
   - [ ] Create CelebrationMessage component for inline celebrations
   - [ ] Show character celebration when: approval queue is empty, all notifications read
   - [ ] Subtle animation (fade in, slight bounce)

4. **Checkmark Success Animation**
   - [ ] Create animated checkmark component
   - [ ] Triggers on: successful form submission, settings saved
   - [ ] Green checkmark with circular progress/completion effect
   - [ ] Duration: 1 second

5. **Accessibility & Performance**
   - [ ] Respect `prefers-reduced-motion` media query (skip animations)
   - [ ] All animations should be brief (1-3 seconds max)
   - [ ] No animations should block user interaction
   - [ ] Cleanup canvas/elements after animation completes

6. **useCelebration Hook**
   - [ ] Create reusable hook for triggering celebrations
   - [ ] Expose `celebrate()` function and `celebrating` state
   - [ ] Support different celebration types: 'confetti', 'badge', 'checkmark', 'character'
   - [ ] Provide `onComplete` callback

## Tasks / Subtasks

### Task 1: Install canvas-confetti Library (AC: #1)
- [ ] Run `pnpm add canvas-confetti` in apps/web
- [ ] Add `@types/canvas-confetti` if needed for TypeScript

### Task 2: Create Confetti Component (AC: #1, #5)
- [ ] Create `apps/web/src/components/ui/confetti.tsx`
- [ ] Implement dual-origin confetti burst (left + right sides)
- [ ] Add brand color palette
- [ ] Implement `prefers-reduced-motion` check
- [ ] Add `onComplete` callback prop
- [ ] Test confetti visual appearance

### Task 3: Create Badge Celebration Modal (AC: #2, #5)
- [ ] Create `apps/web/src/components/ui/badge-celebration.tsx`
- [ ] Use Framer Motion for scale-in animation
- [ ] Include icon slot, title, description, dismiss button
- [ ] Dark backdrop overlay
- [ ] Focus trap and keyboard dismiss (Escape key)

### Task 4: Create Character Celebration Component (AC: #3)
- [ ] Create `apps/web/src/components/ui/celebration-message.tsx`
- [ ] Accept character prop (Hub, Maya, Atlas, Nova, Echo)
- [ ] Subtle fade-in and bounce animation
- [ ] Use existing character illustrations or fallback to emoji

### Task 5: Create Animated Checkmark Component (AC: #4, #5)
- [ ] Create `apps/web/src/components/ui/animated-checkmark.tsx`
- [ ] CSS/SVG animation for circular progress + checkmark
- [ ] Green color (#2ECC71)
- [ ] Auto-complete after 1 second

### Task 6: Create useCelebration Hook (AC: #6)
- [ ] Create `apps/web/src/hooks/use-celebration.ts`
- [ ] Manage celebration state (type, active, onComplete)
- [ ] Export `celebrate(type)` function
- [ ] Support multiple celebration types
- [ ] Provide Confetti render component

### Task 7: Integrate Celebrations into Existing Components (AC: #1, #2, #3, #4)
- [ ] Add confetti to onboarding wizard completion
- [ ] Add confetti to first business creation
- [ ] Add badge celebration for first approvals/tasks
- [ ] Add character celebration to empty approvals state
- [ ] Add checkmark to settings save confirmations

### Task 8: Testing (AC: all)
- [ ] Unit tests for useCelebration hook
- [ ] Visual test for reduced-motion behavior
- [ ] Integration test for celebration triggers

## Dev Notes

### Architecture Patterns

This story follows patterns established in Epic 16 for premium polish features:

- **Component Location**: UI components go in `apps/web/src/components/ui/`
- **Hooks Location**: Custom hooks go in `apps/web/src/hooks/`
- **Animation Library**: Use Framer Motion (already in project) for complex animations
- **Canvas Library**: Use `canvas-confetti` for confetti effect (lightweight, no dependencies)

### Key Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/components/ui/confetti.tsx` | Confetti animation component |
| `apps/web/src/components/ui/badge-celebration.tsx` | Badge/achievement modal |
| `apps/web/src/components/ui/celebration-message.tsx` | Character celebration inline |
| `apps/web/src/components/ui/animated-checkmark.tsx` | Success checkmark animation |
| `apps/web/src/hooks/use-celebration.ts` | Celebration state management hook |

### Technical Constraints

1. **canvas-confetti**: Use default canvas overlay, auto-cleanup
2. **Reduced Motion**: Check `window.matchMedia('(prefers-reduced-motion: reduce)')` and skip all animations
3. **Performance**: Animations should not cause jank; use `requestAnimationFrame`
4. **Z-Index**: Celebrations should appear above all content (z-50+)

### Project Structure Notes

- Follow existing component patterns in `apps/web/src/components/ui/`
- Hook follows pattern from `use-appearance.ts` and other Zustand-based hooks
- Framer Motion already available in project via existing animations

### Learnings from Previous Story

**From Story 16-15 (WebSocket Real-Time Updates):**

- **Pattern**: React context providers in `apps/web/src/lib/` but simple hooks directly in `apps/web/src/hooks/`
- **Testing**: Include unit tests with mock implementations
- **Integration**: Update index.ts exports when adding new hooks

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-16.md#Story-16.25] - Detailed component specs
- [Source: docs/epics/EPIC-16-premium-polish-advanced-features.md#Story-16.25] - Acceptance criteria
- [Source: docs/ux-design.md] - Brand colors and animation guidelines

### Brand Colors for Confetti

```typescript
const celebrationColors = [
  '#FF6B6B', // coral (primary)
  '#4B7BEC', // blue
  '#20B2AA', // teal
  '#FF9F43', // orange
  '#2ECC71', // green
];
```

### canvas-confetti Example

```typescript
import confetti from 'canvas-confetti';

// Dual-origin burst
confetti({
  particleCount: 100,
  spread: 70,
  origin: { x: 0, y: 0.6 },
  colors: celebrationColors,
});
confetti({
  particleCount: 100,
  spread: 70,
  origin: { x: 1, y: 0.6 },
  colors: celebrationColors,
});
```

### Dependencies

- `canvas-confetti` (to install)
- `framer-motion` (already in project)

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-13 | Story drafted from EPIC-16 tech spec | SM Agent |

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/16-25-implement-celebration-moments.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
