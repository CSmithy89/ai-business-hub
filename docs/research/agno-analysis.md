# Agno Framework Analysis

**Analyzed:** 2025-11-29
**Documentation Version:** v1.5.x (latest stable)
**Repository:** https://github.com/agno-agi/agno
**Documentation:** https://docs.agno.com/
**Analyst:** Winston (Architect) + Multi-agent Research Session

---

## Executive Summary

Agno provides a comprehensive multi-agent orchestration framework that aligns well with AI Business Hub's requirements from MASTER-PLAN.md. Key findings:

1. **Agent Definition** is straightforward via Python classes with declarative configuration
2. **Team Orchestration** uses a leader-based delegation model with member specialization
3. **Human-in-the-Loop** is natively supported via tool confirmation and user input mechanisms
4. **Workflow System** provides deterministic multi-step orchestration with conditionals and parallelism
5. **Memory/Context** offers flexible persistence options (PostgreSQL, SQLite, MongoDB)

The framework's patterns can be directly mapped to our BMAD agent team structure.

---

## 1. Agent Definition Patterns

### Agent Structure

```python
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.models.anthropic import Claude
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.db.postgres import PostgresDb
from pydantic import BaseModel, Field

# Structured output schema
class ResearchOutput(BaseModel):
    """Structured output for research findings."""
    summary: str = Field(description="Executive summary of findings")
    key_points: list[str] = Field(description="Key takeaways")
    sources: list[str] = Field(description="Source URLs")
    confidence: float = Field(description="Confidence score 0-1")

# Agent definition
research_agent = Agent(
    name="Research Agent",
    model=OpenAIChat(id="gpt-4o"),  # or Claude(id="claude-sonnet-4-5-20250929")
    tools=[DuckDuckGoTools()],
    instructions=[
        "You are an expert market researcher.",
        "Always cite your sources.",
        "Focus on actionable insights.",
    ],
    output_schema=ResearchOutput,  # Structured responses
    db=PostgresDb(db_url="postgresql+psycopg://ai:ai@localhost:5532/ai"),
    add_history_to_context=True,
    num_history_runs=3,
    enable_user_memories=True,
    enable_agentic_memory=True,  # Agent controls memory management
    reasoning=True,  # Enable extended thinking
    markdown=True,  # Format responses as markdown
)
```

### Key Configuration Options

| Parameter | Purpose | AI Business Hub Use |
|-----------|---------|---------------------|
| `name` | Agent identifier | BMAD agent names (e.g., "Strategy Agent") |
| `model` | LLM provider | BYOAI model selection |
| `tools` | Available functions | CRM tools, marketing tools, etc. |
| `instructions` | System prompt | Agent persona from MASTER-PLAN.md |
| `output_schema` | Structured output | Typed agent responses |
| `db` | Persistence layer | PostgreSQL for multi-tenant |
| `reasoning` | Extended thinking | Complex strategy decisions |
| `enable_agentic_memory` | Memory control | Agent-managed context |

### Model Provider Abstraction

Agno supports 40+ model providers through a unified interface:

```python
from agno.models.openai import OpenAIChat
from agno.models.anthropic import Claude
from agno.models.google import Gemini
from agno.models.mistral import MistralChat
from agno.models.ollama import Ollama

# All use the same agent interface
agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    # OR model=Claude(id="claude-sonnet-4-5-20250929"),
    # OR model=Gemini(id="gemini-2.0-flash"),
    # OR model=Ollama(id="llama3"),
    ...
)
```

### Mapping to AI Business Hub Agents

| Our Agent (MASTER-PLAN.md) | Agno Config | Model | Tools |
|---------------------------|-------------|-------|-------|
| Strategy Agent | `name="Strategy Agent"` | Claude Opus 4 | `[MarketResearch, CompetitorAnalysis]` |
| Content Agent | `name="Content Agent"` | GPT-4o | `[WriteContent, SEOAnalysis]` |
| Research Agent | `name="Research Agent"` | Claude Sonnet | `[DuckDuckGoTools, WebScraper]` |
| Analysis Agent | `name="Analysis Agent"` | GPT-4o | `[DataAnalysis, ChartGenerator]` |
| Execution Agent | `name="Execution Agent"` | Claude Haiku | `[TaskRunner, Scheduler]` |

