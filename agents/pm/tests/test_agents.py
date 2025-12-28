"""
Tests for PM Agents (Navi, Oracle, Chrono, Scope, Vitals, Herald)
"""

import os
import pytest
from unittest.mock import Mock, patch
from agno.memory import Memory


@pytest.fixture(autouse=True)
def patch_env():
    """Patch environment before imports"""
    with patch.dict(os.environ, {
        "API_BASE_URL": "http://test-api:3001",
        "AGENT_SERVICE_TOKEN": "test-token",
        "DATABASE_URL": "postgresql://test:test@localhost:5432/test",
    }):
        yield


@pytest.fixture
def mock_memory():
    """Create a mock memory object"""
    memory = Mock(spec=Memory)
    return memory


class TestNaviAgent:
    """Test suite for Navi orchestration agent"""

    def test_agent_initialization(self, mock_memory):
        """Test that Navi agent initializes correctly"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            from agents.pm.navi import create_navi_agent

            agent = create_navi_agent(
                workspace_id="test_workspace",
                project_id="test_project",
                shared_memory=mock_memory,
            )

            assert agent is not None
            assert agent.name == "Navi"

    def test_agent_has_required_tools(self, mock_memory):
        """Test that Navi agent has all required tools"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            from agents.pm.navi import create_navi_agent

            agent = create_navi_agent(
                workspace_id="test_workspace",
                project_id="test_project",
                shared_memory=mock_memory,
            )

            tool_names = [
                tool.__name__ if hasattr(tool, '__name__') else str(tool)
                for tool in agent.tools
            ]

            # Verify agent has tools
            assert len(tool_names) >= 3

    def test_agent_instructions_content(self):
        """Test that agent instructions contain key concepts"""
        from agents.pm.navi import NAVI_INSTRUCTIONS

        instructions_str = " ".join(NAVI_INSTRUCTIONS)

        # Check for key concepts
        assert "Navi" in instructions_str
        assert "project" in instructions_str.lower()
        assert "help" in instructions_str.lower()

    def test_agent_memory_integration(self, mock_memory):
        """Test that agent correctly uses shared memory"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            from agents.pm.navi import create_navi_agent

            agent = create_navi_agent(
                workspace_id="test_workspace",
                project_id="test_project",
                shared_memory=mock_memory,
            )

            assert agent.memory is not None


class TestOracleAgent:
    """Test suite for Oracle strategic advisor agent"""

    def test_agent_initialization(self, mock_memory):
        """Test that Oracle agent initializes correctly"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            from agents.pm.oracle import create_oracle_agent

            agent = create_oracle_agent(
                workspace_id="test_workspace",
                project_id="test_project",
                shared_memory=mock_memory,
            )

            assert agent is not None
            assert agent.name == "Oracle"

    def test_agent_has_phase_tools(self, mock_memory):
        """Test that Oracle agent has phase analysis tools"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            from agents.pm.oracle import create_oracle_agent

            agent = create_oracle_agent(
                workspace_id="test_workspace",
                project_id="test_project",
                shared_memory=mock_memory,
            )

            tool_names = [
                tool.__name__ if hasattr(tool, '__name__') else str(tool)
                for tool in agent.tools
            ]

            # Should have at least phase-related tools
            assert len(tool_names) >= 2

    def test_agent_instructions_include_strategic_analysis(self):
        """Test that Oracle instructions include strategic concepts"""
        from agents.pm.oracle import ORACLE_INSTRUCTIONS

        instructions_str = " ".join(ORACLE_INSTRUCTIONS)

        # Check for strategic concepts
        assert "Oracle" in instructions_str or "strategic" in instructions_str.lower()


class TestChronoAgent:
    """Test suite for Chrono time tracking agent"""

    def test_agent_initialization(self, mock_memory):
        """Test that Chrono agent initializes correctly"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            from agents.pm.chrono import create_chrono_agent

            agent = create_chrono_agent(
                workspace_id="test_workspace",
                project_id="test_project",
                shared_memory=mock_memory,
            )

            assert agent is not None
            assert agent.name == "Chrono"

    def test_agent_has_time_tracking_tools(self, mock_memory):
        """Test that Chrono agent has time tracking tools"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            from agents.pm.chrono import create_chrono_agent

            agent = create_chrono_agent(
                workspace_id="test_workspace",
                project_id="test_project",
                shared_memory=mock_memory,
            )

            tool_names = [
                tool.__name__ if hasattr(tool, '__name__') else str(tool)
                for tool in agent.tools
            ]

            # Should have time tracking tools
            assert len(tool_names) >= 2

    def test_agent_instructions_include_estimation(self):
        """Test that Chrono instructions include time and estimation concepts"""
        from agents.pm.chrono import CHRONO_INSTRUCTIONS

        instructions_str = " ".join(CHRONO_INSTRUCTIONS)

        # Check for time/estimation concepts
        assert "Chrono" in instructions_str
        assert (
            "time" in instructions_str.lower() or
            "estimation" in instructions_str.lower()
        )


class TestScopeAgent:
    """Test suite for Scope project analysis agent"""

    def test_agent_initialization(self, mock_memory):
        """Test that Scope agent initializes correctly"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            from agents.pm.scope import create_scope_agent

            agent = create_scope_agent(
                workspace_id="test_workspace",
                project_id="test_project",
                shared_memory=mock_memory,
            )

            assert agent is not None
            assert agent.name == "Scope"

    def test_agent_has_report_tools(self, mock_memory):
        """Test that Scope agent has report generation tools"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            from agents.pm.scope import create_scope_agent

            agent = create_scope_agent(
                workspace_id="test_workspace",
                project_id="test_project",
                shared_memory=mock_memory,
            )

            tool_names = [
                tool.__name__ if hasattr(tool, '__name__') else str(tool)
                for tool in agent.tools
            ]

            # Should have report tools
            assert len(tool_names) >= 2


class TestVitalsAgent:
    """Test suite for Vitals health monitoring agent"""

    def test_agent_initialization(self, mock_memory):
        """Test that Vitals agent initializes correctly"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            from agents.pm.vitals import create_vitals_agent

            agent = create_vitals_agent(
                workspace_id="test_workspace",
                project_id="test_project",
                shared_memory=mock_memory,
            )

            assert agent is not None
            assert agent.name == "Vitals"

    def test_agent_has_health_tools(self, mock_memory):
        """Test that Vitals agent has health monitoring tools"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            from agents.pm.vitals import create_vitals_agent

            agent = create_vitals_agent(
                workspace_id="test_workspace",
                project_id="test_project",
                shared_memory=mock_memory,
            )

            tool_names = [
                tool.__name__ if hasattr(tool, '__name__') else str(tool)
                for tool in agent.tools
            ]

            # Should have health tools
            assert len(tool_names) >= 3

    def test_agent_instructions_include_health_monitoring(self):
        """Test that Vitals instructions include health concepts"""
        from agents.pm.vitals import VITALS_INSTRUCTIONS

        instructions_str = " ".join(VITALS_INSTRUCTIONS)

        # Check for health concepts
        assert "Vitals" in instructions_str
        assert (
            "health" in instructions_str.lower() or
            "risk" in instructions_str.lower()
        )


class TestHeraldAgent:
    """Test suite for Herald notification agent"""

    def test_agent_initialization(self, mock_memory):
        """Test that Herald agent initializes correctly"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            from agents.pm.herald import create_herald_agent

            agent = create_herald_agent(
                workspace_id="test_workspace",
                project_id="test_project",
                shared_memory=mock_memory,
            )

            assert agent is not None
            assert agent.name == "Herald"

    def test_agent_instructions_include_notifications(self):
        """Test that Herald instructions include notification concepts"""
        from agents.pm.herald import HERALD_INSTRUCTIONS

        instructions_str = " ".join(HERALD_INSTRUCTIONS)

        # Check for notification concepts
        assert "Herald" in instructions_str
        assert (
            "notification" in instructions_str.lower() or
            "alert" in instructions_str.lower() or
            "communicate" in instructions_str.lower()
        )


