import { TiptapContentValidator } from './tiptap-content.validator'
import type { ValidationArguments } from 'class-validator'

describe('TiptapContentValidator', () => {
  let validator: TiptapContentValidator
  const args = {} as ValidationArguments

  beforeEach(() => {
    validator = new TiptapContentValidator()
  })

  describe('validate', () => {
    it('should accept null or undefined content', () => {
      expect(validator.validate(null, args)).toBe(true)
      expect(validator.validate(undefined, args)).toBe(true)
    })

    it('should reject non-object content', () => {
      expect(validator.validate('string', args)).toBe(false)
      expect(validator.validate(123, args)).toBe(false)
      expect(validator.validate([], args)).toBe(false)
    })

    it('should reject content without doc type', () => {
      expect(validator.validate({ type: 'paragraph', content: [] }, args)).toBe(false)
    })

    it('should reject content without content array', () => {
      expect(validator.validate({ type: 'doc' }, args)).toBe(false)
      expect(validator.validate({ type: 'doc', content: 'not-array' }, args)).toBe(false)
    })

    it('should accept valid empty doc', () => {
      const content = { type: 'doc', content: [] }
      expect(validator.validate(content, args)).toBe(true)
    })

    it('should accept valid doc with paragraph', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      }
      expect(validator.validate(content, args)).toBe(true)
    })

    it('should accept valid doc with heading', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Title' }],
          },
        ],
      }
      expect(validator.validate(content, args)).toBe(true)
    })

    it('should accept text with valid marks', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Bold text',
                marks: [{ type: 'bold' }],
              },
            ],
          },
        ],
      }
      expect(validator.validate(content, args)).toBe(true)
    })

    it('should accept text with link mark', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Link',
                marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
              },
            ],
          },
        ],
      }
      expect(validator.validate(content, args)).toBe(true)
    })

    it('should reject invalid node types', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'script',
            content: [{ type: 'text', text: 'alert("XSS")' }],
          },
        ],
      }
      expect(validator.validate(content, args)).toBe(false)
    })

    it('should reject invalid mark types', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Bad mark',
                marks: [{ type: 'onclick' }],
              },
            ],
          },
        ],
      }
      expect(validator.validate(content, args)).toBe(false)
    })

    it('should accept nested lists', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Item 1' }],
                  },
                ],
              },
            ],
          },
        ],
      }
      expect(validator.validate(content, args)).toBe(true)
    })

    it('should accept table structure', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                content: [
                  {
                    type: 'tableCell',
                    content: [{ type: 'paragraph', content: [] }],
                  },
                ],
              },
            ],
          },
        ],
      }
      expect(validator.validate(content, args)).toBe(true)
    })

    it('should accept code blocks', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'javascript' },
            content: [{ type: 'text', text: 'const x = 1' }],
          },
        ],
      }
      expect(validator.validate(content, args)).toBe(true)
    })

    it('should accept task lists', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: true },
                content: [{ type: 'paragraph', content: [] }],
              },
            ],
          },
        ],
      }
      expect(validator.validate(content, args)).toBe(true)
    })

    it('should reject content exceeding size limit', () => {
      // Create content that exceeds 1MB
      const largeText = 'a'.repeat(1024 * 1024 + 1) // Over 1MB
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: largeText }],
          },
        ],
      }
      expect(validator.validate(content, args)).toBe(false)
    })

    it('should accept content just under size limit', () => {
      // Create content that is just under 1MB (accounting for JSON structure overhead)
      const largeText = 'a'.repeat(1024 * 1000) // ~1000KB
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: largeText }],
          },
        ],
      }
      expect(validator.validate(content, args)).toBe(true)
    })

    it('should reject deeply nested invalid nodes', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'iframe', // Invalid nested node
                    attrs: { src: 'https://malicious.com' },
                  },
                ],
              },
            ],
          },
        ],
      }
      expect(validator.validate(content, args)).toBe(false)
    })

    it('should reject malformed node without type', () => {
      const content = {
        type: 'doc',
        content: [
          {
            content: [{ type: 'text', text: 'Missing type' }],
          },
        ],
      }
      expect(validator.validate(content, args)).toBe(false)
    })

    it('should accept text nodes without type (text property)', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ text: 'Just text' }],
          },
        ],
      }
      expect(validator.validate(content, args)).toBe(true)
    })
  })

  describe('defaultMessage', () => {
    it('should return appropriate error messages', () => {
      validator.validate('string', args)
      expect(validator.defaultMessage(args)).toBe('Content must be a JSON object')

      validator.validate({ type: 'paragraph' }, args)
      expect(validator.defaultMessage(args)).toBe('Content root must be type "doc"')

      validator.validate({ type: 'doc', content: [{ type: 'script' }] }, args)
      expect(validator.defaultMessage(args)).toBe('Invalid node type: "script"')
    })
  })
})
