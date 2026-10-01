# @videojs/html

[![package-badge]][package]

`@videojs/html` is a comprehensive library for building media players with vanilla JavaScript and
Web Components. It provides a complete set of Custom Elements, state management, controllers,
and utilities for creating feature-rich, accessible video and audio players.

Playback engines are optional adapter packages. Install the adapter that matches the façade you import, for example:

```bash
pnpm add @videojs/html @videojs/hlsjs-video
```

```ts
import '@videojs/html/media/hlsjs-video';
```

## AI Quickstart

Using an AI coding agent? Install the [Video.js skill](https://github.com/videojs/skills) so it reads
the docs that match this package version before writing code.

Then print version-matched HTML installation instructions. This command returns instructions without modifying your
project; run it without flags to list every option:

```sh
npx @videojs/cli agents init --framework html
```

## Documentation

Read the docs at [videojs.org](https://videojs.org/docs/framework/html), or after installing,
browse the bundled markdown at `node_modules/@videojs/html/docs/` (start with `llms.txt` for the
structured index).

## Community

If you need help with anything related to Video.js 10, or if you'd like to casually chat with other
members:

- [Join Discord Server][discord]
- [See GitHub Discussions][gh-discussions]

## License

[Apache-2.0](./LICENSE)

[package]: https://www.npmjs.com/package/@videojs/html
[package-badge]: https://img.shields.io/npm/v/@videojs/html?label=@videojs/html
[discord]: https://discord.gg/JBqHh485uF
[gh-discussions]: https://github.com/videojs/v10/discussions
