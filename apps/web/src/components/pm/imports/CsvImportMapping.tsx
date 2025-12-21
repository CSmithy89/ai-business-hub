'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type CsvFieldConfig = {
  key: string
  label: string
  required?: boolean
  description?: string
}

interface CsvImportMappingProps {
  headers: string[]
  fields: CsvFieldConfig[]
  mapping: Record<string, string>
  onChange: (next: Record<string, string>) => void
}

export function CsvImportMapping({ headers, fields, mapping, onChange }: CsvImportMappingProps) {
  const options = headers.length ? headers : []

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const value = mapping[field.key] || ''
        return (
          <div key={field.key} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">{field.label}</span>
                {field.required ? (
                  <span className="text-xs uppercase text-rose-600">Required</span>
                ) : null}
              </div>
              {field.description ? (
                <p className="text-xs text-[rgb(var(--color-text-secondary))]">{field.description}</p>
              ) : null}
            </div>
            <Select
              value={value}
              onValueChange={(next) =>
                onChange({
                  ...mapping,
                  [field.key]: next === '__none__' ? '' : next,
                })
              }
            >
              <SelectTrigger
                className={cn(
                  'w-full sm:w-[240px]',
                  field.required && !value ? 'border-rose-300 text-rose-700' : undefined,
                )}
              >
                <SelectValue placeholder={options.length ? 'Select column' : 'Upload a CSV first'} />
              </SelectTrigger>
              <SelectContent>
                {!field.required ? <SelectItem value="__none__">Not mapped</SelectItem> : null}
                {options.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      })}
    </div>
  )
}
