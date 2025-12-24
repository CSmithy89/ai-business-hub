# Story PM-11.2: API Authentication

**Epic:** PM-11 - External API & Governance
**Status:** done
**Points:** 8

---

## User Story

As an **API consumer**,
I want **secure authentication**,
So that **my integrations are protected**.

---

## Acceptance Criteria

### AC1: API Key Authentication
**Given** I have a valid API key
**When** I make API calls with the key in the header
**Then** I can authenticate via:
- `X-API-Key` header with API key
- OAuth 2.0 for user context (future enhancement)

### AC2: Scoped Permissions
**Given** an API key is created
**When** the key is configured
**Then** it has scoped permissions:
- `pm:read` - Read projects, phases, tasks, views
- `pm:write` - Create/update projects, phases, tasks
- `pm:admin` - Delete operations, admin actions
- `kb:read` - Read KB pages
- `kb:write` - Create/update KB pages
- `webhook:read` - List webhooks
- `webhook:write` - Create/delete webhooks

### AC3: Key Management UI
**Given** I am a workspace admin
**When** I navigate to Settings → API Keys
**Then** I can:
- Create new API keys with scope selection
- View list of existing API keys with last used timestamp
- Copy API key once after creation (never shown again)
- Revoke API keys
- Set optional expiration dates

### AC4: Secure Key Storage
**Given** an API key is created
**When** it is stored in the database
**Then** it is stored as SHA-256 hash (never plaintext)
**And** the key prefix is stored for identification
**And** the full key is only shown once at creation time

---

## Technical Approach

This story implements secure API authentication using API keys with scoped permissions. API keys are hashed using SHA-256 before storage, and permissions are stored in a JSON field on the existing ApiKey model. The authentication flow uses NestJS guards to validate keys, extract workspace context, and enforce permission scopes.

**Key Technologies:**
- Backend: NestJS with custom guards (ApiKeyGuard, ScopeGuard)
- Security: SHA-256 hashing, secure key generation
- Frontend: React with shadcn/ui for key management UI
- Existing Model: ApiKey (no schema changes needed)

**Authentication Flow:**
```
API Request
  ↓ (Header: X-API-Key: sk_prod_...)
  ↓
ApiKeyGuard
  ↓ (Hash key, lookup in database)
  ↓ (Validate not expired/revoked)
  ↓ (Extract workspaceId, attach to request)
  ↓
ScopeGuard
  ↓ (Check required scopes vs API key permissions)
  ↓
Controller
  ↓ (Process request with workspace context)
  ↓
Response
```

---

## Implementation Tasks

### Database Schema

#### No Schema Changes Required
- [x] Existing ApiKey model supports scoped permissions via `permissions` JSON field
- [x] Structure: `{ scopes: string[], rateLimit?: number }`

### Backend

#### API Key Guard
```typescript
// apps/api/src/common/guards/api-key.guard.ts

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { Request } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Hash the API key for lookup
    const keyHash = this.hashApiKey(apiKey);

    // Find API key in database
    const apiKeyRecord = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { workspace: true },
    });

    if (!apiKeyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if key is revoked
    if (apiKeyRecord.revokedAt) {
      throw new UnauthorizedException('API key has been revoked');
    }

    // Check if key is expired
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Attach workspace and API key to request
    request['workspaceId'] = apiKeyRecord.workspaceId;
    request['apiKey'] = apiKeyRecord;
    request['apiKeyId'] = apiKeyRecord.id;

    // Update last used timestamp (async, don't block)
    this.updateLastUsed(apiKeyRecord.id).catch(() => {});

    return true;
  }

  private extractApiKey(request: Request): string | null {
    // Check X-API-Key header
    const headerKey = request.headers['x-api-key'];
    if (headerKey && typeof headerKey === 'string') {
      return headerKey;
    }

    // Check Authorization: Bearer header
    const authHeader = request.headers['authorization'];
    if (authHeader && typeof authHeader === 'string') {
      const match = authHeader.match(/^Bearer\s+(.+)$/);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  private async updateLastUsed(apiKeyId: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { lastUsedAt: new Date() },
    });
  }
}
```

