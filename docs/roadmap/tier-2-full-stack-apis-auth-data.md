# Tier 2 — Full-Stack Applications: APIs, Authentication & Data

**Projects 12–22.** This tier moves to complete applications with real persistence, authentication, authorization, and third-party integrations. Each project centers on one hard problem that real products face: token security, inventory correctness under concurrency, time zones, money, N+1 queries, payment webhooks, or resumable uploads.

Difficulty scale: ★★☆☆☆ Intermediate · ★★★☆☆ Advanced · ★★★★☆ Senior · ★★★★★ Expert.

---

## 12 · Authentication & Identity Service

**Difficulty:** ★★★☆☆ Advanced · **Archetype:** E (API service) + small React client · **Folder:** `projects/12-auth-service`

**Description**
A standalone authentication service covering the full account lifecycle: registration, email verification, login, refresh-token rotation, password reset, TOTP two-factor authentication, device sessions, and role-based access control. It publishes a JWKS endpoint so other services can verify its tokens.

**Real-world use case**
The identity core that every SaaS product needs, and that companies either build carefully or buy (Auth0, Clerk, Cognito). Getting it wrong leads to account takeover.

**Technology stack**
Express 5 · TypeScript · PostgreSQL via raw `pg` with hand-written SQL migrations · Redis (rate limiting, with an in-memory fallback) · `@node-rs/argon2` · `jose` (asymmetric JWTs + JWKS) · TOTP implemented with `node:crypto` (RFC 6238) · Nodemailer → Mailpit · Zod · pino · React (Vite) reference client · Vitest · Supertest · Playwright

**Main features**
- Registration with email verification (single-use, expiring, hashed tokens)
- Login and logout, access tokens (15 minutes) and refresh tokens (HttpOnly cookie)
- Password reset and password change
- TOTP 2FA: enrollment with QR code, verification, disabling, and one-time recovery codes
- Device sessions: list active sessions and revoke any of them
- RBAC: roles, permissions, and an admin user-management API
- A reference React client demonstrating every flow

**Advanced features**
- **Refresh-token families with reuse detection:** presenting an already-rotated token revokes the whole family
- Asymmetric signing (EdDSA) with key rotation and a public `/.well-known/jwks.json`
- Progressive account lockout and rate limiting per IP and per account (sliding window)
- **Step-up authentication:** sensitive operations require a recent 2FA verification
- Optional breached-password check (Have I Been Pwned k-anonymity range API)
- A security audit log (logins, failures, 2FA changes, token reuse)
- Uniform, timing-safe responses that prevent user enumeration

**Database requirements**
PostgreSQL tables: `users`, `email_verifications`, `password_resets`, `refresh_tokens` (family, parent, hash, revoked_at), `sessions`, `roles`, `permissions`, `role_permissions`, `user_roles`, `totp_credentials` (secret encrypted with AES-256-GCM), `recovery_codes` (hashed), `audit_events`, `signing_keys`. Versioned SQL migrations.

**API requirements**
`POST /auth/register` · `POST /auth/verify-email` · `POST /auth/login` · `POST /auth/login/2fa` · `POST /auth/refresh` · `POST /auth/logout` · `POST /auth/password/forgot` · `POST /auth/password/reset` · `POST /auth/password/change` · `POST /auth/2fa/enroll` · `POST /auth/2fa/confirm` · `DELETE /auth/2fa` · `GET /me` · `GET /me/sessions` · `DELETE /me/sessions/:id` · `GET /admin/users` · `PATCH /admin/users/:id/roles` · `GET /.well-known/jwks.json` · OpenAPI at `/docs`

**Authentication requirements**
This project is the authentication system. Access tokens are bearer JWTs. Refresh tokens are rotating opaque values in an `HttpOnly; Secure; SameSite=Strict` cookie scoped to `/auth`.

**Security considerations**
- Designed against OWASP ASVS Level 2 authentication and session requirements
- CSRF protection on the cookie-based refresh endpoint (SameSite plus an `Origin` check)
- TOTP secrets encrypted at rest; recovery codes and every token stored only as hashes
- No user enumeration via responses or timing
- Password policy based on length and breach status, not composition rules

**Testing requirements**
- Integration tests for every flow, with emails captured by a test transport
- Refresh-token reuse detection and family revocation
- Lockout behavior with a controllable clock
- TOTP against the RFC 6238 test vectors
- Authorization matrix: users cannot reach admin routes or other users' sessions
- A concurrent-refresh race test on real PostgreSQL (`embedded-postgres`)
- Playwright E2E for register → verify → enable 2FA → login

**Deployment strategy**
A container with `compose.yaml` (PostgreSQL, Redis, Mailpit). Signing keys and the encryption key come from secrets. The target is any container platform.

**Folder structure**
```
12-auth-service/
├── apps/
│   ├── api/
│   │   ├── src/modules/   # auth/, sessions/, mfa/, users/, admin/, keys/
│   │   ├── src/middleware/ # authenticate, authorize, rate-limit, csrf
│   │   ├── src/db/migrations/  # 001_users.sql, ...
│   │   └── test/
│   └── web/               # React reference client
├── compose.yaml
└── package.json           # npm workspaces
```

