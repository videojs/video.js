# Options

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Setting Options](#setting-options)
  - [Setting Global Defaults](#setting-global-defaults)
  - [A Note on `<video>` Tag Attributes](#a-note-on-video-tag-attributes)
  - [Precedence](#precedence)
- [Options Reference](#options-reference)
  - [Standard `<video>` Element Options](#standard-video-element-options)
    - [`autoplay`](#autoplay)
    - [`controls`](#controls)
    - [`height`](#height)
    - [`loop`](#loop)
    - [`muted`](#muted)
    - [`poster`](#poster)
    - [`preload`](#preload)
    - [`src`](#src)
    - [`width`](#width)
  - [Video.js-specific Options](#videojs-specific-options)
    - [`aspectRatio`](#aspectratio)
    - [`children`](#children)
    - [`fluid`](#fluid)
    - [`inactivityTimeout`](#inactivitytimeout)
    - [`language`](#language)
    - [`languages`](#languages)
    - [`notSupportedMessage`](#notsupportedmessage)
    - [`plugins`](#plugins)
    - [`sourceOrder`](#sourceorder)
    - [`sources`](#sources)
    - [`techOrder`](#techorder)
  - [Component Options](#component-options)
    - [`children`](#children-1)
    - [`${componentName}`](#componentname)
  - [Tech Options](#tech-options)
    - [`${techName}`](#techname)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Setting Options

Because Video.js decorates an HTML5 `<video>` element, many of the options available to you are also available as [standard `<video>` tag attributes][video-attrs]:

```html
<video controls autoplay preload="auto" ...>
```

Alternatively, you can use the `data-setup` attribute to provide options as [JSON][json]. This is also how you would set options that aren't standard to the `<video>` element:

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

### Setting Global Defaults

Default options for all players can be found at `videojs.options`. In order to override them, mutate this object as needed. For example, to set `{autoplay: true}` for all players:

```js
videojs.options.autoplay = true;
```

### A Note on `<video>` Tag Attributes

Many attributes are so-called [boolean attributes][boolean-attrs]. This means they are either on or off. In these cases, the attribute _should have no value_ - its presence implies a true value and its absence implies a false value.

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

### Precedence

There are multiple ways to provide options for Video.js, so we should be clear about which methods take precedence. From highest to lowest, the precedence rules are:

1. Options as the second argument to the `videojs` function
1. Options parsed from the `data-setup` attribute
1. `<video>` element attributes and children

For example, given:

```html
<video id="foo" src="foo-1.mp4" data-setup='{"src":"foo-2.mp4"}'></video>
<script>
  videojs('foo', {src: 'foo-3.mp4'});
</script>
```

The `src` option would have the value `'foo-3.mp4'`.

## Options Reference

### Standard `<video>` Element Options

Each of these options is also available as a [standard `<video>` element attribute][video-attrs]; so, they can be defined in all three manners [outlined above](#setting-options). Typically, defaults are not listed as this is left to browser vendors.

#### `autoplay`

> Type: `Boolean`

If `true`/present as an attribute, begins playback automatically.

> **Note:** As of iOS 10, Apple offers `autoplay` support in Safari. For details, refer to ["New <video> Policies for iOS"][ios-10-updates].

#### `controls`

> Type: `Boolean`

Determines whether or not the player has controls that the user can interact with. Without controls the only way to start the video playing is with the `autoplay` attribute or through the Player API.

#### `height`

> Type: `String|Number`

Sets the display height of the video player in pixels.

#### `loop`

> Type: `Boolean`

Causes the video to start over as soon as it ends.

#### `muted`

> Type: `Boolean`

Will silence any audio by default.

#### `poster`

> Type: `String`

A URL to an image that displays before the video begins playing. This is often a frame of the video or a custom title screen. As soon as the user hits "play" the image will go away.

#### `preload`

> Type: `String`

Suggests to the browser whether or not the video data should begin downloading as soon as the `<video>` element is loaded. Supported values are:

- `'auto'`

  Start loading the video immediately (if the browser supports it). Some mobile devices will not preload the video in order to protect their users' bandwidth/data usage. This is why the value is called 'auto' and not something more conclusive like `'true'`.

  _This tends to be the most common and recommended value as it allows the browser to choose the best behavior._

- `'metadata'`

  Load only the meta data of the video, which includes information like the duration and dimensions of the video.

- `'none'`

  Don't preload any data. The browser will wait until the user hits "play" to begin downloading.

#### `src`

> Type: `String`

The source URL to a video source to embed.

#### `width`

> Type: `String|Number`

Sets the display height of the video player in pixels.

### Video.js-specific Options

Each option is `undefined` by default unless otherwise specified.

#### `aspectRatio`

> Type: `String`

Puts the player in [fluid](#fluid) mode and the value is used when calculating the dynamic size of the player. The value should represent a ratio - two numbers separated by a colon (e.g. `"16:9"` or `"4:3"`).

#### `children`

> Type: `Array`

#### `fluid`

> Type: `Boolean`

When `true`, the Video.js player will have a fluid size. In other words, it will scale to fit its container.

Also, if the `<video>` element has the `"vjs-fluid"`, this option is automatically set to `true`.

#### `inactivityTimeout`

> Type: `Number`

Video.js indicates that the user is interacting with the player by way of the `"vjs-user-active"` and `"vjs-user-inactive"` classes and the `"useractive"` event.

The `inactivityTimeout` determines how many milliseconds of inactivity is required before declaring the user inactive. A value of `0` indicates that there is no `inactivityTimeout` and the user will never be considered inactive.

#### `language`

> Type: `String`

A [language code][lang-codes] matching one of the available languages in the player. This sets the initial language for a player, but it can always be changed.

Learn more about [languages in Video.js](languages.md).

#### `languages`

> Type: `Object`

Customize which languages are available in a player. The keys of this object will be [language codes][lang-codes] and the values will be objects with English keys and translated values.

Learn more about [languages in Video.js](languages.md).

> **Note**: Generally, this option is not needed and it would be better to pass your custom languages to `videojs.addLanguage()`, so they are available in all players!

#### `notSupportedMessage`

> Type: `String`

Allows overriding the default message that is displayed when Video.js cannot play back a media source.

#### `plugins`

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

#### `sourceOrder`

> Type: `Boolean`

Tells Video.js to prefer the order of [`sources`](#sources) over [`techOrder`](#techOrder) in selecting a source and playback tech.

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

- for each tech:
  - for each source:
    - if tech can play source, use this tech/source combo

With `sourceOrder: true`, the algorithm becomes:

- for each source:
  - for each tech:
    - if tech can play source, use this tech/source combo

#### `sources`

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

#### `techOrder`

> Type: `Array`, Default: `['html5', 'flash']`

Defines the order in which Video.js techs are preferred. By default, this means that the `Html5` tech is preferred, but Video.js will fall back to `Flash` if no `Html5`-compatible source can be found.

### Component Options

The Video.js player is a component. Like all components, you can define what children it includes, what order they appear in, and what options are passed to them.

This is meant to be a quick reference; so, for more detailed information on components in Video.js, check out the [components guide](components.md).

#### `children`

> Type: `Array|Object`

If an `Array` - which is the default - this is used to determine the order in which children are created on a player.

This can also be passed as an `Object`. In this case, it is used to provide `options` for any/all children.

#### `${componentName}`

> Type: `Object`

Components can be given custom options via the _lower-camel-case variant of the component name_ (e.g. `controlBar` for `ControlBar`). These can be nested in a representation of grandchild relationships. For example, to disable the fullscreen control:

```js
videojs('my-player', {
  controlBar: {
    fullscreenControl: false
  }
});
```

### Tech Options

#### `${techName}`

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

[boolean-attrs]: https://www.w3.org/TR/2011/WD-html5-20110525/common-microsyntaxes.html#boolean-attributes
[ios-10-updates]: https://webkit.org/blog/6784/new-video-policies-for-ios/
[json]: http://json.org/example.html
[lang-codes]: http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
[video-attrs]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Attributes
