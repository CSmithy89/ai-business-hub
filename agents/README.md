# Agents - Python AgentOS

Python-based agent system using the Agno framework for AI Business Hub.

## Quick Start

```bash
cd agents
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## Project Structure

```
agents/
├── main.py              # FastAPI entry point
├── __init__.py          # Package marker (required for imports)
├── gateway/             # Dashboard Gateway agent
├── models/              # CCR provider and task classifier
├── services/            # CCR health and usage services
├── schemas/             # Pydantic models for state
├── a2a/                 # A2A client implementation
├── hitl/                # Human-in-the-Loop decorators
├── context/             # Context consumption utilities
├── mcp/                 # MCP client and A2A bridge
├── mesh/                # Universal Agent Mesh
├── rag/                 # RAG context indexing
├── constants/           # DM_CONSTANTS and other constants
├── core_platform/       # Platform orchestration agents
├── pm/                  # Project Management agents (Navi, Sage, Chrono)
├── knowledge/           # Knowledge Base agents (Scribe)
├── crm/                 # CRM module agents
├── branding/            # Brand module agents
├── planning/            # Planning module agents
├── validation/          # Validation agents
└── tests/               # Test suite
```

## Import Style Guide

**IMPORTANT:** Use the `agents.` prefix for all imports.

### Preferred Import Pattern

```python
# CORRECT - Always use the agents. prefix
from agents.gateway.agent import DashboardAgent
from agents.models.ccr_provider import CCRModel
from agents.services.ccr_health import CCRHealthService
from agents.constants.dm_constants import DM_CONSTANTS
```

### Avoid Relative Imports

```python
# AVOID - Don't use relative imports for cross-module references
from ..models.ccr_provider import CCRModel  # Not recommended
from models.ccr_provider import CCRModel     # Won't work consistently
```

### Why This Matters

The test configuration adds both the project root and `agents/` directory to `sys.path`. This enables two import patterns:
- `from agents.module import X` (preferred)
- `from module import X` (works but inconsistent)

Using the `agents.` prefix ensures:
1. Consistent imports across all files
2. Clear module boundaries
3. IDE autocomplete works correctly
4. No ambiguity about import sources

### Test Imports

Tests should also use the `agents.` prefix:

```python
# In agents/tests/test_example.py
from agents.gateway.agent import DashboardAgent
from agents.services.ccr_health import CCRHealthService
```

## Testing

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_rate_limit.py

# Run with coverage
pytest --cov=agents
```

### Test Configuration

The `tests/conftest.py` configures:
- Project root in `sys.path` for `from agents.X` imports
- Shared fixtures for common test patterns

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CCR_ENDPOINT` | Claude Code Router endpoint | `http://localhost:8080` |
| `CCR_API_KEY` | CCR authentication key | - |
| `AGUI_PORT` | AG-UI interface port | `8000` |
| `A2A_PORT` | A2A interface port | `8001` |

## Related Documentation

- [Dynamic Module System](../docs/modules/bm-dm/README.md)
- [Architecture](../docs/architecture/dynamic-module-system.md)
- [CCR Patterns](../docs/architecture/remote-coding-agent-patterns.md)
