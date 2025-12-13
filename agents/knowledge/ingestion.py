"""
Document Ingestion

Handles ingestion of documents, URLs, and text into workspace knowledge bases.
Supports PDF, CSV, Markdown, DOCX, and web content.
"""

import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path

from agno.knowledge.knowledge import Knowledge
from agno.knowledge.document import Document

from .factory import get_workspace_knowledge

logger = logging.getLogger(__name__)


class ContentType(str, Enum):
    """Supported content types for ingestion."""
    PDF = "pdf"
    CSV = "csv"
    MARKDOWN = "markdown"
    TEXT = "text"
    DOCX = "docx"
    PPTX = "pptx"
    JSON = "json"
    URL = "url"
    YOUTUBE = "youtube"
    ARXIV = "arxiv"
    WIKIPEDIA = "wikipedia"


@dataclass
class DocumentMetadata:
    """Metadata for ingested documents."""
    title: Optional[str] = None
    source: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    custom: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        result = {}
        if self.title:
            result["title"] = self.title
        if self.source:
            result["source"] = self.source
        if self.category:
            result["category"] = self.category
        if self.tags:
            result["tags"] = self.tags
        if self.custom:
            result.update(self.custom)
        return result


@dataclass
class IngestionResult:
    """Result of a document ingestion operation."""
    success: bool
    document_count: int = 0
    chunk_count: int = 0
    error: Optional[str] = None
    source: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "document_count": self.document_count,
            "chunk_count": self.chunk_count,
            "error": self.error,
            "source": self.source,
        }


def _detect_content_type(source: str) -> ContentType:
    """Detect content type from source URL or path."""
    source_lower = source.lower()

    # URL patterns
    if "youtube.com" in source_lower or "youtu.be" in source_lower:
        return ContentType.YOUTUBE
    if "arxiv.org" in source_lower:
        return ContentType.ARXIV
    if "wikipedia.org" in source_lower:
        return ContentType.WIKIPEDIA
    if source_lower.startswith(("http://", "https://")):
        # Check file extension in URL
        if ".pdf" in source_lower:
            return ContentType.PDF
        if ".csv" in source_lower:
            return ContentType.CSV
        if ".md" in source_lower:
            return ContentType.MARKDOWN
        if ".json" in source_lower:
            return ContentType.JSON
        return ContentType.URL

    # File extension patterns
    path = Path(source)
    ext = path.suffix.lower()
    extension_map = {
        ".pdf": ContentType.PDF,
        ".csv": ContentType.CSV,
        ".xlsx": ContentType.CSV,
        ".xls": ContentType.CSV,
        ".md": ContentType.MARKDOWN,
        ".markdown": ContentType.MARKDOWN,
        ".txt": ContentType.TEXT,
        ".docx": ContentType.DOCX,
        ".doc": ContentType.DOCX,
        ".pptx": ContentType.PPTX,
        ".json": ContentType.JSON,
    }

    return extension_map.get(ext, ContentType.TEXT)


async def ingest_document(
    workspace_id: str,
    jwt_token: str,
    source: str,
    metadata: Optional[DocumentMetadata] = None,
    content_type: Optional[ContentType] = None,
) -> IngestionResult:
    """
    Ingest a document into the workspace knowledge base.

    Automatically detects content type from source if not specified.
    Supports URLs, file paths, and special sources (YouTube, ArXiv, etc.)

    Args:
        workspace_id: Workspace ID for tenant isolation
        jwt_token: JWT token for authentication
        source: Document URL or file path
        metadata: Optional document metadata
        content_type: Optional explicit content type

    Returns:
        IngestionResult with status and counts
    """
    try:
        # Get workspace knowledge base
        knowledge = await get_workspace_knowledge(
            workspace_id=workspace_id,
            jwt_token=jwt_token,
        )

        # Detect content type if not specified
        if content_type is None:
            content_type = _detect_content_type(source)

        logger.info(
            f"Ingesting {content_type.value} document: {source[:100]}..."
        )

        # Build metadata dict
        meta_dict = metadata.to_dict() if metadata else {}
        meta_dict["workspace_id"] = workspace_id
        meta_dict["content_type"] = content_type.value

        # Use Agno's add_content which handles reader selection
        # The Knowledge class will auto-select the appropriate reader
        await knowledge.add_content_async(
            url=source,
            metadata=meta_dict,
        )

        # Note: Agno doesn't return document/chunk counts directly
        # We estimate based on content type
        return IngestionResult(
            success=True,
            document_count=1,
            chunk_count=0,  # Unknown until we query
            source=source,
        )

    except Exception as e:
        logger.error(f"Ingestion failed for {source}: {e}", exc_info=True)
        return IngestionResult(
            success=False,
            error=str(e),
            source=source,
        )


