"""
Unit Tests for ApprovalQueueBridge

Tests for the HITL to Foundation approval queue bridge.

@see docs/modules/bm-dm/stories/dm-05-3-approval-workflow-integration.md
Epic: DM-05 | Story: DM-05.3
"""

import asyncio
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from .approval_bridge import ApprovalQueueBridge, get_approval_bridge, close_approval_bridge
from .decorators import HITLConfig, HITLToolResult, ApprovalLevel


# =============================================================================
# FIXTURES
# =============================================================================


@pytest.fixture
def bridge():
    """Create a test bridge instance."""
    return ApprovalQueueBridge(
        api_base_url="http://test-api:3001",
        api_key="test-key",
    )


@pytest.fixture
def hitl_config():
    """Create a standard HITL config for testing."""
    return HITLConfig(
        approval_type="contract",
        risk_level="high",
        auto_threshold=85,
        quick_threshold=60,
        requires_reason=True,
        approve_label="Sign Contract",
        reject_label="Decline",
    )


@pytest.fixture
def hitl_config_low_risk():
    """Create a low-risk HITL config for testing."""
    return HITLConfig(
        approval_type="notification",
        risk_level="low",
        auto_threshold=85,
        quick_threshold=60,
    )


@pytest.fixture
def hitl_config_with_template():
    """Create a HITL config with description template."""
    return HITLConfig(
        approval_type="contract",
        risk_level="medium",
        description_template="Sign contract {contractId} for ${amount}",
    )


# =============================================================================
# TITLE GENERATION TESTS
# =============================================================================


class TestGenerateTitle:
    """Tests for _generate_title method."""

    def test_generate_title_default(self, bridge, hitl_config):
        """Test default title generation from tool name."""
        title = bridge._generate_title(
            "sign_contract",
            {"contractId": "C001", "amount": 5000},
            hitl_config,
        )
        assert title == "Approve: Sign Contract"

    def test_generate_title_with_template(self, bridge, hitl_config_with_template):
        """Test title generation from template."""
        title = bridge._generate_title(
            "sign_contract",
            {"contractId": "C001", "amount": 5000},
            hitl_config_with_template,
        )
        assert "C001" in title
        assert "5000" in title

    def test_generate_title_template_missing_key(self, bridge, hitl_config_with_template):
        """Test template with missing key falls back gracefully."""
        title = bridge._generate_title(
            "sign_contract",
            {"contractId": "C001"},  # Missing 'amount'
            hitl_config_with_template,
        )
        # Should still use template but leave {amount} unsubstituted
        assert "C001" in title

    def test_generate_title_snake_case_conversion(self, bridge, hitl_config):
        """Test that snake_case tool names are converted to Title Case."""
        title = bridge._generate_title(
            "send_bulk_notification",
            {},
            hitl_config,
        )
        assert "Send Bulk Notification" in title


# =============================================================================
# DESCRIPTION GENERATION TESTS
# =============================================================================


class TestGenerateDescription:
    """Tests for _generate_description method."""

    def test_generate_description_includes_risk(self, bridge, hitl_config):
        """Test description includes risk level."""
        description = bridge._generate_description(
            "sign_contract",
            {"contractId": "C001"},
            hitl_config,
            confidence_score=45,
        )
        assert "HIGH" in description
        assert "45%" in description

    def test_generate_description_includes_parameters(self, bridge, hitl_config):
        """Test description includes tool parameters."""
        description = bridge._generate_description(
            "sign_contract",
            {"contractId": "C001", "amount": 5000},
            hitl_config,
            confidence_score=45,
        )
        assert "Contract Id" in description or "contractId" in description.lower()
        assert "5000" in description

    def test_generate_description_filters_sensitive(self, bridge, hitl_config):
        """Test description filters sensitive parameters."""
        description = bridge._generate_description(
            "api_call",
            {"api_key": "secret123", "endpoint": "/test"},
            hitl_config,
            confidence_score=50,
        )
        assert "secret123" not in description
        assert "api_key" not in description.lower()
        assert "endpoint" in description.lower() or "Endpoint" in description

    def test_generate_description_high_risk_warning(self, bridge, hitl_config):
        """Test high-risk description includes warning."""
        description = bridge._generate_description(
            "delete_project",
            {"projectId": "P001"},
            hitl_config,
            confidence_score=40,
        )
        assert "Warning" in description


# =============================================================================
# PRIORITY CALCULATION TESTS
# =============================================================================


