# Phase 3: Credential Management - Testing Guide

## Quick Status Summary

### ✅ Fully Implemented (Backend)
- OAuth flows (Google, Slack)
- Credential CRUD operations
- Credential validation/testing
- Token encryption (AES-256-GCM)
- Token refresh logic
- n8n credential sync
- All API endpoints

### ⚠️ Needs Setup Before Testing
- OAuth app registration (Google, Slack)
- Environment variables
- Missing npm dependencies

### ❌ Not Tested Yet
- Frontend OAuth callback handling
- End-to-end OAuth flows
- n8n integration in practice

---

## Prerequisites

### 1. Install Missing Dependencies

```bash
# Backend
cd apps/api
npm install axios

# Frontend
cd apps/web
npm install date-fns
```

### 2. Set Up Environment Variables

Create or update `apps/api/.env`:

```env
# Existing variables (keep these)
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
N8N_API_URL=http://localhost:5678
N8N_API_KEY=your_n8n_api_key
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
ENCRYPTION_KEY=your_64_char_hex_string

# NEW: Generate encryption key if you don't have one
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# NEW: Google OAuth (Phase 3)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/oauth/google/callback

# NEW: Slack OAuth (Phase 3)
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_CALLBACK_URL=http://localhost:3001/api/v1/oauth/slack/callback
```

### 3. Register OAuth Applications

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs: Gmail API, Google Sheets API, Google Calendar API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URIs: `http://localhost:3001/api/v1/oauth/google/callback`
7. Copy Client ID and Client Secret to `.env`

#### Slack OAuth Setup
1. Go to [Slack API](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name your app, select workspace
4. Go to "OAuth & Permissions"
5. Add redirect URL: `http://localhost:3001/api/v1/oauth/slack/callback`
6. Add Bot Token Scopes: `chat:write`, `channels:read`, `users:read`
7. Copy Client ID and Client Secret to `.env`

---

## Testing with Postman

### Import Collection

1. Open Postman
2. Click "Import"
3. Select `Conduit_API_Phase3.postman_collection.json`
4. Collection will appear in sidebar

### Configure Variables

1. Click on "Conduit API - Phase 3" collection
2. Go to "Variables" tab
3. Set `base_url` to `http://localhost:3001`
4. Save

### Test Flow

#### Step 1: Register & Login
```
1. Run "Auth → Register User"
2. Run "Auth → Login" (saves access_token automatically)
3. Run "Auth → Get Current User" (verify token works)
```

#### Step 2: Create API Key Credential
```
1. Run "Credentials → Create OpenAI API Key Credential"
   - This saves the credential_id automatically
   - Returns encrypted credential in response
2. Run "Credentials → List All Credentials"
   - Should see the OpenAI credential
3. Run "Credentials → Test Credential"
   - Will validate the API key (may fail if key is fake)
```

#### Step 3: OAuth Flow (Manual - Browser Required)
```
1. Run "OAuth Flows → Google OAuth - Start Flow"
2. Copy the response URL
3. Open in browser while logged in
4. Complete Google consent screen
5. Should redirect back to frontend with success
6. Run "Credentials → List All Credentials"
   - Should see Google credential
```

#### Step 4: Test & Delete
```
1. Run "Credentials → Test Credential"
   - Tests the selected credential
2. Run "Credentials → Delete Credential"
   - Removes credential from DB and n8n
```

---

## API Endpoint Reference

### Authentication
- `POST /api/v1/auth/register` - Create new user
- `POST /api/v1/auth/login` - Login (returns access token)
- `GET /api/v1/auth/me` - Get current user

### OAuth
- `GET /api/v1/oauth/google/authorize` - Start Google OAuth
- `GET /api/v1/oauth/google/callback` - Google OAuth callback
- `GET /api/v1/oauth/slack/authorize` - Start Slack OAuth
- `GET /api/v1/oauth/slack/callback` - Slack OAuth callback

### Credentials
- `GET /api/v1/credentials` - List all credentials
- `GET /api/v1/credentials/:id` - Get single credential
- `POST /api/v1/credentials` - Create API key credential
- `DELETE /api/v1/credentials/:id` - Delete credential
- `POST /api/v1/credentials/:id/test` - Test credential validity

### Templates
- `GET /api/v1/templates` - List templates
- `GET /api/v1/templates/:slug` - Get template by slug

---

## Testing Frontend

### Start Dev Servers
```bash
# Terminal 1 - Backend
cd apps/api
npm run dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

### Navigate to Credentials Page
1. Open http://localhost:3000/credentials
2. Click "Add Credential"
3. Select a provider (Google, Slack, or OpenAI)

### Test OAuth Flow (Google/Slack)
1. Click "Connect Google" or "Connect Slack"
2. OAuth popup should open
3. Complete consent screen
4. Popup should close automatically
5. Credential should appear in list

### Test API Key Flow (OpenAI)
1. Click on OpenAI
2. Enter API key: `sk-test1234567890...`
3. Click "Save API Key"
4. Credential should appear in list

### Test Credential Actions
1. Click "Test" button on any credential
2. Should show valid/invalid status
3. Click delete icon
4. Credential should be removed

---

## Common Issues & Solutions

### Issue: OAuth popup blocked
**Solution:** Allow popups for localhost in browser settings

### Issue: "OAuth is not configured"
**Solution:** Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are in `.env`

### Issue: "Failed to sync credential to n8n"
**Solution:**
- Check n8n is running at http://localhost:5678
- Verify N8N_API_KEY is correct in `.env`

### Issue: Encryption error
**Solution:** Generate new ENCRYPTION_KEY:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Issue: date-fns error in frontend
**Solution:**
```bash
cd apps/web
npm install date-fns
```

### Issue: axios error in backend
**Solution:**
```bash
cd apps/api
npm install axios
```

---

## What to Verify

### Security ✅
- [ ] Credentials encrypted in database (check with Prisma Studio)
- [ ] OAuth state parameter present and validated
- [ ] Can't access other users' credentials
- [ ] API keys masked in UI (only show last 4 chars)

### Functionality ✅
- [ ] Google OAuth complete flow works
- [ ] Slack OAuth complete flow works
- [ ] OpenAI API key creation works
- [ ] Credential testing works
- [ ] Credential deletion works
- [ ] n8n sync happens automatically
- [ ] Token refresh works for Google

### UI/UX ✅
- [ ] Status badges show correct colors
- [ ] Loading states during test/delete
- [ ] Toast notifications appear
- [ ] Empty state shows when no credentials
- [ ] Search filters credentials
- [ ] Responsive on mobile

---

## Next Steps After Testing

1. **Fix any bugs found** during testing
2. **Add more OAuth providers** (HubSpot, Notion, etc.)
3. **Add more API key providers** (Stripe, Mailchimp, etc.)
4. **Implement automatic token refresh cron job**
5. **Add credential usage tracking** (show which workflows use which credentials)
6. **Move to Phase 4**: Workflow Engine implementation

---

## Support

If you encounter issues:
1. Check backend logs: `apps/api` terminal
2. Check frontend console: Browser DevTools
3. Check database: Run `npx prisma studio` in `packages/database`
4. Check n8n: Visit http://localhost:5678
