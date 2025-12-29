"""
KB Tools for Scribe Agent.
Page CRUD operations for knowledge base management.
"""

from typing import Optional
import logging
from agno.tools import tool

from .http_utils import api_get, api_post, api_patch, API_BASE_URL

logger = logging.getLogger(__name__)

# Input validation constants
MAX_TITLE_LENGTH = 200
MAX_CONTENT_LENGTH = 100000


def _validate_page_input(
    title: Optional[str] = None,
    content: Optional[str] = None,
) -> Optional[dict]:
    """Validate page input and return error dict if invalid, None if valid."""
    if title is not None and len(title) > MAX_TITLE_LENGTH:
        return {
            "success": False,
            "error": f"Title too long (max {MAX_TITLE_LENGTH} chars, got {len(title)})",
        }
    if content is not None and len(content) > MAX_CONTENT_LENGTH:
        return {
            "success": False,
            "error": f"Content too long (max {MAX_CONTENT_LENGTH} chars, got {len(content)})",
        }
    return None


@tool
async def create_kb_page(
    title: str,
    content: str,
    parent_id: Optional[str] = None,
    workspace_id: Optional[str] = None,
    api_token: Optional[str] = None,
    api_base_url: str = API_BASE_URL,
) -> dict:
    """
    Create a new knowledge base page.

    This tool requires human approval before execution.
    The agent will suggest the content, and the user must confirm.

    Args:
        title: Title of the new page (max 200 chars)
        content: Content in Markdown format (max 100k chars)
        parent_id: Optional parent page ID for hierarchy
        workspace_id: Workspace ID (from context)
        api_token: API authentication token (from context)
        api_base_url: API base URL (from context)

    Returns:
        Created page data including ID and slug
    """
    # Validate input
    validation_error = _validate_page_input(title=title, content=content)
    if validation_error:
        return validation_error

    logger.info(f"Creating KB page: {title}")

    result = await api_post(
        endpoint="/api/kb/pages",
        json={
            "title": title,
            "content": {
                "type": "doc",
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": content}]}
                ],
            },
            "parentId": parent_id,
        },
        workspace_id=workspace_id,
        api_token=api_token,
        api_base_url=api_base_url,
    )

    if result["success"]:
        data = result.get("data", {})
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
            "error": f"Failed to create page: {result.get('error', 'Unknown error')}",
        }


@tool
async def update_kb_page(
    page_id: str,
    title: Optional[str] = None,
    content: Optional[str] = None,
    workspace_id: Optional[str] = None,
    api_token: Optional[str] = None,
    api_base_url: str = API_BASE_URL,
) -> dict:
    """
    Update an existing knowledge base page.

    This tool requires human approval before execution.
    The agent will suggest changes, and the user must confirm.

    Args:
        page_id: ID of the page to update
        title: New title (optional, max 200 chars)
        content: New content in Markdown format (optional, max 100k chars)
        workspace_id: Workspace ID (from context)
        api_token: API authentication token (from context)
        api_base_url: API base URL (from context)

    Returns:
        Updated page data
    """
    # Validate input
    validation_error = _validate_page_input(title=title, content=content)
    if validation_error:
        return validation_error

    logger.info(f"Updating KB page: {page_id}")

    update_data = {}
    if title:
        update_data["title"] = title
    if content:
        update_data["content"] = {
            "type": "doc",
            "content": [
                {"type": "paragraph", "content": [{"type": "text", "text": content}]}
            ],
        }

    if not update_data:
        return {"success": False, "error": "No updates specified"}

    result = await api_patch(
        endpoint=f"/api/kb/pages/{page_id}",
        json=update_data,
        workspace_id=workspace_id,
        api_token=api_token,
        api_base_url=api_base_url,
    )

    if result["success"]:
        data = result.get("data", {})
        return {
            "success": True,
            "page": data.get("data", data),
            "message": "Page updated successfully",
        }
    else:
        return {
            "success": False,
            "error": f"Failed to update page: {result.get('error', 'Unknown error')}",
        }


@tool
async def search_kb(
    query: str,
    limit: int = 10,
    workspace_id: Optional[str] = None,
    api_token: Optional[str] = None,
    api_base_url: str = API_BASE_URL,
) -> dict:
    """
    Search the knowledge base using full-text search.

    Args:
        query: Search query string
        limit: Maximum number of results (default: 10)
        workspace_id: Workspace ID (from context)
        api_token: API authentication token (from context)
        api_base_url: API base URL (from context)

    Returns:
        List of matching pages with titles and snippets
    """
    logger.info(f"Searching KB: {query}")

    result = await api_get(
        endpoint="/api/kb/pages",
        params={"q": query, "limit": limit},
        workspace_id=workspace_id,
        api_token=api_token,
        api_base_url=api_base_url,
    )

    if result["success"]:
        data = result.get("data", {})
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
            "error": f"Search failed: {result.get('error', 'Unknown error')}",
        }


@tool
async def get_kb_page(
    page_id: Optional[str] = None,
    slug: Optional[str] = None,
    workspace_id: Optional[str] = None,
    api_token: Optional[str] = None,
    api_base_url: str = API_BASE_URL,
) -> dict:
    """
    Get a specific knowledge base page by ID or slug.

    Args:
        page_id: Page ID (either this or slug required)
        slug: Page slug (either this or page_id required)
        workspace_id: Workspace ID (from context)
        api_token: API authentication token (from context)
        api_base_url: API base URL (from context)

    Returns:
        Full page data including content
    """
    if not page_id and not slug:
        return {"success": False, "error": "Either page_id or slug is required"}

    identifier = page_id or slug
    logger.info(f"Getting KB page: {identifier}")

    result = await api_get(
        endpoint=f"/api/kb/pages/{identifier}",
        workspace_id=workspace_id,
        api_token=api_token,
        api_base_url=api_base_url,
    )

    if result["success"]:
        data = result.get("data", {})
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
    elif result.get("status_code") == 404:
        return {"success": False, "error": f"Page not found: {identifier}"}
    else:
        return {
            "success": False,
            "error": f"Failed to get page: {result.get('error', 'Unknown error')}",
        }


@tool
async def mark_page_verified(
    page_id: str,
    expires_in: str = "90d",
    notes: Optional[str] = None,
    workspace_id: Optional[str] = None,
    api_token: Optional[str] = None,
    api_base_url: str = API_BASE_URL,
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
        api_token: API authentication token (from context)
        api_base_url: API base URL (from context)

    Returns:
        Updated page with verification status
    """
    logger.info(f"Marking page as verified: {page_id}")

    result = await api_post(
        endpoint=f"/api/kb/pages/{page_id}/verify",
        json={
            "expiresIn": expires_in,
            "notes": notes,
        },
        workspace_id=workspace_id,
        api_token=api_token,
        api_base_url=api_base_url,
    )

    if result["success"]:
        data = result.get("data", {})
        return {
            "success": True,
            "page": data.get("data", data),
            "message": "Page marked as verified",
        }
    else:
        return {
            "success": False,
            "error": f"Failed to verify page: {result.get('error', 'Unknown error')}",
        }
