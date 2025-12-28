# Getting Started with HYVVE

This guide walks you through setting up the HYVVE platform for local development.

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | JavaScript runtime |
| Python | 3.12+ | AgentOS runtime |
| Docker | Latest | Container runtime |
| Docker Compose | Latest | Multi-container orchestration |
| pnpm | 9+ | Package manager |
| Git | Latest | Version control |

### Verify Installation

```bash
node --version    # Should be v20.x or higher
python --version  # Should be 3.12.x or higher
docker --version  # Should be 24.x or higher
pnpm --version    # Should be 9.x or higher
```

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/CSmithy89/ai-business-hub.git
cd ai-business-hub
```

---

## Step 2: Set Node.js Version

The project includes an `.nvmrc` file for Node.js version management:

```bash
# If using nvm
nvm use

# Or manually ensure Node.js 20+
node --version
```

---

## Step 3: Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

This installs dependencies for:
- `apps/web` - Next.js frontend
- `apps/api` - NestJS backend
- `packages/db` - Prisma database package
- `packages/ui` - Shared UI components
- `packages/shared` - Shared TypeScript types
- `packages/config` - Shared configuration

---

## Step 4: Environment Configuration

### Create Environment Files

```bash
# Copy the example environment file
cp .env.example .env.local
```

### Configure Required Variables

Edit `.env.local` with your values:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hyvve?schema=public"

# Authentication
BETTER_AUTH_SECRET="your-secure-secret-at-least-32-characters-long"
BETTER_AUTH_URL="http://localhost:3000"

# Encryption (CRITICAL: base64-encoded 32-byte key)
ENCRYPTION_MASTER_KEY="<openssl rand -base64 32>"

# Redis
REDIS_URL="redis://localhost:6379"

# Email (for verification/invitations)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
EMAIL_FROM="noreply@yourdomain.com"

# OAuth (optional - see OAuth Provider Setup below)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
```

### Generate Secure Keys

```bash
# Generate BETTER_AUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_MASTER_KEY
openssl rand -base64 32
```

### Validate Environment

Run the repository environment validator before starting services:

```bash
node scripts/validate-env.js
```

---

## Step 5: Start Infrastructure

### Using Docker Compose

```bash
# Start PostgreSQL and Redis
docker compose -f docker/docker-compose.yml up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### Verify Services

```bash
# Check containers are running
docker compose -f docker/docker-compose.yml ps

# Test PostgreSQL connection
docker compose -f docker/docker-compose.yml exec postgres pg_isready

# Test Redis connection
docker compose -f docker/docker-compose.yml exec redis redis-cli ping
```

---

## Step 6: Initialize Database

### Generate Prisma Client

```bash
pnpm --filter @hyvve/db db:generate
```

### Run Migrations

```bash
pnpm --filter @hyvve/db db:migrate
```

### Seed Database (Optional)

```bash
pnpm --filter @hyvve/db seed
```

---

## Step 7: Build Packages

```bash
# Build all packages with Turborepo
pnpm build
```

---

## Step 8: Start Development Servers

### Option A: Start All Services

```bash
pnpm run dev
```

This starts:
- Next.js frontend on http://localhost:3000
- NestJS API on http://localhost:3001
- AgentOS on http://localhost:8000

### Option B: Start Services Individually

```bash
# Terminal 1: Frontend
pnpm --filter @hyvve/web dev

# Terminal 2: Backend API
pnpm --filter @hyvve/api dev

# Terminal 3: AgentOS (Python) - from project root
cd agents && python -m uvicorn main:app --reload --port 8000
```

---

## Step 9: Verify Setup

### Check Frontend

Open http://localhost:3000 in your browser. You should see the HYVVE login page.

### Check API Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{ "status": "ok" }
```

### Check AgentOS

```bash
curl http://localhost:8000/health
```

---

## Common Development Tasks

### Type Checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint
```

### Running Tests

```bash
pnpm test
```

### Database Operations

```bash
# Create new migration
pnpm --filter @hyvve/db db:migrate --name your_migration_name

# Reset database
pnpm --filter @hyvve/db db:reset

