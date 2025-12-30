"""
Tests for Context Indexer

@see docs/modules/bm-dm/stories/dm-06-6-rag-context-indexing.md
Epic: DM-06 | Story: DM-06.6
"""
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from rag.context_indexer import (
    ContextIndexer,
    get_context_indexer,
    reset_indexer,
)
from rag.models import ContextDocument, ContextDocumentType


@pytest.fixture
def mock_embedding_service():
    """Create a mock embedding service."""
    service = AsyncMock()
    # Return 768-dimensional embedding vector
    service.embed_text.return_value = [0.1] * 768
    return service


@pytest.fixture
def mock_vector_store():
    """Create a mock vector store."""
    store = AsyncMock()
    store.upsert.return_value = None
    store.search.return_value = []
    store.delete.return_value = None
    store.delete_by_filter.return_value = 0
    return store


@pytest.fixture
def indexer(mock_embedding_service, mock_vector_store):
    """Create an indexer with mocked dependencies."""
    return ContextIndexer(mock_embedding_service, mock_vector_store)


class TestContextIndexer:
    """Tests for ContextIndexer class."""

    def test_initializes_with_services(self, mock_embedding_service, mock_vector_store):
        """Should initialize with embedding service and vector store."""
        indexer = ContextIndexer(mock_embedding_service, mock_vector_store)

        assert indexer.embedding_service is mock_embedding_service
        assert indexer.vector_store is mock_vector_store
        assert indexer._content_hashes == {}

    def test_id_prefix(self, indexer):
        """Should have ctx_ prefix for IDs."""
        assert ContextIndexer.ID_PREFIX == "ctx_"

    def test_get_index_id(self, indexer):
        """Should add prefix to document ID."""
        index_id = indexer._get_index_id("doc_123")

        assert index_id == "ctx_doc_123"


class TestIndexDocument:
    """Tests for index_document method."""

    @pytest.mark.asyncio
    async def test_indexes_new_document(
        self, indexer, mock_embedding_service, mock_vector_store
    ):
        """Should index new document."""
        doc = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Project description",
        )

        result = await indexer.index_document(doc)

        assert result is True
        mock_embedding_service.embed_text.assert_called_once_with(
            "Project description"
        )
        mock_vector_store.upsert.assert_called_once()

        # Check upsert call arguments
        call_args = mock_vector_store.upsert.call_args
        assert call_args.kwargs["id"] == "ctx_doc_123"
        assert len(call_args.kwargs["embedding"]) == 768
        assert call_args.kwargs["metadata"]["type"] == "project"
        assert call_args.kwargs["metadata"]["workspace_id"] == "ws_123"

    @pytest.mark.asyncio
    async def test_skips_unchanged_document(self, indexer, mock_embedding_service):
        """Should skip unchanged document."""
        doc = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Project description",
        )

        # First index
        result1 = await indexer.index_document(doc)
        assert result1 is True

        # Second index with same content
        result2 = await indexer.index_document(doc)
        assert result2 is False

        # Should only have called embed_text once
        assert mock_embedding_service.embed_text.call_count == 1

    @pytest.mark.asyncio
    async def test_reindexes_changed_document(self, indexer, mock_embedding_service):
        """Should re-index when content changes."""
        doc1 = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Original content",
        )

        doc2 = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Updated content",
        )

        # First index
        result1 = await indexer.index_document(doc1)
        assert result1 is True

        # Second index with different content
        result2 = await indexer.index_document(doc2)
        assert result2 is True

        # Should have called embed_text twice
        assert mock_embedding_service.embed_text.call_count == 2

    @pytest.mark.asyncio
    async def test_includes_user_id_in_metadata(
        self, indexer, mock_vector_store
    ):
        """Should include user_id in metadata when provided."""
        doc = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Test",
            user_id="user_456",
        )

        await indexer.index_document(doc)

        call_args = mock_vector_store.upsert.call_args
        assert call_args.kwargs["metadata"]["user_id"] == "user_456"

    @pytest.mark.asyncio
    async def test_includes_custom_metadata(self, indexer, mock_vector_store):
        """Should include custom metadata."""
        doc = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Test",
            metadata={"priority": "high", "category": "engineering"},
        )

        await indexer.index_document(doc)

        call_args = mock_vector_store.upsert.call_args
        assert call_args.kwargs["metadata"]["priority"] == "high"
        assert call_args.kwargs["metadata"]["category"] == "engineering"

    @pytest.mark.asyncio
    async def test_raises_on_embedding_error(self, indexer, mock_embedding_service):
        """Should raise when embedding fails."""
        mock_embedding_service.embed_text.side_effect = Exception("Embedding failed")

        doc = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Test",
        )

        with pytest.raises(Exception, match="Embedding failed"):
            await indexer.index_document(doc)


