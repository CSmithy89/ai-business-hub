# BM-Social Module Brief (Expanded)

**Module Code:** `bm-social`
**Version:** 1.0.0
**Layer:** Operations (OPERATE Phase)
**Status:** Brief Complete - Ready for PRD
**Last Updated:** 2025-12-17

---

## Executive Summary

BM-Social is a comprehensive AI-powered social media management module that enables multi-platform scheduling, content creation, analytics, social listening, and engagement management. The module leverages a hybrid agent architecture with 18 specialized agents, 15+ workflows, and deep platform integrations.

### Vision

Transform social media management from reactive posting to proactive, AI-orchestrated brand communication with:
- **Intelligent Content Creation** - AI agents that understand platform-specific requirements
- **Optimal Timing** - Machine learning-based scheduling for maximum engagement
- **Unified Management** - Single dashboard for all platforms, analytics, and engagement
- **Brand Consistency** - Automated brand voice enforcement across all content
- **Crisis Response** - Real-time monitoring with rapid response capabilities

---

## Module Architecture

### Agent Team (18 Agents: 6 Core + 9 Platform + 3 Specialized)

#### Core Agents (6)

| Agent | Code Name | Personality | Primary Role | Key Capabilities |
|-------|-----------|-------------|--------------|------------------|
| **Conductor** | `social-orchestrator` | Strategic, organized | Orchestrates all social activities | Cross-platform coordination, approval routing, team delegation |
| **Spark** | `content-strategist` | Creative, brand-focused | Content strategy & delegation | Campaign planning, brand voice enforcement, content themes |
| **Tempo** | `scheduler` | Precise, analytical | Manages posting schedules | Optimal time analysis, conflict prevention, recurring schedules |
| **Pulse** | `analytics` | Data-driven, insightful | Analyzes performance & reporting | Metric aggregation, trend detection, ROI calculation |
| **Echo** | `engagement` | Responsive, social | Manages engagement & community | Comment triage, response suggestions, sentiment tracking |
| **Scout** | `trend-scout` | Curious, connected | Identifies trends & opportunities | Trending topics, competitor monitoring, content inspiration |

#### Platform Specialists (9)

| Agent | Code Name | Platform | Character Limits | Specializations |
|-------|-----------|----------|------------------|-----------------|
| **Chirp** | `twitter-specialist` | Twitter/X | 280/25K (Premium) | Threads, hooks, viral tactics, polls, Spaces |
| **Link** | `linkedin-specialist` | LinkedIn | 3,000 | B2B tone, thought leadership, carousels, documents, articles |
| **Meta** | `facebook-specialist` | Facebook | 63,206 | Pages, groups, community building, events, Marketplace |
| **Gram** | `instagram-specialist` | Instagram | 2,200 | Visual-first, Reels, Stories, carousels, hashtag strategy |
| **Tok** | `tiktok-specialist` | TikTok | 4,000 | Trend-jacking, hooks, native style, duets, sounds, stitches |
| **Tube** | `youtube-specialist` | YouTube | 5,000 | Titles, thumbnails, descriptions, Shorts, SEO, end screens |
| **Pin** | `pinterest-specialist` | Pinterest | 500 | Pins, boards, visual search, SEO, Idea Pins, Rich Pins |
| **Thread** | `threads-specialist` | Threads | 500 | Conversational, cross-posting, Instagram integration |
| **Blue** | `bluesky-specialist` | Bluesky/Mastodon | 300/500 | Decentralized, community norms, federation, CW usage |

#### Specialized Agents (3 - NEW)

| Agent | Code Name | Personality | Primary Role | Key Capabilities |
|-------|-----------|-------------|--------------|------------------|
| **Sentinel** | `listening-agent` | Vigilant, alert | Brand monitoring & alerts | Mention tracking, sentiment analysis, crisis detection |
| **Radar** | `competitive-intel` | Analytical, strategic | Competitive intelligence | Competitor tracking, share of voice, market trends |
| **Shield** | `crisis-response` | Calm, decisive | Crisis & reputation management | Rapid response, escalation, messaging coordination |

---

### Agent Detailed Specifications

#### Conductor (Social Orchestrator)

**Personality Profile:**
- Communication style: Strategic, commanding, organized
- Decision-making: Data-informed, collaborative
- Interaction pattern: Delegates effectively, maintains oversight

**Primary Responsibilities:**
1. Route user requests to appropriate specialists
2. Coordinate multi-platform campaigns
3. Manage approval workflows
4. Ensure cross-platform consistency
5. Monitor team workload and capacity

**Commands:**
| Command | Action |
|---------|--------|
| `*status` | Show social media overview dashboard |
| `*campaign` | Launch campaign coordination workflow |
| `*schedule` | Open scheduling workflow |
| `*create` | Create new content |
| `*analyze` | View analytics dashboard |
| `*connect` | Connect new platform |
| `*team` | View agent team status |

**Decision Matrix:**
| User Request | Route To |
|--------------|----------|
| Create content for [platform] | Platform Specialist |
| Create content for all platforms | Spark (Content Strategist) |
| Schedule posts | Tempo (Scheduler) |
| View analytics | Pulse (Analytics) |
| Check mentions/comments | Echo (Engagement) |
| What's trending | Scout (Trend Scout) |
| Monitor competitors | Radar (Competitive Intel) |
| Handle negative PR | Shield (Crisis Response) |

---

#### Spark (Content Strategist)

**Personality Profile:**
- Communication style: Creative, inspiring, brand-focused
- Decision-making: Creative with strategic rationale
- Interaction pattern: Collaborative ideation, quality-focused

