# Docker Development Environment

This directory contains the Docker Compose configuration for local development of the HYVVE Platform.

## Overview

The Docker environment provides all necessary backend services for local development:

- **PostgreSQL 16**: Primary database (port 5432)
- **Redis 7**: Cache, queue, and event streaming (port 6379)
- **AgentOS**: Python/FastAPI AI agent runtime (port 7777)
- **pgAdmin**: Database management UI (port 5050)

## Prerequisites

- [Docker Desktop](https://docs.docker.com/get-docker/) 20.x or higher
- Docker Compose V2 (included with Docker Desktop)
- 4GB+ RAM allocated to Docker
- 10GB+ disk space

## Quick Start

### 1. Start All Services

```bash
# From project root
pnpm docker:up

# Or directly with docker compose
docker compose -f docker/docker-compose.yml up -d
```

### 2. Verify Services Are Running

```bash
pnpm docker:ps

# Or directly
docker compose -f docker/docker-compose.yml ps
```

Expected output:
```
NAME              IMAGE                  STATUS         PORTS
hyvve_postgres    postgres:16-alpine     Up (healthy)   0.0.0.0:5432->5432/tcp
hyvve_redis       redis:7-alpine         Up (healthy)   0.0.0.0:6379->6379/tcp
hyvve_agentos     agents-agentos         Up             0.0.0.0:7777->7777/tcp
hyvve_pgadmin     dpage/pgadmin4:latest  Up             0.0.0.0:5050->80/tcp
```

### 3. View Logs

```bash
# All services
pnpm docker:logs

# Specific service
docker compose -f docker/docker-compose.yml logs -f postgres
docker compose -f docker/docker-compose.yml logs -f agentos
```

### 4. Stop Services

```bash
# Stop containers (preserves data)
pnpm docker:down

# Stop and remove volumes (fresh start)
pnpm docker:reset
```

## Service Details

### PostgreSQL

**Connection Details:**
- Host: `localhost`
- Port: `5432`
- Database: `hyvve`
- Username: `postgres`
- Password: `postgres_dev_password`

**Connection String (for .env.local):**
```env
DATABASE_URL="postgresql://postgres:postgres_dev_password@localhost:5432/hyvve"
DIRECT_URL="postgresql://postgres:postgres_dev_password@localhost:5432/hyvve"
```

**Connecting from Host:**
```bash
# Using psql
psql -h localhost -p 5432 -U postgres -d hyvve

# Using Docker exec
docker compose exec postgres psql -U postgres -d hyvve
```

**Data Persistence:**
- Data is stored in the `postgres_data` Docker volume
- Persists across container restarts
- Only removed with `docker compose down -v`

### Redis

**Connection Details:**
- Host: `localhost`
- Port: `6379`
- No password (development only)

**Connection String (for .env.local):**
```env
REDIS_URL="redis://localhost:6379"
```

**Connecting from Host:**
```bash
# Using redis-cli
redis-cli -h localhost -p 6379 ping

# Using Docker exec
docker compose exec redis redis-cli ping
```

**Data Persistence:**
- AOF (Append-Only File) enabled
- Data is stored in the `redis_data` Docker volume

### AgentOS

**Connection Details:**
- Host: `localhost`
- Port: `7777`

**Health Check:**
```bash
curl http://localhost:7777/health
```

**Environment Variables:**
```env
NEXT_PUBLIC_AGENTOS_URL="http://localhost:7777"
```

**Note:** This is a placeholder service for Story 00-5. Full implementation with Agno framework, SQLAlchemy, and tenant middleware will be completed in Story 00-7.

### pgAdmin

**Access:**
- URL: http://localhost:5050
- Email: `dev@hyvve.local`
- Password: `pgadmin_dev_password`

**Connecting to PostgreSQL:**
1. Open http://localhost:5050
2. Login with credentials above
3. Right-click "Servers" → "Register" → "Server"
4. General tab: Name = "HYVVE Local"
5. Connection tab:
   - Host: `postgres` (service name, not localhost)
   - Port: `5432`
   - Database: `hyvve`
   - Username: `postgres`
   - Password: `postgres_dev_password`

**Alternative:** Use Prisma Studio instead (`pnpm db:studio`)

## Internal Networking

Services communicate with each other using the `hyvve_network` bridge network.

**Service-to-Service URLs:**
- PostgreSQL: `postgres:5432` (from NestJS, AgentOS)
- Redis: `redis:6379` (from NestJS, AgentOS)

**External Access (from Host):**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- AgentOS: `localhost:7777`
- pgAdmin: `localhost:5050`

## Data Management

### Viewing Volumes

```bash
docker volume ls | grep hyvve
```

Output:
```
docker_postgres_data
docker_redis_data
docker_pgadmin_data
```

### Backing Up PostgreSQL

```bash
# Create backup
docker compose exec postgres pg_dump -U postgres hyvve > backup.sql

# Restore backup
cat backup.sql | docker compose exec -T postgres psql -U postgres -d hyvve
```

### Fresh Start (Remove All Data)

```bash
pnpm docker:reset

# Or manually
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

## Troubleshooting

### Port Conflicts

**Problem:** Port already in use (5432, 6379, 7777, 5050)

**Solution:**
1. Find conflicting process:
   ```bash
   # Linux/Mac
   lsof -i :5432

   # Windows
   netstat -ano | findstr :5432
   ```
2. Stop conflicting service or change port in `docker-compose.yml`
3. Update connection strings in `.env.local`

### Permission Issues (Linux)

**Problem:** PostgreSQL can't write to volume

**Solution:**
```bash
# Check volume ownership
docker compose exec postgres ls -la /var/lib/postgresql/data

# Ensure Docker daemon has correct permissions
sudo usermod -aG docker $USER
```

### WSL2 on Windows

**Problem:** Slow performance or networking issues

**Solution:**
- Ensure Docker Desktop is using WSL2 backend
- Store project files in WSL2 filesystem (not `/mnt/c/`)
- Allocate sufficient resources in Docker Desktop settings

### M1/M2 Mac Compatibility

**Problem:** pgAdmin or other services won't start on ARM Macs

**Solution:**
Uncomment the platform line in docker-compose.yml:
```yaml
pgadmin:
  platform: linux/amd64  # Uncomment this line
```

### Container Won't Start

**Problem:** Service fails to start or is unhealthy

**Solution:**
```bash
# Check logs
pnpm docker:logs

# Check specific service
docker compose logs agentos

# Restart specific service
docker compose restart agentos

# Rebuild service (if code changed)
docker compose up -d --build agentos
```

### Database Connection Failed

**Problem:** Can't connect to PostgreSQL from apps/api or Prisma

**Solution:**
1. Verify containers are running: `pnpm docker:ps`
2. Check DATABASE_URL in `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres_dev_password@localhost:5432/hyvve"
   ```
3. Test connection manually:
   ```bash
   psql -h localhost -p 5432 -U postgres -d hyvve
   ```

### AgentOS Build Fails

**Problem:** Docker build fails for AgentOS

**Solution:**
1. Check Dockerfile syntax
2. Verify requirements.txt is valid
3. Rebuild from scratch:
   ```bash
   docker compose build --no-cache agentos
   docker compose up -d agentos
   ```

### Data Loss

**Problem:** Data disappeared after restart

**Cause:** Used `docker compose down -v` which removes volumes

**Prevention:**
- Use `pnpm docker:down` (preserves volumes)
- Only use `pnpm docker:reset` when intentionally starting fresh

**Recovery:**
1. Re-run Prisma migrations: `pnpm db:migrate`
2. Restore from backup (if available)

## Platform-Specific Notes

### Windows

- Use Docker Desktop with WSL2 backend
- Store project in WSL2 filesystem for better performance
- Use PowerShell or WSL terminal for commands

### macOS

- Use Docker Desktop for Mac
- M1/M2 users: May need to add `platform: linux/amd64` for some services
- Allocate 4GB+ RAM in Docker Desktop preferences

### Linux

- Install Docker Engine + Docker Compose plugin
- Add user to docker group: `sudo usermod -aG docker $USER`
- No need for Docker Desktop

## Development Workflow

### Initial Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd Ai\ Bussiness\ Hub

# 2. Install dependencies
pnpm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Update .env.local with Docker URLs
# Edit DATABASE_URL and REDIS_URL to use localhost

# 5. Start Docker services
pnpm docker:up

# 6. Run database migrations
pnpm db:migrate

# 7. Start development servers
pnpm dev
```

### Daily Development

```bash
# Start services
pnpm docker:up

# Start dev servers
pnpm dev

# Work on code...

# View logs if needed
pnpm docker:logs

# Stop services at end of day (preserves data)
pnpm docker:down
```

### Weekly Cleanup

```bash
# Fresh start with clean database
pnpm docker:reset

# Re-run migrations
pnpm db:migrate
```

## Available Scripts

Add these to root `package.json`:

```json
{
  "scripts": {
    "docker:up": "docker compose -f docker/docker-compose.yml up -d",
    "docker:down": "docker compose -f docker/docker-compose.yml down",
    "docker:logs": "docker compose -f docker/docker-compose.yml logs -f",
    "docker:reset": "docker compose -f docker/docker-compose.yml down -v && docker compose -f docker/docker-compose.yml up -d",
    "docker:ps": "docker compose -f docker/docker-compose.yml ps"
  }
}
```

## Security Notes

**Development Credentials:**
- PostgreSQL: `postgres_dev_password`
- pgAdmin: `pgadmin_dev_password`

**WARNING:** These are intentionally weak passwords for local development only. **Never use these in production.**

Production uses:
- Supabase for PostgreSQL (strong auto-generated credentials)
- Upstash for Redis (API key authentication)
- Environment variable encryption for sensitive data

## Next Steps

1. **Story 00-7**: Implement full AgentOS runtime
   - Add Agno framework
   - Add SQLAlchemy ORM
   - Add tenant middleware
   - Connect to Control Plane (os.agno.com)

2. **Epic 01**: Authentication
   - Better Auth integration
   - JWT token generation
   - Session management

3. **Epic 03**: Multi-tenancy
   - Row-level security (RLS)
   - Tenant isolation
   - Workspace switching

## References

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)
- [pgAdmin Docker Image](https://hub.docker.com/r/dpage/pgadmin4)
- [HYVVE Architecture](../docs/architecture.md)
- [HYVVE Tech Spec](../docs/sprint-artifacts/tech-spec-epic-00.md)