class TestIndexBatch:
    """Tests for index_batch method."""

    @pytest.mark.asyncio
    async def test_indexes_batch(self, indexer):
        """Should index batch of documents."""
        docs = [
            ContextDocument(
                id=f"doc_{i}",
                document_type=ContextDocumentType.PROJECT,
                workspace_id="ws_123",
                content=f"Content {i}",
            )
            for i in range(5)
        ]

        result = await indexer.index_batch(docs)

        assert result.indexed == 5
        assert result.skipped == 0
        assert result.failed == 0
        assert result.total == 5
        assert result.success is True

    @pytest.mark.asyncio
    async def test_batch_skips_unchanged(self, indexer):
        """Should skip unchanged documents in batch."""
        docs = [
            ContextDocument(
                id=f"doc_{i}",
                document_type=ContextDocumentType.PROJECT,
                workspace_id="ws_123",
                content=f"Content {i}",
            )
            for i in range(3)
        ]

        # First batch
        result1 = await indexer.index_batch(docs)
        assert result1.indexed == 3

        # Second batch with same documents
        result2 = await indexer.index_batch(docs)
        assert result2.indexed == 0
        assert result2.skipped == 3

    @pytest.mark.asyncio
    async def test_batch_handles_failures(self, indexer, mock_embedding_service):
        """Should continue processing after failure."""
        docs = [
            ContextDocument(
                id=f"doc_{i}",
                document_type=ContextDocumentType.PROJECT,
                workspace_id="ws_123",
                content=f"Content {i}",
            )
            for i in range(3)
        ]

        # Make second call fail
        call_count = 0

        async def embed_with_failure(text):
            nonlocal call_count
            call_count += 1
            if call_count == 2:
                raise Exception("Embedding failed")
            return [0.1] * 768

        mock_embedding_service.embed_text.side_effect = embed_with_failure

        result = await indexer.index_batch(docs)

        assert result.indexed == 2
        assert result.failed == 1
        assert result.success is False
        assert len(result.errors) == 1


class TestIndexProject:
    """Tests for index_project method."""

    @pytest.mark.asyncio
    async def test_indexes_project(self, indexer, mock_vector_store):
        """Should index project with name and description."""
        result = await indexer.index_project(
            project_id="proj_123",
            name="My Project",
            description="A great project",
            workspace_id="ws_123",
        )

        assert result is True
        call_args = mock_vector_store.upsert.call_args
        assert "ctx_project_proj_123" == call_args.kwargs["id"]
        assert call_args.kwargs["metadata"]["project_id"] == "proj_123"
        assert call_args.kwargs["metadata"]["name"] == "My Project"

    @pytest.mark.asyncio
    async def test_project_content_format(self, indexer, mock_embedding_service):
        """Should format project content correctly."""
        await indexer.index_project(
            project_id="proj_123",
            name="My Project",
            description="A great project",
            workspace_id="ws_123",
        )

        call_args = mock_embedding_service.embed_text.call_args
        expected_content = "Project: My Project\n\nA great project"
        assert call_args.args[0] == expected_content

    @pytest.mark.asyncio
    async def test_project_with_metadata(self, indexer, mock_vector_store):
        """Should include custom metadata."""
        await indexer.index_project(
            project_id="proj_123",
            name="My Project",
            description="Description",
            workspace_id="ws_123",
            metadata={"status": "active", "priority": "high"},
        )

        call_args = mock_vector_store.upsert.call_args
        assert call_args.kwargs["metadata"]["status"] == "active"
        assert call_args.kwargs["metadata"]["priority"] == "high"


