# Story DM-02.1: Agno Protocol Dependencies

**Epic:** DM-02 - Agno Multi-Interface Backend
**Points:** 2
**Status:** done
**Priority:** High (foundational)
**Dependencies:** DM-01 (Complete)

---

## Overview

Install and configure Agno protocol support packages to enable AG-UI and A2A interfaces in the AgentOS backend. This is a foundational story for Epic DM-02 - all subsequent stories depend on the protocol packages being installed and working correctly.

This story establishes the dependency foundation required for:
- AG-UI streaming protocol (frontend communication via CopilotKit)
- A2A protocol (inter-agent and external agent communication)
- Multi-interface AgentOS configuration

---

## Acceptance Criteria

- [x] **AC1:** All protocol packages installed via `pip install -e ".[dev]"` or equivalent
- [x] **AC2:** Protocol imports work without errors in Python REPL
- [x] **AC3:** Version compatibility verified with existing `agents/main.py` codebase
- [x] **AC4:** Development environment documentation updated
- [x] **AC5:** Verification script runs successfully

---

## Technical Approach

### Package Installation Strategy

The Agno framework supports optional extras for protocol support. We will install using the combined extra:

```bash
pip install "agno[agui,a2a]>=0.3.0"
```

**Alternative:** If the combined extra isn't available, install individual packages:

```bash
pip install "agno>=0.3.0" "ag-ui-protocol>=0.1.0" "a2a-sdk>=0.3.0"
```

### Required Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `agno[agui,a2a]` | >=0.3.0 | Core Agno framework with protocol extras |
| `ag-ui-protocol` | >=0.1.0 | AG-UI streaming protocol for CopilotKit |
| `a2a-sdk` | >=0.3.0 | Google A2A protocol SDK for inter-agent communication |

### Version Compatibility Requirements

- Must be compatible with existing Agno version in `agents/pyproject.toml`
- Must support Python 3.12+ (project requirement)
- Must integrate with FastAPI 0.110.x (existing framework)
- Must work with Pydantic 2.x (existing validation library)

---

## Implementation Tasks

### Task 1: Update pyproject.toml (1 point)

Update `agents/pyproject.toml` to include Agno protocol dependencies.

**File:** `agents/pyproject.toml`

**Changes:**

```toml
[project]
dependencies = [
    # Existing dependencies...

    # Agno Framework with Protocol Support
    "agno[agui,a2a]>=0.3.0",
    # OR if extras not available:
    # "agno>=0.3.0",
    # "ag-ui-protocol>=0.1.0",
    # "a2a-sdk>=0.3.0",
]
```

**Steps:**
1. Open `agents/pyproject.toml`
2. Locate the `[project.dependencies]` section
3. Add the Agno protocol dependencies
4. Ensure version constraints don't conflict with existing packages

---

### Task 2: Update requirements.txt (if exists) (0.25 points)

If the project uses `requirements.txt` alongside `pyproject.toml`, update it for consistency.

**File:** `agents/requirements.txt` (if exists)

**Changes:**

```txt
# Agno Framework with Protocol Support
agno[agui,a2a]>=0.3.0
```

---

### Task 3: Create DM Constants File (0.25 points)

Create the constants file for DM-02 that will be used throughout the epic.

**File:** `agents/constants/dm_constants.py`

