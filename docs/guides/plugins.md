# Video.js Plugins

One of the great strengths of Video.js is its ecosystem of plugins that allow authors from all over the world to share their video player customizations. This includes everything from the simplest UI tweaks to new [playback technologies and source handlers][tech]!

Because we view plugins as such an important part of Video.js, the organization is committed to maintaining a robust set of tools for plugin authorship:

* [generator-videojs-plugin][generator]

  A [Yeoman][yeoman] generator for scaffolding a Video.js plugin project. Additionally, it offers a set of [conventions for plugin authorship][standards] that, if followed, make authorship, contribution, and usage consistent and predictable.

  In short, the generator sets up plugin authors to focus on writing their plugin - not messing with tools.

* [videojs-spellbook][spellbook]

  As of version 3, the plugin generator includes a new dependency: [videojs-spellbook][spellbook]. Spellbook is a kitchen sink plugin development tool: it builds plugins, creates tags, runs a development server, and more.

  The benefit of Spellbook is that you can run the generator _once_ and receive updates and bugfixes in Spellbook without having to run the generator again and deal with Yeoman conflicts and other headaches.

  As long as your plugin project follows the [conventions][standards], Spellbook should work on it!

## Writing a Basic Plugin

If you've written a Video.js plugin before, the basic plugin concept should be familiar. It's similar to a jQuery plugin in that the core idea is that you're adding a method to the player.

### Write a JavaScript Function

A basic plugin is a plain JavaScript function:

```js
function examplePlugin(options) {

  if (options.customClass) {
    this.addClass(options.customClass);
  }

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

After that, any player will automatically have an `examplePlugin` method on its prototype!

> **Note:** The only stipulation with the name of the plugin is that it cannot conflict with any existing plugin or player method.

## Writing an Advanced Plugin

Video.js 6 introduces advanced plugins: these are plugins that share a similar API with basic plugins, but are class-based and offer a range of extra features out of the box.

While reading the following sections, you may want to refer to the [Plugin API docs][api-plugin] for more detail.

### Write a JavaScript Class/Constructor

If you're familiar with creating [components][components], this process is similar. An advanced plugin starts with a JavaScript class (a.k.a. a constructor function).

If you're using ES6 already, you can use that syntax with your transpiler/language of choice (Babel, TypeScript, etc):

```js
const Plugin = videojs.getPlugin('plugin');

class ExamplePlugin extends Plugin {

  constructor(player, options) {
    super(player, options);

    if (options.customClass) {
      player.addClass(options.customClass);
    }

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
    Plugin.call(this, player, options);

    if (options.customClass) {
      player.addClass(options.customClass);
    }

    player.on('playing', function() {
      videojs.log('playback began!');
    });
  }
});
```

For now, this example advanced plugin does the exact same thing as the basic plugin described above - not to worry, we will make it more interesting as we continue!

### Register a Advanced Plugin

The registration process for advanced plugins is identical to [the process for basic plugins](#register-a-basic-plugin).

```js
videojs.registerPlugin('examplePlugin', ExamplePlugin);
```

> **Note:** Because ES6 classes are syntactic sugar on top of existing constructor function and prototype architecture in JavaScript, in all cases `registerPlugin`'s second argument is a function.

### Key Differences from Basic Plugins

Advanced plugins have two key differences from basic plugins that are important to understand before describing their advanced features.

#### The Value of `this`

With basic plugins, the value of `this` in the plugin function will be the _player_.

With advanced plugins, the value of `this` is the _instance of the plugin class_. The player is passed to the plugin constructor as its first argument (and is automatically applied to the plugin instance as the `player` property) and any further arguments are passed after that.

#### The Player Plugin Name Property

Both basic plugins and advanced plugins are set up by calling a method on a player with a name matching the plugin (e.g., `player.examplePlugin()`).

However, with advanced plugins, this method acts like a factory function and it is _replaced_ for the current player by a new function which returns the plugin instance:

```js
// `examplePlugin` has not been called, so it is a factory function.
player.examplePlugin();