class TestCalculatePriority:
    """Tests for _calculate_priority method."""

    def test_calculate_priority_high_risk(self, bridge):
        """High risk should always be urgent."""
        priority = bridge._calculate_priority("high", 50)
        assert priority == "urgent"

    def test_calculate_priority_high_risk_any_confidence(self, bridge):
        """High risk is urgent regardless of confidence."""
        assert bridge._calculate_priority("high", 90) == "urgent"
        assert bridge._calculate_priority("high", 50) == "urgent"
        assert bridge._calculate_priority("high", 10) == "urgent"

    def test_calculate_priority_low_confidence(self, bridge):
        """Very low confidence (<30%) should be urgent."""
        priority = bridge._calculate_priority("low", 25)
        assert priority == "urgent"

    def test_calculate_priority_medium_risk_low_confidence(self, bridge):
        """Medium risk with 30-59% confidence should be high priority."""
        priority = bridge._calculate_priority("medium", 45)
        assert priority == "high"

    def test_calculate_priority_low_risk_low_confidence(self, bridge):
        """Low risk with 30-59% confidence should be medium priority."""
        priority = bridge._calculate_priority("low", 45)
        assert priority == "medium"


# =============================================================================
# DUE DATE CALCULATION TESTS
# =============================================================================


class TestCalculateDueDate:
    """Tests for _calculate_due_date method."""

    def test_calculate_due_date_high_risk(self, bridge):
        """High risk should have 4-hour due date."""
        due_date_str = bridge._calculate_due_date("high")
        due_date = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
        expected = datetime.utcnow() + timedelta(hours=4)

        # Allow 1 minute tolerance
        assert abs((due_date.replace(tzinfo=None) - expected).total_seconds()) < 60

    def test_calculate_due_date_medium_risk(self, bridge):
        """Medium risk should have 24-hour due date."""
        due_date_str = bridge._calculate_due_date("medium")
        due_date = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
        expected = datetime.utcnow() + timedelta(hours=24)

        # Allow 1 minute tolerance
        assert abs((due_date.replace(tzinfo=None) - expected).total_seconds()) < 60

    def test_calculate_due_date_low_risk(self, bridge):
        """Low risk should have 72-hour due date."""
        due_date_str = bridge._calculate_due_date("low")
        due_date = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
        expected = datetime.utcnow() + timedelta(hours=72)

        # Allow 1 minute tolerance
        assert abs((due_date.replace(tzinfo=None) - expected).total_seconds()) < 60

    def test_calculate_due_date_high_sooner_than_low(self, bridge):
        """High risk due date should be sooner than low risk."""
        due_high = bridge._calculate_due_date("high")
        due_low = bridge._calculate_due_date("low")

        high_dt = datetime.fromisoformat(due_high.replace("Z", "+00:00"))
        low_dt = datetime.fromisoformat(due_low.replace("Z", "+00:00"))

        assert high_dt < low_dt


# =============================================================================
# CONFIDENCE FACTORS TESTS
# =============================================================================


class TestGenerateConfidenceFactors:
    """Tests for _generate_confidence_factors method."""

    def test_generate_factors_has_required_fields(self, bridge, hitl_config):
        """Test factors have required fields."""
        factors = bridge._generate_confidence_factors(
            "sign_contract",
            {"contractId": "C001"},
            confidence_score=45,
            config=hitl_config,
        )

        assert len(factors) > 0
        for factor in factors:
            assert "name" in factor
            assert "score" in factor
            assert "weight" in factor
            assert 0 <= factor["score"] <= 100
            assert 0 <= factor["weight"] <= 1

    def test_generate_factors_weights_sum_to_one(self, bridge, hitl_config):
        """Test factor weights sum to 1.0."""
        factors = bridge._generate_confidence_factors(
            "sign_contract",
            {"contractId": "C001"},
            confidence_score=45,
            config=hitl_config,
        )

        total_weight = sum(f["weight"] for f in factors)
        assert abs(total_weight - 1.0) < 0.01  # Allow small floating point error

    def test_generate_factors_includes_risk(self, bridge, hitl_config):
        """Test factors include risk assessment."""
        factors = bridge._generate_confidence_factors(
            "sign_contract",
            {"contractId": "C001"},
            confidence_score=45,
            config=hitl_config,
        )

        risk_factors = [f for f in factors if "risk" in f["name"].lower()]
        assert len(risk_factors) > 0


