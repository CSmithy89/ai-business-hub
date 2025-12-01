# BMV Module - Expanded Component Research

## Overview

This document expands upon the core BMV research findings with additional workflows, tools, checklists, and standalone tasks to create a comprehensive Business Validation module.

---

## Part 1: Additional Workflows (Beyond 5 Core)

### 1.1 Quick Validation Workflow (`quick-validation`)

**Purpose**: Rapid 30-minute validation for early-stage ideas before committing to full validation.

```yaml
name: quick-validation
description: "Rapid business idea sanity check - get initial viability signals in 30 minutes"
config_source: "{project-root}/.bmad/bmv/config.yaml"
installed_path: "{project-root}/.bmad/bmv/workflows/quick-validation"
template: "{installed_path}/template.md"
instructions: "{installed_path}/instructions.md"
validation: "{installed_path}/checklist.md"
default_output_file: "{output_folder}/quick-validation-{{date}}.md"
```

**Key Steps**:
1. Idea statement capture (1 sentence problem, 1 sentence solution)
2. 5-minute competitive search (are there existing solutions?)
3. Market existence check (is someone paying for this problem?)
4. Founder-market fit assessment
5. Go/Explore/No-Go decision

**Output**: Quick validation scorecard with recommendation

---

### 1.2 Assumption Testing Workflow (`assumption-test`)

**Purpose**: Systematic identification and testing of critical business assumptions.

```yaml
name: assumption-test
description: "Identify and systematically test the riskiest assumptions underlying your business idea"
config_source: "{project-root}/.bmad/bmv/config.yaml"
installed_path: "{project-root}/.bmad/bmv/workflows/assumption-test"
template: "{installed_path}/template.md"
instructions: "{installed_path}/instructions.md"
validation: "{installed_path}/checklist.md"
assumption_types: "{installed_path}/assumption-types.csv"
default_output_file: "{output_folder}/assumption-test-{{date}}.md"
```

**Assumption Categories**:
- **Desirability**: Do customers want this?
- **Feasibility**: Can we build this?
- **Viability**: Can we make money?
- **Adaptability**: Can we pivot if needed?

**Testing Methods**:
- Customer interviews
- Landing page tests
- Smoke tests
- Wizard of Oz MVP
- Concierge MVP

---

### 1.3 Pivot Analysis Workflow (`pivot-analysis`)

**Purpose**: When validation signals suggest pivoting, analyze pivot options systematically.

```yaml
name: pivot-analysis
description: "Analyze pivot options when validation signals suggest course correction is needed"
config_source: "{project-root}/.bmad/bmv/config.yaml"
installed_path: "{project-root}/.bmad/bmv/workflows/pivot-analysis"
template: "{installed_path}/template.md"
instructions: "{installed_path}/instructions.md"
validation: "{installed_path}/checklist.md"
pivot_types: "{installed_path}/pivot-types.csv"
default_output_file: "{output_folder}/pivot-analysis-{{date}}.md"
```

**Pivot Types** (from Lean Startup):
- Zoom-in pivot (feature becomes product)
- Zoom-out pivot (product becomes feature)
- Customer segment pivot
- Customer need pivot
- Platform pivot
- Business architecture pivot
- Value capture pivot
- Engine of growth pivot
- Channel pivot
- Technology pivot

---

### 1.4 Validation Update Workflow (`validation-update`)

**Purpose**: Update existing validation documents with new market data and competitive intelligence.

```yaml
name: validation-update
description: "Refresh and update existing validation documents with current market intelligence"
config_source: "{project-root}/.bmad/bmv/config.yaml"
installed_path: "{project-root}/.bmad/bmv/workflows/validation-update"
template: false  # Updates existing documents
instructions: "{installed_path}/instructions.md"
validation: "{installed_path}/checklist.md"
default_output_file: "{output_folder}/validation-update-{{date}}.md"
```

**Update Triggers**:
- Quarterly review cycle
- Major market event
- New competitor entry
- Customer feedback shifts
- Economic conditions change

---

### 1.5 Export to Planning Workflow (`export-to-planning`)

**Purpose**: Transform validated business concepts into BMM-compatible planning artifacts.

