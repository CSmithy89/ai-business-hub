# Story PM-11.4: API Documentation Portal

**Epic:** PM-11 External API for PM Module
**Story ID:** PM-11.4
**Status:** ✅ DONE
**Priority:** High
**Points:** 3

---

## User Story

**As an** API consumer
**I want** comprehensive documentation
**So that** I can integrate effectively with the HYVVE PM API

---

## Acceptance Criteria

### AC1: OpenAPI/Swagger Integration ✅
- [x] Swagger UI available at `/api/docs`
- [x] OpenAPI 3.0 specification
- [x] All PM API endpoints documented
- [x] API key authentication scheme documented
- [x] Comprehensive descriptions and metadata
- [x] Multiple server configurations (local, production)
- [x] Contact and license information

### AC2: API Reference Documentation ✅
- [x] Request/response schemas with examples
- [x] All DTOs have `@ApiProperty` decorators with:
  - Field descriptions
  - Example values
  - Enum values where applicable
  - Validation constraints (min, max, required, etc.)
  - Nullable indicators
- [x] Authentication requirements documented
- [x] Error response documentation with status codes
- [x] Scopes documented for each endpoint
- [x] Pagination parameters documented
- [x] Rate limit information

### AC3: Developer Portal Page ✅
- [x] Developer portal at `/developers`
- [x] Getting started guide
- [x] Authentication documentation
- [x] API scopes explanation
- [x] Rate limits documentation
- [x] Code examples for common operations
- [x] Error handling guide
- [x] Webhooks documentation
- [x] Links to Swagger UI and OpenAPI spec download

---

## Implementation Details

### 1. Swagger Configuration Enhancement

**File:** `apps/api/src/main.ts`

Enhanced OpenAPI configuration with:
- Comprehensive description including:
  - Authentication guide
  - API scopes documentation
  - Rate limits
  - Pagination guide
  - Error response format
- Contact information
- License details
- Server configurations (local + production)
- Enhanced tag descriptions
- API key security scheme

### 2. DTO Documentation

Added comprehensive `@ApiProperty` decorators to all PM API DTOs:

**Task DTOs:**
- `CreateTaskDto` - 15 properties documented with examples
- `UpdateTaskDto` - 15 properties documented
- Examples include realistic task data

**Project DTOs:**
- `CreateProjectDto` - 10 properties documented with examples
- `UpdateProjectDto` - 9 properties documented
- Correct enum values (PROJECT_TYPE uses SOFTWARE, WEBSITE, etc.)

**Phase DTOs:**
- `CreatePhaseDto` - 3 properties documented
- `UpdatePhaseDto` - 4 properties documented

**API-specific DTOs:**
- `AssignTaskDto` - Already documented
- `TransitionTaskDto` - Already documented
- `ListTasksQueryDto` - Already documented with pagination

### 3. Controller Enhancements

Enhanced controller endpoints with detailed documentation:

**Tasks Controller:**
- `POST /api/v1/pm/tasks` - Full response example with realistic data
- Detailed error responses for each status code
- Extended operation descriptions

**Projects Controller:**
- `POST /api/v1/pm/projects` - Complete response example
- Status code documentation with helpful descriptions

All other controllers already had good documentation.

### 4. Developer Portal

**File:** `apps/web/src/app/(public)/developers/page.tsx`

Created comprehensive developer portal with:

**Sections:**
1. **Quick Start** - 3-step getting started guide
   - Get API key
   - Make first request (with curl example)
   - Create a task (with curl example)

2. **Authentication** - API key format and best practices

3. **API Scopes** - Visual cards for each scope with operations

4. **Rate Limits** - Clear documentation with header information

5. **Common Use Cases** - JavaScript/TypeScript examples:
   - List all projects
   - Filter tasks by status
   - Update task status

6. **Error Handling** - Error format and status codes

7. **Webhooks** - Event types and configuration guide

8. **Support** - Links to Swagger UI and support contact

**Components:**
- `CodeBlock` - Syntax-highlighted code examples
- `ScopeCard` - Scope documentation cards
- `ExampleCard` - API usage examples

**Updated:** Added link to developer portal in public layout footer

---

## Technical Changes

### Files Created
1. `/apps/web/src/app/(public)/developers/page.tsx` - Developer portal page

### Files Modified
1. `/apps/api/src/main.ts` - Enhanced Swagger configuration
2. `/apps/api/src/pm/tasks/dto/create-task.dto.ts` - Added @ApiProperty decorators
3. `/apps/api/src/pm/tasks/dto/update-task.dto.ts` - Added @ApiProperty decorators
4. `/apps/api/src/pm/projects/dto/create-project.dto.ts` - Added @ApiProperty decorators
5. `/apps/api/src/pm/projects/dto/update-project.dto.ts` - Added @ApiProperty decorators
6. `/apps/api/src/pm/phases/dto/create-phase.dto.ts` - Added @ApiProperty decorators
7. `/apps/api/src/pm/phases/dto/update-phase.dto.ts` - Added @ApiProperty decorators
8. `/apps/api/src/pm/api/tasks-api.controller.ts` - Enhanced endpoint documentation
9. `/apps/api/src/pm/api/projects-api.controller.ts` - Enhanced endpoint documentation
10. `/apps/web/src/app/(public)/layout.tsx` - Added API Docs link in footer

---

## Testing

