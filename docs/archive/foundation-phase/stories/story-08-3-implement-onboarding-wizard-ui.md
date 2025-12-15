# Story 08.3: Implement Onboarding Wizard UI

**Story ID:** 08.3
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Points:** 5
**Priority:** P0 - Critical
**Status:** done
**Dependencies:** Story 08.2 (Portfolio Dashboard with Business Cards)

---

## User Story

**As a** user
**I want** a guided onboarding wizard
**So that** I can start a new business with clear steps

---

## Acceptance Criteria

### AC-08.3.1: Multi-Step Wizard Component
- [ ] Wizard displays 4 distinct steps with progress indicator
- [ ] Progress indicator shows current step (e.g., "Step 1/4")
- [ ] Visual progress bar or stepper component shows completion
- [ ] Each step can be validated independently before proceeding
- [ ] Wizard follows existing UI patterns from Epic 07

### AC-08.3.2: Step 1 - Document Upload vs Fresh Start Choice
- [ ] Step 1 presents two clear options:
  - "I have existing documents" (upload path)
  - "Start from scratch" (guided path)
- [ ] Each option has descriptive text explaining what happens next
- [ ] Cards are visually distinct (icon, border, hover state)
- [ ] Selection stores choice in wizard state
- [ ] Continue button navigates to Step 2

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Start a New Business                                  Step 1/4 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Do you have existing business documents?                       │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │  📄 I have documents    │  │  ✨ Start from scratch      │  │
│  │  Upload and we'll       │  │  AI will guide you through  │  │
│  │  identify gaps          │  │  the complete process       │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
│                                                                 │
│                              [Continue →]                       │
└─────────────────────────────────────────────────────────────────┘
```

### AC-08.3.3: Step 2 - Business Name and Description
- [ ] Form captures:
  - Business name (required, max 100 chars)
  - Business description (required, max 500 chars, textarea)
- [ ] Real-time validation with error messages
- [ ] Character count displayed for description field
- [ ] "Back" button returns to Step 1 (preserves previous selections)
- [ ] "Continue" button validates and proceeds to Step 3
- [ ] Form validation uses Zod schema

**Validation Rules:**
- Business name: Required, 3-100 characters, no special characters except spaces and hyphens
- Description: Required, 10-500 characters

### AC-08.3.4: Step 3 - Initial Idea Capture
- [ ] Form captures initial business idea details:
  - Problem statement (required, textarea, max 300 chars)
  - Target customer (required, text input, max 200 chars)
  - Proposed solution (required, textarea, max 300 chars)
- [ ] Each field has helper text explaining what to enter
- [ ] Real-time validation with character counts
- [ ] "Back" button returns to Step 2 (preserves data)
- [ ] "Continue" button validates and proceeds to Step 4

**Helper Text Examples:**
- Problem: "What problem are you solving? (e.g., SMBs struggle with outdated CRM systems)"
- Target Customer: "Who is your ideal customer? (e.g., Small businesses with 5-50 employees)"
- Solution: "How will you solve this problem? (e.g., AI-powered CRM that automates data entry)"

### AC-08.3.5: Step 4 - Confirmation and Launch
- [ ] Displays summary of all entered information:
  - Chosen path (Documents or Fresh Start)
  - Business name
  - Description
  - Problem, Target Customer, Solution
- [ ] Each section has "Edit" button to jump back to that step
- [ ] "Back" button returns to Step 3
- [ ] "Launch Business" button creates business record and navigates to appropriate next step
- [ ] Loading state during business creation
- [ ] Error handling for failed creation

### AC-08.3.6: Progress Indicator
- [ ] Progress indicator always visible at top of wizard
- [ ] Shows current step number (e.g., "Step 2/4")
- [ ] Visual stepper shows completed, current, and upcoming steps
- [ ] Step labels: "Choice", "Details", "Idea", "Launch"
- [ ] Clicking completed steps allows navigation back (preserves data)

### AC-08.3.7: Navigation Between Steps
- [ ] "Back" button visible on steps 2-4
- [ ] "Continue" button validates current step before proceeding
- [ ] Keyboard navigation supported (Enter to continue)
- [ ] Browser back button works correctly (no data loss)
- [ ] URL parameter reflects current step (e.g., `/onboarding/wizard?step=2`)

### AC-08.3.8: Persist Wizard State (Resume if Abandoned)
- [ ] Wizard state saved to localStorage on each step change
- [ ] If user abandons wizard, state is preserved
- [ ] Returning to wizard resumes from last completed step
- [ ] "Start Over" option available to clear saved state
- [ ] Saved state includes all form data and current step
- [ ] State expires after 7 days

### AC-08.3.9: Create Business Record on Completion
- [ ] On "Launch Business" click, API call creates Business record
- [ ] Business record includes:
  - workspaceId from session
  - userId from session
  - name, description from wizard
  - onboardingStatus: VALIDATION (or WIZARD if upload path)
  - stage: IDEA (default)
- [ ] ValidationSession record created with ideaDescription populated
- [ ] Success: Navigate to appropriate next step:
  - If "Upload Documents": Navigate to document upload page (Story 08.4)
  - If "Fresh Start": Navigate to validation page (Story 08.6)
- [ ] Error: Display error message, allow retry
- [ ] Loading state prevents duplicate submissions

---

## Technical Implementation

### Components to Create

#### 1. `OnboardingWizard` Component
**Location:** `/apps/web/src/app/(onboarding)/onboarding/wizard/page.tsx`

**Responsibilities:**
- Orchestrate multi-step wizard flow
- Manage wizard state (current step, form data)
- Handle navigation between steps
- Save/restore state from localStorage
- Create business on completion

**State Management:**
```typescript
interface WizardState {
  currentStep: number;
  hasDocuments: boolean | null;
  businessName: string;
  businessDescription: string;
  problemStatement: string;
  targetCustomer: string;
  proposedSolution: string;
}
```

**Zustand Store:**
```typescript
// apps/web/src/stores/onboarding-wizard-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingWizardStore {
  currentStep: number;
  hasDocuments: boolean | null;
  businessName: string;
  businessDescription: string;
  problemStatement: string;
  targetCustomer: string;
  proposedSolution: string;

  setCurrentStep: (step: number) => void;
  setHasDocuments: (hasDocuments: boolean) => void;
  setBusinessName: (name: string) => void;
  setBusinessDescription: (description: string) => void;
  setProblemStatement: (problem: string) => void;
  setTargetCustomer: (customer: string) => void;
  setProposedSolution: (solution: string) => void;
  reset: () => void;
}

