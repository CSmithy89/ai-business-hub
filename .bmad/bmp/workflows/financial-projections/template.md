# Financial Projections

**Business Name:** {{business_name}}
**Date:** {{date}}
**Version:** {{version}}
**Prepared By:** {{user_name}}

---

## Executive Financial Summary

| Metric | Year 1 | Year 3 | Year 5 |
|--------|--------|--------|--------|
| Revenue | {{y1_revenue}} | {{y3_revenue}} | {{y5_revenue}} |
| Gross Margin | {{y1_gm}} | {{y3_gm}} | {{y5_gm}} |
| Net Income | {{y1_ni}} | {{y3_ni}} | {{y5_ni}} |
| Customers | {{y1_customers}} | {{y3_customers}} | {{y5_customers}} |

**Key Highlights:**
- Time to profitability: {{time_to_profit}}
- Total funding required: {{total_funding}}
- LTV:CAC ratio: {{ltv_cac}}

---

## 1. Assumptions

### Revenue Assumptions

| Assumption | Value | Rationale | Confidence |
|------------|-------|-----------|------------|
| Starting MRR | {{starting_mrr}} | {{starting_mrr_rationale}} | {{starting_mrr_confidence}} |
| Monthly Growth Rate | {{growth_rate}} | {{growth_rate_rationale}} | {{growth_rate_confidence}} |
| ARPU | {{arpu}} | {{arpu_rationale}} | {{arpu_confidence}} |
| Conversion Rate | {{conversion_rate}} | {{conversion_rate_rationale}} | {{conversion_rate_confidence}} |

### Customer Assumptions

| Assumption | Value | Rationale | Confidence |
|------------|-------|-----------|------------|
| Monthly Customer Acquisition | {{customer_acquisition}} | {{ca_rationale}} | {{ca_confidence}} |
| Monthly Churn Rate | {{churn_rate}} | {{churn_rationale}} | {{churn_confidence}} |
| Customer Lifetime | {{customer_lifetime}} | {{cl_rationale}} | {{cl_confidence}} |

### Cost Assumptions

| Assumption | Value | Rationale | Confidence |
|------------|-------|-----------|------------|
| Monthly Fixed Costs | {{fixed_costs}} | {{fc_rationale}} | {{fc_confidence}} |
| Variable Cost per Customer | {{variable_cost}} | {{vc_rationale}} | {{vc_confidence}} |
| Marketing as % of Revenue | {{marketing_percent}} | {{mp_rationale}} | {{mp_confidence}} |
| COGS as % of Revenue | {{cogs_percent}} | {{cogs_rationale}} | {{cogs_confidence}} |

---

## 2. Unit Economics

### Core Metrics

| Metric | Value | Benchmark | Status |
|--------|-------|-----------|--------|
| **CAC** | {{cac}} | Industry avg: {{cac_benchmark}} | {{cac_status}} |
| **LTV** | {{ltv}} | Target: 3x CAC | {{ltv_status}} |
| **LTV:CAC Ratio** | {{ltv_cac_ratio}} | Target: >3:1 | {{ltv_cac_status}} |
| **Payback Period** | {{payback_months}} months | Target: <12 months | {{payback_status}} |
| **Gross Margin** | {{gross_margin}}% | Industry: {{gm_benchmark}}% | {{gm_status}} |

### Unit Economics Calculation

```
CAC Calculation:
Total S&M Spend: {{sm_spend}}
New Customers: {{new_customers}}
CAC = {{sm_spend}} / {{new_customers}} = {{cac}}

LTV Calculation:
ARPU: {{arpu}}
Gross Margin: {{gross_margin}}%
Customer Lifetime: {{customer_lifetime}} months
LTV = {{arpu}} × {{gross_margin}}% × {{customer_lifetime}} = {{ltv}}

LTV:CAC = {{ltv}} / {{cac}} = {{ltv_cac_ratio}}
```

### Unit Economics Health Assessment

{{unit_economics_assessment}}

---

