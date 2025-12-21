import { describe, expect, it } from 'vitest'
import { draftTextToTiptap, summaryToTiptapNodes } from './kb-ai'

describe('draftTextToTiptap', () => {
  it('creates heading and paragraph nodes', () => {
    const doc = draftTextToTiptap('# Title\n\nIntro paragraph')

    expect(doc.content[0]).toMatchObject({
      type: 'heading',
      attrs: { level: 1 },
    })
    expect(doc.content[1]).toMatchObject({
      type: 'paragraph',
    })
  })

  it('creates bullet list nodes', () => {
    const doc = draftTextToTiptap('- Item one\n- Item two')

    expect(doc.content[0]).toMatchObject({
      type: 'bulletList',
    })
  })
})

describe('summaryToTiptapNodes', () => {
  it('creates summary nodes', () => {
    const nodes = summaryToTiptapNodes({
      summary: 'Short summary text.',
      keyPoints: ['Point one', 'Point two'],
    })

    expect(nodes[0]).toMatchObject({ type: 'heading' })
    expect(nodes[1]).toMatchObject({ type: 'paragraph' })
    expect(nodes[2]).toMatchObject({ type: 'bulletList' })
  })
})
