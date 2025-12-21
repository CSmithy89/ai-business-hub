import { describe, expect, it } from 'vitest'
import { draftTextToTiptap } from './kb-ai'

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
