'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/**
 * Common IANA timezones for the timezone selector
 */
const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'America/Anchorage', label: 'Alaska Time (US)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (US)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
]

interface QuietHoursTimePickerProps {
  startTime: string | null
  endTime: string | null
  timezone: string
  onStartTimeChange: (time: string | null) => void
  onEndTimeChange: (time: string | null) => void
  onTimezoneChange: (timezone: string) => void
  disabled?: boolean
}

export function QuietHoursTimePicker({
  startTime,
  endTime,
  timezone,
  onStartTimeChange,
  onEndTimeChange,
  onTimezoneChange,
  disabled = false,
}: QuietHoursTimePickerProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Start Time */}
        <div className="space-y-2">
          <Label htmlFor="quiet-hours-start">Start Time</Label>
          <Input
            id="quiet-hours-start"
            type="time"
            value={startTime || ''}
            onChange={(e) => onStartTimeChange(e.target.value || null)}
            disabled={disabled}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            When do quiet hours begin?
          </p>
        </div>

        {/* End Time */}
        <div className="space-y-2">
          <Label htmlFor="quiet-hours-end">End Time</Label>
          <Input
            id="quiet-hours-end"
            type="time"
            value={endTime || ''}
            onChange={(e) => onEndTimeChange(e.target.value || null)}
            disabled={disabled}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            When do quiet hours end?
          </p>
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <Label htmlFor="quiet-hours-timezone">Timezone</Label>
        <Select
          value={timezone}
          onValueChange={onTimezoneChange}
          disabled={disabled}
        >
          <SelectTrigger id="quiet-hours-timezone">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {COMMON_TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Quiet hours times are based on this timezone
        </p>
      </div>

      {/* Visual indicator for overnight ranges */}
      {startTime && endTime && startTime > endTime && (
        <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          <p>
            <strong>Overnight quiet hours:</strong> {startTime} to {endTime} (next day)
          </p>
          <p className="text-xs mt-1">
            Notifications will be suppressed from {startTime} until {endTime} the following morning.
          </p>
        </div>
      )}
    </div>
  )
}
