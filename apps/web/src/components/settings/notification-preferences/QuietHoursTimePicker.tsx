'use client'

import { useState, useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/**
 * HH:MM time format regex (24-hour format)
 * Ensures valid hours (00-23) and minutes (00-59)
 */
const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

/**
 * Validate time string is in HH:MM 24-hour format
 */
function isValidTimeFormat(time: string | null): boolean {
  if (!time) return true // null/empty is valid (no quiet hours)
  return TIME_FORMAT_REGEX.test(time)
}

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
  // Track validation errors for manual text input fallback
  const [startTimeError, setStartTimeError] = useState<string | null>(null)
  const [endTimeError, setEndTimeError] = useState<string | null>(null)

  // Validate and update start time
  const handleStartTimeChange = useCallback((value: string) => {
    const timeValue = value || null

    if (timeValue && !isValidTimeFormat(timeValue)) {
      setStartTimeError('Must be in HH:MM format (e.g., 22:00)')
    } else {
      setStartTimeError(null)
      onStartTimeChange(timeValue)
    }
  }, [onStartTimeChange])

  // Validate and update end time
  const handleEndTimeChange = useCallback((value: string) => {
    const timeValue = value || null

    if (timeValue && !isValidTimeFormat(timeValue)) {
      setEndTimeError('Must be in HH:MM format (e.g., 08:00)')
    } else {
      setEndTimeError(null)
      onEndTimeChange(timeValue)
    }
  }, [onEndTimeChange])

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
            onChange={(e) => handleStartTimeChange(e.target.value)}
            disabled={disabled}
            className={startTimeError ? 'border-destructive' : ''}
            pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
            aria-invalid={!!startTimeError}
            aria-describedby={startTimeError ? 'start-time-error' : undefined}
          />
          {startTimeError ? (
            <p id="start-time-error" className="text-xs text-destructive">
              {startTimeError}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              When do quiet hours begin?
            </p>
          )}
        </div>

        {/* End Time */}
        <div className="space-y-2">
          <Label htmlFor="quiet-hours-end">End Time</Label>
          <Input
            id="quiet-hours-end"
            type="time"
            value={endTime || ''}
            onChange={(e) => handleEndTimeChange(e.target.value)}
            disabled={disabled}
            className={endTimeError ? 'border-destructive' : ''}
            pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
            aria-invalid={!!endTimeError}
            aria-describedby={endTimeError ? 'end-time-error' : undefined}
          />
          {endTimeError ? (
            <p id="end-time-error" className="text-xs text-destructive">
              {endTimeError}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              When do quiet hours end?
            </p>
          )}
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
