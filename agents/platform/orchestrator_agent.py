"""
OrchestratorAgent (Navigator) - Request Router & Coordinator
AI Business Hub Platform Agent

Routes requests to appropriate module agents and coordinates
cross-module workflows.

BMAD Spec: .bmad/orchestrator/agents/orchestrator-agent.agent.yaml
"""

from typing import Optional, List, Dict

# ============================================================================
# Agent Configuration
# ============================================================================

AGENT_NAME = "Navigator"
AGENT_TITLE = "Request Router + Multi-Module Coordinator"

INSTRUCTIONS = [
    "You are Navigator, the orchestration hub for AI Business Hub.",
    "Your role is to understand user intent and route to the best module agent.",
    "Ask clarifying questions when intent is unclear, but don't over-question.",
    "Preserve context when handing off to other agents.",
    "Track delegated tasks and report on their status.",
    "You know all platform capabilities across CRM, marketing, sales, content, and analytics.",
]

PRINCIPLES = [
    "Understand intent before routing - ask if unclear",
    "Route to the most capable agent for the task",
    "Preserve context across module boundaries",
    "Track delegated tasks to completion",
    "One request, one clear path forward",
]

# Module registry - maps capabilities to agents
MODULE_REGISTRY = {
    # ============================================================================
    # Business Onboarding Modules (BMAD Foundation)
    # ============================================================================
    "bmv": {
        "name": "Business Model Validation",
        "description": "Idea validation, market sizing, competitor analysis, customer discovery",
        "agents": ["Vera", "Marco", "Cipher", "Persona", "Risk"],
        "capabilities": [
            "idea_intake", "market_sizing", "tam_sam_som",
            "competitor_analysis", "customer_discovery", "icp_creation",
            "risk_assessment", "validation_synthesis",
        ],
        "team_leader": "Vera",
    },
    "bmp": {
        "name": "Business Planning",
        "description": "Business model canvas, financial projections, pricing strategy, growth forecasting",
        "agents": ["Blake", "Model", "Finn", "Revenue", "Forecast"],
        "capabilities": [
            "business_model_canvas", "value_proposition",
            "financial_projections", "unit_economics", "funding_requirements",
            "pricing_strategy", "revenue_model", "growth_forecast",
            "milestone_roadmap", "business_plan_synthesis",
        ],
        "team_leader": "Blake",
    },
    "bmb": {
        "name": "Business Branding",
        "description": "Brand strategy, voice architecture, visual identity, asset generation",
        "agents": ["Bella", "Sage", "Vox", "Iris", "Artisan", "Audit"],
        "capabilities": [
            "brand_strategy", "brand_archetype", "brand_positioning",
            "brand_voice", "tone_guidelines", "messaging_framework",
            "visual_identity", "color_system", "typography", "logo_system",
            "asset_generation", "brand_guidelines", "brand_audit",
        ],
        "team_leader": "Bella",
    },
    # ============================================================================
    # Operational Modules
    # ============================================================================
    "bm-crm": {
        "name": "CRM Module",
        "description": "Contact management, companies, deals, pipelines",
        "agents": ["LeadScorerAgent", "DataEnricherAgent", "PipelineAgent"],
        "capabilities": ["contacts", "companies", "deals", "lead_scoring", "enrichment", "pipelines"],
    },
    "bmc": {
        "name": "Content Module",
        "description": "Content creation, SEO, blog posts",
        "agents": ["ContentStrategist", "WriterAgent", "SEOAgent"],
        "capabilities": ["blog_posts", "content_calendar", "seo_optimization"],
    },
    "bm-social": {
        "name": "Social Module",
        "description": "Social media management and scheduling",
        "agents": ["SocialScheduler", "EngagementAgent"],
        "capabilities": ["social_posts", "scheduling", "engagement"],
    },
    "bmx": {
        "name": "Email Module",
        "description": "Email campaigns and automation",
        "agents": ["CampaignAgent", "SequenceAgent"],
        "capabilities": ["email_campaigns", "sequences", "newsletters"],
    },
    "bms": {
        "name": "Sales Module",
        "description": "Sales workflows and automation",
        "agents": ["SalesAgent", "ProposalAgent"],
        "capabilities": ["sales_workflows", "proposals", "quotes"],
    },
    "bm-pm": {
        "name": "Project Management Module",
        "description": "Projects, sprints, task tracking",
        "agents": ["SprintPlannerAgent", "TaskRouterAgent"],
        "capabilities": ["projects", "sprints", "tasks", "milestones"],
    },
}


# ============================================================================
# Routing Logic
# ============================================================================

def analyze_intent(request: str) -> Dict:
    """
    Analyze user request to determine routing.
    
    Args:
        request: The user's natural language request
    
    Returns:
        Analysis with suggested module(s) and agent(s)
    """
    # TODO: Implement with LLM-based intent classification
    return {
        "intent": "unknown",
        "confidence": 0.0,
        "suggested_module": None,
        "suggested_agent": None,
        "requires_clarification": True,
    }


def route_to_agent(
    module_id: str,
    agent_name: str,
    task: str,
    context: Optional[Dict] = None,
) -> Dict:
    """
    Route a task to a specific module agent.
    
    Args:
        module_id: Target module (e.g., "bm-crm")
        agent_name: Target agent (e.g., "LeadScorerAgent")
        task: Task description
        context: Context to pass along
    
    Returns:
        Routing confirmation with task ID
    """
    # TODO: Implement with agent invocation
    return {
        "task_id": f"task_{module_id}_{agent_name}",
        "status": "delegated",
        "module": module_id,
        "agent": agent_name,
        "task": task,
    }


def get_module_capabilities() -> List[Dict]:
    """Get all available modules and their capabilities."""
    return [
        {
            "id": module_id,
            "name": info["name"],
            "description": info["description"],
            "agents": info["agents"],
            "capabilities": info["capabilities"],
        }
        for module_id, info in MODULE_REGISTRY.items()
    ]


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    print(f"OrchestratorAgent: {AGENT_NAME}")
    print(f"Title: {AGENT_TITLE}")
    print(f"Modules: {len(MODULE_REGISTRY)}")
    for mid, info in MODULE_REGISTRY.items():
        print(f"  - {mid}: {info['name']} ({len(info['agents'])} agents)")
