# FlowMatic - Implementation Roadmap

## Overview

| Phase | Name | Duration | Cumulative |
|-------|------|----------|------------|
| 0 | Setup & Foundation | 1 week | Week 1 |
| 1 | Authentication System | 1.5 weeks | Week 2.5 |
| 2 | Template Catalog | 2 weeks | Week 4.5 |
| 3 | Credential Management | 2 weeks | Week 6.5 |
| 4 | Workflow Engine | 2.5 weeks | Week 9 |
| 5 | Dashboard & Monitoring | 2 weeks | Week 11 |
| 6 | Polish & Testing | 2 weeks | Week 13 |
| 7 | Documentation & Deploy | 1 week | Week 14 |

**Total Estimated Time: 14 weeks** (working ~20-30 hours/week)

---

## Phase 0: Setup & Foundation
**Duration: 1 week (5-7 days)**

### Goals
- Set up development environment
- Initialize project structure
- Configure Docker services
- Establish coding standards

### Tasks

| Task | Est. Hours | Priority | Dependencies |
|------|------------|----------|--------------|
| Initialize monorepo structure | 2h | P0 | - |
| Set up Next.js frontend app | 2h | P0 | Monorepo |
| Set up Express.js backend app | 2h | P0 | Monorepo |
| Configure TypeScript | 2h | P0 | Apps |
| Set up Prisma + database schema | 3h | P0 | Backend |
| Create Docker Compose config | 3h | P0 | - |
| Configure ESLint + Prettier | 1h | P1 | Apps |
| Set up environment variables | 1h | P0 | Docker |
| Initialize n8n instance in Docker | 2h | P0 | Docker |
| Configure n8n API access | 2h | P0 | n8n |
| Create basic API health endpoint | 1h | P0 | Backend |
| Set up Tailwind + shadcn/ui | 2h | P0 | Frontend |
| Create basic layout components | 2h | P1 | Frontend |

### Deliverables
- [ ] Running Docker environment (PostgreSQL, Redis, n8n)
- [ ] Empty Next.js app with Tailwind configured
- [ ] Express API with health check endpoint
- [ ] Prisma schema with initial migrations
- [ ] n8n accessible and API tested

### Definition of Done
```bash
# These should all work:
docker-compose up -d
curl http://localhost:3001/api/health  # Returns { "status": "ok" }
curl http://localhost:5678/api/v1/workflows  # Returns [] (empty)
npm run dev  # Frontend at localhost:3000
```

---

## Phase 1: Authentication System
**Duration: 1.5 weeks (7-10 days)**

### Goals
- Implement user registration and login
- Set up JWT authentication
- Add Google OAuth
- Protect API routes

### Tasks

| Task | Est. Hours | Priority | Dependencies |
|------|------------|----------|--------------|
| Create User model in Prisma | 1h | P0 | Phase 0 |
| Implement password hashing service | 2h | P0 | User model |
| Create auth routes (register/login) | 4h | P0 | Password service |
| Implement JWT generation/validation | 3h | P0 | Auth routes |
| Create refresh token system | 3h | P0 | JWT |
| Add auth middleware | 2h | P0 | JWT |
| Implement /auth/me endpoint | 1h | P0 | Middleware |
| Set up Passport.js for Google OAuth | 4h | P1 | Auth routes |
| Create OAuth callback handler | 3h | P1 | Passport |
| Build login page UI | 4h | P0 | Frontend |
| Build registration page UI | 3h | P0 | Frontend |
| Create auth context/hooks | 3h | P0 | Frontend |
| Implement token storage + refresh | 3h | P0 | Auth context |
| Add protected route wrapper | 2h | P0 | Auth context |
| Create user dropdown component | 2h | P1 | Auth context |

### Deliverables
- [ ] User can register with email/password
- [ ] User can login and receive JWT
- [ ] Protected routes require valid token
- [ ] Token refresh works automatically
- [ ] Google OAuth login works
- [ ] Login/Register UI complete

### API Endpoints Completed
- [x] `POST /auth/register`
- [x] `POST /auth/login`
- [x] `POST /auth/logout`
- [x] `POST /auth/refresh`
- [x] `GET /auth/me`
- [x] `GET /auth/google`
- [x] `GET /auth/google/callback`