**Primary Responsibilities:**
1. Develop content themes and campaigns
2. Maintain brand voice consistency (integrates with BM-Brand)
3. Delegate to platform specialists for platform-optimized content
4. Review and approve specialist output
5. Manage content pillars and editorial calendar

**Content Pillar Management:**
| Pillar | Description | Platforms | Frequency |
|--------|-------------|-----------|-----------|
| Educational | How-to, tips, tutorials | All | 3x/week |
| Promotional | Products, services, offers | All | 2x/week |
| Engagement | Questions, polls, UGC | All | 2x/week |
| Behind-the-Scenes | Team, culture, process | Instagram, TikTok, LinkedIn | 1x/week |
| Curated | Industry news, trends | Twitter, LinkedIn | 2x/week |

**AI Integration:**
- Uses BYOAI for creative ideation
- References BM-Brand voice guidelines
- Accesses content templates library
- Generates platform-specific variations

---

#### Tempo (Scheduler)

**Personality Profile:**
- Communication style: Precise, methodical, analytical
- Decision-making: Data-driven, optimization-focused
- Interaction pattern: Efficient, detail-oriented

**Primary Responsibilities:**
1. Determine optimal posting times per platform
2. Manage unified content calendar
3. Handle recurring schedules
4. Prevent posting conflicts and oversaturation
5. Balance posting frequency across platforms

**Optimal Timing Algorithm:**
| Factor | Weight | Source |
|--------|--------|--------|
| Historical engagement data | 40% | Analytics snapshots |
| Industry benchmarks | 20% | Platform data |
| Audience timezone distribution | 20% | Integration settings |
| Platform algorithm preferences | 10% | Research data |
| Content type optimization | 10% | Performance analysis |

**Scheduling Rules:**
| Rule | Description |
|------|-------------|
| Minimum Spacing | 2 hours between posts on same platform |
| Maximum Daily | Platform-specific limits (e.g., 5/day Twitter) |
| Weekend Adjustment | Reduce frequency by 30% |
| Holiday Detection | Pause scheduled posts on holidays |
| Conflict Prevention | Alert on overlapping campaign times |

---

#### Pulse (Analytics Agent)

**Personality Profile:**
- Communication style: Data-driven, insightful, clear
- Decision-making: Evidence-based, trend-aware
- Interaction pattern: Reports findings, suggests improvements

**Primary Responsibilities:**
1. Collect metrics from all platforms
2. Generate unified performance reports
3. Identify top-performing content patterns
4. Track follower growth trends
5. Benchmark against goals and competitors
6. Calculate ROI for campaigns

**Report Types:**
| Report | Frequency | Audience | Key Metrics |
|--------|-----------|----------|-------------|
| Daily Digest | Daily | Social Manager | Posts published, engagement, reach |
| Weekly Summary | Weekly | Marketing Lead | Growth, top performers, trends |
| Monthly Analytics | Monthly | Executive | ROI, brand awareness, benchmarks |
| Campaign Report | Per Campaign | All Stakeholders | Campaign-specific KPIs |
| Competitive Report | Weekly | Strategy Team | Share of voice, competitor analysis |

**Metrics Framework:**
| Metric Category | Metrics Included |
|-----------------|------------------|
| Reach | Impressions, reach, views, profile visits |
| Engagement | Likes, comments, shares, saves, clicks |
| Growth | Follower count, net followers, growth rate |
| Performance | Engagement rate, amplification rate, virality rate |
| Conversion | Click-through rate, link clicks, conversions |

---

#### Echo (Engagement Agent)

**Personality Profile:**
- Communication style: Responsive, friendly, brand-appropriate
- Decision-making: Quick triage, escalation-aware
- Interaction pattern: Conversational, empathetic

**Primary Responsibilities:**
1. Monitor all comments and messages across platforms
2. Triage incoming engagement by priority
3. Suggest response templates by context
4. Flag urgent items for human review
5. Track conversation threads
6. Identify influencer interactions

**Engagement Triage Matrix:**
| Signal | Priority | Action |
|--------|----------|--------|
| Negative sentiment + high follower count | CRITICAL | Immediate escalation to Shield |
| Question about product/service | HIGH | Generate response, queue for approval |
| Positive testimonial | HIGH | Thank + request permission to share |
| General positive comment | MEDIUM | Like + brief response |
| Spam/irrelevant | LOW | Hide/delete if appropriate |
| Influencer interaction | HIGH | Flag for personalized response |

**Response Templates:**
| Context | Template Category |
|---------|-------------------|
| Thank you | Appreciation responses |
| Question | FAQ-based responses |
| Complaint | Empathy + resolution path |
| Product inquiry | Info + CTA |
| Collaboration request | Redirect to appropriate channel |

---

#### Scout (Trend Scout)

**Personality Profile:**
- Communication style: Curious, enthusiastic, connected
- Decision-making: Opportunity-focused, timing-aware
- Interaction pattern: Proactive suggestions, real-time alerts

**Primary Responsibilities:**
1. Monitor trending hashtags per platform
2. Track competitor activity and content
3. Identify viral content patterns
4. Suggest timely content ideas
5. Research industry news and events
6. Alert on trending opportunities

**Trend Sources:**
| Source | Platforms | Refresh Rate |
|--------|-----------|--------------|
| Platform Trending APIs | Twitter, TikTok, YouTube | Real-time |
| Google Trends | All | Hourly |
| Industry RSS Feeds | LinkedIn, Twitter | Hourly |
| Competitor Feeds | All | Every 4 hours |
| News Aggregators | All | Hourly |
| Reddit/HN | Tech audiences | Hourly |