export const useOnboardingWizardStore = create<OnboardingWizardStore>()(
  persist(
    (set) => ({
      currentStep: 1,
      hasDocuments: null,
      businessName: '',
      businessDescription: '',
      problemStatement: '',
      targetCustomer: '',
      proposedSolution: '',

      setCurrentStep: (step) => set({ currentStep: step }),
      setHasDocuments: (hasDocuments) => set({ hasDocuments }),
      setBusinessName: (businessName) => set({ businessName }),
      setBusinessDescription: (businessDescription) => set({ businessDescription }),
      setProblemStatement: (problemStatement) => set({ problemStatement }),
      setTargetCustomer: (targetCustomer) => set({ targetCustomer }),
      setProposedSolution: (proposedSolution) => set({ proposedSolution }),
      reset: () => set({
        currentStep: 1,
        hasDocuments: null,
        businessName: '',
        businessDescription: '',
        problemStatement: '',
        targetCustomer: '',
        proposedSolution: '',
      }),
    }),
    {
      name: 'onboarding-wizard',
      partialize: (state) => ({
        currentStep: state.currentStep,
        hasDocuments: state.hasDocuments,
        businessName: state.businessName,
        businessDescription: state.businessDescription,
        problemStatement: state.problemStatement,
        targetCustomer: state.targetCustomer,
        proposedSolution: state.proposedSolution,
      }),
    }
  )
);
```

#### 2. `WizardStep` Components

**Step 1: `WizardStepChoice`**
**Location:** `/apps/web/src/components/onboarding/WizardStepChoice.tsx`

**Props:**
```typescript
interface WizardStepChoiceProps {
  onContinue: (hasDocuments: boolean) => void;
}
```

**Features:**
- Two large option cards (Documents vs Fresh Start)
- Visual differentiation (icons, colors)
- Hover states
- Selected state highlighting
- Accessible keyboard navigation

**Design Pattern:**
```tsx
<div className="space-y-8">
  <div>
    <h2 className="text-2xl font-bold">Do you have existing business documents?</h2>
    <p className="text-muted-foreground">Choose how you'd like to start</p>
  </div>

  <div className="grid gap-6 md:grid-cols-2">
    <Card
      className={cn(
        "cursor-pointer border-2 transition-all hover:border-primary",
        selectedOption === 'documents' && "border-primary bg-primary/5"
      )}
      onClick={() => setSelectedOption('documents')}
      role="button"
      tabIndex={0}
    >
      <CardContent className="flex flex-col items-center p-8 text-center">
        <FileText className="mb-4 h-12 w-12 text-primary" />
        <h3 className="mb-2 text-xl font-semibold">I have documents</h3>
        <p className="text-sm text-muted-foreground">
          Upload existing business plans, market research, or brand guidelines.
          AI will extract information and identify gaps.
        </p>
      </CardContent>
    </Card>

    <Card
      className={cn(
        "cursor-pointer border-2 transition-all hover:border-primary",
        selectedOption === 'fresh' && "border-primary bg-primary/5"
      )}
      onClick={() => setSelectedOption('fresh')}
      role="button"
      tabIndex={0}
    >
      <CardContent className="flex flex-col items-center p-8 text-center">
        <Sparkles className="mb-4 h-12 w-12 text-primary" />
        <h3 className="mb-2 text-xl font-semibold">Start from scratch</h3>
        <p className="text-sm text-muted-foreground">
          AI will guide you through the complete process: validation, planning, and branding.
        </p>
      </CardContent>
    </Card>
  </div>

  <div className="flex justify-end">
    <Button onClick={handleContinue} disabled={!selectedOption} size="lg">
      Continue
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  </div>
</div>
```

**Step 2: `WizardStepDetails`**
**Location:** `/apps/web/src/components/onboarding/WizardStepDetails.tsx`

**Props:**
```typescript
interface WizardStepDetailsProps {
  onContinue: (data: { name: string; description: string }) => void;
  onBack: () => void;
  initialData?: { name: string; description: string };
}
```

**Features:**
- React Hook Form with Zod validation
- Real-time error display
- Character count for description
- Accessible form labels and error messages

**Zod Schema:**
```typescript
// apps/web/src/lib/validations/onboarding.ts
import { z } from 'zod';

