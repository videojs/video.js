# Changelog

## [10.0.0-rc.5](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-rc.4...@videojs/html@10.0.0-rc.5) (2026-10-01)


### ⚠ BREAKING CHANGES

* **packages:** rename the minimal skin to neutral ([#3092](https://github.com/videojs/v10/issues/3092))
* **packages:** attach extensions at the player ([#2880](https://github.com/videojs/v10/issues/2880))
* **media:** tidy text track state ([#3057](https://github.com/videojs/v10/issues/3057))
* **core:** align player store API ([#3012](https://github.com/videojs/v10/issues/3012))

### Features

* **core:** add deriveCustomStatus to display custom actions ([#3064](https://github.com/videojs/v10/issues/3064)) ([5b4ed5e](https://github.com/videojs/v10/commit/5b4ed5e323f48b0f674f0c5640ee41c527f10f81))
* **media:** add resolveAdapterType and resolveMimeType ([#3024](https://github.com/videojs/v10/issues/3024)) ([a77010c](https://github.com/videojs/v10/commit/a77010c77ff4971a9f7f1c43d5c24c20ee67d505))
* **packages:** export a per-package VERSION from core, html, and react ([#3078](https://github.com/videojs/v10/issues/3078)) ([bd8f072](https://github.com/videojs/v10/commit/bd8f072a6591079b64baf20b18af52a415195b97))
* **packages:** support chrome 111, firefox 121, and safari 16.4 ([#2951](https://github.com/videojs/v10/issues/2951)) ([710df96](https://github.com/videojs/v10/commit/710df96fc1bb5aceca96fa831082d61fd83af3c3))
* **skin:** add compat skin ([#3026](https://github.com/videojs/v10/issues/3026)) ([5d419de](https://github.com/videojs/v10/commit/5d419de6980310364c36ffe6bc131573ac8b785d))


### Bug Fixes

* **core:** preserve submenu exit transitions ([#3025](https://github.com/videojs/v10/issues/3025)) ([89c1c58](https://github.com/videojs/v10/commit/89c1c5803d152025e88f34e0d1782bbd52632d67))
* **packages:** name Video.js 10 in npm descriptions and keywords ([#2995](https://github.com/videojs/v10/issues/2995)) ([8fda9a3](https://github.com/videojs/v10/commit/8fda9a36bede5cf92d446e25e56a96625cd60bc9))


### Code Refactoring

* **core:** align player store API ([#3012](https://github.com/videojs/v10/issues/3012)) ([d1f57f8](https://github.com/videojs/v10/commit/d1f57f8ea733d10247b8e9bd9f8b5577e52ed66b))
* **media:** tidy text track state ([#3057](https://github.com/videojs/v10/issues/3057)) ([614b77d](https://github.com/videojs/v10/commit/614b77dce7d9a3ed60baa1b0e2af854c8c8d865b))
* **packages:** attach extensions at the player ([#2880](https://github.com/videojs/v10/issues/2880)) ([9b6675e](https://github.com/videojs/v10/commit/9b6675e3cfe50e3b54f4d4d07a563a4fdc712291))
* **packages:** rename the minimal skin to neutral ([#3092](https://github.com/videojs/v10/issues/3092)) ([1d1eafc](https://github.com/videojs/v10/commit/1d1eafc022f78135a292035bc58fdb4befb6401e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-rc.5
    * @videojs/element bumped to 10.0.0-rc.5
    * @videojs/media bumped to 10.0.0-rc.5
    * @videojs/native-hls-video bumped to 10.0.0-rc.5
    * @videojs/spf bumped to 10.0.0-rc.5
    * @videojs/store bumped to 10.0.0-rc.5
    * @videojs/utils bumped to 10.0.0-rc.5
  * devDependencies
    * @videojs/cloudflare-video bumped to 10.0.0-rc.5
    * @videojs/dash-video bumped to 10.0.0-rc.5
    * @videojs/google-cast bumped to 10.0.0-rc.5
    * @videojs/hlsjs-video bumped to 10.0.0-rc.5
    * @videojs/icons bumped to 10.0.0-rc.5
    * @videojs/mux-audio bumped to 10.0.0-rc.5
    * @videojs/mux-data bumped to 10.0.0-rc.5
    * @videojs/mux-video bumped to 10.0.0-rc.5
    * @videojs/shaka-video bumped to 10.0.0-rc.5
    * @videojs/skins bumped to 10.0.0-rc.5
    * @videojs/spotify-audio bumped to 10.0.0-rc.5
    * @videojs/tiktok-video bumped to 10.0.0-rc.5
    * @videojs/twitch-video bumped to 10.0.0-rc.5
    * @videojs/vimeo-video bumped to 10.0.0-rc.5
    * @videojs/wistia-video bumped to 10.0.0-rc.5
    * @videojs/youtube-video bumped to 10.0.0-rc.5
  * peerDependencies
    * @videojs/cloudflare-video bumped to 10.0.0-rc.5
    * @videojs/dash-video bumped to 10.0.0-rc.5
    * @videojs/google-cast bumped to 10.0.0-rc.5
    * @videojs/hlsjs-video bumped to 10.0.0-rc.5
    * @videojs/mux-audio bumped to 10.0.0-rc.5
    * @videojs/mux-data bumped to 10.0.0-rc.5
    * @videojs/mux-video bumped to 10.0.0-rc.5
    * @videojs/shaka-video bumped to 10.0.0-rc.5
    * @videojs/spotify-audio bumped to 10.0.0-rc.5
    * @videojs/tiktok-video bumped to 10.0.0-rc.5
    * @videojs/twitch-video bumped to 10.0.0-rc.5
    * @videojs/vimeo-video bumped to 10.0.0-rc.5
    * @videojs/wistia-video bumped to 10.0.0-rc.5
    * @videojs/youtube-video bumped to 10.0.0-rc.5

## [10.0.0-rc.4](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-rc.3...@videojs/html@10.0.0-rc.4) (2026-09-26)


### Miscellaneous Chores

* **@videojs/html:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-rc.4
    * @videojs/element bumped to 10.0.0-rc.4
    * @videojs/media bumped to 10.0.0-rc.4
    * @videojs/native-hls-video bumped to 10.0.0-rc.4
    * @videojs/spf bumped to 10.0.0-rc.4
    * @videojs/store bumped to 10.0.0-rc.4
    * @videojs/utils bumped to 10.0.0-rc.4
  * devDependencies
    * @videojs/cloudflare-video bumped to 10.0.0-rc.4
    * @videojs/dash-video bumped to 10.0.0-rc.4
    * @videojs/google-cast bumped to 10.0.0-rc.4
    * @videojs/hlsjs-video bumped to 10.0.0-rc.4
    * @videojs/icons bumped to 10.0.0-rc.4
    * @videojs/mux-audio bumped to 10.0.0-rc.4
    * @videojs/mux-data bumped to 10.0.0-rc.4
    * @videojs/mux-video bumped to 10.0.0-rc.4
    * @videojs/shaka-video bumped to 10.0.0-rc.4
    * @videojs/skins bumped to 10.0.0-rc.4
    * @videojs/spotify-audio bumped to 10.0.0-rc.4
    * @videojs/tiktok-video bumped to 10.0.0-rc.4
    * @videojs/twitch-video bumped to 10.0.0-rc.4
    * @videojs/vimeo-video bumped to 10.0.0-rc.4
    * @videojs/wistia-video bumped to 10.0.0-rc.4
    * @videojs/youtube-video bumped to 10.0.0-rc.4
  * peerDependencies
    * @videojs/cloudflare-video bumped to 10.0.0-rc.4
    * @videojs/dash-video bumped to 10.0.0-rc.4
    * @videojs/google-cast bumped to 10.0.0-rc.4
    * @videojs/hlsjs-video bumped to 10.0.0-rc.4
    * @videojs/mux-audio bumped to 10.0.0-rc.4
    * @videojs/mux-data bumped to 10.0.0-rc.4
    * @videojs/mux-video bumped to 10.0.0-rc.4
    * @videojs/shaka-video bumped to 10.0.0-rc.4
    * @videojs/spotify-audio bumped to 10.0.0-rc.4
    * @videojs/tiktok-video bumped to 10.0.0-rc.4
    * @videojs/twitch-video bumped to 10.0.0-rc.4
    * @videojs/vimeo-video bumped to 10.0.0-rc.4
    * @videojs/wistia-video bumped to 10.0.0-rc.4
    * @videojs/youtube-video bumped to 10.0.0-rc.4

## [10.0.0-rc.3](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-rc.2...@videojs/html@10.0.0-rc.3) (2026-09-25)


### Features

* about-this-player page and a help link in every player ([#2758](https://github.com/videojs/v10/issues/2758)) ([8a538a5](https://github.com/videojs/v10/commit/8a538a572945c2bb01cb79d38f420ec143a4239c))
* **html:** export translateText from html entry points ([#2947](https://github.com/videojs/v10/issues/2947)) ([ca3ae5a](https://github.com/videojs/v10/commit/ca3ae5a92a86549a60bf64c24fdc74c2a38cb98e))
* **installation:** add versioned agent instructions ([#2948](https://github.com/videojs/v10/issues/2948)) ([a602f22](https://github.com/videojs/v10/commit/a602f220aedf9c2800983daade6ca298ada007ab))
* **skin:** add title display ([#2748](https://github.com/videojs/v10/issues/2748)) ([bc007bd](https://github.com/videojs/v10/commit/bc007bd9c01083507f493883b6eb047992937f79))
* **skin:** slot the slider thumbnail image ([#2700](https://github.com/videojs/v10/issues/2700)) ([b68563f](https://github.com/videojs/v10/commit/b68563f62595e19c8bfc0d3c88147ea74c4473ef))


### Bug Fixes

* **core:** apply popup starting styles before showing ([#2715](https://github.com/videojs/v10/issues/2715)) ([a80aeca](https://github.com/videojs/v10/commit/a80aecadecc1a7dee643c6a7200cc09dfa8c4f9e))
* **html:** register skin properties in the host document ([#2750](https://github.com/videojs/v10/issues/2750)) ([255e68c](https://github.com/videojs/v10/commit/255e68c8b0d5c6a53b58c38dbfeff43b4710a2e6))
* **packages:** keep the time slider interactive without the buffer feature ([#2869](https://github.com/videojs/v10/issues/2869)) ([1c629d6](https://github.com/videojs/v10/commit/1c629d612dd976bf84d404178a2cdb728a63d72e))
* **packages:** prevent menu highlight flicker ([#2969](https://github.com/videojs/v10/issues/2969)) ([461dbcf](https://github.com/videojs/v10/commit/461dbcfdde0c13481f6604cfe5632f9af6232416))
* **site:** improve markdown for agents ([#2883](https://github.com/videojs/v10/issues/2883)) ([d5c8e3c](https://github.com/videojs/v10/commit/d5c8e3cde77cbbe74ecc6878dbd7862db8628bfa))


### Performance Improvements

* **site:** faster docs dev server start ([#2698](https://github.com/videojs/v10/issues/2698)) ([33d3887](https://github.com/videojs/v10/commit/33d38873ed5337a5695eaa426a5ebfbea61356d2))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-rc.3
    * @videojs/element bumped to 10.0.0-rc.3
    * @videojs/media bumped to 10.0.0-rc.3
    * @videojs/native-hls-video bumped to 10.0.0-rc.3
    * @videojs/spf bumped to 10.0.0-rc.3
    * @videojs/store bumped to 10.0.0-rc.3
    * @videojs/utils bumped to 10.0.0-rc.3
  * devDependencies
    * @videojs/cloudflare-video bumped to 10.0.0-rc.3
    * @videojs/dash-video bumped to 10.0.0-rc.3
    * @videojs/google-cast bumped to 10.0.0-rc.3
    * @videojs/hlsjs-video bumped to 10.0.0-rc.3
    * @videojs/icons bumped to 10.0.0-rc.3
    * @videojs/mux-audio bumped to 10.0.0-rc.3
    * @videojs/mux-data bumped to 10.0.0-rc.3
    * @videojs/mux-video bumped to 10.0.0-rc.3
    * @videojs/shaka-video bumped to 10.0.0-rc.3
    * @videojs/skins bumped to 10.0.0-rc.3
    * @videojs/spotify-audio bumped to 10.0.0-rc.3
    * @videojs/tiktok-video bumped to 10.0.0-rc.3
    * @videojs/twitch-video bumped to 10.0.0-rc.3
    * @videojs/vimeo-video bumped to 10.0.0-rc.3
    * @videojs/wistia-video bumped to 10.0.0-rc.3
    * @videojs/youtube-video bumped to 10.0.0-rc.3
  * peerDependencies
    * @videojs/cloudflare-video bumped to 10.0.0-rc.3
    * @videojs/dash-video bumped to 10.0.0-rc.3
    * @videojs/google-cast bumped to 10.0.0-rc.3
    * @videojs/hlsjs-video bumped to 10.0.0-rc.3
    * @videojs/mux-audio bumped to 10.0.0-rc.3
    * @videojs/mux-data bumped to 10.0.0-rc.3
    * @videojs/mux-video bumped to 10.0.0-rc.3
    * @videojs/shaka-video bumped to 10.0.0-rc.3
    * @videojs/spotify-audio bumped to 10.0.0-rc.3
    * @videojs/tiktok-video bumped to 10.0.0-rc.3
    * @videojs/twitch-video bumped to 10.0.0-rc.3
    * @videojs/vimeo-video bumped to 10.0.0-rc.3
    * @videojs/wistia-video bumped to 10.0.0-rc.3
    * @videojs/youtube-video bumped to 10.0.0-rc.3

## [10.0.0-rc.2](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-rc.1...@videojs/html@10.0.0-rc.2) (2026-09-09)


### ⚠ BREAKING CHANGES

* **html:** make thumbnail images composable ([#2572](https://github.com/videojs/v10/issues/2572))
* **react:** make thumbnail composable ([#2566](https://github.com/videojs/v10/issues/2566))
* **react:** make poster composable ([#2563](https://github.com/videojs/v10/issues/2563))

### Features

* **html:** make thumbnail images composable ([#2572](https://github.com/videojs/v10/issues/2572)) ([6dfdce5](https://github.com/videojs/v10/commit/6dfdce50a8717573268841dbc6ed8c2b02b9108d))
* **packages:** handle controls before media metadata ([#2525](https://github.com/videojs/v10/issues/2525)) ([feed475](https://github.com/videojs/v10/commit/feed475b42186340162b92e3366f132729b6b0f9))
* **react:** make poster composable ([#2563](https://github.com/videojs/v10/issues/2563)) ([def9bf2](https://github.com/videojs/v10/commit/def9bf21d39cce091bf31c1b36651fceb8c25687))
* **react:** make thumbnail composable ([#2566](https://github.com/videojs/v10/issues/2566)) ([55b36ab](https://github.com/videojs/v10/commit/55b36ab31a07ae54ca084bd470a61cfc760a8e13))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-rc.2
    * @videojs/element bumped to 10.0.0-rc.2
    * @videojs/media bumped to 10.0.0-rc.2
    * @videojs/native-hls-video bumped to 10.0.0-rc.2
    * @videojs/spf bumped to 10.0.0-rc.2
    * @videojs/store bumped to 10.0.0-rc.2
    * @videojs/utils bumped to 10.0.0-rc.2
  * devDependencies
    * @videojs/cloudflare-video bumped to 10.0.0-rc.2
    * @videojs/dash-video bumped to 10.0.0-rc.2
    * @videojs/google-cast bumped to 10.0.0-rc.2
    * @videojs/hlsjs-video bumped to 10.0.0-rc.2
    * @videojs/icons bumped to 10.0.0-rc.2
    * @videojs/mux-audio bumped to 10.0.0-rc.2
    * @videojs/mux-data bumped to 10.0.0-rc.2
    * @videojs/mux-video bumped to 10.0.0-rc.2
    * @videojs/shaka-video bumped to 10.0.0-rc.2
    * @videojs/skins bumped to 10.0.0-rc.2
    * @videojs/spotify-audio bumped to 10.0.0-rc.2
    * @videojs/tiktok-video bumped to 10.0.0-rc.2
    * @videojs/twitch-video bumped to 10.0.0-rc.2
    * @videojs/vimeo-video bumped to 10.0.0-rc.2
    * @videojs/wistia-video bumped to 10.0.0-rc.2
    * @videojs/youtube-video bumped to 10.0.0-rc.2
  * peerDependencies
    * @videojs/cloudflare-video bumped to 10.0.0-rc.2
    * @videojs/dash-video bumped to 10.0.0-rc.2
    * @videojs/google-cast bumped to 10.0.0-rc.2
    * @videojs/hlsjs-video bumped to 10.0.0-rc.2
    * @videojs/mux-audio bumped to 10.0.0-rc.2
    * @videojs/mux-data bumped to 10.0.0-rc.2
    * @videojs/mux-video bumped to 10.0.0-rc.2
    * @videojs/shaka-video bumped to 10.0.0-rc.2
    * @videojs/spotify-audio bumped to 10.0.0-rc.2
    * @videojs/tiktok-video bumped to 10.0.0-rc.2
    * @videojs/twitch-video bumped to 10.0.0-rc.2
    * @videojs/vimeo-video bumped to 10.0.0-rc.2
    * @videojs/wistia-video bumped to 10.0.0-rc.2
    * @videojs/youtube-video bumped to 10.0.0-rc.2

## [10.0.0-rc.1](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.32...@videojs/html@10.0.0-rc.1) (2026-09-08)


### ⚠ BREAKING CHANGES

* **packages:** adapter renaming ([#2602](https://github.com/videojs/v10/issues/2602))
* **packages:** MediaComponent => MediaExtension ([#2601](https://github.com/videojs/v10/issues/2601))
* **packages:** extension renaming ([#2600](https://github.com/videojs/v10/issues/2600))
* **packages:** playback adapters packages ([#2567](https://github.com/videojs/v10/issues/2567))
* **packages:** move integrations to extension paths ([#2577](https://github.com/videojs/v10/issues/2577))

### Features

* **html:** generate VJSC skin templates ([#2546](https://github.com/videojs/v10/issues/2546)) ([70a1230](https://github.com/videojs/v10/commit/70a1230d44cbf0980253c1272a8106d6e47c0f48))
* **html:** publish skin stylesheets to the CDN build ([#2340](https://github.com/videojs/v10/issues/2340)) ([a67ffb4](https://github.com/videojs/v10/commit/a67ffb437161654d704dd0e3e4ecde2a6c4fcdad))
* **packages:** add wistia video media ([#2305](https://github.com/videojs/v10/issues/2305)) ([306c733](https://github.com/videojs/v10/commit/306c7333fc100308a7ac59c8edaa08dbc5c64d58))
* **packages:** share menu option state across targets ([#2528](https://github.com/videojs/v10/issues/2528)) ([4392cd6](https://github.com/videojs/v10/commit/4392cd6f7fa92dd3bb329b5a92206f5bf27a75b2))
* **sandbox:** fold the skins playground into the sandbox ([#2586](https://github.com/videojs/v10/issues/2586)) ([ee38b1d](https://github.com/videojs/v10/commit/ee38b1d81ee64af72a6d9859094444fe635cc332))
* **vjsc:** add named render targets ([#2527](https://github.com/videojs/v10/issues/2527)) ([5b606d2](https://github.com/videojs/v10/commit/5b606d2026bb9528167f64b4b731145ceb1224f2))


### Bug Fixes

* **html:** remove tailwind skin elements ([#2434](https://github.com/videojs/v10/issues/2434)) ([45f6f28](https://github.com/videojs/v10/commit/45f6f2876fba5d8b82b3ae96b0bc6704483fa011))
* **packages:** align dialog styles across skins ([#2481](https://github.com/videojs/v10/issues/2481)) ([9601006](https://github.com/videojs/v10/commit/9601006ede03d295f1c2811db6eee0f768e30bd3))
* **packages:** isolate focused slider hotkeys ([#2474](https://github.com/videojs/v10/issues/2474)) ([0f7b08f](https://github.com/videojs/v10/commit/0f7b08f8a9c8948cf35a0b1c8d4d411f1bf166c3))
* **packages:** preserve fullscreen after pointer activation ([#2472](https://github.com/videojs/v10/issues/2472)) ([b526c44](https://github.com/videojs/v10/commit/b526c444efae99873946eafa607673b19c6978f0))
* **packages:** reject invalid gesture types ([#2473](https://github.com/videojs/v10/issues/2473)) ([0da416a](https://github.com/videojs/v10/commit/0da416aa3a5d08bc23ec968593b7f3beee00d204))
* **packages:** restore ejected player registration and slider press locking ([#2505](https://github.com/videojs/v10/issues/2505)) ([36bb836](https://github.com/videojs/v10/commit/36bb83600622aff75169f4fe5d039f17e9f1f7d9))
* **packages:** scope error dialogs to player containers ([#2449](https://github.com/videojs/v10/issues/2449)) ([9fbc979](https://github.com/videojs/v10/commit/9fbc9790189b5df8d5d047eaf01605d6e8d7fb6b))
* **packages:** share input action defaults ([#2484](https://github.com/videojs/v10/issues/2484)) ([db1221c](https://github.com/videojs/v10/commit/db1221c7ebd019b58dced646fc4223d816e48bca))
* **skins:** harden shadcn registry delivery ([#2576](https://github.com/videojs/v10/issues/2576)) ([331cf7b](https://github.com/videojs/v10/commit/331cf7b5a602acd81f392bcb03d1a26c50ad1898))


### Code Refactoring

* **packages:** adapter renaming ([#2602](https://github.com/videojs/v10/issues/2602)) ([b964889](https://github.com/videojs/v10/commit/b964889fdf68a4cdaf4686ef96bb0e8c8f2f4abd))
* **packages:** extension renaming ([#2600](https://github.com/videojs/v10/issues/2600)) ([7075d1f](https://github.com/videojs/v10/commit/7075d1f9e111d6d0eb70f319c6d05beacb88d833))
* **packages:** MediaComponent =&gt; MediaExtension ([#2601](https://github.com/videojs/v10/issues/2601)) ([eebe675](https://github.com/videojs/v10/commit/eebe675408e50bcd3893d01f56dbb7a92a2fb5d1))
* **packages:** move integrations to extension paths ([#2577](https://github.com/videojs/v10/issues/2577)) ([8859237](https://github.com/videojs/v10/commit/88592377bfe24d79c0cec8ee1538336479d2c490))
* **packages:** playback adapters packages ([#2567](https://github.com/videojs/v10/issues/2567)) ([12b08e3](https://github.com/videojs/v10/commit/12b08e3b0c3c07e5948f74a8cf6fce96c8b8eba7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-rc.1
    * @videojs/element bumped to 10.0.0-rc.1
    * @videojs/media bumped to 10.0.0-rc.1
    * @videojs/native-hls-video bumped to 10.0.0-rc.1
    * @videojs/spf bumped to 10.0.0-rc.1
    * @videojs/store bumped to 10.0.0-rc.1
    * @videojs/utils bumped to 10.0.0-rc.1
  * devDependencies
    * @videojs/cloudflare-video bumped to 10.0.0-rc.1
    * @videojs/dash-video bumped to 10.0.0-rc.1
    * @videojs/google-cast bumped to 10.0.0-rc.1
    * @videojs/hlsjs-video bumped to 10.0.0-rc.1
    * @videojs/icons bumped to 10.0.0-rc.1
    * @videojs/mux-audio bumped to 10.0.0-rc.1
    * @videojs/mux-data bumped to 10.0.0-rc.1
    * @videojs/mux-video bumped to 10.0.0-rc.1
    * @videojs/shaka-video bumped to 10.0.0-rc.1
    * @videojs/skins bumped to 10.0.0-rc.1
    * @videojs/spotify-audio bumped to 10.0.0-rc.1
    * @videojs/tiktok-video bumped to 10.0.0-rc.1
    * @videojs/twitch-video bumped to 10.0.0-rc.1
    * @videojs/vimeo-video bumped to 10.0.0-rc.1
    * @videojs/wistia-video bumped to 10.0.0-rc.1
    * @videojs/youtube-video bumped to 10.0.0-rc.1
  * peerDependencies
    * @videojs/cloudflare-video bumped to 10.0.0-rc.1
    * @videojs/dash-video bumped to 10.0.0-rc.1
    * @videojs/google-cast bumped to 10.0.0-rc.1
    * @videojs/hlsjs-video bumped to 10.0.0-rc.1
    * @videojs/mux-audio bumped to 10.0.0-rc.1
    * @videojs/mux-data bumped to 10.0.0-rc.1
    * @videojs/mux-video bumped to 10.0.0-rc.1
    * @videojs/shaka-video bumped to 10.0.0-rc.1
    * @videojs/spotify-audio bumped to 10.0.0-rc.1
    * @videojs/tiktok-video bumped to 10.0.0-rc.1
    * @videojs/twitch-video bumped to 10.0.0-rc.1
    * @videojs/vimeo-video bumped to 10.0.0-rc.1
    * @videojs/wistia-video bumped to 10.0.0-rc.1
    * @videojs/youtube-video bumped to 10.0.0-rc.1

## [10.0.0-beta.32](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.31...@videojs/html@10.0.0-beta.32) (2026-08-26)


### ⚠ BREAKING CHANGES

* **html:** make preset and UI registration explicit ([#2247](https://github.com/videojs/v10/issues/2247))
* **packages:** separate controls content and backdrop surfaces ([#2436](https://github.com/videojs/v10/issues/2436))
* **packages:** separate dialog popup and backdrop surfaces ([#2435](https://github.com/videojs/v10/issues/2435))
* **html:** return PlayerElement from createPlayer ([#2180](https://github.com/videojs/v10/issues/2180))
* **html:** rename MediaElement to UIElement ([#2245](https://github.com/videojs/v10/issues/2245))
* **html:** replace ContainerMixin with ContainerElement ([#2280](https://github.com/videojs/v10/issues/2280))

### Features

* **packages:** add backdrop component parts ([#2343](https://github.com/videojs/v10/issues/2343)) ([81bb99a](https://github.com/videojs/v10/commit/81bb99abbce0af138d8dcfd04d456a3d654424ca))
* **packages:** add dialog component ([#2379](https://github.com/videojs/v10/issues/2379)) ([108b8fd](https://github.com/videojs/v10/commit/108b8fda826a870bf29453289a0081ebd7df890c))
* **packages:** add volume popover compound ([#2378](https://github.com/videojs/v10/issues/2378)) ([a23fdd9](https://github.com/videojs/v10/commit/a23fdd93e56c07aab53cad0e66672926b1582411))
* **packages:** expose container controls state ([#2376](https://github.com/videojs/v10/issues/2376)) ([30065dd](https://github.com/videojs/v10/commit/30065dd1980c35484b41b3a4925a6ef049aae6a0))
* **packages:** separate controls content and backdrop surfaces ([#2436](https://github.com/videojs/v10/issues/2436)) ([7a6ccb0](https://github.com/videojs/v10/commit/7a6ccb0058c0a15fa30fd07cef3f662ac121d90c))
* **packages:** separate dialog popup and backdrop surfaces ([#2435](https://github.com/videojs/v10/issues/2435)) ([0065e9f](https://github.com/videojs/v10/commit/0065e9f77ced3a5f9878e135c5a1bcd1825f229d))
* **site:** generate component event references ([#2404](https://github.com/videojs/v10/issues/2404)) ([1fec07c](https://github.com/videojs/v10/commit/1fec07c1c5a0cd7a899c103eeb44d9401f24526d))


### Bug Fixes

* **element:** preserve props across late registration ([#2400](https://github.com/videojs/v10/issues/2400)) ([8b96602](https://github.com/videojs/v10/commit/8b966029325470f49c028f8d19242ac5100373c7))
* **html:** handle detached popup roots ([#2348](https://github.com/videojs/v10/issues/2348)) ([9c76a99](https://github.com/videojs/v10/commit/9c76a9976a5aa4fa3b76bbc24f1057815e770953))
* **i18n:** preserve registered translation overrides ([#2354](https://github.com/videojs/v10/issues/2354)) ([c6307e9](https://github.com/videojs/v10/commit/c6307e9830262441fa557da43984ef428a86f57f))
* **packages:** add audio playback rate tooltips ([#2389](https://github.com/videojs/v10/issues/2389)) ([bc9fd5f](https://github.com/videojs/v10/commit/bc9fd5f81d1b50300f50ae9a71d1e5bb4b7a0e85))
* **packages:** improve menu behavior and sizing ([#2440](https://github.com/videojs/v10/issues/2440)) ([0d90572](https://github.com/videojs/v10/commit/0d9057268c59d17a4c91f1f84a60333cf082fd38))
* **packages:** make html entries server importable ([#2428](https://github.com/videojs/v10/issues/2428)) ([33f4de1](https://github.com/videojs/v10/commit/33f4de15b6d73fdba5f1d7aeb6b94b469f6c1487))
* **packages:** restore minimal volume controls ([#2386](https://github.com/videojs/v10/issues/2386)) ([2e9c1e2](https://github.com/videojs/v10/commit/2e9c1e221e4eca5dbc76e01718fabf82c433a483))


### Performance Improvements

* **packages:** enable native MagicString ([#2311](https://github.com/videojs/v10/issues/2311)) ([599007f](https://github.com/videojs/v10/commit/599007f72461b51eb4a4ad28049bb7bbc3e207d7))


### Code Refactoring

* **html:** make preset and UI registration explicit ([#2247](https://github.com/videojs/v10/issues/2247)) ([2fe8b79](https://github.com/videojs/v10/commit/2fe8b79b1fa5ccbc83b460523c9e610ea5beabde))
* **html:** rename MediaElement to UIElement ([#2245](https://github.com/videojs/v10/issues/2245)) ([761dcf3](https://github.com/videojs/v10/commit/761dcf382b5c2fc37f1d1ce892e82910e6113910))
* **html:** replace ContainerMixin with ContainerElement ([#2280](https://github.com/videojs/v10/issues/2280)) ([76fa285](https://github.com/videojs/v10/commit/76fa285c3e91143d6776dfce4562147116036751))
* **html:** return PlayerElement from createPlayer ([#2180](https://github.com/videojs/v10/issues/2180)) ([2007d18](https://github.com/videojs/v10/commit/2007d18f72f2f28a5b45b071c921281751e2b208))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.32
    * @videojs/element bumped to 10.0.0-beta.32
    * @videojs/media bumped to 10.0.0-beta.32
    * @videojs/spf bumped to 10.0.0-beta.32
    * @videojs/store bumped to 10.0.0-beta.32
    * @videojs/utils bumped to 10.0.0-beta.32
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.32
    * @videojs/skins bumped to 10.0.0-beta.32

## [10.0.0-beta.31](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.30...@videojs/html@10.0.0-beta.31) (2026-08-21)


### Features

* **packages:** add live presets to installation and skin tools ([#1919](https://github.com/videojs/v10/issues/1919)) ([44a398c](https://github.com/videojs/v10/commit/44a398c3a0c7084bedabd77123742f9521d2b052))
* **packages:** add right-to-left player support ([#2281](https://github.com/videojs/v10/issues/2281)) ([caf179b](https://github.com/videojs/v10/commit/caf179b83260a242a7ff284d1d474f97a91988a9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.31
    * @videojs/element bumped to 10.0.0-beta.31
    * @videojs/media bumped to 10.0.0-beta.31
    * @videojs/spf bumped to 10.0.0-beta.31
    * @videojs/store bumped to 10.0.0-beta.31
    * @videojs/utils bumped to 10.0.0-beta.31
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.31
    * @videojs/skins bumped to 10.0.0-beta.31

## [10.0.0-beta.30](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.29...@videojs/html@10.0.0-beta.30) (2026-08-20)


### ⚠ BREAKING CHANGES

* **packages:** configure orientation lock through providers ([#1999](https://github.com/videojs/v10/issues/1999))
* **packages:** remove built-in poster placeholders ([#2063](https://github.com/videojs/v10/issues/2063))

### Features

* **packages:** add shaka player media ([#2276](https://github.com/videojs/v10/issues/2276)) ([c5895ec](https://github.com/videojs/v10/commit/c5895ecb0887369badffb19d4798207185c02e4e))
* **packages:** add title component ([#1997](https://github.com/videojs/v10/issues/1997)) ([0841131](https://github.com/videojs/v10/commit/0841131c293a77662ab3417b8ccbb9839d69fb12))
* **packages:** configure orientation lock through providers ([#1999](https://github.com/videojs/v10/issues/1999)) ([e8829a2](https://github.com/videojs/v10/commit/e8829a2ccf95c0a244bd40134b4f244ad6ccdeaf))


### Bug Fixes

* **packages:** load posters and storyboard thumbnails in cross-origin-isolated pages ([#2273](https://github.com/videojs/v10/issues/2273)) ([459fddb](https://github.com/videojs/v10/commit/459fddb7282770963bd28d42ed6c7a572845b88b))


### Code Refactoring

* **packages:** remove built-in poster placeholders ([#2063](https://github.com/videojs/v10/issues/2063)) ([e7de7a7](https://github.com/videojs/v10/commit/e7de7a78c4806403a2416926bdbeddb171de1fed))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.30
    * @videojs/element bumped to 10.0.0-beta.30
    * @videojs/media bumped to 10.0.0-beta.30
    * @videojs/spf bumped to 10.0.0-beta.30
    * @videojs/store bumped to 10.0.0-beta.30
    * @videojs/utils bumped to 10.0.0-beta.30
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.30
    * @videojs/skins bumped to 10.0.0-beta.30

## [10.0.0-beta.29](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.28...@videojs/html@10.0.0-beta.29) (2026-08-19)


### ⚠ BREAKING CHANGES

* **packages:** resolve the poster in the store, and set src on img from it ([#2039](https://github.com/videojs/v10/issues/2039))
* **packages:** name the resolved title `title`, and take it from config only ([#2176](https://github.com/videojs/v10/issues/2176))
* **spf:** cap renditions to the screen and surface unplayable sources ([#2135](https://github.com/videojs/v10/issues/2135))

### Features

* **packages:** name the resolved title `title`, and take it from config only ([#2176](https://github.com/videojs/v10/issues/2176)) ([969cf56](https://github.com/videojs/v10/commit/969cf567b3125e437d8f68982f655ee4255409ae))
* **packages:** resolve the poster in the store, and set src on img from it ([#2039](https://github.com/videojs/v10/issues/2039)) ([7a902db](https://github.com/videojs/v10/commit/7a902db20e9ec335eb27a6cee6aaa6a7c0d0e29d))
* **skin:** add canonical buffering indicator ([#2189](https://github.com/videojs/v10/issues/2189)) ([4055cd5](https://github.com/videojs/v10/commit/4055cd5cd93fbeb902159701c74d8839d05737fc))
* **skin:** add canonical captions button ([#2191](https://github.com/videojs/v10/issues/2191)) ([6a6d8a6](https://github.com/videojs/v10/commit/6a6d8a669afb24299ffd745fe60b937e0c1a2b1f))
* **skin:** add canonical error dialog ([#2190](https://github.com/videojs/v10/issues/2190)) ([fdfa869](https://github.com/videojs/v10/commit/fdfa869edaf42989194f18c33c8e438257220518))
* **skin:** add canonical input indicators ([#2193](https://github.com/videojs/v10/issues/2193)) ([549f65c](https://github.com/videojs/v10/commit/549f65c88411279fd1e3153efbe6c3d541648bb6))
* **skin:** add canonical minimal video skin ([#2199](https://github.com/videojs/v10/issues/2199)) ([87b2eb3](https://github.com/videojs/v10/commit/87b2eb3c949235e3612a0a00e6bb23c8f721f98f))
* **skin:** add canonical remote playback controls ([#2192](https://github.com/videojs/v10/issues/2192)) ([ec0572d](https://github.com/videojs/v10/commit/ec0572d9af57752e28befbc07ba57440aa209a15))
* **skin:** add canonical styling and registry output ([#2202](https://github.com/videojs/v10/issues/2202)) ([8982d8d](https://github.com/videojs/v10/commit/8982d8d88e09827ad14ed406864c1db14d66c9c8))
* **skin:** add canonical time slider chapters ([#2195](https://github.com/videojs/v10/issues/2195)) ([44ba4e9](https://github.com/videojs/v10/commit/44ba4e97be5e792680bb8f53edd44492a043459b))
* **skin:** add canonical video input bindings ([#2197](https://github.com/videojs/v10/issues/2197)) ([885eb82](https://github.com/videojs/v10/commit/885eb824c0a5b38443a8a750c8d9f8b4a6ba23ee))
* **skin:** add canonical video settings menu ([#2196](https://github.com/videojs/v10/issues/2196)) ([db7e1c3](https://github.com/videojs/v10/commit/db7e1c31c44385119aa6a9d119d422ea982c1a7f))
* **skin:** complete canonical default video skin ([#2198](https://github.com/videojs/v10/issues/2198)) ([941a6bf](https://github.com/videojs/v10/commit/941a6bfa485bb717522233fb6065ad4d811fb81f))
* **skin:** complete canonical volume popover ([#2194](https://github.com/videojs/v10/issues/2194)) ([6fd0684](https://github.com/videojs/v10/commit/6fd068423062b42a2ea6c4cd93ffadafe58dfb96))
* **skin:** share settings menu composition ([#2203](https://github.com/videojs/v10/issues/2203)) ([9b109ba](https://github.com/videojs/v10/commit/9b109ba01230ff166dbd02ba1bbb7e652f94402f))
* **spf:** cap renditions to the screen and surface unplayable sources ([#2135](https://github.com/videojs/v10/issues/2135)) ([20c1464](https://github.com/videojs/v10/commit/20c14648b8342aec91c07e4a743949488ff62939))


### Bug Fixes

* **skin:** align canonical poster and default controls ([#2181](https://github.com/videojs/v10/issues/2181)) ([58db042](https://github.com/videojs/v10/commit/58db04269f0683055e557d2df5b9ab5f6508088b))
* **skin:** style fixes ([#2257](https://github.com/videojs/v10/issues/2257)) ([ae1ca50](https://github.com/videojs/v10/commit/ae1ca50920e6a7db143c524b4808998e32ed83c5))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.29
    * @videojs/element bumped to 10.0.0-beta.29
    * @videojs/media bumped to 10.0.0-beta.29
    * @videojs/spf bumped to 10.0.0-beta.29
    * @videojs/store bumped to 10.0.0-beta.29
    * @videojs/utils bumped to 10.0.0-beta.29
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.29
    * @videojs/skins bumped to 10.0.0-beta.29

## [10.0.0-beta.28](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.27...@videojs/html@10.0.0-beta.28) (2026-08-19)


### Features

* **ci:** publish the sandbox as a stackblitz preview template ([#2229](https://github.com/videojs/v10/issues/2229)) ([19b017b](https://github.com/videojs/v10/commit/19b017b66e492014638cf5fba85f7efdfd912b4f))
* **media:** add maxAutoResolution cap to hls.js sources ([#2061](https://github.com/videojs/v10/issues/2061)) ([414513f](https://github.com/videojs/v10/commit/414513f03db856e860a882921927a12e7d57c470))
* **media:** cap hls.js renditions to the player size ([#2243](https://github.com/videojs/v10/issues/2243)) ([e5dd81a](https://github.com/videojs/v10/commit/e5dd81ad6c255a0203a731a03985e44c91ae1bc3))


### Bug Fixes

* **core:** include menu triggers in tab order ([#2238](https://github.com/videojs/v10/issues/2238)) ([8eebaef](https://github.com/videojs/v10/commit/8eebaefc1b2438ea45b1b28df09ef6aef2b2bde6))
* **html:** ship a cdn bundle for every media element ([#2252](https://github.com/videojs/v10/issues/2252)) ([6999a35](https://github.com/videojs/v10/commit/6999a35d59a020a9c1920010eba4bae295374364))
* **packages:** make the TikTok embed answer the player's controls ([#2218](https://github.com/videojs/v10/issues/2218)) ([0882e1a](https://github.com/videojs/v10/commit/0882e1a232da5438a312ac09ba522d7eb489573f))
* **packages:** restore menu trigger keyboard interaction ([#2235](https://github.com/videojs/v10/issues/2235)) ([0b193a5](https://github.com/videojs/v10/commit/0b193a5d365a200d045dd8b306affde919ad6ac7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.28
    * @videojs/element bumped to 10.0.0-beta.28
    * @videojs/media bumped to 10.0.0-beta.28
    * @videojs/spf bumped to 10.0.0-beta.28
    * @videojs/store bumped to 10.0.0-beta.28
    * @videojs/utils bumped to 10.0.0-beta.28
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.28
    * @videojs/skins bumped to 10.0.0-beta.28

## [10.0.0-beta.27](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.26...@videojs/html@10.0.0-beta.27) (2026-08-17)


### ⚠ BREAKING CHANGES

* **packages:** normalize time slider chapters ([#2204](https://github.com/videojs/v10/issues/2204))
* **packages:** remove containers from createPlayer ([#2154](https://github.com/videojs/v10/issues/2154))
* **packages:** simplify menus ([#2029](https://github.com/videojs/v10/issues/2029))
* **skin:** css clean up and API stabilization ([#2094](https://github.com/videojs/v10/issues/2094))
* **packages:** rename the SPF background-video Media to hls-background-video ([#2097](https://github.com/videojs/v10/issues/2097))
* **packages:** rename SimpleHls* to Hls* (video + audio) ([#2096](https://github.com/videojs/v10/issues/2096))
* **packages:** add <mux-background-video> over the SPF background-video engine ([#2062](https://github.com/videojs/v10/issues/2062))
* **spf:** add the SPF-backed Mux Media, elements, and components ([#2045](https://github.com/videojs/v10/issues/2045))
* **packages:** separate input indicator components ([#2046](https://github.com/videojs/v10/issues/2046))
* **packages:** normalize radio group option state ([#2047](https://github.com/videojs/v10/issues/2047))
* **packages:** relocate spf media facades ([#2033](https://github.com/videojs/v10/issues/2033))
* **packages:** restructure media source, engine, and Mux image APIs ([#1903](https://github.com/videojs/v10/issues/1903))
* **core:** centralize popup positioning ([#1904](https://github.com/videojs/v10/issues/1904))

### Features

* **build:** include distribution files as a release asset ([#2122](https://github.com/videojs/v10/issues/2122)) ([755a766](https://github.com/videojs/v10/commit/755a7666835190d154e3387c772ce9e3a37d7d67))
* **i18n:** add Lithuanian locale pack ([#1917](https://github.com/videojs/v10/issues/1917)) ([aa14c87](https://github.com/videojs/v10/commit/aa14c879aed88e3e95fef8a27067cab77c5c11ff))
* **media:** support DRM protected native HLS playback ([#2014](https://github.com/videojs/v10/issues/2014)) ([1afed11](https://github.com/videojs/v10/commit/1afed1164c98b341f3104cd287cbc55ae20dc2a4))
* **packages:** add &lt;mux-background-video&gt; over the SPF background-video engine ([#2062](https://github.com/videojs/v10/issues/2062)) ([8dc9562](https://github.com/videojs/v10/commit/8dc9562906e9fb05a56267899a005882d3167d40))
* **packages:** add chaptered time sliders ([#2043](https://github.com/videojs/v10/issues/2043)) ([6490051](https://github.com/videojs/v10/commit/6490051ac8b991f8c9c47e2cb424b9ffb676230c))
* **packages:** add cloudflare stream media ([#2168](https://github.com/videojs/v10/issues/2168)) ([cfb4b65](https://github.com/videojs/v10/commit/cfb4b6571f0086c557c5b4683c4ced396067a0d2))
* **packages:** add spotify audio media ([#2169](https://github.com/videojs/v10/issues/2169)) ([8993ab1](https://github.com/videojs/v10/commit/8993ab1db3cd4ff7569b29c197efdabd8fd18364))
* **packages:** add tiktok video media ([#2170](https://github.com/videojs/v10/issues/2170)) ([7ff13b4](https://github.com/videojs/v10/commit/7ff13b426d92d5d19aaff8e1d074de05649abf7b))
* **packages:** add twitch video media ([#2171](https://github.com/videojs/v10/issues/2171)) ([cde01ce](https://github.com/videojs/v10/commit/cde01ceabfc090e4b713d30d5b25115a9fbaed63))
* **packages:** add youtube media with html and react components ([#1853](https://github.com/videojs/v10/issues/1853)) ([f7571e3](https://github.com/videojs/v10/commit/f7571e3d1fbfbcabf8cba319fb498bb052afb376))
* **packages:** hide unavailable radio groups ([#2069](https://github.com/videojs/v10/issues/2069)) ([b7fe79e](https://github.com/videojs/v10/commit/b7fe79e2632cc1beda613944eec8bfbd15f9f8e8))
* **packages:** normalize volume slider availability ([#2072](https://github.com/videojs/v10/issues/2072)) ([5704678](https://github.com/videojs/v10/commit/5704678b1daadcf73636047b2f3772d8c4780996))
* **packages:** resolve feature state from user and media values ([#1946](https://github.com/videojs/v10/issues/1946)) ([4751abb](https://github.com/videojs/v10/commit/4751abb75bd6febf5ccbccdd9061379c8f384430))
* **react:** add captions radio group ([#2127](https://github.com/videojs/v10/issues/2127)) ([979458f](https://github.com/videojs/v10/commit/979458fccd6127eff7da74cf528e2f4bc26d2297))
* **react:** add quality radio group ([#2132](https://github.com/videojs/v10/issues/2132)) ([29171b7](https://github.com/videojs/v10/commit/29171b79ff282efe355864ea18d95382ae9bc9a6))
* **skin:** add canonical container, poster, and overlay ([#2179](https://github.com/videojs/v10/issues/2179)) ([4f72ee7](https://github.com/videojs/v10/commit/4f72ee7092f7b909c8c892af1f94a10297c97338))
* **skin:** build pipeline ([#2021](https://github.com/videojs/v10/issues/2021)) ([9381a34](https://github.com/videojs/v10/commit/9381a34025848812325f47634c4e745ba9103f11))
* **skin:** setup html compiler plugin ([#2007](https://github.com/videojs/v10/issues/2007)) ([cd9cf01](https://github.com/videojs/v10/commit/cd9cf016e18e5c3bdb1a107f06169d8edcb21f66))
* **spf:** add the SPF-backed Mux Media, elements, and components ([#2045](https://github.com/videojs/v10/issues/2045)) ([d1d1673](https://github.com/videojs/v10/commit/d1d1673ecd17e1ca1492abc5b396296bb8c7b176))


### Bug Fixes

* **build:** make cdn bundles self-contained ([#2121](https://github.com/videojs/v10/issues/2121)) ([45c43e9](https://github.com/videojs/v10/commit/45c43e9008875aa7daa7bba10c5842e91bbda2bd))
* **html:** stabilize ejected element registration ([#2031](https://github.com/videojs/v10/issues/2031)) ([43b83f8](https://github.com/videojs/v10/commit/43b83f8167f30a82f33b3e2c7eed6b98345c1818))
* **i18n:** improve locale translations ([#1914](https://github.com/videojs/v10/issues/1914)) ([12cc939](https://github.com/videojs/v10/commit/12cc939f58f4ad2db7218374d96c5aa690ca49e5))
* **i18n:** improve time inversion labels ([#2028](https://github.com/videojs/v10/issues/2028)) ([eeb216a](https://github.com/videojs/v10/commit/eeb216ad2f7dbfe83ec214cb49fc7fb990ff1a7f))
* **media:** hook the media's actual playback engine in mux data ([#2040](https://github.com/videojs/v10/issues/2040)) ([501af91](https://github.com/videojs/v10/commit/501af9168c92a3ef757ff6de010c86a495df11f4))
* **packages:** add settings tooltip ([#1915](https://github.com/videojs/v10/issues/1915)) ([96d2e05](https://github.com/videojs/v10/commit/96d2e05147cd973900bb88b5ac5abf8e93fdbe8d))
* **packages:** build iframe media embeds when the source arrives after attach ([#2118](https://github.com/videojs/v10/issues/2118)) ([b8bffc5](https://github.com/videojs/v10/commit/b8bffc54ab00d731fdf7b9194bc4d50e022059de))
* **packages:** improve ui motion ([#2208](https://github.com/videojs/v10/issues/2208)) ([42f934e](https://github.com/videojs/v10/commit/42f934e9bea4e4961d63d6de1e2eebcc520f8237))
* **packages:** keep controls visible during active interactions ([#1900](https://github.com/videojs/v10/issues/1900)) ([35616db](https://github.com/videojs/v10/commit/35616db5a38d193f1fc114da4af68a79f08093f1))
* **packages:** menu keyboard navigation ([#2214](https://github.com/videojs/v10/issues/2214)) ([15e3ba6](https://github.com/videojs/v10/commit/15e3ba6af98d104739904192afaacccd37014216))
* **packages:** scope popup groups to containers ([#2083](https://github.com/videojs/v10/issues/2083)) ([453d949](https://github.com/videojs/v10/commit/453d949c7f80c39194170883a6d6ce240d827e46))
* **skins:** update submenu transitions ([#2130](https://github.com/videojs/v10/issues/2130)) ([c3de3d4](https://github.com/videojs/v10/commit/c3de3d4ff368c2ea1626151a25ff143f3ddc528a))


### Code Refactoring

* **core:** centralize popup positioning ([#1904](https://github.com/videojs/v10/issues/1904)) ([d27eda2](https://github.com/videojs/v10/commit/d27eda2a25bd90841d24da0a3fee67d7d3d586c7))
* **packages:** normalize radio group option state ([#2047](https://github.com/videojs/v10/issues/2047)) ([e91f38c](https://github.com/videojs/v10/commit/e91f38cbcea36d2ab5f138fb178eb7a09b57be3b))
* **packages:** normalize time slider chapters ([#2204](https://github.com/videojs/v10/issues/2204)) ([12656e0](https://github.com/videojs/v10/commit/12656e01e274c65dd9fd87b3e36ab4c47e9c0949))
* **packages:** relocate spf media facades ([#2033](https://github.com/videojs/v10/issues/2033)) ([7ee7fa5](https://github.com/videojs/v10/commit/7ee7fa549777378c5e30cc6c151ab0d501538b83))
* **packages:** remove containers from createPlayer ([#2154](https://github.com/videojs/v10/issues/2154)) ([940037e](https://github.com/videojs/v10/commit/940037e11a45a25ec282d1734e43c33bc6fb355d))
* **packages:** rename SimpleHls* to Hls* (video + audio) ([#2096](https://github.com/videojs/v10/issues/2096)) ([f1c22a5](https://github.com/videojs/v10/commit/f1c22a5bbfd90e3ce219b8ac5de441c8fba60b8d))
* **packages:** rename the SPF background-video Media to hls-background-video ([#2097](https://github.com/videojs/v10/issues/2097)) ([729261a](https://github.com/videojs/v10/commit/729261abbfa1cbc9ac882cd8a2f4456b14e685a3))
* **packages:** restructure media source, engine, and Mux image APIs ([#1903](https://github.com/videojs/v10/issues/1903)) ([99180ff](https://github.com/videojs/v10/commit/99180ff4d5eee9ff9cc3982217fb21877c2e3fd7))
* **packages:** separate input indicator components ([#2046](https://github.com/videojs/v10/issues/2046)) ([5bdb870](https://github.com/videojs/v10/commit/5bdb87088e6c60b1a4e6838ea38944a7cf125d12))
* **packages:** simplify menus ([#2029](https://github.com/videojs/v10/issues/2029)) ([cf23269](https://github.com/videojs/v10/commit/cf23269f87250d7a2deadee5dad58b935f5e8c0f))
* **skin:** css clean up and API stabilization ([#2094](https://github.com/videojs/v10/issues/2094)) ([39a0291](https://github.com/videojs/v10/commit/39a0291be7cad177e09bf7b4c8e74592a17b3744))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.27
    * @videojs/element bumped to 10.0.0-beta.27
    * @videojs/media bumped to 10.0.0-beta.27
    * @videojs/spf bumped to 10.0.0-beta.27
    * @videojs/store bumped to 10.0.0-beta.27
    * @videojs/utils bumped to 10.0.0-beta.27
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.27
    * @videojs/skins bumped to 10.0.0-beta.27

## [10.0.0-beta.26](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.25...@videojs/html@10.0.0-beta.26) (2026-08-02)


### ⚠ BREAKING CHANGES

* **packages:** replace button availability with disabled and hidden state ([#1474](https://github.com/videojs/v10/issues/1474))
* **packages:** support media components as markup ([#1883](https://github.com/videojs/v10/issues/1883))
* **media:** extract media package from core ([#1879](https://github.com/videojs/v10/issues/1879))

### Features

* **core:** add status announcer state updates ([#1659](https://github.com/videojs/v10/issues/1659)) ([a5e7339](https://github.com/videojs/v10/commit/a5e73393fef381af7e148178822d5c3d94739834))
* **i18n:** convert to opaque keys ([#1848](https://github.com/videojs/v10/issues/1848)) ([a3e673b](https://github.com/videojs/v10/commit/a3e673bd6854e006f4ae36e3ebfbfd6c6120e197))
* **packages:** add flip functionality to popovers/tooltips/menus ([#1857](https://github.com/videojs/v10/issues/1857)) ([be89470](https://github.com/videojs/v10/commit/be89470447e84bb654cd17be7f4d4f6cec767e4f))
* **packages:** add mux media with src parsing, structured source, and storyboards ([#1850](https://github.com/videojs/v10/issues/1850)) ([409e7ef](https://github.com/videojs/v10/commit/409e7ef225c7abb79a49c8b1adcc8c6ed0242cf6))
* **packages:** i18n ([#1708](https://github.com/videojs/v10/issues/1708)) ([028dadb](https://github.com/videojs/v10/commit/028dadb385eb4f879f80932a4002676dc11d5300))
* **packages:** support media components as markup ([#1883](https://github.com/videojs/v10/issues/1883)) ([68e9607](https://github.com/videojs/v10/commit/68e96079e5264cdb59633f47b543cc21f06a6dba))
* **skin:** improved responsive design ([#1832](https://github.com/videojs/v10/issues/1832)) ([c8a9eec](https://github.com/videojs/v10/commit/c8a9eecaf89139bd80965f39052c1483b910d6bc))


### Bug Fixes

* **html:** register tooltip label and shortcut in live presets ([#1881](https://github.com/videojs/v10/issues/1881)) ([fa54f75](https://github.com/videojs/v10/commit/fa54f75d38175c8683a3e0e04d2661c2bf705fa3))
* **i18n:** error text updates ([#1822](https://github.com/videojs/v10/issues/1822)) ([82b9e43](https://github.com/videojs/v10/commit/82b9e43bb5fee613031f653b575df015d6187d6f))
* **packages:** prevent controls click triggering interactions ([#1885](https://github.com/videojs/v10/issues/1885)) ([0f4a9b4](https://github.com/videojs/v10/commit/0f4a9b4127d3fbb59b11e278af70c23f83f51c6f))
* **test:** remove seek tests, add missing tests ([#1892](https://github.com/videojs/v10/issues/1892)) ([115229b](https://github.com/videojs/v10/commit/115229b3bca742834dbd412af1e9722e2ed3dd5f))


### Code Refactoring

* **media:** extract media package from core ([#1879](https://github.com/videojs/v10/issues/1879)) ([75dcc66](https://github.com/videojs/v10/commit/75dcc6675bd19e9be05c4e295830c80c0ca2180f))
* **packages:** replace button availability with disabled and hidden state ([#1474](https://github.com/videojs/v10/issues/1474)) ([066227d](https://github.com/videojs/v10/commit/066227de5819570a339fd0e291fc236c51632017))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.26
    * @videojs/element bumped to 10.0.0-beta.26
    * @videojs/media bumped to 10.0.0-beta.26
    * @videojs/spf bumped to 10.0.0-beta.26
    * @videojs/store bumped to 10.0.0-beta.26
    * @videojs/utils bumped to 10.0.0-beta.26
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.26
    * @videojs/skins bumped to 10.0.0-beta.26

## [10.0.0-beta.25](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.24...@videojs/html@10.0.0-beta.25) (2026-07-07)


### ⚠ BREAKING CHANGES

* **packages:** rename hls media stack to hlsjs naming ([#1753](https://github.com/videojs/v10/issues/1753))
* **core:** move media capability predicates to core layer ([#1705](https://github.com/videojs/v10/issues/1705))
* **media:** add Google Cast by default to HLS, DASH media ([#1661](https://github.com/videojs/v10/issues/1661))

### Features

* **core:** add built-in locale packs and lazy loadLocale ([#1590](https://github.com/videojs/v10/issues/1590)) ([9170a58](https://github.com/videojs/v10/commit/9170a5879e5a41089d575e41dc4eca7bf9677b65))
* **core:** add i18n foundation with English locale and UI wiring ([#1589](https://github.com/videojs/v10/issues/1589)) ([768bf09](https://github.com/videojs/v10/commit/768bf09da07a728874da232c7cdefb653534e078))
* **core:** add media tracks and renditions support ([#1664](https://github.com/videojs/v10/issues/1664)) ([67b39fe](https://github.com/videojs/v10/commit/67b39fe4bd44a557ce45884b1d84b0a0d62592e3))
* **core:** add vimeo media host and html/react components ([#1667](https://github.com/videojs/v10/issues/1667)) ([1b31f3e](https://github.com/videojs/v10/commit/1b31f3e8d7ecef111b84dbd3f9053efc626f256d))
* **core:** lock fullscreen orientation ([#1656](https://github.com/videojs/v10/issues/1656)) ([62d0524](https://github.com/videojs/v10/commit/62d0524b83bcf37157ef806dd141723ece2f5168))
* **media:** add Google Cast by default to HLS, DASH media ([#1661](https://github.com/videojs/v10/issues/1661)) ([0ffe1a9](https://github.com/videojs/v10/commit/0ffe1a91979ddd53b8f5339765b8c086da7bcc1e))
* **packages:** add audio tracks menu ([#1714](https://github.com/videojs/v10/issues/1714)) ([5d44c4d](https://github.com/videojs/v10/commit/5d44c4debf7a2ca50f6f0519e5cd3ff040bcc933))
* **packages:** add pauseOnDrag to time slider ([#1596](https://github.com/videojs/v10/issues/1596)) ([131e176](https://github.com/videojs/v10/commit/131e176ddef6e94dc04d2176fb90276db6744706))
* **packages:** add poster placeholder blur-up pattern ([#1632](https://github.com/videojs/v10/issues/1632)) ([0742851](https://github.com/videojs/v10/commit/07428519a5a183061a2be561bb63ecdb7e15907b))
* **packages:** add quality menu UI ([#1694](https://github.com/videojs/v10/issues/1694)) ([16ab909](https://github.com/videojs/v10/commit/16ab90987ac1629735310649faca62ad36d61526))
* **packages:** add resolved rendition to auto label ([#1698](https://github.com/videojs/v10/issues/1698)) ([9275f93](https://github.com/videojs/v10/commit/9275f93504c87a9423e78fdc6113695de0307009))
* **packages:** add settings menu ([#1615](https://github.com/videojs/v10/issues/1615)) ([00b6f0b](https://github.com/videojs/v10/commit/00b6f0be1d89f7c4c001a539ee2962888448c8c4))
* **packages:** add time display toggle ([#1669](https://github.com/videojs/v10/issues/1669)) ([be4d5a1](https://github.com/videojs/v10/commit/be4d5a11550d6cc599a7ac491a9422ee923511b4))
* **packages:** airplay button ([#1531](https://github.com/videojs/v10/issues/1531)) ([338020e](https://github.com/videojs/v10/commit/338020e1d5a2289f50f92237ff9e8db0457682e4))
* **packages:** compound tooltips with label and shortcut parts ([#1494](https://github.com/videojs/v10/issues/1494)) ([035b509](https://github.com/videojs/v10/commit/035b509c7a77e74153ea5b36536fce424ce27d2d))
* **packages:** update menu group labels ([#1643](https://github.com/videojs/v10/issues/1643)) ([c5f7516](https://github.com/videojs/v10/commit/c5f75166fd9e97cdec32335ae90bde46262d9465))
* **skin:** show scrubber preview timestamps ([#1652](https://github.com/videojs/v10/issues/1652)) ([7453d53](https://github.com/videojs/v10/commit/7453d538a8d25e56fd288ef64fc0af901250e459))
* **spf:** basic audio only use case + use-case-composition doc-type + implementation skills ([#1584](https://github.com/videojs/v10/issues/1584)) ([1a3cb45](https://github.com/videojs/v10/commit/1a3cb45b292aad421fb7429451de59ef41a0a07b))


### Bug Fixes

* **html:** avoid menu item value render loop ([#1791](https://github.com/videojs/v10/issues/1791)) ([47e74a1](https://github.com/videojs/v10/commit/47e74a139e62e17e8151ff889c90a5a8497a6dcc))
* **packages:** escape HTML special chars in serializeAttributes to prevent XSS ([#1670](https://github.com/videojs/v10/issues/1670)) ([accf4bf](https://github.com/videojs/v10/commit/accf4bfa34f89a8ed90bd005a414507ad1491f43))
* **packages:** fix ejected skin slider setup ([#1660](https://github.com/videojs/v10/issues/1660)) ([3d2225e](https://github.com/videojs/v10/commit/3d2225e77e95b9edeefbeab24da67eebd7f94dd3))
* **packages:** handle menu child mutations ([#1739](https://github.com/videojs/v10/issues/1739)) ([9ab7ade](https://github.com/videojs/v10/commit/9ab7adefb729a4a3c5f5285436d532cf6b0532b4))
* **packages:** scope menu data attributes ([#1628](https://github.com/videojs/v10/issues/1628)) ([01a2115](https://github.com/videojs/v10/commit/01a2115aabe201d8aa293a4ad30badd7e1b69666))
* **skin:** aspect ratio related fixes ([#1726](https://github.com/videojs/v10/issues/1726)) ([a6d30a9](https://github.com/videojs/v10/commit/a6d30a9e6176bf806aa1ea02e36578758e3eee49))
* **skin:** improve buffering, overlays, and input feedback ([#1547](https://github.com/videojs/v10/issues/1547)) ([0de3fef](https://github.com/videojs/v10/commit/0de3fef878fcb9f8167776a2c1011d134989da93))
* **skin:** improvements to menu styles ([#1725](https://github.com/videojs/v10/issues/1725)) ([f3652bd](https://github.com/videojs/v10/commit/f3652bd90be293268449295f96439a465b7a1bc3))


### Reverts

* **core:** unmerge i18n stack base ([#1707](https://github.com/videojs/v10/issues/1707)) ([edfec1c](https://github.com/videojs/v10/commit/edfec1c93ef656c9b2ac105c9b1e1042d17cf956))


### Code Refactoring

* **core:** move media capability predicates to core layer ([#1705](https://github.com/videojs/v10/issues/1705)) ([f0f9eed](https://github.com/videojs/v10/commit/f0f9eed544e668c67fbeb80aff39e818e905c3e9))
* **packages:** rename hls media stack to hlsjs naming ([#1753](https://github.com/videojs/v10/issues/1753)) ([d321522](https://github.com/videojs/v10/commit/d321522cf0d8421a6ecec0f170b1ee88b4953139))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.25
    * @videojs/element bumped to 10.0.0-beta.25
    * @videojs/spf bumped to 10.0.0-beta.25
    * @videojs/store bumped to 10.0.0-beta.25
    * @videojs/utils bumped to 10.0.0-beta.25
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.25
    * @videojs/skins bumped to 10.0.0-beta.25

## [10.0.0-beta.24](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.23...@videojs/html@10.0.0-beta.24) (2026-05-19)


### Features

* **core:** menu core layer and DOM keyboard navigation ([#1503](https://github.com/videojs/v10/issues/1503)) ([e3c1b28](https://github.com/videojs/v10/commit/e3c1b280325493909ef1da193855832b8c51fb48))
* **packages:** add live button component ([#1473](https://github.com/videojs/v10/issues/1473)) ([e37d5df](https://github.com/videojs/v10/commit/e37d5df87352088a9287bd46b14759965c154b76))
* **packages:** add playback rate menu ([#1527](https://github.com/videojs/v10/issues/1527)) ([ad831d2](https://github.com/videojs/v10/commit/ad831d25f00187929e6eed93770422fa7003071c))
* **packages:** add UI support for gestures and hotkeys ([#1388](https://github.com/videojs/v10/issues/1388)) ([0620814](https://github.com/videojs/v10/commit/0620814a6726da5705b28b1e576dfa3a49b92108))
* **packages:** ship bundled markdown docs in html and react tarballs ([#1560](https://github.com/videojs/v10/issues/1560)) ([20e77d3](https://github.com/videojs/v10/commit/20e77d37fa458c52eb6b14269fd8582bee72281a))


### Bug Fixes

* **ci:** use biome to sort CSS properties ([#1490](https://github.com/videojs/v10/issues/1490)) ([8e2b7e4](https://github.com/videojs/v10/commit/8e2b7e4f6d20a0b4f780c34ec2670ec1f9bd25e6))
* **html:** set min dimensions on background-video host ([#1523](https://github.com/videojs/v10/issues/1523)) ([a1e37dd](https://github.com/videojs/v10/commit/a1e37dd66f0403fae64b751242747312ec5df9ad))
* **icons:** use icon exports in ejected skins ([#1489](https://github.com/videojs/v10/issues/1489)) ([d0b36ed](https://github.com/videojs/v10/commit/d0b36ed5b80f9614687d0dd584232cf74d4fb3ca))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.24
    * @videojs/element bumped to 10.0.0-beta.24
    * @videojs/spf bumped to 10.0.0-beta.24
    * @videojs/store bumped to 10.0.0-beta.24
    * @videojs/utils bumped to 10.0.0-beta.24
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.24
    * @videojs/skins bumped to 10.0.0-beta.24

## [10.0.0-beta.23](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.22...@videojs/html@10.0.0-beta.23) (2026-04-27)


### ⚠ BREAKING CHANGES

* **packages:** rename cast to google-cast and remote-playback ([#1380](https://github.com/videojs/v10/issues/1380))

### Features

* **html:** observe cast attributes on mux elements ([#1386](https://github.com/videojs/v10/issues/1386)) ([76a1e4a](https://github.com/videojs/v10/commit/76a1e4a8c9b85151070b3b10c87692131b529c92))
* **html:** re-export reactive primitives from @videojs/element ([#1472](https://github.com/videojs/v10/issues/1472)) ([466abb6](https://github.com/videojs/v10/commit/466abb6d200b790d9de64be0e0c87c56d60e64a5))
* **packages:** add live-video and live-audio presets ([#1399](https://github.com/videojs/v10/issues/1399)) ([d9c0049](https://github.com/videojs/v10/commit/d9c00491e7984aeaa01eec2d4450ac148129c205))


### Bug Fixes

* **html:** raise testTimeout to 15s for parallel-load reliability ([#1448](https://github.com/videojs/v10/issues/1448)) ([b934937](https://github.com/videojs/v10/commit/b9349375cbcd8436173afc0d6a03cab182829718))


### Code Refactoring

* **packages:** rename cast to google-cast and remote-playback ([#1380](https://github.com/videojs/v10/issues/1380)) ([413874c](https://github.com/videojs/v10/commit/413874c1e079ccfa43067180161fe86c78b185bd))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.23
    * @videojs/element bumped to 10.0.0-beta.23
    * @videojs/spf bumped to 10.0.0-beta.23
    * @videojs/store bumped to 10.0.0-beta.23
    * @videojs/utils bumped to 10.0.0-beta.23
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.23
    * @videojs/skins bumped to 10.0.0-beta.23

## [10.0.0-beta.22](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.21...@videojs/html@10.0.0-beta.22) (2026-04-18)


### Features

* **packages:** add chromecast support via remote playback API ([#1348](https://github.com/videojs/v10/issues/1348)) ([31a005e](https://github.com/videojs/v10/commit/31a005eeef4cee496c15f6f6be0129ef0006a5a8))


### Bug Fixes

* **packages:** add server-only bundles  ([#1349](https://github.com/videojs/v10/issues/1349)) ([3331fda](https://github.com/videojs/v10/commit/3331fdaf25c8a89ea6d36c2972631df589fc0ad3))


### Reverts

* **packages:** add server-only bundles ([#1349](https://github.com/videojs/v10/issues/1349)) ([#1354](https://github.com/videojs/v10/issues/1354)) ([8530316](https://github.com/videojs/v10/commit/8530316987b5122a2e455b0db3bad6fd3ffa8186))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.22
    * @videojs/element bumped to 10.0.0-beta.22
    * @videojs/spf bumped to 10.0.0-beta.22
    * @videojs/store bumped to 10.0.0-beta.22
    * @videojs/utils bumped to 10.0.0-beta.22
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.22
    * @videojs/skins bumped to 10.0.0-beta.22

## [10.0.0-beta.21](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.20...@videojs/html@10.0.0-beta.21) (2026-04-14)


### Features

* **site:** feature and preset reference UI + docs integration ([#1258](https://github.com/videojs/v10/issues/1258)) ([d4b805e](https://github.com/videojs/v10/commit/d4b805ea699bd33234c817a7519ff9efbd4753fd))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.21
    * @videojs/element bumped to 10.0.0-beta.21
    * @videojs/spf bumped to 10.0.0-beta.21
    * @videojs/store bumped to 10.0.0-beta.21
    * @videojs/utils bumped to 10.0.0-beta.21
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.21
    * @videojs/skins bumped to 10.0.0-beta.21

## [10.0.0-beta.20](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.19...@videojs/html@10.0.0-beta.20) (2026-04-14)


### Miscellaneous Chores

* **@videojs/html:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.20
    * @videojs/element bumped to 10.0.0-beta.20
    * @videojs/spf bumped to 10.0.0-beta.20
    * @videojs/store bumped to 10.0.0-beta.20
    * @videojs/utils bumped to 10.0.0-beta.20
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.20
    * @videojs/skins bumped to 10.0.0-beta.20

## [10.0.0-beta.19](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.18...@videojs/html@10.0.0-beta.19) (2026-04-14)


### Miscellaneous Chores

* **@videojs/html:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.19
    * @videojs/element bumped to 10.0.0-beta.19
    * @videojs/spf bumped to 10.0.0-beta.19
    * @videojs/store bumped to 10.0.0-beta.19
    * @videojs/utils bumped to 10.0.0-beta.19
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.19
    * @videojs/skins bumped to 10.0.0-beta.19

## [10.0.0-beta.18](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.17...@videojs/html@10.0.0-beta.18) (2026-04-14)


### ⚠ BREAKING CHANGES

* **packages:** replace DelegateMixin & ProxyMixin with MediaHost base classes ([#1292](https://github.com/videojs/v10/issues/1292))

### Features

* add background video components ([#567](https://github.com/videojs/v10/issues/567)) ([fd14f0c](https://github.com/videojs/v10/commit/fd14f0cb17c2fd1752c82d29252296492ed1568f))
* add background video preset ([#607](https://github.com/videojs/v10/issues/607)) ([c2bc488](https://github.com/videojs/v10/commit/c2bc488366fd28f9a6d00dd28a4f790b5e1400ed))
* add DashVideo media element (html, react) with sandbox support ([#940](https://github.com/videojs/v10/issues/940)) ([5bdbbec](https://github.com/videojs/v10/commit/5bdbbec8a0f69b4be89600287c63a04746b7ba49))
* add media API + HLS video components ([#507](https://github.com/videojs/v10/issues/507)) ([b3a31a3](https://github.com/videojs/v10/commit/b3a31a335a363d3a96b510206b57d1bb9ebb8edd))
* add media delegate mixin ([#598](https://github.com/videojs/v10/issues/598)) ([c4ef94e](https://github.com/videojs/v10/commit/c4ef94e82301be6705002d0a7d7c65463ece1045))
* add Mux video component ([#1036](https://github.com/videojs/v10/issues/1036)) ([271a8c8](https://github.com/videojs/v10/commit/271a8c850216bd1654baaa26f8bb2f5eda56be37))
* add native hls media + refactor ([#1154](https://github.com/videojs/v10/issues/1154)) ([1b2afc6](https://github.com/videojs/v10/commit/1b2afc6e41a4a8bb4f3ea42b5c04c6232813727e))
* add slider preview thumbnails ([#935](https://github.com/videojs/v10/issues/935)) ([e3f438e](https://github.com/videojs/v10/commit/e3f438e9f488f41c8cf51c95507bc41fc5b524d0))
* add subtitles handling + captions core ([#692](https://github.com/videojs/v10/issues/692)) ([5c11606](https://github.com/videojs/v10/commit/5c116065a91ed04753bb2cb83e72dd6471f75ced))
* **core:** add buffering indicator component ([#527](https://github.com/videojs/v10/issues/527)) ([aa0fb7c](https://github.com/videojs/v10/commit/aa0fb7ca704843dd6ac8b0b18d9e35f8f430311e))
* **core:** add controls component with activity tracking ([#514](https://github.com/videojs/v10/issues/514)) ([90d881c](https://github.com/videojs/v10/commit/90d881cec21d7f5e1e619061727e6c8d1ff48296))
* **core:** add pip button component ([#525](https://github.com/videojs/v10/issues/525)) ([2c8b77a](https://github.com/videojs/v10/commit/2c8b77af4547b0a8af27abcc419f7d4dff3b005a))
* **core:** add poster component ([#457](https://github.com/videojs/v10/issues/457)) ([c9ba1e1](https://github.com/videojs/v10/commit/c9ba1e1bfc83e02981a2ffad0a0f247092068687))
* **core:** add seek button component ([#526](https://github.com/videojs/v10/issues/526)) ([c733077](https://github.com/videojs/v10/commit/c733077d324b3cd40eab7c0e33f1f73592609515))
* **element:** add lightweight reactive element base ([#513](https://github.com/videojs/v10/issues/513)) ([33b2190](https://github.com/videojs/v10/commit/33b21906cd3b55ac059633f3cfebbb070ffa9a11))
* **html:** add `<media-gesture>` element ([#1305](https://github.com/videojs/v10/issues/1305)) ([d2782f0](https://github.com/videojs/v10/commit/d2782f0c8d3e927fc2144a5286f4bc795a2ed4ac))
* **html:** add alert dialog element ([#741](https://github.com/videojs/v10/issues/741)) ([5fc52aa](https://github.com/videojs/v10/commit/5fc52aa969292a8b8f636b532ac5ff27b082b222))
* **html:** add CDN bundles and inline template minification ([#827](https://github.com/videojs/v10/issues/827)) ([40807b2](https://github.com/videojs/v10/commit/40807b2e3ace6fe81512fb899a18d901765811d4))
* **html:** add data-availability to volume slider ([#1001](https://github.com/videojs/v10/issues/1001)) ([c95e134](https://github.com/videojs/v10/commit/c95e1343e16c8667f6b7f5560d12ec5f36f1acd8))
* **html:** add hotkeys ([#1239](https://github.com/videojs/v10/issues/1239)) ([d9d893b](https://github.com/videojs/v10/commit/d9d893b726e461721e73eeba9377c9d381de8951))
* **html:** add native hls video to cdn ([#1208](https://github.com/videojs/v10/issues/1208)) ([80c43d2](https://github.com/videojs/v10/commit/80c43d2c187c6062c088993f0d1b48c5e117a715))
* **html:** add popover element ([#652](https://github.com/videojs/v10/issues/652)) ([bebd03f](https://github.com/videojs/v10/commit/bebd03ff2b533c590c679088a16ae1898b575919))
* **html:** add slider element ([#655](https://github.com/videojs/v10/issues/655)) ([d5df015](https://github.com/videojs/v10/commit/d5df0150b3aef21c15d3a65c015bb6058e95ce53))
* **html:** add slider preview element ([#733](https://github.com/videojs/v10/issues/733)) ([7548a8e](https://github.com/videojs/v10/commit/7548a8e4a1cc87e1a702ef24d5559427f26e91ef))
* **html:** add slider thumbnail element ([#714](https://github.com/videojs/v10/issues/714)) ([32ee304](https://github.com/videojs/v10/commit/32ee304da4893f0c9271a25cf3fc81b84fccc399))
* **html:** add thumbnail element ([#646](https://github.com/videojs/v10/issues/646)) ([8457b12](https://github.com/videojs/v10/commit/8457b1241c0c382abb6efd70f125081413df8a93))
* **html:** add time slider element ([#656](https://github.com/videojs/v10/issues/656)) ([26c7395](https://github.com/videojs/v10/commit/26c7395cd0fe7e2fe8a8020ffae40cf81ffb3974))
* **html:** add tooltip element ([#735](https://github.com/videojs/v10/issues/735)) ([e9fbaec](https://github.com/videojs/v10/commit/e9fbaece87c39c0adc41070159fd7e6f75f0e1da))
* **html:** add ui bundles for eject ([#1206](https://github.com/videojs/v10/issues/1206)) ([0ed7bf0](https://github.com/videojs/v10/commit/0ed7bf0653b373a353c039fac1aa2bca4fa2973e))
* **html:** add volume slider element ([#657](https://github.com/videojs/v10/issues/657)) ([92b7c2a](https://github.com/videojs/v10/commit/92b7c2ac184d12c780ba1a1bb6f064782b77422a))
* **html:** refactor attach contexts to carry state and setter ([#1024](https://github.com/videojs/v10/issues/1024)) ([c07da27](https://github.com/videojs/v10/commit/c07da27ead58f2d08b93036af49515800c944f16))
* **html:** reorganize import paths by use case ([#480](https://github.com/videojs/v10/issues/480)) ([870cbb7](https://github.com/videojs/v10/commit/870cbb77e4ac45d179d8702d0e08c58face8a2fc))
* **packages:** add gesture bindings to default skins and presets ([#1310](https://github.com/videojs/v10/issues/1310)) ([1509a66](https://github.com/videojs/v10/commit/1509a66f60fc0598452f21af396c4b6f3569be5b))
* **packages:** add hotkey bindings to preset skins ([#1264](https://github.com/videojs/v10/issues/1264)) ([9912a8e](https://github.com/videojs/v10/commit/9912a8e7593dc9f26c6dfe5cd8ddca34ef89a8ef))
* **packages:** add mux-audio element and react component ([#1259](https://github.com/videojs/v10/issues/1259)) ([9fac0fc](https://github.com/videojs/v10/commit/9fac0fca3d5af44c76c9845da37b5197dd8538df))
* **packages:** add PlaybackRateButton to core, html, and react ([#642](https://github.com/videojs/v10/issues/642)) ([0180828](https://github.com/videojs/v10/commit/0180828df91ad74f885906223fa7d359f1a2641a))
* **packages:** add poster component to video skins ([#994](https://github.com/videojs/v10/issues/994)) ([59bbf6c](https://github.com/videojs/v10/commit/59bbf6c20924ec04e559fe23cbc1a0ad8c8ca080))
* **packages:** error dialog component ([#1077](https://github.com/videojs/v10/issues/1077)) ([3430fe1](https://github.com/videojs/v10/commit/3430fe1a493e4bee34f03112206a0cb3cf9d88cf))
* **packages:** export media component building blocks ([#1098](https://github.com/videojs/v10/issues/1098)) ([bc2929e](https://github.com/videojs/v10/commit/bc2929ef4fc7ed021c91d96b96498870ecf5e4e5))
* **packages:** volume slider scroll support ([#1175](https://github.com/videojs/v10/issues/1175)) ([390b004](https://github.com/videojs/v10/commit/390b004d809272fd453b8a73e1969c59410c3620))
* **react:** add popover component ([#653](https://github.com/videojs/v10/issues/653)) ([ed43d52](https://github.com/videojs/v10/commit/ed43d52f8fa347acb9dd62f8458a8324e3506fd1))
* **site:** add util reference pipeline ([#537](https://github.com/videojs/v10/issues/537)) ([78112fb](https://github.com/videojs/v10/commit/78112fbefdaace678a2d1335409e40533f3819fa))
* **skin:** add audio skins for HTML and React presets ([#772](https://github.com/videojs/v10/issues/772)) ([d751fda](https://github.com/videojs/v10/commit/d751fdabea9782b9f6c73aaebfb93ed393e488f7))
* **skin:** add error handling for audio players ([#1048](https://github.com/videojs/v10/issues/1048)) ([df927f6](https://github.com/videojs/v10/commit/df927f67fcbd0aaa229b1a8e205ab3cb08f7a42d))
* **skin:** add pip-enter and pip-exit icons ([#1015](https://github.com/videojs/v10/issues/1015)) ([81781ca](https://github.com/videojs/v10/commit/81781ca5854f4943b533073b1875b127308a5419))
* **skin:** implement default and minimal skins for HTML player ([#698](https://github.com/videojs/v10/issues/698)) ([c5cafae](https://github.com/videojs/v10/commit/c5cafae57ff34d13f79d11862b82f10414bdcd40))
* **skin:** port tooltip styling from tech preview ([#800](https://github.com/videojs/v10/issues/800)) ([6b6566e](https://github.com/videojs/v10/commit/6b6566e2540b4ad9fcd9b2a8e6c767f5f7e4072f))
* small state and naming fixes  ([#719](https://github.com/videojs/v10/issues/719)) ([5c42245](https://github.com/videojs/v10/commit/5c422452e4b547dc00f13082b755ea12d1860f21))
* **spf:** initial push of SPF ([#784](https://github.com/videojs/v10/issues/784)) ([27a3993](https://github.com/videojs/v10/commit/27a3993fb20af0523e42b0d03c70a6f5a465d144))


### Bug Fixes

* attaching media like elements and upgrade ([#889](https://github.com/videojs/v10/issues/889)) ([2105010](https://github.com/videojs/v10/commit/2105010c7f1f525ab89cc30506219a5dd49a64a7))
* **cd:** add repository field to all packages for provenance verification ([b723589](https://github.com/videojs/v10/commit/b72358904a78a9403df16d77936d4a1f41a64bfe))
* **core:** allow undefined hotkey options  ([#1242](https://github.com/videojs/v10/issues/1242)) ([d2c43db](https://github.com/videojs/v10/commit/d2c43db5506847f941260fd41cde2ecd33b74277))
* **core:** prevent slider thumb jump on pointer release ([#990](https://github.com/videojs/v10/issues/990)) ([b9bada9](https://github.com/videojs/v10/commit/b9bada95675f09b7c7d6859dcd213be7a0408bb7))
* **core:** skip delay when switching between grouped tooltips ([#903](https://github.com/videojs/v10/issues/903)) ([ff8fb3f](https://github.com/videojs/v10/commit/ff8fb3fd36b0eeda9d2d861c83d4db51f60650a0))
* correct popup fallback positioning offsets ([#981](https://github.com/videojs/v10/issues/981)) ([82ede77](https://github.com/videojs/v10/commit/82ede77322204500d7ca0adc5cb24d4f068af462))
* delegate not defining Delegate props ([#751](https://github.com/videojs/v10/issues/751)) ([c61fcdc](https://github.com/videojs/v10/commit/c61fcdcc3a64f8a4ef32ec3fd332f1ec5cdbb311))
* destroy hls.js instance on media unmount ([#749](https://github.com/videojs/v10/issues/749)) ([c4e8bbd](https://github.com/videojs/v10/commit/c4e8bbd3a2bcb66027c64faf8de0ec61d22c84fa))
* **html,react:** move @videojs/skins to devDependencies ([#716](https://github.com/videojs/v10/issues/716)) ([55b49ef](https://github.com/videojs/v10/commit/55b49efd82281815abe1e26eb764dfe914bb8208))
* **html:** add destroy ([#748](https://github.com/videojs/v10/issues/748)) ([3f11424](https://github.com/videojs/v10/commit/3f11424b182f9889a572590e38219e6289f544c2))
* **html:** add destroy guards to connectedCallback ([#1284](https://github.com/videojs/v10/issues/1284)) ([53fffe8](https://github.com/videojs/v10/commit/53fffe8e308b2f384460342e382a33f6319565f0))
* **html:** apply popover data attributes before showing via popover API ([#763](https://github.com/videojs/v10/issues/763)) ([206bc9b](https://github.com/videojs/v10/commit/206bc9b4ae914176e50c1708c272c75d90a12286))
* **html:** create HotkeyRegistryController once in connectedCallback ([#1240](https://github.com/videojs/v10/issues/1240)) ([7c63d82](https://github.com/videojs/v10/commit/7c63d82f84dd224a5b13436e2edbfca51ca56cc0))
* **html:** discover media elements and attach store target via DOM ([#481](https://github.com/videojs/v10/issues/481)) ([5eab1db](https://github.com/videojs/v10/commit/5eab1dbb2fbb906543f7749e5956c9791c30be34))
* **html:** export SliderPreviewElement and ContextPartElement ([#1283](https://github.com/videojs/v10/issues/1283)) ([0dc7567](https://github.com/videojs/v10/commit/0dc7567e7a2beabc34ae85e277026e886afde7b0))
* **html:** extended media not working over cdn ([#1019](https://github.com/videojs/v10/issues/1019)) ([cc04cc9](https://github.com/videojs/v10/commit/cc04cc99a594cdace44b258980200241ec419c27))
* **html:** fix html container sizing ([#881](https://github.com/videojs/v10/issues/881)) ([abf8753](https://github.com/videojs/v10/commit/abf8753fe61430122c9d3df40e559ecff3aef3c3))
* **html:** HTML SSR safety and sandbox skin chunking ([#1155](https://github.com/videojs/v10/issues/1155)) ([0433722](https://github.com/videojs/v10/commit/0433722ee4b725af213648d589fef80c7e4001a0))
* **html:** include base and shared styles in ejected skin CSS ([#1196](https://github.com/videojs/v10/issues/1196)) ([341b405](https://github.com/videojs/v10/commit/341b405a21d9ee3c58cab4ca3d27fa376917f7b7))
* **html:** move @videojs/icons to devDependencies ([#712](https://github.com/videojs/v10/issues/712)) ([391cf5e](https://github.com/videojs/v10/commit/391cf5e42b93e46386169a010b250704e4d23117))
* **html:** move TimeElement child creation from constructor to connectedCallback ([#1209](https://github.com/videojs/v10/issues/1209)) ([4ee55c0](https://github.com/videojs/v10/commit/4ee55c08bdadc292175c7586ef899fc53b543e49))
* **html:** prevent tsdown from stripping custom element registrations ([#703](https://github.com/videojs/v10/issues/703)) ([9a5dfab](https://github.com/videojs/v10/commit/9a5dfab4e8d0e095ea08e8a46973ad57cb1b6820))
* **html:** remove commented error dialog blocks from video skins ([#865](https://github.com/videojs/v10/issues/865)) ([669694a](https://github.com/videojs/v10/commit/669694ab20342f3722a1c168fb1adc0e102f696d))
* **html:** remove redundant CDN CSS files and inline background skin styles ([#1071](https://github.com/videojs/v10/issues/1071)) ([335bda5](https://github.com/videojs/v10/commit/335bda5646ba47eb3e4d9df93a7907c6a7a73800))
* **html:** replace bare side-effect imports with explicit safeDefine() in define modules ([#1307](https://github.com/videojs/v10/issues/1307)) ([ab338c4](https://github.com/videojs/v10/commit/ab338c432b8c548d043b8e5880d00edae83fc310))
* **html:** restore deprecated slot="media" for backwards compatibility ([#1020](https://github.com/videojs/v10/issues/1020)) ([eabd065](https://github.com/videojs/v10/commit/eabd06550d4cc10b896eadcb59d3f070e258d78d))
* **html:** simplify styles for slotted video ([#953](https://github.com/videojs/v10/issues/953)) ([d6e471a](https://github.com/videojs/v10/commit/d6e471a8377e9ee8ef63df9097810c6d0c1bb2f9))
* **html:** slider interaction and edge alignment broken ([#721](https://github.com/videojs/v10/issues/721)) ([ff12296](https://github.com/videojs/v10/commit/ff122963553e23a58614c9c808763208fd893df1))
* **html:** thumb edge alignment jump ([#766](https://github.com/videojs/v10/issues/766)) ([d53e239](https://github.com/videojs/v10/commit/d53e239b7b59ad0d86ef961e19342c80568fe02d))
* **packages:** enable unbundle mode to avoid mangled exports ([00fdf96](https://github.com/videojs/v10/commit/00fdf966ca5148bcca303058dd798b1b880896e0))
* **packages:** make tooltips visual-only and auto-forward media button labels ([#1174](https://github.com/videojs/v10/issues/1174)) ([86cf3e8](https://github.com/videojs/v10/commit/86cf3e8977719fbbdcd59244a543fdd8412c4484))
* **packages:** remove redundant "Shift" modifier from playback rate hotkeys ([#1290](https://github.com/videojs/v10/issues/1290)) ([a0fd3cb](https://github.com/videojs/v10/commit/a0fd3cbda8101f47806e0e71c727fbf483a1de66))
* **packages:** set release-please manifest and package versions to beta.0 ([#850](https://github.com/videojs/v10/issues/850)) ([e085a0d](https://github.com/videojs/v10/commit/e085a0d73af0c142e0c0a371337daae98fdbaac9))
* **packages:** time slider seek improvements ([#1291](https://github.com/videojs/v10/issues/1291)) ([b934c58](https://github.com/videojs/v10/commit/b934c589f824b0ed7338b19c2b3bad3160742e74))
* **packages:** update package READMEs for beta ([#848](https://github.com/videojs/v10/issues/848)) ([9562a0e](https://github.com/videojs/v10/commit/9562a0ecca212034759d7cc948d4b3f0bc7a19c3))
* **skin:** add missing tooltip provider/group ([#902](https://github.com/videojs/v10/issues/902)) ([1dbcd79](https://github.com/videojs/v10/commit/1dbcd79e541fce77021645d012fb3554d241b16b))
* **skin:** add subtle control transitions on touch devices ([#985](https://github.com/videojs/v10/issues/985)) ([7e0827c](https://github.com/videojs/v10/commit/7e0827c330dc796aa0375cd5839fc4fc1661f055))
* **skin:** bake in safari layout fix into skins ([#954](https://github.com/videojs/v10/issues/954)) ([177bd26](https://github.com/videojs/v10/commit/177bd26c1fae2ff436e614a87614841a07b836fd))
* **skin:** fix HTML skin poster image alignment ([#1002](https://github.com/videojs/v10/issues/1002)) ([6d76449](https://github.com/videojs/v10/commit/6d76449aea4b330a57965ea35580c8fe4db21b10))
* **skin:** hide volume popover when volume control is unsupported ([#1025](https://github.com/videojs/v10/issues/1025)) ([c09dbdd](https://github.com/videojs/v10/commit/c09dbdd121f2b8bb01e42d79350bf7a7acf09f28))
* **skin:** responsive design fixes and improvements ([#1129](https://github.com/videojs/v10/issues/1129)) ([1082693](https://github.com/videojs/v10/commit/10826932be7861ebf5df8c66db7811c0510339f4))
* **spf:** implement preload IDL attribute on SpfMedia ([#1069](https://github.com/videojs/v10/issues/1069)) ([04f81a2](https://github.com/videojs/v10/commit/04f81a26e13648ca414f2e51380c8786a06a7724))


### Reverts

* **html:** remove double raf hls destroy ([#754](https://github.com/videojs/v10/issues/754)) ([dce16ae](https://github.com/videojs/v10/commit/dce16ae5fd414563e6788b506e11bd1cff568870))


### Code Refactoring

* **packages:** replace DelegateMixin & ProxyMixin with MediaHost base classes ([#1292](https://github.com/videojs/v10/issues/1292)) ([8f1653e](https://github.com/videojs/v10/commit/8f1653efcd0a3a8cc75881bc6b4c0b87599a3b8d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.18
    * @videojs/element bumped to 10.0.0-beta.18
    * @videojs/spf bumped to 10.0.0-beta.18
    * @videojs/store bumped to 10.0.0-beta.18
    * @videojs/utils bumped to 10.0.0-beta.18
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.18
    * @videojs/skins bumped to 10.0.0-beta.18

## [10.0.0-beta.17](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.16...@videojs/html@10.0.0-beta.17) (2026-04-11)


### Features

* **html:** add `<media-gesture>` element ([#1305](https://github.com/videojs/v10/issues/1305)) ([d2782f0](https://github.com/videojs/v10/commit/d2782f0c8d3e927fc2144a5286f4bc795a2ed4ac))
* **packages:** add gesture bindings to default skins and presets ([#1310](https://github.com/videojs/v10/issues/1310)) ([1509a66](https://github.com/videojs/v10/commit/1509a66f60fc0598452f21af396c4b6f3569be5b))


### Bug Fixes

* **html:** replace bare side-effect imports with explicit safeDefine() in define modules ([#1307](https://github.com/videojs/v10/issues/1307)) ([ab338c4](https://github.com/videojs/v10/commit/ab338c432b8c548d043b8e5880d00edae83fc310))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.17
    * @videojs/element bumped to 10.0.0-beta.17
    * @videojs/spf bumped to 10.0.0-beta.17
    * @videojs/store bumped to 10.0.0-beta.17
    * @videojs/utils bumped to 10.0.0-beta.17
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.17
    * @videojs/skins bumped to 10.0.0-beta.17

## [10.0.0-beta.16](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.15...@videojs/html@10.0.0-beta.16) (2026-04-10)


### Features

* **html:** add hotkeys ([#1239](https://github.com/videojs/v10/issues/1239)) ([d9d893b](https://github.com/videojs/v10/commit/d9d893b726e461721e73eeba9377c9d381de8951))
* **packages:** add hotkey bindings to preset skins ([#1264](https://github.com/videojs/v10/issues/1264)) ([9912a8e](https://github.com/videojs/v10/commit/9912a8e7593dc9f26c6dfe5cd8ddca34ef89a8ef))
* **packages:** add mux-audio element and react component ([#1259](https://github.com/videojs/v10/issues/1259)) ([9fac0fc](https://github.com/videojs/v10/commit/9fac0fca3d5af44c76c9845da37b5197dd8538df))


### Bug Fixes

* **core:** allow undefined hotkey options  ([#1242](https://github.com/videojs/v10/issues/1242)) ([d2c43db](https://github.com/videojs/v10/commit/d2c43db5506847f941260fd41cde2ecd33b74277))
* **html:** add destroy guards to connectedCallback ([#1284](https://github.com/videojs/v10/issues/1284)) ([53fffe8](https://github.com/videojs/v10/commit/53fffe8e308b2f384460342e382a33f6319565f0))
* **html:** create HotkeyRegistryController once in connectedCallback ([#1240](https://github.com/videojs/v10/issues/1240)) ([7c63d82](https://github.com/videojs/v10/commit/7c63d82f84dd224a5b13436e2edbfca51ca56cc0))
* **html:** export SliderPreviewElement and ContextPartElement ([#1283](https://github.com/videojs/v10/issues/1283)) ([0dc7567](https://github.com/videojs/v10/commit/0dc7567e7a2beabc34ae85e277026e886afde7b0))
* **packages:** remove redundant "Shift" modifier from playback rate hotkeys ([#1290](https://github.com/videojs/v10/issues/1290)) ([a0fd3cb](https://github.com/videojs/v10/commit/a0fd3cbda8101f47806e0e71c727fbf483a1de66))
* **packages:** time slider seek improvements ([#1291](https://github.com/videojs/v10/issues/1291)) ([b934c58](https://github.com/videojs/v10/commit/b934c589f824b0ed7338b19c2b3bad3160742e74))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.16
    * @videojs/element bumped to 10.0.0-beta.16
    * @videojs/spf bumped to 10.0.0-beta.16
    * @videojs/store bumped to 10.0.0-beta.16
    * @videojs/utils bumped to 10.0.0-beta.16
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.16
    * @videojs/skins bumped to 10.0.0-beta.16

## [10.0.0-beta.15](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.14...@videojs/html@10.0.0-beta.15) (2026-04-03)


### Miscellaneous Chores

* **@videojs/html:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.15
    * @videojs/element bumped to 10.0.0-beta.15
    * @videojs/spf bumped to 10.0.0-beta.15
    * @videojs/store bumped to 10.0.0-beta.15
    * @videojs/utils bumped to 10.0.0-beta.15
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.15
    * @videojs/skins bumped to 10.0.0-beta.15

## [10.0.0-beta.14](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.13...@videojs/html@10.0.0-beta.14) (2026-04-03)


### Features

* **html:** add native hls video to cdn ([#1208](https://github.com/videojs/v10/issues/1208)) ([80c43d2](https://github.com/videojs/v10/commit/80c43d2c187c6062c088993f0d1b48c5e117a715))
* **html:** add ui bundles for eject ([#1206](https://github.com/videojs/v10/issues/1206)) ([0ed7bf0](https://github.com/videojs/v10/commit/0ed7bf0653b373a353c039fac1aa2bca4fa2973e))
* **packages:** volume slider scroll support ([#1175](https://github.com/videojs/v10/issues/1175)) ([390b004](https://github.com/videojs/v10/commit/390b004d809272fd453b8a73e1969c59410c3620))


### Bug Fixes

* **html:** include base and shared styles in ejected skin CSS ([#1196](https://github.com/videojs/v10/issues/1196)) ([341b405](https://github.com/videojs/v10/commit/341b405a21d9ee3c58cab4ca3d27fa376917f7b7))
* **html:** move TimeElement child creation from constructor to connectedCallback ([#1209](https://github.com/videojs/v10/issues/1209)) ([4ee55c0](https://github.com/videojs/v10/commit/4ee55c08bdadc292175c7586ef899fc53b543e49))
* **packages:** make tooltips visual-only and auto-forward media button labels ([#1174](https://github.com/videojs/v10/issues/1174)) ([86cf3e8](https://github.com/videojs/v10/commit/86cf3e8977719fbbdcd59244a543fdd8412c4484))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.14
    * @videojs/element bumped to 10.0.0-beta.14
    * @videojs/spf bumped to 10.0.0-beta.14
    * @videojs/store bumped to 10.0.0-beta.14
    * @videojs/utils bumped to 10.0.0-beta.14
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.14
    * @videojs/skins bumped to 10.0.0-beta.14

## [10.0.0-beta.13](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.12...@videojs/html@10.0.0-beta.13) (2026-04-01)


### Miscellaneous Chores

* **@videojs/html:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.13
    * @videojs/element bumped to 10.0.0-beta.13
    * @videojs/spf bumped to 10.0.0-beta.13
    * @videojs/store bumped to 10.0.0-beta.13
    * @videojs/utils bumped to 10.0.0-beta.13
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.13
    * @videojs/skins bumped to 10.0.0-beta.13

## [10.0.0-beta.12](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.11...@videojs/html@10.0.0-beta.12) (2026-04-01)


### Features

* add Mux video component ([#1036](https://github.com/videojs/v10/issues/1036)) ([271a8c8](https://github.com/videojs/v10/commit/271a8c850216bd1654baaa26f8bb2f5eda56be37))
* add native hls media + refactor ([#1154](https://github.com/videojs/v10/issues/1154)) ([1b2afc6](https://github.com/videojs/v10/commit/1b2afc6e41a4a8bb4f3ea42b5c04c6232813727e))
* **packages:** error dialog component ([#1077](https://github.com/videojs/v10/issues/1077)) ([3430fe1](https://github.com/videojs/v10/commit/3430fe1a493e4bee34f03112206a0cb3cf9d88cf))


### Bug Fixes

* **html:** HTML SSR safety and sandbox skin chunking ([#1155](https://github.com/videojs/v10/issues/1155)) ([0433722](https://github.com/videojs/v10/commit/0433722ee4b725af213648d589fef80c7e4001a0))
* **skin:** responsive design fixes and improvements ([#1129](https://github.com/videojs/v10/issues/1129)) ([1082693](https://github.com/videojs/v10/commit/10826932be7861ebf5df8c66db7811c0510339f4))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.12
    * @videojs/element bumped to 10.0.0-beta.12
    * @videojs/spf bumped to 10.0.0-beta.12
    * @videojs/store bumped to 10.0.0-beta.12
    * @videojs/utils bumped to 10.0.0-beta.12
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.12
    * @videojs/skins bumped to 10.0.0-beta.12

## [10.0.0-beta.11](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.10...@videojs/html@10.0.0-beta.11) (2026-03-24)


### Features

* **packages:** export media component building blocks ([#1098](https://github.com/videojs/v10/issues/1098)) ([bc2929e](https://github.com/videojs/v10/commit/bc2929ef4fc7ed021c91d96b96498870ecf5e4e5))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.11
    * @videojs/element bumped to 10.0.0-beta.11
    * @videojs/spf bumped to 10.0.0-beta.11
    * @videojs/store bumped to 10.0.0-beta.11
    * @videojs/utils bumped to 10.0.0-beta.11
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.11
    * @videojs/skins bumped to 10.0.0-beta.11

## [10.0.0-beta.10](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.9...@videojs/html@10.0.0-beta.10) (2026-03-23)


### Miscellaneous Chores

* **@videojs/html:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.10
    * @videojs/core bumped to 10.0.0-beta.10
    * @videojs/element bumped to 10.0.0-beta.10
    * @videojs/store bumped to 10.0.0-beta.10
    * @videojs/utils bumped to 10.0.0-beta.10
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.10
    * @videojs/skins bumped to 10.0.0-beta.10

## [10.0.0-beta.9](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.8...@videojs/html@10.0.0-beta.9) (2026-03-23)


### Features

* **skin:** add error handling for audio players ([#1048](https://github.com/videojs/v10/issues/1048)) ([df927f6](https://github.com/videojs/v10/commit/df927f67fcbd0aaa229b1a8e205ab3cb08f7a42d))


### Bug Fixes

* **spf:** implement preload IDL attribute on SpfMedia ([#1069](https://github.com/videojs/v10/issues/1069)) ([04f81a2](https://github.com/videojs/v10/commit/04f81a26e13648ca414f2e51380c8786a06a7724))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.9
    * @videojs/core bumped to 10.0.0-beta.9
    * @videojs/element bumped to 10.0.0-beta.9
    * @videojs/store bumped to 10.0.0-beta.9
    * @videojs/utils bumped to 10.0.0-beta.9
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.9
    * @videojs/skins bumped to 10.0.0-beta.9

## [10.0.0-beta.8](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.7...@videojs/html@10.0.0-beta.8) (2026-03-20)


### Bug Fixes

* **html:** remove redundant CDN CSS files and inline background skin styles ([#1071](https://github.com/videojs/v10/issues/1071)) ([335bda5](https://github.com/videojs/v10/commit/335bda5646ba47eb3e4d9df93a7907c6a7a73800))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.8
    * @videojs/core bumped to 10.0.0-beta.8
    * @videojs/element bumped to 10.0.0-beta.8
    * @videojs/store bumped to 10.0.0-beta.8
    * @videojs/utils bumped to 10.0.0-beta.8
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.8
    * @videojs/skins bumped to 10.0.0-beta.8

## [10.0.0-beta.7](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.6...@videojs/html@10.0.0-beta.7) (2026-03-19)


### Features

* add DashVideo media element (html, react) with sandbox support ([#940](https://github.com/videojs/v10/issues/940)) ([5bdbbec](https://github.com/videojs/v10/commit/5bdbbec8a0f69b4be89600287c63a04746b7ba49))
* **html:** add data-availability to volume slider ([#1001](https://github.com/videojs/v10/issues/1001)) ([c95e134](https://github.com/videojs/v10/commit/c95e1343e16c8667f6b7f5560d12ec5f36f1acd8))
* **html:** refactor attach contexts to carry state and setter ([#1024](https://github.com/videojs/v10/issues/1024)) ([c07da27](https://github.com/videojs/v10/commit/c07da27ead58f2d08b93036af49515800c944f16))
* **packages:** add poster component to video skins ([#994](https://github.com/videojs/v10/issues/994)) ([59bbf6c](https://github.com/videojs/v10/commit/59bbf6c20924ec04e559fe23cbc1a0ad8c8ca080))
* **skin:** add pip-enter and pip-exit icons ([#1015](https://github.com/videojs/v10/issues/1015)) ([81781ca](https://github.com/videojs/v10/commit/81781ca5854f4943b533073b1875b127308a5419))


### Bug Fixes

* **core:** prevent slider thumb jump on pointer release ([#990](https://github.com/videojs/v10/issues/990)) ([b9bada9](https://github.com/videojs/v10/commit/b9bada95675f09b7c7d6859dcd213be7a0408bb7))
* correct popup fallback positioning offsets ([#981](https://github.com/videojs/v10/issues/981)) ([82ede77](https://github.com/videojs/v10/commit/82ede77322204500d7ca0adc5cb24d4f068af462))
* **html:** extended media not working over cdn ([#1019](https://github.com/videojs/v10/issues/1019)) ([cc04cc9](https://github.com/videojs/v10/commit/cc04cc99a594cdace44b258980200241ec419c27))
* **html:** restore deprecated slot="media" for backwards compatibility ([#1020](https://github.com/videojs/v10/issues/1020)) ([eabd065](https://github.com/videojs/v10/commit/eabd06550d4cc10b896eadcb59d3f070e258d78d))
* **skin:** add subtle control transitions on touch devices ([#985](https://github.com/videojs/v10/issues/985)) ([7e0827c](https://github.com/videojs/v10/commit/7e0827c330dc796aa0375cd5839fc4fc1661f055))
* **skin:** bake in safari layout fix into skins ([#954](https://github.com/videojs/v10/issues/954)) ([177bd26](https://github.com/videojs/v10/commit/177bd26c1fae2ff436e614a87614841a07b836fd))
* **skin:** fix HTML skin poster image alignment ([#1002](https://github.com/videojs/v10/issues/1002)) ([6d76449](https://github.com/videojs/v10/commit/6d76449aea4b330a57965ea35580c8fe4db21b10))
* **skin:** hide volume popover when volume control is unsupported ([#1025](https://github.com/videojs/v10/issues/1025)) ([c09dbdd](https://github.com/videojs/v10/commit/c09dbdd121f2b8bb01e42d79350bf7a7acf09f28))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.7
    * @videojs/core bumped to 10.0.0-beta.7
    * @videojs/element bumped to 10.0.0-beta.7
    * @videojs/store bumped to 10.0.0-beta.7
    * @videojs/utils bumped to 10.0.0-beta.7
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.7
    * @videojs/skins bumped to 10.0.0-beta.7

## [10.0.0-beta.6](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.5...@videojs/html@10.0.0-beta.6) (2026-03-15)


### Features

* add slider preview thumbnails ([#935](https://github.com/videojs/v10/issues/935)) ([e3f438e](https://github.com/videojs/v10/commit/e3f438e9f488f41c8cf51c95507bc41fc5b524d0))


### Bug Fixes

* **html:** simplify styles for slotted video ([#953](https://github.com/videojs/v10/issues/953)) ([d6e471a](https://github.com/videojs/v10/commit/d6e471a8377e9ee8ef63df9097810c6d0c1bb2f9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.6
    * @videojs/core bumped to 10.0.0-beta.6
    * @videojs/element bumped to 10.0.0-beta.6
    * @videojs/store bumped to 10.0.0-beta.6
    * @videojs/utils bumped to 10.0.0-beta.6
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.6
    * @videojs/skins bumped to 10.0.0-beta.6

## [10.0.0-beta.5](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.4...@videojs/html@10.0.0-beta.5) (2026-03-12)


### Miscellaneous Chores

* **@videojs/html:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.5
    * @videojs/core bumped to 10.0.0-beta.5
    * @videojs/element bumped to 10.0.0-beta.5
    * @videojs/store bumped to 10.0.0-beta.5
    * @videojs/utils bumped to 10.0.0-beta.5
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.5
    * @videojs/skins bumped to 10.0.0-beta.5

## [10.0.0-beta.4](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.3...@videojs/html@10.0.0-beta.4) (2026-03-12)


### Bug Fixes

* attaching media like elements and upgrade ([#889](https://github.com/videojs/v10/issues/889)) ([2105010](https://github.com/videojs/v10/commit/2105010c7f1f525ab89cc30506219a5dd49a64a7))
* **core:** skip delay when switching between grouped tooltips ([#903](https://github.com/videojs/v10/issues/903)) ([ff8fb3f](https://github.com/videojs/v10/commit/ff8fb3fd36b0eeda9d2d861c83d4db51f60650a0))
* **skin:** add missing tooltip provider/group ([#902](https://github.com/videojs/v10/issues/902)) ([1dbcd79](https://github.com/videojs/v10/commit/1dbcd79e541fce77021645d012fb3554d241b16b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.4
    * @videojs/core bumped to 10.0.0-beta.4
    * @videojs/element bumped to 10.0.0-beta.4
    * @videojs/store bumped to 10.0.0-beta.4
    * @videojs/utils bumped to 10.0.0-beta.4
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.4

## [10.0.0-beta.3](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.2...@videojs/html@10.0.0-beta.3) (2026-03-11)


### Bug Fixes

* **html:** fix html container sizing ([#881](https://github.com/videojs/v10/issues/881)) ([abf8753](https://github.com/videojs/v10/commit/abf8753fe61430122c9d3df40e559ecff3aef3c3))
* **html:** remove commented error dialog blocks from video skins ([#865](https://github.com/videojs/v10/issues/865)) ([669694a](https://github.com/videojs/v10/commit/669694ab20342f3722a1c168fb1adc0e102f696d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.3
    * @videojs/core bumped to 10.0.0-beta.3
    * @videojs/element bumped to 10.0.0-beta.3
    * @videojs/store bumped to 10.0.0-beta.3
    * @videojs/utils bumped to 10.0.0-beta.3
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.3

## [10.0.0-beta.2](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.1...@videojs/html@10.0.0-beta.2) (2026-03-10)


### Features

* **html:** add CDN bundles and inline template minification ([#827](https://github.com/videojs/v10/issues/827)) ([40807b2](https://github.com/videojs/v10/commit/40807b2e3ace6fe81512fb899a18d901765811d4))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.2
    * @videojs/core bumped to 10.0.0-beta.2
    * @videojs/element bumped to 10.0.0-beta.2
    * @videojs/store bumped to 10.0.0-beta.2
    * @videojs/utils bumped to 10.0.0-beta.2
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.2

## [10.0.0-beta.1](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-beta.0...@videojs/html@10.0.0-beta.1) (2026-03-10)


### Features

* add background video components ([#567](https://github.com/videojs/v10/issues/567)) ([fd14f0c](https://github.com/videojs/v10/commit/fd14f0cb17c2fd1752c82d29252296492ed1568f))
* add background video preset ([#607](https://github.com/videojs/v10/issues/607)) ([c2bc488](https://github.com/videojs/v10/commit/c2bc488366fd28f9a6d00dd28a4f790b5e1400ed))
* add console banner ([#186](https://github.com/videojs/v10/issues/186)) ([072b0de](https://github.com/videojs/v10/commit/072b0dece76289d7d4215907ce70b36debbb78bc))
* add media API + HLS video components ([#507](https://github.com/videojs/v10/issues/507)) ([b3a31a3](https://github.com/videojs/v10/commit/b3a31a335a363d3a96b510206b57d1bb9ebb8edd))
* add media delegate mixin ([#598](https://github.com/videojs/v10/issues/598)) ([c4ef94e](https://github.com/videojs/v10/commit/c4ef94e82301be6705002d0a7d7c65463ece1045))
* add subtitles handling + captions core ([#692](https://github.com/videojs/v10/issues/692)) ([5c11606](https://github.com/videojs/v10/commit/5c116065a91ed04753bb2cb83e72dd6471f75ced))
* add tooltip core ([#212](https://github.com/videojs/v10/issues/212)) ([cbf41ce](https://github.com/videojs/v10/commit/cbf41ce4c750cd5c3bb6cbf247bad91ccd578cd0))
* **core:** add buffering indicator component ([#527](https://github.com/videojs/v10/issues/527)) ([aa0fb7c](https://github.com/videojs/v10/commit/aa0fb7ca704843dd6ac8b0b18d9e35f8f430311e))
* **core:** add controls component with activity tracking ([#514](https://github.com/videojs/v10/issues/514)) ([90d881c](https://github.com/videojs/v10/commit/90d881cec21d7f5e1e619061727e6c8d1ff48296))
* **core:** add fullscreen button component ([#459](https://github.com/videojs/v10/issues/459)) ([3c4152f](https://github.com/videojs/v10/commit/3c4152fb5845965334cfd7e3c2623ac978377d96))
* **core:** add mute button component ([#455](https://github.com/videojs/v10/issues/455)) ([aa189ee](https://github.com/videojs/v10/commit/aa189eec84482afde4dd42fc547af4759ea51742))
* **core:** add pip button component ([#525](https://github.com/videojs/v10/issues/525)) ([2c8b77a](https://github.com/videojs/v10/commit/2c8b77af4547b0a8af27abcc419f7d4dff3b005a))
* **core:** add play button component ([#383](https://github.com/videojs/v10/issues/383)) ([9cfab26](https://github.com/videojs/v10/commit/9cfab264d85ea5b8e20fc2d020171ba5ef53b0f4))
* **core:** add poster component ([#457](https://github.com/videojs/v10/issues/457)) ([c9ba1e1](https://github.com/videojs/v10/commit/c9ba1e1bfc83e02981a2ffad0a0f247092068687))
* **core:** add seek button component ([#526](https://github.com/videojs/v10/issues/526)) ([c733077](https://github.com/videojs/v10/commit/c733077d324b3cd40eab7c0e33f1f73592609515))
* **core:** add time display component ([#460](https://github.com/videojs/v10/issues/460)) ([7b8bc11](https://github.com/videojs/v10/commit/7b8bc11f9f90684269b6acebeb79677063112e1f))
* **element:** add lightweight reactive element base ([#513](https://github.com/videojs/v10/issues/513)) ([33b2190](https://github.com/videojs/v10/commit/33b21906cd3b55ac059633f3cfebbb070ffa9a11))
* **example/react:** improvements to react examples ([#210](https://github.com/videojs/v10/issues/210)) ([c35b012](https://github.com/videojs/v10/commit/c35b0122509ce3230dcfce4a0acf0d315ba5f0ee))
* **html:** add `PlayerElement` to `createPlayer` ([#376](https://github.com/videojs/v10/issues/376)) ([9c8d9cd](https://github.com/videojs/v10/commit/9c8d9cd8ed1196d8f876d8197d7280fb1b21238a))
* **html:** add alert dialog element ([#741](https://github.com/videojs/v10/issues/741)) ([5fc52aa](https://github.com/videojs/v10/commit/5fc52aa969292a8b8f636b532ac5ff27b082b222))
* **html:** add element registrations ([eaaa03c](https://github.com/videojs/v10/commit/eaaa03c284f9fc3c9069bedb74d95c8a951c1b56))
* **html:** add popover element ([#652](https://github.com/videojs/v10/issues/652)) ([bebd03f](https://github.com/videojs/v10/commit/bebd03ff2b533c590c679088a16ae1898b575919))
* **html:** add slider element ([#655](https://github.com/videojs/v10/issues/655)) ([d5df015](https://github.com/videojs/v10/commit/d5df0150b3aef21c15d3a65c015bb6058e95ce53))
* **html:** add slider preview element ([#733](https://github.com/videojs/v10/issues/733)) ([7548a8e](https://github.com/videojs/v10/commit/7548a8e4a1cc87e1a702ef24d5559427f26e91ef))
* **html:** add slider thumbnail element ([#714](https://github.com/videojs/v10/issues/714)) ([32ee304](https://github.com/videojs/v10/commit/32ee304da4893f0c9271a25cf3fc81b84fccc399))
* **html:** add thumbnail element ([#646](https://github.com/videojs/v10/issues/646)) ([8457b12](https://github.com/videojs/v10/commit/8457b1241c0c382abb6efd70f125081413df8a93))
* **html:** add time slider element ([#656](https://github.com/videojs/v10/issues/656)) ([26c7395](https://github.com/videojs/v10/commit/26c7395cd0fe7e2fe8a8020ffae40cf81ffb3974))
* **html:** add tooltip element ([#735](https://github.com/videojs/v10/issues/735)) ([e9fbaec](https://github.com/videojs/v10/commit/e9fbaece87c39c0adc41070159fd7e6f75f0e1da))
* **html:** add volume slider element ([#657](https://github.com/videojs/v10/issues/657)) ([92b7c2a](https://github.com/videojs/v10/commit/92b7c2ac184d12c780ba1a1bb6f064782b77422a))
* **html:** reorganize import paths by use case ([#480](https://github.com/videojs/v10/issues/480)) ([870cbb7](https://github.com/videojs/v10/commit/870cbb77e4ac45d179d8702d0e08c58face8a2fc))
* **html:** setup player api ([#374](https://github.com/videojs/v10/issues/374)) ([a419f5e](https://github.com/videojs/v10/commit/a419f5ef190a47575c4a7e11353a5454e6ee7fe6))
* idiomatic html markup, use popover API, add safe polygon utility ([#143](https://github.com/videojs/v10/issues/143)) ([419911f](https://github.com/videojs/v10/commit/419911f2f2b9f505700f5becb623bfe12e3878aa))
* **packages:** add PlaybackRateButton to core, html, and react ([#642](https://github.com/videojs/v10/issues/642)) ([0180828](https://github.com/videojs/v10/commit/0180828df91ad74f885906223fa7d359f1a2641a))
* **react:** add popover component ([#653](https://github.com/videojs/v10/issues/653)) ([ed43d52](https://github.com/videojs/v10/commit/ed43d52f8fa347acb9dd62f8458a8324e3506fd1))
* **react:** use popover and anchor position API ([#178](https://github.com/videojs/v10/issues/178)) ([f513c74](https://github.com/videojs/v10/commit/f513c74a6cebc09ac76512bb86af10a33350f900))
* **site:** add util reference pipeline ([#537](https://github.com/videojs/v10/issues/537)) ([78112fb](https://github.com/videojs/v10/commit/78112fbefdaace678a2d1335409e40533f3819fa))
* **skin:** add audio skins for HTML and React presets ([#772](https://github.com/videojs/v10/issues/772)) ([d751fda](https://github.com/videojs/v10/commit/d751fdabea9782b9f6c73aaebfb93ed393e488f7))
* **skin:** implement default and minimal skins for HTML player ([#698](https://github.com/videojs/v10/issues/698)) ([c5cafae](https://github.com/videojs/v10/commit/c5cafae57ff34d13f79d11862b82f10414bdcd40))
* **skin:** port tooltip styling from tech preview ([#800](https://github.com/videojs/v10/issues/800)) ([6b6566e](https://github.com/videojs/v10/commit/6b6566e2540b4ad9fcd9b2a8e6c767f5f7e4072f))
* **skins:** add html port of minimal skin ([#140](https://github.com/videojs/v10/issues/140)) ([47ac22e](https://github.com/videojs/v10/commit/47ac22e9b8a513c9640ed1eff20838d8cdb749ce))
* small state and naming fixes  ([#719](https://github.com/videojs/v10/issues/719)) ([5c42245](https://github.com/videojs/v10/commit/5c422452e4b547dc00f13082b755ea12d1860f21))
* **spf:** initial push of SPF ([#784](https://github.com/videojs/v10/issues/784)) ([27a3993](https://github.com/videojs/v10/commit/27a3993fb20af0523e42b0d03c70a6f5a465d144))
* **store:** add reactive state primitives ([#311](https://github.com/videojs/v10/issues/311)) ([beb8615](https://github.com/videojs/v10/commit/beb8615c1c75a996d1e4ea2db804c49acdc10ef0))
* **store:** skin store setup ([#298](https://github.com/videojs/v10/issues/298)) ([b2e2b88](https://github.com/videojs/v10/commit/b2e2b88e19634fa67e064b898e37f954d6939e2a))
* **ui:** skin design improvements, add html frosted skin (WIP) ([#133](https://github.com/videojs/v10/issues/133)) ([75a90e7](https://github.com/videojs/v10/commit/75a90e71041c2d0bf434823e59dd04f86f89b0bb))
* update html tooltip API / use command attr ([#151](https://github.com/videojs/v10/issues/151)) ([1e7c8ae](https://github.com/videojs/v10/commit/1e7c8ae82e317bada5b7bc2346d5b73b5f9bf5b7))
* use anchor API for html elements ([#174](https://github.com/videojs/v10/issues/174)) ([4a2d580](https://github.com/videojs/v10/commit/4a2d580bb3db35d17d89827326617d0bd2c54499))


### Bug Fixes

* add aria-hidden to focus guards ([77182f1](https://github.com/videojs/v10/commit/77182f1ab349d3b31470d7301e3dc2fb94c1d6ac))
* add aspect-ratio to demos ([#136](https://github.com/videojs/v10/issues/136)) ([e0a46de](https://github.com/videojs/v10/commit/e0a46de0ab56199afd37b24ebfce93ee85e2b699))
* add popover core, use in html and improve factory ([#204](https://github.com/videojs/v10/issues/204)) ([f3b1b19](https://github.com/videojs/v10/commit/f3b1b199173f3750bc05ad9063fcccbd4163b12b))
* add viewport meta element ([#135](https://github.com/videojs/v10/issues/135)) ([3bd50eb](https://github.com/videojs/v10/commit/3bd50ebac887229199fa6997eb0aaec361075b1a))
* **cd:** add repository field to all packages for provenance verification ([b723589](https://github.com/videojs/v10/commit/b72358904a78a9403df16d77936d4a1f41a64bfe))
* clean up core, less seams in wrappers ([#197](https://github.com/videojs/v10/issues/197)) ([601a5a3](https://github.com/videojs/v10/commit/601a5a37939605ca38f81a825fd02934e7928c39))
* delegate not defining Delegate props ([#751](https://github.com/videojs/v10/issues/751)) ([c61fcdc](https://github.com/videojs/v10/commit/c61fcdcc3a64f8a4ef32ec3fd332f1ec5cdbb311))
* destroy hls.js instance on media unmount ([#749](https://github.com/videojs/v10/issues/749)) ([c4e8bbd](https://github.com/videojs/v10/commit/c4e8bbd3a2bcb66027c64faf8de0ec61d22c84fa))
* **html,react:** move @videojs/skins to devDependencies ([#716](https://github.com/videojs/v10/issues/716)) ([55b49ef](https://github.com/videojs/v10/commit/55b49efd82281815abe1e26eb764dfe914bb8208))
* **html:** add destroy ([#748](https://github.com/videojs/v10/issues/748)) ([3f11424](https://github.com/videojs/v10/commit/3f11424b182f9889a572590e38219e6289f544c2))
* **html:** apply popover data attributes before showing via popover API ([#763](https://github.com/videojs/v10/issues/763)) ([206bc9b](https://github.com/videojs/v10/commit/206bc9b4ae914176e50c1708c272c75d90a12286))
* **html:** discover media elements and attach store target via DOM ([#481](https://github.com/videojs/v10/issues/481)) ([5eab1db](https://github.com/videojs/v10/commit/5eab1dbb2fbb906543f7749e5956c9791c30be34))
* **html:** move @videojs/icons to devDependencies ([#712](https://github.com/videojs/v10/issues/712)) ([391cf5e](https://github.com/videojs/v10/commit/391cf5e42b93e46386169a010b250704e4d23117))
* **html:** prevent tsdown from stripping custom element registrations ([#703](https://github.com/videojs/v10/issues/703)) ([9a5dfab](https://github.com/videojs/v10/commit/9a5dfab4e8d0e095ea08e8a46973ad57cb1b6820))
* **html:** slider interaction and edge alignment broken ([#721](https://github.com/videojs/v10/issues/721)) ([ff12296](https://github.com/videojs/v10/commit/ff122963553e23a58614c9c808763208fd893df1))
* **html:** thumb edge alignment jump ([#766](https://github.com/videojs/v10/issues/766)) ([d53e239](https://github.com/videojs/v10/commit/d53e239b7b59ad0d86ef961e19342c80568fe02d))
* **packages:** enable unbundle mode to avoid mangled exports ([00fdf96](https://github.com/videojs/v10/commit/00fdf966ca5148bcca303058dd798b1b880896e0))
* **packages:** set release-please manifest and package versions to beta.0 ([#850](https://github.com/videojs/v10/issues/850)) ([e085a0d](https://github.com/videojs/v10/commit/e085a0d73af0c142e0c0a371337daae98fdbaac9))
* **packages:** update package READMEs for beta ([#848](https://github.com/videojs/v10/issues/848)) ([9562a0e](https://github.com/videojs/v10/commit/9562a0ecca212034759d7cc948d4b3f0bc7a19c3))
* **packages:** update version badges ([#138](https://github.com/videojs/v10/issues/138)) ([22d9cb6](https://github.com/videojs/v10/commit/22d9cb64f2e5b9601a2039bb166dbe3fee6a1b3e))
* **react, html:** rename MediaProvider (and related) to VideoProvider ([#159](https://github.com/videojs/v10/issues/159)) ([f285573](https://github.com/videojs/v10/commit/f28557359c7dda0282f9d532fa4b2fce19766e40))
* remove `show-remaining` in HTML example ([#137](https://github.com/videojs/v10/issues/137)) ([7dde67a](https://github.com/videojs/v10/commit/7dde67ac927d6aca0f6a9b219ff3f3dc38594805))
* **root:** add videojs keyword to package.json ([4a9f8b2](https://github.com/videojs/v10/commit/4a9f8b2ad6fb27b463dcfe8d1a5fd883c9fa21d1))
* **site:** update discord link ([#170](https://github.com/videojs/v10/issues/170)) ([bb10294](https://github.com/videojs/v10/commit/bb10294419439fb02df650f3e7f7c5496ecc3a73))
* **skins:** remove vjs- prefixed CSS custom properties ([#179](https://github.com/videojs/v10/issues/179)) ([a62623b](https://github.com/videojs/v10/commit/a62623ba41d294edead981a1b468f7f486c91625))
* **skins:** slightly more idiomatic Tailwind, added custom properties ([#175](https://github.com/videojs/v10/issues/175)) ([694afb7](https://github.com/videojs/v10/commit/694afb7de992edbd667bc3d895df8bf198ccabb3))
* use popover core in react popover ([#208](https://github.com/videojs/v10/issues/208)) ([99fef78](https://github.com/videojs/v10/commit/99fef78f63e8dd121513b9cd20696a7d35603837))
* visually hidden focus guards ([#142](https://github.com/videojs/v10/issues/142)) ([956dad7](https://github.com/videojs/v10/commit/956dad7ff5731d7630526ec97e33c652f260bc13))


### Reverts

* **html:** remove double raf hls destroy ([#754](https://github.com/videojs/v10/issues/754)) ([dce16ae](https://github.com/videojs/v10/commit/dce16ae5fd414563e6788b506e11bd1cff568870))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.1
    * @videojs/core bumped to 10.0.0-beta.1
    * @videojs/element bumped to 10.0.0-beta.1
    * @videojs/store bumped to 10.0.0-beta.1
    * @videojs/utils bumped to 10.0.0-beta.1
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.1

## [10.0.0-alpha.11](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-alpha.10...@videojs/html@10.0.0-alpha.11) (2026-03-10)


### Miscellaneous Chores

* **@videojs/html:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-alpha.11
    * @videojs/core bumped to 10.0.0-alpha.11
    * @videojs/element bumped to 10.0.0-alpha.11
    * @videojs/store bumped to 10.0.0-alpha.11
    * @videojs/utils bumped to 10.0.0-alpha.11
  * devDependencies
    * @videojs/icons bumped to 10.0.0-alpha.11

## [10.0.0-alpha.10](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-alpha.9...@videojs/html@10.0.0-alpha.10) (2026-03-10)


### Features

* **skin:** add audio skins for HTML and React presets ([#772](https://github.com/videojs/v10/issues/772)) ([d751fda](https://github.com/videojs/v10/commit/d751fdabea9782b9f6c73aaebfb93ed393e488f7))
* **skin:** port tooltip styling from tech preview ([#800](https://github.com/videojs/v10/issues/800)) ([6b6566e](https://github.com/videojs/v10/commit/6b6566e2540b4ad9fcd9b2a8e6c767f5f7e4072f))
* **spf:** initial push of SPF ([#784](https://github.com/videojs/v10/issues/784)) ([27a3993](https://github.com/videojs/v10/commit/27a3993fb20af0523e42b0d03c70a6f5a465d144))


### Bug Fixes

* **html:** apply popover data attributes before showing via popover API ([#763](https://github.com/videojs/v10/issues/763)) ([206bc9b](https://github.com/videojs/v10/commit/206bc9b4ae914176e50c1708c272c75d90a12286))
* **html:** thumb edge alignment jump ([#766](https://github.com/videojs/v10/issues/766)) ([d53e239](https://github.com/videojs/v10/commit/d53e239b7b59ad0d86ef961e19342c80568fe02d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-alpha.10
    * @videojs/core bumped to 10.0.0-alpha.10
    * @videojs/element bumped to 10.0.0-alpha.10
    * @videojs/store bumped to 10.0.0-alpha.10
    * @videojs/utils bumped to 10.0.0-alpha.10
  * devDependencies
    * @videojs/icons bumped to 10.0.0-alpha.10

## [10.0.0-alpha.9](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-alpha.8...@videojs/html@10.0.0-alpha.9) (2026-03-06)


### Features

* add subtitles handling + captions core ([#692](https://github.com/videojs/v10/issues/692)) ([5c11606](https://github.com/videojs/v10/commit/5c116065a91ed04753bb2cb83e72dd6471f75ced))
* **html:** add alert dialog element ([#741](https://github.com/videojs/v10/issues/741)) ([5fc52aa](https://github.com/videojs/v10/commit/5fc52aa969292a8b8f636b532ac5ff27b082b222))


### Bug Fixes

* delegate not defining Delegate props ([#751](https://github.com/videojs/v10/issues/751)) ([c61fcdc](https://github.com/videojs/v10/commit/c61fcdcc3a64f8a4ef32ec3fd332f1ec5cdbb311))
* destroy hls.js instance on media unmount ([#749](https://github.com/videojs/v10/issues/749)) ([c4e8bbd](https://github.com/videojs/v10/commit/c4e8bbd3a2bcb66027c64faf8de0ec61d22c84fa))
* **html:** add destroy ([#748](https://github.com/videojs/v10/issues/748)) ([3f11424](https://github.com/videojs/v10/commit/3f11424b182f9889a572590e38219e6289f544c2))


### Reverts

* **html:** remove double raf hls destroy ([#754](https://github.com/videojs/v10/issues/754)) ([dce16ae](https://github.com/videojs/v10/commit/dce16ae5fd414563e6788b506e11bd1cff568870))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.9
    * @videojs/element bumped to 10.0.0-alpha.9
    * @videojs/store bumped to 10.0.0-alpha.9
    * @videojs/utils bumped to 10.0.0-alpha.9
  * devDependencies
    * @videojs/icons bumped to 10.0.0-alpha.9

## [10.0.0-alpha.8](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-alpha.7...@videojs/html@10.0.0-alpha.8) (2026-03-05)


### Features

* **html:** add slider preview element ([#733](https://github.com/videojs/v10/issues/733)) ([7548a8e](https://github.com/videojs/v10/commit/7548a8e4a1cc87e1a702ef24d5559427f26e91ef))
* **html:** add slider thumbnail element ([#714](https://github.com/videojs/v10/issues/714)) ([32ee304](https://github.com/videojs/v10/commit/32ee304da4893f0c9271a25cf3fc81b84fccc399))
* **html:** add tooltip element ([#735](https://github.com/videojs/v10/issues/735)) ([e9fbaec](https://github.com/videojs/v10/commit/e9fbaece87c39c0adc41070159fd7e6f75f0e1da))
* small state and naming fixes  ([#719](https://github.com/videojs/v10/issues/719)) ([5c42245](https://github.com/videojs/v10/commit/5c422452e4b547dc00f13082b755ea12d1860f21))


### Bug Fixes

* **html:** slider interaction and edge alignment broken ([#721](https://github.com/videojs/v10/issues/721)) ([ff12296](https://github.com/videojs/v10/commit/ff122963553e23a58614c9c808763208fd893df1))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.8
    * @videojs/element bumped to 10.0.0-alpha.8
    * @videojs/store bumped to 10.0.0-alpha.8
    * @videojs/utils bumped to 10.0.0-alpha.8
  * devDependencies
    * @videojs/icons bumped to 10.0.0-alpha.8

## [10.0.0-alpha.7](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-alpha.6...@videojs/html@10.0.0-alpha.7) (2026-03-04)


### Bug Fixes

* **html,react:** move @videojs/skins to devDependencies ([#716](https://github.com/videojs/v10/issues/716)) ([55b49ef](https://github.com/videojs/v10/commit/55b49efd82281815abe1e26eb764dfe914bb8208))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.7
    * @videojs/element bumped to 10.0.0-alpha.7
    * @videojs/store bumped to 10.0.0-alpha.7
    * @videojs/utils bumped to 10.0.0-alpha.7
  * devDependencies
    * @videojs/icons bumped to 10.0.0-alpha.7

## [10.0.0-alpha.6](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-alpha.5...@videojs/html@10.0.0-alpha.6) (2026-03-04)


### Bug Fixes

* **html:** move @videojs/icons to devDependencies ([#712](https://github.com/videojs/v10/issues/712)) ([391cf5e](https://github.com/videojs/v10/commit/391cf5e42b93e46386169a010b250704e4d23117))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.6
    * @videojs/element bumped to 10.0.0-alpha.6
    * @videojs/store bumped to 10.0.0-alpha.6
    * @videojs/utils bumped to 10.0.0-alpha.6
  * devDependencies
    * @videojs/icons bumped to 10.0.0-alpha.6

## [10.0.0-alpha.5](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-alpha.4...@videojs/html@10.0.0-alpha.5) (2026-03-04)


### Features

* **html:** add popover element ([#652](https://github.com/videojs/v10/issues/652)) ([bebd03f](https://github.com/videojs/v10/commit/bebd03ff2b533c590c679088a16ae1898b575919))
* **html:** add slider element ([#655](https://github.com/videojs/v10/issues/655)) ([d5df015](https://github.com/videojs/v10/commit/d5df0150b3aef21c15d3a65c015bb6058e95ce53))
* **html:** add thumbnail element ([#646](https://github.com/videojs/v10/issues/646)) ([8457b12](https://github.com/videojs/v10/commit/8457b1241c0c382abb6efd70f125081413df8a93))
* **html:** add time slider element ([#656](https://github.com/videojs/v10/issues/656)) ([26c7395](https://github.com/videojs/v10/commit/26c7395cd0fe7e2fe8a8020ffae40cf81ffb3974))
* **html:** add volume slider element ([#657](https://github.com/videojs/v10/issues/657)) ([92b7c2a](https://github.com/videojs/v10/commit/92b7c2ac184d12c780ba1a1bb6f064782b77422a))
* **packages:** add PlaybackRateButton to core, html, and react ([#642](https://github.com/videojs/v10/issues/642)) ([0180828](https://github.com/videojs/v10/commit/0180828df91ad74f885906223fa7d359f1a2641a))
* **react:** add popover component ([#653](https://github.com/videojs/v10/issues/653)) ([ed43d52](https://github.com/videojs/v10/commit/ed43d52f8fa347acb9dd62f8458a8324e3506fd1))
* **skin:** implement default and minimal skins for HTML player ([#698](https://github.com/videojs/v10/issues/698)) ([c5cafae](https://github.com/videojs/v10/commit/c5cafae57ff34d13f79d11862b82f10414bdcd40))


### Bug Fixes

* **html:** prevent tsdown from stripping custom element registrations ([#703](https://github.com/videojs/v10/issues/703)) ([9a5dfab](https://github.com/videojs/v10/commit/9a5dfab4e8d0e095ea08e8a46973ad57cb1b6820))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.5
    * @videojs/element bumped to 10.0.0-alpha.5
    * @videojs/icons bumped to 10.0.0-alpha.5
    * @videojs/store bumped to 10.0.0-alpha.5
    * @videojs/utils bumped to 10.0.0-alpha.5

## [10.0.0-alpha.4](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-alpha.3...@videojs/html@10.0.0-alpha.4) (2026-02-26)


### Features

* add background video preset ([#607](https://github.com/videojs/v10/issues/607)) ([c2bc488](https://github.com/videojs/v10/commit/c2bc488366fd28f9a6d00dd28a4f790b5e1400ed))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.4
    * @videojs/element bumped to 10.0.0-alpha.4
    * @videojs/store bumped to 10.0.0-alpha.4
    * @videojs/utils bumped to 10.0.0-alpha.4

## [10.0.0-alpha.3](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-alpha.2...@videojs/html@10.0.0-alpha.3) (2026-02-26)


### Bug Fixes

* **cd:** add repository field to all packages for provenance verification ([b723589](https://github.com/videojs/v10/commit/b72358904a78a9403df16d77936d4a1f41a64bfe))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.3
    * @videojs/element bumped to 10.0.0-alpha.3
    * @videojs/store bumped to 10.0.0-alpha.3
    * @videojs/utils bumped to 10.0.0-alpha.3

## [10.0.0-alpha.2](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-alpha.1...@videojs/html@10.0.0-alpha.2) (2026-02-26)


### Miscellaneous Chores

* **@videojs/html:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.2
    * @videojs/element bumped to 10.0.0-alpha.2
    * @videojs/store bumped to 10.0.0-alpha.2
    * @videojs/utils bumped to 10.0.0-alpha.2

## [10.0.0-alpha.1](https://github.com/videojs/v10/compare/@videojs/html@10.0.0-alpha.0...@videojs/html@10.0.0-alpha.1) (2026-02-26)


### Features

* add background video components ([#567](https://github.com/videojs/v10/issues/567)) ([fd14f0c](https://github.com/videojs/v10/commit/fd14f0cb17c2fd1752c82d29252296492ed1568f))
* add compound html timerange component ([#14](https://github.com/videojs/v10/issues/14)) ([017ecdb](https://github.com/videojs/v10/commit/017ecdbff991d140ea42e4a855269a54e0a19adc))
* add console banner ([#186](https://github.com/videojs/v10/issues/186)) ([072b0de](https://github.com/videojs/v10/commit/072b0dece76289d7d4215907ce70b36debbb78bc))
* add core range, time and volume range ([#23](https://github.com/videojs/v10/issues/23)) ([687b765](https://github.com/videojs/v10/commit/687b7655b0b6356c28663ca85c8f6d25a1023c18))
* add data style attributes to popover ([#62](https://github.com/videojs/v10/issues/62)) ([6d7325c](https://github.com/videojs/v10/commit/6d7325cedb182c37b955e729d32204e4afbba948))
* add display click to play / pause ([#117](https://github.com/videojs/v10/issues/117)) ([4f06ef6](https://github.com/videojs/v10/commit/4f06ef6c7684fd7064ca76685003a1c38ebd09cd))
* add focus state to sliders and volume slider ([#60](https://github.com/videojs/v10/issues/60)) ([f514051](https://github.com/videojs/v10/commit/f514051263f95d892315eed9d44b3d83829e5d4b))
* add html preview time display ([#58](https://github.com/videojs/v10/issues/58)) ([871701a](https://github.com/videojs/v10/commit/871701a453e49192ef986d286aaf957c0f533a93))
* add HTML tooltip component ([#40](https://github.com/videojs/v10/issues/40)) ([d2a0b27](https://github.com/videojs/v10/commit/d2a0b27272f1967e5f7cde2df12920af92e3c300))
* add HTML vertical orientation to time and volume ([#32](https://github.com/videojs/v10/issues/32)) ([7b79854](https://github.com/videojs/v10/commit/7b798543042e53e3c0a718b54b6c69038bbc1fcd))
* add keyboard control to sliders ([#115](https://github.com/videojs/v10/issues/115)) ([0a49026](https://github.com/videojs/v10/commit/0a4902623d58f51055b1cc65498a0e716533ec29))
* add media API + HLS video components ([#507](https://github.com/videojs/v10/issues/507)) ([b3a31a3](https://github.com/videojs/v10/commit/b3a31a335a363d3a96b510206b57d1bb9ebb8edd))
* add media delegate mixin ([#598](https://github.com/videojs/v10/issues/598)) ([c4ef94e](https://github.com/videojs/v10/commit/c4ef94e82301be6705002d0a7d7c65463ece1045))
* add media-popover, cleanup html demo ([#34](https://github.com/videojs/v10/issues/34)) ([17b632f](https://github.com/videojs/v10/commit/17b632f5f9c7ad6c4d84115e7ef42ee02e4ac2ba))
* add showRemaining functionality to current time display ([ab07a8a](https://github.com/videojs/v10/commit/ab07a8a9a26f68066e292718f3cd17a2640c5477))
* add tooltip core ([#212](https://github.com/videojs/v10/issues/212)) ([cbf41ce](https://github.com/videojs/v10/commit/cbf41ce4c750cd5c3bb6cbf247bad91ccd578cd0))
* add tooltip transition status ([05988a8](https://github.com/videojs/v10/commit/05988a82ba10fe10eaa277d65bdf99cb022ff0e0))
* add volume range compound component ([#19](https://github.com/videojs/v10/issues/19)) ([aefe890](https://github.com/videojs/v10/commit/aefe890fee93981542282087b2f2c7474f1b47e6))
* **core,html,react:** implement VolumeRange component with integrated state management ([2282f47](https://github.com/videojs/v10/commit/2282f4799b1c3fc3c55473bdfc2def86384d5d19))
* **core:** add buffering indicator component ([#527](https://github.com/videojs/v10/issues/527)) ([aa0fb7c](https://github.com/videojs/v10/commit/aa0fb7ca704843dd6ac8b0b18d9e35f8f430311e))
* **core:** add controls component with activity tracking ([#514](https://github.com/videojs/v10/issues/514)) ([90d881c](https://github.com/videojs/v10/commit/90d881cec21d7f5e1e619061727e6c8d1ff48296))
* **core:** add fullscreen button component ([#459](https://github.com/videojs/v10/issues/459)) ([3c4152f](https://github.com/videojs/v10/commit/3c4152fb5845965334cfd7e3c2623ac978377d96))
* **core:** add mute button component ([#455](https://github.com/videojs/v10/issues/455)) ([aa189ee](https://github.com/videojs/v10/commit/aa189eec84482afde4dd42fc547af4759ea51742))
* **core:** add pip button component ([#525](https://github.com/videojs/v10/issues/525)) ([2c8b77a](https://github.com/videojs/v10/commit/2c8b77af4547b0a8af27abcc419f7d4dff3b005a))
* **core:** add play button component ([#383](https://github.com/videojs/v10/issues/383)) ([9cfab26](https://github.com/videojs/v10/commit/9cfab264d85ea5b8e20fc2d020171ba5ef53b0f4))
* **core:** add poster component ([#457](https://github.com/videojs/v10/issues/457)) ([c9ba1e1](https://github.com/videojs/v10/commit/c9ba1e1bfc83e02981a2ffad0a0f247092068687))
* **core:** add seek button component ([#526](https://github.com/videojs/v10/issues/526)) ([c733077](https://github.com/videojs/v10/commit/c733077d324b3cd40eab7c0e33f1f73592609515))
* **core:** add time display component ([#460](https://github.com/videojs/v10/issues/460)) ([7b8bc11](https://github.com/videojs/v10/commit/7b8bc11f9f90684269b6acebeb79677063112e1f))
* **element:** add lightweight reactive element base ([#513](https://github.com/videojs/v10/issues/513)) ([33b2190](https://github.com/videojs/v10/commit/33b21906cd3b55ac059633f3cfebbb070ffa9a11))
* **example/react:** improvements to react examples ([#210](https://github.com/videojs/v10/issues/210)) ([c35b012](https://github.com/videojs/v10/commit/c35b0122509ce3230dcfce4a0acf0d315ba5f0ee))
* **html:** add `PlayerElement` to `createPlayer` ([#376](https://github.com/videojs/v10/issues/376)) ([9c8d9cd](https://github.com/videojs/v10/commit/9c8d9cd8ed1196d8f876d8197d7280fb1b21238a))
* **html:** add element registrations ([eaaa03c](https://github.com/videojs/v10/commit/eaaa03c284f9fc3c9069bedb74d95c8a951c1b56))
* **html:** add fullscreen button component and icons ([63a3402](https://github.com/videojs/v10/commit/63a340213f483a809f736022a5eb8ef5683888e1))
* **html:** implement duration display component ([e35dd44](https://github.com/videojs/v10/commit/e35dd44be86effee6e93882e88bb841e60c73fd9))
* **html:** integrate fullscreen button into control bar and improve container lifecycle ([465342e](https://github.com/videojs/v10/commit/465342e4314e854332f5bdfee5eb6b4c113f1d87))
* **html:** reorganize import paths by use case ([#480](https://github.com/videojs/v10/issues/480)) ([870cbb7](https://github.com/videojs/v10/commit/870cbb77e4ac45d179d8702d0e08c58face8a2fc))
* **html:** setup player api ([#374](https://github.com/videojs/v10/issues/374)) ([a419f5e](https://github.com/videojs/v10/commit/a419f5ef190a47575c4a7e11353a5454e6ee7fe6))
* **icons:** implement shared SVG icon system across packages ([e0be58e](https://github.com/videojs/v10/commit/e0be58e094e65ea72af99b2c1e1d87c507c251bd))
* idiomatic html markup, use popover API, add safe polygon utility ([#143](https://github.com/videojs/v10/issues/143)) ([419911f](https://github.com/videojs/v10/commit/419911f2f2b9f505700f5becb623bfe12e3878aa))
* implement current time display components ([5bd0a15](https://github.com/videojs/v10/commit/5bd0a154dbba01d2a5d11eb1f548fe4baa581675))
* initialize Video.js 10 monorepo with core architecture ([4b0d84e](https://github.com/videojs/v10/commit/4b0d84e9c8adfa7401084389da5deb751420b629))
* **media-store,html,react:** implement TimeRange component with hook-style architecture ([c29fd2c](https://github.com/videojs/v10/commit/c29fd2c2c1edd61c09a6683041c709a990d8a6f0))
* migrate entire monorepo from tsc to tsup for production builds ([7403cc7](https://github.com/videojs/v10/commit/7403cc728119322888e527468a07a7634f43b32a))
* **monorepo:** migrate prototype code to organized package structure ([4b472ec](https://github.com/videojs/v10/commit/4b472ec49cd91f0af61cb5aaa039d428982d3b91))
* **react:** use popover and anchor position API ([#178](https://github.com/videojs/v10/issues/178)) ([f513c74](https://github.com/videojs/v10/commit/f513c74a6cebc09ac76512bb86af10a33350f900))
* rename range to slider ([#46](https://github.com/videojs/v10/issues/46)) ([9c6eaef](https://github.com/videojs/v10/commit/9c6eaef2aa61771ae1407d0a594b3f790e0ff665))
* **site:** add util reference pipeline ([#537](https://github.com/videojs/v10/issues/537)) ([78112fb](https://github.com/videojs/v10/commit/78112fbefdaace678a2d1335409e40533f3819fa))
* **skins:** add html port of minimal skin ([#140](https://github.com/videojs/v10/issues/140)) ([47ac22e](https://github.com/videojs/v10/commit/47ac22e9b8a513c9640ed1eff20838d8cdb749ce))
* **skins:** integrate duration display into default skins ([2ed2191](https://github.com/videojs/v10/commit/2ed219158ddf6f720ce1be8e328bec4603a7e847))
* **store:** add reactive state primitives ([#311](https://github.com/videojs/v10/issues/311)) ([beb8615](https://github.com/videojs/v10/commit/beb8615c1c75a996d1e4ea2db804c49acdc10ef0))
* **store:** skin store setup ([#298](https://github.com/videojs/v10/issues/298)) ([b2e2b88](https://github.com/videojs/v10/commit/b2e2b88e19634fa67e064b898e37f954d6939e2a))
* **ui:** port over default skin ([ff4ea36](https://github.com/videojs/v10/commit/ff4ea3693e63ab3b5a728988ca44f3bab669e8ff))
* **ui:** port over default skin ([9950945](https://github.com/videojs/v10/commit/995094500823e1063e7ae291c9a2ea9a4aa74847))
* **ui:** skin design improvements, add html frosted skin (WIP) ([#133](https://github.com/videojs/v10/issues/133)) ([75a90e7](https://github.com/videojs/v10/commit/75a90e71041c2d0bf434823e59dd04f86f89b0bb))
* update html tooltip API / use command attr ([#151](https://github.com/videojs/v10/issues/151)) ([1e7c8ae](https://github.com/videojs/v10/commit/1e7c8ae82e317bada5b7bc2346d5b73b5f9bf5b7))
* use anchor API for html elements ([#174](https://github.com/videojs/v10/issues/174)) ([4a2d580](https://github.com/videojs/v10/commit/4a2d580bb3db35d17d89827326617d0bd2c54499))


### Bug Fixes

* add aria-hidden to focus guards ([77182f1](https://github.com/videojs/v10/commit/77182f1ab349d3b31470d7301e3dc2fb94c1d6ac))
* add aspect-ratio to demos ([#136](https://github.com/videojs/v10/issues/136)) ([e0a46de](https://github.com/videojs/v10/commit/e0a46de0ab56199afd37b24ebfce93ee85e2b699))
* add popover core, use in html and improve factory ([#204](https://github.com/videojs/v10/issues/204)) ([f3b1b19](https://github.com/videojs/v10/commit/f3b1b199173f3750bc05ad9063fcccbd4163b12b))
* add viewport meta element ([#135](https://github.com/videojs/v10/issues/135)) ([3bd50eb](https://github.com/videojs/v10/commit/3bd50ebac887229199fa6997eb0aaec361075b1a))
* clean up core, less seams in wrappers ([#197](https://github.com/videojs/v10/issues/197)) ([601a5a3](https://github.com/videojs/v10/commit/601a5a37939605ca38f81a825fd02934e7928c39))
* Clean up more typescript errors. ([87105db](https://github.com/videojs/v10/commit/87105db6be31038fc92862c240898984d02932eb))
* design tweaks to toasted skin, lint rule tweaks ([#44](https://github.com/videojs/v10/issues/44)) ([3a0767c](https://github.com/videojs/v10/commit/3a0767c3407b2d6d8af3d3a8afd57b1e76efda85))
* enable eslint & run eslint:fix ([#43](https://github.com/videojs/v10/issues/43)) ([5cb93a1](https://github.com/videojs/v10/commit/5cb93a14a7f47d66d5c71f9b82867621beda236c))
* **html:** discover media elements and attach store target via DOM ([#481](https://github.com/videojs/v10/issues/481)) ([5eab1db](https://github.com/videojs/v10/commit/5eab1dbb2fbb906543f7749e5956c9791c30be34))
* minimal volume slider bug & fix dev infinite bug ([#73](https://github.com/videojs/v10/issues/73)) ([591dab6](https://github.com/videojs/v10/commit/591dab66caf8829017688007320f92b7445c4baa))
* **packages:** enable unbundle mode to avoid mangled exports ([00fdf96](https://github.com/videojs/v10/commit/00fdf966ca5148bcca303058dd798b1b880896e0))
* **packages:** update version badges ([#138](https://github.com/videojs/v10/issues/138)) ([22d9cb6](https://github.com/videojs/v10/commit/22d9cb64f2e5b9601a2039bb166dbe3fee6a1b3e))
* **react, html:** rename MediaProvider (and related) to VideoProvider ([#159](https://github.com/videojs/v10/issues/159)) ([f285573](https://github.com/videojs/v10/commit/f28557359c7dda0282f9d532fa4b2fce19766e40))
* refactor private fields to public with underscore convention ([3cffb4d](https://github.com/videojs/v10/commit/3cffb4d59a94ed2ac41acc7eff775ededef948e1))
* remove `show-remaining` in HTML example ([#137](https://github.com/videojs/v10/issues/137)) ([7dde67a](https://github.com/videojs/v10/commit/7dde67ac927d6aca0f6a9b219ff3f3dc38594805))
* rename attributes to kebab-case ([5195c09](https://github.com/videojs/v10/commit/5195c09af610625f10cb218d14a2a87fc1695701))
* resolve @open-wc/context-protocol module resolution issues ([e5f23ed](https://github.com/videojs/v10/commit/e5f23ed2bbde6bd50f8b87d19733b25b98f78470))
* resolve TypeScript build errors across packages ([374db7a](https://github.com/videojs/v10/commit/374db7afc07d6211bfd3f8079bbcd9613f3b69f3))
* **root:** add videojs keyword to package.json ([4a9f8b2](https://github.com/videojs/v10/commit/4a9f8b2ad6fb27b463dcfe8d1a5fd883c9fa21d1))
* seek jump back to current time ([#22](https://github.com/videojs/v10/issues/22)) ([a3f9630](https://github.com/videojs/v10/commit/a3f9630bd1eb34a16f339ffd30071b8adc864ca0))
* **site:** update discord link ([#170](https://github.com/videojs/v10/issues/170)) ([bb10294](https://github.com/videojs/v10/commit/bb10294419439fb02df650f3e7f7c5496ecc3a73))
* skin syntax usage cleanup ([#48](https://github.com/videojs/v10/issues/48)) ([d4f3f4b](https://github.com/videojs/v10/commit/d4f3f4b75b2c94c47b18242f131ac7050eb54cfc))
* **skins:** remove vjs- prefixed CSS custom properties ([#179](https://github.com/videojs/v10/issues/179)) ([a62623b](https://github.com/videojs/v10/commit/a62623ba41d294edead981a1b468f7f486c91625))
* **skins:** slightly more idiomatic Tailwind, added custom properties ([#175](https://github.com/videojs/v10/issues/175)) ([694afb7](https://github.com/videojs/v10/commit/694afb7de992edbd667bc3d895df8bf198ccabb3))
* **time-display:** clean up time utilities and simplify components ([597e79d](https://github.com/videojs/v10/commit/597e79d7fc12737353c8c9eb3f6e77ef0a04e9ed))
* **typescript:** resolve declaration file generation for rollup packages ([#1](https://github.com/videojs/v10/issues/1)) ([69670e8](https://github.com/videojs/v10/commit/69670e8d7134db34aee665d8871cd17901625915))
* use popover core in react popover ([#208](https://github.com/videojs/v10/issues/208)) ([99fef78](https://github.com/videojs/v10/commit/99fef78f63e8dd121513b9cd20696a7d35603837))
* visually hidden focus guards ([#142](https://github.com/videojs/v10/issues/142)) ([956dad7](https://github.com/videojs/v10/commit/956dad7ff5731d7630526ec97e33c652f260bc13))
* **workspace:** convert pnpm workspace protocol to npm workspace syntax ([fc5a0e4](https://github.com/videojs/v10/commit/fc5a0e46fd15f30245cb743a8006fc097c5b890e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.1
    * @videojs/utils bumped to 10.0.0-alpha.1