class TestIndexTask:
    """Tests for index_task method."""

    @pytest.mark.asyncio
    async def test_indexes_task(self, indexer, mock_vector_store):
        """Should index task with all fields."""
        result = await indexer.index_task(
            task_id="task_123",
            title="Implement feature",
            description="Add new functionality",
            project_id="proj_123",
            workspace_id="ws_123",
            status="in-progress",
        )

        assert result is True
        call_args = mock_vector_store.upsert.call_args
        assert "ctx_task_task_123" == call_args.kwargs["id"]
        assert call_args.kwargs["metadata"]["task_id"] == "task_123"
        assert call_args.kwargs["metadata"]["project_id"] == "proj_123"
        assert call_args.kwargs["metadata"]["status"] == "in-progress"

    @pytest.mark.asyncio
    async def test_task_content_format(self, indexer, mock_embedding_service):
        """Should format task content correctly."""
        await indexer.index_task(
            task_id="task_123",
            title="Implement feature",
            description="Add new functionality",
            project_id="proj_123",
            workspace_id="ws_123",
            status="in-progress",
        )

        call_args = mock_embedding_service.embed_text.call_args
        expected_content = (
            "Task: Implement feature\n"
            "Status: in-progress\n\n"
            "Add new functionality"
        )
        assert call_args.args[0] == expected_content


class TestIndexActivityBatch:
    """Tests for index_activity_batch method."""

    @pytest.mark.asyncio
    async def test_indexes_activities(self, indexer):
        """Should index activities grouped by day."""
        activities = [
            {
                "timestamp": "2025-01-01T10:00:00Z",
                "action": "created",
                "user": "alice",
                "target": "task-1",
            },
            {
                "timestamp": "2025-01-01T14:00:00Z",
                "action": "updated",
                "user": "bob",
                "target": "task-2",
            },
            {
                "timestamp": "2025-01-02T09:00:00Z",
                "action": "completed",
                "user": "alice",
                "target": "task-1",
            },
        ]

        count = await indexer.index_activity_batch(activities, "ws_123")

        # Should create 2 daily summaries
        assert count == 2

    @pytest.mark.asyncio
    async def test_empty_activities(self, indexer):
        """Should handle empty activities list."""
        count = await indexer.index_activity_batch([], "ws_123")

        assert count == 0

    @pytest.mark.asyncio
    async def test_activity_content_format(
        self, indexer, mock_embedding_service
    ):
        """Should format activity summaries correctly."""
        activities = [
            {
                "timestamp": "2025-01-01T10:00:00Z",
                "action": "created",
                "user": "alice",
                "target": "task-1",
            },
        ]

        await indexer.index_activity_batch(activities, "ws_123")

        call_args = mock_embedding_service.embed_text.call_args
        content = call_args.args[0]
        assert "Activity Summary for 2025-01-01:" in content
        assert "- alice created task-1" in content


class TestSearch:
    """Tests for search method."""

    @pytest.mark.asyncio
    async def test_search_returns_results(
        self, indexer, mock_embedding_service, mock_vector_store
    ):
        """Should return search results."""
        mock_vector_store.search.return_value = [
            {
                "id": "ctx_doc_1",
                "score": 0.95,
                "metadata": {
                    "type": "task",
                    "content": "Authentication task",
                    "workspace_id": "ws_123",
                },
            },
            {
                "id": "ctx_doc_2",
                "score": 0.85,
                "metadata": {
                    "type": "project",
                    "content": "Auth project",
                    "workspace_id": "ws_123",
                },
            },
        ]

        results = await indexer.search("authentication", "ws_123")

        assert len(results) == 2
        assert results[0].id == "doc_1"
        assert results[0].score == 0.95
        assert results[0].document_type == "task"
        assert results[1].id == "doc_2"

    @pytest.mark.asyncio
    async def test_search_with_type_filter(
        self, indexer, mock_embedding_service, mock_vector_store
    ):
        """Should filter by type."""
        await indexer.search("query", "ws_123", type_filter="task")

        call_args = mock_vector_store.search.call_args
        assert call_args.kwargs["filters"]["type"] == "task"

    @pytest.mark.asyncio
    async def test_search_with_limit(
        self, indexer, mock_embedding_service, mock_vector_store
    ):
        """Should respect limit parameter."""
        await indexer.search("query", "ws_123", limit=5)

        call_args = mock_vector_store.search.call_args
        assert call_args.kwargs["limit"] == 5

    @pytest.mark.asyncio
    async def test_search_includes_workspace_filter(
        self, indexer, mock_embedding_service, mock_vector_store
    ):
        """Should always filter by workspace."""
        await indexer.search("query", "ws_123")

        call_args = mock_vector_store.search.call_args
        assert call_args.kwargs["filters"]["workspace_id"] == "ws_123"

    @pytest.mark.asyncio
    async def test_search_generates_query_embedding(
        self, indexer, mock_embedding_service, mock_vector_store
    ):
        """Should embed the query text."""
        await indexer.search("authentication tasks", "ws_123")

        mock_embedding_service.embed_text.assert_called_with(
            "authentication tasks"
        )


