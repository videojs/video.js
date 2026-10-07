# Contributor Guide

First off, thank you for taking the time to contribute to **Video.js 10** ❤️
Your input helps shape the next generation of open web media players.

Video.js is a free and open source library, and we appreciate any help you're willing to give - whether it's fixing bugs, improving documentation, or suggesting new features. Contributions and project decisions are overseen by the
[Video.js Technical Steering Committee (TSC)][vjs-gov].

[vjs-gov]: https://github.com/videojs/admin/blob/main/GOVERNANCE.md

## 🎒 Contributing code

Video.js 10 is set up a monorepo using [`pnpm` workspaces](https://pnpm.io/workspaces). As such, most scripts run will be done from the project/workspace root. Unless otherwise specified, assume commands and similar should be run from the root directory.

> [!TIP]
> This repo includes tooling for AI-assisted development. See [Using AI](#using-ai).

### Getting Your Machine Ready

You’ll need the following installed:

- [Node.js](https://nodejs.org/en/download) (≥ 22.19.0)
- [Git](https://git-scm.com/downloads)
- [PNPM](https://pnpm.io/installation) (≥ 12.3.4)
- [mise](https://mise.jdx.dev), or [NVM](https://github.com/nvm-sh/nvm)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (optional, for AI-assisted development)

> [!TIP]
> PNPM will automatically use the correct Node version when running scripts.
> If you prefer NVM: after installing it, simply run `nvm use` in the repo root.
> If you prefer mise: see [Using mise](#-using-mise-optional) — it manages pnpm for you too.

### ⬇️ Fork & Clone

1. [Fork on GitHub][vjs-gh].
2. Clone your fork locally and set up upstream tracking:

```sh
git clone https://github.com/{your-github-username}/video.js.git
cd video.js

git remote add upstream git@github.com:videojs/video.js.git
git fetch upstream
git branch --set-upstream-to=upstream/main main
```

To update your local main branch later:

```sh
git fetch upstream
git checkout main
git pull upstream main
```

### ⚙️ Setup

```sh
pnpm install
```

This also exposes the checked-in `.agents/skills/` catalog through generated `.claude/skills/` and `.opencode/skills/` directory aliases. `AGENTS.md` is the canonical project guide; Claude's `CLAUDE.md` imports it.

> [!NOTE]
> **Windows users:** Directory aliases use junctions and work without Developer Mode. If alias creation fails, `pnpm install` logs a warning and continues; the checked-in domain folders remain available.

Then build all workspace packages:

```sh
pnpm build:packages
```

> ℹ️ **VS Code Users:** the project may suggest extensions to enhance the developer
> experience.
> If imports like `react` are not resolving, set your TS version to the workspace one:
> `CMD/CTRL + Shift + P` → `TypeScript: Select TypeScript Version` → _Use Workspace Version_.

### 🧰 Using mise (optional)

[mise](https://mise.jdx.dev) is an alternative to Volta/NVM that manages **both** Node and pnpm from the checked-in [`mise.toml`](./mise.toml).

```sh
mise trust        # once per clone; mise only reads configs you've trusted
mise install      # provisions Node (from .nvmrc) and pnpm
mise run setup    # pnpm install + pnpm build:packages
```

`mise.toml` also puts the workspace's `node_modules/.bin` on `PATH`, so `biome`, `turbo`, and `tsgo` can be run directly rather than through `pnpm exec`.

Everything else stays as documented below: use the `pnpm` scripts, not mise tasks. Personal additions, such as extra tools, environment variables, belong in a gitignored `mise.local.toml` or `.env.local` and not in the shared config.

### 🏗 Building & Development

To run the workspace in development mode:

```sh
pnpm dev
```

This will run the entire workspace in developer mode, meaning all applications (examples and website) will also be started on their respective ports.

```sh
pnpm dev:site       # just the documentation site
pnpm dev:packages   # just the library packages (no apps)
pnpm dev:sandbox    # just the sandbox playground
```

See [Manual Testing with the Sandbox](#-manual-testing-with-the-sandbox) for how to use the sandbox to exercise player changes in the browser.

Sometimes you may want to do (non-dev) builds, say, to validate the full build process or evaluate production artifacts.

```sh
pnpm build:packages
```

To build the sandbox (and its package dependencies):

```sh
pnpm build:sandbox
```

To build all workspace packages and applications:

```sh
pnpm build
```

### 🧹 Style & Linting

We use [Vite+](https://viteplus.dev/) with Oxlint and Oxfmt for linting and formatting. Between IDE integration, pre-commit hooks, and manual CLI fixes, many issues should get caught automatically.

To ensure your code follows our lint rules with:

```sh
pnpm lint                    # check the whole workspace
pnpm lint:fix                # check and auto-fix the whole workspace
pnpm lint:fix:file <file>    # check and auto-fix a single file
```

Vite+ pre-commit hooks automatically check and fix staged files.

### 🔎 Typechecking

We use TypeScript project references for fast, incremental typechecking across the workspace:

```sh
pnpm typecheck
```

> [!TIP]
> Typecheck runs against built `.d.ts` files. If you add or change exported types in a package, run `pnpm -F <pkg> build` first so the new declarations are emitted before typechecking.

### 🧪 Testing

We use [Vitest](https://vitest.dev) for unit testing.

```sh
pnpm test                    # all workspace tests
pnpm -F core test            # just core package
pnpm -F core test:watch      # watch core package
```

#### E2E Tests

We use [Playwright](https://playwright.dev) for end-to-end testing. The E2E tests live in `apps/e2e/` and run against a Vite-based test app that hosts the player in multiple configurations (HTML, React, editable skin layouts, CDN bundles).

Playwright browsers and system dependencies are installed automatically during `pnpm install`. On Linux without sudo, browsers will install but system deps will be skipped with a note. If e2e tests fail due to missing system dependencies, install them manually:

```sh
sudo pnpm test:e2e:install
```

**Running tests:**

```sh
pnpm test:e2e                    # Chromium + WebKit (all engines)
pnpm test:e2e:vite               # Chromium only (fast feedback)
```

**Visual snapshot tests** verify that skin CSS and layout aren't broken. If a snapshot test fails, it means the rendered skin looks different from the baseline. This could mean:

1. **You intentionally changed the skin** — update the baselines:
   ```sh
   pnpm test:e2e:update
   ```
   Review the updated PNGs in `apps/e2e/tests/visual/` to confirm they look correct, then commit them.

2. **You didn't intend to change the skin** — the failure caught a real regression. Inspect the diff in the Playwright HTML report:
   ```sh
   pnpm --dir apps/e2e report
   ```
   The report shows expected vs. actual vs. diff images side-by-side.

> [!TIP]
> Snapshot baselines are checked into git. When you update them, review the PNG diffs in your PR to make sure the visual changes are intentional.

### 🏖 Manual Testing with the Sandbox

The sandbox (`apps/sandbox/`) is a Vite playground for manually exercising player changes in a browser. The root URL renders an interactive shell — a navbar with dropdowns for platform, preset, skin, styling, and source — that previews the selected combination in an iframe. One-off templates outside the main matrix are reachable by navigating directly to `/<template-name>/`. See `apps/sandbox/templates/` for the full list.

```sh
pnpm dev:sandbox                 # sandbox + workspace package watch
pnpm dev                         # also runs the docs site
```

Sandbox code lives in two parallel directories:

- **`apps/sandbox/templates/`** — source of truth, checked into git.
- **`apps/sandbox/src/`** — your scratch copy, fully gitignored.

On `pnpm dev:sandbox`, `setup.ts` copies any file from `templates/` that doesn't already exist in `src/`. Existing files in `src/` are never overwritten, so your local changes persist across restarts.

> [!IMPORTANT]
> Because `src/` is gitignored, edits you make there will not appear in `git status`. When you want to promote a sandbox change into the repo, run `pnpm -F @videojs/sandbox sync` — it shows a diff of every changed file and prompts before copying `src/` → `templates/`. To throw away local edits and restore from templates, run `pnpm -F @videojs/sandbox reset`.

See [`apps/sandbox/README.md`](./apps/sandbox/README.md) for the full model, including the `app/` shell, the `@app/*` alias for shared code, and how to add a new sandbox entry point.

### 🚚 Preview Releases

Pull requests and commits on `main` publish an installable preview of the public packages to [pkg.pr.new][pkg-pr-new] — nothing is published to npm. A bot comment on the PR lists the install commands, and the same URLs work by commit SHA:

```sh
pnpm add https://pkg.pr.new/@videojs/html@<pr-number-or-sha>
```

Use this to try a change in a real project before it is released. Previews are versioned `0.0.0-preview-<sha>` so they can never satisfy a semver range for a real release, and they ship without the bundled markdown docs that real releases include.

Because a preview is an installable artifact carrying the Video.js name, it is only published for code someone with repository access pushed or vouched for. Pull requests from a branch in this repo publish automatically; **pull requests from a fork publish only once a maintainer approves them**. The approval has to be written against the pull request's latest commit, so any new commit needs a fresh approval before it is published.

### ✅ Workspace Consistency

Before opening a PR, run the workspace consistency check to catch common mistakes (CI coverage, scope mismatches, broken define imports, etc.):

```sh
pnpm check:workspace
```

### 📦 Dependencies

To add a dependency to a specific package, you can use [`pnpm` filtering][pnpm-filtering] from the workspace root:

```sh
pnpm -F <scope> add <package>
# Example:
pnpm -F react add @floating-ui/react-dom
```

To upgrade a dependency across all packages:

```sh
pnpm up <package>@<version> -r
```

> [!CAUTION]
> We try to be very intentional with any dependencies we add to this project. This is true of both developer/tooling dependencies and especially package-level (source) dependencies. If you find yourself needing to add a dependency, we strongly encourage you to check in with the core maintainers before proceeding to avoid wasted time and effort for everyone involved (yourself included!).

[pnpm-filtering]: https://pnpm.io/filtering
[pkg-pr-new]: https://github.com/stackblitz-labs/pkg.pr.new

## Using AI

Video.js 10 includes portable tooling for AI-assisted development. Read [`AGENTS.md`](./AGENTS.md) for repo-wide conventions and source routing; Claude Code imports it through [`CLAUDE.md`](./CLAUDE.md).

### Slash Commands

| Command          | Purpose                                           |
| ---------------- | ------------------------------------------------- |
| `/commit-pr`     | Commit changes and create/update a PR             |
| `/review-branch` | Review changes in the current branch              |
| `/investigate-issue <n>` | Analyze an issue and generate a plan       |
| `/create-issue`  | Create a GitHub issue following repo conventions  |
| `/maintain-agent-docs` | Update agent guidance and skills             |
| `/create-skill`  | Scaffold a new skill                              |

### Skills

Focused workflows live as direct children of `.agents/skills/`; host-specific discovery paths are generated aliases. A few of the most-used skills:

| Skill                    | Use When                                                |
| ------------------------ | ------------------------------------------------------- |
| `design-api`             | Designing public APIs and TypeScript contracts          |
| `review-api`             | Auditing API and architecture changes                   |
| `create-html-component`  | Building custom-element UI components                   |
| `create-react-component` | Building React UI components                            |
| `implement-ui-transition`| Implementing UI transition and rendered-presence logic  |
| `review-html-component`  | Reviewing custom-element component architecture         |
| `review-react-component` | Reviewing React component architecture                  |
| `write-html-component-design`  | Writing custom-element component design records    |
| `write-react-component-design` | Writing React component design records             |
| `review-html-component-design` | Reviewing proposed custom-element designs           |
| `review-react-component-design`| Reviewing proposed React component designs           |
| `implement-accessible-ui`| Implementing accessible interaction                     |
| `review-accessibility`   | Auditing accessibility                                  |
| `write-docs`             | Writing guides, READMEs, and JSDoc                      |
| `review-docs`            | Reviewing documentation                                 |
| `write-api-reference`    | Building generated component or utility references      |
| `create-spf-behavior`    | Creating one SPF behavior                               |
| `change-spf-behavior`    | Updating, refactoring, splitting, or merging a behavior |
| `document-spf-feature`   | Maintaining an SPF feature registry entry               |
| `document-spf-use-case`  | Maintaining an SPF use-case composition                 |
| `implement-spf-feature`  | Implementing an SPF feature                             |
| `implement-spf-use-case` | Implementing an SPF use-case composition                |

### Maintaining AI Docs

When your changes introduce new patterns:

- **Repo-wide recurring facts** → Update the nearest `AGENTS.md`
- **Repeatable domain workflows** → Update the relevant skill under `.agents/skills/`
- **Mechanically enforceable rules** → Update code, tests, lint, hooks, or `check:workspace`

## Design Docs and RFCs

We use two types of design documents:

**Design Docs** (`internal/design/`) — Compact records of architecture or feature rationale that cannot be inferred from code and tests. Create one only when a maintainer explicitly requests it. See [`internal/design/README.md`](./internal/design/README.md).

**RFCs** (`rfc/`) — Proposals needing buy-in from others. Write one when the decision affects multiple areas, changes shared API surface, or is hard to reverse. See [`rfc/README.md`](./rfc/README.md).

**Rule of thumb:** If you need someone else's approval, explicitly request an RFC. If you intentionally want durable rationale for a decision you own, explicitly request a Design Doc or decision record.

**Skip both for:** Bug fixes, small contained features, implementation details.

## Creating a Pull Request

By submitting a pull request, you agree that your contribution is provided under the
[Apache 2.0 License](./LICENSE) and may be included in future releases. No contributor license agreement (CLA) has ever been required for contributions to Video.js. See the [Developer's Certificate of Origin 1.1](#developers-certificate-of-origin-11).

### Step 1: Verify

Whether you're adding something new, making something better, or fixing a bug, you'll first want to search the [GitHub issues](https://github.com/videojs/video.js/issues) to make sure you're aware of any previous discussion or work. If an unclaimed issue exists, claim it via a comment. If no issue exists for your change, [submit a new issue][vjs-issue-choose].

### Step 2: Update remote

Before starting work, you want to update your local repository to have all the latest changes from `upstream/main`.

```sh
git fetch upstream
git checkout main
git pull upstream main
```

> [!NOTE]
> If `git pull upstream main` fails, this means either you've committed changes to your local clone of `main` or there was a (rare) change in `upstream/main`'s commit history. In either case, if you simply want to base your local clone off of the latest in `upstream/main`, you can simply run: `git checkout -B main upstream/main` (assuming you've already `fetch`ed). For more on `git checkout -B`, check out the [git docs][git-docs].

[git-docs]: https://git-scm.com/docs/git-checkout#Documentation/git-checkout.txt-gitcheckout-b-Bnew-branchstart-point

### Step 3: Branch

You want to do your work in a separate branch. In general, you want to make sure the branch is based off of the latest in `upstream/main`.

```sh
git checkout -b my-branch
```

One helpful naming convention approximates [conventional commits][conventional-commit-style], e.g.:

- `fix/some-issue`
- `feat/my-media-store-feature`
- `docs/site-docs-for-x`
- `chore/repo-cleanup-task`

### Step 4: Commit

We follow **[conventional commits semantics][conventional-commit-style]** to enable automated releases.

Examples:

- `feat(core): add volume smoothing hook`
- `fix(react): correct prop mapping for picture-in-picture`
- `chore(root): update linting`

> [!TIP]
> Run `git log` (or `git log --oneline`) to check recent examples before committing.

### Step 5: Test

Any code change should come with corresponding test changes. Especially bug fixes.
Tests attached to bug fixes should fail before the change and succeed with it.

```sh
pnpm test
```

See [Testing](#-testing) for more information.

### Step 6: Review Documentation

If your changes introduced new patterns or conventions, check if documentation needs updates:

- **Site docs** — User-facing documentation in `site/`
- **AI docs** — See [Maintaining AI Docs](#maintaining-ai-docs)

### Step 7: Push

When ready, push your branch up to your fork (or upstream if you are a core contributor):

```sh
git push --set-upstream origin fix/my-issue
```

Then, open a PR via the green **“Compare & Pull Request”** button. In the description, make sure
you thoroughly describe your changes and [link related issues or discussions][link-pr-issue].

- Keep PRs focused and small when possible.
- Give reviewers time to provide feedback.
- Even if a PR isn’t merged, your work helps shape the direction of Video.js 10 ❤️

[link-pr-issue]: https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword

### Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

- (a) The contribution was created in whole or in part by me and I
  have the right to submit it under the open source license
  indicated in the file; or

- (b) The contribution is based upon previous work that, to the best
  of my knowledge, is covered under an appropriate open source
  license and I have the right under that license to submit that
  work with modifications, whether created in whole or in part
  by me, under the same open source license (unless I am
  permitted to submit under a different license), as indicated
  in the file; or

- (c) The contribution was provided directly to me by some other
  person who certified (a), (b) or (c) and I have not modified
  it.

- (d) I understand and agree that this project and the contribution
  are public and that a record of the contribution (including all
  personal information I submit with it, including my sign-off) is
  maintained indefinitely and may be redistributed consistent with
  this project or the open source license(s) involved.

## Community

To discuss larger ideas or prototypes, or to help out with ongoing discussions, open a thread in:

- [Discord][vjs-discord]
- [GitHub Discussions][vjs-gh-discussions]

[vjs-gh]: https://github.com/videojs/video.js
[vjs-issue-choose]: https://github.com/videojs/video.js/issues/new/choose
[vjs-gh-discussions]: https://github.com/videojs/video.js/discussions
[vjs-discord]: https://discord.gg/JBqHh485uF
[conventional-commit-style]: https://www.conventionalcommits.org/en/v1.0.0/#summary
