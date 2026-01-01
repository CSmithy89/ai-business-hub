"""
MCP (Model Context Protocol) Integration

Provides MCP client infrastructure for connecting HYVVE agents to external
tools via the Model Context Protocol. Enables agents to access tools from
MCP servers like GitHub, Brave Search, and filesystem.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.4

Components:
- config: Configuration models for MCP servers
- client: MCP connection and client for server communication
- a2a_bridge: Bridge for translating MCP tools to agent format

Usage:
    from mcp import create_mcp_bridge, get_default_mcp_config

    # Create bridge with default servers
    bridge = await create_mcp_bridge()
    tools = bridge.get_tools_for_agent()

    # Invoke a tool
    result = await bridge.invoke_tool("mcp_github_search_repositories", {"query": "python"})

    # Clean up
    await bridge.mcp_client.disconnect_all()

References:
- MCP Protocol: https://modelcontextprotocol.io
- JSON-RPC 2.0: https://www.jsonrpc.org/specification
"""

# Configuration
from .config import (
    DEFAULT_MCP_SERVERS,
    MCPConfig,
    MCPServerConfig,
    get_default_mcp_config,
)

# Client
from .client import (
    ConnectionResult,
    MCPClient,
    MCPConnection,
    MCPConnectionError,
    MCPProtocolError,
)

# A2A Bridge
from .a2a_bridge import (
    MCP_TOOL_PREFIX,
    MCPToolBridge,
    create_mcp_bridge,
)

__all__ = [
    # Configuration
    "MCPServerConfig",
    "MCPConfig",
    "DEFAULT_MCP_SERVERS",
    "get_default_mcp_config",
    # Client
    "ConnectionResult",
    "MCPConnection",
    "MCPClient",
    "MCPConnectionError",
    "MCPProtocolError",
    # A2A Bridge
    "MCPToolBridge",
    "create_mcp_bridge",
    "MCP_TOOL_PREFIX",
]
