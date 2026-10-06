# Tier 3 — Real-Time, Asynchronous & Data-Intensive Systems

**Projects 23–33.** This tier moves past request/response. The projects keep long-lived connections, process work in the background, move large volumes of data, and scale horizontally. The recurring themes are ordering, delivery guarantees, backpressure, caching, and measuring performance rather than assuming it.

Difficulty scale: ★★☆☆☆ Intermediate · ★★★☆☆ Advanced · ★★★★☆ Senior · ★★★★★ Expert.

> **Infrastructure note:** Projects 23, 26, 28, 30, and 31 need Redis for their full integration suites. See [ARCHITECTURE.md §6](../../ARCHITECTURE.md#6-local-infrastructure-strategy) for how this is handled locally and in CI.

---

## 23 · Real-Time Team Chat

**Difficulty:** ★★★★☆ Senior · **Archetype:** C + E · **Folder:** `projects/23-realtime-team-chat`

**Description**
A Slack-style chat application with channels, direct messages, threads, reactions, presence, typing indicators, and read receipts. It runs on several server nodes at once and recovers missed messages after a reconnect.

**Real-world use case**
Team messaging (Slack, Discord, Teams) and in-app chat for support or marketplaces. The patterns also cover any real-time collaborative product.

**Technology stack**
Socket.IO · Express 5 · TypeScript · MongoDB (Mongoose) · Redis (Socket.IO adapter, presence) · React 19 + Vite · TanStack Query · TanStack Virtual · Vitest · `socket.io-client` (tests) · Playwright

**Main features**
- Public and private channels, plus direct messages
- Real-time messages with edit and delete
- Threads (replies) and emoji reactions
- Typing indicators and presence (online, away, offline)
- Read receipts and unread counts
- `@mentions` with notifications
- Image and file attachments
- Message search
- Infinite-scroll history with a virtualized message list

**Advanced features**
- **Horizontal scaling:** two server nodes behind a load balancer, sharing events through the Redis adapter
- **Per-channel ordering:** monotonic sequence numbers allocated atomically
- **Idempotent sends:** client-generated message IDs with a unique index, acknowledgements, and retries
- **Missed-message recovery:** after reconnecting, clients send their last sequence per channel and receive the gap
- Presence tracked with heartbeats and TTLs in Redis, consistent across nodes
- Unread counts computed cheaply from each member's `lastReadSeq`
- Per-socket rate limiting

**Database requirements**
MongoDB: `users`, `channels`, `memberships` (`lastReadSeq`), `messages` (`channelId`, `seq`, `threadRootId`, unique `clientMsgId`, embedded reactions), `attachments`. Compound and text indexes. Redis: presence keys and the pub/sub adapter.

**API requirements**
REST: `/api/v1/channels`, `/channels/:id/messages?before=`, `/channels/:id/members`, `/search`, `/uploads`. Socket events: `message:send`, `message:new`, `message:edit`, `typing`, `presence`, `read`, `reaction`, `sync` — all payloads schema-validated.

**Authentication requirements**
JWT access tokens. The socket handshake is authenticated and re-checked on token refresh. Channel membership is checked on every join and every emitted event.

**Security considerations**
- Users can never subscribe to rooms they are not members of
- Message content rendered as text (no HTML), with link previews fetched server-side and SSRF-protected
- Attachment type and size checks
- Event and connection rate limits

**Testing requirements**
- Socket integration tests with real clients against an in-process server
- **Multi-node test:** two server instances sharing Redis deliver messages across nodes
- Ordering, deduplication, and gap-recovery tests
- Private-channel authorization tests
- Playwright: two browsers chatting, with typing indicators and read receipts

**Deployment strategy**
`compose.yaml` runs two app nodes, an nginx load balancer, MongoDB, and Redis. Production targets a container platform with WebSocket support.

**Folder structure**
```
23-realtime-team-chat/
├── apps/
│   ├── server/
│   │   ├── src/realtime/  # gateway, handlers/, presence, rooms
│   │   ├── src/modules/   # channels/, messages/, search/, uploads/
│   │   └── src/models/
│   └── web/               # features/channels, features/messages, features/presence
├── packages/
│   └── protocol/          # event names, payload schemas
└── compose.yaml
```

**Learning objectives**
WebSocket architecture · horizontal scaling with pub/sub · message ordering and delivery guarantees · presence systems · MongoDB data modeling

---

## 24 · Collaborative Whiteboard (CRDT)

**Difficulty:** ★★★★☆ Senior · **Archetype:** C + E · **Folder:** `projects/24-collaborative-whiteboard`

**Description**
A Miro-style whiteboard where many people draw and edit simultaneously, with live cursors, per-user undo, offline editing that merges cleanly on reconnect, and version history. Conflict-free merging comes from CRDTs (Yjs).

**Real-world use case**
Collaborative tools (Figma, Miro, Notion, Google Docs). CRDTs are the modern answer to real-time collaboration without a central lock.

**Technology stack**
Yjs · Hocuspocus (Yjs WebSocket server) · `y-indexeddb` · React 19 + Vite · Canvas 2D rendering · rbush (spatial index) · Express 5 · TypeScript · Drizzle · PostgreSQL · Vitest · fast-check · Playwright

**Main features**
- Boards that can be created, shared, and organized
- Shapes: rectangles, ellipses, arrows, freehand strokes, text, and sticky notes
- Select, move, resize, recolor, and reorder
- Live cursors and presence avatars
- Per-user undo and redo
- Offline editing with automatic merge on reconnect
- Export to PNG and SVG
- Board permissions (owner, editor, viewer) and share links
- Version history with restore

**Advanced features**
- CRDT document design: a `Y.Map` of shapes, with **fractional indexing** for z-order so concurrent reorders converge
- **Persistence:** updates are appended to PostgreSQL and periodically compacted into snapshots
- **Server-side authorization:** viewers connect read-only, and the server rejects their updates
- Awareness (cursor) updates are throttled
- Viewport culling and hit testing with an R-tree, so large boards stay fast
- Load test with 20 headless Yjs clients

**Database requirements**
PostgreSQL: `users`, `boards`, `board_members`, `board_updates` (`bytea`), `board_snapshots`, `share_links`.

**API requirements**
REST: `/api/v1/boards`, `/boards/:id/members`, `/boards/:id/versions`, `/boards/:id/versions/:v/restore`, `/share-links`. WebSocket: the Yjs sync and awareness protocol through Hocuspocus at `/collab`.

**Authentication requirements**
JWT access tokens, verified in Hocuspocus `onAuthenticate`. Each board's role determines whether a connection is read-only or read-write.

**Security considerations**
- Authorization is enforced on the server, never just by hiding UI controls
- Limits on document size and update rate
- Text content rendered safely
- Share-link tokens can be revoked

**Testing requirements**
- **Convergence property tests:** random operations from several replicas, applied in different orders, always converge
- Snapshot compaction tests (snapshot plus later updates equals the full history)
- Read-only enforcement tests
- Fractional-index ordering tests
- Playwright: two users editing the same board, and an offline edit merging on reconnect

**Deployment strategy**
API and collaboration server containers plus PostgreSQL. Collaboration servers scale with sticky routing per board (documented).

**Folder structure**
```
24-collaborative-whiteboard/
├── apps/
│   ├── server/        # api/, collab/ (hocuspocus extensions: auth, persistence)
│   └── web/
│       ├── src/canvas/    # renderer, hit-testing, viewport
│       ├── src/doc/       # Yjs schema, commands, undo manager
│       └── src/features/
├── packages/
│   └── doc-model/     # shape types, fractional indexing (pure)
└── e2e/
```

**Learning objectives**
CRDTs and eventual consistency · real-time sync protocols · canvas rendering performance · spatial indexing · collaborative undo

---

## 25 · WebRTC Video Meetings

**Difficulty:** ★★★★☆ Senior · **Archetype:** C + E · **Folder:** `projects/25-webrtc-video-meetings`

**Description**
A browser-based video meeting app for small groups. Peers connect directly with WebRTC through a custom signaling server, and the app supports screen sharing, chat over data channels, device selection, and live connection-quality stats.

**Real-world use case**
Video calls (Google Meet, Zoom web), telehealth, and support co-browsing. WebRTC is the standard for real-time media in the browser.

**Technology stack**
WebRTC (`RTCPeerConnection`, data channels, `getStats`) · signaling server with `ws` + TypeScript · React 19 + Vite · Web Audio API · MediaRecorder · coturn (TURN, in compose) · Vitest · Playwright (Chromium fake media devices)

**Main features**
- Create a meeting and join by link
- Lobby with camera and microphone preview and device selection
- Mute and unmute, camera on and off
- Screen sharing
- Text chat over `RTCDataChannel`
- Participant list and a responsive video grid
- Active-speaker detection
- Connection-quality indicator (round-trip time, packet loss, bitrate)
- Local recording downloaded from the browser

**Advanced features**
- The **"perfect negotiation" pattern** (polite and impolite peers), which avoids offer collisions
- ICE restarts when the network changes
- **Adaptive bitrate:** sender encoding parameters adjust as participants join
- **Ephemeral TURN credentials** generated with HMAC per the TURN REST API convention
- Waiting room with host admission
- Mesh topology limits documented, along with when an SFU becomes necessary

**Database requirements**
None. Meetings are ephemeral, and signaling state lives in memory on a single node. The README documents how Redis would carry room state when running several signaling nodes.

**API requirements**
`POST /api/meetings` (returns a room ID and host token) · `POST /api/meetings/:id/join` (returns a participant token and ICE servers) · WebSocket signaling at `/signal` with schema-validated messages (`offer`, `answer`, `candidate`, `join`, `leave`, `admit`).

**Authentication requirements**
Signed room tokens (host and participant roles). No user accounts are required.

**Security considerations**
- Media is encrypted with DTLS-SRTP, and in a mesh it never passes through the server
- Signaling messages validated and relayed only between members of the same room
- TURN credentials short-lived
- Room IDs unguessable, with rate-limited joins
- Nothing is recorded on the server

**Testing requirements**
- Signaling server unit and integration tests (room membership, relay rules, admission)
- Negotiation state-machine tests
- **Playwright E2E:** two or three Chromium contexts with fake media devices connect, exchange chat, and share a screen
- Stats-parsing tests

**Deployment strategy**
The signaling server as a container, the client as a static site, and coturn for TURN. HTTPS is mandatory because browsers block media capture on insecure origins.

**Folder structure**
```
25-webrtc-video-meetings/
├── apps/
│   ├── signaling/     # rooms, relay, tokens, turn-credentials
│   └── web/
│       ├── src/rtc/       # peer connection manager, perfect negotiation, stats
│       ├── src/media/     # devices, active speaker, recording
│       └── src/features/  # lobby, meeting, chat
├── packages/
│   └── signaling-protocol/
└── compose.yaml       # coturn
```

**Learning objectives**
WebRTC internals (SDP, ICE, STUN and TURN) · signaling design · media APIs · network-quality monitoring · real-time UX

---

## 26 · Video Streaming Platform with HLS Transcoding

**Difficulty:** ★★★★☆ Senior · **Archetype:** F (multi-package) · **Folder:** `projects/26-video-streaming-platform`

**Description**
A YouTube-style platform where uploaded videos pass through a background job pipeline that transcodes them into adaptive-bitrate HLS, generates thumbnails and seek previews, and reports progress live. Private videos are protected with signed URLs.

**Real-world use case**
Video platforms, course sites, and any product with user-generated media. Background job pipelines are a fundamental pattern for slow, failure-prone work.

**Technology stack**
Express 5 · TypeScript · BullMQ + Redis · ffmpeg (`ffmpeg-static`) · Drizzle · PostgreSQL · S3-compatible storage (MinIO / filesystem driver) · React 19 + Vite · hls.js · Server-Sent Events · Bull Board · Vitest · Playwright

**Main features**
- Video upload with size and type validation
- Transcoding into an HLS ladder (360p, 720p, 1080p) with a master playlist
- Thumbnails and a seek-preview sprite sheet (WebVTT thumbnails)
- Live processing progress over SSE
- Adaptive player with a quality selector
- Channels, view counts, and resuming where the viewer left off
- Visibility: public, unlisted, or private
- Queue admin dashboard (Bull Board)

**Advanced features**
- **Job flows:** a parent "publish" job waits on child jobs for each rendition
- Retries with exponential backoff and a dead-letter queue
- Per-worker concurrency limits
- **Progress parsed from ffmpeg output** (`time=` against the duration)
- **Idempotent steps:** a retried job skips renditions that already exist
- Graceful worker shutdown that finishes the current job
- **Signed segment URLs** for private videos, enforced by playlist rewriting
- Immutable cache headers for segments and `Range` support

**Database requirements**
PostgreSQL: `users`, `channels`, `videos` (status, duration, visibility), `renditions`, `processing_jobs`, `views`, `watch_progress`. Redis holds the BullMQ queues.

**API requirements**
`POST /api/v1/videos` (upload) · `GET /videos/:id` · `GET /videos/:id/progress` (SSE) · `GET /videos/:id/master.m3u8` (signed for private videos) · `PATCH /videos/:id` · `POST /videos/:id/views` · `PUT /videos/:id/progress` · `/admin/queues` (Bull Board, admin only).

**Authentication requirements**
JWT sessions. Channel owners manage their own videos. Private playback requires a signed, expiring token bound to the video.

**Security considerations**
- ffmpeg invoked with an argument array, never a shell string
- Input files probed (`ffprobe`) before transcoding; duration and resolution limits enforced
- Signed URLs expire and are scoped to one video
- The Bull Board admin is protected by role

**Testing requirements**
- Unit tests for the ffmpeg argument builder and the progress parser
- **Integration test:** transcode a generated 5-second clip (ffmpeg `testsrc`) and validate the resulting playlists with an m3u8 parser
- Queue retry and idempotency tests (Redis required, run in CI)
- Signed-URL tests
- Playwright: upload → progress → playback in Chromium

**Deployment strategy**
Separate API and worker containers that scale independently. `compose.yaml` includes PostgreSQL, Redis, and MinIO. A CDN goes in front of segments in production.

**Folder structure**
```
26-video-streaming-platform/
├── apps/
│   ├── api/           # modules/videos, channels, playback (signing), progress (SSE)
│   ├── worker/        # processors/: probe, transcode, thumbnails, publish
│   └── web/
├── packages/
│   ├── media/         # ffmpeg args, progress parser, ladder config
│   └── queue/         # queue names, job schemas
└── compose.yaml
```

**Learning objectives**
Background job architecture · media processing · adaptive streaming · idempotent, retryable work · signed URLs and CDN caching

---

## 27 · Bulk Data Import (ETL) Service

**Difficulty:** ★★★★☆ Senior · **Archetype:** C + E · **Folder:** `projects/27-data-import-etl`

**Description**
A service for importing large CSV and Excel files into a database. Users map columns, preview validation results, and run imports of a million rows in constant memory. They get a downloadable error report, and the import resumes from a checkpoint after a crash.

**Real-world use case**
"Import your data" is a feature in nearly every B2B product (CRMs, HR systems, e-commerce catalogs), and a common source of support tickets when it is unreliable.

**Technology stack**
Express 5 · TypeScript · busboy · `csv-parse` · ExcelJS (streaming reader) · Zod · `libphonenumber-js` · Drizzle · PostgreSQL (`pg-copy-streams`) · pg-boss (PostgreSQL-backed job queue) · React 19 + Vite · Vitest · Playwright

**Main features**
- Upload CSV or XLSX files up to 200 MB
- Automatic detection of delimiter, encoding, and header row
- Preview of the first rows
- A column-mapping UI with reusable mapping templates
- Row validation with typed coercion (dates, numbers, emails, E.164 phone numbers)
- Dry runs before committing
- Import modes: insert, upsert on a key, or skip duplicates
- Live progress (rows per second)
- Downloadable error report (row, column, message)
- Job history and cancellation

**Advanced features**
- **Fully streaming pipeline:** upload → parse → validate → batch → `COPY` into a staging table → `INSERT … ON CONFLICT` merge
- **Constant memory**, verified on a one-million-row file
- **Checkpointing:** a crashed worker resumes from the last committed batch
- Duplicate detection within a file
- Encoding detection, BOM handling, and Excel quirks such as serial-number dates
- Throughput benchmark committed to the README

**Database requirements**
PostgreSQL: `import_jobs` (status, checkpoint, counts), `mapping_templates`, `import_errors`, the target domain table (`contacts`), and per-job unlogged staging tables. pg-boss keeps its queue tables in its own schema.

**API requirements**
`POST /api/v1/imports` (upload) · `GET /imports/:id/preview` · `PUT /imports/:id/mapping` · `POST /imports/:id/dry-run` · `POST /imports/:id/start` · `POST /imports/:id/cancel` · `GET /imports/:id` (progress) · `GET /imports/:id/errors.csv` · `/mapping-templates`

**Authentication requirements**
JWT sessions. Imports are scoped to the owning user's organization.

**Security considerations**
- Upload size and row limits
- Zip-bomb protection for XLSX (decompressed size limit)
- **CSV injection protection** in exported error reports
- Data written only to allowlisted target columns
- Uploaded files deleted after processing

**Testing requirements**
- Parser edge cases: quoted newlines, BOMs, CRLF, semicolon delimiters, ragged rows
- Validation and coercion rule tests
- **Crash-and-resume test:** kill the worker mid-import and verify the final row counts are exact
- Memory-ceiling test on a large generated file
- Playwright: upload → map → dry run → import → download errors

**Deployment strategy**
API and worker containers with PostgreSQL. Workers scale horizontally because pg-boss claims jobs with `SKIP LOCKED`.

**Folder structure**
```
27-data-import-etl/
├── apps/
│   ├── api/           # modules/imports, mapping-templates, errors
│   ├── worker/        # pipeline/: parse, coerce, validate, batch, copy, merge, checkpoint
│   └── web/           # upload, mapping UI, progress, history
├── test/fixtures/     # edge-case files and a large-file generator
└── compose.yaml
```

**Learning objectives**
Stream processing and backpressure · bulk loading techniques · resumable jobs · data validation at scale · import UX

---

## 28 · Multi-Channel Notification Service

**Difficulty:** ★★★★☆ Senior · **Archetype:** F (multi-package) · **Folder:** `projects/28-notification-service`

**Description**
A central notification service that sends email, SMS, web push, and in-app notifications from one API. It respects user preferences and quiet hours, batches digests, retries failures, and tracks delivery. A sample producer app demonstrates the transactional outbox pattern.

**Real-world use case**
Every product sends notifications, and most eventually centralize them (as with Knock, Courier, or Novu) to avoid duplicated logic, notification spam, and lost messages.

**Technology stack**
Express 5 · TypeScript · Drizzle · PostgreSQL · BullMQ + Redis · Nodemailer → Mailpit · MJML + Handlebars · Twilio REST API · `web-push` (VAPID) · Server-Sent Events · React 19 + Vite (notification center and admin UI) · Vitest · Playwright

**Main features**
- `POST /v1/notifications` with a template key, recipients, and data
- Channels: email, SMS, web push, and in-app
- Versioned, localized templates with previews
- User preferences per category and channel
- Time-zone-aware quiet hours
- An in-app inbox (read, unread, mark all read) updated live over SSE
- Digest batching (for example "5 new comments" hourly)
- Delivery tracking (queued, sent, delivered, failed, bounced) with logs

**Advanced features**
- **Transactional outbox:** a sample producer writes its business change and an outbox row in one transaction, and a relay publishes it
- Idempotency keys on the send API
- Retries with exponential backoff, plus provider failover (primary and secondary SMTP)
- Per-channel rate limits and priority queues
- Chunked fan-out to large recipient lists
- Web-push subscription cleanup when a push service returns `410 Gone`
- Bounce webhook handling
- Template rendering with prototype access disabled

**Database requirements**
PostgreSQL: `recipients`, `channels` (push subscriptions, phone, email), `preferences`, `templates`, `template_versions`, `notifications`, `deliveries`, `inbox_items`, `digests`, `idempotency_keys`, and `outbox` (in the sample producer).

**API requirements**
`POST /v1/notifications` · `GET /v1/recipients/:id/inbox` · `GET /v1/recipients/:id/inbox/stream` (SSE) · `PATCH /v1/inbox/:id` · `PUT /v1/recipients/:id/preferences` · `POST /v1/recipients/:id/push-subscriptions` · `/v1/templates` (admin CRUD and preview) · `POST /v1/webhooks/bounces`

**Authentication requirements**
Server-to-server API keys for producers. Recipients use short-lived signed tokens for their inbox and preferences. Admins use sessions.

**Security considerations**
- Template data HTML-escaped by default
- Unsubscribe links signed (one-click unsubscribe per RFC 8058)
- Phone numbers and emails validated before sending
- Bounce webhooks authenticated
- No secrets in templates or logs

**Testing requirements**
- Preference and quiet-hours logic across time zones
- Template rendering snapshot tests
- Outbox relay tests (at-least-once delivery, deduplication)
- Retry and backoff tests with a fake clock
- Channel adapters tested against local endpoints (Mailpit SMTP in CI, a local push endpoint)
- Playwright: notification center updates live

**Deployment strategy**
API and channel-worker containers with PostgreSQL, Redis, and Mailpit in compose. Each channel's workers scale independently.

**Folder structure**
```
28-notification-service/
├── apps/
│   ├── api/
│   ├── workers/       # email/, sms/, push/, inapp/, digest/
│   ├── web/           # notification center widget + admin
│   └── sample-producer/  # demonstrates the outbox pattern
├── packages/
│   ├── templates/     # rendering, MJML, i18n
│   └── preferences/   # rules (pure)
└── compose.yaml
```

**Learning objectives**
Reliable messaging (outbox, idempotency) · multi-provider integration · preference and scheduling logic · fan-out · notification UX

---

## 29 · Product Search Service

**Difficulty:** ★★★★☆ Senior · **Archetype:** F (multi-package) · **Folder:** `projects/29-product-search-service`

**Description**
A production search stack for an online catalog. PostgreSQL is the source of truth and Meilisearch is the search engine, kept in sync through an outbox. Shoppers get typo-tolerant search-as-you-type with facets. Merchandisers manage synonyms and pinned results, and analytics surface zero-result queries.

**Real-world use case**
Search drives a large share of e-commerce revenue. The architecture (a source-of-truth database synced to a dedicated search engine) is what Shopify, Algolia customers, and most marketplaces use.

**Technology stack**
Meilisearch · PostgreSQL + Drizzle · Fastify · TypeScript · React 19 + Vite · Faker (synthetic catalog generation, clearly labeled) · Vitest · Playwright

**Main features**
- Bulk indexing plus incremental sync from PostgreSQL
- Typo-tolerant search with highlighting
- Facets (brand, category, price ranges, rating), filters, and sorting
- Autocomplete and query suggestions
- Admin: synonyms, stop words, and pinned or boosted products per query
- Search analytics: top queries, zero-result queries, and click-through rate

**Advanced features**
- **Outbox-based sync:** at-least-once delivery with idempotent upserts, plus a sync-lag metric
- **Zero-downtime reindexing:** build a new index and swap it atomically
- Search-as-you-type with debouncing, request cancellation (`AbortController`), and keyboard-accessible combobox navigation
- Filter state synced to the URL, so results are shareable
- Caching of popular queries
- A/B comparison of ranking rules by click-through rate

**Database requirements**
PostgreSQL: `products`, `categories`, `brands`, `outbox`, `synonyms`, `pins`, `search_events` (queries and clicks). Meilisearch indexes: `products`, `query_suggestions`.

**API requirements**
`GET /api/v1/search?q=&filters=&sort=&page=` · `GET /api/v1/suggest?q=` · `POST /api/v1/events` (click tracking) · admin: `/api/v1/admin/synonyms`, `/pins`, `/reindex`, `/analytics`

**Authentication requirements**
Public search with no authentication but with rate limits. Admin endpoints require sessions with the merchandiser role. The Meilisearch master key never reaches the browser; scoped keys are used where needed.

**Security considerations**
- Filter expressions are built server-side from validated parameters, never passed through as raw strings
- Meilisearch is not publicly exposed
- Rate limiting on search and event endpoints
- Analytics store no personal data

**Testing requirements**
- Outbox relay and idempotency tests
- **Relevance tests:** fixture queries with expected top results, run against a real Meilisearch (CI service or local binary)
- Reindex-and-swap tests
- API contract tests
- Playwright: type → facets → results → click tracked

**Deployment strategy**
API and sync-worker containers, Meilisearch, and PostgreSQL in compose. Meilisearch also ships an official native Windows binary for a no-Docker setup.

**Folder structure**
```
29-product-search-service/
├── apps/
│   ├── api/           # modules/search, suggest, events, admin
│   ├── sync-worker/   # outbox relay, bulk indexer, reindex-and-swap
│   └── web/           # search UI, admin
├── scripts/generate-catalog.ts
└── compose.yaml
```

**Learning objectives**
Search architecture · data synchronization patterns · relevance tuning · search UX · analytics-driven iteration

---

## 30 · API Gateway & Distributed Rate Limiter

**Difficulty:** ★★★★★ Expert · **Archetype:** E (API service) · **Folder:** `projects/30-api-gateway`

**Description**
A programmable API gateway: declarative routing to upstream pools, load balancing with health checks, JWT and API-key authentication, distributed rate limiting with atomic Redis Lua scripts, circuit breakers, retries, response caching, and metrics.

**Real-world use case**
Every microservice architecture has a gateway (Kong, Envoy, AWS API Gateway). Building one teaches what happens to every request before it reaches a service.

**Technology stack**
Node.js (`node:http` + undici) · TypeScript · Redis (ioredis, Lua scripts) · `jose` (JWKS) · YAML config with Zod validation · prom-client · pino · Vitest · autocannon

**Main features**
- Declarative routes (host, path, method) to upstream pools with path rewriting
- Load balancing: round-robin, least-connections, and weighted, with active health checks
- JWT verification via JWKS (cached and rotated) and API-key authentication
- **Rate limiting** per key, IP, or route, returning `RateLimit` headers
- Header injection and removal
- Response caching for `GET` requests that honors `Cache-Control`
- Timeouts, request IDs, structured access logs, and CORS
- Prometheus `/metrics`
- Hot configuration reload without dropping connections

**Advanced features**
- **Rate-limiting algorithms** (token bucket, sliding-window counter, sliding-window log) as atomic Lua scripts, with their trade-offs documented and measured
- **Accuracy test of distributed limiting** across two gateway instances
- **Circuit breaker** state machine (closed, open, half-open) per upstream
- Retries with jittered backoff, for idempotent methods only, within a retry budget
- **Streaming proxy** with backpressure (bodies are never buffered) and WebSocket upgrade proxying
- **Published overhead benchmark:** latency added by the gateway at p50 and p99

**Database requirements**
Redis for rate-limit counters, cached responses, and shared circuit state. No relational database; configuration lives in versioned YAML.

**API requirements**
Data plane: proxies any configured route. Admin API (separate port, authenticated): `GET /admin/routes`, `POST /admin/reload`, `GET /admin/upstreams/health`, `GET /metrics`.

**Authentication requirements**
Per route: none, API key, or JWT (issuer and audience checks, required scopes). The admin API uses a separate admin token and binds to localhost by default.

**Security considerations**
- Hop-by-hop headers stripped and `X-Forwarded-*` headers handled correctly
- Request smuggling defenses (rejecting conflicting `Content-Length` / `Transfer-Encoding`)
- Upstream targets come only from configuration, so there is no request-driven SSRF
- Header and body size limits
- Secrets redacted from logs

**Testing requirements**
- Algorithm unit tests with a fake clock
- Integration tests against real test upstreams (load balancing, health ejection, retries, timeouts)
- Circuit-breaker chaos tests (upstream failures trip and recover the breaker)
- Redis-backed distributed limiter tests (CI); in-memory store tests locally
- Streaming and backpressure tests with large bodies
- A benchmark script with documented results

**Deployment strategy**
A container with config mounted as a volume. `compose.yaml` runs two gateway instances, Redis, and sample upstream services.

**Folder structure**
```
30-api-gateway/
├── src/
│   ├── config/        # schema, loader, hot reload
│   ├── proxy/         # forwarder, streaming, websocket upgrade
│   ├── balancing/     # strategies, health checks
│   ├── auth/          # jwt-jwks, api-key
│   ├── ratelimit/     # algorithms/, lua/, stores (redis, memory)
│   ├── resilience/    # circuit breaker, retry budget, timeouts
│   ├── cache/
│   └── admin/
├── test/
├── bench/
└── compose.yaml
```

**Learning objectives**
Reverse proxying · rate-limiting algorithms · resilience patterns · Lua in Redis · performance measurement

---

## 31 · Social News Feed at Scale

**Difficulty:** ★★★★★ Expert · **Archetype:** C + E · **Folder:** `projects/31-social-feed-at-scale`

**Description**
A Twitter/X-style feed built to study feed architecture. It implements fan-out-on-write, fan-out-on-read, and a hybrid that handles celebrity accounts, with multi-layer caching. All three strategies are load-tested on a seeded dataset, and the results are published.

**Real-world use case**
Social feeds, activity streams, and notification timelines. "Design a news feed" is a classic system-design problem; this project answers it with running code and measurements.

**Technology stack**
Fastify · TypeScript · Drizzle · PostgreSQL · Redis (sorted sets, pipelines) · BullMQ (fan-out jobs) · React 19 + Vite · k6 · Vitest · fast-check

**Main features**
- Profiles and following
- Posts with images
- Home and user timelines with infinite scroll
- Likes and comments with counters
- Notifications for likes and follows

**Advanced features**
- **Hybrid fan-out:** pushed into Redis timelines (capped sorted sets) for normal accounts, pulled and merged at read time for accounts above a follower threshold
- **Time-ordered 64-bit IDs** (a Snowflake-style generator) for stable cursor pagination
- Cache-aside post objects with batched multi-get and invalidation on edit and delete
- **Write-behind counters:** like counts accumulated in Redis and flushed to PostgreSQL in batches
- Timeline backfill on follow and cleanup on unfollow, both asynchronous
- **Thundering-herd protection:** request coalescing (single flight) and probabilistic early expiration
- **Load tests** on 100,000 users and 1,000,000 follow edges, comparing p95 timeline latency across strategies, with results in the README

**Database requirements**
PostgreSQL: `users`, `follows`, `posts`, `likes`, `comments`, `notifications`. Redis: `timeline:{user}` sorted sets, `post:{id}` hashes, counters, and celebrity sets.

**API requirements**
`GET /api/v1/timeline/home?cursor=` · `GET /users/:id/timeline` · `POST /posts` · `DELETE /posts/:id` · `POST /posts/:id/like` · `POST /users/:id/follow` · `DELETE /users/:id/follow` · `GET /notifications`

**Authentication requirements**
JWT access tokens with refresh rotation.

**Security considerations**
- Authorization on post deletion and edits
- Rate limits on posting, following, and liking (anti-spam)
- Private accounts excluded from fan-out to non-followers
- Uploaded image validation

**Testing requirements**
- **Correctness property test:** for random follow graphs and post sequences, the hybrid timeline equals a naive SQL timeline
- Cache invalidation tests (edits and deletes never serve stale content after acknowledgement)
- Counter flush tests
- Snowflake ID monotonicity tests
- k6 load scripts, run manually and documented

**Deployment strategy**
API and fan-out worker containers with PostgreSQL and Redis. The README covers sizing notes derived from the load tests.

**Folder structure**
```
31-social-feed-at-scale/
├── apps/
│   ├── api/
│   │   ├── src/feed/      # strategies/: push, pull, hybrid; merge
│   │   ├── src/cache/     # post cache, single-flight, early expiration
│   │   └── src/modules/   # posts, follows, likes, notifications
│   ├── worker/            # fan-out, backfill, counter flush
│   └── web/
├── load-tests/            # k6 scripts, seed generator, results/
└── compose.yaml
```

**Learning objectives**
Feed architecture trade-offs · caching strategies and invalidation · write amplification · distributed ID generation · load-testing methodology

---

## 32 · Fleet Telematics Platform

**Difficulty:** ★★★★★ Expert · **Archetype:** F (multi-package) · **Folder:** `projects/32-fleet-telematics`

**Description**
An IoT platform for vehicle fleets. Simulated vehicles stream GPS and sensor telemetry over MQTT into time-partitioned PostgreSQL. Operators watch a live map, replay trips, draw geofences, and receive alerts for speeding, idling, and geofence violations.

**Real-world use case**
Logistics, ride-hailing, delivery, and field-service companies (Samsara, Geotab). The pattern applies to any high-volume time-series and geospatial workload.

**Technology stack**
MQTT (Aedes broker embedded in the ingestion service) · Node.js + TypeScript · PostgreSQL with PostGIS, native partitioning, and BRIN indexes · Drizzle · WebSocket · React 19 + Vite · MapLibre GL · Vitest · PGlite (PostGIS) · `embedded-postgres`

**Main features**
- Vehicle, device, and driver registry
- MQTT telemetry: location, speed, heading, fuel, and ignition
- Live fleet map with real-time positions
- Trip detection (ignition on and off) and trip replay
- Geofences drawn on the map, with enter and exit events
- Alert rules: speeding, excessive idling, after-hours geofence exits, and low fuel
- Alerts feed and daily reports (distance and utilization)
- A **vehicle simulator** that drives realistic routes

**Advanced features**
- **High-throughput ingestion:** bounded in-memory buffers flushed with `COPY`
- **Time-partitioned telemetry:** automated partition creation and retention-based dropping
- BRIN indexes on time and rollup tables for downsampled history
- Geofence evaluation with PostGIS, plus an in-memory spatial index on the hot path
- MQTT QoS 1 with deduplication by device sequence number
- **Backpressure and load shedding** when the database falls behind, with metrics
- Viewport-based live subscriptions, so clients receive only the vehicles they can see
- **Benchmark:** 1,000 simulated vehicles at 1 Hz, with sustained throughput documented

**Database requirements**
PostgreSQL + PostGIS: `organizations`, `vehicles`, `devices` (hashed credentials), `drivers`, `telemetry` (partitioned by day), `trips`, `geofences` (`geometry(Polygon)`), `geofence_events`, `alert_rules`, `alerts`, `telemetry_rollups`.

**API requirements**
MQTT topics: `fleet/{org}/{device}/telemetry` (publish) and `fleet/{org}/{device}/commands` (subscribe). REST: `/api/v1/vehicles`, `/vehicles/:id/trips`, `/trips/:id/track`, `/geofences`, `/alert-rules`, `/alerts`, `/reports`. WebSocket: `/live` with viewport subscriptions.

**Authentication requirements**
Devices authenticate with per-device MQTT credentials (stored hashed). Topic ACLs ensure a device can publish only to its own topic. Operators use sessions scoped to their organization.

**Security considerations**
- Topic ACLs and per-device credentials, with TLS required in production
- Organization isolation in every query
- Telemetry payloads schema-validated, with out-of-range values rejected
- Rate limiting per device

**Testing requirements**
- Ingestion tests with an in-process Aedes broker
- Geofence logic tests using PGlite with PostGIS
- Partition management tests on real PostgreSQL (`embedded-postgres`)
- Alert-rule engine unit tests
- A simulator-driven end-to-end integration test
- Playwright: a vehicle visibly moves on the live map

**Deployment strategy**
Ingestion, API, and worker containers with PostgreSQL/PostGIS in compose. MQTT can be served by the embedded broker or an external one (Mosquitto or EMQX) through configuration.

**Folder structure**
```
32-fleet-telematics/
├── apps/
│   ├── ingest/        # mqtt broker/auth/acl, buffer, copy writer, dedup
│   ├── api/           # modules/vehicles, trips, geofences, alerts, reports; live ws
│   ├── worker/        # trip detection, alert evaluation, rollups, partition maintenance
│   ├── simulator/     # route-following vehicle simulation
│   └── web/           # live map, replay, geofence editor
└── compose.yaml
```

**Learning objectives**
IoT messaging (MQTT) · time-series data modeling · geospatial queries · ingestion backpressure · real-time maps

---

## 33 · Real-Time Multiplayer Arena Game

**Difficulty:** ★★★★★ Expert · **Archetype:** F (multi-package) · **Folder:** `projects/33-multiplayer-arena-game`

**Description**
A fast-paced, top-down multiplayer arena game played in the browser. An authoritative server runs the simulation at a fixed tick rate, while clients use prediction, reconciliation, and interpolation to feel responsive under real network latency. It has matchmaking, leaderboards, and spectating.

**Real-world use case**
Browser `.io` games and competitive multiplayer games. The same netcode techniques apply to any latency-sensitive collaborative real-time application.

**Technology stack**
Node.js + TypeScript (`ws`) · Canvas 2D client (TypeScript + Vite) · a shared simulation package · a custom binary protocol (`DataView`) · Redis (sorted-set leaderboards, matchmaking queue; in-memory fallback) · Drizzle · PostgreSQL (accounts and match history) · Vitest · fast-check

**Main features**
- Quick-match matchmaking into rooms of up to 8 players
- Movement, aiming, shooting, health, and respawning
- Match timer and live scoreboard
- Daily, weekly, and all-time leaderboards
- Guest play with a nickname, or an optional account
- Spectator mode
- Reconnecting to a match in progress

**Advanced features**
- **Server-authoritative fixed-timestep** simulation
- **Client-side prediction** with input sequence numbers and **server reconciliation**
- **Entity interpolation** for remote players (rendered roughly 100 ms in the past)
- **Lag compensation:** hits are evaluated against rewound positions from the shooter's point of view, with a bounded history
- Delta-compressed binary snapshots, with bandwidth per player measured
- Interest management: clients receive only nearby entities
- **Cheat resistance:** the server validates every input (speed and fire-rate limits) and never trusts client positions
- A network-condition simulator (latency, jitter, and packet loss) for development and tests

**Database requirements**
PostgreSQL: `players`, `matches`, `match_results`. Redis: `leaderboard:{period}` sorted sets and the matchmaking queue.

**API requirements**
REST: `POST /api/v1/sessions` (guest or account), `GET /leaderboards/:period`, `GET /matches/:id`. WebSocket at `/play` with a documented binary protocol: input, snapshot, join, leave, and spectate messages, versioned.

**Authentication requirements**
Signed session tokens for guests and accounts, verified at the WebSocket handshake. Leaderboard writes come only from server-recorded match results.

**Security considerations**
- Every client message is length-checked and schema-validated during binary decoding
- Input rate limits per connection
- No client-authoritative state
- Connection limits per IP

**Testing requirements**
- **Determinism tests:** the shared simulation yields identical results from identical inputs
- Prediction and reconciliation tests
- **Property-based tests:** binary encode→decode is lossless
- Lag-compensation hit-validation tests
- **Bot load test:** 100 headless bots measuring server tick time and bandwidth
- Leaderboard tests

**Deployment strategy**
A game-server container (room-based, scales by adding instances behind the matchmaker), a static client, plus Redis and PostgreSQL. The README covers region placement for latency.

**Folder structure**
```
33-multiplayer-arena-game/
├── apps/
│   ├── server/        # rooms/, matchmaking/, tick loop, lag compensation, persistence
│   ├── client/        # renderer, input, prediction, interpolation, ui
│   └── bots/          # headless load-test clients
├── packages/
│   ├── sim/           # shared physics and game rules (deterministic)
│   └── protocol/      # binary schemas, encode/decode
└── compose.yaml
```

**Learning objectives**
Game netcode (prediction, reconciliation, interpolation, lag compensation) · binary protocols · fixed-timestep simulation · authoritative server design · real-time performance profiling