async def ingest_url(
    workspace_id: str,
    jwt_token: str,
    url: str,
    metadata: Optional[DocumentMetadata] = None,
    crawl_depth: int = 0,
) -> IngestionResult:
    """
    Ingest content from a URL.

    Args:
        workspace_id: Workspace ID
        jwt_token: JWT token
        url: URL to ingest
        metadata: Optional metadata
        crawl_depth: How deep to crawl linked pages (0 = just this page)

    Returns:
        IngestionResult
    """
    if metadata is None:
        metadata = DocumentMetadata(source=url)
    elif metadata.source is None:
        metadata.source = url

    return await ingest_document(
        workspace_id=workspace_id,
        jwt_token=jwt_token,
        source=url,
        metadata=metadata,
        content_type=ContentType.URL,
    )


async def ingest_text(
    workspace_id: str,
    jwt_token: str,
    text: str,
    title: Optional[str] = None,
    metadata: Optional[DocumentMetadata] = None,
) -> IngestionResult:
    """
    Ingest raw text content directly.

    Args:
        workspace_id: Workspace ID
        jwt_token: JWT token
        text: Text content to ingest
        title: Optional title for the content
        metadata: Optional metadata

    Returns:
        IngestionResult
    """
    try:
        knowledge = await get_workspace_knowledge(
            workspace_id=workspace_id,
            jwt_token=jwt_token,
        )

        # Build metadata
        meta_dict = metadata.to_dict() if metadata else {}
        meta_dict["workspace_id"] = workspace_id
        meta_dict["content_type"] = "text"
        if title:
            meta_dict["title"] = title

        # Create a Document directly for raw text
        doc = Document(
            content=text,
            name=title or "text_content",
            metadata=meta_dict,
        )

        # Add document to knowledge base
        if hasattr(knowledge, 'add_documents'):
            await knowledge.add_documents_async([doc])
        else:
            # Fallback: use vector_db directly
            knowledge.vector_db.insert([doc])

        logger.info(f"Ingested text content: {len(text)} chars")

        return IngestionResult(
            success=True,
            document_count=1,
            chunk_count=1,
            source="direct_text",
        )

    except Exception as e:
        logger.error(f"Text ingestion failed: {e}", exc_info=True)
        return IngestionResult(
            success=False,
            error=str(e),
            source="direct_text",
        )


async def search_knowledge(
    workspace_id: str,
    jwt_token: str,
    query: str,
    limit: int = 5,
    filters: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Search the workspace knowledge base.

    Args:
        workspace_id: Workspace ID
        jwt_token: JWT token
        query: Search query
        limit: Maximum results to return
        filters: Optional metadata filters

    Returns:
        List of matching documents with content and metadata
    """
    try:
        knowledge = await get_workspace_knowledge(
            workspace_id=workspace_id,
            jwt_token=jwt_token,
        )

        # Build filters with workspace isolation
        search_filters = {"workspace_id": workspace_id}
        if filters:
            search_filters.update(filters)

        # Search using Agno's knowledge search
        results = knowledge.search(
            query=query,
            num_documents=limit,
        )

        # Format results
        formatted = []
        for doc in results:
            formatted.append({
                "content": doc.content if hasattr(doc, 'content') else str(doc),
                "metadata": doc.metadata if hasattr(doc, 'metadata') else {},
                "score": doc.score if hasattr(doc, 'score') else None,
            })

        return formatted

    except Exception as e:
        logger.error(f"Knowledge search failed: {e}", exc_info=True)
        return []
