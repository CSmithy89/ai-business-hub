# Financial Projections - Workflow Instructions

<critical>
Load the workflow configuration: {installed_path}/workflow.yaml
Use the Finance agent (Ledger) persona for this workflow
All assumptions MUST be documented
Cite sources for benchmarks
Provide conservative/realistic/optimistic scenarios
Communicate in {communication_language}
</critical>

<workflow>

<step n="1" goal="Gather inputs and context">
<action>Load required input documents:</action>
- Business Model Canvas (required)
- Pricing Strategy (if available)
- Market Sizing from BMV (if available)

<action>Extract key inputs:</action>
- Revenue model structure
- Pricing tiers and levels
- Cost structure outline
- Market size ceiling (TAM/SAM/SOM)

<check if="no business model canvas">
  <ask>I need the Business Model Canvas to create financial projections. Would you like to create one first?</ask>
  <action>If no canvas exists, recommend running business-model-canvas workflow first</action>
</check>

<template-output>inputs_gathered</template-output>
</step>

<step n="2" goal="Document all assumptions">
<critical>This step is mandatory - no projections without documented assumptions</critical>

<action>Gather and document assumptions for each category:</action>

**Revenue Assumptions:**
<ask>What is your expected monthly starting revenue (or $0 for pre-revenue)?</ask>
<ask>What is your target monthly growth rate?</ask>
<ask>What is your expected average revenue per user (ARPU)?</ask>
<ask>What conversion rate do you expect (if freemium)?</ask>

**Customer Assumptions:**
<ask>How many customers do you expect to acquire monthly in Year 1?</ask>
<ask>What is your expected monthly churn rate?</ask>
<ask>What is the average customer lifetime (in months)?</ask>

**Cost Assumptions:**
<ask>What are your expected monthly fixed costs (team, office, tools)?</ask>
<ask>What is your variable cost per customer?</ask>
<ask>What is your planned marketing spend as % of revenue?</ask>

<action>For each assumption, document:</action>
- The assumption value
- Rationale or source
- Confidence level (High/Medium/Low)

<action>Flag assumptions that need validation</action>

<template-output>assumptions_documented</template-output>
</step>

<step n="3" goal="Calculate unit economics">
<action>Calculate core unit economics metrics:</action>

**Customer Acquisition Cost (CAC):**
```
CAC = Total Sales & Marketing Spend / New Customers Acquired
```

**Customer Lifetime Value (LTV):**
```
Customer Lifetime = 1 / Monthly Churn Rate
LTV = ARPU × Gross Margin % × Customer Lifetime (months)
```

**LTV:CAC Ratio:**
```
LTV:CAC = LTV / CAC
Target: > 3:1 for healthy business
```

**CAC Payback Period:**
```
Payback = CAC / (ARPU × Gross Margin %)
Target: < 12 months
```

<action>Compare to industry benchmarks:</action>
- SaaS LTV:CAC benchmark: 3-5x
- SaaS churn benchmark: <5% monthly
- SaaS payback benchmark: <12 months

<action>Flag any metrics outside healthy ranges</action>

<template-output>unit_economics</template-output>
</step>

<step n="4" goal="Build revenue projections">
<action>Build revenue model based on business model type:</action>

**Subscription Revenue:**
```
MRR = Existing MRR + New MRR - Churned MRR + Expansion MRR
ARR = MRR × 12
```

**Usage-Based Revenue:**
```
Revenue = Units Consumed × Price per Unit
```

**Marketplace Revenue:**
```
Revenue = GMV × Take Rate
```

<action>Project by period:</action>
- Year 1: Monthly projections
- Year 2-3: Quarterly projections
- Year 4-5: Annual projections

<action>Apply scenario adjustments:</action>
- Conservative: growth rate -30%
- Realistic: baseline assumptions
- Optimistic: growth rate +30%

<template-output>revenue_projections</template-output>
</step>

<step n="5" goal="Build cost projections">
<action>Categorize and project costs:</action>

**Fixed Costs (monthly):**
- Salaries and wages
- Rent/office
- Software and tools
- Insurance
- Professional services

**Variable Costs (per customer/unit):**
- Server/infrastructure
- Payment processing
- Support costs
- Fulfillment

**Cost of Goods Sold (COGS):**
- Direct costs of delivery
- Third-party services
- Platform fees

<action>Project cost growth:</action>
- Step function for hiring
- Linear scaling for variable costs
- Economies of scale where applicable

<action>Calculate gross margin:</action>
```
Gross Margin = (Revenue - COGS) / Revenue
```

<template-output>cost_projections</template-output>
</step>

<step n="6" goal="Create Pro Forma P&L">
<action>Build income statement with proper periods:</action>

| Line Item | Year 1 (Mo) | Year 2 (Qtr) | Year 3 (Qtr) | Year 4 | Year 5 |
|-----------|-------------|--------------|--------------|--------|--------|
| Revenue | | | | | |
| COGS | | | | | |
| **Gross Profit** | | | | | |
| Sales & Marketing | | | | | |
| R&D / Product | | | | | |
| G&A | | | | | |
| **EBITDA** | | | | | |
| D&A | | | | | |
| Interest | | | | | |
| Tax | | | | | |
| **Net Income** | | | | | |

<action>Calculate key P&L metrics:</action>
- Gross margin %
- Operating margin %
- Net margin %
- Path to profitability

<template-output>income_statement</template-output>
</step>

<step n="7" goal="Create cash flow projection">
<action>Build cash flow statement:</action>

**Operating Cash Flow:**
- Net income
- Add: Depreciation/Amortization
- Changes in working capital

**Investing Cash Flow:**
- Capital expenditures
- Equipment purchases

**Financing Cash Flow:**
- Equity raised
- Debt raised/repaid

<action>Calculate key cash metrics:</action>
```
Monthly Burn Rate = Cash Outflow - Cash Inflow
Runway = Cash Balance / Monthly Burn Rate
```

<template-output>cash_flow</template-output>
</step>

<step n="8" goal="Calculate funding requirements">
<action>Determine funding needs:</action>

**Funding Calculation:**
```
Funding Needed = Total Expenses Until Profitability + Buffer (20%)
```

<action>Define use of funds:</action>
- Product development: X%
- Sales & Marketing: X%
- Operations: X%
- Buffer/Contingency: X%

<action>Suggest funding stages:</action>
- Pre-seed: MVP to initial traction
- Seed: Growth and validation
- Series A: Scale
- Series B: Expansion

<action>Calculate implied runway post-funding</action>

<template-output>funding_requirements</template-output>
</step>

<step n="9" goal="Perform sensitivity analysis">
<action>Identify key drivers and test sensitivity:</action>

**Key Drivers:**
- Customer growth rate
- Churn rate
- ARPU
- CAC

<action>Show impact of +/- 20% change on:</action>
- Year 3 revenue
- Time to profitability
- Total funding required

<action>Identify which assumptions matter most</action>

<template-output>sensitivity_analysis</template-output>
</step>

<step n="10" goal="Generate final output">
<action>Compile complete financial projections using template</action>
<action>Include all three scenarios</action>
<action>Highlight key metrics and milestones</action>
<action>Add assumptions appendix</action>
<action>Note areas of high uncertainty</action>
<action>Save to {default_output_file}</action>

<template-output>final_projections</template-output>
</step>

</workflow>
