"""
Provider Resolver

High-level interface for resolving BYOAI provider configurations
and mapping them to Agno-compatible model configurations.

Includes model factory for creating actual Agno model instances.
"""

import logging
from typing import Optional, Dict, Any, Union
from dataclasses import dataclass
from enum import Enum

from .byoai_client import BYOAIClient, ProviderConfig

# Agno model imports - lazy loaded to avoid import errors if not installed
try:
    from agno.models.anthropic import Claude
    from agno.models.openai import OpenAIChat
    from agno.models.google import Gemini
    from agno.models.deepseek import DeepSeek
    from agno.models.openrouter import OpenRouter
    AGNO_AVAILABLE = True
except ImportError:
    AGNO_AVAILABLE = False
    Claude = None
    OpenAIChat = None
    Gemini = None
    DeepSeek = None
    OpenRouter = None

logger = logging.getLogger(__name__)


class AgnoModel(str, Enum):
    """
    Agno-compatible model identifiers.

    Maps to provider-specific model names for each BYOAI provider.
    """
    # OpenAI models
    GPT4O = "gpt-4o"
    GPT4O_MINI = "gpt-4o-mini"
    GPT4_TURBO = "gpt-4-turbo"
    O1 = "o1"
    O1_MINI = "o1-mini"
    O3_MINI = "o3-mini"

    # Anthropic Claude models
    CLAUDE_35_SONNET = "claude-3-5-sonnet-20241022"
    CLAUDE_35_HAIKU = "claude-3-5-haiku-20241022"
    CLAUDE_3_OPUS = "claude-3-opus-20240229"

    # Google Gemini models
    GEMINI_2_FLASH = "gemini-2.0-flash-exp"
    GEMINI_15_PRO = "gemini-1.5-pro"
    GEMINI_15_FLASH = "gemini-1.5-flash"

    # DeepSeek models
    DEEPSEEK_CHAT = "deepseek-chat"
    DEEPSEEK_CODER = "deepseek-coder"
    DEEPSEEK_REASONER = "deepseek-reasoner"


# Provider to Agno model class mapping
PROVIDER_MODEL_CLASS = {
    "openai": "OpenAIChat",
    "claude": "Claude",
    "gemini": "Gemini",
    "deepseek": "DeepSeek",
    "openrouter": "OpenRouter",
}

# Default models per provider
DEFAULT_MODELS = {
    "openai": AgnoModel.GPT4O,
    "claude": AgnoModel.CLAUDE_35_SONNET,
    "gemini": AgnoModel.GEMINI_2_FLASH,
    "deepseek": AgnoModel.DEEPSEEK_CHAT,
    "openrouter": AgnoModel.GPT4O,  # OpenRouter uses OpenAI-compatible model names
}


@dataclass
class ResolvedProvider:
    """
    Resolved provider configuration ready for Agno.

    Contains all information needed to instantiate an Agno model.
    """
    provider_id: str
    provider_type: str  # 'openai', 'claude', etc.
    model_id: str  # e.g., 'gpt-4o'
    model_class: str  # e.g., 'OpenAIChat'
    api_key: Optional[str] = None
    is_valid: bool = True

    # Token limit info
    remaining_tokens: int = 0
    max_tokens_per_day: int = 0


