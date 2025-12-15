# Twenty CRM Analysis

**Analyzed:** 2024-11-29
**Version/Commit:** twenty-main (local)
**Analysts:** Winston (Architect), Mary (Analyst), Amelia (Developer)

---

## Executive Summary

Twenty CRM is an open-source CRM built with a **metadata-driven architecture** that allows dynamic schema creation per workspace. This analysis extracts patterns applicable to our BM-CRM and BMS modules.

### Key Architectural Patterns

| Pattern | Implementation | Relevance |
|---------|---------------|-----------|
| **Metadata-Driven ORM** | `ObjectMetadataEntity` + `FieldMetadataEntity` | Custom objects/fields for CRM extensibility |
| **Schema-per-Tenant** | `databaseSchema` per workspace | Enterprise multi-tenancy isolation |
| **Polymorphic Timeline** | `linkedRecordId` + `linkedObjectMetadataId` | Unified activity feed across entities |
| **Dynamic GraphQL** | Schema generated from metadata | Code-first API without manual resolvers |
| **View System** | TABLE / KANBAN / CALENDAR views | Deal pipelines and custom views |

---

## 1. Core Data Model

### 1.1 Entity Definitions

#### PersonWorkspaceEntity (Contact)

**Source**: `packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts`

```typescript
@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.person,
  namePlural: 'people',
  labelSingular: msg`Person`,
  labelPlural: msg`People`,
  description: msg`A person`,
  icon: STANDARD_OBJECT_ICONS.person,
  shortcut: 'P',
})
@WorkspaceDuplicateCriteria([
  ['nameFirstName', 'nameLastName'],
  ['linkedinLinkPrimaryLinkUrl'],
  ['emailsPrimaryEmail'],
])
@WorkspaceIsSearchable()
export class PersonWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: PERSON_STANDARD_FIELD_IDS.name,
    type: FieldMetadataType.FULL_NAME,
    label: msg`Name`,
    description: msg`Contact's name`,
    icon: 'IconUser',
  })
  @WorkspaceIsNullable()
  name: FullNameMetadata | null;

  @WorkspaceField({
    standardId: PERSON_STANDARD_FIELD_IDS.emails,
    type: FieldMetadataType.EMAILS,
    label: msg`Emails`,
    settings: { maxNumberOfValues: 1 },
  })
  @WorkspaceIsUnique()
  @WorkspaceIsNullable()
  emails: EmailsMetadata;

  @WorkspaceField({
    standardId: PERSON_STANDARD_FIELD_IDS.phones,
    type: FieldMetadataType.PHONES,
    label: msg`Phones`,
    settings: { maxNumberOfValues: 1 },
  })
  phones: PhonesMetadata;

  @WorkspaceField({
    type: FieldMetadataType.TEXT,
    label: msg`Job Title`,
  })
  jobTitle: string;

  @WorkspaceField({
    type: FieldMetadataType.TEXT,
    label: msg`City`,
  })
  city: string;

  // Relations
  @WorkspaceRelation({
    type: RelationType.MANY_TO_ONE,
    label: msg`Company`,
    inverseSideTarget: () => CompanyWorkspaceEntity,
    inverseSideFieldKey: 'people',
    onDelete: RelationOnDeleteAction.SET_NULL,
  })
  company: Relation<CompanyWorkspaceEntity> | null;

  @WorkspaceJoinColumn('company')
  companyId: string | null;

  @WorkspaceRelation({
    type: RelationType.ONE_TO_MANY,
    label: msg`Opportunities`,
    inverseSideTarget: () => OpportunityWorkspaceEntity,
    inverseSideFieldKey: 'pointOfContact',
  })
  pointOfContactForOpportunities: Relation<OpportunityWorkspaceEntity[]>;

  @WorkspaceRelation({
    type: RelationType.ONE_TO_MANY,
    label: msg`Timeline Activities`,
    inverseSideTarget: () => TimelineActivityWorkspaceEntity,
  })
  timelineActivities: Relation<TimelineActivityWorkspaceEntity[]>;
}
```

#### CompanyWorkspaceEntity

**Source**: `packages/twenty-server/src/modules/company/standard-objects/company.workspace-entity.ts`

```typescript
@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.company,
  namePlural: 'companies',
  labelSingular: msg`Company`,
  labelPlural: msg`Companies`,
  shortcut: 'C',
})
@WorkspaceDuplicateCriteria([['name'], ['domainNamePrimaryLinkUrl']])
export class CompanyWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    type: FieldMetadataType.TEXT,
    label: msg`Name`,
  })
  name: string;

  @WorkspaceField({
    type: FieldMetadataType.LINKS,
    label: msg`Domain Name`,
    settings: { maxNumberOfValues: 1 },
  })
  @WorkspaceIsUnique()
  domainName: LinksMetadata;

  @WorkspaceField({
    type: FieldMetadataType.NUMBER,
    label: msg`Employees`,
  })
  employees: number | null;

  @WorkspaceField({
    type: FieldMetadataType.CURRENCY,
    label: msg`ARR`,
    description: msg`Annual Recurring Revenue`,
  })
  annualRecurringRevenue: CurrencyMetadata | null;

  @WorkspaceField({
    type: FieldMetadataType.ADDRESS,
    label: msg`Address`,
  })
  address: AddressMetadata;

  @WorkspaceField({
    type: FieldMetadataType.BOOLEAN,
    label: msg`ICP`,
    description: msg`Ideal Customer Profile`,
    defaultValue: false,
  })
  idealCustomerProfile: boolean;

  // Relations
  @WorkspaceRelation({
    type: RelationType.ONE_TO_MANY,
    label: msg`People`,
    inverseSideTarget: () => PersonWorkspaceEntity,
  })
  people: Relation<PersonWorkspaceEntity[]>;

  @WorkspaceRelation({
    type: RelationType.MANY_TO_ONE,
    label: msg`Account Owner`,
    inverseSideTarget: () => WorkspaceMemberWorkspaceEntity,
  })
  accountOwner: Relation<WorkspaceMemberWorkspaceEntity> | null;

  @WorkspaceRelation({
    type: RelationType.ONE_TO_MANY,
    label: msg`Opportunities`,
    inverseSideTarget: () => OpportunityWorkspaceEntity,
  })
  opportunities: Relation<OpportunityWorkspaceEntity[]>;
}
```

#### OpportunityWorkspaceEntity (Deal)

**Source**: `packages/twenty-server/src/modules/opportunity/standard-objects/opportunity.workspace-entity.ts`

```typescript
@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.opportunity,
  namePlural: 'opportunities',
  labelSingular: msg`Opportunity`,
  labelPlural: msg`Opportunities`,
  shortcut: 'O',
})
export class OpportunityWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    type: FieldMetadataType.TEXT,
    label: msg`Name`,
  })
  name: string;

  @WorkspaceField({
    type: FieldMetadataType.CURRENCY,
    label: msg`Amount`,
  })
  amount: CurrencyMetadata | null;

  @WorkspaceField({
    type: FieldMetadataType.DATE_TIME,
    label: msg`Close date`,
  })
  closeDate: Date | null;

  @WorkspaceField({
    type: FieldMetadataType.SELECT,
    label: msg`Stage`,
    options: [
      { value: 'NEW', label: 'New', position: 0, color: 'red' },
      { value: 'SCREENING', label: 'Screening', position: 1, color: 'purple' },
      { value: 'MEETING', label: 'Meeting', position: 2, color: 'sky' },
      { value: 'PROPOSAL', label: 'Proposal', position: 3, color: 'turquoise' },
      { value: 'CUSTOMER', label: 'Customer', position: 4, color: 'yellow' },
    ],
    defaultValue: "'NEW'",
  })
  @WorkspaceFieldIndex()
  stage: string;

  @WorkspaceField({
    type: FieldMetadataType.POSITION,
    label: msg`Position`,
    defaultValue: 0,
  })
  @WorkspaceIsSystem()
  position: number;

  // Relations
  @WorkspaceRelation({
    type: RelationType.MANY_TO_ONE,
    label: msg`Point of Contact`,
    inverseSideTarget: () => PersonWorkspaceEntity,
  })
  pointOfContact: Relation<PersonWorkspaceEntity> | null;

  @WorkspaceRelation({
    type: RelationType.MANY_TO_ONE,
    label: msg`Company`,
    inverseSideTarget: () => CompanyWorkspaceEntity,
  })
  company: Relation<CompanyWorkspaceEntity> | null;
}
```

### 1.2 Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Company     │       │     Person      │       │  Opportunity    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ name            │◄──────│ companyId       │       │ name            │
│ domainName      │ 1:N   │ name            │◄──────│ pointOfContactId│
│ employees       │       │ emails          │ 1:N   │ companyId ──────┼──┐
│ ARR             │       │ phones          │       │ amount          │  │
│ address         │       │ jobTitle        │       │ closeDate       │  │
│ ICP             │       │ city            │       │ stage           │  │
│ accountOwnerId  │       │                 │       │ position        │  │
└────────┬────────┘       └─────────────────┘       └─────────────────┘  │
         │                                                    │          │
         └────────────────────────────────────────────────────┘          │
                                 N:1                          ◄──────────┘
```

