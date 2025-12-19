# Epic KB-03: KB Verification & Scribe Agent - Technical Specification

**Epic:** KB-03 - KB Verification & Scribe Agent
**FRs Covered:** KB-F5, KB-F7
**Stories:** 7 (KB-03.1 to KB-03.7)
**Created:** 2025-12-18
**Status:** Technical Context

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [Verification System Design](#verification-system-design)
5. [Scribe Agent Design](#scribe-agent-design)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Integration Points](#integration-points)
9. [Story Implementation Guide](#story-implementation-guide)
10. [Testing Strategy](#testing-strategy)

---

## Overview

### Epic Goal

Enable users to mark KB pages as verified for AI prioritization and introduce the Scribe agent to automate KB management tasks. This builds on the RAG foundation from KB-02 to improve content quality and AI response accuracy.

### Scope

**In Scope (KB-03):**
- Verification badge system with expiration periods (30/60/90 days, never)
- Verification expiration detection and notifications
- Re-verification workflow
- Stale content dashboard
- @mention support in KB pages (user references)
- #task reference support (link to PM tasks)
- Scribe agent foundation with KB management tools

**Out of Scope (KB-04+):**
- AI-generated page drafts
- Natural language Q&A chat with KB
- Advanced content gap detection
- Full KB health analytics dashboard

### Dependencies

- KB-01: Knowledge Page CRUD + editor foundation
- KB-02: RAG/embeddings + semantic search
- PM-02: Task system (for #task references)
- Existing user/workspace models
- Tiptap Mention extension capability
- Agno agent framework (used in other agents)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Knowledge Base (KB-03)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Frontend (Next.js)                                                         │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  Verification UI                                                      │  │
│   │  • VerificationBadge - Show status (verified/expired/unverified)     │  │
│   │  • VerificationDropdown - Select expiration period                   │  │
│   │  • StaleContentDashboard - Admin view of pages needing review        │  │
│   │                                                                       │  │
│   │  Enhanced Editor                                                      │  │
│   │  • @mention extension - Autocomplete users                           │  │
│   │  • #task extension - Autocomplete tasks by number/title              │  │
│   │  • PageMention tracking - Store mentions in DB                       │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│   Backend (NestJS)                                                           │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  Verification Service                                                 │  │
│   │  • POST /api/kb/pages/:id/verify - Mark as verified                  │  │
│   │  • DELETE /api/kb/pages/:id/verify - Remove verification             │  │
│   │  • GET /api/kb/stale - List stale pages                              │  │
│   │  • Daily cron job - Check expirations, send notifications            │  │
│   │                                                                       │  │
│   │  Mention Service                                                      │  │
│   │  • Extract mentions from Tiptap JSON                                 │  │
│   │  • Store in PageMention table                                        │  │
│   │  • Send notifications to mentioned users                             │  │
│   │  • Resolve task references for linking                               │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│   Agent Layer (Python/Agno)                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  Scribe Agent                                                        │  │
│   │  • create_kb_page - Create new page from context                     │  │
│   │  • update_kb_page - Update existing page content                     │  │
│   │  • search_kb - Full-text + semantic search                           │  │
│   │  • query_rag - Get RAG context for tasks                             │  │
│   │  • mark_verified - Verify page content                               │  │
│   │  • detect_stale_pages - Find pages needing review                    │  │
│   │  • summarize_page - Generate page summary                            │  │
│   │  • suggest_structure - Recommend page organization                   │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Flow: Verification Lifecycle

```
Page Owner clicks "Mark as Verified"
         ↓
Frontend: Show expiration dropdown (30/60/90 days, never)
         ↓
Frontend: POST /api/kb/pages/:id/verify { expiresIn: '90d' }
         ↓
Backend: VerificationService.markVerified()
  1. Set isVerified = true
  2. Set verifiedAt = now()
  3. Set verifiedById = userId
  4. Set verifyExpires = now() + 90 days (or null for 'never')
  5. Create PageActivity (VERIFIED)
  6. Publish kb.page.verified event
         ↓
Frontend: Show badge "✓ Verified · Expires in 90 days"
         ↓
[90 days later]
         ↓
Backend: Daily cron job (VerificationExpiryJob)
  1. Query: SELECT * WHERE isVerified AND verifyExpires <= now()
  2. For each expired page:
     - Send notification to ownerId
     - Create PageActivity (VERIFICATION_EXPIRED)
     - Publish kb.page.verification_expired event
     - Flag in stale content list
         ↓
Frontend: Badge shows "⚠ Verification Expired"
         ↓
Page Owner clicks "Re-verify"
         ↓
Frontend: POST /api/kb/pages/:id/verify { expiresIn: '90d' }
         ↓
Backend: Same as initial verification (updates timestamps)
```

### Component Flow: @Mention

```
User types "@" in KB editor
         ↓
Frontend: Tiptap Mention extension triggered
  1. Show autocomplete dropdown
  2. Query: GET /api/workspace/users?search={query}
  3. Display user list (name, avatar)
         ↓
User selects user from dropdown
         ↓
Frontend: Insert Mention node in Tiptap JSON
  {
    type: 'mention',
    attrs: {
      id: 'user_123',
      label: '@john.doe',
      type: 'USER'
    }
  }
         ↓
User saves page
         ↓
Backend: PagesService.update()
  1. Update content
  2. MentionService.extractMentions(content)
     - Parse Tiptap JSON for mention nodes
     - Create PageMention records
     - Delete old mentions not in new content
  3. MentionService.notifyMentionedUsers()
     - For each new mention:
       - NotificationService.send({
           userId: mentionedUserId,
           type: 'kb.mentioned',
           message: 'You were mentioned in {pageTitle}',
           link: '/kb/{pageSlug}'
         })
```

---

## Data Models

### Existing Models Extended

The following fields are added to the existing `KnowledgePage` model from KB-01:

```prisma
model KnowledgePage {
  // ... existing fields from KB-01 ...

  // Verification fields (NEW for KB-03)
  isVerified    Boolean   @default(false) @map("is_verified")
  verifiedAt    DateTime? @map("verified_at")
  verifiedById  String?   @map("verified_by_id")
  verifyExpires DateTime? @map("verify_expires")

  // Relations
  mentions      PageMention[]  // NEW for KB-03
}
```

### New Models for KB-03

```prisma
// ============================================
// KB-03: MENTIONS & REFERENCES
// ============================================

/// PageMention - Track @mentions and #references in pages
model PageMention {
  id          String      @id @default(cuid())
  pageId      String      @map("page_id")

  // Mention type and target
  mentionType MentionType @map("mention_type")
  targetId    String      @map("target_id")  // User ID, Task ID, or Page ID

  // Position in content (character offset)
  position    Int

  // Mention text (denormalized for display)
  label       String      @db.VarChar(255)

  createdAt   DateTime    @default(now()) @map("created_at")

  page        KnowledgePage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId])
  @@index([targetId])
  @@index([mentionType])
  @@map("page_mentions")
}

enum MentionType {
  USER   // @username
  TASK   // #PM-123
  PAGE   // [[Page Title]] (reserved for future)
}
```

### Updated PageActivity Enum

Add new activity types for verification:

```prisma
enum PageActivityType {
  // ... existing types from KB-01 ...
  VERIFIED                  // NEW
  UNVERIFIED                // NEW
  VERIFICATION_EXPIRED      // NEW
  MENTIONED_USER            // NEW
  REFERENCED_TASK           // NEW
}
```

---

## Verification System Design

### Verification States

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      Verification State Machine                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐                                                            │
│   │ UNVERIFIED  │◄─────────────────────────────────────────────────┐        │
│   │  (default)  │                                                   │        │
│   └──────┬──────┘                                                   │        │
│          │                                                          │        │
│          │ User clicks "Mark as Verified"                           │        │
│          ▼                                                          │        │
│   ┌─────────────┐                                                   │        │
│   │  VERIFIED   │                                                   │        │
│   │             │                                                   │        │
│   │ • isVerified = true                                            │        │
│   │ • verifiedAt = now()                                           │        │
│   │ • verifiedById = userId                                        │        │
│   │ • verifyExpires = now() + period                               │        │
│   │                                                                 │        │
│   └──────┬──────┘                                                   │        │
│          │                                                          │        │
│          │ Expiration date reached (cron check)                     │        │
│          ▼                                                          │        │
│   ┌─────────────┐                                                   │        │
│   │   EXPIRED   │───────────────────────────────────────────────────┘        │
│   │             │        Owner re-verifies                                    │
│   │ • Flagged in stale list                                                  │
│   │ • Owner notified                                                         │
│   │ • Still searchable (but lower RAG priority)                              │
│   │ • Badge shows warning                                                    │
│   │                                                                          │
│   └─────────────┘                                                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Verification Service Implementation

```typescript
// apps/api/src/kb/verification/verification.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { EventPublisherService } from '@/common/services/event-publisher.service';

interface VerifyPageDto {
  expiresIn: '30d' | '60d' | '90d' | 'never';
}

@Injectable()
export class VerificationService {
  constructor(
    private prisma: PrismaService,
    private eventPublisher: EventPublisherService,
  ) {}

  /**
   * Mark page as verified with expiration period
   */
  async markVerified(
    pageId: string,
    userId: string,
    dto: VerifyPageDto,
  ): Promise<KnowledgePage> {
    const page = await this.prisma.knowledgePage.findUnique({
      where: { id: pageId },
    });

    if (!page) {
      throw new Error('Page not found');
    }

    // Calculate expiration date
    let verifyExpires: Date | null = null;
    if (dto.expiresIn !== 'never') {
      const days = parseInt(dto.expiresIn); // '30d' -> 30
      verifyExpires = new Date();
      verifyExpires.setDate(verifyExpires.getDate() + days);
    }

    // Update page
    const updated = await this.prisma.knowledgePage.update({
      where: { id: pageId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedById: userId,
        verifyExpires,
      },
    });

    // Log activity
    await this.prisma.pageActivity.create({
      data: {
        pageId,
        userId,
        type: 'VERIFIED',
        data: {
          expiresIn: dto.expiresIn,
          verifyExpires: verifyExpires?.toISOString(),
        },
      },
    });

    // Publish event
    await this.eventPublisher.publish('kb.page.verified', {
      pageId,
      workspaceId: page.workspaceId,
      verifiedById: userId,
      verifyExpires: verifyExpires?.toISOString(),
    });

    return updated;
  }

  /**
   * Remove verification from page
   */
  async removeVerification(pageId: string, userId: string): Promise<KnowledgePage> {
    const page = await this.prisma.knowledgePage.findUnique({
      where: { id: pageId },
    });

    if (!page) {
      throw new Error('Page not found');
    }

    const updated = await this.prisma.knowledgePage.update({
      where: { id: pageId },
      data: {
        isVerified: false,
        verifiedAt: null,
        verifiedById: null,
        verifyExpires: null,
      },
    });

    // Log activity
    await this.prisma.pageActivity.create({
      data: {
        pageId,
        userId,
        type: 'UNVERIFIED',
      },
    });

    // Publish event
    await this.eventPublisher.publish('kb.page.unverified', {
      pageId,
      workspaceId: page.workspaceId,
    });

    return updated;
  }

  /**
   * Get all stale pages (expired verification + not updated in 90+ days)
   */
  async getStalPages(workspaceId: string) {
    const now = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const pages = await this.prisma.knowledgePage.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          // Expired verification
          {
            isVerified: true,
            verifyExpires: { lte: now },
          },
          // Not updated in 90+ days
          {
            updatedAt: { lte: ninetyDaysAgo },
          },
          // Low view count (< 5 views)
          {
            viewCount: { lt: 5 },
          },
        ],
      },
      orderBy: { updatedAt: 'asc' },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return pages;
  }
}
```

### Expiration Cron Job

```typescript
// apps/api/src/kb/verification/verification-expiry.job.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/common/services/prisma.service';
import { NotificationService } from '@/modules/notifications/notification.service';
import { EventPublisherService } from '@/common/services/event-publisher.service';

@Injectable()
export class VerificationExpiryJob {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
    private eventPublisher: EventPublisherService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpirations() {
    const now = new Date();

    // Find pages with expired verification
    const expiredPages = await this.prisma.knowledgePage.findMany({
      where: {
        isVerified: true,
        verifyExpires: {
          lte: now,
          not: null,
        },
        deletedAt: null,
      },
      include: {
        owner: { select: { id: true, email: true, name: true } },
      },
    });

    for (const page of expiredPages) {
      // Send notification to owner
      await this.notifications.send({
        userId: page.ownerId,
        type: 'kb.verification.expired',
        title: 'Page verification expired',
        message: `The page "${page.title}" needs re-verification.`,
        data: {
          pageId: page.id,
          pageTitle: page.title,
          pageSlug: page.slug,
        },
        link: `/kb/${page.slug}`,
      });

      // Log activity
      await this.prisma.pageActivity.create({
        data: {
          pageId: page.id,
          userId: 'system',
          type: 'VERIFICATION_EXPIRED',
        },
      });

      // Publish event
      await this.eventPublisher.publish('kb.page.verification_expired', {
        pageId: page.id,
        workspaceId: page.workspaceId,
        ownerId: page.ownerId,
      });
    }

    console.log(`[VerificationExpiryJob] Processed ${expiredPages.length} expired verifications`);
  }
}
```

---

## Scribe Agent Design

### Agent Architecture

The Scribe agent is a KB management agent built using the Agno framework (same pattern as other Core-PM agents).

```python
# agents/platform/scribe/scribe.py

from agno import Agent
from agno.tools import tool
from typing import List, Optional, Dict, Any
from .tools import kb_tools, rag_tools, analysis_tools

def create_scribe_agent(
    workspace_id: str,
    user_id: str,
    model_config: Dict[str, Any],
) -> Agent:
    """Create Scribe - Knowledge Base Manager agent."""

    return Agent(
        name="Scribe",
        role="Knowledge Base Manager",
        model=get_model_from_config(model_config),
        instructions=load_prompt("scribe_system.md"),
        tools=[
            # Page Management
            kb_tools.create_kb_page,
            kb_tools.update_kb_page,
            kb_tools.delete_kb_page,
            kb_tools.move_kb_page,

            # Search & Discovery
            kb_tools.search_kb,
            kb_tools.find_related_pages,
            kb_tools.get_backlinks,

            # RAG Operations
            rag_tools.generate_embeddings,
            rag_tools.query_rag,
            rag_tools.get_context_for_task,

            # Quality & Verification
            kb_tools.mark_verified,
            kb_tools.detect_stale_pages,
            kb_tools.suggest_updates,

            # Analysis
            analysis_tools.summarize_page,
            analysis_tools.analyze_structure,
            analysis_tools.suggest_organization,
        ],
        settings={
            "workspace_id": workspace_id,
            "user_id": user_id,
            "suggestion_mode": True,  # Always suggest, never auto-execute
        },
    )
```

### Scribe System Prompt

```markdown
# agents/platform/scribe/prompts/scribe_system.md

You are Scribe, the Knowledge Base Manager for the HYVVE platform.

## Role

You help users maintain high-quality documentation by:
- Creating and updating KB pages based on project context
- Detecting stale or outdated content
- Suggesting structural improvements
- Providing RAG-powered context for tasks
- Ensuring verified content stays current

## Capabilities

1. **Page Management**
   - Create new pages from context (meeting notes, completed tasks, etc.)
   - Update existing pages with new information
   - Organize pages into hierarchical structure

2. **Content Quality**
   - Detect pages that haven't been updated in 90+ days
   - Identify pages with low view counts
   - Flag expired verifications for review
   - Suggest content improvements

3. **Search & Discovery**
   - Search KB using full-text and semantic search
   - Find related pages based on content similarity
   - Provide RAG context for agent tasks

4. **Verification Management**
   - Mark pages as verified (with user approval)
   - Recommend verification periods based on content type
   - Track verification expirations

## Operating Principles

1. **Always Suggest, Never Execute**
   - Present recommendations as cards
   - Require explicit user approval
   - Explain reasoning for suggestions

2. **Context-Aware**
   - Use RAG to understand existing KB content
   - Avoid creating duplicate pages
   - Maintain consistent structure

3. **Quality-Focused**
   - Prioritize clarity and accuracy
   - Recommend verification for critical content
   - Flag outdated information

## Example Interactions

User: "Summarize our deployment process"
You: [Search KB for deployment-related pages, use RAG to extract key steps, provide summary with citations]

User: "What pages need review?"
You: [Query stale pages, present list with update suggestions]

User: "Create a page documenting our API architecture"
You: [Draft page structure, ask for approval, create page with verified badge recommendation]
```

### Scribe Tools Implementation

```python
# agents/platform/scribe/tools/kb_tools.py

from agno.tools import tool
from typing import Optional, List, Dict
import httpx

@tool
async def create_kb_page(
    title: str,
    content: str,
    parent_id: Optional[str] = None,
    workspace_id: str = None,
    api_base_url: str = None,
    auth_token: str = None,
) -> Dict:
    """
    Create a new KB page.

    Args:
        title: Page title
        content: Page content (markdown)
        parent_id: Optional parent page ID for hierarchy
        workspace_id: Workspace ID
        api_base_url: API base URL
        auth_token: Auth token for API

    Returns:
        Created page object
    """
    # Convert markdown to Tiptap JSON
    tiptap_content = markdown_to_tiptap(content)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{api_base_url}/api/kb/pages",
            json={
                "title": title,
                "content": tiptap_content,
                "parentId": parent_id,
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        response.raise_for_status()
        return response.json()


@tool
async def update_kb_page(
    page_id: str,
    content: str,
    workspace_id: str = None,
    api_base_url: str = None,
    auth_token: str = None,
) -> Dict:
    """
    Update existing KB page content.

    Args:
        page_id: Page ID to update
        content: New content (markdown)
        workspace_id: Workspace ID
        api_base_url: API base URL
        auth_token: Auth token

    Returns:
        Updated page object
    """
    tiptap_content = markdown_to_tiptap(content)

    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{api_base_url}/api/kb/pages/{page_id}",
            json={"content": tiptap_content},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        response.raise_for_status()
        return response.json()


@tool
async def search_kb(
    query: str,
    workspace_id: str = None,
    api_base_url: str = None,
    auth_token: str = None,
) -> List[Dict]:
    """
    Search KB pages using full-text and semantic search.

    Args:
        query: Search query
        workspace_id: Workspace ID
        api_base_url: API base URL
        auth_token: Auth token

    Returns:
        List of matching pages with snippets
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{api_base_url}/api/kb/search",
            params={"q": query, "limit": 10},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        response.raise_for_status()
        return response.json()


@tool
async def detect_stale_pages(
    workspace_id: str = None,
    api_base_url: str = None,
    auth_token: str = None,
) -> List[Dict]:
    """
    Find pages that need review (expired verification, old content, low views).

    Args:
        workspace_id: Workspace ID
        api_base_url: API base URL
        auth_token: Auth token

    Returns:
        List of stale pages with reasons
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{api_base_url}/api/kb/stale",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        response.raise_for_status()
        return response.json()


@tool
async def mark_verified(
    page_id: str,
    expires_in: str = "90d",
    workspace_id: str = None,
    api_base_url: str = None,
    auth_token: str = None,
) -> Dict:
    """
    Mark a page as verified with expiration period.

    Args:
        page_id: Page ID to verify
        expires_in: Expiration period ('30d', '60d', '90d', 'never')
        workspace_id: Workspace ID
        api_base_url: API base URL
        auth_token: Auth token

    Returns:
        Updated page with verification status
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{api_base_url}/api/kb/pages/{page_id}/verify",
            json={"expiresIn": expires_in},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        response.raise_for_status()
        return response.json()
```

```python
# agents/platform/scribe/tools/analysis_tools.py

from agno.tools import tool
from typing import Dict
import httpx

@tool
async def summarize_page(
    page_id: str,
    workspace_id: str = None,
    api_base_url: str = None,
    auth_token: str = None,
    llm_client = None,
) -> str:
    """
    Generate a summary of a KB page.

    Args:
        page_id: Page ID to summarize
        workspace_id: Workspace ID
        api_base_url: API base URL
        auth_token: Auth token
        llm_client: LLM client for generation

    Returns:
        Summary text
    """
    # Fetch page content
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{api_base_url}/api/kb/pages/{page_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        response.raise_for_status()
        page = response.json()

    # Extract text from Tiptap JSON
    text = extract_text_from_tiptap(page["content"])

    # Generate summary using LLM
    summary = await llm_client.generate(
        prompt=f"Summarize the following documentation in 2-3 sentences:\n\n{text}",
        max_tokens=150,
    )

    return summary


@tool
async def analyze_structure(
    workspace_id: str = None,
    api_base_url: str = None,
    auth_token: str = None,
) -> Dict:
    """
    Analyze KB structure and suggest improvements.

    Args:
        workspace_id: Workspace ID
        api_base_url: API base URL
        auth_token: Auth token

    Returns:
        Structure analysis with suggestions
    """
    # Fetch all pages
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{api_base_url}/api/kb/pages",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        response.raise_for_status()
        pages = response.json()

    # Analyze structure
    analysis = {
        "total_pages": len(pages),
        "orphan_pages": [],  # Pages with no parent
        "deep_nesting": [],  # Pages nested > 3 levels
        "large_sections": [],  # Parents with > 20 children
        "suggestions": [],
    }

    # ... analyze pages ...

    return analysis
```

---

## API Endpoints

### Verification Endpoints

```yaml
# Base path: /api/kb/pages/:pageId

POST /api/kb/pages/:pageId/verify
  Description: Mark page as verified
  Body:
    expiresIn: '30d' | '60d' | '90d' | 'never'
  Response: KnowledgePage (with verification fields)
  Events: kb.page.verified

DELETE /api/kb/pages/:pageId/verify
  Description: Remove verification status
  Response: KnowledgePage (verification fields cleared)
  Events: kb.page.unverified

GET /api/kb/stale
  Description: Get all stale pages (expired verification, old content, low views)
  Response: KnowledgePage[] (with owner details)
  Criteria:
    - isVerified = true AND verifyExpires <= now()
    - updatedAt <= now() - 90 days
    - viewCount < 5
```

### Mention Endpoints

```yaml
# Mentions are extracted automatically on page save
# No explicit endpoints needed

# Users endpoint for autocomplete
GET /api/workspace/users
  Description: Get workspace users (for @mention autocomplete)
  Query params:
    search?: string  # Filter by name/email
    limit?: number   # Default: 10
  Response: User[] (id, name, email, avatarUrl)

# Tasks endpoint for autocomplete
GET /api/pm/tasks/search
  Description: Search tasks by number or title (for #task autocomplete)
  Query params:
    q: string        # Search query
    projectId?: string  # Filter by project
    limit?: number   # Default: 10
  Response: Task[] (id, taskNumber, title, status)
```

---

## Frontend Components

### Verification UI Components

```typescript
// apps/web/src/components/kb/VerificationBadge.tsx

'use client';

import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, AlertTriangle, Shield, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface VerificationBadgeProps {
  page: {
    isVerified: boolean;
    verifiedAt: string | null;
    verifyExpires: string | null;
    verifiedBy: { name: string } | null;
  };
  canVerify: boolean;
  onVerify: (expiresIn: string) => Promise<void>;
  onUnverify: () => Promise<void>;
}

export function VerificationBadge({
  page,
  canVerify,
  onVerify,
  onUnverify,
}: VerificationBadgeProps) {
  if (page.isVerified) {
    const expiresIn = page.verifyExpires
      ? formatDistanceToNow(new Date(page.verifyExpires))
      : 'Never';

    const isExpired = page.verifyExpires &&
      new Date(page.verifyExpires) < new Date();

    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
          isExpired
            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        )}
      >
        {isExpired ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <CheckCircle className="w-4 h-4" />
        )}
        <span className="font-medium">
          {isExpired ? 'Verification Expired' : 'Verified'}
        </span>
        <span className="text-xs opacity-75">
          {isExpired
            ? `Expired ${expiresIn} ago`
            : page.verifyExpires
            ? `Expires in ${expiresIn}`
            : 'Never expires'}
        </span>
        {canVerify && (
          <button
            onClick={onUnverify}
            className="ml-2 opacity-50 hover:opacity-100 transition-opacity"
            title="Remove verification"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  if (!canVerify) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="w-4 h-4 mr-2" />
          Mark as Verified
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onVerify('30d')}>
          Verify for 30 days
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onVerify('60d')}>
          Verify for 60 days
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onVerify('90d')}>
          Verify for 90 days
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onVerify('never')}>
          Verify permanently
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Stale Content Dashboard

```typescript
// apps/web/src/components/kb/StaleContentDashboard.tsx

'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Clock, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface StalePage {
  id: string;
  title: string;
  slug: string;
  updatedAt: string;
  viewCount: number;
  isVerified: boolean;
  verifyExpires: string | null;
  owner: {
    id: string;
    name: string;
  };
  reasons: string[];  // ["Expired verification", "Not updated in 90+ days", etc.]
}

interface StaleContentDashboardProps {
  pages: StalePage[];
  onBulkVerify: (pageIds: string[]) => Promise<void>;
  onBulkDelete: (pageIds: string[]) => Promise<void>;
}

export function StaleContentDashboard({
  pages,
  onBulkVerify,
  onBulkDelete,
}: StaleContentDashboardProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (pageId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === pages.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pages.map((p) => p.id)));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stale Content</h2>
          <p className="text-sm text-muted-foreground">
            Pages needing review: {pages.length}
          </p>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selected.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkVerify(Array.from(selected))}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Bulk Verify
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onBulkDelete(Array.from(selected))}
            >
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="w-12 p-4">
                <Checkbox
                  checked={selected.size === pages.length}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="text-left p-4">Page</th>
              <th className="text-left p-4">Owner</th>
              <th className="text-left p-4">Reasons</th>
              <th className="text-left p-4">Last Updated</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} className="border-t hover:bg-muted/50">
                <td className="p-4">
                  <Checkbox
                    checked={selected.has(page.id)}
                    onCheckedChange={() => toggleSelect(page.id)}
                  />
                </td>
                <td className="p-4">
                  <a
                    href={`/kb/${page.slug}`}
                    className="font-medium hover:underline"
                  >
                    {page.title}
                  </a>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {page.owner.name}
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {page.reasons.map((reason, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs"
                      >
                        {reason === 'Expired verification' && <AlertTriangle className="w-3 h-3" />}
                        {reason === 'Not updated in 90+ days' && <Clock className="w-3 h-3" />}
                        {reason === 'Low view count' && <Eye className="w-3 h-3" />}
                        {reason}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
                </td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="sm">
                    Review
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### @Mention Tiptap Extension

```typescript
// apps/web/src/components/kb/editor/extensions/MentionExtension.ts

import { Node, mergeAttributes } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion';

export const MentionPluginKey = new PluginKey('mention');

export interface MentionOptions {
  HTMLAttributes: Record<string, any>;
  renderLabel: (props: { options: MentionOptions; node: any }) => string;
  suggestion: Omit<SuggestionOptions, 'editor'>;
}

export const Mention = Node.create<MentionOptions>({
  name: 'mention',

  addOptions() {
    return {
      HTMLAttributes: {},
      renderLabel({ options, node }) {
        return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`;
      },
      suggestion: {
        char: '@',
        pluginKey: MentionPluginKey,
        command: ({ editor, range, props }) => {
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: this.name,
                attrs: props,
              },
              {
                type: 'text',
                text: ' ',
              },
            ])
            .run();
        },
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          const type = state.schema.nodes[this.name];
          const allow = !!$from.parent.type.contentMatch.matchType(type);
          return allow;
        },
      },
    };
  },

  group: 'inline',

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }

          return {
            'data-id': attributes.id,
          };
        },
      },

      label: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-label'),
        renderHTML: (attributes) => {
          if (!attributes.label) {
            return {};
          }

          return {
            'data-label': attributes.label,
          };
        },
      },

      type: {
        default: 'USER',
        parseHTML: (element) => element.getAttribute('data-type'),
        renderHTML: (attributes) => {
          return {
            'data-type': attributes.type,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="mention"]`,
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': 'mention' },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
      this.options.renderLabel({
        options: this.options,
        node,
      }),
    ];
  },

  renderText({ node }) {
    return this.options.renderLabel({
      options: this.options,
      node,
    });
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
```

### Mention Suggestion Component

```typescript
// apps/web/src/components/kb/editor/MentionSuggestion.tsx

import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { SuggestionProps } from '@tiptap/suggestion';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface MentionListProps {
  items: User[];
  command: (item: User) => void;
}

const MentionList = forwardRef<any, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  useEffect(() => setSelectedIndex(0), [props.items]);

  return (
    <div className="bg-background border rounded-lg shadow-lg overflow-hidden">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent",
              index === selectedIndex && "bg-accent"
            )}
          >
            {item.avatarUrl ? (
              <img
                src={item.avatarUrl}
                alt={item.name}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                {item.name[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{item.name}</div>
              <div className="text-xs text-muted-foreground truncate">{item.email}</div>
            </div>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-muted-foreground">
          No users found
        </div>
      )}
    </div>
  );
});

export const mentionSuggestion = {
  items: async ({ query }: { query: string }) => {
    // Fetch users from API
    const response = await fetch(`/api/workspace/users?search=${query}&limit=10`);
    const users = await response.json();
    return users;
  },

  render: () => {
    let component: ReactRenderer;
    let popup: TippyInstance[];

    return {
      onStart: (props: SuggestionProps) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as any,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: SuggestionProps) {
        component.updateProps(props);

        popup[0].setProps({
          getReferenceClientRect: props.clientRect as any,
        });
      },

      onKeyDown(props: { event: KeyboardEvent }) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }

        return component.ref?.onKeyDown(props);
      },

      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
};
```

---

## Integration Points

### Integration with RAG System (KB-02)

The verification system enhances RAG queries by boosting verified content:

```typescript
// apps/api/src/kb/rag/rag.service.ts (from KB-02)

// Updated to include verification boost
async query(
  workspaceId: string,
  queryText: string,
  options?: { topK?: number; boostVerified?: boolean },
): Promise<RAGResult[]> {
  const topK = options?.topK ?? this.config.topK;
  const boostVerified = options?.boostVerified ?? true;

  // 1. Embed query
  const [queryEmbedding] = await this.byoai.embed(workspaceId, [queryText]);

  // 2. Vector search with verification boost
  const results = await this.prisma.$queryRaw<RAGResult[]>`
    SELECT
      pe.id,
      pe."pageId",
      kp.title as "pageTitle",
      pe."chunkText",
      1 - (pe.embedding <=> ${queryEmbedding}::vector) as similarity,
      kp."isVerified",
      kp."verifyExpires",
      CASE
        -- Verified and not expired: 1.5x boost
        WHEN kp."isVerified"
          AND (kp."verifyExpires" IS NULL OR kp."verifyExpires" > NOW())
          AND ${boostVerified}
        THEN (1 - (pe.embedding <=> ${queryEmbedding}::vector)) * 1.5

        -- Verified but expired: no boost
        WHEN kp."isVerified"
          AND kp."verifyExpires" IS NOT NULL
          AND kp."verifyExpires" <= NOW()
        THEN 1 - (pe.embedding <=> ${queryEmbedding}::vector)

        -- Unverified: no boost
        ELSE 1 - (pe.embedding <=> ${queryEmbedding}::vector)
      END as score
    FROM "PageEmbedding" pe
    JOIN "KnowledgePage" kp ON pe."pageId" = kp.id
    WHERE kp."workspaceId" = ${workspaceId}
      AND kp."deletedAt" IS NULL
    ORDER BY score DESC
    LIMIT ${topK}
  `;

  return results;
}
```

### Integration with Notification System

Verification expiration notifications use the existing platform notification service:

```typescript
// apps/api/src/kb/verification/verification-expiry.job.ts

await this.notifications.send({
  userId: page.ownerId,
  type: 'kb.verification.expired',
  title: 'Page verification expired',
  message: `The page "${page.title}" needs re-verification.`,
  data: {
    pageId: page.id,
    pageTitle: page.title,
    pageSlug: page.slug,
  },
  link: `/kb/${page.slug}`,
  priority: 'medium',
});
```

### Integration with PM Task System

The #task reference extension links KB pages to PM tasks:

```typescript
// apps/web/src/components/kb/editor/extensions/TaskReferenceExtension.ts

export const TaskReference = Node.create<TaskReferenceOptions>({
  name: 'taskReference',

  // Similar to Mention extension, but:
  // - char: '#'
  // - Fetches from /api/pm/tasks/search
  // - Stores taskId in PageMention with mentionType='TASK'
  // - Renders as clickable chip (e.g., "#PM-123")

  suggestion: {
    char: '#',
    items: async ({ query }: { query: string }) => {
      const response = await fetch(`/api/pm/tasks/search?q=${query}&limit=10`);
      const tasks = await response.json();
      return tasks;
    },
    // ... similar render logic to Mention
  },
});
```

---

## Story Implementation Guide

### Story KB-03.1: Verification System

**Goal:** Enable page owners/admins to mark pages as verified with expiration periods.

**Tasks:**
1. Add verification fields to KnowledgePage model (migration)
2. Create VerificationService with markVerified/removeVerification methods
3. Add POST/DELETE /api/kb/pages/:id/verify endpoints
4. Create VerificationBadge component
5. Add verification dropdown to PageHeader
6. Update RAG query to boost verified content by 1.5x
7. Publish kb.page.verified events
8. Write unit tests for VerificationService

**Acceptance Criteria:**
- Page owner can mark page as verified
- Dropdown shows expiration options (30/60/90 days, never)
- Badge displays verification status and expiry date
- Verified pages get 1.5x boost in RAG queries
- Only verified, non-expired pages receive boost

**Files:**
- `packages/db/prisma/migrations/...` (add verification fields)
- `apps/api/src/kb/verification/verification.service.ts`
- `apps/api/src/kb/verification/verification.controller.ts`
- `apps/web/src/components/kb/VerificationBadge.tsx`
- `apps/api/src/kb/rag/rag.service.ts` (update boost logic)

### Story KB-03.2: Verification Expiration

**Goal:** Automatically detect expired verifications and notify owners.

**Tasks:**
1. Create VerificationExpiryJob with daily cron schedule
2. Query pages with verifyExpires <= now()
3. Send notification to page owner
4. Create PageActivity (VERIFICATION_EXPIRED)
5. Publish kb.page.verification_expired event
6. Update badge to show "Verification Expired" warning
7. Add verification status filter to page queries

**Acceptance Criteria:**
- Daily cron runs at midnight
- Expired verifications flagged
- Owner receives notification with link to page
- Badge shows warning state
- Page still searchable but with lower RAG priority
- Activity log shows expiration event

**Files:**
- `apps/api/src/kb/verification/verification-expiry.job.ts`
- `apps/api/src/kb/verification/verification.module.ts` (register job)
- `apps/web/src/components/kb/VerificationBadge.tsx` (update for expired state)

### Story KB-03.3: Re-verification Workflow

**Goal:** Allow easy re-verification of expired pages.

**Tasks:**
1. Show "Re-verify" button when verification expired
2. Re-use markVerified endpoint (updates timestamps)
3. Log re-verification in PageActivity
4. Update badge to show new expiry date
5. Clear expired warning
6. Send confirmation notification

**Acceptance Criteria:**
- "Re-verify" button visible on expired pages
- Same expiration dropdown as initial verification
- Activity log shows re-verification with new expiry
- Badge updates to show new status
- Notification confirms re-verification

**Files:**
- `apps/web/src/components/kb/VerificationBadge.tsx` (add re-verify button)
- `apps/api/src/kb/verification/verification.service.ts` (handle re-verify logic)

### Story KB-03.4: Stale Content Dashboard

**Goal:** Show KB admins all pages needing review.

**Tasks:**
1. Create GET /api/kb/stale endpoint
2. Query pages meeting stale criteria:
   - Expired verification
   - Not updated in 90+ days
   - viewCount < 5
3. Create StaleContentDashboard component
4. Add /kb/stale route
5. Implement bulk actions (verify, delete, assign for review)
6. Show reasons for staleness
7. Filter/sort by staleness type

**Acceptance Criteria:**
- Dashboard shows all stale pages
- Each page shows reasons (expired, old, low views)
- Bulk selection with checkbox
- Bulk actions: verify, delete
- Click page navigates to edit view
- Only admins can access dashboard

**Files:**
- `apps/api/src/kb/verification/verification.service.ts` (getStalPages)
- `apps/api/src/kb/verification/verification.controller.ts`
- `apps/web/src/app/kb/stale/page.tsx`
- `apps/web/src/components/kb/StaleContentDashboard.tsx`

### Story KB-03.5: @Mention Support

**Goal:** Allow users to @mention team members in KB pages.

**Tasks:**
1. Add PageMention model (migration)
2. Create Tiptap Mention extension
3. Implement user autocomplete (GET /api/workspace/users)
4. Create MentionSuggestion component
5. Extract mentions from content on save (MentionService)
6. Store mentions in PageMention table
7. Send notification to mentioned user
8. Render mentions as clickable chips

**Acceptance Criteria:**
- Typing "@" shows autocomplete dropdown
- Can search users by name
- Selected user inserted as mention node
- Mention renders as clickable chip
- Mentioned user receives notification
- Click mention navigates to user profile (if implemented)

**Files:**
- `packages/db/prisma/migrations/...` (add PageMention model)
- `apps/web/src/components/kb/editor/extensions/MentionExtension.ts`
- `apps/web/src/components/kb/editor/MentionSuggestion.tsx`
- `apps/api/src/kb/mentions/mention.service.ts`
- `apps/api/src/kb/mentions/mention.controller.ts` (user search)

### Story KB-03.6: #Task Reference Support

**Goal:** Allow linking to PM tasks via #task-number.

**Tasks:**
1. Create Tiptap TaskReference extension (similar to Mention)
2. Implement task autocomplete (GET /api/pm/tasks/search)
3. Create TaskReferenceSuggestion component
4. Store task references in PageMention (mentionType=TASK)
5. Render task references as clickable chips (#PM-123)
6. Click navigates to task detail panel
7. Show backlinks in task detail (pages referencing this task)

**Acceptance Criteria:**
- Typing "#" shows task autocomplete
- Can search tasks by number or title
- Selected task inserted as reference node
- Reference renders as clickable chip (#PM-123)
- Click navigates to task detail
- Task detail shows "Referenced in KB" section

**Files:**
- `apps/web/src/components/kb/editor/extensions/TaskReferenceExtension.ts`
- `apps/web/src/components/kb/editor/TaskReferenceSuggestion.tsx`
- `apps/api/src/pm/tasks/tasks.controller.ts` (add search endpoint)
- `apps/api/src/kb/mentions/mention.service.ts` (handle TASK mentions)

### Story KB-03.7: Scribe Agent Foundation

**Goal:** Create Scribe agent for AI-powered KB management.

**Tasks:**
1. Create Scribe agent structure in `agents/platform/scribe/`
2. Implement create_kb_page tool
3. Implement update_kb_page tool
4. Implement search_kb tool
5. Implement query_rag tool (for context)
6. Implement mark_verified tool
7. Implement detect_stale_pages tool
8. Implement summarize_page tool
9. Implement analyze_structure tool
10. Create Scribe system prompt
11. Add Scribe to agent team factory
12. Test agent suggestions (suggestion mode only)

**Acceptance Criteria:**
- Scribe agent can create KB pages (with approval)
- Can search KB and provide summaries
- Can detect stale pages and suggest actions
- Can mark pages as verified (with user approval)
- All actions require human approval (suggestion mode)
- Agent accessible via chat interface

**Files:**
- `agents/platform/scribe/scribe.py`
- `agents/platform/scribe/tools/kb_tools.py`
- `agents/platform/scribe/tools/rag_tools.py`
- `agents/platform/scribe/tools/analysis_tools.py`
- `agents/platform/scribe/prompts/scribe_system.md`
- `agents/platform/team.py` (add Scribe to team)

---

## Testing Strategy

### Unit Tests

**Backend (NestJS):**
- VerificationService.markVerified - sets verification fields correctly
- VerificationService.removeVerification - clears verification
- VerificationService.getStalPages - returns correct stale criteria
- VerificationExpiryJob.checkExpirations - detects expired pages
- MentionService.extractMentions - parses Tiptap JSON for mentions
- RAG query verification boost - calculates correct scores

**Agent (Python):**
- Scribe tools (create_page, search_kb, etc.) - API integration
- Tool response parsing and error handling

**Frontend (Vitest + Testing Library):**
- VerificationBadge - shows correct state (verified/expired/unverified)
- StaleContentDashboard - renders stale pages correctly
- MentionSuggestion - autocomplete and selection
- TaskReferenceSuggestion - autocomplete and selection

### Integration Tests

**API Endpoints:**
- POST /api/kb/pages/:id/verify - creates verification
- DELETE /api/kb/pages/:id/verify - removes verification
- GET /api/kb/stale - returns stale pages
- GET /api/workspace/users - returns users for mentions
- GET /api/pm/tasks/search - returns tasks for references

**Event Publishing:**
- Verify kb.page.verified event published
- Verify kb.page.unverified event published
- Verify kb.page.verification_expired event published

**RAG Integration:**
- Verify verified pages boosted in RAG queries
- Verify expired pages not boosted

### E2E Tests (Playwright)

**User Flows:**
1. Mark page as verified → see badge → verify RAG boost
2. Wait for expiration (mock time) → see expired badge → re-verify
3. Admin views stale dashboard → bulk verify → verify updates
4. Type @mention → select user → verify notification sent
5. Type #task → select task → verify link works
6. Chat with Scribe → ask to create page → approve suggestion

**Critical Paths:**
- Full verification lifecycle (mark → expire → re-verify)
- Mention extraction and notification
- Task reference and navigation
- Scribe agent suggestions and approval

---

## Dependencies and Prerequisites

### NPM Packages (Frontend)

```json
{
  "@tiptap/extension-mention": "^2.1.0",
  "tippy.js": "^6.3.7"
}
```

### Database Migration

```sql
-- Migration: add-kb-verification-mentions

-- Add verification fields to knowledge_pages
ALTER TABLE "knowledge_pages"
  ADD COLUMN "is_verified" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "verified_at" TIMESTAMP,
  ADD COLUMN "verified_by_id" TEXT,
  ADD COLUMN "verify_expires" TIMESTAMP;

-- Add indexes
CREATE INDEX "idx_is_verified" ON "knowledge_pages"("is_verified");
CREATE INDEX "idx_verify_expires" ON "knowledge_pages"("verify_expires");

-- Create page_mentions table
CREATE TABLE "page_mentions" (
  "id" TEXT PRIMARY KEY,
  "page_id" TEXT NOT NULL,
  "mention_type" TEXT NOT NULL CHECK ("mention_type" IN ('USER', 'TASK', 'PAGE')),
  "target_id" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_page_mention" FOREIGN KEY ("page_id") REFERENCES "knowledge_pages"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_page_id_mention" ON "page_mentions"("page_id");
CREATE INDEX "idx_target_id_mention" ON "page_mentions"("target_id");
CREATE INDEX "idx_mention_type" ON "page_mentions"("mention_type");

-- Add new PageActivityType enum values
ALTER TYPE "PageActivityType" ADD VALUE 'VERIFIED';
ALTER TYPE "PageActivityType" ADD VALUE 'UNVERIFIED';
ALTER TYPE "PageActivityType" ADD VALUE 'VERIFICATION_EXPIRED';
ALTER TYPE "PageActivityType" ADD VALUE 'MENTIONED_USER';
ALTER TYPE "PageActivityType" ADD VALUE 'REFERENCED_TASK';
```

### Agno Agent Dependencies

```bash
# agents/platform/scribe/requirements.txt
agno>=0.1.0
httpx>=0.25.0
markdown>=3.5.0
```

---

## Performance Considerations

### Query Optimization

1. **Stale Page Queries**
   - Use indexes on isVerified, verifyExpires, updatedAt, viewCount
   - Limit results to prevent slow queries
   - Cache results for 5 minutes (admin dashboard)

2. **Mention Extraction**
   - Extract mentions asynchronously (background job)
   - Batch process for bulk page updates
   - Delete old mentions efficiently (DELETE WHERE pageId IN (...))

3. **RAG Boost Calculation**
   - Verification boost calculated in SQL (no N+1 queries)
   - Cache verified page list for frequent queries

### Caching Strategy

1. **Redis Cache**
   - Stale pages list (TTL: 5 minutes)
   - Verified pages list (TTL: 10 minutes, invalidate on verify/unverify)
   - User autocomplete results (TTL: 1 minute)

2. **Browser Cache**
   - Verification badge status (optimistic updates)
   - Mention suggestions (debounced API calls)

---

## Migration from KB-02 to KB-03

KB-03 builds on the RAG foundation from KB-02. No breaking changes, only additions:

1. Add verification fields to existing KnowledgePage model
2. Add PageMention model for mentions/references
3. Update RAG query to include verification boost
4. Add Scribe agent to agent team

**Migration Steps:**
1. Run migration to add verification fields and PageMention table
2. Deploy backend with VerificationService and MentionService
3. Deploy frontend with VerificationBadge and Mention extensions
4. Deploy Scribe agent to agent server
5. Run cron job registration for VerificationExpiryJob

No data migration needed. Existing pages default to isVerified=false.

---

## Related Documentation

- [KB Specification](../kb-specification.md) - Full KB requirements
- [Module PRD](../PRD.md) - Core-PM product requirements
- [Module Architecture](../architecture.md) - Overall architecture
- [Sprint Status](../sprint-status.yaml) - Epic and story tracking
- [Epic Definition](./epic-kb-03-kb-verification-scribe-agent.md) - Epic and stories
- [KB-01 Tech Spec](./epic-kb-01-tech-spec.md) - Foundation patterns
- [KB-02 Tech Spec](./epic-kb-02-tech-spec.md) - RAG integration

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-18 | Initial technical specification for Epic KB-03 |
