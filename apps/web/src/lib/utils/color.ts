'use client'

export function stringToHslColor(
  input: string,
  options?: { saturation?: number; lightness?: number },
): string {
  const saturation = options?.saturation ?? 70
  const lightness = options?.lightness ?? 45

  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = Math.abs(hash) % 360
  return `hsl(${hue} ${saturation}% ${lightness}%)`
}

