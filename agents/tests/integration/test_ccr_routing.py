"""
CCR Routing Integration Tests

Tests CCR (Claude Code Router) routing behavior:
- Route to primary model for standard tasks
- Route by task type (reasoning, code generation, etc.)
- Respect workspace preferences
- Return routing metadata

DM-09.7: CCR Operational Verification Tests
@see docs/modules/bm-dm/stories/dm-09-7-ccr-operational-tests.md
"""

import sys
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Setup anyio for async tests
pytest_plugins = ["anyio"]


class TestCCRRoutingPrimary:
    """Tests for CCR primary model routing."""

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_route_to_primary_for_standard_task(
        self, ccr_enabled, ccr_test_config, mock_settings
    ):
        """Standard tasks route to configured primary model."""
        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch("agents.models.ccr_provider._should_use_ccr", return_value=True):
                with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):
                    from agents.models.ccr_provider import CCRModel, get_model_for_agent

                    # Mock OpenAIChat parent class
                    with patch(
                        "agents.models.ccr_provider.OpenAIChat",
                        return_value=MagicMock(id="auto"),
                    ):
                        # Get model for a standard agent
                        model = get_model_for_agent(
                            agent_id="navi",
                            task_type="general",
                        )

                        # Should return CCR model with auto routing
                        assert model is not None
                        assert model.id == "auto"

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_route_returns_ccr_model_type(
        self, ccr_enabled, ccr_test_config, mock_settings
    ):
        """Routing returns CCRModel type when CCR is enabled."""
        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch("agents.models.ccr_provider._should_use_ccr", return_value=True):
                with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):
                    # Create a simple mock for OpenAIChat
                    class MockOpenAIChat:
                        def __init__(self, **kwargs):
                            self.id = kwargs.get("id", "auto")
                            self.task_type = None
                            self._agent_id = None
                            self._auto_classify = True
                            self._last_message = None
                            self._routing_metadata = None

                    with patch(
                        "agents.models.ccr_provider.OpenAIChat",
                        MockOpenAIChat,
                    ):
                        from agents.models.ccr_provider import CCRModel, get_model_for_agent

                        model = get_model_for_agent(
                            agent_id="navi",
                            task_type="reasoning",
                        )

                        # Model should have CCR attributes
                        assert hasattr(model, "id")
                        assert model.id == "auto"


class TestCCRRoutingByTaskType:
    """Tests for CCR routing by task type."""

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_route_reasoning_task(self, ccr_enabled, ccr_test_config, mock_settings):
        """Reasoning tasks route to reasoning-optimized model."""
        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):
                # Test task classification for reasoning
                from models.task_classifier import TaskType, classify_task

                result = classify_task(
                    message="Analyze the project requirements and plan the architecture",
                    agent_id="dashboard_gateway",
                )

                assert result == TaskType.REASONING

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_route_code_generation_task(
        self, ccr_enabled, ccr_test_config, mock_settings
    ):
        """Code generation tasks route to code-optimized model."""
        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):
                from models.task_classifier import TaskType, classify_task

                result = classify_task(
                    message="Implement a function to calculate the fibonacci sequence",
                    agent_id="sage",
                )

                assert result == TaskType.CODE_GENERATION

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_route_long_context_task(self, ccr_enabled, ccr_test_config, mock_settings):
        """Long context tasks route to context-optimized model."""
        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):
                from models.task_classifier import TaskType, classify_task

                result = classify_task(
                    message="Summarize this document and extract key points",
                    agent_id="scribe",
                )

                assert result == TaskType.LONG_CONTEXT

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_route_general_task(self, ccr_enabled, ccr_test_config, mock_settings):
        """General tasks without specific hints route to general model."""
        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):
                from models.task_classifier import TaskType, classify_task

                result = classify_task(
                    message="Hello, how are you?",
                    agent_id="unknown",
                )

                assert result == TaskType.GENERAL

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_explicit_task_hint_override(
        self, ccr_enabled, ccr_test_config, mock_settings
    ):
        """Explicit task hints override keyword-based classification."""
        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):
                from models.task_classifier import TaskType, classify_task

                # Message with code keywords but explicit [reasoning] hint
                result = classify_task(
                    message="[reasoning] Write code to implement the algorithm",
                    agent_id="navi",
                )

                assert result == TaskType.REASONING


class TestCCRWorkspacePreferences:
    """Tests for CCR workspace preference handling."""

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_respect_user_byoai_preference(
        self, ccr_enabled, ccr_test_config, mock_settings
    ):
        """User BYOAI preference disables CCR."""
        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            from agents.models.ccr_provider import _should_use_ccr_with_reason

            user_config = {"use_platform_subscription": False}
            use_ccr, reason = _should_use_ccr_with_reason(user_config)

            assert use_ccr is False
            assert reason == "user_preference_byoai"

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_respect_platform_subscription_default(
        self, ccr_enabled, ccr_test_config, mock_settings
    ):
        """Default platform subscription enables CCR."""
        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch(
                "agents.models.ccr_provider._get_health_checker_sync", return_value=None
            ):
                from agents.models.ccr_provider import _should_use_ccr_with_reason

                user_config = {"use_platform_subscription": True}
                use_ccr, reason = _should_use_ccr_with_reason(user_config)

                assert use_ccr is True
                assert reason is None

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_ccr_disabled_returns_byoai(self, ccr_test_config):
        """CCR disabled falls back to BYOAI."""
        mock_settings = MagicMock()
        mock_settings.ccr_enabled = False

        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            from agents.models.ccr_provider import _should_use_ccr_with_reason

            use_ccr, reason = _should_use_ccr_with_reason()

            assert use_ccr is False
            assert reason == "ccr_disabled"


