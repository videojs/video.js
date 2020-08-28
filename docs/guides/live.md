# The live user interface and API in Video.js

> Note the "old" live user interface is currently the default, see the section on [the new user interface](#the-new-user-interface) for information on setting that up.

## The default live user interface

The default user interface hides the `ProgressControl` component on the controlbar and shows the `LiveDisplay` component when Video.js detects that the video that it is playing is live (via a `durationchange` event).

> Note: It does this by adding the `vjs-live` class to the player and the showing/hiding of components is all handled in css.

This makes the player have to hide the progress bar, seek bar, and display text indicating that the player is live. All of those will be shown again if a non-live video is switched to (via another `durationchange` event).

To view a sample of this user interface please:

1. clone the repository, and move into that directory
1. run `npm install` or `npm ci` to install all necessary packages
1. run `npm start` to start the local server
1. open `http://localhost:9999/sandbox/live.html` in a web browser

## The new user interface

> Note: This user interface will not work on Android due to the native live HLS implementation not supporting seekable ranges during live streams. We recommend overriding the native hls implementation with @videojs/http-streaming; this will make the new liveui work.

The new user interface is currently opt-in to prevent breaking backwards compatibility. We feel that the new user interface is much better and it will likely become the new default in the next major version. If you want to use the new user interface you will have to pass `{liveui: true}` during player setup. This can be done in two ways:

Using `data-setup`

```html
  <video-js data-setup='{"liveui": true}'>
  </video-js>
```

Using the `videojs` function

```js
var player = videojs('some-player-id', {liveui: true});
```

The new user interface shows the `ProgressControl` component on the control bar, hides the `LiveDisplay` component, and shows the new `SeekToLive` component when Video.js detects that the video that it is playing is live (via a `durationchange` event). Along with the `ProgressControl` update we also updated all the time tooltips on the player to indicate a negative number from the live current time, rather than seeking to a specific time.

> Note: It does this by adding the `vjs-live` and `vjs-liveui` class to the player and the showing/hiding of components is all handled in css.

The new live user interface shows the progress/seek bar and lets the user seek backwards/forwards within the live window. Next, it adds a button, via the `SeekToLive` component that can be clicked when the user is behind live that will seek to the live current time. That same button indicates if the `currentTime` of the player is live via a grey circle when not live and a red circle when live.

To view a sample of this user interface please:

1. clone the repository, and move into that directory
1. run `npm install` or `npm ci` to install all necessary packages
1. run `npm start` to start the local server
1. open `http://localhost:9999/sandbox/liveui.html` in a web browser

## LiveTracker

> Note: this component can be turned off by passing `liveTracker: false` to the player during initialization.

Along with the new liveui we implemented an API that can be used regardless of which user interface is in use. This API is a child of the player and should be on the player at `player.liveTracker`. `LiveTracker` provides several useful helper functions and events for dealing with live playback, all of which are used and tested internally. Internally this component keeps track of the live current time through a function that runs on a 30ms interval.

### The seekableendchange event

The live tracker will fire this event every time that the `seekableEnd` for the player changes. This is used internally to keep our `pastSeekEnd()` function up to date.

### The liveedgechange event

As the name implies the live tracker will fire this event when it detects that the current time is no longer at the live edge.

### startTracking() and stopTracking()

These functions can be called to arbitrarily start/stop tracking live playback. Normally these are handled by automatically when the player triggers a `durationchange` with a duration of `Infinity`. You won't want to call them unless you are doing something fairly specific.

### seekableEnd()

seekableEnd gets the time in seconds of the furthest seekable end. For instance if we have an array of seekable `TimeRanges` where the first element in the array is the `start()` second and the last is the `end()` second:

```js
// seekable index 0: 0 is start, 1 is end
// seekable index 1: 2 is the start, 3 is the end
const seekableExample = [[0, 1], [2, 3]];
```

seekableEnd would return `3` as that is the furthest seekable point for the current media.

> Note: that if Infinity is anywhere in seekable end, this will return Infinity

### seekableStart()

seekableStart gets the time in seconds of the earliest seekable start. For instance if we have an array of seekable `TimeRanges` where the first element in the array is the `start()` second and the last is the `end()` second:

```js
// seekable index 0: 0 is start, 1 is end
// seekable index 1: 2 is the start, 3 is the end
const seekableExample = [[0, 1], [2, 3]];
```

seekableStart would return `0` as that is the first seekable point for the current media.

> Note: that if Infinity is anywhere in seekable start, this will return Infinity

### liveWindow()

This function gets the amount of time between the `seekableStart()` and the `liveCurrentTime()`. We use this internally to update the total length of our bars, such as the progress/seek bar.

### atLiveEdge() and behindLiveEdge()

Determines if the currentTime of the player is close enough to live to be considered live. We make sure it's close enough, rather than absolutely live, because there are too many factors to determine when live actually is. We consider the currentTime live when it is within two seekable increments and 70ms (two ticks of the live tracking interval). The seekable increment is a number that is determined by the amount that seekable end changes as playback continues. See the `seekableendchange` event and the `pastSeekEnd()` function for more info.

### liveCurrentTime()

live current time is our best approximation of what the live current time is. Internally it uses the `pastSeekEnd()` function and adds that to the `seekableEnd()` function. It is possible for this function to return `Infinity`.

### pastSeekEnd()

This is the main value that we use to track if the player is live or not. Every `30ms` we add `0.03` seconds to this value and every `seekableendchange` it is reset to 0 and `0.03` is added to it right away.

### isTracking() and isLive()

`isTracking` and `isLive` do the same thing they tell you if the `LiveTracker` is currently tracking live playback and since we assume that live tracking will only be done during live they should be the same.

### seekToLiveEdge()

This function sets the players `currentTime` to the result of the `liveCurrentTime()` function. It will also start playback if playback is currently paused. It starts playback because it is easy to fall behind the live edge if the player is not playing.
