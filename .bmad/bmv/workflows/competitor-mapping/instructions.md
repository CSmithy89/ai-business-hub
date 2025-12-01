# Competitor Mapping Workflow Instructions

<critical>Every competitor data point requires a source citation with URL</critical>
<critical>Use jina-ai for all web research</critical>

<workflow>

<step n="1" goal="Initial Competitor Discovery">
<action>Search for competitors in the product category</action>

<searches>
1. "{{product_category}} software tools"
2. "{{product_category}} companies startups"
3. "alternatives to [known competitor]"
4. "{{product_category}} market leaders"
5. "{{product_category}} G2 comparison"
</searches>

<action>Create initial list of 10-15 potential competitors</action>
<action>Categorize as: Direct, Indirect, or Substitute</action>
</step>

<step n="2" goal="Competitor Profiling">
<action>For each top 5-8 competitors, gather:</action>

<data_points>
- Company name and URL
- Founded year
- Headquarters location
- Funding (total raised, last round)
- Employee count
- Target customer segment
- Pricing model and range
- Key features (top 5)
- Strengths (from reviews)
- Weaknesses (from reviews)
- Recent news (last 6 months)
</data_points>

<sources>
- Official website
- Crunchbase/PitchBook
- G2/Capterra reviews
- LinkedIn company page
- Press releases
- TechCrunch/industry news
</sources>
</step>

<step n="3" goal="Feature Comparison Matrix">
<action>Create feature comparison across competitors</action>
<action>Identify feature categories relevant to the market</action>
<action>Rate each competitor on key features</action>

<output_format>
| Feature | Competitor A | Competitor B | Competitor C | Your Product |
|---------|--------------|--------------|--------------|--------------|
| Feature 1 | Yes/No | Yes/No | Yes/No | Planned |
| Feature 2 | Basic/Advanced | Basic/Advanced | - | Advanced |
</output_format>
</step>

<step n="4" goal="Pricing Analysis">
<action>Document pricing for all competitors</action>
<action>Identify pricing models (subscription, usage, one-time)</action>
<action>Note target segments by price tier</action>

<output_format>
| Competitor | Pricing Model | Entry Price | Mid-Tier | Enterprise | Source |
|------------|---------------|-------------|----------|------------|--------|
</output_format>
</step>

<step n="5" goal="Porter's Five Forces Analysis">
<action>Assess each force with evidence</action>

<forces>
1. **Threat of New Entrants**: Barriers to entry, capital requirements, tech complexity
2. **Bargaining Power of Suppliers**: Dependency on key suppliers/platforms
3. **Bargaining Power of Buyers**: Customer concentration, switching costs
4. **Threat of Substitutes**: Alternative solutions, different approaches
5. **Competitive Rivalry**: Number of competitors, market maturity, differentiation
</forces>

<rating_scale>
- Low (favorable): Score 1-2
- Medium: Score 3
- High (unfavorable): Score 4-5
</rating_scale>
</step>

<step n="6" goal="Positioning Map">
<action>Select two strategic dimensions for positioning</action>

<dimension_options>
- Price vs Quality/Features
- Ease of Use vs Power/Complexity
- SMB Focus vs Enterprise Focus
- Horizontal vs Vertical
- Self-Serve vs High-Touch Sales
</dimension_options>

<action>Plot all competitors on the map</action>
<action>Identify white space opportunities</action>
<action>Recommend positioning for the new entrant</action>
</step>

<step n="7" goal="Competitive Intelligence Summary">
<action>Synthesize key insights</action>

<insights>
- Market leaders and their moats
- Emerging challengers to watch
- Underserved segments identified
- Feature gaps in the market
- Pricing opportunities
- Positioning recommendations
</insights>
</step>

<step n="8" goal="Compile and Save">
<action>Populate template with all findings</action>
<action>Verify all sources are cited</action>
<action>Run validation checklist</action>
<action>Save competitor mapping document</action>
</step>

</workflow>
