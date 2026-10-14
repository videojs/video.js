# @videojs/cli

[![package-badge]][package]

The Video.js 10 command line. `agents init` prints version-matched installation instructions for a coding agent or
for you to follow: the packages to install, the files to add, and the commands to run for your framework, installation
method, player, skin, and media source. `agents skills` prints how to install the
[Video.js skill](https://github.com/videojs/skills) in your coding agent. `skin create` sets up a local project for
building your own skin.

## Usage

Run it without installing anything:

```sh
npx @videojs/cli agents init
```

Without selection flags, the command lists every option, the valid combinations, and the order to decide them in. Add
flags to print one complete plan:

```sh
npx @videojs/cli agents init --framework react --media hls
npx @videojs/cli agents init --framework html --method shadcn --styling css
npx @videojs/cli agents init --framework html --method cdn --project existing --template none
```

Add `--json` for a structured document instead of Markdown, or `--version` to print the CLI version.

Each plan ends with a command that reproduces it with every choice spelled out. When you omit `--framework`, the command
reads the nearest `package.json`: React, Next.js, TanStack Start, and React Router projects get React instructions, Vue
and Nuxt projects get Vue, Svelte and SvelteKit projects get Svelte, and anything else gets plain HTML. React
instructions install `@videojs/react`; HTML, Vue, and Svelte instructions install `@videojs/html`.

A global install (`npm install --global @videojs/cli`) adds the same commands as `videojs agents init` and
`videojs agents skills`. The `docs` and `config` commands from earlier releases are deprecated: they print where to
find installation instructions and docs.

## Install the Video.js skill

```sh
npx @videojs/cli agents skills
```

Without flags, the command prints the install steps for Codex, Claude Code, VS Code, Cursor, and other coding agents
through the open [`skills`](https://www.npmjs.com/package/skills) installer. Each section ends with the follow-up that
loads the skill, such as starting a new session. Narrow or adjust the steps with:

- `--agent <ids>`: a comma-separated list of `codex`, `claude-code`, `vscode`, `cursor`, and `other`. Pass it once.
- `--scope <scope>`: `user`, `project`, or `local`. Adds `--scope` to the Claude Code marketplace and plugin
  commands; without it, Claude Code uses `user`.
- `--global`: adds `-g` to the `skills` installer command so the skill is available in every project.

```sh
npx @videojs/cli agents skills --agent claude-code --scope project
npx @videojs/cli agents skills --agent codex,cursor
npx @videojs/cli agents skills --agent other --global --json
```

`--json` and `--help` work the same way as they do for `agents init`.

## Create your own skin

```sh
npx @videojs/cli skin create
```

`pnpm dlx @videojs/cli skin create` and `bunx @videojs/cli skin create` work too. The command asks for:

- **Name**: required. The project goes in a folder named after it unless you choose another directory.
- **Framework**: React or HTML.
- **Styling**: Tailwind CSS or CSS. HTML skins use CSS.
- **Starting skin**: Scaffold (the default, every control wired up with minimal styling), Default, Neutral, or Compat.
- **Preset**: video, audio, live video, or live audio.

Pass flags to skip the questions, or `--yes` to take the defaults for anything you leave out. `--name` has no default.

```sh
npx @videojs/cli skin create --name Neon --framework html --base default --preset audio
npx @videojs/cli skin create ~/skins/neon --name Neon --yes
```

Every run ends with the command that creates the same skin without questions, pinned to the same CLI version and
package manager. Without a terminal to ask in, such as in
CI or from a coding agent, the command stops and lists the choices you left out instead of picking them for you. Run
`npx @videojs/cli skin create --help` for every option.

The project keeps the skin alone in `src/`, so it can move into an app as it is, and previews it in `apps/preview/`, a
slimmed-down version of the Video.js sandbox.

The skin's source comes from the latest
[Shadcn registry](https://videojs.org/docs/framework/react/guides/installation-shadcn) build, which isn't versioned
yet; when its Video.js version differs from the CLI's, the command warns you. The workbench templates ship with the CLI as
plain files, and the project's own dependencies install into the project. Behind a proxy, set `HTTPS_PROXY` and
`NODE_USE_ENV_PROXY=1` so Node's `fetch` uses it.

## What it does not do

The `agents` commands only print instructions. They never install packages or skills, run other CLIs, write files,
prompt, or save preferences. `skin create` is the one command that writes files: it creates a new project, refuses a
folder that isn't empty, and installs that project's dependencies unless you pass `--no-install`. The package is a
single bundled file with no dependencies, plus the skin templates beside it, so `npx` downloads it without the player
packages it describes.

## Versions

Package versions in the instructions match the CLI version. When the project already has a different `@videojs/react`
or `@videojs/html` version, the plan says so. For a release that includes `agents init`, it shows the pinned command for
that release, such as `npx @videojs/cli@10.0.0 agents init …`; for an older release it says to upgrade the project's
Video.js packages instead.

When you omit `--template`, the command also reads the app setup from the nearest `package.json` (Next.js, TanStack
Start, React Router, Astro, Nuxt, SvelteKit, Laravel, or Vite), or treats a directory with only an `index.html` as a
plain HTML page.

## Develop this package

To try `skin create` against this checkout instead of npm and the hosted registry, run from the repository
root:

```sh
pnpm build:packages
pnpm create:skin
pnpm create:skin ~/skins/neon --name Neon --framework html --base default
```

`create:skin` builds the CLI, packs the Video.js packages a skin needs into tarballs, builds the registry if it is
missing, and passes `--registry` and `--override` so the new project uses those local builds. It asks
where to put the project like the published command does, relative to the directory you ran it from.

## Community

If you need help with anything related to Video.js 10, or if you'd like to casually chat with other
members:

- [Join Discord Server][discord]
- [See GitHub Discussions][gh-discussions]

## License

[Apache-2.0](../../LICENSE)

[package]: https://www.npmjs.com/package/@videojs/cli
[package-badge]: https://img.shields.io/npm/v/@videojs/cli?label=@videojs/cli
[discord]: https://discord.gg/JBqHh485uF
[gh-discussions]: https://github.com/videojs/video.js/discussions
