"""
ScribeAgent - AI-powered Knowledge Base Management
AI Business Hub Platform Agent

This agent helps users manage the knowledge base by creating,
updating, searching, and maintaining documentation with AI assistance.

BMAD Spec: Epic KB-03 - KB Verification & Scribe Agent
"""

from typing import Optional
import logging

from agno import Agent
from agno.db.postgres import PostgresDb

# Import KB tools
from .tools.kb_tools import (
    create_kb_page,
    update_kb_page,
    search_kb,
    get_kb_page,
    mark_page_verified,
)

# Import RAG tools
from .tools.rag_tools import (
    query_rag,
    get_related_pages,
    ask_kb_question,
)

# Import analysis tools
from .tools.analysis_tools import (
    detect_stale_pages,
    summarize_page,
    analyze_kb_structure,
)

logger = logging.getLogger(__name__)


# ============================================================================
# Agent Configuration
# ============================================================================

AGENT_NAME = "Scribe"
AGENT_TITLE = "AI-powered Knowledge Base Assistant"

INSTRUCTIONS = [
    "You are Scribe, the Knowledge Base management assistant for HYVVE AI Business Hub.",
    "Your role is to help users create, organize, and maintain their knowledge base documentation.",
    "",
    "Core Responsibilities:",
    "- Help create new KB pages with well-structured content",
    "- Find and retrieve relevant information from the knowledge base",
    "- Identify stale content that needs review or updates",
    "- Suggest improvements to documentation structure",
    "- Answer questions using the knowledge base as context",
    "",
    "Communication Style:",
    "- Be helpful and proactive - suggest related pages and improvements",
    "- Use clear, concise language",
    "- Format responses with proper Markdown when appropriate",
    "- Acknowledge the source of information when answering from KB",
    "",
    "Important Constraints:",
    "- ALWAYS require user approval before creating or modifying content",
    "- Present changes as suggestions, never make unilateral edits",
    "- When uncertain about content, ask clarifying questions",
    "- Respect page ownership and verification status",
    "",
    "Tools Available:",
    "- create_kb_page: Draft new KB pages (requires approval)",
    "- update_kb_page: Suggest updates to existing pages (requires approval)",
    "- search_kb: Full-text search the knowledge base",
    "- get_kb_page: Retrieve a specific page by ID or slug",
    "- mark_page_verified: Suggest marking a page as verified (requires approval)",
    "- query_rag: Semantic search using embeddings",
    "- get_related_pages: Find pages related to a topic",
    "- ask_kb_question: Answer questions using KB content",
    "- detect_stale_pages: Find pages that need review",
    "- summarize_page: Generate a summary of a page",
    "- analyze_kb_structure: Analyze page hierarchy and identify gaps",
]

PRINCIPLES = [
    "Human approval required for all content modifications",
    "Accurate information sourcing from the KB",
    "Proactive identification of maintenance needs",
    "Clear communication about certainty levels",
    "Respect for page ownership and permissions",
    "Helpful suggestions without being intrusive",
]


# ============================================================================
# Agent Type Alias
# ============================================================================

ScribeAgent = Agent


# ============================================================================
# Agent Factory
# ============================================================================

def create_scribe_agent(
    database_url: str,
    model: str = "gpt-4o",
    workspace_id: Optional[str] = None,
    user_id: Optional[str] = None,
    api_base_url: str = "http://localhost:3001",
) -> Agent:
    """
    Create a tenant-isolated ScribeAgent instance.

    Args:
        database_url: PostgreSQL connection string
        model: LLM model to use (default: gpt-4o)
        workspace_id: Workspace ID for tenant isolation
        user_id: User ID for personalization
        api_base_url: Base URL for the API

    Returns:
        Configured Scribe agent instance
    """
    logger.info(f"Creating Scribe agent for workspace={workspace_id}")

    # Create database connection
    db = PostgresDb(database_url=database_url)

    # Build context with tenant information
    context = {
        "workspace_id": workspace_id,
        "user_id": user_id,
        "api_base_url": api_base_url,
    }

    # Create agent with tools
    agent = Agent(
        name=AGENT_NAME,
        model=model,
        instructions=INSTRUCTIONS,
        storage=db,
        context=context,
        tools=[
            # KB tools
            create_kb_page,
            update_kb_page,
            search_kb,
            get_kb_page,
            mark_page_verified,
            # RAG tools
            query_rag,
            get_related_pages,
            ask_kb_question,
            # Analysis tools
            detect_stale_pages,
            summarize_page,
            analyze_kb_structure,
        ],
        # All actions require human approval (suggestion mode)
        confirm_tool_call=True,
    )

    return agent