export const businessDetailsSchema = z.object({
  name: z
    .string()
    .min(3, 'Business name must be at least 3 characters')
    .max(100, 'Business name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Business name can only contain letters, numbers, spaces, and hyphens'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters'),
});

export type BusinessDetailsFormData = z.infer<typeof businessDetailsSchema>;
```

**Step 3: `WizardStepIdea`**
**Location:** `/apps/web/src/components/onboarding/WizardStepIdea.tsx`

**Props:**
```typescript
interface WizardStepIdeaProps {
  onContinue: (data: IdeaFormData) => void;
  onBack: () => void;
  initialData?: IdeaFormData;
}

interface IdeaFormData {
  problemStatement: string;
  targetCustomer: string;
  proposedSolution: string;
}
```

**Zod Schema:**
```typescript
export const businessIdeaSchema = z.object({
  problemStatement: z
    .string()
    .min(10, 'Problem statement must be at least 10 characters')
    .max(300, 'Problem statement must not exceed 300 characters'),
  targetCustomer: z
    .string()
    .min(5, 'Target customer must be at least 5 characters')
    .max(200, 'Target customer must not exceed 200 characters'),
  proposedSolution: z
    .string()
    .min(10, 'Proposed solution must be at least 10 characters')
    .max(300, 'Proposed solution must not exceed 300 characters'),
});

export type BusinessIdeaFormData = z.infer<typeof businessIdeaSchema>;
```

**Step 4: `WizardStepConfirm`**
**Location:** `/apps/web/src/components/onboarding/WizardStepConfirm.tsx`

**Props:**
```typescript
interface WizardStepConfirmProps {
  wizardData: WizardState;
  onLaunch: () => Promise<void>;
  onBack: () => void;
  onEdit: (step: number) => void;
}
```

**Features:**
- Summary view of all entered data
- Edit buttons for each section
- Loading state during business creation
- Error handling with retry option

**Design Pattern:**
```tsx
<div className="space-y-6">
  <div>
    <h2 className="text-2xl font-bold">Review and Launch</h2>
    <p className="text-muted-foreground">Review your information before launching</p>
  </div>

  {/* Summary Sections */}
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Business Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <div className="text-sm text-muted-foreground">Business Name</div>
          <div className="font-medium">{wizardData.businessName}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Description</div>
          <div>{wizardData.businessDescription}</div>
        </div>
      </CardContent>
    </Card>

    {/* Similar cards for Idea details */}
  </div>

  <div className="flex justify-between">
    <Button variant="outline" onClick={onBack}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back
    </Button>
    <Button onClick={onLaunch} disabled={isLoading} size="lg">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          Launch Business
          <Rocket className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  </div>
</div>
```

#### 3. `WizardProgress` Component
**Location:** `/apps/web/src/components/onboarding/WizardProgress.tsx`

**Props:**
```typescript
interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  onStepClick?: (step: number) => void;
}
```

**Features:**
- Visual stepper with completed/current/upcoming states
- Step numbers and labels
- Progress percentage bar
- Clickable completed steps (optional)

**Design Pattern:**
```tsx
<div className="mb-8">
  <div className="flex items-center justify-between mb-2">
    <div className="text-sm text-muted-foreground">
      Step {currentStep} of {totalSteps}
    </div>
    <div className="text-sm font-medium">
      {Math.round((currentStep / totalSteps) * 100)}% Complete
    </div>
  </div>

  {/* Progress Bar */}
  <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
    <div
      className="h-full bg-primary transition-all duration-300"
      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
    />
  </div>

  {/* Step Labels */}
  <div className="flex items-center justify-between">
    {stepLabels.map((label, index) => {
      const stepNumber = index + 1;
      const isCompleted = stepNumber < currentStep;
      const isCurrent = stepNumber === currentStep;

      return (
        <div key={stepNumber} className="flex flex-col items-center">
          <div
            className={cn(
              "mb-2 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
              isCompleted && "border-primary bg-primary text-primary-foreground",
              isCurrent && "border-primary bg-background text-primary",
              !isCompleted && !isCurrent && "border-muted-foreground/30 bg-background text-muted-foreground"
            )}
          >
            {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
          </div>
          <div
            className={cn(
              "text-xs",
              isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
            )}
          >
            {label}
          </div>
        </div>
      );
    })}
  </div>
</div>
```

### API Endpoints

#### POST `/api/businesses`
**Request:**
```typescript
{
  name: string;
  description: string;
  hasDocuments: boolean;
  ideaDescription: {
    problemStatement: string;
    targetCustomer: string;
    proposedSolution: string;
  };
}
```

**Response:**
```typescript
{
  data: {
    id: string;
    workspaceId: string;
    userId: string;
    name: string;
    description: string;
    onboardingStatus: OnboardingStatus;
    stage: BusinessStage;
    createdAt: string;
  }
}
```

**Implementation:**
```typescript
// apps/web/src/app/api/businesses/route.ts
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = session.user.activeWorkspaceId;

  try {
    const body = await req.json();
    const { name, description, hasDocuments, ideaDescription } = body;

    // Validate input
    const validation = businessCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors }, { status: 400 });
    }

    // Create business with ValidationSession
    const business = await prisma.business.create({
      data: {
        workspaceId,
        userId: session.user.id,
        name,
        description,
        stage: 'IDEA',
        onboardingStatus: hasDocuments ? 'WIZARD' : 'VALIDATION',
        validationData: {
          create: {
            ideaDescription: JSON.stringify(ideaDescription),
            problemStatement: ideaDescription.problemStatement,
            targetCustomer: ideaDescription.targetCustomer,
            proposedSolution: ideaDescription.proposedSolution,
          },
        },
      },
      include: {
        validationData: true,
      },
    });

    return NextResponse.json({ data: business }, { status: 201 });
  } catch (error) {
    console.error('Business creation error:', error);
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 });
  }
}
```

### Form Validation Schemas

**Location:** `/apps/web/src/lib/validations/onboarding.ts`

```typescript
import { z } from 'zod';

