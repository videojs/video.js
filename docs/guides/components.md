# Components
The architecture of the Video.js player is centered around components. The `Player` class and all classes representing player controls and other UI elements inherit from the `Component` class. This architecture makes it easy to construct the user interface of the Video.js player in a tree-like structure that mirrors the DOM.

## What is a Component?
A component is a JavaScript object that has the following features:

- An associated DOM element.
- An association to a `Player` object.
- The ability to manage any number of child components.
- The ability to listen for and trigger events.
- A lifecycle of initialization and disposal.

For more specifics on the programmatic interface of a component, see [the component API docs](http://docs.videojs.com/docs/api/component.html).

## Creating a Component
Video.js components can be inherited and registered with Video.js to add new features and UI to the player.

For a working example, [we have a JSBin](http://jsbin.com/vobacas/edit?html,css,js,output) demonstrating the creation of a component for displaying a title across the top of the player.

In addition, there are a couple methods worth recognizing:

- `videojs.getComponent(String name)`: Retrieves component constructors from Video.js.
- `videojs.registerComponent(String name, Function Comp)`: Registers component constructors with Video.js.
- `videojs.extend(Function component, Object properties)`: Provides prototype inheritance. Can be used to extend a component's constructor, returning a new constructor with the given properties.

## Component Children
When child component is added to a parent component, Video.js inserts the element of the child into the element of the parent. For example, adding a component like this:

```js
// Add a "BigPlayButton" component to the player. Its element will be appended to the player's element.
player.addChild('BigPlayButton');
```

Results in a DOM that looks like this:

```html
<!-- Player Element -->
<div class="video-js">
  <!-- BigPlayButton Element -->
  <div class="vjs-big-play-button"></div>
</div>
```

Conversely, removing child components will remove the child component's element from the DOM:

```js
player.removeChild('BigPlayButton');
```

Results in a DOM that looks like this:

```html
<!-- Player Element -->
<div class="video-js">
</div>
```

Again, refer to [the component API docs](http://docs.videojs.com/docs/api/component.html) for complete details on methods available for managing component structures.

## Default Component Tree
The default component structure of the Video.js player looks something like this:

```
Player
├── PosterImage
├── TextTrackDisplay
├── LoadingSpinner
├── BigPlayButton
├─┬ ControlBar
│ ├── PlayToggle
│ ├── VolumeMenuButton
│ ├── CurrentTimeDisplay (hidden by default)
│ ├── TimeDivider (hidden by default)
│ ├── DurationDisplay (hidden by default)
│ ├─┬ ProgressControl (hidden during live playback)
│ │ └─┬ SeekBar
│ │   ├── LoadProgressBar
│ │   ├── MouseTimeDisplay
│ │   └── PlayProgressBar
│ ├── LiveDisplay (hidden during VOD playback)
│ ├── RemainingTimeDisplay
│ ├── CustomControlSpacer (has no UI)
│ ├── PlaybackRateMenuButton (hidden, unless playback tech supports rate changes)
│ ├── ChaptersButton (hidden, unless there are relevant tracks)
│ ├── DescriptionsButton (hidden, unless there are relevant tracks)
│ ├── SubtitlesButton (hidden, unless there are relevant tracks)
│ ├── CaptionsButton (hidden, unless there are relevant tracks)
│ ├── AudioTrackButton (hidden, unless there are relevant tracks)
│ └── FullscreenToggle
├── ErrorDisplay (hidden, until there is an error)
└── TextTrackSettings
```

## Specific Component Details
### Progress Control
The progress control has a grandchild component, the mouse time display, which shows a time tooltip that follows the mouse cursor.

By default, the progress control is sandwiched inside the control bar between the volume menu button and the remaining time display. Some skins attempt to move the it above the control bar and have it span the full width of the player. In these cases, it is less than ideal to have the tooltips leave the bounds of the player. This can be prevented by setting the `keepTooltipsInside` option on the progress control.

```js
let player = videojs('myplayer', {
  controlBar: {
    progressControl: {
      keepTooltipsInside: true
    }
  }
});
```

> **Note:** This makes the tooltips use a real element instead of pseudo-elements so targeting them with CSS is different.

### Text Track Settings
The text track settings component is only available when using emulated text tracks.