### Adoption Recommendation
- [x] **Adopt as-is** - Agent definition pattern is clean and extensible

---

## 2. Team Orchestration

### Team Definition

```python
from agno.team.team import Team
from agno.models.openai import OpenAIChat
from agno.db.postgres import PostgresDb

# Create specialized agents first
research_agent = Agent(
    name="Research Agent",
    role="Conducts market and competitor research",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools(), WebScraperTools()],
    instructions=["Research thoroughly", "Cite all sources"],
)

strategy_agent = Agent(
    name="Strategy Agent",
    role="Develops business strategies from research",
    model=Claude(id="claude-opus-4-5-20251001"),
    instructions=["Think strategically", "Consider long-term implications"],
)

content_agent = Agent(
    name="Content Agent",
    role="Creates marketing content",
    model=OpenAIChat(id="gpt-4o"),
    tools=[ContentWriterTools()],
    instructions=["Write engaging content", "Maintain brand voice"],
)

# Team with leader coordination
marketing_team = Team(
    name="Marketing Team",
    model=OpenAIChat(id="gpt-4o"),  # Team leader model
    members=[research_agent, strategy_agent, content_agent],
    instructions=[
        "You coordinate a marketing team.",
        "Delegate research tasks to Research Agent.",
        "Delegate strategy to Strategy Agent.",
        "Delegate content creation to Content Agent.",
    ],
    share_member_interactions=True,  # Members see each other's work
    delegate_to_all_members=False,   # Leader selects specific members
    show_members_responses=True,     # Include member outputs
    db=PostgresDb(db_url="postgresql+psycopg://ai:ai@localhost:5532/ai"),
    enable_team_memory=True,
)

# Execute team task
response = marketing_team.print_response(
    "Create a marketing campaign for our new product launch",
    stream=True
)
```

### Coordination Patterns

**1. Leader-Based Delegation (Default)**
```python
# Leader analyzes task and routes to appropriate member
team = Team(
    delegate_to_all_members=False,  # Leader chooses member
    members=[agent1, agent2, agent3],
)
```

**2. Broadcast to All**
```python
# All members receive the task simultaneously
team = Team(
    delegate_to_all_members=True,  # All members work in parallel
    members=[agent1, agent2, agent3],
)
```

**3. Hierarchical (Sub-Teams)**
```python
# Teams can contain other teams
research_team = Team(name="Research", members=[...])
strategy_team = Team(name="Strategy", members=[...])

executive_team = Team(
    name="Executive",
    members=[research_team, strategy_team],  # Sub-teams as members
)
```

### Our BMAD Team Structure

```python
# Implementing MASTER-PLAN.md 5.2 Agent Team Architecture
from agno.team.team import Team

# BMAD Agent Team
bmad_team = Team(
    name="BMAD Agent Team",
    model=Claude(id="claude-opus-4-5-20251001"),  # Orchestrator
    members=[
        strategy_agent,    # Phase 1: Brainstorm, Market, Audience
        research_agent,    # Research support
        content_agent,     # Phase 4-5: Design, Architect
        analysis_agent,    # Analytics and validation
        execution_agent,   # Phase 6: Make (Development)
    ],
    instructions=[
        "You orchestrate product development through BMAD phases.",
        "Phase 1-2: Delegate to Strategy Agent for ideation and analysis.",
        "Phase 3: Use Research Agent for market validation.",
        "Phase 4-5: Use Content Agent for design and architecture.",
        "Phase 6: Use Execution Agent for development tasks.",
        "Always validate outputs against acceptance criteria.",
        "Pause for human approval at phase gates.",
    ],
    share_member_interactions=True,
    db=PostgresDb(db_url=env.DATABASE_URL),
)
```