**Trend Scoring:**
| Factor | Weight | Description |
|--------|--------|-------------|
| Relevance to Brand | 40% | Match to brand topics/keywords |
| Momentum | 25% | Growth rate of trend |
| Timing | 20% | Time remaining to capitalize |
| Competition | 15% | How saturated the trend is |

---

#### Sentinel (Listening Agent)

**Personality Profile:**
- Communication style: Vigilant, concise, alert-focused
- Decision-making: Pattern-recognition, threshold-based
- Interaction pattern: Proactive alerts, summary reports

**Primary Responsibilities:**
1. Monitor brand mentions across platforms and web
2. Track sentiment in real-time
3. Generate alerts on significant events
4. Identify emerging issues before they escalate
5. Track share of voice vs competitors
6. Identify influencer mentions

**Monitoring Sources:**
| Source Type | Examples | Priority |
|-------------|----------|----------|
| Social Platforms | Twitter, LinkedIn, Facebook, Instagram, TikTok | HIGH |
| Review Sites | Yelp, Google Reviews, Trustpilot, G2 | HIGH |
| News Sites | Google News, industry publications | MEDIUM |
| Forums/Communities | Reddit, HN, Stack Overflow | MEDIUM |
| Blogs | Industry blogs, personal blogs | LOW |

**Alert Thresholds:**
| Alert Type | Threshold | Escalation |
|------------|-----------|------------|
| Volume Spike | 3x normal volume in 1 hour | Notify team |
| Negative Sentiment | >20% negative in 24h | Notify + Shield |
| Influencer Mention | >10K followers | Notify team |
| Competitor Mention | In your content context | Log for analysis |
| Crisis Keywords | Matched crisis terms | IMMEDIATE to Shield |

---

#### Radar (Competitive Intelligence)

**Personality Profile:**
- Communication style: Analytical, strategic, benchmark-focused
- Decision-making: Comparative analysis, gap identification
- Interaction pattern: Regular reports, strategic recommendations

**Primary Responsibilities:**
1. Track competitor social presence and activity
2. Analyze competitor content performance
3. Calculate share of voice metrics
4. Identify competitor strategies and gaps
5. Benchmark your performance vs competitors
6. Spot emerging competitor threats

**Competitor Tracking:**
| Metric | Collection | Comparison |
|--------|------------|------------|
| Posting Frequency | Daily | Weekly trends |
| Engagement Rate | Per post | Average comparison |
| Follower Growth | Weekly | Growth rate comparison |
| Content Types | Categorized | Distribution comparison |
| Top Performers | Top 10/month | Content analysis |
| Hashtag Usage | Per post | Strategy comparison |

**Share of Voice Calculation:**
```
SOV = (Your Brand Mentions) / (Total Industry Mentions) × 100
```

---

#### Shield (Crisis Response)

**Personality Profile:**
- Communication style: Calm, decisive, authoritative
- Decision-making: Rapid assessment, escalation protocols
- Interaction pattern: Clear directives, coordinated response

**Primary Responsibilities:**
1. Rapid assessment of crisis situations
2. Coordinate multi-platform response
3. Draft crisis messaging templates
4. Escalate to human decision-makers
5. Monitor crisis resolution progress
6. Post-crisis analysis and learning

**Crisis Classification:**
| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| WATCH | Potential issue emerging | 4 hours | Monitor |
| WARNING | Issue gaining traction | 2 hours | Alert team |
| CRITICAL | Active negative PR | 30 minutes | All hands |
| EMERGENCY | Viral negative content | Immediate | Executive + Legal |

**Response Protocol:**
1. **Acknowledge** - Recognize the issue publicly
2. **Assess** - Gather facts, determine scope
3. **Coordinate** - Align messaging across all channels
4. **Respond** - Execute approved messaging
5. **Monitor** - Track sentiment and resolution
6. **Review** - Post-crisis analysis

---

### Platform Specialist Detailed Capabilities

#### Chirp (Twitter/X Specialist)

**Platform Expertise:**
| Feature | Specification |
|---------|---------------|
| Character Limit | 280 (standard), 25,000 (Premium) |
| Media | 4 images, 1 video (2:20 max), GIFs |
| Thread Max | Unlimited (recommend 5-15) |
| Polls | 2-4 options, 5 min to 7 days |
| Spaces | Live audio rooms |

**Content Specializations:**
- Hook writing (first 7 words critical)
- Thread narrative structure
- Viral content patterns
- Engagement bait tactics
- Poll creation
- Space/audio content
- Quote tweet strategies

**Optimization Strategies:**
| Strategy | Implementation |
|----------|----------------|
| Thread Structure | Hook → Value → CTA |
| Hashtag Usage | 1-2 max, end of tweet |
| Posting Times | 8-10am, 12pm, 6-9pm |
| Reply Engagement | Respond within 1 hour |
| Thread Spacing | 2-3 min between tweets |

---

#### Link (LinkedIn Specialist)

**Platform Expertise:**
| Feature | Specification |
|---------|---------------|
| Post Limit | 3,000 characters |
| Article Limit | Unlimited |
| Document | PDF carousel up to 300 slides |
| Video | 10 min (3 min recommended) |
| Poll | 2-4 options, up to 2 weeks |

**Content Specializations:**
- Thought leadership posts
- Professional storytelling
- Carousel/document creation
- Article formatting
- Company page content
- Event promotion
- Job posting optimization

