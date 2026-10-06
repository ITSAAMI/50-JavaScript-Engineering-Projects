# Tier 5 — SaaS, Security, Platform Engineering & Distributed Systems

**Projects 45–56.** The final tier combines everything before it into the kinds of systems that companies are built on: multi-tenant SaaS with billing, identity and cryptography, developer platforms, high-throughput data products, frontend platform architecture, and a distributed microservices capstone. The bar here is depth: threat models, invariants proven by tests, and operational concerns (observability, rollout, recovery).

Difficulty scale: ★★☆☆☆ Intermediate · ★★★☆☆ Advanced · ★★★★☆ Senior · ★★★★★ Expert.

> **Infrastructure note:** Project 55 needs Docker to execute pipelines. Project 56 needs NATS JetStream (official native binary or Docker) for its integration suite and Docker Compose for the full system. Their pure logic is tested everywhere; container-dependent tests run in CI and wherever Docker is available.

---

## 45 · Uptime Monitoring & Public Status Pages

**Difficulty:** ★★★★☆ Senior · **Archetype:** D (Next.js) + workers · **Folder:** `projects/45-uptime-monitoring-status-page`

**Description**
A Better Stack / Statuspage-style service. It checks websites, APIs, TCP ports, TLS certificates, and cron heartbeats from several probe regions, opens and resolves incidents automatically with flap protection, escalates alerts, and publishes a fast public status page.

**Real-world use case**
Every online business needs to know when it is down before its customers do, and to communicate incidents transparently.

**Technology stack**
Next.js (App Router, ISR) · TypeScript · Drizzle · PostgreSQL · BullMQ + Redis (job schedulers) · undici (request timing) · `node:tls` · Nodemailer · Recharts · Vitest · Playwright

