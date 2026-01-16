# FlowMatic - API Specification

## Base URL

```
Development: http://localhost:3001/api/v1
Production:  https://api.flowmatic.app/api/v1
```

## Authentication

All authenticated endpoints require a Bearer token:

```
Authorization: Bearer <access_token>
```

---

## Endpoints Overview

| Category | Endpoint | Method | Auth | Description |
|----------|----------|--------|------|-------------|
| **Auth** | `/auth/register` | POST | No | Register new user |
| | `/auth/login` | POST | No | Login user |
| | `/auth/logout` | POST | Yes | Logout user |
| | `/auth/refresh` | POST | No | Refresh access token |
| | `/auth/me` | GET | Yes | Get current user |
| | `/auth/google` | GET | No | Google OAuth redirect |
| | `/auth/google/callback` | GET | No | Google OAuth callback |
| **Templates** | `/templates` | GET | No | List all templates |
| | `/templates/:slug` | GET | No | Get template details |
| | `/templates/categories` | GET | No | List categories |
| | `/templates/search` | GET | No | Search templates |
| **Credentials** | `/credentials` | GET | Yes | List user credentials |
| | `/credentials` | POST | Yes | Create credential |
| | `/credentials/:id` | GET | Yes | Get credential |
| | `/credentials/:id` | DELETE | Yes | Delete credential |
| | `/credentials/:id/test` | POST | Yes | Test credential |
| | `/credentials/oauth/:provider/init` | GET | Yes | Start OAuth flow |
| | `/credentials/oauth/:provider/callback` | GET | Yes | OAuth callback |
| **Workflows** | `/workflows` | GET | Yes | List user workflows |
| | `/workflows` | POST | Yes | Create workflow |
| | `/workflows/:id` | GET | Yes | Get workflow |
| | `/workflows/:id` | DELETE | Yes | Delete workflow |
| | `/workflows/:id/activate` | POST | Yes | Activate workflow |
| | `/workflows/:id/deactivate` | POST | Yes | Deactivate workflow |
| | `/workflows/:id/test` | POST | Yes | Test run workflow |
| **Executions** | `/executions` | GET | Yes | List executions |
| | `/executions/:id` | GET | Yes | Get execution details |
| **User** | `/user/profile` | GET | Yes | Get user profile |
| | `/user/profile` | PATCH | Yes | Update user profile |
| | `/user/settings` | GET | Yes | Get user settings |
| | `/user/settings` | PATCH | Yes | Update settings |

---

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Validation:**
- `email`: Valid email format, unique
- `password`: Min 8 chars, 1 uppercase, 1 number
- `name`: 2-50 characters

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Errors:**
- `400` - Validation error
- `409` - Email already registered

---

### POST /auth/login

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Errors:**
- `401` - Invalid credentials

---

### POST /auth/refresh

Get new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Errors:**
- `401` - Invalid or expired refresh token

---

### GET /auth/me

Get current authenticated user.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": "https://...",
    "createdAt": "2024-01-15T10:00:00Z",
    "stats": {
      "activeWorkflows": 5,
      "totalExecutions": 1234,
      "successRate": 98.5
    }
  }
}
```

---

## Template Endpoints

### GET /templates

List all available templates with filtering and pagination.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `category` | string | - | Filter by category slug |
| `apps` | string | - | Filter by app (comma-separated) |
| `sort` | string | "popularity" | Sort: popularity, newest, name |
| `q` | string | - | Search query |

**Example:**
```
GET /templates?category=marketing&apps=slack,gmail&sort=popularity&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "tmpl_abc123",
      "slug": "lead-to-slack-sheets",
      "name": "New Lead → Slack + Google Sheets",
      "description": "When a new lead comes in, send a Slack notification and log to Google Sheets",
      "category": {
        "id": "cat_leads",
        "slug": "lead-management",
        "name": "Lead Management"
      },
      "requiredApps": [
        { "id": "slack", "name": "Slack", "icon": "slack.svg" },
        { "id": "google-sheets", "name": "Google Sheets", "icon": "gsheets.svg" }
      ],
      "popularity": 847,
      "estimatedSetupTime": "5 minutes",
      "tags": ["lead-gen", "notifications"]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

