"""
Context Indexer

Indexes application context for RAG queries.

Maintains a vector index of:
- Project metadata and descriptions
- Task content and status
- Document text
- Recent activity summaries

Uses content hashing for change detection to skip unchanged documents,
and the ctx_ prefix for namespace isolation from KB documents.

@see docs/modules/bm-dm/stories/dm-06-6-rag-context-indexing.md
Epic: DM-06 | Story: DM-06.6
"""
import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional, Protocol, Tuple, runtime_checkable

from .models import (
    ContextDocument,
    ContextDocumentType,
    IndexResult,
    IndexStats,
    SearchResult,
)

logger = logging.getLogger(__name__)


@runtime_checkable
class EmbeddingService(Protocol):
    """Protocol for embedding services."""

    async def embed_text(self, text: str) -> List[float]:
        """Generate embedding for text."""
        ...


@runtime_checkable
class VectorStore(Protocol):
    """Protocol for vector store backends."""

    async def upsert(
        self,
        id: str,
        embedding: List[float],
        metadata: Dict[str, Any],
    ) -> None:
        """Insert or update a vector."""
        ...

    async def search(
        self,
        embedding: List[float],
        limit: int,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Search for similar vectors."""
        ...

    async def delete(self, id: str) -> None:
        """Delete a vector by ID."""
        ...

    async def delete_by_filter(self, filters: Dict[str, Any]) -> int:
        """Delete vectors matching filter. Returns count deleted."""
        ...


class ContextIndexer:
    """
    Indexes application context for RAG queries.

    Maintains a vector index of projects, tasks, documents,
    and activities for semantic search. Uses content hashing
    to avoid re-embedding unchanged documents.

    Usage:
        indexer = ContextIndexer(embedding_service, vector_store)
        await indexer.index_project(...)
        results = await indexer.search("authentication tasks", "ws_123")

    Attributes:
        embedding_service: Service for generating text embeddings
        vector_store: Backend for storing and searching vectors
    """

    # Prefix for context documents to separate from KB docs
    ID_PREFIX = "ctx_"

    def __init__(
        self,
        embedding_service: EmbeddingService,
        vector_store: VectorStore,
    ):
        """
        Initialize the context indexer.

        Args:
            embedding_service: Service for generating embeddings
            vector_store: Backend for vector storage
        """
        self.embedding_service = embedding_service
        self.vector_store = vector_store

        # In-memory cache for content hashes (cleared on restart)
        # Maps doc_id -> (workspace_id, hash) for proper workspace scoping
        self._content_hashes: Dict[str, Tuple[str, str]] = {}

        # Stats tracking
        self._indexed_count: Dict[str, int] = defaultdict(int)

        logger.info("ContextIndexer initialized")

    def _get_index_id(self, doc_id: str) -> str:
        """Get the vector store ID with prefix."""
        return f"{self.ID_PREFIX}{doc_id}"

    def _check_hash_changed(self, doc_id: str, content_hash: str) -> bool:
        """
        Check if content has changed based on hash.

        Args:
            doc_id: Document ID
            content_hash: New content hash

        Returns:
            True if content changed (or new), False if unchanged
        """
        cached_entry = self._content_hashes.get(doc_id)
        if cached_entry is None:
            return True  # New document
        _, cached_hash = cached_entry
        return cached_hash != content_hash

    async def index_document(self, doc: ContextDocument) -> bool:
        """
        Index a single document.

        Skips indexing if content hash matches cached hash
        (document unchanged). Uses ctx_ prefix for namespace.

        Args:
            doc: Document to index

        Returns:
            True if document was indexed (new or updated),
            False if skipped (unchanged)
        """
        # Check if content changed
        content_hash = doc.content_hash
        if not self._check_hash_changed(doc.id, content_hash):
            logger.debug(f"Document {doc.id} unchanged, skipping")
            return False

        try:
            # Generate embedding
            embedding = await self.embedding_service.embed_text(doc.content)

            # Build metadata for storage
            metadata = {
                "type": doc.document_type.value,
                "workspace_id": doc.workspace_id,
                "content": doc.content,
                "content_hash": content_hash,
                "created_at": doc.created_at.isoformat(),
                "updated_at": doc.updated_at.isoformat(),
                **doc.metadata,
            }
            if doc.user_id:
                metadata["user_id"] = doc.user_id

            # Store in vector database
            index_id = self._get_index_id(doc.id)
            await self.vector_store.upsert(
                id=index_id,
                embedding=embedding,
                metadata=metadata,
            )

            # Update hash cache with workspace_id for proper scoping
            self._content_hashes[doc.id] = (doc.workspace_id, content_hash)

            # Update stats
            self._indexed_count[doc.workspace_id] += 1

            logger.debug(f"Indexed document {doc.id} ({doc.document_type.value})")
            return True

        except Exception as e:
            logger.error(f"Failed to index document {doc.id}: {e}")
            raise

    async def index_batch(self, docs: List[ContextDocument]) -> IndexResult:
        """
        Index a batch of documents.

        Args:
            docs: List of documents to index

        Returns:
            IndexResult with counts of indexed, skipped, and failed
        """
        result = IndexResult()

        for doc in docs:
            try:
                indexed = await self.index_document(doc)
                if indexed:
                    result.indexed += 1
                else:
                    result.skipped += 1
            except Exception as e:
                result.failed += 1
                result.errors.append(f"{doc.id}: {str(e)}")

        logger.info(
            f"Batch index complete: {result.indexed} indexed, "
            f"{result.skipped} skipped, {result.failed} failed"
        )

        return result

    async def index_project(
        self,
        project_id: str,
        name: str,
        description: str,
        workspace_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Index project metadata.

        Args:
            project_id: Project ID
            name: Project name
            description: Project description
            workspace_id: Workspace ID for tenant isolation
            metadata: Optional additional metadata

        Returns:
            True if indexed, False if unchanged
        """
        # Build content from name and description
        content = f"Project: {name}\n\n{description}"

        doc = ContextDocument(
            id=f"project_{project_id}",
            document_type=ContextDocumentType.PROJECT,
            workspace_id=workspace_id,
            content=content,
            metadata={
                "project_id": project_id,
                "name": name,
                **(metadata or {}),
            },
        )

        return await self.index_document(doc)

    async def index_task(
        self,
        task_id: str,
        title: str,
        description: str,
        project_id: str,
        workspace_id: str,
        status: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Index task content.

        Args:
            task_id: Task ID
            title: Task title
            description: Task description
            project_id: Parent project ID
            workspace_id: Workspace ID for tenant isolation
            status: Task status
            metadata: Optional additional metadata

        Returns:
            True if indexed, False if unchanged
        """
        # Build content from title, description, and status
        content = f"Task: {title}\nStatus: {status}\n\n{description}"

        doc = ContextDocument(
            id=f"task_{task_id}",
            document_type=ContextDocumentType.TASK,
            workspace_id=workspace_id,
            content=content,
            metadata={
                "task_id": task_id,
                "project_id": project_id,
                "title": title,
                "status": status,
                **(metadata or {}),
            },
        )

        return await self.index_document(doc)

    async def index_activity_batch(
        self,
        activities: List[Dict[str, Any]],
        workspace_id: str,
    ) -> int:
        """
        Index activities grouped by day as summaries.

        Activities are grouped by date and summarized to reduce
        embedding count while maintaining searchability.

        Args:
            activities: List of activity dictionaries with
                       timestamp, action, user, and optional target
            workspace_id: Workspace ID for tenant isolation

        Returns:
            Number of activity summaries indexed
        """
        if not activities:
            return 0

        # Group activities by date
        by_date: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        for activity in activities:
            timestamp = activity.get("timestamp", "")
            # Extract date portion (YYYY-MM-DD)
            if isinstance(timestamp, str):
                date_str = timestamp[:10]
            elif isinstance(timestamp, datetime):
                date_str = timestamp.strftime("%Y-%m-%d")
            else:
                date_str = "unknown"

            by_date[date_str].append(activity)

        indexed_count = 0

        for date_str, day_activities in by_date.items():
            # Build summary content
            summary_lines = [f"Activity Summary for {date_str}:"]
            for act in day_activities:
                action = act.get("action", "unknown")
                user = act.get("user", "unknown")
                target = act.get("target", "")
                summary_lines.append(f"- {user} {action} {target}".strip())

            content = "\n".join(summary_lines)

            doc = ContextDocument(
                id=f"activity_{workspace_id}_{date_str}",
                document_type=ContextDocumentType.ACTIVITY,
                workspace_id=workspace_id,
                content=content,
                metadata={
                    "date": date_str,
                    "activity_count": len(day_activities),
                },
            )

            try:
                if await self.index_document(doc):
                    indexed_count += 1
            except Exception as e:
                logger.error(f"Failed to index activities for {date_str}: {e}")

        return indexed_count

    async def search(
        self,
        query: str,
        workspace_id: str,
        type_filter: Optional[str] = None,
        limit: int = 10,
    ) -> List[SearchResult]:
        """
        Search indexed context.

        Args:
            query: Natural language search query
            workspace_id: Workspace ID for tenant isolation
            type_filter: Optional document type to filter by
            limit: Maximum results to return

        Returns:
            List of SearchResult with content and scores
        """
        try:
            # Generate query embedding
            query_embedding = await self.embedding_service.embed_text(query)

            # Build filters
            filters: Dict[str, Any] = {"workspace_id": workspace_id}
            if type_filter:
                filters["type"] = type_filter

            # Search vector store
            results = await self.vector_store.search(
                embedding=query_embedding,
                limit=limit,
                filters=filters,
            )

            # Convert to SearchResult objects
            search_results = []
            for result in results:
                # Extract ID without prefix
                raw_id = result.get("id", "")
                if raw_id.startswith(self.ID_PREFIX):
                    doc_id = raw_id[len(self.ID_PREFIX) :]
                else:
                    doc_id = raw_id

                search_results.append(
                    SearchResult(
                        id=doc_id,
                        document_type=result.get("metadata", {}).get("type", "unknown"),
                        content=result.get("metadata", {}).get("content", ""),
                        score=result.get("score", 0.0),
                        metadata=result.get("metadata", {}),
                    )
                )

            return search_results

        except Exception as e:
            logger.error(f"Search failed: {e}")
            raise

    async def delete_document(self, doc_id: str) -> bool:
        """
        Delete a document from the index.

        Args:
            doc_id: Document ID to delete

        Returns:
            True if deleted successfully
        """
        try:
            index_id = self._get_index_id(doc_id)
            await self.vector_store.delete(index_id)

            # Clear hash cache
            self._content_hashes.pop(doc_id, None)

            logger.debug(f"Deleted document {doc_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete document {doc_id}: {e}")
            return False

    async def clear_workspace(self, workspace_id: str) -> int:
        """
        Clear all indexed content for a workspace.

        Args:
            workspace_id: Workspace ID

        Returns:
            Number of documents deleted
        """
        try:
            deleted = await self.vector_store.delete_by_filter(
                {"workspace_id": workspace_id}
            )

            # Clear hash cache for workspace - use stored workspace_id for proper scoping
            to_remove = [
                doc_id
                for doc_id, (ws_id, _) in self._content_hashes.items()
                if ws_id == workspace_id
            ]
            for doc_id in to_remove:
                self._content_hashes.pop(doc_id, None)

            # Reset stats for workspace
            self._indexed_count[workspace_id] = 0

            logger.info(f"Cleared {deleted} documents for workspace {workspace_id}")
            return deleted

        except Exception as e:
            logger.error(f"Failed to clear workspace {workspace_id}: {e}")
            raise

    def get_stats(self, workspace_id: str) -> IndexStats:
        """
        Get statistics about the index for a workspace.

        Args:
            workspace_id: Workspace ID

        Returns:
            IndexStats with document counts
        """
        # Count documents by type from hash cache
        by_type: Dict[str, int] = defaultdict(int)
        total = 0

        for doc_id in self._content_hashes:
            if doc_id.startswith("project_"):
                by_type["project"] += 1
                total += 1
            elif doc_id.startswith("task_"):
                by_type["task"] += 1
                total += 1
            elif doc_id.startswith(f"activity_{workspace_id}"):
                by_type["activity"] += 1
                total += 1
            elif doc_id.startswith("document_"):
                by_type["document"] += 1
                total += 1

        return IndexStats(
            total_documents=total,
            documents_by_type=dict(by_type),
            workspace_id=workspace_id,
            last_sync=datetime.now(timezone.utc),
        )


# Global indexer instance
_indexer: Optional[ContextIndexer] = None


def get_context_indexer(
    workspace_id: str,
    embedding_service: Optional[EmbeddingService] = None,
    vector_store: Optional[VectorStore] = None,
) -> ContextIndexer:
    """
    Get or create a context indexer.

    If embedding_service and vector_store are not provided,
    attempts to use the KB module's services.

    Args:
        workspace_id: Workspace ID (for future workspace-specific indexers)
        embedding_service: Optional embedding service
        vector_store: Optional vector store

    Returns:
        ContextIndexer instance
    """
    global _indexer

    if _indexer is not None:
        return _indexer

    if embedding_service is None or vector_store is None:
        raise ValueError(
            "embedding_service and vector_store are required for first initialization"
        )

    _indexer = ContextIndexer(embedding_service, vector_store)
    return _indexer


def reset_indexer() -> None:
    """Reset the global indexer (for testing)."""
    global _indexer
    _indexer = None
