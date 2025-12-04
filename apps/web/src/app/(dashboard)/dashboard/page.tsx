import { Metadata } from 'next';
import {
  DashboardWelcome,
  DashboardStats,
  DashboardActivity,
  DashboardQuickActions,
} from '@/components/dashboard';

export const metadata: Metadata = {
  title: 'Dashboard | HYVVE',
  description: 'Your HYVVE dashboard',
};

/**
 * Dashboard Page
 *
 * Main dashboard page with welcome section, stats cards, activity feed,
 * and quick actions. Implements responsive grid layout.
 *
 * Story 07-9: Create Dashboard Home Page
 */
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <DashboardWelcome />

      {/* Stats Overview */}
      <DashboardStats />

      {/* Activity Feed and Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Activity Feed - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <DashboardActivity />
        </div>

        {/* Quick Actions - Takes 1 column on large screens */}
        <div className="lg:col-span-1">
          <DashboardQuickActions />
        </div>
      </div>
    </div>
  );
}
