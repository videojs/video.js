# Video Tracks

Video Tracks are a function of HTML5 video for providing a selection of alternative video tracks to the user, so that they can change type of video they want to watch. Video.js makes video tracks work across all browsers. There are currently six types of tracks:

- **Alternative**: an alternative video representation of the main video track
- **Captions**: The main video track with burned in captions
- **Main**: the main video track
- **Sign**: the main video track with added sign language overlay
- **Subtitles**: the main video track with burned in subtitles
- **Commentary**: the main video track with burned in commentary

## Missing Funtionality
- It is currently impossible to add VideoTracks in a non-programtic way
- Literal switching of VideoTracks for playback is not handled by video.js and must be handled by something else. video.js only stores the track representation
- There is currently no UI implementation of VideoTracks

## Adding to Video.js

> Right now adding video tracks in the HTML is unsupported. Video Tracks must be added programatically.

You must add video tracks [programatically](#api) for the time being.

## Attributes
Video Track propertites and settings

### kind
One of the five track types listed above. Kind defaults to empty string if no kind is included, or an invalid kind is used.

### label
The label for the track that will be show to the user, for example in a menu that list the different languages available for video tracks.

### language
The two-letter code (valid BCP 47 language tag) for the language of the video track, for example "en" for English. A list of language codes is [available here](languages.md#language-codes).

### selected
If this track should be playing or not. Trying to select more than one track will cause other tracks to be deselected.

## Interacting with Video Tracks
### Doing something when a track becomes enabled
When a new track is enabled (other than the main track) an event is fired on the `VideoTrackList` called `change` you can listen to that event and do something with it.
Here's an example:
```js
// get the current players VideoTrackList object
let tracks = player.videoTracks();

// listen to the change event
tracks.addEventListener('change', function() {
  // get the currently selected track
  let index = tracks.selectedIndex;
  let track = tracks[index];

  // print the currently selected track
  console.log(track.label);
});
```

## API

### `player.videoTracks() -> VideoTrackList`
This is the main interface into the video tracks of the player.
It returns an VideoTrackList which is an array like object that contains all the `VideoTrack` on the player.

### `player.videoTracks().addTrack(VideoTrack)`
Add an existing VideoTrack to the players internal list of VideoTracks.

### `player.videoTracks().removeTrack(VideoTrack)`
Remove a track from the VideoTrackList currently on the player. if no track exists this will do nothing.

### `player.videoTracks().selectedIndex`
The current index for the selected track
