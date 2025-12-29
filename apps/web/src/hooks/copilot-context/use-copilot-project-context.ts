'use client';

/**
 * CopilotKit Project Context Hook - Story DM-01.5
 *
 * Provides active project context to CopilotKit agents
 * using the useCopilotReadable hook. This enables agents to
 * understand which project the user is working on.
 *
 * @see https://docs.copilotkit.ai/reference/hooks/useCopilotReadable
 * Epic: DM-01 | Story: DM-01.5
 */

import { useCopilotReadable } from '@copilotkit/react-core';
import type { ProjectDetailResponse } from '@/hooks/use-pm-projects';
import type { ProjectContext, ProjectPhaseInfo } from './types';

/**
 * Transforms project data from the API response into the context format.
 *
 * @param project - Project data from usePmProject hook
 * @returns Formatted ProjectContext for agent consumption
 */
function transformProjectToContext(
  project: ProjectDetailResponse['data']
): ProjectContext {
  const totalTasks = project.totalTasks;
  const completedTasks = project.completedTasks;

  // Calculate percentage, avoiding division by zero
  const percentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Find the current/active phase:
  // 1. First, look for a phase with status 'CURRENT'
  // 2. If none, find the first non-completed phase
  // 3. If all completed, use the last phase
  // 4. If no phases at all, return null
  let currentPhase: ProjectPhaseInfo | null = null;

  if (project.phases && project.phases.length > 0) {
    // Look for explicitly marked current phase
    const markedCurrent = project.phases.find((p) => p.status === 'CURRENT');
    if (markedCurrent) {
      currentPhase = {
        id: markedCurrent.id,
        name: markedCurrent.name,
        phaseNumber: markedCurrent.phaseNumber,
      };
    } else {
      // Find first non-completed phase
      const nonCompleted = project.phases.find(
        (p) => p.status !== 'COMPLETED'
      );
      if (nonCompleted) {
        currentPhase = {
          id: nonCompleted.id,
          name: nonCompleted.name,
          phaseNumber: nonCompleted.phaseNumber,
        };
      } else {
        // All phases completed, use the last one
        const lastPhase = project.phases[project.phases.length - 1];
        currentPhase = {
          id: lastPhase.id,
          name: lastPhase.name,
          phaseNumber: lastPhase.phaseNumber,
        };
      }
    }
  }

  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    status: project.status,
    type: project.type,
    progress: {
      totalTasks,
      completedTasks,
      percentage,
    },
    currentPhase,
    targetDate: project.targetDate,
  };
}

/**
 * Provides active project context to CopilotKit agents.
 *
 * This hook shares project information with AI agents, enabling
 * them to understand which project the user is working on and
 * provide project-specific assistance.
 *
 * Usage: Call in project detail pages when project data is available.
 *
 * @param project - Project data from usePmProject hook, or null if not loaded
 *
 * @example
 * ```tsx
 * // In project detail layout or shell
 * export function ProjectShell({ children }) {
 *   const { data } = usePmProject(slug);
 *   useCopilotProjectContext(data?.data ?? null);
 *   return <>{children}</>;
 * }
 * ```
 */
export function useCopilotProjectContext(
  project: ProjectDetailResponse['data'] | null | undefined
): void {
  const context = project ? transformProjectToContext(project) : null;

  // Build a descriptive message for agents
  let description: string;

  if (context) {
    const progressText = `${context.progress.percentage}% complete with ${context.progress.completedTasks}/${context.progress.totalTasks} tasks done`;
    const phaseText = context.currentPhase
      ? ` Currently in phase "${context.currentPhase.name}" (phase ${context.currentPhase.phaseNumber}).`
      : '';
    const dateText = context.targetDate
      ? ` Target completion: ${context.targetDate}.`
      : '';

    description = `Active project: "${context.name}" (${context.status}, ${context.type}). ${progressText}.${phaseText}${dateText} Use this context when the user asks about "this project", "the project", or project-related questions.`;
  } else {
    description =
      'No project is currently selected. The user is not viewing a specific project.';
  }

  useCopilotReadable({
    description,
    value: context,
  });
}
