# Brand Strategy Development Workflow Instructions

<critical>Brand strategy must be grounded in business context from BMP - no assumptions</critical>
<critical>Archetype selection must have documented rationale based on audience and positioning</critical>
<critical>All competitive analysis must use real data, not invented competitors</critical>

## Purpose

This workflow develops the strategic foundation for all brand identity work. It defines WHO the brand is (archetype), WHO it serves (personas), WHERE it stands (positioning), and WHAT it says (messaging). All subsequent branding workflows depend on this strategic foundation.

<workflow>

<step n="1" goal="Analyze Business Context">
<action>Load business plan and context from BMP module</action>
<action>Extract and summarize key business elements</action>

<extract_data>
From BMP outputs, gather:
- Business name and core offering
- Value proposition statement
- Target audience description
- Competitive positioning from business model
- Revenue model and pricing strategy
- Growth aspirations
</extract_data>

<present_to_user>
**Business Context Summary**

| Element | Value |
|---------|-------|
| Business Name | {{business_name}} |
| Core Offering | {{offering}} |
| Value Proposition | {{value_prop}} |
| Target Audience | {{audience}} |
| Positioning | {{positioning}} |

Is this accurate? Any corrections needed?
</present_to_user>
</step>

<step n="2" goal="Competitive Brand Analysis">
<action>Identify 3-5 direct competitors</action>
<action>Analyze their brand positioning</action>
<action>Map competitive landscape</action>

<analysis_framework>
For each competitor, assess:
1. **Brand Archetype**: What personality do they project?
2. **Visual Identity**: Color, typography, imagery style
3. **Voice & Tone**: How do they communicate?
4. **Positioning**: What space do they occupy?
5. **Strengths**: What do they do well?
6. **Weaknesses**: Where are the gaps?
</analysis_framework>

<perceptual_map>
Create a 2x2 positioning map with relevant axes:
- Traditional ←→ Innovative
- Premium ←→ Accessible
- Personal ←→ Professional
- Playful ←→ Serious

Plot competitors and identify white space opportunities.
</perceptual_map>

<output>
Generate competitive-analysis.md with:
- Competitor profiles
- Positioning map
- White space opportunities
- Differentiation strategies
</output>
</step>

<step n="3" goal="Select Brand Archetype">
<action>Review 12 Jungian archetypes</action>
<action>Match archetype to business values and audience</action>
<action>Select primary and secondary archetype</action>

<archetype_analysis>
Evaluate fit for each archetype based on:
1. **Audience Resonance**: Will this archetype appeal to target customers?
2. **Value Alignment**: Does it reflect business values?
3. **Competitive Differentiation**: Does it stand out?
4. **Authenticity**: Can the brand genuinely embody this?
5. **Flexibility**: Does it allow for growth?

| Archetype | Audience Fit | Value Fit | Differentiation | Authenticity | Score |
|-----------|--------------|-----------|-----------------|--------------|-------|
| {{archetype}} | {{1-5}} | {{1-5}} | {{1-5}} | {{1-5}} | {{/20}} |
</archetype_analysis>

<selection>
**Primary Archetype**: {{archetype}}
- Core desire: {{desire}}
- Strategy: {{strategy}}
- Brand voice: {{voice}}
- Examples: {{example_brands}}

**Secondary Archetype** (if applicable): {{archetype}}
- How it complements primary: {{rationale}}
</selection>

<validation>
Confirm archetype selection with user:
- Does this feel authentic to your business?
- Can you commit to this personality long-term?
- Does it differentiate from competitors?
</validation>

<output>
Generate archetype-profile.md with:
- Selected archetype(s)
- Detailed characteristics
- Voice and tone implications
- Visual direction implications
- Do's and don'ts
</output>
</step>

<step n="4" goal="Develop Target Personas">
<action>Create 2-3 detailed customer personas</action>
<action>Include demographics, psychographics, and behaviors</action>

<persona_template>
## Persona: {{persona_name}}

**Demographics**
- Age: {{range}}
- Location: {{geography}}
- Income: {{range}}
- Education: {{level}}
- Occupation: {{field}}

**Psychographics**
- Values: {{values}}
- Attitudes: {{attitudes}}
- Interests: {{interests}}
- Lifestyle: {{lifestyle}}

