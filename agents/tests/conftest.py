"""
Pytest configuration for agents tests.

Adds the project root directory to sys.path so that both:
- `from agents.module import X` imports work (for module-level code)
- `from module import X` imports work (for relative imports)

DM-08.4: Added shared fixture imports for consistent async mocking.
"""
import sys
from pathlib import Path

# Add the project root (parent of agents/) so `from agents.X` imports work
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Also add agents root directly for backward compatibility with relative imports
agents_root = Path(__file__).parent.parent
if str(agents_root) not in sys.path:
    sys.path.insert(0, str(agents_root))

# Register shared fixtures from fixtures package
# These are automatically available in all test modules
pytest_plugins = [
    "tests.fixtures.async_mocks",
    "tests.fixtures.redis_mocks",
    "tests.fixtures.a2a_mocks",
    "tests.fixtures.database_mocks",
]