```yaml
name: export-to-planning
description: "Export validated business concept to product brief for BMM planning workflows"
config_source: "{project-root}/.bmad/bmv/config.yaml"
installed_path: "{project-root}/.bmad/bmv/workflows/export-to-planning"
template: "{installed_path}/template.md"
instructions: "{installed_path}/instructions.md"
validation: "{installed_path}/checklist.md"
bmm_integration: "{project-root}/.bmad/bmm/workflows/1-analysis/product-brief"
default_output_file: "{output_folder}/validated-product-brief-{{date}}.md"
```

**Handoff Artifacts**:
- Product brief (BMM Phase 1 input)
- Market research summary
- Competitive positioning map
- Customer persona profiles
- Risk register with mitigations

---

### 1.6 Validation Dashboard Workflow (`validation-status`)

**Purpose**: Generate a consolidated view of all validation activities and their status.

```yaml
name: validation-status
description: "Generate consolidated validation dashboard showing all validation activities and scores"
config_source: "{project-root}/.bmad/bmv/config.yaml"
installed_path: "{project-root}/.bmad/bmv/workflows/validation-status"
template: "{installed_path}/template.md"
instructions: "{installed_path}/instructions.md"
default_output_file: "{output_folder}/validation-dashboard-{{date}}.md"
```

---

## Part 2: Tools and Integrations

### 2.1 MCP Server Integrations

| Tool | Purpose | Integration Type |
|------|---------|-----------------|
| `jina-ai` | Web search, content reading | Market research, competitor data |
| `context7` | Library documentation | Tech stack validation |
| `playwright` | Browser automation | Landing page testing, competitor screenshots |
| `deepwiki` | Repository documentation | Open source competitor analysis |

### 2.2 External Data Source Tools

#### Market Data Sources
```yaml
market_data_tools:
  statista:
    type: "paid_api"
    use_case: "Market size, industry statistics"
    fallback: "Web search for Statista citations"

  similarweb:
    type: "freemium_api"
    use_case: "Website traffic, competitive benchmarks"
    fallback: "Manual website analysis"

  crunchbase:
    type: "freemium_api"
    use_case: "Startup funding, company data"
    fallback: "Web search for funding announcements"

  g2_crowd:
    type: "web_scrape"
    use_case: "Software reviews, competitive ratings"
    integration: "playwright screenshots + jina read"

  government_data:
    type: "free_api"
    use_case: "Census data, industry reports"
    sources:
      - "data.gov"
      - "census.gov"
      - "bls.gov"
```

### 2.3 Internal Tool Tasks

#### Source Validator Tool (`validate-sources.xml`)
```xml
<task id="validate-sources" name="Source Validator" standalone="true">
  <purpose>Validate all cited sources in a document are accessible and credible</purpose>
  <inputs>
    <input name="document_path" required="true">Path to document with citations</input>
  </inputs>
  <flow>
    <step n="1">Extract all URLs and citations from document</step>
    <step n="2">Check URL accessibility (200 response)</step>
    <step n="3">Verify source credibility against whitelist</step>
    <step n="4">Flag broken links and low-credibility sources</step>
    <step n="5">Generate source validation report</step>
  </flow>
</task>
```

#### TAM Calculator Tool (`calculate-tam.xml`)
```xml
<task id="calculate-tam" name="TAM/SAM/SOM Calculator" standalone="true">
  <purpose>Calculate market sizing with multiple methodologies</purpose>
  <methodologies>
    <method name="top_down">Industry size → filters → TAM</method>
    <method name="bottom_up">Units × Price × Segments → TAM</method>
    <method name="value_theory">Value delivered × Willingness to pay → TAM</method>
  </methodologies>
  <anti_hallucination>
    <rule>Every number requires source citation</rule>
    <rule>Show calculation methodology transparently</rule>
    <rule>Present range (conservative/realistic/optimistic)</rule>
  </anti_hallucination>
</task>
```

---

## Part 3: Checklists for Each Validation Stage

### 3.1 Idea Intake Checklist (`idea-intake-checklist.md`)

