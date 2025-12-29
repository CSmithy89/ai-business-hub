# Story DM-01.6: CCR Routing Settings UI

## Story Overview
**Epic:** DM-01 - CopilotKit Frontend Infrastructure
**Points:** 8
**Status:** done

## Description
Extend AI Config settings with CCR (Claude Code Router) routing configuration including routing rules tab, platform subscription toggles, and fallback chain configuration.

## Acceptance Criteria
- [ ] "Routing & Fallbacks" tab added to AI Config settings subnav
- [ ] CCRRoutingConfig component renders routing mode selector
- [ ] Per-agent routing overrides can be configured
- [ ] Fallback chain configuration works
- [ ] Form validation prevents invalid configurations
- [ ] Settings persist via API calls
- [ ] Loading and error states handled properly
- [ ] Unit tests pass with ≥85% coverage

## Technical Notes
### Files to Create
- `apps/web/src/app/(dashboard)/settings/ai-config/routing/page.tsx`
- `apps/web/src/components/settings/ccr-routing-config.tsx`
- `apps/web/src/hooks/useCCRRouting.ts`
- `apps/web/src/components/settings/__tests__/ccr-routing-config.test.tsx`

### Files to Modify
- `apps/web/src/components/settings/ai-config-subnav.tsx` - Add routing nav item

### Dependencies
- Existing AI Config settings infrastructure
- shadcn/ui components (Card, Button, Select, Switch)
- React Query for state management

### Design Pattern
Follow existing AgentModelPreferences component pattern with:
- Card-based layout
- Form controls for routing mode
- Per-agent override cards
- Fallback chain drag-and-drop or select list

## Testing Requirements
- Unit: Routing mode selector changes state
- Unit: Fallback chain can be reordered
- Unit: Per-agent overrides display correctly
- Unit: Form validation works
- Integration: Mock API calls work correctly

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Code reviewed
