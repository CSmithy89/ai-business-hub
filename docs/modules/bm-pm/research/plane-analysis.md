# Plane Codebase Analysis

> **Analyzed**: 2025-11-29
> **Repository**: [makeplane/plane](https://github.com/makeplane/plane)
> **Local Path**: `/plane-preview/`
> **Analyst**: Winston (Architect), Mary (Analyst), Amelia (Developer)

## Executive Summary

This analysis examined Plane's actual codebase to extract patterns for the BM-PM (Project Management) module. Key findings:

1. **Data Models**: Django models with soft-delete pattern, JSON fields for flexible filters/display props
2. **Hierarchy**: Workspace → Project → Module/Cycle → Issue (maps well to Business → Project → Phase → Task)
3. **Frontend State**: MobX stores with computed properties and service layer separation
4. **Real-time**: Hocuspocus server with Redis pub/sub for horizontal scaling
5. **Views System**: JSON-based filter persistence with display filters and display properties separation

**Recommendation**: Adopt Plane's data model patterns, MobX store structure, and Views system. Defer Y.js/Hocuspocus until Phase 2.

---

## 1. Data Model Architecture

### 1.1 Base Model Pattern

All models inherit from `BaseModel` which provides soft-delete:

```python
# apps/api/plane/db/models/base.py (inferred from usage)
class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    updated_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    deleted_at = models.DateTimeField(null=True)  # Soft delete

    class Meta:
        abstract = True
```

### 1.2 Workspace Model

```python
# apps/api/plane/db/models/workspace.py:115-178
class Workspace(BaseModel):
    TIMEZONE_CHOICES = tuple(zip(pytz.common_timezones, pytz.common_timezones))

    name = models.CharField(max_length=80, verbose_name="Workspace Name")
    logo = models.TextField(verbose_name="Logo", blank=True, null=True)
    logo_asset = models.ForeignKey("db.FileAsset", on_delete=models.SET_NULL, null=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    slug = models.SlugField(max_length=48, db_index=True, unique=True)
    organization_size = models.CharField(max_length=20, blank=True, null=True)
    timezone = models.CharField(max_length=255, default="UTC", choices=TIMEZONE_CHOICES)
    background_color = models.CharField(max_length=255, default=get_random_color)

    class Meta:
        db_table = "workspaces"
        ordering = ("-created_at",)
```

**Key Pattern**: `WorkspaceBaseModel` provides workspace/project foreign keys to child models:

```python
# apps/api/plane/db/models/workspace.py:181-191
class WorkspaceBaseModel(BaseModel):
    workspace = models.ForeignKey("db.Workspace", models.CASCADE, related_name="workspace_%(class)s")
    project = models.ForeignKey("db.Project", models.CASCADE, related_name="project_%(class)s", null=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if self.project:
            self.workspace = self.project.workspace  # Auto-set workspace from project
        super().save(*args, **kwargs)
```

### 1.3 Project Model

```python
# apps/api/plane/db/models/project.py:65-159
class Project(BaseModel):
    NETWORK_CHOICES = ((0, "Secret"), (2, "Public"))

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    description_text = models.JSONField(blank=True, null=True)  # Rich text
    description_html = models.JSONField(blank=True, null=True)
    network = models.PositiveSmallIntegerField(default=2, choices=NETWORK_CHOICES)
    workspace = models.ForeignKey("db.WorkSpace", on_delete=models.CASCADE)
    identifier = models.CharField(max_length=12, db_index=True)  # e.g., "PROJ"

    # Feature toggles
    module_view = models.BooleanField(default=False)
    cycle_view = models.BooleanField(default=False)
    issue_views_view = models.BooleanField(default=False)
    page_view = models.BooleanField(default=True)
    intake_view = models.BooleanField(default=False)
    is_time_tracking_enabled = models.BooleanField(default=False)

    # Assignments
    default_assignee = models.ForeignKey(User, null=True, related_name="default_assignee")
    project_lead = models.ForeignKey(User, null=True, related_name="project_lead")
    default_state = models.ForeignKey("db.State", null=True)
    estimate = models.ForeignKey("db.Estimate", null=True)

    # Archival settings
    archive_in = models.IntegerField(default=0)  # Auto-archive after N months
    close_in = models.IntegerField(default=0)    # Auto-close after N months
    archived_at = models.DateTimeField(null=True)

    # External integrations
    external_source = models.CharField(max_length=255, null=True)
    external_id = models.CharField(max_length=255, null=True)

    class Meta:
        db_table = "projects"
        unique_together = [["identifier", "workspace", "deleted_at"], ["name", "workspace", "deleted_at"]]
```

### 1.4 Cycle Model (Maps to Phase)

```python
# apps/api/plane/db/models/cycle.py:56-98
class Cycle(ProjectBaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    owned_by = models.ForeignKey(User, on_delete=models.CASCADE)
    view_props = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)
    progress_snapshot = models.JSONField(default=dict)  # Analytics cache
    archived_at = models.DateTimeField(null=True)
    logo_props = models.JSONField(default=dict)
    timezone = models.CharField(max_length=255, default="UTC")
    version = models.IntegerField(default=1)  # Schema version for analytics

    class Meta:
        db_table = "cycles"
```

**CycleIssue Junction Table**:

```python
# apps/api/plane/db/models/cycle.py:100-124
class CycleIssue(ProjectBaseModel):
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="issue_cycle")
    cycle = models.ForeignKey(Cycle, on_delete=models.CASCADE, related_name="issue_cycle")

    class Meta:
        db_table = "cycle_issues"
        unique_together = ["issue", "cycle", "deleted_at"]
```

### 1.5 Module Model (Optional Grouping)

```python
# apps/api/plane/db/models/module.py:54-124
class ModuleStatus(models.TextChoices):
    BACKLOG = "backlog"
    PLANNED = "planned"
    IN_PROGRESS = "in-progress"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Module(ProjectBaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    description_text = models.JSONField(blank=True, null=True)
    description_html = models.JSONField(blank=True, null=True)
    start_date = models.DateField(null=True)
    target_date = models.DateField(null=True)
    status = models.CharField(choices=ModuleStatus.choices, default="planned", max_length=20)
    lead = models.ForeignKey("db.User", null=True)
    members = models.ManyToManyField(User, through="ModuleMember")
    view_props = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)
    archived_at = models.DateTimeField(null=True)

    class Meta:
        db_table = "modules"
        unique_together = ["name", "project", "deleted_at"]
```

### 1.6 Issue Model (Maps to Task)

```python
# apps/api/plane/db/models/issue.py:108-255
class Issue(ProjectBaseModel):
    PRIORITY_CHOICES = (
        ("urgent", "Urgent"),
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
        ("none", "None"),
    )

    # Core fields
    name = models.CharField(max_length=255)
    description = models.JSONField(blank=True, default=dict)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    description_binary = models.BinaryField(null=True)  # Y.js document

    # Hierarchy
    parent = models.ForeignKey("self", null=True, related_name="parent_issue")

    # Classification
    state = models.ForeignKey("db.State", null=True, related_name="state_issue")
    priority = models.CharField(max_length=30, choices=PRIORITY_CHOICES, default="none")
    type = models.ForeignKey("db.IssueType", null=True)

    # Estimates
    point = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(12)], null=True)
    estimate_point = models.ForeignKey("db.EstimatePoint", null=True)

    # Dates
    start_date = models.DateField(null=True)
    target_date = models.DateField(null=True)
    completed_at = models.DateTimeField(null=True)

    # Relationships (Many-to-Many)
    assignees = models.ManyToManyField(User, through="IssueAssignee")
    labels = models.ManyToManyField("db.Label", through="IssueLabel")

    # Ordering & Status
    sequence_id = models.IntegerField(default=1)  # Auto-incrementing per project
    sort_order = models.FloatField(default=65535)
    archived_at = models.DateField(null=True)
    is_draft = models.BooleanField(default=False)

    class Meta:
        db_table = "issues"
```

### 1.7 Issue Relations

```python
# apps/api/plane/db/models/issue.py:271-319
class IssueRelationChoices(models.TextChoices):
    DUPLICATE = "duplicate", "Duplicate"
    RELATES_TO = "relates_to", "Relates To"
    BLOCKED_BY = "blocked_by", "Blocked By"
    START_BEFORE = "start_before", "Start Before"
    FINISH_BEFORE = "finish_before", "Finish Before"
    IMPLEMENTED_BY = "implemented_by", "Implemented By"

# Bidirectional relation pairs
IssueRelationChoices._RELATION_PAIRS = (
    ("blocked_by", "blocking"),
    ("relates_to", "relates_to"),  # symmetric
    ("duplicate", "duplicate"),    # symmetric
    ("start_before", "start_after"),
    ("finish_before", "finish_after"),
    ("implemented_by", "implements"),
)

class IssueRelation(ProjectBaseModel):
    issue = models.ForeignKey(Issue, related_name="issue_relation")
    related_issue = models.ForeignKey(Issue, related_name="issue_related")
    relation_type = models.CharField(max_length=20, default=IssueRelationChoices.BLOCKED_BY)

    class Meta:
        db_table = "issue_relations"
        unique_together = ["issue", "related_issue", "deleted_at"]
```

---

## 2. Views/Filter System

### 2.1 IssueView Model

```python
# apps/api/plane/db/models/view.py:54-95
class IssueView(WorkspaceBaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    query = models.JSONField(verbose_name="View Query")  # Computed from filters
    filters = models.JSONField(default=dict)
    display_filters = models.JSONField(default=get_default_display_filters)
    display_properties = models.JSONField(default=get_default_display_properties)
    rich_filters = models.JSONField(default=dict)  # Advanced filter expressions
    access = models.PositiveSmallIntegerField(default=1, choices=((0, "Private"), (1, "Public")))
    sort_order = models.FloatField(default=65535)
    logo_props = models.JSONField(default=dict)
    owned_by = models.ForeignKey(User, on_delete=models.CASCADE)
    is_locked = models.BooleanField(default=False)

    class Meta:
        db_table = "issue_views"
```

### 2.2 Default Filter Structures

```python
# apps/api/plane/db/models/view.py:10-51
def get_default_filters():
    return {
        "priority": None,
        "state": None,
        "state_group": None,
        "assignees": None,
        "created_by": None,
        "labels": None,
        "start_date": None,
        "target_date": None,
        "subscriber": None,
    }

def get_default_display_filters():
    return {
        "group_by": None,
        "order_by": "-created_at",
        "type": None,
        "sub_issue": True,
        "show_empty_groups": True,
        "layout": "list",  # list, kanban, calendar, spreadsheet, gantt
        "calendar_date_range": "",
    }

def get_default_display_properties():
    return {
        "assignee": True,
        "attachment_count": True,
        "created_on": True,
        "due_date": True,
        "estimate": True,
        "key": True,
        "labels": True,
        "link": True,
        "priority": True,
        "start_date": True,
        "state": True,
        "sub_issue_count": True,
        "updated_on": True,
    }
```

---

## 3. Intake/Inbox System

### 3.1 Intake Model

```python
# apps/api/plane/db/models/intake.py:8-31
class Intake(ProjectBaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)
    view_props = models.JSONField(default=dict)
    logo_props = models.JSONField(default=dict)

    class Meta:
        db_table = "intakes"
        unique_together = ["name", "project", "deleted_at"]
```

### 3.2 IntakeIssue Model (Triage Queue)

```python
# apps/api/plane/db/models/intake.py:34-81
class IntakeIssueStatus(models.IntegerChoices):
    PENDING = -2
    REJECTED = -1
    SNOOZED = 0
    ACCEPTED = 1
    DUPLICATE = 2

class IntakeIssue(ProjectBaseModel):
    intake = models.ForeignKey("db.Intake", related_name="issue_intake")
    issue = models.ForeignKey("db.Issue", related_name="issue_intake")
    status = models.IntegerField(choices=IntakeIssueStatus.choices, default=-2)
    snoozed_till = models.DateTimeField(null=True)
    duplicate_to = models.ForeignKey("db.Issue", null=True, related_name="intake_duplicate")
    source = models.CharField(max_length=255, default="IN_APP")
    source_email = models.TextField(blank=True, null=True)
    external_source = models.CharField(max_length=255, null=True)
    external_id = models.CharField(max_length=255, null=True)
    extra = models.JSONField(default=dict)

    class Meta:
        db_table = "intake_issues"
```

**AI Business Hub Mapping**: Agent outputs become `IntakeIssue` items with `source="AGENT"`:
- `PENDING` → Agent submitted, awaiting human review
- `ACCEPTED` → Human approved, becomes official deliverable
- `REJECTED` → Human declined, agent notified to retry
- `SNOOZED` → Deferred for later review

---

## 4. Kanban Board Implementation

### 4.1 Component Structure

```
apps/web/core/components/issues/issue-layouts/kanban/
├── base-kanban-root.tsx    # Main container with drag-and-drop
├── default.tsx             # Standard Kanban board
├── swimlanes.tsx           # Sub-grouped Kanban
├── kanban-group.tsx        # Single column
├── block.tsx               # Issue card
├── blocks-list.tsx         # List of cards in column
├── headers/
│   ├── group-by-card.tsx   # Column header
│   └── sub-group-by-card.tsx
└── roots/
    ├── project-root.tsx    # Project context
    ├── cycle-root.tsx      # Cycle context
    └── module-root.tsx     # Module context
```

### 4.2 Drag and Drop Pattern

```typescript
// apps/web/core/components/issues/issue-layouts/kanban/base-kanban-root.tsx
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";

export const BaseKanBanRoot = observer(function BaseKanBanRoot(props) {
  const { handleOnDrop } = useGroupIssuesDragNDrop(storeType, orderBy, group_by, sub_group_by);

  // Delete drop zone
  useEffect(() => {
    const element = deleteAreaRef.current;
    return combine(
      dropTargetForElements({
        element,
        getData: () => ({ columnId: "issue-trash-box", type: "DELETE" }),
        onDrop: (payload) => {
          const source = getSourceFromDropPayload(payload);
          setDraggedIssueId(source.id);
          setDeleteIssueModal(true);
        },
      })
    );
  }, []);

  // Auto-scroll during drag
  useEffect(() => {
    return combine(autoScrollForElements({ element: scrollableContainerRef.current }));
  }, []);

  const KanBanView = sub_group_by ? KanBanSwimLanes : KanBan;

  return (
    <KanBanView
      groupedIssueIds={groupedIssueIds}
      handleOnDrop={handleOnDrop}
      // ...
    />
  );
});
```

**Key Library**: `@atlaskit/pragmatic-drag-and-drop` - Not react-beautiful-dnd

---

## 5. State Management (MobX)

### 5.1 Root Store Structure

```typescript
// apps/web/core/store/root.store.ts
export class CoreRootStore {
  workspaceRoot: IWorkspaceRootStore;
  projectRoot: IProjectRootStore;
  memberRoot: IMemberRootStore;
  cycle: ICycleStore;
  cycleFilter: ICycleFilterStore;
  module: IModuleStore;
  moduleFilter: IModuleFilterStore;
  projectView: IProjectViewStore;
  globalView: IGlobalViewStore;
  issue: IIssueRootStore;
  state: IStateStore;
  label: ILabelStore;
  dashboard: IDashboardStore;
  analytics: IAnalyticsStore;
  projectPages: IProjectPageStore;
  router: IRouterStore;
  commandPalette: ICommandPaletteStore;
  theme: IThemeStore;
  instance: IInstanceStore;
  user: IUserStore;
  projectInbox: IProjectInboxStore;
  projectEstimate: IProjectEstimateStore;
  multipleSelect: IMultipleSelectStore;
  workspaceNotification: IWorkspaceNotificationStore;
  favorite: IFavoriteStore;
  // ...

  constructor() {
    this.router = new RouterStore();
    this.user = new UserStore(this);
    this.workspaceRoot = new WorkspaceRootStore(this);
    this.projectRoot = new ProjectRootStore(this);
    this.cycle = new CycleStore(this);
    this.issue = new IssueRootStore(this);
    // ... each store receives rootStore for cross-store access
  }

  resetOnSignOut() {
    // Reinitialize all stores
  }
}
```

### 5.2 Cycle Store Pattern

```typescript
// apps/web/core/store/cycle.store.ts
export class CycleStore implements ICycleStore {
  // Observables
  loader: boolean = false;
  cycleMap: Record<string, ICycle> = {};
  plotType: Record<string, TCyclePlotType> = {};
  activeCycleIdMap: Record<string, boolean> = {};
  fetchedMap: Record<string, boolean> = {};

  // Root store reference
  rootStore;

  // Services (API layer)
  cycleService;
  cycleArchiveService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      loader: observable.ref,
      cycleMap: observable,
      activeCycleIdMap: observable,
      fetchedMap: observable,
      currentProjectCycleIds: computed,
      currentProjectActiveCycleId: computed,
      fetchAllCycles: action,
      updateCycleDetails: action,
    });
    this.rootStore = _rootStore;
    this.cycleService = new CycleService();
  }

  // Computed with memoization
  get currentProjectCycleIds() {
    const projectId = this.rootStore.router.projectId;
    if (!projectId || !this.fetchedMap[projectId]) return null;
    let allCycles = Object.values(this.cycleMap ?? {})
      .filter((c) => c?.project_id === projectId && !c?.archived_at);
    allCycles = sortBy(allCycles, [(c) => c.sort_order]);
    return allCycles.map((c) => c.id);
  }

  // Action with optimistic update
  updateCycleDetails = async (workspaceSlug, projectId, cycleId, data) => {
    try {
      // Optimistic update
      runInAction(() => {
        set(this.cycleMap, [cycleId], { ...this.cycleMap?.[cycleId], ...data });
      });
      // API call
      const response = await this.cycleService.patchCycle(workspaceSlug, projectId, cycleId, data);
      return response;
    } catch (error) {
      // Revert on error
      this.fetchAllCycles(workspaceSlug, projectId);
      throw error;
    }
  };
}
```

**Key Patterns**:
1. `cycleMap: Record<string, ICycle>` - Normalized data storage
2. `fetchedMap: Record<string, boolean>` - Track what's been loaded
3. `computedFn` from mobx-utils for memoized methods with parameters
4. Optimistic updates with rollback on error
5. Services layer for API calls

---

## 6. Real-time Collaboration (Y.js + Hocuspocus)

### 6.1 Hocuspocus Server Manager

```typescript
// apps/live/src/hocuspocus.ts
import { Hocuspocus } from "@hocuspocus/server";
import { getExtensions } from "@/extensions";
import { onAuthenticate } from "@/lib/auth";

export class HocusPocusServerManager {
  private static instance: HocusPocusServerManager | null = null;
  private server: Hocuspocus | null = null;

  public static getInstance(): HocusPocusServerManager {
    if (!HocusPocusServerManager.instance) {
      HocusPocusServerManager.instance = new HocusPocusServerManager();
    }
    return HocusPocusServerManager.instance;
  }

  public async initialize(): Promise<Hocuspocus> {
    this.server = new Hocuspocus({
      name: this.serverName,
      onAuthenticate,
      extensions: getExtensions(),  // Database, Redis, Logger
      debounce: 10000,  // 10s debounce for saves
    });
    return this.server;
  }
}
```

### 6.2 Database Extension

```typescript
// apps/live/src/extensions/database.ts
import { Database as HocuspocusDatabase } from "@hocuspocus/extension-database";
import { getAllDocumentFormatsFromDocumentEditorBinaryData, getBinaryDataFromDocumentEditorHTMLString } from "@plane/editor";

const fetchDocument = async ({ context, documentName: pageId }) => {
  const service = getPageService(context.documentType, context);
  const response = await service.fetchDescriptionBinary(pageId);
  const binaryData = new Uint8Array(response);

  // Fallback: convert HTML to binary if empty
  if (binaryData.byteLength === 0) {
    const pageDetails = await service.fetchDetails(pageId);
    return getBinaryDataFromDocumentEditorHTMLString(pageDetails.description_html ?? "<p></p>");
  }
  return binaryData;
};

const storeDocument = async ({ context, state: pageBinaryData, documentName: pageId }) => {
  const service = getPageService(context.documentType, context);

  // Convert Y.js binary to all formats
  const { contentBinaryEncoded, contentHTML, contentJSON } =
    getAllDocumentFormatsFromDocumentEditorBinaryData(pageBinaryData);

  await service.updateDescriptionBinary(pageId, {
    description_binary: contentBinaryEncoded,
    description_html: contentHTML,
    description: contentJSON,
  });
};

export class Database extends HocuspocusDatabase {
  constructor() {
    super({ fetch: fetchDocument, store: storeDocument });
  }
}
```

### 6.3 Redis Extension for Horizontal Scaling

```typescript
// apps/live/src/extensions/redis.ts
import { Redis as HocuspocusRedis } from "@hocuspocus/extension-redis";

export class Redis extends HocuspocusRedis {
  private adminHandlers = new Map<AdminCommand, AdminCommandHandler>();
  private readonly ADMIN_CHANNEL = "hocuspocus:admin";

  constructor() {
    super({ redis: getRedisClient() });
  }

  async onConfigure(payload: onConfigurePayload) {
    await super.onConfigure(payload);
    // Subscribe to admin commands channel
    await this.sub.subscribe(this.ADMIN_CHANNEL);
    this.sub.on("message", this.handleAdminMessage);
  }

  // Broadcast to document across all servers
  public async broadcastToDocument(documentName: string, payload: unknown): Promise<number> {
    const message = new OutgoingMessage(documentName).writeBroadcastStateless(JSON.stringify(payload));
    const channel = this["pubKey"](documentName);
    return await this.pub.publishBuffer(channel, Buffer.from(message.toUint8Array()));
  }
}
```

---

## 7. Mapping to AI Business Hub

### 7.1 Entity Mapping

| Plane Entity | BM-PM Entity | Key Differences |
|--------------|--------------|-----------------|
| Workspace | Business | Add BYOAI config, billing, branding |
| Project | Project | Add BMAD template type (Course, Podcast, etc.), agent team |
| Cycle | Phase | Map to BMAD phases (BUILD 1-7, OPERATE), phase templates |
| Module | ProjectCategory | Optional, for grouping related projects |
| Issue | AgentTask | Add assignment_type (HUMAN/AGENT/HYBRID), confidence score |
| IntakeIssue | AgentOutput | Agent deliverables awaiting human approval |
| IssueView | DashboardView | Views for agent activity, approvals, errors |
| IssueRelation | TaskDependency | Add WAITS_FOR for agent task ordering |

### 7.2 Additional Fields Needed

```python
# BM-PM AgentTask model additions
class AgentTask(ProjectBaseModel):
    # From Plane Issue...

    # BM-PM specific
    assignment_type = models.CharField(choices=[
        ("HUMAN", "Human Only"),
        ("AGENT", "Agent Only"),
        ("HYBRID", "Human + Agent"),
    ], default="HUMAN")

    assigned_agent = models.ForeignKey("AgentConfig", null=True)
    agent_confidence = models.FloatField(null=True)  # 0.0 - 1.0
    auto_approved = models.BooleanField(default=False)
    approval_threshold = models.FloatField(default=0.9)  # Auto-approve if confidence >= threshold

    # Phase linkage (like CycleIssue but for phases)
    phase = models.ForeignKey("Phase", null=True, related_name="phase_tasks")
```

---

## 8. Adoption Recommendations

### Must Adopt (Sprint 1-2)

| Pattern | Source File | Why |
|---------|-------------|-----|
| BaseModel + soft delete | `models/base.py` | Standard pattern, audit trail |
| WorkspaceBaseModel | `models/workspace.py` | Auto-workspace assignment |
| Normalized store pattern | `store/cycle.store.ts` | Efficient updates, computed derivations |
| Filter JSON structure | `models/view.py` | Flexible, frontend-friendly |
| Intake triage flow | `models/intake.py` | Perfect for agent output review |

### Adopt with Modifications (Sprint 3-4)

| Pattern | Modification |
|---------|--------------|
| Cycle → Phase | Add BMAD phase templates, phase_type enum |
| Issue → AgentTask | Add agent assignment, confidence, auto-approval |
| IssueView → DashboardView | Add agent-specific default views |
| CycleAnalytics | Adapt for phase progress, agent performance |

### Defer (Future)

| Pattern | When | Why |
|---------|------|-----|
| Y.js + Hocuspocus | Phase 2 | Complex, needed for collaborative docs |
| Module | If needed | May not need grouping beyond Project |
| IssueVersion | If needed | Complex versioning system |

---

## 9. Key Code Patterns to Reuse

### 9.1 Soft Delete with Unique Constraints

```python
class Meta:
    unique_together = ["name", "project", "deleted_at"]
    constraints = [
        models.UniqueConstraint(
            fields=["name", "project"],
            condition=Q(deleted_at__isnull=True),
            name="unique_name_project_when_deleted_at_null",
        )
    ]
```

### 9.2 Sort Order Management

```python
def save(self, *args, **kwargs):
    if self._state.adding:
        smallest_sort_order = Model.objects.filter(project=self.project).aggregate(
            smallest=models.Min("sort_order")
        )["smallest"]
        if smallest_sort_order is not None:
            self.sort_order = smallest_sort_order - 10000  # Insert at top
    super().save(*args, **kwargs)
```

### 9.3 MobX Store with Services

```typescript
constructor(_rootStore: RootStore) {
  makeObservable(this, {
    dataMap: observable,
    loader: observable.ref,
    currentItems: computed,
    fetchData: action,
  });
  this.rootStore = _rootStore;
  this.service = new DataService();
}
```

---

## 10. AI Features

Plane has integrated AI capabilities for text processing within the editor.

### 10.1 AI Service Architecture

**Source**: `packages/services/src/ai/ai.service.ts`

```typescript
export type TTaskPayload = {
  task: string;
  text_input: string;
  casual_score?: number;   // Tone adjustment (0-10)
  formal_score?: number;   // Tone adjustment (0-10)
};

export class AIService extends APIService {
  // General AI prompt endpoint
  async prompt(
    workspaceSlug: string,
    data: { prompt: string; task: string }
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/ai-assistant/`, data);
  }

  // Text rephrase/grammar endpoint
  async rephraseGrammar(
    workspaceSlug: string,
    data: TTaskPayload
  ): Promise<{ response: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/rephrase-grammar/`, data);
  }

  // Editor task endpoint with tone support
  async performEditorTask(
    workspaceSlug: string,
    data: TTaskPayload
  ): Promise<{ response: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/perform-editor-task/`, data);
  }
}
```

### 10.2 Editor AI Menu

**Source**: `apps/web/ce/components/pages/editor/ai/menu.tsx`

The editor includes an AI assistant menu with:
- **Ask Pi**: Free-form AI prompts
- **Tone adjustment**: Default, Professional (💼), Casual (😃)
- **Response actions**: Replace selection, Insert below, Regenerate

```typescript
const TONES_LIST = [
  { key: "default", label: "Default", casual_score: 5, formal_score: 5 },
  { key: "professional", label: "💼 Professional", casual_score: 0, formal_score: 10 },
  { key: "casual", label: "😃 Casual", casual_score: 10, formal_score: 0 },
];
```

### 10.3 Admin LLM Configuration

**Source**: `apps/admin/app/(all)/(dashboard)/ai/form.tsx`

Instance-level AI configuration:
- `LLM_MODEL`: Model selection (default: "gpt-4o-mini")
- `LLM_API_KEY`: OpenAI API key

### 10.4 BM-PM Application

- **Agent task descriptions**: AI-assisted task breakdown
- **Response tone adjustment**: Professional for client communication
- **LLM configuration pattern**: Workspace-level AI settings

---

## 11. Pages/Knowledge System

Plane has a sophisticated collaborative documentation system.

### 11.1 Page Model

**Source**: `apps/api/plane/db/models/page.py`

```python
class Page(BaseModel):
    PRIVATE_ACCESS = 1
    PUBLIC_ACCESS = 0

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE)
    name = models.TextField(blank=True)

    # Y.js collaborative content
    description = models.JSONField(default=dict, blank=True)
    description_binary = models.BinaryField(null=True)  # Y.js document state
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)

    owned_by = models.ForeignKey(settings.AUTH_USER_MODEL)
    access = models.PositiveSmallIntegerField(choices=ACCESS_CHOICES, default=0)

    # Hierarchy support
    parent = models.ForeignKey("self", null=True, related_name="child_page")

    # Page features
    color = models.CharField(max_length=255, blank=True)
    labels = models.ManyToManyField("db.Label", through="db.PageLabel")
    is_locked = models.BooleanField(default=False)
    archived_at = models.DateField(null=True)

    # Cross-project pages
    is_global = models.BooleanField(default=False)
    projects = models.ManyToManyField("db.Project", through="db.ProjectPage")

    # Move tracking
    moved_to_page = models.UUIDField(null=True, blank=True)
    moved_to_project = models.UUIDField(null=True, blank=True)

    sort_order = models.FloatField(default=DEFAULT_SORT_ORDER)
