# FlowMatic - Technical Specification

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     Next.js 14 Application                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │    │
│  │  │  Auth    │ │ Catalog  │ │Credential│ │Dashboard │ │ Settings │  │    │
│  │  │  Pages   │ │  Pages   │ │  Manager │ │  Pages   │ │  Pages   │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS/REST
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     Express.js API Server                           │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │    │
│  │  │ Auth Service │ │Template Svc  │ │ n8n Proxy    │                 │    │
│  │  │ (JWT/OAuth)  │ │ (CRUD)       │ │ Service      │                 │    │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                 │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │    │
│  │  │ Credential   │ │ Workflow     │ │ Webhook      │                 │    │
│  │  │ Service      │ │ Service      │ │ Handler      │                 │    │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                               │
                    │                               │
          ┌─────────┴─────────┐           ┌────────┴────────┐
          ▼                   ▼           ▼                  │
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│   PostgreSQL     │ │    Redis     │ │   n8n Instance   │   │
│   (Main DB)      │ │   (Cache/    │ │   (Headless)     │   │
│                  │ │    Queue)    │ │                  │   │
└──────────────────┘ └──────────────┘ └──────────────────┘   │
                                              │              │
                                              │              │
                                      ┌───────┴──────┐       │
                                      ▼              ▼       │
                              ┌─────────────┐ ┌──────────┐   │
                              │ PostgreSQL  │ │ External │◄──┘
                              │ (n8n DB)    │ │  APIs    │
                              └─────────────┘ └──────────┘
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework with App Router |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | Latest | UI components |
| React Query | 5.x | Server state management |
| Zustand | 4.x | Client state management |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Schema validation |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x LTS | Runtime |
| Express.js | 4.x | API framework |
| TypeScript | 5.x | Type safety |
| Prisma | 5.x | ORM |
| Passport.js | 0.7.x | Authentication |
| jsonwebtoken | 9.x | JWT handling |
| bcrypt | 5.x | Password hashing |
| node-cron | 3.x | Scheduling |

### Infrastructure

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 15.x | Primary database |
| Redis | 7.x | Caching & job queue |
| n8n | 1.x | Workflow execution engine |
| Docker | 24.x | Containerization |
| Docker Compose | 2.x | Local orchestration |
| nginx | 1.25.x | Reverse proxy |

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │    Credential   │       │    Template     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │       │ id (PK)         │
│ email           │  │    │ user_id (FK)    │──┐    │ slug            │
│ password_hash   │  │    │ provider        │  │    │ name            │
│ name            │  │    │ credentials_enc │  │    │ description     │
│ avatar_url      │  │    │ oauth_token_enc │  │    │ category        │
│ created_at      │  │    │ refresh_token   │  │    │ n8n_workflow    │
│ updated_at      │  │    │ expires_at      │  │    │ required_apps   │
└─────────────────┘  │    │ is_valid        │  │    │ icon_url        │
         │           │    │ created_at      │  │    │ popularity      │
         │           │    └─────────────────┘  │    │ created_at      │
         │           │                         │    └─────────────────┘
         │           │                         │             │
         │           └─────────────────────────┤             │
         │                                     │             │
         ▼                                     ▼             ▼
┌─────────────────┐       ┌─────────────────────────────────────────┐
│ UserWorkflow    │       │              Execution                  │
├─────────────────┤       ├─────────────────────────────────────────┤
│ id (PK)         │◄──────│ id (PK)                                 │
│ user_id (FK)    │       │ user_workflow_id (FK)                   │
│ template_id(FK) │       │ n8n_execution_id                        │
│ n8n_workflow_id │       │ status (success/error/running/waiting)  │
│ name            │       │ started_at                              │
│ status          │       │ finished_at                             │
│ is_active       │       │ error_message                           │
│ config_json     │       │ input_data                              │
│ created_at      │       │ output_data                             │
│ activated_at    │       │ created_at                              │
└─────────────────┘       └─────────────────────────────────────────┘
         │
         │
         ▼
