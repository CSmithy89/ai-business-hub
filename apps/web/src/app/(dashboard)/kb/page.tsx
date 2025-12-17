'use client'

import { useSession } from '@/lib/auth-client'
import { KBHome } from '@/components/kb/KBHome'

export default function KBHomePage() {
  const { data: session } = useSession()
  const workspaceId = (session as any)?.workspaceId || ''

  if (!workspaceId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return <KBHome workspaceId={workspaceId} />
}