# Open Prisma Studio
pnpm --filter @hyvve/db db:studio
```

### Clean Build Artifacts

```bash
pnpm clean
```

---

## Project Structure Overview

```
/
├── apps/
│   ├── web/                 # Next.js 15 frontend
│   │   ├── src/app/         # App Router pages
│   │   ├── src/components/  # React components
│   │   └── src/lib/         # Utilities and hooks
│   └── api/                 # NestJS backend
│       ├── src/modules/     # Feature modules
│       └── src/common/      # Shared utilities
│
├── agents/                  # Python AgentOS (Agno framework)
│   ├── main.py              # FastAPI entry point
│   ├── platform/            # Core orchestration agents
│   ├── pm/                  # Project Management agents (Navi, Sage, Chrono)
│   ├── knowledge/           # Knowledge Base agents (Scribe)
│   ├── crm/                 # CRM module agents
│   ├── branding/            # Brand module agents
│   ├── planning/            # Planning module agents
│   └── validation/          # Validation agents
│
├── packages/
│   ├── db/                  # Prisma schema + migrations
│   ├── ui/                  # Shared React components
│   ├── shared/              # Shared TypeScript types
│   └── config/              # Shared configuration
│
├── docs/                    # Documentation
│   └── modules/             # Module-specific documentation
│       ├── bm-pm/           # Project Management (Core-PM)
│       ├── bm-dm/           # Dynamic Module System
│       └── ...              # Other modules
├── docker/                  # Docker configuration
└── .github/                 # GitHub workflows
```

---

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker compose -f docker/docker-compose.yml ps

# Restart if needed
docker compose -f docker/docker-compose.yml restart postgres

# Check connection string in .env.local
```

### Prisma Client Not Found

```bash
# Regenerate Prisma client
pnpm --filter @hyvve/db db:generate
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Redis Connection Failed

```bash
# Check Redis is running
docker compose -f docker/docker-compose.yml ps

# Test connection
docker compose -f docker/docker-compose.yml exec redis redis-cli ping
```

### Python Dependencies (AgentOS)

```bash
cd agents
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

---

## OAuth Provider Setup (Optional)

To enable social login (Google, GitHub, Microsoft), you need to create OAuth applications with each provider.

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret to `.env.local`

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Set Homepage URL: `http://localhost:3000`
4. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
5. Copy Client ID and Client Secret to `.env.local`

### Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **App registrations** > **New registration**
3. Set Redirect URI: `http://localhost:3000/api/auth/callback/microsoft`
4. Under **Certificates & secrets**, create a new client secret
5. Copy Application (client) ID and Client Secret to `.env.local`

---

## Running Tests

### Unit Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time)
pnpm --filter @hyvve/web exec playwright install

# Run E2E tests
pnpm --filter @hyvve/web test:e2e

# Run E2E tests with UI
pnpm --filter @hyvve/web test:e2e:ui
```

### Test Files

| Location | Type | Description |
|----------|------|-------------|
| `apps/web/src/__tests__/` | Unit/Integration | API and utility tests |
| `apps/web/src/store/__tests__/` | Unit | Zustand store tests |
| `apps/web/src/lib/__tests__/` | Unit | Library function tests |
| `apps/web/tests/e2e/` | E2E | Playwright browser tests |

---

## Next Steps

Once your development environment is set up:

1. **Explore the codebase** - Start with `apps/web/src/app/page.tsx`
2. **Read the architecture** - See [architecture.md](architecture.md)
3. **Check workflow status** - See `docs/bmm-workflow-status.yaml` for current development status
4. **Review module docs** - See `docs/modules/` for module-specific documentation
5. **Review runbooks** - See `docs/runbooks/` for operational procedures
6. **Contribute** - Follow [CONTRIBUTING.md](../CONTRIBUTING.md)

### Current Development Status

| Phase | Status | Details |
|-------|--------|---------|
| Foundation | Complete | 17 epics, 190 stories, 541 points |
| Core-PM | Complete | 16 epics (PM-01 to PM-12, KB-01 to KB-04), 61 stories |
| bm-dm | Ready | Dynamic Module System, 6 epics, 38 stories |

See `docs/modules/bm-pm/README.md` for Core-PM documentation and `docs/modules/bm-dm/README.md` for the next sprint.

---

## Getting Help

- Check [Troubleshooting](#troubleshooting) above
- Review documentation in `docs/` folder
- Open an issue on GitHub

---

*Last updated: 2025-12-28*
*Foundation Phase Complete (17 Epics) | Core-PM Complete (16 Epics) | Ready for bm-dm*
