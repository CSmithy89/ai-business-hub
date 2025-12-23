'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateWorkflow } from '@/hooks/use-pm-workflows';
import { WorkflowCanvas } from '@/components/pm/workflows/WorkflowCanvas';
import type { WorkflowDefinition } from '@hyvve/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

const INITIAL_DEFINITION: WorkflowDefinition = {
  nodes: [],
  edges: [],
  triggers: [],
  variables: {},
};

export default function NewWorkflowPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const createWorkflow = useCreateWorkflow();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<string>('TASK_CREATED');
  const [definition] = useState<WorkflowDefinition>(INITIAL_DEFINITION);

  const handleSave = (updatedDefinition: WorkflowDefinition) => {
    if (!name.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    createWorkflow.mutate(
      {
        projectId: params.slug,
        name,
        description,
        definition: updatedDefinition,
        triggerType: triggerType as any,
        triggerConfig: {},
      },
      {
        onSuccess: (workflow) => {
          router.push(`/dashboard/pm/${params.slug}/workflows/${workflow.id}` as any);
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-background p-4">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/pm/${params.slug}/workflows` as any)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Create New Workflow</h1>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="name">Workflow Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter workflow name"
            />
          </div>

          <div>
            <Label htmlFor="trigger">Trigger Type</Label>
            <Select
              value={triggerType}
              onValueChange={(value) => setTriggerType(value)}
            >
              <SelectTrigger id="trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TASK_CREATED">Task Created</SelectItem>
                <SelectItem value="TASK_STATUS_CHANGED">Task Status Changed</SelectItem>
                <SelectItem value="TASK_ASSIGNED">Task Assigned</SelectItem>
                <SelectItem value="DUE_DATE_APPROACHING">Due Date Approaching</SelectItem>
                <SelectItem value="TASK_COMPLETED">Task Completed</SelectItem>
                <SelectItem value="CUSTOM_SCHEDULE">Custom Schedule</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="h-[38px] resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <WorkflowCanvas definition={definition} onSave={handleSave} />
      </div>
    </div>
  );
}
