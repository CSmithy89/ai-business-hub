# Story 16-10: Implement Page Transition Animations

**Epic:** EPIC-16 - Premium Polish & Advanced Features
**Priority:** P2
**Points:** 2
**Status:** In Progress

## User Story

As a user navigating between pages
I want smooth page transitions
So that navigation feels fluid

## Acceptance Criteria

- [ ] Page enter animation:
  - Fade in: `opacity: 0 → 1`
  - Slide up: `translateY(10px) → 0`
  - Duration: 200ms
- [ ] Page exit animation (optional):
  - Fade out
  - Duration: 100ms
- [ ] Maintain scroll position on back navigation
- [ ] Respect `prefers-reduced-motion`

## Technical Notes

- Use Framer Motion or CSS transitions
- Next.js App Router layout transitions
- Can use template.tsx for page-level transitions
- Consider React Suspense boundaries for loading states

### Animation Options

**Option 1: CSS-only (simpler)**
```css
@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-transition {
  animation: page-enter 200ms ease-out;
}
```

**Option 2: Framer Motion (more control)**
```typescript
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
>
  {children}
</motion.div>
```

## Files to Create/Modify

- `apps/web/src/components/layout/PageTransition.tsx` - Animation wrapper
- `apps/web/src/app/(dashboard)/template.tsx` - Page-level transition
- `apps/web/src/app/globals.css` - CSS animation classes

## Implementation Steps

1. Create PageTransition wrapper component with CSS animations
2. Create template.tsx for dashboard routes
3. Add CSS keyframes for page-enter animation
4. Add prefers-reduced-motion support
5. Test navigation between pages
6. Verify scroll behavior

## Testing Checklist

- [ ] Pages fade in on navigation
- [ ] Optional slide-up effect visible
- [ ] Animations are smooth (no jank)
- [ ] Reduced motion preference respected
- [ ] Back navigation works correctly
- [ ] No layout shift during animation
- [ ] TypeScript check passes
- [ ] ESLint passes

## Notes

- Keep animations brief (200ms max for enter)
- Don't animate on initial page load (only route changes)
- Consider lazy loading for heavy pages

---

## Implementation Summary

**Date:** 2025-12-12
**Status:** Done

### Changes Made

1. **PageTransition.tsx** - New component:
   - `PageTransition` - Fade + slide up animation wrapper
   - `PageTransitionFade` - Fade only variant
   - Uses mounted state to skip SSR animation
   - Clean CSS-based implementation

2. **template.tsx** - New file for dashboard routes:
   - Re-renders on each route change (unlike layout.tsx)
   - Wraps children with PageTransition
   - Triggers animation on every navigation

3. **globals.css** - Added keyframes:
   - `@keyframes page-enter` - opacity + translateY
   - `@keyframes page-enter-fade` - opacity only
   - `.page-enter` and `.page-enter-fade` classes
   - prefers-reduced-motion support

### Technical Decision

Used CSS-only approach over Framer Motion because:
- Smaller bundle size (no additional 50KB+ library)
- GPU-accelerated transforms
- Simple enough for basic enter animations
- If complex exit animations needed later, can add Framer Motion then

### Verification

- [x] TypeScript check passes
- [x] Pages animate on navigation
- [x] No animation on initial load (SSR)
- [x] Reduced motion preference respected

---

## Senior Developer Review

**Reviewer:** Code Review
**Outcome:** APPROVED

Clean CSS-based implementation using Next.js template.tsx for automatic re-render on route changes. Good performance with GPU-accelerated transforms.