### 1.3 Mapping to AI Business Hub

| Twenty Entity | BM-CRM Entity | Notes |
|---------------|---------------|-------|
| Person | Contact | Add `leadScore`, `source`, `lifecycle` fields |
| Company | Account | Add `industry`, `segment`, `healthScore` |
| Opportunity | Deal | Add `probability`, `forecastCategory` |
| - | Lead | New entity for pre-qualified contacts |
| - | Activity | Derived from TimelineActivity |

---

## 2. Custom Fields Architecture

### 2.1 Approach: Metadata-Driven Schema

Twenty uses a **two-layer architecture**:
1. **Metadata Layer** - Stores schema definitions (ObjectMetadata, FieldMetadata)
2. **Data Layer** - Dynamically generated tables per workspace

This is NOT JSON columns or EAV - it's **real database columns** created dynamically.

### 2.2 ObjectMetadataEntity

**Source**: `packages/twenty-server/src/engine/metadata-modules/object-metadata/object-metadata.entity.ts`

```typescript
@Entity('objectMetadata')
@Unique('IDX_OBJECT_METADATA_NAME_SINGULAR_WORKSPACE_ID_UNIQUE', ['nameSingular', 'workspaceId'])
export class ObjectMetadataEntity extends SyncableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, type: 'uuid' })
  standardId: string | null;  // For standard objects

  @Column({ nullable: false })
  nameSingular: string;

  @Column({ nullable: false })
  namePlural: string;

  @Column({ nullable: false })
  labelSingular: string;

  @Column({ nullable: false })
  labelPlural: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ nullable: true, type: 'varchar' })
  icon: string | null;

  @Column({ default: false })
  isCustom: boolean;  // User-created vs standard

  @Column({ default: false })
  isRemote: boolean;  // External data source

  @Column({ default: false })
  isSystem: boolean;  // System-managed

  @Column({ default: true })
  isAuditLogged: boolean;

  @Column({ default: false })
  isSearchable: boolean;

  @Column({ nullable: true, type: 'varchar' })
  shortcut: string | null;  // Keyboard shortcut

  @Column({ nullable: false, type: 'uuid' })
  workspaceId: string;  // Tenant isolation

  @OneToMany(() => FieldMetadataEntity, (field) => field.object, { cascade: true })
  fields: Relation<FieldMetadataEntity[]>;

  @OneToMany(() => ViewEntity, (view) => view.objectMetadata, { cascade: true })
  views: Relation<ViewEntity[]>;
}
```

### 2.3 FieldMetadataEntity

**Source**: `packages/twenty-server/src/engine/metadata-modules/field-metadata/field-metadata.entity.ts`

```typescript
@Entity('fieldMetadata')
@Unique('IDX_FIELD_METADATA_NAME_OBJECT_METADATA_ID_WORKSPACE_ID_UNIQUE', [
  'name', 'objectMetadataId', 'workspaceId'
])
export class FieldMetadataEntity<T extends FieldMetadataType = FieldMetadataType> {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, type: 'uuid' })
  standardId: string | null;  // For standard fields

  @Column({ nullable: false, type: 'uuid' })
  objectMetadataId: string;

  @Column({ nullable: false, type: 'varchar' })
  type: T;  // FieldMetadataType enum

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  label: string;

  @Column({ nullable: true, type: 'jsonb' })
  defaultValue: FieldMetadataDefaultValue<T>;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ nullable: true, type: 'varchar' })
  icon: string | null;

  @Column('jsonb', { nullable: true })
  options: FieldMetadataOptions<T>;  // For SELECT, MULTI_SELECT

  @Column('jsonb', { nullable: true })
  settings: FieldMetadataSettings<T>;  // Field-specific settings

  @Column({ default: false })
  isCustom: boolean;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: false })
  isSystem: boolean;

  @Column({ nullable: true, default: true, type: 'boolean' })
  isNullable: boolean | null;

  @Column({ nullable: true, default: false, type: 'boolean' })
  isUnique: boolean | null;

  @Column({ nullable: false, type: 'uuid' })
  workspaceId: string;

  // For relation fields
  @Column({ nullable: true, type: 'uuid' })
  relationTargetFieldMetadataId: string;

  @Column({ nullable: true, type: 'uuid' })
  relationTargetObjectMetadataId: string;
}
```

### 2.4 Field Types