**Optimization Strategies:**
| Strategy | Implementation |
|----------|----------------|
| Post Format | Hook + whitespace + content |
| Dwell Time | Longer content for algorithm |
| Early Engagement | Reply to comments in first hour |
| Hashtag Strategy | 3-5 targeted industry hashtags |
| Best Times | Tue-Thu 8-10am, 12pm |
| Document Posts | 10-15 slides optimal |

---

#### Gram (Instagram Specialist)

**Platform Expertise:**
| Feature | Specification |
|---------|---------------|
| Caption Limit | 2,200 characters |
| Hashtag Limit | 30 (recommend 5-15) |
| Carousel Slides | Up to 20 |
| Reels Length | Up to 15 min (60-90s optimal) |
| Story Duration | 60 seconds per slide |

**Content Formats:**
| Format | Dimensions | Best Use |
|--------|------------|----------|
| Square Post | 1080×1080 | Standard feed |
| Portrait Post | 1080×1350 | Maximum screen real estate |
| Landscape | 1080×566 | Rarely used |
| Story/Reel | 1080×1920 | Full screen vertical |
| Carousel | 1080×1350 | Educational content |

**Optimization Strategies:**
| Strategy | Implementation |
|----------|----------------|
| Caption Hook | First line before "more" |
| Hashtag Sets | Rotate 3-5 sets of 10-15 |
| Alt Text | Always include for accessibility |
| Reels Music | Trending sounds boost reach |
| Collab Posts | Extend reach to partner audience |
| Story Timing | 3-5 per day, consistent times |

---

*(Similar detailed specs for Tok, Tube, Pin, Thread, Blue agents)*

---

## Workflows (15 Total: 8 Original + 7 New)

### Original Workflows (8)

#### 1. connect-platform

**Purpose:** Connect a new social media account

**Steps:**
1. Select platform (Twitter, LinkedIn, Facebook, etc.)
2. Review required permissions
3. Initiate OAuth flow
4. Complete authorization on platform
5. Return to app with token
6. Configure account settings
   - Display name
   - Posting preferences
   - Team access
7. Set up time slots for auto-scheduling
8. Test connection with preview post
9. Confirmation and next steps

**Approval Required:** No (user action)
**Confidence Threshold:** N/A

---

#### 2. create-post

**Purpose:** Create and publish/schedule a social post

**Steps:**
1. Select target platforms (multi-select)
2. Choose content source:
   - Write from scratch
   - Use template
   - Repurpose existing
   - AI generate
3. Enter/edit content
4. Add media (images, video, documents)
5. Configure platform-specific settings:
   - First comment (Instagram, LinkedIn)
   - Poll options
   - Location tags
   - Hashtags
6. Preview on each platform
7. Choose publishing method:
   - Publish now
   - Schedule for specific time
   - Add to optimal time queue
   - Save as draft
8. Submit for approval (if required)
9. Confirmation with sharing options

**Approval Required:** Based on confidence + settings
**Confidence Threshold:** >85% auto, 60-85% quick, <60% full

---

#### 3. schedule-content

**Purpose:** Schedule a post for future publishing

**Steps:**
1. Select post (draft or create new)
2. Choose scheduling method:
   - Specific date/time
   - Next available slot
   - Auto-optimal time (Tempo decides)
   - Recurring schedule
3. Set timezone (default: account timezone)
4. For recurring:
   - Frequency (daily, weekly, monthly)
   - End date or count
   - Variation rules
5. Add to queue
6. Confirm scheduling
7. Option to schedule related posts

**Approval Required:** No
**Confidence Threshold:** N/A

---

#### 4. generate-content

**Purpose:** AI-generate social content from input

**Steps:**
1. Provide content source:
   - Topic/idea
   - URL to article
   - Existing content to adapt
   - Brand guidelines prompt
2. Select target platforms
3. Choose tone and style:
   - Professional
   - Casual
   - Educational
   - Promotional
   - Thought leadership
4. Set additional parameters:
   - Include hashtags
   - Include CTA
   - Length preference
5. Generate variations (3-5 options)
6. Edit and refine selected version
7. Platform-specific adaptation (auto via specialists)
8. Approve for scheduling

**Approval Required:** Yes (AI-generated content)
**Confidence Threshold:** Always requires approval for AI content

---

#### 5. analyze-performance

**Purpose:** Review social media analytics

**Steps:**
1. Select date range:
   - Last 7 days
   - Last 30 days
   - Last 90 days
   - Custom range
2. Choose platforms/accounts
3. Select report type:
   - Overview dashboard
   - Platform deep-dive
   - Content performance
   - Audience insights
   - Competitive benchmark
4. View key metrics with visualizations
5. Identify top/bottom performers
6. Generate insights summary (AI)
7. Export report (PDF, CSV, scheduled email)
8. Set up automated reports

**Approval Required:** No
**Confidence Threshold:** N/A

---

#### 6. manage-calendar

**Purpose:** View and manage content calendar

**Steps:**
1. Open calendar view (day/week/month)
2. Apply filters:
   - Platform
   - Status (draft, scheduled, published)
   - Content type
   - Campaign
3. View scheduled content
4. Drag-drop to reschedule
5. Bulk actions on selected:
   - Reschedule
   - Cancel
   - Edit
   - Delete
6. Identify content gaps
7. Fill gaps with:
   - Quick post
   - AI suggestion
   - Evergreen content
8. Save calendar state

