"""
Unit Tests for HITL Decorators

Comprehensive tests for the Human-in-the-Loop tool decorator system.
Tests cover:
- ApprovalLevel enum
- HITLConfig Pydantic model
- HITLToolResult model
- calculate_confidence function
- determine_approval_level function
- @hitl_tool decorator
- Utility functions

Run with: pytest agents/hitl/test_decorators.py -v

Epic: DM-05 | Story: DM-05.1
"""

import pytest
from pydantic import ValidationError

from hitl import (
    ApprovalLevel,
    BASE_CONFIDENCE_SCORES,
    DEFAULT_CONFIDENCE_SCORE,
    HITLConfig,
    HITLToolResult,
    calculate_confidence,
    determine_approval_level,
    get_hitl_config,
    hitl_tool,
    is_hitl_pending,
    is_hitl_tool,
)


# =============================================================================
# APPROVAL LEVEL ENUM TESTS
# =============================================================================


class TestApprovalLevel:
    """Tests for ApprovalLevel enum."""

    def test_enum_values(self):
        """Test that enum values match expected strings."""
        assert ApprovalLevel.AUTO.value == "auto"
        assert ApprovalLevel.QUICK.value == "quick"
        assert ApprovalLevel.FULL.value == "full"

    def test_enum_comparison(self):
        """Test enum comparison works correctly."""
        assert ApprovalLevel.AUTO == ApprovalLevel.AUTO
        assert ApprovalLevel.AUTO != ApprovalLevel.QUICK
        assert ApprovalLevel.QUICK != ApprovalLevel.FULL

    def test_enum_string_comparison(self):
        """Test enum compares equal to its string value."""
        assert ApprovalLevel.AUTO == "auto"
        assert ApprovalLevel.QUICK == "quick"
        assert ApprovalLevel.FULL == "full"

    def test_enum_from_string(self):
        """Test creating enum from string value."""
        assert ApprovalLevel("auto") == ApprovalLevel.AUTO
        assert ApprovalLevel("quick") == ApprovalLevel.QUICK
        assert ApprovalLevel("full") == ApprovalLevel.FULL


# =============================================================================
# HITL CONFIG TESTS
# =============================================================================


class TestHITLConfig:
    """Tests for HITLConfig Pydantic model."""

    def test_defaults(self):
        """Test default values are correct."""
        config = HITLConfig()
        assert config.auto_threshold == 85
        assert config.quick_threshold == 60
        assert config.approval_type == "general"
        assert config.risk_level == "medium"
        assert config.requires_reason is False
        assert config.timeout_seconds == 300
        assert config.approve_label == "Approve"
        assert config.reject_label == "Reject"
        assert config.description_template is None

    def test_custom_values(self):
        """Test custom configuration values."""
        config = HITLConfig(
            auto_threshold=95,
            quick_threshold=70,
            approval_type="contract",
            risk_level="high",
            requires_reason=True,
            timeout_seconds=600,
            approve_label="Sign",
            reject_label="Cancel",
            description_template="Sign {contract_id}",
        )
        assert config.auto_threshold == 95
        assert config.quick_threshold == 70
        assert config.approval_type == "contract"
        assert config.risk_level == "high"
        assert config.requires_reason is True
        assert config.timeout_seconds == 600
        assert config.approve_label == "Sign"
        assert config.reject_label == "Cancel"
        assert config.description_template == "Sign {contract_id}"

    def test_validation_threshold_too_high(self):
        """Test validation rejects threshold > 100."""
        with pytest.raises(ValidationError):
            HITLConfig(auto_threshold=150)

    def test_validation_threshold_too_low(self):
        """Test validation rejects threshold < 0."""
        with pytest.raises(ValidationError):
            HITLConfig(quick_threshold=-10)

    def test_validation_timeout_too_low(self):
        """Test validation rejects timeout < 1."""
        with pytest.raises(ValidationError):
            HITLConfig(timeout_seconds=0)

    def test_serialization(self):
        """Test config serializes correctly."""
        config = HITLConfig(auto_threshold=90)
        data = config.model_dump()
        assert data["auto_threshold"] == 90
        assert data["quick_threshold"] == 60
        assert "approval_type" in data

    def test_from_dict(self):
        """Test config can be created from dictionary."""
        data = {"auto_threshold": 92, "risk_level": "high"}
        config = HITLConfig(**data)
        assert config.auto_threshold == 92
        assert config.risk_level == "high"