class TestDeleteDocument:
    """Tests for delete_document method."""

    @pytest.mark.asyncio
    async def test_deletes_document(self, indexer, mock_vector_store):
        """Should delete document from index."""
        # First index a document
        doc = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Test",
        )
        await indexer.index_document(doc)

        # Delete it
        result = await indexer.delete_document("doc_123")

        assert result is True
        mock_vector_store.delete.assert_called_with("ctx_doc_123")

    @pytest.mark.asyncio
    async def test_clears_hash_cache_on_delete(self, indexer, mock_vector_store):
        """Should clear hash cache on delete."""
        # First index a document
        doc = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Test",
        )
        await indexer.index_document(doc)
        assert "doc_123" in indexer._content_hashes

        # Delete it
        await indexer.delete_document("doc_123")

        assert "doc_123" not in indexer._content_hashes

    @pytest.mark.asyncio
    async def test_handles_delete_error(self, indexer, mock_vector_store):
        """Should return False on delete error."""
        mock_vector_store.delete.side_effect = Exception("Delete failed")

        result = await indexer.delete_document("doc_123")

        assert result is False


class TestClearWorkspace:
    """Tests for clear_workspace method."""

    @pytest.mark.asyncio
    async def test_clears_workspace(self, indexer, mock_vector_store):
        """Should clear all documents for workspace."""
        mock_vector_store.delete_by_filter.return_value = 10

        result = await indexer.clear_workspace("ws_123")

        assert result == 10
        mock_vector_store.delete_by_filter.assert_called_with(
            {"workspace_id": "ws_123"}
        )

    @pytest.mark.asyncio
    async def test_raises_on_clear_error(self, indexer, mock_vector_store):
        """Should raise on clear error."""
        mock_vector_store.delete_by_filter.side_effect = Exception("Clear failed")

        with pytest.raises(Exception, match="Clear failed"):
            await indexer.clear_workspace("ws_123")


class TestGetStats:
    """Tests for get_stats method."""

    @pytest.mark.asyncio
    async def test_returns_stats(self, indexer):
        """Should return index statistics."""
        # Index some documents
        await indexer.index_project(
            project_id="p1",
            name="Project",
            description="Desc",
            workspace_id="ws_123",
        )
        await indexer.index_task(
            task_id="t1",
            title="Task",
            description="Desc",
            project_id="p1",
            workspace_id="ws_123",
            status="open",
        )

        stats = indexer.get_stats("ws_123")

        assert stats.workspace_id == "ws_123"
        assert stats.total_documents >= 2
        assert "project" in stats.documents_by_type
        assert "task" in stats.documents_by_type

    def test_empty_stats(self, indexer):
        """Should return empty stats for new indexer."""
        stats = indexer.get_stats("ws_123")

        assert stats.total_documents == 0
        assert stats.documents_by_type == {}


class TestGlobalIndexer:
    """Tests for global indexer functions."""

    def test_get_context_indexer_creates_instance(
        self, mock_embedding_service, mock_vector_store
    ):
        """Should create indexer on first call."""
        reset_indexer()

        indexer = get_context_indexer(
            workspace_id="ws_123",
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
        )

        assert isinstance(indexer, ContextIndexer)

    def test_get_context_indexer_returns_same_instance(
        self, mock_embedding_service, mock_vector_store
    ):
        """Should return same instance on subsequent calls."""
        reset_indexer()

        indexer1 = get_context_indexer(
            workspace_id="ws_123",
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
        )
        indexer2 = get_context_indexer(workspace_id="ws_456")

        assert indexer1 is indexer2

    def test_get_context_indexer_requires_services(self):
        """Should require services on first call."""
        reset_indexer()

        with pytest.raises(ValueError, match="embedding_service and vector_store"):
            get_context_indexer(workspace_id="ws_123")

    def test_reset_indexer(self, mock_embedding_service, mock_vector_store):
        """Should reset the global indexer."""
        reset_indexer()
        get_context_indexer(
            workspace_id="ws_123",
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
        )

        reset_indexer()

        # Should require services again
        with pytest.raises(ValueError):
            get_context_indexer(workspace_id="ws_123")