**Learning objectives**
Token-based authentication done safely · session management · two-factor authentication · cryptographic hygiene · RBAC · raw SQL and migrations

---

## 13 · Inventory & Order Management API

**Difficulty:** ★★★☆☆ Advanced · **Archetype:** E (API service) · **Folder:** `projects/13-inventory-order-api`

**Description**
A multi-warehouse inventory and order API built around an append-only stock ledger. Concurrent orders can never oversell. Retries are safe through idempotency keys, and updates use optimistic locking.

**Real-world use case**
Back-office systems for retail and logistics (the core of Shopify, NetSuite, or a WMS), where correctness under concurrency directly costs money.

**Technology stack**
Fastify · TypeScript · TypeBox (JSON Schema) · Drizzle ORM · PostgreSQL · `@fastify/swagger` · pino · Vitest · `embedded-postgres` · PGlite

**Main features**
- Products and SKUs, warehouses, and stock levels per warehouse
- Stock movements: receipts, adjustments, transfers, reservations, and shipments
- Orders with a state machine: `pending → reserved → fulfilled` or `cancelled`
- Partial fulfillment across warehouses
- Cursor pagination, filtering, and sorting on every list endpoint
- Low-stock thresholds with alert events
- Streaming CSV export
- OpenAPI 3.1 documentation at `/docs`

**Advanced features**
- **Append-only ledger:** stock levels are a cache updated in the same transaction as the movement, and a reconciliation job verifies they match
- `SELECT … FOR UPDATE` with **consistent lock ordering** to prevent deadlocks, plus automatic retry on serialization failures (`40001`, `40P01`)
- **Idempotency keys** with request fingerprinting: the same key with a different body returns `422`
- Optimistic locking through `ETag` and `If-Match` (version columns)
- Rate limiting per API key

**Database requirements**
PostgreSQL tables: `products`, `skus`, `warehouses`, `stock_levels` (with version), `stock_movements` (append-only), `orders`, `order_lines`, `reservations`, `idempotency_keys`, `api_keys`. `CHECK (on_hand >= 0)` constraints act as the last line of defense.

**API requirements**
`/api/v1/products` · `/skus` · `/warehouses` · `/stock` (levels and movements) · `/transfers` · `/orders` (create, reserve, fulfill, cancel) · `/reports/stock.csv` · `/api-keys` (admin). Errors use RFC 9457 Problem Details.

**Authentication requirements**
Machine-to-machine API keys (prefixed, shown once, stored hashed) with scopes such as `inventory:read`, `inventory:write`, and `orders:write`. An admin scope manages keys.

**Security considerations**
- Scope checks on every route
- Key prefixes make leaked keys detectable by secret scanners
- Strict schemas with `additionalProperties: false`
- Body size limits

**Testing requirements**
- **Concurrency test:** 50 parallel orders against 10 units produce exactly 10 successes (real PostgreSQL)
- Idempotent replay and conflicting-replay tests
- `ETag` / `If-Match` conflict tests
- State-machine transition tests
- Ledger reconciliation tests
- Responses validated against the OpenAPI schema

**Deployment strategy**
A container plus `compose.yaml` (PostgreSQL). Migrations run as a separate release step before the new version starts.

**Folder structure**
```
13-inventory-order-api/
├── src/
│   ├── modules/       # products/, stock/, orders/, warehouses/, api-keys/
│   ├── plugins/       # auth, idempotency, etag, rate-limit, problem-details
│   ├── db/            # schema.ts, migrations/, tx.ts (retry helper)
│   └── jobs/          # reconciliation
├── test/
│   ├── integration/
│   └── concurrency/
└── compose.yaml
```

**Learning objectives**
Transactional integrity · locking strategies · idempotent API design · optimistic concurrency · ledger-based data modeling · Fastify

---

## 14 · Multi-Author Developer Blog Platform

**Difficulty:** ★★★☆☆ Advanced · **Archetype:** D (Next.js) · **Folder:** `projects/14-developer-blog-platform`

**Description**
A publishing platform for technical writing. Authors write MDX with live preview, editors approve drafts, and posts publish on schedule. Pages are statically regenerated on demand, fully SEO-optimized, and localized (English and right-to-left Urdu UI).

**Real-world use case**
Engineering blogs, documentation portals, and content platforms (Hashnode, dev.to), where performance and SEO drive traffic.

**Technology stack**
Next.js (App Router, Server Components, Server Actions) · TypeScript · Prisma · PostgreSQL · Auth.js (GitHub OAuth) · MDX with Shiki syntax highlighting · Tailwind CSS · `next/og` · Vitest · Playwright · axe

**Main features**
- Roles: reader, author, editor, and admin
- MDX editor with live preview, drafts, and an editorial review workflow
- Scheduled publishing
- Tags, series, reading time, and an automatic table of contents
- Comments with a moderation queue
- RSS/Atom feeds, sitemap, and `robots.txt`
- Generated Open Graph images per post
- Localized UI in English and Urdu, including RTL layout

