# Premium UX Research - AI Business Hub

**Purpose:** Deep research into premium user experience patterns from the best tools in the industry
**Created:** 2025-11-29
**Research Sources:** Linear, Notion, Stripe, Superhuman, Slack, Asana, Mailchimp, GitHub

---

## Executive Summary

Premium UX isn't about flashy features—it's about **removing friction, anticipating needs, and making users feel powerful**. The best tools in the industry share common patterns:

1. **Cognitive load reduction** - Show only what's needed, when needed
2. **Forgiveness by design** - Undo everything, prevent errors gracefully
3. **Progressive disclosure** - Complexity reveals on demand
4. **Delightful feedback** - Celebrate success, soften failures
5. **Speed perception** - Feel fast even when loading
6. **Trust signals** - Security visible, privacy respected

---

## 1. The Pain Points We Must Avoid

> "Understanding what users hate is as important as knowing what they love."

### CRM Software Complaints

| Pain Point | User Frustration | Our Solution |
|------------|------------------|--------------|
| **Data entry hell** | "Most CRMs are designed for executives, not the people who use them" | Inline editing, auto-enrichment, AI assistance |
| **Overwhelming interface** | "Cluttered, busy sidebars, pop-ups everywhere" | Minimal design, progressive disclosure |
| **Poor mobile access** | "Can't close deals on the go" | Mobile-first responsive design |
| **Integration nightmares** | "Cumbersome, clunky process to connect apps" | One-click integrations, webhooks |
| **Hidden costs** | "Charge extra for basic features" | Transparent pricing, no feature gates |

