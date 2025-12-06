# Story 13.4: Agent Configuration Page

**Epic:** EPIC-13 - AI Agent Management
**Story ID:** 13-4
**Priority:** P1 High
**Points:** 5
**Status:** Drafted

---

## Story

**As an** admin
**I want** to configure agent settings in detail
**So that** I can customize agent behavior for my organization

---

## Context

This story implements the agent configuration page (`/agents/[id]/configure`) which provides a comprehensive interface for customizing individual agent settings. This enables per-agent BYOAI customization, behavior tuning, and integration management - a critical feature for enterprise adoption.

The configuration page features an 8-section sidebar navigation system covering:
- General settings (name, avatar, theme)
- AI Model settings (provider, model, parameters)
- Behavior settings (automation level, confidence, tone)
- Memory settings (context retention)
- Integrations (connected services)
- Notifications (alert preferences)
- Advanced settings (technical parameters)
- Danger Zone (reset, disable, delete)

This follows the established pattern from wireframe AI-05 and integrates with the workspace-level AI provider settings while allowing agent-specific overrides.

---

## Acceptance Criteria

### AC1: Create `/agents/[id]/configure` page with sidebar navigation
- [ ] Create Next.js dynamic route at `apps/web/src/app/agents/[id]/configure/page.tsx`
- [ ] Two-column layout: sticky sidebar (left) + main content area (right)
- [ ] Sidebar is sticky on desktop (position: sticky), dropdown on mobile
- [ ] Main content area scrolls independently
- [ ] Breadcrumb navigation: Agents > [Agent Name] > Configure
- [ ] Page header shows agent avatar, name, and role
- [ ] Loading state while fetching agent data
- [ ] Error state if agent not found (404)
- [ ] Responsive: sidebar becomes top dropdown on mobile (< 768px)

**Technical Notes:**
- Use `useAgent(id)` hook to fetch agent data
- Load ConfigSidebar and all settings sections
- Apply proper TypeScript types for agent config

### AC2: 8-section sidebar: General, AI Model, Behavior, Memory, Integrations, Notifications, Advanced, Danger Zone
- [ ] Create ConfigSidebar component with 8 navigation items
- [ ] Each section has icon, label, and optional badge (unsaved changes)
- [ ] Active section highlighted with background color
- [ ] Smooth scroll to section on click
- [ ] Sections: General, AI Model, Behavior, Memory, Integrations, Notifications, Advanced, Danger Zone
- [ ] Danger Zone has red accent color
- [ ] Keyboard navigation support (arrow keys)
- [ ] Unsaved changes badge shows on section if dirty
- [ ] Mobile: Sidebar becomes dropdown menu with all sections

**Technical Notes:**
- Use Lucide icons for each section
- Smooth scroll via `scrollIntoView({ behavior: 'smooth' })`
- Track dirty sections in form state

### AC3: General settings: display name, role description, avatar (emoji or image), theme color picker
- [ ] Section titled "General Settings"
- [ ] Display name input (text field, max 50 chars)
- [ ] Role description textarea (max 200 chars)
- [ ] Avatar picker with two modes: Emoji selector OR Image upload
- [ ] Emoji picker shows common emojis (default option)
- [ ] Image upload: drag-drop or click to upload (max 2MB, formats: PNG/JPG)
- [ ] Theme color picker with preset colors (8 options)
- [ ] Live preview of agent card with current settings
- [ ] Character count for name and description
- [ ] Validation: Display name required, min 3 chars

**Technical Notes:**
- Use shadcn/ui Input and Textarea components
- Emoji picker: Consider emoji-picker-react library
- Color picker: Use preset swatches, not full color wheel
- Preview shows AgentCardStandard component

### AC4: AI Model settings: primary model dropdown, fallback model, temperature slider (0-2), max tokens input, context window radio (4K/8K/16K)
- [ ] Section titled "AI Model Settings"
- [ ] Help text: "Override workspace AI settings for this agent. Leave blank to use workspace defaults."
- [ ] Primary model dropdown grouped by provider (Claude, OpenAI, Gemini, DeepSeek)
- [ ] Fallback model dropdown (optional, defaults to workspace fallback)
- [ ] Temperature slider: 0-2, step 0.1, shows value, description updates based on value
- [ ] Temperature descriptions: 0="Deterministic", 1="Balanced", 2="Creative"
- [ ] Max tokens input: number field, min 100, max 32000, default 4000
- [ ] Context window radio buttons: 4K / 8K / 16K (visual radio group)
- [ ] Cost indicator shows estimated cost per 1K requests based on selection
- [ ] Reset to workspace defaults button