**Advanced features**
- **On-demand ISR:** publishing calls `revalidateTag`, so pages are static but never stale
- **Safe MDX:** a remark plugin strips ESM imports and JavaScript expressions, and only allowlisted components can render
- Draft preview through Next.js `draftMode`
- Scheduled-publish cron endpoint protected by a secret
- Postgres full-text search over posts
- Batched view counting
- JSON-LD `BlogPosting` structured data
- A Lighthouse performance budget enforced in CI

**Database requirements**
PostgreSQL via Prisma: `User`, `Account`, `Session` (Auth.js), `Post`, `PostRevision`, `Tag`, `Series`, `Comment`, `Review`, `ViewCount`. A `tsvector` column for search.

**API requirements**
Server Actions for authoring and moderation. Route handlers for `/feed.xml`, `/sitemap.xml`, `/api/og`, `/api/cron/publish`, and `/api/search`.

**Authentication requirements**
GitHub OAuth through Auth.js with database sessions. Role-based permissions are enforced in every Server Action.

**Security considerations**
- MDX is code, so author content is compiled with expressions disabled and a component allowlist
- Comments are sanitized and rate limited
- CSRF protection is built into Server Actions; mutations also verify the session role
- Strict CSP with nonces

**Testing requirements**
- Unit tests for the MDX sanitization plugin (malicious inputs) and the publishing state machine
- Server Action authorization tests
- Playwright: author drafts → editor approves → post appears; RTL layout check
- axe accessibility checks on key pages

**Deployment strategy**
Next.js `standalone` output in a container, or a serverless platform with managed PostgreSQL. Scheduled publishing runs via a platform cron.

**Folder structure**
```
14-developer-blog-platform/
├── prisma/            # schema.prisma, migrations/, seed.ts
├── src/
│   ├── app/[locale]/  # (public)/, (dashboard)/, api/
│   ├── components/
│   ├── server/        # auth.ts, posts/, comments/, mdx/
│   ├── i18n/          # en.json, ur.json
│   └── lib/
└── e2e/
```

**Learning objectives**
Next.js rendering strategies (SSG, ISR, dynamic) · Server Actions · content security · SEO engineering · internationalization and RTL

---

## 15 · Group Expense Splitter with Multi-Currency Settlement

**Difficulty:** ★★★☆☆ Advanced · **Archetype:** C + E · **Folder:** `projects/15-expense-splitter`

**Description**
A Splitwise-style app for shared expenses. It supports exact, percentage, and share-based splits, handles multiple currencies with historical exchange rates, and suggests the fewest payments needed to settle a group.

**Real-world use case**
Shared living, travel, and team expenses. The underlying problems (correct money arithmetic, currency conversion, and debt netting) appear in every fintech and billing product.

**Technology stack**
React 19 · Vite · TanStack Query · React Hook Form · Express 5 · TypeScript · Drizzle · PostgreSQL · `express-session` with a PostgreSQL session store · Frankfurter API (ECB reference rates) · Vitest · fast-check · Playwright

**Main features**
- Groups with invite links and members
- Expenses split equally, by exact amounts, by percentages, or by shares
- Expenses in any currency, with balances shown in the group currency
- Per-member balances and recorded settle-up payments
- Debt-simplification suggestions
- Activity feed and comments on expenses
- Receipt image upload
- Recurring expenses (for example monthly rent)
- CSV export

**Advanced features**
- **Money as integer minor units** that respect each currency's exponent (JPY 0, USD 2, KWD 3)
- **Largest-remainder allocation**, so split parts always sum exactly to the total
- Exchange rates snapshotted on each expense, so history stays correct, with a cached daily rate service and a fallback
- **Debt simplification** via a greedy minimum-cash-flow algorithm (at most n−1 transfers), with its limits documented
- Optimistic UI updates with rollback
- An edit history for every expense

**Database requirements**
PostgreSQL: `users`, `sessions`, `groups`, `group_members`, `expenses`, `expense_shares`, `settlements`, `fx_rates`, `recurring_expenses`, `expense_events`, `comments`, `invites`.

**API requirements**
`/api/v1/groups` · `/groups/:id/members` · `/groups/:id/expenses` · `/groups/:id/balances` · `/groups/:id/settle-up/suggestions` · `/groups/:id/settlements` · `/groups/:id/export.csv` · `/invites/:token/accept`

**Authentication requirements**
Email and password with **server-side sessions** stored in PostgreSQL, deliberately contrasting with project 12's stateless JWT approach.

**Security considerations**
- Only group members can read group data; only the creator or a group admin can edit an expense
- Invite tokens expire and can be revoked
- Session fixation prevented by regenerating the session at login
- CSRF tokens on mutations

**Testing requirements**
- **Property-based tests:** allocations always sum to the total and differ by at most one minor unit; simplification preserves every member's net balance
- FX service tests with recorded fixtures, cache expiry, and fallback
- API integration and authorization tests
- Playwright: create a group, add a multi-currency expense, and settle up

