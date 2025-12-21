import type { TiptapDocument, TiptapNode } from '@hyvve/shared'

const HEADING_RE = /^(#{1,4})\s+(.*)$/
const BULLET_RE = /^[-*]\s+/
const ORDERED_RE = /^\d+\.\s+/

function paragraphNode(text: string): TiptapNode {
  if (!text.trim()) {
    return { type: 'paragraph', content: [] }
  }
  return {
    type: 'paragraph',
    content: [{ type: 'text', text }],
  }
}

function headingNode(level: number, text: string): TiptapNode {
  return {
    type: 'heading',
    attrs: { level },
    content: [{ type: 'text', text }],
  }
}

function listNode(type: 'bulletList' | 'orderedList', items: string[]): TiptapNode {
  return {
    type,
    content: items.map((item) => ({
      type: 'listItem',
      content: [paragraphNode(item)],
    })),
  }
}

function buildNodesFromBlock(block: string): TiptapNode[] {
  const trimmed = block.trim()
  if (!trimmed) return []

  const lines = trimmed.split('\n')
  const headingMatch = HEADING_RE.exec(lines[0])
  if (headingMatch) {
    const level = Math.min(headingMatch[1].length, 4)
    const title = headingMatch[2].trim()
    const nodes: TiptapNode[] = [headingNode(level, title)]
    const rest = lines.slice(1).join('\n').trim()
    if (rest) nodes.push(paragraphNode(rest))
    return nodes
  }

  if (lines.every((line) => BULLET_RE.test(line))) {
    return [listNode('bulletList', lines.map((line) => line.replace(BULLET_RE, '').trim()))]
  }

  if (lines.every((line) => ORDERED_RE.test(line))) {
    return [listNode('orderedList', lines.map((line) => line.replace(ORDERED_RE, '').trim()))]
  }

  return [paragraphNode(trimmed)]
}

export function draftTextToTiptap(text: string): TiptapDocument {
  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean)
  const content = blocks.flatMap((block) => buildNodesFromBlock(block))

  return {
    type: 'doc',
    content: content.length > 0 ? content : [paragraphNode('')],
  }
}
