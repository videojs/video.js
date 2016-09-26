# Hooks
Hooks exist so that users can latch on to certain Video.js lifecycle events


## Current Hooks
Currently the following lifecycle events are accept and use hooks

### presetup
Called just before the player is created, so that the user can modify the options passed to the player or modify the video element that will be used for the player
An example of this hook:

```js
    var preSetup = function(videoEl, options) {
        videoEl.className += ' some-super-class';

        // never autoplay because it makes me mad!
        options.autoplay = false

        // options that are returned here will be merged with old options
        // automatically
        return options;
    };
```

### postsetup
Called just after the player is created, so that plugins or custom functionality can be initialized

```js
    var postSetup = function(player) {
        // initialize the foo plugin
        player.foo();
    };
```


## Usage

### Adding
In order to setup hooks you must first include Video.js in the page or script that you are using. Then you add hooks before running the videojs function like this:

```js
    videojs.hook('presetup', function(videoEl, options) {
        // videoEl will be the element with id=vid1
        // options will contain {autoplay: false}
    });
    videojs.hook('presetup', function(player) {
        player will be the player that would get returned by the videojs function
    });
    videojs('vid1', {autoplay: false});
```

After adding your hooks they will automatically be run at the correct time in the Video.js lifecycle

### Getting
To access the array of hooks that currently exists and will be run on the Video.js object you can use the `hooks` function:

```js
    var preSetupHooks = videojs.hooks('presetup');
    var postSetupHooks = videojs.hooks('postsetup');
```

### Removing
To remove hooks from being executed during lifecycle events you will use `removeHook` like so:

```js
    var preSetup = function(videoEl, options) {};

    // add the hook
    videojs.hook('presetup', preSetup);

    // remove that same hook
    videojs.removeHook('presetup', preSetup);
```

You can also use `hooks` in conjunction with `removeHook` but it may have unexpected results if used during an asynchronous callbacks as other plugins/functionality may have added hooks.

```js
    // add the hook
    videojs.hook('presetup', function(videoEl, options) {});

    var preSetupHooks = videojs.hooks('presetup');

    // remove the hook you just added
    videojs.removeHook('presetup', preSetupHooks[preSetupHooks.length - 1]);
```

