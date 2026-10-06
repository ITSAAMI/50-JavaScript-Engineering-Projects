# Tier 4 — AI Engineering, Agents & Automation

**Projects 34–44.** This tier starts with deterministic automation (workflow engines, browser automation) and moves into applied AI: retrieval-augmented generation, structured extraction, tool-using agents, the Model Context Protocol, and evaluation. The emphasis is on what makes AI features production-worthy, not on demos: grounding, citations, guardrails, permission boundaries, cost control, and measurement.

Difficulty scale: ★★☆☆☆ Intermediate · ★★★☆☆ Advanced · ★★★★☆ Senior · ★★★★★ Expert.

### Shared conventions for AI projects

- **Provider interface.** Model calls go through a small interface. The production implementation uses the Anthropic Claude API (`@anthropic-ai/sdk`). Automated tests use a **scripted fake model** that returns predetermined responses and tool calls, so agent loops, parsing, retries, and error paths are tested deterministically and offline. The fake is never presented as AI behavior.
- **Live evaluations** (which need `ANTHROPIC_API_KEY`) are separate from `npm test`, and their results are committed with the date and model used.
- **Model choice is configuration,** not code: a fast, inexpensive model for classification and extraction, a stronger model for multi-step reasoning. Current model IDs are confirmed against the Claude API documentation at implementation time.
- **Embeddings** run locally by default with transformers.js, so retrieval works without any API key. A hosted embeddings provider is optional.
- **Untrusted content.** Documents, web pages, tickets, PR diffs, and database values are treated as untrusted input that may contain prompt injection. Defenses are structural (permissions enforced in code, no side-effecting tools where unneeded), not just prompt wording.

---

## 34 · Workflow Automation Engine

**Difficulty:** ★★★★☆ Senior · **Archetype:** F (multi-package) · **Folder:** `projects/34-workflow-automation-engine`

**Description**
An n8n/Zapier-style automation platform. Users build workflows visually from triggers (webhook, schedule, manual) and actions (HTTP requests, conditions, loops, sandboxed JavaScript, email). A durable execution engine runs them with retries, per-step logs, and crash recovery.

**Real-world use case**
Business process automation and integration glue (Zapier, n8n, Make, Temporal-lite). Internal platforms use the same engine design for onboarding flows, data syncs, and approvals.

**Technology stack**
React 19 + Vite · React Flow (`@xyflow/react`) · Express 5 · TypeScript · MongoDB · `quickjs-emscripten` (WebAssembly JavaScript sandbox) · croner (cron) · Nodemailer · Zod · Vitest · `mongodb-memory-server` · Playwright

**Main features**
- Visual builder: drag nodes, connect edges, configure each node in a side panel
- Triggers: webhook, cron schedule, and manual run
- Nodes: HTTP Request, Code (sandboxed JavaScript), If, Switch, Merge, Wait, Loop Over Items, Set Fields, Send Email
- Expressions that reference earlier nodes' output, e.g. `{{ $node["Fetch"].json.id }}`
- Execution history with each node's input, output, and duration
- Encrypted credentials store
- Activate and deactivate workflows

**Advanced features**
- **DAG validation** (cycles, unreachable nodes, invalid connections) before activation
- **Durable execution:** every step is persisted, and a crashed worker's execution resumes from the last completed step
- **Lease-based work claiming** (atomic `findOneAndUpdate` with lease expiry and heartbeats), so many workers can run safely
- Leader election for the cron scheduler, so each schedule fires exactly once across instances
- Parallel branches, per-node retries with backoff, and timeouts
- **Safe expression language:** a hand-written parser and evaluator, never `eval`
- **Sandboxed code nodes:** a QuickJS WebAssembly VM with memory, time, and stack limits
- Versioned workflows (each execution pins the version it started with) and "replay from this node"

**Database requirements**
MongoDB: `workflows`, `workflow_versions`, `executions` (status, lease, cursor), `execution_steps`, `credentials` (AES-256-GCM encrypted, key versioned), `users`, `webhooks`, `locks`.

**API requirements**
`/api/v1/workflows` (CRUD, activate, deactivate, versions) · `POST /workflows/:id/run` · `/executions` (list, detail, retry, replay-from) · `/credentials` · `ANY /hooks/:workflowId/:path` (webhook triggers) · WebSocket or SSE for live execution updates.

**Authentication requirements**
Sessions with per-workflow roles (owner, editor, viewer). Webhook triggers support an optional HMAC signature check or a secret path token.

**Security considerations**
- **Sandbox hardening:** no access to `process`, `require`, or the network from code nodes; infinite loops and memory bombs are terminated
- **SSRF protection** in the HTTP node: private and link-local ranges blocked, DNS resolution pinned to defeat rebinding, every redirect hop re-validated
- Credentials encrypted at rest, decrypted only inside the worker, and masked in logs
- Execution data retention limits

**Testing requirements**
- Engine tests with fake node types (ordering, parallelism, merges, retries)
- **Crash-recovery test:** kill a worker mid-execution and verify the execution completes exactly once
- **Sandbox escape attempts:** prototype tricks, `globalThis` probing, infinite loops, memory exhaustion
- SSRF tests (private IPs, DNS rebinding, redirect chains)
- Expression parser tests
- Playwright: build a webhook → HTTP → If → Email workflow and run it

