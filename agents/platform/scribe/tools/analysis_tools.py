"""
Analysis Tools for Scribe Agent.
Content analysis, stale detection, and KB structure analysis.
"""

from typing import Optional
import logging
from agno import tool

from .http_utils import api_get, API_BASE_URL

logger = logging.getLogger(__name__)


@tool
async def detect_stale_pages(
    days_threshold: int = 90,
    include_expired_verification: bool = True,
    limit: int = 20,
    workspace_id: Optional[str] = None,
    api_token: Optional[str] = None,
    api_base_url: str = API_BASE_URL,
) -> dict:
    """
    Detect knowledge base pages that may need review.

    Identifies stale content based on:
    - Pages not updated in X days
    - Pages with expired verification
    - Pages never verified

    Args:
        days_threshold: Days since last update to consider stale (default: 90)
        include_expired_verification: Include pages with expired verification
        limit: Maximum number of results (default: 20)
        workspace_id: Workspace ID (from context)
        api_token: API authentication token (from context)
        api_base_url: API base URL (from context)

    Returns:
        List of stale pages with staleness reasons
    """
    logger.info(f"Detecting stale pages (threshold: {days_threshold} days)")

    result = await api_get(
        endpoint="/api/kb/verification/stale",
        params={
            "daysThreshold": days_threshold,
            "includeExpired": include_expired_verification,
            "limit": limit,
        },
        workspace_id=workspace_id,
        api_token=api_token,
        api_base_url=api_base_url,
    )

    if result["success"]:
        data = result.get("data", {})
        pages = data.get("data", [])
        return {
            "success": True,
            "stale_pages": [
                {
                    "id": p.get("id"),
                    "title": p.get("title"),
                    "slug": p.get("slug"),
                    "reason": p.get("staleReason", "unknown"),
                    "daysSinceUpdate": p.get("daysSinceUpdate", 0),
                    "isVerified": p.get("isVerified", False),
                    "verificationExpired": p.get("verificationExpired", False),
                    "ownerName": p.get("owner", {}).get("name"),
                }
                for p in pages
            ],
            "total": len(pages),
            "threshold_days": days_threshold,
        }
    else:
        return {
            "success": False,
            "error": f"Failed to detect stale pages: {result.get('error', 'Unknown error')}",
        }


@tool
async def summarize_page(
    page_id: str,
    max_sentences: int = 3,
    workspace_id: Optional[str] = None,
    api_token: Optional[str] = None,
    api_base_url: str = API_BASE_URL,
) -> dict:
    """
    Generate a summary of a knowledge base page.

    Extracts key points and creates a concise summary.

    Args:
        page_id: ID of the page to summarize
        max_sentences: Maximum sentences in summary (default: 3)
        workspace_id: Workspace ID (from context)
        api_token: API authentication token (from context)
        api_base_url: API base URL (from context)

    Returns:
        Summary text and key points
    """
    logger.info(f"Summarizing page: {page_id}")

    # First get the page content
    result = await api_get(
        endpoint=f"/api/kb/pages/{page_id}",
        workspace_id=workspace_id,
        api_token=api_token,
        api_base_url=api_base_url,
    )

    if not result["success"]:
        return {
            "success": False,
            "error": f"Failed to get page: {result.get('error', 'Unknown error')}",
        }

    data = result.get("data", {})
    page = data.get("data", data)
    title = page.get("title", "")
    content = page.get("content", {})

    # Extract text from Tiptap JSON
    text_content = _extract_text_from_tiptap(content)

    if not text_content:
        return {
            "success": True,
            "page_id": page_id,
            "title": title,
            "summary": "Page has no text content.",
            "key_points": [],
        }

    # Simple summarization (first N sentences)
    sentences = text_content.replace("\n", " ").split(". ")
    summary = ". ".join(sentences[:max_sentences])
    if summary and not summary.endswith("."):
        summary += "."

    # Extract key points (sentences that start with action words or contain keywords)
    key_points = []
    action_words = ["how to", "must", "should", "important", "note:", "warning:"]
    for sentence in sentences[:10]:  # Check first 10 sentences
        sentence_lower = sentence.lower().strip()
        if any(word in sentence_lower for word in action_words):
            key_points.append(sentence.strip())

    return {
        "success": True,
        "page_id": page_id,
        "title": title,
        "summary": summary,
        "key_points": key_points[:5],  # Max 5 key points
        "word_count": len(text_content.split()),
    }