**Technical Notes:**
- Use AIProviderSettings type from workspace settings
- Model dropdown uses same options as workspace settings
- Cost calculation: mockup with placeholder values
- Validation: temperature 0-2, maxTokens 100-32000

### AC5: Behavior settings: automation level (Manual/Smart/Full Auto), confidence threshold slider, tone slider (Professional to Casual), custom instructions textarea
- [ ] Section titled "Behavior Settings"
- [ ] Automation level: 3 radio cards with icons and descriptions
  - Manual: "Agent suggests, human approves all actions"
  - Smart: "Agent auto-executes high-confidence tasks (>85%)"
  - Full Auto: "Agent handles everything, notifies on completion"
- [ ] Confidence threshold slider: 0-100%, step 5%, default 70%
- [ ] Confidence threshold description updates: <60% "Low", 60-85% "Medium", >85% "High"
- [ ] Tone slider: 0 (Professional) to 100 (Casual), step 10
- [ ] Tone preview text updates based on slider (shows same message in different tones)
- [ ] Custom instructions textarea: 500 char limit, Markdown supported
- [ ] Character counter for custom instructions
- [ ] Help tooltips for each setting

**Technical Notes:**
- Radio cards use shadcn/ui RadioGroup styled as cards
- Sliders use shadcn/ui Slider component
- Tone preview: Show sample text in different styles
- Custom instructions: Use Textarea with character counter

### AC6: Integrations section: connected services toggles
- [ ] Section titled "Integrations"
- [ ] List of available integrations (CRM, Email, Calendar, Slack, etc.)
- [ ] Each integration shows: icon, name, description, toggle switch, status badge
- [ ] Status: "Connected" (green), "Not Connected" (gray), "Error" (red)
- [ ] Toggle switch enables/disables integration for this agent
- [ ] "Last synced" timestamp for connected integrations
- [ ] "Connect New Service" button opens integration modal
- [ ] Disabled state if workspace doesn't have integration configured
- [ ] Empty state: "No integrations available. Configure workspace integrations first."

**Technical Notes:**
- Integration list fetched from workspace settings
- Toggle saves immediately with optimistic update
- Show toast on toggle success/failure
- Link to workspace integrations settings if none configured

### AC7: Danger zone: Reset to defaults, Disable agent, Delete agent
- [ ] Section titled "Danger Zone" with red border
- [ ] Warning icon and help text: "These actions are permanent and cannot be undone."
- [ ] Three action buttons (destructive style):
  1. **Reset to Defaults**: Resets all config to workspace defaults
  2. **Disable Agent**: Stops agent from running (soft delete)
  3. **Delete Agent Configuration**: Removes all custom config
- [ ] Each button shows confirmation dialog before action
- [ ] Reset confirmation: Simple "Are you sure?" with Cancel/Confirm
- [ ] Disable confirmation: "Agent will stop processing tasks. Continue?"
- [ ] Delete confirmation: Type agent name to confirm (prevents accidental deletion)
- [ ] Success toast after each action
- [ ] Redirect to /agents after disable or delete

**Technical Notes:**
- Use AlertDialog for confirmations
- Delete requires typing exact agent name to confirm
- API calls: POST /api/agents/:id/reset, /api/agents/:id/disable, DELETE /api/agents/:id
- Show loading state on buttons during action

### AC8: Save/Cancel buttons with unsaved changes detection
- [ ] Sticky footer bar with Save and Cancel buttons
- [ ] Save button: primary style, disabled until form is dirty
- [ ] Cancel button: secondary style, discards changes
- [ ] Footer shows unsaved changes indicator: "You have unsaved changes"
- [ ] Browser warning on navigation with unsaved changes
- [ ] Save performs validation before submit
- [ ] Loading state on Save button during API call
- [ ] Success toast on save: "Agent configuration saved"
- [ ] Error toast on failure with error message
- [ ] Optimistic update: UI updates immediately, rolls back on error
- [ ] Auto-save option: saves after 3s of inactivity (optional, off by default)

