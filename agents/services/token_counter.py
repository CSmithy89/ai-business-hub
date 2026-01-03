"""
Token Counter Service (DM-11.14)

Provides accurate token counting using tiktoken library.
Falls back to estimation when tiktoken is unavailable.

Usage:
    from agents.services.token_counter import count_tokens, count_tokens_with_metadata

    # Simple count
    count = count_tokens("Hello, world!")

    # With metadata (shows accuracy info)
    result = count_tokens_with_metadata("Hello, world!")
    # {"count": 4, "method": "tiktoken", "model": "cl100k_base", "accurate": True}
"""

import logging
from functools import lru_cache
from typing import Optional

logger = logging.getLogger(__name__)

# Check tiktoken availability at module load
_tiktoken_available = False
_tiktoken = None

try:
    import tiktoken as _tiktoken_module

    _tiktoken = _tiktoken_module
    _tiktoken_available = True
    logger.debug("tiktoken loaded successfully")
except ImportError:
    logger.warning("tiktoken not installed, using character-based estimation")


# Model to encoding mapping
# Reference: https://github.com/openai/tiktoken/blob/main/tiktoken/model.py
# NOTE: Only OpenAI models have accurate tiktoken encodings.
# Claude models use Anthropic's proprietary tokenizer - we fall back to estimation.
MODEL_ENCODINGS = {
    # GPT-4 and GPT-3.5 Turbo
    "gpt-4": "cl100k_base",
    "gpt-4-turbo": "cl100k_base",
    "gpt-4o": "o200k_base",
    "gpt-3.5-turbo": "cl100k_base",
    # Default for unknown models (estimation will be used for non-OpenAI models)
    "default": "cl100k_base",
}


def get_encoding_for_model(model: str) -> str:
    """
    Get the appropriate tiktoken encoding for a model.

    Args:
        model: Model name (e.g., "gpt-4", "claude-3.5-sonnet")

    Returns:
        Encoding name (e.g., "cl100k_base")
    """
    # Check exact match first
    if model in MODEL_ENCODINGS:
        return MODEL_ENCODINGS[model]

    # Check prefixes
    model_lower = model.lower()
    for prefix, encoding in MODEL_ENCODINGS.items():
        if model_lower.startswith(prefix):
            return encoding

    # Default to cl100k_base (good for most modern models)
    return MODEL_ENCODINGS["default"]


@lru_cache(maxsize=8)
def get_encoder(encoding: str = "cl100k_base"):
    """
    Get cached encoder for encoding name.

    Args:
        encoding: Tiktoken encoding name

    Returns:
        Encoder instance or None if tiktoken unavailable
    """
    if not _tiktoken_available or _tiktoken is None:
        return None

    try:
        return _tiktoken.get_encoding(encoding)
    except KeyError:
        logger.warning(f"Unknown encoding '{encoding}', falling back to cl100k_base")
        try:
            return _tiktoken.get_encoding("cl100k_base")
        except Exception as e:
            logger.error(f"Failed to get fallback encoder: {e}")
            return None
    except Exception as e:
        logger.error(f"Failed to get encoder for '{encoding}': {e}")
        return None


def count_tokens(text: str, model: str = "default") -> int:
    """
    Count tokens in text accurately if tiktoken available,
    otherwise fall back to estimation.

    Args:
        text: Text to count tokens for
        model: Model name for encoding selection

    Returns:
        Token count (accurate with tiktoken, estimated otherwise)
    """
    if not text:
        return 0

    encoding = get_encoding_for_model(model)
    encoder = get_encoder(encoding)

    if encoder:
        try:
            return len(encoder.encode(text))
        except Exception as e:
            logger.warning(f"Token encoding failed, using estimation: {e}")

    # Fallback estimation
    # Use 3.5 characters per token for safer estimation with code/technical content
    # Code and technical content typically has lower chars-per-token than prose
    return int(len(text) / 3.5)


def count_tokens_with_metadata(
    text: str,
    model: str = "default",
) -> dict:
    """
    Return token count with accuracy information.

    Args:
        text: Text to count tokens for
        model: Model name for encoding selection

    Returns:
        Dictionary with:
        - count: Token count
        - method: "tiktoken" or "estimation"
        - encoding: Encoding name used (or None)
        - accurate: True if using tiktoken, False for estimation
        - model: Model name used for lookup
    """
    if not text:
        return {
            "count": 0,
            "method": "tiktoken" if _tiktoken_available else "estimation",
            "encoding": None,
            "accurate": True,  # Empty string is accurate regardless
            "model": model,
        }

    encoding_name = get_encoding_for_model(model)
    encoder = get_encoder(encoding_name)

    if encoder:
        try:
            tokens = len(encoder.encode(text))
            return {
                "count": tokens,
                "method": "tiktoken",
                "encoding": encoding_name,
                "accurate": True,
                "model": model,
            }
        except Exception as e:
            logger.warning(f"Token encoding failed: {e}")

    # Fallback estimation
    # Use 3.5 characters per token (consistent with count_tokens)
    return {
        "count": int(len(text) / 3.5),
        "method": "estimation",
        "encoding": None,
        "accurate": False,
        "model": model,
    }


def is_tiktoken_available() -> bool:
    """Check if tiktoken is available for accurate counting."""
    return _tiktoken_available


def estimate_tokens(text: str) -> int:
    """
    Estimate token count without tiktoken (always uses estimation).

    Useful for quick approximations when accuracy isn't critical.
    Uses 3.5 chars/token for conservative estimation with code/technical content.

    Args:
        text: Text to estimate tokens for

    Returns:
        Estimated token count
    """
    if not text:
        return 0
    return int(len(text) / 3.5)
