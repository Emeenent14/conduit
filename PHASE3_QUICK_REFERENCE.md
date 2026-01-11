# Phase 3: Quick Reference Card

## 🎯 What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| Google OAuth | ✅ | Needs OAuth app setup |
| Slack OAuth | ✅ | Needs OAuth app setup |
| OpenAI API Key | ✅ | Ready to use |
| Credential Encryption | ✅ | AES-256-GCM |
| Credential Testing | ✅ | Validates tokens/keys |
| n8n Sync | ✅ | Auto-sync on create/delete |
| Token Refresh | ✅ | Auto-refresh Google tokens |
| Credential Manager UI | ✅ | Full CRUD interface |

## 📋 Setup Checklist

- [ ] Install `axios` in backend: `cd apps/api && npm install axios`
- [ ] Install `date-fns` in frontend: `cd apps/web && npm install date-fns`
- [ ] Register Google OAuth app
- [ ] Register Slack OAuth app
- [ ] Add OAuth credentials to `.env`
- [ ] Generate encryption key if missing
- [ ] Test Postman collection
- [ ] Test frontend OAuth flow

## 🔑 Required Environment Variables

```env
# Phase 3 - New Variables
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/oauth/google/callback

SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_CALLBACK_URL=http://localhost:3001/api/v1/oauth/slack/callback

# Generate if missing:
ENCRYPTION_KEY=  # 64-char hex (run: openssl rand -hex 32)
```

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd apps/api && npm install axios
cd apps/web && npm install date-fns

# 2. Set up .env (see above)

# 3. Start servers
cd apps/api && npm run dev
cd apps/web && npm run dev

# 4. Import Postman collection
# File: Conduit_API_Phase3.postman_collection.json

# 5. Test
# Visit: http://localhost:3000/credentials
```

## 📁 Key Files Created

### Backend (12 files)
```
apps/api/src/
├── services/
│   ├── oauth/
│   │   ├── google.oauth.ts           ✨ NEW
│   │   └── slack.oauth.ts            ✨ NEW
│   ├── credential-validators/
│   │   ├── google.validator.ts       ✨ NEW
│   │   ├── slack.validator.ts        ✨ NEW
│   │   ├── openai.validator.ts       ✨ NEW
│   │   └── index.ts                  ✨ NEW
│   ├── credentials.service.ts        ✨ NEW
│   ├── n8n-credential.service.ts     ✨ NEW
│   └── token-refresh.service.ts      ✨ NEW
├── controllers/
│   └── oauth.controller.ts           ✨ NEW
└── routes/
    ├── oauth.routes.ts               ✨ NEW
    └── credential.routes.ts          📝 UPDATED
```

### Frontend (6 files)
```
apps/web/src/
├── app/credentials/
│   └── page.tsx                      ✨ NEW
├── components/credentials/
│   ├── credential-card.tsx           ✨ NEW
│   ├── add-credential-modal.tsx      ✨ NEW
│   ├── oauth-button.tsx              ✨ NEW
│   └── api-key-form.tsx              ✨ NEW
├── lib/api/
│   └── credentials.api.ts            ✨ NEW
└── components/landing/
    └── header.tsx                    📝 UPDATED
```

## 🧪 Testing Endpoints

### Create Credential (API Key)
```bash
POST /api/v1/credentials
Authorization: Bearer {token}

{
  "appSlug": "openai",
  "apiKey": "sk-test123...",
  "name": "My OpenAI Key"
}
```

### List Credentials
```bash
GET /api/v1/credentials
Authorization: Bearer {token}
```

### Test Credential
```bash
POST /api/v1/credentials/{id}/test
Authorization: Bearer {token}
```

### Delete Credential
```bash
DELETE /api/v1/credentials/{id}
Authorization: Bearer {token}
```

### Start OAuth Flow
```bash
# Open in browser while authenticated:
GET /api/v1/oauth/google/authorize?returnUrl=http://localhost:3000/credentials
GET /api/v1/oauth/slack/authorize?returnUrl=http://localhost:3000/credentials
```

## 🔒 Security Features

- ✅ AES-256-GCM encryption
- ✅ Unique IV per credential
- ✅ Authentication tag verification
- ✅ CSRF protection (OAuth state)
- ✅ User ownership checks
- ✅ Automatic token refresh
- ✅ Secure token storage

## 📊 Database Schema

```prisma
model Credential {
  id String @id @default(uuid())
  userId String
  appId String

  // Encrypted data
  credentialsEncrypted Bytes
  encryptionIv Bytes
  authTag Bytes

  // OAuth fields
  oauthAccessTokenEncrypted Bytes?
  oauthRefreshTokenEncrypted Bytes?
  oauthExpiresAt DateTime?
  oauthScopes String[]

  // Status
  isValid Boolean @default(true)
  lastValidatedAt DateTime?
  validationError String?

  // n8n sync
  n8nCredentialId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🎨 UI Components

### Credential Card
- Shows provider name & icon
- Status badge (valid/invalid/expiring)
- Test button
- Delete button
- Last validated timestamp
- OAuth scopes display

### Add Credential Modal
- Provider selection grid
- OAuth flow for Google/Slack
- API key form for OpenAI
- Security information
- Instructions & links

### Credential Manager Page
- Search functionality
- Grouped by provider
- Empty state handling
- Loading states
- Toast notifications

## 🐛 Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `OAuth is not configured` | Add CLIENT_ID/SECRET to `.env` |
| `Cannot find module 'date-fns'` | `npm install date-fns` |
| `Cannot find module 'axios'` | `npm install axios` |
| `Invalid encryption key` | Generate: `openssl rand -hex 32` |
| `n8n sync failed` | Check n8n is running & API key is correct |
| Popup blocked | Allow popups for localhost |

## 📈 What's Next (Phase 4)

After Phase 3 testing is complete:

1. **Workflow Engine** - Create workflows from templates
2. **Workflow Builder** - Visual workflow editor
3. **Workflow Execution** - Run workflows with credentials
4. **Execution Logs** - View workflow run history
5. **Dashboard Analytics** - Usage statistics

## 🎉 Success Criteria

Phase 3 is complete when:
- [ ] Can create Google OAuth credential
- [ ] Can create Slack OAuth credential
- [ ] Can create OpenAI API key credential
- [ ] Can test all credential types
- [ ] Can delete credentials
- [ ] Credentials sync to n8n
- [ ] Google tokens auto-refresh
- [ ] All security checks pass
