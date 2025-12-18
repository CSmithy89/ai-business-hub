"""
Scribe Agent Tools
Tools for KB management, RAG queries, and content analysis.
"""

from .kb_tools import (
    create_kb_page,
    update_kb_page,
    search_kb,
    get_kb_page,
    mark_page_verified,
)

from .rag_tools import (
    query_rag,
    get_related_pages,
    ask_kb_question,
)

from .analysis_tools import (
    detect_stale_pages,
    summarize_page,
    analyze_kb_structure,
)

__all__ = [
    # KB tools
    "create_kb_page",
    "update_kb_page",
    "search_kb",
    "get_kb_page",
    "mark_page_verified",
    # RAG tools
    "query_rag",
    "get_related_pages",
    "ask_kb_question",
    # Analysis tools
    "detect_stale_pages",
    "summarize_page",
    "analyze_kb_structure",
]