### Adoption Recommendation
- [x] **Adopt** - Team pattern aligns perfectly with BMAD agent team requirements

---

## 3. Tool Integration

### Tool Interface

```python
from agno.tools import tool
from pydantic import BaseModel, Field
from typing import Optional

# Simple tool with docstring
@tool
def search_crm_contacts(
    query: str,
    limit: int = 10
) -> list[dict]:
    """Search contacts in the CRM.

    Args:
        query: Search query string
        limit: Maximum results to return

    Returns:
        List of matching contact records
    """
    # Implementation
    return contacts

# Tool with Pydantic schema
class CRMSearchRequest(BaseModel):
    query: str = Field(description="Search query")
    entity_type: str = Field(description="contact, company, or deal")
    filters: Optional[dict] = Field(default=None, description="Filter criteria")

@tool
def advanced_crm_search(request: CRMSearchRequest) -> list[dict]:
    """Advanced CRM search with filters."""
    return results
```

### Tool with Human Confirmation

```python
@tool(
    name="create_marketing_campaign",
    description="Creates a new marketing campaign",
    requires_confirmation=True,  # Pauses for human approval!
)
def create_campaign(
    name: str,
    budget: float,
    channels: list[str]
) -> dict:
    """Create marketing campaign (requires approval)."""
    return campaign_data
```

### Tool Hooks

```python
from agno.tools import tool, ToolHook
from datetime import datetime

# Pre/post execution hooks
class LoggingHook(ToolHook):
    def pre_call(self, tool_name: str, args: dict) -> dict:
        print(f"[{datetime.now()}] Calling {tool_name} with {args}")
        return args  # Can modify args

    def post_call(self, tool_name: str, result: any) -> any:
        print(f"[{datetime.now()}] {tool_name} returned {result}")
        return result  # Can modify result

@tool(
    tool_hooks=[LoggingHook()],
    cache_results=True,
    cache_ttl=3600,  # 1 hour cache
)
def expensive_analysis(data: dict) -> dict:
    """Run expensive analysis with caching."""
    return analysis_result
```

### Toolkit Pattern (Pre-built Collections)

```python
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.googlesearch import GoogleSearchTools
from agno.tools.crawl4ai import Crawl4aiTools
from agno.tools.yfinance import YFinanceTools
from agno.tools.github import GithubTools

# Use built-in toolkits
agent = Agent(
    tools=[
        DuckDuckGoTools(),
        YFinanceTools(stock_price=True, analyst_recommendations=True),
        GithubTools(access_token=env.GITHUB_TOKEN),
    ],
)

# Or create custom toolkit
class CRMToolkit:
    """Custom CRM tools for AI Business Hub."""

    @tool
    def search_contacts(self, query: str) -> list:
        """Search CRM contacts."""
        pass

    @tool
    def create_deal(self, contact_id: str, value: float) -> dict:
        """Create new deal."""
        pass

    @tool
    def update_lead_score(self, contact_id: str, score: int) -> dict:
        """Update contact lead score."""
        pass

agent = Agent(tools=[CRMToolkit()])
```

### Our Agent Tools Mapping

| Agent | Tools Needed | Implementation |
|-------|--------------|----------------|
| Strategy Agent | `MarketResearch`, `CompetitorAnalysis`, `TrendAnalysis` | Custom toolkit + DuckDuckGoTools |
| Research Agent | `WebSearch`, `ContentScraper`, `DataExtractor` | Crawl4aiTools + custom |
| Content Agent | `ContentWriter`, `SEOChecker`, `ImageGenerator` | Custom + DALL-E tools |
| Analysis Agent | `DataAnalyzer`, `ChartGenerator`, `ReportWriter` | Custom + YFinanceTools |
| Execution Agent | `TaskRunner`, `CodeGenerator`, `Deployer` | GithubTools + custom |

### Adoption Recommendation
- [x] **Adopt** - Tool pattern is flexible and supports human-in-the-loop

---

## 4. Memory & Context

### Memory Types

