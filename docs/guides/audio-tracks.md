# Audio Tracks

Audio tracks are a feature of HTML5 video for providing alternate audio track selections
to the user, so that a track other than the main track can be played. Video.js offers a
cross-browser implementation of audio tracks.

## Table of Contents

* [Caveats](#caveats)
* [Working with Audio Tracks](#working-with-audio-tracks)
  * [Add an Audio Track to the Player](#add-an-audio-track-to-the-player)
  * [Listen for a Video Track Becoming Enabled](#listen-for-a-video-track-becoming-enabled)
  * [Removing an Audio Track from the Player](#removing-an-audio-track-from-the-player)
* [API](#api)
  * [videojs.AudioTrack](#videojsaudiotrack)
    * [id](#id)
    * [kind](#kind)
    * [label](#label)
    * [language](#language)
    * [enabled](#enabled)

## Caveats

* It is not possible to add audio tracks through HTML like you can with text tracks.
  They must be added programmatically.
* Video.js only stores track representations. Switching audio tracks for playback is
  _not handled by Video.js_ and must be handled elsewhere - for example,
  [videojs-contrib-hls][hls] handles switching
  audio tracks to support track selection through the UI.

## Working with Audio Tracks

### Add an Audio Track to the Player

```js
// Create a player.
var player = videojs('my-player');

// Create a track object.
var track = new videojs.AudioTrack({
  id: 'my-spanish-audio-track',
  kind: 'translation',
  label: 'Spanish',
  language: 'es'
});

// Add the track to the player's audio track list.
player.audioTracks().addTrack(track);
```

### Listen for a Video Track Becoming Enabled

When a track is enabled or disabled on an `AudioTrackList`, a `change` event will be
fired. You can listen for that event and do something with it.

> NOTE: The initial `AudioTrack` selection (usually the main track that is selected)
>       should not fire a `change` event.

```js
// Get the current player's AudioTrackList object.
var audioTrackList = player.audioTracks();

// Listen to the "change" event.
audioTrackList.addEventListener('change', function() {

  // Log the currently enabled AudioTrack label.
  for (var i = 0; i < audioTrackList.length; i++) {
    var track = audioTrackList[i];

    if (track.enabled) {
      videojs.log(track.label);
      return;
    }
  }
});
```

### Removing an Audio Track from the Player

Assuming a player already exists and has an audio track that you want to remove, you
might do something like the following:

```js
// Get the track we created in an earlier example.
var track = player.audioTracks().getTrackById('my-spanish-audio-track');

// Remove it from the audio track list.
player.audioTracks().removeTrack(track);
```

## API

For more complete information, refer to the
[Video.js API docs](http://docs.videojs.com/), specifically:

* `Player#audioTracks`
* `AudioTrackList`
* `AudioTrack`

### `videojs.AudioTrack`

This class is based on [the `AudioTrack` standard][spec-audiotrack] and can be used to
create new audio track objects.

Each property below is available as an option to the `AudioTrack` constructor.

#### `id`

> [standard definition](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-audiotrack-id)

A unique identifier for this track. Video.js will generate one if not given.

#### `kind`

> [standard definition](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-audiotrack-kind)

Video.js supports standard `kind` values for `AudioTracks`:

* `"alternative"`: A possible alternative to the main track.
* `"descriptions"`: An audio description of a video track.
* `"main"`: The primary audio track for this video.
* `"main-desc"`: The primary audio track, mixed with audio descriptions.
* `"translation"`: A translated version of the main audio track.
* `"commentary"`: Commentary on the primary audio track, e.g. a director's commentary.
* `""` (default): No explicit kind, or the kind given by the track's metadata is not
  recognized by the user agent.

#### `label`

> [standard definition](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-audiotrack-label)

The label for the track that will be shown to the user. For example, in a menu that lists
the different languages available as alternate audio tracks.

#### `language`

> [standard definition](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-audiotrack-language)

The valid [BCP 47](https://tools.ietf.org/html/bcp47) code for the language of the audio
track, e.g. `"en"` for English or `"es"` for Spanish.

For supported language translations, please see the [languages folder (/lang)](https://github.com/videojs/video.js/tree/master/lang)
located in the Video.js root and refer to the [languages guide][languages-guide] for more
information on languages in Video.js.

#### `enabled`

> [standard definition](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-audiotrack-enabled)

Whether or not this track should be playing.

In Video.js, we only allow one track to be enabled at a time; so, if you enable more
than one, the last one to be enabled will end up being the only one. While the spec
allows for more than one track to be enabled, Safari and most implementations only allow
one audio track to be enabled at a time.

[languages-guide]: /docs/guides/languages.md

[spec-audiotrack]: https://html.spec.whatwg.org/multipage/embedded-content.html#audiotrack

[hls]: http://github.com/videojs/videojs-contrib-hls
