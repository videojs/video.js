<!-- Start src/js/player.js -->

# Video.Player

__EXTENDS__: [Video.Component](...)  
__DEFINED IN__: [src/js/player.js](https://github.com/videojs/video.js/blob/master/src/js/player.js)

An instance of the `Video.Player` class is created when any of the Video.js setup methods are used to initialize a video.

```js
var myPlayer = Video('example_video_1');
```

In the follwing example, the `data-setup` attribute tells the Video.js library to create a player instance when the library is ready.

```html
<video id="example_video_1" data-setup='{}' controls>
  <source src="my-source.mp4" type="video/mp4">
</video>
```

After an instance has been created it can be accessed globally using `Video('example_video_1')`.

## INDEX

- [Methods](#)
  - [Inherited methods >>](#)
  - [play](#play-videoplayer)
  - pause
  - paused
  - [currentTime](#currenttime-integer)
  - duration
  - remainingTime
  - buffered
  - bufferedPercent
  - volume
  - muted
  - requestFullScreen
  - cancelFullScreen
  - enterFullWindow
  - exitFullWindow
  - src
  - load
  - currentSrc
  - preload
  - autoplay
  - loop
  - poster
  - controls
  - error
  - ended

- [Events](#)
  - [Inherited events >>](#)
  - ready
  - dispose
  - play
  - pause
  - progress
  - timeupdate
  - loadstart
  - loadeddata
  - loadedmetadata
  - loadedalldata
  - fullscreenchange
  - controlsenabled
  - controlsdisabled
  - usingnativecontrols
  - usingcustomcontrols
  - useractive
  - userinactive

## METHODS

### play() `Video.Player`
start video playback

##### RETURNS:
`Video.Player` self

##### EXAMPLE:

```js
  myPlayer.play();
```

_defined in_: [src/js/player.js#123](https://github.com/videojs/video.js/blob/master/src/js/player.js#123)

---

### currentTime() `Integer`
the current time getter

##### RETURNS:
`Integer` the current time in seconds of the playhead

##### EXAMPLE:

```js
var secondsOfVideoWatched = myPlayer.currentTime();
```

_defined in_: [src/js/player.js#123](https://github.com/videojs/video.js/blob/master/src/js/player.js#123)

---

### currentTime(seconds) `Video.Player`

the current time setter

##### PARAMETERS:
- __seconds__ `Integer` desired time to seek to in seconds

##### RETURNS:
`Video.Player` self

##### EXAMPLE:

```js
  myPlayer.currentTime(120); // Seek to 2 minutes into the video
```

_defined in_: [src/js/player.js#123](https://github.com/videojs/video.js/blob/master/src/js/player.js#123)

---

## EVENTS

### play
fired when the the media begins playback

### pause 
fired when the media pauses playpack

### timeupdate 
fired continuously as the video plays, at an interval of between 15 and 250 milliseconds

---



