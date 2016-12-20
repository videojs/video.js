# Video Tracks

> **Note:** While video tracks [are a standard][spec-videotrack], there are no compatible implementations at this time. This is an experimental technology!

Video tracks are a feature of HTML5 video for providing alternate video tracks to the user, so they can change the type of video they want to watch. Video.js offers a cross-browser implementation of video tracks.

## Table of Contents

* [Caveats](#caveats)
* [Working with Video Tracks](#working-with-video-tracks)
  * [Add a Video Track to the Player](#add-a-video-track-to-the-player)
  * [Listen for a Video Track Becoming Enabled](#listen-for-a-video-track-becoming-enabled)
  * [Removing an Video Track from the Player](#removing-an-video-track-from-the-player)
* [API](#api)
  * [videojs.VideoTrack](#videojsvideotrack)
    * [id](#id)
    * [kind](#kind)
    * [label](#label)
    * [language](#language)
    * [selected](#selected)

## Caveats

* It is not possible to add video tracks through HTML like you can with text tracks. They must be added programmatically.
* Video.js only stores track representations. Switching video tracks for playback is _not handled by Video.js_ and must be handled elsewhere.

## Working with Video Tracks

### Add a Video Track to the Player

```js
// Create a player.
var player = videojs('my-player');

// Create a track object.
var track = new videojs.VideoTrack({
  id: 'my-alternate-video-track',
  kind: 'commentary',
  label: 'Director\'s Commentary',
  language: 'en'
});

// Add the track to the player's video track list.
player.videoTracks().addTrack(track);
```

### Listen for a Video Track Becoming Enabled

When a track is enabled or disabled on an `VideoTrackList`, a `change` event will be fired. You can listen for that event and do something with it.

> NOTE: The initial `VideoTrack` selection (usually the main track that is selected) should not fire a `change` event.

```js
// Get the current player's VideoTrackList object.
var videoTrackList = player.videoTracks();

// Listen to the "change" event.
videoTrackList.addEventListener('change', function() {

  // Log the currently enabled VideoTrack label.
  for (var i = 0; i < videoTrackList.length; i++) {
    var track = videoTrackList[i];

    if (track.enabled) {
      videojs.log(track.label);
      return;
    }
  }
});
```

### Removing an Video Track from the Player

Assuming a player already exists and has an video track that you want to remove, you might do something like the following:

```js
// Get the track we created in an earlier example.
var track = player.videoTracks().getTrackById('my-alternate-video-track');

// Remove it from the video track list.
player.videoTracks().removeTrack(track);
```

## API

For more complete information, refer to the [Video.js API docs](http://docs.videojs.com/docs/api/index.html), specifically:

* `Player#videoTracks`
* `VideoTrackList`
* `VideoTrack`

### `videojs.VideoTrack`

This class is based on [the `VideoTrack` standard][spec-videotrack] and can be used to create new video track objects.

Each property below is available as an option to the `VideoTrack` constructor.

#### `id`

> [standard definition](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-videotrack-id)

A unique identifier for this track. Video.js will generate one if not given.

#### `kind`

> [standard definition](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-videotrack-kind)

Video.js supports standard `kind` values for `VideoTracks`:

* `"alternative"`: A possible alternative to the main track.
* `"captions"`: The main video track with burned in captions
* `"main"`: The main video track.
* `"sign"`: The main video track with added sign language overlay.
* `"subtitles"`: The main video track with burned in subtitles.
* `"commentary"`: The main video track with burned in commentary.
* `""` (default): No explicit kind, or the kind given by the track's metadata is not recognized by the user agent.

#### `label`

> [standard definition](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-videotrack-label)

The label for the track that will be shown to the user. For example, in a menu that lists the different captions available as alternate video tracks.

#### `language`

> [standard definition](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-videotrack-language)

The valid [BCP 47](https://tools.ietf.org/html/bcp47) code for the language of the video track, e.g. `"en"` for English or `"es"` for Spanish.

For supported language translations, please see the [languages folder (/lang)](https://github.com/videojs/video.js/tree/master/lang) folder located in the Video.js root and refer to the [languages guide](./languages.md) for more information on languages in Video.js.

#### `selected`

> [standard definition](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-videotrack-selected)

Whether or not this track should be playing. Only one video track may be selected at a time.

[spec-videotrack]: https://html.spec.whatwg.org/multipage/embedded-content.html#videotrack