```python
"""
Dynamic Module System Constants

All magic numbers for DM-02+ epics must be defined here.
Do NOT hardcode values in agent code.

Based on Epic DM-02 Technical Specification.
"""


class DMConstants:
    """Dynamic Module System constants - no magic numbers in code."""

    # AgentOS Configuration
    class AGENTOS:
        DEFAULT_PORT = 8000
        WORKER_COUNT = 4
        REQUEST_TIMEOUT_SECONDS = 30
        KEEP_ALIVE_SECONDS = 65
        MAX_CONCURRENT_TASKS = 100

    # A2A Protocol
    class A2A:
        PROTOCOL_VERSION = "0.3.0"
        TASK_TIMEOUT_SECONDS = 300
        MAX_TASK_QUEUE_SIZE = 1000
        AGENT_DISCOVERY_CACHE_TTL_SECONDS = 300
        HEARTBEAT_INTERVAL_SECONDS = 30
        MAX_MESSAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB

    # AG-UI Protocol
    class AGUI:
        PROTOCOL_VERSION = "0.1.0"
        STREAM_CHUNK_SIZE_BYTES = 4096
        MAX_STREAM_DURATION_SECONDS = 600
        TOOL_CALL_TIMEOUT_SECONDS = 60
        MAX_TOOL_CALLS_PER_REQUEST = 50

    # CCR Configuration (for DM-02.6+)
    class CCR:
        DEFAULT_PORT = 3456
        HEALTH_CHECK_INTERVAL_SECONDS = 30
        PROVIDER_TIMEOUT_SECONDS = 60
        MAX_RETRIES = 3
        RETRY_BACKOFF_MULTIPLIER = 2.0
        QUOTA_WARNING_THRESHOLD = 0.8
        QUOTA_CRITICAL_THRESHOLD = 0.95

    # Dashboard Agent (for DM-02.4+)
    class DASHBOARD:
        MAX_WIDGETS_PER_REQUEST = 12
        WIDGET_DATA_TTL_SECONDS = 60
        CACHE_SIZE_MB = 100
        CONCURRENT_AGENT_CALLS = 5

    # Performance Targets
    class PERFORMANCE:
        P50_RESPONSE_TARGET_MS = 200
        P95_RESPONSE_TARGET_MS = 500
        P99_RESPONSE_TARGET_MS = 1000
        MAX_MEMORY_MB = 512
```

**Also create the `__init__.py`:**

**File:** `agents/constants/__init__.py`

```python
"""Constants module for AgentOS."""
from .dm_constants import DMConstants

__all__ = ["DMConstants"]
```

---

### Task 4: Create Protocol Verification Script (0.5 points)

Create a verification script to validate protocol installations.

**File:** `agents/scripts/verify_protocols.py`

```python
#!/usr/bin/env python3
"""
Verify Agno Protocol Package Installation

This script validates that all required protocol packages are installed
and importable. Run this after installing dependencies to ensure the
development environment is correctly configured.

Usage:
    python agents/scripts/verify_protocols.py

Exit codes:
    0 - All imports successful
    1 - One or more imports failed
"""

import sys
from typing import Tuple, List


def verify_agno_core() -> Tuple[bool, str]:
    """Verify core Agno framework imports."""
    try:
        from agno.agent import Agent
        from agno.models.base import Model
        return True, f"agno.agent.Agent imported successfully"
    except ImportError as e:
        return False, f"Failed to import Agno core: {e}"


def verify_agentos() -> Tuple[bool, str]:
    """Verify AgentOS imports."""
    try:
        from agno.os import AgentOS
        return True, f"agno.os.AgentOS imported successfully"
    except ImportError as e:
        return False, f"Failed to import AgentOS: {e}"


def verify_agui_interface() -> Tuple[bool, str]:
    """Verify AG-UI interface imports."""
    try:
        from agno.os.interfaces.agui import AGUI
        return True, f"agno.os.interfaces.agui.AGUI imported successfully"
    except ImportError as e:
        return False, f"Failed to import AG-UI interface: {e}"


def verify_a2a_interface() -> Tuple[bool, str]:
    """Verify A2A interface imports."""
    try:
        from agno.os.interfaces.a2a import A2A
        return True, f"agno.os.interfaces.a2a.A2A imported successfully"
    except ImportError as e:
        return False, f"Failed to import A2A interface: {e}"


def verify_agui_protocol() -> Tuple[bool, str]:
    """Verify AG-UI protocol package imports."""
    try:
        from ag_ui.encoder import EventEncoder
        return True, f"ag_ui.encoder.EventEncoder imported successfully"
    except ImportError as e:
        # Try alternative import path
        try:
            import ag_ui_protocol
            return True, f"ag_ui_protocol module imported successfully"
        except ImportError:
            return False, f"Failed to import AG-UI protocol: {e}"


def verify_a2a_sdk() -> Tuple[bool, str]:
    """Verify A2A SDK imports."""
    try:
        from a2a import A2AClient
        return True, f"a2a.A2AClient imported successfully"
    except ImportError as e:
        # Try alternative import paths
        try:
            import a2a_sdk
            return True, f"a2a_sdk module imported successfully"
        except ImportError:
            return False, f"Failed to import A2A SDK: {e}"


def verify_version_compatibility() -> Tuple[bool, str]:
    """Verify version compatibility with existing codebase."""
    try:
        import agno
        version = getattr(agno, '__version__', 'unknown')

        # Check minimum version requirement
        if version != 'unknown':
            parts = version.split('.')
            if len(parts) >= 2:
                major, minor = int(parts[0]), int(parts[1])
                if major >= 0 and minor >= 3:
                    return True, f"Agno version {version} meets minimum requirement (>=0.3.0)"
                else:
                    return False, f"Agno version {version} below minimum (>=0.3.0)"

        return True, f"Agno version: {version} (version check skipped)"
    except Exception as e:
        return False, f"Failed to check Agno version: {e}"


def main():
    """Run all verification checks."""
    print("=" * 60)
    print("Agno Protocol Package Verification")
    print("=" * 60)
    print()

    checks: List[Tuple[str, callable]] = [
        ("Agno Core", verify_agno_core),
        ("AgentOS", verify_agentos),
        ("AG-UI Interface", verify_agui_interface),
        ("A2A Interface", verify_a2a_interface),
        ("AG-UI Protocol", verify_agui_protocol),
        ("A2A SDK", verify_a2a_sdk),
        ("Version Compatibility", verify_version_compatibility),
    ]

    results = []
    all_passed = True

    for name, check in checks:
        print(f"Checking {name}...")
        success, message = check()
        results.append((name, success, message))

        status = "✓ PASS" if success else "✗ FAIL"
        print(f"  {status}: {message}")

        if not success:
            all_passed = False
        print()

    print("=" * 60)
    print("Summary")
    print("=" * 60)

    passed = sum(1 for _, s, _ in results if s)
    total = len(results)

    print(f"Passed: {passed}/{total}")

    if all_passed:
        print("\n✓ All protocol imports successful!")
        print("  The development environment is ready for DM-02.")
        return 0
    else:
        print("\n✗ Some imports failed!")
        print("  Please check the error messages above and install missing packages.")
        print("\n  Try running:")
        print('    pip install "agno[agui,a2a]>=0.3.0"')
        return 1


if __name__ == "__main__":
    sys.exit(main())
```

