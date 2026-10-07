# video.js

[![package-badge]][package]

Video.js 10 players don't live in this package. Install the package for your framework:

| Building with | Install | Docs |
| --- | --- | --- |
| HTML, Web Components, or another framework | `npm install @videojs/html` | [HTML installation][html-install] |
| Vue or Nuxt | `npm install @videojs/html` | [Vue installation][vue-install] |
| Svelte or SvelteKit | `npm install @videojs/html` | [Svelte installation][svelte-install] |
| React | `npm install @videojs/react` | [React installation][react-install] |
| A `<script>` tag, without a bundler | Nothing; load `@videojs/cdn` | [CDN installation][cdn-install] |

Playback engines such as HLS and DASH are separate adapter packages. The installation guides list them.

Without a bundler, load the player from jsDelivr and write the player markup:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@videojs/cdn@<version>/video.js"></script>

<video-player>
  <video-skin style="aspect-ratio: 16 / 9">
    <video src="https://example.com/video.mp4" playsinline></video>
  </video-skin>
</video-player>
```

Replace `<version>` with an exact `@videojs/cdn` version in every CDN URL. A range can resolve each file to a different
release, and their shared chunks don't match.

## AI Quickstart

Using an AI coding agent? Print the steps to install the [Video.js skill](https://github.com/videojs/skills), which
teaches your agent to read the docs that match your Video.js version before writing code:

```sh
npx @videojs/cli agents skills
```

Then print version-matched installation instructions for your framework:

```sh
npx @videojs/cli agents init --framework html
npx @videojs/cli agents init --framework react
```

Run `agents init` without flags to list every option, such as the CDN method, skins, and media sources. Neither command
changes your project. `npx` downloads only the small `@videojs/cli` package, not a player.

## Video.js 8

Video.js 8 is alive and well. Brightcove maintains it as the legacy release line, with security fixes until October 1,
2028. Pin the major version to install it:

```sh
npm install video.js@8
```

For v8 setup, releases, and issues, see the [Video.js 8 repository][v8-repo] and the [v8 docs][v8-docs].

Ready to move a v8 player to Video.js 10? Follow the migration guide for [HTML][html-migrate] or [React][react-migrate].

## What this package contains

This package has no player and no dependencies. `@videojs/core` depends on it, so it appears in every `@videojs/html`
and `@videojs/react` install, but nothing imports it, so it adds nothing to your bundle.

Importing it registers no elements and doesn't scan the page, so v8 markup such as
`<video class="video-js" data-setup="{}">` does nothing. It contains only shims, so v8 code that runs against Video.js 10
fails with a searchable code instead of "undefined is not a function":

- **The v8 module surface.** The `videojs()` default export, `registerPlugin`, `getPlugin`, `registerComponent`,
  `getComponent`, `getPlayer`, and `options` each throw a `VJS8_LEGACY_*` code that links to its error page. Development
  builds add the explanation and the HTML and React equivalents; production builds throw only the code and link.
- **`video.js/errors`.** The registry behind those codes: one entry per code with an explanation, the HTML and React
  equivalents, and the stay-on-v8 line.
- **`video.js/dist/video-js.css`.** The v8 stylesheet path, resolving to an empty file so a leftover import doesn't fail
  the build.

## Community

If you need help with anything related to Video.js 10, or if you'd like to casually chat with other members:

- [Join Discord Server][discord]
- [See GitHub Discussions][gh-discussions]

## License

[Apache-2.0](../../LICENSE)

[package]: https://www.npmjs.com/package/video.js
[package-badge]: https://img.shields.io/npm/v/video.js?label=video.js
[html-install]: https://videojs.org/docs/guides/installation/html
[vue-install]: https://videojs.org/docs/guides/installation/vue
[svelte-install]: https://videojs.org/docs/guides/installation/svelte
[react-install]: https://videojs.org/docs/guides/installation/react
[cdn-install]: https://videojs.org/docs/guides/installation/cdn
[html-migrate]: https://videojs.org/docs/framework/html/guides/migrate-from-video-js-8
[react-migrate]: https://videojs.org/docs/framework/react/guides/migrate-from-video-js-8
[v8-repo]: https://github.com/videojs/videojs-v8
[v8-docs]: https://legacy.videojs.org
[discord]: https://discord.gg/JBqHh485uF
[gh-discussions]: https://github.com/videojs/video.js/discussions
