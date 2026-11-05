# @videojs/spf

[![package-badge]][package]

## Overview

`@videojs/spf` is a lightweight, bundle-size-optimized streaming engine for Video.js 10. It provides
HLS playback with adaptive bitrate switching, WebVTT captions, and MSE support.

## Concepts

Read these in order:

1. [Why SPF?](./docs/why-spf.md)
2. [SPF architecture](./docs/architecture.md)
3. [Build an adapter](./docs/build-an-adapter.md)
4. [Compose an engine](./docs/compose-an-engine.md)
5. [Features depend on each other](./docs/feature-dependencies.md)
6. [State, context, and config](./docs/state-context-and-config.md)
7. [Write a behavior](./docs/write-a-behavior.md)
8. [Tasks and runners](./docs/tasks-and-runners.md)
9. [Actors](./docs/actors.md)
10. [Reactors](./docs/reactors.md)

[HLS engine composition](./docs/hls-engine.md) walks through the HLS engine SPF ships, stage by stage.

## Reference

- [API reference](./docs/reference/README.md): every engine, feature, and behavior, generated from the source JSDoc

## Community

If you need help with anything related to Video.js 10, or if you'd like to casually chat with other
members:

- [Join Discord Server][discord]
- [See GitHub Discussions][gh-discussions]

## License

[Apache-2.0](../../LICENSE)

[package]: https://www.npmjs.com/package/@videojs/spf
[package-badge]: https://img.shields.io/npm/v/@videojs/spf?label=@videojs/spf
[discord]: https://discord.gg/JBqHh485uF
[gh-discussions]: https://github.com/videojs/video.js/discussions
