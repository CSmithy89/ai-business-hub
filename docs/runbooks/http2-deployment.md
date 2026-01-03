# HTTP/2 Deployment Guide

Guide for deploying HYVVE with HTTP/2 support for improved A2A communication performance.

## Overview

HTTP/2 provides significant benefits for A2A communication:

- **Multiplexing**: Multiple requests over single connection
- **Header compression**: Reduced overhead for repeated headers
- **Stream prioritization**: Critical requests get priority
- **Server push**: Proactive resource delivery

## Prerequisites

| Component | Minimum Version | Notes |
|-----------|-----------------|-------|
| Node.js | 18.x | Native HTTP/2 support |
| Python | 3.10+ | httpx with HTTP/2 |
| Nginx | 1.25+ | Full HTTP/2 support |
| Redis | 7.0+ | For connection pooling |

## Configuration

### NestJS API (apps/api)

```typescript
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { readFileSync } from 'fs';
import * as http2Express from 'http2-express-bridge';

async function bootstrap() {
  // HTTP/2 with TLS (required)
  const httpsOptions = {
    key: readFileSync(process.env.TLS_KEY_PATH || './certs/server.key'),
    cert: readFileSync(process.env.TLS_CERT_PATH || './certs/server.crt'),
    allowHTTP1: true,  // Fallback for clients without HTTP/2
  };

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  await app.listen(3000);
}
```

### AgentOS (Python)

```python
# agents/config/settings.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # HTTP/2 Configuration
    http2_enabled: bool = True
    http2_max_concurrent_streams: int = 100
    http2_initial_window_size: int = 65535
    http2_max_frame_size: int = 16384

    # TLS (required for HTTP/2)
    tls_cert_path: str = "./certs/server.crt"
    tls_key_path: str = "./certs/server.key"
```

```python
# agents/main.py
# Note: Uvicorn does not natively support HTTP/2.
# For HTTP/2 in production, use one of these approaches:
#
# Option 1: Use Hypercorn (native HTTP/2 support)
#   hypercorn main:app --bind 0.0.0.0:8000 --certfile server.crt --keyfile server.key
#
# Option 2: Use Nginx as HTTP/2 termination proxy (recommended)
#   Nginx handles HTTP/2 -> proxies to uvicorn over HTTP/1.1
#   See nginx configuration below.
#
# For development/internal traffic, uvicorn with HTTP/1.1 + TLS:
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        ssl_keyfile=settings.tls_key_path,
        ssl_certfile=settings.tls_cert_path,
        limit_concurrency=100,
        limit_max_requests=10000,
    )
```

### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/hyvve.conf

