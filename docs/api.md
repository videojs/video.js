---
layout: docs
title: API
description: Video.JS API Docs - API settings based on the HTML5 video API
body_id: api
body_class: docs subpage
---

API
===
The Video.js API allows you to interact with the video through Javascript, whether the browser is playing the video through HTML5 video, Flash, or any other supported playback technologies.

Referencing the Player
----------------------
To use the API functions, you need access to the player object. Luckily this is easy to get. You just need to make sure your video tag has an ID. The example embed code has an ID of "example_video_1". If you have multiple videos on one page, make sure every video tag has a unique ID.

{% highlight javascript %}

  var myPlayer = _V_("example_video_1");

{% endhighlight %}

(If the player hasn't been initialized yet via the data-setup attribute or another method, this will also initialize the player.)

Wait Until the Player is Ready
------------------------------
The time it takes Video.js to set up the video and API will vary depending on the playback technology being used (HTML5 will often be much faster to load than Flash). For that reason we want to use the player's 'ready' function to trigger any code that requires the player's API.

{% highlight javascript %}

    _V_("example_video_1").ready(function(){

      var myPlayer = this;

      // EXAMPLE: Start playing the video.
      myPlayer.play();

    });

{% endhighlight %}

API Methods
-----------
Now that you have access to a ready player, you can control the video or respond to video events using the following functions. The Video.js API function names follow the [HTML5 media API](http://www.w3.org/TR/html5/video.html). The main difference is that attributes which you would get or set on a video element using the equals sign ( `myVideoElement.currentTime = "120";` ), you would use a function argument syntax for Video.js ( `myPlayer.currentTime(120);` )

### play()
  Start video playback. Returns the player object.

{% highlight javascript %}

  myPlayer.play();

{% endhighlight %}



### pause()
  Pause the video playback. Returns: the player object

{% highlight javascript %}

  myPlayer.pause();

{% endhighlight %}

### currentTime()
  Returns the current time of the video in seconds.

{% highlight javascript %}

  var whereYouAt = myPlayer.currentTime();

{% endhighlight %}

### currentTime(seconds) // Type: Integer or Float
  Seek to the supplied time (seconds).
  Returns the player object.

{% highlight javascript %}

  myPlayer.currentTime(120); // 2 minutes into the video

{% endhighlight %}


### duration()
  Returns the length in time of the video in seconds. NOTE: The video must have started loading before the duration can be known, and in the case of Flash, may not be known until the video starts playing.


{% highlight javascript %}

  var howLongIsThis = myPlayer.duration();

{% endhighlight %}

### buffered()
  Returns a [TimeRange](http://videojs.com/docs/glossary.html#timerange) with sections of the video that have been downloaded. If you just want the percent of the video that's been downloaded, use bufferedPercent.

{% highlight javascript %}

  var whatHasBeenBuffered = myPlayer.buffered();

{% endhighlight %}

### bufferedPercent()
  Returns the percent (as a decimal) of the video that's been downloaded.

{% highlight javascript %}

  var howMuchIsDownloaded = myPlayer.bufferedPercent();

{% endhighlight %}

### volume()
  Returns the current volume of the video as a percent in decimal form. 0 is off (muted), 1.0 is all the way up, 0.5 is half way.

{% highlight javascript %}

  var howLoudIsIt = myPlayer.volume();

{% endhighlight %}

### volume(percentAsDecimal)
  Set the volume to the supplied percent (as a decimal between 0 and 1).

{% highlight javascript %}

  myPlayer.volume(0.5); // Set volume to half

{% endhighlight %}

### width()
  Returns the current width of the video in pixels.

{% highlight javascript %}

    var howWideIsIt = myPlayer.width();

{% endhighlight %}

### width(pixels)
  Change the width of the video to the supplied width in pixels.
  Returns the player object

{% highlight javascript %}

  myPlayer.width(640);

{% endhighlight %}


### height()
  Returns the current height of the video in pixels.

{% highlight javascript %}

  var howTallIsIt = myPlayer.height();

{% endhighlight %}


### height(pixels)
  Change the height of the video to the supplied height in pixels.
  Returns the player object

{% highlight javascript %}

  myPlayer.height(480);

{% endhighlight %}


### size(width, height)
  Changes the width and height of the video to the supplied width and height. This is more efficient if you're changing both width and height (only triggers the player's resize event once). Returns the player object.

{% highlight javascript %}

  myPlayer.size(640,480);

{% endhighlight %}


### requestFullScreen()
  Increase the size of the video to full screen. In some browsers, full screen is not supported natively, so it enters full window mode, where the fills the browser window. In browsers that support native full screen, typically the browser's default controls will be shown, and not the Video.js custom skin. In full window mode, the Video.js controls and skin will always be used.
  Returns the player object.

{% highlight javascript %}

  myPlayer.enterFullScreen();

{% endhighlight %}


### cancelFullScreen()
  Return the video to its normal size after having been in full screen mode.
  Returns the player object.

{% highlight javascript %}

  myPlayer.exitFullScreen();

{% endhighlight %}


Events
------
You can attach event listeners to the player similarly to how you would for a video element.

{% highlight javascript %}

  var myFunc = function(){
    // Do something when the event is fired
  };
  myPlayer.addEvent("eventName", myFunc);

{% endhighlight %}


You can also remove the listeners later.

{% highlight javascript %}

  myPlayer.removeEvent("eventName", myFunc);

{% endhighlight %}


### Event Types
List of player events you can add listeners for.

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