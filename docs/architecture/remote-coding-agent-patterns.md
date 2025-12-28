# Remote Coding Agent Patterns & SDK Insights

**Status:** Updated for Agno Integration
**Context:** Insights derived from `claude-code` and `codex` SDK patterns to be applied to the HYVVE AgentOS architecture.

---

## 1. Core Abstractions

Remote coding agents rely on a specific set of primitives to operate effectively. These patterns should be mirrored in our **AgentOS** implementation.

### 1.1 The "Assistant Client" Interface
Both Claude and Codex use a consistent interface for the "brain". We must adapt this for Agno.

**Pattern:**
```typescript
interface IAssistantClient {
  sendQuery(prompt: string, context: Context): AsyncGenerator<MessageChunk>;
}
```

**Agno Adaptation:**
Our `Agent` class in Python effectively implements this. We should ensure our `Agent` wrappers exposed via **A2A** conform to a similar strict interface:

```python
class AgentInterface:
    async def run(self, task: str, context: Dict) -> AsyncGenerator[AgentEvent, None]:
        """Core execution loop matching the SDK pattern"""
        pass
```

### 1.2 Tool Execution Sandbox
Remote agents emphasize safety. Tools like `Bash`, `Edit`, and `Glob` run in a controlled scope.

**Insight:**
*   **Claude Code:** Uses a "Permission Mode" (Read/Write/Execute).
*   **Application:** Our **MCP** servers must implement similar permission flags.
    *   `readonly=True` for inspection agents.
    *   `approved_directories=["/src"]` for file system tools.

---

## 2. Streaming Patterns

The "Streaming-First" principle is critical for UX.

### 2.1 Chunk Types
We should standardize the chunks emitted by our **AG-UI** `EventEncoder` based on these SDKs:

| SDK Event | AG-UI Equivalent | Description |
|-----------|------------------|-------------|
| `agent_message` | `TEXT_MESSAGE_CHUNK` | Standard tokens. |
| `reasoning` | `THOUGHT_CHUNK` (New) | Internal monologue/Chain of Thought. |
| `command_execution` | `TOOL_CALL_START` | Indication of action. |
| `result` | `TOOL_CALL_RESULT` | Output of the action. |
| `error` | `ERROR` | Failures. |

**Action Item:** Update `EventEncoder` to support a `THOUGHT_CHUNK` if we use reasoning models (like `o1` or `claude-3.5-sonnet` with thinking enabled).

---

## 3. Session & Persistence

### 3.1 Resumable Sessions
The "Remote Agent" docs highlight the need for sessions that survive container restarts.

**Agno Strategy:**
*   **Database:** `AgentSession` table in Postgres.
*   **Resume Logic:**
    1.  Frontend sends `session_id`.
    2.  AgentOS loads `AgentSession` (memory + state) from Postgres.
    3.  Hydrates the `Agent` instance.
    4.  Continues execution.

**Code Snippet (Agno):**
```python
# agents/registry.py pattern
async def get_or_create_agent(session_id: str, db: Storage) -> Agent:
    session_data = await db.get_session(session_id)
    agent = Agent(..., memory=session_data.memory)
    return agent
```

---

## 4. Tool Use Patterns

### 4.1 "Strict" vs "Flexible" Tools
Codex allows "flexible" tool use, while others require "strict" schemas.

**Application:**
*   For **Core Business Logic** (e.g., `create_invoice`), use strict Pydantic models in Agno tools.
*   For **Exploration** (e.g., `search_web`), allow flexible string inputs.

### 4.2 Formatting Tool Output
The SDKs emphasize formatting tool output for the *model's* consumption.

**Insight:**
*   Don't just return raw JSON if it's huge.
*   Truncate or summarize large outputs (like file reads) before feeding back to context.
*   Agno's `Function` class `post_hook` is the perfect place for this.

```python
# agents/tools/hooks.py
def truncate_output_hook(result: Any) -> str:
    s_result = str(result)
    if len(s_result) > 5000:
        return s_result[:5000] + "... [truncated]"
    return s_result
```

---

## 5. Error Recovery

**Pattern:**
When a tool fails (e.g., `FileNotFound`), the agent should observe the error and retry or ask for clarification, rather than crashing the session.

**Agno Implementation:**
*   Ensure `Agent` handles tool exceptions internally and feeds the error message back as a `ToolMessage` with `status="error"`.
*   This allows the LLM to self-correct ("Oh, I made a typo in the filename").

---

## 6. Authentication & Security

**Key Takeaway:**
Never pass API keys in plain text.

