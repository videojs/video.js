# @videojs/cli

[![package-badge]][package]

The Video.js 10 command line. `agents init` prints version-matched installation instructions for a coding agent or
for you to follow: the packages to install, the files to add, and the commands to run for your framework, installation
method, player, skin, and media source. `agents skills` prints how to install the
[Video.js skill](https://github.com/videojs/skills) in your coding agent.

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

## What it does not do

Both commands only print instructions. They never install packages or skills, run other CLIs, write files, prompt, or
save preferences. The package is a single bundled file with no dependencies, so `npx` downloads it without the player
packages it describes.

## Versions

Package versions in the instructions match the CLI version. When the project already has a different `@videojs/react`
or `@videojs/html` version, the plan says so. For a release that includes `agents init`, it shows the pinned command for
that release, such as `npx @videojs/cli@10.0.0 agents init …`; for an older release it says to upgrade the project's
Video.js packages instead.

When you omit `--template`, the command also reads the app setup from the nearest `package.json` (Next.js, TanStack
Start, React Router, Astro, Nuxt, SvelteKit, Laravel, or Vite), or treats a directory with only an `index.html` as a
plain HTML page.

## Community

If you need help with anything related to Video.js 10, or if you'd like to casually chat with other
members:

- [Join Discord Server][discord]
- [See GitHub Discussions][gh-discussions]

## License

[Apache-2.0](./LICENSE)

[package]: https://www.npmjs.com/package/@videojs/cli
[package-badge]: https://img.shields.io/npm/v/@videojs/cli?label=@videojs/cli
[discord]: https://discord.gg/JBqHh485uF
[gh-discussions]: https://github.com/videojs/v10/discussions