**Approval Required:** No (for viewing), Yes (for changes)
**Confidence Threshold:** N/A

---

#### 7. bulk-schedule

**Purpose:** Schedule multiple posts at once

**Steps:**
1. Choose import method:
   - CSV upload
   - Copy/paste text
   - Content library selection
   - AI bulk generation
2. Map fields to post structure:
   - Content
   - Platform
   - Media URLs
   - Scheduled time
   - Tags
3. Set scheduling rules:
   - Specific times from file
   - Auto-distribute over period
   - Fill available slots
4. Preview all posts
5. Validate content:
   - Character limits
   - Media requirements
   - Platform rules
6. Handle errors/warnings
7. Confirm bulk schedule
8. Monitor queue status

**Approval Required:** Yes (bulk operations)
**Confidence Threshold:** 60% for bulk

---

#### 8. content-repurpose

**Purpose:** Adapt content across platforms

**Steps:**
1. Select source content:
   - Blog post URL
   - Existing social post
   - Document/PDF
   - Video transcript
2. Choose target platforms
3. Select repurposing strategy:
   - Direct adaptation
   - Thread breakdown
   - Quote extraction
   - Summary creation
4. AI generates platform versions via specialists
5. Review each platform version
6. Edit as needed
7. Add platform-specific media
8. Schedule all versions

**Approval Required:** Yes (AI-generated)
**Confidence Threshold:** 70%

---

### New Workflows (7)

#### 9. campaign-launch

**Purpose:** Coordinate multi-platform marketing campaign

**Steps:**
1. Define campaign:
   - Name and description
   - Start/end dates
   - Goals and KPIs
   - Budget (if paid)
2. Select platforms
3. Create content calendar for campaign:
   - Teaser posts
   - Launch posts
   - Follow-up content
   - UGC prompts
4. Assign to specialists for optimization
5. Set up tracking:
   - UTM parameters
   - Campaign hashtag
   - Unique links
6. Review all content
7. Set up approval workflow
8. Launch campaign
9. Monitor dashboard
10. Post-campaign analysis

**Approval Required:** Yes
**Confidence Threshold:** 70%

---

#### 10. crisis-response

**Purpose:** Handle negative PR or brand crisis

**Steps:**
1. Shield agent detects/receives crisis alert
2. Assess severity (Watch/Warning/Critical/Emergency)
3. Pause scheduled content (if needed)
4. Gather context:
   - What happened
   - Who's involved
   - Current sentiment
   - Viral trajectory
5. Draft response options
6. Route to human decision-maker
7. Approve and execute response
8. Monitor response reception
9. Adjust messaging if needed
10. Document for future learning

**Approval Required:** Always (human required)
**Confidence Threshold:** 0% (always human)

---

#### 11. influencer-outreach

**Purpose:** Manage influencer relationships and collaborations

**Steps:**
1. Identify influencer (from mentions or search)
2. Assess fit:
   - Follower count
   - Engagement rate
   - Brand alignment
   - Past collaborations
3. Draft outreach message
4. Track conversation
5. Negotiate terms
6. Create collaboration content
7. Schedule coordinated posts
8. Track campaign performance
9. Document relationship

**Approval Required:** Yes
**Confidence Threshold:** 50%

---

#### 12. competitor-analysis

**Purpose:** Monitor and analyze competitor social activity

**Steps:**
1. Select competitors to analyze
2. Choose analysis period
3. Collect data via Radar agent:
   - Posting frequency
   - Content types
   - Engagement rates
   - Top performers
   - Hashtag strategy
4. Generate share of voice comparison
5. Identify gaps and opportunities
6. Create competitive brief
7. Suggest strategic responses
8. Schedule follow-up analysis

**Approval Required:** No
**Confidence Threshold:** N/A

---

#### 13. hashtag-research

**Purpose:** Optimize hashtag strategy per platform

**Steps:**
1. Enter topic/keyword area
2. Select target platforms
3. Analyze current hashtag performance
4. Research trending hashtags
5. Identify competitor hashtags
6. Score hashtags:
   - Relevance
   - Competition
   - Potential reach
7. Create hashtag sets (branded, industry, trending)
8. Save to hashtag library
9. Apply to upcoming content

**Approval Required:** No
**Confidence Threshold:** N/A

---

#### 14. ugc-curation

**Purpose:** Curate and share user-generated content

**Steps:**
1. Monitor brand mentions and tags
2. Identify UGC candidates:
   - Quality
   - Brand fit
   - Rights clearance
3. Request permission from creator
4. Download/save media
5. Create post with attribution
6. Tag original creator
7. Schedule for publishing
8. Notify creator when published
9. Track UGC performance

**Approval Required:** Yes (rights verification)
**Confidence Threshold:** 60%

---

#### 15. report-generate

**Purpose:** Create stakeholder analytics reports

**Steps:**
1. Select report type:
   - Executive summary
   - Platform deep-dive
   - Campaign report
   - Competitive analysis
   - Custom
2. Choose date range
3. Select metrics to include
4. Add narrative context (AI)
5. Include visualizations
6. Add recommendations
7. Format for audience
8. Export (PDF, slides, email)
9. Schedule recurring report

**Approval Required:** No
**Confidence Threshold:** N/A

---

## Tasks (12)

Tasks are atomic operations that support workflows.

