# FlowMatic - Environment Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Check Command |
|------|---------|---------------|
| Node.js | 20.x LTS | `node --version` |
| npm | 10.x | `npm --version` |
| Docker | 24.x | `docker --version` |
| Docker Compose | 2.x | `docker compose version` |
| Git | 2.x | `git --version` |

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/flowmatic.git
cd flowmatic

# 2. Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Start Docker services
docker compose up -d

# 4. Install dependencies
npm install

# 5. Run database migrations
npm run db:migrate

# 6. Seed the database
npm run db:seed

# 7. Start development servers
npm run dev
```

Your app should now be running at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- n8n: http://localhost:5678

---

## Detailed Setup

### Step 1: Project Structure

After cloning, your project structure should look like:

```
flowmatic/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── src/
│   │   ├── package.json
│   │   └── .env.local
│   └── api/                 # Express.js backend
│       ├── src/
│       ├── package.json
│       └── .env
├── packages/
│   ├── database/            # Prisma schema
│   │   └── prisma/
│   ├── n8n-client/          # n8n API wrapper
│   └── shared/              # Shared types
├── templates/               # n8n workflow templates
├── docker/
│   ├── docker-compose.yml
│   └── nginx/
├── .env
├── package.json
└── turbo.json
```

### Step 2: Environment Variables

#### Root `.env` (Docker services)

```bash
# Database
POSTGRES_USER=flowmatic
POSTGRES_PASSWORD=flowmatic_dev_password
POSTGRES_DB=flowmatic

# n8n Database (separate)
N8N_POSTGRES_USER=n8n
N8N_POSTGRES_PASSWORD=n8n_dev_password
N8N_POSTGRES_DB=n8n

# Redis
REDIS_PASSWORD=redis_dev_password

# n8n
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=admin_password
N8N_ENCRYPTION_KEY=your-n8n-encryption-key-min-32-chars
```

#### Backend `apps/api/.env`

```bash
# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://flowmatic:flowmatic_dev_password@localhost:5432/flowmatic

# Redis
REDIS_URL=redis://:redis_dev_password@localhost:6379

# n8n
N8N_API_URL=http://localhost:5678/api/v1
N8N_API_KEY=                    # Set after n8n setup

# JWT
JWT_SECRET=your-jwt-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Encryption (for credentials)
ENCRYPTION_KEY=your-32-byte-encryption-key-here

# OAuth Providers (optional for MVP)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback

SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_CALLBACK_URL=http://localhost:3001/api/v1/credentials/oauth/slack/callback

# Email (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@flowmatic.local
```

#### Frontend `apps/web/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_NAME=FlowMatic
NEXT_PUBLIC_GOOGLE_CLIENT_ID=        # Same as backend
```

### Step 3: Docker Services

#### docker-compose.yml

```yaml
version: '3.8'

services:
  # Main PostgreSQL database
  postgres:
    image: postgres:15-alpine
    container_name: flowmatic-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  # n8n PostgreSQL database (separate)
  postgres-n8n:
    image: postgres:15-alpine
    container_name: flowmatic-postgres-n8n
    environment:
      POSTGRES_USER: ${N8N_POSTGRES_USER}
      POSTGRES_PASSWORD: ${N8N_POSTGRES_PASSWORD}
      POSTGRES_DB: ${N8N_POSTGRES_DB}
    ports:
      - "5433:5432"
    volumes:
      - postgres_n8n_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${N8N_POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: flowmatic-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # n8n workflow engine
  n8n:
    image: n8nio/n8n:latest
    container_name: flowmatic-n8n
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres-n8n
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=${N8N_POSTGRES_DB}
      - DB_POSTGRESDB_USER=${N8N_POSTGRES_USER}
      - DB_POSTGRESDB_PASSWORD=${N8N_POSTGRES_PASSWORD}
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_BASIC_AUTH_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_BASIC_AUTH_PASSWORD}
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - WEBHOOK_URL=http://localhost:5678/
      - GENERIC_TIMEZONE=UTC
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      postgres-n8n:
        condition: service_healthy