**Deployment strategy**
API, worker, and scheduler containers with MongoDB. Workers scale horizontally because claiming is lease-based.

**Folder structure**
```
34-workflow-automation-engine/
├── apps/
│   ├── api/           # modules/workflows, executions, credentials, hooks
│   ├── worker/        # engine/: scheduler, claimer, runner, retry; nodes/
│   └── web/           # builder (React Flow), node panels, execution viewer
├── packages/
│   ├── workflow-model/  # schemas, DAG validation
│   ├── expressions/     # parser + evaluator
│   └── sandbox/         # QuickJS wrapper with limits
└── compose.yaml
```

**Learning objectives**
Workflow engine design · durable execution and leases · sandboxing untrusted code · SSRF defense · visual programming UIs

---

## 35 · Web Change Monitor & Price Tracker

**Difficulty:** ★★★★☆ Senior · **Archetype:** C + E · **Folder:** `projects/35-web-change-monitor`

**Description**
A service that watches web pages for changes. It renders JavaScript-heavy pages in headless Chromium, extracts text, elements, or prices, detects meaningful changes while filtering noise, and alerts users by email or webhook, with a diff timeline.

**Real-world use case**
Competitive price monitoring, compliance tracking (terms and policy pages), stock-availability alerts, and regulatory page watching (Visualping, Distill).

**Technology stack**
Playwright (Chromium) · Express 5 · TypeScript · Drizzle · PostgreSQL · pg-boss (scheduling and queue) · `diff` · pixelmatch · Nodemailer · React 19 + Vite · Vitest

**Main features**
- Monitors in several modes: full-page text, CSS selector, price extraction, or a visual screenshot region
- Per-monitor check intervals
- Change detection with text diffs and visual diffs
- **Price rules:** alert when the price drops below a value or changes by a percentage
- Notifications by email and webhook
- A history timeline showing each diff and screenshot
- Dashboard with monitor health and failure reasons

**Advanced features**
- **robots.txt compliance** and per-domain politeness (one concurrent request per domain, honoring crawl delays), with an honest `User-Agent`
- **Noise reduction:** ignore-selectors, regex ignore rules (timestamps, counters), and N consecutive confirmations before alerting
- Locale-aware price parsing (`1.234,56 €` vs `$1,234.56`)
- Browser pool with context reuse, and blocking of images and fonts in text-only modes
- Failure classification (timeout, 4xx, 5xx, blocked, selector missing) with backoff
- Screenshot storage deduplicated by hash

**Database requirements**
PostgreSQL: `users`, `monitors`, `checks` (status, duration, content hash), `snapshots`, `changes`, `notification_channels`, `alerts`. pg-boss queue tables.

**API requirements**
`/api/v1/monitors` (CRUD, pause, resume, check now) · `/monitors/:id/history` · `/changes/:id` (diff and screenshots) · `/notification-channels` · `POST /monitors/test-selector` (preview extraction)

**Authentication requirements**
Email and password with sessions. Per-user monitor limits.

**Security considerations**
- **SSRF protection:** targets must resolve to public IPs, re-validated after every redirect
- The browser runs with no persistent profile, downloads disabled, and per-check timeouts
- Webhook notifications signed with HMAC
- **This project does not attempt to bypass bot detection or CAPTCHAs.** Blocked sites are reported to the user as blocked.

**Testing requirements**
- Normalization and diff unit tests
- Price parser tests across locales
- robots.txt parser tests
- **Integration tests:** real Chromium against local fixture pages served by a test server (static pages, JavaScript-rendered pages, changing prices)
- SSRF tests

**Deployment strategy**
API and browser-worker containers (based on the official Playwright image) with PostgreSQL. Browser workers are memory-heavy and sized accordingly.

**Folder structure**
```
35-web-change-monitor/
├── apps/
│   ├── api/
│   ├── worker/        # browser pool, extractors/ (text, selector, price, visual), politeness
│   └── web/
├── packages/
│   └── change-detection/  # normalize, diff, price parsing, noise rules (pure)
└── test/fixtures/site/    # local pages for integration tests
```

**Learning objectives**
Browser automation · responsible crawling · change-detection algorithms · scheduling at scale · SSRF defense

---

## 36 · Document Q&A with Retrieval-Augmented Generation

**Difficulty:** ★★★★☆ Senior · **Archetype:** D (Next.js) · **Folder:** `projects/36-ai-rag-document-qa`

**Description**
Upload PDFs, Word documents, and Markdown into collections, then ask questions. Answers stream from Claude with inline citations that link to the exact passage and page. Retrieval is hybrid (vector plus keyword), access-controlled per collection, and measured with an evaluation set.

**Real-world use case**
Internal knowledge assistants, policy and contract Q&A, and support deflection. RAG is the most widely deployed LLM architecture in businesses.

**Technology stack**
Next.js (App Router) · TypeScript · Drizzle · PostgreSQL + pgvector (HNSW) · transformers.js (local embeddings) · Claude API (streaming) · `pdfjs-dist` · mammoth (DOCX) · Auth.js · Vitest · PGlite (pgvector) · Playwright

**Main features**
- Collections with document upload (PDF, DOCX, Markdown, HTML)
- An ingestion pipeline (extract → clean → chunk → embed → index) with status per document
- Chat over a collection with **streamed answers and inline citations** like `[1]`
- A source viewer that highlights the cited passage and shows the page number
- Conversation history with context-aware follow-up questions
- Explicit "not found in your documents" answers when the sources do not support an answer
- Answer feedback (thumbs up or down)