```markdown
# Idea Intake Validation Checklist

## Problem Definition
- [ ] Problem statement is specific (not generic)
- [ ] Target customer segment is identified
- [ ] Problem frequency/severity is assessed (daily/weekly/monthly, annoying/painful/critical)
- [ ] Current alternatives documented (including "do nothing")
- [ ] Why now? - timing justification provided

## Solution Clarity
- [ ] Solution described without jargon
- [ ] Key features vs nice-to-haves distinguished
- [ ] Unfair advantage articulated (if any)
- [ ] Technical feasibility assessed (buildable in reasonable time)

## Founder Fit
- [ ] Founder expertise in problem domain assessed
- [ ] Passion/commitment level documented
- [ ] Resource availability (time, money, team)
- [ ] Risk tolerance understood

## Initial Signals
- [ ] Quick Google search completed (competitors exist?)
- [ ] Reddit/forum search for problem discussions
- [ ] Personal network pinged for feedback
- [ ] Initial gut-check: exciting enough to pursue?

## Ready for Validation
- [ ] Idea documented in standard template
- [ ] Initial assumptions identified
- [ ] Go/No-Go decision for deeper validation made
```

### 3.2 Market Sizing Checklist (`market-sizing-checklist.md`)

```markdown
# Market Sizing Validation Checklist

## Source Requirements (CRITICAL)
- [ ] TAM has 2+ independent source citations
- [ ] SAM methodology is transparent and sourced
- [ ] SOM estimates are conservative with benchmarks
- [ ] Growth rates corroborated by multiple analysts
- [ ] All sources from current year or within 2 years

## TAM Calculation
- [ ] Top-down calculation completed with sources
- [ ] Bottom-up calculation completed with sources
- [ ] Value-theory calculation completed (if applicable)
- [ ] All three methods compared and reconciled
- [ ] Final TAM range provided (not single number)

## SAM Refinement
- [ ] Geographic constraints applied
- [ ] Segment-specific filters applied
- [ ] Technology/platform constraints applied
- [ ] Regulatory constraints considered
- [ ] SAM as percentage of TAM is realistic (typically 10-40%)

## SOM Projection
- [ ] Year 1-3 projections provided
- [ ] Market share assumptions are conservative (<5% typically)
- [ ] Comparable company benchmarks cited
- [ ] Growth trajectory is realistic
- [ ] Scenarios: Conservative / Realistic / Optimistic

## Anti-Hallucination Verification
- [ ] No invented statistics
- [ ] All percentages traceable to sources
- [ ] Round numbers verified against sources
- [ ] "Industry experts" claims have named sources
- [ ] Conflicting data from sources is presented, not hidden

## Confidence Assessment
- [ ] High confidence claims (2+ sources) counted
- [ ] Medium confidence (1 source) claims flagged
- [ ] Low confidence (estimated) claims clearly marked
- [ ] Overall market sizing confidence level assigned
```

### 3.3 Competitor Analysis Checklist (`competitor-analysis-checklist.md`)

```markdown
# Competitor Analysis Validation Checklist

## Competitor Identification
- [ ] Direct competitors identified (same problem, same solution)
- [ ] Indirect competitors identified (same problem, different solution)
- [ ] Substitutes identified (different problem, competing budget)
- [ ] Potential entrants assessed (who could enter easily?)
- [ ] At least 5-10 competitors profiled

## Data Source Verification
- [ ] Every competitor has source for basic info
- [ ] Pricing data from official sources (URLs included)
- [ ] Funding data from Crunchbase/PitchBook/SEC
- [ ] Features from official documentation
- [ ] Customer counts from verified sources

## Competitive Intelligence
- [ ] Positioning map created with relevant dimensions
- [ ] Feature comparison matrix completed
- [ ] Pricing comparison table created
- [ ] Funding/growth trajectory analyzed
- [ ] Recent news (last 6 months) captured

## Porter's Five Forces
- [ ] Threat of new entrants assessed
- [ ] Bargaining power of suppliers assessed
- [ ] Bargaining power of buyers assessed
- [ ] Threat of substitutes assessed
- [ ] Competitive rivalry assessed
- [ ] Overall industry attractiveness rated

## Strategic Gaps Identified
- [ ] Underserved segments identified
- [ ] Feature gaps mapped
- [ ] Pricing opportunities found
- [ ] Geographic white spaces noted
- [ ] Positioning opportunities documented

## Differentiation Strategy
- [ ] Clear differentiation articulated
- [ ] Sustainable advantage assessed
- [ ] Switching costs analyzed
- [ ] Network effects potential evaluated
- [ ] Moat building strategy outlined
```

### 3.4 Customer Discovery Checklist (`customer-discovery-checklist.md`)

