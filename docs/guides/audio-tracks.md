# Audio Tracks
Audio tracks are a feature of HTML5 video for providing alternate audio track selections to the user, so that a track other than the main track can be played. Video.js offers a cross-browser implementation of audio tracks.

## Caveats
- It is not possible to add audio tracks through HTML. They must be added [programmatically](#api).
- Literal switching of audio tracks for playback is not handled by Video.js and must be handled by something else. Video.js only stores the track representation.

## Working with Audio Tracks
### Add an Audio Track to the Player
```js
// Create a player.
var player = videojs('my-player');

// Create a track object.
var track = new videojs.AudioTrack({
  kind: 'translation',
  label: 'Spanish',
  language: 'es'
});

// Add the track to the player's audio track list.
player.audioTracks().addTrack(track);
```

### Listen for a Track Becoming Enabled
When a new track is enabled (other than the main track) an event is fired on the `AudioTrackList` called `"change"`. You can listen for that event and do something with it.

```js
// Get the current player's AudioTrackList object.
var tracks = player.audioTracks();

// Listen to the "change" event.
tracks.addEventListener('change', function() {

  // Log the currently enabled AudioTrack label.
  for (var i = 0; i < tracks.length; i++) {
    var track = tracks[i];

    if (track.enabled) {
      videojs.log(track.label);
      return;
    }
  }
});
```

## API
### `videojs.AudioTrack`
This class can be used to create new audio track objects. Each property below is available as an option to the `AudioTrack` constructor.

#### `kind`
One of the audio track types supported by Video.js:

- `"alternative"`: A possible alternative to the main track.
- `"descriptions"`: An audio description of a video track.
- `"main"`: The primary audio track for this video.
- `"main-desc"`: The primary audio track, mixed with audio descriptions.
- `"translation"`: A translated version of the main audio track.
- `"commentary"`: Commentary on the primary audio track, e.g. a director's commentary.

Defaults to empty string if `kind` is missing or an invalid `kind` is used.

#### `label`
The label for the track that will be shown to the user. For example, in a menu that lists the different languages available as alternate audio tracks.

#### `language`
The valid BCP 47 code for the language of the audio track, e.g. `"en"` for English or `"es"` for Spanish. For supported language translations, please see the [Languages Folder (/lang)](https://github.com/videojs/video.js/tree/master/lang) folder located in the Video.js root.

#### `enabled`
Whether or not this track should be playing. In Video.js, we only allow one track to be enabled at a time; so, if you enable more than one the last one to be enabled will end up being the only one.

### Player Methods
#### `player.audioTracks()`
This is the main interface into the audio tracks of the player. It returns an `AudioTrackList`, which is an array-like object that contains all the `AudioTrack`s associated with the player.

#### `player.audioTracks().addTrack(AudioTrack)`
Add an `AudioTrack` object to the player's `AudioTrackList`.

#### `player.audioTracks().removeTrack(AudioTrack)`
Remove an `AudioTrack` from the player's `AudioTrackList`. If the track is not in the `AudioTrackList`, it is simply ignored.
