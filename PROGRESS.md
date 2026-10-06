# Progress Tracker

This file is updated whenever a project changes state. A project is **Complete** only when it meets every item in the [Definition of Done](ARCHITECTURE.md#16-definition-of-done-per-project).

_Last updated: 2026-10-06_

## Summary

| Metric | Value |
| --- | --- |
| Projects planned | 56 |
| Complete | 0 |
| In progress | 0 |
| Remaining | 56 |
| Current phase | **Foundation:** roadmap and repository architecture defined, awaiting review |
| Next up | Project 01 — Signals (reactive state library), together with the repository CI workflow |
| Deployed (live URL) | 0 |

## Project status

Legend: **Status** is Planned, In progress, or Complete. **Tests** shows the passing count from the latest run (`—` until implementation). **Docker** shows whether the image builds and its health check passes (verified in CI where Docker is unavailable locally). **Deployment** is "Not deployed", "Deployment-ready", or a live URL.

| # | Project | Status | Tests | Build | Docker | Deployment |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | Signals — Reactive State Library | Planned | — | — | n/a | Not deployed |
| 02 | Forge — Project Scaffolding CLI | Planned | — | — | n/a | Not deployed |
| 03 | Focus Guard — MV3 Browser Extension | Planned | — | — | n/a | Not deployed |
| 04 | Offline-First Markdown Notes | Planned | — | — | — | Not deployed |
| 05 | Accessible Design System | Planned | — | — | n/a | Not deployed |
| 06 | Browser Image Editor | Planned | — | — | n/a | Not deployed |
| 07 | Full-Text Search Engine Library | Planned | — | — | n/a | Not deployed |
| 08 | Streaming Log Analytics CLI | Planned | — | — | n/a | Not deployed |
| 09 | HTTP Framework from Scratch | Planned | — | — | — | Not deployed |
| 10 | OpenAPI → TypeScript SDK Generator | Planned | — | — | n/a | Not deployed |
| 11 | Spreadsheet Engine | Planned | — | — | n/a | Not deployed |
| 12 | Authentication & Identity Service | Planned | — | — | — | Not deployed |
| 13 | Inventory & Order Management API | Planned | — | — | — | Not deployed |
| 14 | Multi-Author Developer Blog | Planned | — | — | — | Not deployed |
| 15 | Group Expense Splitter | Planned | — | — | — | Not deployed |
| 16 | Appointment Booking Platform | Planned | — | — | — | Not deployed |
| 17 | GraphQL Reading Community | Planned | — | — | — | Not deployed |
| 18 | Job Board & Applicant Tracking | Planned | — | — | — | Not deployed |
| 19 | Event Ticketing & Check-in | Planned | — | — | — | Not deployed |
| 20 | E-Commerce Storefront with Stripe | Planned | — | — | — | Not deployed |
| 21 | Feature Flag Service | Planned | — | — | — | Not deployed |
| 22 | Cloud File Storage | Planned | — | — | — | Not deployed |
| 23 | Real-Time Team Chat | Planned | — | — | — | Not deployed |
| 24 | Collaborative Whiteboard | Planned | — | — | — | Not deployed |
| 25 | WebRTC Video Meetings | Planned | — | — | — | Not deployed |
| 26 | Video Streaming Platform | Planned | — | — | — | Not deployed |
| 27 | Bulk Data Import (ETL) | Planned | — | — | — | Not deployed |
| 28 | Multi-Channel Notifications | Planned | — | — | — | Not deployed |
| 29 | Product Search Service | Planned | — | — | — | Not deployed |
| 30 | API Gateway & Rate Limiter | Planned | — | — | — | Not deployed |
| 31 | Social News Feed at Scale | Planned | — | — | — | Not deployed |
| 32 | Fleet Telematics Platform | Planned | — | — | — | Not deployed |
| 33 | Multiplayer Arena Game | Planned | — | — | — | Not deployed |
| 34 | Workflow Automation Engine | Planned | — | — | — | Not deployed |
| 35 | Web Change Monitor | Planned | — | — | — | Not deployed |
| 36 | Document Q&A (RAG) | Planned | — | — | — | Not deployed |
| 37 | Meeting Intelligence | Planned | — | — | — | Not deployed |
| 38 | AI Ticket Triage Pipeline | Planned | — | — | — | Not deployed |
| 39 | MCP Server Toolkit | Planned | — | — | — | Not deployed |
| 40 | AI Text-to-SQL Analyst | Planned | — | — | — | Not deployed |
| 41 | AI Customer Support Agent | Planned | — | — | — | Not deployed |
| 42 | AI PR Review Bot | Planned | — | — | — | Not deployed |
| 43 | Autonomous Research Agent | Planned | — | — | — | Not deployed |
| 44 | LLM Evaluation Platform | Planned | — | — | — | Not deployed |
| 45 | Uptime Monitoring & Status Pages | Planned | — | — | — | Not deployed |
| 46 | Edge Image CDN | Planned | — | — | — | Not deployed |
| 47 | Zero-Knowledge Secrets Vault | Planned | — | — | — | Not deployed |
| 48 | OAuth 2.1 / OIDC Provider | Planned | — | — | — | Not deployed |
| 49 | Webhook Delivery Platform | Planned | — | — | — | Not deployed |
| 50 | Privacy-First Web Analytics | Planned | — | — | — | Not deployed |
| 51 | Micro-Frontend Platform | Planned | — | — | — | Not deployed |
| 52 | Multi-Tenant PM SaaS | Planned | — | — | — | Not deployed |
| 53 | Form Builder SaaS | Planned | — | — | — | Not deployed |
| 54 | Services Marketplace | Planned | — | — | — | Not deployed |
| 55 | Mini CI/CD Runner | Planned | — | — | — | Not deployed |
| 56 | Capstone: Event-Driven Delivery | Planned | — | — | — | Not deployed |

## Technology coverage

"Planned in" comes from the roadmap. "Implemented in" lists only projects that are **Complete**, so this table shows what is actually demonstrated today.

| Area | Technology / concept | Planned in | Implemented in |
| --- | --- | --- | --- |
| Language | TypeScript (strict) | All projects except 02, 03, 08 | — |
| Language | Modern JavaScript with JSDoc type checking | 02, 03, 08, 50 (tracker) | — |
| Frontend | React (Vite SPAs) | 01, 04, 05, 06, 11, 15, 17, 19, 21–29, 31, 32, 34, 35, 37, 38, 40, 41, 43, 46, 47, 48, 49, 50, 51, 56 | — |
| Frontend | Next.js (App Router) | 14, 16, 18, 20, 36, 44, 45, 52, 53, 54, 56 | — |
| Frontend | Accessibility (WAI-ARIA, axe) | 05 (focus), every UI project | — |
| Frontend | PWA / offline-first | 04, 19, 56 | — |
| Frontend | Web Components | 41, 53 | — |
| Frontend | Micro-frontends (Module Federation) | 51 | — |
| Frontend | Browser extension (MV3) | 03 | — |
| Frontend | Canvas / WebGL | 06, 11, 24, 33 | — |
| Backend | Express 5 | 04, 12, 15, 19, 22, 23, 24, 26, 27, 28, 34, 35, 37, 39, 40, 41, 43, 48, 51 | — |
| Backend | Fastify | 13, 21, 29, 31, 38, 47, 49, 50, 56 | — |
| Backend | Hono (edge-ready) | 46 | — |
| Backend | Framework internals (`node:http`, undici) | 09, 30 | — |
| API | REST + OpenAPI 3.1 + Problem Details | 12, 13, and every service project | — |
| API | GraphQL | 17 | — |
| Real time | WebSockets | 23, 24, 25, 32, 33, 41, 55, 56 | — |
| Real time | Server-Sent Events | 17, 19, 21, 26, 28, 40, 41, 43, 52, 54 | — |
| Real time | WebRTC | 25 | — |
| Real time | MQTT | 32 | — |
| Real time | CRDTs (Yjs) | 24 | — |
| Auth | JWT access + rotating refresh tokens | 12, 19, 22, 23, 24, 26, 31 | — |
| Auth | Server-side sessions | 04, 15, 17, 35, 37 | — |
| Auth | OAuth / OpenID Connect (client) | 14, 18, 20, 52 | — |
| Auth | OAuth 2.1 / OIDC (provider) | 48, 39 (MCP remote auth) | — |
| Auth | TOTP 2FA / WebAuthn passkeys | 12, 48 / 47 | — |
| Auth | API keys with scopes | 13, 21, 28, 30, 38, 44, 49, 52 | — |
| Data | PostgreSQL | 12–18, 20–22, 24, 26–29, 31–33, 35–38, 40–45, 47–50, 52, 54–56 | — |
| Data | Row-level security | 40, 52 | — |
| Data | pgvector | 36, 38, 41 | — |
| Data | PostGIS / time partitioning | 32 | — |
| Data | MongoDB | 19, 23, 34, 53 | — |
| Data | Redis | 12, 19, 23, 26, 28, 30, 31, 33, 45, 56 | — |
| Data | SQLite (`node:sqlite`) | 04, 51 | — |
| Data | DuckDB (columnar) | 50 | — |
| Data | IndexedDB | 04, 06, 11 | — |
| Data | Object storage (S3-compatible) | 18, 22, 26, 53 | — |
| Integrations | Stripe (Checkout, Billing, Connect) | 20, 52, 54, 56 | — |
| Integrations | GitHub API / GitHub Apps | 42, 55 | — |
| Integrations | Public APIs (ECB rates, Open Library, Have I Been Pwned) | 15, 17, 12 and 47 | — |
| AI | Claude API (streaming, tool use, structured output, batches) | 36–44 | — |
| AI | Agents and tool use | 39, 40, 41, 42, 43 | — |
| AI | Model Context Protocol | 39 | — |
| AI | Local models (embeddings, Whisper) | 36, 37, 38, 41, 44 | — |
| AI | RAG, evaluation, guardrails | 36, 41, 44 | — |
| Automation | Workflow engines, browser automation, CI | 02, 34, 35, 55 | — |
| Processing | Files, images, video, audio, documents | 06, 08, 22, 26, 27, 36, 37, 46 | — |
| Async | Background jobs and queues | 26, 27, 28, 31, 34, 35, 37, 38, 42, 43, 44, 45, 49, 55 | — |
| Async | Transactional outbox / sagas | 28, 29, 56 | — |
| Messaging | Notifications (email, SMS, push, in-app) | 12, 16, 18, 20, 28, 45 | — |
| Search | Full-text search (custom, Postgres, Meilisearch, hybrid) | 07, 14, 18, 29, 36 | — |
| Performance | Caching strategies | 14, 29, 30, 31, 46 | — |
| Performance | Benchmarks and load tests | 01, 07, 08, 09, 27, 30, 31, 32, 33, 46, 49, 50, 56 | — |
| Security | Security-focused projects | 12, 34, 40, 47, 48, 49, 55 | — |
| SaaS | Multi-tenancy | 40, 52, 53 | — |
| Architecture | Microservices / event-driven | 56 | — |
| Testing | Vitest unit and integration | All projects | — |
| Testing | Property-based testing (fast-check) | 01, 07, 11, 15, 16, 21, 24, 31, 33, 45, 46, 47, 53, 54 | — |
| Testing | Playwright end-to-end | Every UI project | — |
| DevOps | Docker / Compose | Every service project | — |
| DevOps | CI/CD (GitHub Actions) | Repository-wide, 55 | — |
| DevOps | Kubernetes | 56 | — |
| DevOps | Observability (Prometheus, OpenTelemetry, Grafana) | 30, 56 | — |

## Features implemented

Filled in per project as each one completes: the main and advanced features that work end to end, and anything deferred to "Future improvements".

_No projects implemented yet._

## Tests completed

| # | Project | Unit | Integration | E2E | Coverage (domain) | Last run |
| --- | --- | --- | --- | --- | --- | --- |
| — | _No projects implemented yet._ | | | | | |

## Environment verification log

Facts verified on the development machine, so that architecture decisions rest on evidence rather than assumptions.

| Date | Check | Result |
| --- | --- | --- |
| 2026-10-06 | Toolchain | Node.js 26.7.0, npm 11.19.0, Python 3.14.7, GitHub CLI 2.101.0 (not logged in). **Not installed:** Docker, WSL, pnpm, PostgreSQL, Redis, MongoDB, ffmpeg. |
| 2026-10-06 | PGlite 0.5.8 (PostgreSQL 18.3, WASM) | Passed: pgvector, PostGIS, `btree_gist` exclusion constraint, `pg_trgm`, row-level security with a non-superuser role |
| 2026-10-06 | `pglite-socket` 0.2.11 + `pg` driver | Passed: queries and a rolled-back transaction over the Postgres wire protocol |
| 2026-10-06 | `embedded-postgres` 18.4.0-beta.17 | Passed: native server started; five concurrent claimers → exactly one winner |
| 2026-10-06 | `mongodb-memory-server` (MongoDB 8.2.6) | Passed: replica set + multi-document transaction. First attempt was stopped by a time limit during the 819 MB download; the retry completed (~102 s including download). |
| 2026-10-06 | npm 11 install scripts | npm blocks dependency install scripts by default and lists them for approval. Projects document any script that must be approved. |

## Repository milestones

| Date | Milestone |
| --- | --- |
| 2026-10-06 | Foundation: git configuration, architecture and engineering standards, 56-project roadmap (5 tiers), project index, progress tracker, contribution guide, AI-assistance policy, README template, Markdown link checker |