**Advanced features**
- **Structure-aware chunking** (by headings, with overlap), evaluated against fixed-size chunking
- **Hybrid retrieval:** pgvector cosine search plus PostgreSQL full-text search, fused with **Reciprocal Rank Fusion**
- Optional reranking
- **Query rewriting** turns follow-up questions into standalone queries
- **Citation verification:** cited chunks must be in the retrieved set, and quoted spans must appear verbatim in the source
- Prompt caching for stable context
- **Evaluation harness:** retrieval recall@k and MRR on a labeled set, plus answer faithfulness
- Token and cost tracking per question

**Database requirements**
PostgreSQL + pgvector: `collections`, `collection_members`, `documents`, `chunks` (`embedding vector(384)`, `tsvector`, page and offsets), `conversations`, `messages`, `citations`, `feedback`, `usage`. HNSW and GIN indexes.

**API requirements**
`POST /api/collections/:id/documents` · `GET /api/documents/:id/status` · `POST /api/chat` (streamed response) · `GET /api/chunks/:id` (source viewer) · `POST /api/feedback`. Ingestion runs as a background job.

**Authentication requirements**
Auth.js sessions. **Collection permissions are enforced inside the retrieval query itself,** so a user can never retrieve chunks from a collection they cannot access.

**Security considerations**
- Document content is untrusted: the model has no tools, and instructions inside documents are treated as data
- Rendered answers sanitized
- Upload type verification and size limits
- No document content in logs
- API keys server-side only

**Testing requirements**
- Chunker unit tests
- Reciprocal Rank Fusion tests
- **Retrieval tests** using PGlite with pgvector and the local embedding model
- Answer-pipeline tests with the fake model (citation parsing, verification, the "not found" path)
- **Permission tests:** cross-collection retrieval is impossible
- Live evaluation harness, gated on an API key

**Deployment strategy**
A Next.js container plus PostgreSQL with pgvector. The embedding model is cached in the image or a volume. The ingestion worker can run separately.

**Folder structure**
```
36-ai-rag-document-qa/
├── src/
│   ├── app/           # collections/, chat/, api/
│   ├── server/
│   │   ├── ingest/    # extract/, clean, chunk, embed, index
│   │   ├── retrieve/  # vector, keyword, rrf, rerank, permissions
│   │   ├── answer/    # prompt, stream, citations, verify
│   │   └── llm/       # provider interface, anthropic, fake
│   └── components/
├── evals/             # datasets, runner, results/
└── e2e/
```

**Learning objectives**
Retrieval-augmented generation end to end · embeddings and vector search · hybrid ranking · grounding and citation · LLM evaluation

---

## 37 · Meeting Intelligence: Transcription & Action Items

**Difficulty:** ★★★★☆ Senior · **Archetype:** C + E · **Folder:** `projects/37-ai-meeting-intelligence`

**Description**
Upload a meeting recording and get a transcript (produced locally with Whisper), a summary, decisions, and action items with owners and due dates, each linked to the exact moment in the recording. Long meetings are handled with map-reduce summarization.

**Real-world use case**
Meeting assistants (Otter, Fireflies, Zoom AI Companion), interview analysis, and call-center QA. The structured-extraction pattern applies to any unstructured text.

**Technology stack**
Express 5 · TypeScript · ffmpeg (`ffmpeg-static`) · transformers.js Whisper in worker threads · Claude API (structured output) · Drizzle · PostgreSQL · pg-boss · React 19 + Vite · Vitest · Playwright

**Main features**
- Audio and video upload, normalized to 16 kHz mono
- **Local transcription** with timestamps
- An interactive transcript synced to the audio player (click a sentence to jump)
- Speaker naming for segments
- Summary, key decisions, open questions, and action items (owner, due date, evidence)
- Edit and confirm action items, then export to Markdown or push to a webhook
- Search across meetings

**Advanced features**
- **Long-audio chunking** with overlap and timestamp stitching
- **Map-reduce summarization** with token budgeting for meetings longer than the context window
- **Structured output validated against JSON Schema**, with an automatic repair retry on invalid output
- **Evidence verification:** every action item must cite a transcript span that actually exists
- Optional PII redaction before any text leaves the server
- **Privacy mode:** audio never leaves the machine; only text is sent to the LLM (configurable)

**Database requirements**
PostgreSQL: `meetings`, `media_files`, `transcript_segments` (start, end, speaker, text), `speakers`, `summaries`, `action_items` (with evidence span), `jobs`. Full-text index on segments.

**API requirements**
`POST /api/v1/meetings` (upload) · `GET /meetings/:id` (status and results) · `GET /meetings/:id/transcript` · `PATCH /meetings/:id/speakers` · `PATCH /action-items/:id` · `POST /meetings/:id/export` · `GET /search?q=`

**Authentication requirements**
Sessions. Meetings are private to their owner, with optional sharing by link.

**Security considerations**
- Upload limits and media probing before processing
- Transcripts treated as untrusted input to the LLM; the extraction call has no tools
- Redaction applied before external calls when enabled
- Retention settings that delete media after processing

