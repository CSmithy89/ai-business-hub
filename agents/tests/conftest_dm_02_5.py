"""
pytest conftest for DM-02.5 tests.

Sets up mocking for anthropic module to avoid import errors.
"""

import sys
from unittest.mock import MagicMock

# Mock anthropic module and submodules before any imports
# This is necessary because agno.models.anthropic imports anthropic
anthropic_mock = MagicMock()
anthropic_mock.types = MagicMock()
anthropic_mock.lib = MagicMock()
anthropic_mock.lib.streaming = MagicMock()
anthropic_mock.lib.streaming._beta_types = MagicMock()

sys.modules["anthropic"] = anthropic_mock
sys.modules["anthropic.types"] = anthropic_mock.types
sys.modules["anthropic.lib"] = anthropic_mock.lib
sys.modules["anthropic.lib.streaming"] = anthropic_mock.lib.streaming
sys.modules["anthropic.lib.streaming._beta_types"] = anthropic_mock.lib.streaming._beta_types
