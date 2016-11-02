# Video Tracks
Video tracks are a feature of HTML5 video for providing alternate video tracks to the user, so they can change type of video they want to watch. Video.js offers a cross-browser implementation of video tracks.

## Caveats
- It is not possible to add video tracks through HTML. They must be added [programmatically](#api).
- Literal switching of video tracks for playback is not handled by Video.js and must be handled by something else. Video.js only stores the track representation.

## Working with Video Tracks
### Add a Video Track to the Player
```js
// Create a player.
var player = videojs('my-player');

// Create a track object.
var track = new videojs.VideoTrack({
  kind: 'commentary',
  label: 'Director\'s Commentary',
  language: 'en'
});

// Add the track to the player's video track list.
player.videoTracks().addTrack(track);
```

### Listen for a Track Becoming Enabled
When a new track is enabled (other than the main track) an event is fired on the `VideoTrackList` called `"change"`. You can listen for that event and do something with it.

```js
// Get the current player's VideoTrackList object.
var tracks = player.videoTracks();

// Listen to the "change" event.
tracks.addEventListener('change', function() {

  // Log the currently enabled VideoTrack label.
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
### `videojs.VideoTrack`
This class can be used to create new video track objects. Each property below is available as an option to the `VideoTrack` constructor.

## Attributes
Video Track propertites and settings

### `kind`
One of the track types supported by Video.js:

- `"alternative"`: A possible alternative to the main track.
- `"captions"`: The main video track with burned in captions
- `"main"`: The main video track.
- `"sign"`: The main video track with added sign language overlay.
- `"subtitles"`: The main video track with burned in subtitles.
- `"commentary"`: The main video track with burned in commentary.

Defaults to empty string if `kind` is missing or an invalid `kind` is used.

### `label`
The label for the track that will be shown to the user. For example, in a menu that lists the different captions available as alternate video tracks.

### `language`
The valid BCP 47 code for the language of the video track, e.g. `"en"` for English or `"es"` for Spanish. For supported language translations, please see the [Languages Folder (/lang)](https://github.com/videojs/video.js/tree/master/lang) folder located in the Video.js root.

### `selected`
Whether or not this track should be playing. Only one video track may be selected at a time.

### Player Methods
#### `player.videoTracks()`
This is the main interface into the video tracks of the player. It returns a `VideoTrackList`, which is an array-like object that contains all the `VideoTrack`s associated with the player.

#### `player.videoTracks().addTrack(VideoTrack)`
Add an `VideoTrack` object to the player's `VideoTrackList`.

#### `player.videoTracks().removeTrack(VideoTrack)`
Remove an `VideoTrack` from the player's `VideoTrackList`. If the track is not in the `VideoTrackList`, it is simply ignored.
