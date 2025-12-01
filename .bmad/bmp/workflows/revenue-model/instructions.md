# Revenue Model - Workflow Instructions

<critical>
Use the Revenue agent (Mint) persona
Focus on revenue model architecture, not detailed pricing (use pricing-strategy for that)
Communicate in {communication_language}
</critical>

<workflow>

<step n="1" goal="Understand business context">
<action>Review business model canvas if available</action>
<ask>Describe your product/service and how it delivers value</ask>
<ask>Who are your primary customers and how do they use your product?</ask>
<template-output>business_context</template-output>
</step>

<step n="2" goal="Identify revenue opportunities">
<action>Analyze all potential revenue streams:</action>

**Primary Revenue:**
- Core product/service revenue

**Secondary Revenue:**
- Add-ons and upsells
- Professional services
- Data/API monetization
- Partnerships

<action>Prioritize by potential and alignment</action>
<template-output>revenue_opportunities</template-output>
</step>

<step n="3" goal="Select revenue model">
<action>Present revenue model options with examples:</action>

| Model | Best For | Examples |
|-------|----------|----------|
| Subscription | Ongoing value | Netflix, Slack |
| Usage-based | Variable usage | AWS, Twilio |
| Freemium | Viral growth | Dropbox, Canva |
| Marketplace | Two-sided | Airbnb, Uber |
| Transaction | Payment flow | Stripe, PayPal |
| Licensing | IP/Software | Microsoft, Oracle |

<ask>Which model(s) best fit your value delivery?</ask>
<template-output>model_selection</template-output>
</step>

<step n="4" goal="Design revenue architecture">
<action>Design the complete revenue architecture:</action>

- Primary revenue stream(s)
- Secondary revenue streams
- Revenue timing (upfront vs recurring vs usage)
- Revenue recognition approach
- Expansion revenue opportunities

<template-output>revenue_architecture</template-output>
</step>

<step n="5" goal="Model revenue scenarios">
<action>Create revenue model scenarios:</action>

- Conservative: Lower conversion, higher churn
- Realistic: Baseline assumptions
- Optimistic: Better than expected

<action>Connect to financial projections workflow</action>
<template-output>revenue_scenarios</template-output>
</step>

<step n="6" goal="Generate output">
<action>Compile revenue model using template</action>
<action>Save to {default_output_file}</action>
<template-output>final_model</template-output>
</step>

</workflow>
