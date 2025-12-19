/**
 * @hyvve/shared - Shared TypeScript types for HYVVE Platform
 *
 * This package provides shared type definitions used across the monorepo:
 * - apps/web (Next.js frontend)
 * - apps/api (NestJS backend)
 * - agents/ (AgentOS runtime)
 *
 * @packageDocumentation
 */

// Auth types
export * from './types/auth';

// Workspace types
export * from './types/workspace';

// Approval types
export * from './types/approval';

// Event types
export * from './types/events';

// Agent types
export * from './types/agent';

// PM types
export * from './types/pm';

// Presence types
export * from './types/presence';

// KB types
export * from './types/kb';

// Event schemas (Zod validation)
export * from './schemas/events';

// Permission system
export * from './permissions';

// Module permission overrides
export * from './module-permissions';

// NOTE: Encryption utilities are NOT exported from the main entry point
// because they use node:crypto which breaks client-side bundling.
// Import from '@hyvve/shared/server' for server-side utilities.
// See: packages/shared/src/server.ts
