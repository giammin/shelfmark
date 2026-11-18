# Agent Dev Team (shelfmark) - Working Document

> Reference document for the project. If it disagrees with a conversation, this document prevails.
> Last updated: 2026-10-21

---

## 1. Goal

Build a development team of AI agents that develops a simple application (a personal book catalog with physical locations), with human involvement limited to:

- writing requirements and specifications (supported by an architect agent);
- creating issues for bugs or changes of direction;
- final approval of pull requests (initially mandatory).

Constraints:

- experimental side project, no deadlines;
- low costs, without giving up functionality;
- agent configurations (prompts) must be part of the application repository.

---

## 2. Architecture

### 2.1 Roles

| Agent | Role | Mode | Trigger (CI phase) |
|---|---|---|---|
| agentA | Technical architect: turns the functional specifications into the technical design (modules, UI components, data model, contracts, implementation order) in `docs/design/`; answers technical clarification requests | Interactive, local (decisions reviewed by the human) | None initially; later, changes to `docs/specs/` |
| agentI | Issue planner: creates and updates issues from specifications and design (granularity, dependencies, order); answers functional clarification requests by citing the specifications | Headless | Push to `docs/specs/` or `docs/design/`; `needs-clarification` label |
| agentP | Developer: implements an issue, asks for clarification in comments, opens the PR | Headless | `ready` label; answer to a clarification request; `changes-requested` label |
| agentMR | Reviewer: checks the PR, interacts with agentP, approves when the PR is ready | Headless | PR opened or updated |
| Human | Functional specifications, review of agentA's design, corrective issues, decisions not covered by specifications and design, second approval | - | `needs-human` label |

### 2.2 Flow

1. The human writes the functional specifications in `docs/specs/`.
2. agentA, in an interactive session with the human, produces the technical design in `docs/design/` (architecture, modules, UI components, data model, decisions as ADRs).
3. agentI generates issues from specifications and design, each with links to the relevant sections, verifiable acceptance criteria and dependencies.
4. agentP picks up a `ready` issue and works on a dedicated branch.
5. If clarification is needed, agentP comments on the issue and sets `needs-clarification`.
   - Functional questions: agentI answers by citing the specifications.
   - Technical questions: agentA answers by citing the design.
   - If neither specifications nor design cover the case, `needs-human` is set. The human decision must then be recorded in the reference document.
6. agentP opens the PR.
7. agentMR reviews the PR based on the diff and on the CI build and test results, and iterates with agentP until approval or the iteration limit.
8. The human gives the second approval. Merging is allowed only with 2 approvals and green CI.

### 2.3 State machine (labels)

```
issue:  ready -> in-progress -> [needs-clarification | needs-human] -> in-review
                     |
                     +-> agent-failed (automatic retry, then needs-human)
PR:     in-review -> changes-requested -> in-review -> approved-by-agent -> merged
```

### 2.4 Repository structure

```
.github/
  workflows/
    ci.yml                # PRs and pushes to main: lint, build, test, rules tests (D29, D34)
    firebase-hosting-pull-request.yml  # PR -> Hosting preview channel (D35)
    firebase-hosting-merge.yml         # push to main -> live deploy (D35)
    agent-issues.yml      # push to docs/specs -> agentI
    agent-dev.yml         # ready label / comments -> agentP
    agent-review.yml      # PR opened / updated -> agentMR
    agent-retry.yml       # schedule: resume agent-failed issues
  CODEOWNERS              # .github/, agents/, AGENTS.md, CLAUDE.md -> mandatory human review (D6, D32)
agents/
  architect.md            # agentA (technical architect)
  issue-planner.md        # agentI
  developer.md            # agentP
  reviewer.md             # agentMR
scripts/
  get-agent-token.*       # GitHub App installation token generation
  run-agent.*             # local agent launcher (local phase)
docs/
  specs/                  # functional specifications (human)
  design/                 # technical design and ADRs (agentA, reviewed by the human)
src/                      # Angular application (workspace at the root, D26)
public/                   # static assets, PWA manifest, icons
test/rules/               # security rules tests (Emulator Suite, D34)
angular.json, package.json, tsconfig*.json, ngsw-config.json
firebase.json, .firebaserc, firestore.rules, firestore.indexes.json
AGENTS.md                 # conventions shared by all agents and pointer to docs/working-doc.md
CLAUDE.md                 # contains only the @AGENTS.md import
```

