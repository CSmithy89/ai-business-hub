'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { usePmProject } from '@/hooks/use-pm-projects'
import { type ProjectTeamMember, useAddPmTeamMember, usePmTeam, useRemovePmTeamMember, useUpdatePmTeamMember } from '@/hooks/use-pm-team'
import { useWorkspaceMembers } from '@/hooks/use-workspace-members'

type MemberDraft = {
  userId: string
  role: string
  hoursPerWeek: number
  productivity: number
  canAssignTasks: boolean
  canApproveAgents: boolean
  canModifyPhases: boolean
}

const ROLES: Array<{ value: string; label: string }> = [
  { value: 'DEVELOPER', label: 'Developer' },
  { value: 'DESIGNER', label: 'Designer' },
  { value: 'QA_ENGINEER', label: 'QA Engineer' },
  { value: 'STAKEHOLDER', label: 'Stakeholder' },
  { value: 'CUSTOM', label: 'Custom' },
]

function getCurrentUserId(session: unknown): string | null {
  const userId = (session as { user?: { id?: string } } | null)?.user?.id
  return userId ?? null
}

function initials(name: string | null | undefined): string {
  const raw = (name || '').trim()
  if (!raw) return '?'
  const parts = raw.split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase()).join('')
}

function toPercent(value: number): string {
  const pct = Math.round(value * 100)
  return `${pct}%`
}