**Main features**
- Monitor types: HTTP(S) (method, headers, body, expected status, keyword), TCP port, TLS certificate expiry, DNS record, and **heartbeat** (a dead man's switch for cron jobs)
- Check intervals from 30 seconds to 1 hour, from multiple probe regions
- Automatic incident open and close
- Alert channels: email, Slack-compatible webhook, and generic webhook
- **Escalation policies** (notify A; after 10 minutes, notify B)
- Maintenance windows
- Public status page per organization: components, 90-day uptime bars, incident timeline, and email subscribers
- Response-time charts and monthly SLA reports (uptime %, MTTR)

**Advanced features**
- **Region quorum:** an incident opens only when N regions agree, preventing false alarms from one probe's network
- **Flap detection** with confirmation thresholds
- **Jittered scheduling** to avoid synchronized bursts
- **Detailed timing breakdown** (DNS, connect, TLS, time to first byte)
- Incremental uptime rollups (hourly and daily)
- On-demand revalidation of the status page when an incident is updated
- Alert deduplication
- SLA math that excludes maintenance windows correctly

**Database requirements**
PostgreSQL: `organizations`, `monitors`, `regions`, `check_results` (partitioned by time), `uptime_rollups`, `incidents`, `incident_updates`, `alert_channels`, `escalation_policies`, `maintenance_windows`, `status_pages`, `components`, `subscribers`.

**API requirements**
`/api/v1/monitors` · `/incidents` (with updates) · `/alert-channels` · `/escalation-policies` · `/maintenance` · `/status-pages` · `POST /hb/:token` (heartbeat ping) · public: `GET /status/:slug` and `/status/:slug/feed.rss`

**Authentication requirements**
Sessions with organization roles (owner, admin, member). Heartbeat URLs use unguessable tokens. Status pages are public, and subscriber emails are confirmed by double opt-in.

**Security considerations**
- **SSRF protection** for HTTP and TCP monitors (no private or internal addresses)
- Per-organization rate limits on monitor counts and intervals
- Webhook alerts signed with HMAC
- Status pages expose no internal details

**Testing requirements**
- Incident state machine tests (flapping, quorum, recovery)
- **Uptime and SLA calculation tests**, including maintenance exclusions and property-based bounds
- Check executors against local test servers (slow, failing, keyword-missing, and self-signed certificates with near-expiry dates generated during the test)
- Escalation timing tests with a fake clock
- Playwright: monitor down → incident → status page updates

**Deployment strategy**
A Next.js container, probe workers deployable per region, PostgreSQL, and Redis. Status pages can be served from a CDN.

**Folder structure**
```
45-uptime-monitoring-status-page/
├── apps/
│   ├── web/           # Next.js dashboard + public status pages
│   └── probe/         # check executors, region tagging, result reporting
├── packages/
│   ├── checks/        # http, tcp, tls, dns, heartbeat (pure where possible)
│   └── incidents/     # quorum, flapping, escalation, sla math
└── compose.yaml
```

**Learning objectives**
Monitoring system design · distributed agreement for alerting · time-series rollups · incident communication · SLA engineering

---

## 46 · Edge Image CDN & Transformation Service

**Difficulty:** ★★★★☆ Senior · **Archetype:** E (API service) + SDK · **Folder:** `projects/46-edge-image-cdn`

**Description**
An image transformation service in the style of Cloudinary and imgix. Signed URLs describe resizing, cropping, and format conversion. The service negotiates AVIF or WebP from the `Accept` header, caches aggressively, and runs on Node.js (with sharp) or on edge runtimes (with WebAssembly codecs) from the same Hono codebase.

**Real-world use case**
Images are usually the heaviest part of a web page. Responsive, modern-format images served from the edge are one of the biggest wins for performance and Core Web Vitals.

**Technology stack**
Hono (runtime-agnostic) · TypeScript · sharp (Node.js backend) · jSquash WebAssembly codecs (edge backend) · an LRU memory cache plus a disk cache · React `<Image>` component and URL-builder SDK · Vitest · fast-check · autocannon

**Main features**
- URL API, e.g. `/img/{signature}/w_800,h_600,fit_cover,q_75,f_auto/{source}`
- Resize, crop, and fit modes; quality; device pixel ratio
- **Automatic format negotiation** (AVIF > WebP > JPEG) with `Vary: Accept`
- Blurred low-quality placeholders (LQIP)
- Attention-based smart crop
- Sources restricted to allowlisted origins or an S3 bucket
- **HMAC-signed URLs**, so nobody can generate unlimited transformations
- Long-lived immutable cache headers, `ETag`, and `304` responses
- A React `<Image>` component and SDK that generate `srcset` and `sizes`

**Advanced features**
- **Request coalescing:** concurrent requests for the same transformation share one computation
- **CPU-bound concurrency control:** a bounded queue that responds `503` with `Retry-After` under overload instead of collapsing
- Stale-while-revalidate on the multi-tier cache
- **Decompression-bomb protection** (input pixel limits)
- **Two interchangeable backends** (sharp and WebAssembly) passing the same golden tests
- Throughput and latency benchmarks published for each backend

**Database requirements**
None. Caching uses memory and disk. Configuration (origins, signing keys, presets) is file- or environment-based.

**API requirements**
`GET /img/:signature/:options/*source` · `GET /healthz` · `GET /metrics`. The option grammar is documented and versioned.

**Authentication requirements**
HMAC-SHA256 URL signatures with key rotation (multiple active key IDs). Named presets can optionally be served unsigned.

**Security considerations**
- **SSRF protection** on origin fetches (allowlist plus public-IP resolution checks)
- Size and time limits on origin downloads
- Pixel limits on decoding
- SVG input rejected or rasterized safely (no script execution)
- Signature comparison in constant time

**Testing requirements**
- **Property-based tests** for the options parser and serializer (round trip, canonical ordering)
- Signature tests
- Content negotiation tests
- **Golden image tests:** output dimensions, format, and a perceptual-hash similarity check, run against both backends
- Cache behavior tests (`304`, stale-while-revalidate, coalescing)
- SSRF tests and a load-test script

**Deployment strategy**
A Node.js container behind a CDN, plus an edge-runtime deployment using the WebAssembly backend. The README compares their trade-offs.

**Folder structure**
```
46-edge-image-cdn/
├── src/
│   ├── app.ts         # Hono routes (runtime-agnostic)
│   ├── options/       # grammar, parser, canonicalization
│   ├── signing/
│   ├── negotiate/
│   ├── origin/        # fetch, allowlist, ssrf guard
│   ├── transform/     # backends/: sharp, wasm
│   ├── cache/         # lru, disk, single-flight, swr
│   └── adapters/      # node.ts, edge.ts
├── sdk/               # url builder + React <Image>
├── test/golden/
└── bench/
```

**Learning objectives**
HTTP caching in depth · image formats and processing · runtime-agnostic server design · load shedding · signed URL schemes

---

## 47 · Zero-Knowledge Secrets Vault

**Difficulty:** ★★★★★ Expert · **Archetype:** C + E · **Folder:** `projects/47-zero-knowledge-vault`

**Description**
An end-to-end encrypted vault for passwords, notes, and API keys. All encryption happens in the browser: the server stores only ciphertext and can never read user data, even if its database is stolen. Sharing uses public-key cryptography, and accounts are protected with passkeys as a second factor.

**Real-world use case**
Password managers (Bitwarden, 1Password) and secret-sharing tools. The design is a case study in applied cryptography and threat modeling.

**Technology stack**
React 19 + Vite · TypeScript · Web Crypto API (AES-256-GCM, HKDF, X25519) · Argon2id via WebAssembly (`hash-wasm`) · `@simplewebauthn` (passkeys) · Fastify · Drizzle · PostgreSQL · Vitest · fast-check · Playwright (virtual WebAuthn authenticator)

**Main features**
- Account creation with a master password; **the master password never leaves the browser**
- Vault items (logins, secure notes, API keys) encrypted client-side, organized in folders
- Client-side search over decrypted data
- Unbiased password generator
- TOTP codes generated client-side
- **Sharing** items with other users, and revoking access
- Breach check for saved passwords (Have I Been Pwned k-anonymity, computed in the browser)
- Auto-lock after inactivity and automatic clipboard clearing
- Encrypted backup export
- **Recovery key** issued at sign-up (there is no server-side recovery, by design)

**Advanced features**
- **A documented key hierarchy:** master password → Argon2id → master key → HKDF → separate authentication and encryption keys → wrapped account key → per-item keys
- **AES-GCM with associated data** binding each ciphertext to its item ID and version, so ciphertexts cannot be swapped between items
- **Sharing via X25519 key agreement:** item keys wrapped for each recipient's public key; key rotation on revocation
- Changing the master password re-wraps keys without re-encrypting every item
- Versioned ciphertext format (crypto agility)
- Passkeys (WebAuthn) as a second factor
- **A written threat model** (STRIDE), including the honest limitation that a compromised server could serve malicious JavaScript, and the mitigations (CSP, Subresource Integrity, reproducible builds)

**Database requirements**
PostgreSQL: `users` (KDF parameters, salt, hash of the authentication key, public key, wrapped private key), `vault_items` (ciphertext, IV, version), `folders` (encrypted names), `item_shares` (wrapped item key per recipient), `webauthn_credentials`, `sessions`, `audit_events`.

**API requirements**
`POST /api/v1/auth/prelogin` (returns KDF parameters) · `POST /auth/register` · `POST /auth/login` · WebAuthn registration and authentication endpoints · `/items` (CRUD on ciphertext only) · `/folders` · `/shares` · `GET /users/:email/public-key` · `POST /account/rotate-keys`

**Authentication requirements**
The client derives an authentication key from the master password; the server stores only a slow hash of that key. Short-lived sessions. Passkeys as a second factor. Uniform, rate-limited responses.

**Security considerations**
- **Zero knowledge:** tests inspect the database to prove no plaintext or master password reaches the server
- Strict CSP with no third-party scripts, and Subresource Integrity
- Argon2id parameters at or above OWASP recommendations, versioned for future upgrades
- Clipboard cleared automatically; nothing sensitive in `localStorage`
- Every audit event is metadata-only

**Testing requirements**
- **Known-answer tests:** Argon2id (RFC 9106) and HKDF (RFC 5869) test vectors
- **Property-based tests:** encrypt → decrypt round trips for random data
- **Tamper tests:** a flipped bit, a swapped ciphertext, or a replayed old version must fail to decrypt
- Database-inspection tests proving zero knowledge
- Sharing and revocation tests
- Playwright E2E with a virtual WebAuthn authenticator

**Deployment strategy**
A static client (CSP and SRI headers) plus an API container and PostgreSQL. The README covers security headers and key-parameter upgrades.

**Folder structure**
```
47-zero-knowledge-vault/
├── apps/
│   ├── web/
│   │   ├── src/crypto/    # kdf, keys, envelope, sharing, format (versioned)
│   │   ├── src/vault/     # items, folders, search, generator, totp
│   │   └── src/features/
│   └── api/               # modules/auth, webauthn, items, shares, keys
├── docs/threat-model.md
└── e2e/
```

**Learning objectives**
Applied cryptography · key management and envelope encryption · threat modeling · WebAuthn and passkeys · zero-knowledge architecture

---

## 48 · OAuth 2.1 & OpenID Connect Identity Provider (SSO)

**Difficulty:** ★★★★★ Expert · **Archetype:** E + admin UI · **Folder:** `projects/48-oidc-identity-provider`

**Description**
An identity provider that implements OAuth 2.1 and OpenID Connect: authorization code with PKCE, refresh-token rotation, client credentials, ID tokens, discovery, JWKS rotation, consent, introspection, revocation, and logout. Two separate demo applications achieve single sign-on through it, using the standard, independent `openid-client` library to prove interoperability.

**Real-world use case**
"Sign in with …" and enterprise single sign-on (Okta, Auth0, Keycloak, Microsoft Entra ID). Understanding the protocol from the provider's side is rare and valuable.

**Technology stack**
Express 5 · TypeScript · `jose` · Drizzle · PostgreSQL · `@node-rs/argon2` · server-rendered login and consent pages (Eta templates, minimal JavaScript) · React 19 admin UI · `openid-client` (in the demo applications and tests) · Vitest · Playwright

**Main features**
- **Authorization code flow with PKCE** (S256 required)
- Refresh tokens with rotation, and the client-credentials grant
- OpenID Connect: ID tokens, the UserInfo endpoint, discovery (`/.well-known/openid-configuration`), and scopes and claims
- **JWKS publishing with key rotation**
- Consent screen with remembered grants
- Client registration in an admin UI (confidential and public clients)
- Token introspection (RFC 7662) and revocation (RFC 7009)
- RP-initiated logout
- **Single sign-on** across two demo applications

**Advanced features**
- **Pushed Authorization Requests** (PAR, RFC 9126)
- **Authorization-code replay detection:** reusing a code revokes every token issued from it
- `private_key_jwt` client authentication
- Exact redirect-URI matching
- Sender-constrained tokens with DPoP (RFC 9449) as a stretch goal
- Designed against the OAuth 2.0 Security Best Current Practice (RFC 9700)

**Database requirements**
PostgreSQL: `users`, `clients` (hashed secrets, redirect URIs, JWKS URI), `authorization_codes` (single use), `par_requests`, `access_tokens` (for introspection), `refresh_tokens` (family), `consents`, `sessions`, `signing_keys`, `audit_events`.

**API requirements**
`GET /authorize` · `POST /par` · `POST /token` · `GET /userinfo` · `POST /introspect` · `POST /revoke` · `GET /end-session` · `GET /.well-known/openid-configuration` · `GET /jwks` · admin API for clients and users.

**Authentication requirements**
End users sign in with passwords (Argon2id) plus optional TOTP. Clients authenticate with `client_secret_basic` or `private_key_jwt`; public clients rely on PKCE. Admins use a separate role.

**Security considerations**
- No implicit grant and no password grant (removed in OAuth 2.1)
- `state` and `nonce` validated; short-lived, single-use authorization codes
- Consent and login pages protected against clickjacking (`frame-ancestors 'none'`) and CSRF
- Client secrets stored hashed
- Exact redirect-URI matching with no wildcards

**Testing requirements**
- **Protocol tests per RFC requirement,** especially negative cases: wrong PKCE verifier, reused code, mismatched redirect URI, expired code, wrong client
- **Interoperability tests:** `openid-client` acting as a relying party against the provider
- JWKS rotation tests (tokens signed with the previous key still verify during overlap)
- Refresh rotation and reuse tests
- Playwright: log in once and access both demo applications (SSO), then log out of both

**Deployment strategy**
A container with PostgreSQL. Signing keys come from a secret store. The README lists the steps for running the official OpenID conformance suite as future work.

**Folder structure**
```
48-oidc-identity-provider/
├── apps/
│   ├── provider/
│   │   ├── src/endpoints/  # authorize, par, token, userinfo, introspect, revoke, logout, discovery
│   │   ├── src/grants/     # authorization_code, refresh_token, client_credentials
│   │   ├── src/clients/    # authentication methods
│   │   ├── src/keys/       # jwks, rotation
│   │   └── src/views/      # login, consent templates
│   ├── admin/
│   ├── demo-rp-next/       # relying party 1
│   └── demo-rp-express/    # relying party 2
└── e2e/
```

**Learning objectives**
OAuth 2.1 and OpenID Connect in depth · protocol security analysis · key rotation · single sign-on architecture · reading and implementing RFCs

---

## 49 · Webhook Delivery Platform

**Difficulty:** ★★★★★ Expert · **Archetype:** F (multi-package) · **Folder:** `projects/49-webhook-delivery-platform`

**Description**
A Svix-style platform for sending webhooks reliably. Applications publish events once; the platform fans them out to every subscribed endpoint, signs them (Standard Webhooks spec), retries with backoff for days, disables dead endpoints, and gives the receiving customers a portal to manage endpoints and inspect deliveries. The queue is built on PostgreSQL `SKIP LOCKED`.

**Real-world use case**
Every API platform that notifies customers (Stripe, GitHub, Shopify) needs this, and many buy it because reliable delivery is hard to get right.

**Technology stack**
Fastify · TypeScript · Drizzle · PostgreSQL (`FOR UPDATE SKIP LOCKED` queue implemented in this project) · undici · React 19 + Vite (consumer portal) · Producer and verifier SDKs · Vitest · `embedded-postgres`

**Main features**
- Event ingestion API with event types and idempotent event IDs
- Endpoint subscriptions with event-type filters
- **Signed payloads** following the Standard Webhooks specification (`webhook-id`, `webhook-timestamp`, `webhook-signature`)
- Retries on an exponential schedule over several days
- Attempt logs (status, latency, response excerpt)
- Manual resend and **bulk recovery** of failed messages since a given time
- Endpoint health and **automatic disabling** of persistently failing endpoints, with notification
- An embeddable **consumer portal** opened by magic link
- **Secret rotation** with an overlap window during which both signatures are sent
- Verification SDK for receivers

**Advanced features**
- **A hand-built PostgreSQL queue:** `SKIP LOCKED` claiming, leases, visibility timeouts, and a `next_attempt_at` schedule
- **Per-endpoint circuit breakers** that stop hammering failing endpoints
- Optional per-endpoint FIFO ordering
- **SSRF protection** re-checked at delivery time (DNS-rebinding safe)
- A time-partitioned attempts table with retention
- A throughput benchmark (deliveries per second against worker count)

**Database requirements**
PostgreSQL: `applications`, `event_types`, `messages`, `endpoints` (secrets, filters, status), `deliveries` (the queue: state, lease, attempt count, next attempt), `attempts` (partitioned), `portal_tokens`, `api_keys`.

**API requirements**
Producer API: `POST /api/v1/app/:app/msg`, `/app/:app/endpoint` (CRUD), `/endpoint/:id/secret/rotate`, `/endpoint/:id/recover`, `/msg/:id/attempt`. Portal API is scoped by portal token. `GET /metrics`.

**Authentication requirements**
Producers use application API keys. The consumer portal uses short-lived signed tokens scoped to one application. Platform admins use sessions.

**Security considerations**
- SSRF defenses at endpoint creation **and** at delivery time
- Signatures that include a timestamp, so receivers can reject replays (the verifier SDK enforces a tolerance window)
- Endpoint secrets encrypted at rest
- Response excerpts truncated and stored as text only
- Portal tokens scoped and expiring

**Testing requirements**
- Signature tests against Standard Webhooks test vectors
- Retry schedule tests with a fake clock
- **Concurrency test on real PostgreSQL:** many workers draining thousands of deliveries, with no delivery claimed twice concurrently and none lost
- Circuit-breaker and auto-disable tests
- SSRF tests, including DNS rebinding
- Portal authorization tests

**Deployment strategy**
API and delivery-worker containers with PostgreSQL. Workers scale horizontally. The portal is served as a static app.

**Folder structure**
```
49-webhook-delivery-platform/
├── apps/
│   ├── api/           # ingestion, endpoints, recovery, portal API
│   ├── worker/        # claimer, dispatcher, retry scheduler, circuit breakers
│   └── portal/        # consumer-facing UI
├── packages/
│   ├── pgqueue/       # SKIP LOCKED queue (claim, lease, ack, nack)
│   ├── signing/       # Standard Webhooks sign/verify
│   └── sdk/           # producer client + receiver verifier
└── compose.yaml
```

**Learning objectives**
Reliable delivery semantics · building a queue on PostgreSQL · webhook security · resilience patterns · developer-facing platform design

---

## 50 · Privacy-First Web Analytics

**Difficulty:** ★★★★★ Expert · **Archetype:** F (multi-package) · **Folder:** `projects/50-privacy-web-analytics`

**Description**
A Plausible-style analytics product: a tracking script under 2 KB, a high-throughput ingestion pipeline, columnar storage in DuckDB, and dashboards with real-time visitors, sources, goals, and funnels. Unique visitors are counted without cookies using a daily-rotating salted hash, so visits cannot be linked across days.

**Real-world use case**
Website analytics that respect visitor privacy and minimize personal data, an alternative to Google Analytics. Also a study in high-volume event ingestion and analytical query performance.

**Technology stack**
Vanilla JavaScript tracker · Fastify · TypeScript · DuckDB (`@duckdb/node-api`, embedded columnar database) · PostgreSQL + Drizzle (accounts and sites) · `ua-parser-js` v1 (MIT) · a GeoIP country database (openly licensed, with attribution) · React 19 + Vite dashboard · Vitest · jsdom · autocannon

**Main features**
- **Tracking script under 2 KB gzipped:** pageviews, SPA navigation, custom events, outbound links, and file downloads, sent with `sendBeacon`
- Ingestion with bot filtering, referrer classification, UTM parsing, device and browser parsing, and country lookup
- **Cookieless unique visitors** via `hash(daily_salt + site + IP + user agent)`, with the salt destroyed daily
- Dashboard: visitors, pageviews, bounce rate, visit duration, top pages, sources, countries, and devices
- Real-time visitors (last 5 minutes)
- Goals and **funnels**
- Date-range comparison and CSV export
- Shared public dashboards and multiple sites per account

**Advanced features**
- **Batched ingestion** with flush-by-size and flush-by-time, and backpressure
- Session reconstruction (30 minutes of inactivity)
- **Funnel queries** with window functions over ordered event sequences
- Hourly pre-aggregated rollups alongside raw events with retention
- **Benchmarks:** ingestion throughput (events per second) and dashboard query latency on 10 million events
- Size budget for the tracker enforced in CI
- Optional respect for Do Not Track and Global Privacy Control

**Database requirements**
DuckDB: `events` (columnar, partitioned by site and day), `rollups_hourly`, `sessions`. PostgreSQL: `users`, `sites`, `goals`, `funnels`, `shared_links`, `salts` (current day only).

**API requirements**
`POST /api/event` (public ingestion, batched) · dashboard API: `/api/v1/sites/:id/stats/{aggregate,timeseries,breakdown,realtime}`, `/goals`, `/funnels`, `/export` · `GET /js/script.js` (immutable, versioned)

**Authentication requirements**
Account sessions. Ingestion is public and validated against registered site domains. Shared dashboards use revocable link tokens.

**Security considerations**
- **No raw IP addresses or full user-agent strings are stored**
- Ingestion rate limited and payloads strictly validated (no arbitrary properties beyond declared limits)
- Domain validation to reduce spoofed traffic
- The tracker script is dependency-free and served with long-term caching and SRI hashes

**Testing requirements**
- Tracker unit tests (jsdom) and a **gzip size-budget test**
- Ingestion parsing tests (referrer classification, UTM, bot detection)
- Salt rotation and hashing tests
- **SQL correctness tests** for sessions and funnels on fixture event streams
- Load-test scripts with documented results

**Deployment strategy**
An ingestion container (horizontally scalable) and a query/dashboard container. DuckDB is a single-writer database, so the README documents this design and the migration path to ClickHouse at larger scale.

**Folder structure**
```
50-privacy-web-analytics/
├── packages/
│   └── tracker/       # < 2 KB script, size-budget test
├── apps/
│   ├── ingest/        # validate, enrich (ua, geo, referrer), hash, batch writer
│   ├── api/           # stats queries, goals, funnels, export
│   └── dashboard/
├── bench/
└── compose.yaml
```

**Learning objectives**
Privacy-by-design engineering · high-throughput ingestion · columnar analytics and SQL window functions · tiny-script performance engineering · benchmarking

---

## 51 · Micro-Frontend Commerce Platform

**Difficulty:** ★★★★★ Expert · **Archetype:** F (multi-package) · **Folder:** `projects/51-micro-frontend-platform`

**Description**
A storefront assembled at runtime from independently built and deployed micro-frontends using Module Federation 2.0. A shell hosts catalog, cart, and account remotes (one written in a second framework). A manifest registry enables per-remote version pinning and instant rollback without redeploying the shell.

**Real-world use case**
Large organizations (IKEA, Zalando, Spotify) split frontends by team so teams can ship independently. The trade-offs and failure modes are a core frontend-architecture topic.

**Technology stack**
Module Federation 2.0 (`@module-federation/enhanced` with Rsbuild/Rspack) · React 19 · Vue 3 (one remote, mounted through a framework-neutral contract) · TypeScript · a shared design-system package · `@module-federation/dts-plugin` (cross-remote types) · Express 5 BFF with SQLite (`node:sqlite`) · a manifest registry service · Vitest · Playwright

**Main features**
- Shell application: layout, routing, authentication, and remote loading
- Remotes: catalog (React), cart (React), and account (Vue)
- A shared design system with singleton React shared across remotes
- Typed cross-app event bus (custom events) and URL-based state
- A backend-for-frontend API providing products, cart, and user data
- **Each remote is built, tested, and deployed independently**

**Advanced features**
- **Runtime remote discovery** from a manifest registry, with version pinning and one-click rollback
- **Resilience:** error boundaries and fallback UI when a remote fails to load or crashes
- Federated TypeScript types generated across remotes
- **Contract tests** for exposed modules and event schemas
- Shared-dependency deduplication and version-mismatch handling
- Prefetching remotes on hover, and bundle-size budgets per remote
- Path-filtered CI per remote

**Database requirements**
BFF: SQLite (`products`, `carts`, `users`, `sessions`). Registry: a JSON document store on disk listing remote versions and active pins.

**API requirements**
BFF: `/api/products`, `/api/cart`, `/api/session`. Registry: `GET /registry/manifest` (active versions), `POST /registry/remotes/:name/versions` (publish), `POST /registry/remotes/:name/pin` (pin or roll back).

**Authentication requirements**
The shell handles login through the BFF (HttpOnly session cookie). Remotes receive user context from a shell-provided API, never by reading tokens. Registry publishing and pinning require an admin token.

**Security considerations**
- CSP allowing scripts only from registered remote origins
- Remote manifests include integrity hashes, checked before loading
- Registry writes authenticated and audited
- **Documented limitation:** all remotes share one JavaScript realm, so a remote is trusted code

**Testing requirements**
- Unit tests per remote
- Contract tests between the shell and each remote (exposed module interfaces and event payloads)
- Playwright E2E on the composed application
- **Failure-injection test:** a remote is unavailable → fallback UI, while the rest of the app keeps working
- **Rollback test:** pinning a previous version through the registry changes the loaded remote without rebuilding the shell

**Deployment strategy**
Each remote deploys to its own static path or origin; the shell is static; the BFF and registry are containers. The README covers the CDN layout and cache headers for remote entry files.

**Folder structure**
```
51-micro-frontend-platform/
├── apps/
│   ├── shell/
│   ├── remote-catalog/    # React
│   ├── remote-cart/       # React
│   ├── remote-account/    # Vue
│   ├── bff/
│   └── registry/
├── packages/
│   ├── design-system/
│   └── contracts/         # event schemas, mount contracts
└── e2e/
```

**Learning objectives**
Micro-frontend architecture and its trade-offs · Module Federation · independent deployability · runtime composition resilience · cross-team contracts

---

## 52 · Multi-Tenant Project Management SaaS

**Difficulty:** ★★★★★ Expert · **Archetype:** D (Next.js) · **Folder:** `projects/52-multitenant-pm-saas`

**Description**
A Linear-style issue tracker built as a complete multi-tenant SaaS: organizations, invitations, roles, per-organization SSO, seat-based Stripe subscriptions, plan entitlements, a public API, audit logs, and real-time collaboration. Tenant isolation is enforced by PostgreSQL row-level security.

**Real-world use case**
This is the shape of most B2B SaaS businesses. Tenant isolation, billing, and entitlements are where real SaaS products most often get things wrong.

**Technology stack**
Next.js (App Router) · TypeScript · Drizzle · PostgreSQL (row-level security, `LISTEN`/`NOTIFY`) · Auth.js · `openid-client` (per-organization SSO) · Stripe Billing (subscriptions, seats, customer portal; test mode) · Server-Sent Events · Tailwind CSS · cmdk (command palette) · Vitest · Playwright

**Main features**
- Organizations with members and roles (owner, admin, member, guest), and email invitations
- Projects and issues: customizable workflow statuses, priorities, assignees, labels, and cycles (sprints)
- Board and list views, comments with mentions, and activity history
- **Real-time updates** across users
- Keyboard-driven UI with a command palette
- **Billing:** Free, Pro, and Business plans with per-seat pricing, upgrades, downgrades, and the Stripe customer portal
- **Plan entitlements** (project limits, member limits, feature access)
- Per-organization API keys and a public REST API
- Audit log and data export

**Advanced features**
- **Row-level security:** every query runs in a transaction with `set_config('app.current_org', …, true)`; RLS policies on every tenant table; **a missing tenant context returns zero rows**
- Subdomain-based tenant routing (`acme.app.localhost`) in Next.js middleware
- Subscription state driven by Stripe webhooks, with a cached entitlements model
- **Seat synchronization** with proration when members join or leave
- Per-organization OIDC single sign-on (any compliant provider, including project 48)
- Real-time fan-out from `LISTEN`/`NOTIFY` to SSE, per organization
- Usage metering for the public API
- Organization deletion with an asynchronous data-purge job

**Database requirements**
PostgreSQL with RLS on every tenant-scoped table: `organizations`, `memberships`, `invitations`, `projects`, `issues`, `issue_events`, `comments`, `labels`, `cycles`, `workflow_states`, `subscriptions`, `entitlements`, `api_keys`, `api_usage`, `audit_log`, `sso_connections`, `stripe_events`.

**API requirements**
Server Actions for the app. Public REST API: `/api/v1/projects`, `/issues`, `/comments` (API key auth, rate limited, OpenAPI documented). `POST /api/webhooks/stripe` and `GET /api/orgs/:slug/events` (SSE).

**Authentication requirements**
Auth.js with email and OAuth providers, plus per-organization OIDC SSO (enforceable by org admins). Roles enforced in services and backed by RLS.

**Security considerations**
- **Defense in depth:** service-layer authorization plus database-level RLS
- An application database role that cannot bypass RLS (no `BYPASSRLS`, not the table owner)
- API keys hashed and scoped per organization
- Webhooks verified and idempotent
- Audit log of security-relevant actions

**Testing requirements**
- **An RLS isolation suite covering every tenant table:** cross-tenant reads and writes fail, even with hand-crafted queries and a forged `org_id`
- Entitlement enforcement tests (plan limits)
- Stripe webhook and seat-sync tests with fixtures
- Invitation and role tests
- Playwright: sign up → create organization → invite member → upgrade plan (test mode, gated on keys)

**Deployment strategy**
A Next.js container (or serverless) with managed PostgreSQL. Wildcard DNS and TLS for tenant subdomains are documented. Stripe webhooks are configured per environment.

**Folder structure**
```
52-multitenant-pm-saas/
├── src/
│   ├── app/           # (marketing)/, [org]/(app)/, api/v1/, api/webhooks/
│   ├── middleware.ts  # tenant resolution
│   ├── server/
│   │   ├── tenancy/   # tenant context, RLS transaction helper
│   │   ├── billing/   # plans, entitlements, seats, stripe
│   │   ├── issues/
│   │   ├── realtime/
│   │   └── sso/
│   └── components/
├── db/policies/       # RLS policies (SQL)
├── test/isolation/
└── e2e/
```

**Learning objectives**
Multi-tenant architecture · row-level security · subscription billing and entitlements · enterprise SSO · real-time SaaS UX

---

## 53 · Form Builder SaaS with Embeddable Forms

**Difficulty:** ★★★★★ Expert · **Archetype:** D (Next.js) + Web Component · **Folder:** `projects/53-form-builder-saas`

**Description**
A Typeform/Tally-style form builder. Teams design multi-page forms by drag and drop, with conditional logic and calculated fields, then publish them on their workspace subdomain or embed them anywhere through a Web Component. Responses are stored in MongoDB, with drop-off analytics and signed webhooks.

**Real-world use case**
Surveys, lead capture, applications, and onboarding forms. Form builders are a large SaaS category, and the logic engine and embedding are genuinely hard to get right.

**Technology stack**
Next.js (App Router) · TypeScript · MongoDB (official driver, aggregation pipelines) · dnd-kit · a Web Component embed (Shadow DOM) · Zod · S3-compatible storage (file fields) · Auth.js · Vitest · fast-check · `mongodb-memory-server` · Playwright · axe

**Main features**
- Drag-and-drop builder with field types: short and long text, email, number, single and multiple choice, rating, date, file upload, and matrix
- Validation rules per field
- Multi-page forms with a progress indicator
- **Conditional logic:** show or hide fields and skip pages based on earlier answers
- Calculated fields (scores, totals) through a safe expression evaluator
- Themes
- Publishing on `{workspace}.forms.localhost/{form}` or **embedding with `<form-embed>`**
- Responses table with filters and CSV export
- **Analytics:** views, starts, completions, and drop-off per field
- Email notifications and **signed webhooks** on submission
- Save partial progress and resume later
- Workspaces with members and roles

**Advanced features**
- **A form definition DSL** with a logic-graph validator (skip-logic cycles, references to deleted fields)
- **One validation package shared by client and server,** so rules behave identically in both places
- Form versioning: every response records the version it was submitted against
- MongoDB aggregation pipelines for funnel and drop-off analytics
- TTL indexes that expire abandoned partial responses
- **Embed isolation:** Shadow DOM styles, iframe-free rendering, and automatic height via `ResizeObserver`
- Spam protection: honeypot field, time-to-submit check, and rate limits
- WCAG 2.2 AA-compliant rendered forms, and form localization

**Database requirements**
MongoDB: `workspaces`, `members`, `forms` (current draft), `form_versions` (immutable published definitions), `responses` (indexed by form and date), `partial_responses` (TTL), `form_events` (views and field interactions), `webhooks`, `deliveries`.

**API requirements**
Builder Server Actions. Public: `GET /api/forms/:id/definition`, `POST /api/forms/:id/responses`, `PUT /api/forms/:id/partial`, `POST /api/forms/:id/events`. Management: `/api/v1/forms/:id/responses` (with export) and `/api/v1/webhooks`.

**Authentication requirements**
Auth.js for workspace members (roles: owner, editor, viewer). Respondents need no account; partial-response resume uses a signed token.

**Security considerations**
- **Tenant isolation** enforced by a repository layer that always scopes by workspace, backed by tests
- Calculated fields evaluated by a sandboxed expression parser, never `eval`
- Uploaded files type-checked and served as attachments
- Rendered user content escaped; CSP for hosted forms
- Webhook payloads signed

**Testing requirements**
- **Logic engine property tests** (for example, a hidden field is never required, and every reachable page sequence terminates)
- **Client/server validation parity tests**
- Embed component tests (Shadow DOM rendering and resize messages)
- Aggregation pipeline tests on `mongodb-memory-server`
- Tenant isolation tests
- Playwright and axe: build → publish → embed → submit → response appears

**Deployment strategy**
A Next.js container with MongoDB (replica set) and object storage. The embed script is served from a CDN. Wildcard subdomains are documented.

**Folder structure**
```
53-form-builder-saas/
├── apps/
│   ├── web/           # Next.js builder, hosted forms, dashboards
│   └── embed/         # <form-embed> Web Component
├── packages/
│   ├── form-schema/   # DSL types, versioning, graph validation
│   ├── logic/         # conditions, skip logic, expressions (pure)
│   └── validation/    # shared client/server rules
└── e2e/
```

**Learning objectives**
Building a DSL and its runtime · shared validation across client and server · Web Components and embedding · MongoDB aggregation analytics · accessible form design

---

## 54 · Services Marketplace with Stripe Connect

**Difficulty:** ★★★★★ Expert · **Archetype:** D (Next.js) · **Folder:** `projects/54-services-marketplace`

**Description**
A two-sided freelance services marketplace (in the style of Fiverr). Sellers onboard with Stripe Connect; buyers order and pay; funds are held until the delivery is accepted, then transferred to the seller minus a platform fee. Refunds, disputes, and payouts are reconciled against a double-entry ledger.

**Real-world use case**
Marketplaces (Fiverr, Upwork, Airbnb, Etsy) must move money between parties correctly and legally. Payment orchestration plus accounting accuracy is a specialist skill.

**Technology stack**
Next.js (App Router) · TypeScript · Drizzle · PostgreSQL · Stripe Connect (Express accounts, PaymentIntents, separate charges and transfers, Payment Element; test mode) · Auth.js · Server-Sent Events (order messaging) · Tailwind CSS · Vitest · Playwright

**Main features**
- **Seller onboarding** with Stripe Connect Express (account links, capability checks)
- Service listings with packages (basic, standard, premium), categories, and search
- Checkout with the Payment Element, including 3D Secure (SCA) handling
- An **order lifecycle:** placed → in progress → delivered → accepted, with revisions and cancellation
- **Funds held until acceptance,** with auto-acceptance after N days by a scheduled job
- Order messaging between buyer and seller
- Refunds (full and partial) with transfer reversals
- Dispute handling (the order is frozen while a dispute is open)
- Reviews allowed only after a completed order
- Seller earnings dashboard with a link to the Stripe Express dashboard
- Admin: moderation and fee configuration

**Advanced features**
- **Separate charges and transfers** grouped by `transfer_group` for delayed release to sellers
- **A double-entry ledger** recording every movement (charge, platform fee, transfer, refund, reversal, dispute), where the entries of each transaction sum to zero
- **Reconciliation job** comparing the ledger with Stripe balance transactions
- Idempotency keys on every Stripe mutation
- **Connect webhooks** (events for connected accounts) handled idempotently and out of order
- Listing gated on account capabilities (`charges_enabled`, `payouts_enabled`)

**Database requirements**
PostgreSQL: `users`, `seller_accounts` (Stripe account ID and capabilities), `services`, `packages`, `orders`, `order_events`, `messages`, `deliveries`, `reviews`, `ledger_accounts`, `ledger_transactions`, `ledger_entries`, `stripe_events`, `disputes`, `fee_rules`.

**API requirements**
Server Actions for the app. `POST /api/checkout/intent` · `POST /api/connect/onboard` · `POST /api/connect/dashboard-link` · `POST /api/webhooks/stripe` (platform) · `POST /api/webhooks/stripe-connect` (connected accounts) · `GET /api/orders/:id/stream` (SSE) · `/api/cron/auto-accept` and `/api/cron/reconcile`

**Authentication requirements**
Auth.js. Buyer, seller, and admin roles, with order participants checked on every order resource.

**Security considerations**
- Server-side price authority
- Webhook signatures verified for both endpoints, with idempotent processing
- Money movement only from server-side state transitions, never from client calls
- Stripe test-mode keys only, with restricted keys where possible
- Audit trail through the ledger and order events

**Testing requirements**
- Order state machine tests
- **Ledger invariant tests** (every transaction balances to zero; property-based across random order histories)
- Webhook tests with signed fixtures (including Connect events and out-of-order delivery)
- Idempotency tests
- Authorization tests across buyer, seller, and admin
- Auto-accept scheduler tests with a fake clock
- Playwright: onboard seller → list service → buy → deliver → accept → payout recorded (test mode, gated on keys)

**Deployment strategy**
A Next.js container with PostgreSQL. Two webhook endpoints are registered per environment, and scheduled jobs run via a platform cron.

**Folder structure**
```
54-services-marketplace/
├── src/
│   ├── app/           # (marketplace)/, (seller)/, (buyer)/, (admin)/, api/
│   ├── server/
│   │   ├── payments/  # intents, transfers, refunds, connect, webhooks
│   │   ├── ledger/    # double-entry model, posting rules, reconciliation
│   │   ├── orders/    # state machine, auto-accept, disputes
│   │   └── catalog/
│   └── components/
├── test/fixtures/stripe/
└── e2e/
```

**Learning objectives**
Marketplace payment flows · Stripe Connect · double-entry accounting · reconciliation · complex order lifecycles

---

## 55 · Mini CI/CD Runner

**Difficulty:** ★★★★★ Expert · **Archetype:** F (multi-package) · **Folder:** `projects/55-mini-ci-runner`

**Description**
A small GitHub-Actions-style CI system. Pipelines are YAML files in a repository. A push webhook triggers a run; the server schedules a job graph (with matrices and dependencies) onto runner agents, which execute each job's steps in isolated Docker containers and stream logs live. Secrets are masked, artifacts and caches are stored, and commit statuses are reported back to GitHub.

**Real-world use case**
CI/CD is central to every engineering team. Building a runner teaches job scheduling, container isolation, log streaming, and the security model for running untrusted code.

**Technology stack**
Node.js + TypeScript · dockerode (Docker Engine API) · YAML + Zod · `isomorphic-git` · Drizzle · PostgreSQL · WebSocket (log streaming) · React 19 + Vite dashboard · `@octokit/webhooks` · Vitest

**Main features**
- Pipelines defined in `.minici.yml`: jobs, steps, `needs` dependencies, and matrices
- Triggered by GitHub push and pull-request webhooks, or manually
- **Runner agents** that register with the server and pull jobs (long polling)
- Each job runs in a fresh Docker container with the repository checked out
- **Live log streaming** to the dashboard
- Encrypted secrets injected as environment variables and **masked in logs**
- Artifacts upload and download
- Dependency caching keyed by lockfile hash
- Commit statuses reported to GitHub
- Concurrency groups that cancel superseded runs
- Pipeline graph visualization

**Advanced features**
- **Container isolation:** CPU and memory limits, no privileged mode, a read-only root filesystem except the workspace, a restricted network, per-step timeouts, and **never mounting the Docker socket into jobs**
- **Secret masking that survives chunk boundaries** (a secret split across two log chunks is still masked)
- Agent heartbeats, and **job reassignment** when an agent disappears
- Retries for steps marked flaky
- Chunked, persisted logs with backpressure
- Artifact retention policies

**Database requirements**
PostgreSQL: `repositories`, `pipelines`, `runs`, `jobs` (state, agent, lease), `steps`, `log_chunks`, `artifacts`, `caches`, `secrets` (encrypted), `agents`, `webhook_deliveries`.

**API requirements**
`POST /api/webhooks/github` · dashboard API: `/api/v1/repos`, `/runs`, `/runs/:id/jobs`, `/jobs/:id/logs` (WebSocket stream), `/secrets`, `/artifacts`. Agent API: `POST /agent/register`, `POST /agent/jobs/claim` (long poll), `POST /agent/jobs/:id/logs`, `POST /agent/jobs/:id/complete`, `POST /agent/heartbeat`.

**Authentication requirements**
Dashboard sessions. Agents use registration tokens exchanged for per-agent credentials. GitHub webhooks are HMAC-verified. The GitHub integration uses a least-privilege token or App.

**Security considerations**
- **Pipeline code is untrusted:** strict container sandboxing, no host mounts beyond the workspace, and resource limits
- **Secrets are never exposed to pull requests from forks**
- Secrets encrypted at rest and masked in all output
- Agents authenticated and able to claim only jobs matching their labels

**Testing requirements**
- Pipeline parser and validation tests
- Job DAG and matrix expansion tests
- **Secret masking tests,** including secrets split across chunks and encoded variants
- Scheduler, lease, and reassignment tests with a fake clock
- **Container execution tests run where Docker is available** (CI runners, and locally once Docker is installed); they are skipped with a clear message otherwise
- Webhook signature tests

**Deployment strategy**
A server container with PostgreSQL. Agents run on hosts with Docker. The README documents the isolation model and its limits (for example, when to use microVMs instead).

**Folder structure**
```
55-mini-ci-runner/
├── apps/
│   ├── server/        # webhooks, scheduler, dag, leases, logs hub, github status
│   ├── agent/         # claim loop, docker executor, log shipper, masking
│   └── web/           # runs, live logs, pipeline graph, secrets
├── packages/
│   ├── pipeline-spec/ # YAML schema, matrix expansion, DAG
│   └── masking/
└── examples/          # sample repositories with .minici.yml
```

**Learning objectives**
CI/CD internals · container isolation and the Docker API · distributed job scheduling · log streaming at scale · secure execution of untrusted code

---

## 56 · Capstone — Event-Driven Food Delivery Platform

**Difficulty:** ★★★★★ Expert · **Archetype:** F (multi-package, microservices) · **Folder:** `projects/56-event-driven-delivery-platform`

**Description**
A food-delivery system built as event-driven microservices: orders, payments, restaurants, dispatch, and notifications, each owning its database, communicating through NATS JetStream, and coordinated by a saga with compensating actions. It is fully observable with OpenTelemetry tracing, metrics, and logs, runs locally with Docker Compose, and ships Kubernetes manifests. Customer, restaurant, and courier apps complete the system.

**Real-world use case**
The architecture of DoorDash, Uber Eats, and Foodpanda: many services, money, and people coordinating in real time, where partial failure is normal and must be handled correctly.

**Technology stack**
Node.js + TypeScript · Fastify (services) · NATS JetStream · PostgreSQL (database per service) + Drizzle · Redis (`GEO` commands for courier locations) · Stripe (test-mode PaymentIntents: authorize and capture) · OpenTelemetry · Prometheus · Grafana · Loki · Tempo · AsyncAPI · Next.js (customer app) · React (restaurant dashboard) · courier PWA · WebSocket (live tracking) · Docker Compose · Kubernetes (Kustomize) · Vitest · k6

**Main features**
- **Customer app:** browse restaurants and menus, order, pay, and track the courier live
- **Restaurant dashboard:** accept or reject orders, set preparation time, mark orders ready
- **Courier PWA:** go online, receive delivery offers, update status and location
- Services: `gateway` (BFF), `orders`, `payments`, `restaurants`, `dispatch`, and `notifications`
- **Order-placement saga:** create order → authorize payment → restaurant accepts → courier assigned → capture payment on delivery
- **Compensations:** void the authorization if the restaurant rejects; reassign or cancel if no courier is found; refund on cancellation after capture

**Advanced features**
- **Transactional outbox** in every service, and **idempotent consumers** (inbox table)
- **Saga orchestration** with persisted state, timeouts, and resumption after a service crash
- **Event contracts in AsyncAPI,** validated in consumer contract tests
- Nearest-available courier matching with Redis geospatial queries
- **Distributed tracing across HTTP and NATS** (context propagated in message headers)
- Prometheus metrics, Grafana dashboards, and Loki logs correlated by trace ID
- Kubernetes manifests: Deployments, Services, HPA, readiness and liveness probes, ConfigMaps, and Secrets via Kustomize overlays
- **Chaos test:** kill a service mid-saga and verify the order still reaches a consistent final state
- A load test with k6

**Database requirements**
One PostgreSQL database per service: `orders` (orders, saga_state, outbox, inbox), `payments` (payments, outbox, inbox), `restaurants` (restaurants, menus, availability), `dispatch` (couriers, assignments), `notifications` (deliveries). Redis for courier geolocation. JetStream streams per domain.

**API requirements**
Gateway REST API for the apps (OpenAPI documented). Inter-service communication through events and commands on NATS subjects (`orders.created`, `payments.authorized`, `restaurant.accepted`, `dispatch.assigned`, and so on), each specified in AsyncAPI. WebSocket for live tracking.

**Authentication requirements**
JWTs issued by the gateway for customers, restaurant staff, and couriers, with role claims. Service-to-service calls authenticated through NATS credentials (per-service accounts and subject permissions).

**Security considerations**
- Per-service NATS permissions (a service can publish only to its own subjects)
- No shared databases between services
- Payment logic isolated in one service; Stripe keys never shared
- Every event schema-validated on consumption
- Secrets via Kubernetes Secrets (sealed or external secret stores documented)

**Testing requirements**
- Unit tests per service
- **Consumer contract tests** against AsyncAPI schemas
- **Saga tests:** happy path, payment declined (Stripe test card), restaurant rejects, courier timeout, and crash and resume
- Outbox and inbox idempotency tests
- **System end-to-end test** via Docker Compose in CI
- Chaos test and a k6 load test with documented results

**Deployment strategy**
Docker Compose for the full local system (services, PostgreSQL, Redis, NATS, and the observability stack). Kubernetes manifests with Kustomize overlays for staging and production. The CI pipeline builds service images and validates manifests.

**Folder structure**
```
56-event-driven-delivery-platform/
├── services/
│   ├── gateway/
│   ├── orders/        # saga orchestrator, outbox, inbox
│   ├── payments/
│   ├── restaurants/
│   ├── dispatch/
│   └── notifications/
├── apps/
│   ├── customer-web/  # Next.js
│   ├── restaurant-dashboard/
│   └── courier-pwa/
├── packages/
│   ├── contracts/     # AsyncAPI specs, generated types, validators
│   ├── messaging/     # NATS client, outbox relay, inbox dedupe
│   └── telemetry/     # OpenTelemetry setup
├── deploy/
│   ├── compose.yaml
│   ├── observability/ # grafana dashboards, prometheus, loki, tempo config
│   └── k8s/           # base/ + overlays/
└── test/system/
```

**Learning objectives**
Microservice decomposition · event-driven architecture · sagas and compensating transactions · the outbox/inbox pattern · distributed tracing and observability · container orchestration
