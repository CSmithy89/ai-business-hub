'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, Search, RefreshCw, FileText, HelpCircle } from 'lucide-react'
import { useGapAnalysis } from '@/hooks/use-gap-analysis'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export function GapAnalysisDashboard() {
  const [hasRun, setHasRun] = useState(false)
  const { data, isLoading, error, refetch } = useGapAnalysis({ enabled: false })

  const handleRun = async () => {
    setHasRun(true)
    try {
      const result = await refetch()
      if (result.error) {
        toast.error(
          result.error instanceof Error ? result.error.message : 'Failed to run analysis',
        )
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to run analysis')
    }
  }

  useEffect(() => {
    if (error instanceof Error && error.message.includes('Admin access')) {
      toast.error('You need admin permissions to access this page.')
    }
  }, [error])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gap Analysis</h1>
          <p className="text-sm text-muted-foreground">
            Identify missing topics, frequent questions, and outdated pages.
          </p>
        </div>
        <Button onClick={handleRun} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Run Analysis
            </>
          )}
        </Button>
      </div>

      {!hasRun && !isLoading && !data && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to scan your KB</CardTitle>
            <CardDescription>
              Run the analysis to surface documentation gaps from recent tasks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              Analysis is limited to recent tasks and existing page titles.
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="grid gap-6">
          {data.missingTopics.length === 0 &&
            data.frequentQuestions.length === 0 &&
            data.outdatedPages.length === 0 &&
            data.suggestions.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>No gaps detected</CardTitle>
                  <CardDescription>
                    Recent tasks and KB pages look well covered. Check back after new work lands.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>
                Last run {formatDistanceToNow(new Date(data.generatedAt), { addSuffix: true })}
                {' '}from the last {data.taskWindowDays} days of tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 text-sm">
              <Badge variant="secondary">
                Missing topics: {data.missingTopics.length}
              </Badge>
              <Badge variant="secondary">
                Frequent questions: {data.frequentQuestions.length}
              </Badge>
              <Badge variant="secondary">
                Outdated pages: {data.outdatedPages.length}
              </Badge>
              <Badge variant="outline">
                Suggestions: {data.suggestions.length}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Missing Topics</CardTitle>
              <CardDescription>
                Topics mentioned in tasks that do not match existing KB titles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.missingTopics.length === 0 ? (
                <p className="text-sm text-muted-foreground">No missing topics detected.</p>
              ) : (
                <ul className="space-y-3">
                  {data.missingTopics.map((topic) => (
                    <li key={topic.topic} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{topic.topic}</span>
                        <Badge variant="outline">{topic.count} tasks</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Sample tasks: {topic.sampleTasks.map((task) => task.title).join(', ')}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frequent Questions</CardTitle>
              <CardDescription>
                Common questions that do not map to existing pages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.frequentQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No unanswered questions detected.</p>
              ) : (
                <ul className="space-y-3">
                  {data.frequentQuestions.map((question) => (
                    <li key={question.question} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{question.question}</span>
                        <Badge variant="outline">{question.count} tasks</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Sample tasks: {question.sampleTasks.map((task) => task.title).join(', ')}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outdated Pages</CardTitle>
              <CardDescription>
                Pages flagged as stale or needing verification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.outdatedPages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No outdated pages detected.</p>
              ) : (
                <ul className="space-y-3">
                  {data.outdatedPages.map((page) => (
                    <li key={page.id} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <Link href={`/kb/${page.slug}` as any} className="font-medium hover:underline">
                          {page.title}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Reasons: {page.reasons.join(', ')}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suggested Pages</CardTitle>
              <CardDescription>
                Suggested new pages based on gaps and questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.suggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No suggestions yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.suggestions.map((suggestion) => (
                    <li key={`${suggestion.source}-${suggestion.title}`} className="flex items-center gap-2">
                      <Badge variant="secondary">{suggestion.source}</Badge>
                      <span className="font-medium">{suggestion.title}</span>
                      <span className="text-xs text-muted-foreground">{suggestion.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