## 3. Revenue Projections

### Revenue Model: {{revenue_model_type}}

### Year 1 - Monthly Projections

| Month | Customers | MRR | Growth |
|-------|-----------|-----|--------|
| M1 | {{m1_customers}} | {{m1_mrr}} | - |
| M2 | {{m2_customers}} | {{m2_mrr}} | {{m2_growth}} |
| M3 | {{m3_customers}} | {{m3_mrr}} | {{m3_growth}} |
| M4 | {{m4_customers}} | {{m4_mrr}} | {{m4_growth}} |
| M5 | {{m5_customers}} | {{m5_mrr}} | {{m5_growth}} |
| M6 | {{m6_customers}} | {{m6_mrr}} | {{m6_growth}} |
| M7 | {{m7_customers}} | {{m7_mrr}} | {{m7_growth}} |
| M8 | {{m8_customers}} | {{m8_mrr}} | {{m8_growth}} |
| M9 | {{m9_customers}} | {{m9_mrr}} | {{m9_growth}} |
| M10 | {{m10_customers}} | {{m10_mrr}} | {{m10_growth}} |
| M11 | {{m11_customers}} | {{m11_mrr}} | {{m11_growth}} |
| M12 | {{m12_customers}} | {{m12_mrr}} | {{m12_growth}} |

**Year 1 Total Revenue:** {{y1_revenue}}
**Year 1 Ending MRR:** {{y1_ending_mrr}}

### Multi-Year Revenue Summary

| Year | Revenue | YoY Growth | Customers (End) |
|------|---------|------------|-----------------|
| Year 1 | {{y1_revenue}} | - | {{y1_customers}} |
| Year 2 | {{y2_revenue}} | {{y2_growth}} | {{y2_customers}} |
| Year 3 | {{y3_revenue}} | {{y3_growth}} | {{y3_customers}} |
| Year 4 | {{y4_revenue}} | {{y4_growth}} | {{y4_customers}} |
| Year 5 | {{y5_revenue}} | {{y5_growth}} | {{y5_customers}} |

---

## 4. Cost Projections

### Fixed Costs (Monthly)

| Category | Year 1 | Year 2 | Year 3 |
|----------|--------|--------|--------|
| Salaries & Wages | {{salaries_y1}} | {{salaries_y2}} | {{salaries_y3}} |
| Rent / Office | {{rent_y1}} | {{rent_y2}} | {{rent_y3}} |
| Software & Tools | {{tools_y1}} | {{tools_y2}} | {{tools_y3}} |
| Insurance | {{insurance_y1}} | {{insurance_y2}} | {{insurance_y3}} |
| Professional Services | {{prof_services_y1}} | {{prof_services_y2}} | {{prof_services_y3}} |
| **Total Fixed** | {{total_fixed_y1}} | {{total_fixed_y2}} | {{total_fixed_y3}} |

### Variable Costs (Per Customer)

| Category | Cost per Customer | Notes |
|----------|------------------|-------|
| Infrastructure | {{infra_per_customer}} | {{infra_notes}} |
| Support | {{support_per_customer}} | {{support_notes}} |
| Payment Processing | {{payment_per_customer}} | {{payment_notes}} |
| **Total Variable** | {{total_variable}} | |

### Cost of Goods Sold

| Year | COGS | COGS % of Revenue |
|------|------|-------------------|
| Year 1 | {{cogs_y1}} | {{cogs_pct_y1}} |
| Year 2 | {{cogs_y2}} | {{cogs_pct_y2}} |
| Year 3 | {{cogs_y3}} | {{cogs_pct_y3}} |

---

## 5. Pro Forma Income Statement

### 5-Year P&L Summary

