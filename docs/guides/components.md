# Components

The architecture of the Video.js player is centered around components. The `Player` class and all classes representing player controls and other UI elements inherit from the `Component` class. This architecture makes it easy to construct the user interface of the Video.js player in a tree-like structure that mirrors the DOM.

## Table of Contents

* [What is a Component?](#what-is-a-component)
* [Creating a Component](#creating-a-component)
* [Component Children](#component-children)
  * [Basic Example](#basic-example)
  * [Using Options](#using-options)
* [Event Listening](#event-listening)
  * [using on](#using-on)
  * [Using off](#using-off)
  * [Using one](#using-one)
  * [Using trigger](#using-trigger)
* [Default Component Tree](#default-component-tree)
* [Specific Component Details](#specific-component-details)
  * [Progress Control](#progress-control)
  * [Text Track Settings](#text-track-settings)

## What is a Component?

A component is a JavaScript object that has the following features:

* An associated DOM element.
* An association to a `Player` object.
* The ability to manage any number of child components.
* The ability to listen for and trigger events.
* A lifecycle of initialization and disposal.

For more specifics on the programmatic interface of a component, see [the component API docs](http://docs.videojs.com/docs/api/component.html).

## Creating a Component

Video.js components can be inherited and registered with Video.js to add new features and UI to the player.

For a working example, [we have a JSBin](http://jsbin.com/vobacas/edit?html,css,js,output) demonstrating the creation of a component for displaying a title across the top of the player.

In addition, there are a couple methods worth recognizing:

* `videojs.getComponent(String name)`: Retrieves component constructors from Video.js.
* `videojs.registerComponent(String name, Function Comp)`: Registers component constructors with Video.js.
* `videojs.extend(Function component, Object properties)`: Provides prototype inheritance. Can be used to extend a component's constructor, returning a new constructor with the given properties.

Creation:

```js
// adding a button to the player
var player = videojs('some-video-id');
var Component = videojs.getComponent('Component');
var button = new Component(player);

console.log(button.el());
```

The above code will output

```html
<div class="video-js">
  <div class="vjs-button">Button</div>
</div>
```

Adding the new button to the player

```js
// adding a button to the player
var player = videojs('some-video-id');
var button = player.addChild('button');

console.log(button.el());
// will have the same html result as the previous example
```

## Component Children

Again, refer to [the component API docs](http://docs.videojs.com/docs/api/component.html) for complete details on methods available for managing component structures.

### Basic Example

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

### Using Options

Pass in options for child constructors and options for children of the child.

```js
var player = videojs('some-vid-id');
var Component = videojs.getComponent('Component');
var myComponent = new Component(player);
var myButton = myComponent.addChild('MyButton', {
  text: 'Press Me',
  buttonChildExample: {
    buttonChildOption: true
  }
});
```

Children can also be added via options when a component is initialized.

> Note: Include a 'name' key which will be used if two child components of the same
>       type that need different options.

```js
// MyComponent is from the above example
var myComp = new MyComponent(player, {
  children: ['button', {
    name: 'button',
    someOtherOption: true
  }, {
    name: 'button',
    someOtherOption: false
  }]
});
```

## Event Listening

### Using `on`

```js
var player = videojs('some-player-id');
var Component = videojs.getComponent('Component');
var myComponent = new Component(player);
var myFunc = function() {
  var myComponent = this;
  console.log('myFunc called');
};

myComponent.on('eventType', myFunc);
myComponent.trigger('eventType');
// logs 'myFunc called'
```

The context of `myFunc` will be `myComponent` unless it is bound. You can add
a listener to another element or component.

```js
var otherComponent = new Component(player);

// myComponent/myFunc is from the above example
myComponent.on(otherComponent.el(), 'eventName', myFunc);
myComponent.on(otherComponent, 'eventName', myFunc);

otherComponent.trigger('eventName');
// logs 'myFunc called' twice
```

### Using `off`

```js
var player = videojs('some-player-id');
var Component = videojs.getComponent('Component');
var myComponent = new Component(player);
var myFunc = function() {
  var myComponent = this;
  console.log('myFunc called');
};
myComponent.on('eventType', myFunc);
myComponent.trigger('eventType');
// logs 'myFunc called'

myComponent.off('eventType', myFunc);
myComponent.trigger('eventType');
// does nothing
```

If myFunc gets excluded, *all* listeners for the event type will get removed. If
eventType gets excluded, *all* listeners will get removed from the component.
You can use `off` to remove listeners that get added to other elements or
components using:

 `myComponent.on(otherComponent...`

In this case both the event type and listener function are **REQUIRED**.

```js
var otherComponent = new Component(player);

// myComponent/myFunc is from the above example
myComponent.on(otherComponent.el(), 'eventName', myFunc);
myComponent.on(otherComponent, 'eventName', myFunc);

otherComponent.trigger('eventName');
// logs 'myFunc called' twice
myComponent.off(ootherComponent.el(), 'eventName', myFunc);
myComponent.off(otherComponent, 'eventName', myFunc);
otherComponent.trigger('eventName');
// does nothing
```

### Using `one`

```js
var player = videojs('some-player-id');
var Component = videojs.getComponent('Component');
var myComponent = new Component(player);
var myFunc = function() {
  var myComponent = this;
  console.log('myFunc called');
};
myComponent.one('eventName', myFunc);
myComponent.trigger('eventName');
// logs 'myFunc called'

myComponent.trigger('eventName');
// does nothing
```

You can also add a listener to another element or component that will get
triggered only once.

```js
var otherComponent = new Component(player);

// myComponent/myFunc is from the above example
myComponent.one(otherComponent.el(), 'eventName', myFunc);
myComponent.one(otherComponent, 'eventName', myFunc);

otherComponent.trigger('eventName');
// logs 'myFunc called' twice

otherComponent.trigger('eventName');
// does nothing
```

### Using `trigger`

```js
var player = videojs('some-player-id');
var Component = videojs.getComponent('Component');
var myComponent = new Component(player);
var myFunc = function(data) {
  var myComponent = this;
  console.log('myFunc called');
  console.log(data);
};
myComponent.one('eventName', myFunc);
myComponent.trigger('eventName');
// logs 'myFunc called' and 'undefined'

myComponent.trigger({'type':'eventName'});
// logs 'myFunc called' and 'undefined'

myComponent.trigger('eventName', {data: 'some data'});
// logs 'myFunc called' and "{data: 'some data'}"

myComponent.trigger({'type':'eventName'}, {data: 'some data'});
// logs 'myFunc called' and "{data: 'some data'}"
```

## Default Component Tree

The default component structure of the Video.js player looks something like this:

```tree
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
