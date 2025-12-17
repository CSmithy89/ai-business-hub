'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ProjectTypeSchema } from '@hyvve/shared'
import { useSession } from '@/lib/auth-client'
import { useBusinesses } from '@/hooks/use-businesses'
import { useCreatePmProject } from '@/hooks/use-pm-projects'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const TemplateIdSchema = z.enum(['bmad-course', 'kanban-only', 'custom'])

const CreateProjectWizardSchema = z.object({
  businessId: z.string().min(1, 'Business is required'),
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  type: ProjectTypeSchema.optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value').optional(),
  icon: z.string().optional(),
  bmadTemplateId: TemplateIdSchema,
  leadUserId: z.string().min(1, 'Project lead is required'),
})

type CreateProjectWizardValues = z.infer<typeof CreateProjectWizardSchema>

const STEPS = [
  { id: 1, title: 'Basics' },
  { id: 2, title: 'Template' },
  { id: 3, title: 'Team' },
] as const

export function CreateProjectModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const { data: session } = useSession()
  const { data: businesses } = useBusinesses()
  const createProject = useCreatePmProject()

  const defaultLead = useMemo(() => {
    const user = (session as { user?: { id?: string } } | null)?.user
    return user?.id ?? 'me'
  }, [session])

  const [step, setStep] = useState<(typeof STEPS)[number]['id']>(1)

  const {
    control,
    handleSubmit,
    register,
    setValue,
    trigger,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateProjectWizardValues>({
    resolver: zodResolver(CreateProjectWizardSchema),
    defaultValues: {
      businessId: '',
      name: '',
      description: '',
      type: 'CUSTOM',
      color: '#3B82F6',
      icon: 'folder',
      bmadTemplateId: 'bmad-course',
      leadUserId: defaultLead,
    },
    mode: 'onChange',
  })

  useEffect(() => {
    setValue('leadUserId', defaultLead, { shouldValidate: true })
  }, [defaultLead, setValue])

  useEffect(() => {
    if (!open) {
      setStep(1)
      reset({
        businessId: businesses?.[0]?.id ?? '',
        name: '',
        description: '',
        type: 'CUSTOM',
        color: '#3B82F6',
        icon: 'folder',
        bmadTemplateId: 'bmad-course',
        leadUserId: defaultLead,
      })
    }
  }, [businesses, defaultLead, open, reset])

  const activeBusinessId = watch('businessId')

  const canGoNext = async () => {
    if (step === 1) return trigger(['businessId', 'name', 'type', 'color', 'icon'])
    if (step === 2) return trigger(['bmadTemplateId'])
    if (step === 3) return trigger(['leadUserId'])
    return false
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = await createProject.mutateAsync({
      businessId: values.businessId,
      name: values.name,
      description: values.description,
      type: values.type,
      color: values.color,
      icon: values.icon,
      bmadTemplateId: values.bmadTemplateId,
    })

    onOpenChange(false)
    router.push(`/dashboard/pm/${encodeURIComponent(result.data.slug)}`)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Step {step} of {STEPS.length}: {STEPS.find((s) => s.id === step)?.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={[
                'h-2 flex-1 rounded-full',
                s.id <= step ? 'bg-primary' : 'bg-[rgb(var(--color-border-default))]',
              ].join(' ')}
              aria-hidden="true"
            />
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-2 flex flex-col gap-6">
          {step === 1 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="businessId">Business</Label>
                <Controller
                  control={control}
                  name="businessId"
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger id="businessId">
                        <SelectValue placeholder="Select a business" />
                      </SelectTrigger>
                      <SelectContent>
                        {(businesses ?? []).map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.businessId ? (
                  <p className="mt-1 text-xs text-red-600">{errors.businessId.message}</p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} placeholder="e.g., Website Redesign" />
                {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register('description')} placeholder="Optional" />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value || 'CUSTOM'} onValueChange={(value) => field.onChange(value)}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ProjectTypeSchema.options.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <Input id="color" type="color" {...register('color')} />
                {errors.color ? <p className="mt-1 text-xs text-red-600">{errors.color.message}</p> : null}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="icon">Icon</Label>
                <Input id="icon" {...register('icon')} placeholder="e.g., folder" />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4">
              <Label htmlFor="bmadTemplateId">Template</Label>
              <Controller
                control={control}
                name="bmadTemplateId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                    <SelectTrigger id="bmadTemplateId">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bmad-course">BMAD Course (7 BUILD + 3 OPERATE)</SelectItem>
                      <SelectItem value="kanban-only">Kanban Only</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.bmadTemplateId ? (
                <p className="text-xs text-red-600">{errors.bmadTemplateId.message}</p>
              ) : null}

              <div className="rounded-md border border-[rgb(var(--color-border-default))] p-4 text-sm text-[rgb(var(--color-text-secondary))]">
                Templates will auto-generate phases in PM-01.7. For now, the selection is stored on the project.
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4">
              <Label htmlFor="leadUserId">Project Lead</Label>
              <Controller
                control={control}
                name="leadUserId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                    <SelectTrigger id="leadUserId">
                      <SelectValue placeholder="Select a lead" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={defaultLead}>Me</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.leadUserId ? <p className="text-xs text-red-600">{errors.leadUserId.message}</p> : null}

              <div className="rounded-md border border-[rgb(var(--color-border-default))] p-4 text-sm text-[rgb(var(--color-text-secondary))]">
                Team management will be implemented in PM-01.8. This step captures the required project lead selection.
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as any) : s))}
                disabled={step === 1 || createProject.isPending}
              >
                Back
              </Button>

              <div className="flex gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={createProject.isPending}
                >
                  Cancel
                </Button>

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={async () => {
                      const ok = await canGoNext()
                      if (ok) setStep((s) => (s < 3 ? ((s + 1) as any) : s))
                    }}
                    disabled={createProject.isPending || !activeBusinessId}
                  >
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={createProject.isPending}>
                    {createProject.isPending ? 'Creating…' : 'Create Project'}
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

