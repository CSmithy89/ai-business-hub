# Brand Health Audit Workflow Instructions

<critical>All audit findings must be based on documented evidence</critical>
<critical>Scores must use standardized criteria - no arbitrary grading</critical>

## Purpose

This workflow conducts a comprehensive brand health audit to assess consistency, effectiveness, and competitive position. It generates actionable recommendations for brand improvement.

<workflow>

<step n="1" goal="Gather Audit Materials">
<action>Collect brand guidelines for reference</action>
<action>Gather samples from all touchpoints</action>

<materials_checklist>
**Brand Standards**:
- [ ] Brand guidelines document
- [ ] Visual identity guide
- [ ] Voice guidelines

**Touchpoint Samples**:
- [ ] Website screenshots
- [ ] Social media profiles
- [ ] Email examples
- [ ] Print materials
- [ ] Customer communications
- [ ] Marketing materials

**Performance Data** (if available):
- [ ] Brand awareness metrics
- [ ] Customer feedback
- [ ] Social sentiment
- [ ] Engagement data
</materials_checklist>
</step>

<step n="2" goal="Visual Consistency Audit">
<action>Check logo usage across touchpoints</action>
<action>Verify color accuracy</action>
<action>Assess typography compliance</action>

<visual_audit_criteria>
## Logo Audit

| Criterion | Standard | Finding | Score (1-5) |
|-----------|----------|---------|-------------|
| Correct version used | Per guidelines | | |
| Clear space maintained | {{multiplier}}x | | |
| Minimum size respected | {{min_size}} | | |
| No distortion | Never stretch | | |
| Correct colors | #{{hex}} | | |
| Appropriate background | Per guidelines | | |

## Color Audit

| Touchpoint | Expected | Actual | Accurate? |
|------------|----------|--------|-----------|
| Website primary | #{{hex}} | | |
| Social media | #{{hex}} | | |
| Print materials | PMS {{number}} | | |

## Typography Audit

| Usage | Expected Font | Actual | Correct? |
|-------|---------------|--------|----------|
| Headlines | {{font}} | | |
| Body copy | {{font}} | | |
| CTAs | {{font}} | | |
</visual_audit_criteria>
</step>

<step n="3" goal="Verbal Consistency Audit">
<action>Assess voice attribute presence</action>
<action>Check tone appropriateness</action>
<action>Verify messaging consistency</action>

<verbal_audit_criteria>
## Voice Audit

| Attribute | Definition | Present? | Examples |
|-----------|------------|----------|----------|
| {{attr_1}} | {{definition}} | Yes/No/Partial | |
| {{attr_2}} | {{definition}} | Yes/No/Partial | |
| {{attr_3}} | {{definition}} | Yes/No/Partial | |

## Tone Audit

| Context | Expected Tone | Actual | Appropriate? |
|---------|---------------|--------|--------------|
| Marketing | {{tone}} | | |
| Support | {{tone}} | | |
| Social | {{tone}} | | |

## Messaging Audit

| Element | Standard | Found | Consistent? |
|---------|----------|-------|-------------|
| Tagline | {{tagline}} | | |
| Key message 1 | {{message}} | | |
| Key message 2 | {{message}} | | |
| Value prop | {{prop}} | | |
</verbal_audit_criteria>
</step>

<step n="4" goal="Touchpoint Analysis">
<action>Score each touchpoint for brand compliance</action>
<action>Document specific issues</action>

<touchpoint_audit>
## Touchpoint Scorecard

| Touchpoint | Visual (1-5) | Verbal (1-5) | Overall | Priority Issues |
|------------|--------------|--------------|---------|-----------------|
| Website | | | | |
| Social - Facebook | | | | |
| Social - Instagram | | | | |
| Social - LinkedIn | | | | |
| Email marketing | | | | |
| Customer service | | | | |
| Sales materials | | | | |
| Print collateral | | | | |

**Scoring Guide**:
- 5 = Excellent - Fully compliant
- 4 = Good - Minor issues
- 3 = Fair - Some inconsistencies
- 2 = Poor - Significant issues
- 1 = Critical - Major non-compliance
</touchpoint_audit>
</step>

<step n="5" goal="Competitive Position Analysis">
<action>Compare brand against 3-5 competitors</action>
<action>Assess relative positioning</action>

<competitive_audit>
## Competitive Brand Comparison

| Factor | Our Brand | Comp 1 | Comp 2 | Comp 3 |
|--------|-----------|--------|--------|--------|
| Visual distinctiveness | | | | |
| Message clarity | | | | |
| Positioning clarity | | | | |
| Brand consistency | | | | |
| Digital presence | | | | |

## Perceptual Position

Where do we stand vs. competitors on key attributes?
- Professional ←→ Casual
- Traditional ←→ Innovative
- Premium ←→ Accessible
</competitive_audit>
</step>

<step n="6" goal="Calculate Health Scores">
<action>Calculate category scores</action>
<action>Generate overall brand health score</action>

<health_scoring>
## Brand Health Scorecard

| Category | Weight | Score (0-100) | Weighted Score |
|----------|--------|---------------|----------------|
| Visual Consistency | 25% | | |
| Verbal Consistency | 25% | | |
| Touchpoint Quality | 25% | | |
| Competitive Position | 25% | | |
| **Overall Brand Health** | 100% | | **{{score}}** |

## Score Interpretation

- 90-100: Excellent - Minor refinements only
- 75-89: Good - Some improvements needed
- 60-74: Fair - Significant gaps to address
- Below 60: Critical - Major brand attention required

## Trend (if historical data available)

| Period | Score | Change |
|--------|-------|--------|
| Current | {{score}} | |
| Previous | {{score}} | {{delta}} |
</health_scoring>
</step>

<step n="7" goal="Generate Recommendations">
<action>Create prioritized action items</action>
<action>Assign urgency levels</action>

<recommendations>
## Priority Actions

### Immediate (Next 30 Days)
| Issue | Impact | Action | Owner |
|-------|--------|--------|-------|
| {{issue}} | {{impact}} | {{action}} | |

### Short-term (90 Days)
| Issue | Impact | Action | Owner |
|-------|--------|--------|-------|
| {{issue}} | {{impact}} | {{action}} | |

### Long-term (12 Months)
| Issue | Impact | Action | Owner |
|-------|--------|--------|-------|
| {{issue}} | {{impact}} | {{action}} | |
</recommendations>
</step>

<step n="8" goal="Compile Audit Report">
<action>Generate comprehensive report</action>
<action>Include all findings and recommendations</action>

<compile_report>
Generate brand-audit-report.md with:
1. Executive summary
2. Audit methodology
3. Visual consistency findings
4. Verbal consistency findings
5. Touchpoint analysis
6. Competitive position
7. Brand health scorecard
8. Recommendations
9. Next steps
</compile_report>
</step>

</workflow>

## Anti-Hallucination Protocol

- All findings must cite specific evidence
- Scores must use defined criteria
- Do not invent performance data
- Competitive analysis must use real competitors
- Flag assumptions clearly
