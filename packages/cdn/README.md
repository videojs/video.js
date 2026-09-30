# @videojs/cdn

Browser-ready Video.js bundles for script-tag and self-hosted installations. This package assembles the HTML player,
selected playback adapters, shared chunks, source maps, and standalone stylesheets in one build graph.

Replace `<version>` with the same exact package version in every CDN URL. A version range can resolve URLs to different
releases, whose entry files and shared chunks do not match.

Load a player and one media implementation:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@videojs/cdn@<version>/video.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@videojs/cdn@<version>/media/hlsjs-video.js"></script>
```

The browser-ready entry URLs are:

| Entry | URL |
| --- | --- |
| Media | `@videojs/cdn@<version>/media/<media-name>.js` |
| Extension | `@videojs/cdn@<version>/extensions/<extension-name>.js` |
| UI element | `@videojs/cdn@<version>/ui/<element-name>.js` |

Adapter and extension runtimes are already included in these bundles, so do not add the npm packages to a script-tag
installation.

## AI Quickstart

Using an AI coding agent? Install the [Video.js skill](https://github.com/videojs/skills) so it reads the docs that
match this package version before writing code. Then print a complete CDN installation. The command downloads only the
small `@videojs/cli` package, not this browser distribution:

```sh
npx @videojs/cli agents init --framework html --method cdn
```

## Build output

Run `pnpm build:cdn` from the workspace root. The task writes publishable files directly to `packages/cdn/`, which is
the npm package root; it does not use a separate `dist` directory. Player entries sit at the top level.
Locale, media, extension, and UI element entries sit under `locales`, `media`, `extensions`, and `ui`.

`pnpm --filter @videojs/cdn run build:archive` writes the self-hosting zip, tarball, and checksums to
`packages/cdn/archive/` after the CDN build completes.

## Self-hosting

Install the package when the browser-ready directory will be copied to your own origin:

```bash
pnpm add @videojs/cdn
```

Copy every file in the published package. Entry files import shared chunks by relative URL.

Application builds should install `@videojs/html` or `@videojs/react` instead. Neither package depends on
`@videojs/cdn`, so normal npm installs do not include these prebuilt bundles.

## License

[Apache-2.0](../../LICENSE)