```typescript
export enum FieldMetadataType {
  // Simple types
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DATE_TIME = 'DATE_TIME',
  UUID = 'UUID',

  // Composite types (stored as JSONB)
  FULL_NAME = 'FULL_NAME',      // { firstName, lastName }
  EMAILS = 'EMAILS',            // { primaryEmail, additionalEmails[] }
  PHONES = 'PHONES',            // { primaryPhone, additionalPhones[] }
  LINKS = 'LINKS',              // { primaryLinkUrl, primaryLinkLabel }
  ADDRESS = 'ADDRESS',          // { street, city, country, ... }
  CURRENCY = 'CURRENCY',        // { amount, currencyCode }
  ACTOR = 'ACTOR',              // { source, workspaceMemberId }

  // Selection types
  SELECT = 'SELECT',            // Single select with options
  MULTI_SELECT = 'MULTI_SELECT',

  // Special types
  POSITION = 'POSITION',        // For ordering
  RAW_JSON = 'RAW_JSON',        // Arbitrary JSON
  TS_VECTOR = 'TS_VECTOR',      // Full-text search

  // Relation types
  RELATION = 'RELATION',
  MORPH_RELATION = 'MORPH_RELATION',
}
```

### 2.5 Adoption Notes

**Strengths:**
- Real database columns = native SQL queries, indexes, constraints
- Type-safe field definitions with decorators
- Built-in support for composite types (Address, Currency, etc.)
- Full-text search via TS_VECTOR

**For BM-CRM:**
- Adopt metadata-driven approach for custom fields
- Use JSONB for composite types (simpler than multiple columns)
- Consider Prisma schema generation from metadata

---

## 3. Activity/Timeline System

### 3.1 TimelineActivityWorkspaceEntity

**Source**: `packages/twenty-server/src/modules/timeline/standard-objects/timeline-activity.workspace-entity.ts`

```typescript
@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.timelineActivity,
  namePlural: 'timelineActivities',
  labelSingular: msg`Timeline Activity`,
})
@WorkspaceIsSystem()
@WorkspaceIsNotAuditLogged()
export class TimelineActivityWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    type: FieldMetadataType.DATE_TIME,
    label: msg`Creation date`,
    defaultValue: 'now',
  })
  happensAt: Date;

  @WorkspaceField({
    type: FieldMetadataType.TEXT,
    label: msg`Event name`,
  })
  name: string;

  @WorkspaceField({
    type: FieldMetadataType.RAW_JSON,
    label: msg`Event details`,
  })
  properties: JSON | null;

  // Polymorphic linking
  @WorkspaceField({
    type: FieldMetadataType.TEXT,
    label: msg`Linked Record cached name`,
  })
  linkedRecordCachedName: string;

  @WorkspaceField({
    type: FieldMetadataType.UUID,
    label: msg`Linked Record id`,
  })
  linkedRecordId: string | null;

  @WorkspaceField({
    type: FieldMetadataType.UUID,
    label: msg`Linked Object Metadata Id`,
  })
  linkedObjectMetadataId: string | null;

  // Direct relations to standard objects
  @WorkspaceRelation({
    type: RelationType.MANY_TO_ONE,
    inverseSideTarget: () => WorkspaceMemberWorkspaceEntity,
  })
  workspaceMember: Relation<WorkspaceMemberWorkspaceEntity> | null;

  @WorkspaceRelation({
    type: RelationType.MANY_TO_ONE,
    inverseSideTarget: () => PersonWorkspaceEntity,
  })
  person: Relation<PersonWorkspaceEntity> | null;

  @WorkspaceRelation({
    type: RelationType.MANY_TO_ONE,
    inverseSideTarget: () => CompanyWorkspaceEntity,
  })
  company: Relation<CompanyWorkspaceEntity> | null;

  @WorkspaceRelation({
    type: RelationType.MANY_TO_ONE,
    inverseSideTarget: () => OpportunityWorkspaceEntity,
  })
  opportunity: Relation<OpportunityWorkspaceEntity> | null;

  // Dynamic relation for custom objects
  @WorkspaceDynamicRelation({
    type: RelationType.MANY_TO_ONE,
    argsFactory: (oppositeObjectMetadata) => ({
      name: oppositeObjectMetadata.nameSingular,
      label: oppositeObjectMetadata.labelSingular,
      joinColumn: `${oppositeObjectMetadata.nameSingular}Id`,
    }),
    inverseSideTarget: () => CustomWorkspaceEntity,
  })
  custom: Relation<CustomWorkspaceEntity>;
}
```

### 3.2 Key Pattern: Polymorphic Relations

The timeline uses **two linking strategies**:

1. **Direct Foreign Keys** - For standard objects (Person, Company, Opportunity)
2. **Generic Polymorphic** - For custom objects via `linkedRecordId` + `linkedObjectMetadataId`

This allows a single timeline table to reference any entity type.

### 3.3 BM-CRM Application

```typescript
// Proposed Activity entity for BM-CRM
model Activity {
  id            String   @id @default(uuid())
  type          String   // 'email', 'call', 'meeting', 'note', 'task'
  subject       String
  body          String?
  happenedAt    DateTime @default(now())

  // Actor
  performedById String
  performedBy   WorkspaceMember @relation(fields: [performedById], references: [id])

  // Polymorphic target
  targetType    String   // 'Contact', 'Account', 'Deal', 'Lead'
  targetId      String

  // Cached for display
  targetName    String

  // Metadata
  properties    Json?

  // Direct relations for fast queries
  contactId     String?
  contact       Contact? @relation(fields: [contactId], references: [id])
  accountId     String?
  account       Account? @relation(fields: [accountId], references: [id])
  dealId        String?
  deal          Deal?    @relation(fields: [dealId], references: [id])
}
```

---

## 4. GraphQL API Patterns

### 4.1 Architecture Overview

Twenty uses **dynamic GraphQL schema generation** from metadata:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ObjectMetadataEntity                          │
│                    FieldMetadataEntity                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              WorkspaceGraphqlSchemaFactory                       │
│              - Generates types from ObjectMetadata               │
│              - Creates resolvers dynamically                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GraphQL Schema                               │
│                     - Query: findMany, findOne                   │
│                     - Mutation: createOne, updateOne, deleteOne  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Resolver Factory Pattern

**Source**: `packages/twenty-server/src/engine/api/graphql/workspace-resolver-builder/factories/find-many-resolver.factory.ts`

```typescript
@Injectable()
export class FindManyResolverFactory implements WorkspaceResolverBuilderFactoryInterface {
  public static methodName = RESOLVER_METHOD_NAMES.FIND_MANY;

  constructor(
    private readonly commonFindManyQueryRunnerService: CommonFindManyQueryRunnerService,
  ) {}

  create(context: WorkspaceSchemaBuilderContext): Resolver<FindManyResolverArgs> {
    return async (_source, args, _context, info) => {
      const selectedFields = graphqlFields(info);

      const { records, totalCount, pageInfo } =
        await this.commonFindManyQueryRunnerService.execute(
          { ...args, selectedFields },
          context,
        );

      return typeORMObjectRecordsParser.createConnection({
        objectRecords: records,
        take: args.first ?? args.last ?? QUERY_MAX_RECORDS,
        totalCount,
        hasNextPage: pageInfo.hasNextPage,
        hasPreviousPage: pageInfo.hasPreviousPage,
      });
    };
  }
}
```