```

### 11.2 Page Versioning

```python
class PageVersion(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE)
    page = models.ForeignKey("db.Page", on_delete=models.CASCADE)
    last_saved_at = models.DateTimeField(default=timezone.now)
    owned_by = models.ForeignKey(settings.AUTH_USER_MODEL)

    description_binary = models.BinaryField(null=True)
    description_html = models.TextField(blank=True)
    description_stripped = models.TextField(blank=True, null=True)
    description_json = models.JSONField(default=dict, blank=True)
    sub_pages_data = models.JSONField(default=dict, blank=True)
```

### 11.3 Page Entity Logging

```python
class PageLog(BaseModel):
    TYPE_CHOICES = (
        ("to_do", "To Do"),
        ("issue", "issue"),
        ("image", "Image"),
        ("video", "Video"),
        ("file", "File"),
        ("link", "Link"),
        ("cycle", "Cycle"),
        ("module", "Module"),
        ("back_link", "Back Link"),
        ("forward_link", "Forward Link"),
        ("page_mention", "Page Mention"),
        ("user_mention", "User Mention"),
    )

    transaction = models.UUIDField(default=uuid.uuid4)
    page = models.ForeignKey(Page, on_delete=models.CASCADE)
    entity_identifier = models.UUIDField(null=True, blank=True)
    entity_name = models.CharField(max_length=30)
    entity_type = models.CharField(max_length=30, null=True, blank=True)