```markdown
# Customer Discovery Validation Checklist

## Customer Segment Definition
- [ ] Primary target segment clearly defined
- [ ] Segment size estimated with sources
- [ ] Demographics/firmographics documented
- [ ] Psychographics and behaviors captured
- [ ] Jobs-to-be-Done framework applied

## Pain Point Validation
- [ ] Pain points sourced from research (not assumed)
- [ ] Frequency of pain point occurrence documented
- [ ] Severity of pain point assessed
- [ ] Current workarounds identified
- [ ] Cost of current workarounds quantified

## Customer Research Sources
- [ ] Review sites analyzed (G2, Capterra, TrustPilot)
- [ ] Forum/community discussions captured
- [ ] Social media sentiment analyzed
- [ ] Industry reports referenced
- [ ] Primary research cited (if conducted)

## Persona Development
- [ ] 2-3 primary personas created
- [ ] Personas based on real data (not fictional)
- [ ] Each persona has distinct needs documented
- [ ] Persona priorities and objections captured
- [ ] Persona journey mapped

## Willingness to Pay
- [ ] Price sensitivity researched
- [ ] Comparable product pricing analyzed
- [ ] Value-based pricing potential assessed
- [ ] Price tier strategy outlined
- [ ] Revenue model validated

## Customer Acquisition
- [ ] Primary channels identified
- [ ] Channel cost estimates provided
- [ ] Customer acquisition cost (CAC) projected
- [ ] Customer lifetime value (LTV) estimated
- [ ] LTV:CAC ratio assessed (target >3:1)

## Anti-Hallucination Check
- [ ] No invented customer quotes
- [ ] All statistics have sources
- [ ] Assumptions clearly labeled
- [ ] Confidence levels assigned
```

### 3.5 Validation Synthesis Checklist (`synthesis-checklist.md`)

```markdown
# Validation Synthesis Checklist

## Input Document Review
- [ ] Idea intake document reviewed
- [ ] Market sizing document reviewed
- [ ] Competitor analysis reviewed
- [ ] Customer discovery reviewed
- [ ] All source citations verified

## Cross-Document Consistency
- [ ] Market size numbers consistent across docs
- [ ] Target customer consistent across docs
- [ ] Competitive positioning consistent
- [ ] Pricing assumptions consistent
- [ ] Timeline assumptions consistent

## Validation Score Components
- [ ] Problem validation score assigned (0-10)
- [ ] Market validation score assigned (0-10)
- [ ] Competitive validation score assigned (0-10)
- [ ] Customer validation score assigned (0-10)
- [ ] Overall validation score calculated

## Risk Assessment
- [ ] All major risks identified and categorized
- [ ] Risk probability assessed (Low/Medium/High)
- [ ] Risk impact assessed (Low/Medium/High)
- [ ] Mitigation strategies defined
- [ ] Risk register is comprehensive

## Go/No-Go Decision Framework
- [ ] Decision criteria defined
- [ ] Minimum thresholds established
- [ ] Deal-breakers identified
- [ ] Recommendation is clear and justified
- [ ] Next steps are actionable

## Export Readiness
- [ ] Summary document is standalone readable
- [ ] Key metrics are highlighted
- [ ] Action items are prioritized
- [ ] Handoff to planning is clear
- [ ] Follow-up research needs documented
```

---

## Part 4: Standalone Tasks

### 4.1 Source Validation Task

