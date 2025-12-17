# Crisis Response Workflow

## Purpose
Handle negative PR, brand crises, or reputation-threatening situations with rapid response coordination via the Shield (Crisis Response) agent.

## Context Variables
- `{{crisis_type}}` - Type of crisis detected
- `{{severity}}` - Crisis severity level
- `{{source}}` - Where crisis originated
- `{{affected_platforms}}` - Platforms impacted

## Prerequisites
- Shield agent monitoring enabled
- Crisis keywords configured
- Escalation contacts defined
- Response templates prepared

## IMPORTANT
**This workflow ALWAYS requires human approval. No automated responses are permitted for crisis situations.**

## Execution Steps

### Step 1: Crisis Detection
Shield agent detects crisis via:

```
CRISIS ALERT TRIGGERED

Detection Source: Social listening
Time: March 15, 2025 at 2:34 PM EST
Trigger: Keyword "lawsuit" + company mention

Initial Findings:
-----------------
- 47 mentions in last hour (baseline: 5)
- Sentiment: 89% negative
- Viral velocity: HIGH
- Source: Twitter viral thread
- Reach estimate: 125K impressions

[View Details] [Assess Severity] [Dismiss False Positive]
```

### Step 2: Severity Assessment
Classify crisis level:

| Level | Criteria | Response Time | Action |
|-------|----------|---------------|--------|
| WATCH | Negative trend, localized | Monitor 24h | Observe only |
| WARNING | Growing negative, moderate reach | 4 hours | Prepare response |
| CRITICAL | Viral negative, brand threat | 1 hour | Active response |
| EMERGENCY | Major incident, legal/safety | Immediate | All-hands, pause all |

```
SEVERITY ASSESSMENT

Current Assessment: ⚠️ CRITICAL

Indicators:
- Viral velocity: Doubling every 30 min
- Influencer involvement: 3 accounts >100K
- Media pickup: 2 news outlets mentioned
- Sentiment trajectory: Declining rapidly

Impact Assessment:
- Brand reputation: HIGH risk
- Business impact: MODERATE risk
- Legal exposure: LOW risk
- Customer trust: HIGH risk

[Confirm CRITICAL] [Escalate to EMERGENCY] [Downgrade]
```

### Step 3: Pause Scheduled Content
For WARNING+ severity:

```
CONTENT PAUSE

Current Queue Status:
- 12 posts scheduled next 24 hours
- 3 posts in next 2 hours

Recommended Action: PAUSE ALL

Rationale:
"Promotional content during crisis appears tone-deaf
and can amplify negative sentiment."

Affected Posts:
1. 3:00 PM - Product promotion (Twitter) - PAUSE
2. 4:00 PM - Tips article (LinkedIn) - PAUSE
3. 5:00 PM - Story series (Instagram) - PAUSE
...

[Pause All] [Pause 24h Only] [Keep Scheduled]
```

### Step 4: Gather Context
Compile crisis intelligence:

```
CRISIS INTELLIGENCE REPORT

What Happened:
--------------
Summary: Former employee posted allegations about
workplace culture on Twitter. Thread went viral with
15K retweets.

Timeline:
- 1:45 PM: Initial tweet posted
- 2:00 PM: First 1K retweets
- 2:15 PM: Influencer amplification
- 2:30 PM: News outlet pickup
- 2:34 PM: Crisis alert triggered

Key Stakeholders:
-----------------
- Original poster: @former_employee (45K followers)
- Amplifiers: @techreporter (180K), @workersunite (90K)
- Media: TechNews, BusinessInsider mentioned

Sentiment Analysis:
-------------------
Supportive of poster: 78%
Supportive of brand: 12%
Neutral/watching: 10%

Current Conversation:
---------------------
[View live feed of mentions]
```

### Step 5: Draft Response Options
Shield agent prepares responses:

```
RESPONSE OPTIONS

Option A: Acknowledge and Investigate
-------------------------------------
"We've seen the concerns raised by [name]. We take all
employee feedback seriously and are reviewing the
situation. We'll share more when we have a fuller picture."

Tone: Measured, non-defensive
Risk: May appear evasive
Recommended for: Allegations requiring investigation

Option B: Empathetic Response
-----------------------------
"We're deeply troubled by [name]'s experience. This is
not reflective of our values. We're reaching out directly
and taking immediate steps to address the concerns raised."

Tone: Empathetic, action-oriented
Risk: May be seen as admission
Recommended for: Clear-cut issues with obvious fix

Option C: Statement with Context
--------------------------------
"We've seen [name]'s thread. While we respect their
perspective, [relevant context]. We remain committed
to [company values]."

Tone: Firm but respectful
Risk: May escalate if facts disputed
Recommended for: Mischaracterizations

[Customize Response] [Generate More Options]
```

