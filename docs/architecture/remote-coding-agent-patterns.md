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

*Refined from Remote Coding Agent documentation.*