Components
===
The Video.js player is built on top of a simple, custom UI components architecture. The player class and all control classes inherit from the `Component` class, or a subclass of `Component`.

```js
videojs.registerComponent('Control', videojs.extends(Component));
videojs.registerComponent('Button', videojs.extends(videojs.getComponent('Control')));
videojs.registerComponent('PlayToggle', videojs.extends(videojs.getComponent('Button')));
```

The UI component architecture makes it easier to add child components to a parent component and build up an entire user interface, like the controls for the Video.js player.

```js
// Adding a new control to the player
myPlayer.addChild('BigPlayButton');
```

Every component has an associated DOM element, and when you add a child component, it inserts the element of that child into the element of the parent.

```js
myPlayer.addChild('BigPlayButton');
```

Results in:

```html
    <!-- Player Element -->
    <div class="video-js">
      <!-- BigPlayButton Element -->
      <div class="vjs-big-play-button"></div>
    </div>
```

The actual default component structure of the Video.js player looks something like this:

```
Player
    PosterImage
    TextTrackDisplay
    LoadingSpinner
    BigPlayButton
    ControlBar
        PlayToggle
        VolumeMenuButton
        CurrentTimeDisplay (Hidden by default)
        TimeDivider (Hidden by default)
        DurationDisplay (Hidden by default)
        ProgressControl
            SeekBar
              LoadProgressBar
              MouseTimeDisplay
              PlayProgressBar
        LiveDisplay (Hidden by default)
        RemainingTimeDisplay
        CustomControlsSpacer (No UI)
        ChaptersButton (Hidden by default)
        SubtitlesButton (Hidden by default)
        CaptionsButton (Hidden by default)
        FullscreenToggle
    ErrorDisplay
    TextTrackSettings
```

## Progress Control
The progress control is made up of the SeekBar. The seekbar contains the load progress bar
and the play progress bar. In addition, it contains the Mouse Time Display which
is used to display the time tooltip that follows the mouse cursor.
The play progress bar also has a time tooltip that show the current time.

By default, the progress control is sandwiched between the volume menu button and
the remaining time display inside the control bar, but in some cases, a skin would
want to move the progress control above the control bar and have it span the full
width of the player, in those cases, it is less than ideal to have the tooltips
get cut off or leave the bounds of the player. This can be prevented by setting the
`keepTooltipsInside` option on the progress control. This also makes the tooltips use 
a real element instead of pseudo elements so targetting them with css will be different.

```js
let player = videojs('myplayer', {
  controlBar: {
    progressControl: {
      keepTooltipsInside: true
    }
  }
});
```
