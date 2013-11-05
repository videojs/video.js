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

Adding Playback Technology
==================
When adding additional Tech to a video player, make sure to add the supported tech to the video object.

### Tag Method: ###
    <video data-setup='{"techOrder": ["html5", "flash", "other supported tech"]}'

### Object Method: ###
    videojs("videoID", {
      techOrder: ["html5", "flash", "other supported tech"]
    });

Flash Technology
==================
The Flash playback tech is a part of the default `techOrder`. You may notice undesirable playback behavior in browsers that are subject to using this playback tech, in particular when scrubbing and seeking within a video. This behavior is a result of Flash's progressive video playback.

Enabling Streaming Playback
--------------------------------
In order to force the Flash tech to choose streaming playback, you need to provide a valid streaming source **before other valid Flash video sources**. This is necessary because of the source selection algorithm, where playback tech chooses the first possible source object with a valid type. Valid streaming `type` values include `rtmp/mp4` and `rtmp/flv`. The streaming `src` value requires valid connection and stream strings, separated by an `&`. An example of supplying a streaming source through your HTML markup might look like:

    <source src="rtmp://your.streaming.provider.net/cfx/st/&mp4:path/to/video.mp4" type="rtmp/mp4">
    <source src="http://your.static.provider.net/path/to/video.mp4" type="video/mp4">
    <source src="http://your.static.provider.net/path/to/video.webm" type="video/webm">

You may optionally use the last `/` as the separator between connection and stream strings, for example:

    <source src="rtmp://your.streaming.provider.net/cfx/st/mp4:video.mp4" type="rtmp/mp4">

All four RTMP protocols are valid in the `src` (RTMP, RTMPT, RTMPE, and RTMPS).
