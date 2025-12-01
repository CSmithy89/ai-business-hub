# Export to Planning Instructions

<critical>Only export ideas with GO or CONDITIONAL GO recommendation</critical>
<critical>Output must be compatible with BMM product-brief workflow</critical>

<workflow>

<step n="1" goal="Load Validation Data">
<action>Load validation synthesis document</action>
<action>Verify recommendation is GO or CONDITIONAL GO</action>
<action>Extract key findings from all validation phases</action>
</step>

<step n="2" goal="Transform to Product Brief Format">
<action>Map validation findings to product brief sections:</action>

<mapping>
- Problem Statement ← Idea intake problem definition
- Target Market ← Customer discovery ICP
- Market Opportunity ← Market sizing TAM/SAM
- Competitive Landscape ← Competitor analysis summary
- Value Proposition ← Differentiation from synthesis
- Success Metrics ← Go/no-go criteria
- Risks ← Risk register from synthesis
</mapping>
</step>

<step n="3" goal="Add Planning Context">
<action>Add BMM-specific planning information:</action>
- MVP scope recommendations
- Phase 1 priorities
- Technical considerations from feasibility
- Timeline considerations
</step>

<step n="4" goal="Generate Handoff Document">
<action>Create validated product brief</action>
<action>Include links to all source validation documents</action>
<action>Save to BMM output folder</action>
</step>

</workflow>