| Line Item | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|-----------|--------|--------|--------|--------|--------|
| **Revenue** | {{revenue_y1}} | {{revenue_y2}} | {{revenue_y3}} | {{revenue_y4}} | {{revenue_y5}} |
| COGS | {{cogs_y1}} | {{cogs_y2}} | {{cogs_y3}} | {{cogs_y4}} | {{cogs_y5}} |
| **Gross Profit** | {{gp_y1}} | {{gp_y2}} | {{gp_y3}} | {{gp_y4}} | {{gp_y5}} |
| *Gross Margin %* | {{gm_y1}} | {{gm_y2}} | {{gm_y3}} | {{gm_y4}} | {{gm_y5}} |
| | | | | | |
| Sales & Marketing | {{sm_y1}} | {{sm_y2}} | {{sm_y3}} | {{sm_y4}} | {{sm_y5}} |
| R&D / Product | {{rd_y1}} | {{rd_y2}} | {{rd_y3}} | {{rd_y4}} | {{rd_y5}} |
| G&A | {{ga_y1}} | {{ga_y2}} | {{ga_y3}} | {{ga_y4}} | {{ga_y5}} |
| **Total OpEx** | {{opex_y1}} | {{opex_y2}} | {{opex_y3}} | {{opex_y4}} | {{opex_y5}} |
| | | | | | |
| **EBITDA** | {{ebitda_y1}} | {{ebitda_y2}} | {{ebitda_y3}} | {{ebitda_y4}} | {{ebitda_y5}} |
| *EBITDA Margin %* | {{ebitda_pct_y1}} | {{ebitda_pct_y2}} | {{ebitda_pct_y3}} | {{ebitda_pct_y4}} | {{ebitda_pct_y5}} |
| | | | | | |
| D&A | {{da_y1}} | {{da_y2}} | {{da_y3}} | {{da_y4}} | {{da_y5}} |
| **EBIT** | {{ebit_y1}} | {{ebit_y2}} | {{ebit_y3}} | {{ebit_y4}} | {{ebit_y5}} |
| Interest | {{interest_y1}} | {{interest_y2}} | {{interest_y3}} | {{interest_y4}} | {{interest_y5}} |
| Tax | {{tax_y1}} | {{tax_y2}} | {{tax_y3}} | {{tax_y4}} | {{tax_y5}} |
| **Net Income** | {{ni_y1}} | {{ni_y2}} | {{ni_y3}} | {{ni_y4}} | {{ni_y5}} |

---

## 6. Cash Flow Projection

### Cash Flow Summary

| Category | Year 1 | Year 2 | Year 3 |
|----------|--------|--------|--------|
| **Operating Cash Flow** | | | |
| Net Income | {{ni_y1}} | {{ni_y2}} | {{ni_y3}} |
| (+) D&A | {{da_y1}} | {{da_y2}} | {{da_y3}} |
| (+/-) Working Capital | {{wc_y1}} | {{wc_y2}} | {{wc_y3}} |
| *OCF Total* | {{ocf_y1}} | {{ocf_y2}} | {{ocf_y3}} |
| | | | |
| **Investing Cash Flow** | | | |
| CapEx | {{capex_y1}} | {{capex_y2}} | {{capex_y3}} |
| *ICF Total* | {{icf_y1}} | {{icf_y2}} | {{icf_y3}} |
| | | | |
| **Financing Cash Flow** | | | |
| Equity Raised | {{equity_y1}} | {{equity_y2}} | {{equity_y3}} |
| Debt Raised/(Repaid) | {{debt_y1}} | {{debt_y2}} | {{debt_y3}} |
| *FCF Total* | {{fcf_y1}} | {{fcf_y2}} | {{fcf_y3}} |
| | | | |
| **Net Cash Flow** | {{ncf_y1}} | {{ncf_y2}} | {{ncf_y3}} |
| Beginning Cash | {{begin_cash_y1}} | {{begin_cash_y2}} | {{begin_cash_y3}} |
| **Ending Cash** | {{end_cash_y1}} | {{end_cash_y2}} | {{end_cash_y3}} |

### Burn Rate & Runway

| Metric | Value |
|--------|-------|
| Current Monthly Burn | {{monthly_burn}} |
| Current Cash | {{current_cash}} |
| Runway | {{runway_months}} months |