┌─────────────────────────────────────┐
│    WorkflowCredentialMapping        │
├─────────────────────────────────────┤
│ id (PK)                             │
│ user_workflow_id (FK)               │
│ credential_id (FK)                  │
│ node_name                           │
│ created_at                          │
└─────────────────────────────────────┘
```

---

## n8n Integration Architecture

### How We Interact with n8n

FlowMatic uses n8n as a **headless execution engine**. Users never see the n8n interface.

```
┌─────────────────────────────────────────────────────────────────┐
│                    FlowMatic Backend                            │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   n8n Proxy Service                       │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │  │
│  │  │ Workflow    │  │ Credential  │  │ Execution   │       │  │
│  │  │ Manager     │  │ Manager     │  │ Monitor     │       │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │  │
│  │         │                │                │               │  │
│  │         └────────────────┼────────────────┘               │  │
│  │                          │                                │  │
│  └──────────────────────────┼────────────────────────────────┘  │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              │ n8n REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        n8n Instance                             │
│                                                                 │
│  API Endpoints Used:                                            │
│  ├── POST   /workflows          (Create workflow)               │
│  ├── GET    /workflows/:id      (Get workflow)                  │
│  ├── PUT    /workflows/:id      (Update workflow)               │
│  ├── DELETE /workflows/:id      (Delete workflow)               │
│  ├── POST   /workflows/:id/activate    (Activate)               │
│  ├── POST   /workflows/:id/deactivate  (Deactivate)             │
│  ├── GET    /executions         (List executions)               │
│  ├── GET    /executions/:id     (Get execution details)         │
│  ├── POST   /credentials        (Create credential)             │
│  ├── GET    /credentials/:id    (Get credential)                │
│  └── DELETE /credentials/:id    (Delete credential)             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Workflow Deployment Flow

```
User Clicks "Activate"
        │
        ▼
┌───────────────────────┐
│ 1. Load Template JSON │
│    from template DB   │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ 2. Get User's         │
│    Credentials        │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ 3. Inject Credentials │
│    into Workflow JSON │
│    (replace placeholders)
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ 4. POST to n8n        │
│    /workflows         │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ 5. POST to n8n        │
│    /workflows/:id/    │
│    activate           │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ 6. Store n8n workflow │
│    ID in our DB       │
└───────────┬───────────┘
            │
            ▼
      ✅ Workflow Active
```

---

## Security Architecture

### Credential Storage

```
┌─────────────────────────────────────────────────────────────────┐
│                     Credential Flow                             │
│                                                                 │
│  User Input                                                     │
│      │                                                          │
│      ▼                                                          │
│  ┌─────────────────┐                                            │
│  │ API Key or      │                                            │
│  │ OAuth Token     │                                            │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────────────────────────┐                    │
│  │         Encryption Layer                │                    │
│  │  ┌─────────────────────────────────┐    │                    │
│  │  │  AES-256-GCM Encryption         │    │                    │
│  │  │  Key: ENV.ENCRYPTION_KEY        │    │                    │
│  │  │  (32-byte key from env)         │    │                    │
│  │  └─────────────────────────────────┘    │                    │
│  └────────────────────┬────────────────────┘                    │
│                       │                                         │
│                       ▼                                         │
│  ┌─────────────────────────────────────────┐                    │
│  │            PostgreSQL                   │                    │
│  │  ┌─────────────────────────────────┐    │                    │
│  │  │ credentials table               │    │                    │
│  │  │ - credentials_encrypted (BYTEA) │    │                    │
│  │  │ - iv (BYTEA)                    │    │                    │
│  │  │ - auth_tag (BYTEA)              │    │                    │
│  │  └─────────────────────────────────┘    │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    JWT Authentication                          │
│                                                                │
│  Login Request                                                 │
│       │                                                        │
│       ▼                                                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │   Verify    │───▶│   Generate  │───▶│   Return    │        │
│  │   Password  │    │   JWT       │    │   Tokens    │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                              │                 │
│                                              ▼                 │
│                          ┌─────────────────────────────────┐   │
│                          │  Access Token (15 min)          │   │
│                          │  Refresh Token (7 days)         │   │
│                          └─────────────────────────────────┘   │
│                                                                │
│  API Request                                                   │
│       │                                                        │
│       ▼                                                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │   Extract   │───▶│   Verify    │───▶│   Attach    │        │
│  │   Token     │    │   JWT       │    │   User      │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Template Structure

### Template JSON Schema

```json
{
  "id": "uuid",
  "slug": "lead-to-slack-sheets",
  "name": "New Lead → Slack + Google Sheets",
  "description": "When a new lead comes in, send a Slack notification and log to Google Sheets",
  "longDescription": "Detailed markdown description...",
  "category": "lead-management",
  "subcategory": "notifications",
  "requiredApps": [
    {
      "id": "slack",
      "name": "Slack",
      "icon": "slack.svg",
      "authType": "oauth2",
      "scopes": ["chat:write", "channels:read"]
    },
    {
      "id": "google-sheets",
      "name": "Google Sheets",
      "icon": "google-sheets.svg",
      "authType": "oauth2",
      "scopes": ["spreadsheets"]
    },
    {
      "id": "typeform",
      "name": "Typeform",
      "icon": "typeform.svg",
      "authType": "api_key",
      "keyInstructions": "Go to Settings → Personal Tokens → Generate"
    }
  ],
  "configFields": [
    {
      "id": "slack_channel",
      "label": "Slack Channel",
      "type": "text",
      "placeholder": "#leads",
      "required": true,
      "helpText": "Channel where notifications will be posted"
    },
    {
      "id": "spreadsheet_id",
      "label": "Google Sheet ID",
      "type": "text",
      "required": true,
      "helpText": "Found in the URL of your Google Sheet"
    }
  ],
  "n8nWorkflow": {
    // Full n8n workflow JSON with {{PLACEHOLDER}} tokens
  },
  "estimatedSetupTime": "5 minutes",
  "popularity": 847,
  "tags": ["lead-gen", "notifications", "crm"],
  "createdAt": "2024-01-15T00:00:00Z",
  "updatedAt": "2024-01-20T00:00:00Z"
}
```

### Placeholder Convention

In n8n workflow JSON, we use placeholders that get replaced at activation:

```json
{
  "credentials": {
    "slackOAuth2Api": "{{CREDENTIAL:slack}}",
    "googleSheetsOAuth2Api": "{{CREDENTIAL:google-sheets}}"
  },
  "parameters": {
    "channel": "{{CONFIG:slack_channel}}",
    "spreadsheetId": "{{CONFIG:spreadsheet_id}}"
  }
}
```

---

## API Design Principles

### REST Conventions

| Method | Purpose | Example |
|--------|---------|---------|
| GET | Retrieve resource(s) | `GET /api/templates` |
| POST | Create resource | `POST /api/workflows` |
| PUT | Full update | `PUT /api/workflows/:id` |
| PATCH | Partial update | `PATCH /api/workflows/:id/status` |
| DELETE | Delete resource | `DELETE /api/workflows/:id` |

### Response Format

```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 145
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      { "field": "email", "message": "Must be valid email" }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid auth |
| `FORBIDDEN` | 403 | No permission for action |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `N8N_ERROR` | 502 | n8n API error |

