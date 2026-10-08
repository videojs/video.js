# @videojs/react

[![package-badge]][package]

`@videojs/react` is a comprehensive library for building media players in React applications. It
provides a complete set of components, hooks, and utilities for creating feature-rich, accessible
video and audio players with React.

Playback engines are optional adapter packages. Install the adapter that matches the component you import, for
example:

```bash
pnpm add @videojs/react @videojs/dash-video
```

```tsx
import { DashVideo } from '@videojs/react/media/dash-video';
```

## AI Quickstart

Using an AI coding agent? Install the [Video.js skill](https://github.com/videojs/skills) so it reads
the docs that match this package version before writing code.

Then print version-matched React installation instructions. This command returns instructions without modifying your
project; run it without flags to list every option:

```sh
npx @videojs/cli agents init --framework react
```

## Documentation

Read the docs at [videojs.org](https://videojs.org/docs/framework/react), or after installing,
browse the bundled markdown at `node_modules/@videojs/react/docs/` (start with `llms.txt` for the
structured index).

## Community

If you need help with anything related to Video.js 10, or if you'd like to casually chat with other
members:

- [Join Discord Server][discord]
- [See GitHub Discussions][gh-discussions]

## License

[Apache-2.0](../../LICENSE)

[package]: https://www.npmjs.com/package/@videojs/react
[package-badge]: https://img.shields.io/npm/v/@videojs/react?label=@videojs/react
[discord]: https://discord.gg/JBqHh485uF
[gh-discussions]: https://github.com/videojs/video.js/discussions
