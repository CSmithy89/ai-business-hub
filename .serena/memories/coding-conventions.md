# HYVVE Platform - Coding Conventions

## TypeScript/JavaScript

### General
- TypeScript strict mode enabled
- Use functional components with hooks (React)
- Use Zod for runtime validation
- Prefer `const` over `let`

### File Naming
- Components: `PascalCase.tsx` (e.g., `ApprovalCard.tsx`)
- Utilities: `kebab-case.ts` (e.g., `api-client.ts`)
- Types: `*.types.ts` or inline
- Tests: `*.test.ts` or `*.spec.ts`

### Import Order
```typescript
// 1. External packages
import { useState } from 'react';
import { z } from 'zod';

// 2. Internal packages (@/)
import { Button } from '@/components/ui/button';

// 3. Relative imports
import { localUtil } from './utils';
```

### Component Structure
```typescript
// 1. Types/interfaces
interface Props { ... }

// 2. Component
export function MyComponent({ prop }: Props) {
  // 3. Hooks
  const [state, setState] = useState();

  // 4. Handlers
  const handleClick = () => { ... };

  // 5. Render
  return ( ... );
}
```

## NestJS Backend

### Module Structure
- One feature per module
- Controller → Service → Repository pattern
- DTOs with class-validator decorators
- Use `@Injectable()` for services

### Naming
- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- DTOs: `dto/*.dto.ts`
- Guards: `*.guard.ts`

### Logging
```typescript
private readonly logger = new Logger(MyService.name);
this.logger.log({ message: 'Action', data });
```

## Prisma/Database

### Model Conventions
- Use `@map("snake_case")` for column names
- Always include `workspaceId` for tenant models
- Add `@@index([workspaceId])` for performance
- Use UUIDs (`@id @default(uuid())`)

### Timestamps
```prisma
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @updatedAt @map("updated_at")
```

## Python (AgentOS)

### Style
- Follow PEP 8
- Use type hints
- Use Pydantic for data models
- Async/await with FastAPI

### Naming
- Files: `snake_case.py`
- Classes: `PascalCase`
- Functions: `snake_case`
- Constants: `UPPER_SNAKE_CASE`

## Git Commits

### Format
```
type(scope): description

Body explaining what and why

Story: XX-YY
Epic: EPIC-XX
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `docs` - Documentation
- `test` - Tests
- `chore` - Maintenance
