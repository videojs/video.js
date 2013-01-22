Components
===
The Video.js player is built on top of a simple, custom UI components architecture. The player class and all control classes inherit from the Component class, or a subclass of Component.

```js
_V_.Control = _V_.Component.extend({});
_V_.Button = _V_.Control.extend({});
_V_.PlayToggle = _V_.Button.extend({});
```

(The Class interface itself is provided using John Resig's [simple class inheritance](http://ejohn.org/blog/simple-javascript-inheritance/) also found in [JSNinja](http://jsninja.com).

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

Component Methods
-----------------

### addChild() ###
Add a child component to myComponent. This will also insert the child component's DOM element into myComponent's element.



```js
myComponent.addChild('');
```


myPlayer.addChild('BigPlayButton');
myPlayer.removeChild('BigPlayButton');
myPlayer.getChild('BiPlayButton');
myPlayer.children();


myPlayer.getChildById('biPlayButton');
myPlayer.removeChildById('my-player-big-play-button');

el();
getContentEl();
getChildren();

getParent();

#home_player_big-play-button
