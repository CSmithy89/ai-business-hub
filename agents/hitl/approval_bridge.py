"""
ApprovalQueueBridge

Bridge between the HITL system and Foundation's approval queue.
Handles creating approval items for low-confidence actions (FULL level)
that require human review in the approval queue.

Confidence-Based Routing:
- >= 85% (AUTO): Auto-execute with audit logging
- 60-84% (QUICK): Inline CopilotKit approval
- < 60% (FULL): Queue to Foundation approval system (this module)

@see docs/modules/bm-dm/stories/dm-05-3-approval-workflow-integration.md
Epic: DM-05 | Story: DM-05.3
"""

import asyncio
import logging
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx
from pydantic import BaseModel, Field

from .decorators import HITLConfig, HITLToolResult

logger = logging.getLogger(__name__)


# =============================================================================
# PRIORITY CONSTANTS
# =============================================================================

# Priority to due date hours mapping (matches Foundation PRIORITY_HOURS)
PRIORITY_HOURS = {
    "urgent": 4,
    "high": 24,
    "medium": 48,
    "low": 72,
}

# Risk level to priority mapping
RISK_TO_PRIORITY = {
    "high": "urgent",
    "medium": "high",
    "low": "medium",
}


# =============================================================================
# CONFIDENCE FACTOR MODEL
# =============================================================================


class ConfidenceFactor(BaseModel):
    """
    Confidence factor for approval queue display.

    Matches Foundation's ConfidenceFactor type for queue UI rendering.
    Weights must sum to 1.0 when multiple factors are provided.
    """

    name: str = Field(..., description="Factor name (e.g., 'Historical Accuracy')")
    score: int = Field(..., ge=0, le=100, description="Score for this factor (0-100)")
    weight: float = Field(..., ge=0, le=1, description="Weight of this factor (0.0-1.0)")
    reasoning: Optional[str] = Field(None, description="Explanation for the score")


# =============================================================================
# CREATE APPROVAL DTO
# =============================================================================


class CreateApprovalDto(BaseModel):
    """
    DTO for creating approval items in Foundation.

    Matches Foundation's CreateApprovalDto interface.
    """

    type: str = Field(..., description="Approval type (e.g., 'agent_action', 'contract')")
    title: str = Field(..., description="Approval title")
    description: Optional[str] = Field(None, description="Optional description")
    previewData: Optional[Dict[str, Any]] = Field(
        None, description="Preview data for UI rendering"
    )
    sourceModule: Optional[str] = Field(None, description="Source module name")
    sourceId: Optional[str] = Field(None, description="Source entity ID")
    priority: str = Field("medium", description="Priority level")
    factors: List[Dict[str, Any]] = Field(
        default_factory=list, description="Confidence factors"
    )


# =============================================================================
# APPROVAL QUEUE BRIDGE
# =============================================================================


