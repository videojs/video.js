# Agent evals

Measure how well coding agents install Video.js, release over release. Each trial gives a real agent CLI (Claude Code or Codex) a realistic request, such as "add a video player to this Next.js app", in a fresh container. Then it builds the result, serves it, and checks in a real browser that a Video.js 10 player renders and plays.

You choose which Video.js build the agents get: any published release (npm is served as it looked at that release), the current one, or an unreleased build of a branch. One run can test several builds side by side and compare them, with or without the [videojs skill](https://github.com/videojs/skills).

## What a trial checks

| Outcome | Checks |
| --- | --- |
| **Works** | `@videojs/*` 10 or the Video.js CDN is used, nothing from Video.js 8, every `@videojs` package and pinned CDN URL is the build under test, dependencies install, the project builds and serves, the player box has a real size, Video.js 10 elements render, and pressing play advances playback (autoplay for background video). Generic tasks accept any player here. |
| **On spec** | Works with Video.js 10, and does what the prompt asked: the install method, preset, skin, and media, the media URL the prompt gave, the player's place on the page, and the task's own checks, such as captions that load or a skip button that seeks. |

Checks judge the result, not the tool that made it: editable skin source counts as the shadcn method whether the shadcn CLI copied it or the agent did, and an agent that pins another release, as stale search results suggest, fails the version check even if that release plays. The grader then reruns the page with the build under test forced in, and records whether it would have worked. Each failing trial gets a label in words, such as "Video.js 8", "zero-height player", or "wrong media source", which the report groups by.

Each trial also records how the agent worked: whether it ran `agents init`, read the docs bundled in `node_modules`, fetched videojs.org or the legacy docs (legacy.videojs.org and videojs.com), searched the web, used the legacy `docs` or `config` commands of `@videojs/cli`, installed the `video.js` package, loaded the skill, or needed a follow-up, and where its information came from: the site routes, every server-side search with the URLs it returned, and the versions it wrote into CDN URLs. Tokens, cost (Claude Code only), turns, time, and lines changed come from the transcript and the diff. Axe results for the player, and for the whole page, hydration errors, and uncaught page errors are recorded too, but do not affect either outcome.

A trial that fails for reasons outside the agent, such as a rate limit, a login failure, or a grader crash, is an infrastructure error. It is excluded from the rates, and the runner retries it once.

## Tasks

Seven core tasks run by default: React (Next.js, Vite) and HTML (static, Vite), with packaged skins, skin source through shadcn, and the CDN, covering the audio and background presets and the neutral skin. 10.0.0-rc.5 renamed the minimal skin to neutral; the tasks and results keep the old name, so runs from before and after the rename compare, and the grader accepts either. Five more suites are opt-in, and `--suite full` runs all of them.

| Suite | Asks for |
| --- | --- |
| `core` | A Video.js player, by install method, preset, and skin. |
| `extended` | The same on other frameworks, and in a new app. |
| `generic` | A video or audio player without naming a library. Any player that plays works; only Video.js 10 is on spec, and the report counts which player each agent chose. |
| `customize` | A change to a working Video.js 10 player, which the task's setup installs from the build under test before the agent starts, or an upgrade from Video.js 8. |
| `realworld` | Work inside an app: data-driven routes, several players, a player library to replace, a live stream, a shared UI package. |
| `onboarding` | A request that leaves a decision to the user, such as which of two apps gets the player. The `interactive` arm lets agents ask; the others show what they do when they cannot. |

Every task has a tier. `smoke` tasks sit at the ceiling for the agents that matter, so one trial per release is enough to catch breakage; `main` tasks still separate a good release from a bad one, so they get the trials. `--tier` selects either. Tiers are revisited after each release's run.

Every task has three wordings, `PROMPT.md`, `PROMPT.2.md`, and `PROMPT.3.md`: neutral, short and casual, and detailed. Trial `n` sends wording `n`, so three trials measure how robust a result is to phrasing rather than repeating one prompt. Wordings describe the outcome, such as "clean, understated controls" or "the controls' code in our repo", instead of the option names that would give the answer away.

| Task | Suite | Fixture | Method | Preset and skin |
| --- | --- | --- | --- | --- |
| `react-next-packaged` | core | Next.js, pnpm | packaged | video |
| `react-next-shadcn` | core | Next.js, pnpm | shadcn | video |
| `react-next-background` | core | Next.js, pnpm | packaged | background video |
| `react-vite-audio-minimal` | core | React and Vite, npm | packaged | audio, neutral |
| `html-static-cdn-hls` | core | static HTML, no package manager | CDN | video, HLS |
| `html-vite-packaged-minimal` | core | Vite, npm | packaged | video, neutral |
| `html-vite-shadcn` | core | Vite, npm | shadcn | video |
| `react-new-app` | extended | empty directory | packaged | video |
| `vue-vite-packaged` | extended | Vue and Vite, pnpm | packaged | video |
| `vue-nuxt-hls` | extended | Nuxt, npm | packaged | video, HLS |
| `sveltekit-packaged` | extended | SvelteKit, pnpm | packaged | video |
| `astro-packaged` | extended | Astro, pnpm | packaged | video |
| `generic-video-next` | generic | Next.js, pnpm | any | video |
| `generic-accessible-hls` | generic | Vite, npm | any | video, HLS |
| `generic-podcast` | generic | React and Vite, npm | any | audio |
| `rw-course-next` | realworld | Next.js course site with lesson data and dynamic routes | — | video, one player per lesson with its thumbnail |
| `rw-replace-player` | realworld | React and Vite gallery on react-player | — | six players, one playing at a time |
| `rw-live-hls` | realworld | Vue and Vite, with a live stream served in the container | packaged | live video, HLS |
| `rw-monorepo-ui` | realworld | pnpm workspace: Next.js app and a shared UI package | — | a reusable player in the shared package |

| Task | Suite | Starts from | Asks for |
| --- | --- | --- | --- |
| `customize-brand-color` | customize | Next.js player | the brand color on the progress bar and accents |
| `customize-captions` | customize | Next.js player and a VTT file | English captions |
| `customize-poster` | customize | HTML player | a poster image that hides on play |
| `customize-remove-controls` | customize | Next.js player | no fullscreen or picture-in-picture button, other controls kept |
| `customize-skip-forward` | customize | HTML player | a button that skips forward 30 seconds |
| `customize-time-left` | customize | Next.js player | the current time left of the play button |
| `migrate-v8` | customize | HTML page with Video.js 8 | an upgrade to Video.js 10 |
| `customize-analytics` | customize | Next.js player and an analytics stub | play, pause, and end events sent with the current time |
| `customize-spanish` | customize | Next.js player on a Spanish site | controls in Spanish |
| `customize-source-skin-mobile` | customize | Next.js player with the skin source and captions | captions after volume, both below the timeline on phones, keyboard kept |
| `migrate-v8-real` | customize | Next.js app with a Video.js 8 React wrapper | an upgrade keeping poster, rates, captions, a Download button, and an "Up next" overlay |

The customization tasks above `migrate-v8` are in the smoke tier; every agent passes them. The four after it are the main tier.

| Task | Suite | Starts from | Leaves the user to decide |
| --- | --- | --- | --- |
| `ask-which-app` | onboarding | pnpm workspace with a marketing site and a dashboard | which app gets the player |
| `ask-v8-elsewhere` | onboarding | Vite site with Video.js 8 on its About page | Video.js 8 or 10, and whether to touch the About page |
| `ask-editable-vs-upgrades` | onboarding | Next.js | editable controls against automatic upgrades |
| `init-empty-video-site` | onboarding | empty directory | the framework and the video |

Only the `interactive` arm can learn the answer an onboarding task hinges on. In the other arms, on spec means the agent's own default happened to match this user, so read those arms for the outcome and for disclosure (did the final message say what the agent decided), and the interactive arm for asking. `init-empty-video-site` fails the source check by design when the agent cannot ask; judge those trials on whether the site works and whether the agent said where to put the video.

Prompts read like a developer's request and say "Video.js", not "Video.js 10", so installing Video.js 8 stays a possible mistake: agents often choose the `video.js` npm package, which is Video.js 8 for every release before Video.js 10 publishes under that name. From then on, `video.js` installs a package that has no player and points to `@videojs/html`, `@videojs/react`, and the CDN, so the same prompts measure whether agents follow it. Media URLs use a Mux asset other than the demo `agents init` falls back to, so pasting the docs' example fails the source check.

### Arms

Each arm words the same task differently, or changes what the agent has, holding everything else constant.

| Arm | The agent gets |
| --- | --- |
| `baseline` | The prompt as written. For a plain "Video.js" request, a working Video.js 10 player measures adoption: the request can fairly mean Video.js 8. |
| `v10` | The prompt with every unversioned "Video.js" saying "Video.js 10", to measure the install without the guess between versions. |
| `skill` | The prompt as written, with the videojs skill installed (`--skill-ref` picks the commit). |
| `builder` | The `v10` prompt plus what a quickstart prompt builder would hand over: "Use Video.js 10" and a pinned `npx @videojs/cli@<version> agents init` command with every choice filled in from the task. A task can hand it deliberately wrong flags (`builder` in task.json) to test whether agents notice. |
| `cli` | The prompt plus a pointer to `npx @videojs/cli agents init`, without flags. |
| `interactive` | The prompt as written, with a simulated user who answers the agent's questions. |

Outside the interactive arm, a trial where the agent makes no changes gets one follow-up turn: "Yes, go ahead with what you recommend."

In the interactive arm, the simulated user answers only what the agent asks, from the task's answer card (`user.json`), which a person wrote: each topic the user knows is marked `necessary` (the right outcome depends on it and the project cannot tell), `derivable` (the prompt or the project already says), or `indifferent`. A pinned small model, Claude Haiku 4.5, only sorts each question into the card's topics; the answer is the card's text, so the model never writes requirements or sees the grader. Questions the card does not cover get fixed replies ("use what you recommend", or "which decision do you need me to make?" for vague ones). After two answered rounds, the user asks the agent to decide. The report then shows how many necessary questions agents asked, how many unneeded ones, and whether the final message told the user what the agent decided on its own. Tasks without a card answer every question with "use what you recommend", so they measure over-asking. The simulated user needs Claude credentials even for Codex trials; the container keeps them out of Codex's shell.

## Run evals

You need Docker and Node 22.18 or later. Run everything from the repository root. The runner uses only Node built-ins and rebuilds the eval image (agent CLIs, pnpm, Playwright, installed fixtures) before each run, which takes seconds once its layers are cached.

If Claude Code and Codex are logged in on this machine, there is nothing to set up: the runner reuses those logins, and containers only get a current access token, never the refresh token, so a trial cannot sign your CLI out. Point it at non-default config directories in `apps/agent-evals/.env`, which git and the image build ignore:

```sh
CLAUDE_CONFIG_DIR=~/.claude-work   # which Claude Code login to use (read from the Keychain on macOS)
CODEX_HOME=~/.codex-work           # which Codex login to use
```

API keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) take precedence when set, and CI uses them. Subscription logins count against your plan's usage limits; a trial that hits a limit is retried once as an infrastructure error.

