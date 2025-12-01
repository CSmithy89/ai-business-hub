# Hyvve - Comprehensive Style Guide

**Version:** 2.0
**Last Updated:** 2025-11-30
**Status:** Official Design System

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design Tokens](#2-design-tokens)
3. [Layout System](#3-layout-system)
4. [Component Library](#4-component-library)
5. [Chat Interface](#5-chat-interface)
6. [Data Components](#6-data-components)
7. [Navigation & Command Palette](#7-navigation--command-palette)
8. [Forms & Inputs](#8-forms--inputs)
9. [Feedback & States](#9-feedback--states)
10. [Animation & Motion](#10-animation--motion)
11. [Accessibility](#11-accessibility)
12. [Performance Standards](#12-performance-standards)
13. [Implementation](#13-implementation)

---

## 1. Design Philosophy

### 1.1 Core Principles

Based on research from Linear, Notion, Superhuman, Stripe, and Attio:

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| **Speed as Feature** | 100ms or less for all interactions | Optimistic updates, skeleton screens, preloading |
| **Keyboard-First** | Power users never touch the mouse | Cmd+K command palette, comprehensive shortcuts |
| **Conversation-First** | AI agents are the primary interface | Chat-driven workflows, natural language |
| **Progressive Disclosure** | Show only what's needed, when needed | Contextual expansion, smart defaults |
| **Purposeful Restraint** | Every element earns its place | Minimal design, generous whitespace |
| **Micro-Delight** | Subtle feedback that feels alive | Celebration moments, smooth animations |
| **Character-Driven** | AI agents have personalities | Named characters with distinct voices |

### 1.2 Design Aesthetic

**Inspired by:** Cycle, Notion, Linear, Stripe, Attio
**Aesthetic:** Light, warm, friendly, human, premium

```
┌─────────────────────────────────────────────────────────────────┐
│  HYVVE DESIGN PILLARS                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LIGHT-FIRST          Warm cream backgrounds, airy feeling      │
│  CHARACTER-DRIVEN     AI agents with names and personalities    │
│  WARM                 Cream over white, coral over blue         │
│  PLAYFUL              Celebrations, friendly copy, delight      │
│  PREMIUM              Quality in every pixel, no cheap shortcuts│
│  FAST                 < 100ms response, feels instantaneous     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Interaction Paradigms

| Paradigm | Source | Use Case |
|----------|--------|----------|
| Conversational | Taskosaur | AI agent chat, task creation, queries |
| Data Workspace | Twenty CRM | Views, filters, bulk actions, records |
| Command Palette | Linear/Superhuman | Quick navigation, actions, search |
| Kanban/Board | Plane/Attio | Visual task management, pipelines |

---

## 2. Design Tokens

### 2.1 Brand Colors

From the Hyvve brand guidelines - warm, inviting, and human:

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     BRAND PRIMARY - From Logo
     ═══════════════════════════════════════════════════════════════ */
  --brand-coral: #FF6B6B;
  --brand-teal: #20B2AA;

  /* ═══════════════════════════════════════════════════════════════
     PRIMARY ACTION - Coral (Hub's Color)
     ═══════════════════════════════════════════════════════════════ */
  --color-primary: #FF6B6B;
  --color-primary-hover: #FF5252;
  --color-primary-active: #E64545;
  --color-primary-light: #FFE8E8;
  --color-primary-50: #FFF5F5;
  --color-primary-100: #FFE8E8;
  --color-primary-200: #FFD0D0;
  --color-primary-300: #FFA8A8;
  --color-primary-400: #FF8080;
  --color-primary-500: #FF6B6B;
  --color-primary-600: #FF5252;
  --color-primary-700: #E64545;
  --color-primary-800: #CC3333;
  --color-primary-900: #992626;

  /* ═══════════════════════════════════════════════════════════════
     SECONDARY ACCENT - Teal (Maya's Color)
     ═══════════════════════════════════════════════════════════════ */
  --color-accent: #20B2AA;
  --color-accent-hover: #1A9A93;
  --color-accent-active: #158880;
  --color-accent-light: #E0F5F4;
}
```

### 2.2 AI Team Character Colors

Each agent has a signature color for visual identification:

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     AI TEAM CHARACTER COLORS
     ═══════════════════════════════════════════════════════════════ */

  /* Hub - The Orchestrator */
  --color-agent-hub: #FF6B6B;
  --color-agent-hub-light: #FFE8E8;
  --color-agent-hub-dark: #E64545;

  /* Maya - CRM Agent */
  --color-agent-maya: #20B2AA;
  --color-agent-maya-light: #E0F5F4;
  --color-agent-maya-dark: #1A9A93;

  /* Atlas - PM Agent */
  --color-agent-atlas: #FF9F43;
  --color-agent-atlas-light: #FFF0E0;
  --color-agent-atlas-dark: #E68A2E;

  /* Sage - Finance Agent */
  --color-agent-sage: #2ECC71;
  --color-agent-sage-light: #E8F8EF;
  --color-agent-sage-dark: #27AE60;

  /* Nova - Marketing Agent */
  --color-agent-nova: #FF6B9D;
  --color-agent-nova-light: #FFE8F0;
  --color-agent-nova-dark: #E6527E;

  /* Echo - Analytics Agent */
  --color-agent-echo: #4B7BEC;
  --color-agent-echo-light: #E8F0FF;
  --color-agent-echo-dark: #3D6BD9;
}
```

### 2.3 Background Colors

Warm cream backgrounds instead of pure white:

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     LIGHT MODE BACKGROUNDS (Primary)
     ═══════════════════════════════════════════════════════════════ */
  --bg-cream: #FFFBF5;           /* Main background - warm cream */
  --bg-white: #FFFFFF;           /* Cards, elevated surfaces */
  --bg-soft: #FFF8F0;            /* Subtle sections */
  --bg-muted: #F5F0EB;           /* Disabled, inputs */
  --bg-hover: #F0EBE5;           /* Hover states */

  /* ═══════════════════════════════════════════════════════════════
     DARK MODE BACKGROUNDS
     ═══════════════════════════════════════════════════════════════ */
  --bg-dark-primary: #0a0a0b;    /* Near-black, not pure */
  --bg-dark-secondary: #111113;  /* Elevated surfaces */
  --bg-dark-tertiary: #1a1a1d;   /* Cards, modals */
  --bg-dark-hover: #232326;      /* Interactive hover */
}
```

### 2.4 Semantic Colors

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     SEMANTIC - Status Colors
     ═══════════════════════════════════════════════════════════════ */
  --color-success: #2ECC71;
  --color-success-light: #E8F8EF;
  --color-success-dark: #27AE60;

  --color-warning: #F59E0B;
  --color-warning-light: #FEF3C7;
  --color-warning-dark: #D97706;

  --color-error: #EF4444;
  --color-error-light: #FEE2E2;
  --color-error-dark: #DC2626;

  --color-info: #4B7BEC;
  --color-info-light: #E8F0FF;
  --color-info-dark: #3D6BD9;
}
```

### 2.5 Text Colors

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     TEXT COLORS - Light Mode
     ═══════════════════════════════════════════════════════════════ */
  --text-primary: #1e293b;       /* Slate 800 - Headlines, body */
  --text-secondary: #64748b;     /* Slate 500 - Supporting text */
  --text-muted: #94a3b8;         /* Slate 400 - Hints, captions */
  --text-disabled: #cbd5e1;      /* Slate 300 - Disabled */

  /* ═══════════════════════════════════════════════════════════════
     TEXT COLORS - Dark Mode
     ═══════════════════════════════════════════════════════════════ */
  --text-primary-dark: #f8fafc;  /* Slate 50 - Main text */
  --text-secondary-dark: #cbd5e1;/* Slate 300 - Supporting */
  --text-muted-dark: #94a3b8;    /* Slate 400 - Muted */
}
```

### 2.6 Border Colors

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     BORDERS - Light Mode (warm undertones)
     ═══════════════════════════════════════════════════════════════ */
  --border-subtle: #f1ebe4;      /* Barely visible */
  --border-default: #e5ddd4;     /* Standard borders */
  --border-strong: #d4c9be;      /* Emphasized */
  --border-focus: #FF6B6B;       /* Focus rings - coral */

  /* ═══════════════════════════════════════════════════════════════
     BORDERS - Dark Mode
     ═══════════════════════════════════════════════════════════════ */
  --border-subtle-dark: #27272a;
  --border-default-dark: #3f3f46;
  --border-focus-dark: #FF6B6B;
}
```

### 2.7 Shadows & Elevation

Premium: soft, subtle shadows - never harsh:

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     SHADOWS - Premium & Subtle
     ═══════════════════════════════════════════════════════════════ */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.03);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.03);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.04), 0 4px 6px rgba(0, 0, 0, 0.02);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.05), 0 8px 10px rgba(0, 0, 0, 0.02);

  /* Colored shadows for cards */
  --shadow-primary: 0 4px 12px rgba(255, 107, 107, 0.15);
  --shadow-accent: 0 4px 12px rgba(32, 178, 170, 0.15);

  /* Dark mode - use glows instead */
  --glow-sm: 0 0 10px rgba(255, 107, 107, 0.1);
  --glow-md: 0 0 20px rgba(255, 107, 107, 0.15);

  /* ═══════════════════════════════════════════════════════════════
     Z-INDEX LAYERS
     ═══════════════════════════════════════════════════════════════ */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 300;
  --z-popover: 400;
  --z-toast: 500;
  --z-command-palette: 600;
}
```

### 2.8 Typography

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     FONT FAMILIES
     ═══════════════════════════════════════════════════════════════ */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;

  /* ═══════════════════════════════════════════════════════════════
     TYPE SCALE - Premium (generous line-height)
     ═══════════════════════════════════════════════════════════════ */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  --text-5xl: 3rem;        /* 48px */

  /* ═══════════════════════════════════════════════════════════════
     FONT WEIGHTS
     ═══════════════════════════════════════════════════════════════ */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* ═══════════════════════════════════════════════════════════════
     LINE HEIGHTS - Premium (generous)
     ═══════════════════════════════════════════════════════════════ */
  --leading-tight: 1.2;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 1.75;

  /* ═══════════════════════════════════════════════════════════════
     LETTER SPACING
     ═══════════════════════════════════════════════════════════════ */
  --tracking-tighter: -0.02em;  /* Headings */
  --tracking-tight: -0.01em;
  --tracking-normal: 0;          /* Body */
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;      /* All caps */
}
```

### 2.9 Spacing Scale

Based on 4px grid:

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     SPACING - 4px Grid System
     ═══════════════════════════════════════════════════════════════ */
  --space-0: 0;
  --space-px: 1px;
  --space-0.5: 0.125rem;   /* 2px */
  --space-1: 0.25rem;      /* 4px */
  --space-1.5: 0.375rem;   /* 6px */
  --space-2: 0.5rem;       /* 8px */
  --space-2.5: 0.625rem;   /* 10px */
  --space-3: 0.75rem;      /* 12px */
  --space-4: 1rem;         /* 16px */
  --space-5: 1.25rem;      /* 20px */
  --space-6: 1.5rem;       /* 24px */
  --space-8: 2rem;         /* 32px */
  --space-10: 2.5rem;      /* 40px */
  --space-12: 3rem;        /* 48px */
  --space-16: 4rem;        /* 64px */
  --space-20: 5rem;        /* 80px */
  --space-24: 6rem;        /* 96px */
}
```

### 2.10 Border Radius

Premium: more rounded for softer feel:

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     BORDER RADIUS - Premium (softer, more rounded)
     ═══════════════════════════════════════════════════════════════ */
  --radius-none: 0;
  --radius-sm: 6px;        /* Small elements */
  --radius-md: 10px;       /* Buttons, inputs */
  --radius-lg: 16px;       /* Cards, modals */
  --radius-xl: 24px;       /* Large panels */
  --radius-2xl: 32px;      /* Hero sections */
  --radius-full: 9999px;   /* Pills, avatars */
}
```

### 2.11 Gradients

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     GRADIENTS
     ═══════════════════════════════════════════════════════════════ */

  /* Hero/Marketing gradient */
  --gradient-hero: linear-gradient(135deg, #FFFBF5 0%, #FFE8E8 50%, #E0F5F4 100%);

  /* Brand gradient (logo colors) */
  --gradient-brand: linear-gradient(135deg, #FF6B6B 0%, #20B2AA 100%);

  /* Text gradient for headlines */
  --gradient-text: linear-gradient(135deg, #FF6B6B 0%, #20B2AA 100%);

  /* Agent gradients */
  --gradient-hub: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
  --gradient-maya: linear-gradient(135deg, #20B2AA 0%, #3DD9D0 100%);
  --gradient-atlas: linear-gradient(135deg, #FF9F43 0%, #FFB76B 100%);
  --gradient-sage: linear-gradient(135deg, #2ECC71 0%, #58D68D 100%);
  --gradient-nova: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  --gradient-echo: linear-gradient(135deg, #4B7BEC 0%, #7C9FEF 100%);

  /* Subtle overlay gradient */
  --gradient-overlay: linear-gradient(135deg, rgba(255, 107, 107, 0.05) 0%, rgba(32, 178, 170, 0.05) 100%);
}
```

---

## 3. Layout System

### 3.1 Shell Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER BAR                                                                   │
│ Logo │ Project Selector │ Breadcrumbs      │ Search │ Notifications │ User  │
├────────────┬────────────────────────────────────────────────────────────────┤
│            │                                                                 │
│  SIDEBAR   │  MAIN CONTENT AREA                                              │
│  NAVIGATION│  ┌───────────────────────────┬─────────────────────────────┐   │
│            │  │                           │                             │   │
│  Dashboard │  │  CHAT PANEL               │  DATA PANEL                 │   │
│  Chat      │  │  (flex, min 320px)        │  (resizable)                │   │
│  Approvals │  │                           │                             │   │
│  AI Team   │  │  [Agent Messages]         │  [Views/Lists/Kanban]       │   │
│  ──────────│  │                           │                             │   │
│  CRM       │  │  [Typing Indicator]       │  [Record Details]           │   │
│  Projects  │  │                           │                             │   │
│  ──────────│  │  [Chat Input]             │  [Actions]                  │   │
│  Settings  │  │                           │                             │   │
│            │  └───────────────────────────┴─────────────────────────────┘   │
│            │                                                                 │
├────────────┴────────────────────────────────────────────────────────────────┤
│ STATUS BAR: Agent Status │ Sync Status │ Keyboard Hints │ Notifications     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Panel Dimensions

| Panel | Min Width | Default | Max Width |
|-------|-----------|---------|-----------|
| Navigation Collapsed | 56px | 56px | 56px |
| Navigation Expanded | 200px | 240px | 320px |
| Chat Panel | 320px | 50% | 70% |
| Data Panel | 400px | 50% | 80% |
| Detail Panel | 320px | 400px | 600px |

### 3.3 Responsive Breakpoints

```css
/* ═══════════════════════════════════════════════════════════════
   BREAKPOINTS
   ═══════════════════════════════════════════════════════════════ */
--breakpoint-sm: 640px;    /* Mobile landscape */
--breakpoint-md: 768px;    /* Tablet */
--breakpoint-lg: 1024px;   /* Desktop */
--breakpoint-xl: 1280px;   /* Large desktop */
--breakpoint-2xl: 1536px;  /* Wide screens */
```

### 3.4 Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| < 768px | Single panel, bottom nav, swipe between panels |
| 768px - 1024px | Two panels, collapsible navigation |
| > 1024px | Full layout with resizable panels |

### 3.5 Premium Whitespace

Following luxury brand principles - generous breathing room:

| Element | Premium Spacing |
|---------|-----------------|
| Section padding | 48-64px |
| Card padding | 24-32px |
| Line height (body) | 1.6-1.75 |
| Letter spacing (headings) | -0.02em |
| Paragraph margins | 24px |

---

## 4. Component Library

### 4.1 Foundation

Built on Radix UI for accessibility:

- `@radix-ui/react-dialog` - Modals, sheets
- `@radix-ui/react-dropdown-menu` - Menus
- `@radix-ui/react-popover` - Popovers, tooltips
- `@radix-ui/react-tabs` - Tab navigation
- `@radix-ui/react-select` - Selects, comboboxes
- `@radix-ui/react-checkbox` - Checkboxes
- `@radix-ui/react-switch` - Toggles
- `@radix-ui/react-toast` - Notifications

### 4.2 Buttons

```css
/* ═══════════════════════════════════════════════════════════════
   BUTTON - PRIMARY (Coral)
   ═══════════════════════════════════════════════════════════════ */
.btn-primary {
  background: var(--color-primary);
  color: white;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  transition: all 150ms ease;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.25);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.35);
}

.btn-primary:active {
  transform: scale(0.98);
}

/* ═══════════════════════════════════════════════════════════════
   BUTTON - SECONDARY
   ═══════════════════════════════════════════════════════════════ */
.btn-secondary {
  background: var(--bg-white);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  font-weight: 500;
  padding: 12px 20px;
  border-radius: var(--radius-md);
}

.btn-secondary:hover {
  background: var(--bg-soft);
  border-color: var(--border-strong);
}

/* ═══════════════════════════════════════════════════════════════
   BUTTON - GHOST
   ═══════════════════════════════════════════════════════════════ */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  padding: 12px 20px;
  border-radius: var(--radius-md);
}

.btn-ghost:hover {
  background: var(--bg-soft);
  color: var(--text-primary);
}

/* ═══════════════════════════════════════════════════════════════
   BUTTON - DANGER
   ═══════════════════════════════════════════════════════════════ */
.btn-danger {
  background: var(--color-error);
  color: white;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: var(--radius-md);
}
```

**Button Sizes:**

| Size | Padding | Font Size | Height |
|------|---------|-----------|--------|
| sm | 8px 12px | 14px | 32px |
| md | 12px 20px | 16px | 44px |
| lg | 16px 24px | 18px | 52px |

### 4.3 Cards

```css
/* ═══════════════════════════════════════════════════════════════
   CARD - Default
   ═══════════════════════════════════════════════════════════════ */
.card {
  background: var(--bg-white);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.card:hover {
  border-color: var(--border-default);
  box-shadow: var(--shadow-md);
}

/* ═══════════════════════════════════════════════════════════════
   CARD - Agent Card (with character color)
   ═══════════════════════════════════════════════════════════════ */
.card-agent-hub {
  border-left: 3px solid var(--color-agent-hub);
}

.card-agent-maya {
  border-left: 3px solid var(--color-agent-maya);
}

/* ... similar for other agents */
```

### 4.4 Agent Badges

```css
/* ═══════════════════════════════════════════════════════════════
   AGENT BADGES - Character Colors
   ═══════════════════════════════════════════════════════════════ */
.badge-hub {
  background: var(--color-agent-hub-light);
  color: var(--color-agent-hub);
}

.badge-maya {
  background: var(--color-agent-maya-light);
  color: var(--color-agent-maya);
}

.badge-atlas {
  background: var(--color-agent-atlas-light);
  color: var(--color-agent-atlas);
}

.badge-sage {
  background: var(--color-agent-sage-light);
  color: var(--color-agent-sage);
}

.badge-nova {
  background: var(--color-agent-nova-light);
  color: var(--color-agent-nova);
}

.badge-echo {
  background: var(--color-agent-echo-light);
  color: var(--color-agent-echo);
}
```

### 4.5 Avatars

```tsx
interface AvatarProps {
  src?: string;
  name: string;           // Fallback initials
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  agentType?: 'hub' | 'maya' | 'atlas' | 'sage' | 'nova' | 'echo';
}
```

| Size | Pixels | Usage |
|------|--------|-------|
| xs | 24px | Inline mentions, badges |
| sm | 32px | Chat avatars, list items |
| md | 48px | Cards, notifications |
| lg | 64px | Headers, feature sections |
| xl | 96px | Hero sections, profiles |

---

## 5. Chat Interface

### 5.1 Chat Message Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ AGENT MESSAGE                                                    │
│ ┌────┐                                                          │
│ │🎭  │  Hub · Just now                                          │
│ │Hub │  ┌─────────────────────────────────────────────────────┐ │
│ └────┘  │ I've routed this to Atlas—they'll handle the        │ │
│         │ project setup. You should see it in your board      │ │
│         │ within a few seconds!                                │ │
│         └─────────────────────────────────────────────────────┘ │
│                                                                  │
│                                               USER MESSAGE       │
│         ┌─────────────────────────────────────────────────────┐ │
│         │ Create a new project for the Q1 marketing campaign  │ │
│         └─────────────────────────────────────────────────────┘ │
│                                                      You · 2m   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Message Styles

```css
/* ═══════════════════════════════════════════════════════════════
   CHAT MESSAGE - Agent
   ═══════════════════════════════════════════════════════════════ */
.message-agent {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
}

.message-agent-bubble {
  background: var(--bg-white);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  border-top-left-radius: var(--radius-sm);
  padding: var(--space-4);
  max-width: 80%;
}

/* ═══════════════════════════════════════════════════════════════
   CHAT MESSAGE - User
   ═══════════════════════════════════════════════════════════════ */
.message-user {
  display: flex;
  justify-content: flex-end;
}

.message-user-bubble {
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-sm);
  padding: var(--space-4);
  max-width: 80%;
}

/* ═══════════════════════════════════════════════════════════════
   CHAT MESSAGE - System
   ═══════════════════════════════════════════════════════════════ */
.message-system {
  text-align: center;
  color: var(--text-muted);
  font-size: var(--text-sm);
  padding: var(--space-2) 0;
}
```

### 5.3 Typing Indicator

```css
/* ═══════════════════════════════════════════════════════════════
   TYPING INDICATOR - Agent Processing
   ═══════════════════════════════════════════════════════════════ */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: var(--text-muted);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-4px); opacity: 1; }
}
```

### 5.4 Chat Input

```tsx
interface ChatInputProps {
  onSend: (message: string, attachments?: File[]) => void;
  placeholder?: string;
  suggestions?: string[];      // Auto-complete
  allowAttachments?: boolean;
  allowVoice?: boolean;
}
```

**Features:**
- Multi-line with auto-resize (max 200px)
- `@` mentions for agents (@hub, @maya, etc.)
- `/` commands trigger command palette
- File drop zone for attachments
- Voice input option

### 5.5 Agent @Mention

```
┌─────────────────────────────────────────┐
│ @ ──────────────────────────────────────│
│                                         │
│  🎭 @hub    Route to best agent         │
│  👋 @maya   CRM & relationships         │
│  🗺️ @atlas  Projects & tasks            │
│  🌿 @sage   Finance & invoices          │
│  ✨ @nova   Marketing & content         │
│  🔮 @echo   Analytics & reports         │
│                                         │
└─────────────────────────────────────────┘
```

---

## 6. Data Components

### 6.1 Data Table

Based on TanStack Table v8:

```tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableSelection?: boolean;
  enablePagination?: boolean;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
}
```

**Features:**
- Sortable columns with clear indicators
- Inline editing on double-click
- Bulk selection with shift+click
- Keyboard navigation (arrow keys)
- Skeleton loading states

### 6.2 Kanban Board

Based on `@atlaskit/pragmatic-drag-and-drop`:

```tsx
interface KanbanBoardProps<T> {
  columns: KanbanColumn[];
  items: T[];
  getItemColumn: (item: T) => string;
  onItemMove: (itemId: string, toColumn: string, position: number) => void;
  renderItem: (item: T) => ReactNode;
  renderColumnHeader: (column: KanbanColumn) => ReactNode;
}
```

**Features:**
- Smooth drag animation
- Column WIP limits
- Collapsed column state
- Quick add at column top
- Optimistic updates

### 6.3 View Selector

```
┌────────────────────────────────────────────────┐
│  [Table] [Kanban] [Calendar] [Timeline]  [+]   │
└────────────────────────────────────────────────┘
```

### 6.4 Filter Bar

```
┌─────────────────────────────────────────────────────────────────┐
│ [+ Add filter]  Status: Open ✕  │  Assignee: Maya ✕  │  Clear  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Navigation & Command Palette

### 7.1 Command Palette (Cmd+K)

The heart of keyboard-first design - access everything instantly:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 Type a command or search...                              ⌘K  │
├─────────────────────────────────────────────────────────────────┤
│ RECENT                                                          │
│   📋 Create new task                                  ⌘+Shift+T │
│   👤 View contact: Acme Corp                              ⌘+O   │
│                                                                 │
│ NAVIGATION                                                      │
│   🏠 Dashboard                                            ⌘+D   │
│   💬 Chat                                                 ⌘+/   │
│   ✅ Approval Queue                                       ⌘+Q   │
│   👥 AI Team                                              ⌘+T   │
│                                                                 │
│ ACTIONS                                                         │
│   ➕ Create contact                                             │
│   📊 View analytics                                             │
│   ⚙️ Settings                                             ⌘+,   │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Global Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + /` | Focus chat input |
| `Cmd/Ctrl + B` | Toggle navigation |
| `Cmd/Ctrl + .` | Toggle data panel |
| `Cmd/Ctrl + ,` | Open settings |
| `Cmd/Ctrl + D` | Go to dashboard |
| `Cmd/Ctrl + Q` | Go to approval queue |
| `Escape` | Close modal/panel |
| `/` | Quick filter (in lists) |
| `E` | Edit in context |
| `Enter` | Primary action |

### 7.3 Sidebar Navigation

```css
/* ═══════════════════════════════════════════════════════════════
   SIDEBAR - Collapsed State (56px)
   ═══════════════════════════════════════════════════════════════ */
.sidebar-collapsed {
  width: 56px;
}

.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: var(--space-3);
}

.sidebar-collapsed .nav-label {
  display: none;
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR - Expanded State (240px)
   ═══════════════════════════════════════════════════════════════ */
.sidebar-expanded {
  width: 240px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all 150ms ease;
}

.nav-item:hover {
  background: var(--bg-soft);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}
```

### 7.4 Breadcrumbs

```
Home > CRM > Contacts > Acme Corp
```

Rules:
- Always links except current page
- Show full path (don't skip levels)
- Use `>` separator
- Use for 3+ level hierarchies

---

## 8. Forms & Inputs

### 8.1 Input Styles

```css
/* ═══════════════════════════════════════════════════════════════
   INPUT - Default
   ═══════════════════════════════════════════════════════════════ */
.input {
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: var(--text-base);
  line-height: 1.5;
  transition: all 150ms ease;
}

.input:hover {
  border-color: var(--border-strong);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.15);
}

/* ═══════════════════════════════════════════════════════════════
   INPUT - Error State
   ═══════════════════════════════════════════════════════════════ */
.input-error {
  border-color: var(--color-error);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

/* ═══════════════════════════════════════════════════════════════
   INPUT - Success State
   ═══════════════════════════════════════════════════════════════ */
.input-success {
  border-color: var(--color-success);
}
```

### 8.2 Validation Timing

| Field Type | Validate When |
|------------|---------------|
| Email | After blur + format check |
| Password | Real-time strength meter |
| Username | After typing stops (debounce 500ms) |
| Phone | After blur + format hint |
| Required | After submission attempt |

### 8.3 Inline Validation States

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

### 8.4 Form Best Practices

1. **Explicit labels** - Never placeholder-only
2. **One column** - Easier to scan
3. **Logical grouping** - Related fields together
4. **Smart defaults** - Pre-fill when possible
5. **Forgiving formats** - Accept multiple phone formats
6. **Clear CTAs** - "Create Account" not "Submit"
7. **Preserve input** - Don't clear on error

---

## 9. Feedback & States

### 9.1 Loading States Hierarchy

From fastest perceived to slowest:

| Pattern | Use When | Perceived Speed |
|---------|----------|-----------------|
| **Optimistic UI** | Action success likely | Instant |
| **Skeleton Screen** | Content structure known | Fast |
| **Progress Bar** | Duration measurable | Medium |
| **Spinner** | Duration unknown, brief | Slow |
| **Full-page Loader** | Avoid if possible | Slowest |

### 9.2 Skeleton Screens

```css
/* ═══════════════════════════════════════════════════════════════
   SKELETON - Loading State
   ═══════════════════════════════════════════════════════════════ */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-muted) 0%,
    var(--bg-soft) 50%,
    var(--bg-muted) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 9.3 Empty States

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    [Character Illustration]                      │
│                          🎭 Hub                                  │
│                                                                 │
│              Your approval queue is empty                        │
│                                                                 │
│     All agent actions have been reviewed. Nice work!            │
│     New approvals will appear here automatically.               │
│                                                                 │
│                [ View Agent Activity → ]                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Empty State Elements:**
- Character illustration (humanize)
- Short title (what's empty)
- Helpful body text (why + what to do)
- Single CTA button (clear action)
- Agent personality (warm, not sterile)

### 9.4 Toast Notifications

```css
/* ═══════════════════════════════════════════════════════════════
   TOAST - Success
   ═══════════════════════════════════════════════════════════════ */
.toast-success {
  background: var(--bg-white);
  border: 1px solid var(--color-success);
  border-left: 4px solid var(--color-success);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

/* ═══════════════════════════════════════════════════════════════
   TOAST - Error with Undo
   ═══════════════════════════════════════════════════════════════ */
.toast-error {
  background: var(--bg-white);
  border: 1px solid var(--color-error);
  border-left: 4px solid var(--color-error);
}
```

### 9.5 Error Messages

**Guidelines:**
- Human-readable (no technical jargon)
- Concise and precise
- Actionable (how to fix)
- Never blame the user
- Show near the field

```
❌ Bad: "Error: Invalid input"

✅ Good: "That email doesn't look right.
         Try something like you@company.com"
```

### 9.6 Celebration Moments

When to celebrate:
- Complete onboarding (confetti)
- First task completed (badge animation)
- Inbox zero / Queue empty (character celebration)
- Milestone reached (animated badge)
- Payment successful (checkmark animation)

---

## 10. Animation & Motion

### 10.1 Timing Functions

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     EASING FUNCTIONS
     ═══════════════════════════════════════════════════════════════ */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### 10.2 Duration Scale

| Duration | Usage | Examples |
|----------|-------|----------|
| 100ms | Micro-interactions | Hover, press |
| 150ms | Standard transitions | Color, border |
| 200ms | Component animations | Expand, collapse |
| 300ms | Panel/modal animations | Slide, fade |
| 500ms | Character animations | Wave, celebrate |
| 1000ms+ | Major celebrations | Confetti |

### 10.3 Standard Animations

```css
/* ═══════════════════════════════════════════════════════════════
   HOVER LIFT
   ═══════════════════════════════════════════════════════════════ */
.hover-lift {
  transition: transform 150ms var(--ease-out);
}
.hover-lift:hover {
  transform: translateY(-2px);
}

/* ═══════════════════════════════════════════════════════════════
   BUTTON PRESS
   ═══════════════════════════════════════════════════════════════ */
.press-scale:active {
  transform: scale(0.98);
  transition: transform 100ms var(--ease-in-out);
}

/* ═══════════════════════════════════════════════════════════════
   FADE IN
   ═══════════════════════════════════════════════════════════════ */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE UP
   ═══════════════════════════════════════════════════════════════ */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ═══════════════════════════════════════════════════════════════
   SCALE IN (for modals)
   ═══════════════════════════════════════════════════════════════ */
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### 10.4 Character Animations

```css
/* ═══════════════════════════════════════════════════════════════
   CHARACTER - Thinking (for loading)
   ═══════════════════════════════════════════════════════════════ */
@keyframes character-thinking {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.character-thinking {
  animation: character-thinking 1s ease-in-out infinite;
}

/* ═══════════════════════════════════════════════════════════════
   CHARACTER - Celebrating
   ═══════════════════════════════════════════════════════════════ */
@keyframes character-celebrate {
  0% { transform: scale(1); }
  25% { transform: scale(1.1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.character-celebrate {
  animation: character-celebrate 500ms ease-out;
}

/* ═══════════════════════════════════════════════════════════════
   CHARACTER - Wave
   ═══════════════════════════════════════════════════════════════ */
@keyframes character-wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(20deg); }
  75% { transform: rotate(-10deg); }
}

.character-wave {
  animation: character-wave 600ms ease-in-out;
}
```

### 10.5 Logo Animation

```css
/* ═══════════════════════════════════════════════════════════════
   LOGO - Infinity Draw
   ═══════════════════════════════════════════════════════════════ */
@keyframes logo-draw {
  0% { stroke-dashoffset: 1000; }
  100% { stroke-dashoffset: 0; }
}

.logo-animate {
  stroke-dasharray: 1000;
  animation: logo-draw 2s ease-out forwards;
}

/* ═══════════════════════════════════════════════════════════════
   LOGO - Pulse (for loading)
   ═══════════════════════════════════════════════════════════════ */
@keyframes logo-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.logo-loading {
  animation: logo-pulse 1.5s ease-in-out infinite;
}
```

### 10.6 Reduced Motion

```css
/* ═══════════════════════════════════════════════════════════════
   REDUCED MOTION - Accessibility
   ═══════════════════════════════════════════════════════════════ */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 11. Accessibility

### 11.1 WCAG 2.1 AA Requirements

| Principle | Requirement | Implementation |
|-----------|-------------|----------------|
| **Perceivable** | 4.5:1 contrast ratio | Check all text colors |
| **Operable** | 44x44px touch targets | Pad small icons, buttons |
| **Understandable** | Clear error messages | No jargon, actionable |
| **Robust** | Screen reader support | Semantic HTML, ARIA |

### 11.2 Focus Management

```css
/* ═══════════════════════════════════════════════════════════════
   FOCUS VISIBLE - Keyboard Users
   ═══════════════════════════════════════════════════════════════ */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Remove focus ring for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}
```

### 11.3 Keyboard Navigation

- **Tab** - Move through interactive elements
- **Enter/Space** - Activate buttons
- **Arrow keys** - Navigate lists, menus
- **Escape** - Close modals, dropdowns
- **Home/End** - Jump to first/last item

### 11.4 ARIA Patterns

| Component | ARIA Role | Notes |
|-----------|-----------|-------|
| Chat messages | `role="log"` | With `aria-live="polite"` |
| Command palette | `role="combobox"` | With `role="listbox"` |
| Kanban board | `role="application"` | Drag-and-drop announcements |
| Modals | `role="dialog"` | Focus trap, `aria-modal="true"` |
| Toasts | `role="alert"` | For important messages |

### 11.5 Color + Icon

Never use color alone for meaning:

```
✅ Status: Complete (green checkmark)
⚠️ Status: Warning (amber triangle)
❌ Status: Error (red X icon)
```

---

## 12. Performance Standards

### 12.1 Speed Thresholds

From Superhuman research:

| Threshold | Perception | Target |
|-----------|------------|--------|
| < 50ms | Instantaneous | Critical actions |
| < 100ms | Fast | Maximum for UI feedback |
| < 250ms | Responsive | Data operations |
| > 1000ms | Slow | Requires loading indicator |

### 12.2 Implementation Tactics

1. **Preload content** - Anticipate next screens
2. **Optimistic updates** - Show success before server confirms
3. **Skeleton screens** - Show layout shape while loading
4. **Minimal animations** - Never delay the user
5. **Cache aggressively** - Local-first data model
6. **Code splitting** - Lazy load non-critical routes

### 12.3 Optimistic UI Pattern

```
User clicks "Complete Task"
  ↓
Immediately: Show task as complete ✓
  ↓
In background: Send to server
  ↓
If fails: Revert + show error toast
```

### 12.4 Performance Checklist

- [ ] Initial load < 3 seconds
- [ ] Interaction response < 100ms
- [ ] Skeleton screens for async content
- [ ] Optimistic updates for user actions
- [ ] Lazy loading for below-fold content
- [ ] Image optimization (WebP, lazy load)
- [ ] Bundle size monitoring

---

## 13. Implementation

### 13.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + CSS Variables |
| Components | Radix UI + shadcn/ui |
| State | TanStack Query + Zustand |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table v8 |
| DnD | @atlaskit/pragmatic-drag-and-drop |
| Commands | cmdk |
| Animation | Framer Motion |
| Icons | Lucide Icons |

### 13.2 File Structure

```
src/
├── components/
│   ├── ui/              # Primitive components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── avatar.tsx
│   │   └── badge.tsx
│   ├── chat/            # Chat components
│   │   ├── chat-message.tsx
│   │   ├── chat-input.tsx
│   │   ├── typing-indicator.tsx
│   │   └── agent-mention.tsx
│   ├── data/            # Data display
│   │   ├── data-table.tsx
│   │   ├── kanban-board.tsx
│   │   ├── filter-bar.tsx
│   │   └── view-selector.tsx
│   ├── layout/          # Layout components
│   │   ├── shell.tsx
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── status-bar.tsx
│   ├── feedback/        # Feedback states
│   │   ├── skeleton.tsx
│   │   ├── empty-state.tsx
│   │   ├── toast.tsx
│   │   └── loading.tsx
│   └── agents/          # Agent characters
│       ├── agent-avatar.tsx
│       ├── agent-badge.tsx
│       └── agent-card.tsx
├── styles/
│   ├── tokens.css       # Design tokens
│   ├── globals.css      # Global styles
│   ├── animations.css   # Keyframes
│   └── themes/
│       ├── light.css
│       └── dark.css
└── lib/
    ├── cn.ts            # Class merge utility
    └── constants.ts     # Agent definitions
```

### 13.3 Tailwind Configuration

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Brand colors
        coral: {
          50: '#FFF5F5',
          100: '#FFE8E8',
          500: '#FF6B6B',
          600: '#FF5252',
          700: '#E64545',
        },
        teal: {
          50: '#E0F5F4',
          500: '#20B2AA',
          600: '#1A9A93',
        },
        cream: '#FFFBF5',
        // Agent colors
        agent: {
          hub: '#FF6B6B',
          maya: '#20B2AA',
          atlas: '#FF9F43',
          sage: '#2ECC71',
          nova: '#FF6B9D',
          echo: '#4B7BEC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '16px',
        'xl': '24px',
      },
      boxShadow: {
        'primary': '0 4px 12px rgba(255, 107, 107, 0.15)',
        'accent': '0 4px 12px rgba(32, 178, 170, 0.15)',
      },
    },
  },
};
```

### 13.4 Agent Constants

```ts
// lib/constants.ts
export const AGENTS = {
  hub: {
    name: 'Hub',
    role: 'The Orchestrator',
    tagline: "I'll make sure this gets to the right place.",
    color: '#FF6B6B',
    colorLight: '#FFE8E8',
    emoji: '🎭',
  },
  maya: {
    name: 'Maya',
    role: 'CRM Agent',
    tagline: 'I never forget a face—or a conversation.',
    color: '#20B2AA',
    colorLight: '#E0F5F4',
    emoji: '👋',
  },
  atlas: {
    name: 'Atlas',
    role: 'PM Agent',
    tagline: "Let's get this shipped!",
    color: '#FF9F43',
    colorLight: '#FFF0E0',
    emoji: '🗺️',
  },
  sage: {
    name: 'Sage',
    role: 'Finance Agent',
    tagline: 'The numbers tell a story. Let me translate.',
    color: '#2ECC71',
    colorLight: '#E8F8EF',
    emoji: '🌿',
  },
  nova: {
    name: 'Nova',
    role: 'Marketing Agent',
    tagline: "Let's make some magic happen!",
    color: '#FF6B9D',
    colorLight: '#FFE8F0',
    emoji: '✨',
  },
  echo: {
    name: 'Echo',
    role: 'Analytics Agent',
    tagline: "Here's what the data is telling us.",
    color: '#4B7BEC',
    colorLight: '#E8F0FF',
    emoji: '🔮',
  },
} as const;
```

---

## References

### Brand & Research Documents
- [Brand Guidelines](/docs/design/BRAND-GUIDELINES.md) - Hyvve brand identity
- [Premium UI Research](/docs/design/PREMIUM-UI-RESEARCH.md) - UI patterns from Linear, Notion, etc.
- [Premium UX Research](/docs/design/PREMIUM-UX-RESEARCH.md) - UX patterns and best practices
- [Brand Assets Checklist](/docs/design/BRAND-ASSETS-CHECKLIST.md) - Asset production list

### External Resources
- [Radix UI](https://www.radix-ui.com/) - Accessible primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility CSS
- [Lucide Icons](https://lucide.dev/) - Icon library
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [cmdk](https://cmdk.paco.me/) - Command palette

### Inspiration
- [Linear](https://linear.app) - Keyboard-first, minimal friction
- [Notion](https://notion.so) - Progressive disclosure
- [Superhuman](https://superhuman.com) - Speed obsessed
- [Attio](https://attio.com) - Modern CRM design
- [Stripe](https://stripe.com) - Trust signals, form excellence

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-11-30 | Complete rewrite with Hyvve branding, integrated UI/UX research |
| 1.0 | 2025-11-29 | Initial style guide |

---

*This style guide is a living document. Update as the Hyvve design system evolves.*
