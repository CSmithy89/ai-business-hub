"""
HYVVE Knowledge Module

Provides workspace-scoped RAG knowledge bases using Agno's
PgVector integration with BYOAI embeddings support.

Usage:
    from knowledge import get_workspace_knowledge, ingest_document

    # Get knowledge base for a workspace
    knowledge = await get_workspace_knowledge(
        workspace_id="ws_123",
        jwt_token="eyJ...",
    )

    # Ingest a document
    await ingest_document(
        workspace_id="ws_123",
        jwt_token="eyJ...",
        source="https://example.com/doc.pdf",
        metadata={"category": "policy"}
    )
"""

from .factory import (
    KnowledgeFactory,
    get_knowledge_factory,
    get_workspace_knowledge,
)
from .ingestion import (
    ingest_document,
    ingest_url,
    ingest_text,
    search_knowledge,
    DocumentMetadata,
    IngestionResult,
)
from .team_integration import (
    create_agent_with_knowledge,
    enhance_team_with_knowledge,
    KnowledgeAwareTeamFactory,
)

__all__ = [
    # Factory
    "KnowledgeFactory",
    "get_knowledge_factory",
    "get_workspace_knowledge",
    # Ingestion
    "ingest_document",
    "ingest_url",
    "ingest_text",
    "search_knowledge",
    "DocumentMetadata",
    "IngestionResult",
    # Team Integration
    "create_agent_with_knowledge",
    "enhance_team_with_knowledge",
    "KnowledgeAwareTeamFactory",
]
