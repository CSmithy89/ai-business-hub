"""
MCP Provider Integration

Provides workspace-scoped MCP (Model Context Protocol) server management
with permission-based tool access for HYVVE platform agents.

Supports:
- Multiple MCP servers per workspace
- Permission flags (read/write/execute)
- SSE, Stdio, and HTTP transports
- Tool filtering and caching
"""

import logging
from dataclasses import dataclass, field
from enum import Flag, auto
from typing import Optional, Any

from agno.tools.mcp import MCPTools, MultiMCPTools

logger = logging.getLogger(__name__)


class MCPPermission(Flag):
    """Permission flags for MCP tool access."""
    NONE = 0
    READ = auto()      # Can read data (search, list, get)
    WRITE = auto()     # Can create/update data
    EXECUTE = auto()   # Can execute commands

    # Common permission combinations
    READ_ONLY = READ
    READ_WRITE = READ | WRITE
    FULL = READ | WRITE | EXECUTE


@dataclass
class MCPServerConfig:
    """Configuration for a single MCP server."""
    id: str
    name: str
    transport: str  # "stdio", "sse", "streamable-http"

    # Connection details (one of these based on transport)
    command: Optional[str] = None  # For stdio transport
    url: Optional[str] = None      # For SSE/HTTP transport

    # Authentication
    api_key: Optional[str] = None
    headers: dict = field(default_factory=dict)

    # Environment variables for the server
    env: dict = field(default_factory=dict)

    # Tool filtering
    include_tools: Optional[list[str]] = None
    exclude_tools: Optional[list[str]] = None

    # Permissions
    permissions: MCPPermission = MCPPermission.READ_ONLY

    # Settings
    timeout_seconds: int = 30
    enabled: bool = True


@dataclass
class WorkspaceMCPConfig:
    """MCP configuration for a workspace."""
    workspace_id: str
    servers: list[MCPServerConfig] = field(default_factory=list)

    # Global settings
    max_servers: int = 10
    default_timeout: int = 30


class MCPPermissionFilter:
    """
    Filter MCP tools based on permissions.

    Maps tool names to permission requirements and filters
    based on the server's granted permissions.
    """

    # Common tool patterns and their required permissions
    TOOL_PATTERNS = {
        # Read patterns
        "search": MCPPermission.READ,
        "list": MCPPermission.READ,
        "get": MCPPermission.READ,
        "find": MCPPermission.READ,
        "read": MCPPermission.READ,
        "fetch": MCPPermission.READ,
        "query": MCPPermission.READ,

        # Write patterns
        "create": MCPPermission.WRITE,
        "update": MCPPermission.WRITE,
        "delete": MCPPermission.WRITE,
        "add": MCPPermission.WRITE,
        "remove": MCPPermission.WRITE,
        "set": MCPPermission.WRITE,
        "put": MCPPermission.WRITE,
        "post": MCPPermission.WRITE,

        # Execute patterns
        "run": MCPPermission.EXECUTE,
        "execute": MCPPermission.EXECUTE,
        "invoke": MCPPermission.EXECUTE,
        "call": MCPPermission.EXECUTE,
        "start": MCPPermission.EXECUTE,
        "trigger": MCPPermission.EXECUTE,
    }

    @classmethod
    def get_required_permission(cls, tool_name: str) -> MCPPermission:
        """Determine required permission for a tool based on its name."""
        tool_lower = tool_name.lower()

        for pattern, permission in cls.TOOL_PATTERNS.items():
            if pattern in tool_lower:
                return permission

        # Default to READ for unknown tools
        return MCPPermission.READ

    @classmethod
    def filter_tools(
        cls,
        tool_names: list[str],
        permissions: MCPPermission,
    ) -> list[str]:
        """Filter tools based on granted permissions."""
        allowed = []

        for tool_name in tool_names:
            required = cls.get_required_permission(tool_name)
            if required in permissions:
                allowed.append(tool_name)
            else:
                logger.debug(
                    f"Tool '{tool_name}' filtered out: requires {required.name}, "
                    f"granted {permissions.name}"
                )

        return allowed