**Testing requirements**
- Audio preprocessing argument tests
- Chunk-stitching and timestamp tests
- **Transcription integration test** on a short public-domain clip with a word-error-rate threshold (model cached in CI)
- Schema validation and repair tests with the fake model
- Evidence verification tests
- Playwright: upload → transcript → action items (fake model)

**Deployment strategy**
API and transcription-worker containers. Workers are CPU-heavy and sized accordingly; GPU acceleration is noted as a future option.

**Folder structure**
```
37-ai-meeting-intelligence/
├── apps/
│   ├── api/
│   ├── worker/        # media/ (ffmpeg), transcribe/ (whisper worker threads), extract/
│   └── web/           # player-synced transcript, action items editor
├── packages/
│   └── extraction/    # schemas, map-reduce, evidence verification
└── test/fixtures/audio/
```

**Learning objectives**
Speech-to-text pipelines · structured LLM output · long-context strategies · evidence-grounded extraction · privacy-preserving AI design

---

## 38 · AI Ticket Triage & Classification Pipeline

**Difficulty:** ★★★★☆ Senior · **Archetype:** C + E · **Folder:** `projects/38-ai-ticket-triage-pipeline`

**Description**
A pipeline that classifies support tickets by category, priority, sentiment, language, and routing team, and drafts suggested replies. Low-confidence results go to a human review queue. Reviewer corrections improve future accuracy, and a dashboard reports accuracy, cost, and drift.

**Real-world use case**
Support operations at scale (Zendesk and Intercom AI triage), and more generally any high-volume LLM classification task where cost, accuracy, and human oversight all matter.

**Technology stack**
Fastify · TypeScript · Drizzle · PostgreSQL + pgvector · transformers.js (local embeddings) · Claude API (Messages and Message Batches) · React 19 + Vite · Vitest

**Main features**
- Ticket ingestion via webhook and CSV import
- Classification: category, priority, sentiment, language, and team
- Suggested reply drafts
- **Confidence thresholds** that route uncertain tickets to a human review queue
- A review UI to accept or correct results
- Taxonomy management (categories and teams)
- Metrics dashboard: accuracy against human labels, confusion matrix, cost per ticket, and latency

**Advanced features**
- **Two processing modes:** real time for new tickets, and the **Message Batches API** for backlogs at lower cost (full batch lifecycle: submit, poll, process results, and handle errored or expired requests)
- **Corrections as few-shot examples,** retrieved by similarity for future tickets
- Strict JSON Schema output validation
- Prompt caching for the taxonomy and few-shot block
- **Calibration analysis:** a reliability diagram comparing stated confidence with measured accuracy
- **Drift monitoring:** alerts when the category distribution shifts
- PII redaction before model calls
- A daily cost budget with a hard stop

**Database requirements**
PostgreSQL + pgvector: `tickets`, `classifications` (model, prompt version, confidence, cost), `reviews`, `examples` (embedding), `taxonomy`, `batches`, `metrics_daily`.

**API requirements**
`POST /api/v1/tickets` (webhook) · `POST /tickets/import` · `GET /review-queue` · `POST /tickets/:id/review` · `POST /batches` (backlog run) · `GET /batches/:id` · `GET /metrics` · `/taxonomy`

**Authentication requirements**
API keys for ingestion. Reviewer and admin sessions with roles.

**Security considerations**
- Ticket text is untrusted; classification calls have no tools and use a schema-constrained output
- PII redaction, and no raw ticket bodies in logs
- Budget enforcement prevents runaway spend
- Webhook authentication

**Testing requirements**
- Schema validation tests
- **Batch result processing** with recorded fixtures (succeeded, errored, and expired entries)
- Few-shot selection tests
- Metric computations (accuracy, confusion matrix, calibration)
- End-to-end pipeline tests with the fake model
- Live evaluation on a labeled set, gated on an API key

**Deployment strategy**
API and worker containers with PostgreSQL. Batch polling runs as a scheduled job.

**Folder structure**
```
38-ai-ticket-triage-pipeline/
├── apps/
│   ├── api/           # modules/tickets, review, batches, metrics, taxonomy
│   ├── worker/        # realtime classifier, batch submitter/poller
│   └── web/           # review queue, dashboard
├── packages/
│   └── triage/        # prompts, schemas, few-shot retrieval, calibration (pure)
└── evals/
```

**Learning objectives**
LLM classification in production · batch processing economics · human-in-the-loop design · calibration and drift · cost governance

---

## 39 · Model Context Protocol (MCP) Server Toolkit

**Difficulty:** ★★★★☆ Senior · **Archetype:** F (multi-package) · **Folder:** `projects/39-mcp-server-toolkit`

**Description**
A set of production-quality MCP servers that give AI assistants safe access to real systems: a read-only PostgreSQL analytics server, a documentation knowledge server, and a Git repository insights server. They support local (stdio) and remote (Streamable HTTP with OAuth) transports, alongside an example client that uses them through Claude.

**Real-world use case**
MCP is the open standard for connecting AI applications (Claude Desktop, Claude Code, IDEs) to tools and data. Companies build MCP servers to expose internal systems to assistants safely.

**Technology stack**
MCP TypeScript SDK (`@modelcontextprotocol/sdk`) · TypeScript · Zod · `pg` · `node-sql-parser` · `isomorphic-git` · a local BM25 index · Express 5 (HTTP transport) · OAuth 2.1 · Claude API (example client) · Vitest