### 4.3 Standard Resolvers

| Method | Description |
|--------|-------------|
| `findMany` | Paginated list with filtering, sorting |
| `findOne` | Single record by ID |
| `createOne` | Create single record |
| `createMany` | Batch create |
| `updateOne` | Update single record |
| `updateMany` | Batch update |
| `deleteOne` | Soft delete |
| `deleteMany` | Batch soft delete |
| `destroyOne` | Hard delete |
| `destroyMany` | Batch hard delete |
| `restoreOne` | Restore soft-deleted |
| `restoreMany` | Batch restore |
| `findDuplicates` | Duplicate detection |
| `groupBy` | Aggregation by field |

### 4.4 Pagination Pattern

Uses Relay-style cursor pagination:

```graphql
type PersonConnection {
  edges: [PersonEdge!]!
  pageInfo: PageInfo!
  totalCount: Int
}

type PersonEdge {
  cursor: String!
  node: Person!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### 4.5 BM-CRM Application

For BM-CRM, we can use a simpler approach with Prisma:
- **pothos-graphql** for type-safe schema building
- Standard CRUD resolvers generated from Prisma models
- Custom resolvers for complex operations

---

## 5. Workspace/Tenant Isolation

### 5.1 WorkspaceEntity

**Source**: `packages/twenty-server/src/engine/core-modules/workspace/workspace.entity.ts`

```typescript
@Entity({ name: 'workspace', schema: 'core' })
export class WorkspaceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({ unique: true })
  subdomain: string;  // workspace.twenty.com

  @Column({ type: 'varchar', unique: true, nullable: true })
  customDomain: string | null;

  @Column({ default: '' })
  databaseUrl: string;

  @Column({ default: '' })
  databaseSchema: string;  // Schema-per-tenant!

  @Column({
    type: 'enum',
    enum: WorkspaceActivationStatus,
    default: WorkspaceActivationStatus.INACTIVE,
  })
  activationStatus: WorkspaceActivationStatus;

  @Column({ default: 1 })
  metadataVersion: number;  // Schema versioning

  // AI Configuration
  @Column({ type: 'varchar', nullable: false, default: DEFAULT_FAST_MODEL })
  fastModel: ModelId;

  @Column({ type: 'varchar', nullable: false, default: DEFAULT_SMART_MODEL })
  smartModel: ModelId;

  // Auth settings
  @Column({ default: true })
  isGoogleAuthEnabled: boolean;

  @Column({ default: true })
  isPasswordAuthEnabled: boolean;

  @Column({ default: true })
  isMicrosoftAuthEnabled: boolean;

  @Column({ default: false })
  isCustomDomainEnabled: boolean;

  // Relations
  @OneToMany(() => UserWorkspaceEntity, (uw) => uw.workspace)
  workspaceUsers: Relation<UserWorkspaceEntity[]>;

  @OneToMany(() => FeatureFlagEntity, (ff) => ff.workspace)
  featureFlags: Relation<FeatureFlagEntity[]>;

  @OneToMany(() => ViewEntity, (v) => v.workspace)
  views: Relation<ViewEntity[]>;
}
```

### 5.2 Multi-Tenancy Pattern

Twenty uses **Schema-per-Tenant**:

```
┌─────────────────────────────────────────────────────────────────┐
│                        PostgreSQL                                │
├─────────────────────────────────────────────────────────────────┤
│  core schema (shared)                                           │
│  ├── workspace                                                  │
│  ├── user                                                       │
│  ├── userWorkspace                                              │
│  ├── objectMetadata                                             │
│  └── fieldMetadata                                              │
├─────────────────────────────────────────────────────────────────┤
│  workspace_abc123 schema                                        │
│  ├── person                                                     │
│  ├── company                                                    │
│  ├── opportunity                                                │
│  └── [custom objects]                                           │
├─────────────────────────────────────────────────────────────────┤
│  workspace_def456 schema                                        │
│  ├── person                                                     │
│  ├── company                                                    │
│  └── ...                                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Isolation Guarantees

1. **Data Isolation** - Each workspace has its own schema
2. **Query Scoping** - All queries automatically scoped to workspace schema
3. **Metadata Isolation** - ObjectMetadata/FieldMetadata filtered by workspaceId
4. **Feature Flags** - Per-workspace feature toggles

### 5.4 BM-CRM Application

For BM-CRM, consider **Row-Level Security** (simpler for start):

```sql
-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy for workspace isolation
CREATE POLICY workspace_isolation ON contacts
  USING (workspace_id = current_setting('app.workspace_id')::uuid);
```

---

## 6. Pipeline/Kanban Views

### 6.1 ViewEntity

**Source**: `packages/twenty-server/src/engine/metadata-modules/view/entities/view.entity.ts`

```typescript
@Entity({ name: 'view', schema: 'core' })
export class ViewEntity extends SyncableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'text', default: '' })
  name: string;

  @Column({ nullable: false, type: 'uuid' })
  objectMetadataId: string;

  @Column({
    type: 'enum',
    enum: Object.values(ViewType),
    default: ViewType.TABLE,
  })
  type: ViewType;  // TABLE | KANBAN | CALENDAR

  @Column({ nullable: false, type: 'text' })
  icon: string;

  @Column({ nullable: false, type: 'double precision', default: 0 })
  position: number;

  @Column({ nullable: false, default: false, type: 'boolean' })
  isCompact: boolean;

  // Kanban-specific
  @Column({
    type: 'enum',
    enum: Object.values(AggregateOperations),
    nullable: true,
  })
  kanbanAggregateOperation: AggregateOperations | null;

  @Column({ nullable: true, type: 'uuid' })
  kanbanAggregateOperationFieldMetadataId: string | null;

  // Calendar-specific
  @Column({
    type: 'enum',
    enum: Object.values(ViewCalendarLayout),
    nullable: true,
  })
  calendarLayout: ViewCalendarLayout | null;

  @Column({ nullable: true, type: 'uuid' })
  calendarFieldMetadataId: string | null;

  // Visibility
  @Column({
    type: 'enum',
    enum: Object.values(ViewVisibility),
    default: ViewVisibility.WORKSPACE,
  })
  visibility: ViewVisibility;  // WORKSPACE | PRIVATE

  @Column({ nullable: false, type: 'uuid' })
  workspaceId: string;

  // Relations
  @OneToMany(() => ViewFieldEntity, (vf) => vf.view)
  viewFields: Relation<ViewFieldEntity[]>;

  @OneToMany(() => ViewFilterEntity, (vf) => vf.view)
  viewFilters: Relation<ViewFilterEntity[]>;

  @OneToMany(() => ViewSortEntity, (vs) => vs.view)
  viewSorts: Relation<ViewSortEntity[]>;

  @OneToMany(() => ViewGroupEntity, (vg) => vg.view)
  viewGroups: Relation<ViewGroupEntity[]>;
}
```

