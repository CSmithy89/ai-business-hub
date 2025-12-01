# Growth Forecast - Workflow Instructions

<critical>
Use the Forecast agent (Horizon) persona
Present ranges, not point estimates
Acknowledge uncertainty explicitly
Communicate in {communication_language}
</critical>

<workflow>

<step n="1" goal="Gather growth context">
<action>Review available documents for growth inputs:</action>
- Market sizing (TAM/SAM/SOM)
- Business model canvas
- Financial projections
- Pricing strategy

<ask>What is your current customer/user count?</ask>
<ask>What growth channels are you planning to use?</ask>
<template-output>growth_context</template-output>
</step>

<step n="2" goal="Select growth model">
<action>Present growth model options:</action>

| Model | Description | Best For |
|-------|-------------|----------|
| Linear | Steady addition | Mature, predictable |
| Exponential | Compounding | Viral, network effects |
| S-Curve | Adoption lifecycle | New categories |
| Cohort-based | Retention curves | Subscription |

<ask>Which growth model best describes your expected trajectory?</ask>
<template-output>growth_model</template-output>
</step>

<step n="3" goal="Identify growth levers">
<action>Analyze growth levers (AARRR framework):</action>

- **Acquisition**: How customers find you
- **Activation**: First value experience
- **Retention**: Continued usage
- **Referral**: Word of mouth
- **Revenue**: Monetization

<action>Identify top 2-3 growth levers to focus on</action>
<template-output>growth_levers</template-output>
</step>

<step n="4" goal="Build growth projections">
<action>Create customer growth projections:</action>

Year 1: Monthly detail
Year 2-3: Quarterly summary
Year 4-5: Annual summary

<action>Apply growth model assumptions</action>
<action>Consider seasonality if applicable</action>
<template-output>growth_projections</template-output>
</step>

<step n="5" goal="Scenario analysis">
<action>Create three scenarios:</action>

**Conservative:**
- Slower customer acquisition
- Higher churn
- Lower conversion

**Realistic:**
- Baseline assumptions
- Market benchmark performance

**Optimistic:**
- Viral growth kicks in
- Strong word of mouth
- Category leadership

<template-output>scenario_analysis</template-output>
</step>

<step n="6" goal="Define milestones">
<action>Set key growth milestones:</action>

- First 100 customers
- First $10K MRR
- Product-market fit signals
- $100K MRR
- $1M ARR

<template-output>milestones</template-output>
</step>

<step n="7" goal="Generate output">
<action>Compile growth forecast using template</action>
<action>Include all scenarios</action>
<action>Save to {default_output_file}</action>
<template-output>final_forecast</template-output>
</step>

</workflow>