class ProviderResolver:
    """
    Resolves BYOAI provider configurations for Agno agents.

    Usage:
        resolver = ProviderResolver(
            byoai_client=BYOAIClient(api_base_url="http://localhost:3001")
        )

        # Get resolved provider for a workspace
        provider = await resolver.resolve_provider(
            workspace_id="ws_123",
            jwt_token="eyJ...",
            preferred_provider="openai",  # Optional
            preferred_model="gpt-4o",  # Optional
        )

        # Use with Agno
        from agno import Agent
        agent = Agent(model=provider.model_id)
    """

    def __init__(self, byoai_client: BYOAIClient):
        """
        Initialize provider resolver.

        Args:
            byoai_client: BYOAI client instance
        """
        self.byoai_client = byoai_client
        logger.info("ProviderResolver initialized")

    async def resolve_provider(
        self,
        workspace_id: str,
        jwt_token: str,
        preferred_provider: Optional[str] = None,
        preferred_model: Optional[str] = None,
        check_limits: bool = True,
    ) -> Optional[ResolvedProvider]:
        """
        Resolve the best available provider for a workspace.

        Resolution order:
        1. Preferred provider + model if specified and valid
        2. Default provider for workspace
        3. First valid provider

        Args:
            workspace_id: Workspace ID
            jwt_token: JWT authentication token
            preferred_provider: Preferred provider type (openai, claude, etc.)
            preferred_model: Preferred model ID
            check_limits: Whether to check token limits

        Returns:
            ResolvedProvider if found, None otherwise
        """
        logger.info(
            f"Resolving provider for workspace {workspace_id}, "
            f"preferred: {preferred_provider}/{preferred_model}"
        )

        providers = await self.byoai_client.get_workspace_providers(
            workspace_id=workspace_id,
            jwt_token=jwt_token,
        )

        if not providers:
            logger.warning(f"No providers configured for workspace {workspace_id}")
            return None

        # Try preferred provider first
        if preferred_provider:
            for config in providers:
                if config.provider == preferred_provider and config.is_valid:
                    return await self._resolve_from_config(
                        config=config,
                        workspace_id=workspace_id,
                        jwt_token=jwt_token,
                        model_override=preferred_model,
                        check_limits=check_limits,
                    )

        # Try default provider
        for config in providers:
            if config.is_default and config.is_valid:
                return await self._resolve_from_config(
                    config=config,
                    workspace_id=workspace_id,
                    jwt_token=jwt_token,
                    model_override=preferred_model,
                    check_limits=check_limits,
                )

        # Fall back to first valid provider
        for config in providers:
            if config.is_valid:
                return await self._resolve_from_config(
                    config=config,
                    workspace_id=workspace_id,
                    jwt_token=jwt_token,
                    model_override=preferred_model,
                    check_limits=check_limits,
                )

        logger.warning(f"No valid providers found for workspace {workspace_id}")
        return None

    async def resolve_provider_for_task(
        self,
        workspace_id: str,
        jwt_token: str,
        task_type: str,
        estimated_tokens: int = 0,
    ) -> Optional[ResolvedProvider]:
        """
        Resolve the best provider for a specific task type.

        Task type hints:
        - 'reasoning': Prefer o1, Claude Opus, or GPT-4o for complex reasoning
        - 'coding': Prefer DeepSeek Coder, GPT-4o, or Claude for code
        - 'fast': Prefer GPT-4o-mini, Gemini Flash, or Claude Haiku
        - 'general': Default provider

        Args:
            workspace_id: Workspace ID
            jwt_token: JWT authentication token
            task_type: Type of task (reasoning, coding, fast, general)
            estimated_tokens: Estimated token usage for limit checking

        Returns:
            ResolvedProvider if found, None otherwise
        """
        # Task type to provider preferences
        task_preferences: Dict[str, list] = {
            "reasoning": ["claude", "openai"],  # Prefer Claude for reasoning
            "coding": ["deepseek", "openai", "claude"],  # DeepSeek for coding
            "fast": ["gemini", "openai"],  # Gemini/GPT-4o-mini for speed
            "general": [],  # Use default
        }

        preferences = task_preferences.get(task_type, [])

        # Try each preferred provider
        for preferred in preferences:
            provider = await self.resolve_provider(
                workspace_id=workspace_id,
                jwt_token=jwt_token,
                preferred_provider=preferred,
                check_limits=True,
            )
            if provider and provider.remaining_tokens >= estimated_tokens:
                return provider

        # Fall back to any available provider
        return await self.resolve_provider(
            workspace_id=workspace_id,
            jwt_token=jwt_token,
            check_limits=True,
        )

    async def _resolve_from_config(
        self,
        config: ProviderConfig,
        workspace_id: str,
        jwt_token: str,
        model_override: Optional[str] = None,
        check_limits: bool = True,
    ) -> ResolvedProvider:
        """
        Create ResolvedProvider from ProviderConfig.

        Args:
            config: Provider configuration
            workspace_id: Workspace ID
            jwt_token: JWT token
            model_override: Optional model override
            check_limits: Whether to check token limits

        Returns:
            ResolvedProvider instance
        """
        # Determine model to use
        model_id = model_override or config.default_model
        if not model_id:
            model_id = DEFAULT_MODELS.get(config.provider, AgnoModel.GPT4O).value

        # Get model class
        model_class = PROVIDER_MODEL_CLASS.get(config.provider, "OpenAIChat")

        # Check token limits if requested
        remaining = config.max_tokens_per_day - config.tokens_used_today
        if check_limits:
            try:
                limit_status = await self.byoai_client.check_token_limit(
                    workspace_id=workspace_id,
                    provider_id=config.id,
                    jwt_token=jwt_token,
                )
                remaining = limit_status.get("remaining", remaining)
            except Exception as e:
                logger.warning(f"Failed to check token limits: {e}")

        logger.info(
            f"Resolved provider: {config.provider}/{model_id} "
            f"(remaining: {remaining} tokens)"
        )

        return ResolvedProvider(
            provider_id=config.id,
            provider_type=config.provider,
            model_id=model_id,
            model_class=model_class,
            api_key=config.api_key,
            is_valid=config.is_valid,
            remaining_tokens=max(0, remaining),
            max_tokens_per_day=config.max_tokens_per_day,
        )

    def get_agno_model_kwargs(
        self,
        resolved: ResolvedProvider,
    ) -> Dict[str, Any]:
        """
        Get kwargs for creating an Agno model instance.

        Args:
            resolved: Resolved provider configuration

        Returns:
            Dict of kwargs for Agno model initialization
        """
        kwargs = {
            "id": resolved.model_id,
        }

        # Add API key if available
        if resolved.api_key:
            if resolved.provider_type == "openai":
                kwargs["api_key"] = resolved.api_key
            elif resolved.provider_type == "claude":
                kwargs["api_key"] = resolved.api_key
            elif resolved.provider_type == "gemini":
                kwargs["api_key"] = resolved.api_key
            elif resolved.provider_type == "deepseek":
                kwargs["api_key"] = resolved.api_key
            elif resolved.provider_type == "openrouter":
                kwargs["api_key"] = resolved.api_key

        return kwargs


