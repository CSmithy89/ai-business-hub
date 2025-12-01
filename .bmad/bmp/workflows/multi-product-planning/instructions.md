# Multi-Product Planning Workflow Instructions

<critical>Financial projections must be grounded in realistic assumptions - no hallucinated growth rates</critical>
<critical>Each product receives its own business model canvas and financial projections</critical>
<critical>Cross-product synergies and cannibalization risks must be analyzed</critical>

## Purpose

This workflow takes the recommended products from BMV's product-fit-analysis and creates coordinated business plans for each. It ensures products work together as a coherent portfolio with shared resources, cross-selling opportunities, and consolidated financials.

<workflow>

<step n="1" goal="Load and Parse Product Recommendations">
<action>Read the product-fit-analysis document from BMV</action>
<action>Extract the recommended products JSON</action>

<extract_data>
For each recommended product:
- product_code (e.g., BME-COURSE)
- product_name
- tier (1, 2, or 3)
- combined_score
- key_gaps (competitive opportunities)
- positioning
- synergies (related products)
- launch_phase
</extract_data>

<action>Identify Tier 1 (primary) products - these get full business plans</action>
<action>Identify Tier 2 (secondary) products - these get lighter business models</action>
<action>Load validated idea context for reference</action>
</step>

<step n="2" goal="Create Business Model Canvas Per Product (Tier 1)">
<action>For each Tier 1 product, create a complete Business Model Canvas</action>

<canvas_blocks>
For each product, define:

1. **Customer Segments**
   - Primary target from validated idea
   - Product-specific segment refinements
   - Cross-over audience with other products

2. **Value Propositions**
   - Core value from validated idea
   - Product-format specific benefits
   - Differentiation from competitors (from gap analysis)

3. **Channels**
   - Discovery channels (how customers find this product)
   - Sales channels (how they purchase)
   - Delivery channels (how they consume)

4. **Customer Relationships**
   - Self-service vs high-touch
   - Community aspects
   - Support model

5. **Revenue Streams**
   - Primary revenue model for this product type
   - Pricing tiers
   - One-time vs recurring

6. **Key Resources**
   - Content/IP required
   - Technology/platform
   - Human resources
   - Shared resources with other products

7. **Key Activities**
   - Creation activities
   - Marketing activities
   - Delivery/operations
   - Ongoing maintenance

8. **Key Partnerships**
   - Platform partnerships (Teachable, Spotify, Amazon, etc.)
   - Content/influencer partnerships
   - Technology partners

9. **Cost Structure**
   - Fixed costs
   - Variable costs per unit
   - Shared costs across products
</canvas_blocks>
</step>

<step n="3" goal="Create Lite Business Models (Tier 2)">
<action>For each Tier 2 product, create a simplified business model</action>

<lite_model>
- Target customer segment
- Core value proposition
- Primary revenue model
- Key resources required
- Estimated launch investment
- Expected timeline to profitability
</lite_model>
</step>

<step n="4" goal="Unit Economics Per Product">
<action>Calculate unit economics for each product</action>

<unit_economics>
For each product calculate:

1. **Customer Acquisition Cost (CAC)**
   - Marketing spend estimate
   - Conversion funnel assumptions
   - Channel-specific CAC

2. **Lifetime Value (LTV)**
   - Average order value / subscription price
   - Repeat purchase rate / retention rate
   - Customer lifespan

3. **LTV:CAC Ratio**
   - Target: >= 3:1
   - Flag products below 2:1

4. **Payback Period**
   - Months to recover CAC
   - Target: <= 12 months

5. **Gross Margin**
   - Revenue - COGS
   - Product-specific margin profile

6. **Contribution Margin**
   - Gross margin - variable costs
   - Per-unit profitability
</unit_economics>
</step>

<step n="5" goal="Financial Projections Per Product">
<action>Create {{planning_horizon}} financial projections for each Tier 1 product</action>

<projection_model>
For each product, project monthly for Year 1, quarterly for Years 2-3:

**Revenue Projections**
- Customer acquisition trajectory
- Pricing assumptions
- Revenue recognition timing

**Cost Projections**
- Development/creation costs
- Marketing costs
- Platform/hosting costs
- Support costs
- Shared overhead allocation

**P&L Summary**
- Revenue
- COGS
- Gross Profit
- Operating Expenses
- Net Income
- Cumulative Cash Flow
</projection_model>

