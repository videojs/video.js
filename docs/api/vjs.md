<!-- GENERATED FROM SOURCE -->

# vjs

__DEFINED IN__: [src/js/core.js#L26](https://github.com/videojs/video.js/blob/master/src/js/core.js#L26)  

Doubles as the main function for users to create a player instance and also
the main library object.

**ALIASES** videojs, _V_ (deprecated)

The `vjs` function can be used to initialize or retrieve a player.

    var myPlayer = vjs('my_video_id');

---

## INDEX

- [PROPERTIES](#properties)
  - [options](#options)
  - [players](#players)

- CLASSES
  - [BigPlayButton](vjs.BigPlayButton.md)
  - [Button](vjs.Button.md)
  - [CaptionsButton](vjs.CaptionsButton.md)
  - [CaptionsTrack](vjs.CaptionsTrack.md)
  - [ChaptersButton](vjs.ChaptersButton.md)
  - [ChaptersTrack](vjs.ChaptersTrack.md)
  - [ChaptersTrackMenuItem](vjs.ChaptersTrackMenuItem.md)
  - [Component](vjs.Component.md)
  - [ControlBar](vjs.ControlBar.md)
  - [CoreObject](vjs.CoreObject.md)
  - [CurrentTimeDisplay](vjs.CurrentTimeDisplay.md)
  - [DurationDisplay](vjs.DurationDisplay.md)
  - [Flash](vjs.Flash.md)
  - [FullscreenToggle](vjs.FullscreenToggle.md)
  - [Html5](vjs.Html5.md)
  - [LoadProgressBar](vjs.LoadProgressBar.md)
  - [LoadingSpinner](vjs.LoadingSpinner.md)
  - [MediaLoader](vjs.MediaLoader.md)
  - [MediaTechController](vjs.MediaTechController.md)
  - [Menu](vjs.Menu.md)
  - [MenuButton](vjs.MenuButton.md)
  - [MenuItem](vjs.MenuItem.md)
  - [MuteToggle](vjs.MuteToggle.md)
  - [OffTextTrackMenuItem](vjs.OffTextTrackMenuItem.md)
  - [PlayProgressBar](vjs.PlayProgressBar.md)
  - [PlayToggle](vjs.PlayToggle.md)
  - [Player](vjs.Player.md)
  - [PosterImage](vjs.PosterImage.md)
  - [ProgressControl](vjs.ProgressControl.md)
  - [RemainingTimeDisplay](vjs.RemainingTimeDisplay.md)
  - [SeekBar](vjs.SeekBar.md)
  - [SeekHandle](vjs.SeekHandle.md)
  - [Slider](vjs.Slider.md)
  - [SliderHandle](vjs.SliderHandle.md)
  - [SubtitlesButton](vjs.SubtitlesButton.md)
  - [SubtitlesTrack](vjs.SubtitlesTrack.md)
  - [TextTrack](vjs.TextTrack.md)
  - [TextTrackButton](vjs.TextTrackButton.md)
  - [TextTrackDisplay](vjs.TextTrackDisplay.md)
  - [TextTrackMenuItem](vjs.TextTrackMenuItem.md)
  - [TimeDivider](vjs.TimeDivider.md)
  - [VolumeBar](vjs.VolumeBar.md)
  - [VolumeControl](vjs.VolumeControl.md)
  - [VolumeHandle](vjs.VolumeHandle.md)
  - [VolumeLevel](vjs.VolumeLevel.md)
  - [VolumeMenuButton](vjs.VolumeMenuButton.md)

- [METHODS](#methods)
  - [plugin](#plugin-name-init-)

---

## PROPERTIES

### options
> Global Player instance options, surfaced from vjs.Player.prototype.options_
> vjs.options = vjs.Player.prototype.options_
> All options should use string keys so they avoid
> renaming by closure compiler

_defined in_: [src/js/core.js#L77](https://github.com/videojs/video.js/blob/master/src/js/core.js#L77)

---

### players
> Global player list

_defined in_: [src/js/core.js#L118](https://github.com/videojs/video.js/blob/master/src/js/core.js#L118)

---

## METHODS

### plugin( name, init )
> the method for registering a video.js plugin

##### PARAMETERS: 
* __name__ `String` The name of the plugin
* __init__ `Function` The function that is run when the player inits

_defined in_: [src/js/plugins.js#L7](https://github.com/videojs/video.js/blob/master/src/js/plugins.js#L7)

---