| Task | File | Purpose | Used By |
|------|------|---------|---------|
| `validate-post` | validate-post.xml | Validate post content against platform rules | create-post, bulk-schedule |
| `check-optimal-times` | check-optimal-times.xml | Determine best posting times | schedule-content, create-post |
| `generate-hashtags` | generate-hashtags.xml | Generate relevant hashtags | create-post, generate-content |
| `resize-media` | resize-media.xml | Resize media for platform specs | create-post, content-repurpose |
| `extract-analytics` | extract-analytics.xml | Pull metrics from platform APIs | analyze-performance |
| `detect-sentiment` | detect-sentiment.xml | Analyze sentiment of text/mentions | Sentinel agent |
| `calculate-engagement` | calculate-engagement.xml | Calculate engagement rates | Pulse agent |
| `format-for-platform` | format-for-platform.xml | Apply platform-specific formatting | All specialists |
| `check-brand-voice` | check-brand-voice.xml | Validate against brand guidelines | Spark agent |
| `generate-response` | generate-response.xml | Generate engagement responses | Echo agent |
| `compress-video` | compress-video.xml | Compress video for platform limits | create-post |
| `schedule-to-queue` | schedule-to-queue.xml | Add post to BullMQ queue | schedule-content |

---

## Data Files

| File | Location | Purpose |
|------|----------|---------|
| `platform-specs.csv` | data/ | Character limits, image sizes, video specs |
| `optimal-posting-times.csv` | data/ | Best times per platform by industry |
| `hashtag-categories.csv` | data/ | Hashtag research by category |
| `content-templates.csv` | data/ | Platform-specific post templates |
| `platform-strategies.csv` | data/ | Optimization strategies per platform |
| `social-media-dimensions.csv` | from bm-brand | Image/video dimensions per platform |
| `crisis-keywords.csv` | data/ | Keywords triggering crisis alerts |
| `response-templates.csv` | data/ | Engagement response templates |
| `competitor-tracking.csv` | data/ | Competitor accounts to monitor |

---

## Data Models (Prisma)

### Core Models

```prisma
model SocialPost {
  id              String    @id @default(cuid())
  tenantId        String
  organizationId  String?

  // Content
  content         String    @db.Text
  contentType     String    @default("text") // text, html, markdown
  mediaUrls       Json?     // Array of media attachments
  settings        Json?     // Platform-specific settings

  // Scheduling
  state           SocialPostState @default(DRAFT)
  publishDate     DateTime?
  publishedAt     DateTime?
  releaseUrl      String?   // URL of published post
  releaseId       String?   // Platform's post ID

  // Threading
  parentPostId    String?
  parentPost      SocialPost? @relation("PostThread", fields: [parentPostId])
  childPosts      SocialPost[] @relation("PostThread")

  // Grouping
  group           String?   // UUID for multi-platform posts
  campaignId      String?
  tags            SocialTag[] @relation("PostTags")

  // Recurring
  intervalInDays  Int?

  // Relationships
  integrationId   String
  integration     SocialIntegration @relation(fields: [integrationId])

  // AI Metadata
  aiGenerated     Boolean   @default(false)
  confidence      Float?    // AI confidence score

  // Audit
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdBy       String?

  @@index([tenantId])
  @@index([integrationId])
  @@index([state, publishDate])
  @@index([group])
  @@index([campaignId])
}

enum SocialPostState {
  DRAFT
  PENDING_APPROVAL
  QUEUE
  PUBLISHED
  ERROR
  CANCELLED
}
```

```prisma
model SocialIntegration {
  id                String    @id @default(cuid())
  tenantId          String

  // Platform
  provider          SocialProvider
  providerAccountId String
  name              String
  handle            String?
  avatarUrl         String?

  // OAuth
  accessToken       String    @db.Text
  refreshToken      String?   @db.Text
  tokenExpiration   DateTime?
  scopes            String[]

  // Configuration
  disabled          Boolean   @default(false)
  refreshNeeded     Boolean   @default(false)
  postingTimes      Json?     // Preferred posting time slots
  additionalSettings Json?

  // Relationships
  posts             SocialPost[]
  calendarSlots     SocialCalendarSlot[]

  // Audit
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([tenantId, provider, providerAccountId])
  @@index([tenantId])
}

enum SocialProvider {
  TWITTER
  LINKEDIN
  LINKEDIN_PAGE
  FACEBOOK
  INSTAGRAM
  TIKTOK
  YOUTUBE
  PINTEREST
  THREADS
  BLUESKY
  MASTODON
}
```

```prisma
model SocialCampaign {
  id              String    @id @default(cuid())
  tenantId        String

  // Campaign Info
  name            String
  description     String?
  status          CampaignStatus @default(DRAFT)

  // Dates
  startDate       DateTime
  endDate         DateTime

  // Goals
  goals           Json?     // Array of goal objects
  kpis            Json?     // KPI definitions

  // Tracking
  hashtag         String?
  utmCampaign     String?

  // Budget
  budget          Float?
  currency        String?   @default("USD")

  // Audit
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdBy       String?

  @@index([tenantId])
  @@index([status])
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}
```

```prisma
model SocialMention {
  id              String    @id @default(cuid())
  tenantId        String

  // Source
  platform        SocialProvider
  sourceUrl       String
  sourceId        String?
  authorHandle    String?
  authorName      String?
  authorFollowers Int?

  // Content
  content         String    @db.Text
  mediaUrls       Json?

  // Analysis
  sentiment       SentimentType @default(NEUTRAL)
  sentimentScore  Float?
  topics          String[]
  priority        MentionPriority @default(NORMAL)

  // Status
  status          MentionStatus @default(NEW)
  responseId      String?
  respondedBy     String?
  respondedAt     DateTime?

  // Audit
  detectedAt      DateTime  @default(now())
  createdAt       DateTime  @default(now())

  @@index([tenantId])
  @@index([platform])
  @@index([status])
  @@index([priority])
}

enum SentimentType {
  POSITIVE
  NEUTRAL
  NEGATIVE
  MIXED
}

enum MentionPriority {
  CRITICAL
  HIGH
  NORMAL
  LOW
}

enum MentionStatus {
  NEW
  SEEN
  IN_PROGRESS
  RESPONDED
  IGNORED
}
```

