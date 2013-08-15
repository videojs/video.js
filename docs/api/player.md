<!-- Start src/js/player.js -->

# vjs.Player

__EXTENDS__: [vjs.Component](component.md)  
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

Player instance options, surfaced using vjs.options
vjs.options = vjs.Player.prototype.options_
Make changes in vjs.options, not here.
All options should use string keys so they avoid
renaming by closure compiler

Fallbacks for unsupported event types
================================================================================

TODO: update for multiple buffered regions

Object for cached values.

The url of the poster image source.

Whether or not the controls are showing

## Index

 
* [Methods](#)

* * [init](#init)

* * [manualTimeUpdatesOn](#manualTimeUpdatesOn)

* * [play](#play)

* * [poster](#poster)

* * [controls](#controls)

* * [usingNativeControls](#usingNativeControls)

## Methods

## init(tag, options, ready)

player's constructor function

### Params: 

* **Element** *tag* The original video tag used for configuring options

* **Object=** *options* Player options

* **Function=** *ready* Ready callback function

## manualTimeUpdatesOn()

Time Tracking --------------------------------------------------------------

## play()

Start media playback
http://dev.w3.org/html5/spec/video.html#dom-media-play
We're triggering the 'play' event here instead of relying on the
media element to allow using event.preventDefault() to stop
play from happening if desired. Usecase: preroll ads.

## poster(src)

Get or set the poster image source url.

### Params: 

* **String** *src* Poster image source URL

### Return:

* **String** Poster image source URL or null

## controls(controls)

Get or set whether or not the controls are showing.

### Params: 

* **Boolean** *controls* Set controls to showing or not

### Return:

* **Boolean** Controls are showing

## usingNativeControls(bool)

Toggle native controls on/off. Native controls are the controls built into
devices (e.g. default iPhone controls), Flash, or other techs
(e.g. Vimeo Controls)

**This should only be set by the current tech, because only the tech knows
if it can support native controls**

### Params: 

* **Boolean** *bool* True signals that native controls are on

### Return:

* **vjs.Player** Returns the player

<!-- End src/js/player.js -->