### 6.2 View Types

```typescript
export enum ViewType {
  TABLE = 'TABLE',
  KANBAN = 'KANBAN',
  CALENDAR = 'CALENDAR',
}
```

### 6.3 Frontend Kanban Implementation

**Source**: `packages/twenty-front/src/modules/object-record/record-board/components/RecordBoardDragDropContext.tsx`

```typescript
import { DragDropContext, type OnDragEndResponder } from '@hello-pangea/dnd';

export const RecordBoardDragDropContext = ({ children }) => {
  const { processBoardCardDrop } = useProcessBoardCardDrop();
  const { startRecordDrag } = useStartRecordDrag();
  const { endRecordDrag } = useEndRecordDrag();

  const handleDragStart = useRecoilCallback(({ snapshot }) => (start) => {
    const currentSelectedRecordIds = getSnapshotValue(
      snapshot,
      recordBoardSelectedRecordIdsSelector,
    );
    startRecordDrag(start, currentSelectedRecordIds);
  });

  const handleDragEnd: OnDragEndResponder = useRecoilCallback(
    ({ snapshot }) => (result) => {
      endRecordDrag();
      if (!result.destination) return;

      const currentRecordSorts = getSnapshotValue(snapshot, currentRecordSortCallbackState);
      if (currentRecordSorts.length > 0) {
        openModal(RECORD_INDEX_REMOVE_SORTING_MODAL_ID);
        return;
      }

      processBoardCardDrop(result, originalSelection);
    }
  );

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {children}
    </DragDropContext>
  );
};
```

### 6.4 Stage Implementation

Stages are defined via **SELECT field options** on the Opportunity entity:

```typescript
@WorkspaceField({
  type: FieldMetadataType.SELECT,
  label: msg`Stage`,
  options: [
    { value: 'NEW', label: 'New', position: 0, color: 'red' },
    { value: 'SCREENING', label: 'Screening', position: 1, color: 'purple' },
    { value: 'MEETING', label: 'Meeting', position: 2, color: 'sky' },
    { value: 'PROPOSAL', label: 'Proposal', position: 3, color: 'turquoise' },
    { value: 'CUSTOMER', label: 'Customer', position: 4, color: 'yellow' },
  ],
  defaultValue: "'NEW'",
})
stage: string;
```

### 6.5 BM-CRM Application

For deal pipeline in BM-CRM:

```typescript
// Pipeline stages as SELECT options
const DEAL_STAGES = [
  { value: 'LEAD', label: 'Lead', position: 0, color: 'gray' },
  { value: 'QUALIFIED', label: 'Qualified', position: 1, color: 'blue' },
  { value: 'PROPOSAL', label: 'Proposal', position: 2, color: 'purple' },
  { value: 'NEGOTIATION', label: 'Negotiation', position: 3, color: 'orange' },
  { value: 'CLOSED_WON', label: 'Closed Won', position: 4, color: 'green' },
  { value: 'CLOSED_LOST', label: 'Closed Lost', position: 5, color: 'red' },
];

// Use @hello-pangea/dnd for board
// Use position field for ordering within columns
```

---

## 7. Key Schema Decisions for AI Business Hub

### 7.1 Most Important Findings

1. **Metadata-Driven ORM** - Enables custom objects/fields without migrations
2. **Schema-per-Tenant** - Strong isolation for enterprise customers
3. **Polymorphic Timeline** - Single activity feed for all entity types
4. **SELECT Field Options** - Pipeline stages as field configuration
5. **Position Field** - Float-based ordering for drag-and-drop

### 7.2 Recommended Approach

For BM-CRM initial implementation, use a **pragmatic hybrid**:

| Aspect | Approach |
|--------|----------|
| **Custom Fields** | JSON column for now, migrate to metadata later |
| **Multi-Tenancy** | Row-Level Security with `workspaceId` |
| **Activity Timeline** | Polymorphic with `targetType` + `targetId` |
| **Pipelines** | SELECT field with stage options |
| **Views** | ViewType enum with filter/sort configs |

---

## 8. Recommended Prisma Schema for BM-CRM

```prisma
// Core CRM Entities

model Contact {
  id            String   @id @default(uuid())
  workspaceId   String

  // Core fields
  firstName     String
  lastName      String
  email         String?
  phone         String?
  jobTitle      String?

  // Composite fields (JSON)
  emails        Json?    // { primary: string, additional: string[] }
  phones        Json?    // { primary: string, additional: string[] }
  address       Json?    // { street, city, state, country, zip }
  socialLinks   Json?    // { linkedin, twitter, ... }

  // CRM-specific
  leadScore     Int?
  lifecycle     String   @default("lead") // lead, mql, sql, customer, churned
  source        String?  // web, referral, campaign, etc.

  // Custom fields
  customFields  Json?

  // Relations
  accountId     String?
  account       Account? @relation(fields: [accountId], references: [id])
  ownerId       String?
  owner         WorkspaceMember? @relation(fields: [ownerId], references: [id])

  deals         Deal[]
  activities    Activity[]

  // System
  position      Float    @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  @@index([workspaceId])
  @@index([email])
  @@index([accountId])
}

model Account {
  id            String   @id @default(uuid())
  workspaceId   String

  // Core fields
  name          String
  domain        String?
  industry      String?
  employeeCount Int?

  // Composite fields
  address       Json?
  socialLinks   Json?

  // CRM-specific
  segment       String?  // enterprise, mid-market, smb
  healthScore   Int?
  arr           Decimal?

  // Custom fields
  customFields  Json?

  // Relations
  ownerId       String?
  owner         WorkspaceMember? @relation(fields: [ownerId], references: [id])

  contacts      Contact[]
  deals         Deal[]
  activities    Activity[]

  // System
  position      Float    @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  @@index([workspaceId])
  @@index([domain])
}

model Deal {
  id            String   @id @default(uuid())
  workspaceId   String

  // Core fields
  name          String
  amount        Decimal?
  currency      String   @default("USD")
  closeDate     DateTime?

  // Pipeline
  stage         String   @default("LEAD")
  probability   Int?

  // Custom fields
  customFields  Json?

  // Relations
  accountId     String?
  account       Account? @relation(fields: [accountId], references: [id])
  contactId     String?
  contact       Contact? @relation(fields: [contactId], references: [id])
  ownerId       String?
  owner         WorkspaceMember? @relation(fields: [ownerId], references: [id])

  activities    Activity[]

  // System
  position      Float    @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  @@index([workspaceId])
  @@index([stage])
  @@index([accountId])
}

model Activity {
  id            String   @id @default(uuid())
  workspaceId   String

  // Activity details
  type          String   // email, call, meeting, note, task
  subject       String
  body          String?
  happenedAt    DateTime @default(now())

  // Polymorphic target
  targetType    String   // Contact, Account, Deal
  targetId      String
  targetName    String   // Cached for display

  // Actor
  performedById String
  performedBy   WorkspaceMember @relation(fields: [performedById], references: [id])

  // Direct relations for fast queries
  contactId     String?
  contact       Contact? @relation(fields: [contactId], references: [id])
  accountId     String?
  account       Account? @relation(fields: [accountId], references: [id])
  dealId        String?
  deal          Deal?    @relation(fields: [dealId], references: [id])

  // Metadata
  properties    Json?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([workspaceId])
  @@index([targetType, targetId])
  @@index([contactId])
  @@index([accountId])
  @@index([dealId])
}

// Views System

model View {
  id                String   @id @default(uuid())
  workspaceId       String

  name              String
  objectType        String   // Contact, Account, Deal
  viewType          String   @default("TABLE") // TABLE, KANBAN, CALENDAR
  icon              String?
  position          Float    @default(0)

  // Configuration
  filters           Json?    // Array of filter conditions
  sorts             Json?    // Array of sort conditions
  columns           Json?    // Visible columns and order

  // Kanban-specific
  groupByField      String?  // Field to group by (e.g., "stage")

  // Visibility
  visibility        String   @default("WORKSPACE") // WORKSPACE, PRIVATE
  createdById       String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([workspaceId, objectType])
}
```

