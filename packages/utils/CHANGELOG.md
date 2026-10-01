# Changelog

## [10.0.0-rc.5](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-rc.4...@videojs/utils@10.0.0-rc.5) (2026-10-01)


### ⚠ BREAKING CHANGES

* **media:** tidy text track state ([#3057](https://github.com/videojs/v10/issues/3057))

### Code Refactoring

* **media:** tidy text track state ([#3057](https://github.com/videojs/v10/issues/3057)) ([614b77d](https://github.com/videojs/v10/commit/614b77dce7d9a3ed60baa1b0e2af854c8c8d865b))

## [10.0.0-rc.4](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-rc.3...@videojs/utils@10.0.0-rc.4) (2026-09-26)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-rc.3](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-rc.2...@videojs/utils@10.0.0-rc.3) (2026-09-25)


### Features

* **spf:** add EME-based DRM support to the HLS engine ([#2291](https://github.com/videojs/v10/issues/2291)) ([fd6785e](https://github.com/videojs/v10/commit/fd6785e00df4ed705ed4c9479fcfdfbaf221f7e1))


### Bug Fixes

* **core:** keep controls visible when seeking in Safari 16 ([#2962](https://github.com/videojs/v10/issues/2962)) ([2f5cf27](https://github.com/videojs/v10/commit/2f5cf2765315199e45623f5760b20d9a52acf4db))
* **core:** position and hide popups without the Popover API ([#2963](https://github.com/videojs/v10/issues/2963)) ([b0e24df](https://github.com/videojs/v10/commit/b0e24dfcbb2738dfdf0b6250880b42e5f9dd0aeb))
* **packages:** guard Intl.ListFormat and AbortSignal.any ([#2964](https://github.com/videojs/v10/issues/2964)) ([14aceee](https://github.com/videojs/v10/commit/14aceee2c813b65076bcbcf9613467ae3a8fe5de))
* **utils:** detect constructable stylesheets before creating one ([#2967](https://github.com/videojs/v10/issues/2967)) ([4c4c5d4](https://github.com/videojs/v10/commit/4c4c5d49a966f940a05c6b4653c5ab2c2f490860))


### Performance Improvements

* **site:** faster docs dev server start ([#2698](https://github.com/videojs/v10/issues/2698)) ([33d3887](https://github.com/videojs/v10/commit/33d38873ed5337a5695eaa426a5ebfbea61356d2))

## [10.0.0-rc.2](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-rc.1...@videojs/utils@10.0.0-rc.2) (2026-09-09)


### ⚠ BREAKING CHANGES

* **html:** make thumbnail images composable ([#2572](https://github.com/videojs/v10/issues/2572))

### Features

* **html:** make thumbnail images composable ([#2572](https://github.com/videojs/v10/issues/2572)) ([6dfdce5](https://github.com/videojs/v10/commit/6dfdce50a8717573268841dbc6ed8c2b02b9108d))


### Bug Fixes

* **skin:** misc styles fixes ([#2558](https://github.com/videojs/v10/issues/2558)) ([cd963b7](https://github.com/videojs/v10/commit/cd963b7f2cc7f4dddf225aa08afa04908ec353e7))

## [10.0.0-rc.1](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.32...@videojs/utils@10.0.0-rc.1) (2026-09-08)


### Features

* **skin:** generate framework skins from registry ([#2545](https://github.com/videojs/v10/issues/2545)) ([60c7b0b](https://github.com/videojs/v10/commit/60c7b0ba5441b4463e4d04f6a71660ae24eeb345))

## [10.0.0-beta.32](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.31...@videojs/utils@10.0.0-beta.32) (2026-08-26)


### Features

* **packages:** add dialog component ([#2379](https://github.com/videojs/v10/issues/2379)) ([108b8fd](https://github.com/videojs/v10/commit/108b8fda826a870bf29453289a0081ebd7df890c))

## [10.0.0-beta.31](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.30...@videojs/utils@10.0.0-beta.31) (2026-08-21)


### Features

* **packages:** add right-to-left player support ([#2281](https://github.com/videojs/v10/issues/2281)) ([caf179b](https://github.com/videojs/v10/commit/caf179b83260a242a7ff284d1d474f97a91988a9))

## [10.0.0-beta.30](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.29...@videojs/utils@10.0.0-beta.30) (2026-08-20)


### Features

* **spf:** Cap Rendition to Player Size ([#2242](https://github.com/videojs/v10/issues/2242)) ([357c3a4](https://github.com/videojs/v10/commit/357c3a4ba71155809e34db9f2d78694712283fe5))


### Bug Fixes

* **skin:** stabilize menu sizing and motion ([#2283](https://github.com/videojs/v10/issues/2283)) ([191538e](https://github.com/videojs/v10/commit/191538e99935ffdced88e77fef55405410558562))

## [10.0.0-beta.29](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.28...@videojs/utils@10.0.0-beta.29) (2026-08-19)


### ⚠ BREAKING CHANGES

* **packages:** name the resolved title `title`, and take it from config only ([#2176](https://github.com/videojs/v10/issues/2176))

### Features

* **packages:** name the resolved title `title`, and take it from config only ([#2176](https://github.com/videojs/v10/issues/2176)) ([969cf56](https://github.com/videojs/v10/commit/969cf567b3125e437d8f68982f655ee4255409ae))

## [10.0.0-beta.28](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.27...@videojs/utils@10.0.0-beta.28) (2026-08-19)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.27](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.26...@videojs/utils@10.0.0-beta.27) (2026-08-17)


### Features

* **packages:** add chaptered time sliders ([#2043](https://github.com/videojs/v10/issues/2043)) ([6490051](https://github.com/videojs/v10/commit/6490051ac8b991f8c9c47e2cb424b9ffb676230c))
* **packages:** add youtube media with html and react components ([#1853](https://github.com/videojs/v10/issues/1853)) ([f7571e3](https://github.com/videojs/v10/commit/f7571e3d1fbfbcabf8cba319fb498bb052afb376))
* **spf:** live hls playback on the presentation-timeline model ([#1884](https://github.com/videojs/v10/issues/1884)) ([0ebb073](https://github.com/videojs/v10/commit/0ebb073b87cbceb5459b7a32dc09ed5026647d37))
* **utils:** extract getAnchorNames and addAnchorName ([#1935](https://github.com/videojs/v10/issues/1935)) ([d5f0cb6](https://github.com/videojs/v10/commit/d5f0cb6b92bfeeec828095a7d970e0b9610eb29d))


### Bug Fixes

* **i18n:** improve locale translations ([#1914](https://github.com/videojs/v10/issues/1914)) ([12cc939](https://github.com/videojs/v10/commit/12cc939f58f4ad2db7218374d96c5aa690ca49e5))
* **i18n:** improve time inversion labels ([#2028](https://github.com/videojs/v10/issues/2028)) ([eeb216a](https://github.com/videojs/v10/commit/eeb216ad2f7dbfe83ec214cb49fc7fb990ff1a7f))
* **media:** announce a cleared source on every embed host ([#2217](https://github.com/videojs/v10/issues/2217)) ([c3cbc13](https://github.com/videojs/v10/commit/c3cbc132257c2344aee032eec72970d1f8bd770f))
* **media:** hook the media's actual playback engine in mux data ([#2040](https://github.com/videojs/v10/issues/2040)) ([501af91](https://github.com/videojs/v10/commit/501af9168c92a3ef757ff6de010c86a495df11f4))
* **utils:** stop enumerating input objects in defaults ([#2140](https://github.com/videojs/v10/issues/2140)) ([edc1dee](https://github.com/videojs/v10/commit/edc1dee347943e72c7222c8ffd43f8b75d169246))

## [10.0.0-beta.26](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.25...@videojs/utils@10.0.0-beta.26) (2026-08-02)


### Features

* **core:** add status announcer state updates ([#1659](https://github.com/videojs/v10/issues/1659)) ([a5e7339](https://github.com/videojs/v10/commit/a5e73393fef381af7e148178822d5c3d94739834))
* **i18n:** convert to opaque keys ([#1848](https://github.com/videojs/v10/issues/1848)) ([a3e673b](https://github.com/videojs/v10/commit/a3e673bd6854e006f4ae36e3ebfbfd6c6120e197))
* **packages:** add flip functionality to popovers/tooltips/menus ([#1857](https://github.com/videojs/v10/issues/1857)) ([be89470](https://github.com/videojs/v10/commit/be89470447e84bb654cd17be7f4d4f6cec767e4f))
* **packages:** add mux media with src parsing, structured source, and storyboards ([#1850](https://github.com/videojs/v10/issues/1850)) ([409e7ef](https://github.com/videojs/v10/commit/409e7ef225c7abb79a49c8b1adcc8c6ed0242cf6))
* **packages:** i18n ([#1708](https://github.com/videojs/v10/issues/1708)) ([028dadb](https://github.com/videojs/v10/commit/028dadb385eb4f879f80932a4002676dc11d5300))
* **skin:** improved responsive design ([#1832](https://github.com/videojs/v10/issues/1832)) ([c8a9eec](https://github.com/videojs/v10/commit/c8a9eecaf89139bd80965f39052c1483b910d6bc))


### Bug Fixes

* **sandbox:** Fix broken scripts on sandbox build ([#1824](https://github.com/videojs/v10/issues/1824)) ([20f118e](https://github.com/videojs/v10/commit/20f118e95c6b2ce434ad6f03135442b2e3239e6a))

## [10.0.0-beta.25](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.24...@videojs/utils@10.0.0-beta.25) (2026-07-07)


### ⚠ BREAKING CHANGES

* **media:** add Google Cast by default to HLS, DASH media ([#1661](https://github.com/videojs/v10/issues/1661))

### Features

* **core:** add i18n foundation with English locale and UI wiring ([#1589](https://github.com/videojs/v10/issues/1589)) ([768bf09](https://github.com/videojs/v10/commit/768bf09da07a728874da232c7cdefb653534e078))
* **core:** add vimeo media host and html/react components ([#1667](https://github.com/videojs/v10/issues/1667)) ([1b31f3e](https://github.com/videojs/v10/commit/1b31f3e8d7ecef111b84dbd3f9053efc626f256d))
* **core:** Support AirPlay on MSE ([#1692](https://github.com/videojs/v10/issues/1692)) ([3f2f4a4](https://github.com/videojs/v10/commit/3f2f4a4a5a8c41a22fa0dbefd46ed4e725dfa109))
* **media:** add Google Cast by default to HLS, DASH media ([#1661](https://github.com/videojs/v10/issues/1661)) ([0ffe1a9](https://github.com/videojs/v10/commit/0ffe1a91979ddd53b8f5339765b8c086da7bcc1e))


### Bug Fixes

* **core:** disable toggle captions when there are no captions ([#1598](https://github.com/videojs/v10/issues/1598)) ([760870f](https://github.com/videojs/v10/commit/760870fdf28394021166df7f4ad575730dc65dbd))
* **packages:** escape HTML special chars in serializeAttributes to prevent XSS ([#1670](https://github.com/videojs/v10/issues/1670)) ([accf4bf](https://github.com/videojs/v10/commit/accf4bfa34f89a8ed90bd005a414507ad1491f43))


### Reverts

* **core:** unmerge i18n stack base ([#1707](https://github.com/videojs/v10/issues/1707)) ([edfec1c](https://github.com/videojs/v10/commit/edfec1c93ef656c9b2ac105c9b1e1042d17cf956))

## [10.0.0-beta.24](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.23...@videojs/utils@10.0.0-beta.24) (2026-05-19)


### Features

* **packages:** add playback rate menu ([#1527](https://github.com/videojs/v10/issues/1527)) ([ad831d2](https://github.com/videojs/v10/commit/ad831d25f00187929e6eed93770422fa7003071c))
* **spf:** HLS engine composition walkthrough + doc-driven cleanups ([#1512](https://github.com/videojs/v10/issues/1512)) ([0cfd3bb](https://github.com/videojs/v10/commit/0cfd3bb395332b19cf85e9dc7eb08f656bec3e2b))

## [10.0.0-beta.23](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.22...@videojs/utils@10.0.0-beta.23) (2026-04-27)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.22](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.21...@videojs/utils@10.0.0-beta.22) (2026-04-18)


### Bug Fixes

* **packages:** add server-only bundles  ([#1349](https://github.com/videojs/v10/issues/1349)) ([3331fda](https://github.com/videojs/v10/commit/3331fdaf25c8a89ea6d36c2972631df589fc0ad3))
* **react:** prevent gesture tap from firing on slider interactions ([#1361](https://github.com/videojs/v10/issues/1361)) ([769d436](https://github.com/videojs/v10/commit/769d436f4ec78b71d18e0028a606114af48b7afb))


### Reverts

* **packages:** add server-only bundles ([#1349](https://github.com/videojs/v10/issues/1349)) ([#1354](https://github.com/videojs/v10/issues/1354)) ([8530316](https://github.com/videojs/v10/commit/8530316987b5122a2e455b0db3bad6fd3ffa8186))

## [10.0.0-beta.21](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.20...@videojs/utils@10.0.0-beta.21) (2026-04-14)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.20](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.19...@videojs/utils@10.0.0-beta.20) (2026-04-14)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.19](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.18...@videojs/utils@10.0.0-beta.19) (2026-04-14)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.18](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.17...@videojs/utils@10.0.0-beta.18) (2026-04-14)


### ⚠ BREAKING CHANGES

* **packages:** replace DelegateMixin & ProxyMixin with MediaHost base classes ([#1292](https://github.com/videojs/v10/issues/1292))

### Bug Fixes

* **packages:** ignore gestures on interactive child elements ([#1327](https://github.com/videojs/v10/issues/1327)) ([b768c29](https://github.com/videojs/v10/commit/b768c29f98043a41c6272683e240bf1948238042))


### Code Refactoring

* **packages:** replace DelegateMixin & ProxyMixin with MediaHost base classes ([#1292](https://github.com/videojs/v10/issues/1292)) ([8f1653e](https://github.com/videojs/v10/commit/8f1653efcd0a3a8cc75881bc6b4c0b87599a3b8d))

## [10.0.0-beta.17](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.16...@videojs/utils@10.0.0-beta.17) (2026-04-11)


### Features

* **packages:** add gesture bindings to default skins and presets ([#1310](https://github.com/videojs/v10/issues/1310)) ([1509a66](https://github.com/videojs/v10/commit/1509a66f60fc0598452f21af396c4b6f3569be5b))

## [10.0.0-beta.16](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.15...@videojs/utils@10.0.0-beta.16) (2026-04-10)


### Features

* **packages:** add hotkey system with coordinator, actions, and ARIA support ([#1238](https://github.com/videojs/v10/issues/1238)) ([627ea20](https://github.com/videojs/v10/commit/627ea204fcadb50d8cd0878ae816fabdaee470d0))


### Bug Fixes

* **utils:** stable sort comparator and orphaned JSDoc ([#1286](https://github.com/videojs/v10/issues/1286)) ([071325d](https://github.com/videojs/v10/commit/071325de4dee666a09e305399ea95e163c5d8de4))

## [10.0.0-beta.15](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.14...@videojs/utils@10.0.0-beta.15) (2026-04-03)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.14](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.13...@videojs/utils@10.0.0-beta.14) (2026-04-03)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.13](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.12...@videojs/utils@10.0.0-beta.13) (2026-04-01)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.12](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.11...@videojs/utils@10.0.0-beta.12) (2026-04-01)


### Features

* add Mux video component ([#1036](https://github.com/videojs/v10/issues/1036)) ([271a8c8](https://github.com/videojs/v10/commit/271a8c850216bd1654baaa26f8bb2f5eda56be37))
* add native hls media + refactor ([#1154](https://github.com/videojs/v10/issues/1154)) ([1b2afc6](https://github.com/videojs/v10/commit/1b2afc6e41a4a8bb4f3ea42b5c04c6232813727e))


### Bug Fixes

* **utils:** polyfill AbortSignal.any for Chromium ≤115 ([#1142](https://github.com/videojs/v10/issues/1142)) ([c3641c8](https://github.com/videojs/v10/commit/c3641c888c9630b2780cdda556431512d9ca5b81))

## [10.0.0-beta.11](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.10...@videojs/utils@10.0.0-beta.11) (2026-03-24)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.10](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.9...@videojs/utils@10.0.0-beta.10) (2026-03-23)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.9](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.8...@videojs/utils@10.0.0-beta.9) (2026-03-23)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.8](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.7...@videojs/utils@10.0.0-beta.8) (2026-03-20)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.7](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.6...@videojs/utils@10.0.0-beta.7) (2026-03-19)


### Bug Fixes

* correct popup fallback positioning offsets ([#981](https://github.com/videojs/v10/issues/981)) ([82ede77](https://github.com/videojs/v10/commit/82ede77322204500d7ca0adc5cb24d4f068af462))
* **utils:** handle missing media.querySelectorAll for HLS ([#986](https://github.com/videojs/v10/issues/986)) ([7bacb1b](https://github.com/videojs/v10/commit/7bacb1b2ae3151fc58ca5526a1f9713c188df2cf))

## [10.0.0-beta.6](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.5...@videojs/utils@10.0.0-beta.6) (2026-03-15)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.5](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.4...@videojs/utils@10.0.0-beta.5) (2026-03-12)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.4](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.3...@videojs/utils@10.0.0-beta.4) (2026-03-12)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.3](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.2...@videojs/utils@10.0.0-beta.3) (2026-03-11)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.2](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.1...@videojs/utils@10.0.0-beta.2) (2026-03-10)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-beta.1](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-beta.0...@videojs/utils@10.0.0-beta.1) (2026-03-10)


### Features

* add background video preset ([#607](https://github.com/videojs/v10/issues/607)) ([c2bc488](https://github.com/videojs/v10/commit/c2bc488366fd28f9a6d00dd28a4f790b5e1400ed))
* add console banner ([#186](https://github.com/videojs/v10/issues/186)) ([072b0de](https://github.com/videojs/v10/commit/072b0dece76289d7d4215907ce70b36debbb78bc))
* add subtitles handling + captions core ([#692](https://github.com/videojs/v10/issues/692)) ([5c11606](https://github.com/videojs/v10/commit/5c116065a91ed04753bb2cb83e72dd6471f75ced))
* add tooltip core ([#212](https://github.com/videojs/v10/issues/212)) ([cbf41ce](https://github.com/videojs/v10/commit/cbf41ce4c750cd5c3bb6cbf247bad91ccd578cd0))
* **core:** add play button component ([#383](https://github.com/videojs/v10/issues/383)) ([9cfab26](https://github.com/videojs/v10/commit/9cfab264d85ea5b8e20fc2d020171ba5ef53b0f4))
* **core:** add popover component ([#615](https://github.com/videojs/v10/issues/615)) ([44188d4](https://github.com/videojs/v10/commit/44188d4823d687bae2806f38e199e9719ff05083))
* **core:** add thumbnail component and text track store feature ([#643](https://github.com/videojs/v10/issues/643)) ([7bae887](https://github.com/videojs/v10/commit/7bae887920a71665fdd24a2f0aca0718de062084))
* **core:** add time display component ([#460](https://github.com/videojs/v10/issues/460)) ([7b8bc11](https://github.com/videojs/v10/commit/7b8bc11f9f90684269b6acebeb79677063112e1f))
* **core:** dom media slices ([#292](https://github.com/videojs/v10/issues/292)) ([47659f5](https://github.com/videojs/v10/commit/47659f5352634ef094b9ab83476a59ac1f244115))
* **example/react:** improvements to react examples ([#210](https://github.com/videojs/v10/issues/210)) ([c35b012](https://github.com/videojs/v10/commit/c35b0122509ce3230dcfce4a0acf0d315ba5f0ee))
* **icons:** setup icons package ([#536](https://github.com/videojs/v10/issues/536)) ([78de97e](https://github.com/videojs/v10/commit/78de97ec23c474b70edda0a594e277f7eaf1b86c))
* idiomatic html markup, use popover API, add safe polygon utility ([#143](https://github.com/videojs/v10/issues/143)) ([419911f](https://github.com/videojs/v10/commit/419911f2f2b9f505700f5becb623bfe12e3878aa))
* **packages:** add slider core layer ([#529](https://github.com/videojs/v10/issues/529)) ([7efee3d](https://github.com/videojs/v10/commit/7efee3d03361f195706257b4950708cbe5356cf5))
* **react:** add slider component ([#644](https://github.com/videojs/v10/issues/644)) ([2f8ca09](https://github.com/videojs/v10/commit/2f8ca094ad5bc5bafc5435c2e97bca58c6d29b5d))
* **react:** implement default and minimal video skins ([#550](https://github.com/videojs/v10/issues/550)) ([7d3be36](https://github.com/videojs/v10/commit/7d3be367f5b31b8a6d5b9a9e3c87245f95b8e22a))
* **skin:** add audio skins for HTML and React presets ([#772](https://github.com/videojs/v10/issues/772)) ([d751fda](https://github.com/videojs/v10/commit/d751fdabea9782b9f6c73aaebfb93ed393e488f7))
* **store:** add reactive state primitives ([#311](https://github.com/videojs/v10/issues/311)) ([beb8615](https://github.com/videojs/v10/commit/beb8615c1c75a996d1e4ea2db804c49acdc10ef0))
* **store:** initial release ([#279](https://github.com/videojs/v10/issues/279)) ([d74e4e6](https://github.com/videojs/v10/commit/d74e4e6701e5de2a03cf76e4ceff96d230790e3f))
* **store:** lit bindings ([#289](https://github.com/videojs/v10/issues/289)) ([648aae7](https://github.com/videojs/v10/commit/648aae7e31db02f6d69dba138b98e7cbfd398902))
* **store:** queue task refactor ([#287](https://github.com/videojs/v10/issues/287)) ([6a7acda](https://github.com/videojs/v10/commit/6a7acdabfe3a5dd806af64423a9f2eb0769a4496))
* **store:** state subscription primitives ([#528](https://github.com/videojs/v10/issues/528)) ([839a7e4](https://github.com/videojs/v10/commit/839a7e43bff6b420de3fd53c1b7847aece1f0a1c))
* **store:** store selector api ([#370](https://github.com/videojs/v10/issues/370)) ([ad94af2](https://github.com/videojs/v10/commit/ad94af25b5faaf003ab79482ad40be70309e39a8))
* use anchor API for html elements ([#174](https://github.com/videojs/v10/issues/174)) ([4a2d580](https://github.com/videojs/v10/commit/4a2d580bb3db35d17d89827326617d0bd2c54499))


### Bug Fixes

* add popover core, use in html and improve factory ([#204](https://github.com/videojs/v10/issues/204)) ([f3b1b19](https://github.com/videojs/v10/commit/f3b1b199173f3750bc05ad9063fcccbd4163b12b))
* **cd:** add repository field to all packages for provenance verification ([b723589](https://github.com/videojs/v10/commit/b72358904a78a9403df16d77936d4a1f41a64bfe))
* **html:** apply popover data attributes before showing via popover API ([#763](https://github.com/videojs/v10/issues/763)) ([206bc9b](https://github.com/videojs/v10/commit/206bc9b4ae914176e50c1708c272c75d90a12286))
* **packages:** enable unbundle mode to avoid mangled exports ([00fdf96](https://github.com/videojs/v10/commit/00fdf966ca5148bcca303058dd798b1b880896e0))
* **packages:** set release-please manifest and package versions to beta.0 ([#850](https://github.com/videojs/v10/issues/850)) ([e085a0d](https://github.com/videojs/v10/commit/e085a0d73af0c142e0c0a371337daae98fdbaac9))
* **packages:** update package READMEs for beta ([#848](https://github.com/videojs/v10/issues/848)) ([9562a0e](https://github.com/videojs/v10/commit/9562a0ecca212034759d7cc948d4b3f0bc7a19c3))
* **packages:** update version badges ([#138](https://github.com/videojs/v10/issues/138)) ([22d9cb6](https://github.com/videojs/v10/commit/22d9cb64f2e5b9601a2039bb166dbe3fee6a1b3e))
* **root:** add videojs keyword to package.json ([4a9f8b2](https://github.com/videojs/v10/commit/4a9f8b2ad6fb27b463dcfe8d1a5fd883c9fa21d1))
* **site:** update discord link ([#170](https://github.com/videojs/v10/issues/170)) ([bb10294](https://github.com/videojs/v10/commit/bb10294419439fb02df650f3e7f7c5496ecc3a73))
* **store:** guard abort on request supersession ([#313](https://github.com/videojs/v10/issues/313)) ([e643ee1](https://github.com/videojs/v10/commit/e643ee1f08ba41732acce27021da9bdc76032890))
* textTrackList and optimize ([#760](https://github.com/videojs/v10/issues/760)) ([04e98f4](https://github.com/videojs/v10/commit/04e98f4007dcc5957ff4b646482036da49e1efd4))
* toKebabCase import issue ([c4f1012](https://github.com/videojs/v10/commit/c4f1012f4619bf41cc4e4deae08f882da1b56fc3))
* **utils:** remove unnecessary keyboard utils ([#146](https://github.com/videojs/v10/issues/146)) ([b737758](https://github.com/videojs/v10/commit/b737758453c7a932c646137d92bb5303e251ca4b))

## [10.0.0-alpha.11](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-alpha.10...@videojs/utils@10.0.0-alpha.11) (2026-03-10)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-alpha.10](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-alpha.9...@videojs/utils@10.0.0-alpha.10) (2026-03-10)


### Features

* **skin:** add audio skins for HTML and React presets ([#772](https://github.com/videojs/v10/issues/772)) ([d751fda](https://github.com/videojs/v10/commit/d751fdabea9782b9f6c73aaebfb93ed393e488f7))


### Bug Fixes

* **html:** apply popover data attributes before showing via popover API ([#763](https://github.com/videojs/v10/issues/763)) ([206bc9b](https://github.com/videojs/v10/commit/206bc9b4ae914176e50c1708c272c75d90a12286))

## [10.0.0-alpha.9](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-alpha.8...@videojs/utils@10.0.0-alpha.9) (2026-03-06)


### Features

* add subtitles handling + captions core ([#692](https://github.com/videojs/v10/issues/692)) ([5c11606](https://github.com/videojs/v10/commit/5c116065a91ed04753bb2cb83e72dd6471f75ced))


### Bug Fixes

* textTrackList and optimize ([#760](https://github.com/videojs/v10/issues/760)) ([04e98f4](https://github.com/videojs/v10/commit/04e98f4007dcc5957ff4b646482036da49e1efd4))

## [10.0.0-alpha.8](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-alpha.7...@videojs/utils@10.0.0-alpha.8) (2026-03-05)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-alpha.7](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-alpha.6...@videojs/utils@10.0.0-alpha.7) (2026-03-04)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-alpha.6](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-alpha.5...@videojs/utils@10.0.0-alpha.6) (2026-03-04)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-alpha.5](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-alpha.4...@videojs/utils@10.0.0-alpha.5) (2026-03-04)


### Features

* **core:** add popover component ([#615](https://github.com/videojs/v10/issues/615)) ([44188d4](https://github.com/videojs/v10/commit/44188d4823d687bae2806f38e199e9719ff05083))
* **core:** add thumbnail component and text track store feature ([#643](https://github.com/videojs/v10/issues/643)) ([7bae887](https://github.com/videojs/v10/commit/7bae887920a71665fdd24a2f0aca0718de062084))
* **react:** add slider component ([#644](https://github.com/videojs/v10/issues/644)) ([2f8ca09](https://github.com/videojs/v10/commit/2f8ca094ad5bc5bafc5435c2e97bca58c6d29b5d))

## [10.0.0-alpha.4](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-alpha.3...@videojs/utils@10.0.0-alpha.4) (2026-02-26)


### Features

* add background video preset ([#607](https://github.com/videojs/v10/issues/607)) ([c2bc488](https://github.com/videojs/v10/commit/c2bc488366fd28f9a6d00dd28a4f790b5e1400ed))

## [10.0.0-alpha.3](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-alpha.2...@videojs/utils@10.0.0-alpha.3) (2026-02-26)


### Bug Fixes

* **cd:** add repository field to all packages for provenance verification ([b723589](https://github.com/videojs/v10/commit/b72358904a78a9403df16d77936d4a1f41a64bfe))

## [10.0.0-alpha.2](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-alpha.1...@videojs/utils@10.0.0-alpha.2) (2026-02-26)


### Miscellaneous Chores

* **@videojs/utils:** Synchronize videojs versions

## [10.0.0-alpha.1](https://github.com/videojs/v10/compare/@videojs/utils@10.0.0-alpha.0...@videojs/utils@10.0.0-alpha.1) (2026-02-26)


### Features

* add console banner ([#186](https://github.com/videojs/v10/issues/186)) ([072b0de](https://github.com/videojs/v10/commit/072b0dece76289d7d4215907ce70b36debbb78bc))
* add tooltip core ([#212](https://github.com/videojs/v10/issues/212)) ([cbf41ce](https://github.com/videojs/v10/commit/cbf41ce4c750cd5c3bb6cbf247bad91ccd578cd0))
* **core:** add play button component ([#383](https://github.com/videojs/v10/issues/383)) ([9cfab26](https://github.com/videojs/v10/commit/9cfab264d85ea5b8e20fc2d020171ba5ef53b0f4))
* **core:** add time display component ([#460](https://github.com/videojs/v10/issues/460)) ([7b8bc11](https://github.com/videojs/v10/commit/7b8bc11f9f90684269b6acebeb79677063112e1f))
* **core:** dom media slices ([#292](https://github.com/videojs/v10/issues/292)) ([47659f5](https://github.com/videojs/v10/commit/47659f5352634ef094b9ab83476a59ac1f244115))
* **example/react:** improvements to react examples ([#210](https://github.com/videojs/v10/issues/210)) ([c35b012](https://github.com/videojs/v10/commit/c35b0122509ce3230dcfce4a0acf0d315ba5f0ee))
* **icons:** setup icons package ([#536](https://github.com/videojs/v10/issues/536)) ([78de97e](https://github.com/videojs/v10/commit/78de97ec23c474b70edda0a594e277f7eaf1b86c))
* idiomatic html markup, use popover API, add safe polygon utility ([#143](https://github.com/videojs/v10/issues/143)) ([419911f](https://github.com/videojs/v10/commit/419911f2f2b9f505700f5becb623bfe12e3878aa))
* **packages:** add slider core layer ([#529](https://github.com/videojs/v10/issues/529)) ([7efee3d](https://github.com/videojs/v10/commit/7efee3d03361f195706257b4950708cbe5356cf5))
* **react:** implement default and minimal video skins ([#550](https://github.com/videojs/v10/issues/550)) ([7d3be36](https://github.com/videojs/v10/commit/7d3be367f5b31b8a6d5b9a9e3c87245f95b8e22a))
* **store:** add reactive state primitives ([#311](https://github.com/videojs/v10/issues/311)) ([beb8615](https://github.com/videojs/v10/commit/beb8615c1c75a996d1e4ea2db804c49acdc10ef0))
* **store:** initial release ([#279](https://github.com/videojs/v10/issues/279)) ([d74e4e6](https://github.com/videojs/v10/commit/d74e4e6701e5de2a03cf76e4ceff96d230790e3f))
* **store:** lit bindings ([#289](https://github.com/videojs/v10/issues/289)) ([648aae7](https://github.com/videojs/v10/commit/648aae7e31db02f6d69dba138b98e7cbfd398902))
* **store:** queue task refactor ([#287](https://github.com/videojs/v10/issues/287)) ([6a7acda](https://github.com/videojs/v10/commit/6a7acdabfe3a5dd806af64423a9f2eb0769a4496))
* **store:** state subscription primitives ([#528](https://github.com/videojs/v10/issues/528)) ([839a7e4](https://github.com/videojs/v10/commit/839a7e43bff6b420de3fd53c1b7847aece1f0a1c))
* **store:** store selector api ([#370](https://github.com/videojs/v10/issues/370)) ([ad94af2](https://github.com/videojs/v10/commit/ad94af25b5faaf003ab79482ad40be70309e39a8))
* use anchor API for html elements ([#174](https://github.com/videojs/v10/issues/174)) ([4a2d580](https://github.com/videojs/v10/commit/4a2d580bb3db35d17d89827326617d0bd2c54499))


### Bug Fixes

* add popover core, use in html and improve factory ([#204](https://github.com/videojs/v10/issues/204)) ([f3b1b19](https://github.com/videojs/v10/commit/f3b1b199173f3750bc05ad9063fcccbd4163b12b))
* **packages:** enable unbundle mode to avoid mangled exports ([00fdf96](https://github.com/videojs/v10/commit/00fdf966ca5148bcca303058dd798b1b880896e0))
* **packages:** update version badges ([#138](https://github.com/videojs/v10/issues/138)) ([22d9cb6](https://github.com/videojs/v10/commit/22d9cb64f2e5b9601a2039bb166dbe3fee6a1b3e))
* **root:** add videojs keyword to package.json ([4a9f8b2](https://github.com/videojs/v10/commit/4a9f8b2ad6fb27b463dcfe8d1a5fd883c9fa21d1))
* **site:** update discord link ([#170](https://github.com/videojs/v10/issues/170)) ([bb10294](https://github.com/videojs/v10/commit/bb10294419439fb02df650f3e7f7c5496ecc3a73))
* **store:** guard abort on request supersession ([#313](https://github.com/videojs/v10/issues/313)) ([e643ee1](https://github.com/videojs/v10/commit/e643ee1f08ba41732acce27021da9bdc76032890))
* toKebabCase import issue ([c4f1012](https://github.com/videojs/v10/commit/c4f1012f4619bf41cc4e4deae08f882da1b56fc3))
* **utils:** remove unnecessary keyboard utils ([#146](https://github.com/videojs/v10/issues/146)) ([b737758](https://github.com/videojs/v10/commit/b737758453c7a932c646137d92bb5303e251ca4b))