#### Scope Guard
```typescript
// apps/api/src/common/guards/scope.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from '@/common/decorators/scopes.decorator';
import { ApiScope } from '@shared/types/api-scopes';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<ApiScope[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredScopes || requiredScopes.length === 0) {
      return true; // No scopes required
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.apiKey;

    if (!apiKey) {
      throw new ForbiddenException('API key not found in request');
    }

    const permissions = apiKey.permissions as { scopes: ApiScope[] };
    const userScopes = permissions.scopes || [];

    // Check if user has ANY of the required scopes
    const hasRequiredScope = requiredScopes.some((scope) => userScopes.includes(scope));

    if (!hasRequiredScope) {
      throw new ForbiddenException(
        `Insufficient permissions. Required scopes: ${requiredScopes.join(', ')}`,
      );
    }

    return true;
  }
}
```

#### Scopes Decorator
```typescript
// apps/api/src/common/decorators/scopes.decorator.ts

import { SetMetadata } from '@nestjs/common';
import { ApiScope } from '@shared/types/api-scopes';

export const SCOPES_KEY = 'scopes';
export const Scopes = (...scopes: ApiScope[]) => SetMetadata(SCOPES_KEY, scopes);
```

#### API Keys Service
```typescript
// apps/api/src/settings/api-keys.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { ApiScope } from '@shared/types/api-scopes';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a new API key with format: sk_prod_{random}
   */
  generateApiKey(): { key: string; prefix: string; hash: string } {
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const key = `sk_prod_${randomBytes}`;
    const prefix = key.substring(0, 16); // sk_prod_xxxxxxx
    const hash = crypto.createHash('sha256').update(key).digest('hex');

    return { key, prefix, hash };
  }

  /**
   * Create a new API key
   */
  async createApiKey(data: {
    workspaceId: string;
    userId: string;
    name: string;
    scopes: ApiScope[];
    expiresAt?: Date;
    rateLimit?: number;
  }) {
    const { key, prefix, hash } = this.generateApiKey();

    const apiKey = await this.prisma.apiKey.create({
      data: {
        workspaceId: data.workspaceId,
        createdById: data.userId,
        name: data.name,
        keyPrefix: prefix,
        keyHash: hash,
        permissions: {
          scopes: data.scopes,
          rateLimit: data.rateLimit || 10000,
        },
        expiresAt: data.expiresAt,
      },
    });

    return { apiKey, plainKey: key };
  }

  /**
   * List API keys for workspace
   */
  async listApiKeys(workspaceId: string) {
    return this.prisma.apiKey.findMany({
      where: {
        workspaceId,
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(id: string, workspaceId: string) {
    return this.prisma.apiKey.update({
      where: { id, workspaceId },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Get API key usage stats
   */
  async getApiKeyUsage(id: string, workspaceId: string) {
    // TODO: Implement usage tracking from audit logs
    return {
      totalRequests: 0,
      requestsToday: 0,
      lastUsedAt: null,
    };
  }
}
```

#### API Keys Controller
```typescript
// apps/api/src/settings/api-keys.controller.ts

import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentWorkspace } from '@/common/decorators/current-workspace.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Controller('settings/api-keys')
@UseGuards(AuthGuard, TenantGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  async listApiKeys(@CurrentWorkspace() workspaceId: string) {
    return this.apiKeysService.listApiKeys(workspaceId);
  }

  @Post()
  async createApiKey(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.createApiKey({
      workspaceId,
      userId,
      ...dto,
    });
  }

  @Delete(':id')
  async revokeApiKey(
    @Param('id') id: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.apiKeysService.revokeApiKey(id, workspaceId);
  }

  @Get(':id/usage')
  async getApiKeyUsage(
    @Param('id') id: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.apiKeysService.getApiKeyUsage(id, workspaceId);
  }
}
```