```

### 11.4 BM-PM Application

- **Agent documentation**: Auto-generated task summaries
- **Knowledge base**: Product/project documentation
- **Version history**: Track AI-generated content changes
- **Page hierarchy**: Documentation organization

---

## 12. Estimates System

Task complexity estimation using point-based or category systems.

### 12.1 Data Models

**Source**: `apps/api/plane/db/models/estimate.py`

```python
class Estimate(ProjectBaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=255, default="categories")
    last_used = models.BooleanField(default=False)

class EstimatePoint(ProjectBaseModel):
    estimate = models.ForeignKey("db.Estimate", related_name="points")
    key = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(12)]
    )
    description = models.TextField(blank=True)
    value = models.CharField(max_length=255)  # "XS", "S", "M", "L", "XL" or "1", "2", "3"
```

### 12.2 Estimate Types

- **Categories**: T-shirt sizes (XS, S, M, L, XL)
- **Points**: Fibonacci or custom numeric (1, 2, 3, 5, 8, 13)

### 12.3 BM-PM Application

- **Agent capacity planning**: Estimate task complexity for agent assignment
- **Confidence scoring**: Use estimates as confidence indicators
- **Sprint planning**: Calculate sprint capacity based on estimates

---

## 13. Notifications System

Comprehensive notification management with preferences.

### 13.1 Notification Model

**Source**: `apps/api/plane/db/models/notification.py`

```python
class Notification(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE)
    project = models.ForeignKey("db.Project", null=True)

    # Entity reference (polymorphic pattern)
    entity_identifier = models.UUIDField(null=True)
    entity_name = models.CharField(max_length=255)

    # Content
    title = models.TextField()
    message = models.JSONField(null=True)
    message_html = models.TextField(blank=True)
    data = models.JSONField(null=True)
    sender = models.CharField(max_length=255)

    # Users
    triggered_by = models.ForeignKey("db.User", related_name="triggered_notifications")
    receiver = models.ForeignKey("db.User", related_name="received_notifications")

    # Status management
    read_at = models.DateTimeField(null=True)
    snoozed_till = models.DateTimeField(null=True)
    archived_at = models.DateTimeField(null=True)
