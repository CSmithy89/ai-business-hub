# Story 12.2: Confirm Password Field

**Epic:** EPIC-12 - UX Polish
**Status:** done
**Points:** 1
**Priority:** P2 Medium

---

## User Story

**As a** user signing up
**I want** to confirm my password
**So that** I don't accidentally create an account with a typo

---

## Acceptance Criteria

- [x] AC1: Add confirm password input field to sign-up form
- [x] AC2: Show password match indicator (green checkmark or red X)
- [x] AC3: Validate passwords match before form submission
- [x] AC4: Show inline error message if passwords don't match
- [x] AC5: Both fields share same show/hide toggle behavior

---

## Implementation Notes

### Current State
- Confirm password field already exists in sign-up form
- Validation schema already has password matching validation
- Both fields have separate show/hide toggles

### Work Needed
- Add password match indicator (Check icon when passwords match, X icon when they don't)
- Indicator should only show when confirmPassword has value
- Position indicator inside the input field next to the show/hide toggle

---

## Files Modified

- `apps/web/src/components/auth/sign-up-form.tsx` - Add password match indicator

---

## Technical Details

### Password Match Indicator Logic
```typescript
const confirmPassword = watch('confirmPassword', '')
const passwordsMatch = password && confirmPassword && password === confirmPassword
const showMatchIndicator = confirmPassword.length > 0
```

### Visual Requirements
- Green checkmark (Check icon) when passwords match
- Red X icon when passwords don't match
- Only show when confirmPassword field has value
- Position: Inside input field, before the show/hide toggle

---

## Definition of Done

- [x] Confirm password field exists in sign-up form
- [x] Password match indicator shows appropriate icon
- [x] Indicator only appears when confirmPassword has value
- [x] Validation prevents form submission when passwords don't match
- [x] TypeScript type checking passes
- [x] Implementation matches wireframe AU-02

---

## Testing Notes

### Manual Test Cases
1. Type password in password field - no indicator shows
2. Start typing in confirm password field - indicator appears
3. Type matching password - green checkmark appears
4. Type non-matching password - red X appears
5. Clear confirm password field - indicator disappears
6. Submit form with non-matching passwords - error message shows

---

_Created: 2025-12-06_
_Wireframe: AU-02_
