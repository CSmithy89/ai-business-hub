# Market Sizing Workflow Instructions

<critical>The workflow execution engine is governed by: {project-root}/.bmad/core/tasks/workflow.xml</critical>
<critical>ANTI-HALLUCINATION PROTOCOL IS MANDATORY - Every number requires source citations</critical>
<critical>Use jina-ai MCP tools for all web research</critical>

<workflow>

<step n="1" goal="Context Loading and Setup">
<action>Load idea intake document if provided at {{idea_intake_path}}</action>
<action>Extract market description, target customer, and product category</action>
<action>Confirm geographic scope: {{geographic_scope}}</action>
<action>Confirm segment focus: {{segment_focus}}</action>

<output>
**Market to Size**: {{market_description}}
**Geographic Scope**: {{geographic_scope}}
**Segment Focus**: {{segment_focus}}

Proceeding with TAM/SAM/SOM calculation using three methodologies.
</output>
</step>

<step n="2" goal="Initial Market Research">
<action>Use jina-ai search_web for market research queries</action>

<searches>
1. "{{market_description}} market size {{current_year}}"
2. "{{market_description}} TAM total addressable market"
3. "{{market_description}} market forecast CAGR growth"
4. "{{market_description}} industry report Gartner Forrester IDC"
5. "{{market_description}} market {{geographic_scope}} size"
</searches>

<action>For each promising result, use jina-ai read_url to extract data</action>
<action>Record ALL sources with: Title, Publisher, Date, URL</action>
<action>Note any paywalled sources that need attribution</action>

<critical>DO NOT proceed without at least 2 credible sources for TAM</critical>
</step>

<step n="3" goal="Top-Down TAM Calculation">
<methodology>
Start with total industry size, apply filters to narrow to addressable market.
</methodology>

<calculation>
TAM_topdown = Industry Size × Relevant Segment % × Geographic Filter
</calculation>

<actions>
1. Find total industry/category size from analyst reports
2. Apply segment-specific percentage if targeting subset
3. Apply geographic filter for {{geographic_scope}}
4. Document each number with source citation
</actions>

<output_format>
### Top-Down TAM Calculation

**Step 1: Total Industry Size**
- Industry: {{industry_name}}
- Global Size: ${{global_size}} [Source: {{source_1}}]
- Year: {{data_year}}

**Step 2: Segment Filter**
- Target Segment: {{segment_name}}
- Segment %: {{segment_pct}}% [Source: {{source_2}}]

**Step 3: Geographic Filter**
- Region: {{geographic_scope}}
- Regional %: {{geo_pct}}% [Source: {{source_3}}]

**Top-Down TAM**: ${{tam_topdown}}
**Confidence**: [High/Medium/Low]
**Sources**: [List all sources with URLs]
</output_format>
</step>

<step n="4" goal="Bottom-Up TAM Calculation">
<methodology>
Build up from unit economics: Total potential customers × Average revenue per customer
</methodology>

<calculation>
TAM_bottomup = Number of Potential Customers × ARPC (Average Revenue Per Customer)
</calculation>

<actions>
1. Identify total potential customers in target market
2. Research average revenue per customer / average contract value
3. Calculate TAM from first principles
4. Cross-reference with top-down for sanity check
</actions>

<searches>
1. "{{target_customer}} total number {{geographic_scope}}"
2. "{{product_category}} average pricing subscription cost"
3. "{{product_category}} ARPU average revenue per user"
4. "{{industry}} companies count {{geographic_scope}}"
</searches>

<output_format>
### Bottom-Up TAM Calculation

**Step 1: Total Potential Customers**
- Customer Type: {{customer_type}}
- Total Count: {{customer_count}} [Source: {{source_1}}]
- Region: {{geographic_scope}}

**Step 2: Average Revenue Per Customer**
- Pricing Research: [Sources reviewed]
- Average Price Point: ${{avg_price}} [Source: {{source_2}}]
- Billing: {{monthly/annual}}

**Bottom-Up TAM**: {{customer_count}} × ${{avg_price}} = ${{tam_bottomup}}
**Confidence**: [High/Medium/Low]
**Sources**: [List all sources with URLs]
</output_format>
</step>

<step n="5" goal="Value Theory TAM (Optional)">
<methodology>
Based on value delivered: How much value does the solution create, and what percentage would customers pay?
</methodology>

<calculation>
TAM_value = Total Value Created × Willingness to Pay %
</calculation>

<ask>Is there a clear value/ROI story for this solution? [yes/no/skip]</ask>

<actions if="yes">
1. Quantify the problem cost (time/money/risk saved)
2. Research willingness to pay for similar value propositions
3. Calculate value-based TAM
</actions>

<output_format>
### Value Theory TAM Calculation

**Value Proposition**
- Problem Cost: ${{problem_cost}} per {{unit}} [Source: {{source_1}}]
- Potential Customers Affected: {{affected_count}}
- Total Value at Stake: ${{total_value}}

**Willingness to Pay**
- Benchmark: Similar solutions capture {{capture_pct}}% of value
- Source: {{source_2}}

**Value Theory TAM**: ${{total_value}} × {{capture_pct}}% = ${{tam_value}}
**Confidence**: [High/Medium/Low]
</output_format>
</step>

<step n="6" goal="TAM Reconciliation">
<action>Compare all TAM calculations</action>
<action>Analyze differences and explain methodology variations</action>
<action>Select final TAM range with rationale</action>

<output_format>
### TAM Comparison

| Methodology | TAM Estimate | Confidence | Key Sources |
|-------------|--------------|------------|-------------|
| Top-Down | ${{tam_topdown}} | {{conf_1}} | {{sources_1}} |
| Bottom-Up | ${{tam_bottomup}} | {{conf_2}} | {{sources_2}} |
| Value Theory | ${{tam_value}} | {{conf_3}} | {{sources_3}} |

