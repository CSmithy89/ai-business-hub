# Export to Development - Workflow Instructions

<critical>
Use the Planning Orchestrator (Blueprint) persona
This workflow creates handoff artifacts for BMM development phase
Requires Business Plan and Business Model Canvas
Communicate in {communication_language}
</critical>

<workflow>

<step n="1" goal="Load planning artifacts">
<action>Load required documents:</action>
- Business Plan (required)
- Business Model Canvas (required)
- Financial Projections (optional)
- Pricing Strategy (optional)

<check if="missing required documents">
  <action>Stop and notify user to complete planning workflows first</action>
</check>

<template-output>artifacts_loaded</template-output>
</step>

<step n="2" goal="Create Product Brief">
<action>Transform business plan into product brief:</action>

**Product Vision:**
- Extract from business plan executive summary
- Distill into 1-2 sentences

**Problem Statement:**
- From business plan problem section
- Focus on user perspective

**Target Users:**
- From customer segments
- Primary persona first

**Key Value Proposition:**
- From value proposition
- How product solves problem

<template-output>product_brief</template-output>
</step>

<step n="3" goal="Define Feature Priorities">
<action>Extract and prioritize features:</action>

**Must Have (MVP):**
- Core value delivery features
- Minimum to validate business model

**Should Have (V1):**
- Important for retention
- Differentiation features

**Nice to Have (Future):**
- Expansion features
- Nice-to-haves

<action>Use MoSCoW prioritization</action>
<template-output>feature_priorities</template-output>
</step>

<step n="4" goal="Define Success Metrics">
<action>Extract business metrics as product KPIs:</action>

**Primary Metrics:**
- User acquisition (tied to customer growth)
- Activation (tied to value delivery)
- Retention (tied to LTV assumptions)
- Revenue (tied to financial projections)

**Leading Indicators:**
- Early signals of success
- Metrics that predict primary metrics

<template-output>success_metrics</template-output>
</step>

<step n="5" goal="Document MVP Constraints">
<action>Define constraints from business planning:</action>

**Time Constraints:**
- From funding runway
- From market timing

**Resource Constraints:**
- From team capacity
- From budget allocation

**Technical Constraints:**
- From technology decisions
- From integration requirements

<template-output>mvp_constraints</template-output>
</step>

<step n="6" goal="Integration Requirements">
<action>Identify required integrations:</action>

- Payment processing (from revenue model)
- Third-party services
- API requirements
- Data integrations

<template-output>integrations</template-output>
</step>

<step n="7" goal="Generate Development Brief">
<action>Compile complete development brief using template</action>
<action>Format for BMM product-brief workflow compatibility</action>
<action>Save to {default_output_file}</action>
<action>Also save to {handoff_path} for BMM pickup</action>
<template-output>development_brief</template-output>
</step>

<step n="8" goal="Handoff to BMM">
<action>Provide next steps guidance:</action>

1. Development brief saved to: {output_path}
2. To continue to development: `workflow product-brief` in BMM
3. BMM will use this brief as starting point

<action>Notify user of successful handoff</action>
<template-output>handoff_complete</template-output>
</step>

</workflow>
