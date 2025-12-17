import type { LucideIcon } from 'lucide-react'
import { Bot, Bug, CheckSquare, FileText, FlaskConical, Layers, ListTodo, PenLine } from 'lucide-react'
import type { TaskPriority, TaskType } from '@/hooks/use-pm-tasks'

export type TaskTypeMeta = {
  label: string
  icon: LucideIcon
  iconClassName: string
}

export const TASK_TYPES: TaskType[] = [
  'EPIC',
  'STORY',
  'TASK',
  'SUBTASK',
  'BUG',
  'RESEARCH',
  'CONTENT',
  'AGENT_REVIEW',
]

export const TASK_TYPE_META: Record<TaskType, TaskTypeMeta> = {
  EPIC: { label: 'Epic', icon: Layers, iconClassName: 'text-violet-600' },
  STORY: { label: 'Story', icon: FileText, iconClassName: 'text-indigo-600' },
  TASK: { label: 'Task', icon: CheckSquare, iconClassName: 'text-slate-600' },
  SUBTASK: { label: 'Subtask', icon: ListTodo, iconClassName: 'text-slate-500' },
  BUG: { label: 'Bug', icon: Bug, iconClassName: 'text-rose-600' },
  RESEARCH: { label: 'Research', icon: FlaskConical, iconClassName: 'text-sky-600' },
  CONTENT: { label: 'Content', icon: PenLine, iconClassName: 'text-emerald-600' },
  AGENT_REVIEW: { label: 'Agent review', icon: Bot, iconClassName: 'text-amber-600' },
}

export type TaskPriorityMeta = {
  label: string
  dotClassName: string
}

export const TASK_PRIORITIES: TaskPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']

export const TASK_PRIORITY_META: Record<TaskPriority, TaskPriorityMeta> = {
  URGENT: { label: 'Urgent', dotClassName: 'bg-red-500' },
  HIGH: { label: 'High', dotClassName: 'bg-orange-500' },
  MEDIUM: { label: 'Medium', dotClassName: 'bg-yellow-500' },
  LOW: { label: 'Low', dotClassName: 'bg-blue-500' },
  NONE: { label: 'None', dotClassName: 'bg-slate-300' },
}

export function getTaskTypeMeta(type: TaskType): TaskTypeMeta {
  return TASK_TYPE_META[type]
}

export function getTaskPriorityMeta(priority: TaskPriority): TaskPriorityMeta {
  return TASK_PRIORITY_META[priority]
}
