* Escaping special characters in source URL for Flash
* Added a check for if Firefox is enabled which fixes a Firefox 9 issue
* Stopped spinner from showing on 'stalled' events since browsers sometimes don't show that they've recovered.
* Fixed CDN Version which was breaking dev.html
* Made full-window mode more independent
* Added rakefile for release generation
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