---

## Phase 2: Template Catalog
**Duration: 2 weeks (10-14 days)**

### Goals
- Build template data structure
- Create 20+ initial templates
- Build catalog browsing UI
- Implement search and filtering

### Tasks

| Task | Est. Hours | Priority | Dependencies |
|------|------------|----------|--------------|
| Design Template schema in Prisma | 2h | P0 | Phase 0 |
| Create Category schema | 1h | P0 | Template schema |
| Build template JSON schema/types | 2h | P0 | Template schema |
| Create template seeder script | 3h | P0 | Schema |
| **Curate 20 n8n templates** | 8h | P0 | Schema |
| Convert templates to our format | 6h | P0 | Templates |
| Implement GET /templates endpoint | 2h | P0 | Templates seeded |
| Add pagination support | 2h | P0 | GET /templates |
| Add filtering (category, apps) | 3h | P0 | GET /templates |
| Implement search functionality | 3h | P1 | GET /templates |
| Implement GET /templates/:slug | 2h | P0 | Templates |
| Implement GET /templates/categories | 1h | P0 | Categories |
| Build catalog page layout | 4h | P0 | Frontend |
| Create template card component | 3h | P0 | Catalog page |
| Build category sidebar/filter | 3h | P0 | Catalog page |
| Build app filter pills | 2h | P1 | Catalog page |
| Build search bar component | 2h | P1 | Catalog page |
| Create template detail page | 4h | P0 | Template card |
| Build required apps section | 2h | P0 | Detail page |
| Build config fields preview | 2h | P0 | Detail page |
| Add loading states + skeletons | 2h | P1 | All pages |

### Deliverables
- [ ] 20+ templates in database
- [ ] Catalog page with grid of templates
- [ ] Category filtering works
- [ ] App filtering works
- [ ] Search functionality works
- [ ] Template detail page complete
- [ ] Responsive design on mobile

### Template Categories to Include
1. **Lead Management** (5 templates)
   - Lead → Slack notification
   - Lead → CRM + Email
   - Lead → Google Sheets
   - Lead scoring automation
   - Lead assignment workflow

2. **Marketing** (5 templates)
   - Social media cross-posting
   - Email campaign trigger
   - Content calendar sync
   - Newsletter subscriber sync
   - UTM tracking logger

3. **Sales** (4 templates)
   - Deal closed → celebration
   - Pipeline stage notifications
   - Quote follow-up reminder
   - Meeting scheduler sync

4. **Operations** (4 templates)
   - Invoice → accounting sync
   - Order → fulfillment
   - Low stock alert
   - Document approval flow

5. **Support** (2 templates)
   - Ticket escalation
   - Customer feedback collector

---

## Phase 3: Credential Management
**Duration: 2 weeks (10-14 days)**

### Goals
- Implement secure credential storage
- Build OAuth flows for major providers
- Create API key input with guidance
- Test credential validation

### Tasks

| Task | Est. Hours | Priority | Dependencies |
|------|------------|----------|--------------|
| Design Credential schema | 2h | P0 | Phase 0 |
| Implement encryption service | 4h | P0 | Schema |
| Create credential CRUD endpoints | 3h | P0 | Encryption |
| **Set up OAuth for Google** | 4h | P0 | Endpoints |
| **Set up OAuth for Slack** | 4h | P0 | Endpoints |
| **Set up OAuth for HubSpot** | 3h | P1 | Endpoints |
| Build OAuth flow handler | 4h | P0 | OAuth setup |
| Implement token refresh logic | 3h | P0 | OAuth |
| Create credential test endpoint | 3h | P0 | Endpoints |
| Build API key validation helpers | 3h | P1 | Endpoints |
| Build credential manager page | 4h | P0 | Frontend |
| Create "Add Credential" modal | 3h | P0 | Manager page |
| Build OAuth button component | 2h | P0 | Modal |
| Build API key input with guide | 3h | P0 | Modal |
| Create credential card component | 2h | P0 | Manager page |
| Add credential status indicator | 2h | P0 | Card |
| Build credential test button | 2h | P0 | Card |
| Handle credential errors/expiry | 3h | P1 | All |
| Create n8n credential sync service | 4h | P0 | n8n integration |