---

### GET /templates/:slug

Get detailed template information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "tmpl_abc123",
    "slug": "lead-to-slack-sheets",
    "name": "New Lead → Slack + Google Sheets",
    "description": "Short description...",
    "longDescription": "# How This Works\n\nDetailed markdown...",
    "category": {
      "id": "cat_leads",
      "slug": "lead-management",
      "name": "Lead Management"
    },
    "requiredApps": [
      {
        "id": "slack",
        "name": "Slack",
        "icon": "slack.svg",
        "authType": "oauth2",
        "description": "We'll need access to post messages"
      },
      {
        "id": "google-sheets",
        "name": "Google Sheets",
        "icon": "gsheets.svg",
        "authType": "oauth2",
        "description": "We'll need access to edit your sheet"
      },
      {
        "id": "typeform",
        "name": "Typeform",
        "icon": "typeform.svg",
        "authType": "api_key",
        "keyInstructions": "1. Go to Settings\n2. Click Personal Tokens\n3. Generate new token"
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
        "helpText": "Found in the URL: docs.google.com/spreadsheets/d/{THIS_PART}/edit"
      }
    ],
    "popularity": 847,
    "estimatedSetupTime": "5 minutes",
    "tags": ["lead-gen", "notifications"],
    "relatedTemplates": [
      { "slug": "lead-to-hubspot", "name": "Lead → HubSpot CRM" }
    ],
    "createdAt": "2024-01-15T00:00:00Z",
    "updatedAt": "2024-01-20T00:00:00Z"
  }
}
```

---

### GET /templates/categories

List all template categories.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_leads",
      "slug": "lead-management",
      "name": "Lead Management",
      "description": "Capture and manage leads automatically",
      "icon": "users",
      "templateCount": 24
    },
    {
      "id": "cat_marketing",
      "slug": "marketing",
      "name": "Marketing",
      "description": "Automate your marketing workflows",
      "icon": "megaphone",
      "templateCount": 38
    }
  ]
}
```

---

## Credential Endpoints

### GET /credentials

List user's saved credentials.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cred_abc123",
      "provider": "slack",
      "providerName": "Slack",
      "providerIcon": "slack.svg",
      "authType": "oauth2",
      "isValid": true,
      "expiresAt": "2024-02-15T10:00:00Z",
      "scopes": ["chat:write", "channels:read"],
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": "cred_def456",
      "provider": "openai",
      "providerName": "OpenAI",
      "providerIcon": "openai.svg",
      "authType": "api_key",
      "isValid": true,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### POST /credentials

Create a new credential (API key type).

