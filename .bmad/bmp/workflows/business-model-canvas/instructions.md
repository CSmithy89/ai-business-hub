# Business Model Canvas - Workflow Instructions

<critical>
Load the workflow configuration: {installed_path}/workflow.yaml
Use the Canvas agent persona for this workflow
Communicate in {communication_language}
</critical>

<workflow>

<step n="1" goal="Gather context and inputs">
<action>Check for existing BMV validation documents in {output_folder}/bmv</action>
<action>If BMV documents exist, extract:</action>
- Customer segments from customer profile
- Market size context
- Competitive positioning insights
- Validated assumptions

<action>If no BMV documents, gather initial context:</action>
<ask>Please describe your business idea in 2-3 sentences</ask>
<ask>Who is your primary target customer?</ask>
<ask>What problem are you solving for them?</ask>

<template-output>context_gathered</template-output>
</step>

<step n="2" goal="Complete Customer Segments block">
<action>Guide exploration of customer segments:</action>

**Segment Types to Consider:**
- Mass market (broad, similar needs)
- Niche market (specialized, specific needs)
- Segmented (slightly different needs)
- Diversified (very different needs)
- Multi-sided platforms (2+ interdependent segments)

<ask>Who are you creating value for?</ask>
<ask>Are there distinct customer segments with different needs?</ask>
<ask>Who is the PRIMARY segment vs secondary?</ask>

<action>For each segment, document:</action>
- Segment name and description
- Size estimate (from BMV or new research)
- Key characteristics/demographics
- Primary needs and pain points

<template-output>customer_segments</template-output>
</step>

<step n="3" goal="Complete Value Propositions block">
<action>Guide value proposition development:</action>

**Value Types:**
- Newness (innovation)
- Performance (improvement)
- Customization (tailoring)
- Getting the job done
- Design (aesthetic/UX)
- Brand/Status
- Price (cost reduction)
- Risk reduction
- Accessibility
- Convenience/Usability

<ask>What value do you deliver to each customer segment?</ask>
<ask>Which customer problems are you solving?</ask>
<ask>What makes this valuable compared to alternatives?</ask>

<action>Map value propositions to customer segments</action>
<action>Identify the core differentiator</action>

<template-output>value_propositions</template-output>
</step>

<step n="4" goal="Complete Channels block">
<action>Guide channel analysis:</action>

**Channel Phases:**
1. Awareness - How do customers discover you?
2. Evaluation - How do they evaluate your proposition?
3. Purchase - How do they buy?
4. Delivery - How do you deliver value?
5. After sales - How do you provide support?

**Channel Types:**
- Direct: Sales force, web sales, own stores
- Indirect: Partner stores, wholesaler

<ask>How do your customers want to be reached?</ask>
<ask>Which channels work best for each phase?</ask>
<ask>Are channels direct or through partners?</ask>

<template-output>channels</template-output>
</step>

<step n="5" goal="Complete Customer Relationships block">
<action>Guide relationship definition:</action>

**Relationship Types:**
- Personal assistance (human interaction)
- Dedicated personal assistance (assigned rep)
- Self-service (no direct relationship)
- Automated services (personalized automation)
- Communities (user communities)
- Co-creation (customers help create)

<ask>What type of relationship does each segment expect?</ask>
<ask>What's the balance of acquisition vs retention focus?</ask>
<ask>How do relationships drive upselling?</ask>

<template-output>customer_relationships</template-output>
</step>

<step n="6" goal="Complete Revenue Streams block">
<action>Guide revenue stream identification:</action>

**Revenue Types:**
- Asset sale (selling ownership)
- Usage fee (pay per use)
- Subscription fees (recurring access)
- Lending/Renting/Leasing
- Licensing (IP rights)
- Brokerage fees (intermediation)
- Advertising

**Pricing Mechanisms:**
- Fixed: List price, feature-dependent, segment-dependent, volume-dependent
- Dynamic: Negotiation, yield management, real-time market, auctions

<ask>What value are customers actually willing to pay for?</ask>
<ask>What's the primary revenue model?</ask>
<ask>Are there secondary revenue opportunities?</ask>

<action>Note: Detailed pricing goes in pricing-strategy workflow</action>

<template-output>revenue_streams</template-output>
</step>

<step n="7" goal="Complete Key Resources block">
<action>Guide resource identification:</action>

**Resource Categories:**
- Physical (facilities, equipment, vehicles)
- Intellectual (brands, patents, partnerships, databases)
- Human (expertise, creativity, experience)
- Financial (cash, credit lines, stock options)

<ask>What key resources does your value proposition require?</ask>
<ask>What resources do channels and relationships need?</ask>
<ask>Which resources are hardest to acquire?</ask>

<template-output>key_resources</template-output>
</step>

<step n="8" goal="Complete Key Activities block">
<action>Guide activity identification:</action>

**Activity Categories:**
- Production (designing, making, delivering)
- Problem Solving (solutions for individual customers)
- Platform/Network (platform management, provisioning, promotion)

<ask>What key activities does your value proposition require?</ask>
<ask>What activities maintain channels and relationships?</ask>
<ask>What generates revenue?</ask>

<template-output>key_activities</template-output>
</step>

<step n="9" goal="Complete Key Partnerships block">
<action>Guide partnership mapping:</action>

**Partnership Motivations:**
- Optimization and scale (reduce costs)
- Reduction of risk and uncertainty
- Acquisition of resources and activities

**Partnership Types:**
- Strategic alliances (non-competitors)
- Coopetition (strategic partnerships between competitors)
- Joint ventures
- Buyer-supplier relationships

<ask>Who are your key partners and suppliers?</ask>
<ask>Which resources come from partners?</ask>
<ask>Which activities do partners perform?</ask>

<template-output>key_partnerships</template-output>
</step>

<step n="10" goal="Complete Cost Structure block">
<action>Guide cost structure analysis:</action>

**Cost Structure Types:**
- Cost-driven (minimize costs where possible)
- Value-driven (focus on value creation)

**Cost Characteristics:**
- Fixed costs (salaries, rent, utilities)
- Variable costs (per-unit costs)
- Economies of scale
- Economies of scope

<ask>What are the most important costs inherent to the business model?</ask>
<ask>Which key resources are most expensive?</ask>
<ask>Which key activities are most expensive?</ask>
<ask>Is this cost-driven or value-driven?</ask>

<template-output>cost_structure</template-output>
</step>

<step n="11" goal="Synthesize and validate canvas">
<action>Review the complete canvas for:</action>
- Internal consistency (blocks align)
- Value proposition fit to segments
- Revenue streams cover cost structure
- Resources and activities enable delivery

<action>Identify key assumptions to test</action>
<action>Note gaps or areas needing validation</action>

<ask>Does this canvas accurately represent your business model?</ask>
<ask>What assumptions are you most uncertain about?</ask>

<template-output>canvas_synthesis</template-output>
</step>

<step n="12" goal="Generate final output">
<action>Compile complete Business Model Canvas using template</action>
<action>Include assumptions log</action>
<action>Add next steps for validation</action>
<action>Save to {default_output_file}</action>

<template-output>final_canvas</template-output>
</step>

</workflow>
