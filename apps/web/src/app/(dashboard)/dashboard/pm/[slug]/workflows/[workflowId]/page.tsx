'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkflow, useUpdateWorkflow } from '@/hooks/use-pm-workflows';
import { WorkflowCanvas } from '@/components/pm/workflows/WorkflowCanvas';
import { ExecutionHistoryPanel } from '@/components/pm/workflows/ExecutionHistoryPanel';
import { WorkflowStatusToggle } from '@/components/pm/workflows/WorkflowStatusToggle';
import type { WorkflowDefinition } from '@hyvve/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings, History } from 'lucide-react';

export default function EditWorkflowPage(props: {
  params: Promise<{ slug: string; workflowId: string }>;
}) {
  const params = use(props.params);
  const router = useRouter();
  const { data: workflow, isLoading } = useWorkflow(params.workflowId);
  const updateWorkflow = useUpdateWorkflow();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description || '');
    }
  }, [workflow]);

  const handleSave = (updatedDefinition: WorkflowDefinition) => {
    updateWorkflow.mutate(
      {
        workflowId: params.workflowId,
        input: {
          name,
          description,
          definition: updatedDefinition,
        },
      },
      {
        onSuccess: () => {
          router.push(`/dashboard/pm/${params.slug}/workflows` as any);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading workflow...</p>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Workflow not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/pm/${params.slug}/workflows` as any)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">{workflow.name}</h1>
          </div>
          <WorkflowStatusToggle
            workflowId={workflow.id}
            enabled={workflow.enabled}
            status={workflow.status}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="name">Workflow Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter workflow name"
            />
          </div>

          <div>
            <Label>Trigger Type</Label>
            <div className="flex items-center h-[38px] px-3 rounded-md border bg-muted/50 text-sm">
              {workflow.triggerType.replace(/_/g, ' ').toLowerCase()}
            </div>
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

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div>Executions: {workflow.executionCount}</div>
          {workflow.errorCount > 0 && (
            <div className="text-destructive">Errors: {workflow.errorCount}</div>
          )}
          {workflow.lastExecutedAt && (
            <div>
              Last run: {new Date(workflow.lastExecutedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="editor" className="h-full flex flex-col">
          <div className="border-b px-4">
            <TabsList>
              <TabsTrigger value="editor">
                <Settings className="w-4 h-4 mr-2" />
                Workflow Editor
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="w-4 h-4 mr-2" />
                Execution History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="editor" className="flex-1 m-0 overflow-hidden">
            <WorkflowCanvas definition={workflow.definition as WorkflowDefinition} onSave={handleSave} />
          </TabsContent>

          <TabsContent value="history" className="flex-1 m-0 overflow-auto p-6">
            <ExecutionHistoryPanel workflowId={workflow.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
