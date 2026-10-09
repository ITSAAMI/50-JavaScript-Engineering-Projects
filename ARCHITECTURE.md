# Repository Architecture & Engineering Standards

This document defines how the repository is organized and the standards every project must meet. Individual projects may go beyond these rules. They may not go below them without a documented reason in their README.

---

## 1. Principles

1. **Working software over volume.** A project is listed as complete only when its features work end to end, its tests pass, and its README matches what the code does. Placeholder features are never documented as finished.
2. **Each project stands alone.** Any project can be copied out of this repository and run on its own. Projects never import code from each other.
3. **Production habits, portfolio scope.** Every project uses validation, error handling, security headers, structured logging, tests, and containerization, even when its feature scope is deliberately bounded.
4. **Honest history.** Commits reflect the real order of work. No backdated commits, no invented authorship, and AI assistance is disclosed (see [AI_ASSISTANCE.md](AI_ASSISTANCE.md)).
5. **Verifiable on a laptop.** Every project's automated tests run with `npm test` on a machine with Node.js only. Infrastructure that cannot be embedded is documented and runs in CI (see §6).

---

## 2. Repository layout

```
.
├── README.md               # Overview, index, methodology, learning roadmap
├── PROJECTS.md             # Structured table of all projects
├── PROGRESS.md             # Live progress tracker
├── ARCHITECTURE.md         # This file
├── CONTRIBUTING.md         # Workflow, commit conventions, review checklist
├── AI_ASSISTANCE.md        # How AI tools are used in this repository
├── docs/
│   ├── roadmap/            # Full 14-point specification of every project, by tier
│   └── templates/          # README template used by every project
├── projects/
│   ├── 01-signals-reactive-state/
│   ├── 02-project-scaffolder-cli/
│   └── ...                 # NN-kebab-case-name, one folder per project
├── scripts/                # Repository tooling (CI change detection, checks)
└── .github/
    └── workflows/          # CI: lint, typecheck, test, build, docker build
```

Project folders are created when their implementation starts, not ahead of time.

### Why independent projects instead of a workspace monorepo

| Option | Verdict |
| --- | --- |
| pnpm/npm workspace with one root lockfile | Rejected. Installing one project would pull dependencies for 56. Version conflicts between projects (React, Next.js, ORMs) would couple unrelated work. |
| **Independent projects, each with its own `package-lock.json`** | **Chosen.** `cd projects/NN-x && npm ci && npm test` works in isolation. CI tests only the projects that changed. |

Projects that need several packages (for example a server, an SDK, and a dashboard) use **npm workspaces inside the project folder**.

---

## 3. The project contract

Every project must provide the following. CI relies on this contract.

| Item | Requirement |
| --- | --- |
| `package.json` | `"type": "module"`, `"engines": { "node": ">=24" }`, `"private": true` (unless the project is a publishable library) |
| `npm run lint` | ESLint flat config with zero errors |
| `npm run typecheck` | `tsc --noEmit` (TypeScript projects) or `tsc` with `checkJs` (JSDoc projects) |
| `npm test` | Unit and integration tests. Must pass with **no external services running**. |
| `npm run build` | Production build (where the project has a build step) |
| `npm run dev` | Local development with reload (where applicable) |
| `npm run test:e2e` | Playwright end-to-end tests (UI projects) |
| `.env.example` | Every environment variable, with safe defaults and comments |
| `README.md` | Follows [docs/templates/PROJECT_README.md](docs/templates/PROJECT_README.md) |
| `Dockerfile` | Multi-stage, non-root user, health check (every deployable service) |
| `compose.yaml` | Full local stack with real infrastructure (projects with services) |

---

## 4. Project archetypes

Most projects fit one of these shapes. The roadmap names the archetype for each project, and the folder structures in the roadmap extend these baselines.

