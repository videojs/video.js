# @videojs/core

[![package-badge]][package]

`@videojs/core` holds the runtime-neutral player logic shared by the Video.js 10 framework packages: player features
and state, UI component behavior, and i18n. It renders nothing on its own, and you rarely need to install it directly.

## Getting started

To build a player, install the package for your framework. It depends on `@videojs/core` and brings the matching
version with it:

- [`@videojs/html`](https://www.npmjs.com/package/@videojs/html): custom elements for plain HTML and for Vue, Svelte,
  and other frameworks.
- [`@videojs/react`](https://www.npmjs.com/package/@videojs/react): React components and hooks.
- [`@videojs/cdn`](https://www.npmjs.com/package/@videojs/cdn): browser-ready bundles for script-tag installations.

Playback engines and embeds are optional adapter packages, such as `@videojs/hlsjs-video`, `@videojs/dash-video`, or
`@videojs/mux-video`. Extensions such as `@videojs/mux-data` and `@videojs/google-cast` add behavior to whichever media
the player is playing.

## AI Quickstart

Using an AI coding agent? Print the steps to install the [Video.js skill](https://github.com/videojs/skills), which
teaches your agent to read the docs that match your installed version before writing code:

```sh
npx @videojs/cli agents skills
```

Then print version-matched installation instructions for your framework. Run it without flags to list every option:

```sh
npx @videojs/cli agents init --framework html
npx @videojs/cli agents init --framework react
```

Neither command changes your project. The instructions install `@videojs/html` or `@videojs/react`, which already
depend on `@videojs/core`, so you do not need to add it yourself.

## Documentation

Read the docs for [HTML](https://videojs.org/docs/framework/html) or [React](https://videojs.org/docs/framework/react)
at videojs.org.

## Community

If you need help with anything related to Video.js 10, or if you'd like to casually chat with other
members:

- [Join Discord Server][discord]
- [See GitHub Discussions][gh-discussions]

## License

[Apache-2.0](../../LICENSE)

[package]: https://www.npmjs.com/package/@videojs/core
[package-badge]: https://img.shields.io/npm/v/@videojs/core?label=@videojs/core
[discord]: https://discord.gg/JBqHh485uF
[gh-discussions]: https://github.com/videojs/v10/discussions
