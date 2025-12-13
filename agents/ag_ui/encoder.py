from typing import Any, Dict, AsyncGenerator
import json
import logging
from enum import Enum
from agno.agent import AgentRunResponse

logger = logging.getLogger(__name__)

class AGUIEventType(str, Enum):
    """
    Standard AG-UI Event Types.
    These map to the frontend event handlers.
    """
    RUN_STARTED = "RUN_STARTED"
    RUN_FINISHED = "RUN_FINISHED"
    TEXT_MESSAGE_CHUNK = "TEXT_MESSAGE_CHUNK"
    TOOL_CALL_START = "TOOL_CALL_START"
    TOOL_CALL_ARGS = "TOOL_CALL_ARGS"
    TOOL_CALL_RESULT = "TOOL_CALL_RESULT"
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
                
                # Check for Tool Calls (Implementation depends on Agno internals)
                # For now, we assume simple text streaming
                if hasattr(chunk, "content") and chunk.content:
                     yield cls.encode(AGUIEventType.TEXT_MESSAGE_CHUNK, {
                        "delta": chunk.content,
                        "messageId": f"msg_{session_id}"
                    })
                
                # TODO: Add specific handling for ToolCall events when Agno exposes them in the stream

        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield cls.encode(AGUIEventType.ERROR, {
                "code": "STREAM_ERROR",
                "message": str(e)
            })

        # 2. Send Run Finished
        yield cls.encode(AGUIEventType.RUN_FINISHED, {
            "runId": session_id,
            "status": "success"
        })
