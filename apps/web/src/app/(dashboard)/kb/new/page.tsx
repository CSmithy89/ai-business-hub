'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { useCreateKBPage } from '@/hooks/use-kb-pages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewKBPagePage() {
  const router = useRouter()
  const { data: session } = useSession()
  // Check both possible session paths for workspaceId
  const sessionData = session as any
  const workspaceId =
    sessionData?.workspaceId ||
    sessionData?.session?.activeWorkspaceId ||
    ''
  const createPage = useCreateKBPage(workspaceId)
  const [title, setTitle] = useState('')

  const handleCreate = async () => {
    if (!title.trim()) return

    try {
      const result = await createPage.mutateAsync({
        title: title.trim(),
        content: {
          type: 'doc',
          content: [],
        },
      })

      router.push(`/kb/${result.data.slug}`)
    } catch (error) {
      console.error('Failed to create page:', error)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/kb">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to KB
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Create New Page</h1>
          <p className="text-muted-foreground">
            Give your page a title to get started
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              placeholder="Enter page title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && title.trim() && !createPage.isPending) {
                  handleCreate()
                }
              }}
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreate}
              disabled={!title.trim() || createPage.isPending}
            >
              {createPage.isPending ? 'Creating...' : 'Create Page'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/kb">Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