@tool
async def analyze_kb_structure(
    workspace_id: Optional[str] = None,
    api_token: Optional[str] = None,
    api_base_url: str = API_BASE_URL,
) -> dict:
    """
    Analyze the knowledge base structure and identify potential issues.

    Checks for:
    - Orphan pages (no parent, not root)
    - Deep nesting issues
    - Pages without content
    - Duplicate or similar titles
    - Missing verification coverage

    Args:
        workspace_id: Workspace ID (from context)
        api_token: API authentication token (from context)
        api_base_url: API base URL (from context)

    Returns:
        Structure analysis with recommendations
    """
    logger.info("Analyzing KB structure")

    # Get all pages for analysis
    result = await api_get(
        endpoint="/api/kb/pages",
        params={"limit": 500},  # Get all pages
        workspace_id=workspace_id,
        api_token=api_token,
        api_base_url=api_base_url,
        timeout=60.0,
    )

    if not result["success"]:
        return {
            "success": False,
            "error": f"Failed to get pages: {result.get('error', 'Unknown error')}",
        }

    data = result.get("data", {})
    pages = data.get("data", [])

    # Analyze structure
    analysis = {
        "total_pages": len(pages),
        "verified_pages": 0,
        "unverified_pages": 0,
        "orphan_pages": [],
        "empty_pages": [],
        "deep_nested_pages": [],
        "potential_duplicates": [],
        "recommendations": [],
    }

    titles_seen = {}
    for page in pages:
        page_id = page.get("id")
        title = page.get("title", "")
        parent_id = page.get("parentId")
        is_verified = page.get("isVerified", False)
        depth = page.get("depth", 0)
        content = page.get("content", {})

        # Count verification status
        if is_verified:
            analysis["verified_pages"] += 1
        else:
            analysis["unverified_pages"] += 1

        # Check for orphans (has parent reference but parent doesn't exist)
        # Note: This is a simplified check
        if parent_id and depth == 0:
            analysis["orphan_pages"].append({
                "id": page_id,
                "title": title,
            })

        # Check for empty pages
        text = _extract_text_from_tiptap(content)
        if len(text.strip()) < 50:  # Less than 50 chars
            analysis["empty_pages"].append({
                "id": page_id,
                "title": title,
                "word_count": len(text.split()),
            })

        # Check for deep nesting
        if depth > 4:
            analysis["deep_nested_pages"].append({
                "id": page_id,
                "title": title,
                "depth": depth,
            })

        # Track titles for duplicate detection
        title_lower = title.lower().strip()
        if title_lower in titles_seen:
            analysis["potential_duplicates"].append({
                "title": title,
                "pages": [titles_seen[title_lower], page_id],
            })
        else:
            titles_seen[title_lower] = page_id

    # Generate recommendations
    if analysis["unverified_pages"] > analysis["verified_pages"]:
        analysis["recommendations"].append(
            f"Consider reviewing and verifying more pages. "
            f"Only {analysis['verified_pages']} of {analysis['total_pages']} pages are verified."
        )

    if analysis["empty_pages"]:
        analysis["recommendations"].append(
            f"Found {len(analysis['empty_pages'])} pages with little content. "
            "Consider adding content or removing empty pages."
        )

    if analysis["deep_nested_pages"]:
        analysis["recommendations"].append(
            f"Found {len(analysis['deep_nested_pages'])} deeply nested pages (depth > 4). "
            "Consider flattening the structure for better navigation."
        )

    if analysis["potential_duplicates"]:
        analysis["recommendations"].append(
            f"Found {len(analysis['potential_duplicates'])} potential duplicate pages. "
            "Consider consolidating similar content."
        )

    analysis["success"] = True
    return analysis


def _extract_text_from_tiptap(content: dict) -> str:
    """Extract plain text from Tiptap JSON content."""
    if not content:
        return ""

    text_parts = []
    max_depth = 50  # Prevent stack overflow from malicious content

    def traverse(node, depth=0):
        if depth > max_depth:
            return
        if isinstance(node, dict):
            if node.get("type") == "text":
                text_parts.append(node.get("text", ""))
            if "content" in node:
                for child in node["content"]:
                    traverse(child, depth + 1)
        elif isinstance(node, list):
            for item in node:
                traverse(item, depth + 1)

    traverse(content)
    return " ".join(text_parts)
