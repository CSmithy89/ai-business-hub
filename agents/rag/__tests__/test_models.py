"""
Tests for RAG Context Models

@see docs/modules/bm-dm/stories/dm-06-6-rag-context-indexing.md
Epic: DM-06 | Story: DM-06.6
"""
from datetime import datetime, timezone

import pytest

from rag.models import (
    ContextDocument,
    ContextDocumentType,
    IndexResult,
    IndexStats,
    SearchResult,
)


class TestContextDocumentType:
    """Tests for ContextDocumentType enum."""

    def test_enum_values(self):
        """Should have all expected document types."""
        assert ContextDocumentType.PROJECT == "project"
        assert ContextDocumentType.TASK == "task"
        assert ContextDocumentType.DOCUMENT == "document"
        assert ContextDocumentType.ACTIVITY == "activity"
        assert ContextDocumentType.KNOWLEDGE_ARTICLE == "knowledge_article"

    def test_enum_string_comparison(self):
        """Should be comparable to strings."""
        assert ContextDocumentType.PROJECT.value == "project"
        assert str(ContextDocumentType.TASK) == "ContextDocumentType.TASK"


class TestContextDocument:
    """Tests for ContextDocument model."""

    def test_creates_document_with_required_fields(self):
        """Should create document with required fields."""
        doc = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Test content",
        )

        assert doc.id == "doc_123"
        assert doc.document_type == ContextDocumentType.PROJECT
        assert doc.workspace_id == "ws_123"
        assert doc.content == "Test content"
        assert doc.metadata == {}
        assert doc.user_id is None

    def test_creates_document_with_all_fields(self):
        """Should create document with all fields."""
        fixed_time = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)

        doc = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.TASK,
            workspace_id="ws_123",
            content="Task description",
            metadata={"priority": "high"},
            user_id="user_456",
            created_at=fixed_time,
            updated_at=fixed_time,
        )

        assert doc.id == "doc_123"
        assert doc.document_type == ContextDocumentType.TASK
        assert doc.metadata == {"priority": "high"}
        assert doc.user_id == "user_456"
        assert doc.created_at == fixed_time
        assert doc.updated_at == fixed_time

    def test_content_hash_consistency(self):
        """Should generate consistent hash for same content."""
        doc1 = ContextDocument(
            id="doc_1",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Same content",
        )
        doc2 = ContextDocument(
            id="doc_2",
            document_type=ContextDocumentType.TASK,
            workspace_id="ws_456",
            content="Same content",
        )

        assert doc1.content_hash == doc2.content_hash

    def test_content_hash_changes_with_content(self):
        """Should generate different hash for different content."""
        doc1 = ContextDocument(
            id="doc_1",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Content A",
        )
        doc2 = ContextDocument(
            id="doc_1",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Content B",
        )

        assert doc1.content_hash != doc2.content_hash

    def test_content_hash_is_16_chars(self):
        """Should return 16-character hash."""
        doc = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Test content for hashing",
        )

        assert len(doc.content_hash) == 16
        assert doc.content_hash.isalnum()

    def test_alias_fields(self):
        """Should support camelCase aliases."""
        doc = ContextDocument(
            id="doc_123",
            documentType=ContextDocumentType.ACTIVITY,
            workspaceId="ws_123",
            content="Test",
            userId="user_123",
        )

        assert doc.document_type == ContextDocumentType.ACTIVITY
        assert doc.workspace_id == "ws_123"
        assert doc.user_id == "user_123"

    def test_to_dict(self):
        """Should convert to dictionary with camelCase keys."""
        fixed_time = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)

        doc = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Test content",
            metadata={"key": "value"},
            user_id="user_456",
            created_at=fixed_time,
            updated_at=fixed_time,
        )

        result = doc.to_dict()

        assert result["id"] == "doc_123"
        assert result["documentType"] == "project"
        assert result["workspaceId"] == "ws_123"
        assert result["content"] == "Test content"
        assert result["metadata"] == {"key": "value"}
        assert result["userId"] == "user_456"
        assert result["contentHash"] == doc.content_hash
        assert result["createdAt"] == "2025-01-01T12:00:00Z"
        assert result["updatedAt"] == "2025-01-01T12:00:00Z"

    def test_default_timestamps(self):
        """Should set default timestamps on creation."""
        doc = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Test",
        )

        assert doc.created_at is not None
        assert doc.updated_at is not None
        assert isinstance(doc.created_at, datetime)
        assert isinstance(doc.updated_at, datetime)

    def test_serialize_datetime(self):
        """Should serialize datetime to ISO format with Z suffix."""
        fixed_time = datetime(2025, 6, 15, 14, 30, 0, tzinfo=timezone.utc)

        doc = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Test",
            created_at=fixed_time,
            updated_at=fixed_time,
        )

        result = doc.to_dict()

        assert result["createdAt"] == "2025-06-15T14:30:00Z"
        assert result["updatedAt"] == "2025-06-15T14:30:00Z"

    def test_empty_content_hash(self):
        """Should handle empty content."""
        doc = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="",
        )

        # Empty string should still produce a valid hash
        assert len(doc.content_hash) == 16

    def test_unicode_content_hash(self):
        """Should handle unicode content."""
        doc = ContextDocument(
            id="doc_123",
            document_type=ContextDocumentType.PROJECT,
            workspace_id="ws_123",
            content="Hello 世界 🌍 مرحبا",
        )

        assert len(doc.content_hash) == 16