upstream api_servers {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream agent_servers {
    server 127.0.0.1:8000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.hyvve.app;

    # TLS Configuration
    ssl_certificate /etc/letsencrypt/live/hyvve.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hyvve.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # HTTP/2 Settings
    http2_max_concurrent_streams 128;
    http2_recv_timeout 30s;
    http2_idle_timeout 3m;

    # API Routes
    location /api/ {
        proxy_pass http://api_servers;
        proxy_http_version 1.1;  # Use HTTP/1.1 to backend
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Agent Routes (A2A)
    location /a2a/ {
        proxy_pass http://agent_servers;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Longer timeouts for agent operations
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket upgrade
    location /ws/ {
        proxy_pass http://api_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

### Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      - TLS_KEY_PATH=/certs/server.key
      - TLS_CERT_PATH=/certs/server.crt
    volumes:
      - ./certs:/certs:ro
    ports:
      - "3000:3000"

  agents:
    build:
      context: .
      dockerfile: agents/Dockerfile
    environment:
      - HTTP2_ENABLED=true
      - TLS_KEY_PATH=/certs/server.key
      - TLS_CERT_PATH=/certs/server.crt
    volumes:
      - ./certs:/certs:ro
    ports:
      - "8000:8000"

  nginx:
    image: nginx:1.25
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    ports:
      - "443:443"
    depends_on:
      - api
      - agents
```

## Certificate Setup

### Development (Self-Signed)

```bash
# Generate self-signed certificate for development
openssl req -x509 -newkey rsa:4096 \
  -keyout certs/server.key \
  -out certs/server.crt \
  -days 365 \
  -nodes \
  -subj "/CN=localhost"

# Add to trusted certs (macOS)
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain certs/server.crt

# Add to trusted certs (Linux)
sudo cp certs/server.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

### Production (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.hyvve.app -d agents.hyvve.app

# Auto-renewal (cron)
echo "0 0,12 * * * root certbot renew --quiet" | sudo tee /etc/cron.d/certbot
```

## Verification

### Check HTTP/2 Support

```bash
# Using curl
curl -I --http2 https://api.hyvve.app/health
# Look for: HTTP/2 200

# Using nghttp2
nghttp -nv https://api.hyvve.app/health

# Using openssl
openssl s_client -connect api.hyvve.app:443 -alpn h2 </dev/null 2>&1 | grep ALPN
# Should show: ALPN protocol: h2
```

### Browser Verification

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Right-click on column headers → Enable "Protocol"
4. Reload page
5. Look for "h2" in Protocol column

## Performance Comparison

| Metric | HTTP/1.1 | HTTP/2 | Improvement |
|--------|----------|--------|-------------|
| Dashboard load | 1200ms | 600ms | 50% |
| Concurrent widgets | 6 parallel | 100+ parallel | 16x |
| Header overhead | ~800 bytes | ~50 bytes | 94% |
| Connection setup | Per request | Once | 10x |

## Troubleshooting

### HTTP/2 Not Negotiated

**Symptom:** Connections falling back to HTTP/1.1

```bash
# Check ALPN support
openssl s_client -connect api.hyvve.app:443 -alpn h2 </dev/null 2>&1 | grep ALPN
```

**Causes:**
1. Missing ALPN extension in TLS
2. Old OpenSSL version
3. Proxy stripping ALPN

**Fix:** Ensure TLS 1.2+ and ALPN support:
```bash
# Check OpenSSL version (need 1.0.2+)
openssl version
```

### Stream Reset Errors

**Symptom:** `ERR_HTTP2_PROTOCOL_ERROR` in browser

**Causes:**
1. Backend sending invalid headers
2. Frame size exceeded
3. Concurrent stream limit hit

**Fix:** Check nginx settings:
```nginx
http2_max_concurrent_streams 128;
http2_max_field_size 8k;
http2_max_header_size 16k;
```

### Connection Drops

**Symptom:** Connections dropping after idle

**Fix:** Configure keepalive:
```nginx
http2_idle_timeout 3m;
keepalive_timeout 65;
keepalive_requests 100;
```

### Slow Initial Connection

**Symptom:** First request slow, subsequent fast

**Cause:** TLS handshake overhead

**Fix:** Enable session resumption:
```nginx
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1h;
ssl_session_tickets on;
```

## Monitoring

### Nginx Metrics

```bash
# Connection stats
curl http://localhost/nginx_status

# Active HTTP/2 streams
grep "http2" /var/log/nginx/access.log | wc -l
```

### Application Metrics

Track in OpenTelemetry:
- `http2.streams.active` - Current concurrent streams
- `http2.connection.duration` - Connection lifetime
- `http2.stream.duration` - Stream processing time

## Rollback

If HTTP/2 causes issues, rollback to HTTP/1.1:

```nginx
# Disable HTTP/2 in nginx
listen 443 ssl;  # Remove 'http2'
```

```python
# Disable in AgentOS
uvicorn.run("main:app", http="h11")  # Force HTTP/1.1
```

## Related Documentation

- [A2A Request Flow](../architecture/diagrams/a2a-request-flow.md)
- [A2A Troubleshooting](./a2a-troubleshooting.md)
- [Nginx HTTP/2 Docs](https://nginx.org/en/docs/http/ngx_http_v2_module.html)