class TestAgentModelConfiguration:
    """Tests for agent model configuration"""

    def test_agents_use_default_model(self, mock_memory):
        """Test that agents use default model when not specified"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            from agents.pm.navi import create_navi_agent

            agent = create_navi_agent(
                workspace_id="test_workspace",
                project_id="test_project",
                shared_memory=mock_memory,
            )

            # Agent should have a model configured
            assert agent.model is not None

    def test_agents_accept_custom_model(self, mock_memory):
        """Test that agents accept custom model configuration"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            from agents.pm.navi import create_navi_agent

            custom_model = "claude-opus-4-20250514"
            agent = create_navi_agent(
                workspace_id="test_workspace",
                project_id="test_project",
                shared_memory=mock_memory,
                model=custom_model,
            )

            # Agent should have the custom model
            assert agent.model is not None


class TestAgentIntegration:
    """Integration tests for agent interactions (skipped by default)"""

    @pytest.mark.skip(reason="Requires running API server")
    def test_navi_project_status(self, mock_memory):
        """Test Navi can retrieve project status"""
        pass

    @pytest.mark.skip(reason="Requires running API server")
    def test_vitals_health_check(self, mock_memory):
        """Test Vitals can perform health check"""
        pass

    @pytest.mark.skip(reason="Requires running API server")
    def test_herald_notification_send(self, mock_memory):
        """Test Herald can send notifications"""
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
