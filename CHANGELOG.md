# Changelog

All notable changes to this project will be documented in this file.

## [@videojs/core@10.0.1] - 2026-10-02

### 🚀 Features
- *(site)* Move pre-v10 blog posts to the legacy site ([#3127](https://github.com/videojs/v10/pull/3127)) by [@decepulis](https://github.com/decepulis)

### 🐛 Bug Fixes
- *(react)* Hand the playback adapter to mediaRef on adapter-backed media ([#3141](https://github.com/videojs/v10/pull/3141)) by [@luwes](https://github.com/luwes)
- *(mux-video)* Parse mux stream urls without the .m3u8 extension ([#3143](https://github.com/videojs/v10/pull/3143)) by [@luwes](https://github.com/luwes)
- *(react)* Accept autoPlay on embeds and drop callback-ref cleanups that warn on React 18 ([#3136](https://github.com/videojs/v10/pull/3136)) by [@luwes](https://github.com/luwes)
- *(youtube-video)* Keep the iframe in place when detach destroys the player ([#3154](https://github.com/videojs/v10/pull/3154)) by [@luwes](https://github.com/luwes)

### 📚 Documentation
- *(site)* Add changelog prose for 10.0.0-rc.5 ([#3129](https://github.com/videojs/v10/pull/3129)) by [@github-actions[bot]](https://github.com/github-actions[bot])
- *(site)* Add changelog prose for 10.0.0 ([#3133](https://github.com/videojs/v10/pull/3133)) by [@github-actions[bot]](https://github.com/github-actions[bot])
- *(blog)* Add Video.js 10 release post ([#3061](https://github.com/videojs/v10/pull/3061)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add live demos to skin reference pages ([#3137](https://github.com/videojs/v10/pull/3137)) by [@decepulis](https://github.com/decepulis)
- *(site)* Turn the nav version pill into a docs version menu ([#3144](https://github.com/videojs/v10/pull/3144)) by [@decepulis](https://github.com/decepulis)
- *(site)* Fix shadcn and migration links in 10.0 blog post ([#3148](https://github.com/videojs/v10/pull/3148)) by [@decepulis](https://github.com/decepulis)
- Say "media component" instead of "media element" ([#3150](https://github.com/videojs/v10/pull/3150)) by [@decepulis](https://github.com/decepulis)

### ⚙️ Miscellaneous Tasks
- *(release)* Add the 10.0.0 root and site changelog ([#3131](https://github.com/videojs/v10/pull/3131)) by [@decepulis](https://github.com/decepulis)
- *(root)* Remove release-as after the 10.0.0 release ([#3065](https://github.com/videojs/v10/pull/3065)) by [@decepulis](https://github.com/decepulis)
- *(packages)* Prune stale and add missing workspace dependencies ([#3125](https://github.com/videojs/v10/pull/3125)) by [@luwes](https://github.com/luwes)

## [@videojs/core@10.0.0] - 2026-10-01

### 🚀 Features
- *(packages)* Release Video.js 10.0.0 as stable ([#3058](https://github.com/videojs/v10/pull/3058)) by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-rc.5] - 2026-10-01

### 🚀 Features
- *(vjsc)* Flatten @scope in the packaged skins ([#2966](https://github.com/videojs/v10/pull/2966)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Support chrome 111, firefox 121, and safari 16.4 ([#2951](https://github.com/videojs/v10/pull/2951)) by [@sampotts](https://github.com/sampotts)
- *(core)* Add deriveCustomStatus to display custom actions ([#3064](https://github.com/videojs/v10/pull/3064)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(media)* Add resolveAdapterType and resolveMimeType ([#3024](https://github.com/videojs/v10/pull/3024)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Mask private installation input in PostHog analytics ([#2666](https://github.com/videojs/v10/pull/2666)) by [@decepulis](https://github.com/decepulis)
- *(site)* Tag clickable markup for PostHog autocapture ([#3084](https://github.com/videojs/v10/pull/3084)) by [@decepulis](https://github.com/decepulis)
- *(site)* Tag Mux links with their placement for attribution ([#3086](https://github.com/videojs/v10/pull/3086)) by [@decepulis](https://github.com/decepulis)
- *(site)* Record docs, installation, agent-handoff, and Mux upload events ([#3087](https://github.com/videojs/v10/pull/3087)) by [@decepulis](https://github.com/decepulis)
- *(site)* Count agent Markdown reads at the edge ([#3081](https://github.com/videojs/v10/pull/3081)) by [@decepulis](https://github.com/decepulis)
- *(packages)* Export a per-package VERSION from core, html, and react ([#3078](https://github.com/videojs/v10/pull/3078)) by [@decepulis](https://github.com/decepulis)
- *(react)* Add mediaRef prop to media components ([#3098](https://github.com/videojs/v10/pull/3098)) by [@luwes](https://github.com/luwes)
- *(skin)* Add compat skin ([#3026](https://github.com/videojs/v10/pull/3026)) by [@sampotts](https://github.com/sampotts)
- *(site)* Check that undocumented public exports are tagged internal ([#3063](https://github.com/videojs/v10/pull/3063)) by [@decepulis](https://github.com/decepulis)

### 🐛 Bug Fixes
- *(packages)* Name Video.js 10 in npm descriptions and keywords ([#2995](https://github.com/videojs/v10/pull/2995)) by [@mihar-22](https://github.com/mihar-22)
- *(test)* Stop e2e web servers hanging at teardown ([#2991](https://github.com/videojs/v10/pull/2991)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Preserve submenu exit transitions ([#3025](https://github.com/videojs/v10/pull/3025)) by [@sampotts](https://github.com/sampotts)
- *(native-hls)* Honour SERVER-CONTROL hold-back when deriving the live edge ([#3027](https://github.com/videojs/v10/pull/3027)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(react)* Declare client boundaries per module ([#3079](https://github.com/videojs/v10/pull/3079)) by [@mihar-22](https://github.com/mihar-22)
- *(media)* Keep hls.js text tracks when MEDIA_ATTACHED follows the manifest ([#3099](https://github.com/videojs/v10/pull/3099)) by [@spuppo-mux](https://github.com/spuppo-mux)

### 🚜 Refactor
- *(core)* [**breaking**] Align player store API ([#3012](https://github.com/videojs/v10/pull/3012)) by [@luwes](https://github.com/luwes)
- *(media)* [**breaking**] Tidy text track state ([#3057](https://github.com/videojs/v10/pull/3057)) by [@luwes](https://github.com/luwes)
- *(skin)* Reduce default saturation filter ([#3091](https://github.com/videojs/v10/pull/3091)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Rename media-opaque to media-high-contrast ([#3094](https://github.com/videojs/v10/pull/3094)) by [@sampotts](https://github.com/sampotts)
- *(packages)* [**breaking**] Attach extensions at the player ([#2880](https://github.com/videojs/v10/pull/2880)) by [@luwes](https://github.com/luwes)
- *(packages)* [**breaking**] Rename the minimal skin to neutral ([#3092](https://github.com/videojs/v10/pull/3092)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* [**breaking**] Export compound radio groups from the package root ([#3073](https://github.com/videojs/v10/pull/3073)) by [@decepulis](https://github.com/decepulis)
- *(react,html)* [**breaking**] Make every stable type importable from the framework packages ([#3082](https://github.com/videojs/v10/pull/3082)) by [@decepulis](https://github.com/decepulis)

### 📚 Documentation
- *(site)* Add changelog prose for 10.0.0-rc.4 ([#2988](https://github.com/videojs/v10/pull/2988)) by [@github-actions[bot]](https://github.com/github-actions[bot])
- *(site)* Add player store api overview page ([#3034](https://github.com/videojs/v10/pull/3034)) by [@luwes](https://github.com/luwes)
- *(site)* Improve migration accuracy and agent guidance ([#3074](https://github.com/videojs/v10/pull/3074)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Improve playback guides and examples ([#3075](https://github.com/videojs/v10/pull/3075)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Correct stale playback and package guidance ([#3076](https://github.com/videojs/v10/pull/3076)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Add the vidstack migration guide ([#3021](https://github.com/videojs/v10/pull/3021)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Stop using internal APIs in examples ([#3066](https://github.com/videojs/v10/pull/3066)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add reference pages for presets, useMedia, UIElement, and icons ([#3067](https://github.com/videojs/v10/pull/3067)) by [@decepulis](https://github.com/decepulis)

### 🧪 Testing
- *(skins)* Check the skins in the oldest supported engines ([#2952](https://github.com/videojs/v10/pull/2952)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Audit every test with the maintain-tests skill ([#3080](https://github.com/videojs/v10/pull/3080)) by [@mihar-22](https://github.com/mihar-22)

### ⚙️ Miscellaneous Tasks
- *(root)* Bump pnpm to 12.6.0 ([#2990](https://github.com/videojs/v10/pull/2990)) by [@mihar-22](https://github.com/mihar-22)
- *(cd)* Allow resuming a partially published release ([#2989](https://github.com/videojs/v10/pull/2989)) by [@mihar-22](https://github.com/mihar-22)
- *(root)* Upgrade vite+ to 1.0.0 ([#3010](https://github.com/videojs/v10/pull/3010)) by [@mihar-22](https://github.com/mihar-22)
- *(test)* Cut the e2e jobs competing for runners ([#3017](https://github.com/videojs/v10/pull/3017)) by [@sampotts](https://github.com/sampotts)
- *(root)* Silence module-level directive warnings in pack builds ([#3018](https://github.com/videojs/v10/pull/3018)) by [@sampotts](https://github.com/sampotts)
- *(root)* Keep directive warnings in bundled packs ([#3022](https://github.com/videojs/v10/pull/3022)) by [@mihar-22](https://github.com/mihar-22)
- *(test)* Add browserstack compatibility checks ([#3071](https://github.com/videojs/v10/pull/3071)) by [@sampotts](https://github.com/sampotts)
- *(ci)* Remove e2e failure triage ([#3095](https://github.com/videojs/v10/pull/3095)) by [@sampotts](https://github.com/sampotts)
- Tag undocumented public exports @internal and enforce it in CI ([#3068](https://github.com/videojs/v10/pull/3068)) by [@decepulis](https://github.com/decepulis)
- *(store)* Check and tag store's public exports ([#3083](https://github.com/videojs/v10/pull/3083)) by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-rc.4] - 2026-09-26

### 🐛 Bug Fixes
- *(hlsjs-video)* Apply auto quality while playback is stalled ([#2979](https://github.com/videojs/v10/pull/2979)) by [@luwes](https://github.com/luwes)
- *(installation)* Default a plain HTML page to CDN scripts ([#2983](https://github.com/videojs/v10/pull/2983)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Tighten docs header and switch sidebar sections in place ([#2987](https://github.com/videojs/v10/pull/2987)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Upgrade astro to 7.3.5 ([#2986](https://github.com/videojs/v10/pull/2986)) by [@mihar-22](https://github.com/mihar-22)

### 📚 Documentation
- *(site)* Add changelog prose for 10.0.0-rc.3 ([#2977](https://github.com/videojs/v10/pull/2977)) by [@github-actions[bot]](https://github.com/github-actions[bot])
- *(packages)* Fix broken doc links and hls-video source docs ([#2985](https://github.com/videojs/v10/pull/2985)) by [@mihar-22](https://github.com/mihar-22)

## [@videojs/core@10.0.0-rc.3] - 2026-09-25

### 🚀 Features
- *(skin)* Slot the slider thumbnail image ([#2700](https://github.com/videojs/v10/pull/2700)) by [@luwes](https://github.com/luwes)
- *(sandbox)* Add aspect ratio preview option ([#2709](https://github.com/videojs/v10/pull/2709)) by [@sampotts](https://github.com/sampotts)
- *(mux-video)* Load the asset title from the mux metadata api ([#2726](https://github.com/videojs/v10/pull/2726)) by [@luwes](https://github.com/luwes)
- *(skins)* Add theme-scoped shadcn registries ([#2736](https://github.com/videojs/v10/pull/2736)) by [@mihar-22](https://github.com/mihar-22)
- *(spf)* Support apple json chapters from ext-x-session-data ([#2737](https://github.com/videojs/v10/pull/2737)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(cdn)* Open every entry bundle with a Video.js banner ([#2762](https://github.com/videojs/v10/pull/2762)) by [@decepulis](https://github.com/decepulis)
- *(site)* Framework-agnostic docs links ([#2756](https://github.com/videojs/v10/pull/2756)) by [@decepulis](https://github.com/decepulis)
- *(site)* Reclaim html5-video-support with a real page ([#2757](https://github.com/videojs/v10/pull/2757)) by [@decepulis](https://github.com/decepulis)
- About-this-player page and a help link in every player ([#2758](https://github.com/videojs/v10/pull/2758)) by [@decepulis](https://github.com/decepulis)
- *(site)* Redesign docs site and reorganize doc sections ([#2645](https://github.com/videojs/v10/pull/2645)) by [@mihar-22](https://github.com/mihar-22)
- *(video.js)* Add the video.js package with coded v8 stubs ([#2735](https://github.com/videojs/v10/pull/2735)) by [@luwes](https://github.com/luwes)
- *(site)* Generate the videojs.org/errors pages from the video.js registry ([#2752](https://github.com/videojs/v10/pull/2752)) by [@luwes](https://github.com/luwes)
- *(skin)* Add title display ([#2748](https://github.com/videojs/v10/pull/2748)) by [@sampotts](https://github.com/sampotts)
- *(cdn)* Publish one ui bundle per @videojs/html ui definition ([#2887](https://github.com/videojs/v10/pull/2887)) by [@luwes](https://github.com/luwes)
- *(spf)* Add EME-based DRM support to the HLS engine ([#2291](https://github.com/videojs/v10/pull/2291)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(html)* Export translateText from html entry points ([#2947](https://github.com/videojs/v10/pull/2947)) by [@sampotts](https://github.com/sampotts)
- *(site)* Reorganize installation guides ([#2848](https://github.com/videojs/v10/pull/2848)) by [@mihar-22](https://github.com/mihar-22)
- *(cli)* Route installation docs by method ([#2877](https://github.com/videojs/v10/pull/2877)) by [@mihar-22](https://github.com/mihar-22)
- *(installation)* Add versioned agent instructions ([#2948](https://github.com/videojs/v10/pull/2948)) by [@mihar-22](https://github.com/mihar-22)

### 🐛 Bug Fixes
- *(skin)* Restore intrinsic height ([#2707](https://github.com/videojs/v10/pull/2707)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Resolve blurry slider rendering ([#2705](https://github.com/videojs/v10/pull/2705)) by [@sampotts](https://github.com/sampotts)
- *(test)* Restore the skin parity suite and speed up ci ([#2717](https://github.com/videojs/v10/pull/2717)) by [@luwes](https://github.com/luwes)
- *(react)* Route media event props on embed medias ([#2712](https://github.com/videojs/v10/pull/2712)) by [@luwes](https://github.com/luwes)
- *(skin)* Simplify the slider styles ([#2719](https://github.com/videojs/v10/pull/2719)) by [@sampotts](https://github.com/sampotts)
- *(core)* Apply popup starting styles before showing ([#2715](https://github.com/videojs/v10/pull/2715)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Animate slider progress continuously across chapters ([#2721](https://github.com/videojs/v10/pull/2721)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Restore settings rotation and rtl parity ([#2723](https://github.com/videojs/v10/pull/2723)) by [@sampotts](https://github.com/sampotts)
- *(react)* Keep media attached when the composed ref changes identity ([#2729](https://github.com/videojs/v10/pull/2729)) by [@luwes](https://github.com/luwes)
- *(skin)* Use shared browser targets for css builds ([#2730](https://github.com/videojs/v10/pull/2730)) by [@sampotts](https://github.com/sampotts)
- *(react)* Volume popover not working with react compiler ([#2742](https://github.com/videojs/v10/pull/2742)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Disable stale hls text tracks ([#2747](https://github.com/videojs/v10/pull/2747)) by [@mihar-22](https://github.com/mihar-22)
- *(youtube-video)* Keep current time updating during playback ([#2744](https://github.com/videojs/v10/pull/2744)) by [@mihar-22](https://github.com/mihar-22)
- *(vjsc)* Simplify zero length calculations ([#2739](https://github.com/videojs/v10/pull/2739)) by [@sampotts](https://github.com/sampotts)
- *(html)* Register skin properties in the host document ([#2750](https://github.com/videojs/v10/pull/2750)) by [@sampotts](https://github.com/sampotts)
- *(ci)* Isolate bundle size comparison inputs ([#2766](https://github.com/videojs/v10/pull/2766)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Restore minimal audio borders ([#2816](https://github.com/videojs/v10/pull/2816)) by [@mihar-22](https://github.com/mihar-22)
- *(i18n)* Retranslate French error strings and fix typography ([#2791](https://github.com/videojs/v10/pull/2791)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Slovak exit labels and retranslate error strings ([#2792](https://github.com/videojs/v10/pull/2792)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Spanish button labels and retranslate error strings ([#2767](https://github.com/videojs/v10/pull/2767)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Latvian caption and cast terms and error strings ([#2793](https://github.com/videojs/v10/pull/2793)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Fix Nynorsk word errors and retranslate error strings ([#2794](https://github.com/videojs/v10/pull/2794)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Bosnian button labels and retranslate error strings ([#2795](https://github.com/videojs/v10/pull/2795)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct galician unmute label and retranslate error strings ([#2768](https://github.com/videojs/v10/pull/2768)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Occitan control labels and retranslate error strings ([#2796](https://github.com/videojs/v10/pull/2796)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Romanian button labels and retranslate error strings ([#2797](https://github.com/videojs/v10/pull/2797)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Catalan imperatives and retranslate error strings ([#2798](https://github.com/videojs/v10/pull/2798)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Welsh mute and seek labels and error strings ([#2799](https://github.com/videojs/v10/pull/2799)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Hungarian seek labels and retranslate error strings ([#2800](https://github.com/videojs/v10/pull/2800)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Dutch button labels and retranslate error strings ([#2770](https://github.com/videojs/v10/pull/2770)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Serbian script mix, cast wording and error strings ([#2801](https://github.com/videojs/v10/pull/2801)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Japanese control labels and retranslate error strings ([#2771](https://github.com/videojs/v10/pull/2771)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Danish button labels and retranslate error strings ([#2802](https://github.com/videojs/v10/pull/2802)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct German control labels and retranslate error strings ([#2772](https://github.com/videojs/v10/pull/2772)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Arabic control labels and retranslate error strings ([#2803](https://github.com/videojs/v10/pull/2803)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Korean control labels and retranslate error strings ([#2773](https://github.com/videojs/v10/pull/2773)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Scottish Gaelic captions and pip terms and errors ([#2804](https://github.com/videojs/v10/pull/2804)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct zh-CN unmute label, punctuation and error strings ([#2774](https://github.com/videojs/v10/pull/2774)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Swedish player labels and retranslate error strings ([#2775](https://github.com/videojs/v10/pull/2775)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Unify Hindi player terms and retranslate error strings ([#2807](https://github.com/videojs/v10/pull/2807)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Thai player terminology and retranslate error strings ([#2808](https://github.com/videojs/v10/pull/2808)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Russian button labels and retranslate error strings ([#2776](https://github.com/videojs/v10/pull/2776)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Retranslate pt-BR error strings and playback-rate label ([#2809](https://github.com/videojs/v10/pull/2809)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Replace mainland terms in zh-TW and fix error strings ([#2777](https://github.com/videojs/v10/pull/2777)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Marathi captions, verbs and error strings ([#2810](https://github.com/videojs/v10/pull/2810)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Hebrew control labels and retranslate error strings ([#2778](https://github.com/videojs/v10/pull/2778)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Vietnamese captions and pip terms and error strings ([#2811](https://github.com/videojs/v10/pull/2811)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Finnish control labels and retranslate error strings ([#2779](https://github.com/videojs/v10/pull/2779)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Indonesian seek label and time suffix word order ([#2812](https://github.com/videojs/v10/pull/2812)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Nepali control labels and error strings ([#2813](https://github.com/videojs/v10/pull/2813)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Ukrainian player terms and retranslate error strings ([#2780](https://github.com/videojs/v10/pull/2780)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Azerbaijani mute labels, captions term and error strings ([#2814](https://github.com/videojs/v10/pull/2814)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct European Portuguese labels and error strings ([#2781](https://github.com/videojs/v10/pull/2781)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Telugu control labels and retranslate error strings ([#2815](https://github.com/videojs/v10/pull/2815)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Bulgarian control labels and retranslate error strings ([#2782](https://github.com/videojs/v10/pull/2782)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Greek mixed-script labels and error strings ([#2783](https://github.com/videojs/v10/pull/2783)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Persian control labels and retranslate error strings ([#2784](https://github.com/videojs/v10/pull/2784)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Polish announcements and retranslate error strings ([#2785](https://github.com/videojs/v10/pull/2785)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Turkish control labels and retranslate error strings ([#2786](https://github.com/videojs/v10/pull/2786)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Czech subtitle announcements and error strings ([#2787](https://github.com/videojs/v10/pull/2787)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Norwegian Bokmål player labels and error strings ([#2788](https://github.com/videojs/v10/pull/2788)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Estonian control labels and retranslate error strings ([#2789](https://github.com/videojs/v10/pull/2789)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Croatian button labels and retranslate error strings ([#2790](https://github.com/videojs/v10/pull/2790)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct italian control labels and retranslate error strings ([#2769](https://github.com/videojs/v10/pull/2769)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Correct Slovenian caption announcements and error strings ([#2806](https://github.com/videojs/v10/pull/2806)) by [@decepulis](https://github.com/decepulis)
- *(site)* Restore the 450 body weight and antialiasing ([#2821](https://github.com/videojs/v10/pull/2821)) by [@decepulis](https://github.com/decepulis)
- *(site)* Leave non-matching FrameworkCase content out of the html ([#2837](https://github.com/videojs/v10/pull/2837)) by [@decepulis](https://github.com/decepulis)
- *(skin)* Separate preset token layer ([#2840](https://github.com/videojs/v10/pull/2840)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Forward refs to plain function render targets on react 18 ([#2842](https://github.com/videojs/v10/pull/2842)) by [@mihar-22](https://github.com/mihar-22)
- *(vjsc)* Merge classes using custom theme tokens ([#2738](https://github.com/videojs/v10/pull/2738)) by [@sampotts](https://github.com/sampotts)
- *(hlsjs-video)* Route legacy hls mime types to hls.js ([#2866](https://github.com/videojs/v10/pull/2866)) by [@luwes](https://github.com/luwes)
- *(site)* Stabilize docs shell and navigation ([#2839](https://github.com/videojs/v10/pull/2839)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Improve demo button contrast ([#2845](https://github.com/videojs/v10/pull/2845)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Normalize api reference display types ([#2846](https://github.com/videojs/v10/pull/2846)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Compact api reference table details ([#2847](https://github.com/videojs/v10/pull/2847)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Respond to system color scheme change ([#2879](https://github.com/videojs/v10/pull/2879)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Stack status indicators above the title ([#2875](https://github.com/videojs/v10/pull/2875)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Keep the time slider interactive without the buffer feature ([#2869](https://github.com/videojs/v10/pull/2869)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(packages)* Align title display files ([#2949](https://github.com/videojs/v10/pull/2949)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Improve markdown for agents ([#2883](https://github.com/videojs/v10/pull/2883)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Use audio-only demo source ([#2889](https://github.com/videojs/v10/pull/2889)) by [@mihar-22](https://github.com/mihar-22)
- *(vjsc)* Pin one tailwind and lightningcss for the workspace ([#2971](https://github.com/videojs/v10/pull/2971)) by [@mihar-22](https://github.com/mihar-22)
- *(vjsc)* Serialize HTML void elements without closing tags ([#2976](https://github.com/videojs/v10/pull/2976)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Keep controls visible when seeking in Safari 16 ([#2962](https://github.com/videojs/v10/pull/2962)) by [@sampotts](https://github.com/sampotts)
- *(core)* Position and hide popups without the Popover API ([#2963](https://github.com/videojs/v10/pull/2963)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Guard Intl.ListFormat and AbortSignal.any ([#2964](https://github.com/videojs/v10/pull/2964)) by [@sampotts](https://github.com/sampotts)
- *(utils)* Detect constructable stylesheets before creating one ([#2967](https://github.com/videojs/v10/pull/2967)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Prevent menu highlight flicker ([#2969](https://github.com/videojs/v10/pull/2969)) by [@sampotts](https://github.com/sampotts)
- *(core)* Move focus before hiding menu pages ([#2968](https://github.com/videojs/v10/pull/2968)) by [@sampotts](https://github.com/sampotts)

### 💼 Other
- *(packages)* Compile published react sources ([#2745](https://github.com/videojs/v10/pull/2745)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Use native react compiler ([#2743](https://github.com/videojs/v10/pull/2743)) by [@mihar-22](https://github.com/mihar-22)

### 🚜 Refactor
- *(skin)* Harden style reset ([#2704](https://github.com/videojs/v10/pull/2704)) by [@sampotts](https://github.com/sampotts)
- *(html)* Limit the shadow stylesheet to host integration ([#2853](https://github.com/videojs/v10/pull/2853)) by [@sampotts](https://github.com/sampotts)

### 📚 Documentation
- Announce the v10 release candidate ([#2658](https://github.com/videojs/v10/pull/2658)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add changelog prose for 10.0.0-rc.2 ([#2699](https://github.com/videojs/v10/pull/2699)) by [@github-actions[bot]](https://github.com/github-actions[bot])
- *(site)* Minor changes to v8 migration guide ([#2716](https://github.com/videojs/v10/pull/2716)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(site)* Note useMedia returns a Media wrapper, not a CanvasImageSource ([#1877](https://github.com/videojs/v10/pull/1877)) by [@claude[bot]](https://github.com/claude[bot])
- *(site)* Include Mux Data by default in Mux installation examples ([#2570](https://github.com/videojs/v10/pull/2570)) by [@heff](https://github.com/heff)
- *(design)* Fix common-media-library upstream links ([#2667](https://github.com/videojs/v10/pull/2667)) by [@littlespex](https://github.com/littlespex)
- *(site)* Import every html ui part in demos and references ([#2843](https://github.com/videojs/v10/pull/2843)) by [@luwes](https://github.com/luwes)
- *(i18n)* Add write-locale-translations skill ([#2865](https://github.com/videojs/v10/pull/2865)) by [@decepulis](https://github.com/decepulis)
- *(site)* Document the css support floor and how to recompile skins for older browsers ([#2856](https://github.com/videojs/v10/pull/2856)) by [@sampotts](https://github.com/sampotts)
- *(root)* Require visual evidence for visual prs ([#2876](https://github.com/videojs/v10/pull/2876)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Replace eject terminology ([#2851](https://github.com/videojs/v10/pull/2851)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Link skin references to shadcn ([#2852](https://github.com/videojs/v10/pull/2852)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Document the Video.js agent skill ([#2888](https://github.com/videojs/v10/pull/2888)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Set the vite floor at 4.1 and note testing through vite 8 ([#2956](https://github.com/videojs/v10/pull/2956)) by [@decepulis](https://github.com/decepulis)
- *(site)* Organize error references and playback guidance ([#2950](https://github.com/videojs/v10/pull/2950)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Limit native video to short clips without controls ([#2959](https://github.com/videojs/v10/pull/2959)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Correct and extend the accessibility guide ([#2960](https://github.com/videojs/v10/pull/2960)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Note that the video.js npm package is still v8 ([#2957](https://github.com/videojs/v10/pull/2957)) by [@mihar-22](https://github.com/mihar-22)

### ⚡ Performance
- *(site)* Faster docs dev server start ([#2698](https://github.com/videojs/v10/pull/2698)) by [@mihar-22](https://github.com/mihar-22)

### 🧪 Testing
- Fix e2e tests for volume slider ([#2724](https://github.com/videojs/v10/pull/2724)) by [@sampotts](https://github.com/sampotts)

### ⚙️ Miscellaneous Tasks
- *(site)* Forward-port blog posts to site/v10 ([#2701](https://github.com/videojs/v10/pull/2701)) by [@decepulis](https://github.com/decepulis)
- *(release-pr)* Cancel superseded changelog runs ([#2702](https://github.com/videojs/v10/pull/2702)) by [@decepulis](https://github.com/decepulis)
- Point every public package's homepage at videojs.org ([#2761](https://github.com/videojs/v10/pull/2761)) by [@decepulis](https://github.com/decepulis)
- Enable tailwind intellisense for skin styles ([#2740](https://github.com/videojs/v10/pull/2740)) by [@sampotts](https://github.com/sampotts)
- *(root)* Add optional mise toolchain config ([#1894](https://github.com/videojs/v10/pull/1894)) by [@mmcc](https://github.com/mmcc)
- *(root)* Disable zed format-on-save for markdown and mdx ([#2867](https://github.com/videojs/v10/pull/2867)) by [@luwes](https://github.com/luwes)
- *(build)* Remove the unused inline CSS plugin ([#2965](https://github.com/videojs/v10/pull/2965)) by [@sampotts](https://github.com/sampotts)

## [@videojs/core@10.0.0-rc.2] - 2026-09-09

### 🚀 Features
- *(react)* [**breaking**] Make poster composable ([#2563](https://github.com/videojs/v10/pull/2563)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* [**breaking**] Make thumbnail composable ([#2566](https://github.com/videojs/v10/pull/2566)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* [**breaking**] Make slider thumbnail composable ([#2568](https://github.com/videojs/v10/pull/2568)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Handle controls before media metadata ([#2525](https://github.com/videojs/v10/pull/2525)) by [@sampotts](https://github.com/sampotts)
- *(html)* [**breaking**] Make thumbnail images composable ([#2572](https://github.com/videojs/v10/pull/2572)) by [@mihar-22](https://github.com/mihar-22)

### 🐛 Bug Fixes
- *(ci)* Comment on open prs for e2e failures ([#2653](https://github.com/videojs/v10/pull/2653)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Misc styles fixes ([#2558](https://github.com/videojs/v10/pull/2558)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Stabilize slider keyboard input ([#2553](https://github.com/videojs/v10/pull/2553)) by [@sampotts](https://github.com/sampotts)
- *(test)* Wait for fullscreen thumbnail geometry ([#2654](https://github.com/videojs/v10/pull/2654)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Use finite radius to fix Safari clip-path bug ([#2679](https://github.com/videojs/v10/pull/2679)) by [@sampotts](https://github.com/sampotts)
- *(site)* Keep shared-source react parts in the api reference ([#2682](https://github.com/videojs/v10/pull/2682)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Expand namespace re-exports into nested api reference parts ([#2683](https://github.com/videojs/v10/pull/2683)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Style poster and slider thumbnail shadow hosts in webkit ([#2693](https://github.com/videojs/v10/pull/2693)) by [@luwes](https://github.com/luwes)

### 🚜 Refactor
- *(core)* Use simple file names in ui directories ([#2671](https://github.com/videojs/v10/pull/2671)) by [@mihar-22](https://github.com/mihar-22)
- *(sandbox)* Use shadcn base ui components ([#2668](https://github.com/videojs/v10/pull/2668)) by [@sampotts](https://github.com/sampotts)
- *(html)* Use simple file names in ui and player directories ([#2673](https://github.com/videojs/v10/pull/2673)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Use simple file names in ui directories ([#2674](https://github.com/videojs/v10/pull/2674)) by [@mihar-22](https://github.com/mihar-22)
- *(sandbox)* Spell out the player markup in the html templates ([#2691](https://github.com/videojs/v10/pull/2691)) by [@luwes](https://github.com/luwes)

### 📚 Documentation
- *(site)* Document compound react radio group parts ([#2688](https://github.com/videojs/v10/pull/2688)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Document always-visible controls ([#2687](https://github.com/videojs/v10/pull/2687)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Describe container-scoped error dialog modality ([#2686](https://github.com/videojs/v10/pull/2686)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Use playback adapter terminology in react media hooks ([#2685](https://github.com/videojs/v10/pull/2685)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Describe slider thumbnail props in the timeline previews guide ([#2681](https://github.com/videojs/v10/pull/2681)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Document disabled and unavailable time and live button states ([#2680](https://github.com/videojs/v10/pull/2680)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Add changelog prose for 10.0.0-rc.1 ([#2694](https://github.com/videojs/v10/pull/2694)) by [@github-actions[bot]](https://github.com/github-actions[bot])

### ⚙️ Miscellaneous Tasks
- *(cd)* Drop the rc.1 release-as pin and fix the dist-tag workflow ([#2660](https://github.com/videojs/v10/pull/2660)) by [@decepulis](https://github.com/decepulis)
- *(ci)* Run affected package tests in grouped jobs ([#2651](https://github.com/videojs/v10/pull/2651)) by [@mihar-22](https://github.com/mihar-22)
- *(dist-tag)* Tag every package before failing on the ones npm rejected ([#2662](https://github.com/videojs/v10/pull/2662)) by [@decepulis](https://github.com/decepulis)
- *(changelog-prose)* Give the prose job 60 minutes ([#2689](https://github.com/videojs/v10/pull/2689)) by [@decepulis](https://github.com/decepulis)
- *(changelog-prose)* Pre-fetch context and let the workflow open the PR ([#2690](https://github.com/videojs/v10/pull/2690)) by [@decepulis](https://github.com/decepulis)
- *(root)* Upgrade workspace and ci to pnpm 12 ([#2695](https://github.com/videojs/v10/pull/2695)) by [@mihar-22](https://github.com/mihar-22)
- Run vp through a file so forwarding output cannot hit EAGAIN ([#2697](https://github.com/videojs/v10/pull/2697)) by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-rc.1] - 2026-09-08

### 🚀 Features
- *(packages)* Add wistia video media ([#2305](https://github.com/videojs/v10/pull/2305)) by [@luwes](https://github.com/luwes)
- *(html)* Publish skin stylesheets to the CDN build ([#2340](https://github.com/videojs/v10/pull/2340)) by [@luwes](https://github.com/luwes)
- *(site)* Show the documented Video.js version in the docs navbar ([#2467](https://github.com/videojs/v10/pull/2467)) by [@decepulis](https://github.com/decepulis)
- *(skin)* Add VJSC video skins ([#2479](https://github.com/videojs/v10/pull/2479)) by [@mihar-22](https://github.com/mihar-22)
- *(vjsc)* Add named render targets ([#2527](https://github.com/videojs/v10/pull/2527)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Share menu option state across targets ([#2528](https://github.com/videojs/v10/pull/2528)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Define Shadcn registry catalog ([#2544](https://github.com/videojs/v10/pull/2544)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Generate framework skins from registry ([#2545](https://github.com/videojs/v10/pull/2545)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Generate VJSC skin templates ([#2546](https://github.com/videojs/v10/pull/2546)) by [@mihar-22](https://github.com/mihar-22)
- *(sandbox)* Fold the skins playground into the sandbox ([#2586](https://github.com/videojs/v10/pull/2586)) by [@mihar-22](https://github.com/mihar-22)

### 🐛 Bug Fixes
- *(site)* Split changelog from root llms index ([#2444](https://github.com/videojs/v10/pull/2444)) by [@decepulis](https://github.com/decepulis)
- *(ci)* Restore codex agent workflows ([#2443](https://github.com/videojs/v10/pull/2443)) by [@decepulis](https://github.com/decepulis)
- *(html)* Remove tailwind skin elements ([#2434](https://github.com/videojs/v10/pull/2434)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Scope error dialogs to player containers ([#2449](https://github.com/videojs/v10/pull/2449)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Hide source-less poster images ([#2453](https://github.com/videojs/v10/pull/2453)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Preserve fullscreen after pointer activation ([#2472](https://github.com/videojs/v10/pull/2472)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Reject invalid gesture types ([#2473](https://github.com/videojs/v10/pull/2473)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Isolate focused slider hotkeys ([#2474](https://github.com/videojs/v10/pull/2474)) by [@sampotts](https://github.com/sampotts)
- *(core)* Suppress repeated volume boundary feedback ([#2475](https://github.com/videojs/v10/pull/2475)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Contain error dialogs in player layouts ([#2451](https://github.com/videojs/v10/pull/2451)) by [@mihar-22](https://github.com/mihar-22)
- Track disableRemotePlayback Preference ([#1889](https://github.com/videojs/v10/pull/1889)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(site)* Repair broken docs anchors and add built-page anchor checker ([#2457](https://github.com/videojs/v10/pull/2457)) by [@decepulis](https://github.com/decepulis)
- *(site)* Convert docs link cards to clean markdown list items ([#2466](https://github.com/videojs/v10/pull/2466)) by [@decepulis](https://github.com/decepulis)
- *(packages)* Restore ejected player registration and slider press locking ([#2505](https://github.com/videojs/v10/pull/2505)) by [@luwes](https://github.com/luwes)
- *(packages)* Align dialog styles across skins ([#2481](https://github.com/videojs/v10/pull/2481)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Share input action defaults ([#2484](https://github.com/videojs/v10/pull/2484)) by [@sampotts](https://github.com/sampotts)
- Scale seek-bar thumbnails to fill their box ([#2517](https://github.com/videojs/v10/pull/2517)) by [@sampotts](https://github.com/sampotts)
- *(core)* Avoid Turbopack circular dependency ([#2561](https://github.com/videojs/v10/pull/2561)) by [@sampotts](https://github.com/sampotts)
- *(spf)* Never adopt the UA-default preload on attach ([#2534](https://github.com/videojs/v10/pull/2534)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(spf)* Probe codec support through ManagedMediaSource where classic MSE is absent ([#2564](https://github.com/videojs/v10/pull/2564)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(core)* Stop waiting from latching when readyState never recovers ([#2574](https://github.com/videojs/v10/pull/2574)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(media)* Keep one Mux Data view per viewing across loadstarts ([#2565](https://github.com/videojs/v10/pull/2565)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(vjsc)* Clear stale generated styles during vite hmr ([#2433](https://github.com/videojs/v10/pull/2433)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Harden non-video VJSC parity ([#2530](https://github.com/videojs/v10/pull/2530)) by [@mihar-22](https://github.com/mihar-22)
- *(skins)* Harden shadcn registry delivery ([#2576](https://github.com/videojs/v10/pull/2576)) by [@mihar-22](https://github.com/mihar-22)
- *(skins)* Improve generated skin parity ([#2580](https://github.com/videojs/v10/pull/2580)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Adopt cn for class name merging ([#2641](https://github.com/videojs/v10/pull/2641)) by [@mihar-22](https://github.com/mihar-22)
- *(test)* Repair the e2e suites ([#2640](https://github.com/videojs/v10/pull/2640)) by [@mihar-22](https://github.com/mihar-22)

### 💼 Other
- *(skin)* Generate hosted Shadcn registry ([#2547](https://github.com/videojs/v10/pull/2547)) by [@mihar-22](https://github.com/mihar-22)

### 🚜 Refactor
- *(packages)* Scope legacy skins on a shared media-skin class ([#2522](https://github.com/videojs/v10/pull/2522)) by [@sampotts](https://github.com/sampotts)
- *(packages)* [**breaking**] Move integrations to extension paths ([#2577](https://github.com/videojs/v10/pull/2577)) by [@decepulis](https://github.com/decepulis)
- *(skin)* Simplify VJSC style architecture ([#2529](https://github.com/videojs/v10/pull/2529)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Cut internal consumers over to VJSC ([#2548](https://github.com/videojs/v10/pull/2548)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Remove legacy skin implementation ([#2550](https://github.com/videojs/v10/pull/2550)) by [@mihar-22](https://github.com/mihar-22)
- *(vjsc)* Streamline registry build and validation ([#2554](https://github.com/videojs/v10/pull/2554)) by [@mihar-22](https://github.com/mihar-22)
- *(vjsc)* Clarify compiler and skin build structure ([#2557](https://github.com/videojs/v10/pull/2557)) by [@mihar-22](https://github.com/mihar-22)
- *(skins)* Consolidate design system tokens and utilities ([#2581](https://github.com/videojs/v10/pull/2581)) by [@mihar-22](https://github.com/mihar-22)
- *(vjsc)* Tighten the compiler and skins build boundary ([#2585](https://github.com/videojs/v10/pull/2585)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* [**breaking**] Playback adapters packages ([#2567](https://github.com/videojs/v10/pull/2567)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* New @videojs/cdn package ([#2598](https://github.com/videojs/v10/pull/2598)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* [**breaking**] Extension renaming ([#2600](https://github.com/videojs/v10/pull/2600)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* [**breaking**] MediaComponent => MediaExtension ([#2601](https://github.com/videojs/v10/pull/2601)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* [**breaking**] Adapter renaming ([#2602](https://github.com/videojs/v10/pull/2602)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Bucket adapters and extensions under packages/ ([#2635](https://github.com/videojs/v10/pull/2635)) by [@luwes](https://github.com/luwes)
- Skin directory structure ([#2648](https://github.com/videojs/v10/pull/2648)) by [@sampotts](https://github.com/sampotts)

### 📚 Documentation
- *(site)* Restore the 10.0.0-beta.32 raw changelog ([#2442](https://github.com/videojs/v10/pull/2442)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add changelog prose for 10.0.0-beta.32 ([#2450](https://github.com/videojs/v10/pull/2450)) by [@decepulis](https://github.com/decepulis)
- Correct live preset feature and skin descriptions ([#2458](https://github.com/videojs/v10/pull/2458)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add LiveButton reference page ([#2459](https://github.com/videojs/v10/pull/2459)) by [@decepulis](https://github.com/decepulis)
- *(site)* Tighten the Mux Player migration guide ([#2460](https://github.com/videojs/v10/pull/2460)) by [@decepulis](https://github.com/decepulis)
- *(site)* Document imperative control in the migration guides ([#2461](https://github.com/videojs/v10/pull/2461)) by [@decepulis](https://github.com/decepulis)
- *(site)* Make the React Player provider model explicit ([#2462](https://github.com/videojs/v10/pull/2462)) by [@decepulis](https://github.com/decepulis)
- *(site)* Structure poster guidance as a decision hierarchy ([#2463](https://github.com/videojs/v10/pull/2463)) by [@decepulis](https://github.com/decepulis)
- *(site)* Lead HLS and Mux flavor choices with the default ([#2464](https://github.com/videojs/v10/pull/2464)) by [@decepulis](https://github.com/decepulis)
- *(site)* Surface seek buttons for skin customizers and Plyr migrators ([#2465](https://github.com/videojs/v10/pull/2465)) by [@decepulis](https://github.com/decepulis)
- *(site)* Link the roadmap and beta announcement to shipped guides ([#2468](https://github.com/videojs/v10/pull/2468)) by [@decepulis](https://github.com/decepulis)
- *(agents)* Encode Diátaxis boundaries in the writing skills ([#2469](https://github.com/videojs/v10/pull/2469)) by [@decepulis](https://github.com/decepulis)
- *(site)* Fix self-hosted archive example ([#2446](https://github.com/videojs/v10/pull/2446)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Map the CDN layout in a concept page ([#2511](https://github.com/videojs/v10/pull/2511)) by [@decepulis](https://github.com/decepulis)
- *(site)* Open every media reference page with an Import section ([#2518](https://github.com/videojs/v10/pull/2518)) by [@decepulis](https://github.com/decepulis)
- *(site)* Open every feature reference page with an Import section ([#2519](https://github.com/videojs/v10/pull/2519)) by [@decepulis](https://github.com/decepulis)
- *(site)* Open util reference pages with the template's Import section ([#2520](https://github.com/videojs/v10/pull/2520)) by [@decepulis](https://github.com/decepulis)
- *(site)* Stub reference pages for the nine packaged skins ([#2523](https://github.com/videojs/v10/pull/2523)) by [@decepulis](https://github.com/decepulis)
- *(site)* Introduce extensions ([#2578](https://github.com/videojs/v10/pull/2578)) by [@decepulis](https://github.com/decepulis)
- *(site)* Install skins with the Shadcn CLI instead of ejected scripts ([#2615](https://github.com/videojs/v10/pull/2615)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Label beta API references ([#2513](https://github.com/videojs/v10/pull/2513)) by [@decepulis](https://github.com/decepulis)
- *(site)* Mention lightweight HLS option ([#2575](https://github.com/videojs/v10/pull/2575)) by [@decepulis](https://github.com/decepulis)
- *(site)* Simplify media reference installs ([#2634](https://github.com/videojs/v10/pull/2634)) by [@mihar-22](https://github.com/mihar-22)

### 🧪 Testing
- *(e2e)* Cover handled arrow key scrolling ([#2471](https://github.com/videojs/v10/pull/2471)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Harden background preset contract ([#2488](https://github.com/videojs/v10/pull/2488)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Validate Shadcn registry installs ([#2551](https://github.com/videojs/v10/pull/2551)) by [@mihar-22](https://github.com/mihar-22)

### ⚙️ Miscellaneous Tasks
- *(cd)* Attribute release-please to a GitHub App ([#2616](https://github.com/videojs/v10/pull/2616)) by [@decepulis](https://github.com/decepulis)
- *(preview)* Skip pnpm's lockfile check when publishing previews ([#2630](https://github.com/videojs/v10/pull/2630)) by [@mihar-22](https://github.com/mihar-22)
- *(cd)* Restore the GitHub App token and valid YAML in the release workflow ([#2632](https://github.com/videojs/v10/pull/2632)) by [@decepulis](https://github.com/decepulis)
- *(cd)* Prepare the 10.0.0-rc.1 release ([#2599](https://github.com/videojs/v10/pull/2599)) by [@decepulis](https://github.com/decepulis)

### New Contributors
* @videojs-release[bot] made their first contribution in [#2617](https://github.com/videojs/v10/pull/2617)

## [@videojs/core@10.0.0-beta.32] - 2026-08-26

### 🚀 Features
- *(spf)* Keep track selection within the initial codec family ([#2289](https://github.com/videojs/v10/pull/2289)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(packages)* Add backdrop component parts ([#2343](https://github.com/videojs/v10/pull/2343)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Add vjsc style diagnostics ([#2345](https://github.com/videojs/v10/pull/2345)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Expose container controls state ([#2376](https://github.com/videojs/v10/pull/2376)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Add volume popover compound ([#2378](https://github.com/videojs/v10/pull/2378)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Add dialog component ([#2379](https://github.com/videojs/v10/pull/2379)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* [**breaking**] Separate dialog popup and backdrop surfaces ([#2435](https://github.com/videojs/v10/pull/2435)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* [**breaking**] Separate controls content and backdrop surfaces ([#2436](https://github.com/videojs/v10/pull/2436)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Generate component event references ([#2404](https://github.com/videojs/v10/pull/2404)) by [@decepulis](https://github.com/decepulis)

### 🐛 Bug Fixes
- *(site)* Version CDN examples ([#2335](https://github.com/videojs/v10/pull/2335)) by [@decepulis](https://github.com/decepulis)
- *(i18n)* Preserve registered translation overrides ([#2354](https://github.com/videojs/v10/pull/2354)) by [@sampotts](https://github.com/sampotts)
- *(sandbox)* Use fixed ports for sandbox and skins dev ([#2353](https://github.com/videojs/v10/pull/2353)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Restore minimal volume controls ([#2386](https://github.com/videojs/v10/pull/2386)) by [@sampotts](https://github.com/sampotts)
- Set oxlint path in vscode settings ([#2390](https://github.com/videojs/v10/pull/2390)) by [@sampotts](https://github.com/sampotts)
- *(html)* Handle detached popup roots ([#2348](https://github.com/videojs/v10/pull/2348)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Harden vjsc vite workflow ([#2355](https://github.com/videojs/v10/pull/2355)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Restore vjsc skin visual parity ([#2344](https://github.com/videojs/v10/pull/2344)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Add audio playback rate tooltips ([#2389](https://github.com/videojs/v10/pull/2389)) by [@sampotts](https://github.com/sampotts)
- *(core)* Preserve anchored popovers while scrolling ([#2387](https://github.com/videojs/v10/pull/2387)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Make html entries server importable ([#2428](https://github.com/videojs/v10/pull/2428)) by [@mihar-22](https://github.com/mihar-22)
- *(media)* Make engine entries server importable ([#2429](https://github.com/videojs/v10/pull/2429)) by [@mihar-22](https://github.com/mihar-22)
- *(test)* Restore e2e test coverage ([#2401](https://github.com/videojs/v10/pull/2401)) by [@mihar-22](https://github.com/mihar-22)
- *(element)* Preserve props across late registration ([#2400](https://github.com/videojs/v10/pull/2400)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Thin compact table of contents rail ([#2402](https://github.com/videojs/v10/pull/2402)) by [@decepulis](https://github.com/decepulis)
- *(packages)* Improve menu behavior and sizing ([#2440](https://github.com/videojs/v10/pull/2440)) by [@sampotts](https://github.com/sampotts)

### 💼 Other
- *(root)* Migrate toolchain to vite plus ([#2035](https://github.com/videojs/v10/pull/2035)) by [@mihar-22](https://github.com/mihar-22)

### 🚜 Refactor
- *(vjsc)* Migrate from ts to oxc + rolldown ([#2287](https://github.com/videojs/v10/pull/2287)) by [@mihar-22](https://github.com/mihar-22)
- *(i18n)* Use Intl.NumberFormat and Intl.ListFormat instead of Intl.DurationFormat ([#2336](https://github.com/videojs/v10/pull/2336)) by [@sampotts](https://github.com/sampotts)
- *(html)* [**breaking**] Replace ContainerMixin with ContainerElement ([#2280](https://github.com/videojs/v10/pull/2280)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* [**breaking**] Rename MediaElement to UIElement ([#2245](https://github.com/videojs/v10/pull/2245)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Simplify component file names ([#2064](https://github.com/videojs/v10/pull/2064)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Replace api docs compiler with oxc ([#2392](https://github.com/videojs/v10/pull/2392)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Separate menu popup and content ([#2347](https://github.com/videojs/v10/pull/2347)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Reuse tooltip styles for audio previews ([#2388](https://github.com/videojs/v10/pull/2388)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Prefix all internal css custom properties ([#2391](https://github.com/videojs/v10/pull/2391)) by [@sampotts](https://github.com/sampotts)
- *(html)* [**breaking**] Return PlayerElement from createPlayer ([#2180](https://github.com/videojs/v10/pull/2180)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* [**breaking**] Make preset and UI registration explicit ([#2247](https://github.com/videojs/v10/pull/2247)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Complete TypeScript migration ([#2426](https://github.com/videojs/v10/pull/2426)) by [@decepulis](https://github.com/decepulis)
- *(packages)* Separate backdrops from content surfaces ([#2437](https://github.com/videojs/v10/pull/2437)) by [@sampotts](https://github.com/sampotts)

### 📚 Documentation
- *(site)* Document thumbnail CORS inheritance ([#2298](https://github.com/videojs/v10/pull/2298)) by [@luwes](https://github.com/luwes)
- *(site)* Add changelog prose for 10.0.0-beta.31 ([#2299](https://github.com/videojs/v10/pull/2299)) by [@github-actions[bot]](https://github.com/github-actions[bot])
- *(site)* Clarify plyr and media-chrome migration guides ([#2329](https://github.com/videojs/v10/pull/2329)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add background video guide ([#2339](https://github.com/videojs/v10/pull/2339)) by [@decepulis](https://github.com/decepulis)
- *(site)* Correct Mux Player migration guidance ([#2328](https://github.com/videojs/v10/pull/2328)) by [@decepulis](https://github.com/decepulis)
- *(site)* Tiny docs chores ([#2332](https://github.com/videojs/v10/pull/2332)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add vue and svelte integration guides ([#2333](https://github.com/videojs/v10/pull/2333)) by [@decepulis](https://github.com/decepulis)
- *(site)* Clarify player layout ownership ([#2334](https://github.com/videojs/v10/pull/2334)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add dialog API references ([#2375](https://github.com/videojs/v10/pull/2375)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Explain skin customization model ([#2315](https://github.com/videojs/v10/pull/2315)) by [@decepulis](https://github.com/decepulis)
- *(site)* Clarify live migration behavior ([#2326](https://github.com/videojs/v10/pull/2326)) by [@decepulis](https://github.com/decepulis)
- *(site)* Refine Vue and Svelte integration examples ([#2374](https://github.com/videojs/v10/pull/2374)) by [@decepulis](https://github.com/decepulis)
- *(site)* Document browser and tooling compatibility ([#2330](https://github.com/videojs/v10/pull/2330)) by [@decepulis](https://github.com/decepulis)
- *(site)* Document non-interactive cli use ([#2338](https://github.com/videojs/v10/pull/2338)) by [@decepulis](https://github.com/decepulis)
- *(site)* Correct v10 guides after merge ([#2385](https://github.com/videojs/v10/pull/2385)) by [@decepulis](https://github.com/decepulis)
- *(site)* Update menu and slider references ([#2240](https://github.com/videojs/v10/pull/2240)) by [@sampotts](https://github.com/sampotts)
- *(site)* Add Hotkey reference ([#2405](https://github.com/videojs/v10/pull/2405)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add Gesture reference ([#2406](https://github.com/videojs/v10/pull/2406)) by [@decepulis](https://github.com/decepulis)
- *(site)* Correct player container references ([#2407](https://github.com/videojs/v10/pull/2407)) by [@decepulis](https://github.com/decepulis)
- *(site)* Clarify TimeSlider chapter ranges ([#2408](https://github.com/videojs/v10/pull/2408)) by [@decepulis](https://github.com/decepulis)
- *(site)* Explain container popup coordination ([#2409](https://github.com/videojs/v10/pull/2409)) by [@decepulis](https://github.com/decepulis)
- *(site)* Document Menu data-item hook ([#2410](https://github.com/videojs/v10/pull/2410)) by [@decepulis](https://github.com/decepulis)
- *(site)* Correct Tooltip accessibility guidance ([#2411](https://github.com/videojs/v10/pull/2411)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add installation next steps ([#2412](https://github.com/videojs/v10/pull/2412)) by [@decepulis](https://github.com/decepulis)
- *(site)* Refresh Media Chrome migration gaps ([#2413](https://github.com/videojs/v10/pull/2413)) by [@decepulis](https://github.com/decepulis)
- *(site)* Link contributor guide in sidebar ([#2414](https://github.com/videojs/v10/pull/2414)) by [@decepulis](https://github.com/decepulis)
- *(site)* Remove redundant page openings ([#2415](https://github.com/videojs/v10/pull/2415)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add SeekIndicator reference ([#2416](https://github.com/videojs/v10/pull/2416)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add StatusAnnouncer reference ([#2417](https://github.com/videojs/v10/pull/2417)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add StatusIndicator reference ([#2418](https://github.com/videojs/v10/pull/2418)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add VolumeIndicator reference ([#2419](https://github.com/videojs/v10/pull/2419)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add native Video and Audio references ([#2420](https://github.com/videojs/v10/pull/2420)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add useContainer reference ([#2421](https://github.com/videojs/v10/pull/2421)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add missing utility references ([#2422](https://github.com/videojs/v10/pull/2422)) by [@decepulis](https://github.com/decepulis)
- *(site)* Clarify HTML player contexts ([#2423](https://github.com/videojs/v10/pull/2423)) by [@decepulis](https://github.com/decepulis)
- *(site)* Explain custom element lifecycle ([#2424](https://github.com/videojs/v10/pull/2424)) by [@decepulis](https://github.com/decepulis)
- *(packages)* Improve high-traffic API JSDoc ([#2425](https://github.com/videojs/v10/pull/2425)) by [@decepulis](https://github.com/decepulis)
- *(site)* Standardize component reference imports ([#2430](https://github.com/videojs/v10/pull/2430)) by [@decepulis](https://github.com/decepulis)
- Add how-to guides for player capabilities ([#1945](https://github.com/videojs/v10/pull/1945)) by [@dylanjha](https://github.com/dylanjha)

### ⚡ Performance
- *(packages)* Enable native MagicString ([#2311](https://github.com/videojs/v10/pull/2311)) by [@mihar-22](https://github.com/mihar-22)

### 🎨 Styling
- *(root)* Improve source code flow ([#2350](https://github.com/videojs/v10/pull/2350)) by [@mihar-22](https://github.com/mihar-22)
- *(root)* Enable jsdoc formatting ([#2393](https://github.com/videojs/v10/pull/2393)) by [@mihar-22](https://github.com/mihar-22)
- *(root)* Group declarations with guard clauses ([#2394](https://github.com/videojs/v10/pull/2394)) by [@mihar-22](https://github.com/mihar-22)

### ⚙️ Miscellaneous Tasks
- *(ci)* Migrate agent workflows to codex ([#2312](https://github.com/videojs/v10/pull/2312)) by [@mihar-22](https://github.com/mihar-22)

### New Contributors
* @dylanjha made their first contribution in [#1945](https://github.com/videojs/v10/pull/1945)

## [@videojs/core@10.0.0-beta.31] - 2026-08-21

### 🚀 Features
- *(packages)* Add live presets to installation and skin tools ([#1919](https://github.com/videojs/v10/pull/1919)) by [@decepulis](https://github.com/decepulis)
- *(packages)* Add right-to-left player support ([#2281](https://github.com/videojs/v10/pull/2281)) by [@sampotts](https://github.com/sampotts)

### 📚 Documentation
- *(site)* Reconcile metadata docs with the rest of the merged stack ([#2294](https://github.com/videojs/v10/pull/2294)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add changelog prose for 10.0.0-beta.30 ([#2296](https://github.com/videojs/v10/pull/2296)) by [@github-actions[bot]](https://github.com/github-actions[bot])
- *(site)* Document the embed providers and Shaka, and generate engine options ([#2293](https://github.com/videojs/v10/pull/2293)) by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-beta.30] - 2026-08-20

### 🚀 Features
- *(packages)* Add shaka player media ([#2276](https://github.com/videojs/v10/pull/2276)) by [@luwes](https://github.com/luwes)
- *(packages)* Add title component ([#1997](https://github.com/videojs/v10/pull/1997)) by [@decepulis](https://github.com/decepulis)
- *(media)* Bring the shaka media to parity with the hls.js media ([#2285](https://github.com/videojs/v10/pull/2285)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(site)* Document metadata feature ([#2000](https://github.com/videojs/v10/pull/2000)) by [@decepulis](https://github.com/decepulis)
- *(packages)* [**breaking**] Configure orientation lock through providers ([#1999](https://github.com/videojs/v10/pull/1999)) by [@decepulis](https://github.com/decepulis)
- *(spf)* Cap Rendition to Player Size ([#2242](https://github.com/videojs/v10/pull/2242)) by [@spuppo-mux](https://github.com/spuppo-mux)

### 🐛 Bug Fixes
- *(skin)* Stabilize menu sizing and motion ([#2283](https://github.com/videojs/v10/pull/2283)) by [@sampotts](https://github.com/sampotts)
- *(spf)* Report a verdict when the background ladder is undecodable ([#2286](https://github.com/videojs/v10/pull/2286)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(packages)* Load posters and storyboard thumbnails in cross-origin-isolated pages ([#2273](https://github.com/videojs/v10/pull/2273)) by [@luwes](https://github.com/luwes)

### 🚜 Refactor
- *(packages)* [**breaking**] Remove built-in poster placeholders ([#2063](https://github.com/videojs/v10/pull/2063)) by [@decepulis](https://github.com/decepulis)

### 📚 Documentation
- *(site)* Add changelog prose for 10.0.0-beta.29 ([#2277](https://github.com/videojs/v10/pull/2277)) by [@github-actions[bot]](https://github.com/github-actions[bot])

## [@videojs/core@10.0.0-beta.29] - 2026-08-19

### 🚀 Features
- *(skin)* Add canonical buffering indicator ([#2189](https://github.com/videojs/v10/pull/2189)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Add canonical error dialog ([#2190](https://github.com/videojs/v10/pull/2190)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Add canonical captions button ([#2191](https://github.com/videojs/v10/pull/2191)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Add canonical remote playback controls ([#2192](https://github.com/videojs/v10/pull/2192)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Add canonical input indicators ([#2193](https://github.com/videojs/v10/pull/2193)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Complete canonical volume popover ([#2194](https://github.com/videojs/v10/pull/2194)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Add canonical time slider chapters ([#2195](https://github.com/videojs/v10/pull/2195)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Add canonical video settings menu ([#2196](https://github.com/videojs/v10/pull/2196)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Add canonical video input bindings ([#2197](https://github.com/videojs/v10/pull/2197)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Complete canonical default video skin ([#2198](https://github.com/videojs/v10/pull/2198)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Add canonical minimal video skin ([#2199](https://github.com/videojs/v10/pull/2199)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Add canonical styling and registry output ([#2202](https://github.com/videojs/v10/pull/2202)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Share settings menu composition ([#2203](https://github.com/videojs/v10/pull/2203)) by [@mihar-22](https://github.com/mihar-22)
- *(spf)* [**breaking**] Cap renditions to the screen and surface unplayable sources ([#2135](https://github.com/videojs/v10/pull/2135)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(ci)* Forward-port changelog prose to site/v10 ([#2228](https://github.com/videojs/v10/pull/2228)) by [@decepulis](https://github.com/decepulis)
- *(packages)* Make Mux and Vimeo content-data donors ([#1998](https://github.com/videojs/v10/pull/1998)) by [@decepulis](https://github.com/decepulis)
- *(packages)* [**breaking**] Name the resolved title `title`, and take it from config only ([#2176](https://github.com/videojs/v10/pull/2176)) by [@decepulis](https://github.com/decepulis)
- *(packages)* [**breaking**] Resolve the poster in the store, and set src on img from it ([#2039](https://github.com/videojs/v10/pull/2039)) by [@decepulis](https://github.com/decepulis)

### 🐛 Bug Fixes
- *(skin)* Style fixes ([#2257](https://github.com/videojs/v10/pull/2257)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Align canonical poster and default controls ([#2181](https://github.com/videojs/v10/pull/2181)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Cancel stale workflow runs ([#2263](https://github.com/videojs/v10/pull/2263)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Preserve slider preview behavior ([#2259](https://github.com/videojs/v10/pull/2259)) by [@sampotts](https://github.com/sampotts)
- *(compiler)* Add version to vjsc package ([#2272](https://github.com/videojs/v10/pull/2272)) by [@luwes](https://github.com/luwes)

### 🚜 Refactor
- *(skin)* Simplify canonical projections and styling ([#2206](https://github.com/videojs/v10/pull/2206)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Migrate styling to compiler ([#2207](https://github.com/videojs/v10/pull/2207)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Use compiler catalog emission ([#2213](https://github.com/videojs/v10/pull/2213)) by [@mihar-22](https://github.com/mihar-22)
- *(compiler)* Add declarative component registries ([#2234](https://github.com/videojs/v10/pull/2234)) by [@mihar-22](https://github.com/mihar-22)

### 📚 Documentation
- *(site)* Add changelog prose for 10.0.0-beta.28 ([#2256](https://github.com/videojs/v10/pull/2256)) by [@github-actions[bot]](https://github.com/github-actions[bot])

## [@videojs/core@10.0.0-beta.28] - 2026-08-19

### 🚀 Features
- *(media)* Add maxAutoResolution cap to hls.js sources ([#2061](https://github.com/videojs/v10/pull/2061)) by [@R-Delfino95](https://github.com/R-Delfino95)
- *(ci)* Add pkg.pr.new preview releases ([#2225](https://github.com/videojs/v10/pull/2225)) by [@luwes](https://github.com/luwes)
- *(core)* Prefer locale-matched captions on toggle ([#2237](https://github.com/videojs/v10/pull/2237)) by [@sampotts](https://github.com/sampotts)
- *(media)* Cap hls.js renditions to the player size ([#2243](https://github.com/videojs/v10/pull/2243)) by [@R-Delfino95](https://github.com/R-Delfino95)
- *(ci)* Publish the sandbox as a stackblitz preview template ([#2229](https://github.com/videojs/v10/pull/2229)) by [@luwes](https://github.com/luwes)
- *(cd)* Add manual dispatch to the deployment workflow ([#2254](https://github.com/videojs/v10/pull/2254)) by [@luwes](https://github.com/luwes)

### 🐛 Bug Fixes
- *(ci)* Unblock the changelog prose bot, and lead with breaking changes ([#2222](https://github.com/videojs/v10/pull/2222)) by [@decepulis](https://github.com/decepulis)
- *(skin)* Misc style fixes ([#2232](https://github.com/videojs/v10/pull/2232)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Restore menu trigger keyboard interaction ([#2235](https://github.com/videojs/v10/pull/2235)) by [@sampotts](https://github.com/sampotts)
- *(core)* Improve Bengali translations ([#2236](https://github.com/videojs/v10/pull/2236)) by [@sampotts](https://github.com/sampotts)
- *(core)* Include menu triggers in tab order ([#2238](https://github.com/videojs/v10/pull/2238)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Make the TikTok embed answer the player's controls ([#2218](https://github.com/videojs/v10/pull/2218)) by [@luwes](https://github.com/luwes)
- *(html)* Ship a cdn bundle for every media element ([#2252](https://github.com/videojs/v10/pull/2252)) by [@luwes](https://github.com/luwes)
- *(skin)* Use finite radius value ([#2253](https://github.com/videojs/v10/pull/2253)) by [@sampotts](https://github.com/sampotts)

### 🚜 Refactor
- *(react)* Reduce use client directives ([#2231](https://github.com/videojs/v10/pull/2231)) by [@sampotts](https://github.com/sampotts)

### 📚 Documentation
- *(site)* Add changelog prose for 10.0.0-beta.27 ([#2224](https://github.com/videojs/v10/pull/2224)) by [@github-actions[bot]](https://github.com/github-actions[bot])
- *(site)* Publish the Video.js 8 migration guide ([#2165](https://github.com/videojs/v10/pull/2165)) by [@decepulis](https://github.com/decepulis)
- *(site)* Publish the Mux Player migration guide ([#2163](https://github.com/videojs/v10/pull/2163)) by [@decepulis](https://github.com/decepulis)
- *(site)* Publish the Plyr migration guide ([#2166](https://github.com/videojs/v10/pull/2166)) by [@decepulis](https://github.com/decepulis)
- *(site)* Publish the Media Chrome migration guide ([#2167](https://github.com/videojs/v10/pull/2167)) by [@decepulis](https://github.com/decepulis)
- *(site)* Document mute availability ([#2239](https://github.com/videojs/v10/pull/2239)) by [@sampotts](https://github.com/sampotts)

## [@videojs/core@10.0.0-beta.27] - 2026-08-17

### 🚀 Features
- *(i18n)* Add Lithuanian locale pack ([#1917](https://github.com/videojs/v10/pull/1917)) by [@decepulis](https://github.com/decepulis)
- *(utils)* Extract getAnchorNames and addAnchorName ([#1935](https://github.com/videojs/v10/pull/1935)) by [@sampotts](https://github.com/sampotts)
- *(spf)* Live hls playback on the presentation-timeline model ([#1884](https://github.com/videojs/v10/pull/1884)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(media)* Support DRM protected playback ([#1948](https://github.com/videojs/v10/pull/1948)) by [@luwes](https://github.com/luwes)
- *(compiler)* Add foundation ([#1981](https://github.com/videojs/v10/pull/1981)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Add core jsx system ([#1986](https://github.com/videojs/v10/pull/1986)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Add canonical skin source boundary ([#1989](https://github.com/videojs/v10/pull/1989)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Add youtube media with html and react components ([#1853](https://github.com/videojs/v10/pull/1853)) by [@luwes](https://github.com/luwes)
- *(packages)* Resolve feature state from user and media values ([#1946](https://github.com/videojs/v10/pull/1946)) by [@decepulis](https://github.com/decepulis)
- *(spf)* Surface unsupported-source errors ([#1936](https://github.com/videojs/v10/pull/1936)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(compiler)* Add artifact dependency graph ([#1990](https://github.com/videojs/v10/pull/1990)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Add canonical PlayButton source ([#1991](https://github.com/videojs/v10/pull/1991)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Add canonical default video controls ([#1992](https://github.com/videojs/v10/pull/1992)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Add canonical volume controls ([#1993](https://github.com/videojs/v10/pull/1993)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Setup basic tailwind styles for new skin system ([#2005](https://github.com/videojs/v10/pull/2005)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Setup react compiler plugin ([#2006](https://github.com/videojs/v10/pull/2006)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Setup html compiler plugin ([#2007](https://github.com/videojs/v10/pull/2007)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Add registry catalog adapter ([#2008](https://github.com/videojs/v10/pull/2008)) by [@mihar-22](https://github.com/mihar-22)
- *(media)* Support DRM protected native HLS playback ([#2014](https://github.com/videojs/v10/pull/2014)) by [@luwes](https://github.com/luwes)
- *(skin)* Build pipeline ([#2021](https://github.com/videojs/v10/pull/2021)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Add chaptered time sliders ([#2043](https://github.com/videojs/v10/pull/2043)) by [@sampotts](https://github.com/sampotts)
- *(spf)* [**breaking**] Add the SPF-backed Mux Media, elements, and components ([#2045](https://github.com/videojs/v10/pull/2045)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(media)* Support the video renditions api in dash media ([#2060](https://github.com/videojs/v10/pull/2060)) by [@luwes](https://github.com/luwes)
- *(packages)* [**breaking**] Add <mux-background-video> over the SPF background-video engine ([#2062](https://github.com/videojs/v10/pull/2062)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(packages)* Hide unavailable radio groups ([#2069](https://github.com/videojs/v10/pull/2069)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Normalize volume slider availability ([#2072](https://github.com/videojs/v10/pull/2072)) by [@mihar-22](https://github.com/mihar-22)
- *(build)* Include distribution files as a release asset ([#2122](https://github.com/videojs/v10/pull/2122)) by [@luwes](https://github.com/luwes)
- *(ci)* Automate E2E failure triage ([#2143](https://github.com/videojs/v10/pull/2143)) by [@sampotts](https://github.com/sampotts)
- *(react)* Add audio track radio group ([#2124](https://github.com/videojs/v10/pull/2124)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Add captions radio group ([#2127](https://github.com/videojs/v10/pull/2127)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Add quality radio group ([#2132](https://github.com/videojs/v10/pull/2132)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Add canonical container, poster, and overlay ([#2179](https://github.com/videojs/v10/pull/2179)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Add cloudflare stream media ([#2168](https://github.com/videojs/v10/pull/2168)) by [@luwes](https://github.com/luwes)
- *(packages)* Add spotify audio media ([#2169](https://github.com/videojs/v10/pull/2169)) by [@luwes](https://github.com/luwes)
- *(packages)* Add tiktok video media ([#2170](https://github.com/videojs/v10/pull/2170)) by [@luwes](https://github.com/luwes)
- *(packages)* Add twitch video media ([#2171](https://github.com/videojs/v10/pull/2171)) by [@luwes](https://github.com/luwes)

### 🐛 Bug Fixes
- *(cd)* Fix npm publish process ([#1911](https://github.com/videojs/v10/pull/1911)) by [@sampotts](https://github.com/sampotts)
- *(cd)* Restore npm token fallback ([#1912](https://github.com/videojs/v10/pull/1912)) by [@sampotts](https://github.com/sampotts)
- *(i18n)* Improve locale translations ([#1914](https://github.com/videojs/v10/pull/1914)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Keep live edge indicator colored ([#1921](https://github.com/videojs/v10/pull/1921)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Add settings tooltip ([#1915](https://github.com/videojs/v10/pull/1915)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Preserve shared popup anchors ([#1933](https://github.com/videojs/v10/pull/1933)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Keep controls visible during active interactions ([#1900](https://github.com/videojs/v10/pull/1900)) by [@mihar-22](https://github.com/mihar-22)
- Link to CML in SPF ([#1814](https://github.com/videojs/v10/pull/1814)) by [@littlespex](https://github.com/littlespex)
- *(packages)* Stabilize popup positioning ([#1931](https://github.com/videojs/v10/pull/1931)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Report accurate bundle size diffs ([#1938](https://github.com/videojs/v10/pull/1938)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Make api reference sync deterministic ([#1928](https://github.com/videojs/v10/pull/1928)) by [@mihar-22](https://github.com/mihar-22)
- *(icons)* Remove complex masks ([#2027](https://github.com/videojs/v10/pull/2027)) by [@sampotts](https://github.com/sampotts)
- *(html)* Stabilize ejected element registration ([#2031](https://github.com/videojs/v10/pull/2031)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Increase time hidden threshold in default skin ([#2030](https://github.com/videojs/v10/pull/2030)) by [@sampotts](https://github.com/sampotts)
- *(i18n)* Improve time inversion labels ([#2028](https://github.com/videojs/v10/pull/2028)) by [@sampotts](https://github.com/sampotts)
- *(media)* Hook the media's actual playback engine in mux data ([#2040](https://github.com/videojs/v10/pull/2040)) by [@luwes](https://github.com/luwes)
- *(skin)* Use pixels for default scale unit ([#2054](https://github.com/videojs/v10/pull/2054)) by [@sampotts](https://github.com/sampotts)
- *(test)* Repair e2e regressions ([#2055](https://github.com/videojs/v10/pull/2055)) by [@sampotts](https://github.com/sampotts)
- *(core)* Skip hidden menu items ([#2071](https://github.com/videojs/v10/pull/2071)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Scope popup groups to containers ([#2083](https://github.com/videojs/v10/pull/2083)) by [@mihar-22](https://github.com/mihar-22)
- *(i18n)* Use resolution wording for hindi quality menu ([#2098](https://github.com/videojs/v10/pull/2098)) by [@luwes](https://github.com/luwes)
- *(store)* Create abort controllers lazily ([#2099](https://github.com/videojs/v10/pull/2099)) by [@luwes](https://github.com/luwes)
- *(skin)* Keep menu scroll position while hovering ([#2100](https://github.com/videojs/v10/pull/2100)) by [@luwes](https://github.com/luwes)
- *(core)* Restore the last selected subtitles track on toggle ([#2102](https://github.com/videojs/v10/pull/2102)) by [@luwes](https://github.com/luwes)
- *(media)* Raise hls.js preload buffer limits without restarting the load ([#2103](https://github.com/videojs/v10/pull/2103)) by [@luwes](https://github.com/luwes)
- *(packages)* Build iframe media embeds when the source arrives after attach ([#2118](https://github.com/videojs/v10/pull/2118)) by [@luwes](https://github.com/luwes)
- *(media)* Keep sideloaded track cues through hls.js resets ([#2119](https://github.com/videojs/v10/pull/2119)) by [@luwes](https://github.com/luwes)
- *(media)* Keep the hls audio selection across group switches ([#2120](https://github.com/videojs/v10/pull/2120)) by [@luwes](https://github.com/luwes)
- *(build)* Make cdn bundles self-contained ([#2121](https://github.com/videojs/v10/pull/2121)) by [@luwes](https://github.com/luwes)
- *(test)* Repair the sideloaded captions e2e specs on webkit ([#2141](https://github.com/videojs/v10/pull/2141)) by [@luwes](https://github.com/luwes)
- *(skins)* Update submenu transitions ([#2130](https://github.com/videojs/v10/pull/2130)) by [@mihar-22](https://github.com/mihar-22)
- *(utils)* Stop enumerating input objects in defaults ([#2140](https://github.com/videojs/v10/pull/2140)) by [@luwes](https://github.com/luwes)
- *(test)* Update active submenu selectors ([#2178](https://github.com/videojs/v10/pull/2178)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Preserve directives when normalizing imports ([#1930](https://github.com/videojs/v10/pull/1930)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Improve ui motion ([#2208](https://github.com/videojs/v10/pull/2208)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Menu keyboard navigation ([#2214](https://github.com/videojs/v10/pull/2214)) by [@sampotts](https://github.com/sampotts)
- *(media)* Announce a cleared source on every embed host ([#2217](https://github.com/videojs/v10/pull/2217)) by [@luwes](https://github.com/luwes)

### 🚜 Refactor
- *(site)* Clean up api docs builder ([#1922](https://github.com/videojs/v10/pull/1922)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* [**breaking**] Centralize popup positioning ([#1904](https://github.com/videojs/v10/pull/1904)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* [**breaking**] Restructure media source, engine, and Mux image APIs ([#1903](https://github.com/videojs/v10/pull/1903)) by [@luwes](https://github.com/luwes)
- *(packages)* Consolidate docs packaging ([#1929](https://github.com/videojs/v10/pull/1929)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Split ejected skin generator ([#1927](https://github.com/videojs/v10/pull/1927)) by [@mihar-22](https://github.com/mihar-22)
- *(jsx)* Extract canonical authoring runtime ([#1995](https://github.com/videojs/v10/pull/1995)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Simplify configured feature state ([#1996](https://github.com/videojs/v10/pull/1996)) by [@decepulis](https://github.com/decepulis)
- *(packages)* [**breaking**] Relocate spf media facades ([#2033](https://github.com/videojs/v10/pull/2033)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(packages)* [**breaking**] Normalize radio group option state ([#2047](https://github.com/videojs/v10/pull/2047)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* [**breaking**] Separate input indicator components ([#2046](https://github.com/videojs/v10/pull/2046)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Simplify status announcer ([#2068](https://github.com/videojs/v10/pull/2068)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Consolidate html template cloning ([#2073](https://github.com/videojs/v10/pull/2073)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* [**breaking**] Rename SimpleHls* to Hls* (video + audio) ([#2096](https://github.com/videojs/v10/pull/2096)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(packages)* [**breaking**] Rename the SPF background-video Media to hls-background-video ([#2097](https://github.com/videojs/v10/pull/2097)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(skin)* [**breaking**] Css clean up and API stabilization ([#2094](https://github.com/videojs/v10/pull/2094)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Use HD for quality icon ([#2147](https://github.com/videojs/v10/pull/2147)) by [@sampotts](https://github.com/sampotts)
- *(packages)* [**breaking**] Simplify menus ([#2029](https://github.com/videojs/v10/pull/2029)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Use audio track radio group in skins ([#2125](https://github.com/videojs/v10/pull/2125)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Use captions radio group in skins ([#2128](https://github.com/videojs/v10/pull/2128)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Share dom layout utilities ([#2117](https://github.com/videojs/v10/pull/2117)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Tweaks to menu transitions ([#2159](https://github.com/videojs/v10/pull/2159)) by [@sampotts](https://github.com/sampotts)
- *(react)* [**breaking**] Simplify createPlayer and preset exports ([#2116](https://github.com/videojs/v10/pull/2116)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* [**breaking**] Remove containers from createPlayer ([#2154](https://github.com/videojs/v10/pull/2154)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* [**breaking**] Normalize time slider chapters ([#2204](https://github.com/videojs/v10/pull/2204)) by [@mihar-22](https://github.com/mihar-22)
- *(icons)* Svg animation tweaks ([#2216](https://github.com/videojs/v10/pull/2216)) by [@sampotts](https://github.com/sampotts)

### 📚 Documentation
- *(site)* Add changelog prose for 10.0.0-beta.26 ([#1913](https://github.com/videojs/v10/pull/1913)) by [@github-actions[bot]](https://github.com/github-actions[bot])
- *(site)* Group api reference under one heading ([#2023](https://github.com/videojs/v10/pull/2023)) by [@decepulis](https://github.com/decepulis)
- *(site)* Repair time slider api reference ([#2142](https://github.com/videojs/v10/pull/2142)) by [@sampotts](https://github.com/sampotts)
- Add plyr migration guide ([#1740](https://github.com/videojs/v10/pull/1740)) by [@sampotts](https://github.com/sampotts)
- *(site)* Restore html sub-part props ([#2146](https://github.com/videojs/v10/pull/2146)) by [@sampotts](https://github.com/sampotts)
- *(site)* Update menu composition demos ([#2131](https://github.com/videojs/v10/pull/2131)) by [@mihar-22](https://github.com/mihar-22)
- *(docs)* Add media chrome migration guide ([#1706](https://github.com/videojs/v10/pull/1706)) by [@luwes](https://github.com/luwes)
- *(site)* Document playback rate radio group ([#2139](https://github.com/videojs/v10/pull/2139)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Document audio track radio group ([#2126](https://github.com/videojs/v10/pull/2126)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Document captions radio group ([#2129](https://github.com/videojs/v10/pull/2129)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Document quality radio group ([#2136](https://github.com/videojs/v10/pull/2136)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Document direct player components ([#2152](https://github.com/videojs/v10/pull/2152)) by [@mihar-22](https://github.com/mihar-22)

### 🧪 Testing
- *(packages)* Add automated accessibility checks ([#2209](https://github.com/videojs/v10/pull/2209)) by [@sampotts](https://github.com/sampotts)

### ⚙️ Miscellaneous Tasks
- *(root)* Improve issue creation skill ([#1988](https://github.com/videojs/v10/pull/1988)) by [@mihar-22](https://github.com/mihar-22)
- *(root)* Split ui component skills ([#2024](https://github.com/videojs/v10/pull/2024)) by [@mihar-22](https://github.com/mihar-22)

### New Contributors
* @littlespex made their first contribution in [#1814](https://github.com/videojs/v10/pull/1814)

## [@videojs/core@10.0.0-beta.26] - 2026-08-02

### 🚀 Features
- *(packages)* I18n ([#1708](https://github.com/videojs/v10/pull/1708)) by [@sampotts](https://github.com/sampotts)
- *(site)* Wire videojs_changelog index into search ([#1796](https://github.com/videojs/v10/pull/1796)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add responsive table of contents rail ([#1858](https://github.com/videojs/v10/pull/1858)) by [@decepulis](https://github.com/decepulis)
- *(spf)* Relocate non-zero-PTS sources to a 0-based timeline (VOD) ([#1847](https://github.com/videojs/v10/pull/1847)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(packages)* Add mux media with src parsing, structured source, and storyboards ([#1850](https://github.com/videojs/v10/pull/1850)) by [@luwes](https://github.com/luwes)
- *(packages)* Add flip functionality to popovers/tooltips/menus ([#1857](https://github.com/videojs/v10/pull/1857)) by [@sampotts](https://github.com/sampotts)
- *(i18n)* Convert to opaque keys ([#1848](https://github.com/videojs/v10/pull/1848)) by [@sampotts](https://github.com/sampotts)
- *(spf)* Added autoplay support ([#1880](https://github.com/videojs/v10/pull/1880)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(spf)* Expose media tracks on the SPF media adapter ([#1826](https://github.com/videojs/v10/pull/1826)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(skin)* Improved responsive design ([#1832](https://github.com/videojs/v10/pull/1832)) by [@sampotts](https://github.com/sampotts)
- *(core)* Add status announcer state updates ([#1659](https://github.com/videojs/v10/pull/1659)) by [@sampotts](https://github.com/sampotts)
- *(packages)* [**breaking**] Support media components as markup ([#1883](https://github.com/videojs/v10/pull/1883)) by [@luwes](https://github.com/luwes)
- *(spf)* Airplay mse recovery ([#1888](https://github.com/videojs/v10/pull/1888)) by [@cjpillsbury](https://github.com/cjpillsbury)

### 🐛 Bug Fixes
- *(docs)* Split ejected React skin sample into player + component files ([#1588](https://github.com/videojs/v10/pull/1588)) by [@R-Delfino95](https://github.com/R-Delfino95)
- *(core)* Add missing i18n translations ([#1817](https://github.com/videojs/v10/pull/1817)) by [@sampotts](https://github.com/sampotts)
- *(i18n)* Error text updates ([#1822](https://github.com/videojs/v10/pull/1822)) by [@heff](https://github.com/heff)
- *(site)* Surface native media properties on element reference pages ([#1722](https://github.com/videojs/v10/pull/1722)) by [@decepulis](https://github.com/decepulis)
- *(ci)* Unbreak changelog prose pipeline and add beta.25 prose ([#1810](https://github.com/videojs/v10/pull/1810)) by [@decepulis](https://github.com/decepulis)
- *(site)* Render changelog with shared MDX typography ([#1846](https://github.com/videojs/v10/pull/1846)) by [@decepulis](https://github.com/decepulis)
- *(sandbox)* Fix broken scripts on sandbox build ([#1824](https://github.com/videojs/v10/pull/1824)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(site)* Restore react demos for ssr-safe media elements ([#1867](https://github.com/videojs/v10/pull/1867)) by [@decepulis](https://github.com/decepulis)
- *(sandbox)* Prevent css causing full app refresh ([#1869](https://github.com/videojs/v10/pull/1869)) by [@sampotts](https://github.com/sampotts)
- *(spf)* Load final segment when seeking to exact end ([#1828](https://github.com/videojs/v10/pull/1828)) ([#1852](https://github.com/videojs/v10/pull/1852)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(html)* Register tooltip label and shortcut in live presets ([#1881](https://github.com/videojs/v10/pull/1881)) by [@mmcc](https://github.com/mmcc)
- *(packages)* Prevent controls click triggering interactions ([#1885](https://github.com/videojs/v10/pull/1885)) by [@sampotts](https://github.com/sampotts)
- *(docs)* Fix broken code block styles ([#1887](https://github.com/videojs/v10/pull/1887)) by [@sampotts](https://github.com/sampotts)
- *(test)* Remove seek tests, add missing tests ([#1892](https://github.com/videojs/v10/pull/1892)) by [@sampotts](https://github.com/sampotts)
- *(core)* Keep controls visible while tapping controls on touch ([#1704](https://github.com/videojs/v10/pull/1704)) by [@R-Delfino95](https://github.com/R-Delfino95)

### 🚜 Refactor
- *(spf)* Changed adapter code to recycle engine on src change ([#1813](https://github.com/videojs/v10/pull/1813)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(site)* Centralize demo media sources ([#1829](https://github.com/videojs/v10/pull/1829)) by [@decepulis](https://github.com/decepulis)
- *(media)* [**breaking**] Extract media package from core ([#1879](https://github.com/videojs/v10/pull/1879)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* [**breaking**] Replace button availability with disabled and hidden state ([#1474](https://github.com/videojs/v10/pull/1474)) by [@mihar-22](https://github.com/mihar-22)

### 📚 Documentation
- *(site)* Rework Google Cast concept page and move it in the sidebar ([#1806](https://github.com/videojs/v10/pull/1806)) by [@decepulis](https://github.com/decepulis)
- *(site)* Refresh write-guides page and align docs skill Diátaxis guidance ([#1809](https://github.com/videojs/v10/pull/1809)) by [@decepulis](https://github.com/decepulis)
- *(site)* Complete menu radio group references with demos and options hooks ([#1807](https://github.com/videojs/v10/pull/1807)) by [@decepulis](https://github.com/decepulis)
- *(site)* Update localized label docs ([#1820](https://github.com/videojs/v10/pull/1820)) by [@sampotts](https://github.com/sampotts)
- *(site)* Update tooltip parts docs ([#1819](https://github.com/videojs/v10/pull/1819)) by [@sampotts](https://github.com/sampotts)
- *(site)* Update stale popup docs ([#1818](https://github.com/videojs/v10/pull/1818)) by [@sampotts](https://github.com/sampotts)
- *(site)* Add Security concept page ([#1559](https://github.com/videojs/v10/pull/1559)) by [@decepulis](https://github.com/decepulis)
- Fix `selectTextTracks` → `selectTextTrack` in text-tracks reference ([#1876](https://github.com/videojs/v10/pull/1876)) by [@claude[bot]](https://github.com/claude[bot])
- *(site)* Add MuxData and GoogleCast API references; document status announcer and mux-video source API ([#1902](https://github.com/videojs/v10/pull/1902)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add i18n concept, guides, and API reference ([#1600](https://github.com/videojs/v10/pull/1600)) by [@sampotts](https://github.com/sampotts)

### ⚡ Performance
- *(core)* Batch menu viewport measurements ([#1823](https://github.com/videojs/v10/pull/1823)) by [@sampotts](https://github.com/sampotts)

### ⚙️ Miscellaneous Tasks
- *(root)* Refresh agent skills and docs ([#1835](https://github.com/videojs/v10/pull/1835)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Upgrade deps ([#1868](https://github.com/videojs/v10/pull/1868)) by [@sampotts](https://github.com/sampotts)

### New Contributors
* @mmcc made their first contribution in [#1881](https://github.com/videojs/v10/pull/1881)
* @claude[bot] made their first contribution in [#1876](https://github.com/videojs/v10/pull/1876)

## [@videojs/core@10.0.0-beta.25] - 2026-07-07

### 🚀 Features
- *(packages)* Airplay button ([#1531](https://github.com/videojs/v10/pull/1531)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(spf)* Basic audio only use case + use-case-composition doc-type + implementation skills ([#1584](https://github.com/videojs/v10/pull/1584)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(packages)* Constrain popovers to positioning boundary ([#1627](https://github.com/videojs/v10/pull/1627)) by [@sampotts](https://github.com/sampotts)
- *(spf)* Background looping video (phase 1) ([#1602](https://github.com/videojs/v10/pull/1602)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(packages)* Update menu group labels ([#1643](https://github.com/videojs/v10/pull/1643)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Show scrubber preview timestamps ([#1652](https://github.com/videojs/v10/pull/1652)) by [@sampotts](https://github.com/sampotts)
- *(spf)* Multi-track audio + skills building features and behaviors ([#1605](https://github.com/videojs/v10/pull/1605)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(core)* Lock fullscreen orientation ([#1656](https://github.com/videojs/v10/pull/1656)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Add settings menu ([#1615](https://github.com/videojs/v10/pull/1615)) by [@sampotts](https://github.com/sampotts)
- *(site)* Add pre-release docs banner on main.videojs.org ([#1575](https://github.com/videojs/v10/pull/1575)) by [@R-Delfino95](https://github.com/R-Delfino95)
- *(spf)* Multi-cdn support ([#1668](https://github.com/videojs/v10/pull/1668)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(site)* List required css imports per skin in preset reference ([#1521](https://github.com/videojs/v10/pull/1521)) by [@R-Delfino95](https://github.com/R-Delfino95)
- *(media)* [**breaking**] Add Google Cast by default to HLS, DASH media ([#1661](https://github.com/videojs/v10/pull/1661)) by [@luwes](https://github.com/luwes)
- *(core)* Add media tracks and renditions support ([#1664](https://github.com/videojs/v10/pull/1664)) by [@luwes](https://github.com/luwes)
- *(spf)* Add maxResolution to SPF Background Video ([#1654](https://github.com/videojs/v10/pull/1654)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(spf)* Multi cdn failover ([#1671](https://github.com/videojs/v10/pull/1671)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(spf)* Capability probing ([#1676](https://github.com/videojs/v10/pull/1676)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(core)* Add quality selection state ([#1693](https://github.com/videojs/v10/pull/1693)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Add quality menu UI ([#1694](https://github.com/videojs/v10/pull/1694)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Add resolved rendition to auto label ([#1698](https://github.com/videojs/v10/pull/1698)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Compound tooltips with label and shortcut parts ([#1494](https://github.com/videojs/v10/pull/1494)) by [@sampotts](https://github.com/sampotts)
- *(core)* Add vimeo media host and html/react components ([#1667](https://github.com/videojs/v10/pull/1667)) by [@luwes](https://github.com/luwes)
- *(packages)* Add poster placeholder blur-up pattern ([#1632](https://github.com/videojs/v10/pull/1632)) by [@ronald-urbina](https://github.com/ronald-urbina)
- *(core)* Add i18n foundation with English locale and UI wiring ([#1589](https://github.com/videojs/v10/pull/1589)) by [@sampotts](https://github.com/sampotts)
- *(core)* Add built-in locale packs and lazy loadLocale ([#1590](https://github.com/videojs/v10/pull/1590)) by [@sampotts](https://github.com/sampotts)
- *(site)* API reference pages for media elements ([#1342](https://github.com/videojs/v10/pull/1342)) by [@decepulis](https://github.com/decepulis)
- *(spf)* Text tracks switching ([#1687](https://github.com/videojs/v10/pull/1687)) by [@cjpillsbury](https://github.com/cjpillsbury)
- Add a CDN media-availability manifest and read it across install surfaces ([#1737](https://github.com/videojs/v10/pull/1737)) by [@decepulis](https://github.com/decepulis)
- Add DASH, Mux, and Vimeo as installation source types (UI + CLI) ([#1732](https://github.com/videojs/v10/pull/1732)) by [@decepulis](https://github.com/decepulis)
- *(packages)* Add audio tracks menu ([#1714](https://github.com/videojs/v10/pull/1714)) by [@sampotts](https://github.com/sampotts)
- *(core)* Support AirPlay on MSE ([#1692](https://github.com/videojs/v10/pull/1692)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(packages)* Add pauseOnDrag to time slider ([#1596](https://github.com/videojs/v10/pull/1596)) by [@R-Delfino95](https://github.com/R-Delfino95)
- *(packages)* Add time display toggle ([#1669](https://github.com/videojs/v10/pull/1669)) by [@sampotts](https://github.com/sampotts)
- *(site)* Add changelog section ([#1793](https://github.com/videojs/v10/pull/1793)) by [@decepulis](https://github.com/decepulis)

### 🐛 Bug Fixes
- *(skin)* Minor design tweaks ([#1597](https://github.com/videojs/v10/pull/1597)) by [@sampotts](https://github.com/sampotts)
- *(core)* Disable toggle captions when there are no captions ([#1598](https://github.com/videojs/v10/pull/1598)) by [@sampotts](https://github.com/sampotts)
- *(site)* Cache shiki highlighters during dev HMR ([#1619](https://github.com/videojs/v10/pull/1619)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Prevent initial pause icon flash ([#1622](https://github.com/videojs/v10/pull/1622)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Restore overflow on audio skins ([#1623](https://github.com/videojs/v10/pull/1623)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Scope menu data attributes ([#1628](https://github.com/videojs/v10/pull/1628)) by [@sampotts](https://github.com/sampotts)
- *(spf)* Add emptied listener to track-current-time behavior ([#1634](https://github.com/videojs/v10/pull/1634)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(core)* Focus selected radio menu items ([#1645](https://github.com/videojs/v10/pull/1645)) by [@sampotts](https://github.com/sampotts)
- *(core)* Update trigger aria-expanded on close ([#1644](https://github.com/videojs/v10/pull/1644)) by [@sampotts](https://github.com/sampotts)
- *(test)* Update slider thumbnail selector ([#1653](https://github.com/videojs/v10/pull/1653)) by [@sampotts](https://github.com/sampotts)
- *(spf)* Refactor track switching to rules ([#1658](https://github.com/videojs/v10/pull/1658)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(packages)* Fix ejected skin slider setup ([#1660](https://github.com/videojs/v10/pull/1660)) by [@sampotts](https://github.com/sampotts)
- *(core)* Prevent mobile controls flash on first tap after auto-hide ([#1556](https://github.com/videojs/v10/pull/1556)) by [@R-Delfino95](https://github.com/R-Delfino95)
- *(test)* Update e2e menu selectors ([#1674](https://github.com/videojs/v10/pull/1674)) by [@sampotts](https://github.com/sampotts)
- *(docs)* Replace <Controls /> with <Controls.Root> in code samples ([#1492](https://github.com/videojs/v10/pull/1492)) by [@ronald-urbina](https://github.com/ronald-urbina)
- *(react)* Address stale media reference ([#1677](https://github.com/videojs/v10/pull/1677)) by [@sampotts](https://github.com/sampotts)
- *(test)* Stabilize e2e tests ([#1678](https://github.com/videojs/v10/pull/1678)) by [@sampotts](https://github.com/sampotts)
- *(core)* Remove 1-9 digit key seek from slider keyboard handler ([#1690](https://github.com/videojs/v10/pull/1690)) by [@ronald-urbina](https://github.com/ronald-urbina)
- *(site)* Update use-media reference for mediahost architecture ([#1702](https://github.com/videojs/v10/pull/1702)) by [@luwes](https://github.com/luwes)
- *(packages)* Escape HTML special chars in serializeAttributes to prevent XSS ([#1670](https://github.com/videojs/v10/pull/1670)) by [@Jerricho93](https://github.com/Jerricho93)
- *(ci)* Report lazy bundle chunks separately ([#1710](https://github.com/videojs/v10/pull/1710)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Add missing classnames to tailwind menus ([#1712](https://github.com/videojs/v10/pull/1712)) by [@sampotts](https://github.com/sampotts)
- *(ci)* Run bundle size on stacked prs ([#1713](https://github.com/videojs/v10/pull/1713)) by [@sampotts](https://github.com/sampotts)
- *(site)* Pre-bundle react-dom so dev islands hydrate ([#1711](https://github.com/videojs/v10/pull/1711)) by [@decepulis](https://github.com/decepulis)
- *(core)* Upgrade dash.js to 5.2.0 ([#1724](https://github.com/videojs/v10/pull/1724)) by [@luwes](https://github.com/luwes)
- *(site)* Resolve api reference slug mismatch on airplay and hlsjs pages ([#1755](https://github.com/videojs/v10/pull/1755)) by [@luwes](https://github.com/luwes)
- *(skin)* Aspect ratio related fixes ([#1726](https://github.com/videojs/v10/pull/1726)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Handle menu child mutations ([#1739](https://github.com/videojs/v10/pull/1739)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Improvements to menu styles ([#1725](https://github.com/videojs/v10/pull/1725)) by [@sampotts](https://github.com/sampotts)
- *(react)* Recover from StoreError: DESTROYED on React <Activity> hide/reveal ([#1587](https://github.com/videojs/v10/pull/1587)) by [@ronald-urbina](https://github.com/ronald-urbina)
- *(site)* Install musl resvg binary so Netlify can bundle the OG function ([#1759](https://github.com/videojs/v10/pull/1759)) by [@decepulis](https://github.com/decepulis)
- *(skin)* Improve buffering, overlays, and input feedback ([#1547](https://github.com/videojs/v10/pull/1547)) by [@sampotts](https://github.com/sampotts)
- *(test)* Update duration selectors for time inversion feature ([#1760](https://github.com/videojs/v10/pull/1760)) by [@sampotts](https://github.com/sampotts)
- *(react)* Memoize Provider context value ([#1787](https://github.com/videojs/v10/pull/1787)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Avoid menu item value render loop ([#1791](https://github.com/videojs/v10/pull/1791)) by [@sampotts](https://github.com/sampotts)
- *(site)* Skip docs links for features without reference pages ([#1394](https://github.com/videojs/v10/pull/1394)) by [@decepulis](https://github.com/decepulis)
- *(ci)* Relay release event through workflow_dispatch for changelog prose ([#1792](https://github.com/videojs/v10/pull/1792)) by [@decepulis](https://github.com/decepulis)

### 🚜 Refactor
- *(core)* Airplay button ([#1614](https://github.com/videojs/v10/pull/1614)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(core)* Rework media config as a plain getter/setter ([#1697](https://github.com/videojs/v10/pull/1697)) by [@luwes](https://github.com/luwes)
- *(core)* [**breaking**] Move media capability predicates to core layer ([#1705](https://github.com/videojs/v10/pull/1705)) by [@luwes](https://github.com/luwes)
- Rename SPF background-looping-video into background-video ([#1731](https://github.com/videojs/v10/pull/1731)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(packages)* [**breaking**] Rename hls media stack to hlsjs naming ([#1753](https://github.com/videojs/v10/pull/1753)) by [@luwes](https://github.com/luwes)

### 📚 Documentation
- *(spf)* Seed feature registry, clusters reference, and document-feature skill ([#1581](https://github.com/videojs/v10/pull/1581)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(spf)* Track switching design ([#1631](https://github.com/videojs/v10/pull/1631)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(site)* Add "No Skin" option to installation skin picker ([#1525](https://github.com/videojs/v10/pull/1525)) by [@ronald-urbina](https://github.com/ronald-urbina)
- *(react)* Clarify usePlayer typed vs untyped store access ([#1663](https://github.com/videojs/v10/pull/1663)) by [@Jerricho93](https://github.com/Jerricho93)
- *(site)* Document self-hosted and offline player builds ([#1680](https://github.com/videojs/v10/pull/1680)) by [@R-Delfino95](https://github.com/R-Delfino95)
- *(site)* Add Google Cast documentation ([#1681](https://github.com/videojs/v10/pull/1681)) by [@Jerricho93](https://github.com/Jerricho93)
- *(site)* Backfill and prose-ify beta changelogs ([#1794](https://github.com/videojs/v10/pull/1794)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add menu reference ([#1673](https://github.com/videojs/v10/pull/1673)) by [@sampotts](https://github.com/sampotts)

### ⚡ Performance
- *(site)* Migrate markdown pipeline to Sätteri ([#1733](https://github.com/videojs/v10/pull/1733)) by [@decepulis](https://github.com/decepulis)

### ⚙️ Miscellaneous Tasks
- *(build)* Quiet tsdown size reports in local dev ([#1569](https://github.com/videojs/v10/pull/1569)) by [@sampotts](https://github.com/sampotts)
- Add playwright MCP server to project config ([#1625](https://github.com/videojs/v10/pull/1625)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(root)* Rename agents alias to .agents ([#1649](https://github.com/videojs/v10/pull/1649)) by [@luwes](https://github.com/luwes)
- *(ci)* Drop edited trigger from issue triage ([#1700](https://github.com/videojs/v10/pull/1700)) by [@decepulis](https://github.com/decepulis)
- *(site)* Upgrade to Astro 7 and consolidate on Vite 8 ([#1721](https://github.com/videojs/v10/pull/1721)) by [@decepulis](https://github.com/decepulis)

### ◀️ Revert
- *(core)* Unmerge i18n stack base ([#1707](https://github.com/videojs/v10/pull/1707)) by [@sampotts](https://github.com/sampotts)

### New Contributors
* @Jerricho93 made their first contribution in [#1670](https://github.com/videojs/v10/pull/1670)

## [@videojs/core@10.0.0-beta.24] - 2026-05-19

### 🚀 Features
- *(packages)* Add live button component ([#1473](https://github.com/videojs/v10/pull/1473)) by [@luwes](https://github.com/luwes)
- *(packages)* Add UI support for gestures and hotkeys ([#1388](https://github.com/videojs/v10/pull/1388)) by [@sampotts](https://github.com/sampotts)
- *(spf)* HLS engine composition walkthrough + doc-driven cleanups ([#1512](https://github.com/videojs/v10/pull/1512)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(core)* Menu core layer and DOM keyboard navigation ([#1503](https://github.com/videojs/v10/pull/1503)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Add playback rate menu ([#1527](https://github.com/videojs/v10/pull/1527)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Ship bundled markdown docs in html and react tarballs ([#1560](https://github.com/videojs/v10/pull/1560)) by [@decepulis](https://github.com/decepulis)

### 🐛 Bug Fixes
- *(icons)* Avoid hidden spinner animations ([#1476](https://github.com/videojs/v10/pull/1476)) by [@sampotts](https://github.com/sampotts)
- *(ci)* Use biome to sort CSS properties ([#1490](https://github.com/videojs/v10/pull/1490)) by [@sampotts](https://github.com/sampotts)
- *(icons)* Use icon exports in ejected skins ([#1489](https://github.com/videojs/v10/pull/1489)) by [@sampotts](https://github.com/sampotts)
- *(site)* Add 'use client' to ejected skin Next.js output ([#1488](https://github.com/videojs/v10/pull/1488)) by [@ronald-urbina](https://github.com/ronald-urbina)
- *(skin)* Fix safari button alignment issue when zoomed ([#1495](https://github.com/videojs/v10/pull/1495)) by [@sampotts](https://github.com/sampotts)
- *(build)* Resolve link-aliases root from repo root ([#1501](https://github.com/videojs/v10/pull/1501)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(html)* Set min dimensions on background-video host ([#1523](https://github.com/videojs/v10/pull/1523)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(core)* Resolve cast button ssr hydration mismatch ([#1518](https://github.com/videojs/v10/pull/1518)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(skin)* Fix minimal tailwind root sizing ([#1540](https://github.com/videojs/v10/pull/1540)) by [@spuppo-mux](https://github.com/spuppo-mux)
- *(react)* Replace any with unknown in isRenderProp type guard ([#1500](https://github.com/videojs/v10/pull/1500)) by [@ronald-urbina](https://github.com/ronald-urbina)
- *(docs)* Improve agentic discovery of llms.txt and eject ([#1564](https://github.com/videojs/v10/pull/1564)) by [@decepulis](https://github.com/decepulis)
- *(spf)* Conventions, per-type specialization, config threading ([#1537](https://github.com/videojs/v10/pull/1537)) by [@cjpillsbury](https://github.com/cjpillsbury)

### 📚 Documentation
- *(design)* Menus ([#1078](https://github.com/videojs/v10/pull/1078)) by [@sampotts](https://github.com/sampotts)
- *(design)* Add design doc for live presets ([#1395](https://github.com/videojs/v10/pull/1395)) by [@luwes](https://github.com/luwes)
- *(site)* Warn that bundled HTML installs need type="module" ([#1530](https://github.com/videojs/v10/pull/1530)) by [@R-Delfino95](https://github.com/R-Delfino95)
- *(site)* Add 'use client' to homepage React snippet ([#1529](https://github.com/videojs/v10/pull/1529)) by [@R-Delfino95](https://github.com/R-Delfino95)
- Fix grammar in features concept guide ([#1511](https://github.com/videojs/v10/pull/1511)) by [@ronald-urbina](https://github.com/ronald-urbina)
- *(site)* Add "Why Video.js?" concept page ([#1526](https://github.com/videojs/v10/pull/1526)) by [@decepulis](https://github.com/decepulis)
- *(design)* I18n ([#1122](https://github.com/videojs/v10/pull/1122)) by [@sampotts](https://github.com/sampotts)
- *(site)* Fix feature export names in features and presets guides ([#1513](https://github.com/videojs/v10/pull/1513)) by [@ronald-urbina](https://github.com/ronald-urbina)
- *(site)* Use togglePaused in playback feature example ([#1522](https://github.com/videojs/v10/pull/1522)) by [@R-Delfino95](https://github.com/R-Delfino95)
- *(claude)* Add css to tailwind migration skill ([#1548](https://github.com/videojs/v10/pull/1548)) by [@sampotts](https://github.com/sampotts)

### 🧪 Testing
- *(sandbox)* Adapt playback rate E2E to menu UX ([#1545](https://github.com/videojs/v10/pull/1545)) by [@sampotts](https://github.com/sampotts)

### ⚙️ Miscellaneous Tasks
- *(ci)* Configure noUnknownProperty to allow corner-shape ([#1502](https://github.com/videojs/v10/pull/1502)) by [@sampotts](https://github.com/sampotts)
- *(site)* Upgrade astro to 6.3.1 ([#1499](https://github.com/videojs/v10/pull/1499)) by [@decepulis](https://github.com/decepulis)
- *(ci)* Scope triage label to external authors ([#1550](https://github.com/videojs/v10/pull/1550)) by [@decepulis](https://github.com/decepulis)

### New Contributors
* @R-Delfino95 made their first contribution in [#1522](https://github.com/videojs/v10/pull/1522)
* @spuppo-mux made their first contribution in [#1540](https://github.com/videojs/v10/pull/1540)

## [@videojs/core@10.0.0-beta.23] - 2026-04-27

### 🚀 Features
- *(html)* Observe cast attributes on mux elements ([#1386](https://github.com/videojs/v10/pull/1386)) by [@luwes](https://github.com/luwes)
- *(core)* Add HLS stream-type detection and live duration ([#1387](https://github.com/videojs/v10/pull/1387)) by [@luwes](https://github.com/luwes)
- *(packages)* Add live-video and live-audio presets ([#1399](https://github.com/videojs/v10/pull/1399)) by [@luwes](https://github.com/luwes)
- *(packages)* Support cli:omit markers for llm-only doc content ([#1466](https://github.com/videojs/v10/pull/1466)) by [@decepulis](https://github.com/decepulis)
- *(html)* Re-export reactive primitives from @videojs/element ([#1472](https://github.com/videojs/v10/pull/1472)) by [@decepulis](https://github.com/decepulis)
- *(core)* Add liveEdgeStart and targetLiveWindow properties ([#1445](https://github.com/videojs/v10/pull/1445)) by [@luwes](https://github.com/luwes)

### 🐛 Bug Fixes
- *(react)* Rename MediaGesture and MediaHotkey to Gesture and Hotkey ([#1374](https://github.com/videojs/v10/pull/1374)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Only report Sentry errors from deployed function runtime ([#1393](https://github.com/videojs/v10/pull/1393)) by [@decepulis](https://github.com/decepulis)
- *(site)* Work around #1111 in create-player/player-controller demos ([#1403](https://github.com/videojs/v10/pull/1403)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add astro check CI and reduce errors/hints ([#1109](https://github.com/videojs/v10/pull/1109)) by [@decepulis](https://github.com/decepulis)
- *(html)* Raise testTimeout to 15s for parallel-load reliability ([#1448](https://github.com/videojs/v10/pull/1448)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(site)* Exclude clientcode suspense fallback from llms and search ([#1467](https://github.com/videojs/v10/pull/1467)) by [@decepulis](https://github.com/decepulis)

### 💼 Other
- *(cli)* Decouple cli tests from upstream builds ([#1402](https://github.com/videojs/v10/pull/1402)) by [@decepulis](https://github.com/decepulis)

### 🚜 Refactor
- *(react)* Replace prototype-walking and inferred class props ([#1376](https://github.com/videojs/v10/pull/1376)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* [**breaking**] Rename cast to google-cast and remote-playback ([#1380](https://github.com/videojs/v10/pull/1380)) by [@luwes](https://github.com/luwes)
- *(core)* [**breaking**] Unify fullscreen and pip on media capabilities ([#1469](https://github.com/videojs/v10/pull/1469)) by [@luwes](https://github.com/luwes)

### 📚 Documentation
- *(root)* Fix stale references and document sandbox workflow ([#1464](https://github.com/videojs/v10/pull/1464)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add how-to guide for building custom components ([#1008](https://github.com/videojs/v10/pull/1008)) by [@decepulis](https://github.com/decepulis)

### ⚡ Performance
- *(site)* Trim site build time ([#1379](https://github.com/videojs/v10/pull/1379)) by [@decepulis](https://github.com/decepulis)

### ⚙️ Miscellaneous Tasks
- *(ci)* Exclude epic and priority labels from triage agent ([#1377](https://github.com/videojs/v10/pull/1377)) by [@decepulis](https://github.com/decepulis)
- Update README milestone link ([#1444](https://github.com/videojs/v10/pull/1444)) by [@decepulis](https://github.com/decepulis)
- *(root)* Migrate typecheck to @typescript/native-preview (tsgo) ([#1400](https://github.com/videojs/v10/pull/1400)) by [@mihar-22](https://github.com/mihar-22)

## [@videojs/core@10.0.0-beta.22] - 2026-04-18

### 🚀 Features
- *(site)* Serve branded OG images dynamically ([#1345](https://github.com/videojs/v10/pull/1345)) by [@decepulis](https://github.com/decepulis)
- Add e2e test harness ([#1237](https://github.com/videojs/v10/pull/1237)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Add chromecast support via remote playback API ([#1348](https://github.com/videojs/v10/pull/1348)) by [@luwes](https://github.com/luwes)

### 🐛 Bug Fixes
- *(site)* Preserve casing for code identifiers in doc titles and OG images ([#1347](https://github.com/videojs/v10/pull/1347)) by [@decepulis](https://github.com/decepulis)
- *(packages)* Add server-only bundles  ([#1349](https://github.com/videojs/v10/pull/1349)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Prevent gesture tap from firing on slider interactions ([#1361](https://github.com/videojs/v10/pull/1361)) by [@mihar-22](https://github.com/mihar-22)

### ◀️ Revert
- *(packages)* Add server-only bundles ([#1349](https://github.com/videojs/v10/pull/1349)) ([#1354](https://github.com/videojs/v10/pull/1354)) by [@luwes](https://github.com/luwes)

## [@videojs/core@10.0.0-beta.21] - 2026-04-14

### 🚀 Features
- *(site)* Feature and preset reference UI + docs integration ([#1258](https://github.com/videojs/v10/pull/1258)) by [@decepulis](https://github.com/decepulis)

### 🐛 Bug Fixes
- *(cli)* Normalize repository URL to match npm convention ([#1340](https://github.com/videojs/v10/pull/1340)) by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-beta.20] - 2026-04-14

### 🐛 Bug Fixes
- *(cli)* Replace deprecated noExternal with deps.alwaysBundle ([#1338](https://github.com/videojs/v10/pull/1338)) by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-beta.19] - 2026-04-14

### 🐛 Bug Fixes
- *(cli)* Correct bin path to match tsdown output ([#1337](https://github.com/videojs/v10/pull/1337)) by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-beta.18] - 2026-04-14

### 🚀 Features
- *(site)* Add versioned docs infrastructure ([#1314](https://github.com/videojs/v10/pull/1314)) by [@decepulis](https://github.com/decepulis)
- *(cli)* Add @videojs/cli docs command for LLM-friendly installation ([#1214](https://github.com/videojs/v10/pull/1214)) by [@decepulis](https://github.com/decepulis)

### 🐛 Bug Fixes
- *(site)* Revert FrameworkCase conditional rendering ([#1317](https://github.com/videojs/v10/pull/1317)) by [@decepulis](https://github.com/decepulis)
- *(site)* Prevent images from overflowing on narrow viewports ([#1302](https://github.com/videojs/v10/pull/1302)) by [@decepulis](https://github.com/decepulis)
- *(core)* Reduce doubletap window from 300ms to 200ms ([#1328](https://github.com/videojs/v10/pull/1328)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Ignore gestures on interactive child elements ([#1327](https://github.com/videojs/v10/pull/1327)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Site accessibility rough edges ([#1330](https://github.com/videojs/v10/pull/1330)) by [@decepulis](https://github.com/decepulis)
- *(site)* Update text link hover style to gold underline ([#1149](https://github.com/videojs/v10/pull/1149)) by [@decepulis](https://github.com/decepulis)
- *(core)* Ignore non-primary pointer buttons in tap gesture ([#1329](https://github.com/videojs/v10/pull/1329)) by [@mihar-22](https://github.com/mihar-22)

### 💼 Other
- Media contracts ([#1297](https://github.com/videojs/v10/pull/1297)) by [@mihar-22](https://github.com/mihar-22)

### 🚜 Refactor
- *(packages)* [**breaking**] Replace DelegateMixin & ProxyMixin with MediaHost base classes ([#1292](https://github.com/videojs/v10/pull/1292)) by [@luwes](https://github.com/luwes)
- *(site)* Replace BEM class names with @scope-based CSS isolation in demos ([#1315](https://github.com/videojs/v10/pull/1315)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Move media host observed attributes to subclasses ([#1326](https://github.com/videojs/v10/pull/1326)) by [@luwes](https://github.com/luwes)

### 📚 Documentation
- Improve intro of a11y guide ([#1318](https://github.com/videojs/v10/pull/1318)) by [@decepulis](https://github.com/decepulis)
- Improve intro of a11y guide ([#1331](https://github.com/videojs/v10/pull/1331)) by [@decepulis](https://github.com/decepulis)

### ⚙️ Miscellaneous Tasks
- *(site)* Rewrite media element builder for MediaHost architecture ([#1334](https://github.com/videojs/v10/pull/1334)) by [@decepulis](https://github.com/decepulis)
- *(site)* Preset pipeline — scan source directories instead of barrel files ([#1333](https://github.com/videojs/v10/pull/1333)) by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-beta.17] - 2026-04-11

### 🚀 Features
- *(html)* Add `<media-gesture>` element ([#1305](https://github.com/videojs/v10/pull/1305)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Add gesture hooks and MediaGesture component ([#1309](https://github.com/videojs/v10/pull/1309)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Add gesture bindings to default skins and presets ([#1310](https://github.com/videojs/v10/pull/1310)) by [@mihar-22](https://github.com/mihar-22)

### 🐛 Bug Fixes
- *(html)* Replace bare side-effect imports with explicit safeDefine() in define modules ([#1307](https://github.com/videojs/v10/pull/1307)) by [@mihar-22](https://github.com/mihar-22)

## [@videojs/core@10.0.0-beta.16] - 2026-04-10

### 🚀 Features
- *(core)* Add sub-1x playback rates to defaults ([#1231](https://github.com/videojs/v10/pull/1231)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Add hotkey system with coordinator, actions, and ARIA support ([#1238](https://github.com/videojs/v10/pull/1238)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Add hotkeys ([#1239](https://github.com/videojs/v10/pull/1239)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Add hotkeys ([#1241](https://github.com/videojs/v10/pull/1241)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Media element API reference builder ([#1256](https://github.com/videojs/v10/pull/1256)) by [@decepulis](https://github.com/decepulis)
- *(packages)* Add mux-audio element and react component ([#1259](https://github.com/videojs/v10/pull/1259)) by [@luwes](https://github.com/luwes)
- *(packages)* Add hotkey bindings to preset skins ([#1264](https://github.com/videojs/v10/pull/1264)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Add toggleControls to controls feature ([#1280](https://github.com/videojs/v10/pull/1280)) by [@mihar-22](https://github.com/mihar-22)
- *(spf)* Architecture reactors ([#1218](https://github.com/videojs/v10/pull/1218)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(site)* Add default OG image for social sharing ([#1295](https://github.com/videojs/v10/pull/1295)) by [@decepulis](https://github.com/decepulis)
- *(core)* Add gesture system ([#1287](https://github.com/videojs/v10/pull/1287)) by [@mihar-22](https://github.com/mihar-22)

### 🐛 Bug Fixes
- *(site)* True conditional rendering in FrameworkCase ([#1223](https://github.com/videojs/v10/pull/1223)) by [@decepulis](https://github.com/decepulis)
- *(core)* Use 0.2 and 0.7 for default playback rates ([#1236](https://github.com/videojs/v10/pull/1236)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Create HotkeyRegistryController once in connectedCallback ([#1240](https://github.com/videojs/v10/pull/1240)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Allow undefined hotkey options  ([#1242](https://github.com/videojs/v10/pull/1242)) by [@mihar-22](https://github.com/mihar-22)
- Safari track bug, no playback ([#1226](https://github.com/videojs/v10/pull/1226)) by [@luwes](https://github.com/luwes)
- *(packages)* Workspace drift ([#1270](https://github.com/videojs/v10/pull/1270)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Add pointer-events-none to hero heading ([#1278](https://github.com/videojs/v10/pull/1278)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Align media component conventions ([#1281](https://github.com/videojs/v10/pull/1281)) by [@mihar-22](https://github.com/mihar-22)
- *(utils)* Stable sort comparator and orphaned JSDoc ([#1286](https://github.com/videojs/v10/pull/1286)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Export SliderPreviewElement and ContextPartElement ([#1283](https://github.com/videojs/v10/pull/1283)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Add destroy guards to connectedCallback ([#1284](https://github.com/videojs/v10/pull/1284)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Consistent react versions ([#1285](https://github.com/videojs/v10/pull/1285)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Narrow react peer dependency to v18+ ([#1289](https://github.com/videojs/v10/pull/1289)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Remove redundant "Shift" modifier from playback rate hotkeys ([#1290](https://github.com/videojs/v10/pull/1290)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Time slider seek improvements ([#1291](https://github.com/videojs/v10/pull/1291)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Treat Alt as implicit modifier for non-letter character hotkeys ([#1304](https://github.com/videojs/v10/pull/1304)) by [@mihar-22](https://github.com/mihar-22)

### 💼 Other
- Feature and preset reference — E2E tests + implementation ([#1248](https://github.com/videojs/v10/pull/1248)) by [@decepulis](https://github.com/decepulis)

### 🚜 Refactor
- *(packages)* Move slider throttle from commit to change ([#1219](https://github.com/videojs/v10/pull/1219)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Extract structured CSSVars for media element templates ([#1257](https://github.com/videojs/v10/pull/1257)) by [@decepulis](https://github.com/decepulis)
- *(html)* Extract PositionController from tooltip/popover ([#1282](https://github.com/videojs/v10/pull/1282)) by [@mihar-22](https://github.com/mihar-22)

### 📚 Documentation
- *(site)* Rename commitThrottle to changeThrottle in time-slider reference ([#1221](https://github.com/videojs/v10/pull/1221)) by [@mihar-22](https://github.com/mihar-22)
- *(design)* Hotkeys ([#1222](https://github.com/videojs/v10/pull/1222)) by [@mihar-22](https://github.com/mihar-22)
- *(design)* Gestures ([#1044](https://github.com/videojs/v10/pull/1044)) by [@luwes](https://github.com/luwes)
- CLI for LLM-friendly Video.js installation ([#1205](https://github.com/videojs/v10/pull/1205)) by [@decepulis](https://github.com/decepulis)

### 🧪 Testing
- *(site)* Replace api-docs-builder design doc with E2E spec tests ([#1225](https://github.com/videojs/v10/pull/1225)) by [@decepulis](https://github.com/decepulis)

### ⚙️ Miscellaneous Tasks
- *(site)* Upgrade to Astro 6 ([#946](https://github.com/videojs/v10/pull/946)) by [@decepulis](https://github.com/decepulis)
- Use title prefixes instead of issue types for triage ([#1227](https://github.com/videojs/v10/pull/1227)) by [@decepulis](https://github.com/decepulis)
- *(ci)* Clarify Docs and Design prefix descriptions in triage bot ([#1228](https://github.com/videojs/v10/pull/1228)) by [@decepulis](https://github.com/decepulis)
- *(build)* Add workspace consistency checker ([#1277](https://github.com/videojs/v10/pull/1277)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Standardize conventions ([#1279](https://github.com/videojs/v10/pull/1279)) by [@mihar-22](https://github.com/mihar-22)

## [@videojs/core@10.0.0-beta.15] - 2026-04-03

### 🐛 Bug Fixes
- *(site)* Remove default attr from storyboard track elements ([#1211](https://github.com/videojs/v10/pull/1211)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Prevent non-fast-forward push in release-pr workflow ([#1213](https://github.com/videojs/v10/pull/1213)) by [@luwes](https://github.com/luwes)
- *(core)* Enable default tracks for chapters and metadata ([#1216](https://github.com/videojs/v10/pull/1216)) by [@luwes](https://github.com/luwes)

### ⚙️ Miscellaneous Tasks
- *(ci)* Update workflows for new triage system ([#1217](https://github.com/videojs/v10/pull/1217)) by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-beta.14] - 2026-04-03

### 🚀 Features
- *(packages)* Volume slider scroll support ([#1175](https://github.com/videojs/v10/pull/1175)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Add llms.txt footer link to generated markdown pages ([#1201](https://github.com/videojs/v10/pull/1201)) by [@decepulis](https://github.com/decepulis)
- *(site)* Organize llms.txt indexes by sidebar structure ([#1203](https://github.com/videojs/v10/pull/1203)) by [@decepulis](https://github.com/decepulis)
- *(html)* Add ui bundles for eject ([#1206](https://github.com/videojs/v10/pull/1206)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Add native hls error handling ([#1190](https://github.com/videojs/v10/pull/1190)) by [@luwes](https://github.com/luwes)
- *(html)* Add native hls video to cdn ([#1208](https://github.com/videojs/v10/pull/1208)) by [@luwes](https://github.com/luwes)
- *(site)* Add storyboard to home page hero video ([#1093](https://github.com/videojs/v10/pull/1093)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Rotate poster time ([#1153](https://github.com/videojs/v10/pull/1153)) by [@heff](https://github.com/heff)

### 🐛 Bug Fixes
- *(site)* Replace deprecated `turbo-ignore` with `turbo query affected` ([#1178](https://github.com/videojs/v10/pull/1178)) by [@decepulis](https://github.com/decepulis)
- *(build)* Auto-stamp changelog version from release manifest ([#1179](https://github.com/videojs/v10/pull/1179)) by [@decepulis](https://github.com/decepulis)
- *(ci)* Rewrite API reference sync workflow ([#1180](https://github.com/videojs/v10/pull/1180)) by [@decepulis](https://github.com/decepulis)
- *(site)* Use absolute URLs in generated LLM markdown files ([#1200](https://github.com/videojs/v10/pull/1200)) by [@decepulis](https://github.com/decepulis)
- *(site)* Fix invalid import specifiers in ejected React skins ([#1192](https://github.com/videojs/v10/pull/1192)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Include base and shared styles in ejected skin CSS ([#1196](https://github.com/videojs/v10/pull/1196)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Make tooltips visual-only and auto-forward media button labels ([#1174](https://github.com/videojs/v10/pull/1174)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Move TimeElement child creation from constructor to connectedCallback ([#1209](https://github.com/videojs/v10/pull/1209)) by [@luwes](https://github.com/luwes)
- *(react)* Thumbnails broken when using hls media ([#1210](https://github.com/videojs/v10/pull/1210)) by [@mihar-22](https://github.com/mihar-22)

### 🚜 Refactor
- *(html)* SkinMixin -> SkinElement ([#1159](https://github.com/videojs/v10/pull/1159)) by [@sampotts](https://github.com/sampotts)
- *(site)* Extract BetaPill component ([#1198](https://github.com/videojs/v10/pull/1198)) by [@decepulis](https://github.com/decepulis)

### 📚 Documentation
- *(site)* Document wheelStep prop and scroll support in VolumeSlider ([#1195](https://github.com/videojs/v10/pull/1195)) by [@mihar-22](https://github.com/mihar-22)

### ⚡ Performance
- *(site)* Parallelize and cache pre-build scripts via turbo tasks ([#1202](https://github.com/videojs/v10/pull/1202)) by [@decepulis](https://github.com/decepulis)

### ⚙️ Miscellaneous Tasks
- *(design)* Archive implemented docs and simplify design skill conventions ([#1173](https://github.com/videojs/v10/pull/1173)) by [@mihar-22](https://github.com/mihar-22)
- *(claude)* Update `create-issue` skill  ([#1172](https://github.com/videojs/v10/pull/1172)) by [@mihar-22](https://github.com/mihar-22)
- Move sandbox to `apps/` ([#1171](https://github.com/videojs/v10/pull/1171)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Remove CI failure diagnosis workflow ([#1191](https://github.com/videojs/v10/pull/1191)) by [@mihar-22](https://github.com/mihar-22)
- *(sandbox)* Fix app for mux, native hls ([#1207](https://github.com/videojs/v10/pull/1207)) by [@luwes](https://github.com/luwes)

## [@videojs/core@10.0.0-beta.13] - 2026-04-01

### 🐛 Bug Fixes
- *(core)* Fix media proxy for React ([#1169](https://github.com/videojs/v10/pull/1169)) by [@luwes](https://github.com/luwes)

### ⚙️ Miscellaneous Tasks
- Update changelog ([#1168](https://github.com/videojs/v10/pull/1168)) by [@mihar-22](https://github.com/mihar-22)
- *(root)* Upgrade turbo to 2.9 ([#1167](https://github.com/videojs/v10/pull/1167)) by [@mihar-22](https://github.com/mihar-22)

## [@videojs/core@10.0.0-beta.12] - 2026-04-01

### 🚀 Features
- Add Mux video component ([#1036](https://github.com/videojs/v10/pull/1036)) by [@luwes](https://github.com/luwes)
- *(site)* Improve ejected skin output with usage examples and media elements ([#1108](https://github.com/videojs/v10/pull/1108)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Implement preload for HLS media ([#1125](https://github.com/videojs/v10/pull/1125)) by [@luwes](https://github.com/luwes)
- Add native hls media + refactor ([#1154](https://github.com/videojs/v10/pull/1154)) by [@luwes](https://github.com/luwes)
- *(packages)* Error dialog component ([#1077](https://github.com/videojs/v10/pull/1077)) by [@sampotts](https://github.com/sampotts)
- *(core)* Add error handling to Hls.js media ([#1164](https://github.com/videojs/v10/pull/1164)) by [@luwes](https://github.com/luwes)

### 🐛 Bug Fixes
- *(site)* Use client:idle for ejected skin tabs so hidden panels hydrate ([#1137](https://github.com/videojs/v10/pull/1137)) by [@mihar-22](https://github.com/mihar-22)
- *(utils)* Polyfill AbortSignal.any for Chromium ≤115 ([#1142](https://github.com/videojs/v10/pull/1142)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Add Netlify redirects for old blog URLs ([#1144](https://github.com/videojs/v10/pull/1144)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add visible "Details" label to API reference table toggle columns ([#1147](https://github.com/videojs/v10/pull/1147)) by [@decepulis](https://github.com/decepulis)
- *(site)* Increase blog body text to 18px for readability ([#1146](https://github.com/videojs/v10/pull/1146)) by [@decepulis](https://github.com/decepulis)
- *(site)* Use overflow-auto on TabsPanel to prevent layout jump ([#1148](https://github.com/videojs/v10/pull/1148)) by [@decepulis](https://github.com/decepulis)
- Isolate preload mixin for hls delegate ([#1150](https://github.com/videojs/v10/pull/1150)) by [@luwes](https://github.com/luwes)
- *(site)* Add missing space in navbar ([#1151](https://github.com/videojs/v10/pull/1151)) by [@decepulis](https://github.com/decepulis)
- *(skin)* Responsive design fixes and improvements ([#1129](https://github.com/videojs/v10/pull/1129)) by [@sampotts](https://github.com/sampotts)
- *(html)* HTML SSR safety and sandbox skin chunking ([#1155](https://github.com/videojs/v10/pull/1155)) by [@sampotts](https://github.com/sampotts)
- *(core)* Fix Mux data initialization ([#1162](https://github.com/videojs/v10/pull/1162)) by [@luwes](https://github.com/luwes)

### 💼 Other
- *(spf)* Migrate reactors from WritableState to TC39 Signals ([#1112](https://github.com/videojs/v10/pull/1112)) by [@cjpillsbury](https://github.com/cjpillsbury)

### 🚜 Refactor
- *(site)* Flatten skin into player in ejected output and replace poster slot with img ([#1127](https://github.com/videojs/v10/pull/1127)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Reorganize SVG assets into assets/icons and assets/logos ([#1138](https://github.com/videojs/v10/pull/1138)) by [@decepulis](https://github.com/decepulis)

### 🧪 Testing
- *(spf)* Restore headless browser config for vitest ([#1103](https://github.com/videojs/v10/pull/1103)) by [@mihar-22](https://github.com/mihar-22)

### ⚙️ Miscellaneous Tasks
- *(packages)* Upgrade tsdown 0.20.3 → 0.21.4 ([#1102](https://github.com/videojs/v10/pull/1102)) by [@mihar-22](https://github.com/mihar-22)
- *(root)* Replace turbo watch with build-first dev scripts ([#1114](https://github.com/videojs/v10/pull/1114)) by [@mihar-22](https://github.com/mihar-22)
- *(claude)* Add create-issue skill ([#1133](https://github.com/videojs/v10/pull/1133)) by [@mihar-22](https://github.com/mihar-22)

## [@videojs/core@10.0.0-beta.11] - 2026-03-24

### 🚀 Features
- *(packages)* Export media component building blocks ([#1098](https://github.com/videojs/v10/pull/1098)) by [@mihar-22](https://github.com/mihar-22)

### ⚙️ Miscellaneous Tasks
- Upgrade typescript 6, vitest 4, align spf package ([#1101](https://github.com/videojs/v10/pull/1101)) by [@mihar-22](https://github.com/mihar-22)

## [@videojs/core@10.0.0-beta.10] - 2026-03-24

### 🐛 Bug Fixes
- *(core)* Prevent sprite tile bleeding in thumbnail component ([#1053](https://github.com/videojs/v10/pull/1053)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Fix button text alignment and text shadow ([#1091](https://github.com/videojs/v10/pull/1091)) by [@sampotts](https://github.com/sampotts)
- *(react)* Add missing destroy cleanups  ([#1096](https://github.com/videojs/v10/pull/1096)) by [@mihar-22](https://github.com/mihar-22)

## [@videojs/core@10.0.0-beta.9] - 2026-03-23

### 🚀 Features
- *(skin)* Add error handling for audio players ([#1048](https://github.com/videojs/v10/pull/1048)) by [@sampotts](https://github.com/sampotts)

### 🐛 Bug Fixes
- *(docs)* Improvements to eject script ([#1012](https://github.com/videojs/v10/pull/1012)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Extract transition properties into CSS custom properties ([#1075](https://github.com/videojs/v10/pull/1075)) by [@sampotts](https://github.com/sampotts)
- *(site)* Quote poster prop value in react demo code template ([#1079](https://github.com/videojs/v10/pull/1079)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Flatten error classes in ejected react skins ([#1080](https://github.com/videojs/v10/pull/1080)) by [@mihar-22](https://github.com/mihar-22)
- *(spf)* Implement preload IDL attribute on SpfMedia ([#1069](https://github.com/videojs/v10/pull/1069)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(spf)* Call sourceBuffer.abort() on AbortError to reset MSE parser state ([#1081](https://github.com/videojs/v10/pull/1081)) by [@cjpillsbury](https://github.com/cjpillsbury)

### 🚜 Refactor
- *(react)* Simplify skin render props with element form ([#1068](https://github.com/videojs/v10/pull/1068)) by [@mihar-22](https://github.com/mihar-22)

## [@videojs/core@10.0.0-beta.8] - 2026-03-20

### 🚀 Features
- *(site)* Migrate search from Pagefind to Algolia DocSearch v4 ([#941](https://github.com/videojs/v10/pull/941)) by [@decepulis](https://github.com/decepulis)

### 🐛 Bug Fixes
- *(site)* Redirect vjs10-site.netlify.app to videojs.org ([#1038](https://github.com/videojs/v10/pull/1038)) by [@decepulis](https://github.com/decepulis)
- *(html)* Template minifier stripping out default slot tags ([#1045](https://github.com/videojs/v10/pull/1045)) by [@mihar-22](https://github.com/mihar-22)
- *(docs)* Add missing DocsLinkCard import ([#1050](https://github.com/videojs/v10/pull/1050)) by [@sampotts](https://github.com/sampotts)
- *(docs)* Add DocsLinkCard import to the correct page ([#1051](https://github.com/videojs/v10/pull/1051)) by [@sampotts](https://github.com/sampotts)
- *(html)* Remove redundant CDN CSS files and inline background skin styles ([#1071](https://github.com/videojs/v10/pull/1071)) by [@mihar-22](https://github.com/mihar-22)

### 📚 Documentation
- *(site)* Add accessibility concepts page ([#1007](https://github.com/videojs/v10/pull/1007)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add "Build with AI" guide ([#1005](https://github.com/videojs/v10/pull/1005)) by [@decepulis](https://github.com/decepulis)
- *(skin)* Add docs on skin styling ([#958](https://github.com/videojs/v10/pull/958)) by [@sampotts](https://github.com/sampotts)
- *(site)* Add browser support concept page ([#1035](https://github.com/videojs/v10/pull/1035)) by [@decepulis](https://github.com/decepulis)

### ⚙️ Miscellaneous Tasks
- *(root)* Migrate build scripts and plugins to TypeScript ([#1052](https://github.com/videojs/v10/pull/1052)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Add SPF to issue template package options ([#1058](https://github.com/videojs/v10/pull/1058)) by [@cjpillsbury](https://github.com/cjpillsbury)

## [@videojs/core@10.0.0-beta.7] - 2026-03-19

### 🚀 Features
- *(skin)* Add --media-color-primary customization ([#957](https://github.com/videojs/v10/pull/957)) by [@sampotts](https://github.com/sampotts)
- Add DashVideo media element (html, react) with sandbox support ([#940](https://github.com/videojs/v10/pull/940)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(sandbox)* Dynamically load skins by styling ([#989](https://github.com/videojs/v10/pull/989)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Add poster component to video skins ([#994](https://github.com/videojs/v10/pull/994)) by [@sampotts](https://github.com/sampotts)
- *(html)* Add data-availability to volume slider ([#1001](https://github.com/videojs/v10/pull/1001)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Add pip-enter and pip-exit icons ([#1015](https://github.com/videojs/v10/pull/1015)) by [@sampotts](https://github.com/sampotts)
- *(html)* Refactor attach contexts to carry state and setter ([#1024](https://github.com/videojs/v10/pull/1024)) by [@mihar-22](https://github.com/mihar-22)

### 🐛 Bug Fixes
- *(skin)* Bake in safari layout fix into skins ([#954](https://github.com/videojs/v10/pull/954)) by [@sampotts](https://github.com/sampotts)
- *(site)* Add /logo-white.png public asset ([#972](https://github.com/videojs/v10/pull/972)) by [@decepulis](https://github.com/decepulis)
- *(core)* Rename MediaDelegateMixin and MediaProxyMixin ([#976](https://github.com/videojs/v10/pull/976)) by [@luwes](https://github.com/luwes)
- Correct popup fallback positioning offsets ([#981](https://github.com/videojs/v10/pull/981)) by [@sampotts](https://github.com/sampotts)
- *(utils)* Handle missing media.querySelectorAll for HLS ([#986](https://github.com/videojs/v10/pull/986)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Remove overflow in minimal video skin ([#993](https://github.com/videojs/v10/pull/993)) by [@sampotts](https://github.com/sampotts)
- *(skin)* Add subtle control transitions on touch devices ([#985](https://github.com/videojs/v10/pull/985)) by [@sampotts](https://github.com/sampotts)
- *(core)* Suppress tooltip hover on touch pointer events ([#933](https://github.com/videojs/v10/pull/933)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Stub pointer:fine in tooltip touch suppression tests ([#998](https://github.com/videojs/v10/pull/998)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Prevent slider thumb jump on pointer release ([#990](https://github.com/videojs/v10/pull/990)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Sync playback feature state on seeked event ([#1000](https://github.com/videojs/v10/pull/1000)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Improve fullscreen and pip webkit fallback handling ([#999](https://github.com/videojs/v10/pull/999)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Fix HTML skin poster image alignment ([#1002](https://github.com/videojs/v10/pull/1002)) by [@sampotts](https://github.com/sampotts)
- *(site)* Add font metric overrides to reduce display font layout shift ([#1010](https://github.com/videojs/v10/pull/1010)) by [@decepulis](https://github.com/decepulis)
- *(site)* Remove top-level await from ClientCode to fix Safari hydration ([#1006](https://github.com/videojs/v10/pull/1006)) by [@decepulis](https://github.com/decepulis)
- *(skin)* Fixes for react poster image alignment ([#1003](https://github.com/videojs/v10/pull/1003)) by [@sampotts](https://github.com/sampotts)
- *(html)* Restore deprecated slot="media" for backwards compatibility ([#1020](https://github.com/videojs/v10/pull/1020)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Hide volume popover when volume control is unsupported ([#1025](https://github.com/videojs/v10/pull/1025)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Round thumbnail dimensions to prevent sub-pixel gaps ([#995](https://github.com/videojs/v10/pull/995)) by [@sampotts](https://github.com/sampotts)
- *(html)* Extended media not working over cdn ([#1019](https://github.com/videojs/v10/pull/1019)) by [@mihar-22](https://github.com/mihar-22)

### 🚜 Refactor
- *(packages)* Move store attach lifecycle to provider ([#975](https://github.com/videojs/v10/pull/975)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Context-based media discovery, remove slot="media" ([#997](https://github.com/videojs/v10/pull/997)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Collapse unchanged packages in bundle size report ([#1016](https://github.com/videojs/v10/pull/1016)) by [@mihar-22](https://github.com/mihar-22)

### 📚 Documentation
- *(site)* Clean up concept pages from #769 ([#970](https://github.com/videojs/v10/pull/970)) by [@decepulis](https://github.com/decepulis)
- *(internal)* Add gesture as components decision ([#949](https://github.com/videojs/v10/pull/949)) by [@esbie](https://github.com/esbie)
- *(site)* Add Slider and Tooltip API reference pages ([#862](https://github.com/videojs/v10/pull/862)) by [@decepulis](https://github.com/decepulis)
- *(design)* Add SPF living design docs ([#899](https://github.com/videojs/v10/pull/899)) by [@cjpillsbury](https://github.com/cjpillsbury)
- Update site for context-based media discovery ([#1018](https://github.com/videojs/v10/pull/1018)) by [@mihar-22](https://github.com/mihar-22)

### ⚙️ Miscellaneous Tasks
- *(changelog)* Release please token ([#973](https://github.com/videojs/v10/pull/973)) by [@luwes](https://github.com/luwes)
- *(sandbox)* Update sandbox deps ([#983](https://github.com/videojs/v10/pull/983)) by [@sampotts](https://github.com/sampotts)
- *(cd)* Add changelog actions pipeline ([#1032](https://github.com/videojs/v10/pull/1032)) by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-beta.6] - 2026-03-15

### 🚀 Features
- *(site)* Add shiki notation transformers ([#937](https://github.com/videojs/v10/pull/937)) by [@decepulis](https://github.com/decepulis)
- Add slider preview thumbnails ([#935](https://github.com/videojs/v10/pull/935)) by [@sampotts](https://github.com/sampotts)

### 🐛 Bug Fixes
- *(site)* Improve whitespace around links ([#913](https://github.com/videojs/v10/pull/913)) by [@decepulis](https://github.com/decepulis)
- *(site)* Fix Brightcove typo ([#915](https://github.com/videojs/v10/pull/915)) by [@decepulis](https://github.com/decepulis)
- *(changelog)* Add root changelog generator ([#916](https://github.com/videojs/v10/pull/916)) by [@luwes](https://github.com/luwes)
- *(site)* Restore blank lines in code blocks ([#945](https://github.com/videojs/v10/pull/945)) by [@decepulis](https://github.com/decepulis)
- *(sandbox)* Use getMuxPosterSrc ([#950](https://github.com/videojs/v10/pull/950)) by [@sampotts](https://github.com/sampotts)
- Add popover and tooltip safe areas ([#951](https://github.com/videojs/v10/pull/951)) by [@sampotts](https://github.com/sampotts)
- *(html)* Simplify styles for slotted video ([#953](https://github.com/videojs/v10/pull/953)) by [@sampotts](https://github.com/sampotts)

### 📚 Documentation
- *(site)* Add skins & architecture concept pages ([#769](https://github.com/videojs/v10/pull/769)) by [@heff](https://github.com/heff)

### ⚙️ Miscellaneous Tasks
- *(changelog)* Remove keepachangelog header ([#918](https://github.com/videojs/v10/pull/918)) by [@luwes](https://github.com/luwes)
- Ignore .claude/worktrees/ directory ([#932](https://github.com/videojs/v10/pull/932)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Add Algolia site verification meta tag ([#939](https://github.com/videojs/v10/pull/939)) by [@decepulis](https://github.com/decepulis)

### New Contributors
* @esbie made their first contribution in [#917](https://github.com/videojs/v10/pull/917)

## [@videojs/core@10.0.0-beta.5] - 2026-03-12

### 🐛 Bug Fixes
- *(skin)* Only set poster object-fit: contain in fullscreen ([#906](https://github.com/videojs/v10/pull/906)) by [@sampotts](https://github.com/sampotts)
- *(site)* Include HLS CDN script in installation builder ([#907](https://github.com/videojs/v10/pull/907)) by [@mihar-22](https://github.com/mihar-22)
- *(skin)* Scope controls transitions to fine pointer only ([#909](https://github.com/videojs/v10/pull/909)) by [@mihar-22](https://github.com/mihar-22)
- *(cd)* Add @videojs/skins to release please ([#910](https://github.com/videojs/v10/pull/910)) by [@sampotts](https://github.com/sampotts)

## [@videojs/core@10.0.0-beta.4] - 2026-03-12

### 🚀 Features
- *(spf)* Stream segment fetches via ReadableStream body ([#890](https://github.com/videojs/v10/pull/890)) by [@cjpillsbury](https://github.com/cjpillsbury)

### 🐛 Bug Fixes
- *(site)* Work around video layout quirks in hero ([#884](https://github.com/videojs/v10/pull/884)) by [@decepulis](https://github.com/decepulis)
- *(site)* Redirect trailing-slash URLs via edge function ([#885](https://github.com/videojs/v10/pull/885)) by [@decepulis](https://github.com/decepulis)
- *(site)* Filter devOnly posts from RSS feed ([#888](https://github.com/videojs/v10/pull/888)) by [@decepulis](https://github.com/decepulis)
- Attaching media like elements and upgrade ([#889](https://github.com/videojs/v10/pull/889)) by [@luwes](https://github.com/luwes)
- *(skin)* Standardize backdrop-filter and fix minimal root sizing ([#895](https://github.com/videojs/v10/pull/895)) by [@sampotts](https://github.com/sampotts)
- *(site)* Replace GA4 with PostHog cookieless analytics ([#894](https://github.com/videojs/v10/pull/894)) by [@decepulis](https://github.com/decepulis)
- Mobile controls issues ([#896](https://github.com/videojs/v10/pull/896)) by [@luwes](https://github.com/luwes)
- *(skin)* Add missing tooltip provider/group ([#902](https://github.com/videojs/v10/pull/902)) by [@sampotts](https://github.com/sampotts)
- *(site)* Add playsinline to home and installation snippets ([#897](https://github.com/videojs/v10/pull/897)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Skip delay when switching between grouped tooltips ([#903](https://github.com/videojs/v10/pull/903)) by [@sampotts](https://github.com/sampotts)
- *(spf)* Propagate byteRange when building segment load tasks ([#904](https://github.com/videojs/v10/pull/904)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(skin)* Fix fullscreen video clipping and border-radius handling ([#905](https://github.com/videojs/v10/pull/905)) by [@sampotts](https://github.com/sampotts)

### ⚙️ Miscellaneous Tasks
- *(changelog)* Use one root level changelog ([#900](https://github.com/videojs/v10/pull/900)) by [@luwes](https://github.com/luwes)
- *(changelog)* Fix changelog-path ([#901](https://github.com/videojs/v10/pull/901)) by [@luwes](https://github.com/luwes)

## [@videojs/core@10.0.0-beta.3] - 2026-03-11

### 🚀 Features
- *(site)* Add optional OG image support to blog posts ([#878](https://github.com/videojs/v10/pull/878)) by [@decepulis](https://github.com/decepulis)

### 🐛 Bug Fixes
- *(html)* Remove commented error dialog blocks from video skins ([#865](https://github.com/videojs/v10/pull/865)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Add missing slot="media" to HTML demo video elements ([#867](https://github.com/videojs/v10/pull/867)) by [@decepulis](https://github.com/decepulis)
- *(site)* Netlify aliases -> redirects ([#868](https://github.com/videojs/v10/pull/868)) by [@decepulis](https://github.com/decepulis)
- *(site)* Use custom domain for og:image on production deploys ([#880](https://github.com/videojs/v10/pull/880)) by [@decepulis](https://github.com/decepulis)
- *(html)* Fix html container sizing ([#881](https://github.com/videojs/v10/pull/881)) by [@sampotts](https://github.com/sampotts)
- *(core)* Resolve pip state against media target ([#883](https://github.com/videojs/v10/pull/883)) by [@mihar-22](https://github.com/mihar-22)
- *(skins)* Remove legacy caption markup artifacts ([#882](https://github.com/videojs/v10/pull/882)) by [@mihar-22](https://github.com/mihar-22)

### ⚙️ Miscellaneous Tasks
- *(site)* Remove v8 link checker integration ([#879](https://github.com/videojs/v10/pull/879)) by [@decepulis](https://github.com/decepulis)
- *(sandbox)* Sandbox cleanup ([#797](https://github.com/videojs/v10/pull/797)) by [@sampotts](https://github.com/sampotts)

## [@videojs/core@10.0.0-beta.2] - 2026-03-10

### 🚀 Features
- *(site)* Use HlsVideo in homepage HeroVideo component ([#854](https://github.com/videojs/v10/pull/854)) by [@decepulis](https://github.com/decepulis)
- *(html)* Add CDN bundles and inline template minification ([#827](https://github.com/videojs/v10/pull/827)) by [@mihar-22](https://github.com/mihar-22)

### 🐛 Bug Fixes
- *(docs)* Update v10 blog post ([#852](https://github.com/videojs/v10/pull/852)) by [@decepulis](https://github.com/decepulis)
- *(site)* Move legacy banner to base layout and fix mobile text size ([#855](https://github.com/videojs/v10/pull/855)) by [@decepulis](https://github.com/decepulis)
- *(site)* Fix legacy banner layout on narrow viewports ([#856](https://github.com/videojs/v10/pull/856)) by [@decepulis](https://github.com/decepulis)
- *(site)* Center-align radio option labels in ImageRadioGroup ([#858](https://github.com/videojs/v10/pull/858)) by [@decepulis](https://github.com/decepulis)

### 📚 Documentation
- Discord link in blog post ([#863](https://github.com/videojs/v10/pull/863)) by [@heff](https://github.com/heff)

### ⚙️ Miscellaneous Tasks
- *(site)* Migrate to videojs.org and clean up remaining redirects ([#853](https://github.com/videojs/v10/pull/853)) by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-beta.1] - 2026-03-10

### 🚀 Features
- *(site)* Ejected skins build script, docs page, and home page wiring ([#809](https://github.com/videojs/v10/pull/809)) by [@sampotts](https://github.com/sampotts)

### 🐛 Bug Fixes
- *(docs)* Update README contributing section for beta ([#847](https://github.com/videojs/v10/pull/847)) by [@decepulis](https://github.com/decepulis)
- *(packages)* Update package READMEs for beta ([#848](https://github.com/videojs/v10/pull/848)) by [@decepulis](https://github.com/decepulis)
- *(packages)* Set release-please manifest and package versions to beta.0 ([#850](https://github.com/videojs/v10/pull/850)) by [@decepulis](https://github.com/decepulis)

### ⚙️ Miscellaneous Tasks
- *(cd)* Transition from alpha/next to beta/latest ([#846](https://github.com/videojs/v10/pull/846)) by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-alpha.11] - 2026-03-10

### 🚀 Features
- *(spf)* Basic ManagedMediaSource support for Safari ([#843](https://github.com/videojs/v10/pull/843)) by [@cjpillsbury](https://github.com/cjpillsbury)

### 🐛 Bug Fixes
- *(site)* Correct homepage download comparison ([#823](https://github.com/videojs/v10/pull/823)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Use MUX_URL const with UTM params for mux.com links ([#833](https://github.com/videojs/v10/pull/833)) by [@decepulis](https://github.com/decepulis)
- *(spf)* Prefer MediaSource over ManagedMediaSource ([#838](https://github.com/videojs/v10/pull/838)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(spf)* Fix async teardown leaks and recreate engine on src change ([#841](https://github.com/videojs/v10/pull/841)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(spf)* Add missing repository field ([#844](https://github.com/videojs/v10/pull/844)) by [@decepulis](https://github.com/decepulis)

### 💼 Other
- Add default Mux sources to home and installation snippets ([#815](https://github.com/videojs/v10/pull/815)) by [@mihar-22](https://github.com/mihar-22)
- Force release please, please ([#829](https://github.com/videojs/v10/pull/829)) by [@cjpillsbury](https://github.com/cjpillsbury)

### 📚 Documentation
- Remove spread from videoFeatures examples ([#816](https://github.com/videojs/v10/pull/816)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Remove TODO placeholders from installation copy ([#820](https://github.com/videojs/v10/pull/820)) by [@mihar-22](https://github.com/mihar-22)
- Move videojs CSS imports to top in React snippets ([#818](https://github.com/videojs/v10/pull/818)) by [@mihar-22](https://github.com/mihar-22)
- Add mux.com links in install/docs ([#819](https://github.com/videojs/v10/pull/819)) by [@mihar-22](https://github.com/mihar-22)
- Fix install tab label casing ([#822](https://github.com/videojs/v10/pull/822)) by [@mihar-22](https://github.com/mihar-22)
- Use framework exports in player API examples ([#821](https://github.com/videojs/v10/pull/821)) by [@mihar-22](https://github.com/mihar-22)
- Add 'use client' to React install example ([#825](https://github.com/videojs/v10/pull/825)) by [@mihar-22](https://github.com/mihar-22)
- Show HTML attribute name in API prop details ([#817](https://github.com/videojs/v10/pull/817)) by [@mihar-22](https://github.com/mihar-22)
- Use Audio/Video labels on installation page ([#824](https://github.com/videojs/v10/pull/824)) by [@mihar-22](https://github.com/mihar-22)
- V10 beta blog post ([#811](https://github.com/videojs/v10/pull/811)) by [@heff](https://github.com/heff)

## [@videojs/core@10.0.0-alpha.10] - 2026-03-10

### 🚀 Features
- *(site)* New home page, docs, and design system ([#566](https://github.com/videojs/v10/pull/566)) by [@ronald-urbina](https://github.com/ronald-urbina)
- *(skin)* Add audio skins for HTML and React presets ([#772](https://github.com/videojs/v10/pull/772)) by [@sampotts](https://github.com/sampotts)
- *(sandbox)* Rebuild sandbox with shell UI and expanded templates ([#773](https://github.com/videojs/v10/pull/773)) by [@sampotts](https://github.com/sampotts)
- *(site)* Darker dark mode footer ([#780](https://github.com/videojs/v10/pull/780)) by [@decepulis](https://github.com/decepulis)
- *(sandbox)* Dark mode support and template entry files ([#781](https://github.com/videojs/v10/pull/781)) by [@sampotts](https://github.com/sampotts)
- *(site)* Add cookieless Google Analytics ([#788](https://github.com/videojs/v10/pull/788)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add legacy docs banner and v8 links ([#786](https://github.com/videojs/v10/pull/786)) by [@decepulis](https://github.com/decepulis)
- *(spf)* Initial push of SPF ([#784](https://github.com/videojs/v10/pull/784)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(skin)* Port tooltip styling from tech preview ([#800](https://github.com/videojs/v10/pull/800)) by [@sampotts](https://github.com/sampotts)

### 🐛 Bug Fixes
- *(ci)* Stabilize bundle size diff reporting for UI components ([#761](https://github.com/videojs/v10/pull/761)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Apply popover data attributes before showing via popover API ([#763](https://github.com/videojs/v10/pull/763)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Update mux sponsor language and alignment ([#768](https://github.com/videojs/v10/pull/768)) by [@decepulis](https://github.com/decepulis)
- *(site)* Redirect /guides to legacy.videojs.org ([#694](https://github.com/videojs/v10/pull/694)) by [@decepulis](https://github.com/decepulis)
- *(site)* Rebrand polish ([#775](https://github.com/videojs/v10/pull/775)) by [@decepulis](https://github.com/decepulis)
- *(core)* Prevent slider track click from closing popover ([#776](https://github.com/videojs/v10/pull/776)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Thumb edge alignment jump ([#766](https://github.com/videojs/v10/pull/766)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Handle remote image URLs in Img component ([#789](https://github.com/videojs/v10/pull/789)) by [@decepulis](https://github.com/decepulis)
- *(sandbox)* Use simpler web storage hook ([#794](https://github.com/videojs/v10/pull/794)) by [@sampotts](https://github.com/sampotts)
- *(site)* Use Consent Mode v2 for cookieless Google Analytics ([#795](https://github.com/videojs/v10/pull/795)) by [@decepulis](https://github.com/decepulis)
- *(core)* Optimistic current time update on seek to prevent slider snap-back ([#799](https://github.com/videojs/v10/pull/799)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Allow exact tumblr image URL ([#803](https://github.com/videojs/v10/pull/803)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Use composedPath for popover outside-click detection ([#806](https://github.com/videojs/v10/pull/806)) by [@mihar-22](https://github.com/mihar-22)
- *(slider)* Keep pointer position after pointerleave ([#807](https://github.com/videojs/v10/pull/807)) by [@mihar-22](https://github.com/mihar-22)

### 💼 Other
- *(spf)* Add spf to release please config ([#796](https://github.com/videojs/v10/pull/796)) by [@cjpillsbury](https://github.com/cjpillsbury)

### 🚜 Refactor
- *(core)* Replace document listeners with pointer capture in slider ([#762](https://github.com/videojs/v10/pull/762)) by [@mihar-22](https://github.com/mihar-22)

### 📚 Documentation
- Add captions button ([#777](https://github.com/videojs/v10/pull/777)) by [@luwes](https://github.com/luwes)
- *(site)* React API reference styling sections use correct selectors ([#785](https://github.com/videojs/v10/pull/785)) by [@decepulis](https://github.com/decepulis)

### ⚙️ Miscellaneous Tasks
- Update examples to have sidebar and more examples link on non ([#767](https://github.com/videojs/v10/pull/767)) by [@luwes](https://github.com/luwes)
- *(packages)* Remove tech-preview package ([#793](https://github.com/videojs/v10/pull/793)) by [@mihar-22](https://github.com/mihar-22)
- *(sandbox)* Add hls-video to new sandbox setup (NOTE: hls-video H… ([#798](https://github.com/videojs/v10/pull/798)) by [@cjpillsbury](https://github.com/cjpillsbury)
- Gitignore `.claude/settings.local.json` ([#770](https://github.com/videojs/v10/pull/770)) by [@heff](https://github.com/heff)
- *(sandbox)* Adding spf/simple-hls-video + filtering to only include CMAF/fmp4 sources ([#802](https://github.com/videojs/v10/pull/802)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(skin)* Refactor tooltip/popover styles/classnames ([#801](https://github.com/videojs/v10/pull/801)) by [@sampotts](https://github.com/sampotts)
- Fix repo biome lint errors ([#804](https://github.com/videojs/v10/pull/804)) by [@mihar-22](https://github.com/mihar-22)

### New Contributors
* @ronald-urbina made their first contribution in [#566](https://github.com/videojs/v10/pull/566)

## [@videojs/core@10.0.0-alpha.9] - 2026-03-06

### 🚀 Features
- Add subtitles handling + captions core ([#692](https://github.com/videojs/v10/pull/692)) by [@luwes](https://github.com/luwes)
- *(react)* Add alert dialog component ([#739](https://github.com/videojs/v10/pull/739)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Add alert dialog element ([#741](https://github.com/videojs/v10/pull/741)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Add alert dialog to video skin ([#747](https://github.com/videojs/v10/pull/747)) by [@mihar-22](https://github.com/mihar-22)

### 🐛 Bug Fixes
- Destroy hls.js instance on media unmount ([#749](https://github.com/videojs/v10/pull/749)) by [@luwes](https://github.com/luwes)
- *(ci)* Rework bundle size report ([#745](https://github.com/videojs/v10/pull/745)) by [@mihar-22](https://github.com/mihar-22)
- Delegate not defining Delegate props ([#751](https://github.com/videojs/v10/pull/751)) by [@luwes](https://github.com/luwes)
- *(core)* Auto-unmute on volume change and restore volume on unmute ([#752](https://github.com/videojs/v10/pull/752)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Add destroy ([#748](https://github.com/videojs/v10/pull/748)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Derive effective mute state for volume UI components ([#753](https://github.com/videojs/v10/pull/753)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Use double-RAF in transition open to enable entry animations ([#755](https://github.com/videojs/v10/pull/755)) by [@mihar-22](https://github.com/mihar-22)
- Ssr issue with hls.js ([#758](https://github.com/videojs/v10/pull/758)) by [@luwes](https://github.com/luwes)
- TextTrackList and optimize ([#760](https://github.com/videojs/v10/pull/760)) by [@luwes](https://github.com/luwes)

### ◀️ Revert
- *(html)* Remove double raf hls destroy ([#754](https://github.com/videojs/v10/pull/754)) by [@mihar-22](https://github.com/mihar-22)

## [@videojs/core@10.0.0-alpha.8] - 2026-03-05

### 🚀 Features
- Small state and naming fixes  ([#719](https://github.com/videojs/v10/pull/719)) by [@luwes](https://github.com/luwes)
- *(html)* Add slider thumbnail element ([#714](https://github.com/videojs/v10/pull/714)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Add slider thumbnail component ([#722](https://github.com/videojs/v10/pull/722)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Add slider preview component ([#710](https://github.com/videojs/v10/pull/710)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Add slider preview element ([#733](https://github.com/videojs/v10/pull/733)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Add tooltip  ([#734](https://github.com/videojs/v10/pull/734)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Add tooltip element ([#735](https://github.com/videojs/v10/pull/735)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Add tooltip component ([#736](https://github.com/videojs/v10/pull/736)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Add error feature ([#713](https://github.com/videojs/v10/pull/713)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Add AlertDialog data attributes ([#738](https://github.com/videojs/v10/pull/738)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Add alert dialog with dismiss layer and transitions ([#743](https://github.com/videojs/v10/pull/743)) by [@mihar-22](https://github.com/mihar-22)

### 🐛 Bug Fixes
- *(react)* Set anchor-name and position-anchor imperatively in popover ([#715](https://github.com/videojs/v10/pull/715)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Slider interaction and edge alignment broken ([#721](https://github.com/videojs/v10/pull/721)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Add missing slot="media" to renderer element in HTML code block ([#737](https://github.com/videojs/v10/pull/737)) by [@decepulis](https://github.com/decepulis)
- *(ci)* Reuse diagnosis comment per PR instead of per run ([#740](https://github.com/videojs/v10/pull/740)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Strict mode support ([#742](https://github.com/videojs/v10/pull/742)) by [@mihar-22](https://github.com/mihar-22)

### 📚 Documentation
- Add type module to cdn imports by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-alpha.7] - 2026-03-04

### 🐛 Bug Fixes
- *(html,react)* Move @videojs/skins to devDependencies ([#716](https://github.com/videojs/v10/pull/716)) by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-alpha.6] - 2026-03-04

### 🐛 Bug Fixes
- *(site)* Reset installation guide to implemented features ([#707](https://github.com/videojs/v10/pull/707)) by [@decepulis](https://github.com/decepulis)
- *(core)* Use camelCase attribute names in slider for react ([#708](https://github.com/videojs/v10/pull/708)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Prevent shell injection from PR title/body in sync workflow ([#711](https://github.com/videojs/v10/pull/711)) by [@decepulis](https://github.com/decepulis)
- *(html)* Move @videojs/icons to devDependencies ([#712](https://github.com/videojs/v10/pull/712)) by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-alpha.5] - 2026-03-04

### 🚀 Features
- *(react)* Support native caption track shifting in video skins ([#636](https://github.com/videojs/v10/pull/636)) by [@sampotts](https://github.com/sampotts)
- *(react)* Add playback rate button component ([#639](https://github.com/videojs/v10/pull/639)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Add PlaybackRateButton to core, html, and react ([#642](https://github.com/videojs/v10/pull/642)) by [@decepulis](https://github.com/decepulis)
- *(core)* Add thumbnail component and text track store feature ([#643](https://github.com/videojs/v10/pull/643)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Add thumbnail element ([#646](https://github.com/videojs/v10/pull/646)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Add thumbnail component ([#648](https://github.com/videojs/v10/pull/648)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Add popover component ([#615](https://github.com/videojs/v10/pull/615)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Add popover element ([#652](https://github.com/videojs/v10/pull/652)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Add popover component ([#653](https://github.com/videojs/v10/pull/653)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Add slider component ([#644](https://github.com/videojs/v10/pull/644)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Add time slider component ([#647](https://github.com/videojs/v10/pull/647)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Add slider element ([#655](https://github.com/videojs/v10/pull/655)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Add time slider element ([#656](https://github.com/videojs/v10/pull/656)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Add volume slider element ([#657](https://github.com/videojs/v10/pull/657)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Port time slider styling into video skin presets ([#666](https://github.com/videojs/v10/pull/666)) by [@sampotts](https://github.com/sampotts)
- *(react)* Port volume popover and slider styling into skin presets ([#667](https://github.com/videojs/v10/pull/667)) by [@sampotts](https://github.com/sampotts)
- *(react)* Orientation-aware buffer styling and slider improvements ([#671](https://github.com/videojs/v10/pull/671)) by [@sampotts](https://github.com/sampotts)
- *(sandbox)* Add README and sync script ([#673](https://github.com/videojs/v10/pull/673)) by [@sampotts](https://github.com/sampotts)
- *(ci)* Add weekly project report workflow ([#665](https://github.com/videojs/v10/pull/665)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Add issue-to-pr claude workflow ([#675](https://github.com/videojs/v10/pull/675)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Add api-reference sync agent workflow ([#676](https://github.com/videojs/v10/pull/676)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Split llms.txt into per-framework and blog sub-indexes ([#697](https://github.com/videojs/v10/pull/697)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add TimeSlider, VolumeSlider, Popover API references ([#685](https://github.com/videojs/v10/pull/685)) by [@decepulis](https://github.com/decepulis)
- *(skin)* Implement default and minimal skins for HTML player ([#698](https://github.com/videojs/v10/pull/698)) by [@sampotts](https://github.com/sampotts)
- *(site)* Replace home page tech preview player with real player ([#580](https://github.com/videojs/v10/pull/580)) by [@decepulis](https://github.com/decepulis)

### 🐛 Bug Fixes
- *(skin)* Temporarily hide the caption button ([#629](https://github.com/videojs/v10/pull/629)) by [@sampotts](https://github.com/sampotts)
- Revert preset provider ([#631](https://github.com/videojs/v10/pull/631)) by [@luwes](https://github.com/luwes)
- Add SSR stubs for HLS media ([#641](https://github.com/videojs/v10/pull/641)) by [@luwes](https://github.com/luwes)
- *(ci)* Allow OIDC token in issue sync workflow ([#661](https://github.com/videojs/v10/pull/661)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Reduce issue sync permission denials ([#662](https://github.com/videojs/v10/pull/662)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Use relative import path for useForceRender ([#669](https://github.com/videojs/v10/pull/669)) by [@sampotts](https://github.com/sampotts)
- *(react)* Correct buffer selector names in minimal skin CSS ([#672](https://github.com/videojs/v10/pull/672)) by [@sampotts](https://github.com/sampotts)
- *(site)* Strip script and style tags from llms markdown output ([#678](https://github.com/videojs/v10/pull/678)) by [@decepulis](https://github.com/decepulis)
- *(site)* Review cleanup for API reference pages ([#685](https://github.com/videojs/v10/pull/685)) by [@decepulis](https://github.com/decepulis)
- *(html)* Prevent tsdown from stripping custom element registrations ([#703](https://github.com/videojs/v10/pull/703)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Skip error pages and strip styles in llms-markdown integration ([#706](https://github.com/videojs/v10/pull/706)) by [@decepulis](https://github.com/decepulis)

### 🚜 Refactor
- *(html)* Separate provider and container concerns in createPlayer ([#635](https://github.com/videojs/v10/pull/635)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Move feature presets to subpath exports ([#633](https://github.com/videojs/v10/pull/633)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Split UI define modules and narrow slider imports ([#659](https://github.com/videojs/v10/pull/659)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Dry up core, html, and react UI architecture ([#699](https://github.com/videojs/v10/pull/699)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Split api-reference sync into three focused jobs ([#677](https://github.com/videojs/v10/pull/677)) by [@decepulis](https://github.com/decepulis)

### 📚 Documentation
- *(design)* PlaybackRateButton component spec ([#624](https://github.com/videojs/v10/pull/624)) by [@decepulis](https://github.com/decepulis)
- *(site)* Use createPlayer in React installation code generator ([#634](https://github.com/videojs/v10/pull/634)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Add thumbnail reference page  ([#654](https://github.com/videojs/v10/pull/654)) by [@mihar-22](https://github.com/mihar-22)
- *(root)* Update timeline dates for alpha and beta by [@mihar-22](https://github.com/mihar-22)

### ⚙️ Miscellaneous Tasks
- *(ci)* Add issue sync workflow ([#660](https://github.com/videojs/v10/pull/660)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Migrate issue triage workflow to Claude agent ([#663](https://github.com/videojs/v10/pull/663)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Add explicit checks and Claude diagnosis ([#664](https://github.com/videojs/v10/pull/664)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Remove weekly project report workflow ([#680](https://github.com/videojs/v10/pull/680)) by [@mihar-22](https://github.com/mihar-22)
- *(claude)* Add session start hook to run gh-setup-hooks ([#700](https://github.com/videojs/v10/pull/700)) by [@mihar-22](https://github.com/mihar-22)

## [@videojs/core@10.0.0-alpha.4] - 2026-02-26

### 🚀 Features
- Add background video preset ([#607](https://github.com/videojs/v10/pull/607)) by [@luwes](https://github.com/luwes)

### 🐛 Bug Fixes
- *(react)* Move @videojs/icons to devDependencies by [@decepulis](https://github.com/decepulis)
- *(react)* Update lockfile for icons dependency move by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-alpha.3] - 2026-02-26

### 🐛 Bug Fixes
- *(cd)* Add repository field to all packages for provenance verification by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-alpha.2] - 2026-02-26

### 🚀 Features
- *(cd)* Switch to npm trusted publishers by [@decepulis](https://github.com/decepulis)

## [@videojs/core@10.0.0-alpha.1] - 2026-02-26

### 🚀 Features
- *(example/react)* Improvements to react examples ([#210](https://github.com/videojs/v10/pull/210)) by [@sampotts](https://github.com/sampotts)
- *(core)* Add user activity logic ([#278](https://github.com/videojs/v10/pull/278)) by [@sampotts](https://github.com/sampotts)
- *(store)* Initial release ([#279](https://github.com/videojs/v10/pull/279)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Add error codes ([#284](https://github.com/videojs/v10/pull/284)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Queue task refactor ([#287](https://github.com/videojs/v10/pull/287)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* React bindings ([#288](https://github.com/videojs/v10/pull/288)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Dom media slices ([#292](https://github.com/videojs/v10/pull/292)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Lit bindings ([#289](https://github.com/videojs/v10/pull/289)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Add video component and utility hooks ([#293](https://github.com/videojs/v10/pull/293)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* UseMutation hook for react ([#290](https://github.com/videojs/v10/pull/290)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* UseOptimistic hook for react ([#291](https://github.com/videojs/v10/pull/291)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Lit bound controllers ([#297](https://github.com/videojs/v10/pull/297)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Skin store setup ([#298](https://github.com/videojs/v10/pull/298)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Sync queue ([#308](https://github.com/videojs/v10/pull/308)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Add reactive state primitives ([#311](https://github.com/videojs/v10/pull/311)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Align queue with native ([#312](https://github.com/videojs/v10/pull/312)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Store selector api ([#370](https://github.com/videojs/v10/pull/370)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Add player target and feature selectors ([#371](https://github.com/videojs/v10/pull/371)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Setup react player api ([#372](https://github.com/videojs/v10/pull/372)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Setup player api ([#374](https://github.com/videojs/v10/pull/374)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Add `PlayerElement` to `createPlayer` ([#376](https://github.com/videojs/v10/pull/376)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Remove style from urls ([#378](https://github.com/videojs/v10/pull/378)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add interactive getting started guide ([#280](https://github.com/videojs/v10/pull/280)) by [@daniel-hayes](https://github.com/daniel-hayes)
- *(core)* Add play button component ([#383](https://github.com/videojs/v10/pull/383)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Add mute button component ([#455](https://github.com/videojs/v10/pull/455)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Extract api reference from components ([#464](https://github.com/videojs/v10/pull/464)) by [@decepulis](https://github.com/decepulis)
- *(core)* Add presentation feature ([#458](https://github.com/videojs/v10/pull/458)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Add time display component ([#460](https://github.com/videojs/v10/pull/460)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Add fullscreen button component ([#459](https://github.com/videojs/v10/pull/459)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Generated multipart component api reference ([#468](https://github.com/videojs/v10/pull/468)) by [@decepulis](https://github.com/decepulis)
- *(sandbox)* Add private sandbox package for internal testing ([#478](https://github.com/videojs/v10/pull/478)) by [@mihar-22](https://github.com/mihar-22)
- *(html)* Reorganize import paths by use case ([#480](https://github.com/videojs/v10/pull/480)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Perform /docs redirect client-side by [@decepulis](https://github.com/decepulis)
- *(site)* Simple api reference examples ([#472](https://github.com/videojs/v10/pull/472)) by [@decepulis](https://github.com/decepulis)
- *(site)* Add display font by [@decepulis](https://github.com/decepulis)
- *(core)* Add poster component ([#457](https://github.com/videojs/v10/pull/457)) by [@mihar-22](https://github.com/mihar-22)
- *(element)* Add lightweight reactive element base ([#513](https://github.com/videojs/v10/pull/513)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Add controls component with activity tracking ([#514](https://github.com/videojs/v10/pull/514)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Basic 404 and 500 pages by [@decepulis](https://github.com/decepulis)
- *(site)* Controls API reference by [@decepulis](https://github.com/decepulis)
- *(site)* Poster API reference by [@decepulis](https://github.com/decepulis)
- *(site)* Clean up api reference header hierarchy by [@decepulis](https://github.com/decepulis)
- *(core)* Add pip button component ([#525](https://github.com/videojs/v10/pull/525)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Add seek button component ([#526](https://github.com/videojs/v10/pull/526)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Add buffering indicator component ([#527](https://github.com/videojs/v10/pull/527)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* State subscription primitives ([#528](https://github.com/videojs/v10/pull/528)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Add slider core layer ([#529](https://github.com/videojs/v10/pull/529)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Add pip button api reference by [@decepulis](https://github.com/decepulis)
- *(site)* Add seek button api reference by [@decepulis](https://github.com/decepulis)
- *(site)* Add buffering indicator api reference by [@decepulis](https://github.com/decepulis)
- *(react)* Initial skin scaffolding ([#523](https://github.com/videojs/v10/pull/523)) by [@sampotts](https://github.com/sampotts)
- *(icons)* Setup icons package ([#536](https://github.com/videojs/v10/pull/536)) by [@sampotts](https://github.com/sampotts)
- *(site)* Add Mux health check action ([#542](https://github.com/videojs/v10/pull/542)) by [@decepulis](https://github.com/decepulis)
- *(site)* Framework-specific SEO metadata for docs ([#541](https://github.com/videojs/v10/pull/541)) by [@decepulis](https://github.com/decepulis)
- Add media API + HLS video components ([#507](https://github.com/videojs/v10/pull/507)) by [@luwes](https://github.com/luwes)
- *(react)* Implement default and minimal video skins ([#550](https://github.com/videojs/v10/pull/550)) by [@sampotts](https://github.com/sampotts)
- *(react)* Implement video skins with responsive layout ([#568](https://github.com/videojs/v10/pull/568)) by [@sampotts](https://github.com/sampotts)
- *(site)* Add markdown content negotiation via Netlify edge function ([#573](https://github.com/videojs/v10/pull/573)) by [@decepulis](https://github.com/decepulis)
- *(react)* Add captions styling to video skins ([#582](https://github.com/videojs/v10/pull/582)) by [@sampotts](https://github.com/sampotts)
- Add background video components ([#567](https://github.com/videojs/v10/pull/567)) by [@luwes](https://github.com/luwes)
- *(react)* Add Tailwind ejected video skins ([#589](https://github.com/videojs/v10/pull/589)) by [@sampotts](https://github.com/sampotts)
- Add media delegate mixin ([#598](https://github.com/videojs/v10/pull/598)) by [@luwes](https://github.com/luwes)
- *(site)* Add util reference pipeline ([#537](https://github.com/videojs/v10/pull/537)) by [@decepulis](https://github.com/decepulis)
- *(skin)* Add error dialogs ([#603](https://github.com/videojs/v10/pull/603)) by [@sampotts](https://github.com/sampotts)
- *(site)* Preserve scroll position on framework switch (pagereveal) ([#608](https://github.com/videojs/v10/pull/608)) by [@decepulis](https://github.com/decepulis)
- *(skin)* Add captions button to video skins ([#612](https://github.com/videojs/v10/pull/612)) by [@sampotts](https://github.com/sampotts)
- *(core)* Add slider dom ([#613](https://github.com/videojs/v10/pull/613)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Source URL auto-detection for installation page ([#619](https://github.com/videojs/v10/pull/619)) by [@decepulis](https://github.com/decepulis)

### 🐛 Bug Fixes
- *(core)* Fixed fullscreen on ios safari ([#211](https://github.com/videojs/v10/pull/211)) by [@LachlanRumery](https://github.com/LachlanRumery)
- *(example/react)* Fix routing on vercel ([#217](https://github.com/videojs/v10/pull/217)) by [@sampotts](https://github.com/sampotts)
- *(examples)* Fix CSS consistency issues ([#309](https://github.com/videojs/v10/pull/309)) by [@sampotts](https://github.com/sampotts)
- *(store)* Guard abort on request supersession ([#313](https://github.com/videojs/v10/pull/313)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Style overflowing tables by [@decepulis](https://github.com/decepulis)
- Update npm install paths ([#379](https://github.com/videojs/v10/pull/379)) by [@decepulis](https://github.com/decepulis)
- *(site)* Apply dark mode to code blocks by [@decepulis](https://github.com/decepulis)
- *(site)* Correct table overscroll indicator color in dark mode by [@decepulis](https://github.com/decepulis)
- *(docs)* Updating installation langauge by [@heff](https://github.com/heff)
- *(docs)* Add audio to getting started guide and other updates by [@heff](https://github.com/heff)
- *(ci)* Work around false-positive biome / astro errors by [@decepulis](https://github.com/decepulis)
- *(packages)* Enable unbundle mode to avoid mangled exports by [@mihar-22](https://github.com/mihar-22)
- *(html)* Discover media elements and attach store target via DOM ([#481](https://github.com/videojs/v10/pull/481)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Improve initial demo css by [@decepulis](https://github.com/decepulis)
- *(site)* Improve time demo css by [@decepulis](https://github.com/decepulis)
- *(site)* Don't hit archive.org during build by [@decepulis](https://github.com/decepulis)
- *(site)* Show docs sidebar on tablet by [@decepulis](https://github.com/decepulis)
- *(site)* Clarify "Copy as Markdown" button by [@decepulis](https://github.com/decepulis)
- *(site)* Support satisfies in api-docs data attrs extraction ([#517](https://github.com/videojs/v10/pull/517)) by [@decepulis](https://github.com/decepulis)
- *(site)* Resolve aliased part descriptions in api docs ([#518](https://github.com/videojs/v10/pull/518)) by [@decepulis](https://github.com/decepulis)
- *(site)* Use first-match-wins for multipart primary selection ([#519](https://github.com/videojs/v10/pull/519)) by [@decepulis](https://github.com/decepulis)
- *(site)* Strip trailing slashes from pathname when copying markdown by [@decepulis](https://github.com/decepulis)
- *(ci)* Fix website tests workflow ([#565](https://github.com/videojs/v10/pull/565)) by [@decepulis](https://github.com/decepulis)
- *(core)* Fix circular import and simplify media types ([#569](https://github.com/videojs/v10/pull/569)) by [@sampotts](https://github.com/sampotts)
- *(site)* Use astro:env for server-only environment variables ([#574](https://github.com/videojs/v10/pull/574)) by [@decepulis](https://github.com/decepulis)
- Use cross-platform Node script for postinstall symlinks ([#577](https://github.com/videojs/v10/pull/577)) by [@decepulis](https://github.com/decepulis)
- *(cd)* Use namespace imports for actions packages ([#583](https://github.com/videojs/v10/pull/583)) by [@sampotts](https://github.com/sampotts)
- *(site)* Improve auth popup size and clean up Mux links ([#587](https://github.com/videojs/v10/pull/587)) by [@decepulis](https://github.com/decepulis)
- *(site)* Upgrade to React 19 to resolve invalid hook call ([#597](https://github.com/videojs/v10/pull/597)) by [@decepulis](https://github.com/decepulis)
- *(site)* Work around Astro SSR false "Invalid hook call" warnings ([#600](https://github.com/videojs/v10/pull/600)) by [@decepulis](https://github.com/decepulis)
- *(sandbox)* Update style path in index.html ([#604](https://github.com/videojs/v10/pull/604)) by [@sampotts](https://github.com/sampotts)
- *(site)* Add missing background-video media element import ([#605](https://github.com/videojs/v10/pull/605)) by [@decepulis](https://github.com/decepulis)
- *(site)* Disable Netlify edge functions in dev to prevent Deno OOM ([#620](https://github.com/videojs/v10/pull/620)) by [@decepulis](https://github.com/decepulis)
- *(site)* Resolve biome lint warnings ([#602](https://github.com/videojs/v10/pull/602)) by [@decepulis](https://github.com/decepulis)
- *(core)* Preserve user props in time slider ([#621](https://github.com/videojs/v10/pull/621)) by [@mihar-22](https://github.com/mihar-22)

### 🚜 Refactor
- *(store)* Remove partial slice state updates ([#296](https://github.com/videojs/v10/pull/296)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Queue simplification ([#302](https://github.com/videojs/v10/pull/302)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Rename slice to feature ([#318](https://github.com/videojs/v10/pull/318)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Simplify state management + computeds ([#321](https://github.com/videojs/v10/pull/321)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Use undefined instead of null for void-input placeholder ([#322](https://github.com/videojs/v10/pull/322)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Flatten store/queue state ([#326](https://github.com/videojs/v10/pull/326)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Clean up by [@mihar-22](https://github.com/mihar-22)
- *(claude)* Apply skill authoring guidelines to existing skills by [@mihar-22](https://github.com/mihar-22)
- *(store)* Simplify controller and state APIs ([#352](https://github.com/videojs/v10/pull/352)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Simplify queue - remove task state tracking ([#359](https://github.com/videojs/v10/pull/359)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Remove platform queue bindings ([#360](https://github.com/videojs/v10/pull/360)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Simplify create store implementations ([#361](https://github.com/videojs/v10/pull/361)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* V2 ([#362](https://github.com/videojs/v10/pull/362)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Merge getSnapshot/subscribe into attach ([#364](https://github.com/videojs/v10/pull/364)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Rename feature to slice ([#373](https://github.com/videojs/v10/pull/373)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Remove queue and task system ([#382](https://github.com/videojs/v10/pull/382)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Centralize feature state types ([#448](https://github.com/videojs/v10/pull/448)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Replace disposer with abort controller ([#449](https://github.com/videojs/v10/pull/449)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Replace signal/abort with signals namespace ([#453](https://github.com/videojs/v10/pull/453)) by [@mihar-22](https://github.com/mihar-22)
- *(core)* Prefix media state exports with `Media` ([#475](https://github.com/videojs/v10/pull/475)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Rename `Signals` to `AbortControllerRegistry` ([#476](https://github.com/videojs/v10/pull/476)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Simplify `createPlayer` type signatures ([#477](https://github.com/videojs/v10/pull/477)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Clean up UI component types and data flow ([#479](https://github.com/videojs/v10/pull/479)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Derive default props from core classes ([#488](https://github.com/videojs/v10/pull/488)) by [@mihar-22](https://github.com/mihar-22)
- Replace URL.pathname with fileURLToPath for cross-platform … ([#581](https://github.com/videojs/v10/pull/581)) by [@dh-mux](https://github.com/dh-mux)

### 📚 Documentation
- *(store)* Update readme by [@mihar-22](https://github.com/mihar-22)
- *(plan)* Store bindings ([#283](https://github.com/videojs/v10/pull/283)) by [@mihar-22](https://github.com/mihar-22)
- *(plan)* Remove old file by [@mihar-22](https://github.com/mihar-22)
- *(plan)* Update store bindings by [@mihar-22](https://github.com/mihar-22)
- *(claude)* Add symbol identification pattern by [@mihar-22](https://github.com/mihar-22)
- *(plan)* Add using slices by [@mihar-22](https://github.com/mihar-22)
- *(root)* Add AI-assisted development section to CONTRIBUTING by [@mihar-22](https://github.com/mihar-22)
- *(claude)* Add no co-author trailer rule by [@mihar-22](https://github.com/mihar-22)
- *(claude)* Compact old store plans by [@mihar-22](https://github.com/mihar-22)
- *(plan)* Player api design ([#300](https://github.com/videojs/v10/pull/300)) by [@mihar-22](https://github.com/mihar-22)
- *(plan)* Clean up player api design examples by [@mihar-22](https://github.com/mihar-22)
- *(plan)* Add usage notes to player api design by [@mihar-22](https://github.com/mihar-22)
- *(rfc)* Add rfc structure ([#316](https://github.com/videojs/v10/pull/316)) by [@mihar-22](https://github.com/mihar-22)
- *(rfc)* Rename rfcs/ to rfc/ by [@mihar-22](https://github.com/mihar-22)
- *(rfc)* Primitives api & feature access ([#307](https://github.com/videojs/v10/pull/307)) by [@mihar-22](https://github.com/mihar-22)
- *(claude)* Add `rfc` skill ([#319](https://github.com/videojs/v10/pull/319)) by [@mihar-22](https://github.com/mihar-22)
- *(plan)* Update store reactive plan by [@mihar-22](https://github.com/mihar-22)
- *(root)* Separate design from rfcs ([#351](https://github.com/videojs/v10/pull/351)) by [@mihar-22](https://github.com/mihar-22)
- *(design)* Add feature slice design ([#356](https://github.com/videojs/v10/pull/356)) by [@mihar-22](https://github.com/mihar-22)
- *(design)* Cross-reference feature-slice and feature-availability ([#357](https://github.com/videojs/v10/pull/357)) by [@mihar-22](https://github.com/mihar-22)
- *(rfc)* Player api design v2 ([#358](https://github.com/videojs/v10/pull/358)) by [@mihar-22](https://github.com/mihar-22)
- *(plan)* Store v2 by [@mihar-22](https://github.com/mihar-22)
- *(store)* Add feature API redesign plan by [@mihar-22](https://github.com/mihar-22)
- *(claude)* Add player api plan by [@mihar-22](https://github.com/mihar-22)
- *(rfc)* Update player api to match implementation ([#375](https://github.com/videojs/v10/pull/375)) by [@mihar-22](https://github.com/mihar-22)
- *(rfc)* Use `createSelector` in player api examples by [@mihar-22](https://github.com/mihar-22)
- *(claude)* Add Video.js component architecture patterns ([#450](https://github.com/videojs/v10/pull/450)) by [@mihar-22](https://github.com/mihar-22)
- *(store)* Align README with current API ([#451](https://github.com/videojs/v10/pull/451)) by [@mihar-22](https://github.com/mihar-22)
- *(design)* Add time component design ([#454](https://github.com/videojs/v10/pull/454)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Update getting started code examples to match new api ([#473](https://github.com/videojs/v10/pull/473)) by [@heff](https://github.com/heff)
- *(site)* Freshen up site README and CLAUDE by [@decepulis](https://github.com/decepulis)
- *(design)* Controls ([#456](https://github.com/videojs/v10/pull/456)) by [@mihar-22](https://github.com/mihar-22)
- *(design)* Slider ([#506](https://github.com/videojs/v10/pull/506)) by [@mihar-22](https://github.com/mihar-22)
- Add captions decision ([#611](https://github.com/videojs/v10/pull/611)) by [@sampotts](https://github.com/sampotts)
- *(design)* Add player-container separation decision ([#614](https://github.com/videojs/v10/pull/614)) by [@heff](https://github.com/heff)

### ⚡ Performance
- *(store)* Optimize reactive state hot paths ([#314](https://github.com/videojs/v10/pull/314)) by [@mihar-22](https://github.com/mihar-22)

### ⚙️ Miscellaneous Tasks
- Upgrade next to 16.0.10 ([#216](https://github.com/videojs/v10/pull/216)) by [@luwes](https://github.com/luwes)
- *(github)* Enable blank commits by [@mihar-22](https://github.com/mihar-22)
- *(root)* Prepare workspace for alpha ([#276](https://github.com/videojs/v10/pull/276)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Remove dom package by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Fix html and react deps by [@mihar-22](https://github.com/mihar-22)
- *(root)* Fix tsconfig references by [@mihar-22](https://github.com/mihar-22)
- Workspace improvements ([#282](https://github.com/videojs/v10/pull/282)) by [@mihar-22](https://github.com/mihar-22)
- *(claude)* Add gh-issue and review-branch commands by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Remove `isolatedDeclarations` for store type inference support ([#295](https://github.com/videojs/v10/pull/295)) by [@mihar-22](https://github.com/mihar-22)
- *(root)* Cache lint-staged eslint calls by [@mihar-22](https://github.com/mihar-22)
- *(utils)* Fix broken badge by [@mihar-22](https://github.com/mihar-22)
- *(site)* Add sentry to astro's server config ([#299](https://github.com/videojs/v10/pull/299)) by [@daniel-hayes](https://github.com/daniel-hayes)
- *(ci)* Do not run on rfc/* branch by [@mihar-22](https://github.com/mihar-22)
- *(claude)* Add skills system ([#310](https://github.com/videojs/v10/pull/310)) by [@mihar-22](https://github.com/mihar-22)
- *(root)* Archive examples into tech-preview ([#315](https://github.com/videojs/v10/pull/315)) by [@mihar-22](https://github.com/mihar-22)
- *(root)* Fix commitlint script by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Eslint + prettier → biome ([#325](https://github.com/videojs/v10/pull/325)) by [@sampotts](https://github.com/sampotts)
- *(claude)* Add claude-update skill by [@mihar-22](https://github.com/mihar-22)
- *(claude)* Migrate commands to skills by [@mihar-22](https://github.com/mihar-22)
- *(claude)* Add /create-skill by [@mihar-22](https://github.com/mihar-22)
- *(claude)* Add lit fundamentals by [@mihar-22](https://github.com/mihar-22)
- *(site)* Move to netlify ([#381](https://github.com/videojs/v10/pull/381)) by [@decepulis](https://github.com/decepulis)
- *(root)* Add postinstall symlinks for generic agents ([#447](https://github.com/videojs/v10/pull/447)) by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Add dev builds ([#452](https://github.com/videojs/v10/pull/452)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Format astro with biome by [@decepulis](https://github.com/decepulis)
- *(ci)* Add .zed/settings.json by [@decepulis](https://github.com/decepulis)
- *(packages)* Update tsdown to 0.20.3 by [@mihar-22](https://github.com/mihar-22)
- *(packages)* Resolve infinite dev rebuild loop in vite by [@mihar-22](https://github.com/mihar-22)
- *(site)* Configure netlify build and turbo-ignore by [@decepulis](https://github.com/decepulis)
- *(site)* Remove PostHog analytics ([#510](https://github.com/videojs/v10/pull/510)) by [@decepulis](https://github.com/decepulis)
- *(ci)* Add bundle size reporting workflow ([#511](https://github.com/videojs/v10/pull/511)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Fix bundle size measurement and format report ([#512](https://github.com/videojs/v10/pull/512)) by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Remove forced minimum fill on bundle size bars by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Show delta in bundle size bars instead of absolute size by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Add turbo caching and replace size-limit ([#524](https://github.com/videojs/v10/pull/524)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Audit and encode docs patterns ([#535](https://github.com/videojs/v10/pull/535)) by [@decepulis](https://github.com/decepulis)
- *(ci)* Add missing label workflow deps by [@mihar-22](https://github.com/mihar-22)
- *(root)* Add dependency graph to turbo dev and test tasks ([#540](https://github.com/videojs/v10/pull/540)) by [@decepulis](https://github.com/decepulis)
- *(ci)* Update Biome to latest and autofix ([#579](https://github.com/videojs/v10/pull/579)) by [@sampotts](https://github.com/sampotts)
- *(site)* Update Base UI from beta to stable release ([#610](https://github.com/videojs/v10/pull/610)) by [@decepulis](https://github.com/decepulis)
- *(packages)* Bump to 10.0.0-alpha.0 by [@decepulis](https://github.com/decepulis)

### New Contributors
* @dh-mux made their first contribution in [#581](https://github.com/videojs/v10/pull/581)
* @daniel-hayes made their first contribution in [#280](https://github.com/videojs/v10/pull/280)
* @LachlanRumery made their first contribution in [#211](https://github.com/videojs/v10/pull/211)

## [@videojs/core@0.1.0-preview.10] - 2025-12-06

### 🚀 Features
- *(site)* Add blog to navigation by [@decepulis](https://github.com/decepulis)
- *(site)* A few loading optimizations ([#193](https://github.com/videojs/v10/pull/193)) by [@decepulis](https://github.com/decepulis)
- Add console banner ([#186](https://github.com/videojs/v10/pull/186)) by [@luwes](https://github.com/luwes)
- Add tooltip core ([#212](https://github.com/videojs/v10/pull/212)) by [@luwes](https://github.com/luwes)

### 🐛 Bug Fixes
- Add popover core, use in html and improve factory ([#204](https://github.com/videojs/v10/pull/204)) by [@luwes](https://github.com/luwes)
- *(site)* Replace example mp4 with real by [@mihar-22](https://github.com/mihar-22)
- Use popover core in react popover ([#208](https://github.com/videojs/v10/pull/208)) by [@luwes](https://github.com/luwes)
- ToKebabCase import issue by [@luwes](https://github.com/luwes)
- *(demo)* Upgrade next and react dependencies by [@luwes](https://github.com/luwes)

### ⚙️ Miscellaneous Tasks
- *(root)* Update readme and contributing by [@mihar-22](https://github.com/mihar-22)
- *(root)* Update contributing by [@mihar-22](https://github.com/mihar-22)
- *(root)* Fix broken links in contributing by [@mihar-22](https://github.com/mihar-22)
- *(root)* Clean up links in readme by [@mihar-22](https://github.com/mihar-22)
- *(root)* Add community links to new issue page by [@mihar-22](https://github.com/mihar-22)
- *(root)* Disable blank issues from new issue page by [@mihar-22](https://github.com/mihar-22)
- *(ci)* Add action to label issues by [@mihar-22](https://github.com/mihar-22)
- *(examples)* Remove `-demo` suffix on dir names by [@mihar-22](https://github.com/mihar-22)

## [@videojs/core@0.1.0-preview.9] - 2025-11-18

### 🚀 Features
- *(site)* Llms.txt ([#184](https://github.com/videojs/v10/pull/184)) by [@decepulis](https://github.com/decepulis)
- *(site)* Migrate blog, with canonicals to v8 by [@decepulis](https://github.com/decepulis)

### 🐛 Bug Fixes
- Anchor name in popover and tooltip ([#194](https://github.com/videojs/v10/pull/194)) by [@luwes](https://github.com/luwes)
- Clean up core, less seams in wrappers ([#197](https://github.com/videojs/v10/pull/197)) by [@luwes](https://github.com/luwes)
- Fix CLS due to popover attribute not SSR ([#202](https://github.com/videojs/v10/pull/202)) by [@luwes](https://github.com/luwes)

### ⚙️ Miscellaneous Tasks
- *(site)* Add sitemap to robots.txt by [@decepulis](https://github.com/decepulis)
- Workaround race condition build-styles.ts ([#196](https://github.com/videojs/v10/pull/196)) by [@luwes](https://github.com/luwes)

## [@videojs/core@0.1.0-preview.8] - 2025-11-12

### 🐛 Bug Fixes
- *(site)* Idle load analytics ([#188](https://github.com/videojs/v10/pull/188)) by [@decepulis](https://github.com/decepulis)
- Hydration mismatch in Tooltip and Popover ([#190](https://github.com/videojs/v10/pull/190)) by [@luwes](https://github.com/luwes)

## [@videojs/core@0.1.0-preview.7] - 2025-11-11

### 🚀 Features
- Use anchor API for html elements ([#174](https://github.com/videojs/v10/pull/174)) by [@luwes](https://github.com/luwes)
- *(react)* Use popover and anchor position API ([#178](https://github.com/videojs/v10/pull/178)) by [@luwes](https://github.com/luwes)

### 🐛 Bug Fixes
- *(skins)* Slightly more idiomatic Tailwind, added custom properties ([#175](https://github.com/videojs/v10/pull/175)) by [@sampotts](https://github.com/sampotts)
- *(react)* Dependency bug by [@luwes](https://github.com/luwes)
- *(skins)* Remove vjs- prefixed CSS custom properties ([#179](https://github.com/videojs/v10/pull/179)) by [@sampotts](https://github.com/sampotts)

### ⚙️ Miscellaneous Tasks
- *(site)* Begin v8 page migration ([#177](https://github.com/videojs/v10/pull/177)) by [@decepulis](https://github.com/decepulis)
- *(site)* Update eject code generator by [@luwes](https://github.com/luwes)

## [@videojs/core@0.1.0-preview.6] - 2025-11-06

### 🚀 Features
- *(site)* Restore docs sidebar state on navigation ([#160](https://github.com/videojs/v10/pull/160)) by [@decepulis](https://github.com/decepulis)
- *(site)* Search ([#165](https://github.com/videojs/v10/pull/165)) by [@decepulis](https://github.com/decepulis)
- *(react)* Use SimpleVideo as default Video and rename HLS version to HlsVideo ([#171](https://github.com/videojs/v10/pull/171)) by [@cjpillsbury](https://github.com/cjpillsbury)

### 🐛 Bug Fixes
- *(site)* Correct style import for skins by [@decepulis](https://github.com/decepulis)
- *(react, html)* Rename MediaProvider (and related) to VideoProvider ([#159](https://github.com/videojs/v10/pull/159)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(site)* Update discord link ([#170](https://github.com/videojs/v10/pull/170)) by [@heff](https://github.com/heff)

### 📚 Documentation
- Readme and contributing docs updates ([#167](https://github.com/videojs/v10/pull/167)) by [@cjpillsbury](https://github.com/cjpillsbury)
- Cleanup issues with previous pass on readme and contributing ([#168](https://github.com/videojs/v10/pull/168)) by [@cjpillsbury](https://github.com/cjpillsbury)
- More minor issue cleanup ([#169](https://github.com/videojs/v10/pull/169)) by [@cjpillsbury](https://github.com/cjpillsbury)
- Update site/README and add site/CLAUDE ([#172](https://github.com/videojs/v10/pull/172)) by [@decepulis](https://github.com/decepulis)

### ⚙️ Miscellaneous Tasks
- Consolidate eject examples ([#162](https://github.com/videojs/v10/pull/162)) by [@decepulis](https://github.com/decepulis)
- Add templates for well defined issue and discussion types ([#164](https://github.com/videojs/v10/pull/164)) by [@cjpillsbury](https://github.com/cjpillsbury)
- Discussion template naming convention ([#166](https://github.com/videojs/v10/pull/166)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(site)* Add trademark notice to footer ([#163](https://github.com/videojs/v10/pull/163)) by [@heff](https://github.com/heff)

## [@videojs/core@0.1.0-preview.5] - 2025-11-03

### 🚀 Features
- Eject examples ([#149](https://github.com/videojs/v10/pull/149)) by [@decepulis](https://github.com/decepulis)
- *(site)* Remove unnecessary hydration workarounds by [@decepulis](https://github.com/decepulis)
- *(site)* Add aside component by [@decepulis](https://github.com/decepulis)
- *(site)* Restrict dev mode analytics by [@decepulis](https://github.com/decepulis)
- *(site)* Prefetch links that require redirects by [@decepulis](https://github.com/decepulis)
- *(site)* Prefetch all links by [@decepulis](https://github.com/decepulis)
- *(site)* Film grain ([#150](https://github.com/videojs/v10/pull/150)) by [@decepulis](https://github.com/decepulis)
- Update html tooltip API / use command attr ([#151](https://github.com/videojs/v10/pull/151)) by [@luwes](https://github.com/luwes)

### 🐛 Bug Fixes
- *(site)* Scope HTML notice to HTML pages by [@decepulis](https://github.com/decepulis)
- Connect html eject skins to media-provider by [@decepulis](https://github.com/decepulis)
- *(site)* Update discord invite URL by [@decepulis](https://github.com/decepulis)
- *(site)* Shrink Aside and Blockquote child margins by [@decepulis](https://github.com/decepulis)
- Correct import on home page minimal skin by [@decepulis](https://github.com/decepulis)
- *(site)* Adjust footer for safari and firefox by [@decepulis](https://github.com/decepulis)
- *(site)* Improve legibility of aside by [@decepulis](https://github.com/decepulis)
- *(site)* Improve header typography by [@decepulis](https://github.com/decepulis)
- *(site)* Apply body background color by [@decepulis](https://github.com/decepulis)
- *(site)* Tighten mobile framework selector by [@decepulis](https://github.com/decepulis)
- *(site)* Stretch docs sidebar on desktop to prevent safari visual bug by [@decepulis](https://github.com/decepulis)
- *(site)* Improve mobile home page spacing by [@decepulis](https://github.com/decepulis)
- *(site)* Raise component demos above texture by [@decepulis](https://github.com/decepulis)
- *(site)* More reliable tabs ([#153](https://github.com/videojs/v10/pull/153)) by [@decepulis](https://github.com/decepulis)
- *(site)* Use MediaProvider on home page ([#154](https://github.com/videojs/v10/pull/154)) by [@decepulis](https://github.com/decepulis)
- *(docs)* Fix repo links in CONTRIBUTING.md by [@heff](https://github.com/heff)

### 📚 Documentation
- *(site)* Typo by [@mihar-22](https://github.com/mihar-22)
- Specify npm dist tag ([#155](https://github.com/videojs/v10/pull/155)) by [@decepulis](https://github.com/decepulis)

### ⚙️ Miscellaneous Tasks
- Update html demo to trigger build :( by [@luwes](https://github.com/luwes)
- *(site)* Update discord link ([#156](https://github.com/videojs/v10/pull/156)) by [@heff](https://github.com/heff)

### ◀️ Revert
- *(site)* Remove unnecessary hydration workarounds by [@decepulis](https://github.com/decepulis)

## [@videojs/core@0.1.0-preview.4] - 2025-10-30

### 🚀 Features
- *(html)* Add element registrations by [@mihar-22](https://github.com/mihar-22)

### 📚 Documentation
- Initial concepts and recipes ([#147](https://github.com/videojs/v10/pull/147)) by [@decepulis](https://github.com/decepulis)
- *(site)* Update element imports by [@mihar-22](https://github.com/mihar-22)

### ⚙️ Miscellaneous Tasks
- *(packages)* Move dom types down by [@mihar-22](https://github.com/mihar-22)
- *(root)* Update architecture docs by [@mihar-22](https://github.com/mihar-22)
- *(root)* Add timeline by [@mihar-22](https://github.com/mihar-22)
- *(site)* Add dom lib types by [@mihar-22](https://github.com/mihar-22)
- *(root)* Fix architecture link in readme by [@mihar-22](https://github.com/mihar-22)
- *(root)* Add contributing.md by [@mihar-22](https://github.com/mihar-22)
- *(root)* Update claude.md by [@mihar-22](https://github.com/mihar-22)
- *(root)* Remove bbb.mp4 by [@mihar-22](https://github.com/mihar-22)

## [@videojs/core@0.1.0-preview.3] - 2025-10-29

### 🚀 Features
- *(ui)* Skin design improvements, add html frosted skin (WIP) ([#133](https://github.com/videojs/v10/pull/133)) by [@sampotts](https://github.com/sampotts)
- *(skins)* Add html port of minimal skin ([#140](https://github.com/videojs/v10/pull/140)) by [@sampotts](https://github.com/sampotts)
- *(website)* Update favicon and theme color based on dark mode by [@decepulis](https://github.com/decepulis)
- *(site)* Raise prominence of home page demo toggles by [@decepulis](https://github.com/decepulis)
- Idiomatic html markup, use popover API, add safe polygon utility ([#143](https://github.com/videojs/v10/pull/143)) by [@luwes](https://github.com/luwes)
- *(site)* Tabs ([#144](https://github.com/videojs/v10/pull/144)) by [@decepulis](https://github.com/decepulis)

### 🐛 Bug Fixes
- Add viewport meta element ([#135](https://github.com/videojs/v10/pull/135)) by [@sampotts](https://github.com/sampotts)
- Add aspect-ratio to demos ([#136](https://github.com/videojs/v10/pull/136)) by [@sampotts](https://github.com/sampotts)
- Remove `show-remaining` in HTML example ([#137](https://github.com/videojs/v10/pull/137)) by [@sampotts](https://github.com/sampotts)
- *(packages)* Update version badges ([#138](https://github.com/videojs/v10/pull/138)) by [@mihar-22](https://github.com/mihar-22)
- *(react)* Prevent dev build race condition ([#139](https://github.com/videojs/v10/pull/139)) by [@sampotts](https://github.com/sampotts)
- *(website)* Improve legibility with heavier font weight ([#141](https://github.com/videojs/v10/pull/141)) by [@decepulis](https://github.com/decepulis)
- Visually hidden focus guards ([#142](https://github.com/videojs/v10/pull/142)) by [@luwes](https://github.com/luwes)
- Add aria-hidden to focus guards by [@luwes](https://github.com/luwes)
- *(utils)* Remove unnecessary keyboard utils ([#146](https://github.com/videojs/v10/pull/146)) by [@luwes](https://github.com/luwes)

### 📚 Documentation
- Initial component examples ([#123](https://github.com/videojs/v10/pull/123)) by [@cjpillsbury](https://github.com/cjpillsbury)

### ⚙️ Miscellaneous Tasks
- *(root)* Ignore linting commits starting with wip by [@mihar-22](https://github.com/mihar-22)
- *(website)* Hide blog by [@decepulis](https://github.com/decepulis)
- *(website)* Update roadmap by [@decepulis](https://github.com/decepulis)
- *(react)* Add postcss-prefix-selector types by [@mihar-22](https://github.com/mihar-22)
- *(site)* Rename website to site by [@decepulis](https://github.com/decepulis)
- Update repo URLs ([#145](https://github.com/videojs/v10/pull/145)) by [@luwes](https://github.com/luwes)
- *(site)* Update privacy policy by [@decepulis](https://github.com/decepulis)

## [@videojs/core@0.1.0-preview.2] - 2025-10-25

### 🐛 Bug Fixes
- *(root)* Remove dry-run from publish command by [@luwes](https://github.com/luwes)
- *(core)* Update README to use v10 terminology by [@luwes](https://github.com/luwes)

## [@videojs/core@0.1.0-preview.1] - 2025-10-25

### 🚀 Features
- Initialize Video.js 10 monorepo with core architecture by [@cjpillsbury](https://github.com/cjpillsbury)
- *(monorepo)* Migrate prototype code to organized package structure by [@cjpillsbury](https://github.com/cjpillsbury)
- Migrate entire monorepo from tsc to tsup for production builds by [@cjpillsbury](https://github.com/cjpillsbury)
- Migrate examples from prototype and add CSS modules support by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react)* Enable automatic CSS injection for MediaSkinDefault component by [@cjpillsbury](https://github.com/cjpillsbury)
- *(workspace)* Implement Turbo for build optimization and caching by [@cjpillsbury](https://github.com/cjpillsbury)
- *(icons)* Implement shared SVG icon system across packages by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react-icons)* Implement SVGR-powered auto-generation with full styling support by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react-media-store)* Add shallowEqual utility for optimized state comparisons by [@cjpillsbury](https://github.com/cjpillsbury)
- *(examples)* Configure separate default ports for React and HTML demos by [@cjpillsbury](https://github.com/cjpillsbury)
- *(core)* Implement temporal state management for time-based media controls by [@cjpillsbury](https://github.com/cjpillsbury)
- *(core,html,react)* Implement VolumeRange component with integrated state management by [@cjpillsbury](https://github.com/cjpillsbury)
- *(media-store,html,react)* Implement TimeRange component with hook-style architecture by [@cjpillsbury](https://github.com/cjpillsbury)
- *(icons)* Add fullscreen enter and exit icons by [@cjpillsbury](https://github.com/cjpillsbury)
- *(media-store)* Add fullscreen state mediator with shadow DOM support by [@cjpillsbury](https://github.com/cjpillsbury)
- *(media-store)* Add fullscreen button component state definition by [@cjpillsbury](https://github.com/cjpillsbury)
- *(html)* Add fullscreen button component and icons by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react)* Add fullscreen button component by [@cjpillsbury](https://github.com/cjpillsbury)
- *(html)* Integrate fullscreen button into control bar and improve container lifecycle by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react)* Add MediaContainer component for fullscreen functionality by [@cjpillsbury](https://github.com/cjpillsbury)
- *(media-store)* Add comprehensive time formatting utilities by [@cjpillsbury](https://github.com/cjpillsbury)
- *(media-store)* Add duration display component state definition by [@cjpillsbury](https://github.com/cjpillsbury)
- *(html)* Implement duration display component by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react)* Implement duration display component by [@cjpillsbury](https://github.com/cjpillsbury)
- *(skins)* Integrate duration display into default skins by [@cjpillsbury](https://github.com/cjpillsbury)
- Implement current time display components by [@cjpillsbury](https://github.com/cjpillsbury)
- Add showRemaining functionality to current time display by [@cjpillsbury](https://github.com/cjpillsbury)
- Make time range compound component ([#10](https://github.com/videojs/v10/pull/10)) by [@luwes](https://github.com/luwes)
- Add compound html timerange component ([#14](https://github.com/videojs/v10/pull/14)) by [@luwes](https://github.com/luwes)
- *(ui)* Port over default skin by [@sampotts](https://github.com/sampotts)
- *(ui)* Minor style tweaks by [@sampotts](https://github.com/sampotts)
- Add volume range compound component ([#19](https://github.com/videojs/v10/pull/19)) by [@luwes](https://github.com/luwes)
- Add core range, time and volume range ([#23](https://github.com/videojs/v10/pull/23)) by [@luwes](https://github.com/luwes)
- Add range orientation to react components ([#30](https://github.com/videojs/v10/pull/30)) by [@luwes](https://github.com/luwes)
- Add HTML vertical orientation to time and volume ([#32](https://github.com/videojs/v10/pull/32)) by [@luwes](https://github.com/luwes)
- Add popover React component ([#33](https://github.com/videojs/v10/pull/33)) by [@luwes](https://github.com/luwes)
- Add media-popover, cleanup html demo ([#34](https://github.com/videojs/v10/pull/34)) by [@luwes](https://github.com/luwes)
- *(ui)* Add toasted skin by [@sampotts](https://github.com/sampotts)
- *(ui)* Styling fixes for toasted skin ([#38](https://github.com/videojs/v10/pull/38)) by [@sampotts](https://github.com/sampotts)
- Add React tooltip component ([#35](https://github.com/videojs/v10/pull/35)) by [@luwes](https://github.com/luwes)
- Add HTML tooltip component ([#40](https://github.com/videojs/v10/pull/40)) by [@luwes](https://github.com/luwes)
- Add transition status to React tooltip ([#42](https://github.com/videojs/v10/pull/42)) by [@luwes](https://github.com/luwes)
- Rename range to slider ([#46](https://github.com/videojs/v10/pull/46)) by [@luwes](https://github.com/luwes)
- *(ui)* Micro icons, toasted design tweaks ([#52](https://github.com/videojs/v10/pull/52)) by [@sampotts](https://github.com/sampotts)
- *(ui)* More skin style tweaks ([#53](https://github.com/videojs/v10/pull/53)) by [@sampotts](https://github.com/sampotts)
- Add a solution for React preview time display ([#50](https://github.com/videojs/v10/pull/50)) by [@luwes](https://github.com/luwes)
- Add html preview time display ([#58](https://github.com/videojs/v10/pull/58)) by [@luwes](https://github.com/luwes)
- Add tooltip transition status by [@luwes](https://github.com/luwes)
- *(ui)* Skin and icon tweaks ([#59](https://github.com/videojs/v10/pull/59)) by [@sampotts](https://github.com/sampotts)
- Add data style attributes to popover ([#62](https://github.com/videojs/v10/pull/62)) by [@luwes](https://github.com/luwes)
- Website ([#45](https://github.com/videojs/v10/pull/45)) by [@decepulis](https://github.com/decepulis)
- *(website)* Add posthog analytics ([#71](https://github.com/videojs/v10/pull/71)) by [@decepulis](https://github.com/decepulis)
- *(website)* Favicon by [@decepulis](https://github.com/decepulis)
- Add focus state to sliders and volume slider ([#60](https://github.com/videojs/v10/pull/60)) by [@luwes](https://github.com/luwes)
- *(website)* Discord link by [@decepulis](https://github.com/decepulis)
- *(website)* Social links in footer by [@decepulis](https://github.com/decepulis)
- *(website)* Init dark mode by [@decepulis](https://github.com/decepulis)
- Add keyboard control to sliders ([#115](https://github.com/videojs/v10/pull/115)) by [@luwes](https://github.com/luwes)
- *(react)* Add Tailwind v4 compiled CSS for skins with vjs prefix ([#114](https://github.com/videojs/v10/pull/114)) by [@cjpillsbury](https://github.com/cjpillsbury)
- Add display click to play / pause ([#117](https://github.com/videojs/v10/pull/117)) by [@luwes](https://github.com/luwes)
- *(react)* Adding simple video ([#125](https://github.com/videojs/v10/pull/125)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(ui)* Skin design tweaks ([#126](https://github.com/videojs/v10/pull/126)) by [@sampotts](https://github.com/sampotts)

### 🐛 Bug Fixes
- *(config)* Remove duplicate noImplicitReturns key in tsconfig.base.json by [@cjpillsbury](https://github.com/cjpillsbury)
- *(workspace)* Convert pnpm workspace protocol to npm workspace syntax by [@cjpillsbury](https://github.com/cjpillsbury)
- Resolve TypeScript build errors across packages by [@cjpillsbury](https://github.com/cjpillsbury)
- *(workspace)* Correct build:libs command to use explicit package names by [@cjpillsbury](https://github.com/cjpillsbury)
- *(typescript)* Resolve declaration file generation for rollup packages ([#1](https://github.com/videojs/v10/pull/1)) by [@cjpillsbury](https://github.com/cjpillsbury)
- Resolve package dependency and TypeScript export issues by [@cjpillsbury](https://github.com/cjpillsbury)
- Resolve @open-wc/context-protocol module resolution issues by [@cjpillsbury](https://github.com/cjpillsbury)
- Refactor private fields to public with underscore convention by [@cjpillsbury](https://github.com/cjpillsbury)
- Clean up more typescript errors. by [@cjpillsbury](https://github.com/cjpillsbury)
- *(media)* Use explicit exports to resolve React package TypeScript errors by [@cjpillsbury](https://github.com/cjpillsbury)
- *(media-store)* Resolve TypeScript error in dispatch method by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react)* Implement proper HTML boolean data attributes for components by [@cjpillsbury](https://github.com/cjpillsbury)
- *(media-store)* Resolve TypeScript declaration generation build issues by [@cjpillsbury](https://github.com/cjpillsbury)
- *(media-store)* Replace tsup with rollup for consistent build tooling by [@cjpillsbury](https://github.com/cjpillsbury)
- *(icons)* Add currentColor fill to fullscreen icons for proper theming by [@cjpillsbury](https://github.com/cjpillsbury)
- *(time-display)* Clean up time utilities and simplify components by [@cjpillsbury](https://github.com/cjpillsbury)
- Seek jump back to current time ([#22](https://github.com/videojs/v10/pull/22)) by [@luwes](https://github.com/luwes)
- Add missing prettier plugin (remove later) by [@sampotts](https://github.com/sampotts)
- Skin exports/imports by [@sampotts](https://github.com/sampotts)
- *(ui)* Revert style testing change by [@sampotts](https://github.com/sampotts)
- React version mismatch, add forward refs by [@luwes](https://github.com/luwes)
- Rename attributes to kebab-case by [@luwes](https://github.com/luwes)
- Enable eslint & run eslint:fix ([#43](https://github.com/videojs/v10/pull/43)) by [@luwes](https://github.com/luwes)
- Design tweaks to toasted skin, lint rule tweaks ([#44](https://github.com/videojs/v10/pull/44)) by [@sampotts](https://github.com/sampotts)
- Skin syntax usage cleanup ([#48](https://github.com/videojs/v10/pull/48)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(ui)* Tone down text shadow on toasted skin ([#54](https://github.com/videojs/v10/pull/54)) by [@sampotts](https://github.com/sampotts)
- Tooltip syntax error & remove restMs by [@luwes](https://github.com/luwes)
- *(website)* More consistent marquee speed + loop by [@decepulis](https://github.com/decepulis)
- *(website)* Align home page controls on mobile by [@decepulis](https://github.com/decepulis)
- Minimal volume slider bug & fix dev infinite bug ([#73](https://github.com/videojs/v10/pull/73)) by [@luwes](https://github.com/luwes)
- *(website)* Resolve Safari hydration error by [@decepulis](https://github.com/decepulis)
- *(website)* Footer link highlight scoping by [@decepulis](https://github.com/decepulis)
- *(website)* Mobile optimizations by [@decepulis](https://github.com/decepulis)
- *(website)* Lighter text in dark mode by [@decepulis](https://github.com/decepulis)
- *(website)* Turborepo cache vercel output ([#118](https://github.com/videojs/v10/pull/118)) by [@decepulis](https://github.com/decepulis)
- *(root)* Add videojs keyword to package.json by [@luwes](https://github.com/luwes)

### 💼 Other
- Refactor(html): implement hook-style component architecture for PlayButton and MuteButton by [@cjpillsbury](https://github.com/cjpillsbury)
- Removing react-native. Aiming for 18.x react dependencies cross-workspace to avoid bugs. ([#49](https://github.com/videojs/v10/pull/49)) by [@cjpillsbury](https://github.com/cjpillsbury)

### 🚜 Refactor
- Convert React Native packages to stubs and fix remaining build issues by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react)* Replace tsup with rollup for proper CSS modules support by [@cjpillsbury](https://github.com/cjpillsbury)
- Migrate key packages from tsup to rollup for build consistency by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react)* Consolidate MuteButton components into unified implementation by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react)* Continue with component hooks rearchitecture. by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react)* Implement hooks-based PlayButton architecture by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react)* Create shared component factory for reusable architecture by [@cjpillsbury](https://github.com/cjpillsbury)
- *(html)* Implement hook-style component architecture for PlayButton and MuteButton (gradual migration to more shareable with React). by [@cjpillsbury](https://github.com/cjpillsbury)
- Standardize state property names across core, HTML, and React packages by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react)* Implement hook-style component architecture for PlayButton by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react,html)* Implement hook-style component architecture for MuteButton by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react,html)* Implement hook-style component architecture for MuteButton by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react,html)* Update PlayButton to use centralized state definitions by [@cjpillsbury](https://github.com/cjpillsbury)
- *(core,react,html)* Migrate component state definitions to core media-store by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react)* Consolidate Video component into single module by [@cjpillsbury](https://github.com/cjpillsbury)
- *(react)* Restructure VolumeRange to use render function pattern by [@cjpillsbury](https://github.com/cjpillsbury)
- *(html)* Update VolumeRange to use handleEvent pattern for consistency by [@cjpillsbury](https://github.com/cjpillsbury)
- *(media-store)* Replace mediaEvents with stateOwnersUpdateHandlers pattern by [@cjpillsbury](https://github.com/cjpillsbury)
- *(media-store)* Add container state owner and rename event types by [@cjpillsbury](https://github.com/cjpillsbury)
- *(html)* Remove temporary fullscreen test code from play button by [@cjpillsbury](https://github.com/cjpillsbury)
- Move time formatting logic to platform components by [@cjpillsbury](https://github.com/cjpillsbury)
- Rename formatDuration to formatDisplayTime by [@cjpillsbury](https://github.com/cjpillsbury)
- Remove container radius from the skin by [@sampotts](https://github.com/sampotts)

### 📚 Documentation
- Architecture docs ([#51](https://github.com/videojs/v10/pull/51)) by [@cjpillsbury](https://github.com/cjpillsbury)
- Architecture docs v2 ([#55](https://github.com/videojs/v10/pull/55)) by [@cjpillsbury](https://github.com/cjpillsbury)
- Readmes v0 ([#72](https://github.com/videojs/v10/pull/72)) by [@cjpillsbury](https://github.com/cjpillsbury)

### 🎨 Styling
- *(react-demo)* Clean up code formatting and video source organization by [@cjpillsbury](https://github.com/cjpillsbury)
- Add visual styling to time display components by [@cjpillsbury](https://github.com/cjpillsbury)

### ⚙️ Miscellaneous Tasks
- Remove debug console.log statements and fix TypeScript declarations by [@cjpillsbury](https://github.com/cjpillsbury)
- Add todo code comments. by [@cjpillsbury](https://github.com/cjpillsbury)
- Add todo code comments. by [@cjpillsbury](https://github.com/cjpillsbury)
- Remove range css from skins for now. by [@cjpillsbury](https://github.com/cjpillsbury)
- Swapping out m3u8 example asset for react demo. by [@cjpillsbury](https://github.com/cjpillsbury)
- Remove accidentally committed .playwright-mcp files by [@cjpillsbury](https://github.com/cjpillsbury)
- Add .playwright-mcp to .gitignore by [@cjpillsbury](https://github.com/cjpillsbury)
- Add prettier by [@mihar-22](https://github.com/mihar-22)
- Npm -> pnpm by [@mihar-22](https://github.com/mihar-22)
- New builds & types using tsdown ([#20](https://github.com/videojs/v10/pull/20)) by [@mihar-22](https://github.com/mihar-22)
- Gitignore cleanup ([#21](https://github.com/videojs/v10/pull/21)) by [@mihar-22](https://github.com/mihar-22)
- Add linting config by [@sampotts](https://github.com/sampotts)
- Cleanup demo config ([#28](https://github.com/videojs/v10/pull/28)) by [@mihar-22](https://github.com/mihar-22)
- Remove use-node-version, Vercel deployment by [@luwes](https://github.com/luwes)
- Add generate:icons to build dependsOn by [@luwes](https://github.com/luwes)
- Copy update to trigger a deploy ([#39](https://github.com/videojs/v10/pull/39)) by [@sampotts](https://github.com/sampotts)
- Website tooling ([#41](https://github.com/videojs/v10/pull/41)) by [@decepulis](https://github.com/decepulis)
- Consistent formatting ([#47](https://github.com/videojs/v10/pull/47)) by [@cjpillsbury](https://github.com/cjpillsbury)
- Fix dup React versions by [@luwes](https://github.com/luwes)
- Resolve alias during build ([#56](https://github.com/videojs/v10/pull/56)) by [@mihar-22](https://github.com/mihar-22)
- `__dirname` not defined  ([#57](https://github.com/videojs/v10/pull/57)) by [@mihar-22](https://github.com/mihar-22)
- Rename skins, minor style tweaks ([#61](https://github.com/videojs/v10/pull/61)) by [@sampotts](https://github.com/sampotts)
- *(website)* Error and artifact cleanup by [@decepulis](https://github.com/decepulis)
- Add CI build workflow by [@luwes](https://github.com/luwes)
- Fix html-demo not importing skin ([#127](https://github.com/videojs/v10/pull/127)) by [@mihar-22](https://github.com/mihar-22)
- *(root)* Add commitlint ([#129](https://github.com/videojs/v10/pull/129)) by [@mihar-22](https://github.com/mihar-22)
- *(cd)* Add release-please workflow ([#128](https://github.com/videojs/v10/pull/128)) by [@luwes](https://github.com/luwes)
- *(cd)* Add if statement to pnpm by [@luwes](https://github.com/luwes)

### New Contributors
* @github-actions[bot] made their first contribution in [#130](https://github.com/videojs/v10/pull/130)
* @luwes made their first contribution
* @mihar-22 made their first contribution in [#129](https://github.com/videojs/v10/pull/129)
* @sampotts made their first contribution in [#126](https://github.com/videojs/v10/pull/126)
* @cjpillsbury made their first contribution in [#125](https://github.com/videojs/v10/pull/125)
* @decepulis made their first contribution in [#118](https://github.com/videojs/v10/pull/118)
* @heff made their first contribution

[@videojs/core@10.0.1]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0...@videojs/core@10.0.1
[@videojs/core@10.0.0]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-rc.5...@videojs/core@10.0.0
[@videojs/core@10.0.0-rc.5]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-rc.4...@videojs/core@10.0.0-rc.5
[@videojs/core@10.0.0-rc.4]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-rc.3...@videojs/core@10.0.0-rc.4
[@videojs/core@10.0.0-rc.3]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-rc.2...@videojs/core@10.0.0-rc.3
[@videojs/core@10.0.0-rc.2]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-rc.1...@videojs/core@10.0.0-rc.2
[@videojs/core@10.0.0-rc.1]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.32...@videojs/core@10.0.0-rc.1
[@videojs/core@10.0.0-beta.32]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.31...@videojs/core@10.0.0-beta.32
[@videojs/core@10.0.0-beta.31]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.30...@videojs/core@10.0.0-beta.31
[@videojs/core@10.0.0-beta.30]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.29...@videojs/core@10.0.0-beta.30
[@videojs/core@10.0.0-beta.29]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.28...@videojs/core@10.0.0-beta.29
[@videojs/core@10.0.0-beta.28]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.27...@videojs/core@10.0.0-beta.28
[@videojs/core@10.0.0-beta.27]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.26...@videojs/core@10.0.0-beta.27
[@videojs/core@10.0.0-beta.26]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.25...@videojs/core@10.0.0-beta.26
[@videojs/core@10.0.0-beta.25]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.24...@videojs/core@10.0.0-beta.25
[@videojs/core@10.0.0-beta.24]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.23...@videojs/core@10.0.0-beta.24
[@videojs/core@10.0.0-beta.23]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.22...@videojs/core@10.0.0-beta.23
[@videojs/core@10.0.0-beta.22]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.21...@videojs/core@10.0.0-beta.22
[@videojs/core@10.0.0-beta.21]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.20...@videojs/core@10.0.0-beta.21
[@videojs/core@10.0.0-beta.20]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.19...@videojs/core@10.0.0-beta.20
[@videojs/core@10.0.0-beta.19]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.18...@videojs/core@10.0.0-beta.19
[@videojs/core@10.0.0-beta.18]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.17...@videojs/core@10.0.0-beta.18
[@videojs/core@10.0.0-beta.17]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.16...@videojs/core@10.0.0-beta.17
[@videojs/core@10.0.0-beta.16]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.15...@videojs/core@10.0.0-beta.16
[@videojs/core@10.0.0-beta.15]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.14...@videojs/core@10.0.0-beta.15
[@videojs/core@10.0.0-beta.14]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.13...@videojs/core@10.0.0-beta.14
[@videojs/core@10.0.0-beta.13]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.12...@videojs/core@10.0.0-beta.13
[@videojs/core@10.0.0-beta.12]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.11...@videojs/core@10.0.0-beta.12
[@videojs/core@10.0.0-beta.11]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.10...@videojs/core@10.0.0-beta.11
[@videojs/core@10.0.0-beta.10]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.9...@videojs/core@10.0.0-beta.10
[@videojs/core@10.0.0-beta.9]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.8...@videojs/core@10.0.0-beta.9
[@videojs/core@10.0.0-beta.8]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.7...@videojs/core@10.0.0-beta.8
[@videojs/core@10.0.0-beta.7]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.6...@videojs/core@10.0.0-beta.7
[@videojs/core@10.0.0-beta.6]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.5...@videojs/core@10.0.0-beta.6
[@videojs/core@10.0.0-beta.5]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.4...@videojs/core@10.0.0-beta.5
[@videojs/core@10.0.0-beta.4]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.3...@videojs/core@10.0.0-beta.4
[@videojs/core@10.0.0-beta.3]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.2...@videojs/core@10.0.0-beta.3
[@videojs/core@10.0.0-beta.2]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-beta.1...@videojs/core@10.0.0-beta.2
[@videojs/core@10.0.0-beta.1]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.11...@videojs/core@10.0.0-beta.1
[@videojs/core@10.0.0-alpha.11]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.10...@videojs/core@10.0.0-alpha.11
[@videojs/core@10.0.0-alpha.10]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.9...@videojs/core@10.0.0-alpha.10
[@videojs/core@10.0.0-alpha.9]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.8...@videojs/core@10.0.0-alpha.9
[@videojs/core@10.0.0-alpha.8]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.7...@videojs/core@10.0.0-alpha.8
[@videojs/core@10.0.0-alpha.7]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.6...@videojs/core@10.0.0-alpha.7
[@videojs/core@10.0.0-alpha.6]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.5...@videojs/core@10.0.0-alpha.6
[@videojs/core@10.0.0-alpha.5]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.4...@videojs/core@10.0.0-alpha.5
[@videojs/core@10.0.0-alpha.4]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.3...@videojs/core@10.0.0-alpha.4
[@videojs/core@10.0.0-alpha.3]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.2...@videojs/core@10.0.0-alpha.3
[@videojs/core@10.0.0-alpha.2]: https://github.com/videojs/v10/compare/@videojs/core@10.0.0-alpha.1...@videojs/core@10.0.0-alpha.2
[@videojs/core@10.0.0-alpha.1]: https://github.com/videojs/v10/compare/@videojs/core@0.1.0-preview.10...@videojs/core@10.0.0-alpha.1
[@videojs/core@0.1.0-preview.10]: https://github.com/videojs/v10/compare/@videojs/core@0.1.0-preview.9...@videojs/core@0.1.0-preview.10
[@videojs/core@0.1.0-preview.9]: https://github.com/videojs/v10/compare/@videojs/core@0.1.0-preview.8...@videojs/core@0.1.0-preview.9
[@videojs/core@0.1.0-preview.8]: https://github.com/videojs/v10/compare/@videojs/core@0.1.0-preview.7...@videojs/core@0.1.0-preview.8
[@videojs/core@0.1.0-preview.7]: https://github.com/videojs/v10/compare/@videojs/core@0.1.0-preview.6...@videojs/core@0.1.0-preview.7
[@videojs/core@0.1.0-preview.6]: https://github.com/videojs/v10/compare/@videojs/core@0.1.0-preview.5...@videojs/core@0.1.0-preview.6
[@videojs/core@0.1.0-preview.5]: https://github.com/videojs/v10/compare/@videojs/core@0.1.0-preview.4...@videojs/core@0.1.0-preview.5
[@videojs/core@0.1.0-preview.4]: https://github.com/videojs/v10/compare/@videojs/core@0.1.0-preview.3...@videojs/core@0.1.0-preview.4
[@videojs/core@0.1.0-preview.3]: https://github.com/videojs/v10/compare/@videojs/core@0.1.0-preview.2...@videojs/core@0.1.0-preview.3
[@videojs/core@0.1.0-preview.2]: https://github.com/videojs/v10/compare/@videojs/core@0.1.0-preview.1...@videojs/core@0.1.0-preview.2

# Video.js 8 and earlier

Releases from 6.0.0 are generated from the [8.x branch](https://github.com/videojs/video.js/tree/8.x), where Video.js 8 is maintained.
Earlier releases predate conventional commits and keep their hand-written notes.

## [8.24.2] - 2026-10-06

### 🐛 Bug Fixes
- Ran npm audit fix on npm 6 ([#9231](https://github.com/videojs/video.js/pull/9231)) by [@spuppo-mux](https://github.com/spuppo-mux)
- Update node, replace access-sniff with pa11y and override underscore  ([#9232](https://github.com/videojs/video.js/pull/9232)) by [@spuppo-mux](https://github.com/spuppo-mux)

### ⚙️ Miscellaneous Tasks
- Run v8 workflows only for the 8.x branch ([#9244](https://github.com/videojs/video.js/pull/9244)) by [@luwes](https://github.com/luwes)

### New Contributors
* @luwes made their first contribution
* @spuppo-mux made their first contribution in [#9232](https://github.com/videojs/video.js/pull/9232)

## [8.24.1] - 2026-09-10

### ⚙️ Miscellaneous Tasks
- *(package)* Update @xmldom/xmldom to 0.8.15 ([#9230](https://github.com/videojs/video.js/pull/9230)) by [@Essk](https://github.com/Essk)

## [8.24.0] - 2026-08-03

### 🚀 Features
- *(poster)* Add support for marking player as maincontent ([#9173](https://github.com/videojs/video.js/pull/9173)) by [@kontrollanten](https://github.com/kontrollanten)

### 🐛 Bug Fixes
- Focus the play toggle instead of the tech element on Edge to avoid a black frame with hardware-accelerated protected playback ([#9217](https://github.com/videojs/video.js/pull/9217)) by [@BCovePW](https://github.com/BCovePW)
- *(lang)* Update nn (Norwegian Nynorsk) translations ([#9208](https://github.com/videojs/video.js/pull/9208)) by [@arvindfroi](https://github.com/arvindfroi)
- *(lang)* Add missing Japanese (ja) translation for "Playing in Picture-in-Picture" ([#9209](https://github.com/videojs/video.js/pull/9209)) by [@mahirhir](https://github.com/mahirhir)

### 📚 Documentation
- *(types)* Document Player.error(null) for clearing MediaError ([#9174](https://github.com/videojs/video.js/pull/9174)) by [@CyberVy](https://github.com/CyberVy)
- Point Quick Start zencdn links at hosted 8.23.6 ([#9215](https://github.com/videojs/video.js/pull/9215)) by [@Hashim1999164](https://github.com/Hashim1999164)

### New Contributors
* @Hashim1999164 made their first contribution in [#9215](https://github.com/videojs/video.js/pull/9215)
* @mahirhir made their first contribution in [#9209](https://github.com/videojs/video.js/pull/9209)
* @arvindfroi made their first contribution in [#9208](https://github.com/videojs/video.js/pull/9208)
* @BCovePW made their first contribution in [#9217](https://github.com/videojs/video.js/pull/9217)
* @CyberVy made their first contribution in [#9174](https://github.com/videojs/video.js/pull/9174)

## [8.23.9] - 2026-06-19

### 🐛 Bug Fixes
- *(audio-tracks)* Missing AD icon in Safari ([#9153](https://github.com/videojs/video.js/pull/9153)) by [@amtins](https://github.com/amtins)
- *(types)* 'Cannot find name Player' error in type generation ([#9162](https://github.com/videojs/video.js/pull/9162)) by [@amtins](https://github.com/amtins)
- *(track-button)* Properly remove event listeners on dispose to prevent leaks and runtime errors ([#9101](https://github.com/videojs/video.js/pull/9101)) by [@nochev](https://github.com/nochev)
- *(player)* Strip stale layout class when breakpoints() is re-set ([#9205](https://github.com/videojs/video.js/pull/9205)) by [@Essk](https://github.com/Essk)

### ⚙️ Miscellaneous Tasks
- Update @videojs/http-streaming to 3.17.5, vhs-utils to 4.1.2, mpd-parser to 1.4.0 by [@Essk](https://github.com/Essk)

### New Contributors
* @nochev made their first contribution in [#9101](https://github.com/videojs/video.js/pull/9101)

## [8.23.8] - 2026-02-11

### ⚙️ Miscellaneous Tasks
- Convert PR title action to module ([#9152](https://github.com/videojs/video.js/pull/9152)) by [@mister-ben](https://github.com/mister-ben)
- *(package)* Update vhs to 3.17.4 ([#9151](https://github.com/videojs/video.js/pull/9151)) by [@Essk](https://github.com/Essk)

## [8.23.7] - 2026-02-05

### 🐛 Bug Fixes
- Prevent current time display showing 0:00 during seek ([#9135](https://github.com/videojs/video.js/pull/9135)) by [@mister-ben](https://github.com/mister-ben)
- Broken menu button setIcon type ([#9089](https://github.com/videojs/video.js/pull/9089)) by [@Chocobozzz](https://github.com/Chocobozzz)
- Allow use in jsdom environments without `window.CSS` ([#9137](https://github.com/videojs/video.js/pull/9137)) by [@jdufresne](https://github.com/jdufresne)
- Convert Tracklist length to a getter and fix event docs ([#9142](https://github.com/videojs/video.js/pull/9142)) by [@christriants](https://github.com/christriants)
- *(lang)* Improve finnish lang support ([#9114](https://github.com/videojs/video.js/pull/9114)) by [@greeho](https://github.com/greeho)
- *(lang)* Updated translations for gl ([#9026](https://github.com/videojs/video.js/pull/9026)) by [@xuars](https://github.com/xuars)

### 📚 Documentation
- Clarify copyright and project stewardship ([#9104](https://github.com/videojs/video.js/pull/9104)) by [@heff](https://github.com/heff)

### ⚙️ Miscellaneous Tasks
- Remove npm token from GHA release.yml to test trusted publisher workflow without it ([#9121](https://github.com/videojs/video.js/pull/9121)) by [@cjpillsbury](https://github.com/cjpillsbury)
- Update prod dependencies ([#9129](https://github.com/videojs/video.js/pull/9129)) by [@mister-ben](https://github.com/mister-ben)
- Tags and version changes into main ([#9123](https://github.com/videojs/video.js/pull/9123)) by [@cjpillsbury](https://github.com/cjpillsbury)
- *(package)* Update vhs to v3.17.3 ([#9147](https://github.com/videojs/video.js/pull/9147)) by [@Essk](https://github.com/Essk)

### New Contributors
* @cjpillsbury made their first contribution in [#9123](https://github.com/videojs/video.js/pull/9123)
* @xuars made their first contribution in [#9026](https://github.com/videojs/video.js/pull/9026)
* @greeho made their first contribution in [#9114](https://github.com/videojs/video.js/pull/9114)
* @christriants made their first contribution in [#9142](https://github.com/videojs/video.js/pull/9142)

## [8.23.6] - 2025-11-14

### 🐛 Bug Fixes
- Revert minor change to test trusted publishing workflow e2e sans npm token in release.yml

## [8.23.5] - 2025-11-14

### 🐛 Bug Fixes
- Minor change to test trusted publishing workflow e2e

### 📚 Documentation
- Clarify copyright and project stewardship ([#9104](https://github.com/videojs/video.js/issues/9104))

## [8.23.4] - 2025-08-01

### 🐛 Bug Fixes
- Component.js string arg type for for removeChild ([#9070](https://github.com/videojs/video.js/pull/9070)) by [@dds05](https://github.com/dds05)

### 📚 Documentation
- Update README.md w/ v10 news link ([#9037](https://github.com/videojs/video.js/pull/9037)) by [@heff](https://github.com/heff)

### ⚙️ Miscellaneous Tasks
- *(package)* Update VHS to v3.17.2 ([#9079](https://github.com/videojs/video.js/pull/9079)) by [@Essk](https://github.com/Essk)

### New Contributors
* @dds05 made their first contribution in [#9070](https://github.com/videojs/video.js/pull/9070)

## [8.23.3] - 2025-04-16

### 🐛 Bug Fixes
- Update release workflow `discussion` permission ([#9031](https://github.com/videojs/video.js/pull/9031)) by [@Essk](https://github.com/Essk)

## [8.23.2] - 2025-04-16

### 🐛 Bug Fixes
- Update release workfow permissions ([#9027](https://github.com/videojs/video.js/pull/9027)) by [@Essk](https://github.com/Essk)

## [8.23.1] - 2025-04-15

### 🐛 Bug Fixes
- ControlText for text track modal ([#8989](https://github.com/videojs/video.js/pull/8989)) by [@adrums86](https://github.com/adrums86)
- Only change focus from BPB if not tap or mouse click ([#9015](https://github.com/videojs/video.js/pull/9015)) by [@Frenzie](https://github.com/Frenzie)
- Update text-track-cue styles on useractive ([#9023](https://github.com/videojs/video.js/pull/9023)) by [@tsi](https://github.com/tsi)

### New Contributors
* @ashimupd made their first contribution in [#8986](https://github.com/videojs/video.js/pull/8986)
* @Frenzie made their first contribution in [#9015](https://github.com/videojs/video.js/pull/9015)

## [8.23.0] - 2025-03-11

### 🚀 Features
- ToJSON methods for text track serialization ([#8998](https://github.com/videojs/video.js/pull/8998)) by [@wseymour15](https://github.com/wseymour15)
- Improve SmartTV scrubbing behavior ([#8988](https://github.com/videojs/video.js/pull/8988)) by [@bzizmo](https://github.com/bzizmo)

### 🐛 Bug Fixes
- Improve getFileExtension() readability and handle leading dot extensions. ([#8980](https://github.com/videojs/video.js/pull/8980)) by [@damanV5](https://github.com/damanV5)

### 🚜 Refactor
- *(types)* Track and track list types generation ([#8978](https://github.com/videojs/video.js/pull/8978)) by [@amtins](https://github.com/amtins)

### New Contributors
* @damanV5 made their first contribution in [#8980](https://github.com/videojs/video.js/pull/8980)

## [8.22.0] - 2025-02-05

### 🚀 Features
- Make seek bar keyboard skip increment configurable ([#8919](https://github.com/videojs/video.js/pull/8919)) by [@mister-ben](https://github.com/mister-ben)
- *(package)* Update to @videojs/http-streaming v3.17.0 ([#8976](https://github.com/videojs/video.js/pull/8976)) by [@alex-barstow](https://github.com/alex-barstow)

### 🐛 Bug Fixes
- Registering new player component ([#8932](https://github.com/videojs/video.js/pull/8932)) by [@victordidenko](https://github.com/victordidenko)
- Hide mouse tooltip on touch devices when not scrubbing ([#8945](https://github.com/videojs/video.js/pull/8945)) by [@phloxic](https://github.com/phloxic)

### ⚙️ Miscellaneous Tasks
- Enable supply chain security through npm provenance attestation ([#8911](https://github.com/videojs/video.js/pull/8911)) by [@pupapaik](https://github.com/pupapaik)
- Update sass and change colour syntax ([#8894](https://github.com/videojs/video.js/pull/8894)) by [@mister-ben](https://github.com/mister-ben)

### New Contributors
* @pupapaik made their first contribution in [#8911](https://github.com/videojs/video.js/pull/8911)
* @victordidenko made their first contribution in [#8932](https://github.com/videojs/video.js/pull/8932)

## [8.21.1] - 2024-12-05

### ⚙️ Miscellaneous Tasks
- *(lang)* Update zh-TW translations ([#8929](https://github.com/videojs/video.js/pull/8929)) by [@SimonAllen0901](https://github.com/SimonAllen0901)
- Update Occitan locale file ([#8927](https://github.com/videojs/video.js/pull/8927)) by [@Mejans](https://github.com/Mejans)

### New Contributors
* @Mejans made their first contribution in [#8927](https://github.com/videojs/video.js/pull/8927)

## [8.21.0] - 2024-12-05

### 🚀 Features
- Add option to disable seeking while scrubbing on mobile ([#8903](https://github.com/videojs/video.js/pull/8903)) by [@alex-barstow](https://github.com/alex-barstow)

### 🐛 Bug Fixes
- Update vhs version ([#8930](https://github.com/videojs/video.js/pull/8930)) by [@dzianis-dashkevich](https://github.com/dzianis-dashkevich)

### ⚙️ Miscellaneous Tasks
- Update VHS version ([#8933](https://github.com/videojs/video.js/pull/8933)) by [@harisha-swaminathan](https://github.com/harisha-swaminathan)

## [8.20.0] - 2024-11-19

### ⚙️ Miscellaneous Tasks
- Correct changelog for 8.19.2 ([#8918](https://github.com/videojs/video.js/pull/8918)) by [@mister-ben](https://github.com/mister-ben)
- *(package)* Update @videojs/http-streaming to 3.16.0 ([#8921](https://github.com/videojs/video.js/pull/8921)) by [@alex-barstow](https://github.com/alex-barstow)

## [8.19.2] - 2024-11-14

### 🐛 Bug Fixes
- *(text-track-settings)* Localization not correctly applied ([#8904](https://github.com/videojs/video.js/pull/8904)) by [@amtins](https://github.com/amtins)
- Fix Escape handling in menus  ([#8916](https://github.com/videojs/video.js/pull/8916)) by [@mister-ben](https://github.com/mister-ben)
- Change http to https in examples ([#8905](https://github.com/videojs/video.js/pull/8905))

## [8.19.1] - 2024-10-10

### ⚙️ Miscellaneous Tasks
- Update mpd-parser to v1.3.1 ([#8888](https://github.com/videojs/video.js/pull/8888)) by [@wseymour15](https://github.com/wseymour15)
- *(package)* Update http-streaming to v3.15.0 ([#8889](https://github.com/videojs/video.js/pull/8889)) by [@wseymour15](https://github.com/wseymour15)

## [8.19.0] - 2024-10-09

### 🚀 Features
- Add methods to add and remove <source> elements ([#8886](https://github.com/videojs/video.js/pull/8886)) by [@alex-barstow](https://github.com/alex-barstow)

### 🐛 Bug Fixes
- Don't request fullscreen from document PIP window ([#8881](https://github.com/videojs/video.js/pull/8881)) by [@mister-ben](https://github.com/mister-ben)

## [8.18.1] - 2024-09-17

### ⚙️ Miscellaneous Tasks
- *(package)* Update to VHS v3.14.2 ([#8869](https://github.com/videojs/video.js/pull/8869)) by [@Essk](https://github.com/Essk)

## [8.18.0] - 2024-09-10

### 🚀 Features
- Add class to normalise time control display ([#8833](https://github.com/videojs/video.js/pull/8833)) by [@mister-ben](https://github.com/mister-ben)

### 🐛 Bug Fixes
- Check for closeable() before calling in spatialnavigation ([#8832](https://github.com/videojs/video.js/pull/8832)) by [@mister-ben](https://github.com/mister-ben)
- *(lang)* Update el.json ([#8848](https://github.com/videojs/video.js/pull/8848)) by [@manosvelivasakis](https://github.com/manosvelivasakis)
- Update VHS to v3.14.1 ([#8860](https://github.com/videojs/video.js/pull/8860)) by [@adrums86](https://github.com/adrums86)

### ⚙️ Miscellaneous Tasks
- Update version number in readme on release ([#8840](https://github.com/videojs/video.js/pull/8840)) by [@mister-ben](https://github.com/mister-ben)
- Update VHS to 3.14.0, and its dependencies ([#8839](https://github.com/videojs/video.js/pull/8839)) by [@mister-ben](https://github.com/mister-ben)

### New Contributors
* @manosvelivasakis made their first contribution in [#8848](https://github.com/videojs/video.js/pull/8848)

## [8.17.4] - 2024-08-27

### 🐛 Bug Fixes
- *(types)* Add has|usingPlugin to typedef by adding stubs which are removed from builds ([#8811](https://github.com/videojs/video.js/pull/8811)) by [@mister-ben](https://github.com/mister-ben)
- Change requestNamedAnimationFrame to apply last change per frame instead of first ([#8799](https://github.com/videojs/video.js/pull/8799)) by [@mister-ben](https://github.com/mister-ben)
- *(types)* Ensure toggleClass's second arg is optional ([#8829](https://github.com/videojs/video.js/pull/8829)) by [@mister-ben](https://github.com/mister-ben)
- Ensure spatial navigation starts without error without an ErrorD… ([#8830](https://github.com/videojs/video.js/pull/8830)) by [@mister-ben](https://github.com/mister-ben)
- Allow captions in devices that use old chrome to be shown ([#8826](https://github.com/videojs/video.js/pull/8826)) by [@CarlosVillasenor](https://github.com/CarlosVillasenor)
- Use backup styles when inset is not supported ([#8844](https://github.com/videojs/video.js/pull/8844)) by [@CarlosVillasenor](https://github.com/CarlosVillasenor)

### 🚜 Refactor
- Reorder SASS styles to address deprecation ([#8821](https://github.com/videojs/video.js/pull/8821)) by [@mister-ben](https://github.com/mister-ben)

### 📚 Documentation
- Refresh README.md and point other docs to admin repo ([#8837](https://github.com/videojs/video.js/pull/8837)) by [@misteroneill](https://github.com/misteroneill)

### ⚙️ Miscellaneous Tasks
- Remove safe-json-parse ([#8790](https://github.com/videojs/video.js/pull/8790)) by [@mister-ben](https://github.com/mister-ben)
- Update http-streaming to v3.13.3 ([#8827](https://github.com/videojs/video.js/pull/8827)) by [@wseymour15](https://github.com/wseymour15)

## [8.17.3] - 2024-07-30

### 🐛 Bug Fixes
- Refactor evented to make mincompatable with Chrome 53 ([#8810](https://github.com/videojs/video.js/pull/8810)) by [@mister-ben](https://github.com/mister-ben)
- Listen to taps on track controls ([#8809](https://github.com/videojs/video.js/pull/8809)) by [@mister-ben](https://github.com/mister-ben)
- *(spatial-navigation)* Keep navigation going when player has an error ([#8805](https://github.com/videojs/video.js/pull/8805)) by [@CarlosVillasenor](https://github.com/CarlosVillasenor)
- *(spatial-navigation)* Focus lost in error modal ([#8817](https://github.com/videojs/video.js/pull/8817)) by [@CarlosVillasenor](https://github.com/CarlosVillasenor)
- *(spatial-navigation)* Refocus available also to the close button of the error modal ([#8819](https://github.com/videojs/video.js/pull/8819)) by [@CarlosVillasenor](https://github.com/CarlosVillasenor)

## [8.17.2] - 2024-07-22

### ⚙️ Miscellaneous Tasks
- Update vhs version 3.13.2 ([#8812](https://github.com/videojs/video.js/pull/8812)) by [@dzianis-dashkevich](https://github.com/dzianis-dashkevich)

## [8.17.1] - 2024-07-15

### 🐛 Bug Fixes
- Ensure transient button event listeners are removed on dispose ([#8796](https://github.com/videojs/video.js/pull/8796)) by [@mister-ben](https://github.com/mister-ben)

## [8.17.0] - 2024-07-10

### 🚀 Features
- Adds a transient button component ([#8629](https://github.com/videojs/video.js/pull/8629)) by [@mister-ben](https://github.com/mister-ben)

### 🐛 Bug Fixes
- Apply correct styles to audio descriptions track menu items  ([#8770](https://github.com/videojs/video.js/pull/8770)) by [@david-hm-morgan](https://github.com/david-hm-morgan)
- *(middleware)* Cache grows even if no middleware created ([#8674](https://github.com/videojs/video.js/pull/8674)) by [@BrainCrumbz](https://github.com/BrainCrumbz)
- *(types)* Fix and improve component ready callback definition ([#8766](https://github.com/videojs/video.js/pull/8766)) by [@mister-ben](https://github.com/mister-ben)

### New Contributors
* @david-hm-morgan made their first contribution in [#8770](https://github.com/videojs/video.js/pull/8770)

## [8.16.1] - 2024-06-24

### 🐛 Bug Fixes
- Enable keyboard controls on menu items ([#8777](https://github.com/videojs/video.js/pull/8777)) by [@usmanonazim](https://github.com/usmanonazim)

### ⚙️ Miscellaneous Tasks
- Update typescript to 5.5.2 ([#8776](https://github.com/videojs/video.js/pull/8776)) by [@mister-ben](https://github.com/mister-ben)

## [8.16.0] - 2024-06-12

### 🚀 Features
- *(icons)* Update Twitter X logo ([#8764](https://github.com/videojs/video.js/pull/8764)) by [@bzizmo](https://github.com/bzizmo)

### 🐛 Bug Fixes
- Use guid to ensure uniqueness of track setting options ([#8762](https://github.com/videojs/video.js/pull/8762)) by [@mister-ben](https://github.com/mister-ben)
- Improve ts output for create logger ([#8763](https://github.com/videojs/video.js/pull/8763)) by [@mister-ben](https://github.com/mister-ben)
- Update to VHS v3.13.1 ([#8765](https://github.com/videojs/video.js/pull/8765)) by [@adrums86](https://github.com/adrums86)

## [8.15.0] - 2024-06-06

### 🚀 Features
- Update xhr ([#8757](https://github.com/videojs/video.js/pull/8757)) by [@dzianis-dashkevich](https://github.com/dzianis-dashkevich)

### 🐛 Bug Fixes
- Removes duplicate id in text track settings ([#8755](https://github.com/videojs/video.js/pull/8755)) by [@mister-ben](https://github.com/mister-ben)

## [8.14.1] - 2024-05-30

### 🐛 Bug Fixes
- *(docs)* Add workaround for ErrorMetadata typedef ([#8737](https://github.com/videojs/video.js/pull/8737)) by [@mister-ben](https://github.com/mister-ben)
- Remove Firefox warnings about deprecated event props ([#8736](https://github.com/videojs/video.js/pull/8736)) by [@mister-ben](https://github.com/mister-ben)
- *(lang)* Arabic translation grammar, spelling and vocabulary errors ([#8724](https://github.com/videojs/video.js/pull/8724)) by [@mohammadmansour200](https://github.com/mohammadmansour200)
- Lockfile for vhs v3.13.0 ([#8751](https://github.com/videojs/video.js/pull/8751)) by [@adrums86](https://github.com/adrums86)

### 🚜 Refactor
- Replace keycode dependency with event.key ([#8735](https://github.com/videojs/video.js/pull/8735)) by [@mister-ben](https://github.com/mister-ben)

### ⚙️ Miscellaneous Tasks
- Update VHS to v3.13.0 ([#8742](https://github.com/videojs/video.js/pull/8742)) by [@adrums86](https://github.com/adrums86)
- Update PR template ([#8750](https://github.com/videojs/video.js/pull/8750)) by [@mister-ben](https://github.com/mister-ben)
- Update karma dependenciess ([#8743](https://github.com/videojs/video.js/pull/8743)) by [@mister-ben](https://github.com/mister-ben)

### New Contributors
* @mohammadmansour200 made their first contribution in [#8724](https://github.com/videojs/video.js/pull/8724)

## [8.14.0] - 2024-05-06

### 🚀 Features
- Refactor error consts ([#8719](https://github.com/videojs/video.js/pull/8719)) by [@adrums86](https://github.com/adrums86)

### 🐛 Bug Fixes
- Support MacOS trackpad with tap-to-click ([#8700](https://github.com/videojs/video.js/pull/8700)) by [@mister-ben](https://github.com/mister-ben)
- Progress bar sometimes is not filled on 100% ([#8633](https://github.com/videojs/video.js/pull/8633)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- Prevent error for root shadow elements when restorEl is enabled ([#8679](https://github.com/videojs/video.js/pull/8679)) by [@jboix](https://github.com/jboix)
- *(player)* Adapt player height to control bar height in audioOnly mode ([#8579](https://github.com/videojs/video.js/pull/8579)) by [@amtins](https://github.com/amtins)
- *(dom)* Handle slotted parent transform position ([#8158](https://github.com/videojs/video.js/pull/8158)) by [@weiz18](https://github.com/weiz18)
- Ensure aria-labelledby values in track settings are valid ([#8711](https://github.com/videojs/video.js/pull/8711)) by [@mister-ben](https://github.com/mister-ben)

### 🚜 Refactor
- Use URL API ([#8716](https://github.com/videojs/video.js/pull/8716)) by [@mister-ben](https://github.com/mister-ben)

### ⚙️ Miscellaneous Tasks
- Remove plugin errors from error const ([#8706](https://github.com/videojs/video.js/pull/8706)) by [@wseymour15](https://github.com/wseymour15)
- *(css)* Fix typo in postcss-config browserslist and update list ([#8578](https://github.com/videojs/video.js/pull/8578)) by [@phloxic](https://github.com/phloxic)

### New Contributors
* @br0ll made their first contribution in [#8650](https://github.com/videojs/video.js/pull/8650)
* @phloxic made their first contribution in [#8578](https://github.com/videojs/video.js/pull/8578)
* @jboix made their first contribution in [#8679](https://github.com/videojs/video.js/pull/8679)

## [8.13.0] - 2024-04-22

### 🚀 Features
- Implement spatial navigation ([#8570](https://github.com/videojs/video.js/pull/8570)) by [@bzizmo](https://github.com/bzizmo)
- *(player)* Make 'searchForTrackSelect_' private & use 'el' as parameter in function 'getIsFocusable' ([#8697](https://github.com/videojs/video.js/pull/8697)) by [@CarlosVillasenor](https://github.com/CarlosVillasenor)

### 🐛 Bug Fixes
- Update vhs version ([#8704](https://github.com/videojs/video.js/pull/8704)) by [@dzianis-dashkevich](https://github.com/dzianis-dashkevich)

### New Contributors
* @bzizmo made their first contribution in [#8570](https://github.com/videojs/video.js/pull/8570)

## [8.12.0] - 2024-04-16

### 🚀 Features
- Add browser.IS_SMART_TV and class names for CSS targeting devices ([#8676](https://github.com/videojs/video.js/pull/8676)) by [@misteroneill](https://github.com/misteroneill)
- *(lang)* Add support for Marathi Language ([#8596](https://github.com/videojs/video.js/pull/8596)) by [@rajsfk7](https://github.com/rajsfk7)
- *(lang)* Added arabic seek button translations ([#8616](https://github.com/videojs/video.js/pull/8616)) by [@silevitas](https://github.com/silevitas)
- *(emulated-tracks)* Add class to force cues to be center aligned ([#8625](https://github.com/videojs/video.js/pull/8625)) by [@gkatsev](https://github.com/gkatsev)

### 🐛 Bug Fixes
- Add additional and remove unused error const ([#8656](https://github.com/videojs/video.js/pull/8656)) by [@adrums86](https://github.com/adrums86)
- Time tooltip truncated ([#8527](https://github.com/videojs/video.js/pull/8527)) by [@harisha-swaminathan](https://github.com/harisha-swaminathan)
- *(i18n)* Better Italian translation for "captions" ([#8513](https://github.com/videojs/video.js/pull/8513)) by [@bfabio](https://github.com/bfabio)
- *(build)* Use quoted dbl quotes to support Windows ([#8681](https://github.com/videojs/video.js/pull/8681)) by [@mister-ben](https://github.com/mister-ben)

### ⚙️ Miscellaneous Tasks
- Remove unused type.js file ([#8658](https://github.com/videojs/video.js/pull/8658)) by [@SimonAllen0901](https://github.com/SimonAllen0901)
- Update GitHub Actions version and remove xvfb ([#8682](https://github.com/videojs/video.js/pull/8682)) by [@mister-ben](https://github.com/mister-ben)
- Update VHS to v3.12.1 ([#8687](https://github.com/videojs/video.js/pull/8687)) by [@adrums86](https://github.com/adrums86)

### New Contributors
* @silevitas made their first contribution in [#8616](https://github.com/videojs/video.js/pull/8616)
* @SimonAllen0901 made their first contribution in [#8658](https://github.com/videojs/video.js/pull/8658)
* @bfabio made their first contribution in [#8513](https://github.com/videojs/video.js/pull/8513)
* @rajsfk7 made their first contribution in [#8596](https://github.com/videojs/video.js/pull/8596)

## [8.11.8] - 2024-03-12

### ⚙️ Miscellaneous Tasks
- Add contrib-eme errors ([#8634](https://github.com/videojs/video.js/pull/8634)) by [@adrums86](https://github.com/adrums86)
- Update VHS to v3.12.0 ([#8637](https://github.com/videojs/video.js/pull/8637)) by [@wseymour15](https://github.com/wseymour15)

## [8.11.7] - 2024-03-06

### 🐛 Bug Fixes
- Typo in error const ([#8628](https://github.com/videojs/video.js/pull/8628)) by [@wseymour15](https://github.com/wseymour15)

### ⚙️ Miscellaneous Tasks
- *(package)* Update quality-levels version ([#8630](https://github.com/videojs/video.js/pull/8630)) by [@dzianis-dashkevich](https://github.com/dzianis-dashkevich)

## [8.11.6] - 2024-03-04

### ⚙️ Miscellaneous Tasks
- Add action to validate PR titles ([#8614](https://github.com/videojs/video.js/pull/8614)) by [@mister-ben](https://github.com/mister-ben)
- Additional vjs ad errors ([#8623](https://github.com/videojs/video.js/pull/8623)) by [@wseymour15](https://github.com/wseymour15)

## [8.11.5] - 2024-02-28

### ⚙️ Miscellaneous Tasks
- Update vhs version ([#8621](https://github.com/videojs/video.js/pull/8621)) by [@dzianis-dashkevich](https://github.com/dzianis-dashkevich)

## [8.11.4] - 2024-02-21

### ⚙️ Miscellaneous Tasks
- Update vhs to 3.11.2 ([#8603](https://github.com/videojs/video.js/pull/8603)) by [@dzianis-dashkevich](https://github.com/dzianis-dashkevich)

## [8.11.3] - 2024-02-20

### ⚙️ Miscellaneous Tasks
- Update playbackRates jsdoc ([#8583](https://github.com/videojs/video.js/pull/8583)) by [@wseymour15](https://github.com/wseymour15)
- Update pip enter event with window metadata ([#8591](https://github.com/videojs/video.js/pull/8591)) by [@wseymour15](https://github.com/wseymour15)

## [8.11.2] - 2024-02-13

### 🐛 Bug Fixes
- Error-display ([#8529](https://github.com/videojs/video.js/pull/8529)) by [@harisha-swaminathan](https://github.com/harisha-swaminathan)

### ⚙️ Miscellaneous Tasks
- Update http-streaming to v3.11.1 ([#8584](https://github.com/videojs/video.js/pull/8584)) by [@alex-barstow](https://github.com/alex-barstow)

## [8.11.1] - 2024-01-29

### 🐛 Bug Fixes
- Browser util flagging smart TV as Safari ([#8566](https://github.com/videojs/video.js/pull/8566)) by [@adrums86](https://github.com/adrums86)

## [8.11.0] - 2024-01-25

### 🚀 Features
- Improved error interface ([#8564](https://github.com/videojs/video.js/pull/8564)) by [@wseymour15](https://github.com/wseymour15)

## [8.10.0] - 2024-01-17

### 🚀 Features
- Expose version from player.version() ([#8543](https://github.com/videojs/video.js/pull/8543)) by [@Svarozic](https://github.com/Svarozic)
- *(error)* Remove confusing decorative X from error display modal ([#8553](https://github.com/videojs/video.js/pull/8553)) by [@CarlosVillasenor](https://github.com/CarlosVillasenor)

### 🐛 Bug Fixes
- Fixes form markup in text track settings ([#8557](https://github.com/videojs/video.js/pull/8557)) by [@mister-ben](https://github.com/mister-ben)

### ⚙️ Miscellaneous Tasks
- Update to http-streaming v3.10.0 ([#8558](https://github.com/videojs/video.js/pull/8558)) by [@Essk](https://github.com/Essk)

### New Contributors
* @Essk made their first contribution
* @CarlosVillasenor made their first contribution in [#8553](https://github.com/videojs/video.js/pull/8553)
* @Svarozic made their first contribution in [#8543](https://github.com/videojs/video.js/pull/8543)

## [8.9.0] - 2024-01-02

### 🚀 Features
- Seek bar smooth seeking ([#8287](https://github.com/videojs/video.js/pull/8287)) by [@amtins](https://github.com/amtins)

### 🐛 Bug Fixes
- *(skip-forward)* A11y ([#8532](https://github.com/videojs/video.js/pull/8532)) by [@tsi](https://github.com/tsi)

### ⚙️ Miscellaneous Tasks
- Update vhs to 3.9.1 ([#8539](https://github.com/videojs/video.js/pull/8539)) by [@dzianis-dashkevich](https://github.com/dzianis-dashkevich)

## [8.8.0] - 2023-12-14

### 🚀 Features
- Update VHS to v3.9.0 ([#8526](https://github.com/videojs/video.js/pull/8526)) by [@adrums86](https://github.com/adrums86)

### ⚙️ Miscellaneous Tasks
- Update player public interface for types visibility ([#8525](https://github.com/videojs/video.js/pull/8525)) by [@dzianis-dashkevich](https://github.com/dzianis-dashkevich)

## [8.7.0] - 2023-12-04

### 🚀 Features
- Bump VHS 3.8.0 ([#8506](https://github.com/videojs/video.js/pull/8506)) by [@dzianis-dashkevich](https://github.com/dzianis-dashkevich)
- Support for nepali language and a small typo fix for hindi language ([#8323](https://github.com/videojs/video.js/pull/8323)) by [@ishwarrimal](https://github.com/ishwarrimal)

### 🐛 Bug Fixes
- *(error-display)* Update display on consecutive errors ([#8485](https://github.com/videojs/video.js/pull/8485)) by [@amtins](https://github.com/amtins)
- *(big-play-button)* Component remains displayed when seeking ([#8484](https://github.com/videojs/video.js/pull/8484)) by [@amtins](https://github.com/amtins)
- *(error-display)* Component remains displayed after player reset ([#8482](https://github.com/videojs/video.js/pull/8482)) by [@amtins](https://github.com/amtins)
- *(big-play-button)* Component remains displayed after an error ([#8483](https://github.com/videojs/video.js/pull/8483)) by [@amtins](https://github.com/amtins)
- *(title-bar)* Component remains displayed after player reset ([#8481](https://github.com/videojs/video.js/pull/8481)) by [@amtins](https://github.com/amtins)
- *(types)* Minor fix for types ([#8466](https://github.com/videojs/video.js/pull/8466)) by [@andreifilip123](https://github.com/andreifilip123)
- *(player)* Reset CSS classes at player.reset ([#8487](https://github.com/videojs/video.js/pull/8487)) by [@amtins](https://github.com/amtins)
- *(i18n)* New italian labels ([#8495](https://github.com/videojs/video.js/pull/8495)) by [@astagi](https://github.com/astagi)
- *(loading-spinner)* Border size costumization ([#8369](https://github.com/videojs/video.js/pull/8369)) by [@amtins](https://github.com/amtins)

### 💼 Other
- Fix window.navigator.userAgentData may be '{}' ([#8474](https://github.com/videojs/video.js/pull/8474)) by [@iamtang](https://github.com/iamtang)

### ⚙️ Miscellaneous Tasks
- Fixed an incomplete sentence in contributing guide ([#8471](https://github.com/videojs/video.js/pull/8471)) by [@jbla484](https://github.com/jbla484)
- Update mpd-parser & m3u8-parser dependencies ([#8494](https://github.com/videojs/video.js/pull/8494)) by [@amtins](https://github.com/amtins)
- Added Azerbaijani language ([#8472](https://github.com/videojs/video.js/pull/8472)) by [@ajafov98](https://github.com/ajafov98)

### New Contributors
* @ishwarrimal made their first contribution in [#8323](https://github.com/videojs/video.js/pull/8323)
* @andreifilip123 made their first contribution in [#8466](https://github.com/videojs/video.js/pull/8466)
* @ajafov98 made their first contribution in [#8472](https://github.com/videojs/video.js/pull/8472)
* @iamtang made their first contribution in [#8474](https://github.com/videojs/video.js/pull/8474)
* @jbla484 made their first contribution in [#8471](https://github.com/videojs/video.js/pull/8471)

## [8.6.1] - 2023-10-12

### 🐛 Bug Fixes
- Resolves captions sizing issue when minified ([#8442](https://github.com/videojs/video.js/pull/8442)) by [@mister-ben](https://github.com/mister-ben)
- *(types)* Improves quality of typescript definitions ([#8218](https://github.com/videojs/video.js/pull/8218)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- *(error)* Chromium reset mediaError when the poster is invalid ([#8410](https://github.com/videojs/video.js/pull/8410)) by [@amtins](https://github.com/amtins)
- *(control-bar)* Incorrect display when control bar display is locked ([#8435](https://github.com/videojs/video.js/pull/8435)) by [@amtins](https://github.com/amtins)
- *(types)* Use typeof for registerComponent and registerPlugin ([#8451](https://github.com/videojs/video.js/pull/8451)) by [@mister-ben](https://github.com/mister-ben)

### ⚙️ Miscellaneous Tasks
- *(types)* Fix issues in exported types ([#8333](https://github.com/videojs/video.js/pull/8333)) by [@boris-petrov](https://github.com/boris-petrov)
- Update VHS and mux.js versions ([#8462](https://github.com/videojs/video.js/pull/8462)) by [@wseymour15](https://github.com/wseymour15)

### New Contributors
* @aniolpages made their first contribution in [#8434](https://github.com/videojs/video.js/pull/8434)
* @Elandig made their first contribution in [#8422](https://github.com/videojs/video.js/pull/8422)

## [8.6.0] - 2023-09-25

### 🚀 Features
- Enhanced logger ([#8444](https://github.com/videojs/video.js/pull/8444)) by [@dzianis-dashkevich](https://github.com/dzianis-dashkevich)

### ⚙️ Miscellaneous Tasks
- *(package)* Update VHS version ([#8447](https://github.com/videojs/video.js/pull/8447)) by [@dzianis-dashkevich](https://github.com/dzianis-dashkevich)

## [8.5.3] - 2023-08-23

### 🐛 Bug Fixes
- *(error-display)* Avoids displaying visual components when an error occurs ([#8389](https://github.com/videojs/video.js/pull/8389)) by [@amtins](https://github.com/amtins)
- *(svg-icons)* Icon size consistency  ([#8380](https://github.com/videojs/video.js/pull/8380)) by [@amtins](https://github.com/amtins)
- *(svg-icons)* Default icons color ([#8382](https://github.com/videojs/video.js/pull/8382)) by [@amtins](https://github.com/amtins)

### New Contributors
* @chuchuva made their first contribution in [#8399](https://github.com/videojs/video.js/pull/8399)

## [8.5.2] - 2023-08-14

### 🐛 Bug Fixes
- *(text)* Caption settings typo by [@usmanonazim](https://github.com/usmanonazim)

### ⚙️ Miscellaneous Tasks
- *(package)* Bump VHS version from 3.3.1 to 3.5.3 ([#8400](https://github.com/videojs/video.js/pull/8400)) by [@dzianis-dashkevich](https://github.com/dzianis-dashkevich)

## [8.5.1] - 2023-07-21

### 🐛 Bug Fixes
- *(lang)* Add skip button text for Portuguese ([#8342](https://github.com/videojs/video.js/pull/8342)) by [@amtins](https://github.com/amtins)
- *(lang)* Add skip button text for French ([#8341](https://github.com/videojs/video.js/pull/8341)) by [@amtins](https://github.com/amtins)
- Add skip button text for Spanish ([#8340](https://github.com/videojs/video.js/pull/8340)) by [@mister-ben](https://github.com/mister-ben)
- *(progress)* Mouse-time-display overlaps the play-progress svg icon ([#8338](https://github.com/videojs/video.js/pull/8338)) by [@amtins](https://github.com/amtins)
- *(play-toggle)* Missing svg play icon ([#8337](https://github.com/videojs/video.js/pull/8337)) by [@amtins](https://github.com/amtins)
- Fullscreen styles for older Safari ([#8346](https://github.com/videojs/video.js/pull/8346)) by [@mister-ben](https://github.com/mister-ben)
- Don't use copyStyleSheets with documentPIP ([#8314](https://github.com/videojs/video.js/pull/8314)) by [@beaufortfrancois](https://github.com/beaufortfrancois)
- Make compatible with chrome 53 ([#8354](https://github.com/videojs/video.js/pull/8354)) by [@mister-ben](https://github.com/mister-ben)
- *(tests)* Skip a test on old Safari ([#8356](https://github.com/videojs/video.js/pull/8356)) by [@mister-ben](https://github.com/mister-ben)
- Check for VTTCue ([#8370](https://github.com/videojs/video.js/pull/8370)) by [@wseymour15](https://github.com/wseymour15)
- *(tests)* Fixes for old Safari ([#8368](https://github.com/videojs/video.js/pull/8368)) by [@mister-ben](https://github.com/mister-ben)

## [8.5.0] - 2023-06-12

### 🚀 Features
- Add useSVGIcons option ([#8260](https://github.com/videojs/video.js/pull/8260)) by [@wseymour15](https://github.com/wseymour15)

## [8.4.2] - 2023-06-06

### 🐛 Bug Fixes
- *(package)* Update videojs-contrib-quality-levels to 4.0.0 to eliminate deprecation warning ([#8303](https://github.com/videojs/video.js/pull/8303)) by [@Makio64](https://github.com/Makio64)
- *(loading-spinner)* Fix loading spinner responsiveness when default font size is modified ([#8295](https://github.com/videojs/video.js/pull/8295)) by [@amtins](https://github.com/amtins)
- *(text-track-settings)* Fix text track settings responsiveness when default font size is modified ([#8294](https://github.com/videojs/video.js/pull/8294)) by [@amtins](https://github.com/amtins)
- *(shadow-dom)* Prevent warning 'element supplied is not included' ([#8192](https://github.com/videojs/video.js/pull/8192)) by [@BrainCrumbz](https://github.com/BrainCrumbz)

### New Contributors
* @BrainCrumbz made their first contribution in [#8192](https://github.com/videojs/video.js/pull/8192)
* @Makio64 made their first contribution in [#8303](https://github.com/videojs/video.js/pull/8303)

## [8.4.1] - 2023-06-05

### 🐛 Bug Fixes
- Revert resolveJsonModule in tsconfig ([#8310](https://github.com/videojs/video.js/pull/8310)) by [@mister-ben](https://github.com/mister-ben)

## [8.4.0] - 2023-06-02

### 🚀 Features
- Text track display overlays a video ([#8009](https://github.com/videojs/video.js/pull/8009)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- *(lang)* Update zh-TW translations ([#7877](https://github.com/videojs/video.js/pull/7877)) by [@supershowwei](https://github.com/supershowwei)
- *(lang)* Update fa translation ([#8288](https://github.com/videojs/video.js/pull/8288)) by [@kerasus](https://github.com/kerasus)

### 🐛 Bug Fixes
- Replace Object.values with ponyfill ([#8267](https://github.com/videojs/video.js/pull/8267)) by [@dzianis-dashkevich](https://github.com/dzianis-dashkevich)
- *(videojs)* Missing return in registerComponent ([#8247](https://github.com/videojs/video.js/pull/8247)) by [@amtins](https://github.com/amtins)
- *(player)* Address loss of crossOrigin value when loadMedia is called ([#8085](https://github.com/videojs/video.js/pull/8085)) by [@amtins](https://github.com/amtins)
- Ad icon is not visible on audio description track list element on Safari ([#8232](https://github.com/videojs/video.js/pull/8232)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- *(player)* TechGet is undefined ([#8256](https://github.com/videojs/video.js/pull/8256)) by [@amtins](https://github.com/amtins)
- *(seek-bar)* Error when scrubbing after player reset ([#8257](https://github.com/videojs/video.js/pull/8257)) by [@amtins](https://github.com/amtins)
- *(skip-forward)* Error when clicking after player reset ([#8258](https://github.com/videojs/video.js/pull/8258)) by [@amtins](https://github.com/amtins)
- Document Picture-in-Picture: Use width/height instead of initialAspectRatio ([#8270](https://github.com/videojs/video.js/pull/8270)) by [@beaufortfrancois](https://github.com/beaufortfrancois)
- *(player)* Load method fails to reset the media element to its initial state when the VHS is used ([#8274](https://github.com/videojs/video.js/pull/8274)) by [@amtins](https://github.com/amtins)
- *(picture-in-picture-control)* Hide the component in non-compatible browsers ([#7899](https://github.com/videojs/video.js/pull/7899)) by [@amtins](https://github.com/amtins)
- *(jsdoc)* Corrections to jsdoc ([#8277](https://github.com/videojs/video.js/pull/8277)) by [@mister-ben](https://github.com/mister-ben)
- *(player)* Cache_.currentTime is not updated when the current time is set ([#8285](https://github.com/videojs/video.js/pull/8285)) by [@amtins](https://github.com/amtins)

### 📚 Documentation
- Update version number in README.md ([#8271](https://github.com/videojs/video.js/pull/8271)) by [@beligh-hamdi](https://github.com/beligh-hamdi)

### 🧪 Testing
- Fix Safari test failures ([#8300](https://github.com/videojs/video.js/pull/8300)) by [@misteroneill](https://github.com/misteroneill)

### ⚙️ Miscellaneous Tasks
- Remove legacy prefixes ([#8276](https://github.com/videojs/video.js/pull/8276)) by [@mister-ben](https://github.com/mister-ben)
- *(package)* Update to http-streaming v3.3.1 ([#8279](https://github.com/videojs/video.js/pull/8279)) by [@adrums86](https://github.com/adrums86)

### New Contributors
* @kerasus made their first contribution in [#8288](https://github.com/videojs/video.js/pull/8288)
* @supershowwei made their first contribution in [#7877](https://github.com/videojs/video.js/pull/7877)
* @beligh-hamdi made their first contribution in [#8271](https://github.com/videojs/video.js/pull/8271)

## [8.3.0] - 2023-04-05

### 🚀 Features
- Add document picture-in-picture support ([#8113](https://github.com/videojs/video.js/pull/8113)) by [@mister-ben](https://github.com/mister-ben)

### 🐛 Bug Fixes
- *(lang)* Improve Italian labels ([#8193](https://github.com/videojs/video.js/pull/8193)) by [@astagi](https://github.com/astagi)
- Improved accessibility for time display ([#8182](https://github.com/videojs/video.js/pull/8182)) by [@brayden-wood](https://github.com/brayden-wood)
- *(lang)* Update nl.json ([#8135](https://github.com/videojs/video.js/pull/8135)) by [@DutchofCambridge](https://github.com/DutchofCambridge)
- *(lang)* Improve Persian translation ([#7991](https://github.com/videojs/video.js/pull/7991)) by [@ebraminio](https://github.com/ebraminio)
- Ensure additional components update on languagechange ([#8175](https://github.com/videojs/video.js/pull/8175)) by [@mister-ben](https://github.com/mister-ben)
- Reset progress bar fully when player is reset ([#8160](https://github.com/videojs/video.js/pull/8160)) by [@amtins](https://github.com/amtins)
- *(lang)* Improve translations for mute and unmute ([#8227](https://github.com/videojs/video.js/pull/8227)) by [@mister-ben](https://github.com/mister-ben)
- *(types)* Add jsdoc plugin to handle ts-style imports ([#8225](https://github.com/videojs/video.js/pull/8225)) by [@mister-ben](https://github.com/mister-ben)

### 📚 Documentation
- Update jsdoc template for better usability on mobile ([#8048](https://github.com/videojs/video.js/pull/8048)) by [@mister-ben](https://github.com/mister-ben)

### ⚙️ Miscellaneous Tasks
- Update CI and release workflows ([#8214](https://github.com/videojs/video.js/pull/8214)) by [@philjhale](https://github.com/philjhale)
- Update issue template ([#8212](https://github.com/videojs/video.js/pull/8212)) by [@mister-ben](https://github.com/mister-ben)
- *(package)* Fix out of sync package-lock.json ([#8228](https://github.com/videojs/video.js/pull/8228)) by [@misteroneill](https://github.com/misteroneill)

### New Contributors
* @philjhale made their first contribution in [#8214](https://github.com/videojs/video.js/pull/8214)
* @jdufresne made their first contribution in [#8110](https://github.com/videojs/video.js/pull/8110)
* @ebraminio made their first contribution in [#7991](https://github.com/videojs/video.js/pull/7991)
* @DutchofCambridge made their first contribution in [#8135](https://github.com/videojs/video.js/pull/8135)
* @brayden-wood made their first contribution in [#8182](https://github.com/videojs/video.js/pull/8182)
* @astagi made their first contribution in [#8193](https://github.com/videojs/video.js/pull/8193)

## [8.2.1] - 2023-03-15

### 🐛 Bug Fixes
- Replay button broken for native playback ([#8142](https://github.com/videojs/video.js/pull/8142)) by [@adrums86](https://github.com/adrums86)
- *(lang)* Add strings for skip buttons ([#8174](https://github.com/videojs/video.js/pull/8174)) by [@mister-ben](https://github.com/mister-ben)
- *(lang)* Update Japanese translations ([#8190](https://github.com/videojs/video.js/pull/8190)) by [@wseymour15](https://github.com/wseymour15)

## [8.2.0] - 2023-03-06

### 🚀 Features
- Add skip forward/backward buttons ([#8147](https://github.com/videojs/video.js/pull/8147)) by [@usmanonazim](https://github.com/usmanonazim)

### 🐛 Bug Fixes
- *(types)* Improve Typescript coverage ([#8148](https://github.com/videojs/video.js/pull/8148)) by [@mister-ben](https://github.com/mister-ben)

### ⚙️ Miscellaneous Tasks
- *(documentation)* Update release flow in collaborator guide md ([#8167](https://github.com/videojs/video.js/pull/8167)) by [@dzianis-dashkevich](https://github.com/dzianis-dashkevich)

## [8.1.1] - 2023-02-28

### 📚 Documentation
- Remove redundant 8.0.4 changes from 8.1.0 changelog ([#8155](https://github.com/videojs/video.js/pull/8155)) by [@alex-barstow](https://github.com/alex-barstow)

### ⚙️ Miscellaneous Tasks
- *(package)* Update to @videojs/http-streaming 3.0.2 ([#8162](https://github.com/videojs/video.js/pull/8162)) by [@dzianis-dashkevich](https://github.com/dzianis-dashkevich)

### New Contributors
* @dzianis-dashkevich made their first contribution in [#8162](https://github.com/videojs/video.js/pull/8162)

## [8.1.0] - 2023-02-23

### 🚀 Features
- Improved text tracks settings labels ([#8101](https://github.com/videojs/video.js/pull/8101)) by [@wseymour15](https://github.com/wseymour15)

### 🐛 Bug Fixes
- Remove img el when there's no poster source ([#8130](https://github.com/videojs/video.js/pull/8130)) by [@mister-ben](https://github.com/mister-ben)

### ⚙️ Miscellaneous Tasks
- Upgrade videojs-font to 4.0.0 ([#8117](https://github.com/videojs/video.js/pull/8117)) by [@usmanonazim](https://github.com/usmanonazim)
- Update translations script to special case en-GB ([#8106](https://github.com/videojs/video.js/pull/8106)) by [@mister-ben](https://github.com/mister-ben)

### New Contributors
* @usmanonazim made their first contribution in [#8117](https://github.com/videojs/video.js/pull/8117)
* @wseymour15 made their first contribution in [#8101](https://github.com/videojs/video.js/pull/8101)

## [8.0.4] - 2023-02-02

### 🐛 Bug Fixes
- Set alt attr on poster img ([#8043](https://github.com/videojs/video.js/pull/8043)) by [@mister-ben](https://github.com/mister-ben)
- Ensures iOS can use native fullscreen ([#8071](https://github.com/videojs/video.js/pull/8071)) by [@mister-ben](https://github.com/mister-ben)
- Improves types for registerPlugin and getPlugin ([#8058](https://github.com/videojs/video.js/pull/8058)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- *(lang)* Remove dupelicate entry in en.json ([#8093](https://github.com/videojs/video.js/pull/8093)) by [@mister-ben](https://github.com/mister-ben)
- Exit PIP if entering fullscreen ([#8082](https://github.com/videojs/video.js/pull/8082)) by [@jacobhamblin](https://github.com/jacobhamblin)
- Use Screen Orientation API where supported ([#8031](https://github.com/videojs/video.js/pull/8031)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- Remove unnecessary handling of invalid cues ([#7956](https://github.com/videojs/video.js/pull/7956)) by [@mister-ben](https://github.com/mister-ben)
- *(lang)* Add missing comma in turkish ([#8102](https://github.com/videojs/video.js/pull/8102)) by [@mister-ben](https://github.com/mister-ben)

### ⚙️ Miscellaneous Tasks
- Add missing translations ([#8083](https://github.com/videojs/video.js/pull/8083)) by [@adrums86](https://github.com/adrums86)
- Roll back remark dev dependencies to address failing release automation ([#8021](https://github.com/videojs/video.js/pull/8021)) by [@misteroneill](https://github.com/misteroneill)
- Update codecov action ([#8103](https://github.com/videojs/video.js/pull/8103)) by [@mister-ben](https://github.com/mister-ben)

### New Contributors
* @onurdumangoz made their first contribution in [#8060](https://github.com/videojs/video.js/pull/8060)
* @jacobhamblin made their first contribution in [#8082](https://github.com/videojs/video.js/pull/8082)
* @liberaldev made their first contribution in [#8091](https://github.com/videojs/video.js/pull/8091)
* @adrums86 made their first contribution in [#8083](https://github.com/videojs/video.js/pull/8083)

## [8.0.3] - 2023-01-05

### 🐛 Bug Fixes
- *(package)* Upgrade to videojs-contrib-quality-levels 3.0.0 ([#8055](https://github.com/videojs/video.js/pull/8055)) by [@alex-barstow](https://github.com/alex-barstow)

### ⚙️ Miscellaneous Tasks
- Update lock thrads dependency ([#8044](https://github.com/videojs/video.js/pull/8044)) by [@mister-ben](https://github.com/mister-ben)

## [8.0.2] - 2022-11-24

### 🐛 Bug Fixes
- Add poster size styles ([#8022](https://github.com/videojs/video.js/pull/8022)) by [@mister-ben](https://github.com/mister-ben)

## [8.0.1] - 2022-11-23

### ⚙️ Miscellaneous Tasks
- *(package)* Update videojs-contrib-quality-levels to 2.2.1 ([#8019](https://github.com/videojs/video.js/pull/8019)) by [@misteroneill](https://github.com/misteroneill)
- Gh-release build script no longer needed ([#8020](https://github.com/videojs/video.js/pull/8020)) by [@misteroneill](https://github.com/misteroneill)

## [8.0.0] - 2022-11-23

### 🚀 Features
- Change addRemoteTextTrack's manualCleanup option default value to false ([#7588](https://github.com/videojs/video.js/pull/7588)) by [@alex-barstow](https://github.com/alex-barstow)
- Export more helpers in videojs object ([#7717](https://github.com/videojs/video.js/pull/7717)) by [@hugorogz](https://github.com/hugorogz)
- [**breaking**] Remove the firstplay event ([#7707](https://github.com/videojs/video.js/pull/7707)) by [@hugorogz](https://github.com/hugorogz)
- [**breaking**] Assume native promises, remove promise option and workarounds ([#7715](https://github.com/videojs/video.js/pull/7715))
- Update exposed utility functions and deprecate several top-level methods of the videojs global ([#7761](https://github.com/videojs/video.js/pull/7761)) by [@misteroneill](https://github.com/misteroneill)
- [**breaking**] Playback rate button now opens the menu rather than changing the playback rate ([#7779](https://github.com/videojs/video.js/pull/7779)) by [@misteroneill](https://github.com/misteroneill)
- Add a new title bar component ([#7788](https://github.com/videojs/video.js/pull/7788)) by [@misteroneill](https://github.com/misteroneill)
- *(lang)* Use less ambiguous text for the fullscreen button when in fullscreen mode ([#7856](https://github.com/videojs/video.js/pull/7856)) by [@misteroneill](https://github.com/misteroneill)
- Remove references and logic related to Flash and SWF ([#7852](https://github.com/videojs/video.js/pull/7852)) by [@roman-bc-dev](https://github.com/roman-bc-dev)
- Remove support for setting nonstandard attributes as props ([#7857](https://github.com/videojs/video.js/pull/7857)) by [@roman-bc-dev](https://github.com/roman-bc-dev)
- Remove closest fallback ([#7853](https://github.com/videojs/video.js/pull/7853)) by [@mister-ben](https://github.com/mister-ben)
- AddClass and removeClass method supports adding/removing multiple classes ([#7798](https://github.com/videojs/video.js/pull/7798)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- [**breaking**] Make retryOnError be the default ([#7868](https://github.com/videojs/video.js/pull/7868)) by [@gkatsev](https://github.com/gkatsev)
- Enable sourceset by default ([#7879](https://github.com/videojs/video.js/pull/7879)) by [@gkatsev](https://github.com/gkatsev)
- [**breaking**] Use picture el for poster ([#7865](https://github.com/videojs/video.js/pull/7865)) by [@mister-ben](https://github.com/mister-ben)
- Add support for a list of quality levels ([#7897](https://github.com/videojs/video.js/pull/7897)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- Generate Typescript definitions ([#7954](https://github.com/videojs/video.js/pull/7954)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- Use userAgentData in favour of userAgent ([#7979](https://github.com/videojs/video.js/pull/7979)) by [@mister-ben](https://github.com/mister-ben)

### 🐛 Bug Fixes
- [**breaking**] Update icons import path for sass ([#7867](https://github.com/videojs/video.js/pull/7867)) by [@gkatsev](https://github.com/gkatsev)
- *(jsdoc)* ControlText_ should have a protected access modifier. ([#7972](https://github.com/videojs/video.js/pull/7972)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- *(control-bar)* [**breaking**] Make vertical alignment of slider handles more consistent ([#7990](https://github.com/videojs/video.js/pull/7990)) by [@KangXinzhi](https://github.com/KangXinzhi)

### 💼 Other
- Update @videojs/http-streaming to 3.0 release candidate ([#7884](https://github.com/videojs/video.js/pull/7884)) by [@misteroneill](https://github.com/misteroneill)

### 🚜 Refactor
- [**breaking**] Remove ie-specific code ([#7701](https://github.com/videojs/video.js/pull/7701))
- Remove internal Map, Set, and WeakMap shams, assume window.performance and requestAnimationFrame support ([#7775](https://github.com/videojs/video.js/pull/7775)) by [@misteroneill](https://github.com/misteroneill)
- Remove logic and style that accommodates non-flex fallbacks ([#7820](https://github.com/videojs/video.js/pull/7820)) by [@roman-bc-dev](https://github.com/roman-bc-dev)
- [**breaking**] Remove extend() and tests ([#7950](https://github.com/videojs/video.js/pull/7950))
- Rename fn.bind to fn.bind_ to strongly indicate it should not be used externally ([#7940](https://github.com/videojs/video.js/pull/7940)) by [@misteroneill](https://github.com/misteroneill)

### ⚙️ Miscellaneous Tasks
- Update karma-config to 8 to drop ie11 and older browsers ([#7547](https://github.com/videojs/video.js/pull/7547)) by [@gkatsev](https://github.com/gkatsev)
- Update preset env, drop IE11 and older browser support ([#7708](https://github.com/videojs/video.js/pull/7708))
- *(package)* Update to @videojs/http-streaming 3.0.0 ([#8012](https://github.com/videojs/video.js/pull/8012)) by [@misteroneill](https://github.com/misteroneill)
- Make direct deps be exact but indirect have ^ ([#8014](https://github.com/videojs/video.js/pull/8014)) by [@gkatsev](https://github.com/gkatsev)
- Re-generate package-lock.json to fix merge issues with main ([#8015](https://github.com/videojs/video.js/pull/8015)) by [@misteroneill](https://github.com/misteroneill)

### ◀️ Revert
- [**breaking**] Revert #7067 so we throw an error for invalid event types ([#7719](https://github.com/videojs/video.js/pull/7719))

### New Contributors
* @KangXinzhi made their first contribution
* @hugorogz made their first contribution

## [7.21.1] - 2022-11-21

### 🐛 Bug Fixes
- Deprecate the extend() function ([#7944](https://github.com/videojs/video.js/pull/7944)) by [@misteroneill](https://github.com/misteroneill)
- Last timeout in queueTrigger() never clears  map ([#7964](https://github.com/videojs/video.js/pull/7964)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- Update @videojs/http-streaming to 2.15.1 ([#8010](https://github.com/videojs/video.js/pull/8010)) by [@gkatsev](https://github.com/gkatsev)

### ⚙️ Miscellaneous Tasks
- Fix mixed content warnings from netlify ([#7946](https://github.com/videojs/video.js/pull/7946)) by [@gkatsev](https://github.com/gkatsev)

## [7.21.0] - 2022-09-15

### 🚀 Features
- Update VHS to 2.15.0 ([#7929](https://github.com/videojs/video.js/pull/7929)) by [@gkatsev](https://github.com/gkatsev)
- *(lang)* Add Bengali (bn) translations ([#7823](https://github.com/videojs/video.js/pull/7823)) by [@themaruf](https://github.com/themaruf)

### 🐛 Bug Fixes
- *(lang)* Update Occitan translation ([#7888](https://github.com/videojs/video.js/pull/7888)) by [@Quenty31](https://github.com/Quenty31)

### New Contributors
* @themaruf made their first contribution in [#7823](https://github.com/videojs/video.js/pull/7823)

## [7.20.3] - 2022-09-09

### 🐛 Bug Fixes
- *(package)* Update to @videojs/http-streaming 2.14.3 and videojs-vtt.js 0.15.4 ([#7907](https://github.com/videojs/video.js/pull/7907))
- Use timeupdate as well as rvfc/raf for cues ([#7918](https://github.com/videojs/video.js/pull/7918)) by [@mister-ben](https://github.com/mister-ben)
- Allow for techs that init slowly in rvfc ([#7864](https://github.com/videojs/video.js/pull/7864)) by [@mister-ben](https://github.com/mister-ben)

### 🚜 Refactor
- Fix typo in player.js ([#7805](https://github.com/videojs/video.js/pull/7805)) by [@eltociear](https://github.com/eltociear)

### 📚 Documentation
- Update FAQ.md to match change in #7892 ([#7893](https://github.com/videojs/video.js/pull/7893)) by [@OwenEdwards](https://github.com/OwenEdwards)

### ⚙️ Miscellaneous Tasks
- *(docs)* Use https URLs in noUITitleAtttributes example ([#7809](https://github.com/videojs/video.js/pull/7809)) by [@mister-ben](https://github.com/mister-ben)
- Update FAQ redirect ([#7892](https://github.com/videojs/video.js/pull/7892)) by [@gkatsev](https://github.com/gkatsev)

## [7.20.2] - 2022-07-28

### 🐛 Bug Fixes
- Need to determine featuresVideoFrameCallback before setting source ([#7812](https://github.com/videojs/video.js/pull/7812)) by [@joeflateau](https://github.com/joeflateau)
- *(control-bar)* Audio player no longer responds to touch events ([#7825](https://github.com/videojs/video.js/pull/7825)) by [@amtins](https://github.com/amtins)
- *(lang)* Fixes key spacing within fr.json file ([#7848](https://github.com/videojs/video.js/pull/7848)) by [@tgwittman](https://github.com/tgwittman)
- Conditional requestVideoFrameCallback on Safari ([#7854](https://github.com/videojs/video.js/pull/7854)) by [@mister-ben](https://github.com/mister-ben)
- *(lang)* Update Polish language ([#7821](https://github.com/videojs/video.js/pull/7821)) by [@Daxxxis](https://github.com/Daxxxis)

### ⚙️ Miscellaneous Tasks
- *(lock-threads)* Run only daily at 1:00 am, and skip in forks ([#7832](https://github.com/videojs/video.js/pull/7832)) by [@amtins](https://github.com/amtins)

### New Contributors
* @Daxxxis made their first contribution in [#7821](https://github.com/videojs/video.js/pull/7821)
* @tgwittman made their first contribution in [#7848](https://github.com/videojs/video.js/pull/7848)
* @joeflateau made their first contribution in [#7812](https://github.com/videojs/video.js/pull/7812)

## [7.20.1] - 2022-05-31

### 🐛 Bug Fixes
- Error message should not be localized in the player class ([#7776](https://github.com/videojs/video.js/pull/7776)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- HTML5 tech with audio tag shouldn't use requestVideoFrameCallback ([#7778](https://github.com/videojs/video.js/pull/7778)) by [@mister-ben](https://github.com/mister-ben)
- Don't copy deprecated Event.path ([#7782](https://github.com/videojs/video.js/pull/7782)) by [@mister-ben](https://github.com/mister-ben)

### 🧪 Testing
- Stop running placeholder el test in IE and Safari to prevent errors ([#7769](https://github.com/videojs/video.js/pull/7769)) by [@misteroneill](https://github.com/misteroneill)

### ⚙️ Miscellaneous Tasks
- Lock old closed issues ([#7777](https://github.com/videojs/video.js/pull/7777)) by [@mister-ben](https://github.com/mister-ben)

## [7.20.0] - 2022-05-20

### 🚀 Features
- Player can be replaced with original el after dispose() ([#7722](https://github.com/videojs/video.js/pull/7722)) by [@mister-ben](https://github.com/mister-ben)
- *(lang)* Add Estonian (et) translations ([#7745](https://github.com/videojs/video.js/pull/7745)) by [@Pikse](https://github.com/Pikse)

### 🐛 Bug Fixes
- Reset() should null check the controlBar ([#7692](https://github.com/videojs/video.js/pull/7692)) by [@try2beth3b3st](https://github.com/try2beth3b3st)
- *(lang)* Improving Russian translation ([#7740](https://github.com/videojs/video.js/pull/7740)) by [@AHOHNMYC](https://github.com/AHOHNMYC)
- *(accessibility)* Frame must have a title attribute ([#7754](https://github.com/videojs/video.js/pull/7754)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)

### 📚 Documentation
- Fix typo in components.html ([#7694](https://github.com/videojs/video.js/pull/7694)) by [@eltociear](https://github.com/eltociear)
- *(readme)* Updating the number of websites ([#7697](https://github.com/videojs/video.js/pull/7697)) by [@mohamedfasil](https://github.com/mohamedfasil)

### ⚙️ Miscellaneous Tasks
- Update issue template to a form ([#7735](https://github.com/videojs/video.js/pull/7735)) by [@mister-ben](https://github.com/mister-ben)

### New Contributors
* @Pikse made their first contribution
* @AHOHNMYC made their first contribution
* @mohamedfasil made their first contribution in [#7697](https://github.com/videojs/video.js/pull/7697)
* @try2beth3b3st made their first contribution in [#7692](https://github.com/videojs/video.js/pull/7692)

## [7.19.2] - 2022-04-20

### 🐛 Bug Fixes
- *(package)* Update to @videojs/http-streaming 2.14.2 ([#7728](https://github.com/videojs/video.js/pull/7728)) by [@gkatsev](https://github.com/gkatsev)

## [7.19.1] - 2022-04-15

### 🐛 Bug Fixes
- Audio only mode styling conflicts with fluid mode ([#7724](https://github.com/videojs/video.js/pull/7724))
- *(accessibility)* Fix broken aria menu ([#7699](https://github.com/videojs/video.js/pull/7699)) by [@Noemite](https://github.com/Noemite)

### 📚 Documentation
- Redirect guides to videojs.com ([#7706](https://github.com/videojs/video.js/pull/7706)) by [@misteroneill](https://github.com/misteroneill)

## [7.19.0] - 2022-03-21

### 🚀 Features
- Add audioPosterMode option ([#7629](https://github.com/videojs/video.js/pull/7629)) by [@harisha-swaminathan](https://github.com/harisha-swaminathan)
- Greater text track precision using requestVideoFrameCallback ([#7633](https://github.com/videojs/video.js/pull/7633)) by [@mister-ben](https://github.com/mister-ben)
- Assume DASH MIME type when an MPD source URL is given ([#7602](https://github.com/videojs/video.js/pull/7602)) by [@amtins](https://github.com/amtins)
- Add Basque (eu) translations ([#7625](https://github.com/videojs/video.js/pull/7625)) by [@erral](https://github.com/erral)
- Audio Only Mode ([#7647](https://github.com/videojs/video.js/pull/7647))
- Easier configuration of buttons and components via options ([#7611](https://github.com/videojs/video.js/pull/7611)) by [@mister-ben](https://github.com/mister-ben)

### 🐛 Bug Fixes
- Async audio only tests ([#7673](https://github.com/videojs/video.js/pull/7673))
- Text-track-display position with no ui ([#7682](https://github.com/videojs/video.js/pull/7682)) by [@Wayne-Morgan](https://github.com/Wayne-Morgan)
- Generate chapters menu only when needed and don't create orphaned event listeners ([#7604](https://github.com/videojs/video.js/pull/7604)) by [@mister-ben](https://github.com/mister-ben)

### 🚜 Refactor
- Unify audioOnly mode and audioPoster mode ([#7678](https://github.com/videojs/video.js/pull/7678)) by [@harisha-swaminathan](https://github.com/harisha-swaminathan)

### 🧪 Testing
- *(text-track-controls)* Fix failing test caused by incompatibility between PRs ([#7686](https://github.com/videojs/video.js/pull/7686)) by [@misteroneill](https://github.com/misteroneill)

### ⚙️ Miscellaneous Tasks
- *(package)* Update to @videojs/http-streaming@2.14.0 ([#7676](https://github.com/videojs/video.js/pull/7676)) by [@misteroneill](https://github.com/misteroneill)

### New Contributors
* @Wayne-Morgan made their first contribution in [#7682](https://github.com/videojs/video.js/pull/7682)
* @harisha-swaminathan made their first contribution in [#7678](https://github.com/videojs/video.js/pull/7678)
* @erral made their first contribution in [#7625](https://github.com/videojs/video.js/pull/7625)

## [7.18.1] - 2022-02-23

### 🐛 Bug Fixes
- Keep focus trapping contained to modal ([#6983](https://github.com/videojs/video.js/pull/6983)) by [@kannapples](https://github.com/kannapples)
- *(lang)* Add missing translations for French, Italian, Japanese, and Korean ([#7589](https://github.com/videojs/video.js/pull/7589)) by [@Noemite](https://github.com/Noemite)
- *(accessibility)* By default, show track selection buttons at all responsive breakpoints ([#7603](https://github.com/videojs/video.js/pull/7603)) by [@misteroneill](https://github.com/misteroneill)
- Guard against Safari adding native controls after fullscreen ([#7634](https://github.com/videojs/video.js/pull/7634)) by [@mister-ben](https://github.com/mister-ben)
- Fix playback rate iteration if rates are not in the ascending order ([#7618](https://github.com/videojs/video.js/pull/7618)) by [@BruceRodrigues](https://github.com/BruceRodrigues)
- *(lang)* Remove trailing comma from fr.json ([#7657](https://github.com/videojs/video.js/pull/7657)) by [@misteroneill](https://github.com/misteroneill)

### 📚 Documentation
- Link to Angular guide in Player Workflows guide ([#7635](https://github.com/videojs/video.js/pull/7635)) by [@jayvdb](https://github.com/jayvdb)
- Add some FAQ entries ([#7609](https://github.com/videojs/video.js/pull/7609)) by [@mister-ben](https://github.com/mister-ben)

### New Contributors
* @BruceRodrigues made their first contribution in [#7618](https://github.com/videojs/video.js/pull/7618)
* @Noemite made their first contribution in [#7589](https://github.com/videojs/video.js/pull/7589)
* @kannapples made their first contribution in [#6983](https://github.com/videojs/video.js/pull/6983)
* @jayvdb made their first contribution

## [7.18.0] - 2021-12-20

### 🚀 Features
- Make negative sign on remaining time optional ([#7571](https://github.com/videojs/video.js/pull/7571)) by [@mister-ben](https://github.com/mister-ben)
- Udpate to @videojs/http-streaming@2.13.1 ([#7573](https://github.com/videojs/video.js/pull/7573)) by [@gkatsev](https://github.com/gkatsev)

## [7.17.3] - 2021-12-10

### 🐛 Bug Fixes
- *(package)* Update to @videojs/http-streaming@2.12.1 ([#7563](https://github.com/videojs/video.js/pull/7563)) by [@gkatsev](https://github.com/gkatsev)

## [7.17.2] - 2021-12-08

### 🐛 Bug Fixes
- Volume control showing up on iOS ([#7550](https://github.com/videojs/video.js/pull/7550)) by [@gkatsev](https://github.com/gkatsev)
- Regression with AD audio track menu items ([#7559](https://github.com/videojs/video.js/pull/7559)) by [@gkatsev](https://github.com/gkatsev)

### ⚙️ Miscellaneous Tasks
- Fix typo in COLLABORATOR_GUIDE ([#7537](https://github.com/videojs/video.js/pull/7537)) by [@gesinger](https://github.com/gesinger)

## [7.17.1] - 2021-11-17

### 🐛 Bug Fixes
- Improve enabling liveui when switching sources ([#7510](https://github.com/videojs/video.js/pull/7510)) by [@gkatsev](https://github.com/gkatsev)
- Turn off other tracks with native audio track ([#7519](https://github.com/videojs/video.js/pull/7519)) by [@gkatsev](https://github.com/gkatsev)
- Try again on volume feature detection on iOS ([#7514](https://github.com/videojs/video.js/pull/7514)) by [@gkatsev](https://github.com/gkatsev)
- Don't always use fastSeek when available. ([#7527](https://github.com/videojs/video.js/pull/7527)) by [@gkatsev](https://github.com/gkatsev)

### ⚙️ Miscellaneous Tasks
- *(sandbox)* Update embeds media to use public url ([#7530](https://github.com/videojs/video.js/pull/7530)) by [@gkatsev](https://github.com/gkatsev)

## [7.17.0] - 2021-11-10

### 🚀 Features
- Update to VHS 2.12.0 ([#7503](https://github.com/videojs/video.js/pull/7503)) by [@gkatsev](https://github.com/gkatsev)
- *(lang)* Add Latvian (lv) language support ([#7468](https://github.com/videojs/video.js/pull/7468)) by [@edgarsn](https://github.com/edgarsn)
- Add userAction.click to prevent pause/play when player is clicked ([#7495](https://github.com/videojs/video.js/pull/7495)) by [@rberger](https://github.com/rberger)

### 🐛 Bug Fixes
- *(package)* Update to VHS 2.11.2 ([#7484](https://github.com/videojs/video.js/pull/7484)) by [@gkatsev](https://github.com/gkatsev)
- Set the 'lang' attribute on text track display elements, if the language of the track is known ([#7493](https://github.com/videojs/video.js/pull/7493)) by [@OwenEdwards](https://github.com/OwenEdwards)
- Enable liveui on more livestreams ([#7502](https://github.com/videojs/video.js/pull/7502)) by [@gkatsev](https://github.com/gkatsev)
- *(lang)* Update Polish translation ([#7499](https://github.com/videojs/video.js/pull/7499)) by [@itarcontact](https://github.com/itarcontact)
- Don't let the player be translated except captions ([#7474](https://github.com/videojs/video.js/pull/7474)) by [@gkatsev](https://github.com/gkatsev)
- Volume button empty space ([#7466](https://github.com/videojs/video.js/pull/7466)) by [@amtins](https://github.com/amtins)
- *(lang)* Update zh-TW.json ([#7483](https://github.com/videojs/video.js/pull/7483)) by [@toto6038](https://github.com/toto6038)

### 📚 Documentation
- *(component.md)* Fix spelling error ([#7498](https://github.com/videojs/video.js/pull/7498)) by [@iChengbo](https://github.com/iChengbo)
- Fix typo in html-track-element.js ([#7504](https://github.com/videojs/video.js/pull/7504)) by [@eltociear](https://github.com/eltociear)
- *(react)* Fix clear when unmount component ([#7433](https://github.com/videojs/video.js/pull/7433)) by [@jomarquez21](https://github.com/jomarquez21)
- Fix a comment of the player's loadedmetadata event ([#7506](https://github.com/videojs/video.js/pull/7506)) by [@iChengbo](https://github.com/iChengbo)

### 🧪 Testing
- Add tests for the click user action ([#7507](https://github.com/videojs/video.js/pull/7507)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @iChengbo made their first contribution in [#7506](https://github.com/videojs/video.js/pull/7506)
* @rberger made their first contribution in [#7495](https://github.com/videojs/video.js/pull/7495)
* @toto6038 made their first contribution in [#7483](https://github.com/videojs/video.js/pull/7483)
* @amtins made their first contribution in [#7466](https://github.com/videojs/video.js/pull/7466)
* @jomarquez21 made their first contribution in [#7433](https://github.com/videojs/video.js/pull/7433)
* @edgarsn made their first contribution in [#7468](https://github.com/videojs/video.js/pull/7468)
* @itarcontact made their first contribution in [#7499](https://github.com/videojs/video.js/pull/7499)

## [7.16.0] - 2021-10-01

### 🚀 Features
- *(lang)* Add telugu language translations ([#7391](https://github.com/videojs/video.js/pull/7391)) by [@kvpasupuleti](https://github.com/kvpasupuleti)
- *(package)* Update to VHS 2.11.0 ([#7459](https://github.com/videojs/video.js/pull/7459)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @kvpasupuleti made their first contribution in [#7391](https://github.com/videojs/video.js/pull/7391)

## [7.15.7] - 2021-10-01

### 🐛 Bug Fixes
- Remove rule on small layout ([#7449](https://github.com/videojs/video.js/pull/7449)) by [@ipadilla4](https://github.com/ipadilla4)

## [7.15.6] - 2021-09-22

### 🐛 Bug Fixes
- Mark global/window/document as external globals ([#7438](https://github.com/videojs/video.js/pull/7438)) by [@gkatsev](https://github.com/gkatsev)

## [7.15.5] - 2021-09-21

### 🐛 Bug Fixes
- Remove deprecation of getComponent feature ([#7410](https://github.com/videojs/video.js/pull/7410)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update VHS to 2.10.3 to fix seeking into a gap ([#7436](https://github.com/videojs/video.js/pull/7436)) by [@jeserodz](https://github.com/jeserodz)

### 📚 Documentation
- *(plugins)* Fix typo in the plugins guide ([#7405](https://github.com/videojs/video.js/pull/7405)) by [@SaizFerri](https://github.com/SaizFerri)

### New Contributors
* @jeserodz made their first contribution in [#7436](https://github.com/videojs/video.js/pull/7436)
* @SaizFerri made their first contribution in [#7405](https://github.com/videojs/video.js/pull/7405)

## [7.15.4] - 2021-08-25

### ⚙️ Miscellaneous Tasks
- Use aws s3 cp rather than sync ([#7400](https://github.com/videojs/video.js/pull/7400)) by [@gkatsev](https://github.com/gkatsev)

## [7.15.3] - 2021-08-24

### 🐛 Bug Fixes
- Update VHS to fix xmldom warning ([#7395](https://github.com/videojs/video.js/pull/7395)) by [@gkatsev](https://github.com/gkatsev)

## [7.15.2] - 2021-08-23

### ⚙️ Miscellaneous Tasks
- Specify bucket for CDN push ([#7393](https://github.com/videojs/video.js/pull/7393)) by [@gkatsev](https://github.com/gkatsev)

## [7.15.1] - 2021-08-23

### 🐛 Bug Fixes
- *(lang)* Fix typo in de locale for progress bar ([#7380](https://github.com/videojs/video.js/pull/7380)) by [@andreas-venturini](https://github.com/andreas-venturini)
- Prevent cached inactivityTimeout from being overwritten with 0 ([#7383](https://github.com/videojs/video.js/pull/7383)) by [@jgcaruso](https://github.com/jgcaruso)

### 📚 Documentation
- *(react)* Fix typo ([#7375](https://github.com/videojs/video.js/pull/7375)) by [@eltociear](https://github.com/eltociear)
- *(react)* Update react functional component tutorial ([#7377](https://github.com/videojs/video.js/pull/7377)) by [@FredZeng](https://github.com/FredZeng)

### ⚙️ Miscellaneous Tasks
- Add a release and deploy Github Action ([#7385](https://github.com/videojs/video.js/pull/7385)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @jgcaruso made their first contribution in [#7383](https://github.com/videojs/video.js/pull/7383)
* @andreas-venturini made their first contribution in [#7380](https://github.com/videojs/video.js/pull/7380)

## [7.15.0] - 2021-07-28

### 🚀 Features
- *(package)* Update to @videojs/xhr@2.6 to add httpHandler helper ([#7348](https://github.com/videojs/video.js/pull/7348)) by [@gkatsev](https://github.com/gkatsev)
- *(lang)* Add Hindi Language translation ([#7327](https://github.com/videojs/video.js/pull/7327)) by [@hardik-choudhary](https://github.com/hardik-choudhary)
- *(time-ranges)* Make TimeRanges iteratable if Symbol.iterator exists ([#7330](https://github.com/videojs/video.js/pull/7330)) by [@gkatsev](https://github.com/gkatsev)
- *(hooks)* Error hooks ([#7349](https://github.com/videojs/video.js/pull/7349)) by [@gkatsev](https://github.com/gkatsev)
- *(lang)* Add Romanian language and update translations doc. ([#7300](https://github.com/videojs/video.js/pull/7300)) by [@dykwiat](https://github.com/dykwiat)

### 🐛 Bug Fixes
- Use click event for tech click event ([#7302](https://github.com/videojs/video.js/pull/7302)) by [@Chocobozzz](https://github.com/Chocobozzz)
- Prevent control bar clicks/taps with while user inactive ([#7329](https://github.com/videojs/video.js/pull/7329)) by [@brandonocasey](https://github.com/brandonocasey)
- Evented should cleanup dom data ([#7350](https://github.com/videojs/video.js/pull/7350)) by [@brandonocasey](https://github.com/brandonocasey)
- *(package)* Update to VHS 2.10.0 ([#7351](https://github.com/videojs/video.js/pull/7351)) by [@gkatsev](https://github.com/gkatsev)

### 🚜 Refactor
- Remove most usage of innerHTML ([#7337](https://github.com/videojs/video.js/pull/7337)) by [@brandonocasey](https://github.com/brandonocasey)

### New Contributors
* @dykwiat made their first contribution in [#7300](https://github.com/videojs/video.js/pull/7300)
* @hardik-choudhary made their first contribution in [#7327](https://github.com/videojs/video.js/pull/7327)

## [7.14.3] - 2021-07-26

### 🐛 Bug Fixes
- Remove IE8 url parsing workaround ([#7334](https://github.com/videojs/video.js/pull/7334)) by [@gkatsev](https://github.com/gkatsev)
- Don't add anchor to DOM for getAbsoluteURL ([#7336](https://github.com/videojs/video.js/pull/7336)) by [@gkatsev](https://github.com/gkatsev)

## [7.14.2] - 2021-07-19

### 🐛 Bug Fixes
- *(dom)* In removeClass, check element for null in case of a disposed player ([#6701](https://github.com/videojs/video.js/pull/6701)) by [@travisbader](https://github.com/travisbader)

### New Contributors
* @travisbader made their first contribution

## [7.14.1] - 2021-07-14

### 🐛 Bug Fixes
- Properly return promise from requestFullscreen and exitFullscreen ([#7299](https://github.com/videojs/video.js/pull/7299)) by [@gkatsev](https://github.com/gkatsev)
- All !important properties of vjs-lock-showing ([#7312](https://github.com/videojs/video.js/pull/7312)) by [@gkatsev](https://github.com/gkatsev)
- Remove loading spinner on ended ([#7311](https://github.com/videojs/video.js/pull/7311)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update to VHS 2.9.2 ([#7320](https://github.com/videojs/video.js/pull/7320)) by [@gkatsev](https://github.com/gkatsev)

### 📚 Documentation
- *(react)* Added a functional React component using React.useEffect ([#7203](https://github.com/videojs/video.js/pull/7203)) by [@hcbd](https://github.com/hcbd)

### ⚙️ Miscellaneous Tasks
- Use setup-node cache and remove individual cache step ([#7310](https://github.com/videojs/video.js/pull/7310)) by [@brandonocasey](https://github.com/brandonocasey)

### New Contributors
* @hcbd made their first contribution in [#7203](https://github.com/videojs/video.js/pull/7203)

## [7.14.0] - 2021-06-30

### 🚀 Features
- Add ended getter middleware ([#7287](https://github.com/videojs/video.js/pull/7287)) by [@alex-barstow](https://github.com/alex-barstow)

## [7.13.4] - 2021-06-30

### 🐛 Bug Fixes
- *(event)* Event polyfill detection compatibility with react-native-web ([#7286](https://github.com/videojs/video.js/pull/7286)) by [@awinograd](https://github.com/awinograd)
- *(lang)* Improve Hungarian translation ([#7289](https://github.com/videojs/video.js/pull/7289)) by [@instantleves](https://github.com/instantleves)
- Throw error on muted resolution rejection during autoplay ([#7293](https://github.com/videojs/video.js/pull/7293)) by [@roman-bc-dev](https://github.com/roman-bc-dev)
- *(lang)* Add some translations to es.json ([#6822](https://github.com/videojs/video.js/pull/6822)) by [@segus3088](https://github.com/segus3088)

### ⚙️ Miscellaneous Tasks
- Add a code coverage ci workflow ([#7282](https://github.com/videojs/video.js/pull/7282)) by [@brandonocasey](https://github.com/brandonocasey)

### New Contributors
* @segus3088 made their first contribution in [#6822](https://github.com/videojs/video.js/pull/6822)
* @roman-bc-dev made their first contribution in [#7293](https://github.com/videojs/video.js/pull/7293)
* @instantleves made their first contribution in [#7289](https://github.com/videojs/video.js/pull/7289)
* @awinograd made their first contribution in [#7286](https://github.com/videojs/video.js/pull/7286)

## [7.13.3] - 2021-06-23

### ⚙️ Miscellaneous Tasks
- Republish with VHS 2.9.1 by [@gkatsev](https://github.com/gkatsev)

## [7.13.2] - 2021-06-22

### 🐛 Bug Fixes
- *(package)* Update to VHS 2.9.1 ([#7284](https://github.com/videojs/video.js/pull/7284)) by [@gkatsev](https://github.com/gkatsev)

## [7.13.1] - 2021-06-14

### 🐛 Bug Fixes
- Do a null check on playbackRates player method ([#7273](https://github.com/videojs/video.js/pull/7273)) by [@gkatsev](https://github.com/gkatsev)

## [7.13.0] - 2021-06-11

### 🚀 Features
- *(package)* Add VHS deps as Video.js deps ([#7263](https://github.com/videojs/video.js/pull/7263)) by [@gkatsev](https://github.com/gkatsev)
- *(player)* Add playbackRates() method ([#7228](https://github.com/videojs/video.js/pull/7228)) by [@gkatsev](https://github.com/gkatsev)
- Add helper classes for 9:16 and 1:1 ([#7219](https://github.com/videojs/video.js/pull/7219)) by [@mister-ben](https://github.com/mister-ben)
- Add normalizeAutoplay option to treat autoplay: true as autoplay: "play" ([#7190](https://github.com/videojs/video.js/pull/7190)) by [@alex-barstow](https://github.com/alex-barstow)
- Add option to use full window mode instead of using tech's fullscreen ([#7218](https://github.com/videojs/video.js/pull/7218)) by [@mister-ben](https://github.com/mister-ben)
- Update to VHS@2.9.0 and mpd-parser@0.17.0 ([#7269](https://github.com/videojs/video.js/pull/7269)) by [@gkatsev](https://github.com/gkatsev)

### 📚 Documentation
- Fix typo in CONTRIBUTING.md ([#7260](https://github.com/videojs/video.js/pull/7260)) by [@eltociear](https://github.com/eltociear)

### New Contributors
* @eltociear made their first contribution in [#7260](https://github.com/videojs/video.js/pull/7260)

## [7.12.4] - 2021-06-02

### 🐛 Bug Fixes
- *(seek-bar)* Remove event listener on dispose ([#7258](https://github.com/videojs/video.js/pull/7258)) by [@boris-petrov](https://github.com/boris-petrov)
- *(player)* Accept data for fullscreenchange and error events from the tech ([#7254](https://github.com/videojs/video.js/pull/7254)) by [@FredZeng](https://github.com/FredZeng)
- Allow Video.js to be required in an env without setTimeout ([#7247](https://github.com/videojs/video.js/pull/7247)) by [@tf](https://github.com/tf)

### ⚙️ Miscellaneous Tasks
- Update sass and remove now deprecated / for division. ([#7253](https://github.com/videojs/video.js/pull/7253)) by [@mister-ben](https://github.com/mister-ben)
- *(component)* Update comment around triggering ready in component ([#7256](https://github.com/videojs/video.js/pull/7256)) by [@Dtthatcher](https://github.com/Dtthatcher)

### New Contributors
* @tf made their first contribution in [#7247](https://github.com/videojs/video.js/pull/7247)
* @Dtthatcher made their first contribution in [#7256](https://github.com/videojs/video.js/pull/7256)
* @boris-petrov made their first contribution in [#7258](https://github.com/videojs/video.js/pull/7258)

## [7.12.3] - 2021-05-20

### 🐛 Bug Fixes
- Update to VHS 2.8.2 ([#7242](https://github.com/videojs/video.js/pull/7242)) by [@gkatsev](https://github.com/gkatsev)

### ⚙️ Miscellaneous Tasks
- Revert back to gh-release@3.5.0 for now ([#7241](https://github.com/videojs/video.js/pull/7241)) by [@gkatsev](https://github.com/gkatsev)

## [7.12.2] - 2021-05-19

### 🐛 Bug Fixes
- Silence play promise in the play toggle. ([#7189](https://github.com/videojs/video.js/pull/7189)) by [@gkatsev](https://github.com/gkatsev)
- Make Playback Rate control work better with screen readers ([#7193](https://github.com/videojs/video.js/pull/7193)) by [@OwenEdwards](https://github.com/OwenEdwards)
- Don't hide menus with one item and a title ([#7215](https://github.com/videojs/video.js/pull/7215)) by [@mister-ben](https://github.com/mister-ben)
- User and programmatic seeks with live streams ([#7210](https://github.com/videojs/video.js/pull/7210)) by [@brandonocasey](https://github.com/brandonocasey)
- Better text for exit fullscreen ([#7183](https://github.com/videojs/video.js/pull/7183)) by [@mister-ben](https://github.com/mister-ben)
- Exit full window mode with Esc key ([#7224](https://github.com/videojs/video.js/pull/7224)) by [@FredZeng](https://github.com/FredZeng)
- Incorrect focus styles on selected MenuItem ([#7202](https://github.com/videojs/video.js/pull/7202)) by [@acmertz](https://github.com/acmertz)
- *(utils)* Add try and catch for computedStyle ([#7214](https://github.com/videojs/video.js/pull/7214)) by [@weiz18](https://github.com/weiz18)
- Update to VHS 2.8.1 ([#7238](https://github.com/videojs/video.js/pull/7238)) by [@gkatsev](https://github.com/gkatsev)

### ⚙️ Miscellaneous Tasks
- Update 'global' package in dependencies ([#7213](https://github.com/videojs/video.js/pull/7213)) by [@vbfox](https://github.com/vbfox)
- Update node/nvmrc and various dependencies ([#7221](https://github.com/videojs/video.js/pull/7221)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @weiz18 made their first contribution in [#7214](https://github.com/videojs/video.js/pull/7214)
* @vbfox made their first contribution in [#7213](https://github.com/videojs/video.js/pull/7213)

## [7.12.1] - 2021-04-13

### 🐛 Bug Fixes
- *(package)* Upgrade VHS to 2.7.1 ([#7174](https://github.com/videojs/video.js/pull/7174)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Remove remove ([#7177](https://github.com/videojs/video.js/pull/7177)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update vtt.js to allow server-side-rendering ([#7178](https://github.com/videojs/video.js/pull/7178)) by [@gkatsev](https://github.com/gkatsev)

## [7.12.0] - 2021-04-07

### 🚀 Features
- Add a player option `noUITitleAttributes` to prevent title attributes in the UI ([#7134](https://github.com/videojs/video.js/pull/7134)) by [@OwenEdwards](https://github.com/OwenEdwards)
- Retry on error ([#7038](https://github.com/videojs/video.js/pull/7038)) by [@alex-barstow](https://github.com/alex-barstow)
- Enable responsive controls on fullscreen  ([#7098](https://github.com/videojs/video.js/pull/7098)) by [@ipadilla4](https://github.com/ipadilla4)
- Add a mouse volume tooltip ([#6824](https://github.com/videojs/video.js/pull/6824)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- *(package)* Update VHS to 2.7.0 ([#7164](https://github.com/videojs/video.js/pull/7164)) by [@gkatsev](https://github.com/gkatsev)

### 🐛 Bug Fixes
- Always have an enabled audio track when switching ([#7163](https://github.com/videojs/video.js/pull/7163)) by [@brandonocasey](https://github.com/brandonocasey)

### ⚡ Performance
- Wrap prototype methods in handlers in an arrow function ([#7060](https://github.com/videojs/video.js/pull/7060)) by [@gkatsev](https://github.com/gkatsev)

### ⚙️ Miscellaneous Tasks
- Never skip github actions workflows in main ([#7169](https://github.com/videojs/video.js/pull/7169)) by [@brandonocasey](https://github.com/brandonocasey)

## [7.11.8] - 2021-03-23

### 🐛 Bug Fixes
- Remove extra timeupdate event when progress controls is disabled ([#7142](https://github.com/videojs/video.js/pull/7142)) by [@alex-barstow](https://github.com/alex-barstow)

### 📚 Documentation
- Update note about accessing tech ([#7141](https://github.com/videojs/video.js/pull/7141)) by [@thijstriemstra](https://github.com/thijstriemstra)

## [7.11.7] - 2021-03-12

### 🐛 Bug Fixes
- *(package)* Update to Video.js HTTP Streaming 2.6.4 ([#7136](https://github.com/videojs/video.js/pull/7136)) by [@gkatsev](https://github.com/gkatsev)

## [7.11.6] - 2021-03-09

### 🐛 Bug Fixes
- Clear progress control related rAFs when tab is hidden ([#7099](https://github.com/videojs/video.js/pull/7099)) by [@gkatsev](https://github.com/gkatsev)
- Try enabling liveui on canplay ([#7114](https://github.com/videojs/video.js/pull/7114)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update to videojs/http-streaming 2.6.3 ([#7129](https://github.com/videojs/video.js/pull/7129)) by [@gkatsev](https://github.com/gkatsev)
- Focus-visible shouldn't change background styles ([#7113](https://github.com/videojs/video.js/pull/7113)) by [@acmertz](https://github.com/acmertz)
- Add display block to all buttons icon placeholder ([#7094](https://github.com/videojs/video.js/pull/7094)) by [@lukaszpolowczyk](https://github.com/lukaszpolowczyk)
- Do not preload default text track if preloadTextTracks is false ([#7021](https://github.com/videojs/video.js/pull/7021)) by [@isabelleingato](https://github.com/isabelleingato)

### 📚 Documentation
- Fix broken blogpost urls ([#7106](https://github.com/videojs/video.js/pull/7106)) by [@FredZeng](https://github.com/FredZeng)
- Add liveTracker options to options guide ([#7097](https://github.com/videojs/video.js/pull/7097)) by [@brandonocasey](https://github.com/brandonocasey)

### 🧪 Testing
- A couple of minor fixes, tweak CI config, swap rollup replace plugin ([#7128](https://github.com/videojs/video.js/pull/7128)) by [@gkatsev](https://github.com/gkatsev)

### ⚙️ Miscellaneous Tasks
- Video.js debug build ([#7082](https://github.com/videojs/video.js/pull/7082)) by [@brandonocasey](https://github.com/brandonocasey)
- Update rollup for upcoming vhs changes ([#7075](https://github.com/videojs/video.js/pull/7075)) by [@brandonocasey](https://github.com/brandonocasey)

### New Contributors
* @isabelleingato made their first contribution in [#7021](https://github.com/videojs/video.js/pull/7021)
* @lukaszpolowczyk made their first contribution in [#7094](https://github.com/videojs/video.js/pull/7094)
* @FredZeng made their first contribution in [#7106](https://github.com/videojs/video.js/pull/7106)

## [7.11.5] - 2021-02-04

### 🐛 Bug Fixes
- *(dom)* Stop findPosition at a fullscreenElement ([#7074](https://github.com/videojs/video.js/pull/7074)) by [@gkatsev](https://github.com/gkatsev)
- *(dom)* Account for translated parent in pointer position on iOS ([#7079](https://github.com/videojs/video.js/pull/7079)) by [@gkatsev](https://github.com/gkatsev)

## [7.11.4] - 2021-01-26

### 🐛 Bug Fixes
- *(evented)* Log an error on invalid type ([#7067](https://github.com/videojs/video.js/pull/7067)) by [@gkatsev](https://github.com/gkatsev)

## [7.11.3] - 2021-01-25

### 🐛 Bug Fixes
- Better evented validation and error messages ([#6982](https://github.com/videojs/video.js/pull/6982)) by [@brandonocasey](https://github.com/brandonocasey)
- Prevent dispose error and text track duplicate listeners ([#6984](https://github.com/videojs/video.js/pull/6984)) by [@brandonocasey](https://github.com/brandonocasey)
- *(fs)* Make sure handlers are unique per player ([#7035](https://github.com/videojs/video.js/pull/7035)) by [@gkatsev](https://github.com/gkatsev)
- *(time-display)* Fix IE11 appending times instead of replacing ([#7059](https://github.com/videojs/video.js/pull/7059)) by [@gkatsev](https://github.com/gkatsev)
- Only preventDefault if event is cancelable ([#7063](https://github.com/videojs/video.js/pull/7063)) by [@ckybonist](https://github.com/ckybonist)
- *(lang)* Update nn.json ([#7054](https://github.com/videojs/video.js/pull/7054)) by [@ghveem](https://github.com/ghveem)

### 📚 Documentation
- Change master to main ([#7050](https://github.com/videojs/video.js/pull/7050)) by [@brandonocasey](https://github.com/brandonocasey)

### ⚙️ Miscellaneous Tasks
- Netlify ci demo and docs ([#7045](https://github.com/videojs/video.js/pull/7045)) by [@brandonocasey](https://github.com/brandonocasey)

### New Contributors
* @ghveem made their first contribution
* @ckybonist made their first contribution in [#7063](https://github.com/videojs/video.js/pull/7063)

## [7.11.2] - 2021-01-14

### 🐛 Bug Fixes
- *(player)* Ensure fluid works when dimensions not initially known ([#7023](https://github.com/videojs/video.js/pull/7023)) by [@mister-ben](https://github.com/mister-ben)
- Set liveWindow to 0 liveCurrentTime is Infinity ([#7034](https://github.com/videojs/video.js/pull/7034)) by [@brandonocasey](https://github.com/brandonocasey)

### 📚 Documentation
- *(faq)* Fixup autoplay blogpost url ([#7027](https://github.com/videojs/video.js/pull/7027)) by [@gkatsev](https://github.com/gkatsev)
- Add note to legacy notes  ([#7022](https://github.com/videojs/video.js/pull/7022)) by [@mister-ben](https://github.com/mister-ben)

### 🧪 Testing
- Update ci workflow to prevent install failures ([#7041](https://github.com/videojs/video.js/pull/7041)) by [@brandonocasey](https://github.com/brandonocasey)

### ⚙️ Miscellaneous Tasks
- *(package)* Update to @videojs/http-streaming@2.4.2 ([#7042](https://github.com/videojs/video.js/pull/7042)) by [@gkatsev](https://github.com/gkatsev)

## [7.11.1] - 2020-12-22

### 🚀 Features
- *(lang)* Add Slovene language translation ([#6959](https://github.com/videojs/video.js/pull/6959)) by [@icokk](https://github.com/icokk)

### 🐛 Bug Fixes
- *(rollup)* Browser globals shouldn't be external ([#6954](https://github.com/videojs/video.js/pull/6954)) by [@gkatsev](https://github.com/gkatsev)
- Play progress time tooltip from jittering during live ([#6968](https://github.com/videojs/video.js/pull/6968)) by [@brandonocasey](https://github.com/brandonocasey)
- *(package)* Update to @videojs/http-streaming@2.4.0 ([#6986](https://github.com/videojs/video.js/pull/6986)) by [@gkatsev](https://github.com/gkatsev)
- *(time-display)* Add a null check for text node ([#6977](https://github.com/videojs/video.js/pull/6977)) by [@kontrollanten](https://github.com/kontrollanten)
- Clear readyQueue with dispose ([#6967](https://github.com/videojs/video.js/pull/6967)) by [@brandonocasey](https://github.com/brandonocasey)
- *(MapSham)* Fix set method to use map property ([#7000](https://github.com/videojs/video.js/pull/7000)) by [@aildermi](https://github.com/aildermi)
- *(package)* Update to @videojs/http-streaming@2.4.1 ([#7010](https://github.com/videojs/video.js/pull/7010)) by [@gkatsev](https://github.com/gkatsev)

### 📚 Documentation
- Remove Flash ([#6994](https://github.com/videojs/video.js/pull/6994)) by [@mister-ben](https://github.com/mister-ben)

### ⚙️ Miscellaneous Tasks
- Move unit test build right below main for faster watch ([#6953](https://github.com/videojs/video.js/pull/6953)) by [@brandonocasey](https://github.com/brandonocasey)

### New Contributors
* @aildermi made their first contribution in [#7000](https://github.com/videojs/video.js/pull/7000)
* @kontrollanten made their first contribution in [#6977](https://github.com/videojs/video.js/pull/6977)
* @icokk made their first contribution in [#6959](https://github.com/videojs/video.js/pull/6959)

## [7.11.0] - 2020-11-16

### 🚀 Features
- Trigger languagechange event on a language change ([#6891](https://github.com/videojs/video.js/pull/6891)) by [@marcodeltorob](https://github.com/marcodeltorob)
- *(tech)* Add a scrubbing getter. ([#6920](https://github.com/videojs/video.js/pull/6920)) by [@gkatsev](https://github.com/gkatsev)
- *(track)* Make label property mutable and fire a labelchange event when the label is changed ([#6928](https://github.com/videojs/video.js/pull/6928)) by [@claudiah12](https://github.com/claudiah12)
- *(lang)* Add thai language translations ([#6945](https://github.com/videojs/video.js/pull/6945)) by [@jonoyeong](https://github.com/jonoyeong)

### 🐛 Bug Fixes
- *(package)* Update to @videojs/http-streaming@2.3.0 ([#6941](https://github.com/videojs/video.js/pull/6941)) by [@gkatsev](https://github.com/gkatsev)
- *(menu)* Focus correct MenuItem on keyboard open ([#6914](https://github.com/videojs/video.js/pull/6914)) by [@acmertz](https://github.com/acmertz)
- Always set tabIndex to restore keydown a11y ([#6871](https://github.com/videojs/video.js/pull/6871)) by [@zmousm](https://github.com/zmousm)
- *(css)* Set seek to live button's align-items prop to center ([#6942](https://github.com/videojs/video.js/pull/6942)) by [@genofire](https://github.com/genofire)
- Cast TOUCH_ENABLED to boolean ([#6943](https://github.com/videojs/video.js/pull/6943)) by [@third774](https://github.com/third774)

### 📚 Documentation
- Change blog links to most recent blog version, fix typo ([#6904](https://github.com/videojs/video.js/pull/6904)) by [@aminamos](https://github.com/aminamos)

### ⚙️ Miscellaneous Tasks
- Setup Github CI ([#6940](https://github.com/videojs/video.js/pull/6940)) by [@gkatsev](https://github.com/gkatsev)
- *(sandbox)* Switch all urls to https ([#6946](https://github.com/videojs/video.js/pull/6946)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @third774 made their first contribution in [#6943](https://github.com/videojs/video.js/pull/6943)
* @genofire made their first contribution in [#6942](https://github.com/videojs/video.js/pull/6942)
* @jonoyeong made their first contribution in [#6945](https://github.com/videojs/video.js/pull/6945)
* @claudiah12 made their first contribution in [#6928](https://github.com/videojs/video.js/pull/6928)
* @zmousm made their first contribution in [#6871](https://github.com/videojs/video.js/pull/6871)
* @aminamos made their first contribution in [#6904](https://github.com/videojs/video.js/pull/6904)
* @acmertz made their first contribution in [#6914](https://github.com/videojs/video.js/pull/6914)

## [7.10.2] - 2020-11-04

### 🐛 Bug Fixes
- *(package)* Update to VHS 2.2.4 ([#6925](https://github.com/videojs/video.js/pull/6925)) by [@gkatsev](https://github.com/gkatsev)

## [7.10.1] - 2020-10-15

## [7.10.0] - 2020-10-14

### 🚀 Features
- Update to @videojs/http-streaming@2.2.3 ([#6867](https://github.com/videojs/video.js/pull/6867)) by [@gkatsev](https://github.com/gkatsev)

## [7.9.7] - 2020-10-06

### 🐛 Bug Fixes
- *(text-track)* Don't overlap captions when font-size changes ([#6874](https://github.com/videojs/video.js/pull/6874)) by [@gkatsev](https://github.com/gkatsev)

## [7.9.6] - 2020-10-01

### 🐛 Bug Fixes
- *(dom)* Vertical getPointerPosition value ([#6864](https://github.com/videojs/video.js/pull/6864)) by [@gkatsev](https://github.com/gkatsev)

### 📚 Documentation
- Fix simple typo, intial -> initial ([#6851](https://github.com/videojs/video.js/pull/6851)) by [@timgates42](https://github.com/timgates42)

### New Contributors
* @timgates42 made their first contribution in [#6851](https://github.com/videojs/video.js/pull/6851)

## [7.9.5] - 2020-09-10

## [7.9.4] - 2020-09-10

### 🐛 Bug Fixes
- Better mouse position handling ([#5773](https://github.com/videojs/video.js/pull/5773)) by [@iosamuel](https://github.com/iosamuel)

### ⚙️ Miscellaneous Tasks
- *(package)* Update @videojs/http-streaming to 1.13.4 ([#6839](https://github.com/videojs/video.js/pull/6839)) by [@gkatsev](https://github.com/gkatsev)

## [7.9.3] - 2020-08-17

### 🐛 Bug Fixes
- *(lang)* Add PiP to de ([#6803](https://github.com/videojs/video.js/pull/6803)) by [@mister-ben](https://github.com/mister-ben)
- *(tech)* Add abstract setScrubbing in tech.js ([#6808](https://github.com/videojs/video.js/pull/6808)) by [@gkatsev](https://github.com/gkatsev)

### 📚 Documentation
- Fix typo ([#6760](https://github.com/videojs/video.js/pull/6760)) by [@alimony](https://github.com/alimony)
- *(README)* Fix link to getting Video.js from npm ([#6761](https://github.com/videojs/video.js/pull/6761))

### New Contributors
* @alimony made their first contribution in [#6760](https://github.com/videojs/video.js/pull/6760)

## [7.9.2] - 2020-07-20

### 🐛 Bug Fixes
- *(tech)* Add abstract crossOrigin method on Tech ([#6765](https://github.com/videojs/video.js/pull/6765)) by [@gkatsev](https://github.com/gkatsev)

## [7.9.1] - 2020-07-13

### 🐛 Bug Fixes
- Limit fastSeek to Safari based browsers only ([#6752](https://github.com/videojs/video.js/pull/6752)) by [@gkatsev](https://github.com/gkatsev)

## [7.9.0] - 2020-07-10

### 🚀 Features
- Support fastSeek during scrubbing if available ([#6525](https://github.com/videojs/video.js/pull/6525)) by [@gkatsev](https://github.com/gkatsev)
- Adds disablePictureInPicture method to the player API. ([#6378](https://github.com/videojs/video.js/pull/6378)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- Add named requestAnimationFrame to prevent performance issues ([#6627](https://github.com/videojs/video.js/pull/6627)) by [@brandonocasey](https://github.com/brandonocasey)
- Add a default, plugin-specific logger to advanced plugins ([#6693](https://github.com/videojs/video.js/pull/6693)) by [@misteroneill](https://github.com/misteroneill)
- Add debug mode ([#6687](https://github.com/videojs/video.js/pull/6687)) by [@ipadilla4](https://github.com/ipadilla4)
- Add support for CAF, FLAC and WAV formats in known mimetypes ([#6657](https://github.com/videojs/video.js/pull/6657)) by [@yuyichao](https://github.com/yuyichao)

### 🐛 Bug Fixes
- *(lang)* Update pt-BR.json ([#6598](https://github.com/videojs/video.js/pull/6598)) by [@thalleskoester](https://github.com/thalleskoester)
- *(package)* Update to @videojs/http-streaming@1.13.3 ([#6610](https://github.com/videojs/video.js/pull/6610)) by [@gkatsev](https://github.com/gkatsev)
- *(text-tracks)* Set withCredentials on XHR if crossOrigin='use-credentials' ([#6588](https://github.com/videojs/video.js/pull/6588)) by [@gkatsev](https://github.com/gkatsev)
- AddChild with index should allow for children that are elements ([#6644](https://github.com/videojs/video.js/pull/6644)) by [@mister-ben](https://github.com/mister-ben)
- *(fs)* Don't set player element css props on native fullscreen ([#6673](https://github.com/videojs/video.js/pull/6673)) by [@gkatsev](https://github.com/gkatsev)
- Disable PIP if tech doesn't support it ([#6678](https://github.com/videojs/video.js/pull/6678)) by [@mister-ben](https://github.com/mister-ben)
- Add PiP to zh-CN.json ([#6680](https://github.com/videojs/video.js/pull/6680)) by [@zhcj](https://github.com/zhcj)
- Use clamp correctly in progress control ([#6625](https://github.com/videojs/video.js/pull/6625)) by [@brandonocasey](https://github.com/brandonocasey)
- Fullscreen broken in iOS ([#6735](https://github.com/videojs/video.js/pull/6735)) by [@alex-barstow](https://github.com/alex-barstow)

### 📚 Documentation
- *(faq)* Update FAQ about HLS and DASH with VHS ([#6608](https://github.com/videojs/video.js/pull/6608)) by [@gkatsev](https://github.com/gkatsev)
- *(README)* Update CDN version urls ([#6658](https://github.com/videojs/video.js/pull/6658)) by [@soroushchehresa](https://github.com/soroushchehresa)

### 🧪 Testing
- Skip requestPictureInPicture test if API isn't available ([#6719](https://github.com/videojs/video.js/pull/6719)) by [@gkatsev](https://github.com/gkatsev)

### ⚙️ Miscellaneous Tasks
- Remove "flash" and add "dash" in keywords about video.js ([#6692](https://github.com/videojs/video.js/pull/6692)) by [@OwenEdwards](https://github.com/OwenEdwards)
- Update travis-ci badge by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @yuyichao made their first contribution in [#6657](https://github.com/videojs/video.js/pull/6657)
* @ipadilla4 made their first contribution in [#6687](https://github.com/videojs/video.js/pull/6687)
* @zhcj made their first contribution in [#6680](https://github.com/videojs/video.js/pull/6680)
* @soroushchehresa made their first contribution in [#6658](https://github.com/videojs/video.js/pull/6658)
* @thalleskoester made their first contribution in [#6598](https://github.com/videojs/video.js/pull/6598)

## [7.8.1] - 2020-04-16

### 🐛 Bug Fixes
- Update being called on seekbar during dispose ([#6576](https://github.com/videojs/video.js/pull/6576)) by [@brandonocasey](https://github.com/brandonocasey)

### 📚 Documentation
- *(angular)* Fix demo for angular v8+. ([#6581](https://github.com/videojs/video.js/pull/6581)) by [@hv0905](https://github.com/hv0905)

### New Contributors
* @hv0905 made their first contribution in [#6581](https://github.com/videojs/video.js/pull/6581)

## [7.8.0] - 2020-04-06

### 🚀 Features
- Improve currentTime to allow it to be called before player is ready ([#6507](https://github.com/videojs/video.js/pull/6507)) by [@marcosmx](https://github.com/marcosmx)
- *(fs)* Return a promise from requestFullscreen and exitFullscreen when we can ([#6424](https://github.com/videojs/video.js/pull/6424)) by [@gkatsev](https://github.com/gkatsev)
- Add a function for getting descendants from components ([#6519](https://github.com/videojs/video.js/pull/6519)) by [@brandonocasey](https://github.com/brandonocasey)
- *(cors)* Allow both crossOrigin and crossorigin method and options ([#6571](https://github.com/videojs/video.js/pull/6571)) by [@gkatsev](https://github.com/gkatsev)

### 🐛 Bug Fixes
- *(lang)* Update zn-CH translations ([#6546](https://github.com/videojs/video.js/pull/6546)) by [@kslr](https://github.com/kslr)
- *(package)* Update @videojs/http-streaming to version 1.13.0 🚀 ([#6547](https://github.com/videojs/video.js/pull/6547)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update @videojs/http-streaming to version 1.13.1 🚀 ([#6548](https://github.com/videojs/video.js/pull/6548)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(liveui)* Tweaks to prevent jitter ([#6405](https://github.com/videojs/video.js/pull/6405)) by [@brandonocasey](https://github.com/brandonocasey)
- *(package)* Update @videojs/http-streaming to version 1.13.2 🚀 ([#6558](https://github.com/videojs/video.js/pull/6558)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])

### ⚙️ Miscellaneous Tasks
- *(package)* Update rollup to version 2.2.0 🚀 ([#6542](https://github.com/videojs/video.js/pull/6542)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])

### New Contributors
* @sodabrew made their first contribution in [#6533](https://github.com/videojs/video.js/pull/6533)
* @kslr made their first contribution in [#6546](https://github.com/videojs/video.js/pull/6546)

## [7.7.6] - 2020-03-25

### 🐛 Bug Fixes
- *(lang)* Improve Persian translation ([#6468](https://github.com/videojs/video.js/pull/6468)) by [@EhsanCh](https://github.com/EhsanCh)
- Detect chromium-based Edge ([#6497](https://github.com/videojs/video.js/pull/6497)) by [@gkatsev](https://github.com/gkatsev)
- Fix a typo in en translation file ([#6505](https://github.com/videojs/video.js/pull/6505)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- Add a threshold of 30s for the liveui to show ([#6409](https://github.com/videojs/video.js/pull/6409)) by [@brandonocasey](https://github.com/brandonocasey)
- DRM content goes black in IE/Edge when focus is placed on video element ([#6508](https://github.com/videojs/video.js/pull/6508)) by [@bcdarius](https://github.com/bcdarius)
- Trigger change events on remoteTextTrack when nativeTextTrack is set to true ([#6410](https://github.com/videojs/video.js/pull/6410)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update @videojs/http-streaming to version 1.12.3 🚀 ([#6527](https://github.com/videojs/video.js/pull/6527)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])

### 📚 Documentation
- *(player)* Fix addRemoteTextTrack description of manualCleanup option ([#6521](https://github.com/videojs/video.js/pull/6521)) by [@gkatsev](https://github.com/gkatsev)
- Add an example Angular integration ([#6390](https://github.com/videojs/video.js/pull/6390)) by [@xx4159](https://github.com/xx4159)

### ⚙️ Miscellaneous Tasks
- *(package)* Upgrade to babel 7.9 and enable bugfixes ([#6541](https://github.com/videojs/video.js/pull/6541)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @xx4159 made their first contribution in [#6390](https://github.com/videojs/video.js/pull/6390)

## [7.7.5] - 2020-02-19

### 🐛 Bug Fixes
- Slider screenreader value returning as NaN ([#6404](https://github.com/videojs/video.js/pull/6404)) by [@brandonocasey](https://github.com/brandonocasey)
- Improves control bar hiding functionality ([#6400](https://github.com/videojs/video.js/pull/6400)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- *(lang)* Add missing Arabic translations ([#6435](https://github.com/videojs/video.js/pull/6435)) by [@misteroneill](https://github.com/misteroneill)
- *(package)* Update @videojs/http-streaming to version 1.12.1 ([#6467](https://github.com/videojs/video.js/pull/6467)) by [@gkatsev](https://github.com/gkatsev)
- Current time tooltip does not update ([#6445](https://github.com/videojs/video.js/pull/6445)) by [@marcosmx](https://github.com/marcosmx)
- *(package)* Update @videojs/http-streaming to version 1.12.2 🚀 ([#6469](https://github.com/videojs/video.js/pull/6469)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])

### 🚜 Refactor
- Use Fn.UPDATE_REFRESH_INTERVAL in seekBar & liveTracker ([#6407](https://github.com/videojs/video.js/pull/6407)) by [@brandonocasey](https://github.com/brandonocasey)
- Support requestFullscreen's promise, better internal handling of events ([#6422](https://github.com/videojs/video.js/pull/6422)) by [@gkatsev](https://github.com/gkatsev)

### ⚙️ Miscellaneous Tasks
- *(travis)* Test on ubuntu 18 (bionic) ([#6399](https://github.com/videojs/video.js/pull/6399)) by [@thijstriemstra](https://github.com/thijstriemstra)

### New Contributors
* @marcosmx made their first contribution in [#6445](https://github.com/videojs/video.js/pull/6445)

## [7.7.4] - 2019-12-24

### 🐛 Bug Fixes
- Broken logo link in README and docs ([#6345](https://github.com/videojs/video.js/pull/6345)) by [@dylanjha](https://github.com/dylanjha)
- IS_IPAD should be false on iPhone ([#6371](https://github.com/videojs/video.js/pull/6371)) by [@gkatsev](https://github.com/gkatsev)
- Updates seekbar position after mouse up event is triggered. ([#6372](https://github.com/videojs/video.js/pull/6372)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)

### ◀️ Revert
- Revert "fix(iOS): pause player on suspend or stalled if extra buffer is available ([#6199](https://github.com/videojs/video.js/pull/6199))" ([#6373](https://github.com/videojs/video.js/pull/6373)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @dylanjha made their first contribution in [#6345](https://github.com/videojs/video.js/pull/6345)

## [7.7.3] - 2019-12-02

### ⚙️ Miscellaneous Tasks
- Update package-lock.json by [@gkatsev](https://github.com/gkatsev)

## [7.7.2] - 2019-12-02

### 🐛 Bug Fixes
- *(package)* Update videojs-vtt.js to version 0.15.2 ([#6333](https://github.com/videojs/video.js/pull/6333)) by [@gkatsev](https://github.com/gkatsev)
- Turn on strict mode again ([#6334](https://github.com/videojs/video.js/pull/6334)) by [@gkatsev](https://github.com/gkatsev)
- *(sass)* Import path has cwd once again ([#6326](https://github.com/videojs/video.js/pull/6326)) by [@tsi](https://github.com/tsi)

### New Contributors
* @tsi made their first contribution in [#6326](https://github.com/videojs/video.js/pull/6326)

## [7.7.1] - 2019-11-22

### 🐛 Bug Fixes
- *(extend)* Super_ should be available for backwards compatibility ([#6329](https://github.com/videojs/video.js/pull/6329)) by [@gkatsev](https://github.com/gkatsev)

## [7.7.0] - 2019-11-19

### 🚀 Features
- Allow a click handler to be specified in clickable component's options ([#6140](https://github.com/videojs/video.js/pull/6140)) by [@mister-ben](https://github.com/mister-ben)
- Cap log history at 1000 items ([#6192](https://github.com/videojs/video.js/pull/6192)) by [@brandonocasey](https://github.com/brandonocasey)
- Add isDisposed method to components ([#6099](https://github.com/videojs/video.js/pull/6099)) by [@misteroneill](https://github.com/misteroneill)
- Option to load text tracks on demand vs preload ([#6043](https://github.com/videojs/video.js/pull/6043)) by [@bvibber](https://github.com/bvibber)
- Add core ES module. ([#6287](https://github.com/videojs/video.js/pull/6287)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- Resets pastSeekEnd_ variable. ([#6249](https://github.com/videojs/video.js/pull/6249)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)

### 🐛 Bug Fixes
- Allow player dimension method to accept 'auto' ([#6185](https://github.com/videojs/video.js/pull/6185)) by [@klee-frankly](https://github.com/klee-frankly)
- *(iOS)* Pause player on suspend or stalled if extra buffer is available ([#6199](https://github.com/videojs/video.js/pull/6199)) by [@marcodeltorob](https://github.com/marcodeltorob)
- Make suppressing no source error compatible with videojs-errors ([#6217](https://github.com/videojs/video.js/pull/6217)) by [@mister-ben](https://github.com/mister-ben)
- *(lang)* Update Norwegian translations ([#6220](https://github.com/videojs/video.js/pull/6220)) by [@danmichaelo](https://github.com/danmichaelo)
- *(lang)* Fixed typos in german translation ([#6275](https://github.com/videojs/video.js/pull/6275)) by [@philipp-birkl](https://github.com/philipp-birkl)
- Ensure the default ID of the first player is 'vjs_video_3' as some people have relied on this ([#6216](https://github.com/videojs/video.js/pull/6216)) by [@misteroneill](https://github.com/misteroneill)
- Bring back Android 4.x support ([#6289](https://github.com/videojs/video.js/pull/6289)) by [@gkatsev](https://github.com/gkatsev)
- Ensure components added with an index are added in the correct location ([#6297](https://github.com/videojs/video.js/pull/6297)) by [@mister-ben](https://github.com/mister-ben)
- Detect iPadOS as IS_IPAD ([#6319](https://github.com/videojs/video.js/pull/6319)) by [@marcodeltorob](https://github.com/marcodeltorob)
- DRMed content goes black in IE/Edge when video element focused ([#6318](https://github.com/videojs/video.js/pull/6318)) by [@alex-barstow](https://github.com/alex-barstow)
- *(pkg)* Update @videojs/http-streaming to 1.11.2 ([#6323](https://github.com/videojs/video.js/pull/6323)) by [@gkatsev](https://github.com/gkatsev)

### 📚 Documentation
- Update Components list ([#6253](https://github.com/videojs/video.js/pull/6253)) by [@gkatsev](https://github.com/gkatsev)
- Add note about SubsCapsButton only showing up when configured with text tracks ([#6254](https://github.com/videojs/video.js/pull/6254)) by [@OwenEdwards](https://github.com/OwenEdwards)

### ⚡ Performance
- Another 5ms of startup time improvements  ([#6145](https://github.com/videojs/video.js/pull/6145)) by [@brandonocasey](https://github.com/brandonocasey)
- Only update ui on change, wrap things in requestAnimationFrame ([#6155](https://github.com/videojs/video.js/pull/6155)) by [@brandonocasey](https://github.com/brandonocasey)
- Save 3740 bytes gizpped by getting rid of xhr deps ([#6164](https://github.com/videojs/video.js/pull/6164)) by [@brandonocasey](https://github.com/brandonocasey)

### 🧪 Testing
- Run tests via rollup ([#5601](https://github.com/videojs/video.js/pull/5601)) by [@brandonocasey](https://github.com/brandonocasey)

### ⚙️ Miscellaneous Tasks
- Package json cleanup ([#5649](https://github.com/videojs/video.js/pull/5649)) by [@brandonocasey](https://github.com/brandonocasey)
- Ignore sandbox during linting ([#6208](https://github.com/videojs/video.js/pull/6208)) by [@gkatsev](https://github.com/gkatsev)
- Include changelog from 7.6.x branch by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @marcodeltorob made their first contribution in [#6319](https://github.com/videojs/video.js/pull/6319)
* @philipp-birkl made their first contribution in [#6275](https://github.com/videojs/video.js/pull/6275)
* @bvibber made their first contribution in [#6043](https://github.com/videojs/video.js/pull/6043)
* @danmichaelo made their first contribution in [#6220](https://github.com/videojs/video.js/pull/6220)
* @klee-frankly made their first contribution in [#6185](https://github.com/videojs/video.js/pull/6185)

## [7.6.6] - 2019-11-07

### 🐛 Bug Fixes
- Bring back Android 4.x support ([#6289](https://github.com/videojs/video.js/issues/6289))

## [7.6.5] - 2019-09-05

### 🐛 Bug Fixes
- Ensure the default ID of the first player is 'vjs_video_3' as some people have relied on this ([#6216](https://github.com/videojs/video.js/issues/6216)), closes [#6103](https://github.com/videojs/video.js/issues/6103)

## [7.6.4] - 2019-08-28

### 🐛 Bug Fixes
- Adds space between vjs-live-display and vjs-volume-control controls. ([#6200](https://github.com/videojs/video.js/pull/6200)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- Make live UI button more consistent ([#6201](https://github.com/videojs/video.js/pull/6201)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)

### ⚙️ Miscellaneous Tasks
- *(package)* Update http-streaming to 1.10.6 ([#6205](https://github.com/videojs/video.js/pull/6205)) by [@gkatsev](https://github.com/gkatsev)

## [7.6.3] - 2019-08-22

### 🐛 Bug Fixes
- Remove deprecated tsml dependency ([#6174](https://github.com/videojs/video.js/pull/6174)) by [@brandonocasey](https://github.com/brandonocasey)
- Do not handle hotkeys in contenteditable elements ([#6182](https://github.com/videojs/video.js/pull/6182)) by [@misteroneill](https://github.com/misteroneill)
- Make 'Esc' works for a vertical volume bar and menus ([#6046](https://github.com/videojs/video.js/pull/6046)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)

## [7.6.2] - 2019-08-07

### 🐛 Bug Fixes
- *(lang)* Update Spanish translations ([#6065](https://github.com/videojs/video.js/pull/6065))
- *(lang)* Add missing strings for Chinese (Simplified) and Chinese (Traditional) ([#6149](https://github.com/videojs/video.js/pull/6149)) by [@misteroneill](https://github.com/misteroneill)

### ⚡ Performance
- Use WeakMap for dom data ([#6103](https://github.com/videojs/video.js/pull/6103)) by [@brandonocasey](https://github.com/brandonocasey)
- Improve performance of toTitleCase, register with lower and TitleCase ([#6148](https://github.com/videojs/video.js/pull/6148)) by [@brandonocasey](https://github.com/brandonocasey)
- Do not add/remove listeners for each timer ([#6144](https://github.com/videojs/video.js/pull/6144)) by [@brandonocasey](https://github.com/brandonocasey)

### 🧪 Testing
- Silence test logs ([#6165](https://github.com/videojs/video.js/pull/6165)) by [@brandonocasey](https://github.com/brandonocasey)

### ⚙️ Miscellaneous Tasks
- Fix lang watch loop caused by zh-* copy ([#6147](https://github.com/videojs/video.js/pull/6147)) by [@brandonocasey](https://github.com/brandonocasey)

## [7.6.1] - 2019-07-30

### 🐛 Bug Fixes
- *(pip)* Hide PiP button in browsers not support the WICG spec ([#6131](https://github.com/videojs/video.js/pull/6131)) by [@gkatsev](https://github.com/gkatsev)
- Improves isSingleLeftClick() to handle mousemove ([#6138](https://github.com/videojs/video.js/pull/6138)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- *(component)* Use safe computedStyle in currentDimension ([#6073](https://github.com/videojs/video.js/pull/6073)) by [@TVS-Bruno](https://github.com/TVS-Bruno)

### 💼 Other
- Clone zh-CN to zh-Hans and zh-TW to zh-Hant ([#6098](https://github.com/videojs/video.js/pull/6098)) by [@misteroneill](https://github.com/misteroneill)

### 🚜 Refactor
- Use the new `any` event function ([#6080](https://github.com/videojs/video.js/pull/6080)) by [@brandonocasey](https://github.com/brandonocasey)

### ⚡ Performance
- Save ~10ms on `player.src` call ([#6141](https://github.com/videojs/video.js/pull/6141)) by [@brandonocasey](https://github.com/brandonocasey)
- Throttle more timers and use native bind ([#6142](https://github.com/videojs/video.js/pull/6142)) by [@brandonocasey](https://github.com/brandonocasey)

### ⚙️ Miscellaneous Tasks
- Update videojs-generate-karma-config to ~5.2.1 and remove patches ([#6104](https://github.com/videojs/video.js/pull/6104)) by [@brandonocasey](https://github.com/brandonocasey)
- Switch from deprecated `jsnext`, `main` options to mainFields ([#6075](https://github.com/videojs/video.js/pull/6075)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)

### ◀️ Revert
- "fix(play-toggle): call event.stopPropagation in the click handler ([#5803](https://github.com/videojs/video.js/pull/5803))" ([#6128](https://github.com/videojs/video.js/pull/6128)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @TVS-Bruno made their first contribution in [#6073](https://github.com/videojs/video.js/pull/6073)

## [7.6.0] - 2019-06-20

### 🚀 Features
- *(middleware)* Allow middleware to handle volume setter and getter ([#5906](https://github.com/videojs/video.js/pull/5906)) by [@OwenEdwards](https://github.com/OwenEdwards)
- Add 'audio/mp4' mimetype for m4a files ([#5982](https://github.com/videojs/video.js/pull/5982)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- *(lang)* Add Scottish Gaelic (gd.json) translation ([#5972](https://github.com/videojs/video.js/pull/5972)) by [@gunchleoc](https://github.com/gunchleoc)
- Add Picture-in-Picture API methods ([#6001](https://github.com/videojs/video.js/pull/6001)) by [@beaufortfrancois](https://github.com/beaufortfrancois)
- *(events)* Add any function ([#5977](https://github.com/videojs/video.js/pull/5977)) by [@brandonocasey](https://github.com/brandonocasey)
- *(fs)* Support FullscreenOptions ([#5856](https://github.com/videojs/video.js/pull/5856)) by [@apmorton](https://github.com/apmorton)
- Allow displaying of multiple text tracks at once ([#5817](https://github.com/videojs/video.js/pull/5817)) by [@thsbrown](https://github.com/thsbrown)
- Add write method to time tooltips ([#6021](https://github.com/videojs/video.js/pull/6021)) by [@davekiss](https://github.com/davekiss)
- Add built-in Picture-in-Picture button ([#6002](https://github.com/videojs/video.js/pull/6002)) by [@beaufortfrancois](https://github.com/beaufortfrancois)
- Add option to suppress initial error for non-playable sources ([#6057](https://github.com/videojs/video.js/pull/6057)) by [@mister-ben](https://github.com/mister-ben)

### 🐛 Bug Fixes
- Use performance.now() when possible ([#5870](https://github.com/videojs/video.js/pull/5870)) by [@thijstriemstra](https://github.com/thijstriemstra)
- *(player)* Silence rejected fullscreen promise ([#5970](https://github.com/videojs/video.js/pull/5970)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update @videojs/http-streaming to version 1.10.2 🚀 ([#5991](https://github.com/videojs/video.js/pull/5991)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Change 'mousedown' to the 'mouseup' event in the player ([#5992](https://github.com/videojs/video.js/pull/5992)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- *(package)* Update @videojs/http-streaming to version 1.10.3 🚀 ([#6019](https://github.com/videojs/video.js/pull/6019)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(fs)* Feature detect el.matches() for IE11 ([#6007](https://github.com/videojs/video.js/pull/6007)) by [@gkatsev](https://github.com/gkatsev)
- Group subtitles and captions when switching tracks ([#6008](https://github.com/videojs/video.js/pull/6008))
- Make sure hotkeys are not triggered outside the player or in form fields within the player ([#5969](https://github.com/videojs/video.js/pull/5969)) by [@misteroneill](https://github.com/misteroneill)
- *(lang)* Update German translations ([#6058](https://github.com/videojs/video.js/pull/6058)) by [@mister-ben](https://github.com/mister-ben)
- *(play-toggle)* Call event.stopPropagation in the click handler ([#5803](https://github.com/videojs/video.js/pull/5803)) by [@mscalora](https://github.com/mscalora)
- Always pass event object to click handler ([#6059](https://github.com/videojs/video.js/pull/6059)) by [@gkatsev](https://github.com/gkatsev)
- Handle esc key properly inside of the CloseButton ([#6050](https://github.com/videojs/video.js/pull/6050)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- Undeprecate options() ([#6056](https://github.com/videojs/video.js/pull/6056)) by [@gkatsev](https://github.com/gkatsev)
- *(liveui)* Do not seek to live on first seek when autoplaying a live stream ([#6062](https://github.com/videojs/video.js/pull/6062)) by [@misteroneill](https://github.com/misteroneill)

### 🚜 Refactor
- Switch to fullscreen.options ([#6054](https://github.com/videojs/video.js/pull/6054)) by [@gkatsev](https://github.com/gkatsev)
- *(pip)* Rely only on WICG spec events ([#6064](https://github.com/videojs/video.js/pull/6064)) by [@gkatsev](https://github.com/gkatsev)

### 📚 Documentation
- Emphasize src object and video-js element ([#5960](https://github.com/videojs/video.js/pull/5960)) by [@mister-ben](https://github.com/mister-ben)
- Update guides markdown ([#6063](https://github.com/videojs/video.js/pull/6063)) by [@gkatsev](https://github.com/gkatsev)

### 🧪 Testing
- Restore prototype modifications and fix flaky tests ([#5964](https://github.com/videojs/video.js/pull/5964)) by [@brandonocasey](https://github.com/brandonocasey)

### ⚙️ Miscellaneous Tasks
- *(package)* Update videojs-generate-karma-config to version 5.2.0 🚀 ([#5935](https://github.com/videojs/video.js/pull/5935)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Don't log karma config ([#5955](https://github.com/videojs/video.js/pull/5955)) by [@gkatsev](https://github.com/gkatsev)
- *(test)* Upgrade to latest sinon ([#5954](https://github.com/videojs/video.js/pull/5954)) by [@gkatsev](https://github.com/gkatsev)
- Change rollup config so that npm run watch works ([#5966](https://github.com/videojs/video.js/pull/5966)) by [@squarebracket](https://github.com/squarebracket)
- Add a sandbox page for testing autoplay values. ([#5933](https://github.com/videojs/video.js/pull/5933)) by [@brandonocasey](https://github.com/brandonocasey)
- Add Affects: a11y and switch to outdated label ([#6015](https://github.com/videojs/video.js/pull/6015)) by [@gkatsev](https://github.com/gkatsev)
- Update dependencies ([#6036](https://github.com/videojs/video.js/pull/6036)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update rollup to version 1.15.1 ([#6042](https://github.com/videojs/video.js/pull/6042)) by [@gkatsev](https://github.com/gkatsev)
- Fixup merge issue with #6001 ([#6053](https://github.com/videojs/video.js/pull/6053)) by [@gkatsev](https://github.com/gkatsev)
- Switch to dart-sass ([#6055](https://github.com/videojs/video.js/pull/6055)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @beaufortfrancois made their first contribution in [#6002](https://github.com/videojs/video.js/pull/6002)
* @mscalora made their first contribution in [#5803](https://github.com/videojs/video.js/pull/5803)
* @apmorton made their first contribution in [#5856](https://github.com/videojs/video.js/pull/5856)
* @gunchleoc made their first contribution in [#5972](https://github.com/videojs/video.js/pull/5972)

## [7.5.6] - 2019-06-20

### 🐛 Bug Fixes
- *(liveui)* Do not seek to live on first seek when autoplaying a live stream ([#6062](https://github.com/videojs/video.js/issues/6062))

## [7.5.5] - 2019-05-30

### 🐛 Bug Fixes
- *(fs)* Feature detect el.matches() for IE11 ([#6007](https://github.com/videojs/video.js/issues/6007))
- Group subtitles and captions when switching tracks ([#6008](https://github.com/videojs/video.js/issues/6008)), closes [#5741](https://github.com/videojs/video.js/issues/5741)
- *(fs)* Fix isFullscreen check for spec-api ([#6009](https://github.com/videojs/video.js/issues/6009)), closes [#5814](https://github.com/videojs/video.js/issues/5814)
- Make sure hotkeys are not triggered outside the player or in form fields within the player ([#5969](https://github.com/videojs/video.js/issues/5969))

## [7.5.4] - 2019-04-12

### 🐛 Bug Fixes
- Always show the mute button by default in responsive mode ([#5914](https://github.com/videojs/video.js/pull/5914)) by [@misteroneill](https://github.com/misteroneill)
- Hide the progress control and show the subs-caps button when using Live UI at extra small size ([#5915](https://github.com/videojs/video.js/pull/5915)) by [@misteroneill](https://github.com/misteroneill)
- Explicitly remove all document-level listeners on player dispose ([#5929](https://github.com/videojs/video.js/pull/5929)) by [@misteroneill](https://github.com/misteroneill)
- Fix fullscreen detection when player is nested within document fullscreen ([#5912](https://github.com/videojs/video.js/pull/5912))
- Fix bug preventing control bar from hiding on mobile ([#5836](https://github.com/videojs/video.js/pull/5836)) by [@thsbrown](https://github.com/thsbrown)
- Correctly resolve play promise when terminated via middleware ([#5895](https://github.com/videojs/video.js/pull/5895)) by [@brandonocasey](https://github.com/brandonocasey)
- Call reset if we are paused or no promises, otherwise wait for play promise to resolve ([#5876](https://github.com/videojs/video.js/pull/5876)) by [@evanfarina](https://github.com/evanfarina)

### 💼 Other
- Fix typo in de translation ([#5920](https://github.com/videojs/video.js/pull/5920)) by [@maetthu](https://github.com/maetthu)

### 📚 Documentation
- *(ModalDialog)* Add missing documentation for pauseOnOpen ([#5908](https://github.com/videojs/video.js/pull/5908)) by [@mister-ben](https://github.com/mister-ben)

### New Contributors
* @thsbrown made their first contribution in [#5836](https://github.com/videojs/video.js/pull/5836)
* @maetthu made their first contribution in [#5920](https://github.com/videojs/video.js/pull/5920)

## [7.5.3] - 2019-03-29

### 📚 Documentation
- *(live)* Minor spelling/grammar corrections ([#5894](https://github.com/videojs/video.js/pull/5894)) by [@squarebracket](https://github.com/squarebracket)
- Add an example Vue integration.md ([#5899](https://github.com/videojs/video.js/pull/5899)) by [@chopfitzroy](https://github.com/chopfitzroy)

### ⚡ Performance
- *(live-tracker)* Disable live tracker on IE11 when document is hidden ([#5896](https://github.com/videojs/video.js/pull/5896)) by [@brandonocasey](https://github.com/brandonocasey)

### ⚙️ Miscellaneous Tasks
- Add a sandbox for HLS ([#5897](https://github.com/videojs/video.js/pull/5897)) by [@brandonocasey](https://github.com/brandonocasey)

### New Contributors
* @chopfitzroy made their first contribution in [#5899](https://github.com/videojs/video.js/pull/5899)

## [7.5.2] - 2019-03-25

### 🐛 Bug Fixes
- Fix audio and video track selection ([#5890](https://github.com/videojs/video.js/pull/5890)) by [@brandonocasey](https://github.com/brandonocasey)

## [7.5.1] - 2019-03-22

### 🐛 Bug Fixes
- Add inactivityTimeout to reset cache method ([#5788](https://github.com/videojs/video.js/pull/5788)) by [@iosamuel](https://github.com/iosamuel)
- *(package)* Update @videojs/http-streaming to version 1.9.1 🚀 ([#5840](https://github.com/videojs/video.js/pull/5840)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Change max height of menus based on responsive classes. ([#5806](https://github.com/videojs/video.js/pull/5806)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- If play is delayed till loadstart, call load ([#5822](https://github.com/videojs/video.js/pull/5822)) by [@gkatsev](https://github.com/gkatsev)
- *(lang)* Update and correct occitan translations ([#5829](https://github.com/videojs/video.js/pull/5829)) by [@Quenty31](https://github.com/Quenty31)
- Warn on element not in DOM even when from another document ([#5831](https://github.com/videojs/video.js/pull/5831)) by [@KevinBrogan](https://github.com/KevinBrogan)
- Update fullscreen detection when player is nested within another fullscreen element ([#5830](https://github.com/videojs/video.js/pull/5830))
- Ensure that durationDisplay and remainingTimeDisplay exist before calling their 'updateContent' method during reset() ([#5839](https://github.com/videojs/video.js/pull/5839)) by [@evanfarina](https://github.com/evanfarina)
- Use ownerDocument.body.contains for IE11 ([#5872](https://github.com/videojs/video.js/pull/5872)) by [@gkatsev](https://github.com/gkatsev)
- *(resize-manager)* Call super.dispose() in dispose method ([#5853](https://github.com/videojs/video.js/pull/5853)) by [@brandonocasey](https://github.com/brandonocasey)
- *(package)* Update @videojs/http-streaming to version 1.9.2 🚀 ([#5865](https://github.com/videojs/video.js/pull/5865)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Do a null check for tech when checking if we can toggle mute ([#5857](https://github.com/videojs/video.js/pull/5857)) by [@marguinbc](https://github.com/marguinbc)
- *(package)* Update @videojs/http-streaming to version 1.9.3 🚀 ([#5883](https://github.com/videojs/video.js/pull/5883)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(lang)* Improve Chinese translations ([#5834](https://github.com/videojs/video.js/pull/5834))

### 📚 Documentation
- Update format information ([#5783](https://github.com/videojs/video.js/pull/5783)) by [@mister-ben](https://github.com/mister-ben)
- Fixes the return value type of the loop method. ([#5789](https://github.com/videojs/video.js/pull/5789)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- *(audiotracks)* Correct typo ([#5816](https://github.com/videojs/video.js/pull/5816)) by [@squarebracket](https://github.com/squarebracket)
- *(hotkeys)* Hotkeys require player focus ([#5859](https://github.com/videojs/video.js/pull/5859)) by [@thijstriemstra](https://github.com/thijstriemstra)

### ⚡ Performance
- Remove `playerEvent` and extra `timeupdate` handler in SeekBar ([#5852](https://github.com/videojs/video.js/pull/5852)) by [@brandonocasey](https://github.com/brandonocasey)
- Fix an event target memory leak ([#5855](https://github.com/videojs/video.js/pull/5855)) by [@brandonocasey](https://github.com/brandonocasey)
- Fix more memory leaks ([#5860](https://github.com/videojs/video.js/pull/5860)) by [@brandonocasey](https://github.com/brandonocasey)
- *(player)* Turn off all track list listeners on dispose ([#5867](https://github.com/videojs/video.js/pull/5867)) by [@brandonocasey](https://github.com/brandonocasey)
- *(seek-bar)* Don't update play progress when document is hidden ([#5879](https://github.com/videojs/video.js/pull/5879)) by [@gkatsev](https://github.com/gkatsev)
- Fix memory leaks in safari, edge, and ie ([#5880](https://github.com/videojs/video.js/pull/5880)) by [@brandonocasey](https://github.com/brandonocasey)

### 🧪 Testing
- Memory leak fixes in tests ([#5861](https://github.com/videojs/video.js/pull/5861)) by [@brandonocasey](https://github.com/brandonocasey)
- Check dom-data to verify we aren't leaking memory and event handlers ([#5862](https://github.com/videojs/video.js/pull/5862)) by [@brandonocasey](https://github.com/brandonocasey)

### ⚙️ Miscellaneous Tasks
- *(package)* Update @videojs/http-streaming to version 1.9.0 🚀 ([#5784](https://github.com/videojs/video.js/pull/5784)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Pin to firefox 64 ([#5793](https://github.com/videojs/video.js/pull/5793)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update patch-package to version 6.0.2 ([#5792](https://github.com/videojs/video.js/pull/5792)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update videojs-generate-karma-config to version 5.1.0 🚀 ([#5843](https://github.com/videojs/video.js/pull/5843)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(text-track)* Fix it's/its typo ([#5868](https://github.com/videojs/video.js/pull/5868)) by [@squarebracket](https://github.com/squarebracket)

### New Contributors
* @marguinbc made their first contribution in [#5857](https://github.com/videojs/video.js/pull/5857)
* @KevinBrogan made their first contribution in [#5831](https://github.com/videojs/video.js/pull/5831)
* @iosamuel made their first contribution in [#5788](https://github.com/videojs/video.js/pull/5788)
* @Kogoruhn made their first contribution in [#5785](https://github.com/videojs/video.js/pull/5785)

## [7.5.0] - 2019-01-25

### 🚀 Features
- Add loadMedia and getMedia methods ([#5652](https://github.com/videojs/video.js/pull/5652)) by [@misteroneill](https://github.com/misteroneill)
- Add vjs-touch-enabled class for touch supporting devices ([#5663](https://github.com/videojs/video.js/pull/5663)) by [@tiagofragoso](https://github.com/tiagofragoso)
- Reset player ui on Player#reset ([#5684](https://github.com/videojs/video.js/pull/5684)) by [@reeckset](https://github.com/reeckset)
- *(package)* Update @videojs/http-streaming to version 1.8.0 🚀 ([#5743](https://github.com/videojs/video.js/pull/5743)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Add hotkeys support ("m", "f", "k", and Space) ([#5571](https://github.com/videojs/video.js/pull/5571)) by [@OwenEdwards](https://github.com/OwenEdwards)
- *(player)* Add option to disable or override double-click handling. ([#5611](https://github.com/videojs/video.js/pull/5611)) by [@OwenEdwards](https://github.com/OwenEdwards)

### 🐛 Bug Fixes
- *(lang)* Adds sv translation used by liveui component ([#5704](https://github.com/videojs/video.js/pull/5704)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- Control-bar autohide when cursor placed over it #5258 ([#5692](https://github.com/videojs/video.js/pull/5692)) by [@xjoaoalvesx](https://github.com/xjoaoalvesx)
- Css animation shorthand property order ([#5687](https://github.com/videojs/video.js/pull/5687)) by [@betancourtl](https://github.com/betancourtl)
- *(package)* Update @videojs/http-streaming to version 1.6.0 🚀 ([#5705](https://github.com/videojs/video.js/pull/5705)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Make sure sources, volume, and playback rate are reset along with the player ([#5676](https://github.com/videojs/video.js/pull/5676)) by [@misteroneill](https://github.com/misteroneill)
- *(remaining-time-display)* Make the '-' be visual and not readable by screen readers ([#5671](https://github.com/videojs/video.js/pull/5671)) by [@smbea](https://github.com/smbea)
- *(fs)* Make sure there's only one fullscreenchange event ([#5686](https://github.com/videojs/video.js/pull/5686)) by [@gkatsev](https://github.com/gkatsev)
- *(player)* Remove vjs-ended class on seeked ([#5728](https://github.com/videojs/video.js/pull/5728)) by [@gkatsev](https://github.com/gkatsev)
- *(seekbar)* Don't disable if live tracker's seekable is infinity ([#5721](https://github.com/videojs/video.js/pull/5721)) by [@gkatsev](https://github.com/gkatsev)
- Remove child from old parent when moving to new parent via addChild ([#5702](https://github.com/videojs/video.js/pull/5702)) by [@liuruenshen](https://github.com/liuruenshen)
- TextTrackMenuItem components should not disable text tracks of different kind(s). ([#5741](https://github.com/videojs/video.js/pull/5741)) by [@misteroneill](https://github.com/misteroneill)
- *(menu-button)* Make menu button title a component ([#5722](https://github.com/videojs/video.js/pull/5722)) by [@chrisboustead](https://github.com/chrisboustead)
- *(lang)* Galician translation update (gl.json) ([#5736](https://github.com/videojs/video.js/pull/5736)) by [@mbouzada](https://github.com/mbouzada)
- *(fs)* Fix double fullscreenchange event ([#5756](https://github.com/videojs/video.js/pull/5756)) by [@gkatsev](https://github.com/gkatsev)
- *(resize-manager)* Prevent tabbing into RM and hide from Screen Readers ([#5754](https://github.com/videojs/video.js/pull/5754)) by [@evanfarina](https://github.com/evanfarina)
- Remove event handlers when menu item is removed ([#5748](https://github.com/videojs/video.js/pull/5748)) by [@liuruenshen](https://github.com/liuruenshen)

### 💼 Other
- Update package-lock by [@gkatsev](https://github.com/gkatsev)

### 📚 Documentation
- *(liveui)* Add a guide for the live ui and live api ([#5677](https://github.com/videojs/video.js/pull/5677)) by [@brandonocasey](https://github.com/brandonocasey)
- Use https links ([#5749](https://github.com/videojs/video.js/pull/5749)) by [@thijstriemstra](https://github.com/thijstriemstra)

### ⚙️ Miscellaneous Tasks
- *(package)* Update babel to version 7.2.2 ([#5697](https://github.com/videojs/video.js/pull/5697)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update rollup to version 0.68.0 🚀 ([#5690](https://github.com/videojs/video.js/pull/5690)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update rollup to version 1.0.1 ([#5727](https://github.com/videojs/video.js/pull/5727)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update qunit to version 2.9.1 🚀 ([#5735](https://github.com/videojs/video.js/pull/5735)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update rollup-plugin-progress to version 1.0.0 🚀 ([#5729](https://github.com/videojs/video.js/pull/5729)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Fix xvfb in travis config, patch safari karma launchers ([#5755](https://github.com/videojs/video.js/pull/5755)) by [@brandonocasey](https://github.com/brandonocasey)
- *(package)* Update filesize to version 4.0.0 🚀 ([#5746](https://github.com/videojs/video.js/pull/5746)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update remark-validate-links to version 8.0.0 🚀 ([#5740](https://github.com/videojs/video.js/pull/5740)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update karma to version 4.0.0 🚀 ([#5764](https://github.com/videojs/video.js/pull/5764)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])

### New Contributors
* @liuruenshen made their first contribution in [#5748](https://github.com/videojs/video.js/pull/5748)
* @evanfarina made their first contribution in [#5754](https://github.com/videojs/video.js/pull/5754)
* @mbouzada made their first contribution in [#5736](https://github.com/videojs/video.js/pull/5736)
* @chrisboustead made their first contribution in [#5722](https://github.com/videojs/video.js/pull/5722)
* @reeckset made their first contribution in [#5684](https://github.com/videojs/video.js/pull/5684)
* @smbea made their first contribution in [#5671](https://github.com/videojs/video.js/pull/5671)
* @tiagofragoso made their first contribution in [#5663](https://github.com/videojs/video.js/pull/5663)
* @betancourtl made their first contribution in [#5687](https://github.com/videojs/video.js/pull/5687)
* @xjoaoalvesx made their first contribution in [#5692](https://github.com/videojs/video.js/pull/5692)

## [7.4.1] - 2018-12-11

### 🐛 Bug Fixes
- *(lang)* Append UKR translations and fix check translations command ([#5642](https://github.com/videojs/video.js/pull/5642)) by [@vitaliytv](https://github.com/vitaliytv)
- *(liveui)* Seek to live should be immediate and other tweaks ([#5650](https://github.com/videojs/video.js/pull/5650)) by [@brandonocasey](https://github.com/brandonocasey)
- *(package)* Update @videojs/http-streaming to version 1.5.1 🚀 ([#5658](https://github.com/videojs/video.js/pull/5658)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(lang)* Update sr.json ([#5657](https://github.com/videojs/video.js/pull/5657)) by [@oaprograms](https://github.com/oaprograms)
- *(liveui)* Make edge detection less strict, add docs for option ([#5661](https://github.com/videojs/video.js/pull/5661)) by [@brandonocasey](https://github.com/brandonocasey)
- *(lang)* Improves sv lang file ([#5673](https://github.com/videojs/video.js/pull/5673)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- *(a11y)* Current time and duration display accessibility with VoiceOver ([#5653](https://github.com/videojs/video.js/pull/5653)) by [@alex-barstow](https://github.com/alex-barstow)
- *(a11y)* Fix hidden Control Text in Progress bar (Fixes #5251) ([#5655](https://github.com/videojs/video.js/pull/5655)) by [@OwenEdwards](https://github.com/OwenEdwards)
- *(a11y)* Make seek-to-live better announce itself to screen reader users ([#5651](https://github.com/videojs/video.js/pull/5651)) by [@brandonocasey](https://github.com/brandonocasey)

### 📚 Documentation
- Remove grunt and update usage of build scripts ([#5656](https://github.com/videojs/video.js/pull/5656)) by [@gkatsev](https://github.com/gkatsev)

### 🧪 Testing
- Verify null-checks with player and control bar children set to false ([#5670](https://github.com/videojs/video.js/pull/5670)) by [@brandonocasey](https://github.com/brandonocasey)

### ⚙️ Miscellaneous Tasks
- *(package)* Update autoprefixer to version 9.4.2 ([#5647](https://github.com/videojs/video.js/pull/5647)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update rollup-plugin-node-resolve to version 4.0.0 🚀 ([#5666](https://github.com/videojs/video.js/pull/5666)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])

### New Contributors
* @oaprograms made their first contribution in [#5657](https://github.com/videojs/video.js/pull/5657)

## [7.4.0] - 2018-12-03

### 🚀 Features
- Add 'replay' option to the PlayToggle component. ([#5531](https://github.com/videojs/video.js/pull/5531)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- *(player)* Add playerreset event ([#5335](https://github.com/videojs/video.js/pull/5335)) by [@gstrat88](https://github.com/gstrat88)
- *(lang)* Copy language JSON files into dist dir ([#5549](https://github.com/videojs/video.js/pull/5549)) by [@eranshmil](https://github.com/eranshmil)
- *(lang)* Add Welsh/Cymraeg (cy) translations ([#5561](https://github.com/videojs/video.js/pull/5561)) by [@carlmorris](https://github.com/carlmorris)
- *(lang)* Add the Occitan locale ([#5578](https://github.com/videojs/video.js/pull/5578)) by [@Quenty31](https://github.com/Quenty31)
- Responsive caption settings ([#5534](https://github.com/videojs/video.js/pull/5534)) by [@brandonocasey](https://github.com/brandonocasey)
- Make menu background respect :focus-visible ([#5558](https://github.com/videojs/video.js/pull/5558)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- Support seeking during live playback via liveui option ([#5511](https://github.com/videojs/video.js/pull/5511)) by [@brandonocasey](https://github.com/brandonocasey)

### 🐛 Bug Fixes
- Don't remove vjs-waiting until time changes ([#5533](https://github.com/videojs/video.js/pull/5533)) by [@gesinger](https://github.com/gesinger)
- Add correct cursor pointer for the play toggle  ([#5463](https://github.com/videojs/video.js/pull/5463)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- Vjs-lock-showing class gets removed from menu when no longer hovering on menu-button. ([#5465](https://github.com/videojs/video.js/pull/5465)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- Not inline volume slider showing up after mouse hovering on it ([#5503](https://github.com/videojs/video.js/pull/5503)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- *(package)* Update @videojs/http-streaming to version 1.4.2 🚀 ([#5543](https://github.com/videojs/video.js/pull/5543)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(tracks)* Don't select tracks based on user pref if no langauge is set ([#5556](https://github.com/videojs/video.js/pull/5556)) by [@gkatsev](https://github.com/gkatsev)
- Duration reset and allow duration NaN or 0 for duration display ([#5348](https://github.com/videojs/video.js/pull/5348)) by [@fketchakeu](https://github.com/fketchakeu)
- *(package)* Update @videojs/http-streaming to version 1.5.0 🚀 ([#5587](https://github.com/videojs/video.js/pull/5587)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Default subtitles not enabled ([#5608](https://github.com/videojs/video.js/pull/5608)) by [@alex-barstow](https://github.com/alex-barstow)
- *(lang)* Occitan: harmonisation plural/singular ([#5602](https://github.com/videojs/video.js/pull/5602)) by [@Quenty31](https://github.com/Quenty31)
- *(lang)* Add  is loading ru translation ([#5630](https://github.com/videojs/video.js/pull/5630)) by [@vitaliytv](https://github.com/vitaliytv)

### 📚 Documentation
- Update urls in README.md to point to v7.3.0 ([#5536](https://github.com/videojs/video.js/pull/5536)) by [@valse](https://github.com/valse)
- *(media-error)* Correct error type documentation ([#5566](https://github.com/videojs/video.js/pull/5566)) by [@bartlomein](https://github.com/bartlomein)
- Update starter template ([#5570](https://github.com/videojs/video.js/pull/5570)) by [@gkatsev](https://github.com/gkatsev)

### ⚙️ Miscellaneous Tasks
- Switch to videojs-generate-karma-config ([#5528](https://github.com/videojs/video.js/pull/5528)) by [@brandonocasey](https://github.com/brandonocasey)
- *(package)* Update remark-stringify to version 6.0.1 ([#5539](https://github.com/videojs/video.js/pull/5539)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update grunt-cli to version 1.3.2 ([#5550](https://github.com/videojs/video.js/pull/5550)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update conventional-changelog-cli to version 2.0.11 ([#5552](https://github.com/videojs/video.js/pull/5552)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update husky to version 1.1.3 ([#5551](https://github.com/videojs/video.js/pull/5551)) by [@gkatsev](https://github.com/gkatsev)
- Update deps, remove coveralls, fix audit issues ([#5555](https://github.com/videojs/video.js/pull/5555)) by [@gkatsev](https://github.com/gkatsev)
- Move copy, zip, and clean tasks to npm scripts ([#5544](https://github.com/videojs/video.js/pull/5544)) by [@brandonocasey](https://github.com/brandonocasey)
- *(travis)* Remove unused secret variables ([#5577](https://github.com/videojs/video.js/pull/5577)) by [@DanielRuf](https://github.com/DanielRuf)
- *(package)* Update rollup to version 0.67.1 ([#5580](https://github.com/videojs/video.js/pull/5580)) by [@gkatsev](https://github.com/gkatsev)
- Use relative urls in index.html ([#5586](https://github.com/videojs/video.js/pull/5586)) by [@gkatsev](https://github.com/gkatsev)
- *(player)* Fix linting for a comment ([#5588](https://github.com/videojs/video.js/pull/5588)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update videojs-generate-karma-config to version 5.0.0 🚀 ([#5595](https://github.com/videojs/video.js/pull/5595)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Fix lint on pre-commit with lint-staged, use npm-merge-driver ([#5591](https://github.com/videojs/video.js/pull/5591)) by [@brandonocasey](https://github.com/brandonocasey)
- Move a11y, lang, browserify, and webpack out of grunt ([#5589](https://github.com/videojs/video.js/pull/5589)) by [@brandonocasey](https://github.com/brandonocasey)
- Switch from cross-var to cross-env ([#5600](https://github.com/videojs/video.js/pull/5600)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update npm-run-all to 4.1.5 to remove event-stream ([#5614](https://github.com/videojs/video.js/pull/5614)) by [@gkatsev](https://github.com/gkatsev)
- Fix travis build ([#5627](https://github.com/videojs/video.js/pull/5627)) by [@brandonocasey](https://github.com/brandonocasey)
- Remove grunt move to npm scripts ([#5592](https://github.com/videojs/video.js/pull/5592)) by [@brandonocasey](https://github.com/brandonocasey)
- *(netlify)* Make docs build properly ([#5636](https://github.com/videojs/video.js/pull/5636)) by [@gkatsev](https://github.com/gkatsev)
- Update all the dev deps to their latest versions ([#5645](https://github.com/videojs/video.js/pull/5645)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @vitaliytv made their first contribution in [#5630](https://github.com/videojs/video.js/pull/5630)
* @Quenty31 made their first contribution in [#5602](https://github.com/videojs/video.js/pull/5602)
* @fketchakeu made their first contribution in [#5348](https://github.com/videojs/video.js/pull/5348)
* @DanielRuf made their first contribution in [#5577](https://github.com/videojs/video.js/pull/5577)
* @bartlomein made their first contribution in [#5566](https://github.com/videojs/video.js/pull/5566)
* @carlmorris made their first contribution in [#5561](https://github.com/videojs/video.js/pull/5561)
* @eranshmil made their first contribution in [#5549](https://github.com/videojs/video.js/pull/5549)
* @valse made their first contribution in [#5536](https://github.com/videojs/video.js/pull/5536)

## [7.3.0] - 2018-10-26

### 🚀 Features
- CreateLogger for easier logging in individual modules ([#5418](https://github.com/videojs/video.js/pull/5418)) by [@gkatsev](https://github.com/gkatsev)
- *(fill)* Make vjs-fill a player mode ([#5478](https://github.com/videojs/video.js/pull/5478)) by [@gkatsev](https://github.com/gkatsev)
- Add breakpoints option to support toggling classes based on player width. ([#5471](https://github.com/videojs/video.js/pull/5471)) by [@misteroneill](https://github.com/misteroneill)
- Add responsive option, which enables breakpoints support. ([#5496](https://github.com/videojs/video.js/pull/5496)) by [@misteroneill](https://github.com/misteroneill)

### 🐛 Bug Fixes
- *(vjsstandard)* Update to 8.0.2 and fixup linting ([#5413](https://github.com/videojs/video.js/pull/5413)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update videojs-font to version 3.1.0 🚀 ([#5476](https://github.com/videojs/video.js/pull/5476)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update @videojs/http-streaming to version 1.3.0 🚀 ([#5482](https://github.com/videojs/video.js/pull/5482)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update @videojs/http-streaming to version 1.3.1 🚀 ([#5508](https://github.com/videojs/video.js/pull/5508)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(TextTrackSetting)* Do not use default button type. ([#5512](https://github.com/videojs/video.js/pull/5512)) by [@syranez](https://github.com/syranez)
- *(package)* Update @videojs/http-streaming to version 1.4.0 🚀 ([#5523](https://github.com/videojs/video.js/pull/5523)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Prevent ResizeManager from being clicked on safari, fix playerresize on firefox ([#5522](https://github.com/videojs/video.js/pull/5522)) by [@brandonocasey](https://github.com/brandonocasey)
- Add support for :focus-visible selector ([#5483](https://github.com/videojs/video.js/pull/5483)) by [@gjanblaszczyk](https://github.com/gjanblaszczyk)
- *(package)* Update @videojs/http-streaming to version 1.4.1 🚀 ([#5527](https://github.com/videojs/video.js/pull/5527)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Blob urls being ignored as valid sources ([#5525](https://github.com/videojs/video.js/pull/5525)) by [@brandonocasey](https://github.com/brandonocasey)

### 📚 Documentation
- Update JSDoc comments, so core API docs for the videojs function are accurate. ([#5385](https://github.com/videojs/video.js/pull/5385)) by [@misteroneill](https://github.com/misteroneill)
- *(layout)* Document fluid and fill mode ([#5481](https://github.com/videojs/video.js/pull/5481)) by [@gkatsev](https://github.com/gkatsev)
- *(fixup)* Fixup docs ([#5489](https://github.com/videojs/video.js/pull/5489)) by [@gkatsev](https://github.com/gkatsev)
- *(README)* Update info about google analytics ([#5491](https://github.com/videojs/video.js/pull/5491)) by [@gkatsev](https://github.com/gkatsev)
- *(README)* Refer to minified JS and CSS files, improve general layout ([#5494](https://github.com/videojs/video.js/pull/5494)) by [@OwenEdwards](https://github.com/OwenEdwards)
- *(player)* Make reset() method more clear ([#5501](https://github.com/videojs/video.js/pull/5501)) by [@chrisrng](https://github.com/chrisrng)

### ⚙️ Miscellaneous Tasks
- *(package)* Update klaw-sync to version 6.0.0 🚀 ([#5445](https://github.com/videojs/video.js/pull/5445)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update rollup to version 0.66.0 🚀 ([#5439](https://github.com/videojs/video.js/pull/5439)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update husky to version 1.0.1 🚀 ([#5448](https://github.com/videojs/video.js/pull/5448)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Upgrade rollup to 0.66.2 ([#5458](https://github.com/videojs/video.js/pull/5458)) by [@gkatsev](https://github.com/gkatsev)
- *(lang)* Update translations-needed doc ([#5459](https://github.com/videojs/video.js/pull/5459)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update grunt-sass to version 3.0.2 🚀 ([#5486](https://github.com/videojs/video.js/pull/5486)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Switch to prepublishOnly npm script to prevent build on npm ci ([#5497](https://github.com/videojs/video.js/pull/5497)) by [@brandonocasey](https://github.com/brandonocasey)
- *(babel)* Upgrade to Babel 7 ([#5498](https://github.com/videojs/video.js/pull/5498)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update remark-cli to version 6.0.0 🚀 ([#5516](https://github.com/videojs/video.js/pull/5516)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update remark-stringify to version 6.0.0 🚀 ([#5515](https://github.com/videojs/video.js/pull/5515)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update remark-parse to version 6.0.0 🚀 ([#5514](https://github.com/videojs/video.js/pull/5514)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Remove rollup filesize plugin to double build speed ([#5518](https://github.com/videojs/video.js/pull/5518)) by [@brandonocasey](https://github.com/brandonocasey)
- Move scss grunt tasks to npm scripts ([#5520](https://github.com/videojs/video.js/pull/5520)) by [@brandonocasey](https://github.com/brandonocasey)
- *(rollup)* Fix watch build with globals/externals ([#5519](https://github.com/videojs/video.js/pull/5519)) by [@brandonocasey](https://github.com/brandonocasey)

### New Contributors
* @gjanblaszczyk made their first contribution in [#5483](https://github.com/videojs/video.js/pull/5483)
* @chrisrng made their first contribution in [#5501](https://github.com/videojs/video.js/pull/5501)
* @syranez made their first contribution in [#5512](https://github.com/videojs/video.js/pull/5512)

## [7.2.4] - 2018-09-25

### 🐛 Bug Fixes
- *(text-tracks)* Cuechange handler not triggering correctly ([#5446](https://github.com/videojs/video.js/pull/5446)) by [@gkatsev](https://github.com/gkatsev)
- *(text track display)* Update on playerresize and orientationchange ([#5447](https://github.com/videojs/video.js/pull/5447)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update @videojs/http-streaming to version 1.2.6 🚀 ([#5444](https://github.com/videojs/video.js/pull/5444)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])

### ⚙️ Miscellaneous Tasks
- *(package-lock)* Update to npm 6.4.1 & node 8.12 by [@gkatsev](https://github.com/gkatsev)

## [7.2.3] - 2018-09-13

### 🐛 Bug Fixes
- *(lang)* Fixed typos in cs translation ([#5407](https://github.com/videojs/video.js/pull/5407)) by [@Akxe](https://github.com/Akxe)
- *(package)* Update @videojs/http-streaming to version 1.2.5 🚀 ([#5399](https://github.com/videojs/video.js/pull/5399)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Use consistent id for tech, no matter how it is loaded ([#5415](https://github.com/videojs/video.js/pull/5415)) by [@alexrqs](https://github.com/alexrqs)
- Make sure all attributes are updated before applying to tag ([#5416](https://github.com/videojs/video.js/pull/5416)) by [@gkatsev](https://github.com/gkatsev)
- *(ResizeManager)* Fixup the null check ([#5427](https://github.com/videojs/video.js/pull/5427)) by [@brandonocasey](https://github.com/brandonocasey)

### 🧪 Testing
- Fix travis ci issues with resize-manager tests ([#5390](https://github.com/videojs/video.js/pull/5390)) by [@brandonocasey](https://github.com/brandonocasey)

### ⚙️ Miscellaneous Tasks
- *(package)* Update grunt-cli to version 1.3.1 ([#5409](https://github.com/videojs/video.js/pull/5409)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update rollup to version 0.65.0 🚀 ([#5400](https://github.com/videojs/video.js/pull/5400)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Run npm audit fix (but roll back videojs-standard version) ([#5386](https://github.com/videojs/video.js/pull/5386)) by [@OwenEdwards](https://github.com/OwenEdwards)
- *(package)* Update klaw-sync to version 5.0.0 🚀 ([#5414](https://github.com/videojs/video.js/pull/5414)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update grunt-contrib-cssmin to version 3.0.0 🚀 ([#5417](https://github.com/videojs/video.js/pull/5417)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update grunt-contrib-connect to version 2.0.0 🚀 ([#5428](https://github.com/videojs/video.js/pull/5428)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update grunt-contrib-clean to version 2.0.0 🚀 ([#5429](https://github.com/videojs/video.js/pull/5429)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update grunt-karma to version 3.0.0 🚀 ([#5421](https://github.com/videojs/video.js/pull/5421)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])

### New Contributors
* @alexrqs made their first contribution in [#5415](https://github.com/videojs/video.js/pull/5415)

## [7.2.2] - 2018-08-14

### 🐛 Bug Fixes
- *(package)* Update @videojs/http-streaming to version 1.2.4 🚀 ([#5377](https://github.com/videojs/video.js/pull/5377)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Add debounced.cancel and use it in ResizeManager ([#5378](https://github.com/videojs/video.js/pull/5378)) by [@gkatsev](https://github.com/gkatsev)

## [7.2.1] - 2018-08-13

### 🐛 Bug Fixes
- Change time tooltips to be absolutely positioned ([#5355](https://github.com/videojs/video.js/pull/5355)) by [@decarbonite](https://github.com/decarbonite)
- *(sourceset)* Ignore blob urls when updating source cache ([#5371](https://github.com/videojs/video.js/pull/5371)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update @videojs/http-streaming to version 1.2.3 ([#5368](https://github.com/videojs/video.js/pull/5368)) by [@gkatsev](https://github.com/gkatsev)
- Call component dispose in resize manager to fix leak ([#5369](https://github.com/videojs/video.js/pull/5369)) by [@brandonocasey](https://github.com/brandonocasey)
- Always return a promise from play, if supported ([#5227](https://github.com/videojs/video.js/pull/5227)) by [@brandonocasey](https://github.com/brandonocasey)

### ⚙️ Miscellaneous Tasks
- *(package)* Update rollup to version 0.64.1 ([#5367](https://github.com/videojs/video.js/pull/5367)) by [@gkatsev](https://github.com/gkatsev)
- *(https)* Update a lot of links to be https ([#5372](https://github.com/videojs/video.js/pull/5372)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update karma to version 3.0.0 🚀 ([#5370](https://github.com/videojs/video.js/pull/5370)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])

### New Contributors
* @decarbonite made their first contribution in [#5355](https://github.com/videojs/video.js/pull/5355)

## [7.2.0] - 2018-07-26

### 🚀 Features
- *(player)* Remove text tracks on Player#reset ([#5327](https://github.com/videojs/video.js/pull/5327)) by [@gstrat88](https://github.com/gstrat88)
- *(plugins)* Allow plugin deregistration from videojs ([#5273](https://github.com/videojs/video.js/pull/5273)) by [@brandonocasey](https://github.com/brandonocasey)
- Async `change` events in TextTrackList with EventTarget#queueTrigger ([#5332](https://github.com/videojs/video.js/pull/5332)) by [@gkatsev](https://github.com/gkatsev)

### 🐛 Bug Fixes
- *(lang)* Add a missing translation in sk.json ([#5324](https://github.com/videojs/video.js/pull/5324)) by [@Akxe](https://github.com/Akxe)
- *(lang)* Added all missing translation for CZ_cs ([#5311](https://github.com/videojs/video.js/pull/5311)) by [@Akxe](https://github.com/Akxe)
- *(package)* Update @videojs/http-streaming to version 1.2.1 ([#5334](https://github.com/videojs/video.js/pull/5334)) by [@gkatsev](https://github.com/gkatsev)
- Subtitles/captions freeze when using uglify ([#5346](https://github.com/videojs/video.js/pull/5346)) by [@Chocobozzz](https://github.com/Chocobozzz)

### 📚 Documentation
- Remove duplicate `@deprecated` which throws error when minifying via google closure compiler ([#5342](https://github.com/videojs/video.js/pull/5342)) by [@mreinstein](https://github.com/mreinstein)

### ⚙️ Miscellaneous Tasks
- *(welcome bot)* Add welcome bot config ([#5313](https://github.com/videojs/video.js/pull/5313)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update rollup to version 0.63.4 ([#5341](https://github.com/videojs/video.js/pull/5341)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update autoprefixer to version 9.0.1 ([#5340](https://github.com/videojs/video.js/pull/5340)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update postcss-cli to version 6.0.0 🚀 ([#5329](https://github.com/videojs/video.js/pull/5329)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])

### New Contributors
* @Chocobozzz made their first contribution in [#5346](https://github.com/videojs/video.js/pull/5346)
* @gstrat88 made their first contribution in [#5327](https://github.com/videojs/video.js/pull/5327)
* @mreinstein made their first contribution in [#5342](https://github.com/videojs/video.js/pull/5342)
* @Akxe made their first contribution in [#5311](https://github.com/videojs/video.js/pull/5311)

## [7.1.0] - 2018-07-06

### 🚀 Features
- *(text-track-display)* Extend the constructColor function to handle 6 digit hex codes ([#5238](https://github.com/videojs/video.js/pull/5238)) by [@practual](https://github.com/practual)
- *(css)* Run autoprefixer on css ([#5239](https://github.com/videojs/video.js/pull/5239)) by [@brandonocasey](https://github.com/brandonocasey)
- *(autoplay)* Extend autoplay option for greater good ([#5209](https://github.com/videojs/video.js/pull/5209)) by [@brandonocasey](https://github.com/brandonocasey)
- Show mute toggle button if the tech supports muting volume ([#5052](https://github.com/videojs/video.js/pull/5052)) by [@bcdarius](https://github.com/bcdarius)
- Add an Audio Description icon to an audio track name in the track menu if it is "main-desc" kind. ([#4599](https://github.com/videojs/video.js/pull/4599)) by [@OwenEdwards](https://github.com/OwenEdwards)
- *(browser)* Include iOS Chrome UA pattern when detecting Google Chrome ([#5262](https://github.com/videojs/video.js/pull/5262)) by [@bcdarius](https://github.com/bcdarius)
- Add double-click handler to toggle fullscreen ([#5148](https://github.com/videojs/video.js/pull/5148)) by [@bcdarius](https://github.com/bcdarius)
- *(fullscreen-toggle)* Disable fs button if fullcreen is unavailable ([#5296](https://github.com/videojs/video.js/pull/5296)) by [@DoomTay](https://github.com/DoomTay)
- *(middleware)* Make setSource be optional ([#5295](https://github.com/videojs/video.js/pull/5295)) by [@gkatsev](https://github.com/gkatsev)

### 🐛 Bug Fixes
- Allow evented objects, such as components and plugins, to listen to the window object in addition to DOM objects. ([#5255](https://github.com/videojs/video.js/pull/5255)) by [@misteroneill](https://github.com/misteroneill)
- *(browser)* TOUCH_ENABLED detection with Win10  ([#5286](https://github.com/videojs/video.js/pull/5286)) by [@StefanoFedeli](https://github.com/StefanoFedeli)
- Autoplay throws 'undefined promise' error on some browsers. ([#5283](https://github.com/videojs/video.js/pull/5283)) by [@gecko655](https://github.com/gecko655)

### 🚜 Refactor
- Removed old bug work-around code ([#5200](https://github.com/videojs/video.js/pull/5200)) by [@brandonocasey](https://github.com/brandonocasey)

### ⚡ Performance
- SetTimeout and requestAnimationFrame memory leak ([#5294](https://github.com/videojs/video.js/pull/5294)) by [@gkatsev](https://github.com/gkatsev)

### ⚙️ Miscellaneous Tasks
- *(npmignore)* Don't publish zip file to npm ([#5249](https://github.com/videojs/video.js/pull/5249)) by [@Demivan](https://github.com/Demivan)
- *(package)* Update rollup to version 0.61.1 ([#5268](https://github.com/videojs/video.js/pull/5268)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update rollup to version 0.62.0 🚀 ([#5279](https://github.com/videojs/video.js/pull/5279)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Enable move and stale probots ([#5292](https://github.com/videojs/video.js/pull/5292)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Add module field to package.json ([#5293](https://github.com/videojs/video.js/pull/5293)) by [@edoardocavazza](https://github.com/edoardocavazza)
- *(package)* Upgrade to VHS 1.1.0 ([#5305](https://github.com/videojs/video.js/pull/5305)) by [@gkatsev](https://github.com/gkatsev)

### ◀️ Revert
- "fix: Allow evented objects, such as components and plugins, to listen to the window object in addition to DOM objects. ([#5255](https://github.com/videojs/video.js/pull/5255))" ([#5301](https://github.com/videojs/video.js/pull/5301)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @DoomTay made their first contribution in [#5296](https://github.com/videojs/video.js/pull/5296)
* @gecko655 made their first contribution in [#5283](https://github.com/videojs/video.js/pull/5283)
* @edoardocavazza made their first contribution in [#5293](https://github.com/videojs/video.js/pull/5293)
* @StefanoFedeli made their first contribution in [#5286](https://github.com/videojs/video.js/pull/5286)
* @practual made their first contribution in [#5238](https://github.com/videojs/video.js/pull/5238)
* @Demivan made their first contribution in [#5249](https://github.com/videojs/video.js/pull/5249)

## [7.0.5] - 2018-06-11

### 🐛 Bug Fixes
- Menu sizing when using longer caption labels ([#5228](https://github.com/videojs/video.js/pull/5228)) by [@bcdarius](https://github.com/bcdarius)
- Make sure source options are passed through ([#5241](https://github.com/videojs/video.js/pull/5241)) by [@squarebracket](https://github.com/squarebracket)

### ⚙️ Miscellaneous Tasks
- *(package)* Update grunt-contrib-watch to version 1.1.0 🚀 ([#5170](https://github.com/videojs/video.js/pull/5170)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update rollup-plugin-filesize to version 2.0.0 🚀 ([#5234](https://github.com/videojs/video.js/pull/5234)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update rollup to version 0.60.1 🚀 ([#5235](https://github.com/videojs/video.js/pull/5235)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update conventional-changelog-cli to version 2.0.1 🚀 ([#5236](https://github.com/videojs/video.js/pull/5236)) by [@gkatsev](https://github.com/gkatsev)

## [7.0.4] - 2018-06-05

### 🐛 Bug Fixes
- *(player)* Ensure that JAWS+IE announces the BPB and play button ([#5173](https://github.com/videojs/video.js/pull/5173)) by [@OwenEdwards](https://github.com/OwenEdwards)
- *(menus)* Change ARIA role of menu items for better screen reader support ([#5171](https://github.com/videojs/video.js/pull/5171)) by [@OwenEdwards](https://github.com/OwenEdwards)
- Build core script files as UMD ([#5220](https://github.com/videojs/video.js/pull/5220)) by [@forbesjo](https://github.com/forbesjo)
- Silence play promise in a few more places ([#5213](https://github.com/videojs/video.js/pull/5213)) by [@rtezera1](https://github.com/rtezera1)
- *(slider)* Suppress console warnings in Chrome for Android when scrubbing ([#5219](https://github.com/videojs/video.js/pull/5219)) by [@bcdarius](https://github.com/bcdarius)

### 💼 Other
- A terrible rollup watch fix for development ([#5211](https://github.com/videojs/video.js/pull/5211)) by [@brandonocasey](https://github.com/brandonocasey)

### 📚 Documentation
- *(examples)* Remove IE9 text track HTML markup in the doc/examples, and update to use video.js v7.0 ([#5192](https://github.com/videojs/video.js/pull/5192)) by [@OwenEdwards](https://github.com/OwenEdwards)
- *(collaborator-guide)* Clarify how to Land a PR using the GitHub UI ([#5201](https://github.com/videojs/video.js/pull/5201)) by [@OwenEdwards](https://github.com/OwenEdwards)
- *(component)* Fix typo ([#5226](https://github.com/videojs/video.js/pull/5226)) by [@thijstriemstra](https://github.com/thijstriemstra)

### ⚙️ Miscellaneous Tasks
- *(build)* Fix rollup watch during npm start ([#5203](https://github.com/videojs/video.js/pull/5203)) by [@brandonocasey](https://github.com/brandonocasey)

### New Contributors
* @bcdarius made their first contribution in [#5219](https://github.com/videojs/video.js/pull/5219)
* @rtezera1 made their first contribution in [#5213](https://github.com/videojs/video.js/pull/5213)

## [7.0.3] - 2018-05-23

### 🐛 Bug Fixes
- *(player)* Video-js embed missing video-js class ([#5194](https://github.com/videojs/video.js/pull/5194)) by [@gkatsev](https://github.com/gkatsev)

## [7.0.2] - 2018-05-18

### ⚙️ Miscellaneous Tasks
- *(package)* Upgrade @videojs/http-streaming to 1.0.2 ([#5189](https://github.com/videojs/video.js/pull/5189)) by [@gkatsev](https://github.com/gkatsev)

## [7.0.1] - 2018-05-17

### 🐛 Bug Fixes
- *(CHANGELOG)* Full 7.0.0 changelog by [@gkatsev](https://github.com/gkatsev)
- Check for el before resetSourceSet ([#5176](https://github.com/videojs/video.js/pull/5176)) by [@brandonocasey](https://github.com/brandonocasey)

### 🧪 Testing
- Do not throw on tech/player dispose ([#5179](https://github.com/videojs/video.js/pull/5179)) by [@brandonocasey](https://github.com/brandonocasey)

## [7.0.0] - 2018-05-11

### 🚀 Features
- Built-in HLS playback support ([#5057](https://github.com/videojs/video.js/pull/5057)) by [@forbesjo](https://github.com/forbesjo)
- Build alternate browser scripts without VHS ([#5077](https://github.com/videojs/video.js/pull/5077)) by [@forbesjo](https://github.com/forbesjo)
- Queue playback events when the playback rate is zero and we are seeking ([#5024](https://github.com/videojs/video.js/pull/5024)) by [@squarebracket](https://github.com/squarebracket)
- Add tech method to allow override native audio and video ([#5074](https://github.com/videojs/video.js/pull/5074)) by [@OshinKaramian](https://github.com/OshinKaramian)
- Split overrideNative method into separate methods ([#5107](https://github.com/videojs/video.js/pull/5107)) by [@OshinKaramian](https://github.com/OshinKaramian)
- Upgrade video.js font to 3.0 for woff only font-icons ([#5112](https://github.com/videojs/video.js/pull/5112)) by [@gkatsev](https://github.com/gkatsev)
- *(modal)* Remove old IE box sizing ([#5113](https://github.com/videojs/video.js/pull/5113)) by [@gkatsev](https://github.com/gkatsev)
- Update the players source cache on sourceset ([#5040](https://github.com/videojs/video.js/pull/5040)) by [@brandonocasey](https://github.com/brandonocasey)
- Copy properties from <video-js> to the media el ([#5039](https://github.com/videojs/video.js/pull/5039)) by [@brandonocasey](https://github.com/brandonocasey)
- Add 'autoSetup' option ([#5123](https://github.com/videojs/video.js/pull/5123)) by [@axten](https://github.com/axten)

### 🐛 Bug Fixes
- *(time-display)* Use formatTime for a consistent default instead of hardcoded string ([#5055](https://github.com/videojs/video.js/pull/5055)) by [@guided1](https://github.com/guided1)
- *(package)* Update @videojs/http-streaming to version 0.9.0 🚀 ([#5064](https://github.com/videojs/video.js/pull/5064)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Let the tech preload auto on its own ([#4861](https://github.com/videojs/video.js/pull/4861)) by [@brandonocasey](https://github.com/brandonocasey)
- Fire sourceset on initial source append ([#5038](https://github.com/videojs/video.js/pull/5038)) by [@brandonocasey](https://github.com/brandonocasey)
- *(package)* Update @videojs/http-streaming to version 1.0.0 🚀 ([#5083](https://github.com/videojs/video.js/pull/5083)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update videojs-vtt.js to version 0.14.1 🚀 ([#5085](https://github.com/videojs/video.js/pull/5085)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Wait till play event to listen for user activity ([#5093](https://github.com/videojs/video.js/pull/5093)) by [@axten](https://github.com/axten)
- Options.id is now applied correctly to the player dom element ([#5090](https://github.com/videojs/video.js/pull/5090)) by [@axten](https://github.com/axten)
- *(lang)* Add missing strings in pt-BR ([#5122](https://github.com/videojs/video.js/pull/5122)) by [@LuanComputacao](https://github.com/LuanComputacao)
- `sourceset` and browser behavior inconsistencies ([#5054](https://github.com/videojs/video.js/pull/5054)) by [@brandonocasey](https://github.com/brandonocasey)
- *(seek-bar)* Ensure aria-valuenow attribute in seek-bar is not NaN ([#5164](https://github.com/videojs/video.js/pull/5164)) by [@monicao](https://github.com/monicao)
- Reduce the multiple-announcement by screen readers of the new name of a button when its text label changes. ([#5158](https://github.com/videojs/video.js/pull/5158)) by [@OwenEdwards](https://github.com/OwenEdwards)
- Remove unnecessary ARIA role on the Control Bar. ([#5154](https://github.com/videojs/video.js/pull/5154)) by [@OwenEdwards](https://github.com/OwenEdwards)
- Remove spaces from element IDs and ARIA attributes in the Captions Settings Dialog ([#5153](https://github.com/videojs/video.js/pull/5153)) by [@OwenEdwards](https://github.com/OwenEdwards)
- *(time-display)* Restore hidden label text for screen readers. ([#5157](https://github.com/videojs/video.js/pull/5157)) by [@OwenEdwards](https://github.com/OwenEdwards)

### 💼 Other
- Update package-lock by [@gkatsev](https://github.com/gkatsev)

### 🚜 Refactor
- [**breaking**] Remove IE8 specific changes ([#5041](https://github.com/videojs/video.js/pull/5041)) by [@gkatsev](https://github.com/gkatsev)
- Move sourceset code out of tech ([#5037](https://github.com/videojs/video.js/pull/5037)) by [@brandonocasey](https://github.com/brandonocasey)
- Move seekbar event handler bindings into a function ([#5097](https://github.com/videojs/video.js/pull/5097)) by [@guided1](https://github.com/guided1)

### 📚 Documentation
- *(time-ranges)* Fix misspellings ([#5046](https://github.com/videojs/video.js/pull/5046)) by [@Maysjtu](https://github.com/Maysjtu)
- *(text-track)* Fix misspellings ([#5058](https://github.com/videojs/video.js/pull/5058)) by [@Maysjtu](https://github.com/Maysjtu)
- *(tech)* Fix misspellings ([#5059](https://github.com/videojs/video.js/pull/5059)) by [@Maysjtu](https://github.com/Maysjtu)
- Update readme to use the latest version of vjs ([#5073](https://github.com/videojs/video.js/pull/5073)) by [@strdr4605](https://github.com/strdr4605)
- Fix more misspellings ([#5067](https://github.com/videojs/video.js/pull/5067)) by [@Maysjtu](https://github.com/Maysjtu)
- Fix some misspellings ([#5082](https://github.com/videojs/video.js/pull/5082)) by [@Maysjtu](https://github.com/Maysjtu)
- *(languages)* Use valid JSON in translation example ([#5080](https://github.com/videojs/video.js/pull/5080)) by [@thijstriemstra](https://github.com/thijstriemstra)
- *(debugging)* Fix markup typo ([#5086](https://github.com/videojs/video.js/pull/5086)) by [@thijstriemstra](https://github.com/thijstriemstra)
- *(guides)* Add debugging section to index ([#5100](https://github.com/videojs/video.js/pull/5100)) by [@thijstriemstra](https://github.com/thijstriemstra)

### 🧪 Testing
- No longer test on IE8, IE9, or IE10 ([#5032](https://github.com/videojs/video.js/pull/5032)) by [@gkatsev](https://github.com/gkatsev)
- Update karma browser OS versions ([#5050](https://github.com/videojs/video.js/pull/5050)) by [@forbesjo](https://github.com/forbesjo)

### ⚙️ Miscellaneous Tasks
- *(test)* Upgrade qunit and karma-qunit to latest ([#5051](https://github.com/videojs/video.js/pull/5051)) by [@gkatsev](https://github.com/gkatsev)
- *(first-timers-bot)* Add repo to bot options by [@gkatsev](https://github.com/gkatsev)
- *(first-timers-bot)* Quote repository option by [@gkatsev](https://github.com/gkatsev)
- *(first-timers-bot)* Correct the path to template file by [@gkatsev](https://github.com/gkatsev)
- *(first-timers-bot)* Fix slack url in template by [@gkatsev](https://github.com/gkatsev)
- *(package)* Remove npm-run dev dep as it's no longer used ([#5084](https://github.com/videojs/video.js/pull/5084)) by [@gkatsev](https://github.com/gkatsev)
- Update rollup and uglify and the build process ([#5096](https://github.com/videojs/video.js/pull/5096)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update karma to version 2.0.2 🚀 ([#5109](https://github.com/videojs/video.js/pull/5109)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update klaw-sync to version 4.0.0 🚀 ([#5130](https://github.com/videojs/video.js/pull/5130)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update load-grunt-tasks to version 4.0.0 🚀 ([#5151](https://github.com/videojs/video.js/pull/5151)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update unified to version 7.0.0 🚀 ([#5166](https://github.com/videojs/video.js/pull/5166)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update rollup-plugin-json to version 3.0.0 🚀 ([#5169](https://github.com/videojs/video.js/pull/5169)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(CHANGELOG)* Update CHANGELOG from 6.x by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @monicao made their first contribution in [#5164](https://github.com/videojs/video.js/pull/5164)
* @axten made their first contribution in [#5123](https://github.com/videojs/video.js/pull/5123)
* @LuanComputacao made their first contribution in [#5122](https://github.com/videojs/video.js/pull/5122)
* @OshinKaramian made their first contribution in [#5107](https://github.com/videojs/video.js/pull/5107)
* @guided1 made their first contribution in [#5097](https://github.com/videojs/video.js/pull/5097)
* @squarebracket made their first contribution
* @strdr4605 made their first contribution in [#5073](https://github.com/videojs/video.js/pull/5073)

## [6.10.0] - 2018-05-11

### 🚀 Features
- Add 'autoSetup' option ([#5123](https://github.com/videojs/video.js/issues/5123)), closes [#5094](https://github.com/videojs/video.js/issues/5094)
- Copy properties from <video-js> to the media el from ([#5039](https://github.com/videojs/video.js/issues/5039)) as ([#5163](https://github.com/videojs/video.js/issues/5163))
- Update the players source cache on sourceset from ([#5040](https://github.com/videojs/video.js/issues/5040)) as ([#5156](https://github.com/videojs/video.js/issues/5156))

### 🐛 Bug Fixes
- *(time-display)* Restore hidden label text for screen readers. ([#5157](https://github.com/videojs/video.js/issues/5157)), closes [#5135](https://github.com/videojs/video.js/issues/5135)
- `sourceset` and browser behavior inconsistencies from ([#5054](https://github.com/videojs/video.js/issues/5054)) as ([#5162](https://github.com/videojs/video.js/issues/5162))
- Reduce the multiple-announcement by screen readers of the new name of a button when its text label changes. ([#5158](https://github.com/videojs/video.js/issues/5158)), closes [#5023](https://github.com/videojs/video.js/issues/5023)
- Remove spaces from element IDs and ARIA attributes in the Captions Settings Dialog ([#5153](https://github.com/videojs/video.js/issues/5153)), closes [#4688](https://github.com/videojs/video.js/issues/4688) [#4884](https://github.com/videojs/video.js/issues/4884)
- Remove unnecessary ARIA role on the Control Bar. ([#5154](https://github.com/videojs/video.js/issues/5154)), closes [#5134](https://github.com/videojs/video.js/issues/5134)

## [6.9.0] - 2018-04-20

### 🚀 Features
- Queue playback events when the playback rate is zero and we are seeking ([#5061](https://github.com/videojs/video.js/issues/5061)), closes [#5024](https://github.com/videojs/video.js/issues/5024)

### 🐛 Bug Fixes
- Fire sourceset on initial source append ([#5038](https://github.com/videojs/video.js/issues/5038)) ([#5072](https://github.com/videojs/video.js/issues/5072))
- Let the tech preload auto on its own ([#4861](https://github.com/videojs/video.js/issues/4861)) ([#5065](https://github.com/videojs/video.js/issues/5065)), closes [#4660](https://github.com/videojs/video.js/issues/4660)
- Options.id is now applied correctly to the player dom element ([#5090](https://github.com/videojs/video.js/issues/5090)), closes [#5088](https://github.com/videojs/video.js/issues/5088)
- Wait till play event to listen for user activity ([#5093](https://github.com/videojs/video.js/issues/5093)), closes [#5076](https://github.com/videojs/video.js/issues/5076)
- *(time-display)* Use formatTime for a consistent default instead of hardcoded string ([#5055](https://github.com/videojs/video.js/issues/5055))

### 🚜 Refactor
- Move seekbar event handler bindings into a function ([#5097](https://github.com/videojs/video.js/issues/5097))
- Move sourceset code out of tech ([#5049](https://github.com/videojs/video.js/issues/5049))

### 📚 Documentation
- *(debugging)* Fix markup typo ([#5086](https://github.com/videojs/video.js/issues/5086))
- *(guides)* Add debugging section to index ([#5100](https://github.com/videojs/video.js/issues/5100))

### 🧪 Testing
- Fix queue playing events test for ie8 (for real this time) ([#5110](https://github.com/videojs/video.js/issues/5110))
- Fix queued events test with playbackrate in IE8 ([#5105](https://github.com/videojs/video.js/issues/5105))

## [6.8.0] - 2018-03-19

### 🚀 Features
- Sourceset event ([#4660](https://github.com/videojs/video.js/pull/4660)) by [@brandonocasey](https://github.com/brandonocasey)
- Allow techs to change poster if player option `techCanOverridePoster` is set ([#4921](https://github.com/videojs/video.js/pull/4921))
- Add mimetype type to source object when possible ([#4469](https://github.com/videojs/video.js/pull/4469)) ([#4947](https://github.com/videojs/video.js/pull/4947)) by [@davidgg](https://github.com/davidgg)
- *(format time)* Add setFormatTime for overriding the time format  ([#4962](https://github.com/videojs/video.js/pull/4962)) by [@twosmalltrees](https://github.com/twosmalltrees)
- Use CSS grid for Caption Settings dialog to begin making it more responsive ([#4997](https://github.com/videojs/video.js/pull/4997)) by [@RevinKey](https://github.com/RevinKey)
- Require enableSourceset option for event ([#5031](https://github.com/videojs/video.js/pull/5031)) by [@gkatsev](https://github.com/gkatsev)

### 🐛 Bug Fixes
- Don't add captions settings menu item when TextTrackSettings is disabled ([#5002](https://github.com/videojs/video.js/pull/5002)) by [@vsoren](https://github.com/vsoren)
- *(sourceset)* Set evt.src to empty string or src attr from load ([#5016](https://github.com/videojs/video.js/pull/5016)) by [@gkatsev](https://github.com/gkatsev)

### 📚 Documentation
- *(react guide)* Update guide to prevent memory leaks when components are disposed of ([#4998](https://github.com/videojs/video.js/pull/4998)) by [@EHummerston](https://github.com/EHummerston)
- *(component)* Fix misspellings ([#5017](https://github.com/videojs/video.js/pull/5017)) by [@Maysjtu](https://github.com/Maysjtu)
- *(component)* Fix misspelllings ([#5019](https://github.com/videojs/video.js/pull/5019)) by [@Maysjtu](https://github.com/Maysjtu)
- *(time-ranges)* Fix misspellings ([#5025](https://github.com/videojs/video.js/pull/5025)) by [@Maysjtu](https://github.com/Maysjtu)
- *(time-ranges)* Fix wrong comment for getRange function ([#5026](https://github.com/videojs/video.js/pull/5026)) by [@Maysjtu](https://github.com/Maysjtu)

### 🧪 Testing
- *(ResizeManager)* Only listen for one playerresize to make test not flaky ([#5022](https://github.com/videojs/video.js/pull/5022)) by [@gkatsev](https://github.com/gkatsev)

### ⚙️ Miscellaneous Tasks
- Make sure first-timers bot uses our template ([#5001](https://github.com/videojs/video.js/pull/5001)) by [@gkatsev](https://github.com/gkatsev)
- *(dom.js)* Fix misspellings ([#5008](https://github.com/videojs/video.js/pull/5008)) by [@Maysjtu](https://github.com/Maysjtu)
- Update package-lock.json by [@gkatsev](https://github.com/gkatsev)

### ◀️ Revert
- Revert "fix: force autoplay in Chrome ([#4804](https://github.com/videojs/video.js/pull/4804))" ([#5009](https://github.com/videojs/video.js/pull/5009)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @Maysjtu made their first contribution in [#5026](https://github.com/videojs/video.js/pull/5026)
* @vsoren made their first contribution in [#5002](https://github.com/videojs/video.js/pull/5002)
* @twosmalltrees made their first contribution in [#4962](https://github.com/videojs/video.js/pull/4962)
* @davidgg made their first contribution in [#4947](https://github.com/videojs/video.js/pull/4947)
* @EHummerston made their first contribution in [#4998](https://github.com/videojs/video.js/pull/4998)

## [6.7.4] - 2018-03-05

### 🐛 Bug Fixes
- *(package)* Update videojs-vtt.js to version 0.12.6 ([#4954](https://github.com/videojs/video.js/pull/4954)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Fix an issue where disabling the progress control would throw an error. ([#4986](https://github.com/videojs/video.js/pull/4986)) by [@misteroneill](https://github.com/misteroneill)
- *(events)* Triggering with an object had incorrect target property on event object ([#4993](https://github.com/videojs/video.js/pull/4993)) by [@gkatsev](https://github.com/gkatsev)
- *(text-tracks)* Keep showing captions even if the text track settings were disabled ([#4974](https://github.com/videojs/video.js/pull/4974)) by [@ookami125](https://github.com/ookami125)

### ⚙️ Miscellaneous Tasks
- *(package)* Update grunt-accessibility to version 6.0.0 🚀 ([#4968](https://github.com/videojs/video.js/pull/4968)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])

### New Contributors
* @ookami125 made their first contribution in [#4974](https://github.com/videojs/video.js/pull/4974)

## [6.7.3] - 2018-02-22

### 🐛 Bug Fixes
- *(text-track-settings)* Fix track settings font class name ([#4956](https://github.com/videojs/video.js/pull/4956)) by [@ivan-cerjan](https://github.com/ivan-cerjan)
- Regression for getting a player via the tech's id ([#4969](https://github.com/videojs/video.js/pull/4969)) by [@gkatsev](https://github.com/gkatsev)
- Add alternate text to the loading spinner. ([#4916](https://github.com/videojs/video.js/pull/4916)) by [@misteroneill](https://github.com/misteroneill)

### 📚 Documentation
- *(react)* Update docs for react tutorial ([#4935](https://github.com/videojs/video.js/pull/4935)) ([#4952](https://github.com/videojs/video.js/pull/4952)) by [@zhulduz](https://github.com/zhulduz)
- *(plugins guide)* Changed paused to pause where appropriate ([#4957](https://github.com/videojs/video.js/pull/4957)) by [@jessdvdv](https://github.com/jessdvdv)

### ⚙️ Miscellaneous Tasks
- Add first-timers-issue-template.md ([#4958](https://github.com/videojs/video.js/pull/4958)) by [@gkatsev](https://github.com/gkatsev)
- Re-enable Greenkeeper 🌴 and make it update package-lock.json ([#4967](https://github.com/videojs/video.js/pull/4967)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])

### New Contributors
* @jessdvdv made their first contribution in [#4957](https://github.com/videojs/video.js/pull/4957)
* @ivan-cerjan made their first contribution in [#4956](https://github.com/videojs/video.js/pull/4956)
* @zhulduz made their first contribution in [#4952](https://github.com/videojs/video.js/pull/4952)

## [6.7.2] - 2018-02-13

### 🐛 Bug Fixes
- Only select TextTrackMenuItem if unselected ([#4920](https://github.com/videojs/video.js/pull/4920)) by [@alex-barstow](https://github.com/alex-barstow)
- Cache middleware instances per player ([#4939](https://github.com/videojs/video.js/pull/4939)) by [@gkatsev](https://github.com/gkatsev)
- *(progress control)* Fix the video continuing to play when the user scrubs outside of seekbar ([#4918](https://github.com/videojs/video.js/pull/4918)) by [@199911](https://github.com/199911)

### 📚 Documentation
- Fix the advance plugin example in documentation ([#4923](https://github.com/videojs/video.js/pull/4923)) by [@199911](https://github.com/199911)
- *(middleware)* Update the middleware guide with setTech and other corrections ([#4926](https://github.com/videojs/video.js/pull/4926)) by [@ldayananda](https://github.com/ldayananda)

### New Contributors
* @199911 made their first contribution in [#4918](https://github.com/videojs/video.js/pull/4918)

## [6.7.1] - 2018-01-31

## [6.7.0] - 2018-01-30

### 🚀 Features
- Add `getPlayer` method to Video.js. ([#4836](https://github.com/videojs/video.js/pull/4836)) by [@misteroneill](https://github.com/misteroneill)
- Add mediator middleware type for play() ([#4868](https://github.com/videojs/video.js/pull/4868)) by [@ldayananda](https://github.com/ldayananda)
- Add `videojs.getAllPlayers` to get an array of players. ([#4842](https://github.com/videojs/video.js/pull/4842)) by [@misteroneill](https://github.com/misteroneill)
- Playerresize event in all cases ([#4864](https://github.com/videojs/video.js/pull/4864)) by [@gkatsev](https://github.com/gkatsev)

### 🐛 Bug Fixes
- Do not patch canplaytype on android chrome ([#4885](https://github.com/videojs/video.js/pull/4885)) by [@mister-ben](https://github.com/mister-ben)

### 📚 Documentation
- Update COLLABORATOR_GUIDE.md and CONTRIBUTING.md to include label meanings ([#4874](https://github.com/videojs/video.js/pull/4874)) by [@ldayananda](https://github.com/ldayananda)

### 🧪 Testing
- Add project and build names to browserstack ([#4903](https://github.com/videojs/video.js/pull/4903)) by [@gkatsev](https://github.com/gkatsev)

### ⚙️ Miscellaneous Tasks
- Generate a test example on netlify for PRs ([#4912](https://github.com/videojs/video.js/pull/4912)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update dependencies ([#4908](https://github.com/videojs/video.js/pull/4908)) by [@gkatsev](https://github.com/gkatsev)

## [6.6.3] - 2018-01-24

### 🐛 Bug Fixes
- Hide volume slider when the slider is not active and mute toggle button is in focus ([#4866](https://github.com/videojs/video.js/pull/4866)) by [@mrdtron](https://github.com/mrdtron)

### 💼 Other
- Update package-lock.json by [@gkatsev](https://github.com/gkatsev)

### 📚 Documentation
- Fix some typos ([#4880](https://github.com/videojs/video.js/pull/4880)) by [@thijstriemstra](https://github.com/thijstriemstra)
- Add middleware guide ([#4877](https://github.com/videojs/video.js/pull/4877)) by [@ldayananda](https://github.com/ldayananda)

### ⚙️ Miscellaneous Tasks
- *(package)* Update remark-cli to version 5.0.0 ([#4894](https://github.com/videojs/video.js/pull/4894)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update remark-stringify to version 5.0.0 ([#4893](https://github.com/videojs/video.js/pull/4893)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update remark-parse to version 5.0.0 ([#4892](https://github.com/videojs/video.js/pull/4892)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update shelljs to version 0.8.1 ([#4899](https://github.com/videojs/video.js/pull/4899)) by [@gkatsev](https://github.com/gkatsev)
- *(docs site)* Use git commit message for netlify build ([#4900](https://github.com/videojs/video.js/pull/4900)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @mrdtron made their first contribution in [#4866](https://github.com/videojs/video.js/pull/4866)

## [6.6.2] - 2018-01-05

### 🐛 Bug Fixes
- Progress bar time tooltips bug by adding word-break css reset ([#4859](https://github.com/videojs/video.js/pull/4859)) by [@rishabh92](https://github.com/rishabh92)
- Silence unhandled promise rejection in Safari when seeking ([#4860](https://github.com/videojs/video.js/pull/4860)) by [@calvincorreli](https://github.com/calvincorreli)

### 📚 Documentation
- Wait for text track load with addRemoteTextTrack ([#4855](https://github.com/videojs/video.js/pull/4855)) by [@kocoten1992](https://github.com/kocoten1992)

### ⚙️ Miscellaneous Tasks
- *(package)* Update karma to version 2.0.0 ([#4834](https://github.com/videojs/video.js/pull/4834)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(netlify)* Add some debug info in the netlify command ([#4862](https://github.com/videojs/video.js/pull/4862)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @calvincorreli made their first contribution in [#4860](https://github.com/videojs/video.js/pull/4860)
* @rishabh92 made their first contribution in [#4859](https://github.com/videojs/video.js/pull/4859)

## [6.6.1] - 2018-01-04

### 🐛 Bug Fixes
- Replace &nbsp; with \u00a0 ([#4825](https://github.com/videojs/video.js/pull/4825)) by [@thecotne](https://github.com/thecotne)
- *(lang)* Complete the Simplified Chinese translations (zn-CN.json) ([#4827](https://github.com/videojs/video.js/pull/4827)) by [@hopechannel](https://github.com/hopechannel)
- *(lang)* Complete the Traditional Chinese translation (zh-CT.json) ([#4828](https://github.com/videojs/video.js/pull/4828)) by [@hopechannel](https://github.com/hopechannel)
- Fix an issue where hookOnce failed for the 'beforesetup' hook. ([#4841](https://github.com/videojs/video.js/pull/4841)) by [@misteroneill](https://github.com/misteroneill)
- Wrap audio change handler rather than bind so a player dispose doesn't affect other players ([#4847](https://github.com/videojs/video.js/pull/4847)) by [@forbesjo](https://github.com/forbesjo)

### ⚙️ Miscellaneous Tasks
- *(lang)* Update translations needed doc ([#4858](https://github.com/videojs/video.js/pull/4858)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @thecotne made their first contribution in [#4825](https://github.com/videojs/video.js/pull/4825)

## [6.6.0] - 2017-12-15

### 🚀 Features
- Add support for debug logging ([#4780](https://github.com/videojs/video.js/pull/4780)) by [@gesinger](https://github.com/gesinger)
- Playerresize event on Player dimension API calls ([#4800](https://github.com/videojs/video.js/pull/4800)) by [@sivapalan](https://github.com/sivapalan)
- *(css)* Add a delay before showing loading spinner ([#4806](https://github.com/videojs/video.js/pull/4806)) by [@keymnsk](https://github.com/keymnsk)

### 🐛 Bug Fixes
- *(package)* Update videojs-font to version 2.1.0 ([#4812](https://github.com/videojs/video.js/pull/4812)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Modify debug log tests to accomodate old IE stringification ([#4824](https://github.com/videojs/video.js/pull/4824)) by [@gesinger](https://github.com/gesinger)

### ⚙️ Miscellaneous Tasks
- *(package)* Update remark-toc to version 5.0.0 ([#4803](https://github.com/videojs/video.js/pull/4803)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Switch to node 8 ([#4813](https://github.com/videojs/video.js/pull/4813)) by [@gkatsev](https://github.com/gkatsev)
- Remove unused deps ([#4814](https://github.com/videojs/video.js/pull/4814)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @keymnsk made their first contribution in [#4806](https://github.com/videojs/video.js/pull/4806)
* @sivapalan made their first contribution in [#4800](https://github.com/videojs/video.js/pull/4800)

## [6.5.2] - 2017-12-14

### 🐛 Bug Fixes
- Seek to 0 if attempt is made to seek to negative value ([#4799](https://github.com/videojs/video.js/pull/4799)) by [@CharlesRyan](https://github.com/CharlesRyan)
- *(html5)* Loop video el attributes in order ([#4805](https://github.com/videojs/video.js/pull/4805)) by [@gkatsev](https://github.com/gkatsev)
- Force autoplay in Chrome ([#4804](https://github.com/videojs/video.js/pull/4804)) by [@gkatsev](https://github.com/gkatsev)
- Use correct logic for menu focus ([#4823](https://github.com/videojs/video.js/pull/4823)) by [@mfairchild365](https://github.com/mfairchild365)

### ⚙️ Miscellaneous Tasks
- Remove unused popup classes ([#4792](https://github.com/videojs/video.js/pull/4792)) by [@gkatsev](https://github.com/gkatsev)
- *(lang)* Add translation for "caption settings" in zh-TW.json ([#4816](https://github.com/videojs/video.js/pull/4816)) by [@hopechannel](https://github.com/hopechannel)
- *(lang)* Add translation for "caption settings" in zh-CN.json ([#4815](https://github.com/videojs/video.js/pull/4815)) by [@hopechannel](https://github.com/hopechannel)

### New Contributors
* @mfairchild365 made their first contribution in [#4823](https://github.com/videojs/video.js/pull/4823)
* @hopechannel made their first contribution in [#4815](https://github.com/videojs/video.js/pull/4815)
* @CharlesRyan made their first contribution in [#4799](https://github.com/videojs/video.js/pull/4799)

## [6.5.1] - 2017-12-04

### 🐛 Bug Fixes
- Null check closest.getAttribute ([#4763](https://github.com/videojs/video.js/pull/4763)) by [@emkayy](https://github.com/emkayy)
- Off text tracks should be set based on current state ([#4775](https://github.com/videojs/video.js/pull/4775)) by [@brandonocasey](https://github.com/brandonocasey)
- Cannot drag on progress bar in IE9 ([#4783](https://github.com/videojs/video.js/pull/4783)) by [@kocoten1992](https://github.com/kocoten1992)
- Remove listener used to test if passive listeners are supported ([#4787](https://github.com/videojs/video.js/pull/4787)) by [@Mulder90](https://github.com/Mulder90)

### 📚 Documentation
- Deploy docs using netlify ([#4774](https://github.com/videojs/video.js/pull/4774)) by [@gkatsev](https://github.com/gkatsev)
- Clarify text tracks are meant for any usage of Video.js, both video and audio ([#4790](https://github.com/videojs/video.js/pull/4790)) by [@thijstriemstra](https://github.com/thijstriemstra)

### ⚙️ Miscellaneous Tasks
- Css is not built initially on grunt dev ([#4778](https://github.com/videojs/video.js/pull/4778)) by [@brandonocasey](https://github.com/brandonocasey)

### New Contributors
* @Mulder90 made their first contribution in [#4787](https://github.com/videojs/video.js/pull/4787)
* @emkayy made their first contribution in [#4763](https://github.com/videojs/video.js/pull/4763)

## [6.5.0] - 2017-11-17

### 🚀 Features
- Add a version method to all advanced plugin instances ([#4714](https://github.com/videojs/video.js/pull/4714)) by [@brandonocasey](https://github.com/brandonocasey)
- Allow embeds via <video-js> element ([#4640](https://github.com/videojs/video.js/pull/4640)) by [@gkatsev](https://github.com/gkatsev)

### 🐛 Bug Fixes
- Make the progress bar progress smoothly ([#4591](https://github.com/videojs/video.js/pull/4591)) by [@vhmth](https://github.com/vhmth)
- Avoid empty but shown title attribute with menu items and clickable components ([#4746](https://github.com/videojs/video.js/pull/4746)) by [@arski](https://github.com/arski)
- Only allow left click dragging on progress bar and volume control ([#4613](https://github.com/videojs/video.js/pull/4613)) by [@kocoten1992](https://github.com/kocoten1992)
- *(Player#play)* Wait for loadstart in play() when changing sources instead of just ready. ([#4743](https://github.com/videojs/video.js/pull/4743)) by [@misteroneill](https://github.com/misteroneill)
- Only print element not in DOM warning on player creation ([#4755](https://github.com/videojs/video.js/pull/4755)) by [@brandonocasey](https://github.com/brandonocasey)
- Trigger timeupdate during seek ([#4754](https://github.com/videojs/video.js/pull/4754))
- Being able to toggle playback with middle click ([#4756](https://github.com/videojs/video.js/pull/4756)) by [@kocoten1992](https://github.com/kocoten1992)

### 🚜 Refactor
- Player.listenForUserActivity_() ([#4719](https://github.com/videojs/video.js/pull/4719)) by [@kocoten1992](https://github.com/kocoten1992)
- Player.controls() ([#4731](https://github.com/videojs/video.js/pull/4731)) by [@kocoten1992](https://github.com/kocoten1992)
- Player.usingNativeControls() ([#4749](https://github.com/videojs/video.js/pull/4749)) by [@kocoten1992](https://github.com/kocoten1992)
- Player.userActive() ([#4716](https://github.com/videojs/video.js/pull/4716)) by [@kocoten1992](https://github.com/kocoten1992)

### 📚 Documentation
- *(readme)* Fixed a typo ([#4730](https://github.com/videojs/video.js/pull/4730))

### ⚡ Performance
- Null out els on dispose to minimize detached els ([#4745](https://github.com/videojs/video.js/pull/4745)) by [@gkatsev](https://github.com/gkatsev)

### 🧪 Testing
- Warning, if the element is not in the DOM ([#4723](https://github.com/videojs/video.js/pull/4723)) by [@odisei369](https://github.com/odisei369)
- Clean up test warnings ([#4752](https://github.com/videojs/video.js/pull/4752)) by [@brandonocasey](https://github.com/brandonocasey)
- Update tests to use qunit 2 assert format ([#4753](https://github.com/videojs/video.js/pull/4753)) by [@brandonocasey](https://github.com/brandonocasey)

### ⚙️ Miscellaneous Tasks
- *(lang)* Update Persian translations ([#4741](https://github.com/videojs/video.js/pull/4741)) by [@EhsanCh](https://github.com/EhsanCh)

### New Contributors
* @EhsanCh made their first contribution in [#4741](https://github.com/videojs/video.js/pull/4741)
* @vhmth made their first contribution in [#4591](https://github.com/videojs/video.js/pull/4591)

## [6.4.0] - 2017-11-01

### 🚀 Features
- *(lang)* Update for Russian translation ([#4663](https://github.com/videojs/video.js/pull/4663)) by [@estim](https://github.com/estim)
- *(lang)* Add Hebrew translation ([#4675](https://github.com/videojs/video.js/pull/4675)) by [@seggev319](https://github.com/seggev319)
- Add videojs.hookOnce method to allow single-run hooks. ([#4672](https://github.com/videojs/video.js/pull/4672)) by [@misteroneill](https://github.com/misteroneill)
- Set the play progress seek bar to 100% on ended ([#4648](https://github.com/videojs/video.js/pull/4648)) by [@brandonocasey](https://github.com/brandonocasey)
- Allow progress controls to be disabled ([#4649](https://github.com/videojs/video.js/pull/4649)) by [@brandonocasey](https://github.com/brandonocasey)
- Add warning if the element given to Video.js is not in the DOM ([#4698](https://github.com/videojs/video.js/pull/4698)) by [@odisei369](https://github.com/odisei369)

### 🐛 Bug Fixes
- Make sure we remove vjs-ended from the play toggle in all appropriate cases. ([#4661](https://github.com/videojs/video.js/pull/4661)) by [@misteroneill](https://github.com/misteroneill)
- *(css)* Update user-select none ([#4678](https://github.com/videojs/video.js/pull/4678)) by [@kocoten1992](https://github.com/kocoten1992)
- Don't enable player controls if they where disabled when ModalDialog closes. ([#4690](https://github.com/videojs/video.js/pull/4690)) by [@nicolaslevy](https://github.com/nicolaslevy)
- Events#off threw if Object.prototype had extra enumerable properties, don't remove all events if off receives a falsey value ([#4669](https://github.com/videojs/video.js/pull/4669)) by [@mmodrow](https://github.com/mmodrow)
- Make parseUrl helper always have a protocl ([#4673](https://github.com/videojs/video.js/pull/4673)) by [@mmodrow](https://github.com/mmodrow)
- Aria-labelledby attribute has an extra space ([#4708](https://github.com/videojs/video.js/pull/4708)) by [@knilob](https://github.com/knilob)
- Don't throttle duration change updates ([#4635](https://github.com/videojs/video.js/pull/4635)) by [@brandonocasey](https://github.com/brandonocasey)
- Player.src() should return empty string if no source is set ([#4711](https://github.com/videojs/video.js/pull/4711)) by [@forbesjo](https://github.com/forbesjo)

### 🚜 Refactor
- Player.hasStarted() ([#4680](https://github.com/videojs/video.js/pull/4680)) by [@kocoten1992](https://github.com/kocoten1992)
- Player.techGet_() ([#4687](https://github.com/videojs/video.js/pull/4687)) by [@kocoten1992](https://github.com/kocoten1992)
- Component.ready() ([#4693](https://github.com/videojs/video.js/pull/4693)) by [@kocoten1992](https://github.com/kocoten1992)
- Player.dimension() ([#4704](https://github.com/videojs/video.js/pull/4704)) by [@kocoten1992](https://github.com/kocoten1992)

### 📚 Documentation
- *(lang)* Update translations needed doc ([#4702](https://github.com/videojs/video.js/pull/4702)) by [@gkatsev](https://github.com/gkatsev)

### 🧪 Testing
- Get rid of redundant test logging ([#4682](https://github.com/videojs/video.js/pull/4682)) by [@brandonocasey](https://github.com/brandonocasey)
- Fix modal dialog test for showing controls ([#4707](https://github.com/videojs/video.js/pull/4707)) by [@gkatsev](https://github.com/gkatsev)

### ⚙️ Miscellaneous Tasks
- *(gh-release)* No console log on success ([#4657](https://github.com/videojs/video.js/pull/4657)) by [@gkatsev](https://github.com/gkatsev)
- Add package-lock.json file. ([#4641](https://github.com/videojs/video.js/pull/4641)) by [@misteroneill](https://github.com/misteroneill)
- *(package)* Update babelify to version 8.0.0 ([#4684](https://github.com/videojs/video.js/pull/4684)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(lang)* Update Polish ([#4686](https://github.com/videojs/video.js/pull/4686)) by [@mister-ben](https://github.com/mister-ben)
- Add comment about avoiding helvetica font ([#4679](https://github.com/videojs/video.js/pull/4679)) by [@kocoten1992](https://github.com/kocoten1992)
- Add GA note to primary readme ([#4481](https://github.com/videojs/video.js/pull/4481)) by [@mmcc](https://github.com/mmcc)

### New Contributors
* @odisei369 made their first contribution in [#4698](https://github.com/videojs/video.js/pull/4698)
* @knilob made their first contribution in [#4708](https://github.com/videojs/video.js/pull/4708)
* @mmodrow made their first contribution in [#4673](https://github.com/videojs/video.js/pull/4673)
* @nicolaslevy made their first contribution in [#4690](https://github.com/videojs/video.js/pull/4690)
* @seggev319 made their first contribution in [#4675](https://github.com/videojs/video.js/pull/4675)
* @estim made their first contribution in [#4663](https://github.com/videojs/video.js/pull/4663)

## [6.3.3] - 2017-10-10

### 🐛 Bug Fixes
- A possible breaking change caused by the use of remainingTimeDisplay ([#4655](https://github.com/videojs/video.js/pull/4655)) by [@brandonocasey](https://github.com/brandonocasey)

### 📚 Documentation
- *(hooks)* Fix Typo ([#4652](https://github.com/videojs/video.js/pull/4652)) by [@Castar](https://github.com/Castar)

### New Contributors
* @Castar made their first contribution in [#4652](https://github.com/videojs/video.js/pull/4652)

## [6.3.2] - 2017-10-04

### 🐛 Bug Fixes
- Fix a typo in current time display component. ([#4647](https://github.com/videojs/video.js/pull/4647)) by [@misteroneill](https://github.com/misteroneill)

### 📚 Documentation
- Document how to add a version number to a plugin ([#4642](https://github.com/videojs/video.js/pull/4642)) by [@thijstriemstra](https://github.com/thijstriemstra)

## [6.3.1] - 2017-10-03

### 🐛 Bug Fixes
- Make sure time displays use correctly-formatted time. ([#4643](https://github.com/videojs/video.js/pull/4643)) by [@misteroneill](https://github.com/misteroneill)

## [6.3.0] - 2017-10-03

### 🚀 Features
- Display currentTime as duration and remainingTime as 0 on ended ([#4634](https://github.com/videojs/video.js/pull/4634)) by [@brandonocasey](https://github.com/brandonocasey)
- Do not set focus in sub-menus to prevent undesirable scrolling behavior in iOS ([#4607](https://github.com/videojs/video.js/pull/4607)) by [@alex-barstow](https://github.com/alex-barstow)
- Add remainingTimeDisplay method to Player ([#4620](https://github.com/videojs/video.js/pull/4620)) by [@brandonocasey](https://github.com/brandonocasey)

### 🐛 Bug Fixes
- Reset to a play/pause button when seeking after ended ([#4614](https://github.com/videojs/video.js/pull/4614)) by [@brandonocasey](https://github.com/brandonocasey)

### 🚜 Refactor
- Create a base time display class, and use it ([#4633](https://github.com/videojs/video.js/pull/4633)) by [@brandonocasey](https://github.com/brandonocasey)

### 📚 Documentation
- Document playbackRates ([#4602](https://github.com/videojs/video.js/pull/4602)) by [@edemaine](https://github.com/edemaine)
- Update player reference in advanced plugins doc ([#4622](https://github.com/videojs/video.js/pull/4622)) by [@thijstriemstra](https://github.com/thijstriemstra)

### ⚙️ Miscellaneous Tasks
- Alias rollup-dev to watch for development ([#4615](https://github.com/videojs/video.js/pull/4615)) by [@brandonocasey](https://github.com/brandonocasey)
- *(package)* Update grunt-browserify to version 5.2.0 ([#4578](https://github.com/videojs/video.js/pull/4578)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update remark-validate-links to version 7.0.0 ([#4585](https://github.com/videojs/video.js/pull/4585)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(lang)* Update Vietnamese ([#4625](https://github.com/videojs/video.js/pull/4625)) by [@ngoisaosang](https://github.com/ngoisaosang)
- *(lang)* Update Dutch ([#4588](https://github.com/videojs/video.js/pull/4588)) by [@silverxp](https://github.com/silverxp)

### New Contributors
* @silverxp made their first contribution in [#4588](https://github.com/videojs/video.js/pull/4588)
* @edemaine made their first contribution in [#4602](https://github.com/videojs/video.js/pull/4602)

## [6.2.8] - 2017-09-01

### 🐛 Bug Fixes
- Rely on browser or tech to handle autoplay ([#4582](https://github.com/videojs/video.js/pull/4582)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Remove pkg.module ([#4594](https://github.com/videojs/video.js/pull/4594)) by [@gkatsev](https://github.com/gkatsev)

### 📚 Documentation
- *(COLLABORATOR_GUIDE)* How to release Video.js ([#4586](https://github.com/videojs/video.js/pull/4586)) by [@gkatsev](https://github.com/gkatsev)
- Update to width and height doc comments ([#4592](https://github.com/videojs/video.js/pull/4592)) by [@mboles](https://github.com/mboles)

## [6.2.7] - 2017-08-24

### 🐛 Bug Fixes
- Use typeof for checking preload option ([#4574](https://github.com/videojs/video.js/pull/4574)) by [@gkatsev](https://github.com/gkatsev)

### ⚙️ Miscellaneous Tasks
- *(package)* Update rollup to version 0.47.5 ([#4572](https://github.com/videojs/video.js/pull/4572)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])

## [6.2.6] - 2017-08-16

### 🐛 Bug Fixes
- Set width and height for vjs-button like the SubsCaps button ([#4548](https://github.com/videojs/video.js/pull/4548)) by [@Kishan08](https://github.com/Kishan08)
- Remove 'use strict' from rollup because vttjs isn't strict ([#4551](https://github.com/videojs/video.js/pull/4551)) by [@gkatsev](https://github.com/gkatsev)
- Playback rate default text ([#4558](https://github.com/videojs/video.js/pull/4558)) by [@rafaelgaspar](https://github.com/rafaelgaspar)
- Make boolean attributes set and check both the associated property and the attribute ([#4562](https://github.com/videojs/video.js/pull/4562)) by [@gkatsev](https://github.com/gkatsev)
- *(lang)* Typos in ar.json ([#4528](https://github.com/videojs/video.js/pull/4528)) by [@atefBB](https://github.com/atefBB)

### 💼 Other
- Issue where tracks are disabled and cuepoints are cleared in iOS native player ([#4496](https://github.com/videojs/video.js/pull/4496)) by [@alex-barstow](https://github.com/alex-barstow)

### 📚 Documentation
- Updates to faq, language guide, and minor edits ([#4556](https://github.com/videojs/video.js/pull/4556)) by [@mister-ben](https://github.com/mister-ben)

### ⚙️ Miscellaneous Tasks
- *(package)* Update klaw-sync to version 3.0.0 ([#4544](https://github.com/videojs/video.js/pull/4544)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Improve dev and beginner experience ([#4555](https://github.com/videojs/video.js/pull/4555)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update grunt-babel to version 7.0.0 ([#4553](https://github.com/videojs/video.js/pull/4553)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update grunt-browserify to version 5.1.0 ([#4565](https://github.com/videojs/video.js/pull/4565)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update rollup to version 0.47.4 ([#4570](https://github.com/videojs/video.js/pull/4570)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @atefBB made their first contribution in [#4528](https://github.com/videojs/video.js/pull/4528)
* @rafaelgaspar made their first contribution in [#4558](https://github.com/videojs/video.js/pull/4558)
* @Kishan08 made their first contribution in [#4548](https://github.com/videojs/video.js/pull/4548)

## [6.2.5] - 2017-07-26

### 🐛 Bug Fixes
- Only change focus from BPB if not a mouse click ([#4497](https://github.com/videojs/video.js/pull/4497)) by [@gkatsev](https://github.com/gkatsev)

### ⚙️ Miscellaneous Tasks
- *(package)* Update remark-stringify to version 4.0.0 ([#4506](https://github.com/videojs/video.js/pull/4506)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update remark-parse to version 4.0.0 ([#4507](https://github.com/videojs/video.js/pull/4507)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update remark-cli to version 4.0.0 ([#4508](https://github.com/videojs/video.js/pull/4508)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(greenkeeper)* Ignore webpack and uglify ([#4518](https://github.com/videojs/video.js/pull/4518)) by [@gkatsev](https://github.com/gkatsev)

## [6.2.4] - 2017-07-14

### ⚙️ Miscellaneous Tasks
- Fix gh-release minimist call ([#4489](https://github.com/videojs/video.js/pull/4489)) by [@gkatsev](https://github.com/gkatsev)

## [6.2.3] - 2017-07-14

### ⚙️ Miscellaneous Tasks
- *(gh-release)* Add prerelease flag and find right zip  ([#4488](https://github.com/videojs/video.js/pull/4488)) by [@gkatsev](https://github.com/gkatsev)

## [6.2.2] - 2017-07-14

### 🐛 Bug Fixes
- *(playback rate menu)* Cycling rates via click ([#4486](https://github.com/videojs/video.js/pull/4486)) by [@gkatsev](https://github.com/gkatsev)

### 📚 Documentation
- Fix Player#src API documentation. ([#4454](https://github.com/videojs/video.js/pull/4454)) by [@misteroneill](https://github.com/misteroneill)
- Make jsdoc generate anchor names so ToC links work ([#4471](https://github.com/videojs/video.js/pull/4471)) by [@gkatsev](https://github.com/gkatsev)

### 🧪 Testing
- Add unit tests for player.duration() ([#4459](https://github.com/videojs/video.js/pull/4459)) by [@alex-barstow](https://github.com/alex-barstow)

### ⚙️ Miscellaneous Tasks
- *(build)* Remove unused var in build/version.js ([#4458](https://github.com/videojs/video.js/pull/4458))
- Switch to using chrome for testing PRs on travis ([#4462](https://github.com/videojs/video.js/pull/4462)) by [@gkatsev](https://github.com/gkatsev)
- Add automatic github release ([#4466](https://github.com/videojs/video.js/pull/4466)) by [@gkatsev](https://github.com/gkatsev)
- *(package)* Update rollup to version 0.45.2 ([#4487](https://github.com/videojs/video.js/pull/4487)) by [@gkatsev](https://github.com/gkatsev)

## [6.2.1] - 2017-06-28

### 🐛 Bug Fixes
- Update translations to match correct string ([#4383](https://github.com/videojs/video.js/pull/4383)) by [@mister-ben](https://github.com/mister-ben)
- IE10 issue for disableOthers when property access results in "permission denied" ([#4395](https://github.com/videojs/video.js/pull/4395)) by [@JetLogs](https://github.com/JetLogs)
- Safari picture-in-picture triggers fullscreenchange ([#4437](https://github.com/videojs/video.js/pull/4437)) by [@mister-ben](https://github.com/mister-ben)
- Use passive event listeners for touchstart/touchmove ([#4440](https://github.com/videojs/video.js/pull/4440)) by [@mister-ben](https://github.com/mister-ben)
- Player.duration() should return NaN if duration is not known ([#4443](https://github.com/videojs/video.js/pull/4443)) by [@alex-barstow](https://github.com/alex-barstow)
- Auto-removal remote text tracks being removed when not supposed to ([#4450](https://github.com/videojs/video.js/pull/4450)) by [@gkatsev](https://github.com/gkatsev)

### 📚 Documentation
- Fixing player.remoteTextTracks jsdoc ([#4417](https://github.com/videojs/video.js/pull/4417)) by [@ldayananda](https://github.com/ldayananda)
- Update name of FullscreenToggle in documentation ([#4410](https://github.com/videojs/video.js/pull/4410)) by [@caleyshemc](https://github.com/caleyshemc)
- Fix links in API docs for several Player events. ([#4427](https://github.com/videojs/video.js/pull/4427)) by [@misteroneill](https://github.com/misteroneill)

### ⚡ Performance
- Various small performance improvements. ([#4426](https://github.com/videojs/video.js/pull/4426)) by [@misteroneill](https://github.com/misteroneill)

### ⚙️ Miscellaneous Tasks
- *(package)* Update rollup to version 0.42.0 ([#4392](https://github.com/videojs/video.js/pull/4392)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update rollup-watch to version 4.0.0 ([#4396](https://github.com/videojs/video.js/pull/4396)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update husky to version 0.14.1 ([#4444](https://github.com/videojs/video.js/pull/4444)) by [@gkatsev](https://github.com/gkatsev)
- *(sandbox)* Fix paths in sandbox files. ([#4416](https://github.com/videojs/video.js/pull/4416)) by [@misteroneill](https://github.com/misteroneill)

### New Contributors
* @JetLogs made their first contribution in [#4395](https://github.com/videojs/video.js/pull/4395)
* @caleyshemc made their first contribution in [#4410](https://github.com/videojs/video.js/pull/4410)

## [6.2.0] - 2017-05-30

### 🚀 Features
- Persist caption/description choice over source changes in emulated tracks ([#4295](https://github.com/videojs/video.js/pull/4295)) by [@ldayananda](https://github.com/ldayananda)
- *(lang)* Adding galician ([#4334](https://github.com/videojs/video.js/pull/4334)) by [@ablunier](https://github.com/ablunier)
- *(lang)* Update zh-CN.json ([#4370](https://github.com/videojs/video.js/pull/4370)) by [@hollton](https://github.com/hollton)
- *(lang)* Create sk.json ([#4374](https://github.com/videojs/video.js/pull/4374)) by [@idemovic](https://github.com/idemovic)
- Use Rollup to generate dist files ([#4301](https://github.com/videojs/video.js/pull/4301)) by [@gkatsev](https://github.com/gkatsev)

### 🧪 Testing
- *(TextTrackDisplay)* Removing incorrect test techOrder ([#4379](https://github.com/videojs/video.js/pull/4379)) by [@ldayananda](https://github.com/ldayananda)

### ⚙️ Miscellaneous Tasks
- *(package)* Update grunt-contrib-cssmin to version 2.2.0 ([#4345](https://github.com/videojs/video.js/pull/4345)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update videojs-flash to version 2.0.0 ([#4375](https://github.com/videojs/video.js/pull/4375)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- Update translations needed ([#4380](https://github.com/videojs/video.js/pull/4380)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @idemovic made their first contribution in [#4374](https://github.com/videojs/video.js/pull/4374)
* @hollton made their first contribution in [#4370](https://github.com/videojs/video.js/pull/4370)
* @ablunier made their first contribution in [#4334](https://github.com/videojs/video.js/pull/4334)

## [6.1.0] - 2017-05-15

### 🚀 Features
- Remove playbackRate blacklist for recent Android Chrome ([#4321](https://github.com/videojs/video.js/pull/4321)) by [@mister-ben](https://github.com/mister-ben)
- Add 'beforepluginsetup' event and named plugin setup events (e.g. 'pluginsetup:foo') ([#4255](https://github.com/videojs/video.js/pull/4255)) by [@misteroneill](https://github.com/misteroneill)
- Add a version class to the player ([#4320](https://github.com/videojs/video.js/pull/4320)) by [@mister-ben](https://github.com/mister-ben)
- Add getVideoPlaybackQuality API ([#4338](https://github.com/videojs/video.js/pull/4338)) by [@gesinger](https://github.com/gesinger)
- Deprecate firstplay event ([#4353](https://github.com/videojs/video.js/pull/4353)) by [@gkatsev](https://github.com/gkatsev)
- Add 'playsinline' player option ([#4348](https://github.com/videojs/video.js/pull/4348)) by [@alex-barstow](https://github.com/alex-barstow)

### 🐛 Bug Fixes
- Prevent dupe events on enabled ClickableComponents ([#4316](https://github.com/videojs/video.js/pull/4316)) by [@mister-ben](https://github.com/mister-ben)
- *(package)* Update global to version 4.3.2 ([#4291](https://github.com/videojs/video.js/pull/4291)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- TextTrackButton on Safari and iOS ([#4350](https://github.com/videojs/video.js/pull/4350)) by [@gkatsev](https://github.com/gkatsev)
- Only update text track mode if changed ([#4298](https://github.com/videojs/video.js/pull/4298)) by [@arski](https://github.com/arski)
- Only disable user-selection on sliders ([#4354](https://github.com/videojs/video.js/pull/4354)) by [@gkatsev](https://github.com/gkatsev)

### 📚 Documentation
- *(react-guide)* Use a React component as a VJS component ([#4287](https://github.com/videojs/video.js/pull/4287)) by [@davekiss](https://github.com/davekiss)

### ⚙️ Miscellaneous Tasks
- Typo soruce -> source ([#4307](https://github.com/videojs/video.js/pull/4307)) by [@sroucheray](https://github.com/sroucheray)
- Fix examples and docs and some links ([#4279](https://github.com/videojs/video.js/pull/4279)) by [@OwenEdwards](https://github.com/OwenEdwards)

### New Contributors
* @arski made their first contribution in [#4298](https://github.com/videojs/video.js/pull/4298)
* @sroucheray made their first contribution in [#4307](https://github.com/videojs/video.js/pull/4307)
* @davekiss made their first contribution in [#4287](https://github.com/videojs/video.js/pull/4287)

## [6.0.1] - 2017-04-13

### 🐛 Bug Fixes
- TechOrder names can be camelCased. ([#4277](https://github.com/videojs/video.js/pull/4277)) by [@gkatsev](https://github.com/gkatsev)
- Set IE_VERSION correctly for IE11 ([#4281](https://github.com/videojs/video.js/pull/4281)) by [@mjneil](https://github.com/mjneil)

### 📚 Documentation
- *(component)* Replace VolumeMenuButton with VolumePanel in component tree ([#4267](https://github.com/videojs/video.js/pull/4267)) by [@alex-barstow](https://github.com/alex-barstow)
- Remove mentions of bower support ([#4274](https://github.com/videojs/video.js/pull/4274)) by [@gesinger](https://github.com/gesinger)
- Add a Webpack usage guide ([#4261](https://github.com/videojs/video.js/pull/4261)) by [@MCDELTAT](https://github.com/MCDELTAT)

### ⚙️ Miscellaneous Tasks
- *(changelog)* Update CHANGELOG with v5 changes ([#4257](https://github.com/videojs/video.js/pull/4257)) by [@gkatsev](https://github.com/gkatsev)
- Gitignore all npm-debug.log.* ([#4252](https://github.com/videojs/video.js/pull/4252)) by [@denniswon](https://github.com/denniswon)
- Add slack travis notifications ([#4282](https://github.com/videojs/video.js/pull/4282)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @MCDELTAT made their first contribution in [#4261](https://github.com/videojs/video.js/pull/4261)
* @denniswon made their first contribution in [#4252](https://github.com/videojs/video.js/pull/4252)

## [6.0.0] - 2017-04-03

### 🚀 Features
- Log Levels ([#3853](https://github.com/videojs/video.js/pull/3853)) by [@misteroneill](https://github.com/misteroneill)
- Replay at ended ([#3868](https://github.com/videojs/video.js/pull/3868)) by [@mrocajr](https://github.com/mrocajr)
- [**breaking**] Restore all outlines for greater accessibility ([#3829](https://github.com/videojs/video.js/pull/3829)) by [@misteroneill](https://github.com/misteroneill)
- [**breaking**] Return the native Promise from play() ([#3907](https://github.com/videojs/video.js/pull/3907)) by [@brandonocasey](https://github.com/brandonocasey)
- Advanced Class-based Plugins for 6.0 ([#3690](https://github.com/videojs/video.js/pull/3690)) by [@misteroneill](https://github.com/misteroneill)
- *(player)* Add played(), defaultMuted(), defaultPlaybackRate() ([#3845](https://github.com/videojs/video.js/pull/3845)) by [@brandonocasey](https://github.com/brandonocasey)
- [**breaking**] Time Tooltips ([#3836](https://github.com/videojs/video.js/pull/3836)) by [@misteroneill](https://github.com/misteroneill)
- *(volume panel)* [**breaking**] Accessibly volume control ([#3957](https://github.com/videojs/video.js/pull/3957)) by [@brandonocasey](https://github.com/brandonocasey)
- [**breaking**] Remove flash tech ([#3956](https://github.com/videojs/video.js/pull/3956)) by [@brandonocasey](https://github.com/brandonocasey)
- [**breaking**] Middleware ([#3788](https://github.com/videojs/video.js/pull/3788)) by [@gkatsev](https://github.com/gkatsev)
- *(lang)* DE and FR translations of replay ([#3963](https://github.com/videojs/video.js/pull/3963)) by [@mister-ben](https://github.com/mister-ben)
- *(lang)* Update Vietnamese lang file ([#3964](https://github.com/videojs/video.js/pull/3964)) by [@ngoisaosang](https://github.com/ngoisaosang)
- *(lang)* Add European Portuguese translation ([#3955](https://github.com/videojs/video.js/pull/3955)) by [@diniscorreia](https://github.com/diniscorreia)
- Localize all strings in captions settings ([#3974](https://github.com/videojs/video.js/pull/3974)) by [@mister-ben](https://github.com/mister-ben)
- Make `registerTech` add that tech to the default `techOrder` ([#3985](https://github.com/videojs/video.js/pull/3985)) by [@brandonocasey](https://github.com/brandonocasey)
- Stateful Components ([#3960](https://github.com/videojs/video.js/pull/3960)) by [@misteroneill](https://github.com/misteroneill)
- Update MW to require a factory, add *-mw ([#3969](https://github.com/videojs/video.js/pull/3969)) by [@gkatsev](https://github.com/gkatsev)
- *(lang)* Update tr.json ([#3989](https://github.com/videojs/video.js/pull/3989)) by [@altaywtf](https://github.com/altaywtf)
- Unmute goes back to previously selected volume ([#3942](https://github.com/videojs/video.js/pull/3942)) by [@kevinlitchfield](https://github.com/kevinlitchfield)
- `videojs.getTech` works with `TitleCase` or `camelCase` names ([#4010](https://github.com/videojs/video.js/pull/4010)) by [@brandonocasey](https://github.com/brandonocasey)
- Allow seeking in full height of progress control ([#4004](https://github.com/videojs/video.js/pull/4004)) by [@gkatsev](https://github.com/gkatsev)
- Toggle playback with space when focused on seekbar ([#4005](https://github.com/videojs/video.js/pull/4005)) by [@gkatsev](https://github.com/gkatsev)
- *(lang)* Update es.json ([#3984](https://github.com/videojs/video.js/pull/3984)) by [@RevinKey](https://github.com/RevinKey)
- Expose Tech#resize event as Player#resize ([#3979](https://github.com/videojs/video.js/pull/3979)) by [@mister-ben](https://github.com/mister-ben)
- Wrap menu item text in a span ([#4026](https://github.com/videojs/video.js/pull/4026)) by [@gkatsev](https://github.com/gkatsev)
- Modal dialog accessibility updates ([#4025](https://github.com/videojs/video.js/pull/4025)) by [@gkatsev](https://github.com/gkatsev)
- Fix accessibility of the captions setting dialog ([#4050](https://github.com/videojs/video.js/pull/4050)) by [@gkatsev](https://github.com/gkatsev)
- Allow tokens in localize, localize progress bar time ([#4060](https://github.com/videojs/video.js/pull/4060)) by [@gkatsev](https://github.com/gkatsev)
- Add a controlText function to MenuButton ([#4125](https://github.com/videojs/video.js/pull/4125)) by [@brandonocasey](https://github.com/brandonocasey)
- *(lang)* French translation update ([#4118](https://github.com/videojs/video.js/pull/4118)) by [@lionel-m](https://github.com/lionel-m)
- Update videojs-vtt.js and wrap native cues in TextTrack ([#4115](https://github.com/videojs/video.js/pull/4115)) by [@gkatsev](https://github.com/gkatsev)
- Don't throw when re-registering a plugin unless it's a player method ([#4140](https://github.com/videojs/video.js/pull/4140)) by [@misteroneill](https://github.com/misteroneill)
- Combine captions and subtitles tracks control ([#4028](https://github.com/videojs/video.js/pull/4028)) by [@mister-ben](https://github.com/mister-ben)
- Make pause on open optional for ModalDialog via options ([#4186](https://github.com/videojs/video.js/pull/4186)) by [@brandonocasey](https://github.com/brandonocasey)
- Time tooltips will not be added to a player on mobile devices ([#4185](https://github.com/videojs/video.js/pull/4185)) by [@alex-barstow](https://github.com/alex-barstow)
- Make text tracks settings more responsive ([#4236](https://github.com/videojs/video.js/pull/4236)) by [@gkatsev](https://github.com/gkatsev)

### 🐛 Bug Fixes
- Make `Player#techCall_()` synchronous again ([#3988](https://github.com/videojs/video.js/pull/3988)) by [@brandonocasey](https://github.com/brandonocasey)
- Patch a memory leak caused by un-removed track listener(s). ([#3976](https://github.com/videojs/video.js/pull/3976)) by [@misteroneill](https://github.com/misteroneill)
- Remaining time display width on IE8 and IE9 ([#3983](https://github.com/videojs/video.js/pull/3983)) by [@brandonocasey](https://github.com/brandonocasey)
- EventTarget is also evented ([#3990](https://github.com/videojs/video.js/pull/3990)) by [@gkatsev](https://github.com/gkatsev)
- Updating time tooltips when player not in DOM ([#3991](https://github.com/videojs/video.js/pull/3991)) by [@gkatsev](https://github.com/gkatsev)
- *(sass)* Import path no longer has cwd ([#4001](https://github.com/videojs/video.js/pull/4001)) by [@gkatsev](https://github.com/gkatsev)
- Allow changing volume in full height of volume control ([#3987](https://github.com/videojs/video.js/pull/3987)) by [@gkatsev](https://github.com/gkatsev)
- Hide font-icons from assitive technology ([#4006](https://github.com/videojs/video.js/pull/4006)) by [@gkatsev](https://github.com/gkatsev)
- Disable title attribute on menu items ([#4019](https://github.com/videojs/video.js/pull/4019)) by [@OwenEdwards](https://github.com/OwenEdwards)
- Accessibility bugs with the VolumeBar ([#4023](https://github.com/videojs/video.js/pull/4023)) by [@brandonocasey](https://github.com/brandonocasey)
- Disable all time tooltips in IE8, as they are broken ([#4029](https://github.com/videojs/video.js/pull/4029)) by [@misteroneill](https://github.com/misteroneill)
- Focus play toggle from Big Play Btn on play ([#4018](https://github.com/videojs/video.js/pull/4018)) by [@gkatsev](https://github.com/gkatsev)
- Progress holder gaps cause tooltips misalignment and time tooltip outlines ([#4031](https://github.com/videojs/video.js/pull/4031)) by [@misteroneill](https://github.com/misteroneill)
- Support empty src in `Player#src` ([#4030](https://github.com/videojs/video.js/pull/4030)) by [@brandonocasey](https://github.com/brandonocasey)
- Fix the structure of elements in menus to comply with ARIA requirements ([#4034](https://github.com/videojs/video.js/pull/4034)) by [@OwenEdwards](https://github.com/OwenEdwards)
- Localize aria-labels ([#4027](https://github.com/videojs/video.js/pull/4027)) by [@gkatsev](https://github.com/gkatsev)
- Add lang attribute to player el, so that css :lang() is correct ([#4046](https://github.com/videojs/video.js/pull/4046)) by [@mister-ben](https://github.com/mister-ben)
- Set MuteButton controlText correctly ([#4056](https://github.com/videojs/video.js/pull/4056)) by [@kevinlitchfield](https://github.com/kevinlitchfield)
- Improve French translation ([#4062](https://github.com/videojs/video.js/pull/4062)) by [@lionel-m](https://github.com/lionel-m)
- Solve a typo in translation files ([#4063](https://github.com/videojs/video.js/pull/4063)) by [@lionel-m](https://github.com/lionel-m)
- *(sass)* Import path has cwd once again ([#4061](https://github.com/videojs/video.js/pull/4061)) by [@wells](https://github.com/wells)
- Make mergeOptions behave the same across browsers ([#4088](https://github.com/videojs/video.js/pull/4088)) by [@forbesjo](https://github.com/forbesjo)
- Synchronously shim vtt.js when possible ([#4083](https://github.com/videojs/video.js/pull/4083)) by [@brandonocasey](https://github.com/brandonocasey)
- Remove redundant Html5#play() by [@mister-ben](https://github.com/mister-ben)
- Copy basic plugin properties onto the wrapper ([#4100](https://github.com/videojs/video.js/pull/4100)) by [@brandonocasey](https://github.com/brandonocasey)
- Do not create element for MediaLoader ([#4097](https://github.com/videojs/video.js/pull/4097)) by [@mister-ben](https://github.com/mister-ben)
- Muting with `MuteToggle` sets ARIA value of `VolumeBar` to 0 ([#4099](https://github.com/videojs/video.js/pull/4099)) by [@kevinlitchfield](https://github.com/kevinlitchfield)
- Trap tab focus in modal when hitting s-tab ([#4075](https://github.com/videojs/video.js/pull/4075)) by [@gkatsev](https://github.com/gkatsev)
- AddChild instance names should be toTitleCased ([#4116](https://github.com/videojs/video.js/pull/4116)) by [@gkatsev](https://github.com/gkatsev)
- Early play should wait for player ready, even if source is available ([#4134](https://github.com/videojs/video.js/pull/4134)) by [@gkatsev](https://github.com/gkatsev)
- *(cues)* Only copy cue props that don't exist ([#4145](https://github.com/videojs/video.js/pull/4145)) by [@gkatsev](https://github.com/gkatsev)
- Cues at startTime 0 do not fire ([#4152](https://github.com/videojs/video.js/pull/4152)) by [@brandonocasey](https://github.com/brandonocasey)
- *(dom)* GetBoundingClientRect check that el is defined ([#4139](https://github.com/videojs/video.js/pull/4139)) by [@brandonocasey](https://github.com/brandonocasey)
- *(package)* Update xhr to version 2.4.0 ([#4101](https://github.com/videojs/video.js/pull/4101)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(playback rate menu)* Playback rate menu items should be selectable ([#4149](https://github.com/videojs/video.js/pull/4149)) by [@gkatsev](https://github.com/gkatsev)
- Add buildWrapperCSSClass methods to all menu buttons ([#4147](https://github.com/videojs/video.js/pull/4147)) by [@gkatsev](https://github.com/gkatsev)
- *(text track settings)* Focus subs-caps button if exists over CC button ([#4155](https://github.com/videojs/video.js/pull/4155)) by [@gkatsev](https://github.com/gkatsev)
- *(subs-caps-button)* Add wrapper CSS builder to subs caps button ([#4156](https://github.com/videojs/video.js/pull/4156)) by [@gkatsev](https://github.com/gkatsev)
- *(audio-tracks-button)* Add wrapper CSS builder to audio tracks menu button ([#4163](https://github.com/videojs/video.js/pull/4163)) by [@OwenEdwards](https://github.com/OwenEdwards)
- *(subs-caps-button)* Captions items should hide icon from SR ([#4158](https://github.com/videojs/video.js/pull/4158)) by [@gkatsev](https://github.com/gkatsev)
- *(MenuButton)* Unify behavior of showing/hiding ([#4157](https://github.com/videojs/video.js/pull/4157)) by [@justinanastos](https://github.com/justinanastos)
- *(subs-caps-button)* Add hide threshold to subs-caps button ([#4171](https://github.com/videojs/video.js/pull/4171)) by [@gkatsev](https://github.com/gkatsev)
- *(tracks)* Allow forcing native text tracks on or off ([#4172](https://github.com/videojs/video.js/pull/4172)) by [@gkatsev](https://github.com/gkatsev)
- *(icon-placeholder)* Align icons on ie8 properly ([#4174](https://github.com/videojs/video.js/pull/4174)) by [@gkatsev](https://github.com/gkatsev)
- *(ie8)* Various minor ie8 fixes ([#4175](https://github.com/videojs/video.js/pull/4175)) by [@gkatsev](https://github.com/gkatsev)
- *(vttjs)* Wait till tech el in DOM before loading vttjs ([#4177](https://github.com/videojs/video.js/pull/4177)) by [@gkatsev](https://github.com/gkatsev)
- Make load progress buffered regions height 100% ([#4190](https://github.com/videojs/video.js/pull/4190)) by [@gkatsev](https://github.com/gkatsev)
- Make sure audio track hides with one item ([#4202](https://github.com/videojs/video.js/pull/4202)) by [@gkatsev](https://github.com/gkatsev)
- Not showing default text tracks over video ([#4216](https://github.com/videojs/video.js/pull/4216)) by [@brandonocasey](https://github.com/brandonocasey)
- RemoveCue should work with native passed in cue ([#4208](https://github.com/videojs/video.js/pull/4208)) by [@brandonocasey](https://github.com/brandonocasey)
- Keep minimum volume after unmuting above 0.1 ([#4227](https://github.com/videojs/video.js/pull/4227)) by [@kevinlitchfield](https://github.com/kevinlitchfield)
- Silence play promise error ([#4247](https://github.com/videojs/video.js/pull/4247)) by [@gkatsev](https://github.com/gkatsev)
- Remove focus ring from player itself ([#4237](https://github.com/videojs/video.js/pull/4237)) by [@gkatsev](https://github.com/gkatsev)

### 🚜 Refactor
- [**breaking**] Remove deprecated features of extend/Component#extend ([#3825](https://github.com/videojs/video.js/pull/3825)) by [@misteroneill](https://github.com/misteroneill)
- Remove unused defaultVolume option default ([#3915](https://github.com/videojs/video.js/pull/3915)) by [@misteroneill](https://github.com/misteroneill)
- Remove custom UMD ([#3826](https://github.com/videojs/video.js/pull/3826)) by [@misteroneill](https://github.com/misteroneill)
- [**breaking**] Buttons will always use a button element ([#3828](https://github.com/videojs/video.js/pull/3828)) by [@misteroneill](https://github.com/misteroneill)
- [**breaking**] Remove TimeRanges without an index deprecation warning ([#3827](https://github.com/videojs/video.js/pull/3827)) by [@misteroneill](https://github.com/misteroneill)
- [**breaking**] Do not allow adding children with options passed in as a boolean ([#3872](https://github.com/videojs/video.js/pull/3872)) by [@brandonocasey](https://github.com/brandonocasey)
- [**breaking**] Remove special loadstart handling ([#3906](https://github.com/videojs/video.js/pull/3906)) by [@brandonocasey](https://github.com/brandonocasey)
- Expose tech but warn without safety var ([#3916](https://github.com/videojs/video.js/pull/3916)) by [@gkatsev](https://github.com/gkatsev)
- [**breaking**] Make registerComponent only work with Components ([#3802](https://github.com/videojs/video.js/pull/3802)) by [@misteroneill](https://github.com/misteroneill)
- [**breaking**] Remove method Chaining from videojs ([#3860](https://github.com/videojs/video.js/pull/3860)) by [@brandonocasey](https://github.com/brandonocasey)
- [**breaking**] Unify all Track and TrackList APIs ([#3783](https://github.com/videojs/video.js/pull/3783)) by [@brandonocasey](https://github.com/brandonocasey)
- Evented Components ([#3959](https://github.com/videojs/video.js/pull/3959)) by [@misteroneill](https://github.com/misteroneill)
- Move most volume panel functionality into css state ([#3981](https://github.com/videojs/video.js/pull/3981)) by [@gkatsev](https://github.com/gkatsev)
- MuteToggle#update ([#4058](https://github.com/videojs/video.js/pull/4058)) by [@kevinlitchfield](https://github.com/kevinlitchfield)

### 📚 Documentation
- Minor fix to currentTime() comment: "setting" not "getting" ([#3944](https://github.com/videojs/video.js/pull/3944)) by [@andrewagain](https://github.com/andrewagain)
- Fix broken links to guides in the faq ([#3973](https://github.com/videojs/video.js/pull/3973)) by [@brandonocasey](https://github.com/brandonocasey)
- Ran `npm run docs:fix` to update TOC on guides ([#3971](https://github.com/videojs/video.js/pull/3971)) by [@brandonocasey](https://github.com/brandonocasey)
- *(jsdoc)* Introduce a jsdoc template and build on publish ([#3910](https://github.com/videojs/video.js/pull/3910)) by [@gkatsev](https://github.com/gkatsev)
- *(guide)* Add a `ModalDialog` guide ([#3961](https://github.com/videojs/video.js/pull/3961)) by [@misteroneill](https://github.com/misteroneill)
- *(guides)* Add a basic ReactJS guide and update the FAQ ([#3972](https://github.com/videojs/video.js/pull/3972))
- Fixup global jsdoc members ([#4015](https://github.com/videojs/video.js/pull/4015)) by [@gkatsev](https://github.com/gkatsev)
- Expand testing info in `CONTRIBUTING.md` ([#4020](https://github.com/videojs/video.js/pull/4020)) by [@kevinlitchfield](https://github.com/kevinlitchfield)
- *(guides)* Fix typos in functions guide ([#4035](https://github.com/videojs/video.js/pull/4035)) by [@mister-ben](https://github.com/mister-ben)
- *(guides)* Fix typos in faq guide ([#4067](https://github.com/videojs/video.js/pull/4067)) by [@prayagverma](https://github.com/prayagverma)
- Replace 'autoPlay' by 'autoplay' ([#4080](https://github.com/videojs/video.js/pull/4080)) by [@Epipong](https://github.com/Epipong)
- Add MediaLoader to components list ([#4070](https://github.com/videojs/video.js/pull/4070)) by [@mister-ben](https://github.com/mister-ben)
- Tech order will only have html5 by default ([#4188](https://github.com/videojs/video.js/pull/4188)) by [@brandonocasey](https://github.com/brandonocasey)
- Fix links in generated docs ([#4200](https://github.com/videojs/video.js/pull/4200)) by [@brandonocasey](https://github.com/brandonocasey)
- *(coc)* Introduce CODE_OF_CONDUCT.md ([#4160](https://github.com/videojs/video.js/pull/4160)) by [@gkatsev](https://github.com/gkatsev)

### 🧪 Testing
- Fix tests ([#3953](https://github.com/videojs/video.js/pull/3953)) by [@gkatsev](https://github.com/gkatsev)
- *(ie8)* Only run mute toggle tests in html5 env ([#4003](https://github.com/videojs/video.js/pull/4003)) by [@gkatsev](https://github.com/gkatsev)
- Add tests for obj.assign util ([#4014](https://github.com/videojs/video.js/pull/4014)) by [@brandonocasey](https://github.com/brandonocasey)
- Fix IE9 rounding issue with lastvolume test ([#4230](https://github.com/videojs/video.js/pull/4230)) by [@kevinlitchfield](https://github.com/kevinlitchfield)

### ⚙️ Miscellaneous Tasks
- [**breaking**] Remove component.json and remove references to it ([#3866](https://github.com/videojs/video.js/pull/3866)) by [@mrocajr](https://github.com/mrocajr)
- *(package)* Update xhr to version 2.3.3 ([#3914](https://github.com/videojs/video.js/pull/3914)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Pin karma to 1.3.0 ([#4002](https://github.com/videojs/video.js/pull/4002)) by [@gkatsev](https://github.com/gkatsev)
- Add flash as a dev dependency for testing ([#4016](https://github.com/videojs/video.js/pull/4016)) by [@brandonocasey](https://github.com/brandonocasey)
- Only report errors during linting in the build process, not warnings ([#4041](https://github.com/videojs/video.js/pull/4041)) by [@OwenEdwards](https://github.com/OwenEdwards)
- Switch from ghooks to husky ([#4074](https://github.com/videojs/video.js/pull/4074)) by [@typicode](https://github.com/typicode)
- *(sandbox)* Use Elephants Dream video files from CDN for the sandbox/descriptions.html.example. ([#4137](https://github.com/videojs/video.js/pull/4137)) by [@OwenEdwards](https://github.com/OwenEdwards)
- Increase browserstack/karma timeouts, dispose player in tests ([#4135](https://github.com/videojs/video.js/pull/4135)) by [@gkatsev](https://github.com/gkatsev)
- Change accessibility test in grunt.js to remove unnecessary warning message. ([#4143](https://github.com/videojs/video.js/pull/4143)) by [@OwenEdwards](https://github.com/OwenEdwards)
- *(package)* Update remark-cli to version 3.0.0 ([#4126](https://github.com/videojs/video.js/pull/4126)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update remark-toc to version 4.0.0 ([#4127](https://github.com/videojs/video.js/pull/4127)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update remark-validate-links to version 6.0.0 ([#4128](https://github.com/videojs/video.js/pull/4128)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update remark-lint to version 6.0.0 ([#4129](https://github.com/videojs/video.js/pull/4129)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(tests)* Make tests not print out errors ([#4141](https://github.com/videojs/video.js/pull/4141)) by [@gkatsev](https://github.com/gkatsev)
- *(sandbox)* Fix poster image to match the video in the 'combined-tracks.html' example in sandbox ([#4164](https://github.com/videojs/video.js/pull/4164)) by [@OwenEdwards](https://github.com/OwenEdwards)
- *(package)* Update uglify-js to version 2.8.8 ([#4170](https://github.com/videojs/video.js/pull/4170)) by [@gkatsev](https://github.com/gkatsev)
- *(test)* Silence plugin warning from test ([#4173](https://github.com/videojs/video.js/pull/4173)) by [@misteroneill](https://github.com/misteroneill)
- *(docs)* Use Elephants Dream video files from CDN for docs/examples/elephantsdream/ ([#4181](https://github.com/videojs/video.js/pull/4181)) by [@OwenEdwards](https://github.com/OwenEdwards)
- *(package)* Update webpack to version 2.3.0 ([#4219](https://github.com/videojs/video.js/pull/4219)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- *(package)* Update videojs-vtt.js to version 0.12.3 ([#4221](https://github.com/videojs/video.js/pull/4221)) by [@greenkeeper[bot]](https://github.com/greenkeeper[bot])
- 6.x build updates ([#4228](https://github.com/videojs/video.js/pull/4228)) by [@gkatsev](https://github.com/gkatsev)
- Remove bower.json ([#4238](https://github.com/videojs/video.js/pull/4238)) by [@gkatsev](https://github.com/gkatsev)
- Ignore qunit and sinon from greenkeeper ([#4242](https://github.com/videojs/video.js/pull/4242)) by [@gkatsev](https://github.com/gkatsev)

### New Contributors
* @kevinlitchfield made their first contribution in [#4230](https://github.com/videojs/video.js/pull/4230)
* @alex-barstow made their first contribution in [#4185](https://github.com/videojs/video.js/pull/4185)
* @justinanastos made their first contribution in [#4157](https://github.com/videojs/video.js/pull/4157)
* @wells made their first contribution in [#4061](https://github.com/videojs/video.js/pull/4061)
* @typicode made their first contribution in [#4074](https://github.com/videojs/video.js/pull/4074)
* @Epipong made their first contribution in [#4080](https://github.com/videojs/video.js/pull/4080)
* @prayagverma made their first contribution in [#4067](https://github.com/videojs/video.js/pull/4067)
* @RevinKey made their first contribution in [#3984](https://github.com/videojs/video.js/pull/3984)
* @altaywtf made their first contribution in [#3989](https://github.com/videojs/video.js/pull/3989)
* @diniscorreia made their first contribution in [#3955](https://github.com/videojs/video.js/pull/3955)
* @ngoisaosang made their first contribution in [#3964](https://github.com/videojs/video.js/pull/3964)
* @mrocajr made their first contribution in [#3866](https://github.com/videojs/video.js/pull/3866)
* @andrewagain made their first contribution in [#3944](https://github.com/videojs/video.js/pull/3944)

## [5.19.1] - 2017-03-27

### 🐛 Bug Fixes
- Not showing default text tracks over video ([#4217](https://github.com/videojs/video.js/issues/4217))
- RemoveCue should work with native passed in cue ([#4209](https://github.com/videojs/video.js/issues/4209))

### ⚙️ Miscellaneous Tasks
- *(package)* Update videojs-vtt.js to 0.12.3 ([#4223](https://github.com/videojs/video.js/issues/4223))

## [5.19.0] - 2017-03-15

### 🚀 Features
- Make pause on open optional for ModalDialog via options ([#4187](https://github.com/videojs/video.js/issues/4187))

### 🐛 Bug Fixes
- Make load progress buffered regions height 100% ([#4191](https://github.com/videojs/video.js/issues/4191))
- Make sure audio track hides with one item ([#4203](https://github.com/videojs/video.js/issues/4203))

## [5.18.4] - 2017-03-08

### 🐛 Bug Fixes
- *(vttjs)* Wait till tech el in DOM before loading vttjs ([#4176](https://github.com/videojs/video.js/issues/4176))

## [5.18.3] - 2017-03-06

## [5.18.1] - 2017-03-03

### 🐛 Bug Fixes
- *(cues)* Only copy cue props that don't exist ([#4146](https://github.com/videojs/video.js/issues/4146))
- Cue-points with a startTime of 0 ([#4148](https://github.com/videojs/video.js/issues/4148))
- Make sure that cues copy over their id ([#4154](https://github.com/videojs/video.js/issues/4154))
- *(MenuButton)* Unify behavior of showing/hiding ([#3993](https://github.com/videojs/video.js/issues/3993))
- *(playback rate menu)* Playback rate menu items should be selectable ([#4150](https://github.com/videojs/video.js/issues/4150))

### ⚙️ Miscellaneous Tasks
- *(build)* Lint errors only and silence webpack ([#4153](https://github.com/videojs/video.js/issues/4153))
- *(package)* Update video-js-swf to 5.3.0 ([#4161](https://github.com/videojs/video.js/issues/4161))

## [5.18.0] - 2017-02-27

### 🚀 Features
- Focus play toggle from Big Play Btn on play ([#4132](https://github.com/videojs/video.js/issues/4132)), closes [#2729](https://github.com/videojs/video.js/issues/2729)
- Update videojs-vtt.js and wrap native cues in TextTrack ([#4131](https://github.com/videojs/video.js/issues/4131)), closes [#4093](https://github.com/videojs/video.js/issues/4093)

### 🐛 Bug Fixes
- *(sass)* Import path has cwd once again ([#4076](https://github.com/videojs/video.js/issues/4076))
- AddChild instance names should be toTitleCased ([#4117](https://github.com/videojs/video.js/issues/4117))
- Make mergeOptions behave the same across browsers  ([#4090](https://github.com/videojs/video.js/issues/4090))
- Synchronously shim vtt.js when possible ([#4082](https://github.com/videojs/video.js/issues/4082))

## [5.17.0] - 2017-02-07

### 🐛 Bug Fixes
- Patch a memory leak caused by un-removed track listener(s). ([#3975](https://github.com/videojs/video.js/issues/3975))
- Remove title attribute on menu items, fixes [#3699](https://github.com/videojs/video.js/issues/3699) ([#4009](https://github.com/videojs/video.js/issues/4009))

### ⚙️ Miscellaneous Tasks
- Change accessibility test in grunt.js to remove unnecessary warning message. ([#4008](https://github.com/videojs/video.js/issues/4008))
- *(package)* Update swf to 5.2.0 ([#4040](https://github.com/videojs/video.js/issues/4040))

### 📚 Documentation
- Minor fix to currentTime() comment: "setting" not "getting" ([#3944](https://github.com/videojs/video.js/issues/3944))

## [5.16.0] - 2017-01-12

### 🚀 Features
- Show big play button on pause if specified ([#3892](https://github.com/videojs/video.js/issues/3892))

### 🐛 Bug Fixes
- Give techs a name ([#3934](https://github.com/videojs/video.js/issues/3934)), closes [#1786](https://github.com/videojs/video.js/issues/1786)
- Pause player before seeking in seek bar mousedown ([#3921](https://github.com/videojs/video.js/issues/3921)), closes [#3839](https://github.com/videojs/video.js/issues/3839) [#3886](https://github.com/videojs/video.js/issues/3886)
- Player el ingest when parent doesn't have `hasAttribute` method ([#3929](https://github.com/videojs/video.js/issues/3929))
- Showing custom poster with controls disabled ([#3933](https://github.com/videojs/video.js/issues/3933)), closes [#1625](https://github.com/videojs/video.js/issues/1625)

### ⚙️ Miscellaneous Tasks
- Better dev experience ([#3896](https://github.com/videojs/video.js/issues/3896))
- Don't run tests on travis if only docs were changed ([#3908](https://github.com/videojs/video.js/issues/3908))
- *(development)* Fix `npm start` file watching ([#3922](https://github.com/videojs/video.js/issues/3922))
- *(release)* Add es5 folder to the tagged commit ([#3913](https://github.com/videojs/video.js/issues/3913))
- *(sass)* Upgrade to latest version of grunt-sass ([#3897](https://github.com/videojs/video.js/issues/3897)), closes [#3692](https://github.com/videojs/video.js/issues/3692)
- Fix typo in collaborator guide ([#3931](https://github.com/videojs/video.js/issues/3931))

### 🚜 Refactor
- Require `videojs-vtt.js` via require rather than concat ([#3919](https://github.com/videojs/video.js/issues/3919))

### 📚 Documentation
- *(faq)* Add a question about autoplay ([#3898](https://github.com/videojs/video.js/issues/3898))
- *(faq)* Add FAQ question about RTMP url ([#3899](https://github.com/videojs/video.js/issues/3899))
- *(troubleshooting)* Updates to troubleshooting doc ([#3912](https://github.com/videojs/video.js/issues/3912))

## [5.15.1] - 2016-12-23

### 🐛 Bug Fixes
- Extra warn logs on already initialized player references ([#3888](https://github.com/videojs/video.js/issues/3888))
- Support require()-ing video.js ([#3889](https://github.com/videojs/video.js/issues/3889)), closes [#3869](https://github.com/videojs/video.js/issues/3869)

## [5.15.0] - 2016-12-22

### 🚀 Features
- *(player)* Ingest a player div for videojs ([#3856](https://github.com/videojs/video.js/issues/3856))
- Deprecate the use of `starttime` in player.js ([#3838](https://github.com/videojs/video.js/issues/3838))

### 🐛 Bug Fixes
- *(html5)* (un)patchCanPlayType could set native canPlayType to null ([#3863](https://github.com/videojs/video.js/issues/3863))
- *(seeking)* Don't always pause in mouse down ([#3886](https://github.com/videojs/video.js/issues/3886)), closes [#3839](https://github.com/videojs/video.js/issues/3839)
- Don't emit tap events on tech when using native controls ([#3873](https://github.com/videojs/video.js/issues/3873))
- Remote text track deprecation warnings ([#3864](https://github.com/videojs/video.js/issues/3864))
- Remove vjs-seeking on src change ([#3846](https://github.com/videojs/video.js/issues/3846)), closes [#3765](https://github.com/videojs/video.js/issues/3765)

### ⚙️ Miscellaneous Tasks
- *(docs)* Documentation Linting and TOC generation ([#3841](https://github.com/videojs/video.js/issues/3841))
- *(faq)* Move FAQ and troubleshooting guide to docs/ ([#3883](https://github.com/videojs/video.js/issues/3883))
- *(package)* Update dependencies (enable Greenkeeper) 🌴 ([#3777](https://github.com/videojs/video.js/issues/3777))
- *(videojs-standard)* Update to version 6.0.1 ([#3884](https://github.com/videojs/video.js/issues/3884))

### 📚 Documentation
- Move examples out of code into docs

### 🧪 Testing
- *(hooks)* Move vjs hooks QUnit module into separate file ([#3862](https://github.com/videojs/video.js/issues/3862))
- *(hooks)* Remove errors logged in tests ([#3865](https://github.com/videojs/video.js/issues/3865))

## [5.14.1] - 2016-12-05

### 🐛 Bug Fixes
- *(throttle)* Fix error in Fn.throttle that broke MouseTimeDisplay ([#3833](https://github.com/videojs/video.js/issues/3833))

### 🧪 Testing
- Add Edge to browserstack tests ([#3834](https://github.com/videojs/video.js/issues/3834))
- *(events)* Silence error logging in tests ([#3835](https://github.com/videojs/video.js/issues/3835))

## [5.14.0] - 2016-12-02

### 🚀 Features
- Allow to use custom Player class ([#3458](https://github.com/videojs/video.js/issues/3458)), closes [#3335](https://github.com/videojs/video.js/issues/3335) [#3016](https://github.com/videojs/video.js/issues/3016)
- Eliminate lodash-compat as a dependency, rewrite mergeOptions ([#3760](https://github.com/videojs/video.js/issues/3760))
- Object Type-Detection and Replacing object.assign ([#3757](https://github.com/videojs/video.js/issues/3757))
- Refactoring chapters button handling and fixing several issues ([#3472](https://github.com/videojs/video.js/issues/3472)), closes [#3447](https://github.com/videojs/video.js/issues/3447) [#3447](https://github.com/videojs/video.js/issues/3447)
- *(texttracks)* Always use emulated text tracks ([#3798](https://github.com/videojs/video.js/issues/3798))
- *(tracks)* Added option to disable native tracks ([#3786](https://github.com/videojs/video.js/issues/3786))

### 🚜 Refactor
- *(html5)* Remove confusing references to player in a tech ([#3790](https://github.com/videojs/video.js/issues/3790))

### 📚 Documentation
- *(FAQ)* Add an faq ([#3805](https://github.com/videojs/video.js/issues/3805))
- *(guides)* Manual Documentation Improvements ([#3703](https://github.com/videojs/video.js/issues/3703))
- *(jsdoc)* Update the jsdoc comments to modern syntax - Part 1 ([#3694](https://github.com/videojs/video.js/issues/3694))
- *(jsdoc)* Update the jsdoc comments to modern syntax - Part 2 ([#3698](https://github.com/videojs/video.js/issues/3698))
- *(jsdoc)* Update the jsdoc comments to modern syntax - Part 3 ([#3708](https://github.com/videojs/video.js/issues/3708))
- *(jsdoc)* Update the jsdoc comments to modern syntax - Part 4  ([#3756](https://github.com/videojs/video.js/issues/3756))
- *(jsdoc)* Update the jsdoc comments to modern syntax - Part 5 ([#3766](https://github.com/videojs/video.js/issues/3766))
- *(jsdoc)* Update the jsdoc comments to modern syntax - Part 6 ([#3771](https://github.com/videojs/video.js/issues/3771))
- Add a troubleshooting guide ([#3814](https://github.com/videojs/video.js/issues/3814))
- Fix typo, extends -> extend ([#3789](https://github.com/videojs/video.js/issues/3789))

### 🧪 Testing
- Fix tests on older IE ([#3800](https://github.com/videojs/video.js/issues/3800))

## [5.13.2] - 2016-11-14

### 🐛 Bug Fixes
- *(html5)* Exit early on emulated tracks in html5 ([#3772](https://github.com/videojs/video.js/issues/3772))
- *(HtmlTrackElementList)* Allow to reference by index via bracket notation ([#3776](https://github.com/videojs/video.js/issues/3776))

### ⚙️ Miscellaneous Tasks
- Fix CHANGELOG 5.13.1 header
- Fixup CHANGELOG for 5.13.1 release
- *(package)* Update karma-detect-browsers to version 2.2.3 ([#3770](https://github.com/videojs/video.js/issues/3770))
- *(pr_template)* Add checkbox to verify changes in a browser ([#3775](https://github.com/videojs/video.js/issues/3775))

## [5.13.1] - 2016-11-09

### 🚀 Features
- *(clickable-component)* Disable interaction with disabled clickable components ([#3525](https://github.com/videojs/video.js/issues/3525))
- *(component)* Attribute get/set/remove methods
- *(fluid)* Use default aspect ratio for fluid players if width unknown ([#3614](https://github.com/videojs/video.js/issues/3614))
- Add a safe computedStyle to videojs. ([#3664](https://github.com/videojs/video.js/issues/3664))
- Add ability to get current source object and all source objects ([#2678](https://github.com/videojs/video.js/issues/2678)), closes [#2443](https://github.com/videojs/video.js/issues/2443)
- Components are now accessible via `camelCase` and `UpperCamelCase` ([#3439](https://github.com/videojs/video.js/issues/3439)), closes [#3436](https://github.com/videojs/video.js/issues/3436)
- *(lang)* Update ru.json ([#3654](https://github.com/videojs/video.js/issues/3654))
- *(lang)* Update uk.json ([#3675](https://github.com/videojs/video.js/issues/3675))
- Implement player lifecycle hooks and trigger beforesetup/setup hooks ([#3639](https://github.com/videojs/video.js/issues/3639))
- Option to have remoteTextTracks automatically 'garbage-collected' when sources change ([#3736](https://github.com/videojs/video.js/issues/3736))

### 🐛 Bug Fixes
- Allow rounded value for fluid player ratio test ([#3739](https://github.com/videojs/video.js/issues/3739))
- Aria-live="assertive" only for descriptions, closes [#3554](https://github.com/videojs/video.js/issues/3554)
- CurrentDimension can return 0 for fluid player on IE ([#3738](https://github.com/videojs/video.js/issues/3738))
- Suppress Infinity duration on Android Chrome before playback ([#3476](https://github.com/videojs/video.js/issues/3476)), closes [#3079](https://github.com/videojs/video.js/issues/3079)

### ⚙️ Miscellaneous Tasks
- *(changelog.md)* Update 5.12.6 and 5.12.3 ([#3715](https://github.com/videojs/video.js/issues/3715))
- Pin karma-detect-browsers to 2.1.0 ([#3764](https://github.com/videojs/video.js/issues/3764))
- *(package)* Update grunt-accessibility to version 5.0.0 ([#3747](https://github.com/videojs/video.js/issues/3747))

### 🚜 Refactor
- *(texttracksettings)* DRYer code and remove massive HTML blob ([#3679](https://github.com/videojs/video.js/issues/3679))
- Remove un-needed constructor and function overrides ([#3721](https://github.com/videojs/video.js/issues/3721))

### 📚 Documentation
- Change registerSourceHandler param doc from first to index ([#3737](https://github.com/videojs/video.js/issues/3737))
- *(collaborator_guide)* Add collaborator guide ([#3724](https://github.com/videojs/video.js/issues/3724))
- *(contributing.md)* Update CONTRIBUTING.md with latest info ([#3722](https://github.com/videojs/video.js/issues/3722))

### ⚡ Performance
- Dispatch Flash events asynchronously ([#3700](https://github.com/videojs/video.js/pull/3700))
- Cache currentTime and buffered from Flash ([#3705](https://github.com/videojs/video.js/issues/3705))
- Use ES6 rest operator and allow V8 to optimize mergeOptions ([#3743](https://github.com/videojs/video.js/issues/3743))

### 🧪 Testing
- *(dom)* Fix removeElClass test in Safari 10. ([#3768](https://github.com/videojs/video.js/issues/3768))
- *(hooks)* Fix hooks unit test in ie8 ([#3745](https://github.com/videojs/video.js/issues/3745))

## [5.13.0] - 2016-08-25

- Ignored release

## [5.12.6] - 2016-10-25

### 🐛 Bug Fixes
- Make sure that document.createElement exists before using ([#3706](https://github.com/videojs/video.js/issues/3706)), closes [#3665](https://github.com/videojs/video.js/issues/3665)
- Remove unnecessary comments from video.min.js ([#3709](https://github.com/videojs/video.js/issues/3709)), closes [#3707](https://github.com/videojs/video.js/issues/3707)

## [5.12.5] - 2016-10-19

### 🐛 Bug Fixes
- Move html5 source handler incantation to bottom ([#3695](https://github.com/videojs/video.js/issues/3695))

## [5.12.4] - 2016-10-18

### 🐛 Bug Fixes
- Logging failing on browsers that don't always have console ([#3686](https://github.com/videojs/video.js/issues/3686))
- Restore timeupdate/loadedmetadata listeners for duration display ([#3682](https://github.com/videojs/video.js/issues/3682))

### ⚙️ Miscellaneous Tasks
- *(grunt)* Fix getting changelog by switching to  npm-run ([#3687](https://github.com/videojs/video.js/issues/3687)), closes [#3683](https://github.com/videojs/video.js/issues/3683)

### 📚 Documentation
- *(options.md)* Remove Bad Apostrophe ([#3677](https://github.com/videojs/video.js/issues/3677))
- *(tech.md)* Add a note on Flash permissions in sandboxed environments ([#3684](https://github.com/videojs/video.js/issues/3684))

## [5.12.3] - 2016-10-06

### 🚀 Features
- *(lang)* Add missing translations in fr.json
- *(lang)* Add missing translations to el.json

### 🐛 Bug Fixes
- *(controls)* Fix load progress bar never highlighting first buffered time range
- *(css)* Remove commented out css, closes [#3587](https://github.com/videojs/video.js/issues/3587)
- Disable HLS hack on Firefox for Android ([#3586](https://github.com/videojs/video.js/issues/3586))
- Proxy ios webkit events into fullscreenchange ([#3644](https://github.com/videojs/video.js/issues/3644))
- *(html5)* Disable manual timeupdate events on html5 tech ([#3656](https://github.com/videojs/video.js/issues/3656))

### ⚙️ Miscellaneous Tasks
- Move metadata to hidden folder and update references
- *(deps)* Add the bundle-collapser browserify plugin
- *(package)* Remove es2015-loose since it's an option for es2015 ([#3629](https://github.com/videojs/video.js/issues/3629))
- *(package)* Update grunt-contrib-cssmin to version 1.0.2 ([#3595](https://github.com/videojs/video.js/issues/3595))
- *(package)* Update grunt-shell to version 2.0.0 ([#3642](https://github.com/videojs/video.js/issues/3642))
- Refactor redundant code in html5 tech ([#3593](https://github.com/videojs/video.js/issues/3593))
- Refactor redundant or verbose code in player.js ([#3597](https://github.com/videojs/video.js/issues/3597))
- Update CHANGELOG automation to use conventional-changelog ([#3669](https://github.com/videojs/video.js/issues/3669))
- Update object.assign to ^4.0.4

### 📚 Documentation
- Fix broken links in docs index.md

### 🧪 Testing
- *(a11y)* Add basic accessibility testing using grunt-accessibility

## [5.12.2] - 2016-09-28

- Changes from 5.11.7 on the 5.12 branch

## [5.12.1] - 2016-08-25

- Changes from 5.11.6 on the 5.12 branch

## [5.12.0] - 2016-08-25

- @misteroneill, @BrandonOCasey, and @pagarwal123 updates all the code to pass the linter ([#3459](https://github.com/videojs/video.js/pull/3459))
- @misteroneill added ghooks to run linter on git push ([#3459](https://github.com/videojs/video.js/pull/3459))
- @BrandonOCasey removed unused base-styles.js file ([#3486](https://github.com/videojs/video.js/pull/3486))
- @erikyuzwa, @gkatsev updated CSS build to include the IE8-specific CSS from a separate file instead of it being inside of sass ([#3380](https://github.com/videojs/video.js/pull/3380)) ([view2](https://github.com/erikyuzwa/video.js/pull/1))
- @gkatsev added null checks around navigator.userAgent ([#3502](https://github.com/videojs/video.js/pull/3502))
- Greenkeeper updated karma dependencies ([#3523](https://github.com/videojs/video.js/pull/3523))
- @BrandonOCasey updated language docs to link to IANA language registry ([#3493](https://github.com/videojs/video.js/pull/3493))
- @gkatsev removed unused dependencies ([#3516](https://github.com/videojs/video.js/pull/3516))
- @misteroneill enabled and updated videojs-standard and fixed an issue with linting ([#3508](https://github.com/videojs/video.js/pull/3508))
- @misteroneill updated tests to qunit 2.0 ([#3509](https://github.com/videojs/video.js/pull/3509))
- @gkatsev added slack badge to README ([#3527](https://github.com/videojs/video.js/pull/3527))
- @gkatsev reverted back to qunitjs 1.x to unbreak IE8. Added es5-shim to tests ([#3533](https://github.com/videojs/video.js/pull/3533))
- @gkatsev updated build system to open es5 folder for bundles and dist folder other users ([#3445](https://github.com/videojs/video.js/pull/3445))
- Greenkeeper updated uglify ([#3547](https://github.com/videojs/video.js/pull/3547))
- Greenkeeper updated grunt-concurrent ([#3532](https://github.com/videojs/video.js/pull/3532))
- Greenkeeper updated karma-chrome-launcher ([#3553](https://github.com/videojs/video.js/pull/3553))
- @gkatsev added tests for webpack and browserify bundling and node.js requiring ([#3558](https://github.com/videojs/video.js/pull/3558))
- @rlchung fixed tests that weren't disposing players when they finished ([#3524](https://github.com/videojs/video.js/pull/3524))

## [5.11.9] - 2016-10-25

- Greenkeeper updated karma dependencies ([#3523](https://github.com/videojs/video.js/pull/3523))
- Update to latest uglify to fix preserve comments issue. Disable screw ie8 option. ([#3709](https://github.com/videojs/video.js/pull/3709))
- Remove sourcemap generation ([#3710](https://github.com/videojs/video.js/pull/3710))

## [5.11.8] - 2016-10-17

- @misteroneill restore timeupdate/loadedmetadata listeners for duration display ([#3682](https://github.com/videojs/video.js/pull/3682))

## [5.11.7] - 2016-09-28

- @gkatsev checked throwIfWhitespace first in hasElClass ([#3640](https://github.com/videojs/video.js/pull/3640))
- @misteroneill pinned grunt-contrib-uglify to ~0.11 to pin uglify to ~2.6 ([#3634](https://github.com/videojs/video.js/pull/3634))
- @gkatsev set playerId on new el created for movingMediaElementInDOM. Fixes #3283 ([#3648](https://github.com/videojs/video.js/pull/3648))

## [5.11.6] - 2016-08-25

- @imbcmdth Added exception handling to event dispatcher ([#3580](https://github.com/videojs/video.js/pull/3580))

## [5.11.5] - 2016-08-25

- @misteroneill fixed wrapping native and emulated MediaErrors ([#3562](https://github.com/videojs/video.js/pull/3562))
- @snyderizer fixed switching between audio tracks. Fixes #3510 ([#3538](https://github.com/videojs/video.js/pull/3538))
- @jbarabander added title attribute to audio button. Fixes #3528 ([#3565](https://github.com/videojs/video.js/pull/3565))
- @misteroneill fixed IE8 media error test failure ([#3568](https://github.com/videojs/video.js/pull/3568))

## [5.11.4] - 2016-08-16

_(none)_

## [5.11.3] - 2016-08-15

- @vdeshpande fixed control text for fullscreen button ([#3485](https://github.com/videojs/video.js/pull/3485))
- @mister-ben fixed android treating swipe as a tap ([#3514](https://github.com/videojs/video.js/pull/3514))
- @mboles updated duration() method documentation ([#3515](https://github.com/videojs/video.js/pull/3515))
- @mister-ben silenced chrome's play() request was interrupted by pause() error ([#3518](https://github.com/videojs/video.js/pull/3518))

## [5.11.2] - 2016-08-09

_(none)_

## [5.11.1] - 2016-08-08

- @vxsx fixed legend selector to be more specific. Fixes #3492 ([#3494](https://github.com/videojs/video.js/pull/3494))

## [5.11.0] - 2016-07-22

- @BrandonOCasey Document audio/video track usage ([#3295](https://github.com/videojs/video.js/pull/3295))
- @hartman Correct documentation to refer to nativeTextTracks option ([#3309](https://github.com/videojs/video.js/pull/3309))
- @nickygerritsen Also pass tech options to canHandleSource ([#3303](https://github.com/videojs/video.js/pull/3303))
- @misteroneill Un-deprecate the videojs.players property ([#3299](https://github.com/videojs/video.js/pull/3299))
- @nickygerritsen Add title to all clickable components ([#3296](https://github.com/videojs/video.js/pull/3296))
- @nickygerritsen Update Dutch language file ([#3297](https://github.com/videojs/video.js/pull/3297))
- @hartman Add descriptions and audio button to adaptive classes ([#3312](https://github.com/videojs/video.js/pull/3312))
- @MattiasBuelens Retain details from tech error ([#3313](https://github.com/videojs/video.js/pull/3313))
- @nickygerritsen Fix test for tooltips in IE8 ([#3327](https://github.com/videojs/video.js/pull/3327))
- @mboles added loadstart event to jsdoc ([#3370](https://github.com/videojs/video.js/pull/3370))
- @hartman added default print styling ([#3304](https://github.com/videojs/video.js/pull/3304))
- @ldayananda updated videojs to not do anything if no src is set ([#3378](https://github.com/videojs/video.js/pull/3378))
- @nickygerritsen removed unused tracks when changing sources. Fixes #3000 ([#3002](https://github.com/videojs/video.js/pull/3002))
- @vit-koumar updated Flash tech to return Infinity from duration instead of -1 ([#3128](https://github.com/videojs/video.js/pull/3128))
- @alex-phillips added ontextdata to Flash tech ([#2748](https://github.com/videojs/video.js/pull/2748))
- @MattiasBuelens updated components to use durationchange only ([#3349](https://github.com/videojs/video.js/pull/3349))
- @misteroneill improved Logging for IE < 11 ([#3356](https://github.com/videojs/video.js/pull/3356))
- @vdeshpande updated control text of modal dialog ([#3400](https://github.com/videojs/video.js/pull/3400))
- @ldayananda fixed mouse handling on menus by using mouseleave over mouseout ([#3404](https://github.com/videojs/video.js/pull/3404))
- @mister-ben updated language to inherit correctly and respect the attribute on the player ([#3426](https://github.com/videojs/video.js/pull/3426))
- @sashyro fixed nativeControlsForTouch option ([#3410](https://github.com/videojs/video.js/pull/3410))
- @tbasse fixed techCall null check against tech ([#2676](https://github.com/videojs/video.js/pull/2676))
- @rbran100 checked src and currentSrc in handleTechReady to work around mixed content issues in chrome ([#3287](https://github.com/videojs/video.js/pull/3287))
- @OwenEdwards fixed caption settings dialog labels for accessibility ([#3281](https://github.com/videojs/video.js/pull/3281))
- @OwenEdwards removed spurious head tags in the simple-embed example ([#3438](https://github.com/videojs/video.js/pull/3438))
- @ntadej added a null check to errorDisplay usage ([#3440](https://github.com/videojs/video.js/pull/3440))
- @misteroneill fixed logging issues on IE by separating fn.apply and stringify checks ([#3444](https://github.com/videojs/video.js/pull/3444))
- @misteroneill fixed npm test from running coveralls locally ([#3449](https://github.com/videojs/video.js/pull/3449))
- @gkatsev added es6-shim to tests. Fixes Flash duration test ([#3453](https://github.com/videojs/video.js/pull/3453))
- @misteroneill corrects test assertions for older IEs in the log module ([#3454](https://github.com/videojs/video.js/pull/3454))
- @gkatsev fixed setting lang by looping through loop element variable and not constant tag ([#3455](https://github.com/videojs/video.js/pull/3455))

## [5.10.8] - 2016-08-08

- @gkatsev re-published to make sure that the audio button has css

## [5.10.7] - 2016-06-27

- @gkatsev pinned node-sass to 3.4 ([#3401](https://github.com/videojs/video.js/pull/3401))
- @mister-ben added try catch to volume and playbackrate checks. Fixes #3315 ([#3320](https://github.com/videojs/video.js/pull/3320))
- @m14t removed unused loadEvent property in ControlBar options ([#3363](https://github.com/videojs/video.js/pull/3363))
- @bklava updated pt-BR language file ([#3373](https://github.com/videojs/video.js/pull/3373))
- @mister-ben updated menus to use default videojs font-family ([#3384](https://github.com/videojs/video.js/pull/3384))
- @vdeshpande fixed chapters getting duplicated each time a track is loaded ([#3354](https://github.com/videojs/video.js/pull/3354))

## [5.10.6] - 2016-06-20

- @gkatsev fix not fully minified video.min.js file.

## [5.10.5] - 2016-06-07

- @gkatsev pinned dependencies to direct versions ([#3338](https://github.com/videojs/video.js/pull/3338))
- @gkatsev fixed minified vjs in ie8 when initialized with id string ([#3357](https://github.com/videojs/video.js/pull/3357))
- @IJsLauw fixed unhandled exception in deleting poster on ios7 ([#3337](https://github.com/videojs/video.js/pull/3337))

## [5.10.4] - 2016-05-31

- Patch release to fix dist on npm

## [5.10.3] - 2016-05-27

- @BrandonOCasey fixed source handlers being disposed multiple times when a video is put into the video element directly ([#3343](https://github.com/videojs/video.js/pull/3343))

## [5.10.2] - 2016-05-12

- @gkatsev nulled out currentSource_ in setSource ([#3314](https://github.com/videojs/video.js/pull/3314))

## [5.10.1] - 2016-05-03

- @nickygerritsen Pass tech options to source handlers ([#3245](https://github.com/videojs/video.js/pull/3245))
- @gkatsev Use fonts 2.0 that do not require wrapping codepoints ([#3252](https://github.com/videojs/video.js/pull/3252))
- @chrisauclair Make controls visible for accessibility reasons ([#3237](https://github.com/videojs/video.js/pull/3237))
- @gkatsev updated text track documentation and crossorigin warning. Fixes #1888, #1958, #2628, #3202 ([#3256](https://github.com/videojs/video.js/pull/3256))
- @BrandonOCasey added audio and video track support ([#3173](https://github.com/videojs/video.js/pull/3173))
- @OwenEdwards added language attribute in HTML files for accessibility ([#3257](https://github.com/videojs/video.js/pull/3257))
- @incompl clear currentSource_ after subsequent loadstarts ([#3285](https://github.com/videojs/video.js/pull/3285))
- @forbesjo add an audio track selector menu button ([#3223](https://github.com/videojs/video.js/pull/3223))

## [5.9.2] - 2016-04-19

- @gkatsev grouped text track errors in the console, if we can ([#3259](https://github.com/videojs/video.js/pull/3259))

## [5.9.1] - 2016-04-19

- @benjipott updated IS_CHROME to not be true on MS Edge ([#3232](https://github.com/videojs/video.js/pull/3232))
- @mister-ben blacklisted Chrome for Android for playback rate support ([#3246](https://github.com/videojs/video.js/pull/3246))
- @gkatsev made the first emulated text track enabled by default ([#3248](https://github.com/videojs/video.js/pull/3248))
- @gkatsev fixed removeRemoteTextTracks not working with return value from addRemoteTextTracks ([#3253](https://github.com/videojs/video.js/pull/3253))
- @forbesjo added back the background color to the poster ([#3267](https://github.com/videojs/video.js/pull/3267))
- @gkatsev fixed text track tests for older IEs ([#3269](https://github.com/videojs/video.js/pull/3269))

## [5.9.0] - 2016-04-05

- @gkatsev updated vjs to not add dynamic styles when VIDEOJS_NO_DYNAMIC_STYLE is set ([#3093](https://github.com/videojs/video.js/pull/3093))
- @OwenEdwards added basic descriptions track support ([#3098](https://github.com/videojs/video.js/pull/3098))
- @kamilbrenk Added lang
- @arius28 added greek translation file (el.json) ([#3185](https://github.com/videojs/video.js/pull/3185))
- @ricardosiri68 changed the relative sass paths ([#3147](https://github.com/videojs/video.js/pull/3147))
- @gkatsev added an option to keep the tooltips inside the player bounds ([#3149](https://github.com/videojs/video.js/pull/3149))
- @defli added currentWidth and currentHeight methods to the player ([#3144](https://github.com/videojs/video.js/pull/3144))
- Fix IE8 tests for VIDEOJS_NO_DYNAMIC_STYLE ([#3215](https://github.com/videojs/video.js/pull/3215))
- @OwenEdwards fixed links adding extra tab stop with IE by removing anchor tags on videojs init ([#3194](https://github.com/videojs/video.js/pull/3194))
- @scaryguy updated videojs cdn urls in the README ([#3195](https://github.com/videojs/video.js/pull/3195))
- @mister-ben updated the time tooltips to use the chosen font family ([#3213](https://github.com/videojs/video.js/pull/3213))
- @OwenEdwards improved handling of deprecated use of Button component ([#3236](https://github.com/videojs/video.js/pull/3236))
- @forbesjo added chrome for PR tests ([#3235](https://github.com/videojs/video.js/pull/3235))
- @MCGallaspy added vttjs to the self-hosting guide ([#3229](https://github.com/videojs/video.js/pull/3229))
- @chrisauclair added ARIA region and label to player element ([#3227](https://github.com/videojs/video.js/pull/3227))
- @andyearnshaw updated document event handlers to use el.ownerDocument ([#3230](https://github.com/videojs/video.js/pull/3230))

## [5.8.8] - 2016-04-04

- @vtytar fixed auto-setup failing if taking too long to load ([view](http://github.com/videojs/video.js/pull/3233))
- @seescode fixed css failing on IE8 due to incorrect ie8 hack ([view](http://github.com/videojs/video.js/pull/3226))
- @seescode fixed dragging on mute toggle changing the volume ([view](http://github.com/videojs/video.js/pull/3228))

## [5.8.7] - 2016-03-29

- @llun fixed menus from throwing when focused when empty ([#3218](https://github.com/videojs/video.js/pull/3218))
- @mister-ben added dir=ltr to control bar and loading spinner ([#3221](https://github.com/videojs/video.js/pull/3221))
- @avreg fixed notSupportedMessage saying video when meaning media ([#3222](https://github.com/videojs/video.js/pull/3222))
- @mister-ben fixed missing native HTML5 tracks ([#3212](https://github.com/videojs/video.js/pull/3212))
- @mister-ben updated Arabic language files ([#3225](https://github.com/videojs/video.js/pull/3225))

## [5.8.6] - 2016-03-25

- @misteroneill fixed typo and indenting in language files ([#3207](https://github.com/videojs/video.js/pull/3207))

## [5.8.5] - 2016-03-17

- @gkatsev cleared vttjs script handlers on dispose. Fixed tests ([#3189](https://github.com/videojs/video.js/pull/3189))

## [5.8.4] - 2016-03-17

- @gkatsev changed emulated tracks to in novtt to wait for vttjs to load or error before parsing ([#3181](https://github.com/videojs/video.js/pull/3181))

## [5.8.3] - 2016-03-10

- @gkatsev fixed keyboard control of menus with titles. Fixes #3164 ([#3165](https://github.com/videojs/video.js/pull/3165))

## [5.8.2] - 2016-03-09

- @gkatsev fixed chapters menu. Fixes #3062 ([#3163](https://github.com/videojs/video.js/pull/3163))

## [5.8.1] - 2016-03-07

- @gkatsev updated videojs badges in the README ([#3134](https://github.com/videojs/video.js/pull/3134))
- @BrandonOCasey converted remaining text-track modules to ES6 ([#3130](https://github.com/videojs/video.js/pull/3130))
- @gkatsev cleared waiting/spinner on timeupdate. Fixes #3124 ([#3138](https://github.com/videojs/video.js/pull/3138))
- @BrandonOCasey updated text track unit tests to use full es6 syntax ([#3148](https://github.com/videojs/video.js/pull/3148))
- @defli added missing var to sandbox index.html example ([#3155](https://github.com/videojs/video.js/pull/3155))
- @defli fixed typo and updated Turkish translations ([#3156](https://github.com/videojs/video.js/pull/3156))
- @OwenEdwards fixed menu closing on ios, specifically ipad ([#3158](https://github.com/videojs/video.js/pull/3158))

## [5.8.0] - 2016-02-19

- @gkatsev added issue and PR templates for github ([#3117](https://github.com/videojs/video.js/pull/3117))
- @Nipoto added fa.json (farsi/persian lang file) ([#3116](https://github.com/videojs/video.js/pull/3116))
- @forbesjo updated travis to use latest firefox ([#3112](https://github.com/videojs/video.js/pull/3112))
- @Naouak updated time display to not change if values do not change ([#3101](https://github.com/videojs/video.js/pull/3101))
- @forbesjo updated track settings to not fail restoring settings when localStorage is not available ([#3120](https://github.com/videojs/video.js/pull/3120))
- @mister-ben Added en.json as localization template ([#3096](https://github.com/videojs/video.js/pull/3096))
- @misteroneill added alt css as video-js-cdn.css ([#3118](https://github.com/videojs/video.js/pull/3118))

## [5.7.1] - 2016-02-11

- @alex-phillips fixed reference to videojs-vtt.js dependency ([#3080](https://github.com/videojs/video.js/pull/3080))
- @gkatsev fixed minified videojs in IE8. Fixes #3064 and #3070 ([#3104](https://github.com/videojs/video.js/pull/3104))

## [5.7.0] - 2016-02-04

- @forbesjo updated emulated tracks to have listeners removed when they are removed ([#3046](https://github.com/videojs/video.js/pull/3046))
- @incompl improved the UX of time tooltips ([#3060](https://github.com/videojs/video.js/pull/3060))
- @gkatsev updated README to include links to plugins page and getting started and cleaner link to LICENSE ([#3066](https://github.com/videojs/video.js/pull/3066))
- @hartman Corrected adaptive layout selectors to match their intent ([#2923](https://github.com/videojs/video.js/pull/2923))
- @mister-ben updated Umuted to Unmute in lang files ([#3053](https://github.com/videojs/video.js/pull/3053))
- @hartman updated fullscreen and time controls for more consistent widths ([#2893](https://github.com/videojs/video.js/pull/2893))
- @hartman Set a min-width for the progress slider of 4em ([#2902](https://github.com/videojs/video.js/pull/2902))
- @misteroneill fixed iphone useragent detection ([#3077](https://github.com/videojs/video.js/pull/3077))
- @erikyuzwa added ability to add child component at specific index ([#2540](https://github.com/videojs/video.js/pull/2540))

## [5.6.0] - 2016-01-26

- @OwenEdwards added ClickableComponent. Fixed keyboard operation of buttons ([#3032](https://github.com/videojs/video.js/pull/3032))
- @OwenEdwards Fixed menu keyboard access and ARIA labeling for screen readers ([#3033](https://github.com/videojs/video.js/pull/3033))
- @OwenEdwards Fixed volume menu keyboard access ([#3034](https://github.com/videojs/video.js/pull/3034))
- @mister-ben made $primary-foreground-color a !default sass var ([#3003](https://github.com/videojs/video.js/pull/3003))
- @OwenEdwards fixed double-localization of mute toggle control text ([#3017](https://github.com/videojs/video.js/pull/3017))
- @gkatsev checked muted status when updating volume bar level ([#3037](https://github.com/videojs/video.js/pull/3037))
- @vitor-faiante updated the guides ([#2781](https://github.com/videojs/video.js/pull/2781))
- @aril-spetalen added language support for Norwegian (nb and nn) ([#3021](https://github.com/videojs/video.js/pull/3021))
- @CoWinkKeyDinkInc fixed table in Tracks guide. Replaced some single quotes with double quotes ([#2946](https://github.com/videojs/video.js/pull/2946))
- @hubdotcom changed URLs in README to be protocol-relative ([#3040](https://github.com/videojs/video.js/pull/3040))
- @gkatsev updated to latest videojs-ie8 shim ([#3042](https://github.com/videojs/video.js/pull/3042))

## [5.5.3] - 2016-01-15

- @gkasev updated vjs to correctly return already created player when given an element ([#3006](https://github.com/videojs/video.js/pull/3006))
- @mister-ben updated CDN urls in setup guide ([#2984](https://github.com/videojs/video.js/pull/2984))
- @rcrooks fixed a couple of docs link and a jsdoc comment ([#2987](https://github.com/videojs/video.js/pull/2987))

## [5.5.2] - 2016-01-14

- Make sure that styleEl_ is in DOM before removing on dispose ([#3004](https://github.com/videojs/video.js/pull/3004))

## [5.5.1] - 2016-01-08

- @gkatsev fixed sass if else for icons ([#2988](https://github.com/videojs/video.js/pull/2988))

## [5.5.0] - 2016-01-07

- @hartman fixed usage of lighten in progress component. Fixes #2793 ([#2875](https://github.com/videojs/video.js/pull/2875))
- @misteroneill exposed createEl on videojs ([#2926](https://github.com/videojs/video.js/pull/2926))
- @huitsing updated docstrings for autoplay and loop methods ([#2960](https://github.com/videojs/video.js/pull/2960))
- @rcrooks fixed some broken links in guides ([#2965](https://github.com/videojs/video.js/pull/2965))
- @forbesjo fixed errorDisplay erroring on subsequent openings ([#2966](https://github.com/videojs/video.js/pull/2966))
- @incompl updated build command in CONTRIBUTING.md ([#2967](https://github.com/videojs/video.js/pull/2967))
- @forbesjo updated player to not autoplay if there is no source ([#2971](https://github.com/videojs/video.js/pull/2971))
- @gkatsev updated css to have ascii codepoints for fonticons. Expose new scss file ([#2973](https://github.com/videojs/video.js/pull/2973))

## [5.4.6] - 2015-12-22

- @gkatsev fixed vertical slider alignment in volume menu button ([#2943](https://github.com/videojs/video.js/pull/2943))

## [5.4.5] - 2015-12-15

- @gkatsev added mouse/touch listeners to volume menu button ([#2638](https://github.com/videojs/video.js/pull/2638))
- @gkatsev updated styles for inline menu and volume bar ([#2913](https://github.com/videojs/video.js/pull/2913))
- @BrandonOCasey updated sandbox to to use newer CDN urls ([#2917](https://github.com/videojs/video.js/pull/2917))
- @hartman updated options guide doc ([#2908](https://github.com/videojs/video.js/pull/2908))
- @rcrooks fixed simple embed example ([#2915](https://github.com/videojs/video.js/pull/2915))

## [5.4.4] - 2015-12-09

- @gkatsev switched to use custom vtt.js from npm ([#2905](https://github.com/videojs/video.js/pull/2905))

## [5.4.3] - 2015-12-08

- @gkatsev updated options customizer and github-release options ([#2903](https://github.com/videojs/video.js/pull/2903))

## [5.4.2] - 2015-12-08

- @gkatsev updated grunt-release config ([#2900](https://github.com/videojs/video.js/pull/2900))

## [5.4.1] - 2015-12-08

- @misteroneill updated videojs-ie8 to 1.1.1 ([#2869](https://github.com/videojs/video.js/pull/2869))
- @gkatsev added Player#tech. Fixes #2617 ([#2883](https://github.com/videojs/video.js/pull/2883))
- @nick11703 changed multiline comments in sass with single-line comments ([#2827](https://github.com/videojs/video.js/pull/2827))
- @gkatsev added a Player#reset method. Fixes #2852 ([#2880](https://github.com/videojs/video.js/pull/2880))
- @chemoish emulated HTMLTrackElement to enable track load events ([#2804](https://github.com/videojs/video.js/pull/2804))
- @gkatsev added nullcheck for cues in updateForTrack. Fixes #2870 ([#2896](https://github.com/videojs/video.js/pull/2896))
- @gkatsev added ability to release next tag from master ([#2894](https://github.com/videojs/video.js/pull/2894))
- @gkatsev added chg- and github- release for next releases ([#2899](https://github.com/videojs/video.js/pull/2899))

## [5.3.0] - 2015-11-25

- @forbesjo updated formatTime to not go negative ([#2821](https://github.com/videojs/video.js/pull/2821))
- @imbcmdth added sourceOrder option for source-first ordering in selectSource ([#2847](https://github.com/videojs/video.js/pull/2847))

## [5.2.4] - 2015-11-25

- @gesinger checked for track changes before tech started listening ([#2835](https://github.com/videojs/video.js/pull/2835))
- @gesinger fixed handler explosion for cuechange events ([#2849](https://github.com/videojs/video.js/pull/2849))
- @mmcc fixed vertical volume ([#2859](https://github.com/videojs/video.js/pull/2859))

## [5.2.3] - 2015-11-24

- @gkatsev fixed clearing out errors ([#2850](https://github.com/videojs/video.js/pull/2850))

## [5.2.2] - 2015-11-23

- @DatTran fixed bower paths. Fixes #2740 ([#2775](https://github.com/videojs/video.js/pull/2775))
- @nbibler ensured classes begin with alpha characters. Fixes #2828 ([#2829](https://github.com/videojs/video.js/pull/2829))
- @bcvio fixed returning current source rather than blob url ([#2833](https://github.com/videojs/video.js/pull/2833))
- @tomaspinho added ended event to API docs ([#2836](https://github.com/videojs/video.js/pull/2836))
- @paladox updated xhr from deprecated ver to v2.2 ([#2837](https://github.com/videojs/video.js/pull/2837))

## [5.2.1] - 2015-11-16

- @dmlap Check a component is a function before new-ing ([#2814](https://github.com/videojs/video.js/pull/2814))
- @ksjun corrected the registerTech export ([#2816](https://github.com/videojs/video.js/pull/2816))

## [5.2.0] - 2015-11-10

- @gkatsev made initListeners more general and added Tech.isTech. Fixes #2767 ([#2773](https://github.com/videojs/video.js/pull/2773))
- @dmlap updated swf to 5.0.1 ([#2795](https://github.com/videojs/video.js/pull/2795))
- @gkatsev added a tech registry. Fixes #2772 ([#2782](https://github.com/videojs/video.js/pull/2782))
- @Lillemanden improved logic for dividing RTMP paths ([#2787](https://github.com/videojs/video.js/pull/2787))
- @bdeitte added a test for improved RTMP path dividing logic ([#2794](https://github.com/videojs/video.js/pull/2794))
- @paladox updated grunt-cli dependency ([#2555](https://github.com/videojs/video.js/pull/2555))
- @paladox updated grunt-contrib-jshint ([#2554](https://github.com/videojs/video.js/pull/2554))
- @siebrand updated dutch translations ([#2556](https://github.com/videojs/video.js/pull/2556))
- @misteroneill exposed DOM helpers ([#2754](https://github.com/videojs/video.js/pull/2754))
- @incompl fixed broken link to reduced test cases article ([#2801](https://github.com/videojs/video.js/pull/2801))
- @zjruan updated text track prototype loops to blacklist constructor for IE8 ([#2565](https://github.com/videojs/video.js/pull/2565))
- @gkatsev fixed usage of textTracksToJson ([#2797](https://github.com/videojs/video.js/pull/2797))
- @gkatsev updated contrib.json to use / as branch-name separator in feature-accept ([#2803](https://github.com/videojs/video.js/pull/2803))
- @gkatsev updated MediaLoader to check for techs in their registry ([#2798](https://github.com/videojs/video.js/pull/2798))

## [5.1.0] - 2015-11-02

- @typcn bumped grunt-sass to ^1.0.0 to support node 4.x ([#2645](https://github.com/videojs/video.js/pull/2645))
- @gkatsev removed unhelpful isCrossOrigin test ([#2715](https://github.com/videojs/video.js/pull/2715))
- @forbesjo updated karma to use all installed browsers for unit tests ([#2708](https://github.com/videojs/video.js/pull/2708))
- @forbesjo removed android/ios tests to increase build stability ([#2739](https://github.com/videojs/video.js/pull/2739))
- @nickygerritsen added canPlayType method to player ([#2709](https://github.com/videojs/video.js/pull/2709))
- @gkatsev fixes track tests and ignored empty properties in tracks converter ([#2744](https://github.com/videojs/video.js/pull/2744))
- @misteroneill added a modal dialog ([#2668](https://github.com/videojs/video.js/pull/2668))
- @misteroneill removed z-index from big play button ([#2639](https://github.com/videojs/video.js/pull/2639))
- @DaveVoyles updated URL to player API docs ([#2685](https://github.com/videojs/video.js/pull/2685))
- @ ([#2691](https://github.com/videojs/video.js/pull/2691))
- @kahwee Fixed sandbox plugin example to work in Video.js 5 ([#2691](https://github.com/videojs/video.js/pull/2691))
- @Soviut Fixed argument names in some API docs ([#2714](https://github.com/videojs/video.js/pull/2714))
- @forbesjo Added Microsoft Caption Maker link ([#2618](https://github.com/videojs/video.js/pull/2618))
- @misteroneill updated modal dialog CSS ([#2756](https://github.com/videojs/video.js/pull/2756))
- @misteroneill Add browserify
- @brkattk updated emulateTextTrack to exit early if no textTracks ([#2426](https://github.com/videojs/video.js/pull/2426))
- @chemoish Fix captions sticking to bottom for webkit browsers. Fixes #2193 ([#2702](https://github.com/videojs/video.js/pull/2702))
- @imbcmdth Deferred the implementation of select functions in the tech to source handlers if they provide them ([#2760](https://github.com/videojs/video.js/pull/2760))

## [5.0.2] - 2015-10-23

- @imbcmdth fixed an issue with emulateTextTracks being called before the tech dom was ready ([#2692](https://github.com/videojs/video.js/pull/2692))
- @gkatsev bumped obj.assign to fix uncaught SecurityError in iframes. Fixes #2703 ([#2721](https://github.com/videojs/video.js/pull/2721))
- @gkatsev updated contrib update and have contrib release only update local branches ([#2723](https://github.com/videojs/video.js/pull/2723))
- @gkatsev bumped chg to fix stalling issues ([#2732](https://github.com/videojs/video.js/pull/2732))

## [5.0.0] - 2015-09-29

- @carpasse infer MIME types from file extensions in the HTML5 and Flash techs ([#1974](https://github.com/videojs/video.js/pull/1974))
- @mmcc updated the slider to allow for vertical orientation ([#1816](https://github.com/videojs/video.js/pull/1816))
- @dmlap removed an ie6 hack for flash object embedding ([#1946](https://github.com/videojs/video.js/pull/1946))
- @heff replaced Closure Compiler with Uglify for minification ([#1940](https://github.com/videojs/video.js/pull/1940))
- @OleLaursen added a Danish translation ([#1899](https://github.com/videojs/video.js/pull/1899))
- @dn5 Added new translations (Bosnian, Serbian, Croatian) ([#1897](https://github.com/videojs/video.js/pull/1897))
- @mmcc (and others) converted the whole project to use ES6, Babel and Browserify ([#1976](https://github.com/videojs/video.js/pull/1976))
- @heff converted all classes to use ES6 classes ([#1993](https://github.com/videojs/video.js/pull/1993))
- @mmcc added ES6 default args and template strings ([#2015](https://github.com/videojs/video.js/pull/2015))
- @dconnolly replaced JSON.parse with a safe non-eval JSON parse ([#2077](https://github.com/videojs/video.js/pull/2077))
- @mmcc added a new default skin, switched to SASS, modified the html ([#1999](https://github.com/videojs/video.js/pull/1999))
- @gkatsev removed event.isDefaultPrevented in favor of event.defaultPrevented ([#2081](https://github.com/videojs/video.js/pull/2081))
- @heff added and `extends` function for external subclassing ([#2078](https://github.com/videojs/video.js/pull/2078))
- @forbesjo added the `scrubbing` property ([#2080](https://github.com/videojs/video.js/pull/2080))
- @heff switched to border-box sizing for all player elements ([#2082](https://github.com/videojs/video.js/pull/2082))
- @forbesjo added a vjs-button class to button controls ([#2084](https://github.com/videojs/video.js/pull/2084))
- @bc-bbay Load plugins before controls ([#2094](https://github.com/videojs/video.js/pull/2094))
- @bc-bbay rename onEvent methods to handleEvent ([#2093](https://github.com/videojs/video.js/pull/2093))
- @dmlap added an error message if techOrder is not in options ([#2097](https://github.com/videojs/video.js/pull/2097))
- @dconnolly exported the missing videojs.plugin function ([#2103](https://github.com/videojs/video.js/pull/2103))
- @mmcc added back the captions settings styles ([#2112](https://github.com/videojs/video.js/pull/2112))
- @gkatsev updated the component.js styles to match the new style guide ([#2105](https://github.com/videojs/video.js/pull/2105))
- @gkatsev added error logging for bad JSON formatting ([#2113](https://github.com/videojs/video.js/pull/2113))
- @gkatsev added a sensible toJSON function ([#2114](https://github.com/videojs/video.js/pull/2114))
- @bc-bbay fixed instance where progress bars would go passed 100% ([#2040](https://github.com/videojs/video.js/pull/2040))
- @eXon began Tech 2.0 work, improved how tech events are handled by the player ([#2057](https://github.com/videojs/video.js/pull/2057))
- @gkatsev added get and set global options methods ([#2115](https://github.com/videojs/video.js/pull/2115))
- @heff added support for fluid widths, aspect ratios, and metadata defaults ([#1952](https://github.com/videojs/video.js/pull/1952))
- @heff reorganized all utility functions in the codebase ([#2139](https://github.com/videojs/video.js/pull/2139))
- @eXon made additional tech 2.0 improvements listed in #2126 ([#2166](https://github.com/videojs/video.js/pull/2166))
- @heff Cleaned up and documented src/js/video.js and DOM functions ([#2182](https://github.com/videojs/video.js/pull/2182))
- @mmcc Changed to pure CSS slider handles ([#2132](https://github.com/videojs/video.js/pull/2132))
- @mister-ben updated language support to handle language codes with regions ([#2177](https://github.com/videojs/video.js/pull/2177))
- @heff changed the 'ready' event to always be asynchronous  ([#2188](https://github.com/videojs/video.js/pull/2188))
- @heff fixed instances of tabIndex that did not have a capital I   ([#2204](https://github.com/videojs/video.js/pull/2204))
- @heff fixed a number of IE8 and Flash related issues  ([#2206](https://github.com/videojs/video.js/pull/2206))
- @heff Reverted .video-js inline-block style to fix Flash fullscreen  ([#2217](https://github.com/videojs/video.js/pull/2217))
- @mmcc switched to using button elements for button components ([#2209](https://github.com/videojs/video.js/pull/2209))
- @mmcc increased the size of the progress bar and handle on hover ([#2216](https://github.com/videojs/video.js/pull/2216))
- @mmcc moved the fonts into their own repo ([#2223](https://github.com/videojs/video.js/pull/2223))
- @mmcc deprecated the options() function and removed internal uses ([#2229](https://github.com/videojs/video.js/pull/2229))
- @carpasse enhanced events to allow passing a second data argument ([#2163](https://github.com/videojs/video.js/pull/2163))
- @bc-bbay made the duration display update itself on loadedmetadata ([#2169](https://github.com/videojs/video.js/pull/2169))
- @arwidt added Swedish and Finnish translations ([#2189](https://github.com/videojs/video.js/pull/2189))
- @heff moved all the CDN logic into videojs/cdn ([#2230](https://github.com/videojs/video.js/pull/2230))
- @mmcc fixed the progress handle transition jerkiness ([#2219](https://github.com/videojs/video.js/pull/2219))
- @dmlap added support for the seekable property ([#2208](https://github.com/videojs/video.js/pull/2208))
- @mmcc un-hid the current and remaining times by default ([#2241](https://github.com/videojs/video.js/pull/2241))
- @pavelhoral fixed a bug with user activity that caused the control bar to flicker ([#2299](https://github.com/videojs/video.js/pull/2299))
- @dmlap updated to videojs-swf@4.7.1 to fix a video dimensions issue on subsequent loads ([#2281](https://github.com/videojs/video.js/pull/2281))
- @mmcc added the vjs-big-play-centered class ([#2293](https://github.com/videojs/video.js/pull/2293))
- @thijstriemstra added a logged error when a plugin is missing ([#1931](https://github.com/videojs/video.js/pull/1931))
- @gkatsev fixed the texttrackchange event and text track display for non-native tracks ([#2215](https://github.com/videojs/video.js/pull/2215))
- @mischizzle fixed event.relatedTarget in Firefox ([#2025](https://github.com/videojs/video.js/pull/2025))
- @mboles updated JSDoc comments everywhere to prepare for new docs ([#2270](https://github.com/videojs/video.js/pull/2270))
- @mmcc added a currentTime tooltip to the progress handle ([#2255](https://github.com/videojs/video.js/pull/2255))
- @pavelhoral fixed subclassing without a constructor ([#2308](https://github.com/videojs/video.js/pull/2308))
- @dmlap fixed a vjs_getProperty error caused by a progress check before the swf was ready ([#2316](https://github.com/videojs/video.js/pull/2316))
- @dmlap exported the videojs.log function ([#2317](https://github.com/videojs/video.js/pull/2317))
- @gkatsev updated vttjs to fix a trailing comma JSON error ([#2331](https://github.com/videojs/video.js/pull/2331))
- @gkatsev exported the videojs.bind() function ([#2332](https://github.com/videojs/video.js/pull/2332))
- Insert cloned el back into DOM. Fixes #2214 ([#2334](https://github.com/videojs/video.js/pull/2334))
- @heff sped up testing ([#2254](https://github.com/videojs/video.js/pull/2254))
- Pass fs state to player from enterFullscreen, split full-window styles into their own selector ([#2357](https://github.com/videojs/video.js/pull/2357))
- Fixed vertical option for volumeMenuButton ([#2352](https://github.com/videojs/video.js/pull/2352))
- @dmlap switched events to not bubble by default ([#2351](https://github.com/videojs/video.js/pull/2351))
- @dmlap export videojs.createTimeRange ([#2361](https://github.com/videojs/video.js/pull/2361))
- @dmlap export a basic played() on techs ([#2384](https://github.com/videojs/video.js/pull/2384))
- @dmlap use seekable on source handlers when defined ([#2376](https://github.com/videojs/video.js/pull/2376))
- @dmlap fire seeking in the flash tech, not the SWF ([#2372](https://github.com/videojs/video.js/pull/2372))
- @dmlap expose the xhr helper utility ([#2321](https://github.com/videojs/video.js/pull/2321))
- @misteroneill fixed internal extends usage and added a deprecation warning ([#2390](https://github.com/videojs/video.js/pull/2390))
- @eXon added the poster to the options the tech receives ([#2338](https://github.com/videojs/video.js/pull/2338))
- @eXon made sure the volume persists between tech changes ([#2340](https://github.com/videojs/video.js/pull/2340))
- @eXon added the language to the options the tech receives ([#2338](https://github.com/videojs/video.js/pull/2338))
- @mmcc Added &quot;inline&quot; option to MenuButton and updated VolumeMenuButton to be able to utilize it ([#2378](https://github.com/videojs/video.js/pull/2378))
- @misteroneill restore some properties on window.videojs. ([#2395](https://github.com/videojs/video.js/pull/2395))
- @misteroneill restore some 4.x utilities and remove deprecated functionality ([#2406](https://github.com/videojs/video.js/pull/2406))
- @heff use a synchronous ready() internally ([#2392](https://github.com/videojs/video.js/pull/2392))
- @nickygerritsen scrubbing() is a method, not a property ([#2411](https://github.com/videojs/video.js/pull/2411))
- @sirlancelot change &quot;video&quot; to &quot;media&quot; in error messages ([#2409](https://github.com/videojs/video.js/pull/2409))
- @nickygerritsen use the default seekable when a source handler is unset ([#2401](https://github.com/videojs/video.js/pull/2401))
- @gkatsev always use emulated TextTrackLists so tracks survive tech switches ([#2425](https://github.com/videojs/video.js/pull/2425))
- @misteroneill restore Html5.Events ([#2421](https://github.com/videojs/video.js/pull/2421))
- @misteroneill removed the deprecated Component init method ([#2427](https://github.com/videojs/video.js/pull/2427))
- @misteroneill restore videojs.formatTime ([#2420](https://github.com/videojs/video.js/pull/2420))
- @misteroneill include child components with &#x60;true&#x60; in options ([#2424](https://github.com/videojs/video.js/pull/2424))
- @misteroneill create video.novtt.js in dist builds ([#2447](https://github.com/videojs/video.js/pull/2447))
- @misteroneill pass vtt.js option to tech ([#2448](https://github.com/videojs/video.js/pull/2448))
- @forbesjo updated the sauce labs config and browser versions ([#2450](https://github.com/videojs/video.js/pull/2450))
- @mmcc made sure controls respect muted attribute ([#2408](https://github.com/videojs/video.js/pull/2408))
- @dmlap switched global options back to an object at videojs.options ([#2461](https://github.com/videojs/video.js/pull/2461))
- @ogun fixed a typo in the Turkish translation ([#2460](https://github.com/videojs/video.js/pull/2460))
- @gkatsev fixed text track errors on dispose and in cross-browser testing ([#2466](https://github.com/videojs/video.js/pull/2466))
- @mmcc added type=button to button components ([#2471](https://github.com/videojs/video.js/pull/2471))
- @mmcc Fixed IE by using setAttribute to set &#x27;type&#x27; property ([#2487](https://github.com/videojs/video.js/pull/2487))
- @misternoneill fixed vertical slider issues ([#2469](https://github.com/videojs/video.js/pull/2469))
- @gkatsev moved default and player dimensions to style els at the top of HEAD ([#2482](https://github.com/videojs/video.js/pull/2482))
- @gkatsev moved default and player dimensions to style els at the top of HEAD el ([#2482](https://github.com/videojs/video.js/pull/2482))
- @gkatsev removed non-default track auto-disabling ([#2475](https://github.com/videojs/video.js/pull/2475))
- @gkatsev exported event helpers on videojs object ([#2491](https://github.com/videojs/video.js/pull/2491))
- @nickygerritsen fixed texttrack handling in IE10 ([#2481](https://github.com/videojs/video.js/pull/2481))
- @gkatsev deep clone el for iOS to preserve tracks ([#2494](https://github.com/videojs/video.js/pull/2494))
- @forbesjo switched automated testing to BrowserStack ([#2492](https://github.com/videojs/video.js/pull/2492))
- @gkatsev fixed nativeControlsForTouch handling. Defaults to native controls on iphone and native android browsers. ([#2499](https://github.com/videojs/video.js/pull/2499))
- @heff fixed cross-platform track tests by switching to a fake tech ([#2496](https://github.com/videojs/video.js/pull/2496))
- @gkatsev improved tech controls listener handling. ([#2511](https://github.com/videojs/video.js/pull/2511))
- @dmlap move seek on replay into the flash tech ([#2527](https://github.com/videojs/video.js/pull/2527))
- @dmlap @gkatsev improve Flash tech error property and add an error setter to the base tech ([#2517](https://github.com/videojs/video.js/pull/2517))
- @dmlap update to videojs-swf 5.0.0-rc1 ([#2528](https://github.com/videojs/video.js/pull/2528))
- @dmlap expose start and end buffered times ([#2501](https://github.com/videojs/video.js/pull/2501))
- @heff fixed a number of console errors after testing ([#2513](https://github.com/videojs/video.js/pull/2513))
- @gkatsev made the sass files available via npm in src/css ([#2546](https://github.com/videojs/video.js/pull/2546))
- @heff removed playerOptions from plugin options because it created an inconsistency in plugin inits ([#2532](https://github.com/videojs/video.js/pull/2532))
- @heff added a default data attribute to fix the progress handle display in IE8 ([#2547](https://github.com/videojs/video.js/pull/2547))
- @heff added back the default cdn url for the swf ([#2533](https://github.com/videojs/video.js/pull/2533))
- @gkatsev fixed the default state of userActive ([#2557](https://github.com/videojs/video.js/pull/2557))
- @heff fixed event bubbling in IE8 ([#2563](https://github.com/videojs/video.js/pull/2563))
- @heff cleaned up internal duration handling ([#2552](https://github.com/videojs/video.js/pull/2552))
- @heff fixed the UI for live streams ([#2557](https://github.com/videojs/video.js/pull/2557))
- @gkatsev updated opacity of caption settings background color ([#2573](https://github.com/videojs/video.js/pull/2573))
- @gkatsev made all sass variables !default ([#2574](https://github.com/videojs/video.js/pull/2574))
- @heff fixed the inline volume control and made it the default ([#2553](https://github.com/videojs/video.js/pull/2553))
- @forbesjo fixed webkit deprecation warnings ([#2558](https://github.com/videojs/video.js/pull/2558))
- @forbesjo added Android and iOS browser testing ([#2538](https://github.com/videojs/video.js/pull/2538))
- @heff improved css selector strengths ([#2583](https://github.com/videojs/video.js/pull/2583))
- @heff moved scss vars to be private ([#2584](https://github.com/videojs/video.js/pull/2584))
- @heff added a fancy loading spinner ([#2582](https://github.com/videojs/video.js/pull/2582))
- @gkatsev added a mouse-hover time display to the progress bar ([#2569](https://github.com/videojs/video.js/pull/2569))
- @heff added an attributes argument to createEl() ([#2589](https://github.com/videojs/video.js/pull/2589))
- @heff made tech related functions private in the player ([#2590](https://github.com/videojs/video.js/pull/2590))
- @heff removed the loadedalldata event ([#2591](https://github.com/videojs/video.js/pull/2591))
- @dmlap switched to using raynos/xhr for requests ([#2594](https://github.com/videojs/video.js/pull/2594))
- @heff Fixed double loadstart and ready events ([#2605](https://github.com/videojs/video.js/pull/2605))
- @gkatsev fixed potential double default style elements ([#2619](https://github.com/videojs/video.js/pull/2619))
- @imbcmdth extended createTimeRange to support multiple timeranges ([#2604](https://github.com/videojs/video.js/pull/2604))
- @misteroneill rename &quot;extends&quot; to &quot;extend&quot; for ie8 ([#2624](https://github.com/videojs/video.js/pull/2624))
- @forbesjo removed the PhantomJS dependency ([#2622](https://github.com/videojs/video.js/pull/2622))
- @misteroneill re-exposed videojs.TextTrack ([#2625](https://github.com/videojs/video.js/pull/2625))
- @heff removed a second copy of video.novtt.js from dist ([#2630](https://github.com/videojs/video.js/pull/2630))
- @heff fixed timeranges deprecation warnings in tests ([#2627](https://github.com/videojs/video.js/pull/2627))
- @misteroneill updated play control to use its state for icon ([#2636](https://github.com/videojs/video.js/pull/2636))
- @gkatsev exposed isCrossOrigin and used it to enable CORS for textTrack XHRs ([#2633](https://github.com/videojs/video.js/pull/2633))
- @misteroneill fixed tsml to be used as a tag for template strings ([#2629](https://github.com/videojs/video.js/pull/2629))
- @eXon added support for a tech-supplied poster ([#2339](https://github.com/videojs/video.js/pull/2339))
- @heff improved some skin defaults for external styling ([#2642](https://github.com/videojs/video.js/pull/2642))
- @heff changed component child lists to arrays instead of objects ([#2477](https://github.com/videojs/video.js/pull/2477))

## [4.12.15] - 2015-08-31

- @dmlap update to videojs-swf 4.7.4 ([#2463](https://github.com/videojs/video.js/pull/2463))
- @bc-bbay migrate seeking on replay to the flash tech ([#2519](https://github.com/videojs/video.js/pull/2519))
- Updated to v4.7.5 of the swf ([#2531](https://github.com/videojs/video.js/pull/2531))

## [4.12.14] - 2015-08-21

- @gkatsev removed non-default track auto-disabling ([#2468](https://github.com/videojs/video.js/pull/2468))

## [4.12.13] - 2015-08-10

- @dmlap update to videojs-swf v4.7.3 ([#2457](https://github.com/videojs/video.js/pull/2457))

## [4.12.12] - 2015-07-23

- @imbcmdth updated source handlers to use bracket notation so they won't break when using minified videojs ([#2348](https://github.com/videojs/video.js/pull/2348))
- @imbcmdth fix potential triggerReady infinite loop ([#2398](https://github.com/videojs/video.js/pull/2398))

## [4.12.11] - 2015-07-09

- @saxena-gaurav updated swf to 4.7.2 to fix flash of previous video frame ([#2300](https://github.com/videojs/video.js/pull/2300))
- @gkatsev updated the vtt.js version to fix JSON issues ([#2327](https://github.com/videojs/video.js/pull/2327))
- @dmlap fixed an error caused by calling vjs_getProperty on the swf too early ([#2289](https://github.com/videojs/video.js/pull/2289))

## [4.12.10] - 2015-06-23

- @dmlap update to video-js-swf 4.7.1 ([#2280](https://github.com/videojs/video.js/pull/2280))
- @imbcmdth src() should not return blob URLs with MSE source handlers ([#2271](https://github.com/videojs/video.js/pull/2271))

## [4.12.9] - 2015-06-15

- @imbcmdth updated currentSrc to return src instead of blob urls in html5 tech. Fixes #2232 ([#2232](https://github.com/videojs/video.js/pull/2232))
- @imbcmdth fixed async currentSrc behavior ([#2256](https://github.com/videojs/video.js/pull/2256))

## [4.12.8] - 2015-06-05

- @dmlap add the seekable property ([#2207](https://github.com/videojs/video.js/pull/2207))
- @dmlap fix seekable export ([#2227](https://github.com/videojs/video.js/pull/2227))

## [4.12.7] - 2015-05-19

- @tjenkinson Added background-color to vjs-poster to remove transparent borders around scaled poster image ([#2138](https://github.com/videojs/video.js/pull/2138))
- @bc-bbay fixed a bug where the player would try to autoplay when there was no source ([#2127](https://github.com/videojs/video.js/pull/2127))
- @bc-bbay update time display on loadedmetadata ([#2151](https://github.com/videojs/video.js/pull/2151))
- @dmlap update swf to 4.7 to pick up preload fix ([#2170](https://github.com/videojs/video.js/pull/2170))

## [4.12.6] - 2015-05-07

- @saxena-gaurav fixed a bug from disposing after changing techs ([#2125](https://github.com/videojs/video.js/pull/2125))

## [4.12.5] - 2015-03-17

- Updated to videojs-swf v4.5.4 to fix a potential security issue ([#1955](https://github.com/videojs/video.js/pull/1955))

## [4.12.4] - 2015-03-05

- Randomized the Google Analytics calls to stay under the limit ([#1916](https://github.com/videojs/video.js/pull/1916))

## [4.12.3] - 2015-02-28

- @heff fixed setting the source to an empty string ([#1905](https://github.com/videojs/video.js/pull/1905))

## [4.12.2] - 2015-02-27

- @gkatsev fixed disabling of default text tracks ([#1892](https://github.com/videojs/video.js/pull/1892))

## [4.12.1] - 2015-02-19

- @gkatsev fixed the track list reference while switching techs that use emulated tracks ([#1874](https://github.com/videojs/video.js/pull/1874))
- @gkatsev fixed a Firefox error with the captions settings select menu options ([#1877](https://github.com/videojs/video.js/pull/1877))

## [4.12.0] - 2015-02-17

- @PeterDaveHello added a Traditional Chinese translation ([#1729](https://github.com/videojs/video.js/pull/1729))
- @mmcc updated the hide/show functions to use a class instead of inline styles ([#1681](https://github.com/videojs/video.js/pull/1681))
- @mister-ben added better handling of the additional videojs() arguments when the player is already initialized ([#1730](https://github.com/videojs/video.js/pull/1730))
- @anhskohbo added a Vietnamese translation ([#1734](https://github.com/videojs/video.js/pull/1734))
- @Sxmanek added a Czech translation ([#1739](https://github.com/videojs/video.js/pull/1739))
- @jcaron23 added the vjs-scrubbing CSS class and prevented menus from showing while scrubbing ([#1741](https://github.com/videojs/video.js/pull/1741))
- @dmlap fixed URL parsing in IE9 ([#1765](https://github.com/videojs/video.js/pull/1765))
- @gkatsev Fixed issue where ManualTimeUpdatesOff was not de-registering events ([#1793](https://github.com/videojs/video.js/pull/1793))
- @brycefisher Added a guide on player disposal ([#1803](https://github.com/videojs/video.js/pull/1803))
- @toniher added a Catalan translation ([#1794](https://github.com/videojs/video.js/pull/1794))
- @mmcc added a VERSION key to the videojs object ([#1798](https://github.com/videojs/video.js/pull/1798))
- @mmcc fixed an issue with text track hiding introduced in #1681 ([#1804](https://github.com/videojs/video.js/pull/1804))
- @dmlap exported video.js as a named AMD module ([#1844](https://github.com/videojs/video.js/pull/1844))
- @dmlap fixed poster hiding when the loadstart event does not fire ([#1834](https://github.com/videojs/video.js/pull/1834))
- @chikathreesix fixed an object delete error in Chrome ([#1858](https://github.com/videojs/video.js/pull/1858))
- @steverandy fixed an issue with scrolling over the player on touch devices ([#1809](https://github.com/videojs/video.js/pull/1809))
- @mmcc improved tap sensitivity ([#1830](https://github.com/videojs/video.js/pull/1830))
- @mister-ben added a vjs-ended class when playback reaches the end of the timeline ([#1857](https://github.com/videojs/video.js/pull/1857))
- @dmlap Add network and ready state properties ([#1854](https://github.com/videojs/video.js/pull/1854))
- @woollybogger exported the hasClass function ([#1839](https://github.com/videojs/video.js/pull/1839))
- @DevGavin fixed the Chinese translation ([#1841](https://github.com/videojs/video.js/pull/1841))
- @iSimonWeb added font-path variable ([#1847](https://github.com/videojs/video.js/pull/1847))
- @shoshomiga added a Bulgarian translation ([#1849](https://github.com/videojs/video.js/pull/1849))
- @ragecub3 added a Turkish translation ([#1853](https://github.com/videojs/video.js/pull/1853))
- @gkatsev greatly improved text track support and implemented vtt.js as the webvtt parser ([#1749](https://github.com/videojs/video.js/pull/1749))
- @gkatsev fixed captions showing by default in Chrome and Safari ([#1865](https://github.com/videojs/video.js/pull/1865))
- @mister-ben fixed a woff warning in Firefox ([#1870](https://github.com/videojs/video.js/pull/1870))

## [4.11.4] - 2015-01-23

- @heff exported missing source handler functions ([#1787](https://github.com/videojs/video.js/pull/1787))
- @heff fixed type support checking for an empty src string ([#1797](https://github.com/videojs/video.js/pull/1797))
- @carpasse fixed a bug in updating child indexes after removing components ([#1814](https://github.com/videojs/video.js/pull/1814))
- @dmlap fixed a bug where native controls would show after switching techs ([#1811](https://github.com/videojs/video.js/pull/1811))
- @H1D fixed an issue with file extension type detection ([#1818](https://github.com/videojs/video.js/pull/1818))
- @bclwhitaker updated to v4.5.3 of video-js-swf ([#1823](https://github.com/videojs/video.js/pull/1823))

## [4.11.3] - 2014-12-19

- @gdkraus fixed a bug where you could no longer tab-navigate passed a menu button ([#1760](https://github.com/videojs/video.js/pull/1760))
- @matteos exported the setSource functions so source handlers will work in the minified version ([#1753](https://github.com/videojs/video.js/pull/1753))
- @matteos fixed RTMP playback ([#1755](https://github.com/videojs/video.js/pull/1755))

## [4.11.2] - 2014-12-17

- @mmcc fixed a bug where the playback rate menu would not open ([#1716](https://github.com/videojs/video.js/pull/1716))
- @gkatsev fixed an issue with source handlers that caused subclasses of source handler classes to break ([#1746](https://github.com/videojs/video.js/pull/1746))

## [4.11.1] - 2014-12-04

- @heff fixed a code bug in track XHR requests ([#1715](https://github.com/videojs/video.js/pull/1715))

## [4.11.0] - 2014-12-04

- @rutkat updated sliders to use keydown instead of keyup for more responsive key control ([#1616](https://github.com/videojs/video.js/pull/1616))
- @toloudis fixed an issue with checking for an existing source on the video element ([#1651](https://github.com/videojs/video.js/pull/1651))
- @rafalwrzeszcz fixed the Flash object tag markup for strict XML ([#1702](https://github.com/videojs/video.js/pull/1702))
- @thijstriemstra fixed a number of typos in the docs ([#1704](https://github.com/videojs/video.js/pull/1704))
- @heff added the Source Handler interface for handling advanced formats including adaptive streaming ([#1560](https://github.com/videojs/video.js/pull/1560))
- @azawawi added an Arabic translation ([#1692](https://github.com/videojs/video.js/pull/1692))
- @mmcc added functions for better timeout and interval handling ([#1642](https://github.com/videojs/video.js/pull/1642))
- @mmcc fixed the vdata exception when you dispose a player with tracks ([#1710](https://github.com/videojs/video.js/pull/1710))
- @nemesreviz added a Hungarian translation ([#1711](https://github.com/videojs/video.js/pull/1711))
- @heff updated the SWF to the latest version ([#1714](https://github.com/videojs/video.js/pull/1714))

## [4.10.2] - 2014-10-30

- @heff fixed checking for child options in the parent options to allow for 'false' ([#1630](https://github.com/videojs/video.js/pull/1630))
- @heff fixed the VolumeMenuButton options to allow passing 'vertical' to the VolumeBar ([#1631](https://github.com/videojs/video.js/pull/1631))
- @mmcc fixed localization of captions/subtitles menu off buttons ([#1632](https://github.com/videojs/video.js/pull/1632))

## [4.10.1] - 2014-10-29

@heff removed his own stupid error [view](https://github.com/videojs/video.js/commit/a12dd770572a7f16e436e2332eba7ffbb1f1b9b9)

## [4.10.0] - 2014-10-28

- @aptx4869 fixed an issue where the native JSON parser wasn't used ([#1565](https://github.com/videojs/video.js/pull/1565))
- @andekande improved the German translation ([#1555](https://github.com/videojs/video.js/pull/1555))
- @OlehTsvirko added a Ukrainian translation ([#1562](https://github.com/videojs/video.js/pull/1562))
- @OlehTsvirko added a Russian translation ([#1563](https://github.com/videojs/video.js/pull/1563))
- @thijstriemstra added a Dutch translation ([#1566](https://github.com/videojs/video.js/pull/1566))
- @heff updated the poster to use CSS styles to display; fixed the poster not showing if not originally set ([#1568](https://github.com/videojs/video.js/pull/1568))
- @mmcc fixed an issue where errors on source tags could get missed ([#1575](https://github.com/videojs/video.js/pull/1575))
- @heff enhanced the event listener API to allow for auto-cleanup of listeners on other components and elements ([#1588](https://github.com/videojs/video.js/pull/1588))
- @mmcc fixed an issue with the VolumeButton assuming it was vertical by default ([#1592](https://github.com/videojs/video.js/pull/1592))
- @DevGavin added a Simplified Chinese translation ([#1593](https://github.com/videojs/video.js/pull/1593))
- @heff Added the ability to set options for child components directly in the parent options ([#1599](https://github.com/videojs/video.js/pull/1599))
- @heff turned on the custom html controls for touch devices ([#1617](https://github.com/videojs/video.js/pull/1617))

## [4.9.1] - 2014-10-15

- Bumped to videojs-swf v4.5.1 to fix a data sanitization issue ([#1587](https://github.com/videojs/video.js/pull/1587))

## [4.9.0] - 2014-09-30

- @deedos added a Brazilian Portuguese translation ([#1520](https://github.com/videojs/video.js/pull/1520))
- @baloneysandwiches added a hasClass method ([#1464](https://github.com/videojs/video.js/pull/1464))
- @mynameisstephen fixed an issue where slider event listeners were not being cleaned up ([#1475](https://github.com/videojs/video.js/pull/1475))
- @alexrqs cleaned up the Spanish translation ([#1494](https://github.com/videojs/video.js/pull/1494))
- @t2y added a Japanese translation ([#1497](https://github.com/videojs/video.js/pull/1497))
- @chikathreesix fixed an issue where data-setup options could be missed ([#1514](https://github.com/videojs/video.js/pull/1514))
- @seniorflexdeveloper added new translations and translation updates ([#1530](https://github.com/videojs/video.js/pull/1530))
- @chikathreesix exported the videojs.Flash.embed method ([#1533](https://github.com/videojs/video.js/pull/1533))
- @doublex fixed an issue with IE7 backwards compatibility ([#1542](https://github.com/videojs/video.js/pull/1542))
- @mmcc made it possible to override the font-size of captions and subtitles ([#1547](https://github.com/videojs/video.js/pull/1547))
- @philipgiuliani added an Italian translation ([#1550](https://github.com/videojs/video.js/pull/1550))
- @twentyrogersc fixed the return value when setting the poster source ([#1552](https://github.com/videojs/video.js/pull/1552))
- @heff updated to swf v4.5.0 to fix event issues ([#1554](https://github.com/videojs/video.js/pull/1554))
- @rpless made the VolumeMenuButton volume more accessible via tab navigation ([#1519](https://github.com/videojs/video.js/pull/1519))
- @mmcc added support for audio tags (html5 audio only) ([#1540](https://github.com/videojs/video.js/pull/1540))

## [4.8.5] - 2014-09-25

- Updated to the latest version of the swf to fix HLS playback ([#1538](https://github.com/videojs/video.js/pull/1538))

## [4.8.4] - 2014-09-23

- @gkatsev fixed isFullscreen reporting on iOS devices ([#1511](https://github.com/videojs/video.js/pull/1511))

## [4.8.3] - 2014-09-22

- @heff updated to the latest version of the SWF to 4.4.4 ([#1526](https://github.com/videojs/video.js/pull/1526))

## [4.8.2] - 2014-09-16

- @gkatsev fixed an IE11 bug where pause was not fired when the video ends ([#1512](https://github.com/videojs/video.js/pull/1512))

## [4.8.1] - 2014-09-05

- @dmlap fixed an issue where an error could be fired after player disposal ([#1481](https://github.com/videojs/video.js/pull/1481))
- @dmlap fixed poster error handling ([#1482](https://github.com/videojs/video.js/pull/1482))
- @dmlap fixed an issue with languages and subclassing the player ([#1483](https://github.com/videojs/video.js/pull/1483))
- @mmcc fixed a few CSS issues with the poster and the error 'X' ([#1487](https://github.com/videojs/video.js/pull/1487))
- @MrVaykadji and @Calinou added a french translation ([#1467](https://github.com/videojs/video.js/pull/1467))
- @heff fixed an internal deprecation warning and missing deprecated functions ([#1488](https://github.com/videojs/video.js/pull/1488))

## [4.8.0] - 2014-09-03

- @andekande added a German translation ([#1426](https://github.com/videojs/video.js/pull/1426))
- @mattosborn fixed a bug where getting the video element src would overwrite it ([#1430](https://github.com/videojs/video.js/pull/1430))
- @songpete fixed a bug where keyboard events were bubbling and causing additional actions ([#1455](https://github.com/videojs/video.js/pull/1455))
- @knabar made the inactivity timeout configurable ([#1409](https://github.com/videojs/video.js/pull/1409))
- @seniorflexdeveloper added language files to the distribution for including specific languages ([#1453](https://github.com/videojs/video.js/pull/1453))
- @gkatsev improved handling of null and NaN dimension values ([#1449](https://github.com/videojs/video.js/pull/1449))
- @gkatsev fixed an issue where the controls would break if Flash was initialized too quickly ([#1470](https://github.com/videojs/video.js/pull/1470))
- @mmcc fixed an issue where if no playback tech was supported the error could not be caught ([#1473](https://github.com/videojs/video.js/pull/1473))

## [4.7.3] - 2014-08-20

- Added function for adding new language translations, updated docs, and fixed the notSupportedMessage translation ([#1427](https://github.com/videojs/video.js/pull/1427))
- Exposed the player.selectSource method to allow overriding the source selection order ([#1424](https://github.com/videojs/video.js/pull/1424))

## [4.7.2] - 2014-08-14

- Fixed a case where timeupdate events were not firing, and fixed and issue with the Flash player version ([#1417](https://github.com/videojs/video.js/pull/1417))

## [4.7.1] - 2014-08-06

- Fixed the broken bower.json config ([#1401](https://github.com/videojs/video.js/pull/1401))

## [4.7.0] - 2014-08-05

- Added cross-browser isArray for cross-frame support. fixes #1195 ([#1218](https://github.com/videojs/video.js/pull/1218))
- Fixed support for webvtt chapters. Fixes #676. ([#1221](https://github.com/videojs/video.js/pull/1221))
- Fixed issues around webvtt cue time parsing. Fixed #877, fixed #183. ([#1236](https://github.com/videojs/video.js/pull/1236))
- Fixed an IE11 issue where clicking on the video wouldn&#x27;t show the controls ([#1291](https://github.com/videojs/video.js/pull/1291))
- Added a composer.json for PHP packages ([#1241](https://github.com/videojs/video.js/pull/1241))
- Exposed the vertical option for slider controls ([#1303](https://github.com/videojs/video.js/pull/1303))
- Fixed an error when disposing a tech using manual timeupdates ([#1312](https://github.com/videojs/video.js/pull/1312))
- Exported missing Player API methods (remainingTime, supportsFullScreen, enterFullWindow, exitFullWindow, preload) ([#1328](https://github.com/videojs/video.js/pull/1328))
- Added a base for running saucelabs tests from grunt ([#1215](https://github.com/videojs/video.js/pull/1215))
- Added additional browsers for saucelabs testing ([#1216](https://github.com/videojs/video.js/pull/1216))
- Added support for listening to multiple events through a types array ([#1231](https://github.com/videojs/video.js/pull/1231))
- Exported the vertical option for the volume slider ([#1378](https://github.com/videojs/video.js/pull/1378))
- Fixed Component trigger function arguments and docs ([#1310](https://github.com/videojs/video.js/pull/1310))
- Now copying all attributes from the original video tag to the generated video element ([#1321](https://github.com/videojs/video.js/pull/1321))
- Added files to be ignored in the bower.json ([#1337](https://github.com/videojs/video.js/pull/1337))
- Fixed an error that could happen if Flash was disposed before the ready callback was fired ([#1340](https://github.com/videojs/video.js/pull/1340))
- The up and down arrows can now be used to control sliders in addition to left and right ([#1345](https://github.com/videojs/video.js/pull/1345))
- Added a player.currentType() function to get the MIME type of the current source ([#1320](https://github.com/videojs/video.js/pull/1320))
- Fixed a potential conflict with other event listener shims ([#1363](https://github.com/videojs/video.js/pull/1363))
- Added support for multiple time ranges in the load progress bar ([#1253](https://github.com/videojs/video.js/pull/1253))
- Added vjs-waiting and vjs-seeking css classnames and updated the spinner to use them ([#1351](https://github.com/videojs/video.js/pull/1351))
- Now restoring the original video tag attributes on a tech change to support webkit-playsinline ([#1369](https://github.com/videojs/video.js/pull/1369))
- Fixed an issue where the user was unable to scroll/zoom page if touching the video ([#1373](https://github.com/videojs/video.js/pull/1373))
- Added "sliding" class for when slider is sliding to help with handle styling ([#1385](https://github.com/videojs/video.js/pull/1385))

## [4.6.4] - 2014-07-11

- Fixed an issue where Flash autoplay would not show the controls ([#1343](https://github.com/videojs/video.js/pull/1343))

## [4.6.3] - 2014-06-12

- Updated to version 4.4.1 of the SWF ([#1285](https://github.com/videojs/video.js/pull/1285))
- Fixed a minification issue with the fullscreen event. fixes #1282 ([#1286](https://github.com/videojs/video.js/pull/1286))

## [4.6.2] - 2014-06-10

- Fixed an issue with the firstplay event not firing when autoplaying ([#1271](https://github.com/videojs/video.js/pull/1271))

## [4.6.1] - 2014-05-20

- Updated playbackRate menu to work in minified version ([#1223](https://github.com/videojs/video.js/pull/1223))

## [4.6.0] - 2014-05-20

- Updated the UI to support live video ([#1121](https://github.com/videojs/video.js/pull/1121))
- The UI now resets after a source change ([#1124](https://github.com/videojs/video.js/pull/1124))
- Now assuming smart CSS defaults for sliders to prevent reflow on player init ([#1122](https://github.com/videojs/video.js/pull/1122))
- Fixed the title element placement in menus [[view](https://github.com/videojs/video.js/pull/1114)]
- Fixed title support for menu buttons ([#1128](https://github.com/videojs/video.js/pull/1128))
- Fixed extra mousemove events on Windows caused by certain apps, not users [[view](https://github.com/videojs/video.js/pull/1068)]
- Fixed error due to undefined tech when no source is supported [[view](https://github.com/videojs/video.js/pull/1172)]
- Fixed the progress bar not finishing when manual timeupdate events are used [[view](https://github.com/videojs/video.js/pull/1173)]
- Added a more informative and styled fallback message for non-html5 browsers [[view](https://github.com/videojs/video.js/pull/1181)]
- Added the option to provide an array of child components instead of an object [[view](https://github.com/videojs/video.js/pull/1093)]
- Fixed casing on webkitRequestFullscreen [[view](https://github.com/videojs/video.js/pull/1101)]
- Made tap events on mobile less sensitive to touch moves [[view](https://github.com/videojs/video.js/pull/1111)]
- Fixed the default flag for captions/subtitles tracks [[view](https://github.com/videojs/video.js/pull/1153)]
- Fixed compilation failures with LESS v1.7.0 and GRUNT v0.4.4 [[view](https://github.com/videojs/video.js/pull/1180)]
- Added better error handling across the library [[view](https://github.com/videojs/video.js/pull/1197)]
- Updated captions/subtitles file fetching to support cross-origin requests in older IE browsers [[view](https://github.com/videojs/video.js/pull/1095)]
- Added support for playback rate switching [[view](https://github.com/videojs/video.js/pull/1132)]
- Fixed an issue with the loadstart event order that caused the big play button to not hide [[view](https://github.com/videojs/video.js/pull/1209)]
- Modernized the fullscreen API and added support for IE11 [[view](https://github.com/videojs/video.js/pull/1205)]
- Added cross-browser testing with SauceLabs, and added Karma as the default test runner ([#1187](https://github.com/videojs/video.js/pull/1187))
- Fixed saucelabs integration to run on commits in TravisCI ([#1214](https://github.com/videojs/video.js/pull/1214))
- Added a clearer error message when a tech is undefined ([#1210](https://github.com/videojs/video.js/pull/1210))
- Added a cog icon to the font icons ([#1211](https://github.com/videojs/video.js/pull/1211))
- Added a player option to offset the subtitles/captions timing ([#1212](https://github.com/videojs/video.js/pull/1212))

## [4.5.2] - 2014-04-12

- Updated release versioning to include bower.json and component.json

## [4.5.1] - 2014-03-27

- Fixed a bug from the last release where canPlaySource was no longer exported

## [4.5.0] - 2014-03-27

- Added component(1) support ([#1032](https://github.com/videojs/video.js/pull/1032))
- Captions now move down when controls are hidden ([#1053](https://github.com/videojs/video.js/pull/1053))
- Added the .less source file to the distribution files ([#1056](https://github.com/videojs/video.js/pull/1056))
- Changed src() to return the current selected source ([#968](https://github.com/videojs/video.js/pull/968))
- Added a grunt task for opening the next issue that needs addressing ([#1059](https://github.com/videojs/video.js/pull/1059))
- Fixed Android 4.0+ devices' check for HLS support ([#1084](https://github.com/videojs/video.js/pull/1084))

## [4.4.3] - 2014-03-06

- Fixed bugs in IE9 Windows 7N with no Media Player ([#1060](https://github.com/videojs/video.js/pull/1060))
- Fixed a bug with setPoster() in the minified version ([#1062](https://github.com/videojs/video.js/pull/1062))

## [4.4.2] - 2014-02-24

- Fixed module.exports in minified version ([#1038](https://github.com/videojs/video.js/pull/1038))

## [4.4.1] - 2014-02-18

- Added .npmignore so dist files wouldn't be ignored in packages

## [4.4.0] - 2014-02-18

- Made the poster updateable after initialization ([#838](https://github.com/videojs/video.js/pull/838))
- Exported more textTrack functions ([#815](https://github.com/videojs/video.js/pull/815))
- Moved player ID generation to support video tags with no IDs ([#845](https://github.com/videojs/video.js/pull/845))
- Moved to using QUnit as a dependency ([#850](https://github.com/videojs/video.js/pull/850))
- Added the util namespace for public utility functions ([#862](https://github.com/videojs/video.js/pull/862))
- Fixed an issue with calling duration before Flash is loaded ([#861](https://github.com/videojs/video.js/pull/861))
- Added player methods to externs so they can be overridden ([#878](https://github.com/videojs/video.js/pull/878))
- Fixed html5 playback when switching between media techs ([#887](https://github.com/videojs/video.js/pull/887))
- Fixed Firefox+Flash mousemove events so controls don't hide permanently ([#899](https://github.com/videojs/video.js/pull/899))
- Fixed a test for touch detection ([#962](https://github.com/videojs/video.js/pull/962))
- Updated the src file list for karma tests ([#948](https://github.com/videojs/video.js/pull/948))
- Added more tests for API properties after minification ([#906](https://github.com/videojs/video.js/pull/906))
- Updated project to use npm version of videojs-swf ([#930](https://github.com/videojs/video.js/pull/930))
- Added support for dist zipping on windows ([#944](https://github.com/videojs/video.js/pull/944))
- Fixed iOS fullscreen issue ([#977](https://github.com/videojs/video.js/pull/977))
- Fixed touch event bubbling ([#992](https://github.com/videojs/video.js/pull/992))
- Fixed ARIA role attribute for button and slider ([#988](https://github.com/videojs/video.js/pull/988))
- Fixed an issue where a component's dispose event would bubble up ([#981](https://github.com/videojs/video.js/pull/981))
- Quieted down deprecation warnings ([#971](https://github.com/videojs/video.js/pull/971))
- Updated the seek handle to contain the current time ([#902](https://github.com/videojs/video.js/pull/902))
- Added requirejs and browserify support (UMD) ([#998](https://github.com/videojs/video.js/pull/998))

## [4.3.0] - 2013-11-04

- Added Karma for cross-browser unit testing ([#714](https://github.com/videojs/video.js/pull/714))
- Unmuting when the volume is changed ([#720](https://github.com/videojs/video.js/pull/720))
- Fixed an accessibility issue with the big play button ([#777](https://github.com/videojs/video.js/pull/777))
- Exported user activity methods ([#783](https://github.com/videojs/video.js/pull/783))
- Added a classname to center the play button and new spinner options ([#784](https://github.com/videojs/video.js/pull/784))
- Added API doc generation ([#801](https://github.com/videojs/video.js/pull/801))
- Added support for codecs in Flash mime types ([#805](https://github.com/videojs/video.js/pull/805))

## [4.2.2] - 2013-10-15

- Fixed a race condition that would cause videos to fail in Firefox ([#776](https://github.com/videojs/video.js/pull/776))

## [4.2.1] - 2013-09-09

- Fixed an infinite loop caused by loading the library asynchronously ([#727](https://github.com/videojs/video.js/pull/727))

## [4.2.0] - 2013-09-04

- Added LESS as a CSS preprocessor for the default skin ([#644](https://github.com/videojs/video.js/pull/644))
- Exported MenuButtons for use in the API ([#648](https://github.com/videojs/video.js/pull/648))
- Fixed ability to remove listeners added with one() ([#659](https://github.com/videojs/video.js/pull/659))
- Updated buffered() to account for multiple loaded ranges ([#643](https://github.com/videojs/video.js/pull/643))
- Exported createItems() for custom menus ([#654](https://github.com/videojs/video.js/pull/654))
- Preventing media events from bubbling up the DOM ([#630](https://github.com/videojs/video.js/pull/630))
- Major reworking of the control bar and many issues fixed ([#672](https://github.com/videojs/video.js/pull/672))
- Fixed an issue with minifiying the code on Windows systems ([#683](https://github.com/videojs/video.js/pull/683))
- Added support for RTMP streaming through Flash ([#605](https://github.com/videojs/video.js/pull/605))
- Made tech.features available to external techs ([#705](https://github.com/videojs/video.js/pull/705))
- Minor code improvements ([#706](https://github.com/videojs/video.js/pull/706))
- Updated time formatting to support NaN and Infinity ([#627](https://github.com/videojs/video.js/pull/627))
- Fixed an `undefined` error in cases where no tech is loaded ([#632](https://github.com/videojs/video.js/pull/632))
- Exported addClass and removeClass for player components ([#661](https://github.com/videojs/video.js/pull/661))
- Made the fallback message customizable ([#638](https://github.com/videojs/video.js/pull/638))
- Fixed an issue with the loading spinner placement and rotation ([#694](https://github.com/videojs/video.js/pull/694))
- Fixed an issue with fonts being flaky in IE8

## [4.1.0] - 2013-06-28

- Turned on method queuing for unready playback technologies (flash) [view](https://github.com/videojs/video.js/pull/553)
- Blocking user text selection on player components [view](https://github.com/videojs/video.js/pull/524)
- Exported requestFullScreen() and cancelFullScreen() in the minified version [view](https://github.com/videojs/video.js/pull/555)
- Exported the global players reference, videojs.players [view](https://github.com/videojs/video.js/pull/560)
- Added google analytics to the CDN version ([#568](https://github.com/videojs/video.js/pull/568))
- Exported fadeIn/fadeOut for the Component API ([#581](https://github.com/videojs/video.js/pull/581))
- Fixed an IE poster error when autoplaying ([#593](https://github.com/videojs/video.js/pull/593))
- Exported bufferedPercent for the API ([#588](https://github.com/videojs/video.js/pull/588))
- Augmented user agent detection, specifically for Android versions ([#470](https://github.com/videojs/video.js/pull/470))
- Fixed IE9 canPlayType error ([#606](https://github.com/videojs/video.js/pull/606))
- Fixed various issues with captions ([#609](https://github.com/videojs/video.js/pull/609))

## [4.0.4] - 2013-06-11

- Added google analytics to current CDN version. ([#571](https://github.com/videojs/video.js/pull/571))

## [4.0.3] - 2013-05-28

- Fixed an bug with exiting fullscreen. [view](https://github.com/videojs/video.js/pull/546)

## [4.0.2] - 2013-05-23

- Correct version number for CDN swf url. Minify CSS. [view](https://github.com/videojs/video.js/pull/535)

## [4.0.1] - 2013-05-22

- Fixed old IE font loading [view](https://github.com/videojs/video.js/pull/532)

## 4.0.0 - 2013-05-09

- Improved performance through an 18% size reduction using Google Closure Compiler in advanced mode
- Greater stability through an automated cross-browser/device test suite using TravisCI, Bunyip, and Browserstack.
- New plugin interface and plugin listing for extending Video.js
- New default skin design that uses font icons for greater customization
- Responsive design and retina display support
- Improved accessibility through better ARIA support
- Moved to Apache 2.0 license
- 100% JavaScript development tool set including Grunt
- Updated docs to use Github markdown
- Allow disabling of default components
- Duration is now setable (need ed for HLS m3u8 files)
- Event binders (on/off/one) now return the player instance
- Stopped player from going back to beginning on ended event
- Added support for percent width/height and fluid layouts
- Improved load order of elements to reduce reflow
- Changed addEvent function name to 'on'
- Removed conflicting array.indexOf function
- Added exitFullScreen to support BlackBerry devices (pull/143)

## 3.2.0 - 2012-03-20

- Updated docs with more options.
- Overhauled HTML5 Track support.
- Fixed Flash always autoplaying when setting source.
- Fixed localStorage context
- Updated 'fullscreenchange' event to be called even if the user presses escape to exit fullscreen.
- Automatically converting URsource URL to absolute for Flash fallback.
- Created new 'loadedalldata' event for when  the source is completely downloaded
- Improved player.destroy(). Now removes elements and references.
- Refactored API to be more immediately available.

### Patches
- 3.2.1 (2012-04-06) Fixed setting width/height with javascript options
- 3.2.2 (2012-05-02) Fixed error with multiple controls fading listeners
- 3.2.3 (2012-11-12) Fixed chrome spinner continuing on seek

## 3.1.0 - 2012-01-30

- Added CSS fix for Firefox 9 fullscreen (in the rare case that it's enabled)
- Replaced swfobject with custom embed to save file size.
- Added  flash iframe-mode, an experimental method for getting around flash reloading issues.
- Fixed issue with volume knob position. Improved controls fading.
- Fixed ian issue with triggering fullscreen a second time.
- Fixed issue with getting attributes in Firefox 3.0
- Escaping special characters in source URL for Flash
- Added a check for if Firefox is enabled which fixes a Firefox 9 issue
- Stopped spinner from showing on 'stalled' events since browsers sometimes don't show that they've recovered.
- Fixed CDN Version which was breaking dev.html
- Made full-window mode more independent
- Added rakefile for release generation

## 3.0.0 - 2012-01-10

- Same HTML/CSS Skin for both HTML5 and Flash video
- Super lightweight Flash fallback player for browsers that don’t support HTML5 video
- Free CDN hosting

### Patches
- 3.0.2 (2012-01-12) Started tracking changes with zenflow
- 3.0.3 (2012-01-12) Added line to docs to test zenflow
- 3.0.4 (2012-01-12) Fixing an undefined source when no sources exist on load
- 3.0.5 (2012-01-12) Removed deprecated event.layerX and layerY
- 3.0.6 (2012-01-12) Fixed wrong URL for CDN in docs
- 3.0.7 (2012-01-12) Fixed an ie8 breaking bug with the poster
- 3.0.8 (2012-01-23) Fixed issue with controls not hiding in IE due to no opacity support

## [2.0.3] - 2011-06-15

- Feature: Made returning to the start at the end of the movie an option ("returnToStart").
- Feature: Added loop option to loop movie ("loop").
- Feature: Reorganized player API and listeners.
- Feature: Added option to disable controls. controlsEnabled: false
- Feature: Setup method now has a callback, so you can more easily work with the player after setup
- Feature: Added listeners for enter/exit full screen/window.
- Feature: Added a VideoJS.player(id) function for getting the player for a video ID
- Changes: setupAllWhenReady is now just setupAll (backward compatible)
- Fix: Check for Android browser now excludes firefox and opera

## 2.0.2 - 2010-12-10

- Feature: Rewrote and optimized subtitle code.
- Feature: Protecting against volume ranges outside of 1 and 0.
- Fix: Bug in Safari for Mac OS 10.5 (Leopard) that was breaking fullscreen.

## 2.0.1 - 2010-11-22

- Fix: Issue with big play button when multiple videos are on the page.
- Fix: Optimized play progress tracking.
- Fix: Optimized buffer progress checking.
- Fix: Firefox not showing Flash fallback object.

## 2.0.0 - 2010-11-21

- Feature: Created "behaviors" concept for adding behaviors to elements
- Feature: Switched back to divs for controls, for more portable styles
- Feature: Created playerFallbackOrder array option. ["html5", "flash", "links"]
- Feature: Created playerType concept, for initializing different platforms
- Feature: Added play button for Android
- Feature: Added spinner for iPad (non-fullscreen)
- Feature: Split into multiple files for easier development
- Feature: Combined VideoJS & _V_ into the same variable to reduce confusion
- Fix: Checking for m3u8 files (Apple HTTP Streaming)
- Fix: Catching error on localStorage full that safari seems to randomly throw
- Fix: Scrubbing to end doesn't trigger onEnded

## 1.1.5 - 2010-11-09

- Feature: Switched to track method for setting subtitles. Now works like spec.
- Feature: Created "players" concept for defining fallbacks and fallback order
- Fix: Android playback bug.
- Fix: Massive reorganization of code to make easier to navigate

## 1.1.4 - 2010-11-06

- Feature: Added loading spinner.
- Feature: Improved styles loaded checking.
- Feature: Added volume() function to get and set volume through the player.
- Fix: Fix issue where FF would loop video in background when ended.
- Fix: Bug in Chrome that shows poster & plays audio if you set currentTime too quickly.
- Fix: Bug in Safari where waiting is triggered and shows spinner when not needed
- Fix: Updated to show links if only unplayable sources and no Flash.
- Fix: Issue where if play button was loaded after play, it wouldn't hide.

## 1.1.3 - 2010-10-19

- Feature: Width/Height functions for resizing the player
- Feature: Made initial click & hold trigger new value on progress and volume
- Feature: Made controls not hide when hovering over them
- Feature: Added big play button as default starting control.
- Fix: Removed trailing comma that was breaking IE7
- Fix: Removed some vars from global scope
- Fix: Changed a document.onmousemove to an eventListener to prevent conflicts
- Fix: Added a unique ID to FlowPlayer demo object to fix a FlowPlayer bug. Thanks @emirpprime.
- Fix: Safari error on unloaded video

## 1.1.2 - 2010-09-20

- Added a fix for the poster bug in iPad/iPhone
- Added more specificity to styles

## 1.1.1 - 2010-09-14

- First Formally Versioned Release

## 1.0.0 - 2010-05-18

- First released

[8.24.2]: https://github.com/videojs/video.js/compare/v8.24.1...v8.24.2
[8.24.1]: https://github.com/videojs/video.js/compare/v8.24.0...v8.24.1
[8.24.0]: https://github.com/videojs/video.js/compare/v8.23.9...v8.24.0
[8.23.9]: https://github.com/videojs/video.js/compare/v8.23.8...v8.23.9
[8.23.8]: https://github.com/videojs/video.js/compare/v8.23.7...v8.23.8
[8.23.7]: https://github.com/videojs/video.js/compare/v8.23.4...v8.23.7
[8.23.6]: https://github.com/videojs/video.js/compare/v8.23.5...v8.23.6
[8.23.5]: https://github.com/videojs/video.js/compare/v8.23.4...v8.23.5
[8.23.4]: https://github.com/videojs/video.js/compare/v8.23.3...v8.23.4
[8.23.3]: https://github.com/videojs/video.js/compare/v8.23.2...v8.23.3
[8.23.2]: https://github.com/videojs/video.js/compare/v8.23.1...v8.23.2
[8.23.1]: https://github.com/videojs/video.js/compare/v8.23.0...v8.23.1
[8.23.0]: https://github.com/videojs/video.js/compare/v8.22.0...v8.23.0
[8.22.0]: https://github.com/videojs/video.js/compare/v8.21.1...v8.22.0
[8.21.1]: https://github.com/videojs/video.js/compare/v8.21.0...v8.21.1
[8.21.0]: https://github.com/videojs/video.js/compare/v8.20.0...v8.21.0
[8.20.0]: https://github.com/videojs/video.js/compare/v8.19.2...v8.20.0
[8.19.2]: https://github.com/videojs/video.js/compare/v8.19.1...v8.19.2
[8.19.1]: https://github.com/videojs/video.js/compare/v8.19.0...v8.19.1
[8.19.0]: https://github.com/videojs/video.js/compare/v8.18.1...v8.19.0
[8.18.1]: https://github.com/videojs/video.js/compare/v8.18.0...v8.18.1
[8.18.0]: https://github.com/videojs/video.js/compare/v8.17.4...v8.18.0
[8.17.4]: https://github.com/videojs/video.js/compare/v8.17.3...v8.17.4
[8.17.3]: https://github.com/videojs/video.js/compare/v8.17.2...v8.17.3
[8.17.2]: https://github.com/videojs/video.js/compare/v8.17.1...v8.17.2
[8.17.1]: https://github.com/videojs/video.js/compare/v8.17.0...v8.17.1
[8.17.0]: https://github.com/videojs/video.js/compare/v8.16.1...v8.17.0
[8.16.1]: https://github.com/videojs/video.js/compare/v8.16.0...v8.16.1
[8.16.0]: https://github.com/videojs/video.js/compare/v8.15.0...v8.16.0
[8.15.0]: https://github.com/videojs/video.js/compare/v8.14.1...v8.15.0
[8.14.1]: https://github.com/videojs/video.js/compare/v8.14.0...v8.14.1
[8.14.0]: https://github.com/videojs/video.js/compare/v8.13.0...v8.14.0
[8.13.0]: https://github.com/videojs/video.js/compare/v8.12.0...v8.13.0
[8.12.0]: https://github.com/videojs/video.js/compare/v8.11.8...v8.12.0
[8.11.8]: https://github.com/videojs/video.js/compare/v8.11.7...v8.11.8
[8.11.7]: https://github.com/videojs/video.js/compare/v8.11.6...v8.11.7
[8.11.6]: https://github.com/videojs/video.js/compare/v8.11.5...v8.11.6
[8.11.5]: https://github.com/videojs/video.js/compare/v8.11.4...v8.11.5
[8.11.4]: https://github.com/videojs/video.js/compare/v8.11.3...v8.11.4
[8.11.3]: https://github.com/videojs/video.js/compare/v8.11.2...v8.11.3
[8.11.2]: https://github.com/videojs/video.js/compare/v8.11.1...v8.11.2
[8.11.1]: https://github.com/videojs/video.js/compare/v8.11.0...v8.11.1
[8.11.0]: https://github.com/videojs/video.js/compare/v8.10.0...v8.11.0
[8.10.0]: https://github.com/videojs/video.js/compare/v8.9.0...v8.10.0
[8.9.0]: https://github.com/videojs/video.js/compare/v8.8.0...v8.9.0
[8.8.0]: https://github.com/videojs/video.js/compare/v8.7.0...v8.8.0
[8.7.0]: https://github.com/videojs/video.js/compare/v8.6.1...v8.7.0
[8.6.1]: https://github.com/videojs/video.js/compare/v8.6.0...v8.6.1
[8.6.0]: https://github.com/videojs/video.js/compare/v8.5.3...v8.6.0
[8.5.3]: https://github.com/videojs/video.js/compare/v8.5.2...v8.5.3
[8.5.2]: https://github.com/videojs/video.js/compare/v8.5.1...v8.5.2
[8.5.1]: https://github.com/videojs/video.js/compare/v8.5.0...v8.5.1
[8.5.0]: https://github.com/videojs/video.js/compare/v8.4.2...v8.5.0
[8.4.2]: https://github.com/videojs/video.js/compare/v8.4.1...v8.4.2
[8.4.1]: https://github.com/videojs/video.js/compare/v8.4.0...v8.4.1
[8.4.0]: https://github.com/videojs/video.js/compare/v8.3.0...v8.4.0
[8.3.0]: https://github.com/videojs/video.js/compare/v8.2.1...v8.3.0
[8.2.1]: https://github.com/videojs/video.js/compare/v8.2.0...v8.2.1
[8.2.0]: https://github.com/videojs/video.js/compare/v8.1.1...v8.2.0
[8.1.1]: https://github.com/videojs/video.js/compare/v8.1.0...v8.1.1
[8.1.0]: https://github.com/videojs/video.js/compare/v8.0.4...v8.1.0
[8.0.4]: https://github.com/videojs/video.js/compare/v8.0.3...v8.0.4
[8.0.3]: https://github.com/videojs/video.js/compare/v8.0.2...v8.0.3
[8.0.2]: https://github.com/videojs/video.js/compare/v8.0.1...v8.0.2
[8.0.1]: https://github.com/videojs/video.js/compare/v8.0.0...v8.0.1
[8.0.0]: https://github.com/videojs/video.js/compare/v7.21.1...v8.0.0
[7.21.1]: https://github.com/videojs/video.js/compare/v7.21.0...v7.21.1
[7.21.0]: https://github.com/videojs/video.js/compare/v7.20.3...v7.21.0
[7.20.3]: https://github.com/videojs/video.js/compare/v7.20.2...v7.20.3
[7.20.2]: https://github.com/videojs/video.js/compare/v7.20.1...v7.20.2
[7.20.1]: https://github.com/videojs/video.js/compare/v7.20.0...v7.20.1
[7.20.0]: https://github.com/videojs/video.js/compare/v7.19.2...v7.20.0
[7.19.2]: https://github.com/videojs/video.js/compare/v7.19.1...v7.19.2
[7.19.1]: https://github.com/videojs/video.js/compare/v7.19.0...v7.19.1
[7.19.0]: https://github.com/videojs/video.js/compare/v7.18.1...v7.19.0
[7.18.1]: https://github.com/videojs/video.js/compare/v7.18.0...v7.18.1
[7.18.0]: https://github.com/videojs/video.js/compare/v7.17.3...v7.18.0
[7.17.3]: https://github.com/videojs/video.js/compare/v7.17.2...v7.17.3
[7.17.2]: https://github.com/videojs/video.js/compare/v7.17.1...v7.17.2
[7.17.1]: https://github.com/videojs/video.js/compare/v7.17.0...v7.17.1
[7.17.0]: https://github.com/videojs/video.js/compare/v7.16.0...v7.17.0
[7.16.0]: https://github.com/videojs/video.js/compare/v7.15.7...v7.16.0
[7.15.7]: https://github.com/videojs/video.js/compare/v7.15.6...v7.15.7
[7.15.6]: https://github.com/videojs/video.js/compare/v7.15.5...v7.15.6
[7.15.5]: https://github.com/videojs/video.js/compare/v7.15.4...v7.15.5
[7.15.4]: https://github.com/videojs/video.js/compare/v7.15.3...v7.15.4
[7.15.3]: https://github.com/videojs/video.js/compare/v7.15.2...v7.15.3
[7.15.2]: https://github.com/videojs/video.js/compare/v7.15.1...v7.15.2
[7.15.1]: https://github.com/videojs/video.js/compare/v7.15.0...v7.15.1
[7.15.0]: https://github.com/videojs/video.js/compare/v7.14.3...v7.15.0
[7.14.3]: https://github.com/videojs/video.js/compare/v7.14.2...v7.14.3
[7.14.2]: https://github.com/videojs/video.js/compare/v7.14.1...v7.14.2
[7.14.1]: https://github.com/videojs/video.js/compare/v7.14.0...v7.14.1
[7.14.0]: https://github.com/videojs/video.js/compare/v7.13.4...v7.14.0
[7.13.4]: https://github.com/videojs/video.js/compare/v7.13.3...v7.13.4
[7.13.3]: https://github.com/videojs/video.js/compare/v7.13.2...v7.13.3
[7.13.2]: https://github.com/videojs/video.js/compare/v7.13.1...v7.13.2
[7.13.1]: https://github.com/videojs/video.js/compare/v7.13.0...v7.13.1
[7.13.0]: https://github.com/videojs/video.js/compare/v7.12.4...v7.13.0
[7.12.4]: https://github.com/videojs/video.js/compare/v7.12.3...v7.12.4
[7.12.3]: https://github.com/videojs/video.js/compare/v7.12.2...v7.12.3
[7.12.2]: https://github.com/videojs/video.js/compare/v7.12.1...v7.12.2
[7.12.1]: https://github.com/videojs/video.js/compare/v7.12.0...v7.12.1
[7.12.0]: https://github.com/videojs/video.js/compare/v7.11.8...v7.12.0
[7.11.8]: https://github.com/videojs/video.js/compare/v7.11.7...v7.11.8
[7.11.7]: https://github.com/videojs/video.js/compare/v7.11.6...v7.11.7
[7.11.6]: https://github.com/videojs/video.js/compare/v7.11.5...v7.11.6
[7.11.5]: https://github.com/videojs/video.js/compare/v7.11.4...v7.11.5
[7.11.4]: https://github.com/videojs/video.js/compare/v7.11.3...v7.11.4
[7.11.3]: https://github.com/videojs/video.js/compare/v7.11.2...v7.11.3
[7.11.2]: https://github.com/videojs/video.js/compare/v7.11.1...v7.11.2
[7.11.1]: https://github.com/videojs/video.js/compare/v7.11.0...v7.11.1
[7.11.0]: https://github.com/videojs/video.js/compare/v7.10.2...v7.11.0
[7.10.2]: https://github.com/videojs/video.js/compare/v7.10.1...v7.10.2
[7.10.1]: https://github.com/videojs/video.js/compare/v7.10.0...v7.10.1
[7.10.0]: https://github.com/videojs/video.js/compare/v7.9.7...v7.10.0
[7.9.7]: https://github.com/videojs/video.js/compare/v7.9.6...v7.9.7
[7.9.6]: https://github.com/videojs/video.js/compare/v7.9.5...v7.9.6
[7.9.5]: https://github.com/videojs/video.js/compare/v7.9.4...v7.9.5
[7.9.4]: https://github.com/videojs/video.js/compare/v7.9.3...v7.9.4
[7.9.3]: https://github.com/videojs/video.js/compare/v7.9.2...v7.9.3
[7.9.2]: https://github.com/videojs/video.js/compare/v7.9.1...v7.9.2
[7.9.1]: https://github.com/videojs/video.js/compare/v7.9.0...v7.9.1
[7.9.0]: https://github.com/videojs/video.js/compare/v7.8.1...v7.9.0
[7.8.1]: https://github.com/videojs/video.js/compare/v7.8.0...v7.8.1
[7.8.0]: https://github.com/videojs/video.js/compare/v7.7.6...v7.8.0
[7.7.6]: https://github.com/videojs/video.js/compare/v7.7.5...v7.7.6
[7.7.5]: https://github.com/videojs/video.js/compare/v7.7.4...v7.7.5
[7.7.4]: https://github.com/videojs/video.js/compare/v7.7.3...v7.7.4
[7.7.3]: https://github.com/videojs/video.js/compare/v7.7.2...v7.7.3
[7.7.2]: https://github.com/videojs/video.js/compare/v7.7.1...v7.7.2
[7.7.1]: https://github.com/videojs/video.js/compare/v7.7.0...v7.7.1
[7.7.0]: https://github.com/videojs/video.js/compare/v7.6.4...v7.7.0
[7.6.6]: https://github.com/videojs/video.js/compare/v7.6.5...v7.6.6
[7.6.5]: https://github.com/videojs/video.js/compare/v7.6.4...v7.6.5
[7.6.4]: https://github.com/videojs/video.js/compare/v7.6.3...v7.6.4
[7.6.3]: https://github.com/videojs/video.js/compare/v7.6.2...v7.6.3
[7.6.2]: https://github.com/videojs/video.js/compare/v7.6.1...v7.6.2
[7.6.1]: https://github.com/videojs/video.js/compare/v7.6.0...v7.6.1
[7.6.0]: https://github.com/videojs/video.js/compare/v7.5.4...v7.6.0
[7.5.6]: https://github.com/videojs/video.js/compare/v7.5.5...v7.5.6
[7.5.5]: https://github.com/videojs/video.js/compare/v7.5.4...v7.5.5
[7.5.4]: https://github.com/videojs/video.js/compare/v7.5.3...v7.5.4
[7.5.3]: https://github.com/videojs/video.js/compare/v7.5.2...v7.5.3
[7.5.2]: https://github.com/videojs/video.js/compare/v7.5.1...v7.5.2
[7.5.1]: https://github.com/videojs/video.js/compare/v7.5.0...v7.5.1
[7.5.0]: https://github.com/videojs/video.js/compare/v7.4.1...v7.5.0
[7.4.1]: https://github.com/videojs/video.js/compare/v7.4.0...v7.4.1
[7.4.0]: https://github.com/videojs/video.js/compare/v7.3.0...v7.4.0
[7.3.0]: https://github.com/videojs/video.js/compare/v7.2.4...v7.3.0
[7.2.4]: https://github.com/videojs/video.js/compare/v7.2.3...v7.2.4
[7.2.3]: https://github.com/videojs/video.js/compare/v7.2.2...v7.2.3
[7.2.2]: https://github.com/videojs/video.js/compare/v7.2.1...v7.2.2
[7.2.1]: https://github.com/videojs/video.js/compare/v7.2.0...v7.2.1
[7.2.0]: https://github.com/videojs/video.js/compare/v7.1.0...v7.2.0
[7.1.0]: https://github.com/videojs/video.js/compare/v7.0.5...v7.1.0
[7.0.5]: https://github.com/videojs/video.js/compare/v7.0.4...v7.0.5
[7.0.4]: https://github.com/videojs/video.js/compare/v7.0.3...v7.0.4
[7.0.3]: https://github.com/videojs/video.js/compare/v7.0.2...v7.0.3
[7.0.2]: https://github.com/videojs/video.js/compare/v7.0.1...v7.0.2
[7.0.1]: https://github.com/videojs/video.js/compare/v7.0.0...v7.0.1
[7.0.0]: https://github.com/videojs/video.js/compare/v6.8.0...v7.0.0
[6.10.0]: https://github.com/videojs/video.js/compare/v6.9.0...v6.10.0
[6.9.0]: https://github.com/videojs/video.js/compare/v6.8.0...v6.9.0
[6.8.0]: https://github.com/videojs/video.js/compare/v6.7.4...v6.8.0
[6.7.4]: https://github.com/videojs/video.js/compare/v6.7.3...v6.7.4
[6.7.3]: https://github.com/videojs/video.js/compare/v6.7.2...v6.7.3
[6.7.2]: https://github.com/videojs/video.js/compare/v6.7.1...v6.7.2
[6.7.1]: https://github.com/videojs/video.js/compare/v6.7.0...v6.7.1
[6.7.0]: https://github.com/videojs/video.js/compare/v6.6.3...v6.7.0
[6.6.3]: https://github.com/videojs/video.js/compare/v6.6.2...v6.6.3
[6.6.2]: https://github.com/videojs/video.js/compare/v6.6.1...v6.6.2
[6.6.1]: https://github.com/videojs/video.js/compare/v6.6.0...v6.6.1
[6.6.0]: https://github.com/videojs/video.js/compare/v6.5.2...v6.6.0
[6.5.2]: https://github.com/videojs/video.js/compare/v6.5.1...v6.5.2
[6.5.1]: https://github.com/videojs/video.js/compare/v6.5.0...v6.5.1
[6.5.0]: https://github.com/videojs/video.js/compare/v6.4.0...v6.5.0
[6.4.0]: https://github.com/videojs/video.js/compare/v6.3.3...v6.4.0
[6.3.3]: https://github.com/videojs/video.js/compare/v6.3.2...v6.3.3
[6.3.2]: https://github.com/videojs/video.js/compare/v6.3.1...v6.3.2
[6.3.1]: https://github.com/videojs/video.js/compare/v6.3.0...v6.3.1
[6.3.0]: https://github.com/videojs/video.js/compare/v6.2.8...v6.3.0
[6.2.8]: https://github.com/videojs/video.js/compare/v6.2.7...v6.2.8
[6.2.7]: https://github.com/videojs/video.js/compare/v6.2.6...v6.2.7
[6.2.6]: https://github.com/videojs/video.js/compare/v6.2.5...v6.2.6
[6.2.5]: https://github.com/videojs/video.js/compare/v6.2.4...v6.2.5
[6.2.4]: https://github.com/videojs/video.js/compare/v6.2.3...v6.2.4
[6.2.3]: https://github.com/videojs/video.js/compare/v6.2.2...v6.2.3
[6.2.2]: https://github.com/videojs/video.js/compare/v6.2.1...v6.2.2
[6.2.1]: https://github.com/videojs/video.js/compare/v6.2.0...v6.2.1
[6.2.0]: https://github.com/videojs/video.js/compare/v6.1.0...v6.2.0
[6.1.0]: https://github.com/videojs/video.js/compare/v6.0.1...v6.1.0
[6.0.1]: https://github.com/videojs/video.js/compare/v6.0.0...v6.0.1
[6.0.0]: https://github.com/videojs/video.js/compare/v5.16.0...v6.0.0
[5.19.1]: https://github.com/videojs/video.js/compare/v5.19.0...v5.19.1
[5.19.0]: https://github.com/videojs/video.js/compare/v5.18.4...v5.19.0
[5.18.4]: https://github.com/videojs/video.js/compare/v5.18.3...v5.18.4
[5.18.3]: https://github.com/videojs/video.js/compare/v5.18.2...v5.18.3
[5.18.1]: https://github.com/videojs/video.js/compare/v5.18.0...v5.18.1
[5.18.0]: https://github.com/videojs/video.js/compare/v5.17.0...v5.18.0
[5.17.0]: https://github.com/videojs/video.js/compare/v5.16.0...v5.17.0
[5.16.0]: https://github.com/videojs/video.js/compare/v5.15.1...v5.16.0
[5.15.1]: https://github.com/videojs/video.js/compare/v5.15.0...v5.15.1
[5.15.0]: https://github.com/videojs/video.js/compare/v5.14.1...v5.15.0
[5.14.1]: https://github.com/videojs/video.js/compare/v5.14.0...v5.14.1
[5.14.0]: https://github.com/videojs/video.js/compare/v5.13.2...v5.14.0
[5.13.2]: https://github.com/videojs/video.js/compare/v5.13.1...v5.13.2
[5.13.1]: https://github.com/videojs/video.js/compare/v5.12.6...v5.13.1
[5.13.0]: https://github.com/videojs/video.js/compare/v5.12.0...v5.13.0
[5.12.6]: https://github.com/videojs/video.js/compare/v5.12.5...v5.12.6
[5.12.5]: https://github.com/videojs/video.js/compare/v5.12.4...v5.12.5
[5.12.4]: https://github.com/videojs/video.js/compare/v5.12.3...v5.12.4
[5.12.3]: https://github.com/videojs/video.js/compare/v5.12.2...v5.12.3
[5.12.2]: https://github.com/videojs/video.js/compare/v5.12.1...v5.12.2
[5.12.1]: https://github.com/videojs/video.js/compare/v5.13.0...v5.12.1
[5.12.0]: https://github.com/videojs/video.js/compare/v5.11.9...v5.12.0
[5.11.9]: https://github.com/videojs/video.js/compare/v5.11.8...v5.11.9
[5.11.8]: https://github.com/videojs/video.js/compare/v5.11.7...v5.11.8
[5.11.7]: https://github.com/videojs/video.js/compare/v5.11.6...v5.11.7
[5.11.6]: https://github.com/videojs/video.js/compare/v5.11.5...v5.11.6
[5.11.5]: https://github.com/videojs/video.js/compare/v5.11.4...v5.11.5
[5.11.4]: https://github.com/videojs/video.js/compare/v5.11.3...v5.11.4
[5.11.3]: https://github.com/videojs/video.js/compare/v5.11.2...v5.11.3
[5.11.2]: https://github.com/videojs/video.js/compare/v5.11.1...v5.11.2
[5.11.1]: https://github.com/videojs/video.js/compare/v5.11.0...v5.11.1
[5.11.0]: https://github.com/videojs/video.js/compare/v5.10.8...v5.11.0
[5.10.8]: https://github.com/videojs/video.js/compare/v5.10.7...v5.10.8
[5.10.7]: https://github.com/videojs/video.js/compare/v5.10.6...v5.10.7
[5.10.6]: https://github.com/videojs/video.js/compare/v5.10.5...v5.10.6
[5.10.5]: https://github.com/videojs/video.js/compare/v5.10.4...v5.10.5
[5.10.4]: https://github.com/videojs/video.js/compare/v5.10.3...v5.10.4
[5.10.3]: https://github.com/videojs/video.js/compare/v5.10.2...v5.10.3
[5.10.2]: https://github.com/videojs/video.js/compare/v5.10.1...v5.10.2
[5.10.1]: https://github.com/videojs/video.js/compare/v5.9.2...v5.10.1
[5.9.2]: https://github.com/videojs/video.js/compare/v5.9.1...v5.9.2
[5.9.1]: https://github.com/videojs/video.js/compare/v5.9.0...v5.9.1
[5.9.0]: https://github.com/videojs/video.js/compare/v5.8.8...v5.9.0
[5.8.8]: https://github.com/videojs/video.js/compare/v5.8.7...v5.8.8
[5.8.7]: https://github.com/videojs/video.js/compare/v5.8.6...v5.8.7
[5.8.6]: https://github.com/videojs/video.js/compare/v5.8.5...v5.8.6
[5.8.5]: https://github.com/videojs/video.js/compare/v5.8.4...v5.8.5
[5.8.4]: https://github.com/videojs/video.js/compare/v5.8.3...v5.8.4
[5.8.3]: https://github.com/videojs/video.js/compare/v5.8.2...v5.8.3
[5.8.2]: https://github.com/videojs/video.js/compare/v5.8.1...v5.8.2
[5.8.1]: https://github.com/videojs/video.js/compare/v5.8.0...v5.8.1
[5.8.0]: https://github.com/videojs/video.js/compare/v5.7.1...v5.8.0
[5.7.1]: https://github.com/videojs/video.js/compare/v5.7.0...v5.7.1
[5.7.0]: https://github.com/videojs/video.js/compare/v5.6.0...v5.7.0
[5.6.0]: https://github.com/videojs/video.js/compare/v5.5.3...v5.6.0
[5.5.3]: https://github.com/videojs/video.js/compare/v5.5.2...v5.5.3
[5.5.2]: https://github.com/videojs/video.js/compare/v5.5.1...v5.5.2
[5.5.1]: https://github.com/videojs/video.js/compare/v5.5.0...v5.5.1
[5.5.0]: https://github.com/videojs/video.js/compare/v5.4.6...v5.5.0
[5.4.6]: https://github.com/videojs/video.js/compare/v5.4.5...v5.4.6
[5.4.5]: https://github.com/videojs/video.js/compare/v5.4.4...v5.4.5
[5.4.4]: https://github.com/videojs/video.js/compare/v5.4.3...v5.4.4
[5.4.3]: https://github.com/videojs/video.js/compare/v5.4.2...v5.4.3
[5.4.2]: https://github.com/videojs/video.js/compare/v5.4.1...v5.4.2
[5.4.1]: https://github.com/videojs/video.js/compare/v5.3.0...v5.4.1
[5.3.0]: https://github.com/videojs/video.js/compare/v5.2.4...v5.3.0
[5.2.4]: https://github.com/videojs/video.js/compare/v5.2.3...v5.2.4
[5.2.3]: https://github.com/videojs/video.js/compare/v5.2.2...v5.2.3
[5.2.2]: https://github.com/videojs/video.js/compare/v5.2.1...v5.2.2
[5.2.1]: https://github.com/videojs/video.js/compare/v5.2.0...v5.2.1
[5.2.0]: https://github.com/videojs/video.js/compare/v5.1.0...v5.2.0
[5.1.0]: https://github.com/videojs/video.js/compare/v5.0.2...v5.1.0
[5.0.2]: https://github.com/videojs/video.js/compare/v5.0.0...v5.0.2
[5.0.0]: https://github.com/videojs/video.js/compare/v4.12.15...v5.0.0
[4.12.15]: https://github.com/videojs/video.js/compare/v4.12.14...v4.12.15
[4.12.14]: https://github.com/videojs/video.js/compare/v4.12.13...v4.12.14
[4.12.13]: https://github.com/videojs/video.js/compare/v4.12.12...v4.12.13
[4.12.12]: https://github.com/videojs/video.js/compare/v4.12.11...v4.12.12
[4.12.11]: https://github.com/videojs/video.js/compare/v4.12.10...v4.12.11
[4.12.10]: https://github.com/videojs/video.js/compare/v4.12.9...v4.12.10
[4.12.9]: https://github.com/videojs/video.js/compare/v4.12.8...v4.12.9
[4.12.8]: https://github.com/videojs/video.js/compare/v4.12.7...v4.12.8
[4.12.7]: https://github.com/videojs/video.js/compare/v4.12.6...v4.12.7
[4.12.6]: https://github.com/videojs/video.js/compare/v4.12.5...v4.12.6
[4.12.5]: https://github.com/videojs/video.js/compare/v4.12.4...v4.12.5
[4.12.4]: https://github.com/videojs/video.js/compare/v4.12.3...v4.12.4
[4.12.3]: https://github.com/videojs/video.js/compare/v4.12.2...v4.12.3
[4.12.2]: https://github.com/videojs/video.js/compare/v4.12.1...v4.12.2
[4.12.1]: https://github.com/videojs/video.js/compare/v4.12.0...v4.12.1
[4.12.0]: https://github.com/videojs/video.js/compare/v4.11.4...v4.12.0
[4.11.4]: https://github.com/videojs/video.js/compare/v4.11.3...v4.11.4
[4.11.3]: https://github.com/videojs/video.js/compare/v4.11.2...v4.11.3
[4.11.2]: https://github.com/videojs/video.js/compare/v4.11.1...v4.11.2
[4.11.1]: https://github.com/videojs/video.js/compare/v4.11.0...v4.11.1
[4.11.0]: https://github.com/videojs/video.js/compare/v4.10.2...v4.11.0
[4.10.2]: https://github.com/videojs/video.js/compare/v4.10.1...v4.10.2
[4.10.1]: https://github.com/videojs/video.js/compare/v4.10.0...v4.10.1
[4.10.0]: https://github.com/videojs/video.js/compare/v4.9.1...v4.10.0
[4.9.1]: https://github.com/videojs/video.js/compare/v4.9.0...v4.9.1
[4.9.0]: https://github.com/videojs/video.js/compare/v4.8.5...v4.9.0
[4.8.5]: https://github.com/videojs/video.js/compare/v4.8.4...v4.8.5
[4.8.4]: https://github.com/videojs/video.js/compare/v4.8.3...v4.8.4
[4.8.3]: https://github.com/videojs/video.js/compare/v4.8.2...v4.8.3
[4.8.2]: https://github.com/videojs/video.js/compare/v4.8.1...v4.8.2
[4.8.1]: https://github.com/videojs/video.js/compare/v4.8.0...v4.8.1
[4.8.0]: https://github.com/videojs/video.js/compare/v4.7.3...v4.8.0
[4.7.3]: https://github.com/videojs/video.js/compare/v4.7.2...v4.7.3
[4.7.2]: https://github.com/videojs/video.js/compare/v4.7.1...v4.7.2
[4.7.1]: https://github.com/videojs/video.js/compare/v4.7.0...v4.7.1
[4.7.0]: https://github.com/videojs/video.js/compare/v4.6.4...v4.7.0
[4.6.4]: https://github.com/videojs/video.js/compare/v4.6.3...v4.6.4
[4.6.3]: https://github.com/videojs/video.js/compare/v4.6.2...v4.6.3
[4.6.2]: https://github.com/videojs/video.js/compare/v4.6.1...v4.6.2
[4.6.1]: https://github.com/videojs/video.js/compare/v4.6.0...v4.6.1
[4.6.0]: https://github.com/videojs/video.js/compare/v4.5.2...v4.6.0
[4.5.2]: https://github.com/videojs/video.js/compare/v4.5.1...v4.5.2
[4.5.1]: https://github.com/videojs/video.js/compare/v4.5.0...v4.5.1
[4.5.0]: https://github.com/videojs/video.js/compare/v4.4.3...v4.5.0
[4.4.3]: https://github.com/videojs/video.js/compare/v4.4.2...v4.4.3
[4.4.2]: https://github.com/videojs/video.js/compare/v4.4.1...v4.4.2
[4.4.1]: https://github.com/videojs/video.js/compare/v4.4.0...v4.4.1
[4.4.0]: https://github.com/videojs/video.js/compare/v4.3.0...v4.4.0
[4.3.0]: https://github.com/videojs/video.js/compare/v4.2.2...v4.3.0
[4.2.2]: https://github.com/videojs/video.js/compare/v4.2.1...v4.2.2
[4.2.1]: https://github.com/videojs/video.js/compare/v4.2.0...v4.2.1
[4.2.0]: https://github.com/videojs/video.js/compare/v4.1.0...v4.2.0
[4.1.0]: https://github.com/videojs/video.js/compare/v4.0.4...v4.1.0
[4.0.4]: https://github.com/videojs/video.js/compare/v4.0.3...v4.0.4
[4.0.3]: https://github.com/videojs/video.js/compare/v4.0.2...v4.0.3
[4.0.2]: https://github.com/videojs/video.js/compare/v4.0.1...v4.0.2
[4.0.1]: https://github.com/videojs/video.js/tree/v4.0.1
[2.0.3]: https://github.com/videojs/video.js/tree/v2.0.3

<!-- generated by git-cliff -->
