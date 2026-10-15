# video.js agent guide

`video.js@10` contains no player. It points the `video.js` name at the Video.js 10 packages and makes Video.js 8 code fail with `VJS8_LEGACY_*` codes. Never import it to build a player, and never write `videojs()` calls for Video.js 10.

## Choose the package

- **Video.js 8 project** (`videojs()` calls, `class="video-js"` markup, or `data-setup`): unless the user asks to migrate, keep it on v8 by pinning `video.js@8`. Brightcove maintains v8 with security fixes until October 1, 2028; see https://github.com/videojs/videojs-v8 and https://legacy.videojs.org.
- **HTML, Web Components, Vue, Svelte, or another framework**: install `@videojs/html`.
- **React**: install `@videojs/react`.
- **Script tag without a bundler**: load `<script type="module" src="https://cdn.jsdelivr.net/npm/@videojs/cdn@<version>/video.js"></script>` with the same exact version in every CDN URL. Don't install an npm package.

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
