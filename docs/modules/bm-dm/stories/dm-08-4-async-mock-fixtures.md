# Story DM-08-4: Async Mock Fixtures

**Epic:** DM-08 - Quality & Performance Hardening
**Status:** done
**Points:** 5
**Priority:** Medium

---

## Problem Statement

Test code duplicates async mock setup patterns, leading to inconsistent testing and maintenance burden.

## Root Cause

From tech debt analysis:
- Each test file creates its own async mocks
- No standard patterns for mocking Redis, HTTP, A2A, database
- Inconsistent mock configurations across tests

## Implementation Plan

### 1. Create Fixtures Directory

Create `agents/tests/fixtures/` with:
- `__init__.py` - Export all fixtures
- `async_mocks.py` - Generic async patterns
- `redis_mocks.py` - Redis-specific mocks
- `a2a_mocks.py` - A2A client mocks
- `database_mocks.py` - DB session mocks

### 2. Update conftest.py

Import shared fixtures for automatic availability in all tests.

## Acceptance Criteria

- [x] AC1: Fixtures directory created with reusable mocks
- [x] AC2: Redis mock with all async methods
- [x] AC3: A2A client mock with standard response patterns
- [x] AC4: Database session mock for async context managers
- [x] AC5: Fixtures documented with docstrings

---

## Implementation Notes

### Files Created

1. **`agents/tests/fixtures/__init__.py`** - Package exports all fixtures
2. **`agents/tests/fixtures/async_mocks.py`** - Generic async patterns:
   - `async_mock_factory` - Create AsyncMocks with return values/side effects
   - `async_context_manager` - Mock async context managers
   - `AsyncIteratorMock` - Mock async iterators for streaming
   - `async_iterator_factory` - Factory for async iterator mocks

3. **`agents/tests/fixtures/redis_mocks.py`** - Redis-specific mocks:
   - `mock_redis` - Full Redis client mock with all async methods
   - `mock_redis_pipeline` - Pipeline mock for atomic operations
   - `create_redis_with_data()` - Pre-populated Redis mock

4. **`agents/tests/fixtures/a2a_mocks.py`** - A2A client mocks:
   - `mock_a2a_response` - Factory for A2A JSON-RPC responses
   - `mock_a2a_client` - Full A2A client mock
   - `create_agent_card()` - Create mock AgentCard objects
   - `create_a2a_error()` - Create A2A error responses

5. **`agents/tests/fixtures/database_mocks.py`** - Database mocks:
   - `mock_db_session` - Async database session mock
   - `mock_db_transaction` - Transaction context manager mock
   - `create_mock_model()` - Create mock ORM models
   - `create_query_result()` - Create mock query results

### conftest.py Update

Updated `agents/tests/conftest.py` to register fixtures via `pytest_plugins` for automatic availability in all test modules.

---

## Review Notes

(To be filled during code review)