```sh
pnpm evals --dry                   # print the plan
pnpm evals --agents oracle         # check fixtures and graders with reference solutions; no tokens
pnpm evals --agents noop,mutant --suite full   # check that untouched projects and near misses fail
pnpm evals                         # Opus 5.5 and GPT-6 Sol, core tasks, no skill, one trial, latest release
pnpm evals --help                  # every option
```

Defaults keep a run small: 2 agents × 7 tasks × 1 arm × 1 trial is 14 trials. Everything else is opt-in.

### Choose the Video.js build

`--videojs` takes a comma-separated list. Each build gets its own label and summary, the builds' trials run interleaved so they share conditions, and each later build is compared with the first.

| Value | Agents get |
| --- | --- |
| `latest` | The current release. npm stays pinned to it for the whole run, even if a release lands midway. |
| `10.0.0-rc.2` | That release, as npm looked then: later versions are hidden and it is `latest`, for `video.js` too, which stays on Video.js 8 for releases before it published Video.js 10. It is marked as published days ago, so pnpm's one-day minimumReleaseAge does not hold it back. |
| `workspace` | This checkout, built and packed the way the release job does. |
| `<dir>` | Packed `.tgz` files, for example from `pnpm evals:pack --root ../other-checkout --name my-branch --preview 3001`. |