# =============================================================================
# HITL TOOL RESULT TESTS
# =============================================================================


class TestHITLToolResult:
    """Tests for HITLToolResult Pydantic model."""

    def test_required_fields(self):
        """Test required fields are enforced."""
        with pytest.raises(ValidationError):
            HITLToolResult()  # Missing required fields

    def test_valid_result(self):
        """Test creating a valid result."""
        result = HITLToolResult(
            requires_approval=True,
            approval_level=ApprovalLevel.QUICK,
            confidence_score=72,
            tool_name="sign_contract",
            tool_args={"contract_id": "C123", "amount": 5000},
            config=HITLConfig(),
        )
        assert result.requires_approval is True
        assert result.approval_level == ApprovalLevel.QUICK
        assert result.confidence_score == 72
        assert result.tool_name == "sign_contract"
        assert result.tool_args["contract_id"] == "C123"
        assert result.request_id is not None  # Auto-generated

    def test_confidence_score_validation(self):
        """Test confidence score must be 0-100."""
        with pytest.raises(ValidationError):
            HITLToolResult(
                requires_approval=True,
                approval_level=ApprovalLevel.FULL,
                confidence_score=150,  # Invalid
                tool_name="test",
                config=HITLConfig(),
            )

    def test_to_marker_dict(self):
        """Test conversion to HITL marker format."""
        result = HITLToolResult(
            requires_approval=True,
            approval_level=ApprovalLevel.QUICK,
            confidence_score=70,
            tool_name="test_tool",
            tool_args={"key": "value"},
            config=HITLConfig(),
        )
        marker = result.to_marker_dict()

        assert marker["__hitl_pending__"] is True
        assert "hitl_result" in marker
        assert marker["hitl_result"]["requires_approval"] is True
        assert marker["hitl_result"]["confidence_score"] == 70

    def test_approval_id_optional(self):
        """Test approval_id is optional."""
        result = HITLToolResult(
            requires_approval=True,
            approval_level=ApprovalLevel.FULL,
            confidence_score=50,
            tool_name="test",
            config=HITLConfig(),
        )
        assert result.approval_id is None

        result2 = HITLToolResult(
            requires_approval=True,
            approval_level=ApprovalLevel.FULL,
            confidence_score=50,
            tool_name="test",
            config=HITLConfig(),
            approval_id="APR-12345",
        )
        assert result2.approval_id == "APR-12345"


# =============================================================================
# CALCULATE CONFIDENCE TESTS
# =============================================================================


