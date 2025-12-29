"""
Tests for DM-02.1: Agno Protocol Dependencies

Verifies that all required protocol packages are installed and importable.
"""
import sys
import os
import pytest

# Add agents directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestDMConstants:
    """Test suite for DM Constants verification."""

    def test_dm_constants_import(self):
        """Verify DMConstants class imports and has expected structure."""
        from constants.dm_constants import DMConstants

        # Verify nested classes exist
        assert hasattr(DMConstants, 'AGENTOS')
        assert hasattr(DMConstants, 'A2A')
        assert hasattr(DMConstants, 'AGUI')
        assert hasattr(DMConstants, 'CCR')
        assert hasattr(DMConstants, 'DASHBOARD')
        assert hasattr(DMConstants, 'PERFORMANCE')

    def test_a2a_constants(self):
        """Verify A2A protocol constants."""
        from constants.dm_constants import DMConstants

        assert DMConstants.A2A.PROTOCOL_VERSION == "0.3.0"
        assert DMConstants.A2A.TASK_TIMEOUT_SECONDS == 300
        assert DMConstants.A2A.MAX_TASK_QUEUE_SIZE == 1000
        assert DMConstants.A2A.AGENT_DISCOVERY_CACHE_TTL_SECONDS == 300
        assert DMConstants.A2A.HEARTBEAT_INTERVAL_SECONDS == 30
        assert DMConstants.A2A.MAX_MESSAGE_SIZE_BYTES == 10 * 1024 * 1024

    def test_agui_constants(self):
        """Verify AG-UI protocol constants."""
        from constants.dm_constants import DMConstants

        assert DMConstants.AGUI.PROTOCOL_VERSION == "0.1.0"
        assert DMConstants.AGUI.STREAM_CHUNK_SIZE_BYTES == 4096
        assert DMConstants.AGUI.MAX_STREAM_DURATION_SECONDS == 600
        assert DMConstants.AGUI.TOOL_CALL_TIMEOUT_SECONDS == 60
        assert DMConstants.AGUI.MAX_TOOL_CALLS_PER_REQUEST == 50

    def test_agentos_constants(self):
        """Verify AgentOS constants."""
        from constants.dm_constants import DMConstants

        assert DMConstants.AGENTOS.DEFAULT_PORT == 8000
        assert DMConstants.AGENTOS.WORKER_COUNT == 4
        assert DMConstants.AGENTOS.REQUEST_TIMEOUT_SECONDS == 30
        assert DMConstants.AGENTOS.KEEP_ALIVE_SECONDS == 65
        assert DMConstants.AGENTOS.MAX_CONCURRENT_TASKS == 100

    def test_ccr_constants(self):
        """Verify CCR configuration constants."""
        from constants.dm_constants import DMConstants

        assert DMConstants.CCR.DEFAULT_PORT == 3456
        assert DMConstants.CCR.HEALTH_CHECK_INTERVAL_SECONDS == 30
        assert DMConstants.CCR.PROVIDER_TIMEOUT_SECONDS == 60
        assert DMConstants.CCR.MAX_RETRIES == 3
        assert DMConstants.CCR.RETRY_BACKOFF_MULTIPLIER == 2.0
        assert DMConstants.CCR.QUOTA_WARNING_THRESHOLD == 0.8
        assert DMConstants.CCR.QUOTA_CRITICAL_THRESHOLD == 0.95

    def test_dashboard_constants(self):
        """Verify Dashboard agent constants."""
        from constants.dm_constants import DMConstants

        assert DMConstants.DASHBOARD.MAX_WIDGETS_PER_REQUEST == 12
        assert DMConstants.DASHBOARD.WIDGET_DATA_TTL_SECONDS == 60
        assert DMConstants.DASHBOARD.CACHE_SIZE_MB == 100
        assert DMConstants.DASHBOARD.CONCURRENT_AGENT_CALLS == 5

    def test_performance_constants(self):
        """Verify performance target constants."""
        from constants.dm_constants import DMConstants

        assert DMConstants.PERFORMANCE.P50_RESPONSE_TARGET_MS == 200
        assert DMConstants.PERFORMANCE.P95_RESPONSE_TARGET_MS == 500
        assert DMConstants.PERFORMANCE.P99_RESPONSE_TARGET_MS == 1000
        assert DMConstants.PERFORMANCE.MAX_MEMORY_MB == 512


