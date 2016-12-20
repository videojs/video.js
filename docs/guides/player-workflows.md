# Player Workflows
This document outlines many considerations for using Video.js for advanced player workflows. Be sure to read [the setup guide](setup.md) first!

## Removing Players
No matter the term used for it, web applications are becoming common. Not everything is a static, load-once-and-done web page anymore! This means that developers need to be able to manage the full lifecycle of a video player - from creation to destruction. Video.js supports player removal through the `dispose()` method.

### [`dispose()`](http://docs.videojs.com/docs/api/player.html#Methodsdispose)
This method is available on all Video.js players and [components](http://docs.videojs.com/docs/api/component.html#Methodsdispose). It is _the only_ supported method of removing a Video.js player from both the DOM and memory. For example, the following code sets up a player and then disposes it when media playback is complete:

```js
var player = videojs('my-player');

player.on('ended', function() {
  this.dispose();
});
```

Calling `dispose()` will have a few effects:

1. Trigger a `"dispose"` event on the player, allowing for any custom cleanup tasks that need to be run by your integration.
1. Remove all event listeners from the player.
1. Remove the player's DOM element(s).

Additionally, these actions are recursively applied to _all_ the player's child components.

> **Note**: Do _not_ remove players via standard DOM removal methods: this will leave listeners and other objects in memory that you might not be able to clean up!

### Signs of an Undisposed Player
Seeing an error such as:

```
TypeError: this.el_.vjs_getProperty is not a function
```

or

```
TypeError: Cannot read property 'vdata1234567890' of null
```

Suggests that a player or component was removed from the DOM without using `dispose()`. It usually means something tried to trigger an event on it or call a method on it.

## Showing and Hiding a Player

It is not recommended that you attempt to toggle the visibility or display of a Video.js player. Doing so can be particularly problematic when it comes to the Flash tech. Instead, players should be created and [disposed](#removing-players) as needed.

This is relevant to use cases such as displaying a player in a modal/overlay. Rather than keeping a hidden Video.js player in a DOM element, it's recommended that you create the player when the modal opens and dispose it when the modal closes.

This is particularly relevant where memory/resource usage is concerned (e.g. mobile devices).

Depending on the libraries/frameworks in use, an implementation might look something like this:

```js
modal.on('show', function() {
  var videoEl = modal.findEl('video');
  modal.player = videojs(videoEl);
});

modal.on('hide', function() {
  modal.player.dispose();
});
```

## Using Video.js with...
Coming soon...

### jQuery
### React
### Ember
### Angular
