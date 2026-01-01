# DM-11.14: Accurate Token Estimation

**Epic:** DM-11 - Advanced Features & Optimizations
**Points:** 2
**Status:** Done

## User Story

As a **developer**, I want accurate token counting for AI model inputs so that I can properly estimate costs and stay within context limits.

## Background

From DM-09 Code Review:
> "Token estimation uses simple character-based approximation. Consider tiktoken for accuracy."

The current character-based estimation (len/4) is imprecise for:
- Non-ASCII characters
- Code with special tokens
- Mixed content types

## Acceptance Criteria

- [x] Create token_counter service using tiktoken library
- [x] Support multiple model encodings (cl100k_base, o200k_base)
- [x] Graceful fallback to estimation if tiktoken unavailable
- [x] Cache encoders for performance
- [x] Provide metadata about counting method accuracy
- [x] Unit tests for all counting scenarios

## Technical Implementation

### Token Counter Service
**File:** `agents/services/token_counter.py`

Key features:
- Uses tiktoken library for accurate token counting
- Supports multiple model encodings:
  - `cl100k_base`: GPT-4, GPT-3.5-turbo, Claude models
  - `o200k_base`: GPT-4o
- LRU-cached encoder instances for performance
- Fallback to `len(text) // 4` estimation when tiktoken unavailable

### API

```python
from agents.services import count_tokens, count_tokens_with_metadata

# Simple count
tokens = count_tokens("Hello, world!")  # Returns int

# With accuracy metadata
result = count_tokens_with_metadata("Hello, world!", model="gpt-4")
# {
#   "count": 4,
#   "method": "tiktoken",
#   "encoding": "cl100k_base",
#   "accurate": True,
#   "model": "gpt-4"
# }

# Check if accurate counting available
from agents.services import is_tiktoken_available
if is_tiktoken_available():
    print("Using accurate token counting")
```

### Model to Encoding Mapping

| Model Pattern | Encoding |
|--------------|----------|
| gpt-4, gpt-4-turbo | cl100k_base |
| gpt-4o | o200k_base |
| gpt-3.5-turbo | cl100k_base |
| claude, claude-3, claude-3.5 | cl100k_base |
| default/unknown | cl100k_base |

## Files Changed

- `agents/services/token_counter.py` - New token counting service
- `agents/services/__init__.py` - Export token counter functions
- `agents/tests/test_token_counter.py` - 17 unit tests

## Test Results

17 tests pass:
- Basic token counting (empty, simple, long text)
- Metadata structure validation
- Model encoding selection
- Tiktoken-specific tests (accurate counting, caching)
- Fallback estimation tests

## Definition of Done

- [x] Token counter service implemented with tiktoken
- [x] Multiple model encodings supported
- [x] Graceful fallback to estimation
- [x] LRU caching for encoder instances
- [x] Unit tests pass (17/17)
- [x] Exported from services package
