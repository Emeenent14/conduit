# Conduit - Quick Start Guide

## ⚡ Get Running in 5 Minutes

This is the fastest way to get Conduit up and running.

### Step 1: Copy Environment Files (30 seconds)

```bash
# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### Step 2: Generate Secure Keys (1 minute)

Run these commands and copy the output to your `.env` files:

```bash
# Generate JWT Secret (add to apps/api/.env as JWT_SECRET)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"

# Generate Encryption Key (add to apps/api/.env as ENCRYPTION_KEY)
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate n8n Encryption Key (add to .env as N8N_ENCRYPTION_KEY)
node -e "console.log('N8N_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

**Update these files:**

1. In `apps/api/.env`:
   - Replace `your-super-secret-jwt-key...` with the JWT_SECRET value
   - Replace `0123456789abcdef...` (ENCRYPTION_KEY) with the Encryption Key value

2. In `.env`:
   - Replace `your-n8n-encryption-key...` with the n8n Encryption Key value

### Step 3: Start Docker Services (2 minutes)

```bash
npm run docker:up
```

Wait for services to start. Check status:
```bash
docker ps
```

You should see 5 containers running:
- `conduit-postgres`
- `conduit-postgres-n8n`
- `conduit-redis`
- `conduit-n8n`
- `conduit-mailhog`

### Step 4: Get n8n API Key (1 minute)

1. Open http://localhost:5678
2. Login with:
   - Username: `admin`
   - Password: `admin_password`
3. Click your profile icon → Settings → API → "Create API Key"
4. Copy the API key
5. Add to `apps/api/.env`:
   ```
   N8N_API_KEY=your-actual-api-key-here
   ```

### Step 5: Setup Database (1 minute)

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

When prompted for migration name, type: `init`

### Step 6: Start Dev Servers (30 seconds)

```bash
npm run dev
```

## ✅ You're Done!

Open your browser to:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001/api/health

### Test the App

1. Go to http://localhost:3000
2. Click "Get Started"
3. Register with:
   - Name: Your Name
   - Email: test@example.com
   - Password: Password123
4. You should see the dashboard!

## 🐛 Troubleshooting

### "Port already in use"

Check what's using the ports:
```bash
# Windows
netstat -ano | findstr "3000 3001 5432 5678 6379"

# Kill the processes or change ports in .env
```

### "Cannot connect to database"

```bash
# Check Docker is running
docker ps

# Restart Docker services
npm run docker:down
npm run docker:up
```

### "Prisma client not generated"

```bash
npm run db:generate
```

### Start Fresh

```bash
# Reset everything
npm run docker:reset
npm run db:reset
npm run dev
```

## 📚 Full Documentation

For detailed setup instructions, see [SETUP.md](SETUP.md)

## 🎯 What's Working

✅ User Registration
✅ User Login
✅ JWT Authentication
✅ Protected Routes
✅ Token Refresh
✅ Dashboard

## 🚀 Next Steps

- Browse the codebase
- Read [PHASE_0_AND_1_COMPLETE.md](PHASE_0_AND_1_COMPLETE.md) for implementation details
- Check [docs/](docs/) for technical specs
- Start building Phase 2 features!