**Technical Notes:**
- Use `useAgentConfigForm` hook for form state management
- Implement `beforeunload` event listener for unsaved changes warning
- Form validation via Zod schema
- React Query mutation for save with optimistic updates

### AC9: Form validation for all inputs
- [ ] Display name: required, 3-50 chars, no special characters except spaces
- [ ] Role description: max 200 chars
- [ ] Temperature: 0-2, step 0.1
- [ ] Max tokens: 100-32000
- [ ] Context window: must be one of 4000, 8000, 16000
- [ ] Confidence threshold: 0-100, step 5
- [ ] Tone: 0-100, step 10
- [ ] Custom instructions: max 500 chars
- [ ] Validation runs on blur and before save
- [ ] Inline error messages below each field (red text)
- [ ] Form submit disabled if any validation errors
- [ ] Scroll to first error field on submit failure
- [ ] Clear validation errors when field is corrected

**Technical Notes:**
- Define Zod schema for agent config
- Use react-hook-form for form state and validation
- Show field errors inline with error styling
- Aggregate errors at top if multiple validation failures

---

## Design Reference

**Wireframe:** AI-05 (Agent Configuration Page)
**Location:** `docs/design/wireframes/Finished wireframes and html files/AI-05-agent-config.html`

**Key Design Elements:**
- 8-section sidebar navigation (sticky on desktop)
- Clean, spacious form layouts with clear labels
- Inline help text and tooltips for complex settings
- Visual sliders and radio cards for better UX
- Danger zone clearly separated with red accents
- Sticky footer for Save/Cancel actions

---

## Technical Implementation

### Files to Create

```
apps/web/src/app/agents/[id]/configure/
├── page.tsx                          # Main configuration page

apps/web/src/components/agents/config/
├── ConfigSidebar.tsx                 # 8-section navigation sidebar
├── GeneralSettings.tsx               # AC3: General settings section
├── AIModelSettings.tsx               # AC4: AI model settings section
├── BehaviorSettings.tsx              # AC5: Behavior settings section
├── IntegrationsSettings.tsx          # AC6: Integrations section
└── DangerZone.tsx                    # AC7: Danger zone section

apps/web/src/hooks/
└── use-agent-config-form.ts          # Form state management hook

apps/web/src/lib/
└── agent-config-schema.ts            # Zod validation schema
```

### Component Structure

#### page.tsx
```typescript
// apps/web/src/app/agents/[id]/configure/page.tsx
export default function AgentConfigurePage({ params }: { params: { id: string } }) {
  const { data: agent, isLoading } = useAgent(params.id);
  const { formData, setFormData, isDirty, handleSave, handleReset } = useAgentConfigForm(params.id);

  if (isLoading) return <LoadingSkeleton />;
  if (!agent) return <NotFound />;

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Page Header */}
      <PageHeader agent={agent} />

      <div className="flex gap-8 mt-6">
        {/* Sidebar */}
        <ConfigSidebar activeSectionId={activeSectionId} />

        {/* Main Content */}
        <div className="flex-1 space-y-12">
          <GeneralSettings formData={formData} onChange={setFormData} />
          <AIModelSettings formData={formData} onChange={setFormData} />
          <BehaviorSettings formData={formData} onChange={setFormData} />
          <IntegrationsSettings agentId={params.id} />
          <DangerZone agentId={params.id} />
        </div>
      </div>

      {/* Sticky Footer */}
      {isDirty && (
        <StickyFooter
          onSave={handleSave}
          onCancel={handleReset}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
```

#### ConfigSidebar.tsx
```typescript
// apps/web/src/components/agents/config/ConfigSidebar.tsx
const sections = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'ai-model', label: 'AI Model', icon: Brain },
  { id: 'behavior', label: 'Behavior', icon: Activity },
  { id: 'memory', label: 'Memory', icon: Database },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'advanced', label: 'Advanced', icon: Wrench },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, variant: 'danger' },
];

export function ConfigSidebar({ activeSectionId }: ConfigSidebarProps) {
  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside className="w-64 sticky top-6 h-fit">
      <nav className="space-y-1">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => handleSectionClick(section.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
              activeSectionId === section.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
              section.variant === 'danger' && "text-destructive hover:bg-destructive/10"
            )}
          >
            <section.icon className="h-5 w-5" />
            <span>{section.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
```

