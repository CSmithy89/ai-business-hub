"""
Approval Agent Tools
Tools for managing approval workflows via NestJS API

These are Agno @tool decorated functions that the ApprovalAgent uses.
All tools communicate with NestJS API using httpx async client.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
import httpx
import logging

from agno.tools import tool

logger = logging.getLogger(__name__)

# NestJS API base URL
API_BASE_URL = "http://localhost:3001/api"
API_TIMEOUT = 30.0  # seconds


class APIClient:
    """
    Async HTTP client for NestJS API integration.

    Handles authentication, workspace context, and error handling
    for all approval-related API calls.
    """

    def __init__(self, jwt_token: Optional[str] = None, workspace_id: Optional[str] = None):
        self.jwt_token = jwt_token
        self.workspace_id = workspace_id
        self.headers = {}

        if jwt_token:
            self.headers["Authorization"] = f"Bearer {jwt_token}"

        if workspace_id:
            self.headers["x-workspace-id"] = workspace_id

    async def get(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make GET request to NestJS API."""
        url = f"{API_BASE_URL}{endpoint}"

        try:
            async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
                response = await client.get(url, headers=self.headers, params=params)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"API HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"API error: {e.response.status_code}")
        except httpx.TimeoutException:
            logger.error(f"API timeout for GET {endpoint}")
            raise Exception("API request timed out")
        except Exception as e:
            logger.error(f"API request failed: {str(e)}")
            raise Exception(f"API request failed: {str(e)}")

    async def post(self, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make POST request to NestJS API."""
        url = f"{API_BASE_URL}{endpoint}"

        try:
            async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
                response = await client.post(url, headers=self.headers, json=data)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"API HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"API error: {e.response.status_code}")
        except httpx.TimeoutException:
            logger.error(f"API timeout for POST {endpoint}")
            raise Exception("API request timed out")
        except Exception as e:
            logger.error(f"API request failed: {str(e)}")
            raise Exception(f"API request failed: {str(e)}")


# ============================================================================
# Tool Definitions
# ============================================================================

@tool(requires_confirmation=True)
async def request_approval(
    action_type: str,
    description: str,
    resource_id: str,
    resource_type: str,
    urgency: str = "normal",
    metadata: Optional[Dict] = None,
    jwt_token: Optional[str] = None,
    workspace_id: Optional[str] = None,
) -> Dict:
    """
    Request approval for a critical action.

    This pauses execution and waits for human approval (HITL).
    The action will NOT execute until a human explicitly approves it.

    Args:
        action_type: Type of action (publish, delete, send, execute, etc.)
        description: Human-readable description of what will happen
        resource_id: ID of the resource being acted upon
        resource_type: Type of resource (deal, campaign, contact, content, etc.)
        urgency: Priority level - "low", "normal", "high", or "critical"
        metadata: Additional context for approver (optional)
        jwt_token: JWT for authentication (injected by agent)
        workspace_id: Workspace ID (injected by agent)

    Returns:
        Approval request details with ID and status

    Example:
        result = await request_approval(
            action_type="publish",
            description="Publish blog post 'AI in 2024' to production",
            resource_id="post_123",
            resource_type="content",
            urgency="high",
            metadata={"word_count": 2500, "author": "John Doe"}
        )
    """
    client = APIClient(jwt_token, workspace_id)

    try:
        # Note: This tool is marked with requires_confirmation=True
        # The Agno framework will automatically pause and ask the user
        # for confirmation before actually executing this function.

        # In a full implementation, this would create an approval request
        # in the database via the NestJS API. For now, we return a mock response.

        result = {
            "id": f"apr_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "action_type": action_type,
            "description": description,
            "resource_id": resource_id,
            "resource_type": resource_type,
            "urgency": urgency,
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "metadata": metadata or {},
        }

        logger.info(f"Approval request created: {result['id']}")
        return result

    except Exception as e:
        logger.error(f"Failed to request approval: {str(e)}")
        return {
            "error": str(e),
            "message": "Failed to create approval request. Please try again or contact support."
        }


@tool
async def get_pending_approvals(
    status: str = "pending",
    resource_type: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 10,
    jwt_token: Optional[str] = None,
    workspace_id: Optional[str] = None,
) -> Dict:
    """
    Get list of pending approval requests from the queue.

    Use this to check what's waiting for approval, filter by type or priority,
    and provide status updates to users.

    Args:
        status: Filter by status - "pending", "approved", "rejected" (default: "pending")
        resource_type: Filter by resource type - "content", "email", "campaign", "deal", etc. (optional)
        priority: Filter by priority - "low", "normal", "high", "critical" (optional)
        limit: Maximum number of items to return (default: 10, max: 100)
        jwt_token: JWT for authentication (injected by agent)
        workspace_id: Workspace ID (injected by agent)

    Returns:
        List of approval requests with details

    Example:
        approvals = await get_pending_approvals(
            status="pending",
            priority="high",
            limit=5
        )
    """
    client = APIClient(jwt_token, workspace_id)

    try:
        params = {
            "status": status,
            "limit": min(limit, 100),  # Cap at 100
        }

        if resource_type:
            params["type"] = resource_type

        if priority:
            params["priority"] = priority

        result = await client.get("/approvals", params=params)

        logger.info(f"Retrieved {len(result.get('items', []))} approval items")
        return result

    except Exception as e:
        logger.error(f"Failed to get pending approvals: {str(e)}")
        return {
            "error": str(e),
            "message": "Failed to retrieve approvals. The API might be unavailable.",
            "items": [],
            "total": 0
        }


@tool
async def approve_item(
    approval_id: str,
    notes: Optional[str] = None,
    jwt_token: Optional[str] = None,
    workspace_id: Optional[str] = None,
) -> Dict:
    """
    Approve a pending approval request.

    This executes the approved action and updates the approval status.
    Requires admin or owner permissions.

    Args:
        approval_id: The ID of the approval request to approve
        notes: Optional notes explaining the approval decision
        jwt_token: JWT for authentication (injected by agent)
        workspace_id: Workspace ID (injected by agent)

    Returns:
        Updated approval item with status "approved"

    Example:
        result = await approve_item(
            approval_id="apr_20241203",
            notes="Looks good, approved for publication"
        )
    """
    client = APIClient(jwt_token, workspace_id)

    try:
        data = {}
        if notes:
            data["notes"] = notes

        result = await client.post(f"/approvals/{approval_id}/approve", data=data)

        logger.info(f"Approval {approval_id} approved successfully")
        return result

    except Exception as e:
        logger.error(f"Failed to approve item {approval_id}: {str(e)}")
        return {
            "error": str(e),
            "message": f"Failed to approve item. {str(e)}"
        }


@tool
async def reject_item(
    approval_id: str,
    reason: str,
    notes: Optional[str] = None,
    jwt_token: Optional[str] = None,
    workspace_id: Optional[str] = None,
) -> Dict:
    """
    Reject a pending approval request.

    This prevents the action from executing and notifies the requester.
    A reason is REQUIRED for all rejections.
    Requires admin or owner permissions.

    Args:
        approval_id: The ID of the approval request to reject
        reason: REQUIRED reason for rejection (will be shown to requester)
        notes: Optional additional notes
        jwt_token: JWT for authentication (injected by agent)
        workspace_id: Workspace ID (injected by agent)

    Returns:
        Updated approval item with status "rejected"

    Example:
        result = await reject_item(
            approval_id="apr_20241203",
            reason="Content needs legal review before publication",
            notes="Please work with legal team on sections 2 and 4"
        )
    """
    client = APIClient(jwt_token, workspace_id)

    if not reason:
        return {
            "error": "Reason required",
            "message": "You must provide a reason when rejecting an approval request."
        }

    try:
        data = {"reason": reason}
        if notes:
            data["notes"] = notes

        result = await client.post(f"/approvals/{approval_id}/reject", data=data)

        logger.info(f"Approval {approval_id} rejected: {reason}")
        return result

    except Exception as e:
        logger.error(f"Failed to reject item {approval_id}: {str(e)}")
        return {
            "error": str(e),
            "message": f"Failed to reject item. {str(e)}"
        }


@tool
async def get_approval_details(
    approval_id: str,
    jwt_token: Optional[str] = None,
    workspace_id: Optional[str] = None,
) -> Dict:
    """
    Get detailed information about a specific approval request.

    Includes full context, AI reasoning, confidence scores, and audit trail.
    Use this when you need complete information about an approval.

    Args:
        approval_id: The ID of the approval request
        jwt_token: JWT for authentication (injected by agent)
        workspace_id: Workspace ID (injected by agent)

    Returns:
        Full approval details including AI reasoning and history

    Example:
        details = await get_approval_details(approval_id="apr_20241203")
    """
    client = APIClient(jwt_token, workspace_id)

    try:
        result = await client.get(f"/approvals/{approval_id}")

        logger.info(f"Retrieved details for approval {approval_id}")
        return result

    except Exception as e:
        logger.error(f"Failed to get approval details for {approval_id}: {str(e)}")
        return {
            "error": str(e),
            "message": f"Failed to retrieve approval details. {str(e)}"
        }


@tool
async def get_approval_stats(
    jwt_token: Optional[str] = None,
    workspace_id: Optional[str] = None,
) -> Dict:
    """
    Get statistics about the approval queue.

    Provides overview of pending approvals, average response times,
    approval rates, and other metrics.

    Args:
        jwt_token: JWT for authentication (injected by agent)
        workspace_id: Workspace ID (injected by agent)

    Returns:
        Approval queue statistics and metrics

    Example:
        stats = await get_approval_stats()
        # Returns: {total_pending: 5, avg_response_time: "2.5 hours", ...}
    """
    client = APIClient(jwt_token, workspace_id)

    try:
        # Get pending approvals to calculate stats
        result = await client.get("/approvals", params={"status": "pending", "limit": 100})
        items = result.get("items", [])

        # Calculate basic stats
        stats = {
            "total_pending": len(items),
            "by_priority": {
                "low": len([i for i in items if i.get("priority") == "low"]),
                "normal": len([i for i in items if i.get("priority") == "normal"]),
                "high": len([i for i in items if i.get("priority") == "high"]),
                "critical": len([i for i in items if i.get("priority") == "critical"]),
            },
            "by_type": {},
            "oldest_pending": None,
        }

        # Group by type
        for item in items:
            item_type = item.get("type", "unknown")
            stats["by_type"][item_type] = stats["by_type"].get(item_type, 0) + 1

        # Find oldest
        if items:
            oldest = min(items, key=lambda x: x.get("createdAt", ""))
            stats["oldest_pending"] = {
                "id": oldest.get("id"),
                "age_hours": oldest.get("ageHours", 0),
                "description": oldest.get("description", ""),
            }

        logger.info(f"Generated approval queue stats: {stats['total_pending']} pending")
        return stats

    except Exception as e:
        logger.error(f"Failed to get approval stats: {str(e)}")
        return {
            "error": str(e),
            "message": "Failed to retrieve approval statistics.",
            "total_pending": 0
        }
