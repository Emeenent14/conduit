# Conduit

> **One-click automation for everyone.** No coding. No complexity. Just results.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)

---

## 🚀 What is Conduit?

Conduit is a simplified automation platform built on top of [n8n](https://n8n.io). It transforms complex workflow automation into a consumer-friendly experience by offering a curated catalog of pre-built templates that users can activate with just their API keys.

**No workflow building. No technical knowledge. Just browse, connect, and automate.**

### Who is it for?

- 🏢 **Small Business Owners** - Automate repetitive tasks without hiring developers
- 📈 **Marketing Teams** - Connect your tools and streamline campaigns
- 💼 **Solopreneurs** - Save hours every week on manual work
- 👥 **Non-Technical Staff** - Get automation without waiting for IT

---

## ✨ Features

- **📚 Template Catalog** - 20+ pre-built automation workflows
- **🔐 Secure Credentials** - OAuth and API key management with AES-256 encryption
- **⚡ One-Click Activation** - Browse → Connect → Activate
- **📊 Dashboard** - Monitor executions and track success rates
- **🔔 Alerts** - Get notified when workflows fail

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Express.js, TypeScript, Prisma |
| **Database** | PostgreSQL 15 |
| **Cache** | Redis 7 |
| **Automation Engine** | n8n (headless) |
| **Infrastructure** | Docker, Docker Compose |

---

## 📦 Project Structure

```
conduit/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Express.js backend
├── packages/
│   ├── database/            # Prisma schema & migrations
│   ├── n8n-client/          # n8n API wrapper
│   └── shared/              # Shared types & utilities
├── templates/               # n8n workflow templates
├── docker/                  # Docker configuration
└── docs/                    # Documentation
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/conduit.git
cd conduit

# 2. Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Start Docker services (PostgreSQL, Redis, n8n)
npm run docker:up

# 4. Install dependencies
npm install

# 5. Run database migrations
npm run db:migrate

# 6. Seed the database
npm run db:seed

# 7. Start development servers
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| n8n (admin) | http://localhost:5678 |
| Prisma Studio | http://localhost:5555 |

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Project Overview](docs/01_PROJECT_OVERVIEW.md) | High-level project description |
| [Technical Specification](docs/02_TECHNICAL_SPECIFICATION.md) | Architecture and tech details |
| [API Specification](docs/03_API_SPECIFICATION.md) | REST API endpoints |
| [Implementation Roadmap](docs/04_IMPLEMENTATION_ROADMAP.md) | Phased development plan |
| [Environment Setup](docs/05_ENVIRONMENT_SETUP.md) | Detailed setup guide |
| [Template Catalog Structure](docs/06_TEMPLATE_CATALOG_STRUCTURE.md) | How templates work |

---

## 🧪 Development

### Commands

```bash
# Development
npm run dev              # Start all services
npm run dev -w apps/web  # Start frontend only
npm run dev -w apps/api  # Start backend only

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed data
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database

# Docker
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:logs      # View logs
npm run docker:reset     # Reset volumes

# Quality
npm run lint             # Run linter
npm run typecheck        # Type checking
npm run test             # Run tests
npm run format           # Format code
```

---

## 📋 Template Categories

| Category | Templates | Example |
|----------|-----------|---------|
| Lead Management | 5 | New Lead → Slack + CRM |
| Marketing | 5 | Social Cross-posting |
| Sales | 4 | Deal Won → Team Alert |
| Operations | 4 | Invoice → Accounting |
| Support | 2 | Ticket Escalation |

---

## 🗺️ Roadmap

- [x] Phase 0: Project Setup & Foundation (1 week)
- [ ] Phase 1: Authentication System (1.5 weeks)
- [ ] Phase 2: Template Catalog (2 weeks)
- [ ] Phase 3: Credential Management (2 weeks)
- [ ] Phase 4: Workflow Engine (2.5 weeks)
- [ ] Phase 5: Dashboard & Monitoring (2 weeks)
- [ ] Phase 6: Polish & Testing (2 weeks)
- [ ] Phase 7: Documentation & Deploy (1 week)

**Total: ~14 weeks**

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [n8n](https://n8n.io) - Workflow automation engine
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Prisma](https://prisma.io) - ORM

---

<p align="center">
  Built with ❤️ as a portfolio project
</p>