<assumptions>
Document all assumptions clearly:
- Customer growth rate (justify with market data)
- Churn rate (use industry benchmarks)
- Pricing changes
- Cost inflation
</assumptions>
</step>

<step n="6" goal="Cross-Product Synergy Analysis">
<action>Analyze how products work together</action>

<synergy_types>
1. **Content Synergies**
   - Can course content become book chapters?
   - Can podcast episodes become YouTube videos?
   - Can blog posts drive traffic to courses?

2. **Audience Synergies**
   - Cross-sell opportunities
   - Audience sharing
   - Email list leverage

3. **Resource Synergies**
   - Shared team members
   - Shared technology/tools
   - Shared marketing budget

4. **Brand Synergies**
   - Brand reinforcement
   - Authority building
   - Market positioning
</synergy_types>

<action>Quantify synergies where possible</action>

<synergy_metrics>
- Estimated cross-sell conversion rate
- Shared cost savings
- Combined audience reach
- Authority multiplier
</synergy_metrics>
</step>

<step n="7" goal="Cannibalization Risk Assessment">
<action>Identify risks where products compete with each other</action>

<cannibalization_risks>
- Do products target same customer with similar value?
- Will one product reduce demand for another?
- Are pricing conflicts present?
- Is there customer confusion risk?
</cannibalization_risks>

<action>Recommend mitigations for identified risks</action>

<mitigation_strategies>
- Clear product positioning differentiation
- Bundle pricing strategies
- Customer journey mapping to appropriate products
- Feature differentiation
</mitigation_strategies>
</step>

<step n="8" goal="Resource Allocation & Sequencing">
<action>Create resource allocation plan across products</action>

<resource_plan>
**Shared Resources**
- Team time allocation per product
- Budget allocation per phase
- Technology/tool investments

**Sequencing Rationale**
- Which products to build first and why
- Dependencies between products
- Market timing considerations

**Capacity Planning**
- Maximum products in parallel
- Bottleneck resources
- Hiring/outsourcing needs
</resource_plan>
</step>

<step n="9" goal="Consolidated Financial Summary">
<action>Roll up all product financials into consolidated view</action>

<consolidated_financials>
**Portfolio Summary ({{planning_horizon}})**
| Product | Y1 Revenue | Y2 Revenue | Y3 Revenue | Y3 Profit |
|---------|------------|------------|------------|-----------|
| {{product_1}} | $X | $X | $X | $X |
| {{product_2}} | $X | $X | $X | $X |
| **Total** | $X | $X | $X | $X |

**Investment Requirements**
- Total development costs
- Marketing launch budget
- Working capital needs
- Contingency reserve

**Key Metrics (Year 3)**
- Total Annual Revenue
- Blended Gross Margin
- Portfolio LTV:CAC
- Break-even timeline

**Scenario Analysis**
- Conservative case (50% of targets)
- Base case (projected targets)
- Optimistic case (150% of targets)
</consolidated_financials>
</step>

<step n="10" goal="Product Roadmap Visualization">
<action>Create visual roadmap for product portfolio</action>

<roadmap_elements>
- Launch dates per product
- Revenue milestones
- Team/resource assignments
- Key dependencies
- Decision gates
</roadmap_elements>

<gantt_style>
| Product | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 | M10 | M11 | M12 |
|---------|Build|Build|Launch|Grow|...|...|...|...|...|...|...|...|
</gantt_style>
</step>

<step n="11" goal="Handoff to Branding (BMB)">
<action>Prepare structured output for BMB module</action>

<bmb_handoff>
```json
{
  "business_id": "{{business_id}}",
  "planning_date": "{{date}}",
  "products": [
    {
      "product_code": "BME-COURSE",
      "product_name": "{{name}}",
      "tier": 1,
      "target_audience": "{{audience}}",
      "value_proposition": "{{value_prop}}",
      "positioning": "{{positioning}}",
      "brand_requirements": {
        "voice_tone": "{{tone}}",
        "visual_style": "{{style}}",
        "key_messages": ["{{msg1}}", "{{msg2}}"]
      },
      "launch_phase": 1
    }
  ],
  "portfolio_positioning": "{{overall_positioning}}",
  "brand_synergies": ["{{synergy1}}", "{{synergy2}}"]
}
```
</bmb_handoff>
</step>

<step n="12" goal="Compile and Validate">
<action>Populate template with all business plans</action>
<action>Verify financial calculations are correct</action>
<action>Check all assumptions are documented</action>
<action>Run validation checklist</action>
<action>Save multi-product plan document</action>
</step>

</workflow>