```

### 13.2 Notification Indexes

Heavy indexing for efficient queries:

```python
indexes = [
    models.Index(fields=["entity_identifier"]),
    models.Index(fields=["entity_name"]),
    models.Index(fields=["read_at"]),
    models.Index(fields=["receiver", "read_at"]),
    models.Index(fields=["receiver", "workspace", "read_at", "created_at"]),
    models.Index(fields=["receiver", "workspace", "entity_name", "read_at"]),
    models.Index(fields=["receiver", "workspace", "snoozed_till", "archived_at"]),
]
```

### 13.3 User Notification Preferences

```python
class UserNotificationPreference(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL)
    workspace = models.ForeignKey("db.Workspace", null=True)
    project = models.ForeignKey("db.Project", null=True)

    # Preference flags
    property_change = models.BooleanField(default=True)
    state_change = models.BooleanField(default=True)
    comment = models.BooleanField(default=True)
    mention = models.BooleanField(default=True)
    issue_completed = models.BooleanField(default=True)
```

### 13.4 BM-PM Application

- **Agent activity notifications**: Task completion, errors, approvals needed
- **User preferences**: Control notification types per workspace
- **Entity-based routing**: Route notifications based on entity type

---

## 14. State Machine / Workflows

Customizable workflow states with state groups.

### 14.1 State Groups

**Source**: `apps/api/plane/db/models/state.py`

```python
class StateGroup(models.TextChoices):
    BACKLOG = "backlog", "Backlog"
    UNSTARTED = "unstarted", "Unstarted"
    STARTED = "started", "Started"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"
    TRIAGE = "triage", "Triage"
