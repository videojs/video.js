# Tracks

Text Tracks are a function of HTML5 video for providing time triggered text to the viewer. Video.js makes tracks work across all browsers. There are currently five types of tracks:

- **Subtitles**: Translations of the dialogue in the video for when audio is available but not understood. Subtitles are shown over the video.
- **Captions**: Transcription of the dialogue, sound effects, musical cues, and other audio information for when the viewer is deaf/hard of hearing, or the video is muted. Captions are also shown over the video.
- **Chapters**: Chapter titles that are used to create navigation within the video. Typically they're in the form of a list of chapters that the viewer can click on to go to a specific chapter.
- **Descriptions**: Text descriptions of what's happening in the video for when the video portion isn't available, because the viewer is blind, not using a screen, or driving and about to crash because they're trying to enjoy a video while driving. Descriptions are read by a screen reader or turned into a separate audio track.
- **Metadata**: Tracks that have data meant for javascript to parse and do something with. These aren't shown to the user.

## Creating the Text File
Timed text requires a text file in [WebVTT](http://dev.w3.org/html5/webvtt/) format. This format defines a list of "cues" that have a start time, and end time, and text to display. [Microsoft has a builder](https://dev.modern.ie/testdrive/demos/captionmaker/) that can help you get started on the file.

When creating captions, there's also additional [caption formatting techniques] (http://www.theneitherworld.com/mcpoodle/SCC_TOOLS/DOCS/SCC_FORMAT.HTML#style) that would be good to use, like brackets around sound effects: [ sound effect ]. If you'd like a more in depth style guide for captioning, you can reference the [Captioning Key](http://www.dcmp.org/captioningkey/), but keep in mind not all features are supported by WebVTT or (more likely) the Video.js WebVTT implementation.

## Adding to Video.js
Once you have your WebVTT file created, you can add it to Video.js using the track tag. Put your track tag after all the source elements, and before any fallback content.

```html
<video id="example_video_1" class="video-js"
  controls preload="auto" width="640" height="264"
  data-setup='{"example_option":true}'>
 <source src="http://vjs.zencdn.net/v/oceans.mp4" type="video/mp4" />
 <source src="http://vjs.zencdn.net/v/oceans.webm" type="video/webm" />
 <source src="http://vjs.zencdn.net/v/oceans.ogv" type="video/ogg" />

 <track kind="captions" src="http://example.com/path/to/captions.vtt" srclang="en" label="English" default>

</video>
```

You can also add tracks [programatically](#api).

## Subtitles from Another Domain
Because we're pulling in the text track file via Javascript, the [same-origin policy](http://en.wikipedia.org/wiki/Same_origin_policy) applies. If you'd like to have a player served from one domain,
but the text track served from another, you'll need to [enable CORS](http://enable-cors.org/) in order to do so.
In addition to enabling CORS on the server serving the text tracks, you will need to add the [`crossorigin` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) to the video element itself. This attribute has two values `anonymous` and `use-credentials`. Most users will want to use `anonymous` with cross-origin tracks.
It can be added to the video element like so:
```html
<video class="video-js" crossorigin="anonymous">
  <source src="http://vjs.zencdn.net/v/oceans.mp4" type="video/mp4">
  <track src="http://example.com/oceans.vtt" kind="captions" srclang="en" label="English">
</video>
```
One thing to be aware of is that in this case the video files themselves will *also* needs CORS headers applied to it. This is because some browsers apply the crossorigin attribute to the video source itself and not just the tracks and is considered a [security concern by the spec](https://html.spec.whatwg.org/multipage/embedded-content.html#security-and-privacy-considerations).

## Track Attributes
Additional settings for track tags.

### kind
One of the five track types listed above. Kind defaults to subtitles if no kind is included.

### label
The label for the track that will be show to the user, for example in a menu that list the different languages available for subtitles.

### default
The default attribute can be used to have a track default to showing. Otherwise the viewer would need to select their language from the captions or subtitles menu.
NOTE: For chapters, default is required if you want the chapters menu to show.

### srclang
The two-letter code (valid BCP 47 language tag) for the language of the text track, for example "en" for English. A list of language codes is [available here](languages.md#language-codes).

## Interacting with Text Tracks
### Showing tracks programmatically
Some of you would want to turn captions on and off programmatically rather than just forcing the user to do so themselves. This can be easily achieved by modifying the `mode` of the text tracks.
The `mode` can be one of three values `disabled`, `hidden`, and `showing`.
When a text track's `mode` is `disabled`, the track does not show on screen as the video is playing.
When the `mode` is set to `showing`, the track is visible to the viewer and updates while the video is playing.
You can change of a particular track like so:
```js
let tracks = player.textTracks();

for (let i = 0; i < tracks.length; i++) {
  let track = tracks[i];

  // find the captions track that's in english
  if (track.kind === 'captions' && track.language === 'en') {
    track.mode = 'showing';
  }
}
```

### Doing something when a cue becomes active
Above, we mentioned that `mode` can also be `hidden`, what this means is that the track will update
as the video is playing but it won't be visible to the viewer. This is most useful for `metadata` text tracks.
One usecase for metadata text tracks is to have something happen when their cues become active, to do so, you listen to the `cuechange` event on the track. These events fire when the mode is `showing` as well.
Here's an example:
```js
let tracks = player.textTracks();
let metadataTrack;

for (let i = 0; i < tracks.length; i++) {
  let track = tracks[i];

  // find the metadata track that's labeled ads
  if (track.kind === 'captions' && track.label === 'ads') {
    track.mode = 'hidden';
    // store it for usage outside of the loop
    metadataTrack = track;
  }
}

metadataTrack.addEventListener('cuechange', function() {
  player.ads.startLinearAdMode();
});
```

## Emulated Text Tracks
By default, video.js will try and use native text tracks if possible and fall back to emulated text tracks if the native functionality is broken or incomplete or non-existent.
The Flash tech will always use the emulated text track functionality.
The video.js API and TextTrack objects were modeled after the w3c's specification.
video.js uses [Mozilla's vtt.js](https://github.com/mozilla/vtt.js) library to parse and display its emulated text tracks.

If you wanted to disable native text track functionality and force video.js to use emulated text tracks always, you can supply the `nativeTextTrack` option to the tech like so:
```js
let player = videojs('myvideo', {
  html5: {
    nativeTextTrack: false
  }
});
```

### Text Track Settings
When using emulated Text Tracks, captions will have an additional item in the menu called "caption settings".
This allows the viewer of the player to change some styles of how the captions are displayed on screen.

If you don't want that, you can disable it by turning off the text track settings component and hiding the menu item like so:
```js
let player = videojs('myvideo', {
  // make the text track settings dialog not initialize
  textTrackSettings: false
});
```
```css
/* hide the captions settings item from the captions menu */
.vjs-texttrack-settings {
  display: none;
}
```

## Text Track Precedence
In general, the Descriptions tracks is of lower precedence than captions and subtitles.
What this means for you?
* If you are using the `default` attribute, videojs will choose the first track that is marked as `default` and turn it on. If There are multiple tracks marked `default`, it will try and turn on the first `captions` or `subtitles` track *before* any `descriptions` tracks.
  * This only applied to the emulated captions support, native text tracks behavior will change depending on the browser
* If you select a given track from the menu, videojs will turn off all the other tracks of the same kind. This may seem like you can have both subtitles and captions turned on at the same time but unfortuantely, at this time we only support one track being displayed at a time.
  * This means that for emulated text tracks, we'll choose the first captions or subtitles track that is enabled to display.
  * When native text tracks are supported, we will still disable the other tracks of the same kind but it is possible that multiple text tracks are shown.
  * If a `descriptions` track is selected and subsequently a `subtitles` or `captions` track is selected, the `descriptions` track is disabled and its menu button is also disabled.
* When enabling a track programmatically, there's not much checking that videojs does.
  * For emulated text tracks, when it's time to display the captions, video.js would choose the first track that's showing, again choosing `subtitles` or `captions` over `descriptions`, if necessary.
  * For native text tracks, this behavior depends on the browser. Some browsers will let you have multiple text tracks but others will disable all other tracks when a new one is selected.

## API

### `player.textTracks() -> TextTrackList`
This is the main interface into the text tracks of the player.
It return a TextTrackList which lists all the tracks on the player.

### `player.remoteTextTracks() -> TextTrackList`
This is a helper method to get a list of all the tracks that were created from `track` elements or that were added to the player by the `addRemoteTextTrack` method. All these tracks are removeable from the player, where-as not all tracks from `player.textTracks()` are necessarily removeable.

### `player.remoteTextTrackEls() -> HTMLTrackElementList`
Another helper method, this is a list of all the `track` elements associated with the player. Both emulated or otherwise.

### `player.addTextTrack(String kind, [String label [, String language]]) -> TextTrack`
This is based on the [w3c spec API](http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack) and when given a kind and an optional label and language, will create a new text track for you to use.
This method is intended for purely programmatic usage of tracks and has one important limitation:
tracks created using this method *cannot* be removed. The native `addTextTrack` does not have a corresponding `removeTextTrack`, so, we actually discourage the usage of this method.

### `player.addRemoteTextTrack(Object options) -> HTMLTrackElement`
This function takes an options object that looks pretty similar to the track element and returns a HTMLTrackElement.
This object has a `track` property on it which is the actual TextTrack object.
This `TextTrack` object is equivalent to the one that can be returned from `player.addTextTrack` with the added bonus that it can be removed from the player.
Internally, video.js will either add a `<track>` element for you, or emulate that depending on whether native text tracks are supported or not.
The options available are:
* `kind`
* `label`
* `language` (also `srclang`)
* `id`
* `src`

### `player.removeRemoteTextTrack(HTMLTrackElement|TextTrack)`
This function takes either an HTMLTrackElement or a TextTrack object and removes it from the player.
