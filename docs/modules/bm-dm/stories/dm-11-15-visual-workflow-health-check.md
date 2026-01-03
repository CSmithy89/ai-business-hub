# DM-11.15: Visual Workflow Health Check

**Epic:** DM-11 - Advanced Features & Optimizations
**Points:** 2
**Status:** Done

## User Story

As a **CI/CD pipeline maintainer**, I want robust server startup detection in the visual regression workflow so that tests don't fail due to timing issues.

## Background

From DM-09 Code Review:
> "Visual workflow uses simple wait-on without proper health checks. Consider adding retry logic and diagnostics."

The visual regression workflow previously used `npx wait-on` which:
- Had limited diagnostic output on failure
- No process tracking for cleanup
- No verification that server process was still alive during wait

## Acceptance Criteria

- [x] Replace wait-on with custom health check loop
- [x] Track server PID for reliable cleanup
- [x] Add retry logic with configurable attempts
- [x] Include diagnostic output when startup fails
- [x] Proper cleanup of server process after tests

## Technical Implementation

### Health Check Improvements
**File:** `.github/workflows/visual.yml`

1. **PID Tracking**: Store server PID for tracking and cleanup
```yaml
- name: Start web server
  run: |
    cd apps/web
    pnpm start &
    echo $! > /tmp/server.pid
    echo "Started server with PID $(cat /tmp/server.pid)"
```

2. **Robust Health Check**: Custom retry loop with diagnostics
```yaml
- name: Wait for server health check
  run: |
    max_attempts=30
    attempt=0

    while [ $attempt -lt $max_attempts ]; do
      # Check if server process is still running
      if [ -f /tmp/server.pid ]; then
        pid=$(cat /tmp/server.pid)
        if ! ps -p $pid > /dev/null 2>&1; then
          echo "ERROR: Server process $pid died unexpectedly"
          exit 1
        fi
      fi

      # Try health check
      if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "Server is ready after $((attempt * 2)) seconds"
        exit 0
      fi

      echo "Attempt $((attempt + 1))/$max_attempts: Waiting..."
      sleep 2
      attempt=$((attempt + 1))
    done
```

3. **Cleanup Step**: Always runs to prevent orphan processes
```yaml
- name: Cleanup server
  if: always()
  run: |
    if [ -f /tmp/server.pid ]; then
      pid=$(cat /tmp/server.pid)
      echo "Stopping server process $pid"
      kill $pid 2>/dev/null || true
      rm /tmp/server.pid
    fi
```

### Diagnostics on Failure

When the server fails to start, the workflow now captures:
- Server process status (if still running)
- Port 3000 binding status
- Attempt count and elapsed time

This information helps debug CI failures without needing to reproduce locally.

## Files Changed

- `.github/workflows/visual.yml` - Improved health check and cleanup

## Benefits

1. **Faster Failure Detection**: Immediately detect if server process dies
2. **Better Debugging**: Diagnostic output when startup fails
3. **Reliable Cleanup**: Always kills server process after tests
4. **Configurable Timeout**: 30 attempts × 2 seconds = 60 second max wait

## Definition of Done

- [x] Custom health check loop replaces wait-on
- [x] PID tracking for process management
- [x] Retry logic with configurable attempts
- [x] Diagnostic output on failure
- [x] Cleanup step always runs
- [x] Workflow file updated with DM-11.15 reference