// `examplePlugin` is now a function that returns the same instance of
// `ExamplePlugin` that was generated by the previous call.
player.examplePlugin().someMethodName();
```

With basic plugins, the method does not change - it is always the same function. It is up to the authors of basic plugins to deal with multiple calls to their plugin function.

### Features of Advanced Plugins

Up to this point, our example advanced plugin is functionally identical to our example basic plugin. However, advanced plugins bring with them a great deal of benefit that is not built into basic plugins.

#### Events

Like components, advanced plugins offer an implementation of events. This includes:

* The ability to listen for events on the plugin instance using `on` or `one`:

  ```js
  player.examplePlugin().on('example-event', function() {
    videojs.log('example plugin received an example-event');
  });
  ```

* The ability to `trigger` custom events on a plugin instance:

  ```js
  player.examplePlugin().trigger('example-event');
  ```

* The ability to stop listening to custom events on a plugin instance using `off`:

  ```js
  player.examplePlugin().off('example-event');
  ```

By offering a built-in events system, advanced plugins offer a wider range of options for code structure with a pattern familiar to most web developers.

##### Extra Event Data

All events triggered by plugins include an additional data object as a second argument. This object has three properties:

- `name`: The name of the plugin (e.g. `"examplePlugin"`) as a string.
- `plugin`: The plugin constructor (e.g. `ExamplePlugin`).
- `instance`: The plugin constructor instance.

#### Statefulness

A new concept introduced for advanced plugins is _statefulness_. This is similar to React components' `state` property and `setState` method.

Advanced plugin instances each have a `state` property, which is a plain JavaScript object - it can contain any keys and values the plugin author wants.

A default `state` can be provided by adding a static property to a plugin constructor:

```js
ExamplePlugin.defaultState = {
  customClass: 'default-custom-class'
};
```

When the `state` is updated via the `setState` method, the plugin instance fires a `"statechanged"` event, but _only if something changed!_ This event can be used as a signal to update the DOM or perform some other action. The event object passed to listeners for this event includes, an object describing the changes that occurred on the `state` property:

```js
player.examplePlugin().on('statechanged', function(e) {
  if (e.changes && e.changes.customClass) {
    this.player
      .removeClass(e.changes.customClass.from)
      .addClass(e.changes.customClass.to);
  }
});

player.examplePlugin().setState({customClass: 'another-custom-class'});
```

#### Lifecycle

Like components, advanced plugins have a lifecycle. They can be created with their factory function and they can be destroyed using their `dispose` method:

```js
// set up a example plugin instance
player.examplePlugin();

// dispose of it anytime thereafter
player.examplePlugin().dispose();
```

The `dispose` method has several effects:

* Triggers a `"dispose"` event on the plugin instance.
* Cleans up all event listeners on the plugin instance, which helps avoid errors caused by events being triggered after an object is cleaned up.
* Removes plugin state and references to the player to avoid memory leaks.
* Reverts the player's named property (e.g. `player.examplePlugin`) _back_ to the original factory function, so the plugin can be set up again.

In addition, if the player is disposed, the disposal of all its advanced plugin instances will be triggered as well.

### Advanced Example Advanced Plugin

What follows is a complete ES6 advanced plugin that logs a custom message when the player's state changes between playing and paused. It uses all the described advanced features:

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
    super.dispose();
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

player.advanced().dispose();

// This will begin playback, but the plugin has been disposed, so it will not
// log any messages.
player.play();
```

This example may be a bit pointless in reality, but it demonstrates the sort of flexibility offered by advanced plugins over basic plugins.

## Setting up a Plugin

There are two ways to set up (or initialize) a plugin on a player. Both ways work identically for both basic and advanced plugins.

The first way is during creation of the player. Using the `plugins` option, a plugin can be automatically set up on a player:

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

These two methods are functionally identical - use whichever you prefer!

### Plugin Setup Events

Occasionally, a use-case arises where some code needs to wait for a plugin to be initialized. As of Video.js 6, this can be achieved by listening for `pluginsetup` events on the player.

For any given plugin initialization, there are four events to be aware of:

- `beforepluginsetup`: Triggered immediately before any plugin is initialized.
- `beforepluginsetup:examplePlugin` Triggered immediately before the `examplePlugin` is initialized.
- `pluginsetup`: Triggered after any plugin is initialized.
- `pluginsetup:examplePlugin`: Triggered after he `examplePlugin` is initialized.

These events work for both basic and advanced plugins. They are triggered on the player and each includes an object of [extra event data](#extra-event-data) as a second argument to its listeners.

## References

* [Player API][api-player]
* [Plugin API][api-plugin]
* [Plugin Generator][generator]
* [Plugin Conventions][standards]

[components]: /docs/guides/components.md

[tech]: /docs/guides/tech.md

[api-player]: http://docs.videojs.com/Player.html

[api-plugin]: http://docs.videojs.com/Plugin.html

[generator]: https://github.com/videojs/generator-videojs-plugin

[spellbook]: https://github.com/videojs/spellbook

[standards]: https://github.com/videojs/generator-videojs-plugin/blob/master/docs/standards.md

[yeoman]: http://yeoman.io
