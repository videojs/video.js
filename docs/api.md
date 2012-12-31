API
===
The Video.js API allows you to interact with the video through Javascript, whether the browser is playing the video through HTML5 video, Flash, or any other supported playback technologies.

Referencing the Player
----------------------
To use the API functions, you need access to the player object. Luckily this is easy to get. You just need to make sure your video tag has an ID. The example embed code has an ID of "example\_video_1". If you have multiple videos on one page, make sure every video tag has a unique ID.
```js
var myPlayer = _V_("example_video_1");
```

(If the player hasn't been initialized yet via the data-setup attribute or another method, this will also initialize the player.)

Wait Until the Player is Ready
------------------------------
The time it takes Video.js to set up the video and API will vary depending on the playback technology being used (HTML5 will often be much faster to load than Flash). For that reason we want to use the player's 'ready' function to trigger any code that requires the player's API.
```javascript
_V_("example_video_1").ready(function(){

  var myPlayer = this;

  // EXAMPLE: Start playing the video.
  myPlayer.play();

});
```

API Methods
-----------
Now that you have access to a ready player, you can control the video, get values, or respond to video events using the following functions. The Video.js API function names follow the [HTML5 media API](http://www.w3.org/TR/html5/video.html). The main difference is that attributes which you would get or set on a video element using the equals sign ( `myVideoElement.currentTime = "120";` ), you would use a function argument syntax for Video.js ( `myPlayer.currentTime(120);` )

### play() ###
Start video playback. Returns the player object.
```js
myPlayer.play();
```


### pause() ###
Pause the video playback. Returns the player object
```js
myPlayer.pause();
```


### paused() ###
Returns false if the video is currently playing, or true otherwise. ()
```js
var isPaused = myPlayer.paused();
var isPlaying = !myPlayer.paused();
```


### src(newSource) ###
The source function updates the video source. There are three types of variables you can pass as the argument.

**URL String**: A URL to the the video file. Use this method if you're sure the current playback technology (HTML5/Flash) can support the source you provide. Currently only MP4 files can be used in both HTML5 and Flash.
```js
myPlayer.src("http://www.example.com/path/to/video.mp4");
```

**Source Object (or element):** A javascript object containing information about the source file. Use this method if you want the player to determine if it can support the file using the type information.
```js
myPlayer.src({ type: "video/mp4", src: "http://www.example.com/path/to/video.mp4" });
```

**Array of Source Objects:** To provide multiple versions of the source so that it can be played using HTML5 across browsers you can use an array of source objects. Video.js will detect which version is supported and load that file.
```js
myPlayer.src([
  { type: "video/mp4", src: "http://www.example.com/path/to/video.mp4" },
  { type: "video/webm", src: "http://www.example.com/path/to/video.webm" },
  { type: "video/ogg", src: "http://www.example.com/path/to/video.ogv" }
]);
```

Returns the player object.


### currentTime() ###
Returns the current time of the video in seconds.
```js
var whereYouAt = myPlayer.currentTime();
```


### currentTime(seconds) // Type: Integer or Float ###
Seek to the supplied time (seconds). Returns the player object.
```js
myPlayer.currentTime(120); // 2 minutes into the video
```


### duration() ###
Returns the length in time of the video in seconds. NOTE: The video must have started loading before the duration can be known, and in the case of Flash, may not be known until the video starts playing.
```js
var howLongIsThis = myPlayer.duration();
```


### buffered() ###
Returns a [TimeRange](glossary.md#timerange) object with sections of the video that have been downloaded. If you just want the percent of the video that's been downloaded, use bufferedPercent.
```js
var bufferedTimeRange = myPlayer.buffered(),

// Number of different ranges of time have been buffered. Usually 1.
numberOfRanges = bufferedTimeRange.length,

// Time in seconds when the first range starts. Usually 0.
firstRangeStart = bufferedTimeRange.start(0),

// Time in seconds when the first range ends
firstRangeEnd = bufferedTimeRange.end(0),

// Length in seconds of the first time range
firstRangeLength = firstRangeEnd - firstRangeStart;
```


### bufferedPercent() ###
Returns the percent (as a decimal) of the video that's been downloaded. 0 means none, 1 means all.
```js
var howMuchIsDownloaded = myPlayer.bufferedPercent();
```


### volume() ###
Returns the current volume of the video as a percent in decimal form. 0 is off (muted), 1.0 is all the way up, 0.5 is half way.
```js
var howLoudIsIt = myPlayer.volume();
```


### volume(percentAsDecimal) ###
Set the volume to the supplied percent (as a decimal between 0 and 1).
```js
myPlayer.volume(0.5); // Set volume to half
```


### width() ###
Returns the current width of the video in pixels.
```js
var howWideIsIt = myPlayer.width();
```


### width(pixels) ###
Change the width of the video to the supplied width in pixels. Returns the player object
```js
myPlayer.width(640);
```


### height() ###
Returns the current height of the video in pixels.
```js
var howTallIsIt = myPlayer.height();
```


### height(pixels) ###
Change the height of the video to the supplied height in pixels. Returns the player object
```js
myPlayer.height(480);
```


### size(width, height) ###
Changes the width and height of the video to the supplied width and height. This is more efficient if you're changing both width and height (only triggers the player's resize event once). Returns the player object.
```js
myPlayer.size(640,480);
```


### requestFullScreen() ###
Increase the size of the video to full screen. In some browsers, full screen is not supported natively, so it enters full window mode, where the video fills the browser window. In browsers and devices that support native full screen, sometimes the browser's default controls will be shown, and not the Video.js custom skin. This includes most mobile devices (iOS, Android) and older versions of Safari. Returns the player object.
```js
myPlayer.requestFullScreen();
```


### cancelFullScreen() ###
Return the video to its normal size after having been in full screen mode. Returns the player object.
```js
myPlayer.cancelFullScreen();
```


Events
------
You can attach event listeners to the player similarly to how you would for a video element.

```js
var myFunc = function(){
  var myPlayer = this;
  // Do something when the event is fired
};
myPlayer.addEvent("eventName", myFunc);
```

You can also remove the listeners later.
```js
myPlayer.removeEvent("eventName", myFunc);
```


### Event Types
List of player events you can add listeners for.

<table border="0" cellspacing="5" cellpadding="5">
  <tr><th>Name</th><th>Description</th></tr>
  <tr><td>loadstart</td><td>Fired when the user agent begins looking for media data.</td></tr>
  <tr><td>loadedmetadata</td><td>Fired when the player has initial duration and dimension information.</td></tr>
  <tr><td>loadeddata</td><td>Fired when the player has downloaded data at the current playback position.</td></tr>
  <tr><td>loadedalldata</td><td>Fired when the player has finished downloading the source data.</td></tr>
  <tr><td>play</td><td>Fired whenever the media begins or resumes playback.</td></tr>
  <tr><td>pause</td><td>Fired whenever the media has been paused.</td></tr>
  <tr><td>timeupdate</td><td>Fired when the current playback position has changed. During playback this is fired every 15-250 milliseconds, depnding on the playback technology in use.</td></tr>
  <tr><td>ended</td><td>Fired when the end of the media resource is reached. currentTime == duration</td></tr>
  <tr><td>durationchange</td><td>Fired when the duration of the media resource is changed, or known for the first time.</td></tr>
  <tr><td>progress</td><td>Fired while the user agent is downloading media data.</td></tr>
  <tr><td>resize</td><td>Fired when the width and/or height of the video window changes.</td></tr>
  <tr><td>volumechange</td><td>Fired when the volume changes.</td></tr>
  <tr><td>error</td><td>Fired when there is an error in playback.</td></tr>
  <tr><td>fullscreenchange</td><td>Fired when the player switches in or out of fullscreen mode.</td></tr>
</table>