**1. Automatic Memory** - System extracts and stores user facts:
```python
agent = Agent(
    db=PostgresDb(db_url="postgresql://..."),
    enable_user_memories=True,  # Auto-extract user facts
)
# Agent remembers: "User prefers bullet points", "User is in marketing"
```

**2. Agentic Memory** - Agent controls what to remember:
```python
agent = Agent(
    db=PostgresDb(db_url="postgresql://..."),
    enable_agentic_memory=True,  # Agent has memory tools
)
# Agent decides: "I should remember this customer preference"
```

**3. Session History** - Conversation continuity:
```python
agent = Agent(
    db=PostgresDb(db_url="postgresql://..."),
    add_history_to_context=True,  # Include past messages
    num_history_runs=5,           # Last 5 conversation turns
    enable_session_summaries=True,  # Compress long histories
    add_session_summary_to_context=True,
)
```

### Storage Architecture

```python
from agno.db.postgres import PostgresDb
from agno.db.sqlite import SqliteDb
from agno.db.mongodb import MongoDb

# PostgreSQL (recommended for production)
db = PostgresDb(
    db_url="postgresql+psycopg://user:pass@localhost:5432/agno",
    table_name="agent_memories",  # Custom table
)

# SQLite (development)
db = SqliteDb(db_file="./agent_memory.db")

# MongoDB (document-heavy use cases)
db = MongoDb(
    db_url="mongodb://localhost:27017",
    db_name="agno_memories",
)
```

### Memory Data Model

```python
# Agno memory schema (stored in agno_memories table)
{
    "memory_id": "uuid",
    "memory": "User prefers concise responses in bullet points",
    "topics": ["preferences", "formatting"],
    "input": "Can you use bullet points?",
    "user_id": "user_123",
    "agent_id": "strategy_agent",
    "team_id": "marketing_team",
    "updated_at": "2025-11-29T10:30:00Z"
}
```

### Multi-Tenant Memory Pattern

```python
# AI Business Hub: Tenant-isolated memory
def get_agent_for_tenant(tenant_id: str, user_id: str) -> Agent:
    """Create tenant-isolated agent instance."""
    return Agent(
        name="Strategy Agent",
        model=get_tenant_model(tenant_id),  # BYOAI model
        db=PostgresDb(
            db_url=env.DATABASE_URL,
            table_name=f"memories_{tenant_id}",  # Tenant isolation
        ),
        # Alternatively, use row-level filtering:
        # user_id=user_id allows filtering memories by user
    )

# Running with user context
agent = get_agent_for_tenant("tenant_abc", "user_123")
response = agent.run("Analyze my marketing data", user_id="user_123")
```

### Manual Memory Access

```python
# Programmatic memory retrieval
memories = agent.get_user_memories(user_id="user_123")
for mem in memories:
    print(f"{mem.topics}: {mem.memory}")

# Memory search
relevant_memories = agent.search_memories(
    query="marketing preferences",
    user_id="user_123",
    limit=5
)
```

### Adoption Recommendation
- [x] **Adopt** - PostgreSQL persistence aligns with our architecture
- Adapt: Use tenant-scoped tables or row-level security

---

## 5. Human-in-the-Loop

### Approval Pattern - Tool Confirmation

```python
@tool(requires_confirmation=True)
def publish_campaign(campaign_id: str) -> dict:
    """Publish marketing campaign (requires human approval)."""
    return publish_to_channels(campaign_id)

@tool(requires_confirmation=True)
def send_email_blast(
    recipients: list[str],
    template_id: str,
    subject: str
) -> dict:
    """Send email to recipients (requires approval)."""
    return send_emails(recipients, template_id, subject)

# Agent with confirmation-required tools
agent = Agent(
    name="Marketing Agent",
    tools=[publish_campaign, send_email_blast],
)

# When tool requires confirmation, agent returns:
# {
#   "status": "confirmation_required",
#   "tool": "publish_campaign",
#   "args": {"campaign_id": "camp_123"},
#   "message": "Ready to publish campaign. Approve?"
# }
```

