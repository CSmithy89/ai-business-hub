# Pricing Strategy - Workflow Instructions

<critical>
Use the Revenue agent (Mint) persona
Communicate in {communication_language}
Reference competitive pricing when available
</critical>

<workflow>

<step n="1" goal="Understand value delivered">
<action>Review business model canvas for value propositions</action>
<ask>What specific value do you deliver to customers?</ask>
<ask>How do customers measure the value they receive?</ask>
<action>Identify the value metric (what customers pay for)</action>
<template-output>value_understanding</template-output>
</step>

<step n="2" goal="Analyze competitive pricing">
<action>Review BMV competitive analysis if available</action>
<action>Research competitor pricing:</action>
- Direct competitor pricing
- Indirect competitor/substitute pricing
- Market price expectations

<action>Create competitive pricing landscape</action>
<template-output>competitive_analysis</template-output>
</step>

<step n="3" goal="Select pricing model">
<action>Present pricing model options:</action>

**Subscription Models:**
- Flat: Single price for access
- Tiered: Good/Better/Best
- Per-seat: Price per user

**Usage Models:**
- Metered: Pay per use
- Credits: Pre-purchased usage

**Other Models:**
- Freemium: Free tier + paid
- One-time: Single purchase
- Hybrid: Combination

<ask>Which pricing model best fits your value delivery?</ask>
<action>Document rationale for selection</action>
<template-output>pricing_model</template-output>
</step>

<step n="4" goal="Design pricing tiers">
<action>If tiered pricing, design tier structure:</action>

**Tier Design Principles:**
- Each tier serves distinct segment
- Clear value escalation between tiers
- Use decoy pricing (middle tier most attractive)
- Anchor with highest tier

<action>For each tier, define:</action>
- Tier name
- Target segment
- Key features included
- Price point
- Value justification

<template-output>pricing_tiers</template-output>
</step>

<step n="5" goal="Apply pricing psychology">
<action>Apply pricing psychology elements:</action>

- **Anchoring**: Show highest tier first
- **Decoy effect**: Make target tier most attractive
- **Charm pricing**: $99 vs $100
- **Annual discount**: Monthly × 10 for annual
- **Framing**: "Only $X per day"

<template-output>pricing_psychology</template-output>
</step>

<step n="6" goal="Plan pricing evolution">
<action>Document pricing evolution roadmap:</action>
- Launch pricing (may be lower)
- Long-term pricing targets
- Price increase strategy
- Grandfathering approach

<template-output>pricing_roadmap</template-output>
</step>

<step n="7" goal="Generate output">
<action>Compile complete pricing strategy using template</action>
<action>Include competitive positioning</action>
<action>Add pricing tier details</action>
<action>Save to {default_output_file}</action>
<template-output>final_pricing</template-output>
</step>

</workflow>
