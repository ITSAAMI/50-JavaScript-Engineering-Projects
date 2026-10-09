# AI-Assisted Development

This repository is built with the help of AI tools. This document states plainly how, so that readers can judge the work accurately.

## Tools used

- **Claude Code** (Anthropic's Claude), used as a pair-programming agent in the developer's local environment.

## How AI is used

| Activity | AI's role | Repository owner's role |
| --- | --- | --- |
| Project selection and roadmap | Proposes the project list, specifications, and architecture | Sets goals and scope, and approves or changes the roadmap |
| Implementation | Writes code, tests, configuration, and documentation; runs builds and tests; debugs failures | Directs priorities, reviews changes, and decides what is merged |
| Verification | Runs the commands in each project's Definition of Done and reports actual results, including failures | Spot-checks results, runs projects locally, and accepts or rejects work |
| External accounts | None. AI never creates accounts or handles real credentials. | Owns all accounts, API keys, deployments, and publishing decisions |

## How it is disclosed in the history

- Commits produced with AI assistance carry a `Co-Authored-By: Claude …` trailer.
- The commit author is the repository owner, who is responsible for what is merged.
- **Commit dates are real.** History is never backdated, rewritten to look older, or padded with meaningless commits.

## Standards that apply regardless of who wrote the code

AI-written code is held to exactly the same [Definition of Done](ARCHITECTURE.md#16-definition-of-done-per-project) as hand-written code:

- A feature is documented as working only after it has been run and tested.
- Test doubles (for example, the scripted fake model used in AI projects, or Stripe test mode) are always labeled as such and never presented as the real integration.
- Each project README states which integrations were exercised live and which were tested only against fakes or test modes.
- Environment facts used in architecture decisions (tool versions, what runs on the development machine) are verified by running commands and recorded in [PROGRESS.md](PROGRESS.md#environment-verification-log).

## Limitations

AI tools can produce code that looks correct but is not. The safeguards are the test suites, code review, and the Definition of Done. Nothing in this repository should be assumed correct because it was generated quickly or reads confidently. If you find a defect, please open an issue.

## Why disclose this

The goal of this repository is to demonstrate engineering ability: choosing problems, designing architectures, verifying behavior, debugging, testing, and documenting. AI changes how quickly code is typed, not whether the engineering is sound. Being explicit about the tooling keeps the portfolio honest and lets the work be evaluated on what it actually does.