### Deliverables
- [ ] Credentials encrypted at rest
- [ ] Google OAuth flow works
- [ ] Slack OAuth flow works
- [ ] API key storage works
- [ ] Credential manager UI complete
- [ ] Test credential functionality works
- [ ] n8n credential sync works

### OAuth Providers to Support (MVP)
| Provider | Auth Type | Priority | Complexity |
|----------|-----------|----------|------------|
| Google (Sheets, Gmail, Calendar) | OAuth 2.0 | P0 | Medium |
| Slack | OAuth 2.0 | P0 | Easy |
| HubSpot | OAuth 2.0 | P1 | Medium |
| Notion | OAuth 2.0 | P2 | Easy |

### API Key Providers to Support (MVP)
| Provider | Priority | Validation Method |
|----------|----------|-------------------|
| OpenAI | P0 | Test API call |
| Typeform | P0 | Test API call |
| Mailchimp | P1 | Test API call |
| Stripe | P1 | Test API call |

---

## Phase 4: Workflow Engine
**Duration: 2.5 weeks (12-17 days)**

### Goals
- Build workflow creation from templates
- Implement n8n workflow deployment
- Create activation/deactivation logic
- Build test execution feature

### Tasks

| Task | Est. Hours | Priority | Dependencies |
|------|------------|----------|--------------|
| Design UserWorkflow schema | 2h | P0 | Phase 0 |
| Design WorkflowCredentialMapping | 1h | P0 | UserWorkflow |
| Create n8n API client wrapper | 4h | P0 | n8n setup |
| Implement workflow CRUD endpoints | 4h | P0 | Schema |
| Build template → workflow converter | 6h | P0 | n8n client |
| Implement placeholder replacement | 4h | P0 | Converter |
| Implement credential injection | 4h | P0 | Converter |
| Build workflow activation logic | 4h | P0 | Converter |
| Build workflow deactivation logic | 2h | P0 | Activation |
| Implement test execution | 4h | P0 | Activation |
| Handle n8n API errors gracefully | 3h | P0 | All n8n |
| Build workflow setup wizard UI | 6h | P0 | Frontend |
| Create credential selector step | 4h | P0 | Wizard |
| Create config fields step | 4h | P0 | Wizard |
| Create review & activate step | 3h | P0 | Wizard |
| Build workflow list page | 4h | P0 | Frontend |
| Create workflow card component | 3h | P0 | List page |
| Add activate/deactivate buttons | 2h | P0 | Card |
| Build test execution modal | 3h | P1 | Card |
| Add workflow status indicators | 2h | P0 | Card |

### Deliverables
- [ ] User can create workflow from template
- [ ] Credentials properly injected into n8n
- [ ] Workflow activates in n8n
- [ ] Workflow deactivates properly
- [ ] Test execution works
- [ ] Setup wizard UI complete
- [ ] Workflow list shows all workflows

### n8n API Interactions

```typescript
// Services to implement:
interface N8nClient {
  // Workflows
  createWorkflow(workflow: N8nWorkflow): Promise<{ id: string }>;
  getWorkflow(id: string): Promise<N8nWorkflow>;
  updateWorkflow(id: string, workflow: N8nWorkflow): Promise<void>;
  deleteWorkflow(id: string): Promise<void>;
  activateWorkflow(id: string): Promise<void>;
  deactivateWorkflow(id: string): Promise<void>;
  executeWorkflow(id: string, data?: object): Promise<Execution>;
  
  // Credentials
  createCredential(cred: N8nCredential): Promise<{ id: string }>;
  deleteCredential(id: string): Promise<void>;
  
  // Executions
  getExecutions(workflowId?: string): Promise<Execution[]>;
  getExecution(id: string): Promise<ExecutionDetail>;
}
```

---

## Phase 5: Dashboard & Monitoring
**Duration: 2 weeks (10-14 days)**