```xml
<task id="{bmad_folder}/bmv/tasks/validate-sources.xml"
      name="Source Validator"
      standalone="true"
      mcp_tools="jina-ai">

  <llm critical="true">
    <i>This task validates all cited sources in validation documents</i>
    <i>Ensures anti-hallucination protocol compliance</i>
    <i>Uses jina-ai MCP server for URL verification</i>
  </llm>

  <purpose>
    Validate accessibility and credibility of all sources cited in BMV documents.
    Essential for maintaining research integrity and anti-hallucination compliance.
  </purpose>

  <inputs>
    <input name="document_path" required="true">
      Path to the validation document to check
    </input>
    <input name="credibility_threshold" required="false" default="medium">
      Minimum credibility level (low/medium/high)
    </input>
  </inputs>

  <credibility_whitelist>
    <tier name="high">
      <source>Gartner</source>
      <source>Forrester</source>
      <source>IDC</source>
      <source>McKinsey</source>
      <source>BCG</source>
      <source>Deloitte</source>
      <source>Government (.gov)</source>
      <source>Academic (.edu)</source>
      <source>SEC Filings</source>
      <source>Crunchbase (verified)</source>
    </tier>
    <tier name="medium">
      <source>TechCrunch</source>
      <source>Forbes</source>
      <source>Bloomberg</source>
      <source>Reuters</source>
      <source>Industry publications</source>
      <source>Company press releases</source>
      <source>G2/Capterra reviews</source>
    </tier>
    <tier name="low">
      <source>Blog posts</source>
      <source>Social media</source>
      <source>Unverified claims</source>
      <source>Anonymous sources</source>
    </tier>
  </credibility_whitelist>

  <flow>
    <step n="1" title="Extract Citations">
      <action>Read the document at {{document_path}}</action>
      <action>Extract all URLs and source citations</action>
      <action>Create citation inventory with line numbers</action>
    </step>

    <step n="2" title="URL Accessibility Check">
      <action>For each URL, use jina-ai read_url to verify accessibility</action>
      <action>Record HTTP status and any redirects</action>
      <action>Flag broken links (4xx, 5xx errors)</action>
      <action>Note paywalled content that requires subscription</action>
    </step>

    <step n="3" title="Credibility Assessment">
      <action>Match each source against credibility whitelist</action>
      <action>Assign credibility tier (high/medium/low)</action>
      <action>Flag sources below {{credibility_threshold}}</action>
      <action>Identify claims with only low-credibility sources</action>
    </step>

    <step n="4" title="Generate Report">
      <format>
        ## Source Validation Report

        **Document**: {{document_path}}
        **Date**: {{current_date}}
        **Total Sources**: {{count}}

        ### Summary
        - High credibility: X sources
        - Medium credibility: X sources
        - Low credibility: X sources
        - Broken links: X
        - Paywalled: X

        ### Issues Found
        [List of broken links and low-credibility sources with line numbers]

        ### Recommendations
        [Specific suggestions for improving source quality]

        ### Compliance Status
        - [ ] Anti-hallucination compliant
        - [ ] All critical claims have 2+ sources
        - [ ] No broken links
      </format>
    </step>
  </flow>
</task>
```

### 4.2 TAM Calculator Task

```xml
<task id="{bmad_folder}/bmv/tasks/calculate-tam.xml"
      name="TAM/SAM/SOM Calculator"
      standalone="true"
      mcp_tools="jina-ai">

  <llm critical="true">
    <i>All numbers MUST have source citations</i>
    <i>Present ranges, not single numbers</i>
    <i>Show calculation methodology transparently</i>
  </llm>

  <purpose>
    Calculate Total Addressable Market, Serviceable Addressable Market, and
    Serviceable Obtainable Market using multiple methodologies with full
    source transparency.
  </purpose>

  <inputs>
    <input name="market_description" required="true">Description of the market to size</input>
    <input name="geographic_scope" required="true">Geographic boundaries (global, US, EU, etc.)</input>
    <input name="segment_focus" required="false">Specific segment if applicable</input>
    <input name="time_horizon" required="false" default="5">Years for projection</input>
  </inputs>

  <methodologies>
    <method name="top_down">
      <description>Start with total industry size, apply filters to narrow</description>
      <formula>TAM = Industry Size × Relevant Segment % × Geographic Filter</formula>
      <sources_required>Industry reports, analyst estimates</sources_required>
    </method>

    <method name="bottom_up">
      <description>Build up from unit economics</description>
      <formula>TAM = Number of Potential Customers × Average Revenue per Customer</formula>
      <sources_required>Census data, industry counts, pricing benchmarks</sources_required>
    </method>

    <method name="value_theory">
      <description>Based on value delivered to customers</description>
      <formula>TAM = Value Created × Share Customer Would Pay</formula>
      <sources_required>ROI studies, customer willingness to pay research</sources_required>
    </method>
  </methodologies>

  <flow>
    <step n="1" title="Research Phase">
      <action>Search for existing market size reports for {{market_description}}</action>
      <action>Use jina-ai search for: "{{market_description}} market size {{current_year}}"</action>
      <action>Use jina-ai search for: "{{market_description}} TAM SAM SOM"</action>
      <action>Document all sources found with URLs and dates</action>
    </step>

    <step n="2" title="Top-Down Calculation">
      <action>Find total industry size from analyst reports</action>
      <action>Apply geographic filter for {{geographic_scope}}</action>
      <action>Apply segment filter if {{segment_focus}} specified</action>
      <action>Calculate: TAM_topdown = [formula with numbers and sources]</action>
    </step>

    <step n="3" title="Bottom-Up Calculation">
      <action>Identify total potential customers in {{geographic_scope}}</action>
      <action>Research average revenue per customer in this market</action>
      <action>Calculate: TAM_bottomup = Customers × ARPC</action>
      <action>Cross-reference with top-down for sanity check</action>
    </step>

    <step n="4" title="SAM Calculation">
      <action>Apply product/service-specific constraints</action>
      <action>Apply technology platform constraints</action>
      <action>Apply realistic reach constraints</action>
      <action>SAM typically 10-40% of TAM - justify percentage</action>
    </step>

    <step n="5" title="SOM Projection">
      <action>Research comparable company market share trajectories</action>
      <action>Project conservative Year 1-3 capture</action>
      <action>SOM Year 1 typically &lt;1% of SAM for startups</action>
      <action>Provide three scenarios: Conservative / Realistic / Optimistic</action>
    </step>

    <step n="6" title="Output Report">
      <format>
        ## Market Sizing Report: {{market_description}}

        ### TAM (Total Addressable Market)

        | Methodology | Value | Sources |
        |-------------|-------|---------|
        | Top-Down | $X - $Y | [Source 1], [Source 2] |
        | Bottom-Up | $X - $Y | [Source 1], [Source 2] |
        | Value Theory | $X - $Y | [Source 1], [Source 2] |

        **Reconciled TAM**: $X - $Y (explain methodology choice)

        ### SAM (Serviceable Addressable Market)

        **Constraints Applied**:
        - Geographic: {{geographic_scope}}
        - Segment: {{segment_focus}}
        - [Other constraints with rationale]

        **SAM**: $X - $Y (X% of TAM)

        ### SOM (Serviceable Obtainable Market)

        | Timeframe | Conservative | Realistic | Optimistic |
        |-----------|--------------|-----------|------------|
        | Year 1 | $X | $Y | $Z |
        | Year 2 | $X | $Y | $Z |
        | Year 3 | $X | $Y | $Z |

        ### Source References
        [Full citation list with URLs]

        ### Confidence Assessment
        - TAM Confidence: [High/Medium/Low] - [Rationale]
        - SAM Confidence: [High/Medium/Low] - [Rationale]
        - SOM Confidence: [High/Medium/Low] - [Rationale]
      </format>
    </step>
  </flow>
</task>
```

