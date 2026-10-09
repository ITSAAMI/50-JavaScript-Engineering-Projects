# Project Index

All **56 projects**, grouped by tier and ordered by increasing difficulty. Each name links to its full specification (description, use case, stack, features, database, API, authentication, security, testing, deployment, folder structure, and learning objectives).

Status values are **Planned**, **In progress**, and **Complete**. A project is marked Complete only when it meets the [Definition of Done](ARCHITECTURE.md#16-definition-of-done-per-project). Live status, test results, and deployment state are tracked in [PROGRESS.md](PROGRESS.md).

| Difficulty | Count | Meaning |
| --- | --- | --- |
| ★★☆☆☆ Intermediate | 3 | Strong fundamentals; one focused domain |
| ★★★☆☆ Advanced | 11 | Non-trivial algorithms or full application slices |
| ★★★★☆ Senior | 23 | Production concerns: concurrency, scale, security, integrations |
| ★★★★★ Expert | 19 | Distributed, security-critical, or platform-level systems |

---

## Tier 1 — Modern JavaScript, TypeScript & Frontend Engineering

| # | Project | Difficulty | Core stack | Data | Key concepts | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | [Signals — Reactive State Library](docs/roadmap/tier-1-modern-javascript-and-frontend.md#01--signals--fine-grained-reactive-state-library) | ★★☆☆☆ | TypeScript, React adapter | — | Dependency graphs, glitch-free propagation, library packaging | Planned |
| 02 | [Forge — Project Scaffolding CLI](docs/roadmap/tier-1-modern-javascript-and-frontend.md#02--forge--project-scaffolding-cli) | ★★☆☆☆ | Node.js, JSDoc-typed JS | — | Plugin architecture, transactional file writes, Node SEA | Planned |
| 03 | [Focus Guard — MV3 Browser Extension](docs/roadmap/tier-1-modern-javascript-and-frontend.md#03--focus-guard--manifest-v3-browser-extension) | ★★☆☆☆ | JavaScript, Manifest V3, Vite | chrome.storage | Event-driven service worker, declarative blocking, privacy | Planned |
| 04 | [Offline-First Markdown Notes](docs/roadmap/tier-1-modern-javascript-and-frontend.md#04--offline-first-markdown-notes-pwa--sync-server) | ★★★☆☆ | React, Workbox, Express | IndexedDB, SQLite | Service workers, sync protocol, conflict merging | Planned |
| 05 | [Accessible Design System](docs/roadmap/tier-1-modern-javascript-and-frontend.md#05--accessible-design-system--component-library) | ★★★☆☆ | React, Storybook, design tokens | — | WAI-ARIA patterns, focus management, theming | Planned |
| 06 | [Browser Image Editor](docs/roadmap/tier-1-modern-javascript-and-frontend.md#06--browser-image-editor) | ★★★☆☆ | React, Canvas, WebGL2, Workers | IndexedDB | Pixel processing, command pattern, GPU shaders | Planned |
| 07 | [Full-Text Search Engine Library](docs/roadmap/tier-1-modern-javascript-and-frontend.md#07--full-text-search-engine-library) | ★★★☆☆ | TypeScript | Binary index | BM25, Levenshtein automata, relevance evaluation | Planned |
| 08 | [Streaming Log Analytics CLI](docs/roadmap/tier-1-modern-javascript-and-frontend.md#08--streaming-log-analytics-cli) | ★★★☆☆ | Node.js streams, worker threads | — | Backpressure, probabilistic sketches, parallelism | Planned |
| 09 | [HTTP Framework from Scratch](docs/roadmap/tier-1-modern-javascript-and-frontend.md#09--http-framework-from-scratch) | ★★★☆☆ | TypeScript, `node:http` | — | Radix routing, type-level TS, benchmarking | Planned |
| 10 | [OpenAPI → TypeScript SDK Generator](docs/roadmap/tier-1-modern-javascript-and-frontend.md#10--openapi--typescript-sdk-generator) | ★★★☆☆ | TypeScript compiler API, Zod | — | Code generation, JSON Schema, API contracts | Planned |
| 11 | [Spreadsheet Engine](docs/roadmap/tier-1-modern-javascript-and-frontend.md#11--spreadsheet-engine-with-virtualized-grid) | ★★★★☆ | React, TypeScript, Web Worker | IndexedDB | Pratt parser, incremental recalculation, virtualization | Planned |

## Tier 2 — Full-Stack Applications: APIs, Authentication & Data

| # | Project | Difficulty | Core stack | Data | Key concepts | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 12 | [Authentication & Identity Service](docs/roadmap/tier-2-full-stack-apis-auth-data.md#12--authentication--identity-service) | ★★★☆☆ | Express 5, raw SQL, jose | PostgreSQL, Redis | Refresh rotation, TOTP 2FA, RBAC, JWKS | Planned |
| 13 | [Inventory & Order Management API](docs/roadmap/tier-2-full-stack-apis-auth-data.md#13--inventory--order-management-api) | ★★★☆☆ | Fastify, Drizzle | PostgreSQL | Ledger modeling, locking, idempotency keys | Planned |
| 14 | [Multi-Author Developer Blog](docs/roadmap/tier-2-full-stack-apis-auth-data.md#14--multi-author-developer-blog-platform) | ★★★☆☆ | Next.js, Prisma, MDX | PostgreSQL | ISR, safe MDX, SEO, i18n with RTL | Planned |
| 15 | [Group Expense Splitter](docs/roadmap/tier-2-full-stack-apis-auth-data.md#15--group-expense-splitter-with-multi-currency-settlement) | ★★★☆☆ | React, Express 5, Drizzle | PostgreSQL | Money arithmetic, FX rates, debt simplification | Planned |
| 16 | [Appointment Booking Platform](docs/roadmap/tier-2-full-stack-apis-auth-data.md#16--appointment-booking-platform) | ★★★★☆ | Next.js, Temporal, Drizzle | PostgreSQL | Time zones and DST, exclusion constraints | Planned |
| 17 | [GraphQL Reading Community](docs/roadmap/tier-2-full-stack-apis-auth-data.md#17--graphql-reading-community) | ★★★★☆ | GraphQL Yoga, Pothos, urql | PostgreSQL | DataLoader, complexity limits, subscriptions | Planned |
| 18 | [Job Board & Applicant Tracking](docs/roadmap/tier-2-full-stack-apis-auth-data.md#18--job-board--applicant-tracking-system) | ★★★★☆ | Next.js, Prisma, S3 | PostgreSQL, object storage | Multi-role authz, presigned uploads, full-text search | Planned |
| 19 | [Event Ticketing & Check-in](docs/roadmap/tier-2-full-stack-apis-auth-data.md#19--event-ticketing--check-in-platform) | ★★★★☆ | Express 5, React, scanner PWA | MongoDB, Redis | Atomic holds, no-oversell, signed QR, offline sync | Planned |
| 20 | [E-Commerce Storefront with Stripe](docs/roadmap/tier-2-full-stack-apis-auth-data.md#20--e-commerce-storefront-with-stripe) | ★★★★☆ | Next.js, Stripe, Drizzle | PostgreSQL | Webhook idempotency, inventory reservation | Planned |
| 21 | [Feature Flag Service](docs/roadmap/tier-2-full-stack-apis-auth-data.md#21--feature-flag--experimentation-service) | ★★★★☆ | Fastify, React, JS SDK | PostgreSQL | Consistent hashing, SSE streaming, rules engine | Planned |
| 22 | [Cloud File Storage](docs/roadmap/tier-2-full-stack-apis-auth-data.md#22--cloud-file-storage-with-resumable-uploads) | ★★★★☆ | Express 5, tus, React | PostgreSQL, S3 | Resumable uploads, content addressing, Range requests | Planned |

## Tier 3 — Real-Time, Asynchronous & Data-Intensive Systems

| # | Project | Difficulty | Core stack | Data | Key concepts | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 23 | [Real-Time Team Chat](docs/roadmap/tier-3-realtime-async-data-intensive.md#23--real-time-team-chat) | ★★★★☆ | Socket.IO, React | MongoDB, Redis | Horizontal scaling, ordering, gap recovery | Planned |
| 24 | [Collaborative Whiteboard](docs/roadmap/tier-3-realtime-async-data-intensive.md#24--collaborative-whiteboard-crdt) | ★★★★☆ | Yjs, Hocuspocus, Canvas | PostgreSQL | CRDTs, convergence, spatial indexing | Planned |
| 25 | [WebRTC Video Meetings](docs/roadmap/tier-3-realtime-async-data-intensive.md#25--webrtc-video-meetings) | ★★★★☆ | WebRTC, `ws` signaling | — | Perfect negotiation, ICE/TURN, media stats | Planned |
| 26 | [Video Streaming Platform](docs/roadmap/tier-3-realtime-async-data-intensive.md#26--video-streaming-platform-with-hls-transcoding) | ★★★★☆ | BullMQ, ffmpeg, hls.js | PostgreSQL, Redis, S3 | Job flows, HLS transcoding, signed URLs | Planned |
| 27 | [Bulk Data Import (ETL)](docs/roadmap/tier-3-realtime-async-data-intensive.md#27--bulk-data-import-etl-service) | ★★★★☆ | Streams, pg-boss, React | PostgreSQL | Constant-memory ETL, COPY, checkpointing | Planned |
| 28 | [Multi-Channel Notifications](docs/roadmap/tier-3-realtime-async-data-intensive.md#28--multi-channel-notification-service) | ★★★★☆ | BullMQ, MJML, web-push | PostgreSQL, Redis | Transactional outbox, preferences, digests | Planned |
| 29 | [Product Search Service](docs/roadmap/tier-3-realtime-async-data-intensive.md#29--product-search-service) | ★★★★☆ | Meilisearch, Fastify, React | PostgreSQL, Meilisearch | Outbox sync, zero-downtime reindex, relevance | Planned |
| 30 | [API Gateway & Rate Limiter](docs/roadmap/tier-3-realtime-async-data-intensive.md#30--api-gateway--distributed-rate-limiter) | ★★★★★ | undici, Redis Lua | Redis | Rate-limit algorithms, circuit breakers, proxying | Planned |
| 31 | [Social News Feed at Scale](docs/roadmap/tier-3-realtime-async-data-intensive.md#31--social-news-feed-at-scale) | ★★★★★ | Fastify, BullMQ, k6 | PostgreSQL, Redis | Hybrid fan-out, cache invalidation, load testing | Planned |
| 32 | [Fleet Telematics Platform](docs/roadmap/tier-3-realtime-async-data-intensive.md#32--fleet-telematics-platform) | ★★★★★ | MQTT (Aedes), MapLibre | PostgreSQL + PostGIS | Time-series partitioning, geofencing, backpressure | Planned |
| 33 | [Multiplayer Arena Game](docs/roadmap/tier-3-realtime-async-data-intensive.md#33--real-time-multiplayer-arena-game) | ★★★★★ | `ws`, Canvas, binary protocol | PostgreSQL, Redis | Prediction, reconciliation, lag compensation | Planned |

## Tier 4 — AI Engineering, Agents & Automation

| # | Project | Difficulty | Core stack | Data | Key concepts | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 34 | [Workflow Automation Engine](docs/roadmap/tier-4-ai-agents-automation.md#34--workflow-automation-engine) | ★★★★☆ | React Flow, QuickJS (WASM) | MongoDB | Durable execution, leases, sandboxing, SSRF | Planned |
| 35 | [Web Change Monitor](docs/roadmap/tier-4-ai-agents-automation.md#35--web-change-monitor--price-tracker) | ★★★★☆ | Playwright, pg-boss | PostgreSQL | Browser automation, polite crawling, diffing | Planned |
| 36 | [Document Q&A (RAG)](docs/roadmap/tier-4-ai-agents-automation.md#36--document-qa-with-retrieval-augmented-generation) | ★★★★☆ | Next.js, Claude, transformers.js | PostgreSQL + pgvector | Hybrid retrieval, citations, RAG evaluation | Planned |
| 37 | [Meeting Intelligence](docs/roadmap/tier-4-ai-agents-automation.md#37--meeting-intelligence-transcription--action-items) | ★★★★☆ | Whisper (local), Claude, ffmpeg | PostgreSQL | Structured extraction, map-reduce, evidence | Planned |
| 38 | [AI Ticket Triage Pipeline](docs/roadmap/tier-4-ai-agents-automation.md#38--ai-ticket-triage--classification-pipeline) | ★★★★☆ | Fastify, Claude Batches API | PostgreSQL + pgvector | Classification, calibration, human review | Planned |
| 39 | [MCP Server Toolkit](docs/roadmap/tier-4-ai-agents-automation.md#39--model-context-protocol-mcp-server-toolkit) | ★★★★☆ | MCP SDK, OAuth 2.1 | PostgreSQL (target) | Model Context Protocol, tool design, safe data access | Planned |
| 40 | [AI Text-to-SQL Analyst](docs/roadmap/tier-4-ai-agents-automation.md#40--ai-text-to-sql-data-analyst) | ★★★★★ | Claude tool use, SQL AST, Vega-Lite | PostgreSQL (RLS) | Defense in depth, semantic layer, execution accuracy | Planned |
| 41 | [AI Customer Support Agent](docs/roadmap/tier-4-ai-agents-automation.md#41--ai-customer-support-agent) | ★★★★★ | Claude tool use, Web Component | PostgreSQL + pgvector | Tool permissioning, human-in-the-loop, guardrails | Planned |
| 42 | [AI PR Review Bot](docs/roadmap/tier-4-ai-agents-automation.md#42--ai-pull-request-review-bot-github-app) | ★★★★★ | GitHub App, Octokit, Claude | PostgreSQL | Webhooks, diff positions, incremental review | Planned |
| 43 | [Autonomous Research Agent](docs/roadmap/tier-4-ai-agents-automation.md#43--autonomous-research-agent) | ★★★★★ | Claude (web tools), SSE | PostgreSQL | Orchestrator-workers, budgets, claim verification | Planned |
| 44 | [LLM Evaluation Platform](docs/roadmap/tier-4-ai-agents-automation.md#44--llm-evaluation--prompt-management-platform) | ★★★★★ | Next.js, CLI, SDK, Claude | PostgreSQL | Prompt versioning, eval statistics, CI gates | Planned |

## Tier 5 — SaaS, Security, Platform Engineering & Distributed Systems

| # | Project | Difficulty | Core stack | Data | Key concepts | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 45 | [Uptime Monitoring & Status Pages](docs/roadmap/tier-5-saas-security-platform.md#45--uptime-monitoring--public-status-pages) | ★★★★☆ | Next.js ISR, BullMQ | PostgreSQL, Redis | Region quorum, flap detection, SLA math | Planned |
| 46 | [Edge Image CDN](docs/roadmap/tier-5-saas-security-platform.md#46--edge-image-cdn--transformation-service) | ★★★★☆ | Hono, sharp, WASM codecs | Memory + disk cache | HTTP caching, format negotiation, load shedding | Planned |
| 47 | [Zero-Knowledge Secrets Vault](docs/roadmap/tier-5-saas-security-platform.md#47--zero-knowledge-secrets-vault) | ★★★★★ | Web Crypto, Argon2id, WebAuthn | PostgreSQL | Envelope encryption, key hierarchy, threat model | Planned |
| 48 | [OAuth 2.1 / OIDC Provider (SSO)](docs/roadmap/tier-5-saas-security-platform.md#48--oauth-21--openid-connect-identity-provider-sso) | ★★★★★ | Express 5, jose | PostgreSQL | PKCE, PAR, JWKS rotation, SSO | Planned |
| 49 | [Webhook Delivery Platform](docs/roadmap/tier-5-saas-security-platform.md#49--webhook-delivery-platform) | ★★★★★ | Fastify, custom PG queue | PostgreSQL | SKIP LOCKED queue, signing, retries, SSRF | Planned |
| 50 | [Privacy-First Web Analytics](docs/roadmap/tier-5-saas-security-platform.md#50--privacy-first-web-analytics) | ★★★★★ | Fastify, 2 KB tracker | DuckDB, PostgreSQL | Cookieless counting, columnar analytics, funnels | Planned |
| 51 | [Micro-Frontend Platform](docs/roadmap/tier-5-saas-security-platform.md#51--micro-frontend-commerce-platform) | ★★★★★ | Module Federation, React, Vue | SQLite (BFF) | Runtime composition, contracts, rollback | Planned |
| 52 | [Multi-Tenant PM SaaS](docs/roadmap/tier-5-saas-security-platform.md#52--multi-tenant-project-management-saas) | ★★★★★ | Next.js, Stripe Billing | PostgreSQL (RLS) | Tenant isolation, entitlements, per-org SSO | Planned |
| 53 | [Form Builder SaaS](docs/roadmap/tier-5-saas-security-platform.md#53--form-builder-saas-with-embeddable-forms) | ★★★★★ | Next.js, Web Components | MongoDB | DSL and logic engine, embedding, aggregation analytics | Planned |
| 54 | [Services Marketplace (Stripe Connect)](docs/roadmap/tier-5-saas-security-platform.md#54--services-marketplace-with-stripe-connect) | ★★★★★ | Next.js, Stripe Connect | PostgreSQL | Separate charges/transfers, double-entry ledger | Planned |
| 55 | [Mini CI/CD Runner](docs/roadmap/tier-5-saas-security-platform.md#55--mini-cicd-runner) | ★★★★★ | dockerode, WebSocket | PostgreSQL | Job DAGs, container isolation, secret masking | Planned |
| 56 | [Capstone: Event-Driven Delivery Platform](docs/roadmap/tier-5-saas-security-platform.md#56--capstone--event-driven-food-delivery-platform) | ★★★★★ | NATS JetStream, OpenTelemetry, Kubernetes | PostgreSQL per service, Redis | Sagas, outbox/inbox, distributed tracing | Planned |