**Request Body:**
```json
{
  "provider": "openai",
  "credentials": {
    "apiKey": "sk-xxx..."
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "cred_abc123",
    "provider": "openai",
    "providerName": "OpenAI",
    "authType": "api_key",
    "isValid": true,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### GET /credentials/oauth/:provider/init

Initialize OAuth flow for a provider.

**Query Parameters:**
- `redirectUrl`: URL to redirect after OAuth (optional)

**Response (302 Redirect):**
Redirects to provider's OAuth authorization page.

---

### POST /credentials/:id/test

Test if credential is still valid.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "testedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Response (200 OK - Invalid):**
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "error": "Token expired",
    "testedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

## Workflow Endpoints

### GET /workflows

List user's workflows.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `status` | string | - | Filter: active, inactive, error |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "wf_abc123",
      "name": "My Lead Notifier",
      "templateId": "tmpl_abc123",
      "templateName": "New Lead → Slack + Google Sheets",
      "status": "active",
      "isActive": true,
      "lastExecutionAt": "2024-01-15T09:30:00Z",
      "lastExecutionStatus": "success",
      "executionCount": 156,
      "successCount": 154,
      "errorCount": 2,
      "createdAt": "2024-01-10T10:00:00Z",
      "activatedAt": "2024-01-10T10:05:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

---

### POST /workflows

Create a new workflow from a template.

**Request Body:**
```json
{
  "templateSlug": "lead-to-slack-sheets",
  "name": "My Lead Notifier",
  "credentials": {
    "slack": "cred_abc123",
    "google-sheets": "cred_def456",
    "typeform": "cred_ghi789"
  },
  "config": {
    "slack_channel": "#leads",
    "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "wf_abc123",
    "name": "My Lead Notifier",
    "templateId": "tmpl_abc123",
    "status": "inactive",
    "isActive": false,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Errors:**
- `400` - Missing required credentials or config
- `404` - Template not found
- `422` - Invalid credential for provider

---

### POST /workflows/:id/activate

Activate a workflow (deploy to n8n and start).

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "wf_abc123",
    "status": "active",
    "isActive": true,
    "activatedAt": "2024-01-15T10:00:00Z",
    "n8nWorkflowId": "123"
  }
}
```

**Errors:**
- `400` - Missing credentials
- `422` - Credential validation failed
- `502` - n8n API error

---

### POST /workflows/:id/deactivate

Deactivate a workflow.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "wf_abc123",
    "status": "inactive",
    "isActive": false,
    "deactivatedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### POST /workflows/:id/test

Run a test execution with sample data.

**Request Body (optional):**
```json
{
  "testData": {
    "email": "test@example.com",
    "name": "Test Lead"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "executionId": "exec_abc123",
    "status": "success",
    "duration": 1234,
    "output": {
      "slackMessageId": "123.456",
      "sheetsRowNumber": 42
    }
  }
}
```

---

## Execution Endpoints

### GET /executions

List workflow executions.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `workflowId` | string | - | Filter by workflow |
| `status` | string | - | Filter: success, error, running |
| `from` | string | - | ISO date, start of range |
| `to` | string | - | ISO date, end of range |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "exec_abc123",
      "workflowId": "wf_abc123",
      "workflowName": "My Lead Notifier",
      "status": "success",
      "startedAt": "2024-01-15T09:30:00Z",
      "finishedAt": "2024-01-15T09:30:02Z",
      "duration": 2341
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156
  }
}
```

---

### GET /executions/:id

Get detailed execution information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "exec_abc123",
    "workflowId": "wf_abc123",
    "workflowName": "My Lead Notifier",
    "status": "success",
    "startedAt": "2024-01-15T09:30:00Z",
    "finishedAt": "2024-01-15T09:30:02Z",
    "duration": 2341,
    "input": {
      "email": "newlead@example.com",
      "name": "Jane Doe",
      "company": "Acme Inc"
    },
    "output": {
      "slackMessageId": "123.456",
      "sheetsRowNumber": 42
    },
    "steps": [
      {
        "name": "Typeform Trigger",
        "status": "success",
        "duration": 120
      },
      {
        "name": "Slack",
        "status": "success",
        "duration": 890
      },
      {
        "name": "Google Sheets",
        "status": "success",
        "duration": 1200
      }
    ]
  }
}
```

**Response (200 OK - Error):**
```json
{
  "success": true,
  "data": {
    "id": "exec_def456",
    "workflowId": "wf_abc123",
    "status": "error",
    "startedAt": "2024-01-15T09:30:00Z",
    "finishedAt": "2024-01-15T09:30:01Z",
    "duration": 1200,
    "error": {
      "message": "Slack API error: channel_not_found",
      "step": "Slack",
      "code": "SLACK_CHANNEL_NOT_FOUND"
    }
  }
}
```

---

## Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 10 | 1 minute |
| General API | 100 | 1 minute |
| Workflow activation | 20 | 1 minute |
| Test execution | 10 | 1 minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312800
```

**Rate Limit Exceeded (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again in 45 seconds.",
    "retryAfter": 45
  }
}
```

---

## Webhooks (Future)

For real-time updates, we'll support webhooks:

```json
// POST to your webhook URL
{
  "event": "workflow.execution.completed",
  "timestamp": "2024-01-15T09:30:02Z",
  "data": {
    "executionId": "exec_abc123",
    "workflowId": "wf_abc123",
    "status": "success"
  }
}
```

Events:
- `workflow.activated`
- `workflow.deactivated`
- `workflow.execution.started`
- `workflow.execution.completed`
- `workflow.execution.failed`
- `credential.expiring`
- `credential.expired`
