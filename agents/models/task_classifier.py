"""
Task Classification for CCR Routing

Classifies tasks to route them to the optimal provider through CCR.
Uses keyword matching, explicit hints, and agent context.
"""

import logging
import re
from enum import Enum
from typing import Optional

from agents.constants.dm_constants import DMConstants

logger = logging.getLogger(__name__)


class TaskType(str, Enum):
    """Task types matching CCR routing categories."""

    REASONING = "reasoning"
    CODE_GENERATION = "code_generation"
    LONG_CONTEXT = "long_context"
    GENERAL = "general"


def extract_explicit_hints(message: str) -> Optional[str]:
    """
    Extract explicit task type hints from message.

    Supports format: [task_type] anywhere in message
    Example: "[code] Write a function that..." -> "code"

    Args:
        message: User message text

    Returns:
        Task type hint if found, None otherwise
    """
    if not message:
        return None

    pattern = DMConstants.TASK_CLASSIFICATION.EXPLICIT_HINT_PATTERN
    match = re.search(pattern, message, re.IGNORECASE)

    if match:
        hint = match.group(1).lower()
        logger.debug("Extracted explicit hint: %s", hint)
        return hint

    return None


def _normalize_hint_to_task_type(hint: str) -> Optional[TaskType]:
    """
    Normalize a hint string to a valid TaskType.

    Handles aliases:
    - "code" -> CODE_GENERATION
    - "analysis" -> REASONING
    - "summary" -> LONG_CONTEXT

    Args:
        hint: Extracted hint string

    Returns:
        TaskType if valid, None otherwise
    """
    hint_lower = hint.lower()

    # Direct mapping
    if hint_lower in ("reasoning", "reason", "analysis", "analyze", "think"):
        return TaskType.REASONING
    elif hint_lower in ("code", "code_generation", "coding", "implement"):
        return TaskType.CODE_GENERATION
    elif hint_lower in ("long_context", "context", "summary", "document"):
        return TaskType.LONG_CONTEXT
    elif hint_lower in ("general", "default"):
        return TaskType.GENERAL

    return None


def _count_keyword_matches(message_lower: str, words: set, keywords: frozenset) -> int:
    """
    Count keyword matches including multi-word phrases.

    Args:
        message_lower: Lowercase message text
        words: Set of individual words in message
        keywords: Keyword set to match against

    Returns:
        Count of matches (multi-word phrases count as 2)
    """
    count = 0
    for keyword in keywords:
        if " " in keyword:
            # Multi-word phrase - check if it exists in the message
            if keyword in message_lower:
                count += 2  # Weight multi-word matches higher
        elif keyword in words:
            count += 1
    return count


def classify_by_keywords(message: str) -> Optional[TaskType]:
    """
    Classify task type by keyword matching.

    Uses keyword sets from DMConstants.

    Args:
        message: User message text

    Returns:
        TaskType based on keyword match, None if no strong match
    """
    if not message:
        return None

    message_lower = message.lower()
    words = set(message_lower.split())

    # Count matches for each category (handles both single words and phrases)
    reasoning_matches = _count_keyword_matches(
        message_lower, words, DMConstants.TASK_CLASSIFICATION.REASONING_KEYWORDS
    )
    code_matches = _count_keyword_matches(
        message_lower, words, DMConstants.TASK_CLASSIFICATION.CODE_KEYWORDS
    )
    context_matches = _count_keyword_matches(
        message_lower, words, DMConstants.TASK_CLASSIFICATION.LONG_CONTEXT_KEYWORDS
    )

    # Determine winner
    max_matches = max(reasoning_matches, code_matches, context_matches)

    if max_matches == 0:
        return None

    if code_matches == max_matches:
        return TaskType.CODE_GENERATION
    elif reasoning_matches == max_matches:
        return TaskType.REASONING
    elif context_matches == max_matches:
        return TaskType.LONG_CONTEXT

    return None


def get_task_type_for_agent(
    agent_id: str,
    message: Optional[str] = None,
) -> TaskType:
    """
    Get task type considering agent context and message.

    Classification priority:
    1. Explicit hints in message (e.g., "[code]")
    2. Agent type default
    3. Keyword-based classification
    4. Fall back to GENERAL

    Args:
        agent_id: Agent identifier
        message: Optional user message for classification

    Returns:
        Classified TaskType
    """
    # Import here to avoid circular dependency
    from agents.models.selector import AGENT_MODEL_PREFERENCES

    # 1. Check for explicit hints
    if message:
        hint = extract_explicit_hints(message)
        if hint:
            task_type = _normalize_hint_to_task_type(hint)
            if task_type:
                logger.debug(
                    "Task classified by explicit hint",
                    extra={"agent_id": agent_id, "task_type": task_type.value},
                )
                return task_type

    # 2. Use agent default if available
    agent_prefs = AGENT_MODEL_PREFERENCES.get(agent_id, {})
    agent_default = agent_prefs.get("task_type")

    if agent_default:
        try:
            task_type = TaskType(agent_default)
            logger.debug(
                "Task classified by agent default",
                extra={"agent_id": agent_id, "task_type": task_type.value},
            )
            return task_type
        except ValueError:
            pass  # Invalid task type, continue to keyword matching

    # 3. Keyword-based classification
    if message:
        task_type = classify_by_keywords(message)
        if task_type:
            logger.debug(
                "Task classified by keywords",
                extra={"agent_id": agent_id, "task_type": task_type.value},
            )
            return task_type

    # 4. Fall back to general
    logger.debug(
        "Task classification fell back to GENERAL",
        extra={"agent_id": agent_id},
    )
    return TaskType.GENERAL


def classify_task(
    message: str,
    agent_id: Optional[str] = None,
) -> TaskType:
    """
    Main classification function.

    Convenience wrapper around get_task_type_for_agent.

    Args:
        message: User message text
        agent_id: Optional agent identifier for context

    Returns:
        Classified TaskType
    """
    return get_task_type_for_agent(
        agent_id=agent_id or "unknown",
        message=message,
    )
