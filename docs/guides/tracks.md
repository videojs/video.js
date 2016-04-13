Tracks
======

Text Tracks are a function of HTML5 video for providing time triggered text to the viewer. Video.js makes tracks work across all browsers. There are currently five types of tracks:

- **Subtitles**: Translations of the dialogue in the video for when audio is available but not understood. Subtitles are shown over the video.
- **Captions**: Transcription of the dialogue, sound effects, musical cues, and other audio information for when the viewer is deaf/hard of hearing, or the video is muted. Captions are also shown over the video.
- **Chapters**: Chapter titles that are used to create navigation within the video. Typically they're in the form of a list of chapters that the viewer can click on to go to a specific chapter.
- **Descriptions** (not supported yet): Text descriptions of what's happening in the video for when the video portion isn't available, because the viewer is blind, not using a screen, or driving and about to crash because they're trying to enjoy a video while driving. Descriptions are read by a screen reader or turned into a separate audio track.
- **Metadata** (not supported yet): Tracks that have data meant for javascript to parse and do something with. These aren't shown to the user.

Creating the Text File
----------------------
Timed text requires a text file in [WebVTT](http://dev.w3.org/html5/webvtt/) format. This format defines a list of "cues" that have a start time, and end time, and text to display. [Microsoft has a builder](https://dev.modern.ie/testdrive/demos/captionmaker/) that can help you get started on the file.

When creating captions, there's also additional [caption formatting techniques] (http://www.theneitherworld.com/mcpoodle/SCC_TOOLS/DOCS/SCC_FORMAT.HTML#style) that would be good to use, like brackets around sound effects: [ sound effect ]. If you'd like a more in depth style guide for captioning, you can reference the [Captioning Key](http://www.dcmp.org/captioningkey/), but keep in mind not all features are supported by WebVTT or (more likely) the Video.js WebVTT implementation.

Adding to Video.js
------------------
Once you have your WebVTT file created, you can add it to Video.js using the track tag. Put your track tag after all the source elements, and before any fallback content.

```html
<video id="example_video_1" class="video-js vjs-default-skin"
  controls preload="auto" width="640" height="264"
  data-setup='{"example_option":true}'>
 <source src="http://video-js.zencoder.com/oceans-clip.mp4" type="video/mp4" />
 <source src="http://video-js.zencoder.com/oceans-clip.webm" type="video/webm" />
 <source src="http://video-js.zencoder.com/oceans-clip.ogv" type="video/ogg" />

 <track kind="captions" src="http://example.com/path/to/captions.vtt" srclang="en" label="English" default>

</video>
```

Subtitles from Another Domain
-----------------------------
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
One thing to be aware of is that in this case the video files themselves will *also* needs CORS headers applied to it. Since is because some browsers apply the crossorigin attribute to the video source itself and not just the tracks and is considered a [security concern by the spec](https://html.spec.whatwg.org/multipage/embedded-content.html#security-and-privacy-considerations).

Track Attributes
----------------
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
