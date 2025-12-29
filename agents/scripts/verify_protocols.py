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
        return True, "agno.agent.Agent imported successfully"
    except ImportError as e:
        return False, f"Failed to import Agno core: {e}"


def verify_agentos() -> Tuple[bool, str]:
    """Verify AgentOS imports."""
    try:
        from agno.os import AgentOS
        return True, "agno.os.AgentOS imported successfully"
    except ImportError as e:
        return False, f"Failed to import AgentOS: {e}"


def verify_agui_interface() -> Tuple[bool, str]:
    """Verify AG-UI interface imports."""
    try:
        from agno.os.interfaces.agui import AGUI
        return True, "agno.os.interfaces.agui.AGUI imported successfully"
    except ImportError as e:
        return False, f"Failed to import AG-UI interface: {e}"


def verify_a2a_interface() -> Tuple[bool, str]:
    """Verify A2A interface imports."""
    try:
        from agno.os.interfaces.a2a import A2A
        return True, "agno.os.interfaces.a2a.A2A imported successfully"
    except ImportError as e:
        return False, f"Failed to import A2A interface: {e}"


def verify_agui_protocol() -> Tuple[bool, str]:
    """Verify AG-UI protocol package imports."""
    try:
        from ag_ui.encoder import EventEncoder
        return True, "ag_ui.encoder.EventEncoder imported successfully"
    except ImportError as e:
        # Try alternative import path
        try:
            import ag_ui_protocol
            return True, "ag_ui_protocol module imported successfully"
        except ImportError:
            return False, f"Failed to import AG-UI protocol: {e}"


def verify_a2a_sdk() -> Tuple[bool, str]:
    """Verify A2A SDK imports."""
    try:
        # Primary import path for a2a-sdk
        from a2a.client import A2AClient
        return True, "a2a.client.A2AClient imported successfully"
    except ImportError as e1:
        # Try alternative import paths
        try:
            from a2a import A2AClient
            return True, "a2a.A2AClient imported successfully"
        except ImportError:
            try:
                import a2a_sdk
                return True, "a2a_sdk module imported successfully"
            except ImportError:
                return False, f"Failed to import A2A SDK: {e1}"


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


def verify_dm_constants() -> Tuple[bool, str]:
    """Verify DMConstants can be imported."""
    try:
        # Add parent directory to path for import
        import os
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from constants.dm_constants import DMConstants

        # Verify key constants exist
        assert DMConstants.A2A.PROTOCOL_VERSION == "0.3.0"
        assert DMConstants.AGUI.PROTOCOL_VERSION == "0.1.0"
        assert DMConstants.AGENTOS.DEFAULT_PORT == 8000
        return True, "DMConstants imported and validated successfully"
    except Exception as e:
        return False, f"Failed to import DMConstants: {e}"


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
        ("DM Constants", verify_dm_constants),
    ]

    results = []
    all_passed = True

    for name, check in checks:
        print(f"Checking {name}...")
        success, message = check()
        results.append((name, success, message))

        status = "PASS" if success else "FAIL"
        print(f"  [{status}]: {message}")

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
        print("\nAll protocol imports successful!")
        print("  The development environment is ready for DM-02.")
        return 0
    else:
        print("\nSome imports failed!")
        print("  Please check the error messages above and install missing packages.")
        print("\n  Try running:")
        print('    pip install "agno[agui,a2a]>=0.3.0"')
        return 1


if __name__ == "__main__":
    sys.exit(main())
