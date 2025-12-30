"""
Tests for Context Sync Service

@see docs/modules/bm-dm/stories/dm-06-6-rag-context-indexing.md
Epic: DM-06 | Story: DM-06.6
"""
import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from rag.context_sync import (
    ContextSyncService,
    get_context_sync_service,
    reset_sync_service,
)


@pytest.fixture
def mock_indexer():
    """Create a mock indexer."""
    indexer = AsyncMock()
    indexer.index_project.return_value = True
    indexer.index_task.return_value = True
    indexer.index_activity_batch.return_value = 5
    indexer.index_document.return_value = True
    indexer.delete_document.return_value = True
    return indexer


@pytest.fixture
def mock_data_fetcher():
    """Create a mock data fetcher function."""

    async def fetcher(resource_type: str, workspace_id: str):
        if resource_type == "projects":
            return [
                {"id": "p1", "name": "Project 1", "description": "Description 1"},
                {"id": "p2", "name": "Project 2", "description": "Description 2"},
            ]
        elif resource_type == "tasks":
            return [
                {
                    "id": "t1",
                    "title": "Task 1",
                    "description": "Task desc 1",
                    "projectId": "p1",
                    "status": "open",
                },
            ]
        elif resource_type == "activities":
            return [
                {
                    "timestamp": "2025-01-01T10:00:00Z",
                    "action": "created",
                    "user": "alice",
                },
            ]
        return []

    return fetcher


@pytest.fixture
def sync_service(mock_indexer, mock_data_fetcher):
    """Create a sync service with mocked dependencies."""
    return ContextSyncService(mock_indexer, mock_data_fetcher, sync_interval=60)


class TestContextSyncService:
    """Tests for ContextSyncService initialization."""

    def test_initializes_with_defaults(self, mock_indexer, mock_data_fetcher):
        """Should initialize with default sync interval."""
        service = ContextSyncService(mock_indexer, mock_data_fetcher)

        assert service.indexer is mock_indexer
        assert service.data_fetcher is mock_data_fetcher
        assert service.sync_interval == 3600
        assert service._running is False
        assert service._sync_task is None

    def test_initializes_with_custom_interval(self, mock_indexer, mock_data_fetcher):
        """Should accept custom sync interval."""
        service = ContextSyncService(
            mock_indexer, mock_data_fetcher, sync_interval=300
        )

        assert service.sync_interval == 300


class TestStartStop:
    """Tests for start and stop methods."""

    @pytest.mark.asyncio
    async def test_start_sets_running(self, sync_service):
        """Should set running flag on start."""
        await sync_service.start()

        assert sync_service._running is True
        assert sync_service.is_running is True

        await sync_service.stop()

    @pytest.mark.asyncio
    async def test_stop_clears_running(self, sync_service):
        """Should clear running flag on stop."""
        await sync_service.start()
        await sync_service.stop()

        assert sync_service._running is False
        assert sync_service.is_running is False

    @pytest.mark.asyncio
    async def test_start_creates_sync_task(self, sync_service):
        """Should create periodic sync task."""
        await sync_service.start()

        assert sync_service._sync_task is not None
        assert isinstance(sync_service._sync_task, asyncio.Task)

        await sync_service.stop()

    @pytest.mark.asyncio
    async def test_stop_cancels_sync_task(self, sync_service):
        """Should cancel periodic sync task on stop."""
        await sync_service.start()
        task = sync_service._sync_task

        await sync_service.stop()

        assert sync_service._sync_task is None
        assert task.cancelled() or task.done()

    @pytest.mark.asyncio
    async def test_start_twice_is_safe(self, sync_service):
        """Should handle starting twice gracefully."""
        await sync_service.start()
        await sync_service.start()  # Should not raise

        assert sync_service._running is True

        await sync_service.stop()

    @pytest.mark.asyncio
    async def test_stop_without_start_is_safe(self, sync_service):
        """Should handle stopping without start gracefully."""
        await sync_service.stop()  # Should not raise

        assert sync_service._running is False