**Main features**
- **Postgres server:** tools `list_tables`, `describe_table`, `run_select` (validated and row-limited); the schema exposed as a resource
- **Docs server:** Markdown files as resources, and a `search_docs` tool
- **Git server:** tools for recent commits, file history, and contributor summaries
- Prompt templates (the MCP prompts primitive)
- stdio transport for local use and Streamable HTTP for remote use
- An example chat client that connects to the servers and uses their tools through Claude
- Ready-to-paste configuration for Claude Desktop and Claude Code

**Advanced features**
- **OAuth 2.1 authorization for the remote server,** following the MCP authorization specification (protected-resource metadata)
- Structured tool output with declared output schemas
- Progress notifications and cancellation for long-running tools
- Resource pagination
- Each server packaged to run with `npx`

**Database requirements**
None owned by the toolkit. The Postgres server connects to a target database through a dedicated read-only role. A sample database is provided for demos and tests.

**API requirements**
MCP tools, resources, and prompts, each with JSON Schema inputs, documented per server. HTTP transport at `/mcp`, with OAuth metadata at the standard well-known endpoints.

**Authentication requirements**
stdio servers inherit the local user's trust. The HTTP server requires OAuth 2.1 bearer tokens with scopes per tool group.

**Security considerations**
- **Defense in depth for SQL:** read-only role, AST validation (one `SELECT` only, no dangerous functions), statement timeout, and row limits
- **Path sandboxing** for the docs server (no traversal outside the configured root)
- Git server read-only
- Tool results treated as untrusted by the client
- Rate limits on the HTTP transport

**Testing requirements**
- Every tool tested through the SDK's in-memory client/server transport
- A SQL validator test corpus of malicious queries
- Path traversal tests
- OAuth flow tests for the HTTP server
- A documented compatibility check with MCP Inspector

**Deployment strategy**
stdio servers distributed as npm-ready packages. The HTTP server ships as a container behind TLS.

**Folder structure**
```
39-mcp-server-toolkit/
├── packages/
│   ├── server-postgres/
│   ├── server-docs/
│   ├── server-git/
│   ├── shared/        # sql guard, path sandbox, auth helpers
│   └── example-client/  # Claude-powered chat that uses the servers
├── fixtures/          # sample database, docs, git repository
└── package.json
```

**Learning objectives**
The Model Context Protocol · designing tools for LLMs · safe data access for AI · OAuth for remote tools · packaging developer tools

---

## 40 · AI Text-to-SQL Data Analyst

**Difficulty:** ★★★★★ Expert · **Archetype:** C + E · **Folder:** `projects/40-ai-text-to-sql-analyst`

**Description**
Ask questions about business data in plain language. The system generates SQL with Claude, validates it through several layers of defense, runs it read-only, explains it, and charts the result. A semantic layer keeps metric definitions consistent, and an evaluation suite measures execution accuracy.

**Real-world use case**
Self-serve analytics for non-technical teams (the direction of Looker, Hex, and Databricks Genie). The security design matters as much as the AI: generated SQL is untrusted code.

**Technology stack**
Express 5 · TypeScript · PostgreSQL (row-level security, read-only role) · `node-sql-parser` · Claude API (tool use) · Vega-Lite · React 19 + Vite · Drizzle (application tables) · Vitest · PGlite

**Main features**
- Natural-language questions over a sample analytics dataset (synthetic e-commerce data, clearly labeled)
- Generated SQL shown and explained in plain language
- Results table with an automatically recommended chart
- **Self-correction:** database errors are fed back to the model (at most two retries)
- Conversational follow-ups ("now only for Q3")
- Saved queries, simple dashboards, and query history

**Advanced features**
- **Semantic layer:** metric and dimension definitions (for example, revenue excludes refunds) supplied to the model, so answers are consistent
- **Layered SQL defense:**
  1. AST validation (a single `SELECT`; allowlisted tables and columns; dangerous functions denied)
  2. A read-only database role
  3. `statement_timeout` and row limits
  4. **Row-level security,** so even valid SQL cannot cross tenant boundaries
- Chart specs validated against the Vega-Lite schema before rendering
- **Execution-accuracy evaluation:** natural-language questions with gold SQL, compared by result-set equivalence
- Caching of question-to-SQL results
- Cost tracking

**Database requirements**
PostgreSQL: a sample analytics schema (`customers`, `orders`, `order_items`, `products`, `refunds`) with RLS by tenant; application tables `conversations`, `queries`, `saved_queries`, `dashboards`, `semantic_models`.

**API requirements**
`POST /api/v1/ask` (streams progress: SQL → validation → results → chart → explanation) · `POST /queries/:id/run` · `/saved-queries` · `/dashboards` · `GET /schema` (with semantic-layer annotations)

**Authentication requirements**
Sessions. The user's tenant is set as a PostgreSQL session variable (`set_config`) on the read-only connection, which drives RLS.

**Security considerations**
- **Generated SQL is treated as hostile.** Every layer above is independently tested, and no single layer is trusted alone.
- Sample values shown to the model are untrusted (prompt injection through data)
- No multi-statement execution, no `COPY`, no `SELECT INTO`, no `set_config` from generated SQL
- Results are size-capped