class TestCalculateConfidence:
    """Tests for calculate_confidence function."""

    def test_known_tool_base_score(self):
        """Test known tools return their base score."""
        score = calculate_confidence("sign_contract", {})
        assert score == BASE_CONFIDENCE_SCORES["sign_contract"]
        assert score == 50

    def test_delete_project_base_score(self):
        """Test delete_project returns its base score."""
        score = calculate_confidence("delete_project", {})
        assert score == 40

    def test_unknown_tool_default_score(self):
        """Test unknown tools return default score."""
        score = calculate_confidence("unknown_tool", {})
        assert score == DEFAULT_CONFIDENCE_SCORE
        assert score == 70

    def test_admin_role_bonus(self):
        """Test admin role adds 10 points."""
        score = calculate_confidence(
            "sign_contract", {}, context={"user_role": "admin"}
        )
        assert score == 60  # 50 + 10

    def test_workspace_verified_bonus(self):
        """Test workspace verification adds 5 points."""
        score = calculate_confidence(
            "sign_contract", {}, context={"workspace_verified": True}
        )
        assert score == 55  # 50 + 5

    def test_combined_context_bonuses(self):
        """Test multiple context bonuses stack."""
        score = calculate_confidence(
            "sign_contract",
            {},
            context={"user_role": "admin", "workspace_verified": True},
        )
        assert score == 65  # 50 + 10 + 5

    def test_high_amount_penalty(self):
        """Test amounts > $1000 subtract 15 points."""
        score = calculate_confidence("approve_expense", {"amount": 5000})
        assert score == 45  # 60 - 15

    def test_low_amount_no_penalty(self):
        """Test amounts <= $1000 have no penalty."""
        score = calculate_confidence("approve_expense", {"amount": 500})
        assert score == 60  # No change

    def test_bulk_operation_penalty(self):
        """Test bulk operations subtract 10 points."""
        score = calculate_confidence(
            "send_bulk_notification", {}, context={}
        )
        assert score == 60  # 70 - 10 (has 'bulk' in name)

    def test_high_recipient_count_penalty(self):
        """Test > 100 recipients subtracts 10 points."""
        score = calculate_confidence(
            "send_notification", {"recipient_count": 500}
        )
        assert score == 70  # 80 - 10

    def test_time_sensitive_bonus(self):
        """Test time-sensitive context adds 5 points."""
        score = calculate_confidence(
            "approve_expense", {}, context={"time_sensitive": True}
        )
        assert score == 65  # 60 + 5

    def test_score_clamped_to_100(self):
        """Test score never exceeds 100."""
        score = calculate_confidence(
            "update_task_status",  # Base 85
            {},
            context={
                "user_role": "admin",  # +10
                "workspace_verified": True,  # +5
                "time_sensitive": True,  # +5
            },
        )
        assert score == 100  # Clamped from 105

    def test_score_clamped_to_0(self):
        """Test score never goes below 0."""
        score = calculate_confidence(
            "delete_project",  # Base 40
            {"amount": 50000, "recipient_count": 500, "is_bulk": True},
        )
        assert score >= 0

    def test_score_always_int(self):
        """Test score is always an integer."""
        score = calculate_confidence("sign_contract", {})
        assert isinstance(score, int)


# =============================================================================
# DETERMINE APPROVAL LEVEL TESTS
# =============================================================================


class TestDetermineApprovalLevel:
    """Tests for determine_approval_level function."""

    def test_auto_at_threshold(self):
        """Test AUTO returned at exactly auto_threshold."""
        config = HITLConfig(auto_threshold=85)
        assert determine_approval_level(85, config) == ApprovalLevel.AUTO

    def test_auto_above_threshold(self):
        """Test AUTO returned above auto_threshold."""
        config = HITLConfig(auto_threshold=85)
        assert determine_approval_level(90, config) == ApprovalLevel.AUTO
        assert determine_approval_level(100, config) == ApprovalLevel.AUTO

    def test_quick_at_threshold(self):
        """Test QUICK returned at exactly quick_threshold."""
        config = HITLConfig(quick_threshold=60)
        assert determine_approval_level(60, config) == ApprovalLevel.QUICK

    def test_quick_in_range(self):
        """Test QUICK returned in range [quick_threshold, auto_threshold)."""
        config = HITLConfig(auto_threshold=85, quick_threshold=60)
        assert determine_approval_level(70, config) == ApprovalLevel.QUICK
        assert determine_approval_level(84, config) == ApprovalLevel.QUICK

    def test_full_below_quick_threshold(self):
        """Test FULL returned below quick_threshold."""
        config = HITLConfig(quick_threshold=60)
        assert determine_approval_level(59, config) == ApprovalLevel.FULL
        assert determine_approval_level(50, config) == ApprovalLevel.FULL
        assert determine_approval_level(0, config) == ApprovalLevel.FULL

    def test_custom_thresholds(self):
        """Test custom threshold values work correctly."""
        config = HITLConfig(auto_threshold=95, quick_threshold=70)
        assert determine_approval_level(95, config) == ApprovalLevel.AUTO
        assert determine_approval_level(94, config) == ApprovalLevel.QUICK
        assert determine_approval_level(70, config) == ApprovalLevel.QUICK
        assert determine_approval_level(69, config) == ApprovalLevel.FULL


