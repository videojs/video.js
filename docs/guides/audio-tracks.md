# Audio Tracks

Audio Tracks are a function of HTML5 video for providing alternative audio track selections to the user, so that a track other than the main track can be played. Video.js makes audio tracks work across all browsers. There are currently five types of tracks:

- **Alternative**: alternative audio for the main video track
- **Descriptions**: descriptions of what is happening in the video track
- **Main**: the main audio track for this video
- **Translation**: a translation of the main audio track
- **Commentary**: commentary on the video, usually the director of the content talking about design choices

## Missing Funtionality
- It is currently impossible to add AudioTracks in a non-programtic way
- Literal switching of AudioTracks for playback is not handled by video.js and must be handled by something else. video.js only stores the track representation

## Adding to Video.js

> Right now adding audio tracks in the HTML is unsupported. Audio Tracks must be added programatically.

You must add audio tracks [programatically](#api) for the time being.

## Attributes
Audio Track propertites and settings

### kind
One of the five track types listed above. Kind defaults to empty string if no kind is included, or an invalid kind is used.

### label
The label for the track that will be show to the user, for example in a menu that list the different languages available for audio tracks.

### language
The two-letter code (valid BCP 47 language tag) for the language of the audio track, for example "en" for English. A list of language codes is [available here](languages.md#language-codes).

### enabled
If this track should be playing or not. In video.js we only allow one track to be enabled at a time. so if you enable more than one the last one to be enabled will end up being the only one.

## Interacting with Audio Tracks
### Doing something when a track becomes enabled
When a new track is enabled (other than the main track) an event is fired on the `AudioTrackList` called `change` you can listen to that event and do something with it.
Here's an example:
```js
// get the current players AudioTrackList object
let tracks = player.audioTracks();

// listen to the change event
tracks.addEventListener('change', function() {

  // print the currently enabled AudioTrack label
  for (let i = 0; i < tracks.length; i++) {
    let track = tracks[i];

    if (track.enabled) {
      console.log(track.label);
      return;
    }
  }
});
```

## API

### `player.audioTracks() -> AudioTrackList`
This is the main interface into the audio tracks of the player.
It returns an AudioTrackList which is an array like object that contains all the `AudioTrack` on the player.

### `player.audioTracks().addTrack(AudioTrack)`
Add an existing AudioTrack to the players internal list of AudioTracks.

### `player.audioTracks().removeTrack(AudioTrack)`
Remove a track from the AudioTrackList currently on the player. if no track exists this will do nothing.
