# Conduit Setup Checklist

Use this checklist to ensure everything is set up correctly.

## Prerequisites

- [ ] Node.js 20+ installed (`node --version`)
- [ ] npm 10+ installed (`npm --version`)
- [ ] Docker Desktop installed and running
- [ ] Git installed

## Initial Setup

- [ ] Cloned the repository
- [ ] Copied `.env.example` to `.env`
- [ ] Copied `apps/api/.env.example` to `apps/api/.env`
- [ ] Copied `apps/web/.env.example` to `apps/web/.env.local`

## Environment Configuration

### Root `.env`
- [ ] Updated `POSTGRES_PASSWORD`
- [ ] Updated `N8N_POSTGRES_PASSWORD`
- [ ] Updated `REDIS_PASSWORD`
- [ ] Updated `N8N_BASIC_AUTH_PASSWORD`
- [ ] Updated `N8N_ENCRYPTION_KEY` (generated with crypto)

### API `.env` (`apps/api/.env`)
- [ ] Updated `JWT_SECRET` (generated with crypto)
- [ ] Updated `ENCRYPTION_KEY` (generated with crypto, must be 64 hex chars)
- [ ] Updated `DATABASE_URL` to match Postgres credentials
- [ ] Updated `REDIS_URL` to match Redis credentials
- [ ] Updated `N8N_API_KEY` (get from n8n dashboard after step below)

### Frontend `.env.local` (`apps/web/.env.local`)
- [ ] `NEXT_PUBLIC_API_URL=http://localhost:3001` is set

## Docker Services

- [ ] Ran `npm run docker:up`
- [ ] Verified all containers are running (`docker ps`)
- [ ] PostgreSQL is healthy (conduit-postgres)
- [ ] PostgreSQL for n8n is healthy (conduit-postgres-n8n)
- [ ] Redis is healthy (conduit-redis)
- [ ] n8n is accessible (conduit-n8n)

## n8n Configuration

- [ ] Opened http://localhost:5678
- [ ] Logged in with admin credentials
- [ ] Created API key (Settings → API → Create API Key)
- [ ] Added API key to `apps/api/.env` as `N8N_API_KEY`

## Dependencies

- [ ] Ran `npm install`
- [ ] No errors during installation
- [ ] All packages installed successfully

## Database Setup

- [ ] Ran `npm run db:generate`
- [ ] Prisma client generated successfully
- [ ] Ran `npm run db:migrate`
- [ ] Migration completed successfully
- [ ] (Optional) Ran `npm run db:seed`

## Development Servers

- [ ] Ran `npm run dev`
- [ ] Frontend started on http://localhost:3000
- [ ] Backend started on http://localhost:3001
- [ ] No errors in console

## Testing

### Backend API
- [ ] Visited http://localhost:3001/api/health
- [ ] Received `{"status": "ok", ...}` response

### Frontend
- [ ] Visited http://localhost:3000
- [ ] Home page loads correctly
- [ ] Clicked "Get Started"
- [ ] Registration page loads

### End-to-End Auth Flow
- [ ] Registered new user account
  - Name: _______________
  - Email: _______________
  - Password: _______________ (8+ chars, uppercase, number)
- [ ] Redirected to dashboard after registration
- [ ] Dashboard shows welcome message with name
- [ ] Clicked "Logout"
- [ ] Redirected to home page
- [ ] Clicked "Login"
- [ ] Logged in with same credentials
- [ ] Redirected to dashboard

### Database Verification
- [ ] Ran `npm run db:studio`
- [ ] Prisma Studio opened in browser
- [ ] Can see `User` table with registered user
- [ ] Can see `RefreshToken` table with tokens

## Services Checklist

| Service | Port | URL | Status |
|---------|------|-----|--------|
| Frontend | 3000 | http://localhost:3000 | [ ] Working |
| Backend API | 3001 | http://localhost:3001/api/health | [ ] Working |
| PostgreSQL | 5432 | - | [ ] Running |
| n8n Postgres | 5433 | - | [ ] Running |
| Redis | 6379 | - | [ ] Running |
| n8n Admin | 5678 | http://localhost:5678 | [ ] Working |
| MailHog | 8025 | http://localhost:8025 | [ ] Working |
| Prisma Studio | 5555 | `npm run db:studio` | [ ] Working |

## Verification Commands

Run these to verify everything:

```bash
# Check Docker containers
docker ps

# Check backend health
curl http://localhost:3001/api/health

# Check database connection
npm run db:studio

# Check logs
docker logs conduit-postgres
docker logs conduit-n8n
docker logs conduit-redis
```

## Common Issues

### Issue: Port already in use
- [ ] Checked which process is using the port
- [ ] Killed the process or changed port in config
- [ ] Restarted services

### Issue: Database connection failed
- [ ] Verified Docker containers are running
- [ ] Checked DATABASE_URL matches Docker config
- [ ] Verified Postgres container is healthy
- [ ] Restarted Docker services

### Issue: Prisma errors
- [ ] Regenerated Prisma client
- [ ] Reset database if needed
- [ ] Ran migrations again

### Issue: Frontend can't connect to backend
- [ ] Verified backend is running on port 3001
- [ ] Checked NEXT_PUBLIC_API_URL is correct
- [ ] Looked for CORS errors in browser console
- [ ] Restarted dev servers

## Final Checks

- [ ] All items in this checklist are complete
- [ ] Can register and login successfully
- [ ] Dashboard displays correctly
- [ ] No errors in browser console
- [ ] No errors in terminal logs

## Next Steps

- [ ] Read [PHASE_0_AND_1_COMPLETE.md](PHASE_0_AND_1_COMPLETE.md)
- [ ] Review [SETUP.md](SETUP.md) for detailed docs
- [ ] Explore the codebase
- [ ] Check [docs/](docs/) for technical specs
- [ ] Start building Phase 2 features

## Get Help

If you're stuck:
1. Check [SETUP.md](SETUP.md) troubleshooting section
2. Review Docker logs: `npm run docker:logs`
3. Reset everything: `npm run docker:reset`
4. Check the GitHub issues

---

**Status**: [ ] All checks passed - ready to develop! 🎉