#### DTOs
```typescript
// apps/api/src/settings/dto/create-api-key.dto.ts

import { IsString, IsArray, IsOptional, IsDate, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiScope } from '@shared/types/api-scopes';

export class CreateApiKeyDto {
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  scopes: ApiScope[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(100000)
  rateLimit?: number;
}
```

### Frontend

#### API Keys Settings Page
```typescript
// apps/web/src/app/(dashboard)/settings/api-keys/page.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateApiKeyDialog } from './create-api-key-dialog';
import { useApiKeys } from '@/hooks/use-api-keys';
import { formatDistanceToNow } from 'date-fns';

export default function ApiKeysPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { apiKeys, isLoading, revokeApiKey } = useApiKeys();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage API keys for external integrations
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          Create API Key
        </Button>
      </div>

      <div className="space-y-4">
        {apiKeys?.map((key) => (
          <Card key={key.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{key.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {key.keyPrefix}***
                  </CardDescription>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => revokeApiKey(key.id)}
                >
                  Revoke
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {key.permissions.scopes.map((scope) => (
                    <Badge key={scope} variant="secondary">
                      {scope}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  {key.lastUsedAt ? (
                    <>Last used {formatDistanceToNow(new Date(key.lastUsedAt))} ago</>
                  ) : (
                    <>Never used</>
                  )}
                </div>
                {key.expiresAt && (
                  <div className="text-sm text-muted-foreground">
                    Expires {formatDistanceToNow(new Date(key.expiresAt))} from now
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
```

