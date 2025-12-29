import { SettingsLayout } from '@/components/layouts/settings-layout';
import { CCRRoutingConfig } from '@/components/settings/ccr-routing-config';
import { AIConfigSubnav } from '@/components/settings/ai-config-subnav';
import { WorkspaceRequired } from '@/components/settings/workspace-required';
import { getSession } from '@/lib/auth-server';

export const metadata = {
  title: 'Routing & Fallbacks',
  description: 'Configure CCR routing mode and fallback chains',
};

export default async function RoutingSettingsPage() {
  const session = await getSession();
  const workspaceId = session?.session?.activeWorkspaceId;

  return (
    <SettingsLayout
      title="Routing & Fallbacks"
      description="Configure how AI requests are routed between providers"
    >
      <AIConfigSubnav />
      {workspaceId != null ? <CCRRoutingConfig /> : <WorkspaceRequired />}
    </SettingsLayout>
  );
}
