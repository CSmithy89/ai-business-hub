'use client'

import { useState, useMemo } from 'react'
import { format, subDays } from 'date-fns'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Download, RefreshCw, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useUsageStats, useDailyUsage, useUsageByAgent, DailyUsage, AgentUsage } from '@/hooks/use-token-usage'
import { useAIProviders, PROVIDER_INFO } from '@/hooks/use-ai-providers'

const CHART_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']

/**
 * Maximum rows to export in CSV to prevent browser memory issues.
 * For datasets larger than this, users should use the API directly.
 */
const MAX_CSV_EXPORT_ROWS = 1000

/**
 * Sanitize a value for CSV export to prevent CSV injection attacks.
 * Values starting with =, +, -, @, \t, \r can execute formulas in Excel/Sheets.
 * @see https://owasp.org/www-community/attacks/CSV_Injection
 */
function sanitizeCSVValue(value: string | number): string {
  const stringValue = String(value)
  // Escape quotes by doubling them
  const escaped = stringValue.replace(/"/g, '""')
  // Wrap in quotes to handle commas and special characters
  // Prefix with single quote if value starts with dangerous characters
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r']
  if (dangerousChars.some(char => escaped.startsWith(char))) {
    return `"'${escaped}"`
  }
  return `"${escaped}"`
}

interface DateRange {
  label: string
  days: number
}

const DATE_RANGES: DateRange[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

export function TokenUsageDashboard() {
  const [selectedRange, setSelectedRange] = useState<number>(30)

  // Get date range based on selection
  const dateRange = useMemo(() => {
    const end = new Date()
    const start = subDays(end, selectedRange)
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }
  }, [selectedRange])

  // Fetch data
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useUsageStats(
    dateRange.startDate,
    dateRange.endDate
  )
  const { data: dailyData, isLoading: dailyLoading, refetch: refetchDaily } = useDailyUsage(selectedRange)
  const { data: agentData, isLoading: agentLoading, refetch: refetchAgent } = useUsageByAgent()
  const { data: providersData, isLoading: providersLoading } = useAIProviders()

  const isLoading = statsLoading || dailyLoading || agentLoading || providersLoading

  const stats = statsData?.data

  // Prepare provider usage data for pie chart
  const providerUsageData = useMemo(() => {
    const providers = providersData?.data || []
    return providers.map((p) => ({
      name: PROVIDER_INFO[p.provider]?.name || p.provider,
      value: p.tokensUsedToday,
      provider: p.provider,
    }))
  }, [providersData?.data])

  // Format daily usage for chart
  const formattedDailyUsage = useMemo(() => {
    const dailyUsage = dailyData?.data || []
    return dailyUsage.map((d: DailyUsage) => ({
      ...d,
      date: format(new Date(d.date), 'MMM d'),
      tokens: d.totalTokens,
      cost: d.totalCost,
    }))
  }, [dailyData?.data])

  // Format agent usage for bar chart
  const formattedAgentUsage = useMemo(() => {
    const agentUsage = agentData?.data || []
    return agentUsage.map((a: AgentUsage) => ({
      ...a,
      name: a.agentId.split('-')[0] || 'Unknown',
      tokens: a.totalTokens,
      cost: a.totalCost,
    }))
  }, [agentData?.data])

  // Raw data for export
  const dailyUsage = dailyData?.data || []

  const handleRefresh = () => {
    refetchStats()
    refetchDaily()
    refetchAgent()
  }

  const handleExportCSV = () => {
    if (!dailyUsage.length) return

    // Limit export size to prevent browser memory issues
    const isTruncated = dailyUsage.length > MAX_CSV_EXPORT_ROWS
    const exportData = isTruncated
      ? dailyUsage.slice(0, MAX_CSV_EXPORT_ROWS)
      : dailyUsage

    if (isTruncated) {
      toast.warning(
        `Export limited to ${MAX_CSV_EXPORT_ROWS} of ${dailyUsage.length} rows. Use the API for complete data.`,
        { duration: 5000 }
      )
    }

    const headers = ['Date', 'Total Tokens', 'Estimated Cost ($)', 'Request Count']
    const rows = exportData.map((d: DailyUsage) => [
      sanitizeCSVValue(d.date),
      sanitizeCSVValue(d.totalTokens),
      sanitizeCSVValue(d.totalCost.toFixed(4)),
      sanitizeCSVValue(d.requestCount),
    ])

    // Add truncation notice as first row if data was limited
    const csvRows = isTruncated
      ? [
          `"Note: Export limited to ${MAX_CSV_EXPORT_ROWS} of ${dailyUsage.length} rows. For complete data, use GET /api/workspaces/{workspaceId}/token-usage"`,
          headers.map(h => sanitizeCSVValue(h)).join(','),
          ...rows.map((r) => r.join(','))
        ]
      : [
          headers.map(h => sanitizeCSVValue(h)).join(','),
          ...rows.map((r) => r.join(','))
        ]

    const csv = csvRows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `token-usage-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Token Usage</h2>
          <p className="text-sm text-muted-foreground">
            Monitor your AI token usage and costs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(selectedRange)}
            onValueChange={(value) => setSelectedRange(Number(value))}
          >
            <SelectTrigger className="w-40">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((range) => (
                <SelectItem key={range.days} value={String(range.days)}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={!dailyUsage.length}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tokens</CardDescription>
            <CardTitle className="text-2xl">
              {stats?.totalTokens.toLocaleString() || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Prompt Tokens</CardDescription>
            <CardTitle className="text-2xl">
              {stats?.totalPromptTokens.toLocaleString() || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completion Tokens</CardDescription>
            <CardTitle className="text-2xl">
              {stats?.totalCompletionTokens.toLocaleString() || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Estimated Cost</CardDescription>
            <CardTitle className="text-2xl">
              ${stats?.totalCost.toFixed(2) || '0.00'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Provider Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Provider (Today)</CardTitle>
            <CardDescription>Token distribution across providers</CardDescription>
          </CardHeader>
          <CardContent>
            {providerUsageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={providerUsageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                  >
                    {providerUsageData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                No usage data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Agent</CardTitle>
            <CardDescription>Token consumption by AI agent</CardDescription>
          </CardHeader>
          <CardContent>
            {formattedAgentUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={formattedAgentUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString()}
                  />
                  <Bar dataKey="tokens" fill="#FF6B6B" name="Tokens" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                No agent usage data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Usage Trend</CardTitle>
          <CardDescription>Token usage over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {formattedDailyUsage.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formattedDailyUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'tokens' ? value.toLocaleString() : `$${value.toFixed(4)}`,
                    name === 'tokens' ? 'Tokens' : 'Cost',
                  ]}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="tokens"
                  stroke="#FF6B6B"
                  name="Tokens"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cost"
                  stroke="#4ECDC4"
                  name="Cost ($)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No daily usage data for the selected period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
