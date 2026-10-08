# @videojs/sandbox

Vite-based playground for testing and developing Video.js 10 integrations. Each sandbox is a standalone entry point that demonstrates a different platform, media engine, or scenario.

## Getting started

```bash
# From the repo root
pnpm dev:sandbox             # sandbox + workspace package watch
pnpm dev                     # also runs the docs site
```

Open the printed URL. The root route renders an interactive shell — a navbar with dropdowns for platform (HTML, React, CDN), media (`video`, `hlsjs-video`, `audio`, etc.), and source, with the skin, its styling (CSS or Tailwind), where it comes from, and what to compare it against in the row above the preview — that previews the selected combination in an iframe. Every selection is in the URL, so a link reproduces a preview. Use the **Open** button to pop the preview out into its own tab.

`app/media.ts` describes each media once: its label, player, element, which sources the picker offers, and which controls apply. The shell derives its constraints from that table, and the CDN page picks its bundles by the same id. Older links that say `?preset=` still resolve; `preset` now means the player preset a skin is built for (`video`, `audio`, `live-video`, `live-audio`).

**Skins from** picks where a skin's code and styles come from: the framework packages (`@videojs/html`, `@videojs/react`; CSS only), the Shadcn registry installed into `app/_generated` by setup (CSS for both platforms, Tailwind for React), or the authored sources under `packages/skins/src`, compiled on request by the skins' Vite preset and offered only inside the workspace. `vite.workspace.config.ts` adds that preset for the `dev` and `build` tasks; `vite.config.ts` itself never imports the compiler, because Vite+ reads it to schedule tasks before anything is built. Authored skins pick up edits to `packages/skins/src` live, and they go through the built `vjsc` package, so rebuild it after a compiler change. Until you pick one, CSS comes from the packages and Tailwind from the registry, which is what the sandbox always did. The choice travels as `skins` in the URL.

**Compare** renders two previews that differ on one axis and share everything else: CSS against Tailwind, one skin source against the next that can load the styling, Default against Neutral, or HTML against React. Each panel is its own iframe, so two stylesheets never share a document, and its header names the value it takes. The panels sit side by side once the preview is wide enough and stack below that; the toggle above them forces either. **Mirror playback**, a switch beside the layout toggle, carries play, pause, seeks, volume, mute, playback rate, and caption selection from the panel you touch to the other one; it moves state through the media element rather than pointer positions, so it works across skins and platforms. The URL carries `compare`, `layout`, and `mirror`.

**Report** copies a markdown summary for a bug report and shows it in a dialog: the URL, the branch and commit the sandbox was served from, the selection in words, each panel's URL when comparing, browser, viewport, the detected preferences, and the last errors the preview frames relayed (uncaught errors, unhandled rejections, and `console.error`). The same preference badges sit at the bottom of the **Options** panel and follow DevTools' rendering emulation live.

**Width** sits at the top of the **Options** panel (the sliders icon in the navbar opens and closes it, and the choice is remembered), as a slider up to 1360px with a field for an exact value, and sizes the player through `--sandbox-player-width`; until it is touched, a preview opens at its skin's own width. **Color scheme** and **Direction** are in the same panel and pin the preview's `color-scheme` and `dir`, where the defaults follow the operating system and the locale. All three travel in the URL (`width`, `scheme`, `dir`), so a direct page honours them too.

**Captions**, under **Playback** in the **Options** panel, adds one or two subtitle tracks to a video so the captions menu has something to show; the tracks are the page's, so no template spells them out. The source picker also carries a **Missing file** entry that opens the player's error dialog without waiting on a network.

**Language** is in the **Options** panel for every media (HTML, React, and CDN). **CDN** registers copy through `@videojs/cdn/i18n` (the same registry as the CDN player bundle), not source `@videojs/html/i18n`. After pulling template changes, restart `pnpm dev:sandbox` so `scripts/setup.ts` refreshes `src/` from `templates/`.

The shell covers the main combinatorial matrix. One-off templates not in that matrix (e.g. `firefox-mse-repro`, `spf-segment-loading`, `hls-video-html`) are reachable by navigating directly to `/<template-name>/`. See `apps/sandbox/templates/` for the full list.

## How it works

Three directories participate:

- **`app/`** — The React-rendered shell served at `/`, plus shared helpers that sandboxes import via the `@app/*` alias. Checked into git.
- **`templates/`** — The source of truth for each sandbox. One subdirectory per entry point, each containing its own `index.html` and `main.ts` / `main.tsx`. Checked into git.
- **`src/`** — Your working copy where you freely edit, experiment, and break things. Fully gitignored (`src/*`).

On `pnpm dev:sandbox`, `scripts/setup.ts` mirrors new files from `templates/` into `src/` and overwrites `src/` files that differ from `templates/`. Edits made only in `src/` are replaced on the next dev start — use `sync` to copy them into `templates/` first.

Vite discovers sandbox entries by scanning `src/*` for subdirectories that contain an `index.html` — no manual registration is needed.

> [!NOTE]
> `src/index.html` is generated by the `serve-app-shell` Vite plugin on every dev/build — don't edit it by hand.

### Sharing code with `@app/*`

Templates can import shared helpers from the `app/` directory via the `@app` alias:

```ts
import '@app/styles.css';
import { SOURCES } from '@app/shared/sources';
```

See `templates/html-video/main.ts` for a minimal reference, or `templates/react-video/main.tsx` for a React one.

