# BM-Social Development Roadmap

## Phase 1: Core Components (MVP)

### Agents
- [x] Conductor (social-orchestrator) - Created
- [x] Spark (content-strategist) - Created
- [x] Tempo (scheduler) - Created
- [ ] Create instructions.md for each core agent

### Workflows
- [x] connect-platform - Stub created
- [x] create-post - Stub created
- [x] schedule-content - Stub created
- [ ] Write full instructions.md for connect-platform
- [ ] Write full instructions.md for create-post
- [ ] Write full instructions.md for schedule-content

### Platform Specialists (Priority)
- [x] Chirp (Twitter) - Created
- [x] Link (LinkedIn) - Created
- [x] Gram (Instagram) - Created
- [ ] Test platform specialist routing

### Tasks
- [ ] validate-post.xml
- [ ] check-optimal-times.xml
- [ ] generate-hashtags.xml

## Phase 2: Enhanced Features

### Additional Agents
- [x] Pulse (analytics) - Created
- [x] Echo (engagement) - Created
- [x] Scout (trend-scout) - Created

### Remaining Platform Specialists
- [x] Meta (Facebook) - Created
- [x] Tok (TikTok) - Created
- [x] Tube (YouTube) - Created

### Workflows
- [x] generate-content - Stub created
- [x] analyze-performance - Stub created
- [x] manage-calendar - Stub created
- [ ] Write full instructions for each

### Tasks
- [ ] resize-media.xml
- [ ] extract-analytics.xml
- [ ] format-for-platform.xml

## Phase 3: Listening & Intelligence

### Specialized Agents
- [x] Sentinel (listening) - Created
- [x] Radar (competitive) - Created
- [x] Shield (crisis) - Created

### Remaining Platform Specialists
- [x] Pin (Pinterest) - Created
- [x] Thread (Threads) - Created
- [x] Blue (Bluesky) - Created

### Workflows
- [x] bulk-schedule - Stub created
- [x] content-repurpose - Stub created
- [ ] Write full instructions for each

### Tasks
- [ ] detect-sentiment.xml
- [ ] calculate-engagement.xml
- [ ] check-brand-voice.xml

## Phase 4: Extended Workflows

### Workflows
- [x] campaign-launch - Stub created
- [x] crisis-response - Stub created
- [x] influencer-outreach - Stub created
- [x] competitor-analysis - Stub created
- [x] hashtag-research - Stub created
- [x] ugc-curation - Stub created
- [x] report-generate - Stub created
- [ ] Write full instructions for each extended workflow

### Tasks
- [ ] generate-response.xml
- [ ] compress-video.xml
- [ ] schedule-to-queue.xml

## Phase 5: Polish & Integration

### Templates
- [ ] Post templates per platform
- [ ] Report templates
- [ ] Response templates

### Data Files
- [x] platform-specs.csv - Created
- [x] optimal-posting-times.csv - Created
- [x] crisis-keywords.csv - Created
- [ ] hashtag-categories.csv
- [ ] content-templates.csv
- [ ] competitor-tracking.csv
- [ ] response-templates.csv

### Testing
- [ ] Test agent compilation
- [ ] Test workflow execution
- [ ] Test cross-agent routing
- [ ] Integration testing with platform

### Documentation
- [x] README.md - Created
- [x] TODO.md - Created
- [ ] User guide
- [ ] API documentation
- [ ] Example walkthroughs

## Quick Commands

Create new agent:
```
/bmad:bmb:workflows:create-agent
```

Create new workflow:
```
/bmad:bmb:workflows:create-workflow
```

Edit existing agent:
```
/bmad:bmb:workflows:edit-agent
```

## Notes

- All 18 agents have YAML definitions created
- All 15 workflows have stub workflow.yaml files
- instructions.md files need to be created for each workflow
- Tasks need XML definitions
- Integration with platform approval queue needed
- BYOAI configuration for content generation

## Priority Order

1. Core workflow instructions (connect, create, schedule)
2. Task definitions for validation
3. Platform specialist testing
4. Extended workflow instructions
5. Templates and data files
6. Full integration testing
