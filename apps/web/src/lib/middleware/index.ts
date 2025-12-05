/**
 * Middleware barrel export
 * Composable higher-order functions for Next.js API route protection
 *
 * @module middleware
 */

// Authentication middleware
export {
  withAuth,
  type AuthContext,
  type AuthHandler,
} from './with-auth'

// Tenant context middleware
export {
  withTenant,
  extractWorkspaceId,
  type TenantContext,
  type TenantHandler,
} from './with-tenant'

// Permission middleware
export {
  withPermission,
  type PermissionHandler,
} from './with-permission'

// Rate limiting middleware
export {
  withRateLimit,
  withStandardRateLimit,
  withSensitiveRateLimit,
  RATE_LIMIT_CONFIGS,
  type RateLimitConfig,
} from './with-rate-limit'

// CSRF protection middleware (Story 10.6)
export {
  withCSRF,
  validateCSRF,
  extractCSRFToken,
  type CSRFHandler,
  type CSRFValidationResult,
} from './with-csrf'
