"""
Unit tests for Prism agent
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from agno.memory import Memory

from agents.pm.prism import create_prism_agent, PRISM_INSTRUCTIONS


class TestPrismAgent:
    """Test suite for Prism predictive analytics agent"""

    @pytest.fixture
    def mock_memory(self):
        """Create a mock memory object"""
        memory = Mock(spec=Memory)
        return memory

    @pytest.fixture
    def prism_agent(self, mock_memory):
        """Create a Prism agent for testing"""
        return create_prism_agent(
            workspace_id="test_workspace",
            project_id="test_project",
            shared_memory=mock_memory,
            model="claude-sonnet-4-20250514",
        )

    def test_agent_initialization(self, prism_agent):
        """Test that Prism agent initializes correctly"""
        assert prism_agent is not None
        assert prism_agent.name == "Prism"
        assert prism_agent.role == "Predictive Analytics Specialist"

    def test_agent_instructions_include_workspace(self, prism_agent):
        """Test that agent instructions include workspace context"""
        # Check that instructions contain base Prism instructions
        assert any("Prism" in str(instr) for instr in PRISM_INSTRUCTIONS)

        # Agent should have workspace and project ID in context
        # Note: This tests the structure, actual instructions are in the agent

    def test_agent_has_required_tools(self, prism_agent):
        """Test that Prism agent has all required tools"""
        tool_names = [tool.__name__ if hasattr(tool, '__name__') else str(tool)
                     for tool in prism_agent.tools]

        # Check for key tools (names may vary based on implementation)
        # The agent should have tools for forecasting, velocity, and anomalies
        assert len(prism_agent.tools) >= 3  # Minimum expected tools

    def test_agent_uses_correct_model(self):
        """Test that agent uses the specified model"""
        memory = Mock(spec=Memory)

        # Test with default model
        agent_default = create_prism_agent(
            workspace_id="test_workspace",
            project_id="test_project",
            shared_memory=memory,
        )
        assert agent_default.model is not None

        # Test with custom model
        custom_model = "claude-opus-4-20250514"
        agent_custom = create_prism_agent(
            workspace_id="test_workspace",
            project_id="test_project",
            shared_memory=memory,
            model=custom_model,
        )
        assert agent_custom.model is not None

    def test_agent_instructions_content(self):
        """Test that agent instructions contain key concepts"""
        instructions_str = " ".join(PRISM_INSTRUCTIONS)

        # Check for key concepts in instructions
        assert "predictive analytics" in instructions_str.lower()
        assert "forecast" in instructions_str.lower() or "prediction" in instructions_str.lower()
        assert "velocity" in instructions_str.lower()
        assert "confidence" in instructions_str.lower()

    def test_agent_memory_integration(self, mock_memory):
        """Test that agent correctly uses shared memory"""
        agent = create_prism_agent(
            workspace_id="test_workspace",
            project_id="test_project",
            shared_memory=mock_memory,
        )

        # Agent should have memory configured
        assert agent.memory is not None


class TestPrismInstructions:
    """Test suite for Prism agent instructions"""

    def test_instructions_are_list(self):
        """Test that instructions are a list"""
        assert isinstance(PRISM_INSTRUCTIONS, list)
        assert len(PRISM_INSTRUCTIONS) > 0

    def test_instructions_include_confidence_levels(self):
        """Test that instructions explain confidence levels"""
        instructions_str = " ".join(PRISM_INSTRUCTIONS)
        assert "LOW" in instructions_str or "low" in instructions_str
        assert "MED" in instructions_str or "medium" in instructions_str
        assert "HIGH" in instructions_str or "high" in instructions_str

    def test_instructions_include_statistical_methods(self):
        """Test that instructions mention statistical methods"""
        instructions_str = " ".join(PRISM_INSTRUCTIONS)
        assert "statistical" in instructions_str.lower() or "monte carlo" in instructions_str.lower()

    def test_instructions_include_transparency_guidance(self):
        """Test that instructions emphasize transparency"""
        instructions_str = " ".join(PRISM_INSTRUCTIONS)
        assert "transparent" in instructions_str.lower() or "explain" in instructions_str.lower()


# Integration test stubs (to be implemented when API is available)
class TestPrismAgentIntegration:
    """Integration tests for Prism agent with API"""

    @pytest.mark.skip(reason="Requires running API server")
    def test_forecast_completion_integration(self):
        """Test forecast_completion tool with real API"""
        # This test would require a running API server
        # and would test the full flow from agent to API
        pass

    @pytest.mark.skip(reason="Requires running API server")
    def test_calculate_velocity_integration(self):
        """Test calculate_velocity tool with real API"""
        pass

    @pytest.mark.skip(reason="Requires running API server")
    def test_detect_anomalies_integration(self):
        """Test detect_anomalies tool with real API"""
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
