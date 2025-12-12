/**
 * Demo Data Index
 *
 * Central export for all demo data used throughout the platform.
 * Enables easy toggling between demo mode and real data.
 *
 * Story: 16.8 - Implement Demo Mode Consistency
 */

// Export all demo data modules
export * from './approvals';
export * from './businesses';
export * from './agents';
export * from './settings';

// Re-export for convenient access
export { DEMO_APPROVALS, getDemoApprovals, getDemoApproval, DEMO_APPROVAL_STATS } from './approvals';
export { DEMO_BUSINESSES, getDemoBusinesses, getDemoBusiness, DEMO_BUSINESS_STATS } from './businesses';
export { DEMO_AGENTS, getDemoAgents, getDemoAgent, DEMO_AGENT_STATS } from './agents';
export {
  DEMO_USER_PROFILE,
  DEMO_WORKSPACE,
  DEMO_AI_PROVIDERS,
  DEMO_TOKEN_USAGE,
  DEMO_WORKSPACE_MEMBERS,
  DEMO_NOTIFICATION_PREFERENCES,
  DEMO_APPEARANCE_PREFERENCES,
  DEMO_SECURITY_SETTINGS,
  getAllDemoSettings,
} from './settings';

/**
 * Check if demo mode is enabled
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Get demo mode status with debug info
 */
export function getDemoModeInfo() {
  const isDemo = isDemoMode();
  return {
    enabled: isDemo,
    envVar: process.env.NEXT_PUBLIC_DEMO_MODE,
    message: isDemo
      ? 'Demo mode is active - using sample data'
      : 'Demo mode is disabled - using real data',
  };
}
