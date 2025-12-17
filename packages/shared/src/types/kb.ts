/**
 * Knowledge Base (KB) type definitions
 * Used across frontend and backend for KB module
 */

/**
 * Tiptap/ProseMirror document structure
 */
export interface TiptapDocument {
  type: 'doc'
  content: TiptapNode[]
}

export interface TiptapNode {
  type: string // 'paragraph', 'heading', 'bulletList', etc.
  attrs?: Record<string, any>
  content?: TiptapNode[]
  marks?: TiptapMark[]
  text?: string
}

export interface TiptapMark {
  type: string // 'bold', 'italic', 'link', etc.
  attrs?: Record<string, any>
}

/**
 * Knowledge Page entity
 */
export interface KnowledgePage {
  id: string
  tenantId: string
  workspaceId: string
  parentId: string | null
  title: string
  slug: string
  content: TiptapDocument
  contentText: string
  isVerified: boolean
  verifiedAt: string | null
  verifiedById: string | null
  verifyExpires: string | null
  ownerId: string
  viewCount: number
  lastViewedAt: string | null
  favoritedBy: string[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

/**
 * Page Version (snapshot)
 */
export interface PageVersion {
  id: string
  pageId: string
  version: number
  content: TiptapDocument
  contentText: string
  changeNote: string | null
  createdById: string
  createdAt: string
}

/**
 * Project-Page link (many-to-many)
 */
export interface ProjectPage {
  id: string
  projectId: string
  pageId: string
  isPrimary: boolean
  linkedBy: string
  createdAt: string
}

/**
 * Page Activity log entry
 */
export interface PageActivity {
  id: string
  pageId: string
  userId: string
  type: KBPageActivityType
  data: Record<string, any> | null
  createdAt: string
}

/**
 * KB Page Activity Types
 */
export type KBPageActivityType =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'RESTORED'
  | 'VIEWED'
  | 'VERIFIED'
  | 'UNVERIFIED'
  | 'LINKED_TO_PROJECT'
  | 'UNLINKED_FROM_PROJECT'
  | 'COMMENTED'

/**
 * Page tree node for hierarchical navigation
 */
export interface PageTreeNode {
  id: string
  title: string
  slug: string
  parentId: string | null
  children: PageTreeNode[]
}

/**
 * Search result from FTS
 */
export interface PageSearchResult {
  pageId: string
  title: string
  slug: string
  snippet: string // HTML with <mark> tags
  rank: number // Relevance score
  updatedAt: string
  path: string[] // Breadcrumb path
}
