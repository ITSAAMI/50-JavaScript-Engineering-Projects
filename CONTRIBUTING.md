# Contributing

Thanks for your interest in improving this repository. Bug reports, fixes, test improvements, and documentation corrections are all welcome.

## Prerequisites

- **Node.js 24 LTS or newer** (see [.nvmrc](.nvmrc)) and npm
- **Docker** (optional): needed only for `compose.yaml` stacks and for the few test suites that require services with no embeddable equivalent (see [ARCHITECTURE.md §6](ARCHITECTURE.md#6-local-infrastructure-strategy))

## Working on a project

Each project under `projects/` is self-contained:

```bash
cd projects/NN-project-name
npm ci
npm run lint && npm run typecheck && npm test && npm run build
```

Projects never import code from each other. If two projects need the same helper, each keeps its own copy, so either can be lifted out on its own.

## Branches

| Branch | Use |
| --- | --- |
| `main` | Always passing. Completed projects are merged here. |
| `project/NN-slug` | Implementation of one project |
| `fix/NN-short-description` | A fix inside one project |
| `foundation/*`, `docs/*`, `ci/*` | Repository-wide work |

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). The scope is the project slug **without its number**, or `repo` / `roadmap` / `ci` for repository-wide changes.

```
<type>(<scope>): <imperative summary, lowercase, no period>

<optional body: what changed and why>
```

| Type | Use for |
| --- | --- |
| `feat` | A new capability |
| `fix` | A bug fix |
| `refactor` | A restructuring with no behavior change |
| `perf` | A performance improvement (include before/after numbers in the body) |
| `test` | Adding or improving tests only |
| `docs` | Documentation only |
| `build` | Dependencies and build tooling |
| `ci` | CI configuration |
| `chore` | Maintenance that fits nowhere else |

Examples:

```
feat(auth-service): add TOTP enrollment and verification
fix(booking): reject slots that cross a DST boundary
test(feature-flags): cover percentage rollout distribution
docs(roadmap): clarify webhook retry schedule
```

### Commit granularity

- **One commit, one coherent step.** The project builds and its existing tests pass at every commit.
- Commit when a meaningful unit of work is done (a feature, a fix, a layer of tests), not on a timer and not to inflate counts.
- Never rewrite published history, backdate commits, or change authorship.

## Pull requests

Before opening a pull request, check that:

- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass for every project you touched
- [ ] New behavior has tests, including failure paths (validation, authorization, not-found, conflicts)
- [ ] Security implications were considered (see [ARCHITECTURE.md §9](ARCHITECTURE.md#9-security-baseline))
- [ ] The project README matches the code (features, environment variables, API, commands)
- [ ] `.env.example` is updated if configuration changed, and no secrets are committed
- [ ] [PROGRESS.md](PROGRESS.md) and [PROJECTS.md](PROJECTS.md) are updated if a project's status changed
- [ ] `node scripts/check-md-links.mjs` passes if you edited documentation

Describe **what** changed, **why**, and **how it was verified** (the commands you ran and their results).

## Code style

- [EditorConfig](.editorconfig), ESLint, and Prettier settings are authoritative. Run the project's `lint` script before committing.
- TypeScript in `strict` mode. Avoid `any`; prefer `unknown` plus validation at boundaries.
- Validate external input with schemas (Zod or JSON Schema), never by hand-rolled checks scattered through the code.
- Keep business logic out of route handlers and UI components (see the archetypes in [ARCHITECTURE.md §4](ARCHITECTURE.md#4-project-archetypes)).
- Name things for what they do. Comments explain **why**, not what.

## Proposing a new project

Open an issue containing all 14 specification fields used in [docs/roadmap/](docs/roadmap/): name, description, real-world use case, stack, main features, advanced features, database, API, authentication, security, testing, deployment, folder structure, and learning objectives. Explain which concept it covers that the existing 56 projects do not.

## Reporting security issues

Please **do not** open a public issue for a vulnerability. Use GitHub's private vulnerability reporting ("Report a vulnerability" under the repository's **Security** tab) instead.

## AI-assisted contributions

AI-assisted contributions are welcome, provided they are disclosed (for example, with a `Co-Authored-By` trailer) and meet the same standards as any other change. See [AI_ASSISTANCE.md](AI_ASSISTANCE.md).
