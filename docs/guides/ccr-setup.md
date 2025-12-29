# Claude Code Router (CCR) Setup Guide

This guide covers installation and configuration of Claude Code Router (CCR) for intelligent model routing in HYVVE.

## Overview

CCR provides:
- **Provider Abstraction:** Route to Claude, DeepSeek, Gemini, or OpenRouter
- **Task-Based Routing:** Automatic model selection based on task type
- **Fallback Chains:** Automatic failover when providers are unavailable
- **OpenAI-Compatible API:** Works with any OpenAI-compatible client

## Prerequisites

- **Node.js 20+** - Required for CCR runtime
- **Active CLI Subscriptions** - At least one of:
  - Claude subscription (via `claude` CLI)
  - Gemini subscription (via `gemini` CLI)
  - API keys for DeepSeek or OpenRouter

## Installation

### 1. Clone CCR Repository

```bash
# Clone CCR-custom to home directory
git clone https://github.com/VisionCraft3r/ccr-custom.git ~/.ccr
cd ~/.ccr

# Install dependencies
npm install
```

### 2. Create Configuration Directory

```bash
mkdir -p ~/.claude-code-router
```

### 3. Configure CCR

Copy the template configuration and customize:

```bash
cp /path/to/agents/ccr_config/ccr_config_template.json ~/.claude-code-router/config.json
```

Or create manually:

```json
{
  "port": 3456,
  "providers": {
    "claude": {
      "type": "claude-cli",
      "base_url": "subscription"
    },
    "deepseek": {
      "type": "openai-compatible",
      "base_url": "https://api.deepseek.com/v1",
      "api_key_env": "DEEPSEEK_API_KEY"
    },
    "gemini": {
      "type": "gemini-cli",
      "base_url": "subscription"
    },
    "openrouter": {
      "type": "openai-compatible",
      "base_url": "https://openrouter.ai/api/v1",
      "api_key_env": "OPENROUTER_API_KEY"
    }
  },
  "routing": {
    "reasoning": "claude",
    "code_generation": "deepseek",
    "long_context": "gemini",
    "default": "claude"
  },
  "fallbacks": {
    "claude": ["deepseek", "gemini"],
    "deepseek": ["claude", "gemini"],
    "gemini": ["claude", "deepseek"]
  },
  "health_check": {
    "enabled": true,
    "interval_seconds": 30
  }
}
```

### 4. Set Environment Variables

```bash
# Required for OpenAI-compatible providers
export DEEPSEEK_API_KEY="your-deepseek-key"
export OPENROUTER_API_KEY="your-openrouter-key"
```

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) for persistence.

### 5. Start CCR

```bash
cd ~/.ccr
npm start
```

Or run as a background service:

```bash
# Using pm2
npm install -g pm2
pm2 start ~/.ccr/index.js --name ccr

# Or using nohup
nohup node ~/.ccr/index.js > ~/.ccr/ccr.log 2>&1 &
```

## Configuration Reference

### Provider Types

| Type | Description | Requirements |
|------|-------------|--------------|
| `claude-cli` | Claude subscription via CLI | `claude` CLI installed and authenticated |
| `gemini-cli` | Gemini subscription via CLI | `gemini` CLI installed and authenticated |
| `openai-compatible` | Any OpenAI-compatible API | API key in environment variable |

### Routing Rules

| Task Type | Recommended Provider | Rationale |
|-----------|---------------------|-----------|
| `reasoning` | Claude | Best reasoning capabilities |
| `code_generation` | DeepSeek | Cost-effective coding tasks |
| `long_context` | Gemini | Best context window support |
| `default` | Claude | General-purpose fallback |

### Fallback Chains

Configure automatic failover when a provider is unavailable:

```json
{
  "fallbacks": {
    "claude": ["deepseek", "gemini"],
    "deepseek": ["claude", "gemini"],
    "gemini": ["claude", "deepseek"]
  }
}
```

When Claude is unavailable, CCR will try DeepSeek, then Gemini.

## HYVVE Integration

### Enable CCR in AgentOS

Set environment variables:

```bash
export CCR_ENABLED=true
export CCR_URL=http://localhost:3456
export CCR_HEALTH_CHECK_INTERVAL=30
```

### Health Check Endpoint

CCR exposes a health check endpoint:

```bash
curl http://localhost:3456/health
```

Response:

```json
{
  "status": "healthy",
  "providers": {
    "claude": "available",
    "deepseek": "available",
    "gemini": "available"
  },
  "uptime_seconds": 3600
}
```

### Using CCR with Agno

Once CCR is running, Agno agents can use it via the `CCRModel` provider:

```python
from agents.models.ccr_provider import CCRModel

model = CCRModel(
    task_type="code_generation",
)
```

## Troubleshooting

### CCR Won't Start

1. Check Node.js version: `node --version` (must be 20+)
2. Check port availability: `lsof -i :3456`
3. Check logs: `cat ~/.ccr/ccr.log`

### Provider Connection Failed

1. Verify API keys are set correctly
2. For CLI providers, ensure CLI is authenticated:
   - Claude: `claude --version`
   - Gemini: `gemini --version`
3. Check network connectivity to provider endpoints

### Health Check Returns "unhealthy"

1. Check individual provider status in health response
2. Verify fallback chain is configured correctly
3. Check provider rate limits

### High Latency

1. Consider provider proximity (DeepSeek is in China)
2. Check network conditions
3. Review routing rules - ensure appropriate provider for task type

## Monitoring

### Logs

CCR logs are written to:
- stdout when running directly
- `~/.ccr/ccr.log` when running in background

### Metrics

CCR tracks:
- Request count per provider
- Latency percentiles
- Fallback trigger rate
- Provider availability

Access metrics via:

```bash
curl http://localhost:3456/metrics
```

## Security Considerations

- **API Keys:** Store in environment variables, never in config files
- **Network:** Run CCR on localhost only in development
- **Production:** Use proper secrets management (Vault, AWS Secrets, etc.)
- **Logging:** Avoid logging request/response bodies containing sensitive data

## Next Steps

1. Verify CCR health: `curl http://localhost:3456/health`
2. Test routing: Send requests with different `task_type` values
3. Monitor fallbacks: Simulate provider failures
4. Integrate with Agno agents via `CCRModel`
