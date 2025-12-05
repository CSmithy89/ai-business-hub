'use client'

/**
 * Streaming Cursor Component
 *
 * A blinking cursor indicator shown at the end of streaming text.
 * Uses a pulsing animation to indicate that more content is being generated.
 */
export function StreamingCursor() {
  return (
    <span
      className="inline-block w-[2px] h-4 bg-current animate-pulse ml-0.5 align-middle"
      aria-label="Generating response..."
    />
  )
}