### A. Library (TypeScript, published-package quality)
```
src/            # Public API in index.ts, internals in separate modules
test/           # Vitest unit and property-based tests
bench/          # Benchmarks (vitest bench / tinybench)
examples/       # Runnable usage examples
```
Built with `tsup` into ESM and CJS with `.d.ts` files. `publint` and `attw` (are-the-types-wrong) verify the package exports.

### B. CLI tool
```
bin/            # Executable entry (#!/usr/bin/env node)
src/commands/   # One module per command
src/core/       # Pure logic, unit-tested without I/O
test/           # Tests run against temporary directories
```

### C. Single-page application (Vite + React)
```
src/app/        # App shell, routing, providers
src/features/   # Feature modules: components, hooks, state, api per feature
src/shared/     # Reusable UI, hooks, utilities
src/lib/        # Framework-agnostic logic (pure, unit-tested)
e2e/            # Playwright specs
```
The code is organized by **feature folders, not file types**. Domain logic lives in `src/lib` and is tested without React.

### D. Next.js application (App Router)
```
src/app/             # Routes, layouts, route handlers, server actions
src/components/      # UI components
src/server/          # Server-only code: db, services, auth ("server-only" import guard)
src/server/db/       # Schema, migrations, seed
src/lib/             # Shared pure logic and validation schemas
e2e/
```

### E. API service (Express 5 / Fastify / Hono)
```
src/
├── app.ts            # App factory (no listen) so tests can mount it
├── server.ts         # Process entry: listen, graceful shutdown
├── config/           # Zod-validated environment
├── modules/<domain>/ # routes → controller → service → repository
├── middleware/       # auth, validation, rate limiting, error handler
├── db/               # client, schema, migrations, seed
├── jobs/             # background workers (if any)
└── lib/              # errors, logger, utilities
test/
├── unit/
└── integration/      # HTTP-level tests with supertest/light-my-request
```
Layering rule: **routes** parse and validate input, **services** hold business logic and know nothing about HTTP, **repositories** are the only layer that talks to the database.

### F. Multi-package project (npm workspaces inside the project)
```
apps/        # Deployables: api, web, worker
packages/    # Shared within this project only: sdk, schemas, ui
```

---

## 5. Technology baseline

These defaults apply unless a project's goal is to demonstrate an alternative. Exact versions are pinned in each project's lockfile at implementation time.

| Concern | Default | Alternatives demonstrated in specific projects |
| --- | --- | --- |
| Runtime | Node.js 24 LTS (verified locally on Node 26) | Edge runtimes (Hono), browser-only |
| Language | TypeScript, `strict: true` | Modern JavaScript with JSDoc + `checkJs` (projects 02, 03, 08) |
| Frontend | React 19 + Vite | Next.js App Router, Web Components, browser extension |
| Styling | CSS Modules / Tailwind CSS v4 | Design-token CSS variables (project 05) |
| HTTP server | Express 5 | Fastify (13, 21), Hono (46), from-scratch `node:http` (09) |
| Validation | Zod | JSON Schema / TypeBox (Fastify projects) |
| PostgreSQL access | Drizzle ORM + SQL migrations | Raw `pg` with hand-written SQL (12), Prisma (14, 18) |
| MongoDB access | Official `mongodb` driver | Mongoose (23) |
| Caching / pub-sub / queues | Redis (ioredis) + BullMQ | Postgres `SKIP LOCKED` queues, NATS JetStream (56) |
| Testing | Vitest, Supertest, Testing Library, Playwright, axe-core | k6/autocannon (load), fast-check (property-based) |
| Logging | pino (structured JSON) | OpenTelemetry (56) |
| Linting / formatting | ESLint flat config + typescript-eslint, Prettier | |
| AI | Anthropic Claude via `@anthropic-ai/sdk` | Local models via transformers.js (embeddings, Whisper) |

---

## 6. Local infrastructure strategy

