# How to Embed the Video.js player

Video.js is meant to be an enhancement to the video element in HTML5 and for years, its embed code has been just a `<video>` element.
Video.js then wraps the video element in a div that is used for us to place controls and anything else that's required for the player.

For a long time this was enough. In 2016, "div ingest" was added, and it allows the developer to give Video.js a player div to use instead of making it's own.
This is partly to help with content reflow but also to help with iOS where you sometimes need to prime the video element and we re-create the video element when we create the player div.
However, this is kind of weird to have a `<video>` element embed with a `<div>` wrapped around it. So, we built out a new embed, a `<video-js>` embed.

Below, the three kinds of embeds are detailed.

## Embeds

### `<video>` embed

The classic Video.js embed. You can then initialize it via `data-setup` or via the `videojs` method.

```html
<!-- via data-setup -->
<video id="vid1" class="video-js" data-setup='{}'>
  <source src="//vjs.zencdn.net/v/oceans.mp4">
</video>

<!-- via code -->
<video id="vid1" class="video-js">
  <source src="//vjs.zencdn.net/v/oceans.mp4">
</video>
```

```js
const player = videojs('vid1', {});
```

### Player div ingest

The enhanced classic embed. You can also initialize it via `data-setup` or via the `videojs` method.

```html
<!-- via data-setup -->
<div data-vjs-player>
  <video id="vid1" class="video-js" data-setup='{}'>
    <source src="//vjs.zencdn.net/v/oceans.mp4">
  </video>
</div>

<!-- via code -->
<div data-vjs-player>
  <video id="vid1" class="video-js">
    <source src="//vjs.zencdn.net/v/oceans.mp4">
  </video>
</div>
```

```js
const player = videojs('vid1', {});
```

As you can see, it isn't much different from the classic `<video>` embed. It also does make it easier to work with [React](/docs/guides/react.md).

### `<video-js>` embed

This is the [I Can't Believe It's Not Custom Elements](https://developers.google.com/web/fundamentals/web-components/customelements) embed code.
It looks very much like the `<video>` embed but instead of `video` it's a `video-js` embed.
This is useful for all the things that the player div ingest is useful for and it matches our library name!

```html
<!-- via data-setup -->
<video-js id="vid1" data-setup='{}'>
  <source src="//vjs.zencdn.net/v/oceans.mp4">
</video-js>

<!-- via code -->
<video-js id="vid1">
  <source src="//vjs.zencdn.net/v/oceans.mp4">
</video-js>
```

```js
const player = videojs('vid1', {});
```

Adding `class="video-js"` with this embed is no longer necessary as it will automatically add the class `video-js` if missing.

#### Custom Elements

Native Custom Elements support is relatively small according to [Can I Use](https://caniuse.com/#feat=custom-elementsv1) and because we didn't want to include a polyfill we're going with just an element called `video-js` rather than a full blown custom element.

## data-setup

This is an ease-of-use method for having Video.js set up the player automatically. It is an HTML attribute and it takes a JSON string representation of the [player options](/docs/guides/options.md) as the value.
Using the programmatic approach is probably preferable.