**Deployment strategy**
The SPA on a static host and the API as a container, or a single container serving both. Recurring expenses run as a scheduled job.

**Folder structure**
```
15-expense-splitter/
├── apps/
│   ├── web/           # features/groups, features/expenses, features/balances
│   └── api/           # modules/groups, expenses, settlements, fx, recurring
├── packages/
│   └── money/         # Money type, allocation, simplification (pure, property-tested)
└── e2e/
```

**Learning objectives**
Correct money handling · currency conversion · graph-based debt netting · session-based authentication · optimistic UI

---

## 16 · Appointment Booking Platform

**Difficulty:** ★★★★☆ Senior · **Archetype:** D (Next.js) · **Folder:** `projects/16-appointment-booking`

**Description**
A Calendly-style scheduling platform. Providers define availability in their own time zone, clients book in theirs, and the database itself guarantees that no two bookings ever overlap.

**Real-world use case**
Clinics, consultants, salons, and sales teams. Scheduling across time zones and daylight-saving transitions is a classic source of production bugs.

**Technology stack**
Next.js (App Router) · TypeScript · Drizzle · PostgreSQL (`btree_gist`) · Temporal API (native where available, polyfill otherwise) · Auth.js (email magic links) · Nodemailer → Mailpit · ICS generation · Tailwind CSS · Vitest · fast-check · Playwright

**Main features**
- Providers define weekly availability, date overrides (holidays), and service types (duration, buffer time)
- A public booking page that shows slots in the visitor's time zone
- Booking confirmation email with an `.ics` calendar invite
- Reschedule and cancel through signed links (clients need no account)
- Provider dashboard with a week calendar view
- Reminder emails 24 hours and 1 hour before appointments
- Minimum notice, booking horizon, and daily booking caps

**Advanced features**
- **DST-correct slot generation**, tested across New York and London transitions as well as non-DST zones such as Asia/Karachi
- **A PostgreSQL exclusion constraint** (`EXCLUDE USING gist (provider_id WITH =, during WITH &&)`) makes double booking impossible at the database level
- Round-robin team scheduling that assigns the least-booked available member
- Idempotent reminders (unique per booking and reminder kind)
- A secret-token ICS subscription feed for providers' calendars

**Database requirements**
PostgreSQL: `providers`, `teams`, `services`, `availability_rules`, `date_overrides`, `bookings` (`tstzrange` + exclusion constraint), `reminders`, `booking_tokens`, plus Auth.js tables.

**API requirements**
`GET /api/providers/:slug/slots?service=&from=&to=&tz=` · `POST /api/bookings` · `POST /api/bookings/:id/reschedule` · `POST /api/bookings/:id/cancel` · `GET /api/calendar/:token.ics` · Server Actions for provider settings · `/api/cron/reminders`

**Authentication requirements**
Providers sign in with email magic links. Clients manage bookings through HMAC-signed, expiring tokens.

**Security considerations**
- Signed booking tokens with expiry and single-purpose scopes
- Rate limiting and a honeypot field on the public booking form
- Email header-injection prevention
- Minimal personal data stored

**Testing requirements**
- DST transition unit tests (spring-forward gaps, fall-back overlaps)
- **Property-based test:** generated slots never overlap existing bookings and always respect buffers
- **Concurrency test:** 20 simultaneous requests for one slot produce exactly one booking (real PostgreSQL)
- ICS output validated against RFC 5545
- Playwright: book, receive the email in Mailpit, reschedule

**Deployment strategy**
A container or serverless deployment with managed PostgreSQL. Reminders run via a platform cron.

**Folder structure**
```
16-appointment-booking/
├── src/
│   ├── app/           # (public)/[provider]/, (dashboard)/, api/
│   ├── server/
│   │   ├── scheduling/  # slot generation, rules, round-robin (pure)
│   │   ├── bookings/
│   │   ├── reminders/
│   │   └── db/
│   └── lib/ics/
├── test/
└── e2e/
```

**Learning objectives**
Time zones and DST · database-enforced invariants · scheduling algorithms · signed-token flows · calendar standards

---

## 17 · GraphQL Reading Community

**Difficulty:** ★★★★☆ Senior · **Archetype:** F (multi-package) · **Folder:** `projects/17-graphql-reading-community`

**Description**
A Goodreads-style social reading platform built on a code-first GraphQL API. Book data is imported from Open Library. The API solves N+1 queries with DataLoader, uses Relay-style pagination, enforces query complexity limits, and pushes real-time notifications through subscriptions.

**Real-world use case**
GraphQL APIs that serve several clients (web, mobile, partners) with flexible data needs, as at GitHub, Shopify, and Netflix.

**Technology stack**
GraphQL Yoga · Pothos (code-first schema, TypeScript) · DataLoader · Drizzle · PostgreSQL · Open Library API · React 19 + urql with Graphcache (normalized cache) · GraphQL Code Generator · graphql-inspector · Vitest · Playwright