```sh
pnpm evals --videojs 10.0.0-rc.2,10.0.0-rc.3   # release before against release now
pnpm evals --videojs latest,workspace --preview 3001   # the current release against this branch and its previews
```

A small registry inside each container does this: it rewrites the `@videojs/*` and `video.js` package documents and passes every other request through to npm, so `npm install`, `pnpm add`, and `npx @videojs/cli agents init` all get the build under test, and the CLI's version-matched instructions point at it. The grader's browser keeps CDN URLs on the build too: packed files for unreleased builds, and the pinned release for URLs without an exact version.

### Match the docs site and registry to the build

Production videojs.org and shadcn.videojs.org deploy with every merge to main, so they drift from any release, and run ahead of npm once the next release pull request merges: its version bump reaches the registry before the packages publish. Each release therefore gets the deploy previews of the pull request that released it, which hold the docs site and registry as they were at that release: `10.0.0-rc.2` reads them from release pull request #2670. `--live-docs` serves production instead. To serve other deploys, route them:

| Option | Serves |
| --- | --- |
| `--preview <pr>` | The pull request's deploy previews, for packed builds only. Packs made with `pnpm evals:pack --preview <pr>` route themselves. A preview Netlify skipped (the registry, when a pull request leaves the skins alone) stays on production. |
| `--site <origin>` | videojs.org from any origin, for every build, such as a deploy permalink from the release you pinned. |
| `--registry <origin>` | shadcn.videojs.org from any origin, for every build. |

