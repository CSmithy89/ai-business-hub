/**
 * NoWorkspaceState Component
 *
 * Displayed when a user has no active workspace selected.
 * Provides guidance on creating or selecting a workspace.
 *
 * Story: 08.2 - Dashboard improvements
 */

'use client';

import Link from 'next/link';
import { Building, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NoWorkspaceState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-6 rounded-full bg-amber-100 p-6 dark:bg-amber-900/20">
        <Building className="h-12 w-12 text-amber-600 dark:text-amber-500" />
      </div>

      <h2 className="mb-2 text-2xl font-bold">Create Your Workspace</h2>
      <p className="mb-8 max-w-md text-center text-muted-foreground">
        A workspace is your team&apos;s home base. Create one to start managing your businesses with AI-powered workflows.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button size="lg" asChild>
          <Link href="/settings/workspace">
            <Plus className="mr-2 h-5 w-5" />
            Create Workspace
          </Link>
        </Button>

        <Button variant="outline" size="lg" asChild>
          <Link href="/settings/workspace">
            <Settings className="mr-2 h-5 w-5" />
            Workspace Settings
          </Link>
        </Button>
      </div>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg max-w-lg border border-border">
        <h3 className="font-semibold mb-4 text-base">Understanding Your Platform Structure</h3>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">Workspace</h4>
              <p className="text-sm text-muted-foreground">
                Your organization or team container. Invite members, configure AI providers, and manage multiple businesses together.
              </p>
            </div>
          </div>

          <div className="ml-4 border-l-2 border-border pl-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Plus className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">Business</h4>
                <p className="text-sm text-muted-foreground">
                  Individual business entities within your workspace. Each business has its own validation, planning, and branding workflows.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <strong>Example:</strong> Your workspace &quot;Acme Corp&quot; can contain multiple businesses like &quot;Coffee Shop Startup&quot;, &quot;SaaS Product&quot;, etc.
          </p>
        </div>
      </div>
    </div>
  );
}