### User Input Pattern

```python
from agno.tools import tool, UserInput

@tool
def collect_campaign_details() -> dict:
    """Collect campaign details from user."""
    return UserInput(
        fields=[
            {"name": "campaign_name", "type": "text", "required": True},
            {"name": "budget", "type": "number", "required": True},
            {"name": "channels", "type": "multiselect", "options": ["email", "social", "ads"]},
        ],
        message="Please provide campaign details:"
    )

# Agent pauses and returns UI prompt for user input
```

### Async Confirmation Flow

```python
import asyncio

async def run_with_approval():
    """Run agent with human approval gates."""
    agent = Agent(
        name="Strategy Agent",
        tools=[publish_strategy_tool],  # requires_confirmation=True
    )

    # Initial run
    response = await agent.arun("Create and publish Q1 marketing strategy")

    if response.status == "confirmation_required":
        # Present to user for approval
        user_decision = await get_user_approval(
            tool=response.pending_tool,
            args=response.pending_args,
        )

        if user_decision.approved:
            # Continue with confirmation
            response = await agent.arun(
                confirmation=True,
                run_id=response.run_id,
            )
        else:
            # Cancel the operation
            response = await agent.arun(
                confirmation=False,
                run_id=response.run_id,
                feedback=user_decision.reason,
            )

    return response
```

### Our Approval Gates (MASTER-PLAN.md 2.3)

| Approval Type | Trigger | Implementation |
|---------------|---------|----------------|
| Phase Gate | End of BMAD phase | Workflow step with `requires_confirmation=True` |
| Budget Threshold | Spend > $X | Tool with conditional confirmation |
| Content Publishing | Before public release | `@tool(requires_confirmation=True)` |
| Strategy Decisions | Major pivots | Team leader confirmation |
| External Actions | API calls to third parties | Tool-level confirmation |

```python
# Phase gate implementation
@tool(requires_confirmation=True)
def complete_phase(
    product_id: str,
    phase: str,
    deliverables: list[str]
) -> dict:
    """Complete a BMAD phase and move to next.

    Requires human approval to proceed to next phase.
    """
    validate_deliverables(deliverables)
    return {
        "phase_completed": phase,
        "deliverables": deliverables,
        "next_phase": get_next_phase(phase),
        "message": f"Phase {phase} complete. Ready to proceed?"
    }
```

### Adoption Recommendation
- [x] **Adopt** - Native HITL support matches our requirements perfectly

---

## 6. Workflow Orchestration

### Basic Workflow

```python
from agno.agent import Agent
from agno.workflow import Workflow
from agno.db.postgres import PostgresDb

# Define agents for each step
researcher = Agent(
    name="Researcher",
    instructions="Find relevant information about the topic",
    tools=[DuckDuckGoTools()],
)

analyst = Agent(
    name="Analyst",
    instructions="Analyze research findings and extract insights",
)

writer = Agent(
    name="Writer",
    instructions="Write a clear, engaging report based on analysis",
)

# Sequential workflow
research_workflow = Workflow(
    name="Research Report",
    steps=[researcher, analyst, writer],  # Execute in order
    db=PostgresDb(db_url="postgresql://..."),
)

# Execute
response = research_workflow.print_response(
    "Research AI trends for 2025",
    stream=True
)
```

### Conditional Workflow

```python
from agno.workflow import Workflow, WorkflowAgent
from agno.workflow.step import Step
from agno.workflow.condition import Condition

def needs_revision(state: dict) -> bool:
    """Check if content needs revision."""
    return state.get("quality_score", 0) < 0.8

def needs_fact_check(state: dict) -> bool:
    """Check if content needs fact checking."""
    return state.get("has_claims", False)

# Workflow with conditional branches
content_workflow = Workflow(
    name="Content Pipeline",
    agent=WorkflowAgent(model=OpenAIChat(id="gpt-4o-mini")),
    steps=[
        Step(name="draft", agent=writer),
        Step(name="review", agent=reviewer),
        Condition(
            name="revision_check",
            evaluator=needs_revision,
            steps=[Step(name="revise", agent=writer)],
        ),
        Condition(
            name="fact_check",
            evaluator=needs_fact_check,
            steps=[Step(name="verify", agent=fact_checker)],
        ),
        Step(name="finalize", agent=editor),
    ],
)
```