# Global resolver instance
_resolver: Optional[ProviderResolver] = None
_resolver_init: Optional[tuple[str, Optional[str], Optional[str]]] = None


def get_provider_resolver(
    api_base_url: str = "http://localhost:3001",
    database_url: Optional[str] = None,
    encryption_master_key_base64: Optional[str] = None,
) -> ProviderResolver:
    """
    Get or create the global provider resolver instance.

    Args:
        api_base_url: NestJS API base URL
        database_url: Optional Postgres URL for reading encrypted provider keys
        encryption_master_key_base64: Base64 master key for decrypting provider keys

    Returns:
        ProviderResolver instance
    """
    global _resolver
    global _resolver_init

    normalized = (api_base_url.rstrip("/"), database_url, encryption_master_key_base64)

    if _resolver is None or _resolver_init != normalized:
        if _resolver is not None:
            logger.warning(
                "ProviderResolver reinitialized due to configuration change. "
                "Prefer using a single resolver per process or call with consistent parameters."
            )
        client = BYOAIClient(
            api_base_url=normalized[0],
            database_url=database_url,
            encryption_master_key_base64=encryption_master_key_base64,
        )
        _resolver = ProviderResolver(byoai_client=client)
        _resolver_init = normalized

    return _resolver


# Type alias for any Agno model
AgnoModelType = Union["Claude", "OpenAIChat", "Gemini", "DeepSeek", "OpenRouter", None]


