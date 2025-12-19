"""
Report Tools for Herald Agent
AI Business Hub - Project Management Module

Tools for generating project reports: status, health, and progress reports.
"""

from agno import tool
import httpx
from typing import Dict, Any, Optional
import os
import logging

logger = logging.getLogger(__name__)

# Get API base URL from environment
API_BASE_URL = os.getenv("API_BASE_URL")
if not API_BASE_URL:
    raise ValueError("API_BASE_URL environment variable must be set")

# Service token for agent-to-API calls (internal service auth)
AGENT_SERVICE_TOKEN = os.getenv("AGENT_SERVICE_TOKEN")


def get_auth_headers(workspace_id: str) -> Dict[str, str]:
    """Build headers for authenticated API calls.

    Args:
        workspace_id: Workspace/tenant identifier

    Returns:
        Dict with required headers including auth if available
    """
    headers = {
        "x-workspace-id": workspace_id,
        "Content-Type": "application/json"
    }

    # Add service auth token if available (for internal agent calls)
    if AGENT_SERVICE_TOKEN:
        headers["Authorization"] = f"Bearer {AGENT_SERVICE_TOKEN}"
    else:
        logger.warning("AGENT_SERVICE_TOKEN not set - API calls may fail auth")

    return headers


@tool
def generate_project_report(
    project_id: str,
    workspace_id: str,
    format: str = "MARKDOWN"
) -> Dict[str, Any]:
    """
    Generate a comprehensive project status report.

    Creates a report containing:
    - Executive summary
    - Current phase progress
    - Task breakdown by status
    - Key metrics (completion %, velocity)
    - Upcoming milestones

    Args:
        project_id: ID of the project to report on
        workspace_id: Workspace/tenant identifier
        format: Report format - "MARKDOWN" or "JSON" (default: MARKDOWN)

    Returns:
        Dict containing the generated report:
        {
            "report": {
                "id": string,
                "projectId": string,
                "type": "PROJECT_STATUS",
                "title": string,
                "content": {
                    "summary": string,
                    "sections": [
                        {
                            "heading": string,
                            "content": string (markdown)
                        }
                    ],
                    "metrics": {...}
                },
                "format": string,
                "generatedAt": string (ISO date),
                "generatedBy": "herald_agent"
            }
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    with httpx.Client(timeout=30.0) as client:
        try:
            response = client.post(
                f"{API_BASE_URL}/api/pm/agents/reports/{project_id}/generate",
                json={
                    "type": "PROJECT_STATUS",
                    "format": format
                },
                headers=get_auth_headers(workspace_id)
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to generate project report: {e.response.text}")
            return {
                "error": f"HTTP {e.response.status_code}",
                "message": str(e),
                "report": None
            }
        except Exception as e:
            logger.error(f"Error generating project report: {str(e)}")
            return {
                "error": "Request failed",
                "message": str(e),
                "report": None
            }


@tool
def generate_health_report(
    project_id: str,
    workspace_id: str,
    format: str = "MARKDOWN"
) -> Dict[str, Any]:
    """
    Generate a project health analysis report.

    Creates a report containing:
    - Overall health score and level
    - Health factors breakdown (on-time delivery, blockers, capacity, velocity)
    - Active risks and severity
    - Team capacity status
    - Recommendations for improvement

    Args:
        project_id: ID of the project to report on
        workspace_id: Workspace/tenant identifier
        format: Report format - "MARKDOWN" or "JSON" (default: MARKDOWN)

    Returns:
        Dict containing the generated report:
        {
            "report": {
                "id": string,
                "projectId": string,
                "type": "HEALTH_REPORT",
                "title": string,
                "content": {
                    "summary": string,
                    "sections": [...],
                    "metrics": {
                        "healthScore": number,
                        "healthLevel": string,
                        "riskCount": number,
                        "factors": {...}
                    }
                },
                "format": string,
                "generatedAt": string,
                "generatedBy": "herald_agent"
            }
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    with httpx.Client(timeout=30.0) as client:
        try:
            response = client.post(
                f"{API_BASE_URL}/api/pm/agents/reports/{project_id}/generate",
                json={
                    "type": "HEALTH_REPORT",
                    "format": format
                },
                headers=get_auth_headers(workspace_id)
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to generate health report: {e.response.text}")
            return {
                "error": f"HTTP {e.response.status_code}",
                "message": str(e),
                "report": None
            }
        except Exception as e:
            logger.error(f"Error generating health report: {str(e)}")
            return {
                "error": "Request failed",
                "message": str(e),
                "report": None
            }


@tool
def generate_progress_report(
    project_id: str,
    workspace_id: str,
    format: str = "MARKDOWN",
    days: Optional[int] = 7
) -> Dict[str, Any]:
    """
    Generate a progress/timeline report.

    Creates a report containing:
    - Summary of progress
    - Completed work (last N days)
    - Work in progress
    - Upcoming priorities
    - Blockers and dependencies
    - Timeline status

    Args:
        project_id: ID of the project to report on
        workspace_id: Workspace/tenant identifier
        format: Report format - "MARKDOWN" or "JSON" (default: MARKDOWN)
        days: Number of days to look back for completed work (default: 7)

    Returns:
        Dict containing the generated report:
        {
            "report": {
                "id": string,
                "projectId": string,
                "type": "PROGRESS_REPORT",
                "title": string,
                "content": {
                    "summary": string,
                    "sections": [...],
                    "metrics": {
                        "completedTasks": number,
                        "inProgressTasks": number,
                        "blockedTasks": number
                    }
                },
                "format": string,
                "generatedAt": string,
                "generatedBy": "herald_agent"
            }
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    with httpx.Client(timeout=30.0) as client:
        try:
            response = client.post(
                f"{API_BASE_URL}/api/pm/agents/reports/{project_id}/generate",
                json={
                    "type": "PROGRESS_REPORT",
                    "format": format,
                    "days": days
                },
                headers=get_auth_headers(workspace_id)
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to generate progress report: {e.response.text}")
            return {
                "error": f"HTTP {e.response.status_code}",
                "message": str(e),
                "report": None
            }
        except Exception as e:
            logger.error(f"Error generating progress report: {str(e)}")
            return {
                "error": "Request failed",
                "message": str(e),
                "report": None
            }


@tool
def get_report_history(
    project_id: str,
    workspace_id: str,
    type: Optional[str] = None,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Retrieve report history for a project.

    Args:
        project_id: ID of the project
        workspace_id: Workspace/tenant identifier
        type: Optional filter by report type (PROJECT_STATUS, HEALTH_REPORT, PROGRESS_REPORT)
        limit: Maximum number of reports to return (default: 10, max: 50)

    Returns:
        Dict containing list of reports:
        {
            "reports": [
                {
                    "id": string,
                    "projectId": string,
                    "type": string,
                    "title": string,
                    "generatedAt": string,
                    "generatedBy": string
                }
            ],
            "total": number
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    # Limit to max 50
    limit = min(limit, 50)

    params = {"limit": limit}
    if type:
        params["type"] = type

    with httpx.Client(timeout=30.0) as client:
        try:
            response = client.get(
                f"{API_BASE_URL}/api/pm/agents/reports/{project_id}",
                params=params,
                headers=get_auth_headers(workspace_id)
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to get report history: {e.response.text}")
            return {
                "error": f"HTTP {e.response.status_code}",
                "message": str(e),
                "reports": [],
                "total": 0
            }
        except Exception as e:
            logger.error(f"Error getting report history: {str(e)}")
            return {
                "error": "Request failed",
                "message": str(e),
                "reports": [],
                "total": 0
            }


@tool
def generate_executive_report(
    project_id: str,
    workspace_id: str,
    report_type: str = "PROJECT_STATUS",
    format: str = "MARKDOWN"
) -> Dict[str, Any]:
    """
    Generate an executive summary report with high-level metrics and strategic focus.

    This report is optimized for executives and senior stakeholders:
    - High-level overview with key metrics (completion %, timeline, health)
    - Strategic focus on outcomes, ROI, and business impact
    - Minimal technical jargon
    - Executive-level recommendations
    - One-page summary format

    Args:
        project_id: ID of the project to report on
        workspace_id: Workspace/tenant identifier
        report_type: Type of report - "PROJECT_STATUS", "HEALTH_REPORT", or "PROGRESS_REPORT" (default: PROJECT_STATUS)
        format: Report format - "MARKDOWN" or "JSON" (default: MARKDOWN)

    Returns:
        Dict containing the generated report:
        {
            "report": {
                "id": string,
                "projectId": string,
                "type": string,
                "stakeholderType": "EXECUTIVE",
                "title": string,
                "content": {
                    "summary": string,
                    "sections": [
                        {
                            "heading": "Executive Summary" | "Key Metrics" | "Strategic Outcomes" | "Business Impact" | "Recommendations",
                            "content": string (markdown)
                        }
                    ],
                    "metrics": {
                        "completionPercent": number,
                        "timelineStatus": string,
                        "healthScore": number,
                        "criticalRisks": number
                    }
                },
                "format": string,
                "generatedAt": string (ISO date),
                "generatedBy": "herald_agent"
            }
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    with httpx.Client(timeout=30.0) as client:
        try:
            response = client.post(
                f"{API_BASE_URL}/api/pm/agents/reports/{project_id}/generate",
                json={
                    "type": report_type,
                    "stakeholderType": "EXECUTIVE",
                    "format": format
                },
                headers=get_auth_headers(workspace_id)
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to generate executive report: {e.response.text}")
            return {
                "error": f"HTTP {e.response.status_code}",
                "message": str(e),
                "report": None
            }
        except Exception as e:
            logger.error(f"Error generating executive report: {str(e)}")
            return {
                "error": "Request failed",
                "message": str(e),
                "report": None
            }


@tool
def generate_team_lead_report(
    project_id: str,
    workspace_id: str,
    report_type: str = "PROGRESS_REPORT",
    format: str = "MARKDOWN"
) -> Dict[str, Any]:
    """
    Generate a detailed team lead report with tasks, blockers, and technical information.

    This report is optimized for team leads and project managers:
    - Detailed task breakdown by team member
    - Active blockers with context and dependencies
    - Sprint/phase progress with velocity metrics
    - Resource allocation and capacity
    - Technical details preserved
    - Actionable items highlighted

    Args:
        project_id: ID of the project to report on
        workspace_id: Workspace/tenant identifier
        report_type: Type of report - "PROJECT_STATUS", "HEALTH_REPORT", or "PROGRESS_REPORT" (default: PROGRESS_REPORT)
        format: Report format - "MARKDOWN" or "JSON" (default: MARKDOWN)

    Returns:
        Dict containing the generated report:
        {
            "report": {
                "id": string,
                "projectId": string,
                "type": string,
                "stakeholderType": "TEAM_LEAD",
                "title": string,
                "content": {
                    "summary": string,
                    "sections": [
                        {
                            "heading": "Sprint Overview" | "Team Velocity" | "Active Tasks" | "Blockers" | "Capacity Planning" | "Technical Notes",
                            "content": string (markdown)
                        }
                    ],
                    "metrics": {
                        "velocity": number,
                        "inProgressTasks": number,
                        "blockedTasks": number,
                        "teamCapacity": number
                    }
                },
                "format": string,
                "generatedAt": string (ISO date),
                "generatedBy": "herald_agent"
            }
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    with httpx.Client(timeout=30.0) as client:
        try:
            response = client.post(
                f"{API_BASE_URL}/api/pm/agents/reports/{project_id}/generate",
                json={
                    "type": report_type,
                    "stakeholderType": "TEAM_LEAD",
                    "format": format
                },
                headers=get_auth_headers(workspace_id)
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to generate team lead report: {e.response.text}")
            return {
                "error": f"HTTP {e.response.status_code}",
                "message": str(e),
                "report": None
            }
        except Exception as e:
            logger.error(f"Error generating team lead report: {str(e)}")
            return {
                "error": "Request failed",
                "message": str(e),
                "report": None
            }


@tool
def generate_client_report(
    project_id: str,
    workspace_id: str,
    report_type: str = "PROJECT_STATUS",
    format: str = "MARKDOWN"
) -> Dict[str, Any]:
    """
    Generate a client-facing report with sanitized content and professional tone.

    This report is optimized for clients and external stakeholders:
    - Sanitized content (no internal team details)
    - Focus on deliverables and milestones
    - Progress against agreed scope
    - Client-facing language (business outcomes)
    - Timeline and next steps
    - Issue resolution status (without internal details)

    Args:
        project_id: ID of the project to report on
        workspace_id: Workspace/tenant identifier
        report_type: Type of report - "PROJECT_STATUS", "HEALTH_REPORT", or "PROGRESS_REPORT" (default: PROJECT_STATUS)
        format: Report format - "MARKDOWN" or "JSON" (default: MARKDOWN)

    Returns:
        Dict containing the generated report:
        {
            "report": {
                "id": string,
                "projectId": string,
                "type": string,
                "stakeholderType": "CLIENT",
                "title": string,
                "content": {
                    "summary": string,
                    "sections": [
                        {
                            "heading": "Project Overview" | "Deliverables Status" | "Milestone Progress" | "Timeline Update" | "Next Steps",
                            "content": string (markdown)
                        }
                    ],
                    "metrics": {
                        "completionPercent": number,
                        "milestonesCompleted": number,
                        "recentDeliverables": number
                    }
                },
                "format": string,
                "generatedAt": string (ISO date),
                "generatedBy": "herald_agent"
            }
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    with httpx.Client(timeout=30.0) as client:
        try:
            response = client.post(
                f"{API_BASE_URL}/api/pm/agents/reports/{project_id}/generate",
                json={
                    "type": report_type,
                    "stakeholderType": "CLIENT",
                    "format": format
                },
                headers=get_auth_headers(workspace_id)
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to generate client report: {e.response.text}")
            return {
                "error": f"HTTP {e.response.status_code}",
                "message": str(e),
                "report": None
            }
        except Exception as e:
            logger.error(f"Error generating client report: {str(e)}")
            return {
                "error": "Request failed",
                "message": str(e),
                "report": None
            }
