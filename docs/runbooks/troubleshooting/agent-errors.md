# Troubleshooting: Agent Errors

## Signals
- 4xx/5xx from agent endpoints (FastAPI) or AgentOS bridge
- Error spikes in `agent_api_requests_total` or `agent_api_rate_limit_hits`
- DLQ growth with agent-related event types

## Checks
- Grafana: Agent API latency/error panels; `/api/metrics` for agent counters.
- Logs: agent service stack traces, timeouts, external API failures.
- Deployment history: recent model/config changes.

## Steps
1. **Identify failing endpoints** and payload patterns.
2. **Check rate limits**: confirm not hitting agent-side limiter; adjust config if safe.
3. **Validate upstreams** (LLM/provider health) if applicable.
4. **Reproduce** with a small payload in staging to isolate regression.
5. **Inspect DLQ** for agent-related event failures; retry after fix.

## Mitigations
- Roll back recent agent config/model change.
- Temporarily relax rate limits if they are overly aggressive and safe to do so.
- Retry DLQ after deploying fix (see [DLQ Management](../dlq-management.md)).

## Verification
- Error rate drops; latency returns to baseline.
- Agent endpoints succeed with representative payloads.

## Escalation / Related
- Coordinate with ML/Agent owner if model issues suspected.
- Follow [Incident Response](../incident-response.md) for Sev1/Sev2.