# =============================================================================
# HITL DECORATOR TESTS
# =============================================================================


class TestHITLDecorator:
    """Tests for @hitl_tool decorator."""

    def test_decorator_preserves_name(self):
        """Test decorator preserves function name."""

        @hitl_tool()
        async def my_test_tool():
            pass

        assert my_test_tool.__name__ == "my_test_tool"

    def test_decorator_preserves_docstring(self):
        """Test decorator preserves docstring."""

        @hitl_tool()
        async def my_test_tool():
            """My docstring."""
            pass

        assert my_test_tool.__doc__ == "My docstring."

    def test_stores_config_on_function(self):
        """Test config is stored on the function."""

        @hitl_tool(auto_threshold=90, risk_level="high")
        async def my_test_tool():
            pass

        config = get_hitl_config(my_test_tool)
        assert config is not None
        assert config.auto_threshold == 90
        assert config.risk_level == "high"

    def test_is_hitl_tool_returns_true(self):
        """Test is_hitl_tool returns True for decorated functions."""

        @hitl_tool()
        async def my_test_tool():
            pass

        assert is_hitl_tool(my_test_tool) is True

    def test_is_hitl_tool_returns_false(self):
        """Test is_hitl_tool returns False for regular functions."""

        async def regular_function():
            pass

        assert is_hitl_tool(regular_function) is False

    @pytest.mark.asyncio
    async def test_auto_execution_high_confidence(self):
        """Test auto-execution when confidence >= auto_threshold."""

        @hitl_tool(auto_threshold=60, quick_threshold=40)  # Low thresholds for testing
        async def test_tool(value: str) -> dict:
            return {"value": value}

        # Context boosts confidence enough for auto-execution
        # Default 70 + admin bonus 10 = 80, well above auto_threshold of 60
        result = await test_tool(
            value="test",
            _hitl_context={"user_role": "admin"},
        )

        # Should return actual result, not HITL marker
        assert result == {"value": "test"}

    @pytest.mark.asyncio
    async def test_hitl_marker_low_confidence(self):
        """Test HITL marker returned when confidence < auto_threshold."""

        @hitl_tool(auto_threshold=95, quick_threshold=70)
        async def test_tool(value: str) -> dict:
            return {"value": value}

        # No context = default score 70
        result = await test_tool(value="test")

        assert isinstance(result, dict)
        assert result["__hitl_pending__"] is True
        assert "hitl_result" in result
        assert result["hitl_result"]["requires_approval"] is True
        assert result["hitl_result"]["approval_level"] == "quick"

    @pytest.mark.asyncio
    async def test_full_approval_very_low_confidence(self):
        """Test FULL approval returned for very low confidence."""

        @hitl_tool(auto_threshold=95, quick_threshold=80)
        async def test_tool(value: str) -> dict:
            return {"value": value}

        # No context = default 70, below quick_threshold
        result = await test_tool(value="test")

        assert result["__hitl_pending__"] is True
        assert result["hitl_result"]["approval_level"] == "full"

    @pytest.mark.asyncio
    async def test_context_extraction(self):
        """Test _hitl_context is extracted and not passed to function."""

        received_kwargs = {}

        @hitl_tool(auto_threshold=60, quick_threshold=40)  # Low thresholds for testing
        async def test_tool(**kwargs) -> dict:
            received_kwargs.update(kwargs)
            return {"success": True}

        await test_tool(
            value="test",
            _hitl_context={"user_role": "admin"},  # +10 -> 80, above 60
        )

        # _hitl_context should be extracted, not passed to function
        assert "_hitl_context" not in received_kwargs
        assert "value" in received_kwargs

    @pytest.mark.asyncio
    async def test_args_passed_correctly(self):
        """Test function arguments are passed correctly."""

        @hitl_tool(auto_threshold=60, quick_threshold=40)  # Low thresholds for testing
        async def test_tool(a: int, b: str, c: bool = True) -> dict:
            return {"a": a, "b": b, "c": c}

        result = await test_tool(
            a=42,
            b="hello",
            c=False,
            _hitl_context={"user_role": "admin"},  # +10 -> 80, above 60
        )

        assert result == {"a": 42, "b": "hello", "c": False}

    @pytest.mark.asyncio
    async def test_hitl_result_contains_tool_args(self):
        """Test HITL result contains the tool arguments."""

        @hitl_tool(auto_threshold=99)  # Very high, will need approval
        async def test_tool(contract_id: str, amount: float) -> dict:
            return {}

        result = await test_tool(contract_id="C123", amount=5000)

        assert result["hitl_result"]["tool_args"]["contract_id"] == "C123"
        assert result["hitl_result"]["tool_args"]["amount"] == 5000


