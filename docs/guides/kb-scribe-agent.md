# Scribe Agent Reference

Scribe is the AI-powered Knowledge Base assistant for HYVVE. It helps users create, organize, search, and maintain documentation through natural language interactions.

---

## Overview

Scribe operates in **suggestion mode** - all content modifications require explicit human approval. This ensures accuracy while providing AI-assisted productivity.

### Core Capabilities

| Category | Description |
|----------|-------------|
| **Content Creation** | Draft new pages, suggest improvements, format content |
| **Knowledge Discovery** | Search, semantic queries, find related content |
| **Content Maintenance** | Detect stale pages, suggest verifications, find duplicates |
| **Structure Analysis** | Analyze KB organization, identify issues |

---

## Available Tools

### Content Tools

#### `create_kb_page`
Draft a new knowledge base page.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | Yes | Page title (max 200 chars) |
| `content` | string | Yes | Page content in Markdown (max 100k chars) |
| `parent_id` | string | No | Parent page ID for hierarchy |

**Returns:** Draft page for approval

---

#### `update_kb_page`
Suggest updates to an existing page.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `page_id` | string | Yes | ID of page to update |
| `title` | string | No | New title |
| `content` | string | No | New content |

**Returns:** Diff showing proposed changes for approval

---

#### `get_kb_page`
Retrieve a specific page's content.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `page_id` | string | Yes | ID of page to retrieve |

**Returns:** Page content, metadata, and verification status

---

#### `search_kb`
Full-text search across the knowledge base.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `query` | string | Yes | Search terms |
| `limit` | int | No | Max results (default: 10) |
| `include_content` | bool | No | Include full content (default: false) |

**Returns:** List of matching pages with snippets

---

### RAG Tools

#### `query_rag`
Semantic search using embeddings for contextual retrieval.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `question` | string | Yes | Natural language question |
| `top_k` | int | No | Number of chunks (default: 5) |
| `min_score` | float | No | Minimum similarity (default: 0.7) |

**Returns:** Relevant content chunks with source attribution

---

#### `get_related_pages`
Find pages semantically related to a given page.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `page_id` | string | Yes | Source page ID |
| `limit` | int | No | Max related pages (default: 5) |

**Returns:** List of related pages with similarity scores

---

#### `ask_kb_question`
Answer a question using KB content as context.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `question` | string | Yes | Question to answer |

**Returns:** Answer with source citations

---

### Verification Tools

#### `mark_page_verified`
Suggest marking a page as verified.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `page_id` | string | Yes | Page to verify |
| `expires_in` | string | Yes | Expiration: "30d", "60d", "90d", "never" |

**Returns:** Verification suggestion for approval

---

### Analysis Tools

#### `detect_stale_pages`
Find pages that may need review.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `days_threshold` | int | No | Days since update (default: 90) |
| `include_expired_verification` | bool | No | Include expired verified pages (default: true) |
| `limit` | int | No | Max results (default: 20) |

**Returns:** List of stale pages with reasons

---

#### `summarize_page`
Generate a summary of a page's content.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `page_id` | string | Yes | Page to summarize |
| `max_sentences` | int | No | Summary length (default: 3) |

**Returns:** Summary text and key points

---

#### `analyze_kb_structure`
Analyze overall KB organization.

**Parameters:** None required

**Returns:**
- Total page count
- Verification coverage
- Orphan pages
- Empty pages
- Deep nesting issues
- Potential duplicates
- Recommendations

---

## Example Interactions

### Searching for Information

**User:** "How do I set up authentication?"

**Scribe:**
> Based on the knowledge base, here's what I found about authentication setup:
>
> From **Authentication Setup Guide** (verified):
> - Configure OAuth providers in Settings > API Keys
> - Enable 2FA under Security settings
> - API tokens managed at /settings/api-keys
>
> Related pages you might find helpful:
> - OAuth Configuration (verified)
> - API Key Management
>
> Would you like me to elaborate on any of these?

### Creating Content

**User:** "Create a page about our deployment process"

**Scribe:**
> I'd be happy to help draft that page. Here's my suggested structure:
>
> **Title:** Deployment Process Guide
>
> **Sections:**
> 1. Prerequisites
> 2. Deployment Steps
> 3. Rollback Procedure
> 4. Troubleshooting
>
> Would you like me to draft the full content with this structure?

### Maintenance Suggestions

**User:** "What pages need attention?"

**Scribe:**
> I found 5 pages that may need review:
>
> **Expired Verification:**
> - API Reference (expired 30 days ago)
> - Security Best Practices (expired 15 days ago)
>
> **Not Updated Recently:**
> - Legacy Integration Guide (180 days old)
>
> Would you like me to help prioritize or update any of these?

---

## Important Constraints

1. **Human Approval Required**: All content modifications must be approved by the user
2. **Source Attribution**: Always cites which pages information comes from
3. **Verification Respect**: Prioritizes verified pages as authoritative sources
4. **Permission Awareness**: Respects page ownership and workspace permissions
5. **Suggestion Mode**: Presents all changes as suggestions, never as fait accompli
6. **Rate Awareness**: API calls are rate-limited; batches operations when possible

---

## Configuration

Scribe is configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE_URL` | Backend API endpoint | `http://localhost:3001` |
| `SCRIBE_MODEL` | AI model for generation | `claude-3-sonnet` |
| `RAG_TOP_K` | Default RAG results | `5` |
| `RAG_MIN_SCORE` | Minimum similarity threshold | `0.7` |

---

## Integration

Scribe can be invoked through:

1. **Chat Interface** - Direct conversation in KB sidebar
2. **Agent Orchestration** - Called by Navi or other agents
3. **API** - Direct tool invocation via agent API

---

## Related Documentation

- [KB Verification Guide](./kb-verification.md)
- [Stale Content Dashboard](./kb-stale-dashboard.md)
- [Agno Development Guide](./bmad-agno-development-guide.md)
