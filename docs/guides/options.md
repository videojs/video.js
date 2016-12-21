# Video.js Options Reference

> **Note:** This document is only a reference for available options. To learn about passing options to Video.js, see [the setup guide](setup.md#options).

## Table of Contents

* [Standard &lt;video> Element Options](#standard-video-element-options)
  * [autoplay](#autoplay)
  * [controls](#controls)
  * [height](#height)
  * [loop](#loop)
  * [muted](#muted)
  * [poster](#poster)
  * [preload](#preload)
    * ['auto'](#auto)
    * ['metadata'](#metadata)
    * ['none'](#none)
  * [src](#src)
  * [width](#width)
* [Video.js-specific Options](#videojs-specific-options)
  * [aspectRatio](#aspectratio)
  * [children](#children)
  * [fluid](#fluid)
  * [inactivityTimeout](#inactivitytimeout)
  * [language](#language)
  * [languages](#languages)
  * [nativeControlsForTouch](#nativecontrolsfortouch)
  * [notSupportedMessage](#notsupportedmessage)
  * [plugins](#plugins)
  * [sourceOrder](#sourceorder)
  * [sources](#sources)
  * [techOrder](#techorder)
  * [vtt.js](#vttjs)
* [Component Options](#component-options)
  * [children](#children-1)
  * [${componentName}](#componentname)
* [Tech Options](#tech-options)
  * [${techName}](#techname)
    * [nativeControlsForTouch](#nativecontrolsfortouch-1)
    * [nativeTextTracks](#nativetexttracks)

## Standard `<video>` Element Options

Each of these options is also available as a [standard `<video>` element attribute][video-attrs]; so, they can be defined in all three manners [outlined in the setup guide](setup.md#options). Typically, defaults are not listed as this is left to browser vendors.

### `autoplay`

> Type: `boolean`

If `true`/present as an attribute, begins playback when the player is ready.

> **Note:** As of iOS 10, Apple offers `autoplay` support in Safari. For details, refer to ["New <video> Policies for iOS"][ios-10-updates].

### `controls`

> Type: `boolean`

Determines whether or not the player has controls that the user can interact with. Without controls the only way to start the video playing is with the `autoplay` attribute or through the Player API.

### `height`

> Type: `string|number`

Sets the display height of the video player in pixels.

### `loop`

> Type: `boolean`

Causes the video to start over as soon as it ends.

### `muted`

> Type: `boolean`

Will silence any audio by default.

### `poster`

> Type: `string`

A URL to an image that displays before the video begins playing. This is often a frame of the video or a custom title screen. As soon as the user hits "play" the image will go away.

### `preload`

> Type: `string`

Suggests to the browser whether or not the video data should begin downloading as soon as the `<video>` element is loaded. Supported values are:

#### `'auto'`

Start loading the video immediately (if the browser supports it). Some mobile devices will not preload the video in order to protect their users' bandwidth/data usage. This is why the value is called 'auto' and not something more conclusive like `'true'`.

_This tends to be the most common and recommended value as it allows the browser to choose the best behavior._

#### `'metadata'`

Load only the meta data of the video, which includes information like the duration and dimensions of the video. Sometimes, the meta data will be loaded by downloading a few frames of video.

#### `'none'`

Don't preload any data. The browser will wait until the user hits "play" to begin downloading.

### `src`

> Type: `string`

The source URL to a video source to embed.

### `width`

> Type: `string|number`

Sets the display height of the video player in pixels.

## Video.js-specific Options

Each option is `undefined` by default unless otherwise specified.

### `aspectRatio`

> Type: `string`

Puts the player in [fluid](#fluid) mode and the value is used when calculating the dynamic size of the player. The value should represent a ratio - two numbers separated by a colon (e.g. `"16:9"` or `"4:3"`).

### `children`

> Type: `Array|Object`

This option is inherited from the [`Component` base class](#component-options).

### `fluid`

> Type: `boolean`

When `true`, the Video.js player will have a fluid size. In other words, it will scale to fit its container.

Also, if the `<video>` element has the `"vjs-fluid"`, this option is automatically set to `true`.

### `inactivityTimeout`

> Type: `number`

Video.js indicates that the user is interacting with the player by way of the `"vjs-user-active"` and `"vjs-user-inactive"` classes and the `"useractive"` event.

The `inactivityTimeout` determines how many milliseconds of inactivity is required before declaring the user inactive. A value of `0` indicates that there is no `inactivityTimeout` and the user will never be considered inactive.

### `language`

> Type: `string`, Default: browser default or `'en'`

A [language code][lang-codes] matching one of the available languages in the player. This sets the initial language for a player, but it can always be changed.

Learn more about [languages in Video.js](languages.md).

### `languages`

> Type: `Object`

Customize which languages are available in a player. The keys of this object will be [language codes][lang-codes] and the values will be objects with English keys and translated values.

Learn more about [languages in Video.js](languages.md).

> **Note**: Generally, this option is not needed and it would be better to pass your custom languages to `videojs.addLanguage()`, so they are available in all players!

### `nativeControlsForTouch`

> Type: `boolean`

Explicitly set a default value for [the associated tech option](#nativecontrolsfortouch).

### `notSupportedMessage`

> Type: `string`

Allows overriding the default message that is displayed when Video.js cannot play back a media source.

### `plugins`

> Type: `Object`

This supports having plugins be initialized automatically with custom options when the player is initialized - rather than requiring you to initialize them manually.

```js
videojs('my-player', {
  plugins: {
    foo: {bar: true},
    boo: {baz: false}
  }
});
```

The above is roughly equivalent to:

```js
var player = videojs('my-player');

player.foo({bar: true});
player.boo({baz: false});
```

Although, since the `plugins` option is an object, the order of initialization is not guaranteed!

See [the plugins guide](plugins.md) for more information on Video.js plugins.

### `sourceOrder`

> Type: `boolean`, Default: `false`
>
> **Note:** In video.js 6.0, this option will default to `true`.

Tells Video.js to prefer the order of [`sources`](#sources) over [`techOrder`](#techorder) in selecting a source and playback tech.

Given the following example:

```js
videojs('my-player', {
  sourceOrder: true,
  sources: [{
    src: '//path/to/video.flv',
    type: 'video/x-flv'
  }, {
    src: '//path/to/video.mp4',
    type: 'video/mp4'
  }, {
    src: '//path/to/video.webm',
    type: 'video/webm'
  }],
  techOrder: ['html5', 'flash']
});
```

Normally, the fact that HTML5 comes before Flash in the `techOrder` would mean Video.js would look for a compatible _source_ for HTML5 and would pick either the MP4 or WebM video (depending on browser support) only falling back to Flash if no compatible source for HTML5 was found.

However, because the `sourceOrder` is `true`, Video.js flips that process around. It will look for a compatible _tech_ for each source in order. Presumably, it would first find a match between the FLV (since it's first in the source order) and the Flash tech.

In summary, the default algorithm is:

* for each tech:
  * for each source:
    * if tech can play source, use this tech/source combo

With `sourceOrder: true`, the algorithm becomes:

* for each source:
  * for each tech:
    * if tech can play source, use this tech/source combo

### `sources`

> Type: `Array`

An array of objects that mirror the native `<video>` element's capability to have a series of child `<source>` elements. This should be an array of objects with the `src` and `type` properties. For example:

```js
videojs('my-player', {
  sources: [{
    src: '//path/to/video.mp4',
    type: 'video/mp4'
  }, {
    src: '//path/to/video.webm',
    type: 'video/webm'
  }]
});
```

Using `<source>` elements will have the same effect:

```html
<video ...>
  <source src="//path/to/video.mp4" type="video/mp4">
  <source src="//path/to/video.webm" type="video/webm">
</video>
```

### `techOrder`

> Type: `Array`, Default: `['html5', 'flash']`

Defines the order in which Video.js techs are preferred. By default, this means that the `Html5` tech is preferred, but Video.js will fall back to `Flash` if no `Html5`-compatible source can be found.

### `vtt.js`

> Type: `string`

Allows overriding the default URL to vtt.js, which may be loaded asynchronously to polyfill support for `WebVTT`.

This option will be used in the "novtt" build of video.js (i.e. `video.novtt.js`). Otherwise, vtt.js is bundled with video.js.

## Component Options

The Video.js player is a component. Like all components, you can define what children it includes, what order they appear in, and what options are passed to them.

This is meant to be a quick reference; so, for more detailed information on components in Video.js, check out the [components guide](components.md).

### `children`

> Type: `Array|Object`

If an `Array` - which is the default - this is used to determine which children (by component name) and in which order they are created on a player (or other component):

```js
// The following code creates a player with ONLY bigPlayButton and
// controlBar child components.
videojs('my-player', {
  children: [
    'bigPlayButton',
    'controlBar'
  ]
});
```

The `children` options can also be passed as an `Object`. In this case, it is used to provide `options` for any/all children, including disabling them with `false`:

```js
// This player's ONLY child will be the controlBar. Clearly, this is not the
// ideal method for disabling a grandchild!
videojs('my-player', {
  children: {
    controlBar: {
      fullscreenControl: false
    }
  }
});
```

### `${componentName}`

> Type: `Object`

Components can be given custom options via the _lower-camel-case variant of the component name_ (e.g. `controlBar` for `ControlBar`). These can be nested in a representation of grandchild relationships. For example, to disable the fullscreen control:

```js
videojs('my-player', {
  controlBar: {
    fullscreenControl: false
  }
});
```

## Tech Options

### `${techName}`

> Type: `Object`

Video.js playback technologies (i.e. "techs") can be given custom options as part of the options passed to the `videojs` function. They should be passed under the _lower-case variant of the tech name_ (e.g. `"flash"` or `"html5"`).

This is not used in most implementations, but one case where it may be is dictating where the Video.js SWF file is located for the `Flash` tech:

```js
videojs('my-player', {
  flash: {
    swf: '//path/to/videojs.swf'
  }
});
```

However, this is a case where changing the global defaults is more useful:

```js
videojs.options.flash.swf = '//path/to/videojs.swf'
```

#### `nativeControlsForTouch`

> Type: `boolean`

Only supported by the `Html5` tech, this option can be set to `true` to force native controls for touch devices.

#### `nativeTextTracks`

> Type: `boolean`

Can be set to `false` to force emulation of text tracks instead of native support. The `nativeCaptions` option also exists, but is simply an alias to `nativeTextTracks`.

[ios-10-updates]: https://webkit.org/blog/6784/new-video-policies-for-ios/

[lang-codes]: http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry

[video-attrs]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Attributes
