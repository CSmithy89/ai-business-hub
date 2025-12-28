/**
 * Project Factory - Test Project Creation with Auto-Cleanup
 *
 * Factory for creating PM projects for E2E testing
 * @see docs/modules/bm-pm/stories/pm-12-4-integration-e2e-tests.md
 */

type ProjectData = {
  name: string;
  description?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
};

type TaskData = {
  title: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  estimatedHours?: number;
};

type CreatedProject = {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  status: string;
  tasks?: CreatedTask[];
};

type CreatedTask = {
  id: string;
  projectId: string;
  title: string;
  status: string;
  taskNumber: number;
};

// Simple name generator
const generateProjectName = () =>
  `Test Project ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export class ProjectFactory {
  private createdProjectIds: string[] = [];
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.API_URL || 'http://localhost:3000/api';
  }

  /**
   * Create a project via API (requires authenticated user with active workspace)
   * @param authCookie - Authentication cookie for authenticated user
   * @param overrides - Partial project data to override defaults
   */
  async createProject(
    authCookie: string,
    overrides: Partial<ProjectData> = {}
  ): Promise<CreatedProject> {
    const projectData: ProjectData = {
      name: overrides.name || generateProjectName(),
      description:
        overrides.description ||
        'A test project created for E2E testing purposes.',
      status: overrides.status || 'ACTIVE',
    };

    const response = await fetch(`${this.apiUrl}/pm/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create project: ${response.status} ${error}`);
    }

    const result = await response.json();
    const createdProject: CreatedProject = {
      id: result.data?.id || result.id,
      workspaceId: result.data?.workspaceId || '',
      name: projectData.name,
      slug: result.data?.slug || '',
      status: projectData.status || 'ACTIVE',
    };

    this.createdProjectIds.push(createdProject.id);
    return createdProject;
  }

  /**
   * Create a project with tasks
   * @param authCookie - Authentication cookie for authenticated user
   * @param taskCount - Number of tasks to create
   * @param projectOverrides - Partial project data to override defaults
   */
  async createProjectWithTasks(
    authCookie: string,
    taskCount: number = 3,
    projectOverrides: Partial<ProjectData> = {}
  ): Promise<CreatedProject> {
    const project = await this.createProject(authCookie, projectOverrides);

    const tasks: CreatedTask[] = [];
    const taskStatuses: TaskData['status'][] = ['TODO', 'IN_PROGRESS', 'DONE'];
    const taskPriorities: TaskData['priority'][] = ['LOW', 'MEDIUM', 'HIGH'];

    for (let i = 0; i < taskCount; i++) {
      const taskData: TaskData = {
        title: `Test Task ${i + 1}`,
        description: `Test task description ${i + 1}`,
        status: taskStatuses[i % taskStatuses.length],
        priority: taskPriorities[i % taskPriorities.length],
        estimatedHours: (i + 1) * 2,
      };

      const taskResponse = await fetch(
        `${this.apiUrl}/pm/projects/${project.id}/tasks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify(taskData),
        }
      );

      if (taskResponse.ok) {
        const taskResult = await taskResponse.json();
        tasks.push({
          id: taskResult.data?.id || taskResult.id,
          projectId: project.id,
          title: taskData.title,
          status: taskData.status || 'TODO',
          taskNumber: i + 1,
        });
      }
    }

    return { ...project, tasks };
  }

  /**
   * Create a task for an existing project
   * @param authCookie - Authentication cookie
   * @param projectId - Project ID to add task to
   * @param overrides - Task data overrides
   */
  async createTask(
    authCookie: string,
    projectId: string,
    overrides: Partial<TaskData> = {}
  ): Promise<CreatedTask> {
    const taskData: TaskData = {
      title: overrides.title || `Test Task ${Date.now()}`,
      description: overrides.description || 'Test task description',
      status: overrides.status || 'TODO',
      priority: overrides.priority || 'MEDIUM',
      estimatedHours: overrides.estimatedHours,
      dueDate: overrides.dueDate,
    };

    const response = await fetch(
      `${this.apiUrl}/pm/projects/${projectId}/tasks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify(taskData),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create task: ${response.status} ${error}`);
    }

    const result = await response.json();
    return {
      id: result.data?.id || result.id,
      projectId,
      title: taskData.title,
      status: taskData.status || 'TODO',
      taskNumber: result.data?.taskNumber || 0,
    };
  }

  /**
   * Create an overdue task for testing
   * @param authCookie - Authentication cookie
   * @param projectId - Project ID
   */
  async createOverdueTask(
    authCookie: string,
    projectId: string
  ): Promise<CreatedTask> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return this.createTask(authCookie, projectId, {
      title: 'Overdue Test Task',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: yesterday.toISOString(),
    });
  }

  /**
   * List projects for the current workspace
   */
  async listProjects(authCookie: string): Promise<CreatedProject[]> {
    const response = await fetch(`${this.apiUrl}/pm/projects`, {
      method: 'GET',
      headers: {
        Cookie: authCookie,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list projects: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Cleanup all created projects
   * Called automatically by fixture teardown
   */
  async cleanup(): Promise<void> {
    for (const projectId of this.createdProjectIds) {
      try {
        await fetch(`${this.apiUrl}/test/delete-project/${projectId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.warn(`Failed to cleanup project ${projectId}:`, error);
      }
    }
    this.createdProjectIds = [];
  }
}