class TestSyncWorkspace:
    """Tests for sync_workspace method."""

    @pytest.mark.asyncio
    async def test_syncs_all_content(self, sync_service, mock_indexer):
        """Should sync all projects, tasks, and activities."""
        counts = await sync_service.sync_workspace("ws_123")

        assert counts["projects"] >= 0
        assert counts["tasks"] >= 0
        assert counts["activities"] >= 0

    @pytest.mark.asyncio
    async def test_calls_indexer_for_projects(self, sync_service, mock_indexer):
        """Should call indexer.index_project for each project."""
        await sync_service.sync_workspace("ws_123")

        # Should be called for each project returned by data_fetcher
        assert mock_indexer.index_project.call_count == 2

    @pytest.mark.asyncio
    async def test_calls_indexer_for_tasks(self, sync_service, mock_indexer):
        """Should call indexer.index_task for each task."""
        await sync_service.sync_workspace("ws_123")

        mock_indexer.index_task.assert_called()

    @pytest.mark.asyncio
    async def test_calls_indexer_for_activities(self, sync_service, mock_indexer):
        """Should call indexer.index_activity_batch for activities."""
        await sync_service.sync_workspace("ws_123")

        mock_indexer.index_activity_batch.assert_called_once()

    @pytest.mark.asyncio
    async def test_updates_last_sync(self, sync_service):
        """Should update last sync timestamp."""
        await sync_service.sync_workspace("ws_123")

        last_sync = sync_service.get_last_sync("ws_123")
        assert last_sync is not None
        assert isinstance(last_sync, datetime)

    @pytest.mark.asyncio
    async def test_returns_counts(self, sync_service):
        """Should return counts by type."""
        counts = await sync_service.sync_workspace("ws_123")

        assert "projects" in counts
        assert "tasks" in counts
        assert "activities" in counts

    @pytest.mark.asyncio
    async def test_handles_indexer_error(self, sync_service, mock_indexer):
        """Should continue processing after indexer error."""
        mock_indexer.index_project.side_effect = [
            Exception("Failed"),
            True,
        ]

        # Should not raise
        counts = await sync_service.sync_workspace("ws_123")

        # Should still return counts (one failed, one succeeded)
        assert counts["projects"] == 1


