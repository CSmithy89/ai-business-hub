# Market Sizing Report

**Validation Session**: {{session_id}}
**Date**: {{current_date}}
**Market**: {{market_description}}
**Geographic Scope**: {{geographic_scope}}

---

## Executive Summary

| Metric | Value | Confidence |
|--------|-------|------------|
| **TAM** | ${{tam_range}} | {{tam_confidence}} |
| **SAM** | ${{sam_range}} | {{sam_confidence}} |
| **SOM Year 1** | ${{som_y1}} | {{som_confidence}} |
| **SOM Year 3** | ${{som_y3}} | {{som_confidence}} |
| **CAGR** | {{cagr}}% | {{cagr_confidence}} |

**Key Finding**: {{key_finding}}

---

## 1. TAM (Total Addressable Market)

### 1.1 Top-Down Calculation

**Methodology**: Start with industry size, apply filters

| Component | Value | Source |
|-----------|-------|--------|
| Total Industry Size | ${{industry_size}} | {{source_1}} |
| Segment Filter | {{segment_pct}}% | {{source_2}} |
| Geographic Filter | {{geo_pct}}% | {{source_3}} |
| **Top-Down TAM** | **${{tam_topdown}}** | |

**Calculation**: ${{industry_size}} × {{segment_pct}}% × {{geo_pct}}% = ${{tam_topdown}}

### 1.2 Bottom-Up Calculation

**Methodology**: Build from customer count × average revenue

| Component | Value | Source |
|-----------|-------|--------|
| Total Potential Customers | {{customer_count}} | {{source_4}} |
| Average Revenue Per Customer | ${{arpc}} | {{source_5}} |
| **Bottom-Up TAM** | **${{tam_bottomup}}** | |

**Calculation**: {{customer_count}} × ${{arpc}} = ${{tam_bottomup}}

### 1.3 Value Theory Calculation (Optional)

{{value_theory_section}}

### 1.4 TAM Reconciliation

| Method | Estimate | Confidence |
|--------|----------|------------|
| Top-Down | ${{tam_topdown}} | {{conf_topdown}} |
| Bottom-Up | ${{tam_bottomup}} | {{conf_bottomup}} |
| Value Theory | ${{tam_value}} | {{conf_value}} |

**Variance Analysis**: {{variance_analysis}}

**Final TAM**: ${{tam_low}} - ${{tam_high}} (midpoint: ${{tam_mid}})

**Confidence Level**: {{tam_confidence}}

---

## 2. SAM (Serviceable Addressable Market)

### 2.1 Constraints Applied

| Constraint | Reduction | Rationale | Source |
|------------|-----------|-----------|--------|
| {{constraint_1}} | {{red_1}}% | {{rat_1}} | {{src_1}} |
| {{constraint_2}} | {{red_2}}% | {{rat_2}} | {{src_2}} |
| {{constraint_3}} | {{red_3}}% | {{rat_3}} | {{src_3}} |
| {{constraint_4}} | {{red_4}}% | {{rat_4}} | {{src_4}} |

### 2.2 SAM Calculation

**Starting TAM**: ${{tam_mid}}

**Total Reduction**: {{total_reduction}}%

**SAM**: ${{tam_mid}} × {{remaining_pct}}% = **${{sam}}**

**SAM as % of TAM**: {{sam_pct}}%

**Confidence Level**: {{sam_confidence}}

---

## 3. SOM (Serviceable Obtainable Market)

### 3.1 Comparable Benchmarks

| Company | Market Share | Timeline | Source |
|---------|--------------|----------|--------|
| {{comp_1}} | {{share_1}}% | {{time_1}} | {{src_1}} |
| {{comp_2}} | {{share_2}}% | {{time_2}} | {{src_2}} |
| {{comp_3}} | {{share_3}}% | {{time_3}} | {{src_3}} |

### 3.2 SOM Projections

| Year | Conservative | Realistic | Optimistic |
|------|--------------|-----------|------------|
| Year 1 | ${{y1_cons}} ({{y1_cons_pct}}%) | ${{y1_real}} ({{y1_real_pct}}%) | ${{y1_opt}} ({{y1_opt_pct}}%) |
| Year 2 | ${{y2_cons}} ({{y2_cons_pct}}%) | ${{y2_real}} ({{y2_real_pct}}%) | ${{y2_opt}} ({{y2_opt_pct}}%) |
| Year 3 | ${{y3_cons}} ({{y3_cons_pct}}%) | ${{y3_real}} ({{y3_real_pct}}%) | ${{y3_opt}} ({{y3_opt_pct}}%) |

### 3.3 Key Assumptions

1. {{assumption_1}}
2. {{assumption_2}}
3. {{assumption_3}}
4. {{assumption_4}}

**Confidence Level**: {{som_confidence}}

---

## 4. Market Growth Analysis

### 4.1 Historical Performance

- **Past 5-Year CAGR**: {{historical_cagr}}%
- **Source**: {{cagr_source}}

### 4.2 Future Projections

| Timeframe | CAGR | TAM Projection | Source |
|-----------|------|----------------|--------|
| {{current_year}} | - | ${{tam_current}} | Current |
| {{year_plus_1}} | {{cagr_1}}% | ${{tam_y1}} | {{src}} |
| {{year_plus_3}} | {{cagr_3}}% | ${{tam_y3}} | {{src}} |
| {{year_plus_5}} | {{cagr_5}}% | ${{tam_y5}} | {{src}} |

### 4.3 Growth Drivers

{{growth_drivers}}

### 4.4 Growth Risks

{{growth_risks}}

---

## 5. Confidence Assessment

### 5.1 Data Quality Summary

| Category | Sources | Quality | Confidence |
|----------|---------|---------|------------|
| Industry Size | {{ind_sources}} | {{ind_quality}} | {{ind_conf}} |
| Customer Data | {{cust_sources}} | {{cust_quality}} | {{cust_conf}} |
| Pricing Data | {{price_sources}} | {{price_quality}} | {{price_conf}} |
| Growth Data | {{growth_sources}} | {{growth_quality}} | {{growth_conf}} |

### 5.2 Confidence Level Definitions

- **[Verified - 2+ sources]**: High confidence, multiple independent sources agree
- **[Single source - verify]**: Medium confidence, only one source found
- **[Estimated - low confidence]**: Low confidence, calculated without strong sources

### 5.3 Overall Assessment

**Overall Confidence**: {{overall_confidence}}

**Rationale**: {{confidence_rationale}}

---

## 6. Sources and References

### High Credibility Sources

{{high_cred_sources}}

### Medium Credibility Sources

{{medium_cred_sources}}

### Additional Sources

{{additional_sources}}

---

## 7. Gaps and Recommendations

### Data Gaps

{{data_gaps}}

### Recommended Follow-Up Research

{{followup_research}}

---

## Metadata

- **Created by**: {{user_name}}
- **Workflow**: market-sizing
- **Session ID**: {{session_id}}
- **Next Step**: {{next_workflow}}

---

*Document generated by BMV Market Sizing Workflow*
*Anti-hallucination protocol enforced: All claims require source citations*
