"""
Provider Resolver

High-level interface for resolving BYOAI provider configurations
and mapping them to Agno-compatible model configurations.
"""

import logging
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass
from enum import Enum

from .byoai_client import BYOAIClient, ProviderConfig

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


def get_provider_resolver(api_base_url: str = "http://localhost:3001") -> ProviderResolver:
    """
    Get or create the global provider resolver instance.

    Args:
        api_base_url: NestJS API base URL

    Returns:
        ProviderResolver instance
    """
    global _resolver

    if _resolver is None:
        client = BYOAIClient(api_base_url=api_base_url)
        _resolver = ProviderResolver(byoai_client=client)

    return _resolver
