# Story DM-02.6: CCR Installation & Configuration

**Epic:** DM-02 - Agno Multi-Interface Backend
**Points:** 5
**Status:** done
**Priority:** High (CCR integration foundation)
**Dependencies:** DM-02.5 (Complete - Existing Agent Protocol Updates)

---

## Overview

Install and configure Claude Code Router (CCR) for intelligent model routing in the HYVVE platform. CCR provides provider abstraction, intelligent routing based on task type, and automatic fallback chains when providers are unavailable.

CCR is a node-based service that provides OpenAI-compatible API endpoints, allowing Agno agents to route requests to the optimal provider (Claude CLI, DeepSeek, Gemini, OpenRouter) based on task characteristics.

**Key Deliverables:**
- CCR setup documentation in `docs/guides/ccr-setup.md`
- CCR configuration template in `agents/config/ccr_config_template.json`
- CCR health check service in `agents/services/ccr_health.py`
- CCR-related settings in `agents/config.py`
- Unit tests for health checker

---

## Acceptance Criteria

1. **AC1:** CCR setup documentation exists with installation steps, prerequisites, and configuration examples
2. **AC2:** CCR configuration template provides provider configs for Claude, DeepSeek, Gemini, OpenRouter
3. **AC3:** CCR health checker service monitors CCR availability with graceful error handling
4. **AC4:** Settings class includes CCR-related configuration options (CCR_ENABLED, CCR_URL, CCR_HEALTH_CHECK_INTERVAL)
5. **AC5:** Health checker uses DMConstants (no magic numbers)
6. **AC6:** Unit tests verify health checker handles connection errors gracefully

---

## Technical Notes

### CCR Architecture
- CCR runs as a separate Node.js service (default port 3456)
- Provides OpenAI-compatible `/v1/chat/completions` endpoint
- Routes to appropriate provider based on request metadata
- Implements fallback chains for resilience

### Provider Types
- `claude-cli`: Uses Claude subscription via CLI
- `gemini-cli`: Uses Gemini subscription via CLI
- `openai-compatible`: Standard OpenAI API format (DeepSeek, OpenRouter)

### Health Check Pattern
- Background service monitors CCR health periodically
- Singleton pattern for shared health state
- Graceful degradation when CCR unavailable

---

## Implementation Tasks

### Task 1: Create CCR Setup Documentation
**File:** `docs/guides/ccr-setup.md`
- Prerequisites section (Node.js 20+, CLI subscriptions)
- Installation steps (clone, install, configure)
- Configuration file structure explanation
- Provider configuration examples
- Starting/stopping CCR service
- Troubleshooting section

### Task 2: Create CCR Configuration Template
**File:** `agents/config/ccr_config_template.json`
- Provider configurations for Claude, DeepSeek, Gemini, OpenRouter
- Task-based routing rules (reasoning, code_generation, long_context)
- Fallback chain definitions
- Health check settings

### Task 3: Create CCR Health Check Service
**File:** `agents/services/ccr_health.py`
- CCRHealthChecker class with async health checking
- Uses DMConstants.CCR.DEFAULT_PORT and other constants
- Graceful error handling for unreachable service
- Singleton instance for shared state

### Task 4: Add CCR Settings to Config
**File:** `agents/config.py`
- Add ccr_enabled, ccr_url, ccr_health_check_interval fields
- Environment variable bindings

### Task 5: Create Unit Tests
**File:** `agents/tests/test_dm_02_6_ccr_health.py`
- Test health checker initialization
- Test successful health check response
- Test handling of connection errors
- Test DMConstants usage

### Task 6: Update DMConstants
**File:** `agents/constants/dm_constants.py`
- Add CCR inner class with constants

---

## Definition of Done

- [x] CCR setup documentation complete with all sections
- [x] Configuration template covers all providers and routing rules
- [x] Health checker service handles all error cases gracefully
- [x] Config settings added with proper environment variable bindings
- [x] Unit tests pass with coverage for error scenarios
- [x] All code uses DMConstants (no magic numbers)
- [x] Sprint status updated to "done"
