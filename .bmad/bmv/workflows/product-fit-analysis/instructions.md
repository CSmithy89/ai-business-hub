# Product-Fit Analysis Workflow Instructions

<critical>Every product recommendation requires supporting evidence with source citations</critical>
<critical>Use jina-ai for all competitive and market research</critical>
<critical>Fit scores must be justified with specific criteria, not arbitrary</critical>

## Purpose

This workflow analyzes a validated business idea and determines which product types (Course, Podcast, Book, YouTube, Digital, SaaS, Physical, E-commerce, Website) are the best fit. It identifies competitive gaps in each product category and provides ranked recommendations for BMP to create business plans.

<workflow>

<step n="1" goal="Load and Review Validated Idea">
<action>Read the validated idea intake document</action>
<action>Extract key validation data</action>

<extract_data>
- Core problem being solved
- Target audience description
- Value proposition
- Key differentiators
- Market size indicators (if available)
- Validation score/status
</extract_data>

<action>If market research or competitor mapping documents exist, load and review them</action>
<action>Summarize the opportunity in 2-3 sentences</action>
</step>

<step n="2" goal="Product Type Compatibility Assessment">
<action>For each product type, assess fundamental compatibility with the validated idea</action>

<product_types>
| Code | Type | Evaluate For |
|------|------|--------------|
| BME-COURSE | Online Course | Is there teachable knowledge? Skills to transfer? |
| BME-PODCAST | Podcast | Are there stories to tell? Experts to interview? |
| BME-BOOK | Book/eBook | Is there enough depth for long-form content? |
| BME-YOUTUBE | YouTube | Is the topic visual? Demonstrable? |
| BME-DIGITAL | Digital Product | Can it be packaged as templates/tools? |
| BME-SAAS | SaaS | Does it require software to solve? Automation? |
| BME-PHYSICAL | Physical Product | Is there a tangible product opportunity? |
| BME-ECOMMERCE | E-commerce | Are there products to sell/aggregate? |
| BME-WEBSITE | Website/Blog | Is there ongoing content opportunity? |
</product_types>

<scoring_criteria>
For each product type, score 1-5 on:
1. **Audience Alignment** (1-5): Does target audience consume this product type?
2. **Content Fit** (1-5): Does the idea naturally fit this format?
3. **Monetization Potential** (1-5): Can this product type monetize the idea effectively?
4. **Resource Feasibility** (1-5): Are resources available to create this product type?
5. **Time-to-Market** (1-5): How quickly can this be launched?

**Overall Fit Score** = Average of all criteria (1-5)
</scoring_criteria>

<action>Record initial compatibility scores for all product types</action>
<action>Identify top 5 candidates with score >= 3.0</action>
</step>

<step n="3" goal="Competitive Gap Analysis (Per Product Type)">
<action>For each top candidate product type, research competitive landscape</action>

<searches>
For BME-COURSE:
- "{{topic}} online course"
- "{{topic}} masterclass"
- "learn {{topic}} course"
- "{{topic}} udemy skillshare coursera"

For BME-PODCAST:
- "{{topic}} podcast"
- "{{topic}} audio show"
- "best {{topic}} podcasts"

For BME-BOOK:
- "{{topic}} book amazon"
- "{{topic}} ebook guide"
- "best books about {{topic}}"

For BME-YOUTUBE:
- "{{topic}} youtube channel"
- "{{topic}} tutorial videos"
- "{{topic}} youtubers"

For BME-DIGITAL:
- "{{topic}} templates"
- "{{topic}} tools downloads"
- "{{topic}} resources"

For BME-SAAS:
- "{{topic}} software"
- "{{topic}} app tool"
- "{{topic}} platform"

For BME-PHYSICAL:
- "{{topic}} products"
- "{{topic}} merchandise"
- "{{topic}} kits"

For BME-ECOMMERCE:
- "{{topic}} store shop"
- "{{topic}} products buy"

For BME-WEBSITE:
- "{{topic}} blog"
- "{{topic}} community"
- "{{topic}} resource site"
</searches>

