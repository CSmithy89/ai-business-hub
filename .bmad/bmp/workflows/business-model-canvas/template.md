# Business Model Canvas

**Business Name:** {{business_name}}
**Date:** {{date}}
**Version:** {{version}}
**Author:** {{user_name}}

---

## Canvas Overview

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│                 │                 │                 │                 │                 │
│ KEY PARTNERS    │ KEY ACTIVITIES  │ VALUE           │ CUSTOMER        │ CUSTOMER        │
│                 │                 │ PROPOSITIONS    │ RELATIONSHIPS   │ SEGMENTS        │
│ {{partners}}   │ {{activities}} │                 │                 │                 │
│                 │                 │ {{value}}      │ {{relations}}  │ {{segments}}   │
│                 ├─────────────────┤                 ├─────────────────┤                 │
│                 │                 │                 │                 │                 │
│                 │ KEY RESOURCES   │                 │ CHANNELS        │                 │
│                 │                 │                 │                 │                 │
│                 │ {{resources}}  │                 │ {{channels}}   │                 │
│                 │                 │                 │                 │                 │
├─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┤
│                               │                                                         │
│ COST STRUCTURE                │ REVENUE STREAMS                                         │
│                               │                                                         │
│ {{costs}}                    │ {{revenue}}                                            │
│                               │                                                         │
└───────────────────────────────┴─────────────────────────────────────────────────────────┘
```

---

## Detailed Canvas Blocks

### 1. Customer Segments

**Primary Segment:**
{{primary_segment_name}}

- **Description:** {{primary_segment_description}}
- **Size Estimate:** {{primary_segment_size}}
- **Key Characteristics:** {{primary_segment_characteristics}}
- **Primary Needs:** {{primary_segment_needs}}

{{#if secondary_segments}}
**Secondary Segments:**
{{#each secondary_segments}}
- **{{name}}:** {{description}}
{{/each}}
{{/if}}

**Segment Type:** {{segment_type}}
<!-- Mass market / Niche / Segmented / Diversified / Multi-sided -->

---

### 2. Value Propositions

**Core Value Proposition:**
{{core_value_proposition}}

**Value Elements:**
{{#each value_elements}}
- **{{type}}:** {{description}}
{{/each}}

**Differentiation:**
{{differentiation}}

**Value Proposition per Segment:**
| Segment | Value Delivered | Why It Matters |
|---------|-----------------|----------------|
{{#each segment_value_mapping}}
| {{segment}} | {{value}} | {{rationale}} |
{{/each}}

---

### 3. Channels

| Phase | Channel | Type | Priority |
|-------|---------|------|----------|
| Awareness | {{awareness_channel}} | {{awareness_type}} | {{awareness_priority}} |
| Evaluation | {{evaluation_channel}} | {{evaluation_type}} | {{evaluation_priority}} |
| Purchase | {{purchase_channel}} | {{purchase_type}} | {{purchase_priority}} |
| Delivery | {{delivery_channel}} | {{delivery_type}} | {{delivery_priority}} |
| After Sales | {{aftersales_channel}} | {{aftersales_type}} | {{aftersales_priority}} |

**Channel Strategy:**
{{channel_strategy}}

---

### 4. Customer Relationships

| Segment | Relationship Type | Purpose | Effort Level |
|---------|-------------------|---------|--------------|
{{#each segment_relationships}}
| {{segment}} | {{type}} | {{purpose}} | {{effort}} |
{{/each}}

**Relationship Goals:**
- **Acquisition:** {{acquisition_approach}}
- **Retention:** {{retention_approach}}
- **Expansion:** {{expansion_approach}}

---

### 5. Revenue Streams

**Primary Revenue Model:** {{primary_revenue_model}}

| Revenue Stream | Type | Pricing Mechanism | % of Revenue |
|----------------|------|-------------------|--------------|
{{#each revenue_streams}}
| {{name}} | {{type}} | {{pricing}} | {{percentage}} |
{{/each}}

**Revenue Characteristics:**
- **Recurring vs One-time:** {{recurring_ratio}}
- **Transaction vs Subscription:** {{transaction_type}}

---

### 6. Key Resources

| Resource | Category | Critical Level | Source |
|----------|----------|----------------|--------|
{{#each key_resources}}
| {{name}} | {{category}} | {{critical}} | {{source}} |
{{/each}}

**Most Critical Resource:** {{most_critical_resource}}

---

### 7. Key Activities

| Activity | Category | Importance | Owner |
|----------|----------|------------|-------|
{{#each key_activities}}
| {{name}} | {{category}} | {{importance}} | {{owner}} |
{{/each}}

**Core Competency Focus:** {{core_competency}}

---

### 8. Key Partnerships

| Partner Type | Partner(s) | What They Provide | What We Provide |
|--------------|------------|-------------------|-----------------|
{{#each key_partnerships}}
| {{type}} | {{partners}} | {{they_provide}} | {{we_provide}} |
{{/each}}

**Partnership Strategy:** {{partnership_strategy}}

---

### 9. Cost Structure

**Model Type:** {{cost_model_type}}
<!-- Cost-driven / Value-driven -->

**Fixed Costs:**
{{#each fixed_costs}}
- {{name}}: {{estimate}}
{{/each}}

**Variable Costs:**
{{#each variable_costs}}
- {{name}}: {{estimate}} per {{unit}}
{{/each}}

**Most Significant Costs:**
1. {{top_cost_1}}
2. {{top_cost_2}}
3. {{top_cost_3}}

**Economies of Scale Potential:** {{scale_potential}}

---

## Canvas Analysis

### Value Proposition Fit Assessment

| Check | Status | Notes |
|-------|--------|-------|
| VP addresses segment pain points | {{vp_fit_status}} | {{vp_fit_notes}} |
| VP differentiated from alternatives | {{diff_status}} | {{diff_notes}} |
| Revenue streams align with value | {{revenue_fit_status}} | {{revenue_fit_notes}} |
| Resources enable VP delivery | {{resource_fit_status}} | {{resource_fit_notes}} |

### Business Model Pattern

**Pattern Match:** {{business_model_pattern}}
<!-- Freemium / Marketplace / Platform / Subscription / etc. -->

**Pattern Characteristics Applied:**
{{pattern_characteristics}}

---

## Assumptions Log

| Block | Assumption | Confidence | Validation Method |
|-------|------------|------------|-------------------|
{{#each assumptions}}
| {{block}} | {{assumption}} | {{confidence}} | {{validation}} |
{{/each}}

---

## Next Steps

### Immediate Actions
{{#each immediate_actions}}
1. {{action}}
{{/each}}

### Recommended Workflows
- [ ] **Pricing Strategy** - Detail revenue model and pricing tiers
- [ ] **Financial Projections** - Build financial model from this canvas
- [ ] **Revenue Model** - Deep dive on monetization

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| {{version}} | {{date}} | Initial canvas | {{user_name}} |

---

*Generated by BMP Business Model Canvas Workflow*
