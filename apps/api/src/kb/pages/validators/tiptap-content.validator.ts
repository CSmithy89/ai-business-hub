import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator'

/**
 * Maximum content size in bytes (1MB)
 */
const MAX_CONTENT_SIZE = 1024 * 1024

/**
 * Valid Tiptap node types for our implementation
 */
const VALID_NODE_TYPES = new Set([
  'doc',
  'paragraph',
  'text',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'codeBlock',
  'horizontalRule',
  'hardBreak',
  'image',
  'table',
  'tableRow',
  'tableCell',
  'tableHeader',
  'taskList',
  'taskItem',
])

/**
 * Valid Tiptap mark types
 */
const VALID_MARK_TYPES = new Set([
  'bold',
  'italic',
  'strike',
  'underline',
  'code',
  'link',
  'highlight',
  'textStyle',
])

/**
 * Custom validator for Tiptap JSON content structure
 */
@ValidatorConstraint({ name: 'tiptapContent', async: false })
export class TiptapContentValidator implements ValidatorConstraintInterface {
  private errorMessage = 'Invalid content structure'

  validate(content: unknown, _args: ValidationArguments): boolean {
    // Allow undefined/null for optional content
    if (content === undefined || content === null) {
      return true
    }

    // Must be an object
    if (typeof content !== 'object' || Array.isArray(content)) {
      this.errorMessage = 'Content must be a JSON object'
      return false
    }

    // Check size limit
    const contentStr = JSON.stringify(content)
    if (contentStr.length > MAX_CONTENT_SIZE) {
      this.errorMessage = `Content exceeds maximum size of ${MAX_CONTENT_SIZE / 1024}KB`
      return false
    }

    // Validate structure
    const doc = content as Record<string, unknown>

    // Root must be a doc type
    if (doc.type !== 'doc') {
      this.errorMessage = 'Content root must be type "doc"'
      return false
    }

    // Content array must exist (can be empty)
    if (!Array.isArray(doc.content)) {
      this.errorMessage = 'Content must have a "content" array'
      return false
    }

    // Recursively validate nodes
    if (!this.validateNodes(doc.content as unknown[])) {
      return false
    }

    return true
  }

  private validateNodes(nodes: unknown[]): boolean {
    for (const node of nodes) {
      if (!this.validateNode(node)) {
        return false
      }
    }
    return true
  }

  private validateNode(node: unknown): boolean {
    if (typeof node !== 'object' || node === null) {
      this.errorMessage = 'Invalid node: must be an object'
      return false
    }

    const nodeObj = node as Record<string, unknown>

    // Text nodes don't have a type, they have text property
    if ('text' in nodeObj && typeof nodeObj.text === 'string') {
      // Validate marks if present
      if (nodeObj.marks !== undefined) {
        if (!Array.isArray(nodeObj.marks)) {
          this.errorMessage = 'Node marks must be an array'
          return false
        }
        for (const mark of nodeObj.marks) {
          if (!this.validateMark(mark)) {
            return false
          }
        }
      }
      return true
    }

    // Must have a valid type
    if (typeof nodeObj.type !== 'string') {
      this.errorMessage = 'Node must have a "type" string property'
      return false
    }

    if (!VALID_NODE_TYPES.has(nodeObj.type)) {
      this.errorMessage = `Invalid node type: "${nodeObj.type}"`
      return false
    }

    // Recursively validate child content
    if (nodeObj.content !== undefined) {
      if (!Array.isArray(nodeObj.content)) {
        this.errorMessage = 'Node content must be an array'
        return false
      }
      if (!this.validateNodes(nodeObj.content as unknown[])) {
        return false
      }
    }

    return true
  }

  private validateMark(mark: unknown): boolean {
    if (typeof mark !== 'object' || mark === null) {
      this.errorMessage = 'Mark must be an object'
      return false
    }

    const markObj = mark as Record<string, unknown>

    if (typeof markObj.type !== 'string') {
      this.errorMessage = 'Mark must have a "type" string property'
      return false
    }

    if (!VALID_MARK_TYPES.has(markObj.type)) {
      this.errorMessage = `Invalid mark type: "${markObj.type}"`
      return false
    }

    return true
  }

  defaultMessage(_args: ValidationArguments): string {
    return this.errorMessage
  }
}
