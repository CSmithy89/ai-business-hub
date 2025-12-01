# Section 6: CRM User Interface - Research Findings

**Research Date:** 2025-11-30
**Status:** Complete
**Sources:** Modern CRM Analysis (Attio, Folk), Industry Best Practices

---

## Summary

Modern CRM UI should feel like Notion/Linear rather than traditional enterprise software. Based on research, we recommend a spreadsheet-style list view with Kanban boards, three-panel contact detail layout, real-time activity timeline, and mobile-responsive design.

---

## 1. Design Philosophy

### 1.1 Modern CRM UI Principles

Based on analysis of Attio and Folk CRMs:

| Principle | Description | Example |
|-----------|-------------|---------|
| **Clean & Minimal** | Reduce visual clutter | White space, limited colors |
| **Data-Forward** | Surface key info immediately | Score badge, status indicators |
| **Customizable** | User-defined views | Saved filters, column selection |
| **Fast Interactions** | Reduce clicks, keyboard-first | Cmd+K, inline editing |
| **Modern Tooling** | Feel like Linear/Notion | Spreadsheet views, drag-drop |

**Reference:** [Attio vs Folk Comparison](https://www.whalesync.com/blog/attio-vs-folk) | [Attio CRM Review](https://www.folk.app/articles/attio-crm-review-ai-powered-crm-for-modern-gtm-teams)

### 1.2 Visual Design System

```typescript
interface CRMDesignTokens {
  // Colors
  colors: {
    primary: '#2563EB';        // Blue
    success: '#10B981';        // Green (won/positive)
    warning: '#F59E0B';        // Amber (at risk)
    danger: '#EF4444';         // Red (lost/negative)
    neutral: '#6B7280';        // Gray

    // Score tiers
    scoreCold: '#6B7280';      // Gray
    scoreWarm: '#F59E0B';      // Amber
    scoreHot: '#F97316';       // Orange
    scoreSalesReady: '#10B981'; // Green
  };

  // Stage colors (customizable per pipeline)
  stageColors: {
    lead: '#6B7280';
    qualified: '#3B82F6';
    discovery: '#8B5CF6';
    proposal: '#F59E0B';
    negotiation: '#F97316';
    won: '#10B981';
    lost: '#EF4444';
  };

  // Typography
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif';
    headingWeight: 600;
    bodyWeight: 400;
  };

  // Spacing
  spacing: {
    xs: '4px';
    sm: '8px';
    md: '16px';
    lg: '24px';
    xl: '32px';
  };
}
```

---

## 2. Contact List View

### 2.1 List Layout Options

| View Type | Description | Use Case |
|-----------|-------------|----------|
| **Table** | Spreadsheet-style with columns | Bulk management, sorting |
| **Card Grid** | Contact cards in grid | Visual browsing |
| **Compact** | Dense row view | High volume |

### 2.2 Default Columns

```typescript
const DEFAULT_CONTACT_COLUMNS = [
  { id: 'select', width: 40, sticky: true },
  { id: 'name', label: 'Name', width: 200, sortable: true },
  { id: 'score', label: 'Score', width: 80, sortable: true },
  { id: 'company', label: 'Company', width: 180, sortable: true },
  { id: 'email', label: 'Email', width: 220 },
  { id: 'phone', label: 'Phone', width: 140 },
  { id: 'lifecycle', label: 'Stage', width: 120, sortable: true },
  { id: 'owner', label: 'Owner', width: 140, sortable: true },
  { id: 'lastActivity', label: 'Last Activity', width: 120, sortable: true },
  { id: 'created', label: 'Created', width: 120, sortable: true },
];
```

### 2.3 Filter System

```typescript
interface FilterConfig {
  // Quick filters (chips)
  quickFilters: [
    { id: 'my_contacts', label: 'My Contacts', filter: { ownerId: currentUser } },
    { id: 'hot_leads', label: 'Hot Leads', filter: { scoreTier: 'HOT' } },
    { id: 'no_activity', label: 'Needs Attention', filter: { lastActivityAt: { lt: '30_days_ago' } } },
  ];

  // Advanced filter builder
  filterBuilder: {
    operators: ['equals', 'contains', 'greater_than', 'less_than', 'between', 'is_empty', 'is_not_empty'];
    logicModes: ['AND', 'OR'];
    groupingSupport: true;
  };

  // Saved views
  savedViews: {
    personal: true;           // User-specific views
    shared: true;             // Team-wide views
    default: true;            // Can set as default
  };
}
```

### 2.4 Bulk Actions

```typescript
const BULK_ACTIONS = [
  { id: 'assign', label: 'Assign Owner', icon: 'user' },
  { id: 'tag', label: 'Add Tags', icon: 'tag' },
  { id: 'enrich', label: 'Enrich', icon: 'sparkles' },
  { id: 'export', label: 'Export', icon: 'download' },
  { id: 'delete', label: 'Delete', icon: 'trash', danger: true },
];
```

### 2.5 Infinite Scroll vs Pagination

**Recommendation: Virtual Scrolling (Infinite)**

- Better UX for browsing
- Faster perceived load
- Less jarring than pagination
- Virtualize for performance (react-virtual)

---

## 3. Contact Detail View

### 3.1 Three-Panel Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ < Back to Contacts      John Smith          [Enrich] [Edit] ... │
├───────────────┬─────────────────────────────┬───────────────────┤
│               │                             │                   │
│   PROFILE     │      ACTIVITY TIMELINE      │    ASSOCIATIONS   │
│   (Left)      │         (Center)            │      (Right)      │
│               │                             │                   │
│ Photo         │  Today                      │  Company          │
│ Name          │  ├─ Email opened            │  ┌───────────┐    │
│ Title @ Co    │  └─ Meeting scheduled       │  │ Acme Corp │    │
│               │                             │  └───────────┘    │
│ ─────────     │  Yesterday                  │                   │
│ Score: 78     │  ├─ Call logged             │  Deals            │
│ Stage: SQL    │  └─ Note added              │  ┌───────────┐    │
│               │                             │  │ $50k - Q4 │    │
│ ─────────     │  Nov 28                     │  │ Proposal  │    │
│ Contact Info  │  └─ Contact created         │  └───────────┘    │
│ 📧 email      │                             │                   │
│ 📞 phone      │  [Log Call] [Log Note]      │  Tasks            │
│ 🔗 linkedin   │  [Send Email] [Schedule]    │  □ Follow up call │
│               │                             │  □ Send proposal  │
│ ─────────     │                             │                   │
│ Custom Fields │                             │                   │
│               │                             │                   │
└───────────────┴─────────────────────────────┴───────────────────┘
```

**Reference:** [HighLevel Contact Detail](https://help.gohighlevel.com/support/solutions/articles/155000006651-the-all-new-contact-detail-page) | [HubSpot Record Layout](https://knowledge.hubspot.com/records/work-with-records)

### 3.2 Left Panel (Profile)

```typescript
interface ContactProfilePanel {
  sections: [
    {
      id: 'header',
      components: ['avatar', 'name', 'title', 'company', 'quickActions'],
    },
    {
      id: 'score',
      components: ['scoreBadge', 'scoreTrend', 'scoreBreakdown'],
      collapsible: true,
    },
    {
      id: 'lifecycle',
      components: ['stageBadge', 'stageHistory'],
    },
    {
      id: 'contact',
      label: 'Contact Info',
      components: ['email', 'phone', 'address', 'socialLinks'],
      collapsible: true,
    },
    {
      id: 'custom',
      label: 'Custom Fields',
      components: ['dynamicFields'],
      collapsible: true,
    },
    {
      id: 'tags',
      components: ['tagList', 'addTag'],
    },
  ];
}
```

### 3.3 Center Panel (Activity Timeline)

```typescript
interface ActivityTimeline {
  // Activity types to display
  activityTypes: [
    { type: 'email', icon: '✉️', color: '#3B82F6' },
    { type: 'call', icon: '📞', color: '#10B981' },
    { type: 'meeting', icon: '📅', color: '#8B5CF6' },
    { type: 'note', icon: '📝', color: '#6B7280' },
    { type: 'task', icon: '✅', color: '#F59E0B' },
    { type: 'stage_change', icon: '🔄', color: '#F97316' },
    { type: 'score_change', icon: '📊', color: '#EC4899' },
    { type: 'enrichment', icon: '✨', color: '#14B8A6' },
  ];

  // Timeline features
  features: {
    groupByDate: true;
    filterByType: true;
    showSystemEvents: boolean;  // User toggle
    infiniteScroll: true;
    quickLog: ['call', 'note', 'email'];
  };

  // Quick action buttons
  quickActions: [
    { id: 'log_call', label: 'Log Call', icon: 'phone' },
    { id: 'add_note', label: 'Add Note', icon: 'pencil' },
    { id: 'send_email', label: 'Send Email', icon: 'mail' },
    { id: 'schedule_meeting', label: 'Schedule', icon: 'calendar' },
  ];
}
```

### 3.4 Right Panel (Associations)

```typescript
interface AssociationsPanel {
  sections: [
    {
      id: 'company',
      label: 'Company',
      type: 'single',
      fields: ['name', 'industry', 'size'],
      actions: ['view', 'change', 'create'],
    },
    {
      id: 'deals',
      label: 'Deals',
      type: 'list',
      fields: ['name', 'amount', 'stage'],
      actions: ['view', 'create'],
      maxVisible: 3,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      type: 'list',
      filter: { status: 'open' },
      fields: ['title', 'dueDate'],
      actions: ['complete', 'create'],
    },
    {
      id: 'related_contacts',
      label: 'Related Contacts',
      type: 'list',
      fields: ['name', 'relationship'],
      maxVisible: 5,
    },
  ];
}
```

### 3.5 Edit Mode

**Recommendation: Inline Editing**

- Click field to edit in place
- Auto-save after blur/enter
- Undo support (Cmd+Z)
- Validation feedback inline

---

## 4. Pipeline Board (Kanban)

### 4.1 Board Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Pipeline: Sales ▼    [+ Add Deal]    Filter: All Deals ▼    View: Board │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  LEAD ($45k)      QUALIFIED ($120k)   PROPOSAL ($80k)    WON ($200k)   │
│  ─────────────    ────────────────    ───────────────    ────────────  │
│  ┌───────────┐    ┌───────────┐       ┌───────────┐      ┌──────────┐  │
│  │ Acme Corp │    │ Beta Inc  │       │ Gamma Ltd │      │ Delta Co │  │
│  │ $25,000   │    │ $50,000   │       │ $30,000   │      │ $100,000 │  │
│  │ J. Smith  │    │ M. Jones  │       │ S. Lee    │      │ A. Brown │  │
│  │ 🔵 5 days │    │ 🟡 12 days│       │ 🔴 28 days│      │ ✅ Won   │  │
│  └───────────┘    └───────────┘       └───────────┘      └──────────┘  │
│  ┌───────────┐    ┌───────────┐       ┌───────────┐                    │
│  │ Echo LLC  │    │ Foxtrot   │       │ Golf Inc  │                    │
│  │ $20,000   │    │ $70,000   │       │ $50,000   │                    │
│  │ T. Clark  │    │ R. White  │       │ K. Green  │                    │
│  │ 🔵 2 days │    │ 🔵 3 days │       │ 🟡 14 days│                    │
│  └───────────┘    └───────────┘       └───────────┘                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Reference:** [Pipeline CRM Kanban](https://help.pipelinecrm.com/articles/238265-kanban-board) | [CRM.io Kanban](https://crm.io/kanban-board/)

### 4.2 Deal Card Design

```typescript
interface DealCard {
  // Always visible
  header: {
    name: string;              // Deal name
    amount: string;            // Formatted amount
    probability?: number;      // Win probability
  };

  // Configurable fields
  displayFields: [
    { field: 'contact.name', label: 'Contact' },
    { field: 'owner.name', label: 'Owner' },
    { field: 'closeDate', label: 'Close Date' },
    { field: 'daysInStage', label: 'Days', format: 'badge' },
  ];

  // Status indicators
  indicators: {
    stale: { threshold: 14, icon: '🔴' },
    warning: { threshold: 7, icon: '🟡' },
    healthy: { icon: '🔵' },
    overdue: { condition: 'closeDate < today', icon: '⚠️' },
  };

  // Actions
  actions: ['view', 'edit', 'move', 'archive'];
}
```

### 4.3 Drag & Drop Behavior

```typescript
interface DragDropConfig {
  // Drag constraints
  dragEnabled: true;
  dragHandle: 'card';          // vs 'handle' icon
  dragGhost: 'clone';          // Visual during drag

  // Drop behavior
  onDrop: {
    updateStage: true;
    showConfirmation: 'if_has_automations';
    triggerAgent: true;        // Flow agent suggestions
  };

  // Visual feedback
  feedback: {
    dragClass: 'opacity-50 scale-105';
    dropTargetClass: 'bg-blue-50 border-blue-200';
    invalidDropClass: 'bg-red-50';
  };

  // Restrictions
  restrictions: {
    canMoveBackward: true;
    requireReason: ['closed_lost'];
    blockedStages: [];         // Admin-configurable
  };
}
```

### 4.4 Stage Column Features

```typescript
interface StageColumn {
  header: {
    stageName: string;
    dealCount: number;
    totalValue: string;        // Sum of deal amounts
    color: string;
  };

  features: {
    collapse: boolean;         // Minimize column
    sort: ['amount', 'closeDate', 'createdAt', 'manual'];
    limit: number;             // Max visible cards before scroll
    quickAdd: boolean;         // + button at bottom
  };
}
```

---

## 5. Dashboard & Reports

### 5.1 Default Dashboard Widgets

```typescript
const DEFAULT_DASHBOARD_WIDGETS = [
  {
    id: 'pipeline_summary',
    title: 'Pipeline Summary',
    type: 'funnel',
    size: 'large',
    metrics: ['dealCount', 'totalValue', 'conversionRate'],
  },
  {
    id: 'sales_forecast',
    title: 'Sales Forecast',
    type: 'bar',
    size: 'medium',
    metrics: ['forecastByMonth', 'quotaProgress'],
  },
  {
    id: 'lead_sources',
    title: 'Lead Sources',
    type: 'pie',
    size: 'small',
    metrics: ['contactsBySource'],
  },
  {
    id: 'team_leaderboard',
    title: 'Team Performance',
    type: 'table',
    size: 'medium',
    metrics: ['dealsByOwner', 'revenueByOwner'],
  },
  {
    id: 'activity_feed',
    title: 'Recent Activity',
    type: 'list',
    size: 'small',
    metrics: ['recentActivities'],
  },
  {
    id: 'hot_leads',
    title: 'Hot Leads',
    type: 'list',
    size: 'small',
    filter: { scoreTier: 'SALES_READY' },
  },
];
```

**Reference:** [CRM Dashboard Examples](https://sales.hatrio.com/blog/10-crm-dashboard-examples-and-templates-for-key-metrics/) | [NetSuite CRM Dashboard](https://www.netsuite.com/portal/resource/articles/crm/crm-dashboard.shtml)

### 5.2 Key Metrics (5-10 recommended)

```typescript
const KEY_CRM_METRICS = [
  // Pipeline Health
  { id: 'pipeline_value', label: 'Pipeline Value', format: 'currency' },
  { id: 'pipeline_coverage', label: 'Coverage Ratio', format: 'ratio', target: 3 },
  { id: 'win_rate', label: 'Win Rate', format: 'percentage', target: 25 },

  // Velocity
  { id: 'avg_sales_cycle', label: 'Avg Sales Cycle', format: 'days', target: 30 },
  { id: 'avg_deal_size', label: 'Avg Deal Size', format: 'currency' },
  { id: 'pipeline_velocity', label: 'Pipeline Velocity', format: 'currency_per_day' },

  // Activity
  { id: 'activities_this_week', label: 'Activities (Week)', format: 'number' },
  { id: 'leads_created', label: 'New Leads', format: 'number' },
  { id: 'deals_closed', label: 'Deals Closed', format: 'number' },

  // Lead Quality
  { id: 'hot_leads_count', label: 'Hot Leads', format: 'number' },
  { id: 'avg_lead_score', label: 'Avg Lead Score', format: 'number' },
];
```

### 5.3 Widget Customization

```typescript
interface WidgetConfig {
  // Layout
  layout: {
    type: 'grid';              // CSS Grid
    columns: 12;               // 12-column grid
    rowHeight: 100;            // px
  };

  // Widget sizing
  sizes: {
    small: { cols: 3, rows: 2 },
    medium: { cols: 6, rows: 2 },
    large: { cols: 6, rows: 4 },
    full: { cols: 12, rows: 3 },
  };

  // User customization
  customization: {
    addWidget: true;
    removeWidget: true;
    resizeWidget: true;
    moveWidget: true;
    configureWidget: true;
  };
}
```

---

## 6. Navigation & Shortcuts

### 6.1 Command Palette (Cmd+K)

```typescript
interface CommandPalette {
  trigger: 'Cmd+K' | 'Ctrl+K';

  sections: [
    {
      id: 'navigation',
      commands: [
        { id: 'go_contacts', label: 'Go to Contacts', shortcut: 'gc' },
        { id: 'go_deals', label: 'Go to Deals', shortcut: 'gd' },
        { id: 'go_dashboard', label: 'Go to Dashboard', shortcut: 'gh' },
      ],
    },
    {
      id: 'create',
      commands: [
        { id: 'new_contact', label: 'New Contact', shortcut: 'nc' },
        { id: 'new_deal', label: 'New Deal', shortcut: 'nd' },
        { id: 'new_task', label: 'New Task', shortcut: 'nt' },
      ],
    },
    {
      id: 'search',
      commands: [
        { id: 'search_contacts', label: 'Search Contacts...', type: 'input' },
        { id: 'search_deals', label: 'Search Deals...', type: 'input' },
      ],
    },
  ];
}
```

### 6.2 Keyboard Shortcuts

```typescript
const KEYBOARD_SHORTCUTS = {
  // Global
  'Cmd+K': 'Open command palette',
  'Cmd+/': 'Show shortcuts',
  '/': 'Quick search (when not focused)',

  // Navigation
  'gc': 'Go to Contacts',
  'gd': 'Go to Deals',
  'gh': 'Go to Dashboard',

  // Actions
  'n': 'New (context-aware)',
  'e': 'Edit selected',
  'Escape': 'Close modal/cancel',

  // List navigation
  'j': 'Move down',
  'k': 'Move up',
  'Enter': 'Open selected',
  'x': 'Select/deselect',

  // Pipeline
  'l': 'Move deal right (next stage)',
  'h': 'Move deal left (prev stage)',
};
```

### 6.3 Global Search

```typescript
interface GlobalSearch {
  trigger: 'Cmd+F' | '/';

  searchableEntities: ['contacts', 'companies', 'deals'];

  features: {
    fuzzyMatching: true;
    recentSearches: true;
    savedSearches: true;
    filterSuggestions: true;
  };

  resultsPreview: {
    showCount: 5;              // Per entity type
    showFields: ['name', 'email', 'company'];
  };
}
```

---

## 7. Mobile & Responsive Design

### 7.1 Responsive Breakpoints

```typescript
const BREAKPOINTS = {
  mobile: 0,                   // 0-767px
  tablet: 768,                 // 768-1023px
  desktop: 1024,               // 1024-1439px
  wide: 1440,                  // 1440px+
};

const LAYOUT_ADAPTATIONS = {
  mobile: {
    sidebar: 'collapsed_by_default',
    contactDetail: 'single_panel_tabs',
    pipeline: 'single_column_scroll',
    table: 'card_list',
  },
  tablet: {
    sidebar: 'collapsible',
    contactDetail: 'two_panel',
    pipeline: 'horizontal_scroll',
    table: 'responsive_columns',
  },
};
```

### 7.2 Mobile-Specific Features

```typescript
interface MobileFeatures {
  // Touch gestures
  gestures: {
    swipeToCall: true;         // Swipe right on contact
    swipeToEmail: true;        // Swipe left on contact
    pullToRefresh: true;
    longPressMenu: true;
  };

  // Offline support
  offline: {
    readOnly: true;            // View cached data
    queueActions: true;        // Queue changes for sync
    syncOnReconnect: true;
  };

  // Mobile-optimized
  optimizations: {
    lazyLoadImages: true;
    virtualizedLists: true;
    reducedAnimations: true;
  };
}
```

**Reference:** [Zoho Mobile CRM](https://www.zoho.com/crm/mobile/) | [Salesforce Mobile](https://www.salesforce.com/solutions/mobile/overview/)

---

## 8. Answers to Research Questions

### Q1: Do we need a relationship map visualization?

**Answer: Nice-to-have for Phase 2.**

- Visual network of contacts/companies
- Shows relationships and influence
- Useful for account-based selling
- Consider: vis.js or d3.js

### Q2: Mobile CRM requirements?

**Answer: Responsive web first, native app later.**

MVP:
- Responsive web design
- Touch-optimized components
- Basic offline caching

Phase 2:
- PWA with offline support
- Native mobile app (if demand)

### Q3: Inline editing vs modal editing?

**Answer: Inline editing preferred.**

- Faster for quick updates
- Better UX flow
- Auto-save with undo
- Modal only for complex forms (new contact)

### Q4: How prominent is AI/agent interaction in CRM UI?

**Answer: Ambient presence with attention escalation.**

- Score badge always visible
- Suggestions in sidebar cards
- Toast for completions
- Modal only for approvals
- Chat available but not default

---

## 9. Component Library Recommendations

```typescript
const UI_COMPONENTS = {
  // Base
  framework: 'React',
  styling: 'Tailwind CSS',
  components: 'shadcn/ui',

  // Specialized
  tables: '@tanstack/react-table',
  virtualList: '@tanstack/react-virtual',
  dragDrop: '@dnd-kit/core',
  charts: 'recharts',
  forms: 'react-hook-form + zod',
  dates: 'date-fns',
  cmdPalette: 'cmdk',

  // Animation
  animation: 'framer-motion',
};
```

---

## 10. Sources

- [Attio vs Folk Comparison](https://www.whalesync.com/blog/attio-vs-folk)
- [Attio CRM Review](https://www.folk.app/articles/attio-crm-review-ai-powered-crm-for-modern-gtm-teams)
- [HighLevel Contact Detail Page](https://help.gohighlevel.com/support/solutions/articles/155000006651-the-all-new-contact-detail-page)
- [HubSpot Record Layout](https://knowledge.hubspot.com/records/work-with-records)
- [Pipeline CRM Kanban Board](https://help.pipelinecrm.com/articles/238265-kanban-board)
- [CRM Dashboard Examples](https://sales.hatrio.com/blog/10-crm-dashboard-examples-and-templates-for-key-metrics/)
- [NetSuite CRM Dashboard](https://www.netsuite.com/portal/resource/articles/crm/crm-dashboard.shtml)
- [Zoho Mobile CRM](https://www.zoho.com/crm/mobile/)
- [Salesforce Mobile App](https://www.salesforce.com/solutions/mobile/overview/)

---

**Research Status:** Complete
**Next:** Update checklist and proceed to Section 8 (CRM Compliance & Privacy)
