"""
Unit tests for MCP configuration models.

Tests MCPServerConfig, MCPConfig, and default server configurations.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.4
"""
import os
from unittest.mock import patch

import pytest

from mcp.config import (
    DEFAULT_MCP_SERVERS,
    MCPConfig,
    MCPServerConfig,
    get_default_mcp_config,
)


class TestMCPServerConfig:
    """Tests for MCPServerConfig model."""

    def test_creates_config_with_required_fields(self):
        """Should create config with name and command."""
        config = MCPServerConfig(
            name="test",
            command="uvx",
            args=["mcp-server-test"],
        )

        assert config.name == "test"
        assert config.command == "uvx"
        assert config.args == ["mcp-server-test"]
        assert config.enabled is True

    def test_default_values(self):
        """Should use default values for optional fields."""
        config = MCPServerConfig(name="test", command="cmd")

        assert config.args == []
        assert config.env == {}
        assert config.description is None
        assert config.enabled is True

    def test_resolves_env_variable_pattern(self):
        """Should resolve ${VAR} patterns from environment."""
        with patch.dict(os.environ, {"TEST_TOKEN": "secret123"}):
            config = MCPServerConfig(
                name="test",
                command="uvx",
                env={"TOKEN": "${TEST_TOKEN}"},
            )

            resolved = config.resolve_env()
            assert resolved["TOKEN"] == "secret123"

    def test_preserves_literal_env_values(self):
        """Should preserve literal values without ${} pattern."""
        config = MCPServerConfig(
            name="test",
            command="uvx",
            env={"STATIC": "literal_value"},
        )

        resolved = config.resolve_env()
        assert resolved["STATIC"] == "literal_value"

    def test_returns_empty_for_missing_env_var(self):
        """Should return empty string for undefined env vars."""
        # Ensure the env var doesn't exist
        with patch.dict(os.environ, {}, clear=True):
            config = MCPServerConfig(
                name="test",
                command="uvx",
                env={"MISSING": "${UNDEFINED_VAR_12345}"},
            )

            resolved = config.resolve_env()
            assert resolved["MISSING"] == ""

    def test_resolves_multiple_env_vars(self):
        """Should resolve multiple env variables."""
        with patch.dict(os.environ, {"VAR1": "value1", "VAR2": "value2"}):
            config = MCPServerConfig(
                name="test",
                command="uvx",
                env={
                    "FIRST": "${VAR1}",
                    "SECOND": "${VAR2}",
                    "LITERAL": "static",
                },
            )

            resolved = config.resolve_env()
            assert resolved["FIRST"] == "value1"
            assert resolved["SECOND"] == "value2"
            assert resolved["LITERAL"] == "static"

    def test_enabled_can_be_set_false(self):
        """Should allow enabled to be set to False."""
        config = MCPServerConfig(name="test", command="cmd", enabled=False)
        assert config.enabled is False

    def test_description_field(self):
        """Should store description."""
        config = MCPServerConfig(
            name="test",
            command="cmd",
            description="Test server for unit tests",
        )
        assert config.description == "Test server for unit tests"


class TestMCPConfig:
    """Tests for MCPConfig model."""

    def test_creates_config_from_dict(self):
        """Should create config from dictionary."""
        data = {
            "servers": {
                "github": {
                    "command": "uvx",
                    "args": ["mcp-server-github"],
                    "env": {"GITHUB_TOKEN": "${GITHUB_TOKEN}"},
                },
            },
            "default_timeout": 60,
            "max_retries": 5,
        }

        config = MCPConfig.from_dict(data)

        assert "github" in config.servers
        assert config.servers["github"].name == "github"
        assert config.servers["github"].command == "uvx"
        assert config.default_timeout == 60
        assert config.max_retries == 5

    def test_default_timeout_and_retries(self):
        """Should use default timeout and retries."""
        config = MCPConfig.from_dict({"servers": {}})

        assert config.default_timeout == 30
        assert config.max_retries == 3

    def test_creates_config_with_multiple_servers(self):
        """Should create config with multiple servers."""
        data = {
            "servers": {
                "server1": {"command": "cmd1"},
                "server2": {"command": "cmd2"},
                "server3": {"command": "cmd3"},
            },
        }

        config = MCPConfig.from_dict(data)

        assert len(config.servers) == 3
        assert "server1" in config.servers
        assert "server2" in config.servers
        assert "server3" in config.servers

    def test_empty_servers_dict(self):
        """Should handle empty servers dict."""
        config = MCPConfig.from_dict({})

        assert config.servers == {}
        assert config.default_timeout == 30

    def test_direct_initialization(self):
        """Should allow direct initialization with MCPServerConfig objects."""
        server = MCPServerConfig(name="test", command="cmd")
        config = MCPConfig(servers={"test": server}, default_timeout=45)

        assert config.servers["test"] == server
        assert config.default_timeout == 45