---

## 9. Webhook/Integration System

### 9.1 WebhookEntity

**Source**: `packages/twenty-server/src/engine/core-modules/webhook/webhook.entity.ts`

```typescript
@Entity({ name: 'webhook', schema: 'core' })
export class WebhookEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  targetUrl: string;  // Where to POST events

  @Column('text', { array: true, default: ['*.*'] })
  operations: string[];  // e.g., ['person.created', 'opportunity.*']

  @Column({ nullable: true })
  description?: string;

  @Column()
  secret: string;  // For HMAC signing

  @Column({ nullable: false, type: 'uuid' })
  workspaceId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

### 9.2 Webhook Operations Pattern

Operations follow the pattern `{objectName}.{action}`:
- `person.created` - When a person is created
- `opportunity.*` - All opportunity events
- `*.*` - Subscribe to all events

### 9.3 BM-CRM Application

```typescript
// Webhook entity for BM-CRM
model Webhook {
  id            String   @id @default(uuid())
  workspaceId   String
  targetUrl     String
  operations    String[] @default(["*.*"])
  secret        String   // For HMAC-SHA256 signing
  description   String?
  isActive      Boolean  @default(true)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([workspaceId])
}
```

---

## 10. Event Bus / WorkspaceEventEmitter

### 10.1 WorkspaceEventEmitter

**Source**: `packages/twenty-server/src/engine/workspace-event-emitter/workspace-event-emitter.ts`

```typescript
@Injectable()
export class WorkspaceEventEmitter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  // Database record events (batched)
  public emitDatabaseBatchEvent<T, A extends keyof ActionEventMap<T>>(
    databaseBatchEventInput: DatabaseBatchEventInput<T, A> | undefined,
  ) {
    const eventName = computeEventName(objectMetadataNameSingular, action);

    const workspaceEventBatch: WorkspaceEventBatch<ActionEventMap<T>[A]> = {
      name: eventName,
      workspaceId,
      objectMetadata,
      events,
    };

    this.eventEmitter.emit(eventName, workspaceEventBatch);
  }

  // Custom events (e.g., billing, notifications)
  public emitCustomBatchEvent<T extends object>(
    eventName: CustomEventName,
    events: T[],
    workspaceId: string | undefined,
  ) {
    const customWorkspaceEventBatch: CustomWorkspaceEventBatch<T> = {
      name: eventName,
      workspaceId,
      events,
    };

    this.eventEmitter.emit(eventName, customWorkspaceEventBatch);
  }
}
```

### 10.2 Event Actions

```typescript
type ActionEventMap<T> = {
  [DatabaseEventAction.CREATED]: ObjectRecordCreateEvent<T>;
  [DatabaseEventAction.UPDATED]: ObjectRecordUpdateEvent<T>;
  [DatabaseEventAction.DELETED]: ObjectRecordDeleteEvent<T>;
  [DatabaseEventAction.DESTROYED]: ObjectRecordDestroyEvent<T>;
  [DatabaseEventAction.RESTORED]: ObjectRecordRestoreEvent<T>;
  [DatabaseEventAction.UPSERTED]: ObjectRecordUpsertEvent<T>;
};
```

### 10.3 BM-CRM Application

```typescript
// Event types for BM-CRM
type CRMEventAction =
  | 'created' | 'updated' | 'deleted' | 'restored'
  | 'stage_changed' | 'score_changed' | 'owner_changed';

interface CRMEvent<T> {
  action: CRMEventAction;
  workspaceId: string;
  objectType: string;  // Contact, Account, Deal
  record: T;
  changes?: Record<string, { before: any; after: any }>;
  performedBy: { type: 'user' | 'agent'; id: string };
  timestamp: Date;
}
```

---

## 11. Message Queue (BullMQ) Architecture

### 11.1 MessageQueueService

**Source**: `packages/twenty-server/src/engine/core-modules/message-queue/services/message-queue.service.ts`

```typescript
@Injectable()
export class MessageQueueService {
  constructor(
    @Inject(QUEUE_DRIVER) protected driver: MessageQueueDriver,
    protected queueName: MessageQueue,
  ) {}

  // Add job to queue
  add<T extends MessageQueueJobData>(
    jobName: string,
    data: T,
    options?: QueueJobOptions,
  ): Promise<void> {
    return this.driver.add(this.queueName, jobName, data, options);
  }

  // Add cron job
  addCron<T extends MessageQueueJobData>({
    jobName,
    data,
    options,
    jobId,
  }: {
    jobName: string;
    data: T;
    options: QueueCronJobOptions;
    jobId?: string;
  }): Promise<void> {
    return this.driver.addCron({ queueName: this.queueName, jobName, data, options, jobId });
  }

  // Remove cron job
  removeCron({ jobName, jobId }: { jobName: string; jobId?: string }): Promise<void> {
    return this.driver.removeCron({ queueName: this.queueName, jobName, jobId });
  }