```

### 14.2 State Model

```python
class State(ProjectBaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, blank=True)
    sequence = models.FloatField(default=65535)
    group = models.CharField(choices=StateGroup.choices, default=StateGroup.BACKLOG)
    is_triage = models.BooleanField(default=False)
    default = models.BooleanField(default=False)

    # Managers for filtered queries
    objects = StateManager()           # Excludes triage states
    all_state_objects = models.Manager()  # All states
    triage_objects = TriageStateManager()  # Only triage states
```

### 14.3 Default States

```python
DEFAULT_STATES = [
    {"name": "Backlog", "color": "#60646C", "sequence": 15000, "group": "backlog", "default": True},
    {"name": "Todo", "color": "#60646C", "sequence": 25000, "group": "unstarted"},
    {"name": "In Progress", "color": "#F59E0B", "sequence": 35000, "group": "started"},
    {"name": "Done", "color": "#46A758", "sequence": 45000, "group": "completed"},
    {"name": "Cancelled", "color": "#9AA4BC", "sequence": 55000, "group": "cancelled"},
    {"name": "Triage", "color": "#4E5355", "sequence": 65000, "group": "triage"},
]
```

### 14.4 BM-PM Application

- **Agent task states**: QUEUED, IN_PROGRESS, AWAITING_APPROVAL, COMPLETED, FAILED
- **State groups**: Group custom states for consistent filtering
- **Default states**: Auto-create states for new products/projects
- **Triage pattern**: Intake queue for unassigned agent tasks

---

## 15. Power-K Command Palette

Full-featured command palette with contextual actions and keyboard shortcuts.

### 15.1 Command Types

**Source**: `apps/web/core/components/power-k/core/types.ts`

```typescript
export type TPowerKCommandConfig = {
  id: string;
  i18n_title: string;
  i18n_description?: string;
  icon?: React.ComponentType<{ className?: string }>;

  // Keyboard shortcuts (ONE of these)
  shortcut?: string;           // Single key: "c", "p", "s"
  keySequence?: string;        // Sequence: "gm", "op", "oc"
  modifierShortcut?: string;   // With modifiers: "cmd+k", "cmd+delete"

  closeOnSelect: boolean;

  // Dynamic visibility based on context
  isVisible: (ctx: TPowerKContext) => boolean;
  isEnabled: (ctx: TPowerKContext) => boolean;
  keywords?: string[];
} & (
  | { type: "change-page"; page: TPowerKPageType; onSelect: (data, ctx) => void }
  | { type: "action"; action: (ctx) => void | Promise<void> }
);
```

### 15.2 Command Groups

```typescript
export type TPowerKCommandGroup =
  | "contextual"    // Context-specific actions
  | "navigation"    // Go to pages
  | "create"        // Create entities
  | "general"       // General actions
  | "settings"      // Settings access
  | "help"          // Help resources
  | "account"       // Account actions
  | "miscellaneous" // Other actions
  | "preferences";  // User preferences