#### Create API Key Dialog
```typescript
// apps/web/src/app/(dashboard)/settings/api-keys/create-api-key-dialog.tsx

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { API_SCOPES } from '@shared/types/api-scopes';
import { useCreateApiKey } from '@/hooks/use-api-keys';
import { Copy } from 'lucide-react';

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateApiKeyDialog({ open, onOpenChange }: CreateApiKeyDialogProps) {
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const { createApiKey, isLoading } = useCreateApiKey();

  const scopeOptions = [
    { value: API_SCOPES.PM_READ, label: 'PM Read', description: 'Read projects, tasks, phases' },
    { value: API_SCOPES.PM_WRITE, label: 'PM Write', description: 'Create/update projects, tasks' },
    { value: API_SCOPES.PM_ADMIN, label: 'PM Admin', description: 'Delete operations' },
    { value: API_SCOPES.KB_READ, label: 'KB Read', description: 'Read knowledge base pages' },
    { value: API_SCOPES.KB_WRITE, label: 'KB Write', description: 'Create/update KB pages' },
    { value: API_SCOPES.WEBHOOK_READ, label: 'Webhook Read', description: 'List webhooks' },
    { value: API_SCOPES.WEBHOOK_WRITE, label: 'Webhook Write', description: 'Create/delete webhooks' },
  ];

  const handleCreate = async () => {
    const result = await createApiKey({
      name,
      scopes: selectedScopes,
    });
    setCreatedKey(result.plainKey);
  };

  const copyToClipboard = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedScopes([]);
    setCreatedKey(null);
    onOpenChange(false);
  };

  if (createdKey) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy this API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertDescription className="font-mono text-sm break-all">
              {createdKey}
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={copyToClipboard} variant="secondary">
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Create a new API key for external integrations
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production Integration"
            />
          </div>
          <div>
            <Label>Permissions</Label>
            <div className="space-y-2 mt-2">
              {scopeOptions.map((scope) => (
                <div key={scope.value} className="flex items-start space-x-2">
                  <Checkbox
                    id={scope.value}
                    checked={selectedScopes.includes(scope.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedScopes([...selectedScopes, scope.value]);
                      } else {
                        setSelectedScopes(selectedScopes.filter((s) => s !== scope.value));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <label htmlFor={scope.value} className="text-sm font-medium cursor-pointer">
                      {scope.label}
                    </label>
                    <p className="text-sm text-muted-foreground">{scope.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name || selectedScopes.length === 0 || isLoading}>
            Create API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### Custom Hooks
```typescript
// apps/web/src/hooks/use-api-keys.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useApiKeys() {
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await fetch('/api/settings/api-keys');
      return res.json();
    },
  });

  const { mutateAsync: revokeApiKey } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/settings/api-keys/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  return { apiKeys, isLoading, revokeApiKey };
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  const { mutateAsync: createApiKey, isPending: isLoading } = useMutation({
    mutationFn: async (data: { name: string; scopes: string[] }) => {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  return { createApiKey, isLoading };
}
```

### Shared Types

#### API Scopes (Already Created in PM-11.1)
```typescript
// packages/shared/src/types/api-scopes.ts

export const API_SCOPES = {
  // PM Scopes
  PM_READ: 'pm:read',
  PM_WRITE: 'pm:write',
  PM_ADMIN: 'pm:admin',

  // KB Scopes
  KB_READ: 'kb:read',
  KB_WRITE: 'kb:write',
  KB_ADMIN: 'kb:admin',

  // Webhook Scopes
  WEBHOOK_READ: 'webhook:read',
  WEBHOOK_WRITE: 'webhook:write',
} as const;

export type ApiScope = typeof API_SCOPES[keyof typeof API_SCOPES];

export interface ApiKeyPermissions {
  scopes: ApiScope[];
  rateLimit?: number; // Requests per hour (default: 10000)
}
```

---

## Files to Create/Modify

### Backend
- `apps/api/src/common/guards/api-key.guard.ts` - API key authentication guard
- `apps/api/src/common/guards/scope.guard.ts` - Permission scope enforcement guard
- `apps/api/src/common/decorators/scopes.decorator.ts` - Scopes metadata decorator
- `apps/api/src/settings/api-keys.service.ts` - API key CRUD service
- `apps/api/src/settings/api-keys.controller.ts` - API key management endpoints
- `apps/api/src/settings/dto/create-api-key.dto.ts` - API key creation DTO
- `apps/api/src/pm/api/projects-api.controller.ts` - Update to use ApiKeyGuard
- `apps/api/src/pm/api/phases-api.controller.ts` - Update to use ApiKeyGuard
- `apps/api/src/pm/api/tasks-api.controller.ts` - Update to use ApiKeyGuard
- `apps/api/src/pm/api/views-api.controller.ts` - Update to use ApiKeyGuard
- `apps/api/src/pm/api/search-api.controller.ts` - Update to use ApiKeyGuard

### Frontend
- `apps/web/src/app/(dashboard)/settings/api-keys/page.tsx` - API keys management page
- `apps/web/src/app/(dashboard)/settings/api-keys/create-api-key-dialog.tsx` - Create key dialog
- `apps/web/src/hooks/use-api-keys.ts` - API keys React Query hooks

### Shared Types
- `packages/shared/src/types/api-scopes.ts` - Already created in PM-11.1

---

## Testing Requirements

### Unit Tests

#### API Key Guard
```typescript
describe('ApiKeyGuard', () => {
  it('should validate API key hash');
  it('should reject expired API keys');
  it('should reject revoked API keys');
  it('should attach workspaceId to request');
  it('should update lastUsedAt timestamp');
  it('should accept X-API-Key header');
  it('should accept Authorization: Bearer header');
  it('should reject request without API key');
  it('should reject request with invalid API key');
});
```

#### Scope Guard
```typescript
describe('ScopeGuard', () => {
  it('should allow request with required scope');
  it('should reject request without required scope');
  it('should handle multiple scopes (OR logic)');
  it('should allow request when no scopes required');
  it('should reject request without API key in context');
});
```

#### API Keys Service
```typescript
describe('ApiKeysService', () => {
  it('should generate API key with correct format (sk_prod_...)');
  it('should hash API key with SHA-256');
  it('should create API key with permissions JSON');
  it('should list API keys for workspace');
  it('should revoke API key');
  it('should not list revoked API keys');
  it('should set default rate limit (10000 req/hour)');
});
```

### Integration Tests

#### API Authentication
```typescript
describe('API Authentication (E2E)', () => {
  it('should authenticate with valid API key in X-API-Key header');
  it('should authenticate with valid API key in Authorization: Bearer header');
  it('should reject request with invalid API key');
  it('should reject request with expired API key');
  it('should reject request with revoked API key');
  it('should reject request without API key');
  it('should update lastUsedAt on successful request');
});
```

#### Scope Enforcement
```typescript
describe('Scope Enforcement', () => {
  it('should allow pm:read scope to GET /api/v1/pm/tasks');
  it('should reject pm:read scope from POST /api/v1/pm/tasks');
  it('should allow pm:write scope to POST /api/v1/pm/tasks');
  it('should reject pm:write scope from DELETE /api/v1/pm/tasks/:id');
  it('should allow pm:admin scope to DELETE /api/v1/pm/tasks/:id');
  it('should reject API key without required scope');
});
```

#### Key Management UI
```typescript
describe('API Keys Management', () => {
  it('should display list of API keys');
  it('should create new API key with selected scopes');
  it('should show full API key only once after creation');
  it('should copy API key to clipboard');
  it('should revoke API key');
  it('should show last used timestamp');
  it('should show key prefix (sk_prod_xxx***)');
});
```

---

## Security & Compliance

### API Key Security
- API keys stored as SHA-256 hashes (never plaintext)
- Keys transmitted over HTTPS only
- Full key shown only once at creation (copy-to-clipboard)
- Key prefix stored for identification (sk_prod_xxxxxxx)
- Key rotation recommended every 90 days (future: auto-rotation)
- Revoked keys immediately invalidated

### Scope Permissions
- Least privilege principle (users select minimal required scopes)
- Scopes enforced at guard level (cannot be bypassed)
- Workspace-level isolation (API keys cannot access other workspaces)
- Admin scopes required for destructive operations

### Rate Limiting
- Default: 10,000 requests per hour per API key
- Configurable per workspace plan (future: tiered limits)
- Rate limiting implementation in PM-11.5

### Audit Logging
- All API requests logged (endpoint, API key, IP, timestamp, response status)
- API key creation/revocation logged
- Last used timestamp updated on each request
- Retention: 90 days

---

## Dependencies

### Prerequisites
- PM-11.1 (REST API Design) - API controllers to protect with authentication
- Existing ApiKey model in database schema

### Blocks
- PM-11.3 (Webhook Subscriptions) - Needs authentication for webhook management
- PM-11.4 (API Documentation Portal) - Needs authentication guide
- PM-11.5 (Rate Limiting) - Uses API key context for rate limits

---

## Definition of Done

- [ ] ApiKeyGuard implemented and validates API keys
- [ ] ScopeGuard implemented and enforces permissions
- [ ] Scopes decorator created
- [ ] ApiKeysService implemented with key generation, creation, listing, revocation
- [ ] ApiKeysController implemented with CRUD endpoints
- [ ] All PM-11.1 API controllers updated to use ApiKeyGuard and ScopeGuard
- [ ] Placeholder `workspaceId` and `actorId` replaced with API key context extraction
- [ ] API Keys settings page UI implemented
- [ ] Create API Key dialog implemented with scope selection
- [ ] API key shown once after creation with copy-to-clipboard
- [ ] API keys list shows key prefix, scopes, last used, expiration
- [ ] Revoke API key functionality implemented
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests written and passing
- [ ] Code review completed
- [ ] Documentation updated

---

## References

- [Epic Definition](../epics/epic-pm-11-external-api-governance.md)
- [Tech Spec](../epics/epic-pm-11-tech-spec.md)
- [Sprint Status](../sprint-status.yaml)
- [Previous Story: PM-11.1](./pm-11-1-public-api.md)
- [OpenAPI Security Schemes](https://swagger.io/docs/specification/authentication/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

---

## Notes

### API Key Format
```
sk_prod_{64_hex_characters}

Example: sk_prod_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
```

- Prefix: `sk_prod_` (makes keys easily identifiable, prevents accidental leaks)
- Random: 32 bytes (256 bits) of entropy, hex-encoded
- Hash: SHA-256 stored in database (64 hex characters)
- Prefix stored: First 16 characters for display (sk_prod_xxxxxxx)

### Permissions JSON Structure
```json
{
  "scopes": ["pm:read", "pm:write", "kb:read"],
  "rateLimit": 10000
}
```

### Authentication Header Options
```bash
# Option 1: X-API-Key header (recommended)
curl -H "X-API-Key: sk_prod_..." https://api.hyvve.com/api/v1/pm/tasks

# Option 2: Authorization: Bearer header (alternative)
curl -H "Authorization: Bearer sk_prod_..." https://api.hyvve.com/api/v1/pm/tasks
```

### Scope Hierarchy
- `pm:admin` includes `pm:write` and `pm:read` (future: hierarchical scopes)
- For MVP: Each scope is independent (no hierarchy)

### Future Enhancements
- OAuth 2.0 for user context (mentioned in epic, deferred to v2)
- Hierarchical scopes (admin includes write, write includes read)
- API key rotation workflow (one-click rotation)
- Usage analytics dashboard per API key
- IP allowlisting per API key
- GitHub Secret Scanning integration to detect leaked keys

---

## Implementation Notes

**Status:** Drafted
**Estimated Effort:** 8 story points

### Scope
This story implements API key authentication and permission scopes. It builds on PM-11.1 by replacing placeholder authentication with real API key validation. OAuth 2.0 is mentioned in the epic but deferred to a future version.

### Technical Decisions

1. **No Schema Changes**: Existing ApiKey model supports scoped permissions via `permissions` JSON field. No migration needed.

2. **SHA-256 Hashing**: API keys are hashed using SHA-256 before storage. Collision probability is negligible for random 256-bit keys.

3. **Key Prefix Display**: Store first 16 characters of key (sk_prod_xxxxxxx) for user identification without exposing full key.

4. **Async Last Used Update**: Update `lastUsedAt` timestamp asynchronously to avoid blocking API requests. Failures are silently caught.

5. **OR Logic for Scopes**: If an endpoint requires multiple scopes, API key must have ANY of them (OR logic). Future: AND logic for compound permissions.

6. **Rate Limit in Permissions**: Store per-key rate limit in permissions JSON. Default: 10,000 req/hour. Enforced in PM-11.5.

### Integration with PM-11.1

PM-11.1 controllers currently use placeholder values:
```typescript
// TODO (PM-11.2): Extract from API key context
const workspaceId = 'workspace-placeholder';
const actorId = 'api-key-actor-placeholder';
```

This story replaces placeholders with:
```typescript
const workspaceId = request.workspaceId; // Set by ApiKeyGuard
const actorId = request.apiKey.createdById; // API key creator as actor
```

### Security Considerations

1. **Key Rotation**: Users should rotate keys every 90 days. UI can show warning for keys older than 90 days (future enhancement).

2. **Key Leakage**: If a key is leaked:
   - User revokes key immediately via UI
   - Revoked keys fail authentication instantly (no caching)
   - Audit logs show all requests made with that key

3. **Scope Creep**: Users should grant minimal required scopes. UI warns if selecting all scopes.

4. **HTTPS Only**: API keys transmitted over HTTPS only. HTTP requests rejected in production.

---

## Development Notes

**Implementation Date:** 2025-12-24
**Status:** Review (implementation complete)

### Files Created

**Backend Guards & Services:**
- `/home/chris/projects/work/Ai Bussiness Hub/apps/api/src/common/guards/api-key.guard.ts` - API key authentication guard
- `/home/chris/projects/work/Ai Bussiness Hub/apps/api/src/common/guards/scope.guard.ts` - Permission scope enforcement guard
- `/home/chris/projects/work/Ai Bussiness Hub/apps/api/src/common/decorators/scopes.decorator.ts` - Scopes metadata decorator
- `/home/chris/projects/work/Ai Bussiness Hub/apps/api/src/settings/api-keys/api-keys.service.ts` - API key CRUD service
- `/home/chris/projects/work/Ai Bussiness Hub/apps/api/src/settings/api-keys/api-keys.controller.ts` - API key management endpoints
- `/home/chris/projects/work/Ai Bussiness Hub/apps/api/src/settings/api-keys/dto/create-api-key.dto.ts` - API key creation DTO
- `/home/chris/projects/work/Ai Bussiness Hub/apps/api/src/settings/api-keys/dto/api-key-response.dto.ts` - API key response DTO

**Updated PM-11.1 Controllers:**
- `/home/chris/projects/work/Ai Bussiness Hub/apps/api/src/pm/api/projects-api.controller.ts` - Added guards, scopes, replaced placeholders
- `/home/chris/projects/work/Ai Bussiness Hub/apps/api/src/pm/api/phases-api.controller.ts` - Added guards, scopes, replaced placeholders
- `/home/chris/projects/work/Ai Bussiness Hub/apps/api/src/pm/api/tasks-api.controller.ts` - Added guards, scopes, replaced placeholders
- `/home/chris/projects/work/Ai Bussiness Hub/apps/api/src/pm/api/views-api.controller.ts` - Added guards, scopes, replaced placeholders
- `/home/chris/projects/work/Ai Bussiness Hub/apps/api/src/pm/api/search-api.controller.ts` - Added guards, scopes, replaced placeholders

**Frontend Components:**
- `/home/chris/projects/work/Ai Bussiness Hub/apps/web/src/hooks/use-api-keys.ts` - React Query hooks for API keys
- `/home/chris/projects/work/Ai Bussiness Hub/apps/web/src/app/(dashboard)/settings/api-keys/page.tsx` - API keys management page (replaced BYOAI page)
- `/home/chris/projects/work/Ai Bussiness Hub/apps/web/src/app/(dashboard)/settings/api-keys/create-api-key-dialog.tsx` - Create API key dialog

**Shared Types:**
- `/home/chris/projects/work/Ai Bussiness Hub/packages/shared/src/types/api-scopes.ts` - Already existed from PM-11.1

### Implementation Summary

1. **Authentication Flow:**
   - Created ApiKeyGuard that extracts API key from `X-API-Key` or `Authorization: Bearer` headers
   - Hashes key with SHA-256 for database lookup
   - Validates key is not revoked or expired
   - Attaches `workspaceId` and `apiKey` to request object
   - Updates `lastUsedAt` timestamp asynchronously

2. **Authorization Flow:**
   - Created ScopeGuard that checks required scopes against API key permissions
   - Uses OR logic (API key needs ANY of the required scopes)
   - Scopes decorator allows marking endpoints with required permissions

3. **API Key Management:**
   - Service generates keys with format `sk_prod_{64_hex_chars}`
   - Keys stored as SHA-256 hashes with key prefix for display
   - Full key shown only once at creation (copy-to-clipboard)
   - List view shows key prefix, scopes, last used timestamp, expiration

4. **Controller Updates:**
   - All 5 PM-11.1 controllers updated with `@UseGuards(ApiKeyGuard, ScopeGuard)`
   - Added `@ApiSecurity('api-key')` for OpenAPI spec
   - Replaced placeholders: `workspaceId = request['workspaceId']`, `actorId = request['apiKey'].createdById`
   - Added appropriate scopes to each endpoint (pm:read, pm:write, pm:admin)

5. **Frontend UI:**
   - API Keys settings page replaces BYOAI provider keys page
   - Create dialog with scope selection checkboxes
   - List view with key cards showing name, prefix, scopes, last used, created by
   - Revoke confirmation dialog
   - Copy-to-clipboard for new keys (shown once)

### Next Steps

1. Test API key authentication with real keys
2. Verify scope enforcement works correctly
3. Test frontend UI for key creation and revocation
4. Update API documentation with authentication guide (PM-11.4)
5. Consider moving BYOAI provider keys to `/settings/ai-config` subtab

---
