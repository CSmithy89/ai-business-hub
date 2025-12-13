from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import importlib
import inspect
import logging
from agno.agent import Agent
from agno.team import Team
from agno.workflow import Workflow

logger = logging.getLogger(__name__)

# --- A2A Protocol Models ---

class AgentSkill(BaseModel):
    """Describes a specific capability or tool exposed by an agent."""
    name: str
    description: str
    parameters: Dict[str, Any]  # JSON Schema

class AgentEndpoints(BaseModel):
    """Endpoints for interacting with the agent."""
    rpc: str = "/rpc"
    ws: Optional[str] = None

class AgentCapabilities(BaseModel):
    """Feature flags for the agent."""
    streaming: bool = True
    events: bool = True
    files: bool = False

class AgentCard(BaseModel):
    """The A2A Discovery Manifest."""
    protocolVersion: str = "0.3.0"
    id: str
    name: str
    description: str
    version: str = "1.0.0"
    endpoints: AgentEndpoints = Field(default_factory=AgentEndpoints)
    capabilities: AgentCapabilities = Field(default_factory=AgentCapabilities)
    skills: List[AgentSkill] = []

# --- Registry Implementation ---

class AgentRegistry:
    """
    Central registry for discovering and managing AgentOS components.
    Handles dynamic loading of modules and A2A card generation.
    """

    def __init__(self):
        self._agents: Dict[str, Agent] = {}
        self._teams: Dict[str, Team] = {}
        self._workflows: Dict[str, Workflow] = {}
        self._cards: Dict[str, AgentCard] = {}

    def register_agent(self, agent: Agent, override_id: Optional[str] = None):
        """Register a single Agno Agent."""
        agent_id = override_id or agent.model.id if hasattr(agent, "model") and hasattr(agent.model, "id") else getattr(agent, "name", "unknown").lower().replace(" ", "_")
        # Ensure we have a valid ID
        if not agent_id:
             agent_id = f"agent_{len(self._agents)}"
        
        self._agents[agent_id] = agent
        self._generate_card(agent_id, agent, "agent")
        logger.info(f"Registered Agent: {agent_id}")

    def register_team(self, team: Team, override_id: Optional[str] = None):
        """Register an Agno Team."""
        team_id = override_id or getattr(team, "name", "unknown_team").lower().replace(" ", "_")
        self._teams[team_id] = team
        self._generate_card(team_id, team, "team")
        logger.info(f"Registered Team: {team_id}")

    def register_workflow(self, workflow: Workflow, override_id: Optional[str] = None):
        """Register an Agno Workflow."""
        # Workflows might not have a clean ID property by default
        workflow_id = override_id or getattr(workflow, "name", "unknown_workflow").lower().replace(" ", "_")
        self._workflows[workflow_id] = workflow
        self._generate_card(workflow_id, workflow, "workflow")
        logger.info(f"Registered Workflow: {workflow_id}")

    def get_agent(self, agent_id: str) -> Optional[Agent]:
        return self._agents.get(agent_id)

    def get_team(self, team_id: str) -> Optional[Team]:
        return self._teams.get(team_id)
        
    def get_workflow(self, workflow_id: str) -> Optional[Workflow]:
        return self._workflows.get(workflow_id)

    def get_card(self, component_id: str) -> Optional[AgentCard]:
        return self._cards.get(component_id)

    def list_cards(self) -> List[AgentCard]:
        return list(self._cards.values())

    def _generate_card(self, component_id: str, component: Any, component_type: str):
        """Generates an A2A Agent Card for any registered component."""
        
        name = getattr(component, "name", component_id)
        description = getattr(component, "description", f"A registered {component_type}")
        
        skills = []
        
        # Extract tools as skills if available
        if hasattr(component, "tools") and component.tools:
            for tool in component.tools:
                # Handle Agno Tool/Function objects
                if hasattr(tool, "name") and hasattr(tool, "description"):
                     skills.append(AgentSkill(
                         name=tool.name,
                         description=tool.description or "",
                         parameters=getattr(tool, "parameters", {})
                     ))
        
        card = AgentCard(
            id=component_id,
            name=name,
            description=description,
            skills=skills,
            capabilities=AgentCapabilities(
                streaming=True, # All Agno components support streaming via AgentOS
                events=True
            )
        )
        self._cards[component_id] = card

    def load_modules(self, module_paths: List[str]):
        """
        Dynamically imports python modules to trigger registration.
        Assumes modules register themselves or expose a 'register' function.
        
        For the 'Modular Monolith' pattern, we scan 'agents/' directory.
        """
        for path in module_paths:
            try:
                importlib.import_module(path)
                logger.info(f"Loaded module: {path}")
            except Exception as e:
                logger.error(f"Failed to load module {path}: {e}")

# Global Registry Instance
registry = AgentRegistry()
