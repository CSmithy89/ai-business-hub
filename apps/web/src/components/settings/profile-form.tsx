'use client'

/**
 * Profile Form Component
 * Story 15.6: Implements profile editing with name and avatar
 */

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { authClient } from '@/lib/auth-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AvatarUpload } from './avatar-upload'
import { User, Mail, Link2, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export function ProfileForm() {
  const { data: session, isPending: isSessionLoading } = useSession()
  const [name, setName] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize form with session data
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '')
      setImage(session.user.image || null)
    }
  }, [session?.user])

  // Track changes
  useEffect(() => {
    if (session?.user) {
      const nameChanged = name !== (session.user.name || '')
      const imageChanged = image !== (session.user.image || null)
      setHasChanges(nameChanged || imageChanged)
    }
  }, [name, image, session?.user])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }

  const handleImageChange = (newImage: string | null) => {
    setImage(newImage)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasChanges) return

    // Validate name
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }

    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }

    setIsSaving(true)

    try {
      const updateData: { name?: string; image?: string } = {}

      if (name !== session?.user?.name) {
        updateData.name = name.trim()
      }

      if (image !== session?.user?.image) {
        updateData.image = image || undefined
      }

      const { error } = await authClient.updateUser(updateData)

      if (error) {
        toast.error(error.message || 'Failed to update profile')
        return
      }

      toast.success('Profile updated successfully')
      setHasChanges(false)
    } catch (err) {
      console.error('Profile update error:', err)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (session?.user) {
      setName(session.user.name || '')
      setImage(session.user.image || null)
    }
  }

  if (isSessionLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Please sign in to view your profile settings.
        </CardContent>
      </Card>
    )
  }

  const user = session.user

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and profile picture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <AvatarUpload
              currentImage={image}
              onImageChange={handleImageChange}
              disabled={isSaving}
            />

            <div className="flex-1 space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Enter your name"
                  disabled={isSaving}
                  minLength={2}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  This is the name that will be displayed across the platform.
                </p>
              </div>

              {/* Email Field (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  {user.emailVerified && (
                    <Badge variant="secondary" className="shrink-0">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your email address is used for sign-in and notifications.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-blue-600" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Manage OAuth providers linked to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Linked Accounts</p>
              <p className="text-sm text-muted-foreground">
                Connect or disconnect OAuth providers for easier sign-in
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/settings/linked-accounts">
                Manage
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        {hasChanges && (
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
          >
            Reset Changes
          </Button>
        )}
        <Button
          type="submit"
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