### Parallel Execution

```python
from agno.workflow.parallel import Parallel

# Multiple steps run concurrently
workflow = Workflow(
    name="Parallel Research",
    steps=[
        # These run in parallel
        Parallel(
            steps=[
                Step(name="market_research", agent=market_researcher),
                Step(name="competitor_analysis", agent=competitor_analyst),
                Step(name="customer_research", agent=customer_researcher),
            ]
        ),
        # Then synthesize results
        Step(name="synthesize", agent=synthesis_agent),
    ],
)
```

### Loop/Iterator Pattern

```python
from agno.workflow.loop import Loop

# Iterative refinement
workflow = Workflow(
    name="Iterative Refinement",
    steps=[
        Step(name="draft", agent=writer),
        Loop(
            name="refine_loop",
            steps=[Step(name="review_and_revise", agent=reviewer)],
            condition=lambda state: state.get("revision_count", 0) < 3,
            max_iterations=3,
        ),
        Step(name="finalize", agent=editor),
    ],
)
```

### BMAD Phase Workflow

```python
# Implementing MASTER-PLAN.md BMAD phases as workflow
bmad_workflow = Workflow(
    name="BMAD Product Development",
    agent=WorkflowAgent(
        model=Claude(id="claude-opus-4-5-20251001"),
        num_history_runs=10,
    ),
    steps=[
        # Phase 1: Brainstorm
        Step(name="brainstorm", agent=strategy_agent),
        Step(
            name="brainstorm_approval",
            agent=approval_gate_agent,
            # Pauses for human
        ),

        # Phase 2: Market
        Parallel(steps=[
            Step(name="market_research", agent=research_agent),
            Step(name="competitor_analysis", agent=analysis_agent),
        ]),
        Step(name="market_synthesis", agent=strategy_agent),
        Step(name="market_approval", agent=approval_gate_agent),

        # Phase 3: Audience
        Step(name="audience_analysis", agent=research_agent),
        Step(name="persona_creation", agent=content_agent),
        Step(name="audience_approval", agent=approval_gate_agent),

        # Phase 4: Design
        Step(name="product_design", agent=content_agent),
        Step(name="design_approval", agent=approval_gate_agent),

        # Phase 5: Architect
        Step(name="architecture_planning", agent=analysis_agent),
        Step(name="architecture_approval", agent=approval_gate_agent),

        # Phase 6: Make
        Step(name="development", team=execution_team),
        Step(name="qa_review", agent=analysis_agent),
        Step(name="final_approval", agent=approval_gate_agent),
    ],
    db=PostgresDb(db_url="postgresql://..."),
)
```

### Adoption Recommendation
- [x] **Adopt** - Workflow system provides the determinism needed for BMAD phases

---

## Implementation Recommendations

### Phase 1: Core Agent Setup (Sprint 1-2)

1. **Install Agno Framework**
   ```bash
   pip install agno
   # Or with all providers
   pip install "agno[all]"
   ```

2. **Configure Database**
   ```python
   # config/agno.py
   from agno.db.postgres import PostgresDb

   def get_agent_db(tenant_id: str) -> PostgresDb:
       return PostgresDb(
           db_url=os.environ["DATABASE_URL"],
           table_name=f"agno_memories_{tenant_id}",
       )
   ```

3. **Create Base Agent Class**
   ```python
   # agents/base.py
   from agno.agent import Agent
   from agno.models.openai import OpenAIChat
   from agno.models.anthropic import Claude

   class AIBusinessHubAgent(Agent):
       """Base agent with tenant-aware configuration."""

       def __init__(self, tenant_id: str, user_id: str, **kwargs):
           model = self._get_tenant_model(tenant_id)
           db = get_agent_db(tenant_id)
           super().__init__(
               db=db,
               model=model,
               add_history_to_context=True,
               enable_user_memories=True,
               **kwargs
           )

       def _get_tenant_model(self, tenant_id: str):
           config = get_tenant_ai_config(tenant_id)  # BYOAI
           return self._model_from_config(config)
   ```