---

## Environment Configuration

### Required Environment Variables

```bash
# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/flowmatic

# Redis
REDIS_URL=redis://localhost:6379

# n8n
N8N_API_URL=http://localhost:5678/api/v1
N8N_API_KEY=your_n8n_api_key

# Authentication
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=your_32_byte_encryption_key

# OAuth Providers
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
SLACK_CLIENT_ID=xxx
SLACK_CLIENT_SECRET=xxx

# Email (for alerts)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
FROM_EMAIL=noreply@flowmatic.app
```

---

## Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (p95) | <200ms | New Relic/Datadog |
| Page Load Time | <2s | Lighthouse |
| Time to Interactive | <3s | Lighthouse |
| Workflow Activation | <5s | Internal metrics |
| Concurrent Users | 100+ | Load testing |
| Uptime | 99.5% | Monitoring |

---

## Monitoring & Logging

### Logging Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                     Logging Levels                          │
├─────────────────────────────────────────────────────────────┤
│ ERROR   │ Application errors, failed workflows              │
│ WARN    │ Degraded performance, retries                     │
│ INFO    │ User actions, workflow activations                │
│ DEBUG   │ Detailed execution info (dev only)                │
└─────────────────────────────────────────────────────────────┘
```

### Structured Log Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "service": "api",
  "traceId": "abc123",
  "userId": "user_xxx",
  "action": "workflow.activated",
  "workflowId": "wf_xxx",
  "templateId": "tmpl_xxx",
  "duration": 1234,
  "metadata": {}
}
```

---

## Deployment Architecture

### Docker Compose (Development/Staging)

```yaml
services:
  frontend:
    build: ./apps/web
    ports: ["3000:3000"]
    
  api:
    build: ./apps/api
    ports: ["3001:3001"]
    depends_on: [postgres, redis, n8n]
    
  n8n:
    image: n8nio/n8n:latest
    ports: ["5678:5678"]
    depends_on: [postgres-n8n]
    
  postgres:
    image: postgres:15
    volumes: [postgres_data:/var/lib/postgresql/data]
    
  postgres-n8n:
    image: postgres:15
    volumes: [postgres_n8n_data:/var/lib/postgresql/data]
    
  redis:
    image: redis:7-alpine
    volumes: [redis_data:/data]
```

---

## Testing Strategy

| Type | Tools | Coverage Target |
|------|-------|-----------------|
| Unit Tests | Jest, Vitest | 80% |
| Integration Tests | Supertest | Critical paths |
| E2E Tests | Playwright | Happy paths |
| Load Tests | k6 | Pre-launch |

---

## Dependencies Summary

### Production Dependencies

**Backend:**
- express, cors, helmet, compression
- prisma, @prisma/client
- jsonwebtoken, bcrypt, passport
- axios (n8n API calls)
- ioredis
- winston (logging)
- zod (validation)

**Frontend:**
- next, react, react-dom
- @tanstack/react-query
- zustand
- tailwindcss
- @radix-ui/* (shadcn deps)
- react-hook-form, zod
- axios

### Development Dependencies

- typescript, tsx
- eslint, prettier
- jest, vitest
- playwright
- prisma (CLI)
- docker-compose