#### use-agent-config-form.ts
```typescript
// apps/web/src/hooks/use-agent-config-form.ts
export function useAgentConfigForm(agentId: string) {
  const { data: agent } = useAgent(agentId);
  const updateMutation = useUpdateAgent(agentId);

  const [formData, setFormData] = useState<Partial<Agent['config']>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Initialize form data when agent loads
  useEffect(() => {
    if (agent) {
      setFormData(agent.config);
    }
  }, [agent]);

  // Warn on unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleSave = async () => {
    try {
      // Validate
      const validated = agentConfigSchema.parse(formData);

      // Save
      await updateMutation.mutateAsync(validated);

      setIsDirty(false);
      toast.success('Agent configuration saved');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error('Validation failed: ' + error.errors[0].message);
      } else {
        toast.error('Failed to save configuration');
      }
    }
  };

  const handleReset = () => {
    setFormData(agent?.config || {});
    setIsDirty(false);
  };

  const updateField = (field: keyof Agent['config'], value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  return {
    formData,
    setFormData: updateField,
    isDirty,
    handleSave,
    handleReset,
    isSaving: updateMutation.isPending,
  };
}
```

### API Integration

**Endpoint:** `PATCH /api/agents/:id`

**Request:**
```typescript
{
  providerId?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  contextWindow?: number;
  automationLevel?: 'manual' | 'smart' | 'full_auto';
  confidenceThreshold?: number;
  tone?: number;
  customInstructions?: string;
}
```

**Response:**
```typescript
{
  data: Agent; // Updated agent with new config
}
```

### Data Types

```typescript
// Agent configuration interface
interface AgentConfig {
  providerId: string | null;        // AI provider override
  model: string | null;             // Model override
  temperature: number;              // 0-2
  maxTokens: number;                // 100-32000
  contextWindow: number;            // 4000 | 8000 | 16000
  automationLevel: 'manual' | 'smart' | 'full_auto';
  confidenceThreshold: number;      // 0-100
  tone: number;                     // 0-100
  customInstructions: string;       // Max 500 chars
}

// Validation schema
const agentConfigSchema = z.object({
  providerId: z.string().nullable(),
  model: z.string().nullable(),
  temperature: z.number().min(0).max(2).step(0.1),
  maxTokens: z.number().min(100).max(32000),
  contextWindow: z.enum([4000, 8000, 16000]),
  automationLevel: z.enum(['manual', 'smart', 'full_auto']),
  confidenceThreshold: z.number().min(0).max(100).step(5),
  tone: z.number().min(0).max(100).step(10),
  customInstructions: z.string().max(500),
});
```

---

## Testing Requirements

### Unit Tests

```typescript
// __tests__/components/agents/config/config-sidebar.test.tsx
describe('ConfigSidebar', () => {
  it('renders all 8 sections', () => {
    render(<ConfigSidebar activeSectionId="general" />);
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
  });

  it('highlights active section', () => {
    render(<ConfigSidebar activeSectionId="ai-model" />);
    const activeButton = screen.getByText('AI Model').closest('button');
    expect(activeButton).toHaveClass('bg-primary');
  });

  it('scrolls to section on click', async () => {
    render(<ConfigSidebar activeSectionId="general" />);
    const scrollIntoView = jest.fn();
    document.getElementById = jest.fn(() => ({ scrollIntoView }));

    await userEvent.click(screen.getByText('Behavior'));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });
});

// __tests__/hooks/use-agent-config-form.test.ts
describe('useAgentConfigForm', () => {
  it('initializes with agent config', () => {
    const { result } = renderHook(() => useAgentConfigForm('agent-123'));
    expect(result.current.formData).toEqual(mockAgent.config);
  });

  it('marks form as dirty on field change', () => {
    const { result } = renderHook(() => useAgentConfigForm('agent-123'));
    act(() => result.current.setFormData('temperature', 1.5));
    expect(result.current.isDirty).toBe(true);
  });

  it('validates before save', async () => {
    const { result } = renderHook(() => useAgentConfigForm('agent-123'));
    act(() => result.current.setFormData('temperature', 5)); // Invalid
    await act(() => result.current.handleSave());
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Validation failed'));
  });
});
```

### Integration Tests