export const businessDetailsSchema = z.object({
  name: z
    .string()
    .min(3, 'Business name must be at least 3 characters')
    .max(100, 'Business name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Business name can only contain letters, numbers, spaces, and hyphens'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters'),
});

export const businessIdeaSchema = z.object({
  problemStatement: z
    .string()
    .min(10, 'Problem statement must be at least 10 characters')
    .max(300, 'Problem statement must not exceed 300 characters'),
  targetCustomer: z
    .string()
    .min(5, 'Target customer must be at least 5 characters')
    .max(200, 'Target customer must not exceed 200 characters'),
  proposedSolution: z
    .string()
    .min(10, 'Proposed solution must be at least 10 characters')
    .max(300, 'Proposed solution must not exceed 300 characters'),
});

export const businessCreateSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  hasDocuments: z.boolean(),
  ideaDescription: z.object({
    problemStatement: z.string().min(10).max(300),
    targetCustomer: z.string().min(5).max(200),
    proposedSolution: z.string().min(10).max(300),
  }),
});

export type BusinessDetailsFormData = z.infer<typeof businessDetailsSchema>;
export type BusinessIdeaFormData = z.infer<typeof businessIdeaSchema>;
export type BusinessCreateData = z.infer<typeof businessCreateSchema>;
```

### Routing Structure

```
/onboarding/wizard              → Main wizard page (orchestrates steps)
/onboarding/wizard?step=1       → Step 1: Choice
/onboarding/wizard?step=2       → Step 2: Details
/onboarding/wizard?step=3       → Step 3: Idea
/onboarding/wizard?step=4       → Step 4: Confirm

