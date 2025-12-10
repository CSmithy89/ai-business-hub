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
      <div className="mb-6 rounded-full bg-amber-100 p-6">
        <Building className="h-12 w-12 text-amber-600" />
      </div>

      <h2 className="mb-2 text-2xl font-bold">No Workspace Selected</h2>
      <p className="mb-8 max-w-md text-center text-muted-foreground">
        You need to create or select a workspace before you can manage
        businesses. A workspace is where your team collaborates and manages
        multiple businesses together.
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

      <div className="mt-8 p-4 bg-muted rounded-lg max-w-md">
        <h3 className="font-medium mb-2">What is a Workspace?</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            • A workspace contains all your businesses and team members
          </li>
          <li>
            • Invite team members to collaborate with different permission levels
          </li>
          <li>
            • Configure AI providers and settings per workspace
          </li>
          <li>
            • Manage multiple businesses from one central dashboard
          </li>
        </ul>
      </div>
    </div>
  );
}
