# Conduit - Setup Guide

This guide will help you get Conduit running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **npm** 10.x or higher (comes with Node.js)
- **Docker** and **Docker Compose** ([Download](https://www.docker.com/products/docker-desktop))
- **Git** ([Download](https://git-scm.com/))

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/conduit.git
cd conduit
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Copy API environment file
cp apps/api/.env.example apps/api/.env

# Copy frontend environment file
cp apps/web/.env.example apps/web/.env.local
```

### 3. Generate Secure Keys

Generate secure keys for your `.env` and `apps/api/.env` files:

```bash
# Generate JWT Secret (copy this to JWT_SECRET in apps/api/.env)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate Encryption Key (copy this to ENCRYPTION_KEY in apps/api/.env)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate n8n Encryption Key (copy this to N8N_ENCRYPTION_KEY in .env)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update the following in your `.env` files:
- `JWT_SECRET` - Use the first generated key
- `ENCRYPTION_KEY` - Use the second generated key (must be 64 hex characters)
- `N8N_ENCRYPTION_KEY` - Use the third generated key

### 4. Start Docker Services

```bash
npm run docker:up
```

This will start:
- PostgreSQL (port 5432) - Main database
- PostgreSQL for n8n (port 5433)
- Redis (port 6379)
- n8n (port 5678)
- MailHog (ports 1025, 8025) - Email testing

Wait for all services to be healthy (about 30-60 seconds).

### 5. Get n8n API Key

1. Open n8n in your browser: http://localhost:5678
2. Login with credentials from `.env`:
   - Username: `admin` (or what you set in `N8N_BASIC_AUTH_USER`)
   - Password: `admin_password` (or what you set in `N8N_BASIC_AUTH_PASSWORD`)
3. Go to Settings → API → Create API Key
4. Copy the API key and add it to `apps/api/.env`:
   ```
   N8N_API_KEY=your-copied-api-key-here
   ```

### 6. Install Dependencies

```bash
npm install
```

This will install dependencies for:
- Root workspace
- Frontend (Next.js)
- Backend (Express)
- All packages (database, n8n-client, shared)

### 7. Run Database Migrations

```bash
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed initial data (optional)
```

### 8. Start Development Servers

```bash
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/api/health

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Main user interface |
| Backend API | http://localhost:3001 | REST API |
| n8n Admin | http://localhost:5678 | Workflow engine admin |
| Prisma Studio | `npm run db:studio` | Database GUI |
| MailHog | http://localhost:8025 | Email testing UI |

## Testing the Setup

### 1. Check API Health

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-16T...",
  "uptime": 123.456,
  "environment": "development"
}
```

### 2. Register a User

1. Go to http://localhost:3000
2. Click "Get Started"
3. Fill in the registration form:
   - Name: Your Name
   - Email: your@email.com
   - Password: Must be 8+ chars, 1 uppercase, 1 number
4. You should be redirected to the dashboard

### 3. Verify Database

```bash
npm run db:studio
```

This opens Prisma Studio where you can see your user in the database.

## Common Issues

### Docker Services Won't Start

```bash
# Check if ports are already in use
netstat -an | findstr "5432 5678 6379"

# Reset Docker volumes
npm run docker:reset
```

### Database Connection Failed

Make sure:
1. Docker services are running: `docker ps`
2. DATABASE_URL in `apps/api/.env` matches your Docker config
3. PostgreSQL is healthy: `docker logs conduit-postgres`

### Frontend Won't Connect to API

Check:
1. Backend is running on port 3001
2. `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` is `http://localhost:3001`
3. No CORS errors in browser console

### Prisma Errors

```bash
# Regenerate Prisma client
npm run db:generate

# Reset database (WARNING: deletes all data)
npm run db:reset
```

## Development Workflow

### Running Individual Services

```bash
# Frontend only
npm run dev -w apps/web

# Backend only
npm run dev -w apps/api

# Database operations
npm run db:studio        # Open database GUI
npm run db:migrate       # Run new migrations
npm run db:seed          # Seed data
```

### Docker Management

```bash
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:logs      # View logs
npm run docker:reset     # Reset everything
```

### Code Quality

```bash
npm run lint             # Check for issues
npm run lint:fix         # Auto-fix issues
npm run typecheck        # TypeScript check
npm run format           # Format code
npm run test             # Run tests
```

## Project Structure

```
conduit/
├── apps/
│   ├── web/              # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/      # App Router pages
│   │   │   ├── components/ # React components
│   │   │   └── lib/      # Utilities
│   │   └── package.json
│   └── api/              # Express backend
│       ├── src/
│       │   ├── routes/   # API routes
│       │   ├── middleware/ # Express middleware
│       │   ├── services/ # Business logic
│       │   └── lib/      # Utilities
│       └── package.json
├── packages/
│   ├── database/         # Prisma schema & client
│   ├── n8n-client/       # n8n API wrapper
│   └── shared/           # Shared types
├── docker/
│   └── docker-compose.yml # Docker services
├── templates/            # n8n workflow templates
└── docs/                 # Documentation
```

## Next Steps

1. ✅ **Phase 0 Complete**: Development environment is running
2. ✅ **Phase 1 Complete**: Authentication system works
3. **Phase 2**: Browse template catalog (coming soon)
4. **Phase 3**: Connect credentials via OAuth
5. **Phase 4**: Activate workflows
6. **Phase 5**: Monitor executions

## Getting Help

- Check the [Documentation](docs/)
- Review [API Specification](docs/03_API_SPECIFICATION.md)
- See [Implementation Roadmap](docs/04_IMPLEMENTATION_ROADMAP.md)

## License

MIT License - see [LICENSE](LICENSE) for details.
