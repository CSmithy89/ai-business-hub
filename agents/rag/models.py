"""
RAG Context Models

Defines core data models for RAG context indexing:
- ContextDocumentType: Enumeration of indexable document types
- ContextDocument: Document to be indexed for RAG queries
- IndexResult: Result from batch indexing operations
- SearchResult: Result from semantic search operations
- IndexStats: Statistics about the RAG index

@see docs/modules/bm-dm/stories/dm-06-6-rag-context-indexing.md
Epic: DM-06 | Story: DM-06.6
"""
import hashlib
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_serializer


class ContextDocumentType(str, Enum):
    """Types of documents that can be indexed for RAG."""

    PROJECT = "project"
    TASK = "task"
    DOCUMENT = "document"
    ACTIVITY = "activity"
    KNOWLEDGE_ARTICLE = "knowledge_article"


class ContextDocument(BaseModel):
    """
    A document to be indexed for RAG.

    Represents a unit of content that can be embedded and stored
    in the vector database for semantic search.

    Attributes:
        id: Unique document identifier
        document_type: Type of document (project, task, etc.)
        workspace_id: Workspace ID for tenant isolation
        content: Text content to embed
        metadata: Additional metadata for filtering
        user_id: Optional user association
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    id: str = Field(..., description="Unique document identifier")
    document_type: ContextDocumentType = Field(
        ...,
        alias="documentType",
        description="Type of document",
    )
    workspace_id: str = Field(
        ...,
        alias="workspaceId",
        description="Workspace ID for tenant isolation",
    )
    content: str = Field(..., description="Text content to embed")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata for filtering",
    )
    user_id: Optional[str] = Field(
        default=None,
        alias="userId",
        description="Optional user association",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        alias="createdAt",
        description="Creation timestamp",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        alias="updatedAt",
        description="Last update timestamp",
    )

    model_config = {"populate_by_name": True}

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, value: datetime) -> str:
        """Serialize datetime to ISO format."""
        return value.isoformat().replace("+00:00", "Z")

    @field_serializer("document_type")
    def serialize_document_type(self, value: ContextDocumentType) -> str:
        """Serialize document type enum to string."""
        return value.value

    @property
    def content_hash(self) -> str:
        """
        Generate SHA-256 hash of content for change detection.

        Returns first 16 characters of the hex digest for
        efficient storage while maintaining uniqueness.

        Returns:
            16-character hex hash of content
        """
        return hashlib.sha256(self.content.encode("utf-8")).hexdigest()[:16]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with camelCase keys."""
        return {
            "id": self.id,
            "documentType": self.document_type.value,
            "workspaceId": self.workspace_id,
            "content": self.content,
            "metadata": self.metadata,
            "userId": self.user_id,
            "contentHash": self.content_hash,
            "createdAt": self.serialize_datetime(self.created_at),
            "updatedAt": self.serialize_datetime(self.updated_at),
        }


class IndexResult(BaseModel):
    """
    Result from a batch indexing operation.

    Attributes:
        indexed: Number of documents indexed (new or updated)
        skipped: Number of documents skipped (unchanged)
        failed: Number of documents that failed to index
        errors: List of error messages for failed documents
    """

    indexed: int = Field(default=0, description="Documents indexed")
    skipped: int = Field(default=0, description="Documents skipped (unchanged)")
    failed: int = Field(default=0, description="Documents that failed to index")
    errors: List[str] = Field(
        default_factory=list,
        description="Error messages for failed documents",
    )

    @property
    def total(self) -> int:
        """Total documents processed."""
        return self.indexed + self.skipped + self.failed

    @property
    def success(self) -> bool:
        """Whether all documents processed successfully."""
        return self.failed == 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "indexed": self.indexed,
            "skipped": self.skipped,
            "failed": self.failed,
            "total": self.total,
            "success": self.success,
            "errors": self.errors,
        }


class SearchResult(BaseModel):
    """
    Result from a semantic search operation.

    Attributes:
        id: Document ID
        document_type: Type of document
        content: Document content
        score: Similarity score (0-1)
        metadata: Document metadata
    """

    id: str = Field(..., description="Document ID")
    document_type: str = Field(
        ...,
        alias="documentType",
        description="Type of document",
    )
    content: str = Field(..., description="Document content")
    score: float = Field(..., description="Similarity score (0-1)")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Document metadata",
    )

    model_config = {"populate_by_name": True}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with camelCase keys."""
        return {
            "id": self.id,
            "documentType": self.document_type,
            "content": self.content,
            "score": self.score,
            "metadata": self.metadata,
        }


class IndexStats(BaseModel):
    """
    Statistics about the RAG index.

    Attributes:
        total_documents: Total number of indexed documents
        documents_by_type: Count of documents per type
        workspace_id: Workspace ID
        last_sync: Timestamp of last sync operation
    """

    total_documents: int = Field(
        default=0,
        alias="totalDocuments",
        description="Total indexed documents",
    )
    documents_by_type: Dict[str, int] = Field(
        default_factory=dict,
        alias="documentsByType",
        description="Document count per type",
    )
    workspace_id: str = Field(
        ...,
        alias="workspaceId",
        description="Workspace ID",
    )
    last_sync: Optional[datetime] = Field(
        default=None,
        alias="lastSync",
        description="Last sync timestamp",
    )

    model_config = {"populate_by_name": True}

    @field_serializer("last_sync")
    def serialize_last_sync(self, value: Optional[datetime]) -> Optional[str]:
        """Serialize last_sync datetime to ISO format."""
        if value is None:
            return None
        return value.isoformat().replace("+00:00", "Z")

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with camelCase keys."""
        return {
            "totalDocuments": self.total_documents,
            "documentsByType": self.documents_by_type,
            "workspaceId": self.workspace_id,
            "lastSync": self.serialize_last_sync(self.last_sync),
        }
