"""
Knowledge Factory

Creates workspace-scoped knowledge bases with tenant isolation.
Integrates with BYOAI for embeddings provider selection.
"""

import logging
import hashlib
import inspect
import re
import asyncio
import os
from typing import Optional, Dict, Any
from dataclasses import dataclass

import asyncpg
from agno.vectordb.pgvector import PgVector, SearchType
from agno.knowledge.knowledge import Knowledge
from agno.knowledge.embedder.openai import OpenAIEmbedder

from config import get_settings
from providers import get_provider_resolver, ResolvedProvider

logger = logging.getLogger(__name__)


@dataclass
class KnowledgeConfig:
    """Configuration for a workspace knowledge base."""
    workspace_id: str
    table_name: str
    embedder_model: str = "text-embedding-3-small"
    search_type: SearchType = SearchType.hybrid
    chunk_size: int = 1000
    chunk_overlap: int = 200


class KnowledgeFactory:
    """
    Factory for creating workspace-scoped knowledge bases.

    Each workspace gets its own table in PgVector for tenant isolation.
    Embeddings can use BYOAI providers or fall back to defaults.

    Usage:
        factory = KnowledgeFactory(database_url="postgresql://...")
        knowledge = await factory.create_for_workspace(
            workspace_id="ws_123",
            jwt_token="eyJ...",
        )
    """

    def __init__(
        self,
        database_url: Optional[str] = None,
        api_base_url: Optional[str] = None,
    ):
        """
        Initialize knowledge factory.

        Args:
            database_url: PostgreSQL connection URL with pgvector extension
            api_base_url: NestJS API URL for BYOAI integration
        """
        settings = get_settings()
        self.database_url = database_url or settings.database_url
        self.api_base_url = api_base_url or settings.api_base_url

        if not self.database_url:
            raise ValueError("Database URL is required for knowledge base")

        # Instance-scoped caches (avoid unbounded class-level globals).
        self._instances: Dict[str, Knowledge] = {}
        self._instance_last_access: Dict[str, float] = {}
        self._locks: Dict[str, asyncio.Lock] = {}
        self._table_name_cache: Dict[str, str] = {}

        # Best-effort pooling for Postgres metadata/DDL helpers.
        self._db_pool: Optional[asyncpg.Pool] = None

        # Cache limits (defense-in-depth; tune via env as needed).
        self._max_cached_instances = int(os.getenv("KNOWLEDGE_CACHE_MAX_INSTANCES", "50"))
        self._cache_ttl_seconds = int(os.getenv("KNOWLEDGE_CACHE_TTL_SECONDS", "3600"))
        self._table_name_cache_max_entries = int(os.getenv("KNOWLEDGE_TABLE_NAME_CACHE_MAX", "500"))

        logger.info("KnowledgeFactory initialized")

    def _now(self) -> float:
        """Monotonic timestamp for cache TTL/LRU."""
        try:
            return asyncio.get_running_loop().time()
        except RuntimeError:
            # Fallback for contexts without a running loop (should be rare).
            return asyncio.get_event_loop().time()

    def _touch(self, workspace_id: str) -> None:
        self._instance_last_access[workspace_id] = self._now()

    async def _get_db_pool(self) -> asyncpg.Pool:
        """Get or create a small asyncpg pool for metadata/DDL operations."""
        if self._db_pool is None:
            self._db_pool = await asyncpg.create_pool(
                dsn=self.database_url,
                min_size=1,
                max_size=5,
                command_timeout=10,
            )
        return self._db_pool

    def _evict_if_needed(self, current_workspace_id: str) -> None:
        """
        Best-effort bounded cache eviction.

        Avoid evicting the currently-creating workspace. Also avoid evicting entries
        while their per-workspace lock is held (to reduce the chance of evicting
        an instance actively in use).
        """
        now = self._now()

        # TTL eviction
        if self._cache_ttl_seconds > 0:
            stale_ids = [
                ws_id
                for ws_id, last_access in list(self._instance_last_access.items())
                if ws_id != current_workspace_id and (now - last_access) > self._cache_ttl_seconds
            ]
            for ws_id in stale_ids:
                lock = self._locks.get(ws_id)
                if lock and lock.locked():
                    continue
                self._instances.pop(ws_id, None)
                self._instance_last_access.pop(ws_id, None)

        # LRU eviction
        if self._max_cached_instances > 0:
            while len(self._instances) > self._max_cached_instances:
                candidates = [
                    (ws_id, self._instance_last_access.get(ws_id, 0.0))
                    for ws_id in self._instances.keys()
                    if ws_id != current_workspace_id
                ]
                if not candidates:
                    break
                candidates.sort(key=lambda t: t[1])  # oldest first
                evicted = False
                for ws_id, _ in candidates:
                    lock = self._locks.get(ws_id)
                    if lock and lock.locked():
                        continue
                    self._instances.pop(ws_id, None)
                    self._instance_last_access.pop(ws_id, None)
                    evicted = True
                    break
                if not evicted:
                    break

        # Table-name cache bounds (safe to clear; it will be re-resolved lazily).
        if self._table_name_cache_max_entries > 0 and len(self._table_name_cache) > self._table_name_cache_max_entries:
            self._table_name_cache.clear()

    @staticmethod
    def _sanitize_identifier(value: str) -> str:
        """
        Sanitize arbitrary strings into a safe SQL identifier fragment.

        Allows only alphanumeric and underscore characters. Everything else becomes '_'.
        """
        return re.sub(r"[^a-zA-Z0-9_]+", "_", value).strip("_").lower()

    def _get_legacy_table_name(self, workspace_id: str) -> str:
        safe_id = self._sanitize_identifier(workspace_id)
        safe_id = safe_id[:32] if safe_id else "ws"
        table = f"knowledge_{safe_id}"
        if not re.match(r"^knowledge_[a-z0-9_]+$", table):
            raise ValueError("Invalid legacy knowledge table name generated")
        return table

    def _get_table_name(self, workspace_id: str) -> str:
        """
        Generate a deterministic, collision-resistant table name for a workspace.

        Always includes a hash suffix to prevent collisions from sanitization/truncation.
        """
        safe_id = self._sanitize_identifier(workspace_id)
        # Postgres identifier length limit is 63 chars. Keep the prefix short enough
        # to allow a stronger hash suffix while staying within the limit.
        safe_id = safe_id[:20] if safe_id else "ws"
        # 128-bit (32 hex chars) suffix makes collisions astronomically unlikely.
        digest = hashlib.sha256(workspace_id.encode("utf-8")).hexdigest()[:32]
        table = f"knowledge_{safe_id}_{digest}"

        # Ensure the final table name is a safe SQL identifier.
        if not re.match(r"^knowledge_[a-z0-9_]+$", table):
            raise ValueError("Invalid knowledge table name generated")

        # Keep within Postgres identifier limit (63 chars). This construction stays under the limit.
        return table

    async def _resolve_table_name(self, workspace_id: str) -> str:
        """
        Resolve the table name for a workspace, preserving legacy tables when present.

        - If a legacy table exists (older naming), use it to avoid orphaning existing data.
        - Otherwise, use the new hashed table name.
        """
        cached = self._table_name_cache.get(workspace_id)
        if cached:
            return cached

        legacy = self._get_legacy_table_name(workspace_id)
        current = self._get_table_name(workspace_id)

        try:
            pool = await self._get_db_pool()
            async with pool.acquire() as conn:
                # information_schema stores unquoted identifiers in lowercase.
                legacy_exists = await conn.fetchval(
                    """
                    SELECT EXISTS (
                      SELECT 1
                      FROM information_schema.tables
                      WHERE table_schema = 'public' AND table_name = $1
                    )
                    """,
                    legacy,
                )
        except Exception:
            # If we can't connect, fall back to deterministic naming; PgVector will handle creation.
            legacy_exists = False

        resolved = legacy if legacy_exists else current
        self._table_name_cache[workspace_id] = resolved
        return resolved

    async def _resolve_embedder(
        self,
        workspace_id: str,
        jwt_token: Optional[str],
    ) -> OpenAIEmbedder:
        """
        Resolve embedder using BYOAI configuration.

        Currently supports OpenAI embeddings. Future: add support for
        other embedding providers (Cohere, Voyage, etc.)
        """
        embedder_model = "text-embedding-3-small"
        api_key = None

        # Try to get API key from BYOAI
        if jwt_token:
            try:
                resolver = get_provider_resolver(self.api_base_url)
                resolved = await resolver.resolve_provider(
                    workspace_id=workspace_id,
                    jwt_token=jwt_token,
                    preferred_provider="openai",  # Embeddings require OpenAI
                    check_limits=False,
                )
                if resolved and resolved.api_key:
                    api_key = resolved.api_key
                    logger.info(f"Using BYOAI OpenAI key for embeddings")
            except Exception as e:
                logger.warning(f"BYOAI resolution failed for embeddings: {e}")

        # Create embedder (will use OPENAI_API_KEY env var if no api_key)
        if api_key:
            return OpenAIEmbedder(id=embedder_model, api_key=api_key)
        return OpenAIEmbedder(id=embedder_model)

    async def create_for_workspace(
        self,
        workspace_id: str,
        jwt_token: Optional[str] = None,
        config: Optional[KnowledgeConfig] = None,
        force_new: bool = False,
    ) -> Knowledge:
        """
        Create or get cached knowledge base for a workspace.

        Args:
            workspace_id: Workspace ID for tenant isolation
            jwt_token: JWT token for BYOAI integration
            config: Optional custom configuration
            force_new: Force creation of new instance (bypass cache)

        Returns:
            Knowledge instance ready for use
        """
        # Concurrency guard: prevent duplicate creation for the same workspace.
        lock = self._locks.get(workspace_id)
        if lock is None:
            lock = asyncio.Lock()
            self._locks[workspace_id] = lock

        async with lock:
            # Check cache first (inside lock)
            if not force_new and workspace_id in self._instances:
                logger.debug(f"Returning cached knowledge for {workspace_id}")
                self._touch(workspace_id)
                return self._instances[workspace_id]

            # Build configuration
            if config is None:
                table_name = await self._resolve_table_name(workspace_id)
                config = KnowledgeConfig(
                    workspace_id=workspace_id,
                    table_name=table_name,
                )

            logger.info(f"Creating knowledge base for workspace {workspace_id}")

            # Resolve embedder with BYOAI
            embedder = await self._resolve_embedder(workspace_id, jwt_token)

            # Create PgVector instance with tenant-specific table
            vector_db = PgVector(
                table_name=config.table_name,
                db_url=self.database_url,
                search_type=config.search_type,
                embedder=embedder,
            )

            # Create Knowledge instance
            knowledge = Knowledge(
                vector_db=vector_db,
            )

            # Cache the instance
            self._instances[workspace_id] = knowledge
            self._touch(workspace_id)
            self._evict_if_needed(workspace_id)

            logger.info(
                f"Knowledge base created: table={config.table_name}, "
                f"search_type={config.search_type}"
            )

            return knowledge

    def clear_cache(self, workspace_id: Optional[str] = None) -> None:
        """Clear cached knowledge instances."""
        if workspace_id:
            self._instances.pop(workspace_id, None)
            self._instance_last_access.pop(workspace_id, None)
        else:
            self._instances.clear()
            self._instance_last_access.clear()

    async def delete_workspace_knowledge(
        self,
        workspace_id: str,
    ) -> bool:
        """
        Delete all knowledge for a workspace.

        WARNING: This drops the workspace's knowledge table!

        Args:
            workspace_id: Workspace ID

        Returns:
            True if successful
        """
        # Attempt to delete both the current and legacy tables (best effort).
        legacy_table_name = self._get_legacy_table_name(workspace_id)
        table_name = self._table_name_cache.get(workspace_id) or self._get_table_name(workspace_id)

        try:
            # Best-effort: ask Agno to delete its resources if a cached instance exists.
            knowledge = self._instances.get(workspace_id)
            if knowledge and hasattr(knowledge, "vector_db") and hasattr(knowledge.vector_db, "delete"):
                result = knowledge.vector_db.delete()
                if inspect.isawaitable(result):
                    await result

            # Remove from cache
            self._instances.pop(workspace_id, None)
            self._instance_last_access.pop(workspace_id, None)

            # Always drop the table directly to ensure cleanup even when no cached instance exists.
            pool = await self._get_db_pool()
            async with pool.acquire() as conn:
                # Identifier safety: table_name is generated by _get_table_name and sanitized,
                # but still quote it defensively.
                for name in {table_name, legacy_table_name}:
                    if not re.match(r"^knowledge_[a-z0-9_]+$", name):
                        raise ValueError(f"Invalid table name: {name}")
                    await conn.execute(f'DROP TABLE IF EXISTS "{name}" CASCADE')

            logger.info(f"Deleted knowledge for workspace {workspace_id} (table={table_name})")
            return True
        except Exception as e:
            logger.error(f"Failed to delete knowledge: {e}")
            return False

    async def close(self) -> None:
        """Close pooled resources (best-effort)."""
        if self._db_pool is not None:
            await self._db_pool.close()
            self._db_pool = None


# Global factory instance
_factory: Optional[KnowledgeFactory] = None


def get_knowledge_factory() -> KnowledgeFactory:
    """Get or create the global knowledge factory."""
    global _factory
    if _factory is None:
        _factory = KnowledgeFactory()
    return _factory


async def get_workspace_knowledge(
    workspace_id: str,
    jwt_token: Optional[str] = None,
) -> Knowledge:
    """
    Convenience function to get knowledge base for a workspace.

    Args:
        workspace_id: Workspace ID
        jwt_token: JWT token for BYOAI

    Returns:
        Knowledge instance
    """
    factory = get_knowledge_factory()
    return await factory.create_for_workspace(
        workspace_id=workspace_id,
        jwt_token=jwt_token,
    )