Each html template spells out its player the way a consumer would — the player element, the skin, and the media inside it. `createHtmlSandbox` only supplies what the shell varies: `skinTag`, the live `playerTag`, the source and poster URLs, and the attributes the Options panel controls. The markup inside `render` can be copied as is, with `${skinTag}` replaced by a skin's tag such as `video-skin`.

## Syncing changes back to templates

When you've made improvements in `src/` that should become the new baseline:

```bash
pnpm -F @videojs/sandbox sync
```

This shows a colored diff of every changed file, then prompts for confirmation before copying `src/` changes into `templates/`. Files that only exist in `templates/` are left untouched.

Sync when:

- You've fixed a bug or improved a sandbox and want to preserve it for others.
- You're preparing a commit — `templates/` is what gets checked in.

## Resetting your sandbox

To throw away your local `src/` edits and restore from `templates/`:

```bash
pnpm -F @videojs/sandbox reset
```

This previews every change first and prompts before doing anything. It overwrites modified files, deletes files that exist only in `src/`, and restores any missing template files. **Cannot be undone**, so commit or `sync` anything you want to keep first.

## Running outside the monorepo

Every pull request publishes this directory as a StackBlitz template through [pkg.pr.new](https://github.com/stackblitz-labs/pkg.pr.new), booting it against that commit's preview packages. That makes the sandbox the one app here that must also run as a standalone project, which constrains it in two ways:

- **Nothing may reference a path outside this directory.** `vite.config.ts` locates the prebuilt `@videojs/cdn` bundles through Node resolution rather than `../../packages/cdn`, carries its own copies of the task helpers from `build/task.ts`, and `tsconfig.json` is self-contained instead of extending `../../tsconfig.base.json` — Vite fails to start if a config import or that `extends` cannot be resolved. The one project file that does extend the base, `tsconfig.shared.json`, sits beside it under a name the transformer never looks up, so the shared sources still compile against `tsconfig.json`. The one exception is `vite.workspace.config.ts`, which imports the skins preset from `packages/skins`; the tasks only name it when that directory exists, so StackBlitz never loads it. Tasks that build sibling packages, such as `@videojs/cdn#build:cdn`, are likewise only declared when `pnpm-workspace.yaml` exists two directories up.
- **Only published packages may be dependencies.** Package skins come from `@videojs/html` and `@videojs/react`. Setup uses the stock Shadcn CLI to install the ignored registry skins, three catalogs of eight, from the local built registry in the monorepo or `https://shadcn.videojs.org/r` elsewhere. The one private dependency, `@videojs/icons`, exists so authored skins dedupe onto a single copy inside the workspace; `scripts/prepare-template.ts`, which CI runs right before the upload, drops private workspace dependencies and inlines the `catalog:` versions from `pnpm-workspace.yaml`, since a lone `package.json` can resolve neither. When the hosted registry cannot be reached, setup carries on without the registry skins and the shell offers the package skins only.
- **The package manager has to be declared here.** Only the repo root says pnpm, and the root is never uploaded, so StackBlitz would otherwise default to npm. The `stackblitz` field in `package.json` turns off its automatic install and boots with pnpm instead and runs the `dev` task through `vp run dev`; Vite+ owns the task names, so `package.json` declares no `dev` script. `--ignore-scripts` is there because pnpm refuses to silently skip dependency build scripts and fails the install if it has to; the sandbox needs none of them, esbuild's native binary included. `--config.blockExoticSubdeps=false` is there because the preview packages depend on each other through pkg.pr.new URLs, which pnpm 11 otherwise refuses to follow from inside a dependency. The task runs with `--config.verifyDepsBeforeRun=false` because pnpm would otherwise re-run the install with its default settings first, and that install fails on the very build scripts the first one skipped.
- **Every cross-origin subresource has to be CORS-enabled.** StackBlitz previews are cross-origin isolated (`Cross-Origin-Embedder-Policy: require-corp`), so a no-CORS load from `stream.mux.com` or `image.mux.com` is blocked outright — neither host sends `Cross-Origin-Resource-Policy`. That is why every media component here carries a bare `crossorigin` (the CORS-settings attribute treats it as `anonymous`), which also puts the storyboard `<track>` into CORS mode and, through it, the thumbnail sprites. The poster has to be the template's own image — an HTML skin renders one only where you slot it, and a React skin left to itself renders an `<img>` no prop can reach — so the HTML templates slot `<img slot="poster" crossorigin>` and the React templates hand one to `renderPoster`. Both still pass the URL through the player and let the poster fill in the `src`; an image carrying its own would opt out of the blur-up load state. React has no bare-attribute form, so its templates write `crossOrigin=""`. One thing stays broken in a preview and cannot be fixed from here: a CSS `url()` can never be CORS-enabled, so the `placeholdersrc` blur-up does not render.
- **Tailwind scans source installed into the app.** This exercises the supported registry workflow instead of package-internal utility classes or docs-only templates. `app/_generated/` is reproducible, gitignored, and covered by `app/styles.css`.

`src/` is gitignored and so never part of the upload. That is fine: the `dev` task runs `setup.ts` first, which recreates `src/` from `templates/` on boot.

## Adding a new sandbox

1. Create a directory in `templates/` (e.g. `templates/my-feature/`).
2. Add an `index.html` entry point and a `main.ts` or `main.tsx`. Import shared helpers from `@app/*` as needed.
3. Run `pnpm dev:sandbox` — `setup.ts` mirrors the new template into `src/`, and Vite picks it up automatically.