---

## 7. Scenario Analysis

### Scenario Comparison

| Metric | Conservative | Realistic | Optimistic |
|--------|--------------|-----------|------------|
| Year 3 Revenue | {{cons_y3_rev}} | {{real_y3_rev}} | {{opt_y3_rev}} |
| Year 3 Customers | {{cons_y3_cust}} | {{real_y3_cust}} | {{opt_y3_cust}} |
| Time to Profitability | {{cons_ttp}} | {{real_ttp}} | {{opt_ttp}} |
| Total Funding Needed | {{cons_funding}} | {{real_funding}} | {{opt_funding}} |
| Year 5 Revenue | {{cons_y5_rev}} | {{real_y5_rev}} | {{opt_y5_rev}} |

### Scenario Assumptions

**Conservative (-30% growth):**
{{conservative_assumptions}}

**Realistic (Baseline):**
{{realistic_assumptions}}

**Optimistic (+30% growth):**
{{optimistic_assumptions}}

---

## 8. Funding Requirements

### Funding Summary

| Stage | Amount | Purpose | Target Timing |
|-------|--------|---------|---------------|
| {{stage_1}} | {{amount_1}} | {{purpose_1}} | {{timing_1}} |
| {{stage_2}} | {{amount_2}} | {{purpose_2}} | {{timing_2}} |
| {{stage_3}} | {{amount_3}} | {{purpose_3}} | {{timing_3}} |

**Total Funding Required:** {{total_funding}}

### Use of Funds (Next Round)

| Category | Allocation | Amount |
|----------|------------|--------|
| Product Development | {{product_pct}}% | {{product_amount}} |
| Sales & Marketing | {{sm_pct}}% | {{sm_amount}} |
| Operations | {{ops_pct}}% | {{ops_amount}} |
| Buffer/Contingency | {{buffer_pct}}% | {{buffer_amount}} |
| **Total** | 100% | {{total_raise}} |

### Post-Funding Runway

With {{total_raise}} raised:
- Monthly burn: {{post_funding_burn}}
- Runway: {{post_funding_runway}} months
- Target milestone: {{runway_milestone}}

---

## 9. Sensitivity Analysis

### Impact of Key Variables

| Variable | -20% Impact | +20% Impact |
|----------|-------------|-------------|
| Customer Growth Rate | {{growth_minus_impact}} | {{growth_plus_impact}} |
| Churn Rate | {{churn_minus_impact}} | {{churn_plus_impact}} |
| ARPU | {{arpu_minus_impact}} | {{arpu_plus_impact}} |
| CAC | {{cac_minus_impact}} | {{cac_plus_impact}} |

### Most Sensitive Variables

1. **{{most_sensitive_1}}** - {{sensitivity_1_notes}}
2. **{{most_sensitive_2}}** - {{sensitivity_2_notes}}
3. **{{most_sensitive_3}}** - {{sensitivity_3_notes}}

---

## 10. Key Milestones

| Milestone | Target Date | Revenue | Customers |
|-----------|-------------|---------|-----------|
| First $10K MRR | {{m1_date}} | $10,000 | {{m1_customers}} |
| First $50K MRR | {{m2_date}} | $50,000 | {{m2_customers}} |
| First $100K MRR | {{m3_date}} | $100,000 | {{m3_customers}} |
| Breakeven | {{breakeven_date}} | {{breakeven_revenue}} | {{breakeven_customers}} |
| $1M ARR | {{m4_date}} | $1,000,000 | {{m4_customers}} |

---

## Appendix: Detailed Assumptions

### Industry Benchmarks Used

| Metric | Benchmark | Source |
|--------|-----------|--------|
{{#each benchmarks}}
| {{metric}} | {{value}} | {{source}} |
{{/each}}

### Assumptions Requiring Validation

{{#each validation_needed}}
- **{{assumption}}**: {{reason}}
{{/each}}

---

*Generated by BMP Financial Projections Workflow*
*All projections are estimates based on stated assumptions*
