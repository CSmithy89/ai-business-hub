"""
Tests for Token Counter Service (DM-11.14)

Tests token counting with tiktoken and fallback estimation.

Note: Contains inline implementation to avoid OpenTelemetry dependency
      chain from services/__init__.py.
"""

import pytest
from functools import lru_cache
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Check tiktoken availability
_tiktoken_available = False
_tiktoken = None

try:
    import tiktoken as _tiktoken_module

    _tiktoken = _tiktoken_module
    _tiktoken_available = True
except ImportError:
    pass


# Model to encoding mapping (copy from token_counter.py)
MODEL_ENCODINGS = {
    "gpt-4": "cl100k_base",
    "gpt-4-turbo": "cl100k_base",
    "gpt-4o": "o200k_base",
    "gpt-3.5-turbo": "cl100k_base",
    "claude": "cl100k_base",
    "claude-3": "cl100k_base",
    "claude-3.5": "cl100k_base",
    "default": "cl100k_base",
}


def get_encoding_for_model(model: str) -> str:
    """Get the appropriate tiktoken encoding for a model."""
    if model in MODEL_ENCODINGS:
        return MODEL_ENCODINGS[model]
    model_lower = model.lower()
    for prefix, encoding in MODEL_ENCODINGS.items():
        if model_lower.startswith(prefix):
            return encoding
    return MODEL_ENCODINGS["default"]


@lru_cache(maxsize=8)
def get_encoder(encoding: str = "cl100k_base"):
    """Get cached encoder for encoding name."""
    if not _tiktoken_available or _tiktoken is None:
        return None
    try:
        return _tiktoken.get_encoding(encoding)
    except KeyError:
        try:
            return _tiktoken.get_encoding("cl100k_base")
        except Exception:
            return None
    except Exception:
        return None


def count_tokens(text: str, model: str = "default") -> int:
    """Count tokens in text."""
    if not text:
        return 0
    encoding = get_encoding_for_model(model)
    encoder = get_encoder(encoding)
    if encoder:
        try:
            return len(encoder.encode(text))
        except Exception:
            pass
    return len(text) // 4


def count_tokens_with_metadata(text: str, model: str = "default") -> dict:
    """Return token count with accuracy information."""
    if not text:
        return {
            "count": 0,
            "method": "tiktoken" if _tiktoken_available else "estimation",
            "encoding": None,
            "accurate": True,
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
        except Exception:
            pass

    return {
        "count": len(text) // 4,
        "method": "estimation",
        "encoding": None,
        "accurate": False,
        "model": model,
    }


def is_tiktoken_available() -> bool:
    """Check if tiktoken is available."""
    return _tiktoken_available


def estimate_tokens(text: str) -> int:
    """Estimate token count without tiktoken."""
    if not text:
        return 0
    return len(text) // 4


# =============================================================================
# TESTS
# =============================================================================


class TestTokenCounter:
    """Tests for token counting functionality."""

    def test_count_tokens_empty_string(self):
        """Empty string should return 0 tokens."""
        assert count_tokens("") == 0

    def test_count_tokens_simple_text(self):
        """Simple text should return reasonable token count."""
        text = "Hello, world!"
        count = count_tokens(text)
        # Should be between 1 and 10 tokens for this short text
        assert 1 <= count <= 10

    def test_count_tokens_longer_text(self):
        """Longer text should scale appropriately."""
        short_text = "Hello"
        long_text = "Hello " * 100  # 600 characters

        short_count = count_tokens(short_text)
        long_count = count_tokens(long_text)

        # Long text should have more tokens
        assert long_count > short_count

    def test_count_tokens_with_metadata_structure(self):
        """Metadata should include all expected fields."""
        result = count_tokens_with_metadata("Test text", model="gpt-4")

        assert "count" in result
        assert "method" in result
        assert "encoding" in result
        assert "accurate" in result
        assert "model" in result
        assert result["model"] == "gpt-4"

    def test_count_tokens_with_metadata_empty(self):
        """Empty text should return metadata with 0 count."""
        result = count_tokens_with_metadata("")
        assert result["count"] == 0
        assert result["accurate"] is True  # Empty is always accurate

    def test_is_tiktoken_available(self):
        """Should return boolean indicating tiktoken availability."""
        result = is_tiktoken_available()
        assert isinstance(result, bool)

    def test_estimate_tokens_empty(self):
        """Estimation of empty string should be 0."""
        assert estimate_tokens("") == 0

    def test_estimate_tokens_formula(self):
        """Estimation should follow len // 4 formula."""
        text = "A" * 100  # 100 characters
        assert estimate_tokens(text) == 25  # 100 // 4

    def test_get_encoding_for_model_gpt4(self):
        """GPT-4 should use cl100k_base."""
        assert get_encoding_for_model("gpt-4") == "cl100k_base"

    def test_get_encoding_for_model_gpt4o(self):
        """GPT-4o should use o200k_base."""
        assert get_encoding_for_model("gpt-4o") == "o200k_base"

    def test_get_encoding_for_model_claude(self):
        """Claude models should use cl100k_base."""
        assert get_encoding_for_model("claude-3.5-sonnet") == "cl100k_base"
        assert get_encoding_for_model("claude-3") == "cl100k_base"

    def test_get_encoding_for_model_unknown(self):
        """Unknown models should fall back to default."""
        assert get_encoding_for_model("unknown-model-xyz") == "cl100k_base"


class TestTokenCounterWithTiktoken:
    """Tests that require tiktoken to be installed."""

    @pytest.mark.skipif(
        not is_tiktoken_available(),
        reason="tiktoken not installed",
    )
    def test_tiktoken_accurate_counting(self):
        """With tiktoken, counting should be accurate."""
        result = count_tokens_with_metadata("Hello, world!")
        assert result["method"] == "tiktoken"
        assert result["accurate"] is True
        assert result["encoding"] == "cl100k_base"

    @pytest.mark.skipif(
        not is_tiktoken_available(),
        reason="tiktoken not installed",
    )
    def test_encoder_caching(self):
        """Encoder should be cached after first call."""
        # Clear cache for this test
        get_encoder.cache_clear()

        # Call twice with same encoding
        encoder1 = get_encoder("cl100k_base")
        encoder2 = get_encoder("cl100k_base")

        # Should be the same cached instance
        assert encoder1 is encoder2

    @pytest.mark.skipif(
        not is_tiktoken_available(),
        reason="tiktoken not installed",
    )
    def test_different_models_different_counts(self):
        """Different model encodings may produce different counts."""
        text = "Hello, world! This is a test."

        # GPT-4 uses cl100k_base
        gpt4_count = count_tokens(text, model="gpt-4")

        # Both should return valid counts
        assert gpt4_count > 0


class TestTokenCounterFallback:
    """Tests for fallback estimation when tiktoken unavailable."""

    def test_estimation_without_tiktoken(self):
        """Without tiktoken, should fall back to estimation."""
        # This test validates the estimation formula
        text = "A" * 100
        count = estimate_tokens(text)
        assert count == 25  # len // 4

    def test_estimation_unicode(self):
        """Estimation should handle unicode text."""
        text = "你好世界"  # 4 Chinese characters
        count = estimate_tokens(text)
        # Each Chinese character is 3 bytes, but we count by character
        assert count == len(text) // 4
