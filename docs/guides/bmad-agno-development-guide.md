# BMad-to-Agno Development Guide

**Version:** 1.0
**Status:** Active
**Context:** Creating agents using the BMad Builder methodology within the Agno AgentOS architecture.

---

## 1. Overview: The Hybrid Workflow

We utilize a "Hybrid Workflow" to get the best of both worlds:
1.  **Cognitive Architecture (BMad):** We use the `@.bmad/bmb` workflows to design the agent's "brain"—its persona, instructions, and logical flows. BMad excels at structuring *intent*.
2.  **Runtime Architecture (Agno):** We implement the result as Python code within the `AgentOS` framework. This ensures scalability, streaming (AG-UI), and interoperability (A2A).

### The Translation Layer
| BMad Concept | Agno Implementation |
| :--- | :--- |
| **Agent YAML (`persona`, `role`)** | `Agent(description=..., instructions=...)` |
| **Simple Agent** | Standard `Agent` instance. |
| **Expert Agent (Sidecars)** | `Agent` with `Knowledge` (Vector DB) and `Storage` (Postgres). |
| **Module Agent** | `Team` Leader or Specialized Agent in a specific `agents/module/` dir. |
| **Menu Triggers** | Registered `Tools` or A2A `Capabilities`. |
| **Workflows (`steps`, `xml`)** | `Workflow` class with `Step` definitions. |

---

## 2. Directory Structure

We strictly follow the **Modular Monolith** structure.

```text
agents/
├── registry.py                 # The dynamic loader
├── main.py                     # Entry point (FastAPI)
├── {module_name}/              # e.g., 'crm', 'marketing'
│   ├── __init__.py             # Exports the module
│   ├── agents.py               # Defines Agent instances
│   ├── workflows.py            # Defines Workflow classes
│   ├── tools.py                # Defines local Tools
│   └── tasks/                  # (Optional) YAML/Markdown prompts from BMad
```

---

## 3. Step-by-Step Creation Guide

### Phase 1: Design (Using BMad Builder)

1.  **Activate BMad Builder:**
    Run the BMad Builder agent (or simulate it mentally using the prompts).
2.  **Run `*create-agent`:**
    *   **Persona:** Let BMad help you craft the `role`, `identity`, and `style`.
    *   **Commands:** Define what the agent should do.
3.  **Result:** You will get a `.agent.yaml` file (or Markdown block). **Do not** compile this to an XML executable. Instead, use it as your **Specification**.

### Phase 2: Implementation (Agno Python)

Create a new file `agents/{module}/{agent_name}.py`.

#### A. Define the Agent
Map the BMad YAML fields to the Agno class.

**Source (BMad YAML):**
```yaml
persona:
  role: "Strategic Business Analyst"
  identity: "Senior analyst with 8+ years..."
  communication_style: "Systematic and probing."
  principles:
    - "Ground findings in evidence"
```

**Target (Agno Python):**
```python
from agno.agent import Agent
from agno.models.anthropic import Claude

analyst_agent = Agent(
    name="Analyst",
    role="Strategic Business Analyst", # From BMad 'role'
    description="Senior analyst with 8+ years experience...", # From BMad 'identity'
    instructions=[
        # From BMad 'communication_style' + 'principles'
        "Communicate in a systematic and probing manner.",
        "Ground all findings in verifiable evidence.",
        "Ensure all stakeholder voices are heard."
    ],
    model=Claude(id="claude-3-5-sonnet"),
    # ... tools and knowledge ...
)
```

#### B. Implement "Expert" Features (Memory & Knowledge)
If BMad defined an **Expert Agent** (with sidecar files like `memories.md` or `knowledge/`), implement them using Agno's storage:

1.  **Persistent Memory:**
    ```python
    from agno.storage.postgres import PostgresStorage
    
    # Enables the agent to remember user preferences across sessions
    storage = PostgresStorage(table_name="agent_sessions", db_url=DB_URL)
    agent = Agent(..., storage=storage, add_history_to_context=True)
    ```

2.  **Sidecar Knowledge (RAG):**
    If the BMad design calls for a `knowledge/` folder:
    ```python
    from agno.knowledge import AgentKnowledge
    from agno.vectordb.pgvector import PgVector
    
    # Load the specific knowledge files defined in BMad design
    knowledge_base = AgentKnowledge(
        vector_db=PgVector(table_name="agent_knowledge", db_url=DB_URL),
        num_documents=3
    )
    # Run once to ingest: knowledge_base.load_documents("agents/crm/knowledge/")
    ```

### Phase 3: Registration (A2A & Discovery)

For the agent to be visible to the system, it must be registered.

1.  **Expose in Module:**
    In `agents/{module}/__init__.py`, import your agent.
2.  **Agent Registry (Automatic):**
    Ensure your agent instance is importable. The `AgentRegistry` (which we will build next) will scan these modules.

---

## 4. Workflow Implementation

If BMad generated a workflow (e.g., `create-workflow`), translate it to an Agno `Workflow`.

**Source (BMad Instructions.md):**
```xml
<step n="1" goal="Research">
  <action>Search for competitors</action>
</step>
<step n="2" goal="Analyze">
  <action>Compare pricing models</action>
</step>
```

**Target (Agno Workflow):**
```python
from agno.workflow import Workflow

class CompetitorAnalysisWorkflow(Workflow):
    def __init__(self):
        # Define steps as methods or smaller agents
        pass

    async def run(self, company_name: str):
        # Step 1: Research
        research_data = await self.research_agent.run(f"Search competitors for {company_name}")
        
        # Step 2: Analyze
        analysis = await self.analyst_agent.run(f"Compare pricing based on: {research_data}")
        
        return analysis
```

---

## 5. Checklist for New Agents

- [ ] **Persona Extraction:** Did you copy the high-quality prompt from BMad?
- [ ] **Architecture Match:**
    - Simple? -> Standard `Agent`.
    - Expert? -> `Agent` + `PostgresStorage` + `Knowledge`.
    - Module? -> `Team` or `Workflow`.
- [ ] **Tooling:** Are the required tools (e.g., `Firecrawl`, `YFinance`) instantiated?
- [ ] **Registration:** Is it exported in the module's `__init__.py`?
- [ ] **Safety:** Are dangerous tools (file write, delete) properly scoped/gated?

---
*This guide bridges the creative power of BMB with the robust runtime of AgentOS.*
