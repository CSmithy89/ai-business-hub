# Pitch Deck - Workflow Instructions

<critical>
Use the Planning Orchestrator (Blueprint) persona
Create content for 10-12 slides
Keep each slide focused on ONE key message
Communicate in {communication_language}
</critical>

<workflow>

<step n="1" goal="Gather context">
<action>Load available planning documents for content</action>
<action>Identify key messages and data points</action>
<template-output>context_gathered</template-output>
</step>

<step n="2" goal="Slide 1: Title/Hook">
<action>Create compelling opening:</action>
- Company name and tagline
- One-sentence value proposition
- Logo placeholder

<critical>First impression matters - make it memorable</critical>
<template-output>slide_title</template-output>
</step>

<step n="3" goal="Slide 2: Problem">
<action>Articulate the problem:</action>
- What problem are you solving?
- Who has this problem?
- How painful is it?
- Story or example that illustrates

<critical>Make investors FEEL the problem</critical>
<template-output>slide_problem</template-output>
</step>

<step n="4" goal="Slide 3: Solution">
<action>Present your solution:</action>
- How you solve the problem
- Key differentiator
- Demo/screenshot placeholder

<critical>Keep it simple - avoid feature lists</critical>
<template-output>slide_solution</template-output>
</step>

<step n="5" goal="Slide 4: Market Size">
<action>Show the opportunity:</action>
- TAM/SAM/SOM
- Growth rate
- Market trends

<critical>Numbers need sources</critical>
<template-output>slide_market</template-output>
</step>

<step n="6" goal="Slide 5: Business Model">
<action>Explain how you make money:</action>
- Revenue model
- Pricing
- Unit economics

<template-output>slide_business_model</template-output>
</step>

<step n="7" goal="Slide 6: Traction">
<action>Show progress (if any):</action>
- Users/customers
- Revenue
- Growth rate
- Key milestones

<action>If pre-revenue, show validation signals</action>
<template-output>slide_traction</template-output>
</step>

<step n="8" goal="Slide 7: Competition">
<action>Position against alternatives:</action>
- Competitive landscape
- Your differentiation
- Defensibility

<critical>Don't say "no competition"</critical>
<template-output>slide_competition</template-output>
</step>

<step n="9" goal="Slide 8: Team">
<action>Introduce the founders:</action>
- Key team members
- Relevant experience
- Why this team wins

<template-output>slide_team</template-output>
</step>

<step n="10" goal="Slide 9: Financials">
<action>Show the numbers:</action>
- Revenue projections (3-5 years)
- Key metrics trajectory
- Path to profitability

<template-output>slide_financials</template-output>
</step>

<step n="11" goal="Slide 10: The Ask">
<action>Make the ask clear:</action>
- Amount raising
- Use of funds
- Milestones to hit

<template-output>slide_ask</template-output>
</step>

<step n="12" goal="Generate output">
<action>Compile pitch deck content using template</action>
<action>Include speaker notes</action>
<action>Save to {default_output_file}</action>
<template-output>final_deck</template-output>
</step>

</workflow>
