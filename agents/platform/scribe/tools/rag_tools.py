"""
RAG Tools for Scribe Agent
Semantic search and natural language Q&A over the knowledge base.
"""

from typing import Optional
import logging
import httpx
from agno import tool

logger = logging.getLogger(__name__)


@tool
async def query_rag(
    query: str,
    limit: int = 5,
    include_verified_only: bool = False,
    workspace_id: Optional[str] = None,
    api_base_url: str = "http://localhost:3001",
) -> dict:
    """
    Perform semantic search over the knowledge base using embeddings.

    Uses vector similarity to find conceptually related content,
    even if the exact words don't match.

    Args:
        query: Natural language query
        limit: Maximum number of results (default: 5)
        include_verified_only: Only return verified pages
        workspace_id: Workspace ID (from context)
        api_base_url: API base URL (from context)

    Returns:
        List of semantically similar pages with relevance scores
    """
    logger.info(f"RAG query: {query}")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{api_base_url}/api/kb/search/semantic",
            json={
                "query": query,
                "limit": limit,
                "verifiedOnly": include_verified_only,
            },
            headers={"X-Workspace-Id": workspace_id} if workspace_id else {},
            timeout=60.0,
        )

        if response.status_code == 200:
            data = response.json()
            results = data.get("data", [])
            return {
                "success": True,
                "results": [
                    {
                        "id": r.get("id"),
                        "title": r.get("title"),
                        "slug": r.get("slug"),
                        "snippet": r.get("snippet", ""),
                        "score": r.get("score", 0),
                        "isVerified": r.get("isVerified", False),
                    }
                    for r in results
                ],
                "total": len(results),
                "query": query,
            }
        else:
            return {
                "success": False,
                "error": f"Semantic search failed: {response.text}",
            }


@tool
async def get_related_pages(
    page_id: str,
    limit: int = 5,
    workspace_id: Optional[str] = None,
    api_base_url: str = "http://localhost:3001",
) -> dict:
    """
    Find pages related to a specific page using embedding similarity.

    Useful for suggesting related content or finding duplicate pages.

    Args:
        page_id: ID of the source page
        limit: Maximum number of related pages (default: 5)
        workspace_id: Workspace ID (from context)
        api_base_url: API base URL (from context)

    Returns:
        List of related pages with similarity scores
    """
    logger.info(f"Finding related pages for: {page_id}")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{api_base_url}/api/kb/pages/{page_id}/related",
            params={"limit": limit},
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
                        "similarity": p.get("similarity", 0),
                        "isVerified": p.get("isVerified", False),
                    }
                    for p in pages
                ],
                "total": len(pages),
            }
        else:
            return {
                "success": False,
                "error": f"Failed to get related pages: {response.text}",
            }


@tool
async def ask_kb_question(
    question: str,
    use_verified_sources: bool = True,
    workspace_id: Optional[str] = None,
    api_base_url: str = "http://localhost:3001",
) -> dict:
    """
    Answer a question using the knowledge base as context.

    Uses RAG (Retrieval Augmented Generation) to find relevant
    context and generate an accurate answer based on KB content.

    Args:
        question: Natural language question
        use_verified_sources: Prioritize verified pages as sources
        workspace_id: Workspace ID (from context)
        api_base_url: API base URL (from context)

    Returns:
        Answer with source citations
    """
    logger.info(f"Answering KB question: {question}")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{api_base_url}/api/kb/ask",
            json={
                "question": question,
                "preferVerified": use_verified_sources,
            },
            headers={"X-Workspace-Id": workspace_id} if workspace_id else {},
            timeout=90.0,
        )

        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "answer": data.get("answer", ""),
                "sources": [
                    {
                        "id": s.get("id"),
                        "title": s.get("title"),
                        "slug": s.get("slug"),
                        "isVerified": s.get("isVerified", False),
                    }
                    for s in data.get("sources", [])
                ],
                "confidence": data.get("confidence", "medium"),
            }
        else:
            return {
                "success": False,
                "error": f"Failed to answer question: {response.text}",
            }
