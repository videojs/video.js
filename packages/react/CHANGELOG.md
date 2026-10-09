# Changelog

## [10.1.0](https://github.com/videojs/video.js/compare/@videojs/react@10.0.1...@videojs/react@10.1.0) (2026-10-09)


### Features

* **playerjs-video:** add player.js embed media ([#9247](https://github.com/videojs/video.js/issues/9247)) ([b56d02d](https://github.com/videojs/video.js/commit/b56d02d33bdda01f1aaec1c5ada893002932ce5f))
* **react:** link native media fallback to videojs.org/help ([#9382](https://github.com/videojs/video.js/issues/9382)) ([3f5f75d](https://github.com/videojs/video.js/commit/3f5f75d6fbf49c2425c236e57da23be2070e97a8))
* **skin:** add scaffold skin ([#9251](https://github.com/videojs/video.js/issues/9251)) ([c39479b](https://github.com/videojs/video.js/commit/c39479baf04c906d8fe732bf1e93a5483c6b1cc4))
* **spf:** send credentials with hls requests for crossorigin="use-credentials" ([#2870](https://github.com/videojs/video.js/issues/2870)) ([897901b](https://github.com/videojs/video.js/commit/897901b88359dca0dc3e59fcecd766cb59f8fe24))


### Bug Fixes

* **core:** sample playback time on animation frames ([88e229c](https://github.com/videojs/video.js/commit/88e229cf6a6ae110f8a2a041efd2ba0f8fc57a66))
* **core:** smooth time slider playback progress ([50f59a2](https://github.com/videojs/video.js/commit/50f59a23f1ca2c394998ba38cc274df6154ef214))
* **core:** smooth time slider playback progress ([6a21d0b](https://github.com/videojs/video.js/commit/6a21d0b4ee6211f705edc3efbac36bc53cb8855f))
* **core:** stop extrapolating stalled native media time ([7d88ca2](https://github.com/videojs/video.js/commit/7d88ca248ec6b9a2b0acb5e251f7b7e1b1d72a5c))
* **core:** sync time slider progress with seekable ranges ([5fe31de](https://github.com/videojs/video.js/commit/5fe31def6689ac4a84a2f619afeb3d51f104ae19))


### Performance Improvements

* **core:** skip semantic updates on time slider frames ([258fafb](https://github.com/videojs/video.js/commit/258fafb32814be36e67c390bf1ffdb64e1fe1a41))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.1.0
    * @videojs/media bumped to 10.1.0
    * @videojs/native-hls-video bumped to 10.1.0
    * @videojs/spf bumped to 10.1.0
    * @videojs/store bumped to 10.1.0
    * @videojs/utils bumped to 10.1.0
  * devDependencies
    * @videojs/cloudflare-video bumped to 10.1.0
    * @videojs/dash-video bumped to 10.1.0
    * @videojs/google-cast bumped to 10.1.0
    * @videojs/hlsjs-video bumped to 10.1.0
    * @videojs/icons bumped to 10.1.0
    * @videojs/mux-audio bumped to 10.1.0
    * @videojs/mux-data bumped to 10.1.0
    * @videojs/mux-video bumped to 10.1.0
    * @videojs/playerjs-video bumped to 10.1.0
    * @videojs/shaka-video bumped to 10.1.0
    * @videojs/spf bumped to 10.1.0
    * @videojs/spotify-audio bumped to 10.1.0
    * @videojs/tiktok-video bumped to 10.1.0
    * @videojs/twitch-video bumped to 10.1.0
    * @videojs/vimeo-video bumped to 10.1.0
    * @videojs/wistia-video bumped to 10.1.0
    * @videojs/youtube-video bumped to 10.1.0
  * peerDependencies
    * @videojs/cloudflare-video bumped to 10.1.0
    * @videojs/dash-video bumped to 10.1.0
    * @videojs/google-cast bumped to 10.1.0
    * @videojs/hlsjs-video bumped to 10.1.0
    * @videojs/mux-audio bumped to 10.1.0
    * @videojs/mux-data bumped to 10.1.0
    * @videojs/mux-video bumped to 10.1.0
    * @videojs/playerjs-video bumped to 10.1.0
    * @videojs/shaka-video bumped to 10.1.0
    * @videojs/spotify-audio bumped to 10.1.0
    * @videojs/tiktok-video bumped to 10.1.0
    * @videojs/twitch-video bumped to 10.1.0
    * @videojs/vimeo-video bumped to 10.1.0
    * @videojs/wistia-video bumped to 10.1.0
    * @videojs/youtube-video bumped to 10.1.0

## [10.0.1](https://github.com/videojs/v10/compare/@videojs/react@10.0.0...@videojs/react@10.0.1) (2026-10-02)


### Bug Fixes

* **react:** accept autoPlay on embeds and drop callback-ref cleanups that warn on React 18 ([#3136](https://github.com/videojs/v10/issues/3136)) ([f0c2782](https://github.com/videojs/v10/commit/f0c27823c2a8e15c926e39f0ec866e37dd1a2a43))
* **react:** hand the playback adapter to mediaRef on adapter-backed media ([#3141](https://github.com/videojs/v10/issues/3141)) ([ef04287](https://github.com/videojs/v10/commit/ef04287a200fcf2150005e717b30d6d528537559))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.1
    * @videojs/media bumped to 10.0.1
    * @videojs/native-hls-video bumped to 10.0.1
    * @videojs/spf bumped to 10.0.1
    * @videojs/store bumped to 10.0.1
    * @videojs/utils bumped to 10.0.1
  * devDependencies
    * @videojs/cloudflare-video bumped to 10.0.1
    * @videojs/dash-video bumped to 10.0.1
    * @videojs/google-cast bumped to 10.0.1
    * @videojs/hlsjs-video bumped to 10.0.1
    * @videojs/icons bumped to 10.0.1
    * @videojs/mux-audio bumped to 10.0.1
    * @videojs/mux-data bumped to 10.0.1
    * @videojs/mux-video bumped to 10.0.1
    * @videojs/shaka-video bumped to 10.0.1
    * @videojs/spf bumped to 10.0.1
    * @videojs/spotify-audio bumped to 10.0.1
    * @videojs/tiktok-video bumped to 10.0.1
    * @videojs/twitch-video bumped to 10.0.1
    * @videojs/vimeo-video bumped to 10.0.1
    * @videojs/wistia-video bumped to 10.0.1
    * @videojs/youtube-video bumped to 10.0.1
  * peerDependencies
    * @videojs/cloudflare-video bumped to 10.0.1
    * @videojs/dash-video bumped to 10.0.1
    * @videojs/google-cast bumped to 10.0.1
    * @videojs/hlsjs-video bumped to 10.0.1
    * @videojs/mux-audio bumped to 10.0.1
    * @videojs/mux-data bumped to 10.0.1
    * @videojs/mux-video bumped to 10.0.1
    * @videojs/shaka-video bumped to 10.0.1
    * @videojs/spotify-audio bumped to 10.0.1
    * @videojs/tiktok-video bumped to 10.0.1
    * @videojs/twitch-video bumped to 10.0.1
    * @videojs/vimeo-video bumped to 10.0.1
    * @videojs/wistia-video bumped to 10.0.1
    * @videojs/youtube-video bumped to 10.0.1

## [10.0.0](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-rc.5...@videojs/react@10.0.0) (2026-10-01)


### Features

* **packages:** release Video.js 10.0.0 as stable ([#3058](https://github.com/videojs/v10/issues/3058)) ([37477fc](https://github.com/videojs/v10/commit/37477fc187f36fc2ab3cbc0db7c1b2d3fc6bcca9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0
    * @videojs/media bumped to 10.0.0
    * @videojs/native-hls-video bumped to 10.0.0
    * @videojs/spf bumped to 10.0.0
    * @videojs/store bumped to 10.0.0
    * @videojs/utils bumped to 10.0.0
  * devDependencies
    * @videojs/cloudflare-video bumped to 10.0.0
    * @videojs/dash-video bumped to 10.0.0
    * @videojs/google-cast bumped to 10.0.0
    * @videojs/hlsjs-video bumped to 10.0.0
    * @videojs/icons bumped to 10.0.0
    * @videojs/mux-audio bumped to 10.0.0
    * @videojs/mux-data bumped to 10.0.0
    * @videojs/mux-video bumped to 10.0.0
    * @videojs/shaka-video bumped to 10.0.0
    * @videojs/spf bumped to 10.0.0
    * @videojs/spotify-audio bumped to 10.0.0
    * @videojs/tiktok-video bumped to 10.0.0
    * @videojs/twitch-video bumped to 10.0.0
    * @videojs/vimeo-video bumped to 10.0.0
    * @videojs/wistia-video bumped to 10.0.0
    * @videojs/youtube-video bumped to 10.0.0
  * peerDependencies
    * @videojs/cloudflare-video bumped to 10.0.0
    * @videojs/dash-video bumped to 10.0.0
    * @videojs/google-cast bumped to 10.0.0
    * @videojs/hlsjs-video bumped to 10.0.0
    * @videojs/mux-audio bumped to 10.0.0
    * @videojs/mux-data bumped to 10.0.0
    * @videojs/mux-video bumped to 10.0.0
    * @videojs/shaka-video bumped to 10.0.0
    * @videojs/spotify-audio bumped to 10.0.0
    * @videojs/tiktok-video bumped to 10.0.0
    * @videojs/twitch-video bumped to 10.0.0
    * @videojs/vimeo-video bumped to 10.0.0
    * @videojs/wistia-video bumped to 10.0.0
    * @videojs/youtube-video bumped to 10.0.0

## [10.0.0-rc.5](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-rc.4...@videojs/react@10.0.0-rc.5) (2026-10-01)


### ⚠ BREAKING CHANGES

* **packages:** rename the minimal skin to neutral ([#3092](https://github.com/videojs/v10/issues/3092))
* **packages:** attach extensions at the player ([#2880](https://github.com/videojs/v10/issues/2880))
* **media:** tidy text track state ([#3057](https://github.com/videojs/v10/issues/3057))
* **core:** align player store API ([#3012](https://github.com/videojs/v10/issues/3012))

### Features

* **core:** add deriveCustomStatus to display custom actions ([#3064](https://github.com/videojs/v10/issues/3064)) ([5b4ed5e](https://github.com/videojs/v10/commit/5b4ed5e323f48b0f674f0c5640ee41c527f10f81))
* **media:** add resolveAdapterType and resolveMimeType ([#3024](https://github.com/videojs/v10/issues/3024)) ([a77010c](https://github.com/videojs/v10/commit/a77010c77ff4971a9f7f1c43d5c24c20ee67d505))
* **packages:** export a per-package VERSION from core, html, and react ([#3078](https://github.com/videojs/v10/issues/3078)) ([bd8f072](https://github.com/videojs/v10/commit/bd8f072a6591079b64baf20b18af52a415195b97))
* **react:** add mediaRef prop to media components ([#3098](https://github.com/videojs/v10/issues/3098)) ([571fb68](https://github.com/videojs/v10/commit/571fb68e9f876554ba1365aab5407b5ad5286a8b))
* **skin:** add compat skin ([#3026](https://github.com/videojs/v10/issues/3026)) ([5d419de](https://github.com/videojs/v10/commit/5d419de6980310364c36ffe6bc131573ac8b785d))


### Bug Fixes

* **packages:** name Video.js 10 in npm descriptions and keywords ([#2995](https://github.com/videojs/v10/issues/2995)) ([8fda9a3](https://github.com/videojs/v10/commit/8fda9a36bede5cf92d446e25e56a96625cd60bc9))
* **react:** declare client boundaries per module ([#3079](https://github.com/videojs/v10/issues/3079)) ([39ff910](https://github.com/videojs/v10/commit/39ff910d50567037850ba6f11c2c8883dd7974bb))


### Code Refactoring

* **core:** align player store API ([#3012](https://github.com/videojs/v10/issues/3012)) ([d1f57f8](https://github.com/videojs/v10/commit/d1f57f8ea733d10247b8e9bd9f8b5577e52ed66b))
* **media:** tidy text track state ([#3057](https://github.com/videojs/v10/issues/3057)) ([614b77d](https://github.com/videojs/v10/commit/614b77dce7d9a3ed60baa1b0e2af854c8c8d865b))
* **packages:** attach extensions at the player ([#2880](https://github.com/videojs/v10/issues/2880)) ([9b6675e](https://github.com/videojs/v10/commit/9b6675e3cfe50e3b54f4d4d07a563a4fdc712291))
* **packages:** rename the minimal skin to neutral ([#3092](https://github.com/videojs/v10/issues/3092)) ([1d1eafc](https://github.com/videojs/v10/commit/1d1eafc022f78135a292035bc58fdb4befb6401e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-rc.5
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
    * @videojs/spf bumped to 10.0.0-rc.5
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

## [10.0.0-rc.4](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-rc.3...@videojs/react@10.0.0-rc.4) (2026-09-26)


### Miscellaneous Chores

* **@videojs/react:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-rc.4
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
    * @videojs/spf bumped to 10.0.0-rc.4
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

## [10.0.0-rc.3](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-rc.2...@videojs/react@10.0.0-rc.3) (2026-09-25)


### Features

* about-this-player page and a help link in every player ([#2758](https://github.com/videojs/v10/issues/2758)) ([8a538a5](https://github.com/videojs/v10/commit/8a538a572945c2bb01cb79d38f420ec143a4239c))
* **installation:** add versioned agent instructions ([#2948](https://github.com/videojs/v10/issues/2948)) ([a602f22](https://github.com/videojs/v10/commit/a602f220aedf9c2800983daade6ca298ada007ab))
* **skin:** add title display ([#2748](https://github.com/videojs/v10/issues/2748)) ([bc007bd](https://github.com/videojs/v10/commit/bc007bd9c01083507f493883b6eb047992937f79))
* **skin:** slot the slider thumbnail image ([#2700](https://github.com/videojs/v10/issues/2700)) ([b68563f](https://github.com/videojs/v10/commit/b68563f62595e19c8bfc0d3c88147ea74c4473ef))
* **spf:** add EME-based DRM support to the HLS engine ([#2291](https://github.com/videojs/v10/issues/2291)) ([fd6785e](https://github.com/videojs/v10/commit/fd6785e00df4ed705ed4c9479fcfdfbaf221f7e1))


### Bug Fixes

* **core:** apply popup starting styles before showing ([#2715](https://github.com/videojs/v10/issues/2715)) ([a80aeca](https://github.com/videojs/v10/commit/a80aecadecc1a7dee643c6a7200cc09dfa8c4f9e))
* **packages:** keep the time slider interactive without the buffer feature ([#2869](https://github.com/videojs/v10/issues/2869)) ([1c629d6](https://github.com/videojs/v10/commit/1c629d612dd976bf84d404178a2cdb728a63d72e))
* **packages:** prevent menu highlight flicker ([#2969](https://github.com/videojs/v10/issues/2969)) ([461dbcf](https://github.com/videojs/v10/commit/461dbcfdde0c13481f6604cfe5632f9af6232416))
* **react:** forward refs to plain function render targets on react 18 ([#2842](https://github.com/videojs/v10/issues/2842)) ([a523f05](https://github.com/videojs/v10/commit/a523f05a02709c4bea6a88a72a0c4176af83bafd))
* **react:** keep media attached when the composed ref changes identity ([#2729](https://github.com/videojs/v10/issues/2729)) ([a685b18](https://github.com/videojs/v10/commit/a685b18782f27e5b8d94f83997882784217bcd83))
* **react:** route media event props on embed medias ([#2712](https://github.com/videojs/v10/issues/2712)) ([0743e3b](https://github.com/videojs/v10/commit/0743e3b22b515567480c7bf2521415b6b73c152f))
* **react:** volume popover not working with react compiler ([#2742](https://github.com/videojs/v10/issues/2742)) ([ab878d9](https://github.com/videojs/v10/commit/ab878d9b9de71bfabd1607bbbaa62bf3831e0444))


### Performance Improvements

* **site:** faster docs dev server start ([#2698](https://github.com/videojs/v10/issues/2698)) ([33d3887](https://github.com/videojs/v10/commit/33d38873ed5337a5695eaa426a5ebfbea61356d2))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-rc.3
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
    * @videojs/spf bumped to 10.0.0-rc.3
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

## [10.0.0-rc.2](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-rc.1...@videojs/react@10.0.0-rc.2) (2026-09-09)


### ⚠ BREAKING CHANGES

* **react:** make slider thumbnail composable ([#2568](https://github.com/videojs/v10/issues/2568))
* **react:** make thumbnail composable ([#2566](https://github.com/videojs/v10/issues/2566))
* **react:** make poster composable ([#2563](https://github.com/videojs/v10/issues/2563))

### Features

* **packages:** handle controls before media metadata ([#2525](https://github.com/videojs/v10/issues/2525)) ([feed475](https://github.com/videojs/v10/commit/feed475b42186340162b92e3366f132729b6b0f9))
* **react:** make poster composable ([#2563](https://github.com/videojs/v10/issues/2563)) ([def9bf2](https://github.com/videojs/v10/commit/def9bf21d39cce091bf31c1b36651fceb8c25687))
* **react:** make slider thumbnail composable ([#2568](https://github.com/videojs/v10/issues/2568)) ([03fdbc6](https://github.com/videojs/v10/commit/03fdbc628350b3eab41be209f3ea99a2415f4ab8))
* **react:** make thumbnail composable ([#2566](https://github.com/videojs/v10/issues/2566)) ([55b36ab](https://github.com/videojs/v10/commit/55b36ab31a07ae54ca084bd470a61cfc760a8e13))


### Bug Fixes

* **packages:** stabilize slider keyboard input ([#2553](https://github.com/videojs/v10/issues/2553)) ([bd9d946](https://github.com/videojs/v10/commit/bd9d9466df1a9c0cf2fb1fbbf5ed0dfe6302d2c6))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-rc.2
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
    * @videojs/spf bumped to 10.0.0-rc.2
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

## [10.0.0-rc.1](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.32...@videojs/react@10.0.0-rc.1) (2026-09-08)


### ⚠ BREAKING CHANGES

* **packages:** adapter renaming ([#2602](https://github.com/videojs/v10/issues/2602))
* **packages:** MediaComponent => MediaExtension ([#2601](https://github.com/videojs/v10/issues/2601))
* **packages:** extension renaming ([#2600](https://github.com/videojs/v10/issues/2600))
* **packages:** playback adapters packages ([#2567](https://github.com/videojs/v10/issues/2567))
* **packages:** move integrations to extension paths ([#2577](https://github.com/videojs/v10/issues/2577))

### Features

* **packages:** add wistia video media ([#2305](https://github.com/videojs/v10/issues/2305)) ([306c733](https://github.com/videojs/v10/commit/306c7333fc100308a7ac59c8edaa08dbc5c64d58))
* **packages:** share menu option state across targets ([#2528](https://github.com/videojs/v10/issues/2528)) ([4392cd6](https://github.com/videojs/v10/commit/4392cd6f7fa92dd3bb329b5a92206f5bf27a75b2))
* **skin:** define Shadcn registry catalog ([#2544](https://github.com/videojs/v10/issues/2544)) ([41096c9](https://github.com/videojs/v10/commit/41096c97381975417ba504af47411231e46e807e))
* **skin:** generate framework skins from registry ([#2545](https://github.com/videojs/v10/issues/2545)) ([60c7b0b](https://github.com/videojs/v10/commit/60c7b0ba5441b4463e4d04f6a71660ae24eeb345))
* **vjsc:** add named render targets ([#2527](https://github.com/videojs/v10/issues/2527)) ([5b606d2](https://github.com/videojs/v10/commit/5b606d2026bb9528167f64b4b731145ceb1224f2))


### Bug Fixes

* **packages:** align dialog styles across skins ([#2481](https://github.com/videojs/v10/issues/2481)) ([9601006](https://github.com/videojs/v10/commit/9601006ede03d295f1c2811db6eee0f768e30bd3))
* **packages:** contain error dialogs in player layouts ([#2451](https://github.com/videojs/v10/issues/2451)) ([f18c59a](https://github.com/videojs/v10/commit/f18c59a159d96b2dc1b2407d3f8a0589f076cbc9))
* **packages:** isolate focused slider hotkeys ([#2474](https://github.com/videojs/v10/issues/2474)) ([0f7b08f](https://github.com/videojs/v10/commit/0f7b08f8a9c8948cf35a0b1c8d4d411f1bf166c3))
* **packages:** preserve fullscreen after pointer activation ([#2472](https://github.com/videojs/v10/issues/2472)) ([b526c44](https://github.com/videojs/v10/commit/b526c444efae99873946eafa607673b19c6978f0))
* **packages:** reject invalid gesture types ([#2473](https://github.com/videojs/v10/issues/2473)) ([0da416a](https://github.com/videojs/v10/commit/0da416aa3a5d08bc23ec968593b7f3beee00d204))
* **packages:** restore ejected player registration and slider press locking ([#2505](https://github.com/videojs/v10/issues/2505)) ([36bb836](https://github.com/videojs/v10/commit/36bb83600622aff75169f4fe5d039f17e9f1f7d9))
* **packages:** scope error dialogs to player containers ([#2449](https://github.com/videojs/v10/issues/2449)) ([9fbc979](https://github.com/videojs/v10/commit/9fbc9790189b5df8d5d047eaf01605d6e8d7fb6b))
* **packages:** share input action defaults ([#2484](https://github.com/videojs/v10/issues/2484)) ([db1221c](https://github.com/videojs/v10/commit/db1221c7ebd019b58dced646fc4223d816e48bca))
* **skins:** harden shadcn registry delivery ([#2576](https://github.com/videojs/v10/issues/2576)) ([331cf7b](https://github.com/videojs/v10/commit/331cf7b5a602acd81f392bcb03d1a26c50ad1898))
* **skins:** improve generated skin parity ([#2580](https://github.com/videojs/v10/issues/2580)) ([c8b7006](https://github.com/videojs/v10/commit/c8b7006a55f71b2a0d257413cac2091792278560))


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
    * @videojs/spf bumped to 10.0.0-rc.1
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

## [10.0.0-beta.32](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.31...@videojs/react@10.0.0-beta.32) (2026-08-26)


### ⚠ BREAKING CHANGES

* **packages:** separate controls content and backdrop surfaces ([#2436](https://github.com/videojs/v10/issues/2436))
* **packages:** separate dialog popup and backdrop surfaces ([#2435](https://github.com/videojs/v10/issues/2435))

### Features

* **packages:** add backdrop component parts ([#2343](https://github.com/videojs/v10/issues/2343)) ([81bb99a](https://github.com/videojs/v10/commit/81bb99abbce0af138d8dcfd04d456a3d654424ca))
* **packages:** add dialog component ([#2379](https://github.com/videojs/v10/issues/2379)) ([108b8fd](https://github.com/videojs/v10/commit/108b8fda826a870bf29453289a0081ebd7df890c))
* **packages:** add volume popover compound ([#2378](https://github.com/videojs/v10/issues/2378)) ([a23fdd9](https://github.com/videojs/v10/commit/a23fdd93e56c07aab53cad0e66672926b1582411))
* **packages:** expose container controls state ([#2376](https://github.com/videojs/v10/issues/2376)) ([30065dd](https://github.com/videojs/v10/commit/30065dd1980c35484b41b3a4925a6ef049aae6a0))
* **packages:** separate controls content and backdrop surfaces ([#2436](https://github.com/videojs/v10/issues/2436)) ([7a6ccb0](https://github.com/videojs/v10/commit/7a6ccb0058c0a15fa30fd07cef3f662ac121d90c))
* **packages:** separate dialog popup and backdrop surfaces ([#2435](https://github.com/videojs/v10/issues/2435)) ([0065e9f](https://github.com/videojs/v10/commit/0065e9f77ced3a5f9878e135c5a1bcd1825f229d))


### Bug Fixes

* **i18n:** preserve registered translation overrides ([#2354](https://github.com/videojs/v10/issues/2354)) ([c6307e9](https://github.com/videojs/v10/commit/c6307e9830262441fa557da43984ef428a86f57f))
* **packages:** add audio playback rate tooltips ([#2389](https://github.com/videojs/v10/issues/2389)) ([bc9fd5f](https://github.com/videojs/v10/commit/bc9fd5f81d1b50300f50ae9a71d1e5bb4b7a0e85))
* **packages:** improve menu behavior and sizing ([#2440](https://github.com/videojs/v10/issues/2440)) ([0d90572](https://github.com/videojs/v10/commit/0d9057268c59d17a4c91f1f84a60333cf082fd38))
* **packages:** restore minimal volume controls ([#2386](https://github.com/videojs/v10/issues/2386)) ([2e9c1e2](https://github.com/videojs/v10/commit/2e9c1e221e4eca5dbc76e01718fabf82c433a483))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.32
    * @videojs/media bumped to 10.0.0-beta.32
    * @videojs/spf bumped to 10.0.0-beta.32
    * @videojs/store bumped to 10.0.0-beta.32
    * @videojs/utils bumped to 10.0.0-beta.32
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.32
    * @videojs/skins bumped to 10.0.0-beta.32

## [10.0.0-beta.31](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.30...@videojs/react@10.0.0-beta.31) (2026-08-21)


### Features

* **packages:** add right-to-left player support ([#2281](https://github.com/videojs/v10/issues/2281)) ([caf179b](https://github.com/videojs/v10/commit/caf179b83260a242a7ff284d1d474f97a91988a9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.31
    * @videojs/media bumped to 10.0.0-beta.31
    * @videojs/spf bumped to 10.0.0-beta.31
    * @videojs/store bumped to 10.0.0-beta.31
    * @videojs/utils bumped to 10.0.0-beta.31
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.31
    * @videojs/skins bumped to 10.0.0-beta.31

## [10.0.0-beta.30](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.29...@videojs/react@10.0.0-beta.30) (2026-08-20)


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
    * @videojs/media bumped to 10.0.0-beta.30
    * @videojs/spf bumped to 10.0.0-beta.30
    * @videojs/store bumped to 10.0.0-beta.30
    * @videojs/utils bumped to 10.0.0-beta.30
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.30
    * @videojs/skins bumped to 10.0.0-beta.30

## [10.0.0-beta.29](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.28...@videojs/react@10.0.0-beta.29) (2026-08-19)


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
    * @videojs/media bumped to 10.0.0-beta.29
    * @videojs/spf bumped to 10.0.0-beta.29
    * @videojs/store bumped to 10.0.0-beta.29
    * @videojs/utils bumped to 10.0.0-beta.29
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.29
    * @videojs/skins bumped to 10.0.0-beta.29

## [10.0.0-beta.28](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.27...@videojs/react@10.0.0-beta.28) (2026-08-19)


### Features

* **media:** add maxAutoResolution cap to hls.js sources ([#2061](https://github.com/videojs/v10/issues/2061)) ([414513f](https://github.com/videojs/v10/commit/414513f03db856e860a882921927a12e7d57c470))
* **media:** cap hls.js renditions to the player size ([#2243](https://github.com/videojs/v10/issues/2243)) ([e5dd81a](https://github.com/videojs/v10/commit/e5dd81ad6c255a0203a731a03985e44c91ae1bc3))


### Bug Fixes

* **core:** include menu triggers in tab order ([#2238](https://github.com/videojs/v10/issues/2238)) ([8eebaef](https://github.com/videojs/v10/commit/8eebaefc1b2438ea45b1b28df09ef6aef2b2bde6))
* **packages:** restore menu trigger keyboard interaction ([#2235](https://github.com/videojs/v10/issues/2235)) ([0b193a5](https://github.com/videojs/v10/commit/0b193a5d365a200d045dd8b306affde919ad6ac7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.28
    * @videojs/media bumped to 10.0.0-beta.28
    * @videojs/spf bumped to 10.0.0-beta.28
    * @videojs/store bumped to 10.0.0-beta.28
    * @videojs/utils bumped to 10.0.0-beta.28
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.28
    * @videojs/skins bumped to 10.0.0-beta.28

## [10.0.0-beta.27](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.26...@videojs/react@10.0.0-beta.27) (2026-08-17)


### ⚠ BREAKING CHANGES

* **packages:** normalize time slider chapters ([#2204](https://github.com/videojs/v10/issues/2204))
* **packages:** remove containers from createPlayer ([#2154](https://github.com/videojs/v10/issues/2154))
* **react:** simplify createPlayer and preset exports ([#2116](https://github.com/videojs/v10/issues/2116))
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
* **react:** add audio track radio group ([#2124](https://github.com/videojs/v10/issues/2124)) ([4867f8a](https://github.com/videojs/v10/commit/4867f8a6924b9658f0979657ca6f393554b6e008))
* **react:** add captions radio group ([#2127](https://github.com/videojs/v10/issues/2127)) ([979458f](https://github.com/videojs/v10/commit/979458fccd6127eff7da74cf528e2f4bc26d2297))
* **react:** add quality radio group ([#2132](https://github.com/videojs/v10/issues/2132)) ([29171b7](https://github.com/videojs/v10/commit/29171b79ff282efe355864ea18d95382ae9bc9a6))
* **skin:** add canonical container, poster, and overlay ([#2179](https://github.com/videojs/v10/issues/2179)) ([4f72ee7](https://github.com/videojs/v10/commit/4f72ee7092f7b909c8c892af1f94a10297c97338))
* **skin:** build pipeline ([#2021](https://github.com/videojs/v10/issues/2021)) ([9381a34](https://github.com/videojs/v10/commit/9381a34025848812325f47634c4e745ba9103f11))
* **skin:** setup react compiler plugin ([#2006](https://github.com/videojs/v10/issues/2006)) ([9b0e44b](https://github.com/videojs/v10/commit/9b0e44b11ff5f08145b8f45eed3899aff7a90f0c))
* **spf:** add the SPF-backed Mux Media, elements, and components ([#2045](https://github.com/videojs/v10/issues/2045)) ([d1d1673](https://github.com/videojs/v10/commit/d1d1673ecd17e1ca1492abc5b396296bb8c7b176))


### Bug Fixes

* **i18n:** improve locale translations ([#1914](https://github.com/videojs/v10/issues/1914)) ([12cc939](https://github.com/videojs/v10/commit/12cc939f58f4ad2db7218374d96c5aa690ca49e5))
* **i18n:** improve time inversion labels ([#2028](https://github.com/videojs/v10/issues/2028)) ([eeb216a](https://github.com/videojs/v10/commit/eeb216ad2f7dbfe83ec214cb49fc7fb990ff1a7f))
* **media:** hook the media's actual playback engine in mux data ([#2040](https://github.com/videojs/v10/issues/2040)) ([501af91](https://github.com/videojs/v10/commit/501af9168c92a3ef757ff6de010c86a495df11f4))
* **packages:** add settings tooltip ([#1915](https://github.com/videojs/v10/issues/1915)) ([96d2e05](https://github.com/videojs/v10/commit/96d2e05147cd973900bb88b5ac5abf8e93fdbe8d))
* **packages:** build iframe media embeds when the source arrives after attach ([#2118](https://github.com/videojs/v10/issues/2118)) ([b8bffc5](https://github.com/videojs/v10/commit/b8bffc54ab00d731fdf7b9194bc4d50e022059de))
* **packages:** improve ui motion ([#2208](https://github.com/videojs/v10/issues/2208)) ([42f934e](https://github.com/videojs/v10/commit/42f934e9bea4e4961d63d6de1e2eebcc520f8237))
* **packages:** keep controls visible during active interactions ([#1900](https://github.com/videojs/v10/issues/1900)) ([35616db](https://github.com/videojs/v10/commit/35616db5a38d193f1fc114da4af68a79f08093f1))
* **packages:** menu keyboard navigation ([#2214](https://github.com/videojs/v10/issues/2214)) ([15e3ba6](https://github.com/videojs/v10/commit/15e3ba6af98d104739904192afaacccd37014216))
* **packages:** preserve shared popup anchors ([#1933](https://github.com/videojs/v10/issues/1933)) ([cd98428](https://github.com/videojs/v10/commit/cd9842869118bef284c063368710c00e8560f9de))
* **packages:** scope popup groups to containers ([#2083](https://github.com/videojs/v10/issues/2083)) ([453d949](https://github.com/videojs/v10/commit/453d949c7f80c39194170883a6d6ce240d827e46))
* **packages:** stabilize popup positioning ([#1931](https://github.com/videojs/v10/issues/1931)) ([1fbccf0](https://github.com/videojs/v10/commit/1fbccf062f34f0cc8a5eb162a10991180363b052))
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
* **react:** simplify createPlayer and preset exports ([#2116](https://github.com/videojs/v10/issues/2116)) ([bd665e6](https://github.com/videojs/v10/commit/bd665e658f9a43bec24ec617cc4149df89a46b12))
* **skin:** css clean up and API stabilization ([#2094](https://github.com/videojs/v10/issues/2094)) ([39a0291](https://github.com/videojs/v10/commit/39a0291be7cad177e09bf7b4c8e74592a17b3744))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.27
    * @videojs/media bumped to 10.0.0-beta.27
    * @videojs/spf bumped to 10.0.0-beta.27
    * @videojs/store bumped to 10.0.0-beta.27
    * @videojs/utils bumped to 10.0.0-beta.27
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.27
    * @videojs/skins bumped to 10.0.0-beta.27

## [10.0.0-beta.26](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.25...@videojs/react@10.0.0-beta.26) (2026-08-02)


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

* **i18n:** error text updates ([#1822](https://github.com/videojs/v10/issues/1822)) ([82b9e43](https://github.com/videojs/v10/commit/82b9e43bb5fee613031f653b575df015d6187d6f))
* **packages:** prevent controls click triggering interactions ([#1885](https://github.com/videojs/v10/issues/1885)) ([0f4a9b4](https://github.com/videojs/v10/commit/0f4a9b4127d3fbb59b11e278af70c23f83f51c6f))
* **sandbox:** prevent css causing full app refresh ([#1869](https://github.com/videojs/v10/issues/1869)) ([5cb93c1](https://github.com/videojs/v10/commit/5cb93c17010dbb5eabb3fff71250bea13b211043))


### Code Refactoring

* **media:** extract media package from core ([#1879](https://github.com/videojs/v10/issues/1879)) ([75dcc66](https://github.com/videojs/v10/commit/75dcc6675bd19e9be05c4e295830c80c0ca2180f))
* **packages:** replace button availability with disabled and hidden state ([#1474](https://github.com/videojs/v10/issues/1474)) ([066227d](https://github.com/videojs/v10/commit/066227de5819570a339fd0e291fc236c51632017))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.26
    * @videojs/media bumped to 10.0.0-beta.26
    * @videojs/spf bumped to 10.0.0-beta.26
    * @videojs/store bumped to 10.0.0-beta.26
    * @videojs/utils bumped to 10.0.0-beta.26
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.26
    * @videojs/skins bumped to 10.0.0-beta.26

## [10.0.0-beta.25](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.24...@videojs/react@10.0.0-beta.25) (2026-07-07)


### ⚠ BREAKING CHANGES

* **packages:** rename hls media stack to hlsjs naming ([#1753](https://github.com/videojs/v10/issues/1753))
* **core:** move media capability predicates to core layer ([#1705](https://github.com/videojs/v10/issues/1705))
* **media:** add Google Cast by default to HLS, DASH media ([#1661](https://github.com/videojs/v10/issues/1661))

### Features

* **core:** add built-in locale packs and lazy loadLocale ([#1590](https://github.com/videojs/v10/issues/1590)) ([9170a58](https://github.com/videojs/v10/commit/9170a5879e5a41089d575e41dc4eca7bf9677b65))
* **core:** add i18n foundation with English locale and UI wiring ([#1589](https://github.com/videojs/v10/issues/1589)) ([768bf09](https://github.com/videojs/v10/commit/768bf09da07a728874da232c7cdefb653534e078))
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

* **packages:** handle menu child mutations ([#1739](https://github.com/videojs/v10/issues/1739)) ([9ab7ade](https://github.com/videojs/v10/commit/9ab7adefb729a4a3c5f5285436d532cf6b0532b4))
* **packages:** scope menu data attributes ([#1628](https://github.com/videojs/v10/issues/1628)) ([01a2115](https://github.com/videojs/v10/commit/01a2115aabe201d8aa293a4ad30badd7e1b69666))
* **react:** address stale media reference ([#1677](https://github.com/videojs/v10/issues/1677)) ([b9e0a75](https://github.com/videojs/v10/commit/b9e0a75c1b9933d34cfae98f39926d45c89eba15))
* **react:** memoize Provider context value ([#1787](https://github.com/videojs/v10/issues/1787)) ([6f6657a](https://github.com/videojs/v10/commit/6f6657a19873155d7c0c7ecf515e7bc230a2e2b0))
* **react:** recover from StoreError: DESTROYED on React &lt;Activity&gt; hide/reveal ([#1587](https://github.com/videojs/v10/issues/1587)) ([058fb8c](https://github.com/videojs/v10/commit/058fb8cfdd32d3ee514b43a48e3dbf2dd09b1020))
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
    * @videojs/spf bumped to 10.0.0-beta.25
    * @videojs/store bumped to 10.0.0-beta.25
    * @videojs/utils bumped to 10.0.0-beta.25
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.25
    * @videojs/skins bumped to 10.0.0-beta.25

## [10.0.0-beta.24](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.23...@videojs/react@10.0.0-beta.24) (2026-05-19)


### Features

* **core:** menu core layer and DOM keyboard navigation ([#1503](https://github.com/videojs/v10/issues/1503)) ([e3c1b28](https://github.com/videojs/v10/commit/e3c1b280325493909ef1da193855832b8c51fb48))
* **packages:** add live button component ([#1473](https://github.com/videojs/v10/issues/1473)) ([e37d5df](https://github.com/videojs/v10/commit/e37d5df87352088a9287bd46b14759965c154b76))
* **packages:** add playback rate menu ([#1527](https://github.com/videojs/v10/issues/1527)) ([ad831d2](https://github.com/videojs/v10/commit/ad831d25f00187929e6eed93770422fa7003071c))
* **packages:** add UI support for gestures and hotkeys ([#1388](https://github.com/videojs/v10/issues/1388)) ([0620814](https://github.com/videojs/v10/commit/0620814a6726da5705b28b1e576dfa3a49b92108))
* **packages:** ship bundled markdown docs in html and react tarballs ([#1560](https://github.com/videojs/v10/issues/1560)) ([20e77d3](https://github.com/videojs/v10/commit/20e77d37fa458c52eb6b14269fd8582bee72281a))
* **spf:** HLS engine composition walkthrough + doc-driven cleanups ([#1512](https://github.com/videojs/v10/issues/1512)) ([0cfd3bb](https://github.com/videojs/v10/commit/0cfd3bb395332b19cf85e9dc7eb08f656bec3e2b))


### Bug Fixes

* **icons:** use icon exports in ejected skins ([#1489](https://github.com/videojs/v10/issues/1489)) ([d0b36ed](https://github.com/videojs/v10/commit/d0b36ed5b80f9614687d0dd584232cf74d4fb3ca))
* **react:** replace any with unknown in isRenderProp type guard ([#1500](https://github.com/videojs/v10/issues/1500)) ([cc22f9f](https://github.com/videojs/v10/commit/cc22f9fa81842c522af7f7a4d6593008e3e55bc6))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.24
    * @videojs/spf bumped to 10.0.0-beta.24
    * @videojs/store bumped to 10.0.0-beta.24
    * @videojs/utils bumped to 10.0.0-beta.24
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.24
    * @videojs/skins bumped to 10.0.0-beta.24

## [10.0.0-beta.23](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.22...@videojs/react@10.0.0-beta.23) (2026-04-27)


### ⚠ BREAKING CHANGES

* **packages:** rename cast to google-cast and remote-playback ([#1380](https://github.com/videojs/v10/issues/1380))

### Features

* **packages:** add live-video and live-audio presets ([#1399](https://github.com/videojs/v10/issues/1399)) ([d9c0049](https://github.com/videojs/v10/commit/d9c00491e7984aeaa01eec2d4450ac148129c205))


### Bug Fixes

* **react:** rename MediaGesture and MediaHotkey to Gesture and Hotkey ([#1374](https://github.com/videojs/v10/issues/1374)) ([5e9a02c](https://github.com/videojs/v10/commit/5e9a02c85194e80f84571a3147ca30d4ce045de1))


### Code Refactoring

* **packages:** rename cast to google-cast and remote-playback ([#1380](https://github.com/videojs/v10/issues/1380)) ([413874c](https://github.com/videojs/v10/commit/413874c1e079ccfa43067180161fe86c78b185bd))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.23
    * @videojs/spf bumped to 10.0.0-beta.23
    * @videojs/store bumped to 10.0.0-beta.23
    * @videojs/utils bumped to 10.0.0-beta.23
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.23
    * @videojs/skins bumped to 10.0.0-beta.23

## [10.0.0-beta.22](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.21...@videojs/react@10.0.0-beta.22) (2026-04-18)


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
    * @videojs/spf bumped to 10.0.0-beta.22
    * @videojs/store bumped to 10.0.0-beta.22
    * @videojs/utils bumped to 10.0.0-beta.22
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.22
    * @videojs/skins bumped to 10.0.0-beta.22

## [10.0.0-beta.21](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.20...@videojs/react@10.0.0-beta.21) (2026-04-14)


### Features

* **site:** feature and preset reference UI + docs integration ([#1258](https://github.com/videojs/v10/issues/1258)) ([d4b805e](https://github.com/videojs/v10/commit/d4b805ea699bd33234c817a7519ff9efbd4753fd))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.21
    * @videojs/spf bumped to 10.0.0-beta.21
    * @videojs/store bumped to 10.0.0-beta.21
    * @videojs/utils bumped to 10.0.0-beta.21
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.21
    * @videojs/skins bumped to 10.0.0-beta.21

## [10.0.0-beta.20](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.19...@videojs/react@10.0.0-beta.20) (2026-04-14)


### Miscellaneous Chores

* **@videojs/react:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.20
    * @videojs/spf bumped to 10.0.0-beta.20
    * @videojs/store bumped to 10.0.0-beta.20
    * @videojs/utils bumped to 10.0.0-beta.20
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.20
    * @videojs/skins bumped to 10.0.0-beta.20

## [10.0.0-beta.19](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.18...@videojs/react@10.0.0-beta.19) (2026-04-14)


### ⚠ BREAKING CHANGES

* **packages:** replace DelegateMixin & ProxyMixin with MediaHost base classes ([#1292](https://github.com/videojs/v10/issues/1292))

### Features

* add background video components ([#567](https://github.com/videojs/v10/issues/567)) ([fd14f0c](https://github.com/videojs/v10/commit/fd14f0cb17c2fd1752c82d29252296492ed1568f))
* add background video preset ([#607](https://github.com/videojs/v10/issues/607)) ([c2bc488](https://github.com/videojs/v10/commit/c2bc488366fd28f9a6d00dd28a4f790b5e1400ed))
* add DashVideo media element (html, react) with sandbox support ([#940](https://github.com/videojs/v10/issues/940)) ([5bdbbec](https://github.com/videojs/v10/commit/5bdbbec8a0f69b4be89600287c63a04746b7ba49))
* add media API + HLS video components ([#507](https://github.com/videojs/v10/issues/507)) ([b3a31a3](https://github.com/videojs/v10/commit/b3a31a335a363d3a96b510206b57d1bb9ebb8edd))
* add Mux video component ([#1036](https://github.com/videojs/v10/issues/1036)) ([271a8c8](https://github.com/videojs/v10/commit/271a8c850216bd1654baaa26f8bb2f5eda56be37))
* add native hls media + refactor ([#1154](https://github.com/videojs/v10/issues/1154)) ([1b2afc6](https://github.com/videojs/v10/commit/1b2afc6e41a4a8bb4f3ea42b5c04c6232813727e))
* add slider preview thumbnails ([#935](https://github.com/videojs/v10/issues/935)) ([e3f438e](https://github.com/videojs/v10/commit/e3f438e9f488f41c8cf51c95507bc41fc5b524d0))
* add subtitles handling + captions core ([#692](https://github.com/videojs/v10/issues/692)) ([5c11606](https://github.com/videojs/v10/commit/5c116065a91ed04753bb2cb83e72dd6471f75ced))
* **core:** add buffering indicator component ([#527](https://github.com/videojs/v10/issues/527)) ([aa0fb7c](https://github.com/videojs/v10/commit/aa0fb7ca704843dd6ac8b0b18d9e35f8f430311e))
* **core:** add controls component with activity tracking ([#514](https://github.com/videojs/v10/issues/514)) ([90d881c](https://github.com/videojs/v10/commit/90d881cec21d7f5e1e619061727e6c8d1ff48296))
* **core:** add pip button component ([#525](https://github.com/videojs/v10/issues/525)) ([2c8b77a](https://github.com/videojs/v10/commit/2c8b77af4547b0a8af27abcc419f7d4dff3b005a))
* **core:** add poster component ([#457](https://github.com/videojs/v10/issues/457)) ([c9ba1e1](https://github.com/videojs/v10/commit/c9ba1e1bfc83e02981a2ffad0a0f247092068687))
* **core:** add seek button component ([#526](https://github.com/videojs/v10/issues/526)) ([c733077](https://github.com/videojs/v10/commit/c733077d324b3cd40eab7c0e33f1f73592609515))
* **html:** add `<media-gesture>` element ([#1305](https://github.com/videojs/v10/issues/1305)) ([d2782f0](https://github.com/videojs/v10/commit/d2782f0c8d3e927fc2144a5286f4bc795a2ed4ac))
* **html:** add alert dialog element ([#741](https://github.com/videojs/v10/issues/741)) ([5fc52aa](https://github.com/videojs/v10/commit/5fc52aa969292a8b8f636b532ac5ff27b082b222))
* **html:** add data-availability to volume slider ([#1001](https://github.com/videojs/v10/issues/1001)) ([c95e134](https://github.com/videojs/v10/commit/c95e1343e16c8667f6b7f5560d12ec5f36f1acd8))
* **html:** add slider element ([#655](https://github.com/videojs/v10/issues/655)) ([d5df015](https://github.com/videojs/v10/commit/d5df0150b3aef21c15d3a65c015bb6058e95ce53))
* **html:** add time slider element ([#656](https://github.com/videojs/v10/issues/656)) ([26c7395](https://github.com/videojs/v10/commit/26c7395cd0fe7e2fe8a8020ffae40cf81ffb3974))
* **html:** add volume slider element ([#657](https://github.com/videojs/v10/issues/657)) ([92b7c2a](https://github.com/videojs/v10/commit/92b7c2ac184d12c780ba1a1bb6f064782b77422a))
* **html:** refactor attach contexts to carry state and setter ([#1024](https://github.com/videojs/v10/issues/1024)) ([c07da27](https://github.com/videojs/v10/commit/c07da27ead58f2d08b93036af49515800c944f16))
* **packages:** add gesture bindings to default skins and presets ([#1310](https://github.com/videojs/v10/issues/1310)) ([1509a66](https://github.com/videojs/v10/commit/1509a66f60fc0598452f21af396c4b6f3569be5b))
* **packages:** add hotkey bindings to preset skins ([#1264](https://github.com/videojs/v10/issues/1264)) ([9912a8e](https://github.com/videojs/v10/commit/9912a8e7593dc9f26c6dfe5cd8ddca34ef89a8ef))
* **packages:** add mux-audio element and react component ([#1259](https://github.com/videojs/v10/issues/1259)) ([9fac0fc](https://github.com/videojs/v10/commit/9fac0fca3d5af44c76c9845da37b5197dd8538df))
* **packages:** add PlaybackRateButton to core, html, and react ([#642](https://github.com/videojs/v10/issues/642)) ([0180828](https://github.com/videojs/v10/commit/0180828df91ad74f885906223fa7d359f1a2641a))
* **packages:** add poster component to video skins ([#994](https://github.com/videojs/v10/issues/994)) ([59bbf6c](https://github.com/videojs/v10/commit/59bbf6c20924ec04e559fe23cbc1a0ad8c8ca080))
* **packages:** error dialog component ([#1077](https://github.com/videojs/v10/issues/1077)) ([3430fe1](https://github.com/videojs/v10/commit/3430fe1a493e4bee34f03112206a0cb3cf9d88cf))
* **packages:** export media component building blocks ([#1098](https://github.com/videojs/v10/issues/1098)) ([bc2929e](https://github.com/videojs/v10/commit/bc2929ef4fc7ed021c91d96b96498870ecf5e4e5))
* **packages:** volume slider scroll support ([#1175](https://github.com/videojs/v10/issues/1175)) ([390b004](https://github.com/videojs/v10/commit/390b004d809272fd453b8a73e1969c59410c3620))
* **react:** add alert dialog component ([#739](https://github.com/videojs/v10/issues/739)) ([536c86d](https://github.com/videojs/v10/commit/536c86d9d1b648f4e1b94b7a55b17735cc0ea03c))
* **react:** add alert dialog to video skin ([#747](https://github.com/videojs/v10/issues/747)) ([5dfc67e](https://github.com/videojs/v10/commit/5dfc67ed02d92512b500c4461898050988e291a8))
* **react:** add captions styling to video skins ([#582](https://github.com/videojs/v10/issues/582)) ([b78c6ce](https://github.com/videojs/v10/commit/b78c6ce7b1942cd00b737059f19bb37dc7585bec))
* **react:** add gesture hooks and MediaGesture component ([#1309](https://github.com/videojs/v10/issues/1309)) ([8566260](https://github.com/videojs/v10/commit/8566260872804b2504d9f6f303d87457c7420d66))
* **react:** add hotkeys ([#1241](https://github.com/videojs/v10/issues/1241)) ([1cc4ec7](https://github.com/videojs/v10/commit/1cc4ec7f81acda2aa77590b2f327b2f76b823767))
* **react:** add playback rate button component ([#639](https://github.com/videojs/v10/issues/639)) ([3305fb3](https://github.com/videojs/v10/commit/3305fb3db6f3c89a2ff4fcc3f657e54ddfcbc700))
* **react:** add popover component ([#653](https://github.com/videojs/v10/issues/653)) ([ed43d52](https://github.com/videojs/v10/commit/ed43d52f8fa347acb9dd62f8458a8324e3506fd1))
* **react:** add slider component ([#644](https://github.com/videojs/v10/issues/644)) ([2f8ca09](https://github.com/videojs/v10/commit/2f8ca094ad5bc5bafc5435c2e97bca58c6d29b5d))
* **react:** add slider preview component ([#710](https://github.com/videojs/v10/issues/710)) ([db75697](https://github.com/videojs/v10/commit/db7569711e5a571f6af421987c8490c3de37ed78))
* **react:** add slider thumbnail component ([#722](https://github.com/videojs/v10/issues/722)) ([a6405e9](https://github.com/videojs/v10/commit/a6405e9278bc6e627cc1186f2af227941a1e55c0))
* **react:** add Tailwind ejected video skins ([#589](https://github.com/videojs/v10/issues/589)) ([8763a57](https://github.com/videojs/v10/commit/8763a57360198d3b624363af00563469bb5fd180))
* **react:** add thumbnail component ([#648](https://github.com/videojs/v10/issues/648)) ([40606ff](https://github.com/videojs/v10/commit/40606ff1885f44138fe7f70abcda6ef3bee32413))
* **react:** add time slider component ([#647](https://github.com/videojs/v10/issues/647)) ([158378a](https://github.com/videojs/v10/commit/158378ac731db302b3d1f309de9d93f0f8fc92f2))
* **react:** add tooltip component ([#736](https://github.com/videojs/v10/issues/736)) ([ae754ee](https://github.com/videojs/v10/commit/ae754eec8f3136be08026e08fbf404b4f0f7126e))
* **react:** implement default and minimal video skins ([#550](https://github.com/videojs/v10/issues/550)) ([7d3be36](https://github.com/videojs/v10/commit/7d3be367f5b31b8a6d5b9a9e3c87245f95b8e22a))
* **react:** implement video skins with responsive layout ([#568](https://github.com/videojs/v10/issues/568)) ([846d38e](https://github.com/videojs/v10/commit/846d38e79b11ba8de62bdb239bc1358e9abc28de))
* **react:** initial skin scaffolding ([#523](https://github.com/videojs/v10/issues/523)) ([edefc2a](https://github.com/videojs/v10/commit/edefc2a2d63e2124d0a11a15f44bd7109c6d9788))
* **react:** orientation-aware buffer styling and slider improvements ([#671](https://github.com/videojs/v10/issues/671)) ([86b2f4d](https://github.com/videojs/v10/commit/86b2f4d3b426ce8747af234f2d0f4c4a3ec402ec))
* **react:** port time slider styling into video skin presets ([#666](https://github.com/videojs/v10/issues/666)) ([ebb75f5](https://github.com/videojs/v10/commit/ebb75f5863f137511f6fc75bb7fbf528d45b0d9b))
* **react:** port volume popover and slider styling into skin presets ([#667](https://github.com/videojs/v10/issues/667)) ([6a1edda](https://github.com/videojs/v10/commit/6a1eddadd00b5d9aee45fb774b3d8f953d5c6dcd))
* **react:** support native caption track shifting in video skins ([#636](https://github.com/videojs/v10/issues/636)) ([ac346db](https://github.com/videojs/v10/commit/ac346dbbd68443558ae16e4c81a28c8c605ae687))
* **site:** add buffering indicator api reference ([84b7b07](https://github.com/videojs/v10/commit/84b7b0774a1fb655f4cb7f6a87e589097a661685)), closes [#532](https://github.com/videojs/v10/issues/532) [#533](https://github.com/videojs/v10/issues/533)
* **site:** add TimeSlider, VolumeSlider, Popover API references ([#685](https://github.com/videojs/v10/issues/685)) ([8ab596e](https://github.com/videojs/v10/commit/8ab596ea30291d48962684203d153c689e1b0fec))
* **site:** add util reference pipeline ([#537](https://github.com/videojs/v10/issues/537)) ([78112fb](https://github.com/videojs/v10/commit/78112fbefdaace678a2d1335409e40533f3819fa))
* **skin:** add audio skins for HTML and React presets ([#772](https://github.com/videojs/v10/issues/772)) ([d751fda](https://github.com/videojs/v10/commit/d751fdabea9782b9f6c73aaebfb93ed393e488f7))
* **skin:** add captions button to video skins ([#612](https://github.com/videojs/v10/issues/612)) ([fbf888f](https://github.com/videojs/v10/commit/fbf888fda3ed33d0893321b6b4cac19cfdbd6d97))
* **skin:** add error dialogs ([#603](https://github.com/videojs/v10/issues/603)) ([ba94f74](https://github.com/videojs/v10/commit/ba94f74b91e09ce7ffd4a666562d555b3fbd2fb9))
* **skin:** add error handling for audio players ([#1048](https://github.com/videojs/v10/issues/1048)) ([df927f6](https://github.com/videojs/v10/commit/df927f67fcbd0aaa229b1a8e205ab3cb08f7a42d))
* **skin:** add pip-enter and pip-exit icons ([#1015](https://github.com/videojs/v10/issues/1015)) ([81781ca](https://github.com/videojs/v10/commit/81781ca5854f4943b533073b1875b127308a5419))
* **skin:** implement default and minimal skins for HTML player ([#698](https://github.com/videojs/v10/issues/698)) ([c5cafae](https://github.com/videojs/v10/commit/c5cafae57ff34d13f79d11862b82f10414bdcd40))
* **skin:** port tooltip styling from tech preview ([#800](https://github.com/videojs/v10/issues/800)) ([6b6566e](https://github.com/videojs/v10/commit/6b6566e2540b4ad9fcd9b2a8e6c767f5f7e4072f))
* small state and naming fixes  ([#719](https://github.com/videojs/v10/issues/719)) ([5c42245](https://github.com/videojs/v10/commit/5c422452e4b547dc00f13082b755ea12d1860f21))
* **spf:** initial push of SPF ([#784](https://github.com/videojs/v10/issues/784)) ([27a3993](https://github.com/videojs/v10/commit/27a3993fb20af0523e42b0d03c70a6f5a465d144))


### Bug Fixes

* **cd:** add repository field to all packages for provenance verification ([b723589](https://github.com/videojs/v10/commit/b72358904a78a9403df16d77936d4a1f41a64bfe))
* **ci:** rework bundle size report ([#745](https://github.com/videojs/v10/issues/745)) ([9f456f5](https://github.com/videojs/v10/commit/9f456f572f340f88b7e3e57316dd284e48631f78))
* **core:** fix circular import and simplify media types ([#569](https://github.com/videojs/v10/issues/569)) ([38b3a8f](https://github.com/videojs/v10/commit/38b3a8f55ca96938db92fa06c0d171bf544ffe3b))
* **core:** prevent slider thumb jump on pointer release ([#990](https://github.com/videojs/v10/issues/990)) ([b9bada9](https://github.com/videojs/v10/commit/b9bada95675f09b7c7d6859dcd213be7a0408bb7))
* correct popup fallback positioning offsets ([#981](https://github.com/videojs/v10/issues/981)) ([82ede77](https://github.com/videojs/v10/commit/82ede77322204500d7ca0adc5cb24d4f068af462))
* destroy hls.js instance on media unmount ([#749](https://github.com/videojs/v10/issues/749)) ([c4e8bbd](https://github.com/videojs/v10/commit/c4e8bbd3a2bcb66027c64faf8de0ec61d22c84fa))
* **docs:** improvements to eject script ([#1012](https://github.com/videojs/v10/issues/1012)) ([559d516](https://github.com/videojs/v10/commit/559d5169b5783992ec792cdb7037c3119cad3e5b))
* **html,react:** move @videojs/skins to devDependencies ([#716](https://github.com/videojs/v10/issues/716)) ([55b49ef](https://github.com/videojs/v10/commit/55b49efd82281815abe1e26eb764dfe914bb8208))
* **html:** discover media elements and attach store target via DOM ([#481](https://github.com/videojs/v10/issues/481)) ([5eab1db](https://github.com/videojs/v10/commit/5eab1dbb2fbb906543f7749e5956c9791c30be34))
* **html:** slider interaction and edge alignment broken ([#721](https://github.com/videojs/v10/issues/721)) ([ff12296](https://github.com/videojs/v10/commit/ff122963553e23a58614c9c808763208fd893df1))
* **packages:** consistent react versions ([#1285](https://github.com/videojs/v10/issues/1285)) ([1c937da](https://github.com/videojs/v10/commit/1c937da4704d51c0c64e5085b6f235bb95a236eb))
* **packages:** enable unbundle mode to avoid mangled exports ([00fdf96](https://github.com/videojs/v10/commit/00fdf966ca5148bcca303058dd798b1b880896e0))
* **packages:** make tooltips visual-only and auto-forward media button labels ([#1174](https://github.com/videojs/v10/issues/1174)) ([86cf3e8](https://github.com/videojs/v10/commit/86cf3e8977719fbbdcd59244a543fdd8412c4484))
* **packages:** narrow react peer dependency to v18+ ([#1289](https://github.com/videojs/v10/issues/1289)) ([6fb6ab7](https://github.com/videojs/v10/commit/6fb6ab7dfb4ac2671bfac4269dfc5813ab76f0e8))
* **packages:** remove redundant "Shift" modifier from playback rate hotkeys ([#1290](https://github.com/videojs/v10/issues/1290)) ([a0fd3cb](https://github.com/videojs/v10/commit/a0fd3cbda8101f47806e0e71c727fbf483a1de66))
* **packages:** set release-please manifest and package versions to beta.0 ([#850](https://github.com/videojs/v10/issues/850)) ([e085a0d](https://github.com/videojs/v10/commit/e085a0d73af0c142e0c0a371337daae98fdbaac9))
* **packages:** time slider seek improvements ([#1291](https://github.com/videojs/v10/issues/1291)) ([b934c58](https://github.com/videojs/v10/commit/b934c589f824b0ed7338b19c2b3bad3160742e74))
* **packages:** update package READMEs for beta ([#848](https://github.com/videojs/v10/issues/848)) ([9562a0e](https://github.com/videojs/v10/commit/9562a0ecca212034759d7cc948d4b3f0bc7a19c3))
* **react:** add missing destroy cleanups  ([#1096](https://github.com/videojs/v10/issues/1096)) ([1792bae](https://github.com/videojs/v10/commit/1792bae3b4cad5cbb89038e3fa10212f24b49e6b))
* **react:** align media component conventions ([#1281](https://github.com/videojs/v10/issues/1281)) ([42abf88](https://github.com/videojs/v10/commit/42abf880955ec68d2c700eaa9bcf18b69c37471c))
* **react:** correct buffer selector names in minimal skin CSS ([#672](https://github.com/videojs/v10/issues/672)) ([12277fd](https://github.com/videojs/v10/commit/12277fdac89cc1251f1518b92411f15d1386793a))
* **react:** move @videojs/icons to devDependencies ([f09c686](https://github.com/videojs/v10/commit/f09c6861c1b2398e3f2ce2c1e711f5e08dfa1421))
* **react:** set anchor-name and position-anchor imperatively in popover ([#715](https://github.com/videojs/v10/issues/715)) ([070d094](https://github.com/videojs/v10/commit/070d0944448fae4fd8ec140a13c5c073c31ccdc4))
* **react:** strict mode support ([#742](https://github.com/videojs/v10/issues/742)) ([44d874d](https://github.com/videojs/v10/commit/44d874ddc225b9b8aaf6d8689bdb48ef0ac729fb))
* **react:** thumbnails broken when using hls media ([#1210](https://github.com/videojs/v10/issues/1210)) ([8b571f5](https://github.com/videojs/v10/commit/8b571f5f05566f52deea866f4a64a7408d6c2c21))
* **react:** use relative import path for useForceRender ([#669](https://github.com/videojs/v10/issues/669)) ([e3d7f4b](https://github.com/videojs/v10/commit/e3d7f4b277182a32ae57b4ce73fa190d774c5730))
* revert preset provider ([#631](https://github.com/videojs/v10/issues/631)) ([5f1cafa](https://github.com/videojs/v10/commit/5f1cafaa25b8a58e06aae00f2ea1495c2aae2916))
* **site:** resolve aliased part descriptions in api docs ([#518](https://github.com/videojs/v10/issues/518)) ([8294404](https://github.com/videojs/v10/commit/82944041f903ead4bb8afbce35fbfb7977caa23b))
* **skin:** add missing tooltip provider/group ([#902](https://github.com/videojs/v10/issues/902)) ([1dbcd79](https://github.com/videojs/v10/commit/1dbcd79e541fce77021645d012fb3554d241b16b))
* **skin:** extract transition properties into CSS custom properties ([#1075](https://github.com/videojs/v10/issues/1075)) ([657e711](https://github.com/videojs/v10/commit/657e7111b423ac2d2a1d0c6422b88297f40e2b04))
* **skin:** hide volume popover when volume control is unsupported ([#1025](https://github.com/videojs/v10/issues/1025)) ([c09dbdd](https://github.com/videojs/v10/commit/c09dbdd121f2b8bb01e42d79350bf7a7acf09f28))
* **skin:** responsive design fixes and improvements ([#1129](https://github.com/videojs/v10/issues/1129)) ([1082693](https://github.com/videojs/v10/commit/10826932be7861ebf5df8c66db7811c0510339f4))
* **skins:** remove legacy caption markup artifacts ([#882](https://github.com/videojs/v10/issues/882)) ([85266ba](https://github.com/videojs/v10/commit/85266bab3b5b01a6cf6d769a16f662bffa57c208))
* **skin:** temporarily hide the caption button ([#629](https://github.com/videojs/v10/issues/629)) ([0666d52](https://github.com/videojs/v10/commit/0666d526b1eb4de6af12a7710e119c588019c19f))
* **spf:** implement preload IDL attribute on SpfMedia ([#1069](https://github.com/videojs/v10/issues/1069)) ([04f81a2](https://github.com/videojs/v10/commit/04f81a26e13648ca414f2e51380c8786a06a7724))


### Code Refactoring

* **packages:** replace DelegateMixin & ProxyMixin with MediaHost base classes ([#1292](https://github.com/videojs/v10/issues/1292)) ([8f1653e](https://github.com/videojs/v10/commit/8f1653efcd0a3a8cc75881bc6b4c0b87599a3b8d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.19
    * @videojs/spf bumped to 10.0.0-beta.19
    * @videojs/store bumped to 10.0.0-beta.19
    * @videojs/utils bumped to 10.0.0-beta.19
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.19
    * @videojs/skins bumped to 10.0.0-beta.19

## [10.0.0-beta.18](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.17...@videojs/react@10.0.0-beta.18) (2026-04-14)


### ⚠ BREAKING CHANGES

* **packages:** replace DelegateMixin & ProxyMixin with MediaHost base classes ([#1292](https://github.com/videojs/v10/issues/1292))

### Features

* add background video components ([#567](https://github.com/videojs/v10/issues/567)) ([fd14f0c](https://github.com/videojs/v10/commit/fd14f0cb17c2fd1752c82d29252296492ed1568f))
* add background video preset ([#607](https://github.com/videojs/v10/issues/607)) ([c2bc488](https://github.com/videojs/v10/commit/c2bc488366fd28f9a6d00dd28a4f790b5e1400ed))
* add DashVideo media element (html, react) with sandbox support ([#940](https://github.com/videojs/v10/issues/940)) ([5bdbbec](https://github.com/videojs/v10/commit/5bdbbec8a0f69b4be89600287c63a04746b7ba49))
* add media API + HLS video components ([#507](https://github.com/videojs/v10/issues/507)) ([b3a31a3](https://github.com/videojs/v10/commit/b3a31a335a363d3a96b510206b57d1bb9ebb8edd))
* add Mux video component ([#1036](https://github.com/videojs/v10/issues/1036)) ([271a8c8](https://github.com/videojs/v10/commit/271a8c850216bd1654baaa26f8bb2f5eda56be37))
* add native hls media + refactor ([#1154](https://github.com/videojs/v10/issues/1154)) ([1b2afc6](https://github.com/videojs/v10/commit/1b2afc6e41a4a8bb4f3ea42b5c04c6232813727e))
* add slider preview thumbnails ([#935](https://github.com/videojs/v10/issues/935)) ([e3f438e](https://github.com/videojs/v10/commit/e3f438e9f488f41c8cf51c95507bc41fc5b524d0))
* add subtitles handling + captions core ([#692](https://github.com/videojs/v10/issues/692)) ([5c11606](https://github.com/videojs/v10/commit/5c116065a91ed04753bb2cb83e72dd6471f75ced))
* **core:** add buffering indicator component ([#527](https://github.com/videojs/v10/issues/527)) ([aa0fb7c](https://github.com/videojs/v10/commit/aa0fb7ca704843dd6ac8b0b18d9e35f8f430311e))
* **core:** add controls component with activity tracking ([#514](https://github.com/videojs/v10/issues/514)) ([90d881c](https://github.com/videojs/v10/commit/90d881cec21d7f5e1e619061727e6c8d1ff48296))
* **core:** add pip button component ([#525](https://github.com/videojs/v10/issues/525)) ([2c8b77a](https://github.com/videojs/v10/commit/2c8b77af4547b0a8af27abcc419f7d4dff3b005a))
* **core:** add poster component ([#457](https://github.com/videojs/v10/issues/457)) ([c9ba1e1](https://github.com/videojs/v10/commit/c9ba1e1bfc83e02981a2ffad0a0f247092068687))
* **core:** add seek button component ([#526](https://github.com/videojs/v10/issues/526)) ([c733077](https://github.com/videojs/v10/commit/c733077d324b3cd40eab7c0e33f1f73592609515))
* **html:** add `<media-gesture>` element ([#1305](https://github.com/videojs/v10/issues/1305)) ([d2782f0](https://github.com/videojs/v10/commit/d2782f0c8d3e927fc2144a5286f4bc795a2ed4ac))
* **html:** add alert dialog element ([#741](https://github.com/videojs/v10/issues/741)) ([5fc52aa](https://github.com/videojs/v10/commit/5fc52aa969292a8b8f636b532ac5ff27b082b222))
* **html:** add data-availability to volume slider ([#1001](https://github.com/videojs/v10/issues/1001)) ([c95e134](https://github.com/videojs/v10/commit/c95e1343e16c8667f6b7f5560d12ec5f36f1acd8))
* **html:** add slider element ([#655](https://github.com/videojs/v10/issues/655)) ([d5df015](https://github.com/videojs/v10/commit/d5df0150b3aef21c15d3a65c015bb6058e95ce53))
* **html:** add time slider element ([#656](https://github.com/videojs/v10/issues/656)) ([26c7395](https://github.com/videojs/v10/commit/26c7395cd0fe7e2fe8a8020ffae40cf81ffb3974))
* **html:** add volume slider element ([#657](https://github.com/videojs/v10/issues/657)) ([92b7c2a](https://github.com/videojs/v10/commit/92b7c2ac184d12c780ba1a1bb6f064782b77422a))
* **html:** refactor attach contexts to carry state and setter ([#1024](https://github.com/videojs/v10/issues/1024)) ([c07da27](https://github.com/videojs/v10/commit/c07da27ead58f2d08b93036af49515800c944f16))
* **packages:** add gesture bindings to default skins and presets ([#1310](https://github.com/videojs/v10/issues/1310)) ([1509a66](https://github.com/videojs/v10/commit/1509a66f60fc0598452f21af396c4b6f3569be5b))
* **packages:** add hotkey bindings to preset skins ([#1264](https://github.com/videojs/v10/issues/1264)) ([9912a8e](https://github.com/videojs/v10/commit/9912a8e7593dc9f26c6dfe5cd8ddca34ef89a8ef))
* **packages:** add mux-audio element and react component ([#1259](https://github.com/videojs/v10/issues/1259)) ([9fac0fc](https://github.com/videojs/v10/commit/9fac0fca3d5af44c76c9845da37b5197dd8538df))
* **packages:** add PlaybackRateButton to core, html, and react ([#642](https://github.com/videojs/v10/issues/642)) ([0180828](https://github.com/videojs/v10/commit/0180828df91ad74f885906223fa7d359f1a2641a))
* **packages:** add poster component to video skins ([#994](https://github.com/videojs/v10/issues/994)) ([59bbf6c](https://github.com/videojs/v10/commit/59bbf6c20924ec04e559fe23cbc1a0ad8c8ca080))
* **packages:** error dialog component ([#1077](https://github.com/videojs/v10/issues/1077)) ([3430fe1](https://github.com/videojs/v10/commit/3430fe1a493e4bee34f03112206a0cb3cf9d88cf))
* **packages:** export media component building blocks ([#1098](https://github.com/videojs/v10/issues/1098)) ([bc2929e](https://github.com/videojs/v10/commit/bc2929ef4fc7ed021c91d96b96498870ecf5e4e5))
* **packages:** volume slider scroll support ([#1175](https://github.com/videojs/v10/issues/1175)) ([390b004](https://github.com/videojs/v10/commit/390b004d809272fd453b8a73e1969c59410c3620))
* **react:** add alert dialog component ([#739](https://github.com/videojs/v10/issues/739)) ([536c86d](https://github.com/videojs/v10/commit/536c86d9d1b648f4e1b94b7a55b17735cc0ea03c))
* **react:** add alert dialog to video skin ([#747](https://github.com/videojs/v10/issues/747)) ([5dfc67e](https://github.com/videojs/v10/commit/5dfc67ed02d92512b500c4461898050988e291a8))
* **react:** add captions styling to video skins ([#582](https://github.com/videojs/v10/issues/582)) ([b78c6ce](https://github.com/videojs/v10/commit/b78c6ce7b1942cd00b737059f19bb37dc7585bec))
* **react:** add gesture hooks and MediaGesture component ([#1309](https://github.com/videojs/v10/issues/1309)) ([8566260](https://github.com/videojs/v10/commit/8566260872804b2504d9f6f303d87457c7420d66))
* **react:** add hotkeys ([#1241](https://github.com/videojs/v10/issues/1241)) ([1cc4ec7](https://github.com/videojs/v10/commit/1cc4ec7f81acda2aa77590b2f327b2f76b823767))
* **react:** add playback rate button component ([#639](https://github.com/videojs/v10/issues/639)) ([3305fb3](https://github.com/videojs/v10/commit/3305fb3db6f3c89a2ff4fcc3f657e54ddfcbc700))
* **react:** add popover component ([#653](https://github.com/videojs/v10/issues/653)) ([ed43d52](https://github.com/videojs/v10/commit/ed43d52f8fa347acb9dd62f8458a8324e3506fd1))
* **react:** add slider component ([#644](https://github.com/videojs/v10/issues/644)) ([2f8ca09](https://github.com/videojs/v10/commit/2f8ca094ad5bc5bafc5435c2e97bca58c6d29b5d))
* **react:** add slider preview component ([#710](https://github.com/videojs/v10/issues/710)) ([db75697](https://github.com/videojs/v10/commit/db7569711e5a571f6af421987c8490c3de37ed78))
* **react:** add slider thumbnail component ([#722](https://github.com/videojs/v10/issues/722)) ([a6405e9](https://github.com/videojs/v10/commit/a6405e9278bc6e627cc1186f2af227941a1e55c0))
* **react:** add Tailwind ejected video skins ([#589](https://github.com/videojs/v10/issues/589)) ([8763a57](https://github.com/videojs/v10/commit/8763a57360198d3b624363af00563469bb5fd180))
* **react:** add thumbnail component ([#648](https://github.com/videojs/v10/issues/648)) ([40606ff](https://github.com/videojs/v10/commit/40606ff1885f44138fe7f70abcda6ef3bee32413))
* **react:** add time slider component ([#647](https://github.com/videojs/v10/issues/647)) ([158378a](https://github.com/videojs/v10/commit/158378ac731db302b3d1f309de9d93f0f8fc92f2))
* **react:** add tooltip component ([#736](https://github.com/videojs/v10/issues/736)) ([ae754ee](https://github.com/videojs/v10/commit/ae754eec8f3136be08026e08fbf404b4f0f7126e))
* **react:** implement default and minimal video skins ([#550](https://github.com/videojs/v10/issues/550)) ([7d3be36](https://github.com/videojs/v10/commit/7d3be367f5b31b8a6d5b9a9e3c87245f95b8e22a))
* **react:** implement video skins with responsive layout ([#568](https://github.com/videojs/v10/issues/568)) ([846d38e](https://github.com/videojs/v10/commit/846d38e79b11ba8de62bdb239bc1358e9abc28de))
* **react:** initial skin scaffolding ([#523](https://github.com/videojs/v10/issues/523)) ([edefc2a](https://github.com/videojs/v10/commit/edefc2a2d63e2124d0a11a15f44bd7109c6d9788))
* **react:** orientation-aware buffer styling and slider improvements ([#671](https://github.com/videojs/v10/issues/671)) ([86b2f4d](https://github.com/videojs/v10/commit/86b2f4d3b426ce8747af234f2d0f4c4a3ec402ec))
* **react:** port time slider styling into video skin presets ([#666](https://github.com/videojs/v10/issues/666)) ([ebb75f5](https://github.com/videojs/v10/commit/ebb75f5863f137511f6fc75bb7fbf528d45b0d9b))
* **react:** port volume popover and slider styling into skin presets ([#667](https://github.com/videojs/v10/issues/667)) ([6a1edda](https://github.com/videojs/v10/commit/6a1eddadd00b5d9aee45fb774b3d8f953d5c6dcd))
* **react:** support native caption track shifting in video skins ([#636](https://github.com/videojs/v10/issues/636)) ([ac346db](https://github.com/videojs/v10/commit/ac346dbbd68443558ae16e4c81a28c8c605ae687))
* **site:** add buffering indicator api reference ([84b7b07](https://github.com/videojs/v10/commit/84b7b0774a1fb655f4cb7f6a87e589097a661685)), closes [#532](https://github.com/videojs/v10/issues/532) [#533](https://github.com/videojs/v10/issues/533)
* **site:** add TimeSlider, VolumeSlider, Popover API references ([#685](https://github.com/videojs/v10/issues/685)) ([8ab596e](https://github.com/videojs/v10/commit/8ab596ea30291d48962684203d153c689e1b0fec))
* **site:** add util reference pipeline ([#537](https://github.com/videojs/v10/issues/537)) ([78112fb](https://github.com/videojs/v10/commit/78112fbefdaace678a2d1335409e40533f3819fa))
* **skin:** add audio skins for HTML and React presets ([#772](https://github.com/videojs/v10/issues/772)) ([d751fda](https://github.com/videojs/v10/commit/d751fdabea9782b9f6c73aaebfb93ed393e488f7))
* **skin:** add captions button to video skins ([#612](https://github.com/videojs/v10/issues/612)) ([fbf888f](https://github.com/videojs/v10/commit/fbf888fda3ed33d0893321b6b4cac19cfdbd6d97))
* **skin:** add error dialogs ([#603](https://github.com/videojs/v10/issues/603)) ([ba94f74](https://github.com/videojs/v10/commit/ba94f74b91e09ce7ffd4a666562d555b3fbd2fb9))
* **skin:** add error handling for audio players ([#1048](https://github.com/videojs/v10/issues/1048)) ([df927f6](https://github.com/videojs/v10/commit/df927f67fcbd0aaa229b1a8e205ab3cb08f7a42d))
* **skin:** add pip-enter and pip-exit icons ([#1015](https://github.com/videojs/v10/issues/1015)) ([81781ca](https://github.com/videojs/v10/commit/81781ca5854f4943b533073b1875b127308a5419))
* **skin:** implement default and minimal skins for HTML player ([#698](https://github.com/videojs/v10/issues/698)) ([c5cafae](https://github.com/videojs/v10/commit/c5cafae57ff34d13f79d11862b82f10414bdcd40))
* **skin:** port tooltip styling from tech preview ([#800](https://github.com/videojs/v10/issues/800)) ([6b6566e](https://github.com/videojs/v10/commit/6b6566e2540b4ad9fcd9b2a8e6c767f5f7e4072f))
* small state and naming fixes  ([#719](https://github.com/videojs/v10/issues/719)) ([5c42245](https://github.com/videojs/v10/commit/5c422452e4b547dc00f13082b755ea12d1860f21))
* **spf:** initial push of SPF ([#784](https://github.com/videojs/v10/issues/784)) ([27a3993](https://github.com/videojs/v10/commit/27a3993fb20af0523e42b0d03c70a6f5a465d144))


### Bug Fixes

* **cd:** add repository field to all packages for provenance verification ([b723589](https://github.com/videojs/v10/commit/b72358904a78a9403df16d77936d4a1f41a64bfe))
* **ci:** rework bundle size report ([#745](https://github.com/videojs/v10/issues/745)) ([9f456f5](https://github.com/videojs/v10/commit/9f456f572f340f88b7e3e57316dd284e48631f78))
* **core:** fix circular import and simplify media types ([#569](https://github.com/videojs/v10/issues/569)) ([38b3a8f](https://github.com/videojs/v10/commit/38b3a8f55ca96938db92fa06c0d171bf544ffe3b))
* **core:** prevent slider thumb jump on pointer release ([#990](https://github.com/videojs/v10/issues/990)) ([b9bada9](https://github.com/videojs/v10/commit/b9bada95675f09b7c7d6859dcd213be7a0408bb7))
* correct popup fallback positioning offsets ([#981](https://github.com/videojs/v10/issues/981)) ([82ede77](https://github.com/videojs/v10/commit/82ede77322204500d7ca0adc5cb24d4f068af462))
* destroy hls.js instance on media unmount ([#749](https://github.com/videojs/v10/issues/749)) ([c4e8bbd](https://github.com/videojs/v10/commit/c4e8bbd3a2bcb66027c64faf8de0ec61d22c84fa))
* **docs:** improvements to eject script ([#1012](https://github.com/videojs/v10/issues/1012)) ([559d516](https://github.com/videojs/v10/commit/559d5169b5783992ec792cdb7037c3119cad3e5b))
* **html,react:** move @videojs/skins to devDependencies ([#716](https://github.com/videojs/v10/issues/716)) ([55b49ef](https://github.com/videojs/v10/commit/55b49efd82281815abe1e26eb764dfe914bb8208))
* **html:** discover media elements and attach store target via DOM ([#481](https://github.com/videojs/v10/issues/481)) ([5eab1db](https://github.com/videojs/v10/commit/5eab1dbb2fbb906543f7749e5956c9791c30be34))
* **html:** slider interaction and edge alignment broken ([#721](https://github.com/videojs/v10/issues/721)) ([ff12296](https://github.com/videojs/v10/commit/ff122963553e23a58614c9c808763208fd893df1))
* **packages:** consistent react versions ([#1285](https://github.com/videojs/v10/issues/1285)) ([1c937da](https://github.com/videojs/v10/commit/1c937da4704d51c0c64e5085b6f235bb95a236eb))
* **packages:** enable unbundle mode to avoid mangled exports ([00fdf96](https://github.com/videojs/v10/commit/00fdf966ca5148bcca303058dd798b1b880896e0))
* **packages:** make tooltips visual-only and auto-forward media button labels ([#1174](https://github.com/videojs/v10/issues/1174)) ([86cf3e8](https://github.com/videojs/v10/commit/86cf3e8977719fbbdcd59244a543fdd8412c4484))
* **packages:** narrow react peer dependency to v18+ ([#1289](https://github.com/videojs/v10/issues/1289)) ([6fb6ab7](https://github.com/videojs/v10/commit/6fb6ab7dfb4ac2671bfac4269dfc5813ab76f0e8))
* **packages:** remove redundant "Shift" modifier from playback rate hotkeys ([#1290](https://github.com/videojs/v10/issues/1290)) ([a0fd3cb](https://github.com/videojs/v10/commit/a0fd3cbda8101f47806e0e71c727fbf483a1de66))
* **packages:** set release-please manifest and package versions to beta.0 ([#850](https://github.com/videojs/v10/issues/850)) ([e085a0d](https://github.com/videojs/v10/commit/e085a0d73af0c142e0c0a371337daae98fdbaac9))
* **packages:** time slider seek improvements ([#1291](https://github.com/videojs/v10/issues/1291)) ([b934c58](https://github.com/videojs/v10/commit/b934c589f824b0ed7338b19c2b3bad3160742e74))
* **packages:** update package READMEs for beta ([#848](https://github.com/videojs/v10/issues/848)) ([9562a0e](https://github.com/videojs/v10/commit/9562a0ecca212034759d7cc948d4b3f0bc7a19c3))
* **react:** add missing destroy cleanups  ([#1096](https://github.com/videojs/v10/issues/1096)) ([1792bae](https://github.com/videojs/v10/commit/1792bae3b4cad5cbb89038e3fa10212f24b49e6b))
* **react:** align media component conventions ([#1281](https://github.com/videojs/v10/issues/1281)) ([42abf88](https://github.com/videojs/v10/commit/42abf880955ec68d2c700eaa9bcf18b69c37471c))
* **react:** correct buffer selector names in minimal skin CSS ([#672](https://github.com/videojs/v10/issues/672)) ([12277fd](https://github.com/videojs/v10/commit/12277fdac89cc1251f1518b92411f15d1386793a))
* **react:** move @videojs/icons to devDependencies ([f09c686](https://github.com/videojs/v10/commit/f09c6861c1b2398e3f2ce2c1e711f5e08dfa1421))
* **react:** set anchor-name and position-anchor imperatively in popover ([#715](https://github.com/videojs/v10/issues/715)) ([070d094](https://github.com/videojs/v10/commit/070d0944448fae4fd8ec140a13c5c073c31ccdc4))
* **react:** strict mode support ([#742](https://github.com/videojs/v10/issues/742)) ([44d874d](https://github.com/videojs/v10/commit/44d874ddc225b9b8aaf6d8689bdb48ef0ac729fb))
* **react:** thumbnails broken when using hls media ([#1210](https://github.com/videojs/v10/issues/1210)) ([8b571f5](https://github.com/videojs/v10/commit/8b571f5f05566f52deea866f4a64a7408d6c2c21))
* **react:** use relative import path for useForceRender ([#669](https://github.com/videojs/v10/issues/669)) ([e3d7f4b](https://github.com/videojs/v10/commit/e3d7f4b277182a32ae57b4ce73fa190d774c5730))
* revert preset provider ([#631](https://github.com/videojs/v10/issues/631)) ([5f1cafa](https://github.com/videojs/v10/commit/5f1cafaa25b8a58e06aae00f2ea1495c2aae2916))
* **site:** resolve aliased part descriptions in api docs ([#518](https://github.com/videojs/v10/issues/518)) ([8294404](https://github.com/videojs/v10/commit/82944041f903ead4bb8afbce35fbfb7977caa23b))
* **skin:** add missing tooltip provider/group ([#902](https://github.com/videojs/v10/issues/902)) ([1dbcd79](https://github.com/videojs/v10/commit/1dbcd79e541fce77021645d012fb3554d241b16b))
* **skin:** extract transition properties into CSS custom properties ([#1075](https://github.com/videojs/v10/issues/1075)) ([657e711](https://github.com/videojs/v10/commit/657e7111b423ac2d2a1d0c6422b88297f40e2b04))
* **skin:** hide volume popover when volume control is unsupported ([#1025](https://github.com/videojs/v10/issues/1025)) ([c09dbdd](https://github.com/videojs/v10/commit/c09dbdd121f2b8bb01e42d79350bf7a7acf09f28))
* **skin:** responsive design fixes and improvements ([#1129](https://github.com/videojs/v10/issues/1129)) ([1082693](https://github.com/videojs/v10/commit/10826932be7861ebf5df8c66db7811c0510339f4))
* **skins:** remove legacy caption markup artifacts ([#882](https://github.com/videojs/v10/issues/882)) ([85266ba](https://github.com/videojs/v10/commit/85266bab3b5b01a6cf6d769a16f662bffa57c208))
* **skin:** temporarily hide the caption button ([#629](https://github.com/videojs/v10/issues/629)) ([0666d52](https://github.com/videojs/v10/commit/0666d526b1eb4de6af12a7710e119c588019c19f))
* **spf:** implement preload IDL attribute on SpfMedia ([#1069](https://github.com/videojs/v10/issues/1069)) ([04f81a2](https://github.com/videojs/v10/commit/04f81a26e13648ca414f2e51380c8786a06a7724))


### Code Refactoring

* **packages:** replace DelegateMixin & ProxyMixin with MediaHost base classes ([#1292](https://github.com/videojs/v10/issues/1292)) ([8f1653e](https://github.com/videojs/v10/commit/8f1653efcd0a3a8cc75881bc6b4c0b87599a3b8d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.18
    * @videojs/spf bumped to 10.0.0-beta.18
    * @videojs/store bumped to 10.0.0-beta.18
    * @videojs/utils bumped to 10.0.0-beta.18
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.18
    * @videojs/skins bumped to 10.0.0-beta.18

## [10.0.0-beta.17](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.16...@videojs/react@10.0.0-beta.17) (2026-04-11)


### Features

* **html:** add `<media-gesture>` element ([#1305](https://github.com/videojs/v10/issues/1305)) ([d2782f0](https://github.com/videojs/v10/commit/d2782f0c8d3e927fc2144a5286f4bc795a2ed4ac))
* **packages:** add gesture bindings to default skins and presets ([#1310](https://github.com/videojs/v10/issues/1310)) ([1509a66](https://github.com/videojs/v10/commit/1509a66f60fc0598452f21af396c4b6f3569be5b))
* **react:** add gesture hooks and MediaGesture component ([#1309](https://github.com/videojs/v10/issues/1309)) ([8566260](https://github.com/videojs/v10/commit/8566260872804b2504d9f6f303d87457c7420d66))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.17
    * @videojs/spf bumped to 10.0.0-beta.17
    * @videojs/store bumped to 10.0.0-beta.17
    * @videojs/utils bumped to 10.0.0-beta.17
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.17
    * @videojs/skins bumped to 10.0.0-beta.17

## [10.0.0-beta.16](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.15...@videojs/react@10.0.0-beta.16) (2026-04-10)


### Features

* **packages:** add hotkey bindings to preset skins ([#1264](https://github.com/videojs/v10/issues/1264)) ([9912a8e](https://github.com/videojs/v10/commit/9912a8e7593dc9f26c6dfe5cd8ddca34ef89a8ef))
* **packages:** add mux-audio element and react component ([#1259](https://github.com/videojs/v10/issues/1259)) ([9fac0fc](https://github.com/videojs/v10/commit/9fac0fca3d5af44c76c9845da37b5197dd8538df))
* **react:** add hotkeys ([#1241](https://github.com/videojs/v10/issues/1241)) ([1cc4ec7](https://github.com/videojs/v10/commit/1cc4ec7f81acda2aa77590b2f327b2f76b823767))


### Bug Fixes

* **packages:** consistent react versions ([#1285](https://github.com/videojs/v10/issues/1285)) ([1c937da](https://github.com/videojs/v10/commit/1c937da4704d51c0c64e5085b6f235bb95a236eb))
* **packages:** narrow react peer dependency to v18+ ([#1289](https://github.com/videojs/v10/issues/1289)) ([6fb6ab7](https://github.com/videojs/v10/commit/6fb6ab7dfb4ac2671bfac4269dfc5813ab76f0e8))
* **packages:** remove redundant "Shift" modifier from playback rate hotkeys ([#1290](https://github.com/videojs/v10/issues/1290)) ([a0fd3cb](https://github.com/videojs/v10/commit/a0fd3cbda8101f47806e0e71c727fbf483a1de66))
* **packages:** time slider seek improvements ([#1291](https://github.com/videojs/v10/issues/1291)) ([b934c58](https://github.com/videojs/v10/commit/b934c589f824b0ed7338b19c2b3bad3160742e74))
* **react:** align media component conventions ([#1281](https://github.com/videojs/v10/issues/1281)) ([42abf88](https://github.com/videojs/v10/commit/42abf880955ec68d2c700eaa9bcf18b69c37471c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.16
    * @videojs/spf bumped to 10.0.0-beta.16
    * @videojs/store bumped to 10.0.0-beta.16
    * @videojs/utils bumped to 10.0.0-beta.16
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.16
    * @videojs/skins bumped to 10.0.0-beta.16

## [10.0.0-beta.15](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.14...@videojs/react@10.0.0-beta.15) (2026-04-03)


### Miscellaneous Chores

* **@videojs/react:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.15
    * @videojs/spf bumped to 10.0.0-beta.15
    * @videojs/store bumped to 10.0.0-beta.15
    * @videojs/utils bumped to 10.0.0-beta.15
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.15
    * @videojs/skins bumped to 10.0.0-beta.15

## [10.0.0-beta.14](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.13...@videojs/react@10.0.0-beta.14) (2026-04-03)


### Features

* **packages:** volume slider scroll support ([#1175](https://github.com/videojs/v10/issues/1175)) ([390b004](https://github.com/videojs/v10/commit/390b004d809272fd453b8a73e1969c59410c3620))


### Bug Fixes

* **packages:** make tooltips visual-only and auto-forward media button labels ([#1174](https://github.com/videojs/v10/issues/1174)) ([86cf3e8](https://github.com/videojs/v10/commit/86cf3e8977719fbbdcd59244a543fdd8412c4484))
* **react:** thumbnails broken when using hls media ([#1210](https://github.com/videojs/v10/issues/1210)) ([8b571f5](https://github.com/videojs/v10/commit/8b571f5f05566f52deea866f4a64a7408d6c2c21))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.14
    * @videojs/spf bumped to 10.0.0-beta.14
    * @videojs/store bumped to 10.0.0-beta.14
    * @videojs/utils bumped to 10.0.0-beta.14
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.14
    * @videojs/skins bumped to 10.0.0-beta.14

## [10.0.0-beta.13](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.12...@videojs/react@10.0.0-beta.13) (2026-04-01)


### Miscellaneous Chores

* **@videojs/react:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.13
    * @videojs/spf bumped to 10.0.0-beta.13
    * @videojs/store bumped to 10.0.0-beta.13
    * @videojs/utils bumped to 10.0.0-beta.13
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.13
    * @videojs/skins bumped to 10.0.0-beta.13

## [10.0.0-beta.12](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.11...@videojs/react@10.0.0-beta.12) (2026-04-01)


### Features

* add Mux video component ([#1036](https://github.com/videojs/v10/issues/1036)) ([271a8c8](https://github.com/videojs/v10/commit/271a8c850216bd1654baaa26f8bb2f5eda56be37))
* add native hls media + refactor ([#1154](https://github.com/videojs/v10/issues/1154)) ([1b2afc6](https://github.com/videojs/v10/commit/1b2afc6e41a4a8bb4f3ea42b5c04c6232813727e))
* **packages:** error dialog component ([#1077](https://github.com/videojs/v10/issues/1077)) ([3430fe1](https://github.com/videojs/v10/commit/3430fe1a493e4bee34f03112206a0cb3cf9d88cf))


### Bug Fixes

* **skin:** responsive design fixes and improvements ([#1129](https://github.com/videojs/v10/issues/1129)) ([1082693](https://github.com/videojs/v10/commit/10826932be7861ebf5df8c66db7811c0510339f4))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.12
    * @videojs/spf bumped to 10.0.0-beta.12
    * @videojs/store bumped to 10.0.0-beta.12
    * @videojs/utils bumped to 10.0.0-beta.12
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.12
    * @videojs/skins bumped to 10.0.0-beta.12

## [10.0.0-beta.11](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.10...@videojs/react@10.0.0-beta.11) (2026-03-24)


### Features

* **packages:** export media component building blocks ([#1098](https://github.com/videojs/v10/issues/1098)) ([bc2929e](https://github.com/videojs/v10/commit/bc2929ef4fc7ed021c91d96b96498870ecf5e4e5))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-beta.11
    * @videojs/spf bumped to 10.0.0-beta.11
    * @videojs/store bumped to 10.0.0-beta.11
    * @videojs/utils bumped to 10.0.0-beta.11
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.11
    * @videojs/skins bumped to 10.0.0-beta.11

## [10.0.0-beta.10](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.9...@videojs/react@10.0.0-beta.10) (2026-03-23)


### Bug Fixes

* **react:** add missing destroy cleanups  ([#1096](https://github.com/videojs/v10/issues/1096)) ([1792bae](https://github.com/videojs/v10/commit/1792bae3b4cad5cbb89038e3fa10212f24b49e6b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.10
    * @videojs/core bumped to 10.0.0-beta.10
    * @videojs/store bumped to 10.0.0-beta.10
    * @videojs/utils bumped to 10.0.0-beta.10
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.10
    * @videojs/skins bumped to 10.0.0-beta.10

## [10.0.0-beta.9](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.8...@videojs/react@10.0.0-beta.9) (2026-03-23)


### Features

* **skin:** add error handling for audio players ([#1048](https://github.com/videojs/v10/issues/1048)) ([df927f6](https://github.com/videojs/v10/commit/df927f67fcbd0aaa229b1a8e205ab3cb08f7a42d))


### Bug Fixes

* **docs:** improvements to eject script ([#1012](https://github.com/videojs/v10/issues/1012)) ([559d516](https://github.com/videojs/v10/commit/559d5169b5783992ec792cdb7037c3119cad3e5b))
* **skin:** extract transition properties into CSS custom properties ([#1075](https://github.com/videojs/v10/issues/1075)) ([657e711](https://github.com/videojs/v10/commit/657e7111b423ac2d2a1d0c6422b88297f40e2b04))
* **spf:** implement preload IDL attribute on SpfMedia ([#1069](https://github.com/videojs/v10/issues/1069)) ([04f81a2](https://github.com/videojs/v10/commit/04f81a26e13648ca414f2e51380c8786a06a7724))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.9
    * @videojs/core bumped to 10.0.0-beta.9
    * @videojs/store bumped to 10.0.0-beta.9
    * @videojs/utils bumped to 10.0.0-beta.9
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.9
    * @videojs/skins bumped to 10.0.0-beta.9

## [10.0.0-beta.8](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.7...@videojs/react@10.0.0-beta.8) (2026-03-20)


### Miscellaneous Chores

* **@videojs/react:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.8
    * @videojs/core bumped to 10.0.0-beta.8
    * @videojs/store bumped to 10.0.0-beta.8
    * @videojs/utils bumped to 10.0.0-beta.8
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.8
    * @videojs/skins bumped to 10.0.0-beta.8

## [10.0.0-beta.7](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.6...@videojs/react@10.0.0-beta.7) (2026-03-19)


### Features

* add DashVideo media element (html, react) with sandbox support ([#940](https://github.com/videojs/v10/issues/940)) ([5bdbbec](https://github.com/videojs/v10/commit/5bdbbec8a0f69b4be89600287c63a04746b7ba49))
* **html:** add data-availability to volume slider ([#1001](https://github.com/videojs/v10/issues/1001)) ([c95e134](https://github.com/videojs/v10/commit/c95e1343e16c8667f6b7f5560d12ec5f36f1acd8))
* **html:** refactor attach contexts to carry state and setter ([#1024](https://github.com/videojs/v10/issues/1024)) ([c07da27](https://github.com/videojs/v10/commit/c07da27ead58f2d08b93036af49515800c944f16))
* **packages:** add poster component to video skins ([#994](https://github.com/videojs/v10/issues/994)) ([59bbf6c](https://github.com/videojs/v10/commit/59bbf6c20924ec04e559fe23cbc1a0ad8c8ca080))
* **skin:** add pip-enter and pip-exit icons ([#1015](https://github.com/videojs/v10/issues/1015)) ([81781ca](https://github.com/videojs/v10/commit/81781ca5854f4943b533073b1875b127308a5419))


### Bug Fixes

* **core:** prevent slider thumb jump on pointer release ([#990](https://github.com/videojs/v10/issues/990)) ([b9bada9](https://github.com/videojs/v10/commit/b9bada95675f09b7c7d6859dcd213be7a0408bb7))
* correct popup fallback positioning offsets ([#981](https://github.com/videojs/v10/issues/981)) ([82ede77](https://github.com/videojs/v10/commit/82ede77322204500d7ca0adc5cb24d4f068af462))
* **skin:** hide volume popover when volume control is unsupported ([#1025](https://github.com/videojs/v10/issues/1025)) ([c09dbdd](https://github.com/videojs/v10/commit/c09dbdd121f2b8bb01e42d79350bf7a7acf09f28))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.7
    * @videojs/core bumped to 10.0.0-beta.7
    * @videojs/store bumped to 10.0.0-beta.7
    * @videojs/utils bumped to 10.0.0-beta.7
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.7
    * @videojs/skins bumped to 10.0.0-beta.7

## [10.0.0-beta.6](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.5...@videojs/react@10.0.0-beta.6) (2026-03-15)


### Features

* add slider preview thumbnails ([#935](https://github.com/videojs/v10/issues/935)) ([e3f438e](https://github.com/videojs/v10/commit/e3f438e9f488f41c8cf51c95507bc41fc5b524d0))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.6
    * @videojs/core bumped to 10.0.0-beta.6
    * @videojs/store bumped to 10.0.0-beta.6
    * @videojs/utils bumped to 10.0.0-beta.6
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.6
    * @videojs/skins bumped to 10.0.0-beta.6

## [10.0.0-beta.5](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.4...@videojs/react@10.0.0-beta.5) (2026-03-12)


### Miscellaneous Chores

* **@videojs/react:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.5
    * @videojs/core bumped to 10.0.0-beta.5
    * @videojs/store bumped to 10.0.0-beta.5
    * @videojs/utils bumped to 10.0.0-beta.5
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.5
    * @videojs/skins bumped to 10.0.0-beta.5

## [10.0.0-beta.4](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.3...@videojs/react@10.0.0-beta.4) (2026-03-12)


### Bug Fixes

* **skin:** add missing tooltip provider/group ([#902](https://github.com/videojs/v10/issues/902)) ([1dbcd79](https://github.com/videojs/v10/commit/1dbcd79e541fce77021645d012fb3554d241b16b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.4
    * @videojs/core bumped to 10.0.0-beta.4
    * @videojs/store bumped to 10.0.0-beta.4
    * @videojs/utils bumped to 10.0.0-beta.4
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.4

## [10.0.0-beta.3](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.2...@videojs/react@10.0.0-beta.3) (2026-03-11)


### Bug Fixes

* **skins:** remove legacy caption markup artifacts ([#882](https://github.com/videojs/v10/issues/882)) ([85266ba](https://github.com/videojs/v10/commit/85266bab3b5b01a6cf6d769a16f662bffa57c208))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.3
    * @videojs/core bumped to 10.0.0-beta.3
    * @videojs/store bumped to 10.0.0-beta.3
    * @videojs/utils bumped to 10.0.0-beta.3
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.3

## [10.0.0-beta.2](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.1...@videojs/react@10.0.0-beta.2) (2026-03-10)


### Miscellaneous Chores

* **@videojs/react:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.2
    * @videojs/core bumped to 10.0.0-beta.2
    * @videojs/store bumped to 10.0.0-beta.2
    * @videojs/utils bumped to 10.0.0-beta.2
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.2

## [10.0.0-beta.1](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-beta.0...@videojs/react@10.0.0-beta.1) (2026-03-10)


### Features

* add background video components ([#567](https://github.com/videojs/v10/issues/567)) ([fd14f0c](https://github.com/videojs/v10/commit/fd14f0cb17c2fd1752c82d29252296492ed1568f))
* add background video preset ([#607](https://github.com/videojs/v10/issues/607)) ([c2bc488](https://github.com/videojs/v10/commit/c2bc488366fd28f9a6d00dd28a4f790b5e1400ed))
* add console banner ([#186](https://github.com/videojs/v10/issues/186)) ([072b0de](https://github.com/videojs/v10/commit/072b0dece76289d7d4215907ce70b36debbb78bc))
* add media API + HLS video components ([#507](https://github.com/videojs/v10/issues/507)) ([b3a31a3](https://github.com/videojs/v10/commit/b3a31a335a363d3a96b510206b57d1bb9ebb8edd))
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
* **example/react:** improvements to react examples ([#210](https://github.com/videojs/v10/issues/210)) ([c35b012](https://github.com/videojs/v10/commit/c35b0122509ce3230dcfce4a0acf0d315ba5f0ee))
* **html:** add alert dialog element ([#741](https://github.com/videojs/v10/issues/741)) ([5fc52aa](https://github.com/videojs/v10/commit/5fc52aa969292a8b8f636b532ac5ff27b082b222))
* **html:** add element registrations ([eaaa03c](https://github.com/videojs/v10/commit/eaaa03c284f9fc3c9069bedb74d95c8a951c1b56))
* **html:** add slider element ([#655](https://github.com/videojs/v10/issues/655)) ([d5df015](https://github.com/videojs/v10/commit/d5df0150b3aef21c15d3a65c015bb6058e95ce53))
* **html:** add time slider element ([#656](https://github.com/videojs/v10/issues/656)) ([26c7395](https://github.com/videojs/v10/commit/26c7395cd0fe7e2fe8a8020ffae40cf81ffb3974))
* **html:** add volume slider element ([#657](https://github.com/videojs/v10/issues/657)) ([92b7c2a](https://github.com/videojs/v10/commit/92b7c2ac184d12c780ba1a1bb6f064782b77422a))
* **html:** setup player api ([#374](https://github.com/videojs/v10/issues/374)) ([a419f5e](https://github.com/videojs/v10/commit/a419f5ef190a47575c4a7e11353a5454e6ee7fe6))
* **packages:** add PlaybackRateButton to core, html, and react ([#642](https://github.com/videojs/v10/issues/642)) ([0180828](https://github.com/videojs/v10/commit/0180828df91ad74f885906223fa7d359f1a2641a))
* **react:** add alert dialog component ([#739](https://github.com/videojs/v10/issues/739)) ([536c86d](https://github.com/videojs/v10/commit/536c86d9d1b648f4e1b94b7a55b17735cc0ea03c))
* **react:** add alert dialog to video skin ([#747](https://github.com/videojs/v10/issues/747)) ([5dfc67e](https://github.com/videojs/v10/commit/5dfc67ed02d92512b500c4461898050988e291a8))
* **react:** add captions styling to video skins ([#582](https://github.com/videojs/v10/issues/582)) ([b78c6ce](https://github.com/videojs/v10/commit/b78c6ce7b1942cd00b737059f19bb37dc7585bec))
* **react:** add playback rate button component ([#639](https://github.com/videojs/v10/issues/639)) ([3305fb3](https://github.com/videojs/v10/commit/3305fb3db6f3c89a2ff4fcc3f657e54ddfcbc700))
* **react:** add popover component ([#653](https://github.com/videojs/v10/issues/653)) ([ed43d52](https://github.com/videojs/v10/commit/ed43d52f8fa347acb9dd62f8458a8324e3506fd1))
* **react:** add slider component ([#644](https://github.com/videojs/v10/issues/644)) ([2f8ca09](https://github.com/videojs/v10/commit/2f8ca094ad5bc5bafc5435c2e97bca58c6d29b5d))
* **react:** add slider preview component ([#710](https://github.com/videojs/v10/issues/710)) ([db75697](https://github.com/videojs/v10/commit/db7569711e5a571f6af421987c8490c3de37ed78))
* **react:** add slider thumbnail component ([#722](https://github.com/videojs/v10/issues/722)) ([a6405e9](https://github.com/videojs/v10/commit/a6405e9278bc6e627cc1186f2af227941a1e55c0))
* **react:** add Tailwind ejected video skins ([#589](https://github.com/videojs/v10/issues/589)) ([8763a57](https://github.com/videojs/v10/commit/8763a57360198d3b624363af00563469bb5fd180))
* **react:** add thumbnail component ([#648](https://github.com/videojs/v10/issues/648)) ([40606ff](https://github.com/videojs/v10/commit/40606ff1885f44138fe7f70abcda6ef3bee32413))
* **react:** add time slider component ([#647](https://github.com/videojs/v10/issues/647)) ([158378a](https://github.com/videojs/v10/commit/158378ac731db302b3d1f309de9d93f0f8fc92f2))
* **react:** add tooltip component ([#736](https://github.com/videojs/v10/issues/736)) ([ae754ee](https://github.com/videojs/v10/commit/ae754eec8f3136be08026e08fbf404b4f0f7126e))
* **react:** add video component and utility hooks ([#293](https://github.com/videojs/v10/issues/293)) ([a71a280](https://github.com/videojs/v10/commit/a71a280bdc0299cd78eaa200be4784f6a7720f14))
* **react:** adding simple video ([#125](https://github.com/videojs/v10/issues/125)) ([f6b5f80](https://github.com/videojs/v10/commit/f6b5f804bf92e3e4573a8e93f7051636dcc36143))
* **react:** implement default and minimal video skins ([#550](https://github.com/videojs/v10/issues/550)) ([7d3be36](https://github.com/videojs/v10/commit/7d3be367f5b31b8a6d5b9a9e3c87245f95b8e22a))
* **react:** implement video skins with responsive layout ([#568](https://github.com/videojs/v10/issues/568)) ([846d38e](https://github.com/videojs/v10/commit/846d38e79b11ba8de62bdb239bc1358e9abc28de))
* **react:** initial skin scaffolding ([#523](https://github.com/videojs/v10/issues/523)) ([edefc2a](https://github.com/videojs/v10/commit/edefc2a2d63e2124d0a11a15f44bd7109c6d9788))
* **react:** orientation-aware buffer styling and slider improvements ([#671](https://github.com/videojs/v10/issues/671)) ([86b2f4d](https://github.com/videojs/v10/commit/86b2f4d3b426ce8747af234f2d0f4c4a3ec402ec))
* **react:** port time slider styling into video skin presets ([#666](https://github.com/videojs/v10/issues/666)) ([ebb75f5](https://github.com/videojs/v10/commit/ebb75f5863f137511f6fc75bb7fbf528d45b0d9b))
* **react:** port volume popover and slider styling into skin presets ([#667](https://github.com/videojs/v10/issues/667)) ([6a1edda](https://github.com/videojs/v10/commit/6a1eddadd00b5d9aee45fb774b3d8f953d5c6dcd))
* **react:** setup react player api ([#372](https://github.com/videojs/v10/issues/372)) ([d28dda1](https://github.com/videojs/v10/commit/d28dda114c10d99334a0ec2ffe3c1406aec9eefb))
* **react:** support native caption track shifting in video skins ([#636](https://github.com/videojs/v10/issues/636)) ([ac346db](https://github.com/videojs/v10/commit/ac346dbbd68443558ae16e4c81a28c8c605ae687))
* **react:** use popover and anchor position API ([#178](https://github.com/videojs/v10/issues/178)) ([f513c74](https://github.com/videojs/v10/commit/f513c74a6cebc09ac76512bb86af10a33350f900))
* **react:** use SimpleVideo as default Video and rename HLS version to HlsVideo ([#171](https://github.com/videojs/v10/issues/171)) ([1878a27](https://github.com/videojs/v10/commit/1878a271ba300919d1eff19dd2db79340e8714fa))
* **site:** add buffering indicator api reference ([84b7b07](https://github.com/videojs/v10/commit/84b7b0774a1fb655f4cb7f6a87e589097a661685)), closes [#532](https://github.com/videojs/v10/issues/532) [#533](https://github.com/videojs/v10/issues/533)
* **site:** add TimeSlider, VolumeSlider, Popover API references ([#685](https://github.com/videojs/v10/issues/685)) ([8ab596e](https://github.com/videojs/v10/commit/8ab596ea30291d48962684203d153c689e1b0fec))
* **site:** add util reference pipeline ([#537](https://github.com/videojs/v10/issues/537)) ([78112fb](https://github.com/videojs/v10/commit/78112fbefdaace678a2d1335409e40533f3819fa))
* **skin:** add audio skins for HTML and React presets ([#772](https://github.com/videojs/v10/issues/772)) ([d751fda](https://github.com/videojs/v10/commit/d751fdabea9782b9f6c73aaebfb93ed393e488f7))
* **skin:** add captions button to video skins ([#612](https://github.com/videojs/v10/issues/612)) ([fbf888f](https://github.com/videojs/v10/commit/fbf888fda3ed33d0893321b6b4cac19cfdbd6d97))
* **skin:** add error dialogs ([#603](https://github.com/videojs/v10/issues/603)) ([ba94f74](https://github.com/videojs/v10/commit/ba94f74b91e09ce7ffd4a666562d555b3fbd2fb9))
* **skin:** implement default and minimal skins for HTML player ([#698](https://github.com/videojs/v10/issues/698)) ([c5cafae](https://github.com/videojs/v10/commit/c5cafae57ff34d13f79d11862b82f10414bdcd40))
* **skin:** port tooltip styling from tech preview ([#800](https://github.com/videojs/v10/issues/800)) ([6b6566e](https://github.com/videojs/v10/commit/6b6566e2540b4ad9fcd9b2a8e6c767f5f7e4072f))
* **skins:** add html port of minimal skin ([#140](https://github.com/videojs/v10/issues/140)) ([47ac22e](https://github.com/videojs/v10/commit/47ac22e9b8a513c9640ed1eff20838d8cdb749ce))
* small state and naming fixes  ([#719](https://github.com/videojs/v10/issues/719)) ([5c42245](https://github.com/videojs/v10/commit/5c422452e4b547dc00f13082b755ea12d1860f21))
* **spf:** initial push of SPF ([#784](https://github.com/videojs/v10/issues/784)) ([27a3993](https://github.com/videojs/v10/commit/27a3993fb20af0523e42b0d03c70a6f5a465d144))
* **store:** add reactive state primitives ([#311](https://github.com/videojs/v10/issues/311)) ([beb8615](https://github.com/videojs/v10/commit/beb8615c1c75a996d1e4ea2db804c49acdc10ef0))
* **store:** skin store setup ([#298](https://github.com/videojs/v10/issues/298)) ([b2e2b88](https://github.com/videojs/v10/commit/b2e2b88e19634fa67e064b898e37f954d6939e2a))
* **ui:** skin design improvements, add html frosted skin (WIP) ([#133](https://github.com/videojs/v10/issues/133)) ([75a90e7](https://github.com/videojs/v10/commit/75a90e71041c2d0bf434823e59dd04f86f89b0bb))
* **ui:** skin design tweaks ([#126](https://github.com/videojs/v10/issues/126)) ([a93484e](https://github.com/videojs/v10/commit/a93484e86b1d9209e3c49bfc6b2f5b11db55d7af))


### Bug Fixes

* add aspect-ratio to demos ([#136](https://github.com/videojs/v10/issues/136)) ([e0a46de](https://github.com/videojs/v10/commit/e0a46de0ab56199afd37b24ebfce93ee85e2b699))
* anchor name in popover and tooltip ([#194](https://github.com/videojs/v10/issues/194)) ([d965858](https://github.com/videojs/v10/commit/d9658582f12f9745548bcb9461a3e365adc16339))
* **cd:** add repository field to all packages for provenance verification ([b723589](https://github.com/videojs/v10/commit/b72358904a78a9403df16d77936d4a1f41a64bfe))
* **ci:** rework bundle size report ([#745](https://github.com/videojs/v10/issues/745)) ([9f456f5](https://github.com/videojs/v10/commit/9f456f572f340f88b7e3e57316dd284e48631f78))
* clean up core, less seams in wrappers ([#197](https://github.com/videojs/v10/issues/197)) ([601a5a3](https://github.com/videojs/v10/commit/601a5a37939605ca38f81a825fd02934e7928c39))
* **core:** fix circular import and simplify media types ([#569](https://github.com/videojs/v10/issues/569)) ([38b3a8f](https://github.com/videojs/v10/commit/38b3a8f55ca96938db92fa06c0d171bf544ffe3b))
* destroy hls.js instance on media unmount ([#749](https://github.com/videojs/v10/issues/749)) ([c4e8bbd](https://github.com/videojs/v10/commit/c4e8bbd3a2bcb66027c64faf8de0ec61d22c84fa))
* fix CLS due to popover attribute not SSR ([#202](https://github.com/videojs/v10/issues/202)) ([0952673](https://github.com/videojs/v10/commit/09526731f7e4ee3bd58c45179d37f90dfc96d7a8))
* **html,react:** move @videojs/skins to devDependencies ([#716](https://github.com/videojs/v10/issues/716)) ([55b49ef](https://github.com/videojs/v10/commit/55b49efd82281815abe1e26eb764dfe914bb8208))
* **html:** discover media elements and attach store target via DOM ([#481](https://github.com/videojs/v10/issues/481)) ([5eab1db](https://github.com/videojs/v10/commit/5eab1dbb2fbb906543f7749e5956c9791c30be34))
* **html:** slider interaction and edge alignment broken ([#721](https://github.com/videojs/v10/issues/721)) ([ff12296](https://github.com/videojs/v10/commit/ff122963553e23a58614c9c808763208fd893df1))
* hydration mismatch in Tooltip and Popover ([#190](https://github.com/videojs/v10/issues/190)) ([8b868e9](https://github.com/videojs/v10/commit/8b868e95a3ffd92421ddb2846708d3a2ca8125e3))
* **packages:** enable unbundle mode to avoid mangled exports ([00fdf96](https://github.com/videojs/v10/commit/00fdf966ca5148bcca303058dd798b1b880896e0))
* **packages:** set release-please manifest and package versions to beta.0 ([#850](https://github.com/videojs/v10/issues/850)) ([e085a0d](https://github.com/videojs/v10/commit/e085a0d73af0c142e0c0a371337daae98fdbaac9))
* **packages:** update package READMEs for beta ([#848](https://github.com/videojs/v10/issues/848)) ([9562a0e](https://github.com/videojs/v10/commit/9562a0ecca212034759d7cc948d4b3f0bc7a19c3))
* **packages:** update version badges ([#138](https://github.com/videojs/v10/issues/138)) ([22d9cb6](https://github.com/videojs/v10/commit/22d9cb64f2e5b9601a2039bb166dbe3fee6a1b3e))
* **react, html:** rename MediaProvider (and related) to VideoProvider ([#159](https://github.com/videojs/v10/issues/159)) ([f285573](https://github.com/videojs/v10/commit/f28557359c7dda0282f9d532fa4b2fce19766e40))
* **react:** correct buffer selector names in minimal skin CSS ([#672](https://github.com/videojs/v10/issues/672)) ([12277fd](https://github.com/videojs/v10/commit/12277fdac89cc1251f1518b92411f15d1386793a))
* **react:** move @videojs/icons to devDependencies ([f09c686](https://github.com/videojs/v10/commit/f09c6861c1b2398e3f2ce2c1e711f5e08dfa1421))
* **react:** prevent dev build race condition ([#139](https://github.com/videojs/v10/issues/139)) ([67d1007](https://github.com/videojs/v10/commit/67d1007d0c78564537f38f1683a45af320869465))
* **react:** set anchor-name and position-anchor imperatively in popover ([#715](https://github.com/videojs/v10/issues/715)) ([070d094](https://github.com/videojs/v10/commit/070d0944448fae4fd8ec140a13c5c073c31ccdc4))
* **react:** strict mode support ([#742](https://github.com/videojs/v10/issues/742)) ([44d874d](https://github.com/videojs/v10/commit/44d874ddc225b9b8aaf6d8689bdb48ef0ac729fb))
* **react:** update use client usage in react package modules for next.js use ([#157](https://github.com/videojs/v10/issues/157)) ([16cfde1](https://github.com/videojs/v10/commit/16cfde138d5a8c9fb919c49f49240ebacb1d0639))
* **react:** use relative import path for useForceRender ([#669](https://github.com/videojs/v10/issues/669)) ([e3d7f4b](https://github.com/videojs/v10/commit/e3d7f4b277182a32ae57b4ce73fa190d774c5730))
* revert preset provider ([#631](https://github.com/videojs/v10/issues/631)) ([5f1cafa](https://github.com/videojs/v10/commit/5f1cafaa25b8a58e06aae00f2ea1495c2aae2916))
* **root:** add videojs keyword to package.json ([4a9f8b2](https://github.com/videojs/v10/commit/4a9f8b2ad6fb27b463dcfe8d1a5fd883c9fa21d1))
* **site:** resolve aliased part descriptions in api docs ([#518](https://github.com/videojs/v10/issues/518)) ([8294404](https://github.com/videojs/v10/commit/82944041f903ead4bb8afbce35fbfb7977caa23b))
* **site:** update discord link ([#170](https://github.com/videojs/v10/issues/170)) ([bb10294](https://github.com/videojs/v10/commit/bb10294419439fb02df650f3e7f7c5496ecc3a73))
* **skins:** remove vjs- prefixed CSS custom properties ([#179](https://github.com/videojs/v10/issues/179)) ([a62623b](https://github.com/videojs/v10/commit/a62623ba41d294edead981a1b468f7f486c91625))
* **skins:** slightly more idiomatic Tailwind, added custom properties ([#175](https://github.com/videojs/v10/issues/175)) ([694afb7](https://github.com/videojs/v10/commit/694afb7de992edbd667bc3d895df8bf198ccabb3))
* **skin:** temporarily hide the caption button ([#629](https://github.com/videojs/v10/issues/629)) ([0666d52](https://github.com/videojs/v10/commit/0666d526b1eb4de6af12a7710e119c588019c19f))
* use popover core in react popover ([#208](https://github.com/videojs/v10/issues/208)) ([99fef78](https://github.com/videojs/v10/commit/99fef78f63e8dd121513b9cd20696a7d35603837))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.1
    * @videojs/core bumped to 10.0.0-beta.1
    * @videojs/store bumped to 10.0.0-beta.1
    * @videojs/utils bumped to 10.0.0-beta.1
  * devDependencies
    * @videojs/icons bumped to 10.0.0-beta.1

## [10.0.0-alpha.11](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-alpha.10...@videojs/react@10.0.0-alpha.11) (2026-03-10)


### Miscellaneous Chores

* **@videojs/react:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-alpha.11
    * @videojs/core bumped to 10.0.0-alpha.11
    * @videojs/store bumped to 10.0.0-alpha.11
    * @videojs/utils bumped to 10.0.0-alpha.11
  * devDependencies
    * @videojs/icons bumped to 10.0.0-alpha.11

## [10.0.0-alpha.10](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-alpha.9...@videojs/react@10.0.0-alpha.10) (2026-03-10)


### Features

* **skin:** add audio skins for HTML and React presets ([#772](https://github.com/videojs/v10/issues/772)) ([d751fda](https://github.com/videojs/v10/commit/d751fdabea9782b9f6c73aaebfb93ed393e488f7))
* **skin:** port tooltip styling from tech preview ([#800](https://github.com/videojs/v10/issues/800)) ([6b6566e](https://github.com/videojs/v10/commit/6b6566e2540b4ad9fcd9b2a8e6c767f5f7e4072f))
* **spf:** initial push of SPF ([#784](https://github.com/videojs/v10/issues/784)) ([27a3993](https://github.com/videojs/v10/commit/27a3993fb20af0523e42b0d03c70a6f5a465d144))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-alpha.10
    * @videojs/core bumped to 10.0.0-alpha.10
    * @videojs/store bumped to 10.0.0-alpha.10
    * @videojs/utils bumped to 10.0.0-alpha.10
  * devDependencies
    * @videojs/icons bumped to 10.0.0-alpha.10

## [10.0.0-alpha.9](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-alpha.8...@videojs/react@10.0.0-alpha.9) (2026-03-06)


### Features

* add subtitles handling + captions core ([#692](https://github.com/videojs/v10/issues/692)) ([5c11606](https://github.com/videojs/v10/commit/5c116065a91ed04753bb2cb83e72dd6471f75ced))
* **html:** add alert dialog element ([#741](https://github.com/videojs/v10/issues/741)) ([5fc52aa](https://github.com/videojs/v10/commit/5fc52aa969292a8b8f636b532ac5ff27b082b222))
* **react:** add alert dialog component ([#739](https://github.com/videojs/v10/issues/739)) ([536c86d](https://github.com/videojs/v10/commit/536c86d9d1b648f4e1b94b7a55b17735cc0ea03c))
* **react:** add alert dialog to video skin ([#747](https://github.com/videojs/v10/issues/747)) ([5dfc67e](https://github.com/videojs/v10/commit/5dfc67ed02d92512b500c4461898050988e291a8))


### Bug Fixes

* **ci:** rework bundle size report ([#745](https://github.com/videojs/v10/issues/745)) ([9f456f5](https://github.com/videojs/v10/commit/9f456f572f340f88b7e3e57316dd284e48631f78))
* destroy hls.js instance on media unmount ([#749](https://github.com/videojs/v10/issues/749)) ([c4e8bbd](https://github.com/videojs/v10/commit/c4e8bbd3a2bcb66027c64faf8de0ec61d22c84fa))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.9
    * @videojs/store bumped to 10.0.0-alpha.9
    * @videojs/utils bumped to 10.0.0-alpha.9
  * devDependencies
    * @videojs/icons bumped to 10.0.0-alpha.9

## [10.0.0-alpha.8](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-alpha.7...@videojs/react@10.0.0-alpha.8) (2026-03-05)


### Features

* **react:** add slider preview component ([#710](https://github.com/videojs/v10/issues/710)) ([db75697](https://github.com/videojs/v10/commit/db7569711e5a571f6af421987c8490c3de37ed78))
* **react:** add slider thumbnail component ([#722](https://github.com/videojs/v10/issues/722)) ([a6405e9](https://github.com/videojs/v10/commit/a6405e9278bc6e627cc1186f2af227941a1e55c0))
* **react:** add tooltip component ([#736](https://github.com/videojs/v10/issues/736)) ([ae754ee](https://github.com/videojs/v10/commit/ae754eec8f3136be08026e08fbf404b4f0f7126e))
* small state and naming fixes  ([#719](https://github.com/videojs/v10/issues/719)) ([5c42245](https://github.com/videojs/v10/commit/5c422452e4b547dc00f13082b755ea12d1860f21))


### Bug Fixes

* **html:** slider interaction and edge alignment broken ([#721](https://github.com/videojs/v10/issues/721)) ([ff12296](https://github.com/videojs/v10/commit/ff122963553e23a58614c9c808763208fd893df1))
* **react:** set anchor-name and position-anchor imperatively in popover ([#715](https://github.com/videojs/v10/issues/715)) ([070d094](https://github.com/videojs/v10/commit/070d0944448fae4fd8ec140a13c5c073c31ccdc4))
* **react:** strict mode support ([#742](https://github.com/videojs/v10/issues/742)) ([44d874d](https://github.com/videojs/v10/commit/44d874ddc225b9b8aaf6d8689bdb48ef0ac729fb))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.8
    * @videojs/store bumped to 10.0.0-alpha.8
    * @videojs/utils bumped to 10.0.0-alpha.8
  * devDependencies
    * @videojs/icons bumped to 10.0.0-alpha.8

## [10.0.0-alpha.7](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-alpha.6...@videojs/react@10.0.0-alpha.7) (2026-03-04)


### Bug Fixes

* **html,react:** move @videojs/skins to devDependencies ([#716](https://github.com/videojs/v10/issues/716)) ([55b49ef](https://github.com/videojs/v10/commit/55b49efd82281815abe1e26eb764dfe914bb8208))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.7
    * @videojs/store bumped to 10.0.0-alpha.7
    * @videojs/utils bumped to 10.0.0-alpha.7
  * devDependencies
    * @videojs/icons bumped to 10.0.0-alpha.7

## [10.0.0-alpha.6](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-alpha.5...@videojs/react@10.0.0-alpha.6) (2026-03-04)


### Miscellaneous Chores

* **@videojs/react:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.6
    * @videojs/store bumped to 10.0.0-alpha.6
    * @videojs/utils bumped to 10.0.0-alpha.6
  * devDependencies
    * @videojs/icons bumped to 10.0.0-alpha.6

## [10.0.0-alpha.5](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-alpha.4...@videojs/react@10.0.0-alpha.5) (2026-03-04)


### Features

* **html:** add slider element ([#655](https://github.com/videojs/v10/issues/655)) ([d5df015](https://github.com/videojs/v10/commit/d5df0150b3aef21c15d3a65c015bb6058e95ce53))
* **html:** add time slider element ([#656](https://github.com/videojs/v10/issues/656)) ([26c7395](https://github.com/videojs/v10/commit/26c7395cd0fe7e2fe8a8020ffae40cf81ffb3974))
* **html:** add volume slider element ([#657](https://github.com/videojs/v10/issues/657)) ([92b7c2a](https://github.com/videojs/v10/commit/92b7c2ac184d12c780ba1a1bb6f064782b77422a))
* **packages:** add PlaybackRateButton to core, html, and react ([#642](https://github.com/videojs/v10/issues/642)) ([0180828](https://github.com/videojs/v10/commit/0180828df91ad74f885906223fa7d359f1a2641a))
* **react:** add playback rate button component ([#639](https://github.com/videojs/v10/issues/639)) ([3305fb3](https://github.com/videojs/v10/commit/3305fb3db6f3c89a2ff4fcc3f657e54ddfcbc700))
* **react:** add popover component ([#653](https://github.com/videojs/v10/issues/653)) ([ed43d52](https://github.com/videojs/v10/commit/ed43d52f8fa347acb9dd62f8458a8324e3506fd1))
* **react:** add slider component ([#644](https://github.com/videojs/v10/issues/644)) ([2f8ca09](https://github.com/videojs/v10/commit/2f8ca094ad5bc5bafc5435c2e97bca58c6d29b5d))
* **react:** add thumbnail component ([#648](https://github.com/videojs/v10/issues/648)) ([40606ff](https://github.com/videojs/v10/commit/40606ff1885f44138fe7f70abcda6ef3bee32413))
* **react:** add time slider component ([#647](https://github.com/videojs/v10/issues/647)) ([158378a](https://github.com/videojs/v10/commit/158378ac731db302b3d1f309de9d93f0f8fc92f2))
* **react:** orientation-aware buffer styling and slider improvements ([#671](https://github.com/videojs/v10/issues/671)) ([86b2f4d](https://github.com/videojs/v10/commit/86b2f4d3b426ce8747af234f2d0f4c4a3ec402ec))
* **react:** port time slider styling into video skin presets ([#666](https://github.com/videojs/v10/issues/666)) ([ebb75f5](https://github.com/videojs/v10/commit/ebb75f5863f137511f6fc75bb7fbf528d45b0d9b))
* **react:** port volume popover and slider styling into skin presets ([#667](https://github.com/videojs/v10/issues/667)) ([6a1edda](https://github.com/videojs/v10/commit/6a1eddadd00b5d9aee45fb774b3d8f953d5c6dcd))
* **react:** support native caption track shifting in video skins ([#636](https://github.com/videojs/v10/issues/636)) ([ac346db](https://github.com/videojs/v10/commit/ac346dbbd68443558ae16e4c81a28c8c605ae687))
* **site:** add TimeSlider, VolumeSlider, Popover API references ([#685](https://github.com/videojs/v10/issues/685)) ([8ab596e](https://github.com/videojs/v10/commit/8ab596ea30291d48962684203d153c689e1b0fec))
* **skin:** implement default and minimal skins for HTML player ([#698](https://github.com/videojs/v10/issues/698)) ([c5cafae](https://github.com/videojs/v10/commit/c5cafae57ff34d13f79d11862b82f10414bdcd40))


### Bug Fixes

* **react:** correct buffer selector names in minimal skin CSS ([#672](https://github.com/videojs/v10/issues/672)) ([12277fd](https://github.com/videojs/v10/commit/12277fdac89cc1251f1518b92411f15d1386793a))
* **react:** use relative import path for useForceRender ([#669](https://github.com/videojs/v10/issues/669)) ([e3d7f4b](https://github.com/videojs/v10/commit/e3d7f4b277182a32ae57b4ce73fa190d774c5730))
* revert preset provider ([#631](https://github.com/videojs/v10/issues/631)) ([5f1cafa](https://github.com/videojs/v10/commit/5f1cafaa25b8a58e06aae00f2ea1495c2aae2916))
* **skin:** temporarily hide the caption button ([#629](https://github.com/videojs/v10/issues/629)) ([0666d52](https://github.com/videojs/v10/commit/0666d526b1eb4de6af12a7710e119c588019c19f))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.5
    * @videojs/store bumped to 10.0.0-alpha.5
    * @videojs/utils bumped to 10.0.0-alpha.5
  * devDependencies
    * @videojs/icons bumped to 10.0.0-alpha.5

## [10.0.0-alpha.4](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-alpha.3...@videojs/react@10.0.0-alpha.4) (2026-02-26)


### Features

* add background video preset ([#607](https://github.com/videojs/v10/issues/607)) ([c2bc488](https://github.com/videojs/v10/commit/c2bc488366fd28f9a6d00dd28a4f790b5e1400ed))


### Bug Fixes

* **react:** move @videojs/icons to devDependencies ([f09c686](https://github.com/videojs/v10/commit/f09c6861c1b2398e3f2ce2c1e711f5e08dfa1421))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.4
    * @videojs/store bumped to 10.0.0-alpha.4
    * @videojs/utils bumped to 10.0.0-alpha.4
  * devDependencies
    * @videojs/icons bumped to 10.0.0-alpha.4

## [10.0.0-alpha.3](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-alpha.2...@videojs/react@10.0.0-alpha.3) (2026-02-26)


### Bug Fixes

* **cd:** add repository field to all packages for provenance verification ([b723589](https://github.com/videojs/v10/commit/b72358904a78a9403df16d77936d4a1f41a64bfe))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.3
    * @videojs/icons bumped to 10.0.0-alpha.3
    * @videojs/store bumped to 10.0.0-alpha.3
    * @videojs/utils bumped to 10.0.0-alpha.3

## [10.0.0-alpha.2](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-alpha.1...@videojs/react@10.0.0-alpha.2) (2026-02-26)


### Miscellaneous Chores

* **@videojs/react:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.2
    * @videojs/icons bumped to 10.0.0-alpha.2
    * @videojs/store bumped to 10.0.0-alpha.2
    * @videojs/utils bumped to 10.0.0-alpha.2

## [10.0.0-alpha.1](https://github.com/videojs/v10/compare/@videojs/react@10.0.0-alpha.0...@videojs/react@10.0.0-alpha.1) (2026-02-26)


### Features

* add a solution for React preview time display ([#50](https://github.com/videojs/v10/issues/50)) ([f78b09f](https://github.com/videojs/v10/commit/f78b09fd16b7a9ee5a404c9260e3e764fb77ddde))
* add background video components ([#567](https://github.com/videojs/v10/issues/567)) ([fd14f0c](https://github.com/videojs/v10/commit/fd14f0cb17c2fd1752c82d29252296492ed1568f))
* add compound html timerange component ([#14](https://github.com/videojs/v10/issues/14)) ([017ecdb](https://github.com/videojs/v10/commit/017ecdbff991d140ea42e4a855269a54e0a19adc))
* add console banner ([#186](https://github.com/videojs/v10/issues/186)) ([072b0de](https://github.com/videojs/v10/commit/072b0dece76289d7d4215907ce70b36debbb78bc))
* add core range, time and volume range ([#23](https://github.com/videojs/v10/issues/23)) ([687b765](https://github.com/videojs/v10/commit/687b7655b0b6356c28663ca85c8f6d25a1023c18))
* add data style attributes to popover ([#62](https://github.com/videojs/v10/issues/62)) ([6d7325c](https://github.com/videojs/v10/commit/6d7325cedb182c37b955e729d32204e4afbba948))
* add display click to play / pause ([#117](https://github.com/videojs/v10/issues/117)) ([4f06ef6](https://github.com/videojs/v10/commit/4f06ef6c7684fd7064ca76685003a1c38ebd09cd))
* add focus state to sliders and volume slider ([#60](https://github.com/videojs/v10/issues/60)) ([f514051](https://github.com/videojs/v10/commit/f514051263f95d892315eed9d44b3d83829e5d4b))
* add HTML tooltip component ([#40](https://github.com/videojs/v10/issues/40)) ([d2a0b27](https://github.com/videojs/v10/commit/d2a0b27272f1967e5f7cde2df12920af92e3c300))
* add keyboard control to sliders ([#115](https://github.com/videojs/v10/issues/115)) ([0a49026](https://github.com/videojs/v10/commit/0a4902623d58f51055b1cc65498a0e716533ec29))
* add media API + HLS video components ([#507](https://github.com/videojs/v10/issues/507)) ([b3a31a3](https://github.com/videojs/v10/commit/b3a31a335a363d3a96b510206b57d1bb9ebb8edd))
* add popover React component ([#33](https://github.com/videojs/v10/issues/33)) ([f775a3d](https://github.com/videojs/v10/commit/f775a3daf7573efb7fdbb15e96cf100daba4a487))
* add range orientation to react components ([#30](https://github.com/videojs/v10/issues/30)) ([5e3cb8a](https://github.com/videojs/v10/commit/5e3cb8ad8134ecaf20b6e021e301a38b8ed06de2))
* add React tooltip component ([#35](https://github.com/videojs/v10/issues/35)) ([c4a3f1b](https://github.com/videojs/v10/commit/c4a3f1b2f61d67f3346acd4aa2bf13630a6283eb))
* add showRemaining functionality to current time display ([ab07a8a](https://github.com/videojs/v10/commit/ab07a8a9a26f68066e292718f3cd17a2640c5477))
* add tooltip core ([#212](https://github.com/videojs/v10/issues/212)) ([cbf41ce](https://github.com/videojs/v10/commit/cbf41ce4c750cd5c3bb6cbf247bad91ccd578cd0))
* add transition status to React tooltip ([#42](https://github.com/videojs/v10/issues/42)) ([39e862a](https://github.com/videojs/v10/commit/39e862a48704d31c9c1ca932a789438e3c54ec31))
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
* **example/react:** improvements to react examples ([#210](https://github.com/videojs/v10/issues/210)) ([c35b012](https://github.com/videojs/v10/commit/c35b0122509ce3230dcfce4a0acf0d315ba5f0ee))
* **html:** add element registrations ([eaaa03c](https://github.com/videojs/v10/commit/eaaa03c284f9fc3c9069bedb74d95c8a951c1b56))
* **html:** setup player api ([#374](https://github.com/videojs/v10/issues/374)) ([a419f5e](https://github.com/videojs/v10/commit/a419f5ef190a47575c4a7e11353a5454e6ee7fe6))
* implement current time display components ([5bd0a15](https://github.com/videojs/v10/commit/5bd0a154dbba01d2a5d11eb1f548fe4baa581675))
* initialize Video.js 10 monorepo with core architecture ([4b0d84e](https://github.com/videojs/v10/commit/4b0d84e9c8adfa7401084389da5deb751420b629))
* make time range compound component ([#10](https://github.com/videojs/v10/issues/10)) ([71a8daf](https://github.com/videojs/v10/commit/71a8dafd741c50fb489707678e23807fabe4cb4e))
* **media-store,html,react:** implement TimeRange component with hook-style architecture ([c29fd2c](https://github.com/videojs/v10/commit/c29fd2c2c1edd61c09a6683041c709a990d8a6f0))
* migrate entire monorepo from tsc to tsup for production builds ([7403cc7](https://github.com/videojs/v10/commit/7403cc728119322888e527468a07a7634f43b32a))
* migrate examples from prototype and add CSS modules support ([19c85fc](https://github.com/videojs/v10/commit/19c85fc2f8eb50c04dc6fa40322a2bd03358ad2e))
* **monorepo:** migrate prototype code to organized package structure ([4b472ec](https://github.com/videojs/v10/commit/4b472ec49cd91f0af61cb5aaa039d428982d3b91))
* **react-icons:** implement SVGR-powered auto-generation with full styling support ([6fcb18f](https://github.com/videojs/v10/commit/6fcb18f1d2b108990025f8ea67b3a31e17879d49))
* **react-media-store:** add shallowEqual utility for optimized state comparisons ([8e75d62](https://github.com/videojs/v10/commit/8e75d62f629b9320aeef48801856e1afb6c341ef))
* **react:** add captions styling to video skins ([#582](https://github.com/videojs/v10/issues/582)) ([b78c6ce](https://github.com/videojs/v10/commit/b78c6ce7b1942cd00b737059f19bb37dc7585bec))
* **react:** add fullscreen button component ([7d819df](https://github.com/videojs/v10/commit/7d819dfcd97a545ee46e1a62a20e553896b6e92e))
* **react:** add MediaContainer component for fullscreen functionality ([23e3876](https://github.com/videojs/v10/commit/23e38766308a21a7e5b17196344159f06581813c))
* **react:** add Tailwind ejected video skins ([#589](https://github.com/videojs/v10/issues/589)) ([8763a57](https://github.com/videojs/v10/commit/8763a57360198d3b624363af00563469bb5fd180))
* **react:** add Tailwind v4 compiled CSS for skins with vjs prefix ([#114](https://github.com/videojs/v10/issues/114)) ([92b82e9](https://github.com/videojs/v10/commit/92b82e94f9cc856164f3b1c1a4e356fb2b07a73f))
* **react:** add video component and utility hooks ([#293](https://github.com/videojs/v10/issues/293)) ([a71a280](https://github.com/videojs/v10/commit/a71a280bdc0299cd78eaa200be4784f6a7720f14))
* **react:** adding simple video ([#125](https://github.com/videojs/v10/issues/125)) ([f6b5f80](https://github.com/videojs/v10/commit/f6b5f804bf92e3e4573a8e93f7051636dcc36143))
* **react:** enable automatic CSS injection for MediaSkinDefault component ([bc8adaa](https://github.com/videojs/v10/commit/bc8adaa508802e9db95953e32963fe0e88107acf))
* **react:** implement default and minimal video skins ([#550](https://github.com/videojs/v10/issues/550)) ([7d3be36](https://github.com/videojs/v10/commit/7d3be367f5b31b8a6d5b9a9e3c87245f95b8e22a))
* **react:** implement duration display component ([c5b659f](https://github.com/videojs/v10/commit/c5b659f4493787cadead2196c41e7f697c9737c7))
* **react:** implement video skins with responsive layout ([#568](https://github.com/videojs/v10/issues/568)) ([846d38e](https://github.com/videojs/v10/commit/846d38e79b11ba8de62bdb239bc1358e9abc28de))
* **react:** initial skin scaffolding ([#523](https://github.com/videojs/v10/issues/523)) ([edefc2a](https://github.com/videojs/v10/commit/edefc2a2d63e2124d0a11a15f44bd7109c6d9788))
* **react:** setup react player api ([#372](https://github.com/videojs/v10/issues/372)) ([d28dda1](https://github.com/videojs/v10/commit/d28dda114c10d99334a0ec2ffe3c1406aec9eefb))
* **react:** use popover and anchor position API ([#178](https://github.com/videojs/v10/issues/178)) ([f513c74](https://github.com/videojs/v10/commit/f513c74a6cebc09ac76512bb86af10a33350f900))
* **react:** use SimpleVideo as default Video and rename HLS version to HlsVideo ([#171](https://github.com/videojs/v10/issues/171)) ([1878a27](https://github.com/videojs/v10/commit/1878a271ba300919d1eff19dd2db79340e8714fa))
* rename range to slider ([#46](https://github.com/videojs/v10/issues/46)) ([9c6eaef](https://github.com/videojs/v10/commit/9c6eaef2aa61771ae1407d0a594b3f790e0ff665))
* **site:** add buffering indicator api reference ([84b7b07](https://github.com/videojs/v10/commit/84b7b0774a1fb655f4cb7f6a87e589097a661685)), closes [#532](https://github.com/videojs/v10/issues/532) [#533](https://github.com/videojs/v10/issues/533)
* **site:** add util reference pipeline ([#537](https://github.com/videojs/v10/issues/537)) ([78112fb](https://github.com/videojs/v10/commit/78112fbefdaace678a2d1335409e40533f3819fa))
* **skin:** add captions button to video skins ([#612](https://github.com/videojs/v10/issues/612)) ([fbf888f](https://github.com/videojs/v10/commit/fbf888fda3ed33d0893321b6b4cac19cfdbd6d97))
* **skin:** add error dialogs ([#603](https://github.com/videojs/v10/issues/603)) ([ba94f74](https://github.com/videojs/v10/commit/ba94f74b91e09ce7ffd4a666562d555b3fbd2fb9))
* **skins:** add html port of minimal skin ([#140](https://github.com/videojs/v10/issues/140)) ([47ac22e](https://github.com/videojs/v10/commit/47ac22e9b8a513c9640ed1eff20838d8cdb749ce))
* **skins:** integrate duration display into default skins ([2ed2191](https://github.com/videojs/v10/commit/2ed219158ddf6f720ce1be8e328bec4603a7e847))
* **store:** add reactive state primitives ([#311](https://github.com/videojs/v10/issues/311)) ([beb8615](https://github.com/videojs/v10/commit/beb8615c1c75a996d1e4ea2db804c49acdc10ef0))
* **store:** skin store setup ([#298](https://github.com/videojs/v10/issues/298)) ([b2e2b88](https://github.com/videojs/v10/commit/b2e2b88e19634fa67e064b898e37f954d6939e2a))
* **ui:** add toasted skin ([bdd2f36](https://github.com/videojs/v10/commit/bdd2f36e13cf53fb2cec61730dece42a1ce8ce84))
* **ui:** micro icons, toasted design tweaks ([#52](https://github.com/videojs/v10/issues/52)) ([bd3f0f7](https://github.com/videojs/v10/commit/bd3f0f7510480125653506d8e2e560234f6c06f2))
* **ui:** minor style tweaks ([d3221ec](https://github.com/videojs/v10/commit/d3221ec21181090f7c5694f1951636c13b4c330b))
* **ui:** more skin style tweaks ([#53](https://github.com/videojs/v10/issues/53)) ([7c9a0a5](https://github.com/videojs/v10/commit/7c9a0a5e3e838c430c073b0b36dff3a81ad9aa46))
* **ui:** port over default skin ([ff4ea36](https://github.com/videojs/v10/commit/ff4ea3693e63ab3b5a728988ca44f3bab669e8ff))
* **ui:** port over default skin ([9950945](https://github.com/videojs/v10/commit/995094500823e1063e7ae291c9a2ea9a4aa74847))
* **ui:** skin and icon tweaks ([#59](https://github.com/videojs/v10/issues/59)) ([cdebece](https://github.com/videojs/v10/commit/cdebece1ebe8e5160b90e49ac2cbf05a7e0b6dca))
* **ui:** skin design improvements, add html frosted skin (WIP) ([#133](https://github.com/videojs/v10/issues/133)) ([75a90e7](https://github.com/videojs/v10/commit/75a90e71041c2d0bf434823e59dd04f86f89b0bb))
* **ui:** skin design tweaks ([#126](https://github.com/videojs/v10/issues/126)) ([a93484e](https://github.com/videojs/v10/commit/a93484e86b1d9209e3c49bfc6b2f5b11db55d7af))
* **ui:** styling fixes for toasted skin ([#38](https://github.com/videojs/v10/issues/38)) ([4ffaa58](https://github.com/videojs/v10/commit/4ffaa586340688ac9f5fb6d2ae3c02a62e9c4ab7))


### Bug Fixes

* add aspect-ratio to demos ([#136](https://github.com/videojs/v10/issues/136)) ([e0a46de](https://github.com/videojs/v10/commit/e0a46de0ab56199afd37b24ebfce93ee85e2b699))
* anchor name in popover and tooltip ([#194](https://github.com/videojs/v10/issues/194)) ([d965858](https://github.com/videojs/v10/commit/d9658582f12f9745548bcb9461a3e365adc16339))
* clean up core, less seams in wrappers ([#197](https://github.com/videojs/v10/issues/197)) ([601a5a3](https://github.com/videojs/v10/commit/601a5a37939605ca38f81a825fd02934e7928c39))
* **core:** fix circular import and simplify media types ([#569](https://github.com/videojs/v10/issues/569)) ([38b3a8f](https://github.com/videojs/v10/commit/38b3a8f55ca96938db92fa06c0d171bf544ffe3b))
* design tweaks to toasted skin, lint rule tweaks ([#44](https://github.com/videojs/v10/issues/44)) ([3a0767c](https://github.com/videojs/v10/commit/3a0767c3407b2d6d8af3d3a8afd57b1e76efda85))
* enable eslint & run eslint:fix ([#43](https://github.com/videojs/v10/issues/43)) ([5cb93a1](https://github.com/videojs/v10/commit/5cb93a14a7f47d66d5c71f9b82867621beda236c))
* fix CLS due to popover attribute not SSR ([#202](https://github.com/videojs/v10/issues/202)) ([0952673](https://github.com/videojs/v10/commit/09526731f7e4ee3bd58c45179d37f90dfc96d7a8))
* **html:** discover media elements and attach store target via DOM ([#481](https://github.com/videojs/v10/issues/481)) ([5eab1db](https://github.com/videojs/v10/commit/5eab1dbb2fbb906543f7749e5956c9791c30be34))
* hydration mismatch in Tooltip and Popover ([#190](https://github.com/videojs/v10/issues/190)) ([8b868e9](https://github.com/videojs/v10/commit/8b868e95a3ffd92421ddb2846708d3a2ca8125e3))
* **icons:** add currentColor fill to fullscreen icons for proper theming ([d0d4876](https://github.com/videojs/v10/commit/d0d487601eb2da669be9a83cc8201d94998ec334))
* minimal volume slider bug & fix dev infinite bug ([#73](https://github.com/videojs/v10/issues/73)) ([591dab6](https://github.com/videojs/v10/commit/591dab66caf8829017688007320f92b7445c4baa))
* **packages:** enable unbundle mode to avoid mangled exports ([00fdf96](https://github.com/videojs/v10/commit/00fdf966ca5148bcca303058dd798b1b880896e0))
* **packages:** update version badges ([#138](https://github.com/videojs/v10/issues/138)) ([22d9cb6](https://github.com/videojs/v10/commit/22d9cb64f2e5b9601a2039bb166dbe3fee6a1b3e))
* React version mismatch, add forward refs ([0a42bfe](https://github.com/videojs/v10/commit/0a42bfe86d1432c30a9f632a4235e4317c5b87e9))
* **react, html:** rename MediaProvider (and related) to VideoProvider ([#159](https://github.com/videojs/v10/issues/159)) ([f285573](https://github.com/videojs/v10/commit/f28557359c7dda0282f9d532fa4b2fce19766e40))
* **react:** implement proper HTML boolean data attributes for components ([26998a1](https://github.com/videojs/v10/commit/26998a121710d57c56eaf8dfe9f423a4fe91a401))
* **react:** prevent dev build race condition ([#139](https://github.com/videojs/v10/issues/139)) ([67d1007](https://github.com/videojs/v10/commit/67d1007d0c78564537f38f1683a45af320869465))
* **react:** update use client usage in react package modules for next.js use ([#157](https://github.com/videojs/v10/issues/157)) ([16cfde1](https://github.com/videojs/v10/commit/16cfde138d5a8c9fb919c49f49240ebacb1d0639))
* resolve package dependency and TypeScript export issues ([7154b1e](https://github.com/videojs/v10/commit/7154b1e44674a61735ab0f393a8bed3fcc689f8d))
* resolve TypeScript build errors across packages ([374db7a](https://github.com/videojs/v10/commit/374db7afc07d6211bfd3f8079bbcd9613f3b69f3))
* **root:** add videojs keyword to package.json ([4a9f8b2](https://github.com/videojs/v10/commit/4a9f8b2ad6fb27b463dcfe8d1a5fd883c9fa21d1))
* seek jump back to current time ([#22](https://github.com/videojs/v10/issues/22)) ([a3f9630](https://github.com/videojs/v10/commit/a3f9630bd1eb34a16f339ffd30071b8adc864ca0))
* **site:** resolve aliased part descriptions in api docs ([#518](https://github.com/videojs/v10/issues/518)) ([8294404](https://github.com/videojs/v10/commit/82944041f903ead4bb8afbce35fbfb7977caa23b))
* **site:** update discord link ([#170](https://github.com/videojs/v10/issues/170)) ([bb10294](https://github.com/videojs/v10/commit/bb10294419439fb02df650f3e7f7c5496ecc3a73))
* skin exports/imports ([0afa9b7](https://github.com/videojs/v10/commit/0afa9b7187088b42408e6c64eff9026484473183))
* skin syntax usage cleanup ([#48](https://github.com/videojs/v10/issues/48)) ([d4f3f4b](https://github.com/videojs/v10/commit/d4f3f4b75b2c94c47b18242f131ac7050eb54cfc))
* **skins:** remove vjs- prefixed CSS custom properties ([#179](https://github.com/videojs/v10/issues/179)) ([a62623b](https://github.com/videojs/v10/commit/a62623ba41d294edead981a1b468f7f486c91625))
* **skins:** slightly more idiomatic Tailwind, added custom properties ([#175](https://github.com/videojs/v10/issues/175)) ([694afb7](https://github.com/videojs/v10/commit/694afb7de992edbd667bc3d895df8bf198ccabb3))
* **time-display:** clean up time utilities and simplify components ([597e79d](https://github.com/videojs/v10/commit/597e79d7fc12737353c8c9eb3f6e77ef0a04e9ed))
* tooltip and popover portal ([49d0b03](https://github.com/videojs/v10/commit/49d0b03d899c61b6c980a198ed531baeafe4dde7))
* tooltip syntax error & remove restMs ([fee1670](https://github.com/videojs/v10/commit/fee16708cb13670e30c8628425d621e2cfe0c7c6))
* **typescript:** resolve declaration file generation for rollup packages ([#1](https://github.com/videojs/v10/issues/1)) ([69670e8](https://github.com/videojs/v10/commit/69670e8d7134db34aee665d8871cd17901625915))
* **ui:** revert style testing change ([1ef66c9](https://github.com/videojs/v10/commit/1ef66c94611ad46f0f0b2f2fea0e0f0aa3e268f0))
* **ui:** tone down text shadow on toasted skin ([#54](https://github.com/videojs/v10/issues/54)) ([924b257](https://github.com/videojs/v10/commit/924b2578a41ad90df2c674e48016ff0aaa58287e))
* use popover core in react popover ([#208](https://github.com/videojs/v10/issues/208)) ([99fef78](https://github.com/videojs/v10/commit/99fef78f63e8dd121513b9cd20696a7d35603837))
* **workspace:** convert pnpm workspace protocol to npm workspace syntax ([fc5a0e4](https://github.com/videojs/v10/commit/fc5a0e46fd15f30245cb743a8006fc097c5b890e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/core bumped to 10.0.0-alpha.1
    * @videojs/icons bumped to 10.0.0-alpha.1
    * @videojs/utils bumped to 10.0.0-alpha.1