---

### Task 5: Install Dependencies and Verify (Execution)

Execute the installation and run verification:

```bash
# Navigate to agents directory
cd agents

# Install dependencies (development mode)
pip install -e ".[dev]"

# OR using pip directly
pip install "agno[agui,a2a]>=0.3.0"

# Run verification script
python scripts/verify_protocols.py

# Verify in Python REPL
python -c "from agno.os import AgentOS; from agno.os.interfaces.agui import AGUI; from agno.os.interfaces.a2a import A2A; print('All imports successful')"
```

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `agents/constants/__init__.py` | Constants module init |
| `agents/constants/dm_constants.py` | DM module constants (no magic numbers) |
| `agents/scripts/verify_protocols.py` | Protocol installation verification script |

### Modified Files

| File | Change |
|------|--------|
| `agents/pyproject.toml` | Add `agno[agui,a2a]>=0.3.0` dependency |
| `agents/requirements.txt` | Add protocol dependencies (if file exists) |

---

## Testing Requirements

### Unit Tests

| Test Case | Description |
|-----------|-------------|
| `test_agno_core_import` | Verify `from agno.agent import Agent` works |
| `test_agentos_import` | Verify `from agno.os import AgentOS` works |
| `test_agui_interface_import` | Verify `from agno.os.interfaces.agui import AGUI` works |
| `test_a2a_interface_import` | Verify `from agno.os.interfaces.a2a import A2A` works |
| `test_protocol_imports` | Verify AG-UI and A2A protocol packages import |
| `test_dm_constants` | Verify DMConstants class loads correctly |

**Test File:** `agents/tests/test_dm_02_1_protocol_deps.py`

```python
"""
Tests for DM-02.1: Agno Protocol Dependencies

Verifies that all required protocol packages are installed and importable.
"""
import pytest


class TestAgnoProtocolDependencies:
    """Test suite for protocol dependency verification."""

    def test_agno_core_import(self):
        """Verify Agno core framework imports."""
        from agno.agent import Agent
        from agno.models.base import Model
        assert Agent is not None
        assert Model is not None

    def test_agentos_import(self):
        """Verify AgentOS imports."""
        from agno.os import AgentOS
        assert AgentOS is not None

    def test_agui_interface_import(self):
        """Verify AG-UI interface imports."""
        from agno.os.interfaces.agui import AGUI
        assert AGUI is not None

    def test_a2a_interface_import(self):
        """Verify A2A interface imports."""
        from agno.os.interfaces.a2a import A2A
        assert A2A is not None

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

        # Verify key constants
        assert DMConstants.A2A.PROTOCOL_VERSION == "0.3.0"
        assert DMConstants.AGUI.PROTOCOL_VERSION == "0.1.0"
        assert DMConstants.AGENTOS.DEFAULT_PORT == 8000

    def test_version_compatibility(self):
        """Verify Agno version meets minimum requirements."""
        import agno
        version = getattr(agno, '__version__', None)

        if version:
            parts = version.split('.')
            if len(parts) >= 2:
                major, minor = int(parts[0]), int(parts[1])
                # Must be >= 0.3.0
                assert (major > 0) or (major == 0 and minor >= 3), \
                    f"Agno version {version} below minimum requirement (>=0.3.0)"
```