---

## Event Bus Integration

### Events Emitted by BM-Social

| Event | Payload | Trigger |
|-------|---------|---------|
| `social.post.created` | postId, platforms, scheduledFor | Post created |
| `social.post.scheduled` | postId, integrationId, publishDate | Post scheduled |
| `social.post.published` | postId, integrationId, releaseUrl | Post goes live |
| `social.post.failed` | postId, integrationId, error | Publish failed |
| `social.integration.connected` | integrationId, provider | Account connected |
| `social.integration.disconnected` | integrationId, reason | Account disconnected |
| `social.mention.detected` | mentionId, platform, sentiment | Brand mention found |
| `social.mention.critical` | mentionId, platform, content | Crisis-level mention |
| `social.campaign.started` | campaignId, name | Campaign begins |
| `social.campaign.ended` | campaignId, metrics | Campaign ends |
| `social.analytics.collected` | integrationId, date, summary | Analytics updated |

### Events Consumed by BM-Social

| Event | Source | Action |
|-------|--------|--------|
| `content.article.published` | BMC | Suggest social posts for new content |
| `brand.guidelines.updated` | BM-Brand | Update content generation prompts |
| `crm.contact.tagged` | BM-CRM | Consider for social outreach |
| `approval.item.approved` | Platform | Publish approved post |
| `approval.item.rejected` | Platform | Mark post as cancelled |

---

## Approval Queue Integration

```typescript
interface SocialApprovalItem {
  type: 'social.post' | 'social.bulk' | 'social.campaign';
  action: 'publish' | 'schedule' | 'auto-generate';

  data: {
    postId?: string;
    postIds?: string[];
    campaignId?: string;
    content: string;
    platforms: string[];
    scheduledFor?: Date;
    generatedBy: 'ai' | 'human';
    mediaUrls?: string[];
  };

  // Confidence-based routing
  confidence: number; // 0-100
  // >85: Auto-approve (if enabled)
  // 60-85: Quick review (simplified view)
  // <60: Full review (complete context)

  // Context for reviewer
  context: {
    brandVoiceScore?: number;
    sentimentRisk?: string;
    platformRules?: string[];
    suggestedEdits?: string[];
  };
}
```

### Confidence Scoring Rules

| Factor | Weight | Calculation |
|--------|--------|-------------|
| Brand Voice Match | 30% | BM-Brand voice check score |
| Content Safety | 25% | No flagged keywords/topics |
| Historical Performance | 20% | Similar content success rate |
| Platform Compliance | 15% | Meets all platform rules |
| AI Generation Quality | 10% | Model confidence score |

---

## Cross-Module Dependencies

| Dependency | Module | Integration Point |
|------------|--------|-------------------|
| Brand Voice | BM-Brand | Content generation uses brand voice guidelines |
| Content Library | BMC | Repurpose articles to social posts |
| Contact Data | BM-CRM | Tag contacts for social outreach |
| Analytics | BMT | Feed metrics to unified dashboard |
| Email Lists | BMX | Cross-promote social to newsletter |
| Approval Queue | Platform | Route AI content for approval |
| BYOAI | Platform | Use user's AI keys for generation |
| OAuth | Platform | Leverage OAuth provider registry |

---

## API Endpoints

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/social/posts` | List posts with filters |
| POST | `/social/posts` | Create new post |
| GET | `/social/posts/:id` | Get post details |
| PUT | `/social/posts/:id` | Update post |
| DELETE | `/social/posts/:id` | Delete post |
| POST | `/social/posts/:id/publish` | Publish immediately |
| POST | `/social/posts/:id/schedule` | Schedule post |
| POST | `/social/posts/:id/cancel` | Cancel scheduled post |
| POST | `/social/posts/bulk` | Bulk create posts |

### Integrations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/social/integrations` | List connected accounts |
| POST | `/social/integrations/connect` | Start OAuth flow |
| GET | `/social/integrations/callback` | OAuth callback |
| DELETE | `/social/integrations/:id` | Disconnect account |
| PUT | `/social/integrations/:id` | Update settings |
| POST | `/social/integrations/:id/refresh` | Refresh token |

### Calendar

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/social/calendar` | Get calendar view data |
| PUT | `/social/calendar/reschedule` | Drag-drop reschedule |
| GET | `/social/calendar/slots` | Get available time slots |
| PUT | `/social/calendar/slots` | Update time slots |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/social/analytics` | Get analytics summary |
| GET | `/social/analytics/:integrationId` | Platform-specific analytics |
| GET | `/social/analytics/posts/:id` | Post performance |
| GET | `/social/analytics/export` | Export report |

### Mentions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/social/mentions` | List brand mentions |
| PUT | `/social/mentions/:id` | Update mention status |
| POST | `/social/mentions/:id/respond` | Submit response |

### Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/social/campaigns` | List campaigns |
| POST | `/social/campaigns` | Create campaign |
| GET | `/social/campaigns/:id` | Campaign details |
| PUT | `/social/campaigns/:id` | Update campaign |
| GET | `/social/campaigns/:id/analytics` | Campaign performance |