**Testing requirements**
- **A validator corpus of malicious SQL:** `DROP`, chained statements, data-modifying CTEs, `pg_sleep`, `COPY`, `SELECT INTO`, `set_config`, comment tricks
- RLS isolation tests
- Pipeline tests with the fake model, including the self-correction loop
- Execution-accuracy evaluation, gated on an API key
- Chart spec validation tests

**Deployment strategy**
API container, static web app, and PostgreSQL with two roles (application and read-only analyst).

**Folder structure**
```
40-ai-text-to-sql-analyst/
├── apps/
│   ├── api/
│   │   ├── src/nl2sql/    # schema context, semantic layer, generate, repair loop
│   │   ├── src/sqlguard/  # ast validation, allowlists
│   │   ├── src/execute/   # read-only pool, timeouts, rls context
│   │   └── src/charts/
│   └── web/
├── evals/             # questions, gold SQL, runner
└── db/                # analytics schema, seed generator, roles, RLS policies
```

**Learning objectives**
LLM tool use for code generation · defense in depth · row-level security · semantic layers · execution-based evaluation

---

## 41 · AI Customer Support Agent

**Difficulty:** ★★★★★ Expert · **Archetype:** F (multi-package) · **Folder:** `projects/41-ai-support-agent`

**Description**
A tool-using support agent embedded in a demo store. It looks up orders, tracks shipments, starts returns, and issues refunds within policy. Higher-risk actions need human approval, and conversations can be handed off to a live agent console. A scenario-based evaluation suite guards against regressions.

**Real-world use case**
AI support agents (Intercom Fin, Sierra, Decagon). The hard parts are permission boundaries, policy compliance, and knowing when to escalate.

**Technology stack**
Express 5 · TypeScript · Claude API (tool use, streaming) · Drizzle · PostgreSQL + pgvector · transformers.js (help-center embeddings) · Server-Sent Events · WebSocket (agent console) · React 19 (chat widget as a Web Component, plus the console) · Vitest · Playwright

**Main features**
- An embeddable chat widget with streaming responses
- Tools: `lookup_order`, `track_shipment`, `start_return`, `issue_refund`, `search_help_center`, `create_ticket`, `handoff_to_human`
- Help-center answers grounded through retrieval
- Persistent conversation memory
- Live-agent console with handoff, the transcript, and an AI-written summary
- Analytics: resolution rate, handoff rate, and CSAT

**Advanced features**
- **Identity-bound tools:** order tools can only access the authenticated customer's orders, enforced in the tool layer, not in the prompt
- **Policy engine in code:** the return window and refund limits are checked before any tool executes
- **Human-in-the-loop:** refunds above a threshold create pending approvals; the conversation resumes after a decision
- An agent loop with iteration limits and timeouts, streaming tool progress
- **Guardrails:** prompt-injection screening on input, policy checks on output (no promises beyond policy), and PII redaction in logs
- **Scenario evaluations:** scripted multi-turn conversations graded by rules plus an LLM judge (for example, "refund requested outside the window must be declined with alternatives")

**Database requirements**
PostgreSQL + pgvector: demo commerce tables (`customers`, `orders`, `shipments`, `returns`, `refunds`), `conversations`, `messages`, `tool_calls` (audit), `approvals`, `handoffs`, `help_articles` (embedding), `feedback`.

**API requirements**
`POST /api/v1/conversations` · `POST /conversations/:id/messages` (SSE stream) · `GET /conversations/:id` · console: `GET /console/queue`, `POST /approvals/:id/decision`, WebSocket `/console/live` · `POST /feedback`

**Authentication requirements**
Customers authenticate through the host store's session (a signed widget token). Agents and admins use console sessions with roles.

**Security considerations**
- **The model never decides authorization.** Every tool re-checks identity and policy.
- All tool calls audited with inputs and outputs
- Monetary actions capped, and approval required above the threshold
- Help-center content and customer messages treated as untrusted
- Rate limits per conversation

**Testing requirements**
- Tool permission tests (cross-customer access is impossible)
- Policy engine unit tests
- Agent-loop tests with scripted fake-model tool calls (approval pause and resume, iteration limits, tool errors)
- Guardrail tests
- Scenario evaluations, gated on an API key, with committed results
- Playwright: customer chat → refund approval in the console → customer notified

**Deployment strategy**
API container, the widget served from a CDN, the console as a static app, and PostgreSQL.

**Folder structure**
```
41-ai-support-agent/
├── apps/
│   ├── api/
│   │   ├── src/agent/     # loop, tools/, policy/, guardrails/, memory
│   │   ├── src/console/   # queue, approvals, handoff
│   │   └── src/commerce/  # demo store domain
│   ├── widget/        # Web Component chat
│   └── console/
├── evals/scenarios/
└── compose.yaml
```

**Learning objectives**
Agent architecture · tool permissioning · human-in-the-loop systems · AI guardrails · scenario-based evaluation

---

## 42 · AI Pull-Request Review Bot (GitHub App)

**Difficulty:** ★★★★★ Expert · **Archetype:** E (API service) · **Folder:** `projects/42-ai-pr-review-bot`

**Description**
A GitHub App that reviews pull requests. On each push it fetches the changed code, asks Claude for a structured review, and posts inline comments only on lines that are part of the diff. It reviews incrementally, deduplicates comments across pushes, respects per-repository configuration, and enforces cost limits.

**Real-world use case**
AI code review (CodeRabbit, GitHub Copilot review) and, more broadly, any GitHub App or webhook-driven integration.