*   **SDK Pattern:** Encrypted storage or Env Vars.
*   **AgentOS Plan:** The **Secrets Manager** (planned in `docs/archive/foundation-phase/detailed-implementation-plan.md`) must encrypt keys at rest in the DB using a master key (e.g., `OS_SECURITY_KEY` or a dedicated `ENCRYPTION_KEY`).

---

## 7. Model Routing Layer (CCR Integration)

### 7.1 Overview

For platform-provided AI access, HYVVE supports **Claude Code Router (CCR)** as an optional routing layer between AgentOS and model providers. CCR enables intelligent task-based routing, fallback chains, and cost optimization.

**Architecture with CCR:**
```
Frontend (CopilotKit)
        ↓ AG-UI
AgentOS (Agno)
        ↓
CCR (Claude Code Router)  ← NEW LAYER
        ↓
CLI Subscriptions OR API Providers
```

### 7.2 CCR Features

| Feature | Description |
|---------|-------------|
| **Task-Based Routing** | Routes requests based on task type (reasoning, code, long-context) |
| **Fallback Chains** | Automatic failover to alternative providers |
| **Cost Optimization** | Cheap models for simple tasks, powerful models for complex |
| **BMAD Awareness** | Detects `.bmad/` agent structure for per-agent routing |
| **Transformer Support** | Request/response transformation for provider compatibility |

### 7.3 Hybrid Model Support

HYVVE supports both user-provided API keys (BYOAI) and platform subscriptions via CCR:

| Mode | Provider Source | Use Case |
|------|-----------------|----------|
| **BYOAI** | User's own API keys | Power users, enterprise, unlimited usage |
| **CCR** | Platform CLI subscriptions | Free tier, quick start, cost-controlled |
| **Hybrid** | Both available | User chooses per-agent or per-task |

### 7.4 CCR Configuration

CCR uses `~/.claude-code-router/config.json` for routing rules:

```json
{
  "providers": {
    "claude": { "base_url": "subscription", "type": "claude-cli" },
    "deepseek": { "base_url": "https://api.deepseek.com", "api_key": "$DEEPSEEK_KEY" },
    "gemini": { "base_url": "subscription", "type": "gemini-cli" }
  },
  "routing": {
    "reasoning": "claude",
    "code_generation": "deepseek",
    "long_context": "gemini",
    "default": "claude"
  },
  "fallbacks": {
    "claude": ["deepseek", "gemini"],
    "deepseek": ["claude", "gemini"]
  }
}
```

### 7.5 Agno Integration

```python
from agno.models.openai import OpenAIChat

def get_model(user_config: BYOAIConfig):
    """Hybrid model selection - CCR or BYOAI"""
    if user_config.use_platform_subscription:
        # Route through CCR
        return OpenAIChat(
            id="auto",  # CCR decides
            base_url="http://localhost:3456/v1",
            api_key="ccr-platform"
        )
    else:
        # User's own API keys (BYOAI)
        return get_byoai_model(user_config)
```

### 7.6 Per-Agent Model Assignment

Users can configure which model/provider each agent uses:

```python
# Agent-specific model configuration
agent_model_config = {
    "navi": {"provider": "claude", "model": "claude-3-5-sonnet"},
    "sage": {"provider": "deepseek", "model": "deepseek-coder"},
    "pulse": {"provider": "gemini", "model": "gemini-2.0-flash"},
}
```

This configuration is stored in user preferences and exposed via the Settings UI.

### 7.7 Usage Monitoring & Alerts

CCR integration includes usage tracking and quota notifications:

- **Usage Tracking**: Monitor API calls per provider
- **Quota Alerts**: Notify when subscription limits approach
- **Cost Dashboard**: Visualize spending across providers
- **Fallback Events**: Log when fallbacks are triggered

---

## 8. Agent-Model UI Configuration

### 8.1 Settings Interface

Users configure agent-model mappings via `/settings/ai-config`:

- **Global Default**: Default provider for all agents
- **Per-Agent Override**: Specific model for each agent type
- **Task-Type Routing**: Route by task complexity (if CCR enabled)
- **Fallback Order**: Priority list for failover

### 8.2 UI Components

| Component | Purpose |
|-----------|---------|
| `AgentModelSelector` | Dropdown to assign model to agent |
| `ProviderStatus` | Health/quota status per provider |
| `UsageChart` | Visualization of API usage |
| `FallbackConfig` | Configure failover chains |

---

*Refined from Remote Coding Agent documentation and CCR integration patterns.*