  // Register worker
  work<T extends MessageQueueJobData>(
    handler: (job: MessageQueueJob<T>) => Promise<void> | void,
    options?: MessageQueueWorkerOptions,
  ) {
    return this.driver.work(this.queueName, handler, options);
  }
}
```

### 11.2 Queue Types

```typescript
export enum MessageQueue {
  taskAssignedQueue = 'task-assigned-queue',
  messagingQueue = 'messaging-queue',
  calendarQueue = 'calendar-queue',
  webhookQueue = 'webhook-queue',
  workflowQueue = 'workflow-queue',
  emailQueue = 'email-queue',
}
```

### 11.3 BM-CRM Application

Use similar queue architecture for:
- **Agent task queue** - AI agent work items
- **Email queue** - Email sending/tracking
- **Webhook queue** - External webhook delivery
- **Sync queue** - External data synchronization

---

## 12. AI Agent System

### 12.1 AgentEntity

**Source**: `packages/twenty-server/src/engine/metadata-modules/ai/ai-agent/entities/agent.entity.ts`

```typescript
@Entity('agent')
export class AgentEntity extends SyncableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, type: 'uuid' })
  standardId: string | null;  // For system agents

  @Column({ nullable: false })
  name: string;  // Internal name

  @Column({ nullable: false })
  label: string;  // Display name

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: false, type: 'text' })
  prompt: string;  // System prompt

  @Column({ nullable: false, type: 'varchar', default: DEFAULT_SMART_MODEL })
  modelId: ModelId;  // AI model to use

  @Column({ nullable: true, type: 'jsonb', default: { type: 'text' } })
  responseFormat: AgentResponseFormat;

  @Column({ nullable: false, type: 'uuid' })
  workspaceId: string;

  @Column({ default: false })
  isCustom: boolean;  // User-created vs standard

  @Column({ nullable: true, type: 'jsonb' })
  modelConfiguration: ModelConfiguration;

  @Column({ type: 'text', array: true, default: '{}' })
  evaluationInputs: string[];  // For testing/evaluation
}
```

### 12.2 Agent Service

**Source**: `packages/twenty-server/src/engine/metadata-modules/ai/ai-agent/agent.service.ts`

Key operations:
- `findManyAgents(workspaceId)` - List all agents for workspace
- `findOneAgent(workspaceId, { id?, name? })` - Get single agent
- `createOneAgent(input, workspaceId)` - Create new agent
- `updateOneAgent(input, workspaceId)` - Update agent
- `deleteOneAgent(id, workspaceId)` - Soft delete agent
- Agent role management via `AiAgentRoleService`

### 12.3 Key AI Modules

```
ai/
├── ai-agent/           # Agent definitions
├── ai-agent-role/      # Role-based permissions for agents
├── ai-chat-router/     # Chat message routing
├── ai-models/          # Model configuration
├── ai-tools/           # Agent tools/functions
├── ai-billing/         # Usage metering
├── ai-agent-monitor/   # Monitoring/observability
├── ai-agent-execution/ # Execution engine
└── ai-chat/            # Chat interface
```

### 12.4 BM-CRM Application

```typescript
// Agent entity for BM-CRM
model Agent {
  id              String   @id @default(uuid())
  workspaceId     String

  name            String   // Internal name (unique per workspace)
  label           String   // Display name
  description     String?
  icon            String?

  // AI Configuration
  systemPrompt    String   @db.Text
  modelId         String   @default("claude-3-5-sonnet")
  modelConfig     Json?    // Temperature, max_tokens, etc.
  responseFormat  String   @default("text") // text, json, markdown

  // Permissions
  roleId          String?  // Links to role-based permissions

  // Capabilities
  tools           String[] // Enabled tools/functions

  // Metadata
  isSystem        Boolean  @default(false)
  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([workspaceId, name])
  @@index([workspaceId])
}
```

---

## 13. Workflow Automation System

### 13.1 WorkflowWorkspaceEntity

**Source**: `packages/twenty-server/src/modules/workflow/common/standard-objects/workflow.workspace-entity.ts`

```typescript
export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DEACTIVATED = 'DEACTIVATED',
}

@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.workflow,
  namePlural: 'workflows',
  labelSingular: msg`Workflow`,
})
export class WorkflowWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({ type: FieldMetadataType.TEXT, label: msg`Name` })
  name: string | null;

  @WorkspaceField({ type: FieldMetadataType.TEXT })
  lastPublishedVersionId: string | null;

  @WorkspaceField({
    type: FieldMetadataType.MULTI_SELECT,
    options: WorkflowStatusOptions,
  })
  statuses: WorkflowStatus[] | null;

  @WorkspaceField({ type: FieldMetadataType.POSITION, defaultValue: 0 })
  position: number;

  // Relations
  @WorkspaceRelation({ type: RelationType.ONE_TO_MANY, inverseSideTarget: () => WorkflowVersionWorkspaceEntity })
  versions: Relation<WorkflowVersionWorkspaceEntity[]>;

  @WorkspaceRelation({ type: RelationType.ONE_TO_MANY, inverseSideTarget: () => WorkflowRunWorkspaceEntity })
  runs: Relation<WorkflowRunWorkspaceEntity[]>;

  @WorkspaceRelation({ type: RelationType.ONE_TO_MANY, inverseSideTarget: () => WorkflowAutomatedTriggerWorkspaceEntity })
  automatedTriggers: Relation<WorkflowAutomatedTriggerWorkspaceEntity[]>;

  @WorkspaceField({ type: FieldMetadataType.ACTOR })
  createdBy: ActorMetadata;
}
```

### 13.2 WorkflowExecutorWorkspaceService

**Source**: `packages/twenty-server/src/modules/workflow/workflow-executor/workspace-services/workflow-executor.workspace-service.ts`

Key features:
- **Step-based execution** - Workflows execute steps sequentially/in parallel
- **Step status tracking** - PENDING, RUNNING, SUCCESS, FAILED, SKIPPED, STOPPED
- **Billing integration** - Metered usage per workflow node execution
- **Queue-based** - Long workflows use message queue for resilience
- **Iterator support** - Loop over collections

```typescript
@Injectable()
export class WorkflowExecutorWorkspaceService {
  async executeFromSteps({
    stepIds,
    workflowRunId,
    workspaceId,
    shouldComputeWorkflowRunStatus = true,
    executedStepsCount = 0,
  }: WorkflowExecutorInput) {
    // Execute steps in parallel
    await Promise.all(
      stepIds.map(async (stepIdToExecute) => {
        await this.executeFromStep({ stepId: stepIdToExecute, workflowRunId, workspaceId, executedStepsCount });
      }),
    );

    if (shouldComputeWorkflowRunStatus) {
      await this.computeWorkflowRunStatus({ workflowRunId, workspaceId });
    }
  }

  private async executeStep({ step, steps, stepInfos, workflowRunId, workspaceId }) {
    // Get action handler from factory
    const workflowAction = this.workflowActionFactory.get(step.type);

    // Update step status to RUNNING
    await this.workflowRunWorkspaceService.updateWorkflowRunStepInfo({
      stepId: step.id,
      stepInfo: { status: StepStatus.RUNNING },
      workflowRunId,
      workspaceId,
    });

    // Execute the action
    return await workflowAction.execute({
      currentStepId: step.id,
      steps,
      context: getWorkflowRunContext(stepInfos),
      runInfo: { workflowRunId, workspaceId },
    });
  }
}
```

### 13.3 BM-CRM Application

```typescript
// Workflow models for BM-CRM
model Workflow {
  id                String   @id @default(uuid())
  workspaceId       String

  name              String
  description       String?
  status            String   @default("DRAFT") // DRAFT, ACTIVE, DEACTIVATED

  // Trigger
  triggerType       String   // manual, scheduled, event
  triggerConfig     Json?    // Cron pattern, event filters, etc.

  // Versioning
  currentVersionId  String?

  createdById       String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  versions          WorkflowVersion[]
  runs              WorkflowRun[]

  @@index([workspaceId])
  @@index([status])
}

