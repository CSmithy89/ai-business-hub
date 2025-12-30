"""
MCP Client Configuration

Configuration for Model Context Protocol server connections.
Supports environment variable resolution for secure credential handling.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.4

References:
- MCP Protocol: https://modelcontextprotocol.io
- JSON-RPC 2.0: https://www.jsonrpc.org/specification
"""
import logging
import os
import re
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Pattern for environment variable resolution: ${VAR_NAME}
ENV_VAR_PATTERN = re.compile(r"\$\{([^}]+)\}")


class MCPServerConfig(BaseModel):
    """
    Configuration for a single MCP server.

    MCP servers run as subprocesses communicating via stdio with JSON-RPC 2.0.
    Environment variables can use ${VAR} pattern for secure credential handling.

    Attributes:
        name: Unique server identifier
        command: Command to launch server (e.g., "uvx", "npx")
        args: Command arguments including package name
        env: Environment variables to pass (supports ${VAR} pattern)
        description: Human-readable description
        enabled: Whether server should be connected

    Example:
        >>> config = MCPServerConfig(
        ...     name="github",
        ...     command="uvx",
        ...     args=["mcp-server-github"],
        ...     env={"GITHUB_TOKEN": "${GITHUB_TOKEN}"},
        ...     description="GitHub API access",
        ... )
        >>> resolved = config.resolve_env()  # {"GITHUB_TOKEN": "actual_token"}
    """

    name: str = Field(..., description="Unique server identifier")
    command: str = Field(..., description="Command to launch server")
    args: List[str] = Field(default_factory=list, description="Command arguments")
    env: Dict[str, str] = Field(
        default_factory=dict,
        description="Environment variables (supports ${VAR} pattern)",
    )
    description: Optional[str] = Field(None, description="Human-readable description")
    enabled: bool = Field(default=True, description="Whether server is active")

    def resolve_env(self) -> Dict[str, str]:
        """
        Resolve environment variables from system environment.

        Expands ${VAR} patterns to actual environment values.
        Missing environment variables resolve to empty string to prevent crashes.

        Returns:
            Dict with resolved environment variable values

        Example:
            >>> import os
            >>> os.environ["TEST_TOKEN"] = "secret123"
            >>> config = MCPServerConfig(
            ...     name="test",
            ...     command="cmd",
            ...     env={"TOKEN": "${TEST_TOKEN}", "STATIC": "literal"},
            ... )
            >>> config.resolve_env()
            {'TOKEN': 'secret123', 'STATIC': 'literal'}
        """
        resolved: Dict[str, str] = {}
        for key, value in self.env.items():
            # Check for ${VAR} pattern
            match = ENV_VAR_PATTERN.fullmatch(value)
            if match:
                env_var_name = match.group(1)
                env_value = os.getenv(env_var_name, "")
                if not env_value:
                    logger.warning(
                        f"Environment variable {env_var_name} not set for MCP server {self.name}"
                    )
                resolved[key] = env_value
            else:
                # Preserve literal values
                resolved[key] = value
        return resolved


class MCPConfig(BaseModel):
    """
    Complete MCP configuration.

    Holds all MCP server configurations and global settings.

    Attributes:
        servers: Dictionary of server name to configuration
        default_timeout: Default request timeout in seconds
        max_retries: Maximum retry attempts for failed requests

    Example:
        >>> config = MCPConfig.from_dict({
        ...     "servers": {
        ...         "github": {
        ...             "command": "uvx",
        ...             "args": ["mcp-server-github"],
        ...         }
        ...     },
        ...     "default_timeout": 60,
        ... })
    """

    servers: Dict[str, MCPServerConfig] = Field(
        default_factory=dict, description="Configured MCP servers"
    )
    default_timeout: int = Field(default=30, description="Default request timeout in seconds")
    max_retries: int = Field(default=3, description="Maximum retry attempts")

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MCPConfig":
        """
        Create configuration from dictionary.

        Args:
            data: Configuration dictionary with servers, timeout, retries

        Returns:
            MCPConfig instance

        Example:
            >>> data = {
            ...     "servers": {
            ...         "github": {"command": "uvx", "args": ["mcp-server-github"]},
            ...     },
            ...     "default_timeout": 60,
            ...     "max_retries": 5,
            ... }
            >>> config = MCPConfig.from_dict(data)
            >>> config.servers["github"].command
            'uvx'
        """
        servers: Dict[str, MCPServerConfig] = {}
        for name, server_data in data.get("servers", {}).items():
            servers[name] = MCPServerConfig(name=name, **server_data)
        return cls(
            servers=servers,
            default_timeout=data.get("default_timeout", 30),
            max_retries=data.get("max_retries", 3),
        )


# Default MCP server configurations
# These are the standard servers that HYVVE supports out of the box
DEFAULT_MCP_SERVERS: Dict[str, MCPServerConfig] = {
    "github": MCPServerConfig(
        name="github",
        command="uvx",
        args=["mcp-server-github"],
        env={"GITHUB_TOKEN": "${GITHUB_TOKEN}"},
        description="GitHub repository access and management",
        enabled=True,
    ),
    "brave": MCPServerConfig(
        name="brave",
        command="uvx",
        args=["mcp-server-brave-search"],
        env={"BRAVE_API_KEY": "${BRAVE_API_KEY}"},
        description="Brave web search",
        enabled=True,
    ),
    "filesystem": MCPServerConfig(
        name="filesystem",
        command="uvx",
        args=["mcp-server-filesystem", "--allowed-directories", "/tmp/hyvve"],
        env={},
        description="Local filesystem access (sandboxed to /tmp/hyvve)",
        enabled=True,
    ),
}


def get_default_mcp_config() -> MCPConfig:
    """
    Get default MCP configuration with pre-configured servers.

    Returns MCPConfig with github, brave, and filesystem servers.

    Returns:
        MCPConfig with default server configurations

    Example:
        >>> config = get_default_mcp_config()
        >>> "github" in config.servers
        True
        >>> config.servers["github"].command
        'uvx'
    """
    return MCPConfig(servers=DEFAULT_MCP_SERVERS.copy())
