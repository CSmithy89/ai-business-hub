"""
Dynamic Module System Constants

All magic numbers for DM-02+ epics must be defined here.
Do NOT hardcode values in agent code.

Based on Epic DM-02 Technical Specification.
"""


class DMConstants:
    """Dynamic Module System constants - no magic numbers in code."""

    # AgentOS Configuration
    class AGENTOS:
        DEFAULT_PORT = 8000
        WORKER_COUNT = 4
        REQUEST_TIMEOUT_SECONDS = 30
        KEEP_ALIVE_SECONDS = 65
        MAX_CONCURRENT_TASKS = 100

    # A2A Protocol
    class A2A:
        PROTOCOL_VERSION = "0.3.0"
        TASK_TIMEOUT_SECONDS = 300
        MAX_TASK_QUEUE_SIZE = 1000
        AGENT_DISCOVERY_CACHE_TTL_SECONDS = 300
        HEARTBEAT_INTERVAL_SECONDS = 30
        MAX_MESSAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB

    # AG-UI Protocol
    class AGUI:
        PROTOCOL_VERSION = "0.1.0"
        STREAM_CHUNK_SIZE_BYTES = 4096
        MAX_STREAM_DURATION_SECONDS = 600
        TOOL_CALL_TIMEOUT_SECONDS = 60
        MAX_TOOL_CALLS_PER_REQUEST = 50

    # CCR Configuration (for DM-02.6+)
    class CCR:
        DEFAULT_PORT = 3456
        HEALTH_CHECK_INTERVAL_SECONDS = 30
        PROVIDER_TIMEOUT_SECONDS = 60
        MAX_RETRIES = 3
        RETRY_BACKOFF_MULTIPLIER = 2.0
        QUOTA_WARNING_THRESHOLD = 0.8
        QUOTA_CRITICAL_THRESHOLD = 0.95

    # Dashboard Agent (for DM-02.4+)
    class DASHBOARD:
        MAX_WIDGETS_PER_REQUEST = 12
        WIDGET_DATA_TTL_SECONDS = 60
        CACHE_SIZE_MB = 100
        CONCURRENT_AGENT_CALLS = 5

    # Performance Targets
    class PERFORMANCE:
        P50_RESPONSE_TARGET_MS = 200
        P95_RESPONSE_TARGET_MS = 500
        P99_RESPONSE_TARGET_MS = 1000
        MAX_MEMORY_MB = 512

    # Task Classification (for DM-02.8)
    class TASK_CLASSIFICATION:
        # Keywords that indicate task types
        REASONING_KEYWORDS = frozenset([
            "analyze", "reason", "think", "plan", "strategy",
            "evaluate", "assess", "consider", "determine", "decide",
            "compare", "prioritize", "recommend", "advise", "explain",
        ])
        CODE_KEYWORDS = frozenset([
            "code", "implement", "function", "class", "method",
            "debug", "fix", "refactor", "test", "write code",
            "programming", "developer", "software", "api", "endpoint",
        ])
        LONG_CONTEXT_KEYWORDS = frozenset([
            "document", "summarize", "summary", "file", "pdf",
            "article", "paper", "report", "review", "read",
            "extract", "comprehend", "understand", "context",
        ])

        # Explicit hint patterns (e.g., "[code]", "[reasoning]")
        EXPLICIT_HINT_PATTERN = r"\[(\w+)\]"

        # Valid task types for CCR routing
        VALID_TASK_TYPES = frozenset([
            "reasoning",
            "code_generation",
            "long_context",
            "general",
        ])
