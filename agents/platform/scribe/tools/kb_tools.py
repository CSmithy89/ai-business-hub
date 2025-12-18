"""
KB Tools for Scribe Agent
Page CRUD operations for knowledge base management.
"""

from typing import Optional
import logging
import httpx
from agno import tool

logger = logging.getLogger(__name__)


@tool
async def create_kb_page(
    title: str,
    content: str,
    parent_id: Optional[str] = None,
    workspace_id: Optional[str] = None,
    api_base_url: str = "http://localhost:3001",
) -> dict:
    """
    Create a new knowledge base page.

    This tool requires human approval before execution.
    The agent will suggest the content, and the user must confirm.

    Args:
        title: Title of the new page
        content: Content in markdown format
        parent_id: Optional parent page ID for hierarchy
        workspace_id: Workspace ID (from context)
        api_base_url: API base URL (from context)

    Returns:
        Created page data including ID and slug
    """
    logger.info(f"Creating KB page: {title}")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{api_base_url}/api/kb/pages",
            json={
                "title": title,
                "content": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": content}]}]},
                "parentId": parent_id,
            },
            headers={"X-Workspace-Id": workspace_id} if workspace_id else {},
            timeout=30.0,
        )

        if response.status_code == 201:
            data = response.json()
            return {
                "success": True,
                "page": {
                    "id": data.get("id"),
                    "title": data.get("title"),
                    "slug": data.get("slug"),
                },
                "message": f"Page '{title}' created successfully",
            }
        else:
            return {
                "success": False,
                "error": f"Failed to create page: {response.text}",
            }


@tool
async def update_kb_page(
    page_id: str,
    title: Optional[str] = None,
    content: Optional[str] = None,
    workspace_id: Optional[str] = None,
    api_base_url: str = "http://localhost:3001",
) -> dict:
    """
    Update an existing knowledge base page.

    This tool requires human approval before execution.
    The agent will suggest changes, and the user must confirm.

    Args:
        page_id: ID of the page to update
        title: New title (optional)
        content: New content in markdown format (optional)
        workspace_id: Workspace ID (from context)
        api_base_url: API base URL (from context)

    Returns:
        Updated page data
    """
    logger.info(f"Updating KB page: {page_id}")

    update_data = {}
    if title:
        update_data["title"] = title
    if content:
        update_data["content"] = {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": content}]}]}

    if not update_data:
        return {"success": False, "error": "No updates specified"}

    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{api_base_url}/api/kb/pages/{page_id}",
            json=update_data,
            headers={"X-Workspace-Id": workspace_id} if workspace_id else {},
            timeout=30.0,
        )

        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "page": data.get("data", data),
                "message": "Page updated successfully",
            }
        else:
            return {
                "success": False,
                "error": f"Failed to update page: {response.text}",
            }


@tool
async def search_kb(
    query: str,
    limit: int = 10,
    workspace_id: Optional[str] = None,
    api_base_url: str = "http://localhost:3001",
) -> dict:
    """
    Search the knowledge base using full-text search.

    Args:
        query: Search query string
        limit: Maximum number of results (default: 10)
        workspace_id: Workspace ID (from context)
        api_base_url: API base URL (from context)

    Returns:
        List of matching pages with titles and snippets
    """
    logger.info(f"Searching KB: {query}")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{api_base_url}/api/kb/pages",
            params={"q": query, "limit": limit},
            headers={"X-Workspace-Id": workspace_id} if workspace_id else {},
            timeout=30.0,
        )

        if response.status_code == 200:
            data = response.json()
            pages = data.get("data", [])
            return {
                "success": True,
                "results": [
                    {
                        "id": p.get("id"),
                        "title": p.get("title"),
                        "slug": p.get("slug"),
                        "snippet": p.get("snippet", ""),
                        "isVerified": p.get("isVerified", False),
                        "updatedAt": p.get("updatedAt"),
                    }
                    for p in pages
                ],
                "total": len(pages),
            }
        else:
            return {
                "success": False,
                "error": f"Search failed: {response.text}",
            }


@tool
async def get_kb_page(
    page_id: Optional[str] = None,
    slug: Optional[str] = None,
    workspace_id: Optional[str] = None,
    api_base_url: str = "http://localhost:3001",
) -> dict:
    """
    Get a specific knowledge base page by ID or slug.

    Args:
        page_id: Page ID (either this or slug required)
        slug: Page slug (either this or page_id required)
        workspace_id: Workspace ID (from context)
        api_base_url: API base URL (from context)

    Returns:
        Full page data including content
    """
    if not page_id and not slug:
        return {"success": False, "error": "Either page_id or slug is required"}

    identifier = page_id or slug
    logger.info(f"Getting KB page: {identifier}")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{api_base_url}/api/kb/pages/{identifier}",
            headers={"X-Workspace-Id": workspace_id} if workspace_id else {},
            timeout=30.0,
        )

        if response.status_code == 200:
            data = response.json()
            page = data.get("data", data)
            return {
                "success": True,
                "page": {
                    "id": page.get("id"),
                    "title": page.get("title"),
                    "slug": page.get("slug"),
                    "content": page.get("content"),
                    "isVerified": page.get("isVerified", False),
                    "verifiedAt": page.get("verifiedAt"),
                    "verifiedBy": page.get("verifiedBy"),
                    "verificationExpiresAt": page.get("verificationExpiresAt"),
                    "parentId": page.get("parentId"),
                    "updatedAt": page.get("updatedAt"),
                },
            }
        elif response.status_code == 404:
            return {"success": False, "error": f"Page not found: {identifier}"}
        else:
            return {
                "success": False,
                "error": f"Failed to get page: {response.text}",
            }


@tool
async def mark_page_verified(
    page_id: str,
    expires_in: str = "90d",
    notes: Optional[str] = None,
    workspace_id: Optional[str] = None,
    api_base_url: str = "http://localhost:3001",
) -> dict:
    """
    Mark a knowledge base page as verified.

    This tool requires human approval before execution.
    Verification indicates the content has been reviewed and is accurate.

    Args:
        page_id: ID of the page to verify
        expires_in: How long the verification is valid (30d, 60d, 90d, or never)
        notes: Optional verification notes
        workspace_id: Workspace ID (from context)
        api_base_url: API base URL (from context)

    Returns:
        Updated page with verification status
    """
    logger.info(f"Marking page as verified: {page_id}")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{api_base_url}/api/kb/pages/{page_id}/verify",
            json={
                "expiresIn": expires_in,
                "notes": notes,
            },
            headers={"X-Workspace-Id": workspace_id} if workspace_id else {},
            timeout=30.0,
        )

        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "page": data.get("data", data),
                "message": "Page marked as verified",
            }
        else:
            return {
                "success": False,
                "error": f"Failed to verify page: {response.text}",
            }
