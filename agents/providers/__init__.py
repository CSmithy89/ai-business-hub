"""
BYOAI Provider Integration Module

This module provides integration with the NestJS API to fetch
workspace-specific AI provider configurations and use them
with Agno agents.

Usage:
    from providers import resolve_and_create_model

    # In team execution
    model = await resolve_and_create_model(
        workspace_id=workspace_id,
        jwt_token=jwt_token,
        preferred_model=model_override,
    )
"""

from .byoai_client import BYOAIClient, ProviderConfig
from .provider_resolver import (
    ProviderResolver,
    ResolvedProvider,
    get_provider_resolver,
    create_agno_model,
    resolve_and_create_model,
    AgnoModel,
    PROVIDER_MODEL_CLASS,
    DEFAULT_MODELS,
)

__all__ = [
    # Client
    "BYOAIClient",
    "ProviderConfig",
    # Resolver
    "ProviderResolver",
    "ResolvedProvider",
    "get_provider_resolver",
    # Model factory
    "create_agno_model",
    "resolve_and_create_model",
    # Constants
    "AgnoModel",
    "PROVIDER_MODEL_CLASS",
    "DEFAULT_MODELS",
]