### Goals
- Build execution history view
- Create workflow monitoring dashboard
- Implement error notifications
- Add basic analytics

### Tasks

| Task | Est. Hours | Priority | Dependencies |
|------|------------|----------|--------------|
| Design Execution schema | 2h | P0 | Phase 4 |
| Create execution sync from n8n | 4h | P0 | n8n client |
| Implement GET /executions endpoint | 2h | P0 | Schema |
| Implement GET /executions/:id | 2h | P0 | Schema |
| Add execution filtering/pagination | 2h | P0 | Endpoints |
| Build execution webhook handler | 3h | P1 | n8n |
| Implement email error notifications | 4h | P1 | Executions |
| Calculate workflow statistics | 3h | P0 | Executions |
| Build main dashboard page | 6h | P0 | Frontend |
| Create stats cards component | 3h | P0 | Dashboard |
| Build recent activity feed | 3h | P0 | Dashboard |
| Create execution list page | 4h | P0 | Frontend |
| Build execution row component | 2h | P0 | List page |
| Create execution detail modal | 4h | P0 | Row component |
| Add execution status badges | 1h | P0 | Components |
| Build simple charts (success rate) | 3h | P2 | Dashboard |
| Add workflow quick actions | 2h | P1 | Dashboard |
| Build error summary component | 3h | P1 | Dashboard |

### Deliverables
- [ ] Dashboard shows workflow stats
- [ ] Recent executions displayed
- [ ] Execution history page works
- [ ] Execution detail shows steps
- [ ] Error notifications sent
- [ ] Success rate visible

### Dashboard Metrics to Display
```
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard Layout                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Active   │ │ Total    │ │ Success  │ │ Errors   │       │
│  │ Workflows│ │ Runs     │ │ Rate     │ │ Today    │       │
│  │    5     │ │  1,234   │ │  98.5%   │ │    2     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Recent Activity                        │   │
│  │  ✅ Lead Notifier     - 2 min ago                   │   │
│  │  ✅ Order Sync        - 5 min ago                   │   │
│  │  ❌ Email Campaign    - 12 min ago (error)          │   │
│  │  ✅ Lead Notifier     - 15 min ago                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Your Workflows                         │   │
│  │  Quick status of all active workflows               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 6: Polish & Testing
**Duration: 2 weeks (10-14 days)**

### Goals
- Fix bugs and edge cases
- Improve error handling
- Write tests
- Optimize performance
- Improve UX

### Tasks

| Task | Est. Hours | Priority | Dependencies |
|------|------------|----------|--------------|
| Audit and fix all error states | 4h | P0 | All phases |
| Add loading states everywhere | 3h | P0 | Frontend |
| Implement proper 404/500 pages | 2h | P0 | Frontend |
| Add form validation feedback | 3h | P0 | All forms |
| Write unit tests for auth | 4h | P1 | Phase 1 |
| Write unit tests for n8n client | 4h | P1 | Phase 4 |
| Write API integration tests | 6h | P1 | All APIs |
| Write E2E tests (happy path) | 6h | P2 | All |
| Performance audit (Lighthouse) | 2h | P1 | Frontend |
| Optimize images and assets | 2h | P1 | Frontend |
| Add API response caching | 3h | P2 | Backend |
| Review and improve copy/UX | 4h | P1 | All pages |
| Mobile responsiveness fixes | 4h | P1 | All pages |
| Accessibility audit (a11y) | 3h | P2 | Frontend |
| Security audit (headers, etc) | 3h | P1 | Backend |
| Rate limiting implementation | 2h | P1 | Backend |

### Deliverables
- [ ] No critical bugs
- [ ] All error states handled
- [ ] Core tests passing
- [ ] Lighthouse score > 80
- [ ] Mobile-friendly
- [ ] Rate limiting active

### Testing Checklist
```
Auth Tests:
[ ] Register with valid data
[ ] Register with invalid email (should fail)
[ ] Login with correct credentials
[ ] Login with wrong password (should fail)
[ ] Token refresh works
[ ] Protected route blocks unauthenticated

Template Tests:
[ ] List templates returns data
[ ] Filter by category works
[ ] Search works
[ ] Template detail loads