```

### 15.3 Context Types

```typescript
export type TPowerKContextType = "work-item" | "page" | "cycle" | "module";
```

### 15.4 Command Registry

**Source**: `apps/web/core/components/power-k/core/registry.ts`

```typescript
export class PowerKCommandRegistry {
  commands = new Map<string, TPowerKCommandConfig>();

  register(command: TPowerKCommandConfig): void;
  registerMultiple(commands: TPowerKCommandConfig[]): void;

  getVisibleCommands(ctx: TPowerKContext): TPowerKCommandConfig[];
  getCommandsByGroup(group, ctx): TPowerKCommandConfig[];

  // Shortcut lookup methods
  getShortcutMap(ctx): Map<string, string>;
  getKeySequenceMap(ctx): Map<string, string>;
  getModifierShortcutMap(ctx): Map<string, string>;

  findByShortcut(ctx, key): TPowerKCommandConfig | undefined;
  findByKeySequence(ctx, sequence): TPowerKCommandConfig | undefined;
}
```

### 15.5 BM-PM Application

- **Agent commands**: Quick actions for agent control
- **Context-aware actions**: Show relevant commands for current entity
- **Keyboard shortcuts**: Efficient task management
- **Search**: Find entities and commands quickly

---

## 16. Propel UI Component Library

Modern React component library with Tailwind CSS styling.

### 16.1 Overview

**Location**: `packages/propel/src/`

Based on:
- **cmdk**: Command palette primitives
- **Radix UI**: Accessible primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Icon system

### 16.2 Core Components

| Component | Description |
|-----------|-------------|
| `Button` | Primary/secondary variants, loading states |
| `Command` | cmdk-based command palette |
| `Dialog` | Modal dialogs with Radix |
| `Combobox` | Searchable select dropdown |
| `Accordion` | Collapsible content sections |
| `Avatar` | User/entity avatars |
| `Banner` | Alert/info banners |
| `Card` | Content containers |
| `Calendar` | Date picker with react-day-picker |
| `ContextMenu` | Right-click menus |
| `Tooltip` | Hover tooltips |

### 16.3 Button Component Pattern

**Source**: `packages/propel/src/button/button.tsx`

```typescript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TButtonVariant;  // "primary" | "secondary" | "outline" | "ghost"
  size?: TButtonSizes;       // "sm" | "md" | "lg"
  loading?: boolean;
  disabled?: boolean;
  appendIcon?: any;
  prependIcon?: any;
  children: React.ReactNode;
}