### Integration Tests

| Test Case | Description |
|-----------|-------------|
| `test_existing_agents_still_work` | Verify existing agent code doesn't break |
| `test_main_py_compatibility` | Verify `agents/main.py` imports still work |

---

## Definition of Done

- [x] `agno[agui,a2a]>=0.3.0` added to `agents/pyproject.toml`
- [x] `agents/constants/dm_constants.py` created with all DM-02 constants
- [x] `agents/scripts/verify_protocols.py` created and executable
- [x] All protocol imports work in Python REPL:
  - [x] `from agno.os import AgentOS`
  - [x] `from agno.os.interfaces.agui import AGUI`
  - [x] `from agno.os.interfaces.a2a import A2A`
- [x] Verification script passes all checks
- [x] Unit tests pass (`pytest agents/tests/test_dm_02_1_protocol_deps.py`)
- [x] Existing agent code still works (no import breaks)
- [x] Version compatibility verified (>=0.3.0)
- [x] Development environment documentation updated (if needed)

---

## Technical Notes

### Version Pinning Strategy

We use minimum version constraints (`>=0.3.0`) rather than exact pins to:
1. Allow patch updates for bug fixes
2. Reduce dependency conflict issues
3. Enable compatibility with CI environments

If version conflicts arise, consider:
```toml
"agno[agui,a2a]>=0.3.0,<0.4.0"
```

### Import Path Variations

The Agno framework may have different import paths depending on version:

```python
# Standard paths (expected)
from agno.os.interfaces.agui import AGUI
from agno.os.interfaces.a2a import A2A

# Alternative paths (may vary by version)
from agno.interfaces.agui import AGUI
from agno.interfaces.a2a import A2A
```

The verification script checks multiple paths for robustness.

### Fallback Strategy

If `agno[agui,a2a]` extras are unavailable, install packages separately:

```bash
pip install agno>=0.3.0 ag-ui-protocol>=0.1.0 a2a-sdk>=0.3.0
```

### Constants Usage Pattern

All subsequent DM-02 stories MUST use constants from `DMConstants`:

```python
# CORRECT - Use constants
from constants.dm_constants import DMConstants

timeout = DMConstants.A2A.TASK_TIMEOUT_SECONDS

# INCORRECT - Magic numbers
timeout = 300  # Don't do this!
```

---

## References