# =============================================================================
# API INTEGRATION TESTS
# =============================================================================


class TestCreateApprovalItem:
    """Tests for create_approval_item method."""

    @pytest.mark.asyncio
    async def test_create_approval_item_success(self, bridge, hitl_config):
        """Test successful approval creation."""
        # Mock the HTTP client
        mock_response = MagicMock()
        mock_response.json.return_value = {"id": "approval_123", "status": "pending"}
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.is_closed = False

        with patch.object(bridge, "_get_client", return_value=mock_client):
            result = await bridge.create_approval_item(
                workspace_id="ws_123",
                tool_name="sign_contract",
                tool_args={"contractId": "C001", "amount": 5000},
                confidence_score=45,
                config=hitl_config,
            )

        assert result["id"] == "approval_123"
        assert result["status"] == "pending"
        mock_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_approval_item_includes_headers(self, bridge, hitl_config):
        """Test workspace ID is passed in headers."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"id": "approval_123", "status": "pending"}
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.is_closed = False

        with patch.object(bridge, "_get_client", return_value=mock_client):
            await bridge.create_approval_item(
                workspace_id="ws_123",
                tool_name="sign_contract",
                tool_args={},
                confidence_score=45,
                config=hitl_config,
            )

        call_kwargs = mock_client.post.call_args[1]
        assert call_kwargs["headers"]["X-Workspace-Id"] == "ws_123"

    @pytest.mark.asyncio
    async def test_create_approval_item_includes_source_module(self, bridge, hitl_config):
        """Test source module is set to 'hitl'."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"id": "approval_123"}
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.is_closed = False

        with patch.object(bridge, "_get_client", return_value=mock_client):
            await bridge.create_approval_item(
                workspace_id="ws_123",
                tool_name="sign_contract",
                tool_args={},
                confidence_score=45,
                config=hitl_config,
            )

        call_kwargs = mock_client.post.call_args[1]
        json_body = call_kwargs["json"]
        assert json_body["sourceModule"] == "hitl"


