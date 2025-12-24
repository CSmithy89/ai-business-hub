'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePmTasks, type TaskListItem } from '@/hooks/use-pm-tasks';
import { Badge } from '@/components/ui/badge';

interface TaskSelectorProps {
  projectId: string;
  value: string | null;
  onChange: (taskId: string) => void;
}

export function TaskSelector({ projectId, value, onChange }: TaskSelectorProps) {
  const { data: response, isLoading } = usePmTasks({ projectId });
  const tasks = response?.data || [];

  const selectedTask = tasks.find((task: TaskListItem) => task.id === value);

  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue>
          {selectedTask ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                #{selectedTask.taskNumber}
              </span>
              <span className="truncate">{selectedTask.title}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {isLoading ? 'Loading tasks...' : 'Select task...'}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {tasks.map((task: TaskListItem) => (
          <SelectItem key={task.id} value={task.id} className="cursor-pointer">
            <div className="flex items-center gap-2 w-full">
              <span className="font-mono text-xs text-muted-foreground shrink-0">
                #{task.taskNumber}
              </span>
              <span className="truncate flex-1">{task.title}</span>
              <Badge
                variant={
                  task.status === 'DONE'
                    ? 'default'
                    : task.status === 'IN_PROGRESS'
                    ? 'secondary'
                    : 'outline'
                }
                className="text-xs shrink-0"
              >
                {task.status}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
