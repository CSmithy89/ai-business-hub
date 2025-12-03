# HYVVE Platform Style Guide

This document defines coding standards and conventions for the HYVVE platform. Gemini Code Assist should use these guidelines when reviewing pull requests.

## Project Overview

HYVVE is an AI-powered business orchestration platform designed for 90% automation with ~5 hours/week human involvement for SMB businesses.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 + React + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | NestJS + TypeScript |
| Agent System | Python + FastAPI + Agno |
| Database | PostgreSQL + Prisma ORM |
| Cache/Queue | Redis + BullMQ |
| Real-time | Socket.io |

## TypeScript Standards

### Strict Mode
- All TypeScript files must pass strict mode compilation
- No implicit `any` types - always specify explicit types
- Use `unknown` instead of `any` when type is truly unknown

### Type Definitions
- Export interfaces and types from dedicated `*.types.ts` files
- Use interfaces for object shapes, types for unions/intersections
- Prefer readonly properties where mutation is not needed

```typescript
// Good
export interface User {
  readonly id: string;
  name: string;
  email: string;
}

// Avoid
export type User = {
  id: any;
  name: string;
}
```

### Null Handling
- Use nullish coalescing (`??`) over logical OR (`||`) for defaults
- Use optional chaining (`?.`) for safe property access
- Prefer `undefined` over `null` for optional values

## React/Next.js Standards

### Components
- Use functional components with hooks exclusively
- Export named components, not default exports
- Keep components focused - single responsibility principle

```typescript
// Good
export function UserProfile({ user }: UserProfileProps) {
  return <div>{user.name}</div>;
}

// Avoid
export default function({ user }) {
  return <div>{user.name}</div>;
}
```

### Hooks
- Custom hooks must start with `use` prefix
- Extract complex logic into custom hooks
- Follow rules of hooks strictly

### State Management
- Use React Query for server state
- Use React Context for global UI state
- Avoid prop drilling beyond 2 levels

## NestJS Backend Standards

### Module Structure
- One feature per module
- Services handle business logic, controllers handle HTTP
- Use DTOs with class-validator for input validation

```typescript
// Good - DTO with validation
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;
}
```

### Dependency Injection
- Use constructor injection
- Mark dependencies as `private readonly`
- Use interfaces for loose coupling

### Error Handling
- Use NestJS built-in exception filters
- Throw specific HTTP exceptions (BadRequestException, NotFoundException)
- Never expose internal error details to clients

## Multi-Tenant Architecture

**CRITICAL**: All data must be tenant-isolated.

```typescript
// Every query must filter by tenantId
const users = await this.prisma.user.findMany({
  where: { tenantId: currentTenant.id }
});

// Use RLS at database level
// Every model needs tenantId field and index
model Example {
  id        String @id @default(cuid())
  tenantId  String
  @@index([tenantId])
}
```

## Security Standards

### Input Validation
- Validate ALL user input server-side
- Use Zod or class-validator, never manual validation
- Sanitize output to prevent XSS

### Authentication
- Use JWT with short expiration
- Implement refresh token rotation
- Hash passwords with bcrypt (cost factor >= 12)

### Authorization
- Check permissions at service layer
- Use guards for route-level protection
- Implement RBAC with workspace-scoped roles

## Code Quality

### Naming Conventions
- **Files**: kebab-case (`user-service.ts`)
- **Components**: PascalCase (`UserProfile.tsx`)
- **Functions/Variables**: camelCase (`getUserById`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Types/Interfaces**: PascalCase (`UserProfile`)

### Import Order
1. External packages (react, nestjs, etc.)
2. Internal packages (@hyvve/shared, @/components)
3. Relative imports (./utils)

### Comments
- Write self-documenting code - minimize comments
- Use JSDoc for public APIs
- TODO comments must include ticket reference

### Testing
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Minimum 80% coverage on new code

## Pull Request Guidelines

### PR Size
- Keep PRs under 400 lines changed
- One feature/fix per PR
- Split large changes into logical commits

### Commit Messages
- Use conventional commits format
- First line: imperative mood, max 72 chars
- Body: explain WHY, not just WHAT

```
feat(auth): add password reset flow

Implements secure password reset with email verification.
Tokens expire after 1 hour and are single-use.

Closes #123
```

### Review Focus Areas
1. **Security**: Auth, input validation, data exposure
2. **Performance**: N+1 queries, unnecessary re-renders
3. **Maintainability**: Code clarity, proper abstractions
4. **Testing**: Coverage, edge cases
5. **Type Safety**: No any, proper error handling