**Main features**
- Book search and import by ISBN or title from Open Library
- Shelves (want to read, reading, read) and reading progress updates
- Ratings and reviews
- Following users and an activity feed
- Book clubs with discussion threads and comments
- Real-time notifications through subscriptions

**Advanced features**
- **Per-request DataLoaders**, with tests that assert the exact number of SQL queries per operation
- Relay cursor connections
- **Query depth and complexity limits** that reject abusive queries before execution
- Trusted documents (persisted-query allowlist) in production
- Field-level authorization via Pothos scope-auth
- Typed error results via union types (`Review | ValidationError`)
- **Breaking-change detection** for the schema in CI
- Cached Open Library responses with rate-limit handling

**Database requirements**
PostgreSQL: `users`, `books`, `authors`, `book_authors`, `shelves`, `shelf_items`, `progress_updates`, `reviews`, `follows`, `activities`, `clubs`, `club_members`, `threads`, `comments`, `notifications`.

**API requirements**
A GraphQL endpoint at `/graphql` (queries, mutations, and subscriptions over SSE) with a versioned, committed schema (`schema.graphql`). GraphiQL is enabled in development only.

**Authentication requirements**
Session cookies, with Yoga's CSRF protection requiring a custom header on mutations. Per-field authorization scopes (for example, a private shelf is visible only to its owner).

**Security considerations**
- Complexity, depth, and alias limits; introspection disabled in production
- Trusted documents only in production
- Error masking, so internal errors never reach clients
- Rate limiting by operation cost

**Testing requirements**
- Operation-level integration tests against the executable schema (PGlite)
- N+1 regression tests that count SQL queries
- Complexity-limit tests
- Subscription delivery tests
- Schema snapshot and breaking-change check
- Playwright E2E for core journeys

**Deployment strategy**
API container and static web client. Schema checks gate CI.

**Folder structure**
```
17-graphql-reading-community/
├── apps/
│   ├── api/
│   │   ├── src/schema/    # builder.ts, types/, queries/, mutations/, subscriptions/
│   │   ├── src/loaders/
│   │   ├── src/services/  # openlibrary/, feed/, notifications/
│   │   └── schema.graphql
│   └── web/               # urql client, generated hooks
└── package.json
```

**Learning objectives**
GraphQL schema design · DataLoader and batching · securing GraphQL · normalized client caching · schema evolution

---

## 18 · Job Board & Applicant Tracking System

**Difficulty:** ★★★★☆ Senior · **Archetype:** D (Next.js) · **Folder:** `projects/18-job-board-ats`

**Description**
A two-sided hiring platform. Companies post jobs and move candidates through a hiring pipeline. Candidates search jobs with full-text relevance ranking and apply with resumes uploaded directly to object storage.

**Real-world use case**
Job boards and applicant tracking systems (Greenhouse, Lever, Indeed). The core patterns are role-based multi-party access, document handling, and search.

**Technology stack**
Next.js (App Router) · TypeScript · Prisma · PostgreSQL full-text search · S3-compatible storage (AWS SDK v3; MinIO in compose, filesystem driver for tests) · Auth.js · `pdfjs-dist` (text extraction) · Nodemailer · Tailwind CSS · dnd-kit · Vitest · Playwright

**Main features**
- Roles: candidate, company member (owner or recruiter), and admin
- Company profiles and job postings (salary range, location, remote, tags)
- Job search with filters and full-text relevance ranking
- Candidate profiles and PDF resume uploads
- Applications with cover letters
- A drag-and-drop **pipeline board** (applied → screening → interview → offer → hired or rejected)
- Recruiter notes and ratings
- Email notifications on status changes
- Saved searches with a daily alert digest
- Admin moderation of postings

**Advanced features**
- **Presigned uploads** with enforced content type and size, plus post-upload verification of the file's magic bytes
- Resume text extraction indexed for recruiter-side search
- Ranking with weighted `tsvector` columns (title > tags > description), `ts_rank_cd`, and a recency boost
- A **stage-transition state machine** with allowed transitions and an audit trail
- Automatic job expiry
- `JobPosting` JSON-LD for search-engine job listings
- Candidate data export and account deletion (GDPR-style)

**Database requirements**
PostgreSQL via Prisma: `User`, `Company`, `CompanyMember`, `Job`, `CandidateProfile`, `Resume`, `Application`, `StageTransition`, `Note`, `SavedSearch`. Generated `tsvector` columns with GIN indexes.

**API requirements**
Server Actions for mutations. Route handlers: `GET /api/jobs` (search), `POST /api/uploads/resume` (presign), `POST /api/uploads/resume/complete`, `GET /api/resumes/:id` (authorized, short-lived signed redirect), `/api/cron/job-alerts`.

**Authentication requirements**
Auth.js with email and GitHub providers. Company-scoped roles are enforced in the service layer.

**Security considerations**
- **Tenant boundary:** recruiters can see only their own company's applications, and tests prove it
- Short-lived signed URLs; uploads stored under random keys and never served as executable content
- File-type verification and size limits on uploads
- Rate limiting on applications

