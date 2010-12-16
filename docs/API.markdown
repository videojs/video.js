API
===
The VideoJS API allows you to interact with the video through Javascript, whether the browser is playing the video through HTML5 video or through the Flash fallback (with supported Flash players).

To use the API functions, you need access to the video player object. Luckily this is easy to get. You just need to make sure your video tag has an ID. The default embed code has an ID of "example_video_1". If you have multiple videos on one page, make sure every video tag has a unique ID.

NOTE: Before you can access the player, the DOM must be ready and the VideoJS setup methods must have run. Follow the examples and you'll be fine.

Using the VideoJS setup with built-in DOM ready function.

    VideoJS.setupAll(options, function(){

      var myPlayer = VideoJS.player("example_video_id");

    });

Using a javascript library's DOM ready function (jQuery example)

    $(function(){ // DOM Ready

      var myPlayer = VideoJS.setup("example_video_1", options);

    });

After the player has been setup, you can also always access the player through the video element's "player" attribute.

    // Javascript Example
    myPlayer = document.getElementById("example_video_1").player;
  
    // jQuery Example
    myPlayer = $("#example_video_1")[0].player
  
    // VideoJS jQuery Plugin Example
    myPlayer = $("#example_video_1").player();


Now that you have access to the player through the myPlayer variable, you can control the video or react to video events using the following methods.

play()
  Start video playback.
  Returns the player object.
  Example:

    myPlayer.play();

onPlay(callback) // Type: Function
  Trigger the supplied callback function every time the video starts playing.
  Returns the player object.
  Example:

    myPlayer.onPlay(function(){
      alert("OMG Video is playing!");
    });

pause()
  Pause the video playback.
  Returns: the player object
  Example:

    myPlayer.pause();

onPause(callback) // Type: Function
  Trigger the supplied callback function every time the video is paused.
  Returns the player object.
  Example:

    myPlayer.onPause(function(){
      alert("OMG Video is paused now!");
    });

currentTime()
  Returns the current time of the video in seconds.
  Example:

    var whereYouAt = myPlayer.currentTime();

currentTime(seconds) // Type: Integer or Float
  Seek to the supplied time (seconds).
  Returns the player object.
  Example:

    myPlayer.currentTime(120); // 2 minutes into the video

onTimeUpdate(callback) // Type: Function
  Trigger the supplied callback function every time the currentTime changes. This is triggered about 10 times per second.
  Returns the player object.
  Example:

    myPlayer.onTimeUpdate(function(){
      alert("The video is now " + myPlayer.currentTime() + " seconds in.");
    });

onEnded(callback) // Type: Function
  Trigger the supplied callback function when the video finishes playing.
  Returns the player object.
  Example:

    myPlayer.onEnded(function(){
      alert("Fin!");
    });

duration()
  Returns the length in time of the video in seconds. Note: The video must have started loading before the duration can be known.
  Example:

    var howLongIsThis = myPlayer.duration();

onDurationUpdate(callback) // Type: Function
  Trigger the supplied callback function when the video's duration is updated.
  Returns the player object.
  Example:

    myPlayer.onDurationUpdate(function(){
      alert("The video's duration is now " + myPlayer.duration());
    });

buffered()
  Returns the amount of video that has loaded (downloaded) into the buffer.
  Example:

    // Needs to be expanded
    var howMuchIsLoaded = myPlayer.duration();

onBufferedUpdate(callback) // Type: Function
  Trigger the supplied callback function when the video's buffered amount is updated.
  Returns the player object.
  Example:

    // Needs to be updated
    myPlayer.onBufferedUpdate(function(){
      alert("The video's duration is now " + myPlayer.duration());
    });

volume()
  Returns the current volume of the video as a percent in decimal form. 0 is off (muted), 1.0 is all the way up, 0.5 is half way.
  Example:

    var howLoudIsIt = myPlayer.volume();

volume(percentAsDecimal)
  Set the volume to the supplied percent (as a decimal between 0 and 1).
  Example:

    myPlayer.volume(0.5); // Set volume to half

onVolumeChange(callback)
  Trigger the supplied callback function when the video's volume changes.
  Returns the player object.
  Example:

    myPlayer.onVolumeChange(function(){
      alert("The video's volume is now " + myPlayer.volume());
    });

width()
  Returns the current width of the video in pixels.
  Example:
  
    var howWideIsIt = myPlayer.width();

width(pixels)
  Change the width of the video to the supplied width in pixels.
  Returns the player object
  Example:

    myPlayer.width(640);

height()
  Returns the current height of the video in pixels.
  Example:

    var howTallIsIt = myPlayer.height();

height(pixels)
  Change the height of the video to the supplied height in pixels.
  Returns the player object

    myPlayer.height(480);

size(width, height)
  Changes the width and height of the video to the supplied width and height. This is more efficient if you're changing both width and height.
  Returns the player object.
  
    myPlayer.size(640,480);

onResize(callback)
  Trigger the supplied callback function when the video's size (width, height, or both) changes.
  Returns the player object.

    myPlayer.onResize(function(){
      alert("The video is now " + myPlayer.width() + " by " + myPlayer.height());
    });

enterFullScreen()
  Increase the size of the video to full screen. In some browsers, full screen is not supported natively, so it enters full window mode, where the fills the browser window. In browsers that support native full screen, typically the browser's default controls will be shown, and not the VideoJS custom skin. In full window mode, the VideoJS controls and skin will always be used.
  Returns the player object.

    myPlayer.enterFullScreen();

exitFullScreen()
  Return the video to its normal size after having been in full screen mode.
  Returns the player object.

    myPlayer.exitFullScreen();

onError(callback)
  Trigger the supplied callback function when the video when there is an error with the video.
  Returns the player object.

    // Need to make work
    myPlayer.onError(function(errorText, errorID){
      alert("There's something wrong. " + errorText);
    });