### Step 6: Human Decision Required
Route to decision-maker:

```
⚠️ HUMAN APPROVAL REQUIRED

Crisis: Workplace culture allegations
Severity: CRITICAL
Time elapsed: 45 minutes

Escalation Path:
1. Social Media Manager → [NOTIFIED]
2. PR Director → [PENDING]
3. Legal Counsel → [STANDBY]
4. CEO → [STANDBY if needed]

Decision Needed:
- Which response option?
- Which platforms first?
- Any legal review needed?
- Who posts/speaks?

[Send to Decision-Maker] [Escalate Higher] [Add to Call]
```

### Step 7: Execute Response
After approval:

```
RESPONSE EXECUTION

Approved Response: Option B (Empathetic)
Approved by: Sarah Johnson, PR Director
Posted by: Official company account

Execution Plan:
---------------
1. [NOW] Post to Twitter (origin platform)
2. [+5 min] Post to LinkedIn (professional audience)
3. [+15 min] Instagram story (if engagement there)
4. [+30 min] Direct message to original poster
5. [Ongoing] Monitor and respond to replies

Response Posted:
----------------
Platform: Twitter
Time: 3:22 PM EST
URL: twitter.com/company/status/...

[Monitor Responses] [Prepare Follow-up]
```

### Step 8: Monitor Reception
Track response effectiveness:

```
RESPONSE MONITORING

Time since response: 2 hours

Sentiment Shift:
----------------
Before response: 78% negative
After response:  52% negative (-26%)
Trajectory: IMPROVING

Response Metrics:
-----------------
Impressions: 45,000
Engagements: 2,340
Replies: 187 (analyzing...)

Reply Sentiment:
- Positive/supportive: 34%
- Still negative: 41%
- Questions/neutral: 25%

Key Reply Themes:
- "Good first step" (positive)
- "Actions speak louder" (skeptical)
- "What specifically will change?" (questioning)

[Generate Follow-up] [Engage Replies] [Hold]
```

### Step 9: Adjust as Needed
Iterate based on reception:

```
STRATEGY ADJUSTMENT

Current Status: Sentiment improving but questions remain

Recommended Next Steps:
1. Prepare detailed action plan post
2. Schedule leadership video message
3. Engage directly with thoughtful critics
4. Prepare FAQ for common questions

Follow-up Content:
------------------
Draft: "Here are the specific steps we're taking:
1. Immediate HR review
2. Third-party audit commissioned
3. Town hall scheduled for Friday
..."

[Queue Follow-up] [Schedule Update] [Wait and Monitor]
```

### Step 10: Document and Learn
Archive crisis for future reference:

```
CRISIS DOCUMENTATION

Crisis: Workplace Culture Allegations
Duration: 6 hours (active response)
Resolution: Managed, sentiment recovering

Summary:
--------
Initial severity: CRITICAL
Final outcome: Controlled, ongoing improvement plan

What Worked:
- Rapid detection (within 1 hour)
- Empathetic response tone
- Direct engagement with critics
- Transparent follow-up plan

What Could Improve:
- Faster escalation to PR
- Pre-drafted responses for this scenario
- Better monitoring of employee sentiment

Added to Knowledge Base:
- Crisis keywords updated
- Response template saved
- Escalation process documented

[Archive] [Generate Full Report] [Update Playbook]
```

## Severity Response Matrix

| Severity | Auto-Actions | Human Required | SLA |
|----------|--------------|----------------|-----|
| WATCH | Monitor, alert | None | 24h review |
| WARNING | Prepare drafts | Response approval | 4h |
| CRITICAL | Pause content | All decisions | 1h |
| EMERGENCY | Pause all, alert all | Everything | Immediate |

## Crisis Types

| Type | Indicators | Response Priority |
|------|------------|-------------------|
| Product Issue | Complaints, returns | Technical + empathy |
| Employee Relations | Workplace allegations | HR + legal + PR |
| Data/Security | Breach, hack | Technical + legal |
| Executive | Leadership controversy | PR + legal |
| Misinformation | False claims spreading | Factual correction |

## Error Handling

| Error | Resolution |
|-------|------------|
| Alert fatigue | Tune sensitivity |
| Slow escalation | Auto-escalate after SLA |
| Response rejected | Queue alternatives |
| Platform outage | Use backup channels |

## Events Emitted
- `social.crisis.detected` - Crisis alert triggered
- `social.crisis.escalated` - Severity increased
- `social.crisis.responded` - Response posted
- `social.crisis.resolved` - Crisis marked handled

## Related Workflows
- `manage-calendar` - Pause scheduled content
- `analyze-performance` - Monitor sentiment
- `report-generate` - Crisis report