**Testing requirements**
- Authorization matrix tests across roles and companies
- Search ranking tests
- Upload verification tests (spoofed MIME types are rejected)
- State-machine tests
- Playwright: post a job → apply → move through the pipeline

**Deployment strategy**
A container with `compose.yaml` (PostgreSQL, MinIO, Mailpit). Production uses managed PostgreSQL and S3.

**Folder structure**
```
18-job-board-ats/
├── prisma/
├── src/
│   ├── app/           # (public)/jobs, (candidate)/, (employer)/, (admin)/, api/
│   ├── server/        # jobs/, applications/, pipeline/, storage/, search/, alerts/
│   └── components/
└── e2e/
```

**Learning objectives**
Multi-role authorization · direct-to-storage uploads · PostgreSQL full-text search · workflow state machines · privacy compliance

---

## 19 · Event Ticketing & Check-in Platform

**Difficulty:** ★★★★☆ Senior · **Archetype:** F (multi-package) · **Folder:** `projects/19-event-ticketing`

**Description**
A ticketing platform for seated and general-admission events. Seats are held atomically for a few minutes, reservations can never oversell, tickets carry cryptographically signed QR codes, and a check-in scanner works offline at the venue door.

**Real-world use case**
Event ticketing (Eventbrite, Ticketmaster) and any inventory with short-lived holds: flight seats, hotel rooms, limited product drops.

**Technology stack**
Express 5 · TypeScript · MongoDB (official driver, multi-document transactions) · Redis (seat holds with Lua scripts, plus an in-memory fallback) · React 19 + Vite · SVG seat maps · Ed25519 signatures (`node:crypto` / Web Crypto) · `qrcode` · Scanner PWA (`BarcodeDetector` with a zxing-wasm fallback) · Server-Sent Events · Vitest · `mongodb-memory-server` · Playwright

**Main features**
- Organizers create events with seated maps (sections, rows, seats) or general-admission tiers
- Attendees select seats and get a 10-minute hold with a countdown, then confirm the reservation
- Tickets issued with signed QR codes and emailed
- A "My tickets" page
- Organizer dashboard with live reservation and check-in counts
- A check-in scanner PWA that prevents double entry

**Advanced features**
- **Atomic multi-seat holds** via a Redis Lua script (all seats or none)
- **No-oversell guarantee:** a MongoDB transaction converts holds into tickets, backed by a partial unique index on `(eventId, seatId)`
- General-admission capacity enforced with guarded atomic counters
- **Offline check-in:** the scanner verifies signatures with the event's public key and syncs scans later; the first scan wins and duplicates are flagged
- Live seat-map updates via SSE
- A waitlist that automatically offers released seats

**Database requirements**
MongoDB collections: `events` (embedded seat maps), `reservations`, `tickets` (partial unique index), `checkins`, `waitlist`, `users`. Redis keys: `hold:{event}:{seat}` with TTL.

**API requirements**
`GET /api/events` · `GET /api/events/:id/seats` · `GET /api/events/:id/stream` (SSE) · `POST /api/events/:id/holds` · `DELETE /api/holds/:id` · `POST /api/reservations` · `GET /api/me/tickets` · `POST /api/checkin/sync` · organizer CRUD under `/api/organizer/*`

**Authentication requirements**
Email and password with JWT sessions. The organizer role is checked per event. Scanner devices use per-event check-in tokens.

**Security considerations**
- QR payloads are signed (Ed25519), not just encoded, so tickets cannot be forged
- Hold and reserve endpoints are rate limited per user against seat-hoarding bots
- Check-in tokens are scoped to a single event
- Seat IDs validated against the event's map

**Testing requirements**
- **Concurrency test:** 100 parallel attempts for the last 5 seats produce exactly 5 tickets (MongoDB replica set via `mongodb-memory-server`)
- Hold expiry and all-or-nothing hold tests
- Signature verification tests, including tampered payloads
- Offline sync conflict-resolution unit tests
- Playwright: select seats → reserve → ticket → check in

**Deployment strategy**
API container, static web app, and scanner PWA. `compose.yaml` includes a MongoDB replica set, Redis, and Mailpit.

**Folder structure**
```
19-event-ticketing/
├── apps/
│   ├── api/           # modules/events, holds, reservations, tickets, checkin
│   ├── web/           # seat map, checkout, my tickets, organizer dashboard
│   └── scanner/       # offline PWA
├── packages/
│   └── ticket-crypto/ # sign/verify, payload schema (shared)
└── compose.yaml
```

**Learning objectives**
Concurrency control in MongoDB and Redis · Lua scripting · cryptographic signatures · offline-first sync · real-time UI updates

---

## 20 · E-Commerce Storefront with Stripe

**Difficulty:** ★★★★☆ Senior · **Archetype:** D (Next.js) · **Folder:** `projects/20-ecommerce-storefront`

**Description**
A production-style online store: catalog with variants, cart, Stripe Checkout, webhook-driven order processing, inventory reservation during checkout, refunds, and an admin dashboard.

