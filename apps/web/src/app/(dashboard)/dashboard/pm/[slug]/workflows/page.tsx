'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkflows, useActivateWorkflow, usePauseWorkflow, useDeleteWorkflow } from '@/hooks/use-pm-workflows';
import { Button } from '@/components/ui/button';
import { Plus, Play, Pause, Trash2, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

export default function WorkflowsPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const { data: workflows, isLoading } = useWorkflows({ projectId: params.slug });
  const activateWorkflow = useActivateWorkflow();
  const pauseWorkflow = usePauseWorkflow();
  const deleteWorkflow = useDeleteWorkflow();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);

  const handleActivate = (workflowId: string) => {
    activateWorkflow.mutate(workflowId);
  };

  const handlePause = (workflowId: string) => {
    pauseWorkflow.mutate(workflowId);
  };

  const handleDeleteClick = (workflowId: string) => {
    setWorkflowToDelete(workflowId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (workflowToDelete) {
      deleteWorkflow.mutate(workflowToDelete);
    }
    setDeleteDialogOpen(false);
    setWorkflowToDelete(null);
  };

  const getStatusBadge = (status: string, enabled: boolean) => {
    if (status === 'ACTIVE' && enabled) {
      return <Badge variant="default">Active</Badge>;
    }
    if (status === 'PAUSED' || !enabled) {
      return <Badge variant="secondary">Paused</Badge>;
    }
    if (status === 'DRAFT') {
      return <Badge variant="outline">Draft</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Automate your project with custom workflows
          </p>
        </div>
        <Button onClick={() => router.push(`/dashboard/pm/${params.slug}/workflows/new` as any)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading workflows...</p>
        </div>
      )}

      {!isLoading && workflows && workflows.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground mb-4">No workflows yet</p>
          <Button onClick={() => router.push(`/dashboard/pm/${params.slug}/workflows/new` as any)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Workflow
          </Button>
        </div>
      )}

      {!isLoading && workflows && workflows.length > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Executions</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{workflow.name}</div>
                      {workflow.description && (
                        <div className="text-sm text-muted-foreground">
                          {workflow.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {workflow.triggerType.replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(workflow.status, workflow.enabled)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {workflow.executionCount}
                      {workflow.errorCount > 0 && (
                        <span className="text-destructive ml-1">
                          ({workflow.errorCount} errors)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {workflow.lastExecutedAt ? (
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(workflow.lastExecutedAt), 'MMM d, yyyy HH:mm')}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Never</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/pm/${params.slug}/workflows/${workflow.id}` as any)
                          }
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View/Edit
                        </DropdownMenuItem>
                        {workflow.enabled ? (
                          <DropdownMenuItem onClick={() => handlePause(workflow.id)}>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleActivate(workflow.id)}>
                            <Play className="w-4 h-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(workflow.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
