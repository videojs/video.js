# Text Tracks

Text tracks are a feature of HTML5 for displaying time-triggered text to the end-user. Video.js offers a cross-browser implementation of text tracks.

## Table of Contents

* [A Note on "Remote" Text Tracks](#a-note-on-remote-text-tracks)
* [Creating the Text File](#creating-the-text-file)
* [Adding Text Tracks to Video.js](#adding-text-tracks-to-videojs)
  * [track Attributes](#track-attributes)
    * [kind](#kind)
    * [label](#label)
    * [default](#default)
    * [srclang](#srclang)
  * [Text Tracks from Another Domain](#text-tracks-from-another-domain)
* [Working with Text Tracks](#working-with-text-tracks)
  * [Showing Tracks Programmatically](#showing-tracks-programmatically)
  * [Listen for a Cue Becoming Active](#listen-for-a-cue-becoming-active)
* [Emulated Text Tracks](#emulated-text-tracks)
  * [Text Track Settings](#text-track-settings)
* [Text Track Precedence](#text-track-precedence)
* [API](#api)
  * [Remote Text Tracks](#remote-text-tracks)
  * [Text Tracks](#text-tracks)

## A Note on "Remote" Text Tracks

Video.js refers to so-called "remote" text tracks. This is a convenient term for tracks that have an associated `<track>` element rather than those that do not.

Either can be created programmatically, but _only remote text tracks can be removed from a player._ For that reason, we recommend _only_ using remote text tracks.

## Creating the Text File

Timed text requires a text file in [WebVTT](https://dev.w3.org/html5/webvtt/) format. This format defines a list of "cues" that have a start time, an end time, and text to display. [Microsoft has a builder](https://dev.modern.ie/testdrive/demos/captionmaker/) that can help you get started on the file.

> **Note:** When creating captions, there are additional [caption formatting techniques](https://www.theneitherworld.com/mcpoodle/SCC_TOOLS/DOCS/SCC_FORMAT.HTML#style) to make captions more meaningful, like brackets around sound effects (e.g. `[ birds chirping ]`).
>
> For a more in depth style guide for captioning, see the [Captioning Key](https://www.dcmp.org/captioningkey/), but keep in mind not all features are supported by WebVTT or (more likely) the Video.js WebVTT implementation.

## Adding Text Tracks to Video.js

Once you have your WebVTT files created, you can add them to your `video` element using the `track` tag. Similar to `source` elements, `track` elements should be added as children of the `video` element:

```html
<video
  class="video-js"
  controls
  preload="auto"
  width="640"
  height="264"
  data-setup='{}'>
  <source src="//vjs.zencdn.net/v/oceans.mp4" type="video/mp4">
  <source src="//vjs.zencdn.net/v/oceans.webm" type="video/webm">
  <track kind="captions" src="//example.com/path/to/captions.vtt" srclang="en" label="English" default>
</video>
```

Video.js will automatically read `track` elements from the `video` element. Tracks (remote and non-remote) can also be added programmatically.

### `track` Attributes

#### `kind`

> [standard definition](https://html.spec.whatwg.org/multipage/embedded-content.html#text-track-kind)

One of the track types supported by Video.js:

* `"subtitles"` (default): Translations of the dialogue in the video for when audio is available but not understood. Subtitles are shown over the video.
* `"captions"`: Transcription of the dialogue, sound effects, musical cues, and other audio information for viewer who are deaf/hard of hearing, or the video is muted. Captions are also shown over the video.
* `"chapters"`: Chapter titles that are used to create navigation within the video. Typically, these are in the form of a list of chapters that the viewer can use to navigate the video.
* `"descriptions"`: Text descriptions of the action in the content for when the video portion isn't available or because the viewer is blind or not using a screen. Descriptions are read by a screen reader or turned into a separate audio track.
* `"metadata"`: Tracks that have data meant for JavaScript to parse and do something with. These aren't shown to the user.

#### `label`

> [standard definition](https://html.spec.whatwg.org/multipage/embedded-content.html#text-track-label)

Short descriptive text for the track that will used in the user interface. For example, in a menu for selecting a captions language.

#### `default`

> [standard definition](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-track-default)

The boolean `default` attribute can be used to indicate that a track's mode should start as `"showing"`. Otherwise, the viewer would need to select their language from a captions or subtitles menu.

> **Note:** For chapters, `default` is required if you want the chapters menu to show.

#### `srclang`

> [standard definition](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-track-srclang)

The valid [BCP 47](https://tools.ietf.org/html/bcp47) code for the language of the text track, e.g. `"en"` for English or `"es"` for Spanish.

For supported language translations, please see the [languages folder (/lang)](https://github.com/videojs/video.js/tree/main/lang) folder located in the Video.js root and refer to the [languages guide](/docs/guides/languages.md) for more information on languages in Video.js.

### Text Tracks from Another Domain

Because Video.js loads the text track file via JavaScript, the [same-origin policy](https://en.wikipedia.org/wiki/Same_origin_policy) applies. If you'd like to have a player served from one domain, but the text track served from another, you'll need to [enable CORS](https://enable-cors.org/) on the server that is serving your text tracks.

In addition to enabling CORS, you will need to add the [`crossorigin` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) to the video element itself. This attribute has two possible values `"anonymous"` and `"use-credentials"`. Most users will want to use `"anonymous"` with cross-origin tracks:

```html
<video class="video-js" crossorigin="anonymous">
  <source src="//vjs.zencdn.net/v/oceans.mp4" type="video/mp4">
  <track src="//example.com/oceans.vtt" kind="captions" srclang="en" label="English">
</video>
```

One thing to be aware of is that the video files themselves will _also_ need CORS headers. This is because some browsers apply the `crossorigin` attribute to the video source itself and not just the tracks. This is considered a [security concern by the spec](https://html.spec.whatwg.org/multipage/embedded-content.html#security-and-privacy-considerations).

## Working with Text Tracks

### Showing Tracks Programmatically

Certain use cases call for turning captions on and off programmatically rather than forcing the user to do so themselves. This can be easily achieved by modifying the `mode` property of the text tracks.

The `mode` can be one of three values `"disabled"`, `"hidden"`, and `"showing"`. When a text track's `mode` is `"disabled"`, the track does not show on screen as the video is playing.

When the `mode` is set to `"showing"`, the track is visible to the viewer and updates while the video is playing.

```js
// Get all text tracks for the current player.
var tracks = player.textTracks();

for (var i = 0; i < tracks.length; i++) {
  var track = tracks[i];

  // Find the English captions track and mark it as "showing".
  if (track.kind === 'captions' && track.language === 'en') {
    track.mode = 'showing';
  }
}
```

### Listen for a Cue Becoming Active

One of the supported values for `mode` is `"hidden"`. This `mode` means that the track will update as the video is playing, but it won't be visible to the viewer. This is most useful for tracks where `kind="metadata"`.

A common use case for metadata text tracks is to use them to trigger behaviors when their cues become active. For this purpose, tracks emit a `"cuechange"` event.

```js
// Get all text tracks for the current player.
var tracks = player.textTracks();
var metadataTrack;

for (var i = 0; i < tracks.length; i++) {
  var track = tracks[i];

  // Find the metadata track that's labeled "ads".
  if (track.kind === 'metadata' && track.label === 'ads') {
    track.mode = 'hidden';

    // Store it for usage outside of the loop.
    metadataTrack = track;
  }
}

// Add a listener for the "cuechange" event and start ad playback.
metadataTrack.addEventListener('cuechange', function() {
  player.ads.startLinearAdMode();
});
```

## Emulated Text Tracks

By default, Video.js will use native text tracks and fall back to emulated text tracks if the native functionality is broken, incomplete, or non-existent.

The Video.js API and TextTrack objects were modeled after the W3C specification. Video.js uses [Mozilla's vtt.js](https://github.com/mozilla/vtt.js) library to parse and display emulated text tracks.

To disable native text track functionality and force Video.js to use emulated text tracks always, the `nativeTextTracks` option can be passed to a tech:

```js
// Create a player, passing `nativeTextTracks: false` to the HTML5 tech.
var player = videojs('myvideo', {
  html5: {
    nativeTextTracks: false
  }
});
```

### Text Track Settings

When using emulated text tracks, captions will have an additional item in the menu called "Caption Settings". This allows the user to alter how captions are styled on screen.

This feature can be disabled by turning off the `TextTrackSettings` component and hiding the menu item.

```js
var player = videojs('myvideo', {
  // Make the text track settings dialog not initialize.
  textTrackSettings: false
});
```

```css
/* Hide the captions settings item from the captions menu. */
.vjs-texttrack-settings {
  display: none;
}
```

## Text Track Precedence

In general, `"descriptions"` tracks are of lower precedence than `"captions"` and `"subtitles"`. What this mean for developers using Video.js?

* If you are using the `default` attribute, Video.js will choose the first track that is marked as `default` and turn it on. If there are multiple tracks marked `default`, it will turn on the first `"captions"` or `"subtitles"` track _before_ any `"descriptions"` tracks.
  * This only applied to the emulated text track support, native text tracks behavior will change depending on the browser.
* If a track is selected from the menu, Video.js will turn off all the other tracks of the same kind. While this suggests Video.js supports both `"subtitles"` and `"captions"` being turned on simultaneously, this is currently not the case; Video.js only supports one track being displayed at a time.
  * This means that for emulated text tracks, Video.js will display the first enabled `"subtitles"` or `"captions"` track.
  * When native text tracks are supported, other tracks of the same kind will still be disabled, but it is possible that multiple text tracks are shown.
  * If a `"descriptions"` track is selected and subsequently a `"subtitles"` or `"captions"` track is selected, the `"descriptions"` track is disabled and its menu button is also disabled.
* When enabling a track programmatically, Video.js performs minimal enforcement.
  * For emulated text tracks, Video.js chooses the first track that's `"showing"` - again choosing `"subtitles"` or `"captions"` over `"descriptions"`.
  * For native text tracks, this behavior depends on the browser. Some browsers will allow multiple text tracks, but others will disable all other tracks when a new one is selected.

## API

For more complete information, refer to the [Video.js API docs](https://docs.videojs.com/).

### Remote Text Tracks

As mentioned [above](#a-note-on-remote-text-tracks), remote text tracks represent the recommended API offered by Video.js as they can be removed.

* `Player#remoteTextTracks()`

* `Player#remoteTextTrackEls()`

* `Player#addRemoteTextTrack(Object options)`

  Available options are the same as the [available `track` attributes](#track-attributes). And `language` is a supported option as an alias for the `srclang` attribute - either works here.

  **Note**: If you need a callback, instead of a callback you could use the technique below:

  ```js
  const trackEl = player.addRemoteTextTrack({src: 'en.vtt'}, false);
  trackEl.addEventListener('load', function() {
    // your callback goes here
  });
  ```

* `Player#removeRemoteTextTrack(HTMLTrackElement|TextTrack)`

### Text Tracks

It is generally recommended that you use _remote_ text tracks rather than these purely programmatic text tracks for the majority of use-cases.

* `Player#textTracks()`

* `Player#addTextTrack(String kind, [String label [, String language]])`

  > **Note:** Non-remote text tracks are intended for _purely programmatic usage_ of tracks and have the important limitation that they _cannot be removed once created_.
  >
  > The standard `addTextTrack` does **not** have a corresponding `removeTextTrack` method; so, we actually discourage the use of this method!

* `TextTrackList()`

* `TextTrack()`
