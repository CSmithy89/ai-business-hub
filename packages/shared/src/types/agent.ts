/**
 * Agent Types
 *
 * Type definitions for AI agents in the HYVVE platform.
 * Used across the platform for agent management, configuration, and monitoring.
 *
 * @module types/agent
 */

/**
 * Agent team classification
 */
export type AgentTeam = 'validation' | 'planning' | 'branding' | 'approval' | 'orchestrator';

/**
 * Agent operational status
 */
export type AgentStatus = 'online' | 'busy' | 'offline' | 'error';

/**
 * Agent automation level
 */
export type AgentAutomationLevel = 'manual' | 'smart' | 'full_auto';

/**
 * Agent configuration and metadata
 */
export interface Agent {
  // Identity
  id: string;                      // Unique agent ID
  name: string;                    // Display name (e.g., "Vera")
  role: string;                    // Agent role (e.g., "Validation Orchestrator")
  team: AgentTeam;                 // Team type
  description: string;             // Agent description
  avatar: string;                  // Emoji or image URL
  themeColor: string;              // Brand color (hex)

  // Status
  status: AgentStatus;             // Current operational status
  lastActive: Date;                // Last activity timestamp

  // Capabilities
  capabilities: string[];          // List of agent capabilities

  // Performance Metrics (30-day rolling)
  metrics: {
    tasksCompleted: number;
    successRate: number;           // 0-100
    avgResponseTime: number;       // milliseconds
    confidenceAvg: number;         // 0-100
  };

  // Configuration
  config: {
    providerId: string | null;     // AI provider override (null = use workspace default)
    model: string | null;          // Model override (null = use workspace default)
    temperature: number;           // 0-2 (default 1)
    maxTokens: number;             // Max tokens per request
    contextWindow: number;         // 4000 | 8000 | 16000
    automationLevel: AgentAutomationLevel;
    confidenceThreshold: number;   // 0-100
    tone: number;                  // 0-100 (0=professional, 100=casual)
    customInstructions: string;    // Additional instructions
  };

  // Permissions
  permissions: {
    dataAccess: string[];          // Modules agent can access
    canExecuteActions: boolean;    // Can execute vs. recommend only
    requiresApproval: boolean;     // All actions need approval
  };

  // Metadata
  workspaceId: string;             // Workspace tenant ID
  enabled: boolean;                // Agent enabled/disabled
  createdAt: Date;
  updatedAt: Date;
}
