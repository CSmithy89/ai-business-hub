export type CsvParseOptions = {
  delimiter?: string
  quote?: string
  trim?: boolean
  maxRows?: number
}

export function parseCsv(text: string, options: CsvParseOptions = {}): string[][] {
  const delimiter = options.delimiter ?? ','
  const quote = options.quote ?? '"'
  const trim = options.trim ?? true
  const maxRows = options.maxRows

  const rows: string[][] = []
  let row: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (char === quote) {
      if (inQuotes && text[i + 1] === quote) {
        current += quote
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === delimiter && !inQuotes) {
      row.push(current)
      current = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i += 1
      }
      row.push(current)
      rows.push(row)
      if (maxRows && rows.length >= maxRows) {
        return trimRows(rows, trim)
      }
      row = []
      current = ''
      continue
    }

    current += char
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current)
    rows.push(row)
  }

  return trimRows(rows, trim)
}

function trimRows(rows: string[][], trim: boolean): string[][] {
  if (!trim) return rows
  return rows.map((row) => row.map((cell) => cell.trim()))
}