class MCPProvider:
    """
    Manages MCP server connections for a workspace.

    Provides methods to:
    - Create MCP tools for agents
    - Manage server connections
    - Apply permission-based filtering
    """

    def __init__(self, config: WorkspaceMCPConfig):
        self.config = config
        self._connections: dict[str, MCPTools] = {}

    async def get_mcp_tools(
        self,
        server_ids: Optional[list[str]] = None,
    ) -> Optional[MultiMCPTools]:
        """
        Get MCP tools for specified servers.

        Args:
            server_ids: List of server IDs to include. If None, includes all enabled.

        Returns:
            MultiMCPTools instance or None if no servers configured.
        """
        enabled_servers = [
            s for s in self.config.servers
            if s.enabled and (server_ids is None or s.id in server_ids)
        ]

        if not enabled_servers:
            logger.info(f"No MCP servers configured for workspace {self.config.workspace_id}")
            return None

        # Build configuration for MultiMCPTools
        commands = []
        urls = []
        urls_transports = []
        env_vars = {}
        include_tools = []
        exclude_tools = []

        for server in enabled_servers:
            if server.transport == "stdio" and server.command:
                commands.append(server.command)
                if server.env:
                    env_vars.update(server.env)
            elif server.transport in ("sse", "streamable-http") and server.url:
                urls.append(server.url)
                urls_transports.append(server.transport)

            # Apply permission-based tool filtering
            if server.include_tools:
                filtered = MCPPermissionFilter.filter_tools(
                    server.include_tools,
                    server.permissions,
                )
                include_tools.extend(filtered)

            if server.exclude_tools:
                exclude_tools.extend(server.exclude_tools)

        # Create MultiMCPTools
        try:
            mcp_tools = MultiMCPTools(
                commands=commands if commands else None,
                urls=urls if urls else None,
                urls_transports=urls_transports if urls_transports else None,
                env=env_vars if env_vars else None,
                include_tools=include_tools if include_tools else None,
                exclude_tools=exclude_tools if exclude_tools else None,
                timeout_seconds=self.config.default_timeout,
            )

            logger.info(
                f"Created MCP tools for workspace {self.config.workspace_id} "
                f"with {len(enabled_servers)} servers"
            )

            return mcp_tools

        except Exception as e:
            logger.error(f"Failed to create MCP tools: {e}")
            return None

    async def get_single_server_tools(
        self,
        server_id: str,
    ) -> Optional[MCPTools]:
        """
        Get MCP tools for a single server.

        Args:
            server_id: ID of the server to connect to.

        Returns:
            MCPTools instance or None if server not found.
        """
        server = next(
            (s for s in self.config.servers if s.id == server_id and s.enabled),
            None
        )

        if not server:
            logger.warning(f"MCP server '{server_id}' not found or disabled")
            return None

        # Build include_tools with permission filtering
        filtered_include = None
        if server.include_tools:
            filtered_include = MCPPermissionFilter.filter_tools(
                server.include_tools,
                server.permissions,
            )

        try:
            if server.transport == "stdio" and server.command:
                mcp_tools = MCPTools(
                    command=server.command,
                    env=server.env if server.env else None,
                    include_tools=filtered_include,
                    exclude_tools=server.exclude_tools,
                    timeout_seconds=server.timeout_seconds,
                )
            elif server.transport in ("sse", "streamable-http") and server.url:
                mcp_tools = MCPTools(
                    url=server.url,
                    transport=server.transport,
                    include_tools=filtered_include,
                    exclude_tools=server.exclude_tools,
                    timeout_seconds=server.timeout_seconds,
                )
            else:
                logger.error(f"Invalid server configuration for '{server_id}'")
                return None

            logger.info(f"Created MCP tools for server '{server_id}'")
            return mcp_tools

        except Exception as e:
            logger.error(f"Failed to create MCP tools for '{server_id}': {e}")
            return None

    def add_server(self, server: MCPServerConfig) -> bool:
        """Add a new MCP server configuration."""
        if len(self.config.servers) >= self.config.max_servers:
            logger.warning(
                f"Cannot add server: max servers ({self.config.max_servers}) reached"
            )
            return False

        # Check for duplicate ID
        if any(s.id == server.id for s in self.config.servers):
            logger.warning(f"Server with ID '{server.id}' already exists")
            return False

        self.config.servers.append(server)
        logger.info(f"Added MCP server '{server.name}' ({server.id})")
        return True

    def remove_server(self, server_id: str) -> bool:
        """Remove an MCP server configuration."""
        original_count = len(self.config.servers)
        self.config.servers = [s for s in self.config.servers if s.id != server_id]

        if len(self.config.servers) < original_count:
            logger.info(f"Removed MCP server '{server_id}'")
            return True

        logger.warning(f"MCP server '{server_id}' not found")
        return False

    def update_server(
        self,
        server_id: str,
        **updates,
    ) -> bool:
        """Update an MCP server configuration."""
        for server in self.config.servers:
            if server.id == server_id:
                for key, value in updates.items():
                    if hasattr(server, key):
                        setattr(server, key, value)
                logger.info(f"Updated MCP server '{server_id}'")
                return True

        logger.warning(f"MCP server '{server_id}' not found")
        return False

    def get_server_status(self) -> list[dict[str, Any]]:
        """Get status of all configured servers."""
        return [
            {
                "id": s.id,
                "name": s.name,
                "transport": s.transport,
                "enabled": s.enabled,
                "permissions": s.permissions.name,
            }
            for s in self.config.servers
        ]


