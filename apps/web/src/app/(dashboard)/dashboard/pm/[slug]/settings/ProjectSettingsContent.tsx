'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { useCreatePmExpense, usePmExpenses } from '@/hooks/use-pm-expenses'
import { useCreatePmPhase, useUpdatePmPhase } from '@/hooks/use-pm-phases'
import { useDeletePmProject, usePmProject, useUpdatePmProject } from '@/hooks/use-pm-projects'

const GeneralSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  autoApprovalThreshold: z.number().min(0).max(1),
  suggestionMode: z.boolean(),
})

type GeneralValues = z.infer<typeof GeneralSchema>

function getCurrentUserId(session: unknown): string | null {
  const userId = (session as { user?: { id?: string } } | null)?.user?.id
  return userId ?? null
}

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseMoney(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function maybeToastBudgetAlerts(budget: number, spend: number) {
  if (!Number.isFinite(budget) || budget <= 0) return
  if (!Number.isFinite(spend) || spend < 0) return

  const percent = (spend / budget) * 100
  if (percent >= 100) {
    toast.error('Budget exceeded (100%)')
    return
  }
  if (percent >= 90) {
    toast.warning('Budget alert: 90% reached', { duration: 5000 })
    return
  }
  if (percent >= 75) {
    toast.warning('Budget alert: 75% reached', { duration: 5000 })
  }
}

export function ProjectSettingsContent() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = params?.slug

  const { data: session } = useSession()
  const currentUserId = getCurrentUserId(session)

  const { data, isLoading, error } = usePmProject(slug)
  const project = data?.data

  const updateProject = useUpdatePmProject()
  const deleteProject = useDeletePmProject()
  const createPhase = useCreatePmPhase()
  const updatePhase = useUpdatePmPhase()
  const expensesQuery = usePmExpenses(project?.id ?? '')
  const createExpense = useCreatePmExpense()

  const isLead = useMemo(() => {
    if (!project?.team?.leadUserId || !currentUserId) return false
    return project.team.leadUserId === currentUserId
  }, [currentUserId, project?.team?.leadUserId])

  const canEdit = isLead || !project?.team?.leadUserId

  const {
    register,
    setValue,
    formState: { errors },
    watch,
    reset,
  } = useForm<GeneralValues>({
    resolver: zodResolver(GeneralSchema as unknown as Parameters<typeof zodResolver>[0]) as unknown as Resolver<GeneralValues>,
    defaultValues: {
      name: '',
      description: '',
      startDate: '',
      targetDate: '',
      autoApprovalThreshold: 0.85,
      suggestionMode: true,
    },
    mode: 'onChange',
  })

  useEffect(() => {
    if (!project) return
    reset({
      name: project.name,
      description: project.description ?? '',
      startDate: toDateInputValue(project.startDate),
      targetDate: toDateInputValue(project.targetDate),
      autoApprovalThreshold: Number(project.autoApprovalThreshold ?? 0.85),
      suggestionMode: Boolean(project.suggestionMode),
    })
  }, [project, reset])

  const watchedThreshold = watch('autoApprovalThreshold')

  const saveField = async (field: keyof GeneralValues) => {
    if (!project) return
    const values = watch()

    const payload: Record<string, unknown> = {}
    if (field === 'name') payload.name = values.name
    if (field === 'description') payload.description = values.description || null
    if (field === 'startDate') payload.startDate = values.startDate ? new Date(values.startDate).toISOString() : null
    if (field === 'targetDate') payload.targetDate = values.targetDate ? new Date(values.targetDate).toISOString() : null
    if (field === 'autoApprovalThreshold') payload.autoApprovalThreshold = values.autoApprovalThreshold
    if (field === 'suggestionMode') payload.suggestionMode = values.suggestionMode

    await updateProject.mutateAsync({ projectId: project.id, data: payload })
  }

  const archiveProject = async () => {
    if (!project) return
    await updateProject.mutateAsync({ projectId: project.id, data: { status: 'ARCHIVED' } })
  }

  const onDelete = async () => {
    if (!project) return
    await deleteProject.mutateAsync({ projectId: project.id })
    router.push('/dashboard/pm')
    router.refresh()
  }

  const phases = project?.phases ?? []

  const nextPhaseNumber = phases.length ? Math.max(...phases.map((p) => p.phaseNumber)) + 1 : 1
  const [newPhaseName, setNewPhaseName] = useState('')
  const [newPhaseNumber, setNewPhaseNumber] = useState<number>(nextPhaseNumber)

  useEffect(() => {
    setNewPhaseNumber(nextPhaseNumber)
  }, [nextPhaseNumber])

  const canShowGate = Boolean(project?.team?.leadUserId) && Boolean(currentUserId) && !isLead
  const budgetValue = parseMoney(project?.budget) ?? 0
  const spendValue = parseMoney(project?.actualSpend) ?? 0
  const budgetEnabled = project?.budget !== null && project?.budget !== undefined

  const [budgetInput, setBudgetInput] = useState<string>(budgetEnabled ? String(budgetValue) : '')
  const [expenseAmount, setExpenseAmount] = useState<string>('')
  const [expenseDescription, setExpenseDescription] = useState<string>('')
  const [expenseDate, setExpenseDate] = useState<string>('')

  const expenses = expensesQuery.data?.data ?? []

  useEffect(() => {
    setBudgetInput(budgetEnabled ? String(budgetValue) : '')
  }, [budgetEnabled, budgetValue])

  if (!slug) return null

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">Loading settings…</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !project) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-red-600">{error?.message || 'Project not found'}</p>
          <Link href={{ pathname: '/dashboard/pm' }} className="mt-3 inline-block text-sm text-primary hover:underline">
            Back to projects
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--color-text-primary))]">Settings</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">
            Configure general settings, automation, phases, and more.
          </p>
        </div>
        <Link
          href={`/dashboard/pm/${slug}`}
          className="text-sm text-primary hover:underline"
        >
          Back to overview
        </Link>
      </div>

      {canShowGate ? (
        <Card className="border-amber-300">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <div className="text-sm font-medium text-[rgb(var(--color-text-primary))]">Restricted</div>
                <div className="text-sm text-[rgb(var(--color-text-secondary))]">
                  Only the project lead (or workspace admins) can edit settings for this project.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className={cn('grid gap-4 sm:grid-cols-2', !canEdit && 'opacity-60')}>
          <div className="sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              disabled={!canEdit || updateProject.isPending}
              {...register('name')}
              onBlur={() => saveField('name')}
            />
            {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              disabled={!canEdit || updateProject.isPending}
              {...register('description')}
              onBlur={() => saveField('description')}
            />
          </div>

          <div>
            <Label htmlFor="startDate">Start date</Label>
            <Input
              id="startDate"
              type="date"
              disabled={!canEdit || updateProject.isPending}
              {...register('startDate')}
              onBlur={() => saveField('startDate')}
            />
          </div>

          <div>
            <Label htmlFor="targetDate">Target date</Label>
            <Input
              id="targetDate"
              type="date"
              disabled={!canEdit || updateProject.isPending}
              {...register('targetDate')}
              onBlur={() => saveField('targetDate')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Automation</CardTitle>
        </CardHeader>
        <CardContent className={cn('grid gap-4 sm:grid-cols-2', !canEdit && 'opacity-60')}>
          <div>
            <Label htmlFor="autoApprovalThreshold">Auto-approval threshold</Label>
            <Input
              id="autoApprovalThreshold"
              type="number"
              min={0}
              max={1}
              step={0.01}
              disabled={!canEdit || updateProject.isPending}
              value={Number.isFinite(watchedThreshold) ? watchedThreshold : 0.85}
              onChange={(e) => setValue('autoApprovalThreshold', Number(e.target.value), { shouldValidate: true })}
              onBlur={() => saveField('autoApprovalThreshold')}
            />
            <p className="mt-1 text-xs text-[rgb(var(--color-text-secondary))]">
              Confidence ≥ threshold can be auto-approved.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Suggestion mode</Label>
            <div className="flex items-center justify-between rounded-md border border-[rgb(var(--color-border-default))] px-3 py-2">
              <span className="text-sm text-[rgb(var(--color-text-secondary))]">
                Enable AI suggestions for tasks and workflows
              </span>
              <Switch
                disabled={!canEdit || updateProject.isPending}
                checked={watch('suggestionMode')}
                onCheckedChange={(checked) => {
                  setValue('suggestionMode', checked, { shouldValidate: true })
                  void saveField('suggestionMode')
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Budget</CardTitle>
        </CardHeader>
        <CardContent className={cn('flex flex-col gap-4', !canEdit && 'opacity-60')}>
          <div className="flex items-center justify-between rounded-md border border-[rgb(var(--color-border-default))] px-3 py-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">Enable budget tracking</span>
              <span className="text-xs text-[rgb(var(--color-text-secondary))]">Track spent vs remaining.</span>
            </div>
            <Switch
              disabled={!canEdit || updateProject.isPending}
              checked={budgetEnabled}
              onCheckedChange={async (checked) => {
                if (!project) return
                if (!checked) {
                  setBudgetInput('')
                  await updateProject.mutateAsync({ projectId: project.id, data: { budget: null } })
                  return
                }
                const next = budgetValue > 0 ? budgetValue : 1000
                setBudgetInput(String(next))
                await updateProject.mutateAsync({ projectId: project.id, data: { budget: next } })
                maybeToastBudgetAlerts(next, spendValue)
              }}
            />
          </div>

          {budgetEnabled ? (
            <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
              <div>
                <Label htmlFor="budget">Budget (USD)</Label>
                <Input
                  id="budget"
                  type="number"
                  min={0}
                  step={0.01}
                  disabled={!canEdit || updateProject.isPending}
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  onBlur={async () => {
                    if (!project) return
                    const next = budgetInput.trim() === '' ? null : Number(budgetInput)
                    await updateProject.mutateAsync({ projectId: project.id, data: { budget: next } })
                    if (next !== null) maybeToastBudgetAlerts(next, spendValue)
                  }}
                />
              </div>

              <div>
                <Label>Spent</Label>
                <Input value={formatMoney(spendValue)} readOnly />
              </div>

              <div>
                <Label>Remaining</Label>
                <Input value={formatMoney(Math.max(0, budgetValue - spendValue))} readOnly />
              </div>
            </div>
          ) : null}

          {budgetEnabled ? (
            <div className="rounded-md border border-[rgb(var(--color-border-default))] p-4">
              <div className="grid gap-2 sm:grid-cols-3 sm:items-end">
                <div>
                  <Label htmlFor="expenseAmount">Log expense</Label>
                  <Input
                    id="expenseAmount"
                    type="number"
                    min={0}
                    step={0.01}
                    disabled={!canEdit || createExpense.isPending}
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="Amount"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="expenseDescription">Description</Label>
                  <Input
                    id="expenseDescription"
                    disabled={!canEdit || createExpense.isPending}
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="expenseDate">Date</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    disabled={!canEdit || createExpense.isPending}
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-1">
                  <Button
                    type="button"
                    disabled={!canEdit || createExpense.isPending || Number(expenseAmount) <= 0}
                    onClick={async () => {
                      if (!project) return
                      const amount = Number(expenseAmount)
                      await createExpense.mutateAsync({
                        projectId: project.id,
                        data: {
                          amount,
                          description: expenseDescription || undefined,
                          spentAt: expenseDate || undefined,
                        },
                      })
                      setExpenseAmount('')
                      setExpenseDescription('')
                      setExpenseDate('')
                      maybeToastBudgetAlerts(budgetValue, spendValue + amount)
                    }}
                  >
                    Add expense
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium text-[rgb(var(--color-text-primary))]">Recent expenses</div>
                {expensesQuery.isLoading ? (
                  <p className="mt-2 text-sm text-[rgb(var(--color-text-secondary))]">Loading…</p>
                ) : expenses.length === 0 ? (
                  <p className="mt-2 text-sm text-[rgb(var(--color-text-secondary))]">No expenses logged yet.</p>
                ) : (
                  <div className="mt-2 flex flex-col gap-2">
                    {expenses.slice(0, 5).map((e) => (
                      <div key={e.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--color-border-default))] px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm text-[rgb(var(--color-text-primary))]">
                            {e.description || 'Expense'}
                          </div>
                          <div className="text-xs text-[rgb(var(--color-text-secondary))]">
                            {new Date(e.spentAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">
                          {formatMoney(parseMoney(e.amount) ?? 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Phases</CardTitle>
        </CardHeader>
        <CardContent className={cn('flex flex-col gap-4', !canEdit && 'opacity-60')}>
          <div className="rounded-md border border-[rgb(var(--color-border-default))] p-4">
            <div className="grid gap-2 sm:grid-cols-3 sm:items-end">
              <div className="sm:col-span-2">
                <Label htmlFor="newPhaseName">Add phase</Label>
                <Input
                  id="newPhaseName"
                  disabled={!canEdit || createPhase.isPending}
                  value={newPhaseName}
                  onChange={(e) => setNewPhaseName(e.target.value)}
                  placeholder="e.g., Backlog"
                />
              </div>
              <div>
                <Label htmlFor="newPhaseNumber">Number</Label>
                <Input
                  id="newPhaseNumber"
                  type="number"
                  min={1}
                  disabled={!canEdit || createPhase.isPending}
                  value={newPhaseNumber}
                  onChange={(e) => setNewPhaseNumber(Number(e.target.value))}
                />
              </div>
              <div className="sm:col-span-3">
                <Button
                  type="button"
                  disabled={!canEdit || createPhase.isPending || !newPhaseName.trim()}
                  onClick={async () => {
                    await createPhase.mutateAsync({
                      projectId: project.id,
                      data: { name: newPhaseName.trim(), phaseNumber: newPhaseNumber },
                    })
                    setNewPhaseName('')
                    router.refresh()
                  }}
                >
                  Add phase
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {phases
              .slice()
              .sort((a, b) => a.phaseNumber - b.phaseNumber)
              .map((phase, idx, sorted) => (
                <div
                  key={phase.id}
                  className="rounded-md border border-[rgb(var(--color-border-default))] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="grid flex-1 gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <Label htmlFor={`phase-${phase.id}-name`}>Name</Label>
                        <Input
                          id={`phase-${phase.id}-name`}
                          defaultValue={phase.name}
                          disabled={!canEdit || updatePhase.isPending}
                          onBlur={(e) => updatePhase.mutate({ phaseId: phase.id, data: { name: e.target.value } })}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`phase-${phase.id}-number`}>Number</Label>
                        <Input
                          id={`phase-${phase.id}-number`}
                          type="number"
                          min={1}
                          defaultValue={phase.phaseNumber}
                          disabled={!canEdit || updatePhase.isPending}
                          onBlur={(e) => updatePhase.mutate({ phaseId: phase.id, data: { phaseNumber: Number(e.target.value) } })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{phase.status}</Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canEdit || idx === 0}
                        onClick={() => {
                          const prev = sorted[idx - 1]
                          updatePhase.mutate({ phaseId: phase.id, data: { phaseNumber: prev.phaseNumber } })
                          updatePhase.mutate({ phaseId: prev.id, data: { phaseNumber: phase.phaseNumber } })
                        }}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canEdit || idx === sorted.length - 1}
                        onClick={() => {
                          const next = sorted[idx + 1]
                          updatePhase.mutate({ phaseId: phase.id, data: { phaseNumber: next.phaseNumber } })
                          updatePhase.mutate({ phaseId: next.id, data: { phaseNumber: phase.phaseNumber } })
                        }}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium text-[rgb(var(--color-text-primary))]">Archive project</div>
              <div className="text-sm text-[rgb(var(--color-text-secondary))]">
                Sets status to <code>ARCHIVED</code>.
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!canEdit || updateProject.isPending}
              onClick={archiveProject}
            >
              Archive
            </Button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium text-[rgb(var(--color-text-primary))]">Delete project</div>
              <div className="text-sm text-[rgb(var(--color-text-secondary))]">
                Soft-deletes the project (sets <code>deletedAt</code>).
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={!canEdit || deleteProject.isPending}>
                  <span className="inline-flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will soft-delete the project. You can restore it later by clearing <code>deletedAt</code> in the database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
