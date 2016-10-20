# Video.js Setup

## Installing Video.js

Video.js is officially available via CDN, npm, and Bower.

Please refer to the [Getting Started][getting-started] document for details.

## Decorating a `<video>` Element

Once you have Video.js [loaded on your page][getting-started], you're ready to create a player!

> Note: Video.js works with `<video>` _and_ `<audio>` elements, but for simplicity we'll refer only to `<video>` elements going forward!

The core strength of Video.js is that it decorates a [standard `<video>` element][w3c-video] and emulates its associated [events and APIs][w3c-media-events], while providing a customizable DOM-based UI.

Video.js supports all attributes of the `<video>` element (such as `controls`, `preload`, etc), but it also supports [its own options][options]. There are two ways to create a Video.js player and pass it options, but they both start with a standard `<video>` element with the attribute `class="video-js"`:

```html
<video class="video-js">
  <source src="//vjs.zencdn.net/v/oceans.mp4" type="video/mp4">
  <source src="//vjs.zencdn.net/v/oceans.webm" type="video/webm">
</video>
```

### Automatic Setup

By default, when your web page finishes loading, Video.js will scan for media elements that have the `data-setup` attribute. The `data-setup` attribute is used to provide [options][options] to Video.js. The minimum example looks like this:

```html
<video class="video-js" data-setup='{}'>
  <source src="//vjs.zencdn.net/v/oceans.mp4" type="video/mp4">
  <source src="//vjs.zencdn.net/v/oceans.webm" type="video/webm">
</video>
```

> Note: You **must** use single-quotes with `data-setup` as it is expected to contain JSON and it **must** contain `'{}'` at a minimum!

### Manual Setup

From updating the DOM via standard APIs to full-fledged frameworks like React and Ember, a `<video>` element often does not exist when the page finishes loading. In these cases, automatic setup is not possible, but manual setup is available via [the `videojs` function][videojs].

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

Using an `id` attribute isn't always practical when your DOM is generated programmatically. In that case, Video.js accepts a DOM element instead:

```html
<video class="video-js">
  <source src="//vjs.zencdn.net/v/oceans.mp4" type="video/mp4">
  <source src="//vjs.zencdn.net/v/oceans.webm" type="video/webm">
</video>
```

```js
videojs(document.querySelector('.video-js'));
```

Regardless, in either case, the `data-setup` attribute is still supported for providing [options][options] to Video.js. Additionally, the `videojs` function can take options as its second argument.


[getting-started]: http://videojs.com/getting-started/
[options]: options.md
[videojs]: http://docs.videojs.com/docs/api/video.html
[w3c-media-events]: https://www.w3.org/2010/05/video/mediaevents.html
[w3c-video]: http://www.w3.org/TR/html5/embedded-content-0.html#the-video-element