**Source:** [Common CRM Pain Points](https://www.zendesk.com/blog/ux-mistakes-crms-make/)

### Project Management Tool Complaints

| Pain Point | User Frustration | Our Solution |
|------------|------------------|--------------|
| **Over-customization** | "Too many options, can't find anything" | Opinionated defaults, smart constraints |
| **Slow performance** | "3-5 seconds to load, kills productivity" | < 100ms target, optimistic updates |
| **Visual overload** | "Color-coded spreadsheet having a midlife crisis" | Restrained color, purposeful visual hierarchy |
| **Formatting friction** | "Markdown for basic text? Really?" | Rich text editor, WYSIWYG |
| **Poor onboarding** | "Deleted app right away - disastrous experience" | Guided tours, empty state education |

**Source:** [PM Software UX Problems](https://www.intentux.com/post/the-ux-of-project-management-software)

---

## 2. Cognitive Load Reduction

> "The amount of mental resources required to operate the system." — John Sweller

### Types of Cognitive Load

```
┌─────────────────────────────────────────────────────────────────┐
│  INTRINSIC LOAD (unavoidable task complexity)                   │
│  Can't eliminate, but respect it by not adding more             │
├─────────────────────────────────────────────────────────────────┤
│  EXTRANEOUS LOAD (poor design decisions)                        │
│  Fully under our control - MINIMIZE AGGRESSIVELY                │
│  - Confusing navigation                                         │
│  - Inconsistent patterns                                        │
│  - Unclear labels                                               │
├─────────────────────────────────────────────────────────────────┤
│  GERMANE LOAD (learning interface patterns)                     │
│  Invest in well-designed patterns users can master once         │
└─────────────────────────────────────────────────────────────────┘
```

### Reduction Strategies

1. **Familiar patterns** - Use conventions users already know
2. **Visual hierarchy** - Guide attention with size, color, spacing
3. **Progressive disclosure** - Hide complexity until needed
4. **Smart defaults** - Pre-fill with intelligent guesses
5. **Offload tasks** - Show pictures instead of requiring memory
6. **Minimize visual clutter** - Ample whitespace, fewer elements

### Real Impact

> "BaseKit's pricing page required 138 individual comparisons. After simplification, reducing cognitive load by 77% increased conversions by 25%."

**Source:** [Cognitive Load in UX Design](https://www.nngroup.com/articles/minimize-cognitive-load/)

---

## 3. Progressive Disclosure

> "Defer advanced or rarely used features to a secondary screen." — Jakob Nielsen (1995)

### When to Use

| Situation | Apply Progressive Disclosure? |
|-----------|------------------------------|
| Complex forms with 10+ fields | ✅ Yes - Multi-step wizard |
| Settings with 50+ options | ✅ Yes - Tabs/accordions |
| Feature-rich dashboard | ✅ Yes - Contextual expansion |
| Simple 3-field form | ❌ No - Show everything |
| Critical safety information | ❌ No - Always visible |

### Implementation Patterns

**Accordions** - User-controlled content expansion
```
FAQ Section:
[+] How do I connect my API key?
[-] What models are supported?
    → OpenAI GPT-4, Claude 3, DeepSeek...
[+] How is billing calculated?
```

**Multi-step Forms** - Break complexity into digestible chunks
```
Step 1 of 3: Basic Info    ●○○
[Name] [Email]
                     [Next →]
```

**Tabs** - Organize content categories
```
┌──────────┬──────────┬──────────┐
│ General  │ Advanced │ Security │
├──────────┴──────────┴──────────┤
│ Content for selected tab       │
└────────────────────────────────┘
```

**Contextual Tooltips** - Just-in-time help
```
[API Key] [?] ← Hover: "Found in your OpenAI dashboard"
```

### Best Practice
> "Limit layers of information. A single secondary screen is typically sufficient for each instance of progressive disclosure."

**Source:** [Progressive Disclosure - NN/G](https://www.nngroup.com/articles/progressive-disclosure/)

---

## 4. Command Palette (Cmd+K)

> "The one place where users can find every command." — Superhuman

### Origin Story
In 2014, a Slack user picked Cmd+K arbitrarily for a demo quick-switcher. Slack built it, and it became the industry standard.

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Type a command or search...                         ⌘K  │
├─────────────────────────────────────────────────────────────┤
│ RECENT                                                      │
│   📋 Create new task                              ⌘+Shift+T │
│   👤 View contact: Acme Corp                           ⌘+O  │
│                                                             │
│ SUGGESTIONS                                                 │
│   ⚙️ Settings                                          ⌘+,  │
│   📊 Dashboard                                         ⌘+D  │
│   🤖 AI Team                                           ⌘+A  │
│   📝 Approval Queue                                    ⌘+Q  │
└─────────────────────────────────────────────────────────────┘
```

### Why It Works

| Benefit | Explanation |
|---------|-------------|
| **Reduces navigation time** | No hunting through menus |
| **Fuzzy search** | Find by related keywords, not exact name |
| **Keyboard-first** | Power users never touch mouse |
| **Unified search** | Commands + content in one place |
| **Discoverability** | Users learn features by browsing |

### Implementation Rules

1. **Same shortcut everywhere** - Cmd+K works globally
2. **Everything in one place** - Don't split across palettes
3. **Show recent actions** - Speed up repeat tasks
4. **Fuzzy matching** - Tolerate typos, synonyms
5. **Keyboard navigation** - Arrow keys + Enter to execute

### Industry Shortcuts

| App | Shortcut |
|-----|----------|
| Slack, Linear, Notion | ⌘+K |
| VS Code | ⌘+Shift+P |
| Figma | ⌘+/ |
| Spotlight | ⌘+Space |
| Alfred | ⌥+Space |

**Source:** [How to Build a Remarkable Command Palette](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/)

---

## 5. Onboarding Excellence

> "Users try out a lot of apps but decide which to stop using within the first 3-7 days."

### Onboarding Types

1. **Product tour** - Guided walkthrough of key features
2. **Interactive tutorial** - Learn by doing
3. **Checklist** - Tasks to complete for setup
4. **Empty states** - Educational when no data exists
5. **Tooltips** - Contextual help on hover/focus

### The Rule: Two Parts Instruction, One Part Delight

> "A little personality is great, but not at the cost of clarity." — Tamara Olson

### Personalization During Onboarding

**Ask early:**
```
Welcome to AI Business Hub! 👋

To personalize your experience, what's your primary goal?

○ Manage customer relationships (CRM)
○ Track projects and tasks (PM)
○ Both - I need a full suite
○ Just exploring

[Continue →]
```

### Common Mistakes to Avoid

| Mistake | Why It Fails | Better Approach |
|---------|--------------|-----------------|
| **Feature parade** | Overwhelming, users don't stick | Show 3-5 key features max |
| **One-size-fits-all** | Startup vs enterprise needs differ | Personalized paths |
| **Forced account creation** | Fastest way to lose users | Allow exploration first |
| **No value before signup** | Users don't know what they'll get | Show capabilities upfront |
| **Too many steps** | Friction leads to abandonment | 3 steps or fewer |

### AI-Powered Onboarding (2025 Trend)

> "AI-powered algorithms analyze real-time behavior to personalize dashboards, recommend next steps, and predict friction points before users struggle."

**Source:** [Onboarding UX Patterns](https://userpilot.medium.com/onboarding-ux-patterns-and-best-practices-in-saas-c46bcc7d562f)

---

## 6. Empty States That Convert

> "Empty states represent a pivotal point in the user journey."

### Types of Empty States

1. **First-time use** - No data created yet
2. **No results found** - Search/filter yields nothing
3. **Completed state** - All tasks done (celebrate!)
4. **Feature education** - Explain what goes here

### Anatomy of a Great Empty State

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    [Illustration]                           │
│                   📋 or 🎯 or 🚀                             │
│                                                             │
│            Your approval queue is empty                     │
│                                                             │
│     All agent actions have been reviewed. Nice work!        │
│     New approvals will appear here automatically.           │
│                                                             │
│              [ View Agent Activity → ]                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Elements

| Element | Purpose |
|---------|---------|
| **Illustration** | Humanize, add warmth |
| **Title** | Short, direct explanation |
| **Body text** | Why empty + what to do next |
| **CTA button** | Single clear action |
| **Personality** | Empathy, not sterile |

### Search Empty States

> "Empty search results should never actually be empty."

**Do:**
- Suggest related content
- Offer to broaden search
- Link to help documentation
- Show popular items

**Don't:**
- Just say "No results"
- Dead-end the user
- Force them to start over

**Source:** [Empty States - The Most Overlooked Aspect of UX](https://www.toptal.com/designers/ux/empty-state-ux-design)

---

## 7. Error Handling & Forgiveness

> "Errors are opportunities to show your product has users' backs."

### Error Message Guidelines

1. **Human-readable** - No technical jargon
2. **Concise and precise** - Describe exact problem
3. **Actionable** - Tell users how to fix it
4. **Polite** - Never blame the user
5. **Timely** - Show after interaction, not during

### Timing: When to Validate

| Field Type | Validation Timing |
|------------|-------------------|
| Email format | After blur (leave field) |
| Password strength | Real-time as typing |
| Username availability | After typing stops (debounce) |
| Required fields | After submission attempt |
| Complex forms | After submission |

### Error Message Anatomy

```
❌ Bad:
"Error: Invalid input"

✅ Good:
"Email format looks incorrect.
 Try: name@company.com"
 [Retry] [Use different email]
```

### The Undo Pattern

> "Never use a warning when you mean undo." — Jef Raskin

| Scenario | Pattern |
|----------|---------|
| Delete item | Undo toast for 5 seconds |
| Send message | "Undo send" for 10 seconds |
| Bulk action | Confirmation + undo option |
| Destructive action | Type-to-confirm |

### Benefits of Undo

- **Increases confidence** - Users try more things
- **Reduces fear** - Safe to experiment
- **Creates simplicity illusion** - Complex apps feel simple
- **Reduces support tickets** - Self-service recovery

**Source:** [Error Message UX - Smashing Magazine](https://www.smashingmagazine.com/2022/08/error-messages-ux-design/)

---

## 8. Loading States & Perceived Performance

> "Users perceive sites with skeleton screens as 30% faster than identical sites with spinners."

### Loading Pattern Hierarchy

| Pattern | Use When | Perceived Speed |
|---------|----------|-----------------|
| **Optimistic UI** | Action success is likely | Instant |
| **Skeleton screen** | Content structure is known | Fast |
| **Progress bar** | Duration is measurable | Medium |
| **Spinner** | Duration unknown, brief | Slow |
| **Full-page loader** | Avoid if possible | Slowest |

### Skeleton Screens

```
┌─────────────────────────────────────────────────────────────┐
│ ████████████████                                            │
│                                                             │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│ │ ░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░ │       │
│ │ ░░░░░░░░     │  │ ░░░░░░░░     │  │ ░░░░░░░░     │       │
│ │              │  │              │  │              │       │
│ └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
       ↓ Animation: subtle pulse, left-to-right sweep
```

### Best Practices

1. **Match layout** - Skeleton mirrors actual content
2. **Animate subtly** - Pulse or sweep (L→R for natural eye movement)
3. **Progressive reveal** - Load above-fold first
4. **Avoid blank frames** - Always show skeleton structure

### Optimistic UI

```
User clicks "Complete Task"
  ↓
Immediately: Show task as complete ✓
  ↓
In background: Send to server
  ↓
If fails: Revert + show error toast
```

**When to use:**
- Actions that almost always succeed
- Low-risk reversible operations
- Frequent user actions

**Source:** [Skeleton Screens 101 - NN/G](https://www.nngroup.com/articles/skeleton-screens/)

---

## 9. Micro-interactions & Delight

> "The accumulation of small, delightful moments turns good UX into great UX."

### Celebration Moments

**Asana's Flying Unicorn**
> "A unicorn flies across the browser when I complete a task. This is what keeps me coming back."

**Mailchimp's High-Five**
> "After completing a newsletter, a celebratory GIF appears. They care about how the user feels."

### When to Celebrate

| Trigger | Celebration |
|---------|-------------|
| Complete onboarding | Confetti + welcome message |
| First task completed | Achievement badge |
| Inbox zero / Queue empty | Fun illustration |
| Milestone reached | Animated badge + sound |
| Payment successful | Checkmark animation |

### Micro-interaction Anatomy

```
TRIGGER → RULES → FEEDBACK → LOOPS/MODES
   ↓         ↓        ↓           ↓
User     What      Visual      Ongoing
action   happens   response    behavior
```

### Implementation Guidelines

| Type | Duration | Easing |
|------|----------|--------|
| Hover feedback | 100-150ms | ease-out |
| Button press | 50-100ms | ease-in-out |
| Success confirmation | 200-300ms | ease-out |
| Celebration | 500-1000ms | custom bounce |
| Modal open | 200-250ms | ease-out |

### The Rule

> "Save celebration animations for special moments. Use light animations for confirmations, victorious ones for achievements."

**Source:** [Microinteractions in UX - NN/G](https://www.nngroup.com/articles/microinteractions/)

---

## 10. Trust & Security Signals

> "Nearly half of users assess website trust based on surface-level design."

### Four Pillars of Trust

1. **Consistency** - Predictable behavior everywhere
2. **Transparency** - Clear about data usage
3. **Security** - Visible protection measures
4. **Usability** - Easy to use = trustworthy

### Visual Trust Signals

| Signal | Implementation |
|--------|----------------|
| **SSL indicator** | 🔒 in URL bar, mention in footer |
| **Security badges** | SOC 2, GDPR, ISO certifications |
| **Privacy policy** | Clear, accessible, jargon-free |
| **Data encryption** | "Your data is encrypted at rest and in transit" |
| **Auth indicators** | Show when sessions are secure |

### Trust-Building Colors

| Color | Association |
|-------|-------------|
| **Blue** | Stability, reliability, security |
| **Green** | Safety, success, growth |
| **Grey** | Neutrality, professionalism |
| **White** | Clarity, openness |

### Privacy UX

**Do:**
- Just-in-time explanations ("We use this to personalize your experience")
- Easy consent withdrawal
- Granular privacy controls
- Clear data deletion options

**Don't:**
- Pre-checked consent boxes (dark pattern)
- Buried privacy settings
- Confusing permission requests
- Vague data usage descriptions

### Adaptive Security

> "Use adaptive authentication that adjusts security level based on risk signals to balance security with usability."

- Low risk: Simple password
- Medium risk: 2FA prompt
- High risk: Step-up verification

**Source:** [Designing for UX Trust](https://medium.com/@marketingtd64/designing-for-ux-trust-security-privacy-transparency-1b9a5a989c97)

---

## 11. Navigation Excellence

> "Users expect navigation menus in familiar locations."

### Navigation Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ GLOBAL NAVIGATION (top bar)                                 │
│ Logo | Project Selector | Search | User Menu                │
├─────────────────────────────────────────────────────────────┤
│ LOCAL NAVIGATION    │  CONTENT AREA                         │
│ (sidebar)           │                                       │
│                     │  BREADCRUMBS                          │
│ Dashboard           │  Home > CRM > Contacts > Acme Corp    │
│ Chat                │                                       │
│ Approvals           │  [Page Content]                       │
│ AI Team             │                                       │
│ ─────────           │                                       │
│ CRM                 │                                       │
│ Projects            │                                       │
│ ─────────           │                                       │
│ Settings            │                                       │
└─────────────────────┴───────────────────────────────────────┘
```

### Breadcrumb Rules

1. **Always links** - Except the current page
2. **Show full path** - Don't skip levels
3. **Consistent separator** - Usually `>` or `/`
4. **Supplement, don't replace** - Augment main nav
5. **Use for 3+ levels** - Not needed for shallow sites

### Sidebar Best Practices

| Pattern | When |
|---------|------|
| Collapsible | Limited screen space |
| Icons + labels | Many items |
| Icons only (collapsed) | Frequent users |
| Nested sections | Complex hierarchies |
| Active state highlight | Always |

### Location Indicators

- Highlight current nav item
- Show breadcrumb trail
- Use page titles consistently
- Interactive walkthroughs for new users

**Source:** [Breadcrumbs UX Design - Smashing Magazine](https://www.smashingmagazine.com/2022/04/breadcrumbs-ux-design/)

---

## 12. Form Design Excellence

> "Nearly 70% of users will abandon a form if they encounter complications."

### Field Validation Timing

| Field | Validate When |
|-------|---------------|
| Email | After blur + format check |
| Password | Real-time strength meter |
| Username | After typing stops (debounce 500ms) |
| Phone | After blur + format hint |
| Required | After submission attempt |

### Inline Validation States

```
Email ────────────────────────────
✓ john@company.com              ← Green checkmark = valid

Password ─────────────────────────
●●●●●●●●●●●●
███████░░░ Strong               ← Real-time strength

Username ─────────────────────────
✗ "admin" is already taken      ← Red X = invalid
  Try: admin2023, admin_hub
```

### Form Best Practices

1. **Explicit labels** - Never placeholder-only
2. **One column** - Easier to scan
3. **Logical grouping** - Related fields together
4. **Smart defaults** - Pre-fill when possible
5. **Forgiving formats** - Accept (123) 456-7890 and 123-456-7890
6. **Clear CTAs** - "Create Account" not "Submit"

### Error Recovery

- Show errors near the field
- Explain how to fix
- Don't clear valid data
- Preserve user input on refresh
- Offer alternatives

**Source:** [Live Validation UX - Smashing Magazine](https://www.smashingmagazine.com/2022/09/inline-validation-web-forms-ux/)

---

## 13. Accessibility as Premium UX

> "70-80% of accessibility issues can be avoided at the design stage."

### WCAG 2.2 Key Requirements

| Principle | Requirement | Implementation |
|-----------|-------------|----------------|
| **Perceivable** | 4.5:1 contrast ratio | Check all text colors |
| **Operable** | 24×24px touch targets | Pad small icons |
| **Understandable** | Clear error messages | No jargon, actionable |
| **Robust** | Works with screen readers | Semantic HTML |

### Keyboard Navigation Essentials

- **Tab order** - Logical flow through page
- **Focus visible** - Always show focus state
- **Skip links** - "Skip to main content"
- **Escape** - Close modals/dropdowns
- **Arrow keys** - Navigate lists/menus

### Inclusive Design Principles

1. **Multiple input methods** - Mouse + keyboard + touch + voice
2. **Resizable text** - Support browser zoom
3. **Color + icon** - Never color alone for meaning
4. **Alt text** - Descriptive image alternatives
5. **Reduced motion** - Respect `prefers-reduced-motion`

### Why Accessibility = Premium

> "Accessibility isn't a limitation—it's better design for everyone."

- Clearer hierarchy benefits all users
- Keyboard shortcuts = power user feature
- High contrast = better readability
- Large targets = fewer mis-taps

**Source:** [Essential UX Accessibility Tips - WCAG](https://www.wcag.com/resource/ux-quick-tips-for-designers/)

---

## 14. User Flow Optimization

> "A well-designed user interface can raise conversion rates by up to 200%." — Forrester

### Friction Identification

**Signs of friction:**
- Drop-off in funnel analysis
- Long time on single step
- High error rates
- Support tickets about confusion
- Heatmap dead zones

### Friction Reduction Strategies

| Strategy | Implementation |
|----------|----------------|
| **Fewer steps** | Combine related actions |
| **Auto-fill** | Use known data |
| **Defaults** | Smart pre-selection |
| **Consistency** | Same patterns everywhere |
| **Personalization** | Tailor to user type |

### Strategic Friction (Yes, Sometimes Add It)

> "Purpose-driven friction introduces productive friction upfront to avoid counterproductive friction later."

**Good friction:**
- Confirmation for destructive actions
- Password complexity requirements
- Email verification
- Terms acceptance

**Bad friction:**
- Unnecessary account creation
- Excessive form fields
- Confusing navigation
- Hidden important features

**Source:** [Optimizing User Flows](https://www.statsig.com/perspectives/optimizing-user-flows-minimizing-friction)

---

## 15. Actionable Checklist for Premium UX

### Before Every Feature

- [ ] What's the user's goal? Can they achieve it in < 3 steps?
- [ ] What information do they need? Show only that.
- [ ] What errors might occur? Handle gracefully.
- [ ] What happens while loading? Skeleton or optimistic UI.
- [ ] What if it's empty? Educational empty state.
- [ ] Can they undo mistakes? Always.

### For Every Form

- [ ] Labels visible (not just placeholders)?
- [ ] Validation after blur, not during typing?
- [ ] Error messages next to fields?
- [ ] Smart defaults where possible?
- [ ] Progress indicator for multi-step?
- [ ] Clear submit button text?

### For the Entire App

- [ ] Command palette (Cmd+K) implemented?
- [ ] Keyboard shortcuts for common actions?
- [ ] Consistent navigation patterns?
- [ ] Trust signals visible?
- [ ] Celebration moments for achievements?
- [ ] Empty states are helpful, not dead-ends?
- [ ] Accessibility: keyboard nav, contrast, focus states?

---

## Sources & Inspiration

### Tools to Study for UX

- [Linear](https://linear.app) - Keyboard-first, minimal friction
- [Notion](https://notion.so) - Progressive disclosure mastery
- [Stripe](https://stripe.com) - Trust signals, form excellence
- [Superhuman](https://superhuman.com) - Command palette perfection
- [Slack](https://slack.com) - Onboarding and empty states
- [Asana](https://asana.com) - Celebration micro-interactions
- [GitHub](https://github.com) - Command palette, keyboard navigation

### Key Articles Referenced

- [Onboarding UX Patterns - Userpilot](https://userpilot.medium.com/onboarding-ux-patterns-and-best-practices-in-saas-c46bcc7d562f)
- [Empty States UX - Toptal](https://www.toptal.com/designers/ux/empty-state-ux-design)
- [Error Messages UX - Smashing Magazine](https://www.smashingmagazine.com/2022/08/error-messages-ux-design/)
- [Skeleton Screens 101 - NN/G](https://www.nngroup.com/articles/skeleton-screens/)
- [Microinteractions - NN/G](https://www.nngroup.com/articles/microinteractions/)
- [Progressive Disclosure - NN/G](https://www.nngroup.com/articles/progressive-disclosure/)
- [Cognitive Load - NN/G](https://www.nngroup.com/articles/minimize-cognitive-load/)
- [Form Validation UX - Smashing Magazine](https://www.smashingmagazine.com/2022/09/inline-validation-web-forms-ux/)
- [Command Palette Design - Superhuman](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/)
- [Trust in UX Design - Medium](https://medium.com/@marketingtd64/designing-for-ux-trust-security-privacy-transparency-1b9a5a989c97)
- [CRM UX Mistakes - Zendesk](https://www.zendesk.com/blog/ux-mistakes-crms-make/)
- [PM Software UX - IntentUX](https://www.intentux.com/post/the-ux-of-project-management-software)
- [WCAG Accessibility Tips](https://www.wcag.com/resource/ux-quick-tips-for-designers/)
- [User Flow Optimization - Statsig](https://www.statsig.com/perspectives/optimizing-user-flows-minimizing-friction)