**Behaviors**
- Buying habits: {{habits}}
- Media consumption: {{channels}}
- Decision drivers: {{drivers}}
- Information sources: {{sources}}

**Pain Points**
1. {{pain_1}}
2. {{pain_2}}
3. {{pain_3}}

**Goals & Aspirations**
1. {{goal_1}}
2. {{goal_2}}
3. {{goal_3}}

**Brand Relationship**
- What they expect from brands: {{expectations}}
- Communication preferences: {{preferences}}
- Loyalty drivers: {{drivers}}

**Quote**: "{{representative_quote}}"
</persona_template>

<output>
Generate persona-cards.md with:
- 2-3 complete personas
- Persona summary table
- Priority ranking
- Communication implications
</output>
</step>

<step n="5" goal="Craft Positioning Statement">
<action>Develop comprehensive positioning statement</action>
<action>Create tagline options</action>

<positioning_framework>
**Classic Positioning Statement Format**:

For **[target audience]**
who **[need/problem]**,
**[brand name]** is the **[category]**
that **[key benefit]**.
Unlike **[competitors]**,
we **[key differentiator]**.

**Alternative: Brand Positioning Ladder**
1. Attributes: What we offer (features)
2. Benefits: What customers get (functional)
3. Values: Why it matters (emotional)
4. Personality: Who we are (archetype)
</positioning_framework>

<tagline_development>
Develop 3-5 tagline options:
- Short (2-4 words)
- Memorable
- Captures essence
- Differentiating
- Timeless

| Tagline | Strengths | Concerns |
|---------|-----------|----------|
| {{tagline_1}} | {{strengths}} | {{concerns}} |
| {{tagline_2}} | {{strengths}} | {{concerns}} |
| {{tagline_3}} | {{strengths}} | {{concerns}} |

Recommend: {{recommended_tagline}}
Rationale: {{rationale}}
</tagline_development>

<output>
Generate positioning-statement.md with:
- Full positioning statement
- Tagline with rationale
- Positioning pillars
- Elevator pitch (30-second version)
</output>
</step>

<step n="6" goal="Build Messaging Framework">
<action>Create key messages with proof points</action>
<action>Develop boilerplate and elevator pitch</action>

<messaging_hierarchy>
**Brand Promise**: {{one_line_promise}}

**Key Messages** (3-5 core messages):

| Message | Proof Points | Use Case |
|---------|--------------|----------|
| {{message_1}} | {{proof_1}}, {{proof_2}} | {{when_to_use}} |
| {{message_2}} | {{proof_1}}, {{proof_2}} | {{when_to_use}} |
| {{message_3}} | {{proof_1}}, {{proof_2}} | {{when_to_use}} |

**Elevator Pitch** (30 seconds):
{{pitch}}

**Boilerplate** (Company description, 50-100 words):
{{boilerplate}}

**Value Proposition Canvas**:
- Customer jobs: {{jobs}}
- Customer pains: {{pains}}
- Customer gains: {{gains}}
- Pain relievers: {{relievers}}
- Gain creators: {{creators}}
- Products/services: {{offerings}}
</messaging_hierarchy>

<output>
Generate messaging-framework.md with:
- Complete messaging hierarchy
- Proof points library
- Usage guidelines
- Audience-specific variations
</output>
</step>

<step n="7" goal="Validate Strategy">
<action>Review all strategy elements for consistency</action>
<action>Run validation checklist</action>
<action>Compile final brand strategy document</action>

<consistency_check>
Verify alignment:
- [ ] Archetype aligns with positioning
- [ ] Personas reflect target audience from BMP
- [ ] Messaging supports value proposition
- [ ] Differentiation is clear and defensible
- [ ] All elements feel cohesive
</consistency_check>

<compile_document>
Generate brand-strategy-document.md combining:
1. Executive summary
2. Business context
3. Competitive analysis
4. Archetype profile
5. Target personas
6. Positioning statement
7. Messaging framework
8. Next steps (handoff to brand-voice, visual-identity)
</compile_document>
</step>

</workflow>

## Anti-Hallucination Protocol

- All competitor data must come from user input or documented research
- Archetype selection must have explicit scoring rationale
- Personas must be based on provided audience data, not invented
- Positioning must differentiate from identified competitors only
- Do not invent market data, statistics, or trends