4. **Implement BMAD Agents**
   ```python
   # agents/strategy.py
   from agents.base import AIBusinessHubAgent
   from tools.market_research import MarketResearchToolkit

   class StrategyAgent(AIBusinessHubAgent):
       def __init__(self, tenant_id: str, user_id: str):
           super().__init__(
               tenant_id=tenant_id,
               user_id=user_id,
               name="Strategy Agent",
               instructions=[
                   "You are a strategic business analyst.",
                   "Focus on actionable, data-driven insights.",
                   "Consider market trends and competitor positions.",
               ],
               tools=[MarketResearchToolkit()],
               reasoning=True,
           )
   ```

### Phase 2: Team Coordination (Sprint 3-4)

1. **Create Agent Team**
   ```python
   # teams/bmad_team.py
   from agno.team.team import Team
   from agents import StrategyAgent, ResearchAgent, ContentAgent

   def create_bmad_team(tenant_id: str, user_id: str) -> Team:
       return Team(
           name="BMAD Team",
           model=get_orchestrator_model(tenant_id),
           members=[
               StrategyAgent(tenant_id, user_id),
               ResearchAgent(tenant_id, user_id),
               ContentAgent(tenant_id, user_id),
           ],
           share_member_interactions=True,
           enable_team_memory=True,
           db=get_agent_db(tenant_id),
       )
   ```

2. **Implement Tool Confirmation**
   ```python
   # tools/approval.py
   from agno.tools import tool

   @tool(requires_confirmation=True)
   async def complete_bmad_phase(
       product_id: str,
       phase: str,
       deliverables: dict
   ) -> dict:
       """Complete BMAD phase (requires human approval)."""
       await validate_phase_deliverables(phase, deliverables)
       return {
           "status": "pending_approval",
           "phase": phase,
           "product_id": product_id,
           "deliverables": deliverables,
       }
   ```

### Phase 3: Workflow Integration (Sprint 5-6)

1. **BMAD Workflow Definition**
   ```python
   # workflows/bmad_workflow.py
   from agno.workflow import Workflow
   from agno.workflow.step import Step
   from agno.workflow.condition import Condition

   def create_product_workflow(
       tenant_id: str,
       product_template: str
   ) -> Workflow:
       team = create_bmad_team(tenant_id)

       return Workflow(
           name=f"BMAD-{product_template}",
           steps=get_template_steps(product_template),
           db=get_agent_db(tenant_id),
       )
   ```

---

## Key Takeaways for AI Business Hub

1. **Agent definition is declarative** - Easy to map BMAD agents to Agno Agent class
2. **Teams use leader-based delegation** - Matches our orchestration model
3. **Native HITL support** - `requires_confirmation=True` for approval gates
4. **Flexible persistence** - PostgreSQL recommended for multi-tenant
5. **Workflows are deterministic** - Perfect for BMAD phase progression
6. **BYOAI compatible** - Model abstraction supports provider switching

## Questions for Next Steps

1. **Memory Isolation**: Row-level security vs tenant-scoped tables?
2. **Approval UI**: How to surface `requires_confirmation` to frontend?
3. **Workflow State**: Where to store workflow progress for dashboard?
4. **Model Costs**: How to track token usage per tenant for billing?

---

## References

- [Agno Documentation](https://docs.agno.com/)
- [Agno GitHub Repository](https://github.com/agno-agi/agno)
- [Agno Cookbook Examples](https://github.com/agno-agi/agno/tree/main/cookbook)
- [Context7 Library Documentation](https://context7.dev/websites/agno)

---

**Document Status:** Complete
**Next Action:** Begin Phase 1 implementation