### Manual Testing Checklist ✅
- [x] TypeScript compilation passes (both API and web)
- [x] ESLint passes with no new errors
- [x] Swagger UI accessible at `http://localhost:3001/api/docs`
- [x] OpenAPI spec downloadable at `http://localhost:3001/api/docs/spec.json`
- [x] Developer portal accessible at `http://localhost:3000/developers`
- [x] All DTO properties show in Swagger UI with descriptions and examples
- [x] Example values are realistic and helpful
- [x] Authentication scheme documented
- [x] All endpoints show proper scopes

### Verification Steps

1. **Start API server:**
   ```bash
   cd apps/api
   pnpm dev
   ```

2. **Visit Swagger UI:**
   - Navigate to `http://localhost:3001/api/docs`
   - Verify comprehensive description in header
   - Check all endpoints are listed under correct tags
   - Click on POST endpoints to see example request bodies
   - Verify response schemas have examples

3. **Download OpenAPI Spec:**
   - Visit `http://localhost:3001/api/docs/spec.json`
   - Verify JSON format is valid
   - Check all endpoints are included

4. **Visit Developer Portal:**
   - Navigate to `http://localhost:3000/developers`
   - Verify all sections render correctly
   - Check code examples are readable
   - Test links to Swagger UI work

---

## API Scopes Documented

| Scope | Description | Operations |
|-------|-------------|------------|
| `PM_READ` | Read access to projects, tasks, phases, and views | List projects, Get task details, Search tasks |
| `PM_WRITE` | Create and update projects, tasks, and phases | Create tasks, Update projects, Assign tasks |
| `PM_ADMIN` | Full access including deletion | Delete projects, Delete tasks, Full management |
| `WEBHOOK_READ` | View webhook configurations | List webhooks, Get webhook details |
| `WEBHOOK_WRITE` | Create and manage webhooks | Create webhooks, Update webhooks, View deliveries |

---

## Developer Portal Features

### Quick Start Guide
- Step-by-step guide to first API call
- Curl examples for authentication
- JavaScript/TypeScript examples

### Authentication Documentation
- API key format explanation
- Security best practices
- Environment variable recommendations

### Code Examples
- List all projects (with pagination)
- Filter tasks by status
- Update task status
- All examples use realistic data

### Error Documentation
- Standard error format
- HTTP status code meanings
- Common error scenarios

### Webhooks Guide
- Available event types
- Configuration instructions
- Payload format

---

## Example API Documentation

### Create Task Endpoint

**Endpoint:** `POST /api/v1/pm/tasks`
**Scope Required:** `PM_WRITE`

**Request Body Example:**
```json
{
  "projectId": "cm4abc123xyz",
  "phaseId": "cm4def456uvw",
  "title": "Implement user authentication",
  "description": "Add OAuth2 authentication with Google and GitHub providers",
  "type": "STORY",
  "priority": "HIGH",
  "assignmentType": "HUMAN",
  "assigneeId": "cm4user789rst",
  "storyPoints": 5,
  "dueDate": "2025-01-15T18:00:00Z"
}
```

**Response Example (201 Created):**
```json
{
  "id": "cm4task123xyz",
  "projectId": "cm4abc123xyz",
  "phaseId": "cm4def456uvw",
  "title": "Implement user authentication",
  "description": "Add OAuth2 authentication with Google and GitHub providers",
  "type": "STORY",
  "priority": "HIGH",
  "status": "TODO",
  "assignmentType": "HUMAN",
  "assigneeId": "cm4user789rst",
  "storyPoints": 5,
  "createdAt": "2025-01-10T12:00:00Z",
  "updatedAt": "2025-01-10T12:00:00Z"
}
```

---

## Security Considerations

- API keys must be stored securely (environment variables)
- Never commit API keys to version control
- Use minimum required scopes for integrations
- Regular key rotation recommended
- All sensitive operations require appropriate scopes

---

## Future Enhancements

Potential improvements for future stories:

1. **Interactive API Playground** - Try API calls directly from docs
2. **SDK Generation** - Auto-generate client SDKs from OpenAPI spec
3. **Postman Collection** - Export Postman collection for testing
4. **GraphQL Endpoint** - Alternative GraphQL API
5. **Webhook Testing** - Test webhook delivery from UI
6. **API Analytics** - Usage metrics and monitoring dashboard
7. **Versioning** - API version management (v2, v3, etc.)

---

## Related Stories

- **PM-11.1:** Public API Infrastructure ✅
- **PM-11.2:** API Key Management ✅
- **PM-11.3:** Webhook Configuration ✅
- **PM-11.5:** Rate Limiting & Throttling (Future)

---

## Notes

- Used existing `@nestjs/swagger` package (already in dependencies)
- Followed NestJS Swagger best practices
- All examples use realistic CUID2 format IDs
- Developer portal uses Next.js 15 app router patterns
- Responsive design for mobile/tablet/desktop
- Accessible components with semantic HTML

---

## Definition of Done ✅

- [x] Code implements all acceptance criteria
- [x] TypeScript compilation succeeds
- [x] ESLint passes with no new errors/warnings
- [x] Swagger UI accessible and functional
- [x] All endpoints fully documented
- [x] Developer portal page created and accessible
- [x] Code examples are accurate and helpful
- [x] Documentation is comprehensive and clear
- [x] Story file created with full implementation details
