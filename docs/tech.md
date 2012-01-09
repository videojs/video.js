---
layout: docs
title: Playback Technology
description: Video.js Playback Technology
body_id: tech
body_class: docs subpage
---

Playback Technology ("Tech")
============================
Playback Technology refers to the specific browser or plugin technology used to play the video or audio. When using HTML5, the playback technology is the video or audio element. When using Flash, the playback technology is the specific Flash player used, e.g. Flowplayer, YouTube Player, video-js.swf, etc. (not just "Flash"). This could also include Silverlight, Quicktime, or any other plugin that will play back video in the browser, as long as there is an API wrapper written for it. 

Essentially we're using HTML5 and plugins only as video decoders, and using HTML and JavaScript to create a consistent API and skinning experience across all of them.

Building an API Wrapper
-----------------------
We'll write a more complete guide on writing a wrapper soon, but for now the best resource is the [Video.js](https://github.com/zencoder/video-js/tree/master/src) source where you can see how both the HTML5 and video-js.swf API wrappers were created.

Required Methods
----------------
canPlayType
play
pause
currentTime
volume
duration
buffered
supportsFullScreen

Required Events
---------------
loadstart
play
pause
playing
ended
volumechange
durationchange
error

Optional Events (include if supported)
--------------------------------------
timeupdate
progress
enterFullScreen
exitFullScreen