**Variance Analysis**: {{explain_differences}}

**Final TAM Range**: ${{tam_low}} - ${{tam_high}}
**Recommended TAM**: ${{tam_recommended}}
**Rationale**: {{selection_rationale}}
</output_format>
</step>

<step n="7" goal="SAM Calculation">
<action>Apply realistic constraints to narrow TAM to SAM</action>

<constraints>
- Product capability constraints (what can we actually serve?)
- Technology platform constraints (web vs mobile vs desktop)
- Language/localization constraints
- Industry vertical constraints
- Company size constraints
- Regulatory constraints
</constraints>

<output_format>
### SAM (Serviceable Addressable Market)

**Starting TAM**: ${{tam_recommended}}

**Constraints Applied**:

| Constraint | Reduction | Rationale | Source |
|------------|-----------|-----------|--------|
| {{constraint_1}} | {{pct_1}}% | {{reason_1}} | {{source_1}} |
| {{constraint_2}} | {{pct_2}}% | {{reason_2}} | {{source_2}} |
| {{constraint_3}} | {{pct_3}}% | {{reason_3}} | {{source_3}} |

**SAM Calculation**: ${{tam}} × {{remaining_pct}}% = ${{sam}}

**SAM as % of TAM**: {{sam_pct}}% (typical range: 10-40%)
**Confidence**: [High/Medium/Low]
</output_format>

<validation>
If SAM > 40% of TAM, verify constraints are realistic
If SAM < 10% of TAM, verify market is viable
</validation>
</step>

<step n="8" goal="SOM Projection">
<action>Project realistic market capture for years 1-3</action>
<action>Research comparable company trajectories</action>

<benchmarks>
- Typical Year 1: 0.1% - 1% of SAM for new entrants
- Typical Year 3: 1% - 5% of SAM for successful startups
- Use comparable companies as benchmarks
</benchmarks>

<searches>
1. "{{product_category}} market share leaders"
2. "{{comparable_company}} market share growth"
3. "startup market penetration first year {{industry}}"
</searches>

<output_format>
### SOM (Serviceable Obtainable Market)

**SAM Base**: ${{sam}}

**Comparable Benchmarks**:
- {{comparable_1}}: {{share_1}}% in Year {{year_1}} [Source]
- {{comparable_2}}: {{share_2}}% in Year {{year_2}} [Source]

**Projected Market Share**:

| Year | Conservative | Realistic | Optimistic | Revenue |
|------|--------------|-----------|------------|---------|
| 1 | {{y1_cons}}% | {{y1_real}}% | {{y1_opt}}% | ${{rev_y1}} |
| 2 | {{y2_cons}}% | {{y2_real}}% | {{y2_opt}}% | ${{rev_y2}} |
| 3 | {{y3_cons}}% | {{y3_real}}% | {{y3_opt}}% | ${{rev_y3}} |

**Assumptions**:
- {{assumption_1}}
- {{assumption_2}}
- {{assumption_3}}
</output_format>
</step>

<step n="9" goal="Growth Rate Analysis">
<action>Research market growth rates (CAGR)</action>
<action>Project market size at future dates</action>

<searches>
1. "{{market_description}} CAGR forecast {{current_year}}-{{future_year}}"
2. "{{market_description}} growth rate projection"
</searches>

<output_format>
### Market Growth Analysis

**Historical Growth**:
- Past 5 years CAGR: {{historical_cagr}}% [Source]

**Projected Growth**:
- {{current_year}}-{{future_year}} CAGR: {{projected_cagr}}% [Source: {{source}}]

**Future TAM Projection**:
| Year | TAM | Growth |
|------|-----|--------|
| {{current_year}} | ${{tam_current}} | - |
| {{year_plus_1}} | ${{tam_1}} | {{growth_1}}% |
| {{year_plus_3}} | ${{tam_3}} | {{growth_3}}% |
| {{year_plus_5}} | ${{tam_5}} | {{growth_5}}% |

**Growth Drivers**: {{growth_drivers}}
**Growth Risks**: {{growth_risks}}
</output_format>
</step>

<step n="10" goal="Source Documentation and Confidence Assessment">
<action>Compile all sources used with full citations</action>
<action>Assess overall confidence level</action>
<action>Identify gaps requiring additional research</action>

<output_format>
### Source Documentation

**High Credibility Sources** (Analyst firms, government data):
{{high_credibility_sources}}

**Medium Credibility Sources** (Industry publications, company data):
{{medium_credibility_sources}}

**Lower Credibility Sources** (Blogs, estimates):
{{lower_credibility_sources}}

### Confidence Assessment

| Metric | Confidence | Rationale |
|--------|------------|-----------|
| TAM | {{tam_conf}} | {{tam_rationale}} |
| SAM | {{sam_conf}} | {{sam_rationale}} |
| SOM | {{som_conf}} | {{som_rationale}} |
| Growth | {{growth_conf}} | {{growth_rationale}} |

**Overall Confidence**: {{overall_confidence}}

### Gaps and Limitations
{{gaps_limitations}}

### Recommended Follow-Up Research
{{followup_research}}
</output_format>
</step>

<step n="11" goal="Compile and Save">
<action>Populate the template with all findings</action>
<action>Run validation checklist</action>
<action>Save the market sizing document</action>
<action>Emit completion event</action>

<output>
Market sizing complete. Saved to: {{output_file}}

**Summary**:
- TAM: ${{tam_range}}
- SAM: ${{sam_range}}
- SOM Y3: ${{som_y3_range}}
- Confidence: {{overall_confidence}}

Next: Run competitor-mapping or customer-discovery workflow.
</output>
</step>

</workflow>