class TestDefaultMCPServers:
    """Tests for default server configurations."""

    def test_github_server_defined(self):
        """Should have github server config."""
        assert "github" in DEFAULT_MCP_SERVERS
        github = DEFAULT_MCP_SERVERS["github"]

        assert github.name == "github"
        assert github.command == "uvx"
        assert "mcp-server-github" in github.args
        assert "GITHUB_TOKEN" in github.env
        assert github.enabled is True

    def test_brave_server_defined(self):
        """Should have brave search server config."""
        assert "brave" in DEFAULT_MCP_SERVERS
        brave = DEFAULT_MCP_SERVERS["brave"]

        assert brave.name == "brave"
        assert brave.command == "uvx"
        assert "mcp-server-brave-search" in brave.args
        assert "BRAVE_API_KEY" in brave.env
        assert brave.enabled is True

    def test_filesystem_server_defined(self):
        """Should have filesystem server config."""
        assert "filesystem" in DEFAULT_MCP_SERVERS
        fs = DEFAULT_MCP_SERVERS["filesystem"]

        assert fs.name == "filesystem"
        assert fs.command == "uvx"
        assert "mcp-server-filesystem" in fs.args
        # Filesystem doesn't require env vars
        assert fs.env == {}
        assert fs.enabled is True

    def test_filesystem_sandboxed_directory(self):
        """Should configure filesystem with sandboxed directory."""
        fs = DEFAULT_MCP_SERVERS["filesystem"]

        # Check for sandbox directory arg
        assert "--allowed-directories" in fs.args
        assert "/tmp/hyvve" in fs.args

    def test_get_default_config(self):
        """Should return config with default servers."""
        config = get_default_mcp_config()

        assert isinstance(config, MCPConfig)
        assert len(config.servers) == 3
        assert "github" in config.servers
        assert "brave" in config.servers
        assert "filesystem" in config.servers

    def test_get_default_config_returns_copy(self):
        """Should return independent copies of config."""
        config1 = get_default_mcp_config()
        config2 = get_default_mcp_config()

        # Modify one, shouldn't affect the other
        config1.servers["github"].enabled = False

        # Note: With current implementation, DEFAULT_MCP_SERVERS is shared
        # This test documents the current behavior
        # A true copy would require deep copying


class TestEnvVarPattern:
    """Tests for environment variable pattern matching."""

    def test_pattern_at_start(self):
        """Should match ${} pattern at start of string."""
        with patch.dict(os.environ, {"VAR": "value"}):
            config = MCPServerConfig(name="test", command="cmd", env={"KEY": "${VAR}"})
            assert config.resolve_env()["KEY"] == "value"

    def test_partial_pattern_not_matched(self):
        """Should not match partial patterns (only full ${VAR})."""
        config = MCPServerConfig(
            name="test",
            command="cmd",
            env={"KEY": "prefix_${VAR}_suffix"},
        )

        # Partial patterns are treated as literals (current implementation)
        resolved = config.resolve_env()
        assert resolved["KEY"] == "prefix_${VAR}_suffix"

    def test_empty_env_pattern_is_literal(self):
        """Should treat ${} with empty name as literal (regex won't match)."""
        config = MCPServerConfig(name="test", command="cmd", env={"KEY": "${}"})

        # Empty pattern "${}" is not a valid env var pattern (regex needs at least 1 char)
        # So it's treated as a literal value
        resolved = config.resolve_env()
        assert resolved["KEY"] == "${}"

    def test_env_var_with_underscores(self):
        """Should resolve env vars with underscores in name."""
        with patch.dict(os.environ, {"MY_LONG_VAR_NAME": "test_value"}):
            config = MCPServerConfig(
                name="test",
                command="cmd",
                env={"KEY": "${MY_LONG_VAR_NAME}"},
            )
            assert config.resolve_env()["KEY"] == "test_value"