### 4.3 Competitive Positioning Map Task

```xml
<task id="{bmad_folder}/bmv/tasks/generate-positioning-map.xml"
      name="Competitive Positioning Map Generator"
      standalone="true">

  <purpose>
    Generate a strategic positioning map showing competitive landscape
    with recommended positioning for the new entrant.
  </purpose>

  <inputs>
    <input name="competitors" required="true">List of competitors to map</input>
    <input name="dimension_x" required="false">X-axis dimension (e.g., Price)</input>
    <input name="dimension_y" required="false">Y-axis dimension (e.g., Features)</input>
    <input name="your_position" required="true">Description of your intended position</input>
  </inputs>

  <dimension_suggestions>
    <pair x="Price" y="Quality">Classic value positioning</pair>
    <pair x="Simplicity" y="Power">Feature complexity tradeoff</pair>
    <pair x="SMB Focus" y="Enterprise Focus">Market segment</pair>
    <pair x="Self-Serve" y="High-Touch">Go-to-market model</pair>
    <pair x="Horizontal" y="Vertical">Solution breadth vs depth</pair>
    <pair x="Incumbent" y="Disruptor">Market approach</pair>
  </dimension_suggestions>

  <flow>
    <step n="1" title="Dimension Selection">
      <action>If dimensions not provided, analyze competitors to suggest best dimensions</action>
      <action>Dimensions should reveal strategic differentiation opportunities</action>
      <action>Confirm dimensions with user before proceeding</action>
    </step>

    <step n="2" title="Competitor Scoring">
      <action>Score each competitor 1-10 on both dimensions</action>
      <action>Provide brief rationale for each score</action>
      <action>Cite sources for positioning claims</action>
    </step>

    <step n="3" title="Map Generation">
      <action>Generate ASCII positioning map</action>
      <action>Or generate Excalidraw JSON for visual map</action>
      <action>Highlight clusters and white space</action>
    </step>

    <step n="4" title="Strategic Analysis">
      <action>Identify white space opportunities</action>
      <action>Assess crowded quadrants to avoid</action>
      <action>Recommend optimal positioning</action>
      <action>Provide positioning statement</action>
    </step>
  </flow>
</task>
```

