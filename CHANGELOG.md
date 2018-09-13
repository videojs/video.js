<a name="7.2.3"></a>
## [7.2.3](https://github.com/videojs/video.js/compare/v7.2.2...v7.2.3) (2018-09-13)

### Bug Fixes

* **lang:** Fixed typos in cs translation ([#5407](https://github.com/videojs/video.js/issues/5407)) ([19ee7df](https://github.com/videojs/video.js/commit/19ee7df))
* **package:** update [@videojs](https://github.com/videojs)/http-streaming to version 1.2.5 🚀 ([#5399](https://github.com/videojs/video.js/issues/5399)) ([335a0c8](https://github.com/videojs/video.js/commit/335a0c8))
* make sure all attributes are updated before applying to tag ([#5416](https://github.com/videojs/video.js/issues/5416)) ([b25f024](https://github.com/videojs/video.js/commit/b25f024)), closes [#5309](https://github.com/videojs/video.js/issues/5309)
* use consistent id for tech, no matter how it is loaded ([#5415](https://github.com/videojs/video.js/issues/5415)) ([6d6bfd1](https://github.com/videojs/video.js/commit/6d6bfd1)), closes [#5411](https://github.com/videojs/video.js/issues/5411)
* **ResizeManager:** fixup the null check ([#5427](https://github.com/videojs/video.js/issues/5427)) ([235b188](https://github.com/videojs/video.js/commit/235b188))

### Chores

* **package:** Run npm audit fix (but roll back videojs-standard version) ([#5386](https://github.com/videojs/video.js/issues/5386)) ([197d81b](https://github.com/videojs/video.js/commit/197d81b))
* **package:** update grunt-cli to version 1.3.1 ([#5409](https://github.com/videojs/video.js/issues/5409)) ([96ae3c2](https://github.com/videojs/video.js/commit/96ae3c2)), closes [#5383](https://github.com/videojs/video.js/issues/5383)
* **package:** update grunt-contrib-clean to version 2.0.0 🚀 ([#5429](https://github.com/videojs/video.js/issues/5429)) ([8191958](https://github.com/videojs/video.js/commit/8191958))
* **package:** update grunt-contrib-connect to version 2.0.0 🚀 ([#5428](https://github.com/videojs/video.js/issues/5428)) ([08cf1be](https://github.com/videojs/video.js/commit/08cf1be))
* **package:** update grunt-contrib-cssmin to version 3.0.0 🚀 ([#5417](https://github.com/videojs/video.js/issues/5417)) ([cc650f7](https://github.com/videojs/video.js/commit/cc650f7))
* **package:** update grunt-karma to version 3.0.0 🚀 ([#5421](https://github.com/videojs/video.js/issues/5421)) ([b390f2c](https://github.com/videojs/video.js/commit/b390f2c))
* **package:** update klaw-sync to version 5.0.0 🚀 ([#5414](https://github.com/videojs/video.js/issues/5414)) ([2e83888](https://github.com/videojs/video.js/commit/2e83888))
* **package:** update rollup to version 0.65.0 🚀 ([#5400](https://github.com/videojs/video.js/issues/5400)) ([6e6ade0](https://github.com/videojs/video.js/commit/6e6ade0))

### Tests

* fix travis ci issues with resize-manager tests ([#5390](https://github.com/videojs/video.js/issues/5390)) ([3744df1](https://github.com/videojs/video.js/commit/3744df1))

<a name="7.2.2"></a>
## [7.2.2](https://github.com/videojs/video.js/compare/v7.2.1...v7.2.2) (2018-08-14)

### Bug Fixes

* **package:** update [@videojs](https://github.com/videojs)/http-streaming to version 1.2.4 🚀 ([#5377](https://github.com/videojs/video.js/issues/5377)) ([c3098ee](https://github.com/videojs/video.js/commit/c3098ee)), closes [#5044](https://github.com/videojs/video.js/issues/5044)
* add debounced.cancel and use it in ResizeManager ([#5378](https://github.com/videojs/video.js/issues/5378)) ([8e9d92c](https://github.com/videojs/video.js/commit/8e9d92c))

<a name="7.2.1"></a>
## [7.2.1](https://github.com/videojs/video.js/compare/v7.2.0...v7.2.1) (2018-08-13)

### Bug Fixes

* **package:** update [@videojs](https://github.com/videojs)/http-streaming to version 1.2.3 ([#5368](https://github.com/videojs/video.js/issues/5368)) ([db4b894](https://github.com/videojs/video.js/commit/db4b894)), closes [#5365](https://github.com/videojs/video.js/issues/5365)
* **sourceset:** ignore blob urls when updating source cache ([#5371](https://github.com/videojs/video.js/issues/5371)) ([9cb1ba5](https://github.com/videojs/video.js/commit/9cb1ba5))
* always return a promise from play, if supported ([#5227](https://github.com/videojs/video.js/issues/5227)) ([58405fd](https://github.com/videojs/video.js/commit/58405fd))
* call component dispose in resize manager to fix leak ([#5369](https://github.com/videojs/video.js/issues/5369)) ([6f072d8](https://github.com/videojs/video.js/commit/6f072d8)), closes [#5339](https://github.com/videojs/video.js/issues/5339)
* change time tooltips to be absolutely positioned ([#5355](https://github.com/videojs/video.js/issues/5355)) ([4b666f9](https://github.com/videojs/video.js/commit/4b666f9)), closes [#5351](https://github.com/videojs/video.js/issues/5351)

### Chores

* **https:** update a lot of links to be https ([#5372](https://github.com/videojs/video.js/issues/5372)) ([9c00267](https://github.com/videojs/video.js/commit/9c00267))
* **package:** update karma to version 3.0.0 🚀 ([#5370](https://github.com/videojs/video.js/issues/5370)) ([6893091](https://github.com/videojs/video.js/commit/6893091))
* **package:** update rollup to version 0.64.1 ([#5367](https://github.com/videojs/video.js/issues/5367)) ([16f4e92](https://github.com/videojs/video.js/commit/16f4e92)), closes [#5363](https://github.com/videojs/video.js/issues/5363)

<a name="7.2.0"></a>
# [7.2.0](https://github.com/videojs/video.js/compare/v7.1.0...v7.2.0) (2018-07-26)

### Features

* **player:** remove text tracks on Player#reset ([#5327](https://github.com/videojs/video.js/issues/5327)) ([fd4c6e1](https://github.com/videojs/video.js/commit/fd4c6e1)), closes [#5140](https://github.com/videojs/video.js/issues/5140)
* **plugins:** allow plugin deregistration from videojs ([#5273](https://github.com/videojs/video.js/issues/5273)) ([31a0bac](https://github.com/videojs/video.js/commit/31a0bac))
* async `change` events in TextTrackList with EventTarget#queueTrigger ([#5332](https://github.com/videojs/video.js/issues/5332)) ([8c92cbf](https://github.com/videojs/video.js/commit/8c92cbf)), closes [#5159](https://github.com/videojs/video.js/issues/5159)

### Bug Fixes

* **lang:** add a missing translation in sk.json ([#5324](https://github.com/videojs/video.js/issues/5324)) ([821b46d](https://github.com/videojs/video.js/commit/821b46d))
* **lang:** Added all missing translation for CZ_cs ([#5311](https://github.com/videojs/video.js/issues/5311)) ([e63d235](https://github.com/videojs/video.js/commit/e63d235))
* **package:** update [@videojs](https://github.com/videojs)/http-streaming to version 1.2.1 ([#5334](https://github.com/videojs/video.js/issues/5334)) ([7b6aa5c](https://github.com/videojs/video.js/commit/7b6aa5c)), closes [#5321](https://github.com/videojs/video.js/issues/5321)
* subtitles/captions freeze when using uglify ([#5346](https://github.com/videojs/video.js/issues/5346)) ([5e21ebb](https://github.com/videojs/video.js/commit/5e21ebb)), closes [#5131](https://github.com/videojs/video.js/issues/5131)

### Chores

* **package:** update autoprefixer to version 9.0.1 ([#5340](https://github.com/videojs/video.js/issues/5340)) ([80bae72](https://github.com/videojs/video.js/commit/80bae72)), closes [#5322](https://github.com/videojs/video.js/issues/5322)
* **package:** update postcss-cli to version 6.0.0 🚀 ([#5329](https://github.com/videojs/video.js/issues/5329)) ([f273873](https://github.com/videojs/video.js/commit/f273873))
* **package:** update rollup to version 0.63.4 ([#5341](https://github.com/videojs/video.js/issues/5341)) ([391434d](https://github.com/videojs/video.js/commit/391434d)), closes [#5326](https://github.com/videojs/video.js/issues/5326)
* **welcome bot:** add welcome bot config ([#5313](https://github.com/videojs/video.js/issues/5313)) ([e637768](https://github.com/videojs/video.js/commit/e637768))

### Documentation

* remove duplicate `[@deprecated](https://github.com/deprecated)` which throws error when minifying via google closure compiler ([#5342](https://github.com/videojs/video.js/issues/5342)) ([d773cd4](https://github.com/videojs/video.js/commit/d773cd4))

<a name="7.1.0"></a>
# [7.1.0](https://github.com/videojs/video.js/compare/v7.0.5...v7.1.0) (2018-07-06)

### Features

* **autoplay:** extend autoplay option for greater good ([#5209](https://github.com/videojs/video.js/issues/5209)) ([e8e4fe2](https://github.com/videojs/video.js/commit/e8e4fe2))
* Add an Audio Description icon to an audio track name in the track menu if it is "main-desc" kind. ([#4599](https://github.com/videojs/video.js/issues/4599)) ([53c62ac](https://github.com/videojs/video.js/commit/53c62ac))
* **browser:** include iOS Chrome UA pattern when detecting Google Chrome ([#5262](https://github.com/videojs/video.js/issues/5262)) ([b430461](https://github.com/videojs/video.js/commit/b430461))
* **css:** run autoprefixer on css ([#5239](https://github.com/videojs/video.js/issues/5239)) ([edce736](https://github.com/videojs/video.js/commit/edce736))
* add double-click handler to toggle fullscreen ([#5148](https://github.com/videojs/video.js/issues/5148)) ([1b9bd42](https://github.com/videojs/video.js/commit/1b9bd42)), closes [#4948](https://github.com/videojs/video.js/issues/4948)
* show mute toggle button if the tech supports muting volume ([#5052](https://github.com/videojs/video.js/issues/5052)) ([2370416](https://github.com/videojs/video.js/commit/2370416)), closes [#4478](https://github.com/videojs/video.js/issues/4478)
* **fullscreen-toggle:** disable fs button if fullcreen is unavailable ([#5296](https://github.com/videojs/video.js/issues/5296)) ([444b271](https://github.com/videojs/video.js/commit/444b271)), closes [#5290](https://github.com/videojs/video.js/issues/5290)
* **middleware:** make setSource be optional ([#5295](https://github.com/videojs/video.js/issues/5295)) ([781a6d8](https://github.com/videojs/video.js/commit/781a6d8))
* **text-track-display:** Extend the constructColor function to handle 6 digit hex codes ([#5238](https://github.com/videojs/video.js/issues/5238)) ([e92f177](https://github.com/videojs/video.js/commit/e92f177))

### Bug Fixes

* Allow evented objects, such as components and plugins, to listen to the window object in addition to DOM objects. ([#5255](https://github.com/videojs/video.js/issues/5255)) ([7fd29b4](https://github.com/videojs/video.js/commit/7fd29b4))
* **browser:** TOUCH_ENABLED detection with Win10  ([#5286](https://github.com/videojs/video.js/issues/5286)) ([e683891](https://github.com/videojs/video.js/commit/e683891)), closes [#3306](https://github.com/videojs/video.js/issues/3306)
* autoplay throws 'undefined promise' error on some browsers. ([#5283](https://github.com/videojs/video.js/issues/5283)) ([c9d1e8a](https://github.com/videojs/video.js/commit/c9d1e8a))

### Chores

* **npmignore:** don't publish zip file to npm ([#5249](https://github.com/videojs/video.js/issues/5249)) ([5b8d373](https://github.com/videojs/video.js/commit/5b8d373)), closes [#5248](https://github.com/videojs/video.js/issues/5248)
* enable move and stale probots ([#5292](https://github.com/videojs/video.js/issues/5292)) ([00bb788](https://github.com/videojs/video.js/commit/00bb788))
* **package:** add module field to package.json ([#5293](https://github.com/videojs/video.js/issues/5293)) ([5d75bb6](https://github.com/videojs/video.js/commit/5d75bb6)), closes [#5288](https://github.com/videojs/video.js/issues/5288)
* **package:** update rollup to version 0.61.1 ([#5268](https://github.com/videojs/video.js/issues/5268)) ([5c15d48](https://github.com/videojs/video.js/commit/5c15d48))
* **package:** update rollup to version 0.62.0 🚀 ([#5279](https://github.com/videojs/video.js/issues/5279)) ([2d7a4d7](https://github.com/videojs/video.js/commit/2d7a4d7))
* **package:** upgrade to VHS 1.1.0 ([#5305](https://github.com/videojs/video.js/issues/5305)) ([da5a590](https://github.com/videojs/video.js/commit/da5a590))

### Code Refactoring

* removed old bug work-around code ([#5200](https://github.com/videojs/video.js/issues/5200)) ([ceed382](https://github.com/videojs/video.js/commit/ceed382))

### Performance Improvements

* setTimeout and requestAnimationFrame memory leak ([#5294](https://github.com/videojs/video.js/issues/5294)) ([d7f27b7](https://github.com/videojs/video.js/commit/d7f27b7)), closes [#5199](https://github.com/videojs/video.js/issues/5199)

### Reverts

* "fix: Allow evented objects, such as components and plugins, to listen to the window object in addition to DOM objects. ([#5255](https://github.com/videojs/video.js/issues/5255))" ([#5301](https://github.com/videojs/video.js/issues/5301)) ([361dc76](https://github.com/videojs/video.js/commit/361dc76)), closes [#5281](https://github.com/videojs/video.js/issues/5281)

<a name="7.0.5"></a>
## [7.0.5](https://github.com/videojs/video.js/compare/v7.0.4...v7.0.5) (2018-06-11)

### Bug Fixes

* make sure source options are passed through ([#5241](https://github.com/videojs/video.js/issues/5241)) ([9504a93](https://github.com/videojs/video.js/commit/9504a93)), closes [#5156](https://github.com/videojs/video.js/issues/5156)
* menu sizing when using longer caption labels ([#5228](https://github.com/videojs/video.js/issues/5228)) ([002d701](https://github.com/videojs/video.js/commit/002d701)), closes [#4758](https://github.com/videojs/video.js/issues/4758)

### Chores

* **package:** update conventional-changelog-cli to version 2.0.1 🚀 ([#5236](https://github.com/videojs/video.js/issues/5236)) ([59ab323](https://github.com/videojs/video.js/commit/59ab323)), closes [#5225](https://github.com/videojs/video.js/issues/5225)
* **package:** update grunt-contrib-watch to version 1.1.0 🚀 ([#5170](https://github.com/videojs/video.js/issues/5170)) ([e8d00e2](https://github.com/videojs/video.js/commit/e8d00e2))
* **package:** update rollup to version 0.60.1 🚀 ([#5235](https://github.com/videojs/video.js/issues/5235)) ([1b0ff8a](https://github.com/videojs/video.js/commit/1b0ff8a)), closes [#5232](https://github.com/videojs/video.js/issues/5232)
* **package:** update rollup-plugin-filesize to version 2.0.0 🚀 ([#5234](https://github.com/videojs/video.js/issues/5234)) ([781d9ae](https://github.com/videojs/video.js/commit/781d9ae))

<a name="7.0.4"></a>
## [7.0.4](https://github.com/videojs/video.js/compare/v7.0.3...v7.0.4) (2018-06-05)

### Bug Fixes

* **menus:** change ARIA role of menu items for better screen reader support ([#5171](https://github.com/videojs/video.js/issues/5171)) ([f3d7ac2](https://github.com/videojs/video.js/commit/f3d7ac2)), closes [#5136](https://github.com/videojs/video.js/issues/5136)
* **player:** ensure that JAWS+IE announces the BPB and play button ([#5173](https://github.com/videojs/video.js/issues/5173)) ([2bc810d](https://github.com/videojs/video.js/commit/2bc810d)), closes [#4583](https://github.com/videojs/video.js/issues/4583)
* build core script files as UMD ([#5220](https://github.com/videojs/video.js/issues/5220)) ([7c5a066](https://github.com/videojs/video.js/commit/7c5a066))
* silence play promise in a few more places ([#5213](https://github.com/videojs/video.js/issues/5213)) ([a29156c](https://github.com/videojs/video.js/commit/a29156c))
* **slider:** suppress console warnings in Chrome for Android when scrubbing ([#5219](https://github.com/videojs/video.js/issues/5219)) ([59869b9](https://github.com/videojs/video.js/commit/59869b9)), closes [#4650](https://github.com/videojs/video.js/issues/4650)

### Chores

* **build:** fix rollup watch during npm start ([#5203](https://github.com/videojs/video.js/issues/5203)) ([6a94741](https://github.com/videojs/video.js/commit/6a94741))

### Documentation

* **collaborator-guide:** Clarify how to Land a PR using the GitHub UI ([#5201](https://github.com/videojs/video.js/issues/5201)) ([94e54fc](https://github.com/videojs/video.js/commit/94e54fc))
* **component:** fix typo ([#5226](https://github.com/videojs/video.js/issues/5226)) ([a3fd06a](https://github.com/videojs/video.js/commit/a3fd06a))
* **examples:** remove IE9 text track HTML markup in the doc/examples, and update to use video.js v7.0 ([#5192](https://github.com/videojs/video.js/issues/5192)) ([f5a6e61](https://github.com/videojs/video.js/commit/f5a6e61))

<a name="7.0.3"></a>
## [7.0.3](https://github.com/videojs/video.js/compare/v7.0.2...v7.0.3) (2018-05-23)

### Bug Fixes

* **player:** video-js embed missing video-js class ([#5194](https://github.com/videojs/video.js/issues/5194)) ([954f3d9](https://github.com/videojs/video.js/commit/954f3d9)), closes [#5041](https://github.com/videojs/video.js/issues/5041) [videojs/http-streaming#100](https://github.com/videojs/http-streaming/issues/100)

<a name="7.0.2"></a>
## [7.0.2](https://github.com/videojs/video.js/compare/v7.0.1...v7.0.2) (2018-05-18)

### Chores

* **package:** Upgrade [@videojs](https://github.com/videojs)/http-streaming to 1.0.2 ([#5189](https://github.com/videojs/video.js/issues/5189)) ([eaf1516](https://github.com/videojs/video.js/commit/eaf1516)), closes [#5186](https://github.com/videojs/video.js/issues/5186)

<a name="7.0.1"></a>
## [7.0.1](https://github.com/videojs/video.js/compare/v7.0.0...v7.0.1) (2018-05-17)

### Bug Fixes

* **CHANGELOG:** full 7.0.0 changelog ([09ddb98](https://github.com/videojs/video.js/commit/09ddb98))
* check for el before resetSourceSet ([#5176](https://github.com/videojs/video.js/issues/5176)) ([59c6261](https://github.com/videojs/video.js/commit/59c6261))

<a name="7.0.0"></a>
# [7.0.0](https://github.com/videojs/video.js/compare/v6.8.0...v7.0.0) (2018-05-11)

### Features

* **modal:** remove old IE box sizing ([#5113](https://github.com/videojs/video.js/issues/5113)) ([4a34dd7](https://github.com/videojs/video.js/commit/4a34dd7))
* add 'autoSetup' option ([#5123](https://github.com/videojs/video.js/issues/5123)) ([d446828](https://github.com/videojs/video.js/commit/d446828)), closes [#5094](https://github.com/videojs/video.js/issues/5094)
* add tech method to allow override native audio and video ([#5074](https://github.com/videojs/video.js/issues/5074)) ([22bbbc9](https://github.com/videojs/video.js/commit/22bbbc9))
* build alternate browser scripts without VHS ([#5077](https://github.com/videojs/video.js/issues/5077)) ([c98912f](https://github.com/videojs/video.js/commit/c98912f))
* built-in HLS playback support ([#5057](https://github.com/videojs/video.js/issues/5057)) ([d1b4768](https://github.com/videojs/video.js/commit/d1b4768))
* copy properties from <video-js> to the media el ([#5039](https://github.com/videojs/video.js/issues/5039)) ([c6617b2](https://github.com/videojs/video.js/commit/c6617b2))
* Queue playback events when the playback rate is zero and we are seeking ([#5024](https://github.com/videojs/video.js/issues/5024)) ([a2851fe](https://github.com/videojs/video.js/commit/a2851fe))
* split overrideNative method into separate methods ([#5107](https://github.com/videojs/video.js/issues/5107)) ([083a86c](https://github.com/videojs/video.js/commit/083a86c))
* update the players source cache on sourceset ([#5040](https://github.com/videojs/video.js/issues/5040)) ([ba2ae78](https://github.com/videojs/video.js/commit/ba2ae78))
* upgrade video.js font to 3.0 for woff only font-icons ([#5112](https://github.com/videojs/video.js/issues/5112)) ([eeb13aa](https://github.com/videojs/video.js/commit/eeb13aa))

### Bug Fixes

* **lang:** add missing strings in pt-BR ([#5122](https://github.com/videojs/video.js/issues/5122)) ([a00aa0d](https://github.com/videojs/video.js/commit/a00aa0d)), closes [#5121](https://github.com/videojs/video.js/issues/5121)
* **package:** update [@videojs](https://github.com/videojs)/http-streaming to version 0.9.0 🚀 ([#5064](https://github.com/videojs/video.js/issues/5064)) ([11b4d5d](https://github.com/videojs/video.js/commit/11b4d5d))
* **package:** update [@videojs](https://github.com/videojs)/http-streaming to version 1.0.0 🚀 ([#5083](https://github.com/videojs/video.js/issues/5083)) ([12095fb](https://github.com/videojs/video.js/commit/12095fb))
* **package:** update videojs-vtt.js to version 0.14.1 🚀 ([#5085](https://github.com/videojs/video.js/issues/5085)) ([66d7545](https://github.com/videojs/video.js/commit/66d7545))
* **seek-bar:** ensure aria-valuenow attribute in seek-bar is not NaN ([#5164](https://github.com/videojs/video.js/issues/5164)) ([ad1bb9d](https://github.com/videojs/video.js/commit/ad1bb9d)), closes [#4960](https://github.com/videojs/video.js/issues/4960)
* options.id is now applied correctly to the player dom element ([#5090](https://github.com/videojs/video.js/issues/5090)) ([b10b9f9](https://github.com/videojs/video.js/commit/b10b9f9)), closes [#5088](https://github.com/videojs/video.js/issues/5088)
* **time-display:** restore hidden label text for screen readers. ([#5157](https://github.com/videojs/video.js/issues/5157)) ([0aa827f](https://github.com/videojs/video.js/commit/0aa827f)), closes [#5135](https://github.com/videojs/video.js/issues/5135)
* **time-display:** Use formatTime for a consistent default instead of hardcoded string ([#5055](https://github.com/videojs/video.js/issues/5055)) ([228484b](https://github.com/videojs/video.js/commit/228484b))
* `sourceset` and browser behavior inconsistencies ([#5054](https://github.com/videojs/video.js/issues/5054)) ([6147e5f](https://github.com/videojs/video.js/commit/6147e5f))
* fire sourceset on initial source append ([#5038](https://github.com/videojs/video.js/issues/5038)) ([9eb5de7](https://github.com/videojs/video.js/commit/9eb5de7))
* let the tech preload auto on its own ([#4861](https://github.com/videojs/video.js/issues/4861)) ([fdcae1b](https://github.com/videojs/video.js/commit/fdcae1b)), closes [#4660](https://github.com/videojs/video.js/issues/4660)
* Reduce the multiple-announcement by screen readers of the new name of a button when its text label changes. ([#5158](https://github.com/videojs/video.js/issues/5158)) ([1c74e4f](https://github.com/videojs/video.js/commit/1c74e4f)), closes [#5023](https://github.com/videojs/video.js/issues/5023)
* Remove spaces from element IDs and ARIA attributes in the Captions Settings Dialog ([#5153](https://github.com/videojs/video.js/issues/5153)) ([dc0d2bc](https://github.com/videojs/video.js/commit/dc0d2bc)), closes [#4688](https://github.com/videojs/video.js/issues/4688) [#4884](https://github.com/videojs/video.js/issues/4884)
* Remove unnecessary ARIA role on the Control Bar. ([#5154](https://github.com/videojs/video.js/issues/5154)) ([8a08957](https://github.com/videojs/video.js/commit/8a08957)), closes [#5134](https://github.com/videojs/video.js/issues/5134)
* wait till play event to listen for user activity ([#5093](https://github.com/videojs/video.js/issues/5093)) ([d0b03a3](https://github.com/videojs/video.js/commit/d0b03a3)), closes [#5076](https://github.com/videojs/video.js/issues/5076)

### Chores

* update rollup and uglify and the build process ([#5096](https://github.com/videojs/video.js/issues/5096)) ([97db94e](https://github.com/videojs/video.js/commit/97db94e))
* **CHANGELOG:** update CHANGELOG from 6.x ([bca3167](https://github.com/videojs/video.js/commit/bca3167))
* **first-timers-bot:** add repo to bot options ([81de856](https://github.com/videojs/video.js/commit/81de856))
* **first-timers-bot:** correct the path to template file ([9612c8f](https://github.com/videojs/video.js/commit/9612c8f))
* **first-timers-bot:** fix slack url in template ([4e79a04](https://github.com/videojs/video.js/commit/4e79a04))
* **first-timers-bot:** quote repository option ([edb257c](https://github.com/videojs/video.js/commit/edb257c))
* **package:** remove npm-run dev dep as it's no longer used ([#5084](https://github.com/videojs/video.js/issues/5084)) ([c2b5ade](https://github.com/videojs/video.js/commit/c2b5ade))
* **package:** update karma to version 2.0.2 🚀 ([#5109](https://github.com/videojs/video.js/issues/5109)) ([907c1f5](https://github.com/videojs/video.js/commit/907c1f5))
* **package:** update klaw-sync to version 4.0.0 🚀 ([#5130](https://github.com/videojs/video.js/issues/5130)) ([a6165d9](https://github.com/videojs/video.js/commit/a6165d9))
* **package:** update load-grunt-tasks to version 4.0.0 🚀 ([#5151](https://github.com/videojs/video.js/issues/5151)) ([83c3055](https://github.com/videojs/video.js/commit/83c3055))
* **package:** update rollup-plugin-json to version 3.0.0 🚀 ([#5169](https://github.com/videojs/video.js/issues/5169)) ([de9c4da](https://github.com/videojs/video.js/commit/de9c4da))
* **package:** update unified to version 7.0.0 🚀 ([#5166](https://github.com/videojs/video.js/issues/5166)) ([5407381](https://github.com/videojs/video.js/commit/5407381))
* **test:** upgrade qunit and karma-qunit to latest ([#5051](https://github.com/videojs/video.js/issues/5051)) ([44312bc](https://github.com/videojs/video.js/commit/44312bc))

### Code Refactoring

* move seekbar event handler bindings into a function ([#5097](https://github.com/videojs/video.js/issues/5097)) ([1069e7f](https://github.com/videojs/video.js/commit/1069e7f))
* move sourceset code out of tech ([#5037](https://github.com/videojs/video.js/issues/5037)) ([1cb67ab](https://github.com/videojs/video.js/commit/1cb67ab))
* remove IE8 specific changes ([#5041](https://github.com/videojs/video.js/issues/5041)) ([bc2da7c](https://github.com/videojs/video.js/commit/bc2da7c))

### Documentation

* fix more misspellings ([#5067](https://github.com/videojs/video.js/issues/5067)) ([7da7766](https://github.com/videojs/video.js/commit/7da7766))
* fix some misspellings ([#5082](https://github.com/videojs/video.js/issues/5082)) ([064c1be](https://github.com/videojs/video.js/commit/064c1be))
* update readme to use the latest version of vjs ([#5073](https://github.com/videojs/video.js/issues/5073)) ([167b7d8](https://github.com/videojs/video.js/commit/167b7d8)), closes [#5066](https://github.com/videojs/video.js/issues/5066)
* **debugging:** fix markup typo ([#5086](https://github.com/videojs/video.js/issues/5086)) ([4399bdc](https://github.com/videojs/video.js/commit/4399bdc))
* **guides:** add debugging section to index ([#5100](https://github.com/videojs/video.js/issues/5100)) ([62c1477](https://github.com/videojs/video.js/commit/62c1477))
* **languages:** Use valid JSON in translation example ([#5080](https://github.com/videojs/video.js/issues/5080)) ([bec7f67](https://github.com/videojs/video.js/commit/bec7f67))
* **tech:** fix misspellings ([#5059](https://github.com/videojs/video.js/issues/5059)) ([96987f8](https://github.com/videojs/video.js/commit/96987f8))
* **text-track:** fix misspellings ([#5058](https://github.com/videojs/video.js/issues/5058)) ([4d3331e](https://github.com/videojs/video.js/commit/4d3331e))
* **time-ranges:** fix misspellings ([#5046](https://github.com/videojs/video.js/issues/5046)) ([378d98e](https://github.com/videojs/video.js/commit/378d98e))

### Tests

* no longer test on IE8, IE9, or IE10 ([#5032](https://github.com/videojs/video.js/issues/5032)) ([0a20d65](https://github.com/videojs/video.js/commit/0a20d65))
* update karma browser OS versions ([#5050](https://github.com/videojs/video.js/issues/5050)) ([3798446](https://github.com/videojs/video.js/commit/3798446))


### BREAKING CHANGES

* remove IE8, IE9, and IE10 specific JavaScript and CSS code. Remove Android 2.3 workaround.

<a name="6.10.0"></a>
# [6.10.0](https://github.com/videojs/video.js/compare/v6.9.0...v6.10.0) (2018-05-11)

### Features

* add 'autoSetup' option ([#5123](https://github.com/videojs/video.js/issues/5123)) ([592c255](https://github.com/videojs/video.js/commit/592c255)), closes [#5094](https://github.com/videojs/video.js/issues/5094)
* copy properties from <video-js> to the media el from ([#5039](https://github.com/videojs/video.js/issues/5039)) as ([#5163](https://github.com/videojs/video.js/issues/5163)) ([c654c7d](https://github.com/videojs/video.js/commit/c654c7d))
* update the players source cache on sourceset from ([#5040](https://github.com/videojs/video.js/issues/5040)) as ([#5156](https://github.com/videojs/video.js/issues/5156)) ([72f84d5](https://github.com/videojs/video.js/commit/72f84d5))

### Bug Fixes

* **time-display:** restore hidden label text for screen readers. ([#5157](https://github.com/videojs/video.js/issues/5157)) ([baa6b56](https://github.com/videojs/video.js/commit/baa6b56)), closes [#5135](https://github.com/videojs/video.js/issues/5135)
* `sourceset` and browser behavior inconsistencies from ([#5054](https://github.com/videojs/video.js/issues/5054)) as ([#5162](https://github.com/videojs/video.js/issues/5162)) ([e1d26d8](https://github.com/videojs/video.js/commit/e1d26d8))
* Reduce the multiple-announcement by screen readers of the new name of a button when its text label changes. ([#5158](https://github.com/videojs/video.js/issues/5158)) ([79fed25](https://github.com/videojs/video.js/commit/79fed25)), closes [#5023](https://github.com/videojs/video.js/issues/5023)
* Remove spaces from element IDs and ARIA attributes in the Captions Settings Dialog ([#5153](https://github.com/videojs/video.js/issues/5153)) ([e076cde](https://github.com/videojs/video.js/commit/e076cde)), closes [#4688](https://github.com/videojs/video.js/issues/4688) [#4884](https://github.com/videojs/video.js/issues/4884)
* Remove unnecessary ARIA role on the Control Bar. ([#5154](https://github.com/videojs/video.js/issues/5154)) ([9607712](https://github.com/videojs/video.js/commit/9607712)), closes [#5134](https://github.com/videojs/video.js/issues/5134)

<a name="6.9.0"></a>
# [6.9.0](https://github.com/videojs/video.js/compare/v6.8.0...v6.9.0) (2018-04-20)

### Features

* Queue playback events when the playback rate is zero and we are seeking ([#5061](https://github.com/videojs/video.js/issues/5061)) ([eaf3c98](https://github.com/videojs/video.js/commit/eaf3c98)), closes [#5024](https://github.com/videojs/video.js/issues/5024)

### Bug Fixes

* fire sourceset on initial source append ([#5038](https://github.com/videojs/video.js/issues/5038)) ([#5072](https://github.com/videojs/video.js/issues/5072)) ([00e7f7b](https://github.com/videojs/video.js/commit/00e7f7b))
* let the tech preload auto on its own ([#4861](https://github.com/videojs/video.js/issues/4861)) ([#5065](https://github.com/videojs/video.js/issues/5065)) ([c04dac4](https://github.com/videojs/video.js/commit/c04dac4)), closes [#4660](https://github.com/videojs/video.js/issues/4660)
* options.id is now applied correctly to the player dom element ([#5090](https://github.com/videojs/video.js/issues/5090)) ([dd45dc0](https://github.com/videojs/video.js/commit/dd45dc0)), closes [#5088](https://github.com/videojs/video.js/issues/5088)
* wait till play event to listen for user activity ([#5093](https://github.com/videojs/video.js/issues/5093)) ([9f8ce2d](https://github.com/videojs/video.js/commit/9f8ce2d)), closes [#5076](https://github.com/videojs/video.js/issues/5076)
* **time-display:** Use formatTime for a consistent default instead of hardcoded string ([#5055](https://github.com/videojs/video.js/issues/5055)) ([363af84](https://github.com/videojs/video.js/commit/363af84))

### Code Refactoring

* move seekbar event handler bindings into a function ([#5097](https://github.com/videojs/video.js/issues/5097)) ([7c3213c](https://github.com/videojs/video.js/commit/7c3213c))
* move sourceset code out of tech ([#5049](https://github.com/videojs/video.js/issues/5049)) ([e2b9d58](https://github.com/videojs/video.js/commit/e2b9d58))

### Documentation

* **debugging:** fix markup typo ([#5086](https://github.com/videojs/video.js/issues/5086)) ([8c77aa0](https://github.com/videojs/video.js/commit/8c77aa0))
* **guides:** add debugging section to index ([#5100](https://github.com/videojs/video.js/issues/5100)) ([20546d3](https://github.com/videojs/video.js/commit/20546d3))

### Tests

* fix queue playing events test for ie8 (for real this time) ([#5110](https://github.com/videojs/video.js/issues/5110)) ([5dec1a0](https://github.com/videojs/video.js/commit/5dec1a0))
* fix queued events test with playbackrate in IE8 ([#5105](https://github.com/videojs/video.js/issues/5105)) ([c4a05eb](https://github.com/videojs/video.js/commit/c4a05eb))

<a name="6.8.0"></a>
# [6.8.0](https://github.com/videojs/video.js/compare/v6.7.4...v6.8.0) (2018-03-19)

### Features

* add mimetype type to source object when possible ([#4469](https://github.com/videojs/video.js/issues/4469)) ([#4947](https://github.com/videojs/video.js/issues/4947)) ([62ff3f6](https://github.com/videojs/video.js/commit/62ff3f6)), closes [#4851](https://github.com/videojs/video.js/issues/4851)
* Allow techs to change poster if player option `techCanOverridePoster` is set ([#4921](https://github.com/videojs/video.js/issues/4921)) ([8706941](https://github.com/videojs/video.js/commit/8706941)), closes [#4910](https://github.com/videojs/video.js/issues/4910)
* **format time:** add setFormatTime for overriding the time format  ([#4962](https://github.com/videojs/video.js/issues/4962)) ([2f96914](https://github.com/videojs/video.js/commit/2f96914)), closes [#2931](https://github.com/videojs/video.js/issues/2931)
* require enableSourceset option for event ([#5031](https://github.com/videojs/video.js/issues/5031)) ([1b3c827](https://github.com/videojs/video.js/commit/1b3c827))
* sourceset event ([#4660](https://github.com/videojs/video.js/issues/4660)) ([df96a74](https://github.com/videojs/video.js/commit/df96a74))
* Use CSS grid for Caption Settings dialog to begin making it more responsive ([#4997](https://github.com/videojs/video.js/issues/4997)) ([d2f63ad](https://github.com/videojs/video.js/commit/d2f63ad))

### Bug Fixes

* don't add captions settings menu item when TextTrackSettings is disabled ([#5002](https://github.com/videojs/video.js/issues/5002)) ([ba6a71e](https://github.com/videojs/video.js/commit/ba6a71e)), closes [#4996](https://github.com/videojs/video.js/issues/4996)
* **sourceset:** set evt.src to empty string or src attr from load ([#5016](https://github.com/videojs/video.js/issues/5016)) ([46d8b37](https://github.com/videojs/video.js/commit/46d8b37))

### Chores

* make sure first-timers bot uses our template ([#5001](https://github.com/videojs/video.js/issues/5001)) ([43b5a6d](https://github.com/videojs/video.js/commit/43b5a6d))
* **dom.js:** Fix misspellings ([#5008](https://github.com/videojs/video.js/issues/5008)) ([e833d3e](https://github.com/videojs/video.js/commit/e833d3e))
* update package-lock.json ([9519740](https://github.com/videojs/video.js/commit/9519740))

### Documentation

* **component:** fix misspellings ([#5017](https://github.com/videojs/video.js/issues/5017)) ([1532df3](https://github.com/videojs/video.js/commit/1532df3))
* **component:** fix misspelllings ([#5019](https://github.com/videojs/video.js/issues/5019)) ([ebbe868](https://github.com/videojs/video.js/commit/ebbe868))
* **react guide:** update guide to prevent memory leaks when components are disposed of ([#4998](https://github.com/videojs/video.js/issues/4998)) ([1fa9dfb](https://github.com/videojs/video.js/commit/1fa9dfb))
* **time-ranges:** fix misspellings ([#5025](https://github.com/videojs/video.js/issues/5025)) ([bd6b31c](https://github.com/videojs/video.js/commit/bd6b31c))
* **time-ranges:** fix wrong comment for getRange function ([#5026](https://github.com/videojs/video.js/issues/5026)) ([d7f45ba](https://github.com/videojs/video.js/commit/d7f45ba))

### Reverts

* Revert "fix: force autoplay in Chrome ([#4804](https://github.com/videojs/video.js/issues/4804))" ([#5009](https://github.com/videojs/video.js/issues/5009)) ([8d86afd](https://github.com/videojs/video.js/commit/8d86afd)), closes [#4720](https://github.com/videojs/video.js/issues/4720) [#5005](https://github.com/videojs/video.js/issues/5005) [#4720](https://github.com/videojs/video.js/issues/4720) [#5005](https://github.com/videojs/video.js/issues/5005)

### Tests

* **ResizeManager:** only listen for one playerresize to make test not flaky ([#5022](https://github.com/videojs/video.js/issues/5022)) ([4e83cd3](https://github.com/videojs/video.js/commit/4e83cd3))

<a name="6.7.4"></a>
## [6.7.4](https://github.com/videojs/video.js/compare/v6.7.3...v6.7.4) (2018-03-05)

### Bug Fixes

* Fix an issue where disabling the progress control would throw an error. ([#4986](https://github.com/videojs/video.js/issues/4986)) ([5b5cc50](https://github.com/videojs/video.js/commit/5b5cc50))
* **events:** triggering with an object had incorrect target property on event object ([#4993](https://github.com/videojs/video.js/issues/4993)) ([9c4ded8](https://github.com/videojs/video.js/commit/9c4ded8))
* **package:** update videojs-vtt.js to version 0.12.6 ([#4954](https://github.com/videojs/video.js/issues/4954)) ([2d64977](https://github.com/videojs/video.js/commit/2d64977))
* **text-tracks:** keep showing captions even if the text track settings were disabled ([#4974](https://github.com/videojs/video.js/issues/4974)) ([7facc44](https://github.com/videojs/video.js/commit/7facc44)), closes [#4964](https://github.com/videojs/video.js/issues/4964)

### Chores

* **package:** update grunt-accessibility to version 6.0.0 🚀 ([#4968](https://github.com/videojs/video.js/issues/4968)) ([270a231](https://github.com/videojs/video.js/commit/270a231))

<a name="6.7.3"></a>
## [6.7.3](https://github.com/videojs/video.js/compare/v6.7.2...v6.7.3) (2018-02-22)

### Bug Fixes

* **text-track-settings:** fix track settings font class name ([#4956](https://github.com/videojs/video.js/issues/4956)) ([de9069f](https://github.com/videojs/video.js/commit/de9069f)), closes [#4950](https://github.com/videojs/video.js/issues/4950) [#4879](https://github.com/videojs/video.js/issues/4879)
* Add alternate text to the loading spinner. ([#4916](https://github.com/videojs/video.js/issues/4916)) ([50831e3](https://github.com/videojs/video.js/commit/50831e3)), closes [#4902](https://github.com/videojs/video.js/issues/4902)
* regression for getting a player via the tech's id ([#4969](https://github.com/videojs/video.js/issues/4969)) ([0ace2a5](https://github.com/videojs/video.js/commit/0ace2a5)), closes [/github.com/videojs/video.js/blob/f6eaa5e2ae417ffe27251133e1d1212cd9afa8e2/src/js/video.js#L103-L107](https://github.com//github.com/videojs/video.js/blob/f6eaa5e2ae417ffe27251133e1d1212cd9afa8e2/src/js/video.js/issues/L103-L107)

### Chores

* add first-timers-issue-template.md ([#4958](https://github.com/videojs/video.js/issues/4958)) ([f5c7373](https://github.com/videojs/video.js/commit/f5c7373))
* re-enable Greenkeeper 🌴 and make it update package-lock.json ([#4967](https://github.com/videojs/video.js/issues/4967)) ([aa5f3bf](https://github.com/videojs/video.js/commit/aa5f3bf))

### Documentation

* **plugins guide:** changed paused to pause where appropriate ([#4957](https://github.com/videojs/video.js/issues/4957)) ([763a7f5](https://github.com/videojs/video.js/commit/763a7f5)), closes [#4951](https://github.com/videojs/video.js/issues/4951)
* **react:** Update docs for react tutorial ([#4935](https://github.com/videojs/video.js/issues/4935)) ([#4952](https://github.com/videojs/video.js/issues/4952)) ([7c30f97](https://github.com/videojs/video.js/commit/7c30f97))

<a name="6.7.2"></a>
## [6.7.2](https://github.com/videojs/video.js/compare/v6.7.1...v6.7.2) (2018-02-13)

### Bug Fixes

* cache middleware instances per player ([#4939](https://github.com/videojs/video.js/issues/4939)) ([29a8ee1](https://github.com/videojs/video.js/commit/29a8ee1)), closes [#4677](https://github.com/videojs/video.js/issues/4677)
* Only select TextTrackMenuItem if unselected ([#4920](https://github.com/videojs/video.js/issues/4920)) ([6189baa](https://github.com/videojs/video.js/commit/6189baa))
* **progress control:** Fix the video continuing to play when the user scrubs outside of seekbar ([#4918](https://github.com/videojs/video.js/issues/4918)) ([a1cef80](https://github.com/videojs/video.js/commit/a1cef80))

### Documentation

* Fix the advance plugin example in documentation ([#4923](https://github.com/videojs/video.js/issues/4923)) ([4afabc2](https://github.com/videojs/video.js/commit/4afabc2))
* **middleware:** update the middleware guide with setTech and other corrections ([#4926](https://github.com/videojs/video.js/issues/4926)) ([a434551](https://github.com/videojs/video.js/commit/a434551))

<a name="6.7.1"></a>
## [6.7.1](https://github.com/videojs/video.js/compare/v6.7.0...v6.7.1) (2018-01-31)

<a name="6.7.0"></a>
# [6.7.0](https://github.com/videojs/video.js/compare/v6.6.3...v6.7.0) (2018-01-30)

### Features

* Add `getPlayer` method to Video.js. ([#4836](https://github.com/videojs/video.js/issues/4836)) ([a15e616](https://github.com/videojs/video.js/commit/a15e616))
* Add `videojs.getAllPlayers` to get an array of players. ([#4842](https://github.com/videojs/video.js/issues/4842)) ([6a00577](https://github.com/videojs/video.js/commit/6a00577))
* add mediator middleware type for play() ([#4868](https://github.com/videojs/video.js/issues/4868)) ([bf3eb45](https://github.com/videojs/video.js/commit/bf3eb45))
* playerresize event in all cases ([#4864](https://github.com/videojs/video.js/issues/4864)) ([9ceb4e4](https://github.com/videojs/video.js/commit/9ceb4e4))

### Bug Fixes

* do not patch canplaytype on android chrome ([#4885](https://github.com/videojs/video.js/issues/4885)) ([f03ac5e](https://github.com/videojs/video.js/commit/f03ac5e))

### Chores

* generate a test example on netlify for PRs ([#4912](https://github.com/videojs/video.js/issues/4912)) ([8b54737](https://github.com/videojs/video.js/commit/8b54737))
* **package:** update dependencies ([#4908](https://github.com/videojs/video.js/issues/4908)) ([dcab42e](https://github.com/videojs/video.js/commit/dcab42e))

### Documentation

* Update COLLABORATOR_GUIDE.md and CONTRIBUTING.md to include label meanings ([#4874](https://github.com/videojs/video.js/issues/4874)) ([a345971](https://github.com/videojs/video.js/commit/a345971))

### Tests

* add project and build names to browserstack ([#4903](https://github.com/videojs/video.js/issues/4903)) ([41fd5cb](https://github.com/videojs/video.js/commit/41fd5cb))

<a name="6.6.3"></a>
## [6.6.3](https://github.com/videojs/video.js/compare/v6.6.2...v6.6.3) (2018-01-24)

### Bug Fixes

* hide volume slider when the slider is not active and mute toggle button is in focus ([#4866](https://github.com/videojs/video.js/issues/4866)) ([e628ccd](https://github.com/videojs/video.js/commit/e628ccd))

### Chores

* **docs site:** use git commit message for netlify build ([#4900](https://github.com/videojs/video.js/issues/4900)) ([ddfaf14](https://github.com/videojs/video.js/commit/ddfaf14))
* **package:** update remark-cli to version 5.0.0 ([#4894](https://github.com/videojs/video.js/issues/4894)) ([aee4e6b](https://github.com/videojs/video.js/commit/aee4e6b))
* **package:** update remark-parse to version 5.0.0 ([#4892](https://github.com/videojs/video.js/issues/4892)) ([2c59476](https://github.com/videojs/video.js/commit/2c59476))
* **package:** update remark-stringify to version 5.0.0 ([#4893](https://github.com/videojs/video.js/issues/4893)) ([5b76bb1](https://github.com/videojs/video.js/commit/5b76bb1))
* **package:** update shelljs to version 0.8.1 ([#4899](https://github.com/videojs/video.js/issues/4899)) ([87cbd23](https://github.com/videojs/video.js/commit/87cbd23)), closes [#4875](https://github.com/videojs/video.js/issues/4875)

### Documentation

* add middleware guide ([#4877](https://github.com/videojs/video.js/issues/4877)) ([673c231](https://github.com/videojs/video.js/commit/673c231))
* fix some typos ([#4880](https://github.com/videojs/video.js/issues/4880)) ([83880b0](https://github.com/videojs/video.js/commit/83880b0))

<a name="6.6.2"></a>
## [6.6.2](https://github.com/videojs/video.js/compare/v6.6.1...v6.6.2) (2018-01-05)

### Bug Fixes

* progress bar time tooltips bug by adding word-break css reset ([#4859](https://github.com/videojs/video.js/issues/4859)) ([98212c4](https://github.com/videojs/video.js/commit/98212c4)), closes [#2964](https://github.com/videojs/video.js/issues/2964)
* silence unhandled promise rejection in Safari when seeking ([#4860](https://github.com/videojs/video.js/issues/4860)) ([baf0982](https://github.com/videojs/video.js/commit/baf0982)), closes [#4853](https://github.com/videojs/video.js/issues/4853)

### Chores

* **netlify:** add some debug info in the netlify command ([#4862](https://github.com/videojs/video.js/issues/4862)) ([8f450ea](https://github.com/videojs/video.js/commit/8f450ea))
* **package:** update karma to version 2.0.0 ([#4834](https://github.com/videojs/video.js/issues/4834)) ([22fcd03](https://github.com/videojs/video.js/commit/22fcd03))

### Documentation

* wait for text track load with addRemoteTextTrack ([#4855](https://github.com/videojs/video.js/issues/4855)) ([7c393e5](https://github.com/videojs/video.js/commit/7c393e5))

<a name="6.6.1"></a>
## [6.6.1](https://github.com/videojs/video.js/compare/v6.6.0...v6.6.1) (2018-01-04)

### Bug Fixes

* **lang:** Complete the Simplified Chinese translations (zn-CN.json) ([#4827](https://github.com/videojs/video.js/issues/4827)) ([98773dd](https://github.com/videojs/video.js/commit/98773dd))
* **lang:** Complete the Traditional Chinese translation (zh-CT.json) ([#4828](https://github.com/videojs/video.js/issues/4828)) ([eb4bd9f](https://github.com/videojs/video.js/commit/eb4bd9f))
* Fix an issue where hookOnce failed for the 'beforesetup' hook. ([#4841](https://github.com/videojs/video.js/issues/4841)) ([a6f4444](https://github.com/videojs/video.js/commit/a6f4444))
* replace `&nbsp;` with `\u00a0` ([#4825](https://github.com/videojs/video.js/issues/4825)) ([98fe49f](https://github.com/videojs/video.js/commit/98fe49f)), closes [#4309](https://github.com/videojs/video.js/issues/4309)
* wrap audio change handler rather than bind so a player dispose doesn't affect other players ([#4847](https://github.com/videojs/video.js/issues/4847)) ([4eb0047](https://github.com/videojs/video.js/commit/4eb0047))

### Chores

* **lang:** update translations needed doc ([#4858](https://github.com/videojs/video.js/issues/4858)) ([df0d705](https://github.com/videojs/video.js/commit/df0d705))

<a name="6.6.0"></a>
# [6.6.0](https://github.com/videojs/video.js/compare/v6.5.2...v6.6.0) (2017-12-15)

### Features

* add support for debug logging ([#4780](https://github.com/videojs/video.js/issues/4780)) ([ba0f20e](https://github.com/videojs/video.js/commit/ba0f20e))
* playerresize event on Player dimension API calls ([#4800](https://github.com/videojs/video.js/issues/4800)) ([e0ed0b5](https://github.com/videojs/video.js/commit/e0ed0b5))
* **css:** add a delay before showing loading spinner ([#4806](https://github.com/videojs/video.js/issues/4806)) ([f47a083](https://github.com/videojs/video.js/commit/f47a083))

### Bug Fixes

* **package:** update videojs-font to version 2.1.0 ([#4812](https://github.com/videojs/video.js/issues/4812)) ([1117587](https://github.com/videojs/video.js/commit/1117587))
* modify debug log tests to accomodate old IE stringification ([#4824](https://github.com/videojs/video.js/issues/4824)) ([5f89570](https://github.com/videojs/video.js/commit/5f89570))

### Chores

* **package:** update remark-toc to version 5.0.0 ([#4803](https://github.com/videojs/video.js/issues/4803)) ([0fa8c84](https://github.com/videojs/video.js/commit/0fa8c84))
* remove unused deps ([#4814](https://github.com/videojs/video.js/issues/4814)) ([dede592](https://github.com/videojs/video.js/commit/dede592))
* switch to node 8 ([#4813](https://github.com/videojs/video.js/issues/4813)) ([f6f996d](https://github.com/videojs/video.js/commit/f6f996d))

<a name="6.5.2"></a>
## [6.5.2](https://github.com/videojs/video.js/compare/v6.5.1...v6.5.2) (2017-12-14)

### Bug Fixes

* **html5:** loop video el attributes in order ([#4805](https://github.com/videojs/video.js/issues/4805)) ([409a13e](https://github.com/videojs/video.js/commit/409a13e))
* force autoplay in Chrome ([#4804](https://github.com/videojs/video.js/issues/4804)) ([6fe7a9a](https://github.com/videojs/video.js/commit/6fe7a9a)), closes [#4720](https://github.com/videojs/video.js/issues/4720)
* Seek to 0 if attempt is made to seek to negative value ([#4799](https://github.com/videojs/video.js/issues/4799)) ([1a588f7](https://github.com/videojs/video.js/commit/1a588f7)), closes [#4501](https://github.com/videojs/video.js/issues/4501)
* use correct logic for menu focus ([#4823](https://github.com/videojs/video.js/issues/4823)) ([51ed400](https://github.com/videojs/video.js/commit/51ed400)), closes [#4821](https://github.com/videojs/video.js/issues/4821)

### Chores

* remove unused popup classes ([#4792](https://github.com/videojs/video.js/issues/4792)) ([295889b](https://github.com/videojs/video.js/commit/295889b)), closes [#4725](https://github.com/videojs/video.js/issues/4725)
* **lang:** Add translation for "caption settings" in zh-CN.json ([#4815](https://github.com/videojs/video.js/issues/4815)) ([15cd32e](https://github.com/videojs/video.js/commit/15cd32e))
* **lang:** Add translation for "caption settings" in zh-TW.json ([#4816](https://github.com/videojs/video.js/issues/4816)) ([029955a](https://github.com/videojs/video.js/commit/029955a))

<a name="6.5.1"></a>
## [6.5.1](https://github.com/videojs/video.js/compare/v6.5.0...v6.5.1) (2017-12-04)

### Bug Fixes

* cannot drag on progress bar in IE9 ([#4783](https://github.com/videojs/video.js/issues/4783)) ([2337c1b](https://github.com/videojs/video.js/commit/2337c1b)), closes [#4773](https://github.com/videojs/video.js/issues/4773)
* null check closest.getAttribute ([#4763](https://github.com/videojs/video.js/issues/4763)) ([0f1b260](https://github.com/videojs/video.js/commit/0f1b260))
* off text tracks should be set based on current state ([#4775](https://github.com/videojs/video.js/issues/4775)) ([904989d](https://github.com/videojs/video.js/commit/904989d))
* Remove listener used to test if passive listeners are supported ([#4787](https://github.com/videojs/video.js/issues/4787)) ([e582c3c](https://github.com/videojs/video.js/commit/e582c3c))

### Chores

* css is not built initially on grunt dev ([#4778](https://github.com/videojs/video.js/issues/4778)) ([c5ae98b](https://github.com/videojs/video.js/commit/c5ae98b))

### Documentation

* clarify text tracks are meant for any usage of Video.js, both video and audio ([#4790](https://github.com/videojs/video.js/issues/4790)) ([1672a6d](https://github.com/videojs/video.js/commit/1672a6d))
* deploy docs using netlify ([#4774](https://github.com/videojs/video.js/issues/4774)) ([4dd000c](https://github.com/videojs/video.js/commit/4dd000c)), closes [#4609](https://github.com/videojs/video.js/issues/4609)

<a name="6.5.0"></a>
# [6.5.0](https://github.com/videojs/video.js/compare/v6.4.0...v6.5.0) (2017-11-17)

### Features

* add a version method to all advanced plugin instances ([#4714](https://github.com/videojs/video.js/issues/4714)) ([acf4153](https://github.com/videojs/video.js/commit/acf4153))
* allow embeds via <video-js> element ([#4640](https://github.com/videojs/video.js/issues/4640)) ([d8aadd5](https://github.com/videojs/video.js/commit/d8aadd5))

### Bug Fixes

* Avoid empty but shown title attribute with menu items and clickable components ([#4746](https://github.com/videojs/video.js/issues/4746)) ([dc588dd](https://github.com/videojs/video.js/commit/dc588dd))
* **Player#play:** Wait for loadstart in play() when changing sources instead of just ready. ([#4743](https://github.com/videojs/video.js/issues/4743)) ([26b0d2c](https://github.com/videojs/video.js/commit/26b0d2c))
* being able to toggle playback with middle click ([#4756](https://github.com/videojs/video.js/issues/4756)) ([7a776ee](https://github.com/videojs/video.js/commit/7a776ee)), closes [#4689](https://github.com/videojs/video.js/issues/4689)
* make the progress bar progress smoothly ([#4591](https://github.com/videojs/video.js/issues/4591)) ([acc641a](https://github.com/videojs/video.js/commit/acc641a))
* only allow left click dragging on progress bar and volume control ([#4613](https://github.com/videojs/video.js/issues/4613)) ([79b4355](https://github.com/videojs/video.js/commit/79b4355))
* only print element not in DOM warning on player creation ([#4755](https://github.com/videojs/video.js/issues/4755)) ([bbea5cc](https://github.com/videojs/video.js/commit/bbea5cc))
* trigger timeupdate during seek ([#4754](https://github.com/videojs/video.js/issues/4754)) ([1fcd5ae](https://github.com/videojs/video.js/commit/1fcd5ae))

### Chores

* **lang:** update Persian translations ([#4741](https://github.com/videojs/video.js/issues/4741)) ([95d7832](https://github.com/videojs/video.js/commit/95d7832))

### Code Refactoring

* player.controls() ([#4731](https://github.com/videojs/video.js/issues/4731)) ([d447e9f](https://github.com/videojs/video.js/commit/d447e9f))
* player.listenForUserActivity_() ([#4719](https://github.com/videojs/video.js/issues/4719)) ([c16fedf](https://github.com/videojs/video.js/commit/c16fedf))
* player.userActive() ([#4716](https://github.com/videojs/video.js/issues/4716)) ([6cbe3ed](https://github.com/videojs/video.js/commit/6cbe3ed))
* player.usingNativeControls() ([#4749](https://github.com/videojs/video.js/issues/4749)) ([eb909f0](https://github.com/videojs/video.js/commit/eb909f0))

### Documentation

* **readme:** fixed a typo ([#4730](https://github.com/videojs/video.js/issues/4730)) ([46a7df2](https://github.com/videojs/video.js/commit/46a7df2))

### Performance Improvements

* null out els on dispose to minimize detached els ([#4745](https://github.com/videojs/video.js/issues/4745)) ([2da7af1](https://github.com/videojs/video.js/commit/2da7af1))

### Tests

* clean up test warnings ([#4752](https://github.com/videojs/video.js/issues/4752)) ([3aae4b2](https://github.com/videojs/video.js/commit/3aae4b2))
* update tests to use qunit 2 assert format ([#4753](https://github.com/videojs/video.js/issues/4753)) ([06641e8](https://github.com/videojs/video.js/commit/06641e8))
* warning, if the element is not in the DOM ([#4723](https://github.com/videojs/video.js/issues/4723)) ([c213737](https://github.com/videojs/video.js/commit/c213737))

<a name="6.4.0"></a>
# [6.4.0](https://github.com/videojs/video.js/compare/v6.3.3...v6.4.0) (2017-11-01)

### Features

* **lang:** add Hebrew translation ([#4675](https://github.com/videojs/video.js/issues/4675)) ([32caf35](https://github.com/videojs/video.js/commit/32caf35))
* **lang:** Update for Russian translation ([#4663](https://github.com/videojs/video.js/issues/4663)) ([45e21fd](https://github.com/videojs/video.js/commit/45e21fd))
* Add videojs.hookOnce method to allow single-run hooks. ([#4672](https://github.com/videojs/video.js/issues/4672)) ([85fe685](https://github.com/videojs/video.js/commit/85fe685))
* add warning if the element given to Video.js is not in the DOM ([#4698](https://github.com/videojs/video.js/issues/4698)) ([6f713ca](https://github.com/videojs/video.js/commit/6f713ca))
* allow progress controls to be disabled ([#4649](https://github.com/videojs/video.js/issues/4649)) ([a3c254e](https://github.com/videojs/video.js/commit/a3c254e))
* set the play progress seek bar to 100% on ended ([#4648](https://github.com/videojs/video.js/issues/4648)) ([5e9655f](https://github.com/videojs/video.js/commit/5e9655f))

### Bug Fixes

* **css:** update user-select none ([#4678](https://github.com/videojs/video.js/issues/4678)) ([43ddc72](https://github.com/videojs/video.js/commit/43ddc72))
* aria-labelledby attribute has an extra space ([#4708](https://github.com/videojs/video.js/issues/4708)) ([855adf3](https://github.com/videojs/video.js/commit/855adf3)), closes [#4688](https://github.com/videojs/video.js/issues/4688)
* Don't enable player controls if they where disabled when ModalDialog closes. ([#4690](https://github.com/videojs/video.js/issues/4690)) ([afea980](https://github.com/videojs/video.js/commit/afea980))
* don't throttle duration change updates ([#4635](https://github.com/videojs/video.js/issues/4635)) ([9cf9800](https://github.com/videojs/video.js/commit/9cf9800))
* Events#off threw if Object.prototype had extra enumerable properties, don't remove all events if off receives a falsey value ([#4669](https://github.com/videojs/video.js/issues/4669)) ([7963913](https://github.com/videojs/video.js/commit/7963913))
* make parseUrl helper always have a protocl ([#4673](https://github.com/videojs/video.js/issues/4673)) ([bebca9c](https://github.com/videojs/video.js/commit/bebca9c)), closes [#3100](https://github.com/videojs/video.js/issues/3100)
* Make sure we remove vjs-ended from the play toggle in all appropriate cases. ([#4661](https://github.com/videojs/video.js/issues/4661)) ([0287f6e](https://github.com/videojs/video.js/commit/0287f6e))
* player.src() should return empty string if no source is set ([#4711](https://github.com/videojs/video.js/issues/4711)) ([9acbcd8](https://github.com/videojs/video.js/commit/9acbcd8))

### Chores

* **gh-release:** no console log on success ([#4657](https://github.com/videojs/video.js/issues/4657)) ([e8511a5](https://github.com/videojs/video.js/commit/e8511a5))
* **lang:** Update Polish ([#4686](https://github.com/videojs/video.js/issues/4686)) ([ee2a49c](https://github.com/videojs/video.js/commit/ee2a49c))
* **package:** update babelify to version 8.0.0 ([#4684](https://github.com/videojs/video.js/issues/4684)) ([db2f14c](https://github.com/videojs/video.js/commit/db2f14c))
* add comment about avoiding helvetica font ([#4679](https://github.com/videojs/video.js/issues/4679)) ([cb638d0](https://github.com/videojs/video.js/commit/cb638d0))
* add GA note to primary readme ([#4481](https://github.com/videojs/video.js/issues/4481)) ([e2af322](https://github.com/videojs/video.js/commit/e2af322))
* Add package-lock.json file. ([#4641](https://github.com/videojs/video.js/issues/4641)) ([ec5b603](https://github.com/videojs/video.js/commit/ec5b603))

### Code Refactoring

* component.ready() ([#4693](https://github.com/videojs/video.js/issues/4693)) ([b40858b](https://github.com/videojs/video.js/commit/b40858b))
* player.dimension() ([#4704](https://github.com/videojs/video.js/issues/4704)) ([ad1b47b](https://github.com/videojs/video.js/commit/ad1b47b))
* player.hasStarted() ([#4680](https://github.com/videojs/video.js/issues/4680)) ([cde8335](https://github.com/videojs/video.js/commit/cde8335))
* player.techGet_() ([#4687](https://github.com/videojs/video.js/issues/4687)) ([a1748aa](https://github.com/videojs/video.js/commit/a1748aa))

### Documentation

* **lang:** update translations needed doc ([#4702](https://github.com/videojs/video.js/issues/4702)) ([93e7670](https://github.com/videojs/video.js/commit/93e7670))

### Tests

* fix modal dialog test for showing controls ([#4707](https://github.com/videojs/video.js/issues/4707)) ([45a6b30](https://github.com/videojs/video.js/commit/45a6b30)), closes [#4706](https://github.com/videojs/video.js/issues/4706)
* get rid of redundant test logging ([#4682](https://github.com/videojs/video.js/issues/4682)) ([983a573](https://github.com/videojs/video.js/commit/983a573))

<a name="6.3.3"></a>
## [6.3.3](https://github.com/videojs/video.js/compare/v6.3.2...v6.3.3) (2017-10-10)

### Bug Fixes

* a possible breaking change caused by the use of remainingTimeDisplay ([#4655](https://github.com/videojs/video.js/issues/4655)) ([b1de506](https://github.com/videojs/video.js/commit/b1de506))

### Documentation

* **hooks:** Fix Typo ([#4652](https://github.com/videojs/video.js/issues/4652)) ([6738f76](https://github.com/videojs/video.js/commit/6738f76))

<a name="6.3.2"></a>
## [6.3.2](https://github.com/videojs/video.js/compare/v6.3.1...v6.3.2) (2017-10-04)

### Bug Fixes

* Fix a typo in current time display component. ([#4647](https://github.com/videojs/video.js/issues/4647)) ([4658c7b](https://github.com/videojs/video.js/commit/4658c7b))

### Documentation

* Document how to add a version number to a plugin ([#4642](https://github.com/videojs/video.js/issues/4642)) ([85a34d1](https://github.com/videojs/video.js/commit/85a34d1))

<a name="6.3.1"></a>
## [6.3.1](https://github.com/videojs/video.js/compare/v6.3.0...v6.3.1) (2017-10-03)

### Bug Fixes

* Make sure time displays use correctly-formatted time. ([#4643](https://github.com/videojs/video.js/issues/4643)) ([20f7fe9](https://github.com/videojs/video.js/commit/20f7fe9))

<a name="6.3.0"></a>
# [6.3.0](https://github.com/videojs/video.js/compare/v6.2.8...v6.3.0) (2017-10-03)

### Features

* Add remainingTimeDisplay method to Player ([#4620](https://github.com/videojs/video.js/issues/4620)) ([445eb26](https://github.com/videojs/video.js/commit/445eb26))
* display currentTime as duration and remainingTime as 0 on ended ([#4634](https://github.com/videojs/video.js/issues/4634)) ([f51d36b](https://github.com/videojs/video.js/commit/f51d36b))
* Do not set focus in sub-menus to prevent undesirable scrolling behavior in iOS ([#4607](https://github.com/videojs/video.js/issues/4607)) ([1ac8065](https://github.com/videojs/video.js/commit/1ac8065))

### Bug Fixes

* reset to a play/pause button when seeking after ended ([#4614](https://github.com/videojs/video.js/issues/4614)) ([335bcde](https://github.com/videojs/video.js/commit/335bcde))

### Chores

* alias rollup-dev to watch for development ([#4615](https://github.com/videojs/video.js/issues/4615)) ([edde614](https://github.com/videojs/video.js/commit/edde614))
* **lang:** Update Dutch ([#4588](https://github.com/videojs/video.js/issues/4588)) ([5ca0992](https://github.com/videojs/video.js/commit/5ca0992))
* **lang:** Update Vietnamese ([#4625](https://github.com/videojs/video.js/issues/4625)) ([ac58dbf](https://github.com/videojs/video.js/commit/ac58dbf))
* **package:** update grunt-browserify to version 5.2.0 ([#4578](https://github.com/videojs/video.js/issues/4578)) ([6cd785a](https://github.com/videojs/video.js/commit/6cd785a))
* **package:** update remark-validate-links to version 7.0.0 ([#4585](https://github.com/videojs/video.js/issues/4585)) ([7929677](https://github.com/videojs/video.js/commit/7929677))

### Code Refactoring

* Create a base time display class, and use it ([#4633](https://github.com/videojs/video.js/issues/4633)) ([fa6f884](https://github.com/videojs/video.js/commit/fa6f884))

### Documentation

* Document playbackRates ([#4602](https://github.com/videojs/video.js/issues/4602)) ([9d249bb](https://github.com/videojs/video.js/commit/9d249bb))
* update player reference in advanced plugins doc ([#4622](https://github.com/videojs/video.js/issues/4622)) ([d8ea23e](https://github.com/videojs/video.js/commit/d8ea23e))

<a name="6.2.8"></a>
## [6.2.8](https://github.com/videojs/video.js/compare/v6.2.7...v6.2.8) (2017-09-01)

### Bug Fixes

* rely on browser or tech to handle autoplay ([#4582](https://github.com/videojs/video.js/issues/4582)) ([95c4ae0](https://github.com/videojs/video.js/commit/95c4ae0))
* **package:** remove pkg.module ([#4594](https://github.com/videojs/video.js/issues/4594)) ([5e23048](https://github.com/videojs/video.js/commit/5e23048)), closes [#4580](https://github.com/videojs/video.js/issues/4580)

### Documentation

* **COLLABORATOR_GUIDE:** how to release Video.js ([#4586](https://github.com/videojs/video.js/issues/4586)) ([9588602](https://github.com/videojs/video.js/commit/9588602))
* update to width and height doc comments ([#4592](https://github.com/videojs/video.js/issues/4592)) ([006fb3b](https://github.com/videojs/video.js/commit/006fb3b))

<a name="6.2.7"></a>
## [6.2.7](https://github.com/videojs/video.js/compare/v6.2.6...v6.2.7) (2017-08-24)

### Bug Fixes

* use typeof for checking preload option ([#4574](https://github.com/videojs/video.js/issues/4574)) ([fe63992](https://github.com/videojs/video.js/commit/fe63992))

### Chores

* **package:** update rollup to version 0.47.5 ([#4572](https://github.com/videojs/video.js/issues/4572)) ([7b251d0](https://github.com/videojs/video.js/commit/7b251d0))

<a name="6.2.6"></a>
## [6.2.6](https://github.com/videojs/video.js/compare/v6.2.5...v6.2.6) (2017-08-16)

### Bug Fixes

* make boolean attributes set and check both the associated property and the attribute ([#4562](https://github.com/videojs/video.js/issues/4562)) ([d668c49](https://github.com/videojs/video.js/commit/d668c49)), closes [#4351](https://github.com/videojs/video.js/issues/4351)
* playback rate default text ([#4558](https://github.com/videojs/video.js/issues/4558)) ([a6b8425](https://github.com/videojs/video.js/commit/a6b8425))
* remove 'use strict' from rollup because vttjs isn't strict ([#4551](https://github.com/videojs/video.js/issues/4551)) ([db55bbd](https://github.com/videojs/video.js/commit/db55bbd))
* set width and height for vjs-button like the SubsCaps button ([#4548](https://github.com/videojs/video.js/issues/4548)) ([cd2f510](https://github.com/videojs/video.js/commit/cd2f510)), closes [#4547](https://github.com/videojs/video.js/issues/4547)
* **lang:** typos in ar.json ([#4528](https://github.com/videojs/video.js/issues/4528)) ([3e63bf3](https://github.com/videojs/video.js/commit/3e63bf3))

### Chores

* improve dev and beginner experience ([#4555](https://github.com/videojs/video.js/issues/4555)) ([19ebc0d](https://github.com/videojs/video.js/commit/19ebc0d))
* **package:** update grunt-babel to version 7.0.0 ([#4553](https://github.com/videojs/video.js/issues/4553)) ([f6f9998](https://github.com/videojs/video.js/commit/f6f9998))
* **package:** update grunt-browserify to version 5.1.0 ([#4565](https://github.com/videojs/video.js/issues/4565)) ([8c21f0a](https://github.com/videojs/video.js/commit/8c21f0a))
* **package:** update klaw-sync to version 3.0.0 ([#4544](https://github.com/videojs/video.js/issues/4544)) ([6233d14](https://github.com/videojs/video.js/commit/6233d14))
* **package:** update rollup to version 0.47.4 ([#4570](https://github.com/videojs/video.js/issues/4570)) ([d7f7e05](https://github.com/videojs/video.js/commit/d7f7e05)), closes [#4561](https://github.com/videojs/video.js/issues/4561)

### Documentation

* updates to faq, language guide, and minor edits ([#4556](https://github.com/videojs/video.js/issues/4556)) ([1f3375e](https://github.com/videojs/video.js/commit/1f3375e))

<a name="6.2.5"></a>
## [6.2.5](https://github.com/videojs/video.js/compare/v6.2.4...v6.2.5) (2017-07-26)

### Bug Fixes

* only change focus from BPB if not a mouse click ([#4497](https://github.com/videojs/video.js/issues/4497)) ([ee014e2](https://github.com/videojs/video.js/commit/ee014e2))

### Chores

* **greenkeeper:** ignore webpack and uglify ([#4518](https://github.com/videojs/video.js/issues/4518)) ([fe95a77](https://github.com/videojs/video.js/commit/fe95a77))
* **package:** update remark-cli to version 4.0.0 ([#4508](https://github.com/videojs/video.js/issues/4508)) ([7c80e13](https://github.com/videojs/video.js/commit/7c80e13))
* **package:** update remark-parse to version 4.0.0 ([#4507](https://github.com/videojs/video.js/issues/4507)) ([abb5d67](https://github.com/videojs/video.js/commit/abb5d67))
* **package:** update remark-stringify to version 4.0.0 ([#4506](https://github.com/videojs/video.js/issues/4506)) ([bbd92ab](https://github.com/videojs/video.js/commit/bbd92ab))

<a name="6.2.4"></a>
## [6.2.4](https://github.com/videojs/video.js/compare/v6.2.3...v6.2.4) (2017-07-14)

### Chores

* fix gh-release minimist call ([#4489](https://github.com/videojs/video.js/issues/4489)) ([07594bc](https://github.com/videojs/video.js/commit/07594bc))

<a name="6.2.3"></a>
## [6.2.3](https://github.com/videojs/video.js/compare/v6.2.2...v6.2.3) (2017-07-14)

### Chores

* **gh-release:** add prerelease flag and find right zip  ([#4488](https://github.com/videojs/video.js/issues/4488)) ([b1ac2e0](https://github.com/videojs/video.js/commit/b1ac2e0))

<a name="6.2.2"></a>
## [6.2.2](https://github.com/videojs/video.js/compare/v6.2.1...v6.2.2) (2017-07-14)

### Bug Fixes

* **playback rate menu:** cycling rates via click ([#4486](https://github.com/videojs/video.js/issues/4486)) ([4f43616](https://github.com/videojs/video.js/commit/4f43616))

### Chores

* **build:** remove unused var in build/version.js ([#4458](https://github.com/videojs/video.js/issues/4458)) ([6986dbb](https://github.com/videojs/video.js/commit/6986dbb))
* add automatic github release ([#4466](https://github.com/videojs/video.js/issues/4466)) ([3a600d0](https://github.com/videojs/video.js/commit/3a600d0))
* switch to using chrome for testing PRs on travis ([#4462](https://github.com/videojs/video.js/issues/4462)) ([687aae5](https://github.com/videojs/video.js/commit/687aae5))
* **package:** update rollup to version 0.45.2 ([#4487](https://github.com/videojs/video.js/issues/4487)) ([971f633](https://github.com/videojs/video.js/commit/971f633)), closes [#4475](https://github.com/videojs/video.js/issues/4475)

### Documentation

* Fix Player#src API documentation. ([#4454](https://github.com/videojs/video.js/issues/4454)) ([7579fc1](https://github.com/videojs/video.js/commit/7579fc1))
* make jsdoc generate anchor names so ToC links work ([#4471](https://github.com/videojs/video.js/issues/4471)) ([03fd402](https://github.com/videojs/video.js/commit/03fd402))

### Tests

* add unit tests for player.duration() ([#4459](https://github.com/videojs/video.js/issues/4459)) ([1e80e59](https://github.com/videojs/video.js/commit/1e80e59))

<a name="6.2.1"></a>
## [6.2.1](https://github.com/videojs/video.js/compare/v6.2.0...v6.2.1) (2017-06-28)

### Bug Fixes

* auto-removal remote text tracks being removed when not supposed to ([#4450](https://github.com/videojs/video.js/issues/4450)) ([82c8b80](https://github.com/videojs/video.js/commit/82c8b80)), closes [#4403](https://github.com/videojs/video.js/issues/4403) [#4315](https://github.com/videojs/video.js/issues/4315)
* IE10 issue for disableOthers when property access results in "permission denied" ([#4395](https://github.com/videojs/video.js/issues/4395)) ([7f7ea70](https://github.com/videojs/video.js/commit/7f7ea70)), closes [#4378](https://github.com/videojs/video.js/issues/4378)
* player.duration() should return NaN if duration is not known ([#4443](https://github.com/videojs/video.js/issues/4443)) ([f5cc165](https://github.com/videojs/video.js/commit/f5cc165))
* Safari picture-in-picture triggers fullscreenchange ([#4437](https://github.com/videojs/video.js/issues/4437)) ([b636663](https://github.com/videojs/video.js/commit/b636663))
* Update translations to match correct string ([#4383](https://github.com/videojs/video.js/issues/4383)) ([e0824c8](https://github.com/videojs/video.js/commit/e0824c8))
* Use passive event listeners for touchstart/touchmove ([#4440](https://github.com/videojs/video.js/issues/4440)) ([b4dc4f8](https://github.com/videojs/video.js/commit/b4dc4f8)), closes [#4432](https://github.com/videojs/video.js/issues/4432)

### Chores

* **package:** update husky to version 0.14.1 ([#4444](https://github.com/videojs/video.js/issues/4444)) ([66a0d23](https://github.com/videojs/video.js/commit/66a0d23)), closes [#4436](https://github.com/videojs/video.js/issues/4436)
* **package:** update rollup to version 0.42.0 ([#4392](https://github.com/videojs/video.js/issues/4392)) ([f87b12c](https://github.com/videojs/video.js/commit/f87b12c))
* **package:** update rollup-watch to version 4.0.0 ([#4396](https://github.com/videojs/video.js/issues/4396)) ([4bce4a2](https://github.com/videojs/video.js/commit/4bce4a2))
* **sandbox:** Fix paths in sandbox files. ([#4416](https://github.com/videojs/video.js/issues/4416)) ([c4bbe5d](https://github.com/videojs/video.js/commit/c4bbe5d))

### Documentation

* Fix links in API docs for several Player events. ([#4427](https://github.com/videojs/video.js/issues/4427)) ([cc6e824](https://github.com/videojs/video.js/commit/cc6e824))
* Fixing player.remoteTextTracks jsdoc ([#4417](https://github.com/videojs/video.js/issues/4417)) ([9329e3e](https://github.com/videojs/video.js/commit/9329e3e))
* Update name of FullscreenToggle in documentation ([#4410](https://github.com/videojs/video.js/issues/4410)) ([9702155](https://github.com/videojs/video.js/commit/9702155))

### Performance Improvements

* Various small performance improvements. ([#4426](https://github.com/videojs/video.js/issues/4426)) ([77ba3d1](https://github.com/videojs/video.js/commit/77ba3d1))

<a name="6.2.0"></a>
# [6.2.0](https://github.com/videojs/video.js/compare/v6.1.0...v6.2.0) (2017-05-30)

### Features

* Persist caption/description choice over source changes in emulated tracks ([#4295](https://github.com/videojs/video.js/issues/4295)) ([188ead1](https://github.com/videojs/video.js/commit/188ead1))
* **lang:** Adding galician ([#4334](https://github.com/videojs/video.js/issues/4334)) ([2a26c7f](https://github.com/videojs/video.js/commit/2a26c7f))
* **lang:** Create sk.json ([#4374](https://github.com/videojs/video.js/issues/4374)) ([e5e1c7f](https://github.com/videojs/video.js/commit/e5e1c7f))
* **lang:** Update zh-CN.json ([#4370](https://github.com/videojs/video.js/issues/4370)) ([0c16c5f](https://github.com/videojs/video.js/commit/0c16c5f))
* Use Rollup to generate dist files ([#4301](https://github.com/videojs/video.js/issues/4301)) ([c31836c](https://github.com/videojs/video.js/commit/c31836c))

### Chores

* **package:** update grunt-contrib-cssmin to version 2.2.0 ([#4345](https://github.com/videojs/video.js/issues/4345)) ([d57f09f](https://github.com/videojs/video.js/commit/d57f09f))
* **package:** update videojs-flash to version 2.0.0 ([#4375](https://github.com/videojs/video.js/issues/4375)) ([9816070](https://github.com/videojs/video.js/commit/9816070))
* update translations needed ([#4380](https://github.com/videojs/video.js/issues/4380)) ([a5a68e8](https://github.com/videojs/video.js/commit/a5a68e8))

### Tests

* **TextTrackDisplay:** Removing incorrect test techOrder ([#4379](https://github.com/videojs/video.js/issues/4379)) ([eade52e](https://github.com/videojs/video.js/commit/eade52e))

<a name="6.1.0"></a>
# [6.1.0](https://github.com/videojs/video.js/compare/v6.0.1...v6.1.0) (2017-05-15)

### Features

* Add 'beforepluginsetup' event and named plugin setup events (e.g. 'pluginsetup:foo') ([#4255](https://github.com/videojs/video.js/issues/4255)) ([0a19cf0](https://github.com/videojs/video.js/commit/0a19cf0))
* add 'playsinline' player option ([#4348](https://github.com/videojs/video.js/issues/4348)) ([8d80a58](https://github.com/videojs/video.js/commit/8d80a58))
* Add a version class to the player ([#4320](https://github.com/videojs/video.js/issues/4320)) ([ae423df](https://github.com/videojs/video.js/commit/ae423df))
* Add getVideoPlaybackQuality API ([#4338](https://github.com/videojs/video.js/issues/4338)) ([483e5a2](https://github.com/videojs/video.js/commit/483e5a2))
* deprecate firstplay event ([#4353](https://github.com/videojs/video.js/issues/4353)) ([35df351](https://github.com/videojs/video.js/commit/35df351))
* remove playbackRate blacklist for recent Android Chrome ([#4321](https://github.com/videojs/video.js/issues/4321)) ([da0f1ee](https://github.com/videojs/video.js/commit/da0f1ee))

### Bug Fixes

* **package:** update global to version 4.3.2 ([#4291](https://github.com/videojs/video.js/issues/4291)) ([b5c60f3](https://github.com/videojs/video.js/commit/b5c60f3))
* only disable user-selection on sliders ([#4354](https://github.com/videojs/video.js/issues/4354)) ([cb6005e](https://github.com/videojs/video.js/commit/cb6005e))
* Only update text track mode if changed ([#4298](https://github.com/videojs/video.js/issues/4298)) ([3087830](https://github.com/videojs/video.js/commit/3087830))
* prevent dupe events on enabled ClickableComponents ([#4316](https://github.com/videojs/video.js/issues/4316)) ([03bab83](https://github.com/videojs/video.js/commit/03bab83)), closes [#4312](https://github.com/videojs/video.js/issues/4312)
* TextTrackButton on Safari and iOS ([#4350](https://github.com/videojs/video.js/issues/4350)) ([3dcfa95](https://github.com/videojs/video.js/commit/3dcfa95))

### Chores

* Fix examples and docs and some links ([#4279](https://github.com/videojs/video.js/issues/4279)) ([f773c47](https://github.com/videojs/video.js/commit/f773c47))
* typo soruce -> source ([#4307](https://github.com/videojs/video.js/issues/4307)) ([da1d861](https://github.com/videojs/video.js/commit/da1d861))

### Documentation

* **react-guide:** Use a React component as a VJS component ([#4287](https://github.com/videojs/video.js/issues/4287)) ([cff2e50](https://github.com/videojs/video.js/commit/cff2e50))

<a name="6.0.1"></a>
## [6.0.1](https://github.com/videojs/video.js/compare/v6.0.0...v6.0.1) (2017-04-13)

### Bug Fixes

* set IE_VERSION correctly for IE11 ([#4281](https://github.com/videojs/video.js/issues/4281)) ([1ea0041](https://github.com/videojs/video.js/commit/1ea0041)), closes [#4278](https://github.com/videojs/video.js/issues/4278)
* techOrder names can be camelCased. ([#4277](https://github.com/videojs/video.js/issues/4277)) ([92e5d9f](https://github.com/videojs/video.js/commit/92e5d9f))

### Chores

* **changelog:** Update CHANGELOG with v5 changes ([#4257](https://github.com/videojs/video.js/issues/4257)) ([c20ca5c](https://github.com/videojs/video.js/commit/c20ca5c))
* add slack travis notifications ([#4282](https://github.com/videojs/video.js/issues/4282)) ([7490a49](https://github.com/videojs/video.js/commit/7490a49))
* gitignore all npm-debug.log.* ([#4252](https://github.com/videojs/video.js/issues/4252)) ([083f643](https://github.com/videojs/video.js/commit/083f643))

### Documentation

* **component:** Replace VolumeMenuButton with VolumePanel in component tree ([#4267](https://github.com/videojs/video.js/issues/4267)) ([02721c7](https://github.com/videojs/video.js/commit/02721c7)), closes [#4266](https://github.com/videojs/video.js/issues/4266)
* add a Webpack usage guide ([#4261](https://github.com/videojs/video.js/issues/4261)) ([230743e](https://github.com/videojs/video.js/commit/230743e))
* remove mentions of bower support ([#4274](https://github.com/videojs/video.js/issues/4274)) ([39fd73f](https://github.com/videojs/video.js/commit/39fd73f))

<a name="6.0.0"></a>
# [6.0.0](https://github.com/videojs/video.js/compare/v5.16.0...v6.0.0) (2017-04-03)

### Features

* `videojs.getTech` works with `TitleCase` or `camelCase` names ([#4010](https://github.com/videojs/video.js/issues/4010)) ([a8f2e43](https://github.com/videojs/video.js/commit/a8f2e43)), closes [#3986](https://github.com/videojs/video.js/issues/3986)
* add a controlText function to MenuButton ([#4125](https://github.com/videojs/video.js/issues/4125)) ([4388bea](https://github.com/videojs/video.js/commit/4388bea))
* Advanced Class-based Plugins for 6.0 ([#3690](https://github.com/videojs/video.js/issues/3690)) ([8d1653a](https://github.com/videojs/video.js/commit/8d1653a))
* allow seeking in full height of progress control ([#4004](https://github.com/videojs/video.js/issues/4004)) ([29c6141](https://github.com/videojs/video.js/commit/29c6141))
* allow tokens in localize, localize progress bar time ([#4060](https://github.com/videojs/video.js/issues/4060)) ([db01120](https://github.com/videojs/video.js/commit/db01120)), closes [#4024](https://github.com/videojs/video.js/issues/4024)
* Combine captions and subtitles tracks control ([#4028](https://github.com/videojs/video.js/issues/4028)) ([74eb5d4](https://github.com/videojs/video.js/commit/74eb5d4))
* don't throw when re-registering a plugin unless it's a player method ([#4140](https://github.com/videojs/video.js/issues/4140)) ([326398d](https://github.com/videojs/video.js/commit/326398d))
* Expose Tech#resize event as Player#resize ([#3979](https://github.com/videojs/video.js/issues/3979)) ([e176b56](https://github.com/videojs/video.js/commit/e176b56))
* **lang:** Update tr.json ([#3989](https://github.com/videojs/video.js/issues/3989)) ([37a6811](https://github.com/videojs/video.js/commit/37a6811))
* fix accessibility of the captions setting dialog ([#4050](https://github.com/videojs/video.js/issues/4050)) ([0d0dea4](https://github.com/videojs/video.js/commit/0d0dea4)), closes [#2746](https://github.com/videojs/video.js/issues/2746) [#2746](https://github.com/videojs/video.js/issues/2746)
* localize all strings in captions settings ([#3974](https://github.com/videojs/video.js/issues/3974)) ([8e7d8cc](https://github.com/videojs/video.js/commit/8e7d8cc))
* Log Levels ([#3853](https://github.com/videojs/video.js/issues/3853)) ([844e4f0](https://github.com/videojs/video.js/commit/844e4f0))
* make `registerTech` add that tech to the default `techOrder` ([#3985](https://github.com/videojs/video.js/issues/3985)) ([c2545dd](https://github.com/videojs/video.js/commit/c2545dd))
* Make pause on open optional for ModalDialog via options ([#4186](https://github.com/videojs/video.js/issues/4186)) ([90030d5](https://github.com/videojs/video.js/commit/90030d5))
* **lang:** update Vietnamese lang file ([#3964](https://github.com/videojs/video.js/issues/3964)) ([1463e50](https://github.com/videojs/video.js/commit/1463e50))
* Make text tracks settings more responsive ([#4236](https://github.com/videojs/video.js/issues/4236)) ([9274457](https://github.com/videojs/video.js/commit/9274457))
* middleware ([#3788](https://github.com/videojs/video.js/issues/3788)) ([34aab3f](https://github.com/videojs/video.js/commit/34aab3f))
* modal dialog accessibility updates ([#4025](https://github.com/videojs/video.js/issues/4025)) ([eddc1d7](https://github.com/videojs/video.js/commit/eddc1d7))
* remove flash tech ([#3956](https://github.com/videojs/video.js/issues/3956)) ([b387437](https://github.com/videojs/video.js/commit/b387437))
* Replay at ended ([#3868](https://github.com/videojs/video.js/issues/3868)) ([ce6acc8](https://github.com/videojs/video.js/commit/ce6acc8))
* Restore all outlines for greater accessibility ([#3829](https://github.com/videojs/video.js/issues/3829)) ([29ffbfb](https://github.com/videojs/video.js/commit/29ffbfb))
* Return the native Promise from play() ([#3907](https://github.com/videojs/video.js/issues/3907)) ([091bdf9](https://github.com/videojs/video.js/commit/091bdf9))
* Stateful Components ([#3960](https://github.com/videojs/video.js/issues/3960)) ([d7d7cfe](https://github.com/videojs/video.js/commit/d7d7cfe))
* Time Tooltips ([#3836](https://github.com/videojs/video.js/issues/3836)) ([1ba1f5a](https://github.com/videojs/video.js/commit/1ba1f5a))
* time tooltips will not be added to a player on mobile devices ([#4185](https://github.com/videojs/video.js/issues/4185)) ([d79b8a7](https://github.com/videojs/video.js/commit/d79b8a7))
* toggle playback with space when focused on seekbar ([#4005](https://github.com/videojs/video.js/issues/4005)) ([516c9f9](https://github.com/videojs/video.js/commit/516c9f9))
* unmute goes back to previously selected volume ([#3942](https://github.com/videojs/video.js/issues/3942)) ([cb42fcf](https://github.com/videojs/video.js/commit/cb42fcf)), closes [#3909](https://github.com/videojs/video.js/issues/3909)
* Update MW to require a factory, add *-mw ([#3969](https://github.com/videojs/video.js/issues/3969)) ([0352916](https://github.com/videojs/video.js/commit/0352916))
* update videojs-vtt.js and wrap native cues in TextTrack ([#4115](https://github.com/videojs/video.js/issues/4115)) ([96a387f](https://github.com/videojs/video.js/commit/96a387f)), closes [#4093](https://github.com/videojs/video.js/issues/4093)
* wrap menu item text in a span ([#4026](https://github.com/videojs/video.js/issues/4026)) ([5748c36](https://github.com/videojs/video.js/commit/5748c36)), closes [#4017](https://github.com/videojs/video.js/issues/4017)
* **lang:** add European Portuguese translation ([#3955](https://github.com/videojs/video.js/issues/3955)) ([8888e2b](https://github.com/videojs/video.js/commit/8888e2b))
* **lang:** DE and FR translations of replay ([#3963](https://github.com/videojs/video.js/issues/3963)) ([a0ba8e2](https://github.com/videojs/video.js/commit/a0ba8e2))
* **lang:** French translation update ([#4118](https://github.com/videojs/video.js/issues/4118)) ([8c1302e](https://github.com/videojs/video.js/commit/8c1302e))
* **lang:** update es.json ([#3984](https://github.com/videojs/video.js/issues/3984)) ([70d2eb1](https://github.com/videojs/video.js/commit/70d2eb1))
* **player:** add played(), defaultMuted(), defaultPlaybackRate() ([#3845](https://github.com/videojs/video.js/issues/3845)) ([2037e18](https://github.com/videojs/video.js/commit/2037e18)), closes [#523](https://github.com/videojs/video.js/issues/523)
* **volume panel:** accessibly volume control ([#3957](https://github.com/videojs/video.js/issues/3957)) ([524f868](https://github.com/videojs/video.js/commit/524f868))

### Bug Fixes

* accessibility bugs with the VolumeBar ([#4023](https://github.com/videojs/video.js/issues/4023)) ([da2a1e0](https://github.com/videojs/video.js/commit/da2a1e0)), closes [#4021](https://github.com/videojs/video.js/issues/4021) [#4022](https://github.com/videojs/video.js/issues/4022)
* add buildWrapperCSSClass methods to all menu buttons ([#4147](https://github.com/videojs/video.js/issues/4147)) ([61d427c](https://github.com/videojs/video.js/commit/61d427c))
* Add lang attribute to player el, so that css :lang() is correct ([#4046](https://github.com/videojs/video.js/issues/4046)) ([17143fd](https://github.com/videojs/video.js/commit/17143fd))
* addChild instance names should be toTitleCased ([#4116](https://github.com/videojs/video.js/issues/4116)) ([576ac19](https://github.com/videojs/video.js/commit/576ac19))
* allow changing volume in full height of volume control ([#3987](https://github.com/videojs/video.js/issues/3987)) ([f87ada1](https://github.com/videojs/video.js/commit/f87ada1))
* copy basic plugin properties onto the wrapper ([#4100](https://github.com/videojs/video.js/issues/4100)) ([127cd78](https://github.com/videojs/video.js/commit/127cd78))
* cues at startTime 0 do not fire ([#4152](https://github.com/videojs/video.js/issues/4152)) ([a2b1a33](https://github.com/videojs/video.js/commit/a2b1a33))
* Disable all time tooltips in IE8, as they are broken ([#4029](https://github.com/videojs/video.js/issues/4029)) ([60bcc99](https://github.com/videojs/video.js/commit/60bcc99))
* disable title attribute on menu items ([#4019](https://github.com/videojs/video.js/issues/4019)) ([04f23c1](https://github.com/videojs/video.js/commit/04f23c1)), closes [#3699](https://github.com/videojs/video.js/issues/3699)
* Do not create element for MediaLoader ([#4097](https://github.com/videojs/video.js/issues/4097)) ([1cb0a97](https://github.com/videojs/video.js/commit/1cb0a97))
* early play should wait for player ready, even if source is available ([#4134](https://github.com/videojs/video.js/issues/4134)) ([3bbf019](https://github.com/videojs/video.js/commit/3bbf019)), closes [#4057](https://github.com/videojs/video.js/issues/4057)
* EventTarget is also evented ([#3990](https://github.com/videojs/video.js/issues/3990)) ([e34335b](https://github.com/videojs/video.js/commit/e34335b))
* fix the structure of elements in menus to comply with ARIA requirements ([#4034](https://github.com/videojs/video.js/issues/4034)) ([1b1ba04](https://github.com/videojs/video.js/commit/1b1ba04))
* focus play toggle from Big Play Btn on play ([#4018](https://github.com/videojs/video.js/issues/4018)) ([4f79e1e](https://github.com/videojs/video.js/commit/4f79e1e)), closes [#2729](https://github.com/videojs/video.js/issues/2729)
* hide font-icons from assitive technology ([#4006](https://github.com/videojs/video.js/issues/4006)) ([24d2e7b](https://github.com/videojs/video.js/commit/24d2e7b)), closes [#3982](https://github.com/videojs/video.js/issues/3982)
* improve French translation ([#4062](https://github.com/videojs/video.js/issues/4062)) ([dc4c1eb](https://github.com/videojs/video.js/commit/dc4c1eb))
* keep minimum volume after unmuting above 0.1 ([#4227](https://github.com/videojs/video.js/issues/4227)) ([16c1e0a](https://github.com/videojs/video.js/commit/16c1e0a)), closes [#4054](https://github.com/videojs/video.js/issues/4054)
* localize aria-labels ([#4027](https://github.com/videojs/video.js/issues/4027)) ([0ac1269](https://github.com/videojs/video.js/commit/0ac1269)), closes [#2728](https://github.com/videojs/video.js/issues/2728)
* Make `Player#techCall_()` synchronous again ([#3988](https://github.com/videojs/video.js/issues/3988)) ([3585af0](https://github.com/videojs/video.js/commit/3585af0))
* make load progress buffered regions height 100% ([#4190](https://github.com/videojs/video.js/issues/4190)) ([424fa51](https://github.com/videojs/video.js/commit/424fa51))
* make mergeOptions behave the same across browsers ([#4088](https://github.com/videojs/video.js/issues/4088)) ([0da9324](https://github.com/videojs/video.js/commit/0da9324))
* make sure audio track hides with one item ([#4202](https://github.com/videojs/video.js/issues/4202)) ([0fd7aad](https://github.com/videojs/video.js/commit/0fd7aad))
* Muting with `MuteToggle` sets ARIA value of `VolumeBar` to 0 ([#4099](https://github.com/videojs/video.js/issues/4099)) ([181a19f](https://github.com/videojs/video.js/commit/181a19f)), closes [#4064](https://github.com/videojs/video.js/issues/4064)
* not showing default text tracks over video ([#4216](https://github.com/videojs/video.js/issues/4216)) ([dbfba28](https://github.com/videojs/video.js/commit/dbfba28))
* Patch a memory leak caused by un-removed track listener(s). ([#3976](https://github.com/videojs/video.js/issues/3976)) ([4979ea7](https://github.com/videojs/video.js/commit/4979ea7))
* Progress holder gaps cause tooltips misalignment and time tooltip outlines ([#4031](https://github.com/videojs/video.js/issues/4031)) ([be27f2a](https://github.com/videojs/video.js/commit/be27f2a)), closes [#3645](https://github.com/videojs/video.js/issues/3645)
* remaining time display width on IE8 and IE9 ([#3983](https://github.com/videojs/video.js/issues/3983)) ([866a3f3](https://github.com/videojs/video.js/commit/866a3f3))
* **MenuButton:** Unify behavior of showing/hiding ([#4157](https://github.com/videojs/video.js/issues/4157)) ([c611f9f](https://github.com/videojs/video.js/commit/c611f9f))
* remove focus ring from player itself ([#4237](https://github.com/videojs/video.js/issues/4237)) ([e98c65d](https://github.com/videojs/video.js/commit/e98c65d))
* **audio-tracks-button:** add wrapper CSS builder to audio tracks menu button ([#4163](https://github.com/videojs/video.js/issues/4163)) ([d9ec7bc](https://github.com/videojs/video.js/commit/d9ec7bc))
* **cues:** only copy cue props that don't exist ([#4145](https://github.com/videojs/video.js/issues/4145)) ([0f57341](https://github.com/videojs/video.js/commit/0f57341))
* **dom:** getBoundingClientRect check that el is defined ([#4139](https://github.com/videojs/video.js/issues/4139)) ([fb88ae2](https://github.com/videojs/video.js/commit/fb88ae2))
* **icon-placeholder:** align icons on ie8 properly ([#4174](https://github.com/videojs/video.js/issues/4174)) ([1770f00](https://github.com/videojs/video.js/commit/1770f00))
* **ie8:** various minor ie8 fixes ([#4175](https://github.com/videojs/video.js/issues/4175)) ([cb890a9](https://github.com/videojs/video.js/commit/cb890a9))
* **package:** update xhr to version 2.4.0 ([#4101](https://github.com/videojs/video.js/issues/4101)) ([5265624](https://github.com/videojs/video.js/commit/5265624))
* **playback rate menu:** playback rate menu items should be selectable ([#4149](https://github.com/videojs/video.js/issues/4149)) ([a9f8fcb](https://github.com/videojs/video.js/commit/a9f8fcb))
* **sass:** import path has cwd once again ([#4061](https://github.com/videojs/video.js/issues/4061)) ([caff93f](https://github.com/videojs/video.js/commit/caff93f))
* **sass:** import path no longer has cwd ([#4001](https://github.com/videojs/video.js/issues/4001)) ([19b429b](https://github.com/videojs/video.js/commit/19b429b)), closes [#3998](https://github.com/videojs/video.js/issues/3998)
* **subs-caps-button:** add hide threshold to subs-caps button ([#4171](https://github.com/videojs/video.js/issues/4171)) ([88ee6af](https://github.com/videojs/video.js/commit/88ee6af))
* remove redundant Html5#play() ([405b29b](https://github.com/videojs/video.js/commit/405b29b))
* removeCue should work with native passed in cue ([#4208](https://github.com/videojs/video.js/issues/4208)) ([f2b5a05](https://github.com/videojs/video.js/commit/f2b5a05))
* Set MuteButton controlText correctly ([#4056](https://github.com/videojs/video.js/issues/4056)) ([3c1108c](https://github.com/videojs/video.js/commit/3c1108c))
* silence play promise error ([#4247](https://github.com/videojs/video.js/issues/4247)) ([0908d91](https://github.com/videojs/video.js/commit/0908d91))
* Solve a typo in translation files ([#4063](https://github.com/videojs/video.js/issues/4063)) ([5540868](https://github.com/videojs/video.js/commit/5540868))
* support empty src in `Player#src` ([#4030](https://github.com/videojs/video.js/issues/4030)) ([6541467](https://github.com/videojs/video.js/commit/6541467))
* synchronously shim vtt.js when possible ([#4083](https://github.com/videojs/video.js/issues/4083)) ([e1b4804](https://github.com/videojs/video.js/commit/e1b4804))
* trap tab focus in modal when hitting s-tab ([#4075](https://github.com/videojs/video.js/issues/4075)) ([1f7a842](https://github.com/videojs/video.js/commit/1f7a842)), closes [#4049](https://github.com/videojs/video.js/issues/4049)
* updating time tooltips when player not in DOM ([#3991](https://github.com/videojs/video.js/issues/3991)) ([22aade1](https://github.com/videojs/video.js/commit/22aade1))
* **subs-caps-button:** add wrapper CSS builder to subs caps button ([#4156](https://github.com/videojs/video.js/issues/4156)) ([e5af0a5](https://github.com/videojs/video.js/commit/e5af0a5))
* **subs-caps-button:** captions items should hide icon from SR ([#4158](https://github.com/videojs/video.js/issues/4158)) ([2ee133f](https://github.com/videojs/video.js/commit/2ee133f))
* **text track settings:** focus subs-caps button if exists over CC button ([#4155](https://github.com/videojs/video.js/issues/4155)) ([db901c5](https://github.com/videojs/video.js/commit/db901c5))
* **tracks:** allow forcing native text tracks on or off ([#4172](https://github.com/videojs/video.js/issues/4172)) ([67634cf](https://github.com/videojs/video.js/commit/67634cf))
* **vttjs:** wait till tech el in DOM before loading vttjs ([#4177](https://github.com/videojs/video.js/issues/4177)) ([ddde644](https://github.com/videojs/video.js/commit/ddde644))

### Chores

* 6.x build updates ([#4228](https://github.com/videojs/video.js/issues/4228)) ([6d876ee](https://github.com/videojs/video.js/commit/6d876ee))
* Add flash as a dev dependency for testing ([#4016](https://github.com/videojs/video.js/issues/4016)) ([4949619](https://github.com/videojs/video.js/commit/4949619))
* change accessibility test in grunt.js to remove unnecessary warning message. ([#4143](https://github.com/videojs/video.js/issues/4143)) ([dacf0ca](https://github.com/videojs/video.js/commit/dacf0ca))
* **package:** update remark-validate-links to version 6.0.0 ([#4128](https://github.com/videojs/video.js/issues/4128)) ([1395677](https://github.com/videojs/video.js/commit/1395677))
* ignore qunit and sinon from greenkeeper ([#4242](https://github.com/videojs/video.js/issues/4242)) ([29d733d](https://github.com/videojs/video.js/commit/29d733d))
* increase browserstack/karma timeouts, dispose player in tests ([#4135](https://github.com/videojs/video.js/issues/4135)) ([6874fa2](https://github.com/videojs/video.js/commit/6874fa2))
* only report errors during linting in the build process, not warnings ([#4041](https://github.com/videojs/video.js/issues/4041)) ([6208e4b](https://github.com/videojs/video.js/commit/6208e4b))
* remove bower.json ([#4238](https://github.com/videojs/video.js/issues/4238)) ([0d19a05](https://github.com/videojs/video.js/commit/0d19a05)), closes [#4012](https://github.com/videojs/video.js/issues/4012)
* **package:** update webpack to version 2.3.0 ([#4219](https://github.com/videojs/video.js/issues/4219)) ([0223057](https://github.com/videojs/video.js/commit/0223057))
* Remove component.json and remove references to it ([#3866](https://github.com/videojs/video.js/issues/3866)) ([0bba319](https://github.com/videojs/video.js/commit/0bba319))
* **docs:** Use Elephants Dream video files from CDN for docs/examples/elephantsdream/ ([#4181](https://github.com/videojs/video.js/issues/4181)) ([af1c6e3](https://github.com/videojs/video.js/commit/af1c6e3))
* **package:** pin karma to 1.3.0 ([#4002](https://github.com/videojs/video.js/issues/4002)) ([5b8b41e](https://github.com/videojs/video.js/commit/5b8b41e))
* **package:** update remark-cli to version 3.0.0 ([#4126](https://github.com/videojs/video.js/issues/4126)) ([dc9ed1c](https://github.com/videojs/video.js/commit/dc9ed1c))
* **package:** update remark-lint to version 6.0.0 ([#4129](https://github.com/videojs/video.js/issues/4129)) ([9ef2d07](https://github.com/videojs/video.js/commit/9ef2d07))
* **package:** update remark-toc to version 4.0.0 ([#4127](https://github.com/videojs/video.js/issues/4127)) ([d5a619d](https://github.com/videojs/video.js/commit/d5a619d))
* **package:** update uglify-js to version 2.8.8 ([#4170](https://github.com/videojs/video.js/issues/4170)) ([bf787bd](https://github.com/videojs/video.js/commit/bf787bd)), closes [#4138](https://github.com/videojs/video.js/issues/4138)
* **package:** update videojs-vtt.js to version 0.12.3 ([#4221](https://github.com/videojs/video.js/issues/4221)) ([7d12c9e](https://github.com/videojs/video.js/commit/7d12c9e))
* **package:** update xhr to version 2.3.3 ([#3914](https://github.com/videojs/video.js/issues/3914)) ([924fb27](https://github.com/videojs/video.js/commit/924fb27))
* switch from ghooks to husky ([#4074](https://github.com/videojs/video.js/issues/4074)) ([c3b1d68](https://github.com/videojs/video.js/commit/c3b1d68))
* **sandbox:** Fix poster image to match the video in the 'combined-tracks.html' example in sandbox ([#4164](https://github.com/videojs/video.js/issues/4164)) ([5ffe1cd](https://github.com/videojs/video.js/commit/5ffe1cd))
* **sandbox:** Use Elephants Dream video files from CDN for the sandbox/descriptions.html.example. ([#4137](https://github.com/videojs/video.js/issues/4137)) ([715f584](https://github.com/videojs/video.js/commit/715f584))
* **test:** silence plugin warning from test ([#4173](https://github.com/videojs/video.js/issues/4173)) ([05e6494](https://github.com/videojs/video.js/commit/05e6494))
* **tests:** make tests not print out errors ([#4141](https://github.com/videojs/video.js/issues/4141)) ([f95815b](https://github.com/videojs/video.js/commit/f95815b))

### Code Refactoring

* Buttons will always use a button element ([#3828](https://github.com/videojs/video.js/issues/3828)) ([c340dbc](https://github.com/videojs/video.js/commit/c340dbc))
* do not allow adding children with options passed in as a boolean ([#3872](https://github.com/videojs/video.js/issues/3872)) ([b07143d](https://github.com/videojs/video.js/commit/b07143d))
* Evented Components ([#3959](https://github.com/videojs/video.js/issues/3959)) ([4c3b60c](https://github.com/videojs/video.js/commit/4c3b60c))
* expose tech but warn without safety var ([#3916](https://github.com/videojs/video.js/issues/3916)) ([8622b26](https://github.com/videojs/video.js/commit/8622b26))
* Make registerComponent only work with Components ([#3802](https://github.com/videojs/video.js/issues/3802)) ([57af15c](https://github.com/videojs/video.js/commit/57af15c))
* move most volume panel functionality into css state ([#3981](https://github.com/videojs/video.js/issues/3981)) ([2e2ac6f](https://github.com/videojs/video.js/commit/2e2ac6f))
* MuteToggle#update ([#4058](https://github.com/videojs/video.js/issues/4058)) ([a04f387](https://github.com/videojs/video.js/commit/a04f387))
* Remove custom UMD ([#3826](https://github.com/videojs/video.js/issues/3826)) ([2014120](https://github.com/videojs/video.js/commit/2014120))
* Remove deprecated features of extend/Component#extend ([#3825](https://github.com/videojs/video.js/issues/3825)) ([f8aed4d](https://github.com/videojs/video.js/commit/f8aed4d))
* Remove method Chaining from videojs ([#3860](https://github.com/videojs/video.js/issues/3860)) ([8f07f5d](https://github.com/videojs/video.js/commit/8f07f5d))
* remove special loadstart handling ([#3906](https://github.com/videojs/video.js/issues/3906)) ([73b6316](https://github.com/videojs/video.js/commit/73b6316))
* Remove TimeRanges without an index deprecation warning ([#3827](https://github.com/videojs/video.js/issues/3827)) ([e12bedb](https://github.com/videojs/video.js/commit/e12bedb))
* Remove unused defaultVolume option default ([#3915](https://github.com/videojs/video.js/issues/3915)) ([5377ffc](https://github.com/videojs/video.js/commit/5377ffc))
* unify all Track and TrackList APIs ([#3783](https://github.com/videojs/video.js/issues/3783)) ([49bed07](https://github.com/videojs/video.js/commit/49bed07))

### Documentation

* Add MediaLoader to components list ([#4070](https://github.com/videojs/video.js/issues/4070)) ([65dc81a](https://github.com/videojs/video.js/commit/65dc81a))
* Expand testing info in `CONTRIBUTING.md` ([#4020](https://github.com/videojs/video.js/issues/4020)) ([2da4e76](https://github.com/videojs/video.js/commit/2da4e76))
* fix broken links to guides in the faq ([#3973](https://github.com/videojs/video.js/issues/3973)) ([58f2349](https://github.com/videojs/video.js/commit/58f2349))
* fix links in generated docs ([#4200](https://github.com/videojs/video.js/issues/4200)) ([61e2078](https://github.com/videojs/video.js/commit/61e2078))
* fixup global jsdoc members ([#4015](https://github.com/videojs/video.js/issues/4015)) ([6ad1e5c](https://github.com/videojs/video.js/commit/6ad1e5c))
* minor fix to currentTime() comment: "setting" not "getting" ([#3944](https://github.com/videojs/video.js/issues/3944)) ([6578ed9](https://github.com/videojs/video.js/commit/6578ed9))
* **coc:** introduce CODE_OF_CONDUCT.md ([#4160](https://github.com/videojs/video.js/issues/4160)) ([312b10c](https://github.com/videojs/video.js/commit/312b10c))
* ran `npm run docs:fix` to update TOC on guides ([#3971](https://github.com/videojs/video.js/issues/3971)) ([de3945d](https://github.com/videojs/video.js/commit/de3945d))
* **guide:** Add a `ModalDialog` guide ([#3961](https://github.com/videojs/video.js/issues/3961)) ([7b0d738](https://github.com/videojs/video.js/commit/7b0d738))
* **guides:** Add a basic ReactJS guide and update the FAQ ([#3972](https://github.com/videojs/video.js/issues/3972)) ([05b39fe](https://github.com/videojs/video.js/commit/05b39fe))
* replace 'autoPlay' by 'autoplay' ([#4080](https://github.com/videojs/video.js/issues/4080)) ([7ab52d1](https://github.com/videojs/video.js/commit/7ab52d1)), closes [#3995](https://github.com/videojs/video.js/issues/3995)
* tech order will only have html5 by default ([#4188](https://github.com/videojs/video.js/issues/4188)) ([41be5dc](https://github.com/videojs/video.js/commit/41be5dc))
* **guides:** fix typos in faq guide ([#4067](https://github.com/videojs/video.js/issues/4067)) ([2433915](https://github.com/videojs/video.js/commit/2433915))
* **guides:** fix typos in functions guide ([#4035](https://github.com/videojs/video.js/issues/4035)) ([0fc2c1c](https://github.com/videojs/video.js/commit/0fc2c1c))
* **jsdoc:** introduce a jsdoc template and build on publish ([#3910](https://github.com/videojs/video.js/issues/3910)) ([e642295](https://github.com/videojs/video.js/commit/e642295))

### Tests

* **ie8:** only run mute toggle tests in html5 env ([#4003](https://github.com/videojs/video.js/issues/4003)) ([5bde16a](https://github.com/videojs/video.js/commit/5bde16a))
* add tests for obj.assign util ([#4014](https://github.com/videojs/video.js/issues/4014)) ([fcb5aa8](https://github.com/videojs/video.js/commit/fcb5aa8))
* fix IE9 rounding issue with lastvolume test ([#4230](https://github.com/videojs/video.js/issues/4230)) ([46dd0aa](https://github.com/videojs/video.js/commit/46dd0aa))
* fix tests ([#3953](https://github.com/videojs/video.js/issues/3953)) ([7bafcc2](https://github.com/videojs/video.js/commit/7bafcc2))


### BREAKING CHANGES

* setting the source is now asynchronous. `sourceOrder` option removed and made the default.
* remove deprecated features.
* **volume panel:** remove VolumeMenuButton, introduce a new default volume control: VolumePanel.
* removal of `keepTooltipsInside` option.
* some externally accessibly functions for tracks are now private.
* player methods no longer return a player instance when called. Fixes #3704.
* removal of component.json
* remove flash tech from core.
* restoring the outlines changes the skin slightly and potentially break users. Fixes #3200.
* registerComponent now throws if no name or not a component is passed in.
* remove the double loadstart handlers that dispose the tech/source handlers if a secondary loadstart event is heard.
* remove ability to add children with options as a boolean.
* removing ability to use TimeRange methods without an index.
* button component will always use a button element.
* `play()` no longer returns the player object but instead the native Promise or nothing.

<a name="5.19.1"></a>
## [5.19.1](https://github.com/videojs/video.js/compare/v5.19.0...v5.19.1) (2017-03-27)

### Bug Fixes

* not showing default text tracks over video ([#4217](https://github.com/videojs/video.js/issues/4217)) ([4653922](https://github.com/videojs/video.js/commit/4653922))
* removeCue should work with native passed in cue ([#4209](https://github.com/videojs/video.js/issues/4209)) ([3974944](https://github.com/videojs/video.js/commit/3974944))

### Chores

* **package:** update videojs-vtt.js to 0.12.3 ([#4223](https://github.com/videojs/video.js/issues/4223)) ([ad770fb](https://github.com/videojs/video.js/commit/ad770fb))

<a name="5.19.0"></a>
# [5.19.0](https://github.com/videojs/video.js/compare/v5.18.4...v5.19.0) (2017-03-15)

### Features

* Make pause on open optional for ModalDialog via options ([#4187](https://github.com/videojs/video.js/issues/4187)) ([4ec3b56](https://github.com/videojs/video.js/commit/4ec3b56))

### Bug Fixes

* make load progress buffered regions height 100% ([#4191](https://github.com/videojs/video.js/issues/4191)) ([398c6e9](https://github.com/videojs/video.js/commit/398c6e9))
* make sure audio track hides with one item ([#4203](https://github.com/videojs/video.js/issues/4203)) ([c069655](https://github.com/videojs/video.js/commit/c069655))

<a name="5.18.4"></a>
## [5.18.4](https://github.com/videojs/video.js/compare/v5.18.3...v5.18.4) (2017-03-08)

### Bug Fixes

* **vttjs:** wait till tech el in DOM before loading vttjs ([#4176](https://github.com/videojs/video.js/issues/4176)) ([ad86eec](https://github.com/videojs/video.js/commit/ad86eec))

<a name="5.18.3"></a>
## [5.18.3](https://github.com/videojs/video.js/compare/v5.18.2...v5.18.3) (2017-03-06)

<a name="5.18.1"></a>
## [5.18.1](https://github.com/videojs/video.js/compare/v5.18.0...v5.18.1) (2017-03-03)

### Bug Fixes

* **cues:** only copy cue props that don't exist ([#4146](https://github.com/videojs/video.js/issues/4146)) ([de08669](https://github.com/videojs/video.js/commit/de08669))
* cue-points with a startTime of 0 ([#4148](https://github.com/videojs/video.js/issues/4148)) ([e7d4b47](https://github.com/videojs/video.js/commit/e7d4b47))
* make sure that cues copy over their id ([#4154](https://github.com/videojs/video.js/issues/4154)) ([072c277](https://github.com/videojs/video.js/commit/072c277))
* **MenuButton:** Unify behavior of showing/hiding ([#3993](https://github.com/videojs/video.js/issues/3993)) ([4367c69](https://github.com/videojs/video.js/commit/4367c69))
* **playback rate menu:** playback rate menu items should be selectable ([#4150](https://github.com/videojs/video.js/issues/4150)) ([288edd1](https://github.com/videojs/video.js/commit/288edd1))

### Chores

* **build:** lint errors only and silence webpack ([#4153](https://github.com/videojs/video.js/issues/4153)) ([b1ca344](https://github.com/videojs/video.js/commit/b1ca344))
* **package:** update video-js-swf to 5.3.0 ([#4161](https://github.com/videojs/video.js/issues/4161)) ([2bcfe21](https://github.com/videojs/video.js/commit/2bcfe21))

<a name="5.18.0"></a>
# [5.18.0](https://github.com/videojs/video.js/compare/v5.17.0...v5.18.0) (2017-02-27)

### Features

* focus play toggle from Big Play Btn on play ([#4132](https://github.com/videojs/video.js/issues/4132)) ([dcc615a](https://github.com/videojs/video.js/commit/dcc615a)), closes [#2729](https://github.com/videojs/video.js/issues/2729)
* update videojs-vtt.js and wrap native cues in TextTrack ([#4131](https://github.com/videojs/video.js/issues/4131)) ([3d4aebc](https://github.com/videojs/video.js/commit/3d4aebc)), closes [#4093](https://github.com/videojs/video.js/issues/4093)

### Bug Fixes

* **sass:** import path has cwd once again ([#4076](https://github.com/videojs/video.js/issues/4076)) ([c02c6c6](https://github.com/videojs/video.js/commit/c02c6c6))
* addChild instance names should be toTitleCased ([#4117](https://github.com/videojs/video.js/issues/4117)) ([fa97309](https://github.com/videojs/video.js/commit/fa97309))
* make mergeOptions behave the same across browsers  ([#4090](https://github.com/videojs/video.js/issues/4090)) ([ce19ed5](https://github.com/videojs/video.js/commit/ce19ed5))
* synchronously shim vtt.js when possible ([#4082](https://github.com/videojs/video.js/issues/4082)) ([b5727a6](https://github.com/videojs/video.js/commit/b5727a6))

<a name="5.17.0"></a>
# [5.17.0](https://github.com/videojs/video.js/compare/v5.16.0...v5.17.0) (2017-02-07)

### Bug Fixes

* Patch a memory leak caused by un-removed track listener(s). ([#3975](https://github.com/videojs/video.js/issues/3975)) ([bca44c0](https://github.com/videojs/video.js/commit/bca44c0))
* remove title attribute on menu items, fixes [#3699](https://github.com/videojs/video.js/issues/3699) ([#4009](https://github.com/videojs/video.js/issues/4009)) ([91874a3](https://github.com/videojs/video.js/commit/91874a3))

### Chores

* change accessibility test in grunt.js to remove unnecessary warning message. ([#4008](https://github.com/videojs/video.js/issues/4008)) ([daad492](https://github.com/videojs/video.js/commit/daad492))
* **package:** update swf to 5.2.0 ([#4040](https://github.com/videojs/video.js/issues/4040)) ([dab893b](https://github.com/videojs/video.js/commit/dab893b))

### Documentation

* minor fix to currentTime() comment: "setting" not "getting" ([#3944](https://github.com/videojs/video.js/issues/3944)) ([6578ed9](https://github.com/videojs/video.js/commit/6578ed9))

<a name="5.16.0"></a>
# [5.16.0](https://github.com/videojs/video.js/compare/v5.15.1...v5.16.0) (2017-01-12)

### Features

* Show big play button on pause if specified ([#3892](https://github.com/videojs/video.js/issues/3892)) ([b547214](https://github.com/videojs/video.js/commit/b547214))

### Bug Fixes

* give techs a name ([#3934](https://github.com/videojs/video.js/issues/3934)) ([94fd5c1](https://github.com/videojs/video.js/commit/94fd5c1)), closes [#1786](https://github.com/videojs/video.js/issues/1786)
* Pause player before seeking in seek bar mousedown ([#3921](https://github.com/videojs/video.js/issues/3921)) ([2ceed0a](https://github.com/videojs/video.js/commit/2ceed0a)), closes [#3839](https://github.com/videojs/video.js/issues/3839) [#3886](https://github.com/videojs/video.js/issues/3886)
* player el ingest when parent doesn't have `hasAttribute` method ([#3929](https://github.com/videojs/video.js/issues/3929)) ([bbe8253](https://github.com/videojs/video.js/commit/bbe8253))
* showing custom poster with controls disabled ([#3933](https://github.com/videojs/video.js/issues/3933)) ([305e5ea](https://github.com/videojs/video.js/commit/305e5ea)), closes [#1625](https://github.com/videojs/video.js/issues/1625)

### Chores

* better dev experience ([#3896](https://github.com/videojs/video.js/issues/3896)) ([9ec5587](https://github.com/videojs/video.js/commit/9ec5587))
* don't run tests on travis if only docs were changed ([#3908](https://github.com/videojs/video.js/issues/3908)) ([c239bd5](https://github.com/videojs/video.js/commit/c239bd5))
* **development:** fix `npm start` file watching ([#3922](https://github.com/videojs/video.js/issues/3922)) ([02da697](https://github.com/videojs/video.js/commit/02da697))
* **release:** add es5 folder to the tagged commit ([#3913](https://github.com/videojs/video.js/issues/3913)) ([d120ea2](https://github.com/videojs/video.js/commit/d120ea2))
* **sass:** upgrade to latest version of grunt-sass ([#3897](https://github.com/videojs/video.js/issues/3897)) ([83d453b](https://github.com/videojs/video.js/commit/83d453b)), closes [#3692](https://github.com/videojs/video.js/issues/3692)
* fix typo in collaborator guide ([#3931](https://github.com/videojs/video.js/issues/3931)) ([f35de1c](https://github.com/videojs/video.js/commit/f35de1c))

### Code Refactoring

* require `videojs-vtt.js` via require rather than concat ([#3919](https://github.com/videojs/video.js/issues/3919)) ([d290db1](https://github.com/videojs/video.js/commit/d290db1))

### Documentation

* **faq:** add a question about autoplay ([#3898](https://github.com/videojs/video.js/issues/3898)) ([e5a240a](https://github.com/videojs/video.js/commit/e5a240a))
* **faq:** add FAQ question about RTMP url ([#3899](https://github.com/videojs/video.js/issues/3899)) ([9c74116](https://github.com/videojs/video.js/commit/9c74116))
* **troubleshooting:** updates to troubleshooting doc ([#3912](https://github.com/videojs/video.js/issues/3912)) ([0ce7cd4](https://github.com/videojs/video.js/commit/0ce7cd4))

<a name="5.15.1"></a>
## [5.15.1](https://github.com/videojs/video.js/compare/v5.15.0...v5.15.1) (2016-12-23)

### Bug Fixes

* extra warn logs on already initialized player references ([#3888](https://github.com/videojs/video.js/issues/3888)) ([b7c384e](https://github.com/videojs/video.js/commit/b7c384e))
* Support require()-ing video.js ([#3889](https://github.com/videojs/video.js/issues/3889)) ([ac0b03f](https://github.com/videojs/video.js/commit/ac0b03f)), closes [#3869](https://github.com/videojs/video.js/issues/3869)

<a name="5.15.0"></a>
# [5.15.0](https://github.com/videojs/video.js/compare/v5.14.1...v5.15.0) (2016-12-22)

### Features

* **player:** ingest a player div for videojs ([#3856](https://github.com/videojs/video.js/issues/3856)) ([74530d8](https://github.com/videojs/video.js/commit/74530d8))
* deprecate the use of `starttime` in player.js ([#3838](https://github.com/videojs/video.js/issues/3838)) ([22cf3dd](https://github.com/videojs/video.js/commit/22cf3dd))

### Bug Fixes

* **html5:** (un)patchCanPlayType could set native canPlayType to null ([#3863](https://github.com/videojs/video.js/issues/3863)) ([559297a](https://github.com/videojs/video.js/commit/559297a))
* **seeking:** don't always pause in mouse down ([#3886](https://github.com/videojs/video.js/issues/3886)) ([e92db4f](https://github.com/videojs/video.js/commit/e92db4f)), closes [#3839](https://github.com/videojs/video.js/issues/3839)
* don't emit tap events on tech when using native controls ([#3873](https://github.com/videojs/video.js/issues/3873)) ([42507f8](https://github.com/videojs/video.js/commit/42507f8))
* remote text track deprecation warnings ([#3864](https://github.com/videojs/video.js/issues/3864)) ([a7ffa34](https://github.com/videojs/video.js/commit/a7ffa34))
* remove vjs-seeking on src change ([#3846](https://github.com/videojs/video.js/issues/3846)) ([83cbeec](https://github.com/videojs/video.js/commit/83cbeec)), closes [#3765](https://github.com/videojs/video.js/issues/3765)

### Chores

* **docs:** Documentation Linting and TOC generation ([#3841](https://github.com/videojs/video.js/issues/3841)) ([0493f54](https://github.com/videojs/video.js/commit/0493f54))
* **faq:** move FAQ and troubleshooting guide to docs/ ([#3883](https://github.com/videojs/video.js/issues/3883)) ([26789e7](https://github.com/videojs/video.js/commit/26789e7))
* **package:** update dependencies (enable Greenkeeper) 🌴 ([#3777](https://github.com/videojs/video.js/issues/3777)) ([d20e9ce](https://github.com/videojs/video.js/commit/d20e9ce))
* **videojs-standard:** update to version 6.0.1 ([#3884](https://github.com/videojs/video.js/issues/3884)) ([eb389c5](https://github.com/videojs/video.js/commit/eb389c5))

### Documentation

* move examples out of code into docs ([642ad4b](https://github.com/videojs/video.js/commit/642ad4b))

### Tests

* **hooks:** move vjs hooks QUnit module into separate file ([#3862](https://github.com/videojs/video.js/issues/3862)) ([87cd26d](https://github.com/videojs/video.js/commit/87cd26d))
* **hooks:** remove errors logged in tests ([#3865](https://github.com/videojs/video.js/issues/3865)) ([3f724f9](https://github.com/videojs/video.js/commit/3f724f9))

<a name="5.14.1"></a>
## [5.14.1](https://github.com/videojs/video.js/compare/v5.14.0...v5.14.1) (2016-12-05)

### Bug Fixes

* **throttle:** Fix error in Fn.throttle that broke MouseTimeDisplay ([#3833](https://github.com/videojs/video.js/issues/3833)) ([014c6b8](https://github.com/videojs/video.js/commit/014c6b8))

### Tests

* add Edge to browserstack tests ([#3834](https://github.com/videojs/video.js/issues/3834)) ([5ec46b0](https://github.com/videojs/video.js/commit/5ec46b0))
* **events:** silence error logging in tests ([#3835](https://github.com/videojs/video.js/issues/3835)) ([214e01c](https://github.com/videojs/video.js/commit/214e01c))

<a name="5.14.0"></a>
# [5.14.0](https://github.com/videojs/video.js/compare/v5.13.2...v5.14.0) (2016-12-02)

### Features

* Allow to use custom Player class ([#3458](https://github.com/videojs/video.js/issues/3458)) ([de25d75](https://github.com/videojs/video.js/commit/de25d75)), closes [#3335](https://github.com/videojs/video.js/issues/3335) [#3016](https://github.com/videojs/video.js/issues/3016)
* Eliminate lodash-compat as a dependency, rewrite mergeOptions ([#3760](https://github.com/videojs/video.js/issues/3760)) ([761b877](https://github.com/videojs/video.js/commit/761b877))
* Object Type-Detection and Replacing object.assign ([#3757](https://github.com/videojs/video.js/issues/3757)) ([8f16de2](https://github.com/videojs/video.js/commit/8f16de2))
* Refactoring chapters button handling and fixing several issues ([#3472](https://github.com/videojs/video.js/issues/3472)) ([41bd855](https://github.com/videojs/video.js/commit/41bd855)), closes [#3447](https://github.com/videojs/video.js/issues/3447) [#3447](https://github.com/videojs/video.js/issues/3447)
* **texttracks:** always use emulated text tracks ([#3798](https://github.com/videojs/video.js/issues/3798)) ([881cfcb](https://github.com/videojs/video.js/commit/881cfcb))
* **tracks:** Added option to disable native tracks ([#3786](https://github.com/videojs/video.js/issues/3786)) ([9b9f89e](https://github.com/videojs/video.js/commit/9b9f89e))

### Code Refactoring

* **html5:** remove confusing references to player in a tech ([#3790](https://github.com/videojs/video.js/issues/3790)) ([d69551a](https://github.com/videojs/video.js/commit/d69551a))

### Documentation

* **FAQ:** add an faq ([#3805](https://github.com/videojs/video.js/issues/3805)) ([1d5562d](https://github.com/videojs/video.js/commit/1d5562d))
* **guides:** Manual Documentation Improvements ([#3703](https://github.com/videojs/video.js/issues/3703)) ([d24fe40](https://github.com/videojs/video.js/commit/d24fe40))
* **jsdoc:** Update the jsdoc comments to modern syntax - Part 1 ([#3694](https://github.com/videojs/video.js/issues/3694)) ([1a0b281](https://github.com/videojs/video.js/commit/1a0b281))
* **jsdoc:** Update the jsdoc comments to modern syntax - Part 2 ([#3698](https://github.com/videojs/video.js/issues/3698)) ([cfc3ed7](https://github.com/videojs/video.js/commit/cfc3ed7))
* **jsdoc:** Update the jsdoc comments to modern syntax - Part 3 ([#3708](https://github.com/videojs/video.js/issues/3708)) ([eb2093e](https://github.com/videojs/video.js/commit/eb2093e))
* **jsdoc:** Update the jsdoc comments to modern syntax - Part 4  ([#3756](https://github.com/videojs/video.js/issues/3756)) ([15ce37e](https://github.com/videojs/video.js/commit/15ce37e))
* **jsdoc:** Update the jsdoc comments to modern syntax - Part 5 ([#3766](https://github.com/videojs/video.js/issues/3766)) ([ba3cf17](https://github.com/videojs/video.js/commit/ba3cf17))
* **jsdoc:** Update the jsdoc comments to modern syntax - Part 6 ([#3771](https://github.com/videojs/video.js/issues/3771)) ([c902279](https://github.com/videojs/video.js/commit/c902279))
* add a troubleshooting guide ([#3814](https://github.com/videojs/video.js/issues/3814)) ([54ff1f9](https://github.com/videojs/video.js/commit/54ff1f9))
* fix typo, extends -> extend ([#3789](https://github.com/videojs/video.js/issues/3789)) ([c5d1152](https://github.com/videojs/video.js/commit/c5d1152))

### Tests

* fix tests on older IE ([#3800](https://github.com/videojs/video.js/issues/3800)) ([b4ebd9b](https://github.com/videojs/video.js/commit/b4ebd9b))

<a name="5.13.2"></a>
## [5.13.2](https://github.com/videojs/video.js/compare/v5.13.1...v5.13.2) (2016-11-14)

### Bug Fixes

* **html5:** exit early on emulated tracks in html5 ([#3772](https://github.com/videojs/video.js/issues/3772)) ([252bcee](https://github.com/videojs/video.js/commit/252bcee))
* **HtmlTrackElementList:** allow to reference by index via bracket notation ([#3776](https://github.com/videojs/video.js/issues/3776)) ([430be94](https://github.com/videojs/video.js/commit/430be94))

### Chores

* fix CHANGELOG 5.13.1 header ([23f0fa0](https://github.com/videojs/video.js/commit/23f0fa0))
* fixup CHANGELOG for 5.13.1 release ([2a05633](https://github.com/videojs/video.js/commit/2a05633))
* **package:** update karma-detect-browsers to version 2.2.3 ([#3770](https://github.com/videojs/video.js/issues/3770)) ([6b477bb](https://github.com/videojs/video.js/commit/6b477bb))
* **pr_template:** add checkbox to verify changes in a browser ([#3775](https://github.com/videojs/video.js/issues/3775)) ([72fcb6c](https://github.com/videojs/video.js/commit/72fcb6c))

<a name="5.13.1"></a>
# [5.13.1](https://github.com/videojs/video.js/compare/v5.12.6...v5.13.1) (2016-11-09)

### Features

* **clickable-component:** Disable interaction with disabled clickable components ([#3525](https://github.com/videojs/video.js/issues/3525)) ([de1b363](https://github.com/videojs/video.js/commit/de1b363))
* **component:** attribute get/set/remove methods ([202da2d](https://github.com/videojs/video.js/commit/202da2d))
* **fluid:** use default aspect ratio for fluid players if width unknown ([#3614](https://github.com/videojs/video.js/issues/3614)) ([2988f6a](https://github.com/videojs/video.js/commit/2988f6a))
* add a safe computedStyle to videojs. ([#3664](https://github.com/videojs/video.js/issues/3664)) ([9702618](https://github.com/videojs/video.js/commit/9702618))
* add ability to get current source object and all source objects ([#2678](https://github.com/videojs/video.js/issues/2678)) ([028559c](https://github.com/videojs/video.js/commit/028559c)), closes [#2443](https://github.com/videojs/video.js/issues/2443)
* Components are now accessible via `camelCase` and `UpperCamelCase` ([#3439](https://github.com/videojs/video.js/issues/3439)) ([9d77268](https://github.com/videojs/video.js/commit/9d77268)), closes [#3436](https://github.com/videojs/video.js/issues/3436)
* **lang:** update ru.json ([#3654](https://github.com/videojs/video.js/issues/3654)) ([d11fd50](https://github.com/videojs/video.js/commit/d11fd50))
* **lang:** update uk.json ([#3675](https://github.com/videojs/video.js/issues/3675)) ([8f7eb12](https://github.com/videojs/video.js/commit/8f7eb12))
* implement player lifecycle hooks and trigger beforesetup/setup hooks ([#3639](https://github.com/videojs/video.js/issues/3639)) ([77357b1](https://github.com/videojs/video.js/commit/77357b1))
* option to have remoteTextTracks automatically 'garbage-collected' when sources change ([#3736](https://github.com/videojs/video.js/issues/3736)) ([f05a927](https://github.com/videojs/video.js/commit/f05a927))

### Bug Fixes

* allow rounded value for fluid player ratio test ([#3739](https://github.com/videojs/video.js/issues/3739)) ([2e720af](https://github.com/videojs/video.js/commit/2e720af))
* aria-live="assertive" only for descriptions ([685404d](https://github.com/videojs/video.js/commit/685404d)), closes [#3554](https://github.com/videojs/video.js/issues/3554)
* currentDimension can return 0 for fluid player on IE ([#3738](https://github.com/videojs/video.js/issues/3738)) ([74cddca](https://github.com/videojs/video.js/commit/74cddca))
* Suppress Infinity duration on Android Chrome before playback ([#3476](https://github.com/videojs/video.js/issues/3476)) ([ed59531](https://github.com/videojs/video.js/commit/ed59531)), closes [#3079](https://github.com/videojs/video.js/issues/3079)

### Chores

* **changelog.md:** update 5.12.6 and 5.12.3 ([#3715](https://github.com/videojs/video.js/issues/3715)) ([254683b](https://github.com/videojs/video.js/commit/254683b))
* pin karma-detect-browsers to 2.1.0 ([#3764](https://github.com/videojs/video.js/issues/3764)) ([4859bb9](https://github.com/videojs/video.js/commit/4859bb9))
* **package:** update grunt-accessibility to version 5.0.0 ([#3747](https://github.com/videojs/video.js/issues/3747)) ([b6d521f](https://github.com/videojs/video.js/commit/b6d521f))

### Code Refactoring

* **texttracksettings:** DRYer code and remove massive HTML blob ([#3679](https://github.com/videojs/video.js/issues/3679)) ([fb74c71](https://github.com/videojs/video.js/commit/fb74c71))
* remove un-needed contructor and function overrides ([#3721](https://github.com/videojs/video.js/issues/3721)) ([6889e92](https://github.com/videojs/video.js/commit/6889e92))

### Documentation

* Change registerSourceHandler param doc from first to index ([#3737](https://github.com/videojs/video.js/issues/3737)) ([b2c5b2a](https://github.com/videojs/video.js/commit/b2c5b2a))
* **collaborator_guide:** add collaborator guide ([#3724](https://github.com/videojs/video.js/issues/3724)) ([8d51235](https://github.com/videojs/video.js/commit/8d51235))
* **contributing.md:** update CONTRIBUTING.md with latest info ([#3722](https://github.com/videojs/video.js/issues/3722)) ([11a096d](https://github.com/videojs/video.js/commit/11a096d))

### Performance Improvements

* Dispatch Flash events asynchronously ([#3700](https://github.com/videojs/video.js/pull/3700))
* Cache currentTime and buffered from Flash ([#3705](https://github.com/videojs/video.js/issues/3705)) ([45ffa81](https://github.com/videojs/video.js/commit/45ffa81))
* Use ES6 rest operator and allow V8 to optimize mergeOptions ([#3743](https://github.com/videojs/video.js/issues/3743)) ([5f42130](https://github.com/videojs/video.js/commit/5f42130))

### Tests

* **dom:** fix removeElClass test in Safari 10. ([#3768](https://github.com/videojs/video.js/issues/3768)) ([9965077](https://github.com/videojs/video.js/commit/9965077))
* **hooks:** fix hooks unit test in ie8 ([#3745](https://github.com/videojs/video.js/issues/3745)) ([e9e5b5f](https://github.com/videojs/video.js/commit/e9e5b5f))

<a name="5.12.6"></a>
## [5.12.6](https://github.com/videojs/video.js/compare/v5.12.5...v5.12.6) (2016-10-25)

### Bug Fixes

* make sure that document.createElement exists before using ([#3706](https://github.com/videojs/video.js/issues/3706)) ([49e29ba](https://github.com/videojs/video.js/commit/49e29ba)), closes [#3665](https://github.com/videojs/video.js/issues/3665)
* remove unnecessary comments from video.min.js ([#3709](https://github.com/videojs/video.js/issues/3709)) ([fe760a4](https://github.com/videojs/video.js/commit/fe760a4)), closes [#3707](https://github.com/videojs/video.js/issues/3707)

<a name="5.12.5"></a>
## [5.12.5](https://github.com/videojs/video.js/compare/v5.12.4...v5.12.5) (2016-10-19)

### Bug Fixes

* move html5 source handler incantation to bottom ([#3695](https://github.com/videojs/video.js/issues/3695)) ([7b9574b](https://github.com/videojs/video.js/commit/7b9574b))

<a name="5.12.4"></a>
## [5.12.4](https://github.com/videojs/video.js/compare/v5.12.3...v5.12.4) (2016-10-18)

### Bug Fixes

* logging failing on browsers that don't always have console ([#3686](https://github.com/videojs/video.js/issues/3686)) ([e932061](https://github.com/videojs/video.js/commit/e932061))
* Restore timeupdate/loadedmetadata listeners for duration display ([#3682](https://github.com/videojs/video.js/issues/3682)) ([44ec0e4](https://github.com/videojs/video.js/commit/44ec0e4))

### Chores

* **grunt:** fix getting changelog by switching to  npm-run ([#3687](https://github.com/videojs/video.js/issues/3687)) ([8845bd3](https://github.com/videojs/video.js/commit/8845bd3)), closes [#3683](https://github.com/videojs/video.js/issues/3683)

### Documentation

* **options.md:** Remove Bad Apostrophe ([#3677](https://github.com/videojs/video.js/issues/3677)) ([16c8559](https://github.com/videojs/video.js/commit/16c8559))
* **tech.md:** Add a note on Flash permissions in sandboxed environments ([#3684](https://github.com/videojs/video.js/issues/3684)) ([66922a8](https://github.com/videojs/video.js/commit/66922a8))

<a name="5.12.3"></a>
## [5.12.3](https://github.com/videojs/video.js/compare/v5.12.2...v5.12.3) (2016-10-06)

### Features

* **lang:** add missing translations in fr.json ([280ecd4](https://github.com/videojs/video.js/commit/280ecd4))
* **lang:** add missing translations to el.json ([eb0efd4](https://github.com/videojs/video.js/commit/eb0efd4))

### Bug Fixes

* **controls:** fix load progress bar never highlighting first buffered time range ([ca02298](https://github.com/videojs/video.js/commit/ca02298))
* **css:** remove commented out css ([5fdcd46](https://github.com/videojs/video.js/commit/5fdcd46)), closes [#3587](https://github.com/videojs/video.js/issues/3587)
* disable HLS hack on Firefox for Android ([#3586](https://github.com/videojs/video.js/issues/3586)) ([dd2aff0](https://github.com/videojs/video.js/commit/dd2aff0))
* proxy ios webkit events into fullscreenchange ([#3644](https://github.com/videojs/video.js/issues/3644)) ([e479f8c](https://github.com/videojs/video.js/commit/e479f8c))
* **html5:** disable manual timeupdate events on html5 tech ([#3656](https://github.com/videojs/video.js/issues/3656)) ([920c54a](https://github.com/videojs/video.js/commit/920c54a))

### Chores

* move metadata to hidden folder and update references ([86f0830](https://github.com/videojs/video.js/commit/86f0830))
* **deps:** add the bundle-collapser browserify plugin ([816291e](https://github.com/videojs/video.js/commit/816291e))
* **package:** remove es2015-loose since it's an option for es2015 ([#3629](https://github.com/videojs/video.js/issues/3629)) ([c545acd](https://github.com/videojs/video.js/commit/c545acd))
* **package:** update grunt-contrib-cssmin to version 1.0.2 ([#3595](https://github.com/videojs/video.js/issues/3595)) ([54e3db5](https://github.com/videojs/video.js/commit/54e3db5))
* **package:** update grunt-shell to version 2.0.0 ([#3642](https://github.com/videojs/video.js/issues/3642)) ([2032b17](https://github.com/videojs/video.js/commit/2032b17))
* refactor redundant code in html5 tech ([#3593](https://github.com/videojs/video.js/issues/3593)) ([6878c21](https://github.com/videojs/video.js/commit/6878c21))
* refactor redundant or verbose code in player.js ([#3597](https://github.com/videojs/video.js/issues/3597)) ([ae3e277](https://github.com/videojs/video.js/commit/ae3e277))
* update CHANGELOG automation to use conventional-changelog ([#3669](https://github.com/videojs/video.js/issues/3669)) ([d4e89d2](https://github.com/videojs/video.js/commit/d4e89d2))
* update object.assign to ^4.0.4 ([08c7f4e](https://github.com/videojs/video.js/commit/08c7f4e))

### Documentation

* fix broken links in docs index.md ([4063f96](https://github.com/videojs/video.js/commit/4063f96))

### Tests

* **a11y:** add basic accessibility testing using grunt-accessibility ([7d85f27](https://github.com/videojs/video.js/commit/7d85f27))

## 5.12.2 (2016-09-28)
* Changes from 5.11.7 on the 5.12 branch

## 5.12.1 (2016-08-25)
* Changes from 5.11.6 on the 5.12 branch

## 5.13.0 (2016-08-25)
* Ignored release

## 5.12.0 (2016-08-25)
* @misteroneill, @BrandonOCasey, and @pagarwal123 updates all the code to pass the linter ([view](https://github.com/videojs/video.js/pull/3459))
* @misteroneill added ghooks to run linter on git push ([view](https://github.com/videojs/video.js/pull/3459))
* @BrandonOCasey removed unused base-styles.js file ([view](https://github.com/videojs/video.js/pull/3486))
* @erikyuzwa, @gkatsev updated CSS build to inlcude the IE8-specific CSS from a separate file instead of it being inside of sass ([view](https://github.com/videojs/video.js/pull/3380)) ([view2](https://github.com/erikyuzwa/video.js/pull/1))
* @gkatsev added null checks around navigator.userAgent ([view](https://github.com/videojs/video.js/pull/3502))
* greenkeeper updated karma dependencies ([view](https://github.com/videojs/video.js/pull/3523))
* @BrandonOCasey updated language docs to link to IANA language registry ([view](https://github.com/videojs/video.js/pull/3493))
* @gkatsev removed unused dependencies ([view](https://github.com/videojs/video.js/pull/3516))
* @misteroneill enabled and updated videojs-standard and fixed an issue with linting ([view](https://github.com/videojs/video.js/pull/3508))
* @misteroneill updated tests to qunit 2.0 ([view](https://github.com/videojs/video.js/pull/3509))
* @gkatsev added slack badge to README ([view](https://github.com/videojs/video.js/pull/3527))
* @gkatsev reverted back to qunitjs 1.x to unbreak IE8. Added es5-shim to tests ([view](https://github.com/videojs/video.js/pull/3533))
* @gkatsev updated build system to open es5 folder for bundles and dist folder other users ([view](https://github.com/videojs/video.js/pull/3445))
* greenkeeper updated uglify ([view](https://github.com/videojs/video.js/pull/3547))
* greenkeeper updated grunt-concurrent ([view](https://github.com/videojs/video.js/pull/3532))
* greenkeeper updated karma-chrome-launcher ([view](https://github.com/videojs/video.js/pull/3553))
* @gkatsev added tests for webpack and browserify bundling and node.js requiring ([view](https://github.com/videojs/video.js/pull/3558))
* @rlchung fixed tests that weren't disposing players when they finished ([view](https://github.com/videojs/video.js/pull/3524))

## 5.11.9 (2016-10-25)
* greenkeeper updated karma dependencies ([view](https://github.com/videojs/video.js/pull/3523))
* update to latest uglify to fix preserve comments issue. Disable screw ie8 option. ([view](https://github.com/videojs/video.js/pull/3709))
* remove sourcemap generation ([view](https://github.com/videojs/video.js/pull/3710))

## 5.11.8 (2016-10-17)
* @misteroneill restore timeupdate/loadedmetadata listeners for duration display ([view](https://github.com/videojs/video.js/pull/3682))

## 5.11.7 (2016-09-28)
* @gkatsev checked throwIfWhitespace first in hasElClass ([view](https://github.com/videojs/video.js/pull/3640))
* @misteroneill pinned grunt-contrib-uglify to ~0.11 to pin uglify to ~2.6 ([view](https://github.com/videojs/video.js/pull/3634))
* @gkatsev set playerId on new el created for movingMediaElementInDOM. Fixes #3283 ([view](https://github.com/videojs/video.js/pull/3648))

## 5.11.6 (2016-08-25)
* @imbcmdth Added exception handling to event dispatcher ([view](https://github.com/videojs/video.js/pull/3580))

## 5.11.5 (2016-08-25)
* @misteroneill fixed wrapping native and emulated MediaErrors ([view](https://github.com/videojs/video.js/pull/3562))
* @snyderizer fixed switching between audio tracks. Fixes #3510 ([view](https://github.com/videojs/video.js/pull/3538))
* @jbarabander added title attribute to audio button. Fixes #3528 ([view](https://github.com/videojs/video.js/pull/3565))
* @misteroneill fixed IE8 media error test failure ([view](https://github.com/videojs/video.js/pull/3568))

## 5.11.4 (2016-08-16)
_(none)_

## 5.11.3 (2016-08-15)
* @vdeshpande fixed control text for fullscreen button ([view](https://github.com/videojs/video.js/pull/3485))
* @mister-ben fixed android treating swipe as a tap ([view](https://github.com/videojs/video.js/pull/3514))
* @mboles updated duration() method documentation ([view](https://github.com/videojs/video.js/pull/3515))
* @mister-ben silenced chrome's play() request was interrupted by pause() error ([view](https://github.com/videojs/video.js/pull/3518))

## 5.11.2 (2016-08-09)
_(none)_

## 5.11.1 (2016-08-08)
* @vxsx fixed legend selector to be more specific. Fixes #3492 ([view](https://github.com/videojs/video.js/pull/3494))

## 5.11.0 (2016-07-22)
* @BrandonOCasey Document audio/video track usage ([view](https://github.com/videojs/video.js/pull/3295))
* @hartman Correct documentation to refer to nativeTextTracks option ([view](https://github.com/videojs/video.js/pull/3309))
* @nickygerritsen Also pass tech options to canHandleSource ([view](https://github.com/videojs/video.js/pull/3303))
* @misteroneill Un-deprecate the videojs.players property ([view](https://github.com/videojs/video.js/pull/3299))
* @nickygerritsen Add title to all clickable components ([view](https://github.com/videojs/video.js/pull/3296))
* @nickygerritsen Update Dutch language file ([view](https://github.com/videojs/video.js/pull/3297))
* @hartman Add descriptions and audio button to adaptive classes ([view](https://github.com/videojs/video.js/pull/3312))
* @MattiasBuelens Retain details from tech error ([view](https://github.com/videojs/video.js/pull/3313))
* @nickygerritsen Fix test for tooltips in IE8 ([view](https://github.com/videojs/video.js/pull/3327))
* @mboles added loadstart event to jsdoc ([view](https://github.com/videojs/video.js/pull/3370))
* @hartman added default print styling ([view](https://github.com/videojs/video.js/pull/3304))
* @ldayananda updated videojs to not do anything if no src is set ([view](https://github.com/videojs/video.js/pull/3378))
* @nickygerritsen removed unused tracks when changing sources. Fixes #3000 ([view](https://github.com/videojs/video.js/pull/3002))
* @vit-koumar updated Flash tech to return Infinity from duration instead of -1 ([view](https://github.com/videojs/video.js/pull/3128))
* @alex-phillips added ontextdata to Flash tech ([view](https://github.com/videojs/video.js/pull/2748))
* @MattiasBuelens updated components to use durationchange only ([view](https://github.com/videojs/video.js/pull/3349))
* @misteroneill improved Logging for IE < 11 ([view](https://github.com/videojs/video.js/pull/3356))
* @vdeshpande updated control text of modal dialog ([view](https://github.com/videojs/video.js/pull/3400))
* @ldayananda fixed mouse handling on menus by using mouseleave over mouseout ([view](https://github.com/videojs/video.js/pull/3404))
* @mister-ben updated language to inherit correctly and respect the attribute on the player ([view](https://github.com/videojs/video.js/pull/3426))
* @sashyro fixed nativeControlsForTouch option ([view](https://github.com/videojs/video.js/pull/3410))
* @tbasse fixed techCall null check against tech ([view](https://github.com/videojs/video.js/pull/2676))
* @rbran100 checked src and currentSrc in handleTechReady to work around mixed content issues in chrome ([view](https://github.com/videojs/video.js/pull/3287))
* @OwenEdwards fixed caption settings dialog labels for accessibility ([view](https://github.com/videojs/video.js/pull/3281))
* @OwenEdwards removed spurious head tags in the simple-embed example ([view](https://github.com/videojs/video.js/pull/3438))
* @ntadej added a null check to errorDisplay usage ([view](https://github.com/videojs/video.js/pull/3440))
* @misteroneill fixed logging issues on IE by separating fn.apply and stringify checks ([view](https://github.com/videojs/video.js/pull/3444))
* @misteroneill fixed npm test from running coveralls locally ([view](https://github.com/videojs/video.js/pull/3449))
* @gkatsev added es6-shim to tests. Fixes Flash duration test ([view](https://github.com/videojs/video.js/pull/3453))
* @misteroneill corrects test assertions for older IEs in the log module ([view](https://github.com/videojs/video.js/pull/3454))
* @gkatsev fixed setting lang by looping through loop element variable and not constant tag ([view](https://github.com/videojs/video.js/pull/3455))

## 5.10.8 (2016-08-08)
* @gkatsev re-published to make sure that the audio button has css

## 5.10.7 (2016-06-27)
* @gkatsev pinned node-sass to 3.4 ([view](https://github.com/videojs/video.js/pull/3401))
* @mister-ben added try catch to volume and playbackrate checks. Fixes #3315 ([view](https://github.com/videojs/video.js/pull/3320))
* @m14t removed unused loadEvent property in ControlBar options ([view](https://github.com/videojs/video.js/pull/3363))
* @bklava updated pt-BR language file ([view](https://github.com/videojs/video.js/pull/3373))
* @mister-ben updated menus to use default videojs font-family ([view](https://github.com/videojs/video.js/pull/3384))
* @vdeshpande fixed chapters getting duplicated each time a track is loaded ([view](https://github.com/videojs/video.js/pull/3354))

## 5.10.6 (2016-06-20)
* @gkatsev fix not fully minified video.min.js file.

## 5.10.5 (2016-06-07)
* @gkatsev pinned dependencies to direct versions ([view](https://github.com/videojs/video.js/pull/3338))
* @gkatsev fixed minified vjs in ie8 when initialized with id string ([view](https://github.com/videojs/video.js/pull/3357))
* @IJsLauw fixed unhandled exception in deleting poster on ios7 ([view](https://github.com/videojs/video.js/pull/3337))

## 5.10.4 (2016-05-31)
* Patch release to fix dist on npm

## 5.10.3 (2016-05-27)
* @BrandonOCasey fixed source handlers being disposed multiple times when a video is put into the video element directly ([view](https://github.com/videojs/video.js/pull/3343))

## 5.10.2 (2016-05-12)
* @gkatsev nulled out currentSource_ in setSource ([view](https://github.com/videojs/video.js/pull/3314))

## 5.10.1 (2016-05-03)
* @nickygerritsen Pass tech options to source handlers ([view](https://github.com/videojs/video.js/pull/3245))
* @gkatsev Use fonts 2.0 that do not require wrapping codepoints ([view](https://github.com/videojs/video.js/pull/3252))
* @chrisauclair Make controls visible for accessibility reasons ([view](https://github.com/videojs/video.js/pull/3237))
* @gkatsev updated text track documentation and crossorigin warning. Fixes #1888, #1958, #2628, #3202 ([view](https://github.com/videojs/video.js/pull/3256))
* @BrandonOCasey added audio and video track support ([view](https://github.com/videojs/video.js/pull/3173))
* @OwenEdwards added language attribute in HTML files for accessibility ([view](https://github.com/videojs/video.js/pull/3257))
* @incompl clear currentSource_ after subsequent loadstarts ([view](https://github.com/videojs/video.js/pull/3285))
* @forbesjo add an audio track selector menu button ([view](https://github.com/videojs/video.js/pull/3223))

## 5.9.2 (2016-04-19)
* @gkatsev grouped text track errors in the console, if we can ([view](https://github.com/videojs/video.js/pull/3259))

## 5.9.1 (2016-04-19)
* @benjipott updated IS_CHROME to not be true on MS Edge ([view](https://github.com/videojs/video.js/pull/3232))
* @mister-ben blacklisted Chrome for Android for playback rate support ([view](https://github.com/videojs/video.js/pull/3246))
* @gkatsev made the first emulated text track enabled by default ([view](https://github.com/videojs/video.js/pull/3248))
* @gkatsev fixed removeRemoteTextTracks not working with return value from addRemoteTextTracks ([view](https://github.com/videojs/video.js/pull/3253))
* @forbesjo added back the background color to the poster ([view](https://github.com/videojs/video.js/pull/3267))
* @gkatsev fixed text track tests for older IEs ([view](https://github.com/videojs/video.js/pull/3269))

## 5.9.0 (2016-04-05)
* @gkatsev updated vjs to not add dynamic styles when VIDEOJS_NO_DYNAMIC_STYLE is set ([view](https://github.com/videojs/video.js/pull/3093))
* @OwenEdwards added basic descriptions track support ([view](https://github.com/videojs/video.js/pull/3098))
* @kamilbrenk Added lang
* @arius28 added greek translation file (el.json) ([view](https://github.com/videojs/video.js/pull/3185))
* @ricardosiri68 changed the relative sass paths ([view](https://github.com/videojs/video.js/pull/3147))
* @gkatsev added an option to keep the tooltips inside the player bounds ([view](https://github.com/videojs/video.js/pull/3149))
* @defli added currentWidth and currentHeight methods to the player ([view](https://github.com/videojs/video.js/pull/3144))
* fix IE8 tests for VIDEOJS_NO_DYNAMIC_STYLE ([view](https://github.com/videojs/video.js/pull/3215))
* @OwenEdwards fixed links adding extra tab stop with IE by removing anchor tags on videojs init ([view](https://github.com/videojs/video.js/pull/3194))
* @scaryguy updated videojs cdn urls in the README ([view](https://github.com/videojs/video.js/pull/3195))
* @mister-ben updated the time tooltips to use the chosen font family ([view](https://github.com/videojs/video.js/pull/3213))
* @OwenEdwards improved handling of deprecated use of Button component ([view](https://github.com/videojs/video.js/pull/3236))
* @forbesjo added chrome for PR tests ([view](https://github.com/videojs/video.js/pull/3235))
* @MCGallaspy added vttjs to the self-hosting guide ([view](https://github.com/videojs/video.js/pull/3229))
* @chrisauclair added ARIA region and label to player element ([view](https://github.com/videojs/video.js/pull/3227))
* @andyearnshaw updated document event handlers to use el.ownerDocument ([view](https://github.com/videojs/video.js/pull/3230))

## 5.8.8 (2016-04-04)
* @vtytar fixed auto-setup failing if taking too long to load ([view](http://github.com/videojs/video.js/pull/3233))
* @seescode fixed css failing on IE8 due to incorrect ie8 hack ([view](http://github.com/videojs/video.js/pull/3226))
* @seescode fixed dragging on mute toggle changing the volume ([view](http://github.com/videojs/video.js/pull/3228))

## 5.8.7 (2016-03-29)
* @llun fixed menus from throwing when focused when empty ([view](https://github.com/videojs/video.js/pull/3218))
* @mister-ben added dir=ltr to control bar and loading spinner ([view](https://github.com/videojs/video.js/pull/3221))
* @avreg fixed notSupportedMessage saying video when meaning media ([view](https://github.com/videojs/video.js/pull/3222))
* @mister-ben fixed missing native HTML5 tracks ([view](https://github.com/videojs/video.js/pull/3212))
* @mister-ben updated Arabic language files ([view](https://github.com/videojs/video.js/pull/3225))

## 5.8.6 (2016-03-25)
* @misteroneill fixed typo and indenting in language files ([view](https://github.com/videojs/video.js/pull/3207))

## 5.8.5 (2016-03-17)
* @gkatsev cleared vttjs script handlers on dispose. Fixed tests ([view](https://github.com/videojs/video.js/pull/3189))

## 5.8.4 (2016-03-17)
* @gkatsev changed emulated tracks to in novtt to wait for vttjs to load or error before parsing ([view](https://github.com/videojs/video.js/pull/3181))

## 5.8.3 (2016-03-10)
* @gkatsev fixed keyboard control of menus with titles. Fixes #3164 ([view](https://github.com/videojs/video.js/pull/3165))

## 5.8.2 (2016-03-09)
* @gkatsev fixed chapters menu. Fixes #3062 ([view](https://github.com/videojs/video.js/pull/3163))

## 5.8.1 (2016-03-07)
* @gkatsev updated videojs badges in the README ([view](https://github.com/videojs/video.js/pull/3134))
* @BrandonOCasey converted remaining text-track modules to ES6 ([view](https://github.com/videojs/video.js/pull/3130))
* @gkatsev cleared waiting/spinner on timeupdate. Fixes #3124 ([view](https://github.com/videojs/video.js/pull/3138))
* @BrandonOCasey updated text track unit tests to use full es6 syntax ([view](https://github.com/videojs/video.js/pull/3148))
* @defli added missing var to sandbox index.html example ([view](https://github.com/videojs/video.js/pull/3155))
* @defli fixed typo and updated Turkish translations ([view](https://github.com/videojs/video.js/pull/3156))
* @OwenEdwards fixed menu closing on ios, specifically ipad ([view](https://github.com/videojs/video.js/pull/3158))

## 5.8.0 (2016-02-19)
* @gkatsev added issue and PR templates for github ([view](https://github.com/videojs/video.js/pull/3117))
* @Nipoto added fa.json (farsi/persian lang file) ([view](https://github.com/videojs/video.js/pull/3116))
* @forbesjo updated travis to use latest firefox ([view](https://github.com/videojs/video.js/pull/3112))
* @Naouak updated time display to not change if values do not change ([view](https://github.com/videojs/video.js/pull/3101))
* @forbesjo updated track settings to not fail restoring settings when localStorage is not available ([view](https://github.com/videojs/video.js/pull/3120))
* @mister-ben Added en.json as localization template ([view](https://github.com/videojs/video.js/pull/3096))
* @misteroneill added alt css as video-js-cdn.css ([view](https://github.com/videojs/video.js/pull/3118))

## 5.7.1 (2016-02-11)
* @alex-phillips fixed reference to videojs-vtt.js dependency ([view](https://github.com/videojs/video.js/pull/3080))
* @gkatsev fixed minified videojs in IE8. Fixes #3064 and #3070 ([view](https://github.com/videojs/video.js/pull/3104))

## 5.7.0 (2016-02-04)
* @forbesjo updated emulated tracks to have listeners removed when they are removed ([view](https://github.com/videojs/video.js/pull/3046))
* @incompl improved the UX of time tooltips ([view](https://github.com/videojs/video.js/pull/3060))
* @gkatsev updated README to include links to plugins page and getting started and cleaner link to LICENSE ([view](https://github.com/videojs/video.js/pull/3066))
* @hartman Corrected adaptive layout selectors to match their intent ([view](https://github.com/videojs/video.js/pull/2923))
* @mister-ben updated Umuted to Unmute in lang files ([view](https://github.com/videojs/video.js/pull/3053))
* @hartman updated fullscreen and time controls for more consistent widths ([view](https://github.com/videojs/video.js/pull/2893))
* @hartman Set a min-width for the progress slider of 4em ([view](https://github.com/videojs/video.js/pull/2902))
* @misteroneill fixed iphone useragent detection ([view](https://github.com/videojs/video.js/pull/3077))
* @erikyuzwa added ability to add child component at specific index ([view](https://github.com/videojs/video.js/pull/2540))

## 5.6.0 (2016-01-26)
* @OwenEdwards added ClickableComponent. Fixed keyboard operation of buttons ([view](https://github.com/videojs/video.js/pull/3032))
* @OwenEdwards Fixed menu keyboard access and ARIA labeling for screen readers ([view](https://github.com/videojs/video.js/pull/3033))
* @OwenEdwards Fixed volume menu keyboard access ([view](https://github.com/videojs/video.js/pull/3034))
* @mister-ben made $primary-foreground-color a !default sass var ([view](https://github.com/videojs/video.js/pull/3003))
* @OwenEdwards fixed double-localization of mute toggle control text ([view](https://github.com/videojs/video.js/pull/3017))
* @gkatsev checked muted status when updating volume bar level ([view](https://github.com/videojs/video.js/pull/3037))
* @vitor-faiante updated the guides ([view](https://github.com/videojs/video.js/pull/2781))
* @aril-spetalen added language support for Norwegian (nb and nn) ([view](https://github.com/videojs/video.js/pull/3021))
* @CoWinkKeyDinkInc fixed table in Tracks guide. Replaced some single quotes with double quotes ([view](https://github.com/videojs/video.js/pull/2946))
* @hubdotcom changed URLs in README to be protocol-relative ([view](https://github.com/videojs/video.js/pull/3040))
* @gkatsev updated to latest videojs-ie8 shim ([view](https://github.com/videojs/video.js/pull/3042))

## 5.5.3 (2016-01-15)
* @gkasev updated vjs to correctly return already created player when given an element ([view](https://github.com/videojs/video.js/pull/3006))
* @mister-ben updated CDN urls in setup guide ([view](https://github.com/videojs/video.js/pull/2984))
* @rcrooks fixed a couple of docs link and a jsdoc comment ([view](https://github.com/videojs/video.js/pull/2987))

## 5.5.2 (2016-01-14)
* make sure that styleEl_ is in DOM before removing on dispose ([view](https://github.com/videojs/video.js/pull/3004))

## 5.5.1 (2016-01-08)
* @gkatsev fixed sass if else for icons ([view](https://github.com/videojs/video.js/pull/2988))

## 5.5.0 (2016-01-07)
* @hartman fixed usage of lighten in progress component. Fixes #2793 ([view](https://github.com/videojs/video.js/pull/2875))
* @misteroneill exposed createEl on videojs ([view](https://github.com/videojs/video.js/pull/2926))
* @huitsing updated docstrings for autoplay and loop methods ([view](https://github.com/videojs/video.js/pull/2960))
* @rcrooks fixed some broken links in guides ([view](https://github.com/videojs/video.js/pull/2965))
* @forbesjo fixed errorDisplay erroring on subsequent openings ([view](https://github.com/videojs/video.js/pull/2966))
* @incompl updated build command in CONTRIBUTING.md ([view](https://github.com/videojs/video.js/pull/2967))
* @forbesjo updated player to not autoplay if there is no source ([view](https://github.com/videojs/video.js/pull/2971))
* @gkatsev updated css to have ascii codepoints for fonticons. Expose new scss file ([view](https://github.com/videojs/video.js/pull/2973))

## 5.4.6 (2015-12-22)
* @gkatsev fixed vertical slider alignment in volume menu button ([view](https://github.com/videojs/video.js/pull/2943))

## 5.4.5 (2015-12-15)
* @gkatsev added mouse/touch listeners to volume menu button ([view](https://github.com/videojs/video.js/pull/2638))
* @gkatsev updated styles for inline menu and volume bar ([view](https://github.com/videojs/video.js/pull/2913))
* @BrandonOCasey updated sandbox to to use newer CDN urls ([view](https://github.com/videojs/video.js/pull/2917))
* @hartman updated options guide doc ([view](https://github.com/videojs/video.js/pull/2908))
* @rcrooks fixed simple embed example ([view](https://github.com/videojs/video.js/pull/2915))

## 5.4.4 (2015-12-09)
* @gkatsev switched to use custom vtt.js from npm ([view](https://github.com/videojs/video.js/pull/2905))

## 5.4.3 (2015-12-08)
* @gkatsev updated options customizer and github-release options ([view](https://github.com/videojs/video.js/pull/2903))

## 5.4.2 (2015-12-08)
* @gkatsev updated grunt-release config ([view](https://github.com/videojs/video.js/pull/2900))

## 5.4.1 (2015-12-08)
* @misteroneill updated videojs-ie8 to 1.1.1 ([view](https://github.com/videojs/video.js/pull/2869))
* @gkatsev added Player#tech. Fixes #2617 ([view](https://github.com/videojs/video.js/pull/2883))
* @nick11703 changed multiline comments in sass with single-line comments ([view](https://github.com/videojs/video.js/pull/2827))
* @gkatsev added a Player#reset method. Fixes #2852 ([view](https://github.com/videojs/video.js/pull/2880))
* @chemoish emulated HTMLTrackElement to enable track load events ([view](https://github.com/videojs/video.js/pull/2804))
* @gkatsev added nullcheck for cues in updateForTrack. Fixes #2870 ([view](https://github.com/videojs/video.js/pull/2896))
* @gkatsev added ability to release next tag from master ([view](https://github.com/videojs/video.js/pull/2894))
* @gkatsev added chg- and github- release for next releases ([view](https://github.com/videojs/video.js/pull/2899))

## 5.3.0 (2015-11-25)
* @forbesjo updated formatTime to not go negative ([view](https://github.com/videojs/video.js/pull/2821))
* @imbcmdth added sourceOrder option for source-first ordering in selectSource ([view](https://github.com/videojs/video.js/pull/2847))

## 5.2.4 (2015-11-25)
* @gesinger checked for track changes before tech started listening ([view](https://github.com/videojs/video.js/pull/2835))
* @gesinger fixed handler explosion for cuechange events ([view](https://github.com/videojs/video.js/pull/2849))
* @mmcc fixed vertical volume ([view](https://github.com/videojs/video.js/pull/2859))

## 5.2.3 (2015-11-24)
* @gkatsev fixed clearing out errors ([view](https://github.com/videojs/video.js/pull/2850))

## 5.2.2 (2015-11-23)
* @DatTran fixed bower paths. Fixes #2740 ([view](https://github.com/videojs/video.js/pull/2775))
* @nbibler ensured classes begin with alpha characters. Fixes #2828 ([view](https://github.com/videojs/video.js/pull/2829))
* @bcvio fixed returning current source rather than blob url ([view](https://github.com/videojs/video.js/pull/2833))
* @tomaspinho added ended event to API docs ([view](https://github.com/videojs/video.js/pull/2836))
* @paladox updated xhr from deprecated ver to v2.2 ([view](https://github.com/videojs/video.js/pull/2837))

## 5.2.1 (2015-11-16)
* @dmlap Check a component is a function before new-ing ([view](https://github.com/videojs/video.js/pull/2814))
* @ksjun corrected the registerTech export ([view](https://github.com/videojs/video.js/pull/2816))

## 5.2.0 (2015-11-10)
* @gkatsev made initListeners more general and added Tech.isTech. Fixes #2767 ([view](https://github.com/videojs/video.js/pull/2773))
* @dmlap updated swf to 5.0.1 ([view](https://github.com/videojs/video.js/pull/2795))
* @gkatsev added a tech registry. Fixes #2772 ([view](https://github.com/videojs/video.js/pull/2782))
* @Lillemanden impoved logic for dividing RTMP paths ([view](https://github.com/videojs/video.js/pull/2787))
* @bdeitte added a test for improved RTMP path dividing logic ([view](https://github.com/videojs/video.js/pull/2794))
* @paladox updated grunt-cli dependency ([view](https://github.com/videojs/video.js/pull/2555))
* @paladox updated grunt-contrib-jshint ([view](https://github.com/videojs/video.js/pull/2554))
* @siebrand updated dutch translations ([view](https://github.com/videojs/video.js/pull/2556))
* @misteroneill exposed DOM helpers ([view](https://github.com/videojs/video.js/pull/2754))
* @incompl fixed broken link to reduced test cases article ([view](https://github.com/videojs/video.js/pull/2801))
* @zjruan updated text track prototype loops to blacklist constructor for IE8 ([view](https://github.com/videojs/video.js/pull/2565))
* @gkatsev fixed usage of textTracksToJson ([view](https://github.com/videojs/video.js/pull/2797))
* @gkatsev updated contrib.json to use / as branch-name separator in feature-accept ([view](https://github.com/videojs/video.js/pull/2803))
* @gkatsev updated MediaLoader to check for techs in their registry ([view](https://github.com/videojs/video.js/pull/2798))

## 5.1.0 (2015-11-02)
* @typcn bumped grunt-sass to ^1.0.0 to support node 4.x ([view](https://github.com/videojs/video.js/pull/2645))
* @gkatsev removed unhelpful isCrossOrigin test ([view](https://github.com/videojs/video.js/pull/2715))
* @forbesjo updated karma to use all installed browsers for unit tests ([view](https://github.com/videojs/video.js/pull/2708))
* @forbesjo removed android/ios tests to increase build stability ([view](https://github.com/videojs/video.js/pull/2739))
* @nickygerritsen added canPlayType method to player ([view](https://github.com/videojs/video.js/pull/2709))
* @gkatsev fixes track tests and ignored empty properties in tracks converter ([view](https://github.com/videojs/video.js/pull/2744))
* @misteroneill added a modal dialog ([view](https://github.com/videojs/video.js/pull/2668))
* @misteroneill removed z-index from big play button ([view](https://github.com/videojs/video.js/pull/2639))
* @DaveVoyles updated URL to player API docs ([view](https://github.com/videojs/video.js/pull/2685))
* @ ([view](https://github.com/videojs/video.js/pull/2691))
* @kahwee Fixed sandbox plugin example to work in Video.js 5 ([view](https://github.com/videojs/video.js/pull/2691))
* @Soviut Fixed argument names in some API docs ([view](https://github.com/videojs/video.js/pull/2714))
* @forbesjo Added Microsoft Caption Maker link ([view](https://github.com/videojs/video.js/pull/2618))
* @misteroneill updated modal dialog CSS ([view](https://github.com/videojs/video.js/pull/2756))
* @misteroneill Add browserify
* @brkattk updated emulateTextTrack to exit early if no textTracks ([view](https://github.com/videojs/video.js/pull/2426))
* @chemoish Fix captions sticking to bottom for webkit browsers. Fixes #2193 ([view](https://github.com/videojs/video.js/pull/2702))
* @imbcmdth Deferred the implementation of select functions in the tech to source handlers if they provide them ([view](https://github.com/videojs/video.js/pull/2760))

## 5.0.2 (2015-10-23)
* @imbcmdth fixed an issue with emulateTextTracks being called before the tech dom was ready ([view](https://github.com/videojs/video.js/pull/2692))
* @gkatsev bumped obj.assign to fix uncaught SecurityError in iframes. Fixes #2703 ([view](https://github.com/videojs/video.js/pull/2721))
* @gkatsev updated contrib update and have contrib release only update local branches ([view](https://github.com/videojs/video.js/pull/2723))
* @gkatsev bumped chg to fix stalling issues ([view](https://github.com/videojs/video.js/pull/2732))

## 5.0.0 (2015-09-29)
* @carpasse infer MIME types from file extensions in the HTML5 and Flash techs ([view](https://github.com/videojs/video.js/pull/1974))
* @mmcc updated the slider to allow for vertical orientation ([view](https://github.com/videojs/video.js/pull/1816))
* @dmlap removed an ie6 hack for flash object embedding ([view](https://github.com/videojs/video.js/pull/1946))
* @heff replaced Closure Compiler with Uglify for minification ([view](https://github.com/videojs/video.js/pull/1940))
* @OleLaursen added a Danish translation ([view](https://github.com/videojs/video.js/pull/1899))
* @dn5 Added new translations (Bosnian, Serbian, Croatian) ([view](https://github.com/videojs/video.js/pull/1897))
* @mmcc (and others) converted the whole project to use ES6, Babel and Browserify ([view](https://github.com/videojs/video.js/pull/1976))
* @heff converted all classes to use ES6 classes ([view](https://github.com/videojs/video.js/pull/1993))
* @mmcc added ES6 default args and template strings ([view](https://github.com/videojs/video.js/pull/2015))
* @dconnolly replaced JSON.parse with a safe non-eval JSON parse ([view](https://github.com/videojs/video.js/pull/2077))
* @mmcc added a new default skin, switched to SASS, modified the html ([view](https://github.com/videojs/video.js/pull/1999))
* @gkatsev removed event.isDefaultPrevented in favor of event.defaultPrevented ([view](https://github.com/videojs/video.js/pull/2081))
* @heff added and `extends` function for external subclassing ([view](https://github.com/videojs/video.js/pull/2078))
* @forbesjo added the `scrubbing` property ([view](https://github.com/videojs/video.js/pull/2080))
* @heff switched to border-box sizing for all player elements ([view](https://github.com/videojs/video.js/pull/2082))
* @forbesjo added a vjs-button class to button controls ([view](https://github.com/videojs/video.js/pull/2084))
* @bc-bbay Load plugins before controls ([view](https://github.com/videojs/video.js/pull/2094))
* @bc-bbay rename onEvent methods to handleEvent ([view](https://github.com/videojs/video.js/pull/2093))
* @dmlap added an error message if techOrder is not in options ([view](https://github.com/videojs/video.js/pull/2097))
* @dconnolly exported the missing videojs.plugin function ([view](https://github.com/videojs/video.js/pull/2103))
* @mmcc added back the captions settings styles ([view](https://github.com/videojs/video.js/pull/2112))
* @gkatsev updated the component.js styles to match the new style guide ([view](https://github.com/videojs/video.js/pull/2105))
* @gkatsev added error logging for bad JSON formatting ([view](https://github.com/videojs/video.js/pull/2113))
* @gkatsev added a sensible toJSON function ([view](https://github.com/videojs/video.js/pull/2114))
* @bc-bbay fixed instance where progress bars would go passed 100% ([view](https://github.com/videojs/video.js/pull/2040))
* @eXon began Tech 2.0 work, improved how tech events are handled by the player ([view](https://github.com/videojs/video.js/pull/2057))
* @gkatsev added get and set global options methods ([view](https://github.com/videojs/video.js/pull/2115))
* @heff added support for fluid widths, aspect ratios, and metadata defaults ([view](https://github.com/videojs/video.js/pull/1952))
* @heff reorganized all utility functions in the codebase ([view](https://github.com/videojs/video.js/pull/2139))
* @eXon made additional tech 2.0 improvements listed in #2126 ([view](https://github.com/videojs/video.js/pull/2166))
* @heff Cleaned up and documented src/js/video.js and DOM functions ([view](https://github.com/videojs/video.js/pull/2182))
* @mmcc Changed to pure CSS slider handles ([view](https://github.com/videojs/video.js/pull/2132))
* @mister-ben updated language support to handle language codes with regions ([view](https://github.com/videojs/video.js/pull/2177))
* @heff changed the 'ready' event to always be asynchronous  ([view](https://github.com/videojs/video.js/pull/2188))
* @heff fixed instances of tabIndex that did not have a capital I   ([view](https://github.com/videojs/video.js/pull/2204))
* @heff fixed a number of IE8 and Flash related issues  ([view](https://github.com/videojs/video.js/pull/2206))
* @heff Reverted .video-js inline-block style to fix Flash fullscreen  ([view](https://github.com/videojs/video.js/pull/2217))
* @mmcc switched to using button elements for button components ([view](https://github.com/videojs/video.js/pull/2209))
* @mmcc increased the size of the progress bar and handle on hover ([view](https://github.com/videojs/video.js/pull/2216))
* @mmcc moved the fonts into their own repo ([view](https://github.com/videojs/video.js/pull/2223))
* @mmcc deprecated the options() function and removed internal uses ([view](https://github.com/videojs/video.js/pull/2229))
* @carpasse enhanced events to allow passing a second data argument ([view](https://github.com/videojs/video.js/pull/2163))
* @bc-bbay made the duration display update itself on loadedmetadata ([view](https://github.com/videojs/video.js/pull/2169))
* @arwidt added Swedish and Finnish translations ([view](https://github.com/videojs/video.js/pull/2189))
* @heff moved all the CDN logic into videojs/cdn ([view](https://github.com/videojs/video.js/pull/2230))
* @mmcc fixed the progress handle transition jerkiness ([view](https://github.com/videojs/video.js/pull/2219))
* @dmlap added support for the seekable property ([view](https://github.com/videojs/video.js/pull/2208))
* @mmcc un-hid the current and remaining times by default ([view](https://github.com/videojs/video.js/pull/2241))
* @pavelhoral fixed a bug with user activity that caused the control bar to flicker ([view](https://github.com/videojs/video.js/pull/2299))
* @dmlap updated to videojs-swf@4.7.1 to fix a video dimensions issue on subsequent loads ([view](https://github.com/videojs/video.js/pull/2281))
* @mmcc added the vjs-big-play-centered class ([view](https://github.com/videojs/video.js/pull/2293))
* @thijstriemstra added a logged error when a plugin is missing ([view](https://github.com/videojs/video.js/pull/1931))
* @gkatsev fixed the texttrackchange event and text track display for non-native tracks ([view](https://github.com/videojs/video.js/pull/2215))
* @mischizzle fixed event.relatedTarget in Firefox ([view](https://github.com/videojs/video.js/pull/2025))
* @mboles updated JSDoc comments everywhere to prepare for new docs ([view](https://github.com/videojs/video.js/pull/2270))
* @mmcc added a currentTime tooltip to the progress handle ([view](https://github.com/videojs/video.js/pull/2255))
* @pavelhoral fixed subclassing without a constructor ([view](https://github.com/videojs/video.js/pull/2308))
* @dmlap fixed a vjs_getProperty error caused by a progress check before the swf was ready ([view](https://github.com/videojs/video.js/pull/2316))
* @dmlap exported the videojs.log function ([view](https://github.com/videojs/video.js/pull/2317))
* @gkatsev updated vttjs to fix a trailing comma JSON error ([view](https://github.com/videojs/video.js/pull/2331))
* @gkatsev exported the videojs.bind() function ([view](https://github.com/videojs/video.js/pull/2332))
* Insert cloned el back into DOM. Fixes #2214 ([view](https://github.com/videojs/video.js/pull/2334))
* @heff sped up testing ([view](https://github.com/videojs/video.js/pull/2254))
* pass fs state to player from enterFullscreen, split full-window styles into their own selector ([view](https://github.com/videojs/video.js/pull/2357))
* Fixed vertical option for volumeMenuButton ([view](https://github.com/videojs/video.js/pull/2352))
* @dmlap switched events to not bubble by default ([view](https://github.com/videojs/video.js/pull/2351))
* @dmlap export videojs.createTimeRange ([view](https://github.com/videojs/video.js/pull/2361))
* @dmlap export a basic played() on techs ([view](https://github.com/videojs/video.js/pull/2384))
* @dmlap use seekable on source handlers when defined ([view](https://github.com/videojs/video.js/pull/2376))
* @dmlap fire seeking in the flash tech, not the SWF ([view](https://github.com/videojs/video.js/pull/2372))
* @dmlap expose the xhr helper utility ([view](https://github.com/videojs/video.js/pull/2321))
* @misteroneill fixed internal extends usage and added a deprecation warning ([view](https://github.com/videojs/video.js/pull/2390))
* @eXon added the poster to the options the tech receives ([view](https://github.com/videojs/video.js/pull/2338))
* @eXon made sure the volume persists between tech changes ([view](https://github.com/videojs/video.js/pull/2340))
* @eXon added the language to the options the tech receives ([view](https://github.com/videojs/video.js/pull/2338))
* @mmcc Added &quot;inline&quot; option to MenuButton and updated VolumeMenuButton to be able to utilize it ([view](https://github.com/videojs/video.js/pull/2378))
* @misteroneill restore some properties on window.videojs. ([view](https://github.com/videojs/video.js/pull/2395))
* @misteroneill restore some 4.x utilities and remove deprecated functionality ([view](https://github.com/videojs/video.js/pull/2406))
* @heff use a synchronous ready() internally ([view](https://github.com/videojs/video.js/pull/2392))
* @nickygerritsen scrubbing() is a method, not a property ([view](https://github.com/videojs/video.js/pull/2411))
* @sirlancelot change &quot;video&quot; to &quot;media&quot; in error messages ([view](https://github.com/videojs/video.js/pull/2409))
* @nickygerritsen use the default seekable when a source handler is unset ([view](https://github.com/videojs/video.js/pull/2401))
* @gkatsev always use emulated TextTrackLists so tracks survive tech switches ([view](https://github.com/videojs/video.js/pull/2425))
* @misteroneill restore Html5.Events ([view](https://github.com/videojs/video.js/pull/2421))
* @misteroneill removed the deprecated Component init method ([view](https://github.com/videojs/video.js/pull/2427))
* @misteroneill restore videojs.formatTime ([view](https://github.com/videojs/video.js/pull/2420))
* @misteroneill include child components with &#x60;true&#x60; in options ([view](https://github.com/videojs/video.js/pull/2424))
* @misteroneill create video.novtt.js in dist builds ([view](https://github.com/videojs/video.js/pull/2447))
* @misteroneill pass vtt.js option to tech ([view](https://github.com/videojs/video.js/pull/2448))
* @forbesjo updated the sauce labs config and browser versions ([view](https://github.com/videojs/video.js/pull/2450))
* @mmcc made sure controls respect muted attribute ([view](https://github.com/videojs/video.js/pull/2408))
* @dmlap switched global options back to an object at videojs.options ([view](https://github.com/videojs/video.js/pull/2461))
* @ogun fixed a typo in the Turkish translation ([view](https://github.com/videojs/video.js/pull/2460))
* @gkatsev fixed text track errors on dispose and in cross-browser testing ([view](https://github.com/videojs/video.js/pull/2466))
* @mmcc added type=button to button components ([view](https://github.com/videojs/video.js/pull/2471))
* @mmcc Fixed IE by using setAttribute to set &#x27;type&#x27; property ([view](https://github.com/videojs/video.js/pull/2487))
* @misternoneill fixed vertical slider issues ([view](https://github.com/videojs/video.js/pull/2469))
* @gkatsev moved default and player dimensions to style els at the top of HEAD ([view](https://github.com/videojs/video.js/pull/2482))
* @gkatsev moved default and player dimensions to style els at the top of HEAD el ([view](https://github.com/videojs/video.js/pull/2482))
* @gkatsev removed non-default track auto-disabling ([view](https://github.com/videojs/video.js/pull/2475))
* @gkatsev exported event helpers on videojs object ([view](https://github.com/videojs/video.js/pull/2491))
* @nickygerritsen fixed texttrack handling in IE10 ([view](https://github.com/videojs/video.js/pull/2481))
* @gkatsev deep clone el for iOS to preserve tracks ([view](https://github.com/videojs/video.js/pull/2494))
* @forbesjo switched automated testing to BrowserStack ([view](https://github.com/videojs/video.js/pull/2492))
* @gkatsev fixed nativeControlsForTouch handling. Defaults to native controls on iphone and native android browsers. ([view](https://github.com/videojs/video.js/pull/2499))
* @heff fixed cross-platform track tests by switching to a fake tech ([view](https://github.com/videojs/video.js/pull/2496))
* @gkatsev improved tech controls listener handling. ([view](https://github.com/videojs/video.js/pull/2511))
* @dmlap move seek on replay into the flash tech ([view](https://github.com/videojs/video.js/pull/2527))
* @dmlap @gkatsev improve Flash tech error property and add an error setter to the base tech ([view](https://github.com/videojs/video.js/pull/2517))
* @dmlap update to videojs-swf 5.0.0-rc1 ([view](https://github.com/videojs/video.js/pull/2528))
* @dmlap expose start and end buffered times ([view](https://github.com/videojs/video.js/pull/2501))
* @heff fixed a number of console errors after testing ([view](https://github.com/videojs/video.js/pull/2513))
* @gkatsev made the sass files available via npm in src/css ([view](https://github.com/videojs/video.js/pull/2546))
* @heff removed playerOptions from plugin options because it created an inconsistency in plugin inits ([view](https://github.com/videojs/video.js/pull/2532))
* @heff added a default data attribute to fix the progress handle display in IE8 ([view](https://github.com/videojs/video.js/pull/2547))
* @heff added back the default cdn url for the swf ([view](https://github.com/videojs/video.js/pull/2533))
* @gkatsev fixed the default state of userActive ([view](https://github.com/videojs/video.js/pull/2557))
* @heff fixed event bubbling in IE8 ([view](https://github.com/videojs/video.js/pull/2563))
* @heff cleaned up internal duration handling ([view](https://github.com/videojs/video.js/pull/2552))
* @heff fixed the UI for live streams ([view](https://github.com/videojs/video.js/pull/2557))
* @gkatsev updated opacity of caption settings background color ([view](https://github.com/videojs/video.js/pull/2573))
* @gkatsev made all sass variables !default ([view](https://github.com/videojs/video.js/pull/2574))
* @heff fixed the inline volume control and made it the default ([view](https://github.com/videojs/video.js/pull/2553))
* @forbesjo fixed webkit deprecation warnings ([view](https://github.com/videojs/video.js/pull/2558))
* @forbesjo added Android and iOS browser testing ([view](https://github.com/videojs/video.js/pull/2538))
* @heff improved css selector strengths ([view](https://github.com/videojs/video.js/pull/2583))
* @heff moved scss vars to be private ([view](https://github.com/videojs/video.js/pull/2584))
* @heff added a fancy loading spinner ([view](https://github.com/videojs/video.js/pull/2582))
* @gkatsev added a mouse-hover time display to the progress bar ([view](https://github.com/videojs/video.js/pull/2569))
* @heff added an attributes argument to createEl() ([view](https://github.com/videojs/video.js/pull/2589))
* @heff made tech related functions private in the player ([view](https://github.com/videojs/video.js/pull/2590))
* @heff removed the loadedalldata event ([view](https://github.com/videojs/video.js/pull/2591))
* @dmlap switched to using raynos/xhr for requests ([view](https://github.com/videojs/video.js/pull/2594))
* @heff Fixed double loadstart and ready events ([view](https://github.com/videojs/video.js/pull/2605))
* @gkatsev fixed potential double default style elements ([view](https://github.com/videojs/video.js/pull/2619))
* @imbcmdth extended createTimeRange to support multiple timeranges ([view](https://github.com/videojs/video.js/pull/2604))
* @misteroneill rename &quot;extends&quot; to &quot;extend&quot; for ie8 ([view](https://github.com/videojs/video.js/pull/2624))
* @forbesjo removed the PhantomJS dependency ([view](https://github.com/videojs/video.js/pull/2622))
* @misteroneill re-exposed videojs.TextTrack ([view](https://github.com/videojs/video.js/pull/2625))
* @heff removed a second copy of video.novtt.js from dist ([view](https://github.com/videojs/video.js/pull/2630))
* @heff fixed timeranges deprecation warnings in tests ([view](https://github.com/videojs/video.js/pull/2627))
* @misteroneill updated play control to use its state for icon ([view](https://github.com/videojs/video.js/pull/2636))
* @gkatsev exposed isCrossOrigin and used it to enable CORS for textTrack XHRs ([view](https://github.com/videojs/video.js/pull/2633))
* @misteroneill fixed tsml to be used as a tag for template strings ([view](https://github.com/videojs/video.js/pull/2629))
* @eXon added support for a tech-supplied poster ([view](https://github.com/videojs/video.js/pull/2339))
* @heff improved some skin defaults for external styling ([view](https://github.com/videojs/video.js/pull/2642))
* @heff changed component child lists to arrays instead of objects ([view](https://github.com/videojs/video.js/pull/2477))

## 4.12.15 (2015-08-31)
* @dmlap update to videojs-swf 4.7.4 ([view](https://github.com/videojs/video.js/pull/2463))
* @bc-bbay migrate seeking on replay to the flash tech ([view](https://github.com/videojs/video.js/pull/2519))
* Updated to v4.7.5 of the swf ([view](https://github.com/videojs/video.js/pull/2531))

## 4.12.14 (2015-08-21)
* @gkatsev removed non-default track auto-disabling ([view](https://github.com/videojs/video.js/pull/2468))

## 4.12.13 (2015-08-10)
* @dmlap update to videojs-swf v4.7.3 ([view](https://github.com/videojs/video.js/pull/2457))

## 4.12.12 (2015-07-23)
* @imbcmdth updated source handlers to use bracket notation so they wont break when using minified videojs ([view](https://github.com/videojs/video.js/pull/2348))
* @imbcmdth fix potential triggerReady infinite loop ([view](https://github.com/videojs/video.js/pull/2398))

## 4.12.11 (2015-07-09)
* @saxena-gaurav updated swf to 4.7.2 to fix flash of previous video frame ([view](https://github.com/videojs/video.js/pull/2300))
* @gkatsev updated the vtt.js version to fix JSON issues ([view](https://github.com/videojs/video.js/pull/2327))
* @dmlap fixed an error caused by calling vjs_getProperty on the swf too early ([view](https://github.com/videojs/video.js/pull/2289))

## 4.12.10 (2015-06-23)
* @dmlap update to video-js-swf 4.7.1 ([view](https://github.com/videojs/video.js/pull/2280))
* @imbcmdth src() should not return blob URLs with MSE source handlers ([view](https://github.com/videojs/video.js/pull/2271))

## 4.12.9 (2015-06-15)
* @imbcmdth updated currentSrc to return src instead of blob urls in html5 tech. Fixes #2232 ([view](https://github.com/videojs/video.js/pull/2232))
* @imbcmdth fixed async currentSrc behavior ([view](https://github.com/videojs/video.js/pull/2256))

## 4.12.8 (2015-06-05)
* @dmlap add the seekable property ([view](https://github.com/videojs/video.js/pull/2207))
* @dmlap fix seekable export ([view](https://github.com/videojs/video.js/pull/2227))

## 4.12.7 (2015-05-19)
* @tjenkinson Added background-color to vjs-poster to remove transparent borders around scaled poster image ([view](https://github.com/videojs/video.js/pull/2138))
* @bc-bbay fixed a bug where the player would try to autoplay when there was no source ([view](https://github.com/videojs/video.js/pull/2127))
* @bc-bbay update time display on loadedmetadata ([view](https://github.com/videojs/video.js/pull/2151))
* @dmlap update swf to 4.7 to pick up preload fix ([view](https://github.com/videojs/video.js/pull/2170))

## 4.12.6 (2015-05-07)
* @saxena-gaurav fixed a bug from disposing after changing techs ([view](https://github.com/videojs/video.js/pull/2125))

## 4.12.5 (2015-03-17)
* Updated to videojs-swf v4.5.4 to fix a potential security issue ([view](https://github.com/videojs/video.js/pull/1955))

## 4.12.4 (2015-03-05)
* Randomized the Google Analytics calls to stay under the limit ([view](https://github.com/videojs/video.js/pull/1916))

## 4.12.3 (2015-02-28)
* @heff fixed setting the source to an empty string ([view](https://github.com/videojs/video.js/pull/1905))

## 4.12.2 (2015-02-27)
* @gkatsev fixed disabling of default text tracks ([view](https://github.com/videojs/video.js/pull/1892))

## 4.12.1 (2015-02-19)
* @gkatsev fixed the track list reference while switching techs that use emulated tracks ([view](https://github.com/videojs/video.js/pull/1874))
* @gkatsev fixed a Firefox error with the captions settings select menu options ([view](https://github.com/videojs/video.js/pull/1877))

## 4.12.0 (2015-02-17)
* @PeterDaveHello added a Traditional Chinese translation ([view](https://github.com/videojs/video.js/pull/1729))
* @mmcc updated the hide/show functions to use a class instead of inline styles ([view](https://github.com/videojs/video.js/pull/1681))
* @mister-ben added better handling of the additional videojs() arguments when the player is already initialized ([view](https://github.com/videojs/video.js/pull/1730))
* @anhskohbo added a Vietnamese translation ([view](https://github.com/videojs/video.js/pull/1734))
* @Sxmanek added a Czech translation ([view](https://github.com/videojs/video.js/pull/1739))
* @jcaron23 added the vjs-scrubbing CSS class and prevented menus from showing while scrubbing ([view](https://github.com/videojs/video.js/pull/1741))
* @dmlap fixed URL parsing in IE9 ([view](https://github.com/videojs/video.js/pull/1765))
* @gkatsev Fixed issue where ManualTimeUpdatesOff was not de-registering events ([view](https://github.com/videojs/video.js/pull/1793))
* @brycefisher Added a guide on player disposal ([view](https://github.com/videojs/video.js/pull/1803))
* @toniher added a Catalan translation ([view](https://github.com/videojs/video.js/pull/1794))
* @mmcc added a VERSION key to the videojs object ([view](https://github.com/videojs/video.js/pull/1798))
* @mmcc fixed an issue with text track hiding introduced in #1681 ([view](https://github.com/videojs/video.js/pull/1804))
* @dmlap exported video.js as a named AMD module ([view](https://github.com/videojs/video.js/pull/1844))
* @dmlap fixed poster hiding when the loadstart event does not fire ([view](https://github.com/videojs/video.js/pull/1834))
* @chikathreesix fixed an object delete error in Chrome ([view](https://github.com/videojs/video.js/pull/1858))
* @steverandy fixed an issue with scrolling over the player on touch devices ([view](https://github.com/videojs/video.js/pull/1809))
* @mmcc improved tap sensitivity ([view](https://github.com/videojs/video.js/pull/1830))
* @mister-ben added a vjs-ended class when playback reaches the end of the timeline ([view](https://github.com/videojs/video.js/pull/1857))
* @dmlap Add network and ready state properties ([view](https://github.com/videojs/video.js/pull/1854))
* @woollybogger exported the hasClass function ([view](https://github.com/videojs/video.js/pull/1839))
* @DevGavin fixed the Chinese translation ([view](https://github.com/videojs/video.js/pull/1841))
* @iSimonWeb added font-path variable ([view](https://github.com/videojs/video.js/pull/1847))
* @shoshomiga added a Bulgarian translation ([view](https://github.com/videojs/video.js/pull/1849))
* @ragecub3 added a Turkish translation ([view](https://github.com/videojs/video.js/pull/1853))
* @gkatsev greatly improved text track support and implemented vtt.js as the webvtt parser ([view](https://github.com/videojs/video.js/pull/1749))
* @gkatsev fixed captions showing by default in Chrome and Safari ([view](https://github.com/videojs/video.js/pull/1865))
* @mister-ben fixed a woff warning in Firefox ([view](https://github.com/videojs/video.js/pull/1870))

## 4.11.4 (2015-01-23)
* @heff exported missing source handler functions ([view](https://github.com/videojs/video.js/pull/1787))
* @heff fixed type support checking for an empty src string ([view](https://github.com/videojs/video.js/pull/1797))
* @carpasse fixed a bug in updating child indexes after removing components ([view](https://github.com/videojs/video.js/pull/1814))
* @dmlap fixed a bug where native controls would show after switching techs ([view](https://github.com/videojs/video.js/pull/1811))
* @H1D fixed an issue with file extension type detection ([view](https://github.com/videojs/video.js/pull/1818))
* @bclwhitaker updated to v4.5.3 of video-js-swf ([view](https://github.com/videojs/video.js/pull/1823))

## 4.11.3 (2014-12-19)
* @gdkraus fixed a bug where you could no longer tab-navigate passed a menu button ([view](https://github.com/videojs/video.js/pull/1760))
* @matteos exported the setSource functions so source handlers will work in the minified version ([view](https://github.com/videojs/video.js/pull/1753))
* @matteos fixed RTMP playback ([view](https://github.com/videojs/video.js/pull/1755))

## 4.11.2 (2014-12-17)
* @mmcc fixed a bug where the playback rate menu would not open ([view](https://github.com/videojs/video.js/pull/1716))
* @gkatsev fixed an issue with source handlers that caused subclasses of source handler classes to break ([view](https://github.com/videojs/video.js/pull/1746))

## 4.11.1 (2014-12-04)
* @heff fixed a code bug in track XHR requests ([view](https://github.com/videojs/video.js/pull/1715))

## 4.11.0 (2014-12-04)
* @rutkat updated sliders to use keydown instead of keyup for more responsive key control ([view](https://github.com/videojs/video.js/pull/1616))
* @toloudis fixed an issue with checking for an existing source on the video element ([view](https://github.com/videojs/video.js/pull/1651))
* @rafalwrzeszcz fixed the Flash object tag markup for strict XML ([view](https://github.com/videojs/video.js/pull/1702))
* @thijstriemstra fixed a number of typos in the docs ([view](https://github.com/videojs/video.js/pull/1704))
* @heff added the Source Handler interface for handling advanced formats including adaptive streaming ([view](https://github.com/videojs/video.js/pull/1560))
* @azawawi added an Arabic translation ([view](https://github.com/videojs/video.js/pull/1692))
* @mmcc added functions for better timeout and interval handling ([view](https://github.com/videojs/video.js/pull/1642))
* @mmcc fixed the vdata exception when you dispose a player with tracks ([view](https://github.com/videojs/video.js/pull/1710))
* @nemesreviz added a Hungarian translation ([view](https://github.com/videojs/video.js/pull/1711))
* @heff updated the SWF to the latest version ([view](https://github.com/videojs/video.js/pull/1714))

## 4.10.2 (2014-10-30)
* @heff fixed checking for child options in the parent options to allow for 'false' ([view](https://github.com/videojs/video.js/pull/1630))
* @heff fixed the VolumeMenuButton options to allow passing 'vertical' to the VolumeBar ([view](https://github.com/videojs/video.js/pull/1631))
* @mmcc fixed localization of captions/subtitles menu off buttons ([view](https://github.com/videojs/video.js/pull/1632))

## 4.10.1 (2014-10-29)
@heff removed his own stupid error [view](https://github.com/videojs/video.js/commit/a12dd770572a7f16e436e2332eba7ffbb1f1b9b9)

## 4.10.0 (2014-10-28)
* @aptx4869 fixed an issue where the native JSON parser wasn&#x27;t used ([view](https://github.com/videojs/video.js/pull/1565))
* @andekande improved the German translation ([view](https://github.com/videojs/video.js/pull/1555))
* @OlehTsvirko added a Ukrainian translation ([view](https://github.com/videojs/video.js/pull/1562))
* @OlehTsvirko added a Russian translation ([view](https://github.com/videojs/video.js/pull/1563))
* @thijstriemstra added a Dutch translation ([view](https://github.com/videojs/video.js/pull/1566))
* @heff updated the poster to use CSS styles to display; fixed the poster not showing if not originally set ([view](https://github.com/videojs/video.js/pull/1568))
* @mmcc fixed an issue where errors on source tags could get missed ([view](https://github.com/videojs/video.js/pull/1575))
* @heff enhanced the event listener API to allow for auto-cleanup of listeners on other componenets and elements ([view](https://github.com/videojs/video.js/pull/1588))
* @mmcc fixed an issue with the VolumeButton assuming it was vertical by default ([view](https://github.com/videojs/video.js/pull/1592))
* @DevGavin added a Simplified Chinese translation ([view](https://github.com/videojs/video.js/pull/1593))
* @heff Added the ability to set options for child components directly in the parent options ([view](https://github.com/videojs/video.js/pull/1599))
* @heff turned on the custom html controls for touch devices ([view](https://github.com/videojs/video.js/pull/1617))

## 4.9.1 (2014-10-15)
* Bumped to videojs-swf v4.5.1 to fix a data sanitization issue ([view](https://github.com/videojs/video.js/pull/1587))

## 4.9.0 (2014-09-30)
* @deedos added a Brazilian Portuguese translation ([view](https://github.com/videojs/video.js/pull/1520))
* @baloneysandwiches added a hasClass method ([view](https://github.com/videojs/video.js/pull/1464))
* @mynameisstephen fixed an issue where slider event listeners were not being cleaned up ([view](https://github.com/videojs/video.js/pull/1475))
* @alexrqs cleaned up the Spanish translation ([view](https://github.com/videojs/video.js/pull/1494))
* @t2y added a Japanese translation ([view](https://github.com/videojs/video.js/pull/1497))
* @chikathreesix fixed an issue where data-setup options could be missed ([view](https://github.com/videojs/video.js/pull/1514))
* @seniorflexdeveloper added new translations and translation updates ([view](https://github.com/videojs/video.js/pull/1530))
* @chikathreesix exported the videojs.Flash.embed method ([view](https://github.com/videojs/video.js/pull/1533))
* @doublex fixed an issue with IE7 backwards compatibility ([view](https://github.com/videojs/video.js/pull/1542))
* @mmcc made it possible to override the font-size of captions and subtitles ([view](https://github.com/videojs/video.js/pull/1547))
* @philipgiuliani added an Italian translation ([view](https://github.com/videojs/video.js/pull/1550))
* @twentyrogersc fixed the return value when setting the poster source ([view](https://github.com/videojs/video.js/pull/1552))
* @heff updated to swf v4.5.0 to fix event issues ([view](https://github.com/videojs/video.js/pull/1554))
* @rpless made the VolumeMenuButton volume more accesible via tab navigation ([view](https://github.com/videojs/video.js/pull/1519))
* @mmcc added support for audio tags (html5 audio only) ([view](https://github.com/videojs/video.js/pull/1540))

## 4.8.5 (2014-09-25)
* Updated to the latest version of the swf to fix HLS playback ([view](https://github.com/videojs/video.js/pull/1538))

## 4.8.4 (2014-09-23)
* @gkatsev fixed isFullscreen reporting on iOS devices ([view](https://github.com/videojs/video.js/pull/1511))

## 4.8.3 (2014-09-22)
* @heff updated to the latest version of the SWF to 4.4.4 ([view](https://github.com/videojs/video.js/pull/1526))

## 4.8.2 (2014-09-16)
* @gkatsev fixed an IE11 bug where pause was not fired when the video ends ([view](https://github.com/videojs/video.js/pull/1512))

## 4.8.1 (2014-09-05)
* @dmlap fixed an issue where an error could be fired after player disposal ([view](https://github.com/videojs/video.js/pull/1481))
* @dmlap fixed poster error handling ([view](https://github.com/videojs/video.js/pull/1482))
* @dmlap fixed an issue with languages and subclassing the player ([view](https://github.com/videojs/video.js/pull/1483))
* @mmcc fixed a few CSS issues with the poster and the error 'X' ([view](https://github.com/videojs/video.js/pull/1487))
* @MrVaykadji and @Calinou added a french translation ([view](https://github.com/videojs/video.js/pull/1467))
* @heff fixed an internal deprecation warning and missing deprecated functions ([view](https://github.com/videojs/video.js/pull/1488))

## 4.8.0 (2014-09-03)
* @andekande added a German translation ([view](https://github.com/videojs/video.js/pull/1426))
* @mattosborn fixed a bug where getting the video element src would overwrite it ([view](https://github.com/videojs/video.js/pull/1430))
* @songpete fixed a bug where keyboard events were bubbling and causing additional actions ([view](https://github.com/videojs/video.js/pull/1455))
* @knabar made the inactivity timeout configurable ([view](https://github.com/videojs/video.js/pull/1409))
* @seniorflexdeveloper added language files to the distribution for including specific languages ([view](https://github.com/videojs/video.js/pull/1453))
* @gkatsev improved handling of null and NaN dimension values ([view](https://github.com/videojs/video.js/pull/1449))
* @gkatsev fixed an issue where the controls would break if Flash was initialized too quickly ([view](https://github.com/videojs/video.js/pull/1470))
* @mmcc fixed an issue where if no playback tech was supported the error could not be caught ([view](https://github.com/videojs/video.js/pull/1473))

## 4.7.3 (2014-08-20)
* Added function for adding new language translations, updated docs, and fixed the notSupportedMessage translation ([view](https://github.com/videojs/video.js/pull/1427))
* Exposed the player.selectSource method to allow overriding the source selection order ([view](https://github.com/videojs/video.js/pull/1424))

## 4.7.2 (2014-08-14)
* Fixed a case where timeupdate events were not firing, and fixed and issue with the Flash player version ([view](https://github.com/videojs/video.js/pull/1417))

## 4.7.1 (2014-08-06)
* Fixed the broken bower.json config ([view](https://github.com/videojs/video.js/pull/1401))

## 4.7.0 (2014-08-05)
* Added cross-browser isArray for cross-frame support. fixes #1195 ([view](https://github.com/videojs/video.js/pull/1218))
* Fixed support for webvtt chapters. Fixes #676. ([view](https://github.com/videojs/video.js/pull/1221))
* Fixed issues around webvtt cue time parsing. Fixed #877, fixed #183. ([view](https://github.com/videojs/video.js/pull/1236))
* Fixed an IE11 issue where clicking on the video wouldn&#x27;t show the controls ([view](https://github.com/videojs/video.js/pull/1291))
* Added a composer.json for PHP packages ([view](https://github.com/videojs/video.js/pull/1241))
* Exposed the vertical option for slider controls ([view](https://github.com/videojs/video.js/pull/1303))
* Fixed an error when disposing a tech using manual timeupdates ([view](https://github.com/videojs/video.js/pull/1312))
* Exported missing Player API methods (remainingTime, supportsFullScreen, enterFullWindow, exitFullWindow, preload) ([view](https://github.com/videojs/video.js/pull/1328))
* Added a base for running saucelabs tests from grunt ([view](https://github.com/videojs/video.js/pull/1215))
* Added additional browsers for saucelabs testing ([view](https://github.com/videojs/video.js/pull/1216))
* Added support for listening to multiple events through a types array ([view](https://github.com/videojs/video.js/pull/1231))
* Exported the vertical option for the volume slider ([view](https://github.com/videojs/video.js/pull/1378))
* Fixed Component trigger function arguments and docs ([view](https://github.com/videojs/video.js/pull/1310))
* Now copying all attributes from the original video tag to the generated video element ([view](https://github.com/videojs/video.js/pull/1321))
* Added files to be ignored in the bower.json ([view](https://github.com/videojs/video.js/pull/1337))
* Fixed an error that could happen if Flash was diposed before the ready callback was fired ([view](https://github.com/videojs/video.js/pull/1340))
* The up and down arrows can now be used to control sliders in addition to left and right ([view](https://github.com/videojs/video.js/pull/1345))
* Added a player.currentType() function to get the MIME type of the current source ([view](https://github.com/videojs/video.js/pull/1320))
* Fixed a potential conflict with other event listener shims ([view](https://github.com/videojs/video.js/pull/1363))
* Added support for multiple time ranges in the load progress bar ([view](https://github.com/videojs/video.js/pull/1253))
* Added vjs-waiting and vjs-seeking css classnames and updated the spinner to use them ([view](https://github.com/videojs/video.js/pull/1351))
* Now restoring the original video tag attributes on a tech change to support webkit-playsinline ([view](https://github.com/videojs/video.js/pull/1369))
* Fixed an issue where the user was unable to scroll/zoom page if touching the video ([view](https://github.com/videojs/video.js/pull/1373))
* Added "sliding" class for when slider is sliding to help with handle styling ([view](https://github.com/videojs/video.js/pull/1385))

## 4.6.4 (2014-07-11)
* Fixed an issue where Flash autoplay would not show the controls ([view](https://github.com/videojs/video.js/pull/1343))

## 4.6.3 (2014-06-12)
* Updated to version 4.4.1 of the SWF ([view](https://github.com/videojs/video.js/pull/1285))
* Fixed a minification issue with the fullscreen event. fixes #1282 ([view](https://github.com/videojs/video.js/pull/1286))

## 4.6.2 (2014-06-10)
* Fixed an issue with the firstplay event not firing when autoplaying ([view](https://github.com/videojs/video.js/pull/1271))

## 4.6.1 (2014-05-20)
* Udpated playbackRate menu to work in minified version ([view](https://github.com/videojs/video.js/pull/1223))

## 4.6.0 (2014-05-20)
* Updated the UI to support live video ([view](https://github.com/videojs/video.js/pull/1121))
* The UI now resets after a source change ([view](https://github.com/videojs/video.js/pull/1124))
* Now assuming smart CSS defaults for sliders to prevent reflow on player init ([view](https://github.com/videojs/video.js/pull/1122))
* Fixed the title element placement in menus [[view](https://github.com/videojs/video.js/pull/1114)]
* Fixed title support for menu buttons ([view](https://github.com/videojs/video.js/pull/1128))
* Fixed extra mousemove events on Windows caused by certain apps, not users [[view](https://github.com/videojs/video.js/pull/1068)]
* Fixed error due to undefined tech when no source is supported [[view](https://github.com/videojs/video.js/pull/1172)]
* Fixed the progress bar not finishing when manual timeupdate events are used [[view](https://github.com/videojs/video.js/pull/1173)]
* Added a more informative and styled fallback message for non-html5 browsers [[view](https://github.com/videojs/video.js/pull/1181)]
* Added the option to provide an array of child components instead of an object [[view](https://github.com/videojs/video.js/pull/1093)]
* Fixed casing on webkitRequestFullscreen [[view](https://github.com/videojs/video.js/pull/1101)]
* Made tap events on mobile less sensitive to touch moves [[view](https://github.com/videojs/video.js/pull/1111)]
* Fixed the default flag for captions/subtitles tracks [[view](https://github.com/videojs/video.js/pull/1153)]
* Fixed compilation failures with LESS v1.7.0 and GRUNT v0.4.4 [[view](https://github.com/videojs/video.js/pull/1180)]
* Added better error handling across the library [[view](https://github.com/videojs/video.js/pull/1197)]
* Updated captions/subtiles file fetching to support cross-origin requests in older IE browsers [[view](https://github.com/videojs/video.js/pull/1095)]
* Added support for playback rate switching [[view](https://github.com/videojs/video.js/pull/1132)]
* Fixed an issue with the loadstart event order that caused the big play button to not hide [[view](https://github.com/videojs/video.js/pull/1209)]
* Modernized the fullscreen API and added support for IE11 [[view](https://github.com/videojs/video.js/pull/1205)]
* Added cross-browser testing with SauceLabs, and added Karma as the default test runner ([view](https://github.com/videojs/video.js/pull/1187))
* Fixed saucelabs integration to run on commits in TravisCI ([view](https://github.com/videojs/video.js/pull/1214))
* Added a clearer error message when a tech is undefined ([view](https://github.com/videojs/video.js/pull/1210))
* Added a cog icon to the font icons ([view](https://github.com/videojs/video.js/pull/1211))
* Added a player option to offset the subtitles/captions timing ([view](https://github.com/videojs/video.js/pull/1212))

## 4.5.2 (2014-04-12)
* Updated release versioning to include bower.json and component.json

## 4.5.1 (2014-03-27)
* Fixed a bug from the last release where canPlaySource was no longer exported

## 4.5.0 (2014-03-27)
* Added component(1) support ([view](https://github.com/videojs/video.js/pull/1032))
* Captions now move down when controls are hidden ([view](https://github.com/videojs/video.js/pull/1053))
* Added the .less source file to the distribution files ([view](https://github.com/videojs/video.js/pull/1056))
* Changed src() to return the current selected source ([view](https://github.com/videojs/video.js/pull/968))
* Added a grunt task for opening the next issue that needs addressing ([view](https://github.com/videojs/video.js/pull/1059))
* Fixed Android 4.0+ devices' check for HLS support ([view](https://github.com/videojs/video.js/pull/1084))

## 4.4.3 (2014-03-06)
* Fixed bugs in IE9 Windows 7N with no Media Player ([view](https://github.com/videojs/video.js/pull/1060))
* Fixed a bug with setPoster() in the minified version ([view](https://github.com/videojs/video.js/pull/1062))

## 4.4.2 (2014-02-24)
* Fixed module.exports in minified version ([view](https://github.com/videojs/video.js/pull/1038))

## 4.4.1 (2014-02-18)
* Added .npmignore so dist files wouldn't be ignored in packages

## 4.4.0 (2014-02-18)
* Made the poster updateable after initialization ([view](https://github.com/videojs/video.js/pull/838))
* Exported more textTrack functions ([view](https://github.com/videojs/video.js/pull/815))
* Moved player ID generation to support video tags with no IDs ([view](https://github.com/videojs/video.js/pull/845))
* Moved to using QUnit as a dependency ([view](https://github.com/videojs/video.js/pull/850))
* Added the util namespace for public utility functions ([view](https://github.com/videojs/video.js/pull/862))
* Fixed an issue with calling duration before Flash is loaded ([view](https://github.com/videojs/video.js/pull/861))
* Added player methods to externs so they can be overridden ([view](https://github.com/videojs/video.js/pull/878))
* Fixed html5 playback when switching between media techs ([view](https://github.com/videojs/video.js/pull/887))
* Fixed Firefox+Flash mousemove events so controls don't hide permanently ([view](https://github.com/videojs/video.js/pull/899))
* Fixed a test for touch detection ([view](https://github.com/videojs/video.js/pull/962))
* Updated the src file list for karma tests ([view](https://github.com/videojs/video.js/pull/948))
* Added more tests for API properties after minification ([view](https://github.com/videojs/video.js/pull/906))
* Updated projet to use npm version of videojs-swf ([view](https://github.com/videojs/video.js/pull/930))
* Added support for dist zipping on windows ([view](https://github.com/videojs/video.js/pull/944))
* Fixed iOS fullscreen issue ([view](https://github.com/videojs/video.js/pull/977))
* Fixed touch event bubbling ([view](https://github.com/videojs/video.js/pull/992))
* Fixed ARIA role attribute for button and slider ([view](https://github.com/videojs/video.js/pull/988))
* Fixed an issue where a component's dispose event would bubble up ([view](https://github.com/videojs/video.js/pull/981))
* Quieted down deprecation warnings ([view](https://github.com/videojs/video.js/pull/971))
* Updated the seek handle to contain the current time ([view](https://github.com/videojs/video.js/pull/902))
* Added requirejs and browserify support (UMD) ([view](https://github.com/videojs/video.js/pull/998))

## 4.3.0 (2013-11-04)
* Added Karma for cross-browser unit testing ([view](https://github.com/videojs/video.js/pull/714))
* Unmuting when the volume is changed ([view](https://github.com/videojs/video.js/pull/720))
* Fixed an accessibility issue with the big play button ([view](https://github.com/videojs/video.js/pull/777))
* Exported user activity methods ([view](https://github.com/videojs/video.js/pull/783))
* Added a classname to center the play button and new spinner options ([view](https://github.com/videojs/video.js/pull/784))
* Added API doc generation ([view](https://github.com/videojs/video.js/pull/801))
* Added support for codecs in Flash mime types ([view](https://github.com/videojs/video.js/pull/805))

## 4.2.2 (2013-10-15)
* Fixed a race condition that would cause videos to fail in Firefox ([view](https://github.com/videojs/video.js/pull/776))

## 4.2.1 (2013-09-09)
* Fixed an infinite loop caused by loading the library asynchronously ([view](https://github.com/videojs/video.js/pull/727))

## 4.2.0 (2013-09-04)
* Added LESS as a CSS preprocessor for the default skin ([view](https://github.com/videojs/video.js/pull/644))
* Exported MenuButtons for use in the API ([view](https://github.com/videojs/video.js/pull/648))
* Fixed ability to remove listeners added with one() ([view](https://github.com/videojs/video.js/pull/659))
* Updated buffered() to account for multiple loaded ranges ([view](https://github.com/videojs/video.js/pull/643))
* Exported createItems() for custom menus ([view](https://github.com/videojs/video.js/pull/654))
* Preventing media events from bubbling up the DOM ([view](https://github.com/videojs/video.js/pull/630))
* Major reworking of the control bar and many issues fixed ([view](https://github.com/videojs/video.js/pull/672))
* Fixed an issue with minifiying the code on Windows systems ([view](https://github.com/videojs/video.js/pull/683))
* Added support for RTMP streaming through Flash ([view](https://github.com/videojs/video.js/pull/605))
* Made tech.features available to external techs ([view](https://github.com/videojs/video.js/pull/705))
* Minor code improvements ([view](https://github.com/videojs/video.js/pull/706))
* Updated time formatting to support NaN and Infinity ([view](https://github.com/videojs/video.js/pull/627))
* Fixed an `undefined` error in cases where no tech is loaded ([view](https://github.com/videojs/video.js/pull/632))
* Exported addClass and removeClass for player components ([view](https://github.com/videojs/video.js/pull/661))
* Made the fallback message customizable ([view](https://github.com/videojs/video.js/pull/638))
* Fixed an issue with the loading spinner placement and rotation ([view](https://github.com/videojs/video.js/pull/694))
* Fixed an issue with fonts being flaky in IE8

## 4.1.0 (2013-06-28)
* Turned on method queuing for unready playback technologies (flash) [view](https://github.com/videojs/video.js/pull/553)
* Blocking user text selection on player components [view](https://github.com/videojs/video.js/pull/524)
* Exported requestFullScreen() and cancelFullScreen() in the minified version [view](https://github.com/videojs/video.js/pull/555)
* Exported the global players reference, videojs.players [view](https://github.com/videojs/video.js/pull/560)
* Added google analytics to the CDN version ([view](https://github.com/videojs/video.js/pull/568))
* Exported fadeIn/fadeOut for the Component API ([view](https://github.com/videojs/video.js/pull/581))
* Fixed an IE poster error when autoplaying ([view](https://github.com/videojs/video.js/pull/593))
* Exported bufferedPercent for the API ([view](https://github.com/videojs/video.js/pull/588))
* Augmented user agent detection, specifically for Android versions ([view](https://github.com/videojs/video.js/pull/470))
* Fixed IE9 canPlayType error ([view](https://github.com/videojs/video.js/pull/606))
* Fixed various issues with captions ([view](https://github.com/videojs/video.js/pull/609))

## 4.0.4 (2013-06-11)
* Added google analytics to current CDN version. ([view](https://github.com/videojs/video.js/pull/571))

## 4.0.3 (2013-05-28)
* Fixed an bug with exiting fullscreen. [view](https://github.com/videojs/video.js/pull/546)

## 4.0.2 (2013-05-23)
* Correct version number for CDN swf url. Minify CSS. [view](https://github.com/videojs/video.js/pull/535)

## 4.0.1 (2013-05-22)
* Fixed old IE font loading [view](https://github.com/videojs/video.js/pull/532)

## 4.0.0 (2013-05-09)
* Improved performance through an 18% size reduction using Google Closure Compiler in advanced mode
* Greater stability through an automated cross-browser/device test suite using TravisCI, Bunyip, and Browserstack.
* New plugin interface and plugin listing for extending Video.js
* New default skin design that uses font icons for greater customization
* Responsive design and retina display support
* Improved accessibility through better ARIA support
* Moved to Apache 2.0 license
* 100% JavaScript development tool set including Grunt
* Updated docs to use Github markdown
* Allow disabling of default components
* Duration is now setable (need ed for HLS m3u8 files)
* Event binders (on/off/one) now return the player instance
* Stopped player from going back to beginning on ended event
* Added support for percent width/height and fluid layouts
* Improved load order of elements to reduce reflow
* Changed addEvent function name to 'on'
* Removed conflicting array.indexOf function
* Added exitFullScreen to support BlackBerry devices (pull/143)

## 3.2.0 (2012-03-20)
* Updated docs with more options.
* Overhauled HTML5 Track support.
* Fixed Flash always autoplaying when setting source.
* Fixed localStorage context
* Updated 'fullscreenchange' event to be called even if the user presses escape to exit fullscreen.
* Automatically converting URsource URL to absolute for Flash fallback.
* Created new 'loadedalldata' event for when  the source is completely downloaded
* Improved player.destroy(). Now removes elements and references.
* Refactored API to be more immediately available.

### Patches
* 3.2.1 (2012-04-06) Fixed setting width/height with javascript options
* 3.2.2 (2012-05-02) Fixed error with multiple controls fading listeners
* 3.2.3 (2012-11-12) Fixed chrome spinner continuing on seek

## 3.1.0 (2012-01-30)
* Added CSS fix for Firefox 9 fullscreen (in the rare case that it's enabled)
* Replaced swfobject with custom embed to save file size.
* Added  flash iframe-mode, an experimental method for getting around flash reloading issues.
* Fixed issue with volume knob position. Improved controls fading.
* Fixed ian issue with triggering fullscreen a second time.
* Fixed issue with getting attributes in Firefox 3.0
* Escaping special characters in source URL for Flash
* Added a check for if Firefox is enabled which fixes a Firefox 9 issue
* Stopped spinner from showing on 'stalled' events since browsers sometimes don't show that they've recovered.
* Fixed CDN Version which was breaking dev.html
* Made full-window mode more independent
* Added rakefile for release generation

## 3.0.0 (2012-01-10)
* Same HTML/CSS Skin for both HTML5 and Flash video
* Super lightweight Flash fallback player for browsers that don’t support HTML5 video
* Free CDN hosting

### Patches
* 3.0.2 (2012-01-12) Started tracking changes with zenflow
* 3.0.3 (2012-01-12) Added line to docs to test zenflow
* 3.0.4 (2012-01-12) Fixing an undefined source when no sources exist on load
* 3.0.5 (2012-01-12) Removed deprecated event.layerX and layerY
* 3.0.6 (2012-01-12) Fixed wrong URL for CDN in docs
* 3.0.7 (2012-01-12) Fixed an ie8 breaking bug with the poster
* 3.0.8 (2012-01-23) Fixed issue with controls not hiding in IE due to no opacity support
