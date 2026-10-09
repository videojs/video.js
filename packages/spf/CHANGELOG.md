# Changelog

## [10.1.0](https://github.com/videojs/video.js/compare/@videojs/spf@10.0.1...@videojs/spf@10.1.0) (2026-10-09)


### Features

* **packages:** support hls json chapters in hls.js and native hls ([#2993](https://github.com/videojs/video.js/issues/2993)) ([511e8a6](https://github.com/videojs/video.js/commit/511e8a69db8fb111d2d41f9e55910a243b5ef6ed))
* **spf:** send credentials with hls requests for crossorigin="use-credentials" ([#2870](https://github.com/videojs/video.js/issues/2870)) ([897901b](https://github.com/videojs/video.js/commit/897901b88359dca0dc3e59fcecd766cb59f8fe24))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.1.0
    * @videojs/utils bumped to 10.1.0

## [10.0.1](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0...@videojs/spf@10.0.1) (2026-10-02)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.1
    * @videojs/utils bumped to 10.0.1

## [10.0.0](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-rc.5...@videojs/spf@10.0.0) (2026-10-01)


### Features

* **packages:** release Video.js 10.0.0 as stable ([#3058](https://github.com/videojs/v10/issues/3058)) ([37477fc](https://github.com/videojs/v10/commit/37477fc187f36fc2ab3cbc0db7c1b2d3fc6bcca9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0
    * @videojs/utils bumped to 10.0.0

## [10.0.0-rc.5](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-rc.4...@videojs/spf@10.0.0-rc.5) (2026-10-01)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-rc.5
    * @videojs/utils bumped to 10.0.0-rc.5

## [10.0.0-rc.4](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-rc.3...@videojs/spf@10.0.0-rc.4) (2026-09-26)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-rc.4
    * @videojs/utils bumped to 10.0.0-rc.4

## [10.0.0-rc.3](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-rc.2...@videojs/spf@10.0.0-rc.3) (2026-09-25)


### Features

* **spf:** add EME-based DRM support to the HLS engine ([#2291](https://github.com/videojs/v10/issues/2291)) ([fd6785e](https://github.com/videojs/v10/commit/fd6785e00df4ed705ed4c9479fcfdfbaf221f7e1))
* **spf:** support apple json chapters from ext-x-session-data ([#2737](https://github.com/videojs/v10/issues/2737)) ([f3c2caf](https://github.com/videojs/v10/commit/f3c2caf5abcbe78e7f2d93f6a2603ef4f20741ab))


### Bug Fixes

* **packages:** guard Intl.ListFormat and AbortSignal.any ([#2964](https://github.com/videojs/v10/issues/2964)) ([14aceee](https://github.com/videojs/v10/commit/14aceee2c813b65076bcbcf9613467ae3a8fe5de))
* **site:** improve markdown for agents ([#2883](https://github.com/videojs/v10/issues/2883)) ([d5c8e3c](https://github.com/videojs/v10/commit/d5c8e3cde77cbbe74ecc6878dbd7862db8628bfa))


### Performance Improvements

* **site:** faster docs dev server start ([#2698](https://github.com/videojs/v10/issues/2698)) ([33d3887](https://github.com/videojs/v10/commit/33d38873ed5337a5695eaa426a5ebfbea61356d2))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-rc.3
    * @videojs/utils bumped to 10.0.0-rc.3

## [10.0.0-rc.2](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-rc.1...@videojs/spf@10.0.0-rc.2) (2026-09-09)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-rc.2
    * @videojs/utils bumped to 10.0.0-rc.2

## [10.0.0-rc.1](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.32...@videojs/spf@10.0.0-rc.1) (2026-09-08)


### ⚠ BREAKING CHANGES

* **packages:** adapter renaming ([#2602](https://github.com/videojs/v10/issues/2602))
* **packages:** playback adapters packages ([#2567](https://github.com/videojs/v10/issues/2567))

### Bug Fixes

* **spf:** never adopt the UA-default preload on attach ([#2534](https://github.com/videojs/v10/issues/2534)) ([5ed7e4c](https://github.com/videojs/v10/commit/5ed7e4c29b63432049c4b15d934327793c796057))
* **spf:** probe codec support through ManagedMediaSource where classic MSE is absent ([#2564](https://github.com/videojs/v10/issues/2564)) ([4161db6](https://github.com/videojs/v10/commit/4161db6d0905ce4e8664b8edc841d60ecf10b302))


### Code Refactoring

* **packages:** adapter renaming ([#2602](https://github.com/videojs/v10/issues/2602)) ([b964889](https://github.com/videojs/v10/commit/b964889fdf68a4cdaf4686ef96bb0e8c8f2f4abd))
* **packages:** playback adapters packages ([#2567](https://github.com/videojs/v10/issues/2567)) ([12b08e3](https://github.com/videojs/v10/commit/12b08e3b0c3c07e5948f74a8cf6fce96c8b8eba7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-rc.1
    * @videojs/utils bumped to 10.0.0-rc.1

## [10.0.0-beta.32](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.31...@videojs/spf@10.0.0-beta.32) (2026-08-26)


### Features

* **spf:** keep track selection within the initial codec family ([#2289](https://github.com/videojs/v10/issues/2289)) ([a55c539](https://github.com/videojs/v10/commit/a55c5397e12b77099694b9eef40db3b5290f47f7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-beta.32
    * @videojs/utils bumped to 10.0.0-beta.32

## [10.0.0-beta.31](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.30...@videojs/spf@10.0.0-beta.31) (2026-08-21)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-beta.31
    * @videojs/utils bumped to 10.0.0-beta.31

## [10.0.0-beta.30](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.29...@videojs/spf@10.0.0-beta.30) (2026-08-20)


### Features

* **spf:** Cap Rendition to Player Size ([#2242](https://github.com/videojs/v10/issues/2242)) ([357c3a4](https://github.com/videojs/v10/commit/357c3a4ba71155809e34db9f2d78694712283fe5))


### Bug Fixes

* **spf:** report a verdict when the background ladder is undecodable ([#2286](https://github.com/videojs/v10/issues/2286)) ([57b8148](https://github.com/videojs/v10/commit/57b8148bba30f41ab7f1ec95842f7299351656c3))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-beta.30
    * @videojs/utils bumped to 10.0.0-beta.30

## [10.0.0-beta.29](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.28...@videojs/spf@10.0.0-beta.29) (2026-08-19)


### ⚠ BREAKING CHANGES

* **spf:** cap renditions to the screen and surface unplayable sources ([#2135](https://github.com/videojs/v10/issues/2135))

### Features

* **packages:** make Mux and Vimeo content-data donors ([#1998](https://github.com/videojs/v10/issues/1998)) ([7940b2c](https://github.com/videojs/v10/commit/7940b2c4030d9582551a335eabc59b9a7979c52b))
* **spf:** cap renditions to the screen and surface unplayable sources ([#2135](https://github.com/videojs/v10/issues/2135)) ([20c1464](https://github.com/videojs/v10/commit/20c14648b8342aec91c07e4a743949488ff62939))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-beta.29
    * @videojs/utils bumped to 10.0.0-beta.29

## [10.0.0-beta.28](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.27...@videojs/spf@10.0.0-beta.28) (2026-08-19)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-beta.28
    * @videojs/utils bumped to 10.0.0-beta.28

## [10.0.0-beta.27](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.26...@videojs/spf@10.0.0-beta.27) (2026-08-17)


### ⚠ BREAKING CHANGES

* **packages:** rename the SPF background-video Media to hls-background-video ([#2097](https://github.com/videojs/v10/issues/2097))
* **packages:** rename SimpleHls* to Hls* (video + audio) ([#2096](https://github.com/videojs/v10/issues/2096))
* **packages:** add <mux-background-video> over the SPF background-video engine ([#2062](https://github.com/videojs/v10/issues/2062))
* **spf:** add the SPF-backed Mux Media, elements, and components ([#2045](https://github.com/videojs/v10/issues/2045))
* **packages:** relocate spf media facades ([#2033](https://github.com/videojs/v10/issues/2033))

### Features

* **packages:** add &lt;mux-background-video&gt; over the SPF background-video engine ([#2062](https://github.com/videojs/v10/issues/2062)) ([8dc9562](https://github.com/videojs/v10/commit/8dc9562906e9fb05a56267899a005882d3167d40))
* **spf:** add the SPF-backed Mux Media, elements, and components ([#2045](https://github.com/videojs/v10/issues/2045)) ([d1d1673](https://github.com/videojs/v10/commit/d1d1673ecd17e1ca1492abc5b396296bb8c7b176))
* **spf:** live hls playback on the presentation-timeline model ([#1884](https://github.com/videojs/v10/issues/1884)) ([0ebb073](https://github.com/videojs/v10/commit/0ebb073b87cbceb5459b7a32dc09ed5026647d37))
* **spf:** surface unsupported-source errors ([#1936](https://github.com/videojs/v10/issues/1936)) ([fe47f85](https://github.com/videojs/v10/commit/fe47f85b7bf79a02403206095604683d661db3c1))


### Bug Fixes

* link to CML in SPF ([#1814](https://github.com/videojs/v10/issues/1814)) ([33aeafe](https://github.com/videojs/v10/commit/33aeafe80fba941397f71b49c489b4ecaffe81fa))


### Code Refactoring

* **packages:** relocate spf media facades ([#2033](https://github.com/videojs/v10/issues/2033)) ([7ee7fa5](https://github.com/videojs/v10/commit/7ee7fa549777378c5e30cc6c151ab0d501538b83))
* **packages:** rename SimpleHls* to Hls* (video + audio) ([#2096](https://github.com/videojs/v10/issues/2096)) ([f1c22a5](https://github.com/videojs/v10/commit/f1c22a5bbfd90e3ce219b8ac5de441c8fba60b8d))
* **packages:** rename the SPF background-video Media to hls-background-video ([#2097](https://github.com/videojs/v10/issues/2097)) ([729261a](https://github.com/videojs/v10/commit/729261abbfa1cbc9ac882cd8a2f4456b14e685a3))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-beta.27
    * @videojs/utils bumped to 10.0.0-beta.27

## [10.0.0-beta.26](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.25...@videojs/spf@10.0.0-beta.26) (2026-08-02)


### Features

* **packages:** i18n ([#1708](https://github.com/videojs/v10/issues/1708)) ([028dadb](https://github.com/videojs/v10/commit/028dadb385eb4f879f80932a4002676dc11d5300))
* **spf:** Added autoplay support ([#1880](https://github.com/videojs/v10/issues/1880)) ([b16f28f](https://github.com/videojs/v10/commit/b16f28fb74eee108a1a0eb94e7d83b2f5f11ba5b))
* **spf:** airplay mse recovery ([#1888](https://github.com/videojs/v10/issues/1888)) ([c0a43ac](https://github.com/videojs/v10/commit/c0a43acb0e3af0108de0dc0ca61a23b5069d6812))
* **spf:** expose media tracks on the SPF media adapter ([#1826](https://github.com/videojs/v10/issues/1826)) ([c83b044](https://github.com/videojs/v10/commit/c83b044986bb0a7445a2c54be18ff66cc96e1f66))
* **spf:** relocate non-zero-PTS sources to a 0-based timeline (VOD) ([#1847](https://github.com/videojs/v10/issues/1847)) ([7fdc255](https://github.com/videojs/v10/commit/7fdc2559013527f5c5ace542b33b992c3929fcd8))


### Bug Fixes

* **spf:** load final segment when seeking to exact end ([#1828](https://github.com/videojs/v10/issues/1828)) ([#1852](https://github.com/videojs/v10/issues/1852)) ([12ae97d](https://github.com/videojs/v10/commit/12ae97ddba743fb6a8b4e09108f0928b2611e820))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.26

## [10.0.0-beta.25](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.24...@videojs/spf@10.0.0-beta.25) (2026-07-07)


### Features

* **site:** API reference pages for media elements ([#1342](https://github.com/videojs/v10/issues/1342)) ([d799be1](https://github.com/videojs/v10/commit/d799be1063518b85ad3f030bda07b9132e2db074))
* **spf:** Add maxResolution to SPF Background Video ([#1654](https://github.com/videojs/v10/issues/1654)) ([33873bc](https://github.com/videojs/v10/commit/33873bc4ae9864b43961a2da666f11de4218bde3))
* **spf:** background looping video (phase 1) ([#1602](https://github.com/videojs/v10/issues/1602)) ([3741e8d](https://github.com/videojs/v10/commit/3741e8de12bb214acd2bae8974092e875f17b7bc))
* **spf:** basic audio only use case + use-case-composition doc-type + implementation skills ([#1584](https://github.com/videojs/v10/issues/1584)) ([1a3cb45](https://github.com/videojs/v10/commit/1a3cb45b292aad421fb7429451de59ef41a0a07b))
* **spf:** capability probing ([#1676](https://github.com/videojs/v10/issues/1676)) ([bce79ec](https://github.com/videojs/v10/commit/bce79ec424cf39134284f4d7b142ab2eb9fe8a91))
* **spf:** multi cdn failover ([#1671](https://github.com/videojs/v10/issues/1671)) ([b89f1e9](https://github.com/videojs/v10/commit/b89f1e944cdc8ee63e52095e712ed3e8f0bab236))
* **spf:** multi-cdn support ([#1668](https://github.com/videojs/v10/issues/1668)) ([00aa624](https://github.com/videojs/v10/commit/00aa6247b8be5c539ecf76c636ae89b44a80ea1c))
* **spf:** multi-track audio + skills building features and behaviors ([#1605](https://github.com/videojs/v10/issues/1605)) ([057f325](https://github.com/videojs/v10/commit/057f32573e5a5178e1508dd21fa5f98f05a4eb2a))
* **spf:** text tracks switching ([#1687](https://github.com/videojs/v10/issues/1687)) ([23538e3](https://github.com/videojs/v10/commit/23538e364919bf290895972d821b9cd12d3e3e18))


### Bug Fixes

* **core:** disable toggle captions when there are no captions ([#1598](https://github.com/videojs/v10/issues/1598)) ([760870f](https://github.com/videojs/v10/commit/760870fdf28394021166df7f4ad575730dc65dbd))
* **spf:** add emptied listener to track-current-time behavior ([#1634](https://github.com/videojs/v10/issues/1634)) ([efc7c23](https://github.com/videojs/v10/commit/efc7c23b7b692d0442530ecd3e57515af8b0afa1))
* **spf:** refactor track switching to rules ([#1658](https://github.com/videojs/v10/issues/1658)) ([d9f9efd](https://github.com/videojs/v10/commit/d9f9efde88ace721a93e571c9ff3b00569208cb6))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.25

## [10.0.0-beta.24](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.23...@videojs/spf@10.0.0-beta.24) (2026-05-19)


### Features

* **spf:** HLS engine composition walkthrough + doc-driven cleanups ([#1512](https://github.com/videojs/v10/issues/1512)) ([0cfd3bb](https://github.com/videojs/v10/commit/0cfd3bb395332b19cf85e9dc7eb08f656bec3e2b))


### Bug Fixes

* **spf:** conventions, per-type specialization, config threading ([#1537](https://github.com/videojs/v10/issues/1537)) ([c112b62](https://github.com/videojs/v10/commit/c112b6248bbe779916b858494bd881289c156810))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.24

## [10.0.0-beta.23](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.22...@videojs/spf@10.0.0-beta.23) (2026-04-27)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.23

## [10.0.0-beta.22](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.21...@videojs/spf@10.0.0-beta.22) (2026-04-18)


### Bug Fixes

* **packages:** add server-only bundles  ([#1349](https://github.com/videojs/v10/issues/1349)) ([3331fda](https://github.com/videojs/v10/commit/3331fdaf25c8a89ea6d36c2972631df589fc0ad3))


### Reverts

* **packages:** add server-only bundles ([#1349](https://github.com/videojs/v10/issues/1349)) ([#1354](https://github.com/videojs/v10/issues/1354)) ([8530316](https://github.com/videojs/v10/commit/8530316987b5122a2e455b0db3bad6fd3ffa8186))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.22

## [10.0.0-beta.21](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.20...@videojs/spf@10.0.0-beta.21) (2026-04-14)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.21

## [10.0.0-beta.20](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.19...@videojs/spf@10.0.0-beta.20) (2026-04-14)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.20

## [10.0.0-beta.19](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.18...@videojs/spf@10.0.0-beta.19) (2026-04-14)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.19

## [10.0.0-beta.18](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.17...@videojs/spf@10.0.0-beta.18) (2026-04-14)


### ⚠ BREAKING CHANGES

* **packages:** replace DelegateMixin & ProxyMixin with MediaHost base classes ([#1292](https://github.com/videojs/v10/issues/1292))

### Code Refactoring

* **packages:** replace DelegateMixin & ProxyMixin with MediaHost base classes ([#1292](https://github.com/videojs/v10/issues/1292)) ([8f1653e](https://github.com/videojs/v10/commit/8f1653efcd0a3a8cc75881bc6b4c0b87599a3b8d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.18

## [10.0.0-beta.17](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.16...@videojs/spf@10.0.0-beta.17) (2026-04-11)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.17

## [10.0.0-beta.16](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.15...@videojs/spf@10.0.0-beta.16) (2026-04-10)


### Features

* **spf:** architecture reactors ([#1218](https://github.com/videojs/v10/issues/1218)) ([1346d86](https://github.com/videojs/v10/commit/1346d869ae62b6a81b551a512031cad218a7a1e5))


### Bug Fixes

* **packages:** workspace drift ([#1270](https://github.com/videojs/v10/issues/1270)) ([b874dad](https://github.com/videojs/v10/commit/b874dad30652654e77b3693116edc497355fd725))
* **utils:** stable sort comparator and orphaned JSDoc ([#1286](https://github.com/videojs/v10/issues/1286)) ([071325d](https://github.com/videojs/v10/commit/071325de4dee666a09e305399ea95e163c5d8de4))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.16

## [10.0.0-beta.15](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.14...@videojs/spf@10.0.0-beta.15) (2026-04-03)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.15

## [10.0.0-beta.14](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.13...@videojs/spf@10.0.0-beta.14) (2026-04-03)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.14

## [10.0.0-beta.13](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.12...@videojs/spf@10.0.0-beta.13) (2026-04-01)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.13

## [10.0.0-beta.12](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.11...@videojs/spf@10.0.0-beta.12) (2026-04-01)


### Features

* add Mux video component ([#1036](https://github.com/videojs/v10/issues/1036)) ([271a8c8](https://github.com/videojs/v10/commit/271a8c850216bd1654baaa26f8bb2f5eda56be37))


### Bug Fixes

* **utils:** polyfill AbortSignal.any for Chromium ≤115 ([#1142](https://github.com/videojs/v10/issues/1142)) ([c3641c8](https://github.com/videojs/v10/commit/c3641c888c9630b2780cdda556431512d9ca5b81))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.12

## [10.0.0-beta.11](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.10...@videojs/spf@10.0.0-beta.11) (2026-03-24)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.11

## [10.0.0-beta.10](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.9...@videojs/spf@10.0.0-beta.10) (2026-03-23)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.10

## [10.0.0-beta.9](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.8...@videojs/spf@10.0.0-beta.9) (2026-03-23)


### Bug Fixes

* **spf:** call sourceBuffer.abort() on AbortError to reset MSE parser state ([#1081](https://github.com/videojs/v10/issues/1081)) ([f5ecc93](https://github.com/videojs/v10/commit/f5ecc93554c054de149fbf3df2d26da49d58e7ec))
* **spf:** implement preload IDL attribute on SpfMedia ([#1069](https://github.com/videojs/v10/issues/1069)) ([04f81a2](https://github.com/videojs/v10/commit/04f81a26e13648ca414f2e51380c8786a06a7724))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.9

## [10.0.0-beta.8](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.7...@videojs/spf@10.0.0-beta.8) (2026-03-20)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.8

## [10.0.0-beta.7](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.6...@videojs/spf@10.0.0-beta.7) (2026-03-19)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.7

## [10.0.0-beta.6](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.5...@videojs/spf@10.0.0-beta.6) (2026-03-15)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.6

## [10.0.0-beta.5](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.4...@videojs/spf@10.0.0-beta.5) (2026-03-12)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.5

## [10.0.0-beta.4](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.3...@videojs/spf@10.0.0-beta.4) (2026-03-12)


### Features

* **spf:** stream segment fetches via ReadableStream body ([#890](https://github.com/videojs/v10/issues/890)) ([6fcb8eb](https://github.com/videojs/v10/commit/6fcb8eb989efc049af8a7567fce8e35b10f24168))


### Bug Fixes

* **spf:** propagate byteRange when building segment load tasks ([#904](https://github.com/videojs/v10/issues/904)) ([801be29](https://github.com/videojs/v10/commit/801be291c33ce3e611c4bc8af6c64bf6f68bc6e9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.4

## [10.0.0-beta.3](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.2...@videojs/spf@10.0.0-beta.3) (2026-03-11)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.3

## [10.0.0-beta.2](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.1...@videojs/spf@10.0.0-beta.2) (2026-03-10)


### Miscellaneous Chores

* **@videojs/spf:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.2

## [10.0.0-beta.1](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-beta.0...@videojs/spf@10.0.0-beta.1) (2026-03-10)


### Features

* **spf:** basic ManagedMediaSource support for Safari ([#843](https://github.com/videojs/v10/issues/843)) ([4bd2875](https://github.com/videojs/v10/commit/4bd287515fa118b6a337e9af9494596e2055decf))
* **spf:** initial push of SPF ([#784](https://github.com/videojs/v10/issues/784)) ([27a3993](https://github.com/videojs/v10/commit/27a3993fb20af0523e42b0d03c70a6f5a465d144))


### Bug Fixes

* **packages:** set release-please manifest and package versions to beta.0 ([#850](https://github.com/videojs/v10/issues/850)) ([e085a0d](https://github.com/videojs/v10/commit/e085a0d73af0c142e0c0a371337daae98fdbaac9))
* **spf:** add missing repository field ([#844](https://github.com/videojs/v10/issues/844)) ([32b1299](https://github.com/videojs/v10/commit/32b1299be1e794d9c9f34ede6af5016d7e349998))
* **spf:** fix async teardown leaks and recreate engine on src change ([#841](https://github.com/videojs/v10/issues/841)) ([f50d509](https://github.com/videojs/v10/commit/f50d509749522f48e66a8b5a5a98fa2255195ba8))
* **spf:** prefer MediaSource over ManagedMediaSource ([#838](https://github.com/videojs/v10/issues/838)) ([54f71d6](https://github.com/videojs/v10/commit/54f71d62aa925f8eb5a7f8399ae0374f313774ea))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-beta.1

## [10.0.0-alpha.11](https://github.com/videojs/v10/compare/@videojs/spf@10.0.0-alpha.10...@videojs/spf@10.0.0-alpha.11) (2026-03-10)


### Features

* **spf:** basic ManagedMediaSource support for Safari ([#843](https://github.com/videojs/v10/issues/843)) ([4bd2875](https://github.com/videojs/v10/commit/4bd287515fa118b6a337e9af9494596e2055decf))


### Bug Fixes

* **spf:** add missing repository field ([#844](https://github.com/videojs/v10/issues/844)) ([32b1299](https://github.com/videojs/v10/commit/32b1299be1e794d9c9f34ede6af5016d7e349998))
* **spf:** fix async teardown leaks and recreate engine on src change ([#841](https://github.com/videojs/v10/issues/841)) ([f50d509](https://github.com/videojs/v10/commit/f50d509749522f48e66a8b5a5a98fa2255195ba8))
* **spf:** prefer MediaSource over ManagedMediaSource ([#838](https://github.com/videojs/v10/issues/838)) ([54f71d6](https://github.com/videojs/v10/commit/54f71d62aa925f8eb5a7f8399ae0374f313774ea))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-alpha.11

## 10.0.0-alpha.10 (2026-03-10)


### Features

* **spf:** initial push of SPF ([#784](https://github.com/videojs/v10/issues/784)) ([27a3993](https://github.com/videojs/v10/commit/27a3993fb20af0523e42b0d03c70a6f5a465d144))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-alpha.10