**Real-world use case**
Direct-to-consumer commerce. The patterns here (server-side price authority, webhook idempotency, reservation expiry) apply to any product that takes payments.

**Technology stack**
Next.js (App Router, Server Actions, Suspense streaming) · TypeScript · Drizzle · PostgreSQL · Stripe (Checkout, webhooks, refunds; test mode) · Auth.js · React Email + Nodemailer · Tailwind CSS · Vitest · Playwright

**Main features**
- Catalog with categories, variants (size and color), and images
- Product search and filtering
- Guest cart that merges into the account cart on login
- Checkout through Stripe Checkout Sessions
- Order confirmation emails and order history
- Discount codes and shipping options
- Admin dashboard: products, inventory, orders, and refunds

**Advanced features**
- **Server-side price authority:** line items are always rebuilt from the database, never from client data
- **Webhook processing** with signature verification, an event-ID table for idempotency, and tolerance for out-of-order events
- **Inventory reservation** when a checkout session is created, released on `checkout.session.expired`
- An order state machine
- Admin refunds via the Stripe API, reconciled by webhook
- Tag-based cache revalidation when products change
- `Product` JSON-LD and optimized images

**Database requirements**
PostgreSQL: `products`, `variants`, `categories`, `inventory`, `carts`, `cart_items`, `orders`, `order_items`, `reservations`, `discounts`, `stripe_events`, `refunds`, plus Auth.js tables.

**API requirements**
Server Actions for cart and admin operations. `POST /api/checkout` (create session), `POST /api/webhooks/stripe`, and `GET /api/orders/:id`.

**Authentication requirements**
Auth.js (email and GitHub). Customer and admin roles. Guest checkout is supported.

**Security considerations**
- Webhook signatures verified against the raw request body
- No trust in client-supplied prices, quantities beyond stock, or discount math
- Stripe keys are restricted, test-mode keys only
- Admin routes protected by role checks and audited

**Testing requirements**
- Webhook handler tests using signatures generated with the Stripe SDK's test helper
- Idempotency (duplicate events) and out-of-order event tests
- Reservation expiry and inventory restoration
- A price-tampering test
- Playwright checkout with a Stripe test card (runs only when test keys are configured)

**Deployment strategy**
A container or serverless deployment with managed PostgreSQL. The webhook endpoint is registered per environment. The Stripe CLI forwards webhooks locally.

**Folder structure**
```
20-ecommerce-storefront/
├── src/
│   ├── app/           # (shop)/, (account)/, (admin)/, api/webhooks/stripe/
│   ├── server/        # catalog/, cart/, checkout/, orders/, payments/, inventory/
│   ├── emails/
│   └── components/
├── test/fixtures/stripe-events/
└── e2e/
```

**Learning objectives**
Payment integration · webhook reliability · inventory reservation · Server Components data patterns · commerce domain modeling

---

## 21 · Feature Flag & Experimentation Service

**Difficulty:** ★★★★☆ Senior · **Archetype:** F (multi-package) · **Folder:** `projects/21-feature-flag-service`

**Description**
A LaunchDarkly-style feature flag platform: a management API and dashboard, a rules engine for targeting, deterministic percentage rollouts, and a JavaScript SDK that evaluates flags locally and receives changes by streaming.

**Real-world use case**
Trunk-based development, progressive delivery, kill switches, and A/B tests. Nearly every large product team uses feature flags.

**Technology stack**
Fastify · TypeScript · Drizzle · PostgreSQL · Server-Sent Events · React 19 + Vite dashboard · MurmurHash3 · npm workspaces · Vitest · Playwright

**Main features**
- Projects and environments (development, staging, production)
- Boolean and multivariate flags (string, number, JSON)
- Targeting rules on user attributes (equals, in, contains, semver comparisons, numeric comparisons)
- Reusable user segments
- Percentage rollouts and a kill switch
- Server and client SDK keys per environment
- Dashboard for managing everything above
- Audit log with before and after diffs

**Advanced features**
- **Deterministic bucketing:** `murmur3(flagKey + userKey)`, so raising a rollout percentage never moves existing users out
- **Streaming updates** over SSE with `Last-Event-ID` resume
- SDK **local evaluation** (no network call per evaluation), default fallbacks, and offline bootstrap
- **Client-side SDKs receive only evaluated results**, never the rules or segment membership
- Flag prerequisites with cycle detection
- Scheduled flag changes
- Stale-flag detection from batched evaluation counts
- Optimistic concurrency on flag edits

**Database requirements**
PostgreSQL: `projects`, `environments`, `flags`, `flag_configs` (per environment, versioned), `segments`, `sdk_keys`, `audit_log`, `evaluation_counts`, `scheduled_changes`, `users`, `memberships`.

**API requirements**
Management API: `/api/v1/projects/:p/flags`, `/segments`, `/environments`, `/audit`. SDK API: `GET /sdk/v1/flags` (server key), `GET /sdk/v1/stream` (SSE), `POST /sdk/v1/evaluate` (client key, evaluated results only), `POST /sdk/v1/events` (batched counts).

