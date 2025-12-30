"""
MCP Tool Bridge for A2A Protocol

Bridges MCP tools to agent-compatible format, enabling Agno agents
to discover and invoke tools from MCP servers.

Converts MCP tool definitions to the format expected by Agno agents
and handles tool name translation using the mcp_{server}_{tool} convention.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.4

References:
- MCP Protocol: https://modelcontextprotocol.io
- A2A Protocol: https://github.com/google/a2a-protocol
"""
import logging
from typing import Any, Dict, List, Optional

from .client import MCPClient
from .config import MCPConfig, get_default_mcp_config

logger = logging.getLogger(__name__)

# Prefix for MCP tools in agent-compatible format
MCP_TOOL_PREFIX = "mcp"


class MCPToolBridge:
    """
    Bridges MCP tools to agent-compatible format.

    Converts MCP tool definitions (using JSON Schema for parameters)
    to the flat parameter format expected by Agno agents.

    Tool names are translated using the pattern: mcp_{server}_{tool}
    For example: github server's search_repositories -> mcp_github_search_repositories

    Attributes:
        mcp_client: Connected MCP client for tool invocation

    Example:
        >>> client = MCPClient(config)
        >>> await client.connect("github")
        >>> bridge = MCPToolBridge(client)
        >>> tools = bridge.get_tools_for_agent()
        >>> # [{"name": "mcp_github_search_repositories", "description": "...", "parameters": [...]}]
        >>> result = await bridge.invoke_tool("mcp_github_search_repositories", {"query": "python"})
    """

    def __init__(self, mcp_client: MCPClient):
        """
        Initialize bridge with MCP client.

        Args:
            mcp_client: Connected MCP client
        """
        self.mcp_client = mcp_client

    def get_tools_for_agent(self) -> List[Dict[str, Any]]:
        """
        Get MCP tools in agent-compatible format.

        Converts all available MCP tools to the format expected by Agno agents,
        using the mcp_{server}_{tool} naming convention.

        Returns:
            List of tool definitions with:
            - name: mcp_{server}_{tool} format
            - description: Tool description from MCP
            - parameters: Flattened parameter list

        Example:
            >>> tools = bridge.get_tools_for_agent()
            >>> tools[0]
            {
                "name": "mcp_github_search_repositories",
                "description": "Search GitHub repositories",
                "parameters": [
                    {"name": "query", "type": "string", "description": "Search query", "required": True}
                ]
            }
        """
        agent_tools: List[Dict[str, Any]] = []
        mcp_tools = self.mcp_client.get_available_tools()

        for tool in mcp_tools:
            server_name = tool.get("_server", "unknown")
            mcp_tool_name = tool.get("name", "")

            if not mcp_tool_name:
                logger.warning(f"Skipping MCP tool without name from server '{server_name}'")
                continue

            # Create agent-compatible tool name: mcp_{server}_{tool}
            agent_tool_name = f"{MCP_TOOL_PREFIX}_{server_name}_{mcp_tool_name}"

            # Convert parameters from JSON Schema to flat list
            parameters = self._convert_parameters(tool.get("inputSchema", {}))

            agent_tool = {
                "name": agent_tool_name,
                "description": tool.get("description", f"MCP tool: {mcp_tool_name}"),
                "parameters": parameters,
                # Store original info for debugging
                "_mcp_server": server_name,
                "_mcp_tool": mcp_tool_name,
            }

            agent_tools.append(agent_tool)

        logger.debug(f"Converted {len(agent_tools)} MCP tools for agent use")
        return agent_tools

    async def invoke_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Invoke an MCP tool by its agent-compatible name.

        Parses the tool name to extract server and tool, then routes
        the call to the correct MCP server.

        Args:
            tool_name: Agent tool name in mcp_{server}_{tool} format
            arguments: Tool arguments

        Returns:
            Tool result dictionary

        Raises:
            ValueError: If tool name format is invalid (doesn't start with mcp_)
            RuntimeError: If not connected to required server

        Example:
            >>> result = await bridge.invoke_tool(
            ...     "mcp_github_search_repositories",
            ...     {"query": "machine learning"},
            ... )
        """
        # Parse tool name: mcp_{server}_{tool}
        # Split only on first two underscores to handle tool names with underscores
        parts = tool_name.split("_", 2)

        if len(parts) < 3 or parts[0] != MCP_TOOL_PREFIX:
            raise ValueError(
                f"Invalid MCP tool name format: '{tool_name}'. "
                f"Expected format: mcp_{{server}}_{{tool}}"
            )

        server_name = parts[1]
        mcp_tool_name = parts[2]

        # Check if connected to server
        if not self.mcp_client.is_connected(server_name):
            raise RuntimeError(
                f"Not connected to MCP server '{server_name}'. "
                f"Call connect('{server_name}') first."
            )

        logger.debug(f"Invoking MCP tool '{mcp_tool_name}' on server '{server_name}'")
        return await self.mcp_client.call_tool(server_name, mcp_tool_name, arguments)

    def _convert_parameters(self, input_schema: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Convert MCP JSON Schema to agent parameter format.

        Flattens JSON Schema properties to a list of parameter definitions.

        Args:
            input_schema: MCP tool inputSchema (JSON Schema format)

        Returns:
            List of parameter dicts with name, type, description, required

        Example:
            >>> schema = {
            ...     "type": "object",
            ...     "properties": {
            ...         "query": {"type": "string", "description": "Search query"},
            ...         "limit": {"type": "integer", "description": "Max results"},
            ...     },
            ...     "required": ["query"],
            ... }
            >>> params = bridge._convert_parameters(schema)
            >>> params
            [
                {"name": "query", "type": "string", "description": "Search query", "required": True},
                {"name": "limit", "type": "integer", "description": "Max results", "required": False},
            ]
        """
        parameters: List[Dict[str, Any]] = []
        properties = input_schema.get("properties", {})
        required_fields = set(input_schema.get("required", []))

        for prop_name, prop_schema in properties.items():
            param = {
                "name": prop_name,
                "type": prop_schema.get("type", "string"),
                "description": prop_schema.get("description", ""),
                "required": prop_name in required_fields,
            }

            # Include default if present
            if "default" in prop_schema:
                param["default"] = prop_schema["default"]

            # Include enum options if present
            if "enum" in prop_schema:
                param["enum"] = prop_schema["enum"]

            parameters.append(param)

        return parameters

    def parse_tool_name(self, agent_tool_name: str) -> tuple[str, str]:
        """
        Parse an agent tool name into server and MCP tool name.

        Args:
            agent_tool_name: Tool name in mcp_{server}_{tool} format

        Returns:
            Tuple of (server_name, mcp_tool_name)

        Raises:
            ValueError: If name format is invalid
        """
        parts = agent_tool_name.split("_", 2)
        if len(parts) < 3 or parts[0] != MCP_TOOL_PREFIX:
            raise ValueError(f"Invalid MCP tool name format: '{agent_tool_name}'")
        return parts[1], parts[2]


async def create_mcp_bridge(
    config: Optional[MCPConfig] = None,
    connect_enabled: bool = True,
) -> MCPToolBridge:
    """
    Create and initialize an MCP tool bridge.

    Factory function that creates an MCPClient, optionally connects to
    enabled servers, and returns a configured MCPToolBridge.

    Args:
        config: Optional MCP configuration. Uses defaults if None.
        connect_enabled: Whether to automatically connect to enabled servers.
                        Set to False for manual connection control.

    Returns:
        Initialized MCPToolBridge with connected servers

    Example:
        >>> # Auto-connect to all enabled servers
        >>> bridge = await create_mcp_bridge()
        >>> tools = bridge.get_tools_for_agent()

        >>> # Manual connection control
        >>> bridge = await create_mcp_bridge(connect_enabled=False)
        >>> await bridge.mcp_client.connect("github")
    """
    if config is None:
        config = get_default_mcp_config()

    client = MCPClient(config)

    if connect_enabled:
        # Connect to all enabled servers
        for server_name, server_config in config.servers.items():
            if server_config.enabled:
                success = await client.connect(server_name)
                if not success:
                    logger.warning(
                        f"Failed to connect to MCP server '{server_name}'. "
                        f"Tools from this server will not be available."
                    )

    bridge = MCPToolBridge(client)

    # Log summary
    connected_count = len([s for s in config.servers if client.is_connected(s)])
    tool_count = len(bridge.get_tools_for_agent())
    logger.info(
        f"MCP bridge initialized: {connected_count}/{len(config.servers)} servers, "
        f"{tool_count} tools available"
    )

    return bridge
