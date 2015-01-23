CHANGELOG
=========

## HEAD (Unreleased)
_(none)_

--------------------

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
@heff removed his own stupid error ([view])(https://github.com/videojs/video.js/commit/a12dd770572a7f16e436e2332eba7ffbb1f1b9b9)

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