- [Epic DM-02 Definition](../epics/epic-dm-02-agno-multiinterface.md)
- [Epic DM-02 Tech Spec](../epics/epic-dm-02-tech-spec.md)
- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md)
- [Agno Documentation](https://docs.agno.com)
- [A2A Protocol Spec](https://github.com/google/a2a-protocol)
- [AG-UI Protocol](https://github.com/ag-ui-protocol/ag-ui)

---

## Implementation Notes

**Implementation Date:** 2025-12-29

### Files Created

| File | Purpose |
|------|---------|
| `agents/pyproject.toml` | Full package configuration with all dependencies including `agno[agui,a2a]>=0.3.0` |
| `agents/constants/__init__.py` | Constants module init, exports `DMConstants` |
| `agents/constants/dm_constants.py` | All DM-02+ constants (no magic numbers in code) |
| `agents/scripts/verify_protocols.py` | Protocol installation verification script (executable) |
| `agents/tests/test_dm_02_1_protocol_deps.py` | Comprehensive test suite (15 tests) |

### Files Modified

| File | Change |
|------|--------|
| `agents/requirements.txt` | Updated `agno` to `agno[agui,a2a]>=0.3.0` with protocol support |

### Package Versions Installed

| Package | Version | Purpose |
|---------|---------|---------|
| `agno` | 2.3.21 | Core Agno framework (exceeds minimum 0.3.0) |
| `ag-ui-protocol` | 0.1.10 | AG-UI streaming protocol |
| `a2a-sdk` | 0.3.22 | Google A2A protocol SDK |

### Verified Import Paths

All imports verified working:
- `from agno.agent import Agent`
- `from agno.models.base import Model`
- `from agno.os import AgentOS`
- `from agno.os.interfaces.agui import AGUI`
- `from agno.os.interfaces.a2a import A2A`
- `from ag_ui.encoder import EventEncoder`
- `from a2a.client import A2AClient`

### Technical Decisions

1. **A2A SDK Import Path**: The a2a-sdk package uses `from a2a.client import A2AClient` rather than `from a2a import A2AClient`. The verification script was updated to handle this.

2. **Python Version**: The agents venv uses Python 3.13 (via uv). All packages are compatible.

3. **Package Manager**: Used `uv pip install` for venv package management (faster than pip).

4. **Test Structure**: Created comprehensive tests with 3 test classes:
   - `TestDMConstants`: 7 tests for constants validation
   - `TestAgnoProtocolDependencies`: 5 tests for Agno imports
   - `TestExistingAgentCompatibility`: 3 tests for backward compatibility

### Verification Results

```
Verification Script: 8/8 checks passed
Unit Tests: 15/15 tests passed
```

### Notes for Next Stories

- DMConstants must be imported from `constants.dm_constants` for all DM-02+ stories
- AG-UI interface: `from agno.os.interfaces.agui import AGUI`
- A2A interface: `from agno.os.interfaces.a2a import A2A`
- A2A SDK client: `from a2a.client import A2AClient`

---

*Story Created: 2025-12-29*
*Story Completed: 2025-12-29*
*Epic: DM-02 | Story: 1 of 9 | Points: 2*

---

## Code Review

**Review Date:** 2025-12-29
**Reviewer:** Claude Code (Senior Developer Review)

### Review Summary

Story DM-02.1 implementation is complete, well-structured, and production-ready. All acceptance criteria are met.

### Strengths

1. **Excellent Constants Architecture**: `DMConstants` uses clean nested class pattern eliminating magic numbers with IDE autocomplete support
2. **Robust Verification Script**: 8 checks with defensive programming, fallback import paths, graceful error handling
3. **Comprehensive Test Coverage**: 15 tests across 3 test classes covering constants, Agno imports, and backward compatibility
4. **Proper Skip Handling**: Tests use `pytest.mark.skipif` for CI environments without activated venv
5. **Clean pyproject.toml**: Modern Python packaging with setuptools>=61.0, proper dev dependencies, tool configs
6. **Consistent Documentation**: Both requirements.txt and pyproject.toml have clear comments

### Issues Found

| Issue | Severity | Description | Impact |
|-------|----------|-------------|--------|
| Type hint casing | LOW | `callable` should be `Callable` in verify_protocols.py:136 | Works at runtime, incorrect for type checking |
| Version pinning | LOW | requirements.txt uses `==` while pyproject.toml uses `>=` | Minor inconsistency, not blocking |
| Missing py.typed | INFO | Constants package lacks PEP 561 marker | Minimal - type checkers won't recognize as typed |

### Security Analysis

- ✅ No hardcoded secrets or API keys
- ✅ No shell command execution
- ✅ No file system operations beyond imports
- ✅ All dependencies are recent and maintained

### Acceptance Criteria Verification

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | ✅ PASS | pyproject.toml defines `agno[agui,a2a]>=0.3.0` |
| AC2 | ✅ PASS | All imports verified (agno 2.3.21, ag-ui-protocol 0.1.10, a2a-sdk 0.3.22) |
| AC3 | ✅ PASS | Version checks and backward compatibility tests pass |
| AC4 | ✅ PASS | Story file documents all verified import paths |
| AC5 | ✅ PASS | Verification script: 8/8 checks passed |

### Test Coverage

| Test Class | Tests | Coverage |
|------------|-------|----------|
| TestDMConstants | 7 | 100% of DMConstants |
| TestAgnoProtocolDependencies | 5 | All required imports |
| TestExistingAgentCompatibility | 3 | Key existing imports |
| **Total** | **15** | Exceeds requirements |

### Verdict

**✅ APPROVED**

The implementation provides an excellent foundation for subsequent DM-02 stories. Minor issues identified (type hint casing, version pinning inconsistency) are non-blocking and can be addressed in future iterations if desired.