### 4.4 Risk Assessment Task

```xml
<task id="{bmad_folder}/bmv/tasks/risk-assessment.xml"
      name="Business Validation Risk Assessment"
      standalone="true">

  <purpose>
    Systematic identification and assessment of risks for a business idea,
    with mitigation strategies and monitoring triggers.
  </purpose>

  <risk_categories>
    <category name="market">
      <risk>Market too small to sustain business</risk>
      <risk>Market declining or saturating</risk>
      <risk>Timing too early or too late</risk>
      <risk>Geographic limitations</risk>
    </category>

    <category name="competitive">
      <risk>Established player can easily copy</risk>
      <risk>Price war potential</risk>
      <risk>Patent/IP conflicts</risk>
      <risk>Switching costs favor incumbents</risk>
    </category>

    <category name="customer">
      <risk>Willingness to pay insufficient</risk>
      <risk>Customer acquisition cost too high</risk>
      <risk>Churn rate unsustainable</risk>
      <risk>Target segment too narrow</risk>
    </category>

    <category name="execution">
      <risk>Technical feasibility uncertain</risk>
      <risk>Team capability gaps</risk>
      <risk>Resource constraints</risk>
      <risk>Regulatory hurdles</risk>
    </category>

    <category name="financial">
      <risk>Unit economics don't work</risk>
      <risk>Funding requirements exceed availability</risk>
      <risk>Time to revenue too long</risk>
      <risk>Margin pressure from costs</risk>
    </category>
  </risk_categories>

  <flow>
    <step n="1" title="Risk Identification">
      <action>Review all validation documents for risk signals</action>
      <action>Walk through each risk category</action>
      <action>Identify idea-specific risks not in standard list</action>
      <action>Create comprehensive risk inventory</action>
    </step>

    <step n="2" title="Risk Scoring">
      <action>Score each risk: Probability (1-5) × Impact (1-5)</action>
      <action>Calculate risk score (1-25)</action>
      <action>Categorize: Low (1-6), Medium (7-14), High (15-25)</action>
    </step>

    <step n="3" title="Mitigation Planning">
      <action>For each High risk: Define specific mitigation strategy</action>
      <action>For each Medium risk: Define monitoring approach</action>
      <action>Identify early warning indicators</action>
      <action>Define trigger points for action</action>
    </step>

    <step n="4" title="Risk Register Output">
      <format>
        ## Risk Register

        | Risk | Category | Prob | Impact | Score | Level | Mitigation |
        |------|----------|------|--------|-------|-------|------------|
        | X | Market | 4 | 5 | 20 | High | [Strategy] |

        ### High Risk Details
        [Detailed analysis of each high risk with mitigation plan]

        ### Early Warning Indicators
        [List of metrics to monitor with trigger thresholds]

        ### Overall Risk Assessment
        - Total High Risks: X
        - Total Medium Risks: X
        - Total Low Risks: X
        - Overall Risk Level: [High/Medium/Low]
        - Recommendation: [Proceed with caution / Mitigate before proceeding / Reconsider]
      </format>
    </step>
  </flow>
</task>
```

---

## Part 5: Data Files and Reference CSVs

### 5.1 Assumption Types (`assumption-types.csv`)

```csv
category,assumption_type,description,test_method
desirability,problem_exists,"Customers actually have this problem","Customer interviews, survey"
desirability,problem_priority,"Problem is important enough to solve","Ranking exercise, willingness to pay"
desirability,solution_fits,"Our solution addresses the problem","Prototype testing, demo feedback"
desirability,ux_acceptable,"Users can figure out how to use it","Usability testing"
feasibility,tech_possible,"We can build this with available tech","Technical spike, prototype"
feasibility,team_capable,"Our team has the skills needed","Skills assessment, hiring plan"
feasibility,timeline_realistic,"We can build it in reasonable time","Sprint estimates, comparable projects"
feasibility,cost_manageable,"Development costs are within budget","Detailed estimation"
viability,willingness_to_pay,"Customers will pay our target price","Price testing, anchoring studies"
viability,cac_sustainable,"We can acquire customers profitably","Channel experiments, cohort analysis"
viability,ltv_sufficient,"Customer lifetime value exceeds CAC","Retention modeling, comparable data"
viability,market_large_enough,"Enough customers exist to sustain business","Market sizing, segment analysis"
adaptability,pivot_options,"We have room to pivot if needed","Strategy mapping, option analysis"
adaptability,team_flexible,"Team can adapt to changing requirements","Culture assessment"
adaptability,runway_sufficient,"We have time to iterate and learn","Financial modeling"
```

