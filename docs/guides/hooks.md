# Hooks

Hooks exist so that users can globally hook into certain Video.js lifecycle moments.

## Table of Contents

* [Current Hooks](#current-hooks)
  * [beforesetup](#beforesetup)
    * [Example](#example)
  * [setup](#setup)
    * [Example](#example-1)
  * [beforeerror](#beforeerror)
    * [Example](#example-2)
  * [error](#error)
    * [Example](#example-3)
* [Usage](#usage)
  * [Adding](#adding)
    * [Example](#example-4)
  * [Adding Once](#adding-once)
    * [Example](#example-5)
  * [Getting](#getting)
    * [Example](#example-6)
  * [Removing](#removing)
    * [Example](#example-7)

## Current Hooks

Currently, the following hooks are available:

### beforesetup

`beforesetup` occurs just before a player is created. This allows:

* Modification of the options passed to the Video.js function (e.g., `videojs('some-id, options)`).
* Modification of the DOM video element that will be used for the player that will be created.

`beforesetup` hook functions should:

* Take two arguments:
  1. `videoEl`: DOM `<video>` element that Video.js is going to use to create a player.
  1. `options`: The options object that Video.js was called with and will be passed to the player during creation.
* Return an options object that will be merged with the originally provided options.

#### Example

```js
videojs.hook('beforesetup', function(videoEl, options) {

  // videoEl will be the video element with id="some-id" since that
  // gets passed to videojs() below. On subsequent calls, it will be
  // different.

  videoEl.className += ' some-super-class';

  // autoplay will be true here, since we passed it as such.
  if (options.autoplay) {
    options.autoplay = false
  }

  // Options that are returned here will be merged with old options.
  //
  // In this example options will now be:
  //   {autoplay: false, controls: true}
  //
  // This has the practical effect of always disabling autoplay no matter
  // what options are passed to videojs().
  return options;
});

// Create a new player.
videojs('some-id', {autoplay: true, controls: true});
```

### setup

`setup` occurs just after a player is created. This allows:

* Plugins or other custom functionality to initialize on the player.
* Changes to the player object itself.

`setup` hook functions:

* Take one argument:
  1. `player`: the player that Video.js created
* Don't have to return anything

#### Example

```js
videojs.registerPlugin('foo', function() {

  // This basic plugin will add the "some-super-class" class to a player.
  this.addClass('some-super-class');
});

videojs.hook('setup', function(player) {

  // Initialize the foo plugin after any player is created.
  player.foo();
});

// Create a new player.
videojs('some-id', {autoplay: true, controls: true});
```

### beforeerror

`beforeerror` occurs just as we get an error on the player. This allows plugins or other custom code to intercept the error and modify it to be something else.
`error` can be [one of multiple things](https://docs.videojs.com/mediaerror#MediaError), most commonly an object with a `code` property or `null` which means that the current error should be cleared.

`beforeerror` hook functions:

* Take two arguments:
  1. The `player` that the error is happening on.
  1. The `error` object that was passed in.
* Return an error object that should replace the error

#### Example

```js
videojs.hook('beforeerror', function(player, err) {
  const error = player.error();

  // prevent current error from being cleared out
  if (err === null) {
    return error;
  }

  // but allow changing to a new error
  return err;
});
```

### error

`error` occurs after the player has errored out, after `beforeerror` has allowed updating the error, and after an `error` event has been triggered on the player in question. It is purely an informative event which allows you to get all errors from all players.

`error` hook functions:

* Take two arguments:
  1. `player`: the player that the error occurred on
  1. `error`: the Error object that was resolved with the `beforeerror` hooks
* Don't have to return anything

#### Example

```js
videojs.hook('error', function(player, err) {
  console.log(`player ${player.id()} has errored out with code ${err.code} ${err.message}`);
});
```

## Usage

### Adding

Hooks can be added using `videojs.hook(<name>, function)` before running the `videojs()` function.

#### Example

```js
videojs.hook('beforesetup', function(videoEl, options) {
  // This hook will be called twice. Once for "vid1" and once for "vid2".
  // The options will match what is passed to videojs() for each of them.
});

videojs.hook('setup', function(player) {
  // This hook will be called twice. Once for "vid1" and once for "vid2".
  // The player value will be the player that is created for each element.
});

videojs('vid1', {autoplay: false});
videojs('vid2', {autoplay: true});
```

After adding your hooks, they will automatically be run at the correct time in the Video.js lifecycle.

### Adding Once

In some cases, you may only want your hook to run once. In these cases, use `videojs.hookOnce(<name>, function)` before running the `videojs()` function.

#### Example

```js
videojs.hookOnce('beforesetup', function(videoEl, options) {
  // This hook will be called once for "vid1", but not for "vid2".
  // The options will match what is passed to videojs().
});

videojs.hookOnce('setup', function(player) {
  // This hook will be called once for "vid1", but not for "vid2".
  // The player value will be the player that is created for each element.
});

videojs('vid1', {autoplay: false});
videojs('vid2', {autoplay: true});
```

### Getting

To access the array of functions that currently exists for any hook, use the `videojs.hooks` function.

#### Example

```js
// Get an array of all the 'beforesetup' hooks.
var beforeSetupHooks = videojs.hooks('beforesetup');

// Get an array of all the 'setup' hooks.
var setupHooks = videojs.hooks('setup');
```

### Removing

To stop hooks from being executed during any future Video.js lifecycles you can remove them using `videojs.removeHook`.

#### Example

```js
var beforeSetup = function(videoEl, options) {};

// Add the hook.
videojs.hook('beforesetup', beforeSetup);

// Remove the same hook.
videojs.removeHook('beforesetup', beforeSetup);
```