Inside the container those hostnames resolve to a local forwarder that answers HTTPS with a certificate only the eval image trusts, and fetches each request from the chosen origin, Markdown negotiation included. curl, npm, the shadcn CLI, and Claude Code's WebFetch all reach it. Each trial records the routes and how many requests each routed host served.

Claude's WebSearch and Codex's built-in web search run on the providers' servers, so they never pass through the forwarder: they read production and search indexes, which can recommend another release's version. In rc.3's first run, Codex wrote rc.2 versions in 7 of 36 attempts that way. So `--mode` picks between two runs:

| Mode | Docs and search | Use it for |
| --- | --- | --- |
| `attribution` (default) | videojs.org and shadcn.videojs.org pinned to each build, and the agents' own web search off (`--disallowedTools=WebSearch`, `web_search="disabled"`); agents still fetch pages from inside the container | Comparing builds, since everything the agent reads comes from the build under test |
| `ecosystem` | Production docs, web search on | Measuring what agents do in the wild today, once per release; never for crediting a change |

The report warns when trials under one label read docs from different sources, and notes a run with web search on.

Packing builds the packages, the CDN bundles, and the site, whose Markdown ships inside `@videojs/html` and `@videojs/react` as bundled docs. It packs every public package and the private workspace packages they depend on, such as `video.js` while `@videojs/core` depends on it before it publishes. pkg.pr.new previews leave those docs out and rename every version, which also breaks the pinned versions `agents init` prints, so they cannot stand in for a release.

### Choose what runs

