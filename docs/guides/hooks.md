# Hooks

Hooks exist so that users can "hook" on to certain video.js player lifecycle

## Table of Contents

* [Current Hooks](#current-hooks)
  * [beforesetup](#beforesetup)
  * [setup](#setup)
* [Usage](#usage)
  * [Adding](#adding)
  * [Getting](#getting)
  * [Removing](#removing)

## Current Hooks

Currently, the following hooks are avialable:

### beforesetup

`beforesetup` is called just before the player is created. This allows:

* modification of the options passed to the video.js function (`videojs('some-id, options)`)
* modification of the dom video element that will be used for the player

`beforesetup` hook functions should:

* take two arguments
  1. videoEl: dom video element that video.js is going to use to create a player
  1. options: options that video.js was intialized with and will later pass to the player during creation
* return options that will merge and override options that video.js with intialized with

Example: adding beforesetup hook

```js
var beforeSetup = function(videoEl, options) {
  // videoEl.id will be some-id here, since that is what video.js
  // was created with

  videoEl.className += ' some-super-class';

  // autoplay will be true here, since we passed in as such
  (options.autoplay) {
    options.autoplay = false
  }

  // options that are returned here will be merged with old options
  // in this example options will now be
  // {autoplay: false, controls: true}
  return options;
};

videojs.hook('beforesetup', beforeSetup);
videojs('some-id', {autoplay: true, controls: true});
```

### setup

`setup` is called just after the player is created. This allows:

* plugin or custom functionalify to intialize on the player
* changes to the player object itself

`setup` hook functions:

* Take one argument
  * player: the player that video.js created
* Don't have to return anything

Example: adding setup hook

```js
    var setup = function(player) {
        // initialize the foo plugin
        player.foo();
    };
    var foo = function() {};

    videojs.plugin('foo', foo);
    videojs.hook('setup', setup);
    var player = videojs('some-id', {autoplay: true, controls: true});
```

## Usage

### Adding

In order to use hooks you must first include video.js in the page or script that you are using. Then you add hooks using `videojs.hook(<name>, function)` before running the `videojs()` function.

Example: adding hooks

```js
videojs.hook('beforesetup', function(videoEl, options) {
  // videoEl will be the element with id=vid1
  // options will contain {autoplay: false}
});
videojs.hook('setup', function(player) {
  // player will be the same player that is defined below
  // as `var player`
});

var player = videojs('vid1', {autoplay: false});
```

After adding your hooks they will automatically be run at the correct time in the video.js lifecycle.

### Getting

To access the array of hooks that currently exists and will be run on the video.js object you can use the `videojs.hooks` function.

Example: getting all hooks attached to video.js

```js
var beforeSetupHooks = videojs.hooks('beforesetup');
var setupHooks = videojs.hooks('setup');
```

### Removing

To stop hooks from being executed during the video.js lifecycle you will remove them using `videojs.removeHook`.

Example: remove a hook that was defined by you

```js
var beforeSetup = function(videoEl, options) {};

// add the hook
videojs.hook('beforesetup', beforeSetup);

// remove that same hook
videojs.removeHook('beforesetup', beforeSetup);
```

You can also use `videojs.hooks` in conjunction with `videojs.removeHook` but it may have unexpected results if used during an asynchronous callbacks as other plugins/functionality may have added hooks.

Example: using `videojs.hooks` and `videojs.removeHook` to remove a hook

```js
// add the hook
videojs.hook('setup', function(videoEl, options) {});

var setupHooks = videojs.hooks('setup');

// remove the hook you just added
videojs.removeHook('setup', setupHooks[setupHooks.length - 1]);
```
