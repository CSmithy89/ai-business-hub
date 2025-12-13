'use client'

import { useMemo, useState } from 'react'
import { Loader2, RefreshCw, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useWorkspaceModuleMutations, useWorkspaceModules, type WorkspaceModule, type WorkspaceModuleCategory } from '@/hooks/use-workspace-modules'
import { ModuleConfigDialog } from '@/components/settings/module-config-dialog'

function groupByCategory(
  modules: WorkspaceModule[],
  categories: WorkspaceModuleCategory[]
): Array<{ category: WorkspaceModuleCategory; modules: WorkspaceModule[] }> {
  const byId = new Map<string, WorkspaceModuleCategory>(categories.map((c) => [c.id, c]))
  const grouped = new Map<string, WorkspaceModule[]>()

  for (const mod of modules) {
    const bucket = grouped.get(mod.category) ?? []
    bucket.push(mod)
    grouped.set(mod.category, bucket)
  }

  return Array.from(grouped.entries())
    .map(([categoryId, mods]) => ({
      category: byId.get(categoryId) ?? { id: categoryId as WorkspaceModuleCategory['id'], name: categoryId },
      modules: mods.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.category.name.localeCompare(b.category.name))
}

export function ModuleManagement() {
  const { data, isLoading, error, refetch } = useWorkspaceModules()
  const { updateModule } = useWorkspaceModuleMutations()

  const [configuringModule, setConfiguringModule] = useState<WorkspaceModule | null>(null)
  const [updatingModuleId, setUpdatingModuleId] = useState<string | null>(null)

  const grouped = useMemo(() => {
    if (!data) return []
    return groupByCategory(data.modules, data.categories)
  }, [data])

  const handleToggle = async (module: WorkspaceModule, enabled: boolean) => {
    setUpdatingModuleId(module.id)
    try {
      await updateModule.mutateAsync({ moduleId: module.id, enabled })
      toast.success(enabled ? `${module.name} enabled` : `${module.name} disabled`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update module')
    } finally {
      setUpdatingModuleId(null)
    }
  }

  const handleSaveConfig = async (moduleId: string, config: Record<string, unknown>) => {
    setUpdatingModuleId(moduleId)
    try {
      await updateModule.mutateAsync({ moduleId, config })
    } finally {
      setUpdatingModuleId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Modules</CardTitle>
          <CardDescription>Enable and manage modules for your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-800">
              Failed to load modules: {(error as Error).message}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const modules = data?.modules ?? []

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Workspace Modules</h2>
            <p className="text-sm text-muted-foreground">
              Core modules are always enabled. Optional modules can be toggled per workspace.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={updateModule.isPending}
          >
            {updateModule.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {modules.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No modules available.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {grouped.map(({ category, modules: categoryModules }) => (
              <div key={category.id} className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {category.name}
                  </h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {categoryModules.map((module) => {
                    const isUpdating = updatingModuleId === module.id || updateModule.isPending
                    const canConfigure = !module.isCore

                    return (
                      <Card key={module.id} className="border">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <CardTitle className="text-lg truncate">{module.name}</CardTitle>
                              <CardDescription className="mt-1">
                                {module.description}
                              </CardDescription>
                              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="rounded-full border px-2 py-0.5">
                                  {module.isCore ? 'Core' : 'Optional'}
                                </span>
                                <span className="rounded-full border px-2 py-0.5">
                                  {module.enabled ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Switch
                                checked={module.isCore ? true : module.enabled}
                                disabled={module.isCore || isUpdating}
                                onCheckedChange={(checked) => handleToggle(module, checked)}
                                aria-label={`Toggle ${module.name}`}
                              />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfiguringModule(module)}
                              disabled={!canConfigure || isUpdating}
                            >
                              <Settings2 className="mr-2 h-4 w-4" />
                              Configure
                            </Button>
                            {isUpdating && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Saving…
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {configuringModule && (
        <ModuleConfigDialog
          open={true}
          onOpenChange={(open) => !open && setConfiguringModule(null)}
          module={configuringModule}
          isSaving={updatingModuleId === configuringModule.id || updateModule.isPending}
          onSave={(config) => handleSaveConfig(configuringModule.id, config)}
        />
      )}
    </>
  )
}

