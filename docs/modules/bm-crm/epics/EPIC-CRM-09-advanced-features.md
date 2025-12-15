# EPIC-CRM-09: Advanced Features

**Module:** BM-CRM
**Phase:** Growth (Phase 3)
**Stories:** 8 | **Points:** 24
**Status:** `backlog`
**Dependencies:** EPIC-CRM-01 through CRM-08

---

## Epic Overview

Implement multi-pipeline support, advanced analytics with reporting, relationship mapping visualization, and mobile PWA.

---

## Stories

### CRM-09.1: Implement Multi-Pipeline Data Model
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] CrmPipeline model: name, stages (JSON), is_default
- [ ] Add pipeline_id to CrmDeal
- [ ] Default pipeline auto-created per workspace
- [ ] Pipeline CRUD API endpoints
- [ ] Migration for existing deals to default pipeline

---

### CRM-09.2: Create Pipeline Management UI
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Route: `/crm/settings/pipelines`
- [ ] Pipeline list with stages preview
- [ ] Create/edit pipeline modal
- [ ] Stage configuration: name, order, probability, color
- [ ] Pipeline selector on kanban board
- [ ] Move deal between pipelines with stage mapping

---

### CRM-09.3: Implement Deal Stage History Tracking
**Points:** 2 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] CrmDealStageHistory model
- [ ] Record every stage change with timestamp, user, time_in_stage
- [ ] Auto-calculate time_in_stage on transition
- [ ] Stage history visible on deal detail
- [ ] Use for velocity calculations

---

### CRM-09.4: Create Analytics Materialized Views
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] mv_pipeline_metrics: stage counts, values, avg time
- [ ] mv_rep_performance: activities, deals, win rate per user
- [ ] mv_source_conversion: conversion by lead source
- [ ] Nightly refresh job
- [ ] Manual refresh capability

---

### CRM-09.5: Build Advanced Reporting Dashboard
**Points:** 5 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Route: `/crm/reports`
- [ ] Pipeline Velocity report with stage breakdown
- [ ] Lead Source ROI report
- [ ] Rep Performance leaderboard
- [ ] Cohort analysis (win rate by creation month)
- [ ] Forecast vs Actual comparison
- [ ] Date range filters
- [ ] Export to CSV/PDF

---

### CRM-09.6: Implement Relationship Mapping Data Model
**Points:** 2 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] CrmRelationship model: from_entity, to_entity, type, strength
- [ ] Relationship types: reports_to, works_with, decision_maker, influencer
- [ ] CRUD API for relationships
- [ ] Relationship visible on contact/account pages

---

### CRM-09.7: Create Relationship Graph Visualization
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Graph view component using React Flow or D3.js
- [ ] Nodes for contacts, accounts, deals
- [ ] Edges showing relationship type and strength
- [ ] Force-directed layout
- [ ] Zoom, pan, click-to-drill-down
- [ ] Accessible from account detail page

---

### CRM-09.8: Implement Mobile CRM PWA with Offline Support
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] PWA manifest and service worker
- [ ] Offline storage: IndexedDB for recent contacts, active deals
- [ ] Offline action queue for log_activity, update_status
- [ ] Background sync when online
- [ ] Mobile-first views: swipe actions, tap-to-call
- [ ] Push notifications for tier changes
- [ ] Install prompt on mobile browsers

---

## Definition of Done

- [ ] Multi-pipeline functional
- [ ] Analytics dashboard operational
- [ ] Relationship graph rendering
- [ ] PWA installable and offline-capable