Credential Tests:
[ ] Create API key credential
[ ] OAuth flow completes
[ ] Credential test works
[ ] Delete credential works

Workflow Tests:
[ ] Create workflow from template
[ ] Activate workflow creates in n8n
[ ] Deactivate workflow removes from n8n
[ ] Test execution runs
```

---

## Phase 7: Documentation & Deploy
**Duration: 1 week (5-7 days)**

### Goals
- Write README and setup docs
- Create demo video
- Set up production deployment
- Final polish

### Tasks

| Task | Est. Hours | Priority | Dependencies |
|------|------------|----------|--------------|
| Write comprehensive README | 4h | P0 | All phases |
| Document local setup process | 2h | P0 | Phase 0 |
| Document environment variables | 1h | P0 | All |
| Create architecture diagrams | 2h | P1 | Tech spec |
| Write API documentation | 3h | P1 | API spec |
| Record demo video (3-5 min) | 3h | P0 | Working app |
| Create screenshots for README | 1h | P0 | Working app |
| Set up production Docker config | 3h | P1 | Docker |
| Configure nginx reverse proxy | 2h | P1 | Docker |
| Set up GitHub Actions CI | 3h | P2 | Tests |
| Write deployment guide | 2h | P1 | Deployment |
| Final code cleanup | 2h | P0 | All |
| Create GitHub repo with proper structure | 1h | P0 | All |

### Deliverables
- [ ] README with screenshots
- [ ] Demo video
- [ ] Setup documentation
- [ ] Production Docker config
- [ ] Clean GitHub repo

### README Structure
```markdown
# FlowMatic

> One-click automation for everyone

![Demo](screenshots/demo.gif)

## Features
- 📚 20+ pre-built automation templates
- 🔐 Secure OAuth & API key management
- ⚡ One-click workflow activation
- 📊 Real-time execution monitoring

## Tech Stack
- Frontend: Next.js 14, TypeScript, Tailwind
- Backend: Express.js, Prisma, PostgreSQL
- Automation: n8n (headless)

## Quick Start
... docker-compose up ...

## Screenshots
...

## Architecture
...

## License
MIT
```

---

## Risk Mitigation

### Known Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| n8n API changes | Medium | Pin version, monitor releases |
| OAuth complexity | High | Start with 2 providers, expand later |
| Template maintenance | Medium | Document template format well |
| Scope creep | High | Stick to MVP features only |
| Time underestimate | Medium | Buffer built into each phase |

### Contingency Cuts (if behind schedule)

If running behind, cut in this order:
1. ~~HubSpot OAuth~~ (use API key instead)
2. ~~Charts/analytics~~ (just show numbers)
3. ~~Email notifications~~ (add post-MVP)
4. ~~E2E tests~~ (keep unit tests)
5. ~~Search functionality~~ (browse only)

---

## Weekly Milestones

| Week | Milestone | Checkpoint |
|------|-----------|------------|
| 1 | Dev environment running | Docker + basic apps |
| 2 | Auth system complete | Can login/register |
| 3 | Templates seeded | 20 templates in DB |
| 4 | Catalog UI complete | Can browse templates |
| 5 | OAuth working | Google + Slack |
| 6 | Credential UI complete | Can add/test creds |
| 7 | Workflows deploy to n8n | Can create workflow |
| 8 | Activation works | End-to-end flow |
| 9 | Test execution works | Can test workflows |
| 10 | Dashboard complete | Stats + activity |
| 11 | Execution history | Can view past runs |
| 12 | Bug fixes | Polish pass 1 |
| 13 | Testing complete | All tests pass |
| 14 | Documentation done | Ready for portfolio |

---

## Success Criteria

### MVP Complete When:
- [ ] User can register and login
- [ ] User can browse 20+ templates
- [ ] User can connect Google and Slack via OAuth
- [ ] User can add API keys for other services
- [ ] User can create workflow from template
- [ ] Workflow activates and runs in n8n
- [ ] User can see execution history
- [ ] User can deactivate workflow
- [ ] README and demo video complete
- [ ] Code is clean and documented
