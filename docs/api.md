---
layout: docs
title: API
description: Video.JS API Docs
body_id: docs
---

API
===
The VideoJS API allows you to interact with the video through Javascript, whether the browser is playing the video through HTML5 video or any other supported playback technologies.

Referencing the Player
----------------------
To use the API functions, you need access to the player object. Luckily this is easy to get. You just need to make sure your video tag has an ID. The example embed code has an ID of "example_video_1". If you have multiple videos on one page, make sure every video tag has a unique ID (example_video_2, example_video_3, etc.).

{% highlight javascript %}

  var myPlayer = _V_("example_video_1");

{% endhighlight %}


Wait Until the Player is Ready
------------------------------
The time it takes VideoJS to set up the video and API will vary depending on the playback technology being used (HTML5 will often be much faster to load than Flash). For that reason we want to use the player's 'ready' function to trigger any code that requires the player's API.

{% highlight javascript %}

    _V_("example_video_1").ready(function(){

      var myPlayer = this;

      // EXAMPLE: Start playing the video.
      myPlayer.play();

    });

{% endhighlight %}

API Methods
-----------
Now that you have access to a ready player, you can control the video or react to video events using the following functions. The VideoJS API function names follow the HTML5 media API. The main difference is that attributes which you would get or set on a video element directly ( videoElement.currentTime = "120"; ), you would use a function argument syntax for VideoJS ( myPlayer.currentTime(120); )

### play()
  Start video playback.
  Returns the player object.
  Example:

    myPlayer.play();

### pause()
  Pause the video playback.
  Returns: the player object
  Example:

    myPlayer.pause();

### currentTime()
  Returns the current time of the video in seconds.
  Example:

    var whereYouAt = myPlayer.currentTime();

### currentTime(seconds) // Type: Integer or Float
  Seek to the supplied time (seconds).
  Returns the player object.
  Example:

    myPlayer.currentTime(120); // 2 minutes into the video


### duration()
  Returns the length in time of the video in seconds. NOTE: The video must have started loading before the duration can be known, and in the case of Flash, may not be known until the video starts playing.
  Example:

    var howLongIsThis = myPlayer.duration();

### buffered()
  Returns a [TimeRange](http://videojs.com/docs/glossary.html#timerange) with sections of the video that have been downloaded. If you just want the percent of the video that's been downloaded, use bufferedPercent.
  Example:

    var whatHasBeenBuffered = myPlayer.buffered();

### bufferedPercent()
  Returns the percent (as a decimal) of the video that's been downloaded.
  Example:

    var howMuchIsDownloaded = myPlayer.bufferedPercent();

### volume()
  Returns the current volume of the video as a percent in decimal form. 0 is off (muted), 1.0 is all the way up, 0.5 is half way.
  Example:

    var howLoudIsIt = myPlayer.volume();

### volume(percentAsDecimal)
  Set the volume to the supplied percent (as a decimal between 0 and 1).
  Example:

    myPlayer.volume(0.5); // Set volume to half

### width()
  Returns the current width of the video in pixels.
  Example:
  
    var howWideIsIt = myPlayer.width();

### width(pixels)
  Change the width of the video to the supplied width in pixels.
  Returns the player object
  Example:

    myPlayer.width(640);

### height()
  Returns the current height of the video in pixels.
  Example:

    var howTallIsIt = myPlayer.height();

### height(pixels)
  Change the height of the video to the supplied height in pixels.
  Returns the player object

    myPlayer.height(480);

### size(width, height)
  Changes the width and height of the video to the supplied width and height. This is more efficient if you're changing both width and height.
  Returns the player object.
  
    myPlayer.size(640,480);

### enterFullScreen()
  Increase the size of the video to full screen. In some browsers, full screen is not supported natively, so it enters full window mode, where the fills the browser window. In browsers that support native full screen, typically the browser's default controls will be shown, and not the VideoJS custom skin. In full window mode, the VideoJS controls and skin will always be used.
  Returns the player object.

    myPlayer.enterFullScreen();

### exitFullScreen()
  Return the video to its normal size after having been in full screen mode.
  Returns the player object.

    myPlayer.exitFullScreen();


Events
------
You can attach event listeners to the player similarly to how you would for a video element.

    var myFunc = function(){
      // Do something when the event is fired
    };
    myPlayer.addEvent("eventName", myFunc);

You can also remove the listeners later.

    myPlayer.removeEvent("eventName", myFunc);

### Event Types

<table border="0" cellspacing="5" cellpadding="5">
  <tr><th>Name</th><th>Description</th></tr>
  <tr><td>loadstart</td><td>Fired when the user agent begins looking for media data.</td></tr>
  <tr><td>play</td><td>Fired whenever the media begins or resumes playback.</td></tr>
  <tr><td>pause</td><td>Fired whenever the media has been paused.</td></tr>
  <tr><td>timeupdate</td><td>Fired when the current playback position has changed. During playback this is fired every 15-250 milliseconds, depnding on the playback technology in use.</td></tr>
  <tr><td>ended</td><td>Fired when the end of the media resource is reached. currentTime == duration</td></tr>
  <tr><td>durationchange</td><td>Fired when the duration of the media resource is changed, or known for the first time.</td></tr>
  <tr><td>progress</td><td>Fired while the user agent is downloading media data.</td></tr>
  <tr><td>resize</td><td>Fired when the width and/or height of the video window changes.</td></tr>
  <tr><td>volumechange</td><td>Fired when the volume changes.</td></tr>
  <tr><td>error</td><td>Fired when there is an error in playback.</td></tr>
</table>