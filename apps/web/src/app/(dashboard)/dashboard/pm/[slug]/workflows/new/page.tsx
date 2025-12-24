'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateWorkflow, useWorkflowTemplates, useCreateFromTemplate } from '@/hooks/use-pm-workflows';
import type { WorkflowTemplate } from '@/hooks/use-pm-workflows';
import { WorkflowCanvas } from '@/components/pm/workflows/WorkflowCanvas';
import { WorkflowTemplateGallery } from '@/components/pm/workflows/WorkflowTemplateGallery';
import type { WorkflowDefinition } from '@hyvve/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Sparkles, Plus } from 'lucide-react';
import { toast } from 'sonner';

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
  const createFromTemplate = useCreateFromTemplate();

  const [startFrom, setStartFrom] = useState<'template' | 'scratch'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<string>('TASK_CREATED');
  const [definition] = useState<WorkflowDefinition>(INITIAL_DEFINITION);

  const { data: templates, isLoading: templatesLoading } = useWorkflowTemplates();

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setName(template.name);
    setDescription(template.description);
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const workflow = await createFromTemplate.mutateAsync({
        templateId: selectedTemplate.id,
        name,
        projectId: params.slug,
        description,
      });

      router.push(`/dashboard/pm/${params.slug}/workflows/${workflow.id}` as any);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleSave = (updatedDefinition: WorkflowDefinition) => {
    if (!name.trim()) {
      toast.error('Please enter a workflow name');
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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/pm/${params.slug}/workflows` as any)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Workflow</h1>
          <p className="text-muted-foreground">
            Start from a template or build from scratch
          </p>
        </div>
      </div>

      <Tabs value={startFrom} onValueChange={(v) => setStartFrom(v as any)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="template">
            <Sparkles className="w-4 h-4 mr-2" />
            Use Template
          </TabsTrigger>
          <TabsTrigger value="scratch">
            <Plus className="w-4 h-4 mr-2" />
            Start from Scratch
          </TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="space-y-6">
          {templatesLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading templates...</p>
            </div>
          )}

          {!templatesLoading && templates && templates.length === 0 && (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <p className="text-muted-foreground">No templates available</p>
            </div>
          )}

          {!templatesLoading && templates && templates.length > 0 && (
            <>
              <WorkflowTemplateGallery
                templates={templates}
                onSelectTemplate={handleSelectTemplate}
              />

              {selectedTemplate && (
                <Card>
                  <CardHeader>
                    <CardTitle>Configure Workflow</CardTitle>
                    <CardDescription>
                      Customize your workflow based on the {selectedTemplate.name} template
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Workflow Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter workflow name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what this workflow does"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleCreateFromTemplate}
                        disabled={!name || createFromTemplate.isPending}
                      >
                        {createFromTemplate.isPending ? 'Creating...' : 'Create Workflow'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedTemplate(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="scratch" className="space-y-6">
          <div className="flex flex-col h-[calc(100vh-16rem)]">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>New Blank Workflow</CardTitle>
                <CardDescription>
                  Create an empty workflow and build it from the ground up
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <div className="flex-1 overflow-hidden border rounded-lg">
              <WorkflowCanvas definition={definition} onSave={handleSave} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
