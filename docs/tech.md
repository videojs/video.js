---
layout: docs
title: Playback Technology
description: Video.JS Playback Technology
body_id: docs
---

Playback Technology ("Tech")
============================
Playback Technology refers to the specific browser or plugin technology used to play the video or audio. When using HTML5, the playback technology is the video or audio element. When using Flash, the playback technology is the specific Flash player used, e.g. Flowplayer, YouTube Player, VideoJS.swf, etc. (not just "Flash").

With the VideoJS API you can control any type of browser-based video, as long as the playback technology in use has an API and a VideoJS API wrapper for it.


Including an API Wrapper
------------------------


Building an API Wrapper
-----------------------



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
