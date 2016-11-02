# Text Tracks
Text tracks are a feature of HTML5 video for displaying time-triggered text to the viewer. Video.js offers a cross-browser implementation of audio tracks.

## Creating the Text File
Timed text requires a text file in [WebVTT](http://dev.w3.org/html5/webvtt/) format. This format defines a list of "cues" that have a start time, an end time, and text to display. [Microsoft has a builder](https://dev.modern.ie/testdrive/demos/captionmaker/) that can help you get started on the file.

When creating captions, there are additional [caption formatting techniques](http://www.theneitherworld.com/mcpoodle/SCC_TOOLS/DOCS/SCC_FORMAT.HTML#style) to make captions more meaningful, like brackets around sound effects (e.g. `[ birds chirping ]`). For a more in depth style guide for captioning, see the [Captioning Key](http://www.dcmp.org/captioningkey/), but keep in mind not all features are supported by WebVTT or (more likely) the Video.js WebVTT implementation.

## Adding Text Tracks to Video.js
Once you have your WebVTT file created, you can add it to Video.js using the `<track>` tag. Put your `<track>` tag(s) after all the source elements and before any fallback content.

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

You can also add tracks [programmatically](#api).

### Text Tracks from Another Domain
Because Video.js loads the text track file via JavaScript, the [same-origin policy](http://en.wikipedia.org/wiki/Same_origin_policy) applies. If you'd like to have a player served from one domain, but the text track served from another, you'll need to [enable CORS](http://enable-cors.org/) on the server that is serving your text tracks.

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
By default, Video.js will use native text tracks and fall back to emulated text tracks if the native functionality is broken, incomplete, or non-existent. The Flash tech will always use the emulated text track functionality.

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

- If you are using the `default` attribute, Video.js will choose the first track that is marked as `default` and turn it on. If there are multiple tracks marked `default`, it will turn on the first `"captions"` or `"subtitles"` track _before_ any `"descriptions"` tracks.
  - This only applied to the emulated text track support, native text tracks behavior will change depending on the browser.
- If a track is selected from the menu, Video.js will turn off all the other tracks of the same kind. While this suggests Video.js supports both `"subtitles"` and `"captions"` being turned on simultaneously, this is currently not the case; Video.js only supports one track being displayed at a time.
  - This means that for emulated text tracks, Video.js will display the first enabled `"subtitles"` or `"captions"` track.
  - When native text tracks are supported, other tracks of the same kind will still be disabled, but it is possible that multiple text tracks are shown.
  - If a `"descriptions"` track is selected and subsequently a `"subtitles"` or `"captions"` track is selected, the `"descriptions"` track is disabled and its menu button is also disabled.
- When enabling a track programmatically, Video.js performs minimal enforcement.
  - For emulated text tracks, Video.js chooses the first track that's `"showing"` - again choosing `"subtitles"` or `"captions"` over `"descriptions"`.
  - For native text tracks, this behavior depends on the browser. Some browsers will allow multiple text tracks, but others will disable all other tracks when a new one is selected.

## API
### `videojs.TextTrack`
This class can be used to create new text track objects. Each property below is available as an option to the `TextTrack` constructor, as a property of the created `TextTrack` object, or as a DOM attribute.

#### `kind`
One of the track types supported by Video.js:

- `"subtitles"`: Translations of the dialogue in the video for when audio is available but not understood. Subtitles are shown over the video.
- `"captions"`: Transcription of the dialogue, sound effects, musical cues, and other audio information for viewer who are deaf/hard of hearing, or the video is muted. Captions are also shown over the video.
- `"chapters"`: Chapter titles that are used to create navigation within the video. Typically, these are in the form of a list of chapters that the viewer can use to navigate the video.
- `"descriptions"`: Text descriptions of the action in the content for when the video portion isn't available or because the viewer is blind or not using a screen. Descriptions are read by a screen reader or turned into a separate audio track.
- `"metadata"`: Tracks that have data meant for JavaScript to parse and do something with. These aren't shown to the user.

Defaults to `"subtitles"`.

#### `label`
Short descriptive text for the track that will used in the user interface. For example, in a menu for selecting a captions language.

#### `default`
The boolean `default` attribute can be used to indicate that a track's mode should start as `"showing"`. Otherwise, the viewer would need to select their language from a captions or subtitles menu.

> **Note:** For chapters, `default` is required if you want the chapters menu to show.

#### `srclang`
The valid BCP 47 code for the language of the text track, e.g. `"en"` for English or `"es"` for Spanish. For supported language translations, please see the [Languages Folder (/lang)](https://github.com/videojs/video.js/tree/master/lang) folder located in the Video.js root.

### Player Methods
#### `player.textTracks()`
This is the main interface into the text tracks of a player. It returns a `TextTrackList`, which is an array-like object that contains all the `TextTrack`s associated with the player.

#### `player.remoteTextTracks()`
This method returns a `TextTrackList` of all the tracks that were created from `<track>` elements or that were added to the player using the `addRemoteTextTrack` method.

These are distinct from the list returned by `textTracks()` because all these tracks are _removeable_, whereas tracks from `textTracks()` are not necessarily removeable.

#### `player.remoteTextTrackEls()`
This methods returns a `HTMLTrackElementList` of all the `<track>` elements - both emulated and native - associated with the player.

#### `player.addTextTrack(String kind, [String label [, String language]]) -> TextTrack`
Based on the [W3C spec API](http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack), this method takes a `kind` and optional `label` and `language` arguments and creates a new `TextTrack`.

> **Note:** This method is intended for _purely programmatic usage_ of tracks and has one important limitation:
>
> Tracks created using this method _cannot be removed_. The native `addTextTrack` does not have a corresponding `removeTextTrack`; so, we actually discourage the usage of this method.

#### `player.addRemoteTextTrack(Object options)`
This method takes an `options` object that looks pretty similar to the `<track>` element and returns a `HTMLTrackElement` object.

The `HTMLTrackElement` object has a `track` property on it which is the actual `TextTrack` object. This object is equivalent to the one that can be returned from `addTextTrack()` with the added benefit that it can be removed from the player.

Internally, Video.js will either add a `<track>` element for you or emulate one depending on whether native text tracks are supported or not.

The options available are:

- `kind`
- `label`
- `language` (also `srclang`)
- `id`
- `src`

#### `player.removeRemoteTextTrack(HTMLTrackElement|TextTrack)`
This method takes either an `HTMLTrackElement` or a `TextTrack` object and removes it from the player.
