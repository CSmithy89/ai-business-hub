/**
 * Account Setup Onboarding Page
 *
 * 4-step user onboarding wizard for new users after registration.
 * Steps: Workspace → AI Provider → Meet Team → Ready
 *
 * Story: 15.3 - Implement 4-Step User Onboarding Wizard
 */

import { AccountSetupWizard } from '@/components/onboarding/account/AccountSetupWizard';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function AccountSetupPage() {
  // Get current user's name for personalization
  let userName: string | undefined;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    userName = session?.user?.name || undefined;
  } catch (err) {
    // User might not be signed in - wizard will handle redirect
    // Log unexpected errors to aid debugging while keeping the same fallback behavior
    console.error('Failed to retrieve session in AccountSetupPage:', err);
  }

  return (
    <div className="min-h-screen bg-background">
      <AccountSetupWizard userName={userName} />
    </div>
  );
}
