VideoJS - [HTML5 Video Player](http://videojs.com)
==================================================
Version 1.1.2

View [VideoJS.com](http://videojs.com) for a demo and overview.

VideoJS is an HTML5 video player that uses the HTML5 video tag built into modern browsers, and uses javascript to add custom controls, new functionality, and to fix cross browser bugs.

The base of VideoJS is Kroc Camen's [Video for Everybody](http://camendesign.com/code/video_for_everybody), which is a video embed code that falls back to a Flash video player or download links for browsers and devices that don't support HTML5 video.

View demo.html for an example of how to use it.

Originally based on [this tutorial](http://blog.steveheffernan.com/2010/04/how-to-build-an-html5-video-player/).

Contributors (Github Username)
------------------------------
heff, dz0ny, sentientbit, tvdeyen, brandonarbini, gordonbrander, Shraymonks, albertogasparin, sandaru1, nicholasbs, majornista, Fredust85


Getting Started
---------------

### Step 1: Include VideoJS Javascript and CSS files in your page.
Change the src/href to the appropriate location on your server.

    <script src="video.js" type="text/javascript" charset="utf-8"></script>
    <link rel="stylesheet" href="video-js.css" type="text/css" media="screen" title="Video JS" charset="utf-8">


### Step 2: Add the VideoJS setup code to your page or another script.
Must run after the VideoJS javascript file has been included

    <script type="text/javascript" charset="utf-8">

      // Add VideoJS to all video tags on the page when the DOM is ready
      VideoJS.setupAllWhenReady();

    </script>


### Step 3: Add the VideoJS embed code to your page (grab the latest version for demo.html).
Change the video and image files to your own. You can even swap out the Flash Fallback for your own, just maintain the "vjs-flash-fallback" class on the object. I know, seems like a lot of HTML, but it's super compatible. [Check it](http://camendesign.com/code/video_for_everybody/test.html).

    <!-- Begin VideoJS -->
    <div class="video-js-box">
      <!-- Using the Video for Everybody Embed Code http://camendesign.com/code/video_for_everybody -->
      <video id="example_video_1" class="video-js" width="640" height="264" poster="http://video-js.zencoder.com/oceans-clip.png" controls preload>
        <source src="http://video-js.zencoder.com/oceans-clip.mp4" type='video/mp4; codecs="avc1.42E01E, mp4a.40.2"'>
        <source src="http://video-js.zencoder.com/oceans-clip.webm" type='video/webm; codecs="vp8, vorbis"'>
        <source src="http://video-js.zencoder.com/oceans-clip.ogv" type='video/ogg; codecs="theora, vorbis"'>
        <!-- Flash Fallback. Use any flash video player here. Make sure to keep the vjs-flash-fallback class. -->
        <object class="vjs-flash-fallback" width="640" height="264" type="application/x-shockwave-flash"
          data="http://releases.flowplayer.org/swf/flowplayer-3.2.1.swf">
          <param name="movie" value="http://releases.flowplayer.org/swf/flowplayer-3.2.1.swf" />
          <param name="allowfullscreen" value="true" />
          <param name="flashvars" value='config={"playlist":["http://video-js.zencoder.com/oceans-clip.png", {"url": "http://video-js.zencoder.com/oceans-clip.mp4","autoPlay":false,"autoBuffering":true}]}' />
          <!-- Image Fallback. Typically the same as the poster image. -->
          <img src="http://video-js.zencoder.com/oceans-clip.png" width="640" height="264" alt="Poster Image"
            title="No video playback capabilities." />
        </object>
      </video>
      <!-- Download links provided for devices that can't play video in the browser. -->
      <p class="vjs-no-video"><strong>Download Video:</strong>
        <a href="http://video-js.zencoder.com/oceans-clip.mp4">MP4</a>,
        <a href="http://video-js.zencoder.com/oceans-clip.webm">WebM</a>,
        <a href="http://video-js.zencoder.com/oceans-clip.ogv">Ogg</a><br>
        <!-- Support VideoJS by keeping this link. -->
        <a href="http://videojs.com">HTML5 Video Player</a> by VideoJS
      </p>
    </div>
    <!-- End VideoJS -->


Storing a Reference to the Player(s)
------------------------------------
You can set up the player(s) in a way that allows you to access it later, and control things like the video playback. In this case, the setup has to happen after the DOM has been loaded. You can use any library's DOM Ready method, or the one built into VideoJS.

### Using a Video's ID or Element

    VideoJS.DOMReady(function(){
      var myPlayer = VideoJS.setup("example_video_1");
    });


### Using an array of video elements/IDs
Note: It returns an array of players

    VideoJS.DOMReady(function(){
      var myManyPlayers = VideoJS.setup(["example_video_1", "example_video_2", video3Element]);
    });


### All videos on the page with the "video-js" class

    VideoJS.DOMReady(function(){
      var myManyPlayers = VideoJS.setup("All");
    });


### After you have references to your players you can...(example)

    VideoJS.DOMReady(function(){
      var myPlayer = VideoJS.setup("example_video_1");
      myPlayer.play(); // Starts playing the video for this player.
    });


Setting Options
---------------
Set options when setting up the videos. The defaults are shown here.

    VideoJS.setupAllWhenReady({
      controlsBelow: false, // Display control bar below video instead of in front of
      controlsHiding: true, // Hide controls when mouse is not over the video
      defaultVolume: 0.85, // Will be overridden by user's last volume if available
      flashVersion: 9, // Required flash version for fallback
      linksHiding: true, // Hide download links when video is supported
      flashIsDominant: false // Always use Flash when available
    });

### Or as the second option of VideoJS.setup

    VideoJS.DOMReady(function(){
      var myPlayer = VideoJS.setup("example_video_1", {
        // Same options
      });
    });


Changelog
---------
1.1.3

- Feature: Width/Height functions for resizing the player
- Fix: Removed trailing comma that was breaking IE7
- Fix: Removed some vars from global scope

1.1.2 (2010-09-20)

- Added a fix for the poster bug in iPad/iPhone
- Added more specificity to styles

1.1.1 (2010-09-14)

- First Formally Versioned Release
  
1.0.0 (2010-05-18)

- First released
