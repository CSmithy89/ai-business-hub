# Business Plan - Workflow Instructions

<critical>
Use the Planning Orchestrator (Blueprint) persona
This workflow synthesizes all BMP artifacts into a cohesive document
Requires Business Model Canvas and Financial Projections as inputs
Communicate in {communication_language}
</critical>

<workflow>

<step n="1" goal="Gather all planning artifacts">
<action>Load required documents:</action>
- Business Model Canvas (required)
- Financial Projections (required)
- Pricing Strategy (optional)
- Revenue Model (optional)
- Growth Forecast (optional)
- BMV Validation documents (optional)

<check if="missing required documents">
  <action>Notify which documents are missing</action>
  <action>Recommend completing those workflows first</action>
</check>

<template-output>artifacts_gathered</template-output>
</step>

<step n="2" goal="Create Executive Summary">
<action>Synthesize into 1-2 page executive summary:</action>

- The opportunity (problem + market size)
- The solution (product + differentiation)
- Business model (how you make money)
- Traction/Progress (if any)
- Team (key people)
- Financials (key metrics)
- Ask (funding needed + use of funds)

<critical>This is often all that gets read - make it compelling</critical>
<template-output>executive_summary</template-output>
</step>

<step n="3" goal="Write Company Description">
<action>Document company fundamentals:</action>

- Mission statement
- Vision statement
- Company history/stage
- Legal structure
- Location
- Core values

<template-output>company_description</template-output>
</step>

<step n="4" goal="Compile Market Analysis">
<action>Pull from BMV documents if available, otherwise gather:</action>

- Industry overview
- TAM/SAM/SOM
- Market trends
- Target customer profile
- Competitive landscape

<template-output>market_analysis</template-output>
</step>

<step n="5" goal="Describe Products/Services">
<action>Detail the offering:</action>

- Product/service description
- Key features and benefits
- Development roadmap
- Intellectual property
- Competitive advantages

<template-output>products_services</template-output>
</step>

<step n="6" goal="Document Business Model">
<action>Pull from Business Model Canvas:</action>

- Value proposition
- Revenue streams
- Key resources and activities
- Partnerships
- Cost structure

<template-output>business_model_section</template-output>
</step>

<step n="7" goal="Define Go-to-Market Strategy">
<action>Detail market entry approach:</action>

- Target market entry
- Pricing strategy (summary)
- Sales strategy
- Marketing strategy
- Channel strategy
- Launch plan

<template-output>go_to_market</template-output>
</step>

<step n="8" goal="Document Operations Plan">
<action>Outline operational requirements:</action>

- Development/Production process
- Technology stack
- Facilities and equipment
- Supply chain (if applicable)
- Key operational milestones

<template-output>operations_plan</template-output>
</step>

<step n="9" goal="Present Management Team">
<ask>Who are the key team members and their roles?</ask>
<action>Document:</action>

- Founders and key team
- Relevant experience
- Advisory board (if any)
- Key hires needed
- Org chart

<template-output>management_team</template-output>
</step>

<step n="10" goal="Compile Financial Section">
<action>Pull from Financial Projections:</action>

- Key financial highlights
- Revenue projections (summary)
- Unit economics
- Path to profitability
- Key assumptions

<template-output>financial_section</template-output>
</step>

<step n="11" goal="Define Funding Requirements">
<action>Detail the ask:</action>

- Total funding sought
- Use of funds breakdown
- Milestones funding will achieve
- Future funding expectations
- Exit considerations (if relevant)

<template-output>funding_requirements</template-output>
</step>

<step n="12" goal="Generate final business plan">
<action>Compile complete business plan using template</action>
<action>Ensure consistency across sections</action>
<action>Add appendices for detailed documents</action>
<action>Save to {default_output_file}</action>
<template-output>final_business_plan</template-output>
</step>

</workflow>
