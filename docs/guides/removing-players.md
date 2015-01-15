Removing Players
================

Sometimes, you want to remove players after page load (in single page apps or modals, for instance). It's easy to manage, but there are some simple rules you need to follow.

Call `.dispose()`
-----------------

To remove the html associated with your videojs player from the page always call the player's [`dispose()`](https://github.com/videojs/video.js/blob/stable/docs/api/vjs.Player.md#dispose) method:

```javascript```
var oldPlayer = document.getElementById('my-player');
videojs(oldPlayer).dispose(); 
```

This method will:

  1. reset the internal state of videojs
  2. remove the player's dom from the page

Showing / Hiding a Player
-------------------------

For instance, if you have a modal that a player appears in, you should create the player when the modal pops up. When the modal hides, dispose the player. If you try to hide the Flash tech, things will go poorly. Even with other tech, calling `dispose()` on a player that's not needed will free up resources for the browser.

Why Is This Needed?
-------------------

VideoJS internally tracks all players and their associated data by html id attribute. If you plan to create new players with the same id as previously created players, you'll need to call the player's dispose() method to clear VideoJS's internal state before creating the new player.

Signs You Did It Wrong
-------------------------

```
TypeError: this.el_.vjs_getProperty is not a function
"VIDEOJS:" "Video.js: buffered unavailable on Hls playback technology element." TypeError: this.el_.vjs_getProperty is not a function
Stack trace:
...
```

If you encounter a console error in the browser similar to the above, you've probably forgotten to `dispose()` a player before removing it from the dom. This would happen when using the [contrib-hls](https://github.com/videojs/videojs-contrib-hls) plugin.
