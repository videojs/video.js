# Video.js Plugins

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Writing a Basic Plugin](#writing-a-basic-plugin)
  - [Write a JavaScript Function](#write-a-javascript-function)
  - [Register a Basic Plugin](#register-a-basic-plugin)
  - [Setting up a Basic Plugin](#setting-up-a-basic-plugin)
- [Writing a Class-Based Plugin](#writing-a-class-based-plugin)
  - [Write a JavaScript Class/Constructor](#write-a-javascript-classconstructor)
  - [Register a Class-Based Plugin](#register-a-class-based-plugin)
  - [Setting up a Class-Based Plugin](#setting-up-a-class-based-plugin)
  - [Key Differences from Basic Plugins](#key-differences-from-basic-plugins)
    - [The Value of `this`](#the-value-of-this)
    - [The Player Plugin Name Property](#the-player-plugin-name-property)
  - [Advanced Features of Class-based Plugins](#advanced-features-of-class-based-plugins)
    - [Events](#events)
    - [Statefulness](#statefulness)
    - [Lifecycle](#lifecycle)
  - [Advanced Example Class-based Plugin](#advanced-example-class-based-plugin)
- [References](#references)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

One of the great strengths of Video.js is its ecosystem of plugins that allow authors from all over the world to share their video player customizations. This includes everything from the simplest UI tweaks to new [playback technologies and source handlers](tech.md)!

Because we view plugins as such an important part of Video.js, the organization is committed to maintaining a robust set of tools for plugin authorship:

- [generator-videojs-plugin][generator]

  A [Yeoman][yeoman] generator for scaffolding a Video.js plugin project. Additionally, it offers a set of [conventions for plugin authorship][standards] that, if followed, make authorship, contribution, and usage consistent and predictable.

  In short, the generator sets up plugin authors to focus on writing their plugin - not messing with tools.

- [videojs-spellbook][spellbook]

  As of version 3, the plugin generator includes a new dependency: [videojs-spellbook][spellbook]. Spellbook is a kitchen sink plugin development tool: it builds plugins, creates tags, runs a development server, and more.

  The benefit of Spellbook is that you can run the generator _once_ and receive updates and bugfixes in Spellbook without having to run the generator again and deal with Yeoman conflicts and other headaches.

  As long as your plugin project follows the [conventions][standards], Spellbook should work on it!

## Writing a Basic Plugin

If you've written a Video.js plugin before, the basic plugin concept should be familiar. It's similar to a jQuery plugin in that the core idea is that you're adding a method to the player.

### Write a JavaScript Function

A basic plugin is a plain JavaScript function:

```js
function examplePlugin(options) {
  this.addClass(options.customClass);
  this.on('playing', function() {
    videojs.log('playback began!');
  });
}
```

By convention, plugins are passed an `options` object; however, you can realistically accept whatever arguments you want. This example plugin will add a custom class (whatever is passed in as `options.customClass`) and, whenever playback begins, it will log a message to the browser console.

> **Note:** The value of `this` in the plugin function is the player instance; so, you have access to [its complete API][api-player].

### Register a Basic Plugin

Now that we have a function that does something with a player, all that's left is to register the plugin with Video.js:

```js
videojs.registerPlugin('examplePlugin', examplePlugin);
```

The only stipulation with the name of the plugin is that it cannot conflict with any existing player method. After that, any player will automatically have an `examplePlugin` method on its prototype!

### Setting up a Basic Plugin

Finally, we can use our plugin on a player. There are two ways to do this. The first way is during creation of a Video.js player. Using the `plugins` option, a plugin can be automatically set up on a player:

```js
videojs('example-player', {
  plugins: {
    examplePlugin: {
      customClass: 'example-class'
    }
  }
});
```

Otherwise, a plugin can be manually set up:

```js
var player = videojs('example-player');
player.examplePlugin({customClass: 'example-class'});
```

These two methods are functionally identical - use whichever you prefer! That's all there is to it for basic plugins.

## Writing a Class-Based Plugin

As of Video.js 6, there is an additional type of plugin supported: class-based plugins.

At any time, you may want to refer to the [Plugin API docs][api-plugin] for more detail.

### Write a JavaScript Class/Constructor

If you're familiar with creating [components](components.md), this process is similar. A class-based plugin starts with a JavaScript class (a.k.a. a constructor function).

This can be achieved with ES6 classes:

```js
const Plugin = videojs.getPlugin('plugin');

class ExamplePlugin extends Plugin {

  constructor(player, options) {
    super(player);

    player.addClass(options.customClass);
    player.on('playing', function() {
      videojs.log('playback began!');
    });
  }
}
```

Or with ES5:

```js
var Plugin = videojs.getPlugin('plugin');

var ExamplePlugin = videojs.extend(Plugin, {

  constructor: function(player, options) {
    Plugin.prototype.call(this, player, options);

    player.addClass(options.customClass);
    player.on('playing', function() {
      videojs.log('playback began!');
    });
  }
});
```

For now, this example class-based plugin does the exact same thing as the basic plugin described above - not to worry, we will make it more interesting as we continue!

### Register a Class-Based Plugin

The registration process for class-based plugins is identical to [the process for basic plugins](#register-a-basic-plugin).

```js
videojs.registerPlugin('examplePlugin', ExamplePlugin);
```

### Setting up a Class-Based Plugin

Again, just like registration, the setup process for class-based plugins is identical to [the process for basic plugins](#setting-up-a-basic-plugin).

```js
videojs('example-player', {
  plugins: {
    examplePlugin: {
      customClass: 'example-class'
    }
  }
});
```

Otherwise, a plugin can be manually set up:

```js
var player = videojs('example-player');
player.examplePlugin({customClass: 'example-class'});
```

### Key Differences from Basic Plugins

Class-based plugins have two key differences from basic plugins that are important to understand before describing their advanced features.

#### The Value of `this`

With basic plugins, the value of `this` in the plugin function will be the _player_.

With class-based plugins, the value of `this` is the _instance of the plugin class_. The player is passed to the plugin constructor as its first argument (and is automatically applied to the plugin instance as the `player` property) and any further arguments are passed after that.

#### The Player Plugin Name Property

Both basic plugins and class-based plugins are set up by calling a method on a player with a name matching the plugin (e.g., `player.examplePlugin()`).

However, with class-based plugins, this method acts like a factory function and it is _replaced_ for the current player by the plugin class instance:

```js
// `examplePlugin` has not been called, so it is a factory function.
player.examplePlugin();

// `examplePlugin` is now an instance of `ExamplePlugin`.
player.examplePlugin.someMethodName();
```

With basic plugins, the method does not change - it is always the same function.

### Advanced Features of Class-based Plugins

Up to this point, our example class-based plugin is functionally identical to our example basic plugin. However, class-based plugins bring with them a great deal of benefit that is not built into basic plugins.

#### Events

Like components, class-based plugins offer an implementation of events. This includes:

- The ability to listen for events on the plugin instance using `on` or `one` and stop listening for events using `off`:

  ```js
  player.examplePlugin.on('example-event', function() {
    videojs.log('example plugin received an example-event');
  });
  ```

- The ability to `trigger` custom events on a plugin instance:

  ```js
  player.examplePlugin.trigger('example-event');
  ```

By offering a built-in events system, class-based plugins offer a wider range of options for code structure with a pattern familiar to most web developers.

#### Statefulness

A new concept introduced in Video.js 6 for class-based plugins is _statefulness_. This is similar to React components' `state` property and `setState` method.

Class-based plugin instances each have a `state` property, which is a plain JavaScript object - it can contain any keys and values the plugin author wants.

A default `state` can be provided by adding a static property to a plugin constructor:

```js
ExamplePlugin.defaultState = {
  customClass: 'default-custom-class'
};
```

When the `state` is updated via the `setState` method, the plugin instance fires a `"statechanged"` event, but _only if something changed!_ This event can be used as a signal to update the DOM or perform some other action. Listeners to this event will receive, as a second argument, a hash of changes which occurred on the `state` property:

```js
player.examplePlugin.on('statechanged', function(changes) {
  if (changes.customClass) {
    this
      .removeClass(changes.customClass.from)
      .addClass(changes.customClass.to);
  }
});

player.examplePlugin.setState({customClass: 'another-custom-class'});
```

#### Lifecycle

Like components, class-based plugins have a lifecycle. They can be created with their factory function and they can be destroyed using their `dispose` method:

```js
// set up a example plugin instance
player.examplePlugin();

// dispose of it anytime thereafter
player.examplePlugin.dispose();
```

The `dispose` method has several effects:

- Triggers a `"dispose"` event on the plugin instance.
- Cleans up all event listeners on the plugin instance.
- Removes statefulness, event methods, and references to the player to avoid memory leaks.
- Reverts the player property (e.g. `player.examplePlugin`) _back_ to a factory function, so the plugin can be set up again.

In addition, if the player is disposed, the disposal of all its class-based plugin instances will be triggered as well.

### Advanced Example Class-based Plugin

What follows is a complete ES6 class-based plugin that logs a custom message when the player's state changes between playing and paused. It uses all the described advanced features:

```js
import videojs from 'video.js';

const Plugin = videojs.getPlugin('plugin');

class Advanced extends Plugin {

  constructor(player, options) {
    super(player, options);

    // Whenever the player emits a playing or paused event, we update the
    // state if necessary.
    this.on(player, ['playing', 'paused'], this.updateState);
    this.on('statechanged', this.logState);
  }

  dispose() {
    super();
    videojs.log('the advanced plugin is being disposed');
  }

  updateState() {
    this.setState({playing: !player.paused()});
  }

  logState(changed) {
    videojs.log(`the player is now ${this.state.playing ? 'playing' : 'paused'}`);
  }
}

videojs.registerPlugin('advanced', Advanced);

const player = videojs('example-player');

player.advanced();

// This will begin playback, which will trigger a "playing" event, which will
// update the state of the plugin, which will cause a message to be logged.
player.play();

// This will pause playback, which will trigger a "paused" event, which will
// update the state of the plugin, which will cause a message to be logged.
player.pause();

player.advanced.dispose();

// This will begin playback, but the plugin has been disposed, so it will not
// log any messages.
player.play();
```

This example may be a bit pointless in reality, but it demonstrates the sort of flexibility offered by class-based plugins over basic plugins.

## References

- [Player API][api-player]
- [Plugin API][api-plugin]
- [Plugin Generator][generator]
- [Plugin Conventions][standards]

[api-player]: http://docs.videojs.com/docs/api/player.html
[api-plugin]: http://docs.videojs.com/docs/api/plugin.html
[generator]: https://github.com/videojs/generator-videojs-plugin
[spellbook]: https://github.com/videojs/spellbook
[standards]: https://github.com/videojs/generator-videojs-plugin/blob/master/docs/standards.md
[yeoman]: http://yeoman.io
