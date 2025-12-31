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
        # HTTP client timeouts (in seconds)
        HTTP_CONNECT_TIMEOUT = 10.0
        HTTP_WRITE_TIMEOUT = 10.0
        HTTP_POOL_TIMEOUT = 5.0
        # Error message limits
        ERROR_TEXT_MAX_LENGTH = 500

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
        # Circuit breaker: time to keep circuit open before half-open test
        CIRCUIT_BREAKER_TIMEOUT_SECONDS = 60

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

    # Shared State Configuration (for DM-04+)
    class STATE:
        """Shared state constants for DM-04+."""

        # State schema version (must match TypeScript STATE_VERSION)
        VERSION = 1

        # State update debounce to avoid flooding frontend (ms)
        UPDATE_DEBOUNCE_MS = 100

        # Maximum state size before rejection (bytes)
        MAX_STATE_SIZE_BYTES = 1024 * 1024  # 1MB

        # State emission interval for periodic updates (ms)
        STATE_EMIT_INTERVAL_MS = 5000  # 5 seconds

        # Redis key prefix for state persistence
        REDIS_KEY_PREFIX = "dashboard:state:"

        # State TTL in Redis (seconds) - 24 hours
        REDIS_TTL_SECONDS = 86400

        # Maximum alerts to keep in state
        MAX_ALERTS = 50

        # Maximum activities to keep in state
        MAX_ACTIVITIES = 100

        # Task progress constants (DM-05.4)
        MAX_ACTIVE_TASKS = 10  # Maximum concurrent task tracking
        TASK_RETENTION_MS = 300000  # 5 minutes after completion

    # Rate Limiting (for DM-08.3+)
    class RATE_LIMITS:
        """Rate limit configurations for API endpoints."""

        # Default rate limit (requests per minute)
        DEFAULT = "100/minute"

        # A2A Discovery endpoints (public, lower limit)
        A2A_DISCOVERY = "30/minute"

        # A2A Query endpoints (authenticated, higher limit)
        A2A_QUERY = "100/minute"

        # Health check endpoints (high frequency allowed)
        HEALTH = "300/minute"

        # Agent communication endpoints
        AGENT_INVOKE = "60/minute"

        # Dashboard data endpoints
        DASHBOARD = "120/minute"
