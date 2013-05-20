* Added a plugins interface
* Added automated test suite and support for Travis CI.
* Updated docs to use Github markdown
* Allow disabling of default components
* Duration is now setable (need ed for HLS m3u8 files)
* Event binders (on/off/one) now return the player instance
* Stopped player from going back to beginningg on ended event.
* Added support for percent width/height and fluid layouts
* Improved load order of elements to reduce reflow.
* Changed addEvent function name to 'on'. 
* Removed conflicting array.indexOf function
* Added exitFullScreen to support BlackBerry devices (pull/143)
--------------------------------------------------------------------------------
                          ^ ADD NEW CHANGES ABOVE ^
--------------------------------------------------------------------------------

CHANGELOG
=========

---- 3.0.3 / 2012-01-12 / doc-change -------------------------------------------
* Added line to docs to test zenflow

---- 3.0.4 / 2012-01-12 / undefined-source-fix ---------------------------------
* Fixing an undefined source when no sources exist on load

---- 3.0.5 / 2012-01-12 / event-layer-x-deprecation-fix ------------------------
* Removed deprecated event.layerX and layerY

---- 3.0.6 / 2012-01-12 / docs-url-fix -----------------------------------------
* Fixed wrong URL for CDN in docs

---- 3.0.7 / 2012-01-12 / fixing-ie8-poster-bug --------------------------------
* Fixed an ie8 breaking bug with the poster

---- 3.0.8 / 2012-01-23 / fix-ie-controls-hiding -------------------------------
* Fixed issue with controls not hiding in IE due to no opacity support

---- 3.1.0 / 2012-01-30 / leonardo ---------------------------------------------
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

---- 3.2.0 / 2012-03-20 / baxter -----------------------------------------------
* Updated docs with more options.
* Overhauled HTML5 Track support.
* Fixed Flash always autoplaying when setting source.
* Fixed localStorage context
* Updated 'fullscreenchange' event to be called even if the user presses escape to exit fullscreen.
* Automatically converting URsource URL to absolute for Flash fallback.
* Created new 'loadedalldata' event for when  the source is completely downloaded
* Improved player.destroy(). Now removes elements and references.
* Refactored API to be more immediately available.

---- 3.2.1 / 2012-04-06 / options-width-fix ------------------------------------
* Fixed setting width/height with javascript options

---- 3.2.2 / 2012-05-02 / multiple-control-fades-fix ---------------------------
* Fixed error with multiple controls fading listeners

---- 3.2.3 / 2012-11-12 / fix-chrome-seeking-spinner ---------------------------
* Fixed chrome spinner continuing on seek
