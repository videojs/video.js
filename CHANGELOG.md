# Changelog

All notable changes to this project will be documented in this file.

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

### 📚 Documentation
- *(site)* Add changelog prose for 10.0.0-rc.4 ([#2988](https://github.com/videojs/v10/pull/2988)) by [@github-actions[bot]](https://github.com/github-actions[bot])
- *(site)* Add player store api overview page ([#3034](https://github.com/videojs/v10/pull/3034)) by [@luwes](https://github.com/luwes)
- *(site)* Improve migration accuracy and agent guidance ([#3074](https://github.com/videojs/v10/pull/3074)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Improve playback guides and examples ([#3075](https://github.com/videojs/v10/pull/3075)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Correct stale playback and package guidance ([#3076](https://github.com/videojs/v10/pull/3076)) by [@mihar-22](https://github.com/mihar-22)
- *(site)* Add the vidstack migration guide ([#3021](https://github.com/videojs/v10/pull/3021)) by [@mihar-22](https://github.com/mihar-22)

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

<!-- generated by git-cliff -->