volumes:
  postgres_data:
  postgres_n8n_data:
  redis_data:
  n8n_data:
```

#### Start services:

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f n8n

# Stop services
docker compose down
```

### Step 4: n8n API Key Setup

After n8n is running:

1. Open http://localhost:5678
2. Login with your basic auth credentials
3. Go to **Settings** → **API** (or **Personal API Keys**)
4. Create a new API key
5. Copy the key to `apps/api/.env` as `N8N_API_KEY`

Test the connection:

```bash
curl -H "X-N8N-API-KEY: your-api-key" http://localhost:5678/api/v1/workflows
# Should return: {"data":[],"nextCursor":null}
```

### Step 5: Database Setup

```bash
# Generate Prisma client
cd packages/database
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed initial data (categories, apps)
npx prisma db seed

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Step 6: Install Dependencies

Using npm workspaces:

```bash
# From root directory
npm install

# Or install specific workspace
npm install -w apps/web
npm install -w apps/api
```

### Step 7: Run Development Servers

```bash
# Run both frontend and backend
npm run dev

# Or run individually:
npm run dev -w apps/web    # Frontend on :3000
npm run dev -w apps/api    # Backend on :3001
```

---

## Verification Checklist

After setup, verify each service:

### ✅ PostgreSQL
```bash
psql postgresql://flowmatic:flowmatic_dev_password@localhost:5432/flowmatic -c "SELECT 1;"
# Should return: 1
```

### ✅ Redis
```bash
redis-cli -a redis_dev_password ping
# Should return: PONG
```

### ✅ n8n
```bash
curl -H "X-N8N-API-KEY: your-key" http://localhost:5678/api/v1/workflows
# Should return: {"data":[],...}
```

### ✅ Backend API
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### ✅ Frontend
Open http://localhost:3000 in browser
- Should see the FlowMatic homepage

---

## Common Issues

### Issue: Port already in use

```bash
# Find what's using the port
lsof -i :5432

# Kill it or change the port in docker-compose.yml
```

### Issue: n8n can't connect to database

```bash
# Check postgres-n8n is healthy
docker compose ps

# Check logs
docker compose logs postgres-n8n
```

### Issue: "ENCRYPTION_KEY must be set"

Generate a proper encryption key:

```bash
# Generate 32-byte key
openssl rand -hex 32
```

### Issue: Prisma migration fails

```bash
# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Or manually connect and check
psql $DATABASE_URL
```

### Issue: n8n API returns 401

- Check your API key is correct in `.env`
- Ensure n8n has API keys enabled
- Try regenerating the key

---

## Development Workflow

### Running Tests

```bash
# All tests
npm test

# Specific workspace
npm test -w apps/api

# Watch mode
npm test -- --watch
```

### Database Changes

```bash
# Create a new migration
npx prisma migrate dev --name add_new_field

# Apply migrations (production)
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

### Adding New Dependencies

```bash
# Add to specific workspace
npm install lodash -w apps/api

# Add dev dependency
npm install -D @types/lodash -w apps/api

# Add to shared packages
npm install zod -w packages/shared
```

### Code Formatting

```bash
# Format all files
npm run format

# Check formatting
npm run format:check

# Lint
npm run lint
```

---

## OAuth Provider Setup (Optional)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Add authorized redirect URI: `http://localhost:3001/api/v1/auth/google/callback`
6. Copy Client ID and Secret to `.env`

### Slack OAuth

1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new app
3. Go to OAuth & Permissions
4. Add redirect URL: `http://localhost:3001/api/v1/credentials/oauth/slack/callback`
5. Add scopes: `chat:write`, `channels:read`, `users:read`
6. Copy Client ID and Secret to `.env`

---

## Production Notes

For production deployment:

1. Use strong, random secrets for all keys
2. Enable SSL/TLS
3. Use managed database services
4. Set up proper logging
5. Configure rate limiting
6. Set up monitoring (health checks)
7. Use environment-specific configs

See `docs/DEPLOYMENT.md` for full production setup.