def create_agno_model(
    resolved: Optional[ResolvedProvider],
    fallback_model: str = "claude-sonnet-4-20250514",
) -> AgnoModelType:
    """
    Create an Agno model instance from a ResolvedProvider.

    This is the key function that bridges BYOAI configurations to
    actual Agno model objects that can be used in agents and teams.

    Args:
        resolved: ResolvedProvider from ProviderResolver, or None
        fallback_model: Model ID to use if resolved is None (default Claude)

    Returns:
        Agno model instance ready for use in agents/teams

    Raises:
        RuntimeError: If Agno is not installed

    Example:
        resolver = get_provider_resolver()
        resolved = await resolver.resolve_provider(workspace_id, jwt_token)
        model = create_agno_model(resolved)

        # Use in agent
        agent = Agent(model=model)
    """
    if not AGNO_AVAILABLE:
        raise RuntimeError(
            "Agno is not installed. Install with: pip install agno"
        )

    # If no resolved provider, fall back to Claude
    if resolved is None:
        logger.warning(
            f"No resolved provider, falling back to Claude ({fallback_model})"
        )
        return Claude(id=fallback_model)

    provider_type = resolved.provider_type
    model_id = resolved.model_id
    api_key = resolved.api_key

    logger.info(f"Creating Agno model: {provider_type}/{model_id}")

    # Build kwargs
    kwargs: Dict[str, Any] = {"id": model_id}
    if api_key:
        kwargs["api_key"] = api_key

    # Create the appropriate model class
    if provider_type == "openai":
        return OpenAIChat(**kwargs)
    elif provider_type == "claude":
        return Claude(**kwargs)
    elif provider_type == "gemini":
        return Gemini(**kwargs)
    elif provider_type == "deepseek":
        return DeepSeek(**kwargs)
    elif provider_type == "openrouter":
        return OpenRouter(**kwargs)
    else:
        # Unknown provider - fall back to Claude
        logger.warning(
            f"Unknown provider type '{provider_type}', falling back to Claude"
        )
        return Claude(id=fallback_model)


async def resolve_and_create_model(
    workspace_id: str,
    jwt_token: str,
    api_base_url: str = "http://localhost:3001",
    database_url: Optional[str] = None,
    encryption_master_key_base64: Optional[str] = None,
    preferred_provider: Optional[str] = None,
    preferred_model: Optional[str] = None,
    fallback_model: str = "claude-sonnet-4-20250514",
) -> AgnoModelType:
    """
    Convenience function to resolve provider and create model in one call.

    This is the main entry point for BYOAI integration in team factories.

    Args:
        workspace_id: Workspace ID for tenant isolation
        jwt_token: JWT authentication token
        api_base_url: NestJS API base URL
        database_url: Optional Postgres URL for reading encrypted provider keys
        encryption_master_key_base64: Base64 master key for decrypting provider keys
        preferred_provider: Optional preferred provider type
        preferred_model: Optional preferred model ID
        fallback_model: Fallback model if resolution fails

    Returns:
        Agno model instance

    Example:
        # In team factory or main.py
        model = await resolve_and_create_model(
            workspace_id=workspace_id,
            jwt_token=jwt_token,
            preferred_model=model_override,
        )
        team = create_validation_team(model=model, ...)
    """
    resolver = get_provider_resolver(
        api_base_url,
        database_url=database_url,
        encryption_master_key_base64=encryption_master_key_base64,
    )

    try:
        resolved = await resolver.resolve_provider(
            workspace_id=workspace_id,
            jwt_token=jwt_token,
            preferred_provider=preferred_provider,
            preferred_model=preferred_model,
        )
    except Exception as e:
        logger.error(f"Failed to resolve provider: {e}")
        resolved = None

    return create_agno_model(resolved, fallback_model=fallback_model)
