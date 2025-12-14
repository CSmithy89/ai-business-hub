import { z } from 'zod'

const DANGEROUS_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export interface SafeStringMapOptions {
  maxEntries?: number
  maxKeyLength?: number
  maxValueLength?: number
  maxTotalChars?: number
}

const DEFAULT_OPTIONS: Required<SafeStringMapOptions> = {
  maxEntries: 50,
  maxKeyLength: 100,
  maxValueLength: 2000,
  maxTotalChars: 20000,
}

export function safeStringMap(
  label: string,
  options: SafeStringMapOptions = {}
): z.ZodType<Record<string, string>> {
  const config = { ...DEFAULT_OPTIONS, ...options }

  return z.record(z.string(), z.string()).superRefine((value, ctx) => {
    const entries = Object.entries(value)

    if (entries.length > config.maxEntries) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} must have at most ${config.maxEntries} entries`,
      })
      return
    }

    let totalChars = 0
    for (const [key, val] of entries) {
      if (DANGEROUS_OBJECT_KEYS.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} contains forbidden key: ${key}`,
        })
        return
      }

      if (key.length > config.maxKeyLength) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} keys must be ≤ ${config.maxKeyLength} characters (bad key: ${key})`,
        })
        return
      }

      if (val.length > config.maxValueLength) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} values must be ≤ ${config.maxValueLength} characters (key: ${key})`,
        })
        return
      }

      totalChars += key.length + val.length
      if (totalChars > config.maxTotalChars) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} is too large`,
        })
        return
      }
    }
  })
}

