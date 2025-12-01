# Validation Synthesis Workflow Instructions

<critical>This workflow produces the final Go/No-Go recommendation</critical>
<critical>All input documents must be loaded and cross-referenced</critical>

<workflow>

<step n="1" goal="Load All Validation Documents">
<action>Load and review all input documents:</action>

<documents>
1. Idea Intake: {{idea_intake_path}}
2. Market Sizing: {{market_sizing_path}}
3. Competitor Analysis: {{competitor_path}}
4. Customer Discovery: {{customer_path}}
</documents>

<action>Extract key findings from each document</action>
<action>Note confidence levels from each document</action>
</step>

<step n="2" goal="Cross-Document Consistency Check">
<action>Verify consistency across documents:</action>

<checks>
- Market size numbers match across docs
- Target customer description is consistent
- Competitive positioning aligns with market/customer
- Pricing assumptions are consistent
- Timeline assumptions align
</checks>

<action>Flag any inconsistencies for resolution</action>
</step>

<step n="3" goal="Calculate Validation Scores">
<action>Score each validation dimension (0-10):</action>

<dimensions>
1. **Problem Validation** (from idea intake + customer discovery)
   - Is the problem real?
   - Is it painful enough?
   - Are people actively seeking solutions?

2. **Market Validation** (from market sizing)
   - Is TAM large enough? (>$1B typically)
   - Is SAM reasonable? (>$100M typically)
   - Is market growing?

3. **Competitive Validation** (from competitor analysis)
   - Is there room for a new entrant?
   - Is differentiation possible?
   - Are moats buildable?

4. **Customer Validation** (from customer discovery)
   - Is ICP clearly defined?
   - Is willingness to pay established?
   - Is CAC < LTV viable?
</dimensions>

<scoring>
0-3: Critical concerns, major red flags
4-6: Some concerns, needs attention
7-8: Solid, minor issues
9-10: Excellent, strong validation
</scoring>
</step>

<step n="4" goal="Risk Assessment">
<action>Identify and score all risks</action>

<risk_categories>
- Market risks
- Competitive risks
- Customer risks
- Execution risks
- Financial risks
- Regulatory risks
</risk_categories>

<action>For each risk: Probability (1-5) × Impact (1-5) = Score</action>
<action>Categorize: Low (1-6), Medium (7-14), High (15-25)</action>
<action>Define mitigation strategies for High risks</action>
</step>

<step n="5" goal="SWOT Synthesis">
<action>Create SWOT analysis from all findings</action>

<swot>
**Strengths**: What's working in our favor?
**Weaknesses**: What are our challenges?
**Opportunities**: What can we capitalize on?
**Threats**: What could derail us?
</swot>
</step>

<step n="6" goal="Go/No-Go Framework">
<action>Apply decision framework</action>

<criteria>
**Must-Haves (All required for GO)**:
- [ ] TAM > $1B (or justified smaller market)
- [ ] SAM > $100M
- [ ] Clear customer pain point identified
- [ ] No dominant competitor (>80% share)
- [ ] Technical feasibility confirmed
- [ ] Team capability aligned

**Should-Haves (3+ for strong GO)**:
- [ ] Market growing >10% CAGR
- [ ] Multiple customer segments
- [ ] Clear differentiation path
- [ ] Reasonable CAC projections
- [ ] LTV:CAC > 3:1 potential
- [ ] Timing advantage

**Deal-Breakers**:
- [ ] Declining market
- [ ] Unbeatable incumbent
- [ ] Regulatory impossibility
- [ ] Negative unit economics
- [ ] No path to profitability
</criteria>

<decision>
**GO**: All must-haves + 3+ should-haves + no deal-breakers
**CONDITIONAL GO**: All must-haves + some concerns to address
**PIVOT**: Some must-haves missing, but adjacent opportunity exists
**NO-GO**: Missing must-haves or deal-breakers present
</decision>
</step>

<step n="7" goal="Generate Recommendation">
<action>Formulate final recommendation with clear rationale</action>

<recommendation_format>
## Recommendation: [GO / CONDITIONAL GO / PIVOT / NO-GO]

### Rationale
[3-5 key points supporting the recommendation]

### Validation Score: X/40
- Problem: X/10
- Market: X/10
- Competitive: X/10
- Customer: X/10

### Key Risks
[Top 3 risks with mitigation strategies]

### Next Steps
[Specific actions based on recommendation]
</recommendation_format>
</step>

<step n="8" goal="Define Next Steps">
<action>Based on recommendation, define next steps:</action>

<if recommendation="GO">
- Export to BMM product brief workflow
- Begin Phase 1 planning
- Define MVP scope
- Create initial roadmap
</if>

<if recommendation="CONDITIONAL GO">
- List specific concerns to address
- Define validation experiments needed
- Set decision checkpoint
</if>

<if recommendation="PIVOT">
- Identify pivot options
- Run pivot-analysis workflow
- Revalidate new direction
</if>

<if recommendation="NO-GO">
- Document learnings
- Archive validation data
- Consider alternative ideas
</if>
</step>

<step n="9" goal="Compile and Save">
<action>Populate template with all synthesis</action>
<action>Run validation checklist</action>
<action>Save synthesis document</action>
<action>Emit validation.completed event</action>

<output>
Validation synthesis complete.
Saved to: {{output_file}}

Recommendation: {{recommendation}}
Overall Score: {{score}}/40

[Next step guidance based on recommendation]
</output>
</step>

</workflow>
