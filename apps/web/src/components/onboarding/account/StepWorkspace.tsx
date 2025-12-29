/**
 * Step 1: Create Workspace Component
 *
 * First step of account onboarding wizard.
 * Allows user to create their first workspace with name and auto-generated slug.
 *
 * Story: 15.3 - Implement 4-Step User Onboarding Wizard
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronRight, Building2, Loader2 } from 'lucide-react';
import { useSession } from '@/lib/auth-client';

interface StepWorkspaceProps {
  initialName: string;
  initialSlug: string;
  onContinue: (name: string, slug: string, workspaceId: string) => void;
}

/**
 * Generate URL-friendly slug from workspace name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export function StepWorkspace({ initialName, initialSlug, onContinue }: StepWorkspaceProps) {
  const { refetch: refetchSession } = useSession();
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate slug when name changes
  useEffect(() => {
    if (name && !initialSlug) {
      setSlug(generateSlug(name));
    }
  }, [name, initialSlug]);

  const handleNameChange = (value: string) => {
    setName(value);
    setError(null);
    // Auto-generate slug
    setSlug(generateSlug(value));
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }

    if (name.trim().length < 2) {
      setError('Workspace name must be at least 2 characters');
      return;
    }

    if (name.trim().length > 50) {
      setError('Workspace name must be 50 characters or less');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create workspace via API
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug || generateSlug(name.trim()),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.includes('slug') || result.message?.includes('slug')) {
          setError('This workspace URL is already taken. Try a different name.');
        } else {
          setError(result.message || result.error || 'Failed to create workspace');
        }
        return;
      }

      // Refetch session to get updated activeWorkspaceId
      await refetchSession();

      // Success - continue to next step
      onContinue(name.trim(), slug, result.data?.id || result.id);
    } catch {
      setError('Failed to create workspace. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Create Your Workspace</h2>
        <p className="mt-2 text-muted-foreground">
          Your workspace is where you&apos;ll manage all your businesses and AI agents.
        </p>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-md space-y-4">
        <div className="space-y-2">
          <Label htmlFor="workspace-name">Workspace Name</Label>
          <Input
            id="workspace-name"
            placeholder="My Company"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        {/* Slug Preview */}
        {slug && (
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              Your workspace URL will be:
            </p>
            <p className="mt-1 font-mono text-sm">
              hyvve.app/<span className="text-primary">{slug}</span>
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