**Technology stack**
Node.js + TypeScript · `@octokit/app` · `@octokit/webhooks` · Claude API (structured output) · Drizzle · PostgreSQL · pg-boss · `parse-diff` · Zod · Vitest · MSW (GitHub API mocks)

**Main features**
- Reviews on `pull_request` `opened` and `synchronize` events
- Inline comments with severity, category, explanation, and suggested-change blocks
- A summary review comment
- Per-repository configuration in `.reviewbot.yml` (paths to ignore, severity threshold, custom guidelines)
- Comment commands: `/reviewbot re-review` and `/reviewbot ignore`
- A check run reporting status

**Advanced features**
- **Diff-position mapping:** comments are placed only on lines present in the diff (a GitHub API requirement)
- **Incremental review:** on `synchronize`, only changes since the last reviewed commit are reviewed
- **Deduplication:** an equivalent comment is never repeated; outdated ones are resolved
- Hunk-level chunking with token budgets, and prompt caching of repository guidelines
- Installation-token caching until expiry, and handling of GitHub's secondary rate limits (`Retry-After`)
- Daily cost limits per repository
- Secret-pattern detection that warns about leaked credentials in diffs
- **Evaluation on seeded-bug fixtures:** detection rate and false-positive rate

**Database requirements**
PostgreSQL: `installations`, `repositories` (config cache, budget), `pull_requests` (last reviewed SHA), `reviews`, `review_comments` (fingerprint), `usage`. pg-boss queues.

**API requirements**
`POST /api/github/webhooks` (signature-verified) · `GET /healthz` · `GET /admin/usage` (protected). Outbound: the GitHub REST API (pulls, reviews, checks, compare).

