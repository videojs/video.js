CHANGELOG
=========

## HEAD (Unreleased)
_(none)_

--------------------

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