model WorkflowVersion {
  id          String   @id @default(uuid())
  workflowId  String
  workflow    Workflow @relation(fields: [workflowId], references: [id])

  version     Int
  status      String   @default("DRAFT")

  // Step graph as JSON
  steps       Json     // Array of WorkflowStep
  edges       Json     // Array of step connections

  publishedAt DateTime?
  createdAt   DateTime @default(now())
}

model WorkflowRun {
  id                String   @id @default(uuid())
  workflowId        String
  workflow          Workflow @relation(fields: [workflowId], references: [id])
  workflowVersionId String

  status            String   // PENDING, RUNNING, COMPLETED, FAILED, STOPPED

  // Execution state
  stepInfos         Json     // Status and results per step
  error             String?

  startedAt         DateTime @default(now())
  completedAt       DateTime?

  @@index([workflowId])
  @@index([status])
}
```

---

## 14. Token/Authentication System

### 14.1 Token Architecture

**Source**: `packages/twenty-server/src/engine/core-modules/auth/token/token.module.ts`

```typescript
@Module({
  providers: [
    RenewTokenService,       // Refresh token renewal
    JwtAuthStrategy,         // JWT validation strategy
    AccessTokenService,      // Access token generation/validation
    LoginTokenService,       // Initial login tokens
    RefreshTokenService,     // Refresh token management
    WorkspaceAgnosticTokenService,  // Cross-workspace tokens
  ],
})
export class TokenModule {}
```

### 14.2 AccessTokenService

**Source**: `packages/twenty-server/src/engine/core-modules/auth/token/services/access-token.service.ts`

```typescript
@Injectable()
export class AccessTokenService {
  async generateAccessToken({
    userId,
    workspaceId,
    authProvider,
    isImpersonating,
    impersonatorUserWorkspaceId,
    impersonatedUserWorkspaceId,
  }): Promise<AuthToken> {
    const expiresIn = this.twentyConfigService.get('ACCESS_TOKEN_EXPIRES_IN');
    const expiresAt = addMilliseconds(new Date().getTime(), ms(expiresIn));

    const jwtPayload: AccessTokenJwtPayload = {
      sub: user.id,
      userId: user.id,
      workspaceId,
      workspaceMemberId: tokenWorkspaceMemberId,
      userWorkspaceId: userWorkspace.id,
      type: JwtTokenTypeEnum.ACCESS,
      authProvider,
      isImpersonating: isImpersonating === true,
      impersonatorUserWorkspaceId,
      impersonatedUserWorkspaceId,
    };

    return {
      token: this.jwtWrapperService.sign(jwtPayload, {
        secret: this.jwtWrapperService.generateAppSecret(JwtTokenTypeEnum.ACCESS, workspaceId),
        expiresIn,
      }),
      expiresAt,
    };
  }

  async validateToken(token: string): Promise<AuthContext> {
    await this.jwtWrapperService.verifyJwtToken(token, JwtTokenTypeEnum.ACCESS);
    const decoded = this.jwtWrapperService.decode<AccessTokenJwtPayload>(token);
    return await this.jwtStrategy.validate(decoded);
  }
}
```

### 14.3 JWT Payload Structure

```typescript
interface AccessTokenJwtPayload {
  sub: string;                    // User ID
  userId: string;
  workspaceId: string;
  workspaceMemberId?: string;
  userWorkspaceId: string;
  type: JwtTokenTypeEnum.ACCESS;
  authProvider: string;           // 'google', 'microsoft', 'password'
  isImpersonating: boolean;
  impersonatorUserWorkspaceId?: string;
  impersonatedUserWorkspaceId?: string;
}
```

### 14.4 BM-CRM Application

```typescript
// Token payload for BM-CRM sessions
interface BMCRMTokenPayload {
  sub: string;           // User ID
  workspaceId: string;
  workspaceMemberId: string;
  type: 'access' | 'refresh' | 'agent';

  // For agent sessions
  agentId?: string;
  agentSessionId?: string;

  // For impersonation
  isImpersonating?: boolean;
  impersonatorId?: string;
}

// Session model for long-running agent conversations
model AgentSession {
  id              String   @id @default(uuid())
  workspaceId     String
  userId          String
  agentId         String

  status          String   @default("active") // active, paused, completed

  // Context
  context         Json     // Conversation context
  workspacePath   String?  // Isolated workspace path

  // Messages
  messages        Json[]   // Conversation history

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  expiresAt       DateTime?

  @@index([workspaceId, userId])
  @@index([agentId])
}
```

---

## 15. Summary: Patterns for AI Business Hub

### 15.1 Architecture Patterns to Adopt

| Pattern | Twenty Implementation | BM-CRM Adoption |
|---------|----------------------|-----------------|
| **Event Bus** | EventEmitter2 + batched events | Redis pub/sub or BullMQ events |
| **Webhooks** | Operations pattern (`object.action`) | Same pattern with HMAC signing |
| **Message Queue** | BullMQ with driver abstraction | BullMQ for agent tasks, emails |
| **AI Agents** | Per-workspace agents with roles | Same with BYOAI model routing |
| **Workflows** | Step-based with version control | Simplified for CRM automations |
| **Auth/Sessions** | JWT with workspace scope | Add agent session support |

### 15.2 Key Integration Points

1. **Contact Created** → Score lead → Add to campaign → Notify owner
2. **Deal Stage Changed** → Update forecast → Trigger workflow → Send webhook
3. **Activity Logged** → Update timeline → Recalculate engagement score

### 15.3 Recommended Tech Stack

```yaml
Backend:
  Framework: Next.js API Routes + tRPC
  Database: PostgreSQL with Prisma
  Cache: Redis
  Queue: BullMQ
  Events: Redis pub/sub

AI:
  SDK: Agno Framework (Claude/OpenAI/etc.)
  Sessions: PostgreSQL + Redis
  Tools: Function calling with validation

Auth:
  Provider: NextAuth.js
  Tokens: JWT with workspace scope
  Sessions: Redis-backed
```

---

## Related Documents

- [BM-CRM Module Specification](../README.md)
- [docs/archive/foundation-phase/MODULE-RESEARCH.md](/docs/archive/foundation-phase/MODULE-RESEARCH.md) - Shared data architecture requirements
- [Plane Analysis](/docs/modules/bm-pm/research/plane-analysis.md) - Complementary research