# =============================================================================
# UTILITY FUNCTION TESTS
# =============================================================================


class TestUtilityFunctions:
    """Tests for utility functions."""

    def test_get_hitl_config_returns_config(self):
        """Test get_hitl_config returns the config."""

        @hitl_tool(auto_threshold=92, approval_type="test")
        async def my_tool():
            pass

        config = get_hitl_config(my_tool)
        assert config is not None
        assert isinstance(config, HITLConfig)
        assert config.auto_threshold == 92
        assert config.approval_type == "test"

    def test_get_hitl_config_returns_none_for_regular(self):
        """Test get_hitl_config returns None for regular functions."""

        async def regular_function():
            pass

        assert get_hitl_config(regular_function) is None

    def test_is_hitl_pending_true(self):
        """Test is_hitl_pending returns True for HITL marker."""
        result = {
            "__hitl_pending__": True,
            "hitl_result": {"tool_name": "test"},
        }
        assert is_hitl_pending(result) is True

    def test_is_hitl_pending_false_no_marker(self):
        """Test is_hitl_pending returns False without marker."""
        result = {"success": True}
        assert is_hitl_pending(result) is False

    def test_is_hitl_pending_false_marker_false(self):
        """Test is_hitl_pending returns False when marker is False."""
        result = {"__hitl_pending__": False}
        assert is_hitl_pending(result) is False

    def test_is_hitl_pending_false_not_dict(self):
        """Test is_hitl_pending returns False for non-dict."""
        assert is_hitl_pending("string") is False
        assert is_hitl_pending(123) is False
        assert is_hitl_pending(None) is False
        assert is_hitl_pending(["list"]) is False


# =============================================================================
# INTEGRATION TESTS
# =============================================================================


class TestIntegration:
    """Integration tests for the HITL system."""

    @pytest.mark.asyncio
    async def test_complete_hitl_flow_auto(self):
        """Test complete flow for auto-execution."""

        @hitl_tool(
            approval_type="test",
            auto_threshold=70,
            quick_threshold=50,
        )
        async def process_payment(amount: float, account: str) -> dict:
            return {
                "status": "processed",
                "amount": amount,
                "account": account,
            }

        # Admin with verified workspace should have high confidence
        result = await process_payment(
            amount=100,  # Low amount, no penalty
            account="ACC123",
            _hitl_context={
                "user_role": "admin",
                "workspace_verified": True,
            },
        )

        # Should auto-execute
        assert "status" in result
        assert result["status"] == "processed"

    @pytest.mark.asyncio
    async def test_complete_hitl_flow_quick(self):
        """Test complete flow for quick approval."""

        @hitl_tool(
            approval_type="financial",
            auto_threshold=90,
            quick_threshold=60,
        )
        async def process_payment(amount: float) -> dict:
            return {"status": "processed"}

        # Default confidence should be 70, in QUICK range
        result = await process_payment(amount=500)

        assert is_hitl_pending(result)
        assert result["hitl_result"]["approval_level"] == "quick"

    @pytest.mark.asyncio
    async def test_complete_hitl_flow_full(self):
        """Test complete flow for full approval."""

        @hitl_tool(
            approval_type="deletion",
            auto_threshold=95,
            quick_threshold=80,
        )
        async def delete_everything() -> dict:
            return {"status": "deleted"}

        # Low confidence due to unknown tool
        result = await delete_everything()

        assert is_hitl_pending(result)
        assert result["hitl_result"]["approval_level"] == "full"
        assert result["hitl_result"]["config"]["risk_level"] == "medium"

    def test_multiple_decorated_functions(self):
        """Test multiple functions can be decorated independently."""

        @hitl_tool(auto_threshold=90, risk_level="high")
        async def high_risk_tool():
            pass

        @hitl_tool(auto_threshold=70, risk_level="low")
        async def low_risk_tool():
            pass

        high_config = get_hitl_config(high_risk_tool)
        low_config = get_hitl_config(low_risk_tool)

        assert high_config.auto_threshold == 90
        assert high_config.risk_level == "high"
        assert low_config.auto_threshold == 70
        assert low_config.risk_level == "low"