# Common MCP server presets
MCP_PRESETS = {
    "filesystem": MCPServerConfig(
        id="mcp-filesystem",
        name="Filesystem Access",
        transport="stdio",
        command="npx -y @modelcontextprotocol/server-filesystem",
        permissions=MCPPermission.READ_WRITE,
        include_tools=["read_file", "write_file", "list_directory"],
    ),
    "github": MCPServerConfig(
        id="mcp-github",
        name="GitHub Integration",
        transport="stdio",
        command="npx -y @modelcontextprotocol/server-github",
        permissions=MCPPermission.READ_WRITE,
        env={"GITHUB_TOKEN": ""},  # User must provide
    ),
    "brave-search": MCPServerConfig(
        id="mcp-brave-search",
        name="Brave Search",
        transport="stdio",
        command="npx -y @anthropic-ai/mcp-server-brave-search",
        permissions=MCPPermission.READ_ONLY,
        env={"BRAVE_API_KEY": ""},  # User must provide
    ),
    "memory": MCPServerConfig(
        id="mcp-memory",
        name="Memory/Knowledge Store",
        transport="stdio",
        command="npx -y @modelcontextprotocol/server-memory",
        permissions=MCPPermission.READ_WRITE,
    ),
}


async def get_workspace_mcp_provider(
    workspace_id: str,
    jwt_token: Optional[str] = None,
    api_base_url: str = "http://localhost:3000",
) -> MCPProvider:
    """
    Get MCP provider for a workspace.

    Args:
        workspace_id: Workspace ID
        jwt_token: JWT token for fetching config from API
        api_base_url: Base URL for the web API

    Returns:
        Configured MCPProvider instance
    """
    import httpx

    config = WorkspaceMCPConfig(
        workspace_id=workspace_id,
        servers=[],
    )

    if not jwt_token:
        logger.warning("No JWT token provided, returning empty MCP config")
        return MCPProvider(config)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{api_base_url}/api/workspaces/{workspace_id}/mcp-servers",
                headers={"Authorization": f"Bearer {jwt_token}"},
                timeout=10.0,
            )

            if response.status_code != 200:
                logger.warning(
                    f"Failed to fetch MCP config: {response.status_code}"
                )
                return MCPProvider(config)

            data = response.json()
            if not data.get("success"):
                logger.warning("MCP config API returned error")
                return MCPProvider(config)

            # Convert API response to MCPServerConfig objects
            for server_data in data.get("data", {}).get("servers", []):
                server = MCPServerConfig(
                    id=server_data.get("serverId", ""),
                    name=server_data.get("name", ""),
                    transport=server_data.get("transport", "stdio"),
                    command=server_data.get("command"),
                    url=server_data.get("url"),
                    include_tools=server_data.get("includeTools", []),
                    exclude_tools=server_data.get("excludeTools", []),
                    permissions=_int_to_permission(server_data.get("permissions", 1)),
                    timeout_seconds=server_data.get("timeoutSeconds", 30),
                    enabled=server_data.get("enabled", True),
                )
                config.servers.append(server)

            logger.info(
                f"Loaded {len(config.servers)} MCP servers for workspace {workspace_id}"
            )

    except Exception as e:
        logger.error(f"Error fetching MCP config: {e}")

    return MCPProvider(config)


def _int_to_permission(value: int) -> MCPPermission:
    """Convert integer permission value to MCPPermission flags."""
    result = MCPPermission.NONE
    if value & 1:
        result |= MCPPermission.READ
    if value & 2:
        result |= MCPPermission.WRITE
    if value & 4:
        result |= MCPPermission.EXECUTE
    return result


async def enhance_agent_with_mcp(
    agent: Any,
    workspace_id: str,
    server_ids: Optional[list[str]] = None,
    jwt_token: Optional[str] = None,
) -> Any:
    """
    Enhance an agent with MCP tools.

    Args:
        agent: Agno Agent instance
        workspace_id: Workspace ID
        server_ids: Optional list of specific servers to use
        jwt_token: JWT token for config lookup

    Returns:
        Agent with MCP tools added
    """
    try:
        provider = await get_workspace_mcp_provider(workspace_id, jwt_token)
        mcp_tools = await provider.get_mcp_tools(server_ids)

        if mcp_tools:
            # Add MCP tools to agent's tools list
            if hasattr(agent, 'tools') and agent.tools:
                agent.tools.append(mcp_tools)
            else:
                agent.tools = [mcp_tools]

            logger.info(f"Enhanced agent '{agent.name}' with MCP tools")

        return agent

    except Exception as e:
        logger.warning(f"Failed to add MCP tools to agent: {e}")
        return agent