export function ProjectTeamContent() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug

  const { data: session } = useSession()
  const currentUserId = getCurrentUserId(session)

  const { data: projectData, isLoading: projectLoading, error: projectError } = usePmProject(slug)
  const project = projectData?.data

  const projectId = project?.id ?? ''
  const { data: teamData, isLoading: teamLoading, error: teamError } = usePmTeam(projectId)
  const team = teamData?.data

  const { data: workspaceMembers } = useWorkspaceMembers()

  const addMember = useAddPmTeamMember()
  const updateMember = useUpdatePmTeamMember()
  const removeMember = useRemovePmTeamMember()

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectTeamMember | null>(null)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removing, setRemoving] = useState<ProjectTeamMember | null>(null)
  const [reassignToUserId, setReassignToUserId] = useState<string>('')

  const isLead = useMemo(() => {
    if (!team?.leadUserId || !currentUserId) return false
    return team.leadUserId === currentUserId
  }, [currentUserId, team?.leadUserId])

  const activeMembers = team?.members ?? []
  const existingUserIds = new Set(activeMembers.map((m) => m.userId))

  const availableUsers = useMemo(() => {
    return (workspaceMembers ?? [])
      .filter((m) => m.acceptedAt)
      .filter((m) => !existingUserIds.has(m.userId))
      .map((m) => ({ userId: m.userId, label: m.user.name || m.user.email }))
  }, [existingUserIds, workspaceMembers])

  const [draft, setDraft] = useState<MemberDraft>({
    userId: '',
    role: 'DEVELOPER',
    hoursPerWeek: 40,
    productivity: 0.8,
    canAssignTasks: false,
    canApproveAgents: false,
    canModifyPhases: false,
  })

  const resetDraft = () => {
    setDraft({
      userId: '',
      role: 'DEVELOPER',
      hoursPerWeek: 40,
      productivity: 0.8,
      canAssignTasks: false,
      canApproveAgents: false,
      canModifyPhases: false,
    })
  }

  if (!slug) return null

  if (projectLoading || teamLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">Loading team…</p>
        </CardContent>
      </Card>
    )
  }

  if (projectError || !project) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-red-600">{projectError?.message || 'Project not found'}</p>
          <Link href={{ pathname: '/dashboard/pm' }} className="mt-3 inline-block text-sm text-primary hover:underline">
            Back to projects
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (teamError || !team) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-red-600">{teamError?.message || 'Team not found'}</p>
          <Link href={{ pathname: '/dashboard/pm/[slug]', query: { slug } }} className="mt-3 inline-block text-sm text-primary hover:underline">
            Back to overview
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--color-text-primary))]">Team</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">Manage roles, capacity, and permissions.</p>
        </div>
        <Link
          href={{ pathname: '/dashboard/pm/[slug]', query: { slug } }}
          className="text-sm text-primary hover:underline"
        >
          Back to overview
        </Link>
      </div>

      <Card className={cn(!isLead && 'border-amber-300')}>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base">Members</CardTitle>
            <div className="text-sm text-[rgb(var(--color-text-secondary))]">
              Lead: <code>{team.leadUserId}</code>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => {
              resetDraft()
              setAddOpen(true)
            }}
            disabled={addMember.isPending || availableUsers.length === 0}
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add member
            </span>
          </Button>
        </CardHeader>
        <CardContent>
          {activeMembers.length === 0 ? (
            <p className="text-sm text-[rgb(var(--color-text-secondary))]">No team members yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeMembers.map((m) => {
                  const label = m.user?.name || m.user?.email || m.userId
                  const isProjectLead = m.userId === team.leadUserId
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {m.user?.image ? <AvatarImage src={m.user.image} alt={label} /> : null}
                            <AvatarFallback>{initials(m.user?.name || m.user?.email)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-[rgb(var(--color-text-primary))]">{label}</div>
                            <div className="truncate text-xs text-[rgb(var(--color-text-secondary))]">{m.userId}</div>
                          </div>
                          {isProjectLead ? <Badge variant="secondary">Lead</Badge> : null}
                          {m.assignedTaskCount > 0 ? (
                            <Badge variant="outline">{m.assignedTaskCount} tasks</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{m.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{m.hoursPerWeek}h / week</div>
                          <div className="text-xs text-[rgb(var(--color-text-secondary))]">Prod: {toPercent(m.productivity)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {m.canAssignTasks ? <Badge variant="outline">Assign</Badge> : null}
                          {m.canApproveAgents ? <Badge variant="outline">Approve</Badge> : null}
                          {m.canModifyPhases ? <Badge variant="outline">Phases</Badge> : null}
                          {!m.canAssignTasks && !m.canApproveAgents && !m.canModifyPhases ? (
                            <span className="text-xs text-[rgb(var(--color-text-secondary))]">None</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isProjectLead || updateMember.isPending}
                            onClick={() => {
                              setEditing(m)
                              setDraft({
                                userId: m.userId,
                                role: m.role,
                                hoursPerWeek: m.hoursPerWeek,
                                productivity: m.productivity,
                                canAssignTasks: m.canAssignTasks,
                                canApproveAgents: m.canApproveAgents,
                                canModifyPhases: m.canModifyPhases,
                              })
                              setEditOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isProjectLead || removeMember.isPending}
                            onClick={() => {
                              setRemoving(m)
                              setReassignToUserId('')
                              setRemoveOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
            <DialogDescription>Select a workspace member and configure permissions.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div>
              <Label>User</Label>
              <Select value={draft.userId} onValueChange={(value) => setDraft((d) => ({ ...d, userId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.userId} value={u.userId}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Role</Label>
              <Select value={draft.role} onValueChange={(value) => setDraft((d) => ({ ...d, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="hoursPerWeek">Hours / week</Label>
                <Input
                  id="hoursPerWeek"
                  type="number"
                  min={0}
                  max={168}
                  value={draft.hoursPerWeek}
                  onChange={(e) => setDraft((d) => ({ ...d, hoursPerWeek: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="productivity">Productivity (0–1)</Label>
                <Input
                  id="productivity"
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={draft.productivity}
                  onChange={(e) => setDraft((d) => ({ ...d, productivity: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center justify-between rounded-md border border-[rgb(var(--color-border-default))] px-3 py-2">
                <span className="text-sm text-[rgb(var(--color-text-secondary))]">Assign tasks</span>
                <Switch checked={draft.canAssignTasks} onCheckedChange={(v) => setDraft((d) => ({ ...d, canAssignTasks: v }))} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-[rgb(var(--color-border-default))] px-3 py-2">
                <span className="text-sm text-[rgb(var(--color-text-secondary))]">Approve agents</span>
                <Switch checked={draft.canApproveAgents} onCheckedChange={(v) => setDraft((d) => ({ ...d, canApproveAgents: v }))} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-[rgb(var(--color-border-default))] px-3 py-2">
                <span className="text-sm text-[rgb(var(--color-text-secondary))]">Modify phases</span>
                <Switch checked={draft.canModifyPhases} onCheckedChange={(v) => setDraft((d) => ({ ...d, canModifyPhases: v }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!draft.userId || addMember.isPending}
              onClick={async () => {
                await addMember.mutateAsync({
                  projectId,
                  data: {
                    userId: draft.userId,
                    role: draft.role,
                    hoursPerWeek: draft.hoursPerWeek,
                    productivity: draft.productivity,
                    canAssignTasks: draft.canAssignTasks,
                    canApproveAgents: draft.canApproveAgents,
                    canModifyPhases: draft.canModifyPhases,
                  },
                })
                setAddOpen(false)
              }}
            >
              Add member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit member</DialogTitle>
            <DialogDescription>Update role, capacity, and permissions.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div>
              <Label>User</Label>
              <Input value={draft.userId} readOnly />
            </div>

            <div>
              <Label>Role</Label>
              <Select value={draft.role} onValueChange={(value) => setDraft((d) => ({ ...d, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="editHoursPerWeek">Hours / week</Label>
                <Input
                  id="editHoursPerWeek"
                  type="number"
                  min={0}
                  max={168}
                  value={draft.hoursPerWeek}
                  onChange={(e) => setDraft((d) => ({ ...d, hoursPerWeek: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="editProductivity">Productivity (0–1)</Label>
                <Input
                  id="editProductivity"
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={draft.productivity}
                  onChange={(e) => setDraft((d) => ({ ...d, productivity: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center justify-between rounded-md border border-[rgb(var(--color-border-default))] px-3 py-2">
                <span className="text-sm text-[rgb(var(--color-text-secondary))]">Assign tasks</span>
                <Switch checked={draft.canAssignTasks} onCheckedChange={(v) => setDraft((d) => ({ ...d, canAssignTasks: v }))} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-[rgb(var(--color-border-default))] px-3 py-2">
                <span className="text-sm text-[rgb(var(--color-text-secondary))]">Approve agents</span>
                <Switch checked={draft.canApproveAgents} onCheckedChange={(v) => setDraft((d) => ({ ...d, canApproveAgents: v }))} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-[rgb(var(--color-border-default))] px-3 py-2">
                <span className="text-sm text-[rgb(var(--color-text-secondary))]">Modify phases</span>
                <Switch checked={draft.canModifyPhases} onCheckedChange={(v) => setDraft((d) => ({ ...d, canModifyPhases: v }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!editing || updateMember.isPending}
              onClick={async () => {
                if (!editing) return
                await updateMember.mutateAsync({
                  teamMemberId: editing.id,
                  data: {
                    role: draft.role,
                    hoursPerWeek: draft.hoursPerWeek,
                    productivity: draft.productivity,
                    canAssignTasks: draft.canAssignTasks,
                    canApproveAgents: draft.canApproveAgents,
                    canModifyPhases: draft.canModifyPhases,
                  },
                })
                setEditOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
            <DialogDescription>Deactivate this member from the project team.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="text-sm">
              Member: <code>{removing?.userId}</code>
            </div>
            {(removing?.assignedTaskCount ?? 0) > 0 ? (
              <div className="grid gap-2">
                <Label>Reassign tasks to</Label>
                <Select value={reassignToUserId} onValueChange={setReassignToUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teammate" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeMembers
                      .filter((m) => m.userId !== removing?.userId)
                      .map((m) => (
                        <SelectItem key={m.userId} value={m.userId}>
                          {m.user?.name || m.user?.email || m.userId}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                  This member has assigned tasks. Reassignment is required.
                </p>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoveOpen(false)}>
              Cancel
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={!removing || removeMember.isPending}>
                  Remove
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm removal</AlertDialogTitle>
                  <AlertDialogDescription>
                    This deactivates the member in the project team.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      if (!removing) return
                      const needsReassign = (removing.assignedTaskCount ?? 0) > 0
                      await removeMember.mutateAsync({
                        teamMemberId: removing.id,
                        reassignToUserId: needsReassign ? reassignToUserId : undefined,
                      })
                      setRemoveOpen(false)
                    }}
                    disabled={(removing?.assignedTaskCount ?? 0) > 0 && !reassignToUserId}
                  >
                    Remove member
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

