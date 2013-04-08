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
    _V_("videoID", {
      techOrder: ["html5", "flash", "other supported tech"]
    });

Youtube Technology
==================
To add a youtube source to your video tag, use the following source:

    <source src="http://www.youtube.com/watch?v=[ytVideoId]" type="video/youtube"

Important Note:
------------------
> You can simply copy and paste the url of the youtube page from the browser and
> the Youtube Tech will be able to find the video id by itself. This is just the
> minimum needed to get the video working. (Useful for data storage)


Youtube Technology - Extra Options
----------------------------------

In Addition to the natively supported options, the Youtube API supports the following
added options:

### ytcontrols ###
Type: Boolean (T/F)
Default: False

Determines whether to show Youtube's basic Red/Black default play bar skin or to hide
it and use the native video-js play bar.

### hd ###
Type: Boolean (T/F)
Default: False

Determines whether or not to play back the video in HD.
