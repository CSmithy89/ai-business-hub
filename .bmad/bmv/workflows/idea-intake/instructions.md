# Idea Intake Workflow Instructions

<critical>The workflow execution engine is governed by: {project-root}/.bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/.bmad/bmv/workflows/idea-intake/workflow.yaml</critical>

<workflow>

<step n="1" goal="Capture Initial Idea">
<action>Welcome the user and explain the idea intake process</action>
<action>Ask for initial business idea description if not already provided</action>

<prompt>
Tell me about your business idea. What problem are you trying to solve and for whom?
Share as much or as little as you're comfortable with - we'll explore it together.
</prompt>

<action>Record the initial idea description verbatim</action>
<template-output>initial_idea</template-output>
</step>

<step n="2" goal="Clarify the Problem">
<action>Ask clarifying questions about the problem being solved</action>

<questions>
1. **Who experiences this problem?** (Be specific - job titles, company sizes, demographics)
2. **How often does this problem occur?** (Daily, weekly, monthly, once-in-a-while)
3. **How severe is this problem?** (Annoying, painful, critical/urgent)
4. **What do people currently do about this?** (Existing solutions, workarounds, or "do nothing")
5. **Why hasn't someone solved this already?** (Or have they?)
</questions>

<action>Synthesize responses into a structured problem statement</action>
<template-output>problem_definition</template-output>
</step>

<step n="3" goal="Define the Solution">
<action>Explore the proposed solution with clarifying questions</action>

<questions>
1. **In one sentence, what does your solution do?**
2. **What are the 3-5 key features that must exist?** (Core, not nice-to-have)
3. **What makes this solution better than alternatives?**
4. **What would users call this type of product?** (Category/comparison)
5. **Is there any unique insight or unfair advantage?**
</questions>

<action>Document the solution hypothesis clearly</action>
<template-output>solution_hypothesis</template-output>
</step>

<step n="4" goal="Assess Founder-Market Fit">
<action>Understand the founder's connection to this problem</action>

<questions>
1. **Have you personally experienced this problem?**
2. **What relevant expertise or background do you have?**
3. **Why are YOU the right person/team to solve this?**
4. **What resources are available?** (Time, funding, team, network)
5. **How committed are you?** (Side project vs all-in)
</questions>

<action>Document founder context and commitment level</action>
<template-output>founder_fit</template-output>
</step>

<step n="5" goal="Timing and Context">
<action>Explore why this opportunity exists now</action>

<questions>
1. **Why now?** What changed to make this possible/necessary?
2. **Are there any trends supporting this timing?** (Tech, social, regulatory)
3. **Are there any risks to timing?** (Too early, too late, competition)
</questions>

<action>Document timing rationale</action>
<template-output>timing_context</template-output>
</step>

<step n="6" goal="Initial Assumptions">
<action>Identify key assumptions that need validation</action>

<categories>
- **Desirability**: Customers want this
- **Feasibility**: We can build this
- **Viability**: We can make money
</categories>

<action>List 5-10 critical assumptions in priority order</action>
<action>Mark which assumptions are riskiest (need validation first)</action>
<template-output>key_assumptions</template-output>
</step>

<step n="7" goal="Quick Sanity Check">
<action>Perform rapid initial assessment</action>

<checks>
- [ ] Quick Google search: Are there existing solutions?
- [ ] Market existence: Are people paying for similar things?
- [ ] Technical feasibility: Is this buildable?
- [ ] Obvious blockers: Any immediate red flags?
</checks>

<action>Document initial findings and any concerns</action>
<template-output>sanity_check</template-output>
</step>

<step n="8" goal="Generate Session ID and Summary">
<action>Generate unique validation session ID</action>
<action>Create executive summary of the captured idea</action>
<action>Recommend next steps (which validation workflows to run)</action>

<recommendations>
Based on the idea characteristics, recommend:
- [ ] Full validation (market sizing, competitors, customers)
- [ ] Quick validation (30-minute sanity check)
- [ ] Specific deep-dive (just market sizing or just competitors)
</recommendations>

<action>Present summary and get user confirmation to proceed</action>
<template-output>session_summary</template-output>
</step>

<step n="9" goal="Save and Finalize">
<action>Compile all sections into the output template</action>
<action>Save the idea intake document</action>
<action>Emit validation.session.created event</action>
<action>Present user with the completed idea intake and next steps</action>

<output>
Saved to: {{output_file}}
Session ID: {{session_id}}

Ready to proceed with validation? Run:
- /bmad:bmv:workflows:market-sizing - Calculate TAM/SAM/SOM
- /bmad:bmv:workflows:competitor-mapping - Analyze competitive landscape
- /bmad:bmv:workflows:customer-discovery - Define target customers
</output>
</step>

</workflow>
