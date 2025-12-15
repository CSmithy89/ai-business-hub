/**
 * MCP (Model Context Protocol) Constants
 * Server configuration constants for HYVVE Platform
 */

/**
 * MCP Permission bit flags (must match agents/providers/mcp.py)
 */
export const MCPPermissions = {
  NONE: 0,
  READ: 1,
  WRITE: 2,
  EXECUTE: 4,
  READ_ONLY: 1,
  READ_WRITE: 3,
  FULL: 7,
} as const

/**
 * Valid transport types for MCP servers
 */
export const VALID_TRANSPORTS = ['stdio', 'sse', 'streamable-http'] as const
export type MCPTransport = (typeof VALID_TRANSPORTS)[number]

/**
 * Permission level descriptions for UI display
 */
export const PERMISSION_LEVELS = [
  { value: MCPPermissions.READ_ONLY, name: 'Read Only', description: 'Can only read data' },
  { value: MCPPermissions.READ_WRITE, name: 'Read/Write', description: 'Can read and write data' },
  { value: MCPPermissions.FULL, name: 'Full Access', description: 'Can read, write, and execute' },
] as const

/**
 * Transport type descriptions for UI display
 */
export const TRANSPORT_TYPES = [
  { value: 'stdio', name: 'Standard I/O', description: 'Local process via stdin/stdout' },
  { value: 'sse', name: 'Server-Sent Events', description: 'HTTP streaming endpoint' },
  { value: 'streamable-http', name: 'Streamable HTTP', description: 'HTTP streaming endpoint' },
] as const

/**
 * Get permission name from bit flags
 */
export function getPermissionName(permissions: number): string {
  if (permissions === MCPPermissions.FULL) return 'Full Access'
  if (permissions === MCPPermissions.READ_WRITE) return 'Read/Write'
  if (permissions === MCPPermissions.READ) return 'Read Only'
  return 'Custom'
}

/**
 * Check if permission includes READ
 */
export function hasReadPermission(permissions: number): boolean {
  return (permissions & MCPPermissions.READ) !== 0
}

/**
 * Check if permission includes WRITE
 */
export function hasWritePermission(permissions: number): boolean {
  return (permissions & MCPPermissions.WRITE) !== 0
}

/**
 * Check if permission includes EXECUTE
 */
export function hasExecutePermission(permissions: number): boolean {
  return (permissions & MCPPermissions.EXECUTE) !== 0
}

/**
 * Maximum MCP servers per workspace
 */
export const MAX_MCP_SERVERS_PER_WORKSPACE = 10

/**
 * Default timeout for MCP server operations (seconds)
 */
export const DEFAULT_MCP_TIMEOUT_SECONDS = 30

/**
 * Minimum timeout for MCP server operations (seconds)
 */
export const MIN_MCP_TIMEOUT_SECONDS = 5

/**
 * Maximum timeout for MCP server operations (seconds)
 */
export const MAX_MCP_TIMEOUT_SECONDS = 300