# =============================================================================
# EXAMPLE TOOLS TESTS
# =============================================================================


class TestExampleTools:
    """Tests for the example HITL tools in gateway module."""

    def test_get_hitl_tools_returns_list(self):
        """Test get_hitl_tools returns list of tools."""
        from gateway.hitl_tools import get_hitl_tools

        tools = get_hitl_tools()
        assert isinstance(tools, list)
        assert len(tools) == 4

    def test_all_example_tools_are_hitl(self):
        """Test all example tools are decorated with @hitl_tool."""
        from gateway.hitl_tools import get_hitl_tools

        tools = get_hitl_tools()
        for tool in tools:
            assert is_hitl_tool(tool), f"{tool.__name__} is not an HITL tool"

    def test_sign_contract_config(self):
        """Test sign_contract has correct configuration."""
        from gateway.hitl_tools import sign_contract

        config = get_hitl_config(sign_contract)
        assert config.approval_type == "contract"
        assert config.risk_level == "high"
        assert config.auto_threshold == 95
        assert config.quick_threshold == 70
        assert config.requires_reason is True

    def test_delete_project_config(self):
        """Test delete_project has correct configuration."""
        from gateway.hitl_tools import delete_project

        config = get_hitl_config(delete_project)
        assert config.approval_type == "deletion"
        assert config.risk_level == "high"
        assert config.auto_threshold == 90
        assert config.quick_threshold == 60

    def test_approve_expense_config(self):
        """Test approve_expense has correct configuration."""
        from gateway.hitl_tools import approve_expense

        config = get_hitl_config(approve_expense)
        assert config.approval_type == "financial"
        assert config.risk_level == "medium"
        assert config.auto_threshold == 85
        assert config.quick_threshold == 65

    def test_send_bulk_notification_config(self):
        """Test send_bulk_notification has correct configuration."""
        from gateway.hitl_tools import send_bulk_notification

        config = get_hitl_config(send_bulk_notification)
        assert config.approval_type == "communication"
        assert config.risk_level == "low"
        assert config.auto_threshold == 80
        assert config.quick_threshold == 50

    @pytest.mark.asyncio
    async def test_sign_contract_requires_approval(self):
        """Test sign_contract requires approval for standard call."""
        from gateway.hitl_tools import sign_contract

        result = await sign_contract(
            contract_id="C-2024-001",
            amount=10000,
        )

        assert is_hitl_pending(result)
        # High amount + low base score = FULL approval
        assert result["hitl_result"]["approval_level"] in ["quick", "full"]

    @pytest.mark.asyncio
    async def test_delete_project_requires_approval(self):
        """Test delete_project requires approval."""
        from gateway.hitl_tools import delete_project

        result = await delete_project(
            project_id="proj_123",
            project_name="Test Project",
        )

        assert is_hitl_pending(result)

    def test_get_hitl_tool_metadata(self):
        """Test metadata retrieval for all tools."""
        from gateway.hitl_tools import get_hitl_tool_metadata

        metadata = get_hitl_tool_metadata()

        assert "sign_contract" in metadata
        assert "delete_project" in metadata
        assert "approve_expense" in metadata
        assert "send_bulk_notification" in metadata

        assert metadata["sign_contract"]["risk_level"] == "high"
        assert metadata["approve_expense"]["risk_level"] == "medium"
