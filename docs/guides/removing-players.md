RemovingPlayers
===============

Sometimes, you want to remove players after page load (in single page apps, for instance). It's easy to manage, but there are some simple rules you need to follow.

Call `.dispose()`
-----------------

Before removing the html associated with your videojs player from the page always call the player's `dispose()` method

```javascript```
var oldPlayer = document.getElementById('my-player');
videojs(oldPlayer).dispose(); // Don't skip this step!
oldPlayer.parentNode.removeChild(oldPlayer);
```

Or...Use Unique Ids
-------------------

If you prefer not to call `dispose()` on a player, you can always create new players with unique ids for that page load.

Why Is This Needed?
-------------------

VideoJS internally tracks all players and their associated data by html id attribute. If you plan to create new players with the same id as previously created players, you'll need to call the player's dispose() method to clear VideoJS's internal state before creating the new player.

Signs You Did It Wrong
-------------------------

If you encounter an console error in browser similar to this, you've probably forgotten to dispose() a player before removing it from the dom:

```
TypeError: this.el_.vjs_getProperty is not a function
"VIDEOJS:" "Video.js: buffered unavailable on Hls playback technology element." TypeError: this.el_.vjs_getProperty is not a function
Stack trace:
...
```