### 5.2 Pivot Types (`pivot-types.csv`)

```csv
pivot_type,description,when_to_use,example
zoom_in,"Single feature becomes the whole product","One feature getting 90% of usage/love","Flickr photo sharing from game"
zoom_out,"Product becomes just a feature of something larger","Product not standalone viable but valuable as part of bigger offering","Feature → Platform"
customer_segment,"Same product, different customer","Original segment not buying but adjacent segment is","Slack from gaming to enterprise"
customer_need,"Same customer, different problem","Discovered a bigger problem while serving original one","Pivot to adjacent pain point"
platform,"Application becomes platform","Others want to build on your product","Single app → developer platform"
business_architecture,"Switch between high margin/low volume and low margin/high volume","Current model not scaling as needed","Consulting → SaaS"
value_capture,"Change monetization model","Revenue model not working","Paid → Freemium"
engine_of_growth,"Switch between viral, sticky, or paid growth","Current growth engine stalling","Viral → Enterprise sales"
channel,"Change distribution method","Current channel too expensive or limited","Direct → Channel partners"
technology,"Use different tech to achieve same result","New tech enables better/cheaper delivery","On-premise → Cloud"
```

### 5.3 Credibility Sources (`source-credibility.csv`)

```csv
source_type,credibility_tier,examples,notes
analyst_firm,high,"Gartner, Forrester, IDC, McKinsey, BCG","Expensive but authoritative"
government,high,"census.gov, bls.gov, sec.gov, data.gov","Free, highly credible for US data"
academic,high,".edu domains, published research","Peer-reviewed content"
financial_data,high,"SEC filings, Crunchbase verified, PitchBook","Verified financial information"
industry_association,high,"Trade associations, professional bodies","Industry-specific expertise"
major_publication,medium,"TechCrunch, Forbes, Bloomberg, Reuters","Reputable journalism"
company_official,medium,"Press releases, official websites, documentation","First-party but potentially biased"
review_platform,medium,"G2, Capterra, TrustPilot","Aggregated customer sentiment"
news_aggregator,medium,"Product Hunt, Hacker News","Community validation"
blog_expert,low,"Individual expert blogs","Requires credibility verification"
social_media,low,"Twitter/X, LinkedIn, Reddit","Anecdotal, needs corroboration"
unknown,low,"Unverifiable sources","Should not be used for critical claims"
```

---

## Part 6: Module Integration

### 6.1 BMV → BMM Handoff Points

| BMV Output | BMM Input | Handoff Workflow |
|------------|-----------|------------------|
| Validated Product Brief | Product Brief Workflow | `export-to-planning` |
| Market Research Summary | PRD Workflow | Direct reference |
| Customer Personas | UX Design Workflow | Direct reference |
| Competitive Analysis | Architecture Decisions | Inform tech choices |
| Risk Register | Sprint Planning | Risk-aware sequencing |

### 6.2 Event Integration

```yaml
bmv_events:
  validation_complete:
    trigger: "synthesis workflow completion"
    payload: "validation_score, recommendation, risk_level"
    subscribers: ["bmm_product_brief_workflow"]

  pivot_recommended:
    trigger: "validation score below threshold"
    payload: "pivot_type, rationale, new_hypothesis"
    subscribers: ["bmv_pivot_analysis_workflow"]

  refresh_needed:
    trigger: "quarterly review or market event"
    payload: "documents_to_update, trigger_reason"
    subscribers: ["bmv_validation_update_workflow"]
```

---

## Summary

This expanded research provides:

- **6 Additional Workflows**: Quick validation, assumption testing, pivot analysis, validation update, export to planning, validation status
- **Tool Integrations**: MCP server usage (jina-ai, context7, playwright), external data sources
- **5 Detailed Checklists**: One for each validation stage with anti-hallucination compliance
- **4 Standalone Tasks**: Source validation, TAM calculator, positioning map, risk assessment
- **3 Data CSVs**: Assumption types, pivot types, source credibility

This creates a comprehensive validation module that integrates seamlessly with BMM for the full product development lifecycle.