class TestCCRRoutingMetadata:
    """Tests for CCR routing metadata."""

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_routing_metadata_includes_source(
        self, ccr_enabled, ccr_test_config, mock_settings
    ):
        """Routing metadata includes routing source."""
        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):

                class MockOpenAIChat:
                    def __init__(self, **kwargs):
                        self.id = kwargs.get("id", "auto")
                        self.task_type = kwargs.get("task_type")
                        self._agent_id = kwargs.get("agent_id")
                        self._routing_metadata = None
                        self._auto_classify = True
                        self._last_message = None

                with patch(
                    "agents.models.ccr_provider.OpenAIChat",
                    MockOpenAIChat,
                ):
                    from agents.models.ccr_provider import CCRRoutingMetadata

                    metadata = CCRRoutingMetadata(
                        source="ccr",
                        task_type="reasoning",
                        agent_id="navi",
                        model_requested="auto",
                    )

                    assert metadata.source == "ccr"
                    assert metadata.task_type == "reasoning"
                    assert metadata.agent_id == "navi"
                    assert metadata.model_requested == "auto"

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_routing_metadata_to_dict(self, ccr_enabled, ccr_test_config, mock_settings):
        """Routing metadata can be serialized to dict."""
        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            from agents.models.ccr_provider import CCRRoutingMetadata

            metadata = CCRRoutingMetadata(
                source="ccr",
                task_type="code_generation",
                agent_id="sage",
                model_requested="auto",
                model_used="claude-sonnet-4-20250514",
            )

            result = metadata.to_dict()

            assert result["routing_source"] == "ccr"
            assert result["task_type"] == "code_generation"
            assert result["agent_id"] == "sage"
            assert result["model_requested"] == "auto"
            assert result["model_used"] == "claude-sonnet-4-20250514"

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_byoai_routing_includes_fallback_reason(
        self, ccr_enabled, ccr_test_config, mock_settings
    ):
        """BYOAI routing includes fallback reason in metadata."""
        mock_settings.ccr_enabled = False

        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            from agents.models.ccr_provider import CCRRoutingMetadata

            metadata = CCRRoutingMetadata(
                source="byoai",
                task_type="reasoning",
                agent_id="navi",
                model_requested="claude-sonnet-4-20250514",
                fallback_reason="ccr_disabled",
            )

            result = metadata.to_dict()

            assert result["routing_source"] == "byoai"
            assert result["fallback_reason"] == "ccr_disabled"


class TestCCRModelHeaders:
    """Tests for CCR model request headers."""

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_ccr_model_includes_task_type_header(
        self, ccr_enabled, ccr_test_config, mock_settings
    ):
        """CCRModel includes X-CCR-Task-Type header."""
        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):

                class MockOpenAIChat:
                    def __init__(self, **kwargs):
                        self.id = kwargs.get("id", "auto")

                with patch(
                    "agents.models.ccr_provider.OpenAIChat",
                    MockOpenAIChat,
                ):
                    from agents.models.ccr_provider import CCRModel

                    model = CCRModel(
                        model_id="auto",
                        task_type="reasoning",
                        agent_id="navi",
                    )

                    headers = model.get_request_headers()

                    assert "X-CCR-Task-Type" in headers
                    assert headers["X-CCR-Task-Type"] == "reasoning"

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_ccr_model_includes_agent_id_header(
        self, ccr_enabled, ccr_test_config, mock_settings
    ):
        """CCRModel includes X-CCR-Agent-Id header."""
        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):

                class MockOpenAIChat:
                    def __init__(self, **kwargs):
                        self.id = kwargs.get("id", "auto")

                with patch(
                    "agents.models.ccr_provider.OpenAIChat",
                    MockOpenAIChat,
                ):
                    from agents.models.ccr_provider import CCRModel

                    model = CCRModel(
                        model_id="auto",
                        task_type="code_generation",
                        agent_id="sage",
                    )

                    headers = model.get_request_headers()

                    assert "X-CCR-Agent-Id" in headers
                    assert headers["X-CCR-Agent-Id"] == "sage"

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_ccr_model_auto_classifies_message(
        self, ccr_enabled, ccr_test_config, mock_settings
    ):
        """CCRModel auto-classifies message when task_type not set."""
        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):

                class MockOpenAIChat:
                    def __init__(self, **kwargs):
                        self.id = kwargs.get("id", "auto")

                with patch(
                    "agents.models.ccr_provider.OpenAIChat",
                    MockOpenAIChat,
                ):
                    from agents.models.ccr_provider import CCRModel

                    # Use agent_id without default task type to test auto-classification
                    model = CCRModel(
                        model_id="auto",
                        task_type=None,  # No explicit task type
                        agent_id="unknown_agent",  # No default preferences
                        auto_classify=True,
                    )

                    # Set message context for auto-classification
                    model.set_message_context("Implement a sorting algorithm")

                    headers = model.get_request_headers()

                    # Should auto-classify as code_generation based on keywords
                    assert "X-CCR-Task-Type" in headers
                    assert headers["X-CCR-Task-Type"] == "code_generation"
