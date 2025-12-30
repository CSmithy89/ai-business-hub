"""
Context Sync Service

Keeps RAG context index synchronized with application state.

Listens to events and updates the index accordingly.
Also performs periodic full syncs to catch any missed updates.

@see docs/modules/bm-dm/stories/dm-06-6-rag-context-indexing.md
Epic: DM-06 | Story: DM-06.6
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable, Dict, List, Optional

from .context_indexer import ContextIndexer

logger = logging.getLogger(__name__)


# Type alias for data fetcher functions
DataFetcher = Callable[[str, str], Awaitable[List[Dict[str, Any]]]]


class ContextSyncService:
    """
    Keeps RAG context index synchronized with application state.

    Handles event-driven updates for real-time sync and periodic
    full syncs to catch any missed updates.

    Usage:
        service = ContextSyncService(indexer, data_fetcher)
        await service.start()
        await service.handle_event(event)
        await service.stop()

    Attributes:
        indexer: ContextIndexer for indexing documents
        data_fetcher: Async function to fetch data from API
        sync_interval: Seconds between periodic syncs (default 3600)
    """

    def __init__(
        self,
        indexer: ContextIndexer,
        data_fetcher: DataFetcher,
        sync_interval: int = 3600,
    ):
        """
        Initialize the sync service.

        Args:
            indexer: ContextIndexer for indexing operations
            data_fetcher: Async function that fetches data by type and workspace
            sync_interval: Seconds between periodic syncs (default 1 hour)
        """
        self.indexer = indexer
        self.data_fetcher = data_fetcher
        self.sync_interval = sync_interval

        self._running = False
        self._sync_task: Optional[asyncio.Task] = None
        self._last_sync: Dict[str, datetime] = {}
        self._event_count: Dict[str, int] = {}

        logger.info(f"ContextSyncService initialized (interval={sync_interval}s)")

    @property
    def is_running(self) -> bool:
        """Whether the sync service is running."""
        return self._running

    async def start(self) -> None:
        """
        Start the sync service.

        Begins the periodic sync loop in the background.
        """
        if self._running:
            logger.warning("Sync service already running")
            return

        self._running = True

        # Start periodic sync task
        self._sync_task = asyncio.create_task(self._periodic_sync())

        logger.info("Sync service started")

    async def stop(self) -> None:
        """
        Stop the sync service.

        Cancels the periodic sync task and cleans up.
        """
        if not self._running:
            return

        self._running = False

        # Cancel periodic sync task
        if self._sync_task:
            self._sync_task.cancel()
            try:
                await self._sync_task
            except asyncio.CancelledError:
                pass
            self._sync_task = None

        logger.info("Sync service stopped")

    async def _periodic_sync(self) -> None:
        """
        Background task for periodic full syncs.

        Runs sync_workspace for all tracked workspaces at the
        configured interval.
        """
        while self._running:
            try:
                await asyncio.sleep(self.sync_interval)

                if not self._running:
                    break

                # Sync all known workspaces
                for workspace_id in list(self._last_sync.keys()):
                    try:
                        await self.sync_workspace(workspace_id)
                    except Exception as e:
                        logger.error(
                            f"Periodic sync failed for {workspace_id}: {e}"
                        )

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Periodic sync error: {e}")

    async def sync_workspace(self, workspace_id: str) -> Dict[str, int]:
        """
        Sync all context for a workspace.

        Fetches all projects, tasks, and activities and indexes them.

        Args:
            workspace_id: Workspace ID to sync

        Returns:
            Dict with counts by type (projects, tasks, activities)
        """
        counts = {
            "projects": 0,
            "tasks": 0,
            "activities": 0,
        }

        try:
            # Sync projects
            projects = await self.data_fetcher("projects", workspace_id)
            for project in projects:
                try:
                    if await self.indexer.index_project(
                        project_id=project.get("id", ""),
                        name=project.get("name", ""),
                        description=project.get("description", ""),
                        workspace_id=workspace_id,
                        metadata=project.get("metadata"),
                    ):
                        counts["projects"] += 1
                except Exception as e:
                    logger.error(f"Failed to index project {project.get('id')}: {e}")

            # Sync tasks
            tasks = await self.data_fetcher("tasks", workspace_id)
            for task in tasks:
                try:
                    if await self.indexer.index_task(
                        task_id=task.get("id", ""),
                        title=task.get("title", ""),
                        description=task.get("description", ""),
                        project_id=task.get("projectId", task.get("project_id", "")),
                        workspace_id=workspace_id,
                        status=task.get("status", "unknown"),
                        metadata=task.get("metadata"),
                    ):
                        counts["tasks"] += 1
                except Exception as e:
                    logger.error(f"Failed to index task {task.get('id')}: {e}")

            # Sync activities
            activities = await self.data_fetcher("activities", workspace_id)
            indexed = await self.indexer.index_activity_batch(
                activities, workspace_id
            )
            counts["activities"] = indexed

            # Update last sync time
            self._last_sync[workspace_id] = datetime.now(timezone.utc)

            logger.info(
                f"Workspace sync complete: {workspace_id} - "
                f"projects={counts['projects']}, tasks={counts['tasks']}, "
                f"activities={counts['activities']}"
            )

        except Exception as e:
            logger.error(f"Workspace sync failed for {workspace_id}: {e}")
            raise

        return counts

    async def handle_event(self, event: Dict[str, Any]) -> None:
        """
        Handle a state change event and update index.

        Routes events to appropriate handlers based on type prefix.

        Args:
            event: Event dictionary with type, workspaceId, and data
        """
        event_type = event.get("type", "")
        workspace_id = event.get("workspaceId", event.get("workspace_id"))

        if not workspace_id:
            logger.warning(f"Event missing workspaceId: {event_type}")
            return

        try:
            if event_type.startswith("project."):
                await self._handle_project_event(event)
            elif event_type.startswith("task."):
                await self._handle_task_event(event)
            elif event_type.startswith("document."):
                await self._handle_document_event(event)
            else:
                logger.debug(f"Unhandled event type: {event_type}")

            # Track event count
            self._event_count[event_type] = (
                self._event_count.get(event_type, 0) + 1
            )

        except Exception as e:
            logger.error(f"Error handling event {event_type}: {e}")

    async def _handle_project_event(self, event: Dict[str, Any]) -> None:
        """
        Handle project events (created, updated, deleted).

        Args:
            event: Project event with type and data
        """
        event_type = event.get("type", "")
        workspace_id = event.get("workspaceId", event.get("workspace_id", ""))
        data = event.get("data", {})

        project_id = data.get("id", "")

        if event_type == "project.created" or event_type == "project.updated":
            await self.indexer.index_project(
                project_id=project_id,
                name=data.get("name", ""),
                description=data.get("description", ""),
                workspace_id=workspace_id,
                metadata=data.get("metadata"),
            )
            logger.debug(f"Indexed project {project_id} from {event_type}")

        elif event_type == "project.deleted":
            await self.indexer.delete_document(f"project_{project_id}")
            logger.debug(f"Deleted project {project_id} from index")

    async def _handle_task_event(self, event: Dict[str, Any]) -> None:
        """
        Handle task events (created, updated, deleted).

        Args:
            event: Task event with type and data
        """
        event_type = event.get("type", "")
        workspace_id = event.get("workspaceId", event.get("workspace_id", ""))
        data = event.get("data", {})

        task_id = data.get("id", "")

        if event_type == "task.created" or event_type == "task.updated":
            await self.indexer.index_task(
                task_id=task_id,
                title=data.get("title", ""),
                description=data.get("description", ""),
                project_id=data.get("projectId", data.get("project_id", "")),
                workspace_id=workspace_id,
                status=data.get("status", "unknown"),
                metadata=data.get("metadata"),
            )
            logger.debug(f"Indexed task {task_id} from {event_type}")

        elif event_type == "task.deleted":
            await self.indexer.delete_document(f"task_{task_id}")
            logger.debug(f"Deleted task {task_id} from index")

    async def _handle_document_event(self, event: Dict[str, Any]) -> None:
        """
        Handle document events (created, updated, deleted).

        Args:
            event: Document event with type and data
        """
        event_type = event.get("type", "")
        data = event.get("data", {})

        doc_id = data.get("id", "")

        if event_type == "document.created" or event_type == "document.updated":
            # For documents, we receive the full content in the event
            # Build a ContextDocument and index it
            from .models import ContextDocument, ContextDocumentType

            doc = ContextDocument(
                id=f"document_{doc_id}",
                document_type=ContextDocumentType.DOCUMENT,
                workspace_id=event.get(
                    "workspaceId", event.get("workspace_id", "")
                ),
                content=data.get("content", data.get("title", "")),
                metadata={
                    "document_id": doc_id,
                    "title": data.get("title", ""),
                    **data.get("metadata", {}),
                },
            )
            await self.indexer.index_document(doc)
            logger.debug(f"Indexed document {doc_id} from {event_type}")

        elif event_type == "document.deleted":
            await self.indexer.delete_document(f"document_{doc_id}")
            logger.debug(f"Deleted document {doc_id} from index")

    def get_last_sync(self, workspace_id: str) -> Optional[datetime]:
        """
        Get the timestamp of the last sync for a workspace.

        Args:
            workspace_id: Workspace ID

        Returns:
            Datetime of last sync, or None if never synced
        """
        return self._last_sync.get(workspace_id)

    def get_event_counts(self) -> Dict[str, int]:
        """
        Get counts of events processed by type.

        Returns:
            Dict mapping event type to count
        """
        return dict(self._event_count)


# Global sync service instance
_sync_service: Optional[ContextSyncService] = None


def get_context_sync_service(
    indexer: Optional[ContextIndexer] = None,
    data_fetcher: Optional[DataFetcher] = None,
    sync_interval: int = 3600,
) -> ContextSyncService:
    """
    Get or create the global context sync service.

    Args:
        indexer: ContextIndexer instance (required on first call)
        data_fetcher: Data fetcher function (required on first call)
        sync_interval: Sync interval in seconds

    Returns:
        ContextSyncService instance
    """
    global _sync_service

    if _sync_service is not None:
        return _sync_service

    if indexer is None or data_fetcher is None:
        raise ValueError(
            "indexer and data_fetcher are required for first initialization"
        )

    _sync_service = ContextSyncService(indexer, data_fetcher, sync_interval)
    return _sync_service


def reset_sync_service() -> None:
    """Reset the global sync service (for testing)."""
    global _sync_service
    _sync_service = None
