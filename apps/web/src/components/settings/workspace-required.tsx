import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Route } from 'next'

interface WorkspaceRequiredProps {
  title?: string
  description?: string
  ctaText?: string
  ctaHref?: Route
}

export function WorkspaceRequired({
  title = 'No workspace selected',
  description = 'Create a workspace to manage modules, AI providers, and MCP integrations.',
  ctaText = 'Create Workspace',
  ctaHref = '/settings/workspace' as Route,
}: WorkspaceRequiredProps) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>

          <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">{description}</p>

          <Button asChild>
            <Link href={ctaHref}>{ctaText}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
