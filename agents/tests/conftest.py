"""
Pytest configuration for agents tests.

Adds the agents root directory to sys.path so that modules
can be imported without package installation.
"""
import sys
from pathlib import Path

# Add the agents root to path so imports work
agents_root = Path(__file__).parent.parent
if str(agents_root) not in sys.path:
    sys.path.insert(0, str(agents_root))