After completion:
- If hasDocuments=true → /onboarding/documents?businessId={id} (Story 08.4)
- If hasDocuments=false → /dashboard/{id}/validation (Story 08.6)
```

### State Persistence Strategy

**LocalStorage Key:** `onboarding-wizard`

**Stored Data:**
```typescript
{
  currentStep: number;
  hasDocuments: boolean | null;
  businessName: string;
  businessDescription: string;
  problemStatement: string;
  targetCustomer: string;
  proposedSolution: string;
  timestamp: number;  // For expiration check
}
```

**Expiration:** 7 days (604800000 ms)

**Implementation:**
- Use Zustand's `persist` middleware
- Check timestamp on load, clear if >7 days old
- "Start Over" button clears localStorage

---

## UI Wireframe

### Step 1 - Choice
```
┌─────────────────────────────────────────────────────────────────┐
│  🏢 Start a New Business                           Step 1 of 4  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Progress: ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 25%           │
│  [1] ──── [2] ──── [3] ──── [4]                                │
│  Choice  Details  Idea   Launch                                │
│                                                                 │
│  Do you have existing business documents?                       │
│  Choose how you'd like to start                                │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │  📄                     │  │  ✨                         │  │
│  │  I have documents       │  │  Start from scratch         │  │
│  │                         │  │                             │  │
│  │  Upload existing        │  │  AI will guide you          │  │
│  │  business plans, market │  │  through the complete       │  │
│  │  research, or brand     │  │  process: validation,       │  │
│  │  guidelines. AI will    │  │  planning, and branding.    │  │
│  │  extract information    │  │                             │  │
│  │  and identify gaps.     │  │                             │  │
│  │                         │  │                             │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
│                                                                 │
│                                            [Continue →]         │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2 - Details
```
┌─────────────────────────────────────────────────────────────────┐
│  🏢 Start a New Business                           Step 2 of 4  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Progress: ████████████████░░░░░░░░░░░░░░░░░░] 50%            │
│  [✓] ──── [2] ──── [3] ──── [4]                                │
│  Choice  Details  Idea   Launch                                │
│                                                                 │
│  Tell us about your business                                   │
│                                                                 │
│  Business Name *                                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ My Business Name                                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│  0/100 characters                                              │
│                                                                 │
│  Business Description *                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ A brief description of what your business does...        │ │
│  │                                                           │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│  0/500 characters                                              │
│                                                                 │
│  [← Back]                                      [Continue →]    │
└─────────────────────────────────────────────────────────────────┘
```