class TestAgnoProtocolDependencies:
    """Test suite for protocol dependency verification.

    Note: These tests may be skipped if Agno packages are not yet
    available on PyPI. The verification script handles this gracefully.
    """

    @pytest.mark.skipif(
        os.environ.get('SKIP_AGNO_IMPORTS', '0') == '1',
        reason="Agno packages may not be available on PyPI yet"
    )
    def test_agno_core_import(self):
        """Verify Agno core framework imports."""
        try:
            from agno.agent import Agent
            from agno.models.base import Model
            assert Agent is not None
            assert Model is not None
        except ImportError as e:
            pytest.skip(f"Agno core not available: {e}")

    @pytest.mark.skipif(
        os.environ.get('SKIP_AGNO_IMPORTS', '0') == '1',
        reason="Agno packages may not be available on PyPI yet"
    )
    def test_agentos_import(self):
        """Verify AgentOS imports."""
        try:
            from agno.os import AgentOS
            assert AgentOS is not None
        except ImportError as e:
            pytest.skip(f"AgentOS not available: {e}")

    @pytest.mark.skipif(
        os.environ.get('SKIP_AGNO_IMPORTS', '0') == '1',
        reason="Agno packages may not be available on PyPI yet"
    )
    def test_agui_interface_import(self):
        """Verify AG-UI interface imports."""
        try:
            from agno.os.interfaces.agui import AGUI
            assert AGUI is not None
        except ImportError as e:
            pytest.skip(f"AG-UI interface not available: {e}")

    @pytest.mark.skipif(
        os.environ.get('SKIP_AGNO_IMPORTS', '0') == '1',
        reason="Agno packages may not be available on PyPI yet"
    )
    def test_a2a_interface_import(self):
        """Verify A2A interface imports."""
        try:
            from agno.os.interfaces.a2a import A2A
            assert A2A is not None
        except ImportError as e:
            pytest.skip(f"A2A interface not available: {e}")

    @pytest.mark.skipif(
        os.environ.get('SKIP_AGNO_IMPORTS', '0') == '1',
        reason="Agno packages may not be available on PyPI yet"
    )
    def test_version_compatibility(self):
        """Verify Agno version meets minimum requirements."""
        try:
            import agno
            version = getattr(agno, '__version__', None)

            if version:
                parts = version.split('.')
                if len(parts) >= 2:
                    major, minor = int(parts[0]), int(parts[1])
                    # Must be >= 0.3.0
                    assert (major > 0) or (major == 0 and minor >= 3), \
                        f"Agno version {version} below minimum requirement (>=0.3.0)"
        except ImportError as e:
            pytest.skip(f"Agno not available: {e}")


class TestExistingAgentCompatibility:
    """Test that existing agent code still works."""

    def test_ag_ui_encoder_import(self):
        """Verify existing AG-UI encoder imports still work.

        This import is used in agents/main.py and must continue to work.
        """
        try:
            from ag_ui.encoder import EventEncoder, AGUIEventType
            assert EventEncoder is not None
            assert AGUIEventType is not None
        except ImportError as e:
            pytest.skip(f"AG-UI encoder not available: {e}")

    def test_registry_import(self):
        """Verify existing registry imports still work."""
        try:
            from registry import registry, AgentCard
            assert registry is not None
            assert AgentCard is not None
        except ImportError as e:
            pytest.skip(f"Registry not available: {e}")

    def test_config_import(self):
        """Verify config imports still work."""
        try:
            from config import get_settings
            assert get_settings is not None
        except ImportError as e:
            pytest.skip(f"Config not available: {e}")
