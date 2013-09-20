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
  - [support](#support)

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
  - [cleanUpEvents](#cleanupevents-elem-type-)
  - [fixEvent](#fixevent-event-)
  - [off](#off-elem-type-fn-)
  - [on](#on-elem-type-fn-)
  - [one](#one-elem-type-fn-)
  - [plugin](#plugin-name-init-)
  - [trigger](#trigger-elem-event-)

- NAMESPACES
  - [obj](vjs.obj.md)

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

_defined in_: [src/js/core.js#L112](https://github.com/videojs/video.js/blob/master/src/js/core.js#L112)

---

### support
> Object to hold browser support information

_defined in_: [src/js/lib.js#L457](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L457)

---

## METHODS

### cleanUpEvents( elem, type )
> Clean up the listener cache and dispatchers

##### PARAMETERS: 
* __elem__ `Element|Object` Element to clean up
* __type__ `String` Type of event to clean up

_defined in_: [src/js/events.js#L118](https://github.com/videojs/video.js/blob/master/src/js/events.js#L118)

---

### fixEvent( event )
> Fix a native event to have standard property values

##### PARAMETERS: 
* __event__ `Object` Event object to fix

##### RETURNS: 
* `Object` 

_defined in_: [src/js/events.js#L157](https://github.com/videojs/video.js/blob/master/src/js/events.js#L157)

---

### off( elem, [type], fn )
> Removes event listeners from an element

##### PARAMETERS: 
* __elem__ `Element|Object` Object to remove listeners from
* __type__ `String` _(OPTIONAL)_ Type of listener to remove. Don't include to remove all events from element.
* __fn__ `Function` Specific listener to remove. Don't incldue to remove listeners for an event type.

_defined in_: [src/js/events.js#L69](https://github.com/videojs/video.js/blob/master/src/js/events.js#L69)

---

### on( elem, type, fn )
> Add an event listener to element
> It stores the handler function in a separate cache object
> and adds a generic handler to the element's event,
> along with a unique id (guid) to the element.

##### PARAMETERS: 
* __elem__ `Element|Object` Element or object to bind listeners to
* __type__ `String` Type of event to bind to.
* __fn__ `Function` Event listener.

_defined in_: [src/js/events.js#L17](https://github.com/videojs/video.js/blob/master/src/js/events.js#L17)

---

### one( elem, type, fn )
> Trigger a listener only once for an event

##### PARAMETERS: 
* __elem__ `Element|Object` Element or object to
* __type__ `[type]` [description]
* __fn__ `Function` [description]

##### RETURNS: 
* `[type]` 

_defined in_: [src/js/events.js#L332](https://github.com/videojs/video.js/blob/master/src/js/events.js#L332)

---

### plugin( name, init )
> the method for registering a video.js plugin

##### PARAMETERS: 
* __name__ `String` The name of the plugin
* __init__ `Function` The function that is run when the player inits

_defined in_: [src/js/plugins.js#L7](https://github.com/videojs/video.js/blob/master/src/js/plugins.js#L7)

---

### trigger( elem, event )
> Trigger an event for an element

##### PARAMETERS: 
* __elem__ `Element|Object` Element to trigger an event on
* __event__ `String` Type of event to trigger

_defined in_: [src/js/events.js#L259](https://github.com/videojs/video.js/blob/master/src/js/events.js#L259)

---

