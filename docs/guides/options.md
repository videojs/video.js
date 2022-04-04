# Video.js Options Reference

> **Note:** This document is only a reference for available options. To learn about passing options to Video.js, see [the setup guide](/docs/guides/setup.md#options).

## Table of Contents

* [Standard &lt;video> Element Options](#standard-video-element-options)
  * [autoplay](#autoplay)
    * [More info on autoplay support and changes:](#more-info-on-autoplay-support-and-changes)
  * [controlBar.remainingTimeDisplay.displayNegative](#controlbarremainingtimedisplaydisplaynegative)
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
  * [autoSetup](#autosetup)
  * [breakpoints](#breakpoints)
  * [children](#children)
  * [fluid](#fluid)
  * [inactivityTimeout](#inactivitytimeout)
  * [language](#language)
  * [languages](#languages)
  * [liveui](#liveui)
  * [liveTracker.trackingThreshold](#livetrackertrackingthreshold)
  * [liveTracker.liveTolerance](#livetrackerlivetolerance)
  * [nativeControlsForTouch](#nativecontrolsfortouch)
  * [normalizeAutoplay](#normalizeautoplay)
  * [notSupportedMessage](#notsupportedmessage)
  * [noUITitleAttributes](#nouititleattributes)
  * [fullscreen](#fullscreen)
    * [options](#options)
  * [playbackRates](#playbackrates)
  * [plugins](#plugins)
  * [preferFullWindow](#preferfullwindow)
  * [responsive](#responsive)
  * [sources](#sources)
  * [suppressNotSupportedError](#suppressnotsupportederror)
  * [techCanOverridePoster](#techcanoverrideposter)
  * [techOrder](#techorder)
  * [userActions](#useractions)
  * [userActions.click](#useractionsclick)
  * [userActions.doubleClick](#useractionsdoubleclick)
  * [userActions.hotkeys](#useractionshotkeys)
  * [userActions.hotkeys.fullscreenKey](#useractionshotkeysfullscreenkey)
  * [userActions.hotkeys.muteKey](#useractionshotkeysmutekey)
  * [userActions.hotkeys.playPauseKey](#useractionshotkeysplaypausekey)
  * [vtt.js](#vttjs)
* [Component Options](#component-options)
  * [children](#children-1)
  * [${componentName}](#componentname)
* [Tech Options](#tech-options)
  * [${techName}](#techname)
  * [html5](#html5)
    * [nativeControlsForTouch](#nativecontrolsfortouch-1)
    * [nativeAudioTracks](#nativeaudiotracks)
    * [nativeTextTracks](#nativetexttracks)
    * [nativeVideoTracks](#nativevideotracks)
    * [preloadTextTracks](#preloadtexttracks)

## Standard `<video>` Element Options

Each of these options is also available as a [standard `<video>` element attribute][video-attrs]; so, they can be defined in all three manners [outlined in the setup guide](/docs/guides/setup.md#options). Typically, defaults are not listed as this is left to browser vendors.

### `autoplay`

> Type: `boolean|string`
> NOTE: At this point, the autoplay attribute and option are NOT a guarantee that your video will autoplay.
> NOTE2: If there is an attribute on the media element the option will be ignored.
> NOTE3: You cannot pass a string value in the attribute, you must pass it in the videojs options

Instead of using the `autoplay` attribute you should pass an `autoplay` option to the `videojs` function. The following values
are valid:

* a boolean value of `false`: the same as having no attribute on the video element, won't `autoplay`
* a boolean value of `true`: the same as having attribute on the video element, will use browsers `autoplay`
* a string value of `'muted'`: will mute the video element and then manually call `play()` on `loadstart`. This is likely to work.
* a string value of `'play'`: will call `play()` on `loadstart`, similar to browsers `autoplay`
* a string value of `'any'`: will call `play()` on `loadstart` and if the promise is rejected it will mute the video element then call `play()`.

To pass the option

```js
var player = videojs('my-video', {
  autoplay: 'muted'
});

// or

player.autoplay('muted');
```

#### More info on autoplay support and changes:

* See our blog post: [Autoplay Best Practices with Video.js](https://videojs.com/blog/autoplay-best-practices-with-video-js/)

### `controlBar.remainingTimeDisplay.displayNegative`

> Type: `boolean`

Bu default the remaining time display shows as negative time. To not show the negative sign set `controlBar.remainingTimeDisplay.displayNegative` to `false`.

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

Sets the display width of the video player in pixels.

## Video.js-specific Options

Each option is `undefined` by default unless otherwise specified.

### `aspectRatio`

> Type: `string`

Puts the player in [fluid](#fluid) mode and the value is used when calculating the dynamic size of the player. The value should represent a ratio - two numbers separated by a colon (e.g. `"16:9"` or `"4:3"`).

Alternatively, the classes `vjs-16-9`, `vjs-9-16`, `vjs-4-3` or `vjs-1-1` can be added to the player.

### `autoSetup`

> Type: `boolean`

Prevents the player from running the autoSetup for media elements with `data-setup` attribute.

> **Note**: this must be set globally with `videojs.options.autoSetup = false` in the same tick as videojs source is loaded to take effect.

### `breakpoints`

> Type: `Object`

When used with the [`responsive` option](#responsive), sets breakpoints that will configure how class names are toggled on the player to adjust the UI based on the player's dimensions.

By default, the breakpoints are:

| Class Name           | Width Range |
| -------------------- | ----------- |
| `vjs-layout-tiny`    | 0-210       |
| `vjs-layout-x-small` | 211-320     |
| `vjs-layout-small`   | 321-425     |
| `vjs-layout-medium`  | 426-768     |
| `vjs-layout-large`   | 769-1440    |
| `vjs-layout-x-large` | 1441-2560   |
| `vjs-layout-huge`    | 2561+       |

While the class names cannot be changed, the width ranges can be configured via an object like this:

```js
breakpoints: {
  tiny: 300,
  xsmall: 400,
  small: 500,
  medium: 600,
  large: 700,
  xlarge: 800,
  huge: 900
}
```

* The _keys_ of the `breakpoints` object are derived from the associated class names by removing the `vjs-layout-` prefix and any `-` characters.
* The _values_ of the `breakpoints` object define the max width for a range.
* Not all keys need to be defined. You can easily override a single breakpoint by passing an object with one key/value pair! Customized breakpoints will be merged with default breakpoints when the player is created.

When the player's size changes, the merged breakpoints will be inspected in the size order until a matching breakpoint is found.

That breakpoint's associated class name will be added as a class to the player. The previous breakpoint's class will be removed.

See the file `sandbox/responsive.html.example` for an example of a responsive player using the default breakpoints.

### `children`

> Type: `Array|Object`

This option is inherited from the [`Component` base class](#component-options).

### `fluid`

> Type: `boolean`

When `true`, the Video.js player will have a fluid size. In other words, it will scale to fit its container at the video's intrinsic aspect ratio, or at a specified [`aspectRatio`](#aspectRatio).

Also, if the `<video>` element has the `"vjs-fluid"`, this option is automatically set to `true`.

### `inactivityTimeout`

> Type: `number`

Video.js indicates that the user is interacting with the player by way of the `"vjs-user-active"` and `"vjs-user-inactive"` classes and the `"useractive"` event.

The `inactivityTimeout` determines how many milliseconds of inactivity is required before declaring the user inactive. A value of `0` indicates that there is no `inactivityTimeout` and the user will never be considered inactive.

### `language`

> Type: `string`, Default: browser default or `'en'`

A [language code][lang-codes] matching one of the available languages in the player. This sets the initial language for a player, but it can always be changed.

Learn more about [languages in Video.js][languages].

### `languages`

> Type: `Object`

Customize which languages are available in a player. The keys of this object will be [language codes][lang-codes] and the values will be objects with English keys and translated values.

Learn more about [languages in Video.js][languages]

> **Note**: Generally, this option is not needed and it would be better to pass your custom languages to `videojs.addLanguage()`, so they are available in all players!

### `liveui`

> Type: `boolean`
> Default: `false`

Allows the player to use the new live ui that includes:

* A progress bar for seeking within the live window
* A button that can be clicked to seek to the live edge with a circle indicating if you are at the live edge or not.

Without this option the progress bar will be hidden and in its place will be text that indicates `LIVE` playback. There will be no progress control
and you will not be able click the text to seek to the live edge. `liveui` will default to `true` in a future version!

### `liveTracker.trackingThreshold`

> Type: `number`
> Default: `20`

An option for the liveTracker component of the player that controls when the liveui should be shown. By default if a stream has less than 20s on the seekBar then we do not show the new liveui even with the liveui option set.

### `liveTracker.liveTolerance`

> Type: `number`
> Default: `15`

An option for the liveTracker component of the player that controls how far from the seekable end should be considered live playback. By default anything further than 15s from the live seekable edge is considered behind live and everything else is considered live. Any user interaction to seek backwards will ignore this value as a user would expect.

### `nativeControlsForTouch`

> Type: `boolean`

Explicitly set a default value for [the associated tech option](#nativecontrolsfortouch).

### `normalizeAutoplay`

> Type: `boolean`

Specify whether setting `autoplay: true` and `<video autoplay>` should be treated the same as `autoplay: 'play'`, i.e. the `autoplay` attribute should be removed from (or not added to) the video element and `play()` be initiated manually by Video.js rather than the browser.

### `notSupportedMessage`

> Type: `string`

Allows overriding the default message that is displayed when Video.js cannot play back a media source.

### `noUITitleAttributes`

> Type: `boolean`
> Default: `false`

Control whether UI elements have a `title` attribute. A `title` attribute is shown on mouse hover, which can be helpful for usability, but has drawbacks for accessibility. Setting `noUITitleAttributes` to `true` prevents the `title` attribute from being added to UI elements, allowing for more accessible tooltips to be added to controls by a plugin or external framework.

### `fullscreen`

> Type: `Object`
> Default: `{options: {navigationUI: 'hide'}`

`fullscreen.options` can be set to pass in specific fullscreen options. At some point, it will be augmented with `element` and `handler` for more functionality.

#### `options`

> Type: `Object`
> Default: `{navigationUI: 'hide'}`

See [The Fullscreen API Spec](https://fullscreen.spec.whatwg.org/#dictdef-fullscreenoptions) for more details.

### `playbackRates`

> Type: `Array`

An array of numbers strictly greater than 0, where 1 means regular speed
(100%), 0.5 means half-speed (50%), 2 means double-speed (200%), etc.
If specified, Video.js displays a control (of class `vjs-playback-rate`)
allowing the user to choose playback speed from among the array of choices.
The choices are presented in the specified order from bottom to top.

For example:

```js
videojs('my-player', {
  playbackRates: [0.5, 1, 1.5, 2]
});
```

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

See [the plugins guide][plugins] for more information on Video.js plugins.

### `preferFullWindow`

> Type: `boolean`, Defaut: `false`

Setting this to `true` will change fullscreen behaviour on devices which do not support the HTML5 fullscreen API but do support fullscreen on the video element, i.e. iPhone. Instead of making the video fullscreen, the player will be stretched to fill the browser window.  

### `responsive`

> Type: `boolean`, Default: `false`

Setting this option to `true` will cause the player to customize itself based on responsive breakpoints (see: [`breakpoints` option](#breakpoints)).

When this option is `false` (the default), responsive breakpoints will be ignored.

> Note this is about the responsiveness of the controls within the player, not responsive sizing of the pplayer itself. For that, see [fluid](#fluid).

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

### `suppressNotSupportedError`

> Type: `boolean`

If set to true, then the no compatible source error will not be triggered immediately and instead will occur on the first user interaction. This is useful for Google's "mobile friendly" test tool, which can't play video but where you might not want to see an error displayed.

### `techCanOverridePoster`

> Type: `boolean`

Gives the possibility to techs to override the player's poster
and integrate into the player's poster life-cycle.
This can be useful when multiple techs are used and each has to set their own poster
 any time a new source is played.

### `techOrder`

> Type: `Array`, Default: `['html5']`

Defines the order in which Video.js techs are preferred. By default, this means that the `Html5` tech is preferred. Other registered techs will be added after this tech in the order in which they are registered.

### `userActions`

> Type: `Object`

### `userActions.click`

> Type: `boolean|function`

Controls how clicking on the player/tech operates. If set to `false`, clicking is disabled and will no longer cause the player to toggle between paused and playing.

```js
videojs('my-player', {
  userActions: {
    click: false
  }
});
```

If undefined or set to `true`, clicking is enabled and toggles the player between paused and play. To override the default click handling, set `userActions.click` to a function which accepts a `click` event (in this example it will request Full Screen, the same as a `userAction.doubleClick`):

```js
function myClickHandler(event) = {
  // `this` is the player in this context

  if (this.isFullscreen()) {
      this.exitFullscreen();
    } else {
      this.requestFullscreen();
    }
};

videojs('my-player', {
  userActions: {
    click: myClickHandler
  }
});
```

### `userActions.doubleClick`

> Type: `boolean|function`

Controls how double-clicking on the player/tech operates. If set to `false`, double-clicking is disabled. If undefined or set to `true`, double-clicking is enabled and toggles fullscreen mode. To override the default double-click handling, set `userActions.doubleClick` to a function which accepts a `dblclick` event:

```js
function myDoubleClickHandler(event) = {
  // `this` is the player in this context

  this.pause();
};

videojs('my-player', {
  userActions: {
    doubleClick: myDoubleClickHandler
  }
});
```

### `userActions.hotkeys`

> Type: `boolean|function|object`

Controls how player-wide hotkeys operate. If set to `false`, or `undefined`, hotkeys are disabled. If set to `true` or an object (to allow definitions of `fullscreenKey` etc. below), hotkeys are enabled as described below. To override the default hotkey handling, set `userActions.hotkeys` to a function which accepts a `keydown` event:

```js
var player = videojs('my-player', {
  userActions: {
    hotkeys: function(event) {
      // `this` is the player in this context

      // `x` key = pause
      if (event.which === 88) {
        this.pause();
      }
      // `y` key = play
      if (event.which === 89) {
        this.play();
      }
    }
  }
});
```

Default hotkey handling is:

|   Key   | Action            | Enabled by                                                        |
| :-----: | ----------------- | ----------------------------------------------------------------- |
|   `f`   | toggle fullscreen | only enabled if a Fullscreen button is present in the Control Bar |
|   `m`   | toggle mute       | always enabled, even if no Control Bar is present                 |
|   `k`   | toggle play/pause | always enabled, even if no Control Bar is present                 |
| `Space` | toggle play/pause | always enabled, even if no Control Bar is present                 |

Hotkeys require player focus first. Note that the `Space` key activates controls such as buttons and menus if that control has keyboard focus. The other hotkeys work regardless of which control in the player has focus.

### `userActions.hotkeys.fullscreenKey`

> Type: `function`

Override the fullscreen key definition. If this is set, the function receives the `keydown` event; if the function returns `true`, then the fullscreen toggle action is performed.

```js
var player = videojs('my-player', {
  userActions: {
    hotkeys: {
      muteKey: function(event) {
        // disable mute key
      },
      fullscreenKey: function(event) {
        // override fullscreen to trigger when pressing the v key
        return (event.which === 86);
      }
    }
  }
});
```

### `userActions.hotkeys.muteKey`

> Type: `function`

Override the mute key definition. If this is set, the function receives the `keydown` event; if the function returns `true`, then the mute toggle action is performed.

### `userActions.hotkeys.playPauseKey`

> Type: `function`

Override the play/pause key definition. If this is set, the function receives the `keydown` event; if the function returns `true`, then the play/pause toggle action is performed.

### `vtt.js`

> Type: `string`

Allows overriding the default URL to vtt.js, which may be loaded asynchronously to polyfill support for `WebVTT`.

This option will be used in the "novtt" build of Video.js (i.e. `video.novtt.js`). Otherwise, vtt.js is bundled with Video.js.

## Component Options

The Video.js player is a component. Like all components, you can define what children it includes, what order they appear in, and what options are passed to them.

This is meant to be a quick reference; so, for more detailed information on components in Video.js, check out the [components guide](/docs/guides/components.md).

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
      fullscreenToggle: false
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
    fullscreenToggle: false
  }
});
```

## Tech Options

### `${techName}`

> Type: `Object`

Video.js playback technologies (i.e. "techs") can be given custom options as part of the options passed to the `videojs` function. They should be passed under the _lower-case variant of the tech name_ (e.g. `"html5"`).

### `html5`

#### `nativeControlsForTouch`

> Type: `boolean`

Only supported by the `Html5` tech, this option can be set to `true` to force native controls for touch devices.

#### `nativeAudioTracks`

> Type: `boolean`

Can be set to `false` to disable native audio track support. Most commonly used with [videojs-contrib-hls][videojs-contrib-hls].

#### `nativeTextTracks`

> Type: `boolean`

Can be set to `false` to force emulation of text tracks instead of native support. The `nativeCaptions` option also exists, but is simply an alias to `nativeTextTracks`.

#### `nativeVideoTracks`

> Type: `boolean`

Can be set to `false` to disable native video track support. Most commonly used with [videojs-contrib-hls][videojs-contrib-hls].

#### `preloadTextTracks`

> Type: `boolean`

Can be set to `false` to delay loading of non-active text tracks until use. This can cause a short delay when switching captions during which there may be missing captions.

The default behavior is to preload all text tracks.

[plugins]: /docs/guides/plugins.md

[languages]: /docs/guides/languages.md

[ios-10-updates]: https://webkit.org/blog/6784/new-video-policies-for-ios/

[lang-codes]: https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry

[video-attrs]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Attributes

[videojs-contrib-hls]: https://github.com/videojs/videojs-contrib-hls