class TestIndexResult:
    """Tests for IndexResult model."""

    def test_creates_with_defaults(self):
        """Should create with default zero values."""
        result = IndexResult()

        assert result.indexed == 0
        assert result.skipped == 0
        assert result.failed == 0
        assert result.errors == []
        assert result.total == 0
        assert result.success is True

    def test_creates_with_values(self):
        """Should create with specified values."""
        result = IndexResult(
            indexed=5,
            skipped=3,
            failed=2,
            errors=["Error 1", "Error 2"],
        )

        assert result.indexed == 5
        assert result.skipped == 3
        assert result.failed == 2
        assert result.errors == ["Error 1", "Error 2"]

    def test_total_property(self):
        """Should calculate total correctly."""
        result = IndexResult(indexed=10, skipped=5, failed=2)

        assert result.total == 17

    def test_success_property_true(self):
        """Should return True when no failures."""
        result = IndexResult(indexed=10, skipped=5, failed=0)

        assert result.success is True

    def test_success_property_false(self):
        """Should return False when there are failures."""
        result = IndexResult(indexed=10, skipped=5, failed=1)

        assert result.success is False

    def test_to_dict(self):
        """Should convert to dictionary."""
        result = IndexResult(
            indexed=5,
            skipped=3,
            failed=1,
            errors=["Test error"],
        )

        d = result.to_dict()

        assert d["indexed"] == 5
        assert d["skipped"] == 3
        assert d["failed"] == 1
        assert d["total"] == 9
        assert d["success"] is False
        assert d["errors"] == ["Test error"]


class TestSearchResult:
    """Tests for SearchResult model."""

    def test_creates_with_required_fields(self):
        """Should create with required fields."""
        result = SearchResult(
            id="doc_123",
            document_type="project",
            content="Test content",
            score=0.95,
        )

        assert result.id == "doc_123"
        assert result.document_type == "project"
        assert result.content == "Test content"
        assert result.score == 0.95
        assert result.metadata == {}

    def test_creates_with_all_fields(self):
        """Should create with all fields including metadata."""
        result = SearchResult(
            id="doc_123",
            document_type="task",
            content="Task content",
            score=0.85,
            metadata={"priority": "high", "status": "open"},
        )

        assert result.metadata == {"priority": "high", "status": "open"}

    def test_alias_fields(self):
        """Should support camelCase aliases."""
        result = SearchResult(
            id="doc_123",
            documentType="project",
            content="Test",
            score=0.9,
        )

        assert result.document_type == "project"

    def test_to_dict(self):
        """Should convert to dictionary with camelCase keys."""
        result = SearchResult(
            id="doc_123",
            document_type="task",
            content="Task content",
            score=0.85,
            metadata={"key": "value"},
        )

        d = result.to_dict()

        assert d["id"] == "doc_123"
        assert d["documentType"] == "task"
        assert d["content"] == "Task content"
        assert d["score"] == 0.85
        assert d["metadata"] == {"key": "value"}


class TestIndexStats:
    """Tests for IndexStats model."""

    def test_creates_with_required_fields(self):
        """Should create with required workspace_id."""
        stats = IndexStats(workspace_id="ws_123")

        assert stats.workspace_id == "ws_123"
        assert stats.total_documents == 0
        assert stats.documents_by_type == {}
        assert stats.last_sync is None

    def test_creates_with_all_fields(self):
        """Should create with all fields."""
        fixed_time = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)

        stats = IndexStats(
            total_documents=100,
            documents_by_type={"project": 10, "task": 80, "activity": 10},
            workspace_id="ws_123",
            last_sync=fixed_time,
        )

        assert stats.total_documents == 100
        assert stats.documents_by_type == {
            "project": 10,
            "task": 80,
            "activity": 10,
        }
        assert stats.last_sync == fixed_time

    def test_alias_fields(self):
        """Should support camelCase aliases."""
        stats = IndexStats(
            totalDocuments=50,
            documentsByType={"project": 50},
            workspaceId="ws_123",
        )

        assert stats.total_documents == 50
        assert stats.documents_by_type == {"project": 50}
        assert stats.workspace_id == "ws_123"

    def test_to_dict(self):
        """Should convert to dictionary with camelCase keys."""
        fixed_time = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)

        stats = IndexStats(
            total_documents=100,
            documents_by_type={"project": 10},
            workspace_id="ws_123",
            last_sync=fixed_time,
        )

        d = stats.to_dict()

        assert d["totalDocuments"] == 100
        assert d["documentsByType"] == {"project": 10}
        assert d["workspaceId"] == "ws_123"
        assert d["lastSync"] == "2025-01-01T12:00:00Z"

    def test_to_dict_null_last_sync(self):
        """Should handle null last_sync in to_dict."""
        stats = IndexStats(workspace_id="ws_123")

        d = stats.to_dict()

        assert d["lastSync"] is None

    def test_serialize_last_sync(self):
        """Should serialize last_sync datetime."""
        fixed_time = datetime(2025, 6, 15, 14, 30, 0, tzinfo=timezone.utc)

        stats = IndexStats(workspace_id="ws_123", last_sync=fixed_time)

        d = stats.to_dict()

        assert d["lastSync"] == "2025-06-15T14:30:00Z"
