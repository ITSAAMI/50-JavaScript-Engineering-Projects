# Tier 1 — Modern JavaScript, TypeScript & Frontend Engineering

**Projects 01–11.** This tier builds the foundations that later tiers assume: language mastery, the browser and Node.js runtimes, data structures, performance, and accessibility. No project here is a beginner exercise. Each one reimplements, from first principles, the kind of tool that professional frameworks are built on.

Difficulty scale: ★★☆☆☆ Intermediate · ★★★☆☆ Advanced · ★★★★☆ Senior · ★★★★★ Expert.
Archetypes (A–F) are defined in [ARCHITECTURE.md §4](../../ARCHITECTURE.md#4-project-archetypes).

---

## 01 · Signals — Fine-Grained Reactive State Library

**Difficulty:** ★★☆☆☆ Intermediate · **Archetype:** A (Library) · **Folder:** `projects/01-signals-reactive-state`

**Description**
A dependency-free TypeScript library for fine-grained reactivity: signals, computed values, and effects with automatic dependency tracking, glitch-free propagation, and batching. Includes a React adapter.

**Real-world use case**
This model powers SolidJS, Preact Signals, Angular signals, and the TC39 Signals proposal. Teams use it for high-frequency UI updates (dashboards, editors, trading screens) where re-rendering whole component trees is too slow.

**Technology stack**
TypeScript · tsup (ESM + CJS + `.d.ts`) · Vitest · fast-check · tinybench · React 19 (`useSyncExternalStore`) · Vite demo app · TypeDoc

**Main features**
- `signal()` with `get`, `set`, `update`, and `peek`
- `computed()`: lazy and memoized, recomputed only when a dependency changed
- `effect()` with cleanup functions and disposal
- `batch()` and `untrack()`
- React bindings: `useSignal`, `useComputed`, `useSignalEffect`
- Demo app: a live-updating dashboard driven by signals

**Advanced features**
- Push-pull algorithm with height-based ordering, so propagation is **glitch-free** (no observer ever sees inconsistent intermediate state)
- Dynamic dependency tracking: dependencies may change between runs
- Cycle detection that throws a descriptive error
- Ownership tree (`createRoot`) for automatic disposal of nested effects
- Custom equality functions
- Dependency-graph inspector in the demo app
- Benchmarks against a naive event-emitter store and `@preact/signals-core`

**Database requirements**
None. The demo uses an optional `localStorage` persistence helper.

**API requirements**
A public TypeScript API documented with TSDoc, with a generated API reference (TypeDoc).

**Authentication requirements**
None (library).

**Security considerations**
- Zero runtime dependencies, so supply-chain exposure is minimal
- No `eval` or dynamic code
- SSR-safe: no module-level mutable state leaks between requests (tracking context is scoped)

**Testing requirements**
- Propagation order, the diamond-dependency glitch case, dynamic dependencies, cleanup order, and error propagation
- **Property-based test:** after any random sequence of writes, every computed equals a from-scratch recomputation
- React adapter tests with Testing Library, including concurrent-rendering tearing checks
- At least 95% line coverage for the core

**Deployment strategy**
An npm-ready package (dual format, `publint` + `attw` verified, provenance-ready publish workflow). It is not published without the owner's approval. The demo deploys as a static site.

**Folder structure**
```
01-signals-reactive-state/
├── src/
│   ├── core/          # graph.ts, signal.ts, computed.ts, effect.ts, batch.ts
│   ├── react/         # hooks.ts (useSyncExternalStore adapter)
│   └── index.ts
├── test/              # unit, property, react
├── bench/
├── demo/              # Vite app
└── package.json
```

**Learning objectives**
Reactive programming theory · dependency graphs and topological ordering · closures and garbage collection · library packaging (exports maps, dual formats) · React external stores · benchmarking methodology

---

## 02 · Forge — Project Scaffolding CLI

**Difficulty:** ★★☆☆☆ Intermediate · **Archetype:** B (CLI) · **Language:** JavaScript + JSDoc (`checkJs`) · **Folder:** `projects/02-project-scaffolder-cli`

**Description**
An interactive CLI (`create-forge`) that scaffolds new projects from versioned templates and composes optional feature plugins (ESLint, Docker, CI, testing) into the result.

**Real-world use case**
Platform teams standardize how new services are created, like `create-vite`, `create-t3-app`, or Backstage software templates. Consistent scaffolding removes days of setup and configuration drift.

**Technology stack**
Node.js (ESM JavaScript with JSDoc types checked by `tsc`) · `node:util` `parseArgs` · `@clack/prompts` · `node:child_process` · `node:fs/promises` · Vitest · Node Single Executable Applications (SEA)

**Main features**
- Interactive mode and fully non-interactive flag mode (CI-friendly)
- Templates: Express API, React SPA, TypeScript library
- Feature plugins: ESLint + Prettier, Vitest, Dockerfile, GitHub Actions CI
- Variable interpolation in file contents and file names
- Package manager detection (npm, pnpm, yarn, bun) and dependency installation
- `git init` with an initial commit
- `--dry-run` prints the planned file tree without writing anything
- Safe handling of non-empty target directories

**Advanced features**
- Plugin system with lifecycle hooks (`prompts`, `files`, `packageJson`, `postInstall`) and declared ordering dependencies between plugins
- Deep merge of `package.json` and JSON config contributions from several plugins
- **Transactional writes:** generate into a temporary directory and move it into place atomically, rolling back on failure
- Remote templates from GitHub tarballs, pinned to a tag or commit
- Generated projects are themselves verified: CI generates every template and runs its tests
- Standalone executables for Windows and Linux built with Node SEA

**Database requirements**
None.

**API requirements**
A documented CLI (commands, flags, exit codes) and a programmatic `createProject(options)` API.

**Authentication requirements**
None. An optional `GITHUB_TOKEN` can be used for private template repositories. It is read from the environment and never logged.

**Security considerations**
- Path traversal protection for template file names (rejects `..` and absolute paths)
- Zip-slip-safe tarball extraction
- Child processes spawned with argument arrays and `shell: false` (no shell injection)
- Project names validated against npm naming rules

**Testing requirements**
- Unit tests: interpolation, JSON merging, name validation, plugin ordering
- Integration tests: run the CLI against temporary directories and snapshot the generated trees
- Prompt flows tested by injecting answers
- CI-only end-to-end test: generate each template, install it, and run its own test suite

**Deployment strategy**
An npm package with a `bin` entry (`npx create-forge`) plus SEA binaries attached to GitHub Releases.

**Folder structure**
```
02-project-scaffolder-cli/
├── bin/forge.js
├── src/
│   ├── commands/      # create.js, list-templates.js
│   ├── core/          # plan.js, render.js, merge.js, transaction.js
│   ├── plugins/       # eslint/, docker/, ci/, vitest/
│   └── pm/            # package-manager detection & install
├── templates/         # express-api/, react-spa/, ts-library/
├── test/
└── jsconfig.json      # checkJs: true, strict
```

**Learning objectives**
CLI ergonomics and exit codes · child processes · safe file system operations · plugin architectures · typed JavaScript without a compile step · distributing Node.js programs

---

## 03 · Focus Guard — Manifest V3 Browser Extension

**Difficulty:** ★★☆☆☆ Intermediate · **Archetype:** C (SPA variant) · **Language:** JavaScript + JSDoc · **Folder:** `projects/03-focus-guard-extension`

**Description**
A privacy-first browser extension for focused work. It blocks distracting sites during focus sessions, tracks time per domain, and shows weekly insights in a side panel. All data stays on the device.

**Real-world use case**
Productivity tools (Freedom, StayFocusd), and more broadly the extension component that many SaaS products ship (password managers, Grammarly, dev tools).

**Technology stack**
JavaScript (ESM + JSDoc) · Manifest V3 · Vite (multi-entry build) · Chrome Extension APIs (`declarativeNetRequest`, `alarms`, `storage`, `tabs`, `idle`, `sidePanel`) · Vitest · Playwright (Chromium with the unpacked extension loaded)

**Main features**
- Block lists with wildcard domain patterns
- Focus sessions (Pomodoro-style) driven by `chrome.alarms`, so they survive service-worker termination
- Custom block page showing the remaining time, with a deliberate unlock delay
- Per-domain time tracking that accounts for the active tab, window focus, and idle state
- Options page and side-panel dashboard with weekly charts

**Advanced features**
- Blocking through dynamic `declarativeNetRequest` rules regenerated from state, which avoids the broad `webRequest` permission
- Event-driven service worker: all state persisted in `chrome.storage`, with nothing held only in memory
- Scheduled blocking (for example weekdays 09:00–17:00)
- Data export and import as JSON with schema validation
- Quota-aware chunking for `chrome.storage.sync`
- Localization via `_locales`

**Database requirements**
`chrome.storage.local` for daily per-domain aggregates (compacted over time) and `chrome.storage.sync` for settings.

**API requirements**
A typed internal message protocol between the service worker, side panel, options page, and block page, validated on receipt.

**Authentication requirements**
None. The extension is local-only by design.

**Security considerations**
- Least-privilege permissions, justified in the README
- No remote code (MV3 CSP)
- Validates message senders (`sender.id`)
- No browsing data ever leaves the device

**Testing requirements**
- Unit tests: pattern matching, rule generation, time aggregation with fake timers
- A small typed fake of the `chrome.*` APIs used by unit tests
- Playwright E2E: load the built extension, start a session, and confirm a blocked domain redirects to the block page

**Deployment strategy**
A packaging script produces a store-ready ZIP for the Chrome Web Store and Edge Add-ons. Store submission is a manual step for the owner.

**Folder structure**
```
03-focus-guard-extension/
├── public/manifest.json
├── public/_locales/
├── src/
│   ├── background/    # service worker: alarms, rules, tracking
│   ├── sidepanel/     # dashboard UI
│   ├── options/
│   ├── blocked/       # block page
│   └── shared/        # storage, messages, patterns
├── test/
└── e2e/
```

**Learning objectives**
The MV3 lifecycle · event-driven background design · declarative browser APIs · testing extensions · privacy by design

---

## 04 · Offline-First Markdown Notes (PWA + Sync Server)

**Difficulty:** ★★★☆☆ Advanced · **Archetype:** C + E · **Folder:** `projects/04-offline-notes-pwa`

**Description**
A Markdown notes app that works fully offline, installs as a PWA, and syncs across devices through a small server. Concurrent edits are detected and merged.

**Real-world use case**
Field-service apps, note-taking tools (Obsidian, Bear), and any product that must stay usable on unreliable connections.

**Technology stack**
React 19 · Vite · TypeScript · IndexedDB (`idb`) · Workbox (`vite-plugin-pwa`) · CodeMirror 6 · markdown-it + DOMPurify · MiniSearch · Sync server: Express 5 + SQLite (built-in `node:sqlite`) · Vitest · `fake-indexeddb` · Playwright

**Main features**
- Notes with notebooks and tags, and a Markdown editor with live preview
- Fully offline: app shell and data, installable to the desktop or home screen
- Client-side full-text search
- Optional account for cross-device sync. Local use requires no account.
- Export and import as a ZIP of `.md` files

**Advanced features**
- **Sync protocol:** per-note revision numbers plus a server change log (pull since a cursor, push with a base revision)
- **Conflict handling:** three-way text merge (diff-match-patch). When a merge is impossible, both versions are kept and the conflict is shown to the user.
- A durable outbox of pending mutations, retried on reconnect
- Service-worker update flow with a "new version available" prompt
- Persistent storage request (`navigator.storage.persist`) and a quota display

**Database requirements**
- **Client:** IndexedDB stores `notes`, `outbox`, and `syncState`.
- **Server:** SQLite tables `users`, `notes`, `changes`, and `sessions` via `node:sqlite`, with migrations.

**API requirements**
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/sync/pull?since=<cursor>` returns changes and a new cursor
- `POST /api/sync/push` accepts a batch of mutations with base revisions and returns, per mutation, whether it was accepted or conflicted

**Authentication requirements**
Email and password (Argon2id). The sync API uses an opaque bearer token, stored hashed on the server.

**Security considerations**
- Rendered Markdown sanitized with DOMPurify, plus a strict CSP (no inline scripts)
- Per-user data isolation enforced in every server query
- Login rate limiting
- Tokens revocable on logout

**Testing requirements**
- Unit tests for the merge algorithm and the sync state machine
- IndexedDB repository tests with `fake-indexeddb`
- Server integration tests against in-memory SQLite
- Playwright: edit offline (`context.setOffline(true)`), reconnect, and verify the change appears on a second browser context

**Deployment strategy**
The PWA deploys to any HTTPS static host. The sync server ships as a container with a persistent volume for SQLite.

**Folder structure**
```
04-offline-notes-pwa/
├── apps/
│   ├── web/           # Vite PWA: features/notes, features/sync, features/search
│   └── server/        # Express + node:sqlite: modules/auth, modules/sync
├── packages/
│   └── sync-protocol/ # shared types, validation schemas, merge logic
├── e2e/
└── package.json       # npm workspaces
```

**Learning objectives**
Service-worker lifecycle · offline data modeling · sync and conflict resolution · IndexedDB · PWA installability · SQLite in Node.js

---

## 05 · Accessible Design System & Component Library

**Difficulty:** ★★★☆☆ Advanced · **Archetype:** A (Library) · **Folder:** `projects/05-accessible-design-system`

**Description**
A themeable React component library implementing the WAI-ARIA Authoring Practices patterns, driven by design tokens and documented in Storybook.

**Real-world use case**
Companies maintain internal design systems (Radix, GitHub Primer, Shopify Polaris) to ship consistent, accessible UI across many products and teams.

**Technology stack**
React 19 · TypeScript · CSS Modules + design tokens (CSS custom properties generated from a tokens JSON) · Floating UI · Vite library mode · Storybook · Vitest + Testing Library + `vitest-axe` · Playwright (visual regression) · Changesets

**Main features**
- Tokens for color, spacing, typography, radii, and motion, with light, dark, and high-contrast themes
- Components: Button, IconButton, TextField, Checkbox, Switch, RadioGroup, Select (listbox), Combobox (autocomplete), Dialog, Popover, Tooltip, Menu, Tabs, Accordion, Toast, Table
- Storybook docs with usage guidance and accessibility notes per component

**Advanced features**
- Focus management: focus trapping, focus return, roving `tabindex`, and typeahead in listboxes and menus
- Controlled and uncontrolled modes through a shared `useControllableState` hook
- `asChild` composition with correct typing
- Portals, layering, and collision-aware positioning
- `prefers-reduced-motion` and right-to-left (RTL) support
- Tree-shakeable output with per-component entry points and correct `sideEffects` declarations for CSS
- Visual regression tests for every story in every theme

**Database requirements**
None.

**API requirements**
Component prop APIs documented through Storybook autodocs and TSDoc.

**Authentication requirements**
None.

**Security considerations**
- No `dangerouslySetInnerHTML` anywhere in the library
- Minimal runtime dependencies (React and Floating UI only)
- Documented guidance for rendering untrusted content inside components

**Testing requirements**
- Keyboard interaction tests per component (arrow keys, Home and End, Escape, Tab order)
- ARIA role, state, and property assertions
- An axe check on every story
- Visual regression screenshots
- Type tests (`expectTypeOf`) for polymorphic and controlled props

**Deployment strategy**
The Storybook static build deploys to GitHub Pages. The package build is verified with `publint` and `attw`.

**Folder structure**
```
05-accessible-design-system/
├── tokens/            # tokens.json → generated CSS variables
├── src/
│   ├── components/<Name>/  # Name.tsx, Name.module.css, Name.stories.tsx, Name.test.tsx
│   ├── hooks/         # useControllableState, useFocusTrap, useRovingTabIndex
│   └── index.ts
├── .storybook/
├── scripts/build-tokens.ts
└── e2e/visual/
```

**Learning objectives**
Accessibility in depth · component API design · theming architecture · library build and distribution · documentation-driven development

---

## 06 · Browser Image Editor

**Difficulty:** ★★★☆☆ Advanced · **Archetype:** C (SPA) · **Folder:** `projects/06-browser-image-editor`

**Description**
A layer-based image editor that runs entirely in the browser. Adjustments are non-destructive, heavy filters run off the main thread, and every action can be undone.

**Real-world use case**
In-app image editing: avatar croppers, CMS image tools, and lightweight editors like Canva or Photopea.

**Technology stack**
React 19 · TypeScript · Vite · Canvas 2D + OffscreenCanvas · WebGL2 (fragment shaders) · Web Workers (Comlink) · Zustand · IndexedDB · Vitest · Playwright

**Main features**
- Open images by file picker, drag and drop, or paste
- Layers (image, text, shape) with reordering, opacity, and blend modes
- Crop, rotate, flip, and resize
- Adjustments: brightness, contrast, saturation, hue, exposure
- Filters: blur, sharpen, edge detection (convolution kernels), grayscale, sepia
- Brush and eraser tools
- Undo and redo
- Export to PNG, JPEG, or WebP with a quality setting

**Advanced features**
- Command pattern with **coalescing** (a whole slider drag becomes one history entry) and a memory-bounded history
- Non-destructive adjustment stack recomputed from the original pixels
- A worker pool that processes image tiles using transferable `ImageData` buffers
- A WebGL2 shader pipeline for real-time previews, benchmarked against the CPU path
- Zoom and pan with correct high-DPI rendering
- Autosaved projects in IndexedDB
- EXIF orientation handling
- Keyboard shortcuts

**Database requirements**
IndexedDB for autosaved projects (layer metadata plus image blobs).

**API requirements**
No server API. A typed message API between the UI and workers.

**Authentication requirements**
None.

**Security considerations**
- Images decoded with `createImageBitmap`
- Pixel-count limits to prevent memory exhaustion
- Images never leave the device
- Strict CSP

**Testing requirements**
- Convolution and color math tested against golden pixel fixtures (with tolerance)
- Command history tests, including coalescing and memory bounds
- Pure filter functions tested in Node on `Uint8ClampedArray`
- Playwright: load an image, apply a filter, export, and compare against a reference

**Deployment strategy**
Static hosting (GitHub Pages or Cloudflare Pages).

**Folder structure**
```
06-browser-image-editor/
├── src/
│   ├── app/
│   ├── features/      # canvas/, layers/, tools/, adjustments/, history/, export/
│   ├── engine/        # pure pixel ops, kernels, color math
│   ├── gpu/           # WebGL2 programs and shaders
│   └── workers/       # tile worker, pool
├── test/fixtures/     # golden images
└── e2e/
```

**Learning objectives**
Pixel manipulation · workers and transferable objects · GPU shaders · the command pattern · performance profiling in the browser

---

## 07 · Full-Text Search Engine Library

**Difficulty:** ★★★☆☆ Advanced · **Archetype:** A (Library) · **Folder:** `projects/07-search-engine-library`

**Description**
An embeddable full-text search engine written from scratch in TypeScript, with BM25 ranking, typo tolerance, phrase queries, prefix autocomplete, and a compact binary index format. Runs in Node.js and the browser.

**Real-world use case**
Client-side documentation search (the niche of Lunr, MiniSearch, FlexSearch), offline search in apps, and a hands-on understanding of how Elasticsearch and Meilisearch rank results.

**Technology stack**
TypeScript · tsup · `Intl.Segmenter` · Vitest · fast-check · tinybench · Vite demo app

**Main features**
- Analyzer pipeline: Unicode normalization, tokenization (`Intl.Segmenter`), case folding, stopwords, and the Porter2 English stemmer
- Inverted index with postings (document, term frequency, positions)
- BM25 scoring with per-field boosts
- Boolean queries (AND, OR, NOT) and phrase queries using positions
- Prefix search for autocomplete
- Fuzzy search with a bounded edit distance
- Filters and facets on stored fields
- Highlighted result snippets
- Adding, updating, and removing documents

**Advanced features**
- Fuzzy matching via a **Levenshtein automaton** intersected with a sorted term dictionary
- Compact, versioned binary serialization (delta and varint-encoded postings in an `ArrayBuffer`)
- A query language with operator precedence, e.g. `title:react AND (hooks OR "server components") -class`
- Indexing and search inside a Web Worker in the demo
- **Relevance evaluation:** nDCG@10 measured on a labeled query set
- Benchmarks against MiniSearch

**Database requirements**
None. Indexes are persisted as binary files (Node) or in IndexedDB (browser demo).

**API requirements**
A library API (`createIndex`, `add`, `remove`, `search`, `suggest`, `serialize`, `load`) and a documented query-language grammar.

**Authentication requirements**
None.

**Security considerations**
- The query parser is linear-time, with no regular-expression backtracking on user input
- Limits on query length, number of clauses, and fuzzy expansions to prevent denial of service

**Testing requirements**
- Stemmer tested against the Porter2 reference vocabulary
- BM25 results compared with hand-computed scores
- **Property-based tests:** serialize→load is lossless; adding then removing documents restores the index
- Fuzz tests for the query parser
- A relevance regression test that fails if nDCG drops below a threshold

**Deployment strategy**
An npm-ready package and a static demo site that searches an openly licensed corpus (with attribution).

**Folder structure**
```
07-search-engine-library/
├── src/
│   ├── analysis/      # tokenizer, normalizer, stemmer, stopwords
│   ├── index/         # postings, dictionary, document store
│   ├── query/         # lexer, parser, planner, executor
│   ├── scoring/       # bm25
│   ├── fuzzy/         # levenshtein automaton
│   └── codec/         # binary serialization
├── test/
├── bench/
└── demo/
```

**Learning objectives**
Information-retrieval fundamentals · tries, automata, and postings · binary encoding · relevance evaluation · parser design

---

## 08 · Streaming Log Analytics CLI

**Difficulty:** ★★★☆☆ Advanced · **Archetype:** B (CLI) · **Language:** JavaScript + JSDoc · **Folder:** `projects/08-log-analytics-cli`

**Description**
A high-throughput CLI that streams multi-gigabyte web server logs, computes traffic, latency, and error analytics in parallel with bounded memory, and outputs JSON or a self-contained HTML report.

**Real-world use case**
Incident investigation and capacity planning when logs are not yet in a central platform. Similar in spirit to GoAccess, and a model for the stream processing that log pipelines do.

**Technology stack**
Node.js (ESM JavaScript + JSDoc) · `node:stream` · `node:worker_threads` · `node:zlib` · Vitest · minimal dependencies

**Main features**
- Formats: Nginx and Apache combined, JSON Lines, and custom format strings
- Inputs: files, globs, `.gz` files, and stdin
- Metrics: requests per time bucket, status-code distribution, top paths, IPs, and user agents, latency percentiles (p50, p95, p99), error rate, and bandwidth
- Filters: time range, status, and path pattern
- Output: terminal tables, JSON, or an HTML report with inline SVG charts

**Advanced features**
- **Parallelism:** files are split into byte ranges aligned on newlines and processed by worker threads, whose partial results are merged
- **Streaming algorithms with bounded memory:** t-digest for percentiles, Count-Min Sketch plus a heap for top-k, HyperLogLog for unique visitors (all mergeable across workers)
- A buffer-level line parser that avoids per-line string allocation
- `--follow` mode with rolling time windows
- Throughput and peak-memory benchmarks on generated datasets

**Database requirements**
None.

**API requirements**
A documented CLI and a programmatic `analyze(options)` API.

**Authentication requirements**
None.

**Security considerations**
- All log-derived strings are escaped in the HTML report, because log injection would otherwise become XSS
- User-supplied regular expressions are validated and run with a time budget (ReDoS)
- Malformed lines are counted and reported, never fatal

**Testing requirements**
- Parser fixtures, including malformed and adversarial lines
- **Sketch accuracy tests:** results stay within documented error bounds compared with exact computation
- **Mergeability tests:** merging partitions equals processing the whole input
- Snapshot test for the HTML report
- Separate benchmark script (not part of `npm test`)

**Deployment strategy**
An npm `bin` package plus Node SEA single-file executables.

**Folder structure**
```
08-log-analytics-cli/
├── bin/logscope.js
├── src/
│   ├── input/         # file splitting, gzip, stdin
│   ├── parse/         # format compilers, buffer line parser
│   ├── sketches/      # tdigest.js, count-min.js, hyperloglog.js, topk.js
│   ├── workers/       # partition worker, merge
│   └── report/        # table, json, html
├── test/
└── bench/             # dataset generator, benchmarks
```

**Learning objectives**
Streams and backpressure · worker threads · probabilistic data structures · low-level performance tuning · safe report generation

---

## 09 · HTTP Framework from Scratch

**Difficulty:** ★★★☆☆ Advanced · **Archetype:** A (Library) · **Folder:** `projects/09-http-framework`

**Description**
A small, strongly typed web framework built directly on `node:http`, with a radix-tree router, onion middleware, schema validation, and graceful shutdown. Benchmarked against Express and Fastify.

**Real-world use case**
Understanding what frameworks do and what they cost. The same building blocks appear in internal frameworks, API gateways, and serverless adapters.

**Technology stack**
TypeScript · `node:http` · `node:stream` · Zod (validation adapter) · Vitest · autocannon · tsup

**Main features**
- Radix-tree router with parameters and wildcards, method routing, and correct 404 vs 405 responses (with an `Allow` header)
- Async onion middleware (`await next()`)
- Body parsing (JSON, URL-encoded, text) with size limits and content-type checks
- Response helpers (JSON, streams, status, headers, cookies)
- Route groups and prefixes
- Centralized error handling with RFC 9457 Problem Details
- **Route parameters typed from the path string** via template-literal types

**Advanced features**
- Per-route schemas with inferred types for body, query, and params
- Streaming request and response bodies with backpressure
- Automatic `HEAD` and `OPTIONS`, ETags, and conditional `GET`
- CORS and security-header middleware
- Request timeouts with `AbortSignal` propagation
- Graceful shutdown that drains keep-alive connections
- Plugin encapsulation
- **Published benchmarks** (requests per second and p99 latency) against Express 5 and Fastify, with methodology

**Database requirements**
None. The example application uses an in-memory repository.

**API requirements**
Framework API documentation and an example REST application built with it.

**Authentication requirements**
The example app includes an HMAC-SHA256 JWT middleware implemented with `node:crypto`.

**Security considerations**
- Body and header size limits
- Prototype-pollution-safe query parsing (rejects `__proto__`, `constructor`, and `prototype`)
- Path normalization that handles encoded slashes
- Slow-client (Slowloris) mitigation through `headersTimeout` and `requestTimeout`

**Testing requirements**
- Router precedence and conflict tests
- Type tests for inferred parameters
- Integration tests over real sockets
- A fuzz test for the query parser
- A benchmark script with documented results

**Deployment strategy**
An npm-ready package. The example app ships with a Dockerfile.

**Folder structure**
```
09-http-framework/
├── src/
│   ├── router/        # radix tree, path types
│   ├── core/          # app, context, middleware compose
│   ├── body/          # parsers with limits
│   ├── middleware/    # cors, security-headers, etag
│   └── validation/
├── example/           # REST app built with the framework
├── test/
└── bench/
```

**Learning objectives**
HTTP semantics · Node.js networking internals · routing data structures · type-level TypeScript · benchmarking discipline

---

## 10 · OpenAPI → TypeScript SDK Generator

**Difficulty:** ★★★☆☆ Advanced · **Archetype:** B (CLI) · **Folder:** `projects/10-openapi-sdk-generator`

**Description**
A code generator that turns an OpenAPI 3.x document into a typed, tree-shakeable TypeScript client with runtime response validation, retries, pagination helpers, and authentication.

**Real-world use case**
API platform teams publish SDKs generated from their specs (Stripe and GitHub's Octokit both work this way), keeping clients in lockstep with server contracts.

**Technology stack**
TypeScript · YAML parser · a custom `$ref` resolver · TypeScript compiler factory API (AST-based code generation) · Zod · Prettier · Vitest · MSW

**Main features**
- Parse and validate OpenAPI 3.0 and 3.1 (YAML or JSON)
- Resolve `$ref`s, including cycles
- Generate types for schemas: objects, enums, `oneOf`, `anyOf`, `allOf`, discriminators, nullable
- One typed function per operation (params, body, responses), grouped by tag
- Optional Zod schemas for runtime response validation
- A fetch-based runtime: base URL, auth (bearer, API key, basic), and timeouts
- CLI: `openapi-sdk generate spec.yaml -o ./sdk`

**Advanced features**
- Retries with exponential backoff that respect `Retry-After` and only retry idempotent methods
- Async-iterator pagination helpers driven by a vendor extension
- Typed error unions per HTTP status code
- **Deterministic output** (stable ordering) so regenerated SDKs produce clean diffs
- Watch mode
- Tested against real-world specs (Petstore, plus subsets of the GitHub and Stripe APIs). Generated code is compiled with `tsc` as part of the tests.

**Database requirements**
None.

**API requirements**
A CLI and a programmatic `generate()` API. The generated SDK's API is documented in its own generated README.

**Authentication requirements**
Generated clients implement the spec's `securitySchemes`.

**Security considerations**
- Remote `$ref` fetching is disabled by default (SSRF risk)
- Every identifier and string from the spec is escaped or sanitized before it is emitted as code, preventing code injection from a malicious spec
- No `eval` anywhere

**Testing requirements**
- Snapshot tests of generated output
- "Compile tests" that run `tsc` on every generated SDK
- Runtime tests of generated clients against an MSW mock server
- Edge-case specs: recursive schemas, name collisions, and reserved words

**Deployment strategy**
An npm `bin` package, plus an example GitHub Actions workflow that regenerates an SDK when a spec changes.

**Folder structure**
```
10-openapi-sdk-generator/
├── src/
│   ├── parse/         # load, validate, resolve refs
│   ├── model/         # normalized intermediate representation
│   ├── generate/      # types, operations, zod, index
│   ├── runtime/       # fetch client copied into generated SDKs
│   └── cli.ts
├── test/specs/        # petstore, github-subset, stripe-subset, edge cases
└── test/
```

**Learning objectives**
Abstract syntax trees and code generation · JSON Schema semantics · API contract design · designing TypeScript types for consumers

---

## 11 · Spreadsheet Engine with Virtualized Grid

**Difficulty:** ★★★★☆ Senior · **Archetype:** C (SPA) · **Folder:** `projects/11-spreadsheet-engine`

**Description**
A browser spreadsheet with a real formula engine (parser, dependency graph, incremental recalculation) that renders a million-cell sheet smoothly through virtualization.

**Real-world use case**
Data-heavy interfaces: Google Sheets, Airtable, financial models, and admin grids.

**Technology stack**
React 19 · TypeScript · Vite · a framework-agnostic engine package · Web Worker · IndexedDB · Vitest · fast-check · Playwright

**Main features**
- Row and column virtualization
- Range selection, keyboard navigation, and in-cell editing
- Copy and paste as TSV (interoperable with Excel and Google Sheets)
- Formulas: arithmetic, comparisons, string concatenation, A1 references, ranges, and absolute references (`$A$1`)
- Functions: SUM, AVERAGE, MIN, MAX, COUNT, IF, AND, OR, XLOOKUP, CONCAT, ROUND, TODAY, and more
- Error values: `#REF!`, `#DIV/0!`, `#NAME?`, `#VALUE!`, `#CYCLE!`
- Multiple sheets and CSV import and export

**Advanced features**
- A **Pratt parser** producing an AST
- A dependency graph with reverse edges and **topological recalculation of only the affected cells**
- Cycle detection (Tarjan's strongly connected components)
- **Range dependencies stored in an interval index**, so `SUM(A1:A100000)` does not create 100,000 edges
- Reference rewriting on row and column insert or delete, and relative references on paste
- Recalculation in a Web Worker for large sheets
- Number formats via `Intl.NumberFormat`, column resizing, and frozen panes
- Undo and redo
- An accessible ARIA grid

**Database requirements**
IndexedDB for saved workbooks.

**API requirements**
An engine API (`setCell`, `getValue`, `subscribe`) independent of the UI.

**Authentication requirements**
None.

**Security considerations**
- Formulas are interpreted by the engine's own evaluator, never `eval` or `Function`
- **CSV/formula injection protection** on export (values starting with `=`, `+`, `-`, or `@` are escaped)

**Testing requirements**
- Parser precedence, associativity, and error tests
- Per-function evaluation tests with documented semantics
- **Property-based test:** incremental recalculation equals a full recalculation after any random sequence of edits
- Cycle tests
- A performance budget test: recalculating a 100,000-cell dependency chain must stay under a documented time
- Playwright tests for editing and clipboard behavior

**Deployment strategy**
Static hosting.

**Folder structure**
```
11-spreadsheet-engine/
├── packages/
│   └── engine/        # lexer, pratt parser, evaluator, functions/, graph/, refs/
├── apps/
│   └── web/           # virtualized grid, selection, editing, clipboard, worker bridge
├── e2e/
└── package.json       # npm workspaces
```

**Learning objectives**
Language implementation (lexing, parsing, evaluation) · graph algorithms · incremental computation · UI virtualization · performance budgets
