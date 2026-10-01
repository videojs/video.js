# video.js agent guide

`video.js@10` contains no player. It points the `video.js` name at the Video.js 10 packages and makes Video.js 8 code fail with `VJS8_LEGACY_*` codes. Never import it to build a player, and never write `videojs()` calls for Video.js 10.

## Choose the package

- **Video.js 8 project** (`videojs()` calls, `class="video-js"` markup, or `data-setup`): unless the user asks to migrate, keep it on v8 by pinning `video.js@8`. Brightcove maintains v8 with security and bug fixes; see https://github.com/videojs/video.js and https://legacy.videojs.org.
- **HTML, Web Components, Vue, Svelte, or another framework**: install `@videojs/html`.
- **React**: install `@videojs/react`.
- **Script tag without a bundler**: load `@videojs/cdn`.

`@videojs/html` and `@videojs/react` already install `video.js` through `@videojs/core`. Don't add it to `package.json` yourself; it adds no player features.

## Get installation instructions

Print version-matched steps instead of writing them from memory:

```sh
npx @videojs/cli agents init --framework html
npx @videojs/cli agents init --framework react
```

Run `agents init` without flags to list every option and the order to decide them in. `npx @videojs/cli agents skills` prints how to install the Video.js skill. Both commands only print; they never change the project.

## Fix a `VJS8_LEGACY_*` error

The code means v8 code ran against `video.js@10`. Either pin `video.js@8`, or migrate the call site. Development builds print the HTML and React replacements, and every code links to its page at `https://videojs.org/docs/reference/api/<code-slug>`. The full migration guide is at https://videojs.org/docs/framework/html/guides/migrate-from-video-js-8 (swap `html` for `react`).

`video.js/dist/video-js.css` is an empty file. Remove its import when migrating.

## Change this package (videojs/v10 repository)

- Keep it free of dependencies and side effects: no player, no element registration, and no re-exports from `@videojs/*`. `@videojs/core` depends on this package, so any dependency here lands in every Video.js 10 install, and an `@videojs/*` dependency would form a cycle.
- Never import `video.js` from `@videojs/*`. The `@videojs/core` dependency exists only to install it, and must add nothing to bundles.
- Legacy detection lives only here. Never add v8 compatibility, `VJS8_LEGACY_*` codes, or registry text to `@videojs/*` packages.
- Stub only setup-time v8 entry points. Anything reached through a v8 player instance is unreachable once `videojs()` throws.
- Production builds must not ship registry text. Never import `./errors/registry` from `src/videojs.ts` or `src/index.ts`; only `__DEV__` branches in `./errors/legacy-error` read it.
- A new code needs its entry in `LEGACY_ERROR_CODES`, its registry entry, a stub exported from `src/index.ts` and attached to the default export, a case in `src/tests/videojs.test.ts`, and a `site/src/content/docs/reference/api/<slug>.mdx` page with its sidebar entry in `site/src/docs.config.ts`.
- Verify with `pnpm -F video.js test` and `pnpm -F site test legacy-error`.
