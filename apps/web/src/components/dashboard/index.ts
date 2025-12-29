/**
 * Dashboard Components
 *
 * Barrel export for all dashboard-related components.
 * Story 07-9: Create Dashboard Home Page
 * Updated: Story DM-03.4: Dashboard Page Integration
 */

export { DashboardWelcome } from './DashboardWelcome';
export { DashboardStats } from './DashboardStats';
export { DashboardActivity } from './DashboardActivity';
export { DashboardQuickActions } from './DashboardQuickActions';

// DM-03.4: Dashboard Agent Integration
export { DashboardGrid, type DashboardGridProps } from './DashboardGrid';
export { DashboardChat, type DashboardChatProps } from './DashboardChat';