**Authentication requirements**
GitHub App JWT (signed with the App's private key) exchanged for short-lived installation tokens. Webhooks verified with HMAC-SHA256 using a timing-safe comparison.

**Security considerations**
- Least-privilege App permissions (`pull_requests: write`, `contents: read`, `checks: write`)
- **Pull-request code is never executed**
- PR content may contain prompt injection; the model has no side-effecting tools and its output is schema-constrained, so the worst case is a bad comment
- Fork PRs handled safely
- The private key loaded from a secret store, never logged

**Testing requirements**
- Webhook signature tests
- **Position-mapping unit tests** (multi-hunk, renames, deletions)
- Handler tests driven by recorded webhook payloads
- Deduplication and incremental-review tests
- GitHub API interactions mocked with MSW; LLM via the fake model
- Seeded-bug evaluation, gated on an API key

**Deployment strategy**
A container. App registration through GitHub's manifest flow is documented. Local development receives webhooks through a forwarding tunnel.

**Folder structure**
```
42-ai-pr-review-bot/
├── src/
│   ├── github/        # app auth, webhooks, api client, rate limits
│   ├── review/        # diff parsing, chunking, prompt, positions, dedupe
│   ├── config/        # .reviewbot.yml schema
│   ├── jobs/
│   └── llm/
├── test/fixtures/     # webhook payloads, diffs
└── evals/seeded-bugs/
```

**Learning objectives**
GitHub App development · webhook security · diff mechanics · LLM-assisted code analysis · cost-aware AI services

---

## 43 · Autonomous Research Agent

**Difficulty:** ★★★★★ Expert · **Archetype:** C + E · **Folder:** `projects/43-ai-research-agent`

**Description**
Give it a research question and it plans sub-questions, runs parallel worker agents that search and read the web, then writes a cited report. A critic pass verifies each claim against its source. Runs are budgeted, resumable, and streamed live to the UI.

**Real-world use case**
Deep-research assistants, market and competitor analysis, and literature reviews. The orchestrator-worker pattern is a core multi-agent architecture.

**Technology stack**
Express 5 · TypeScript · Claude API (tool use, including web search and fetch tools) · Drizzle · PostgreSQL · Server-Sent Events · React 19 + Vite · Vitest · Playwright

**Main features**
- Submit a question and review or edit the generated research plan before execution
- Parallel sub-agents that search, read, and take notes with sources
- A synthesized report with inline citations
- Live progress view: plan tree, active agents, and sources found
- Export the report to Markdown
- Run history

**Advanced features**
- **Orchestrator-worker architecture** with concurrency limits
- **Budgets:** maximum tokens, tool calls, wall-clock time, and cost, with graceful degradation when a budget runs out
- **Claim-level citation verification:** every claim maps to a quoted span, and the quote must appear in the fetched content
- Source deduplication, with publication date and domain shown
- Fetched-page caching
- **Resumable runs:** state is persisted after each step, so a crash resumes instead of restarting
- An evaluation set judged on citation accuracy and coverage

**Database requirements**
PostgreSQL: `runs` (question, plan, budget, status), `tasks`, `agent_steps`, `sources` (URL, title, fetched content hash), `notes`, `claims` (citation quote, verified flag), `reports`, `usage`.

**API requirements**
`POST /api/v1/runs` · `PUT /runs/:id/plan` (edit before execution) · `POST /runs/:id/start` · `GET /runs/:id/events` (SSE) · `POST /runs/:id/cancel` · `GET /runs/:id/report` · `GET /runs`

**Authentication requirements**
Sessions, with per-user budgets and a daily cost cap.

**Security considerations**
- **Web content is untrusted:** worker agents have no side-effecting tools, and injected instructions in pages cannot trigger actions
- Any fetching the project performs itself is SSRF-protected
- Rendered reports sanitized
- Per-user budgets prevent runaway spend

**Testing requirements**
- Orchestrator tests with the scripted fake model (planning, fan-out, budget exhaustion, cancellation)
- Citation verification tests (fabricated quotes are rejected)
- Resume-after-crash tests
- SSE event-stream tests
- Live evaluation, gated on an API key
- Playwright: submit → edit plan → watch progress → report (fake model)

**Deployment strategy**
API and worker containers with PostgreSQL. Long runs execute in workers, not in request handlers.

**Folder structure**
```
43-ai-research-agent/
├── apps/
│   ├── api/
│   │   ├── src/orchestrator/  # planner, scheduler, budget, synthesis, critic
│   │   ├── src/workers/       # research agent loop, tools
│   │   ├── src/verify/        # claim-quote verification
│   │   └── src/events/
│   └── web/
└── evals/
```

**Learning objectives**
Multi-agent orchestration · budgeting and cost control · citation grounding · durable long-running processes · streaming UX for agents

---

## 44 · LLM Evaluation & Prompt Management Platform

**Difficulty:** ★★★★★ Expert · **Archetype:** D (Next.js) + CLI + SDK · **Folder:** `projects/44-llm-eval-platform`

**Description**
An LLMOps platform for teams shipping AI features. It versions prompts, manages test datasets, runs evaluations with several kinds of scorers (including LLM-as-judge), compares versions with statistical confidence, and gates CI pipelines on quality thresholds. A runtime SDK serves the production prompt version.

**Real-world use case**
Prompt and evaluation tooling (Braintrust, LangSmith, Promptfoo, Humanloop). Teams need this once more than one person edits prompts or more than one model is in use.

**Technology stack**
Next.js (App Router) · TypeScript · Drizzle · PostgreSQL · pg-boss · Claude API (Messages and Message Batches) · transformers.js (similarity scoring) · `quickjs-emscripten` (custom scorers) · a Node.js CLI · a TypeScript SDK · Vitest · Playwright

**Main features**
- **Prompt registry:** versioned prompts with variables and model parameters, version diffs, and environment labels (development, staging, production)
- **Datasets:** test cases with inputs and expected outputs or grading criteria; CSV and JSONL import
- **Eval runs:** prompt version × dataset × model
- **Scorers:** exact match, regex, JSON Schema validity, semantic similarity, LLM-as-judge with a rubric, and sandboxed custom JavaScript scorers
- Side-by-side comparison of runs with per-case diffs
- Cost, latency, and token tracking
- **CLI for CI:** `evals run --gate "accuracy>=0.9"` exits non-zero when quality regresses
- **Runtime SDK** that fetches the production prompt version, with caching

**Advanced features**
- **Statistical comparison:** bootstrap confidence intervals and paired tests between runs
- A concurrency-controlled runner that respects rate limits (`429` / `Retry-After`)
- **Response caching** keyed by a hash of prompt, parameters, and input, to avoid paying twice
- Large runs submitted through the Message Batches API
- **Judge calibration:** agreement with human labels (Cohen's kappa)
- Reproducibility metadata for every run (model, parameters, prompt hash)
- **Promotion workflow:** RBAC, approvals, and an audit trail for moving a prompt to production
- Sampled production traces that can be turned into dataset cases

**Database requirements**
PostgreSQL: `projects`, `prompts`, `prompt_versions`, `labels`, `datasets`, `cases`, `runs`, `results` (output, scores, tokens, latency, cost), `scorers`, `judgements`, `traces`, `approvals`, `audit_log`, `api_keys`, `response_cache`.

**API requirements**
REST under `/api/v1`: `prompts`, `prompts/:id/versions`, `prompts/:id/labels`, `datasets`, `datasets/:id/cases`, `runs` (create, status, results, compare), `traces`, and SDK endpoint `GET /api/v1/sdk/prompts/:name?label=production`.

**Authentication requirements**
Sessions with project roles (viewer, editor, approver, admin). SDK and CLI use project API keys with scopes.

**Security considerations**
- Custom scorers run in the QuickJS sandbox with limits
- Provider keys stored encrypted and never returned by the API
- Promotion requires approval and is audited
- Trace sampling with PII redaction
- Per-project budget caps

**Testing requirements**
- Scorer unit tests
- Statistics tests against known distributions
- Runner tests (concurrency, retries, caching) with the fake model
- Batch lifecycle tests with recorded fixtures
- CLI gate exit-code tests
- SDK caching tests
- Playwright: create prompt → dataset → run → compare

**Deployment strategy**
A Next.js container, a runner worker container, and PostgreSQL. The CLI and SDK are npm-ready packages.

**Folder structure**
```
44-llm-eval-platform/
├── apps/
│   ├── web/           # Next.js: prompts, datasets, runs, compare, admin
│   └── runner/        # job execution, batching, caching
├── packages/
│   ├── scorers/       # exact, regex, schema, similarity, judge, custom (sandbox)
│   ├── stats/         # bootstrap, paired tests, kappa
│   ├── cli/           # evals run --gate
│   └── sdk/           # runtime prompt fetching
└── package.json
```

**Learning objectives**
LLMOps · evaluation methodology and statistics · prompt versioning and release management · CI quality gates · cost-efficient batch inference