const Button = React.forwardRef(function Button(props, ref) {
  const { variant = "primary", size = "md", loading = false, ...rest } = props;
  const buttonStyle = getButtonStyling(variant, size, disabled || loading);

  return (
    <button ref={ref} className={cn(buttonStyle, className)} disabled={disabled || loading}>
      {prependIcon && <div className={buttonIconStyle}>{prependIcon}</div>}
      {children}
      {appendIcon && <div className={buttonIconStyle}>{appendIcon}</div>}
    </button>
  );
});
```

### 16.4 Command Component Pattern

**Source**: `packages/propel/src/command/command.tsx`

```typescript
import { Command as CommandPrimitive } from "cmdk";

const Command = Object.assign(CommandComponent, {
  Input: CommandInput,
  List: CommandList,
  Empty: CommandEmpty,
  Item: CommandItem,
});
```

### 16.5 Custom Icons

Location: `packages/propel/src/icons/`

Project-specific icons:
- Layout icons (Board, List, Calendar, Timeline)
- Status icons (InProgress, Done, Pending)
- AI icon
- Intake icon

### 16.6 BM-PM Application

- **Component reuse**: Consistent UI patterns
- **Theming system**: Custom color tokens
- **Accessibility**: Radix primitives for a11y
- **Command palette**: Agent action discovery

---

## Related Documents

- [BM-PM Architecture](../architecture.md) - Module architecture specification
- [Taskosaur Analysis](/docs/research/taskosaur-analysis.md) - Complementary pattern research
- [Research Prompts](/docs/research/RESEARCH-PROMPTS.md) - Research methodology