```typescript
// __tests__/api/agents/update.test.ts
describe('PATCH /api/agents/:id', () => {
  it('updates agent configuration', async () => {
    const response = await fetch('/api/agents/agent-123', {
      method: 'PATCH',
      body: JSON.stringify({ temperature: 1.5 }),
    });
    const { data } = await response.json();
    expect(data.config.temperature).toBe(1.5);
  });

  it('validates temperature range', async () => {
    const response = await fetch('/api/agents/agent-123', {
      method: 'PATCH',
      body: JSON.stringify({ temperature: 3.0 }),
    });
    expect(response.status).toBe(400);
  });

  it('requires authentication', async () => {
    const response = await fetch('/api/agents/agent-123', {
      method: 'PATCH',
      headers: {}, // No auth
    });
    expect(response.status).toBe(401);
  });
});
```

### E2E Tests

```typescript
// e2e/agent-config.spec.ts
test('User can configure agent settings', async ({ page }) => {
  await page.goto('/agents/vera/configure');

  // Change temperature
  await page.fill('[name="temperature"]', '1.2');

  // Change automation level
  await page.click('text=Full Auto');

  // Add custom instructions
  await page.fill('[name="customInstructions"]', 'Be extra concise in responses');

  // Save
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Agent configuration saved')).toBeVisible();

  // Verify form is no longer dirty
  await expect(page.locator('text=You have unsaved changes')).not.toBeVisible();
});

test('Warns on navigation with unsaved changes', async ({ page }) => {
  await page.goto('/agents/vera/configure');

  // Make change
  await page.fill('[name="temperature"]', '1.8');

  // Try to navigate away
  page.on('dialog', dialog => {
    expect(dialog.message()).toContain('unsaved');
    dialog.dismiss();
  });

  await page.click('a:has-text("Agents")');
});

test('Danger zone actions require confirmation', async ({ page }) => {
  await page.goto('/agents/vera/configure');

  // Scroll to danger zone
  await page.click('text=Danger Zone');

  // Try to delete
  await page.click('button:has-text("Delete Agent Configuration")');

  // Confirmation dialog appears
  await expect(page.locator('text=Type agent name to confirm')).toBeVisible();

  // Cancel
  await page.click('button:has-text("Cancel")');

  // Still on page
  await expect(page).toHaveURL(/\/agents\/vera\/configure/);
});
```

---

## Dependencies

### Required APIs
- `GET /api/agents/:id` - Fetch agent details (already exists)
- `PATCH /api/agents/:id` - Update agent config (needs implementation)
- `POST /api/agents/:id/reset` - Reset to defaults (needs implementation)
- `POST /api/agents/:id/disable` - Disable agent (needs implementation)
- `DELETE /api/agents/:id` - Delete agent config (needs implementation)

### Required Components
- shadcn/ui: Input, Textarea, Slider, RadioGroup, Select, Button, AlertDialog
- react-hook-form: Form state management
- Zod: Validation schema
- Lucide icons: For sidebar section icons

### Required Types
- Agent type (from agent-store or API types)
- AgentConfig interface
- Validation schema types

---

## Definition of Done

- [ ] All 9 acceptance criteria met
- [ ] Page renders correctly on desktop and mobile
- [ ] All form fields validate properly
- [ ] Unsaved changes detection works
- [ ] Save/Cancel actions work correctly
- [ ] All danger zone actions have confirmations
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes with no warnings
- [ ] Accessibility audit passes (WCAG AA)
- [ ] Dark mode support verified
- [ ] Code reviewed and approved
- [ ] Documentation updated (if needed)

---

## Story Metadata

**Created:** 2025-12-06
**Epic:** EPIC-13 - AI Agent Management
**Priority:** P1 High
**Points:** 5
**Estimated Hours:** 12-16 hours
**Dependencies:** Story 13.1 (AgentCard components for preview)
**Blocks:** None
**Related Stories:** 13.2 (Agent Detail Modal - Configuration tab)

---

## Notes

- This is the most complex story in EPIC-13 due to the number of form sections and validation rules
- Focus on reusable form components that can be used in other agent settings contexts
- Ensure consistent styling with existing settings pages in the app
- Consider implementing auto-save as optional enhancement (not in MVP)
- Memory and Notifications sections are placeholders for future functionality
- Agent name is fixed (character identity), but display name can have custom suffix
- Soft delete (disable) preserves activity history, hard delete removes config only
