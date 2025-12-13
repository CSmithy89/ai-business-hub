"""
Knowledge Factory

Creates workspace-scoped knowledge bases with tenant isolation.
Integrates with BYOAI for embeddings provider selection.
"""

import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass

from agno.vectordb.pgvector import PgVector, SearchType
from agno.knowledge.knowledge import Knowledge
from agno.knowledge.embedder.openai import OpenAIEmbedder

from config import get_settings
from providers import get_provider_resolver, ResolvedProvider

logger = logging.getLogger(__name__)

settings = get_settings()


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

    # Cache of knowledge instances per workspace
    _instances: Dict[str, Knowledge] = {}

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
        self.database_url = database_url or settings.database_url
        self.api_base_url = api_base_url or settings.api_base_url

        if not self.database_url:
            raise ValueError("Database URL is required for knowledge base")

        logger.info("KnowledgeFactory initialized")

    def _get_table_name(self, workspace_id: str) -> str:
        """Generate table name for workspace (tenant isolation)."""
        # Sanitize workspace_id for use in table name
        safe_id = workspace_id.replace("-", "_").replace(" ", "_")[:32]
        return f"knowledge_{safe_id}"

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
        # Check cache first
        if not force_new and workspace_id in self._instances:
            logger.debug(f"Returning cached knowledge for {workspace_id}")
            return self._instances[workspace_id]

        # Build configuration
        if config is None:
            config = KnowledgeConfig(
                workspace_id=workspace_id,
                table_name=self._get_table_name(workspace_id),
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

        logger.info(
            f"Knowledge base created: table={config.table_name}, "
            f"search_type={config.search_type}"
        )

        return knowledge

    def clear_cache(self, workspace_id: Optional[str] = None) -> None:
        """Clear cached knowledge instances."""
        if workspace_id:
            self._instances.pop(workspace_id, None)
        else:
            self._instances.clear()

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
        table_name = self._get_table_name(workspace_id)

        try:
            # Get knowledge instance
            knowledge = self._instances.get(workspace_id)
            if knowledge and hasattr(knowledge.vector_db, 'delete'):
                # Use Agno's delete if available
                knowledge.vector_db.delete()

            # Remove from cache
            self._instances.pop(workspace_id, None)

            logger.info(f"Deleted knowledge for workspace {workspace_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete knowledge: {e}")
            return False


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
