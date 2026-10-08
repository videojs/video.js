# video.js

The `video.js` npm package for Video.js 10: the install every Video.js 8 snippet points at.

It is not published yet. The package is `private` until the v8 → v10 cutover.

## What's here

- **A working player from one import.** `import 'video.js'` registers `<video-player>`, `<video-skin>`, and the i18n elements — the same set the CDN `video.js` bundle registers — and re-exports `@videojs/html`'s root. Someone arriving from a v8 snippet keeps the import, removes the `videojs()` call, and writes the three tags. This is the batteries-included entry; anything granular (other presets, media components, individual UI elements, locales) lives in `@videojs/html`, which is what the docs use.
- **Coded stubs for the Video.js 8 module surface** on the same root entry (`src/videojs.ts`): the `videojs()` default export, `registerPlugin` / `getPlugin`, `registerComponent` / `getComponent`, `getPlayer`, and `options`. Each throws its `VJS8_LEGACY_*` code, so a v8 snippet fails with a searchable code instead of "undefined is not a function". Patterns only reachable through a v8 player instance are not stubbed; setup goes through `videojs()` and stops there.
- **`video.js/errors`** — the registry behind those codes (`src/errors/`): one entry per code with a one-sentence explanation, the v10 equivalent in HTML and React, the API reference URL, and the stay-on-v8 line. It is the single source for the thrown message and the reference page content. Dev builds throw the full explanation; production builds throw only the code and URL, and never import the registry text.
- **`video.js/dist/video-js.css`** — the Video.js 8 stylesheet path, resolving to an empty file so a stale import does not fail at module resolution before `videojs()` can.

Unlike `@videojs/html`, importing this package's root has side effects: it registers custom elements. That is deliberate — it is the point of the package — and it matches the CDN bundle of the same name.

Legacy detection lives only in this package. The `@videojs/*` packages never carry it, so they never pay for it in bundle size.

## License

[Apache-2.0](../../LICENSE)
