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
        FullscreenToggle
        CurrentTimeDisplay
        TimeDivider
        DurationDisplay
        RemainingTimeDisplay
        ProgressControl
            SeekBar
              LoadProgressBar
              PlayProgressBar
              SeekHandle
        VolumeControl
            VolumeBar
                VolumeLevel
                VolumeHandle
        MuteToggle
```