class TestHandleEvent:
    """Tests for handle_event method."""

    @pytest.mark.asyncio
    async def test_handles_project_created(self, sync_service, mock_indexer):
        """Should index on project.created event."""
        event = {
            "type": "project.created",
            "workspaceId": "ws_123",
            "data": {
                "id": "p1",
                "name": "New Project",
                "description": "Description",
            },
        }

        await sync_service.handle_event(event)

        mock_indexer.index_project.assert_called_once_with(
            project_id="p1",
            name="New Project",
            description="Description",
            workspace_id="ws_123",
            metadata=None,
        )

    @pytest.mark.asyncio
    async def test_handles_project_updated(self, sync_service, mock_indexer):
        """Should re-index on project.updated event."""
        event = {
            "type": "project.updated",
            "workspaceId": "ws_123",
            "data": {
                "id": "p1",
                "name": "Updated Project",
                "description": "New description",
            },
        }

        await sync_service.handle_event(event)

        mock_indexer.index_project.assert_called_once()

    @pytest.mark.asyncio
    async def test_handles_project_deleted(self, sync_service, mock_indexer):
        """Should delete on project.deleted event."""
        event = {
            "type": "project.deleted",
            "workspaceId": "ws_123",
            "data": {"id": "p1"},
        }

        await sync_service.handle_event(event)

        mock_indexer.delete_document.assert_called_with("project_p1")

    @pytest.mark.asyncio
    async def test_handles_task_created(self, sync_service, mock_indexer):
        """Should index on task.created event."""
        event = {
            "type": "task.created",
            "workspaceId": "ws_123",
            "data": {
                "id": "t1",
                "title": "New Task",
                "description": "Task description",
                "projectId": "p1",
                "status": "open",
            },
        }

        await sync_service.handle_event(event)

        mock_indexer.index_task.assert_called_once_with(
            task_id="t1",
            title="New Task",
            description="Task description",
            project_id="p1",
            workspace_id="ws_123",
            status="open",
            metadata=None,
        )

    @pytest.mark.asyncio
    async def test_handles_task_updated(self, sync_service, mock_indexer):
        """Should re-index on task.updated event."""
        event = {
            "type": "task.updated",
            "workspaceId": "ws_123",
            "data": {
                "id": "t1",
                "title": "Updated Task",
                "description": "New desc",
                "projectId": "p1",
                "status": "in-progress",
            },
        }

        await sync_service.handle_event(event)

        mock_indexer.index_task.assert_called_once()

    @pytest.mark.asyncio
    async def test_handles_task_deleted(self, sync_service, mock_indexer):
        """Should delete on task.deleted event."""
        event = {
            "type": "task.deleted",
            "workspaceId": "ws_123",
            "data": {"id": "t1"},
        }

        await sync_service.handle_event(event)

        mock_indexer.delete_document.assert_called_with("task_t1")

    @pytest.mark.asyncio
    async def test_handles_document_created(self, sync_service, mock_indexer):
        """Should index on document.created event."""
        event = {
            "type": "document.created",
            "workspaceId": "ws_123",
            "data": {
                "id": "d1",
                "title": "New Document",
                "content": "Document content",
            },
        }

        await sync_service.handle_event(event)

        mock_indexer.index_document.assert_called_once()

    @pytest.mark.asyncio
    async def test_handles_document_deleted(self, sync_service, mock_indexer):
        """Should delete on document.deleted event."""
        event = {
            "type": "document.deleted",
            "workspaceId": "ws_123",
            "data": {"id": "d1"},
        }

        await sync_service.handle_event(event)

        mock_indexer.delete_document.assert_called_with("document_d1")

    @pytest.mark.asyncio
    async def test_ignores_unknown_event_type(self, sync_service, mock_indexer):
        """Should ignore unknown event types."""
        event = {
            "type": "unknown.event",
            "workspaceId": "ws_123",
            "data": {},
        }

        await sync_service.handle_event(event)

        mock_indexer.index_project.assert_not_called()
        mock_indexer.index_task.assert_not_called()
        mock_indexer.delete_document.assert_not_called()

    @pytest.mark.asyncio
    async def test_ignores_event_without_workspace(self, sync_service, mock_indexer):
        """Should ignore events without workspaceId."""
        event = {
            "type": "project.created",
            "data": {"id": "p1", "name": "Project"},
        }

        await sync_service.handle_event(event)

        mock_indexer.index_project.assert_not_called()

    @pytest.mark.asyncio
    async def test_handles_workspace_id_snake_case(self, sync_service, mock_indexer):
        """Should handle workspace_id in snake_case."""
        event = {
            "type": "project.created",
            "workspace_id": "ws_123",
            "data": {
                "id": "p1",
                "name": "Project",
                "description": "Desc",
            },
        }

        await sync_service.handle_event(event)

        mock_indexer.index_project.assert_called_once()

    @pytest.mark.asyncio
    async def test_tracks_event_counts(self, sync_service):
        """Should track event counts."""
        events = [
            {
                "type": "project.created",
                "workspaceId": "ws_123",
                "data": {"id": "p1", "name": "P1", "description": "D1"},
            },
            {
                "type": "project.created",
                "workspaceId": "ws_123",
                "data": {"id": "p2", "name": "P2", "description": "D2"},
            },
            {
                "type": "task.created",
                "workspaceId": "ws_123",
                "data": {
                    "id": "t1",
                    "title": "T1",
                    "description": "TD1",
                    "projectId": "p1",
                    "status": "open",
                },
            },
        ]

        for event in events:
            await sync_service.handle_event(event)

        counts = sync_service.get_event_counts()

        assert counts["project.created"] == 2
        assert counts["task.created"] == 1

    @pytest.mark.asyncio
    async def test_handles_task_project_id_snake_case(
        self, sync_service, mock_indexer
    ):
        """Should handle project_id in snake_case for tasks."""
        event = {
            "type": "task.created",
            "workspaceId": "ws_123",
            "data": {
                "id": "t1",
                "title": "Task",
                "description": "Desc",
                "project_id": "p1",  # snake_case
                "status": "open",
            },
        }

        await sync_service.handle_event(event)

        call_args = mock_indexer.index_task.call_args
        assert call_args.kwargs["project_id"] == "p1"


class TestPeriodicSync:
    """Tests for periodic sync functionality."""

    @pytest.mark.asyncio
    async def test_periodic_sync_runs(self, mock_indexer, mock_data_fetcher):
        """Should run periodic sync at interval."""
        # Create service with short interval for testing
        service = ContextSyncService(
            mock_indexer, mock_data_fetcher, sync_interval=0.1
        )

        # Add a workspace to track
        await service.sync_workspace("ws_123")

        await service.start()

        # Wait for periodic sync to run
        await asyncio.sleep(0.2)

        await service.stop()

        # Should have called index methods multiple times
        assert mock_indexer.index_project.call_count >= 2


