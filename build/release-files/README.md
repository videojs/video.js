Video.js - [HTML5 Video Player](http://videojs.com)
==================================================
Version 3.0

---
Version 3 is almost a complete rewrite of the previous versions of Video.js. New features includes:

  - HTML/CSS Controls and API now work for both the HTML5 and Flash versions.
  - Custom Super-lightweight Flash Fallback
  - Embed Code is much simpler.
    - No more "vjs-box" div required, just use the video tag.
    - No more embedding of Flash fallback within the video tag HTML.

---

View [videojs.com](http://videojs.com) for a demo and overview.  

Video.js is an HTML5 video player that uses the HTML5 video tag built into modern browsers, and uses javascript to add custom controls, new functionality, and to fix cross browser bugs. For browsers that don't support HTML5, it will fallback to a Flash player.

View demo.html for an example of how to use it.

Originally based on [this tutorial](http://blog.steveheffernan.com/2010/04/how-to-build-an-html5-video-player/).

Contributors (Github Username)
------------------------------
heff, dz0ny, sentientbit, tvdeyen, brandonarbini, gordonbrander, Shraymonks, albertogasparin, sandaru1, nicholasbs, majornista, Fredust85, @wonderboymusic, ellis-, emirpprime, eirikb, mbrubeck


Getting Started
---------------

### Step 1: Include the Video.js Javascript and CSS files in the head of your page.
Change the file urls to point to the files on your server.

    <script src="video.js"></script>
    <link href="video-js.css" rel="stylesheet">


### Step 2: Add an HTML5 video tag to your page.
Use the video tag as normal, with a few extra pieces for Video.js:

  1. The 'data-setup' attribute tells Video.js to automatically set up the video when the page is ready, and read any options (in JSON format) from the attribute.
  2. The 'id' Attribute: Should be used and unique for every video on the same page.
  3. The 'class' attribute contains two classes:
    - 'video-js' applies styles that are required for Video.js functionality, like fullscreen and subtitles.
    - 'vjs-default-skin' applies the default skin to the HTML controls, and can be removed or overridden to create your own controls design.

Otherwise include/exclude attributes, settings, sources, and tracks exactly as you would for HTML5 video.

    <video id="example_video_1" class="video-js vjs-default-skin" controls preload="auto" width="640" height="264"
        poster="http://video-js.zencoder.com/oceans-clip.png"
        data-setup='{"example_option":true}'>
      <source src="http://video-js.zencoder.com/oceans-clip.mp4" type='video/mp4' />
      <source src="http://video-js.zencoder.com/oceans-clip.webm" type='video/webm' />
    </video>


### Step 3: Nada!
That's all it take to get started. See the [docs](http://videojs.com/docs/) for more advanced uses.


Changelog
---------
3.0

- Complete rewrite
- HTML/CSS Controls and API now work for both the HTML5 and Flash versions
- Custom Super-lightweight Flash Fallback
- Embed Code is much simpler.
  - No more "vjs-box" div required, just use the video tag.
  - No more embedding of Flash fallback within the video tag HTML.

2.0.3

- Feature: Made returning to the start at the end of the movie an option ("returnToStart").
- Feature: Added loop option to loop movie ("loop").
- Feature: Reorganized player API and listeners.
- Feature: Added option to disable controls. controlsEnabled: false
- Feature: Setup method now has a callback, so you can more easily work with the player after setup
- Feature: Added listeners for enter/exit full screen/window.
- Feature: Added a VideoJS.player(id) function for getting the player for a video ID
- Changes: setupAllWhenReady is now just setupAll (backward compatible)
- Fix: Check for Android browser now excludes firefox and opera

2.0.2 (2010-12-10)

- Feature: Rewrote and optimized subtitle code.
- Feature: Protecting against volume ranges outside of 1 and 0.
- Fix: Bug in Safari for Mac OS 10.5 (Leopard) that was breaking fullscreen.

2.0.1 (2010-11-22)

- Fix: Issue with big play button when multiple videos are on the page.
- Fix: Optimized play progress tracking.
- Fix: Optimized buffer progress checking.
- Fix: Firefox not showing Flash fallback object.

2.0.0 (2010-11-21)

- Feature: Created "behaviors" concept for adding behaviors to elements
- Feature: Switched back to divs for controls, for more portable styles
- Feature: Created playerFallbackOrder array option. ["html5", "flash", "links"]
- Feature: Created playerType concept, for initializing different platforms
- Feature: Added play button for Android
- Feature: Added spinner for iPad (non-fullscreen)
- Feature: Split into multiple files for easier development
- Feature: Combined VideoJS & _V_ into the same variable to reduce confusion
- Fix: Checking for m3u8 files (Apple HTTP Streaming)
- Fix: Catching error on localStorage full that safari seems to randomly throw
- Fix: Scrubbing to end doesn't trigger onEnded

1.1.5 (2010-11-09)

- Feature: Switched to track method for setting subtitles. Now works like spec.
- Feature: Created "players" concept for defining fallbacks and fallback order
- Fix: Android playback bug.
- Fix: Massive reorganization of code to make easier to navigate

1.1.4 (2010-11-06)

- Feature: Added loading spinner.
- Feature: Improved styles loaded checking.
- Feature: Added volume() function to get and set volume through the player.
- Fix: Fix issue where FF would loop video in background when ended.
- Fix: Bug in Chrome that shows poster & plays audio if you set currentTime too quickly.
- Fix: Bug in Safari where waiting is triggered and shows spinner when not needed
- Fix: Updated to show links if only unplayable sources and no Flash.
- Fix: Issue where if play button was loaded after play, it wouldn't hide.

1.1.3 (2010-10-19)

- Feature: Width/Height functions for resizing the player
- Feature: Made initial click & hold trigger new value on progress and volume
- Feature: Made controls not hide when hovering over them
- Feature: Added big play button as default starting control.
- Fix: Removed trailing comma that was breaking IE7
- Fix: Removed some vars from global scope
- Fix: Changed a document.onmousemove to an eventListener to prevent conflicts
- Fix: Added a unique ID to FlowPlayer demo object to fix a FlowPlayer bug. Thanks @emirpprime.
- Fix: Safari error on unloaded video

1.1.2 (2010-09-20)

- Added a fix for the poster bug in iPad/iPhone
- Added more specificity to styles

1.1.1 (2010-09-14)

- First Formally Versioned Release
  
1.0.0 (2010-05-18)

- First released
