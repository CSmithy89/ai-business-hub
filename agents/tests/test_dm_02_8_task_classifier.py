"""
Unit tests for DM-02.8: CCR Task-Based Routing

Tests the task classifier including:
- Keyword-based classification
- Explicit hint extraction
- Agent context influence
- Edge cases
"""

import sys
from unittest.mock import MagicMock, patch

import pytest

# Mock httpx before importing modules
httpx_mock = MagicMock()
sys.modules["httpx"] = httpx_mock

# Mock agno.models
agno_models_mock = MagicMock()
sys.modules["agno"] = MagicMock()
sys.modules["agno.models"] = agno_models_mock
sys.modules["agno.models.openai"] = MagicMock()
sys.modules["agno.models.anthropic"] = MagicMock()
sys.modules["agno.models.base"] = MagicMock()

# Now import our modules
from constants.dm_constants import DMConstants
from models.task_classifier import (
    TaskType,
    classify_by_keywords,
    classify_task,
    extract_explicit_hints,
    get_task_type_for_agent,
)


class TestTaskType:
    """Tests for TaskType enum."""

    def test_task_type_values(self) -> None:
        """Verify all expected task types exist."""
        assert TaskType.REASONING.value == "reasoning"
        assert TaskType.CODE_GENERATION.value == "code_generation"
        assert TaskType.LONG_CONTEXT.value == "long_context"
        assert TaskType.GENERAL.value == "general"

    def test_task_type_is_string_enum(self) -> None:
        """Verify TaskType values are strings."""
        for task_type in TaskType:
            assert isinstance(task_type.value, str)


class TestExtractExplicitHints:
    """Tests for extract_explicit_hints function."""

    def test_extracts_code_hint(self) -> None:
        """Test extracting [code] hint."""
        message = "[code] Write a function that calculates factorial"
        assert extract_explicit_hints(message) == "code"

    def test_extracts_reasoning_hint(self) -> None:
        """Test extracting [reasoning] hint."""
        message = "[reasoning] Analyze the pros and cons"
        assert extract_explicit_hints(message) == "reasoning"

    def test_extracts_hint_from_middle(self) -> None:
        """Test extracting hint from middle of message."""
        message = "Can you [analysis] look at this problem?"
        assert extract_explicit_hints(message) == "analysis"

    def test_case_insensitive(self) -> None:
        """Test case insensitivity."""
        message = "[CODE] Write some code"
        assert extract_explicit_hints(message) == "code"

    def test_no_hint_returns_none(self) -> None:
        """Test message without hint returns None."""
        message = "Write a function"
        assert extract_explicit_hints(message) is None

    def test_empty_message_returns_none(self) -> None:
        """Test empty message returns None."""
        assert extract_explicit_hints("") is None
        assert extract_explicit_hints(None) is None  # type: ignore[arg-type]


class TestClassifyByKeywords:
    """Tests for classify_by_keywords function."""

    def test_classifies_reasoning_keywords(self) -> None:
        """Test reasoning keyword classification."""
        messages = [
            "Please analyze this data",
            "Can you evaluate the options?",
            "I need you to reason through this problem",
        ]
        for message in messages:
            result = classify_by_keywords(message)
            assert result == TaskType.REASONING, f"Failed for: {message}"

    def test_classifies_code_keywords(self) -> None:
        """Test code keyword classification."""
        messages = [
            "Write code to implement this feature",
            "I need a function that does X",
            "Please debug this issue",
            "Can you refactor this class?",
        ]
        for message in messages:
            result = classify_by_keywords(message)
            assert result == TaskType.CODE_GENERATION, f"Failed for: {message}"

    def test_classifies_long_context_keywords(self) -> None:
        """Test long context keyword classification."""
        messages = [
            "Please summarize this document",
            "Can you extract key points from this file?",
            "I need a summary of this article",
        ]
        for message in messages:
            result = classify_by_keywords(message)
            assert result == TaskType.LONG_CONTEXT, f"Failed for: {message}"

    def test_write_code_phrase(self) -> None:
        """Test 'write code' phrase detection."""
        message = "Can you write code for this?"
        assert classify_by_keywords(message) == TaskType.CODE_GENERATION

    def test_generate_code_phrase(self) -> None:
        """Test 'generate code' phrase detection."""
        message = "Generate code to solve this"
        assert classify_by_keywords(message) == TaskType.CODE_GENERATION

    def test_no_keywords_returns_none(self) -> None:
        """Test message without keywords returns None."""
        message = "Hello, how are you today?"
        assert classify_by_keywords(message) is None

    def test_empty_message_returns_none(self) -> None:
        """Test empty message returns None."""
        assert classify_by_keywords("") is None
        assert classify_by_keywords(None) is None  # type: ignore[arg-type]


