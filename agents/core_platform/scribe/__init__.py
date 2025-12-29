"""
Scribe Agent - AI-powered Knowledge Base Management
AI Business Hub Platform Agent

This agent helps users manage the knowledge base by creating,
updating, and organizing documentation with AI assistance.

BMAD Spec: Epic KB-03 - KB Verification & Scribe Agent
"""

from .scribe_agent import (
    ScribeAgent,
    create_scribe_agent,
    AGENT_NAME as SCRIBE_AGENT_NAME,
    INSTRUCTIONS as SCRIBE_INSTRUCTIONS,
)

__all__ = [
    "ScribeAgent",
    "create_scribe_agent",
    "SCRIBE_AGENT_NAME",
    "SCRIBE_INSTRUCTIONS",
]
