# Contributing to HYVVE

Thank you for your interest in contributing to HYVVE! This document provides guidelines and workflows for contributing to the project.

---

## Development Methodology

This project uses the **BMAD Method** (Business Model Agile Development). All contributions should follow the established patterns and workflows.

### Story-Based Development

1. Check current sprint status in `docs/sprint-artifacts/sprint-status.yaml`
2. Pick a story from the current epic
3. Run story context to gather requirements
4. Implement following architecture patterns
5. Submit PR with tests

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker & Docker Compose
- pnpm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/CSmithy89/ai-business-hub.git
cd ai-business-hub

# Use correct Node.js version
nvm use

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

---

## Development Workflow

### Branch Naming

- Feature branches: `feature/description`
- Epic branches: `epic/NN-short-description`
- Bug fixes: `fix/description`
- Documentation: `docs/description`

### Commit Messages

Follow this format:

```text
Type: short description

Longer explanation if needed.

Changes:
- Bullet points for details
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### Pre-commit Hooks

The following checks run automatically before each commit:

1. TypeScript type check (`pnpm type-check`)
2. ESLint on staged files
3. Semgrep security scan (if installed)

If a check fails, fix the issues before committing.

---

## Code Standards

### TypeScript

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Zod for runtime validation
- Follow existing patterns in codebase

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Utilities | kebab-case | `date-utils.ts` |
| Types | *.types.ts | `user.types.ts` |
| Tests | *.test.ts | `user.test.ts` |

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

---

## Multi-Tenant Architecture

All data models must include tenant isolation:

```typescript
model Example {
  id        String   @id @default(cuid())
  tenantId  String   // Required for RLS
  // ... other fields

  @@index([tenantId])
}
```

---

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @hyvve/web test

# Run tests in watch mode
pnpm test:watch
```

### Test Requirements

- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for UI components

---

## Pull Request Process

### Before Submitting

- [ ] TypeScript check passes (`pnpm type-check`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Tests pass (if applicable)
- [ ] Documentation updated (if applicable)

### PR Format

```markdown
## Summary
Brief description of changes

## Changes
- List of specific changes

## Test Plan
How to test these changes

## Screenshots
If UI changes, include before/after screenshots
```

### Review Process

1. AI code review runs automatically
2. Human review required for significant changes
3. Address all review comments
4. Squash merge to main when approved

---

## Architecture Guidelines

### Adding New Features

1. Review existing architecture in `docs/architecture.md`
2. Follow established patterns
3. Maintain multi-tenant isolation
4. Use event bus for cross-module communication

### API Endpoints

- Follow REST conventions
- Include proper error handling
- Add validation with Zod
- Document with OpenAPI annotations

### Database Changes

- Create Prisma migrations
- Include `tenantId` for tenant-scoped models
- Add appropriate indexes
- Test RLS policies

---

## Getting Help

- Review documentation in `docs/` folder
- Check existing issues for similar questions
- Open a new issue with detailed description

---

## Code of Conduct

Be respectful and constructive in all interactions. Focus on the code and ideas, not the person.

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