class TestGetTaskTypeForAgent:
    """Tests for get_task_type_for_agent function."""

    def test_explicit_hint_priority(self) -> None:
        """Test explicit hints have highest priority."""
        # Agent default is reasoning, but hint says code
        result = get_task_type_for_agent(
            agent_id="navi",  # Default: reasoning
            message="[code] Write some code",
        )
        assert result == TaskType.CODE_GENERATION

    def test_agent_default_used(self) -> None:
        """Test agent default is used when no hints or keywords."""
        result = get_task_type_for_agent(
            agent_id="sage",  # Default: code_generation
            message="Hello",  # No keywords
        )
        assert result == TaskType.CODE_GENERATION

    def test_keyword_classification_fallback(self) -> None:
        """Test keyword classification when no agent default."""
        result = get_task_type_for_agent(
            agent_id="unknown_agent",
            message="Please analyze this data",
        )
        assert result == TaskType.REASONING

    def test_general_fallback(self) -> None:
        """Test general fallback when nothing matches."""
        result = get_task_type_for_agent(
            agent_id="unknown_agent",
            message="Hello world",
        )
        assert result == TaskType.GENERAL

    def test_no_message_uses_agent_default(self) -> None:
        """Test no message uses agent default."""
        result = get_task_type_for_agent(
            agent_id="scribe",  # Default: long_context
            message=None,  # type: ignore[arg-type]
        )
        assert result == TaskType.LONG_CONTEXT


class TestClassifyTask:
    """Tests for classify_task convenience function."""

    def test_basic_classification(self) -> None:
        """Test basic classification works."""
        result = classify_task("Please analyze this problem")
        assert result == TaskType.REASONING

    def test_with_agent_id(self) -> None:
        """Test classification with agent ID."""
        result = classify_task(
            message="Hello",
            agent_id="sage",
        )
        assert result == TaskType.CODE_GENERATION

    def test_without_agent_id(self) -> None:
        """Test classification without agent ID falls back to keywords."""
        result = classify_task("Write code to implement this")
        assert result == TaskType.CODE_GENERATION


class TestDMConstantsUsage:
    """Verify DMConstants are used correctly."""

    def test_reasoning_keywords_exist(self) -> None:
        """Verify reasoning keywords defined."""
        keywords = DMConstants.TASK_CLASSIFICATION.REASONING_KEYWORDS
        assert "analyze" in keywords
        assert "reason" in keywords
        assert "plan" in keywords

    def test_code_keywords_exist(self) -> None:
        """Verify code keywords defined."""
        keywords = DMConstants.TASK_CLASSIFICATION.CODE_KEYWORDS
        assert "code" in keywords
        assert "implement" in keywords
        assert "debug" in keywords

    def test_long_context_keywords_exist(self) -> None:
        """Verify long context keywords defined."""
        keywords = DMConstants.TASK_CLASSIFICATION.LONG_CONTEXT_KEYWORDS
        assert "document" in keywords
        assert "summarize" in keywords
        assert "summary" in keywords

    def test_explicit_hint_pattern_exists(self) -> None:
        """Verify explicit hint pattern defined."""
        pattern = DMConstants.TASK_CLASSIFICATION.EXPLICIT_HINT_PATTERN
        assert pattern is not None
        assert "[" in pattern  # Should match brackets

    def test_valid_task_types_exist(self) -> None:
        """Verify valid task types defined."""
        valid_types = DMConstants.TASK_CLASSIFICATION.VALID_TASK_TYPES
        assert "reasoning" in valid_types
        assert "code_generation" in valid_types
        assert "long_context" in valid_types
        assert "general" in valid_types


class TestEdgeCases:
    """Tests for edge cases."""

    def test_mixed_keywords(self) -> None:
        """Test message with multiple keyword types."""
        # Code keywords should win due to 'code' keyword
        message = "Please analyze the code and debug it"
        result = classify_by_keywords(message)
        # Both 'analyze' (reasoning) and 'code', 'debug' (code)
        # Code should win with 2 matches
        assert result == TaskType.CODE_GENERATION

    def test_very_long_message(self) -> None:
        """Test classification of very long message."""
        message = "analyze " * 100  # Many reasoning keywords
        result = classify_by_keywords(message)
        assert result == TaskType.REASONING

    def test_special_characters(self) -> None:
        """Test message with special characters."""
        message = "[code] Write a function(): def foo(x):"
        hint = extract_explicit_hints(message)
        assert hint == "code"

    def test_unicode_message(self) -> None:
        """Test message with unicode."""
        message = "[code] 编写代码 write function"
        hint = extract_explicit_hints(message)
        assert hint == "code"

    def test_normalize_hint_aliases(self) -> None:
        """Test hint normalization for aliases."""
        from agents.models.task_classifier import _normalize_hint_to_task_type

        assert _normalize_hint_to_task_type("code") == TaskType.CODE_GENERATION
        assert _normalize_hint_to_task_type("coding") == TaskType.CODE_GENERATION
        assert _normalize_hint_to_task_type("analysis") == TaskType.REASONING
        assert _normalize_hint_to_task_type("summary") == TaskType.LONG_CONTEXT
        assert _normalize_hint_to_task_type("unknown") is None
