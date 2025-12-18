export const KB_ERROR = {
  WORKSPACE_ID_MISMATCH: 'kb.workspace-id-mismatch',

  PAGE_NOT_FOUND: 'kb.page-not-found',
  PROJECT_NOT_FOUND: 'kb.project-not-found',
  PAGE_NOT_DELETED: 'kb.page-not-deleted',
  PAGE_SELF_PARENT: 'kb.page-self-parent',
  PAGE_CIRCULAR_PARENT: 'kb.page-circular-parent',
  PAGE_MAX_FAVORITES: 'kb.page-max-favorites',
  PROJECT_PAGE_NOT_LINKED: 'kb.project-page-not-linked',
  PROJECT_PAGE_ALREADY_LINKED: 'kb.project-page-already-linked',
  PROJECT_PRIMARY_PAGE_EXISTS: 'kb.project-primary-page-exists',

  SLUG_GENERATION_FAILED: 'kb.slug-generation-failed',

  VERSION_NOT_FOUND: 'kb.version-not-found',
  VERSION_IDENTICAL: 'kb.version-identical',

  EMBEDDINGS_DIMS_INVALID: 'kb.embeddings-dims-invalid',
  EMBEDDINGS_DIMS_UNSUPPORTED: 'kb.embeddings-dims-unsupported',
  EMBEDDINGS_LENGTH_MISMATCH: 'kb.embeddings-length-mismatch',
  EMBEDDINGS_TEMPORARILY_UNAVAILABLE: 'kb.embeddings-temporarily-unavailable',
  EMBEDDINGS_PROVIDER_REQUEST_FAILED: 'kb.embeddings-provider-request-failed',
  EMBEDDINGS_PROVIDER_UNSUPPORTED: 'kb.embeddings-provider-unsupported',
  EMBEDDINGS_PROVIDER_RESPONSE_INVALID: 'kb.embeddings-provider-response-invalid',
  EMBEDDINGS_PROVIDER_DIMENSION_MISMATCH: 'kb.embeddings-provider-dimension-mismatch',
  EMBEDDINGS_PROVIDER_VALUES_INVALID: 'kb.embeddings-provider-values-invalid',
  EMBEDDINGS_PROVIDER_RESPONSE_INCOMPLETE: 'kb.embeddings-provider-response-incomplete',
  EMBEDDING_NON_FINITE: 'kb.embedding-non-finite',
  EMBEDDING_DIMENSION_MISMATCH: 'kb.embedding-dimension-mismatch',

  SEARCH_NO_PROVIDER: 'kb.search-no-embeddings-provider',
  RAG_NO_PROVIDER: 'kb.rag-no-embeddings-provider',
} as const

export type KbErrorCode = (typeof KB_ERROR)[keyof typeof KB_ERROR]

