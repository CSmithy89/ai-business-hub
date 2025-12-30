"""
RAG Context Indexing

Provides context indexing and semantic search for the HYVVE Dynamic Module System.
Indexes application state (projects, tasks, documents, activities) for RAG queries
alongside knowledge base content.

@see docs/modules/bm-dm/stories/dm-06-6-rag-context-indexing.md
Epic: DM-06 | Story: DM-06.6

Components:
- models: Core data models (ContextDocument, IndexResult, SearchResult, IndexStats)
- context_indexer: ContextIndexer for embedding and semantic search
- context_sync: ContextSyncService for event-driven and periodic sync

Usage:
    from rag import ContextIndexer, ContextDocument, ContextSyncService

    # Create indexer with services
    indexer = ContextIndexer(embedding_service, vector_store)

    # Index a project
    await indexer.index_project(
        project_id="proj_123",
        name="My Project",
        description="Project description",
        workspace_id="ws_123",
    )

    # Search for relevant context
    results = await indexer.search("authentication", "ws_123")

    # Set up sync service for event-driven updates
    sync_service = ContextSyncService(indexer, data_fetcher)
    await sync_service.start()
    await sync_service.handle_event(event)

References:
- KB-02 RAG Infrastructure: agents/knowledge/
- Agent Mesh: agents/mesh/
- Epic DM-06 Tech Spec: docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
"""

# Models
from .models import (
    ContextDocument,
    ContextDocumentType,
    IndexResult,
    IndexStats,
    SearchResult,
)

# Context Indexer
from .context_indexer import (
    ContextIndexer,
    EmbeddingService,
    VectorStore,
    get_context_indexer,
    reset_indexer,
)

# Context Sync Service
from .context_sync import (
    ContextSyncService,
    DataFetcher,
    get_context_sync_service,
    reset_sync_service,
)

__all__ = [
    # Models
    "ContextDocument",
    "ContextDocumentType",
    "IndexResult",
    "IndexStats",
    "SearchResult",
    # Context Indexer
    "ContextIndexer",
    "EmbeddingService",
    "VectorStore",
    "get_context_indexer",
    "reset_indexer",
    # Context Sync Service
    "ContextSyncService",
    "DataFetcher",
    "get_context_sync_service",
    "reset_sync_service",
]
