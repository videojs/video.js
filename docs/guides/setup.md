# Video.js Setup

## Table of Contents

* [Getting Video.js](#getting-videojs)
* [Creating a Player](#creating-a-player)
  * [Automatic Setup](#automatic-setup)
  * [Manual Setup](#manual-setup)
* [Options](#options)
  * [Global Defaults](#global-defaults)
  * [A Note on &lt;video> Tag Attributes](#a-note-on-video-tag-attributes)
* [Player Readiness](#player-readiness)
* [Advanced Player Workflows](#advanced-player-workflows)

## Getting Video.js

Video.js is officially available via CDN and npm.

Video.js works out of the box with not only HTML `<script>` and `<link>` tags, but also all major bundlers/packagers/builders, such as Browserify, Node, WebPack, etc.

Please refer to the [Getting Started][getting-started] document for details.

## Creating a Player

> **Note:** Video.js works with `<video>` _and_ `<audio>` elements, but for simplicity we'll refer only to `<video>` elements going forward.

Once you have Video.js [loaded on your page][getting-started], you're ready to create a player!

The core strength of Video.js is that it decorates a [standard `<video>` element][w3c-video] and emulates its associated [events and APIs][w3c-media-events], while providing a customizable DOM-based UI.

Video.js supports all attributes of the `<video>` element (such as `controls`, `preload`, etc), but it also supports [its own options](#options). There are two ways to create a Video.js player and pass it options, but they both start with a standard `<video>` element with the attribute `class="video-js"`:

```html
<video class="video-js">
  <source src="//vjs.zencdn.net/v/oceans.mp4" type="video/mp4">
  <source src="//vjs.zencdn.net/v/oceans.webm" type="video/webm">
</video>
```

### Automatic Setup

By default, when your web page finishes loading, Video.js will scan for media elements that have the `data-setup` attribute. The `data-setup` attribute is used to pass options to Video.js. A minimal example looks like this:

```html
<video class="video-js" data-setup='{}'>
  <source src="//vjs.zencdn.net/v/oceans.mp4" type="video/mp4">
  <source src="//vjs.zencdn.net/v/oceans.webm" type="video/webm">
</video>
```

> **Note:** You _must_ use single-quotes with `data-setup` as it is expected to contain JSON.

### Manual Setup

On the modern web, a `<video>` element often does not exist when the page finishes loading. In these cases, automatic setup is not possible, but manual setup is available via [the `videojs` function][videojs].

One way to call this function is by providing it a string matching a `<video>` element's `id` attribute:

```html
<video id="my-player" class="video-js">
  <source src="//vjs.zencdn.net/v/oceans.mp4" type="video/mp4">
  <source src="//vjs.zencdn.net/v/oceans.webm" type="video/webm">
</video>
```

```js
videojs('my-player');
```

However, using an `id` attribute isn't always practical; so, the `videojs` function accepts a DOM element instead:

```html
<video class="video-js">
  <source src="//vjs.zencdn.net/v/oceans.mp4" type="video/mp4">
  <source src="//vjs.zencdn.net/v/oceans.webm" type="video/webm">
</video>
```

```js
videojs(document.querySelector('.video-js'));
```

## Options

> **Note:** This guide only covers how to pass options during player setup. For a complete reference on _all_ available options, see the [options guide](/docs/guides/options.md).

There are three ways to pass options to Video.js. Because Video.js decorates an HTML5 `<video>` element, many of the options available are also available as [standard `<video>` tag attributes][video-attrs]:

```html
<video controls autoplay preload="auto" ...>
```

Alternatively, you can use the `data-setup` attribute to pass options as [JSON][json]. This is also how you would set options that aren't standard to the `<video>` element:

```html
<video data-setup='{"controls": true, "autoplay": false, "preload": "auto"}'...>
```

Finally, if you're not using the `data-setup` attribute to trigger the player setup, you can pass in an object of player options as the second argument to the `videojs` function:

```js
videojs('my-player', {
  controls: true,
  autoplay: false,
  preload: 'auto'
});
```

### Global Defaults

Default options for all players can be found at `videojs.options` and can be changed directly. For example, to set `{autoplay: true}` for all future players:

```js
videojs.options.autoplay = true;
```

### A Note on `<video>` Tag Attributes

Many attributes are so-called [boolean attributes][boolean-attrs]. This means they are either on or off. In these cases, the attribute _should have no value_ (or should have its name as its value) - its presence implies a true value and its absence implies a false value.

_These are incorrect:_

```html
<video controls="true" ...>
<video loop="true" ...>
<video controls="false" ...>
```

> **Note:** The example with `controls="false"` can be a point of confusion for new developers - it will actually turn controls _on_!

These are correct:

```html
<video controls ...>
<video loop="loop" ...>
<video ...>
```

## Player Readiness

Because Video.js techs have the potential to be loaded asynchronously, it isn't always safe to interact with a player immediately upon setup. For this reason, Video.js players have a concept of "readiness" which will be familiar to anyone who has used jQuery before.

Essentially, any number of ready callbacks can be defined for a Video.js player. There are three ways to pass these callbacks. In each example, we'll add an identical class to the player:

Pass a callback to the `videojs()` function as a third argument:

```js
// Passing `null` for the options argument.
videojs('my-player', null, function() {
  this.addClass('my-example');
});
```

Pass a callback to a player's `ready()` method:

```js
var player = videojs('my-player');

player.ready(function() {
  this.addClass('my-example');
});
```

Listen for the player's `"ready"` event:

```js
var player = videojs('my-player');

player.on('ready', function() {
  this.addClass('my-example');
});
```

In each case, the callback is called asynchronously - _even if the player is already ready!_

## Advanced Player Workflows

For a discussion of more advanced player workflows, see the [player workflows guide][player-workflows].

[player-workflows]: /docs/guides/player-workflows.md

[boolean-attrs]: https://www.w3.org/TR/2011/WD-html5-20110525/common-microsyntaxes.html#boolean-attributes

[getting-started]: http://videojs.com/getting-started/

[json]: http://json.org/example.html

[video-attrs]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Attributes

[videojs]: http://docs.videojs.com/module-videojs.html

[w3c-media-events]: https://www.w3.org/2010/05/video/mediaevents.html

[w3c-video]: http://www.w3.org/TR/html5/embedded-content-0.html#the-video-element
