# FlowMatic - Project Overview

> **One-click automation for everyone. No coding. No complexity. Just results.**

## Executive Summary

FlowMatic is a simplified automation platform built on top of n8n that transforms complex workflow automation into a consumer-friendly experience. Instead of building workflows from scratch, users browse a curated catalog of pre-built templates and simply connect their accounts via API keys.

### Core Value Proposition

| For Users | Pain Point Solved |
|-----------|-------------------|
| Small Business Owners | "I know automation would help, but I don't know where to start" |
| Marketing Teams | "Zapier is too expensive and I can't justify the cost" |
| Solopreneurs | "I don't have time to learn complex tools" |
| Non-Technical Staff | "The IT team is too busy to help me automate my tasks" |

---

## Project Scope

### What We're Building

```
┌─────────────────────────────────────────────────────────────────┐
│                        FlowMatic App                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Template   │  │  Credential │  │  Workflow   │              │
│  │  Catalog    │  │  Manager    │  │  Dashboard  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                    FlowMatic API Layer                          │
│         (User Auth, Template Management, n8n Proxy)             │
├─────────────────────────────────────────────────────────────────┤
│                    n8n Engine (Headless)                        │
│              (Workflow Execution & Scheduling)                  │
└─────────────────────────────────────────────────────────────────┘
```

### What We're NOT Building

- Custom workflow builder (users use templates only)
- Our own integration connectors (leverage n8n's 400+ nodes)
- Mobile app (web-first, responsive design)
- Enterprise features (SSO, audit logs, etc.)

---

## User Journey

### Happy Path: First Workflow Activation

```
1. USER SIGNS UP
   └── Email + Password or Google OAuth
   
2. BROWSES CATALOG
   └── Categories: Marketing, Sales, Support, Operations
   └── Filters by: Apps they use, popularity, use case
   
3. SELECTS TEMPLATE
   └── "New Lead → Slack Notification + Google Sheets Log"
   └── Sees: Description, required apps, expected outcome
   
4. CONNECTS ACCOUNTS
   └── OAuth flow for Slack (one-click)
   └── OAuth flow for Google Sheets (one-click)
   └── Paste API key for lead source (with guide)
   
5. ACTIVATES WORKFLOW
   └── One-click activation
   └── Test run with sample data
   └── Confirmation: "You're all set!"
   
6. MONITORS DASHBOARD
   └── See execution history
   └── Check for errors
   └── Pause/resume workflows
```

---

## Feature Set

### MVP Features (Phase 1)

| Feature | Priority | Description |
|---------|----------|-------------|
| User Authentication | P0 | Email/password + Google OAuth |
| Template Catalog | P0 | Browse, search, filter templates |
| Credential Manager | P0 | OAuth + API key storage |
| One-Click Activation | P0 | Deploy template as running workflow |
| Execution Dashboard | P0 | View history, status, errors |
| Basic Error Alerts | P0 | Email on workflow failure |

### Post-MVP Features (Phase 2+)

| Feature | Priority | Description |
|---------|----------|-------------|
| Template Customization | P1 | Modify template parameters |
| Workflow Scheduling | P1 | Run at specific times |
| Team Workspaces | P2 | Share workflows with team |
| Usage Analytics | P2 | Track time saved, ROI |
| Custom Integrations | P3 | Request new integrations |
| White-label | P3 | Reseller/agency version |

---

## Target Users

### Primary Personas

#### 1. Sarah - The Solopreneur
- **Role**: Freelance marketing consultant
- **Tech Comfort**: Uses Canva, Mailchimp, basic tools
- **Pain**: Spends 5+ hours/week on repetitive tasks
- **Budget**: $20-50/month for tools
- **Goal**: "I want to automate follow-ups without learning code"

#### 2. Mike - The Small Business Owner
- **Role**: Owns a 10-person e-commerce store
- **Tech Comfort**: Comfortable with Shopify, basic spreadsheets
- **Pain**: Team manually enters orders into multiple systems
- **Budget**: $100-200/month if it saves significant time
- **Goal**: "I need my systems to talk to each other"

#### 3. Lisa - The Marketing Manager
- **Role**: Marketing lead at a 50-person company
- **Tech Comfort**: Power user of marketing tools
- **Pain**: IT won't prioritize her automation requests
- **Budget**: Has departmental budget, needs to show ROI
- **Goal**: "I want marketing automation without IT dependencies"

---

## Success Metrics

### North Star Metric
**Weekly Active Workflows (WAW)**: Number of workflows that executed at least once in the past 7 days.

### Supporting Metrics

| Metric | Target (MVP) | Target (6 months) |
|--------|--------------|-------------------|
| Registered Users | 500 | 5,000 |
| Activated Workflows | 200 | 2,500 |
| Weekly Active Workflows | 150 | 2,000 |
| Workflow Success Rate | >95% | >98% |
| Time to First Workflow | <10 min | <5 min |
| User Retention (30-day) | 40% | 60% |

---

## Technical Constraints

### Must Have
- n8n as execution engine (not optional)
- PostgreSQL for data storage
- Redis for job queuing
- Secure credential storage (encrypted at rest)
- HTTPS everywhere

### Nice to Have
- Docker-based deployment
- Kubernetes-ready architecture
- Real-time execution updates (WebSockets)

### Out of Scope
- Custom n8n node development
- Multi-region deployment
- Offline/desktop mode

---

## Timeline Overview

| Phase | Duration | Milestone |
|-------|----------|-----------|
| Phase 1: Foundation | 4 weeks | Auth + Basic UI + n8n Integration |
| Phase 2: Core Features | 4 weeks | Template Catalog + Credential Manager |
| Phase 3: Activation | 3 weeks | One-Click Deploy + Dashboard |
| Phase 4: Polish | 3 weeks | Error Handling + Testing + Launch |
| **Total** | **14 weeks** | **MVP Launch** |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| n8n API changes break integration | Medium | High | Pin n8n version, monitor releases |
| OAuth providers rate limit us | Medium | Medium | Implement proper token refresh |
| Templates break due to API changes | High | Medium | Monitoring + quick response process |
| Users can't figure out API keys | High | Medium | Step-by-step guides with screenshots |
| n8n licensing issues | Low | Critical | Document this is portfolio project |

---

## Project Naming

**FlowMatic** - Chosen name for this project

Alternatives considered:
- AutoPilot (too generic)
- ZapSimple (too close to Zapier)
- WorkflowHub (boring)
- OneClickAuto (decent but longer)

---

## Repository Structure

```
flowmatic/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Express.js backend
├── packages/
│   ├── database/            # Prisma schema + migrations
│   ├── n8n-client/          # n8n API wrapper
│   └── shared/              # Shared types + utilities
├── templates/               # n8n workflow JSON files
├── docs/                    # Documentation
├── docker/                  # Docker configs
└── scripts/                 # Utility scripts
```

---

## Next Steps

1. Review Technical Specification (02_TECHNICAL_SPECIFICATION.md)
2. Review API Specification (03_API_SPECIFICATION.md)
3. Review Implementation Roadmap (04_IMPLEMENTATION_ROADMAP.md)
4. Set up development environment (05_ENVIRONMENT_SETUP.md)
5. Begin Phase 1 implementation