<for_each_product_type>
<action>Identify top 3-5 competitors in this product type</action>
<action>Document what they're doing well</action>
<action>Identify gaps and underserved angles</action>
<action>Note pricing/monetization models used</action>
</for_each_product_type>
</step>

<step n="4" goal="Gap Opportunity Scoring">
<action>For each product type candidate, score the market gaps</action>

<gap_criteria>
1. **Gap Size** (1-5): How significant is the underserved opportunity?
2. **Differentiation Potential** (1-5): Can you be meaningfully different?
3. **Barrier to Entry** (1-5, inverted): How hard is it for others to copy? (5 = hardest)
4. **Growth Trajectory** (1-5): Is demand in this format growing?
</gap_criteria>

<action>Calculate Gap Opportunity Score = Average of criteria</action>
<action>Combine with Fit Score: **Combined Score = (Fit Score + Gap Score) / 2**</action>
</step>

<step n="5" goal="Resource & Synergy Analysis">
<action>Analyze resource requirements for each top product type</action>

<resource_categories>
- **Creation Resources**: Skills, tools, time needed
- **Ongoing Resources**: Maintenance, updates, support
- **Initial Investment**: Estimated cost to launch
- **Revenue Timeline**: Time to first revenue
</resource_categories>

<action>Identify synergies between product types</action>

<synergy_examples>
- Course content can become YouTube videos
- Podcast interviews can become book chapters
- Digital products can be course bonuses
- Blog content drives traffic to all products
- SaaS solves problems taught in courses
</synergy_examples>

<action>Note which products support each other as a portfolio</action>
</step>

<step n="6" goal="Final Ranking and Recommendations">
<action>Create final ranked list of recommended products</action>

<ranking_factors>
1. Combined Score (Fit + Gap) - 40% weight
2. Resource Feasibility - 25% weight
3. Synergy Potential - 20% weight
4. Time-to-Revenue - 15% weight
</ranking_factors>

<recommendation_tiers>
- **Tier 1 (Primary)**: Score >= 4.0 - Recommend building first
- **Tier 2 (Secondary)**: Score 3.0-3.9 - Build after primary products
- **Tier 3 (Future)**: Score 2.5-2.9 - Consider in future expansion
- **Not Recommended**: Score < 2.5 - Do not pursue
</recommendation_tiers>

<action>For each recommended product (Tier 1 & 2), provide:</action>
<output_per_product>
- Product type and code
- Final score with breakdown
- Key competitive gaps to exploit
- Recommended positioning
- Estimated launch timeline
- Synergies with other recommended products
</output_per_product>
</step>

<step n="7" goal="Product Roadmap Sequencing">
<action>Create recommended launch sequence</action>

<sequencing_factors>
- Which products can be built quickest?
- Which products generate revenue fastest?
- Which products create assets for other products?
- What's the logical content/audience build progression?
</sequencing_factors>

<action>Create timeline visualization</action>
<timeline_format>
Phase 1 (Month 1-3): Product A, Product B (foundation)
Phase 2 (Month 4-6): Product C (leverage Phase 1 content)
Phase 3 (Month 7-12): Product D, Product E (expansion)
</timeline_format>
</step>

<step n="8" goal="Compile and Validate">
<action>Populate template with all findings</action>
<action>Verify all competitor research is cited</action>
<action>Run validation checklist</action>
<action>Generate structured output for BMP handoff</action>

<structured_output>
```json
{
  "validated_idea_id": "{{idea_id}}",
  "analysis_date": "{{date}}",
  "recommended_products": [
    {
      "product_code": "BME-COURSE",
      "product_name": "Online Course",
      "tier": 1,
      "combined_score": 4.2,
      "fit_score": 4.5,
      "gap_score": 3.9,
      "key_gaps": ["..."],
      "positioning": "...",
      "synergies": ["BME-YOUTUBE", "BME-DIGITAL"],
      "launch_phase": 1
    }
  ],
  "total_products_recommended": 5,
  "not_recommended": ["BME-PHYSICAL", "BME-ECOMMERCE"]
}
```
</structured_output>

<action>Save product-fit analysis document</action>
</step>

</workflow>
