# Changelog

## [10.0.0](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-rc.5...@videojs/core@10.0.0) (2026-10-01)


### Features

* **packages:** release Video.js 10.0.0 as stable ([#3058](https://github.com/videojs/v10/issues/3058)) ([37477fc](https://github.com/videojs/v10/commit/37477fc187f36fc2ab3cbc0db7c1b2d3fc6bcca9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0
    * @videojs/store bumped to 10.0.0
    * @videojs/utils bumped to 10.0.0

## [10.0.0-rc.5](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-rc.4...@videojs/core@10.0.0-rc.5) (2026-10-01)


### ⚠ BREAKING CHANGES

* **packages:** attach extensions at the player ([#2880](https://github.com/videojs/v10/issues/2880))
* **media:** tidy text track state ([#3057](https://github.com/videojs/v10/issues/3057))
* **core:** align player store API ([#3012](https://github.com/videojs/v10/issues/3012))

### Features

* **core:** add deriveCustomStatus to display custom actions ([#3064](https://github.com/videojs/v10/issues/3064)) ([5b4ed5e](https://github.com/videojs/v10/commit/5b4ed5e323f48b0f674f0c5640ee41c527f10f81))
* **packages:** export a per-package VERSION from core, html, and react ([#3078](https://github.com/videojs/v10/issues/3078)) ([bd8f072](https://github.com/videojs/v10/commit/bd8f072a6591079b64baf20b18af52a415195b97))


### Bug Fixes

* **core:** preserve submenu exit transitions ([#3025](https://github.com/videojs/v10/issues/3025)) ([89c1c58](https://github.com/videojs/v10/commit/89c1c5803d152025e88f34e0d1782bbd52632d67))


### Code Refactoring

* **core:** align player store API ([#3012](https://github.com/videojs/v10/issues/3012)) ([d1f57f8](https://github.com/videojs/v10/commit/d1f57f8ea733d10247b8e9bd9f8b5577e52ed66b))
* **media:** tidy text track state ([#3057](https://github.com/videojs/v10/issues/3057)) ([614b77d](https://github.com/videojs/v10/commit/614b77dce7d9a3ed60baa1b0e2af854c8c8d865b))
* **packages:** attach extensions at the player ([#2880](https://github.com/videojs/v10/issues/2880)) ([9b6675e](https://github.com/videojs/v10/commit/9b6675e3cfe50e3b54f4d4d07a563a4fdc712291))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-rc.5
    * @videojs/store bumped to 10.0.0-rc.5
    * @videojs/utils bumped to 10.0.0-rc.5

## [10.0.0-rc.4](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-rc.3...@videojs/core@10.0.0-rc.4) (2026-09-26)


### Miscellaneous Chores

* **@videojs/core:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-rc.4
    * @videojs/store bumped to 10.0.0-rc.4
    * @videojs/utils bumped to 10.0.0-rc.4

## [10.0.0-rc.3](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-rc.2...@videojs/core@10.0.0-rc.3) (2026-09-25)


### Features

* about-this-player page and a help link in every player ([#2758](https://github.com/videojs/v10/issues/2758)) ([8a538a5](https://github.com/videojs/v10/commit/8a538a572945c2bb01cb79d38f420ec143a4239c))
* **installation:** add versioned agent instructions ([#2948](https://github.com/videojs/v10/issues/2948)) ([a602f22](https://github.com/videojs/v10/commit/a602f220aedf9c2800983daade6ca298ada007ab))
* **skin:** add title display ([#2748](https://github.com/videojs/v10/issues/2748)) ([bc007bd](https://github.com/videojs/v10/commit/bc007bd9c01083507f493883b6eb047992937f79))
* **spf:** support apple json chapters from ext-x-session-data ([#2737](https://github.com/videojs/v10/issues/2737)) ([f3c2caf](https://github.com/videojs/v10/commit/f3c2caf5abcbe78e7f2d93f6a2603ef4f20741ab))


### Bug Fixes

* **core:** apply popup starting styles before showing ([#2715](https://github.com/videojs/v10/issues/2715)) ([a80aeca](https://github.com/videojs/v10/commit/a80aecadecc1a7dee643c6a7200cc09dfa8c4f9e))
* **core:** keep controls visible when seeking in Safari 16 ([#2962](https://github.com/videojs/v10/issues/2962)) ([2f5cf27](https://github.com/videojs/v10/commit/2f5cf2765315199e45623f5760b20d9a52acf4db))
* **core:** move focus before hiding menu pages ([#2968](https://github.com/videojs/v10/issues/2968)) ([3aba794](https://github.com/videojs/v10/commit/3aba794a72fbcc21ecbdf3e9b79ad6f64d717077))
* **core:** position and hide popups without the Popover API ([#2963](https://github.com/videojs/v10/issues/2963)) ([b0e24df](https://github.com/videojs/v10/commit/b0e24dfcbb2738dfdf0b6250880b42e5f9dd0aeb))
* **i18n:** correct Arabic control labels and retranslate error strings ([#2803](https://github.com/videojs/v10/issues/2803)) ([cdb8815](https://github.com/videojs/v10/commit/cdb8815be5a7957bf97f132864b4d903ae0ab2e5))
* **i18n:** correct Azerbaijani mute labels, captions term and error strings ([#2814](https://github.com/videojs/v10/issues/2814)) ([e1c7a25](https://github.com/videojs/v10/commit/e1c7a256309de91f713c1dfb7f7f9d50b12743da))
* **i18n:** correct Bosnian button labels and retranslate error strings ([#2795](https://github.com/videojs/v10/issues/2795)) ([5342901](https://github.com/videojs/v10/commit/53429010527abba061ab6c76bcb0ae0a7d368ee8))
* **i18n:** correct Bulgarian control labels and retranslate error strings ([#2782](https://github.com/videojs/v10/issues/2782)) ([99eacbe](https://github.com/videojs/v10/commit/99eacbec0dde1a66815bf52f5324676b8c92c7ea))
* **i18n:** correct Catalan imperatives and retranslate error strings ([#2798](https://github.com/videojs/v10/issues/2798)) ([ae8628b](https://github.com/videojs/v10/commit/ae8628bd90b9586628cd3de0d593f96f1a727457))
* **i18n:** correct Croatian button labels and retranslate error strings ([#2790](https://github.com/videojs/v10/issues/2790)) ([9b809bf](https://github.com/videojs/v10/commit/9b809bf81d28ad8c589faf176d5cbd9b26166d59))
* **i18n:** correct Czech subtitle announcements and error strings ([#2787](https://github.com/videojs/v10/issues/2787)) ([45ed005](https://github.com/videojs/v10/commit/45ed0052a4e8a1d3b682dcb6e1e09c49da8f4ed2))
* **i18n:** correct Danish button labels and retranslate error strings ([#2802](https://github.com/videojs/v10/issues/2802)) ([1482387](https://github.com/videojs/v10/commit/1482387a0e383a4c9f66d3ca629282a599ac0e50))
* **i18n:** correct Dutch button labels and retranslate error strings ([#2770](https://github.com/videojs/v10/issues/2770)) ([fb4e1c5](https://github.com/videojs/v10/commit/fb4e1c5a5ac8d1c49ae2ffe8de3accbac55018a9))
* **i18n:** correct Estonian control labels and retranslate error strings ([#2789](https://github.com/videojs/v10/issues/2789)) ([5cd376e](https://github.com/videojs/v10/commit/5cd376edf9f15b2ce81b3ae18e08449067727922))
* **i18n:** correct European Portuguese labels and error strings ([#2781](https://github.com/videojs/v10/issues/2781)) ([6e306c6](https://github.com/videojs/v10/commit/6e306c6a0864cd4cbd66ab97b5d9db5146c51eeb))
* **i18n:** correct Finnish control labels and retranslate error strings ([#2779](https://github.com/videojs/v10/issues/2779)) ([b570a92](https://github.com/videojs/v10/commit/b570a927370257219c6800ebd4e2c829a2a31e44))
* **i18n:** correct galician unmute label and retranslate error strings ([#2768](https://github.com/videojs/v10/issues/2768)) ([1c19b0a](https://github.com/videojs/v10/commit/1c19b0a8b6a8e5823042e4cd4d00cee6fb4758b2))
* **i18n:** correct German control labels and retranslate error strings ([#2772](https://github.com/videojs/v10/issues/2772)) ([57ff8af](https://github.com/videojs/v10/commit/57ff8af9237fc46a799cd05b1e0588906f0614ee))
* **i18n:** correct Greek mixed-script labels and error strings ([#2783](https://github.com/videojs/v10/issues/2783)) ([96be7ec](https://github.com/videojs/v10/commit/96be7ec50a415d357c403b70b330baaf0cbe5e8d))
* **i18n:** correct Hebrew control labels and retranslate error strings ([#2778](https://github.com/videojs/v10/issues/2778)) ([31fd2a8](https://github.com/videojs/v10/commit/31fd2a87aec2bd185d2ab44d20127e030c931d51))
* **i18n:** correct Hungarian seek labels and retranslate error strings ([#2800](https://github.com/videojs/v10/issues/2800)) ([f41aa6f](https://github.com/videojs/v10/commit/f41aa6fb42dd7612f64cfbfb8fa9514c2216dbcd))
* **i18n:** correct Indonesian seek label and time suffix word order ([#2812](https://github.com/videojs/v10/issues/2812)) ([798f818](https://github.com/videojs/v10/commit/798f8183fbb25c845f32c3962d4b75bf71692926))
* **i18n:** correct italian control labels and retranslate error strings ([#2769](https://github.com/videojs/v10/issues/2769)) ([6cf4a6c](https://github.com/videojs/v10/commit/6cf4a6c37de42be5a0e61048e66ea1d3779fe80a))
* **i18n:** correct Japanese control labels and retranslate error strings ([#2771](https://github.com/videojs/v10/issues/2771)) ([0b4639f](https://github.com/videojs/v10/commit/0b4639f94442f30b6e68143f26cd31645cc46d38))
* **i18n:** correct Korean control labels and retranslate error strings ([#2773](https://github.com/videojs/v10/issues/2773)) ([3db4ead](https://github.com/videojs/v10/commit/3db4eadeae400bb16a942369b7feb19de68500ba))
* **i18n:** correct Latvian caption and cast terms and error strings ([#2793](https://github.com/videojs/v10/issues/2793)) ([a9f5129](https://github.com/videojs/v10/commit/a9f51295d9652201d5ab7f25d8da77be71f00610))
* **i18n:** correct Marathi captions, verbs and error strings ([#2810](https://github.com/videojs/v10/issues/2810)) ([1b3ba69](https://github.com/videojs/v10/commit/1b3ba69e590fbae71d73c287f06aa412bbe7510e))
* **i18n:** correct Nepali control labels and error strings ([#2813](https://github.com/videojs/v10/issues/2813)) ([b0f682e](https://github.com/videojs/v10/commit/b0f682ee1501465c0cda7db970a60de4f5e886e7))
* **i18n:** correct Norwegian Bokmål player labels and error strings ([#2788](https://github.com/videojs/v10/issues/2788)) ([480883c](https://github.com/videojs/v10/commit/480883c41e0c960b92f3a1a632499b1899596f99))
* **i18n:** correct Occitan control labels and retranslate error strings ([#2796](https://github.com/videojs/v10/issues/2796)) ([d5cd82b](https://github.com/videojs/v10/commit/d5cd82b2112a32ebf0a4b4393c1954b67aa41d59))
* **i18n:** correct Persian control labels and retranslate error strings ([#2784](https://github.com/videojs/v10/issues/2784)) ([02430b7](https://github.com/videojs/v10/commit/02430b76911846479bb6392080620d393ee30cea))
* **i18n:** correct Polish announcements and retranslate error strings ([#2785](https://github.com/videojs/v10/issues/2785)) ([9a112dd](https://github.com/videojs/v10/commit/9a112dd952893e552244e05eaecb746b29739f5a))
* **i18n:** correct Romanian button labels and retranslate error strings ([#2797](https://github.com/videojs/v10/issues/2797)) ([d00e28a](https://github.com/videojs/v10/commit/d00e28a432c70ae3b55c02dc05256c61db696270))
* **i18n:** correct Russian button labels and retranslate error strings ([#2776](https://github.com/videojs/v10/issues/2776)) ([4d88902](https://github.com/videojs/v10/commit/4d88902a8a241665fbabe75ebc7811238fb1e866))
* **i18n:** correct Scottish Gaelic captions and pip terms and errors ([#2804](https://github.com/videojs/v10/issues/2804)) ([6ba1c7e](https://github.com/videojs/v10/commit/6ba1c7e02ad3a9f266d0147b6dd16485af6f1768))
* **i18n:** correct Serbian script mix, cast wording and error strings ([#2801](https://github.com/videojs/v10/issues/2801)) ([8ed5dfa](https://github.com/videojs/v10/commit/8ed5dfafd250b98789d80e1666c345bd14be585f))
* **i18n:** correct Slovak exit labels and retranslate error strings ([#2792](https://github.com/videojs/v10/issues/2792)) ([5edd0dd](https://github.com/videojs/v10/commit/5edd0dd07f5dcc786efe2ef2483f85e9c8e73cc6))
* **i18n:** correct Slovenian caption announcements and error strings ([#2806](https://github.com/videojs/v10/issues/2806)) ([ca083bf](https://github.com/videojs/v10/commit/ca083bf22d0c00c10a9a926c424e96b543bf5e21))
* **i18n:** correct Spanish button labels and retranslate error strings ([#2767](https://github.com/videojs/v10/issues/2767)) ([747fc83](https://github.com/videojs/v10/commit/747fc831f878c68d3196cd1b9917719acda03ee7))
* **i18n:** correct Swedish player labels and retranslate error strings ([#2775](https://github.com/videojs/v10/issues/2775)) ([c01e708](https://github.com/videojs/v10/commit/c01e708d251255beaa5d28c728370d5fbf27211a))
* **i18n:** correct Telugu control labels and retranslate error strings ([#2815](https://github.com/videojs/v10/issues/2815)) ([073898b](https://github.com/videojs/v10/commit/073898bbd8c168405e57b486e990661dbd23d59e))
* **i18n:** correct Thai player terminology and retranslate error strings ([#2808](https://github.com/videojs/v10/issues/2808)) ([94083d1](https://github.com/videojs/v10/commit/94083d14b9ba2303d4a4f3d8f590bab69a4e1997))
* **i18n:** correct Turkish control labels and retranslate error strings ([#2786](https://github.com/videojs/v10/issues/2786)) ([d27b4a5](https://github.com/videojs/v10/commit/d27b4a5e9ff43923e6acfeb036ce874e6814ce15))
* **i18n:** correct Ukrainian player terms and retranslate error strings ([#2780](https://github.com/videojs/v10/issues/2780)) ([d2dc0de](https://github.com/videojs/v10/commit/d2dc0dec71ec96402e61d9264fe9b95095a52498))
* **i18n:** correct Vietnamese captions and pip terms and error strings ([#2811](https://github.com/videojs/v10/issues/2811)) ([4241deb](https://github.com/videojs/v10/commit/4241deb7acfa6a1fe4f702f618d278ec354d5b0d))
* **i18n:** correct Welsh mute and seek labels and error strings ([#2799](https://github.com/videojs/v10/issues/2799)) ([65b0dcb](https://github.com/videojs/v10/commit/65b0dcb51f96f9f5460768d6465d7862636932fc))
* **i18n:** correct zh-CN unmute label, punctuation and error strings ([#2774](https://github.com/videojs/v10/issues/2774)) ([54b6c5a](https://github.com/videojs/v10/commit/54b6c5a6cc3393fd0c8de21d3bc208a59acdf352))
* **i18n:** fix Nynorsk word errors and retranslate error strings ([#2794](https://github.com/videojs/v10/issues/2794)) ([a6ce64d](https://github.com/videojs/v10/commit/a6ce64d3da18e85b8ff1a14fc89b216f16b6cef2))
* **i18n:** replace mainland terms in zh-TW and fix error strings ([#2777](https://github.com/videojs/v10/issues/2777)) ([67547e4](https://github.com/videojs/v10/commit/67547e49666c4f92d878239468deac667ba9ac1d))
* **i18n:** retranslate French error strings and fix typography ([#2791](https://github.com/videojs/v10/issues/2791)) ([0f2ec05](https://github.com/videojs/v10/commit/0f2ec05be65a642e38d7660de038de38eb0f1917))
* **i18n:** retranslate pt-BR error strings and playback-rate label ([#2809](https://github.com/videojs/v10/issues/2809)) ([641ba65](https://github.com/videojs/v10/commit/641ba6514a8faa3ed317fc656407d1805cff6f56))
* **i18n:** unify Hindi player terms and retranslate error strings ([#2807](https://github.com/videojs/v10/issues/2807)) ([394883b](https://github.com/videojs/v10/commit/394883b18b131162a97a8709bc8415de2d21411e))
* **packages:** prevent menu highlight flicker ([#2969](https://github.com/videojs/v10/issues/2969)) ([461dbcf](https://github.com/videojs/v10/commit/461dbcfdde0c13481f6604cfe5632f9af6232416))
* **site:** improve markdown for agents ([#2883](https://github.com/videojs/v10/issues/2883)) ([d5c8e3c](https://github.com/videojs/v10/commit/d5c8e3cde77cbbe74ecc6878dbd7862db8628bfa))


### Performance Improvements

* **site:** faster docs dev server start ([#2698](https://github.com/videojs/v10/issues/2698)) ([33d3887](https://github.com/videojs/v10/commit/33d38873ed5337a5695eaa426a5ebfbea61356d2))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-rc.3
    * @videojs/store bumped to 10.0.0-rc.3
    * @videojs/utils bumped to 10.0.0-rc.3

## [10.0.0-rc.2](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-rc.1...@videojs/core@10.0.0-rc.2) (2026-09-09)


### ⚠ BREAKING CHANGES

* **react:** make thumbnail composable ([#2566](https://github.com/videojs/v10/issues/2566))
* **react:** make poster composable ([#2563](https://github.com/videojs/v10/issues/2563))

### Features

* **packages:** handle controls before media metadata ([#2525](https://github.com/videojs/v10/issues/2525)) ([feed475](https://github.com/videojs/v10/commit/feed475b42186340162b92e3366f132729b6b0f9))
* **react:** make poster composable ([#2563](https://github.com/videojs/v10/issues/2563)) ([def9bf2](https://github.com/videojs/v10/commit/def9bf21d39cce091bf31c1b36651fceb8c25687))
* **react:** make thumbnail composable ([#2566](https://github.com/videojs/v10/issues/2566)) ([55b36ab](https://github.com/videojs/v10/commit/55b36ab31a07ae54ca084bd470a61cfc760a8e13))


### Bug Fixes

* **packages:** stabilize slider keyboard input ([#2553](https://github.com/videojs/v10/issues/2553)) ([bd9d946](https://github.com/videojs/v10/commit/bd9d9466df1a9c0cf2fb1fbbf5ed0dfe6302d2c6))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-rc.2
    * @videojs/store bumped to 10.0.0-rc.2
    * @videojs/utils bumped to 10.0.0-rc.2

## [10.0.0-rc.1](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.32...@videojs/core@10.0.0-rc.1) (2026-09-08)


### ⚠ BREAKING CHANGES

* **packages:** adapter renaming ([#2602](https://github.com/videojs/v10/issues/2602))
* **packages:** playback adapters packages ([#2567](https://github.com/videojs/v10/issues/2567))

### Features

* **packages:** share menu option state across targets ([#2528](https://github.com/videojs/v10/issues/2528)) ([4392cd6](https://github.com/videojs/v10/commit/4392cd6f7fa92dd3bb329b5a92206f5bf27a75b2))
* **skin:** add VJSC video skins ([#2479](https://github.com/videojs/v10/issues/2479)) ([f3640c7](https://github.com/videojs/v10/commit/f3640c7ae912fd20e2da40109228871d48c2bfc8))
* **vjsc:** add named render targets ([#2527](https://github.com/videojs/v10/issues/2527)) ([5b606d2](https://github.com/videojs/v10/commit/5b606d2026bb9528167f64b4b731145ceb1224f2))


### Bug Fixes

* **core:** avoid Turbopack circular dependency ([#2561](https://github.com/videojs/v10/issues/2561)) ([d5cffbd](https://github.com/videojs/v10/commit/d5cffbd9f790b277d9dc1805df765a990be26b1d))
* **core:** stop waiting from latching when readyState never recovers ([#2574](https://github.com/videojs/v10/issues/2574)) ([2d05ded](https://github.com/videojs/v10/commit/2d05ded2f36fe368cda4abc7a7451b2145b87914))
* **core:** suppress repeated volume boundary feedback ([#2475](https://github.com/videojs/v10/issues/2475)) ([29ad654](https://github.com/videojs/v10/commit/29ad6547f061c304a87ed723197a8486a896a614))
* **packages:** isolate focused slider hotkeys ([#2474](https://github.com/videojs/v10/issues/2474)) ([0f7b08f](https://github.com/videojs/v10/commit/0f7b08f8a9c8948cf35a0b1c8d4d411f1bf166c3))
* **packages:** preserve fullscreen after pointer activation ([#2472](https://github.com/videojs/v10/issues/2472)) ([b526c44](https://github.com/videojs/v10/commit/b526c444efae99873946eafa607673b19c6978f0))
* **packages:** restore ejected player registration and slider press locking ([#2505](https://github.com/videojs/v10/issues/2505)) ([36bb836](https://github.com/videojs/v10/commit/36bb83600622aff75169f4fe5d039f17e9f1f7d9))
* **packages:** scope error dialogs to player containers ([#2449](https://github.com/videojs/v10/issues/2449)) ([9fbc979](https://github.com/videojs/v10/commit/9fbc9790189b5df8d5d047eaf01605d6e8d7fb6b))
* **packages:** share input action defaults ([#2484](https://github.com/videojs/v10/issues/2484)) ([db1221c](https://github.com/videojs/v10/commit/db1221c7ebd019b58dced646fc4223d816e48bca))
* scale seek-bar thumbnails to fill their box ([#2517](https://github.com/videojs/v10/issues/2517)) ([28ea8ad](https://github.com/videojs/v10/commit/28ea8add9a80d165fdc2b5690c1307952ec9c03c))
* **skins:** improve generated skin parity ([#2580](https://github.com/videojs/v10/issues/2580)) ([c8b7006](https://github.com/videojs/v10/commit/c8b7006a55f71b2a0d257413cac2091792278560))


### Code Refactoring

* **packages:** adapter renaming ([#2602](https://github.com/videojs/v10/issues/2602)) ([b964889](https://github.com/videojs/v10/commit/b964889fdf68a4cdaf4686ef96bb0e8c8f2f4abd))
* **packages:** playback adapters packages ([#2567](https://github.com/videojs/v10/issues/2567)) ([12b08e3](https://github.com/videojs/v10/commit/12b08e3b0c3c07e5948f74a8cf6fce96c8b8eba7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-rc.1
    * @videojs/store bumped to 10.0.0-rc.1
    * @videojs/utils bumped to 10.0.0-rc.1

## [10.0.0-beta.32](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.31...@videojs/core@10.0.0-beta.32) (2026-08-26)


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

* **core:** preserve anchored popovers while scrolling ([#2387](https://github.com/videojs/v10/issues/2387)) ([b030c91](https://github.com/videojs/v10/commit/b030c91736610b8b3ec7e9ac32f638d64f2cc8ec))
* **packages:** improve menu behavior and sizing ([#2440](https://github.com/videojs/v10/issues/2440)) ([0d90572](https://github.com/videojs/v10/commit/0d9057268c59d17a4c91f1f84a60333cf082fd38))
* **packages:** restore minimal volume controls ([#2386](https://github.com/videojs/v10/issues/2386)) ([2e9c1e2](https://github.com/videojs/v10/commit/2e9c1e221e4eca5dbc76e01718fabf82c433a483))
* **test:** restore e2e test coverage ([#2401](https://github.com/videojs/v10/issues/2401)) ([405bd2a](https://github.com/videojs/v10/commit/405bd2ac3bb5f08f70417c9e8eb4fd7eb0cac760))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-beta.32
    * @videojs/store bumped to 10.0.0-beta.32
    * @videojs/utils bumped to 10.0.0-beta.32

## [10.0.0-beta.31](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.30...@videojs/core@10.0.0-beta.31) (2026-08-21)


### Features

* **packages:** add right-to-left player support ([#2281](https://github.com/videojs/v10/issues/2281)) ([caf179b](https://github.com/videojs/v10/commit/caf179b83260a242a7ff284d1d474f97a91988a9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-beta.31
    * @videojs/store bumped to 10.0.0-beta.31
    * @videojs/utils bumped to 10.0.0-beta.31

## [10.0.0-beta.30](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.29...@videojs/core@10.0.0-beta.30) (2026-08-20)


### ⚠ BREAKING CHANGES

* **packages:** configure orientation lock through providers ([#1999](https://github.com/videojs/v10/issues/1999))

### Features

* **packages:** add title component ([#1997](https://github.com/videojs/v10/issues/1997)) ([0841131](https://github.com/videojs/v10/commit/0841131c293a77662ab3417b8ccbb9839d69fb12))
* **packages:** configure orientation lock through providers ([#1999](https://github.com/videojs/v10/issues/1999)) ([e8829a2](https://github.com/videojs/v10/commit/e8829a2ccf95c0a244bd40134b4f244ad6ccdeaf))
* **site:** document metadata feature ([#2000](https://github.com/videojs/v10/issues/2000)) ([8bc1568](https://github.com/videojs/v10/commit/8bc156874f638e595ca2e3c8918b6075f738f720))


### Bug Fixes

* **packages:** load posters and storyboard thumbnails in cross-origin-isolated pages ([#2273](https://github.com/videojs/v10/issues/2273)) ([459fddb](https://github.com/videojs/v10/commit/459fddb7282770963bd28d42ed6c7a572845b88b))
* **skin:** stabilize menu sizing and motion ([#2283](https://github.com/videojs/v10/issues/2283)) ([191538e](https://github.com/videojs/v10/commit/191538e99935ffdced88e77fef55405410558562))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-beta.30
    * @videojs/store bumped to 10.0.0-beta.30
    * @videojs/utils bumped to 10.0.0-beta.30

## [10.0.0-beta.29](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.28...@videojs/core@10.0.0-beta.29) (2026-08-19)


### ⚠ BREAKING CHANGES

* **packages:** resolve the poster in the store, and set src on img from it ([#2039](https://github.com/videojs/v10/issues/2039))
* **packages:** name the resolved title `title`, and take it from config only ([#2176](https://github.com/videojs/v10/issues/2176))

### Features

* **packages:** name the resolved title `title`, and take it from config only ([#2176](https://github.com/videojs/v10/issues/2176)) ([969cf56](https://github.com/videojs/v10/commit/969cf567b3125e437d8f68982f655ee4255409ae))
* **packages:** resolve the poster in the store, and set src on img from it ([#2039](https://github.com/videojs/v10/issues/2039)) ([7a902db](https://github.com/videojs/v10/commit/7a902db20e9ec335eb27a6cee6aaa6a7c0d0e29d))
* **skin:** add canonical buffering indicator ([#2189](https://github.com/videojs/v10/issues/2189)) ([4055cd5](https://github.com/videojs/v10/commit/4055cd5cd93fbeb902159701c74d8839d05737fc))
* **skin:** add canonical captions button ([#2191](https://github.com/videojs/v10/issues/2191)) ([6a6d8a6](https://github.com/videojs/v10/commit/6a6d8a669afb24299ffd745fe60b937e0c1a2b1f))
* **skin:** add canonical error dialog ([#2190](https://github.com/videojs/v10/issues/2190)) ([fdfa869](https://github.com/videojs/v10/commit/fdfa869edaf42989194f18c33c8e438257220518))
* **skin:** add canonical input indicators ([#2193](https://github.com/videojs/v10/issues/2193)) ([549f65c](https://github.com/videojs/v10/commit/549f65c88411279fd1e3153efbe6c3d541648bb6))
* **skin:** add canonical remote playback controls ([#2192](https://github.com/videojs/v10/issues/2192)) ([ec0572d](https://github.com/videojs/v10/commit/ec0572d9af57752e28befbc07ba57440aa209a15))
* **skin:** add canonical time slider chapters ([#2195](https://github.com/videojs/v10/issues/2195)) ([44ba4e9](https://github.com/videojs/v10/commit/44ba4e97be5e792680bb8f53edd44492a043459b))
* **skin:** add canonical video input bindings ([#2197](https://github.com/videojs/v10/issues/2197)) ([885eb82](https://github.com/videojs/v10/commit/885eb824c0a5b38443a8a750c8d9f8b4a6ba23ee))
* **skin:** add canonical video settings menu ([#2196](https://github.com/videojs/v10/issues/2196)) ([db7e1c3](https://github.com/videojs/v10/commit/db7e1c31c44385119aa6a9d119d422ea982c1a7f))


### Bug Fixes

* **skin:** preserve slider preview behavior ([#2259](https://github.com/videojs/v10/issues/2259)) ([e20e542](https://github.com/videojs/v10/commit/e20e54255a2536f651a1bf46e2f1c75262483349))
* **skin:** style fixes ([#2257](https://github.com/videojs/v10/issues/2257)) ([ae1ca50](https://github.com/videojs/v10/commit/ae1ca50920e6a7db143c524b4808998e32ed83c5))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-beta.29
    * @videojs/store bumped to 10.0.0-beta.29
    * @videojs/utils bumped to 10.0.0-beta.29

## [10.0.0-beta.28](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.27...@videojs/core@10.0.0-beta.28) (2026-08-19)


### Features

* **core:** prefer locale-matched captions on toggle ([#2237](https://github.com/videojs/v10/issues/2237)) ([8f2eb78](https://github.com/videojs/v10/commit/8f2eb782603bb14b99d03ec5565a2c9a6f894e7f))


### Bug Fixes

* **core:** improve Bengali translations ([#2236](https://github.com/videojs/v10/issues/2236)) ([163d37d](https://github.com/videojs/v10/commit/163d37db01fe78f1b9b768451e4d0436f6aa8fae))
* **core:** include menu triggers in tab order ([#2238](https://github.com/videojs/v10/issues/2238)) ([8eebaef](https://github.com/videojs/v10/commit/8eebaefc1b2438ea45b1b28df09ef6aef2b2bde6))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-beta.28
    * @videojs/store bumped to 10.0.0-beta.28
    * @videojs/utils bumped to 10.0.0-beta.28

## [10.0.0-beta.27](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.26...@videojs/core@10.0.0-beta.27) (2026-08-17)


### ⚠ BREAKING CHANGES

* **packages:** normalize time slider chapters ([#2204](https://github.com/videojs/v10/issues/2204))
* **packages:** simplify menus ([#2029](https://github.com/videojs/v10/issues/2029))
* **packages:** rename SimpleHls* to Hls* (video + audio) ([#2096](https://github.com/videojs/v10/issues/2096))
* **packages:** separate input indicator components ([#2046](https://github.com/videojs/v10/issues/2046))
* **packages:** normalize radio group option state ([#2047](https://github.com/videojs/v10/issues/2047))
* **core:** centralize popup positioning ([#1904](https://github.com/videojs/v10/issues/1904))

### Features

* **core:** add core jsx system ([#1986](https://github.com/videojs/v10/issues/1986)) ([d8ff01d](https://github.com/videojs/v10/commit/d8ff01dfce4effec184180ba3a1c985c95eb6e87))
* **i18n:** add Lithuanian locale pack ([#1917](https://github.com/videojs/v10/issues/1917)) ([aa14c87](https://github.com/videojs/v10/commit/aa14c879aed88e3e95fef8a27067cab77c5c11ff))
* **packages:** add chaptered time sliders ([#2043](https://github.com/videojs/v10/issues/2043)) ([6490051](https://github.com/videojs/v10/commit/6490051ac8b991f8c9c47e2cb424b9ffb676230c))
* **packages:** add cloudflare stream media ([#2168](https://github.com/videojs/v10/issues/2168)) ([cfb4b65](https://github.com/videojs/v10/commit/cfb4b6571f0086c557c5b4683c4ced396067a0d2))
* **packages:** add spotify audio media ([#2169](https://github.com/videojs/v10/issues/2169)) ([8993ab1](https://github.com/videojs/v10/commit/8993ab1db3cd4ff7569b29c197efdabd8fd18364))
* **packages:** hide unavailable radio groups ([#2069](https://github.com/videojs/v10/issues/2069)) ([b7fe79e](https://github.com/videojs/v10/commit/b7fe79e2632cc1beda613944eec8bfbd15f9f8e8))
* **packages:** normalize volume slider availability ([#2072](https://github.com/videojs/v10/issues/2072)) ([5704678](https://github.com/videojs/v10/commit/5704678b1daadcf73636047b2f3772d8c4780996))
* **packages:** resolve feature state from user and media values ([#1946](https://github.com/videojs/v10/issues/1946)) ([4751abb](https://github.com/videojs/v10/commit/4751abb75bd6febf5ccbccdd9061379c8f384430))
* **react:** add captions radio group ([#2127](https://github.com/videojs/v10/issues/2127)) ([979458f](https://github.com/videojs/v10/commit/979458fccd6127eff7da74cf528e2f4bc26d2297))
* **react:** add quality radio group ([#2132](https://github.com/videojs/v10/issues/2132)) ([29171b7](https://github.com/videojs/v10/commit/29171b79ff282efe355864ea18d95382ae9bc9a6))
* **skin:** add canonical container, poster, and overlay ([#2179](https://github.com/videojs/v10/issues/2179)) ([4f72ee7](https://github.com/videojs/v10/commit/4f72ee7092f7b909c8c892af1f94a10297c97338))
* **spf:** surface unsupported-source errors ([#1936](https://github.com/videojs/v10/issues/1936)) ([fe47f85](https://github.com/videojs/v10/commit/fe47f85b7bf79a02403206095604683d661db3c1))
* **utils:** extract getAnchorNames and addAnchorName ([#1935](https://github.com/videojs/v10/issues/1935)) ([d5f0cb6](https://github.com/videojs/v10/commit/d5f0cb6b92bfeeec828095a7d970e0b9610eb29d))


### Bug Fixes

* **build:** make cdn bundles self-contained ([#2121](https://github.com/videojs/v10/issues/2121)) ([45c43e9](https://github.com/videojs/v10/commit/45c43e9008875aa7daa7bba10c5842e91bbda2bd))
* **core:** restore the last selected subtitles track on toggle ([#2102](https://github.com/videojs/v10/issues/2102)) ([965b36e](https://github.com/videojs/v10/commit/965b36e9517cee9c9962d19352f1ecb53a57b1d6))
* **core:** skip hidden menu items ([#2071](https://github.com/videojs/v10/issues/2071)) ([ab1e048](https://github.com/videojs/v10/commit/ab1e048099f7ba663eecde875050fc1ea7205156))
* **i18n:** improve locale translations ([#1914](https://github.com/videojs/v10/issues/1914)) ([12cc939](https://github.com/videojs/v10/commit/12cc939f58f4ad2db7218374d96c5aa690ca49e5))
* **i18n:** improve time inversion labels ([#2028](https://github.com/videojs/v10/issues/2028)) ([eeb216a](https://github.com/videojs/v10/commit/eeb216ad2f7dbfe83ec214cb49fc7fb990ff1a7f))
* **i18n:** use resolution wording for hindi quality menu ([#2098](https://github.com/videojs/v10/issues/2098)) ([8a1b15a](https://github.com/videojs/v10/commit/8a1b15ada00ea0f9364ba949b28ff86e47535cde))
* **packages:** add settings tooltip ([#1915](https://github.com/videojs/v10/issues/1915)) ([96d2e05](https://github.com/videojs/v10/commit/96d2e05147cd973900bb88b5ac5abf8e93fdbe8d))
* **packages:** improve ui motion ([#2208](https://github.com/videojs/v10/issues/2208)) ([42f934e](https://github.com/videojs/v10/commit/42f934e9bea4e4961d63d6de1e2eebcc520f8237))
* **packages:** keep controls visible during active interactions ([#1900](https://github.com/videojs/v10/issues/1900)) ([35616db](https://github.com/videojs/v10/commit/35616db5a38d193f1fc114da4af68a79f08093f1))
* **packages:** menu keyboard navigation ([#2214](https://github.com/videojs/v10/issues/2214)) ([15e3ba6](https://github.com/videojs/v10/commit/15e3ba6af98d104739904192afaacccd37014216))
* **packages:** preserve shared popup anchors ([#1933](https://github.com/videojs/v10/issues/1933)) ([cd98428](https://github.com/videojs/v10/commit/cd9842869118bef284c063368710c00e8560f9de))
* **packages:** stabilize popup positioning ([#1931](https://github.com/videojs/v10/issues/1931)) ([1fbccf0](https://github.com/videojs/v10/commit/1fbccf062f34f0cc8a5eb162a10991180363b052))


### Code Refactoring

* **core:** centralize popup positioning ([#1904](https://github.com/videojs/v10/issues/1904)) ([d27eda2](https://github.com/videojs/v10/commit/d27eda2a25bd90841d24da0a3fee67d7d3d586c7))
* **packages:** normalize radio group option state ([#2047](https://github.com/videojs/v10/issues/2047)) ([e91f38c](https://github.com/videojs/v10/commit/e91f38cbcea36d2ab5f138fb178eb7a09b57be3b))
* **packages:** normalize time slider chapters ([#2204](https://github.com/videojs/v10/issues/2204)) ([12656e0](https://github.com/videojs/v10/commit/12656e01e274c65dd9fd87b3e36ab4c47e9c0949))
* **packages:** rename SimpleHls* to Hls* (video + audio) ([#2096](https://github.com/videojs/v10/issues/2096)) ([f1c22a5](https://github.com/videojs/v10/commit/f1c22a5bbfd90e3ce219b8ac5de441c8fba60b8d))
* **packages:** separate input indicator components ([#2046](https://github.com/videojs/v10/issues/2046)) ([5bdb870](https://github.com/videojs/v10/commit/5bdb87088e6c60b1a4e6838ea38944a7cf125d12))
* **packages:** simplify menus ([#2029](https://github.com/videojs/v10/issues/2029)) ([cf23269](https://github.com/videojs/v10/commit/cf23269f87250d7a2deadee5dad58b935f5e8c0f))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-beta.27
    * @videojs/store bumped to 10.0.0-beta.27
    * @videojs/utils bumped to 10.0.0-beta.27

## [10.0.0-beta.26](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.25...@videojs/core@10.0.0-beta.26) (2026-08-02)


### ⚠ BREAKING CHANGES

* **packages:** replace button availability with disabled and hidden state ([#1474](https://github.com/videojs/v10/issues/1474))
* **media:** extract media package from core ([#1879](https://github.com/videojs/v10/issues/1879))

### Features

* **core:** add status announcer state updates ([#1659](https://github.com/videojs/v10/issues/1659)) ([a5e7339](https://github.com/videojs/v10/commit/a5e73393fef381af7e148178822d5c3d94739834))
* **i18n:** convert to opaque keys ([#1848](https://github.com/videojs/v10/issues/1848)) ([a3e673b](https://github.com/videojs/v10/commit/a3e673bd6854e006f4ae36e3ebfbfd6c6120e197))
* **packages:** add flip functionality to popovers/tooltips/menus ([#1857](https://github.com/videojs/v10/issues/1857)) ([be89470](https://github.com/videojs/v10/commit/be89470447e84bb654cd17be7f4d4f6cec767e4f))
* **packages:** add mux media with src parsing, structured source, and storyboards ([#1850](https://github.com/videojs/v10/issues/1850)) ([409e7ef](https://github.com/videojs/v10/commit/409e7ef225c7abb79a49c8b1adcc8c6ed0242cf6))
* **packages:** i18n ([#1708](https://github.com/videojs/v10/issues/1708)) ([028dadb](https://github.com/videojs/v10/commit/028dadb385eb4f879f80932a4002676dc11d5300))


### Bug Fixes

* **core:** add missing i18n translations ([#1817](https://github.com/videojs/v10/issues/1817)) ([c1348ea](https://github.com/videojs/v10/commit/c1348eaac894680313f8df6cf513eb0a938b84c8))
* **core:** keep controls visible while tapping controls on touch ([#1704](https://github.com/videojs/v10/issues/1704)) ([cfb5632](https://github.com/videojs/v10/commit/cfb5632265e3f955ff904c91adf1af85c5f7332a))
* **i18n:** error text updates ([#1822](https://github.com/videojs/v10/issues/1822)) ([82b9e43](https://github.com/videojs/v10/commit/82b9e43bb5fee613031f653b575df015d6187d6f))
* **packages:** prevent controls click triggering interactions ([#1885](https://github.com/videojs/v10/issues/1885)) ([0f4a9b4](https://github.com/videojs/v10/commit/0f4a9b4127d3fbb59b11e278af70c23f83f51c6f))
* **site:** surface native media properties on element reference pages ([#1722](https://github.com/videojs/v10/issues/1722)) ([0dd84b8](https://github.com/videojs/v10/commit/0dd84b819ea18932e5acca1da484b9586f812834))


### Performance Improvements

* **core:** batch menu viewport measurements ([#1823](https://github.com/videojs/v10/issues/1823)) ([72e175e](https://github.com/videojs/v10/commit/72e175e1bd1886124fc907be79a23b405ee6ab1a))


### Code Refactoring

* **media:** extract media package from core ([#1879](https://github.com/videojs/v10/issues/1879)) ([75dcc66](https://github.com/videojs/v10/commit/75dcc6675bd19e9be05c4e295830c80c0ca2180f))
* **packages:** replace button availability with disabled and hidden state ([#1474](https://github.com/videojs/v10/issues/1474)) ([066227d](https://github.com/videojs/v10/commit/066227de5819570a339fd0e291fc236c51632017))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/media bumped to 10.0.0-beta.26
    * @videojs/store bumped to 10.0.0-beta.26
    * @videojs/utils bumped to 10.0.0-beta.26

## [10.0.0-beta.25](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.24...@videojs/core@10.0.0-beta.25) (2026-07-07)


### ⚠ BREAKING CHANGES

* **packages:** rename hls media stack to hlsjs naming ([#1753](https://github.com/videojs/v10/issues/1753))
* **core:** move media capability predicates to core layer ([#1705](https://github.com/videojs/v10/issues/1705))
* **media:** add Google Cast by default to HLS, DASH media ([#1661](https://github.com/videojs/v10/issues/1661))

### Features

* **core:** add built-in locale packs and lazy loadLocale ([#1590](https://github.com/videojs/v10/issues/1590)) ([9170a58](https://github.com/videojs/v10/commit/9170a5879e5a41089d575e41dc4eca7bf9677b65))
* **core:** add i18n foundation with English locale and UI wiring ([#1589](https://github.com/videojs/v10/issues/1589)) ([768bf09](https://github.com/videojs/v10/commit/768bf09da07a728874da232c7cdefb653534e078))
* **core:** add media tracks and renditions support ([#1664](https://github.com/videojs/v10/issues/1664)) ([67b39fe](https://github.com/videojs/v10/commit/67b39fe4bd44a557ce45884b1d84b0a0d62592e3))
* **core:** add quality selection state ([#1693](https://github.com/videojs/v10/issues/1693)) ([74da682](https://github.com/videojs/v10/commit/74da6821d7c60f79bc07d36bbc4cb49fd5c6045e))
* **core:** add vimeo media host and html/react components ([#1667](https://github.com/videojs/v10/issues/1667)) ([1b31f3e](https://github.com/videojs/v10/commit/1b31f3e8d7ecef111b84dbd3f9053efc626f256d))
* **core:** lock fullscreen orientation ([#1656](https://github.com/videojs/v10/issues/1656)) ([62d0524](https://github.com/videojs/v10/commit/62d0524b83bcf37157ef806dd141723ece2f5168))
* **core:** Support AirPlay on MSE ([#1692](https://github.com/videojs/v10/issues/1692)) ([3f2f4a4](https://github.com/videojs/v10/commit/3f2f4a4a5a8c41a22fa0dbefd46ed4e725dfa109))
* **media:** add Google Cast by default to HLS, DASH media ([#1661](https://github.com/videojs/v10/issues/1661)) ([0ffe1a9](https://github.com/videojs/v10/commit/0ffe1a91979ddd53b8f5339765b8c086da7bcc1e))
* **packages:** add audio tracks menu ([#1714](https://github.com/videojs/v10/issues/1714)) ([5d44c4d](https://github.com/videojs/v10/commit/5d44c4debf7a2ca50f6f0519e5cd3ff040bcc933))
* **packages:** add pauseOnDrag to time slider ([#1596](https://github.com/videojs/v10/issues/1596)) ([131e176](https://github.com/videojs/v10/commit/131e176ddef6e94dc04d2176fb90276db6744706))
* **packages:** add quality menu UI ([#1694](https://github.com/videojs/v10/issues/1694)) ([16ab909](https://github.com/videojs/v10/commit/16ab90987ac1629735310649faca62ad36d61526))
* **packages:** add resolved rendition to auto label ([#1698](https://github.com/videojs/v10/issues/1698)) ([9275f93](https://github.com/videojs/v10/commit/9275f93504c87a9423e78fdc6113695de0307009))
* **packages:** add settings menu ([#1615](https://github.com/videojs/v10/issues/1615)) ([00b6f0b](https://github.com/videojs/v10/commit/00b6f0be1d89f7c4c001a539ee2962888448c8c4))
* **packages:** add time display toggle ([#1669](https://github.com/videojs/v10/issues/1669)) ([be4d5a1](https://github.com/videojs/v10/commit/be4d5a11550d6cc599a7ac491a9422ee923511b4))
* **packages:** airplay button ([#1531](https://github.com/videojs/v10/issues/1531)) ([338020e](https://github.com/videojs/v10/commit/338020e1d5a2289f50f92237ff9e8db0457682e4))
* **packages:** compound tooltips with label and shortcut parts ([#1494](https://github.com/videojs/v10/issues/1494)) ([035b509](https://github.com/videojs/v10/commit/035b509c7a77e74153ea5b36536fce424ce27d2d))
* **packages:** constrain popovers to positioning boundary ([#1627](https://github.com/videojs/v10/issues/1627)) ([e7aa0a6](https://github.com/videojs/v10/commit/e7aa0a66699ffa7296ca714313a4bf05290192fb))
* **site:** API reference pages for media elements ([#1342](https://github.com/videojs/v10/issues/1342)) ([d799be1](https://github.com/videojs/v10/commit/d799be1063518b85ad3f030bda07b9132e2db074))
* **spf:** basic audio only use case + use-case-composition doc-type + implementation skills ([#1584](https://github.com/videojs/v10/issues/1584)) ([1a3cb45](https://github.com/videojs/v10/commit/1a3cb45b292aad421fb7429451de59ef41a0a07b))


### Bug Fixes

* **core:** disable toggle captions when there are no captions ([#1598](https://github.com/videojs/v10/issues/1598)) ([760870f](https://github.com/videojs/v10/commit/760870fdf28394021166df7f4ad575730dc65dbd))
* **core:** focus selected radio menu items ([#1645](https://github.com/videojs/v10/issues/1645)) ([e9a619e](https://github.com/videojs/v10/commit/e9a619e03aa28fc773f88d6aa53e9fb9d1208009))
* **core:** prevent mobile controls flash on first tap after auto-hide ([#1556](https://github.com/videojs/v10/issues/1556)) ([48a984a](https://github.com/videojs/v10/commit/48a984aecd39e08c39e786b79c17f64244a983fe))
* **core:** remove 1-9 digit key seek from slider keyboard handler ([#1690](https://github.com/videojs/v10/issues/1690)) ([47aca0f](https://github.com/videojs/v10/commit/47aca0f798b51b98741cf5d63ba8395e8ff0ad3d))
* **core:** update trigger aria-expanded on close ([#1644](https://github.com/videojs/v10/issues/1644)) ([2f5e23e](https://github.com/videojs/v10/commit/2f5e23e10097dcd377f2556a97c21589a4dad24a))
* **core:** upgrade dash.js to 5.2.0 ([#1724](https://github.com/videojs/v10/issues/1724)) ([0460a48](https://github.com/videojs/v10/commit/0460a48d93f2ad5ce5473e7c919f1967367585fa))
* **html:** avoid menu item value render loop ([#1791](https://github.com/videojs/v10/issues/1791)) ([47e74a1](https://github.com/videojs/v10/commit/47e74a139e62e17e8151ff889c90a5a8497a6dcc))
* **packages:** escape HTML special chars in serializeAttributes to prevent XSS ([#1670](https://github.com/videojs/v10/issues/1670)) ([accf4bf](https://github.com/videojs/v10/commit/accf4bfa34f89a8ed90bd005a414507ad1491f43))
* **packages:** handle menu child mutations ([#1739](https://github.com/videojs/v10/issues/1739)) ([9ab7ade](https://github.com/videojs/v10/commit/9ab7adefb729a4a3c5f5285436d532cf6b0532b4))
* **site:** update use-media reference for mediahost architecture ([#1702](https://github.com/videojs/v10/issues/1702)) ([9bcdf5f](https://github.com/videojs/v10/commit/9bcdf5ffc234e5fb8ba5c12dfbd7c7db79b1f8b9))
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
    * @videojs/spf bumped to 10.0.0-beta.25
    * @videojs/store bumped to 10.0.0-beta.25
    * @videojs/utils bumped to 10.0.0-beta.25

## [10.0.0-beta.24](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.23...@videojs/core@10.0.0-beta.24) (2026-05-19)


### Features

* **core:** menu core layer and DOM keyboard navigation ([#1503](https://github.com/videojs/v10/issues/1503)) ([e3c1b28](https://github.com/videojs/v10/commit/e3c1b280325493909ef1da193855832b8c51fb48))
* **packages:** add live button component ([#1473](https://github.com/videojs/v10/issues/1473)) ([e37d5df](https://github.com/videojs/v10/commit/e37d5df87352088a9287bd46b14759965c154b76))
* **packages:** add playback rate menu ([#1527](https://github.com/videojs/v10/issues/1527)) ([ad831d2](https://github.com/videojs/v10/commit/ad831d25f00187929e6eed93770422fa7003071c))
* **packages:** add UI support for gestures and hotkeys ([#1388](https://github.com/videojs/v10/issues/1388)) ([0620814](https://github.com/videojs/v10/commit/0620814a6726da5705b28b1e576dfa3a49b92108))
* **spf:** HLS engine composition walkthrough + doc-driven cleanups ([#1512](https://github.com/videojs/v10/issues/1512)) ([0cfd3bb](https://github.com/videojs/v10/commit/0cfd3bb395332b19cf85e9dc7eb08f656bec3e2b))


### Bug Fixes

* **core:** resolve cast button ssr hydration mismatch ([#1518](https://github.com/videojs/v10/issues/1518)) ([ff7d901](https://github.com/videojs/v10/commit/ff7d901bc40a0e12c9140ecb40764ad8de2eab9c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.24
    * @videojs/store bumped to 10.0.0-beta.24
    * @videojs/utils bumped to 10.0.0-beta.24

## [10.0.0-beta.23](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.22...@videojs/core@10.0.0-beta.23) (2026-04-27)


### ⚠ BREAKING CHANGES

* **core:** unify fullscreen and pip on media capabilities ([#1469](https://github.com/videojs/v10/issues/1469))
* **packages:** rename cast to google-cast and remote-playback ([#1380](https://github.com/videojs/v10/issues/1380))

### Features

* **core:** add HLS stream-type detection and live duration ([#1387](https://github.com/videojs/v10/issues/1387)) ([587c302](https://github.com/videojs/v10/commit/587c302fe5c9f5f558c7358cd84f6438b9b890b7))
* **core:** add liveEdgeStart and targetLiveWindow properties ([#1445](https://github.com/videojs/v10/issues/1445)) ([e3d4ff9](https://github.com/videojs/v10/commit/e3d4ff9d681ec4c31247542f7c2136d341e05303))
* **html:** observe cast attributes on mux elements ([#1386](https://github.com/videojs/v10/issues/1386)) ([76a1e4a](https://github.com/videojs/v10/commit/76a1e4a8c9b85151070b3b10c87692131b529c92))
* **packages:** add live-video and live-audio presets ([#1399](https://github.com/videojs/v10/issues/1399)) ([d9c0049](https://github.com/videojs/v10/commit/d9c00491e7984aeaa01eec2d4450ac148129c205))


### Code Refactoring

* **core:** unify fullscreen and pip on media capabilities ([#1469](https://github.com/videojs/v10/issues/1469)) ([bb72a84](https://github.com/videojs/v10/commit/bb72a84dc1a6d125befeb136fd114d29e2180854))
* **packages:** rename cast to google-cast and remote-playback ([#1380](https://github.com/videojs/v10/issues/1380)) ([413874c](https://github.com/videojs/v10/commit/413874c1e079ccfa43067180161fe86c78b185bd))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.23
    * @videojs/store bumped to 10.0.0-beta.23
    * @videojs/utils bumped to 10.0.0-beta.23

## [10.0.0-beta.22](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.21...@videojs/core@10.0.0-beta.22) (2026-04-18)


### Features

* **packages:** add chromecast support via remote playback API ([#1348](https://github.com/videojs/v10/issues/1348)) ([31a005e](https://github.com/videojs/v10/commit/31a005eeef4cee496c15f6f6be0129ef0006a5a8))


### Bug Fixes

* **packages:** add server-only bundles  ([#1349](https://github.com/videojs/v10/issues/1349)) ([3331fda](https://github.com/videojs/v10/commit/3331fdaf25c8a89ea6d36c2972631df589fc0ad3))
* **react:** prevent gesture tap from firing on slider interactions ([#1361](https://github.com/videojs/v10/issues/1361)) ([769d436](https://github.com/videojs/v10/commit/769d436f4ec78b71d18e0028a606114af48b7afb))


### Reverts

* **packages:** add server-only bundles ([#1349](https://github.com/videojs/v10/issues/1349)) ([#1354](https://github.com/videojs/v10/issues/1354)) ([8530316](https://github.com/videojs/v10/commit/8530316987b5122a2e455b0db3bad6fd3ffa8186))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.22
    * @videojs/store bumped to 10.0.0-beta.22
    * @videojs/utils bumped to 10.0.0-beta.22

## [10.0.0-beta.21](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.20...@videojs/core@10.0.0-beta.21) (2026-04-14)


### Miscellaneous Chores

* **@videojs/core:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.21
    * @videojs/store bumped to 10.0.0-beta.21
    * @videojs/utils bumped to 10.0.0-beta.21

## [10.0.0-beta.20](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.19...@videojs/core@10.0.0-beta.20) (2026-04-14)


### Miscellaneous Chores

* **@videojs/core:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.20
    * @videojs/store bumped to 10.0.0-beta.20
    * @videojs/utils bumped to 10.0.0-beta.20

## [10.0.0-beta.19](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.18...@videojs/core@10.0.0-beta.19) (2026-04-14)


### Miscellaneous Chores

* **@videojs/core:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.19
    * @videojs/store bumped to 10.0.0-beta.19
    * @videojs/utils bumped to 10.0.0-beta.19

## [10.0.0-beta.18](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.17...@videojs/core@10.0.0-beta.18) (2026-04-14)


### ⚠ BREAKING CHANGES

* **packages:** replace DelegateMixin & ProxyMixin with MediaHost base classes ([#1292](https://github.com/videojs/v10/issues/1292))

### Bug Fixes

* **core:** ignore non-primary pointer buttons in tap gesture ([#1329](https://github.com/videojs/v10/issues/1329)) ([c7d4021](https://github.com/videojs/v10/commit/c7d4021bdea316d07b50706e0b8048eeedf74537))
* **core:** reduce doubletap window from 300ms to 200ms ([#1328](https://github.com/videojs/v10/issues/1328)) ([8bce342](https://github.com/videojs/v10/commit/8bce3428901a5a949c5bfb8815cc2b051317bb2a))
* **packages:** ignore gestures on interactive child elements ([#1327](https://github.com/videojs/v10/issues/1327)) ([b768c29](https://github.com/videojs/v10/commit/b768c29f98043a41c6272683e240bf1948238042))


### Code Refactoring

* **packages:** replace DelegateMixin & ProxyMixin with MediaHost base classes ([#1292](https://github.com/videojs/v10/issues/1292)) ([8f1653e](https://github.com/videojs/v10/commit/8f1653efcd0a3a8cc75881bc6b4c0b87599a3b8d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.18
    * @videojs/store bumped to 10.0.0-beta.18
    * @videojs/utils bumped to 10.0.0-beta.18

## [10.0.0-beta.17](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.16...@videojs/core@10.0.0-beta.17) (2026-04-11)


### Features

* **html:** add `<media-gesture>` element ([#1305](https://github.com/videojs/v10/issues/1305)) ([d2782f0](https://github.com/videojs/v10/commit/d2782f0c8d3e927fc2144a5286f4bc795a2ed4ac))
* **packages:** add gesture bindings to default skins and presets ([#1310](https://github.com/videojs/v10/issues/1310)) ([1509a66](https://github.com/videojs/v10/commit/1509a66f60fc0598452f21af396c4b6f3569be5b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.17
    * @videojs/store bumped to 10.0.0-beta.17
    * @videojs/utils bumped to 10.0.0-beta.17

## [10.0.0-beta.16](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.15...@videojs/core@10.0.0-beta.16) (2026-04-10)


### Features

* **core:** add gesture system ([#1287](https://github.com/videojs/v10/issues/1287)) ([08ebaed](https://github.com/videojs/v10/commit/08ebaed23fbc232053e197f2af73de0052138809))
* **core:** add sub-1x playback rates to defaults ([#1231](https://github.com/videojs/v10/issues/1231)) ([c68c1a3](https://github.com/videojs/v10/commit/c68c1a3c8261919e1ffbbd2ea103d3a199e159de))
* **core:** add toggleControls to controls feature ([#1280](https://github.com/videojs/v10/issues/1280)) ([11f3057](https://github.com/videojs/v10/commit/11f305713bba718d54944a57684e8c135fe4e0e1))
* **html:** add hotkeys ([#1239](https://github.com/videojs/v10/issues/1239)) ([d9d893b](https://github.com/videojs/v10/commit/d9d893b726e461721e73eeba9377c9d381de8951))
* **packages:** add hotkey system with coordinator, actions, and ARIA support ([#1238](https://github.com/videojs/v10/issues/1238)) ([627ea20](https://github.com/videojs/v10/commit/627ea204fcadb50d8cd0878ae816fabdaee470d0))
* **packages:** add mux-audio element and react component ([#1259](https://github.com/videojs/v10/issues/1259)) ([9fac0fc](https://github.com/videojs/v10/commit/9fac0fca3d5af44c76c9845da37b5197dd8538df))


### Bug Fixes

* **core:** allow undefined hotkey options  ([#1242](https://github.com/videojs/v10/issues/1242)) ([d2c43db](https://github.com/videojs/v10/commit/d2c43db5506847f941260fd41cde2ecd33b74277))
* **core:** treat Alt as implicit modifier for non-letter character hotkeys ([#1304](https://github.com/videojs/v10/issues/1304)) ([57259b3](https://github.com/videojs/v10/commit/57259b342a3cce577c9e1a3cb96ab278f559434c))
* **core:** use 0.2 and 0.7 for default playback rates ([#1236](https://github.com/videojs/v10/issues/1236)) ([932949f](https://github.com/videojs/v10/commit/932949fdf1bdf3fcd62fcaa30257786d6bb9b92e))
* **packages:** remove redundant "Shift" modifier from playback rate hotkeys ([#1290](https://github.com/videojs/v10/issues/1290)) ([a0fd3cb](https://github.com/videojs/v10/commit/a0fd3cbda8101f47806e0e71c727fbf483a1de66))
* **packages:** time slider seek improvements ([#1291](https://github.com/videojs/v10/issues/1291)) ([b934c58](https://github.com/videojs/v10/commit/b934c589f824b0ed7338b19c2b3bad3160742e74))
* **packages:** workspace drift ([#1270](https://github.com/videojs/v10/issues/1270)) ([b874dad](https://github.com/videojs/v10/commit/b874dad30652654e77b3693116edc497355fd725))
* safari track bug, no playback ([#1226](https://github.com/videojs/v10/issues/1226)) ([b1ddda0](https://github.com/videojs/v10/commit/b1ddda05dec40669058a71064f0c3889972c7723))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.16
    * @videojs/store bumped to 10.0.0-beta.16
    * @videojs/utils bumped to 10.0.0-beta.16

## [10.0.0-beta.15](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.14...@videojs/core@10.0.0-beta.15) (2026-04-03)


### Bug Fixes

* **core:** enable default tracks for chapters and metadata ([#1216](https://github.com/videojs/v10/issues/1216)) ([9317c04](https://github.com/videojs/v10/commit/9317c0433c911d8807f5924ab4c813c046265078))
* **site:** remove default attr from storyboard track elements ([#1211](https://github.com/videojs/v10/issues/1211)) ([5734c4a](https://github.com/videojs/v10/commit/5734c4ad3c3a33e2b3a8aa06fbe908157e6b934e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.15
    * @videojs/store bumped to 10.0.0-beta.15
    * @videojs/utils bumped to 10.0.0-beta.15

## [10.0.0-beta.14](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.13...@videojs/core@10.0.0-beta.14) (2026-04-03)


### Features

* **core:** add native hls error handling ([#1190](https://github.com/videojs/v10/issues/1190)) ([5239b9b](https://github.com/videojs/v10/commit/5239b9b834ff882e63f258852b307cdc5f5c5090))
* **packages:** volume slider scroll support ([#1175](https://github.com/videojs/v10/issues/1175)) ([390b004](https://github.com/videojs/v10/commit/390b004d809272fd453b8a73e1969c59410c3620))


### Bug Fixes

* **packages:** make tooltips visual-only and auto-forward media button labels ([#1174](https://github.com/videojs/v10/issues/1174)) ([86cf3e8](https://github.com/videojs/v10/commit/86cf3e8977719fbbdcd59244a543fdd8412c4484))
* **react:** thumbnails broken when using hls media ([#1210](https://github.com/videojs/v10/issues/1210)) ([8b571f5](https://github.com/videojs/v10/commit/8b571f5f05566f52deea866f4a64a7408d6c2c21))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.14
    * @videojs/store bumped to 10.0.0-beta.14
    * @videojs/utils bumped to 10.0.0-beta.14

## [10.0.0-beta.13](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.12...@videojs/core@10.0.0-beta.13) (2026-04-01)


### Bug Fixes

* **core:** fix media proxy for React ([#1169](https://github.com/videojs/v10/issues/1169)) ([c0a3277](https://github.com/videojs/v10/commit/c0a3277f4cbc7f2abafa1b4f166049d57bdb1ee5))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.13
    * @videojs/store bumped to 10.0.0-beta.13
    * @videojs/utils bumped to 10.0.0-beta.13

## [10.0.0-beta.12](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.11...@videojs/core@10.0.0-beta.12) (2026-04-01)


### Features

* add Mux video component ([#1036](https://github.com/videojs/v10/issues/1036)) ([271a8c8](https://github.com/videojs/v10/commit/271a8c850216bd1654baaa26f8bb2f5eda56be37))
* add native hls media + refactor ([#1154](https://github.com/videojs/v10/issues/1154)) ([1b2afc6](https://github.com/videojs/v10/commit/1b2afc6e41a4a8bb4f3ea42b5c04c6232813727e))
* **core:** add error handling to Hls.js media ([#1164](https://github.com/videojs/v10/issues/1164)) ([9e2ede6](https://github.com/videojs/v10/commit/9e2ede6ddc37622152e1ca90406c72dd580c855b))
* **core:** implement preload for HLS media ([#1125](https://github.com/videojs/v10/issues/1125)) ([9142841](https://github.com/videojs/v10/commit/9142841d34f091107db4753a8cac0ca6ef5e99ab))
* **packages:** error dialog component ([#1077](https://github.com/videojs/v10/issues/1077)) ([3430fe1](https://github.com/videojs/v10/commit/3430fe1a493e4bee34f03112206a0cb3cf9d88cf))


### Bug Fixes

* **core:** fix Mux data initialization ([#1162](https://github.com/videojs/v10/issues/1162)) ([2946560](https://github.com/videojs/v10/commit/29465609c54526b45d59168384fb2d502feed07a))
* isolate preload mixin for hls delegate ([#1150](https://github.com/videojs/v10/issues/1150)) ([a96aad7](https://github.com/videojs/v10/commit/a96aad7558f777868b6cf1b77c55a7baf05b32c2))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.12
    * @videojs/store bumped to 10.0.0-beta.12
    * @videojs/utils bumped to 10.0.0-beta.12

## [10.0.0-beta.11](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.10...@videojs/core@10.0.0-beta.11) (2026-03-24)


### Features

* **packages:** export media component building blocks ([#1098](https://github.com/videojs/v10/issues/1098)) ([bc2929e](https://github.com/videojs/v10/commit/bc2929ef4fc7ed021c91d96b96498870ecf5e4e5))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.11
    * @videojs/store bumped to 10.0.0-beta.11
    * @videojs/utils bumped to 10.0.0-beta.11

## [10.0.0-beta.10](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.9...@videojs/core@10.0.0-beta.10) (2026-03-23)


### Bug Fixes

* **core:** prevent sprite tile bleeding in thumbnail component ([#1053](https://github.com/videojs/v10/issues/1053)) ([07b1c87](https://github.com/videojs/v10/commit/07b1c872625353c23d7ea076a47638abb2798a03))
* **react:** add missing destroy cleanups  ([#1096](https://github.com/videojs/v10/issues/1096)) ([1792bae](https://github.com/videojs/v10/commit/1792bae3b4cad5cbb89038e3fa10212f24b49e6b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.10
    * @videojs/store bumped to 10.0.0-beta.10
    * @videojs/utils bumped to 10.0.0-beta.10

## [10.0.0-beta.9](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.8...@videojs/core@10.0.0-beta.9) (2026-03-23)


### Features

* **skin:** add error handling for audio players ([#1048](https://github.com/videojs/v10/issues/1048)) ([df927f6](https://github.com/videojs/v10/commit/df927f67fcbd0aaa229b1a8e205ab3cb08f7a42d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.9
    * @videojs/store bumped to 10.0.0-beta.9
    * @videojs/utils bumped to 10.0.0-beta.9

## [10.0.0-beta.8](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.7...@videojs/core@10.0.0-beta.8) (2026-03-20)


### Miscellaneous Chores

* **@videojs/core:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.8
    * @videojs/store bumped to 10.0.0-beta.8
    * @videojs/utils bumped to 10.0.0-beta.8

## [10.0.0-beta.7](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.6...@videojs/core@10.0.0-beta.7) (2026-03-19)


### Features

* add DashVideo media element (html, react) with sandbox support ([#940](https://github.com/videojs/v10/issues/940)) ([5bdbbec](https://github.com/videojs/v10/commit/5bdbbec8a0f69b4be89600287c63a04746b7ba49))
* **html:** add data-availability to volume slider ([#1001](https://github.com/videojs/v10/issues/1001)) ([c95e134](https://github.com/videojs/v10/commit/c95e1343e16c8667f6b7f5560d12ec5f36f1acd8))


### Bug Fixes

* **core:** improve fullscreen and pip webkit fallback handling ([#999](https://github.com/videojs/v10/issues/999)) ([a05e8f2](https://github.com/videojs/v10/commit/a05e8f20af4fcc4e506f461fb0244acf24564e13))
* **core:** prevent slider thumb jump on pointer release ([#990](https://github.com/videojs/v10/issues/990)) ([b9bada9](https://github.com/videojs/v10/commit/b9bada95675f09b7c7d6859dcd213be7a0408bb7))
* **core:** rename MediaDelegateMixin and MediaProxyMixin ([#976](https://github.com/videojs/v10/issues/976)) ([561d03e](https://github.com/videojs/v10/commit/561d03eb5ae87aa3ba2bb5d4d68987ef4067e90e))
* **core:** round thumbnail dimensions to prevent sub-pixel gaps ([#995](https://github.com/videojs/v10/issues/995)) ([636ccd4](https://github.com/videojs/v10/commit/636ccd45daab5e2726f26b6412b72b2725ff6373))
* **core:** stub pointer:fine in tooltip touch suppression tests ([#998](https://github.com/videojs/v10/issues/998)) ([fc62ea1](https://github.com/videojs/v10/commit/fc62ea1c0ae20e53468b8a2ec57dc11f8e021b17))
* **core:** suppress tooltip hover on touch pointer events ([#933](https://github.com/videojs/v10/issues/933)) ([324ea2f](https://github.com/videojs/v10/commit/324ea2fd3b0410f5c64ae6761aebaf6b7db29a47))
* **core:** sync playback feature state on seeked event ([#1000](https://github.com/videojs/v10/issues/1000)) ([12f582e](https://github.com/videojs/v10/commit/12f582ec1a7819e38c800664dd05c687c77fff6c))
* correct popup fallback positioning offsets ([#981](https://github.com/videojs/v10/issues/981)) ([82ede77](https://github.com/videojs/v10/commit/82ede77322204500d7ca0adc5cb24d4f068af462))
* **skin:** add subtle control transitions on touch devices ([#985](https://github.com/videojs/v10/issues/985)) ([7e0827c](https://github.com/videojs/v10/commit/7e0827c330dc796aa0375cd5839fc4fc1661f055))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.7
    * @videojs/store bumped to 10.0.0-beta.7
    * @videojs/utils bumped to 10.0.0-beta.7

## [10.0.0-beta.6](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.5...@videojs/core@10.0.0-beta.6) (2026-03-15)


### Features

* add slider preview thumbnails ([#935](https://github.com/videojs/v10/issues/935)) ([e3f438e](https://github.com/videojs/v10/commit/e3f438e9f488f41c8cf51c95507bc41fc5b524d0))


### Bug Fixes

* **html:** simplify styles for slotted video ([#953](https://github.com/videojs/v10/issues/953)) ([d6e471a](https://github.com/videojs/v10/commit/d6e471a8377e9ee8ef63df9097810c6d0c1bb2f9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.6
    * @videojs/store bumped to 10.0.0-beta.6
    * @videojs/utils bumped to 10.0.0-beta.6

## [10.0.0-beta.5](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.4...@videojs/core@10.0.0-beta.5) (2026-03-12)


### Miscellaneous Chores

* **@videojs/core:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.5
    * @videojs/store bumped to 10.0.0-beta.5
    * @videojs/utils bumped to 10.0.0-beta.5

## [10.0.0-beta.4](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.3...@videojs/core@10.0.0-beta.4) (2026-03-12)


### Bug Fixes

* attaching media like elements and upgrade ([#889](https://github.com/videojs/v10/issues/889)) ([2105010](https://github.com/videojs/v10/commit/2105010c7f1f525ab89cc30506219a5dd49a64a7))
* **core:** skip delay when switching between grouped tooltips ([#903](https://github.com/videojs/v10/issues/903)) ([ff8fb3f](https://github.com/videojs/v10/commit/ff8fb3fd36b0eeda9d2d861c83d4db51f60650a0))
* mobile controls issues ([#896](https://github.com/videojs/v10/issues/896)) ([b892cfc](https://github.com/videojs/v10/commit/b892cfc2615feff919c701f1bd5840e40f3d5d54))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.4
    * @videojs/store bumped to 10.0.0-beta.4
    * @videojs/utils bumped to 10.0.0-beta.4

## [10.0.0-beta.3](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.2...@videojs/core@10.0.0-beta.3) (2026-03-11)


### Bug Fixes

* **core:** resolve pip state against media target ([#883](https://github.com/videojs/v10/issues/883)) ([45a312e](https://github.com/videojs/v10/commit/45a312e0162bc66983eb7f41701a1bf28019736f))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.3
    * @videojs/store bumped to 10.0.0-beta.3
    * @videojs/utils bumped to 10.0.0-beta.3

## [10.0.0-beta.2](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.1...@videojs/core@10.0.0-beta.2) (2026-03-10)


### Miscellaneous Chores

* **@videojs/core:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.2
    * @videojs/store bumped to 10.0.0-beta.2
    * @videojs/utils bumped to 10.0.0-beta.2

## [10.0.0-beta.1](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.0...@videojs/core@10.0.0-beta.1) (2026-03-10)


### Features

* add media API + HLS video components ([#507](https://github.com/videojs/v10/issues/507)) ([b3a31a3](https://github.com/videojs/v10/commit/b3a31a335a363d3a96b510206b57d1bb9ebb8edd))
* add media delegate mixin ([#598](https://github.com/videojs/v10/issues/598)) ([c4ef94e](https://github.com/videojs/v10/commit/c4ef94e82301be6705002d0a7d7c65463ece1045))
* add subtitles handling + captions core ([#692](https://github.com/videojs/v10/issues/692)) ([5c11606](https://github.com/videojs/v10/commit/5c116065a91ed04753bb2cb83e72dd6471f75ced))
* add tooltip core ([#212](https://github.com/videojs/v10/issues/212)) ([cbf41ce](https://github.com/videojs/v10/commit/cbf41ce4c750cd5c3bb6cbf247bad91ccd578cd0))
* **core:** add alert dialog with dismiss layer and transitions ([#743](https://github.com/videojs/v10/issues/743)) ([a80cf4e](https://github.com/videojs/v10/commit/a80cf4e06aaa6adfd5e916b4789cb40ac15ef9cf))
* **core:** add AlertDialog data attributes ([#738](https://github.com/videojs/v10/issues/738)) ([e2334a3](https://github.com/videojs/v10/commit/e2334a3767c8f9474d44c8baa25512041392e363))
* **core:** add buffering indicator component ([#527](https://github.com/videojs/v10/issues/527)) ([aa0fb7c](https://github.com/videojs/v10/commit/aa0fb7ca704843dd6ac8b0b18d9e35f8f430311e))
* **core:** add controls component with activity tracking ([#514](https://github.com/videojs/v10/issues/514)) ([90d881c](https://github.com/videojs/v10/commit/90d881cec21d7f5e1e619061727e6c8d1ff48296))
* **core:** add error feature ([#713](https://github.com/videojs/v10/issues/713)) ([879d55d](https://github.com/videojs/v10/commit/879d55d1d216aac9f31f3fb22e2e31fde55a002b))
* **core:** add fullscreen button component ([#459](https://github.com/videojs/v10/issues/459)) ([3c4152f](https://github.com/videojs/v10/commit/3c4152fb5845965334cfd7e3c2623ac978377d96))
* **core:** add mute button component ([#455](https://github.com/videojs/v10/issues/455)) ([aa189ee](https://github.com/videojs/v10/commit/aa189eec84482afde4dd42fc547af4759ea51742))
* **core:** add pip button component ([#525](https://github.com/videojs/v10/issues/525)) ([2c8b77a](https://github.com/videojs/v10/commit/2c8b77af4547b0a8af27abcc419f7d4dff3b005a))
* **core:** add play button component ([#383](https://github.com/videojs/v10/issues/383)) ([9cfab26](https://github.com/videojs/v10/commit/9cfab264d85ea5b8e20fc2d020171ba5ef53b0f4))
* **core:** add player target and feature selectors ([#371](https://github.com/videojs/v10/issues/371)) ([1bde6e9](https://github.com/videojs/v10/commit/1bde6e950a6024769cf63d04c66d1646fd31cc98))
* **core:** add popover component ([#615](https://github.com/videojs/v10/issues/615)) ([44188d4](https://github.com/videojs/v10/commit/44188d4823d687bae2806f38e199e9719ff05083))
* **core:** add poster component ([#457](https://github.com/videojs/v10/issues/457)) ([c9ba1e1](https://github.com/videojs/v10/commit/c9ba1e1bfc83e02981a2ffad0a0f247092068687))
* **core:** add presentation feature ([#458](https://github.com/videojs/v10/issues/458)) ([d5e5cec](https://github.com/videojs/v10/commit/d5e5cec6ab2f81275f488dcaa66edef573ce10bf))
* **core:** add seek button component ([#526](https://github.com/videojs/v10/issues/526)) ([c733077](https://github.com/videojs/v10/commit/c733077d324b3cd40eab7c0e33f1f73592609515))
* **core:** add slider dom ([#613](https://github.com/videojs/v10/issues/613)) ([4c7d287](https://github.com/videojs/v10/commit/4c7d287d357e1f1b820aca62b0a26eda225c441f))
* **core:** add thumbnail component and text track store feature ([#643](https://github.com/videojs/v10/issues/643)) ([7bae887](https://github.com/videojs/v10/commit/7bae887920a71665fdd24a2f0aca0718de062084))
* **core:** add time display component ([#460](https://github.com/videojs/v10/issues/460)) ([7b8bc11](https://github.com/videojs/v10/commit/7b8bc11f9f90684269b6acebeb79677063112e1f))
* **core:** add tooltip  ([#734](https://github.com/videojs/v10/issues/734)) ([b69a2f9](https://github.com/videojs/v10/commit/b69a2f9994eaf14f4f2bf64643d8fc18e901b365))
* **core:** dom media slices ([#292](https://github.com/videojs/v10/issues/292)) ([47659f5](https://github.com/videojs/v10/commit/47659f5352634ef094b9ab83476a59ac1f244115))
* **example/react:** improvements to react examples ([#210](https://github.com/videojs/v10/issues/210)) ([c35b012](https://github.com/videojs/v10/commit/c35b0122509ce3230dcfce4a0acf0d315ba5f0ee))
* **html:** add slider element ([#655](https://github.com/videojs/v10/issues/655)) ([d5df015](https://github.com/videojs/v10/commit/d5df0150b3aef21c15d3a65c015bb6058e95ce53))
* **html:** add time slider element ([#656](https://github.com/videojs/v10/issues/656)) ([26c7395](https://github.com/videojs/v10/commit/26c7395cd0fe7e2fe8a8020ffae40cf81ffb3974))
* **html:** add tooltip element ([#735](https://github.com/videojs/v10/issues/735)) ([e9fbaec](https://github.com/videojs/v10/commit/e9fbaece87c39c0adc41070159fd7e6f75f0e1da))
* **html:** add volume slider element ([#657](https://github.com/videojs/v10/issues/657)) ([92b7c2a](https://github.com/videojs/v10/commit/92b7c2ac184d12c780ba1a1bb6f064782b77422a))
* **html:** reorganize import paths by use case ([#480](https://github.com/videojs/v10/issues/480)) ([870cbb7](https://github.com/videojs/v10/commit/870cbb77e4ac45d179d8702d0e08c58face8a2fc))
* **html:** setup player api ([#374](https://github.com/videojs/v10/issues/374)) ([a419f5e](https://github.com/videojs/v10/commit/a419f5ef190a47575c4a7e11353a5454e6ee7fe6))
* **packages:** add PlaybackRateButton to core, html, and react ([#642](https://github.com/videojs/v10/issues/642)) ([0180828](https://github.com/videojs/v10/commit/0180828df91ad74f885906223fa7d359f1a2641a))
* **packages:** add slider core layer ([#529](https://github.com/videojs/v10/issues/529)) ([7efee3d](https://github.com/videojs/v10/commit/7efee3d03361f195706257b4950708cbe5356cf5))
* **react:** add slider component ([#644](https://github.com/videojs/v10/issues/644)) ([2f8ca09](https://github.com/videojs/v10/commit/2f8ca094ad5bc5bafc5435c2e97bca58c6d29b5d))
* **react:** add slider preview component ([#710](https://github.com/videojs/v10/issues/710)) ([db75697](https://github.com/videojs/v10/commit/db7569711e5a571f6af421987c8490c3de37ed78))
* **react:** implement default and minimal video skins ([#550](https://github.com/videojs/v10/issues/550)) ([7d3be36](https://github.com/videojs/v10/commit/7d3be367f5b31b8a6d5b9a9e3c87245f95b8e22a))
* **react:** implement video skins with responsive layout ([#568](https://github.com/videojs/v10/issues/568)) ([846d38e](https://github.com/videojs/v10/commit/846d38e79b11ba8de62bdb239bc1358e9abc28de))
* **site:** add TimeSlider, VolumeSlider, Popover API references ([#685](https://github.com/videojs/v10/issues/685)) ([8ab596e](https://github.com/videojs/v10/commit/8ab596ea30291d48962684203d153c689e1b0fec))
* **site:** add util reference pipeline ([#537](https://github.com/videojs/v10/issues/537)) ([78112fb](https://github.com/videojs/v10/commit/78112fbefdaace678a2d1335409e40533f3819fa))
* **site:** generated multipart component api reference ([#468](https://github.com/videojs/v10/issues/468)) ([4b1e863](https://github.com/videojs/v10/commit/4b1e863883f730f561a490e58223d8298b5bef5c))
* small state and naming fixes  ([#719](https://github.com/videojs/v10/issues/719)) ([5c42245](https://github.com/videojs/v10/commit/5c422452e4b547dc00f13082b755ea12d1860f21))
* **spf:** initial push of SPF ([#784](https://github.com/videojs/v10/issues/784)) ([27a3993](https://github.com/videojs/v10/commit/27a3993fb20af0523e42b0d03c70a6f5a465d144))
* **store:** lit bindings ([#289](https://github.com/videojs/v10/issues/289)) ([648aae7](https://github.com/videojs/v10/commit/648aae7e31db02f6d69dba138b98e7cbfd398902))


### Bug Fixes

* add popover core, use in html and improve factory ([#204](https://github.com/videojs/v10/issues/204)) ([f3b1b19](https://github.com/videojs/v10/commit/f3b1b199173f3750bc05ad9063fcccbd4163b12b))
* add SSR stubs for HLS media ([#641](https://github.com/videojs/v10/issues/641)) ([2b50825](https://github.com/videojs/v10/commit/2b508255736e0d9083a1a0baa90850de85f29b92))
* **cd:** add repository field to all packages for provenance verification ([b723589](https://github.com/videojs/v10/commit/b72358904a78a9403df16d77936d4a1f41a64bfe))
* clean up core, less seams in wrappers ([#197](https://github.com/videojs/v10/issues/197)) ([601a5a3](https://github.com/videojs/v10/commit/601a5a37939605ca38f81a825fd02934e7928c39))
* **core:** auto-unmute on volume change and restore volume on unmute ([#752](https://github.com/videojs/v10/issues/752)) ([4466d0a](https://github.com/videojs/v10/commit/4466d0a15c2be9d1a0c23dace95cbd079d228d97))
* **core:** derive effective mute state for volume UI components ([#753](https://github.com/videojs/v10/issues/753)) ([14bcdc8](https://github.com/videojs/v10/commit/14bcdc833f0a09bb3ca92d8a02e68b6802aeebac))
* **core:** fix circular import and simplify media types ([#569](https://github.com/videojs/v10/issues/569)) ([38b3a8f](https://github.com/videojs/v10/commit/38b3a8f55ca96938db92fa06c0d171bf544ffe3b))
* **core:** fixed fullscreen on ios safari ([#211](https://github.com/videojs/v10/issues/211)) ([6068633](https://github.com/videojs/v10/commit/6068633be0939c8024317abac0cb1cd5a262d07a))
* **core:** optimistic current time update on seek to prevent slider snap-back ([#799](https://github.com/videojs/v10/issues/799)) ([c605df5](https://github.com/videojs/v10/commit/c605df50f61e7e50067133e4e79458607fb4d3a9))
* **core:** preserve user props in time slider ([#621](https://github.com/videojs/v10/issues/621)) ([23528ca](https://github.com/videojs/v10/commit/23528cad88fe1645df686d4cd74eaf4806a35d6a))
* **core:** prevent slider track click from closing popover ([#776](https://github.com/videojs/v10/issues/776)) ([c20d884](https://github.com/videojs/v10/commit/c20d88493281f68e4716195fde59ec6134421902))
* **core:** update README to use v10 terminology ([93dd266](https://github.com/videojs/v10/commit/93dd266f551923e103111019e12834f27cefabe7))
* **core:** use camelCase attribute names in slider for react ([#708](https://github.com/videojs/v10/issues/708)) ([4e1f3af](https://github.com/videojs/v10/commit/4e1f3af2d71bfdacbd35e1363ecb8221e24558a3))
* **core:** use composedPath for popover outside-click detection ([#806](https://github.com/videojs/v10/issues/806)) ([747d159](https://github.com/videojs/v10/commit/747d15910be039413b658a00438f5edbdb7f19f6))
* **core:** use double-RAF in transition open to enable entry animations ([#755](https://github.com/videojs/v10/issues/755)) ([7b6b301](https://github.com/videojs/v10/commit/7b6b3019dfaa41e34970e5827bd2ba21c7712fbe))
* delegate not defining Delegate props ([#751](https://github.com/videojs/v10/issues/751)) ([c61fcdc](https://github.com/videojs/v10/commit/c61fcdcc3a64f8a4ef32ec3fd332f1ec5cdbb311))
* destroy hls.js instance on media unmount ([#749](https://github.com/videojs/v10/issues/749)) ([c4e8bbd](https://github.com/videojs/v10/commit/c4e8bbd3a2bcb66027c64faf8de0ec61d22c84fa))
* **html:** apply popover data attributes before showing via popover API ([#763](https://github.com/videojs/v10/issues/763)) ([206bc9b](https://github.com/videojs/v10/commit/206bc9b4ae914176e50c1708c272c75d90a12286))
* **html:** discover media elements and attach store target via DOM ([#481](https://github.com/videojs/v10/issues/481)) ([5eab1db](https://github.com/videojs/v10/commit/5eab1dbb2fbb906543f7749e5956c9791c30be34))
* **html:** slider interaction and edge alignment broken ([#721](https://github.com/videojs/v10/issues/721)) ([ff12296](https://github.com/videojs/v10/commit/ff122963553e23a58614c9c808763208fd893df1))
* **html:** thumb edge alignment jump ([#766](https://github.com/videojs/v10/issues/766)) ([d53e239](https://github.com/videojs/v10/commit/d53e239b7b59ad0d86ef961e19342c80568fe02d))
* **packages:** enable unbundle mode to avoid mangled exports ([00fdf96](https://github.com/videojs/v10/commit/00fdf966ca5148bcca303058dd798b1b880896e0))
* **packages:** set release-please manifest and package versions to beta.0 ([#850](https://github.com/videojs/v10/issues/850)) ([e085a0d](https://github.com/videojs/v10/commit/e085a0d73af0c142e0c0a371337daae98fdbaac9))
* **packages:** update package READMEs for beta ([#848](https://github.com/videojs/v10/issues/848)) ([9562a0e](https://github.com/videojs/v10/commit/9562a0ecca212034759d7cc948d4b3f0bc7a19c3))
* **packages:** update version badges ([#138](https://github.com/videojs/v10/issues/138)) ([22d9cb6](https://github.com/videojs/v10/commit/22d9cb64f2e5b9601a2039bb166dbe3fee6a1b3e))
* **root:** add videojs keyword to package.json ([4a9f8b2](https://github.com/videojs/v10/commit/4a9f8b2ad6fb27b463dcfe8d1a5fd883c9fa21d1))
* **site:** update discord link ([#170](https://github.com/videojs/v10/issues/170)) ([bb10294](https://github.com/videojs/v10/commit/bb10294419439fb02df650f3e7f7c5496ecc3a73))
* **slider:** keep pointer position after pointerleave ([#807](https://github.com/videojs/v10/issues/807)) ([cd019cb](https://github.com/videojs/v10/commit/cd019cbbf2444d3643438f1cd7b3ee05efc2350f))
* ssr issue with hls.js ([#758](https://github.com/videojs/v10/issues/758)) ([bcc492f](https://github.com/videojs/v10/commit/bcc492f63f8d3e248b3cbba67cbc516420270920))
* textTrackList and optimize ([#760](https://github.com/videojs/v10/issues/760)) ([04e98f4](https://github.com/videojs/v10/commit/04e98f4007dcc5957ff4b646482036da49e1efd4))
* use popover core in react popover ([#208](https://github.com/videojs/v10/issues/208)) ([99fef78](https://github.com/videojs/v10/commit/99fef78f63e8dd121513b9cd20696a7d35603837))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-beta.1
    * @videojs/store bumped to 10.0.0-beta.1
    * @videojs/utils bumped to 10.0.0-beta.1

## [10.0.0-alpha.11](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.10...@videojs/core@10.0.0-alpha.11) (2026-03-10)


### Miscellaneous Chores

* **@videojs/core:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-alpha.11
    * @videojs/store bumped to 10.0.0-alpha.11
    * @videojs/utils bumped to 10.0.0-alpha.11

## [10.0.0-alpha.10](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.9...@videojs/core@10.0.0-alpha.10) (2026-03-10)


### Features

* **spf:** initial push of SPF ([#784](https://github.com/videojs/v10/issues/784)) ([27a3993](https://github.com/videojs/v10/commit/27a3993fb20af0523e42b0d03c70a6f5a465d144))


### Bug Fixes

* **core:** optimistic current time update on seek to prevent slider snap-back ([#799](https://github.com/videojs/v10/issues/799)) ([c605df5](https://github.com/videojs/v10/commit/c605df50f61e7e50067133e4e79458607fb4d3a9))
* **core:** prevent slider track click from closing popover ([#776](https://github.com/videojs/v10/issues/776)) ([c20d884](https://github.com/videojs/v10/commit/c20d88493281f68e4716195fde59ec6134421902))
* **core:** use composedPath for popover outside-click detection ([#806](https://github.com/videojs/v10/issues/806)) ([747d159](https://github.com/videojs/v10/commit/747d15910be039413b658a00438f5edbdb7f19f6))
* **html:** apply popover data attributes before showing via popover API ([#763](https://github.com/videojs/v10/issues/763)) ([206bc9b](https://github.com/videojs/v10/commit/206bc9b4ae914176e50c1708c272c75d90a12286))
* **html:** thumb edge alignment jump ([#766](https://github.com/videojs/v10/issues/766)) ([d53e239](https://github.com/videojs/v10/commit/d53e239b7b59ad0d86ef961e19342c80568fe02d))
* **slider:** keep pointer position after pointerleave ([#807](https://github.com/videojs/v10/issues/807)) ([cd019cb](https://github.com/videojs/v10/commit/cd019cbbf2444d3643438f1cd7b3ee05efc2350f))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/spf bumped to 10.0.0-alpha.10
    * @videojs/store bumped to 10.0.0-alpha.10
    * @videojs/utils bumped to 10.0.0-alpha.10

## [10.0.0-alpha.9](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.8...@videojs/core@10.0.0-alpha.9) (2026-03-06)


### Features

* add subtitles handling + captions core ([#692](https://github.com/videojs/v10/issues/692)) ([5c11606](https://github.com/videojs/v10/commit/5c116065a91ed04753bb2cb83e72dd6471f75ced))


### Bug Fixes

* **core:** auto-unmute on volume change and restore volume on unmute ([#752](https://github.com/videojs/v10/issues/752)) ([4466d0a](https://github.com/videojs/v10/commit/4466d0a15c2be9d1a0c23dace95cbd079d228d97))
* **core:** derive effective mute state for volume UI components ([#753](https://github.com/videojs/v10/issues/753)) ([14bcdc8](https://github.com/videojs/v10/commit/14bcdc833f0a09bb3ca92d8a02e68b6802aeebac))
* **core:** use double-RAF in transition open to enable entry animations ([#755](https://github.com/videojs/v10/issues/755)) ([7b6b301](https://github.com/videojs/v10/commit/7b6b3019dfaa41e34970e5827bd2ba21c7712fbe))
* delegate not defining Delegate props ([#751](https://github.com/videojs/v10/issues/751)) ([c61fcdc](https://github.com/videojs/v10/commit/c61fcdcc3a64f8a4ef32ec3fd332f1ec5cdbb311))
* destroy hls.js instance on media unmount ([#749](https://github.com/videojs/v10/issues/749)) ([c4e8bbd](https://github.com/videojs/v10/commit/c4e8bbd3a2bcb66027c64faf8de0ec61d22c84fa))
* ssr issue with hls.js ([#758](https://github.com/videojs/v10/issues/758)) ([bcc492f](https://github.com/videojs/v10/commit/bcc492f63f8d3e248b3cbba67cbc516420270920))
* textTrackList and optimize ([#760](https://github.com/videojs/v10/issues/760)) ([04e98f4](https://github.com/videojs/v10/commit/04e98f4007dcc5957ff4b646482036da49e1efd4))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/store bumped to 10.0.0-alpha.9
    * @videojs/utils bumped to 10.0.0-alpha.9

## [10.0.0-alpha.8](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.7...@videojs/core@10.0.0-alpha.8) (2026-03-05)


### Features

* **core:** add alert dialog with dismiss layer and transitions ([#743](https://github.com/videojs/v10/issues/743)) ([a80cf4e](https://github.com/videojs/v10/commit/a80cf4e06aaa6adfd5e916b4789cb40ac15ef9cf))
* **core:** add AlertDialog data attributes ([#738](https://github.com/videojs/v10/issues/738)) ([e2334a3](https://github.com/videojs/v10/commit/e2334a3767c8f9474d44c8baa25512041392e363))
* **core:** add error feature ([#713](https://github.com/videojs/v10/issues/713)) ([879d55d](https://github.com/videojs/v10/commit/879d55d1d216aac9f31f3fb22e2e31fde55a002b))
* **core:** add tooltip  ([#734](https://github.com/videojs/v10/issues/734)) ([b69a2f9](https://github.com/videojs/v10/commit/b69a2f9994eaf14f4f2bf64643d8fc18e901b365))
* **html:** add tooltip element ([#735](https://github.com/videojs/v10/issues/735)) ([e9fbaec](https://github.com/videojs/v10/commit/e9fbaece87c39c0adc41070159fd7e6f75f0e1da))
* **react:** add slider preview component ([#710](https://github.com/videojs/v10/issues/710)) ([db75697](https://github.com/videojs/v10/commit/db7569711e5a571f6af421987c8490c3de37ed78))
* small state and naming fixes  ([#719](https://github.com/videojs/v10/issues/719)) ([5c42245](https://github.com/videojs/v10/commit/5c422452e4b547dc00f13082b755ea12d1860f21))


### Bug Fixes

* **html:** slider interaction and edge alignment broken ([#721](https://github.com/videojs/v10/issues/721)) ([ff12296](https://github.com/videojs/v10/commit/ff122963553e23a58614c9c808763208fd893df1))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/store bumped to 10.0.0-alpha.8
    * @videojs/utils bumped to 10.0.0-alpha.8

## [10.0.0-alpha.7](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.6...@videojs/core@10.0.0-alpha.7) (2026-03-04)


### Miscellaneous Chores

* **@videojs/core:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/store bumped to 10.0.0-alpha.7
    * @videojs/utils bumped to 10.0.0-alpha.7

## [10.0.0-alpha.6](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.5...@videojs/core@10.0.0-alpha.6) (2026-03-04)


### Bug Fixes

* **core:** use camelCase attribute names in slider for react ([#708](https://github.com/videojs/v10/issues/708)) ([4e1f3af](https://github.com/videojs/v10/commit/4e1f3af2d71bfdacbd35e1363ecb8221e24558a3))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/store bumped to 10.0.0-alpha.6
    * @videojs/utils bumped to 10.0.0-alpha.6

## [10.0.0-alpha.5](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.4...@videojs/core@10.0.0-alpha.5) (2026-03-04)


### Features

* **core:** add popover component ([#615](https://github.com/videojs/v10/issues/615)) ([44188d4](https://github.com/videojs/v10/commit/44188d4823d687bae2806f38e199e9719ff05083))
* **core:** add thumbnail component and text track store feature ([#643](https://github.com/videojs/v10/issues/643)) ([7bae887](https://github.com/videojs/v10/commit/7bae887920a71665fdd24a2f0aca0718de062084))
* **html:** add slider element ([#655](https://github.com/videojs/v10/issues/655)) ([d5df015](https://github.com/videojs/v10/commit/d5df0150b3aef21c15d3a65c015bb6058e95ce53))
* **html:** add time slider element ([#656](https://github.com/videojs/v10/issues/656)) ([26c7395](https://github.com/videojs/v10/commit/26c7395cd0fe7e2fe8a8020ffae40cf81ffb3974))
* **html:** add volume slider element ([#657](https://github.com/videojs/v10/issues/657)) ([92b7c2a](https://github.com/videojs/v10/commit/92b7c2ac184d12c780ba1a1bb6f064782b77422a))
* **packages:** add PlaybackRateButton to core, html, and react ([#642](https://github.com/videojs/v10/issues/642)) ([0180828](https://github.com/videojs/v10/commit/0180828df91ad74f885906223fa7d359f1a2641a))
* **react:** add slider component ([#644](https://github.com/videojs/v10/issues/644)) ([2f8ca09](https://github.com/videojs/v10/commit/2f8ca094ad5bc5bafc5435c2e97bca58c6d29b5d))
* **site:** add TimeSlider, VolumeSlider, Popover API references ([#685](https://github.com/videojs/v10/issues/685)) ([8ab596e](https://github.com/videojs/v10/commit/8ab596ea30291d48962684203d153c689e1b0fec))


### Bug Fixes

* add SSR stubs for HLS media ([#641](https://github.com/videojs/v10/issues/641)) ([2b50825](https://github.com/videojs/v10/commit/2b508255736e0d9083a1a0baa90850de85f29b92))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/store bumped to 10.0.0-alpha.5
    * @videojs/utils bumped to 10.0.0-alpha.5

## [10.0.0-alpha.4](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.3...@videojs/core@10.0.0-alpha.4) (2026-02-26)


### Miscellaneous Chores

* **@videojs/core:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/store bumped to 10.0.0-alpha.4
    * @videojs/utils bumped to 10.0.0-alpha.4

## [10.0.0-alpha.3](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.2...@videojs/core@10.0.0-alpha.3) (2026-02-26)


### Bug Fixes

* **cd:** add repository field to all packages for provenance verification ([b723589](https://github.com/videojs/v10/commit/b72358904a78a9403df16d77936d4a1f41a64bfe))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/store bumped to 10.0.0-alpha.3
    * @videojs/utils bumped to 10.0.0-alpha.3

## [10.0.0-alpha.2](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.1...@videojs/core@10.0.0-alpha.2) (2026-02-26)


### Miscellaneous Chores

* **@videojs/core:** Synchronize videojs versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/store bumped to 10.0.0-alpha.2
    * @videojs/utils bumped to 10.0.0-alpha.2

## [10.0.0-alpha.1](https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.0...@videojs/core@10.0.0-alpha.1) (2026-02-26)


### Features

* add a solution for React preview time display ([#50](https://github.com/videojs/v10/issues/50)) ([f78b09f](https://github.com/videojs/v10/commit/f78b09fd16b7a9ee5a404c9260e3e764fb77ddde))
* add compound html timerange component ([#14](https://github.com/videojs/v10/issues/14)) ([017ecdb](https://github.com/videojs/v10/commit/017ecdbff991d140ea42e4a855269a54e0a19adc))
* add core range, time and volume range ([#23](https://github.com/videojs/v10/issues/23)) ([687b765](https://github.com/videojs/v10/commit/687b7655b0b6356c28663ca85c8f6d25a1023c18))
* add display click to play / pause ([#117](https://github.com/videojs/v10/issues/117)) ([4f06ef6](https://github.com/videojs/v10/commit/4f06ef6c7684fd7064ca76685003a1c38ebd09cd))
* add keyboard control to sliders ([#115](https://github.com/videojs/v10/issues/115)) ([0a49026](https://github.com/videojs/v10/commit/0a4902623d58f51055b1cc65498a0e716533ec29))
* add media API + HLS video components ([#507](https://github.com/videojs/v10/issues/507)) ([b3a31a3](https://github.com/videojs/v10/commit/b3a31a335a363d3a96b510206b57d1bb9ebb8edd))
* add media delegate mixin ([#598](https://github.com/videojs/v10/issues/598)) ([c4ef94e](https://github.com/videojs/v10/commit/c4ef94e82301be6705002d0a7d7c65463ece1045))
* add range orientation to react components ([#30](https://github.com/videojs/v10/issues/30)) ([5e3cb8a](https://github.com/videojs/v10/commit/5e3cb8ad8134ecaf20b6e021e301a38b8ed06de2))
* add tooltip core ([#212](https://github.com/videojs/v10/issues/212)) ([cbf41ce](https://github.com/videojs/v10/commit/cbf41ce4c750cd5c3bb6cbf247bad91ccd578cd0))
* **core,html,react:** implement VolumeRange component with integrated state management ([2282f47](https://github.com/videojs/v10/commit/2282f4799b1c3fc3c55473bdfc2def86384d5d19))
* **core:** add buffering indicator component ([#527](https://github.com/videojs/v10/issues/527)) ([aa0fb7c](https://github.com/videojs/v10/commit/aa0fb7ca704843dd6ac8b0b18d9e35f8f430311e))
* **core:** add controls component with activity tracking ([#514](https://github.com/videojs/v10/issues/514)) ([90d881c](https://github.com/videojs/v10/commit/90d881cec21d7f5e1e619061727e6c8d1ff48296))
* **core:** add fullscreen button component ([#459](https://github.com/videojs/v10/issues/459)) ([3c4152f](https://github.com/videojs/v10/commit/3c4152fb5845965334cfd7e3c2623ac978377d96))
* **core:** add mute button component ([#455](https://github.com/videojs/v10/issues/455)) ([aa189ee](https://github.com/videojs/v10/commit/aa189eec84482afde4dd42fc547af4759ea51742))
* **core:** add pip button component ([#525](https://github.com/videojs/v10/issues/525)) ([2c8b77a](https://github.com/videojs/v10/commit/2c8b77af4547b0a8af27abcc419f7d4dff3b005a))
* **core:** add play button component ([#383](https://github.com/videojs/v10/issues/383)) ([9cfab26](https://github.com/videojs/v10/commit/9cfab264d85ea5b8e20fc2d020171ba5ef53b0f4))
* **core:** add player target and feature selectors ([#371](https://github.com/videojs/v10/issues/371)) ([1bde6e9](https://github.com/videojs/v10/commit/1bde6e950a6024769cf63d04c66d1646fd31cc98))
* **core:** add poster component ([#457](https://github.com/videojs/v10/issues/457)) ([c9ba1e1](https://github.com/videojs/v10/commit/c9ba1e1bfc83e02981a2ffad0a0f247092068687))
* **core:** add presentation feature ([#458](https://github.com/videojs/v10/issues/458)) ([d5e5cec](https://github.com/videojs/v10/commit/d5e5cec6ab2f81275f488dcaa66edef573ce10bf))
* **core:** add seek button component ([#526](https://github.com/videojs/v10/issues/526)) ([c733077](https://github.com/videojs/v10/commit/c733077d324b3cd40eab7c0e33f1f73592609515))
* **core:** add slider dom ([#613](https://github.com/videojs/v10/issues/613)) ([4c7d287](https://github.com/videojs/v10/commit/4c7d287d357e1f1b820aca62b0a26eda225c441f))
* **core:** add time display component ([#460](https://github.com/videojs/v10/issues/460)) ([7b8bc11](https://github.com/videojs/v10/commit/7b8bc11f9f90684269b6acebeb79677063112e1f))
* **core:** dom media slices ([#292](https://github.com/videojs/v10/issues/292)) ([47659f5](https://github.com/videojs/v10/commit/47659f5352634ef094b9ab83476a59ac1f244115))
* **core:** implement temporal state management for time-based media controls ([1e12f66](https://github.com/videojs/v10/commit/1e12f66f16eedfe13af17ccfabca7ab0e8239313))
* **example/react:** improvements to react examples ([#210](https://github.com/videojs/v10/issues/210)) ([c35b012](https://github.com/videojs/v10/commit/c35b0122509ce3230dcfce4a0acf0d315ba5f0ee))
* **html:** reorganize import paths by use case ([#480](https://github.com/videojs/v10/issues/480)) ([870cbb7](https://github.com/videojs/v10/commit/870cbb77e4ac45d179d8702d0e08c58face8a2fc))
* **html:** setup player api ([#374](https://github.com/videojs/v10/issues/374)) ([a419f5e](https://github.com/videojs/v10/commit/a419f5ef190a47575c4a7e11353a5454e6ee7fe6))
* **icons:** add fullscreen enter and exit icons ([29ed5e3](https://github.com/videojs/v10/commit/29ed5e37593d7b5b40dba36bbadac5eed71c2710))
* **icons:** implement shared SVG icon system across packages ([e0be58e](https://github.com/videojs/v10/commit/e0be58e094e65ea72af99b2c1e1d87c507c251bd))
* implement current time display components ([5bd0a15](https://github.com/videojs/v10/commit/5bd0a154dbba01d2a5d11eb1f548fe4baa581675))
* initialize Video.js 10 monorepo with core architecture ([4b0d84e](https://github.com/videojs/v10/commit/4b0d84e9c8adfa7401084389da5deb751420b629))
* **media-store,html,react:** implement TimeRange component with hook-style architecture ([c29fd2c](https://github.com/videojs/v10/commit/c29fd2c2c1edd61c09a6683041c709a990d8a6f0))
* **media-store:** add comprehensive time formatting utilities ([7e26e54](https://github.com/videojs/v10/commit/7e26e547ea0b98c6366d6cf1b3800b5f253767a7))
* **media-store:** add duration display component state definition ([d0036fc](https://github.com/videojs/v10/commit/d0036fc7d68b4e50c5c7af863105900f20bee12c))
* **media-store:** add fullscreen button component state definition ([e19b98b](https://github.com/videojs/v10/commit/e19b98b1200f80f5303b4c8a76948254c95a8c81))
* **media-store:** add fullscreen state mediator with shadow DOM support ([7f243c2](https://github.com/videojs/v10/commit/7f243c22d85f45c5f7a88e3638f03ce774667d20))
* migrate entire monorepo from tsc to tsup for production builds ([7403cc7](https://github.com/videojs/v10/commit/7403cc728119322888e527468a07a7634f43b32a))
* **monorepo:** migrate prototype code to organized package structure ([4b472ec](https://github.com/videojs/v10/commit/4b472ec49cd91f0af61cb5aaa039d428982d3b91))
* **packages:** add slider core layer ([#529](https://github.com/videojs/v10/issues/529)) ([7efee3d](https://github.com/videojs/v10/commit/7efee3d03361f195706257b4950708cbe5356cf5))
* **react-icons:** implement SVGR-powered auto-generation with full styling support ([6fcb18f](https://github.com/videojs/v10/commit/6fcb18f1d2b108990025f8ea67b3a31e17879d49))
* **react:** implement default and minimal video skins ([#550](https://github.com/videojs/v10/issues/550)) ([7d3be36](https://github.com/videojs/v10/commit/7d3be367f5b31b8a6d5b9a9e3c87245f95b8e22a))
* **react:** implement video skins with responsive layout ([#568](https://github.com/videojs/v10/issues/568)) ([846d38e](https://github.com/videojs/v10/commit/846d38e79b11ba8de62bdb239bc1358e9abc28de))
* rename range to slider ([#46](https://github.com/videojs/v10/issues/46)) ([9c6eaef](https://github.com/videojs/v10/commit/9c6eaef2aa61771ae1407d0a594b3f790e0ff665))
* **site:** add util reference pipeline ([#537](https://github.com/videojs/v10/issues/537)) ([78112fb](https://github.com/videojs/v10/commit/78112fbefdaace678a2d1335409e40533f3819fa))
* **site:** generated multipart component api reference ([#468](https://github.com/videojs/v10/issues/468)) ([4b1e863](https://github.com/videojs/v10/commit/4b1e863883f730f561a490e58223d8298b5bef5c))
* **store:** lit bindings ([#289](https://github.com/videojs/v10/issues/289)) ([648aae7](https://github.com/videojs/v10/commit/648aae7e31db02f6d69dba138b98e7cbfd398902))
* **ui:** micro icons, toasted design tweaks ([#52](https://github.com/videojs/v10/issues/52)) ([bd3f0f7](https://github.com/videojs/v10/commit/bd3f0f7510480125653506d8e2e560234f6c06f2))
* **ui:** port over default skin ([ff4ea36](https://github.com/videojs/v10/commit/ff4ea3693e63ab3b5a728988ca44f3bab669e8ff))
* **ui:** port over default skin ([9950945](https://github.com/videojs/v10/commit/995094500823e1063e7ae291c9a2ea9a4aa74847))
* **ui:** skin and icon tweaks ([#59](https://github.com/videojs/v10/issues/59)) ([cdebece](https://github.com/videojs/v10/commit/cdebece1ebe8e5160b90e49ac2cbf05a7e0b6dca))


### Bug Fixes

* add popover core, use in html and improve factory ([#204](https://github.com/videojs/v10/issues/204)) ([f3b1b19](https://github.com/videojs/v10/commit/f3b1b199173f3750bc05ad9063fcccbd4163b12b))
* clean up core, less seams in wrappers ([#197](https://github.com/videojs/v10/issues/197)) ([601a5a3](https://github.com/videojs/v10/commit/601a5a37939605ca38f81a825fd02934e7928c39))
* Clean up more typescript errors. ([87105db](https://github.com/videojs/v10/commit/87105db6be31038fc92862c240898984d02932eb))
* **core:** fix circular import and simplify media types ([#569](https://github.com/videojs/v10/issues/569)) ([38b3a8f](https://github.com/videojs/v10/commit/38b3a8f55ca96938db92fa06c0d171bf544ffe3b))
* **core:** fixed fullscreen on ios safari ([#211](https://github.com/videojs/v10/issues/211)) ([6068633](https://github.com/videojs/v10/commit/6068633be0939c8024317abac0cb1cd5a262d07a))
* **core:** preserve user props in time slider ([#621](https://github.com/videojs/v10/issues/621)) ([23528ca](https://github.com/videojs/v10/commit/23528cad88fe1645df686d4cd74eaf4806a35d6a))
* **core:** update README to use v10 terminology ([93dd266](https://github.com/videojs/v10/commit/93dd266f551923e103111019e12834f27cefabe7))
* design tweaks to toasted skin, lint rule tweaks ([#44](https://github.com/videojs/v10/issues/44)) ([3a0767c](https://github.com/videojs/v10/commit/3a0767c3407b2d6d8af3d3a8afd57b1e76efda85))
* enable eslint & run eslint:fix ([#43](https://github.com/videojs/v10/issues/43)) ([5cb93a1](https://github.com/videojs/v10/commit/5cb93a14a7f47d66d5c71f9b82867621beda236c))
* **html:** discover media elements and attach store target via DOM ([#481](https://github.com/videojs/v10/issues/481)) ([5eab1db](https://github.com/videojs/v10/commit/5eab1dbb2fbb906543f7749e5956c9791c30be34))
* **icons:** add currentColor fill to fullscreen icons for proper theming ([d0d4876](https://github.com/videojs/v10/commit/d0d487601eb2da669be9a83cc8201d94998ec334))
* **media-store:** replace tsup with rollup for consistent build tooling ([77c2932](https://github.com/videojs/v10/commit/77c2932b8d504a3c66e0af3badf3b1332d5d92c0))
* **media-store:** resolve TypeScript declaration generation build issues ([d8809c5](https://github.com/videojs/v10/commit/d8809c5abe066a39a14b423be239fe7c0c234632))
* **media-store:** resolve TypeScript error in dispatch method ([3fd26eb](https://github.com/videojs/v10/commit/3fd26eb6544809d6a3e00a45e916f5e9fd61ae2a))
* **media:** use explicit exports to resolve React package TypeScript errors ([4662dbc](https://github.com/videojs/v10/commit/4662dbcbb1811293c98c803f8057a2534114d4ea))
* minimal volume slider bug & fix dev infinite bug ([#73](https://github.com/videojs/v10/issues/73)) ([591dab6](https://github.com/videojs/v10/commit/591dab66caf8829017688007320f92b7445c4baa))
* **packages:** enable unbundle mode to avoid mangled exports ([00fdf96](https://github.com/videojs/v10/commit/00fdf966ca5148bcca303058dd798b1b880896e0))
* **packages:** update version badges ([#138](https://github.com/videojs/v10/issues/138)) ([22d9cb6](https://github.com/videojs/v10/commit/22d9cb64f2e5b9601a2039bb166dbe3fee6a1b3e))
* resolve package dependency and TypeScript export issues ([7154b1e](https://github.com/videojs/v10/commit/7154b1e44674a61735ab0f393a8bed3fcc689f8d))
* resolve TypeScript build errors across packages ([374db7a](https://github.com/videojs/v10/commit/374db7afc07d6211bfd3f8079bbcd9613f3b69f3))
* **root:** add videojs keyword to package.json ([4a9f8b2](https://github.com/videojs/v10/commit/4a9f8b2ad6fb27b463dcfe8d1a5fd883c9fa21d1))
* seek jump back to current time ([#22](https://github.com/videojs/v10/issues/22)) ([a3f9630](https://github.com/videojs/v10/commit/a3f9630bd1eb34a16f339ffd30071b8adc864ca0))
* **site:** update discord link ([#170](https://github.com/videojs/v10/issues/170)) ([bb10294](https://github.com/videojs/v10/commit/bb10294419439fb02df650f3e7f7c5496ecc3a73))
* **time-display:** clean up time utilities and simplify components ([597e79d](https://github.com/videojs/v10/commit/597e79d7fc12737353c8c9eb3f6e77ef0a04e9ed))
* **typescript:** resolve declaration file generation for rollup packages ([#1](https://github.com/videojs/v10/issues/1)) ([69670e8](https://github.com/videojs/v10/commit/69670e8d7134db34aee665d8871cd17901625915))
* use popover core in react popover ([#208](https://github.com/videojs/v10/issues/208)) ([99fef78](https://github.com/videojs/v10/commit/99fef78f63e8dd121513b9cd20696a7d35603837))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @videojs/utils bumped to 10.0.0-alpha.1