---

## 3. Decision Log

| # | Decision | Rationale | Rejected alternatives | Assumptions |
|---|---|---|---|---|
| D1 | Platform: GitHub | Official integration `anthropics/claude-code-action@v1`; mandatory approvals available | GitLab Free: excluded (Q1 closed) | - |
| D2 | Claude authentication: OAuth token of the Pro/Max subscription (`claude setup-token`) | Fixed cost | Pay-per-use API key (possible later with a spending limit) | Runs consume the 5-hour/weekly windows shared with personal use |
| D3 | One GitHub App per agent | The author of a PR cannot approve it; events generated with `GITHUB_TOKEN` do not trigger other workflows | Single identity; bot account | - |
| D4 | Separate agentA and agentI | agentA decides the structure (modules, components, contracts); agentI decides the units of work (issues, granularity, order) | Single agent | They share `AGENTS.md` |
| D5 | Clarifications answered only from specifications (functional, agentI) or design (technical, agentA), otherwise escalated to the human | Prevent agents from making design decisions | Free-form answers by agentI/agentA | - |
| D6 | Prompts and workflows protected by CODEOWNERS (`.github/`, `agents/`, `AGENTS.md`, `CLAUDE.md`); the Apps do not have the `workflows` permission | Prevent agents from modifying their own instructions | No protection | - |
| D7 | One issue at a time (global concurrency) | Avoid conflicts between PRs and usage spikes | Parallelism | To be reassessed after stabilization |
| D8 | Iteration limit for agentP <-> agentMR, then `needs-human` | Avoid non-converging loops | No limit | Initial value N to be defined (see Q8) |
| D9 | Local phase before Actions | More controlled testing | Start directly in CI | See section 4 |
| D10 | Locally, interaction still happens on GitHub (issues, PRs, labels via `gh`) | Migrating to Actions must change only the trigger | Simulation with local files | - |
| D11 | First agent migrated to CI: agentMR | Simple trigger, does not write code | agentP first | - |
| D12 | Public GitHub repository | Free Actions minutes on GitHub-hosted runners; rulesets and branch protection available on the Free plan | Private repository (limited minutes, protections to be verified) | Agents triggered only by users with write permission (section 5); no self-hosted runners |
| D13 | Stack: responsive PWA web app on Firebase, free Spark plan | Integrated services (Hosting, Auth, Firestore), zero cost at low traffic | Custom backend | Preference for solutions without Cloud Functions; moving to the Blaze plan is accepted if needed, with budget alerts (alerts do not cap spending); client-side ISBN lookup |
| D14 | Locations with an optional parent (lightweight hierarchy) | Organize by room without having to specify the whole hierarchy | Flat locations; mandatory fixed-level hierarchy | The number of locations per user is small (tens), so they can all be loaded client-side |
| D15 | Sharing per place: each place (e.g. home, seaside house) has members with a role (owner, write, read); locations and books belong to a place | The place is the permission boundary; locations stay lightweight | Sharing per location or per book; single-user app | Data model ready for sharing from the start, to avoid migrations |
| D16 | Each user gets a default place created at first sign-in; the owner invites via link (works for registered and unregistered users); at startup the app shows the accessible places | Simple flow, feasible without Cloud Functions | Email invitation (requires server-side email sending or a users collection with emails) | The user shares the link with their own means (e.g. Web Share API); the default place has a deterministic id to avoid duplicates |
| D17 | Release in three phases: (1) beta with books and locations in the default place only; (2) multiple places; (3) sharing with invitations and roles. Data model ready from the start | Reduces initial risk; each phase is an evolution test for the agents | Single release; two phases | - |
| D18 | Initial target platform: Android (Chrome) only | No iOS device available for testing | iOS support from the start | Scanning via the native `BarcodeDetector` API, behind an abstraction that allows adding an iOS fallback later |
| D19 | Authentication: Google Sign-In only; other providers later | Simple for Android users; user name available for the default place | Email/password from the start | Authentication code must not assume a single provider |
| D20 | Frontend: Angular + Angular Material, strict TypeScript | Enforced structure that limits drift between agent sessions; close to the C# model (DI, services, typing); the user's prior experience; official components and PWA support | React + Vite + MUI | Modern conventions set in `AGENTS.md` (standalone components, signals, new `@if`/`@for` control flow) and checked by agentMR and the linter |
| D21 | agentA is a technical architect, not a functional one: functional specifications belong to the human | Technical decisions are the user's area of expertise to verify; functional specifications express the user's intent | agentA supporting the writing of functional specifications | Initially interactive, with human review of decisions |
| D22 | Beta with minimal scope: sign-in, locations, single-book entry, book list; batch entry in the backlog | Start the agent system as early as possible; later features become a test of specification changes | Beta with batch entry | - |
| D23 | Repository and app name: `shelfmark` | Library term for the mark that identifies a book's shelf location; suitable for a public repository | bookwhere, scaffale, dovelho, libroteca | Firebase project created with id `shelfmark-bd1a8` (id `shelfmark` not available); default URL `shelfmark-bd1a8.web.app` |
| D24 | AGPL-3.0 license | Anyone publishing a modified version online must release its source | MIT, Apache-2.0, no license | The license also covers the prompts in `agents/` unless that folder gets a separate license |
| D25 | Agent-agnostic instructions in `AGENTS.md`; `CLAUDE.md` contains only the `@AGENTS.md` import; `agents/shared.md` merged into `AGENTS.md` | Tool independence; a single conventions file | `CLAUDE.md` only; symlink (requires permissions on Windows); relying on Claude Code reading `AGENTS.md` natively (depends on the version and on other `CLAUDE.md` files) | The CI action runs Claude Code and therefore reads `CLAUDE.md` |
| D26 | Angular 22 skeleton at the repository root: standalone, zoneless, strict TypeScript, SCSS, Vitest, no SSR; Angular Material (default azure/blue theme) and `@angular/pwa`; `--ai-config=none` | Single app: simpler CI and `firebase.json`; zoneless consistent with signals (D20); static PWA on Hosting | Workspace in a subfolder (`web/`); SSR; Karma | Requires Node >= 24.15 (Angular CLI 22 requirement); theme and fonts (currently from Google Fonts, not available offline) to be revisited in the design |
| D27 | LF line endings for all text files (`.gitattributes` with `eol=lf`, `.editorconfig`), CRLF only for `.cmd`/`.bat` | Agents run on Linux runners; the human works on Windows with several IDEs (Rider, WebStorm, VS Code, Visual Studio) | Per-machine `core.autocrlf` | - |
| D28 | ESLint: `angular-eslint` presets (ts, template, accessibility) with typed linting; additional rules `prefer-signals`, `prefer-output-emitter-ref`, `prefer-signal-model`, `no-uncalled-signals`, `no-implicit-take-until-destroyed`, `template/prefer-self-closing-tags`; `eslint-plugin-rxjs-x` (recommended) and `eslint-plugin-rxjs-angular-x` (`prefer-takeuntil` with alias `takeUntilDestroyed` on Component, Directive, Injectable) | Deterministic checks against obsolete patterns and subscription leaks ("correlated blind spots" risk) | Recommended preset only; `prefer-async-pipe` (too restrictive) | In Angular 22 OnPush is the default: `prefer-on-push-component-change-detection` reports only `ChangeDetectionStrategy.Eager`. Rules verified with a probe component |
| D29 | Minimal CI `ci.yml`: lint, build, test on PRs and pushes to `main`; Node 24, `permissions: contents: read`, `timeout-minutes: 15`, `concurrency` per ref | Basis for the "green CI" merge rule and for agentMR | - | Security rules tests added once Firebase is configured (done in D34) |
| D30 | Language: English for everything (code, comments, commits, branches, issues, PRs, reviews, specifications, design, prompts, this document) | Public repository; consistency between artifacts produced by the human and by agents | Italian for specifications and issues | Convention recorded in `AGENTS.md`; this document was translated from Italian on 2026-10-21 |
| D31 | Squash merge only (PR title and description as the commit message), merge commits and rebase disabled; automatic branch deletion after merge | Linear `main` history, one commit per PR; no leftover agent branches | Merge commit (used for PR #1) | - |
| D32 | Initial `main` ruleset: mandatory PR with 0 approvals, mandatory `build` check, force pushes and deletion blocked, no bypass. 2 approvals and CODEOWNERS review postponed until agentMR is operational | With a single human collaborator, the author cannot approve their own PR: 2 approvals or a CODEOWNERS review would block every merge | 2 approvals from the start; admin bypass | Until then, protection of prompts and workflows (D6) relies on CI alone; the `CODEOWNERS` file is already in place |
| D33 | PR titles in Conventional Commits format (types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`), starting with PR #2 | With squash (D31) the title becomes the commit on `main`: basis for an automatic changelog (Q19) | Free-form titles | Convention recorded in `AGENTS.md`; intermediate commits on branches remain free-form |
| D34 | Firebase setup: `firebase-tools` as a devDependency; Firestore `(default)` in `europe-west8` (standard edition), created with `firebase deploy --only firestore`; initial rules deny everything; rules tests with `@firebase/rules-unit-testing` and Vitest in the emulator with the `demo-shelfmark` project (no secrets in CI), run in the `build` job; web app registered (App ID `1:1015280431392:web:d86325b6cd0b021707a745`, config via `firebase apps:sdkconfig WEB <App ID>`); Hosting on `dist/shelfmark/browser` with SPA rewrite and `no-cache` for `index.html`, routes, service worker and manifest | Same CLI version locally and in CI; database closed until the design defines the rules; cache headers required for PWA updates | Global `firebase-tools`; `eur3`, `europe-west1` | AngularFire 20.1.1 supports only Angular 20: how the app integrates Firebase (plain `firebase` SDK or AngularFire) is a design decision for agentA; `firebase` is currently a devDependency used by the tests |
| D35 | Hosting preview channel for each PR (repository branches only, not forks) and automatic live deploy on every push to `main`; service account and `FIREBASE_SERVICE_ACCOUNT_SHELFMARK_BD1A8` secret created by `firebase init hosting:github`; generated workflows adapted: Node 24, `checkout@v7`, minimal permissions, `timeout-minutes`, `concurrency`, `action-hosting-deploy` pinned to a commit (v0.11.0); preview split into a `preview-build` job (no secrets) and a `preview-deploy` job (no PR code) | Visual check of the behavior for each PR ("correlated blind spots" risk); `main` always matches the site, since only code with green CI reaches it (D32) | Manual live deploy; action pinned to the moving `@v0` tag | Agent skills offered by the CLI not installed (to be evaluated separately) |

---

## 4. Local phase principles

- Each agent is defined by its prompt, inputs, tools/permissions and interaction via GitHub; locally, only who starts the run changes.
- Headless execution: `claude -p` with `--append-system-prompt`, `--allowedTools`, `--max-turns`. The same flags are passed to the action via `claude_args`. Verify the exact names with `claude --help`.
- Each agent uses its own token (`GH_TOKEN`) generated by its own GitHub App, never the personal token.
- Each run works in a `git worktree` or a clean clone, without reusing sessions or context, to simulate the ephemeral runner.
- Isolation: run in WSL or a devcontainer containing only the clone and the agent's token; no permission bypass.
- Orchestration initially manual (`run-agent` with agent and issue/PR number); automatic polling only if the local phase drags on.

---

## 5. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Subscription rate limit during a run: the headless run stops and does not wait for the reset | `if: failure()` step that sets `agent-failed` and comments; `schedule` resume workflow with a retry threshold, then `needs-human` |
| Work lost on an ephemeral runner | Intermediate commits and pushes on the working branch |
| Inconsistent resume after an interruption | Idempotent agentP prompt: if a branch or PR exists for the issue, it resumes instead of starting over |
| Pipeline minutes consumption | `timeout-minutes` on every job (GitHub default: 360 min); `--max-turns`; public repository for free minutes on GitHub-hosted runners |
| Self-hosted runner on a public repository (running code from forks) | Use it only on a private repository or block fork triggers |
| Agents modifying prompts or workflows | CODEOWNERS and reduced App permissions (D6) |
| Decisions invented by agents | D5 |
| Superficial review | agentMR based on CI build and test results; verifiable acceptance criteria in issues |
| Confusion between personal tools and protections: IDE checks are not visible to agents | Every binding check lives in the repository configuration and in CI; the IDE (Rider/WebStorm, VS Code, Visual Studio) is only the user's review tool and uses the same ESLint configuration |
| Correlated blind spots: agentP and agentMR based on the same model tend to accept the same mistakes | Deterministic checks in CI (strict TypeScript, linter with framework rules, tests); explicit review checklist in agentMR's prompt; a different model for review; human check of the behavior via preview channels |
| Concurrent consumption | Global `concurrency` on agents (D7) |
| Firebase service account secret exposed to the code of PRs from repository branches, including agents' PRs (`npm ci` and the build run PR code) | Preview workflow in two jobs: `preview-build` without secrets produces an artifact; `preview-deploy` receives the secret, uses `firebase.json` from the base branch (it can contain `predeploy` commands) and runs no PR code; deploy action pinned to a commit; agents cannot modify workflows (D6); service account roles to be verified (Q20). An intermediate `dev` branch does not mitigate this: `pull_request` triggers whatever the target branch |
| Agent code merged and deployed live automatically (D35) while the ruleset requires 0 approvals (D32) | Raise the ruleset to 2 approvals before giving the agents' GitHub Apps write permission |
| Public repository: anyone can open issues or comment, with possible prompt injection and quota consumption | Trigger agents only for users with write permission (verify `author_association` or the action's default behavior); never treat text from external users as instructions |

---

## 6. Operational plan

### Phase 0 - Preparation
- [x] Exclude GitLab Free (Q1).
- [ ] Resolve Q3-Q4.
- [x] Decide public or private repository (Q5): public.
- [x] Define the app idea: personal book catalog with physical locations.
- [x] Choose the stack (D13, D20).
- [ ] Write the beta functional specifications in `docs/specs/`.
- [ ] Produce the beta technical design with agentA in `docs/design/`.
- [x] Create the Firebase project `shelfmark` (id `shelfmark-bd1a8`).
- [ ] Evaluate a separate license (e.g. MIT or CC BY 4.0) for the `agents/` folder.
- [x] Create the public repository `shelfmark` (`git@github.com:giammin/shelfmark.git`, AGPL-3.0 license, no initial `.gitignore`).
- [ ] Add the structure of section 2.4 to the repository (this document is already in `docs/working-doc.md`).
- [x] Create `AGENTS.md` and `CLAUDE.md` with only the `@AGENTS.md` import.
- [x] Create the labels of section 2.3.
- [x] Translate this document into English (D30).
- [x] Configure the initial ruleset on `main`: mandatory PR, green CI, squash only (D31, D32).
- [x] Configure CODEOWNERS on `.github/`, `agents/`, `AGENTS.md`, `CLAUDE.md`.
- [x] Enable Hosting and Firestore on the Firebase project (Spark plan); register the web app; first deploy (D34).
- [x] Enable Auth with the Google provider (console only: Authentication -> Sign-in method -> Google).
- [ ] (Optional) Evaluate an additional Hosting site with a cleaner name or a custom domain.
- [x] Generate the Angular + Angular Material + PWA skeleton with strict TypeScript (D26).
- [x] Configure `angular-eslint` with rules against obsolete patterns and subscription leaks (D28).
- [x] Set up a minimal CI (build, lint, test) before agentP writes code (D29).
- [x] Add security rules tests with the Emulator Suite to CI (D34).
- [x] Configure Firebase Hosting preview channels for PRs and live deploy on merge (D35).
- [ ] Configure the IDEs (Rider/WebStorm, VS Code) to use the project's ESLint configuration.

### Phase 1 - Identities and local tools
- [ ] Create 3 GitHub Apps (agentI, agentP, agentMR) with minimal permissions; no `workflows` permission.
- [ ] Before installing the Apps: raise the `main` ruleset to 2 approvals (D32, live deploy risk).
- [ ] Install the Apps on the repository.
- [ ] Write `scripts/get-agent-token` (JWT signed with the private key, installation token valid for 1 hour).
- [ ] Prepare the isolated environment (WSL or devcontainer) with `claude` and `gh`.
- [ ] Write `scripts/run-agent` (parameters: agent, issue/PR number; clean worktree; agent token; headless flags).

### Phase 2 - Prompts
- [ ] `AGENTS.md`: pointer to the working document, conventions, git workflow, comment format, label usage; Angular conventions (standalone components, signals, `@if`/`@for`, no `NgModule`).
- [ ] `agents/issue-planner.md`: issue generation with links to the specifications and acceptance criteria; rule D5.
- [ ] `agents/developer.md`: picking up issues, clarifications, idempotency, intermediate commits, opening the PR.
- [ ] `agents/reviewer.md`: explicit review checklist (obsolete Angular patterns, unclosed subscriptions, use of signals/computed, security rules changes without tests), use of CI results, iteration limit, approval.
- [ ] Choose a different model for agentMR than for agentP.
- [ ] `agents/architect.md`: technical design from the specifications and answers to technical clarifications (D21).

### Phase 3 - Manual local cycle
- [ ] Run a full cycle on a small issue: agentI -> agentP -> agentMR -> human.
- [ ] Test a clarification answered from the specifications and one escalated to `needs-human`.
- [ ] Test an interruption mid-work (even simulated) and the resume.
- [ ] Iterate on the prompts until the cycle converges without human intervention.

### Phase 4 - Migration to Actions (one agent at a time)
- [ ] agentMR: `agent-review.yml`, with `timeout-minutes`, `concurrency`, `--max-turns`.
- [ ] Raise the `main` ruleset to 2 approvals with mandatory CODEOWNERS review (D32).
- [ ] agentP: `agent-dev.yml`, with `if: failure()` handling and the `agent-failed` label.
- [ ] agentI: `agent-issues.yml`.
- [ ] Automatic resume: `agent-retry.yml` (schedule, retry threshold).
- [ ] Verify in practice the action's behavior when the rate limit is reached (Q3).

### Phase 5 - Evolution
- [ ] Evaluate removing the mandatory human approval.
- [ ] Evaluate parallelism between issues.
- [ ] Evaluate moving to an API key with a spending limit.

---

## 7. Open Questions

| # | Question | Status |
|---|---|---|
| Q1 | GitLab Free as the platform | Closed: excluded, GitHub is used |
| Q2 | On GitHub Free, are rulesets/branch protection enforced on private repositories? | Closed: not relevant, public repository (D12) |
| Q3 | Exact behavior of `claude-code-action` when the usage limit is reached (expected: error and failed job; retries on short transient 429s) | To be verified by testing |
| Q4 | Exact names and semantics of Claude Code's headless flags in the version in use | To be verified (`claude --help`) |
| Q5 | Public or private repository | Closed: public (D12) |
| Q6 | App idea and stack | Closed: see D13 and section 10 |
| Q7 | Local isolation environment: WSL or devcontainer | Open |
| Q8 | Initial value of the agentP <-> agentMR iteration limit | Open |
| Q9 | Frontend framework | Closed: Angular + Angular Material (D20) |
| Q10 | ISBN metadata source (Google Books, Open Library, both) and coverage of Italian books | Open |
| Q11 | Are Cloud Functions available on the Spark plan? (assumption: no, Blaze is required) | To be verified |
| Q12 | Barcode scanning support on iOS | Postponed: iOS out of initial scope (D18) |
| Q13 | Flat or hierarchical locations | Closed: optional parent (D14) |
| Q14 | Single-user app or with sharing | Closed: sharing per place (D15) |
| Q15 | Invitation mechanism | Closed: invitation link (D16) |
| Q16 | Release sharing in a later phase | Closed: yes, three phases (D17) |
| Q17 | Authentication method | Closed: Google (D19) |
| Q18 | `npm audit`: high-severity vulnerability in `vite` 8.3.0-8.3.2 via `@angular/build` 22.2.x (dev server only); the proposed fix is a downgrade to 22.1.9 | Open: wait for an `@angular/build` patch or evaluate an `overrides` on `vite`. D34 adds transitive vulnerabilities from `firebase-tools` (tooling only) and from `@grpc/grpc-js` via `firebase` (gRPC server side, not used by the browser SDK); the fixes proposed by npm are major downgrades |
| Q19 | Automatic changelog from squash commits (PR titles); Conventional Commits in PR titles adopted (D33); the tool (e.g. release-please) and an optional PR title check in CI remain to be chosen | Open: to be discussed later |
| Q20 | Actual roles of the service account created by `firebase init hosting:github`; does Google sign-in work on preview channel domains, or must they be added to the Auth authorized domains? | To be verified (IAM console; first sign-in test on a preview) |
| Q21 | Language(s) of the app's user interface: the default place name is drafted in Italian ("La biblioteca di {NOME}"), while `index.html` declares `lang="en"` | Open: to be decided in the specifications |

---

## 8. Progress

| Date | Progress |
|---|---|
| 2026-10-21 | Goals, architecture, initial decisions and operational plan defined. No implementation started. |
| 2026-10-21 | GitLab Free excluded (Q1). App idea defined (Q6). Risk on triggers from external users added. |
| 2026-10-21 | Public GitHub repository chosen (D12); Q2 and Q5 closed. |
| 2026-10-21 | Firebase PWA stack chosen (D13); requirements draft in section 10. |
| 2026-10-21 | Locations with an optional parent (D14). |
| 2026-10-21 | Sharing per place with roles (D15). |
| 2026-10-21 | Default place, invitation via link and two-phase release defined (D16, D17). |
| 2026-10-21 | Three-phase release (D17), Android only (D18), Cloud Functions allowed if needed (D13). |
| 2026-10-21 | Google-only authentication (D19). |
| 2026-10-21 | Angular + Angular Material frontend (D20). Blocking decisions closed. |
| 2026-10-21 | Static protections, review checklist and the role of the IDE added to Phase 0 and Phase 2. |
| 2026-10-21 | Batch entry with a set destination added to the beta (section 10). |
| 2026-10-21 | Batch entry flow detailed (choice at start, confirm/automatic switch, duplicate warning). |
| 2026-10-21 | agentA redefined as a technical architect (D21); `docs/design/` added. |
| 2026-10-21 | Beta with minimal scope (D22); section 10 reorganized into beta, backlog, open cases and constraints. |
| 2026-10-21 | Name `shelfmark` chosen (D23). |
| 2026-10-21 | Firebase project `shelfmark-bd1a8` created. |
| 2026-10-21 | AGPL-3.0 license chosen (D24). |
| 2026-10-21 | Repository `giammin/shelfmark` created. |
| 2026-10-21 | Agent-agnostic instructions in `AGENTS.md` (D25). |
| 2026-10-21 | `CLAUDE.md` created with only the `@AGENTS.md` import (D25). |
| 2026-10-21 | Branch `chore/initial-setup`: Angular 22 + Material + PWA skeleton (D26), LF line endings (D27), extended `.gitignore` (secrets, Firebase, Visual Studio, local Claude Code settings). Build and tests green. |
| 2026-10-21 | ESLint with modern Angular and anti-leak rules (D28); minimal CI `ci.yml` (D29). Lint, build and tests green locally. |
| 2026-10-21 | `gh` installed and authenticated (personal account, for setup only). PR #1 opened; CI green on GitHub. |
| 2026-10-21 | English for all artifacts except this document (D30); convention added to `AGENTS.md`. |
| 2026-10-21 | PR #1 merged. Squash-only merges with automatic branch deletion (D31); state labels created; initial `main` ruleset (D32); `CODEOWNERS`. PR titles in Conventional Commits (D33). |
| 2026-10-21 | PR #2 merged. Firestore created in `europe-west8` with deny-all rules, web app registered, first deploy to `shelfmark-bd1a8.web.app` with verified cache headers, rules tests in CI (D34). |
| 2026-10-21 | PR #3 merged; Google provider enabled in Auth. Preview channels for PRs and live deploy on merge (D35). |
| 2026-10-21 | PR #4 merged; first live deploy from the workflow verified. This document translated into English (D30); Q21 added. |

---

## 9. Handoff

- Status: platform, stack and scope decisions closed; Phase 0 in progress. On `main`: `CLAUDE.md`, Angular skeleton, line endings, `.gitignore`, ESLint, CI with rules tests, Firebase configuration, Hosting preview and live deploy workflows. Configured on GitHub: squash-only merges, state labels, initial ruleset, `CODEOWNERS` (D31, D32). Firebase: Firestore, Hosting, web app and Google provider active (D34, D35).
- Next step: write the beta functional specifications from section 10.1 (deciding Q21), then the design with agentA.
- Environment requirements: Node >= 24.15 (Angular CLI 22); `gh` installed and authenticated with the personal account (agents will use their GitHub App tokens, section 4); Firebase CLI (`npx firebase`) authenticated with the user's private Google account: the machine's gcloud credentials belong to a different account and must not be used for this project.
- Notes for whoever resumes: read sections 3 and 4 before any activity; assumptions marked "To be verified" must not be taken for granted.

---

## 10. App requirements draft (to be moved to `docs/specs/`)

### 10.1 Beta (minimal scope, D22)

- Responsive web app, installable as a PWA, targeting Android (D18).
- Sign-in with Google (D19); at first sign-in the default place "{NAME}'s library" (Italian draft: "La biblioteca di {NOME}") is created automatically, not shown as a choice while it is the only place.
- Management of locations with an optional parent (D14): create, edit, delete.
- Entry of a single book by scanning its ISBN barcode, with automatic metadata lookup and manual entry as a fallback, assigning it to a location.
- Book list, opened directly at startup.

### 10.2 Backlog (to be introduced as specification changes)

- Batch entry:
  - when starting an entry, the user chooses between a single book and a batch, and for a batch sets the destination location;
  - during the batch, the app shows the destination location prominently and at all times;
  - a switch, which can be changed during the batch, determines whether each book requires confirmation or is saved automatically;
  - a book that is already present triggers a warning and requires confirmation, even in automatic mode;
  - (later) list of the books entered in the session, with the option to edit them.
- Phase 2 - Multiple places: several places per user (e.g. home, seaside house); editable place name; at startup the app shows the accessible places, or opens the book list directly if there is only one place.
- Phase 3 - Sharing: the owner generates a single-use invitation link, with a long expiry, for a place and a role (read or write); whoever opens it signs in or registers and becomes a member.

### 10.3 Open cases

Deliberately left open: they will surface from agentA's design or from agentP's clarification requests, and serve to test the clarification path.

Beta:
- multiple copies of the same book; book already present at entry;
- book without an ISBN or with an ISBN not found;
- book lent out or temporarily out of place;
- deleting a location that contains books or sub-locations;
- preventing cycles in the hierarchy;
- identical names under different parents: display with the full path;
- moving a location under another parent;
- searching books in a location: direct ones only or including descendants;
- default place name when the user's name is not available.

Batch entry:
- effect of confirming a book that is already present (new copy or moving the existing copy);
- ISBN not found in automatic mode;
- changing the destination without closing the batch.

Phases 2 and 3:
- inviting a person who is not yet registered (the link must survive the registration flow);
- expiry, single use and revocation of invitation links;
- who can manage members; revoking access and leaving a place;
- transferring ownership; deleting a place;
- moving a book between places (requires write access to both);
- aggregated view of the books of all accessible places.

### 10.4 Design constraints (from D15, D16)

- Data model ready for places and sharing from the beta: `places/{placeId}` with members and roles; locations and books as subcollections of the place.
- Default place with a deterministic id, to avoid duplicates at creation.
- Security rules tested with the Firebase Emulator Suite in CI.
- Firebase Hosting preview channel for each PR.