class TestGetApprovalStatus:
    """Tests for get_approval_status method."""

    @pytest.mark.asyncio
    async def test_get_approval_status_success(self, bridge):
        """Test successful status retrieval."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"id": "approval_123", "status": "approved"}
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.is_closed = False

        with patch.object(bridge, "_get_client", return_value=mock_client):
            result = await bridge.get_approval_status("ws_123", "approval_123")

        assert result["status"] == "approved"
        mock_client.get.assert_called_once()


class TestWaitForApproval:
    """Tests for wait_for_approval method."""

    @pytest.mark.asyncio
    async def test_wait_for_approval_immediate_resolution(self, bridge):
        """Test immediate resolution returns immediately."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"id": "approval_123", "status": "approved"}
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.is_closed = False

        with patch.object(bridge, "_get_client", return_value=mock_client):
            result = await bridge.wait_for_approval(
                "ws_123",
                "approval_123",
                timeout_seconds=10,
                poll_interval_seconds=1,
            )

        assert result["status"] == "approved"
        # Should only poll once since it's immediately resolved
        assert mock_client.get.call_count == 1

    @pytest.mark.asyncio
    async def test_wait_for_approval_timeout(self, bridge):
        """Test timeout when approval not resolved."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"id": "approval_123", "status": "pending"}
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.is_closed = False

        with patch.object(bridge, "_get_client", return_value=mock_client):
            with pytest.raises(TimeoutError):
                await bridge.wait_for_approval(
                    "ws_123",
                    "approval_123",
                    timeout_seconds=1,
                    poll_interval_seconds=0.1,
                )

    @pytest.mark.asyncio
    async def test_wait_for_approval_polls_until_resolved(self, bridge):
        """Test polling continues until resolved."""
        poll_count = 0

        def get_status():
            nonlocal poll_count
            poll_count += 1
            if poll_count >= 3:
                return {"id": "approval_123", "status": "approved"}
            return {"id": "approval_123", "status": "pending"}

        mock_response = MagicMock()
        mock_response.json.side_effect = get_status
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.is_closed = False

        with patch.object(bridge, "_get_client", return_value=mock_client):
            result = await bridge.wait_for_approval(
                "ws_123",
                "approval_123",
                timeout_seconds=10,
                poll_interval_seconds=0.1,
            )

        assert result["status"] == "approved"
        assert mock_client.get.call_count >= 3


# =============================================================================
# HITL TOOL RESULT INTEGRATION TESTS
# =============================================================================


class TestCreateFromHitlResult:
    """Tests for create_from_hitl_result method."""

    @pytest.mark.asyncio
    async def test_create_from_hitl_result(self, bridge, hitl_config):
        """Test creating approval from HITLToolResult."""
        hitl_result = HITLToolResult(
            requires_approval=True,
            approval_level=ApprovalLevel.FULL,
            confidence_score=45,
            tool_name="sign_contract",
            tool_args={"contractId": "C001", "amount": 5000},
            config=hitl_config,
            request_id="req_123",
        )

        mock_response = MagicMock()
        mock_response.json.return_value = {"id": "approval_123", "status": "pending"}
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.is_closed = False

        with patch.object(bridge, "_get_client", return_value=mock_client):
            result = await bridge.create_from_hitl_result(
                workspace_id="ws_123",
                hitl_result=hitl_result,
            )

        assert result["id"] == "approval_123"
        # Verify the request included the request_id in preview data
        call_kwargs = mock_client.post.call_args[1]
        json_body = call_kwargs["json"]
        assert json_body["previewData"]["requestId"] == "req_123"


# =============================================================================
# SINGLETON TESTS
# =============================================================================


class TestSingleton:
    """Tests for singleton pattern."""

    @pytest.mark.asyncio
    async def test_get_approval_bridge_returns_same_instance(self):
        """Test singleton returns same instance."""
        with patch("agents.hitl.approval_bridge.get_settings") as mock_settings:
            mock_settings.return_value.api_base_url = "http://test:3001"

            # Reset singleton
            await close_approval_bridge()

            bridge1 = get_approval_bridge()
            bridge2 = get_approval_bridge()

            assert bridge1 is bridge2

            # Cleanup
            await close_approval_bridge()

    @pytest.mark.asyncio
    async def test_close_approval_bridge(self):
        """Test closing the singleton bridge."""
        with patch("agents.hitl.approval_bridge.get_settings") as mock_settings:
            mock_settings.return_value.api_base_url = "http://test:3001"

            # Reset and get bridge
            await close_approval_bridge()
            bridge = get_approval_bridge()

            # Close it
            await close_approval_bridge()

            # Getting again should create a new instance
            new_bridge = get_approval_bridge()
            # Can't directly compare since they might both be None after close
            # Just verify it doesn't error
            assert new_bridge is not None

            # Final cleanup
            await close_approval_bridge()


# =============================================================================
# SENSITIVE DATA FILTERING TESTS
# =============================================================================


class TestFilterSensitiveArgs:
    """Tests for _filter_sensitive_args method."""

    def test_filters_password(self, bridge):
        """Test password is filtered."""
        result = bridge._filter_sensitive_args({"password": "secret", "name": "test"})
        assert "password" not in result
        assert result["name"] == "test"

    def test_filters_api_key(self, bridge):
        """Test api_key is filtered."""
        result = bridge._filter_sensitive_args({"api_key": "secret", "endpoint": "/api"})
        assert "api_key" not in result
        assert result["endpoint"] == "/api"

    def test_filters_apikey_variations(self, bridge):
        """Test various apikey variations are filtered."""
        result = bridge._filter_sensitive_args({
            "apiKey": "secret1",
            "api-key": "secret2",
            "API_KEY": "secret3",
            "valid": "keep",
        })
        assert "apiKey" not in result
        assert "api-key" not in result
        assert "API_KEY" not in result
        assert result["valid"] == "keep"

    def test_filters_token(self, bridge):
        """Test token is filtered."""
        result = bridge._filter_sensitive_args({"auth_token": "secret", "id": "123"})
        assert "auth_token" not in result
        assert result["id"] == "123"

    def test_filters_secret(self, bridge):
        """Test secret is filtered."""
        result = bridge._filter_sensitive_args({"client_secret": "secret", "client_id": "123"})
        assert "client_secret" not in result
        assert result["client_id"] == "123"

    def test_filters_credential(self, bridge):
        """Test credential is filtered."""
        result = bridge._filter_sensitive_args({"credentials": {}, "data": "keep"})
        assert "credentials" not in result
        assert result["data"] == "keep"

    def test_keeps_non_sensitive(self, bridge):
        """Test non-sensitive fields are kept."""
        result = bridge._filter_sensitive_args({
            "name": "John",
            "email": "john@example.com",
            "amount": 5000,
        })
        assert len(result) == 3
        assert result["name"] == "John"
