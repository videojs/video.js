# Player Workflows

This document outlines many considerations for using Video.js for advanced player workflows. Be sure to read [the setup guide](setup.md) first!

## Table of Contents

* [Accessing a player that has already been created on a page](#accessing-a-player-that-has-already-been-created-on-a-page)
* [Removing Players](#removing-players)
  * [dispose()](#dispose)
  * [Signs of an Undisposed Player](#signs-of-an-undisposed-player)
* [Showing and Hiding a Player](#showing-and-hiding-a-player)
* [Changing the volume of a player](#changing-the-volume-of-a-player)
* [Making the player fullscreen](#making-the-player-fullscreen)
* [Using Playback information functions](#using-playback-information-functions)
* [Dealing with the source or the poster on the player](#dealing-with-the-source-or-the-poster-on-the-player)
* [Accesing the Tech on the player](#accesing-the-tech-on-the-player)
* [Using Video.js with...](#using-videojs-with)
  * [jQuery](#jquery)
  * [React](#react)
  * [Ember](#ember)
  * [Angular](#angular)

## Accessing a player that has already been created on a page

After an instance has been created it can be accessed globally in two ways:

1. By calling `videojs('example_video_id');`
1. By using it directly via  `videojs.players.example_video_id;`

## Removing Players

No matter the term used for it, web applications are becoming common. Not everything is a static, load-once-and-done web page anymore! This means that developers need to be able to manage the full lifecycle of a video player - from creation to destruction. Video.js supports player removal through the `dispose()` method.

### [`dispose()`](http://docs.videojs.com/docs/api/player.html#Methodsdispose)

This method is available on all Video.js players and [components](http://docs.videojs.com/docs/api/component.html#Methodsdispose). It is _the only_ supported method of removing a Video.js player from both the DOM and memory. For example, the following code sets up a player and then disposes it when media playback is complete:

```js
var player = videojs('my-player');

player.on('ended', function() {
  this.dispose();
});
```

Calling `dispose()` will have a few effects:

1. Trigger a `"dispose"` event on the player, allowing for any custom cleanup tasks that need to be run by your integration.
1. Remove all event listeners from the player.
1. Remove the player's DOM element(s).

Additionally, these actions are recursively applied to _all_ the player's child components.

> **Note**: Do _not_ remove players via standard DOM removal methods: this will leave listeners and other objects in memory that you might not be able to clean up!

### Signs of an Undisposed Player

Seeing an error such as:

```console
TypeError: this.el_.vjs_getProperty is not a function
```

or

```console
TypeError: Cannot read property 'vdata1234567890' of null
```

Suggests that a player or component was removed from the DOM without using `dispose()`. It usually means something tried to trigger an event on it or call a method on it.

## Showing and Hiding a Player

It is not recommended that you attempt to toggle the visibility or display of a Video.js player. Doing so can be particularly problematic when it comes to the Flash tech. Instead, players should be created and [disposed](#removing-players) as needed.

This is relevant to use cases such as displaying a player in a modal/overlay. Rather than keeping a hidden Video.js player in a DOM element, it's recommended that you create the player when the modal opens and dispose it when the modal closes.

This is particularly relevant where memory/resource usage is concerned (e.g. mobile devices).

Depending on the libraries/frameworks in use, an implementation might look something like this:

```js
modal.on('show', function() {
  var videoEl = modal.findEl('video');
  modal.player = videojs(videoEl);
});

modal.on('hide', function() {
  modal.player.dispose();
});
```

## Changing the volume of a player

Volume for a player can be changed through the `volume` function on a player. The volume function accepts a number from 0-1. Calling it without an argument will return the current volume.

Example

```js
var myPlayer = videojs('some-player-id');

myPlayer.src("http://www.example.com/path/to/video.mp4");
myPlayer.ready(function() {
  // get
  var howLoudIsIt = myPlayer.volume();
  // set
  myPlayer.volume(0.5); // Set volume to half
});
```

Volume can also be muted (without actually changing the volume value) using the `muted` function. Calling it without an argument will return the current status of muted on the player.

```js
var myPlayer = videojs('some-player-id');

myPlayer.src("http://www.example.com/path/to/video.mp4");
myPlayer.ready(function() {
  // get, should be false
  console.log(myPlayer.muted());
  // set to true
  myPlayer.muted(true);
  // get should be true
  console.log(myPlayer.muted());
});
```

## Making the player fullscreen

To check if the player is currently fullscreen call the `isFullscreen` function on a player like so.

```js
var myPlayer = videojs('some-player-id');

myPlayer.src("http://www.example.com/path/to/video.mp4");
myPlayer.ready(function() {
  // get, should be false
  console.log(myPlayer.isFullscreen());

  // set, tell the player it's in fullscreen
  myPlayer.isFullscreen(true);

  // get, should be true
  console.log(myPlayer.isFullscreen());
});
```

To request that the player enter fullscreen call `requestFullscreen`.

```js
var myPlayer = videojs('some-player-id');

myPlayer.src("http://www.example.com/path/to/video.mp4");
myPlayer.ready(function() {
  myPlayer.requestFullscreen();
});
```

To exit fullscreen call `exitFullscreen`

```js
var myPlayer = videojs('some-player-id');

myPlayer.src("http://www.example.com/path/to/video.mp4");
myPlayer.ready(function() {
  myPlayer.requestFullscreen();
  myPlayer.exitFullscreen();
});
```

## Using Playback information functions

`play` can be used to start playback on a player that has a source.

```js
var myPlayer = videojs('some-player-id');

myPlayer.src("http://www.example.com/path/to/video.mp4");
myPlayer.ready(function() {
  myPlayer.play();
});
```

`pause` can be used to pause playback on a player that is playing.

```js
var myPlayer = videojs('some-player-id');

myPlayer.src("http://www.example.com/path/to/video.mp4");
myPlayer.ready(function() {
  myPlayer.play();
  myPlayer.pause();
});
```

`paused` can be used to determine if a player is currently paused.

```js
var myPlayer = videojs('some-player-id');

myPlayer.src("http://www.example.com/path/to/video.mp4");

myPlayer.ready(function() {
  // true
  console.log(myPlayer.paused());
  // false
  console.log(!myPlayer.paused());

  myPlayer.play();
  // false
  console.log(myPlayer.paused());
  // true
  console.log(!myPlayer.paused());

  myPlayer.pause();
  // true
  console.log(myPlayer.paused());
  // false
  console.log(!myPlayer.paused());
});
```

`currentTime` will give you the currentTime (in seconds) that playback is currently occuring at.

```js
var myPlayer = videojs('some-player-id');

myPlayer.src("http://www.example.com/path/to/video.mp4");
myPlayer.ready(function() {
  // set current time to 2 minutes into the video
  myPlayer.currentTime(120);

  // get the current time, should be 120 seconds
  var whereYouAt = myPlayer.currentTime();
});
```

`duration` will give you the total duration of the video that is playing

```js
var myPlayer = videojs('some-player-id');

myPlayer.src("http://www.example.com/path/to/video.mp4");
myPlayer.ready(function() {
  var lengthOfVideo = myPlayer.duration();
});
```

`remainingTime` will give you the seconds that are remaing in the video.

```js
var myPlayer = videojs('some-player-id');
myPlayer.src("http://www.example.com/path/to/video.mp4");
myPlayer.ready(function() {
   myPlayer.currentTime(10);

   // should be 10 seconds less than duration
   console.log(myPlayer.remainingTime());
});
```

`buffered` will give you a timeRange object representing the current ranges of time that are ready to be played at a future time.

```js
var myPlayer = videojs('some-player-id');

myPlayer.src("http://www.example.com/path/to/video.mp4");
myPlayer.ready(function() {
  var bufferedTimeRange = myPlayer.buffered();

  // number of different ranges of time have been buffered.
  // Usually 1
  var numberOfRanges = bufferedTimeRange.length,

  // Time in seconds when the first range starts.
  // Usually 0
  var firstRangeStart = bufferedTimeRange.start(0),

  // Time in seconds when the first range ends
  var firstRangeEnd = bufferedTimeRange.end(0),

  // Length in seconds of the first time range
  var firstRangeLength = firstRangeEnd - firstRangeStart;
});
```

`bufferedPercent` will give you the the current percentage of the video that is buffered.

```js
var myPlayer = videojs('some-player-id');

myPlayer.src("http://www.example.com/path/to/video.mp4");
myPlayer.ready(function() {
  // example 0.11 aka 11%
  var howMuchIsDownloaded = myPlayer.bufferedPercent();
});
```

## Dealing with the source or the poster on the player

Passing a source to the player via the API. (this can also be done using options)

```js
var myPlayer = videojs('some-player-id');

myPlayer.src("http://www.example.com/path/to/video.mp4");
```

**Source Object (or element):** A javascript object containing information
about the source file. Use this method if you want the player to determine if
it can support the file using the type information.

```js
var myPlayer = videojs('some-player-id');

myPlayer.src({type: "video/mp4", src: "http://www.example.com/path/to/video.mp4"});
```

**Array of Source Objects:** To provide multiple versions of the source so
that it can be played using HTML5 across browsers you can use an array of
source objects. Video.js will detect which version is supported and load that
file.

```js
var myPlayer = videojs('some-player-id');

myPlayer.src([
  {type: "video/mp4", src: "http://www.example.com/path/to/video.mp4"},
  {type: "video/webm", src: "http://www.example.com/path/to/video.webm"},
  {type: "video/ogg", src: "http://www.example.com/path/to/video.ogv"}
]);
```

Changing or setting the poster via the API. (this can also be done with options)

```js
var myPlayer = videojs('example_video_1');

// set
myPlayer.poster('http://example.com/myImage.jpg');

// get
console.log(myPlayer.poster());
// 'http://example.com/myImage.jpg'
```

## Accesing the Tech on the player

The tech on the player can only be accesed by pasing `{IWillNotUseThisInPlugins: true}` into the `tech()`
function on the player.

```js
var myPlayer = videojs('some-player-id');

myPlayer.src("http://www.example.com/path/to/video.mp4");
myPlayer.ready(function() {
   // function call throws an error if we
    // dont add {IWillNotUseThisInPlugins: true}
   var tech = myPlayer.tech({IWillNotUseThisInPlugins: true});
});
```

## Using Video.js with...

Coming soon...

### jQuery

### React

### Ember

### Angular
