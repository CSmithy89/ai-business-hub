'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { useCreateKBPage, useKBTemplates } from '@/hooks/use-kb-pages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
  const { data: templatesData, isLoading: templatesLoading } = useKBTemplates(workspaceId)
  const [title, setTitle] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('blank')

  const emptyTemplate = {
    id: 'blank',
    title: 'Blank Page',
    description: 'Start from scratch with an empty page.',
    category: 'Blank',
    content: {
      type: 'doc',
      content: [],
    },
    isBuiltIn: true,
  }

  const templates = [emptyTemplate, ...(templatesData?.data ?? [])]
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? emptyTemplate

  const handleCreate = async () => {
    if (!title.trim()) return

    try {
      const result = await createPage.mutateAsync({
        title: title.trim(),
        content: selectedTemplate.content,
      })

      router.push(`/kb/${result.data.slug}` as any)
    } catch (error) {
      console.error('Failed to create page:', error)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={'/kb' as any}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to KB
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Create New Page</h1>
          <p className="text-muted-foreground">
            Choose a template and give your page a title to get started
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Template</Label>
            {templatesLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      'cursor-pointer transition-colors',
                      selectedTemplateId === template.id
                        ? 'border-primary ring-1 ring-primary/30'
                        : 'hover:border-muted-foreground/40'
                    )}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{template.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {template.description || template.category}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      {template.isBuiltIn ? 'Built-in template' : 'Custom template'}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

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
              <Link href={'/kb' as any}>Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
