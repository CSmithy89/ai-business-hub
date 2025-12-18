"""
PM Tools - Tools for Navi PM agent
AI Business Hub - Project Management Module

Tools for interacting with PM data and Knowledge Base.
"""

import os
import logging
from typing import Optional, Dict, List, Any
import httpx
from agno.tools import tool

logger = logging.getLogger(__name__)

# Get API base URL from environment
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")


@tool
def get_project_status(project_id: str, workspace_id: str) -> Dict[str, Any]:
    """
    Get overview of project status including tasks, phases, and health.

    Args:
        project_id: Project identifier
        workspace_id: Workspace/tenant identifier

    Returns:
        Dictionary with project status information
    """
    try:
        # Call API endpoint
        url = f"{API_BASE_URL}/api/pm/projects/{project_id}/status"
        headers = {"x-workspace-id": workspace_id}

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        logger.error(f"Failed to get project status: {e}")
        return {
            "error": "Failed to retrieve project status",
            "projectId": project_id,
        }


@tool
def list_tasks(
    project_id: str,
    workspace_id: str,
    phase_id: Optional[str] = None,
    status: Optional[str] = None,
    assignee_id: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    List tasks for a project with optional filters.

    Args:
        project_id: Project identifier
        workspace_id: Workspace/tenant identifier
        phase_id: Optional phase filter
        status: Optional status filter (BACKLOG, TODO, IN_PROGRESS, DONE, etc.)
        assignee_id: Optional assignee filter
        priority: Optional priority filter (LOW, MEDIUM, HIGH, URGENT)
        limit: Maximum number of tasks to return (default 50)

    Returns:
        List of task objects
    """
    try:
        url = f"{API_BASE_URL}/api/pm/tasks"
        headers = {"x-workspace-id": workspace_id}
        params = {
            "projectId": project_id,
            "limit": limit,
        }

        if phase_id:
            params["phaseId"] = phase_id
        if status:
            params["status"] = status
        if assignee_id:
            params["assigneeId"] = assignee_id
        if priority:
            params["priority"] = priority

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        logger.error(f"Failed to list tasks: {e}")
        return []


@tool
def search_kb(query: str, project_id: str, workspace_id: str, top_k: int = 3) -> str:
    """
    Search Knowledge Base for relevant context using RAG.

    Args:
        query: Search query
        project_id: Project identifier for scoped search
        workspace_id: Workspace/tenant identifier
        top_k: Number of results to return (default 3)

    Returns:
        Formatted context string from KB search results
    """
    try:
        url = f"{API_BASE_URL}/api/kb/rag/query"
        headers = {"x-workspace-id": workspace_id}
        payload = {
            "query": query,
            "projectId": project_id,
            "topK": top_k,
        }

        with httpx.Client(timeout=15.0) as client:
            response = client.post(url, headers=headers, json=payload)

            # Graceful degradation if KB endpoint not available
            if response.status_code == 404:
                logger.warning("KB RAG endpoint not available - graceful fallback")
                return "Knowledge Base search not available yet."

            response.raise_for_status()
            results = response.json()

        # Format for agent context
        chunks = results.get("chunks", [])
        if not chunks:
            return "No relevant KB content found."

        context_parts = []
        for chunk in chunks:
            page_title = chunk.get("pageTitle", "Unknown")
            chunk_text = chunk.get("chunkText", "")
            context_parts.append(f"[{page_title}]\n{chunk_text}")

        return "\n\n".join(context_parts)

    except httpx.HTTPError as e:
        logger.error(f"Failed to search KB: {e}")
        return "Knowledge Base search encountered an error."
    except Exception as e:
        logger.error(f"Unexpected error in KB search: {e}")
        return "Knowledge Base search not available."