---

## UI Components

### Calendar Views

| Component | Description |
|-----------|-------------|
| `SocialCalendar` | Main calendar container |
| `DayView` | Hourly slots for single day |
| `WeekView` | 7-day grid with posts |
| `MonthView` | 42-day overview |
| `CalendarItem` | Individual post card |
| `TimeSlotEditor` | Configure posting times |

### Post Creation

| Component | Description |
|-----------|-------------|
| `PostComposer` | Main post creation form |
| `PlatformSelector` | Multi-platform selection |
| `MediaUploader` | Image/video upload |
| `PlatformPreview` | Preview for each platform |
| `SchedulePicker` | Date/time selection |
| `HashtagSuggester` | AI hashtag recommendations |

### Analytics

| Component | Description |
|-----------|-------------|
| `AnalyticsDashboard` | Main analytics view |
| `MetricCard` | Individual metric display |
| `PerformanceChart` | Line/bar charts |
| `TopPostsGrid` | Best performing content |
| `PlatformComparison` | Cross-platform metrics |
| `ReportBuilder` | Custom report creation |

### Engagement

| Component | Description |
|-----------|-------------|
| `UnifiedInbox` | All messages/comments |
| `MentionCard` | Individual mention display |
| `ResponseComposer` | Reply composition |
| `SentimentBadge` | Sentiment indicator |
| `PriorityIndicator` | Priority level display |

---

## Implementation Phases

### Phase 1: MVP (Weeks 1-4)

**Focus:** Core posting and scheduling

**Deliverables:**
- [ ] Data models (Post, Integration, CalendarSlot)
- [ ] Provider framework (abstract + 3 platforms)
- [ ] Twitter/X provider
- [ ] LinkedIn provider
- [ ] Facebook provider
- [ ] Connect account flow (OAuth)
- [ ] Create post UI
- [ ] Simple calendar (week view)
- [ ] BullMQ worker for posting
- [ ] Conductor agent
- [ ] Spark agent (basic)

---

### Phase 2: Enhanced (Weeks 5-8)

**Focus:** AI and calendar management

**Deliverables:**
- [ ] Instagram provider
- [ ] TikTok provider
- [ ] YouTube provider
- [ ] Calendar enhancements (day/month, drag-drop)
- [ ] Time slot management
- [ ] AI content generation workflow
- [ ] Tempo agent (scheduling)
- [ ] Platform specialists (Chirp, Link, Meta, Gram, Tok, Tube)
- [ ] Content repurpose workflow
- [ ] Bulk scheduling

---

### Phase 3: Analytics (Weeks 9-12)

**Focus:** Performance tracking

**Deliverables:**
- [ ] Pinterest provider
- [ ] Threads provider
- [ ] Analytics collection (daily snapshots)
- [ ] Analytics dashboard
- [ ] Report generation
- [ ] Pulse agent (analytics)
- [ ] Scout agent (trends)
- [ ] Hashtag research workflow

---

### Phase 4: Engagement (Weeks 13-16)

**Focus:** Monitoring and engagement

**Deliverables:**
- [ ] Bluesky/Mastodon providers
- [ ] Mention monitoring
- [ ] Unified inbox
- [ ] Sentiment analysis
- [ ] Echo agent (engagement)
- [ ] Sentinel agent (listening)
- [ ] Radar agent (competitive)
- [ ] Shield agent (crisis)
- [ ] Campaign management

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to Schedule | <2 min | Average time from compose to schedule |
| Cross-Platform Efficiency | 80% | Posts created for multiple platforms |
| AI Content Acceptance | >70% | AI-generated content approved |
| Engagement Response Time | <1 hour | Average time to respond |
| Platform Uptime | 99.5% | Successful post publishing rate |
| User Satisfaction | >4.5/5 | User ratings |

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Platform API changes | Abstract provider layer, versioned API |
| Rate limits | Per-provider concurrency limits, queue throttling |
| Token expiration | Proactive refresh cron, user notification |
| Post failures | Retry with backoff, error state, notifications |
| AI content quality | Approval queue, confidence scoring, brand voice check |
| Crisis escalation | Shield agent, escalation protocols, human override |
| Data privacy | Encrypted tokens, tenant isolation, audit logs |

---

## Appendices

### Appendix A: Platform API References

| Platform | Documentation |
|----------|---------------|
| Twitter/X | https://developer.twitter.com/en/docs |
| LinkedIn | https://learn.microsoft.com/en-us/linkedin/ |
| Facebook | https://developers.facebook.com/docs/ |
| Instagram | https://developers.facebook.com/docs/instagram-api/ |
| TikTok | https://developers.tiktok.com/doc/ |
| YouTube | https://developers.google.com/youtube/v3 |
| Pinterest | https://developers.pinterest.com/docs/ |
| Threads | https://developers.facebook.com/docs/threads/ |
| Bluesky | https://docs.bsky.app/ |

### Appendix B: Reference Implementation

- **Postiz** (gitroomhq/postiz-app) - Provider pattern, BullMQ workers, calendar UI

### Appendix C: Competitive Research

See `/docs/modules/bm-social/research/BM-SOCIAL-RESEARCH-FINDINGS.md` for:
- Buffer, Hootsuite, Sprout Social, Sendible analysis
- Brandwatch, Talkwalker, Brand24, Awario, Octolens comparison

---

**Document Status:** Complete
**Ready For:** PRD Creation
**Owner:** AI Business Hub Team
**Last Updated:** 2025-12-17
