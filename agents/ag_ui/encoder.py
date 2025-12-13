from typing import Any, Dict, AsyncGenerator
import json
import logging
from enum import Enum

logger = logging.getLogger(__name__)

class AGUIEventType(str, Enum):
    """
    Standard AG-UI Event Types.
    These map to the frontend event handlers.

    Reference: docs/architecture/ag-ui-protocol.md
    """
    # Lifecycle Events
    RUN_STARTED = "RUN_STARTED"
    RUN_FINISHED = "RUN_FINISHED"

    # Text Streaming Events
    TEXT_MESSAGE_CHUNK = "TEXT_MESSAGE_CHUNK"

    # Reasoning/Thinking Events (for o1, Claude 3.5 extended thinking)
    THOUGHT_CHUNK = "THOUGHT_CHUNK"

    # Tool Execution Events
    TOOL_CALL_START = "TOOL_CALL_START"
    TOOL_CALL_ARGS = "TOOL_CALL_ARGS"
    TOOL_CALL_RESULT = "TOOL_CALL_RESULT"

    # Rich UI Events
    UI_RENDER_HINT = "UI_RENDER_HINT"

    # Error Events
    ERROR = "ERROR"

class EventEncoder:
    """
    Encodes Agno agent events into AG-UI SSE format.
    """

    @staticmethod
    def encode(event_type: str, data: Dict[str, Any]) -> str:
        """
        Encodes a single event into SSE format.
        
        Format:
        event: message
        data: {"type": "RUN_STARTED", ...}
        \n\n
        """
        payload = {
            "type": event_type,
            **data
        }
        # SSE format requires 'data: ' prefix and double newline suffix
        return f"data: {json.dumps(payload)}\n\n"

    @classmethod
    async def stream_response(
        cls, 
        agent_response_generator: AsyncGenerator,
        session_id: str
    ) -> AsyncGenerator[str, None]:
        """
        Transforms an Agno async generator into an AG-UI SSE stream.
        """
        # 1. Send Run Started
        yield cls.encode(AGUIEventType.RUN_STARTED, {
            "runId": session_id,
            "created_at": None # Optional timestamp
        })

        try:
            async for chunk in agent_response_generator:
                # Agno chunks are usually objects with a 'content' attribute or similar
                # We need to detect what kind of chunk it is

                # Handle Tool Call Start
                if hasattr(chunk, "tool_call") and chunk.tool_call:
                    tool_call = chunk.tool_call
                    yield cls.encode(AGUIEventType.TOOL_CALL_START, {
                        "toolCallId": getattr(tool_call, "id", f"call_{session_id}"),
                        "toolName": getattr(tool_call, "name", "unknown"),
                        "args": getattr(tool_call, "arguments", {})
                    })
                    continue

                # Handle Tool Call Result
                if hasattr(chunk, "tool_result") and chunk.tool_result:
                    tool_result = chunk.tool_result
                    yield cls.encode(AGUIEventType.TOOL_CALL_RESULT, {
                        "toolCallId": getattr(tool_result, "tool_call_id", f"call_{session_id}"),
                        "result": getattr(tool_result, "content", str(tool_result)),
                        "isError": getattr(tool_result, "is_error", False)
                    })
                    continue

                # Handle Thinking/Reasoning chunks (for o1, Claude extended thinking)
                if hasattr(chunk, "thinking") and chunk.thinking:
                    yield cls.encode(AGUIEventType.THOUGHT_CHUNK, {
                        "delta": chunk.thinking,
                        "messageId": f"thought_{session_id}"
                    })
                    continue

                # Handle UI Render Hints (rich components like charts, cards)
                if hasattr(chunk, "render_hint") and chunk.render_hint:
                    yield cls.encode(AGUIEventType.UI_RENDER_HINT, {
                        "component": chunk.render_hint.get("component", "Unknown"),
                        "props": chunk.render_hint.get("props", {})
                    })
                    continue

                # Default: Text content streaming
                if hasattr(chunk, "content") and chunk.content:
                    yield cls.encode(AGUIEventType.TEXT_MESSAGE_CHUNK, {
                        "delta": chunk.content,
                        "messageId": f"msg_{session_id}"
                    })

            # 2. Send Run Finished (success)
            yield cls.encode(AGUIEventType.RUN_FINISHED, {
                "runId": session_id,
                "status": "success"
            })

        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield cls.encode(AGUIEventType.ERROR, {
                "code": "STREAM_ERROR",
                "message": str(e)
            })
            # Send Run Finished with error status
            yield cls.encode(AGUIEventType.RUN_FINISHED, {
                "runId": session_id,
                "status": "error"
            })
