# BM-Support Module PRD - Research Checklist

**Purpose:** Research tasks completed for creating the BM-Support (Customer Support) Module PRD
**Status:** ✅ COMPLETE
**Created:** 2025-12-17
**Completed:** 2025-12-17
**Output:** See [BM-SUPPORT-RESEARCH-FINDINGS.md](./BM-SUPPORT-RESEARCH-FINDINGS.md)

---

## Overview

This checklist tracks research tasks for the BM-Support module. Research was conducted using DeepWiki analysis of the Chatwoot open-source customer engagement platform.

**Reference System:**
- Repository: `chatwoot/chatwoot`
- DeepWiki: https://deepwiki.com/chatwoot/chatwoot

---

## 1. Architecture & Tech Stack

**Status:** ✅ Complete

### Research Tasks

- [x] **Application Structure**
  - [x] Rails 7.1 backend organization
  - [x] Vue 3 frontend architecture
  - [x] Widget SDK structure

- [x] **Tech Stack Analysis**
  - [x] PostgreSQL + pgvector
  - [x] Redis + Sidekiq
  - [x] Action Cable WebSockets
  - [x] Wisper event system

### Key Findings

- Multi-tenant architecture with Account as root
- Polymorphic channel pattern for inbox types
- Event-driven architecture with pub/sub

---

## 2. Channel & Inbox System

**Status:** ✅ Complete

### Research Tasks

- [x] **Polymorphic Channels**
  - [x] Inbox → Channel relationship
  - [x] Channel type implementations
  - [x] Channel-specific configurations

- [x] **Supported Channels**
  - [x] Web Widget
  - [x] Email (IMAP/SMTP/OAuth)
  - [x] WhatsApp (Cloud API, Twilio, 360Dialog)
  - [x] Facebook Messenger
  - [x] Instagram
  - [x] Twitter
  - [x] Telegram
  - [x] SMS
  - [x] API (custom)

### Key Findings

- Inbox stores channel_type and channel_id
- Each channel type has its own model and service
- SendReplyJob routes to correct channel service

---

## 3. Conversation & Message System

**Status:** ✅ Complete

### Research Tasks

- [x] **Data Models**
  - [x] Conversation model and states
  - [x] Message model and types
  - [x] Relationships and indexes

- [x] **Message Flow**
  - [x] Inbound message processing
  - [x] Outbound message delivery
  - [x] Activity messages

### Key Findings

- States: OPEN, RESOLVED, PENDING, SNOOZED
- Message types: incoming, outgoing, activity, template
- Content types: text, cards, forms, CSAT

---

## 4. Real-Time Communication

**Status:** ✅ Complete

### Research Tasks

- [x] **WebSocket Implementation**
  - [x] Action Cable setup
  - [x] RoomChannel subscriptions
  - [x] Event broadcasting

- [x] **Features**
  - [x] Typing indicators
  - [x] Presence tracking
  - [x] Live updates

### Key Findings

- RoomChannel handles subscriptions
- Presence updated every 20 seconds
- Events: message.created, conversation.updated, etc.

---

## 5. Agent Assignment & Routing

**Status:** ✅ Complete

### Research Tasks

- [x] **Assignment Policies**
  - [x] Round-robin
  - [x] Balanced (capacity-based)
  - [x] Manual

- [x] **Routing**
  - [x] Team-based routing
  - [x] Priority handling
  - [x] Fair distribution limits

### Key Findings

- AssignmentPolicy with order and priority
- Max 100 conversations/hour default limit
- Auto-assignment when status changes to open

---

## 6. Automation & Bots

**Status:** ✅ Complete

### Research Tasks

- [x] **Automation Rules**
  - [x] Event triggers
  - [x] Condition evaluation
  - [x] Action execution

- [x] **AI Features**
  - [x] Captain AI assistant
  - [x] Knowledge base with pgvector
  - [x] Custom tools integration

- [x] **Quick Actions**
  - [x] Canned responses
  - [x] Macros

### Key Findings

- AutomationRule with events, conditions, actions
- Captain uses semantic search for responses
- Macros are sequences of actions

---

## 7. Contact Management

**Status:** ✅ Complete

### Research Tasks

- [x] **Contact Model**
  - [x] Core fields
  - [x] Custom attributes
  - [x] Contact types

- [x] **Features**
  - [x] Contact identification flow
  - [x] ContactInbox bridge
  - [x] Contact merging

### Key Findings

- Unique constraints on email, phone, identifier
- ContactInbox links contact to inbox with source_id
- Merge process reassigns all relationships

---

## 8. Widget SDK

**Status:** ✅ Complete

### Research Tasks

- [x] **Architecture**
  - [x] SDK loader script
  - [x] Iframe communication
  - [x] Public API

- [x] **Configuration**
  - [x] Widget settings
  - [x] Pre-chat forms
  - [x] Customization options

### Key Findings

- SDK creates isolated iframe
- postMessage for communication
- Extensive customization via window.chatwootSettings

---

## 9. Reporting & Analytics

**Status:** ✅ Complete

### Research Tasks

- [x] **Report Types**
  - [x] Conversation reports
  - [x] Agent reports
  - [x] Inbox reports
  - [x] Team reports
  - [x] CSAT reports

- [x] **Metrics**
  - [x] First response time
  - [x] Resolution time
  - [x] CSAT score
  - [x] Volume metrics

### Key Findings

- Reports filterable by date range
- Grouping by day/week/month/year
- Downloadable reports

---

## Research Summary

| Section | Status | Key Source |
|---------|--------|------------|
| Architecture | ✅ | DeepWiki - Overview |
| Channels | ✅ | DeepWiki - Inbox Architecture |
| Conversations | ✅ | DeepWiki - Conversation Models |
| Real-Time | ✅ | DeepWiki - API Layer |
| Routing | ✅ | DeepWiki - Features |
| Automation | ✅ | DeepWiki - Message Templates |
| Contacts | ✅ | DeepWiki - Contact Management |
| Widget | ✅ | DeepWiki - Widget SDK |
| Reporting | ✅ | DeepWiki - Features |

---

## Dependencies

### Platform Foundation Required

| BM-Support Requirement | Platform Dependency |
|------------------------|---------------------|
| Real-time messaging | Socket.io infrastructure |
| Background jobs | BullMQ workers |
| Contact storage | PostgreSQL + pgvector |
| AI capabilities | BYOAI integration |
| Multi-tenancy | Tenant isolation |

### Cross-Module Dependencies

| Feature | Dependent Module |
|---------|------------------|
| Social inbox | BM-Social |
| Contact sync | BM-CRM |
| Email channel | BMX (optional) |
| Analytics | BMT |

---

## Next Steps

1. ✅ Research Complete
2. Create BM-Support PRD using `/bmad:bmm:workflows:prd`
3. Design agent YAML files
4. Create workflow packages
5. Implement widget SDK
6. Build agent dashboard

---

**Document Status:** ✅ Research Complete
**Owner:** AI Business Hub Team
**Completed:** 2025-12-17
