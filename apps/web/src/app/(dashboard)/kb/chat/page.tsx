'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Send } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { useKBAsk, type KBAskSource, type KBChatMessage } from '@/hooks/use-kb-pages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ChatEntry {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: KBAskSource[]
}

interface SessionWithWorkspace {
  workspaceId?: string
  session?: {
    activeWorkspaceId?: string
  }
}

export default function KBChatPage() {
  const { data: session } = useSession()
  const sessionData = session as SessionWithWorkspace | null
  const workspaceId =
    sessionData?.workspaceId ||
    sessionData?.session?.activeWorkspaceId ||
    ''
  const askMutation = useKBAsk(workspaceId)
  const [messages, setMessages] = useState<ChatEntry[]>([])
  const [input, setInput] = useState('')

  const history = useMemo<KBChatMessage[]>(() => {
    return messages.map((message) => ({
      role: message.role,
      content: message.content,
    }))
  }, [messages])

  const handleSend = async () => {
    const question = input.trim()
    if (!question) return

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: question },
    ])
    setInput('')

    try {
      const result = await askMutation.mutateAsync({
        question,
        history: history.slice(-8),
      })

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.answer,
          sources: result.sources,
        },
      ])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to get answer')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/kb">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-lg font-semibold">KB Chat</h1>
                <p className="text-sm text-muted-foreground">Ask questions and get cited answers</p>
              </div>
            </div>
          </div>
          <Badge variant="outline">RAG Q&amp;A</Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              Ask your first question about the knowledge base.
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'rounded-lg border px-4 py-3',
                  message.role === 'user'
                    ? 'ml-auto w-full max-w-xl bg-primary/5'
                    : 'mr-auto w-full max-w-xl bg-muted/30',
                )}
              >
                <div className="text-sm font-medium text-muted-foreground">
                  {message.role === 'user' ? 'You' : 'Scribe'}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                  {message.content}
                </p>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.sources.map((source, index) => (
                      <Badge key={`${source.pageId}-${index}`} variant="outline">
                        <Link href={`/kb/${source.slug}`} className="hover:underline">
                          {source.title}
                        </Link>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t bg-background px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask a question about your KB..."
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                if (!askMutation.isPending) {
                  handleSend()
                }
              }
            }}
            disabled={askMutation.isPending}
          />
          <Button onClick={handleSend} disabled={askMutation.isPending || !input.trim()}>
            <Send className="mr-2 h-4 w-4" />
            {askMutation.isPending ? 'Asking...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  )
}