| Option | Default | Controls |
| --- | --- | --- |
| `--agents` | `claude-opus-5.5,codex-gpt-6-sol` | Agents. Add `:effort` (`claude-opus-5.5:high`), or name any model with `claude-code/<model>` or `codex/<model>`. `codex-gpt-5.6-sol` is also configured, and `claude-sonnet-5` and `claude-haiku-4.5` as canaries: smaller models reason around fewer gaps in the docs, so a regression shows in them first. |
| `--arms` | `baseline` | Comma-separated arms (see [Arms](#arms)). An arm that has nothing to change on a task skips it, such as `v10` on a prompt that names no library. |
| `--mode` | `attribution` | Pinned docs and no provider web search, or `ecosystem` for both live (see above). |
| `--suite` | `core` | Comma-separated suites, such as `core,generic`, or `full` for every task. |
| `--tier` | both | `smoke` or `main`. |
| `--tasks`, `--framework`, `--method`, `--preset` | — | Pick tasks by id (wildcards allowed) or narrow them by what they expect, such as `--method shadcn`. |
| `--tasks-dir` | — | Colon-separated directories of held-out tasks kept outside this repository, so the people who write the docs and the skill never see them. They use the fixtures here and mount where only the harness can read them. |
| `--trials` | `1` | Trials per task, agent, arm, and build; trial `n` sends wording `n`. Use three or more for comparisons you act on. |

### Control spending

| Option | Effect |
| --- | --- |
| `--effort` | Reasoning effort for every agent without its own. Lower effort spends fewer tokens. |
| `--timeout` | Minutes per trial, 30 by default. The only cap Codex has. |
| `--budget`, `--max-turns` | Claude Code's own spending and turn caps. |
| `--no-follow-up` | Skip the second turn for an agent that stops to ask a question. That trial then counts as a failure. |
| `--resume` | Continue an interrupted single-build run without repeating finished trials. |

The cheapest useful comparison records a full baseline once and then runs only what changed. Later runs compare against the tasks they share with it:

```sh
pnpm evals --videojs 10.0.0-rc.2 --suite full --arms baseline,skill --trials 3 --save   # once
pnpm evals --videojs 10.0.0-rc.3 --compare 10.0.0-rc.2                                   # each release
```

Agents run as their own account in the container, which cannot read the tasks, solutions, answer cards, or grader; the harness hands the workspace to that account for the agent's turn and takes it back for grading. Both share one pnpm store, so projects install cleanly for either.

Each container gets 2 CPUs and 6 GB (`--cpus`, `--memory`), and `--concurrency` sets how many run at once. Give Docker enough disk for the image (about 4 GB) plus a few GB per concurrent trial, or pass `--work-tmpfs 4g` to keep workspaces in memory.

### Summarize and compare

```sh
pnpm evals:report 10.0.0-rc.3 --compare 10.0.0-rc.2   # labels under results/, or run directories
pnpm evals:report 10.0.0-rc.3 --compare latest        # the newest other summary in history/
```

`--save` on either command records summaries in `history/`.

Trials of one task tend to pass or fail together, so the report resamples tasks, not trials: every rate's 95% interval, and each change between builds, is computed over tasks paired across the two runs. The comparison table prints the smallest change that many tasks can tell from noise; with 12 tasks that is about 20 points, so a smaller change is "within noise" however the rates moved. The report declares one primary metric, on spec in the `v10` arm on main-tier tasks per agent, and lists the tasks that changed between builds. Run the builds you compare side by side (`--videojs a,b`) rather than against a saved summary, so the agents' models and the environment are the same for both.

After changing how checks score, `pnpm evals:rescore <label or run dir>` applies the change to finished runs from what each trial recorded, keeping each changed original as `result.original.json`; summarize again afterwards. Each trial keeps the expectations it recorded, which match the prompt it was sent. `--static` also reruns detection on the finished project, rebuilt from `workspace.tgz` or from the fixture and `diff.patch`. Browser checks need the page itself, so rerun those trials.

## Automation

The [Agent Evals workflow](../../.github/workflows/agent-evals.yml) runs on GitHub Actions, one job per agent and arm, with `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` from the `agent-evals` environment.

| Trigger | What runs |
| --- | --- |
| Every six hours | Once the latest release is `AGENT_EVALS_DELAY_HOURS` old (24 by default) and not yet recorded, that release with npm pinned to it, compared with the newest record and pushed to the `agent-evals/history` branch. |
| `test:agent-evals` label on a pull request | The pull request, packed and served to the agents with videojs.org and shadcn.videojs.org routed to its deploy previews, compared with the newest record and posted as a comment. The pack job waits for the previews to finish deploying. |
| Pull request changing this app or the workflow | The oracle on every task with a reference solution, the noop agent on every task, and every mutant. It needs no keys, and fails when a solution stops passing, an untouched project passes, or the grader passes a deliberate mistake. |
| Manual dispatch | Every option above as an input. `videojs` takes releases and at most one git ref, such as `10.0.1,refs/pull/9258/head`, and compares them in order; a `refs/pull/<n>/head` ref also gets that pull request's deploy previews. Set `record` to push the summaries to the history branch. |

Repository variables set the scheduled and label runs without editing the workflow: `AGENT_EVALS_AGENTS`, `AGENT_EVALS_ARMS`, `AGENT_EVALS_SUITE`, `AGENT_EVALS_TIER`, `AGENT_EVALS_MODE` (`attribution` by default), `AGENT_EVALS_TRIALS` (3 by default), `AGENT_EVALS_PR_TRIALS` (1 by default), and `AGENT_EVALS_DELAY_HOURS`. A release is worth two tiers of runs: every release, the main tier in the `v10` and `skill` arms with 3 trials plus the smoke tier with 1; monthly or before a product decision, the `baseline`, `interactive`, `builder`, and `cli` arms, the canary models, and an `ecosystem` run. Pinning makes the delay optional: the scheduled run no longer depends on pnpm's release age, so an hour is enough for videojs.org and the CDN to catch up.

When you bump an agent CLI, a model, or a fixture, dispatch a run of the current release too, so the next comparison changes one thing at a time.

To compare locally against recorded summaries, check the history branch out where `report` looks for it:

```sh
git fetch origin agent-evals/history
git worktree add apps/agent-evals/history origin/agent-evals/history
pnpm evals:report 10.0.0-rc.3 --compare latest
```

## Read the results

`results/<label>/<timestamp>/` holds `run.json` (build, versions, image, skill commit, spending caps), `summary.md`, and one directory per trial:

| File | Contents |
| --- | --- |
| `result.json` | Every check, the failure label, the detected install method and versions, activity signals, provenance (site routes, web searches, CDN versions), the simulated user's side (`interaction`), usage, and environment. |
| `transcript.jsonl` | The agent's raw event stream. |
| `diff.patch` | What the agent changed, without lockfiles. |
| `screenshot.png` | The page as the grader saw it. `screenshot.forced.png` shows the rerun with the build under test forced in, when the agent pinned another release. |
| `simulator.log` | The simulated user's classification calls, for interactive trials and tasks with an answer card. |
| `workspace.tgz` | The finished project without dependencies or build output, for regrading after a grader fix. |
| `grade.log` | Install, build, and server output. |

Raw results stay out of git. The workflow keeps a summary of each release on the `agent-evals/history` branch.

## Add a task

1. Add or reuse a fixture under `fixtures/`: a scaffolded app with its lockfile and a `fixture.json` naming its framework, package manager, and build and serve commands. Give pnpm fixtures their own `pnpm-workspace.yaml` so pnpm never resolves this repository's workspace, and pin dependencies older than a day so frozen installs pass pnpm's release-age check.
2. Add `tasks/<id>/PROMPT.md`, `PROMPT.2.md`, and `PROMPT.3.md`: the same request, worded neutrally, briefly, and in detail, each saying "Video.js" without a version where the request names the library. Add `task.json` with its suite, tier, and what to expect: framework and playback, plus any of method, preset, skin, media, `source` (the media URL the prompt gives), and `after` (text the player must sit below) to grade. `"library": "any"` accepts any player, and `"v8": "elsewhere"` lets Video.js 8 stay on pages the task leaves alone. `"setup"` names a script, relative to the task, that prepares the project before the agent starts; shared setups live in `tasks/_setup/`. `"services": ["live-hls"]` serves a live stream at `http://media.acme.test/live/master.m3u8`. `"arms"` limits the arms a task runs in, and `"builder"` overrides the flags the builder arm hands the agent.
3. For behavior the standard checks miss, add `tasks/<id>/check.ts`. It exports `beforeLoad`, `afterLoad` (to reach the page the player is on, such as a film's watch page), `beforePlayback`, or `afterPlayback` hooks for the browser, a `project` hook for the files (a dependency that must be gone, a page that must stay untouched), and `path` for a page other than the home page (see `TaskCheck` in `src/grade/browser.ts`); the assertions they return decide the `task` check. Helpers are in `src/grade/task-checks.ts`. Test what a user would see or do, not how the agent did it.
4. For a task that leaves the user a decision, add `user.json`, the simulated user's answer card: topics with `id`, `about`, `kind`, and an `answer` in the user's words, and `disclose`, the topics the agent should report deciding on its own. Answers never use option names such as shadcn or preset; a test enforces it.
5. Add a `solution.sh`, and `mutants/<name>.sh` for plausible near misses, each starting with a `# expect: <check>` line naming the check that has to catch it. Run the oracle, noop, and mutant agents on the task (`pnpm evals --agents oracle,noop,mutant --tasks <id>`) before running agents on it.