The development machine for this repository has **no Docker**. So that automated tests stay genuinely runnable, the strategy uses three layers. Each layer uses **real database engines, not mocks**.

| Layer | Purpose | How it runs |
| --- | --- | --- |
| **1. Unit tests** | Pure domain logic | No infrastructure |
| **2. Integration tests** (`npm test`) | Repositories, HTTP routes, migrations, SQL behavior | Embedded real engines started by the test runner (table below) |
| **3. Full local stack** (`docker compose up`) | Running the complete app with every dependency | `compose.yaml` per project. Also used by CI. |

### Embedded engines, verified on this machine (Windows 11, Node 26.7, 2026-10-06)

| Engine | Package | Verified behavior |
| --- | --- | --- |
| PostgreSQL 18.3 (WASM, in-process) | `@electric-sql/pglite` 0.5.8 | Queries, transactions, **row-level security**, **exclusion constraints** (`btree_gist`), `pg_trgm`, **pgvector** (`@electric-sql/pglite-pgvector`), **PostGIS** (`@electric-sql/pglite-postgis`) |
| PostgreSQL over the wire protocol | `@electric-sql/pglite-socket` 0.2.11 | Standard `pg` driver connects with a normal `postgres://` URL, including transactions |
| PostgreSQL 18.4 (native server) | `embedded-postgres` 18.4.0-beta.17 | Real multi-connection server. A five-client concurrent claim race produced exactly one winner. |
| MongoDB 8.2.6 (native `mongod`) | `mongodb-memory-server` | Single-node replica set with a committed multi-document transaction. The first run downloads an ~800 MB archive on Windows, so all projects share one cache via `MONGOMS_DOWNLOAD_DIR` (documented in each MongoDB project's README). |

**Rules for choosing an engine in tests:**
- **PGlite** is the default for Postgres integration tests: fast and isolated per test file.
- PGlite is a **single backend**, so it cannot reproduce concurrent transactions. Tests for race conditions, locking, `SKIP LOCKED` queues, or isolation levels **must use `embedded-postgres`** (locally) or the CI Postgres service.
- **MongoDB** uses `mongodb-memory-server`, which downloads and runs a real `mongod`. Replica-set mode enables transactions.
- **MQTT** uses Aedes (an in-process broker). **Analytics storage** uses DuckDB (embedded).
- **Redis** has no embeddable server on Windows. Code that depends on Redis sits behind a small interface with an in-memory implementation and a Redis implementation. Both implementations are real and tested. Redis-backed tests run when `REDIS_URL` is set (CI service container, Docker, or a Windows-compatible server such as Memurai). BullMQ projects require a real Redis for their integration suite, and the README states this plainly.
- **Docker-only services** (Meilisearch, MinIO, NATS, Mailpit, Grafana stack) run through `compose.yaml` and CI. Where an official native binary exists (Meilisearch, MinIO, NATS), the README documents it as a no-Docker option.

---

## 7. Testing strategy

| Level | Tooling | Required for |
| --- | --- | --- |
| Unit | Vitest | All domain logic: parsers, rules engines, pricing, scheduling, algorithms |
| Property-based | fast-check | Algorithms with invariants: CRDT merges, money allocation, search ranking, parsers |
| Integration | Vitest + Supertest / `app.inject` + embedded DBs | Every HTTP endpoint (happy path, validation failure, auth failure, not-found, conflict) |
| Component | Testing Library + `vitest-axe` | Interactive components, including accessibility assertions |
| End-to-end | Playwright | Critical user journeys in every UI project |
| Contract | OpenAPI schema validation of responses | Public REST APIs |
| Load | k6 or autocannon, with results committed to README | Performance-focused projects (09, 30, 31, 46, 50) |
| Security | Tests for authz boundaries, injection attempts, rate limits | Every project with auth |

**Coverage:** service and domain layers enforce a minimum of 80% line coverage in `vitest.config`. UI and wiring code are covered by E2E tests rather than coverage numbers. A test that only exists to raise coverage is not acceptable.

---

## 8. External services and test doubles

Some features depend on paid or account-bound services. The policy:

| Service | Development / CI | Live use |
| --- | --- | --- |
| Anthropic Claude | A provider interface. Automated tests use a **scripted fake model** so the agent loop, tool dispatch, and error paths are tested deterministically. | Real API when `ANTHROPIC_API_KEY` is set. Live smoke tests are gated behind that variable. |
| Stripe | Stripe **test mode** keys and webhook signatures generated with the official SDK's test helpers | Test mode only. Live keys are never used. |
| Email | SMTP to Mailpit (compose) or Nodemailer's stream transport in tests | Any SMTP provider |
| SMS / push | Twilio test credentials / locally generated VAPID keys | Real provider credentials |
| GitHub | Recorded webhook fixtures and signature verification tests | A GitHub App installed on a test repository |

**Rule:** a fake is never described as the real integration. Each README states which integrations were exercised live and which were tested only against fakes or test mode.

---

## 9. Security baseline

Every project with a server or user data must meet this baseline. The roadmap lists additional, project-specific measures.

- **Input validation** at every trust boundary (HTTP bodies, query strings, headers, env, files, webhooks, LLM output) with Zod or JSON Schema.
- **Parameterized queries only.** Never build SQL or Mongo filters from string concatenation of user input.
- **Passwords:** Argon2id (`@node-rs/argon2`) with parameters at or above the OWASP minimum.
- **Tokens:** short-lived access tokens. Refresh tokens are stored hashed and rotated, with reuse detection. Cookies are `HttpOnly; Secure; SameSite`.
- **Authorization** is checked in the service layer (not only in the UI), with tests proving that cross-user and cross-tenant access is denied.
- **HTTP hardening:** security headers (helmet or equivalent), a strict CORS allowlist, request body size limits, rate limiting on authentication and expensive endpoints, and CSRF protection for cookie-authenticated mutations.
- **Secrets** come from environment variables only and are validated at startup. `.env` is git-ignored, and `.env.example` contains no real values.
- **File uploads:** size limits, MIME sniffing (not trusting the extension), randomized storage keys, never served from the application origin without `Content-Disposition`.
- **Dependencies:** `npm audit --omit=dev` runs in CI, and lockfiles are committed.
- **LLM features:** model output is treated as untrusted input. Tools enforce permissions server-side, and prompts never contain secrets.
- **Errors** never leak stack traces or internal identifiers to clients in production.

---

## 10. API conventions (REST)

- Resource-oriented URLs under `/api/v1`. Plural nouns, kebab-case.
- JSON bodies use camelCase. Timestamps are ISO-8601 UTC. Money is integer minor units plus an ISO-4217 currency code.
- **Errors use RFC 9457 Problem Details** (`application/problem+json`), with a stable `type`, a human `title`, `status`, `detail`, and field-level `errors` for validation failures.
- **Pagination is cursor-based** (`?limit=&cursor=`), returning `{ data, nextCursor }`. Offset pagination is used only where random page access is a feature.
- **Idempotency:** `POST` endpoints that create payments, orders, or messages accept an `Idempotency-Key` header.
- **Concurrency:** mutable resources expose `ETag`, and updates accept `If-Match` (optimistic locking).
- **Documentation:** OpenAPI 3.1, generated from the same schemas used for validation and served at `/docs`.
- Health endpoints: `GET /healthz` (process is up) and `GET /readyz` (dependencies reachable).

---

## 11. Errors, logging, and observability

- A small `AppError` hierarchy (`ValidationError`, `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `RateLimitError`) is mapped to Problem Details by a single error-handling middleware.
- Unexpected errors are logged with full context and returned as a generic 500.
- Logs are structured JSON through **pino**, with a request ID propagated through `AsyncLocalStorage` and returned in the `X-Request-Id` header. Secrets and tokens are redacted.
- Every service shuts down gracefully: stop accepting connections, drain in-flight requests and jobs, then close database pools.
- Project 56 adds OpenTelemetry tracing, Prometheus metrics, and Grafana dashboards across services.

---

## 12. Configuration

- One `config` module per project parses `process.env` with Zod **at startup** and exits with a readable error listing every invalid variable.
- The rest of the code imports typed config, never `process.env` directly.
- `.env.example` documents every variable. Variables with safe local defaults (ports, embedded DB paths) let `npm run dev` work without editing anything.

---

## 13. Containerization and deployment

- **Dockerfile:** multi-stage (deps → build → runtime), `node:24-slim` or distroless runtime, production dependencies only, non-root `USER`, `HEALTHCHECK`, and an OCI labels block.
- **compose.yaml:** the app plus real infrastructure (PostgreSQL, Redis, MongoDB, Mailpit, MinIO, Meilisearch, NATS) with health-checked `depends_on`.
- **Deployment targets** are documented per project (for example a container platform for services, a static host for SPAs, a serverless/edge platform for Next.js and Hono, and an extension store for project 03).
- **Deployment status is reported honestly.** "Deployment-ready" means the container builds and runs in CI. "Deployed" is used only when a live URL exists.

---

## 14. CI/CD

GitHub Actions. The workflow is added with the first project so it can be exercised for real.

1. **Detect changes:** a script lists `projects/*` folders touched by the push or PR.
2. **Matrix per changed project:** `npm ci` → `lint` → `typecheck` → `test` → `build`, on Node 24.
3. **Service-backed integration:** projects declaring `ci.services` in `package.json` get PostgreSQL, Redis, or MongoDB service containers and run their full integration suite against them.
4. **Docker build** for projects with a Dockerfile (build and run the health check, no push).
5. **E2E:** Playwright for UI projects, with the HTML report uploaded as an artifact on failure.
6. **Repository checks:** Markdown link check and `npm audit` for changed projects.

---

## 15. Git workflow

- **Branch per project:** `project/NN-slug`, created from `main`. Repository-wide work uses `foundation/*`, `ci/*`, or `docs/*` branches.
- **Conventional Commits** with the project slug (without its number) as the scope:
  - `feat(auth-service): add TOTP enrollment and verification`
  - `fix(booking): reject slots that cross a DST boundary`
  - `test(feature-flags): cover percentage rollout distribution`
  - Repository-wide changes use the `repo`, `roadmap`, or `ci` scopes.
- One commit = one coherent, working step (the project builds and its existing tests pass at every commit). Commit count is a by-product of real work, never a goal.
- A finished project is merged into `main` with `--no-ff` to preserve its feature history, then tagged `projects/NN-slug/v1.0.0`.
- Commits made with AI assistance carry a `Co-Authored-By` trailer (see [AI_ASSISTANCE.md](AI_ASSISTANCE.md)).

---

## 16. Definition of Done (per project)

A project moves to **Complete** in [PROGRESS.md](PROGRESS.md) only when **all** of these are true:

- [ ] Every feature listed under "Main features" in its roadmap entry works end to end. Deferred items are moved to "Future improvements" in the README, not silently dropped.
- [ ] `npm ci && npm run lint && npm run typecheck && npm test && npm run build` passes from a clean clone.
- [ ] E2E tests pass (UI projects).
- [ ] Authorization, validation, and error paths have tests.
- [ ] The security baseline (§9) is met, and project-specific security items are addressed.
- [ ] README is complete per the template, and every documented command was actually run.
- [ ] `.env.example` is complete. No secrets are committed.
- [ ] Dockerfile and `compose.yaml` exist where applicable. Docker builds are verified in CI when Docker is not available locally.
- [ ] The code was reviewed for dead code, duplication, and naming.
- [ ] PROGRESS.md and PROJECTS.md are updated.