class ApprovalQueueBridge:
    """
    Bridge between agent HITL and Foundation approval queue.

    This bridge creates approval items in the Foundation queue when
    HITL tools have low confidence (<60%) requiring full review.

    Usage:
        bridge = get_approval_bridge()
        approval = await bridge.create_approval_item(
            workspace_id="ws_123",
            tool_name="sign_contract",
            tool_args={"contractId": "C001", "amount": 5000},
            confidence_score=45,
            config=hitl_config,
        )
        print(f"Approval created: {approval['id']}")
    """

    def __init__(
        self,
        api_base_url: str,
        api_key: Optional[str] = None,
        timeout: float = 30.0,
    ):
        """
        Initialize the approval queue bridge.

        Args:
            api_base_url: Base URL for Foundation API (e.g., http://localhost:3001)
            api_key: Optional API key for internal authentication
            timeout: HTTP request timeout in seconds
        """
        self.api_base_url = api_base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create the async HTTP client."""
        if self._client is None or self._client.is_closed:
            headers = {
                "Content-Type": "application/json",
            }
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            self._client = httpx.AsyncClient(
                base_url=self.api_base_url,
                headers=headers,
                timeout=self.timeout,
            )
        return self._client

    async def close(self) -> None:
        """Close the HTTP client and cleanup resources."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    # =========================================================================
    # TITLE AND DESCRIPTION GENERATION
    # =========================================================================

    def _generate_title(
        self,
        tool_name: str,
        tool_args: Dict[str, Any],
        config: HITLConfig,
    ) -> str:
        """
        Generate a human-readable title for the approval.

        Uses description_template if available, otherwise generates from tool name.

        Args:
            tool_name: Name of the tool requiring approval
            tool_args: Arguments passed to the tool
            config: HITL configuration

        Returns:
            Generated title string
        """
        if config.description_template:
            try:
                # Substitute {key} placeholders with tool_args values
                title = config.description_template
                for key, value in tool_args.items():
                    placeholder = f"{{{key}}}"
                    if placeholder in title:
                        title = title.replace(placeholder, str(value))
                return title
            except Exception as e:
                logger.warning(f"Failed to apply description template: {e}")

        # Default title generation
        formatted_name = tool_name.replace("_", " ").title()
        return f"Approve: {formatted_name}"

    def _generate_description(
        self,
        tool_name: str,
        tool_args: Dict[str, Any],
        config: HITLConfig,
        confidence_score: int,
    ) -> str:
        """
        Generate a description for the approval with risk warning.

        Args:
            tool_name: Name of the tool requiring approval
            tool_args: Arguments passed to the tool
            config: HITL configuration
            confidence_score: Calculated confidence score

        Returns:
            Generated description string
        """
        risk_label = config.risk_level.upper()
        formatted_name = tool_name.replace("_", " ").title()

        # Build description lines
        lines = [
            f"**Agent Action:** {formatted_name}",
            f"**Risk Level:** {risk_label}",
            f"**Confidence Score:** {confidence_score}%",
            "",
        ]

        # Add key parameters (filter sensitive data)
        safe_args = self._filter_sensitive_args(tool_args)
        if safe_args:
            lines.append("**Parameters:**")
            for key, value in safe_args.items():
                formatted_key = key.replace("_", " ").title()
                lines.append(f"- {formatted_key}: {value}")

        # Add risk warning for high risk
        if config.risk_level == "high":
            lines.extend(
                [
                    "",
                    "**Warning:** This action has been flagged as high-risk and requires careful review.",
                ]
            )

        return "\n".join(lines)

    def _filter_sensitive_args(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Filter out sensitive arguments from display."""
        sensitive_patterns = [
            r"password",
            r"secret",
            r"token",
            r"api[_-]?key",
            r"credential",
            r"auth",
        ]
        pattern = re.compile("|".join(sensitive_patterns), re.IGNORECASE)

        return {k: v for k, v in args.items() if not pattern.search(k)}

    # =========================================================================
    # PRIORITY AND DUE DATE CALCULATION
    # =========================================================================

    def _calculate_priority(
        self,
        risk_level: str,
        confidence_score: int,
    ) -> str:
        """
        Calculate priority based on risk level and confidence score.

        Priority rules:
        - High risk = urgent (regardless of confidence)
        - Confidence < 30% = urgent (regardless of risk)
        - Medium risk + confidence 30-59% = high
        - Low risk + confidence < 30% = high
        - Low risk + confidence 30-59% = medium

        Args:
            risk_level: Risk level (low, medium, high)
            confidence_score: Confidence score (0-100)

        Returns:
            Priority string (urgent, high, medium, low)
        """
        # High risk is always urgent
        if risk_level == "high":
            return "urgent"

        # Very low confidence is urgent
        if confidence_score < 30:
            return "urgent"

        # Medium risk with low confidence is high priority
        if risk_level == "medium":
            return "high"

        # Low risk with low confidence is medium priority
        return "medium"

    def _calculate_due_date(self, risk_level: str) -> str:
        """
        Calculate due date based on risk level.

        Due dates:
        - High risk: 4 hours
        - Medium risk: 24 hours
        - Low risk: 72 hours

        Args:
            risk_level: Risk level (low, medium, high)

        Returns:
            ISO format datetime string
        """
        hours_map = {
            "high": 4,
            "medium": 24,
            "low": 72,
        }
        hours = hours_map.get(risk_level, 24)
        due_date = datetime.utcnow() + timedelta(hours=hours)
        return due_date.isoformat() + "Z"

    # =========================================================================
    # CONFIDENCE FACTORS GENERATION
    # =========================================================================

    def _generate_confidence_factors(
        self,
        tool_name: str,
        tool_args: Dict[str, Any],
        confidence_score: int,
        config: HITLConfig,
    ) -> List[Dict[str, Any]]:
        """
        Generate confidence factors for the approval queue display.

        Creates a set of factors that explain the confidence score
        for human reviewers.

        Args:
            tool_name: Name of the tool
            tool_args: Tool arguments
            confidence_score: Overall confidence score
            config: HITL configuration

        Returns:
            List of confidence factor dictionaries
        """
        factors = []

        # Base tool confidence factor (40% weight)
        factors.append(
            {
                "name": "Tool Type",
                "score": confidence_score,
                "weight": 0.4,
                "reasoning": f"Base confidence for {tool_name.replace('_', ' ')} operations",
            }
        )

        # Risk level factor (30% weight)
        risk_scores = {"low": 80, "medium": 60, "high": 30}
        risk_score = risk_scores.get(config.risk_level, 60)
        factors.append(
            {
                "name": "Risk Assessment",
                "score": risk_score,
                "weight": 0.3,
                "reasoning": f"Risk level classified as {config.risk_level}",
            }
        )

        # Parameters complexity factor (20% weight)
        param_count = len(tool_args)
        param_score = max(40, 100 - (param_count * 10))
        factors.append(
            {
                "name": "Parameter Complexity",
                "score": param_score,
                "weight": 0.2,
                "reasoning": f"Action involves {param_count} parameters",
            }
        )

        # Context factor (10% weight) - placeholder for future enhancement
        factors.append(
            {
                "name": "Context Verification",
                "score": confidence_score,
                "weight": 0.1,
                "reasoning": "Requires human verification of context",
            }
        )

        return factors

    # =========================================================================
    # APPROVAL ITEM CREATION
    # =========================================================================

    async def create_approval_item(
        self,
        workspace_id: str,
        tool_name: str,
        tool_args: Dict[str, Any],
        confidence_score: int,
        config: HITLConfig,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create an approval item in the Foundation queue.

        Maps HITL tool result to Foundation's CreateApprovalDto format
        and creates the approval item via the API.

        Args:
            workspace_id: Workspace ID for tenant isolation
            tool_name: Name of the tool requiring approval
            tool_args: Arguments passed to the tool
            confidence_score: Calculated confidence score (0-100)
            config: HITL configuration
            user_id: Optional user ID who triggered the action
            request_id: Optional HITL request ID for correlation

        Returns:
            Created approval item with 'id' field for tracking

        Raises:
            httpx.HTTPStatusError: If the API request fails
        """
        # Generate approval data
        title = self._generate_title(tool_name, tool_args, config)
        description = self._generate_description(
            tool_name, tool_args, config, confidence_score
        )
        priority = self._calculate_priority(config.risk_level, confidence_score)
        factors = self._generate_confidence_factors(
            tool_name, tool_args, confidence_score, config
        )

        # Build preview data for UI rendering
        preview_data = {
            "toolName": tool_name,
            "toolArgs": self._filter_sensitive_args(tool_args),
            "confidenceScore": confidence_score,
            "riskLevel": config.risk_level,
            "approvalType": config.approval_type,
            "requestId": request_id,
        }

        # Build the approval DTO
        approval_dto = {
            "type": config.approval_type,
            "title": title,
            "description": description,
            "previewData": preview_data,
            "sourceModule": "hitl",
            "sourceId": tool_name,
            "priority": priority,
            "factors": factors,
        }

        logger.info(
            f"Creating approval for {tool_name} with priority={priority}, "
            f"confidence={confidence_score}"
        )

        # Make API request
        client = await self._get_client()
        response = await client.post(
            "/api/approvals",
            json=approval_dto,
            headers={
                "X-Workspace-Id": workspace_id,
                **({"X-User-Id": user_id} if user_id else {}),
            },
        )
        response.raise_for_status()

        result = response.json()
        logger.info(f"Approval created: {result.get('id', 'unknown')}")

        return result

    # =========================================================================
    # APPROVAL STATUS CHECKING
    # =========================================================================

    async def get_approval_status(
        self,
        workspace_id: str,
        approval_id: str,
    ) -> Dict[str, Any]:
        """
        Get current status of an approval item.

        Args:
            workspace_id: Workspace ID for tenant isolation
            approval_id: ID of the approval item

        Returns:
            Approval item with status ('pending', 'approved', 'rejected')

        Raises:
            httpx.HTTPStatusError: If the API request fails
        """
        client = await self._get_client()
        response = await client.get(
            f"/api/approvals/{approval_id}",
            headers={"X-Workspace-Id": workspace_id},
        )
        response.raise_for_status()
        return response.json()

    async def wait_for_approval(
        self,
        workspace_id: str,
        approval_id: str,
        timeout_seconds: int = 3600,
        poll_interval_seconds: int = 5,
    ) -> Dict[str, Any]:
        """
        Wait for an approval to be resolved (polling implementation).

        Polls the approval status until it is resolved (approved/rejected)
        or the timeout is reached.

        Args:
            workspace_id: Workspace ID for tenant isolation
            approval_id: ID of the approval item
            timeout_seconds: Maximum time to wait (default 1 hour)
            poll_interval_seconds: Time between polls (default 5 seconds)

        Returns:
            Resolved approval item

        Raises:
            TimeoutError: If not resolved within timeout
            httpx.HTTPStatusError: If the API request fails
        """
        start_time = datetime.utcnow()
        timeout_delta = timedelta(seconds=timeout_seconds)

        while True:
            approval = await self.get_approval_status(workspace_id, approval_id)
            status = approval.get("status", "pending")

            if status in ("approved", "rejected", "auto_approved"):
                logger.info(f"Approval {approval_id} resolved with status: {status}")
                return approval

            # Check timeout
            elapsed = datetime.utcnow() - start_time
            if elapsed > timeout_delta:
                raise TimeoutError(
                    f"Approval {approval_id} not resolved within {timeout_seconds} seconds"
                )

            # Wait before next poll
            await asyncio.sleep(poll_interval_seconds)

    # =========================================================================
    # HITL TOOL RESULT INTEGRATION
    # =========================================================================

    async def create_from_hitl_result(
        self,
        workspace_id: str,
        hitl_result: HITLToolResult,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create an approval item from an HITLToolResult.

        Convenience method that extracts all necessary data from
        the HITLToolResult model.

        Args:
            workspace_id: Workspace ID for tenant isolation
            hitl_result: HITL tool result from the decorator
            user_id: Optional user ID who triggered the action

        Returns:
            Created approval item with 'id' field for tracking
        """
        return await self.create_approval_item(
            workspace_id=workspace_id,
            tool_name=hitl_result.tool_name,
            tool_args=hitl_result.tool_args,
            confidence_score=hitl_result.confidence_score,
            config=hitl_result.config,
            user_id=user_id,
            request_id=hitl_result.request_id,
        )


# =============================================================================
# SINGLETON PATTERN
# =============================================================================

_bridge: Optional[ApprovalQueueBridge] = None


def get_approval_bridge() -> ApprovalQueueBridge:
    """
    Get the singleton ApprovalQueueBridge instance.

    Uses settings from the configuration module to initialize
    the bridge with the correct API URL and credentials.

    Returns:
        Singleton ApprovalQueueBridge instance
    """
    global _bridge
    if _bridge is None:
        from agents.config import get_settings

        settings = get_settings()
        _bridge = ApprovalQueueBridge(
            api_base_url=settings.api_base_url,
            api_key=None,  # Use cookie-based auth via proxy
        )
    return _bridge


async def close_approval_bridge() -> None:
    """Close the singleton bridge and cleanup resources."""
    global _bridge
    if _bridge is not None:
        await _bridge.close()
        _bridge = None
