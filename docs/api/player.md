<!--
Start src/js/player.js

GENERATED FROM SOURCE
if you edit this doc directly your changes will be lost
-->

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

---

## INDEX

- [METHODS](#methods)
  - [init](#inittag-options-ready)
  - [play](#play)
  - [poster](#postersrc)
  - [controls](#controlscontrols)
  - [usingNativeControls](#usingnativecontrolsbool)

## METHODS

### init(tag, options, ready)
player's constructor function

##### PARAMETERS:
* __tag__ `Element` The original video tag used for configuring options
* __options__ `Object` _(Optional)_ Player options
* __ready__ `Function` _(Optional)_ Ready callback function

---

### play()
start media playback

##### EXAMPLE:

```js
  myPlayer.play();
```

##### RETURNS:
* `vjs.Player` self

---

### poster([src])
get or set the poster image source url

##### EXAMPLE:

    // getting
    var currentPoster = myPlayer.poster();

    // setting
    myPlayer.poster('http://example.com/myImage.jpg');

##### PARAMETERS:
* __src__ `String` _(Optional)_ Poster image source URL

##### RETURNS:
* `String` poster URL when getting
* `vjs.Player` self when setting

---

### controls(controls)
Get or set whether or not the controls are showing.

##### PARAMETERS:
* __controls__ `Boolean` Set controls to showing or not

##### RETURNS:
* `Boolean` Controls are showing

---

### usingNativeControls(bool)
Toggle native controls on/off. Native controls are the controls built into
devices (e.g. default iPhone controls), Flash, or other techs
(e.g. Vimeo Controls)

**This should only be set by the current tech, because only the tech knows
if it can support native controls**

##### PARAMETERS:
* __bool__ `Boolean` True signals that native controls are on

##### RETURNS:
* `vjs.Player` Returns the player

---

<!-- End src/js/player.js -->