### Step 3 - Idea
```
┌─────────────────────────────────────────────────────────────────┐
│  🏢 Start a New Business                           Step 3 of 4  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Progress: ████████████████████████░░░░░░░░] 75%              │
│  [✓] ──── [✓] ──── [3] ──── [4]                                │
│  Choice  Details  Idea   Launch                                │
│                                                                 │
│  Capture your business idea                                    │
│                                                                 │
│  Problem Statement *                                           │
│  What problem are you solving?                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ SMBs struggle with...                                     │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│  0/300 characters                                              │
│                                                                 │
│  Target Customer *                                             │
│  Who is your ideal customer?                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Small businesses with 5-50 employees                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│  0/200 characters                                              │
│                                                                 │
│  Proposed Solution *                                           │
│  How will you solve this problem?                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ AI-powered platform that...                               │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│  0/300 characters                                              │
│                                                                 │
│  [← Back]                                      [Continue →]    │
└─────────────────────────────────────────────────────────────────┘
```

### Step 4 - Confirm
```
┌─────────────────────────────────────────────────────────────────┐
│  🏢 Start a New Business                           Step 4 of 4  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Progress: ████████████████████████████████████] 100%         │
│  [✓] ──── [✓] ──── [✓] ──── [4]                                │
│  Choice  Details  Idea   Launch                                │
│                                                                 │
│  Review and Launch                                             │
│  Review your information before launching                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📄 Starting Method                              [Edit]    │ │
│  │ ─────────────────────────────────────────────────────────│ │
│  │ Starting from scratch with AI guidance                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🏢 Business Details                             [Edit]    │ │
│  │ ─────────────────────────────────────────────────────────│ │
│  │ Name: My Business Name                                   │ │
│  │ Description: A brief description of what your...         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 💡 Business Idea                                [Edit]    │ │
│  │ ─────────────────────────────────────────────────────────│ │
│  │ Problem: SMBs struggle with...                           │ │
│  │ Target: Small businesses with 5-50 employees             │ │
│  │ Solution: AI-powered platform that...                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [← Back]                              [🚀 Launch Business]    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing Requirements

### Unit Tests

1. **WizardProgress Component:**
   - Renders correct number of steps
   - Highlights current step
   - Shows completed steps with checkmark
   - Progress bar reflects current step percentage

2. **WizardStepChoice Component:**
   - Renders two option cards
   - Handles selection state
   - Enables Continue button only when option selected
   - Keyboard navigation works

3. **WizardStepDetails Component:**
   - Form validation with Zod schema
   - Character count updates in real-time
   - Error messages display correctly
   - Form submission triggers onContinue with validated data

4. **WizardStepIdea Component:**
   - Form validation for all three fields
   - Helper text displays correctly
   - Character counts update
   - Back button preserves form data

5. **WizardStepConfirm Component:**
   - Displays all wizard data correctly
   - Edit buttons navigate to correct steps
   - Launch button shows loading state
   - Error handling displays error message

6. **Zustand Store:**
   - State updates correctly
   - LocalStorage persistence works
   - State restoration on page reload
   - Reset function clears all data

### Integration Tests

1. **Wizard Flow:**
   - Complete flow from Step 1 to Step 4
   - Back navigation preserves data
   - URL parameter updates with step changes
   - State persists on page refresh

2. **Form Validation:**
   - Invalid data prevents proceeding
   - Validation errors display correctly
   - Correcting errors clears error state

3. **Business Creation:**
   - API call creates business record
   - ValidationSession created with idea data
   - Success navigates to correct next page
   - Error handling allows retry

### E2E Tests (Playwright)

1. **Fresh Start Flow:**
   - User selects "Start from scratch"
   - Completes all 4 steps
   - Launches business successfully
   - Navigates to validation page

2. **Upload Flow:**
   - User selects "I have documents"
   - Completes all 4 steps
   - Launches business successfully
   - Navigates to document upload page

3. **Resume Flow:**
   - User starts wizard, completes Step 2
   - User abandons wizard (closes tab)
   - User returns to wizard
   - Wizard resumes from Step 2 with preserved data

4. **Back Navigation:**
   - User navigates through all steps
   - User clicks Back on each step
   - Data is preserved
   - Can navigate forward again

---

## Definition of Done

- [ ] All acceptance criteria met (AC-08.3.1 through AC-08.3.9)
- [ ] All React components created and functional:
  - [ ] `OnboardingWizard` main page
  - [ ] `WizardProgress` component
  - [ ] `WizardStepChoice` component
  - [ ] `WizardStepDetails` component
  - [ ] `WizardStepIdea` component
  - [ ] `WizardStepConfirm` component
- [ ] Zustand store implemented with localStorage persistence
- [ ] API endpoint implemented:
  - [ ] `POST /api/businesses` creates business with ValidationSession
- [ ] Zod validation schemas defined and tested
- [ ] Form validation working with real-time feedback
- [ ] Character counts display correctly
- [ ] Progress indicator updates correctly
- [ ] State persistence to localStorage working
- [ ] Resume functionality works after abandonment
- [ ] Navigation between steps preserves data
- [ ] Success flow navigates to correct next page
- [ ] Error handling for API failures
- [ ] Loading states display correctly
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] Keyboard navigation supported
- [ ] Accessibility (ARIA labels, semantic HTML)
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests written and passing
- [ ] E2E tests for wizard flows
- [ ] Code reviewed and approved
- [ ] Documentation updated (if needed)
- [ ] sprint-status.yaml updated: `08-3` → `done`

---

## Dependencies

### Upstream Dependencies (Must Complete First)
- **Story 08.1:** Business database models must exist
- **Story 08.2:** Portfolio dashboard links to wizard
- **EPIC-01:** Authentication (user session for workspace context)
- **EPIC-02:** Workspace management (workspaceId from session)
- **EPIC-07:** UI Shell (layout components)

### Downstream Impact (Stories That Depend on This)
- **Story 08.4:** Document upload page (linked from wizard if hasDocuments=true)
- **Story 08.6:** Validation page (linked from wizard if hasDocuments=false)
- **All business module stories:** This creates the business record they operate on

---

## Technical Notes

### Zustand Persistence
- Use Zustand's `persist` middleware for localStorage
- Partial state persistence (exclude temporary UI state)
- Expiration check on mount (7 days)

### Form Validation
- Use `react-hook-form` with `@hookform/resolvers/standard-schema` (Zod)
- Real-time validation on blur
- Character count uses `watch()` from react-hook-form

### URL State Management
- Use `useSearchParams()` to read/write step parameter
- Sync URL with wizard state
- Support browser back/forward buttons

### Tailwind CSS
- Use full class strings (no dynamic interpolation)
- Responsive breakpoints: `md:grid-cols-2` for option cards
- Progress bar uses inline style for dynamic width

### Accessibility
- All form fields have proper labels
- Error messages linked to inputs with `aria-describedby`
- Option cards keyboard navigable with Enter/Space
- Progress stepper uses semantic list markup

### Performance
- Lazy load step components (React.lazy)
- Debounce character count updates (if performance issue)
- Prevent duplicate API calls on form submission

---

## Open Questions

| Question | Owner | Decision Needed By |
|----------|-------|-------------------|
| Should wizard support draft saving (multiple incomplete sessions)? | Chris | Before implementation (deferred to future) |
| Do we need industry selection in wizard or defer to validation? | Chris | Before Step 2 implementation (defer) |
| Should we validate business name uniqueness in workspace? | Chris | Before API implementation (YES) |
| How long should wizard state persist (7 days or longer)? | Chris | Before store implementation (7 days) |

---

## References

- Epic: [EPIC-08-business-onboarding.md](/home/chris/projects/work/Ai Bussiness Hub/docs/epics/EPIC-08-business-onboarding.md)
- Tech Spec: [tech-spec-epic-08.md](/home/chris/projects/work/Ai Bussiness Hub/docs/archive/foundation-phase/sprint-artifacts/tech-spec-epic-08.md)
- Wireframes: [BATCH-10-BUSINESS-ONBOARDING.md - BO-02 to BO-05](/home/chris/projects/work/Ai Bussiness Hub/docs/design/wireframes/prompts/BATCH-10-BUSINESS-ONBOARDING.md)
- Database Models: Story 08.1 implementation
- Portfolio Dashboard: Story 08.2 implementation

---

## Implementation Notes

**Implementation Date:** 2025-12-04
**Implemented By:** Claude Code

### Files Created

1. **Validation Schemas** - `/apps/web/src/lib/validations/onboarding.ts`
   - businessDetailsSchema (name, description)
   - businessIdeaSchema (problem, customer, solution)
   - businessCreateSchema (API validation)

2. **Zustand Store** - `/apps/web/src/stores/onboarding-wizard-store.ts`
   - State management with localStorage persistence
   - 7-day expiry for abandoned wizards
   - Hydration hook to prevent SSR mismatches

3. **Onboarding Layout** - `/apps/web/src/app/(onboarding)/layout.tsx`
   - Centered container layout
   - Simple header with logo and exit link

4. **Wizard Components**:
   - **WizardProgress** - `/apps/web/src/components/onboarding/WizardProgress.tsx`
     - Visual stepper with 4 steps
     - Progress bar and percentage display
     - Clickable completed steps for navigation

   - **WizardStepChoice** - `/apps/web/src/components/onboarding/WizardStepChoice.tsx`
     - Two option cards with icons
     - Keyboard navigation support
     - Visual selection state

   - **WizardStepDetails** - `/apps/web/src/components/onboarding/WizardStepDetails.tsx`
     - react-hook-form with Zod validation
     - Character count for description
     - Real-time error display

   - **WizardStepIdea** - `/apps/web/src/components/onboarding/WizardStepIdea.tsx`
     - Three fields with helper text
     - Character counts for all fields
     - Form validation

   - **WizardStepConfirm** - `/apps/web/src/components/onboarding/WizardStepConfirm.tsx`
     - Summary cards for all data
     - Edit buttons to jump back
     - Loading state during business creation
     - Error handling with retry

5. **Main Wizard Page** - `/apps/web/src/app/(onboarding)/onboarding/wizard/page.tsx`
   - Orchestrates all wizard steps
   - URL parameter sync (step=1-4)
   - State persistence and hydration
   - Business creation API call
   - Navigation routing based on hasDocuments flag

### Files Modified

1. **Business API** - `/apps/web/src/app/api/businesses/route.ts`
   - Added POST handler for business creation
   - Creates Business record with ValidationSession
   - Validates unique business name per workspace
   - Returns appropriate error codes (401, 400, 409, 500)

2. **Sprint Status** - `/docs/archive/foundation-phase/sprint-artifacts/sprint-status.yaml`
   - Updated story status: ready-for-dev → in-progress

### Technical Decisions

1. **State Management**: Used Zustand with persist middleware for wizard state. 7-day expiry ensures stale data doesn't persist indefinitely.

2. **URL Sync**: Used Next.js useSearchParams to sync wizard step with URL, enabling deep linking and browser back/forward support.

3. **Hydration Strategy**: Implemented skipHydration with manual rehydration to prevent SSR mismatches with localStorage.

4. **Form Validation**: Used react-hook-form with standardSchemaResolver for Zod schemas. Mode set to 'onBlur' for better UX.

5. **Character Counts**: Implemented with watch() from react-hook-form for real-time updates. Color changes at 90% (yellow) and 100% (red).

6. **API Error Handling**: Comprehensive error handling with specific error codes and user-friendly messages.

### Testing Notes

Manual testing required for:
- Complete wizard flow (all 4 steps)
- Back navigation with data preservation
- Resume after abandonment (close tab, reopen)
- Form validation errors
- API error handling (network failures, duplicate names)
- Browser back/forward buttons
- Deep linking with URL parameters

### Known Limitations

1. **Document Upload**: Step 1 mentions document upload, but that feature is implemented in Story 08.4. Currently just captures the choice.

2. **Validation Page**: Navigation to `/dashboard/[id]/validation` will 404 until Story 08.6 is implemented.

3. **Start Over Button**: Included for development/testing convenience, may want to remove or hide in production.

---

**Created:** 2025-12-04
**Status:** in-progress
**Story File Path:** `/home/chris/projects/work/Ai Bussiness Hub/docs/stories/story-08-3-implement-onboarding-wizard-ui.md`