**Authentication requirements**
Dashboard users with sessions and per-project roles (viewer, editor, admin). SDKs authenticate with environment-scoped keys (server keys are secret; client keys are publishable and limited).

**Security considerations**
- Client keys can never read rule definitions or segment lists
- Rule operators are a safe allowlist (no user-supplied regular expressions)
- Flag changes are audited and attributed to a user
- Key rotation without downtime

**Testing requirements**
- **Distribution test:** 100,000 synthetic users at a 30% rollout land within ±1%
- **Monotonicity property:** increasing a percentage never removes a user from the variation
- Rules-engine unit tests and prerequisite cycle tests
- SSE streaming and resume integration tests
- SDK tests against a real in-process server

**Deployment strategy**
API container, static dashboard, and the SDK as an npm-ready package. `compose.yaml` includes PostgreSQL.

**Folder structure**
```
21-feature-flag-service/
├── apps/
│   ├── api/           # modules/flags, segments, environments, sdk, audit, stream
│   └── dashboard/
├── packages/
│   ├── evaluation/    # pure rules engine + bucketing (shared by API and SDK)
│   └── sdk-js/        # Node + browser SDK
└── package.json
```

**Learning objectives**
Progressive delivery · SDK design · consistent hashing · streaming APIs · rules engines

---

## 22 · Cloud File Storage with Resumable Uploads

**Difficulty:** ★★★★☆ Senior · **Archetype:** C + E · **Folder:** `projects/22-cloud-file-storage`

**Description**
A Dropbox-style file storage service with resumable uploads (tus protocol), content-addressed deduplication, folder sharing, expiring public links, streaming downloads with byte ranges, and per-user quotas.

**Real-world use case**
Cloud drives and every product with user files (document portals, media libraries, data rooms). Large uploads over unreliable networks must resume rather than restart.

**Technology stack**
Express 5 · TypeScript · Drizzle · PostgreSQL · S3-compatible storage (AWS SDK v3; MinIO in compose, filesystem driver locally) · tus 1.0 protocol (server implemented in this project) · `tus-js-client` · `sharp` (thumbnails) · `file-type` · `archiver` · React 19 + Vite · Vitest · Playwright

**Main features**
- Folder tree with upload by drag and drop (files and whole folders)
- **Resumable uploads** that survive page refreshes and network loss
- Streaming downloads with HTTP `Range` support (video seeking works)
- Rename, move, copy, and delete, with a trash and restore (purged after 30 days by a job)
- Sharing with other users (viewer or editor)
- Public share links with expiry, optional password, and download limits
- Image thumbnails and previews for images, PDFs, video, and text
- Per-user storage quota and search by name

**Advanced features**
- tus core protocol plus the creation, termination, and checksum extensions
- **Content-addressed storage** (SHA-256 computed while streaming), with deduplication, reference counting, and garbage collection
- S3 multipart uploads for large files
- **Folder ZIP downloads** streamed on the fly with backpressure
- Folder moves that reject moving a folder into its own descendant
- Quota enforced atomically during upload
- `ETag` and `If-None-Match` support

**Database requirements**
PostgreSQL: `users`, `nodes` (files and folders, materialized path), `blobs` (hash, size, refcount), `uploads` (tus state), `shares`, `share_links`, `quotas`.

**API requirements**
tus endpoints at `/files/uploads` (`POST`, `HEAD`, `PATCH`, `DELETE`, `OPTIONS`). REST: `/api/v1/nodes`, `/nodes/:id/content`, `/nodes/:id/move`, `/nodes/:id/copy`, `/trash`, `/shares`, `/links`, `/s/:token` (public download), `/nodes/:id/zip`.

**Authentication requirements**
JWT access tokens with refresh rotation. Share-link passwords are hashed with Argon2id.

**Security considerations**
- User input never becomes a storage path (keys are content hashes)
- MIME type detected from content, not from the extension
- Downloads served with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`; a separate user-content origin is recommended in production
- Share tokens are 128-bit random values stored hashed
- Authorization evaluated on every node, including permissions inherited from shared folders

**Testing requirements**
- tus conformance tests (resume at offset; a wrong offset returns `409`)
- Deduplication and refcount tests
- `Range` request tests
- Authorization matrix tests for shared folders and links
- A quota race test (real PostgreSQL)
- Playwright: upload, interrupt, resume, and share

**Deployment strategy**
Container plus `compose.yaml` (PostgreSQL, MinIO). Production uses S3 with lifecycle rules; the trash purge and blob garbage collection run as scheduled jobs.

**Folder structure**
```
22-cloud-file-storage/
├── apps/
│   ├── api/
│   │   ├── src/tus/       # protocol handlers, upload state
│   │   ├── src/storage/   # s3 driver, fs driver, content addressing
│   │   ├── src/modules/   # nodes/, shares/, links/, trash/, quota/
│   │   └── src/jobs/      # gc, trash-purge, thumbnails
│   └── web/
└── compose.yaml
```

**Learning objectives**
Upload protocols · object storage · streaming I/O · content addressing · hierarchical authorization
