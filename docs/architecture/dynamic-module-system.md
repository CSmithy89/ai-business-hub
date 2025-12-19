# Dynamic Module System: The "Slot System" & "AG-UI" Implementation

## 1. Executive Summary
We are upgrading the HYVVE module system from a static, hardcoded architecture to a dynamic, intelligence-driven one.
By combining a **React Slot Registry** with the **AG-UI Streaming Protocol**, we enable AI Agents to dictate the User Interface at runtime. This allows modules (like "Brand", "PM", "CRM") to inject rich, interactive components into the application without modifying the core codebase.

## 2. Core Concepts

### A. The "Slot System" (Frontend)
A **Slot** is a designated zone in the UI (e.g., `dashboard.widgets`, `project.header`, `sidebar.menu`) where dynamic content can be rendered.
A **Registry** maps string keys (e.g., `"BrandHealthWidget"`) to actual React components.

### B. AG-UI Render Hints (Communication)
Agents use the `UI_RENDER_HINT` event in the AG-UI protocol to instruct the frontend to render a specific component in a specific slot.

**Protocol Payload:**
```json
{
  "type": "UI_RENDER_HINT",
  "component": "ProjectStatusCard",
  "slot": "dashboard.widgets",
  "props": {
    "status": "on_track",
    "completion": 75,
    "nextMilestone": "Beta Launch"
  }
}
```

## 3. Implementation Plan

### Phase 1: Frontend Registry & Renderer

1.  **Create the Component Registry (`apps/web/src/lib/component-registry.ts`)**
    *   A singleton class to map string IDs to React Components.
    *   Methods: `register(id, component)`, `get(id)`.

2.  **Create the Dynamic Renderer (`apps/web/src/components/DynamicRenderer.tsx`)**
    *   A component that takes `componentName` and `props`.
    *   It looks up the component in the registry and renders it.
    *   Handles "Unknown Component" gracefully (fallback UI).

3.  **Implement the Slot Component (`apps/web/src/components/Slot.tsx`)**
    *   A component that acts as a container.
    *   It subscribes to the Agent Stream (or a global store) to listen for `UI_RENDER_HINT` events targeting its specific `slotName`.

4.  **Register Core Components**
    *   Create `apps/web/src/components/registry-init.ts`.
    *   Register primitive UI components (Card, Button, Table) and module-specific components (e.g., `ProjectStatusWidget`).

### Phase 2: Python Agent Updates (Backend)

1.  **Update `agents/ag_ui/encoder.py`**
    *   Ensure `UI_RENDER_HINT` supports the optional `slot` field.

2.  **Update `agents/pm/navi.py` (Pilot)**
    *   Modify Navi's tools or instructions to yield `RenderHint` objects.
    *   *Example:* When asked "Status report", instead of just text, Navi sends:
        ```python
        yield RenderHint(
            component="ProjectStatusCard",
            props={"status": "on_track", ...}
        )
        ```

### Phase 3: Integration (The "Dashboard" Pilot)

1.  **Update `DashboardContent.tsx`**
    *   Replace hardcoded widgets with `<Slot name="dashboard.widgets" />`.
    *   On load, trigger the "PM Team" agent with a hidden prompt: *"Analyze active projects and suggest dashboard widgets."*

2.  **Verify Flow**
    *   User loads Dashboard -> Agent Runs -> Agent Yields Hints -> Slot Renders Widgets.

## 4. Technical Specifications

### A. Frontend Registry
```typescript
// apps/web/src/lib/component-registry.ts
import React from 'react';

type ComponentType = React.ComponentType<any>;

class ComponentRegistry {
  private static components = new Map<string, ComponentType>();

  static register(id: string, component: ComponentType) {
    this.components.set(id, component);
  }

  static get(id: string): ComponentType | undefined {
    return this.components.get(id);
  }
}
export default ComponentRegistry;
```

### B. Python Render Hint Helper
```python
# agents/utils/ui.py
from pydantic import BaseModel
from typing import Dict, Any, Optional

class RenderHint(BaseModel):
    component: string
    props: Dict[str, Any]
    slot: Optional[str] = None
    
    def to_event(self):
        return {
            "type": "UI_RENDER_HINT",
            "component": self.component,
            "props": self.props,
            "slot": self.slot
        }
```

## 5. Benefits
1.  **Decoupling:** The Core Dashboard doesn't know about "Project Status" or "Brand Health".
2.  **Dynamic Intelligence:** The AI decides *what* is important to show. If a project is failing, it shows a "Risk Alert". If it's new, it shows "Onboarding".
3.  **No Rebuilds:** You can add new widgets to the Registry and Agents can start using them immediately without changing the page layout code.