class TestGetLastSync:
    """Tests for get_last_sync method."""

    @pytest.mark.asyncio
    async def test_returns_none_for_unknown_workspace(self, sync_service):
        """Should return None for workspace that hasn't synced."""
        result = sync_service.get_last_sync("unknown_ws")

        assert result is None

    @pytest.mark.asyncio
    async def test_returns_timestamp_after_sync(self, sync_service):
        """Should return timestamp after sync."""
        await sync_service.sync_workspace("ws_123")

        result = sync_service.get_last_sync("ws_123")

        assert result is not None
        assert isinstance(result, datetime)


class TestGetEventCounts:
    """Tests for get_event_counts method."""

    def test_returns_empty_initially(self, sync_service):
        """Should return empty dict initially."""
        counts = sync_service.get_event_counts()

        assert counts == {}

    @pytest.mark.asyncio
    async def test_returns_counts_after_events(self, sync_service):
        """Should return counts after processing events."""
        event = {
            "type": "project.created",
            "workspaceId": "ws_123",
            "data": {"id": "p1", "name": "P1", "description": "D1"},
        }

        await sync_service.handle_event(event)

        counts = sync_service.get_event_counts()

        assert counts["project.created"] == 1


class TestGlobalSyncService:
    """Tests for global sync service functions."""

    def test_get_context_sync_service_creates_instance(
        self, mock_indexer, mock_data_fetcher
    ):
        """Should create service on first call."""
        reset_sync_service()

        service = get_context_sync_service(
            indexer=mock_indexer,
            data_fetcher=mock_data_fetcher,
        )

        assert isinstance(service, ContextSyncService)

    def test_get_context_sync_service_returns_same_instance(
        self, mock_indexer, mock_data_fetcher
    ):
        """Should return same instance on subsequent calls."""
        reset_sync_service()

        service1 = get_context_sync_service(
            indexer=mock_indexer,
            data_fetcher=mock_data_fetcher,
        )
        service2 = get_context_sync_service()

        assert service1 is service2

    def test_get_context_sync_service_requires_deps(self):
        """Should require dependencies on first call."""
        reset_sync_service()

        with pytest.raises(ValueError, match="indexer and data_fetcher"):
            get_context_sync_service()

    def test_reset_sync_service(self, mock_indexer, mock_data_fetcher):
        """Should reset the global service."""
        reset_sync_service()
        get_context_sync_service(
            indexer=mock_indexer,
            data_fetcher=mock_data_fetcher,
        )

        reset_sync_service()

        # Should require deps again
        with pytest.raises(ValueError):
            get_context_sync_service()


class TestDocumentEventHandling:
    """Additional tests for document event handling."""

    @pytest.mark.asyncio
    async def test_document_created_uses_content(self, sync_service, mock_indexer):
        """Should use content field for document indexing."""
        event = {
            "type": "document.created",
            "workspaceId": "ws_123",
            "data": {
                "id": "d1",
                "title": "Doc Title",
                "content": "Full document content here",
            },
        }

        await sync_service.handle_event(event)

        call_args = mock_indexer.index_document.call_args
        doc = call_args.args[0]
        assert "Full document content here" in doc.content

    @pytest.mark.asyncio
    async def test_document_created_fallback_to_title(
        self, sync_service, mock_indexer
    ):
        """Should fall back to title if no content."""
        event = {
            "type": "document.created",
            "workspaceId": "ws_123",
            "data": {
                "id": "d1",
                "title": "Doc Title Only",
            },
        }

        await sync_service.handle_event(event)

        call_args = mock_indexer.index_document.call_args
        doc = call_args.args[0]
        assert "Doc Title Only" in doc.content

    @pytest.mark.asyncio
    async def test_document_updated_reindexes(self, sync_service, mock_indexer):
        """Should re-index on document.updated."""
        event = {
            "type": "document.updated",
            "workspaceId": "ws_123",
            "data": {
                "id": "d1",
                "title": "Updated Doc",
                "content": "Updated content",
            },
        }

        await sync_service.handle_event(event)

        mock_indexer.index_document.assert_called_once()
