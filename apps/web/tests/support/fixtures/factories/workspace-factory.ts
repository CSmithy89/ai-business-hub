/**
 * Workspace Factory - Test Workspace Creation with Auto-Cleanup
 *
 * Multi-tenant aware factory for HYVVE workspace testing
 * @see .bmad/bmm/testarch/knowledge/data-factories.md
 */

type WorkspaceData = {
  name: string;
  slug: string;
  timezone?: string;
};

type CreatedWorkspace = WorkspaceData & {
  id: string;
};

// Simple slug generator
const generateSlug = () => `test-workspace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export class WorkspaceFactory {
  private createdWorkspaceIds: string[] = [];
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.API_URL || 'http://localhost:3000/api';
  }

  /**
   * Create a workspace via API (requires authenticated user)
   * @param authToken - Bearer token for authenticated user
   * @param overrides - Partial workspace data to override defaults
   */
  async createWorkspace(
    authToken: string,
    overrides: Partial<WorkspaceData> = {}
  ): Promise<CreatedWorkspace> {
    const slug = overrides.slug || generateSlug();
    const workspaceData: WorkspaceData = {
      name: overrides.name || `Test Workspace ${slug}`,
      slug,
      timezone: overrides.timezone || 'UTC',
    };

    const response = await fetch(`${this.apiUrl}/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(workspaceData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create workspace: ${response.status} ${error}`);
    }

    const result = await response.json();
    const createdWorkspace: CreatedWorkspace = {
      ...workspaceData,
      id: result.workspace?.id || result.id,
    };

    this.createdWorkspaceIds.push(createdWorkspace.id);
    return createdWorkspace;
  }

  /**
   * Cleanup all created workspaces
   * Called automatically by fixture teardown
   */
  async cleanup(): Promise<void> {
    for (const workspaceId of this.createdWorkspaceIds) {
      try {
        await fetch(`${this.apiUrl}/test/delete-workspace/${workspaceId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.warn(`Failed to cleanup workspace ${workspaceId}:`, error);
      }
    }
    this.createdWorkspaceIds = [];
  }
}
